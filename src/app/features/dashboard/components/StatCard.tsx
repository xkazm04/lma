'use client';

import React, { memo } from 'react';
import { StatCardUnified } from '@/components/ui/stat-card-unified';
import type { DashboardStat, StatDrilldownType } from '../lib/mocks';

interface StatCardProps {
  stat: DashboardStat;
  index?: number;
  drilldownType?: StatDrilldownType;
  onClick?: () => void;
}

/**
 * Dashboard StatCard - wrapper around unified StatCard with full variant
 * Maintains backward compatibility with existing dashboard usage
 */
export const StatCard = memo(function StatCard({ stat, index = 0, drilldownType, onClick }: StatCardProps) {
  return (
    <StatCardUnified
      variant="full"
      label={stat.label}
      value={stat.value}
      change={stat.change}
      trend={stat.trend}
      icon={stat.icon}
      onClick={onClick}
      index={index}
      testId={`stat-card-${drilldownType || stat.label.toLowerCase().replace(/\s+/g, '-')}`}
    />
  );
});
