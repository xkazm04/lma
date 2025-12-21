// =============================================================================
// Predictive Compliance Autopilot Types
// =============================================================================

import type {
  Covenant,
  PredictionRiskLevel,
  IndustrySector,
  BenchmarkCovenantType
} from '../../lib/types';

/**
 * Signal source types for multi-signal intelligence
 */
export type SignalSource =
  | 'market_data'
  | 'transaction_patterns'
  | 'news_sentiment'
  | 'industry_benchmarks'
  | 'historical_trends'
  | 'seasonal_patterns'
  | 'peer_comparison'
  | 'macro_indicators';

/**
 * Signal strength indicator
 */
export type SignalStrength = 'weak' | 'moderate' | 'strong' | 'very_strong';

/**
 * Remediation strategy type
 */
export type RemediationStrategyType =
  | 'covenant_amendment'
  | 'waiver_request'
  | 'operational_improvement'
  | 'debt_restructuring'
  | 'asset_sale'
  | 'equity_injection'
  | 'refinancing'
  | 'stakeholder_negotiation';

/**
 * Notification priority levels
 */
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Notification channel types
 */
export type NotificationChannel = 'email' | 'sms' | 'in_app' | 'webhook';

/**
 * Autopilot action status
 */
export type AutopilotActionStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'failed';

// =============================================================================
// Signal Types
// =============================================================================

/**
 * External market signal data
 */
export interface MarketSignal {
  id: string;
  source: SignalSource;
  signal_type: string;
  signal_strength: SignalStrength;
  timestamp: string;

  // Signal data
  data_point: string;
  value: number;
  change_percentage: number;
  direction: 'positive' | 'negative' | 'neutral';

  // Impact assessment
  impact_on_covenant: string;
  confidence: number;

  // Context
  description: string;
  source_url?: string;
}

/**
 * Borrower transaction pattern signal
 */
export interface TransactionPatternSignal {
  id: string;
  borrower_id: string;
  borrower_name: string;
  facility_id: string;

  // Pattern details
  pattern_type: 'cash_flow' | 'revenue' | 'expenses' | 'debt_service' | 'inventory' | 'receivables';
  pattern_description: string;

  // Trend analysis
  trend_direction: 'improving' | 'stable' | 'declining';
  trend_velocity: number; // Rate of change
  trend_acceleration: number;

  // Impact
  impact_on_covenants: string[];
  risk_contribution: number; // 0-100

  // Time series
  historical_values: Array<{
    period: string;
    value: number;
  }>;

  // Metadata
  detected_at: string;
  data_freshness: 'real_time' | 'daily' | 'weekly' | 'monthly';
}

/**
 * News sentiment signal
 */
export interface NewsSentimentSignal {
  id: string;
  borrower_id?: string;
  industry?: IndustrySector;

  // Sentiment analysis
  sentiment_score: number; // -1 to 1
  sentiment_label: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
  confidence: number;

  // Source details
  article_title: string;
  article_summary: string;
  source_name: string;
  published_at: string;

  // Entity mentions
  entities_mentioned: string[];
  topics: string[];

  // Impact assessment
  credit_relevance: number; // 0-100
  potential_covenant_impact: string;
}

/**
 * Industry benchmark signal
 */
export interface BenchmarkSignal {
  id: string;
  industry: IndustrySector;
  covenant_type: BenchmarkCovenantType;

  // Benchmark data
  current_median: number;
  previous_median: number;
  change_percentage: number;

  // Peer comparison
  borrower_position: 'above_median' | 'at_median' | 'below_median';
  percentile_rank: number;

  // Trend
  market_trend: 'tightening' | 'stable' | 'loosening';

  // Alert
  requires_attention: boolean;
  attention_reason?: string;
}

// =============================================================================
// Predictive Breach Analysis Types
// =============================================================================

/**
 * Enhanced breach prediction with multi-signal intelligence
 */
export interface AutopilotBreachPrediction {
  id: string;
  covenant_id: string;
  covenant_name: string;
  facility_id: string;
  facility_name: string;
  borrower_id: string;
  borrower_name: string;

  // Prediction timeline (6-12 months out)
  prediction_date: string;
  prediction_horizon_months: 6 | 9 | 12;

  // Risk assessment
  breach_probability_6m: number;
  breach_probability_9m: number;
  breach_probability_12m: number;
  overall_risk_level: PredictionRiskLevel;
  confidence_score: number;

  // Projected breach timing
  projected_breach_date: string | null;
  projected_breach_quarter: string | null;
  days_until_projected_breach: number | null;

  // Multi-signal analysis
  contributing_signals: ContributingSignal[];
  signal_correlation_score: number;

  // Quarterly projections
  quarterly_projections: QuarterlyProjection[];

  // Leading indicators
  leading_indicators: LeadingIndicator[];

  // Root cause analysis
  root_causes: RootCause[];

  // Summary and recommendations
  summary: string;
  key_risks: string[];
  immediate_actions: string[];

  // Metadata
  generated_at: string;
  model_version: string;
  data_sources_used: SignalSource[];
}

