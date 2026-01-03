'use client';

import React, { memo, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { UpcomingItem } from '../lib';
import { getItemTypeColor, getItemTypeLabel } from '../lib';
import {
  getUrgencyInfo as getUrgencyInfoBase,
  getTimeDisplay,
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

export const UpcomingDeadlineCard = memo(function UpcomingDeadlineCard({
  item,
  index = 0
}: UpcomingDeadlineCardProps) {
  const urgency = useMemo(() => getUrgencyInfo(item.date), [item.date]);
  const timeDisplay = useMemo(() => getTimeDisplay(urgency), [urgency]);

  const isCritical = urgency.level === 'critical';
  const isWarning = urgency.level === 'warning';

  const dateFormatted = new Date(item.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      data-testid={`deadline-card-${item.id}`}
      className={cn(
        'flex items-center gap-3 py-2 px-2 rounded-md transition-all hover:bg-zinc-50',
        'animate-in fade-in',
        isCritical && 'bg-red-50/50',
        isWarning && 'bg-amber-50/30'
      )}
      style={{ animationDelay: `${index * 20}ms`, animationFillMode: 'both' }}
    >
      {/* Urgency indicator dot */}
      <div
        className={cn(
          'w-2 h-2 rounded-full flex-shrink-0',
          isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-zinc-300'
        )}
      />

      {/* Date */}
      <span
        className={cn(
          'text-xs font-medium w-14 flex-shrink-0',
          isCritical ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-zinc-500'
        )}
        data-testid={`deadline-date-${item.id}`}
      >
        {dateFormatted}
      </span>

      {/* Title */}
      <span
        className={cn(
          'text-sm flex-1 truncate',
          isCritical ? 'text-red-900 font-medium' : 'text-zinc-900'
        )}
        data-testid={`deadline-title-${item.id}`}
        title={item.title}
      >
        {item.title}
      </span>

      {/* Type badge */}
      <Badge
        variant="secondary"
        className={cn('text-[10px] px-1.5 py-0 h-5 flex-shrink-0', getItemTypeColor(item.type))}
        data-testid={`deadline-type-badge-${item.id}`}
      >
        {getItemTypeLabel(item.type)}
      </Badge>

      {/* Time until */}
      <Badge
        variant={isCritical ? 'destructive' : isWarning ? 'warning' : 'secondary'}
        className={cn(
          'text-[10px] px-1.5 py-0 h-5 flex-shrink-0',
          isCritical && 'bg-red-600'
        )}
        data-testid={`deadline-urgency-badge-${item.id}`}
      >
        {timeDisplay}
      </Badge>
    </div>
  );
});
