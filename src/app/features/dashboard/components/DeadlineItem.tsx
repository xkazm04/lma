'use client';

import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { CircularProgress } from '@/components/ui/circular-progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { DeadlineItem as DeadlineItemType } from '../lib/mocks';
import { priorityIcons, priorityConfig, type PriorityLevel } from '../lib/theme';

interface DeadlineItemProps {
  deadline: DeadlineItemType;
  index?: number;
  /**
   * Total days for the deadline period (used to calculate progress).
   * Defaults to 60 days (typical compliance cycle).
   */
  totalDays?: number;
}

/**
 * Calculates the progress percentage based on days remaining.
 * Progress increases as deadline approaches (0% = just started, 100% = due now/overdue).
 */
function calculateDeadlineProgress(daysRemaining: number, totalDays: number): number {
  if (daysRemaining <= 0) return 100;
  if (daysRemaining >= totalDays) return 0;
  return Math.round(((totalDays - daysRemaining) / totalDays) * 100);
}

export const DeadlineItem = memo(function DeadlineItem({
  deadline,
  index = 0,
  totalDays = 60,
}: DeadlineItemProps) {
  const priority = deadline.priority as PriorityLevel;
  const PriorityIcon = priorityIcons[priority] || priorityIcons.low;
  const progress = calculateDeadlineProgress(deadline.daysRemaining, totalDays);

  return (
    <div
      className={cn(
        'flex items-center gap-3 py-3 border-b border-zinc-100 last:border-0',
        'transition-all duration-200 hover:bg-zinc-50/50',
        'animate-in fade-in slide-in-from-right-2'
      )}
      style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'both' }}
      data-testid={`deadline-item-${index}`}
    >
      {/* Circular Progress Indicator */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex-shrink-0">
              <CircularProgress
                value={progress}
                size={44}
                strokeWidth={4}
                animate
                animationDelay={index * 50 + 100}
                data-testid={`deadline-progress-${index}`}
              >
                <span className="text-[10px]">{deadline.daysRemaining}d</span>
              </CircularProgress>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" data-testid={`deadline-tooltip-${index}`}>
            <p className="text-xs">
              {deadline.daysRemaining} days remaining
              <br />
              <span className="text-zinc-400">{Math.round(100 - progress)}% time left</span>
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-zinc-900">{deadline.title}</p>
          <PriorityIcon
            className={cn('h-4 w-4 flex-shrink-0', priorityConfig[priority]?.iconColor || 'text-zinc-400')}
            aria-label={`${deadline.priority} priority`}
            data-testid={`deadline-priority-icon-${deadline.priority}`}
          />
        </div>
        <p className="text-sm text-zinc-500 truncate">{deadline.loan}</p>
      </div>

      {/* Date Info */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-medium text-zinc-900">{deadline.dueDate}</p>
        <p className="text-xs text-zinc-400 capitalize">{deadline.type}</p>
      </div>
    </div>
  );
});
