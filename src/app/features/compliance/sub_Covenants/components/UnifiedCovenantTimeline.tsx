'use client';

import React, { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  FileText,
  Edit,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Covenant, Waiver } from '../../lib/types';
import type { CovenantTimelineEvent, CovenantTimelineEventType } from '../../lib/covenant-waiver-unified-types';
import { buildUnifiedTimeline, getTimelineEventProps } from '../../lib/covenant-waiver-unified-types';

interface UnifiedCovenantTimelineProps {
  covenant: Covenant;
  waivers: Waiver[];
  maxEvents?: number;
  compact?: boolean;
}

/**
 * Get the icon component for a timeline event.
 */
function getEventIcon(iconType: ReturnType<typeof getTimelineEventProps>['icon']) {
  switch (iconType) {
    case 'check':
      return <CheckCircle className="w-4 h-4" />;
    case 'x':
      return <XCircle className="w-4 h-4" />;
    case 'clock':
      return <Clock className="w-4 h-4" />;
    case 'shield':
      return <Shield className="w-4 h-4" />;
    case 'alert':
      return <AlertTriangle className="w-4 h-4" />;
    case 'trending-up':
      return <TrendingUp className="w-4 h-4" />;
    case 'trending-down':
      return <TrendingDown className="w-4 h-4" />;
    case 'file':
      return <FileText className="w-4 h-4" />;
    case 'edit':
      return <Edit className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
}

/**
 * Format date for display.
 */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format date with time.
 */
function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Individual timeline event item.
 */
const TimelineEventItem = memo(function TimelineEventItem({
  event,
  isLast,
}: {
  event: CovenantTimelineEvent;
  isLast: boolean;
}) {
  const props = getTimelineEventProps(event.eventType);

  return (
    <div
      className="relative pl-8 pb-6 last:pb-0"
      data-testid={`timeline-event-${event.id}`}
    >
      {/* Timeline connector line */}
      {!isLast && (
        <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-zinc-200" />
      )}

      {/* Timeline dot */}
      <div
        className={cn(
          'absolute left-0 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center',
          props.bgColor,
          props.color,
          `border-${props.borderColor.replace('border-', '')}`,
          event.isCurrent && 'ring-4 ring-offset-2 ring-blue-100'
        )}
      >
        {getEventIcon(props.icon)}
      </div>

      {/* Event content */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge className={cn('text-xs', props.bgColor, props.color)}>
              {props.label}
            </Badge>
            <span className="text-xs text-zinc-500">
              {formatDateTime(event.timestamp)}
            </span>
            {event.isCurrent && (
              <Badge variant="outline" className="text-xs">
                Current
              </Badge>
            )}
          </div>

          <p className="text-sm font-medium text-zinc-900 mb-1">{event.title}</p>
          <p className="text-sm text-zinc-600">{event.description}</p>

          {/* Test result details */}
          {event.testResult && (
            <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
              <span>
                Ratio:{' '}
                <span className="font-medium">{event.testResult.calculatedRatio.toFixed(2)}x</span>
              </span>
              <span>•</span>
              <span>
                Threshold:{' '}
                <span className="font-medium">{event.testResult.threshold.toFixed(2)}x</span>
              </span>
              <span>•</span>
              <span>
                Headroom:{' '}
                <span
                  className={cn(
                    'font-medium',
                    event.testResult.headroomPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {event.testResult.headroomPercentage.toFixed(1)}%
                </span>
              </span>
            </div>
          )}

          {/* Actor information */}
          {event.actor && (
            <p className="text-xs text-zinc-400 mt-1">By: {event.actor}</p>
          )}
        </div>
      </div>
    </div>
  );
});

/**
 * Summary card showing current state.
 */
const CurrentStateSummary = memo(function CurrentStateSummary({
  covenant,
  latestEvent,
}: {
  covenant: Covenant;
  latestEvent?: CovenantTimelineEvent;
}) {
  const statusConfig = {
    active: {
      label: 'Active',
      color: 'bg-green-100 text-green-700',
      icon: <CheckCircle className="w-5 h-5" />,
    },
    waived: {
      label: 'Waived',
      color: 'bg-purple-100 text-purple-700',
      icon: <Shield className="w-5 h-5" />,
    },
    breached: {
      label: 'Breached',
      color: 'bg-red-100 text-red-700',
      icon: <AlertTriangle className="w-5 h-5" />,
    },
  };

  const config = statusConfig[covenant.status];

  return (
    <div
      className={cn('p-4 rounded-lg mb-6 flex items-center gap-4', config.color)}
      data-testid="current-state-summary"
    >
      <div className={cn('p-2 rounded-full', config.color)}>{config.icon}</div>
      <div className="flex-1">
        <p className="font-semibold text-zinc-900">
          Current Status: {config.label}
        </p>
        {latestEvent && (
          <p className="text-sm opacity-80">
            Since {formatDate(latestEvent.timestamp)}
          </p>
        )}
        {covenant.status === 'waived' && covenant.waiver && (
          <p className="text-sm">
            Waiver expires: {formatDate(covenant.waiver.expiration_date)}
          </p>
        )}
      </div>
      <div className="text-right">
        <p className="text-xs opacity-70">Latest Headroom</p>
        <p
          className={cn(
            'text-lg font-semibold',
            covenant.latest_test.headroom_percentage >= 0 ? 'text-green-700' : 'text-red-700'
          )}
        >
          {covenant.latest_test.headroom_percentage.toFixed(1)}%
        </p>
      </div>
    </div>
  );
});

/**
 * Compact timeline view for cards.
 */
const CompactTimeline = memo(function CompactTimeline({
  events,
}: {
  events: CovenantTimelineEvent[];
}) {
  const recentEvents = events.slice(0, 3);

  return (
    <div className="flex items-center gap-2 flex-wrap" data-testid="compact-timeline">
      {recentEvents.map((event, index) => {
        const props = getTimelineEventProps(event.eventType);
        return (
          <Badge
            key={event.id}
            className={cn('text-xs', props.bgColor, props.color)}
            data-testid={`compact-event-${event.id}`}
          >
            {getEventIcon(props.icon)}
            <span className="ml-1">{props.label}</span>
            <span className="ml-1 opacity-70">{formatDate(event.timestamp)}</span>
          </Badge>
        );
      })}
      {events.length > 3 && (
        <Badge variant="outline" className="text-xs">
          +{events.length - 3} more
        </Badge>
      )}
    </div>
  );
});

/**
 * Unified Covenant Timeline Component
 *
 * Displays a combined view of covenant test history and waiver events,
 * treating waivers as state transitions within the covenant lifecycle.
 */
export const UnifiedCovenantTimeline = memo(function UnifiedCovenantTimeline({
  covenant,
  waivers,
  maxEvents = 10,
  compact = false,
}: UnifiedCovenantTimelineProps) {
  const [isExpanded, setIsExpanded] = React.useState(!compact);

  // Build unified timeline events
  const allEvents = useMemo(
    () => buildUnifiedTimeline(covenant, waivers),
    [covenant, waivers]
  );

  const displayEvents = useMemo(
    () => (isExpanded ? allEvents.slice(0, maxEvents) : allEvents.slice(0, 3)),
    [allEvents, maxEvents, isExpanded]
  );

  const hasMoreEvents = allEvents.length > displayEvents.length;

  // Get the latest event for summary
  const latestEvent = allEvents[0];

  if (compact) {
    return (
      <Card className="border-zinc-200" data-testid="unified-timeline-compact">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-900">
              Covenant Timeline
            </h3>
            <Badge
              variant="outline"
              className="text-xs"
            >
              {allEvents.length} events
            </Badge>
          </div>
          <CompactTimeline events={allEvents} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="unified-covenant-timeline">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">
              Covenant-Waiver Timeline
            </CardTitle>
            <p className="text-sm text-zinc-500 mt-1">
              Unified view of covenant tests and waiver state transitions
            </p>
          </div>
          <Badge variant="outline">{allEvents.length} events</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Current state summary */}
        <CurrentStateSummary covenant={covenant} latestEvent={latestEvent} />

        {/* Timeline events */}
        <div className="relative">
          {displayEvents.length > 0 ? (
            displayEvents.map((event, index) => (
              <TimelineEventItem
                key={event.id}
                event={event}
                isLast={index === displayEvents.length - 1}
              />
            ))
          ) : (
            <p className="text-sm text-zinc-500 text-center py-8">
              No timeline events available
            </p>
          )}
        </div>

        {/* Show more/less button */}
        {(hasMoreEvents || displayEvents.length > 3) && (
          <div className="mt-4 pt-4 border-t border-zinc-100 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              data-testid="toggle-timeline-expansion"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Show {allEvents.length - 3} More Events
                </>
              )}
            </Button>
          </div>
        )}

        {/* Timeline legend */}
        <div className="mt-6 pt-4 border-t border-zinc-100">
          <p className="text-xs text-zinc-500 mb-2 font-medium">Event Types</p>
          <div className="flex flex-wrap gap-2">
            {(['test_passed', 'test_failed', 'waiver_approved', 'waiver_expired'] as const).map(
              (eventType) => {
                const props = getTimelineEventProps(eventType);
                return (
                  <Badge
                    key={eventType}
                    variant="outline"
                    className={cn('text-xs', props.color)}
                  >
                    {getEventIcon(props.icon)}
                    <span className="ml-1">{props.label}</span>
                  </Badge>
                );
              }
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
