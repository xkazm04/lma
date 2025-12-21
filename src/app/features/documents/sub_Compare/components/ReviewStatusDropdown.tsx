'use client';

import React, { memo } from 'react';
import { Check, Flag, Scale, Clock, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ReviewStatus } from '../lib/types';
import { REVIEW_STATUS_CONFIG } from '../lib/types';

interface ReviewStatusDropdownProps {
  currentStatus: ReviewStatus;
  onStatusChange: (status: ReviewStatus) => void;
  disabled?: boolean;
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
}: ReviewStatusDropdownProps) {
  const currentConfig = REVIEW_STATUS_CONFIG[currentStatus];
  const CurrentIcon = IconMap[currentConfig.icon];

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
      <DropdownMenuContent align="end" className="w-52" data-testid="review-status-dropdown-content">
        {statusOrder.map((status) => {
          const config = REVIEW_STATUS_CONFIG[status];
          const Icon = IconMap[config.icon];
          const isSelected = status === currentStatus;

          return (
            <DropdownMenuItem
              key={status}
              onClick={() => onStatusChange(status)}
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
