'use client';

import React, { memo, useState, useCallback } from 'react';
import {
  Library,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  Filter,
  Check,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  GripVertical,
  BookOpen,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useClauseLibrary } from '../hooks/useClauseLibrary';
import type {
  ClauseTemplate,
  ClauseCategory,
  ClauseFavor,
  ClauseSource,
} from '../lib/clause-library-types';
import {
  CLAUSE_CATEGORY_CONFIG,
  CLAUSE_FAVOR_CONFIG,
  CLAUSE_SOURCE_CONFIG,
} from '../lib/clause-library-types';

interface ClauseLibraryPanelProps {
  className?: string;
}

export const ClauseLibraryPanel = memo(function ClauseLibraryPanel({
  className,
}: ClauseLibraryPanelProps) {
  const {
    filteredClauses,
    clausesByCategory,
    selectedClause,
    config,
    filters,
    expandedCategories,
    draggingClauseId,
    setFilters,
    clearFilters,
    selectClause,
    toggleCategory,
    togglePanel,
    startDragging,
    stopDragging,
  } = useClauseLibrary();

  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ searchQuery: e.target.value });
  }, [setFilters]);

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.favor.length > 0 ||
    filters.sources.length > 0 ||
    filters.approvedOnly;

  if (!config.showPanel) return null;

  return (
    <div
      className={cn(
        'w-80 flex-shrink-0 flex flex-col bg-white border-l border-zinc-200 h-full overflow-hidden',
        className
      )}
      data-testid="clause-library-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center gap-2">
          <Library className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-zinc-900">Clause Library</h3>
          <Badge variant="secondary" className="text-xs">
            {filteredClauses.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={togglePanel}
          data-testid="close-clause-library-btn"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-zinc-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            type="text"
            placeholder="Search clauses..."
            value={filters.searchQuery}
            onChange={handleSearchChange}
            className="pl-9 pr-8 h-9"
            data-testid="clause-search-input"
          />
          {filters.searchQuery && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              onClick={() => setFilters({ searchQuery: '' })}
              data-testid="clear-search-btn"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center justify-between mt-2">
          <button
            className={cn(
              'flex items-center gap-1.5 text-xs',
              hasActiveFilters ? 'text-indigo-600' : 'text-zinc-500',
              'hover:text-indigo-600 transition-colors'
            )}
            onClick={() => setShowFilters(!showFilters)}
            data-testid="toggle-filters-btn"
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
            {hasActiveFilters && (
              <Badge variant="default" className="h-4 px-1 text-[10px] bg-indigo-600">
                {filters.categories.length + filters.favor.length + filters.sources.length + (filters.approvedOnly ? 1 : 0)}
              </Badge>
            )}
          </button>
          {hasActiveFilters && (
            <button
              className="text-xs text-zinc-500 hover:text-zinc-700"
              onClick={clearFilters}
              data-testid="clear-filters-btn"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50/50 space-y-3">
          {/* Favor Filter */}
          <FilterSection title="Favored Party">
            <div className="flex flex-wrap gap-1">
              {(['lender', 'borrower', 'neutral'] as ClauseFavor[]).map((favor) => (
                <FilterChip
                  key={favor}
                  label={CLAUSE_FAVOR_CONFIG[favor].label.split('-')[0]}
                  active={filters.favor.includes(favor)}
                  onClick={() => {
                    const newFavor = filters.favor.includes(favor)
                      ? filters.favor.filter((f) => f !== favor)
                      : [...filters.favor, favor];
                    setFilters({ favor: newFavor });
                  }}
                  icon={
                    favor === 'lender' ? TrendingDown :
                    favor === 'borrower' ? TrendingUp :
                    Minus
                  }
                  testId={`filter-favor-${favor}`}
                />
              ))}
            </div>
          </FilterSection>

          {/* Source Filter */}
          <FilterSection title="Source">
            <div className="flex flex-wrap gap-1">
              {(['lsta_standard', 'market_standard', 'custom', 'negotiated'] as ClauseSource[]).map((source) => (
                <FilterChip
                  key={source}
                  label={CLAUSE_SOURCE_CONFIG[source].label}
                  active={filters.sources.includes(source)}
                  onClick={() => {
                    const newSources = filters.sources.includes(source)
                      ? filters.sources.filter((s) => s !== source)
                      : [...filters.sources, source];
                    setFilters({ sources: newSources });
                  }}
                  testId={`filter-source-${source}`}
                />
              ))}
            </div>
          </FilterSection>

          {/* Approved Only */}
          <div className="flex items-center gap-2">
            <button
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors',
                filters.approvedOnly
                  ? 'bg-green-100 text-green-700'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              )}
              onClick={() => setFilters({ approvedOnly: !filters.approvedOnly })}
              data-testid="filter-approved-only"
            >
              <Star className="w-3 h-3" />
              Approved Only
              {filters.approvedOnly && <Check className="w-3 h-3" />}
            </button>
          </div>
        </div>
      )}

      {/* Clause List */}
      <div className="flex-1 overflow-y-auto">
        {Array.from(clausesByCategory.entries()).map(([category, clauses]) => (
          <CategorySection
            key={category}
            category={category}
            clauses={clauses}
            isExpanded={expandedCategories.includes(category)}
            onToggle={() => toggleCategory(category)}
            selectedClauseId={selectedClause?.id || null}
            onSelectClause={selectClause}
            onStartDragging={startDragging}
            onStopDragging={stopDragging}
            draggingClauseId={draggingClauseId}
          />
        ))}

        {filteredClauses.length === 0 && (
          <div className="p-8 text-center text-zinc-500">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No clauses match your filters</p>
          </div>
        )}
      </div>

      {/* Selected Clause Preview */}
      {selectedClause && (
        <ClausePreview
          clause={selectedClause}
          onClose={() => selectClause(null)}
        />
      )}
    </div>
  );
});

