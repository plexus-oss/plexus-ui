/**
 * Timezone utility functions and types
 * Shared across all chart components for consistent time handling
 */

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Core Timezone Functions
// ============================================================================

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
export function formatTimeInZone(date: Date, timezone: string, use12Hour: boolean = false): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: use12Hour,
  };
  return new Intl.DateTimeFormat("en-US", options).format(date);
}

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
export function formatDateTimeInZone(
  date: Date,
  timezone: string,
  use12Hour: boolean = false
): string {
  const dateOptions: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    month: "short",
    day: "numeric",
    year: "numeric",
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: use12Hour,
  };

  const dateStr = new Intl.DateTimeFormat("en-US", dateOptions).format(date);
  const timeStr = new Intl.DateTimeFormat("en-US", timeOptions).format(date);

  return `${dateStr} ${timeStr}`;
}

/**
 * Format date only (no time) in specified timezone
 *
 * @param date - Date to format
 * @param timezone - IANA timezone identifier
 * @param format - Date format style
 * @returns Formatted date string
 */
export function formatDateInZone(
  date: Date,
  timezone: string,
  format: "short" | "medium" | "long" = "medium"
): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    month: format === "short" ? "short" : "long",
    day: "numeric",
    year: format === "long" ? "numeric" : undefined,
  };

  return new Intl.DateTimeFormat("en-US", options).format(date);
}

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
export function getTimezoneOffset(timezone: string, date: Date = new Date()): number {
  // Create a date string in the target timezone
  const tzDate = new Date(date.toLocaleString("en-US", { timeZone: timezone }));

  // Get the UTC time
  const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));

  // Calculate offset in hours
  return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
}

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
export function formatOffset(offsetHours: number): string {
  if (offsetHours === 0) return "UTC";

  const sign = offsetHours > 0 ? "+" : "";
  const hours = Math.floor(Math.abs(offsetHours));
  const minutes = Math.abs((offsetHours % 1) * 60);

  if (minutes === 0) {
    return `UTC${sign}${offsetHours}`;
  }

  return `UTC${sign}${hours}:${minutes.toString().padStart(2, "0")}`;
}

/**
 * Convert date to different timezone
 * Returns a new Date object representing the same moment in time
 *
 * @param date - Date to convert
 * @param timezone - Target IANA timezone identifier
 * @returns New Date object
 */
export function convertToTimezone(date: Date, timezone: string): Date {
  const dateStr = date.toLocaleString("en-US", { timeZone: timezone });
  return new Date(dateStr);
}

/**
 * Check if a timezone string is valid
 *
 * @param timezone - Timezone string to validate
 * @returns true if valid IANA timezone
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Common Timezone Lists
// ============================================================================

/**
 * Get list of common timezones grouped by region
 * Includes major cities and UTC offsets
 *
 * @returns Array of timezone options
 */
export function getCommonTimezones(): TimezoneOption[] {
  const now = new Date();

  const timezones = [
    // UTC
    { value: "UTC", label: "UTC", region: "UTC" },

    // Americas
    { value: "America/New_York", label: "New York", region: "Americas" },
    { value: "America/Chicago", label: "Chicago", region: "Americas" },
    { value: "America/Denver", label: "Denver", region: "Americas" },
    { value: "America/Los_Angeles", label: "Los Angeles", region: "Americas" },
    { value: "America/Anchorage", label: "Anchorage", region: "Americas" },
    { value: "Pacific/Honolulu", label: "Honolulu", region: "Americas" },
    { value: "America/Toronto", label: "Toronto", region: "Americas" },
    { value: "America/Mexico_City", label: "Mexico City", region: "Americas" },
    { value: "America/Sao_Paulo", label: "São Paulo", region: "Americas" },
    {
      value: "America/Buenos_Aires",
      label: "Buenos Aires",
      region: "Americas",
    },

    // Europe
    { value: "Europe/London", label: "London", region: "Europe" },
    { value: "Europe/Paris", label: "Paris", region: "Europe" },
    { value: "Europe/Berlin", label: "Berlin", region: "Europe" },
    { value: "Europe/Rome", label: "Rome", region: "Europe" },
    { value: "Europe/Madrid", label: "Madrid", region: "Europe" },
    { value: "Europe/Amsterdam", label: "Amsterdam", region: "Europe" },
    { value: "Europe/Brussels", label: "Brussels", region: "Europe" },
    { value: "Europe/Vienna", label: "Vienna", region: "Europe" },
    { value: "Europe/Stockholm", label: "Stockholm", region: "Europe" },
    { value: "Europe/Moscow", label: "Moscow", region: "Europe" },

    // Asia
    { value: "Asia/Dubai", label: "Dubai", region: "Asia" },
    { value: "Asia/Kolkata", label: "Mumbai", region: "Asia" },
    { value: "Asia/Shanghai", label: "Shanghai", region: "Asia" },
    { value: "Asia/Hong_Kong", label: "Hong Kong", region: "Asia" },
    { value: "Asia/Tokyo", label: "Tokyo", region: "Asia" },
    { value: "Asia/Seoul", label: "Seoul", region: "Asia" },
    { value: "Asia/Singapore", label: "Singapore", region: "Asia" },
    { value: "Asia/Bangkok", label: "Bangkok", region: "Asia" },
    { value: "Asia/Jakarta", label: "Jakarta", region: "Asia" },

    // Pacific
    { value: "Australia/Sydney", label: "Sydney", region: "Pacific" },
    { value: "Australia/Melbourne", label: "Melbourne", region: "Pacific" },
    { value: "Australia/Perth", label: "Perth", region: "Pacific" },
    { value: "Pacific/Auckland", label: "Auckland", region: "Pacific" },
    { value: "Pacific/Fiji", label: "Fiji", region: "Pacific" },

    // Africa & Middle East
    { value: "Africa/Cairo", label: "Cairo", region: "Africa" },
    { value: "Africa/Johannesburg", label: "Johannesburg", region: "Africa" },
    { value: "Africa/Lagos", label: "Lagos", region: "Africa" },
  ];

  // Calculate offsets for each timezone
  return timezones.map((tz) => ({
    ...tz,
    offset: formatOffset(getTimezoneOffset(tz.value, now)),
  }));
}

/**
 * Get list of time window presets
 * Common durations for chart time windows
 *
 * @returns Array of time window options
 */
export function getTimeWindowOptions(): TimeWindowOption[] {
  return [
    { value: 1, label: "1 hour" },
    { value: 2, label: "2 hours" },
    { value: 4, label: "4 hours" },
    { value: 6, label: "6 hours" },
    { value: 8, label: "8 hours" },
    { value: 12, label: "12 hours" },
    { value: 24, label: "24 hours" },
    { value: 48, label: "48 hours" },
    { value: 72, label: "3 days" },
    { value: 168, label: "1 week" },
  ];
}

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
export function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Default timezone configuration
 */
export const DEFAULT_TIMEZONE_CONFIG: TimezoneConfig = {
  timezone: "UTC",
  use12HourFormat: false,
  timeWindowHours: 12,
} as const;
