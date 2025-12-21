'use client';

import React, { memo } from 'react';
import { ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trendConfig } from '../config';
import type { MetricItem, MetricCardProps } from '../types';

export const MetricCard = memo(function MetricCard({
  metric,
  variant = 'full',
  className,
  testId,
}: MetricCardProps) {
  const Icon = metric.icon;
  const TrendIcon = metric.trend ? trendConfig[metric.trend].icon : Minus;
  const trendColor = metric.trend ? trendConfig[metric.trend].color : 'text-zinc-400';

  const changeColor = metric.changeDirection === 'up' ? 'text-green-600' :
    metric.changeDirection === 'down' ? 'text-red-600' : 'text-zinc-500';

  // Inline variant - minimal, for embedding in text
  if (variant === 'inline') {
    return (
      <span
        className={cn('inline-flex items-center gap-1', className)}
        data-testid={testId || `metric-inline-${metric.id}`}
      >
        {Icon && <Icon className="w-3 h-3 text-zinc-400" />}
        <span className="font-medium text-zinc-900">{metric.value}</span>
        {metric.trend && <TrendIcon className={cn('w-3 h-3', trendColor)} />}
      </span>
    );
  }

  // Compact variant - horizontal, abbreviated
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-2 rounded-lg bg-zinc-50 transition-all',
          metric.onClick && 'cursor-pointer hover:bg-zinc-100',
          className
        )}
        onClick={metric.onClick}
        data-testid={testId || `metric-compact-${metric.id}`}
      >
        {Icon && (
          <div className={cn('p-1.5 rounded-lg', metric.iconBgClass || 'bg-white')}>
            <Icon className={cn('w-4 h-4', metric.iconColorClass || 'text-zinc-600')} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-zinc-500 truncate">{metric.label}</p>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-zinc-900">{metric.value}</span>
            {metric.trend && <TrendIcon className={cn('w-3 h-3', trendColor)} />}
            {metric.change && (
              <span className={cn('text-[10px] font-medium', changeColor)}>
                {metric.change}
              </span>
            )}
          </div>
        </div>
        {metric.onClick && (
          <ChevronRight className="w-4 h-4 text-zinc-300" />
        )}
      </div>
    );
  }

  // Full variant - card with icon, value, trend, and optional drilldown
  return (
    <div
      className={cn(
        'p-4 rounded-lg border bg-white transition-all',
        metric.onClick && 'cursor-pointer hover:shadow-md hover:border-zinc-300 group',
        className
      )}
      onClick={metric.onClick}
      data-testid={testId || `metric-full-${metric.id}`}
    >
      <div className="flex items-start justify-between mb-2">
        {Icon && (
          <div className={cn('p-2 rounded-lg', metric.iconBgClass || 'bg-zinc-100')}>
            <Icon className={cn('w-5 h-5', metric.iconColorClass || 'text-zinc-600')} />
          </div>
        )}
        {metric.onClick && (
          <ChevronRight className="w-4 h-4 text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>

      <div>
        <p className="text-xs text-zinc-500 mb-1">{metric.label}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-zinc-900">{metric.value}</span>
          {metric.trend && (
            <span className={cn('flex items-center gap-0.5', trendColor)}>
              <TrendIcon className="w-4 h-4" />
              {metric.change && (
                <span className="text-sm font-medium">{metric.change}</span>
              )}
            </span>
          )}
        </div>
        {metric.subValue && (
          <p className="text-xs text-zinc-400 mt-1">{metric.subValue}</p>
        )}
      </div>

      {metric.drilldownLabel && metric.onClick && (
        <p className="text-[10px] text-zinc-400 mt-2 pt-2 border-t border-zinc-100">
          Click to {metric.drilldownLabel}
        </p>
      )}
    </div>
  );
});
