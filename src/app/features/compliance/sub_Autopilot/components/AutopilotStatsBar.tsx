'use client';

import React, { memo } from 'react';
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
  iconColor: string;
  highlight?: boolean;
}

const StatItem = memo(function StatItem({
  icon: Icon,
  label,
  value,
  subValue,
  iconColor,
  highlight,
}: StatItemProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
        highlight ? 'bg-red-50 border border-red-200' : 'bg-zinc-50'
      )}
      data-testid={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <Icon className={cn('w-4 h-4 flex-shrink-0', iconColor)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-bold text-zinc-900">{value}</span>
          <span className="text-[10px] text-zinc-500 truncate">{label}</span>
        </div>
        {subValue && (
          <p className="text-[10px] text-zinc-400 truncate">{subValue}</p>
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
    <div className="space-y-2" data-testid="autopilot-stats-bar">
      {/* Row 1: Primary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <StatItem
          icon={Brain}
          label="Predictions"
          value={stats.total_predictions_active}
          iconColor="text-purple-600"
        />
        <StatItem
          icon={AlertTriangle}
          label="High/Critical"
          value={criticalCount}
          highlight={criticalCount > 0}
          iconColor="text-red-600"
        />
        <StatItem
          icon={TrendingDown}
          label="Breaches (12m)"
          value={stats.projected_breaches_12m}
          subValue={`${stats.projected_breaches_6m} in 6m`}
          iconColor="text-orange-600"
        />
        <StatItem
          icon={Activity}
          label="Signals"
          value={stats.total_signals_processed.toLocaleString()}
          subValue={`+${stats.new_signals_24h} today`}
          iconColor="text-blue-600"
        />
      </div>
      {/* Row 2: Secondary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <StatItem
          icon={Shield}
          label="Remediations"
          value={stats.active_remediations}
          subValue={`${stats.remediation_success_rate}% success`}
          iconColor="text-green-600"
        />
        <StatItem
          icon={Bell}
          label="Notifications"
          value={stats.notifications_sent_24h}
          subValue={`${stats.notifications_pending} pending`}
          iconColor="text-amber-600"
        />
        <StatItem
          icon={Target}
          label="Accuracy"
          value={`${stats.prediction_accuracy_6m}%`}
          subValue={`${stats.prediction_accuracy_12m}% at 12m`}
          iconColor="text-indigo-600"
        />
        <StatItem
          icon={Zap}
          label="Coverage"
          value={`${stats.data_coverage_percentage}%`}
          subValue={`${stats.covenants_monitored} covenants`}
          iconColor="text-cyan-600"
        />
      </div>
    </div>
  );
});

export default AutopilotStatsBar;
