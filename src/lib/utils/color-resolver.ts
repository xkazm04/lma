/**
 * Unified Color Resolver
 *
 * A centralized, theme-aware utility for consistent color mapping across
 * all risk, severity, and correlation visualizations in the application.
 *
 * This consolidates duplicate color-mapping functions:
 * - getSeverityColor, getSeverityVariant (from risk-correlation-utils)
 * - getCorrelationColor, getCorrelationBgColor (from risk-correlation-utils)
 * - getRiskColor (from portfolio-3d/graph-utils)
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Risk severity levels used throughout the application
 */
export type RiskSeverity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Badge variants matching the UI component library
 */
export type BadgeVariant = 'destructive' | 'warning' | 'success' | 'secondary' | 'default';

/**
 * Color output formats
 */
export type ColorFormat = 'tailwind-text' | 'tailwind-bg' | 'hex';

/**
 * Color configuration for a severity level
 */
export interface SeverityColorConfig {
  text: string;
  bg: string;
  hex: string;
  variant: BadgeVariant;
}

/**
 * Color configuration for correlation strength
 */
export interface CorrelationColorConfig {
  text: string;
  bg: string;
  hex: string;
  label: string;
}

// =============================================================================
// Color Definitions
// =============================================================================

/**
 * Centralized severity color palette
 */
const SEVERITY_COLORS: Record<RiskSeverity, SeverityColorConfig> = {
  critical: {
    text: 'text-red-700',
    bg: 'bg-red-100',
    hex: '#ef4444',
    variant: 'destructive',
  },
  high: {
    text: 'text-red-600',
    bg: 'bg-red-50',
    hex: '#f97316',
    variant: 'destructive',
  },
  medium: {
    text: 'text-amber-600',
    bg: 'bg-amber-100',
    hex: '#eab308',
    variant: 'warning',
  },
  low: {
    text: 'text-green-600',
    bg: 'bg-green-100',
    hex: '#22c55e',
    variant: 'success',
  },
};

/**
 * Default color configuration for unknown severity
 */
const DEFAULT_SEVERITY_CONFIG: SeverityColorConfig = {
  text: 'text-zinc-600',
  bg: 'bg-zinc-100',
  hex: '#6b7280',
  variant: 'secondary',
};

/**
 * Correlation strength thresholds and their associated colors
 */
const CORRELATION_THRESHOLDS = [
  { min: 0.7, config: { text: 'text-red-600', bg: 'bg-red-100', hex: '#ef4444', label: 'Strong' } },
  { min: 0.5, config: { text: 'text-amber-600', bg: 'bg-amber-100', hex: '#f97316', label: 'Moderate' } },
  { min: 0.3, config: { text: 'text-yellow-600', bg: 'bg-yellow-100', hex: '#eab308', label: 'Weak' } },
  { min: 0, config: { text: 'text-green-600', bg: 'bg-green-100', hex: '#6b7280', label: 'Minimal' } },
];

// =============================================================================
// Primary API Functions
// =============================================================================

/**
 * Get complete color configuration for a severity level
 *
 * @param severity - The risk severity level
 * @returns Complete color configuration object
 *
 * @example
 * const config = getSeverityColors('high');
 * // { text: 'text-red-600', bg: 'bg-red-50', hex: '#f97316', variant: 'destructive' }
 */
export function getSeverityColors(severity: RiskSeverity | string): SeverityColorConfig {
  const normalizedSeverity = severity?.toLowerCase() as RiskSeverity;
  return SEVERITY_COLORS[normalizedSeverity] ?? DEFAULT_SEVERITY_CONFIG;
}

/**
 * Get text color class for severity level
 *
 * @param severity - The risk severity level
 * @returns Tailwind text color class
 *
 * @example
 * <span className={getSeverityColor('critical')}>Critical Issue</span>
 */
export function getSeverityColor(severity: RiskSeverity | string): string {
  return getSeverityColors(severity).text;
}

