import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names using clsx and tailwind-merge.
 * Used for conditional className composition with Tailwind CSS.
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
