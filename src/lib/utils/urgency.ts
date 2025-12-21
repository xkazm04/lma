/**
 * Unified Urgency Calculation Utilities
 *
 * This module provides consistent urgency level calculations across all calendar
 * and deadline components. It consolidates previously scattered implementations
 * from UpcomingDeadlineCard, ObligationsTab, ListView, and WaiverBadge.
 *
 * ## Urgency Levels
 *
 * | Level    | Days Until | Description                           |
 * |----------|------------|---------------------------------------|
 * | critical | ≤ 0        | Overdue or due today                  |
 * | urgent   | 1-3        | Immediate attention needed            |
 * | warning  | 4-7        | Approaching deadline                  |
 * | caution  | 8-14       | Monitor closely                       |
 * | normal   | > 14       | Standard priority                     |
 *
 * ## Precision Modes
 *
 * - `days`: Standard day-level precision (default)
 * - `hours`: Hour/minute precision for same-day deadlines
 */

import { AlertTriangle, Clock, CalendarCheck, type LucideIcon } from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export type UrgencyLevel = 'critical' | 'urgent' | 'warning' | 'caution' | 'normal';

export interface UrgencyThresholds {
  /** Days threshold for critical level (default: 0 - overdue/today) */
  critical: number;
  /** Days threshold for urgent level (default: 3) */
  urgent: number;
  /** Days threshold for warning level (default: 7) */
  warning: number;
  /** Days threshold for caution level (default: 14) */
  caution: number;
}

export interface UrgencyInfo {
  /** The urgency level */
  level: UrgencyLevel;
  /** Days until deadline (negative = overdue) */
  daysUntil: number;
  /** Hours remaining (only populated for same-day with precision: 'hours') */
  hoursRemaining: number | null;
  /** Minutes remaining (only populated for same-day with precision: 'hours') */
  minutesRemaining: number | null;
  /** Whether the deadline is overdue */
  isOverdue: boolean;
}

export interface UrgencyDisplayConfig {
  /** Badge variant for UI components */
  variant: 'destructive' | 'warning' | 'secondary';
  /** Icon component to display */
  Icon: LucideIcon;
  /** Human-readable label */
  label: string;
  /** Whether to show pulsing animation */
  isPulsing: boolean;
  /** Badge CSS classes */
  badgeClass: string;
  /** Border CSS class for cards */
  borderClass: string;
  /** Background CSS class for cards */
  bgClass: string;
}

export interface GetUrgencyOptions {
  /** Precision level for time calculations */
  precision?: 'days' | 'hours';
  /** Custom thresholds (uses defaults if not provided) */
  thresholds?: Partial<UrgencyThresholds>;
}

// =============================================================================
// Constants
// =============================================================================

export const DEFAULT_URGENCY_THRESHOLDS: UrgencyThresholds = {
  critical: 0,   // Overdue or due today
  urgent: 3,     // 1-3 days
  warning: 7,    // 4-7 days
  caution: 14,   // 8-14 days
};

// Preset threshold configurations for common use cases
export const URGENCY_PRESETS = {
  /** Standard deadlines (compliance, obligations) */
  standard: DEFAULT_URGENCY_THRESHOLDS,
  /** Tight deadlines (settlements, urgent tasks) */
  tight: {
    critical: 0,
    urgent: 1,
    warning: 3,
    caution: 7,
  },
  /** Extended deadlines (waivers, long-term items) */
  extended: {
    critical: 0,
    urgent: 7,
    warning: 14,
    caution: 30,
  },
} as const;

// =============================================================================
// Core Calculation Functions
// =============================================================================

/**
 * Calculates the number of days until a given date.
 * Returns positive number for future dates, negative for past dates.
 *
 * @param dateStr - ISO date string
 * @returns Number of days until the date
 */
