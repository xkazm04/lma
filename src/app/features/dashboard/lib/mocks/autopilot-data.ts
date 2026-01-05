/**
 * Portfolio Autopilot Mock Data
 *
 * Comprehensive mock data for the AI-powered predictive intervention system.
 */

import type {
  AutopilotDashboardData,
  AutopilotSettings,
  AutopilotMetrics,
  BreachPrediction,
  Intervention,
  AutopilotAction,
  AutopilotAlert,
  PerformanceDataPoint,
  ActionQueueItem,
  ActionQueueDashboardData,
  ActionQueueMetrics,
  AutoApprovalThresholds,
} from './autopilot-types';
import {
  borrowers,
  facilities,
  BORROWER_IDS,
  FACILITY_IDS,
} from './borrower-registry';
import {
  toDateString,
  toISOString,
  daysAgo,
  daysFromNow,
  hoursAgo,
  getRecentMonths,
  scheduledTimestamp,
  createHolidayBlackouts,
} from './date-factory';

// =============================================================================
// Registry References
// =============================================================================

// Helper references from canonical registry
const bAbc = borrowers[BORROWER_IDS.ABC_HOLDINGS];
const bNeptune = borrowers[BORROWER_IDS.NEPTUNE_LLC];
const bDelta = borrowers[BORROWER_IDS.DELTA_CORP];
const bEcotech = borrowers[BORROWER_IDS.ECOTECH_LTD];

const fAbc = facilities[FACILITY_IDS.ABC_TERM_A];
const fNeptune = facilities[FACILITY_IDS.NEPTUNE_SYNDICATED];
const fDelta = facilities[FACILITY_IDS.DELTA_WC];
const fEcotech = facilities[FACILITY_IDS.ECOTECH_GREEN];

// =============================================================================
// Settings
// =============================================================================

export const mockAutopilotSettings: AutopilotSettings = {
  status: 'active',
  autoApproveThreshold: 85,
  notificationPreferences: {
    emailAlerts: true,
    inAppAlerts: true,
    slackIntegration: false,
  },
  interventionTypes: {
    borrowerCalls: true,
    amendmentDrafts: true,
    counterpartyAlerts: true,
    complianceReminders: true,
    esgActions: true,
  },
  predictionHorizon: 90,
};

// =============================================================================
// Metrics
// =============================================================================

export const mockAutopilotMetrics: AutopilotMetrics = {
  activePredictionsCount: 7,
  highRiskCount: 3,
  criticalCount: 1,
  pendingInterventionsCount: 4,
  executedThisMonth: 12,
  successRate: 87,
  breachesPrevented: 5,
  averageLeadTime: 67,
  predictionAccuracy: 92,
  portfolioCoverage: 100,
  covenantsMonitored: 48,
  borrowersAtRisk: 4,
};

// =============================================================================
// Predictions
// =============================================================================

