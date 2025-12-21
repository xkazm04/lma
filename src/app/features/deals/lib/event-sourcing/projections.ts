/**
 * Event Projections
 *
 * Functions to derive current state from events.
 * Projections are the "read side" of event sourcing - they replay events
 * to reconstruct the current state.
 */

import type {
  NegotiationEvent,
  ProjectedDealState,
  ProjectedTermState,
  ProjectedParticipantState,
  ProjectedProposalState,
  ReplayOptions,
  DealSnapshot,
} from './types';
import type { NegotiationStatus } from '../term-status-state-machine';
import { sortEventsBySequence } from './event-store';

// ============================================
// Deal State Projection
// ============================================

/**
 * Create an initial empty deal state
 */
function createInitialDealState(dealId: string): ProjectedDealState {
  return {
    id: dealId,
    organization_id: '',
    created_by: '',
    deal_name: '',
    description: null,
    deal_type: 'new_facility',
    status: 'draft',
    negotiation_mode: 'proposal_based',
    base_facility_id: null,
    target_close_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    terms: new Map(),
    participants: new Map(),
    proposals: new Map(),
  };
}

/**
 * Apply a single event to the deal state
 */
function applyEvent(state: ProjectedDealState, event: NegotiationEvent): ProjectedDealState {
  // Clone state to maintain immutability
  const newState: ProjectedDealState = {
    ...state,
    terms: new Map(state.terms),
    participants: new Map(state.participants),
    proposals: new Map(state.proposals),
    updated_at: event.timestamp,
  };

  switch (event.type) {
    case 'deal_created': {
      newState.deal_name = event.payload.deal_name;
      newState.deal_type = event.payload.deal_type;
      newState.description = event.payload.description || null;
      newState.negotiation_mode = event.payload.negotiation_mode;
      newState.target_close_date = event.payload.target_close_date || null;
      newState.base_facility_id = event.payload.base_facility_id || null;
      newState.created_by = event.actor_id;
      newState.organization_id = event.actor_organization_id;
      newState.created_at = event.timestamp;

      // Add initial participants if provided
      if (event.payload.initial_participants) {
        for (const p of event.payload.initial_participants) {
          const participantId = `participant-${p.user_id}`;
          newState.participants.set(participantId, {
            id: participantId,
            deal_id: event.deal_id,
            user_id: p.user_id,
            party_name: p.party_name,
            party_type: p.party_type,
            party_role: p.party_type, // Default to party_type as role
            deal_role: p.deal_role,
            can_approve: p.deal_role === 'deal_lead' || p.deal_role === 'negotiator',
            status: 'active',
            joined_at: event.timestamp,
          });
        }
      }
      break;
    }

    case 'deal_status_changed': {
      newState.status = event.payload.new_status;
      break;
    }

    case 'term_created': {
      const newTerm: ProjectedTermState = {
        id: event.payload.term_id,
        deal_id: event.deal_id,
        category_id: event.payload.category_id,
        term_key: event.payload.term_key,
        term_label: event.payload.term_label,
        value_type: event.payload.value_type,
        current_value: event.payload.initial_value,
        current_value_text: event.payload.initial_value_text || null,
        original_value: event.payload.initial_value,
        original_value_text: event.payload.initial_value_text || null,
        negotiation_status: 'not_started',
        is_locked: false,
        display_order: event.payload.display_order,
        deadline: event.payload.deadline || null,
        pending_proposals_count: 0,
        comments_count: 0,
        last_updated_at: event.timestamp,
        last_updated_by: event.actor_id,
      };
      newState.terms.set(event.payload.term_id, newTerm);
      break;
    }

    case 'term_updated': {
      const term = newState.terms.get(event.payload.term_id);
      if (term) {
        newState.terms.set(event.payload.term_id, {
          ...term,
          ...event.payload.changes,
          last_updated_at: event.timestamp,
          last_updated_by: event.actor_id,
        });
      }
      break;
    }

    case 'term_status_changed': {
      const term = newState.terms.get(event.payload.term_id);
      if (term) {
        newState.terms.set(event.payload.term_id, {
          ...term,
          negotiation_status: event.payload.new_status,
          last_updated_at: event.timestamp,
          last_updated_by: event.actor_id,
        });
      }
      break;
    }

    case 'term_locked': {
      const term = newState.terms.get(event.payload.term_id);
      if (term) {
        newState.terms.set(event.payload.term_id, {
          ...term,
          is_locked: true,
          negotiation_status: 'locked',
          current_value: event.payload.final_value,
          current_value_text: event.payload.final_value_text || null,
          last_updated_at: event.timestamp,
          last_updated_by: event.actor_id,
        });
      }
      break;
    }

    case 'term_unlocked': {
      const term = newState.terms.get(event.payload.term_id);
      if (term) {
        newState.terms.set(event.payload.term_id, {
          ...term,
          is_locked: false,
          negotiation_status: 'agreed', // Revert to agreed when unlocked
          last_updated_at: event.timestamp,
          last_updated_by: event.actor_id,
        });
      }
      break;
    }

    case 'proposal_made': {
      const newProposal: ProjectedProposalState = {
        id: event.payload.proposal_id,
        term_id: event.payload.term_id,
        deal_id: event.deal_id,
        proposed_by: event.actor_id,
        proposed_by_party: event.actor_name,
        proposed_at: event.timestamp,
        proposed_value: event.payload.proposed_value,
        proposed_value_text: event.payload.proposed_value_text || null,
        rationale: event.payload.rationale || null,
        status: 'pending',
        responded_by: null,
        responded_at: null,
        response_comment: null,
      };
      newState.proposals.set(event.payload.proposal_id, newProposal);

      // Update term's pending proposals count
      const term = newState.terms.get(event.payload.term_id);
      if (term) {
        newState.terms.set(event.payload.term_id, {
          ...term,
          pending_proposals_count: term.pending_proposals_count + 1,
          last_updated_at: event.timestamp,
          last_updated_by: event.actor_id,
        });
      }
      break;
    }

    case 'counter_proposal_made': {
      // Mark original proposal as superseded
      const originalProposal = newState.proposals.get(event.payload.original_proposal_id);
      if (originalProposal) {
        newState.proposals.set(event.payload.original_proposal_id, {
          ...originalProposal,
          status: 'superseded',
        });
      }

      // Create the counter proposal
      const newProposal: ProjectedProposalState = {
        id: event.payload.proposal_id,
        term_id: event.payload.term_id,
        deal_id: event.deal_id,
        proposed_by: event.actor_id,
        proposed_by_party: event.actor_name,
        proposed_at: event.timestamp,
        proposed_value: event.payload.counter_value,
        proposed_value_text: event.payload.counter_value_text || null,
        rationale: event.payload.rationale || null,
        status: 'pending',
        responded_by: null,
        responded_at: null,
        response_comment: null,
      };
      newState.proposals.set(event.payload.proposal_id, newProposal);

      // Update term - count stays same (superseded one removed, new one added)
      const term = newState.terms.get(event.payload.term_id);
      if (term) {
        newState.terms.set(event.payload.term_id, {
          ...term,
          last_updated_at: event.timestamp,
          last_updated_by: event.actor_id,
        });
      }
      break;
    }

    case 'proposal_accepted': {
      const proposal = newState.proposals.get(event.payload.proposal_id);
      if (proposal) {
        newState.proposals.set(event.payload.proposal_id, {
          ...proposal,
          status: 'accepted',
          responded_by: event.actor_id,
          responded_at: event.timestamp,
          response_comment: event.payload.comment || null,
        });
      }

      // Update term with accepted value
      const term = newState.terms.get(event.payload.term_id);
      if (term) {
        newState.terms.set(event.payload.term_id, {
          ...term,
          current_value: event.payload.accepted_value,
          current_value_text: event.payload.accepted_value_text || null,
          negotiation_status: 'agreed',
          pending_proposals_count: Math.max(0, term.pending_proposals_count - 1),
          last_updated_at: event.timestamp,
          last_updated_by: event.actor_id,
        });
      }
      break;
    }

    case 'proposal_rejected': {
      const proposal = newState.proposals.get(event.payload.proposal_id);
      if (proposal) {
        newState.proposals.set(event.payload.proposal_id, {
          ...proposal,
          status: 'rejected',
          responded_by: event.actor_id,
          responded_at: event.timestamp,
          response_comment: event.payload.reason || null,
        });
      }

      // Update term pending count
      const term = newState.terms.get(event.payload.term_id);
      if (term) {
        newState.terms.set(event.payload.term_id, {
          ...term,
          pending_proposals_count: Math.max(0, term.pending_proposals_count - 1),
          last_updated_at: event.timestamp,
          last_updated_by: event.actor_id,
        });
      }
      break;
    }

    case 'proposal_withdrawn': {
      const proposal = newState.proposals.get(event.payload.proposal_id);
      if (proposal) {
        newState.proposals.set(event.payload.proposal_id, {
          ...proposal,
          status: 'withdrawn',
        });
      }

      // Update term pending count
      const term = newState.terms.get(event.payload.term_id);
      if (term) {
        newState.terms.set(event.payload.term_id, {
          ...term,
          pending_proposals_count: Math.max(0, term.pending_proposals_count - 1),
          last_updated_at: event.timestamp,
          last_updated_by: event.actor_id,
        });
      }
      break;
    }

    case 'proposal_superseded': {
      const proposal = newState.proposals.get(event.payload.proposal_id);
      if (proposal) {
        newState.proposals.set(event.payload.proposal_id, {
          ...proposal,
          status: 'superseded',
        });
      }
      break;
    }

    case 'comment_added': {
      const term = newState.terms.get(event.payload.term_id);
      if (term) {
        newState.terms.set(event.payload.term_id, {
          ...term,
          comments_count: term.comments_count + 1,
          last_updated_at: event.timestamp,
          last_updated_by: event.actor_id,
        });
      }
      break;
    }

    case 'comment_deleted': {
      const term = newState.terms.get(event.payload.term_id);
      if (term) {
        newState.terms.set(event.payload.term_id, {
          ...term,
          comments_count: Math.max(0, term.comments_count - 1),
        });
      }
      break;
    }

    case 'participant_joined': {
      newState.participants.set(event.payload.participant_id, {
        id: event.payload.participant_id,
        deal_id: event.deal_id,
        user_id: event.payload.user_id,
        party_name: event.payload.party_name,
        party_type: event.payload.party_type,
        party_role: event.payload.party_role,
        deal_role: event.payload.deal_role,
        can_approve: event.payload.can_approve,
        status: 'active',
        joined_at: event.timestamp,
      });
      break;
    }

    case 'participant_left': {
      const participant = newState.participants.get(event.payload.participant_id);
      if (participant) {
        newState.participants.set(event.payload.participant_id, {
          ...participant,
          status: 'inactive',
        });
      }
      break;
    }

    case 'participant_role_changed': {
      const participant = newState.participants.get(event.payload.participant_id);
      if (participant) {
        newState.participants.set(event.payload.participant_id, {
          ...participant,
          deal_role: event.payload.new_deal_role,
          can_approve: event.payload.new_can_approve,
        });
      }
      break;
    }

    case 'deadline_set': {
      const term = newState.terms.get(event.payload.term_id);
      if (term) {
        newState.terms.set(event.payload.term_id, {
          ...term,
          deadline: event.payload.deadline,
          last_updated_at: event.timestamp,
          last_updated_by: event.actor_id,
        });
      }
      break;
    }

    case 'deadline_removed': {
      const term = newState.terms.get(event.payload.term_id);
      if (term) {
        newState.terms.set(event.payload.term_id, {
          ...term,
          deadline: null,
          last_updated_at: event.timestamp,
          last_updated_by: event.actor_id,
        });
      }
      break;
    }

    case 'deadline_extended': {
      const term = newState.terms.get(event.payload.term_id);
      if (term) {
        newState.terms.set(event.payload.term_id, {
          ...term,
          deadline: event.payload.new_deadline,
          last_updated_at: event.timestamp,
          last_updated_by: event.actor_id,
        });
      }
      break;
    }

    default:
      // Unknown event type, skip
      break;
  }

  return newState;
}

