'use client';

import React, { memo, useMemo } from 'react';
import { CheckCircle, AlertTriangle, XCircle, FileText, Shield, Activity, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Covenant } from '../../lib';
import { calculateCovenantEntropyMetrics } from '../../lib/entropy';

interface CovenantStatsBarProps {
  covenants: Covenant[];
  showEntropyStats?: boolean;
}

interface StatIndicatorProps {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
  iconColor: string;
  highlight?: 'warning' | 'error';
}

const StatIndicator = memo(function StatIndicator({
  icon: Icon,
  value,
  label,
  iconColor,
  highlight,
}: StatIndicatorProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors',
        highlight === 'error' && 'bg-red-50 border border-red-200',
        highlight === 'warning' && 'bg-amber-50 border border-amber-200',
        !highlight && 'bg-zinc-50'
      )}
      title={label}
      data-testid={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <Icon className={cn('w-3.5 h-3.5 flex-shrink-0', iconColor)} />
      <span className="text-sm font-semibold text-zinc-900 tabular-nums">{value}</span>
      <span className="text-[10px] text-zinc-500 hidden sm:inline">{label}</span>
    </div>
  );
});

export const CovenantStatsBar = memo(function CovenantStatsBar({
  covenants,
  showEntropyStats = true
}: CovenantStatsBarProps) {
  const stats = useMemo(() => {
    const total = covenants.length;
    const passing = covenants.filter((c) => c.latest_test.test_result === 'pass').length;
    const failing = covenants.filter((c) => c.latest_test.test_result === 'fail').length;
    const atRisk = covenants.filter((c) => c.latest_test.test_result === 'pass' && c.latest_test.headroom_percentage < 15).length;
    const waived = covenants.filter((c) => c.status === 'waived').length;

    let criticalAttention = 0;
    let highAttention = 0;

    if (showEntropyStats) {
      covenants.forEach(covenant => {
        const testHistory = covenant.test_history && covenant.test_history.length > 0
          ? covenant.test_history
          : [covenant.latest_test];

        const testPoints = testHistory.map(test => ({
          test_date: test.test_date,
          headroom_percentage: test.headroom_percentage,
        }));

        const metrics = calculateCovenantEntropyMetrics(testPoints);

        if (metrics.attentionLevel === 5) {
          criticalAttention++;
        } else if (metrics.attentionLevel >= 4) {
          highAttention++;
        }
      });
    }

    return { total, passing, failing, atRisk, waived, criticalAttention, highAttention };
  }, [covenants, showEntropyStats]);

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-testid="covenant-stats-bar"
    >
      <StatIndicator
        icon={FileText}
        value={stats.total}
        label="Total"
        iconColor="text-zinc-500"
      />
      <StatIndicator
        icon={CheckCircle}
        value={stats.passing}
        label="Passing"
        iconColor="text-green-500"
      />
      <StatIndicator
        icon={AlertTriangle}
        value={stats.atRisk}
        label="At Risk"
        iconColor="text-amber-500"
        highlight={stats.atRisk > 0 ? 'warning' : undefined}
      />
      <StatIndicator
        icon={XCircle}
        value={stats.failing}
        label="Failing"
        iconColor="text-red-500"
        highlight={stats.failing > 0 ? 'error' : undefined}
      />
      <StatIndicator
        icon={Shield}
        value={stats.waived}
        label="Waived"
        iconColor="text-zinc-400"
      />
      {showEntropyStats && (
        <>
          <div className="w-px h-5 bg-zinc-200 mx-1" />
          <StatIndicator
            icon={Zap}
            value={stats.criticalAttention}
            label="Critical"
            iconColor="text-red-500"
            highlight={stats.criticalAttention > 0 ? 'error' : undefined}
          />
          <StatIndicator
            icon={Activity}
            value={stats.highAttention}
            label="High Attn"
            iconColor="text-orange-500"
            highlight={stats.highAttention > 0 ? 'warning' : undefined}
          />
        </>
      )}
    </div>
  );
});
