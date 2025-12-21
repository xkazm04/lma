// =============================================================================
// Live Testing Types
// =============================================================================

/**
 * Status of a data integration with external accounting systems.
 */
export type IntegrationStatus = 'active' | 'inactive' | 'error' | 'pending';

/**
 * Supported accounting system providers.
 */
export type AccountingProvider = 'quickbooks' | 'netsuite' | 'sage' | 'xero' | 'custom_api';

/**
 * Alert severity levels for headroom threshold crossings.
 */
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * Headroom alert thresholds configuration.
 */
export interface HeadroomThreshold {
  percentage: number; // e.g., 15, 10, 5
  severity: AlertSeverity;
  enabled: boolean;
  notification_channels: ('email' | 'sms' | 'slack' | 'in_app')[];
}

/**
 * Data integration with external accounting system.
 */
export interface DataIntegration {
  id: string;
  provider: AccountingProvider;
  provider_name: string;
  borrower_id: string;
  borrower_name: string;
  facility_id: string;
  facility_name: string;
  status: IntegrationStatus;
  last_sync_at: string | null;
  next_sync_at: string | null;
  sync_frequency: 'real_time' | 'hourly' | 'daily' | 'manual';
  api_credentials_valid: boolean;
  error_message: string | null;
  created_at: string;
}

/**
 * Real-time financial data point from accounting system.
 */
export interface FinancialDataPoint {
  id: string;
  integration_id: string;
  metric_name: string; // e.g., "total_debt", "ebitda", "cash_balance"
  metric_value: number;
  currency: string;
  period_start: string;
  period_end: string;
  as_of_date: string;
  synced_at: string;
}

/**
 * Live covenant with real-time calculation.
 */
export interface LiveCovenant {
  id: string;
  name: string;
  covenant_type: string;
  facility_id: string;
  facility_name: string;
  borrower_name: string;
  threshold_type: 'maximum' | 'minimum';
  current_threshold: number;

  // Real-time calculation
  current_value: number;
  current_headroom_percentage: number;
  current_headroom_absolute: number;
  last_calculated_at: string;

  // Trend analysis
  headroom_24h_ago: number | null;
  headroom_7d_ago: number | null;
  headroom_30d_ago: number | null;
  trend_direction: 'improving' | 'declining' | 'stable';
  velocity_percentage_per_day: number; // Rate of headroom change

  // Predictive metrics
  projected_headroom_7d: number | null;
  projected_headroom_30d: number | null;
  estimated_breach_date: string | null; // If trend continues

  // Integration status
  integration_id: string | null;
  integration_status: IntegrationStatus;
  data_freshness_minutes: number; // How fresh is the data

  // Alert status
  active_alerts: HeadroomAlert[];
  alert_count_24h: number;
}

/**
 * Headroom alert triggered when threshold is crossed.
 */
export interface HeadroomAlert {
  id: string;
  covenant_id: string;
  covenant_name: string;
  facility_name: string;
  borrower_name: string;
  severity: AlertSeverity;
  alert_type: 'threshold_crossed' | 'rapid_decline' | 'breach_imminent' | 'data_stale';

  // Alert details
  current_headroom: number;
  threshold_crossed: number; // e.g., 15%, 10%, 5%
  previous_headroom: number | null;
  change_percentage: number | null;

  // Message
  title: string;
  message: string;
  recommendation: string | null;

  // Timestamps
  triggered_at: string;
  acknowledged: boolean;
  acknowledged_at: string | null;
  acknowledged_by: string | null;

  // Notification tracking
  notifications_sent: string[]; // e.g., ["email", "slack"]
  notification_sent_at: string | null;
}

/**
 * Real-time calculation log entry.
 */
export interface CalculationLog {
  id: string;
  covenant_id: string;
  calculation_timestamp: string;

  // Input values
  input_metrics: Record<string, number>;

  // Calculation result
  calculated_value: number;
  threshold_value: number;
  headroom_percentage: number;
  test_result: 'pass' | 'fail';

  // Data sources
  data_integration_id: string | null;
  data_as_of: string;
  calculation_method: 'automatic' | 'manual';

  // Metadata
  triggered_by: 'scheduled_sync' | 'manual_refresh' | 'webhook' | 'real_time_stream';
}

/**
 * Headroom trajectory point for charting.
 */
export interface HeadroomTrajectoryPoint {
  timestamp: string;
  headroom_percentage: number;
  calculated_value: number;
  threshold_value: number;
  is_projected: boolean; // True for future predictions
}

/**
 * Live testing dashboard statistics.
 */
export interface LiveTestingStats {
  total_covenants: number;
  covenants_monitored_live: number;
  covenants_critical: number; // <5% headroom
  covenants_warning: number; // 5-15% headroom
  covenants_healthy: number; // >15% headroom

  active_integrations: number;
  total_integrations: number;
  integrations_with_errors: number;

  alerts_last_24h: number;
  alerts_unacknowledged: number;

  last_sync_timestamp: string | null;
  next_scheduled_sync: string | null;
}

/**
 * Alert threshold configuration for a facility or portfolio.
 */
export interface AlertThresholdConfig {
  id: string;
  scope: 'global' | 'facility' | 'covenant';
  scope_id: string | null; // facility_id or covenant_id if not global

  thresholds: HeadroomThreshold[];

  // Additional alert triggers
  rapid_decline_enabled: boolean;
  rapid_decline_percentage: number; // Alert if headroom drops X% in 24h

  breach_prediction_enabled: boolean;
  breach_prediction_days: number; // Alert if breach predicted within X days

  stale_data_enabled: boolean;
  stale_data_hours: number; // Alert if data hasn't updated in X hours

  updated_at: string;
  updated_by: string;
}

/**
 * Default alert threshold configuration.
 */
export const DEFAULT_ALERT_THRESHOLDS: HeadroomThreshold[] = [
  {
    percentage: 15,
    severity: 'medium',
    enabled: true,
    notification_channels: ['email', 'in_app'],
  },
  {
    percentage: 10,
    severity: 'high',
    enabled: true,
    notification_channels: ['email', 'sms', 'in_app'],
  },
  {
    percentage: 5,
    severity: 'critical',
    enabled: true,
    notification_channels: ['email', 'sms', 'slack', 'in_app'],
  },
];

/**
 * Helper function for alert severity color styling.
 */
export function getAlertSeverityColor(severity: AlertSeverity): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'high':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'medium':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'low':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'info':
      return 'bg-zinc-100 text-zinc-700 border-zinc-200';
  }
}

/**
 * Helper function for integration status color styling.
 */
export function getIntegrationStatusColor(status: IntegrationStatus): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-700';
    case 'inactive':
      return 'bg-zinc-100 text-zinc-700';
    case 'error':
      return 'bg-red-100 text-red-700';
    case 'pending':
      return 'bg-amber-100 text-amber-700';
  }
}

/**
 * Helper function for accounting provider labels.
 */
export function getAccountingProviderLabel(provider: AccountingProvider): string {
  switch (provider) {
    case 'quickbooks':
      return 'QuickBooks Online';
    case 'netsuite':
      return 'NetSuite';
    case 'sage':
      return 'Sage Intacct';
    case 'xero':
      return 'Xero';
    case 'custom_api':
      return 'Custom API';
  }
}
