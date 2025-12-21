'use client';

import React, { memo, useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { HealthScoreTrendPoint, HealthScoreComponent } from '../lib/mocks';

interface TrendAnalysisProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trendHistory: HealthScoreTrendPoint[];
  components: HealthScoreComponent[];
  currentScore: number;
  previousScore: number;
}

type TimeRange = '3m' | '6m' | '12m';

const TrendIcon = memo(function TrendIcon({
  trend,
  className,
}: {
  trend: 'up' | 'down' | 'stable';
  className?: string;
}) {
  if (trend === 'up') return <TrendingUp className={cn('w-4 h-4', className)} />;
  if (trend === 'down') return <TrendingDown className={cn('w-4 h-4', className)} />;
  return <Minus className={cn('w-4 h-4', className)} />;
});

function getTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'stable';
}

function getTrendColor(trend: 'up' | 'down' | 'stable'): string {
  if (trend === 'up') return 'text-green-600';
  if (trend === 'down') return 'text-red-600';
  return 'text-zinc-500';
}

const MiniChart = memo(function MiniChart({
  data,
  height = 120,
  width = 400,
}: {
  data: HealthScoreTrendPoint[];
  height?: number;
  width?: number;
}) {
  const padding = { top: 20, right: 30, bottom: 30, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const { minScore, maxScore } = useMemo(() => {
    const allScores = data.flatMap((d) => [d.score, d.benchmark]);
    return {
      minScore: Math.min(...allScores) - 5,
      maxScore: Math.max(...allScores) + 5,
    };
  }, [data]);

  const points = useMemo(() => {
    return data.map((point, index) => {
      const x = padding.left + (index / (data.length - 1)) * chartWidth;
      const y =
        padding.top +
        ((maxScore - point.score) / (maxScore - minScore)) * chartHeight;
      return { x, y, ...point };
    });
  }, [data, chartWidth, chartHeight, maxScore, minScore, padding.left, padding.top]);

  const benchmarkPoints = useMemo(() => {
    return data.map((point, index) => {
      const x = padding.left + (index / (data.length - 1)) * chartWidth;
      const y =
        padding.top +
        ((maxScore - point.benchmark) / (maxScore - minScore)) * chartHeight;
      return { x, y, ...point };
    });
  }, [data, chartWidth, chartHeight, maxScore, minScore, padding.left, padding.top]);

  const scorePath = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ');

  const benchmarkPath = benchmarkPoints
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ');

  const areaPath = `${scorePath} L ${points[points.length - 1].x} ${
    padding.top + chartHeight
  } L ${points[0].x} ${padding.top + chartHeight} Z`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = padding.top + ratio * chartHeight;
        const value = Math.round(maxScore - ratio * (maxScore - minScore));
        return (
          <g key={ratio}>
            <line
              x1={padding.left}
              y1={y}
              x2={padding.left + chartWidth}
              y2={y}
              stroke="#e4e4e7"
              strokeDasharray="2,2"
            />
            <text
              x={padding.left - 8}
              y={y}
              textAnchor="end"
              dominantBaseline="middle"
              className="text-[10px] fill-zinc-400"
            >
              {value}
            </text>
          </g>
        );
      })}

      {/* X-axis labels */}
      {points.map((point, index) => (
        <text
          key={index}
          x={point.x}
          y={height - 8}
          textAnchor="middle"
          className="text-[10px] fill-zinc-400"
        >
          {point.date}
        </text>
      ))}

      {/* Area fill */}
      <path d={areaPath} fill="url(#scoreGradientArea)" />

      {/* Benchmark line */}
      <path
        d={benchmarkPath}
        fill="none"
        stroke="#a1a1aa"
        strokeWidth={2}
        strokeDasharray="4,4"
      />

      {/* Score line */}
      <path d={scorePath} fill="none" stroke="#18181b" strokeWidth={2.5} />

      {/* Data points */}
      {points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r={4}
          fill="#18181b"
          stroke="white"
          strokeWidth={2}
          className="cursor-pointer hover:r-6 transition-all"
          data-testid={`trend-point-${index}`}
        />
      ))}

      {/* Gradient definition */}
      <defs>
        <linearGradient id="scoreGradientArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#18181b" stopOpacity={0.15} />
          <stop offset="100%" stopColor="#18181b" stopOpacity={0} />
        </linearGradient>
      </defs>
    </svg>
  );
});

