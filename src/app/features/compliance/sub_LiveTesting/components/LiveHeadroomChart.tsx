'use client';

import React, { memo, useMemo } from 'react';
import type { LiveCovenant } from '../lib/types';
import { cn } from '@/lib/utils';

interface LiveHeadroomChartProps {
  covenant: LiveCovenant;
}

export const LiveHeadroomChart = memo(function LiveHeadroomChart({
  covenant,
}: LiveHeadroomChartProps) {
  // Generate historical + projected data points for visualization
  const chartData = useMemo(() => {
    const points = [];

    // Historical points (if available)
    if (covenant.headroom_30d_ago !== null) {
      points.push({
        label: '30d ago',
        value: covenant.headroom_30d_ago,
        isProjected: false,
        isPast: true,
      });
    }

    if (covenant.headroom_7d_ago !== null) {
      points.push({
        label: '7d ago',
        value: covenant.headroom_7d_ago,
        isProjected: false,
        isPast: true,
      });
    }

    if (covenant.headroom_24h_ago !== null) {
      points.push({
        label: '24h ago',
        value: covenant.headroom_24h_ago,
        isProjected: false,
        isPast: true,
      });
    }

    // Current point
    points.push({
      label: 'Now',
      value: covenant.current_headroom_percentage,
      isProjected: false,
      isPast: false,
    });

    // Projected points
    if (covenant.projected_headroom_7d !== null) {
      points.push({
        label: '7d',
        value: covenant.projected_headroom_7d,
        isProjected: true,
        isPast: false,
      });
    }

    if (covenant.projected_headroom_30d !== null) {
      points.push({
        label: '30d',
        value: covenant.projected_headroom_30d,
        isProjected: true,
        isPast: false,
      });
    }

    return points;
  }, [covenant]);

  const maxValue = useMemo(() => {
    const values = chartData.map((p) => p.value);
    return Math.max(30, ...values);
  }, [chartData]);

  const minValue = useMemo(() => {
    const values = chartData.map((p) => p.value);
    return Math.min(-5, ...values);
  }, [chartData]);

  const range = maxValue - minValue;

  const getYPosition = (value: number): number => {
    return ((maxValue - value) / range) * 100;
  };

  const getBarColor = (value: number, isProjected: boolean): string => {
    if (isProjected) {
      if (value < 0) return 'bg-red-300';
      if (value < 5) return 'bg-orange-300';
      if (value < 10) return 'bg-amber-300';
      if (value < 15) return 'bg-yellow-300';
      return 'bg-green-300';
    }

    if (value < 0) return 'bg-red-500';
    if (value < 5) return 'bg-red-500';
    if (value < 10) return 'bg-orange-500';
    if (value < 15) return 'bg-amber-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-2" data-testid="live-headroom-chart">
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>Headroom Trajectory</span>
        <span className="text-zinc-400">Historical → Projected</span>
      </div>

      {/* Chart Container */}
      <div className="relative h-24 bg-zinc-50 rounded-md border border-zinc-200 overflow-hidden">
        {/* Threshold Lines */}
        <div
          className="absolute left-0 right-0 border-t border-dashed border-red-300"
          style={{ top: `${getYPosition(5)}%` }}
        >
          <span className="absolute -top-2 right-2 text-xs text-red-600 bg-white px-1">5%</span>
        </div>
        <div
          className="absolute left-0 right-0 border-t border-dashed border-amber-300"
          style={{ top: `${getYPosition(10)}%` }}
        >
          <span className="absolute -top-2 right-2 text-xs text-amber-600 bg-white px-1">10%</span>
        </div>
        <div
          className="absolute left-0 right-0 border-t border-dashed border-yellow-300"
          style={{ top: `${getYPosition(15)}%` }}
        >
          <span className="absolute -top-2 right-2 text-xs text-yellow-700 bg-white px-1">15%</span>
        </div>

        {/* Zero Line */}
        {minValue < 0 && (
          <div
            className="absolute left-0 right-0 border-t-2 border-red-500"
            style={{ top: `${getYPosition(0)}%` }}
          >
            <span className="absolute -top-2 left-2 text-xs text-red-700 font-semibold bg-white px-1">
              Breach
            </span>
          </div>
        )}

        {/* Bars */}
        <div className="absolute inset-0 flex items-end justify-around px-2 pb-2">
          {chartData.map((point, idx) => {
            const barHeight = Math.abs(((point.value - minValue) / range) * 100);
            const isNegative = point.value < 0;

            return (
              <div key={idx} className="flex flex-col items-center flex-1 max-w-[60px]">
                <div className="relative w-full h-full flex items-end justify-center">
                  <div
                    className={cn(
                      'w-3/4 rounded-t-sm transition-all',
                      getBarColor(point.value, point.isProjected),
                      point.isProjected && 'opacity-60',
                      point.label === 'Now' && 'ring-2 ring-blue-500'
                    )}
                    style={{ height: `${barHeight}%` }}
                    data-testid={`bar-${point.label}`}
                  >
                    {/* Value Label */}
                    <div
                      className={cn(
                        'absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-semibold whitespace-nowrap',
                        isNegative ? 'text-red-700' : 'text-zinc-700'
                      )}
                    >
                      {point.value.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* X-axis Label */}
                <div
                  className={cn(
                    'mt-1 text-xs whitespace-nowrap',
                    point.label === 'Now'
                      ? 'font-semibold text-blue-600'
                      : point.isProjected
                      ? 'text-zinc-400 italic'
                      : 'text-zinc-500'
                  )}
                >
                  {point.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-zinc-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
          <span>Historical</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-300 rounded-sm"></div>
          <span>Projected</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 border-2 border-blue-500 rounded-sm"></div>
          <span>Current</span>
        </div>
      </div>
    </div>
  );
});
