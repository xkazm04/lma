'use client';

import React, { memo } from 'react';
import { Search, Filter, Grid, List, SortAsc } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  return (
    <Card className="animate-in fade-in slide-in-from-top-2 duration-300">
      <CardContent className="py-2.5">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 transition-shadow focus:shadow-md"
              data-testid="document-search-input"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(v) => onStatusChange(v as DocumentStatusFilter)}>
            <SelectTrigger className="w-40 transition-shadow hover:shadow-sm" data-testid="status-filter-trigger">
              <Filter className="w-4 h-4 mr-2 text-zinc-400" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_STATUS_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  data-testid={`status-filter-${option.value.replace('_', '-')}`}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={(v) => onTypeChange(v as DocumentTypeFilter)}>
            <SelectTrigger className="w-48 transition-shadow hover:shadow-sm" data-testid="type-filter-trigger">
              <SelectValue placeholder="Document Type" />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPE_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  data-testid={`type-filter-${option.value.replace('_', '-')}`}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Button variant="outline" size="icon" className="transition-transform hover:scale-105" data-testid="sort-btn">
            <SortAsc className="w-4 h-4" />
          </Button>

          {/* View Toggle */}
          <Tabs value={viewMode} onValueChange={(v) => onViewModeChange(v as DocumentViewMode)}>
            <TabsList>
              <TabsTrigger value="grid" className="transition-colors" data-testid="view-mode-grid-btn">
                <Grid className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="list" className="transition-colors" data-testid="view-mode-list-btn">
                <List className="w-4 h-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
});