/**
 * Get background color class for severity level
 *
 * @param severity - The risk severity level
 * @returns Tailwind background color class
 *
 * @example
 * <div className={getSeverityBgColor('medium')}>Warning Area</div>
 */
export function getSeverityBgColor(severity: RiskSeverity | string): string {
  return getSeverityColors(severity).bg;
}

/**
 * Get hex color for severity level (useful for canvas/SVG rendering)
 *
 * @param severity - The risk severity level
 * @returns Hex color string
 *
 * @example
 * context.fillStyle = getSeverityHexColor('low');
 */
export function getSeverityHexColor(severity: RiskSeverity | string): string {
  return getSeverityColors(severity).hex;
}

/**
 * Get badge variant for severity level
 *
 * @param severity - The risk severity level
 * @returns Badge variant for UI component
 *
 * @example
 * <Badge variant={getSeverityVariant('high')}>High Risk</Badge>
 */
export function getSeverityVariant(severity: RiskSeverity | string): BadgeVariant {
  return getSeverityColors(severity).variant;
}

/**
 * Get complete color configuration for correlation strength
 *
 * @param strength - Correlation strength (0-1)
 * @returns Complete color configuration object
 *
 * @example
 * const config = getCorrelationColors(0.75);
 * // { text: 'text-red-600', bg: 'bg-red-100', hex: '#ef4444', label: 'Strong' }
 */
export function getCorrelationColors(strength: number): CorrelationColorConfig {
  const clampedStrength = Math.max(0, Math.min(1, strength));
  for (const threshold of CORRELATION_THRESHOLDS) {
    if (clampedStrength >= threshold.min) {
      return threshold.config;
    }
  }
  return CORRELATION_THRESHOLDS[CORRELATION_THRESHOLDS.length - 1].config;
}

/**
 * Get text color class for correlation strength
 *
 * @param strength - Correlation strength (0-1)
 * @returns Tailwind text color class
 *
 * @example
 * <span className={getCorrelationColor(0.8)}>80% Correlated</span>
 */
export function getCorrelationColor(strength: number): string {
  return getCorrelationColors(strength).text;
}

/**
 * Get background color class for correlation strength
 *
 * @param strength - Correlation strength (0-1)
 * @returns Tailwind background color class
 *
 * @example
 * <div className={getCorrelationBgColor(0.5)}>Correlation Area</div>
 */
export function getCorrelationBgColor(strength: number): string {
  return getCorrelationColors(strength).bg;
}

/**
 * Get hex color for correlation strength (useful for canvas/SVG rendering)
 *
 * @param strength - Correlation strength (0-1)
 * @returns Hex color string
 *
 * @example
 * line.stroke = getCorrelationHexColor(0.6);
 */
export function getCorrelationHexColor(strength: number): string {
  return getCorrelationColors(strength).hex;
}

/**
 * Get label for correlation strength
 *
 * @param strength - Correlation strength (0-1)
 * @returns Human-readable label
 *
 * @example
 * `${getCorrelationLabel(0.75)} correlation` // "Strong correlation"
 */
export function getCorrelationLabel(strength: number): string {
  return getCorrelationColors(strength).label;
}

// =============================================================================
// Legacy Alias (for portfolio-3d compatibility)
// =============================================================================

/**
 * Alias for getSeverityHexColor - used in 3D visualizations
 *
 * @param severity - The risk severity level
 * @returns Hex color string
 *
 * @deprecated Use getSeverityHexColor instead for clarity
 */
