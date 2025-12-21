/**
 * Time Travel and Replay Utilities
 *
 * Enables navigating through negotiation history, replaying scenarios,
 * and simulating "what-if" changes.
 */

import type {
  NegotiationEvent,
  ProjectedDealState,
  TimeTravelState,
  WhatIfScenario,
  ReplayOptions,
} from './types';
import { projectDealState, projectFromSnapshot } from './projections';
import { sortEventsBySequence, sortEventsByTimestamp } from './event-store';

// ============================================
// Time Travel Controller
// ============================================

/**
 * Time travel controller for navigating event history
 */
export class TimeTravelController {
  private events: NegotiationEvent[];
  private dealId: string;
  private currentSequence: number;
  private maxSequence: number;

  constructor(dealId: string, events: NegotiationEvent[]) {
    this.dealId = dealId;
    this.events = sortEventsBySequence(events);
    this.maxSequence = this.events.length > 0
      ? this.events[this.events.length - 1].sequence
      : 0;
    this.currentSequence = this.maxSequence;
  }

  /**
   * Get the current time travel state
   */
  getState(): TimeTravelState {
    const currentEvent = this.events.find((e) => e.sequence === this.currentSequence);
    const projectedState = projectDealState(this.dealId, this.events, {
      untilSequence: this.currentSequence,
    });

    return {
      currentTimestamp: currentEvent?.timestamp || new Date().toISOString(),
      currentSequence: this.currentSequence,
      projectedState,
      isAtLatest: this.currentSequence >= this.maxSequence,
      totalEvents: this.events.length,
    };
  }

  /**
   * Jump to a specific sequence number
   */
  goToSequence(sequence: number): TimeTravelState {
    this.currentSequence = Math.max(0, Math.min(sequence, this.maxSequence));
    return this.getState();
  }

  /**
   * Jump to a specific timestamp
   */
  goToTimestamp(timestamp: string): TimeTravelState {
    const targetTime = new Date(timestamp).getTime();

    // Find the last event at or before the target timestamp
    const sortedByTime = sortEventsByTimestamp(this.events);
    let targetSequence = 0;

    for (const event of sortedByTime) {
      if (new Date(event.timestamp).getTime() <= targetTime) {
        targetSequence = event.sequence;
      } else {
        break;
      }
    }

    return this.goToSequence(targetSequence);
  }

  /**
   * Move to the next event
   */
  stepForward(): TimeTravelState {
    const nextEvent = this.events.find((e) => e.sequence > this.currentSequence);
    if (nextEvent) {
      this.currentSequence = nextEvent.sequence;
    }
    return this.getState();
  }

  /**
   * Move to the previous event
   */
  stepBackward(): TimeTravelState {
    const prevEvents = this.events.filter((e) => e.sequence < this.currentSequence);
    if (prevEvents.length > 0) {
      this.currentSequence = prevEvents[prevEvents.length - 1].sequence;
    }
    return this.getState();
  }

  /**
   * Jump to the latest state
   */
  goToLatest(): TimeTravelState {
    this.currentSequence = this.maxSequence;
    return this.getState();
  }

  /**
   * Jump to the beginning
   */
  goToStart(): TimeTravelState {
    this.currentSequence = this.events.length > 0 ? this.events[0].sequence : 0;
    return this.getState();
  }

  /**
   * Get events within a time range
   */
  getEventsInRange(startTimestamp: string, endTimestamp: string): NegotiationEvent[] {
    const start = new Date(startTimestamp).getTime();
    const end = new Date(endTimestamp).getTime();

    return this.events.filter((e) => {
      const time = new Date(e.timestamp).getTime();
      return time >= start && time <= end;
    });
  }

  /**
   * Get the position as a percentage (0-100)
   */
  getPositionPercent(): number {
    if (this.maxSequence === 0) return 100;
    const minSequence = this.events.length > 0 ? this.events[0].sequence : 0;
    return ((this.currentSequence - minSequence) / (this.maxSequence - minSequence)) * 100;
  }

  /**
   * Jump to a percentage position
   */
  goToPercent(percent: number): TimeTravelState {
    const minSequence = this.events.length > 0 ? this.events[0].sequence : 0;
    const targetSequence = Math.round(
      minSequence + ((this.maxSequence - minSequence) * percent) / 100
    );

    // Find the closest actual sequence
    const closest = this.events.reduce((prev, curr) => {
      return Math.abs(curr.sequence - targetSequence) < Math.abs(prev.sequence - targetSequence)
        ? curr
        : prev;
    }, this.events[0]);

    return this.goToSequence(closest?.sequence || 0);
  }
}

// ============================================
// What-If Scenario Engine
// ============================================

/**
 * Create a what-if scenario by applying hypothetical events
 */
