/**
 * Shared formatting utilities
 * Consolidates duplicate formatting functions across modules
 */

/**
 * Format a date as relative time (e.g., "2 hours ago", "3 days ago")
 */
export function formatTimeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  return `${diffMonths}mo ago`;
}

/**
 * Format a number as currency
 */
export function formatCurrency(
  amount: number,
  options?: {
    currency?: string;
    locale?: string;
    compact?: boolean;
    maximumFractionDigits?: number;
  }
): string {
  const {
    currency = 'USD',
    locale = 'en-US',
    compact = false,
    maximumFractionDigits = 0,
  } = options || {};

  if (compact) {
    const absAmount = Math.abs(amount);
    if (absAmount >= 1_000_000_000) {
      return `$${(amount / 1_000_000_000).toFixed(1)}B`;
    }
    if (absAmount >= 1_000_000) {
      return `$${(amount / 1_000_000).toFixed(1)}M`;
    }
    if (absAmount >= 1_000) {
      return `$${(amount / 1_000).toFixed(0)}K`;
    }
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a number with optional compact notation
 */
export function formatNumber(
  num: number,
  options?: {
    compact?: boolean;
    decimals?: number;
    locale?: string;
  }
): string {
  const { compact = false, decimals = 0, locale = 'en-US' } = options || {};

  if (compact) {
    const absNum = Math.abs(num);
    if (absNum >= 1_000_000_000) {
      return `${(num / 1_000_000_000).toFixed(1)}B`;
    }
    if (absNum >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(1)}M`;
    }
    if (absNum >= 1_000) {
      return `${(num / 1_000).toFixed(decimals > 0 ? 1 : 0)}K`;
    }
  }

  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  }).format(num);
}

/**
 * Format a date for display
 */
export function formatDate(
  date: Date | string,
  options?: {
    format?: 'short' | 'medium' | 'long';
    includeTime?: boolean;
    locale?: string;
  }
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const { format = 'medium', includeTime = false, locale = 'en-US' } = options || {};

  const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
    short: { month: 'short', day: 'numeric' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' },
  };
  const dateOptions: Intl.DateTimeFormatOptions = formatOptions[format];

  if (includeTime) {
    dateOptions.hour = 'numeric';
    dateOptions.minute = '2-digit';
  }

  return d.toLocaleDateString(locale, dateOptions);
}

/**
 * Calculate days until a target date
 */
export function getDaysUntil(targetDate: Date | string): number {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Format a percentage
 */
export function formatPercent(
  value: number,
  options?: {
    decimals?: number;
    includeSign?: boolean;
  }
): string {
  const { decimals = 0, includeSign = false } = options || {};
  const formatted = `${value.toFixed(decimals)}%`;
  if (includeSign && value > 0) {
    return `+${formatted}`;
  }
  return formatted;
}
