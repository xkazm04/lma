/**
 * Time-Series State Machine for Covenant Lifecycle
 *
 * This module implements a finite state machine that tracks covenant transitions
 * through various states (healthy → at_risk → breach → waived → resolved) with
 * temporal awareness, trigger conditions, and causality chains.
 */

import type { CovenantTestResult } from './types';

// =============================================================================
// State Machine Types
// =============================================================================

/**
 * Covenant lifecycle states.
 *
 * State transitions:
 * - healthy → at_risk (headroom drops below threshold)
 * - at_risk → healthy (headroom improves)
 * - at_risk → breach (test fails)
 * - breach → waived (waiver granted)
 * - breach → resolved (returns to compliance)
 * - waived → healthy (waiver expires and covenant passes)
 * - waived → breach (waiver expires and covenant still fails)
 */
export type CovenantLifecycleState =
  | 'healthy'      // Passing with comfortable headroom (>20%)
  | 'at_risk'      // Passing but with low headroom (0-20%)
  | 'breach'       // Failed test, no waiver
  | 'waived'       // Failed test, waiver granted
  | 'resolved';    // Returned to compliance after breach/waiver

/**
 * Transition trigger types that cause state changes.
 */
export type TransitionTrigger =
  | 'headroom_deterioration'   // Headroom dropped below threshold
  | 'headroom_improvement'     // Headroom improved above threshold
  | 'test_failure'             // Covenant test failed
  | 'test_success'             // Covenant test passed
  | 'waiver_granted'           // Lender granted waiver
  | 'waiver_expired'           // Waiver period ended
  | 'manual_override';         // Manual state change

/**
 * Individual state transition event with full metadata.
 */
export interface CovenantStateTransition {
  /** Unique transition ID */
  id: string;

  /** Covenant this transition belongs to */
  covenant_id: string;

  /** Previous state before transition */
  from_state: CovenantLifecycleState;

  /** New state after transition */
  to_state: CovenantLifecycleState;

  /** What triggered this transition */
  trigger: TransitionTrigger;

  /** When the transition occurred */
  timestamp: string;

  /** Test result that triggered this transition (if applicable) */
  test_result?: CovenantTestResult;

  /** Headroom at time of transition */
  headroom_percentage: number;

  /** Calculated ratio at time of transition */
  calculated_ratio: number;

  /** Threshold value at time of transition */
  threshold_value: number;

  /** Human-readable reason for transition */
  reason: string;

  /** Link to previous transition (causality chain) */
  previous_transition_id?: string;

  /** Additional contextual metadata */
  metadata?: {
    waiver_expiration_date?: string;
    borrower_comment?: string;
    lender_comment?: string;
    [key: string]: unknown;
  };
}

/**
 * Complete state history for a covenant with analytics.
 */
export interface CovenantStateHistory {
  /** Covenant identifier */
  covenant_id: string;

  /** Current state */
  current_state: CovenantLifecycleState;

  /** When current state was entered */
  current_state_since: string;

  /** Duration in current state (days) */
  days_in_current_state: number;

  /** All state transitions in chronological order */
  transitions: CovenantStateTransition[];

  /** Summary statistics */
  statistics: CovenantStateStatistics;
}

/**
 * Statistical summary of covenant state behavior.
 */
export interface CovenantStateStatistics {
  /** Total number of transitions */
  total_transitions: number;

  /** Number of times covenant entered each state */
  state_counts: Record<CovenantLifecycleState, number>;

  /** Average duration in each state (days) */
  average_duration_by_state: Record<CovenantLifecycleState, number>;

  /** Total days in each state */
  total_days_by_state: Record<CovenantLifecycleState, number>;

  /** Number of times covenant breached */
  breach_count: number;

  /** Number of times covenant was waived */
  waiver_count: number;

  /** Number of times covenant resolved after breach */
  resolution_count: number;

  /** Most recent transition */
  last_transition_date: string;

  /** First recorded transition */
  first_transition_date: string;

  /** Days since first transition */
  total_monitoring_days: number;
}

/**
 * Predictive analytics based on state machine patterns.
 */
export interface StateTransitionPrediction {
  /** Covenant being analyzed */
  covenant_id: string;

  /** Current state */
  current_state: CovenantLifecycleState;

  /** Predicted next state */
  predicted_next_state: CovenantLifecycleState;

  /** Probability of predicted transition (0-100) */
  transition_probability: number;

  /** Estimated days until transition */
  estimated_days_until_transition: number;

  /** Confidence in prediction (0-100) */
  confidence: number;

  /** Historical pattern this is based on */
  pattern_description: string;

