
import { format, formatDistanceToNow, isValid, parseISO, differenceInDays } from 'date-fns';

/**
 * Safe date parsing helper
 */
function toDate(date: Date | string | number): Date {
    if (date instanceof Date) return date;
    if (typeof date === 'string') return parseISO(date);
    return new Date(date);
}

/**
 * Format a date string or object
 * @param date - The date to format
 * @param formatStr - The format string or preset ("short", "long", "iso", "time")
 * 
 * Presets:
 * - "short": "MM/dd/yy" (e.g., 10/15/23)
 * - "long": "MMM d, yyyy" (e.g., Oct 15, 2023)
 * - "iso": "yyyy-MM-dd" (e.g., 2023-10-15)
 * - "time": "HH:mm" (e.g., 14:30)
 * 
 * Default is "MMM d, yyyy".
 */
export function formatDate(date: Date | string | number | null | undefined, formatStr: string = 'long'): string {
    if (!date) return '—';
    const d = toDate(date);
    if (!isValid(d)) return 'Invalid Date';

    // Map presets to pattern strings
    let pattern = formatStr;
    switch (formatStr) {
        case 'short':
            pattern = 'MM/dd/yy';
            break;
        case 'long':
            pattern = 'MMM d, yyyy';
            break;
        case 'iso':
            pattern = 'yyyy-MM-dd';
            break;
        case 'time':
            pattern = 'HH:mm';
            break;
        default:
            // Use provided string as custom pattern, defaulting to long if match fails or empty
            if (!pattern) pattern = 'MMM d, yyyy';
    }

    return format(d, pattern);
}

/**
 * Format time ago
 * @example "2 days ago"
 */
export function formatTimeAgo(date: Date | string | number): string {
    const d = toDate(date);
    if (!isValid(d)) return '';
    return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Format date range
 * @example "Jan 1 - Jan 15, 2023"
 */
export function formatDateRange(from: Date | string, to: Date | string): string {
    const dFrom = toDate(from);
    const dTo = toDate(to);

    if (!isValid(dFrom) || !isValid(dTo)) return '';

    if (dFrom.getFullYear() === dTo.getFullYear()) {
        return `${format(dFrom, 'MMM d')} - ${format(dTo, 'MMM d, yyyy')}`;
    }

    return `${format(dFrom, 'MMM d, yyyy')} - ${format(dTo, 'MMM d, yyyy')}`;
}

/**
 * Format time
 * @example "14:30"
 */
export function formatTime(date: Date | string): string {
    return formatDate(date, 'time');
}

/**
 * Get days until a date (positive = future, negative = past)
 */
export function getDaysUntil(date: Date | string): number {
    const d = toDate(date);
    if (!isValid(d)) return 0;
    return differenceInDays(d, new Date());
}

/**
 * Format currency
 * @example "$1,000,000"
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}
