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
            // visibility: "hidden", // TODO replace with other optimization methods
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            minHeight: "100%",
            userSelect: "text",
          }}
        >
          {element}
        </div>
      );
    }

    return (
      <div
        ref={scrollRef}
        {...attrs}
        style={{
          display: horizontal ? "inline-block" : "block",
          [horizontal ? "overflowX" : "overflowY"]: "auto",
          contain: "strict",
          width: "100%",
          height: "100%",
          ...style,
        }}
      >
        {element}
      </div>
    );
  }
);