  /** Comparison to portfolio average */
  portfolio_comparison: {
    /** Average time at_risk covenants take to breach */
    portfolio_avg_at_risk_to_breach_days: number;

    /** This covenant's trajectory compared to average */
    comparison: 'faster' | 'similar' | 'slower';

    /** Percentage difference from portfolio average */
    deviation_percentage: number;
  };
}

/**
 * Portfolio-wide state machine analytics.
 */
export interface PortfolioStateAnalytics {
  /** Total covenants being tracked */
  total_covenants: number;

  /** Count of covenants in each state */
  covenants_by_state: Record<CovenantLifecycleState, number>;

  /** Percentage distribution */
  state_distribution_percentage: Record<CovenantLifecycleState, number>;

  /** Transition patterns across portfolio */
  transition_patterns: TransitionPattern[];

  /** Key insights */
  insights: PortfolioInsight[];

  /** Analysis timestamp */
  analyzed_at: string;
}

/**
 * Common transition pattern found in portfolio.
 */
export interface TransitionPattern {
  /** Pattern description */
  pattern: string;

  /** From state → To state */
  from_state: CovenantLifecycleState;
  to_state: CovenantLifecycleState;

  /** How many covenants followed this pattern */
  occurrence_count: number;

  /** Average days for this transition */
  average_days: number;

  /** Standard deviation of transition time */
  std_deviation_days: number;

  /** Probability this transition will occur (0-100) */
  probability_percentage: number;
}

/**
 * Portfolio-level insight.
 */
export interface PortfolioInsight {
  /** Insight category */
  category: 'risk' | 'opportunity' | 'trend' | 'anomaly';

  /** Severity/importance */
  severity: 'low' | 'medium' | 'high' | 'critical';

  /** Title */
  title: string;

  /** Detailed description */
  description: string;

  /** Specific covenants this applies to */
  affected_covenant_ids: string[];

  /** Recommended action */
  recommended_action?: string;
}

// =============================================================================
// State Machine Logic
// =============================================================================

/**
 * Determine covenant state based on test result and headroom.
 */
export function determineCovenantState(
  testResult: 'pass' | 'fail',
  headroomPercentage: number,
  isWaived: boolean
): CovenantLifecycleState {
  // If waived, always in waived state
  if (isWaived) {
    return 'waived';
  }

  // If test failed, it's a breach
  if (testResult === 'fail') {
    return 'breach';
  }

  // If passing with comfortable headroom (>20%), it's healthy
  if (headroomPercentage > 20) {
    return 'healthy';
  }

  // If passing but with low headroom (0-20%), it's at risk
  if (headroomPercentage >= 0) {
    return 'at_risk';
  }

  // If headroom is negative (shouldn't happen with pass), treat as breach
  return 'breach';
}

/**
 * Determine the trigger for a state transition.
 */
export function determineTransitionTrigger(
  fromState: CovenantLifecycleState,
  toState: CovenantLifecycleState,
  testResult: 'pass' | 'fail',
  previousHeadroom: number,
  currentHeadroom: number
): TransitionTrigger {
  // Waiver transitions
  if (toState === 'waived') {
    return 'waiver_granted';
  }
  if (fromState === 'waived') {
    return 'waiver_expired';
  }

  // Test result transitions
  if (testResult === 'fail' && fromState !== 'breach') {
    return 'test_failure';
  }
  if (testResult === 'pass' && fromState === 'breach') {
    return 'test_success';
  }

  // Headroom-based transitions
  if (fromState === 'healthy' && toState === 'at_risk') {
    return 'headroom_deterioration';
  }
  if (fromState === 'at_risk' && toState === 'healthy') {
    return 'headroom_improvement';
  }

  // Default based on test result
  return testResult === 'pass' ? 'test_success' : 'test_failure';
}

/**
 * Generate human-readable transition reason.
 */
export function generateTransitionReason(
  fromState: CovenantLifecycleState,
  toState: CovenantLifecycleState,
  trigger: TransitionTrigger,
  headroomPercentage: number,
  calculatedRatio: number,
  threshold: number
): string {
  const formattedRatio = calculatedRatio.toFixed(2);
  const formattedThreshold = threshold.toFixed(2);
  const formattedHeadroom = headroomPercentage.toFixed(1);

  switch (trigger) {
    case 'headroom_deterioration':
      return `Headroom declined to ${formattedHeadroom}%, moving from healthy to at-risk status. Ratio: ${formattedRatio}x vs threshold ${formattedThreshold}x.`;

    case 'headroom_improvement':
      return `Headroom improved to ${formattedHeadroom}%, moving from at-risk to healthy status. Ratio: ${formattedRatio}x vs threshold ${formattedThreshold}x.`;

    case 'test_failure':
      return `Test failed with ratio ${formattedRatio}x below threshold ${formattedThreshold}x (${formattedHeadroom}% headroom). Covenant breached.`;

    case 'test_success':
      return `Test passed with ratio ${formattedRatio}x meeting threshold ${formattedThreshold}x (${formattedHeadroom}% headroom). Covenant resolved.`;

    case 'waiver_granted':
      return `Waiver granted for breach. Ratio: ${formattedRatio}x vs threshold ${formattedThreshold}x.`;

    case 'waiver_expired':
      return `Waiver period expired. Current ratio: ${formattedRatio}x vs threshold ${formattedThreshold}x (${formattedHeadroom}% headroom).`;

    case 'manual_override':
      return `State manually changed from ${fromState} to ${toState}. Ratio: ${formattedRatio}x vs threshold ${formattedThreshold}x.`;

    default:
      return `State transition from ${fromState} to ${toState}. Ratio: ${formattedRatio}x vs threshold ${formattedThreshold}x (${formattedHeadroom}% headroom).`;
  }
}

