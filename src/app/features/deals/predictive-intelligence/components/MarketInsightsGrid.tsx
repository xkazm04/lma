'use client';

import React from 'react';
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  BarChart3,
  Users,
  Clock,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MarketInsight } from '../lib/types';

interface MarketInsightsGridProps {
  insights: MarketInsight[];
  onViewDetails?: (insightId: string) => void;
  maxVisible?: number;
}

export function MarketInsightsGrid({
  insights,
  onViewDetails,
  maxVisible = 6,
}: MarketInsightsGridProps) {
  const getTypeIcon = (type: MarketInsight['type']) => {
    switch (type) {
      case 'term_structure':
        return BarChart3;
      case 'counterparty':
        return Users;
      case 'timing':
        return Clock;
      case 'market_trend':
        return TrendingUp;
      default:
        return Lightbulb;
    }
  };

  const getImpactIcon = (impact: MarketInsight['impact']) => {
    switch (impact) {
      case 'positive':
        return TrendingUp;
      case 'negative':
        return TrendingDown;
      default:
        return Minus;
    }
  };

  const getImpactColor = (impact: MarketInsight['impact']) => {
    switch (impact) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-amber-600';
      default:
        return 'text-zinc-600';
    }
  };

  const getImpactBg = (impact: MarketInsight['impact']) => {
    switch (impact) {
      case 'positive':
        return 'bg-green-50 border-green-200';
      case 'negative':
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-zinc-50 border-zinc-200';
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return { label: 'High', color: 'bg-green-100 text-green-700' };
    if (confidence >= 60) return { label: 'Medium', color: 'bg-blue-100 text-blue-700' };
    return { label: 'Low', color: 'bg-zinc-100 text-zinc-700' };
  };

  const visibleInsights = insights.slice(0, maxVisible);

  return (
    <Card data-testid="market-insights-grid">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            Market Intelligence
          </CardTitle>
          {insights.length > maxVisible && (
            <Button variant="ghost" size="sm" className="text-xs">
              View All ({insights.length})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {visibleInsights.map((insight) => {
            const TypeIcon = getTypeIcon(insight.type);
            const ImpactIcon = getImpactIcon(insight.impact);
            const confidenceBadge = getConfidenceBadge(insight.confidence);

            return (
              <div
                key={insight.id}
                className={cn(
                  'p-4 rounded-lg border transition-all duration-200 hover:shadow-sm',
                  getImpactBg(insight.impact)
                )}
                data-testid={`insight-${insight.id}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'w-6 h-6 rounded flex items-center justify-center',
                        insight.impact === 'positive'
                          ? 'bg-green-100'
                          : insight.impact === 'negative'
                            ? 'bg-amber-100'
                            : 'bg-zinc-100'
                      )}
                    >
                      <TypeIcon
                        className={cn('w-3 h-3', getImpactColor(insight.impact))}
                      />
                    </div>
                    <Badge
                      variant="outline"
                      className={cn('text-xs', confidenceBadge.color)}
                    >
                      {insight.confidence}%
                    </Badge>
                  </div>
                  <ImpactIcon
                    className={cn('w-4 h-4', getImpactColor(insight.impact))}
                  />
                </div>

                {/* Title & Statistic */}
                <h4 className="font-medium text-sm text-zinc-900 leading-tight">
                  {insight.title}
                </h4>
                <p className="text-xl font-bold text-zinc-900 mt-1">
                  {insight.statistic}
                </p>

                {/* Description */}
                <p className="text-xs text-zinc-600 mt-2 line-clamp-2">
                  {insight.description}
                </p>

                {/* Action */}
                {insight.actionable && insight.suggestedAction && (
                  <div className="mt-3 pt-2 border-t border-zinc-200/50">
                    <div className="flex items-center gap-1 text-xs text-blue-600">
                      <Zap className="w-3 h-3" />
                      <span className="font-medium">Action:</span>
                    </div>
                    <p className="text-xs text-zinc-600 mt-0.5 line-clamp-2">
                      {insight.suggestedAction}
                    </p>
                  </div>
                )}

                {/* View Details */}
                {onViewDetails && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 text-xs"
                    onClick={() => onViewDetails(insight.id)}
                    data-testid={`view-insight-${insight.id}`}
                  >
                    View Details
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Sample Size Info */}
        <div className="mt-4 pt-3 border-t border-zinc-100">
          <p className="text-xs text-zinc-500 text-center">
            Insights based on analysis of{' '}
            {Math.max(...insights.map((i) => i.supportingData.sampleSize))}+ historical
            deals
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
