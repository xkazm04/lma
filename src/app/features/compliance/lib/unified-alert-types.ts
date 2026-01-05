// =============================================================================
// Unified Alert Types for Agent and Autopilot
// =============================================================================

import type { AgentAlert } from '../sub_Agent/lib/types';
import type { AutopilotAlert, NotificationPriority } from '../sub_Autopilot/lib/types';

/**
 * Unified severity level that maps both AgentAlert severity and AutopilotAlert priority
 */
export type UnifiedAlertSeverity = 'critical' | 'high' | 'warning' | 'info';

/**
 * Common alert structure that both AgentAlert and AutopilotAlert can be mapped to
 */
export interface UnifiedAlert {
  id: string;
  severity: UnifiedAlertSeverity;
  title: string;
  message: string;

  // Optional context
  borrowerName?: string;
  affectedFacilities?: string[];

  // Actions
  suggestedActions: string[];
  requiresEscalation?: boolean;

  // Metadata
  createdAt: string;
  acknowledged?: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;

  // Links
  predictionId?: string;
}

/**
 * Map AgentAlert severity to UnifiedAlertSeverity
 */
function mapAgentSeverity(severity: AgentAlert['severity']): UnifiedAlertSeverity {
  switch (severity) {
    case 'critical':
      return 'critical';
    case 'warning':
      return 'warning';
    case 'info':
      return 'info';
    default:
      return 'info';
  }
}

/**
 * Map AutopilotAlert priority to UnifiedAlertSeverity
 */
function mapAutopilotPriority(priority: NotificationPriority): UnifiedAlertSeverity {
  switch (priority) {
    case 'critical':
      return 'critical';
    case 'high':
      return 'high';
    case 'medium':
      return 'warning';
    case 'low':
      return 'info';
    default:
      return 'info';
  }
}

/**
 * Convert AgentAlert to UnifiedAlert
 */
export function normalizeAgentAlert(alert: AgentAlert): UnifiedAlert {
  return {
    id: alert.id,
    severity: mapAgentSeverity(alert.severity),
    title: alert.title,
    message: alert.description,
    affectedFacilities: alert.affected_facilities,
    suggestedActions: alert.recommended_actions,
    requiresEscalation: alert.requires_escalation,
    createdAt: alert.created_at,
  };
}

/**
 * Convert AutopilotAlert to UnifiedAlert
 */
export function normalizeAutopilotAlert(alert: AutopilotAlert): UnifiedAlert {
  return {
    id: alert.id,
    severity: mapAutopilotPriority(alert.priority),
    title: alert.title,
    message: alert.message,
    borrowerName: alert.borrower_name,
    suggestedActions: alert.suggested_actions,
    createdAt: alert.created_at,
    acknowledged: alert.acknowledged,
    acknowledgedAt: alert.acknowledged_at,
    acknowledgedBy: alert.acknowledged_by,
    predictionId: alert.prediction_id,
  };
}

// =============================================================================
// Unified Alert Styling Helpers
// =============================================================================

export interface UnifiedAlertColors {
  bg: string;
  border: string;
  text: string;
  icon: string;
  iconBg: string;
}

/**
 * Get styling colors for a unified alert severity level
 */
export function getUnifiedAlertColors(severity: UnifiedAlertSeverity): UnifiedAlertColors {
  switch (severity) {
    case 'critical':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        icon: 'text-red-600',
        iconBg: 'bg-red-100',
      };
    case 'high':
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-700',
        icon: 'text-orange-600',
        iconBg: 'bg-orange-100',
      };
    case 'warning':
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        icon: 'text-amber-600',
        iconBg: 'bg-amber-100',
      };
    case 'info':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        icon: 'text-blue-600',
        iconBg: 'bg-blue-100',
      };
    default:
      return {
        bg: 'bg-zinc-50',
        border: 'border-zinc-200',
        text: 'text-zinc-700',
        icon: 'text-zinc-600',
        iconBg: 'bg-zinc-100',
      };
  }
}

/**
 * Get display label for severity level
 */
export function getUnifiedAlertLabel(severity: UnifiedAlertSeverity): string {
  switch (severity) {
    case 'critical':
      return 'Critical';
    case 'high':
      return 'High';
    case 'warning':
      return 'Warning';
    case 'info':
      return 'Info';
    default:
      return 'Alert';
  }
}
