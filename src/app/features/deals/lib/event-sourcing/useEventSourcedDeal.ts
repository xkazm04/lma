/**
 * React Hook for Event-Sourced Deal State
 *
 * Provides a React interface to the event-sourced negotiation system,
 * including state management, time travel, and what-if scenarios.
 */

'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type {
  NegotiationEvent,
  ProjectedDealState,
  TimeTravelState,
  WhatIfScenario,
  ReplayOptions,
  NegotiationEventType,
  PartyType,
} from './types';
import {
  InMemoryEventStore,
  InMemorySnapshotStore,
  generateEventId,
  createBaseEvent,
  getEventDescription,
  sortEventsBySequence,
} from './event-store';
import { projectDealState, calculateDealStats } from './projections';
import { TimeTravelController, createWhatIfScenario, compareStates, findMilestones } from './time-travel';

// ============================================
// Hook Interface
// ============================================

interface UseEventSourcedDealOptions {
  /** Deal ID */
  dealId: string;
  /** Initial events to load */
  initialEvents?: NegotiationEvent[];
  /** Current user info */
  currentUser: {
    id: string;
    name: string;
    partyType: PartyType;
    organizationId: string;
  };
  /** Enable auto-snapshot after N events */
  autoSnapshotThreshold?: number;
  /** Callback when events are appended */
  onEventsAppended?: (events: NegotiationEvent[]) => void;
}

interface UseEventSourcedDealReturn {
  // State
  state: ProjectedDealState | null;
  events: NegotiationEvent[];
  isLoading: boolean;
  error: string | null;

  // Statistics
  stats: ReturnType<typeof calculateDealStats> | null;

  // Event Operations
  appendEvent: (type: NegotiationEventType, payload: Record<string, unknown>) => Promise<NegotiationEvent>;
  appendEvents: (events: Array<{ type: NegotiationEventType; payload: Record<string, unknown> }>) => Promise<NegotiationEvent[]>;

  // Time Travel
  timeTravelState: TimeTravelState | null;
  isTimeTraveling: boolean;
  startTimeTravel: () => void;
  stopTimeTravel: () => void;
  goToSequence: (sequence: number) => void;
  goToTimestamp: (timestamp: string) => void;
  stepForward: () => void;
  stepBackward: () => void;
  goToLatest: () => void;
  goToStart: () => void;

  // What-If Scenarios
  scenarios: WhatIfScenario[];
  createScenario: (name: string, description: string, hypotheticalEvents: NegotiationEvent[]) => WhatIfScenario;
  deleteScenario: (scenarioId: string) => void;
  compareWithScenario: (scenarioId: string) => ReturnType<typeof compareStates> | null;

  // Utilities
  getTermEvents: (termId: string) => NegotiationEvent[];
  getMilestones: () => ReturnType<typeof findMilestones>;
  getEventDescription: (event: NegotiationEvent) => string;
  refresh: () => void;
}

// ============================================
// Main Hook
// ============================================