export const mockBreachPredictions: BreachPrediction[] = [
  {
    id: 'pred-001',
    covenantId: `cov-${bAbc.id}-001`,
    covenantName: 'Debt/EBITDA Ratio',
    covenantType: 'financial',
    borrowerId: bAbc.id,
    borrowerName: bAbc.name,
    facilityId: fAbc.id,
    facilityName: fAbc.name,
    predictedBreachDate: toDateString(daysFromNow(89)),
    daysUntilBreach: 89,
    breachProbability: 78,
    confidence: 'high',
    confidenceScore: 85,
    currentValue: 3.8,
    threshold: 4.0,
    headroomPercent: 5,
    trend: 'deteriorating',
    trendRate: 0.15,
    projectedValueAtBreach: 4.2,
    contributingFactors: [
      {
        factor: 'Revenue Decline',
        impact: 'negative',
        weight: 0.4,
        description: 'Q3 revenue down 8% YoY due to market conditions',
        category: 'financial',
      },
      {
        factor: 'Rising Interest Costs',
        impact: 'negative',
        weight: 0.25,
        description: 'Floating rate exposure increasing debt service',
        category: 'market',
      },
      {
        factor: 'Cost Reduction Initiative',
        impact: 'positive',
        weight: 0.15,
        description: 'Ongoing restructuring expected to improve EBITDA',
        category: 'operational',
      },
      {
        factor: 'Seasonal Weakness',
        impact: 'negative',
        weight: 0.2,
        description: 'Q1 historically weakest quarter for this sector',
        category: 'external',
      },
    ],
    leadingIndicators: [
      {
        name: 'Cash Conversion Cycle',
        status: 'warning',
        value: 72,
        threshold: 60,
        description: 'Days to convert inventory to cash increasing',
        daysAheadSignal: 45,
      },
      {
        name: 'Accounts Receivable Aging',
        status: 'warning',
        value: 58,
        threshold: 45,
        description: 'Average collection days above target',
        daysAheadSignal: 30,
      },
      {
        name: 'EBITDA Margin Trend',
        status: 'critical',
        value: 12.5,
        threshold: 15,
        description: 'Margin compression observed over last 3 quarters',
        daysAheadSignal: 60,
      },
    ],
    riskLevel: 'high',
    impactSeverity: 'high',
    cascadeRisk: true,
    aiSummary:
      `${bAbc.name} shows elevated risk of breaching the Debt/EBITDA covenant within 90 days. The combination of revenue headwinds, rising interest costs, and seasonal factors creates significant pressure on EBITDA. Proactive engagement is recommended to explore amendment options before Q1 results.`,
    recommendedActions: [
      'Schedule borrower call to discuss Q4 outlook and cost initiatives',
      'Begin preliminary amendment discussions with agent bank',
      'Request updated management projections through Q2 2025',
      'Monitor weekly cash flow reports for early warning signs',
    ],
    createdAt: toISOString(daysAgo(5)),
    updatedAt: toISOString(hoursAgo(2)),
  },
  {
    id: 'pred-002',
    covenantId: `cov-${bNeptune.id}-001`,
    covenantName: 'Interest Coverage Ratio',
    covenantType: 'financial',
    borrowerId: bNeptune.id,
    borrowerName: bNeptune.name,
    facilityId: fNeptune.id,
    facilityName: fNeptune.name,
    predictedBreachDate: toDateString(daysFromNow(66)),
    daysUntilBreach: 66,
    breachProbability: 85,
    confidence: 'very_high',
    confidenceScore: 92,
    currentValue: 2.2,
    threshold: 2.0,
    headroomPercent: 10,
    trend: 'deteriorating',
    trendRate: 0.2,
    projectedValueAtBreach: 1.8,
    contributingFactors: [
      {
        factor: 'SOFR Rate Increase',
        impact: 'negative',
        weight: 0.5,
        description: 'Floating rate reset increased interest expense by 35%',
        category: 'market',
      },
      {
        factor: 'Capital Expenditure Surge',
        impact: 'negative',
        weight: 0.3,
        description: 'Expansion project consuming operating cash flow',
        category: 'operational',
      },
      {
        factor: 'Contract Renewal',
        impact: 'positive',
        weight: 0.2,
        description: 'Major customer renewal provides revenue stability',
        category: 'financial',
      },
    ],
    leadingIndicators: [
      {
        name: 'Interest Expense to Revenue',
        status: 'critical',
        value: 8.5,
        threshold: 6,
        description: 'Interest burden significantly elevated',
        daysAheadSignal: 30,
      },
      {
        name: 'Free Cash Flow Coverage',
        status: 'warning',
        value: 1.3,
        threshold: 1.5,
        description: 'Cash flow coverage declining',
        daysAheadSignal: 45,
      },
    ],
    riskLevel: 'critical',
    impactSeverity: 'high',
    cascadeRisk: true,
    aiSummary:
      `Critical: ${bNeptune.name} faces imminent breach of Interest Coverage covenant. Rising rates combined with capital expenditure requirements are severely straining coverage. Immediate intervention required - recommend exploring rate cap or covenant holiday.`,
    recommendedActions: [
      'Urgent: Schedule syndicate call within 2 weeks',
      'Draft waiver request for Q1 2025 testing period',
      'Explore interest rate hedging options',
      'Request borrower to provide capex deferral analysis',
    ],
    createdAt: toISOString(daysAgo(7)),
    updatedAt: toISOString(hoursAgo(1)),
  },
  {
    id: 'pred-003',
    covenantId: `cov-${bDelta.id}-001`,
    covenantName: 'Current Ratio',
    covenantType: 'financial',
    borrowerId: bDelta.id,
    borrowerName: bDelta.name,
    facilityId: fDelta.id,
    facilityName: fDelta.name,
    predictedBreachDate: toDateString(daysFromNow(135)),
    daysUntilBreach: 135,
    breachProbability: 45,
    confidence: 'medium',
    confidenceScore: 68,
    currentValue: 1.35,
    threshold: 1.25,
    headroomPercent: 8,
    trend: 'stable',
    trendRate: -0.02,
    projectedValueAtBreach: 1.22,
    contributingFactors: [
      {
        factor: 'Inventory Build-up',
        impact: 'positive',
        weight: 0.4,
        description: 'Strategic inventory increase supporting current assets',
        category: 'operational',
      },
      {
        factor: 'Supplier Payment Terms',
        impact: 'negative',
        weight: 0.3,
        description: 'Key suppliers reducing payment terms',
        category: 'external',
      },
      {
        factor: 'Seasonal Working Capital',
        impact: 'negative',
        weight: 0.3,
        description: 'Q2 typically requires higher working capital',
        category: 'financial',
      },
    ],
    leadingIndicators: [
      {
        name: 'Quick Ratio',
        status: 'normal',
        value: 0.95,
        threshold: 0.8,
        description: 'Liquidity position currently adequate',
        daysAheadSignal: 60,
      },
    ],
    riskLevel: 'medium',
    impactSeverity: 'medium',
    cascadeRisk: false,
    aiSummary:
      `${bDelta.name} shows moderate risk for Current Ratio covenant. While currently stable, seasonal factors and changing supplier terms warrant monitoring. Risk is manageable with proactive liquidity planning.`,
    recommendedActions: [
      'Review working capital forecast with borrower',
      'Monitor supplier payment term changes',
      'Consider revolver draw timing optimization',
    ],
    createdAt: toISOString(daysAgo(3)),
    updatedAt: toISOString(hoursAgo(3)),
  },
  {
    id: 'pred-004',
    covenantId: `cov-${bEcotech.id}-esg-001`,
    covenantName: 'Carbon Emissions Target',
    covenantType: 'esg',
    borrowerId: bEcotech.id,
    borrowerName: bEcotech.name,
    facilityId: fEcotech.id,
    facilityName: fEcotech.name,
    predictedBreachDate: toDateString(daysFromNow(196)),
    daysUntilBreach: 196,
    breachProbability: 62,
    confidence: 'high',
    confidenceScore: 78,
    currentValue: 85,
    threshold: 100,
    headroomPercent: 15,
    trend: 'improving',
    trendRate: 2,
    projectedValueAtBreach: 95,
    contributingFactors: [
      {
        factor: 'Renewable Energy Transition',
        impact: 'positive',
        weight: 0.5,
        description: 'Solar installation on track for Q2 completion',
        category: 'operational',
      },
      {
        factor: 'Supply Chain Emissions',
        impact: 'negative',
        weight: 0.3,
        description: 'Scope 3 emissions higher than projected',
        category: 'external',
      },
      {
        factor: 'Production Volume Increase',
        impact: 'negative',
        weight: 0.2,
        description: 'Higher output increasing absolute emissions',
        category: 'operational',
      },
    ],
    leadingIndicators: [
      {
        name: 'Energy Efficiency Index',
        status: 'warning',
        value: 78,
        threshold: 85,
        description: 'Efficiency improvements lagging target',
        daysAheadSignal: 90,
      },
    ],
    riskLevel: 'medium',
    impactSeverity: 'medium',
    cascadeRisk: false,
    aiSummary:
      `${bEcotech.shortName} shows moderate ESG covenant risk. While renewable transition is positive, supply chain emissions and volume growth create headwinds. Timeline allows for corrective action if initiated soon.`,
    recommendedActions: [
      'Accelerate scope 3 supplier engagement program',
      'Review solar installation timeline for any delays',
      'Consider carbon offset purchase as backup',
    ],
    createdAt: toISOString(daysAgo(10)),
    updatedAt: toISOString(daysAgo(1)),
  },
];

