
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';


// Note: Assuming TrendIcon/TrendDirection might not exist in generic form, 
// using simple fallback if needed or reusing if present. 
// Given the requirements, I'll create a simple internal trend indicator if not found,
// but the requirement implies standardized features.

interface StatsCardProps {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string | number;
    trendLabel?: string;
    className?: string;
    onClick?: () => void;
    description?: string;
}

export function StatsCard({
    label,
    value,
    icon,
    trend,
    trendValue,
    trendLabel,
    className,
    onClick,
    description,
}: StatsCardProps) {
    return (
        <Card
            className={cn(
                "transition-all duration-200",
                onClick && "cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
                className
            )}
            onClick={onClick}
        >
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    {icon && <div className="text-muted-foreground">{icon}</div>}
                </div>
                <div className="flex items-end justify-between">
                    <div>
                        <div className="text-2xl font-bold">{value}</div>
                        {description && (
                            <p className="text-xs text-muted-foreground mt-1">{description}</p>
                        )}

                        {(trend || trendValue) && (
                            <div className="flex items-center mt-1 text-xs">
                                {trend === 'up' && (
                                    <span className="text-green-600 flex items-center font-medium">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                            className="w-4 h-4 mr-0.5"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        {trendValue}
                                    </span>
                                )}
                                {trend === 'down' && (
                                    <span className="text-red-600 flex items-center font-medium">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                            className="w-4 h-4 mr-0.5"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M12 13a1 1 0 110 2h5a1 1 0 011-1V9a1 1 0 11-2 0v2.586l-4.293-4.293a1 1 0 01-1.414 0L8 9.586 3.707 5.293a1 1 0 01-1.414 1.414l5 5a1 1 0 011.414 0L11 9.414 14.586 13H12z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        {trendValue}
                                    </span>
                                )}
                                {trend === 'neutral' && (
                                    <span className="text-zinc-500 flex items-center font-medium">
                                        <span className="mr-1">−</span>
                                        {trendValue}
                                    </span>
                                )}
                                {trendLabel && <span className="text-muted-foreground ml-1">{trendLabel}</span>}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
