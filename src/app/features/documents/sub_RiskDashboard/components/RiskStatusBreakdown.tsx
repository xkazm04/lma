'use client';

import React, { memo, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Eye, Search, CheckCircle, XCircle, AlertCircle, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RiskAlertStatus, RiskDashboardStats } from '../../lib/types';

interface RiskStatusBreakdownProps {
  stats: RiskDashboardStats;
  onStatusClick?: (status: RiskAlertStatus) => void;
  selectedStatus?: RiskAlertStatus | null;
}

const statusConfig: Record<RiskAlertStatus, { icon: LucideIcon; label: string; color: string }> = {
  new: {
    icon: AlertCircle,
    label: 'New',
    color: '#ef4444',
  },
  acknowledged: {
    icon: Eye,
    label: 'Acknowledged',
    color: '#f59e0b',
  },
  investigating: {
    icon: Search,
    label: 'Investigating',
    color: '#3b82f6',
  },
  resolved: {
    icon: CheckCircle,
    label: 'Resolved',
    color: '#22c55e',
  },
  false_positive: {
    icon: XCircle,
    label: 'False Positive',
    color: '#71717a',
  },
};

export const RiskStatusBreakdown = memo(function RiskStatusBreakdown({
  stats,
  onStatusClick,
  selectedStatus,
}: RiskStatusBreakdownProps) {
  const chartData = useMemo(() => {
    return Object.entries(stats.byStatus)
      .map(([key, count]) => ({
        status: key as RiskAlertStatus,
        count,
        name: statusConfig[key as RiskAlertStatus].label,
        color: statusConfig[key as RiskAlertStatus].color,
      }))
      .filter(item => item.count > 0);
  }, [stats.byStatus]);

  const total = useMemo(() =>
    chartData.reduce((sum, item) => sum + item.count, 0),
    [chartData]
  );

  // Calculate active (non-resolved) count
  const activeCount = useMemo(() =>
    chartData
      .filter(item => item.status !== 'resolved' && item.status !== 'false_positive')
      .reduce((sum, item) => sum + item.count, 0),
    [chartData]
  );

  return (
    <div className="space-y-2" data-testid="risk-status-breakdown">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">Alert Status</h3>
        <span className="text-xs text-zinc-500">{activeCount} active</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Mini Donut Chart */}
        <div className="relative w-[80px] h-[80px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={38}
                paddingAngle={2}
                cursor="pointer"
                onClick={(data) => onStatusClick?.(data.status)}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.status}
                    fill={entry.color}
                    opacity={selectedStatus && selectedStatus !== entry.status ? 0.3 : 1}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-zinc-900 text-white text-xs px-2 py-1 rounded shadow-lg">
                      {data.name}: {data.count}
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center Text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-zinc-900">{total}</span>
          </div>
        </div>

        {/* Inline Legend */}
        <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-1">
          {chartData.map(({ status, count, name, color }) => {
            const Icon = statusConfig[status].icon;
            const isSelected = selectedStatus === status;
            return (
              <button
                key={status}
                onClick={() => onStatusClick?.(status)}
                className={cn(
                  'flex items-center gap-1.5 text-left rounded px-1.5 py-0.5 transition-colors',
                  isSelected ? 'bg-zinc-100' : 'hover:bg-zinc-50'
                )}
                data-testid={`risk-status-${status}`}
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-zinc-600 truncate">{name}</span>
                <span className="text-xs font-semibold text-zinc-900 ml-auto">{count}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});
