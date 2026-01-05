'use client';

import React, { memo } from 'react';
import { Check, Flag, Scale, Clock, ChevronDown, AlertCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ReviewStatus } from '../lib/types';
import { REVIEW_STATUS_CONFIG } from '../lib/types';

interface ReviewStatusDropdownProps {
  currentStatus: ReviewStatus;
  onStatusChange: (status: ReviewStatus) => void;
  disabled?: boolean;
  canMarkAsReviewed?: boolean;
}

const IconMap = {
  check: Check,
  flag: Flag,
  scale: Scale,
  clock: Clock,
} as const;

const statusOrder: ReviewStatus[] = ['pending', 'reviewed', 'flagged', 'requires_legal'];

export const ReviewStatusDropdown = memo(function ReviewStatusDropdown({
  currentStatus,
  onStatusChange,
  disabled = false,
  canMarkAsReviewed = true,
}: ReviewStatusDropdownProps) {
  const currentConfig = REVIEW_STATUS_CONFIG[currentStatus];
  const CurrentIcon = IconMap[currentConfig.icon];

  const handleStatusChange = (status: ReviewStatus) => {
    // Block "reviewed" status if threads are not all resolved
    if (status === 'reviewed' && !canMarkAsReviewed) {
      return;
    }
    onStatusChange(status);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-7 gap-1.5 transition-colors',
            currentConfig.bgColor,
            currentConfig.color,
            'hover:opacity-80'
          )}
          data-testid="review-status-dropdown-trigger"
        >
          <CurrentIcon className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">{currentConfig.label}</span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64" data-testid="review-status-dropdown-content">
        {statusOrder.map((status) => {
          const config = REVIEW_STATUS_CONFIG[status];
          const Icon = IconMap[config.icon];
          const isSelected = status === currentStatus;
          const isReviewedBlocked = status === 'reviewed' && !canMarkAsReviewed;

          if (isReviewedBlocked) {
            return (
              <TooltipProvider key={status}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'flex items-center gap-2 px-2 py-1.5 text-sm cursor-not-allowed opacity-50'
                      )}
                      data-testid={`review-status-option-${status}`}
                    >
                      <Icon className={cn('w-4 h-4', config.color)} />
                      <span className="flex-1">{config.label}</span>
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <p className="text-xs">
                      All comment threads must be resolved before marking as Reviewed
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }

          return (
            <DropdownMenuItem
              key={status}
              onClick={() => handleStatusChange(status)}
              className={cn(
                'gap-2 cursor-pointer',
                isSelected && 'bg-zinc-100'
              )}
              data-testid={`review-status-option-${status}`}
            >
              <Icon className={cn('w-4 h-4', config.color)} />
              <span className={cn('flex-1', isSelected && 'font-medium')}>
                {config.label}
              </span>
              {isSelected && <Check className="w-4 h-4 text-zinc-600" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
