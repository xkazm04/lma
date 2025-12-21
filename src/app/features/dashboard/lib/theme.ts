/**
 * Centralized Theme Configuration for Risk Levels, Statuses, and Priorities
 *
 * This module provides a single source of truth for all color configurations
 * related to risk levels, statuses, priorities, and intervention types across
 * the dashboard and related components.
 *
 * Usage:
 *   import { riskLevelConfig, priorityConfig, statusConfig } from '@/app/features/dashboard/lib/theme';
 *   const colors = riskLevelConfig.high;
 *   <div className={cn(colors.bgColor, colors.color)}>High Risk</div>
 */

import type { LucideIcon } from 'lucide-react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Phone,
  FileEdit,
  Bell,
  ClipboardCheck,
  Leaf,
  AlertCircle,
  FileQuestion,
  Shield,
} from 'lucide-react';
import type { RiskLevel, InterventionType, InterventionStatus } from './mocks';

// =============================================================================
// Risk Level Configuration
// =============================================================================

export interface RiskLevelColors {
  color: string;
  bgColor: string;
  borderColor: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
}

/**
 * Risk level color configuration for predictions, alerts, and risk indicators.
 * Used by PredictionCard, RiskCorrelationEngine, and other risk-related components.
 */
export const riskLevelConfig: Record<RiskLevel, RiskLevelColors> = {
  low: {
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    variant: 'secondary',
  },
  medium: {
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    variant: 'secondary',
  },
  high: {
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    variant: 'destructive',
  },
  critical: {
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    variant: 'destructive',
  },
};

/**
 * Get risk level color class for text
 */
export function getRiskLevelColor(level: RiskLevel): string {
  return riskLevelConfig[level].color;
}

/**
 * Get risk level background color class
 */
export function getRiskLevelBgColor(level: RiskLevel): string {
  return riskLevelConfig[level].bgColor;
}

/**
 * Get risk level border color class
 */
export function getRiskLevelBorderColor(level: RiskLevel): string {
  return riskLevelConfig[level].borderColor;
}

/**
 * Get risk level label for display
 */
export function getRiskLevelLabel(level: RiskLevel): string {
  const labels: Record<RiskLevel, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
  };
  return labels[level];
}

// =============================================================================
// Priority Configuration
// =============================================================================

export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export interface PriorityColors {
  color: string;
  bgColor: string;
  iconColor: string;
  label: string;
}

/**
 * Priority level color configuration for deadlines, interventions, and tasks.
 * Used by DeadlineItem, InterventionCard, and priority-related components.
 */
export const priorityConfig: Record<PriorityLevel, PriorityColors> = {
  low: {
    color: 'text-zinc-500',
    bgColor: 'bg-zinc-100',
    iconColor: 'text-zinc-400',
    label: 'Low',
  },
  medium: {
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    iconColor: 'text-amber-500',
    label: 'Medium',
  },
  high: {
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    iconColor: 'text-red-500',
    label: 'High',
  },
  urgent: {
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    iconColor: 'text-red-600',
    label: 'Urgent',
  },
};

/**
 * Get priority icons for deadlines
 */
export const priorityIcons: Record<PriorityLevel, LucideIcon> = {
  high: AlertTriangle,
  urgent: AlertTriangle,
  medium: Clock,
  low: Info,
};

/**
 * Get priority icon color class
 */
export function getPriorityIconColor(priority: PriorityLevel): string {
  return priorityConfig[priority].iconColor;
}

// =============================================================================
// Status Configuration
// =============================================================================

export type ActivityStatus = 'success' | 'warning' | 'error' | 'info';

export interface ActivityStatusColors {
  color: string;
  Icon: LucideIcon;
}

/**
 * Activity status color configuration for activity feeds and status indicators.
 * Used by ActivityItem and related activity components.
 */
export const activityStatusConfig: Record<ActivityStatus, ActivityStatusColors> = {
  success: { color: 'text-green-600', Icon: CheckCircle2 },
  warning: { color: 'text-amber-600', Icon: Clock },
  error: { color: 'text-red-600', Icon: AlertTriangle },
  info: { color: 'text-blue-600', Icon: Clock },
};

// =============================================================================
// Intervention Status Configuration
// =============================================================================

export interface InterventionStatusColors {
  icon: LucideIcon;
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  color: string;
}

