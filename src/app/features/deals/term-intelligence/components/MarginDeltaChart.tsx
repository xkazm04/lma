'use client';

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MarginNegotiationDelta, TimeSeriesDataPoint } from '../lib/types';
import { formatPercent, getDeltaColor } from '../lib/mock-data';

interface MarginDeltaChartProps {
  marginDeltas: MarginNegotiationDelta[];
  timeSeries: TimeSeriesDataPoint[];
  avgDelta: number;
  marketAvgDelta: number;
}

export function MarginDeltaChart({
  marginDeltas,
  timeSeries,
  avgDelta,
  marketAvgDelta,
}: MarginDeltaChartProps) {
  const sortedDeals = useMemo(
    () => [...marginDeltas].sort((a, b) => new Date(b.closedDate).getTime() - new Date(a.closedDate).getTime()),
    [marginDeltas]
  );

  const variance = avgDelta - marketAvgDelta;
  const performanceVsMarket = variance < 0 ? 'outperforming' : variance > 0 ? 'underperforming' : 'at market';

  // Calculate chart bounds for visualization
  const maxDelta = Math.max(...marginDeltas.map((d) => Math.abs(d.delta)));
  const chartScale = maxDelta > 0 ? 100 / (maxDelta * 2) : 50;

  return (
    <Card data-testid="margin-delta-chart">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Margin Negotiation Delta vs. Initial Ask</CardTitle>
            <CardDescription>
              Track how your final margins compare to counterparty initial asks across deals
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'text-sm px-3 py-1',
              performanceVsMarket === 'outperforming' && 'bg-green-50 text-green-700 border-green-200',
              performanceVsMarket === 'underperforming' && 'bg-amber-50 text-amber-700 border-amber-200',
              performanceVsMarket === 'at market' && 'bg-blue-50 text-blue-700 border-blue-200'
            )}
            data-testid="margin-performance-badge"
          >
            {performanceVsMarket === 'outperforming' ? 'Outperforming Market' :
             performanceVsMarket === 'underperforming' ? 'Below Market' : 'At Market'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-zinc-50 rounded-lg">
            <p className="text-sm text-zinc-500 mb-1">Your Avg Delta</p>
            <p className={cn('text-2xl font-bold', getDeltaColor(avgDelta))}>
              {avgDelta > 0 ? '+' : ''}{(avgDelta * 100).toFixed(0)}bps
            </p>
            <p className="text-xs text-zinc-400 mt-1">vs initial ask</p>
          </div>
          <div className="text-center p-4 bg-zinc-50 rounded-lg">
            <p className="text-sm text-zinc-500 mb-1">Market Avg Delta</p>
            <p className="text-2xl font-bold text-zinc-700">
              {marketAvgDelta > 0 ? '+' : ''}{(marketAvgDelta * 100).toFixed(0)}bps
            </p>
            <p className="text-xs text-zinc-400 mt-1">benchmark</p>
          </div>
          <div className="text-center p-4 bg-zinc-50 rounded-lg">
            <p className="text-sm text-zinc-500 mb-1">Your Variance</p>
            <div className="flex items-center justify-center gap-1">
              <p className={cn('text-2xl font-bold', getDeltaColor(variance))}>
                {variance > 0 ? '+' : ''}{(variance * 100).toFixed(0)}bps
              </p>
              {variance < 0 ? (
                <ArrowDownRight className="w-5 h-5 text-green-600" />
              ) : variance > 0 ? (
                <ArrowUpRight className="w-5 h-5 text-red-600" />
              ) : (
                <Minus className="w-5 h-5 text-zinc-500" />
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-1">vs market</p>
          </div>
        </div>

        {/* Time Series Mini Chart */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-zinc-700">12-Month Trend</h4>
          <div className="h-20 flex items-end gap-1">
            {timeSeries.map((point, idx) => {
              const height = Math.abs(point.value) * 400;
              const isNegative = point.value < 0;
              return (
                <div
                  key={point.period}
                  className="flex-1 flex flex-col items-center gap-1"
                  data-testid={`trend-bar-${idx}`}
                >
                  <div
                    className={cn(
                      'w-full rounded-t transition-all',
                      isNegative ? 'bg-green-400' : 'bg-red-400'
                    )}
                    style={{ height: `${Math.min(height, 100)}%` }}
                  />
                  {idx % 3 === 0 && (
                    <span className="text-[10px] text-zinc-400">
                      {point.period.substring(5)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-zinc-400">
            <span>Better than ask</span>
            <span>Worse than ask</span>
          </div>
        </div>

        {/* Deal-by-Deal Breakdown */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-zinc-700">Recent Deals</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sortedDeals.slice(0, 6).map((deal) => (
              <div
                key={deal.dealId}
                className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
                data-testid={`deal-row-${deal.dealId}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">{deal.dealName}</p>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span>{deal.counterparty}</span>
                    <span>•</span>
                    <span>${deal.facilitySizeM}M</span>
                    <span>•</span>
                    <span>{deal.dealType.replace('_', ' ')}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-500">{deal.initialAsk}%</span>
                    <span className="text-zinc-300">→</span>
                    <span className="text-sm font-medium text-zinc-900">{deal.finalMargin}%</span>
                  </div>
                  <div className={cn('text-sm font-semibold', getDeltaColor(deal.delta))}>
                    {deal.delta > 0 ? '+' : ''}{(deal.delta * 100).toFixed(0)}bps
                  </div>
                </div>
                <div className="w-24">
                  {/* Mini bar showing delta */}
                  <div className="h-2 bg-zinc-200 rounded-full overflow-hidden relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-px h-full bg-zinc-400" />
                    </div>
                    <div
                      className={cn(
                        'h-full rounded-full absolute',
                        deal.delta < 0 ? 'bg-green-500' : 'bg-red-500',
                        deal.delta < 0 ? 'right-1/2' : 'left-1/2'
                      )}
                      style={{
                        width: `${Math.min(Math.abs(deal.delta) * chartScale, 50)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 pt-2 border-t border-zinc-100">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-xs text-zinc-600">Better than initial ask</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span className="text-xs text-zinc-600">Worse than initial ask</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
