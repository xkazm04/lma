// =============================================================================
// Discriminated Union Types with Exhaustive Type Checking
// =============================================================================

/**
 * Item types for upcoming items and calendar events.
 * Adding a new type here will cause compile errors in all switch statements
 * that don't handle the new type, ensuring exhaustive coverage.
 */
export type ItemType =
  | 'compliance_event'
  | 'covenant_test'
  | 'notification_due'
  | 'waiver_expiration';

/**
 * Status types for items and events.
 * Adding a new status here will cause compile errors in all switch statements
 * that don't handle the new status.
 */
export type ItemStatus = 'upcoming' | 'pending' | 'overdue' | 'completed';

/**
 * Covenant status types.
 * Used for covenant tracking with exhaustive type checking.
 *
 * ## State Machine Diagram
 *
 * ```
 *                    ┌─────────────────────────────────────────┐
 *                    │                                         │
 *                    │              COVENANT                   │
 *                    │           STATE MACHINE                 │
 *                    │                                         │
 *                    └─────────────────────────────────────────┘
 *
 *                              ┌──────────┐
 *                              │  ACTIVE  │ ◄─────────────────────┐
 *                              └────┬─────┘                       │
 *                                   │                             │
 *           ┌───────────────────────┼───────────────────────┐     │
 *           │                       │                       │     │
 *           ▼                       ▼                       │     │
 *    ┌──────────┐            ┌──────────┐                   │     │
 *    │  WAIVED  │            │ BREACHED │                   │     │
 *    └────┬─────┘            └────┬─────┘                   │     │
 *         │                       │                         │     │
 *         │                       │                         │     │
 *         │   waiver_expired      │   breach_resolved       │     │
 *         │   or reinstated       │   or cured              │     │
 *         └───────────────────────┴─────────────────────────┘     │
 *                                                                 │
 *                                 waiver_granted                  │
 *                        ┌────────────────────────────────────────┘
 *                        │
 *                        ▼
 *                 ┌──────────┐
 *                 │  WAIVED  │ (from breached)
 *                 └──────────┘
 *
 * ## Valid Transitions:
 *
 * | From     | To       | Trigger                      | Description                                    |
 * |----------|----------|------------------------------|------------------------------------------------|
 * | active   | waived   | waiver_granted               | Lender grants waiver for upcoming test         |
 * | active   | breached | breach_detected              | Covenant test fails threshold                  |
 * | waived   | active   | waiver_expired               | Waiver period ends, covenant reinstated        |
 * | waived   | active   | waiver_terminated            | Waiver voluntarily terminated early            |
 * | breached | active   | breach_resolved              | Breach remedied (equity cure, restructure)     |
 * | breached | active   | breach_cured                 | Cure rights exercised successfully             |
 * | breached | waived   | waiver_granted               | Lender grants waiver for existing breach       |
 *
 * ## Invalid Transitions (will throw error):
 *
 * | From     | To       | Reason                                                     |
 * |----------|----------|------------------------------------------------------------|
 * | waived   | breached | Cannot breach while under active waiver protection         |
 * | breached | breached | Already in breached state (no-op, but logged)              |
 * | waived   | waived   | Already in waived state (no-op, but logged)                |
 * | active   | active   | Already in active state (no-op, but logged)                |
 *
 * ## Audit Requirements:
 * - All transitions MUST be logged with timestamp, actor, and reason
 * - Transitions require supporting documentation (waiver letter, cure notice, etc.)
 * - Invalid transition attempts are logged for compliance review
 *
 * ```
 */
export type CovenantStatus = 'active' | 'waived' | 'breached';

/**
 * Transition trigger types that cause covenant status changes.
 * Each trigger represents a business event that initiates a state transition.
 */
export type CovenantTransitionTrigger =
  | 'waiver_granted'      // Lender grants waiver
  | 'waiver_expired'      // Waiver period ends naturally
  | 'waiver_terminated'   // Waiver terminated early
  | 'breach_detected'     // Covenant test fails
  | 'breach_resolved'     // Breach remedied through negotiation
  | 'breach_cured'        // Cure rights exercised
  | 'manual_correction';  // Administrative correction

/**
 * Helper function for transition trigger label.
 */
export function getTransitionTriggerLabel(trigger: CovenantTransitionTrigger): string {
  switch (trigger) {
    case 'waiver_granted':
      return 'Waiver Granted';
    case 'waiver_expired':
      return 'Waiver Expired';
    case 'waiver_terminated':
      return 'Waiver Terminated Early';
    case 'breach_detected':
      return 'Breach Detected';
    case 'breach_resolved':
      return 'Breach Resolved';
    case 'breach_cured':
      return 'Cure Rights Exercised';
    case 'manual_correction':
      return 'Manual Correction';
    default:
      return assertNever(trigger);
  }
}

/**
 * Represents a single state transition in covenant status history.
 */
export interface CovenantStatusTransition {
  /** Unique identifier for this transition */
  id: string;
  /** The covenant this transition belongs to */
  covenant_id: string;
  /** Status before the transition */
  from_status: CovenantStatus;
  /** Status after the transition */
  to_status: CovenantStatus;
  /** The business event that triggered this transition */
  trigger: CovenantTransitionTrigger;
  /** Timestamp when transition occurred */
  transitioned_at: string;
  /** User who initiated or approved the transition */
  transitioned_by: string;
  /** Reason or justification for the transition */
  reason: string;
  /** Reference to supporting documentation (waiver letter ID, cure notice ID, etc.) */
  supporting_document_id?: string;
  /** Additional metadata about the transition */
  metadata?: {
    /** For waiver transitions: waiver ID */
    waiver_id?: string;
    /** For waiver transitions: expiration date */
    waiver_expiration?: string;
    /** For breach transitions: test ID that detected breach */
    test_id?: string;
    /** For cure transitions: cure amount applied */
    cure_amount?: number;
    /** For resolved transitions: resolution method */
    resolution_method?: string;
    /** Any additional notes */
    notes?: string;
  };
}

/**
 * Result of a transition validation check.
 */
export interface TransitionValidationResult {
  /** Whether the transition is valid */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
  /** Warning message for valid but unusual transitions */
  warning?: string;
  /** Suggested actions if transition is invalid */
  suggestions?: string[];
}

/**
 * Valid transition map defining allowed state changes.
 * Key format: "from_status" -> Set of valid "to_status" values
 */
export const VALID_COVENANT_TRANSITIONS: Record<CovenantStatus, Set<CovenantStatus>> = {
  active: new Set(['waived', 'breached']),
  waived: new Set(['active']),
  breached: new Set(['active', 'waived']),
};

/**
 * Map of valid triggers for each transition.
 * Key format: "from_status->to_status" -> Set of valid triggers
 */
export const VALID_TRANSITION_TRIGGERS: Record<string, Set<CovenantTransitionTrigger>> = {
  'active->waived': new Set(['waiver_granted']),
  'active->breached': new Set(['breach_detected']),
  'waived->active': new Set(['waiver_expired', 'waiver_terminated']),
  'breached->active': new Set(['breach_resolved', 'breach_cured']),
  'breached->waived': new Set(['waiver_granted']),
};

