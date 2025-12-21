'use client';

import React, { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MarketTrendData, MarketDataPoint } from '../lib/types';

interface TrendAnalysisChartProps {
  trendData: MarketTrendData[];
  historicalMargin?: MarketDataPoint[]; // Reserved for future use
  title?: string;
}

// historicalMargin is available as a prop for future enhanced trend analysis

type MetricKey = 'margin' | 'leverage' | 'volume';

interface MetricConfig {
  key: MetricKey;
  label: string;
  unit: string;
  formatter: (value: number) => string;
  trend: 'lower_better' | 'higher_better' | 'neutral';
}

const metricConfigs: MetricConfig[] = [
  {
    key: 'margin',
    label: 'Avg Margin',
    unit: '%',
    formatter: (v) => `${v.toFixed(2)}%`,
    trend: 'lower_better',
  },
  {
    key: 'leverage',
    label: 'Avg Leverage',
    unit: 'x',
    formatter: (v) => `${v.toFixed(1)}x`,
    trend: 'neutral',
  },
  {
    key: 'volume',
    label: 'Deal Volume',
    unit: 'B',
    formatter: (v) => `$${(v / 1000000000).toFixed(0)}B`,
    trend: 'higher_better',
  },
];

export function TrendAnalysisChart({ trendData, historicalMargin: _historicalMargin, title = 'Market Trends' }: TrendAnalysisChartProps) {
  // _historicalMargin is available for future enhanced trend analysis with margin overlay
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('margin');

  const chartData = useMemo(() => {
    return trendData.map((d) => ({
      period: d.period,
      margin: d.metrics.avgMargin,
      leverage: d.metrics.avgLeverage,
      volume: d.metrics.dealVolume,
      spreadChange: d.metrics.spreadTightening,
    }));
  }, [trendData]);

  const currentConfig = metricConfigs.find((c) => c.key === selectedMetric)!;

  // Calculate trend from first to last data point
  const trend = useMemo(() => {
    if (chartData.length < 2) return { direction: 'stable', change: 0 };
    const first = chartData[0][selectedMetric];
    const last = chartData[chartData.length - 1][selectedMetric];
    const change = ((last - first) / first) * 100;
    return {
      direction: change < -2 ? 'down' : change > 2 ? 'up' : 'stable',
      change: Math.abs(change),
    };
  }, [chartData, selectedMetric]);

  // Normalize values for bar heights
  const maxValue = useMemo(() => Math.max(...chartData.map((d) => d[selectedMetric])), [chartData, selectedMetric]);
  const minValue = useMemo(() => Math.min(...chartData.map((d) => d[selectedMetric])), [chartData, selectedMetric]);

  const getBarHeight = (value: number): number => {
    const range = maxValue - minValue;
    if (range === 0) return 50;
    return ((value - minValue) / range) * 60 + 20; // Scale between 20% and 80%
  };

  const isTrendGood = useMemo(() => {
    if (currentConfig.trend === 'neutral') return null;
    if (currentConfig.trend === 'lower_better') {
      return trend.direction === 'down';
    }
    return trend.direction === 'up';
  }, [trend.direction, currentConfig.trend]);

  return (
    <Card data-testid="trend-analysis-chart">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {title}
            </CardTitle>
            <CardDescription className="mt-1">
              Quarterly market trends for leveraged loans
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {metricConfigs.map((config) => (
              <Button
                key={config.key}
                variant={selectedMetric === config.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedMetric(config.key)}
                data-testid={`trend-metric-btn-${config.key}`}
              >
                {config.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Trend Summary */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {trend.direction === 'down' ? (
                <TrendingDown className={cn('w-5 h-5', isTrendGood === true ? 'text-green-500' : isTrendGood === false ? 'text-red-500' : 'text-zinc-500')} />
              ) : trend.direction === 'up' ? (
                <TrendingUp className={cn('w-5 h-5', isTrendGood === true ? 'text-green-500' : isTrendGood === false ? 'text-red-500' : 'text-zinc-500')} />
              ) : null}
              <span className="text-sm text-zinc-600">
                {currentConfig.label} {trend.direction === 'down' ? 'decreased' : trend.direction === 'up' ? 'increased' : 'stable'}{' '}
                <span className="font-medium">{trend.change.toFixed(1)}%</span> over the period
              </span>
            </div>
            {isTrendGood !== null && (
              <Badge
                variant={isTrendGood ? 'success' : 'warning'}
                data-testid="trend-sentiment-badge"
              >
                {isTrendGood ? 'Borrower-Favorable' : 'Lender-Favorable'}
              </Badge>
            )}
          </div>

          {/* Bar Chart */}
          <div className="h-48 flex items-end justify-around gap-2 pt-4">
            {chartData.map((data, index) => (
              <div key={data.period} className="flex flex-col items-center gap-2 flex-1">
                <span className="text-xs font-medium text-zinc-700" data-testid={`trend-value-${index}`}>
                  {currentConfig.formatter(data[selectedMetric])}
                </span>
                <div
                  className={cn(
                    'w-full max-w-12 rounded-t transition-all duration-300',
                    index === chartData.length - 1 ? 'bg-blue-500' : 'bg-blue-200'
                  )}
                  style={{ height: `${getBarHeight(data[selectedMetric])}%` }}
                  data-testid={`trend-bar-${index}`}
                />
                <span className="text-xs text-zinc-500">{data.period}</span>
              </div>
            ))}
          </div>

          {/* Spread Change Indicator */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Spread Movement (bps)</span>
              <div className="flex items-center gap-4">
                {chartData.map((data) => (
                  <div key={data.period} className="text-center">
                    <span
                      className={cn(
                        'font-medium',
                        data.spreadChange < 0 ? 'text-green-600' : 'text-red-600'
                      )}
                    >
                      {data.spreadChange > 0 ? '+' : ''}{data.spreadChange}
                    </span>
                    <p className="text-xs text-zinc-400">{data.period}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface MarginHistoryChartProps {
  data: MarketDataPoint[];
  currentMargin: number;
}

export function MarginHistoryChart({ data, currentMargin }: MarginHistoryChartProps) {
  // Simple sparkline-style visualization
  const maxValue = Math.max(...data.map((d) => d.percentile75 || d.value));
  const minValue = Math.min(...data.map((d) => d.percentile25 || d.value));
  const range = maxValue - minValue;

  const getY = (value: number): number => {
    if (range === 0) return 50;
    return 100 - ((value - minValue) / range) * 100;
  };

  return (
    <Card data-testid="margin-history-chart">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">12-Month Margin History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-32">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col justify-between text-xs text-zinc-400">
            <span>{maxValue.toFixed(2)}%</span>
            <span>{minValue.toFixed(2)}%</span>
          </div>

          {/* Chart area */}
          <div className="ml-12 h-full relative">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Percentile band */}
              <path
                d={`
                  M 0 ${getY(data[0]?.percentile75 || data[0]?.value)}
                  ${data.map((d, i) => `L ${(i / (data.length - 1)) * 100} ${getY(d.percentile75 || d.value)}`).join(' ')}
                  ${data.map((d, i) => `L ${((data.length - 1 - i) / (data.length - 1)) * 100} ${getY(data[data.length - 1 - i].percentile25 || data[data.length - 1 - i].value)}`).join(' ')}
                  Z
                `}
                fill="rgba(59, 130, 246, 0.1)"
              />

              {/* Median line */}
              <path
                d={`M 0 ${getY(data[0]?.value)} ${data.map((d, i) => `L ${(i / (data.length - 1)) * 100} ${getY(d.value)}`).join(' ')}`}
                stroke="#3b82f6"
                strokeWidth="2"
                fill="none"
              />

              {/* Current value line */}
              <line
                x1="0"
                y1={getY(currentMargin)}
                x2="100"
                y2={getY(currentMargin)}
                stroke="#22c55e"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
            </svg>

            {/* Current value indicator */}
            <div
              className="absolute right-0 transform translate-x-full bg-green-500 text-white text-xs px-1.5 py-0.5 rounded"
              style={{ top: `${getY(currentMargin)}%`, transform: 'translateY(-50%)' }}
            >
              {currentMargin}%
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-xs text-zinc-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-blue-500" />
            <span>Market Median</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-green-500" style={{ borderTop: '1px dashed' }} />
            <span>Your Deal</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-100 rounded" />
            <span>P25-P75 Range</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