// =============================================================================
// Interventions
// =============================================================================

export const mockInterventions: Intervention[] = [
  {
    id: 'int-001',
    predictionId: 'pred-001',
    type: 'borrower_call',
    status: 'pending',
    priority: 'high',
    title: `Q4 Performance Discussion - ${bAbc.name}`,
    description:
      'Schedule call to discuss Q4 outlook, cost reduction initiatives, and potential covenant pressure.',
    rationale:
      'Early engagement allows time for proactive solutions before Q1 test date. Discussion of amendment options while relationship is strong.',
    borrowerId: bAbc.id,
    borrowerName: bAbc.name,
    facilityId: fAbc.id,
    facilityName: fAbc.name,
    suggestedAction: 'Schedule 1-hour video call with CFO and Treasurer',
    actionDetails: {
      callAgenda: [
        'Q4 preliminary results review',
        'Cost reduction initiative progress',
        'Cash flow forecast through Q2 2025',
        'Discussion of covenant trajectory',
        'Potential amendment parameters',
      ],
      suggestedTalkingPoints: [
        'We appreciate the proactive communication during challenging market conditions',
        'Looking for ways to provide flexibility while protecting credit structure',
        'Early engagement on potential solutions is beneficial for all parties',
      ],
      participants: [
        'Relationship Manager',
        'Credit Officer',
        `CFO (${bAbc.name})`,
        `Treasurer (${bAbc.name})`,
      ],
    },
    optimalTiming: 'Within next 2 weeks',
    deadlineDate: toDateString(daysFromNow(15)),
    createdAt: toISOString(daysAgo(5)),
    updatedAt: toISOString(hoursAgo(2)),
    requiresApproval: true,
    expectedOutcome:
      'Clear understanding of borrower situation and path forward, either through improved performance or amendment negotiation.',
  },
  {
    id: 'int-002',
    predictionId: 'pred-002',
    type: 'waiver_request',
    status: 'pending',
    priority: 'urgent',
    title: `Interest Coverage Waiver - ${bNeptune.name}`,
    description:
      'Draft and submit waiver request for Q1 2025 Interest Coverage test to syndicate.',
    rationale:
      'High probability of breach requires immediate preparation. Waiver provides breathing room while longer-term solutions are developed.',
    borrowerId: bNeptune.id,
    borrowerName: bNeptune.name,
    facilityId: fNeptune.id,
    facilityName: fNeptune.name,
    suggestedAction: 'Prepare waiver request package for syndicate distribution',
    actionDetails: {
      waiverDetails: {
        covenantName: 'Interest Coverage Ratio',
        requestedRelief: 'Reduce minimum from 2.0x to 1.75x',
        duration: 'Q1 and Q2 2025 (two test periods)',
        conditions: [
          'Monthly financial reporting',
          'No additional debt incurrence',
          'Capex limitation of $5M per quarter',
          'Rate cap requirement for 50% of exposure',
        ],
      },
    },
    optimalTiming: 'Immediate - within 1 week',
    deadlineDate: toDateString(daysFromNow(7)),
    createdAt: toISOString(daysAgo(3)),
    updatedAt: toISOString(hoursAgo(1)),
    requiresApproval: true,
    expectedOutcome:
      'Syndicate approval of temporary covenant relief with enhanced monitoring and protective conditions.',
  },
  {
    id: 'int-003',
    predictionId: 'pred-002',
    type: 'amendment_draft',
    status: 'pending',
    priority: 'high',
    title: `Rate Hedging Amendment - ${bNeptune.name}`,
    description:
      'Draft amendment requiring interest rate hedging to mitigate rate exposure.',
    rationale:
      'Structural fix for underlying rate exposure issue. Complements waiver with longer-term risk mitigation.',
    borrowerId: bNeptune.id,
    borrowerName: bNeptune.name,
    facilityId: fNeptune.id,
    facilityName: fNeptune.name,
    suggestedAction: 'Prepare amendment term sheet for hedging requirement',
    actionDetails: {
      proposedChanges: [
        {
          term: 'Hedging Requirement',
          currentValue: 'None',
          proposedValue: 'Minimum 50% of outstanding principal hedged via interest rate cap',
          rationale: 'Protect against further rate increases while allowing benefit from rate decreases',
        },
        {
          term: 'Cap Strike Rate',
          currentValue: 'N/A',
          proposedValue: 'Maximum of current SOFR + 100bps',
          rationale: 'Ensures meaningful protection at reasonable cost',
        },
      ],
    },
    optimalTiming: 'Within 30 days',
    deadlineDate: toDateString(daysFromNow(30)),
    createdAt: toISOString(daysAgo(2)),
    updatedAt: toISOString(hoursAgo(1)),
    requiresApproval: true,
    expectedOutcome:
      'Permanent structural fix reducing interest rate sensitivity and improving covenant headroom.',
  },
  {
    id: 'int-004',
    predictionId: 'pred-004',
    type: 'esg_action',
    status: 'approved',
    priority: 'medium',
    title: `Scope 3 Supplier Engagement - ${bEcotech.name}`,
    description:
      'Initiate supplier engagement program to address scope 3 emissions trajectory.',
    rationale:
      'Addressing root cause of ESG covenant pressure. Supplier engagement is most effective lever for scope 3 improvement.',
    borrowerId: bEcotech.id,
    borrowerName: bEcotech.name,
    facilityId: fEcotech.id,
    facilityName: fEcotech.name,
    suggestedAction: 'Launch top-10 supplier emissions reduction program',
    actionDetails: {
      documentsRequested: [
        'Supplier sustainability scorecards',
        'Transportation emissions data',
        'Packaging reduction plans',
      ],
      dueDate: toDateString(daysFromNow(60)),
    },
    optimalTiming: 'Q1 2025',
    deadlineDate: toDateString(daysFromNow(90)),
    createdAt: toISOString(daysAgo(7)),
    updatedAt: toISOString(daysAgo(1)),
    requiresApproval: true,
    approvedBy: 'Sarah Johnson',
    approvedAt: toISOString(daysAgo(1)),
    expectedOutcome:
      '15% reduction in scope 3 supplier emissions by end of 2025, creating comfortable headroom for ESG covenant.',
  },
];

