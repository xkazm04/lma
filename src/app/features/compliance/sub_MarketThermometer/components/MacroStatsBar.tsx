'use client';

import React from 'react';
import { TrendingDown, AlertCircle, Building2, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { MacroDashboardStats } from '../../lib/types';

interface MacroStatsBarProps {
  stats: MacroDashboardStats;
}

export function MacroStatsBar({ stats }: MacroStatsBarProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="macro-stats-bar">
      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">At-Risk Covenants</p>
            <p className="text-2xl font-bold mt-1">{stats.at_risk_covenants_percentage.toFixed(1)}%</p>
            <p className="text-xs text-red-600 mt-1">
              +{stats.at_risk_change_from_last_quarter.toFixed(1)}% QoQ
            </p>
          </div>
          <TrendingDown className="h-8 w-8 text-red-500" />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Critical Alerts</p>
            <p className="text-2xl font-bold mt-1">{stats.critical_alerts}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.active_market_alerts} total alerts
            </p>
          </div>
          <AlertCircle className="h-8 w-8 text-orange-500" />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Contributing Institutions</p>
            <p className="text-2xl font-bold mt-1">{stats.total_institutions}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total_covenants_tracked.toLocaleString()} covenants
            </p>
          </div>
          <Building2 className="h-8 w-8 text-blue-500" />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Industries in Stress</p>
            <p className="text-2xl font-bold mt-1">{stats.industries_in_stress}</p>
            <p className="text-xs text-muted-foreground mt-1">
              of {stats.total_industries} industries
            </p>
          </div>
          <BarChart3 className="h-8 w-8 text-purple-500" />
        </div>
      </Card>
    </div>
  );
}
