'use client';

import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { StatCardUnified } from '@/components/ui/stat-card-unified';
import type { TrendDirection } from '@/components/ui/trend-icon';

export interface StatItem {
    label: string;
    value: string;
    change?: string | number;
    trend?: TrendDirection;
    icon?: React.ReactNode;
    onClick?: () => void;
    sparklineData?: number[];
}

interface StatsTopBarProps {
    stats: StatItem[];
    className?: string;
}

/**
 * StatsTopBar - horizontal bar of compact stat cards
 * Uses StatCardUnified with compact variant
 */
export const StatsTopBar = memo(function StatsTopBar({
    stats,
    className,
}: StatsTopBarProps) {
    return (
        <div
            className={cn(
                'flex flex-wrap items-stretch bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden',
                className
            )}
            data-testid="stats-top-bar"
        >
            {stats.map((stat, index) => (
                <React.Fragment key={stat.label || `stat-${index}`}>
                    <StatCardUnified
                        variant="compact"
                        label={stat.label}
                        value={stat.value}
                        change={stat.change}
                        trend={stat.trend}
                        icon={stat.icon}
                        onClick={stat.onClick}
                        index={index}
                        sparklineData={stat.sparklineData}
                        testId={`stat-block-${stat.label ? stat.label.toLowerCase().replace(/\s+/g, '-') : `index-${index}`}`}
                    />
                    {index < stats.length - 1 && (
                        <div className="w-px bg-zinc-200 my-2" />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
});