/**
 * Project deal state from events
 * This is the main projection function
 */
export function projectDealState(
  dealId: string,
  events: NegotiationEvent[],
  options?: ReplayOptions
): ProjectedDealState {
  let state = createInitialDealState(dealId);

  // Sort events by sequence
  let sortedEvents = sortEventsBySequence(events);

  // Apply replay options
  if (options) {
    // Filter by timestamp
    if (options.untilTimestamp) {
      const until = new Date(options.untilTimestamp).getTime();
      sortedEvents = sortedEvents.filter(
        (e) => new Date(e.timestamp).getTime() <= until
      );
    }

    // Filter by sequence
    if (options.untilSequence !== undefined) {
      sortedEvents = sortedEvents.filter((e) => e.sequence <= options.untilSequence!);
    }

    // Filter by term IDs
    if (options.termIds && options.termIds.length > 0) {
      const termIdSet = new Set(options.termIds);
      sortedEvents = sortedEvents.filter((e) => {
        // Always include deal-level events
        if (e.type.startsWith('deal_')) return true;
        // Check if event is related to specified terms
        if ('payload' in e && typeof e.payload === 'object' && e.payload !== null) {
          const payload = e.payload as Record<string, unknown>;
          if ('term_id' in payload && typeof payload.term_id === 'string') {
            return termIdSet.has(payload.term_id);
          }
        }
        return true; // Include events without term_id
      });
    }

    // Filter by event types
    if (options.eventTypes && options.eventTypes.length > 0) {
      const typeSet = new Set(options.eventTypes);
      sortedEvents = sortedEvents.filter((e) => typeSet.has(e.type));
    }

    // Filter by actors
    if (options.actorIds && options.actorIds.length > 0) {
      const actorSet = new Set(options.actorIds);
      sortedEvents = sortedEvents.filter((e) => actorSet.has(e.actor_id));
    }
  }

  // Apply each event in sequence
  for (const event of sortedEvents) {
    state = applyEvent(state, event);
  }

  return state;
}

