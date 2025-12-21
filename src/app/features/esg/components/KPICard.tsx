'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  icon?: React.ReactNode;
}

export const KPICard = memo(function KPICard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  variant = 'default',
  icon,
}: KPICardProps) {
  const variantStyles = {
    default: 'bg-zinc-50 border-zinc-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-amber-50 border-amber-200',
    danger: 'bg-red-50 border-red-200',
  };

  const valueStyles = {
    default: 'text-zinc-900',
    success: 'text-green-700',
    warning: 'text-amber-700',
    danger: 'text-red-700',
  };

  const getTrendAriaLabel = (): string => {
    if (trend === 'up') return 'Trend: increasing';
    if (trend === 'down') return 'Trend: decreasing';
    return 'Trend: stable';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-600" aria-hidden="true" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-600" aria-hidden="true" />;
    return <Minus className="w-4 h-4 text-zinc-400" aria-hidden="true" />;
  };

  // Generate unique ID for aria-labelledby
  const titleId = `kpi-title-${title.replace(/\s+/g, '-').toLowerCase()}`;
  const valueId = `kpi-value-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <Card
      className={`${variantStyles[variant]} transition-all duration-300 hover:scale-105 hover:shadow-md animate-in fade-in slide-in-from-bottom-4 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2`}
      role="region"
      aria-labelledby={titleId}
      data-testid={`kpi-card-${title.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          {icon && <div className="p-2 rounded-lg bg-white/50 shrink-0" aria-hidden="true">{icon}</div>}
          <div className="flex-1 flex flex-col gap-1" aria-live="polite" aria-atomic="true">
            <p id={titleId} className="text-xs text-zinc-500">{title}</p>
            <p id={valueId} className={`text-xl font-bold ${valueStyles[variant]}`}>{value}</p>
            {subtitle && <p className="text-xs text-zinc-600">{subtitle}</p>}
            {trend && trendValue && (
              <div className="flex items-center gap-1" aria-label={getTrendAriaLabel()}>
                {getTrendIcon()}
                <span className="text-xs text-zinc-600">{trendValue}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
