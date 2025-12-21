'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  PortfolioStateAnalytics,
  TransitionPattern,
  PortfolioInsight,
  CovenantLifecycleState,
} from '../../lib/covenant-state-machine';

interface PortfolioStateAnalyticsProps {
  analytics: PortfolioStateAnalytics;
}

/**
 * Get icon for lifecycle state.
 */
function getStateIcon(state: CovenantLifecycleState, className?: string) {
  const iconClass = className || 'w-5 h-5';
  switch (state) {
    case 'healthy':
      return <CheckCircle className={iconClass} />;
    case 'at_risk':
      return <AlertTriangle className={iconClass} />;
    case 'breach':
      return <XCircle className={iconClass} />;
    case 'waived':
      return <Clock className={iconClass} />;
    case 'resolved':
      return <TrendingUp className={iconClass} />;
    default:
      return <BarChart3 className={iconClass} />;
  }
}

/**
 * Get color classes for lifecycle state.
 */
function getStateColor(state: CovenantLifecycleState): string {
  switch (state) {
    case 'healthy':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'at_risk':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'breach':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'waived':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'resolved':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    default:
      return 'bg-zinc-100 text-zinc-700 border-zinc-200';
  }
}

/**
 * Get human-readable label for state.
 */
function getStateLabel(state: CovenantLifecycleState): string {
  switch (state) {
    case 'healthy':
      return 'Healthy';
    case 'at_risk':
      return 'At Risk';
    case 'breach':
      return 'Breach';
    case 'waived':
      return 'Waived';
    case 'resolved':
      return 'Resolved';
    default:
      return state;
  }
}

/**
 * Get severity badge color.
 */
function getSeverityColor(severity: 'low' | 'medium' | 'high' | 'critical'): string {
  switch (severity) {
    case 'low':
      return 'bg-blue-100 text-blue-700';
    case 'medium':
      return 'bg-amber-100 text-amber-700';
    case 'high':
      return 'bg-orange-100 text-orange-700';
    case 'critical':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-zinc-100 text-zinc-700';
  }
}

/**
 * State distribution card showing counts and percentages.
 */
