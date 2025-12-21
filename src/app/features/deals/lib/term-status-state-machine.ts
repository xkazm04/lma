/**
 * Term Negotiation Status State Machine
 *
 * This module defines the valid state transitions for term negotiation statuses
 * and provides validation functions to enforce the state machine rules.
 *
 * State Flow:
 *   not_started -> proposed -> under_discussion -> pending_approval -> agreed -> locked
 *                     ^              |                   |
 *                     |              v                   v
 *                     +--- (can go back) <--------------+
 *
 * Rules:
 * - Terms must follow the defined workflow
 * - Cannot skip required approval steps
 * - Locked terms cannot be modified
 * - Some transitions require specific conditions (guard conditions)
 */

export type NegotiationStatus =
  | 'not_started'
  | 'proposed'
  | 'under_discussion'
  | 'pending_approval'
  | 'agreed'
  | 'locked';

export interface TransitionGuard {
  /** Description of the guard condition */
  description: string;
  /** Function to check if the guard condition is met */
  check: (context: TransitionContext) => boolean;
}

export interface TransitionContext {
  /** Whether the user is a deal lead */
  isDealLead: boolean;
  /** Whether the user has approval permission */
  canApprove: boolean;
  /** Whether the term has any pending proposals */
  hasPendingProposals: boolean;
  /** Whether all required parties have approved */
  allPartiesApproved: boolean;
  /** Whether the term is currently locked */
  isLocked: boolean;
  /** The deal's negotiation mode */
  negotiationMode: 'collaborative' | 'proposal_based';
  /** Whether unanimous consent is required */
  requireUnanimousConsent: boolean;
}

export interface StateTransition {
  /** Target state of the transition */
  to: NegotiationStatus;
  /** Optional guard conditions that must be met */
  guards?: TransitionGuard[];
  /** Description of when this transition is valid */
  description: string;
}

/**
 * State machine definition for negotiation status transitions
 */
export const NEGOTIATION_STATUS_TRANSITIONS: Record<NegotiationStatus, StateTransition[]> = {
  not_started: [
    {
      to: 'proposed',
      description: 'A proposal has been made for this term',
      guards: [
        {
          description: 'User must be a negotiator or deal lead',
          check: () => true, // Any participant can make initial proposal
        },
      ],
    },
  ],

  proposed: [
    {
      to: 'under_discussion',
      description: 'Term is now being actively discussed',
      guards: [
        {
          description: 'At least one response or comment has been made',
          check: () => true, // System tracks this automatically
        },
      ],
    },
    {
      to: 'pending_approval',
      description: 'Direct move to pending approval (bilateral deals)',
      guards: [
        {
          description: 'Deal must be in bilateral mode',
          check: (ctx) => ctx.negotiationMode !== 'collaborative',
        },
      ],
    },
    {
      to: 'agreed',
      description: 'Immediate agreement on proposal',
      guards: [
        {
          description: 'All parties must accept or unanimous consent not required',
          check: (ctx) => ctx.allPartiesApproved || !ctx.requireUnanimousConsent,
        },
        {
          description: 'User must have approval permission',
          check: (ctx) => ctx.canApprove,
        },
      ],
    },
    {
      to: 'not_started',
      description: 'Withdraw proposal and reset',
      guards: [
        {
          description: 'User must be deal lead',
          check: (ctx) => ctx.isDealLead,
        },
      ],
    },
  ],

  under_discussion: [
    {
      to: 'pending_approval',
      description: 'Discussion complete, awaiting final approval',
      guards: [
        {
          description: 'User must have approval permission or be deal lead',
          check: (ctx) => ctx.canApprove || ctx.isDealLead,
        },
      ],
    },
    {
      to: 'proposed',
      description: 'New counter-proposal made, restart discussion',
    },
    {
      to: 'agreed',
      description: 'Direct agreement during discussion',
      guards: [
        {
          description: 'All parties must accept',
          check: (ctx) => ctx.allPartiesApproved,
        },
        {
          description: 'User must have approval permission',
          check: (ctx) => ctx.canApprove,
        },
      ],
    },
    {
      to: 'not_started',
      description: 'Reset term to start fresh',
      guards: [
        {
          description: 'User must be deal lead',
          check: (ctx) => ctx.isDealLead,
        },
        {
          description: 'No pending proposals should exist',
          check: (ctx) => !ctx.hasPendingProposals,
        },
      ],
    },
  ],

  pending_approval: [
    {
      to: 'agreed',
      description: 'All required approvals received',
      guards: [
        {
          description: 'All parties must approve or unanimous consent not required',
          check: (ctx) => ctx.allPartiesApproved || !ctx.requireUnanimousConsent,
        },
        {
          description: 'User must have approval permission',
          check: (ctx) => ctx.canApprove,
        },
      ],
    },
    {
      to: 'under_discussion',
      description: 'Approval rejected, needs more discussion',
      guards: [
        {
          description: 'User must have approval permission',
          check: (ctx) => ctx.canApprove,
        },
      ],
    },
    {
      to: 'proposed',
      description: 'New counter-proposal during approval',
    },
  ],

  agreed: [
    {
      to: 'locked',
      description: 'Lock the agreed term to prevent further changes',
      guards: [
        {
          description: 'User must be deal lead',
          check: (ctx) => ctx.isDealLead,
        },
      ],
    },
    {
      to: 'under_discussion',
      description: 'Reopen agreed term for further negotiation',
      guards: [
        {
          description: 'Term must not be locked',
          check: (ctx) => !ctx.isLocked,
        },
        {
          description: 'User must be deal lead',
          check: (ctx) => ctx.isDealLead,
        },
      ],
    },
  ],

  locked: [
    // No transitions allowed from locked state without special unlock
    // Unlock would require a separate process/API
  ],
};