/**
 * Project deal state from a snapshot and additional events
 * More efficient for large event streams
 */
export function projectFromSnapshot(
  snapshot: DealSnapshot,
  additionalEvents: NegotiationEvent[]
): ProjectedDealState {
  let state = {
    ...snapshot.state,
    terms: new Map(snapshot.state.terms),
    participants: new Map(snapshot.state.participants),
    proposals: new Map(snapshot.state.proposals),
  };

  // Sort and apply only events after the snapshot
  const sortedEvents = sortEventsBySequence(
    additionalEvents.filter((e) => e.sequence > snapshot.sequence)
  );

  for (const event of sortedEvents) {
    state = applyEvent(state, event);
  }

  return state;
}

/**
 * Get term history from events
 * Returns an array of term states at different points in time
 */
export function getTermHistory(
  termId: string,
  events: NegotiationEvent[]
): Array<{ timestamp: string; sequence: number; state: ProjectedTermState }> {
  const history: Array<{ timestamp: string; sequence: number; state: ProjectedTermState }> = [];

  // Filter to term-related events
  const termEvents = events.filter((e) => {
    if ('payload' in e && typeof e.payload === 'object' && e.payload !== null) {
      const payload = e.payload as Record<string, unknown>;
      return 'term_id' in payload && payload.term_id === termId;
    }
    return false;
  });

  // Sort by sequence
  const sortedEvents = sortEventsBySequence(termEvents);

  // Build history by applying events incrementally
  let currentState: ProjectedTermState | null = null;

  for (const event of sortedEvents) {
    if (event.type === 'term_created') {
      currentState = {
        id: event.payload.term_id,
        deal_id: event.deal_id,
        category_id: event.payload.category_id,
        term_key: event.payload.term_key,
        term_label: event.payload.term_label,
        value_type: event.payload.value_type,
        current_value: event.payload.initial_value,
        current_value_text: event.payload.initial_value_text || null,
        original_value: event.payload.initial_value,
        original_value_text: event.payload.initial_value_text || null,
        negotiation_status: 'not_started',
        is_locked: false,
        display_order: event.payload.display_order,
        deadline: event.payload.deadline || null,
        pending_proposals_count: 0,
        comments_count: 0,
        last_updated_at: event.timestamp,
        last_updated_by: event.actor_id,
      };
    } else if (currentState) {
      // Apply event to current state
      currentState = applyTermEvent(currentState, event);
    }

    if (currentState) {
      history.push({
        timestamp: event.timestamp,
        sequence: event.sequence,
        state: { ...currentState },
      });
    }
  }

  return history;
}

