/**
 * Portfolio Autopilot Types
 *
 * Types for the AI-powered predictive intervention system that transforms
 * the dashboard from passive monitoring to proactive management.
 */

// =============================================================================
// Core Autopilot Types
// =============================================================================

export type AutopilotStatus = 'active' | 'paused' | 'learning' | 'disabled';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type InterventionStatus = 'pending' | 'approved' | 'rejected' | 'executed' | 'expired';
export type PredictionConfidence = 'low' | 'medium' | 'high' | 'very_high';

export interface AutopilotSettings {
  status: AutopilotStatus;
  autoApproveThreshold: number; // 0-100, auto-approve if confidence above this
  notificationPreferences: {
    emailAlerts: boolean;
    inAppAlerts: boolean;
    slackIntegration: boolean;
  };
  interventionTypes: {
    borrowerCalls: boolean;
    amendmentDrafts: boolean;
    counterpartyAlerts: boolean;
    complianceReminders: boolean;
    esgActions: boolean;
  };
  predictionHorizon: 30 | 60 | 90 | 180; // days
}

// =============================================================================
// Prediction Types
// =============================================================================

export interface BreachPrediction {
  id: string;
  covenantId: string;
  covenantName: string;
  covenantType: string;
  borrowerId: string;
  borrowerName: string;
  facilityId: string;
  facilityName: string;

  // Prediction details
  predictedBreachDate: string;
  daysUntilBreach: number;
  breachProbability: number; // 0-100
  confidence: PredictionConfidence;
  confidenceScore: number; // 0-100

  // Current state
  currentValue: number;
  threshold: number;
  headroomPercent: number;

  // Trend analysis
  trend: 'improving' | 'stable' | 'deteriorating';
  trendRate: number; // change per month
  projectedValueAtBreach: number;

  // Contributing factors
  contributingFactors: ContributingFactor[];
  leadingIndicators: LeadingIndicator[];

  // Risk assessment
  riskLevel: RiskLevel;
  impactSeverity: 'low' | 'medium' | 'high';
  cascadeRisk: boolean; // Could trigger other breaches

  // AI analysis
  aiSummary: string;
  recommendedActions: string[];

  createdAt: string;
  updatedAt: string;
}

export interface ContributingFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number; // 0-1
  description: string;
  category: 'market' | 'operational' | 'financial' | 'external' | 'regulatory';
}

export interface LeadingIndicator {
  name: string;
  status: 'normal' | 'warning' | 'critical';
  value: number;
  threshold: number;
  description: string;
  daysAheadSignal: number; // How many days ahead this typically signals issues
}

// =============================================================================
// Intervention Types
// =============================================================================

export type InterventionType =
  | 'borrower_call'
  | 'amendment_draft'
  | 'counterparty_alert'
  | 'compliance_reminder'
  | 'esg_action'
  | 'risk_escalation'
  | 'waiver_request'
  | 'document_request';

export interface Intervention {
  id: string;
  predictionId: string;
  type: InterventionType;
  status: InterventionStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';

  // Details
  title: string;
  description: string;
  rationale: string;

  // Target
  borrowerId: string;
  borrowerName: string;
  facilityId?: string;
  facilityName?: string;

  // Action specifics
  suggestedAction: string;
  actionDetails: InterventionActionDetails;

  // Timing
  optimalTiming: string;
  deadlineDate: string;
  createdAt: string;
  updatedAt: string;
  executedAt?: string;

  // Approval
  requiresApproval: boolean;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;

  // Outcome tracking
  expectedOutcome: string;
  actualOutcome?: string;
  effectivenessScore?: number; // 0-100
}

export interface InterventionActionDetails {
  // For borrower_call
  callAgenda?: string[];
  suggestedTalkingPoints?: string[];
  participants?: string[];

  // For amendment_draft
  proposedChanges?: Array<{
    term: string;
    currentValue: string;
    proposedValue: string;
    rationale: string;
  }>;

