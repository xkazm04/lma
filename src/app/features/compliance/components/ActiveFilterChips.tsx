'use client';

import React, { memo } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ComplianceFilters } from '../lib/useFilterPersistence';

interface ActiveFilter {
  key: keyof ComplianceFilters;
  value: string;
  label: string;
}

interface ActiveFilterChipsProps {
  activeFilters: ActiveFilter[];
  onRemoveFilter: (key: keyof ComplianceFilters) => void;
  onClearAll: () => void;
  className?: string;
}

export const ActiveFilterChips = memo(function ActiveFilterChips({
  activeFilters,
  onRemoveFilter,
  onClearAll,
  className,
}: ActiveFilterChipsProps) {
  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-top-1',
        className
      )}
      data-testid="active-filter-chips"
    >
      <span className="text-sm text-zinc-500">Active filters:</span>
      {activeFilters.map((filter) => (
        <Badge
          key={filter.key}
          variant="secondary"
          className="flex items-center gap-1.5 pr-1 hover:bg-zinc-200 transition-colors cursor-default group"
          data-testid={`filter-chip-${filter.key}`}
        >
          <span className="max-w-[200px] truncate">{filter.label}</span>
          <button
            onClick={() => onRemoveFilter(filter.key)}
            className="p-0.5 rounded-full hover:bg-zinc-300 transition-colors"
            aria-label={`Remove ${filter.label} filter`}
            data-testid={`remove-filter-${filter.key}`}
          >
            <X className="w-3 h-3 text-zinc-500 group-hover:text-zinc-700" />
          </button>
        </Badge>
      ))}
      {activeFilters.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-xs text-zinc-500 hover:text-zinc-700 h-6 px-2"
          data-testid="clear-all-filters-btn"
        >
          Clear all
        </Button>
      )}
    </div>
  );
});
