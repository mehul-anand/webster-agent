import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function killWordBackward(value: string, cursor: number): [string, number] {
  const before = value.slice(0, cursor);
  const after = value.slice(cursor);
  let i = before.length - 1;
  while (i >= 0 && before[i] === " ") i--;
  while (i >= 0 && before[i] !== " ") i--;
  const newBefore = before.slice(0, i + 1);
  return [newBefore + after, newBefore.length];
}