export function useEventSourcedDeal(options: UseEventSourcedDealOptions): UseEventSourcedDealReturn {
  const {
    dealId,
    initialEvents = [],
    currentUser,
    autoSnapshotThreshold = 50,
    onEventsAppended,
  } = options;

  // Refs for stable references
  const eventStoreRef = useRef(new InMemoryEventStore());
  const snapshotStoreRef = useRef(new InMemorySnapshotStore());
  const timeTravelControllerRef = useRef<TimeTravelController | null>(null);

  // State
  const [events, setEvents] = useState<NegotiationEvent[]>(initialEvents);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTimeTraveling, setIsTimeTraveling] = useState(false);
  const [timeTravelState, setTimeTravelState] = useState<TimeTravelState | null>(null);
  const [scenarios, setScenarios] = useState<WhatIfScenario[]>([]);
  const [lastSequence, setLastSequence] = useState(0);

  // Initialize event store with initial events
  useEffect(() => {
    if (initialEvents.length > 0) {
      eventStoreRef.current.clear();
      eventStoreRef.current.append(initialEvents).then(() => {
        setEvents(initialEvents);
        const maxSeq = initialEvents.reduce((max, e) => Math.max(max, e.sequence), 0);
        setLastSequence(maxSeq);
      });
    }
  }, [initialEvents]);

  // Compute projected state
  const state = useMemo(() => {
    if (events.length === 0) return null;
    return projectDealState(dealId, events);
  }, [dealId, events]);

  // Compute statistics
  const stats = useMemo(() => {
    if (!state) return null;
    return calculateDealStats(state);
  }, [state]);

  // Append a single event
  const appendEvent = useCallback(
    async (type: NegotiationEventType, payload: Record<string, unknown>): Promise<NegotiationEvent> => {
      const newSequence = lastSequence + 1;

      const baseEvent = createBaseEvent(type, dealId, newSequence, {
        id: currentUser.id,
        name: currentUser.name,
        partyType: currentUser.partyType,
        organizationId: currentUser.organizationId,
      });

      const event = {
        ...baseEvent,
        payload,
      } as NegotiationEvent;

      await eventStoreRef.current.append([event]);
      setEvents((prev) => [...prev, event]);
      setLastSequence(newSequence);

      // Auto-snapshot if threshold reached
      if (newSequence % autoSnapshotThreshold === 0 && state) {
        await snapshotStoreRef.current.save({
          deal_id: dealId,
          sequence: newSequence,
          timestamp: new Date().toISOString(),
          state,
        });
      }

      onEventsAppended?.([event]);

      return event;
    },
    [dealId, currentUser, lastSequence, autoSnapshotThreshold, state, onEventsAppended]
  );

  // Append multiple events
  const appendEvents = useCallback(
    async (
      eventConfigs: Array<{ type: NegotiationEventType; payload: Record<string, unknown> }>
    ): Promise<NegotiationEvent[]> => {
      const newEvents: NegotiationEvent[] = [];
      let seq = lastSequence;

      for (const config of eventConfigs) {
        seq++;
        const baseEvent = createBaseEvent(config.type, dealId, seq, {
          id: currentUser.id,
          name: currentUser.name,
          partyType: currentUser.partyType,
          organizationId: currentUser.organizationId,
        });

        const event = {
          ...baseEvent,
          payload: config.payload,
        } as NegotiationEvent;

        newEvents.push(event);
      }

      await eventStoreRef.current.append(newEvents);
      setEvents((prev) => [...prev, ...newEvents]);
      setLastSequence(seq);

      onEventsAppended?.(newEvents);

      return newEvents;
    },
    [dealId, currentUser, lastSequence, onEventsAppended]
  );

  // Time travel functions
  const startTimeTravel = useCallback(() => {
    timeTravelControllerRef.current = new TimeTravelController(dealId, events);
    setIsTimeTraveling(true);
    setTimeTravelState(timeTravelControllerRef.current.getState());
  }, [dealId, events]);

  const stopTimeTravel = useCallback(() => {
    timeTravelControllerRef.current = null;
    setIsTimeTraveling(false);
    setTimeTravelState(null);
  }, []);

  const goToSequence = useCallback((sequence: number) => {
    if (timeTravelControllerRef.current) {
      setTimeTravelState(timeTravelControllerRef.current.goToSequence(sequence));
    }
  }, []);

  const goToTimestamp = useCallback((timestamp: string) => {
    if (timeTravelControllerRef.current) {
      setTimeTravelState(timeTravelControllerRef.current.goToTimestamp(timestamp));
    }
  }, []);

  const stepForward = useCallback(() => {
    if (timeTravelControllerRef.current) {
      setTimeTravelState(timeTravelControllerRef.current.stepForward());
    }
  }, []);

  const stepBackward = useCallback(() => {
    if (timeTravelControllerRef.current) {
      setTimeTravelState(timeTravelControllerRef.current.stepBackward());
    }
  }, []);

  const goToLatest = useCallback(() => {
    if (timeTravelControllerRef.current) {
      setTimeTravelState(timeTravelControllerRef.current.goToLatest());
    }
  }, []);

  const goToStart = useCallback(() => {
    if (timeTravelControllerRef.current) {
      setTimeTravelState(timeTravelControllerRef.current.goToStart());
    }
  }, []);

  // Scenario functions
  const createScenarioFn = useCallback(
    (name: string, description: string, hypotheticalEvents: NegotiationEvent[]): WhatIfScenario => {
      if (!state) throw new Error('No state available');

      const scenario = createWhatIfScenario(state, lastSequence, hypotheticalEvents, {
        name,
        description,
        createdBy: currentUser.id,
      });

      setScenarios((prev) => [...prev, scenario]);
      return scenario;
    },
    [state, lastSequence, currentUser.id]
  );

  const deleteScenario = useCallback((scenarioId: string) => {
    setScenarios((prev) => prev.filter((s) => s.id !== scenarioId));
  }, []);

  const compareWithScenario = useCallback(
    (scenarioId: string): ReturnType<typeof compareStates> | null => {
      if (!state) return null;
      const scenario = scenarios.find((s) => s.id === scenarioId);
      if (!scenario) return null;
      return compareStates(state, scenario.resultingState);
    },
    [state, scenarios]
  );

  // Utility functions
  const getTermEvents = useCallback(
    (termId: string): NegotiationEvent[] => {
      return events.filter((e) => {
        if ('payload' in e && typeof e.payload === 'object' && e.payload !== null) {
          const payload = e.payload as Record<string, unknown>;
          return 'term_id' in payload && payload.term_id === termId;
        }
        return false;
      });
    },
    [events]
  );

  const getMilestones = useCallback(() => {
    return findMilestones(events);
  }, [events]);

  const refresh = useCallback(() => {
    // Re-trigger state computation
    setEvents((prev) => [...prev]);
  }, []);

  return {
    // State
    state,
    events,
    isLoading,
    error,

    // Statistics
    stats,

    // Event Operations
    appendEvent,
    appendEvents,

    // Time Travel
    timeTravelState,
    isTimeTraveling,
    startTimeTravel,
    stopTimeTravel,
    goToSequence,
    goToTimestamp,
    stepForward,
    stepBackward,
    goToLatest,
    goToStart,

    // Scenarios
    scenarios,
    createScenario: createScenarioFn,
    deleteScenario,
    compareWithScenario,

    // Utilities
    getTermEvents,
    getMilestones,
    getEventDescription,
    refresh,
  };
}

