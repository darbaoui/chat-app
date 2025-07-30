import { useRef } from "react";
import { refKey } from "./utils";

/**
 * @internal
 */
export const useStatic = (init) => {
  const ref = useRef();
  return ref[refKey] || (ref[refKey] = init());
};
