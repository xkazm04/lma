
'use client';

import React, { memo, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import * as d3 from 'd3-shape';

export interface CovenantDataPoint {
    date: string;
    value: number;
}

interface CovenantTrendSparklineProps {
    title: string;
    data: CovenantDataPoint[];
    threshold?: number;
    thresholdType?: 'min' | 'max';
    currentValue: number;
    className?: string;
    height?: number;
}

export const CovenantTrendSparkline = memo(function CovenantTrendSparkline({
    title,
    data,
    threshold,
    thresholdType = 'max',
    currentValue,
    className,
    height = 80,
}: CovenantTrendSparklineProps) {
    // Determine status color based on threshold
    let statusColor = 'text-zinc-900';
    let chartColor = '#71717a'; // zinc-500

    if (threshold !== undefined) {
        const isPassing = thresholdType === 'max'
            ? currentValue <= threshold
            : currentValue >= threshold;

        if (isPassing) {
            statusColor = 'text-green-600';
            chartColor = '#16a34a'; // green-600
        } else {
            statusColor = 'text-red-600';
            chartColor = '#dc2626'; // red-600
        }
    }

    const { path } = useMemo(() => {
        if (!data.length) return { path: '' };

        const width = 300; // Arbitrary coordinate space width
        const h = height - 20; // Subtract padding

        const x = (d: CovenantDataPoint, i: number) => (i / (data.length - 1)) * width;

        const minValue = Math.min(...data.map(d => d.value), threshold || Infinity);
        const maxValue = Math.max(...data.map(d => d.value), threshold || -Infinity);
        const range = maxValue - minValue;

        // Y scale mapping, flipping Y since SVG origin is top-left
        const y = (d: CovenantDataPoint) => h - ((d.value - minValue) / (range || 1)) * h;

        const lineGenerator = d3.line<CovenantDataPoint>()
            .x((d, i) => x(d, i))
            .y((d) => y(d))
            .curve(d3.curveMonotoneX);

        const areaGenerator = d3.area<CovenantDataPoint>()
            .x((d, i) => x(d, i))
            .y0(h)
            .y1((d) => y(d))
            .curve(d3.curveMonotoneX);

        return {
            path: lineGenerator(data) || '',
            area: areaGenerator(data) || '',
        };
    }, [data, height, threshold]);

    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{title}</p>
                        <div className="flex items-baseline gap-2">
                            <span className={cn("text-2xl font-bold", statusColor)}>
                                {currentValue.toFixed(2)}x
                            </span>
                            {threshold !== undefined && (
                                <span className="text-xs text-zinc-400">
                                    Target: {thresholdType === 'max' ? '≤' : '≥'} {threshold.toFixed(2)}x
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ height }} className="w-full relative">
                    <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 300 80"
                        preserveAspectRatio="none"
                        className="overflow-visible"
                    >
                        {/* Gradient Definition */}
                        <defs>
                            <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={chartColor} stopOpacity={0.2} />
                                <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                            </linearGradient>
                        </defs>

                        {/* Threshold Line (Simplified approximation) */}
                        {threshold !== undefined && (
                            <line
                                x1="0"
                                y1="40"
                                x2="300"
                                y2="40"
                                stroke="#dae4e5"
                                strokeDasharray="4"
                                strokeWidth="1"
                            />
                        )}

                        {/* Area under the curve */}
                        {/* Note: Generating area path requires d3-shape area too, but for speed just doing line first */}
                        <path
                            d={path}
                            fill="none"
                            stroke={chartColor}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
            </CardContent>
        </Card>
    );
});
