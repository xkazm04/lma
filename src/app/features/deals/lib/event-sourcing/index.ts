/**
 * Event Sourcing Module
 *
 * Exports all event sourcing functionality for the negotiation system.
 */

// Types
export type {
  // Base types
  NegotiationEventType,
  PartyType,
  DealRole,
  BaseNegotiationEvent,
  // Event types
  DealCreatedEvent,
  DealStatusChangedEvent,
  TermCreatedEvent,
  TermUpdatedEvent,
  TermStatusChangedEvent,
  TermLockedEvent,
  TermUnlockedEvent,
  ProposalMadeEvent,
  ProposalAcceptedEvent,
  ProposalRejectedEvent,
  ProposalWithdrawnEvent,
  ProposalSupersededEvent,
  CounterProposalMadeEvent,
  CommentAddedEvent,
  CommentResolvedEvent,
  CommentDeletedEvent,
  ParticipantJoinedEvent,
  ParticipantLeftEvent,
  ParticipantRoleChangedEvent,
  DeadlineSetEvent,
  DeadlineRemovedEvent,
  DeadlineExtendedEvent,
  NegotiationEvent,
  // Projected state types
  ProjectedTermState,
  ProjectedParticipantState,
  ProjectedProposalState,
  ProjectedDealState,
  // Store types
  EventStore,
  SnapshotStore,
  DealSnapshot,
  // Time travel types
  ReplayOptions,
  TimeTravelState,
  WhatIfScenario,
} from './types';

// Event Store
export {
  InMemoryEventStore,
  InMemorySnapshotStore,
  generateEventId,
  createBaseEvent,
  sortEventsBySequence,
  sortEventsByTimestamp,
  filterEventsByType,
  filterEventsByActor,
  groupEventsByTerm,
  getEventDescription,
  getEventCategory,
  isTermEvent,
} from './event-store';

// Projections
export {
  projectDealState,
  projectFromSnapshot,
  getTermHistory,
  calculateDealStats,
} from './projections';

// Time Travel
export {
  TimeTravelController,
  createWhatIfScenario,
  compareStates,
  replayWithCallback,
  getActivitySummary,
  findMilestones,
} from './time-travel';

// React Hook
export {
  useEventSourcedDeal,
  useLegacyEventAdapter,
} from './useEventSourcedDeal';
