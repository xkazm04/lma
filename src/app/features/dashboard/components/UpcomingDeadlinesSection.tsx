'use client';

import React, { memo } from 'react';
import { AlertTriangle, Clock, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CompactDataTable, type ColumnDef } from '@/components/ui/compact-data-table';
import { CircularProgress } from '@/components/ui/circular-progress';
import { cn } from '@/lib/utils';
import type { DeadlineItem as DeadlineItemType } from '../lib/mocks';

interface UpcomingDeadlinesSectionProps {
  deadlines: DeadlineItemType[];
}

const priorityIcons = {
  high: AlertTriangle,
  medium: Clock,
  low: Info,
} as const;

const priorityColors = {
  high: 'text-red-500',
  medium: 'text-amber-500',
  low: 'text-zinc-400',
} as const;

function calculateDeadlineProgress(daysRemaining: number, totalDays: number = 60): number {
  if (daysRemaining <= 0) return 100;
  if (daysRemaining >= totalDays) return 0;
  return Math.round(((totalDays - daysRemaining) / totalDays) * 100);
}

const columns: ColumnDef<DeadlineItemType>[] = [
  {
    key: 'progress',
    width: '44px',
    render: (deadline) => {
      const progress = calculateDeadlineProgress(deadline.daysRemaining);
      return (
        <CircularProgress
          value={progress}
          size={36}
          strokeWidth={3}
        >
          <span className="text-[9px] font-medium">{deadline.daysRemaining}d</span>
        </CircularProgress>
      );
    },
  },
  {
    key: 'content',
    flex: 1,
    render: (deadline) => {
      const PriorityIcon = priorityIcons[deadline.priority];
      return (
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium text-zinc-900 truncate">{deadline.title}</p>
            <PriorityIcon className={cn('w-3.5 h-3.5 shrink-0', priorityColors[deadline.priority])} />
          </div>
          <p className="text-xs text-zinc-500 truncate">{deadline.loan}</p>
        </div>
      );
    },
  },
  {
    key: 'date',
    width: '90px',
    align: 'right',
    render: (deadline) => (
      <div className="text-right">
        <p className="text-xs font-medium text-zinc-900">{deadline.dueDate}</p>
        <p className="text-[10px] text-zinc-400 capitalize">{deadline.type}</p>
      </div>
    ),
  },
];

export const UpcomingDeadlinesSection = memo(function UpcomingDeadlinesSection({
  deadlines,
}: UpcomingDeadlinesSectionProps) {
  return (
    <Card
      className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full"
      style={{ animationDelay: '100ms', animationFillMode: 'both' }}
    >
      <CardHeader className="flex flex-row items-center justify-between py-2.5 px-3 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-amber-50">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
        </div>
        <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-zinc-500 hover:text-zinc-900">
          View all
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <CompactDataTable
          data={deadlines}
          columns={columns}
          rowHeight="sm"
          showHeader={false}
          maxHeight="260px"
          emptyMessage="No upcoming deadlines"
        />
      </CardContent>
    </Card>
  );
});
