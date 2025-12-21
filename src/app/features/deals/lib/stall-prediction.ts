/**
 * Deal Stall Prediction Engine
 * Pattern matching and predictive analytics for identifying at-risk deals
 */

import type {
  DealVelocityMetrics,
  StallRiskAssessment,
  StallRiskFactor,
  HistoricalPatternMatch,
  ParticipantEngagement,
  DealBenchmark,
} from './velocity-types';
import { DEFAULT_BENCHMARK } from './velocity-service';
import type { CategoryWithTerms } from './types';

// ============================================
// Historical Patterns Database (Mock)
// ============================================

const HISTORICAL_PATTERNS: HistoricalPatternMatch[] = [
  {
    patternId: 'covenant-deadlock',
    patternName: 'Covenant Negotiation Deadlock',
    similarity: 0,
    outcomeType: 'stalled_failed',
    historicalCloseRate: 0.45,
    averageRecoveryDays: 8,
    keyCharacteristics: [
      'No progress on Financial Covenants for 5+ days',
      'Multiple rejected proposals on same term',
      'Reduced comment frequency',
    ],
  },
  {
    patternId: 'pricing-standoff',
    patternName: 'Pricing Term Standoff',
    similarity: 0,
    outcomeType: 'stalled_recovered',
    historicalCloseRate: 0.62,
    averageRecoveryDays: 5,
    keyCharacteristics: [
      'Pricing terms under discussion for 7+ days',
      'Counter-proposals within narrow range',
      'Active comments but no agreements',
    ],
  },
  {
    patternId: 'participant-dropout',
    patternName: 'Key Participant Disengagement',
    similarity: 0,
    outcomeType: 'stalled_failed',
    historicalCloseRate: 0.38,
    averageRecoveryDays: 12,
    keyCharacteristics: [
      'Deal lead inactive for 3+ days',
      'No response to proposals for 5+ days',
      'Engagement score dropped below 30',
    ],
  },
  {
    patternId: 'velocity-decline',
    patternName: 'Gradual Velocity Decline',
    similarity: 0,
    outcomeType: 'stalled_recovered',
    historicalCloseRate: 0.71,
    averageRecoveryDays: 4,
    keyCharacteristics: [
      'Activity rate dropped 50%+ week over week',
      'Longer intervals between proposals',
      'Decreased participant engagement',
    ],
  },
  {
    patternId: 'deadline-pressure',
    patternName: 'Pre-Deadline Stall',
    similarity: 0,
    outcomeType: 'closed_successfully',
    historicalCloseRate: 0.78,
    averageRecoveryDays: 2,
    keyCharacteristics: [
      'Target close date within 14 days',
      'Multiple terms still under discussion',
      'Recent burst of activity followed by pause',
    ],
  },
  {
    patternId: 'momentum-loss',
    patternName: 'Post-Agreement Momentum Loss',
    similarity: 0,
    outcomeType: 'stalled_recovered',
    historicalCloseRate: 0.68,
    averageRecoveryDays: 6,
    keyCharacteristics: [
      'Strong initial progress (5+ agreements)',
      'Recent slowdown on remaining terms',
      'No new proposals in 3+ days',
    ],
  },
];

// ============================================
// Risk Factor Detection
// ============================================

