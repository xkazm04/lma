'use client';

import React, { memo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { trendConfig, domainConfig } from '../config';
import type { Domain, TrendDirection } from '../types';

interface StatItem {
  id: string;
  label: string;
  value: string | number;
  change?: string;
  changeDirection?: 'up' | 'down' | 'neutral';
  trend?: TrendDirection;
  icon?: LucideIcon;
  iconColorClass?: string;
  onClick?: () => void;
}

interface StatsBarProps {
  /** Domain context */
  domain?: Domain;
  /** Stats to display */
  stats: StatItem[];
  /** Display variant */
  variant?: 'horizontal' | 'vertical' | 'grid';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show dividers between stats */
  showDividers?: boolean;
  /** Additional className */
  className?: string;
  /** Test ID */
  testId?: string;
}

export const StatsBar = memo(function StatsBar({
  domain,
  stats,
  variant = 'horizontal',
  size = 'md',
  showDividers = true,
  className,
  testId,
}: StatsBarProps) {
  const domConfig = domain ? domainConfig[domain] : null;

  const sizeClasses = {
    sm: {
      label: 'text-[10px]',
      value: 'text-sm font-semibold',
      change: 'text-[10px]',
      icon: 'w-3 h-3',
      padding: 'px-2 py-1.5',
    },
    md: {
      label: 'text-xs',
      value: 'text-lg font-bold',
      change: 'text-xs',
      icon: 'w-4 h-4',
      padding: 'px-3 py-2',
    },
    lg: {
      label: 'text-sm',
      value: 'text-2xl font-bold',
      change: 'text-sm',
      icon: 'w-5 h-5',
      padding: 'px-4 py-3',
    },
  };

  const sizes = sizeClasses[size];

  const renderStat = (stat: StatItem, index: number) => {
    const Icon = stat.icon;
    const TrendIcon = stat.trend ? trendConfig[stat.trend].icon : null;
    const trendColor = stat.trend ? trendConfig[stat.trend].color : '';

    const changeColor =
      stat.changeDirection === 'up'
        ? 'text-green-600'
        : stat.changeDirection === 'down'
          ? 'text-red-600'
          : 'text-zinc-500';

    return (
      <div
        key={stat.id}
        className={cn(
          'flex flex-col',
          sizes.padding,
          stat.onClick && 'cursor-pointer hover:bg-zinc-50 transition-colors rounded-lg',
          variant === 'horizontal' && 'flex-1 min-w-0',
          variant === 'vertical' && 'w-full',
          variant === 'grid' && 'min-w-0'
        )}
        onClick={stat.onClick}
        data-testid={`stat-${stat.id}`}
      >
        <div className="flex items-center gap-1 mb-0.5">
          {Icon && (
            <Icon className={cn(sizes.icon, stat.iconColorClass || 'text-zinc-400')} />
          )}
          <span className={cn(sizes.label, 'text-zinc-500 truncate')}>
            {stat.label}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className={cn(sizes.value, 'text-zinc-900')}>{stat.value}</span>
          {TrendIcon && (
            <TrendIcon className={cn(sizes.icon, trendColor)} />
          )}
          {stat.change && (
            <span className={cn(sizes.change, 'font-medium', changeColor)}>
              {stat.change}
            </span>
          )}
        </div>
      </div>
    );
  };

  // Horizontal layout
  if (variant === 'horizontal') {
    return (
      <div
        className={cn(
          'flex items-stretch rounded-lg border bg-white',
          showDividers && 'divide-x divide-zinc-100',
          className
        )}
        data-testid={testId || 'stats-bar'}
      >
        {stats.map((stat, index) => renderStat(stat, index))}
      </div>
    );
  }

  // Vertical layout
  if (variant === 'vertical') {
    return (
      <div
        className={cn(
          'flex flex-col rounded-lg border bg-white',
          showDividers && 'divide-y divide-zinc-100',
          className
        )}
        data-testid={testId || 'stats-bar'}
      >
        {stats.map((stat, index) => renderStat(stat, index))}
      </div>
    );
  }

  // Grid layout
  return (
    <div
      className={cn(
        'grid gap-3 rounded-lg',
        stats.length <= 2 && 'grid-cols-2',
        stats.length === 3 && 'grid-cols-3',
        stats.length >= 4 && 'grid-cols-2 sm:grid-cols-4',
        className
      )}
      data-testid={testId || 'stats-bar'}
    >
      {stats.map((stat, index) => (
        <div
          key={stat.id}
          className="p-3 rounded-lg border bg-white"
        >
          {renderStat(stat, index)}
        </div>
      ))}
    </div>
  );
});
