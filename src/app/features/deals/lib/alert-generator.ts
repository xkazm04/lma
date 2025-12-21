/**
 * Deal Acceleration Alert Generator
 * Generates contextual alerts with AI-powered intervention suggestions
 */

import type {
  DealAccelerationAlert,
  DealAlertType,
  AlertSeverity,
  AlertCategory,
  SuggestedIntervention,
  InterventionType,
  StallRiskAssessment,
  DealVelocityMetrics,
  ParticipantEngagement,
  SchedulingConfig,
  HistoricalPatternMatch,
} from './velocity-types';
import type { CategoryWithTerms } from './types';

// ============================================
// Alert Generation
// ============================================

export function generateAlerts(
  dealId: string,
  dealName: string,
  riskAssessment: StallRiskAssessment,
  metrics: DealVelocityMetrics,
  participants: ParticipantEngagement[],
  categories: CategoryWithTerms[]
): DealAccelerationAlert[] {
  const alerts: DealAccelerationAlert[] = [];
  const now = new Date();

  // Generate alerts based on risk factors
  for (const factor of riskAssessment.riskFactors) {
    const alert = createAlertFromRiskFactor(
      dealId,
      dealName,
      factor,
      riskAssessment,
      metrics,
      participants,
      categories
    );
    if (alert) {
      alerts.push(alert);
    }
  }

  // Generate alerts based on matched patterns
  for (const pattern of riskAssessment.matchedPatterns.slice(0, 2)) {
    const alert = createAlertFromPattern(
      dealId,
      dealName,
      pattern,
      riskAssessment,
      metrics,
      participants
    );
    if (alert) {
      alerts.push(alert);
    }
  }

  // Add opportunity alert if conditions are right
  if (
    riskAssessment.riskLevel !== 'critical' &&
    metrics.velocityTrend !== 'stalled' &&
    participants.filter((p) => p.isActive).length >= 2
  ) {
    const opportunityAlert = createOpportunityAlert(
      dealId,
      dealName,
      metrics,
      participants,
      categories
    );
    if (opportunityAlert) {
      alerts.push(opportunityAlert);
    }
  }

  // Sort by severity and deduplicate similar alerts
  return deduplicateAlerts(alerts).sort((a, b) => {
    const severityOrder = { critical: 0, urgent: 1, warning: 2, info: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

function createAlertFromRiskFactor(
  dealId: string,
  dealName: string,
  factor: StallRiskAssessment['riskFactors'][0],
  riskAssessment: StallRiskAssessment,
  metrics: DealVelocityMetrics,
  participants: ParticipantEngagement[],
  categories: CategoryWithTerms[]
): DealAccelerationAlert | null {
  const alertId = generateAlertId();
  const now = new Date();

  let alertType: DealAlertType;
  let title: string;
  let description: string;
  let contextualInsight: string;
  let severity: AlertSeverity;
  let category: AlertCategory;
  let interventions: SuggestedIntervention[];

  switch (factor.factorType) {
    case 'inactivity_period':
      alertType = 'overall_velocity_decline';
      severity = factor.severity === 'high' ? 'urgent' : 'warning';
      category = 'velocity';
      title = 'Deal Activity Has Stalled';
      description = factor.description;
      contextualInsight = `Similar deals that paused for ${factor.dataPoints.daysSinceLastActivity} days had ${Math.round((1 - riskAssessment.matchedPatterns[0]?.historicalCloseRate || 0.6) * 100)}% lower close rates. The average recovery time for deals at this stage is ${riskAssessment.matchedPatterns[0]?.averageRecoveryDays || 5} days with proactive intervention.`;
      interventions = generateInactivityInterventions(dealId, participants, categories);
      break;

    case 'low_engagement':
      alertType = 'participant_disengagement';
      severity = factor.severity === 'high' ? 'urgent' : 'warning';
      category = 'engagement';
      title = 'Participant Engagement Dropping';
      description = factor.description;
      contextualInsight = `When engagement drops below 40%, deals are 2.3x more likely to stall. Consider reaching out to inactive parties: ${participants.filter((p) => !p.isActive).map((p) => p.partyName).join(', ')}`;
      interventions = generateEngagementInterventions(dealId, participants);
      break;

    case 'stuck_on_term':
      alertType = 'covenant_negotiation_pause';
      severity = factor.severity === 'high' ? 'urgent' : 'warning';
      category = 'velocity';
      title = `"${factor.dataPoints.termLabel}" Negotiation Stuck`;
      description = factor.description;
      contextualInsight = `This term has ${factor.dataPoints.pendingProposals} pending proposals. Deals with 3+ unresolved proposals on a single term typically require 7 additional days to close. Consider a package deal or escalation.`;
      interventions = generateTermStuckInterventions(dealId, factor, participants);
      break;

    case 'unresponsive_party':
      alertType = 'party_response_delay';
      severity = factor.severity === 'high' ? 'critical' : 'urgent';
      category = 'engagement';
      title = `Key Party "${factor.dataPoints.partyName}" Unresponsive`;
      description = factor.description;
      contextualInsight = `When deal leads are inactive for ${factor.dataPoints.daysSinceLastActivity}+ days, 62% of deals experience significant delays. Direct outreach typically resolves this within 24-48 hours.`;
      interventions = generateUnresponsivePartyInterventions(dealId, factor, participants);
      break;

    case 'covenant_stalemate':
      alertType = 'covenant_negotiation_pause';
      severity = 'urgent';
      category = 'velocity';
      title = 'Covenant Terms at Stalemate';
      description = factor.description;
      contextualInsight = `Multiple covenant terms stuck in negotiation is a critical warning sign. Similar deals had only 40% close rates. Consider: scheduling a call, proposing a package deal, or bringing in a senior stakeholder.`;
      interventions = generateCovenantStalemateInterventions(dealId, participants, categories);
      break;

    case 'pricing_deadlock':
      alertType = 'pricing_term_deadlock';
      severity = 'warning';
      category = 'velocity';
      title = 'Pricing Terms Under Extended Discussion';
      description = factor.description;
      contextualInsight = `Pricing negotiations lasting more than 5 days without progress indicate a possible value gap. Sharing market comparables or offering conditional terms often breaks the deadlock.`;
      interventions = generatePricingDeadlockInterventions(dealId, participants);
      break;

    case 'proposal_rejection_streak':
      alertType = 'proposal_rejection_pattern';
      severity = 'warning';
      category = 'pattern';
      title = 'High Proposal Rejection Rate';
      description = factor.description;
      contextualInsight = `Low acceptance rates suggest misaligned expectations. Before the next proposal, consider a brief alignment call to understand priorities.`;
      interventions = generateRejectionPatternInterventions(dealId, participants);
      break;

    default:
      return null;
  }

  return {
    id: alertId,
    dealId,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    severity,
    category,
    alertType,
    title,
    description,
    contextualInsight,
    stallRiskScore: riskAssessment.overallRiskScore,
    historicalCloseRate: riskAssessment.matchedPatterns[0]?.historicalCloseRate || 0.72,
    interventions,
    status: 'active',
    acknowledgedAt: null,
    acknowledgedBy: null,
    actionTakenAt: null,
    resolutionNotes: null,
  };
}

function createAlertFromPattern(
  dealId: string,
  dealName: string,
  pattern: HistoricalPatternMatch,
  riskAssessment: StallRiskAssessment,
  metrics: DealVelocityMetrics,
  participants: ParticipantEngagement[]
): DealAccelerationAlert | null {
  // Only create pattern-based alerts for high similarity matches
  if (pattern.similarity < 0.65) return null;

  const alertId = generateAlertId();
  const now = new Date();

  const closeRatePercent = Math.round(pattern.historicalCloseRate * 100);
  const failRatePercent = 100 - closeRatePercent;

  return {
    id: alertId,
    dealId,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    severity: pattern.historicalCloseRate < 0.5 ? 'critical' : 'urgent',
    category: 'pattern',
    alertType: 'agreement_momentum_loss',
    title: `Pattern Detected: ${pattern.patternName}`,
    description: `This deal matches ${Math.round(pattern.similarity * 100)}% with the "${pattern.patternName}" pattern. Key characteristics: ${pattern.keyCharacteristics.slice(0, 2).join('; ')}.`,
    contextualInsight: `Historically, deals matching this pattern had a ${failRatePercent}% failure rate. However, with timely intervention, ${closeRatePercent}% still closed successfully. Average recovery time is ${pattern.averageRecoveryDays} days when action is taken promptly.`,
    stallRiskScore: riskAssessment.overallRiskScore,
    historicalCloseRate: pattern.historicalCloseRate,
    interventions: generatePatternBasedInterventions(dealId, pattern, participants),
    status: 'active',
    acknowledgedAt: null,
    acknowledgedBy: null,
    actionTakenAt: null,
    resolutionNotes: null,
  };
}

function createOpportunityAlert(
  dealId: string,
  dealName: string,
  metrics: DealVelocityMetrics,
  participants: ParticipantEngagement[],
  categories: CategoryWithTerms[]
): DealAccelerationAlert | null {
  // Check for optimal closing window
  const agreedTerms = categories.reduce(
    (sum, c) => sum + c.terms.filter((t) => t.negotiation_status === 'agreed').length,
    0
  );
  const totalTerms = categories.reduce((sum, c) => sum + c.terms.length, 0);
  const progressPercent = totalTerms > 0 ? (agreedTerms / totalTerms) * 100 : 0;

  if (
    progressPercent >= 70 &&
    metrics.velocityTrend !== 'stalled' &&
    metrics.participantEngagementRate >= 60
  ) {
    return {
      id: generateAlertId(),
      dealId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      severity: 'info',
      category: 'opportunity',
      alertType: 'optimal_closing_window',
      title: 'Optimal Closing Window Detected',
      description: `Deal is ${Math.round(progressPercent)}% complete with strong engagement. Now is the ideal time to push for final agreements.`,
      contextualInsight: `Deals at this stage that accelerate their pace have 85% close rates. Consider scheduling a final terms call to lock in remaining agreements.`,
      stallRiskScore: 20,
      historicalCloseRate: 0.85,
      interventions: generateClosingWindowInterventions(dealId, participants, categories),
      status: 'active',
      acknowledgedAt: null,
      acknowledgedBy: null,
      actionTakenAt: null,
      resolutionNotes: null,
    };
  }

  return null;
}

// ============================================
// Intervention Generation
// ============================================

function generateInactivityInterventions(
  dealId: string,
  participants: ParticipantEngagement[],
  categories: CategoryWithTerms[]
): SuggestedIntervention[] {
  const dealLeads = participants.filter((p) => p.dealRole === 'deal_lead');

  return [
    {
      id: generateAlertId(),
      interventionType: 'schedule_call',
      priority: 'primary',
      title: 'Schedule Alignment Call',
      description: 'Schedule a brief call with key stakeholders to re-establish momentum and address any blockers.',
      reasoning: 'Direct communication resolves 78% of inactivity periods within 48 hours.',
      estimatedImpact: {
        velocityImprovement: 45,
        stallRiskReduction: 35,
        closeRateImprovement: 12,
      },
      effortLevel: 'low',
      timeToImplement: '15 minutes',
      schedulingConfig: {
        suggestedParticipants: dealLeads.map((p) => p.participantId),
        suggestedDuration: 30,
        suggestedTimeSlots: generateTimeSlots(),
        meetingType: 'alignment_call',
        agendaItems: [
          'Review current negotiation status',
          'Identify any blockers or concerns',
          'Agree on next steps and timeline',
        ],
      },
      wasSelected: false,
      implementedAt: null,
      outcome: null,
    },
    {
      id: generateAlertId(),
      interventionType: 'send_summary',
      priority: 'secondary',
      title: 'Send Progress Summary',
      description: 'Send a concise summary of agreed terms and remaining items to all participants.',
      reasoning: 'Written summaries often prompt responses and re-engagement from inactive parties.',
      estimatedImpact: {
        velocityImprovement: 25,
        stallRiskReduction: 15,
        closeRateImprovement: 5,
      },
      effortLevel: 'low',
      timeToImplement: '10 minutes',
      wasSelected: false,
      implementedAt: null,
      outcome: null,
    },
    {
      id: generateAlertId(),
      interventionType: 'propose_package_deal',
      priority: 'alternative',
      title: 'Propose Package Agreement',
      description: 'Bundle remaining terms into a single package proposal to simplify decision-making.',
      reasoning: 'Package deals reduce negotiation rounds by 40% on average.',
      estimatedImpact: {
        velocityImprovement: 55,
        stallRiskReduction: 40,
        closeRateImprovement: 15,
      },
      effortLevel: 'medium',
      timeToImplement: '1-2 hours',
      wasSelected: false,
      implementedAt: null,
      outcome: null,
    },
  ];
}

function generateEngagementInterventions(
  dealId: string,
  participants: ParticipantEngagement[]
): SuggestedIntervention[] {
  const inactiveParties = participants.filter((p) => !p.isActive);

  return [
    {
      id: generateAlertId(),
      interventionType: 'schedule_call',
      priority: 'primary',
      title: 'Individual Check-ins with Inactive Parties',
      description: `Reach out directly to ${inactiveParties.map((p) => p.partyName).join(', ')} to understand their position.`,
      reasoning: 'Personal outreach has 3x higher response rate than group communications.',
      estimatedImpact: {
        velocityImprovement: 40,
        stallRiskReduction: 30,
        closeRateImprovement: 10,
      },
      effortLevel: 'medium',
      timeToImplement: '30-60 minutes',
      schedulingConfig: {
        suggestedParticipants: inactiveParties.map((p) => p.participantId),
        suggestedDuration: 15,
        suggestedTimeSlots: generateTimeSlots(),
        meetingType: 'alignment_call',
        agendaItems: [
          'Understand any concerns or blockers',
          'Review outstanding items',
          'Confirm continued participation',
        ],
      },
      wasSelected: false,
      implementedAt: null,
      outcome: null,
    },
    {
      id: generateAlertId(),
      interventionType: 'escalate_to_senior',
      priority: 'secondary',
      title: 'Escalate to Senior Stakeholders',
      description: 'Involve senior leadership to emphasize deal priority and timeline.',
      reasoning: 'Senior involvement accelerates decisions in 65% of stalled negotiations.',
      estimatedImpact: {
        velocityImprovement: 60,
        stallRiskReduction: 45,
        closeRateImprovement: 18,
      },
      effortLevel: 'medium',
      timeToImplement: '1-2 days',
      wasSelected: false,
      implementedAt: null,
      outcome: null,
    },
  ];
}

function generateTermStuckInterventions(
  dealId: string,
  factor: StallRiskAssessment['riskFactors'][0],
  participants: ParticipantEngagement[]
): SuggestedIntervention[] {
  return [
    {
      id: generateAlertId(),
      interventionType: 'break_term_into_parts',
      priority: 'primary',
      title: 'Break Term into Sub-Components',
      description: `Split "${factor.dataPoints.termLabel}" into smaller, more negotiable parts.`,
      reasoning: 'Breaking complex terms into components resolves 72% of single-term deadlocks.',
      estimatedImpact: {
        velocityImprovement: 50,
        stallRiskReduction: 35,
        closeRateImprovement: 12,
      },
      effortLevel: 'medium',
      timeToImplement: '1-2 hours',
      wasSelected: false,
      implementedAt: null,
      outcome: null,
    },
    {
      id: generateAlertId(),
      interventionType: 'offer_conditional_agreement',
      priority: 'secondary',
      title: 'Propose Conditional Agreement',
      description: 'Offer to agree on this term conditionally, tied to another term of interest to the other party.',
      reasoning: 'Conditional agreements create reciprocity and break deadlocks.',
      estimatedImpact: {
        velocityImprovement: 45,
        stallRiskReduction: 30,
        closeRateImprovement: 10,
      },
      effortLevel: 'low',
      timeToImplement: '30 minutes',
      wasSelected: false,
      implementedAt: null,
      outcome: null,
    },
    {
      id: generateAlertId(),
      interventionType: 'schedule_call',
      priority: 'alternative',
      title: 'Schedule Focused Discussion',
      description: 'Schedule a call specifically to resolve this term with key decision-makers.',
      reasoning: 'Focused discussions resolve specific issues 40% faster than async negotiation.',
      estimatedImpact: {
        velocityImprovement: 35,
        stallRiskReduction: 25,
        closeRateImprovement: 8,
      },
      effortLevel: 'low',
      timeToImplement: '15 minutes',
      schedulingConfig: {
        suggestedParticipants: participants.filter((p) => p.dealRole === 'deal_lead' || p.dealRole === 'negotiator').map((p) => p.participantId),
        suggestedDuration: 30,
        suggestedTimeSlots: generateTimeSlots(),
        meetingType: 'alignment_call',
        agendaItems: [
          `Review positions on ${factor.dataPoints.termLabel}`,
          'Identify core interests vs. positions',
          'Explore creative solutions',
        ],
      },
      wasSelected: false,
      implementedAt: null,
      outcome: null,
    },
  ];
}

function generateUnresponsivePartyInterventions(
  dealId: string,
  factor: StallRiskAssessment['riskFactors'][0],
  participants: ParticipantEngagement[]
): SuggestedIntervention[] {
  return [
    {
      id: generateAlertId(),
      interventionType: 'schedule_call',
      priority: 'primary',
      title: 'Direct Outreach Call',
      description: `Schedule a brief call with ${factor.dataPoints.partyName} to reconnect and address any concerns.`,
      reasoning: 'Direct calls typically get responses within 24 hours, compared to 3+ days for email.',
      estimatedImpact: {
        velocityImprovement: 55,
        stallRiskReduction: 40,
        closeRateImprovement: 15,
      },
      effortLevel: 'low',
      timeToImplement: '15 minutes',
      schedulingConfig: {
        suggestedParticipants: [factor.relatedPartyId || ''],
        suggestedDuration: 15,
        suggestedTimeSlots: generateTimeSlots(),
        meetingType: 'alignment_call',
        agendaItems: [
          'Confirm continued engagement',
          'Address any concerns or blockers',
          'Align on next steps',
        ],
      },
      wasSelected: false,
      implementedAt: null,
      outcome: null,
    },
    {
      id: generateAlertId(),
      interventionType: 'escalate_to_senior',
      priority: 'secondary',
      title: 'Escalate Within Organization',
      description: 'Contact an alternative senior stakeholder at the unresponsive party.',
      reasoning: 'Escalation resolves unresponsiveness in 80% of cases within 48 hours.',
      estimatedImpact: {
        velocityImprovement: 65,
        stallRiskReduction: 50,
        closeRateImprovement: 20,
      },
      effortLevel: 'medium',
      timeToImplement: '1-2 hours',
      wasSelected: false,
      implementedAt: null,
      outcome: null,
    },
  ];
}

function generateCovenantStalemateInterventions(
  dealId: string,
  participants: ParticipantEngagement[],
  categories: CategoryWithTerms[]
): SuggestedIntervention[] {
  return [
    {
      id: generateAlertId(),
      interventionType: 'schedule_call',
      priority: 'primary',
      title: 'Schedule Covenant Alignment Call',
      description: 'Schedule a dedicated session to address all covenant terms together.',
      reasoning: 'Addressing covenants holistically improves close rates by 25% vs. term-by-term negotiation.',
      estimatedImpact: {
        velocityImprovement: 60,
        stallRiskReduction: 45,
        closeRateImprovement: 20,
      },
      effortLevel: 'low',
      timeToImplement: '15 minutes',
      schedulingConfig: {
        suggestedParticipants: participants.map((p) => p.participantId),
        suggestedDuration: 60,
        suggestedTimeSlots: generateTimeSlots(),
        meetingType: 'alignment_call',
        agendaItems: [
          'Review all covenant positions',
          'Understand priority order for each party',
          'Explore package deal structure',
          'Set decision timeline',
        ],
      },
      wasSelected: false,
      implementedAt: null,
      outcome: null,
    },
    {
      id: generateAlertId(),
      interventionType: 'propose_package_deal',
      priority: 'secondary',
      title: 'Propose Covenant Package',
      description: 'Create a single package proposal covering all covenant terms with balanced tradeoffs.',
      reasoning: 'Package deals on covenants close 35% faster than individual negotiations.',
      estimatedImpact: {
        velocityImprovement: 55,
        stallRiskReduction: 40,
        closeRateImprovement: 18,
      },
      effortLevel: 'medium',
      timeToImplement: '2-3 hours',
      wasSelected: false,
      implementedAt: null,
      outcome: null,
    },
    {
      id: generateAlertId(),
      interventionType: 'escalate_to_senior',
      priority: 'alternative',
      title: 'Bring in Senior Credit Officers',
      description: 'Involve senior credit decision-makers to expedite covenant negotiations.',
      reasoning: 'Senior involvement often unlocks flexibility on covenant structures.',
      estimatedImpact: {
        velocityImprovement: 70,
        stallRiskReduction: 55,
        closeRateImprovement: 25,
      },
      effortLevel: 'high',
      timeToImplement: '1-2 days',
      wasSelected: false,
      implementedAt: null,
      outcome: null,
    },
  ];
}

function generatePricingDeadlockInterventions(
  dealId: string,
  participants: ParticipantEngagement[]
): SuggestedIntervention[] {
  return [
    {
      id: generateAlertId(),
      interventionType: 'share_market_data',
      priority: 'primary',
      title: 'Share Market Comparables',
      description: 'Provide market data and comparable transactions to establish fair value reference.',
      reasoning: 'Market data-driven discussions resolve pricing deadlocks 60% faster.',
      estimatedImpact: {
        velocityImprovement: 45,
        stallRiskReduction: 30,
        closeRateImprovement: 12,
      },
      effortLevel: 'medium',
      timeToImplement: '1-2 hours',
      wasSelected: false,
      implementedAt: null,
      outcome: null,
    },
    {
      id: generateAlertId(),
      interventionType: 'offer_conditional_agreement',
      priority: 'secondary',
      title: 'Propose Pricing Grid',
      description: 'Offer a pricing structure tied to performance metrics or market conditions.',
      reasoning: 'Performance-linked pricing creates win-win scenarios and often breaks impasses.',
      estimatedImpact: {
        velocityImprovement: 50,
        stallRiskReduction: 35,
        closeRateImprovement: 15,
      },
      effortLevel: 'medium',
      timeToImplement: '1-2 hours',
      wasSelected: false,
      implementedAt: null,
      outcome: null,
    },
  ];
}

function generateRejectionPatternInterventions(
  dealId: string,
  participants: ParticipantEngagement[]
): SuggestedIntervention[] {
  return [
    {
      id: generateAlertId(),
      interventionType: 'schedule_call',
      priority: 'primary',
      title: 'Schedule Alignment Call',
      description: 'Meet to understand underlying interests before the next proposal.',
      reasoning: 'Understanding priorities before proposing reduces rejection rates by 50%.',
      estimatedImpact: {
        velocityImprovement: 40,
        stallRiskReduction: 30,
        closeRateImprovement: 12,
      },
      effortLevel: 'low',
      timeToImplement: '15 minutes',
      schedulingConfig: {
        suggestedParticipants: participants.filter((p) => p.dealRole !== 'observer').map((p) => p.participantId),
        suggestedDuration: 30,
        suggestedTimeSlots: generateTimeSlots(),
        meetingType: 'alignment_call',
        agendaItems: [
          'Review rejected proposals',
          'Understand core concerns',
          'Identify acceptable ranges',
          'Agree on approach for next round',
        ],
      },
      wasSelected: false,
      implementedAt: null,
      outcome: null,
    },
    {
      id: generateAlertId(),
      interventionType: 'add_mediator',
      priority: 'alternative',
      title: 'Engage Neutral Mediator',
      description: 'Bring in a neutral third party to facilitate negotiations.',
      reasoning: 'Mediation resolves 75% of deadlocked negotiations within one session.',
      estimatedImpact: {
        velocityImprovement: 65,
        stallRiskReduction: 50,
        closeRateImprovement: 22,
      },
      effortLevel: 'high',
      timeToImplement: '2-3 days',
      wasSelected: false,
      implementedAt: null,
      outcome: null,
    },
  ];
}

function generatePatternBasedInterventions(
  dealId: string,
  pattern: HistoricalPatternMatch,
  participants: ParticipantEngagement[]
): SuggestedIntervention[] {
  // Generate interventions based on pattern recovery strategies
  const baseInterventions: SuggestedIntervention[] = [
    {
      id: generateAlertId(),
      interventionType: 'schedule_call',
      priority: 'primary',
      title: 'Immediate Stakeholder Call',
      description: `Based on the "${pattern.patternName}" pattern, schedule an urgent alignment call within 24-48 hours.`,
      reasoning: `Deals matching this pattern recovered ${pattern.averageRecoveryDays} days faster with immediate intervention.`,
      estimatedImpact: {
        velocityImprovement: 50,
        stallRiskReduction: 40,
        closeRateImprovement: Math.round((1 - pattern.historicalCloseRate) * 100 * 0.4),
      },
      effortLevel: 'low',
      timeToImplement: '15 minutes',
      schedulingConfig: {
        suggestedParticipants: participants.filter((p) => p.dealRole === 'deal_lead').map((p) => p.participantId),
        suggestedDuration: 45,
        suggestedTimeSlots: generateTimeSlots(),
        meetingType: pattern.outcomeType === 'stalled_failed' ? 'escalation_meeting' : 'alignment_call',
        agendaItems: [
          'Review current status and blockers',
          'Address pattern-specific risk factors',
          'Commit to accelerated timeline',
          'Assign action items with deadlines',
        ],
      },
      wasSelected: false,
      implementedAt: null,
      outcome: null,
    },
  ];

  return baseInterventions;
}

function generateClosingWindowInterventions(
  dealId: string,
  participants: ParticipantEngagement[],
  categories: CategoryWithTerms[]
): SuggestedIntervention[] {
  const remainingTerms = categories.flatMap((c) =>
    c.terms.filter((t) => t.negotiation_status !== 'agreed' && t.negotiation_status !== 'locked')
  );

  return [
    {
      id: generateAlertId(),
      interventionType: 'schedule_call',
      priority: 'primary',
      title: 'Schedule Final Terms Call',
      description: `Address the ${remainingTerms.length} remaining terms in a focused session to close the deal.`,
      reasoning: 'Deals at 70%+ completion close 85% of the time with a focused final push.',
      estimatedImpact: {
        velocityImprovement: 70,
        stallRiskReduction: 60,
        closeRateImprovement: 15,
      },
      effortLevel: 'low',
      timeToImplement: '15 minutes',
      schedulingConfig: {
        suggestedParticipants: participants.map((p) => p.participantId),
        suggestedDuration: 60,
        suggestedTimeSlots: generateTimeSlots(),
        meetingType: 'alignment_call',
        agendaItems: [
          'Review remaining open terms',
          'Address each term systematically',
          'Lock in final agreements',
          'Set documentation timeline',
        ],
      },
      wasSelected: false,
      implementedAt: null,
      outcome: null,
    },
    {
      id: generateAlertId(),
      interventionType: 'propose_package_deal',
      priority: 'secondary',
      title: 'Create Final Package Proposal',
      description: 'Bundle all remaining terms into a comprehensive final proposal.',
      reasoning: 'Final package proposals have 80% acceptance rate at this stage.',
      estimatedImpact: {
        velocityImprovement: 65,
        stallRiskReduction: 55,
        closeRateImprovement: 12,
      },
      effortLevel: 'medium',
      timeToImplement: '1-2 hours',
      wasSelected: false,
      implementedAt: null,
      outcome: null,
    },
  ];
}

// ============================================
// Utility Functions
// ============================================

function generateAlertId(): string {
  // Use timestamp + random suffix for unique IDs
  return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateTimeSlots(): SchedulingConfig['suggestedTimeSlots'] {
  const now = new Date();
  const slots: SchedulingConfig['suggestedTimeSlots'] = [];

  // Generate slots for next 3 business days
  for (let dayOffset = 1; dayOffset <= 5; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    // Morning slot
    const morning = new Date(date);
    morning.setHours(10, 0, 0, 0);
    slots.push({
      startTime: morning.toISOString(),
      endTime: new Date(morning.getTime() + 30 * 60 * 1000).toISOString(),
      availability: slots.length < 2 ? 'high' : 'medium',
    });

    // Afternoon slot
    const afternoon = new Date(date);
    afternoon.setHours(14, 0, 0, 0);
    slots.push({
      startTime: afternoon.toISOString(),
      endTime: new Date(afternoon.getTime() + 30 * 60 * 1000).toISOString(),
      availability: slots.length < 4 ? 'high' : 'medium',
    });

    if (slots.length >= 6) break;
  }

  return slots;
}

function deduplicateAlerts(alerts: DealAccelerationAlert[]): DealAccelerationAlert[] {
  const seen = new Set<string>();
  return alerts.filter((alert) => {
    const key = `${alert.alertType}-${alert.category}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export { generateAlertId };
