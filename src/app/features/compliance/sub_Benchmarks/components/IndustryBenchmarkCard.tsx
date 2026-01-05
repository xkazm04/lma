'use client';

import React, { memo, useMemo, useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, Minus, Users, Building2, ArrowUp, ArrowDown, Diamond } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IndustryBenchmark, CovenantBenchmarkComparison, PeerInstitution, PercentileMovement } from '../../lib';
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

interface PeerMarkerProps {
  peer: PeerInstitution;
  covenantType: string;
}

function PeerMarker({ peer, covenantType }: PeerMarkerProps) {
  const leftPosition = Math.min(100, Math.max(0, peer.percentile_rank));

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="absolute top-1/2 -translate-y-1/2 transform cursor-pointer z-10 group"
          style={{ left: `${leftPosition}%` }}
          data-testid={`peer-marker-${peer.id}`}
        >
          <div
            className={cn(
              'w-2.5 h-2.5 rotate-45 bg-blue-500 border border-blue-600',
              'shadow-sm transition-all duration-200',
              'hover:scale-125 hover:bg-blue-400 hover:shadow-md'
            )}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-1.5">
          <p className="font-semibold text-sm">{peer.name}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <span className="text-zinc-500">Percentile:</span>
            <span className="font-medium">{peer.percentile_rank}th</span>
            <span className="text-zinc-500">Threshold:</span>
            <span className="font-medium">{formatValue(peer.threshold_value, covenantType)}</span>
            <span className="text-zinc-500">Current:</span>
            <span className="font-medium">{formatValue(peer.current_value, covenantType)}</span>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

interface MovementIndicatorProps {
  movement: PercentileMovement;
}

function MovementIndicator({ movement }: MovementIndicatorProps) {
  if (movement.direction === 'stable') {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs text-zinc-500"
        data-testid="movement-indicator-stable"
      >
        <Minus className="w-3 h-3" />
        No change from {movement.previous_quarter}
      </span>
    );
  }

  const isUp = movement.direction === 'up';
  const Icon = isUp ? ArrowUp : ArrowDown;
  const colorClasses = isUp ? 'text-green-600' : 'text-red-600';

  return (
    <span
      className={cn('inline-flex items-center gap-1 text-xs font-medium', colorClasses)}
      data-testid={`movement-indicator-${movement.direction}`}
    >
      <Icon className="w-3 h-3" />
      {isUp ? '+' : '-'}{Math.abs(movement.change_points)} pts from {movement.previous_quarter}
    </span>
  );
}

export const IndustryBenchmarkCard = memo(function IndustryBenchmarkCard({
  benchmark,
  comparison,
  index = 0,
}: IndustryBenchmarkCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Scroll-into-view animation with Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setIsVisible(true);
            setHasAnimated(true);
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  const TrendIcon = benchmark.trend_direction === 'improving' ? TrendingUp :
                    benchmark.trend_direction === 'declining' ? TrendingDown : Minus;

  const trendColor = benchmark.trend_direction === 'improving' ? 'text-green-600' :
                     benchmark.trend_direction === 'declining' ? 'text-red-600' : 'text-zinc-500';

  const percentileWidth = comparison ? Math.min(100, Math.max(0, comparison.percentile_rank)) : 0;

  // Get previous position for movement indicator visualization
  const previousPercentilePosition = comparison?.percentile_movement
    ? Math.min(100, Math.max(0, comparison.percentile_movement.previous_percentile))
    : null;

  return (
    <TooltipProvider>
      <Card
        ref={cardRef}
        className={cn(
          'hover:shadow-md transition-all duration-300',
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )}
        style={{
          transitionDelay: `${index * 50}ms`,
        }}
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
                  <div className="flex items-center gap-2">
                    <span>Percentile Rank</span>
                    {/* Movement indicator */}
                    {comparison.percentile_movement && (
                      <MovementIndicator movement={comparison.percentile_movement} />
                    )}
                  </div>
                  <span className="font-medium text-zinc-900" data-testid="percentile-rank-value">
                    {comparison.percentile_rank}th
                  </span>
                </div>

                {/* Enhanced Percentile Bar with Peer Markers */}
                <div
                  className="relative h-6 bg-zinc-100 rounded-full"
                  data-testid="percentile-bar"
                >
                  {/* Previous position ghost marker (if movement exists) */}
                  {previousPercentilePosition !== null && comparison.percentile_movement?.direction !== 'stable' && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-dashed border-zinc-400 opacity-50 z-5"
                      style={{ left: `calc(${previousPercentilePosition}% - 8px)` }}
                      data-testid="previous-position-marker"
                    />
                  )}

                  {/* Main progress bar */}
                  <div
                    className={cn(
                      'absolute top-1/2 -translate-y-1/2 left-0 h-3 rounded-full transition-all duration-700',
                      isVisible ? 'opacity-100' : 'opacity-0',
                      comparison.market_position === 'tight' && 'bg-red-500',
                      comparison.market_position === 'market' && 'bg-green-500',
                      comparison.market_position === 'loose' && 'bg-amber-500'
                    )}
                    style={{
                      width: isVisible ? `${percentileWidth}%` : '0%',
                      transitionDelay: `${index * 50 + 200}ms`
                    }}
                    data-testid="percentile-progress-bar"
                  />

                  {/* Marker lines at 25th, 50th, and 75th percentile */}
                  <div className="absolute top-1 bottom-1 left-[25%] w-px bg-zinc-300" />
                  <div className="absolute top-1 bottom-1 left-[50%] w-px bg-zinc-400" />
                  <div className="absolute top-1 bottom-1 left-[75%] w-px bg-zinc-300" />

                  {/* Peer institution markers (diamond shapes) */}
                  {comparison.peer_institutions && comparison.peer_institutions.map((peer) => (
                    <PeerMarker
                      key={peer.id}
                      peer={peer}
                      covenantType={benchmark.covenant_type}
                    />
                  ))}

                  {/* Your position marker (circle, more prominent) */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          'absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white shadow-md z-20 cursor-pointer',
                          'transition-all duration-700',
                          comparison.market_position === 'tight' && 'bg-red-600',
                          comparison.market_position === 'market' && 'bg-green-600',
                          comparison.market_position === 'loose' && 'bg-amber-600'
                        )}
                        style={{
                          left: isVisible ? `calc(${percentileWidth}% - 10px)` : '-10px',
                          transitionDelay: `${index * 50 + 200}ms`
                        }}
                        data-testid="your-position-marker"
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="space-y-1.5">
                        <p className="font-semibold text-sm">Your Position</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          <span className="text-zinc-500">Percentile:</span>
                          <span className="font-medium">{comparison.percentile_rank}th</span>
                          <span className="text-zinc-500">Threshold:</span>
                          <span className="font-medium">{formatValue(comparison.borrower_threshold, benchmark.covenant_type)}</span>
                          <span className="text-zinc-500">Current:</span>
                          <span className="font-medium">{formatValue(comparison.borrower_current_value, benchmark.covenant_type)}</span>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Peer legend (if peers exist) */}
                {comparison.peer_institutions && comparison.peer_institutions.length > 0 && (
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-500">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rotate-45 bg-blue-500" />
                      <span>Peer institutions ({comparison.peer_institutions.length})</span>
                    </div>
                  </div>
                )}

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
    </TooltipProvider>
  );
});
