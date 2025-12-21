'use client';

import React, { memo, useMemo, useState, useEffect, useCallback } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface HeadroomProgressBarProps {
  /** Current headroom percentage (can be negative) */
  headroom: number;
  /** Previous headroom percentage for trend comparison (optional) */
  previousHeadroom?: number;
  /** Additional class names */
  className?: string;
}

// Threshold constants for zones
const DANGER_ZONE_END = 10;
const WARNING_ZONE_END = 20;
const PULSE_THRESHOLD = 15;

/**
 * Calculates the trend direction and difference
 */
function getTrend(current: number, previous?: number): {
  direction: 'up' | 'down' | 'stable';
  difference: number;
} {
  if (previous === undefined) {
    return { direction: 'stable', difference: 0 };
  }
  const diff = current - previous;
  if (Math.abs(diff) < 0.5) {
    return { direction: 'stable', difference: diff };
  }
  return {
    direction: diff > 0 ? 'up' : 'down',
    difference: diff,
  };
}

/**
 * Get glow color based on headroom zone
 */
function getGlowColor(headroom: number): string {
  if (headroom < 0) return 'rgba(220, 38, 38, 0.6)'; // red-600
  if (headroom < DANGER_ZONE_END) return 'rgba(239, 68, 68, 0.5)'; // red-500
  if (headroom < WARNING_ZONE_END) return 'rgba(245, 158, 11, 0.5)'; // amber-500
  return 'rgba(34, 197, 94, 0.4)'; // green-500
}

/**
 * HeadroomProgressBar with multi-zone gradient background
 * Features:
 * - Smooth gradient from red (0-10%) through amber (10-20%) to green (20%+)
 * - Glow effect around current value indicator
 * - Spring animation when values change
 * - Animated marker showing exact position on hover
 */