export function detectRiskFactors(
  metrics: DealVelocityMetrics,
  participants: ParticipantEngagement[],
  categories: CategoryWithTerms[],
  benchmark: DealBenchmark = DEFAULT_BENCHMARK
): StallRiskFactor[] {
  const factors: StallRiskFactor[] = [];

  // 1. Inactivity Period Risk
  if (metrics.daysSinceLastActivity >= benchmark.inactivityCriticalDays) {
    factors.push({
      factorType: 'inactivity_period',
      severity: 'high',
      weight: 0.3,
      description: `No activity for ${metrics.daysSinceLastActivity} days (critical threshold: ${benchmark.inactivityCriticalDays} days)`,
      dataPoints: {
        daysSinceLastActivity: metrics.daysSinceLastActivity,
        threshold: benchmark.inactivityCriticalDays,
      },
    });
  } else if (metrics.daysSinceLastActivity >= benchmark.inactivityWarningDays) {
    factors.push({
      factorType: 'inactivity_period',
      severity: 'medium',
      weight: 0.15,
      description: `No activity for ${metrics.daysSinceLastActivity} days (warning threshold: ${benchmark.inactivityWarningDays} days)`,
      dataPoints: {
        daysSinceLastActivity: metrics.daysSinceLastActivity,
        threshold: benchmark.inactivityWarningDays,
      },
    });
  }

  // 2. Low Engagement Risk
  if (metrics.participantEngagementRate < 40) {
    factors.push({
      factorType: 'low_engagement',
      severity: metrics.participantEngagementRate < 25 ? 'high' : 'medium',
      weight: metrics.participantEngagementRate < 25 ? 0.25 : 0.15,
      description: `Only ${Math.round(metrics.participantEngagementRate)}% of participants active in the last 7 days`,
      dataPoints: {
        engagementRate: metrics.participantEngagementRate,
        activeParticipants: participants.filter((p) => p.isActive).length,
        totalParticipants: participants.length,
      },
    });
  }

  // 3. Stuck on Term Risk
  for (const category of categories) {
    for (const term of category.terms) {
      if (
        term.negotiation_status === 'under_discussion' &&
        term.pending_proposals_count >= 3
      ) {
        factors.push({
          factorType: 'stuck_on_term',
          severity: term.pending_proposals_count >= 5 ? 'high' : 'medium',
          weight: term.pending_proposals_count >= 5 ? 0.2 : 0.1,
          description: `"${term.term_label}" has ${term.pending_proposals_count} pending proposals without resolution`,
          relatedTermId: term.id,
          dataPoints: {
            termLabel: term.term_label,
            category: category.name,
            pendingProposals: term.pending_proposals_count,
            commentsCount: term.comments_count,
          },
        });
      }
    }
  }

  // 4. Unresponsive Party Risk
  for (const participant of participants) {
    if (
      participant.dealRole === 'deal_lead' &&
      participant.daysSinceLastActivity >= 3
    ) {
      factors.push({
        factorType: 'unresponsive_party',
        severity: participant.daysSinceLastActivity >= 5 ? 'high' : 'medium',
        weight: 0.25,
        description: `Deal lead "${participant.partyName}" inactive for ${participant.daysSinceLastActivity} days`,
        relatedPartyId: participant.participantId,
        dataPoints: {
          partyName: participant.partyName,
          partyType: participant.partyType,
          daysSinceLastActivity: participant.daysSinceLastActivity,
          engagementScore: participant.engagementScore,
        },
      });
    }
  }

  // 5. Covenant Stalemate Risk (checking Financial Covenants category)
  const covenantCategory = categories.find((c) =>
    c.name.toLowerCase().includes('covenant')
  );
  if (covenantCategory) {
    const stuckCovenants = covenantCategory.terms.filter(
      (t) =>
        t.negotiation_status === 'under_discussion' &&
        t.pending_proposals_count >= 2
    );
    if (stuckCovenants.length >= 2) {
      factors.push({
        factorType: 'covenant_stalemate',
        severity: 'high',
        weight: 0.25,
        description: `${stuckCovenants.length} covenant terms stuck in negotiation - historically a 40% close rate in similar situations`,
        dataPoints: {
          stuckTerms: stuckCovenants.map((t) => t.term_label),
          historicalCloseRate: 0.4,
        },
      });
    }
  }

  // 6. Pricing Deadlock Risk
  const pricingCategory = categories.find((c) =>
    c.name.toLowerCase().includes('pricing')
  );
  if (pricingCategory) {
    const stuckPricing = pricingCategory.terms.filter(
      (t) => t.negotiation_status === 'under_discussion'
    );
    if (stuckPricing.length > 0 && metrics.daysSinceLastAgreement >= 5) {
      factors.push({
        factorType: 'pricing_deadlock',
        severity: 'medium',
        weight: 0.15,
        description: `Pricing terms under discussion for extended period with no recent agreements`,
        dataPoints: {
          stuckTerms: stuckPricing.map((t) => t.term_label),
          daysSinceLastAgreement: metrics.daysSinceLastAgreement,
        },
      });
    }
  }

  // 7. Proposal Rejection Streak
  if (metrics.responseRateToProposals < 50 && metrics.daysSinceLastAgreement >= 5) {
    factors.push({
      factorType: 'proposal_rejection_streak',
      severity: 'medium',
      weight: 0.15,
      description: `Low proposal acceptance rate (${Math.round(metrics.responseRateToProposals)}%) combined with no recent agreements`,
      dataPoints: {
        responseRate: metrics.responseRateToProposals,
        daysSinceLastAgreement: metrics.daysSinceLastAgreement,
      },
    });
  }

  // 8. Velocity Decline
  if (
    metrics.velocityTrend === 'decelerating' ||
    metrics.velocityTrend === 'stalled'
  ) {
    factors.push({
      factorType: 'inactivity_period',
      severity: metrics.velocityTrend === 'stalled' ? 'high' : 'medium',
      weight: metrics.velocityTrend === 'stalled' ? 0.2 : 0.1,
      description: `Deal velocity is ${metrics.velocityTrend} - currently at ${Math.round(metrics.comparedToHistoricalAverage * 100)}% of historical average`,
      dataPoints: {
        velocityTrend: metrics.velocityTrend,
        comparedToHistorical: metrics.comparedToHistoricalAverage,
        proposalsPerDay: metrics.proposalsPerDay,
      },
    });
  }

  return factors;
}

