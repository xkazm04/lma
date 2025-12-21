'use client';

import React, { memo, useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Info,
  Target,
  Percent,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { MarketBenchmark } from '@/app/features/documents/lib/types';

interface MarketBenchmarksProps {
  documentId: string;
  onBenchmarkSelect?: (benchmark: MarketBenchmark) => void;
}

const AssessmentIcon = memo(function AssessmentIcon({
  assessment,
}: {
  assessment: MarketBenchmark['assessment'];
}) {
  switch (assessment) {
    case 'above_market':
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    case 'below_market':
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    default:
      return <Minus className="w-4 h-4 text-zinc-400" />;
  }
});

const PercentileBar = memo(function PercentileBar({
  percentile,
  assessment,
}: {
  percentile: number;
  assessment: MarketBenchmark['assessment'];
}) {
  const barColor =
    assessment === 'above_market'
      ? 'bg-green-500'
      : assessment === 'below_market'
        ? 'bg-red-500'
        : 'bg-blue-500';

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-zinc-400 mb-1">
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>
      <div className="relative h-2 bg-zinc-100 rounded-full overflow-hidden">
        {/* Background gradient showing distribution */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-200 via-yellow-100 to-green-200 opacity-30" />
        {/* Percentile marker */}
        <div
          className={`absolute h-full ${barColor} rounded-full transition-all duration-500`}
          style={{ width: `${percentile}%` }}
        />
        {/* Percentile indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-zinc-800 rounded-full shadow-sm transition-all duration-500"
          style={{ left: `calc(${percentile}% - 6px)` }}
        />
      </div>
    </div>
  );
});

const BenchmarkCard = memo(function BenchmarkCard({
  benchmark,
  index,
  isExpanded,
  onToggle,
}: {
  benchmark: MarketBenchmark;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const assessmentColors = {
    above_market: 'bg-green-50 border-green-200',
    at_market: 'bg-blue-50 border-blue-200',
    below_market: 'bg-red-50 border-red-200',
  };

  const assessmentBadgeVariant = {
    above_market: 'success',
    at_market: 'info',
    below_market: 'destructive',
  } as const;

  const assessmentLabels = {
    above_market: 'Above Market',
    at_market: 'At Market',
    below_market: 'Below Market',
  };

  const categoryLabels = {
    financial_terms: 'Financial Terms',
    covenants: 'Covenants',
    legal_provisions: 'Legal Provisions',
    key_dates: 'Key Dates',
  };

  return (
    <Card
      className={`animate-in fade-in slide-in-from-bottom-2 transition-all duration-200 hover:shadow-md ${assessmentColors[benchmark.assessment]}`}
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
      data-testid={`benchmark-card-${benchmark.id}`}
    >
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <button
            onClick={onToggle}
            className="p-2 rounded-lg bg-white/80 transition-transform hover:scale-110 flex-shrink-0"
            data-testid={`toggle-benchmark-details-${benchmark.id}`}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-zinc-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <AssessmentIcon assessment={benchmark.assessment} />
                <h3 className="font-medium text-zinc-900">{benchmark.termName}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={assessmentBadgeVariant[benchmark.assessment]}>
                  {assessmentLabels[benchmark.assessment]}
                </Badge>
                <Badge variant="outline">{categoryLabels[benchmark.category]}</Badge>
              </div>
            </div>

            {/* Current vs Market Values */}
            <div className="grid grid-cols-3 gap-4 mt-3">
              <div className="text-center p-2 rounded bg-white/60">
                <div className="text-xs text-zinc-500">Current</div>
                <div className="font-semibold text-zinc-800">{benchmark.currentValue}</div>
              </div>
              <div className="text-center p-2 rounded bg-white/60">
                <div className="text-xs text-zinc-500">Market Avg</div>
                <div className="font-semibold text-zinc-800">{benchmark.marketAverage}</div>
              </div>
              <div className="text-center p-2 rounded bg-white/60">
                <div className="text-xs text-zinc-500">Percentile</div>
                <div className="font-semibold text-zinc-800">{benchmark.percentile}th</div>
              </div>
            </div>

            {/* Percentile Bar */}
            <div className="mt-3">
              <PercentileBar percentile={benchmark.percentile} assessment={benchmark.assessment} />
            </div>

            <div className="flex items-center gap-4 mt-2 text-xs text-zinc-400">
              <span>Sample: {benchmark.sampleSize} deals</span>
              <span className="text-zinc-300">•</span>
              <span>{benchmark.benchmarkPeriod}</span>
              {benchmark.industrySegment && (
                <>
                  <span className="text-zinc-300">•</span>
                  <span>{benchmark.industrySegment}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-white/50 animate-in fade-in slide-in-from-top-2 duration-200 space-y-4">
            {/* Market Range */}
            <div className="bg-white/60 rounded-lg p-3">
              <h4 className="text-sm font-medium text-zinc-700 mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Market Range
              </h4>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-xs text-zinc-500">Min</div>
                  <div className="font-medium">{benchmark.marketRangeMin}</div>
                </div>
                <div className="flex-1 mx-4">
                  <div className="h-1 bg-gradient-to-r from-red-300 via-yellow-300 to-green-300 rounded-full" />
                </div>
                <div className="text-center">
                  <div className="text-xs text-zinc-500">Max</div>
                  <div className="font-medium">{benchmark.marketRangeMax}</div>
                </div>
              </div>
              {benchmark.marketMedian && (
                <div className="text-center mt-2 text-sm text-zinc-500">
                  Median: <span className="font-medium text-zinc-700">{benchmark.marketMedian}</span>
                </div>
              )}
            </div>

            {/* Market Insight */}
            <div className="flex items-start gap-2 bg-white/60 rounded-lg p-3">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-zinc-600">{benchmark.marketInsight}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export const MarketBenchmarks = memo(function MarketBenchmarks({
  documentId,
  onBenchmarkSelect,
}: MarketBenchmarksProps) {
  const [benchmarks, setBenchmarks] = useState<MarketBenchmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const fetchBenchmarks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/documents/${documentId}/similarity?type=benchmarks`);
      const data = await response.json();

      if (data.success) {
        setBenchmarks(data.data);
      } else {
        setError(data.error?.message || 'Failed to fetch benchmarks');
      }
    } catch (err) {
      setError('Failed to connect to the server');
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    fetchBenchmarks();
  }, [fetchBenchmarks]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Calculate statistics
  const aboveMarket = benchmarks.filter((b) => b.assessment === 'above_market').length;
  const atMarket = benchmarks.filter((b) => b.assessment === 'at_market').length;
  const belowMarket = benchmarks.filter((b) => b.assessment === 'below_market').length;

  const avgPercentile =
    benchmarks.length > 0
      ? Math.round(benchmarks.reduce((sum, b) => sum + b.percentile, 0) / benchmarks.length)
      : 0;

  // Group by category
  const groupedBenchmarks = benchmarks.reduce(
    (acc, benchmark) => {
      if (!acc[benchmark.category]) {
        acc[benchmark.category] = [];
      }
      acc[benchmark.category].push(benchmark);
      return acc;
    },
    {} as Record<string, MarketBenchmark[]>
  );

  const categoryOrder: MarketBenchmark['category'][] = [
    'financial_terms',
    'covenants',
    'key_dates',
    'legal_provisions',
  ];

  const sortedCategories = categoryOrder.filter((cat) => groupedBenchmarks[cat]?.length > 0);

  return (
    <div className="space-y-6" data-testid="market-benchmarks">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Market Benchmarks</CardTitle>
                <CardDescription>Compare key terms against market standards</CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchBenchmarks}
              disabled={isLoading}
              data-testid="refresh-benchmarks-btn"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Statistics */}
          {!isLoading && benchmarks.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-3 rounded-lg bg-green-50 border border-green-100">
                  <div className="text-xl font-bold text-green-600">{aboveMarket}</div>
                  <div className="text-xs text-zinc-500">Above Market</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <div className="text-xl font-bold text-blue-600">{atMarket}</div>
                  <div className="text-xs text-zinc-500">At Market</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-50 border border-red-100">
                  <div className="text-xl font-bold text-red-600">{belowMarket}</div>
                  <div className="text-xs text-zinc-500">Below Market</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-purple-50 border border-purple-100">
                  <div className="text-xl font-bold text-purple-600">{avgPercentile}th</div>
                  <div className="text-xs text-zinc-500">Avg Percentile</div>
                </div>
              </div>

              {/* Overall Position */}
              <div className="bg-zinc-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-zinc-700">
                    Overall Market Position
                  </span>
                  <div className="flex items-center gap-1">
                    <Percent className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm font-bold">{avgPercentile}th percentile</span>
                  </div>
                </div>
                <Progress value={avgPercentile} className="h-3" />
                <div className="flex justify-between text-xs text-zinc-400 mt-1">
                  <span>Below Market</span>
                  <span>At Market</span>
                  <span>Above Market</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            <p className="text-sm text-zinc-500">Loading market benchmarks...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <p className="text-red-600">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchBenchmarks}
              className="mt-2"
              data-testid="retry-benchmarks-btn"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Benchmark List by Category */}
      {!isLoading && !error && (
        <div className="space-y-6">
          {benchmarks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <BarChart3 className="w-12 h-12 mx-auto text-zinc-300 mb-3" />
                <p className="text-zinc-500">No benchmark data available</p>
                <p className="text-sm text-zinc-400 mt-1">
                  Market benchmarks will appear once the document is fully processed
                </p>
              </CardContent>
            </Card>
          ) : (
            sortedCategories.map((category) => (
              <div key={category} className="space-y-3">
                <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wide">
                  {category.replace(/_/g, ' ')} ({groupedBenchmarks[category].length})
                </h3>
                {groupedBenchmarks[category].map((benchmark, index) => (
                  <BenchmarkCard
                    key={benchmark.id}
                    benchmark={benchmark}
                    index={index}
                    isExpanded={expandedIds.has(benchmark.id)}
                    onToggle={() => toggleExpanded(benchmark.id)}
                  />
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
});
