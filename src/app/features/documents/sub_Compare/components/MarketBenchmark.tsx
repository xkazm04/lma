'use client';

import React, { memo } from 'react';
import { TrendingUp, TrendingDown, Target, BarChart3, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ChangeMarketBenchmark } from '../../lib/types';

interface MarketBenchmarkBadgeProps {
  benchmark: ChangeMarketBenchmark;
  compact?: boolean;
}

const positionConfig = {
  below_market: {
    label: 'Below Market',
    icon: TrendingDown,
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200',
    description: 'This term is more favorable than typical market terms',
  },
  at_market: {
    label: 'At Market',
    icon: Target,
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-200',
    description: 'This term aligns with current market standards',
  },
  above_market: {
    label: 'Above Market',
    icon: TrendingUp,
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-200',
    description: 'This term exceeds typical market terms',
  },
};

export const MarketBenchmarkBadge = memo(function MarketBenchmarkBadge({
  benchmark,
  compact = false,
}: MarketBenchmarkBadgeProps) {
  const config = positionConfig[benchmark.marketPosition];
  const Icon = config.icon;

  const badgeContent = (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        config.bgColor,
        config.textColor,
        config.borderColor,
        compact ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm'
      )}
      data-testid={`market-benchmark-badge-${benchmark.marketPosition}`}
    >
      <Icon className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
      <span className="text-zinc-500">P{benchmark.percentile}</span>
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-md p-3 bg-zinc-900 text-white"
          data-testid="market-benchmark-tooltip"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <Icon className="w-4 h-4" />
                <span className="font-semibold">{config.label}</span>
              </div>
              <Badge variant="secondary" className="bg-zinc-700 text-zinc-200">
                {benchmark.percentile}th percentile
              </Badge>
            </div>

            <p className="text-sm text-zinc-300">{config.description}</p>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 bg-zinc-800 rounded">
                <div className="text-zinc-400">Low</div>
                <div className="font-medium">{benchmark.marketRangeLow}</div>
              </div>
              <div className="text-center p-2 bg-zinc-800 rounded border border-zinc-600">
                <div className="text-zinc-400">Median</div>
                <div className="font-medium">{benchmark.marketMedian}</div>
              </div>
              <div className="text-center p-2 bg-zinc-800 rounded">
                <div className="text-zinc-400">High</div>
                <div className="font-medium">{benchmark.marketRangeHigh}</div>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">{benchmark.marketInsight}</p>

            <div className="flex items-center justify-between text-xs text-zinc-500 pt-1 border-t border-zinc-700">
              <span>Sample: {benchmark.sampleSize} deals</span>
              <span>{benchmark.benchmarkPeriod}</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

interface MarketBenchmarkCardProps {
  benchmark: ChangeMarketBenchmark;
}

export const MarketBenchmarkCard = memo(function MarketBenchmarkCard({
  benchmark,
}: MarketBenchmarkCardProps) {
  const config = positionConfig[benchmark.marketPosition];
  const Icon = config.icon;

  return (
    <Card
      className={cn(
        'border-l-4 transition-all hover:shadow-sm',
        benchmark.marketPosition === 'below_market' && 'border-l-blue-500',
        benchmark.marketPosition === 'at_market' && 'border-l-green-500',
        benchmark.marketPosition === 'above_market' && 'border-l-amber-500'
      )}
      data-testid={`market-benchmark-card-${benchmark.changeId}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{benchmark.termName}</CardTitle>
          <Badge
            variant="secondary"
            className={cn(
              'text-xs',
              config.bgColor,
              config.textColor,
              config.borderColor
            )}
          >
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Value comparison */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-xs text-zinc-500">Original</span>
            <p className="font-medium text-zinc-700">
              {benchmark.originalValue ?? '—'}
            </p>
          </div>
          <div>
            <span className="text-xs text-zinc-500">Amended</span>
            <p className="font-medium text-zinc-900">
              {benchmark.amendedValue ?? '—'}
            </p>
          </div>
        </div>

        {/* Market range visualization */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Market Range</span>
            <span className="font-medium text-zinc-700">P{benchmark.percentile}</span>
          </div>
          <MarketRangeBar
            low={benchmark.marketRangeLow}
            median={benchmark.marketMedian}
            high={benchmark.marketRangeHigh}
            percentile={benchmark.percentile}
          />
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>{benchmark.marketRangeLow}</span>
            <span className="text-zinc-400">{benchmark.marketMedian}</span>
            <span>{benchmark.marketRangeHigh}</span>
          </div>
        </div>

        {/* Insight */}
        <p className="text-xs text-zinc-600 leading-relaxed">
          {benchmark.marketInsight}
        </p>

        {/* Meta info */}
        <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-100">
          <span>{benchmark.sampleSize} deals analyzed</span>
          <span>{benchmark.benchmarkPeriod}</span>
        </div>
      </CardContent>
    </Card>
  );
});

interface MarketRangeBarProps {
  low: string;
  median: string;
  high: string;
  percentile: number;
}

const MarketRangeBar = memo(function MarketRangeBar({
  percentile,
}: MarketRangeBarProps) {
  return (
    <div className="relative h-2 bg-zinc-200 rounded-full overflow-hidden">
      {/* Gradient background representing the range */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-blue-400 via-green-400 to-amber-400 opacity-30"
      />
      {/* Median marker */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-zinc-500"
        style={{ left: '50%' }}
      />
      {/* Current position marker */}
      <div
        className="absolute top-0 bottom-0 w-1.5 bg-zinc-900 rounded-full transition-all duration-300"
        style={{ left: `calc(${percentile}% - 3px)` }}
      />
    </div>
  );
});

interface MarketBenchmarkSectionProps {
  benchmarks: ChangeMarketBenchmark[];
  title?: string;
}

export const MarketBenchmarkSection = memo(function MarketBenchmarkSection({
  benchmarks,
  title = 'Market Benchmarks',
}: MarketBenchmarkSectionProps) {
  if (benchmarks.length === 0) {
    return null;
  }

  // Group by category
  const byCategory = benchmarks.reduce((acc, benchmark) => {
    if (!acc[benchmark.category]) {
      acc[benchmark.category] = [];
    }
    acc[benchmark.category].push(benchmark);
    return acc;
  }, {} as Record<string, ChangeMarketBenchmark[]>);

  return (
    <Card data-testid="market-benchmark-section">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          {title}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-zinc-400" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="text-sm">
                  Market benchmarks show how these terms compare to similar deals in the
                  current market. Data is based on comparable credit facilities from
                  recent transactions.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(byCategory).map(([category, categoryBenchmarks]) => (
          <div key={category} className="space-y-3">
            <h4 className="text-sm font-medium text-zinc-700 border-b border-zinc-100 pb-1">
              {category}
            </h4>
            <div className="grid gap-3 md:grid-cols-2">
              {categoryBenchmarks.map((benchmark) => (
                <MarketBenchmarkCard key={benchmark.changeId} benchmark={benchmark} />
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
});
