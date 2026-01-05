'use client';

import React, { memo, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AutomatedCalendarEvent } from '../lib/types';
import { EventCard } from './EventCard';
import { groupEventsByDate, sortEvents } from '../lib/event-generator';

interface EventsListProps {
  events: AutomatedCalendarEvent[];
  onMarkComplete: (eventId: string) => void;
  onUploadCertificate: (eventId: string) => void;
  onSnooze?: (eventId: string) => void;
  onViewEscalation?: (eventId: string) => void;
}

export const EventsList = memo(function EventsList({
  events,
  onMarkComplete,
  onUploadCertificate,
  onSnooze,
  onViewEscalation,
}: EventsListProps) {
  const sortedEvents = useMemo(() => sortEvents(events), [events]);
  const groupedEvents = useMemo(
    () => groupEventsByDate(sortedEvents),
    [sortedEvents]
  );

  const sortedDates = useMemo(
    () =>
      Object.keys(groupedEvents).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
      ),
    [groupedEvents]
  );

  const today = new Date().toISOString().split('T')[0];

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const isToday = dateStr === today;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = dateStr === tomorrow.toISOString().split('T')[0];

    let prefix = '';
    if (isToday) prefix = 'Today - ';
    else if (isTomorrow) prefix = 'Tomorrow - ';

    return (
      prefix +
      date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    );
  };

  const getDateStatus = (dateStr: string) => {
    const date = new Date(dateStr);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    if (date < todayDate) return 'overdue';
    if (dateStr === today) return 'today';
    return 'upcoming';
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 mx-auto text-zinc-300 mb-3" />
        <h3 className="text-lg font-medium text-zinc-600">No events found</h3>
        <p className="text-sm text-zinc-400 mt-1">
          Try adjusting your filters or date range
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {sortedDates.map((date) => {
        const dateEvents = groupedEvents[date];
        const dateStatus = getDateStatus(date);

        return (
          <div
            key={date}
            className="animate-in fade-in slide-in-from-left-3"
            data-testid={`date-group-${date}`}
          >
            {/* Date header */}
            <div
              className={cn(
                'flex items-center gap-3 mb-4 pb-2 border-b',
                dateStatus === 'overdue' && 'border-red-200',
                dateStatus === 'today' && 'border-blue-200',
                dateStatus === 'upcoming' && 'border-zinc-200'
              )}
            >
              <div
                className={cn(
                  'p-2 rounded-lg',
                  dateStatus === 'overdue' && 'bg-red-100',
                  dateStatus === 'today' && 'bg-blue-100',
                  dateStatus === 'upcoming' && 'bg-zinc-100'
                )}
              >
                <Calendar
                  className={cn(
                    'w-5 h-5',
                    dateStatus === 'overdue' && 'text-red-600',
                    dateStatus === 'today' && 'text-blue-600',
                    dateStatus === 'upcoming' && 'text-zinc-600'
                  )}
                />
              </div>
              <div className="flex-1">
                <h3
                  className={cn(
                    'font-semibold',
                    dateStatus === 'overdue' && 'text-red-700',
                    dateStatus === 'today' && 'text-blue-700',
                    dateStatus === 'upcoming' && 'text-zinc-700'
                  )}
                >
                  {formatDateHeader(date)}
                </h3>
              </div>
              <Badge
                variant={
                  dateStatus === 'overdue'
                    ? 'destructive'
                    : dateStatus === 'today'
                      ? 'default'
                      : 'secondary'
                }
                className="text-xs"
              >
                {dateEvents.length} event{dateEvents.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            {/* Events for this date */}
            <div className="space-y-3 pl-2">
              {dateEvents.map((event, idx) => (
                <EventCard
                  key={event.id}
                  event={event}
                  index={idx}
                  onMarkComplete={onMarkComplete}
                  onUploadCertificate={onUploadCertificate}
                  onSnooze={onSnooze}
                  onViewEscalation={onViewEscalation}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
});
