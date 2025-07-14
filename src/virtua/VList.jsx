import { forwardRef, useRef } from "react";
import { Virtualizer } from "@/virtua/Virtualizer";

export const VList = forwardRef(
  (
    {
      children,
      count,
      overscan,
      itemSize,
      shift,
      horizontal,
      keepMounted,
      reverse,
      cache,
      ssrCount,
      item,
      onScroll,
      onScrollEnd,
      style,
      ...attrs
    },
    ref
  ) => {
    const scrollRef = useRef(null);
    const shouldReverse = reverse && !horizontal;

    let element = (
      <Virtualizer
        ref={ref}
        scrollRef={shouldReverse ? scrollRef : undefined}
        count={count}
        overscan={overscan}
        itemSize={itemSize}
        shift={shift}
        horizontal={horizontal}
        keepMounted={keepMounted}
        cache={cache}
        ssrCount={ssrCount}
        item={item}
        onScroll={onScroll}
        onScrollEnd={onScrollEnd}
      >
        {children}
      </Virtualizer>
    );

    if (shouldReverse) {
      element = (
        <div
          style={{
            transform: "scaleY(-1)",
            height: "100%",
            // Re-enable text selection
            userSelect: "text",
          }}
        >
          <div
            style={{
              transform: "scaleY(-1)",
              // // Re-enable text selection
              userSelect: "text",
            }}
          >
            {element}
          </div>
        </div>
      );
    }

    return (
      <div
        ref={scrollRef}
        {...attrs}
        style={{
          minHeight: 0,
          overflowY: "auto",
          width: "100%",
          height: "100%",
          contain: "strict",
          // Add flex styles to the scroll container when reversed
          ...(shouldReverse && {
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }),
          ...style,
        }}
      >
        {element}
      </div>
    );
  }
);