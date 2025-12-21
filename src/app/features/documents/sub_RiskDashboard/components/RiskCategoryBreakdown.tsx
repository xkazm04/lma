'use client';

import React, { memo, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  Scale,
  ShieldBan,
  FileX,
  GitBranch,
  AlertCircle,
  BookOpen,
  FileWarning,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RiskCategory, RiskDashboardStats } from '../../lib/types';

interface RiskCategoryBreakdownProps {
  stats: RiskDashboardStats;
  onCategoryClick?: (category: RiskCategory) => void;
  selectedCategory?: RiskCategory | null;
}

const categoryConfig: Record<RiskCategory, { icon: LucideIcon; label: string; color: string; shortLabel: string }> = {
  covenant_threshold: {
    icon: Scale,
    label: 'Covenant Thresholds',
    shortLabel: 'Covenant',
    color: '#a855f7',
  },
  sanctions_screening: {
    icon: ShieldBan,
    label: 'Sanctions Screening',
    shortLabel: 'Sanctions',
    color: '#ef4444',
  },
  missing_clause: {
    icon: FileX,
    label: 'Missing Clauses',
    shortLabel: 'Missing',
    color: '#f97316',
  },
  conflicting_terms: {
    icon: GitBranch,
    label: 'Conflicting Terms',
    shortLabel: 'Conflict',
    color: '#f59e0b',
  },
  unusual_terms: {
    icon: AlertCircle,
    label: 'Unusual Terms',
    shortLabel: 'Unusual',
    color: '#eab308',
  },
  regulatory_compliance: {
    icon: BookOpen,
    label: 'Regulatory Compliance',
    shortLabel: 'Regulatory',
    color: '#3b82f6',
  },
  document_quality: {
    icon: FileWarning,
    label: 'Document Quality',
    shortLabel: 'Quality',
    color: '#14b8a6',
  },
  party_risk: {
    icon: Users,
    label: 'Party Risk',
    shortLabel: 'Party',
    color: '#6366f1',
  },
};

export const RiskCategoryBreakdown = memo(function RiskCategoryBreakdown({
  stats,
  onCategoryClick,
  selectedCategory,
}: RiskCategoryBreakdownProps) {
  const chartData = useMemo(() => {
    return Object.entries(stats.byCategory)
      .map(([key, count]) => ({
        category: key as RiskCategory,
        count,
        name: categoryConfig[key as RiskCategory].shortLabel,
        fullName: categoryConfig[key as RiskCategory].label,
        color: categoryConfig[key as RiskCategory].color,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6); // Show top 6 for compactness
  }, [stats.byCategory]);

  const total = useMemo(() =>
    chartData.reduce((sum, item) => sum + item.count, 0),
    [chartData]
  );

  const handleBarClick = (data: { category: RiskCategory }) => {
    onCategoryClick?.(data.category);
  };

  return (
    <div className="space-y-2" data-testid="risk-category-breakdown">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">Risk Categories</h3>
        <span className="text-xs text-zinc-500">{total} total</span>
      </div>

      {/* Horizontal Bar Chart */}
      <div className="h-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={60}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#71717a' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-zinc-900 text-white text-xs px-2 py-1 rounded shadow-lg">
                    {data.fullName}: {data.count}
                  </div>
                );
              }}
            />
            <Bar
              dataKey="count"
              radius={[0, 4, 4, 0]}
              cursor="pointer"
              onClick={(data) => handleBarClick(data)}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.category}
                  fill={entry.color}
                  opacity={selectedCategory && selectedCategory !== entry.category ? 0.3 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Filter Pills */}
      <div className="flex flex-wrap gap-1">
        {chartData.slice(0, 4).map(({ category, count, color }) => {
          const Icon = categoryConfig[category].icon;
          const isSelected = selectedCategory === category;
          return (
            <button
              key={category}
              onClick={() => onCategoryClick?.(category)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all',
                isSelected
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              )}
              data-testid={`risk-category-${category}`}
            >
              <Icon className="w-3 h-3" style={{ color: isSelected ? 'white' : color }} />
              <span>{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
