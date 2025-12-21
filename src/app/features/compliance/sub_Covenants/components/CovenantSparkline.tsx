'use client';

import React, { memo, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { CovenantTestResult, TrendDirection } from '../../lib';

interface CovenantSparklineProps {
  testHistory: CovenantTestResult[];
  className?: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatValue(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(2);
}

export function calculateTrend(history: CovenantTestResult[]): TrendDirection {
  if (history.length < 2) return 'stable';

  const recentTests = history.slice(-4);
  if (recentTests.length < 2) return 'stable';

  const headrooms = recentTests.map((t) => t.headroom_percentage);
  const firstHalf = headrooms.slice(0, Math.floor(headrooms.length / 2));
  const secondHalf = headrooms.slice(Math.floor(headrooms.length / 2));

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const diff = secondAvg - firstAvg;
  const threshold = 3;

  if (Math.abs(diff) < threshold) return 'stable';
  return diff > 0 ? 'improving' : 'declining';
}

export const CovenantSparkline = memo(function CovenantSparkline({
  testHistory,
  className,
}: CovenantSparklineProps) {
  const displayHistory = useMemo(() => {
    return testHistory.slice(-4);
  }, [testHistory]);

  const trend = useMemo(() => {
    return calculateTrend(testHistory);
  }, [testHistory]);

  const sparklineData = useMemo(() => {
    if (displayHistory.length === 0) return null;

    const headrooms = displayHistory.map((t) => t.headroom_percentage);
    const min = Math.min(...headrooms);
    const max = Math.max(...headrooms);
    const range = max - min || 1;

    const height = 24;
    const width = 48;
    const padding = 2;

    const points = headrooms.map((h, i) => {
      const x = padding + (i / Math.max(1, headrooms.length - 1)) * (width - 2 * padding);
      const normalizedY = (h - min) / range;
      const y = height - padding - normalizedY * (height - 2 * padding);
      return { x, y, headroom: h, testDate: displayHistory[i].test_date };
    });

    return { points, width, height };
  }, [displayHistory]);

  const trendIcon = useMemo(() => {
    const iconClass = 'w-3.5 h-3.5';
    switch (trend) {
      case 'improving':
        return <TrendingUp className={cn(iconClass, 'text-green-600')} data-testid="trend-improving-icon" />;
      case 'declining':
        return <TrendingDown className={cn(iconClass, 'text-red-500')} data-testid="trend-declining-icon" />;
      case 'stable':
        return <Minus className={cn(iconClass, 'text-zinc-400')} data-testid="trend-stable-icon" />;
    }
  }, [trend]);

  const trendLabel = useMemo(() => {
    switch (trend) {
      case 'improving':
        return 'Improving';
      case 'declining':
        return 'Declining';
      case 'stable':
        return 'Stable';
    }
  }, [trend]);

  const strokeColor = useMemo(() => {
    switch (trend) {
      case 'improving':
        return '#16a34a';
      case 'declining':
        return '#ef4444';
      case 'stable':
        return '#a1a1aa';
    }
  }, [trend]);

  if (!sparklineData || displayHistory.length < 2) {
    return null;
  }

  const pathD = sparklineData.points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn('flex items-center gap-1.5 cursor-pointer', className)}
            data-testid="covenant-sparkline"
          >
            <svg
              width={sparklineData.width}
              height={sparklineData.height}
              className="overflow-visible"
              data-testid="sparkline-svg"
            >
              <path
                d={pathD}
                fill="none"
                stroke={strokeColor}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {sparklineData.points.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={3}
                  fill="white"
                  stroke={strokeColor}
                  strokeWidth={1.5}
                />
              ))}
            </svg>
            {trendIcon}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="text-xs space-y-1">
            <div className="font-semibold flex items-center gap-1.5 mb-2">
              {trendIcon}
              <span>Trend: {trendLabel}</span>
            </div>
            <div className="space-y-0.5">
              {displayHistory.map((test, i) => (
                <div key={i} className="flex justify-between gap-4">
                  <span className="text-zinc-500">{formatDate(test.test_date)}</span>
                  <span
                    className={cn(
                      'font-medium',
                      test.headroom_percentage < 0
                        ? 'text-red-600'
                        : test.headroom_percentage < 15
                          ? 'text-amber-600'
                          : 'text-green-600'
                    )}
                  >
                    {test.headroom_percentage.toFixed(1)}% ({formatValue(test.calculated_ratio)})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
