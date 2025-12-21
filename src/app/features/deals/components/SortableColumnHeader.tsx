'use client';

import React, { memo } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DealSortField, DealSortState } from '../lib/sort-types';

interface SortableColumnHeaderProps {
  field: DealSortField;
  label: string;
  sortState: DealSortState;
  onSort: (field: DealSortField, isShiftHeld: boolean) => void;
  className?: string;
}

export const SortableColumnHeader = memo(function SortableColumnHeader({
  field,
  label,
  sortState,
  onSort,
  className,
}: SortableColumnHeaderProps) {
  const isPrimary = sortState.primary.field === field;
  const isSecondary = sortState.secondary?.field === field;
  const isActive = isPrimary || isSecondary;
  const direction = isPrimary
    ? sortState.primary.direction
    : isSecondary
      ? sortState.secondary?.direction
      : null;

  const handleClick = (e: React.MouseEvent) => {
    onSort(field, e.shiftKey);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSort(field, e.shiftKey);
    }
  };

  const getSortIcon = () => {
    if (!isActive) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }

    if (direction === 'asc') {
      return <ArrowUp className="w-3.5 h-3.5 text-blue-600" />;
    }

    return <ArrowDown className="w-3.5 h-3.5 text-blue-600" />;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'group flex items-center gap-1.5 text-left text-xs font-medium uppercase tracking-wide',
        'hover:text-zinc-900 transition-colors cursor-pointer select-none',
        isActive ? 'text-zinc-900' : 'text-zinc-500',
        className
      )}
      data-testid={`deals-sort-column-${field}`}
      aria-pressed={isActive}
      aria-label={`Sort by ${label}${isActive ? `, currently ${direction === 'asc' ? 'ascending' : 'descending'}` : ''}`}
      title={`Sort by ${label}${isActive ? '' : ' (hold Shift for secondary sort)'}`}
    >
      <span>{label}</span>
      {getSortIcon()}
      {isSecondary && (
        <span className="text-[10px] text-blue-500 font-normal normal-case ml-0.5">2nd</span>
      )}
    </button>
  );
});