// =============================================================================
// Actions (Activity Log)
// =============================================================================

export const mockAutopilotActions: AutopilotAction[] = [
  {
    id: 'act-001',
    type: 'prediction_generated',
    title: 'New High-Risk Prediction',
    description: `${bAbc.name} Debt/EBITDA covenant breach predicted with 78% probability`,
    timestamp: toISOString(hoursAgo(2)),
    relatedPredictionId: 'pred-001',
    outcome: 'pending',
  },
  {
    id: 'act-002',
    type: 'intervention_created',
    title: 'Intervention Auto-Generated',
    description: `Borrower call scheduled for ${bAbc.name} based on prediction analysis`,
    timestamp: toISOString(hoursAgo(2)),
    relatedInterventionId: 'int-001',
    relatedPredictionId: 'pred-001',
    outcome: 'pending',
  },
  {
    id: 'act-003',
    type: 'status_changed',
    title: 'Risk Level Escalated',
    description: `${bNeptune.name} upgraded to CRITICAL due to accelerating deterioration`,
    timestamp: toISOString(daysAgo(1)),
    relatedPredictionId: 'pred-002',
    outcome: 'success',
  },
  {
    id: 'act-004',
    type: 'intervention_executed',
    title: 'ESG Action Approved',
    description: `Scope 3 supplier engagement program approved for ${bEcotech.name}`,
    timestamp: toISOString(daysAgo(1)),
    relatedInterventionId: 'int-004',
    outcome: 'success',
  },
  {
    id: 'act-005',
    type: 'alert_sent',
    title: 'Syndicate Alert Sent',
    description: `Counterparty notification sent regarding ${bNeptune.name} rate exposure`,
    timestamp: toISOString(daysAgo(2)),
    outcome: 'success',
  },
  {
    id: 'act-006',
    type: 'prediction_generated',
    title: 'Prediction Updated',
    description: `${bDelta.name} current ratio prediction refined based on new supplier data`,
    timestamp: toISOString(daysAgo(3)),
    relatedPredictionId: 'pred-003',
    outcome: 'success',
  },
];

// =============================================================================
// Alerts Queue
// =============================================================================