/**
 * Calculate statistics from transition history.
 */
export function calculateStateStatistics(
  transitions: CovenantStateTransition[]
): CovenantStateStatistics {
  if (transitions.length === 0) {
    throw new Error('Cannot calculate statistics from empty transition history');
  }

  const stateCounts: Record<CovenantLifecycleState, number> = {
    healthy: 0,
    at_risk: 0,
    breach: 0,
    waived: 0,
    resolved: 0,
  };

  const totalDaysByState: Record<CovenantLifecycleState, number> = {
    healthy: 0,
    at_risk: 0,
    breach: 0,
    waived: 0,
    resolved: 0,
  };

  let breachCount = 0;
  let waiverCount = 0;
  let resolutionCount = 0;

  // Count state entries and durations
  for (let i = 0; i < transitions.length; i++) {
    const transition = transitions[i];
    stateCounts[transition.to_state]++;

    if (transition.to_state === 'breach') breachCount++;
    if (transition.to_state === 'waived') waiverCount++;
    if (transition.to_state === 'resolved') resolutionCount++;

    // Calculate duration in this state
    const startTime = new Date(transition.timestamp).getTime();
    const endTime = i < transitions.length - 1
      ? new Date(transitions[i + 1].timestamp).getTime()
      : Date.now(); // Current time for latest state

    const durationDays = (endTime - startTime) / (1000 * 60 * 60 * 24);
    totalDaysByState[transition.to_state] += durationDays;
  }

  // Calculate averages
  const averageDurationByState: Record<CovenantLifecycleState, number> = {
    healthy: stateCounts.healthy > 0 ? totalDaysByState.healthy / stateCounts.healthy : 0,
    at_risk: stateCounts.at_risk > 0 ? totalDaysByState.at_risk / stateCounts.at_risk : 0,
    breach: stateCounts.breach > 0 ? totalDaysByState.breach / stateCounts.breach : 0,
    waived: stateCounts.waived > 0 ? totalDaysByState.waived / stateCounts.waived : 0,
    resolved: stateCounts.resolved > 0 ? totalDaysByState.resolved / stateCounts.resolved : 0,
  };

  const firstTransition = transitions[0];
  const lastTransition = transitions[transitions.length - 1];
  const totalMonitoringDays =
    (new Date(lastTransition.timestamp).getTime() - new Date(firstTransition.timestamp).getTime())
    / (1000 * 60 * 60 * 24);

  return {
    total_transitions: transitions.length,
    state_counts: stateCounts,
    average_duration_by_state: averageDurationByState,
    total_days_by_state: totalDaysByState,
    breach_count: breachCount,
    waiver_count: waiverCount,
    resolution_count: resolutionCount,
    last_transition_date: lastTransition.timestamp,
    first_transition_date: firstTransition.timestamp,
    total_monitoring_days: totalMonitoringDays,
  };
}

/**
 * Build state history from test results.
 */
