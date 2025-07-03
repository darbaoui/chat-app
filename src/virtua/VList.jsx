import {  forwardRef, useRef } from "react";
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
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            minHeight: "100%",
            // Flip the container
            transform: "scaleY(-1)",
            // Ensure proper rendering
            transformOrigin: "center",
            // Prevent text selection issues
            userSelect: "none",
          }}
        >
           <div 
            style={{ 
                  // Flip content back to normal
                  transform: "scaleY(-1)",
                  // Re-enable text selection
                  userSelect: "auto",
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
          ...style,
        }}
      >
        {element}
      </div>
    );
  }
);