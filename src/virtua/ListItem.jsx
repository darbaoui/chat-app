import {
  memo,
  useRef,
  useMemo,
} from "react";
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";
import { refKey } from "./utils";
import { isRTLDocument } from "virtua/unstable_core";



/**
 * @internal
 */
export const ListItem = memo(
  ({
    _children: children,
    _resizer: resizer,
    _index: index,
    _offset: offset,
    _hide: hide,
    _as: Element,
    _isHorizontal: isHorizontal,
    _isSSR: isSSR,
  }) => {
    const ref = useRef(null);

    // The index may be changed if elements are inserted to or removed from the start of props.children
    useIsomorphicLayoutEffect(() => resizer(ref?.[refKey], index), [index]);

    // console.log('isSSR --->', isSSR, hide)
    const style = useMemo(() => {
      const style = {
        position: hide && isSSR ? undefined : "absolute",
        [isHorizontal ? "height" : "width"]: "100%",
        [isHorizontal ? "top" : "left"]: 0,
        [isHorizontal ? (isRTLDocument() ? "right" : "left") : "top"]: offset,
        visibility: !hide || isSSR ? "visible" : "hidden",
      };
      if (isHorizontal) {
        style.display = "flex";
      }
      return style;
    }, [offset, hide, isSSR, isHorizontal]);

    if (typeof Element === "string") {
      return (
        <Element ref={ref} style={style}>
          {children}
        </Element>
      );
    } else {
      return (
        <Element ref={ref} style={style} index={index}>
          {children}
        </Element>
      );
    }
  }
);
