/**
 * Deal Velocity Tracking Service
 * Calculates velocity metrics, engagement scores, and trend analysis
 */

import type {
  DealVelocityMetrics,
  DealActivityEvent,
  ParticipantEngagement,
  DealBenchmark,
} from './velocity-types';

// ============================================
// Constants and Benchmarks
// ============================================

const DEFAULT_BENCHMARK: DealBenchmark = {
  dealType: 'new_facility',
  dealSize: 'medium',
  complexity: 'medium',
  averageDaysToClose: 45,
  medianDaysToClose: 38,
  averageProposalsPerTerm: 2.3,
  averageCommentsPerTerm: 4.5,
  healthyVelocityRange: {
    minProposalsPerDay: 0.5,
    maxProposalsPerDay: 5,
    minCommentsPerDay: 1,
    maxCommentsPerDay: 15,
  },
  inactivityWarningDays: 3,
  inactivityCriticalDays: 5,
  closeRate: 0.72,
  commonStallPoints: [
    { category: 'Financial Covenants', frequency: 0.35, averageResolutionDays: 7 },
    { category: 'Pricing Terms', frequency: 0.28, averageResolutionDays: 5 },
    { category: 'Security Package', frequency: 0.18, averageResolutionDays: 10 },
  ],
};

// ============================================
// Velocity Calculation Functions
// ============================================

