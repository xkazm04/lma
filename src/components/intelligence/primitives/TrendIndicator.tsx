'use client';

import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { trendConfig } from '../config';
import type { TrendDirection } from '../types';

export interface TrendIndicatorProps {
  /** Trend direction */
  trend: TrendDirection;
  /** Show label text */
  showLabel?: boolean;
  /** Show change value */
  changeValue?: string | number;
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
}

export const TrendIndicator = memo(function TrendIndicator({
  trend,
  showLabel = false,
  changeValue,
  size = 'sm',
  className,
}: TrendIndicatorProps) {
  const config = trendConfig[trend];
  const Icon = config.icon;

  const sizeClasses = {
    sm: { icon: 'w-3 h-3', text: 'text-[10px]' },
    md: { icon: 'w-4 h-4', text: 'text-xs' },
    lg: { icon: 'w-5 h-5', text: 'text-sm' },
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1',
        config.color,
        className
      )}
    >
      <Icon className={sizeClasses[size].icon} />
      {changeValue !== undefined && (
        <span className={cn('font-medium', sizeClasses[size].text)}>
          {typeof changeValue === 'number' && changeValue > 0 ? '+' : ''}
          {changeValue}
        </span>
      )}
      {showLabel && (
        <span className={cn('capitalize', sizeClasses[size].text)}>
          {config.label}
        </span>
      )}
    </span>
  );
});
