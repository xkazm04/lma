import type { TradeStatus, Activity, Position } from './types';
import { isValid, parseISO, differenceInDays } from 'date-fns';
import React from 'react';
import {
  CheckCircle,
  AlertTriangle,
  FileQuestion,
  ArrowLeftRight,
  Clock,
  FileText,
  Flag,
  XCircle,
  MessageSquare,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * Activity type for icon mapping
 */
export type ActivityType = Activity['type'];

/**
 * Position/Facility status for badge mapping
 */
export type FacilityStatus = Position['facility_status'];

/**
 * Trade event icon configuration
 * Maps event/status types to their icon component, class name, and color
 */
interface TradeEventIconConfig {
  icon: React.ComponentType<{ className?: string }>;
  className: string;
}

const TRADE_EVENT_ICON_CONFIG: Record<string, TradeEventIconConfig> = {
  // DD item status icons
  verified: { icon: CheckCircle, className: 'w-4 h-4 text-green-600' },
  flagged: { icon: Flag, className: 'w-4 h-4 text-red-600' },
  in_review: { icon: Clock, className: 'w-4 h-4 text-blue-600' },
  waived: { icon: XCircle, className: 'w-4 h-4 text-zinc-400' },

  // Timeline event type icons
  dd_item_verified: { icon: CheckCircle, className: 'w-4 h-4 text-green-600' },
  dd_item_flagged: { icon: AlertTriangle, className: 'w-4 h-4 text-red-600' },
  question_asked: { icon: MessageSquare, className: 'w-4 h-4 text-blue-600' },
  question_answered: { icon: MessageSquare, className: 'w-4 h-4 text-blue-600' },
  trade_created: { icon: ArrowLeftRight, className: 'w-4 h-4 text-purple-600' },
  terms_agreed: { icon: ArrowLeftRight, className: 'w-4 h-4 text-purple-600' },
  consent_received: { icon: CheckCircle, className: 'w-4 h-4 text-green-600' },
  trade_settled: { icon: CheckCircle, className: 'w-4 h-4 text-green-600' },
  dd_started: { icon: FileText, className: 'w-4 h-4' },
  dd_completed: { icon: FileText, className: 'w-4 h-4' },
};

const DEFAULT_ICON_CONFIG: TradeEventIconConfig = {
  icon: Clock,
  className: 'w-4 h-4 text-zinc-400',
};

/**
 * Returns the appropriate icon element for a given trade event or DD item status.
 * Unified function that handles both timeline events (dd_item_verified, trade_created, etc.)
 * and DD checklist item statuses (verified, flagged, in_review, waived, pending).
 *
 * @param type - The event type or status string
 * @returns A React element containing the appropriate icon
 */
export function getTradeEventIcon(type: string): React.ReactElement {
  const config = TRADE_EVENT_ICON_CONFIG[type] || DEFAULT_ICON_CONFIG;
  return React.createElement(config.icon, { className: config.className });
}

/**
 * Returns the appropriate icon element for DD checklist item status.
 * Returns a pending indicator (empty circle) for pending status.
 *
 * @param status - The DD item status string
 * @returns A React element containing the appropriate icon
 */
export function getDDItemStatusIcon(status: string): React.ReactElement {
  if (status === 'pending') {
    // Special case: pending status uses an empty circle div, not an icon
    return React.createElement('div', {
      className: 'w-4 h-4 rounded-full border-2 border-zinc-300',
    });
  }
  return getTradeEventIcon(status);
}

/**
 * Returns the appropriate badge element for a given facility/position status.
 * Used by PositionCard component to display status badges.
 *
 * @param status - The facility status string
 * @returns A React element containing the appropriate Badge component
 */
export function getStatusBadge(status: string): React.ReactElement {
  switch (status) {
    case 'active':
      return React.createElement(Badge, {
        variant: 'default',
        className: 'bg-green-100 text-green-700 hover:bg-green-100'
      }, 'Active');
    case 'watchlist':
      return React.createElement(Badge, { variant: 'warning' }, 'Watchlist');
    case 'default':
      return React.createElement(Badge, { variant: 'destructive' }, 'Default');
    case 'matured':
      return React.createElement(Badge, { variant: 'secondary' }, 'Matured');
    default:
      return React.createElement(Badge, { variant: 'outline' }, status);
  }
}

/**
 * Safe date parsing helper - parses ISO string to Date
 */
function toDate(dateStr: string): Date {
  return parseISO(dateStr);
}

export function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats a date string with month, day, and year.
 * Returns '-' for null/undefined values or invalid dates.
 *
 * @param dateStr - ISO date string or null (e.g., '2024-12-15')
 * @returns Formatted date string (e.g., 'Dec 15, 2024') or '-' for null/invalid
 */
export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = toDate(dateStr);
  if (!isValid(date)) return '-';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}


/**
 * Returns a human-readable "time ago" string.
 *
 * @param dateStr - ISO date string
 * @returns Human-readable string (e.g., '2d ago', '3h ago', 'Just now') or '-' for invalid
 */
export function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return '-';
  const date = toDate(dateStr);
  if (!isValid(date)) return '-';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  return 'Just now';
}

/**
 * Calculates the number of days until or since a given date.
 *
 * @param dateStr - ISO date string (e.g., '2024-12-15')
 * @returns Number of days until (positive) or since (negative) the date, or 0 for invalid
 */
export function getDaysUntil(dateStr: string): number {
  if (!dateStr) return 0;
  const date = toDate(dateStr);
  if (!isValid(date)) return 0;
  return differenceInDays(date, new Date());
}

export function getStatusBadgeVariant(status: TradeStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'draft':
    case 'indication':
      return 'outline';
    case 'agreed':
    case 'in_due_diligence':
      return 'default';
    case 'documentation':
    case 'pending_consent':
    case 'pending_settlement':
      return 'secondary';
    case 'settled':
      return 'default';
    case 'cancelled':
    case 'failed':
      return 'destructive';
    default:
      return 'outline';
  }
}

export function getStatusLabel(status: TradeStatus): string {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'indication':
      return 'Indication';
    case 'agreed':
      return 'Agreed';
    case 'in_due_diligence':
      return 'In DD';
    case 'documentation':
      return 'Documentation';
    case 'pending_consent':
      return 'Pending Consent';
    case 'pending_settlement':
      return 'Pending Settlement';
    case 'settled':
      return 'Settled';
    case 'cancelled':
      return 'Cancelled';
    case 'failed':
      return 'Failed';
    default:
      return status;
  }
}
