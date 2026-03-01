/**
 * Shared utility functions for Plexus UI components
 *
 * All components should import utilities from this file
 * to avoid duplication and ensure consistency.
 */

export function cn(...classes: (string | undefined | null | false | 0)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Normalize date input (Date or timestamp) to Date object
 */
export function normalizeDate(date: Date | number): Date {
  return typeof date === "number" ? new Date(date) : date;
}

/**
 * Create array of numbers from start to end (inclusive)
 */
export function range(start: number, end: number, step: number = 1): number[] {
  const result: number[] = [];
  for (let i = start; i <= end; i += step) {
    result.push(i);
  }
  return result;
}
