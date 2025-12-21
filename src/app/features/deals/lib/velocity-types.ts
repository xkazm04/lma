/**
 * Deal Velocity Tracking Types
 * Types for tracking deal velocity metrics, stall prediction, and acceleration alerts
 */

// ============================================
// Velocity Metrics Types
// ============================================

export interface DealVelocityMetrics {
  dealId: string;
  measurementDate: string;

  // Time-based metrics
  averageTimeBetweenProposals: number; // hours
  averageTimeBetweenComments: number; // hours
  daysSinceLastActivity: number;
  daysSinceLastProposal: number;
  daysSinceLastAgreement: number;

  // Engagement metrics
  proposalsPerDay: number;
  commentsPerDay: number;
  participantEngagementRate: number; // percentage of active participants
  responseRateToProposals: number; // percentage of proposals with responses

  // Progress metrics
  agreedTermsPerDay: number;
  progressVelocity: number; // percentage progress per day
  estimatedDaysToCompletion: number | null;

  // Trend indicators
  velocityTrend: 'accelerating' | 'stable' | 'decelerating' | 'stalled';
  engagementTrend: 'increasing' | 'stable' | 'decreasing';

  // Historical comparison
  comparedToHistoricalAverage: number; // multiplier (1.0 = average, 0.5 = half speed)
}

export interface DealActivityEvent {
  id: string;
  dealId: string;
  eventType: 'proposal_created' | 'proposal_response' | 'comment_added' | 'term_agreed' | 'term_locked' | 'participant_joined' | 'status_changed';
  actorId: string;
  actorParty: string;
  termId?: string;
  termCategory?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ParticipantEngagement {
  participantId: string;
  partyName: string;
  partyType: 'borrower_side' | 'lender_side' | 'third_party';
  dealRole: string;
  lastActivityAt: string;
  proposalsCreated: number;
  proposalsResponded: number;
  commentsAdded: number;
  engagementScore: number; // 0-100
  isActive: boolean;
  daysSinceLastActivity: number;
}

// ============================================
// Stall Prediction Types
// ============================================

export interface StallRiskAssessment {
  dealId: string;
  assessmentDate: string;
  overallRiskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  probabilityOfStall: number; // 0-1
  estimatedDaysUntilStall: number | null;

  // Risk factors
  riskFactors: StallRiskFactor[];

  // Historical pattern matching
  matchedPatterns: HistoricalPatternMatch[];

  // Confidence in assessment
  confidence: number; // 0-1
}

export interface StallRiskFactor {
  factorType:
    | 'inactivity_period'
    | 'low_engagement'
    | 'stuck_on_term'
    | 'unresponsive_party'
    | 'covenant_stalemate'
    | 'pricing_deadlock'
    | 'deadline_proximity'
    | 'participant_dropout'
    | 'proposal_rejection_streak';
  severity: 'low' | 'medium' | 'high';
  weight: number; // contribution to overall risk score
  description: string;
  relatedTermId?: string;
  relatedPartyId?: string;
  dataPoints: Record<string, unknown>;
}

export interface HistoricalPatternMatch {
  patternId: string;
  patternName: string;
  similarity: number; // 0-1
  outcomeType: 'closed_successfully' | 'stalled_recovered' | 'stalled_failed' | 'terminated';
  historicalCloseRate: number; // percentage of similar deals that closed
  averageRecoveryDays: number | null;
  keyCharacteristics: string[];
}

// ============================================
// Acceleration Alert Types
// ============================================

export type AlertSeverity = 'info' | 'warning' | 'urgent' | 'critical';
export type AlertCategory = 'velocity' | 'engagement' | 'deadline' | 'pattern' | 'opportunity';

export interface DealAccelerationAlert {
  id: string;
  dealId: string;
  createdAt: string;
  expiresAt: string | null;

  // Alert classification
  severity: AlertSeverity;
  category: AlertCategory;
  alertType: DealAlertType;

  // Content
  title: string;
  description: string;
  contextualInsight: string; // AI-generated insight with historical comparison

  // Risk metrics
  stallRiskScore: number;
  historicalCloseRate: number; // for similar situations

  // Suggested interventions
  interventions: SuggestedIntervention[];

