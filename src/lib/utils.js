import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import {
  formatDistanceToNow,
} from 'date-fns';

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}


export function fromNow(inputDate) {
  const date = new Date(inputDate); // Example date (July 22, 2023)
  const result = formatDistanceToNow(date, { addSuffix: true });
  return result;
}
