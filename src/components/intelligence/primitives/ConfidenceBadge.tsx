'use client';

import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { getConfidenceColor, formatConfidence } from '../config';

export interface ConfidenceBadgeProps {
  /** Confidence value (0-100) */
  confidence: number;
  /** Show percentage value */
  showValue?: boolean;
  /** Show label (High/Medium/Low) */
  showLabel?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Display variant: 'default' shows badge, 'minimal' shows just text */
  variant?: 'default' | 'minimal';
  /** Additional className */
  className?: string;
}

export const ConfidenceBadge = memo(function ConfidenceBadge({
  confidence,
  showValue = true,
  showLabel = false,
  size = 'sm',
  variant = 'default',
  className,
}: ConfidenceBadgeProps) {
  const colorClass = getConfidenceColor(confidence);
  const label = formatConfidence(confidence);

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-2.5 py-1',
  };

  // Minimal variant - just text without background
  if (variant === 'minimal') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 font-medium',
          confidence >= 80 ? 'text-green-600' :
          confidence >= 60 ? 'text-amber-600' :
          'text-zinc-500',
          size === 'sm' && 'text-[10px]',
          size === 'md' && 'text-xs',
          size === 'lg' && 'text-sm',
          className
        )}
      >
        {showValue && <span>{confidence}%</span>}
        {showLabel && <span className="opacity-80">{label}</span>}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded',
        colorClass,
        sizeClasses[size],
        className
      )}
    >
      {showValue && <span>{confidence}%</span>}
      {showLabel && <span className="opacity-80">{label}</span>}
    </span>
  );
});