/**
 * Contributing signal to breach prediction
 */
export interface ContributingSignal {
  signal_source: SignalSource;
  signal_id: string;
  signal_summary: string;

  impact: 'positive' | 'negative' | 'neutral';
  weight: number; // 0-100
  confidence: number;

  data_freshness: string;
  last_updated: string;
}

/**
 * Quarterly projection with multi-signal support
 */
export interface QuarterlyProjection {
  quarter: string;
  projected_ratio: number;
  breach_probability: number;
  confidence: number;

  // Key drivers for this quarter
  key_drivers: string[];

  // Scenario analysis
  optimistic_ratio: number;
  pessimistic_ratio: number;
}

/**
 * Leading indicator for early warning
 */
export interface LeadingIndicator {
  indicator_name: string;
  indicator_type: SignalSource;

  current_value: number;
  threshold_value: number;

  status: 'normal' | 'warning' | 'critical';
  trend: 'improving' | 'stable' | 'deteriorating';

  lead_time_months: number;
  historical_accuracy: number;

  description: string;
}

/**
 * Root cause analysis result
 */
export interface RootCause {
  cause_type: string;
  description: string;
  contribution_percentage: number;

  addressable: boolean;
  recommended_action?: string;

  confidence: number;
}

// =============================================================================
// Remediation Strategy Types
// =============================================================================

/**
 * Auto-generated remediation strategy
 */
export interface RemediationStrategy {
  id: string;
  prediction_id: string;
  covenant_id: string;

  // Strategy details
  strategy_type: RemediationStrategyType;
  strategy_title: string;
  strategy_description: string;

  // Effectiveness assessment
  estimated_effectiveness: number; // 0-100
  implementation_difficulty: 'low' | 'medium' | 'high';
  time_to_implement: string; // e.g., "2-4 weeks"

  // Impact projections
  projected_headroom_improvement: number;
  projected_breach_probability_reduction: number;

  // Steps
  implementation_steps: ImplementationStep[];

  // Stakeholders
  required_approvals: string[];
  key_stakeholders: string[];

  // Risks
  implementation_risks: string[];

  // Cost estimate
  estimated_cost: CostEstimate | null;

  // Priority
  priority: NotificationPriority;
  recommended_start_date: string;

  // Status
  status: AutopilotActionStatus;

  // Metadata
  generated_at: string;
  expires_at?: string;
}

/**
 * Implementation step for remediation
 */
export interface ImplementationStep {
  step_number: number;
  title: string;
  description: string;

  responsible_party: string;
  due_date?: string;

  status: AutopilotActionStatus;
  completed_at?: string;

  dependencies: number[]; // Step numbers

  documents_required: string[];
  notes?: string;
}

/**
 * Cost estimate for remediation
 */
export interface CostEstimate {
  currency: string;

  direct_costs: number;
  indirect_costs: number;
  total_estimated_cost: number;

  cost_breakdown: Array<{
    category: string;
    amount: number;
    description: string;
  }>;

  confidence_level: 'low' | 'medium' | 'high';
}

// =============================================================================
// Notification Types
// =============================================================================

/**
 * Autopilot notification configuration
 */
export interface NotificationConfig {
  id: string;
  user_id: string;

  // Trigger conditions
  trigger_risk_level: PredictionRiskLevel;
  trigger_probability_threshold: number;
  trigger_days_before_breach: number;

  // Channels
  enabled_channels: NotificationChannel[];

  // Recipients
  email_recipients: string[];
  sms_recipients: string[];
  webhook_urls: string[];

  // Frequency
  max_notifications_per_day: number;
  digest_enabled: boolean;
  digest_frequency: 'daily' | 'weekly';

  // Filters
  covenant_types?: BenchmarkCovenantType[];
  facility_ids?: string[];
  borrower_ids?: string[];

  // Status
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Notification sent by autopilot
 */
export interface AutopilotNotification {
  id: string;
  config_id: string;

  // Content
  title: string;
  message: string;
  priority: NotificationPriority;

  // Related entities
  prediction_id: string;
  covenant_id: string;
  facility_id: string;
  borrower_name: string;

  // Trigger info
  trigger_type: 'risk_level_change' | 'probability_threshold' | 'days_to_breach' | 'new_signal';
  trigger_details: string;

  // Delivery
  channels_sent: NotificationChannel[];
  sent_at: string;

  // Response
  read_at?: string;
  acknowledged_at?: string;
  acknowledged_by?: string;

  // Actions taken
  actions_taken: Array<{
    action: string;
    taken_at: string;
    taken_by: string;
  }>;
}

// =============================================================================
// Dashboard Stats Types
// =============================================================================

/**
 * Autopilot dashboard statistics
 */
export interface AutopilotDashboardStats {
  as_of_date: string;

  // Prediction stats
  total_predictions_active: number;
  predictions_by_risk_level: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };

  // Signal stats
  total_signals_processed: number;
  signals_by_source: Record<SignalSource, number>;
  new_signals_24h: number;

  // Breach projections
  projected_breaches_6m: number;
  projected_breaches_12m: number;
  average_days_to_breach: number | null;

