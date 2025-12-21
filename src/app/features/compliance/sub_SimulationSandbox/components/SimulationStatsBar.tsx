'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FlaskConical, Play, AlertTriangle, Clock, FileText, Users } from 'lucide-react';
import type { SimulationDashboardStats } from '../lib/types';

interface SimulationStatsBarProps {
  stats: SimulationDashboardStats;
}

export const SimulationStatsBar = memo(function SimulationStatsBar({ stats }: SimulationStatsBarProps) {
  const statItems = [
    {
      label: 'Saved Scenarios',
      value: stats.total_scenarios,
      icon: FileText,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Runs This Month',
      value: stats.runs_this_month,
      icon: Play,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      label: 'Avg At-Risk',
      value: stats.avg_at_risk_covenants.toFixed(1),
      icon: AlertTriangle,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
    {
      label: 'Templates',
      value: stats.available_templates,
      icon: FlaskConical,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      label: 'Total Runs',
      value: stats.total_runs,
      icon: Clock,
      iconBg: 'bg-zinc-100',
      iconColor: 'text-zinc-600',
    },
    {
      label: 'Team Access',
      value: stats.team_members_with_access,
      icon: Users,
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
    },
  ];

  return (
    <div
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
      data-testid="simulation-stats-bar"
    >
      {statItems.map((item, index) => (
        <Card
          key={item.label}
          className="animate-in fade-in slide-in-from-bottom-2"
          style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
          data-testid={`stat-card-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${item.iconBg}`}>
                <item.icon className={`w-4 h-4 ${item.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xl font-bold text-zinc-900">{item.value}</p>
                <p className="text-xs text-zinc-500 truncate">{item.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});
