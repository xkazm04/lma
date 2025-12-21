'use client';

import React, { memo, useMemo } from 'react';
import { Users, Clock, AlertTriangle, CheckCircle2, AlertCircle, TrendingUp, FileText } from 'lucide-react';
import { CompactStatRow } from '@/components/ui/compact-stat-row';
import type { DealWithStats } from '../lib/types';
import { formatDeadlineDisplay } from '../lib/deadline-utils';

interface DealStatsProps {
  deal: DealWithStats;
}

export const DealStats = memo(function DealStats({ deal }: DealStatsProps) {
  const progressPercent = useMemo(() => {
    return deal.stats
      ? Math.round((deal.stats.agreed_terms / deal.stats.total_terms) * 100)
      : 0;
  }, [deal.stats]);

  const deadlineStats = deal.stats?.deadline_stats;
  const hasDeadlines = deadlineStats && deadlineStats.total_with_deadlines > 0;

  // Calculate deadline health score (percentage on track or completed)
  const deadlineHealthPercent = useMemo(() => {
    if (!deadlineStats || deadlineStats.total_with_deadlines === 0) return 100;
    return Math.round(
      (deadlineStats.on_track / deadlineStats.total_with_deadlines) * 100
    );
  }, [deadlineStats]);

  // Determine health status
  const deadlineStatus = useMemo(() => {
    if (!deadlineStats || deadlineStats.total_with_deadlines === 0) return 'neutral';
    if (deadlineStats.overdue > 0) return 'error';
    if (deadlineStats.due_soon > 0) return 'warning';
    return 'success';
  }, [deadlineStats]) as 'neutral' | 'error' | 'warning' | 'success';

  // Format target close date using UTC to ensure consistency across timezones
  const targetCloseDisplay = deal.target_close_date
    ? formatDeadlineDisplay(deal.target_close_date, {
        includeWeekday: false,
        includeYear: false,
        showUTCIndicator: false,
      }) ?? 'Not set'
    : 'Not set';

  const stats = useMemo(() => [
    {
      label: 'Progress',
      value: `${progressPercent}%`,
      icon: <TrendingUp className="w-4 h-4 text-green-500" />,
      trend: 'up' as const,
    },
    {
      label: 'Agreed',
      value: deal.stats?.agreed_terms || 0,
      icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    },
    {
      label: 'Pending',
      value: deal.stats?.pending_proposals || 0,
      icon: <AlertCircle className="w-4 h-4 text-amber-500" />,
      status: (deal.stats?.pending_proposals || 0) > 0 ? 'warning' as const : undefined,
    },
    {
      label: 'Deadline Health',
      value: hasDeadlines ? `${deadlineHealthPercent}%` : 'N/A',
      icon: deadlineStatus === 'error' ? (
        <AlertTriangle className="w-4 h-4 text-red-500" />
      ) : deadlineStatus === 'warning' ? (
        <AlertCircle className="w-4 h-4 text-amber-500" />
      ) : (
        <Clock className="w-4 h-4 text-zinc-400" />
      ),
      status: deadlineStatus !== 'neutral' ? deadlineStatus : undefined,
    },
    {
      label: 'Participants',
      value: deal.stats?.participant_count || 0,
      icon: <Users className="w-4 h-4 text-zinc-400" />,
    },
    {
      label: 'Target Close',
      value: targetCloseDisplay,
      icon: <Clock className="w-4 h-4 text-zinc-400" />,
    },
  ], [progressPercent, deal.stats, hasDeadlines, deadlineHealthPercent, deadlineStatus, targetCloseDisplay]);

  return (
    <div
      className="animate-in fade-in slide-in-from-top-4 duration-500 delay-100"
      data-testid="deal-stats-container"
    >
      <CompactStatRow stats={stats} variant="bordered" />
    </div>
  );
});