  // Status tracking
  status: 'active' | 'dismissed' | 'acted_upon' | 'resolved' | 'expired';
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
  actionTakenAt: string | null;
  resolutionNotes: string | null;
}

export type DealAlertType =
  | 'covenant_negotiation_pause'
  | 'pricing_term_deadlock'
  | 'participant_disengagement'
  | 'overall_velocity_decline'
  | 'deadline_risk'
  | 'proposal_rejection_pattern'
  | 'communication_gap'
  | 'unaddressed_comments'
  | 'agreement_momentum_loss'
  | 'party_response_delay'
  | 'optimal_closing_window';

export interface SuggestedIntervention {
  id: string;
  interventionType: InterventionType;
  priority: 'primary' | 'secondary' | 'alternative';
  title: string;
  description: string;
  reasoning: string;
  estimatedImpact: {
    velocityImprovement: number; // percentage
    stallRiskReduction: number; // percentage
    closeRateImprovement: number; // percentage points
  };
  effortLevel: 'low' | 'medium' | 'high';
  timeToImplement: string; // e.g., "15 minutes", "1-2 days"

  // For scheduling interventions
  schedulingConfig?: SchedulingConfig;

  // Action tracking
  wasSelected: boolean;
  implementedAt: string | null;
  outcome: string | null;
}

export type InterventionType =
  | 'schedule_call'
  | 'send_summary'
  | 'propose_package_deal'
  | 'escalate_to_senior'
  | 'break_term_into_parts'
  | 'offer_conditional_agreement'
  | 'request_deadline_extension'
  | 'add_mediator'
  | 'share_market_data'
  | 'propose_interim_agreement';

export interface SchedulingConfig {
  suggestedParticipants: string[]; // participant IDs
  suggestedDuration: number; // minutes
  suggestedTimeSlots: Array<{
    startTime: string;
    endTime: string;
    availability: 'high' | 'medium' | 'low';
  }>;
  meetingType: 'alignment_call' | 'escalation_meeting' | 'mediation_session';
  agendaItems: string[];
  calendarProvider?: 'google' | 'outlook' | 'calendly';
}

// ============================================
// Analysis Request/Response Types
// ============================================

export interface VelocityAnalysisRequest {
  dealId: string;
  includeHistoricalComparison?: boolean;
  lookbackDays?: number;
}

export interface StallPredictionRequest {
  dealId: string;
  considerHistoricalPatterns?: boolean;
  focusTermIds?: string[];
}

export interface AlertGenerationRequest {
  dealId: string;
  includeInterventions?: boolean;
  maxAlerts?: number;
  minSeverity?: AlertSeverity;
}

export interface DealHealthSummary {
  dealId: string;
  dealName: string;
  overallHealth: 'healthy' | 'at_risk' | 'critical';
  healthScore: number; // 0-100

  velocityMetrics: DealVelocityMetrics;
  stallRisk: StallRiskAssessment;
  activeAlerts: DealAccelerationAlert[];
  participantEngagement: ParticipantEngagement[];

  // AI-generated summary
  executiveSummary: string;
  topPriorities: string[];
  positiveIndicators: string[];
  concernAreas: string[];
}

// ============================================
// Scheduling Integration Types
// ============================================

export interface ScheduleCallRequest {
  alertId: string;
  interventionId: string;
  dealId: string;

  // Meeting details
  title: string;
  description: string;
  participantIds: string[];
  duration: number; // minutes

  // Scheduling preferences
  preferredTimeSlot?: {
    startTime: string;
    endTime: string;
  };

  // Calendar integration
  calendarProvider: 'google' | 'outlook' | 'calendly' | 'manual';
  sendInvites: boolean;

  // Agenda from intervention
  agendaItems: string[];
}

export interface ScheduledMeeting {
  id: string;
  alertId: string;
  interventionId: string;
  dealId: string;

  title: string;
  description: string;
  scheduledAt: string;
  duration: number;
  participantIds: string[];

  // Calendar integration
  calendarEventId?: string;
  calendarProvider?: string;
  meetingLink?: string;

  // Status
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  createdAt: string;
  createdBy: string;

  // Outcomes
  outcome?: {
    attendees: string[];
    decisionsReached: string[];
    nextSteps: string[];
    notesUrl?: string;
  };
}

// ============================================
// Historical Benchmark Types
// ============================================

export interface DealBenchmark {
  dealType: string;
  dealSize: 'small' | 'medium' | 'large';
  complexity: 'low' | 'medium' | 'high';

  // Average metrics
  averageDaysToClose: number;
  medianDaysToClose: number;
  averageProposalsPerTerm: number;
  averageCommentsPerTerm: number;

  // Velocity benchmarks
  healthyVelocityRange: {
    minProposalsPerDay: number;
    maxProposalsPerDay: number;
    minCommentsPerDay: number;
    maxCommentsPerDay: number;
  };

  // Stall thresholds
  inactivityWarningDays: number;
  inactivityCriticalDays: number;

  // Success factors
  closeRate: number;
  commonStallPoints: Array<{
    category: string;
    frequency: number;
    averageResolutionDays: number;
  }>;
}
