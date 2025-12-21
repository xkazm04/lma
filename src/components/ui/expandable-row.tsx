'use client';

import React, { memo, useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Severity configuration for left border colors
export const severityStyles = {
  critical: {
    border: 'border-l-red-600',
    bg: 'bg-red-50',
    icon: 'text-red-700',
  },
  high: {
    border: 'border-l-orange-500',
    bg: 'bg-orange-50',
    icon: 'text-orange-700',
  },
  medium: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-50',
    icon: 'text-amber-700',
  },
  low: {
    border: 'border-l-blue-500',
    bg: 'bg-blue-50',
    icon: 'text-blue-700',
  },
  info: {
    border: 'border-l-zinc-400',
    bg: 'bg-zinc-50',
    icon: 'text-zinc-600',
  },
} as const;

export type Severity = keyof typeof severityStyles;

export interface ExpandableRowSection {
  /** Section label (uppercase, small text) */
  label: string;
  /** Section content */
  content: React.ReactNode;
  /** Only show if condition is true */
  show?: boolean;
}

export interface ExpandableRowProps<T> {
  /** The data item */
  item: T;
  /** Unique identifier for the row */
  id: string;
  /** Icon component to show on the left */
  icon?: LucideIcon;
  /** Main title/name text */
  title: string;
  /** Badges/tags to show in the summary row */
  badges?: Array<{
    label: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  }>;
  /** Severity level for left border color */
  severity?: Severity;
  /** Confidence percentage (0-100) */
  confidence?: number;
  /** Sections to show when expanded */
  sections: ExpandableRowSection[];
  /** Action buttons for expanded view */
  actions?: React.ReactNode;
  /** Controlled expansion state */
  expanded?: boolean;
  /** Callback when expansion changes */
  onExpandChange?: (expanded: boolean) => void;
  /** Additional className for the container */
  className?: string;
  /** Test ID prefix */
  testId?: string;
}

function ExpandableRowInner<T>({
  item,
  id,
  icon: Icon,
  title,
  badges = [],
  severity = 'info',
  confidence,
  sections,
  actions,
  expanded: controlledExpanded,
  onExpandChange,
  className,
  testId,
}: ExpandableRowProps<T>) {
  const [internalExpanded, setInternalExpanded] = useState(false);

  // Support both controlled and uncontrolled modes
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggle = useCallback(() => {
    const newValue = !isExpanded;
    setInternalExpanded(newValue);
    onExpandChange?.(newValue);
  }, [isExpanded, onExpandChange]);

  const style = severityStyles[severity];
  const visibleSections = sections.filter(s => s.show !== false);

  return (
    <div
      className={cn(
        'border border-zinc-200 rounded-lg overflow-hidden border-l-4 transition-all duration-200',
        'bg-white hover:shadow-sm',
        style.border,
        className
      )}
      data-testid={testId ? `${testId}-${id}` : undefined}
    >
      {/* Summary Row - Always Visible */}
      <button
        type="button"
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50 transition-colors"
        onClick={handleToggle}
        aria-expanded={isExpanded}
        data-testid={testId ? `${testId}-toggle-${id}` : undefined}
      >
        {/* Icon */}
        {Icon && (
          <Icon className={cn('w-4 h-4 flex-shrink-0', style.icon)} />
        )}

        {/* Title */}
        <span className="flex-1 font-medium text-zinc-900 text-sm truncate">
          {title}
        </span>

        {/* Badges */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {badges.map((badge, idx) => (
            <Badge
              key={idx}
              variant={badge.variant || 'secondary'}
              className="text-xs px-1.5 py-0"
            >
              {badge.label}
            </Badge>
          ))}
        </div>

        {/* Confidence */}
        {confidence !== undefined && (
          <span className={cn(
            'text-xs font-medium px-1.5 py-0.5 rounded flex-shrink-0',
            confidence >= 80 ? 'bg-green-100 text-green-700' :
            confidence >= 60 ? 'bg-amber-100 text-amber-700' :
            'bg-red-100 text-red-700'
          )}>
            {confidence}%
          </span>
        )}

        {/* Chevron */}
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-zinc-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-400 flex-shrink-0" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && visibleSections.length > 0 && (
        <div
          className="px-4 pb-4 pt-2 border-t border-zinc-100 animate-in fade-in slide-in-from-top-2 duration-200"
          data-testid={testId ? `${testId}-details-${id}` : undefined}
        >
          {/* Sections */}
          <div className="space-y-3">
            {visibleSections.map((section, idx) => (
              <div key={idx}>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                  {section.label}
                </div>
                <div className="text-sm text-zinc-700">
                  {section.content}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          {actions && (
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-100">
              {actions}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const ExpandableRow = memo(ExpandableRowInner) as typeof ExpandableRowInner;

// Helper component for section with key-value pairs
export interface KeyValuePairProps {
  pairs: Array<{ label: string; value: React.ReactNode }>;
  columns?: 1 | 2 | 3;
}

export function KeyValueSection({ pairs, columns = 2 }: KeyValuePairProps) {
  return (
    <div className={cn(
      'grid gap-2',
      columns === 1 && 'grid-cols-1',
      columns === 2 && 'grid-cols-2',
      columns === 3 && 'grid-cols-3'
    )}>
      {pairs.map((pair, idx) => (
        <div key={idx} className="flex flex-col">
          <span className="text-xs text-zinc-500">{pair.label}</span>
          <span className="text-sm font-medium text-zinc-900">{pair.value}</span>
        </div>
      ))}
    </div>
  );
}

// Helper for recommendation/highlight boxes
export interface HighlightBoxProps {
  children: React.ReactNode;
  variant?: 'info' | 'warning' | 'success' | 'error';
}

export function HighlightBox({ children, variant = 'info' }: HighlightBoxProps) {
  const variantStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };

  return (
    <div className={cn(
      'px-3 py-2 rounded-md border text-sm',
      variantStyles[variant]
    )}>
      {children}
    </div>
  );
}