export function getRiskColor(severity: RiskSeverity | string): string {
  return getSeverityHexColor(severity);
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Convert severity to a numeric multiplier for calculations
 *
 * @param severity - The risk severity level
 * @returns Numeric multiplier (0-1)
 *
 * @example
 * const impact = baseImpact * getSeverityMultiplier('high'); // 0.8
 */
export function getSeverityMultiplier(severity: RiskSeverity | string): number {
  const normalizedSeverity = severity?.toLowerCase() as RiskSeverity;
  const multipliers: Record<RiskSeverity, number> = {
    critical: 1.0,
    high: 0.8,
    medium: 0.5,
    low: 0.3,
  };
  return multipliers[normalizedSeverity] ?? 0.5;
}

/**
 * Derive severity from a probability/risk value
 *
 * @param probability - Probability value (0-1)
 * @returns Derived severity level
 *
 * @example
 * const severity = deriveSeverityFromProbability(0.75); // 'critical'
 */
export function deriveSeverityFromProbability(probability: number): RiskSeverity {
  if (probability >= 0.7) return 'critical';
  if (probability >= 0.5) return 'high';
  if (probability >= 0.3) return 'medium';
  return 'low';
}

/**
 * Check if severity is considered high priority
 *
 * @param severity - The risk severity level
 * @returns True if severity is critical or high
 */
export function isHighPrioritySeverity(severity: RiskSeverity | string): boolean {
  const normalizedSeverity = severity?.toLowerCase() as RiskSeverity;
  return normalizedSeverity === 'critical' || normalizedSeverity === 'high';
}

// =============================================================================
// Unified Status Color System
// =============================================================================

/**
 * Status color category types supported by the unified getStatusColor utility.
 * Each category maps to a specific domain's status values.
 */
export type StatusColorCategory =
  | 'alert_severity'
  | 'notification_priority'
  | 'document_status'
  | 'signal_strength'
  | 'signal_source'
  | 'signature_status'
  | 'integration_status';

/**
 * Alert severity levels (used in Agent and LiveTesting)
 */
export type AlertSeverityStatus = 'critical' | 'high' | 'medium' | 'low' | 'info' | 'warning';

/**
 * Notification priority levels (used in Autopilot)
 */
export type NotificationPriorityStatus = 'critical' | 'high' | 'medium' | 'low';

/**
 * Document status values (used in DocumentGeneration)
 */
export type DocumentStatusType =
  | 'draft'
  | 'pending_review'
  | 'pending_signature'
  | 'partially_signed'
  | 'completed'
  | 'rejected'
  | 'expired';

/**
 * Signal strength values (used in Autopilot SignalFeed)
 */
export type SignalStrengthStatus = 'weak' | 'moderate' | 'strong' | 'very_strong';

/**
 * Signal source values (used in Autopilot PredictionCard)
 */
export type SignalSourceStatus =
  | 'market_data'
  | 'transaction_patterns'
  | 'news_sentiment'
  | 'industry_benchmarks'
  | 'historical_trends'
  | 'seasonal_patterns'
  | 'peer_comparison'
  | 'macro_indicators';

/**
 * Signature status values (used in DocumentGeneration)
 */
export type SignatureStatusType = 'pending' | 'viewed' | 'signed' | 'declined' | 'expired';

/**
 * Integration status values (used in LiveTesting)
 */
export type IntegrationStatusType = 'active' | 'inactive' | 'error' | 'pending';

/**
 * Union type of all supported status values
 */
export type StatusValue =
  | AlertSeverityStatus
  | NotificationPriorityStatus
  | DocumentStatusType
  | SignalStrengthStatus
  | SignalSourceStatus
  | SignatureStatusType
  | IntegrationStatusType;

/**
 * Status color configuration with optional border
 */
export interface StatusColorConfig {
  bg: string;
  text: string;
  border?: string;
}

/**
 * Centralized status color mappings by category.
 * All colors use consistent Tailwind classes with -100 for backgrounds
 * and -700 for text to ensure visual consistency.
 */
const STATUS_COLOR_MAPPINGS: Record<StatusColorCategory, Record<string, StatusColorConfig>> = {
  alert_severity: {
    critical: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
    high: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
    warning: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
    medium: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
    low: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    info: { bg: 'bg-zinc-100', text: 'text-zinc-700', border: 'border-zinc-200' },
  },
  notification_priority: {
    critical: { bg: 'bg-red-100', text: 'text-red-700' },
    high: { bg: 'bg-amber-100', text: 'text-amber-700' },
    medium: { bg: 'bg-blue-100', text: 'text-blue-700' },
    low: { bg: 'bg-zinc-100', text: 'text-zinc-700' },
  },
  document_status: {
    draft: { bg: 'bg-zinc-100', text: 'text-zinc-700' },
    pending_review: { bg: 'bg-amber-100', text: 'text-amber-700' },
    pending_signature: { bg: 'bg-blue-100', text: 'text-blue-700' },
    partially_signed: { bg: 'bg-purple-100', text: 'text-purple-700' },
    completed: { bg: 'bg-green-100', text: 'text-green-700' },
    rejected: { bg: 'bg-red-100', text: 'text-red-700' },
    expired: { bg: 'bg-zinc-200', text: 'text-zinc-500' },
  },
  signal_strength: {
    weak: { bg: 'bg-zinc-100', text: 'text-zinc-700' },
    moderate: { bg: 'bg-blue-100', text: 'text-blue-700' },
    strong: { bg: 'bg-amber-100', text: 'text-amber-700' },
    very_strong: { bg: 'bg-red-100', text: 'text-red-700' },
  },
  signal_source: {
    market_data: { bg: 'bg-blue-100', text: 'text-blue-700' },
    transaction_patterns: { bg: 'bg-purple-100', text: 'text-purple-700' },
    news_sentiment: { bg: 'bg-orange-100', text: 'text-orange-700' },
    industry_benchmarks: { bg: 'bg-green-100', text: 'text-green-700' },
    historical_trends: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
    seasonal_patterns: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
    peer_comparison: { bg: 'bg-pink-100', text: 'text-pink-700' },
    macro_indicators: { bg: 'bg-amber-100', text: 'text-amber-700' },
  },
  signature_status: {
    pending: { bg: 'bg-zinc-100', text: 'text-zinc-700' },
    viewed: { bg: 'bg-blue-100', text: 'text-blue-700' },
    signed: { bg: 'bg-green-100', text: 'text-green-700' },
    declined: { bg: 'bg-red-100', text: 'text-red-700' },
    expired: { bg: 'bg-zinc-200', text: 'text-zinc-500' },
  },
  integration_status: {
    active: { bg: 'bg-green-100', text: 'text-green-700' },
    inactive: { bg: 'bg-zinc-100', text: 'text-zinc-700' },
    error: { bg: 'bg-red-100', text: 'text-red-700' },
    pending: { bg: 'bg-amber-100', text: 'text-amber-700' },
  },
};

/**
 * Default color config for unknown status values
 */
const DEFAULT_STATUS_COLOR: StatusColorConfig = {
  bg: 'bg-zinc-100',
  text: 'text-zinc-700',
  border: 'border-zinc-200',
};

/**
 * Get the full color configuration for a status value.
 *
 * @param category - The status category (e.g., 'alert_severity', 'document_status')
 * @param status - The status value to get colors for
 * @returns StatusColorConfig with bg, text, and optional border classes
 *
 * @example
 * const colors = getStatusColorConfig('alert_severity', 'critical');
 * // { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' }
 */
export function getStatusColorConfig(
  category: StatusColorCategory,
  status: string
): StatusColorConfig {
  const categoryMappings = STATUS_COLOR_MAPPINGS[category];
  if (!categoryMappings) {
    return DEFAULT_STATUS_COLOR;
  }
  return categoryMappings[status] ?? DEFAULT_STATUS_COLOR;
}

/**
 * Get combined background and text color classes for a status value.
 * This is the primary API for most use cases.
 *
 * @param category - The status category
 * @param status - The status value
 * @returns Combined Tailwind classes (e.g., 'bg-red-100 text-red-700')
 *
 * @example
 * // In a Badge component
 * <Badge className={getStatusColor('alert_severity', 'critical')}>Critical</Badge>
 *
 * @example
 * // With border for cards
 * <div className={cn(getStatusColor('alert_severity', 'high'), 'border border-orange-200')}>
 */
export function getStatusColor(category: StatusColorCategory, status: string): string {
  const config = getStatusColorConfig(category, status);
  return `${config.bg} ${config.text}`;
}

/**
 * Get background, text, and border classes for a status value.
 * Use this when you need border styling (e.g., for cards or panels).
 *
 * @param category - The status category
 * @param status - The status value
 * @returns Combined Tailwind classes including border
 *
 * @example
 * <div className={getStatusColorWithBorder('alert_severity', 'critical')}>
 *   Critical Alert
 * </div>
 */
export function getStatusColorWithBorder(
  category: StatusColorCategory,
  status: string
): string {
  const config = getStatusColorConfig(category, status);
  const border = config.border ?? `border-${config.bg.replace('bg-', '').replace('-100', '-200')}`;
  return `${config.bg} ${config.text} ${border}`;
}

// =============================================================================
// Convenience Functions (type-safe wrappers)
// =============================================================================

/**
 * Get color classes for alert severity levels.
 * Replaces: getAlertSeverityColor from Agent types.ts and LiveTesting types.ts
 *
 * @param severity - Alert severity ('critical' | 'high' | 'medium' | 'low' | 'info' | 'warning')
 * @returns Tailwind color classes with background, text, and border
 *
 * @example
 * <div className={getAlertSeverityColor('critical')}>Critical Alert</div>
 */
export function getAlertSeverityColor(severity: AlertSeverityStatus): string {
  return getStatusColorWithBorder('alert_severity', severity);
}

/**
 * Get color classes for notification priority levels.
 * Replaces: getNotificationPriorityColor from Autopilot types.ts
 *
 * @param priority - Notification priority ('critical' | 'high' | 'medium' | 'low')
 * @returns Tailwind color classes
 *
 * @example
 * <Badge className={getNotificationPriorityColor('high')}>High Priority</Badge>
 */
export function getNotificationPriorityColor(priority: NotificationPriorityStatus): string {
  return getStatusColor('notification_priority', priority);
}

/**
 * Get color classes for document status values.
 * Replaces: getDocumentStatusColor from document-generation-types.ts
 *
 * @param status - Document status value
 * @returns Tailwind color classes
 *
 * @example
 * <Badge className={getDocumentStatusColor('pending_signature')}>Awaiting Signature</Badge>
 */
export function getDocumentStatusColor(status: DocumentStatusType): string {
  return getStatusColor('document_status', status);
}

/**
 * Get color classes for signal strength indicators.
 * Replaces: getSignalStrengthColor from Autopilot types.ts
 *
 * @param strength - Signal strength value
 * @returns Tailwind color classes
 *
 * @example
 * <Badge className={getSignalStrengthColor('strong')}>Strong</Badge>
 */
export function getSignalStrengthColor(strength: SignalStrengthStatus): string {
  return getStatusColor('signal_strength', strength);
}

/**
 * Get color classes for signal source types.
 * Replaces: getSignalSourceColor from Autopilot types.ts
 *
 * @param source - Signal source type
 * @returns Tailwind color classes
 *
 * @example
 * <Badge className={getSignalSourceColor('market_data')}>Market Data</Badge>
 */
export function getSignalSourceColor(source: SignalSourceStatus): string {
  return getStatusColor('signal_source', source);
}

/**
 * Get color classes for signature status values.
 * Replaces: getSignatureStatusColor from document-generation-types.ts
 *
 * @param status - Signature status value
 * @returns Tailwind color classes
 *
 * @example
 * <Badge className={getSignatureStatusColor('signed')}>Signed</Badge>
 */
export function getSignatureStatusColor(status: SignatureStatusType): string {
  return getStatusColor('signature_status', status);
}

/**
 * Get color classes for integration status values.
 * Replaces: getIntegrationStatusColor from LiveTesting types.ts
 *
 * @param status - Integration status value
 * @returns Tailwind color classes
 *
 * @example
 * <Badge className={getIntegrationStatusColor('active')}>Active</Badge>
 */
export function getIntegrationStatusColor(status: IntegrationStatusType): string {
  return getStatusColor('integration_status', status);
}
