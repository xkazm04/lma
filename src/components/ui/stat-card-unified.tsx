'use client';

import React, { memo } from 'react';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendIcon, type TrendDirection } from '@/components/ui/trend-icon';
import { Sparkline } from '@/components/ui/sparkline';
import { cn } from '@/lib/utils';

export type StatCardVariant = 'full' | 'compact' | 'inline';

export interface StatCardUnifiedProps {
  /** Display variant: 'full' (card with drilldown), 'compact' (horizontal), 'inline' (minimal) */
  variant?: StatCardVariant;
  /** Label for the stat */
  label: string;
  /** Main value to display */
  value: string | number;
  /** Optional secondary/sub value */
  subValue?: string;
  /** Optional trend direction */
  trend?: TrendDirection;
  /** Optional change value (e.g., "+12%", "-5 since last week") */
  change?: string | number;
  /** Icon to display (React node or Lucide icon component) */
  icon?: React.ReactNode | React.ComponentType<{ className?: string }>;
  /** Background color class for icon container */
  iconBgClass?: string;
  /** Icon color class */
  iconColorClass?: string;
  /** Click handler */
  onClick?: () => void;
  /** Animation index for staggered entrance */
  index?: number;
  /** Test ID for testing */
  testId?: string;
  /** Additional className for the root element */
  className?: string;
  /** Custom color classes for themed cards */
  colorClasses?: {
    card?: string;
    label?: string;
    value?: string;
    subValue?: string;
  };
  /** Whether this card is highlighted/primary */
  isPrimary?: boolean;
  /** Optional sparkline data for mini trend visualization */
  sparklineData?: number[];
}

// Helper to format change value
function formatChange(change: string | number | undefined): string | null {
  if (change === undefined) return null;
  if (typeof change === 'number') {
    return `${change > 0 ? '+' : ''}${change}%`;
  }
  return change;
}

// Helper to check if something is a React component (function, forwardRef, or memo)
function isReactComponent(
  value: unknown
): value is React.ComponentType<{ className?: string }> {
  if (typeof value === 'function') return true;
  // forwardRef and memo components are objects with $$typeof
  if (
    typeof value === 'object' &&
    value !== null &&
    '$$typeof' in value &&
    typeof (value as { render?: unknown }).render === 'function'
  ) {
    return true;
  }
  return false;
}

// Helper to render icon
function renderIcon(
  icon: React.ReactNode | React.ComponentType<{ className?: string }> | undefined,
  iconColorClass: string,
  size: 'sm' | 'md' | 'lg' = 'md'
): React.ReactNode {
  if (!icon) return null;

  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  // Check if it's a component (function, forwardRef, or memo)
  if (isReactComponent(icon)) {
    const IconComponent = icon as React.ComponentType<{ className?: string }>;
    return <IconComponent className={cn(sizeClasses[size], iconColorClass)} />;
  }

  // It's already a ReactNode (rendered element)
  return icon;
}