const ComponentTrendRow = memo(function ComponentTrendRow({
  component,
  index,
}: {
  component: HealthScoreComponent;
  index: number;
}) {
  return (
    <div
      className="flex items-center justify-between p-3 border border-zinc-100 rounded-lg animate-in fade-in slide-in-from-bottom-2"
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
      data-testid={`component-trend-${component.id}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center',
            component.trend === 'up' && 'bg-green-100',
            component.trend === 'down' && 'bg-red-100',
            component.trend === 'stable' && 'bg-zinc-100'
          )}
        >
          <TrendIcon trend={component.trend} className={getTrendColor(component.trend)} />
        </div>
        <div>
          <p className="font-medium text-zinc-900 text-sm">{component.name}</p>
          <p className="text-xs text-zinc-500">Weight: {component.weight}%</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-bold text-lg">{component.score}</p>
          <p
            className={cn(
              'text-xs',
              component.change > 0 ? 'text-green-600' : component.change < 0 ? 'text-red-600' : 'text-zinc-500'
            )}
          >
            {component.change > 0 ? '+' : ''}
            {component.change.toFixed(1)}%
          </p>
        </div>
        {/* Mini sparkline */}
        <div className="w-20 h-8">
          <svg width="80" height="32" className="overflow-visible">
            <path
              d={`M 0 ${16 + (component.trend === 'up' ? 8 : component.trend === 'down' ? -8 : 0)}
                  Q 20 ${16 + (component.trend === 'up' ? 4 : component.trend === 'down' ? -4 : 0)},
                  40 16
                  Q 60 ${16 + (component.trend === 'up' ? -4 : component.trend === 'down' ? 4 : 0)},
                  80 ${16 + (component.trend === 'up' ? -8 : component.trend === 'down' ? 8 : 0)}`}
              fill="none"
              stroke={
                component.trend === 'up'
                  ? '#16a34a'
                  : component.trend === 'down'
                  ? '#dc2626'
                  : '#71717a'
              }
              strokeWidth={2}
            />
          </svg>
        </div>
      </div>
    </div>
  );
});

export const TrendAnalysis = memo(function TrendAnalysis({
  open,
  onOpenChange,
  trendHistory,
  components,
  currentScore,
  previousScore,
}: TrendAnalysisProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('6m');

  const overallTrend = getTrend(currentScore, previousScore);
  const change = currentScore - previousScore;
  const changePercent = ((change / previousScore) * 100).toFixed(1);

  const improvingComponents = components.filter((c) => c.trend === 'up').length;
  const decliningComponents = components.filter((c) => c.trend === 'down').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
        data-testid="trend-analysis-modal"
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="flex items-center gap-2">Trend Analysis</DialogTitle>
              <DialogDescription>
                Track your portfolio health score over time and identify patterns
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Time Range Selector */}
        <div className="flex items-center justify-between py-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-500" />
            <span className="text-sm text-zinc-600">Time Range:</span>
          </div>
          <div className="flex items-center gap-1">
            {(['3m', '6m', '12m'] as TimeRange[]).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
                data-testid={`time-range-${range}`}
              >
                {range === '3m' ? '3 Months' : range === '6m' ? '6 Months' : '12 Months'}
              </Button>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 py-4">
          <div className="text-center p-3 bg-zinc-50 rounded-lg">
            <p className="text-2xl font-bold text-zinc-900">{currentScore}</p>
            <p className="text-xs text-zinc-500">Current Score</p>
          </div>
          <div className="text-center p-3 bg-zinc-50 rounded-lg">
            <div
              className={cn('flex items-center justify-center gap-1', getTrendColor(overallTrend))}
            >
              <TrendIcon trend={overallTrend} />
              <span className="text-2xl font-bold">
                {change > 0 ? '+' : ''}
                {change}
              </span>
            </div>
            <p className="text-xs text-zinc-500">Change ({changePercent}%)</p>
          </div>
          <div className="text-center p-3 bg-zinc-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{improvingComponents}</p>
            <p className="text-xs text-zinc-500">Improving Areas</p>
          </div>
          <div className="text-center p-3 bg-zinc-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{decliningComponents}</p>
            <p className="text-xs text-zinc-500">Declining Areas</p>
          </div>
        </div>

        {/* Chart */}
        <div className="p-4 border border-zinc-100 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-zinc-900">Score History</h4>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-zinc-900" />
                <span className="text-zinc-600">Your Score</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-zinc-400" style={{ strokeDasharray: '4,4' }} />
                <span className="text-zinc-600">Industry Benchmark</span>
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <MiniChart data={trendHistory} width={500} height={140} />
          </div>
        </div>

        {/* Component Trends */}
        <div className="flex-1 overflow-y-auto">
          <h4 className="font-medium text-zinc-900 mb-3">Component Performance</h4>
          <div className="space-y-2">
            {components
              .sort((a, b) => b.change - a.change)
              .map((component, index) => (
                <ComponentTrendRow key={component.id} component={component} index={index} />
              ))}
          </div>
        </div>

        {/* Insights */}
        <div className="pt-4 border-t border-zinc-100">
          <h4 className="font-medium text-zinc-900 mb-2">Key Insights</h4>
          <div className="grid grid-cols-2 gap-2">
            {components.filter((c) => c.trend === 'up').length > 0 && (
              <div className="flex items-start gap-2 p-2 bg-green-50 rounded-lg text-sm">
                <TrendingUp className="w-4 h-4 text-green-600 mt-0.5" />
                <p className="text-green-800">
                  <span className="font-medium">
                    {components.find((c) => c.change === Math.max(...components.map((x) => x.change)))?.name}
                  </span>{' '}
                  showed the most improvement
                </p>
              </div>
            )}
            {components.filter((c) => c.trend === 'down').length > 0 && (
              <div className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg text-sm">
                <TrendingDown className="w-4 h-4 text-amber-600 mt-0.5" />
                <p className="text-amber-800">
                  <span className="font-medium">
                    {components.find((c) => c.change === Math.min(...components.map((x) => x.change)))?.name}
                  </span>{' '}
                  needs attention
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
