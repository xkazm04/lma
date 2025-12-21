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