/**
 * Get all valid transitions from a given status
 */
export function getValidTransitions(currentStatus: NegotiationStatus): StateTransition[] {
  return NEGOTIATION_STATUS_TRANSITIONS[currentStatus] || [];
}

/**
 * Check if a specific transition is valid given the current context
 */
export function isTransitionValid(
  currentStatus: NegotiationStatus,
  targetStatus: NegotiationStatus,
  context: TransitionContext
): { valid: boolean; reason?: string } {
  // Locked terms cannot transition to anything
  if (context.isLocked && targetStatus !== 'locked') {
    return {
      valid: false,
      reason: 'Term is locked and cannot be modified',
    };
  }

  // Same status is always valid (no-op)
  if (currentStatus === targetStatus) {
    return { valid: true };
  }

  const transitions = NEGOTIATION_STATUS_TRANSITIONS[currentStatus];
  if (!transitions || transitions.length === 0) {
    return {
      valid: false,
      reason: `No transitions allowed from '${currentStatus}' status`,
    };
  }

  const transition = transitions.find((t) => t.to === targetStatus);
  if (!transition) {
    const allowedTargets = transitions.map((t) => t.to).join(', ');
    return {
      valid: false,
      reason: `Cannot transition from '${currentStatus}' to '${targetStatus}'. Allowed transitions: ${allowedTargets}`,
    };
  }

  // Check all guard conditions
  if (transition.guards && transition.guards.length > 0) {
    for (const guard of transition.guards) {
      if (!guard.check(context)) {
        return {
          valid: false,
          reason: `Guard condition not met: ${guard.description}`,
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Get all possible next statuses from the current status
 */
export function getNextStatuses(currentStatus: NegotiationStatus): NegotiationStatus[] {
  const transitions = NEGOTIATION_STATUS_TRANSITIONS[currentStatus] || [];
  return transitions.map((t) => t.to);
}

/**
 * Get human-readable description of a status
 */
export function getStatusDescription(status: NegotiationStatus): string {
  const descriptions: Record<NegotiationStatus, string> = {
    not_started: 'No proposals have been made for this term',
    proposed: 'A proposal has been submitted and awaits response',
    under_discussion: 'The term is being actively discussed by parties',
    pending_approval: 'Discussion complete, awaiting final approval',
    agreed: 'All parties have agreed on the term value',
    locked: 'The term is locked and cannot be modified',
  };
  return descriptions[status];
}

/**
 * Get the display label for a status
 */
export function getStatusLabel(status: NegotiationStatus): string {
  const labels: Record<NegotiationStatus, string> = {
    not_started: 'Not Started',
    proposed: 'Proposed',
    under_discussion: 'Under Discussion',
    pending_approval: 'Pending Approval',
    agreed: 'Agreed',
    locked: 'Locked',
  };
  return labels[status];
}

/**
 * Get the severity/priority of a status for sorting/display
 */
export function getStatusPriority(status: NegotiationStatus): number {
  const priorities: Record<NegotiationStatus, number> = {
    locked: 0,
    agreed: 1,
    pending_approval: 2,
    under_discussion: 3,
    proposed: 4,
    not_started: 5,
  };
  return priorities[status];
}

/**
 * Check if a status indicates the term is finalized
 */
export function isTermFinalized(status: NegotiationStatus): boolean {
  return status === 'agreed' || status === 'locked';
}

/**
 * Check if a status indicates active negotiation
 */
export function isTermInNegotiation(status: NegotiationStatus): boolean {
  return ['proposed', 'under_discussion', 'pending_approval'].includes(status);
}

/**
 * Validate a status transition and throw an error if invalid
 */
export function validateStatusTransition(
  currentStatus: NegotiationStatus,
  targetStatus: NegotiationStatus,
  context: TransitionContext
): void {
  const result = isTransitionValid(currentStatus, targetStatus, context);
  if (!result.valid) {
    throw new InvalidStatusTransitionError(currentStatus, targetStatus, result.reason);
  }
}

/**
 * Custom error class for invalid status transitions
 */
export class InvalidStatusTransitionError extends Error {
  constructor(
    public readonly currentStatus: NegotiationStatus,
    public readonly targetStatus: NegotiationStatus,
    public readonly reason?: string
  ) {
    super(
      reason ||
        `Invalid status transition from '${currentStatus}' to '${targetStatus}'`
    );
    this.name = 'InvalidStatusTransitionError';
  }
}

/**
 * Create a default context for transition validation
 * This provides sensible defaults when full context is not available
 */
export function createDefaultContext(
  overrides: Partial<TransitionContext> = {}
): TransitionContext {
  return {
    isDealLead: false,
    canApprove: false,
    hasPendingProposals: false,
    allPartiesApproved: false,
    isLocked: false,
    negotiationMode: 'proposal_based',
    requireUnanimousConsent: false,
    ...overrides,
  };
}
