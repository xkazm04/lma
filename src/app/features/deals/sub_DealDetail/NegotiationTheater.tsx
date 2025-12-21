'use client';

import React, { memo, useMemo, useState } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  Filter,
  ArrowRight,
  Check,
  XCircle,
  Lock,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { NegotiationEvent, TimelineViewMode } from '../lib/war-room-types';

interface NegotiationTheaterProps {
  events: NegotiationEvent[];
  selectedTermId?: string | null;
  viewMode?: TimelineViewMode;
  onViewModeChange?: (mode: TimelineViewMode) => void;
  onClose?: () => void;
  onSelectTerm?: (termId: string) => void;
}

const eventTypeIcons = {
  proposal: <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />,
  counter_proposal: <ArrowRight className="w-3.5 h-3.5 rotate-180" aria-hidden="true" />,
  comment: <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />,
  accepted: <Check className="w-3.5 h-3.5" aria-hidden="true" />,
  rejected: <XCircle className="w-3.5 h-3.5" aria-hidden="true" />,
  locked: <Lock className="w-3.5 h-3.5" aria-hidden="true" />,
};

const eventTypeColors = {
  proposal: 'bg-blue-100 text-blue-700 border-blue-200',
  counter_proposal: 'bg-purple-100 text-purple-700 border-purple-200',
  comment: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  accepted: 'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  locked: 'bg-zinc-200 text-zinc-800 border-zinc-300',
};