/**
 * Apply an event to a term state
 */
function applyTermEvent(
  state: ProjectedTermState,
  event: NegotiationEvent
): ProjectedTermState {
  const newState = { ...state, last_updated_at: event.timestamp, last_updated_by: event.actor_id };

  switch (event.type) {
    case 'term_status_changed':
      newState.negotiation_status = event.payload.new_status;
      break;
    case 'term_locked':
      newState.is_locked = true;
      newState.negotiation_status = 'locked';
      newState.current_value = event.payload.final_value;
      newState.current_value_text = event.payload.final_value_text || null;
      break;
    case 'term_unlocked':
      newState.is_locked = false;
      newState.negotiation_status = 'agreed';
      break;
    case 'proposal_made':
      newState.pending_proposals_count++;
      break;
    case 'proposal_accepted':
      newState.current_value = event.payload.accepted_value;
      newState.current_value_text = event.payload.accepted_value_text || null;
      newState.negotiation_status = 'agreed';
      newState.pending_proposals_count = Math.max(0, newState.pending_proposals_count - 1);
      break;
    case 'proposal_rejected':
    case 'proposal_withdrawn':
      newState.pending_proposals_count = Math.max(0, newState.pending_proposals_count - 1);
      break;
    case 'comment_added':
      newState.comments_count++;
      break;
    case 'comment_deleted':
      newState.comments_count = Math.max(0, newState.comments_count - 1);
      break;
    case 'deadline_set':
      newState.deadline = event.payload.deadline;
      break;
    case 'deadline_removed':
      newState.deadline = null;
      break;
    case 'deadline_extended':
      newState.deadline = event.payload.new_deadline;
      break;
    default:
      break;
  }

  return newState;
}

/**
 * Calculate deal statistics from projected state
 */
export function calculateDealStats(state: ProjectedDealState): {
  total_terms: number;
  agreed_terms: number;
  locked_terms: number;
  pending_proposals: number;
  participant_count: number;
  active_participants: number;
} {
  let agreed_terms = 0;
  let locked_terms = 0;
  let pending_proposals = 0;
  let active_participants = 0;

  Array.from(state.terms.values()).forEach((term) => {
    if (term.negotiation_status === 'agreed') agreed_terms++;
    if (term.is_locked || term.negotiation_status === 'locked') locked_terms++;
    pending_proposals += term.pending_proposals_count;
  });

  Array.from(state.participants.values()).forEach((participant) => {
    if (participant.status === 'active') active_participants++;
  });

  return {
    total_terms: state.terms.size,
    agreed_terms,
    locked_terms,
    pending_proposals,
    participant_count: state.participants.size,
    active_participants,
  };
}
