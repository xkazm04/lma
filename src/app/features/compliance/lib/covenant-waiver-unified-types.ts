/**
 * Unified Covenant-Waiver Types
 *
 * This module implements bidirectional linkage between covenants and waivers.
 * The key insight: a Waiver IS a temporary mutation of a Covenant's state.
 * Instead of treating waivers as separate entities with references, we model
 * them as Covenant state transitions with the Waiver as the state-transition payload.
 *
 * ## State Machine Concept
 *
 * ```
 *                    ┌─────────────────────────────────────────┐
 *                    │                                         │
 *                    │     COVENANT STATE WITH WAIVER          │
 *                    │          AS STATE PAYLOAD               │
 *                    │                                         │
 *                    └─────────────────────────────────────────┘
 *
 *                              ┌──────────┐
 *                              │  ACTIVE  │ ◄─────────────────────┐
 *                              └────┬─────┘                       │
 *                                   │                             │
 *           ┌───────────────────────┼───────────────────────┐     │
 *           │                       │                       │     │
 *           │  waiver_granted       │  breach_detected      │     │
 *           ▼                       ▼                       │     │
 *    ┌──────────┐            ┌──────────┐                   │     │
 *    │  WAIVED  │            │ BREACHED │                   │     │
 *    │(+ Waiver │            └────┬─────┘                   │     │
 *    │ payload) │                 │                         │     │
 *    └────┬─────┘                 │                         │     │
 *         │                       │                         │     │
 *         │ waiver_expired        │ waiver_granted          │     │
 *         │ or terminated         │ (+ Waiver payload)      │     │
 *         └─────────┬─────────────┴─────────────────────────┘     │
 *                   │                                             │
 *                   └─────────────────────────────────────────────┘
 *
 * The Waiver object becomes metadata attached to the waived state transition,
 * providing full context about why, when, and how the covenant entered that state.
 * ```
 */

import type {
  Covenant,
  CovenantStatus,
  CovenantTransitionTrigger,
  CovenantStatusTransition,
  Waiver,
  WaiverStatus,
  CovenantLifecycleState,
  CovenantStateTransition,
  CovenantStateHistory,
} from './types';

// =============================================================================
// Covenant State with Waiver Context
// =============================================================================

/**
 * Extended waiver information that includes the original covenant context.
 * This captures the bidirectional relationship between waiver and covenant.
 */
export interface WaiverWithCovenantContext extends Waiver {
  /** The covenant's state before the waiver was granted */
  covenant_state_before_waiver: CovenantStatus;
  /** The covenant's lifecycle state (for analytics) before waiver */
  covenant_lifecycle_before_waiver?: CovenantLifecycleState;
  /** The test result that triggered the waiver (if applicable) */
  triggering_transition?: CovenantStatusTransition;
  /** Projected state when waiver expires */
  projected_state_after_expiration?: CovenantStatus;
}

/**
 * Unified covenant state that treats waiver as an embedded state payload.
 * When a covenant is in 'waived' status, the activeWaiverState contains
 * the full waiver context as the state-transition payload.
 */
export interface CovenantWithWaiverState extends Covenant {
  /** Active waiver state when covenant is in 'waived' status */
  activeWaiverState?: ActiveWaiverState;
  /** History of all waiver states for this covenant */
  waiverStateHistory: WaiverStateEntry[];
  /** Current unified state (combines covenant status with waiver context) */
  unifiedState: UnifiedCovenantState;
}

/**
 * Active waiver state - the payload for a 'waived' covenant status.
 * This is the key concept: waiver becomes STATE DATA, not a separate entity.
 */
