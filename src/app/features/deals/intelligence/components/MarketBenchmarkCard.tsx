'use client';

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { CovenantBenchmark } from '../lib/types';
import { calculatePercentilePosition } from '../lib/mock-data';

interface MarketBenchmarkCardProps {
  title: string;
  description?: string;
  current: number;
  marketMedian: number;
  marketP25: number;
  marketP75: number;
  unit: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  tighterIsHigher?: boolean;
  formatValue?: (value: number) => string;
}

export function MarketBenchmarkCard({
  title,
  description,
  current,
  marketMedian,
  marketP25,
  marketP75,
  unit,
  trend,
  trendValue,
  tighterIsHigher = false,
  formatValue,
}: MarketBenchmarkCardProps) {
  const percentilePosition = useMemo(
    () => calculatePercentilePosition(current, marketP25, marketP75),
    [current, marketP25, marketP75]
  );

  const position = useMemo(() => {
    // Determine if current value is favorable, at market, or aggressive
    // For margins (tighterIsHigher = false): lower is better for borrower
    // For coverage (tighterIsHigher = true): higher is better for lender
    const diff = current - marketMedian;
    const threshold = (marketP75 - marketP25) * 0.25;

    if (tighterIsHigher) {
      if (diff > threshold) return 'favorable'; // Higher coverage is favorable for lender
      if (diff < -threshold) return 'aggressive';
      return 'market';
    } else {
      if (diff < -threshold) return 'favorable'; // Lower margin is favorable for borrower
      if (diff > threshold) return 'aggressive';
      return 'market';
    }
  }, [current, marketMedian, marketP25, marketP75, tighterIsHigher]);

  const displayValue = formatValue ? formatValue(current) : `${current}${unit}`;
  const displayMedian = formatValue ? formatValue(marketMedian) : `${marketMedian}${unit}`;
  const displayP25 = formatValue ? formatValue(marketP25) : `${marketP25}${unit}`;
  const displayP75 = formatValue ? formatValue(marketP75) : `${marketP75}${unit}`;

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'down' ? 'text-green-600' : trend === 'up' ? 'text-amber-600' : 'text-zinc-500';

  return (
    <Card className="h-full" data-testid={`market-benchmark-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {description && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3.5 h-3.5 text-zinc-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {trend && (
            <div className={cn('flex items-center gap-1 text-xs', trendColor)}>
              <TrendIcon className="w-3.5 h-3.5" />
              {trendValue !== undefined && <span>{Math.abs(trendValue)}%</span>}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Value */}
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-zinc-900" data-testid="benchmark-current-value">
              {displayValue}
            </span>
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                position === 'favorable' && 'bg-green-50 text-green-700 border-green-200',
                position === 'market' && 'bg-blue-50 text-blue-700 border-blue-200',
                position === 'aggressive' && 'bg-amber-50 text-amber-700 border-amber-200'
              )}
              data-testid="benchmark-position-badge"
            >
              {position === 'favorable' ? 'Favorable' : position === 'aggressive' ? 'Aggressive' : 'At Market'}
            </Badge>
          </div>

          {/* Percentile Bar */}
          <div className="space-y-2">
            <div className="relative h-2 bg-zinc-100 rounded-full overflow-visible">
              {/* P25-P75 Range */}
              <div
                className="absolute h-full bg-blue-100 rounded-full"
                style={{ left: '25%', width: '50%' }}
              />
              {/* Median Marker */}
              <div
                className="absolute w-0.5 h-3 bg-blue-400 -top-0.5"
                style={{ left: '50%' }}
              />
              {/* Current Position Marker */}
              <div
                className={cn(
                  'absolute w-3 h-3 rounded-full -top-0.5 border-2 border-white shadow-sm transition-all',
                  position === 'favorable' && 'bg-green-500',
                  position === 'market' && 'bg-blue-500',
                  position === 'aggressive' && 'bg-amber-500'
                )}
                style={{ left: `${percentilePosition}%`, transform: 'translateX(-50%)' }}
                data-testid="benchmark-position-marker"
              />
            </div>

            {/* Labels */}
            <div className="flex justify-between text-xs text-zinc-500">
              <span>{displayP25}</span>
              <span className="text-zinc-700 font-medium">Mkt: {displayMedian}</span>
              <span>{displayP75}</span>
            </div>
            <div className="flex justify-between text-xs text-zinc-400">
              <span>P25</span>
              <span>P75</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface CovenantBenchmarkGridProps {
  covenants: CovenantBenchmark[];
}

export function CovenantBenchmarkGrid({ covenants }: CovenantBenchmarkGridProps) {
  const formatCovenantValue = (value: number, unit: string): string => {
    if (unit === '$') {
      if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(0)}M`;
      }
      return `$${value.toLocaleString()}`;
    }
    return `${value}${unit}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="covenant-benchmark-grid">
      {covenants.map((covenant) => (
        <MarketBenchmarkCard
          key={covenant.type}
          title={covenant.label}
          current={covenant.current}
          marketMedian={covenant.marketMedian}
          marketP25={covenant.marketP25}
          marketP75={covenant.marketP75}
          unit={covenant.unit}
          tighterIsHigher={covenant.tighterIsHigher}
          formatValue={(v) => formatCovenantValue(v, covenant.unit)}
        />
      ))}
    </div>
  );
}