/**
 * Intervention status color configuration.
 * Used by InterventionCard and intervention-related components.
 */
export const interventionStatusConfig: Record<InterventionStatus, InterventionStatusColors> = {
  pending: {
    icon: Clock,
    label: 'Pending',
    variant: 'secondary',
    color: 'text-amber-600',
  },
  approved: {
    icon: CheckCircle2,
    label: 'Approved',
    variant: 'default',
    color: 'text-green-600',
  },
  rejected: {
    icon: XCircle,
    label: 'Rejected',
    variant: 'destructive',
    color: 'text-red-600',
  },
  executed: {
    icon: CheckCircle2,
    label: 'Executed',
    variant: 'default',
    color: 'text-blue-600',
  },
  expired: {
    icon: Clock,
    label: 'Expired',
    variant: 'secondary',
    color: 'text-zinc-500',
  },
};

// =============================================================================
// Intervention Type Configuration
// =============================================================================

export interface InterventionTypeColors {
  icon: LucideIcon;
  label: string;
  color: string;
  bgColor: string;
}

/**
 * Intervention type color configuration.
 * Used by InterventionCard and intervention-related components.
 */
export const interventionTypeConfig: Record<InterventionType, InterventionTypeColors> = {
  borrower_call: {
    icon: Phone,
    label: 'Borrower Call',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  amendment_draft: {
    icon: FileEdit,
    label: 'Amendment Draft',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  counterparty_alert: {
    icon: Bell,
    label: 'Counterparty Alert',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  compliance_reminder: {
    icon: ClipboardCheck,
    label: 'Compliance Reminder',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  esg_action: {
    icon: Leaf,
    label: 'ESG Action',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
  risk_escalation: {
    icon: AlertCircle,
    label: 'Risk Escalation',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  waiver_request: {
    icon: Shield,
    label: 'Waiver Request',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
  },
  document_request: {
    icon: FileQuestion,
    label: 'Document Request',
    color: 'text-zinc-600',
    bgColor: 'bg-zinc-100',
  },
};

// =============================================================================
// Trend Configuration
// =============================================================================

export type TrendDirection = 'improving' | 'stable' | 'deteriorating';

export interface TrendColors {
  color: string;
  bgColor: string;
}

/**
 * Trend direction color configuration.
 * Used for trend indicators in predictions and analytics.
 */
export const trendConfig: Record<TrendDirection, TrendColors> = {
  improving: {
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  stable: {
    color: 'text-zinc-600',
    bgColor: 'bg-zinc-50',
  },
  deteriorating: {
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
};

// =============================================================================
// Probability Thresholds for Color Coding
// =============================================================================

/**
 * Get color class based on probability percentage.
 * Used for breach probability displays.
 */
export function getProbabilityColor(probability: number): string {
  if (probability >= 75) return 'text-red-600';
  if (probability >= 50) return 'text-orange-600';
  if (probability >= 25) return 'text-amber-600';
  return 'text-green-600';
}

/**
 * Get progress color class based on percentage.
 * Used for progress bars where higher is worse (like breach probability).
 */
export function getProgressDangerColor(percentage: number): string {
  if (percentage >= 75) return 'bg-red-500';
  if (percentage >= 50) return 'bg-orange-500';
  if (percentage >= 25) return 'bg-amber-500';
  return 'bg-green-500';
}

/**
 * Get headroom color class based on percentage.
 * Used for covenant headroom where lower is worse.
 */
export function getHeadroomColor(headroomPercent: number): string {
  if (headroomPercent < 10) return 'bg-red-500';
  if (headroomPercent < 20) return 'bg-amber-500';
  return 'bg-green-500';
}

// =============================================================================
// Confidence Level Configuration
// =============================================================================

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface ConfidenceColors {
  bgColor: string;
  textColor: string;
  borderColor: string;
}

/**
 * Confidence level color configuration.
 * Used for prediction confidence indicators.
 */
export const confidenceConfig: Record<ConfidenceLevel, ConfidenceColors> = {
  high: {
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
  },
  medium: {
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
  },
  low: {
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
  },
};

/**
 * Get combined confidence color classes
 */
export function getConfidenceColorClasses(confidence: ConfidenceLevel): string {
  const config = confidenceConfig[confidence];
  return `${config.bgColor} ${config.textColor} ${config.borderColor}`;
}
