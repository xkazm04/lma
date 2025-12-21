/**
 * Event Store Implementation
 *
 * In-memory event store with optional persistence hooks.
 * This implementation provides the core event sourcing functionality
 * for negotiation timelines.
 */

import type {
  NegotiationEvent,
  NegotiationEventType,
  EventStore,
  SnapshotStore,
  DealSnapshot,
  ProjectedDealState,
  BaseNegotiationEvent,
  PartyType,
} from './types';

// ============================================
// In-Memory Event Store
// ============================================

/**
 * In-memory event store implementation
 * Used for client-side state management and testing
 */
export class InMemoryEventStore implements EventStore {
  private events: Map<string, NegotiationEvent[]> = new Map();
  private sequences: Map<string, number> = new Map();

  async append(events: NegotiationEvent[]): Promise<void> {
    for (const event of events) {
      const dealEvents = this.events.get(event.deal_id) || [];
      dealEvents.push(event);
      this.events.set(event.deal_id, dealEvents);

      const currentSeq = this.sequences.get(event.deal_id) || 0;
      this.sequences.set(event.deal_id, Math.max(currentSeq, event.sequence));
    }
  }

  async getEvents(dealId: string): Promise<NegotiationEvent[]> {
    return this.events.get(dealId) || [];
  }

  async getEventsFrom(dealId: string, fromSequence: number): Promise<NegotiationEvent[]> {
    const events = this.events.get(dealId) || [];
    return events.filter((e) => e.sequence >= fromSequence);
  }

  async getEventsUntil(dealId: string, untilTimestamp: string): Promise<NegotiationEvent[]> {
    const events = this.events.get(dealId) || [];
    const until = new Date(untilTimestamp).getTime();
    return events.filter((e) => new Date(e.timestamp).getTime() <= until);
  }

  async getTermEvents(dealId: string, termId: string): Promise<NegotiationEvent[]> {
    const events = this.events.get(dealId) || [];
    return events.filter((e) => {
      // Check if event has a term_id in its payload
      if ('payload' in e && typeof e.payload === 'object' && e.payload !== null) {
        return 'term_id' in e.payload && e.payload.term_id === termId;
      }
      return false;
    });
  }

  async getLatestSequence(dealId: string): Promise<number> {
    return this.sequences.get(dealId) || 0;
  }

  /** Clear all events (useful for testing) */
  clear(): void {
    this.events.clear();
    this.sequences.clear();
  }

  /** Get all deal IDs in the store */
  getDealIds(): string[] {
    return Array.from(this.events.keys());
  }
}

// ============================================
// In-Memory Snapshot Store
// ============================================

/**
 * In-memory snapshot store implementation
 */
export class InMemorySnapshotStore implements SnapshotStore {
  private snapshots: Map<string, DealSnapshot[]> = new Map();

  async save(snapshot: DealSnapshot): Promise<void> {
    const dealSnapshots = this.snapshots.get(snapshot.deal_id) || [];
    dealSnapshots.push(snapshot);
    // Keep only the latest 10 snapshots per deal
    if (dealSnapshots.length > 10) {
      dealSnapshots.shift();
    }
    this.snapshots.set(snapshot.deal_id, dealSnapshots);
  }

  async getLatest(dealId: string): Promise<DealSnapshot | null> {
    const dealSnapshots = this.snapshots.get(dealId) || [];
    return dealSnapshots.length > 0 ? dealSnapshots[dealSnapshots.length - 1] : null;
  }

  async getAtSequence(dealId: string, sequence: number): Promise<DealSnapshot | null> {
    const dealSnapshots = this.snapshots.get(dealId) || [];
    // Find the latest snapshot at or before the given sequence
    for (let i = dealSnapshots.length - 1; i >= 0; i--) {
      if (dealSnapshots[i].sequence <= sequence) {
        return dealSnapshots[i];
      }
    }
    return null;
  }

  /** Clear all snapshots (useful for testing) */
  clear(): void {
    this.snapshots.clear();
  }
}

// ============================================
// Event Factory
// ============================================

let eventIdCounter = 0;

/**
 * Generate a unique event ID
 */