// Full variant - card with icon, trend, and drilldown capability
const FullStatCard = memo(function FullStatCard({
  label,
  value,
  subValue,
  trend,
  change,
  icon,
  iconBgClass = 'bg-zinc-100',
  iconColorClass = 'text-zinc-600',
  onClick,
  index = 0,
  testId,
  className,
  colorClasses,
  isPrimary,
}: Omit<StatCardUnifiedProps, 'variant'>) {
  const isClickable = Boolean(onClick);
  const formattedChange = formatChange(change);

  return (
    <Card
      className={cn(
        'transform transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-md',
        'animate-in fade-in slide-in-from-bottom-4',
        isClickable && 'cursor-pointer group',
        isPrimary && 'scale-[1.02] shadow-md',
        colorClasses?.card,
        className
      )}
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      data-testid={testId}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className={cn('text-sm text-zinc-500', colorClasses?.label)}>{label}</p>
            <p className={cn('text-3xl font-bold text-zinc-900 mt-1', colorClasses?.value)}>
              {value}
            </p>
            {(trend || formattedChange) && (
              <p
                className={cn(
                  'text-xs mt-1 flex items-center gap-1 transition-colors',
                  trend === 'up' && 'text-green-600',
                  trend === 'down' && 'text-red-600',
                  (trend === 'stable' || trend === 'neutral' || !trend) && 'text-zinc-500',
                  colorClasses?.subValue
                )}
              >
                {trend && <TrendIcon trend={trend} size="sm" colorize />}
                {formattedChange}
              </p>
            )}
            {subValue && !formattedChange && (
              <p className={cn('text-xs mt-1 text-zinc-500', colorClasses?.subValue)}>{subValue}</p>
            )}
          </div>
          {icon && (
            <div className="relative">
              <div
                className={cn(
                  'p-3 rounded-lg transition-colors',
                  iconBgClass,
                  isClickable && 'group-hover:bg-zinc-200'
                )}
              >
                {renderIcon(icon, iconColorClass, 'lg')}
              </div>
              {isClickable && (
                <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-zinc-900 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="w-3 h-3" />
                </div>
              )}
            </div>
          )}
        </div>
        {isClickable && (
          <div className="mt-3 pt-3 border-t border-zinc-100 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-xs text-zinc-500 flex items-center gap-1">
              Click to view details
              <ChevronRight className="w-3 h-3" />
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// Compact variant - horizontal layout for top bars
const CompactStatCard = memo(function CompactStatCard({
  label,
  value,
  subValue,
  trend,
  change,
  icon,
  iconColorClass = 'text-zinc-600',
  onClick,
  index = 0,
  testId,
  className,
  colorClasses,
  sparklineData,
}: Omit<StatCardUnifiedProps, 'variant'>) {
  const isClickable = Boolean(onClick);
  const formattedChange = formatChange(change);

  return (
    <button
      onClick={onClick}
      disabled={!isClickable}
      className={cn(
        'flex items-center gap-3 px-4 py-3 transition-all duration-200',
        'animate-in fade-in slide-in-from-top-2',
        isClickable && 'cursor-pointer hover:bg-zinc-50/50 active:scale-[0.98]',
        !isClickable && 'cursor-default',
        colorClasses?.card,
        className
      )}
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
      data-testid={testId}
    >
      {/* Icon */}
      {icon && <div className={cn('flex-shrink-0', iconColorClass)}>{renderIcon(icon, iconColorClass, 'md')}</div>}

      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        <p className={cn('text-xs text-zinc-500 mb-0.5 font-medium', colorClasses?.label)}>
          {label || 'Statistic'}
        </p>
        <div className="flex items-baseline gap-2">
          <p className={cn('text-xl font-bold text-zinc-900', colorClasses?.value)}>{value}</p>
          {(formattedChange !== null || trend) && (
            <div
              className={cn(
                'flex items-center gap-0.5 text-xs font-medium',
                trend === 'up' && 'text-green-600',
                trend === 'down' && 'text-red-600',
                (trend === 'stable' || trend === 'neutral') && 'text-zinc-500',
                colorClasses?.subValue
              )}
            >
              {trend && <TrendIcon trend={trend} size="sm" colorize />}
              <span>{formattedChange}</span>
            </div>
          )}
        </div>
        {subValue && (
          <p className={cn('text-xs text-zinc-400 mt-0.5', colorClasses?.subValue)}>{subValue}</p>
        )}
      </div>

      {/* Sparkline */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="flex-shrink-0 ml-2">
          <Sparkline
            data={sparklineData}
            width={56}
            height={20}
            strokeColor="auto"
            fillColor="auto"
            showEndDot={false}
            smoothing={0.3}
          />
        </div>
      )}
    </button>
  );
});

// Inline variant - minimal compact stat for dense layouts
const InlineStatCard = memo(function InlineStatCard({
  label,
  value,
  subValue,
  trend,
  icon,
  iconBgClass = 'bg-zinc-100',
  iconColorClass = 'text-white',
  onClick,
  index = 0,
  testId,
  className,
  colorClasses,
}: Omit<StatCardUnifiedProps, 'variant'>) {
  const isClickable = Boolean(onClick);

  return (
    <div
      className={cn(
        'p-3 rounded-lg border border-zinc-100 bg-white hover:border-zinc-200 hover:shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2',
        isClickable && 'cursor-pointer hover:scale-[1.01]',
        colorClasses?.card,
        className
      )}
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      data-testid={testId}
    >
      <div className="flex items-center gap-2">
        {icon && (
          <div className={cn('p-1.5 rounded-lg', iconBgClass)}>
            {renderIcon(icon, iconColorClass, 'sm')}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={cn('text-[10px] text-zinc-500 truncate', colorClasses?.label)}>{label}</p>
          <div className="flex items-center gap-1.5">
            <span className={cn('text-base font-semibold text-zinc-900', colorClasses?.value)}>
              {value}
            </span>
            {subValue && (
              <span className={cn('text-[10px] text-zinc-400', colorClasses?.subValue)}>
                {subValue}
              </span>
            )}
            {trend && <TrendIcon trend={trend} size="sm" colorize />}
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * Unified StatCard component with three variants:
 * - 'full': Card with icon, trend indicator, and drilldown capability (default)
 * - 'compact': Horizontal layout for top bars and stat rows
 * - 'inline': Minimal layout for dense grids and correlation views
 */
export const StatCardUnified = memo(function StatCardUnified({
  variant = 'full',
  ...props
}: StatCardUnifiedProps) {
  switch (variant) {
    case 'compact':
      return <CompactStatCard {...props} />;
    case 'inline':
      return <InlineStatCard {...props} />;
    case 'full':
    default:
      return <FullStatCard {...props} />;
  }
});

// Re-export for convenience
export default StatCardUnified;