  // For counterparty_alert
  alertMessage?: string;
  recipients?: string[];
  urgency?: 'informational' | 'action_required' | 'urgent';

  // For document_request
  documentsRequested?: string[];
  dueDate?: string;

  // For waiver_request
  waiverDetails?: {
    covenantName: string;
    requestedRelief: string;
    duration: string;
    conditions: string[];
  };
}

// =============================================================================
// Autopilot Dashboard Types
// =============================================================================

export interface AutopilotDashboardData {
  settings: AutopilotSettings;
  metrics: AutopilotMetrics;
  activePredictions: BreachPrediction[];
  pendingInterventions: Intervention[];
  recentActions: AutopilotAction[];
  alertQueue: AutopilotAlert[];
  performanceHistory: PerformanceDataPoint[];
}

export interface AutopilotMetrics {
  // Predictions
  activePredictionsCount: number;
  highRiskCount: number;
  criticalCount: number;

  // Interventions
  pendingInterventionsCount: number;
  executedThisMonth: number;
  successRate: number; // 0-100

  // Performance
  breachesPrevented: number;
  averageLeadTime: number; // days before issue
  predictionAccuracy: number; // 0-100

  // Coverage
  portfolioCoverage: number; // % of portfolio monitored
  covenantsMonitored: number;
  borrowersAtRisk: number;
}

export interface AutopilotAction {
  id: string;
  type: 'prediction_generated' | 'intervention_created' | 'intervention_executed' | 'alert_sent' | 'status_changed';
  title: string;
  description: string;
  timestamp: string;
  relatedPredictionId?: string;
  relatedInterventionId?: string;
  outcome?: 'success' | 'partial' | 'failed' | 'pending';
}

export interface AutopilotAlert {
  id: string;
  type: 'new_prediction' | 'risk_escalation' | 'intervention_due' | 'breach_imminent' | 'action_required';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  relatedEntityId?: string;
  relatedEntityType?: 'prediction' | 'intervention' | 'borrower' | 'covenant';
}

export interface PerformanceDataPoint {
  date: string;
  predictionsGenerated: number;
  interventionsExecuted: number;
  breachesPrevented: number;
  accuracy: number;
}

// =============================================================================
// API Response Types
// =============================================================================

export interface AutopilotStatusResponse {
  status: AutopilotStatus;
  lastAnalysisTime: string;
  nextScheduledAnalysis: string;
  metrics: AutopilotMetrics;
}

export interface PredictionResponse {
  predictions: BreachPrediction[];
  totalCount: number;
  highRiskCount: number;
  criticalCount: number;
}

export interface InterventionResponse {
  interventions: Intervention[];
  totalCount: number;
  pendingCount: number;
  approvedCount: number;
}

// =============================================================================
// Confidence-Weighted Action Queue Types
// =============================================================================

export type ActionQueueStatus = 'queued' | 'auto_approved' | 'pending_review' | 'executing' | 'completed' | 'failed';
export type ActionExecutionMode = 'auto' | 'manual' | 'hybrid';

export interface ActionQueueItem {
  id: string;
  interventionId: string;
  intervention: Intervention;

  // Confidence scoring
  confidenceScore: number; // 0-100
  confidenceFactors: ConfidenceFactor[];

  // Queue status
  status: ActionQueueStatus;
  executionMode: ActionExecutionMode;
  requiresHumanReview: boolean;

  // Auto-approval tracking
  autoApprovalEligible: boolean;
  autoApprovalReason?: string;
  autoApprovalBlockers?: string[];

  // Execution tracking
  queuedAt: string;
  scheduledExecutionTime?: string;
  executionStartedAt?: string;
  executionCompletedAt?: string;
  executionResult?: ActionExecutionResult;

  // Priority and ordering
  queuePriority: number; // 1-100, higher = execute first
  estimatedImpact: 'low' | 'medium' | 'high' | 'critical';

  // Dependencies
  dependsOn?: string[]; // Other action IDs that must complete first
  blockedBy?: string[]; // Actions currently blocking this one
}

