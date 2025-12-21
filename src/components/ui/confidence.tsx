'use client';

import React, { memo } from 'react';
import { CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CONFIDENCE_DISPLAY_THRESHOLDS } from '@/app/features/documents/lib/constants';

/**
 * Visual display thresholds for confidence indicators.
 * Re-exported from centralized constants for backward compatibility.
 *
 * Threshold Summary:
 * - HIGH (>= 85%): Green display - trusted extraction
 * - MEDIUM (70-84%): Amber display - optional review recommended
 * - LOW (< 70%): Red display - auto-flagged for mandatory review
 *
 * Note: For flagging logic (auto-flag, optional review, trusted),
 * use the functions from '@/app/features/documents/lib/constants'
 */
export const CONFIDENCE_THRESHOLDS = CONFIDENCE_DISPLAY_THRESHOLDS;

interface ConfidenceLevel {
  label: string;
  description: string;
  Icon: typeof CheckCircle;
  gradient: string;
  iconColor: string;
  textColor: string;
  bgColor: string;
  badgeVariant: 'success' | 'warning' | 'destructive';
}

const getConfidenceLevel = (percent: number): ConfidenceLevel => {
  if (percent >= CONFIDENCE_THRESHOLDS.HIGH) {
    return {
      label: 'High Confidence',
      description: 'Extraction is highly reliable. Manual verification is optional but recommended for critical fields.',
      Icon: CheckCircle,
      gradient: 'bg-gradient-to-r from-green-400 to-green-600',
      iconColor: 'text-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-100',
      badgeVariant: 'success',
    };
  } else if (percent >= CONFIDENCE_THRESHOLDS.MEDIUM) {
    return {
      label: 'Medium Confidence',
      description: 'Extraction may require review. Consider verifying against the source document before proceeding.',
      Icon: AlertTriangle,
      gradient: 'bg-gradient-to-r from-amber-400 to-amber-600',
      iconColor: 'text-amber-500',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-100',
      badgeVariant: 'warning',
    };
  } else {
    return {
      label: 'Low Confidence',
      description: 'Manual verification required. The extracted value may be inaccurate or incomplete.',
      Icon: AlertCircle,
      gradient: 'bg-gradient-to-r from-red-400 to-red-600',
      iconColor: 'text-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-100',
      badgeVariant: 'destructive',
    };
  }
};

// Helper to get confidence level name for data attributes
const getConfidenceLevelName = (percent: number): 'high' | 'medium' | 'low' => {
  if (percent >= CONFIDENCE_THRESHOLDS.HIGH) return 'high';
  if (percent >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'medium';
  return 'low';
};

interface ConfidenceProps {
  /** Confidence value between 0 and 1 */
  value: number;
  /** Display variant - badge for compact inline display, bar for detailed progress bar */
  variant?: 'badge' | 'bar';
  /** Show the confidence level label (only for bar variant) */
  showLabel?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Unified confidence display component with consistent threshold logic.
 *
 * @example
 * // Badge variant - compact inline display
 * <Confidence value={0.85} variant="badge" />
 *
 * @example
 * // Bar variant - detailed progress bar with tooltip
 * <Confidence value={0.85} variant="bar" showLabel />
 */
export const Confidence = memo(function Confidence({
  value,
  variant = 'badge',
  showLabel = false,
  className,
}: ConfidenceProps) {
  const percent = Math.round(value * 100);
  const confidenceLevel = getConfidenceLevel(percent);

  if (variant === 'badge') {
    return (
      <Badge
        variant={confidenceLevel.badgeVariant}
        className={cn('text-xs transition-transform hover:scale-105', className)}
        data-testid="confidence-badge"
        data-confidence-level={getConfidenceLevelName(percent)}
      >
        {percent}% confidence
      </Badge>
    );
  }

  // Bar variant
  const { label, description, Icon, gradient, iconColor, textColor, bgColor } = confidenceLevel;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div
            className={cn('group flex items-center gap-2 cursor-help', className)}
            data-testid="confidence-indicator"
            data-confidence-level={getConfidenceLevelName(percent)}
          >
            <Icon
              className={cn(
                'w-4 h-4 flex-shrink-0 transition-transform duration-200',
                'group-hover:scale-110',
                iconColor
              )}
              data-testid="confidence-icon"
            />
            <div className="w-16 h-2 bg-zinc-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  'group-hover:shadow-sm',
                  gradient
                )}
                style={{ width: `${percent}%` }}
                data-testid="confidence-bar"
              />
            </div>
            <span
              className={cn(
                'text-xs font-semibold transition-colors duration-200',
                'group-hover:brightness-90',
                textColor
              )}
              data-testid="confidence-percentage"
            >
              {percent}%
            </span>
            {showLabel && (
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full transition-colors duration-200',
                  bgColor,
                  textColor
                )}
                data-testid="confidence-label"
              >
                {label}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs"
          data-testid="confidence-tooltip"
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Icon className={cn('w-4 h-4', iconColor)} />
              <span className="font-semibold">{label}</span>
              <span className={cn('text-xs font-medium', textColor)}>({percent}%)</span>
            </div>
            <p className="text-sm text-zinc-600 leading-relaxed">
              {description}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

// Named exports for backward compatibility
export const ConfidenceBadge = memo(function ConfidenceBadge({ value }: { value: number }) {
  return <Confidence value={value} variant="badge" />;
});

export const ConfidenceIndicator = memo(function ConfidenceIndicator({
  value,
  showLabel = false,
}: {
  value: number;
  showLabel?: boolean;
}) {
  return <Confidence value={value} variant="bar" showLabel={showLabel} />;
});
