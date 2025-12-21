'use client';

import React, { memo } from 'react';
import { Users, TrendingUp, TrendingDown, Award, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { IndustryBenchmark } from '../lib/mocks';

interface BenchmarkComparisonProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  benchmarks: IndustryBenchmark[];
  overallPercentile: number;
}

function getPercentileLabel(percentile: number): string {
  if (percentile >= 90) return 'Top 10%';
  if (percentile >= 75) return 'Top 25%';
  if (percentile >= 50) return 'Above Average';
  if (percentile >= 25) return 'Below Average';
  return 'Bottom 25%';
}

function getPercentileColor(percentile: number): string {
  if (percentile >= 75) return 'text-green-600';
  if (percentile >= 50) return 'text-amber-600';
  return 'text-red-600';
}

function getPercentileBadgeVariant(percentile: number): 'success' | 'warning' | 'destructive' {
  if (percentile >= 75) return 'success';
  if (percentile >= 50) return 'warning';
  return 'destructive';
}

const BenchmarkBar = memo(function BenchmarkBar({
  benchmark,
  index,
}: {
  benchmark: IndustryBenchmark;
  index: number;
}) {
  const isAboveAvg = benchmark.yourScore >= benchmark.industryAvg;
  const barWidth = Math.max(benchmark.topQuartile, benchmark.yourScore) + 10;

  return (
    <div
      className="p-4 border border-zinc-100 rounded-lg animate-in fade-in slide-in-from-bottom-2"
      style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'both' }}
      data-testid={`benchmark-row-${index}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-zinc-900">{benchmark.category}</span>
          <Badge variant={getPercentileBadgeVariant(benchmark.percentile)}>
            {getPercentileLabel(benchmark.percentile)}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn('font-bold text-lg', getPercentileColor(benchmark.percentile))}>
            {benchmark.yourScore}
          </span>
          <div className={cn('flex items-center gap-1', isAboveAvg ? 'text-green-600' : 'text-red-600')}>
            {isAboveAvg ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="text-sm font-medium">
              {isAboveAvg ? '+' : ''}
              {benchmark.yourScore - benchmark.industryAvg}
            </span>
          </div>
        </div>
      </div>

      {/* Visual benchmark bar */}
      <div className="relative h-8 bg-zinc-100 rounded-full overflow-visible">
        {/* Bottom quartile zone */}
        <div
          className="absolute inset-y-0 left-0 bg-red-100 rounded-l-full"
          style={{ width: `${(benchmark.bottomQuartile / barWidth) * 100}%` }}
        />
        {/* Middle zone */}
        <div
          className="absolute inset-y-0 bg-amber-100"
          style={{
            left: `${(benchmark.bottomQuartile / barWidth) * 100}%`,
            width: `${((benchmark.topQuartile - benchmark.bottomQuartile) / barWidth) * 100}%`,
          }}
        />
        {/* Top quartile zone */}
        <div
          className="absolute inset-y-0 right-0 bg-green-100 rounded-r-full"
          style={{ width: `${((barWidth - benchmark.topQuartile) / barWidth) * 100}%` }}
        />

        {/* Industry average marker */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="absolute top-1/2 -translate-y-1/2 w-1 h-full bg-zinc-400 z-10"
                style={{ left: `${(benchmark.industryAvg / barWidth) * 100}%` }}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Industry Average: {benchmark.industryAvg}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Your score marker */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white z-20 shadow-md cursor-pointer transition-transform hover:scale-110',
                  benchmark.percentile >= 75
                    ? 'bg-green-500'
                    : benchmark.percentile >= 50
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                )}
                style={{ left: `calc(${(benchmark.yourScore / barWidth) * 100}% - 8px)` }}
                data-testid={`benchmark-marker-${index}`}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs font-medium">Your Score: {benchmark.yourScore}</p>
              <p className="text-xs text-zinc-400">{benchmark.percentile}th percentile</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-2 text-xs text-zinc-500">
        <div className="flex items-center gap-1">
          <span>Bottom 25%: &lt;{benchmark.bottomQuartile}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-zinc-400">|</span>
          <span>Avg: {benchmark.industryAvg}</span>
          <span className="text-zinc-400">|</span>
        </div>
        <div className="flex items-center gap-1">
          <span>Top 25%: &gt;{benchmark.topQuartile}</span>
        </div>
      </div>
    </div>
  );
});

export const BenchmarkComparison = memo(function BenchmarkComparison({
  open,
  onOpenChange,
  benchmarks,
  overallPercentile,
}: BenchmarkComparisonProps) {
  const aboveAvgCount = benchmarks.filter((b) => b.yourScore >= b.industryAvg).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
        data-testid="benchmark-comparison-modal"
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="flex items-center gap-2">
                Industry Benchmark Comparison
              </DialogTitle>
              <DialogDescription>
                Compare your portfolio performance against anonymized peer institutions
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 py-4 border-b border-zinc-100">
          <div className="text-center p-3 bg-zinc-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Award className="w-4 h-4 text-amber-500" />
              <span className={cn('text-2xl font-bold', getPercentileColor(overallPercentile))}>
                {overallPercentile}th
              </span>
            </div>
            <p className="text-xs text-zinc-500">Overall Percentile</p>
          </div>
          <div className="text-center p-3 bg-zinc-50 rounded-lg">
            <span className="text-2xl font-bold text-green-600">{aboveAvgCount}</span>
            <span className="text-xl text-zinc-400">/{benchmarks.length}</span>
            <p className="text-xs text-zinc-500">Above Industry Avg</p>
          </div>
          <div className="text-center p-3 bg-zinc-50 rounded-lg">
            <span className="text-2xl font-bold text-zinc-900">247</span>
            <p className="text-xs text-zinc-500">Peer Institutions</p>
          </div>
        </div>

        {/* Info Note */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            Benchmarks are calculated from anonymized data across 247 peer institutions with similar
            portfolio sizes and loan types. Data updated monthly.
          </p>
        </div>

        {/* Benchmark List */}
        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          {benchmarks.map((benchmark, index) => (
            <BenchmarkBar key={benchmark.category} benchmark={benchmark} index={index} />
          ))}
        </div>

        {/* Legend */}
        <div className="pt-4 border-t border-zinc-100">
          <p className="text-xs text-zinc-500 mb-2">How to read the chart:</p>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-100 border border-red-200" />
              <span>Bottom Quartile</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-amber-100 border border-amber-200" />
              <span>Middle 50%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-100 border border-green-200" />
              <span>Top Quartile</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-1 bg-zinc-400" />
              <span>Industry Avg</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-zinc-900" />
              <span>Your Score</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
