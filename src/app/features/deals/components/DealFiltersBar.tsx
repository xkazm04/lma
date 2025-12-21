'use client';

import React, { memo, useState } from 'react';
import { Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, Grid, List, X, Kanban, CalendarDays, Inbox } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { DealSortState, DealSortField } from '../lib/sort-types';
import { SORT_FIELD_LABELS, DEFAULT_SORT_STATE } from '../lib/sort-types';

export type ViewMode = 'grid' | 'list' | 'kanban' | 'timeline' | 'inbox';

interface DealFiltersBarProps {
  searchQuery: string;
  statusFilter: string;
  typeFilter: string;
  viewMode: ViewMode;
  statusCounts: Record<string, number>;
  sortState: DealSortState;
  onSearchChange: (query: string) => void;
  onStatusChange: (status: string) => void;
  onTypeChange: (type: string) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onSort: (field: DealSortField, isShiftHeld: boolean) => void;
}

export const DealFiltersBar = memo(function DealFiltersBar({
  searchQuery,
  statusFilter,
  typeFilter,
  viewMode,
  statusCounts,
  sortState,
  onSearchChange,
  onStatusChange,
  onTypeChange,
  onViewModeChange,
  onSort,
}: DealFiltersBarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const hasCustomSort =
    sortState.primary.field !== DEFAULT_SORT_STATE.primary.field ||
    sortState.primary.direction !== DEFAULT_SORT_STATE.primary.direction ||
    sortState.secondary !== null;

  const handleSortFieldClick = (field: DealSortField, e: React.MouseEvent) => {
    onSort(field, e.shiftKey);
    if (!e.shiftKey) {
      setIsDropdownOpen(false);
    }
  };

  const getSortLabel = () => {
    const primaryLabel = SORT_FIELD_LABELS[sortState.primary.field];
    const dirIcon = sortState.primary.direction === 'asc' ? '↑' : '↓';
    if (sortState.secondary) {
      const secondaryLabel = SORT_FIELD_LABELS[sortState.secondary.field];
      const secondaryDir = sortState.secondary.direction === 'asc' ? '↑' : '↓';
      return `${primaryLabel} ${dirIcon}, ${secondaryLabel} ${secondaryDir}`;
    }
    return `${primaryLabel} ${dirIcon}`;
  };

  return (
    <Card className="animate-in fade-in slide-in-from-top-4 duration-500 delay-100">
      <CardContent className="py-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Search deals..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
              data-testid="deals-search-input"
            />
          </div>

          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="w-40" data-testid="deals-status-filter">
              <Filter className="w-4 h-4 mr-2 text-zinc-400" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status ({statusCounts.all})</SelectItem>
              <SelectItem value="draft">Draft ({statusCounts.draft})</SelectItem>
              <SelectItem value="active">Active ({statusCounts.active})</SelectItem>
              <SelectItem value="paused">Paused ({statusCounts.paused})</SelectItem>
              <SelectItem value="agreed">Agreed ({statusCounts.agreed})</SelectItem>
              <SelectItem value="closed">Closed ({statusCounts.closed})</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={onTypeChange}>
            <SelectTrigger className="w-48" data-testid="deals-type-filter">
              <SelectValue placeholder="Deal Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="new_facility">New Facility</SelectItem>
              <SelectItem value="amendment">Amendment</SelectItem>
              <SelectItem value="refinancing">Refinancing</SelectItem>
              <SelectItem value="extension">Extension</SelectItem>
              <SelectItem value="consent">Consent</SelectItem>
              <SelectItem value="waiver">Waiver</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant={hasCustomSort ? 'default' : 'outline'}
                className={hasCustomSort ? 'gap-2' : ''}
                data-testid="deals-sort-btn"
              >
                {hasCustomSort ? (
                  <>
                    {sortState.primary.direction === 'asc' ? (
                      <ArrowUp className="w-4 h-4" />
                    ) : (
                      <ArrowDown className="w-4 h-4" />
                    )}
                    <span className="text-xs max-w-[120px] truncate">{getSortLabel()}</span>
                  </>
                ) : (
                  <ArrowUpDown className="w-4 h-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-xs font-medium text-zinc-500">
                Sort by (hold Shift for secondary)
              </div>
              {(Object.keys(SORT_FIELD_LABELS) as DealSortField[]).map((field) => {
                const isPrimary = sortState.primary.field === field;
                const isSecondary = sortState.secondary?.field === field;
                const direction = isPrimary
                  ? sortState.primary.direction
                  : isSecondary
                    ? sortState.secondary?.direction
                    : null;

                return (
                  <DropdownMenuItem
                    key={field}
                    onClick={(e) => handleSortFieldClick(field, e)}
                    className="flex items-center justify-between cursor-pointer"
                    data-testid={`deals-sort-option-${field}`}
                  >
                    <span>{SORT_FIELD_LABELS[field]}</span>
                    <div className="flex items-center gap-1">
                      {isPrimary && (
                        <span className="text-[10px] text-blue-600 font-medium">1st</span>
                      )}
                      {isSecondary && (
                        <span className="text-[10px] text-blue-500 font-medium">2nd</span>
                      )}
                      {direction === 'asc' && <ArrowUp className="w-3.5 h-3.5 text-blue-600" />}
                      {direction === 'desc' && <ArrowDown className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                  </DropdownMenuItem>
                );
              })}
              {hasCustomSort && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      onSort('created_at', false);
                      setIsDropdownOpen(false);
                    }}
                    className="text-zinc-500"
                    data-testid="deals-sort-clear"
                  >
                    <X className="w-3.5 h-3.5 mr-2" />
                    Reset to default
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <TooltipProvider>
            <Tabs value={viewMode} onValueChange={(v) => onViewModeChange(v as ViewMode)}>
              <TabsList>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="inbox" data-testid="deals-view-inbox-btn">
                      <Inbox className="w-4 h-4" />
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Smart Inbox</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="grid" data-testid="deals-view-grid-btn">
                      <Grid className="w-4 h-4" />
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Grid View</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="list" data-testid="deals-view-list-btn">
                      <List className="w-4 h-4" />
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent>List View</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="kanban" data-testid="deals-view-kanban-btn">
                      <Kanban className="w-4 h-4" />
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Kanban Board</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="timeline" data-testid="deals-view-timeline-btn">
                      <CalendarDays className="w-4 h-4" />
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Timeline View</TooltipContent>
                </Tooltip>
              </TabsList>
            </Tabs>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
});
