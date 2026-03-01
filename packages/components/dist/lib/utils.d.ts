/**
 * Shared utility functions for Plexus UI components
 *
 * All components should import utilities from this file
 * to avoid duplication and ensure consistency.
 */
export declare function cn(...classes: (string | undefined | null | false | 0)[]): string;
/**
 * Normalize date input (Date or timestamp) to Date object
 */
export declare function normalizeDate(date: Date | number): Date;
/**
 * Create array of numbers from start to end (inclusive)
 */
export declare function range(start: number, end: number, step?: number): number[];
//# sourceMappingURL=utils.d.ts.map