/**
 * Timezone utility functions and types
 * Shared across all chart components for consistent time handling
 */
/**
 * Timezone configuration for charts and visualizations
 */
export interface TimezoneConfig {
    /**
     * IANA timezone identifier
     * @example "UTC", "America/New_York", "Europe/London"
     */
    timezone: string;
    /**
     * Use 12-hour time format instead of 24-hour
     * @default false
     */
    use12HourFormat: boolean;
    /**
     * Time window to display in hours
     * @example 4, 8, 12, 24
     */
    timeWindowHours?: number;
}
/**
 * Timezone option for select components
 */
export interface TimezoneOption {
    /** IANA timezone identifier */
    value: string;
    /** Display label */
    label: string;
    /** UTC offset string */
    offset: string;
    /** Region category */
    region: string;
}
/**
 * Time window preset
 */
export interface TimeWindowOption {
    /** Hours value */
    value: number;
    /** Display label */
    label: string;
}
/**
 * Format date in specified timezone with optional 12/24 hour format
 *
 * @param date - Date to format
 * @param timezone - IANA timezone identifier
 * @param use12Hour - Use 12-hour format if true, 24-hour if false
 * @returns Formatted time string
 *
 * @example
 * ```typescript
 * formatTimeInZone(new Date(), "America/New_York", true)  // "2:30 PM"
 * formatTimeInZone(new Date(), "Europe/London", false)    // "14:30"
 * ```
 */
export declare function formatTimeInZone(date: Date, timezone: string, use12Hour?: boolean): string;
/**
 * Format date with both date and time in specified timezone
 *
 * @param date - Date to format
 * @param timezone - IANA timezone identifier
 * @param use12Hour - Use 12-hour format if true
 * @returns Formatted date and time string
 *
 * @example
 * ```typescript
 * formatDateTimeInZone(new Date(), "UTC", false)
 * // "Jan 15, 2025 14:30"
 * ```
 */
export declare function formatDateTimeInZone(date: Date, timezone: string, use12Hour?: boolean): string;
/**
 * Format date only (no time) in specified timezone
 *
 * @param date - Date to format
 * @param timezone - IANA timezone identifier
 * @param format - Date format style
 * @returns Formatted date string
 */
export declare function formatDateInZone(date: Date, timezone: string, format?: "short" | "medium" | "long"): string;
/**
 * Get current UTC offset for a timezone in hours
 *
 * @param timezone - IANA timezone identifier
 * @param date - Optional date to check offset for (handles DST)
 * @returns Offset in hours from UTC
 *
 * @example
 * ```typescript
 * getTimezoneOffset("America/New_York")  // -5 (EST) or -4 (EDT)
 * getTimezoneOffset("Europe/London")     // 0 (GMT) or 1 (BST)
 * ```
 */
export declare function getTimezoneOffset(timezone: string, date?: Date): number;
/**
 * Format UTC offset as string
 *
 * @param offsetHours - Offset in hours from UTC
 * @returns Formatted offset string
 *
 * @example
 * ```typescript
 * formatOffset(-5)   // "UTC-5"
 * formatOffset(5.5)  // "UTC+5:30"
 * formatOffset(0)    // "UTC"
 * ```
 */
export declare function formatOffset(offsetHours: number): string;
/**
 * Convert date to different timezone
 * Returns a new Date object representing the same moment in time
 *
 * @param date - Date to convert
 * @param timezone - Target IANA timezone identifier
 * @returns New Date object
 */
export declare function convertToTimezone(date: Date, timezone: string): Date;
/**
 * Check if a timezone string is valid
 *
 * @param timezone - Timezone string to validate
 * @returns true if valid IANA timezone
 */
export declare function isValidTimezone(timezone: string): boolean;
/**
 * Get list of common timezones grouped by region
 * Includes major cities and UTC offsets
 *
 * @returns Array of timezone options
 */
export declare function getCommonTimezones(): TimezoneOption[];
/**
 * Get list of time window presets
 * Common durations for chart time windows
 *
 * @returns Array of time window options
 */
export declare function getTimeWindowOptions(): TimeWindowOption[];
/**
 * Get browser's current timezone
 *
 * @returns IANA timezone identifier
 *
 * @example
 * ```typescript
 * getBrowserTimezone()  // "America/New_York"
 * ```
 */
export declare function getBrowserTimezone(): string;
/**
 * Default timezone configuration
 */
export declare const DEFAULT_TIMEZONE_CONFIG: TimezoneConfig;
//# sourceMappingURL=timezone.d.ts.map