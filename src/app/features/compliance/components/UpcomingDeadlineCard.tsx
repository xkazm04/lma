'use client';

import React, { memo, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { UpcomingItem } from '../lib';
import { getItemTypeColor, getItemTypeLabel } from '../lib';
import {
  getUrgencyInfo as getUrgencyInfoBase,
  getTimeDisplay,
  type UrgencyLevel,
} from '@/lib/utils/urgency';

interface UpcomingDeadlineCardProps {
  item: UpcomingItem;
  index?: number;
}

// Use hour precision for deadline cards and map 'urgent' to 'warning' for simpler display
function getUrgencyInfo(dateStr: string) {
  const urgency = getUrgencyInfoBase(dateStr, { precision: 'hours' });
  // Map 5-level urgency to 3-level for this component's simpler display
  const level: 'critical' | 'warning' | 'normal' =
    urgency.level === 'critical' || urgency.level === 'urgent'
      ? urgency.daysUntil <= 0
        ? 'critical'
        : 'warning'
      : urgency.level === 'warning'
        ? 'warning'
        : 'normal';
  return { ...urgency, level };
}

function getUrgencyBorderClass(level: 'critical' | 'warning' | 'normal'): string {
  switch (level) {
    case 'critical':
      return 'border-l-4 border-l-red-500';
    case 'warning':
      return 'border-l-4 border-l-amber-500';
    case 'normal':
      return 'border-l-4 border-l-zinc-200';
  }
}

export const UpcomingDeadlineCard = memo(function UpcomingDeadlineCard({
  item,
  index = 0
}: UpcomingDeadlineCardProps) {
  const urgency = useMemo(() => getUrgencyInfo(item.date), [item.date]);
  const timeDisplay = useMemo(() => getTimeDisplay(urgency), [urgency]);

  const isCritical = urgency.level === 'critical';
  const isWarning = urgency.level === 'warning';

  return (
    <div
      data-testid={`deadline-card-${item.id}`}
      className={cn(
        'flex items-center justify-between py-3 pl-3 pr-2 first:pt-0 last:pb-0',
        'animate-in fade-in slide-in-from-left-2',
        'rounded-r-md transition-all',
        getUrgencyBorderClass(urgency.level),
        isCritical && 'bg-red-50/50 animate-pulse-urgent',
        isWarning && 'bg-amber-50/30'
      )}
      style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className={cn(
            'flex flex-col items-center w-12 py-1 px-2 rounded text-center transition-colors',
            isCritical
              ? 'bg-red-100 hover:bg-red-200'
              : isWarning
                ? 'bg-amber-100 hover:bg-amber-200'
                : 'bg-zinc-100 hover:bg-zinc-200'
          )}
          data-testid={`deadline-date-${item.id}`}
        >
          <span className={cn(
            'text-xs',
            isCritical ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-zinc-500'
          )}>
            {new Date(item.date).toLocaleDateString('en-US', { month: 'short' })}
          </span>
          <span className={cn(
            'text-lg font-bold',
            isCritical ? 'text-red-700' : isWarning ? 'text-amber-700' : 'text-zinc-900'
          )}>
            {new Date(item.date).getDate()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p
              className={cn(
                'text-sm font-medium truncate',
                isCritical ? 'text-red-900' : 'text-zinc-900'
              )}
              data-testid={`deadline-title-${item.id}`}
            >
              {item.title}
            </p>
            <Badge
              variant="secondary"
              className={cn(getItemTypeColor(item.type), 'shrink-0')}
              data-testid={`deadline-type-badge-${item.id}`}
            >
              {getItemTypeLabel(item.type)}
            </Badge>
          </div>
          <p
            className="text-sm text-zinc-500 truncate"
            data-testid={`deadline-facility-${item.id}`}
          >
            {item.facility_name}
          </p>
        </div>
      </div>
      <Badge
        variant={isCritical ? 'destructive' : isWarning ? 'warning' : 'secondary'}
        className={cn(
          'shrink-0 ml-2',
          isCritical && 'bg-red-600 hover:bg-red-700'
        )}
        data-testid={`deadline-urgency-badge-${item.id}`}
      >
        {timeDisplay}
      </Badge>
    </div>
  );
});