const partyTypeStyles = {
  borrower_side: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
    line: 'bg-blue-300',
  },
  lender_side: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    dot: 'bg-green-500',
    line: 'bg-green-300',
  },
  third_party: {
    bg: 'bg-zinc-50',
    border: 'border-zinc-200',
    text: 'text-zinc-600',
    dot: 'bg-zinc-400',
    line: 'bg-zinc-300',
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

function formatEventDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export const NegotiationTheater = memo(function NegotiationTheater({
  events,
  selectedTermId,
  viewMode = 'compact',
  onViewModeChange,
  onClose,
  onSelectTerm,
}: NegotiationTheaterProps) {
  const [filterTerms, setFilterTerms] = useState<string[]>([]);
  const [expandedEvents, setExpandedEvents] = useState<string[]>([]);

  // Get unique terms for filtering
  const uniqueTerms = useMemo(() => {
    const termsMap = new Map<string, string>();
    events.forEach((e) => {
      if (!termsMap.has(e.term_id)) {
        termsMap.set(e.term_id, e.term_label);
      }
    });
    return Array.from(termsMap.entries()).map(([id, label]) => ({
      id,
      label,
    }));
  }, [events]);

  // Filter events
  const filteredEvents = useMemo(() => {
    let filtered = events;

    // Filter by selected term if in focus mode
    if (selectedTermId) {
      filtered = filtered.filter((e) => e.term_id === selectedTermId);
    } else if (filterTerms.length > 0) {
      filtered = filtered.filter((e) => filterTerms.includes(e.term_id));
    }

    // Sort by timestamp descending (most recent first)
    return [...filtered].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [events, selectedTermId, filterTerms]);

  // Group events by term for theater view
  const eventsByTerm = useMemo(() => {
    const grouped: Record<string, NegotiationEvent[]> = {};
    filteredEvents.forEach((event) => {
      if (!grouped[event.term_id]) {
        grouped[event.term_id] = [];
      }
      grouped[event.term_id].push(event);
    });
    return grouped;
  }, [filteredEvents]);

  const toggleEventExpanded = (eventId: string) => {
    setExpandedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId]
    );
  };

  const toggleTermFilter = (termId: string) => {
    setFilterTerms((prev) =>
      prev.includes(termId)
        ? prev.filter((id) => id !== termId)
        : [...prev, termId]
    );
  };

  const isTheaterMode = viewMode === 'theater';

  return (
    <Card
      className={`animate-in fade-in duration-300 ${
        isTheaterMode
          ? 'fixed inset-4 z-50 overflow-hidden flex flex-col'
          : ''
      }`}
      data-testid="negotiation-theater"
      role="region"
      aria-label="Negotiation timeline"
    >
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Negotiation Timeline</CardTitle>
            {selectedTermId && (
              <Badge variant="info" className="text-xs" data-testid="timeline-filter-badge">
                Filtered to selected term
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Filter dropdown */}
            {!selectedTermId && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    data-testid="timeline-filter-btn"
                    aria-label="Filter timeline by term"
                  >
                    <Filter className="w-4 h-4 mr-1" aria-hidden="true" />
                    Filter
                    {filterTerms.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                        {filterTerms.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {uniqueTerms.map((term) => (
                    <DropdownMenuCheckboxItem
                      key={term.id}
                      checked={filterTerms.includes(term.id)}
                      onCheckedChange={() => toggleTermFilter(term.id)}
                      data-testid={`timeline-filter-term-${term.id}`}
                    >
                      {term.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* View mode toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() =>
                onViewModeChange?.(isTheaterMode ? 'compact' : 'theater')
              }
              data-testid="timeline-view-toggle"
              aria-label={isTheaterMode ? 'Exit theater mode' : 'Enter theater mode'}
            >
              {isTheaterMode ? (
                <Minimize2 className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Maximize2 className="w-4 h-4" aria-hidden="true" />
              )}
            </Button>

            {/* Close button */}
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={onClose}
                data-testid="timeline-close-btn"
                aria-label="Close timeline"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent
        className={`${isTheaterMode ? 'flex-1 overflow-auto' : ''} pt-4`}
      >
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-sm text-zinc-500">
            <MessageSquare
              className="w-8 h-8 mx-auto text-zinc-300 mb-2"
              aria-hidden="true"
            />
            <p>No negotiation activity yet</p>
          </div>
        ) : isTheaterMode ? (
          // Theater mode: grouped by term with horizontal timeline
          <div className="space-y-6">
            {Object.entries(eventsByTerm).map(([termId, termEvents]) => (
              <div
                key={termId}
                className="border border-zinc-200 rounded-lg p-4"
                data-testid={`theater-term-${termId}`}
              >
                <button
                  className="flex items-center gap-2 mb-4 hover:text-blue-600 transition-colors"
                  onClick={() => onSelectTerm?.(termId)}
                  data-testid={`theater-term-btn-${termId}`}
                  aria-label={`View term: ${termEvents[0]?.term_label}`}
                >
                  <h4 className="font-medium text-zinc-900">
                    {termEvents[0]?.term_label}
                  </h4>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>

                {/* Horizontal timeline */}
                <div className="relative">
                  <div className="absolute top-4 left-0 right-0 h-0.5 bg-zinc-200" />
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {[...termEvents].reverse().map((event, index) => {
                      const styles = partyTypeStyles[event.actor_party_type];
                      const isExpanded = expandedEvents.includes(event.id);

                      return (
                        <div
                          key={event.id}
                          className={`relative flex-shrink-0 w-48 ${
                            event.actor_party_type === 'borrower_side'
                              ? ''
                              : 'mt-12'
                          }`}
                          data-testid={`theater-event-${event.id}`}
                        >
                          {/* Timeline node */}
                          <div
                            className={`absolute ${
                              event.actor_party_type === 'borrower_side'
                                ? 'bottom-0 translate-y-1/2'
                                : 'top-0 -translate-y-1/2'
                            } left-1/2 -translate-x-1/2 w-3 h-3 rounded-full ${styles.dot} ring-2 ring-white`}
                          />

                          {/* Event card */}
                          <div
                            className={`p-3 rounded-lg border ${styles.bg} ${styles.border} ${
                              event.actor_party_type === 'borrower_side'
                                ? 'mb-4'
                                : 'mt-4'
                            }`}
                          >
                            <div className="flex items-center gap-1 mb-1">
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${eventTypeColors[event.event_type]}`}
                              >
                                {eventTypeIcons[event.event_type]}
                              </span>
                              <span className="text-xs text-zinc-500">
                                {formatEventTime(event.timestamp)}
                              </span>
                            </div>
                            <p className={`text-xs font-medium ${styles.text}`}>
                              {event.actor_name}
                            </p>
                            <p className="text-xs text-zinc-600 mt-1 line-clamp-2">
                              {event.description}
                            </p>
                            {event.new_value && (
                              <p className="text-xs font-medium text-zinc-900 mt-1">
                                {event.old_value && (
                                  <span className="text-zinc-400 line-through mr-1">
                                    {event.old_value}
                                  </span>
                                )}
                                {event.new_value}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Compact mode: vertical timeline
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-zinc-200" />

            <div className="space-y-4">
              {filteredEvents.map((event, index) => {
                const styles = partyTypeStyles[event.actor_party_type];
                const isExpanded = expandedEvents.includes(event.id);

                return (
                  <div
                    key={event.id}
                    className="relative pl-10"
                    data-testid={`timeline-event-${event.id}`}
                  >
                    {/* Timeline node */}
                    <div
                      className={`absolute left-2.5 top-1.5 w-3 h-3 rounded-full ${styles.dot} ring-2 ring-white`}
                    />

                    {/* Event card */}
                    <div
                      className={`p-3 rounded-lg border ${styles.bg} ${styles.border} transition-all cursor-pointer hover:shadow-sm`}
                      onClick={() => toggleEventExpanded(event.id)}
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      aria-label={`${event.actor_name}: ${event.description}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${eventTypeColors[event.event_type]}`}
                          >
                            {eventTypeIcons[event.event_type]}
                            {event.event_type.replace('_', ' ')}
                          </span>
                          <button
                            className="text-xs text-blue-600 hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectTerm?.(event.term_id);
                            }}
                            data-testid={`timeline-event-term-link-${event.id}`}
                          >
                            {event.term_label}
                          </button>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-zinc-500">
                            {formatEventTime(event.timestamp)}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3 text-zinc-400" aria-hidden="true" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-zinc-400" aria-hidden="true" />
                          )}
                        </div>
                      </div>

                      <p className={`text-sm font-medium ${styles.text}`}>
                        {event.actor_name}
                      </p>
                      <p className="text-sm text-zinc-600">{event.description}</p>

                      {event.new_value && (
                        <div className="mt-2 pt-2 border-t border-zinc-200">
                          <p className="text-sm">
                            {event.old_value && (
                              <span className="text-zinc-400 line-through mr-2">
                                {event.old_value}
                              </span>
                            )}
                            <span className="font-medium text-zinc-900">
                              {event.new_value}
                            </span>
                          </p>
                        </div>
                      )}

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="mt-2 pt-2 border-t border-zinc-200 text-xs text-zinc-500">
                          <p>{formatEventDate(event.timestamp)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
