'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface StatsCardProps {
    /** The label for the stat (e.g., "Active Deals") */
    label: string;
    /** The value to display */
    value: number | string;
    /** Icon component to display */
    icon: React.ReactNode;
    /** Optional trend direction */
    trend?: 'up' | 'down' | 'neutral';
    /** Optional trend percentage */
    trendPercent?: number;
    /** Optional click handler for navigation */
    onClick?: () => void;
    /** Optional custom className */
    className?: string;
    /** Optional data-testid */
    testId?: string;
}

export const StatsCard = memo(function StatsCard({
    label,
    value,
    icon,
    trend,
    trendPercent,
    onClick,
    className,
    testId,
}: StatsCardProps) {
    const isClickable = !!onClick;

    const getTrendIcon = () => {
        switch (trend) {
            case 'up':
                return <TrendingUp className="w-4 h-4 text-green-600" />;
            case 'down':
                return <TrendingDown className="w-4 h-4 text-red-600" />;
            case 'neutral':
                return <Minus className="w-4 h-4 text-zinc-400" />;
            default:
                return null;
        }
    };

    const getTrendColor = () => {
        switch (trend) {
            case 'up':
                return 'text-green-600';
            case 'down':
                return 'text-red-600';
            default:
                return 'text-zinc-500';
        }
    };

    return (
        <Card
            className={cn(
                'transition-all duration-200',
                isClickable && 'cursor-pointer hover:shadow-md hover:scale-[1.02]',
                className
            )}
            onClick={onClick}
            data-testid={testId}
        >
            <CardContent className="py-4">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-sm text-zinc-500 mb-1">{label}</p>
                        <p className="text-2xl font-bold text-zinc-900">{value}</p>

                        {(trend || trendPercent !== undefined) && (
                            <div className="flex items-center gap-1 mt-2">
                                {getTrendIcon()}
                                {trendPercent !== undefined && (
                                    <span className={cn('text-sm font-medium', getTrendColor())}>
                                        {trendPercent > 0 ? '+' : ''}{trendPercent}%
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="ml-3">
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
});
