'use client';

import React, { memo, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Target, Activity } from 'lucide-react';
import type { TimeSeries, TrendAnalysis } from '@/lib/utils/time-series';
import { analyzeTrend, formatValue } from '@/lib/utils/time-series';
import { prepareChartData, type ChartDataPoint } from '../lib/time-series-adapters';

interface TimeSeriesChartProps {
  /** The time series data to display */
  series: TimeSeries<number>;
  /** Optional custom title (defaults to series.name) */
  title?: string;
  /** Optional description */
  description?: string;
  /** Whether to show trend indicator */
  showTrend?: boolean;
  /** Whether to show baseline line */
  showBaseline?: boolean;
  /** Whether to show target line */
  showTarget?: boolean;
  /** Whether lower values are better (affects trend color) */
  lowerIsBetter?: boolean;
  /** Chart height in pixels */
  height?: number;
  /** Animation delay for stagger effect */
  animationDelay?: number;
  /** Additional className */
  className?: string;
}

export const TimeSeriesChart = memo(function TimeSeriesChart({
  series,
  title,
  description,
  showTrend = true,
  showBaseline = true,
  showTarget = true,
  lowerIsBetter = false,
  height = 200,
  animationDelay = 0,
  className = '',
}: TimeSeriesChartProps) {
  const chartData = useMemo(() => prepareChartData(series), [series]);
  const trend = useMemo(
    () => analyzeTrend(series, { lowerIsBetter }),
    [series, lowerIsBetter]
  );

  if (chartData.length === 0) {
    return (
      <Card className={`${className} animate-in fade-in`} data-testid="time-series-chart-empty">
        <CardHeader>
          <CardTitle>{title || series.name}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-zinc-400">
            <Activity className="w-6 h-6 mr-2" />
            <span>No data available</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { min, max } = trend;
  const range = max - min || 1;
  const padding = range * 0.1;
  const chartMin = min - padding;
  const chartMax = max + padding;

  // Calculate bar positions for the sparkline-style chart
  const barWidth = 100 / chartData.length;

  const getTrendIcon = () => {
    if (trend.direction === 'improving') {
      return <TrendingUp className="w-4 h-4 text-green-600" aria-hidden="true" />;
    }
    if (trend.direction === 'declining') {
      return <TrendingDown className="w-4 h-4 text-red-600" aria-hidden="true" />;
    }
    return <Minus className="w-4 h-4 text-zinc-400" aria-hidden="true" />;
  };

  const getTrendBadgeVariant = (): 'default' | 'success' | 'warning' => {
    if (trend.direction === 'improving') return 'success';
    if (trend.direction === 'declining') return 'warning';
    return 'default';
  };

  const getTrendLabel = () => {
    const prefix = trend.percentageChange >= 0 ? '+' : '';
    return `${prefix}${trend.percentageChange.toFixed(1)}%`;
  };

  return (
    <Card
      className={`${className} transition-all duration-300 hover:shadow-md animate-in fade-in slide-in-from-bottom-4`}
      style={{ animationDelay: `${animationDelay}ms` }}
      data-testid={`time-series-chart-${series.id}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{title || series.name}</CardTitle>
            {description && (
              <CardDescription className="text-xs">{description}</CardDescription>
            )}
          </div>
          {showTrend && (
            <div className="flex items-center gap-2">
              {getTrendIcon()}
              <Badge
                variant={getTrendBadgeVariant() as 'default'}
                className={`text-xs ${
                  trend.direction === 'improving'
                    ? 'bg-green-100 text-green-700'
                    : trend.direction === 'declining'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-zinc-100 text-zinc-700'
                }`}
              >
                {getTrendLabel()}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Chart Area */}
        <div
          className="relative w-full bg-zinc-50 rounded-lg overflow-hidden"
          style={{ height: `${height}px` }}
          role="img"
          aria-label={`Time series chart for ${series.name}. ${trend.direction} trend with ${trend.percentageChange.toFixed(1)}% change.`}
        >
          {/* Baseline Line */}
          {showBaseline && series.baseline !== undefined && (
            <div
              className="absolute left-0 right-0 border-t-2 border-dashed border-blue-300 z-10"
              style={{
                bottom: `${((series.baseline - chartMin) / (chartMax - chartMin)) * 100}%`,
              }}
              data-testid="time-series-baseline"
            >
              <span className="absolute -top-5 left-2 text-xs text-blue-500 bg-white px-1 rounded">
                Baseline: {formatValue(series.baseline, series.unit)}
              </span>
            </div>
          )}

          {/* Target Line */}
          {showTarget && series.target !== undefined && (
            <div
              className="absolute left-0 right-0 border-t-2 border-dashed border-green-400 z-10"
              style={{
                bottom: `${((series.target - chartMin) / (chartMax - chartMin)) * 100}%`,
              }}
              data-testid="time-series-target"
            >
              <span className="absolute -top-5 right-2 text-xs text-green-600 bg-white px-1 rounded flex items-center gap-1">
                <Target className="w-3 h-3" />
                Target: {formatValue(series.target, series.unit)}
              </span>
            </div>
          )}

          {/* Data Bars */}
          <div className="absolute inset-0 flex items-end justify-around px-1">
            {chartData.map((point, index) => {
              const heightPercent = ((point.value - chartMin) / (chartMax - chartMin)) * 100;
              const isLast = index === chartData.length - 1;
              const isAboveTarget = series.target !== undefined && point.value >= series.target;
              const isBelowBaseline = series.baseline !== undefined && point.value < series.baseline;

              let barColor = 'bg-blue-400';
              if (lowerIsBetter) {
                if (series.target !== undefined && point.value <= series.target) {
                  barColor = 'bg-green-400';
                } else if (series.baseline !== undefined && point.value > series.baseline) {
                  barColor = 'bg-red-400';
                }
              } else {
                if (isAboveTarget) {
                  barColor = 'bg-green-400';
                } else if (isBelowBaseline) {
                  barColor = 'bg-amber-400';
                }
              }

              return (
                <div
                  key={`${point.label}-${index}`}
                  className="relative flex flex-col items-center group"
                  style={{ width: `${barWidth - 1}%` }}
                >
                  {/* Tooltip */}
                  <div
                    className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 pointer-events-none"
                    role="tooltip"
                  >
                    <div className="bg-zinc-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                      <div className="font-medium">{point.label}</div>
                      <div>{point.formattedValue}</div>
                    </div>
                  </div>

                  {/* Bar */}
                  <div
                    className={`w-full ${barColor} rounded-t transition-all duration-500 hover:brightness-110 ${
                      isLast ? 'ring-2 ring-offset-1 ring-blue-500' : ''
                    }`}
                    style={{
                      height: `${Math.max(heightPercent, 2)}%`,
                      animationDelay: `${animationDelay + index * 50}ms`,
                    }}
                    data-testid={`time-series-bar-${index}`}
                    aria-label={`${point.label}: ${point.formattedValue}`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* X-axis Labels */}
        <div className="flex justify-between mt-2 text-xs text-zinc-500">
          {chartData.length <= 8 ? (
            chartData.map((point, index) => (
              <span
                key={`label-${point.label}-${index}`}
                className="truncate max-w-[60px]"
                title={point.label}
              >
                {point.label}
              </span>
            ))
          ) : (
            <>
              <span>{chartData[0].label}</span>
              <span>{chartData[Math.floor(chartData.length / 2)].label}</span>
              <span>{chartData[chartData.length - 1].label}</span>
            </>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-zinc-100">
          <div className="text-center">
            <p className="text-xs text-zinc-500">Average</p>
            <p className="text-sm font-medium text-zinc-900">
              {formatValue(trend.average, series.unit)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-zinc-500">Min</p>
            <p className="text-sm font-medium text-zinc-900">
              {formatValue(trend.min, series.unit)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-zinc-500">Max</p>
            <p className="text-sm font-medium text-zinc-900">
              {formatValue(trend.max, series.unit)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// ============================================
// Compact Sparkline Version
// ============================================

interface SparklineProps {
  series: TimeSeries<number>;
  lowerIsBetter?: boolean;
  height?: number;
  className?: string;
}

export const TimeSeriesSparkline = memo(function TimeSeriesSparkline({
  series,
  lowerIsBetter = false,
  height = 40,
  className = '',
}: SparklineProps) {
  const chartData = useMemo(() => prepareChartData(series), [series]);
  const trend = useMemo(
    () => analyzeTrend(series, { lowerIsBetter }),
    [series, lowerIsBetter]
  );

  if (chartData.length === 0) {
    return <div className={`${className} h-${height} bg-zinc-100 rounded`} />;
  }

  const { min, max } = trend;
  const range = max - min || 1;

  return (
    <div
      className={`${className} flex items-end gap-0.5`}
      style={{ height: `${height}px` }}
      role="img"
      aria-label={`Sparkline showing ${trend.direction} trend`}
      data-testid={`sparkline-${series.id}`}
    >
      {chartData.map((point, index) => {
        const heightPercent = ((point.value - min) / range) * 100;
        const trendColor =
          trend.direction === 'improving'
            ? 'bg-green-400'
            : trend.direction === 'declining'
            ? 'bg-red-400'
            : 'bg-blue-400';

        return (
          <div
            key={`spark-${index}`}
            className={`flex-1 ${trendColor} rounded-t transition-all duration-300`}
            style={{ height: `${Math.max(heightPercent, 5)}%` }}
          />
        );
      })}
    </div>
  );
});

// ============================================
// Multi-Series Comparison Chart
// ============================================

interface MultiSeriesChartProps {
  seriesList: TimeSeries<number>[];
  title: string;
  description?: string;
  height?: number;
  className?: string;
}

export const MultiSeriesChart = memo(function MultiSeriesChart({
  seriesList,
  title,
  description,
  height = 250,
  className = '',
}: MultiSeriesChartProps) {
  const colors = [
    'bg-blue-400',
    'bg-green-400',
    'bg-purple-400',
    'bg-amber-400',
    'bg-pink-400',
    'bg-cyan-400',
  ];

  // Get all unique periods across all series
  const allPeriods = useMemo(() => {
    const periodSet = new Set<string>();
    seriesList.forEach((s) => s.dataPoints.forEach((p) => periodSet.add(p.period)));
    return Array.from(periodSet).sort();
  }, [seriesList]);

  // Calculate global min/max
  const { globalMin, globalMax } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    seriesList.forEach((s) =>
      s.dataPoints.forEach((p) => {
        min = Math.min(min, p.value);
        max = Math.max(max, p.value);
      })
    );
    return { globalMin: min, globalMax: max };
  }, [seriesList]);

  const range = globalMax - globalMin || 1;
  const groupWidth = 100 / allPeriods.length;
  const barWidth = groupWidth / (seriesList.length + 1);

  return (
    <Card className={`${className} animate-in fade-in`} data-testid="multi-series-chart">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-4">
          {seriesList.map((series, idx) => (
            <div key={series.id} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${colors[idx % colors.length]}`} />
              <span className="text-xs text-zinc-600">{series.name}</span>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div
          className="relative w-full bg-zinc-50 rounded-lg overflow-hidden"
          style={{ height: `${height}px` }}
        >
          <div className="absolute inset-0 flex items-end">
            {allPeriods.map((period, periodIdx) => (
              <div
                key={period}
                className="flex items-end justify-center gap-0.5"
                style={{ width: `${groupWidth}%` }}
              >
                {seriesList.map((series, seriesIdx) => {
                  const dataPoint = series.dataPoints.find((p) => p.period === period);
                  const value = dataPoint?.value ?? 0;
                  const heightPercent = ((value - globalMin) / range) * 100;

                  return (
                    <div
                      key={`${period}-${series.id}`}
                      className={`${colors[seriesIdx % colors.length]} rounded-t transition-all duration-300 hover:brightness-110`}
                      style={{
                        width: `${barWidth}%`,
                        height: `${Math.max(heightPercent, 2)}%`,
                      }}
                      title={`${series.name}: ${formatValue(value, series.unit)}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* X-axis Labels */}
        <div className="flex justify-between mt-2 text-xs text-zinc-500">
          {allPeriods.length <= 6 ? (
            allPeriods.map((period) => (
              <span key={period} className="truncate">
                {period}
              </span>
            ))
          ) : (
            <>
              <span>{allPeriods[0]}</span>
              <span>{allPeriods[allPeriods.length - 1]}</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
