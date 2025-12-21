'use client';

import React, { memo } from 'react';
import { Check, Flag, Scale, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReviewStatus } from '../lib/types';
import { REVIEW_STATUS_CONFIG } from '../lib/types';

interface ReviewStatusBadgeProps {
  status: ReviewStatus;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

const IconMap = {
  check: Check,
  flag: Flag,
  scale: Scale,
  clock: Clock,
} as const;

export const ReviewStatusBadge = memo(function ReviewStatusBadge({
  status,
  size = 'sm',
  showLabel = true,
  className,
}: ReviewStatusBadgeProps) {
  const config = REVIEW_STATUS_CONFIG[status];
  const Icon = IconMap[config.icon];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border transition-colors',
        config.bgColor,
        config.borderColor,
        config.color,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        className
      )}
      data-testid={`review-status-badge-${status}`}
    >
      <Icon className={cn(size === 'sm' ? 'w-3 h-3' : 'w-4 h-4')} />
      {showLabel && <span className="font-medium">{config.label}</span>}
    </div>
  );
});
