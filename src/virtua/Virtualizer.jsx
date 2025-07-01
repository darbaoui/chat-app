import {
  JSX,
  ReactElement,
  forwardRef,
  useImperativeHandle,
  ReactNode,
  useRef,
  RefObject,
  useReducer,
} from "react";

import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";
import { getKey, refKey } from "./utils";
import { useStatic } from "./useStatic";
import { useLatestRef } from "./useLatestRef";
import { ListItem } from "./ListItem";
import { flushSync } from "react-dom";

import { useChildren } from "./useChildren";
import {
  UPDATE_SCROLL_EVENT,
  ACTION_ITEMS_LENGTH_CHANGE,
  createVirtualStore,
  UPDATE_VIRTUAL_STATE,
  UPDATE_SCROLL_END_EVENT,
  getScrollSize,
  ACTION_START_OFFSET_CHANGE,
  createScroller,
  createResizer,
  CacheSnapshot,
  ScrollToIndexOpts,
  microtask,
  sort,
} from "virtua/unstable_core";
import { max } from "./utils";

const startIndexArray = [];

/**
 * Customizable list virtualizer for advanced usage. See {@link VirtualizerProps} and {@link VirtualizerHandle}.
 */
export const Virtualizer = forwardRef(
  (
    {
      children,
      count: renderCountProp,
      overscan,
      itemSize,
      shift,
      horizontal: horizontalProp,
      keepMounted,
      cache,
      startMargin = 0,
      ssrCount,
      as: Element = "div",
      item: ItemElement = "div",
      scrollRef,
      onScroll: onScrollProp,
      onScrollEnd: onScrollEndProp,
    },
    ref
  ) => {
    // Element = Element;

    const [getElement, count] = useChildren(children, renderCountProp);

    const containerRef = useRef(null);

    const isSSR = useRef(!!ssrCount);

    const onScroll = useLatestRef(onScrollProp);
    const onScrollEnd = useLatestRef(onScrollEndProp);

    const [store, resizer, scroller, isHorizontal] = useStatic(() => {
      const _isHorizontal = !!horizontalProp;
      const _store = createVirtualStore(
        count,
        itemSize,
        overscan,
        ssrCount,
        cache,
        !itemSize
      );
      return [
        _store,
        createResizer(_store, _isHorizontal),
        createScroller(_store, _isHorizontal),
        _isHorizontal,
      ];
    });

   
    // The elements length and cached items length are different just after element is added/removed.
    if (count !== store.$getItemsLength()) {
      store.$update(ACTION_ITEMS_LENGTH_CHANGE, [count, shift]);
    }
    if (startMargin !== store.$getStartSpacerSize()) {
      store.$update(ACTION_START_OFFSET_CHANGE, startMargin);
    }

    const [stateVersion, rerender] = useReducer(
      store.$getStateVersion,
      undefined,
      store.$getStateVersion
    );



    const oldStartIndex = useRef(null)
    const oldEndIndex = useRef()

 

    let [startIndex, endIndex] = store.$getRange();

    if(startIndex !== oldStartIndex.current)
    {
        oldStartIndex.current = startIndex
        startIndexArray.push(startIndex)
    }

    const minValue = Math.min(...startIndexArray);
    startIndex = minValue
    

    const isScrolling = store.$isScrolling();
    const totalSize = store.$getTotalSize();

    const items = [];

    const getListItem = (index) => {
      const e = getElement(index);

      return (
        <ListItem
          key={getKey(e, index)}
          _resizer={resizer.$observeItem}
          _index={index}
          _offset={store.$getItemOffset(index)}
          _hide={store.$isUnmeasuredItem(index)}
          _as={ItemElement}
          _children={e}
          _isHorizontal={isHorizontal}
          _isSSR={isSSR[refKey]}
        />
      );
    };

    useIsomorphicLayoutEffect(() => {
      isSSR[refKey] = false;

      // store must be subscribed first because others may dispatch update on init depending on implementation
      const unsubscribeStore = store.$subscribe(
        UPDATE_VIRTUAL_STATE,
        (sync) => {
          if (sync) {
            flushSync(rerender);
          } else {
            rerender();
          }
        }
      );
      const unsubscribeOnScroll = store.$subscribe(UPDATE_SCROLL_EVENT, () => {
        onScroll[refKey] && onScroll[refKey](store.$getScrollOffset());
      });
      const unsubscribeOnScrollEnd = store.$subscribe(
        UPDATE_SCROLL_END_EVENT,
        () => {
          onScrollEnd[refKey] && onScrollEnd[refKey]();
        }
      );
      const assignScrollableElement = (e) => {
        resizer.$observeRoot(e);
        scroller.$observe(e);
      };
      if (scrollRef) {
        // parent's ref doesn't exist when useLayoutEffect is called
        microtask(() => assignScrollableElement(scrollRef?.[refKey]));
      } else {
        assignScrollableElement(containerRef?.[refKey]?.parentElement);
      }

      return () => {
        unsubscribeStore();
        unsubscribeOnScroll();
        unsubscribeOnScrollEnd();
        resizer.$dispose();
        scroller.$dispose();
      };
    }, []);

    useIsomorphicLayoutEffect(() => {
      scroller.$fixScrollJump();
    }, [stateVersion]);

    useImperativeHandle(ref, () => {
      return {
        get cache() {
          return store.$getCacheSnapshot();
        },
        get scrollOffset() {
          return store.$getScrollOffset();
        },
        get scrollSize() {
          return getScrollSize(store);
        },
        get viewportSize() {
          return store.$getViewportSize();
        },
        findStartIndex: store.$findStartIndex,
        findEndIndex: store.$findEndIndex,
        getItemOffset: store.$getItemOffset,
        getItemSize: store.$getItemSize,
        scrollToIndex: scroller.$scrollToIndex,
        scrollTo: scroller.$scrollTo,
        scrollBy: scroller.$scrollBy,
      };
    }, []);

    for (let i = startIndex, j = endIndex; i <= j; i++) {
      items.push(getListItem(i));
    }

    if (keepMounted) {
      const startItems = [];
      const endItems = [];
      sort(keepMounted).forEach((index) => {
        if (index < startIndex) {
          startItems.push(getListItem(index));
        }
        if (index > endIndex) {
          endItems.push(getListItem(index));
        }
      });

      items.unshift(...startItems);
      items.push(...endItems);
    }

  
    // console.log('currentStartIndex -->',  startIndex, endIndex)
    

    return (
      <Element
        ref={containerRef}
        style={{
          // contain: "content",
          overflowAnchor: "none", // opt out browser's scroll anchoring because it will conflict to scroll anchoring of virtualizer
          flex: "none", // flex style can break layout
          position: "relative",
          visibility: "hidden", // TODO replace with other optimization methods
          width: isHorizontal ? totalSize : "100%",
          height: isHorizontal ? "100%" : totalSize,
          pointerEvents: isScrolling ? "none" : undefined,
        }}
      >
        {items}
      </Element>
    );
  }
);
