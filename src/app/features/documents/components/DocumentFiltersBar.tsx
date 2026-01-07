'use client';

import React, { memo, useMemo } from 'react';
import { Search, Filter, Grid, List, SortAsc, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { DOCUMENT_STATUS_OPTIONS, DOCUMENT_TYPE_OPTIONS } from '../lib/constants';
import type { DocumentStatusFilter, DocumentTypeFilter, DocumentViewMode } from '../lib/types';

interface DocumentFiltersBarProps {
  searchQuery: string;
  statusFilter: DocumentStatusFilter;
  typeFilter: DocumentTypeFilter;
  viewMode: DocumentViewMode;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: DocumentStatusFilter) => void;
  onTypeChange: (value: DocumentTypeFilter) => void;
  onViewModeChange: (value: DocumentViewMode) => void;
}

export const DocumentFiltersBar = memo(function DocumentFiltersBar({
  searchQuery,
  statusFilter,
  typeFilter,
  viewMode,
  onSearchChange,
  onStatusChange,
  onTypeChange,
  onViewModeChange,
}: DocumentFiltersBarProps) {
  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (typeFilter !== 'all') count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [statusFilter, typeFilter, searchQuery]);

  const hasActiveFilters = activeFilterCount > 0;

  const clearAllFilters = () => {
    onSearchChange('');
    onStatusChange('all');
    onTypeChange('all');
  };

  return (
    <div className="px-3 py-2 bg-white">
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cn(
              "pl-8 h-8 text-sm border-zinc-200 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-200",
              searchQuery && "border-blue-300 bg-blue-50/30"
            )}
            data-testid="document-search-input"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={(v) => onStatusChange(v as DocumentStatusFilter)}>
          <SelectTrigger
            className={cn(
              "w-32 h-8 text-xs border-zinc-200",
              statusFilter !== 'all' && "border-blue-300 bg-blue-50/30"
            )}
            data-testid="status-filter-trigger"
          >
            <Filter className="w-3 h-3 mr-1.5 text-zinc-400" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_STATUS_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="text-xs"
                data-testid={`status-filter-${option.value.replace('_', '-')}`}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type Filter */}
        <Select value={typeFilter} onValueChange={(v) => onTypeChange(v as DocumentTypeFilter)}>
          <SelectTrigger
            className={cn(
              "w-40 h-8 text-xs border-zinc-200",
              typeFilter !== 'all' && "border-blue-300 bg-blue-50/30"
            )}
            data-testid="type-filter-trigger"
          >
            <SelectValue placeholder="Document Type" />
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_TYPE_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="text-xs"
                data-testid={`type-filter-${option.value.replace('_', '-')}`}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Active Filters Badge */}
        {hasActiveFilters && (
          <Badge
            variant="secondary"
            className="h-6 px-2 text-[10px] gap-1 cursor-pointer hover:bg-zinc-200"
            onClick={clearAllFilters}
            data-testid="active-filters-badge"
          >
            {activeFilterCount} active
            <X className="w-2.5 h-2.5" />
          </Badge>
        )}

        {/* Sort */}
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-500 hover:text-zinc-700" data-testid="sort-btn">
          <SortAsc className="w-3.5 h-3.5" />
        </Button>

        {/* View Toggle */}
        <Tabs value={viewMode} onValueChange={(v) => onViewModeChange(v as DocumentViewMode)}>
          <TabsList className="h-8 p-0.5 bg-zinc-100">
            <TabsTrigger value="grid" className="h-7 px-2 text-xs" data-testid="view-mode-grid-btn">
              <Grid className="w-3.5 h-3.5" />
            </TabsTrigger>
            <TabsTrigger value="list" className="h-7 px-2 text-xs" data-testid="view-mode-list-btn">
              <List className="w-3.5 h-3.5" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
});
