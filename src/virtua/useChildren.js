import { useMemo } from "react";
import { flattenChildren } from "./utils";

/**
 * @internal
 */
export const useChildren = (
  children,
  count
) => {
  return useMemo(() => {
    if (typeof children === "function") {
      return [children, count || 0];
    }
    // Memoize element array
    const _elements = flattenChildren(children);
    return [(i) => _elements?.[i], _elements.length];
  }, [children, count]);
};
