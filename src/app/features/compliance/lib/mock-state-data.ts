/**
 * Mock data for state machine demonstrations.
 */

import type {
  CovenantStateHistory,
  PortfolioStateAnalytics,
  TransitionPattern,
  PortfolioInsight,
} from './covenant-state-machine';
import { mockCovenants } from './mock-data';
import { buildStateHistoryFromTests } from './covenant-state-machine';

/**
 * Generate mock state histories for all covenants.
 */
export function generateMockStateHistories(): Record<string, CovenantStateHistory> {
  const histories: Record<string, CovenantStateHistory> = {};

  mockCovenants.forEach(covenant => {
    if (covenant.test_history && covenant.test_history.length > 0) {
      // Build waiver periods if covenant is waived
      const waiverPeriods = covenant.waiver
        ? [
            {
              start: covenant.latest_test.test_date,
              end: covenant.waiver.expiration_date,
            },
          ]
        : undefined;

      try {
        const history = buildStateHistoryFromTests(
          covenant.id,
          covenant.test_history,
          covenant.current_threshold,
          waiverPeriods
        );

        histories[covenant.id] = history;
      } catch (error) {
        console.error(`Failed to build state history for covenant ${covenant.id}:`, error);
      }
    }
  });

  return histories;
}

/**
 * Mock transition patterns observed across portfolio.
 */
export const mockTransitionPatterns: TransitionPattern[] = [
  {
    pattern: 'Healthy covenants deteriorating to at-risk status due to declining headroom',
    from_state: 'healthy',
    to_state: 'at_risk',
    occurrence_count: 12,
    average_days: 89,
    std_deviation_days: 24,
    probability_percentage: 22.4,
  },
  {
    pattern: 'At-risk covenants breaching within 2 quarters',
    from_state: 'at_risk',
    to_state: 'breach',
    occurrence_count: 5,
    average_days: 67,
    std_deviation_days: 18,
    probability_percentage: 41.7,
  },
  {
    pattern: 'Breached covenants receiving waivers from lenders',
    from_state: 'breach',
    to_state: 'waived',
    occurrence_count: 4,
    average_days: 14,
    std_deviation_days: 7,
    probability_percentage: 80.0,
  },
  {
    pattern: 'At-risk covenants recovering to healthy status',
    from_state: 'at_risk',
    to_state: 'healthy',
    occurrence_count: 7,
    average_days: 52,
    std_deviation_days: 15,
    probability_percentage: 58.3,
  },
  {
    pattern: 'Waived covenants returning to breach after waiver expiration',
    from_state: 'waived',
    to_state: 'breach',
    occurrence_count: 2,
    average_days: 90,
    std_deviation_days: 10,
    probability_percentage: 50.0,
  },
  {
    pattern: 'Breached covenants resolving to compliance',
    from_state: 'breach',
    to_state: 'resolved',
    occurrence_count: 1,
    average_days: 120,
    std_deviation_days: 0,
    probability_percentage: 20.0,
  },
];

/**
 * Mock portfolio insights from state machine analysis.
 */
export const mockPortfolioInsights: PortfolioInsight[] = [
  {
    category: 'risk',
    severity: 'critical',
    title: 'High At-Risk to Breach Conversion Rate',
    description:
      'Analysis shows that 41.7% of covenants entering at-risk status breach within 67 days on average. This is significantly higher than industry benchmarks of 25%. Three covenants currently at-risk show similar deterioration patterns.',
    affected_covenant_ids: ['3'],
    recommended_action:
      'Schedule proactive discussions with borrowers for covenants ID 3 (XYZ Corp). Consider requesting updated financial projections and operational improvement plans.',
  },
  {
    category: 'trend',
    severity: 'medium',
    title: 'Seasonal Deterioration Pattern in Q4',
    description:
      'Portfolio shows consistent pattern of headroom deterioration in Q4 across manufacturing sector covenants. This aligns with year-end inventory buildup and working capital pressure.',
    affected_covenant_ids: ['1', '4'],
    recommended_action:
      'Anticipate Q4 headroom compression for manufacturing covenants. Consider temporary threshold adjustments or enhanced monitoring during October-December period.',
  },
  {
    category: 'opportunity',
    severity: 'low',
    title: 'Strong Recovery Rate from At-Risk Status',
    description:
      'When covenants enter at-risk status, 58.3% recover to healthy status within an average of 52 days. This suggests effective borrower responsiveness to early warning signals.',
    affected_covenant_ids: ['1', '2', '5'],
    recommended_action:
      'Continue current early warning communication strategy. Consider formalizing the at-risk notification process to maintain high recovery rates.',
  },
  {
    category: 'risk',
    severity: 'high',
    title: 'Waiver Extension Risk',
    description:
      'Historical data shows 50% of waived covenants return to breach status after waiver expiration. One covenant currently has a waiver expiring within 30 days with no improvement trend.',
    affected_covenant_ids: ['4'],
    recommended_action:
      'Begin waiver extension or restructuring negotiations for Delta Manufacturing (ID 4) immediately. Current trajectory does not support return to compliance.',
  },
  {
    category: 'anomaly',
    severity: 'medium',
    title: 'Unusually Long Breach-to-Waiver Timeline',
    description:
      'Recent breach-to-waiver transitions are taking 14 days on average, up from historical 7-day average. This may indicate increased internal approval friction or negotiation complexity.',
    affected_covenant_ids: [],
    recommended_action:
      'Review internal waiver approval processes. Consider pre-approving waiver frameworks for certain covenant types to reduce response time.',
  },
];

/**
 * Generate complete portfolio analytics.
 */
export function generateMockPortfolioAnalytics(): PortfolioStateAnalytics {
  const stateHistories = generateMockStateHistories();
  const histories = Object.values(stateHistories);

  // Count covenants in each state
  const covenantsByState = {
    healthy: 0,
    at_risk: 0,
    breach: 0,
    waived: 0,
    resolved: 0,
  };

  histories.forEach(history => {
    covenantsByState[history.current_state]++;
  });

  const totalCovenants = histories.length;

  // Calculate percentages
  const stateDistributionPercentage = {
    healthy: totalCovenants > 0 ? (covenantsByState.healthy / totalCovenants) * 100 : 0,
    at_risk: totalCovenants > 0 ? (covenantsByState.at_risk / totalCovenants) * 100 : 0,
    breach: totalCovenants > 0 ? (covenantsByState.breach / totalCovenants) * 100 : 0,
    waived: totalCovenants > 0 ? (covenantsByState.waived / totalCovenants) * 100 : 0,
    resolved: totalCovenants > 0 ? (covenantsByState.resolved / totalCovenants) * 100 : 0,
  };

  return {
    total_covenants: totalCovenants,
    covenants_by_state: covenantsByState,
    state_distribution_percentage: stateDistributionPercentage,
    transition_patterns: mockTransitionPatterns,
    insights: mockPortfolioInsights,
    analyzed_at: new Date().toISOString(),
  };
}

/**
 * Get state history for a specific covenant.
 */
export function getMockStateHistory(covenantId: string): CovenantStateHistory | undefined {
  const histories = generateMockStateHistories();
  return histories[covenantId];
}

/**
 * Get all state histories.
 */
export function getAllMockStateHistories(): CovenantStateHistory[] {
  const histories = generateMockStateHistories();
  return Object.values(histories);
}
