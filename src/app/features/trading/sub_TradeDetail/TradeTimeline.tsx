'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getTradeEventIcon } from '../lib/utils';
import { formatDate } from '@/lib/utils/formatters';
import type { TimelineEvent } from '../lib/types';

interface TradeTimelineProps {
  events: TimelineEvent[];
}

export const TradeTimeline = React.memo<TradeTimelineProps>(({ events }) => {
  return (
    <Card className="animate-in fade-in slide-in-from-left-4 duration-500">
      <CardHeader>
        <CardTitle>Trade Timeline</CardTitle>
        <CardDescription>Complete history of trade events</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute left-2.5 top-0 bottom-0 w-px bg-zinc-200" />
          <div className="space-y-2">
            {events
              .slice()
              .reverse()
              .map((event, index) => (
                <div
                  key={event.id}
                  className="relative flex items-start gap-3 pl-6 animate-in fade-in slide-in-from-left-2 duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="absolute left-1 p-1 bg-white rounded-full border border-zinc-200 hover:border-zinc-400 transition-colors">
                    {getTradeEventIcon(event.event_type)}
                  </div>
                  <div className="flex-1 pb-2">
                    <p className="text-sm font-medium text-zinc-900">{event.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-zinc-500">{event.actor_name}</span>
                      <span className="text-xs text-zinc-400">{formatDate(event.occurred_at, 'MMM d, h:mm a')}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

TradeTimeline.displayName = 'TradeTimeline';
