'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CalendarEvent, ItemStatus } from '../../lib';
import {
  getItemTypeBorderColor,
  getItemTypeLabel,
  getItemStatusColor,
  getItemStatusLabel,
  formatDateLong,
} from '../../lib';
import { getDaysUntil, getRelativeDateLabel } from '@/lib/utils/urgency';

interface ListViewProps {
  groupedItems: Record<string, CalendarEvent[]>;
  sortedDates: string[];
  today: string;
}

function getStatusBadge(status: ItemStatus) {
  return (
    <Badge className={getItemStatusColor(status)}>
      {getItemStatusLabel(status)}
    </Badge>
  );
}

export const ListView = memo(function ListView({ groupedItems, sortedDates, today }: ListViewProps) {
  if (sortedDates.length === 0) {
    return (
      <Card className="py-12 animate-in fade-in">
        <CardContent className="text-center">
          <CalendarIcon className="w-12 h-12 mx-auto text-zinc-300 mb-4" />
          <p className="text-zinc-500">No events matching your filters.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid="calendar-list-view">
      {sortedDates.map((date, dateIndex) => {
        const daysUntil = getDaysUntil(date);
        const isToday = date === today;
        const isPast = daysUntil < 0;

        return (
          <div
            key={date}
            className="animate-in fade-in slide-in-from-bottom-2"
            style={{ animationDelay: `${dateIndex * 30}ms`, animationFillMode: 'both' }}
            data-testid={`calendar-list-date-group-${date}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className={cn(
                  'flex flex-col items-center w-14 py-2 px-3 rounded-lg text-center transition-all',
                  isToday ? 'bg-zinc-900 text-white shadow-md' : isPast ? 'bg-zinc-100' : 'bg-zinc-50 hover:bg-zinc-100'
                )}
              >
                <span className={cn('text-xs', isToday ? 'text-zinc-400' : 'text-zinc-500')}>
                  {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <span className="text-xl font-bold">{new Date(date).getDate()}</span>
              </div>
              <div>
                <p className={cn('font-medium', isPast ? 'text-zinc-400' : 'text-zinc-900')}>
                  {formatDateLong(date)}
                </p>
                <p className="text-sm text-zinc-500">
                  {getRelativeDateLabel(daysUntil)}
                </p>
              </div>
            </div>
            <div className="ml-[60px] space-y-1.5">
              {groupedItems[date].map((item, itemIndex) => (
                <Card
                  key={item.id}
                  className={cn(
                    'border-l-4 transition-all hover:shadow-md',
                    getItemTypeBorderColor(item.type),
                    'animate-in fade-in slide-in-from-left-2'
                  )}
                  style={{ animationDelay: `${(dateIndex * 30) + (itemIndex * 20)}ms`, animationFillMode: 'both' }}
                  data-testid={`calendar-list-event-${item.id}`}
                >
                  <CardContent className="py-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-zinc-900 truncate">{item.title}</p>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {getItemTypeLabel(item.type)}
                          </Badge>
                        </div>
                        <p className="text-sm text-zinc-500 truncate">{item.facility_name}</p>
                      </div>
                      {getStatusBadge(item.status)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
});
