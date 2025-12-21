/**
 * Event Sourcing Types for Negotiation Timeline
 *
 * This module defines the event types and interfaces for event-sourced negotiation.
 * Every action in the negotiation becomes an immutable event, and the current state
 * is derived (projected) from replaying these events.
 */

import type { NegotiationStatus } from '../term-status-state-machine';

// ============================================
// Base Event Types
// ============================================

export type NegotiationEventType =
  | 'deal_created'
  | 'deal_status_changed'
  | 'term_created'
  | 'term_updated'
  | 'term_status_changed'
  | 'term_locked'
  | 'term_unlocked'
  | 'proposal_made'
  | 'proposal_accepted'
  | 'proposal_rejected'
  | 'proposal_withdrawn'
  | 'proposal_superseded'
  | 'counter_proposal_made'
  | 'comment_added'
  | 'comment_resolved'
  | 'comment_deleted'
  | 'participant_joined'
  | 'participant_left'
  | 'participant_role_changed'
  | 'deadline_set'
  | 'deadline_removed'
  | 'deadline_extended';

export type PartyType = 'borrower_side' | 'lender_side' | 'third_party';

export type DealRole = 'deal_lead' | 'negotiator' | 'reviewer' | 'observer';

/**
 * Base interface for all negotiation events
 */
