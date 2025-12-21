'use client';

import React, { memo, useState, useEffect } from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  Network,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendIcon } from '@/components/ui/trend-icon';
import { cn } from '@/lib/utils';
import type { CrossDomainInsight } from '@/lib/utils/domain-correlations';

interface CorrelationDiscoveryProps {
  className?: string;
}

interface CorrelationData {
  insights: CrossDomainInsight[];
  summary: {
    totalCorrelations: number;
    insightCount: number;
    criticalInsights: number;
    highInsights: number;
  };
}

// ============================================================================
// Insight Card Component
// ============================================================================

const InsightCard = memo(function InsightCard({
  insight,
  index,
  onExpand,
}: {
  insight: CrossDomainInsight;
  index: number;
  onExpand?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-200 bg-red-50/50';
      case 'high':
        return 'border-amber-200 bg-amber-50/50';
      case 'medium':
        return 'border-blue-200 bg-blue-50/50';
      default:
        return 'border-zinc-100 bg-white';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'medium':
        return <Lightbulb className="w-4 h-4 text-blue-600" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
  };

  const handleToggle = () => {
    setExpanded(!expanded);
    if (!expanded && onExpand) {
      onExpand();
    }
  };

  return (
    <div
      className={cn(
        'p-3 rounded-lg border transition-all cursor-pointer hover:shadow-sm animate-in fade-in slide-in-from-bottom-2',
        getSeverityColor(insight.significance)
      )}
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
      onClick={handleToggle}
      data-testid={`insight-card-${insight.id}`}
    >
      {/* Header */}
      <div className="flex items-start gap-2">
        <div className="mt-0.5">{getSeverityIcon(insight.significance)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-zinc-900 line-clamp-1">
              {insight.title}
            </h4>
            <Badge
              variant={
                insight.significance === 'critical' || insight.significance === 'high'
                  ? 'destructive'
                  : 'secondary'
              }
              className="text-[9px] px-1.5 py-0"
              data-testid={`insight-severity-${insight.significance}`}
            >
              {insight.significance}
            </Badge>
          </div>

          <p className="text-xs text-zinc-600 mb-2">{insight.description}</p>

          {/* Metric */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-500">{insight.metric}:</span>
              <span className="text-sm font-bold text-zinc-900">{insight.value}</span>
            </div>

            {insight.change !== undefined && (
              <div className="flex items-center gap-0.5">
                <TrendIcon
                  trend={insight.change > 0 ? 'up' : 'down'}
                  size="sm"
                  colorize
                />
                <span
                  className={cn(
                    'text-xs font-medium',
                    insight.change > 0 ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {Math.abs(insight.change)}%
                </span>
              </div>
            )}
          </div>

          {/* Entity types */}
          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
            <span className="px-1.5 py-0.5 rounded bg-zinc-100">
              {insight.correlatedEntities.typeA}
            </span>
            <ArrowRight className="w-3 h-3" />
            <span className="px-1.5 py-0.5 rounded bg-zinc-100">
              {insight.correlatedEntities.typeB}
            </span>
            <span className="ml-1">({insight.correlatedEntities.count} pairs)</span>
          </div>

          {/* Expandable recommendations */}
          {insight.recommendations && insight.recommendations.length > 0 && (
            <div className="mt-2 pt-2 border-t border-zinc-200">
              <div className="flex items-center gap-1 text-[10px] font-medium text-zinc-700 mb-1">
                {expanded ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
                Recommendations ({insight.recommendations.length})
              </div>

              {expanded && (
                <ul
                  className="space-y-1 animate-in fade-in slide-in-from-top-1"
                  data-testid="insight-recommendations"
                >
                  {insight.recommendations.map((rec, i) => (
                    <li
                      key={i}
                      className="text-[10px] text-zinc-600 pl-3 relative before:content-['•'] before:absolute before:left-0"
                    >
                      {rec}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// Summary Stats Component
// ============================================================================

const SummaryStats = memo(function SummaryStats({
  summary,
}: {
  summary: CorrelationData['summary'];
}) {
  const stats = [
    {
      label: 'Total Correlations',
      value: summary.totalCorrelations,
      icon: Network,
      color: 'bg-purple-500',
    },
    {
      label: 'Insights',
      value: summary.insightCount,
      icon: Lightbulb,
      color: 'bg-blue-500',
    },
    {
      label: 'Critical',
      value: summary.criticalInsights,
      icon: AlertTriangle,
      color: 'bg-red-500',
    },
    {
      label: 'High Priority',
      value: summary.highInsights,
      icon: AlertTriangle,
      color: 'bg-amber-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className="p-2 rounded-lg border border-zinc-100 bg-white hover:border-zinc-200 transition-all animate-in fade-in slide-in-from-top-2"
          style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
          data-testid={`summary-stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <div className="flex items-center gap-2">
            <div className={cn('p-1 rounded', stat.color)}>
              <stat.icon className="w-3 h-3 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] text-zinc-500 truncate">{stat.label}</p>
              <p className="text-lg font-bold text-zinc-900">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

// ============================================================================
// Main Component
// ============================================================================

export const CorrelationDiscovery = memo(function CorrelationDiscovery({
  className,
}: CorrelationDiscoveryProps) {
  const [data, setData] = useState<CorrelationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCorrelations();
  }, []);

  const fetchCorrelations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/correlations');
      const result = await response.json();

      if (result.success) {
        setData({
          insights: result.data.insights,
          summary: result.data.summary,
        });
      } else {
        setError(result.error || 'Failed to load correlations');
      }
    } catch (err) {
      console.error('Error fetching correlations:', err);
      setError('Failed to load correlations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={cn('animate-in fade-in slide-in-from-bottom-4', className)} data-testid="correlation-discovery">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-base">Correlation Intelligence</CardTitle>
            <p className="text-[10px] text-zinc-500">
              Discover relationships between entities across the platform
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 px-4 pb-4">
        {loading && (
          <div className="space-y-3" data-testid="loading-skeleton">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div
            className="p-4 rounded-lg border border-red-200 bg-red-50 text-center"
            data-testid="error-message"
          >
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={fetchCorrelations}
              className="mt-2 text-xs text-red-600 hover:text-red-700 underline"
              data-testid="retry-button"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* Summary Stats */}
            <SummaryStats summary={data.summary} />

            {/* Insights List */}
            {data.insights.length > 0 ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {data.insights.map((insight, index) => (
                  <InsightCard key={insight.id} insight={insight} index={index} />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-zinc-500" data-testid="no-insights">
                <Network className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
                <p className="text-sm">No significant correlations detected</p>
                <p className="text-xs mt-1">
                  Correlations will appear as more data is analyzed
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
});