export interface ConfidenceFactor {
  factor: string;
  score: number; // 0-100
  weight: number; // 0-1
  explanation: string;
  source: 'model' | 'historical' | 'rule' | 'user_feedback';
}

export interface ActionExecutionResult {
  success: boolean;
  outcome: string;
  artifacts?: ActionArtifact[];
  metrics?: {
    executionTimeMs: number;
    retryCount: number;
    resourcesUsed: string[];
  };
  feedback?: {
    userSatisfaction?: number;
    effectivenessRating?: number;
    notes?: string;
  };
}

export interface ActionArtifact {
  id: string;
  type: 'document' | 'email' | 'report' | 'calendar_event' | 'notification' | 'amendment';
  title: string;
  content?: string;
  url?: string;
  createdAt: string;
}

// =============================================================================
// Action Queue Dashboard Types
// =============================================================================

export interface ActionQueueDashboardData {
  queuedActions: ActionQueueItem[];
  pendingReviewActions: ActionQueueItem[];
  executingActions: ActionQueueItem[];
  recentlyCompletedActions: ActionQueueItem[];
  queueMetrics: ActionQueueMetrics;
  thresholdSettings: AutoApprovalThresholds;
}

export interface ActionQueueMetrics {
  totalQueued: number;
  pendingReview: number;
  autoApprovedToday: number;
  executedToday: number;
  failedToday: number;
  avgConfidenceScore: number;
  avgExecutionTimeMs: number;
  successRate: number;
  queueProcessingRate: number; // actions per hour
}

export interface AutoApprovalThresholds {
  globalThreshold: number; // Default confidence threshold for auto-approval
  typeThresholds: Record<InterventionType, number>; // Per-type thresholds
  impactThresholds: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  riskFactors: {
    maxDollarAmount: number;
    requiresLegalReview: InterventionType[];
    requiresComplianceReview: InterventionType[];
    alwaysRequireApproval: InterventionType[];
  };
  timeRestrictions: {
    businessHoursOnly: boolean;
    blackoutPeriods: Array<{ start: string; end: string; reason: string }>;
    maxActionsPerHour: number;
    maxActionsPerDay: number;
  };
}

// =============================================================================
// Real-time Action Generation Types
// =============================================================================

export interface GeneratedAction {
  type: InterventionType;
  title: string;
  description: string;
  rationale: string;
  suggestedAction: string;
  actionDetails: InterventionActionDetails;

  // AI-generated confidence
  confidenceScore: number;
  confidenceFactors: ConfidenceFactor[];

  // Timing
  optimalTiming: string;
  urgency: 'immediate' | 'today' | 'this_week' | 'this_month';
  deadlineDays: number;

  // Target
  borrowerId: string;
  borrowerName: string;
  facilityId?: string;
  facilityName?: string;

  // Expected outcomes
  expectedOutcome: string;
  successProbability: number;
  potentialRisks: string[];

  // Dependencies
  prerequisites: string[];
  followUpActions: string[];
}

export interface ActionGenerationRequest {
  predictionId: string;
  triggerType: 'scheduled' | 'threshold_breach' | 'user_request' | 'cascade';
  context: {
    portfolioContext?: {
      totalExposure: number;
      relationshipLength: number;
      previousWaivers: number;
      creditRating: string;
      lenderSentiment: 'positive' | 'neutral' | 'negative';
    };
    marketContext?: {
      rateEnvironment: 'rising' | 'stable' | 'falling';
      creditConditions: 'tight' | 'neutral' | 'loose';
      sectorOutlook: 'positive' | 'neutral' | 'negative';
    };
    constraints?: {
      maxActions?: number;
      excludeTypes?: InterventionType[];
      urgencyFilter?: 'all' | 'urgent_only' | 'non_urgent';
    };
  };
}

export interface ActionGenerationResponse {
  actions: GeneratedAction[];
  analysisId: string;
  generatedAt: string;
  modelConfidence: number;
  processingTimeMs: number;
}
