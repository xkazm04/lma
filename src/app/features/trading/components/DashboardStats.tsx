'use client';

import React, { useMemo } from 'react';
import { Building2, ArrowLeftRight, ClipboardCheck, DollarSign } from 'lucide-react';
import { CompactStatRow } from '@/components/ui/compact-stat-row';
import { formatCurrency } from '../lib/utils';
import type { TradingDashboardStats } from '../lib/types';

interface DashboardStatsProps {
  stats: TradingDashboardStats;
}

export const DashboardStats = React.memo<DashboardStatsProps>(({ stats }) => {
  const statItems = useMemo(() => [
    {
      label: 'Portfolio Value',
      value: formatCurrency(stats.total_position_value),
      icon: <Building2 className="w-4 h-4 text-zinc-500" />,
      change: '+2.3%',
      trend: 'up' as const,
    },
    {
      label: 'Active Trades',
      value: stats.active_trades,
      icon: <ArrowLeftRight className="w-4 h-4 text-blue-500" />,
      change: '+3',
      trend: 'up' as const,
    },
    {
      label: 'DD Progress',
      value: `${stats.dd_completion_rate}%`,
      icon: <ClipboardCheck className="w-4 h-4 text-green-500" />,
      change: '+5%',
      trend: 'up' as const,
    },
    {
      label: 'Settled',
      value: `${stats.settled_this_month} trades`,
      icon: <DollarSign className="w-4 h-4 text-green-500" />,
      change: formatCurrency(stats.total_position_value * 0.15),
      trend: 'up' as const,
    },
  ], [stats]);

  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-4 duration-500"
      data-testid="trading-dashboard-stats"
    >
      <CompactStatRow stats={statItems} variant="bordered" />
    </div>
  );
});

DashboardStats.displayName = 'DashboardStats';