export function buildStateHistoryFromTests(
  covenantId: string,
  testHistory: CovenantTestResult[],
  currentThreshold: number,
  waiverPeriods?: Array<{ start: string; end: string }>
): CovenantStateHistory {
  if (testHistory.length === 0) {
    throw new Error('Cannot build state history from empty test history');
  }

  const transitions: CovenantStateTransition[] = [];
  let previousState: CovenantLifecycleState | null = null;
  let previousHeadroom = 0;

  // Sort test history by date
  const sortedTests = [...testHistory].sort(
    (a, b) => new Date(a.test_date).getTime() - new Date(b.test_date).getTime()
  );

  sortedTests.forEach((test, index) => {
    // Check if test is within waiver period
    const isWaived = waiverPeriods?.some(
      waiver => test.test_date >= waiver.start && test.test_date <= waiver.end
    ) || false;

    const currentState = determineCovenantState(
      test.test_result,
      test.headroom_percentage,
      isWaived
    );

    // Only create transition if state changed
    if (previousState !== null && currentState !== previousState) {
      const trigger = determineTransitionTrigger(
        previousState,
        currentState,
        test.test_result,
        previousHeadroom,
        test.headroom_percentage
      );

      const reason = generateTransitionReason(
        previousState,
        currentState,
        trigger,
        test.headroom_percentage,
        test.calculated_ratio,
        currentThreshold
      );

      const transition: CovenantStateTransition = {
        id: `${covenantId}-transition-${index}`,
        covenant_id: covenantId,
        from_state: previousState,
        to_state: currentState,
        trigger,
        timestamp: test.test_date,
        test_result: test,
        headroom_percentage: test.headroom_percentage,
        calculated_ratio: test.calculated_ratio,
        threshold_value: currentThreshold,
        reason,
        previous_transition_id: transitions.length > 0
          ? transitions[transitions.length - 1].id
          : undefined,
      };

      transitions.push(transition);
    } else if (previousState === null) {
      // First state entry
      const transition: CovenantStateTransition = {
        id: `${covenantId}-transition-0`,
        covenant_id: covenantId,
        from_state: currentState, // Initial state
        to_state: currentState,
        trigger: 'test_success',
        timestamp: test.test_date,
        test_result: test,
        headroom_percentage: test.headroom_percentage,
        calculated_ratio: test.calculated_ratio,
        threshold_value: currentThreshold,
        reason: `Initial state recorded as ${currentState} with ${test.headroom_percentage.toFixed(1)}% headroom.`,
      };

      transitions.push(transition);
    }

    previousState = currentState;
    previousHeadroom = test.headroom_percentage;
  });

  const currentState = previousState || 'healthy';
  const currentTransition = transitions[transitions.length - 1];
  const currentStateSince = currentTransition?.timestamp || new Date().toISOString();
  const daysInCurrentState = currentTransition
    ? (Date.now() - new Date(currentTransition.timestamp).getTime()) / (1000 * 60 * 60 * 24)
    : 0;

  const statistics = transitions.length > 0
    ? calculateStateStatistics(transitions)
    : {
        total_transitions: 0,
        state_counts: { healthy: 0, at_risk: 0, breach: 0, waived: 0, resolved: 0 },
        average_duration_by_state: { healthy: 0, at_risk: 0, breach: 0, waived: 0, resolved: 0 },
        total_days_by_state: { healthy: 0, at_risk: 0, breach: 0, waived: 0, resolved: 0 },
        breach_count: 0,
        waiver_count: 0,
        resolution_count: 0,
        last_transition_date: new Date().toISOString(),
        first_transition_date: new Date().toISOString(),
        total_monitoring_days: 0,
      };

  return {
    covenant_id: covenantId,
    current_state: currentState,
    current_state_since: currentStateSince,
    days_in_current_state: daysInCurrentState,
    transitions,
    statistics,
  };
}

/**
 * Calculate percentage of at_risk covenants that breach within N quarters.
 */
export function calculateAtRiskBreachRate(
  portfolioHistories: CovenantStateHistory[],
  quarters: number
): {
  total_at_risk: number;
  breached_within_period: number;
  breach_rate_percentage: number;
  average_days_to_breach: number;
} {
  const daysInQuarter = 90;
  const targetDays = quarters * daysInQuarter;

  let totalAtRisk = 0;
  let breachedWithinPeriod = 0;
  let totalDaysToBreachSum = 0;
  let breachCount = 0;

  portfolioHistories.forEach(history => {
    history.transitions.forEach((transition, index) => {
      // Found a transition into at_risk state
      if (transition.to_state === 'at_risk') {
        totalAtRisk++;

        // Look for subsequent breach
        const subsequentTransitions = history.transitions.slice(index + 1);
        const breachTransition = subsequentTransitions.find(t => t.to_state === 'breach');

        if (breachTransition) {
          const daysToBreach =
            (new Date(breachTransition.timestamp).getTime() - new Date(transition.timestamp).getTime())
            / (1000 * 60 * 60 * 24);

          if (daysToBreach <= targetDays) {
            breachedWithinPeriod++;
            totalDaysToBreachSum += daysToBreach;
            breachCount++;
          }
        }
      }
    });
  });

  return {
    total_at_risk: totalAtRisk,
    breached_within_period: breachedWithinPeriod,
    breach_rate_percentage: totalAtRisk > 0 ? (breachedWithinPeriod / totalAtRisk) * 100 : 0,
    average_days_to_breach: breachCount > 0 ? totalDaysToBreachSum / breachCount : 0,
  };
}
