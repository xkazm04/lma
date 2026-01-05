'use client';

import React from 'react';
import { Search, Filter, X, RotateCcw, Eye, EyeOff, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type {
  GraphFilterOptions,
  GraphVisualizationSettings,
  CrossRefNodeType,
  CrossRefCategory,
  CrossRefLinkType,
} from '../lib/types';
import {
  NODE_TYPE_LABELS,
  CATEGORY_LABELS,
  LINK_TYPE_LABELS,
  NODE_TYPE_COLORS,
  CATEGORY_COLORS,
  DEFAULT_FILTER_OPTIONS,
} from '../lib/types';

interface GraphFilterBarProps {
  filters: GraphFilterOptions;
  settings: GraphVisualizationSettings;
  onFiltersChange: (filters: Partial<GraphFilterOptions>) => void;
  onSettingsChange: (settings: Partial<GraphVisualizationSettings>) => void;
  onResetFilters: () => void;
  totalNodes: number;
  filteredNodes: number;
}

/**
 * Filter bar for the cross-reference graph
 */
export function GraphFilterBar({
  filters,
  settings,
  onFiltersChange,
  onSettingsChange,
  onResetFilters,
  totalNodes,
  filteredNodes,
}: GraphFilterBarProps) {
  const hasActiveFilters =
    filters.showOnlyModified ||
    filters.showOnlyHighImpact ||
    filters.searchQuery.length > 0 ||
    filters.minConnections > 0 ||
    filters.nodeTypes.length < Object.keys(NODE_TYPE_LABELS).length ||
    filters.categories.length < Object.keys(CATEGORY_LABELS).length ||
    filters.linkTypes.length < Object.keys(LINK_TYPE_LABELS).length;

  const toggleNodeType = (type: CrossRefNodeType) => {
    const newTypes = filters.nodeTypes.includes(type)
      ? filters.nodeTypes.filter(t => t !== type)
      : [...filters.nodeTypes, type];
    onFiltersChange({ nodeTypes: newTypes });
  };

  const toggleCategory = (category: CrossRefCategory) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    onFiltersChange({ categories: newCategories });
  };

  const toggleLinkType = (type: CrossRefLinkType) => {
    const newTypes = filters.linkTypes.includes(type)
      ? filters.linkTypes.filter(t => t !== type)
      : [...filters.linkTypes, type];
    onFiltersChange({ linkTypes: newTypes });
  };

  return (
    <div
      className="flex items-center gap-2 p-3 bg-white border-b border-zinc-200"
      data-testid="graph-filter-bar"
    >
      {/* Search */}
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <Input
          type="text"
          placeholder="Search terms..."
          value={filters.searchQuery}
          onChange={(e) => onFiltersChange({ searchQuery: e.target.value })}
          className="pl-8 h-8 text-sm"
          data-testid="graph-search-input"
        />
        {filters.searchQuery && (
          <button
            onClick={() => onFiltersChange({ searchQuery: '' })}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            data-testid="clear-search-btn"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Node Types Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8" data-testid="node-types-filter-btn">
            <Filter className="w-3 h-3 mr-1" />
            Types
            {filters.nodeTypes.length < Object.keys(NODE_TYPE_LABELS).length && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                {filters.nodeTypes.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Node Types</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(Object.keys(NODE_TYPE_LABELS) as CrossRefNodeType[]).map(type => (
            <DropdownMenuCheckboxItem
              key={type}
              checked={filters.nodeTypes.includes(type)}
              onCheckedChange={() => toggleNodeType(type)}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: NODE_TYPE_COLORS[type] }}
                />
                {NODE_TYPE_LABELS[type]}
              </div>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Categories Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8" data-testid="categories-filter-btn">
            Categories
            {filters.categories.length < Object.keys(CATEGORY_LABELS).length && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                {filters.categories.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Categories</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(Object.keys(CATEGORY_LABELS) as CrossRefCategory[]).map(category => (
            <DropdownMenuCheckboxItem
              key={category}
              checked={filters.categories.includes(category)}
              onCheckedChange={() => toggleCategory(category)}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[category] }}
                />
                {CATEGORY_LABELS[category]}
              </div>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Link Types Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8" data-testid="link-types-filter-btn">
            Links
            {filters.linkTypes.length < Object.keys(LINK_TYPE_LABELS).length && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                {filters.linkTypes.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Link Types</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(Object.keys(LINK_TYPE_LABELS) as CrossRefLinkType[]).map(type => (
            <DropdownMenuCheckboxItem
              key={type}
              checked={filters.linkTypes.includes(type)}
              onCheckedChange={() => toggleLinkType(type)}
            >
              {LINK_TYPE_LABELS[type]}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Quick Filters */}
      <div className="flex items-center gap-1 border-l border-zinc-200 pl-2">
        <Button
          variant={filters.showOnlyModified ? 'default' : 'ghost'}
          size="sm"
          className="h-8"
          onClick={() => onFiltersChange({ showOnlyModified: !filters.showOnlyModified })}
          data-testid="modified-only-btn"
        >
          <Zap className="w-3 h-3 mr-1" />
          Modified
        </Button>
        <Button
          variant={filters.showOnlyHighImpact ? 'default' : 'ghost'}
          size="sm"
          className="h-8"
          onClick={() => onFiltersChange({ showOnlyHighImpact: !filters.showOnlyHighImpact })}
          data-testid="high-impact-btn"
        >
          High Impact
        </Button>
      </div>

      {/* View Settings */}
      <div className="flex items-center gap-1 border-l border-zinc-200 pl-2">
        <Button
          variant={settings.showLabels ? 'default' : 'ghost'}
          size="sm"
          className="h-8"
          onClick={() => onSettingsChange({ showLabels: !settings.showLabels })}
          data-testid="toggle-labels-btn"
        >
          {settings.showLabels ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
        </Button>
      </div>

      {/* Results & Reset */}
      <div className="flex items-center gap-2 ml-auto">
        <span className="text-xs text-zinc-500">
          {filteredNodes} of {totalNodes} terms
        </span>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={onResetFilters}
            data-testid="reset-filters-btn"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
