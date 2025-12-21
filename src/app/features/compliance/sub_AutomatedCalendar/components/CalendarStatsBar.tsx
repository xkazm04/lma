'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import type { CalendarStats } from '../lib/types';

interface CalendarStatsBarProps {
  stats: CalendarStats;
}

export const CalendarStatsBar = memo(function CalendarStatsBar({
  stats,
}: CalendarStatsBarProps) {
  const statItems = [
    {
      label: 'Total Events',
      value: stats.total_events,
      icon: Calendar,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Next 7 Days',
      value: stats.upcoming_7_days,
      icon: Clock,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
    {
      label: 'Overdue',
      value: stats.overdue_count,
      icon: AlertTriangle,
      iconBg: stats.overdue_count > 0 ? 'bg-red-100' : 'bg-green-100',
      iconColor: stats.overdue_count > 0 ? 'text-red-600' : 'text-green-600',
    },
    {
      label: 'Completed',
      value: stats.completed_this_month,
      icon: CheckCircle,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      label: 'Compliance Rate',
      value: `${stats.compliance_rate}%`,
      icon: TrendingUp,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {statItems.map((item, idx) => (
        <Card
          key={item.label}
          className="animate-in fade-in slide-in-from-bottom-2"
          style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
          data-testid={`stat-card-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${item.iconBg}`}>
                <item.icon className={`w-5 h-5 ${item.iconColor}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900">{item.value}</p>
                <p className="text-xs text-zinc-500">{item.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});
