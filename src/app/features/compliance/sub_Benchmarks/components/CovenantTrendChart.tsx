'use client';

import React, { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BenchmarkTrend, BenchmarkDataPoint } from '../../lib';
import { getIndustrySectorLabel } from '../../lib';

interface CovenantTrendChartProps {
  trend: BenchmarkTrend;
  index?: number;
}

function getCovenantTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    leverage_ratio: 'Leverage Ratio',
    interest_coverage: 'Interest Coverage',
    fixed_charge_coverage: 'Fixed Charge Coverage',
    debt_service_coverage: 'Debt Service Coverage',
    minimum_liquidity: 'Minimum Liquidity',
    capex: 'CapEx',
    net_worth: 'Net Worth',
  };
  return labels[type] || type;
}

export const CovenantTrendChart = memo(function CovenantTrendChart({
  trend,
  index = 0,
}: CovenantTrendChartProps) {
  const dataPoints = trend.data_points;
  const minValue = Math.min(...dataPoints.map(d => d.percentile_25)) * 0.95;
  const maxValue = Math.max(...dataPoints.map(d => d.percentile_75)) * 1.05;
  const range = maxValue - minValue;

  const TrendIcon = trend.trend_direction === 'improving' ? TrendingUp :
                    trend.trend_direction === 'declining' ? TrendingDown : Minus;

  const trendColor = trend.trend_direction === 'improving' ? 'text-green-600 bg-green-100' :
                     trend.trend_direction === 'declining' ? 'text-red-600 bg-red-100' : 'text-zinc-600 bg-zinc-100';

  const trendText = trend.trend_direction === 'improving' ? 'Thresholds Increasing' :
                    trend.trend_direction === 'declining' ? 'Thresholds Tightening' : 'Stable';

  // Calculate Y position for a value (inverted because SVG Y is top-down)
  const getY = (value: number): number => {
    return 200 - ((value - minValue) / range) * 180;
  };

  // Build path strings for the chart
  const medianPath = useMemo(() => {
    return dataPoints.map((point, i) => {
      const x = 50 + (i / (dataPoints.length - 1)) * 500;
      const y = getY(point.median);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }, [dataPoints, minValue, range]);

  const areaPath = useMemo(() => {
    const topPath = dataPoints.map((point, i) => {
      const x = 50 + (i / (dataPoints.length - 1)) * 500;
      const y = getY(point.percentile_75);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    const bottomPath = [...dataPoints].reverse().map((point, i) => {
      const x = 50 + ((dataPoints.length - 1 - i) / (dataPoints.length - 1)) * 500;
      const y = getY(point.percentile_25);
      return `L ${x} ${y}`;
    }).join(' ');

    return `${topPath} ${bottomPath} Z`;
  }, [dataPoints, minValue, range]);

  const lastPoint = dataPoints[dataPoints.length - 1];
  const firstPoint = dataPoints[0];

  return (
    <Card
      className="animate-in fade-in slide-in-from-bottom-3"
      style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'both' }}
      data-testid={`covenant-trend-chart-${trend.covenant_type}`}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{getCovenantTypeLabel(trend.covenant_type)}</CardTitle>
            <CardDescription>
              {getIndustrySectorLabel(trend.industry)} benchmark trends
            </CardDescription>
          </div>
          <Badge className={cn('flex items-center gap-1', trendColor)}>
            <TrendIcon className="w-3 h-3" />
            {trendText}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* SVG Chart */}
          <svg viewBox="0 0 600 240" className="w-full h-48">
            {/* Grid lines */}
            <defs>
              <pattern id={`grid-${trend.covenant_type}`} width="100" height="45" patternUnits="userSpaceOnUse">
                <path d="M 100 0 L 0 0 0 45" fill="none" stroke="#e4e4e7" strokeWidth="1" />
              </pattern>
            </defs>
            <rect x="50" y="10" width="500" height="190" fill={`url(#grid-${trend.covenant_type})`} />

            {/* 25-75 percentile area */}
            <path
              d={areaPath}
              fill="rgba(59, 130, 246, 0.15)"
              stroke="none"
            />

            {/* Median line */}
            <path
              d={medianPath}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points on median line */}
            {dataPoints.map((point, i) => {
              const x = 50 + (i / (dataPoints.length - 1)) * 500;
              const y = getY(point.median);
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="white"
                  stroke="#3b82f6"
                  strokeWidth="2"
                />
              );
            })}

            {/* Y-axis labels */}
            <text x="45" y="20" textAnchor="end" className="text-xs fill-zinc-400">
              {maxValue.toFixed(2)}x
            </text>
            <text x="45" y="110" textAnchor="end" className="text-xs fill-zinc-400">
              {((maxValue + minValue) / 2).toFixed(2)}x
            </text>
            <text x="45" y="200" textAnchor="end" className="text-xs fill-zinc-400">
              {minValue.toFixed(2)}x
            </text>

            {/* X-axis labels */}
            {dataPoints.map((point, i) => {
              const x = 50 + (i / (dataPoints.length - 1)) * 500;
              return (
                <text
                  key={i}
                  x={x}
                  y="230"
                  textAnchor="middle"
                  className="text-[10px] fill-zinc-400"
                >
                  {point.period}
                </text>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-2 text-xs text-zinc-500">
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-blue-500 rounded-full" />
              <span>Median</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500/20 rounded" />
              <span>25th-75th Percentile</span>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-zinc-100">
          <div className="text-center">
            <p className="text-xs text-zinc-500">Start Value</p>
            <p className="text-sm font-semibold text-zinc-900">
              {firstPoint.median.toFixed(2)}x
            </p>
            <p className="text-xs text-zinc-400">{firstPoint.period}</p>
          </div>
          <div className="text-center border-x border-zinc-100">
            <p className="text-xs text-zinc-500">Change</p>
            <p className={cn(
              'text-lg font-bold',
              trend.trend_change_percentage < 0 ? 'text-red-600' :
              trend.trend_change_percentage > 0 ? 'text-green-600' : 'text-zinc-600'
            )}>
              {trend.trend_change_percentage > 0 ? '+' : ''}{trend.trend_change_percentage.toFixed(1)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-zinc-500">Current Value</p>
            <p className="text-sm font-semibold text-zinc-900">
              {lastPoint.median.toFixed(2)}x
            </p>
            <p className="text-xs text-zinc-400">{lastPoint.period}</p>
          </div>
        </div>

        {/* Sample Size */}
        <div className="mt-4 text-center text-xs text-zinc-500">
          Based on {lastPoint.sample_size} data points from {trend.data_points.length} quarters
        </div>
      </CardContent>
    </Card>
  );
});
