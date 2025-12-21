export { cn } from './cn';
export * from './api-response';
export * from './error-builder';
export * from './sanitize';
export * from './stats-provider';
export * from './stats-cache';
export * from './priority-engine';
export * from './correlation-engine';
export * from './domain-correlations';
export * from './time-series';
export * from './group-by';
// Re-export selected urgency utilities (avoid conflicts with legacy types below)
export {
  getDaysUntil,
  getUrgencyInfo,
  getUrgencyDisplayConfig,
  getUrgencyBorderClass,
  getUrgencyBgClass,
  getTimeDisplay,
  getRelativeDateLabel,
  isCriticalDeadline,
  isWarningDeadline,
  getWaiverExpirationUrgency,
  formatWaiverExpiration,
  DEFAULT_URGENCY_THRESHOLDS,
  URGENCY_PRESETS,
  type UrgencyLevel as NewUrgencyLevel,
  type UrgencyInfo as NewUrgencyInfo,
  type UrgencyThresholds,
  type UrgencyDisplayConfig,
  type GetUrgencyOptions,
} from './urgency';
import { validateDateInput } from '@/lib/validations/date';

/**
 * Formats a date with month, day, and year.
 *
 * @param date - Date object or ISO date string
 * @param fieldHint - Optional hint about which field the date came from (for error messages)
 * @returns Formatted date string (e.g., 'Dec 15, 2024')
 * @throws DateValidationError if date is invalid
 */
export function formatDate(date: Date | string, fieldHint?: string): string {
  const validatedDate = validateDateInput(date, 'formatDate', fieldHint);
  return validatedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Formats a date with month, day, year, hour, and minute.
 *
 * @param date - Date object or ISO date string
 * @param fieldHint - Optional hint about which field the date came from (for error messages)
 * @returns Formatted date/time string (e.g., 'Dec 15, 2024, 10:30 AM')
 * @throws DateValidationError if date is invalid
 */
export function formatDateTime(date: Date | string, fieldHint?: string): string {
  const validatedDate = validateDateInput(date, 'formatDateTime', fieldHint);
  return validatedDate.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Returns a human-readable relative time string.
 *
 * @param date - Date object or ISO date string
 * @param fieldHint - Optional hint about which field the date came from (for error messages)
 * @returns Human-readable string (e.g., 'just now', '5 minutes ago', '2 days ago')
 * @throws DateValidationError if date is invalid
 */
export function formatRelativeTime(date: Date | string, fieldHint?: string): string {
  const then = validateDateInput(date, 'formatRelativeTime', fieldHint);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return formatDate(then);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * @deprecated Use `NewUrgencyLevel` from `@/lib/utils/urgency` instead.
 * This type is kept for backward compatibility with DealCard component.
 */
export type UrgencyLevel = 'critical' | 'warning' | 'normal' | null;

/**
 * @deprecated Use `NewUrgencyInfo` from `@/lib/utils/urgency` instead.
 * This interface is kept for backward compatibility with DealCard component.
 */
export interface UrgencyInfo {
  level: UrgencyLevel;
  daysRemaining: number | null;
  isOverdue: boolean;
  label: string | null;
}

/**
 * Calculates urgency level based on proximity to a deadline date.
 *
 * @deprecated Use `getUrgencyInfo` from `@/lib/utils/urgency` instead.
 * This function is kept for backward compatibility with DealCard component.
 *
 * @param targetDate - Target/deadline date (Date object or ISO string)
 * @returns UrgencyInfo with level, days remaining, and display label
 */
export function calculateUrgency(targetDate: Date | string | null | undefined): UrgencyInfo {
  if (!targetDate) {
    return { level: null, daysRemaining: null, isOverdue: false, label: null };
  }

  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const now = new Date();

  // Reset time to compare just dates
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffMs = targetDay.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    const overdueDays = Math.abs(daysRemaining);
    return {
      level: 'critical',
      daysRemaining,
      isOverdue: true,
      label: overdueDays === 1 ? '1 day overdue' : `${overdueDays} days overdue`,
    };
  }

  if (daysRemaining === 0) {
    return {
      level: 'critical',
      daysRemaining: 0,
      isOverdue: false,
      label: 'Due today',
    };
  }

  if (daysRemaining <= 7) {
    return {
      level: 'warning',
      daysRemaining,
      isOverdue: false,
      label: daysRemaining === 1 ? 'Due tomorrow' : `Due in ${daysRemaining} days`,
    };
  }

  return {
    level: 'normal',
    daysRemaining,
    isOverdue: false,
    label: null,
  };
}
