import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ComponentProps } from 'svelte';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export type WithElementRef<T extends Record<string, any> = Record<string, any>> = T & {
	ref?: HTMLElement | null;
};

export type WithoutChildren<T extends Record<string, any> = Record<string, any>> = Omit<T, 'children'>;


