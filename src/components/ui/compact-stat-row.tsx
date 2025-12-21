'use client';

import React, { memo, useState, useEffect, useRef, useCallback } from 'react';
import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CompactStat {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  onClick?: () => void;
}

interface CompactStatRowProps {
  stats: CompactStat[];
  variant?: 'default' | 'bordered' | 'pills';
  className?: string;
  animated?: boolean;
}

// Ease-out cubic: starts fast, slows down at end
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

interface AnimatedValueProps {
  value: string | number;
  animated: boolean;
  onIncrease?: () => void;
}

const AnimatedValue = memo(function AnimatedValue({ value, animated, onIncrease }: AnimatedValueProps) {
  const numericValue = typeof value === 'number' ? value : parseFloat(value);
  const isNumeric = !isNaN(numericValue);

  const [displayValue, setDisplayValue] = useState(isNumeric && animated ? 0 : numericValue);
  const previousValueRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const startValueRef = useRef(0);
  const duration = 300;

  const animate = useCallback((timestamp: number) => {
    if (startTimeRef.current === null) {
      startTimeRef.current = timestamp;
    }

    const elapsed = timestamp - startTimeRef.current;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeOutCubic(progress);

    const currentValue = startValueRef.current + (numericValue - startValueRef.current) * easedProgress;
    setDisplayValue(Math.round(currentValue));

    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [numericValue]);

  useEffect(() => {
    if (!isNumeric || !animated) {
      return;
    }

    // Detect if this is an increase (not on initial mount)
    if (previousValueRef.current !== null && numericValue > previousValueRef.current) {
      onIncrease?.();
    }
    previousValueRef.current = numericValue;

    // Cancel any existing animation
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }

    // Reset animation state
    startTimeRef.current = null;
    startValueRef.current = displayValue;

    // Start new animation
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [numericValue, animated, isNumeric, animate, onIncrease]);

  if (!isNumeric || !animated) {
    return <>{value}</>;
  }

  return <>{displayValue}</>;
});

// Individual stat item with animation support
const StatItem = memo(function StatItem({
  stat,
  variant,
  animated,
  index,
}: {
  stat: CompactStat;
  variant: 'default' | 'bordered' | 'pills';
  animated: boolean;
  index: number;
}) {
  const [isPulsing, setIsPulsing] = useState(false);
  const isClickable = Boolean(stat.onClick);

  const handleIncrease = useCallback(() => {
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 500);
  }, []);

  return (
    <div
      data-testid={`stat-item-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
      className={cn(
        'flex-1 flex items-center gap-3 py-2.5 px-4 min-w-0 relative overflow-hidden',
        variant === 'pills' && 'border rounded-lg bg-white',
        isClickable && 'cursor-pointer hover:bg-zinc-50 transition-colors group'
      )}
      onClick={stat.onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          stat.onClick?.();
        }
      } : undefined}
    >
      {/* Pulse animation background */}
      {isPulsing && (
        <div
          className="absolute inset-0 bg-emerald-100/60 animate-pulse-once pointer-events-none"
          data-testid={`stat-pulse-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
        />
      )}
      {stat.icon && (
        <div className={cn(
          'p-1.5 rounded-lg bg-zinc-100 shrink-0 relative z-10',
          isClickable && 'group-hover:bg-zinc-200 transition-colors'
        )}>
          {stat.icon}
        </div>
      )}
      <div className="min-w-0 flex-1 relative z-10">
        <p className="text-xs text-zinc-500 truncate">{stat.label}</p>
        <p
          className="text-lg font-bold text-zinc-900 truncate tabular-nums"
          data-testid={`stat-value-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <AnimatedValue
            value={stat.value}
            animated={animated}
            onIncrease={handleIncrease}
          />
        </p>
      </div>
      {(stat.trend || stat.change) && (
        <div className="flex items-center gap-1 shrink-0 relative z-10">
          {stat.trend === 'up' && <TrendingUp className="w-3 h-3 text-green-600" />}
          {stat.trend === 'down' && <TrendingDown className="w-3 h-3 text-red-600" />}
          {stat.change && (
            <span
              className={cn(
                'text-xs',
                stat.trend === 'up' && 'text-green-600',
                stat.trend === 'down' && 'text-red-600',
                stat.trend === 'neutral' && 'text-zinc-500',
                !stat.trend && 'text-zinc-500'
              )}
            >
              {stat.change}
            </span>
          )}
        </div>
      )}
      {isClickable && (
        <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity relative z-10" />
      )}
    </div>
  );
});

export const CompactStatRow = memo(function CompactStatRow({
  stats,
  variant = 'default',
  className,
  animated = false,
}: CompactStatRowProps) {
  return (
    <div
      data-testid="compact-stat-row"
      className={cn(
        'flex items-stretch',
        variant === 'bordered' && 'border rounded-lg bg-white divide-x divide-zinc-200',
        variant === 'pills' && 'gap-2',
        variant === 'default' && 'divide-x divide-zinc-200',
        className
      )}
    >
      {stats.map((stat, i) => (
        <StatItem
          key={i}
          stat={stat}
          variant={variant}
          animated={animated}
          index={i}
        />
      ))}
    </div>
  );
});
