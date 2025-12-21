'use client';

import React, { memo } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CompactListItemMetadata {
  label: string;
  value: React.ReactNode;
}

interface CompactListItemProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  metadata?: CompactListItemMetadata[];
  status?: 'success' | 'warning' | 'error' | 'neutral';
  actions?: React.ReactNode;
  onClick?: () => void;
  selected?: boolean;
  size?: 'sm' | 'md';
  showChevron?: boolean;
  className?: string;
}

const statusColors = {
  success: 'border-l-green-500',
  warning: 'border-l-yellow-500',
  error: 'border-l-red-500',
  neutral: 'border-l-zinc-300',
};

const statusDotColors = {
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
  neutral: 'bg-zinc-400',
};

export const CompactListItem = memo(function CompactListItem({
  icon,
  title,
  subtitle,
  metadata,
  status,
  actions,
  onClick,
  selected = false,
  size = 'md',
  showChevron = true,
  className,
}: CompactListItemProps) {
  const isClickable = Boolean(onClick);

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 border-b border-zinc-100 transition-colors',
        size === 'sm' ? 'py-2 min-h-[40px]' : 'py-2.5 min-h-[48px]',
        status && `border-l-2 ${statusColors[status]}`,
        isClickable && 'cursor-pointer hover:bg-zinc-50',
        selected && 'bg-blue-50 hover:bg-blue-50',
        className
      )}
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
    >
      {/* Icon */}
      {icon && (
        <div
          className={cn(
            'shrink-0 rounded-lg bg-zinc-100 flex items-center justify-center',
            size === 'sm' ? 'w-7 h-7 p-1' : 'w-8 h-8 p-1.5'
          )}
        >
          {icon}
        </div>
      )}

      {/* Status dot (if no icon and has status) */}
      {!icon && status && (
        <div className={cn('w-2 h-2 rounded-full shrink-0', statusDotColors[status])} />
      )}

      {/* Title and subtitle */}
      <div className="flex-1 min-w-0">
        <p className={cn('font-medium truncate', size === 'sm' ? 'text-sm' : 'text-sm')}>
          {title}
        </p>
        {subtitle && (
          <p className="text-xs text-zinc-500 truncate">{subtitle}</p>
        )}
      </div>

      {/* Metadata */}
      {metadata && metadata.length > 0 && (
        <div className="hidden sm:flex items-center gap-4 shrink-0">
          {metadata.map((meta, idx) => (
            <div key={idx} className="text-right">
              <p className="text-[10px] text-zinc-400 uppercase tracking-wide">{meta.label}</p>
              <div className="text-sm text-zinc-700">{meta.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {actions && <div className="shrink-0 flex items-center gap-1">{actions}</div>}

      {/* Chevron */}
      {isClickable && showChevron && !actions && (
        <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
      )}
    </div>
  );
});
