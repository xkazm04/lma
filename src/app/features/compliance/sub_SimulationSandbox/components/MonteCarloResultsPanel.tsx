'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingDown, AlertTriangle, Activity, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MonteCarloResult, ProbabilityDistribution } from '../lib/types';

interface MonteCarloResultsPanelProps {
  result: MonteCarloResult;
}

function formatPercentage(value: number): string {
  return value.toFixed(1) + '%';
}

function getProbabilityColor(probability: number): string {
  if (probability > 75) return 'text-red-600';
  if (probability > 50) return 'text-orange-600';
  if (probability > 25) return 'text-amber-600';
  return 'text-green-600';
}

function getProbabilityBadgeColor(probability: number): string {
  if (probability > 75) return 'bg-red-100 text-red-700';
  if (probability > 50) return 'bg-orange-100 text-orange-700';
  if (probability > 25) return 'bg-amber-100 text-amber-700';
  return 'bg-green-100 text-green-700';
}

export const MonteCarloResultsPanel = memo(function MonteCarloResultsPanel({
  result,
}: MonteCarloResultsPanelProps) {
  const distributions = Object.values(result.distributions);

  return (
    <Card className="animate-in fade-in" data-testid="monte-carlo-results-panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              Monte Carlo Analysis
            </CardTitle>
            <CardDescription>
              {result.config.iterations.toLocaleString()} simulations completed in {(result.runtime_ms / 1000).toFixed(2)}s
            </CardDescription>
          </div>
          <Badge className={getProbabilityBadgeColor(result.portfolio_breach_probability)}>
            {formatPercentage(result.portfolio_breach_probability)} Portfolio Risk
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-50 rounded-lg p-3 text-center">
            <p className="text-xs text-zinc-500 mb-1">Mean Headroom</p>
            <p className={cn('text-lg font-bold', getProbabilityColor(100 - result.summary.mean_portfolio_headroom))}>
              {result.summary.mean_portfolio_headroom.toFixed(1)}%
            </p>
          </div>
          <div className="bg-zinc-50 rounded-lg p-3 text-center">
            <p className="text-xs text-zinc-500 mb-1">Std Deviation</p>
            <p className="text-lg font-bold text-zinc-900">
              ±{result.summary.std_dev_portfolio_headroom.toFixed(1)}%
            </p>
          </div>
          <div className="bg-zinc-50 rounded-lg p-3 text-center">
            <p className="text-xs text-zinc-500 mb-1">VaR 95%</p>
            <p className={cn('text-lg font-bold', result.summary.var_95 < 0 ? 'text-red-600' : 'text-green-600')}>
              {result.summary.var_95.toFixed(1)}%
            </p>
          </div>
          <div className="bg-zinc-50 rounded-lg p-3 text-center">
            <p className="text-xs text-zinc-500 mb-1">VaR 99%</p>
            <p className={cn('text-lg font-bold', result.summary.var_99 < 0 ? 'text-red-600' : 'text-green-600')}>
              {result.summary.var_99.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Worst Case Scenario */}
        {result.worst_case.breach_count > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <h4 className="font-semibold text-red-900">Worst Case Scenario</h4>
            </div>
            <p className="text-sm text-red-800">
              {result.worst_case.breach_count} covenant{result.worst_case.breach_count > 1 ? 's' : ''} breached:
              {' '}{result.worst_case.affected_covenants.join(', ')}
            </p>
          </div>
        )}

        {/* Distribution Details */}
        <div className="space-y-4">
          <h4 className="font-semibold text-zinc-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-zinc-600" />
            Covenant Breach Probabilities
          </h4>

          {distributions.length === 0 ? (
            <p className="text-sm text-zinc-500">No covenant distributions available.</p>
          ) : (
            <div className="space-y-3">
              {distributions.map((dist) => (
                <div key={dist.covenant_id} className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-700">{dist.covenant_id}</span>
                    <span className={cn('font-medium', getProbabilityColor(dist.breach_probability))}>
                      {formatPercentage(dist.breach_probability)} breach risk
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all',
                        dist.breach_probability > 75 ? 'bg-red-500' :
                        dist.breach_probability > 50 ? 'bg-orange-500' :
                        dist.breach_probability > 25 ? 'bg-amber-500' :
                        'bg-green-500'
                      )}
                      style={{ width: `${dist.breach_probability}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>Mean: {dist.mean.toFixed(2)}</span>
                    <span>±{dist.std_dev.toFixed(2)}</span>
                    <span>Range: {dist.min.toFixed(2)} - {dist.max.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Percentile Table */}
        {distributions.length > 0 && (
          <div className="overflow-x-auto">
            <h4 className="font-semibold text-zinc-900 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-zinc-600" />
              Percentile Distribution
            </h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="text-left py-2 font-medium text-zinc-600">Covenant</th>
                  <th className="text-right py-2 font-medium text-zinc-600">5th</th>
                  <th className="text-right py-2 font-medium text-zinc-600">25th</th>
                  <th className="text-right py-2 font-medium text-zinc-600">50th</th>
                  <th className="text-right py-2 font-medium text-zinc-600">75th</th>
                  <th className="text-right py-2 font-medium text-zinc-600">95th</th>
                </tr>
              </thead>
              <tbody>
                {distributions.map((dist) => (
                  <tr key={dist.covenant_id} className="border-b border-zinc-100">
                    <td className="py-2 text-zinc-900">{dist.covenant_id}</td>
                    <td className="py-2 text-right text-zinc-600">
                      {dist.percentiles[5]?.toFixed(2) ?? '-'}
                    </td>
                    <td className="py-2 text-right text-zinc-600">
                      {dist.percentiles[25]?.toFixed(2) ?? '-'}
                    </td>
                    <td className="py-2 text-right font-medium text-zinc-900">
                      {dist.percentiles[50]?.toFixed(2) ?? '-'}
                    </td>
                    <td className="py-2 text-right text-zinc-600">
                      {dist.percentiles[75]?.toFixed(2) ?? '-'}
                    </td>
                    <td className="py-2 text-right text-zinc-600">
                      {dist.percentiles[95]?.toFixed(2) ?? '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
