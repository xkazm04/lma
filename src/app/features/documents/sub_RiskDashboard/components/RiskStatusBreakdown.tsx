'use client';

import React, { memo } from 'react';
import { Eye, Search, CheckCircle, XCircle, AlertCircle, type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { RiskAlertStatus, RiskDashboardStats } from '../../lib/types';

interface RiskStatusBreakdownProps {
  stats: RiskDashboardStats;
  onStatusClick?: (status: RiskAlertStatus) => void;
}

const statusConfig: Record<RiskAlertStatus, { icon: LucideIcon; label: string; color: string; bgColor: string }> = {
  new: {
    icon: AlertCircle,
    label: 'New',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  acknowledged: {
    icon: Eye,
    label: 'Acknowledged',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  investigating: {
    icon: Search,
    label: 'Investigating',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  resolved: {
    icon: CheckCircle,
    label: 'Resolved',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  false_positive: {
    icon: XCircle,
    label: 'False Positive',
    color: 'text-zinc-500',
    bgColor: 'bg-zinc-100',
  },
};

export const RiskStatusBreakdown = memo(function RiskStatusBreakdown({
  stats,
  onStatusClick,
}: RiskStatusBreakdownProps) {
  const statuses = Object.entries(stats.byStatus)
    .map(([key, count]) => ({
      status: key as RiskAlertStatus,
      count,
      ...statusConfig[key as RiskAlertStatus],
    }));

  const total = statuses.reduce((sum, s) => sum + s.count, 0);

  return (
    <Card data-testid="risk-status-breakdown">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Alert Status</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Status Distribution Bar */}
        <div className="flex h-3 rounded-full overflow-hidden bg-zinc-100 mb-4">
          {statuses.map(({ status, count, bgColor }) => {
            const percentage = total > 0 ? (count / total) * 100 : 0;
            if (percentage === 0) return null;
            return (
              <div
                key={status}
                className={cn('transition-all', bgColor)}
                style={{ width: `${percentage}%` }}
                title={`${statusConfig[status].label}: ${count}`}
              />
            );
          })}
        </div>

        {/* Status Items */}
        <div className="grid grid-cols-2 gap-3">
          {statuses.map(({ status, count, icon: Icon, label, color, bgColor }) => (
            <button
              key={status}
              onClick={() => onStatusClick?.(status)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-50 transition-colors group"
              data-testid={`risk-status-${status}`}
            >
              <div className={cn('p-1.5 rounded', bgColor)}>
                <Icon className={cn('w-4 h-4', color)} />
              </div>
              <div className="flex-1 text-left">
                <div className="text-xs text-zinc-500">{label}</div>
                <div className="text-lg font-semibold text-zinc-900 group-hover:text-zinc-700">
                  {count}
                </div>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