export interface ActiveWaiverState {
  /** The waiver that triggered this state */
  waiver: Waiver;
  /** When this waiver state began */
  stateEnteredAt: string;
  /** When this waiver state will end (waiver expiration) */
  stateExpiresAt: string;
  /** Days remaining in waived state */
  daysRemaining: number;
  /** Percentage of waiver period elapsed */
  progressPercentage: number;
  /** Current compliance trend during waiver period */
  complianceTrend: 'improving' | 'stable' | 'deteriorating';
  /** Whether covenant is likely to pass when waiver expires */
  projectedComplianceAtExpiry: boolean;
  /** Risk level for waiver expiration */
  expirationRisk: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Historical entry for waiver state changes on a covenant.
 */
export interface WaiverStateEntry {
  /** The waiver that created this state */
  waiverId: string;
  /** Covenant status when waiver was granted */
  fromStatus: CovenantStatus;
  /** Status (waived) during waiver period */
  toStatus: 'waived';
  /** When waiver was granted (state entry) */
  enteredAt: string;
  /** When waiver expired or was terminated (state exit) */
  exitedAt: string | null;
  /** How the waiver state ended */
  exitReason: WaiverExitReason | null;
  /** Status after waiver ended */
  statusAfterWaiver: CovenantStatus | null;
  /** Whether covenant was compliant when waiver ended */
  wasCompliantAtExit: boolean | null;
  /** Full waiver details for historical reference */
  waiverSnapshot: Waiver;
}

/**
 * How a waiver state ended.
 */
export type WaiverExitReason =
  | 'expired'           // Natural expiration
  | 'terminated_early'  // Borrower or lender terminated
  | 'superseded'        // Replaced by new waiver
  | 'covenant_cured'    // Covenant returned to compliance
  | 'facility_closed';  // Underlying facility was closed

/**
 * Unified covenant state that presents a single view of covenant + waiver status.
 * This is what the UI should display instead of separate covenant/waiver views.
 */
export interface UnifiedCovenantState {
  /** The base covenant status */
  baseStatus: CovenantStatus;
  /** Whether there's an active waiver modifying the status */
  hasActiveWaiver: boolean;
  /** Whether there are pending waiver requests */
  hasPendingWaiver: boolean;
  /** Display status (combines base status with waiver context) */
  displayStatus: UnifiedDisplayStatus;
  /** Color class for the status badge */
  statusColor: string;
  /** Icon to display */
  statusIcon: 'check' | 'clock' | 'alert' | 'shield' | 'x';
  /** Human-readable status description */
  statusDescription: string;
  /** Recommended action, if any */
  recommendedAction?: string;
}

/**
 * Unified display status for UI.
 */
export type UnifiedDisplayStatus =
  | 'compliant'              // Passing, no issues
  | 'waived_protected'       // Currently in waived state, protected
  | 'waived_expiring_soon'   // Waived but expiring within 30 days
  | 'pending_waiver'         // Has pending waiver request
  | 'at_risk'                // Passing but low headroom
  | 'breached_waiver_pending' // Breached with pending waiver
  | 'breached_no_waiver'     // Breached without waiver protection
  | 'breached_waiver_rejected'; // Breached and waiver was rejected

// =============================================================================
// Timeline Event Types (Unified View)
// =============================================================================

/**
 * A single event in the unified covenant-waiver timeline.
 * This replaces separate covenant and waiver timelines with one unified view.
 */
export interface CovenantTimelineEvent {
  /** Unique event identifier */
  id: string;
  /** Covenant this event belongs to */
  covenantId: string;
  /** Timestamp of the event */
  timestamp: string;
  /** Type of event */
  eventType: CovenantTimelineEventType;
  /** Current state after this event */
  stateAfterEvent: CovenantStatus;
  /** Title for display */
  title: string;
  /** Description of what happened */
  description: string;
  /** Associated waiver (if any) */
  waiverId?: string;
  /** Associated test result (if any) */
  testResult?: {
    calculatedRatio: number;
    threshold: number;
    headroomPercentage: number;
    passed: boolean;
  };
  /** Metadata specific to the event type */
  metadata?: Record<string, unknown>;
  /** Actor who triggered this event */
  actor?: string;
  /** Whether this is the current/latest state */
  isCurrent: boolean;
}

/**
 * Types of events in the unified timeline.
 */
export type CovenantTimelineEventType =
  | 'covenant_created'
  | 'test_passed'
  | 'test_failed'
  | 'waiver_requested'
  | 'waiver_approved'
  | 'waiver_rejected'
  | 'waiver_expired'
  | 'waiver_terminated'
  | 'breach_declared'
  | 'breach_cured'
  | 'threshold_modified'
  | 'headroom_improved'
  | 'headroom_deteriorated';

/**
 * Get the display properties for a timeline event type.
 */
export function getTimelineEventProps(eventType: CovenantTimelineEventType): {
  color: string;
  bgColor: string;
  borderColor: string;
  icon: 'check' | 'x' | 'clock' | 'shield' | 'alert' | 'trending-up' | 'trending-down' | 'file' | 'edit';
  label: string;
} {
  switch (eventType) {
    case 'covenant_created':
      return {
        color: 'text-blue-700',
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-200',
        icon: 'file',
        label: 'Covenant Created',
      };
    case 'test_passed':
      return {
        color: 'text-green-700',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-200',
        icon: 'check',
        label: 'Test Passed',
      };
    case 'test_failed':
      return {
        color: 'text-red-700',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-200',
        icon: 'x',
        label: 'Test Failed',
      };
    case 'waiver_requested':
      return {
        color: 'text-amber-700',
        bgColor: 'bg-amber-100',
        borderColor: 'border-amber-200',
        icon: 'clock',
        label: 'Waiver Requested',
      };
    case 'waiver_approved':
      return {
        color: 'text-purple-700',
        bgColor: 'bg-purple-100',
        borderColor: 'border-purple-200',
        icon: 'shield',
        label: 'Waiver Approved',
      };
    case 'waiver_rejected':
      return {
        color: 'text-red-700',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-200',
        icon: 'x',
        label: 'Waiver Rejected',
      };
    case 'waiver_expired':
      return {
        color: 'text-zinc-700',
        bgColor: 'bg-zinc-100',
        borderColor: 'border-zinc-200',
        icon: 'clock',
        label: 'Waiver Expired',
      };
    case 'waiver_terminated':
      return {
        color: 'text-amber-700',
        bgColor: 'bg-amber-100',
        borderColor: 'border-amber-200',
        icon: 'x',
        label: 'Waiver Terminated',
      };
    case 'breach_declared':
      return {
        color: 'text-red-700',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-200',
        icon: 'alert',
        label: 'Breach Declared',
      };
    case 'breach_cured':
      return {
        color: 'text-green-700',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-200',
        icon: 'check',
        label: 'Breach Cured',
      };
    case 'threshold_modified':
      return {
        color: 'text-blue-700',
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-200',
        icon: 'edit',
        label: 'Threshold Modified',
      };
    case 'headroom_improved':
      return {
        color: 'text-green-700',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-200',
        icon: 'trending-up',
        label: 'Headroom Improved',
      };
    case 'headroom_deteriorated':
      return {
        color: 'text-amber-700',
        bgColor: 'bg-amber-100',
        borderColor: 'border-amber-200',
        icon: 'trending-down',
        label: 'Headroom Deteriorated',
      };
    default:
      return {
        color: 'text-zinc-700',
        bgColor: 'bg-zinc-100',
        borderColor: 'border-zinc-200',
        icon: 'file',
        label: 'Event',
      };
  }
}

// =============================================================================
// State Derivation Functions
// =============================================================================

/**
 * Calculate the unified state for a covenant based on its status and related waivers.
 */
export function deriveUnifiedState(
  covenant: Covenant,
  relatedWaivers: Waiver[]
): UnifiedCovenantState {
  const now = new Date();

  // Find active waiver (approved and not expired)
  const activeWaiver = relatedWaivers.find(
    w =>
      w.status === 'approved' &&
      w.expiration_date &&
      new Date(w.expiration_date) > now
  );

  // Find pending waivers
  const pendingWaivers = relatedWaivers.filter(w => w.status === 'pending');
  const hasPendingWaiver = pendingWaivers.length > 0;

  // Find if there's a recently rejected waiver
  const recentlyRejectedWaiver = relatedWaivers.find(
    w =>
      w.status === 'rejected' &&
      w.decision_date &&
      (now.getTime() - new Date(w.decision_date).getTime()) < 30 * 24 * 60 * 60 * 1000 // within 30 days
  );

  // Determine display status
  let displayStatus: UnifiedDisplayStatus;
  let statusColor: string;
  let statusIcon: 'check' | 'clock' | 'alert' | 'shield' | 'x';
  let statusDescription: string;
  let recommendedAction: string | undefined;

  if (covenant.status === 'active') {
    if (covenant.latest_test.headroom_percentage < 15 && covenant.latest_test.headroom_percentage >= 0) {
      displayStatus = 'at_risk';
      statusColor = 'bg-amber-100 text-amber-700 border-amber-200';
      statusIcon = 'alert';
      statusDescription = 'Passing with low headroom';
      recommendedAction = 'Monitor closely and consider proactive waiver request';
    } else {
      displayStatus = 'compliant';
      statusColor = 'bg-green-100 text-green-700 border-green-200';
      statusIcon = 'check';
      statusDescription = 'In compliance with healthy headroom';
    }
  } else if (covenant.status === 'waived') {
    if (activeWaiver?.expiration_date) {
      const daysUntilExpiry = Math.ceil(
        (new Date(activeWaiver.expiration_date).getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry <= 30) {
        displayStatus = 'waived_expiring_soon';
        statusColor = 'bg-amber-100 text-amber-700 border-amber-200';
        statusIcon = 'clock';
        statusDescription = `Waiver expires in ${daysUntilExpiry} days`;
        recommendedAction = 'Review compliance trajectory and consider waiver extension';
      } else {
        displayStatus = 'waived_protected';
        statusColor = 'bg-purple-100 text-purple-700 border-purple-200';
        statusIcon = 'shield';
        statusDescription = 'Protected by active waiver';
      }
    } else {
      displayStatus = 'waived_protected';
      statusColor = 'bg-purple-100 text-purple-700 border-purple-200';
      statusIcon = 'shield';
      statusDescription = 'Protected by active waiver';
    }
  } else if (covenant.status === 'breached') {
    if (hasPendingWaiver) {
      displayStatus = 'breached_waiver_pending';
      statusColor = 'bg-amber-100 text-amber-700 border-amber-200';
      statusIcon = 'clock';
      statusDescription = 'Breached with waiver request pending';
      recommendedAction = 'Follow up on waiver approval status';
    } else if (recentlyRejectedWaiver) {
      displayStatus = 'breached_waiver_rejected';
      statusColor = 'bg-red-100 text-red-700 border-red-200';
      statusIcon = 'x';
      statusDescription = 'Breached - waiver request was rejected';
      recommendedAction = 'Engage workout team or pursue restructuring';
    } else {
      displayStatus = 'breached_no_waiver';
      statusColor = 'bg-red-100 text-red-700 border-red-200';
      statusIcon = 'alert';
      statusDescription = 'Covenant breached without waiver protection';
      recommendedAction = 'Submit waiver request or pursue cure options';
    }
  } else {
    // Fallback
    displayStatus = 'compliant';
    statusColor = 'bg-zinc-100 text-zinc-700 border-zinc-200';
    statusIcon = 'check';
    statusDescription = 'Status unknown';
  }

  return {
    baseStatus: covenant.status,
    hasActiveWaiver: !!activeWaiver,
    hasPendingWaiver,
    displayStatus,
    statusColor,
    statusIcon,
    statusDescription,
    recommendedAction,
  };
}

/**
 * Calculate active waiver state for a covenant in waived status.
 */
export function deriveActiveWaiverState(
  covenant: Covenant,
  waiver: Waiver,
  recentTestResults?: Array<{ date: string; headroomPercentage: number }>
): ActiveWaiverState {
  const now = new Date();
  const effectiveDate = waiver.effective_date
    ? new Date(waiver.effective_date)
    : new Date(waiver.decision_date || waiver.requested_date);
  const expirationDate = waiver.expiration_date
    ? new Date(waiver.expiration_date)
    : new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // Default 90 days if not set

  const totalDays = Math.ceil(
    (expirationDate.getTime() - effectiveDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysElapsed = Math.ceil(
    (now.getTime() - effectiveDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysRemaining = Math.max(0, totalDays - daysElapsed);
  const progressPercentage = Math.min(100, (daysElapsed / totalDays) * 100);

  // Determine compliance trend based on recent test results
  let complianceTrend: 'improving' | 'stable' | 'deteriorating' = 'stable';
  if (recentTestResults && recentTestResults.length >= 2) {
    const sortedResults = [...recentTestResults].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const recent = sortedResults[sortedResults.length - 1];
    const previous = sortedResults[sortedResults.length - 2];

    if (recent.headroomPercentage > previous.headroomPercentage + 2) {
      complianceTrend = 'improving';
    } else if (recent.headroomPercentage < previous.headroomPercentage - 2) {
      complianceTrend = 'deteriorating';
    }
  }

  // Project whether covenant will be compliant at expiry
  const currentHeadroom = covenant.latest_test.headroom_percentage;
  const projectedComplianceAtExpiry = currentHeadroom >= 0 || complianceTrend === 'improving';

  // Determine expiration risk
  let expirationRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (daysRemaining <= 14) {
    if (currentHeadroom < 0 && complianceTrend !== 'improving') {
      expirationRisk = 'critical';
    } else if (currentHeadroom < 0) {
      expirationRisk = 'high';
    } else if (currentHeadroom < 10) {
      expirationRisk = 'medium';
    }
  } else if (daysRemaining <= 30) {
    if (currentHeadroom < -10) {
      expirationRisk = 'high';
    } else if (currentHeadroom < 0) {
      expirationRisk = 'medium';
    }
  }

  return {
    waiver,
    stateEnteredAt: effectiveDate.toISOString(),
    stateExpiresAt: expirationDate.toISOString(),
    daysRemaining,
    progressPercentage,
    complianceTrend,
    projectedComplianceAtExpiry,
    expirationRisk,
  };
}

/**
 * Build unified timeline from covenant history and related waivers.
 */
export function buildUnifiedTimeline(
  covenant: Covenant,
  waivers: Waiver[],
  stateHistory?: CovenantStateHistory
): CovenantTimelineEvent[] {
  const events: CovenantTimelineEvent[] = [];

  // Add covenant creation event (use first test date as proxy)
  if (covenant.test_history && covenant.test_history.length > 0) {
    const firstTest = covenant.test_history[0];
    events.push({
      id: `${covenant.id}-created`,
      covenantId: covenant.id,
      timestamp: firstTest.test_date,
      eventType: 'covenant_created',
      stateAfterEvent: 'active',
      title: 'Covenant Established',
      description: `${covenant.name} covenant tracking began`,
      isCurrent: false,
    });
  }

  // Add test result events from history
  if (covenant.test_history) {
    let previousHeadroom: number | null = null;

    covenant.test_history.forEach((test, index) => {
      const eventType: CovenantTimelineEventType =
        test.test_result === 'pass' ? 'test_passed' : 'test_failed';

      events.push({
        id: `${covenant.id}-test-${index}`,
        covenantId: covenant.id,
        timestamp: test.test_date,
        eventType,
        stateAfterEvent: test.test_result === 'pass' ? 'active' : 'breached',
        title: test.test_result === 'pass' ? 'Covenant Test Passed' : 'Covenant Test Failed',
        description: `Ratio: ${test.calculated_ratio.toFixed(2)}x | Headroom: ${test.headroom_percentage.toFixed(1)}%`,
        testResult: {
          calculatedRatio: test.calculated_ratio,
          threshold: covenant.current_threshold,
          headroomPercentage: test.headroom_percentage,
          passed: test.test_result === 'pass',
        },
        isCurrent: false,
      });

      // Add headroom change events
      if (previousHeadroom !== null) {
        const headroomChange = test.headroom_percentage - previousHeadroom;
        if (Math.abs(headroomChange) >= 5) {
          events.push({
            id: `${covenant.id}-headroom-${index}`,
            covenantId: covenant.id,
            timestamp: test.test_date,
            eventType: headroomChange > 0 ? 'headroom_improved' : 'headroom_deteriorated',
            stateAfterEvent: covenant.status,
            title: headroomChange > 0 ? 'Headroom Improved' : 'Headroom Deteriorated',
            description: `Headroom changed by ${headroomChange > 0 ? '+' : ''}${headroomChange.toFixed(1)}%`,
            isCurrent: false,
          });
        }
      }
      previousHeadroom = test.headroom_percentage;
    });
  }

  // Add waiver events
  waivers.forEach(waiver => {
    // Waiver requested
    events.push({
      id: `${waiver.id}-requested`,
      covenantId: covenant.id,
      timestamp: waiver.requested_date,
      eventType: 'waiver_requested',
      stateAfterEvent: covenant.status,
      title: 'Waiver Requested',
      description: waiver.request_reason,
      waiverId: waiver.id,
      actor: waiver.requested_by,
      isCurrent: false,
    });

    // Waiver decision
    if (waiver.status === 'approved' && waiver.decision_date) {
      events.push({
        id: `${waiver.id}-approved`,
        covenantId: covenant.id,
        timestamp: waiver.decision_date,
        eventType: 'waiver_approved',
        stateAfterEvent: 'waived',
        title: 'Waiver Approved',
        description: waiver.waiver_terms || 'Waiver granted',
        waiverId: waiver.id,
        actor: waiver.decision_by || undefined,
        isCurrent: false,
      });
    } else if (waiver.status === 'rejected' && waiver.decision_date) {
      events.push({
        id: `${waiver.id}-rejected`,
        covenantId: covenant.id,
        timestamp: waiver.decision_date,
        eventType: 'waiver_rejected',
        stateAfterEvent: 'breached',
        title: 'Waiver Rejected',
        description: waiver.rejection_reason || 'Waiver request denied',
        waiverId: waiver.id,
        actor: waiver.decision_by || undefined,
        isCurrent: false,
      });
    }

    // Waiver expiration (for past waivers)
    if (waiver.status === 'expired' && waiver.expiration_date) {
      events.push({
        id: `${waiver.id}-expired`,
        covenantId: covenant.id,
        timestamp: waiver.expiration_date,
        eventType: 'waiver_expired',
        stateAfterEvent: 'active',
        title: 'Waiver Expired',
        description: 'Waiver period ended, covenant monitoring resumed',
        waiverId: waiver.id,
        isCurrent: false,
      });
    }
  });

  // Sort by timestamp (most recent first for timeline display)
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Mark the most recent event as current
  if (events.length > 0) {
    events[0].isCurrent = true;
  }

  return events;
}

/**
 * Get waivers related to a specific covenant from a provided list.
 */
export function getCovenantWaivers(covenantId: string, allWaivers: Waiver[]): Waiver[] {
  return allWaivers.filter(w => w.covenant_id === covenantId);
}

/**
 * Find the active waiver for a covenant from a provided list.
 */
export function findActiveWaiverForCovenant(
  covenantId: string,
  allWaivers: Waiver[]
): Waiver | undefined {
  const now = new Date();
  return allWaivers.find(
    w =>
      w.covenant_id === covenantId &&
      w.status === 'approved' &&
      w.expiration_date &&
      new Date(w.expiration_date) > now
  );
}

/**
 * Find pending waivers for a covenant from a provided list.
 */
export function findPendingWaiversForCovenant(
  covenantId: string,
  allWaivers: Waiver[]
): Waiver[] {
  return allWaivers.filter(w => w.covenant_id === covenantId && w.status === 'pending');
}

/**
 * Convert a Covenant to CovenantWithWaiverState by enriching with waiver context.
 */
export function enrichCovenantWithWaiverState(
  covenant: Covenant,
  allWaivers: Waiver[]
): CovenantWithWaiverState {
  const relatedWaivers = getCovenantWaivers(covenant.id, allWaivers);
  const activeWaiver = findActiveWaiverForCovenant(covenant.id, allWaivers);
  const unifiedState = deriveUnifiedState(covenant, relatedWaivers);

  // Build waiver state history
  const waiverStateHistory: WaiverStateEntry[] = relatedWaivers
    .filter(w => w.status !== 'pending' && w.status !== 'withdrawn')
    .map(w => ({
      waiverId: w.id,
      fromStatus: 'breached' as CovenantStatus, // Waivers typically come from breached state
      toStatus: 'waived' as const,
      enteredAt: w.effective_date || w.decision_date || w.requested_date,
      exitedAt: w.status === 'expired' ? w.expiration_date : null,
      exitReason:
        w.status === 'expired' ? 'expired' as WaiverExitReason :
        w.status === 'rejected' ? null : null,
      statusAfterWaiver: w.status === 'expired' ? 'active' : null,
      wasCompliantAtExit: null, // Would need test result at exit time
      waiverSnapshot: w,
    }));

  // Build active waiver state if covenant is currently waived
  let activeWaiverState: ActiveWaiverState | undefined;
  if (covenant.status === 'waived' && activeWaiver) {
    const testResults = covenant.test_history?.map(t => ({
      date: t.test_date,
      headroomPercentage: t.headroom_percentage,
    }));
    activeWaiverState = deriveActiveWaiverState(covenant, activeWaiver, testResults);
  }

  return {
    ...covenant,
    activeWaiverState,
    waiverStateHistory,
    unifiedState,
  };
}
