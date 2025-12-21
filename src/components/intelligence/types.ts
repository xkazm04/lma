'use client';

import type { LucideIcon } from 'lucide-react';

// ============================================
// Domain & Core Types
// ============================================

export type Domain = 'documents' | 'deals' | 'compliance' | 'esg';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type TrendDirection = 'improving' | 'stable' | 'declining';

export type SignalDirection = 'positive' | 'negative' | 'neutral';

export type PredictionStatus = 'new' | 'under_review' | 'acknowledged' | 'resolved' | 'dismissed';

export type ActionStatus = 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed' | 'expired';

// ============================================
// Intelligence Card Types (Unified Prediction)
// ============================================

export interface IntelligencePrediction {
  horizon: string; // "30d", "6m", "9m", "12m"
  probability: number;
  projected?: string;
}

export interface IntelligenceFactor {
  source: string;
  summary: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight?: number;
}

export interface IntelligenceMetric {
  label: string;
  value: string | number;
  unit?: string;
  trend?: TrendDirection;
  icon?: LucideIcon;
}

export interface IntelligenceItem {
  id: string;
  domain: Domain;

  // Core content
  title: string;
  subtitle?: string;
  description: string;

  // Classification
  severity: Severity;
  priority?: 'urgent' | 'high' | 'medium' | 'low';

  // AI analysis
  confidence: number; // 0-100
  aiSummary?: string;
  recommendedActions?: string[];

  // Timeline predictions
  predictions?: IntelligencePrediction[];

  // Current state (for progress tracking)
  currentValue?: number;
  targetValue?: number;
  unit?: string;

  // Metrics (domain-specific)
  metrics?: IntelligenceMetric[];

  // Contributing factors
  factors?: IntelligenceFactor[];

  // Related entity
  relatedEntity?: {
    type: string;
    id: string;
    name: string;
  };

  // Status tracking
  status: PredictionStatus;

  // Timestamps
  createdAt: string;
  updatedAt?: string;
}

// ============================================
// Alert Card Types
// ============================================

export interface AlertAction {
  label: string;
  action: string;
  variant?: 'default' | 'destructive' | 'outline';
  icon?: LucideIcon;
}

export interface AlertItem {
  id: string;
  domain: Domain;

  // Content
  type: string; // Domain-specific alert type
  title: string;
  message: string;

  // Classification
  severity: Severity;
  priority: 'critical' | 'high' | 'medium' | 'low';

  // State
  isRead: boolean;
  isDismissed: boolean;

  // Related entity
  relatedEntity?: {
    type: string;
    id: string;
    name: string;
  };

  // Actions
  actions?: AlertAction[];

  // Recommendation
  recommendation?: string;

  timestamp: string;
}

// ============================================
// Signal Card Types
// ============================================

export type SignalType = 'market' | 'transaction' | 'news' | 'benchmark' | 'activity';

export interface SignalItem {
  id: string;
  domain: Domain;

  // Content
  type: SignalType;
  title: string;
  summary: string;

  // Direction/sentiment
  direction: SignalDirection;
  changeValue?: number;
  changeUnit?: string;

  // Confidence
  confidence?: number;
  signalStrength?: 'strong' | 'moderate' | 'weak';

  // Source
  source?: string;

  timestamp: string;
}

// ============================================
// Metric Card Types
// ============================================

export interface MetricItem {
  id: string;
  domain?: Domain;

  // Display
  label: string;
  value: string | number;
  subValue?: string;

  // Trend
  trend?: TrendDirection;
  change?: string | number;
  changeDirection?: 'up' | 'down';

  // Icon
  icon?: LucideIcon;
  iconBgClass?: string;
  iconColorClass?: string;

  // Interactivity
  onClick?: () => void;
  drilldownLabel?: string;
}

// ============================================
// Intelligence Panel Types
// ============================================

export interface IntelligencePanelTab {
  id: string;
  label: string;
  icon?: LucideIcon;
  badgeCount?: number;
  badgeVariant?: 'default' | 'destructive' | 'warning' | 'secondary';
}

export interface IntelligencePanelConfig {
  domain: Domain;
  title: string;
  subtitle?: string;
  tabs: IntelligencePanelTab[];
  aiIcon?: LucideIcon;
}

// ============================================
// Inline AI Types
// ============================================

export interface InlineAIContext {
  domain: Domain;
  entityType: string;
  entityId: string;
  entityName?: string;
  additionalContext?: Record<string, unknown>;
}

export interface InlineAISuggestion {
  id: string;
  title: string;
  description: string;
  action?: string;
  confidence: number;
  impact?: 'high' | 'medium' | 'low';
  category?: string;
  source?: string;
  details?: string;
  actionItems?: string[];
}

export interface InlineAISource {
  type: string;
  reference: string;
  excerpt?: string;
}

export interface InlineAIResponse {
  explanation?: string;
  suggestions?: InlineAISuggestion[];
  analysis?: {
    summary: string;
    points: Array<{
      label: string;
      value: string;
      sentiment?: SignalDirection;
    }>;
  };
  sources?: InlineAISource[];
  confidence: number;
}

export type InlineAIAction = 'explain' | 'suggest' | 'analyze' | 'compare' | 'generate';

export type InlineAIVariant = 'tooltip' | 'popover' | 'inline-row' | 'floating-panel';

// ============================================
// Component Props Types
// ============================================

export interface IntelligenceCardProps {
  item: IntelligenceItem;
  compact?: boolean;
  showMetrics?: boolean;
  showFactors?: boolean;
  showActions?: boolean;
  onClick?: () => void;
  onAction?: (action: string) => void;
  className?: string;
  testId?: string;
}

export interface AlertCardProps {
  alert: AlertItem;
  compact?: boolean;
  onStatusChange?: (id: string, status: 'acknowledged' | 'resolved' | 'dismissed') => void;
  onAction?: (alertId: string, action: string) => void;
  className?: string;
  testId?: string;
}

export interface SignalCardProps {
  signal: SignalItem;
  compact?: boolean;
  onClick?: () => void;
  className?: string;
  testId?: string;
}

export interface MetricCardProps {
  metric: MetricItem;
  variant?: 'full' | 'compact' | 'inline';
  className?: string;
  testId?: string;
}

export interface InlineAIAssistProps {
  context: InlineAIContext;
  variant?: InlineAIVariant;
  actions?: InlineAIAction[];
  placeholder?: string;
  suggestions?: string[];
  onSuggestionAccept?: (suggestion: InlineAISuggestion) => void;
  onSuggestionDismiss?: (suggestionId: string) => void;
  className?: string;
  testId?: string;
}