export function calculateVelocityMetrics(
  dealId: string,
  activities: DealActivityEvent[],
  participants: ParticipantEngagement[],
  totalTerms: number,
  agreedTerms: number,
  benchmark: DealBenchmark = DEFAULT_BENCHMARK
): DealVelocityMetrics {
  const now = new Date();
  const sortedActivities = [...activities].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Calculate time-based metrics
  const proposals = sortedActivities.filter((a) => a.eventType === 'proposal_created');
  const comments = sortedActivities.filter((a) => a.eventType === 'comment_added');
  const agreements = sortedActivities.filter((a) => a.eventType === 'term_agreed');
  const proposalResponses = sortedActivities.filter((a) => a.eventType === 'proposal_response');

  const averageTimeBetweenProposals = calculateAverageInterval(proposals);
  const averageTimeBetweenComments = calculateAverageInterval(comments);

  // Calculate days since last activity
  const lastActivity = sortedActivities[0];
  const daysSinceLastActivity = lastActivity
    ? Math.floor((now.getTime() - new Date(lastActivity.timestamp).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  const lastProposal = proposals[0];
  const daysSinceLastProposal = lastProposal
    ? Math.floor((now.getTime() - new Date(lastProposal.timestamp).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  const lastAgreement = agreements[0];
  const daysSinceLastAgreement = lastAgreement
    ? Math.floor((now.getTime() - new Date(lastAgreement.timestamp).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  // Calculate daily rates (last 7 days)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentProposals = proposals.filter((p) => new Date(p.timestamp) >= sevenDaysAgo);
  const recentComments = comments.filter((c) => new Date(c.timestamp) >= sevenDaysAgo);
  const recentAgreements = agreements.filter((a) => new Date(a.timestamp) >= sevenDaysAgo);

  const proposalsPerDay = recentProposals.length / 7;
  const commentsPerDay = recentComments.length / 7;
  const agreedTermsPerDay = recentAgreements.length / 7;

  // Calculate engagement metrics
  const activeParticipants = participants.filter((p) => p.daysSinceLastActivity <= 7);
  const participantEngagementRate = participants.length > 0
    ? (activeParticipants.length / participants.length) * 100
    : 0;

  const responseRateToProposals = proposals.length > 0
    ? (proposalResponses.length / proposals.length) * 100
    : 100;

  // Calculate progress velocity
  const progressPercentage = totalTerms > 0 ? (agreedTerms / totalTerms) * 100 : 0;
  const dealStartDate = sortedActivities.length > 0
    ? new Date(sortedActivities[sortedActivities.length - 1].timestamp)
    : now;
  const dealAgeDays = Math.max(1, Math.floor((now.getTime() - dealStartDate.getTime()) / (1000 * 60 * 60 * 24)));
  const progressVelocity = progressPercentage / dealAgeDays;

  // Estimate days to completion
  const remainingProgress = 100 - progressPercentage;
  const estimatedDaysToCompletion = progressVelocity > 0
    ? Math.ceil(remainingProgress / progressVelocity)
    : null;

  // Determine trends
  const velocityTrend = determineVelocityTrend(sortedActivities, benchmark);
  const engagementTrend = determineEngagementTrend(participants);

  // Compare to historical average
  const historicalVelocity = 100 / benchmark.averageDaysToClose;
  const comparedToHistoricalAverage = historicalVelocity > 0
    ? progressVelocity / historicalVelocity
    : 1;

  return {
    dealId,
    measurementDate: now.toISOString(),
    averageTimeBetweenProposals,
    averageTimeBetweenComments,
    daysSinceLastActivity,
    daysSinceLastProposal,
    daysSinceLastAgreement,
    proposalsPerDay,
    commentsPerDay,
    participantEngagementRate,
    responseRateToProposals,
    agreedTermsPerDay,
    progressVelocity,
    estimatedDaysToCompletion,
    velocityTrend,
    engagementTrend,
    comparedToHistoricalAverage,
  };
}

function calculateAverageInterval(events: DealActivityEvent[]): number {
  if (events.length < 2) return 0;

  let totalInterval = 0;
  for (let i = 0; i < events.length - 1; i++) {
    const diff = new Date(events[i].timestamp).getTime() - new Date(events[i + 1].timestamp).getTime();
    totalInterval += diff;
  }

  // Return in hours
  return totalInterval / (events.length - 1) / (1000 * 60 * 60);
}

function determineVelocityTrend(
  activities: DealActivityEvent[],
  benchmark: DealBenchmark
): 'accelerating' | 'stable' | 'decelerating' | 'stalled' {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const lastWeekActivities = activities.filter(
    (a) => new Date(a.timestamp) >= oneWeekAgo && new Date(a.timestamp) < now
  );
  const previousWeekActivities = activities.filter(
    (a) => new Date(a.timestamp) >= twoWeeksAgo && new Date(a.timestamp) < oneWeekAgo
  );

  const lastWeekCount = lastWeekActivities.length;
  const previousWeekCount = previousWeekActivities.length;

  // Check for stall
  if (lastWeekCount === 0 && previousWeekCount === 0) {
    return 'stalled';
  }

  if (lastWeekCount === 0) {
    return 'stalled';
  }

  // Check if below warning threshold
  const dailyAverage = lastWeekCount / 7;
  if (dailyAverage < benchmark.healthyVelocityRange.minProposalsPerDay) {
    return 'decelerating';
  }

  // Compare weeks
  if (previousWeekCount === 0) {
    return 'accelerating';
  }

  const changeRatio = lastWeekCount / previousWeekCount;

  if (changeRatio > 1.2) return 'accelerating';
  if (changeRatio < 0.7) return 'decelerating';
  return 'stable';
}

function determineEngagementTrend(
  participants: ParticipantEngagement[]
): 'increasing' | 'stable' | 'decreasing' {
  const activeCount = participants.filter((p) => p.daysSinceLastActivity <= 3).length;
  const totalCount = participants.length;

  if (totalCount === 0) return 'stable';

  const activeRatio = activeCount / totalCount;

  if (activeRatio >= 0.8) return 'increasing';
  if (activeRatio <= 0.4) return 'decreasing';
  return 'stable';
}

// ============================================
// Participant Engagement Calculation
// ============================================

export function calculateParticipantEngagement(
  participantId: string,
  partyName: string,
  partyType: 'borrower_side' | 'lender_side' | 'third_party',
  dealRole: string,
  activities: DealActivityEvent[]
): ParticipantEngagement {
  const now = new Date();
  const participantActivities = activities.filter((a) => a.actorId === participantId);

  const proposalsCreated = participantActivities.filter(
    (a) => a.eventType === 'proposal_created'
  ).length;
  const proposalsResponded = participantActivities.filter(
    (a) => a.eventType === 'proposal_response'
  ).length;
  const commentsAdded = participantActivities.filter(
    (a) => a.eventType === 'comment_added'
  ).length;

  const lastActivity = participantActivities.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )[0];

  const lastActivityAt = lastActivity?.timestamp || new Date(0).toISOString();
  const daysSinceLastActivity = lastActivity
    ? Math.floor((now.getTime() - new Date(lastActivity.timestamp).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  // Calculate engagement score (0-100)
  const activityScore = Math.min(
    (proposalsCreated * 20 + proposalsResponded * 15 + commentsAdded * 5),
    50
  );
  const recencyScore = Math.max(0, 50 - daysSinceLastActivity * 10);
  const engagementScore = Math.min(100, activityScore + recencyScore);

  const isActive = daysSinceLastActivity <= 7 && engagementScore >= 20;

  return {
    participantId,
    partyName,
    partyType,
    dealRole,
    lastActivityAt,
    proposalsCreated,
    proposalsResponded,
    commentsAdded,
    engagementScore,
    isActive,
    daysSinceLastActivity,
  };
}

// ============================================
// Mock Data Generation (for demo/testing)
// ============================================

export function generateMockActivities(dealId: string): DealActivityEvent[] {
  const now = new Date();
  const activities: DealActivityEvent[] = [];

  // Generate activities over the past 14 days with a slowdown in the last 3 days
  for (let i = 0; i < 14; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);

    // Fewer activities in recent days to simulate a potential stall
    const activityCount = i < 3 ? 1 : i < 7 ? 3 : 4;

    for (let j = 0; j < activityCount; j++) {
      const eventTypes: DealActivityEvent['eventType'][] = [
        'proposal_created',
        'proposal_response',
        'comment_added',
        'term_agreed',
      ];

      activities.push({
        id: `activity-${i}-${j}`,
        dealId,
        eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        actorId: `user-${Math.floor(Math.random() * 3) + 1}`,
        actorParty: ['BigBank NA', 'Apollo Holdings LLC', 'Capital Partners Fund'][Math.floor(Math.random() * 3)],
        termId: `term-${Math.floor(Math.random() * 7) + 1}`,
        termCategory: ['Facility Terms', 'Pricing Terms', 'Financial Covenants'][Math.floor(Math.random() * 3)],
        timestamp: new Date(date.getTime() + j * 60 * 60 * 1000).toISOString(),
      });
    }
  }

  return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function generateMockParticipantEngagement(
  dealId: string,
  activities: DealActivityEvent[]
): ParticipantEngagement[] {
  const participants = [
    { id: 'user-1', name: 'Apollo Holdings LLC', type: 'borrower_side' as const, role: 'Borrower' },
    { id: 'user-2', name: 'BigBank NA', type: 'lender_side' as const, role: 'Administrative Agent' },
    { id: 'user-3', name: 'Capital Partners Fund', type: 'lender_side' as const, role: 'Syndicate Member' },
  ];

  return participants.map((p) =>
    calculateParticipantEngagement(p.id, p.name, p.type, p.role, activities)
  );
}

export { DEFAULT_BENCHMARK };
