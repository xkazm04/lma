'use client';

import React from 'react';
import { Lightbulb, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Info, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { MarketInsight } from '../lib/types';

interface MarketInsightsPanelProps {
  insights: MarketInsight[];
}

const insightTypeConfig = {
  pricing: { icon: TrendingUp, label: 'Pricing', color: 'text-blue-600' },
  structure: { icon: Info, label: 'Structure', color: 'text-purple-600' },
  covenant: { icon: AlertTriangle, label: 'Covenant', color: 'text-amber-600' },
  volume: { icon: TrendingDown, label: 'Volume', color: 'text-green-600' },
};

const impactConfig = {
  positive: { icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-200', label: 'Positive for Deal' },
  negative: { icon: AlertTriangle, color: 'text-red-600 bg-red-50 border-red-200', label: 'Risk Factor' },
  neutral: { icon: Minus, color: 'text-zinc-600 bg-zinc-50 border-zinc-200', label: 'Informational' },
};

export function MarketInsightsPanel({ insights }: MarketInsightsPanelProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card data-testid="market-insights-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          Market Insights
        </CardTitle>
        <CardDescription>AI-powered analysis of current market conditions affecting your deal</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight) => {
            const typeConfig = insightTypeConfig[insight.type];
            const impact = impactConfig[insight.impact];
            const ImpactIcon = impact.icon;
            const TypeIcon = typeConfig.icon;

            return (
              <div
                key={insight.id}
                className="p-4 rounded-lg border border-zinc-200 hover:border-zinc-300 transition-colors"
                data-testid={`insight-card-${insight.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className={cn('text-xs', typeConfig.color)}>
                        <TypeIcon className="w-3 h-3 mr-1" />
                        {typeConfig.label}
                      </Badge>
                      <Badge variant="outline" className={cn('text-xs', impact.color)}>
                        <ImpactIcon className="w-3 h-3 mr-1" />
                        {impact.label}
                      </Badge>
                    </div>

                    {/* Title */}
                    <h4 className="font-medium text-zinc-900 mb-1">{insight.title}</h4>

                    {/* Description */}
                    <p className="text-sm text-zinc-600">{insight.description}</p>

                    {/* Footer */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(insight.date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-zinc-400">Source:</span>
                        <span>{insight.source}</span>
                      </div>
                    </div>
                  </div>

                  {/* Confidence Indicator */}
                  <div className="text-center min-w-16">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold mx-auto',
                        insight.confidence >= 80 && 'bg-green-100 text-green-700',
                        insight.confidence >= 60 && insight.confidence < 80 && 'bg-blue-100 text-blue-700',
                        insight.confidence < 60 && 'bg-amber-100 text-amber-700'
                      )}
                    >
                      {insight.confidence}%
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">Confidence</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface MarketStatsSummaryProps {
  totalDeals: number;
  totalVolume: number;
  avgMargin: number;
  marginTrend: number;
  avgLeverage: number;
  leverageTrend: number;
  avgTenor: number;
  tenorTrend: number;
}

export function MarketStatsSummary({
  totalDeals,
  totalVolume,
  avgMargin,
  marginTrend,
  avgLeverage,
  leverageTrend,
  avgTenor,
  tenorTrend,
}: MarketStatsSummaryProps) {
  const formatVolume = (value: number) => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(0)}B`;
    }
    return `$${(value / 1000000).toFixed(0)}M`;
  };

  const TrendIndicator = ({ value, inverted = false }: { value: number; inverted?: boolean }) => {
    const isPositive = inverted ? value < 0 : value > 0;
    const color = isPositive ? 'text-green-600' : value === 0 ? 'text-zinc-500' : 'text-red-600';
    const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;

    return (
      <div className={cn('flex items-center gap-0.5 text-xs', color)}>
        <Icon className="w-3 h-3" />
        <span>{Math.abs(value).toFixed(1)}%</span>
      </div>
    );
  };

  const stats = [
    { label: 'Deals Tracked', value: totalDeals.toLocaleString(), trend: null },
    { label: 'Total Volume', value: formatVolume(totalVolume), trend: null },
    { label: 'Avg Margin', value: `${avgMargin}%`, trend: marginTrend, inverted: true },
    { label: 'Avg Leverage', value: `${avgLeverage}x`, trend: leverageTrend, inverted: false },
    { label: 'Avg Tenor', value: `${avgTenor} yrs`, trend: tenorTrend, inverted: false },
  ];

  return (
    <div className="grid grid-cols-5 gap-4" data-testid="market-stats-summary">
      {stats.map((stat) => (
        <Card key={stat.label} className="bg-zinc-50">
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
            <p className="text-xs text-zinc-500">{stat.label}</p>
            {stat.trend !== null && (
              <TrendIndicator value={stat.trend} inverted={stat.inverted} />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface StructureTermsComparisonProps {
  terms: Array<{
    term: string;
    label: string;
    currentValue: string;
    marketStandard: string;
    frequency: number;
    trend: 'more_common' | 'less_common' | 'stable';
  }>;
}

export function StructureTermsComparison({ terms }: StructureTermsComparisonProps) {
  const trendLabels = {
    more_common: 'Becoming Standard',
    less_common: 'Becoming Rare',
    stable: 'Stable',
  };

  const trendColors = {
    more_common: 'text-green-600',
    less_common: 'text-amber-600',
    stable: 'text-zinc-500',
  };

  return (
    <Card data-testid="structure-terms-comparison">
      <CardHeader>
        <CardTitle className="text-sm">Structure Terms vs Market</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {terms.map((term) => (
            <div key={term.term} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{term.label}</span>
                <Badge variant="outline" className={cn('text-xs', trendColors[term.trend])}>
                  {trendLabels[term.trend]}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-zinc-500">Your Terms</p>
                  <p className="font-medium">{term.currentValue}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Market Standard</p>
                  <p className="text-zinc-600">{term.marketStandard}</p>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Market Prevalence</span>
                  <span className="font-medium">{term.frequency}%</span>
                </div>
                <Progress value={term.frequency} className="h-1.5" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
