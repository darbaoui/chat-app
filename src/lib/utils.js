import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import {
  formatDistanceToNow,
} from 'date-fns';
import { useEffect } from "react";

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}


export function fromNow(inputDate) {
  const date = new Date(inputDate); // Example date (July 22, 2023)
  const result = formatDistanceToNow(date, { addSuffix: true });
  return result;
}

export function useOnClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      // Do nothing if clicking ref's element or descendent elements
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}
