'use client';

import React, { memo, useMemo } from 'react';
import { Building2, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { CompactStatRow } from '@/components/ui/compact-stat-row';
import type { DashboardStats } from '../lib';

interface ComplianceStatsBarProps {
  stats: DashboardStats;
}

export const ComplianceStatsBar = memo(function ComplianceStatsBar({ stats }: ComplianceStatsBarProps) {
  const complianceRate = stats.total_facilities > 0
    ? Math.round((stats.facilities_in_compliance / stats.total_facilities) * 100)
    : 0;

  const statItems = useMemo(() => [
    {
      label: 'Facilities',
      value: stats.total_facilities,
      icon: <Building2 className="w-4 h-4 text-zinc-500" />,
    },
    {
      label: 'Due 7 Days',
      value: stats.upcoming_deadlines_7_days,
      icon: <Clock className="w-4 h-4 text-amber-500" />,
      status: stats.upcoming_deadlines_7_days > 0 ? 'warning' as const : undefined,
    },
    {
      label: 'Overdue',
      value: stats.overdue_items,
      icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
      status: stats.overdue_items > 0 ? 'error' as const : undefined,
    },
    {
      label: 'Compliance',
      value: `${complianceRate}%`,
      icon: <TrendingUp className="w-4 h-4 text-green-500" />,
      trend: 'up' as const,
    },
  ], [stats, complianceRate]);

  return (
    <div
      className="animate-in fade-in slide-in-from-top-3 duration-500"
      data-testid="compliance-stats-bar"
    >
      <CompactStatRow stats={statItems} variant="bordered" />
    </div>
  );
});
