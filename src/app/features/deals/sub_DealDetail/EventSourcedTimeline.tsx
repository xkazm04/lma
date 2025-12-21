'use client';

import React, { memo, useMemo, useState, useCallback } from 'react';
import {
  Clock,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Rewind,
  FastForward,
  Calendar,
  User,
  MessageSquare,
  ArrowRight,
  Check,
  X,
  Lock,
  Filter,
  BarChart3,
  History,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  useEventSourcedDeal,
  useLegacyEventAdapter,
  getEventDescription,
  getEventCategory,
  type NegotiationEvent,
  type NegotiationEventType,
} from '../lib/event-sourcing';
import { generateMockNegotiationEvents } from '../lib/war-room-types';
import type { PartyType } from '../lib/event-sourcing/types';

interface EventSourcedTimelineProps {
  dealId: string;
  onSelectTerm?: (termId: string) => void;
  onClose?: () => void;
}

const eventTypeIcons: Record<string, React.ReactNode> = {
  proposal_made: <ArrowRight className="w-3.5 h-3.5" />,
  counter_proposal_made: <ArrowRight className="w-3.5 h-3.5 rotate-180" />,
  proposal_accepted: <Check className="w-3.5 h-3.5" />,
  proposal_rejected: <X className="w-3.5 h-3.5" />,
  comment_added: <MessageSquare className="w-3.5 h-3.5" />,
  term_locked: <Lock className="w-3.5 h-3.5" />,
  participant_joined: <User className="w-3.5 h-3.5" />,
  deadline_set: <Calendar className="w-3.5 h-3.5" />,
};

const eventTypeColors: Record<string, string> = {
  proposal_made: 'bg-blue-100 text-blue-700 border-blue-200',
  counter_proposal_made: 'bg-purple-100 text-purple-700 border-purple-200',
  proposal_accepted: 'bg-green-100 text-green-700 border-green-200',
  proposal_rejected: 'bg-red-100 text-red-700 border-red-200',
  comment_added: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  term_locked: 'bg-zinc-200 text-zinc-800 border-zinc-300',
  participant_joined: 'bg-amber-100 text-amber-700 border-amber-200',
  deadline_set: 'bg-indigo-100 text-indigo-700 border-indigo-200',
};

const partyTypeStyles: Record<PartyType, { bg: string; border: string; text: string; dot: string }> = {
  borrower_side: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  lender_side: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    dot: 'bg-green-500',
  },
  third_party: {
    bg: 'bg-zinc-50',
    border: 'border-zinc-200',
    text: 'text-zinc-600',
    dot: 'bg-zinc-400',
  },
};

function formatEventTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export const EventSourcedTimeline = memo(function EventSourcedTimeline({
  dealId,
  onSelectTerm,
  onClose,
}: EventSourcedTimelineProps) {
  // Use legacy adapter for mock events
  const mockLegacyEvents = useMemo(() => generateMockNegotiationEvents(), []);
  const adaptedEvents = useLegacyEventAdapter(mockLegacyEvents, dealId);

  // Use the event-sourced deal hook
  const {
    state,
    events,
    stats,
    isTimeTraveling,
    timeTravelState,
    startTimeTravel,
    stopTimeTravel,
    goToSequence,
    stepForward,
    stepBackward,
    goToLatest,
    goToStart,
    getMilestones,
    getTermEvents,
    getEventDescription: getDesc,
  } = useEventSourcedDeal({
    dealId,
    initialEvents: adaptedEvents,
    currentUser: {
      id: 'current-user',
      name: 'Current User',
      partyType: 'borrower_side',
      organizationId: 'org-1',
    },
  });

  // Local state
  const [activeTab, setActiveTab] = useState<'timeline' | 'milestones' | 'stats'>('timeline');
  const [filterTypes, setFilterTypes] = useState<NegotiationEventType[]>([]);
  const [filterParties, setFilterParties] = useState<PartyType[]>([]);

  // Filter events
  const filteredEvents = useMemo(() => {
    let filtered = events;

    if (filterTypes.length > 0) {
      filtered = filtered.filter((e) => filterTypes.includes(e.type));
    }

    if (filterParties.length > 0) {
      filtered = filtered.filter((e) => filterParties.includes(e.actor_party_type));
    }

    return [...filtered].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [events, filterTypes, filterParties]);

  // Get milestones
  const milestones = useMemo(() => getMilestones(), [getMilestones]);

  // Toggle filter
  const toggleTypeFilter = useCallback((type: NegotiationEventType) => {
    setFilterTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }, []);

  const togglePartyFilter = useCallback((party: PartyType) => {
    setFilterParties((prev) =>
      prev.includes(party) ? prev.filter((p) => p !== party) : [...prev, party]
    );
  }, []);

  // Get term label from event payload
  const getTermLabel = (event: NegotiationEvent): string | null => {
    if ('payload' in event && typeof event.payload === 'object' && event.payload !== null) {
      const payload = event.payload as Record<string, unknown>;
      if ('term_label' in payload && typeof payload.term_label === 'string') {
        return payload.term_label;
      }
    }
    return null;
  };

  // Get term ID from event payload
  const getTermId = (event: NegotiationEvent): string | null => {
    if ('payload' in event && typeof event.payload === 'object' && event.payload !== null) {
      const payload = event.payload as Record<string, unknown>;
      if ('term_id' in payload && typeof payload.term_id === 'string') {
        return payload.term_id;
      }
    }
    return null;
  };

  return (
    <Card
      className="animate-in fade-in duration-300"
      data-testid="event-sourced-timeline"
      role="region"
      aria-label="Event-sourced negotiation timeline"
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-zinc-500" />
            <CardTitle className="text-base">Event Timeline</CardTitle>
            {isTimeTraveling && (
              <Badge variant="warning" className="text-xs animate-pulse" data-testid="time-travel-badge">
                <Clock className="w-3 h-3 mr-1" />
                Time Traveling
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Filter dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  data-testid="timeline-filter-btn"
                >
                  <Filter className="w-4 h-4 mr-1" />
                  Filter
                  {(filterTypes.length > 0 || filterParties.length > 0) && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                      {filterTypes.length + filterParties.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Event Types</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={filterTypes.includes('proposal_made')}
                  onCheckedChange={() => toggleTypeFilter('proposal_made')}
                >
                  Proposals
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filterTypes.includes('counter_proposal_made')}
                  onCheckedChange={() => toggleTypeFilter('counter_proposal_made')}
                >
                  Counter Proposals
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filterTypes.includes('proposal_accepted')}
                  onCheckedChange={() => toggleTypeFilter('proposal_accepted')}
                >
                  Accepted
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filterTypes.includes('comment_added')}
                  onCheckedChange={() => toggleTypeFilter('comment_added')}
                >
                  Comments
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Party Types</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={filterParties.includes('borrower_side')}
                  onCheckedChange={() => togglePartyFilter('borrower_side')}
                >
                  Borrower Side
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filterParties.includes('lender_side')}
                  onCheckedChange={() => togglePartyFilter('lender_side')}
                >
                  Lender Side
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filterParties.includes('third_party')}
                  onCheckedChange={() => togglePartyFilter('third_party')}
                >
                  Third Party
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Time travel toggle */}
            <Button
              variant={isTimeTraveling ? 'default' : 'outline'}
              size="sm"
              className="h-8"
              onClick={isTimeTraveling ? stopTimeTravel : startTimeTravel}
              data-testid="time-travel-toggle"
            >
              <Clock className="w-4 h-4 mr-1" />
              {isTimeTraveling ? 'Exit Time Travel' : 'Time Travel'}
            </Button>

            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={onClose}
                data-testid="timeline-close-btn"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Time Travel Controls */}
        {isTimeTraveling && timeTravelState && (
          <div
            className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg"
            data-testid="time-travel-controls"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-amber-800">
                Event {timeTravelState.currentSequence} of {timeTravelState.totalEvents}
              </span>
              <span className="text-xs text-amber-600">
                {new Date(timeTravelState.currentTimestamp).toLocaleString()}
              </span>
            </div>

            {/* Playback controls */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToStart}
                disabled={timeTravelState.currentSequence <= 1}
                data-testid="time-travel-start"
                aria-label="Go to first event"
              >
                <Rewind className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={stepBackward}
                disabled={timeTravelState.currentSequence <= 1}
                data-testid="time-travel-back"
                aria-label="Previous event"
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={stepForward}
                disabled={timeTravelState.isAtLatest}
                data-testid="time-travel-forward"
                aria-label="Next event"
              >
                <SkipForward className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToLatest}
                disabled={timeTravelState.isAtLatest}
                data-testid="time-travel-end"
                aria-label="Go to latest event"
              >
                <FastForward className="w-4 h-4" />
              </Button>
            </div>

            {/* Progress bar */}
            <div className="mt-2">
              <input
                type="range"
                min={1}
                max={timeTravelState.totalEvents}
                value={timeTravelState.currentSequence}
                onChange={(e) => goToSequence(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer"
                data-testid="time-travel-slider"
                aria-label="Event timeline position"
              />
            </div>

            {/* State summary */}
            {timeTravelState.projectedState && (
              <div className="mt-2 text-xs text-amber-700">
                State: {timeTravelState.projectedState.terms.size} terms,{' '}
                {timeTravelState.projectedState.participants.size} participants
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="w-full">
            <TabsTrigger value="timeline" className="flex-1" data-testid="timeline-tab">
              <History className="w-3.5 h-3.5 mr-1" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="milestones" className="flex-1" data-testid="milestones-tab">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Milestones
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex-1" data-testid="stats-tab">
              <BarChart3 className="w-3.5 h-3.5 mr-1" />
              Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-3">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-sm text-zinc-500">
                <History className="w-8 h-8 mx-auto text-zinc-300 mb-2" />
                <p>No events to display</p>
              </div>
            ) : (
              <div className="relative max-h-96 overflow-y-auto">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-zinc-200" />
                <div className="space-y-3">
                  {filteredEvents.map((event) => {
                    const styles = partyTypeStyles[event.actor_party_type];
                    const termLabel = getTermLabel(event);
                    const termId = getTermId(event);

                    return (
                      <div
                        key={event.id}
                        className="relative pl-10"
                        data-testid={`timeline-event-${event.id}`}
                      >
                        <div
                          className={`absolute left-2.5 top-1.5 w-3 h-3 rounded-full ${styles.dot} ring-2 ring-white`}
                        />
                        <div
                          className={`p-3 rounded-lg border ${styles.bg} ${styles.border} transition-all`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${
                                  eventTypeColors[event.type] || 'bg-zinc-100 text-zinc-600'
                                }`}
                              >
                                {eventTypeIcons[event.type] || <MessageSquare className="w-3.5 h-3.5" />}
                                {event.type.replace(/_/g, ' ')}
                              </span>
                              {termLabel && termId && (
                                <button
                                  className="text-xs text-blue-600 hover:underline"
                                  onClick={() => onSelectTerm?.(termId)}
                                  data-testid={`event-term-link-${event.id}`}
                                >
                                  {termLabel}
                                </button>
                              )}
                            </div>
                            <span className="text-xs text-zinc-500">
                              {formatEventTime(event.timestamp)}
                            </span>
                          </div>
                          <p className={`text-sm font-medium ${styles.text}`}>
                            {event.actor_name}
                          </p>
                          <p className="text-sm text-zinc-600">{getDesc(event)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="milestones" className="mt-3">
            {milestones.length === 0 ? (
              <div className="text-center py-8 text-sm text-zinc-500">
                <Sparkles className="w-8 h-8 mx-auto text-zinc-300 mb-2" />
                <p>No milestones yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {milestones.map((milestone, index) => (
                  <div
                    key={milestone.event.id}
                    className={`p-3 rounded-lg border ${
                      milestone.significance === 'high'
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-zinc-50 border-zinc-200'
                    }`}
                    data-testid={`milestone-${index}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge
                        variant={milestone.significance === 'high' ? 'warning' : 'secondary'}
                        className="text-xs"
                      >
                        {milestone.significance}
                      </Badge>
                      <span className="text-xs text-zinc-500">
                        {formatEventTime(milestone.event.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-zinc-900">{milestone.description}</p>
                    <p className="text-xs text-zinc-500 mt-1">by {milestone.event.actor_name}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats" className="mt-3">
            {stats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-zinc-50 rounded-lg" data-testid="stat-total-terms">
                    <p className="text-2xl font-bold text-zinc-900">{stats.total_terms}</p>
                    <p className="text-xs text-zinc-500">Total Terms</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg" data-testid="stat-agreed-terms">
                    <p className="text-2xl font-bold text-green-700">{stats.agreed_terms}</p>
                    <p className="text-xs text-green-600">Agreed</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg" data-testid="stat-pending-proposals">
                    <p className="text-2xl font-bold text-blue-700">{stats.pending_proposals}</p>
                    <p className="text-xs text-blue-600">Pending Proposals</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg" data-testid="stat-participants">
                    <p className="text-2xl font-bold text-amber-700">{stats.active_participants}</p>
                    <p className="text-xs text-amber-600">Active Participants</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="p-3 bg-zinc-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-zinc-700">Agreement Progress</span>
                    <span className="text-sm text-zinc-500">
                      {stats.total_terms > 0
                        ? Math.round((stats.agreed_terms / stats.total_terms) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-500"
                      style={{
                        width: `${
                          stats.total_terms > 0
                            ? (stats.agreed_terms / stats.total_terms) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div className="text-xs text-zinc-500 text-center">
                  {events.length} total events recorded
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-zinc-500">
                <BarChart3 className="w-8 h-8 mx-auto text-zinc-300 mb-2" />
                <p>No statistics available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
});