export interface BaseNegotiationEvent {
  /** Unique event ID (UUID) */
  id: string;
  /** Event type discriminator */
  type: NegotiationEventType;
  /** Aggregate root ID (deal_id) */
  deal_id: string;
  /** Event sequence number within the aggregate */
  sequence: number;
  /** ISO timestamp of when the event occurred */
  timestamp: string;
  /** ID of the actor who triggered the event */
  actor_id: string;
  /** Name of the actor for display purposes */
  actor_name: string;
  /** Party type of the actor */
  actor_party_type: PartyType;
  /** Organization ID of the actor */
  actor_organization_id: string;
  /** Optional correlation ID for related events */
  correlation_id?: string;
  /** Optional causation ID (the event that caused this event) */
  causation_id?: string;
  /** Event version for schema evolution */
  version: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

// ============================================
// Deal Events
// ============================================

export interface DealCreatedEvent extends BaseNegotiationEvent {
  type: 'deal_created';
  payload: {
    deal_name: string;
    deal_type: 'new_facility' | 'amendment' | 'refinancing' | 'extension' | 'consent' | 'waiver';
    description?: string;
    negotiation_mode: 'collaborative' | 'proposal_based';
    target_close_date?: string;
    base_facility_id?: string;
    initial_participants?: Array<{
      user_id: string;
      party_name: string;
      party_type: PartyType;
      deal_role: DealRole;
    }>;
  };
}

export interface DealStatusChangedEvent extends BaseNegotiationEvent {
  type: 'deal_status_changed';
  payload: {
    previous_status: 'draft' | 'active' | 'paused' | 'agreed' | 'closed' | 'terminated';
    new_status: 'draft' | 'active' | 'paused' | 'agreed' | 'closed' | 'terminated';
    reason?: string;
  };
}

// ============================================
// Term Events
// ============================================

export interface TermCreatedEvent extends BaseNegotiationEvent {
  type: 'term_created';
  payload: {
    term_id: string;
    category_id: string;
    term_key: string;
    term_label: string;
    value_type: string;
    initial_value: unknown;
    initial_value_text?: string;
    display_order: number;
    deadline?: string;
  };
}

export interface TermUpdatedEvent extends BaseNegotiationEvent {
  type: 'term_updated';
  payload: {
    term_id: string;
    changes: Partial<{
      term_label: string;
      value_type: string;
      display_order: number;
    }>;
  };
}

export interface TermStatusChangedEvent extends BaseNegotiationEvent {
  type: 'term_status_changed';
  payload: {
    term_id: string;
    term_label: string;
    previous_status: NegotiationStatus;
    new_status: NegotiationStatus;
    reason?: string;
  };
}

export interface TermLockedEvent extends BaseNegotiationEvent {
  type: 'term_locked';
  payload: {
    term_id: string;
    term_label: string;
    final_value: unknown;
    final_value_text?: string;
    reason?: string;
  };
}

export interface TermUnlockedEvent extends BaseNegotiationEvent {
  type: 'term_unlocked';
  payload: {
    term_id: string;
    term_label: string;
    reason: string;
    approved_by: string[];
  };
}

// ============================================
// Proposal Events
// ============================================

export interface ProposalMadeEvent extends BaseNegotiationEvent {
  type: 'proposal_made';
  payload: {
    proposal_id: string;
    term_id: string;
    term_label: string;
    previous_value: unknown;
    previous_value_text?: string;
    proposed_value: unknown;
    proposed_value_text?: string;
    rationale?: string;
  };
}

export interface ProposalAcceptedEvent extends BaseNegotiationEvent {
  type: 'proposal_accepted';
  payload: {
    proposal_id: string;
    term_id: string;
    term_label: string;
    accepted_value: unknown;
    accepted_value_text?: string;
    comment?: string;
  };
}

export interface ProposalRejectedEvent extends BaseNegotiationEvent {
  type: 'proposal_rejected';
  payload: {
    proposal_id: string;
    term_id: string;
    term_label: string;
    rejected_value: unknown;
    rejected_value_text?: string;
    reason?: string;
  };
}

export interface ProposalWithdrawnEvent extends BaseNegotiationEvent {
  type: 'proposal_withdrawn';
  payload: {
    proposal_id: string;
    term_id: string;
    term_label: string;
    reason?: string;
  };
}

export interface ProposalSupersededEvent extends BaseNegotiationEvent {
  type: 'proposal_superseded';
  payload: {
    proposal_id: string;
    term_id: string;
    term_label: string;
    superseded_by_proposal_id: string;
  };
}

export interface CounterProposalMadeEvent extends BaseNegotiationEvent {
  type: 'counter_proposal_made';
  payload: {
    proposal_id: string;
    term_id: string;
    term_label: string;
    original_proposal_id: string;
    previous_value: unknown;
    previous_value_text?: string;
    counter_value: unknown;
    counter_value_text?: string;
    rationale?: string;
  };
}

// ============================================
// Comment Events
// ============================================

export interface CommentAddedEvent extends BaseNegotiationEvent {
  type: 'comment_added';
  payload: {
    comment_id: string;
    term_id: string;
    term_label: string;
    proposal_id?: string;
    parent_comment_id?: string;
    content: string;
    is_internal: boolean;
  };
}

export interface CommentResolvedEvent extends BaseNegotiationEvent {
  type: 'comment_resolved';
  payload: {
    comment_id: string;
    term_id: string;
    term_label: string;
    resolved_by: string;
  };
}

export interface CommentDeletedEvent extends BaseNegotiationEvent {
  type: 'comment_deleted';
  payload: {
    comment_id: string;
    term_id: string;
    term_label: string;
    reason?: string;
  };
}

// ============================================
// Participant Events
// ============================================

export interface ParticipantJoinedEvent extends BaseNegotiationEvent {
  type: 'participant_joined';
  payload: {
    participant_id: string;
    user_id: string;
    party_name: string;
    party_type: PartyType;
    party_role: string;
    deal_role: DealRole;
    can_approve: boolean;
    invited_by?: string;
  };
}

export interface ParticipantLeftEvent extends BaseNegotiationEvent {
  type: 'participant_left';
  payload: {
    participant_id: string;
    user_id: string;
    party_name: string;
    reason?: string;
    removed_by?: string;
  };
}

export interface ParticipantRoleChangedEvent extends BaseNegotiationEvent {
  type: 'participant_role_changed';
  payload: {
    participant_id: string;
    user_id: string;
    party_name: string;
    previous_deal_role: DealRole;
    new_deal_role: DealRole;
    previous_can_approve: boolean;
    new_can_approve: boolean;
  };
}

// ============================================
// Deadline Events
// ============================================

export interface DeadlineSetEvent extends BaseNegotiationEvent {
  type: 'deadline_set';
  payload: {
    term_id: string;
    term_label: string;
    deadline: string;
    reason?: string;
  };
}

export interface DeadlineRemovedEvent extends BaseNegotiationEvent {
  type: 'deadline_removed';
  payload: {
    term_id: string;
    term_label: string;
    previous_deadline: string;
    reason?: string;
  };
}

export interface DeadlineExtendedEvent extends BaseNegotiationEvent {
  type: 'deadline_extended';
  payload: {
    term_id: string;
    term_label: string;
    previous_deadline: string;
    new_deadline: string;
    reason?: string;
  };
}

// ============================================
// Union Type for All Events
// ============================================

export type NegotiationEvent =
  | DealCreatedEvent
  | DealStatusChangedEvent
  | TermCreatedEvent
  | TermUpdatedEvent
  | TermStatusChangedEvent
  | TermLockedEvent
  | TermUnlockedEvent
  | ProposalMadeEvent
  | ProposalAcceptedEvent
  | ProposalRejectedEvent
  | ProposalWithdrawnEvent
  | ProposalSupersededEvent
  | CounterProposalMadeEvent
  | CommentAddedEvent
  | CommentResolvedEvent
  | CommentDeletedEvent
  | ParticipantJoinedEvent
  | ParticipantLeftEvent
  | ParticipantRoleChangedEvent
  | DeadlineSetEvent
  | DeadlineRemovedEvent
  | DeadlineExtendedEvent;

// ============================================
// Projected State Types
// ============================================

/**
 * Projected term state derived from events
 */
export interface ProjectedTermState {
  id: string;
  deal_id: string;
  category_id: string;
  term_key: string;
  term_label: string;
  value_type: string;
  current_value: unknown;
  current_value_text: string | null;
  original_value: unknown;
  original_value_text: string | null;
  negotiation_status: NegotiationStatus;
  is_locked: boolean;
  display_order: number;
  deadline: string | null;
  pending_proposals_count: number;
  comments_count: number;
  last_updated_at: string;
  last_updated_by: string;
}

/**
 * Projected participant state derived from events
 */
export interface ProjectedParticipantState {
  id: string;
  deal_id: string;
  user_id: string;
  party_name: string;
  party_type: PartyType;
  party_role: string;
  deal_role: DealRole;
  can_approve: boolean;
  status: 'invited' | 'active' | 'inactive';
  joined_at: string | null;
}

/**
 * Projected proposal state derived from events
 */
export interface ProjectedProposalState {
  id: string;
  term_id: string;
  deal_id: string;
  proposed_by: string;
  proposed_by_party: string;
  proposed_at: string;
  proposed_value: unknown;
  proposed_value_text: string | null;
  rationale: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'superseded' | 'withdrawn';
  responded_by: string | null;
  responded_at: string | null;
  response_comment: string | null;
}

/**
 * Projected deal state derived from events
 */
export interface ProjectedDealState {
  id: string;
  organization_id: string;
  created_by: string;
  deal_name: string;
  description: string | null;
  deal_type: 'new_facility' | 'amendment' | 'refinancing' | 'extension' | 'consent' | 'waiver';
  status: 'draft' | 'active' | 'paused' | 'agreed' | 'closed' | 'terminated';
  negotiation_mode: 'collaborative' | 'proposal_based';
  base_facility_id: string | null;
  target_close_date: string | null;
  created_at: string;
  updated_at: string;
  terms: Map<string, ProjectedTermState>;
  participants: Map<string, ProjectedParticipantState>;
  proposals: Map<string, ProjectedProposalState>;
}

// ============================================
// Event Store Types
// ============================================

/**
 * Event store interface for persisting and retrieving events
 */
export interface EventStore {
  /** Append events to the store */
  append(events: NegotiationEvent[]): Promise<void>;

