'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Brain,
  Activity,
  AlertTriangle,
  Shield,
  TrendingDown,
  Bell,
  Target,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AutopilotDashboardStats } from '../lib/types';

interface AutopilotStatsBarProps {
  stats: AutopilotDashboardStats;
}

interface StatItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subValue?: string;
  iconBg: string;
  iconColor: string;
  trend?: 'up' | 'down' | 'neutral';
  highlight?: boolean;
}

const StatItem = memo(function StatItem({
  icon: Icon,
  label,
  value,
  subValue,
  iconBg,
  iconColor,
  highlight,
}: StatItemProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg transition-colors',
        highlight && 'bg-red-50 border border-red-200'
      )}
      data-testid={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className={cn('p-2 rounded-lg', iconBg)}>
        <Icon className={cn('w-5 h-5', iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-zinc-500 truncate">{label}</p>
        <p className="text-lg font-bold text-zinc-900">{value}</p>
        {subValue && (
          <p className="text-xs text-zinc-500">{subValue}</p>
        )}
      </div>
    </div>
  );
});

export const AutopilotStatsBar = memo(function AutopilotStatsBar({
  stats,
}: AutopilotStatsBarProps) {
  const criticalCount =
    stats.predictions_by_risk_level.critical +
    stats.predictions_by_risk_level.high;

  return (
    <Card data-testid="autopilot-stats-bar">
      <CardContent className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <StatItem
            icon={Brain}
            label="Active Predictions"
            value={stats.total_predictions_active}
            iconBg="bg-purple-100"
            iconColor="text-purple-600"
          />
          <StatItem
            icon={AlertTriangle}
            label="High/Critical Risk"
            value={criticalCount}
            highlight={criticalCount > 0}
            iconBg="bg-red-100"
            iconColor="text-red-600"
          />
          <StatItem
            icon={TrendingDown}
            label="Breaches Projected (12m)"
            value={stats.projected_breaches_12m}
            subValue={`${stats.projected_breaches_6m} in 6m`}
            iconBg="bg-orange-100"
            iconColor="text-orange-600"
          />
          <StatItem
            icon={Activity}
            label="Signals Processed"
            value={stats.total_signals_processed.toLocaleString()}
            subValue={`+${stats.new_signals_24h} today`}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
          />
          <StatItem
            icon={Shield}
            label="Active Remediations"
            value={stats.active_remediations}
            subValue={`${stats.remediation_success_rate}% success`}
            iconBg="bg-green-100"
            iconColor="text-green-600"
          />
          <StatItem
            icon={Bell}
            label="Notifications (24h)"
            value={stats.notifications_sent_24h}
            subValue={`${stats.notifications_pending} pending`}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
          />
          <StatItem
            icon={Target}
            label="Model Accuracy (6m)"
            value={`${stats.prediction_accuracy_6m}%`}
            subValue={`${stats.prediction_accuracy_12m}% at 12m`}
            iconBg="bg-indigo-100"
            iconColor="text-indigo-600"
          />
          <StatItem
            icon={Zap}
            label="Data Coverage"
            value={`${stats.data_coverage_percentage}%`}
            subValue={`${stats.covenants_monitored} covenants`}
            iconBg="bg-cyan-100"
            iconColor="text-cyan-600"
          />
        </div>
      </CardContent>
    </Card>
  );
});

export default AutopilotStatsBar;