  // Remediation stats
  active_remediations: number;
  remediations_completed_30d: number;
  remediation_success_rate: number;

  // Notification stats
  notifications_sent_24h: number;
  notifications_pending: number;

  // Coverage
  covenants_monitored: number;
  facilities_monitored: number;
  data_coverage_percentage: number;

  // Model performance
  prediction_accuracy_6m: number;
  prediction_accuracy_12m: number;
  model_confidence_average: number;
}

/**
 * Autopilot alert for the dashboard
 */
export interface AutopilotAlert {
  id: string;
  alert_type: 'new_high_risk' | 'risk_escalation' | 'new_signal' | 'remediation_due' | 'breach_imminent';
  priority: NotificationPriority;

  title: string;
  message: string;

  // Related entities
  prediction_id?: string;
  covenant_id?: string;
  facility_id?: string;
  borrower_name?: string;

  // Actions
  suggested_actions: string[];

  // Status
  created_at: string;
  acknowledged: boolean;
  acknowledged_at?: string;
  acknowledged_by?: string;

  // Snooze
  snoozed_until?: string;
}

// =============================================================================
// Filter Types
// =============================================================================

/**
 * Autopilot filter options
 */
export interface AutopilotFilterOptions {
  risk_levels: PredictionRiskLevel[];
  signal_sources: SignalSource[];
  time_horizon: '6m' | '9m' | '12m';

  facility_ids?: string[];
  borrower_ids?: string[];
  covenant_types?: BenchmarkCovenantType[];

  show_only_actionable: boolean;
  show_acknowledged: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get color for signal strength
 */
export function getSignalStrengthColor(strength: SignalStrength): string {
  switch (strength) {
    case 'weak':
      return 'bg-zinc-100 text-zinc-700';
    case 'moderate':
      return 'bg-blue-100 text-blue-700';
    case 'strong':
      return 'bg-amber-100 text-amber-700';
    case 'very_strong':
      return 'bg-red-100 text-red-700';
  }
}

/**
 * Get color for signal source
 */
export function getSignalSourceColor(source: SignalSource): string {
  switch (source) {
    case 'market_data':
      return 'bg-blue-100 text-blue-700';
    case 'transaction_patterns':
      return 'bg-purple-100 text-purple-700';
    case 'news_sentiment':
      return 'bg-orange-100 text-orange-700';
    case 'industry_benchmarks':
      return 'bg-green-100 text-green-700';
    case 'historical_trends':
      return 'bg-indigo-100 text-indigo-700';
    case 'seasonal_patterns':
      return 'bg-cyan-100 text-cyan-700';
    case 'peer_comparison':
      return 'bg-pink-100 text-pink-700';
    case 'macro_indicators':
      return 'bg-amber-100 text-amber-700';
  }
}

/**
 * Get label for signal source
 */
export function getSignalSourceLabel(source: SignalSource): string {
  switch (source) {
    case 'market_data':
      return 'Market Data';
    case 'transaction_patterns':
      return 'Transaction Patterns';
    case 'news_sentiment':
      return 'News Sentiment';
    case 'industry_benchmarks':
      return 'Industry Benchmarks';
    case 'historical_trends':
      return 'Historical Trends';
    case 'seasonal_patterns':
      return 'Seasonal Patterns';
    case 'peer_comparison':
      return 'Peer Comparison';
    case 'macro_indicators':
      return 'Macro Indicators';
  }
}

/**
 * Get icon for remediation strategy type
 */
export function getRemediationStrategyIcon(type: RemediationStrategyType): string {
  switch (type) {
    case 'covenant_amendment':
      return 'FileEdit';
    case 'waiver_request':
      return 'FileCheck';
    case 'operational_improvement':
      return 'Cog';
    case 'debt_restructuring':
      return 'GitBranch';
    case 'asset_sale':
      return 'Building';
    case 'equity_injection':
      return 'TrendingUp';
    case 'refinancing':
      return 'RefreshCw';
    case 'stakeholder_negotiation':
      return 'Users';
  }
}

/**
 * Get label for remediation strategy type
 */
export function getRemediationStrategyLabel(type: RemediationStrategyType): string {
  switch (type) {
    case 'covenant_amendment':
      return 'Covenant Amendment';
    case 'waiver_request':
      return 'Waiver Request';
    case 'operational_improvement':
      return 'Operational Improvement';
    case 'debt_restructuring':
      return 'Debt Restructuring';
    case 'asset_sale':
      return 'Asset Sale';
    case 'equity_injection':
      return 'Equity Injection';
    case 'refinancing':
      return 'Refinancing';
    case 'stakeholder_negotiation':
      return 'Stakeholder Negotiation';
  }
}

/**
 * Get notification priority color
 */
export function getNotificationPriorityColor(priority: NotificationPriority): string {
  switch (priority) {
    case 'low':
      return 'bg-zinc-100 text-zinc-700';
    case 'medium':
      return 'bg-blue-100 text-blue-700';
    case 'high':
      return 'bg-amber-100 text-amber-700';
    case 'critical':
      return 'bg-red-100 text-red-700';
  }
}