const StateDistributionCard = memo(function StateDistributionCard({
  analytics,
}: {
  analytics: PortfolioStateAnalytics;
}) {
  const states: CovenantLifecycleState[] = ['healthy', 'at_risk', 'breach', 'waived', 'resolved'];

  return (
    <Card data-testid="state-distribution-card">
      <CardHeader>
        <CardTitle className="text-base">Portfolio State Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {states.map(state => {
            const count = analytics.covenants_by_state[state] || 0;
            const percentage = analytics.state_distribution_percentage[state] || 0;
            const color = getStateColor(state);

            return (
              <div key={state} className="flex items-center gap-3" data-testid={`state-${state}`}>
                <div className={cn('p-2 rounded-lg', color)}>
                  {getStateIcon(state, 'w-4 h-4')}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-zinc-900">
                      {getStateLabel(state)}
                    </span>
                    <span className="text-sm text-zinc-600">
                      {count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-zinc-100 rounded-full h-2">
                    <div
                      className={cn('h-2 rounded-full transition-all', color)}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-200 text-center">
          <p className="text-xs text-zinc-500">Total Covenants</p>
          <p className="text-2xl font-semibold text-zinc-900">{analytics.total_covenants}</p>
        </div>
      </CardContent>
    </Card>
  );
});

/**
 * Transition pattern card showing common state transition paths.
 */
const TransitionPatternsCard = memo(function TransitionPatternsCard({
  patterns,
}: {
  patterns: TransitionPattern[];
}) {
  return (
    <Card data-testid="transition-patterns-card">
      <CardHeader>
        <CardTitle className="text-base">Common Transition Patterns</CardTitle>
        <p className="text-xs text-zinc-500 mt-1">
          Historical patterns showing how covenants typically move between states
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {patterns.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-4">
              No transition patterns available
            </p>
          ) : (
            patterns.map((pattern, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border border-zinc-200 bg-zinc-50"
                data-testid="transition-pattern"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Badge className={getStateColor(pattern.from_state)}>
                    {getStateLabel(pattern.from_state)}
                  </Badge>
                  <TrendingDown className="w-4 h-4 text-zinc-400" />
                  <Badge className={getStateColor(pattern.to_state)}>
                    {getStateLabel(pattern.to_state)}
                  </Badge>
                </div>

                <p className="text-sm text-zinc-700 mb-3">{pattern.pattern}</p>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-zinc-500">Occurrences</p>
                    <p className="text-sm font-semibold text-zinc-900">
                      {pattern.occurrence_count}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Avg Days</p>
                    <p className="text-sm font-semibold text-zinc-900">
                      {Math.round(pattern.average_days)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Probability</p>
                    <p className="text-sm font-semibold text-zinc-900">
                      {pattern.probability_percentage.toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
});

/**
 * Portfolio insights card showing key findings and recommendations.
 */
const InsightsCard = memo(function InsightsCard({ insights }: { insights: PortfolioInsight[] }) {
  return (
    <Card data-testid="insights-card">
      <CardHeader>
        <CardTitle className="text-base">Portfolio Insights</CardTitle>
        <p className="text-xs text-zinc-500 mt-1">
          AI-driven insights from state transition analysis
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-4">No insights available</p>
          ) : (
            insights.map((insight, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border-l-4"
                style={{
                  borderLeftColor:
                    insight.severity === 'critical'
                      ? 'rgb(220 38 38)'
                      : insight.severity === 'high'
                        ? 'rgb(249 115 22)'
                        : insight.severity === 'medium'
                          ? 'rgb(245 158 11)'
                          : 'rgb(59 130 246)',
                  backgroundColor:
                    insight.severity === 'critical'
                      ? 'rgb(254 242 242)'
                      : insight.severity === 'high'
                        ? 'rgb(255 247 237)'
                        : insight.severity === 'medium'
                          ? 'rgb(254 252 232)'
                          : 'rgb(239 246 255)',
                }}
                data-testid="portfolio-insight"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {insight.category === 'risk' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                    {insight.category === 'opportunity' && <TrendingUp className="w-5 h-5 text-green-600" />}
                    {insight.category === 'trend' && <BarChart3 className="w-5 h-5 text-blue-600" />}
                    {insight.category === 'anomaly' && <Info className="w-5 h-5 text-purple-600" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-semibold text-sm text-zinc-900">{insight.title}</h4>
                      <Badge className={getSeverityColor(insight.severity)} variant="outline">
                        {insight.severity.toUpperCase()}
                      </Badge>
                    </div>

                    <p className="text-sm text-zinc-700 mb-2">{insight.description}</p>

                    {insight.recommended_action && (
                      <div className="p-2 rounded bg-white/50 border border-zinc-200">
                        <p className="text-xs font-medium text-zinc-600 mb-1">
                          Recommended Action:
                        </p>
                        <p className="text-xs text-zinc-700">{insight.recommended_action}</p>
                      </div>
                    )}

                    {insight.affected_covenant_ids.length > 0 && (
                      <p className="text-xs text-zinc-500 mt-2">
                        Affects {insight.affected_covenant_ids.length} covenant(s)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
});

/**
 * Main portfolio state analytics component.
 */
export const PortfolioStateAnalyticsPanel = memo(function PortfolioStateAnalyticsPanel({
  analytics,
}: PortfolioStateAnalyticsProps) {
  return (
    <div className="space-y-6" data-testid="portfolio-state-analytics">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900 mb-1">
          Portfolio State Analytics
        </h2>
        <p className="text-sm text-zinc-600">
          Analyzed {new Date(analytics.analyzed_at).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      {/* State Distribution */}
      <StateDistributionCard analytics={analytics} />

      {/* Transition Patterns */}
      <TransitionPatternsCard patterns={analytics.transition_patterns} />

      {/* Insights */}
      <InsightsCard insights={analytics.insights} />
    </div>
  );
});