// ============================================
// Pattern Matching
// ============================================

export function matchHistoricalPatterns(
  metrics: DealVelocityMetrics,
  riskFactors: StallRiskFactor[],
  categories: CategoryWithTerms[]
): HistoricalPatternMatch[] {
  const matchedPatterns: HistoricalPatternMatch[] = [];

  for (const pattern of HISTORICAL_PATTERNS) {
    const similarity = calculatePatternSimilarity(pattern, metrics, riskFactors, categories);

    if (similarity >= 0.5) {
      matchedPatterns.push({
        ...pattern,
        similarity,
      });
    }
  }

  return matchedPatterns.sort((a, b) => b.similarity - a.similarity);
}

function calculatePatternSimilarity(
  pattern: HistoricalPatternMatch,
  metrics: DealVelocityMetrics,
  riskFactors: StallRiskFactor[],
  categories: CategoryWithTerms[]
): number {
  let matchScore = 0;
  let maxScore = 0;

  switch (pattern.patternId) {
    case 'covenant-deadlock':
      maxScore = 3;
      if (riskFactors.some((f) => f.factorType === 'covenant_stalemate')) matchScore += 1;
      if (riskFactors.some((f) => f.factorType === 'proposal_rejection_streak')) matchScore += 1;
      if (metrics.velocityTrend === 'decelerating' || metrics.velocityTrend === 'stalled') matchScore += 1;
      break;

    case 'pricing-standoff':
      maxScore = 3;
      if (riskFactors.some((f) => f.factorType === 'pricing_deadlock')) matchScore += 1.5;
      if (metrics.daysSinceLastAgreement >= 5) matchScore += 1;
      if (metrics.commentsPerDay > 1) matchScore += 0.5; // Active discussion but no progress
      break;

    case 'participant-dropout':
      maxScore = 3;
      if (riskFactors.some((f) => f.factorType === 'unresponsive_party')) matchScore += 1.5;
      if (riskFactors.some((f) => f.factorType === 'low_engagement')) matchScore += 1;
      if (metrics.participantEngagementRate < 50) matchScore += 0.5;
      break;

    case 'velocity-decline':
      maxScore = 3;
      if (metrics.velocityTrend === 'decelerating') matchScore += 1.5;
      if (metrics.comparedToHistoricalAverage < 0.7) matchScore += 1;
      if (metrics.engagementTrend === 'decreasing') matchScore += 0.5;
      break;

    case 'deadline-pressure':
      maxScore = 3;
      const hasMultipleUnderDiscussion = categories.some(
        (c) => c.terms.filter((t) => t.negotiation_status === 'under_discussion').length >= 2
      );
      if (hasMultipleUnderDiscussion) matchScore += 1.5;
      if (metrics.daysSinceLastActivity >= 2) matchScore += 1;
      if (metrics.velocityTrend === 'decelerating') matchScore += 0.5;
      break;

    case 'momentum-loss':
      maxScore = 3;
      const agreedTermsCount = categories.reduce(
        (sum, c) => sum + c.terms.filter((t) => t.negotiation_status === 'agreed').length,
        0
      );
      if (agreedTermsCount >= 5) matchScore += 1;
      if (metrics.daysSinceLastProposal >= 3) matchScore += 1;
      if (metrics.velocityTrend !== 'accelerating') matchScore += 1;
      break;
  }

  return maxScore > 0 ? matchScore / maxScore : 0;
}

