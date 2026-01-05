'use client';

import React, { memo, useState } from 'react';
import {
  Search,
  Plus,
  Minus,
  Edit3,
  X,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  AlertTriangle,
  ChevronDown,
  Sparkles,
  BarChart3,
  Zap,
  Save,
  type LucideIcon,
} from 'lucide-react';
import { ShortcutHint } from './ShortcutReferenceCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type {
  UnifiedFiltersState,
  ChangeTypeFilter,
} from '../hooks/useComparisonFilters';
import type {
  RiskFilterOption,
  MarketFilterOption,
  PartyFilterOption,
  ImpactFilterOption,
  LensPreset,
} from '../lib/lens-types';
import { LENS_PRESETS, DEFAULT_LENS_FILTERS } from '../lib/lens-types';
import { hasActiveLensFilters, describeLensFilters } from '../lib/lenses';

// Re-export types for convenience
export type { ChangeTypeFilter };
export type { UnifiedFiltersState as ComparisonFiltersState };

// ============================================
// Change Type Filter Configuration
// ============================================

const changeTypeButtons: Array<{
  type: ChangeTypeFilter;
  label: string;
  icon: LucideIcon;
  activeClass: string;
  hoverClass: string;
  shortcutKey: string;
}> = [
  {
    type: 'added',
    label: 'Added',
    icon: Plus,
    activeClass: 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200',
    hoverClass: 'hover:bg-green-50 hover:border-green-200',
    shortcutKey: '1',
  },
  {
    type: 'modified',
    label: 'Modified',
    icon: Edit3,
    activeClass: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200',
    hoverClass: 'hover:bg-blue-50 hover:border-blue-200',
    shortcutKey: '2',
  },
  {
    type: 'removed',
    label: 'Removed',
    icon: Minus,
    activeClass: 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200',
    hoverClass: 'hover:bg-red-50 hover:border-red-200',
    shortcutKey: '3',
  },
];

// ============================================
// Lens Filter Option Configurations
// ============================================

interface FilterOption<T extends string> {
  value: T;
  label: string;
  icon: LucideIcon;
  description?: string;
  color: string;
  activeClass: string;
}

const riskOptions: FilterOption<RiskFilterOption>[] = [
  {
    value: 'low',
    label: 'Low',
    icon: Target,
    description: 'Minimal risk (1-3)',
    color: 'text-green-600',
    activeClass: 'bg-green-100 text-green-700 border-green-300',
  },
  {
    value: 'medium',
    label: 'Medium',
    icon: AlertTriangle,
    description: 'Moderate risk (4-5)',
    color: 'text-amber-600',
    activeClass: 'bg-amber-100 text-amber-700 border-amber-300',
  },
  {
    value: 'high',
    label: 'High',
    icon: AlertTriangle,
    description: 'Significant risk (6-7)',
    color: 'text-orange-600',
    activeClass: 'bg-orange-100 text-orange-700 border-orange-300',
  },
  {
    value: 'critical',
    label: 'Critical',
    icon: ShieldAlert,
    description: 'Critical risk (8-10)',
    color: 'text-red-600',
    activeClass: 'bg-red-100 text-red-700 border-red-300',
  },
];

const marketOptions: FilterOption<MarketFilterOption>[] = [
  {
    value: 'below_market',
    label: 'Below Market',
    icon: TrendingDown,
    description: 'More favorable than typical',
    color: 'text-blue-600',
    activeClass: 'bg-blue-100 text-blue-700 border-blue-300',
  },
  {
    value: 'at_market',
    label: 'At Market',
    icon: Target,
    description: 'Aligned with market standards',
    color: 'text-green-600',
    activeClass: 'bg-green-100 text-green-700 border-green-300',
  },
  {
    value: 'above_market',
    label: 'Above Market',
    icon: TrendingUp,
    description: 'Exceeds typical market terms',
    color: 'text-amber-600',
    activeClass: 'bg-amber-100 text-amber-700 border-amber-300',
  },
  {
    value: 'deviates',
    label: 'Deviates',
    icon: Zap,
    description: 'Any deviation from standards',
    color: 'text-purple-600',
    activeClass: 'bg-purple-100 text-purple-700 border-purple-300',
  },
];

