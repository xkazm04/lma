'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Database, Building2, Globe, Bell, BarChart3, Shield, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BenchmarkDashboardStats } from '../../lib';

interface BenchmarkStatsBarProps {
  stats: BenchmarkDashboardStats;
}

interface StatCardProps {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  index: number;
}

const StatCard = memo(function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  subValue,
  trend,
  index,
}: StatCardProps) {
  return (
    <Card
      className="animate-in fade-in slide-in-from-bottom-2"
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
      data-testid={`benchmark-stat-card-${index}`}
    >
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={cn('p-3 rounded-lg', iconBg)}>
            <Icon className={cn('w-5 h-5', iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-zinc-500 truncate">{label}</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-zinc-900">{value}</p>
              {trend && (
                <span className={cn(
                  'flex items-center text-xs font-medium',
                  trend === 'up' && 'text-green-600',
                  trend === 'down' && 'text-red-600',
                  trend === 'neutral' && 'text-zinc-500'
                )}>
                  {trend === 'up' && <TrendingUp className="w-3 h-3 mr-0.5" />}
                  {trend === 'down' && <TrendingDown className="w-3 h-3 mr-0.5" />}
                </span>
              )}
            </div>
            {subValue && (
              <p className="text-xs text-zinc-400 mt-0.5">{subValue}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export const BenchmarkStatsBar = memo(function BenchmarkStatsBar({ stats }: BenchmarkStatsBarProps) {
  const lastRefresh = new Date(stats.last_data_refresh).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4" data-testid="benchmark-stats-bar">
      <StatCard
        icon={Database}
        iconBg="bg-blue-100"
        iconColor="text-blue-600"
        label="Data Points"
        value={stats.total_data_points.toLocaleString()}
        subValue={`Refreshed ${lastRefresh}`}
        index={0}
      />
      <StatCard
        icon={Building2}
        iconBg="bg-purple-100"
        iconColor="text-purple-600"
        label="Institutions"
        value={stats.institutions_contributing}
        subValue="Contributing data"
        index={1}
      />
      <StatCard
        icon={Globe}
        iconBg="bg-indigo-100"
        iconColor="text-indigo-600"
        label="Industries"
        value={stats.industries_covered}
        subValue="Sectors covered"
        index={2}
      />
      <StatCard
        icon={BarChart3}
        iconBg="bg-green-100"
        iconColor="text-green-600"
        label="Coverage"
        value={`${stats.benchmark_coverage_percentage.toFixed(0)}%`}
        subValue={`${stats.covenants_benchmarked}/${stats.covenants_total} covenants`}
        index={3}
      />
      <StatCard
        icon={Bell}
        iconBg="bg-amber-100"
        iconColor="text-amber-600"
        label="Active Alerts"
        value={stats.total_alerts}
        subValue={`${stats.tight_covenant_alerts} tight, ${stats.loose_covenant_alerts} loose`}
        index={4}
      />
      <StatCard
        icon={Shield}
        iconBg="bg-cyan-100"
        iconColor="text-cyan-600"
        label="Market Shifts"
        value={stats.market_shift_alerts}
        subValue="Trend changes detected"
        index={5}
      />
    </div>
  );
});