export const mockAutopilotAlerts: AutopilotAlert[] = [
  {
    id: 'alert-001',
    type: 'breach_imminent',
    priority: 'critical',
    title: `Critical: ${bNeptune.name} ICR Breach`,
    message:
      'Interest Coverage Ratio breach highly likely within 66 days. Immediate action required.',
    timestamp: toISOString(hoursAgo(1)),
    read: false,
    relatedEntityId: 'pred-002',
    relatedEntityType: 'prediction',
  },
  {
    id: 'alert-002',
    type: 'action_required',
    priority: 'high',
    title: `Approval Needed: ${bAbc.name} Call`,
    message:
      'Borrower call intervention requires your approval. Optimal timing window closing.',
    timestamp: toISOString(hoursAgo(1)),
    read: false,
    relatedEntityId: 'int-001',
    relatedEntityType: 'intervention',
  },
  {
    id: 'alert-003',
    type: 'new_prediction',
    priority: 'high',
    title: 'New High-Risk Prediction',
    message: `${bAbc.name} Debt/EBITDA ratio showing 78% breach probability at 90 days.`,
    timestamp: toISOString(hoursAgo(2)),
    read: true,
    relatedEntityId: 'pred-001',
    relatedEntityType: 'prediction',
  },
  {
    id: 'alert-004',
    type: 'intervention_due',
    priority: 'medium',
    title: 'Waiver Request Deadline',
    message: `${bNeptune.name} waiver request should be submitted within 7 days.`,
    timestamp: toISOString(daysAgo(1)),
    read: true,
    relatedEntityId: 'int-002',
    relatedEntityType: 'intervention',
  },
];

// =============================================================================
// Performance History
// =============================================================================

// Generate dynamic month labels for performance history
const perfMonths = getRecentMonths(6);

export const mockPerformanceHistory: PerformanceDataPoint[] = [
  { date: perfMonths[0], predictionsGenerated: 8, interventionsExecuted: 6, breachesPrevented: 2, accuracy: 88 },
  { date: perfMonths[1], predictionsGenerated: 10, interventionsExecuted: 8, breachesPrevented: 3, accuracy: 90 },
  { date: perfMonths[2], predictionsGenerated: 12, interventionsExecuted: 9, breachesPrevented: 4, accuracy: 91 },
  { date: perfMonths[3], predictionsGenerated: 9, interventionsExecuted: 7, breachesPrevented: 2, accuracy: 89 },
  { date: perfMonths[4], predictionsGenerated: 11, interventionsExecuted: 10, breachesPrevented: 3, accuracy: 93 },
  { date: perfMonths[5], predictionsGenerated: 7, interventionsExecuted: 12, breachesPrevented: 5, accuracy: 92 },
];

// =============================================================================
// Combined Dashboard Data
// =============================================================================

export const mockAutopilotDashboardData: AutopilotDashboardData = {
  settings: mockAutopilotSettings,
  metrics: mockAutopilotMetrics,
  activePredictions: mockBreachPredictions,
  pendingInterventions: mockInterventions.filter((i) => i.status === 'pending'),
  recentActions: mockAutopilotActions,
  alertQueue: mockAutopilotAlerts,
  performanceHistory: mockPerformanceHistory,
};

// =============================================================================
// Auto-Approval Thresholds
// =============================================================================

export const mockAutoApprovalThresholds: AutoApprovalThresholds = {
  globalThreshold: 85,
  typeThresholds: {
    borrower_call: 80,
    amendment_draft: 95,
    counterparty_alert: 85,
    compliance_reminder: 75,
    esg_action: 80,
    risk_escalation: 90,
    waiver_request: 95,
    document_request: 70,
  },
  impactThresholds: {
    low: 70,
    medium: 80,
    high: 90,
    critical: 95,
  },
  riskFactors: {
    maxDollarAmount: 10000000,
    requiresLegalReview: ['amendment_draft', 'waiver_request'],
    requiresComplianceReview: ['waiver_request', 'amendment_draft'],
    alwaysRequireApproval: ['waiver_request'],
  },
  timeRestrictions: {
    businessHoursOnly: true,
    blackoutPeriods: createHolidayBlackouts(),
    maxActionsPerHour: 10,
    maxActionsPerDay: 50,
  },
};

// =============================================================================
// Action Queue Metrics
// =============================================================================

export const mockActionQueueMetrics: ActionQueueMetrics = {
  totalQueued: 8,
  pendingReview: 3,
  autoApprovedToday: 12,
  executedToday: 15,
  failedToday: 1,
  avgConfidenceScore: 82,
  avgExecutionTimeMs: 2340,
  successRate: 94,
  queueProcessingRate: 4.2,
};

// =============================================================================
// Action Queue Items
// =============================================================================

