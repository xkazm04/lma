'use client';

import React, { memo, useState, useCallback } from 'react';
import {
  ChevronRight,
  Activity,
  BarChart3,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TrendIcon } from '@/components/ui/trend-icon';
import { cn } from '@/lib/utils';
import type { PortfolioHealthData, HealthScoreComponent } from '../lib/mocks';
import { HealthScoreDrilldownModal } from './HealthScoreDrilldownModal';

interface PortfolioHealthScoreProps {
  data: PortfolioHealthData;
  onViewBenchmarks?: () => void;
  onViewTrends?: () => void;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
}

function getScoreGradient(score: number): string {
  if (score >= 80) return 'from-green-500 to-emerald-500';
  if (score >= 60) return 'from-amber-500 to-orange-500';
  return 'from-red-500 to-rose-500';
}

function getScoreBgClass(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

const ScoreRing = memo(function ScoreRing({
  score,
  size = 100,
  strokeWidth = 6,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-zinc-100"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop
              offset="0%"
              className={cn(
                score >= 80
                  ? 'stop-color-green-500'
                  : score >= 60
                  ? 'stop-color-amber-500'
                  : 'stop-color-red-500'
              )}
              style={{
                stopColor:
                  score >= 80
                    ? 'rgb(34, 197, 94)'
                    : score >= 60
                    ? 'rgb(245, 158, 11)'
                    : 'rgb(239, 68, 68)',
              }}
            />
            <stop
              offset="100%"
              style={{
                stopColor:
                  score >= 80
                    ? 'rgb(16, 185, 129)'
                    : score >= 60
                    ? 'rgb(249, 115, 22)'
                    : 'rgb(244, 63, 94)',
              }}
            />
          </linearGradient>
        </defs>
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-2xl font-bold', getScoreColor(score))}>{score}</span>
        <span className="text-[10px] text-zinc-500">/ 100</span>
      </div>
    </div>
  );
});

const ComponentScoreRow = memo(function ComponentScoreRow({
  component,
  index,
  onClick,
}: {
  component: HealthScoreComponent;
  index: number;
  onClick?: () => void;
}) {
  const isAboveBenchmark = component.score >= component.benchmark;

  return (
    <div
      className={cn(
        'p-2.5 rounded-lg border border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50 transition-all cursor-pointer group animate-in fade-in slide-in-from-bottom-2',
        'transform hover:scale-[1.01]'
      )}
      style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'both' }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      data-testid={`health-component-${component.id}`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-zinc-900 text-xs">{component.name}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3 h-3 text-zinc-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px]">
                <p className="text-xs">{component.description}</p>
                <p className="text-xs mt-1 text-zinc-400">Weight: {component.weight}%</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn('font-semibold text-sm', getScoreColor(component.score))}>
            {component.score}
          </span>
          <div
            className={cn(
              'flex items-center gap-0.5 text-[10px]',
              component.trend === 'up' && 'text-green-600',
              component.trend === 'down' && 'text-red-600',
              component.trend === 'stable' && 'text-zinc-500'
            )}
          >
            <TrendIcon trend={component.trend} className="w-2.5 h-2.5" />
            <span>{component.change > 0 ? '+' : ''}{component.change.toFixed(1)}%</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Progress
          value={component.score}
          className="h-1.5 flex-1"
          animate
          animationDelay={index * 100 + 200}
        />
        <div className="flex items-center gap-1 text-[10px] text-zinc-500">
          <span
            className={cn(
              'font-medium',
              isAboveBenchmark ? 'text-green-600' : 'text-amber-600'
            )}
          >
            {isAboveBenchmark ? '+' : ''}
            {component.score - component.benchmark}
          </span>
          <span>vs avg</span>
        </div>
      </div>
    </div>
  );
});

export const PortfolioHealthScore = memo(function PortfolioHealthScore({
  data,
  onViewBenchmarks,
  onViewTrends,
}: PortfolioHealthScoreProps) {
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<HealthScoreComponent | null>(null);

  const handleComponentClick = useCallback((component: HealthScoreComponent) => {
    setSelectedComponent(component);
    setDrilldownOpen(true);
  }, []);

  return (
    <>
      <Card
        className="animate-in fade-in slide-in-from-top-4 duration-500"
        data-testid="portfolio-health-score-card"
      >
        <CardHeader className="py-2.5 px-3 border-b border-zinc-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-gradient-to-br from-emerald-500 to-green-600">
                <Activity className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">Portfolio Health</CardTitle>
                <p className="text-[9px] text-zinc-400">Updated {data.lastUpdated}</p>
              </div>
            </div>
            <button
              onClick={onViewTrends}
              className="p-1.5 rounded-md hover:bg-zinc-100 transition-colors group"
              data-testid="view-trends-btn"
              aria-label="View trends"
            >
              <BarChart3 className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-900" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-3 px-3 pb-3">
          {/* Score Overview */}
          <div className="flex items-center gap-4 mb-4">
            <ScoreRing score={data.overallScore} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <Badge
                  variant={data.trend === 'up' ? 'success' : data.trend === 'down' ? 'destructive' : 'secondary'}
                  className="flex items-center gap-1 text-[10px]"
                >
                  <TrendIcon trend={data.trend} className="w-2.5 h-2.5" />
                  {data.change > 0 ? '+' : ''}{data.change.toFixed(1)}%
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-zinc-600">
                  <span className="font-medium text-zinc-900">{data.industryRank}</span> of peers
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full bg-gradient-to-r', getScoreGradient(data.percentile))}
                      style={{ width: `${data.percentile}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500">{data.percentile}th</span>
                </div>
              </div>
              <button
                onClick={onViewBenchmarks}
                className="mt-2 text-xs text-zinc-600 hover:text-zinc-900 flex items-center gap-0.5 transition-colors"
                data-testid="view-benchmarks-btn"
              >
                View benchmarks
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Component Scores */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-medium text-zinc-700">Score Components</h4>
              <span className="text-[10px] text-zinc-500">Click to drill down</span>
            </div>
            {data.components.map((component, index) => (
              <ComponentScoreRow
                key={component.id}
                component={component}
                index={index}
                onClick={() => handleComponentClick(component)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Drilldown Modal */}
      <HealthScoreDrilldownModal
        open={drilldownOpen}
        onOpenChange={setDrilldownOpen}
        component={selectedComponent}
      />
    </>
  );
});
