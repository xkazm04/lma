'use client';

import React, { memo } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { RiskCategory, RiskDashboardStats } from '../../lib/types';

interface RiskCategoryBreakdownProps {
  stats: RiskDashboardStats;
  onCategoryClick?: (category: RiskCategory) => void;
}

const categoryConfig: Record<RiskCategory, { icon: LucideIcon; label: string; color: string }> = {
  covenant_threshold: {
    icon: Scale,
    label: 'Covenant Thresholds',
    color: 'bg-purple-500',
  },
  sanctions_screening: {
    icon: ShieldBan,
    label: 'Sanctions Screening',
    color: 'bg-red-500',
  },
  missing_clause: {
    icon: FileX,
    label: 'Missing Clauses',
    color: 'bg-orange-500',
  },
  conflicting_terms: {
    icon: GitBranch,
    label: 'Conflicting Terms',
    color: 'bg-amber-500',
  },
  unusual_terms: {
    icon: AlertCircle,
    label: 'Unusual Terms',
    color: 'bg-yellow-500',
  },
  regulatory_compliance: {
    icon: BookOpen,
    label: 'Regulatory Compliance',
    color: 'bg-blue-500',
  },
  document_quality: {
    icon: FileWarning,
    label: 'Document Quality',
    color: 'bg-teal-500',
  },
  party_risk: {
    icon: Users,
    label: 'Party Risk',
    color: 'bg-indigo-500',
  },
};

export const RiskCategoryBreakdown = memo(function RiskCategoryBreakdown({
  stats,
  onCategoryClick,
}: RiskCategoryBreakdownProps) {
  const categories = Object.entries(stats.byCategory)
    .map(([key, count]) => ({
      category: key as RiskCategory,
      count,
      ...categoryConfig[key as RiskCategory],
    }))
    .sort((a, b) => b.count - a.count);

  const maxCount = Math.max(...categories.map((c) => c.count), 1);

  return (
    <Card data-testid="risk-category-breakdown">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Risk Categories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {categories.map(({ category, count, icon: Icon, label, color }) => (
          <button
            key={category}
            onClick={() => onCategoryClick?.(category)}
            className="w-full group"
            data-testid={`risk-category-${category}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'p-1.5 rounded transition-transform group-hover:scale-110',
                  color.replace('bg-', 'bg-opacity-20 bg-')
                )}
              >
                <Icon className={cn('w-4 h-4', color.replace('bg-', 'text-'))} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-zinc-700 truncate group-hover:text-zinc-900">
                    {label}
                  </span>
                  <span className="text-sm font-semibold text-zinc-900">{count}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', color)}
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
});