// ============================================
// Helper Hooks
// ============================================

/**
 * Hook for converting legacy NegotiationEvent to event-sourced format
 */
export function useLegacyEventAdapter(
  legacyEvents: Array<{
    id: string;
    term_id: string;
    term_label: string;
    event_type: 'proposal' | 'counter_proposal' | 'comment' | 'accepted' | 'rejected' | 'locked';
    actor_name: string;
    actor_party_type: PartyType;
    description: string;
    old_value?: string;
    new_value?: string;
    timestamp: string;
  }>,
  dealId: string
): NegotiationEvent[] {
  return useMemo(() => {
    return legacyEvents.map((legacy, index) => {
      const baseEvent: Omit<NegotiationEvent, 'type' | 'payload'> = {
        id: legacy.id,
        deal_id: dealId,
        sequence: index + 1,
        timestamp: legacy.timestamp,
        actor_id: `user-${legacy.actor_name.replace(/\s+/g, '-').toLowerCase()}`,
        actor_name: legacy.actor_name,
        actor_party_type: legacy.actor_party_type,
        actor_organization_id: 'org-default',
        version: 1,
      };

      // Map legacy event types to new event types
      switch (legacy.event_type) {
        case 'proposal':
          return {
            ...baseEvent,
            type: 'proposal_made' as const,
            payload: {
              proposal_id: `proposal-${legacy.id}`,
              term_id: legacy.term_id,
              term_label: legacy.term_label,
              previous_value: legacy.old_value,
              previous_value_text: legacy.old_value,
              proposed_value: legacy.new_value,
              proposed_value_text: legacy.new_value,
              rationale: legacy.description,
            },
          };
        case 'counter_proposal':
          return {
            ...baseEvent,
            type: 'counter_proposal_made' as const,
            payload: {
              proposal_id: `proposal-${legacy.id}`,
              term_id: legacy.term_id,
              term_label: legacy.term_label,
              original_proposal_id: `proposal-original-${legacy.id}`,
              previous_value: legacy.old_value,
              previous_value_text: legacy.old_value,
              counter_value: legacy.new_value,
              counter_value_text: legacy.new_value,
              rationale: legacy.description,
            },
          };
        case 'comment':
          return {
            ...baseEvent,
            type: 'comment_added' as const,
            payload: {
              comment_id: `comment-${legacy.id}`,
              term_id: legacy.term_id,
              term_label: legacy.term_label,
              content: legacy.description,
              is_internal: false,
            },
          };
        case 'accepted':
          return {
            ...baseEvent,
            type: 'proposal_accepted' as const,
            payload: {
              proposal_id: `proposal-${legacy.id}`,
              term_id: legacy.term_id,
              term_label: legacy.term_label,
              accepted_value: legacy.new_value,
              accepted_value_text: legacy.new_value,
              comment: legacy.description,
            },
          };
        case 'rejected':
          return {
            ...baseEvent,
            type: 'proposal_rejected' as const,
            payload: {
              proposal_id: `proposal-${legacy.id}`,
              term_id: legacy.term_id,
              term_label: legacy.term_label,
              rejected_value: legacy.new_value,
              rejected_value_text: legacy.new_value,
              reason: legacy.description,
            },
          };
        case 'locked':
          return {
            ...baseEvent,
            type: 'term_locked' as const,
            payload: {
              term_id: legacy.term_id,
              term_label: legacy.term_label,
              final_value: legacy.new_value,
              final_value_text: legacy.new_value,
              reason: legacy.description,
            },
          };
        default:
          return {
            ...baseEvent,
            type: 'comment_added' as const,
            payload: {
              comment_id: `comment-${legacy.id}`,
              term_id: legacy.term_id,
              term_label: legacy.term_label,
              content: legacy.description,
              is_internal: false,
            },
          };
      }
    });
  }, [legacyEvents, dealId]);
}
