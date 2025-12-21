'use client';

import * as React from 'react';
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Building,
  FileText,
  ShieldCheck,
  Gauge,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { EvolutionDashboardStats } from '../lib/types';

interface EvolutionStatsCardsProps {
  stats: EvolutionDashboardStats;
}

export function EvolutionStatsCards({ stats }: EvolutionStatsCardsProps) {
  const cards = [
    {
      title: 'Facilities Monitored',
      value: stats.totalFacilitiesMonitored,
      subtitle: `${stats.facilitiesWithSuggestions} with active suggestions`,
      icon: Building,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Active Suggestions',
      value: stats.activeSuggestions,
      subtitle: `${stats.suggestionsByPriority.urgent + stats.suggestionsByPriority.high} high priority`,
      icon: FileText,
      iconBg: stats.suggestionsByPriority.urgent > 0 ? 'bg-red-50' : 'bg-amber-50',
      iconColor: stats.suggestionsByPriority.urgent > 0 ? 'text-red-600' : 'text-amber-600',
      badge: stats.suggestionsByPriority.urgent > 0 ? {
        text: `${stats.suggestionsByPriority.urgent} urgent`,
        color: 'bg-red-100 text-red-700',
      } : undefined,
    },
    {
      title: 'Covenants at Risk',
      value: stats.covenantsAtRisk,
      subtitle: `${stats.averageCovenantHeadroom.toFixed(1)}% avg headroom`,
      icon: AlertTriangle,
      iconBg: stats.covenantsAtRisk > 0 ? 'bg-amber-50' : 'bg-green-50',
      iconColor: stats.covenantsAtRisk > 0 ? 'text-amber-600' : 'text-green-600',
    },
    {
      title: 'Engine Status',
      value: stats.engineStatus.isRunning ? 'Active' : 'Stopped',
      subtitle: stats.engineStatus.health.status === 'healthy' ? 'All systems operational' : stats.engineStatus.health.message,
      icon: stats.engineStatus.isRunning ? Activity : Gauge,
      iconBg: stats.engineStatus.health.status === 'healthy' ? 'bg-green-50' : 'bg-red-50',
      iconColor: stats.engineStatus.health.status === 'healthy' ? 'text-green-600' : 'text-red-600',
      badge: stats.engineStatus.health.status === 'healthy' ? {
        text: 'Healthy',
        color: 'bg-green-100 text-green-700',
      } : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="evolution-stats-cards">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} data-testid={`stat-card-${card.title.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-500">{card.title}</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <p className="text-2xl font-semibold text-zinc-900">{card.value}</p>
                    {card.badge && (
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', card.badge.color)}>
                        {card.badge.text}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{card.subtitle}</p>
                </div>
                <div className={cn('rounded-lg p-2', card.iconBg)}>
                  <Icon className={cn('h-5 w-5', card.iconColor)} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

interface MarketTrendCardProps {
  stats: EvolutionDashboardStats;
}

export function MarketTrendCard({ stats }: MarketTrendCardProps) {
  const { marketConditionsSummary } = stats;

  const trends = [
    {
      label: 'Interest Rates',
      value: marketConditionsSummary.interestRateTrend,
      icon: marketConditionsSummary.interestRateTrend === 'rising' ? TrendingUp :
            marketConditionsSummary.interestRateTrend === 'falling' ? TrendingDown : ShieldCheck,
      color: marketConditionsSummary.interestRateTrend === 'rising' ? 'text-red-600' :
             marketConditionsSummary.interestRateTrend === 'falling' ? 'text-green-600' : 'text-zinc-600',
    },
    {
      label: 'Credit Spreads',
      value: marketConditionsSummary.creditSpreadTrend,
      icon: marketConditionsSummary.creditSpreadTrend === 'widening' ? TrendingUp :
            marketConditionsSummary.creditSpreadTrend === 'tightening' ? TrendingDown : ShieldCheck,
      color: marketConditionsSummary.creditSpreadTrend === 'widening' ? 'text-red-600' :
             marketConditionsSummary.creditSpreadTrend === 'tightening' ? 'text-green-600' : 'text-zinc-600',
    },
  ];

  return (
    <Card data-testid="market-trend-card">
      <CardContent className="p-4">
        <h3 className="text-sm font-medium text-zinc-900">Market Conditions</h3>
        <div className="mt-3 space-y-3">
          {trends.map((trend) => {
            const Icon = trend.icon;
            return (
              <div key={trend.label} className="flex items-center justify-between">
                <span className="text-sm text-zinc-600">{trend.label}</span>
                <div className="flex items-center gap-1.5">
                  <Icon className={cn('h-4 w-4', trend.color)} />
                  <span className={cn('text-sm font-medium capitalize', trend.color)}>
                    {trend.value}
                  </span>
                </div>
              </div>
            );
          })}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
            <span className="text-sm text-zinc-600">Regulatory Changes</span>
            <span className="text-sm font-medium text-zinc-900">
              {marketConditionsSummary.recentRegulatoryChanges} new
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