const partyOptions: FilterOption<PartyFilterOption>[] = [
  {
    value: 'borrower',
    label: 'Borrower',
    icon: TrendingUp,
    description: 'Favors the borrower',
    color: 'text-blue-600',
    activeClass: 'bg-blue-100 text-blue-700 border-blue-300',
  },
  {
    value: 'lender',
    label: 'Lender',
    icon: TrendingDown,
    description: 'Favors the lender',
    color: 'text-purple-600',
    activeClass: 'bg-purple-100 text-purple-700 border-purple-300',
  },
  {
    value: 'neutral',
    label: 'Neutral',
    icon: Minus,
    description: 'No clear beneficiary',
    color: 'text-zinc-600',
    activeClass: 'bg-zinc-100 text-zinc-700 border-zinc-300',
  },
];

const impactOptions: FilterOption<ImpactFilterOption>[] = [
  {
    value: 'low',
    label: 'Low',
    icon: Target,
    description: 'Minimal business impact',
    color: 'text-green-600',
    activeClass: 'bg-green-100 text-green-700 border-green-300',
  },
  {
    value: 'medium',
    label: 'Medium',
    icon: AlertTriangle,
    description: 'Moderate business impact',
    color: 'text-amber-600',
    activeClass: 'bg-amber-100 text-amber-700 border-amber-300',
  },
  {
    value: 'high',
    label: 'High',
    icon: AlertTriangle,
    description: 'Significant business impact',
    color: 'text-orange-600',
    activeClass: 'bg-orange-100 text-orange-700 border-orange-300',
  },
  {
    value: 'critical',
    label: 'Critical',
    icon: ShieldAlert,
    description: 'Critical business impact',
    color: 'text-red-600',
    activeClass: 'bg-red-100 text-red-700 border-red-300',
  },
];

// ============================================
// Sub-Components
// ============================================

interface FilterDropdownProps<T extends string> {
  label: string;
  icon: LucideIcon;
  options: FilterOption<T>[];
  selectedValues: T[];
  onChange: (values: T[]) => void;
  testIdPrefix: string;
}

