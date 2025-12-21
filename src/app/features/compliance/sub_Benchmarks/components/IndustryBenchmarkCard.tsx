'use client';

import React, { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, Users, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IndustryBenchmark, CovenantBenchmarkComparison } from '../../lib';
import { getIndustrySectorLabel, getMarketPositionColor, getMarketPositionLabel } from '../../lib';

interface IndustryBenchmarkCardProps {
  benchmark: IndustryBenchmark;
  comparison?: CovenantBenchmarkComparison;
  index?: number;
}

function formatValue(value: number, covenantType: string): string {
  if (covenantType === 'minimum_liquidity' || covenantType === 'capex' || covenantType === 'net_worth') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  return `${value.toFixed(2)}x`;
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

function getCompanySizeLabel(size: string): string {
  const labels: Record<string, string> = {
    small: 'Small',
    mid_market: 'Mid-Market',
    large: 'Large',
    enterprise: 'Enterprise',
  };
  return labels[size] || size;
}

function getLoanTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    term_loan: 'Term Loan',
    revolving_credit: 'Revolver',
    abl: 'ABL',
    delayed_draw: 'Delayed Draw',
    bridge: 'Bridge',
    bilateral: 'Bilateral',
    club_deal: 'Club Deal',
    syndicated: 'Syndicated',
  };
  return labels[type] || type;
}

export const IndustryBenchmarkCard = memo(function IndustryBenchmarkCard({
  benchmark,
  comparison,
  index = 0,
}: IndustryBenchmarkCardProps) {
  const TrendIcon = benchmark.trend_direction === 'improving' ? TrendingUp :
                    benchmark.trend_direction === 'declining' ? TrendingDown : Minus;

  const trendColor = benchmark.trend_direction === 'improving' ? 'text-green-600' :
                     benchmark.trend_direction === 'declining' ? 'text-red-600' : 'text-zinc-500';

  const percentileWidth = comparison ? Math.min(100, Math.max(0, comparison.percentile_rank)) : 0;

  return (
    <Card
      className="animate-in fade-in slide-in-from-bottom-3 hover:shadow-md transition-shadow"
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
      data-testid={`industry-benchmark-card-${benchmark.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              {getCovenantTypeLabel(benchmark.covenant_type)}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                <Building2 className="w-3 h-3 mr-1" />
                {getIndustrySectorLabel(benchmark.industry)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {getCompanySizeLabel(benchmark.company_size)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {getLoanTypeLabel(benchmark.loan_type)}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <TrendIcon className={cn('w-4 h-4', trendColor)} />
            <span className={cn('font-medium', trendColor)}>
              {benchmark.trend_change_12m > 0 ? '+' : ''}{benchmark.trend_change_12m.toFixed(1)}%
            </span>
            <span className="text-zinc-400 text-xs ml-1">12mo</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Current Market Values */}
          <div className="grid grid-cols-3 gap-3 p-2.5 bg-zinc-50 rounded-lg">
            <div className="text-center">
              <p className="text-xs text-zinc-500 mb-1">25th %ile</p>
              <p className="text-sm font-semibold text-zinc-700">
                {formatValue(benchmark.current_percentile_25, benchmark.covenant_type)}
              </p>
            </div>
            <div className="text-center border-x border-zinc-200">
              <p className="text-xs text-zinc-500 mb-1">Median</p>
              <p className="text-lg font-bold text-zinc-900">
                {formatValue(benchmark.current_median, benchmark.covenant_type)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-zinc-500 mb-1">75th %ile</p>
              <p className="text-sm font-semibold text-zinc-700">
                {formatValue(benchmark.current_percentile_75, benchmark.covenant_type)}
              </p>
            </div>
          </div>

          {/* Sample Size */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-zinc-500">
              <Users className="w-4 h-4" />
              <span>{benchmark.sample_size} data points</span>
            </div>
            <span className="text-xs text-zinc-400">
              Range: {formatValue(benchmark.current_min, benchmark.covenant_type)} - {formatValue(benchmark.current_max, benchmark.covenant_type)}
            </span>
          </div>

          {/* Comparison Section (if comparison data exists) */}
          {comparison && (
            <div className="pt-3 border-t border-zinc-100">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-zinc-900">{comparison.borrower_name}</p>
                  <p className="text-xs text-zinc-500">{comparison.facility_name}</p>
                </div>
                <Badge className={cn(getMarketPositionColor(comparison.market_position))}>
                  {getMarketPositionLabel(comparison.market_position)}
                </Badge>
              </div>

              {/* Percentile Position */}
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                  <span>Percentile Rank</span>
                  <span className="font-medium text-zinc-900">{comparison.percentile_rank}th</span>
                </div>
                <div className="relative h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'absolute top-0 left-0 h-full rounded-full transition-all duration-500',
                      comparison.market_position === 'tight' && 'bg-red-500',
                      comparison.market_position === 'market' && 'bg-green-500',
                      comparison.market_position === 'loose' && 'bg-amber-500'
                    )}
                    style={{ width: `${percentileWidth}%` }}
                  />
                  {/* Marker lines at 25th and 75th percentile */}
                  <div className="absolute top-0 left-[25%] w-px h-full bg-zinc-300" />
                  <div className="absolute top-0 left-[50%] w-px h-full bg-zinc-400" />
                  <div className="absolute top-0 left-[75%] w-px h-full bg-zinc-300" />
                </div>
                <div className="flex justify-between text-xs text-zinc-400 mt-1">
                  <span>Tighter</span>
                  <span>Market</span>
                  <span>Looser</span>
                </div>
              </div>

              {/* Threshold Comparison */}
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-zinc-500">Your Threshold</p>
                  <p className="text-sm font-semibold text-zinc-900">
                    {formatValue(comparison.borrower_threshold, benchmark.covenant_type)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Deviation from Median</p>
                  <p className={cn(
                    'text-sm font-semibold',
                    comparison.deviation_from_median < 0 ? 'text-red-600' :
                    comparison.deviation_from_median > 0 ? 'text-amber-600' : 'text-green-600'
                  )}>
                    {comparison.deviation_from_median > 0 ? '+' : ''}{comparison.deviation_from_median.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Summary */}
              <p className="mt-2 text-xs text-zinc-600 leading-relaxed">
                {comparison.comparison_summary}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
