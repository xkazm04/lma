'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Activity, DollarSign, Users } from 'lucide-react';
import type { HeadroomMarketStats } from '../lib/types';

interface MarketStatsBarProps {
  stats: HeadroomMarketStats;
}

export const MarketStatsBar = memo(function MarketStatsBar({ stats }: MarketStatsBarProps) {
  const statItems = [
    {
      icon: Activity,
      label: 'Active Listings',
      value: stats.total_active_listings,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: Users,
      label: 'Facilities Trading',
      value: stats.total_facilities_participating,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      icon: TrendingUp,
      label: 'Trades (30d)',
      value: stats.trades_completed_30d,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: DollarSign,
      label: 'Value Exchanged (30d)',
      value: `$${(stats.total_value_exchanged_30d / 1000).toFixed(0)}K`,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {statItems.map((item, index) => (
        <Card
          key={item.label}
          className="animate-in fade-in slide-in-from-bottom-2"
          style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
          data-testid={`market-stat-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${item.bgColor}`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-sm text-zinc-500">{item.label}</p>
                <p className="text-xl font-bold text-zinc-900">{item.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});
