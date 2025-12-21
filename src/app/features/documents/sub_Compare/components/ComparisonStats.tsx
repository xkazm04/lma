
'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ComparisonResult } from '@/types';
import { useComparisonStats } from '../hooks/useComparisonStats';
import { useCountUp } from '../hooks/useCountUp';

interface ComparisonStatsProps {
  result: ComparisonResult;
}

interface StatCardProps {
  label: string;
  value: number;
  colorClasses: {
    card: string;
    label: string;
    value: string;
  };
  isHighlighted?: boolean;
  isPrimary?: boolean;
  animationDelay?: number;
  testId: string;
}

const StatCard = memo(function StatCard({
  label,
  value,
  colorClasses,
  isHighlighted = false,
  isPrimary = false,
  animationDelay = 0,
  testId,
}: StatCardProps) {
  const animatedValue = useCountUp(value);

  return (
    <Card
      className={cn(
        'animate-in fade-in slide-in-from-bottom-2 duration-300 transition-transform',
        colorClasses.card,
        isPrimary && 'scale-[1.04] shadow-md z-10',
        isHighlighted && 'animate-pulse-subtle'
      )}
      style={{
        animationDelay: `${animationDelay}ms`,
        animationFillMode: 'both',
        willChange: 'transform',
      }}
      data-testid={testId}
    >
      <CardContent className={cn('py-4', isPrimary && 'py-5')}>
        <p className={cn('text-sm', colorClasses.label, isPrimary && 'font-medium')}>
          {label}
        </p>
        <p
          className={cn(
            'font-bold tabular-nums',
            colorClasses.value,
            isPrimary ? 'text-3xl' : 'text-2xl'
          )}
          data-testid={`${testId}-value`}
        >
          {animatedValue}
        </p>
      </CardContent>
    </Card>
  );
});

const HIGH_COUNT_THRESHOLD = 10;

export const ComparisonStats = memo(function ComparisonStats({ result }: ComparisonStatsProps) {
  const stats = useComparisonStats(result);

  const isHighTotal = stats.total > HIGH_COUNT_THRESHOLD;
  const isHighAdded = stats.added > HIGH_COUNT_THRESHOLD;
  const isHighModified = stats.modified > HIGH_COUNT_THRESHOLD;
  const isHighRemoved = stats.removed > HIGH_COUNT_THRESHOLD;

  return (
    <div className="grid grid-cols-4 gap-4 items-end">
      <StatCard
        label="Total Changes"
        value={stats.total}
        colorClasses={{
          card: 'bg-zinc-50 border-zinc-200',
          label: 'text-zinc-500',
          value: 'text-zinc-900',
        }}
        isPrimary
        isHighlighted={isHighTotal}
        testId="compare-stats-total"
      />

      <StatCard
        label="Added"
        value={stats.added}
        colorClasses={{
          card: 'bg-green-50 border-green-200',
          label: 'text-green-600',
          value: 'text-green-700',
        }}
        isHighlighted={isHighAdded}
        animationDelay={50}
        testId="compare-stats-added"
      />

      <StatCard
        label="Modified"
        value={stats.modified}
        colorClasses={{
          card: 'bg-blue-50 border-blue-200',
          label: 'text-blue-600',
          value: 'text-blue-700',
        }}
        isHighlighted={isHighModified}
        animationDelay={100}
        testId="compare-stats-modified"
      />

      <StatCard
        label="Removed"
        value={stats.removed}
        colorClasses={{
          card: 'bg-red-50 border-red-200',
          label: 'text-red-600',
          value: 'text-red-700',
        }}
        isHighlighted={isHighRemoved}
        animationDelay={150}
        testId="compare-stats-removed"
      />
    </div>
  );
});