export function createWhatIfScenario(
  baseState: ProjectedDealState,
  baseSequence: number,
  hypotheticalEvents: NegotiationEvent[],
  options: {
    id?: string;
    name: string;
    description: string;
    createdBy: string;
  }
): WhatIfScenario {
  // Apply hypothetical events to the base state
  let state = {
    ...baseState,
    terms: new Map(baseState.terms),
    participants: new Map(baseState.participants),
    proposals: new Map(baseState.proposals),
  };

  // Replay with hypothetical events
  const allEvents = sortEventsBySequence(hypotheticalEvents);
  state = projectDealState(baseState.id, allEvents);

  return {
    id: options.id || `scenario-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name: options.name,
    description: options.description,
    baseSequence,
    hypotheticalEvents,
    resultingState: state,
    created_at: new Date().toISOString(),
    created_by: options.createdBy,
  };
}

/**
 * Compare two deal states
 */
export function compareStates(
  state1: ProjectedDealState,
  state2: ProjectedDealState
): {
  termChanges: Array<{
    term_id: string;
    term_label: string;
    field: string;
    before: unknown;
    after: unknown;
  }>;
  participantChanges: Array<{
    participant_id: string;
    party_name: string;
    change: 'added' | 'removed' | 'modified';
    details?: string;
  }>;
  proposalChanges: Array<{
    proposal_id: string;
    change: 'added' | 'status_changed';
    details: string;
  }>;
} {
  const termChanges: Array<{
    term_id: string;
    term_label: string;
    field: string;
    before: unknown;
    after: unknown;
  }> = [];

  const participantChanges: Array<{
    participant_id: string;
    party_name: string;
    change: 'added' | 'removed' | 'modified';
    details?: string;
  }> = [];

  const proposalChanges: Array<{
    proposal_id: string;
    change: 'added' | 'status_changed';
    details: string;
  }> = [];

  // Compare terms
  const allTermIds = new Set([
    ...Array.from(state1.terms.keys()),
    ...Array.from(state2.terms.keys()),
  ]);

  Array.from(allTermIds).forEach((termId) => {
    const term1 = state1.terms.get(termId);
    const term2 = state2.terms.get(termId);

    if (!term1 && term2) {
      termChanges.push({
        term_id: termId,
        term_label: term2.term_label,
        field: 'existence',
        before: null,
        after: 'created',
      });
    } else if (term1 && !term2) {
      termChanges.push({
        term_id: termId,
        term_label: term1.term_label,
        field: 'existence',
        before: 'existed',
        after: null,
      });
    } else if (term1 && term2) {
      // Compare fields
      if (JSON.stringify(term1.current_value) !== JSON.stringify(term2.current_value)) {
        termChanges.push({
          term_id: termId,
          term_label: term1.term_label,
          field: 'current_value',
          before: term1.current_value_text || term1.current_value,
          after: term2.current_value_text || term2.current_value,
        });
      }
      if (term1.negotiation_status !== term2.negotiation_status) {
        termChanges.push({
          term_id: termId,
          term_label: term1.term_label,
          field: 'negotiation_status',
          before: term1.negotiation_status,
          after: term2.negotiation_status,
        });
      }
      if (term1.is_locked !== term2.is_locked) {
        termChanges.push({
          term_id: termId,
          term_label: term1.term_label,
          field: 'is_locked',
          before: term1.is_locked,
          after: term2.is_locked,
        });
      }
      if (term1.deadline !== term2.deadline) {
        termChanges.push({
          term_id: termId,
          term_label: term1.term_label,
          field: 'deadline',
          before: term1.deadline,
          after: term2.deadline,
        });
      }
    }
  });

  // Compare participants
  const allParticipantIds = new Set([
    ...Array.from(state1.participants.keys()),
    ...Array.from(state2.participants.keys()),
  ]);

  Array.from(allParticipantIds).forEach((participantId) => {
    const p1 = state1.participants.get(participantId);
    const p2 = state2.participants.get(participantId);

    if (!p1 && p2) {
      participantChanges.push({
        participant_id: participantId,
        party_name: p2.party_name,
        change: 'added',
      });
    } else if (p1 && !p2) {
      participantChanges.push({
        participant_id: participantId,
        party_name: p1.party_name,
        change: 'removed',
      });
    } else if (p1 && p2) {
      if (p1.status !== p2.status || p1.deal_role !== p2.deal_role) {
        participantChanges.push({
          participant_id: participantId,
          party_name: p1.party_name,
          change: 'modified',
          details: `${p1.deal_role} → ${p2.deal_role}, ${p1.status} → ${p2.status}`,
        });
      }
    }
  });

  // Compare proposals
  const allProposalIds = new Set([
    ...Array.from(state1.proposals.keys()),
    ...Array.from(state2.proposals.keys()),
  ]);

  Array.from(allProposalIds).forEach((proposalId) => {
    const prop1 = state1.proposals.get(proposalId);
    const prop2 = state2.proposals.get(proposalId);

    if (!prop1 && prop2) {
      proposalChanges.push({
        proposal_id: proposalId,
        change: 'added',
        details: `New proposal: ${prop2.proposed_value_text || String(prop2.proposed_value)}`,
      });
    } else if (prop1 && prop2 && prop1.status !== prop2.status) {
      proposalChanges.push({
        proposal_id: proposalId,
        change: 'status_changed',
        details: `${prop1.status} → ${prop2.status}`,
      });
    }
  });

  return { termChanges, participantChanges, proposalChanges };
}

// ============================================
// Replay Utilities
// ============================================

/**
 * Replay events with a callback for each step
 * Useful for animations or step-by-step debugging
 */
export async function replayWithCallback(
  dealId: string,
  events: NegotiationEvent[],
  callback: (state: ProjectedDealState, event: NegotiationEvent, index: number) => Promise<void>,
  options?: {
    startSequence?: number;
    endSequence?: number;
    delayMs?: number;
  }
): Promise<void> {
  let sortedEvents = sortEventsBySequence(events);

  // Apply filters
  if (options?.startSequence !== undefined) {
    sortedEvents = sortedEvents.filter((e) => e.sequence >= options.startSequence!);
  }
  if (options?.endSequence !== undefined) {
    sortedEvents = sortedEvents.filter((e) => e.sequence <= options.endSequence!);
  }

  // Replay each event
  for (let i = 0; i < sortedEvents.length; i++) {
    const event = sortedEvents[i];
    const state = projectDealState(dealId, sortedEvents.slice(0, i + 1));

    await callback(state, event, i);

    if (options?.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, options.delayMs));
    }
  }
}

/**
 * Get a summary of activity between two points in time
 */
export function getActivitySummary(
  events: NegotiationEvent[],
  startTimestamp: string,
  endTimestamp: string
): {
  totalEvents: number;
  byType: Record<string, number>;
  byActor: Record<string, { name: string; count: number }>;
  byTerm: Record<string, { label: string; count: number }>;
  timeline: Array<{ date: string; count: number }>;
} {
  const start = new Date(startTimestamp).getTime();
  const end = new Date(endTimestamp).getTime();

  const filteredEvents = events.filter((e) => {
    const time = new Date(e.timestamp).getTime();
    return time >= start && time <= end;
  });

  const byType: Record<string, number> = {};
  const byActor: Record<string, { name: string; count: number }> = {};
  const byTerm: Record<string, { label: string; count: number }> = {};
  const byDate: Record<string, number> = {};

  for (const event of filteredEvents) {
    // Count by type
    byType[event.type] = (byType[event.type] || 0) + 1;

    // Count by actor
    if (!byActor[event.actor_id]) {
      byActor[event.actor_id] = { name: event.actor_name, count: 0 };
    }
    byActor[event.actor_id].count++;

    // Count by term (if applicable)
    if ('payload' in event && typeof event.payload === 'object' && event.payload !== null) {
      const payload = event.payload as Record<string, unknown>;
      if ('term_id' in payload && 'term_label' in payload) {
        const termId = payload.term_id as string;
        const termLabel = payload.term_label as string;
        if (!byTerm[termId]) {
          byTerm[termId] = { label: termLabel, count: 0 };
        }
        byTerm[termId].count++;
      }
    }

    // Count by date
    const dateKey = new Date(event.timestamp).toISOString().split('T')[0];
    byDate[dateKey] = (byDate[dateKey] || 0) + 1;
  }

  // Convert date counts to sorted timeline
  const timeline = Object.entries(byDate)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalEvents: filteredEvents.length,
    byType,
    byActor,
    byTerm,
    timeline,
  };
}

/**
 * Find significant events (milestones) in the negotiation
 */
export function findMilestones(events: NegotiationEvent[]): Array<{
  event: NegotiationEvent;
  description: string;
  significance: 'high' | 'medium' | 'low';
}> {
  const milestones: Array<{
    event: NegotiationEvent;
    description: string;
    significance: 'high' | 'medium' | 'low';
  }> = [];

  const sortedEvents = sortEventsBySequence(events);

  for (const event of sortedEvents) {
    switch (event.type) {
      case 'deal_created':
        milestones.push({
          event,
          description: 'Deal created',
          significance: 'high',
        });
        break;
      case 'deal_status_changed':
        if (event.payload.new_status === 'agreed' || event.payload.new_status === 'closed') {
          milestones.push({
            event,
            description: `Deal ${event.payload.new_status}`,
            significance: 'high',
          });
        }
        break;
      case 'term_locked':
        milestones.push({
          event,
          description: `Term "${event.payload.term_label}" locked`,
          significance: 'medium',
        });
        break;
      case 'proposal_accepted':
        milestones.push({
          event,
          description: `Proposal accepted for "${event.payload.term_label}"`,
          significance: 'medium',
        });
        break;
      case 'participant_joined':
        if (event.payload.deal_role === 'deal_lead') {
          milestones.push({
            event,
            description: `${event.payload.party_name} joined as deal lead`,
            significance: 'medium',
          });
        }
        break;
      default:
        break;
    }
  }

  return milestones;
}
