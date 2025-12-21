'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingDown,
  Lightbulb,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SimulationResult } from '../lib/types';

interface SimulationResultsSummaryProps {
  result: SimulationResult;
}

function formatCurrency(value: number): string {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(1)}B`;
  }
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  return `$${value.toLocaleString()}`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

export const SimulationResultsSummary = memo(function SimulationResultsSummary({
  result,
}: SimulationResultsSummaryProps) {
  const { summary } = result;
  const hasNewBreaches = summary.new_breaches > 0;
  const hasIncreaseInAtRisk = summary.covenants_at_risk_after > summary.covenants_at_risk_before;

  return (
    <Card className="animate-in fade-in" data-testid="simulation-results-summary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Simulation Results
            </CardTitle>
            <CardDescription>
              {result.scenario_name} &bull; {formatDuration(result.runtime_ms)}
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={result.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
          >
            {result.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-50 rounded-lg p-4 text-center">
            <p className="text-xs text-zinc-500 mb-1">Covenants Analyzed</p>
            <p className="text-2xl font-bold text-zinc-900">{summary.total_covenants_analyzed}</p>
          </div>
          <div className={cn(
            'rounded-lg p-4 text-center',
            hasNewBreaches ? 'bg-red-50' : hasIncreaseInAtRisk ? 'bg-amber-50' : 'bg-green-50'
          )}>
            <p className="text-xs text-zinc-500 mb-1">At Risk (After)</p>
            <div className="flex items-center justify-center gap-2">
              <p className={cn(
                'text-2xl font-bold',
                hasIncreaseInAtRisk ? 'text-amber-600' : 'text-green-600'
              )}>
                {summary.covenants_at_risk_after}
              </p>
              {summary.covenants_at_risk_after !== summary.covenants_at_risk_before && (
                <span className={cn(
                  'text-sm',
                  hasIncreaseInAtRisk ? 'text-amber-600' : 'text-green-600'
                )}>
                  ({hasIncreaseInAtRisk ? '+' : ''}{summary.covenants_at_risk_after - summary.covenants_at_risk_before})
                </span>
              )}
            </div>
          </div>
          <div className={cn(
            'rounded-lg p-4 text-center',
            hasNewBreaches ? 'bg-red-50' : 'bg-green-50'
          )}>
            <p className="text-xs text-zinc-500 mb-1">New Breaches</p>
            <p className={cn(
              'text-2xl font-bold',
              hasNewBreaches ? 'text-red-600' : 'text-green-600'
            )}>
              {summary.new_breaches}
            </p>
          </div>
          <div className="bg-zinc-50 rounded-lg p-4 text-center">
            <p className="text-xs text-zinc-500 mb-1">Exposure at Risk</p>
            <p className="text-2xl font-bold text-zinc-900">
              {formatCurrency(summary.total_exposure_at_risk)}
            </p>
          </div>
        </div>

        {/* Worst Affected Covenant */}
        <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg">
          <div className={cn(
            'p-2 rounded-lg',
            summary.worst_headroom_change < -10 ? 'bg-red-100' : 'bg-amber-100'
          )}>
            <TrendingDown className={cn(
              'w-5 h-5',
              summary.worst_headroom_change < -10 ? 'text-red-600' : 'text-amber-600'
            )} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-zinc-900">Worst Affected</p>
            <p className="text-xs text-zinc-500">{summary.worst_affected_covenant}</p>
          </div>
          <div className="text-right">
            <p className={cn(
              'text-lg font-bold',
              summary.worst_headroom_change < -10 ? 'text-red-600' : 'text-amber-600'
            )}>
              {summary.worst_headroom_change >= 0 ? '+' : ''}{summary.worst_headroom_change.toFixed(1)}%
            </p>
            <p className="text-xs text-zinc-500">headroom change</p>
          </div>
        </div>

        {/* Before/After Comparison */}
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-zinc-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-zinc-500 mb-3">Before Scenario</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-zinc-600">At Risk</span>
                <span className="font-medium">{summary.covenants_at_risk_before}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-zinc-600">Breached</span>
                <span className="font-medium">{summary.covenants_breached_before}</span>
              </div>
            </div>
          </div>
          <div className="border border-zinc-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-zinc-500 mb-3">After Scenario</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-zinc-600">At Risk</span>
                <span className={cn(
                  'font-medium',
                  summary.covenants_at_risk_after > summary.covenants_at_risk_before && 'text-amber-600'
                )}>
                  {summary.covenants_at_risk_after}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-zinc-600">Breached</span>
                <span className={cn(
                  'font-medium',
                  summary.covenants_breached_after > summary.covenants_breached_before && 'text-red-600'
                )}>
                  {summary.covenants_breached_after}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        {result.insights && result.insights.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-zinc-900 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Key Insights
            </h4>
            <ul className="space-y-2">
              {result.insights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-zinc-700">
                  <ChevronRight className="w-4 h-4 mt-0.5 text-zinc-400 shrink-0" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {result.recommendations && result.recommendations.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-zinc-900 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Recommended Actions
            </h4>
            <ul className="space-y-2">
              {result.recommendations.map((rec, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm text-zinc-700 bg-green-50 p-2 rounded-lg"
                >
                  <span className="text-green-600 font-medium shrink-0">{idx + 1}.</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Cascade Effects */}
        {result.cascade_effects && result.cascade_effects.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-zinc-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Cascade Effects
            </h4>
            {result.cascade_effects.map((cascade, idx) => (
              <div
                key={idx}
                className="border border-orange-200 bg-orange-50 rounded-lg p-3"
              >
                <p className="text-sm text-orange-800">{cascade.description}</p>
                <p className="text-xs text-orange-600 mt-1">
                  Exposure at risk: {formatCurrency(cascade.total_exposure_at_risk)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
