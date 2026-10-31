import { twMerge } from "tailwind-merge";

/** Joins class names; later Tailwind utilities win over conflicting earlier ones (e.g. `h-11` then `h-8`). */
export function cn(...classes: Array<string | false | null | undefined>) {
  return twMerge(classes.filter(Boolean).join(" "));
}