export function getDaysUntil(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();

  // Reset to start of day for day comparison
  const dateStart = new Date(date);
  dateStart.setHours(0, 0, 0, 0);
  const nowStart = new Date(now);
  nowStart.setHours(0, 0, 0, 0);

  return Math.ceil((dateStart.getTime() - nowStart.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Calculates detailed urgency information for a deadline.
 *
 * @param dateStr - ISO date string for the deadline
 * @param options - Configuration options for precision and thresholds
 * @returns UrgencyInfo with level, days, hours/minutes (if applicable)
 *
 * @example
 * // Standard day precision
 * const urgency = getUrgencyInfo('2024-01-15');
 *
 * @example
 * // Hour precision for same-day deadlines
 * const urgency = getUrgencyInfo('2024-01-15', { precision: 'hours' });
 *
 * @example
 * // Custom thresholds
 * const urgency = getUrgencyInfo('2024-01-15', {
 *   thresholds: { critical: 0, urgent: 1, warning: 3, caution: 7 }
 * });
 */
export function getUrgencyInfo(dateStr: string, options: GetUrgencyOptions = {}): UrgencyInfo {
  const { precision = 'days', thresholds: customThresholds } = options;
  const thresholds = { ...DEFAULT_URGENCY_THRESHOLDS, ...customThresholds };

  const daysUntil = getDaysUntil(dateStr);

  // Calculate hours/minutes for same-day deadlines when precision is 'hours'
  let hoursRemaining: number | null = null;
  let minutesRemaining: number | null = null;

  if (precision === 'hours' && daysUntil === 0) {
    const date = new Date(dateStr);
    const now = new Date();

    // Set deadline to end of day (23:59:59)
    const deadlineEndOfDay = new Date(date);
    deadlineEndOfDay.setHours(23, 59, 59, 999);

    const msRemaining = deadlineEndOfDay.getTime() - now.getTime();
    if (msRemaining > 0) {
      hoursRemaining = Math.floor(msRemaining / (1000 * 60 * 60));
      minutesRemaining = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
    } else {
      hoursRemaining = 0;
      minutesRemaining = 0;
    }
  }

  // Determine urgency level
  let level: UrgencyLevel;
  if (daysUntil <= thresholds.critical) {
    level = 'critical';
  } else if (daysUntil <= thresholds.urgent) {
    level = 'urgent';
  } else if (daysUntil <= thresholds.warning) {
    level = 'warning';
  } else if (daysUntil <= thresholds.caution) {
    level = 'caution';
  } else {
    level = 'normal';
  }

  return {
    level,
    daysUntil,
    hoursRemaining,
    minutesRemaining,
    isOverdue: daysUntil < 0,
  };
}

// =============================================================================
// Display Configuration Functions
// =============================================================================

/**
 * Gets display configuration (badge variant, icon, classes) for an urgency level.
 *
 * @param level - The urgency level
 * @returns UrgencyDisplayConfig with all styling information
 */
export function getUrgencyDisplayConfig(level: UrgencyLevel): UrgencyDisplayConfig {
  switch (level) {
    case 'critical':
      return {
        variant: 'destructive',
        Icon: AlertTriangle,
        label: 'Critical',
        isPulsing: true,
        badgeClass: 'text-sm font-semibold px-3 py-1',
        borderClass: 'border-l-4 border-l-red-500',
        bgClass: 'bg-red-50/50',
      };
    case 'urgent':
      return {
        variant: 'destructive',
        Icon: AlertTriangle,
        label: 'Urgent',
        isPulsing: false,
        badgeClass: 'text-sm font-semibold px-3 py-1',
        borderClass: 'border-l-4 border-l-red-400',
        bgClass: 'bg-red-50/30',
      };
    case 'warning':
      return {
        variant: 'warning',
        Icon: Clock,
        label: 'Warning',
        isPulsing: false,
        badgeClass: 'text-xs font-semibold px-2.5 py-0.5',
        borderClass: 'border-l-4 border-l-amber-500',
        bgClass: 'bg-amber-50/30',
      };
    case 'caution':
      return {
        variant: 'secondary',
        Icon: Clock,
        label: 'Caution',
        isPulsing: false,
        badgeClass: 'text-xs font-medium px-2.5 py-0.5',
        borderClass: 'border-l-4 border-l-yellow-400',
        bgClass: '',
      };
    case 'normal':
    default:
      return {
        variant: 'secondary',
        Icon: CalendarCheck,
        label: 'Normal',
        isPulsing: false,
        badgeClass: 'text-xs font-medium px-2.5 py-0.5',
        borderClass: 'border-l-4 border-l-zinc-200',
        bgClass: '',
      };
  }
}

/**
 * Gets the border CSS class for an urgency level.
 * Used for card left borders to indicate urgency.
 *
 * @param level - The urgency level
 * @returns CSS class string
 */
export function getUrgencyBorderClass(level: UrgencyLevel): string {
  return getUrgencyDisplayConfig(level).borderClass;
}

/**
 * Gets the background CSS class for an urgency level.
 * Used for card backgrounds to indicate urgency.
 *
 * @param level - The urgency level
 * @returns CSS class string
 */
export function getUrgencyBgClass(level: UrgencyLevel): string {
  return getUrgencyDisplayConfig(level).bgClass;
}

// =============================================================================
// Time Display Functions
// =============================================================================

/**
 * Gets a human-readable time display string for a deadline.
 * Supports both day-level and hour/minute precision.
 *
 * @param urgency - UrgencyInfo from getUrgencyInfo()
 * @returns Human-readable string (e.g., "Due now", "2h 30m remaining", "Tomorrow", "5d")
 */
export function getTimeDisplay(urgency: UrgencyInfo): string {
  const { daysUntil, hoursRemaining, minutesRemaining, isOverdue } = urgency;

  // Same-day with hour precision
  if (daysUntil === 0 && hoursRemaining !== null && minutesRemaining !== null) {
    if (hoursRemaining === 0 && minutesRemaining === 0) {
      return 'Due now';
    }
    if (hoursRemaining === 0) {
      return `${minutesRemaining}m remaining`;
    }
    if (hoursRemaining < 12) {
      return `${hoursRemaining}h ${minutesRemaining}m remaining`;
    }
    return `${hoursRemaining} hours remaining`;
  }

  // Day-level display
  if (daysUntil === 0) {
    return 'Due today';
  }

  if (daysUntil === 1) {
    return 'Tomorrow';
  }

  if (isOverdue) {
    const overdueDays = Math.abs(daysUntil);
    return overdueDays === 1 ? '1d overdue' : `${overdueDays}d overdue`;
  }

  return `${daysUntil}d`;
}

/**
 * Gets a human-readable relative date label.
 *
 * @param daysUntil - Number of days until the date (from getDaysUntil)
 * @returns Human-readable string (e.g., 'Today', 'Tomorrow', 'In 5 days', '3 days ago')
 */
export function getRelativeDateLabel(daysUntil: number): string {
  if (daysUntil === 0) return 'Today';
  if (daysUntil === 1) return 'Tomorrow';
  if (daysUntil > 0) return `In ${daysUntil} days`;
  return `${Math.abs(daysUntil)} days ago`;
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Quick check if a deadline is critical (overdue or due today).
 *
 * @param dateStr - ISO date string
 * @returns true if critical
 */
export function isCriticalDeadline(dateStr: string): boolean {
  return getDaysUntil(dateStr) <= 0;
}

/**
 * Quick check if a deadline is in the warning zone (within 7 days).
 *
 * @param dateStr - ISO date string
 * @returns true if within warning threshold
 */
export function isWarningDeadline(dateStr: string): boolean {
  const days = getDaysUntil(dateStr);
  return days > 0 && days <= DEFAULT_URGENCY_THRESHOLDS.warning;
}

/**
 * Gets urgency for waiver expiration with extended thresholds.
 * Waivers use longer time horizons than standard deadlines.
 *
 * @param dateStr - ISO date string for waiver expiration
 * @returns UrgencyLevel (critical if ≤7 days, warning if ≤30 days)
 */
export function getWaiverExpirationUrgency(dateStr: string): 'critical' | 'warning' | 'normal' {
  const daysUntil = getDaysUntil(dateStr);

  if (daysUntil <= 7) {
    return 'critical';
  }
  if (daysUntil <= 30) {
    return 'warning';
  }
  return 'normal';
}

/**
 * Formats a waiver expiration date with human-readable context.
 *
 * @param dateStr - ISO date string for waiver expiration
 * @returns Human-readable string (e.g., "Expires today", "Expires in 3 days")
 */
export function formatWaiverExpiration(dateStr: string): string {
  const daysUntil = getDaysUntil(dateStr);

  if (daysUntil < 0) {
    return 'Expired';
  }
  if (daysUntil === 0) {
    return 'Expires today';
  }
  if (daysUntil === 1) {
    return 'Expires tomorrow';
  }
  if (daysUntil <= 7) {
    return `Expires in ${daysUntil} days`;
  }
  if (daysUntil <= 30) {
    return `Expires in ${Math.ceil(daysUntil / 7)} weeks`;
  }

  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
