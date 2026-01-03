'use client';

import React, { memo, useMemo } from 'react';
import { UpcomingDeadlineCard } from './UpcomingDeadlineCard';
import type { UpcomingItem } from '../lib';
import { cn } from '@/lib/utils';
import { getDaysUntil } from '@/lib/utils/urgency';

interface GroupedDeadlinesListProps {
  items: UpcomingItem[];
}

interface DateGroup {
  date: string;
  label: string;
  isUrgent: boolean;
  isWarning: boolean;
  items: UpcomingItem[];
}

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();

  // Reset to start of day for comparison
  const dateStart = new Date(date);
  dateStart.setHours(0, 0, 0, 0);
  const nowStart = new Date(now);
  nowStart.setHours(0, 0, 0, 0);

  const daysUntil = Math.ceil((dateStart.getTime() - nowStart.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) {
    return 'Overdue';
  }
  if (daysUntil === 0) {
    return 'Today';
  }
  if (daysUntil === 1) {
    return 'Tomorrow';
  }

  // Format as "Mon, Dec 12"
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function groupItemsByDate(items: UpcomingItem[]): DateGroup[] {
  const groupMap = new Map<string, UpcomingItem[]>();

  // Group items by date
  items.forEach((item) => {
    const dateKey = item.date;
    if (!groupMap.has(dateKey)) {
      groupMap.set(dateKey, []);
    }
    groupMap.get(dateKey)!.push(item);
  });

  // Convert to array and sort by date
  const groups: DateGroup[] = Array.from(groupMap.entries())
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([date, items]) => {
      const daysUntil = getDaysUntil(date);
      return {
        date,
        label: getDateLabel(date),
        isUrgent: daysUntil <= 0,
        isWarning: daysUntil > 0 && daysUntil <= 3,
        items,
      };
    });

  return groups;
}

export const GroupedDeadlinesList = memo(function GroupedDeadlinesList({
  items,
}: GroupedDeadlinesListProps) {
  const groups = useMemo(() => groupItemsByDate(items), [items]);

  let itemIndex = 0;

  return (
    <div
      className="max-h-[350px] overflow-y-auto -mx-2"
      data-testid="grouped-deadlines-list"
    >
      {groups.map((group) => (
        <div key={group.date} className="mb-1" data-testid={`deadline-group-${group.date}`}>
          <div
            className={cn(
              'sticky top-0 z-10 py-1 px-3 text-[10px] font-semibold uppercase tracking-wider',
              'backdrop-blur-sm flex items-center gap-2',
              group.isUrgent
                ? 'bg-red-100/95 text-red-700'
                : group.isWarning
                  ? 'bg-amber-100/95 text-amber-700'
                  : 'bg-zinc-100/95 text-zinc-500'
            )}
            data-testid={`deadline-group-header-${group.date}`}
          >
            <span>{group.label}</span>
            <span className="text-[9px] font-normal opacity-70">
              {group.items.length}
            </span>
          </div>
          <div className="px-1">
            {group.items.map((item) => {
              const currentIndex = itemIndex++;
              return (
                <UpcomingDeadlineCard
                  key={item.id}
                  item={item}
                  index={currentIndex}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
});