// ============================================
// Sub-Components
// ============================================

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
}

const FilterSection = memo(function FilterSection({
  title,
  children,
}: FilterSectionProps) {
  return (
    <div>
      <div className="text-xs font-medium text-zinc-500 mb-1">{title}</div>
      {children}
    </div>
  );
});

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  testId: string;
}

const FilterChip = memo(function FilterChip({
  label,
  active,
  onClick,
  icon: Icon,
  testId,
}: FilterChipProps) {
  return (
    <button
      className={cn(
        'flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors',
        active
          ? 'bg-indigo-100 text-indigo-700'
          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
      )}
      onClick={onClick}
      data-testid={testId}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </button>
  );
});

interface CategorySectionProps {
  category: ClauseCategory;
  clauses: ClauseTemplate[];
  isExpanded: boolean;
  onToggle: () => void;
  selectedClauseId: string | null;
  onSelectClause: (id: string | null) => void;
  onStartDragging: (id: string) => void;
  onStopDragging: () => void;
  draggingClauseId: string | null;
}

const CategorySection = memo(function CategorySection({
  category,
  clauses,
  isExpanded,
  onToggle,
  selectedClauseId,
  onSelectClause,
  onStartDragging,
  onStopDragging,
  draggingClauseId,
}: CategorySectionProps) {
  const config = CLAUSE_CATEGORY_CONFIG[category];

  return (
    <div className="border-b border-zinc-100" data-testid={`clause-category-${category}`}>
      <button
        className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-zinc-50 transition-colors"
        onClick={onToggle}
        data-testid={`toggle-category-${category}`}
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-zinc-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-zinc-400" />
        )}
        <span className={cn('font-medium text-sm', config.color)}>
          {config.label}
        </span>
        <Badge variant="secondary" className="ml-auto text-xs">
          {clauses.length}
        </Badge>
      </button>

      {isExpanded && (
        <div className="pb-2">
          {clauses.map((clause) => (
            <ClauseItem
              key={clause.id}
              clause={clause}
              isSelected={selectedClauseId === clause.id}
              isDragging={draggingClauseId === clause.id}
              onSelect={() => onSelectClause(clause.id)}
              onStartDragging={() => onStartDragging(clause.id)}
              onStopDragging={onStopDragging}
            />
          ))}
        </div>
      )}
    </div>
  );
});