export const HeadroomProgressBar = memo(function HeadroomProgressBar({
  headroom,
  previousHeadroom,
  className,
}: HeadroomProgressBarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const normalizedValue = useMemo(
    () => Math.max(0, Math.min(100, headroom)),
    [headroom]
  );

  // Spring animation effect when value changes
  useEffect(() => {
    setIsAnimating(true);
    const startValue = animatedValue;
    const targetValue = normalizedValue;
    const duration = 800; // ms
    const startTime = performance.now();

    // Spring physics parameters
    const stiffness = 100;
    const damping = 15;

    function springInterpolate(t: number): number {
      // Critically damped spring equation approximation
      const progress = 1 - Math.exp(-stiffness * t / 1000) * Math.cos(damping * t / 100);
      return Math.min(1, Math.max(0, progress));
    }

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const t = Math.min(elapsed / duration, 1);

      // Apply spring easing
      const springT = springInterpolate(elapsed);
      const currentValue = startValue + (targetValue - startValue) * springT;

      setAnimatedValue(currentValue);

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        setAnimatedValue(targetValue);
        setIsAnimating(false);
      }
    }

    requestAnimationFrame(animate);
  }, [normalizedValue]);

  const shouldPulse = headroom >= 0 && headroom < PULSE_THRESHOLD;
  const trend = useMemo(
    () => getTrend(headroom, previousHeadroom),
    [headroom, previousHeadroom]
  );

  const TrendIcon = useMemo(() => {
    switch (trend.direction) {
      case 'up':
        return TrendingUp;
      case 'down':
        return TrendingDown;
      default:
        return Minus;
    }
  }, [trend.direction]);

  const trendColor = useMemo(() => {
    if (trend.direction === 'up') return 'text-green-600';
    if (trend.direction === 'down') return 'text-red-600';
    return 'text-zinc-500';
  }, [trend.direction]);

  const glowColor = useMemo(() => getGlowColor(headroom), [headroom]);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  // Multi-zone gradient background (always visible)
  const gradientBackground = `linear-gradient(to right,
    #dc2626 0%,
    #ef4444 ${DANGER_ZONE_END}%,
    #f59e0b ${DANGER_ZONE_END}%,
    #fbbf24 ${WARNING_ZONE_END}%,
    #22c55e ${WARNING_ZONE_END}%,
    #16a34a 100%
  )`;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div
            className={cn('relative w-full cursor-pointer', className)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            data-testid="headroom-progress-bar"
          >
            {/* Progress bar container with multi-zone gradient */}
            <div
              className="relative h-3.5 w-full rounded-full overflow-hidden"
              style={{
                background: 'linear-gradient(to right, rgba(220,38,38,0.15) 0%, rgba(220,38,38,0.15) 10%, rgba(245,158,11,0.12) 10%, rgba(245,158,11,0.12) 20%, rgba(34,197,94,0.08) 20%, rgba(34,197,94,0.08) 100%)',
              }}
              data-testid="headroom-progress-container"
            >
              {/* Gradient fill up to current value */}
              <div
                className={cn(
                  'absolute inset-y-0 left-0 rounded-full',
                  shouldPulse && 'animate-pulse'
                )}
                style={{
                  width: `${animatedValue}%`,
                  background: gradientBackground,
                  backgroundSize: '100vw 100%',
                  backgroundPosition: 'left',
                  transition: isAnimating ? 'none' : 'width 0.3s ease-out',
                }}
                data-testid="headroom-progress-fill"
              />

              {/* Glow effect at current position */}
              <div
                className={cn(
                  'absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full pointer-events-none transition-opacity duration-300',
                  isAnimating && 'opacity-100',
                  !isAnimating && headroom < DANGER_ZONE_END && 'opacity-80',
                  !isAnimating && headroom >= DANGER_ZONE_END && 'opacity-50'
                )}
                style={{
                  left: `calc(${animatedValue}% - 12px)`,
                  background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
                  filter: 'blur(4px)',
                }}
                data-testid="headroom-glow"
              />

              {/* Current value indicator (pill) */}
              <div
                className={cn(
                  'absolute top-1/2 -translate-y-1/2 w-1 h-5 rounded-full transition-all duration-300',
                  'bg-white shadow-md border border-zinc-200',
                  isHovered && 'w-1.5 h-6 shadow-lg'
                )}
                style={{
                  left: `calc(${animatedValue}% - ${isHovered ? 3 : 2}px)`,
                  boxShadow: `0 0 8px 2px ${glowColor}`,
                }}
                data-testid="headroom-indicator"
              />

              {/* Animated hover marker showing exact position */}
              <div
                className={cn(
                  'absolute -top-8 transform -translate-x-1/2 transition-all duration-200 pointer-events-none',
                  isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                )}
                style={{
                  left: `${animatedValue}%`,
                }}
                data-testid="headroom-hover-marker"
              >
                <div
                  className={cn(
                    'px-2 py-1 rounded-md text-xs font-semibold text-white shadow-lg',
                    headroom < 0 && 'bg-red-600',
                    headroom >= 0 && headroom < DANGER_ZONE_END && 'bg-red-500',
                    headroom >= DANGER_ZONE_END && headroom < WARNING_ZONE_END && 'bg-amber-500',
                    headroom >= WARNING_ZONE_END && 'bg-green-500'
                  )}
                >
                  {headroom.toFixed(1)}%
                </div>
                {/* Arrow pointing down */}
                <div
                  className={cn(
                    'absolute left-1/2 -translate-x-1/2 w-0 h-0',
                    'border-l-4 border-r-4 border-t-4 border-transparent',
                    headroom < 0 && 'border-t-red-600',
                    headroom >= 0 && headroom < DANGER_ZONE_END && 'border-t-red-500',
                    headroom >= DANGER_ZONE_END && headroom < WARNING_ZONE_END && 'border-t-amber-500',
                    headroom >= WARNING_ZONE_END && 'border-t-green-500'
                  )}
                />
              </div>
            </div>

            {/* Zone labels below the bar */}
            <div className="relative h-4 mt-1 flex text-[9px] font-medium">
              <div
                className="text-red-500/70 text-center"
                style={{ width: `${DANGER_ZONE_END}%` }}
              >
                Danger
              </div>
              <div
                className="text-amber-500/70 text-center"
                style={{ width: `${WARNING_ZONE_END - DANGER_ZONE_END}%` }}
              >
                Warning
              </div>
              <div className="text-green-500/70 flex-1 text-center">
                Safe
              </div>
            </div>
          </div>
        </TooltipTrigger>

        <TooltipContent
          side="top"
          className="max-w-xs"
          data-testid="headroom-tooltip"
        >
          <div className="space-y-2 py-1">
            {/* Current headroom */}
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-zinc-500">Current Headroom:</span>
              <span
                className={cn(
                  'font-semibold',
                  headroom < 0 && 'text-red-600',
                  headroom >= 0 && headroom < DANGER_ZONE_END && 'text-red-500',
                  headroom >= DANGER_ZONE_END && headroom < WARNING_ZONE_END && 'text-amber-600',
                  headroom >= WARNING_ZONE_END && 'text-green-600'
                )}
              >
                {headroom.toFixed(1)}%
              </span>
            </div>

            {/* Trend vs prior test */}
            {previousHeadroom !== undefined && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-zinc-500">vs Prior Test:</span>
                <div className="flex items-center gap-1">
                  <TrendIcon className={cn('w-3 h-3', trendColor)} />
                  <span className={cn('font-medium text-sm', trendColor)}>
                    {trend.difference > 0 ? '+' : ''}
                    {trend.difference.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}

            {/* Visual zone legend */}
            <div className="pt-2 border-t border-zinc-100">
              <div
                className="h-2 rounded-full mb-2"
                style={{ background: gradientBackground }}
              />
              <div className="flex justify-between text-[10px] text-zinc-500">
                <span>0%</span>
                <span className="text-red-500">10%</span>
                <span className="text-amber-500">20%</span>
                <span className="text-green-500">100%</span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

export default HeadroomProgressBar;
