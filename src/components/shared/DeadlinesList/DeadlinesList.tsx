'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getDaysUntil, formatDate } from '@/lib/utils/format';
import { Clock, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export type DeadlinePriority = 'critical' | 'high' | 'medium' | 'low';
export type DeadlineStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

export interface Deadline {
  id: string;
  title: string;
  description?: string;
  dueDate: string | Date;
  priority?: DeadlinePriority;
  status?: DeadlineStatus;
  type?: string;
  entityName?: string;
  entityLink?: string;
  progress?: number;
}

interface DeadlinesListProps {
  deadlines: Deadline[];
  variant?: 'progress-circle' | 'urgency-border' | 'compact' | 'calendar';
  maxItems?: number;
  groupBy?: 'date' | 'priority' | 'none';
  showViewAll?: boolean;
  onViewAll?: () => void;
  emptyMessage?: string;
  className?: string;
}

function getUrgencyLevel(daysRemaining: number): 'critical' | 'warning' | 'normal' {
  if (daysRemaining <= 0) return 'critical';
  if (daysRemaining <= 3) return 'critical';
  if (daysRemaining <= 7) return 'warning';
  return 'normal';
}

function getUrgencyColor(urgency: 'critical' | 'warning' | 'normal'): string {
  switch (urgency) {
    case 'critical':
      return 'border-red-200 bg-red-50/50';
    case 'warning':
      return 'border-amber-200 bg-amber-50/50';
    default:
      return 'border-zinc-200 bg-zinc-50/50';
  }
}

function getPriorityBadgeVariant(priority?: DeadlinePriority): 'default' | 'secondary' | 'destructive' {
  switch (priority) {
    case 'critical':
    case 'high':
      return 'destructive';
    case 'medium':
      return 'secondary';
    default:
      return 'default';
  }
}

const DeadlineItem = memo(function DeadlineItem({
  deadline,
  variant,
}: {
  deadline: Deadline;
  variant: 'progress-circle' | 'urgency-border' | 'compact' | 'calendar';
}) {
  const daysRemaining = getDaysUntil(deadline.dueDate);
  const urgency = getUrgencyLevel(daysRemaining);
  const dueDate = typeof deadline.dueDate === 'string' ? new Date(deadline.dueDate) : deadline.dueDate;

  const getDaysText = () => {
    if (daysRemaining < 0) return `${Math.abs(daysRemaining)}d overdue`;
    if (daysRemaining === 0) return 'Due today';
    if (daysRemaining === 1) return 'Due tomorrow';
    return `${daysRemaining}d remaining`;
  };

  const content = (
    <div
      className={cn(
        'flex items-center gap-4 p-3 rounded-lg transition-all',
        variant === 'urgency-border' && cn(
          'border-l-4',
          urgency === 'critical' && 'border-l-red-500 bg-red-50/30',
          urgency === 'warning' && 'border-l-amber-500 bg-amber-50/30',
          urgency === 'normal' && 'border-l-zinc-300 bg-zinc-50/30'
        ),
        variant === 'compact' && 'bg-zinc-50 hover:bg-zinc-100',
        variant === 'calendar' && getUrgencyColor(urgency),
        variant === 'progress-circle' && 'bg-zinc-50 hover:bg-zinc-100'
      )}
    >
      {/* Calendar date display for calendar variant */}
      {variant === 'calendar' && (
        <div className="flex flex-col items-center w-12 py-1 px-2 bg-white rounded text-center border shrink-0">
          <span className="text-xs text-zinc-500">
            {dueDate.toLocaleDateString('en-US', { month: 'short' })}
          </span>
          <span className="text-lg font-bold text-zinc-900">{dueDate.getDate()}</span>
        </div>
      )}

      {/* Progress circle for progress-circle variant */}
      {variant === 'progress-circle' && (
        <div className="relative w-12 h-12 shrink-0">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="#e4e4e7"
              strokeWidth="4"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke={urgency === 'critical' ? '#ef4444' : urgency === 'warning' ? '#f59e0b' : '#22c55e'}
              strokeWidth="4"
              strokeDasharray={`${((14 - Math.min(daysRemaining, 14)) / 14) * 125.6} 125.6`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
            {daysRemaining <= 0 ? '!' : daysRemaining}
          </span>
        </div>
      )}

      {/* Icon for compact/urgency-border variants */}
      {(variant === 'compact' || variant === 'urgency-border') && (
        <div className={cn(
          'p-2 rounded-lg shrink-0',
          urgency === 'critical' && 'bg-red-100',
          urgency === 'warning' && 'bg-amber-100',
          urgency === 'normal' && 'bg-zinc-100'
        )}>
          {deadline.status === 'completed' ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : urgency === 'critical' ? (
            <AlertTriangle className="w-4 h-4 text-red-600" />
          ) : (
            <Clock className="w-4 h-4 text-amber-600" />
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-zinc-900 truncate">{deadline.title}</p>
          {deadline.priority && (
            <Badge variant={getPriorityBadgeVariant(deadline.priority)} className="text-xs">
              {deadline.priority}
            </Badge>
          )}
        </div>
        {deadline.description && (
          <p className="text-xs text-zinc-500 truncate mt-0.5">{deadline.description}</p>
        )}
        <p className={cn(
          'text-xs mt-0.5',
          urgency === 'critical' && 'text-red-600 font-medium',
          urgency === 'warning' && 'text-amber-600',
          urgency === 'normal' && 'text-zinc-500'
        )}>
          {getDaysText()}
        </p>
      </div>

      {/* Type badge */}
      {deadline.type && (
        <Badge variant="outline" className="shrink-0">{deadline.type}</Badge>
      )}

      {/* Progress bar if provided */}
      {deadline.progress !== undefined && (
        <div className="w-20 shrink-0">
          <Progress value={deadline.progress} className="h-1.5" />
          <p className="text-xs text-zinc-500 mt-1 text-center">{deadline.progress}%</p>
        </div>
      )}
    </div>
  );

  if (deadline.entityLink) {
    return (
      <Link href={deadline.entityLink} className="block">
        {content}
      </Link>
    );
  }

  return content;
});

/**
 * DeadlinesList - Unified deadline/upcoming items display
 *
 * Replaces multiple deadline section implementations across modules
 * with a single, configurable component.
 */
export const DeadlinesList = memo(function DeadlinesList({
  deadlines,
  variant = 'compact',
  maxItems,
  groupBy = 'none',
  showViewAll = false,
  onViewAll,
  emptyMessage = 'No upcoming deadlines',
  className,
}: DeadlinesListProps) {
  const displayDeadlines = maxItems ? deadlines.slice(0, maxItems) : deadlines;

  const groupedDeadlines = useMemo(() => {
    if (groupBy === 'none') {
      return { all: displayDeadlines };
    }

    if (groupBy === 'priority') {
      return displayDeadlines.reduce((acc, deadline) => {
        const priority = deadline.priority || 'low';
        if (!acc[priority]) acc[priority] = [];
        acc[priority].push(deadline);
        return acc;
      }, {} as Record<string, Deadline[]>);
    }

    // Group by date (today, tomorrow, this week, later)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return displayDeadlines.reduce((acc, deadline) => {
      const daysUntil = getDaysUntil(deadline.dueDate);
      let group: string;

      if (daysUntil < 0) group = 'Overdue';
      else if (daysUntil === 0) group = 'Today';
      else if (daysUntil === 1) group = 'Tomorrow';
      else if (daysUntil <= 7) group = 'This Week';
      else group = 'Later';

      if (!acc[group]) acc[group] = [];
      acc[group].push(deadline);
      return acc;
    }, {} as Record<string, Deadline[]>);
  }, [displayDeadlines, groupBy]);

  if (displayDeadlines.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <Calendar className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
        <p className="text-sm text-zinc-500">{emptyMessage}</p>
      </div>
    );
  }

  const groupOrder = groupBy === 'priority'
    ? ['critical', 'high', 'medium', 'low']
    : ['Overdue', 'Today', 'Tomorrow', 'This Week', 'Later', 'all'];

  return (
    <div className={cn('space-y-4', className)}>
      {groupOrder.map((group) => {
        const items = groupedDeadlines[group];
        if (!items?.length) return null;

        return (
          <div key={group}>
            {group !== 'all' && (
              <h4 className={cn(
                'text-xs font-medium uppercase tracking-wide mb-2',
                group === 'Overdue' && 'text-red-600',
                group === 'Today' && 'text-amber-600',
                group === 'critical' && 'text-red-600',
                group === 'high' && 'text-orange-600',
                !['Overdue', 'Today', 'critical', 'high'].includes(group) && 'text-zinc-500'
              )}>
                {group}
              </h4>
            )}
            <div className="space-y-2">
              {items.map((deadline) => (
                <DeadlineItem key={deadline.id} deadline={deadline} variant={variant} />
              ))}
            </div>
          </div>
        );
      })}

      {showViewAll && deadlines.length > (maxItems || 0) && (
        <button
          onClick={onViewAll}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View all {deadlines.length} deadlines
        </button>
      )}
    </div>
  );
});

export default DeadlinesList;