export const mockActionQueueItems: ActionQueueItem[] = [
  {
    id: 'aq-001',
    interventionId: 'int-001',
    intervention: mockInterventions[0],
    confidenceScore: 78,
    confidenceFactors: [
      {
        factor: 'Historical Success Rate',
        score: 85,
        weight: 0.3,
        explanation: 'Similar borrower calls have had 85% success rate',
        source: 'historical',
      },
      {
        factor: 'Model Prediction',
        score: 82,
        weight: 0.4,
        explanation: 'AI model predicts high likelihood of positive outcome',
        source: 'model',
      },
      {
        factor: 'Timing Appropriateness',
        score: 70,
        weight: 0.2,
        explanation: 'Q4 timing is moderately optimal for engagement',
        source: 'rule',
      },
      {
        factor: 'Relationship Health',
        score: 72,
        weight: 0.1,
        explanation: 'Borrower relationship is in good standing',
        source: 'historical',
      },
    ],
    status: 'pending_review',
    executionMode: 'hybrid',
    requiresHumanReview: true,
    autoApprovalEligible: false,
    autoApprovalBlockers: ['Confidence below threshold (78 < 80)', 'High priority intervention'],
    queuedAt: toISOString(hoursAgo(2)),
    queuePriority: 75,
    estimatedImpact: 'high',
  },
  {
    id: 'aq-002',
    interventionId: 'int-002',
    intervention: mockInterventions[1],
    confidenceScore: 65,
    confidenceFactors: [
      {
        factor: 'Waiver Precedent',
        score: 60,
        weight: 0.35,
        explanation: 'Limited historical data for similar waiver requests',
        source: 'historical',
      },
      {
        factor: 'Syndicate Sentiment',
        score: 55,
        weight: 0.25,
        explanation: 'Mixed signals from syndicate members',
        source: 'model',
      },
      {
        factor: 'Borrower Cooperation',
        score: 80,
        weight: 0.25,
        explanation: 'Borrower has been cooperative in discussions',
        source: 'user_feedback',
      },
      {
        factor: 'Market Conditions',
        score: 65,
        weight: 0.15,
        explanation: 'Current market conditions moderately favorable',
        source: 'rule',
      },
    ],
    status: 'pending_review',
    executionMode: 'manual',
    requiresHumanReview: true,
    autoApprovalEligible: false,
    autoApprovalBlockers: [
      'Waiver requests always require approval',
      'Confidence below threshold (65 < 95)',
      'Critical impact level',
    ],
    queuedAt: toISOString(hoursAgo(1)),
    queuePriority: 95,
    estimatedImpact: 'critical',
  },
  {
    id: 'aq-003',
    interventionId: 'int-004',
    intervention: mockInterventions[3],
    confidenceScore: 88,
    confidenceFactors: [
      {
        factor: 'ESG Track Record',
        score: 90,
        weight: 0.3,
        explanation: 'Borrower has strong ESG improvement history',
        source: 'historical',
      },
      {
        factor: 'Supplier Engagement Success',
        score: 85,
        weight: 0.35,
        explanation: 'Similar supplier programs have shown good results',
        source: 'historical',
      },
      {
        factor: 'Timeline Feasibility',
        score: 92,
        weight: 0.2,
        explanation: 'Sufficient time for implementation',
        source: 'rule',
      },
      {
        factor: 'Cost-Benefit Analysis',
        score: 82,
        weight: 0.15,
        explanation: 'Expected ROI is favorable',
        source: 'model',
      },
    ],
    status: 'auto_approved',
    executionMode: 'auto',
    requiresHumanReview: false,
    autoApprovalEligible: true,
    autoApprovalReason: 'Confidence (88%) exceeds ESG action threshold (80%)',
    queuedAt: toISOString(hoursAgo(3)),
    scheduledExecutionTime: scheduledTimestamp(0, 10),
    queuePriority: 60,
    estimatedImpact: 'medium',
  },
  {
    id: 'aq-004',
    interventionId: 'gen-001',
    intervention: {
      id: 'gen-001',
      predictionId: 'pred-003',
      type: 'compliance_reminder',
      status: 'pending',
      priority: 'medium',
      title: `Quarterly Compliance Report Reminder - ${bDelta.name}`,
      description: `Automated reminder to ${bDelta.name} for upcoming quarterly compliance report submission.`,
      rationale: 'Proactive reminder helps ensure timely submission and maintains compliance schedule.',
      borrowerId: bDelta.id,
      borrowerName: bDelta.name,
      facilityId: fDelta.id,
      facilityName: fDelta.name,
      suggestedAction: 'Send automated compliance reminder email',
      actionDetails: {
        documentsRequested: ['Q4 Financial Statements', 'Covenant Compliance Certificate'],
        dueDate: toDateString(daysFromNow(45)),
      },
      optimalTiming: 'Send 30 days before deadline',
      deadlineDate: toDateString(daysFromNow(5)),
      createdAt: toISOString(hoursAgo(4)),
      updatedAt: toISOString(hoursAgo(4)),
      requiresApproval: false,
      expectedOutcome: 'Timely submission of compliance documents',
    },
    confidenceScore: 92,
    confidenceFactors: [
      {
        factor: 'Reminder Effectiveness',
        score: 95,
        weight: 0.4,
        explanation: 'Automated reminders have 95% on-time submission rate',
        source: 'historical',
      },
      {
        factor: 'Timing Accuracy',
        score: 90,
        weight: 0.3,
        explanation: '30-day lead time is optimal based on historical data',
        source: 'rule',
      },
      {
        factor: 'Borrower Responsiveness',
        score: 88,
        weight: 0.3,
        explanation: `${bDelta.name} has good track record of timely responses`,
        source: 'historical',
      },
    ],
    status: 'auto_approved',
    executionMode: 'auto',
    requiresHumanReview: false,
    autoApprovalEligible: true,
    autoApprovalReason: 'Confidence (92%) exceeds compliance reminder threshold (75%)',
    queuedAt: toISOString(hoursAgo(4)),
    scheduledExecutionTime: scheduledTimestamp(1, 9),
    queuePriority: 50,
    estimatedImpact: 'low',
  },
  {
    id: 'aq-005',
    interventionId: 'gen-002',
    intervention: {
      id: 'gen-002',
      predictionId: 'pred-001',
      type: 'document_request',
      status: 'pending',
      priority: 'medium',
      title: `Updated Projections Request - ${bAbc.name}`,
      description: 'Request updated management projections to improve breach prediction accuracy.',
      rationale: 'Current projections are 2 months old; updated data will improve prediction confidence.',
      borrowerId: bAbc.id,
      borrowerName: bAbc.name,
      facilityId: fAbc.id,
      facilityName: fAbc.name,
      suggestedAction: 'Send document request via secure portal',
      actionDetails: {
        documentsRequested: [
          'Updated P&L Projections Q1-Q2 2025',
          'Cash Flow Forecast',
          'Cost Reduction Initiative Progress Report',
        ],
        dueDate: toDateString(daysFromNow(15)),
      },
      optimalTiming: 'Within 48 hours',
      deadlineDate: toDateString(daysFromNow(2)),
      createdAt: toISOString(hoursAgo(3)),
      updatedAt: toISOString(hoursAgo(3)),
      requiresApproval: false,
      expectedOutcome: 'Improved prediction accuracy with fresh financial data',
    },
    confidenceScore: 86,
    confidenceFactors: [
      {
        factor: 'Request Appropriateness',
        score: 90,
        weight: 0.35,
        explanation: 'Document request is standard and non-intrusive',
        source: 'rule',
      },
      {
        factor: 'Timing Relevance',
        score: 88,
        weight: 0.35,
        explanation: 'Request timing aligns with quarterly reporting cycle',
        source: 'rule',
      },
      {
        factor: 'Borrower Response Rate',
        score: 78,
        weight: 0.3,
        explanation: `${bAbc.name} typically responds within 5 days`,
        source: 'historical',
      },
    ],
    status: 'auto_approved',
    executionMode: 'auto',
    requiresHumanReview: false,
    autoApprovalEligible: true,
    autoApprovalReason: 'Confidence (86%) exceeds document request threshold (70%)',
    queuedAt: toISOString(hoursAgo(3)),
    scheduledExecutionTime: scheduledTimestamp(0, 14),
    queuePriority: 55,
    estimatedImpact: 'low',
  },
  {
    id: 'aq-006',
    interventionId: 'gen-003',
    intervention: {
      id: 'gen-003',
      predictionId: 'pred-002',
      type: 'counterparty_alert',
      status: 'pending',
      priority: 'high',
      title: `Syndicate Pre-Alert - ${bNeptune.name} ICR Risk`,
      description: 'Proactive notification to syndicate members about elevated Interest Coverage Ratio risk.',
      rationale: 'Early syndicate awareness facilitates coordinated response if formal action is needed.',
      borrowerId: bNeptune.id,
      borrowerName: bNeptune.name,
      facilityId: fNeptune.id,
      facilityName: fNeptune.name,
      suggestedAction: 'Send informational alert to syndicate members',
      actionDetails: {
        alertMessage:
          `${bNeptune.name} ICR covenant showing elevated breach risk (85% probability). Formal waiver discussion anticipated within 2 weeks. This is an informational notice.`,
        recipients: ['Agent Bank', 'Lead Arranger', 'Major Participants (>$10M commitment)'],
        urgency: 'informational',
      },
      optimalTiming: 'Before formal waiver request',
      deadlineDate: toDateString(daysFromNow(3)),
      createdAt: toISOString(hoursAgo(2)),
      updatedAt: toISOString(hoursAgo(2)),
      requiresApproval: true,
      expectedOutcome: 'Syndicate prepared for potential formal action',
    },
    confidenceScore: 82,
    confidenceFactors: [
      {
        factor: 'Communication Appropriateness',
        score: 85,
        weight: 0.4,
        explanation: 'Pre-alerts are standard practice for high-risk situations',
        source: 'rule',
      },
      {
        factor: 'Timing Strategy',
        score: 80,
        weight: 0.35,
        explanation: 'Alert timing provides adequate preparation window',
        source: 'model',
      },
      {
        factor: 'Relationship Impact',
        score: 78,
        weight: 0.25,
        explanation: 'Proactive communication generally improves syndicate relations',
        source: 'historical',
      },
    ],
    status: 'pending_review',
    executionMode: 'hybrid',
    requiresHumanReview: true,
    autoApprovalEligible: false,
    autoApprovalBlockers: ['Confidence (82%) below counterparty alert threshold (85%)'],
    queuedAt: toISOString(hoursAgo(2)),
    queuePriority: 70,
    estimatedImpact: 'high',
  },
  {
    id: 'aq-007',
    interventionId: 'exec-001',
    intervention: {
      id: 'exec-001',
      predictionId: 'pred-001',
      type: 'borrower_call',
      status: 'approved',
      priority: 'medium',
      title: `Weekly Check-in Call - ${bAbc.name}`,
      description: 'Routine weekly check-in to monitor cost reduction progress.',
      rationale: 'Maintaining close communication during covenant pressure period.',
      borrowerId: bAbc.id,
      borrowerName: bAbc.name,
      facilityId: fAbc.id,
      facilityName: fAbc.name,
      suggestedAction: 'Schedule 30-minute video call with CFO',
      actionDetails: {
        callAgenda: ['Cost reduction update', 'Cash flow status', 'Upcoming milestones'],
        suggestedTalkingPoints: ['Appreciate continued transparency', 'Monitoring progress closely'],
        participants: ['Relationship Manager', `CFO (${bAbc.name})`],
      },
      optimalTiming: 'Weekly on Wednesdays',
      deadlineDate: toDateString(daysFromNow(3)),
      createdAt: toISOString(daysAgo(1)),
      updatedAt: toISOString(hoursAgo(1)),
      requiresApproval: false,
      approvedBy: 'System (Auto)',
      approvedAt: toISOString(daysAgo(1)),
      expectedOutcome: 'Continued visibility into borrower operations',
    },
    confidenceScore: 91,
    confidenceFactors: [
      {
        factor: 'Routine Effectiveness',
        score: 94,
        weight: 0.4,
        explanation: 'Weekly check-ins have high engagement and information value',
        source: 'historical',
      },
      {
        factor: 'Relationship Maintenance',
        score: 90,
        weight: 0.35,
        explanation: 'Regular contact maintains strong borrower relationship',
        source: 'historical',
      },
      {
        factor: 'Low Disruption',
        score: 88,
        weight: 0.25,
        explanation: 'Short calls fit well into borrower schedule',
        source: 'user_feedback',
      },
    ],
    status: 'executing',
    executionMode: 'auto',
    requiresHumanReview: false,
    autoApprovalEligible: true,
    autoApprovalReason: 'Routine check-in with high confidence (91%)',
    queuedAt: toISOString(daysAgo(1)),
    executionStartedAt: toISOString(hoursAgo(1)),
    queuePriority: 45,
    estimatedImpact: 'low',
  },
  {
    id: 'aq-008',
    interventionId: 'comp-001',
    intervention: {
      id: 'comp-001',
      predictionId: 'pred-004',
      type: 'esg_action',
      status: 'executed',
      priority: 'low',
      title: `Carbon Tracking Report Generation - ${bEcotech.name}`,
      description: 'Automated generation of monthly carbon emissions tracking report.',
      rationale: 'Regular tracking helps identify trends and support covenant compliance.',
      borrowerId: bEcotech.id,
      borrowerName: bEcotech.name,
      facilityId: fEcotech.id,
      facilityName: fEcotech.name,
      suggestedAction: 'Generate and distribute monthly ESG report',
      actionDetails: {
        documentsRequested: ['Carbon Emissions Summary', 'Trend Analysis', 'Compliance Gap Analysis'],
        dueDate: toDateString(daysFromNow(0)),
      },
      optimalTiming: 'Monthly on 15th',
      deadlineDate: toDateString(daysFromNow(0)),
      createdAt: toISOString(daysAgo(1)),
      updatedAt: toISOString(hoursAgo(2)),
      requiresApproval: false,
      approvedBy: 'System (Auto)',
      approvedAt: toISOString(daysAgo(1)),
      executedAt: toISOString(hoursAgo(2)),
      expectedOutcome: 'Stakeholders informed of ESG compliance status',
      actualOutcome: 'Report generated and distributed to 5 stakeholders',
      effectivenessScore: 95,
    },
    confidenceScore: 96,
    confidenceFactors: [
      {
        factor: 'Automation Reliability',
        score: 98,
        weight: 0.4,
        explanation: 'Report generation is fully automated with 99.9% uptime',
        source: 'historical',
      },
      {
        factor: 'Data Availability',
        score: 95,
        weight: 0.35,
        explanation: 'All required data sources are connected and current',
        source: 'rule',
      },
      {
        factor: 'Stakeholder Value',
        score: 92,
        weight: 0.25,
        explanation: 'Reports consistently receive positive feedback',
        source: 'user_feedback',
      },
    ],
    status: 'completed',
    executionMode: 'auto',
    requiresHumanReview: false,
    autoApprovalEligible: true,
    autoApprovalReason: 'Routine report with very high confidence (96%)',
    queuedAt: toISOString(daysAgo(1)),
    scheduledExecutionTime: toISOString(hoursAgo(2)),
    executionStartedAt: toISOString(hoursAgo(2)),
    executionCompletedAt: toISOString(hoursAgo(2)),
    executionResult: {
      success: true,
      outcome: 'Monthly carbon tracking report generated and distributed',
      artifacts: [
        {
          id: 'art-001',
          type: 'report',
          title: `${bEcotech.name} - Monthly Carbon Emissions Report`,
          url: '/reports/ecotech-carbon-monthly.pdf',
          createdAt: toISOString(hoursAgo(2)),
        },
        {
          id: 'art-002',
          type: 'email',
          title: 'ESG Report Distribution Email',
          content: 'Monthly carbon tracking report attached for your review.',
          createdAt: toISOString(hoursAgo(2)),
        },
      ],
      metrics: {
        executionTimeMs: 1800000,
        retryCount: 0,
        resourcesUsed: ['Data Pipeline', 'Report Generator', 'Email Service'],
      },
    },
    queuePriority: 40,
    estimatedImpact: 'low',
  },
];

// =============================================================================
// Action Queue Dashboard Data
// =============================================================================

export const mockActionQueueDashboardData: ActionQueueDashboardData = {
  queuedActions: mockActionQueueItems.filter((a) => a.status === 'queued' || a.status === 'auto_approved'),
  pendingReviewActions: mockActionQueueItems.filter((a) => a.status === 'pending_review'),
  executingActions: mockActionQueueItems.filter((a) => a.status === 'executing'),
  recentlyCompletedActions: mockActionQueueItems.filter((a) => a.status === 'completed'),
  queueMetrics: mockActionQueueMetrics,
  thresholdSettings: mockAutoApprovalThresholds,
};