  /** Get all events for a deal */
  getEvents(dealId: string): Promise<NegotiationEvent[]>;

  /** Get events for a deal from a specific sequence number */
  getEventsFrom(dealId: string, fromSequence: number): Promise<NegotiationEvent[]>;

  /** Get events for a deal up to a specific timestamp (for time travel) */
  getEventsUntil(dealId: string, untilTimestamp: string): Promise<NegotiationEvent[]>;

  /** Get events for a specific term */
  getTermEvents(dealId: string, termId: string): Promise<NegotiationEvent[]>;

  /** Get the latest sequence number for a deal */
  getLatestSequence(dealId: string): Promise<number>;
}

/**
 * Snapshot for optimized state reconstruction
 */
export interface DealSnapshot {
  deal_id: string;
  sequence: number;
  timestamp: string;
  state: ProjectedDealState;
}

/**
 * Snapshot store interface
 */
export interface SnapshotStore {
  /** Save a snapshot */
  save(snapshot: DealSnapshot): Promise<void>;

  /** Get the latest snapshot for a deal */
  getLatest(dealId: string): Promise<DealSnapshot | null>;

  /** Get a snapshot at or before a specific sequence */
  getAtSequence(dealId: string, sequence: number): Promise<DealSnapshot | null>;
}

// ============================================
// Time Travel Types
// ============================================

/**
 * Options for replaying events
 */
export interface ReplayOptions {
  /** Replay up to this timestamp */
  untilTimestamp?: string;
  /** Replay up to this sequence number */
  untilSequence?: number;
  /** Filter to specific term IDs */
  termIds?: string[];
  /** Filter to specific event types */
  eventTypes?: NegotiationEventType[];
  /** Include only events from specific actors */
  actorIds?: string[];
}

/**
 * Time travel state with navigation
 */
export interface TimeTravelState {
  /** Current replay position (timestamp) */
  currentTimestamp: string;
  /** Current sequence number */
  currentSequence: number;
  /** Projected state at current position */
  projectedState: ProjectedDealState;
  /** Whether we're at the latest state */
  isAtLatest: boolean;
  /** Total number of events */
  totalEvents: number;
}

/**
 * What-if scenario for simulating changes
 */
export interface WhatIfScenario {
  id: string;
  name: string;
  description: string;
  /** Base state to start from */
  baseSequence: number;
  /** Hypothetical events to apply */
  hypotheticalEvents: NegotiationEvent[];
  /** Resulting projected state */
  resultingState: ProjectedDealState;
  created_at: string;
  created_by: string;
}