/**
 * Validates whether a covenant status transition is allowed.
 *
 * @param fromStatus - Current covenant status
 * @param toStatus - Desired covenant status
 * @param trigger - The business event triggering the transition
 * @returns Validation result with error/warning messages
 *
 * @example
 * ```typescript
 * const result = validateCovenantTransition('active', 'breached', 'breach_detected');
 * if (!result.valid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validateCovenantTransition(
  fromStatus: CovenantStatus,
  toStatus: CovenantStatus,
  trigger: CovenantTransitionTrigger
): TransitionValidationResult {
  // Check for no-op transitions (same status)
  if (fromStatus === toStatus) {
    return {
      valid: false,
      error: `Covenant is already in '${fromStatus}' status. No transition needed.`,
      suggestions: ['Verify the intended target status before attempting transition.'],
    };
  }

  // Check if the transition itself is valid
  const validTargets = VALID_COVENANT_TRANSITIONS[fromStatus];
  if (!validTargets.has(toStatus)) {
    const invalidReason = getInvalidTransitionReason(fromStatus, toStatus);
    return {
      valid: false,
      error: `Invalid transition from '${fromStatus}' to '${toStatus}'. ${invalidReason}`,
      suggestions: getTransitionSuggestions(fromStatus, toStatus),
    };
  }

  // Check if the trigger is valid for this transition
  const transitionKey = `${fromStatus}->${toStatus}`;
  const validTriggers = VALID_TRANSITION_TRIGGERS[transitionKey];
  if (!validTriggers?.has(trigger)) {
    const validTriggerList = validTriggers ? Array.from(validTriggers).map(t => `'${t}'`).join(', ') : 'none';
    return {
      valid: false,
      error: `Invalid trigger '${trigger}' for transition from '${fromStatus}' to '${toStatus}'. Valid triggers: ${validTriggerList}.`,
      suggestions: [`Use one of the valid triggers: ${validTriggerList}`],
    };
  }

  // Transition is valid - check for warnings
  const warning = getTransitionWarning(fromStatus, toStatus, trigger);
  return {
    valid: true,
    warning,
  };
}

/**
 * Gets a human-readable explanation for why a transition is invalid.
 */
function getInvalidTransitionReason(fromStatus: CovenantStatus, toStatus: CovenantStatus): string {
  if (fromStatus === 'waived' && toStatus === 'breached') {
    return 'A covenant cannot be breached while under active waiver protection. The waiver must expire or be terminated first.';
  }
  return `This transition path is not supported by the covenant lifecycle.`;
}

/**
 * Gets suggestions for resolving an invalid transition.
 */
function getTransitionSuggestions(fromStatus: CovenantStatus, toStatus: CovenantStatus): string[] {
  if (fromStatus === 'waived' && toStatus === 'breached') {
    return [
      'First transition from waived -> active (waiver expiration or termination)',
      'Then transition from active -> breached (breach detection)',
    ];
  }
  const validTargets = Array.from(VALID_COVENANT_TRANSITIONS[fromStatus]);
  return [`Valid transitions from '${fromStatus}': ${validTargets.map(s => `'${s}'`).join(', ')}`];
}

/**
 * Gets warning message for valid but potentially problematic transitions.
 */
function getTransitionWarning(
  fromStatus: CovenantStatus,
  toStatus: CovenantStatus,
  trigger: CovenantTransitionTrigger
): string | undefined {
  if (fromStatus === 'breached' && toStatus === 'waived' && trigger === 'waiver_granted') {
    return 'Granting a waiver for an existing breach. Ensure proper documentation and lender consent is obtained.';
  }
  if (trigger === 'manual_correction') {
    return 'Manual corrections should be rare and well-documented. Ensure audit trail is complete.';
  }
  return undefined;
}

/**
 * Checks if a transition from current status to target status is allowed.
 * Simple boolean check without detailed error messages.
 *
 * @param fromStatus - Current covenant status
 * @param toStatus - Desired covenant status
 * @returns true if transition is allowed
 */
export function canTransitionTo(fromStatus: CovenantStatus, toStatus: CovenantStatus): boolean {
  if (fromStatus === toStatus) return false;
  return VALID_COVENANT_TRANSITIONS[fromStatus].has(toStatus);
}

/**
 * Gets all valid next statuses for a given current status.
 *
 * @param currentStatus - Current covenant status
 * @returns Array of valid next statuses
 */
export function getValidNextStatuses(currentStatus: CovenantStatus): CovenantStatus[] {
  return Array.from(VALID_COVENANT_TRANSITIONS[currentStatus]);
}

/**
 * Gets valid triggers for a specific transition.
 *
 * @param fromStatus - Current covenant status
 * @param toStatus - Desired covenant status
 * @returns Array of valid triggers, or empty array if transition is invalid
 */
export function getValidTriggersForTransition(
  fromStatus: CovenantStatus,
  toStatus: CovenantStatus
): CovenantTransitionTrigger[] {
  const transitionKey = `${fromStatus}->${toStatus}`;
  const validTriggers = VALID_TRANSITION_TRIGGERS[transitionKey];
  return validTriggers ? Array.from(validTriggers) : [];
}

/**
 * Creates a covenant status transition record.
 * This function validates the transition and creates the record if valid.
 *
 * @param params - Transition parameters
 * @returns Transition record or throws error if invalid
 * @throws Error if transition is invalid
 *
 * @example
 * ```typescript
 * try {
 *   const transition = createCovenantTransition({
 *     covenant_id: 'cov-123',
 *     from_status: 'active',
 *     to_status: 'breached',
 *     trigger: 'breach_detected',
 *     transitioned_by: 'user-456',
 *     reason: 'Q4 2024 leverage ratio test failed: 4.5x vs 4.0x limit',
 *     metadata: { test_id: 'test-789' }
 *   });
 * } catch (error) {
 *   console.error('Invalid transition:', error.message);
 * }
 * ```
 */