function FilterDropdown<T extends string>({
  label,
  icon: Icon,
  options,
  selectedValues,
  onChange,
  testIdPrefix,
}: FilterDropdownProps<T>) {
  const [open, setOpen] = useState(false);

  const toggleValue = (value: T) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const hasSelection = selectedValues.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-8 gap-1.5 transition-all',
            hasSelection && 'bg-zinc-100 border-zinc-400'
          )}
          data-testid={`${testIdPrefix}-dropdown-btn`}
        >
          <Icon className="w-3.5 h-3.5" />
          {label}
          {hasSelection && (
            <Badge
              variant="secondary"
              className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-zinc-700 text-white"
            >
              {selectedValues.length}
            </Badge>
          )}
          <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-56 p-2"
        align="start"
        data-testid={`${testIdPrefix}-dropdown-content`}
      >
        <div className="space-y-1">
          {options.map((option) => {
            const OptionIcon = option.icon;
            const isSelected = selectedValues.includes(option.value);

            return (
              <button
                key={option.value}
                onClick={() => toggleValue(option.value)}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left',
                  isSelected
                    ? option.activeClass
                    : 'hover:bg-zinc-100 text-zinc-700'
                )}
                data-testid={`${testIdPrefix}-option-${option.value}`}
              >
                <OptionIcon
                  className={cn(
                    'w-4 h-4',
                    isSelected ? '' : option.color
                  )}
                />
                <div className="flex-1">
                  <span className="font-medium">{option.label}</span>
                  {option.description && (
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {option.description}
                    </p>
                  )}
                </div>
                {isSelected && (
                  <div className="w-4 h-4 rounded-full bg-current opacity-20 flex items-center justify-center">
                    <span className="text-xs font-bold">✓</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface PresetButtonProps {
  preset: LensPreset;
  isActive: boolean;
  onSelect: () => void;
}

const PresetButton = memo(function PresetButton({
  preset,
  isActive,
  onSelect,
}: PresetButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            onClick={onSelect}
            className={cn(
              'h-7 text-xs gap-1 transition-all',
              isActive && 'bg-indigo-600 hover:bg-indigo-700'
            )}
            data-testid={`preset-${preset.id}-btn`}
          >
            <Sparkles className="w-3 h-3" />
            {preset.name}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-sm">{preset.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

// ============================================
// Main Component
// ============================================

interface ComparisonFiltersProps {
  filters: UnifiedFiltersState;
  onFiltersChange: (filters: UnifiedFiltersState) => void;
  totalCount: number;
  filteredCount: number;
  /** Show lens filters section (requires risk analysis data) */
  showLensFilters?: boolean;
  /** Show presets panel for lens filters */
  showPresets?: boolean;
  /** Show keyboard shortcut hints on buttons */
  showShortcutHints?: boolean;
  className?: string;
}

export const ComparisonFilters = memo(function ComparisonFilters({
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
  showLensFilters = false,
  showPresets = true,
  showShortcutHints = true,
  className,
}: ComparisonFiltersProps) {
  const [showPresetsPanel, setShowPresetsPanel] = useState(false);

  // Toggle change type
  const toggleChangeType = (type: ChangeTypeFilter) => {
    const newTypes = filters.changeTypes.includes(type)
      ? filters.changeTypes.filter((t) => t !== type)
      : [...filters.changeTypes, type];
    onFiltersChange({ ...filters, changeTypes: newTypes });
  };

  // Handle search change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, searchQuery: e.target.value });
  };

  // Clear search
  const clearSearch = () => {
    onFiltersChange({ ...filters, searchQuery: '' });
  };

  // Clear all filters
  const clearAllFilters = () => {
    onFiltersChange({
      changeTypes: [],
      searchQuery: '',
      riskLevels: [],
      marketPositions: [],
      favoredParties: [],
      impactLevels: [],
      requiresMarketDeviation: false,
    });
  };

  // Clear lens filters only
  const clearLensFilters = () => {
    onFiltersChange({
      ...filters,
      riskLevels: [],
      marketPositions: [],
      favoredParties: [],
      impactLevels: [],
      requiresMarketDeviation: false,
    });
  };

  // Check for active filters
  const hasActiveChangeTypeFilters = filters.changeTypes.length > 0 || filters.searchQuery.length > 0;
  const hasActiveLensFiltersValue = hasActiveLensFilters({
    riskLevels: filters.riskLevels,
    marketPositions: filters.marketPositions,
    favoredParties: filters.favoredParties,
    impactLevels: filters.impactLevels,
    requiresMarketDeviation: filters.requiresMarketDeviation,
  });
  const hasAnyActiveFilters = hasActiveChangeTypeFilters || hasActiveLensFiltersValue;

  // Get lens filter descriptions
  const lensDescriptions = describeLensFilters({
    riskLevels: filters.riskLevels,
    marketPositions: filters.marketPositions,
    favoredParties: filters.favoredParties,
    impactLevels: filters.impactLevels,
    requiresMarketDeviation: filters.requiresMarketDeviation,
  });

  // Apply preset
  const applyPreset = (preset: LensPreset) => {
    onFiltersChange({
      ...filters,
      riskLevels: preset.filters.riskLevels,
      marketPositions: preset.filters.marketPositions,
      favoredParties: preset.filters.favoredParties,
      impactLevels: preset.filters.impactLevels,
      requiresMarketDeviation: preset.filters.requiresMarketDeviation ?? false,
    });
  };

  // Check if preset is active
  const isPresetActive = (preset: LensPreset): boolean => {
    return (
      JSON.stringify(preset.filters.riskLevels) ===
        JSON.stringify(filters.riskLevels) &&
      JSON.stringify(preset.filters.marketPositions) ===
        JSON.stringify(filters.marketPositions) &&
      JSON.stringify(preset.filters.favoredParties) ===
        JSON.stringify(filters.favoredParties) &&
      JSON.stringify(preset.filters.impactLevels) ===
        JSON.stringify(filters.impactLevels)
    );
  };

  return (
    <div
      className={cn(
        'space-y-4 p-4 bg-zinc-50 rounded-lg border border-zinc-200',
        className
      )}
      data-testid="comparison-filters"
    >
      {/* Change Type and Search Row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Change Type Toggle Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-700">Filter by:</span>
          <div className="flex gap-1">
            {changeTypeButtons.map(({ type, label, icon: Icon, activeClass, hoverClass, shortcutKey }) => {
              const isActive = filters.changeTypes.includes(type);
              return (
                <Button
                  key={type}
                  variant="outline"
                  size="sm"
                  onClick={() => toggleChangeType(type)}
                  className={cn(
                    'transition-all duration-200',
                    isActive ? activeClass : hoverClass
                  )}
                  data-testid={`filter-${type}-btn`}
                  aria-pressed={isActive}
                >
                  <Icon className="w-3.5 h-3.5 mr-1" />
                  {label}
                  <ShortcutHint shortcutKey={shortcutKey} show={showShortcutHints} />
                </Button>
              );
            })}
          </div>
        </div>

        {/* Search Input */}
        <div className="flex-1 min-w-[200px] max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            type="text"
            placeholder="Search by field name or value..."
            value={filters.searchQuery}
            onChange={handleSearchChange}
            className="pl-9 pr-9"
            data-testid="comparison-search-input"
          />
          {filters.searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
              data-testid="clear-search-btn"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Clear All Button */}
        {hasAnyActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-zinc-500 hover:text-zinc-700"
            data-testid="clear-all-filters-btn"
          >
            <X className="w-4 h-4 mr-1" />
            Clear all filters
          </Button>
        )}
      </div>

      {/* Lens Filters Section (conditionally shown) */}
      {showLensFilters && (
        <div className="pt-3 border-t border-zinc-200 space-y-3">
          {/* Lens Header with presets toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-semibold text-zinc-800">
                Analysis Lenses
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-zinc-500 cursor-help">(?)</span>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="text-sm">
                      Lenses let you view changes through different analytical
                      perspectives. Combine multiple lenses to create powerful
                      custom queries.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {showPresets && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPresetsPanel(!showPresetsPanel)}
                className="h-7 text-xs gap-1"
                data-testid="toggle-presets-btn"
              >
                <Save className="w-3 h-3" />
                Presets
                <ChevronDown
                  className={cn(
                    'w-3 h-3 transition-transform',
                    showPresetsPanel && 'rotate-180'
                  )}
                />
              </Button>
            )}
          </div>

          {/* Presets Panel */}
          {showPresets && showPresetsPanel && (
            <div
              className="flex flex-wrap gap-2 py-2"
              data-testid="presets-panel"
            >
              {LENS_PRESETS.map((preset) => (
                <PresetButton
                  key={preset.id}
                  preset={preset}
                  isActive={isPresetActive(preset)}
                  onSelect={() => applyPreset(preset)}
                />
              ))}
            </div>
          )}

          {/* Lens Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <FilterDropdown
              label="Risk"
              icon={ShieldAlert}
              options={riskOptions}
              selectedValues={filters.riskLevels.filter((r) => r !== 'all') as RiskFilterOption[]}
              onChange={(values) =>
                onFiltersChange({ ...filters, riskLevels: values })
              }
              testIdPrefix="lens-risk"
            />

            <FilterDropdown
              label="Market"
              icon={BarChart3}
              options={marketOptions}
              selectedValues={filters.marketPositions.filter((m) => m !== 'all') as MarketFilterOption[]}
              onChange={(values) =>
                onFiltersChange({ ...filters, marketPositions: values })
              }
              testIdPrefix="lens-market"
            />

            <FilterDropdown
              label="Party"
              icon={Users}
              options={partyOptions}
              selectedValues={filters.favoredParties.filter((p) => p !== 'all') as PartyFilterOption[]}
              onChange={(values) =>
                onFiltersChange({ ...filters, favoredParties: values })
              }
              testIdPrefix="lens-party"
            />

            <FilterDropdown
              label="Impact"
              icon={AlertTriangle}
              options={impactOptions}
              selectedValues={filters.impactLevels.filter((i) => i !== 'all') as ImpactFilterOption[]}
              onChange={(values) =>
                onFiltersChange({ ...filters, impactLevels: values })
              }
              testIdPrefix="lens-impact"
            />

            {/* Clear Lens Filters */}
            {hasActiveLensFiltersValue && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearLensFilters}
                className="h-8 text-zinc-500 hover:text-zinc-700"
                data-testid="clear-lens-filters-btn"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Clear lenses
              </Button>
            )}
          </div>

          {/* Active Lens Filters Summary */}
          {hasActiveLensFiltersValue && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-zinc-500">Active:</span>
              {lensDescriptions.map((desc, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-xs bg-indigo-100 text-indigo-700"
                >
                  {desc}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-200">
        <p className="text-sm text-zinc-600" data-testid="filter-results-count">
          {hasAnyActiveFilters ? (
            <>
              Showing <span className="font-semibold text-zinc-900">{filteredCount}</span> of{' '}
              <span className="font-semibold text-zinc-900">{totalCount}</span> changes
            </>
          ) : (
            <>
              <span className="font-semibold text-zinc-900">{totalCount}</span> total changes
            </>
          )}
        </p>
        {hasAnyActiveFilters && filteredCount === 0 && (
          <p className="text-sm text-amber-600" data-testid="no-results-message">
            No changes match your filters
          </p>
        )}
      </div>
    </div>
  );
});
