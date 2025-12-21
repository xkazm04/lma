'use client';

import React, { memo } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  FileWarning,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { RiskDashboardStats } from '../../lib/types';

interface RiskStatsCardsProps {
  stats: RiskDashboardStats;
}

export const RiskStatsCards = memo(function RiskStatsCards({ stats }: RiskStatsCardsProps) {
  const getTrendIcon = () => {
    switch (stats.trendDirection) {
      case 'improving':
        return <TrendingDown className="w-4 h-4 text-green-500" />;
      case 'worsening':
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getTrendColor = () => {
    switch (stats.trendDirection) {
      case 'improving':
        return 'text-green-600';
      case 'worsening':
        return 'text-red-600';
      default:
        return 'text-zinc-500';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 75) return 'text-red-600 bg-red-50';
    if (score >= 50) return 'text-amber-600 bg-amber-50';
    if (score >= 25) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="risk-stats-cards">
      {/* Overall Risk Score */}
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Risk Score</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={cn(
                  "text-3xl font-bold px-2 py-0.5 rounded",
                  getRiskScoreColor(stats.overallRiskScore)
                )}>
                  {stats.overallRiskScore}
                </span>
                <span className="text-sm text-zinc-400">/ 100</span>
              </div>
              <div className={cn("flex items-center gap-1 mt-2 text-xs", getTrendColor())}>
                {getTrendIcon()}
                <span>{stats.trendPercentage}% from last period</span>
              </div>
            </div>
            <div className={cn(
              "p-2 rounded-lg",
              stats.overallRiskScore >= 50 ? 'bg-red-100' : 'bg-green-100'
            )}>
              <Activity className={cn(
                "w-5 h-5",
                stats.overallRiskScore >= 50 ? 'text-red-600' : 'text-green-600'
              )} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical & High Alerts */}
      <Card className="overflow-hidden border-l-4 border-l-red-500">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Critical/High</p>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-3xl font-bold text-red-600">
                  {stats.bySeverity.critical + stats.bySeverity.high}
                </span>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    {stats.bySeverity.critical} critical
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    {stats.bySeverity.high} high
                  </span>
                </div>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-red-100">
              <ShieldAlert className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Alerts */}
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Alerts</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold text-zinc-900">{stats.totalAlerts}</span>
                <span className="text-sm text-zinc-400">alerts</span>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  {stats.bySeverity.medium} medium
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-zinc-400" />
                  {stats.bySeverity.low + stats.bySeverity.info} low/info
                </span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-zinc-100">
              <AlertTriangle className="w-5 h-5 text-zinc-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents at Risk */}
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Documents at Risk</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold text-zinc-900">{stats.documentsAtRisk}</span>
                <span className="text-sm text-zinc-400">/ {stats.totalDocumentsScanned}</span>
              </div>
              <div className="text-xs text-zinc-500 mt-2">
                {Math.round((stats.documentsAtRisk / stats.totalDocumentsScanned) * 100)}% of scanned documents
              </div>
            </div>
            <div className="p-2 rounded-lg bg-amber-100">
              <FileWarning className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