export function generateEventId(): string {
  eventIdCounter++;
  return `evt-${Date.now()}-${eventIdCounter}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a base event with common fields
 */
export function createBaseEvent(
  type: NegotiationEventType,
  dealId: string,
  sequence: number,
  actor: {
    id: string;
    name: string;
    partyType: PartyType;
    organizationId: string;
  },
  options?: {
    correlationId?: string;
    causationId?: string;
    metadata?: Record<string, unknown>;
  }
): BaseNegotiationEvent {
  return {
    id: generateEventId(),
    type,
    deal_id: dealId,
    sequence,
    timestamp: new Date().toISOString(),
    actor_id: actor.id,
    actor_name: actor.name,
    actor_party_type: actor.partyType,
    actor_organization_id: actor.organizationId,
    version: 1,
    correlation_id: options?.correlationId,
    causation_id: options?.causationId,
    metadata: options?.metadata,
  };
}

// ============================================
// Event Helpers
// ============================================

/**
 * Sort events by sequence number
 */
export function sortEventsBySequence(events: NegotiationEvent[]): NegotiationEvent[] {
  return [...events].sort((a, b) => a.sequence - b.sequence);
}

/**
 * Sort events by timestamp
 */
export function sortEventsByTimestamp(events: NegotiationEvent[]): NegotiationEvent[] {
  return [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

/**
 * Filter events by type
 */
export function filterEventsByType(
  events: NegotiationEvent[],
  types: NegotiationEventType[]
): NegotiationEvent[] {
  return events.filter((e) => types.includes(e.type));
}

/**
 * Filter events by actor
 */
export function filterEventsByActor(
  events: NegotiationEvent[],
  actorIds: string[]
): NegotiationEvent[] {
  return events.filter((e) => actorIds.includes(e.actor_id));
}

/**
 * Group events by term
 */
export function groupEventsByTerm(
  events: NegotiationEvent[]
): Map<string, NegotiationEvent[]> {
  const grouped = new Map<string, NegotiationEvent[]>();

  for (const event of events) {
    if ('payload' in event && typeof event.payload === 'object' && event.payload !== null) {
      const payload = event.payload as Record<string, unknown>;
      if ('term_id' in payload && typeof payload.term_id === 'string') {
        const termId = payload.term_id;
        const termEvents = grouped.get(termId) || [];
        termEvents.push(event);
        grouped.set(termId, termEvents);
      }
    }
  }

  return grouped;
}

/**
 * Get event description for display
 */
export function getEventDescription(event: NegotiationEvent): string {
  switch (event.type) {
    case 'deal_created':
      return `Created deal "${event.payload.deal_name}"`;
    case 'deal_status_changed':
      return `Changed deal status from ${event.payload.previous_status} to ${event.payload.new_status}`;
    case 'term_created':
      return `Added term "${event.payload.term_label}"`;
    case 'term_status_changed':
      return `Changed "${event.payload.term_label}" status to ${event.payload.new_status}`;
    case 'term_locked':
      return `Locked term "${event.payload.term_label}"`;
    case 'term_unlocked':
      return `Unlocked term "${event.payload.term_label}"`;
    case 'proposal_made':
      return `Proposed ${event.payload.proposed_value_text || String(event.payload.proposed_value)} for "${event.payload.term_label}"`;
    case 'proposal_accepted':
      return `Accepted proposal for "${event.payload.term_label}"`;
    case 'proposal_rejected':
      return `Rejected proposal for "${event.payload.term_label}"`;
    case 'proposal_withdrawn':
      return `Withdrew proposal for "${event.payload.term_label}"`;
    case 'counter_proposal_made':
      return `Counter-proposed ${event.payload.counter_value_text || String(event.payload.counter_value)} for "${event.payload.term_label}"`;
    case 'comment_added':
      return `Added comment on "${event.payload.term_label}"`;
    case 'comment_resolved':
      return `Resolved comment on "${event.payload.term_label}"`;
    case 'participant_joined':
      return `${event.payload.party_name} joined as ${event.payload.deal_role}`;
    case 'participant_left':
      return `${event.payload.party_name} left the deal`;
    case 'deadline_set':
      return `Set deadline for "${event.payload.term_label}"`;
    case 'deadline_extended':
      return `Extended deadline for "${event.payload.term_label}"`;
    default:
      return `Unknown event: ${event.type}`;
  }
}

/**
 * Get event category for grouping/filtering
 */
export function getEventCategory(
  eventType: NegotiationEventType
): 'deal' | 'term' | 'proposal' | 'comment' | 'participant' | 'deadline' {
  if (eventType.startsWith('deal_')) return 'deal';
  if (eventType.startsWith('term_')) return 'term';
  if (eventType.startsWith('proposal_') || eventType === 'counter_proposal_made') return 'proposal';
  if (eventType.startsWith('comment_')) return 'comment';
  if (eventType.startsWith('participant_')) return 'participant';
  if (eventType.startsWith('deadline_')) return 'deadline';
  return 'deal';
}

/**
 * Check if an event is related to a specific term
 */
export function isTermEvent(event: NegotiationEvent, termId: string): boolean {
  if ('payload' in event && typeof event.payload === 'object' && event.payload !== null) {
    const payload = event.payload as Record<string, unknown>;
    return 'term_id' in payload && payload.term_id === termId;
  }
  return false;
}
