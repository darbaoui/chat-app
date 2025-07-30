import { useRef } from "react";
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";
import { refKey } from "./utils";

/**
 * @internal
 */
export const useLatestRef = (value) => {
  const ref = useRef(value);

  useIsomorphicLayoutEffect(() => {
    ref[refKey] = value;
  }, [value]);

  return ref;
};
