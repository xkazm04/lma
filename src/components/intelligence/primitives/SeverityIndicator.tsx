'use client';

import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { severityConfig } from '../config';
import type { Severity } from '../types';

export interface SeverityIndicatorProps {
  /** Severity level */
  severity: Severity;
  /** Display variant */
  variant?: 'badge' | 'icon' | 'dot' | 'border';
  /** Show label text */
  showLabel?: boolean;
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  /** Animate critical/high severity */
  animate?: boolean;
  /** Additional className */
  className?: string;
}

export const SeverityIndicator = memo(function SeverityIndicator({
  severity,
  variant = 'badge',
  showLabel = true,
  size = 'sm',
  animate = false,
  className,
}: SeverityIndicatorProps) {
  const config = severityConfig[severity];
  const Icon = config.icon;

  const sizeClasses = {
    sm: { icon: 'w-3 h-3', dot: 'w-2 h-2', text: 'text-[10px]' },
    md: { icon: 'w-4 h-4', dot: 'w-2.5 h-2.5', text: 'text-xs' },
    lg: { icon: 'w-5 h-5', dot: 'w-3 h-3', text: 'text-sm' },
  };

  const shouldAnimate = animate && (severity === 'critical' || severity === 'high');

  if (variant === 'badge') {
    return (
      <Badge
        variant={config.badgeVariant}
        className={cn(
          sizeClasses[size].text,
          'px-1.5 py-0 capitalize',
          shouldAnimate && 'animate-pulse',
          className
        )}
      >
        {showLabel ? severity : <Icon className={sizeClasses[size].icon} />}
      </Badge>
    );
  }

  if (variant === 'icon') {
    return (
      <div
        className={cn(
          'p-1.5 rounded-lg',
          config.bgColor,
          shouldAnimate && 'animate-pulse',
          className
        )}
      >
        <Icon className={cn(sizeClasses[size].icon, config.iconColor)} />
      </div>
    );
  }

  if (variant === 'dot') {
    const dotColors = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-amber-500',
      low: 'bg-blue-500',
      info: 'bg-zinc-400',
    };

    return (
      <span
        className={cn(
          'inline-block rounded-full',
          sizeClasses[size].dot,
          dotColors[severity],
          shouldAnimate && 'animate-pulse',
          className
        )}
      />
    );
  }

  // Border variant - returns className for parent to use
  if (variant === 'border') {
    return (
      <span className={cn('border-l-4', config.borderColor, className)} />
    );
  }

  return null;
});

// Helper component for left-border severity indicator on cards
export interface SeverityBorderProps {
  severity: Severity;
  children: React.ReactNode;
  className?: string;
}

export const SeverityBorder = memo(function SeverityBorder({
  severity,
  children,
  className,
}: SeverityBorderProps) {
  const config = severityConfig[severity];

  return (
    <div
      className={cn(
        'border-l-4 rounded-lg',
        config.borderColor,
        className
      )}
    >
      {children}
    </div>
  );
});
