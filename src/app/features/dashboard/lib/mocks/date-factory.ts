/**
 * Mock Data Date Factory
 *
 * Factory functions for generating dates relative to the current time.
 * This ensures mock data always feels fresh and realistic during development,
 * and timestamps like "daysRemaining: 5" stay meaningful regardless of when
 * the code is run.
 */

// =============================================================================
// Core Date Utilities
// =============================================================================

/**
 * Get the current date (can be mocked for testing)
 */
export function getNow(): Date {
  return new Date();
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add hours to a date
 */
export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

/**
 * Add minutes to a date
 */
export function addMinutes(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

/**
 * Add months to a date
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

// =============================================================================
// Relative Date Generators
// =============================================================================

/**
 * Get a date in the past relative to now
 */
export function daysAgo(days: number): Date {
  return addDays(getNow(), -days);
}

/**
 * Get a date in the future relative to now
 */
export function daysFromNow(days: number): Date {
  return addDays(getNow(), days);
}

/**
 * Get a date hours in the past
 */
export function hoursAgo(hours: number): Date {
  return addHours(getNow(), -hours);
}

/**
 * Get a date minutes in the past
 */
export function minutesAgo(minutes: number): Date {
  return addMinutes(getNow(), -minutes);
}

/**
 * Get a date months in the past
 */
export function monthsAgo(months: number): Date {
  return addMonths(getNow(), -months);
}

/**
 * Get a date months in the future
 */
export function monthsFromNow(months: number): Date {
  return addMonths(getNow(), months);
}

// =============================================================================
// Date Formatters
// =============================================================================

/**
 * Format date as ISO string (for API-like timestamps)
 * Example: "2024-12-15T10:30:00Z"
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}

/**
 * Format date as YYYY-MM-DD
 * Example: "2024-12-15"
 */
export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Format date as "Mon DD, YYYY"
 * Example: "Dec 15, 2024"
 */
export function toShortDate(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/**
 * Format date as short month name
 * Example: "Dec"
 */
export function toMonthShort(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[date.getMonth()];
}

// =============================================================================
// Relative Time Formatters
// =============================================================================

/**
 * Format a date as relative time string
 * Examples: "2 minutes ago", "1 hour ago", "3 days ago"
 */
export function toRelativeTime(date: Date): string {
  const now = getNow();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMinutes < 1) {
    return 'Now';
  } else if (diffMinutes < 60) {
    return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} min ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else if (diffDays < 7) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  } else {
    return diffWeeks === 1 ? '1 week ago' : `${diffWeeks} weeks ago`;
  }
}

/**
 * Get relative time for a date in the past by specifying minutes ago
 */
export function relativeMinutesAgo(minutes: number): string {
  return toRelativeTime(minutesAgo(minutes));
}

/**
 * Get relative time for a date in the past by specifying hours ago
 */
export function relativeHoursAgo(hours: number): string {
  return toRelativeTime(hoursAgo(hours));
}

/**
 * Get relative time for a date in the past by specifying days ago
 */
export function relativeDaysAgo(days: number): string {
  return toRelativeTime(daysAgo(days));
}

// =============================================================================
// Mock Data Specific Helpers
// =============================================================================

/**
 * Generate a deadline with computed daysRemaining
 */
export interface DeadlineInfo {
  dueDate: string;
  daysRemaining: number;
}

export function createDeadline(daysFromToday: number, format: 'short' | 'iso' = 'short'): DeadlineInfo {
  const date = daysFromNow(daysFromToday);
  return {
    dueDate: format === 'short' ? toShortDate(date) : toDateString(date),
    daysRemaining: daysFromToday,
  };
}

/**
 * Generate an array of month labels for the last N months
 * Useful for chart data
 */
export function getRecentMonths(count: number): string[] {
  const months: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    months.push(toMonthShort(monthsAgo(i)));
  }
  return months;
}

/**
 * Generate maturity date N years from now
 */
export function maturityDate(years: number, offsetMonths: number = 0): string {
  const date = addMonths(addMonths(getNow(), years * 12), offsetMonths);
  return toDateString(date);
}

/**
 * Create an ISO timestamp for an event that occurred N minutes ago
 */
export function eventTimestamp(minutesAgoValue: number): string {
  return toISOString(minutesAgo(minutesAgoValue));
}

/**
 * Create an ISO timestamp for an event that occurred N hours ago
 */
export function eventTimestampHoursAgo(hoursAgoValue: number): string {
  return toISOString(hoursAgo(hoursAgoValue));
}

/**
 * Create an ISO timestamp for an event that occurred N days ago
 */
export function eventTimestampDaysAgo(daysAgoValue: number): string {
  return toISOString(daysAgo(daysAgoValue));
}

/**
 * Create an ISO timestamp for a future scheduled event
 */
export function scheduledTimestamp(daysFromTodayValue: number, hoursOffset: number = 9): string {
  const date = daysFromNow(daysFromTodayValue);
  date.setHours(hoursOffset, 0, 0, 0);
  return toISOString(date);
}

/**
 * Get "last updated" time string (e.g., "2 hours ago")
 */
export function lastUpdated(hoursAgoValue: number): string {
  return relativeHoursAgo(hoursAgoValue);
}

// =============================================================================
// Blackout Period Helpers (for autopilot)
// =============================================================================

/**
 * Create holiday blackout periods relative to current date
 */
export interface BlackoutPeriod {
  start: string;
  end: string;
  reason: string;
}

export function createHolidayBlackouts(): BlackoutPeriod[] {
  const now = getNow();
  const currentYear = now.getFullYear();
  const nextYear = currentYear + 1;

  // Find next Christmas (Dec 24-26)
  const christmasYear = now.getMonth() === 11 && now.getDate() > 26 ? nextYear : currentYear;

  // Find next New Year (Dec 31 - Jan 2)
  const newYearStartYear = now.getMonth() === 11 && now.getDate() <= 31 ? currentYear :
                           now.getMonth() === 0 && now.getDate() <= 2 ? currentYear - 1 : currentYear;

  return [
    {
      start: `${christmasYear}-12-24`,
      end: `${christmasYear}-12-26`,
      reason: 'Holiday freeze',
    },
    {
      start: `${newYearStartYear}-12-31`,
      end: `${newYearStartYear + 1}-01-02`,
      reason: 'Year-end freeze',
    },
  ];
}
