'use client';

import React, { memo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TrendDirection = 'up' | 'down' | 'stable' | 'neutral' | 'improving' | 'deteriorating';

interface TrendIconProps {
  trend: TrendDirection;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  colorize?: boolean;
}

const sizeClasses = {
  sm: 'w-2.5 h-2.5',
  md: 'w-3.5 h-3.5',
  lg: 'w-4 h-4',
} as const;

function getTrendColor(trend: TrendDirection, colorize: boolean): string {
  if (!colorize) return '';

  switch (trend) {
    case 'up':
    case 'improving':
      return 'text-green-500';
    case 'down':
    case 'deteriorating':
      return 'text-red-500';
    case 'stable':
    case 'neutral':
    default:
      return 'text-zinc-400';
  }
}

function isUpTrend(trend: TrendDirection): boolean {
  return trend === 'up' || trend === 'improving';
}

function isDownTrend(trend: TrendDirection): boolean {
  return trend === 'down' || trend === 'deteriorating';
}

export const TrendIcon = memo(function TrendIcon({
  trend,
  className,
  size = 'md',
  colorize = false,
}: TrendIconProps) {
  const sizeClass = sizeClasses[size];
  const colorClass = getTrendColor(trend, colorize);
  const combinedClassName = cn(sizeClass, colorClass, className);

  if (isUpTrend(trend)) {
    return <TrendingUp className={combinedClassName} data-testid="trend-icon-up" />;
  }

  if (isDownTrend(trend)) {
    return <TrendingDown className={combinedClassName} data-testid="trend-icon-down" />;
  }

  return <Minus className={combinedClassName} data-testid="trend-icon-stable" />;
});

export default TrendIcon;