interface ClauseItemProps {
  clause: ClauseTemplate;
  isSelected: boolean;
  isDragging: boolean;
  onSelect: () => void;
  onStartDragging: () => void;
  onStopDragging: () => void;
}

const ClauseItem = memo(function ClauseItem({
  clause,
  isSelected,
  isDragging,
  onSelect,
  onStartDragging,
  onStopDragging,
}: ClauseItemProps) {
  const favorConfig = CLAUSE_FAVOR_CONFIG[clause.favor];
  const FavorIcon = clause.favor === 'lender' ? TrendingDown : clause.favor === 'borrower' ? TrendingUp : Minus;

  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', clause.id);
    e.dataTransfer.effectAllowed = 'copy';
    onStartDragging();
  }, [clause.id, onStartDragging]);

  const handleDragEnd = useCallback(() => {
    onStopDragging();
  }, [onStopDragging]);

  return (
    <div
      className={cn(
        'mx-2 mb-1 p-2 rounded border cursor-pointer transition-all',
        isSelected
          ? 'border-indigo-300 bg-indigo-50'
          : 'border-transparent hover:border-zinc-200 hover:bg-zinc-50',
        isDragging && 'opacity-50 border-dashed border-indigo-400'
      )}
      onClick={onSelect}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      data-testid={`clause-item-${clause.id}`}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5 text-zinc-400 cursor-grab hover:text-zinc-600">
          <GripVertical className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-zinc-800 truncate">
              {clause.name}
            </span>
            {clause.isApproved && (
              <Star className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant="secondary"
              className={cn('text-[10px] h-4 px-1', favorConfig.bgColor, favorConfig.color)}
            >
              <FavorIcon className="w-2.5 h-2.5 mr-0.5" />
              {clause.favor}
            </Badge>
            <span className="text-[10px] text-zinc-400 truncate">
              {CLAUSE_SOURCE_CONFIG[clause.source].label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

interface ClausePreviewProps {
  clause: ClauseTemplate;
  onClose: () => void;
}

const ClausePreview = memo(function ClausePreview({
  clause,
  onClose,
}: ClausePreviewProps) {
  const favorConfig = CLAUSE_FAVOR_CONFIG[clause.favor];
  const FavorIcon = clause.favor === 'lender' ? TrendingDown : clause.favor === 'borrower' ? TrendingUp : Minus;

  return (
    <div
      className="border-t border-zinc-200 bg-zinc-50 p-4 max-h-64 overflow-y-auto"
      data-testid="clause-preview"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-semibold text-zinc-900">{clause.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant="secondary"
              className={cn('text-xs', favorConfig.bgColor, favorConfig.color)}
            >
              <FavorIcon className="w-3 h-3 mr-1" />
              {favorConfig.label}
            </Badge>
            <span className="text-xs text-zinc-500">
              {CLAUSE_SOURCE_CONFIG[clause.source].label}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onClose}
          data-testid="close-preview-btn"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <p className="text-xs text-zinc-600 mb-3">{clause.description}</p>

      <div className="bg-white border border-zinc-200 rounded p-3">
        <p className="text-xs text-zinc-800 leading-relaxed whitespace-pre-wrap">
          {clause.text}
        </p>
      </div>

      {clause.legalNotes && (
        <div className="mt-3 p-2 bg-amber-50 rounded border border-amber-200">
          <div className="flex items-center gap-1 text-xs font-medium text-amber-700 mb-1">
            <FileText className="w-3 h-3" />
            Legal Notes
          </div>
          <p className="text-xs text-amber-800">{clause.legalNotes}</p>
        </div>
      )}

      {clause.negotiationPoints && clause.negotiationPoints.length > 0 && (
        <div className="mt-3">
          <div className="text-xs font-medium text-zinc-700 mb-1">Negotiation Points:</div>
          <ul className="text-xs text-zinc-600 space-y-0.5">
            {clause.negotiationPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-1">
                <span className="text-zinc-400">•</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
        <span>Used {clause.usageCount} times</span>
        {clause.lastUsedAt && (
          <span>Last: {new Date(clause.lastUsedAt).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
});
