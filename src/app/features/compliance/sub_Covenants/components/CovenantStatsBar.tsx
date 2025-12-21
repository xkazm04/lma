'use client';

import React, { memo, useMemo } from 'react';
import { CheckCircle, AlertTriangle, XCircle, FileText, TrendingUp, Activity, Zap } from 'lucide-react';
import { CompactStatRow } from '@/components/ui/compact-stat-row';
import type { Covenant } from '../../lib';
import { calculateCovenantEntropyMetrics } from '../../lib/entropy';

interface CovenantStatsBarProps {
  covenants: Covenant[];
  showEntropyStats?: boolean;
}

export const CovenantStatsBar = memo(function CovenantStatsBar({
  covenants,
  showEntropyStats = true
}: CovenantStatsBarProps) {
  const statItems = useMemo(() => {
    const total = covenants.length;
    const passing = covenants.filter((c) => c.latest_test.test_result === 'pass').length;
    const failing = covenants.filter((c) => c.latest_test.test_result === 'fail').length;
    const atRisk = covenants.filter((c) => c.latest_test.test_result === 'pass' && c.latest_test.headroom_percentage < 15).length;
    const waived = covenants.filter((c) => c.status === 'waived').length;

    // Calculate entropy-based metrics
    let highAttention = 0;
    let criticalAttention = 0;

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

    const baseStats = [
      {
        label: 'Total',
        value: total,
        icon: <FileText className="w-4 h-4 text-zinc-500" />,
      },
      {
        label: 'Passing',
        value: passing,
        icon: <CheckCircle className="w-4 h-4 text-green-500" />,
        trend: 'up' as const,
      },
      {
        label: 'At Risk',
        value: atRisk,
        icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
        status: atRisk > 0 ? 'warning' as const : undefined,
      },
      {
        label: 'Failing',
        value: failing,
        icon: <XCircle className="w-4 h-4 text-red-500" />,
        status: failing > 0 ? 'error' as const : undefined,
      },
      {
        label: 'Waived',
        value: waived,
        icon: <TrendingUp className="w-4 h-4 text-zinc-400" />,
      },
    ];

    if (showEntropyStats) {
      return [
        ...baseStats,
        {
          label: 'Critical Entropy',
          value: criticalAttention,
          icon: <Zap className="w-4 h-4 text-red-500" />,
          status: criticalAttention > 0 ? 'error' as const : undefined,
        },
        {
          label: 'High Attention',
          value: highAttention,
          icon: <Activity className="w-4 h-4 text-orange-500" />,
          status: highAttention > 0 ? 'warning' as const : undefined,
        },
      ];
    }

    return baseStats;
  }, [covenants, showEntropyStats]);

  return (
    <div
      className="animate-in fade-in slide-in-from-top-2 duration-500"
      data-testid="covenant-stats-bar"
    >
      <CompactStatRow stats={statItems} variant="pills" />
    </div>
  );
});
