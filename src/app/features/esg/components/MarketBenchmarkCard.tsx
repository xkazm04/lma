'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import type { MarketBenchmark, TrendDirection } from '../lib';

interface MarketBenchmarkCardProps {
  data: MarketBenchmark[];
  title?: string;
  description?: string;
}

function getTrendIcon(trend: TrendDirection) {
  switch (trend) {
    case 'improving':
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    case 'declining':
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    case 'stable':
      return <Minus className="w-4 h-4 text-zinc-400" />;
    default:
      return null;
  }
}

function getPercentileColor(percentile: number): string {
  if (percentile >= 75) return 'text-green-600';
  if (percentile >= 50) return 'text-blue-600';
  if (percentile >= 25) return 'text-amber-600';
  return 'text-red-600';
}

function getPercentileBadgeVariant(percentile: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (percentile >= 75) return 'default';
  if (percentile >= 50) return 'outline';
  if (percentile >= 25) return 'secondary';
  return 'destructive';
}

function formatValue(value: number, unit: string): string {
  if (unit === '%') return `${value.toFixed(1)}%`;
  if (unit === 'bps') return `${value}bps`;
  if (unit === 'score') return value.toString();
  if (unit === 'tCO2e/$M') return `${value} ${unit}`;
  return value.toString();
}

function getCategoryIcon(category: string) {
  const iconClass = 'w-4 h-4';
  switch (category) {
    case 'esg_performance':
      return <div className={`${iconClass} rounded-full bg-green-100 p-0.5`}><div className="w-full h-full rounded-full bg-green-500" /></div>;
    case 'portfolio_composition':
      return <div className={`${iconClass} rounded-full bg-blue-100 p-0.5`}><div className="w-full h-full rounded-full bg-blue-500" /></div>;
    case 'yield':
      return <div className={`${iconClass} rounded-full bg-purple-100 p-0.5`}><div className="w-full h-full rounded-full bg-purple-500" /></div>;
    case 'risk':
      return <div className={`${iconClass} rounded-full bg-amber-100 p-0.5`}><div className="w-full h-full rounded-full bg-amber-500" /></div>;
    default:
      return <div className={`${iconClass} rounded-full bg-zinc-100 p-0.5`}><div className="w-full h-full rounded-full bg-zinc-500" /></div>;
  }
}

export const MarketBenchmarkCard = memo(function MarketBenchmarkCard({
  data,
  title = 'Market Benchmarks',
  description = 'Portfolio performance vs market peers',
}: MarketBenchmarkCardProps) {
  const avgPercentile = data.reduce((sum, item) => sum + item.percentile_rank, 0) / data.length;

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500" data-testid="market-benchmark-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-zinc-500">Avg Percentile</div>
            <div className={`text-lg font-bold ${getPercentileColor(avgPercentile)}`}>
              {avgPercentile.toFixed(0)}th
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((benchmark) => (
            <div
              key={benchmark.metric_name}
              className="p-2.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors"
              data-testid={`benchmark-item-${benchmark.metric_name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(benchmark.metric_category)}
                  <span className="font-medium text-zinc-900">{benchmark.metric_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getTrendIcon(benchmark.trend)}
                  <Badge variant={getPercentileBadgeVariant(benchmark.percentile_rank)}>
                    {benchmark.percentile_rank}th percentile
                  </Badge>
                </div>
              </div>

              {/* Benchmark Range Visualization */}
              <div className="relative h-6 bg-zinc-200 rounded-full overflow-hidden">
                {/* Bottom Quartile Zone */}
                <div
                  className="absolute h-full bg-red-100"
                  style={{ left: 0, width: '25%' }}
                />
                {/* Middle Zones */}
                <div
                  className="absolute h-full bg-amber-100"
                  style={{ left: '25%', width: '25%' }}
                />
                <div
                  className="absolute h-full bg-blue-100"
                  style={{ left: '50%', width: '25%' }}
                />
                {/* Top Quartile Zone */}
                <div
                  className="absolute h-full bg-green-100"
                  style={{ left: '75%', width: '25%' }}
                />
                {/* Portfolio Position Marker */}
                <div
                  className={`absolute top-0 bottom-0 w-1 ${getPercentileColor(benchmark.percentile_rank).replace('text-', 'bg-')}`}
                  style={{ left: `${benchmark.percentile_rank}%` }}
                >
                  <div className={`absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold ${getPercentileColor(benchmark.percentile_rank)}`}>
                    {formatValue(benchmark.portfolio_value, benchmark.unit)}
                  </div>
                </div>
              </div>

              {/* Labels */}
              <div className="flex justify-between text-xs text-zinc-500 mt-1">
                <div className="flex flex-col">
                  <span>Bottom 25%</span>
                  <span className="text-zinc-400">{formatValue(benchmark.bottom_quartile, benchmark.unit)}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span>Market Avg</span>
                  <span className="text-zinc-400">{formatValue(benchmark.market_average, benchmark.unit)}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span>Top 25%</span>
                  <span className="text-zinc-400">{formatValue(benchmark.top_quartile, benchmark.unit)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