// ============================================
// Risk Assessment
// ============================================

export function assessStallRisk(
  dealId: string,
  metrics: DealVelocityMetrics,
  participants: ParticipantEngagement[],
  categories: CategoryWithTerms[],
  benchmark: DealBenchmark = DEFAULT_BENCHMARK
): StallRiskAssessment {
  const riskFactors = detectRiskFactors(metrics, participants, categories, benchmark);
  const matchedPatterns = matchHistoricalPatterns(metrics, riskFactors, categories);

  // Calculate overall risk score (0-100)
  const factorScore = riskFactors.reduce((sum, f) => {
    const severityMultiplier = f.severity === 'high' ? 1 : f.severity === 'medium' ? 0.6 : 0.3;
    return sum + f.weight * severityMultiplier * 100;
  }, 0);

  const patternScore = matchedPatterns.length > 0
    ? matchedPatterns[0].similarity * (1 - matchedPatterns[0].historicalCloseRate) * 50
    : 0;

  const overallRiskScore = Math.min(100, factorScore + patternScore);

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  if (overallRiskScore >= 70) riskLevel = 'critical';
  else if (overallRiskScore >= 50) riskLevel = 'high';
  else if (overallRiskScore >= 30) riskLevel = 'medium';
  else riskLevel = 'low';

  // Calculate probability of stall
  const probabilityOfStall = Math.min(0.95, overallRiskScore / 100);

  // Estimate days until stall
  let estimatedDaysUntilStall: number | null = null;
  if (metrics.velocityTrend === 'stalled') {
    estimatedDaysUntilStall = 0;
  } else if (metrics.velocityTrend === 'decelerating') {
    estimatedDaysUntilStall = Math.max(1, 7 - metrics.daysSinceLastActivity);
  } else if (riskLevel === 'high' || riskLevel === 'critical') {
    estimatedDaysUntilStall = 3 + Math.floor(Math.random() * 4);
  }

  // Calculate confidence based on data quality
  const dataQuality = Math.min(
    1,
    (participants.length / 3) * 0.3 +
    (categories.length / 3) * 0.3 +
    (riskFactors.length > 0 ? 0.4 : 0.2)
  );
  const confidence = 0.6 + dataQuality * 0.35;

  return {
    dealId,
    assessmentDate: new Date().toISOString(),
    overallRiskScore,
    riskLevel,
    probabilityOfStall,
    estimatedDaysUntilStall,
    riskFactors,
    matchedPatterns,
    confidence,
  };
}