export function createCovenantTransition(params: {
  covenant_id: string;
  from_status: CovenantStatus;
  to_status: CovenantStatus;
  trigger: CovenantTransitionTrigger;
  transitioned_by: string;
  reason: string;
  supporting_document_id?: string;
  metadata?: CovenantStatusTransition['metadata'];
}): CovenantStatusTransition {
  // Validate the transition
  const validation = validateCovenantTransition(params.from_status, params.to_status, params.trigger);

  if (!validation.valid) {
    throw new Error(`Invalid covenant transition: ${validation.error}`);
  }

  // Create the transition record
  const transition: CovenantStatusTransition = {
    id: `trans-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    covenant_id: params.covenant_id,
    from_status: params.from_status,
    to_status: params.to_status,
    trigger: params.trigger,
    transitioned_at: new Date().toISOString(),
    transitioned_by: params.transitioned_by,
    reason: params.reason,
    supporting_document_id: params.supporting_document_id,
    metadata: params.metadata,
  };

  return transition;
}

/**
 * Extended Covenant type with transition history.
 */
export interface CovenantWithTransitionHistory extends Covenant {
  /** Full history of status transitions */
  transition_history?: CovenantStatusTransition[];
  /** Most recent transition */
  last_transition?: CovenantStatusTransition;
}

// =============================================================================
// Covenant Lifecycle State Machine (Temporal Monitoring)
// =============================================================================

/**
 * Covenant lifecycle states for temporal monitoring and analytics.
 *
 * This provides a more granular view than CovenantStatus, tracking the
 * operational health of covenants over time for analytical purposes.
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
 * Transition trigger types that cause lifecycle state changes.
 * These are operational triggers for monitoring purposes.
 */
export type LifecycleTransitionTrigger =
  | 'headroom_deterioration'   // Headroom dropped below threshold
  | 'headroom_improvement'     // Headroom improved above threshold
  | 'test_failure'             // Covenant test failed
  | 'test_success'             // Covenant test passed
  | 'waiver_granted'           // Lender granted waiver
  | 'waiver_expired'           // Waiver period ended
  | 'manual_override';         // Manual state change

/**
 * Individual state transition event with full metadata for temporal tracking.
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
  trigger: LifecycleTransitionTrigger;

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
// Covenant Lifecycle State Machine Logic
// =============================================================================

/**
 * Determine covenant lifecycle state based on test result and headroom.
 * This is used for temporal monitoring and analytics.
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
 * Determine the trigger for a lifecycle state transition.
 */
export function determineTransitionTrigger(
  fromState: CovenantLifecycleState,
  toState: CovenantLifecycleState,
  testResult: 'pass' | 'fail',
  previousHeadroom: number,
  currentHeadroom: number
): LifecycleTransitionTrigger {
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
  trigger: LifecycleTransitionTrigger,
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

// =============================================================================
// Lifecycle State Helper Functions with Exhaustive Checking
// =============================================================================

/**
 * Returns the color classes for a lifecycle state badge.
 */
export function getLifecycleStateColor(state: CovenantLifecycleState): string {
  switch (state) {
    case 'healthy':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'at_risk':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'breach':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'waived':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'resolved':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    default:
      return assertNever(state);
  }
}

/**
 * Returns the human-readable label for a lifecycle state.
 */
export function getLifecycleStateLabel(state: CovenantLifecycleState): string {
  switch (state) {
    case 'healthy':
      return 'Healthy';
    case 'at_risk':
      return 'At Risk';
    case 'breach':
      return 'Breach';
    case 'waived':
      return 'Waived';
    case 'resolved':
      return 'Resolved';
    default:
      return assertNever(state);
  }
}

/**
 * Returns the human-readable label for a lifecycle transition trigger.
 */
export function getLifecycleTransitionTriggerLabel(trigger: LifecycleTransitionTrigger): string {
  switch (trigger) {
    case 'headroom_deterioration':
      return 'Headroom Deteriorated';
    case 'headroom_improvement':
      return 'Headroom Improved';
    case 'test_failure':
      return 'Test Failed';
    case 'test_success':
      return 'Test Passed';
    case 'waiver_granted':
      return 'Waiver Granted';
    case 'waiver_expired':
      return 'Waiver Expired';
    case 'manual_override':
      return 'Manual Override';
    default:
      return assertNever(trigger);
  }
}

/**
 * Facility status types.
 *
 * ## State Machine Diagram
 *
 * ```
 *                    ┌─────────────────────────────────────────┐
 *                    │                                         │
 *                    │              FACILITY                   │
 *                    │           STATE MACHINE                 │
 *                    │                                         │
 *                    └─────────────────────────────────────────┘
 *
 *                              ┌──────────┐
 *                              │  ACTIVE  │ ◄─────────────────────┐
 *                              └────┬─────┘                       │
 *                                   │                             │
 *           ┌───────────────────────┼───────────────────────┐     │
 *           │                       │                       │     │
 *           ▼                       ▼                       │     │
 *    ┌────────────┐          ┌──────────┐                   │     │
 *    │WAIVER_PERIOD│          │ DEFAULT  │                   │     │
 *    └────┬───────┘          └────┬─────┘                   │     │
 *         │                       │                         │     │
 *         │  waiver_expired       │  default_cured          │     │
 *         │  or resolved          │  or restructured        │     │
 *         └───────────────────────┴─────────────────────────┘     │
 *                                                                 │
 *                     Any status can transition to CLOSED         │
 *                     (facility maturity or termination)          │
 *                              │                                  │
 *                              ▼                                  │
 *                       ┌──────────┐                              │
 *                       │  CLOSED  │ (terminal state)             │
 *                       └──────────┘                              │
 *
 * ## Valid Transitions:
 *
 * | From         | To            | Description                                    |
 * |--------------|---------------|------------------------------------------------|
 * | active       | waiver_period | Waiver granted for facility-level issue        |
 * | active       | default       | Facility enters default (cross-default, etc.)  |
 * | active       | closed        | Facility matures or is terminated              |
 * | waiver_period| active        | Waiver expires or resolved                     |
 * | waiver_period| default       | Default during waiver period                   |
 * | waiver_period| closed        | Facility closed during waiver                  |
 * | default      | active        | Default cured or restructured                  |
 * | default      | closed        | Facility closed in default                     |
 *
 * ## Terminal State:
 * - CLOSED is a terminal state - no transitions out are allowed
 *
 * ```
 */
export type FacilityStatus = 'active' | 'waiver_period' | 'default' | 'closed';

/**
 * Transition trigger types for facility status changes.
 */
export type FacilityTransitionTrigger =
  | 'waiver_granted'
  | 'waiver_expired'
  | 'waiver_resolved'
  | 'default_declared'
  | 'default_cured'
  | 'restructured'
  | 'matured'
  | 'terminated'
  | 'manual_correction';

/**
 * Valid facility status transitions.
 */
export const VALID_FACILITY_TRANSITIONS: Record<FacilityStatus, Set<FacilityStatus>> = {
  active: new Set(['waiver_period', 'default', 'closed']),
  waiver_period: new Set(['active', 'default', 'closed']),
  default: new Set(['active', 'closed']),
  closed: new Set([]), // Terminal state - no transitions out
};

/**
 * Validates whether a facility status transition is allowed.
 */
export function validateFacilityTransition(
  fromStatus: FacilityStatus,
  toStatus: FacilityStatus
): TransitionValidationResult {
  if (fromStatus === toStatus) {
    return {
      valid: false,
      error: `Facility is already in '${fromStatus}' status.`,
    };
  }

  if (fromStatus === 'closed') {
    return {
      valid: false,
      error: `Cannot transition from 'closed' status. Closed is a terminal state.`,
      suggestions: ['Closed facilities cannot be reopened. Create a new facility if needed.'],
    };
  }

  const validTargets = VALID_FACILITY_TRANSITIONS[fromStatus];
  if (!validTargets.has(toStatus)) {
    return {
      valid: false,
      error: `Invalid transition from '${fromStatus}' to '${toStatus}'.`,
      suggestions: [`Valid transitions from '${fromStatus}': ${Array.from(validTargets).map(s => `'${s}'`).join(', ')}`],
    };
  }

  return { valid: true };
}

/**
 * Checks if a facility can transition to a target status.
 */
export function canFacilityTransitionTo(fromStatus: FacilityStatus, toStatus: FacilityStatus): boolean {
  if (fromStatus === toStatus) return false;
  return VALID_FACILITY_TRANSITIONS[fromStatus].has(toStatus);
}

/**
 * Compliance facility status types.
 */
export type ComplianceFacilityStatus = 'compliant' | 'at_risk' | 'breach' | 'pending';

// =============================================================================
// Exhaustive Type Checking Utilities
// =============================================================================

/**
 * Helper function for exhaustive type checking in switch statements.
 * If a new case is added to a union type and not handled, TypeScript will
 * throw a compile error at this function call.
 *
 * @example
 * function handleType(type: ItemType): string {
 *   switch (type) {
 *     case 'compliance_event': return 'blue';
 *     case 'covenant_test': return 'purple';
 *     case 'notification_due': return 'amber';
 *     case 'waiver_expiration': return 'red';
 *     default: return assertNever(type);
 *   }
 * }
 */
export function assertNever(value: never): never {
  throw new Error(`Unhandled discriminated union member: ${JSON.stringify(value)}`);
}

// =============================================================================
// Item Type Helper Functions with Exhaustive Checking
// =============================================================================

/**
 * Returns the color classes for an item type badge.
 * Uses exhaustive switch to ensure all types are handled.
 */
export function getItemTypeColor(type: ItemType): string {
  switch (type) {
    case 'compliance_event':
      return 'bg-blue-100 text-blue-700';
    case 'covenant_test':
      return 'bg-purple-100 text-purple-700';
    case 'notification_due':
      return 'bg-amber-100 text-amber-700';
    case 'waiver_expiration':
      return 'bg-red-100 text-red-700';
    default:
      return assertNever(type);
  }
}

/**
 * Returns the border color classes for an item type card (list view variant).
 * Uses exhaustive switch to ensure all types are handled.
 */
export function getItemTypeBorderColor(type: ItemType): string {
  switch (type) {
    case 'compliance_event':
      return 'border-blue-200 bg-blue-50/50';
    case 'covenant_test':
      return 'border-purple-200 bg-purple-50/50';
    case 'notification_due':
      return 'border-amber-200 bg-amber-50/50';
    case 'waiver_expiration':
      return 'border-red-200 bg-red-50/50';
    default:
      return assertNever(type);
  }
}

/**
 * Returns the full color classes for calendar view items.
 * Uses exhaustive switch to ensure all types are handled.
 */
export function getItemTypeCalendarColor(type: ItemType): string {
  switch (type) {
    case 'compliance_event':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'covenant_test':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'notification_due':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'waiver_expiration':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return assertNever(type);
  }
}

/**
 * Returns the human-readable label for an item type.
 * Uses exhaustive switch to ensure all types are handled.
 */
export function getItemTypeLabel(type: ItemType): string {
  switch (type) {
    case 'compliance_event':
      return 'Compliance';
    case 'covenant_test':
      return 'Covenant';
    case 'notification_due':
      return 'Notification';
    case 'waiver_expiration':
      return 'Waiver';
    default:
      return assertNever(type);
  }
}

// =============================================================================
// Item Status Helper Functions with Exhaustive Checking
// =============================================================================

/**
 * Returns the badge variant for an item status.
 * Uses exhaustive switch to ensure all statuses are handled.
 */
export function getItemStatusVariant(status: ItemStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'completed':
      return 'default';
    case 'upcoming':
      return 'secondary';
    case 'overdue':
      return 'destructive';
    case 'pending':
      return 'outline';
    default:
      return assertNever(status);
  }
}

/**
 * Returns the color classes for an item status badge.
 * Uses exhaustive switch to ensure all statuses are handled.
 */
export function getItemStatusColor(status: ItemStatus): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-700 hover:bg-green-100';
    case 'upcoming':
      return 'bg-blue-100 text-blue-700 hover:bg-blue-100';
    case 'overdue':
      return 'bg-red-100 text-red-700';
    case 'pending':
      return 'bg-zinc-100 text-zinc-700 hover:bg-zinc-100';
    default:
      return assertNever(status);
  }
}

/**
 * Returns the human-readable label for an item status.
 * Uses exhaustive switch to ensure all statuses are handled.
 */
export function getItemStatusLabel(status: ItemStatus): string {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'upcoming':
      return 'Upcoming';
    case 'overdue':
      return 'Overdue';
    case 'pending':
      return 'Pending';
    default:
      return assertNever(status);
  }
}

// =============================================================================
// Covenant Status Helper Functions with Exhaustive Checking
// =============================================================================

/**
 * Returns the color classes for a covenant status badge.
 * Uses exhaustive switch to ensure all statuses are handled.
 */
export function getCovenantStatusColor(status: CovenantStatus): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-700';
    case 'waived':
      return 'bg-amber-100 text-amber-700';
    case 'breached':
      return 'bg-red-100 text-red-700';
    default:
      return assertNever(status);
  }
}

/**
 * Returns the human-readable label for a covenant status.
 * Uses exhaustive switch to ensure all statuses are handled.
 */
export function getCovenantStatusLabel(status: CovenantStatus): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'waived':
      return 'Waived';
    case 'breached':
      return 'Breached';
    default:
      return assertNever(status);
  }
}

// =============================================================================
// Interfaces
// =============================================================================

export interface DashboardStats {
  total_facilities: number;
  facilities_in_compliance: number;
  facilities_in_waiver: number;
  facilities_in_default: number;
  upcoming_deadlines_7_days: number;
  upcoming_deadlines_30_days: number;
  overdue_items: number;
  pending_waivers: number;
}

export interface UpcomingItem {
  id: string;
  date: string;
  type: ItemType;
  title: string;
  facility_name: string;
  borrower_name: string;
  status: ItemStatus;
}

export interface FacilityAtRisk {
  facility_id: string;
  facility_name: string;
  borrower_name: string;
  risk_reason: string;
  covenant_name: string;
  headroom_percentage: number | null;
}

export interface RecentActivity {
  id: string;
  activity_type: string;
  description: string;
  entity_name: string;
  created_at: string;
}

export interface Facility {
  id: string;
  facility_name: string;
  borrower_name: string;
  facility_type: 'term_loan' | 'revolving_credit' | 'abl' | 'delayed_draw' | 'bridge' | 'bilateral';
  status: FacilityStatus;
  commitment_amount: number;
  currency: string;
  maturity_date: string;
  created_at: string;
  stats: {
    total_obligations: number;
    upcoming_30_days: number;
    overdue: number;
    total_covenants: number;
    covenants_at_risk: number;
  };
}

/**
 * Result of a covenant test including calculated ratios and headroom analysis.
 *
 * ## Headroom Calculation
 *
 * Headroom represents how much "breathing room" exists between the current value
 * and the covenant threshold. The calculation differs based on threshold type:
 *
 * ### For MAXIMUM thresholds (e.g., Leverage Ratio ≤ 4.0x):
 * ```
 * headroom_percentage = ((threshold - value) / threshold) × 100
 * ```
 *
 * **Example:** Leverage Ratio with max threshold of 4.0x
 * - Current value: 3.2x
 * - Headroom = ((4.0 - 3.2) / 4.0) × 100 = 20%
 * - Interpretation: Value can increase by 20% of the threshold before breach
 *
 * **Breach Example:** Current value: 4.5x
 * - Headroom = ((4.0 - 4.5) / 4.0) × 100 = -12.5%
 * - Interpretation: Negative headroom indicates breach (value exceeds threshold)
 *
 * ### For MINIMUM thresholds (e.g., Interest Coverage ≥ 2.0x):
 * ```
 * headroom_percentage = ((value - threshold) / threshold) × 100
 * ```
 *
 * **Example:** Interest Coverage with min threshold of 2.0x
 * - Current value: 2.6x
 * - Headroom = ((2.6 - 2.0) / 2.0) × 100 = 30%
 * - Interpretation: Value can decrease by 30% of the threshold before breach
 *
 * **Breach Example:** Current value: 1.8x
 * - Headroom = ((1.8 - 2.0) / 2.0) × 100 = -10%
 * - Interpretation: Negative headroom indicates breach (value below threshold)
 *
 * ## Direction Interpretation
 *
 * | Headroom | Meaning |
 * |----------|---------|
 * | > 30%    | Healthy - comfortable buffer |
 * | 15-30%   | Moderate - adequate cushion |
 * | 0-15%    | At Risk - limited room for deterioration |
 * | < 0%     | Breached - covenant violation |
 *
 * ## Absolute Headroom
 *
 * The `headroom_absolute` field stores the raw difference (threshold - value for max,
 * value - threshold for min) in the same units as the ratio/amount. This is useful
 * for monetary covenants (e.g., Minimum Liquidity) where percentages may be less intuitive.
 */
export interface CovenantTestResult {
  /** Date when the covenant test was performed */
  test_date: string;
  /** The calculated ratio or amount from the test period */
  calculated_ratio: number;
  /** Whether the covenant test passed or failed */
  test_result: 'pass' | 'fail';
  /**
   * Percentage headroom to the threshold.
   * - Positive: cushion remaining before breach
   * - Negative: amount by which covenant is breached
   * - See interface documentation for calculation formulas
   */
  headroom_percentage: number;
  /**
   * Absolute headroom in the same units as the ratio.
   * For ratios: difference in x (e.g., 0.5x means 0.5 units of headroom)
   * For monetary amounts: difference in currency (e.g., $10M headroom)
   */
  headroom_absolute: number;
}

export type TrendDirection = 'improving' | 'declining' | 'stable';

/**
 * Represents a financial covenant attached to a loan facility.
 *
 * A covenant is a financial condition that borrowers must maintain throughout
 * the life of the loan. Covenants protect lenders by ensuring borrowers maintain
 * adequate financial health.
 *
 * ## Threshold Types and Headroom Direction
 *
 * The `threshold_type` determines how headroom is calculated and interpreted:
 *
 * ### Maximum Threshold (`threshold_type: 'maximum'`)
 * Used when the borrower must stay BELOW a limit.
 * - **Examples:** Leverage Ratio, Debt-to-EBITDA
 * - **Compliance:** value ≤ threshold
 * - **Headroom:** (threshold - value) / threshold × 100
 * - **Positive headroom:** Good - value is safely below limit
 * - **Negative headroom:** Breach - value exceeds limit
 *
 * ### Minimum Threshold (`threshold_type: 'minimum'`)
 * Used when the borrower must stay ABOVE a floor.
 * - **Examples:** Interest Coverage Ratio, DSCR, Minimum Liquidity
 * - **Compliance:** value ≥ threshold
 * - **Headroom:** (value - threshold) / threshold × 100
 * - **Positive headroom:** Good - value is safely above floor
 * - **Negative headroom:** Breach - value is below floor
 *
 * @see CovenantTestResult for detailed headroom calculation examples
 */
export interface Covenant {
  /** Unique identifier for the covenant */
  id: string;
  /** Human-readable name (e.g., "Senior Leverage Ratio") */
  name: string;
  /** Type of covenant (e.g., 'leverage_ratio', 'interest_coverage') */
  covenant_type: string;
  /** ID of the facility this covenant belongs to */
  facility_id: string;
  /** Name of the facility for display purposes */
  facility_name: string;
  /** Name of the borrower for display purposes */
  borrower_name: string;
  /**
   * Whether the covenant has a maximum or minimum threshold.
   * - 'maximum': Value must be ≤ threshold (e.g., Leverage ≤ 4.0x)
   * - 'minimum': Value must be ≥ threshold (e.g., Coverage ≥ 2.0x)
   * This determines how headroom is calculated - see CovenantTestResult.
   */
  threshold_type: 'maximum' | 'minimum';
  /** The current threshold value that must not be breached */
  current_threshold: number;
  /** Current status of the covenant */
  status: CovenantStatus;
  /** How often the covenant is tested */
  test_frequency: 'monthly' | 'quarterly' | 'annually';
  /** Date of the next scheduled test, or null if not scheduled */
  next_test_date: string | null;
  /** Most recent test result including headroom calculation */
  latest_test: CovenantTestResult;
  /** Historical test results for trend analysis */
  test_history?: CovenantTestResult[];
  /** Active waiver information if the covenant is currently waived */
  waiver?: {
    /** Date when the waiver expires and compliance is required again */
    expiration_date: string;
  };
}

// =============================================================================
// Information Entropy Types
// =============================================================================

/**
 * Information entropy metrics for covenant risk assessment.
 * Models headroom as entropy where covenants near thresholds have high
 * information content (low entropy) and distant covenants have low
 * information content (high entropy).
 */
export interface CovenantEntropyMetrics {
  /** Current entropy value (0-1, where 0 is maximum risk, 1 is maximum safety) */
  entropy: number;

  /** Rate of entropy change over time (bits per period) */
  entropy_velocity: number;

  /** Acceleration of entropy change (bits per period squared) */
  entropy_acceleration: number;

  /** Information content (inverse of entropy, 0-1) */
  information_content: number;

  /** Attention level based on entropy metrics (1-5, where 5 is maximum attention) */
  attention_level: 1 | 2 | 3 | 4 | 5;

  /** Human-readable interpretation */
  interpretation: string;

  /** Alert priority score (0-100) */
  alert_priority: number;

  /** Timestamp of calculation */
  calculated_at: string;
}

/**
 * Covenant with entropy metrics attached.
 */
export interface CovenantWithEntropy extends Covenant {
  entropy_metrics?: CovenantEntropyMetrics;
}

export interface Obligation {
  id: string;
  name: string;
  obligation_type: string;
  frequency: 'monthly' | 'quarterly' | 'annually';
  deadline_days_after_period: number;
  is_active: boolean;
  upcoming_event: {
    deadline_date: string;
    status: ItemStatus;
  };
}

export interface CalendarEvent {
  id: string;
  facility_id: string;
  date: string;
  type: ItemType;
  title: string;
  facility_name: string;
  borrower_name: string;
  status: ItemStatus;
}

export interface FacilityDetail extends Facility {
  signing_date: string;
  agent_bank: string;
  source_document_id: string;
}

export interface ComplianceFacilityDetail {
  id: string;
  facility_name: string;
  borrower_name: string;
  facility_type: string;
  status: ComplianceFacilityStatus;
  commitment_amount: number;
  maturity_date: string;
  agent_name: string | null;
}

// =============================================================================
// Covenant Breach Prediction Types
// =============================================================================

/**
 * Risk level for breach predictions.
 */
export type PredictionRiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Helper function for risk level color styling.
 */
export function getPredictionRiskColor(level: PredictionRiskLevel): string {
  switch (level) {
    case 'low':
      return 'bg-green-100 text-green-700';
    case 'medium':
      return 'bg-amber-100 text-amber-700';
    case 'high':
      return 'bg-orange-100 text-orange-700';
    case 'critical':
      return 'bg-red-100 text-red-700';
    default:
      return assertNever(level);
  }
}

/**
 * Helper function for risk level border styling.
 */
export function getPredictionRiskBorderColor(level: PredictionRiskLevel): string {
  switch (level) {
    case 'low':
      return 'border-green-200';
    case 'medium':
      return 'border-amber-200';
    case 'high':
      return 'border-orange-200';
    case 'critical':
      return 'border-red-200';
    default:
      return assertNever(level);
  }
}

/**
 * A single contributing factor to the breach prediction.
 */
export interface PredictionContributingFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
  weight: number; // 0-100 percentage contribution to prediction
}

/**
 * Quarterly projection data point.
 */
export interface QuarterlyProjection {
  quarter: string; // e.g., "Q1 2025"
  projected_ratio: number;
  breach_probability: number; // 0-100 percentage
  confidence: number; // 0-100 percentage
}

/**
 * Seasonal pattern identified in the data.
 */
export interface SeasonalPattern {
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  typical_impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

/**
 * Complete breach prediction result from AI analysis.
 */
export interface BreachPrediction {
  covenant_id: string;
  prediction_date: string;

  // Core prediction metrics
  breach_probability_2q: number; // 0-100 percentage, 2 quarters out
  breach_probability_3q: number; // 0-100 percentage, 3 quarters out
  overall_risk_level: PredictionRiskLevel;
  confidence_score: number; // 0-100 percentage

  // Projected breach timing
  projected_breach_quarter: string | null; // e.g., "Q2 2025" or null if no breach projected

  // Contributing factors
  contributing_factors: PredictionContributingFactor[];

  // Quarterly projections
  quarterly_projections: QuarterlyProjection[];

  // Seasonal patterns
  seasonal_patterns: SeasonalPattern[];

  // Recommendations
  recommendations: string[];

  // Summary
  summary: string;
}

/**
 * Risk threshold configuration for alerts.
 */
export interface RiskThresholdConfig {
  low_threshold: number; // Below this = low risk (default 25)
  medium_threshold: number; // Below this = medium risk (default 50)
  high_threshold: number; // Below this = high risk (default 75)
  // Above high_threshold = critical risk

  // Alert triggers
  alert_on_high_risk: boolean;
  alert_on_critical_risk: boolean;
  alert_on_threshold_crossed: boolean;
}

/**
 * Default risk threshold configuration.
 */
export const DEFAULT_RISK_THRESHOLDS: RiskThresholdConfig = {
  low_threshold: 25,
  medium_threshold: 50,
  high_threshold: 75,
  alert_on_high_risk: true,
  alert_on_critical_risk: true,
  alert_on_threshold_crossed: true,
};

/**
 * Alert generated when prediction crosses threshold.
 */
export interface PredictionAlert {
  id: string;
  covenant_id: string;
  covenant_name: string;
  facility_name: string;
  borrower_name: string;
  alert_type: 'high_risk' | 'critical_risk' | 'threshold_crossed';
  previous_risk_level: PredictionRiskLevel | null;
  current_risk_level: PredictionRiskLevel;
  breach_probability: number;
  message: string;
  created_at: string;
  acknowledged: boolean;
}

/**
 * Covenant with prediction data attached.
 */
export interface CovenantWithPrediction extends Covenant {
  prediction?: BreachPrediction;
}

// =============================================================================
// Covenant Benchmark Intelligence Network Types
// =============================================================================

/**
 * Industry sector categories for benchmark grouping.
 */
export type IndustrySector =
  | 'manufacturing'
  | 'technology'
  | 'healthcare'
  | 'retail'
  | 'financial_services'
  | 'real_estate'
  | 'energy'
  | 'consumer_goods'
  | 'transportation'
  | 'utilities';

/**
 * Company size categories for benchmark comparison.
 */
export type CompanySize = 'small' | 'mid_market' | 'large' | 'enterprise';

/**
 * Loan type categories for benchmark grouping.
 */
export type BenchmarkLoanType =
  | 'term_loan'
  | 'revolving_credit'
  | 'abl'
  | 'delayed_draw'
  | 'bridge'
  | 'bilateral'
  | 'club_deal'
  | 'syndicated';

/**
 * Covenant type categories for benchmarking.
 */
export type BenchmarkCovenantType =
  | 'leverage_ratio'
  | 'interest_coverage'
  | 'fixed_charge_coverage'
  | 'debt_service_coverage'
  | 'minimum_liquidity'
  | 'capex'
  | 'net_worth';

/**
 * Market position relative to benchmark.
 */
export type MarketPosition = 'tight' | 'market' | 'loose';

/**
 * Helper function for industry sector color styling.
 */
export function getIndustrySectorColor(sector: IndustrySector): string {
  switch (sector) {
    case 'manufacturing':
      return 'bg-blue-100 text-blue-700';
    case 'technology':
      return 'bg-purple-100 text-purple-700';
    case 'healthcare':
      return 'bg-green-100 text-green-700';
    case 'retail':
      return 'bg-orange-100 text-orange-700';
    case 'financial_services':
      return 'bg-indigo-100 text-indigo-700';
    case 'real_estate':
      return 'bg-amber-100 text-amber-700';
    case 'energy':
      return 'bg-yellow-100 text-yellow-700';
    case 'consumer_goods':
      return 'bg-pink-100 text-pink-700';
    case 'transportation':
      return 'bg-cyan-100 text-cyan-700';
    case 'utilities':
      return 'bg-teal-100 text-teal-700';
    default:
      return assertNever(sector);
  }
}

/**
 * Helper function for industry sector label.
 */
export function getIndustrySectorLabel(sector: IndustrySector): string {
  switch (sector) {
    case 'manufacturing':
      return 'Manufacturing';
    case 'technology':
      return 'Technology';
    case 'healthcare':
      return 'Healthcare';
    case 'retail':
      return 'Retail';
    case 'financial_services':
      return 'Financial Services';
    case 'real_estate':
      return 'Real Estate';
    case 'energy':
      return 'Energy';
    case 'consumer_goods':
      return 'Consumer Goods';
    case 'transportation':
      return 'Transportation';
    case 'utilities':
      return 'Utilities';
    default:
      return assertNever(sector);
  }
}

/**
 * Helper function for company size label.
 */
export function getCompanySizeLabel(size: CompanySize): string {
  switch (size) {
    case 'small':
      return 'Small ($0-50M)';
    case 'mid_market':
      return 'Mid-Market ($50-500M)';
    case 'large':
      return 'Large ($500M-2B)';
    case 'enterprise':
      return 'Enterprise ($2B+)';
    default:
      return assertNever(size);
  }
}

/**
 * Helper function for market position color styling.
 */
export function getMarketPositionColor(position: MarketPosition): string {
  switch (position) {
    case 'tight':
      return 'bg-red-100 text-red-700';
    case 'market':
      return 'bg-green-100 text-green-700';
    case 'loose':
      return 'bg-amber-100 text-amber-700';
    default:
      return assertNever(position);
  }
}

/**
 * Helper function for market position label.
 */
export function getMarketPositionLabel(position: MarketPosition): string {
  switch (position) {
    case 'tight':
      return 'Tighter than Market';
    case 'market':
      return 'Market Standard';
    case 'loose':
      return 'Looser than Market';
    default:
      return assertNever(position);
  }
}

/**
 * Benchmark data point for a specific time period.
 */
export interface BenchmarkDataPoint {
  period: string; // e.g., "Q1 2024", "2024"
  average: number;
  median: number;
  percentile_25: number;
  percentile_75: number;
  min: number;
  max: number;
  sample_size: number;
}

/**
 * Trend data showing historical benchmark changes.
 */
export interface BenchmarkTrend {
  covenant_type: BenchmarkCovenantType;
  industry: IndustrySector;
  data_points: BenchmarkDataPoint[];
  trend_direction: TrendDirection;
  trend_change_percentage: number; // e.g., -5.5 means trending 5.5% tighter
}

/**
 * Industry benchmark for a specific covenant type.
 */
export interface IndustryBenchmark {
  id: string;
  industry: IndustrySector;
  company_size: CompanySize;
  loan_type: BenchmarkLoanType;
  covenant_type: BenchmarkCovenantType;
  threshold_type: 'maximum' | 'minimum';

  // Current benchmark values
  current_average: number;
  current_median: number;
  current_percentile_25: number;
  current_percentile_75: number;
  current_min: number;
  current_max: number;

  // Sample information
  sample_size: number;
  last_updated: string;

  // Historical data
  historical_data: BenchmarkDataPoint[];

  // Trend analysis
  trend_direction: TrendDirection;
  trend_change_12m: number; // Percentage change over 12 months
}

/**
 * Peer institution data for benchmark comparison.
 */
export interface PeerInstitution {
  /** Peer institution ID */
  id: string;
  /** Anonymized peer name (e.g., "Peer Bank A") */
  name: string;
  /** Peer's percentile position (0-100) */
  percentile_rank: number;
  /** Peer's threshold value */
  threshold_value: number;
  /** Peer's current value */
  current_value: number;
}

/**
 * Movement indicator showing percentile change from previous quarter.
 */
export interface PercentileMovement {
  /** Previous quarter's percentile rank */
  previous_percentile: number;
  /** Direction of movement */
  direction: 'up' | 'down' | 'stable';
  /** Absolute change in percentile points */
  change_points: number;
  /** Previous quarter label (e.g., "Q2 2024") */
  previous_quarter: string;
}

/**
 * Comparison of a borrower's covenant to industry benchmark.
 */
export interface CovenantBenchmarkComparison {
  covenant_id: string;
  covenant_name: string;
  covenant_type: BenchmarkCovenantType;
  facility_id: string;
  facility_name: string;
  borrower_name: string;

  // Borrower's current values
  borrower_threshold: number;
  borrower_current_value: number;
  borrower_headroom: number;

  // Benchmark comparison
  benchmark_id: string;
  industry: IndustrySector;
  company_size: CompanySize;

  // Percentile position (0-100)
  percentile_rank: number;

  // Market position assessment
  market_position: MarketPosition;

  // Deviation from market
  deviation_from_median: number; // Percentage deviation
  deviation_from_average: number;

  // Recommendations
  comparison_summary: string;

  // Peer comparison data (optional)
  peer_institutions?: PeerInstitution[];

  // Movement from previous quarter (optional)
  percentile_movement?: PercentileMovement;
}

/**
 * Market comparison alert for unusual covenant terms.
 */
export interface MarketComparisonAlert {
  id: string;
  covenant_id: string;
  covenant_name: string;
  facility_name: string;
  borrower_name: string;
  covenant_type: BenchmarkCovenantType;

  alert_type: 'unusually_tight' | 'unusually_loose' | 'market_shift' | 'trend_deviation';
  severity: 'info' | 'warning' | 'critical';

  // Alert details
  borrower_value: number;
  market_median: number;
  market_average: number;
  percentile_rank: number;

  // Message
  title: string;
  message: string;
  recommendation: string;

  // Timestamps
  created_at: string;
  acknowledged: boolean;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
}

/**
 * Aggregate benchmark statistics for dashboard display.
 */
export interface BenchmarkDashboardStats {
  total_data_points: number;
  institutions_contributing: number;
  industries_covered: number;
  last_data_refresh: string;

  // Alert counts
  total_alerts: number;
  tight_covenant_alerts: number;
  loose_covenant_alerts: number;
  market_shift_alerts: number;

  // Coverage
  covenants_benchmarked: number;
  covenants_total: number;
  benchmark_coverage_percentage: number;
}

/**
 * Benchmark filter options for the UI.
 */
export interface BenchmarkFilterOptions {
  industries: IndustrySector[];
  company_sizes: CompanySize[];
  loan_types: BenchmarkLoanType[];
  covenant_types: BenchmarkCovenantType[];
  time_range: '3m' | '6m' | '1y' | '2y' | 'all';
}

/**
 * Network contribution status for a user/institution.
 */
export interface NetworkContributionStatus {
  institution_id: string;
  institution_name: string;

  // Contribution metrics
  facilities_contributed: number;
  covenants_contributed: number;
  last_contribution_date: string;

  // Access level based on contribution
  access_tier: 'basic' | 'standard' | 'premium';

  // Benefits
  benchmark_access_level: 'limited' | 'full' | 'detailed';
  can_export_data: boolean;
  can_view_trends: boolean;
  can_receive_alerts: boolean;
}

// =============================================================================
// Market Thermometer Types (Market-Wide Intelligence)
// =============================================================================

/**
 * Market temperature level indicating overall credit conditions.
 */
export type MarketTemperature = 'very_cold' | 'cold' | 'neutral' | 'warm' | 'hot';

/**
 * Helper function for market temperature color styling.
 */
export function getMarketTemperatureColor(temp: MarketTemperature): string {
  switch (temp) {
    case 'very_cold':
      return 'bg-blue-600 text-white';
    case 'cold':
      return 'bg-blue-400 text-white';
    case 'neutral':
      return 'bg-gray-400 text-white';
    case 'warm':
      return 'bg-orange-400 text-white';
    case 'hot':
      return 'bg-red-500 text-white';
    default:
      return assertNever(temp);
  }
}

/**
 * Helper function for market temperature label.
 */
export function getMarketTemperatureLabel(temp: MarketTemperature): string {
  switch (temp) {
    case 'very_cold':
      return 'Very Cold - Severe Stress';
    case 'cold':
      return 'Cold - Elevated Stress';
    case 'neutral':
      return 'Neutral - Stable';
    case 'warm':
      return 'Warm - Loosening';
    case 'hot':
      return 'Hot - Loose Conditions';
    default:
      return assertNever(temp);
  }
}

/**
 * Aggregate headroom distribution across the network.
 * Shows statistical distribution of covenant headroom.
 */
export interface HeadroomDistribution {
  covenant_type: BenchmarkCovenantType;
  industry: IndustrySector;

  // Distribution metrics
  mean_headroom: number;
  median_headroom: number;
  std_deviation: number;

  // Percentile distribution
  percentile_10: number;
  percentile_25: number;
  percentile_50: number;
  percentile_75: number;
  percentile_90: number;

  // Risk metrics
  at_risk_percentage: number; // % with headroom < 15%
  breached_percentage: number; // % currently breached
  healthy_percentage: number; // % with headroom > 30%

  // Sample size
  sample_size: number;
  as_of_date: string;
}

/**
 * Systematic trend showing covenant tightening/loosening patterns.
 */
export interface SystematicTrend {
  id: string;
  covenant_type: BenchmarkCovenantType;
  industry: IndustrySector;

  // Trend metrics
  trend_direction: 'tightening' | 'loosening' | 'stable';
  trend_strength: 'weak' | 'moderate' | 'strong';

  // Quantitative measures
  threshold_change_percentage: number; // Change in average threshold
  headroom_change_percentage: number; // Change in average headroom
  at_risk_delta: number; // Change in % of at-risk covenants

  // Time period
  period_start: string;
  period_end: string;
  quarters_analyzed: number;

  // Interpretation
  summary: string;
  contributing_factors: string[];
}

/**
 * Market condition alert for systemic risk signals.
 */
export interface MarketConditionAlert {
  id: string;
  alert_type: 'systemic_stress' | 'sector_deterioration' | 'widespread_tightening' | 'market_improvement';
  severity: 'info' | 'warning' | 'critical';

  // Scope
  industry: IndustrySector | 'all';
  covenant_type: BenchmarkCovenantType | 'all';

  // Metrics
  affected_institution_count: number;
  affected_covenant_count: number;
  affected_percentage: number;

  // Details
  title: string;
  message: string;
  impact_summary: string;
  recommendations: string[];

  // Context
  triggered_at: string;
  trigger_condition: string;
  historical_context: string;

  // Status
  acknowledged: boolean;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
}

/**
 * Market thermometer reading combining multiple indicators.
 */
export interface MarketThermometerReading {
  id: string;
  reading_date: string;

  // Overall market temperature
  overall_temperature: MarketTemperature;
  overall_score: number; // 0-100, where 0 is very cold, 100 is hot

  // Industry-specific temperatures
  industry_readings: Array<{
    industry: IndustrySector;
    temperature: MarketTemperature;
    score: number;
    change_from_last_quarter: number;
  }>;

  // Covenant-type specific readings
  covenant_type_readings: Array<{
    covenant_type: BenchmarkCovenantType;
    temperature: MarketTemperature;
    score: number;
    at_risk_percentage: number;
  }>;

  // Key indicators
  indicators: {
    average_headroom: number;
    headroom_change_3m: number;
    at_risk_percentage: number;
    at_risk_change_3m: number;
    breach_percentage: number;
    breach_change_3m: number;
    threshold_tightening_percentage: number;
  };

  // Interpretation
  market_summary: string;
  key_trends: string[];
  risk_outlook: 'deteriorating' | 'stable' | 'improving';

  // Sample coverage
  total_covenants_analyzed: number;
  institutions_contributing: number;
}

/**
 * Historical market thermometer trend data.
 */
export interface MarketThermometerHistory {
  readings: MarketThermometerReading[];
  trend_direction: TrendDirection;
  volatility: 'low' | 'moderate' | 'high';
  cycle_position: 'expansion' | 'peak' | 'contraction' | 'trough';
  quarters_in_current_cycle: number;
}

/**
 * Industry health independent of portfolio performance.
 */
export interface IndustryHealthMetrics {
  industry: IndustrySector;
  as_of_date: string;

  // Aggregate health scores
  overall_health_score: number; // 0-100
  credit_condition_index: number; // 0-100

  // Covenant performance metrics
  average_headroom_all_covenants: number;
  median_headroom_all_covenants: number;
  covenants_at_risk_percentage: number;
  covenants_breached_percentage: number;

  // Trend indicators
  headroom_trend_3m: 'improving' | 'stable' | 'declining';
  headroom_change_3m_percentage: number;
  headroom_trend_12m: 'improving' | 'stable' | 'declining';
  headroom_change_12m_percentage: number;

  // Stress indicators
  stress_level: 'low' | 'moderate' | 'elevated' | 'high';
  institutions_with_breaches: number;
  institutions_with_at_risk: number;
  total_institutions: number;

  // Predictive indicators
  predicted_deterioration_next_quarter: boolean;
  predicted_deterioration_probability: number;
  early_warning_signals: string[];

  // Comparison
  relative_to_market: 'outperforming' | 'inline' | 'underperforming';
  rank_among_industries: number; // 1-10

  // Details by covenant type
  covenant_breakdown: Array<{
    covenant_type: BenchmarkCovenantType;
    average_headroom: number;
    at_risk_percentage: number;
    trend: TrendDirection;
  }>;
}

/**
 * Macro dashboard statistics showing market-wide health.
 */
export interface MacroDashboardStats {
  as_of_date: string;

  // Overall market metrics
  market_temperature: MarketTemperature;
  market_health_score: number; // 0-100

  // Aggregate covenant metrics
  total_covenants_tracked: number;
  total_institutions: number;
  total_industries: number;

  // Risk distribution
  healthy_covenants_percentage: number; // >30% headroom
  moderate_covenants_percentage: number; // 15-30% headroom
  at_risk_covenants_percentage: number; // <15% headroom
  breached_covenants_percentage: number;

  // Change indicators
  at_risk_change_from_last_quarter: number;
  breach_change_from_last_quarter: number;
  average_headroom_change_from_last_quarter: number;

  // Industry breakdown
  industries_in_stress: number; // Industries with >30% at-risk
  industries_stable: number;
  industries_healthy: number;

  // Alerts
  active_market_alerts: number;
  critical_alerts: number;

  // Top concerns
  most_stressed_industry: IndustrySector;
  most_stressed_covenant_type: BenchmarkCovenantType;
  institutions_with_systemic_issues: number;
}

/**
 * Cross-sectional analysis comparing multiple industries/sectors.
 */
export interface CrossSectionalAnalysis {
  analysis_date: string;
  comparison_type: 'industry' | 'covenant_type' | 'company_size';

  segments: Array<{
    segment_name: string;
    segment_key: IndustrySector | BenchmarkCovenantType | CompanySize;

    // Core metrics
    average_headroom: number;
    median_headroom: number;
    at_risk_percentage: number;
    breach_percentage: number;

    // Trend
    trend_direction: TrendDirection;
    trend_strength: number;

    // Rank
    rank: number;
    percentile: number;

    // Sample
    sample_size: number;
  }>;

  // Summary
  highest_risk_segment: string;
  lowest_risk_segment: string;
  most_improving_segment: string;
  most_deteriorating_segment: string;

  // Statistical tests
  variance_across_segments: number;
  significant_differences: boolean;
}

/**
 * Early warning signal for market stress.
 */
export interface EarlyWarningSignal {
  id: string;
  signal_type: 'headroom_compression' | 'breach_acceleration' | 'threshold_tightening' | 'correlation_spike';
  severity: 'low' | 'medium' | 'high';

  // Scope
  industry: IndustrySector | 'all';
  covenant_type: BenchmarkCovenantType | 'all';

  // Metrics
  current_value: number;
  threshold_value: number;
  deviation_from_threshold: number;

  // Trend
  change_rate: number;
  acceleration: number;

  // Message
  title: string;
  description: string;
  interpretation: string;

  // Timestamp
  detected_at: string;
  first_detected_at: string;

  // Historical context
  historical_precedents: string[];
  typical_outcomes: string[];
}

// =============================================================================
// Waiver Types
// =============================================================================

/**
 * Waiver status indicating the current state of a waiver request.
 */
export type WaiverStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'withdrawn';

/**
 * Helper function for waiver status color styling.
 */
export function getWaiverStatusColor(status: WaiverStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-700';
    case 'approved':
      return 'bg-green-100 text-green-700';
    case 'rejected':
      return 'bg-red-100 text-red-700';
    case 'expired':
      return 'bg-zinc-100 text-zinc-600';
    case 'withdrawn':
      return 'bg-zinc-100 text-zinc-500';
    default:
      return assertNever(status);
  }
}

/**
 * Helper function for waiver status label.
 */
export function getWaiverStatusLabel(status: WaiverStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending Approval';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'expired':
      return 'Expired';
    case 'withdrawn':
      return 'Withdrawn';
    default:
      return assertNever(status);
  }
}

/**
 * Waiver request priority level.
 */
export type WaiverPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Helper function for waiver priority color styling.
 */
export function getWaiverPriorityColor(priority: WaiverPriority): string {
  switch (priority) {
    case 'low':
      return 'bg-zinc-100 text-zinc-700';
    case 'medium':
      return 'bg-blue-100 text-blue-700';
    case 'high':
      return 'bg-amber-100 text-amber-700';
    case 'critical':
      return 'bg-red-100 text-red-700';
    default:
      return assertNever(priority);
  }
}

/**
 * Helper function for waiver priority label.
 */
export function getWaiverPriorityLabel(priority: WaiverPriority): string {
  switch (priority) {
    case 'low':
      return 'Low Priority';
    case 'medium':
      return 'Medium Priority';
    case 'high':
      return 'High Priority';
    case 'critical':
      return 'Critical';
    default:
      return assertNever(priority);
  }
}

/**
 * Represents a waiver request for a covenant breach or potential breach.
 */
export interface Waiver {
  /** Unique identifier for the waiver */
  id: string;
  /** ID of the facility this waiver belongs to */
  facility_id: string;
  /** Name of the facility for display purposes */
  facility_name: string;
  /** Name of the borrower for display purposes */
  borrower_name: string;
  /** ID of the covenant being waived */
  covenant_id: string;
  /** Name of the covenant being waived */
  covenant_name: string;
  /** Type of covenant being waived */
  covenant_type: string;
  /** Current status of the waiver */
  status: WaiverStatus;
  /** Priority level of the waiver request */
  priority: WaiverPriority;
  /** Date the waiver was requested */
  requested_date: string;
  /** User who requested the waiver */
  requested_by: string;
  /** Date the waiver decision was made (approval/rejection) */
  decision_date: string | null;
  /** User who approved or rejected the waiver */
  decision_by: string | null;
  /** Date the waiver becomes effective (for approved waivers) */
  effective_date: string | null;
  /** Date the waiver expires (for approved waivers) */
  expiration_date: string | null;
  /** Reason for requesting the waiver */
  request_reason: string;
  /** Detailed justification for the waiver request */
  justification: string;
  /** Terms and conditions of the waiver (for approved waivers) */
  waiver_terms: string | null;
  /** Reason for rejection (for rejected waivers) */
  rejection_reason: string | null;
  /** The test result that triggered the waiver request */
  triggering_test: {
    test_date: string;
    calculated_ratio: number;
    threshold: number;
    headroom_percentage: number;
  } | null;
  /** Fee associated with the waiver (if any) */
  waiver_fee: number | null;
  /** Currency for the waiver fee */
  fee_currency: string;
  /** Supporting documents attached to the waiver request */
  supporting_documents: Array<{
    id: string;
    name: string;
    type: string;
    uploaded_at: string;
  }>;
  /** Comments and notes on the waiver */
  comments: Array<{
    id: string;
    author: string;
    content: string;
    created_at: string;
  }>;
  /** Timestamp when waiver was created */
  created_at: string;
  /** Timestamp when waiver was last updated */
  updated_at: string;
}

/**
 * Summary statistics for waivers on a facility.
 */
export interface WaiverStats {
  total_waivers: number;
  pending_waivers: number;
  approved_waivers: number;
  rejected_waivers: number;
  expired_waivers: number;
  active_waivers: number;
}

