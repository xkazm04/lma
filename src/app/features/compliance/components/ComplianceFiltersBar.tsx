'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActiveFilterChips } from './ActiveFilterChips';
import { FilterPresets } from './FilterPresets';
import type { ComplianceFilters, FilterPreset } from '../lib/useFilterPersistence';

interface ActiveFilter {
  key: keyof ComplianceFilters;
  value: string;
  label: string;
}

interface ComplianceFiltersBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  typeFilter?: string;
  onTypeChange?: (value: string) => void;
  facilityFilter?: string;
  onFacilityChange?: (value: string) => void;
  facilities?: string[];
  className?: string;
  // New props for filter persistence and presets
  activeFilters?: ActiveFilter[];
  onRemoveFilter?: (key: keyof ComplianceFilters) => void;
  onClearAll?: () => void;
  presets?: FilterPreset[];
  onApplyPreset?: (presetId: string) => void;
  isPresetActive?: (presetId: string) => boolean;
  showPresets?: boolean;
  showActiveChips?: boolean;
  // Covenant-specific status options
  covenantStatusMode?: boolean;
}

export const ComplianceFiltersBar = memo(function ComplianceFiltersBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  facilityFilter,
  onFacilityChange,
  facilities = [],
  className,
  activeFilters = [],
  onRemoveFilter,
  onClearAll,
  presets = [],
  onApplyPreset,
  isPresetActive,
  showPresets = false,
  showActiveChips = false,
  covenantStatusMode = false,
}: ComplianceFiltersBarProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <Card className="animate-in fade-in slide-in-from-top-2">
        <CardContent className="py-4">
          <div className="flex flex-col gap-4">
            {/* Main filter controls */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 transition-shadow focus:shadow-sm"
                  data-testid="filter-search-input"
                />
              </div>

              <Select value={statusFilter} onValueChange={onStatusChange}>
                <SelectTrigger
                  className="w-44 transition-shadow hover:shadow-sm"
                  data-testid="filter-status-select"
                >
                  <Filter className="w-4 h-4 mr-2 text-zinc-400" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {covenantStatusMode ? (
                    <>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="passing">Passing</SelectItem>
                      <SelectItem value="failing">Failing</SelectItem>
                      <SelectItem value="at_risk">At Risk</SelectItem>
                      <SelectItem value="waived">Waived</SelectItem>
                      <SelectItem value="needs_attention">Needs Attention</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="due_this_week">Due This Week</SelectItem>
                      <SelectItem value="needs_attention">Needs Attention</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>

              {typeFilter !== undefined && onTypeChange && (
                <Select value={typeFilter} onValueChange={onTypeChange}>
                  <SelectTrigger
                    className="w-48 transition-shadow hover:shadow-sm"
                    data-testid="filter-type-select"
                  >
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {covenantStatusMode ? (
                      <>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="leverage_ratio">Leverage Ratio</SelectItem>
                        <SelectItem value="interest_coverage">Interest Coverage</SelectItem>
                        <SelectItem value="fixed_charge_coverage">Fixed Charge Coverage</SelectItem>
                        <SelectItem value="debt_service_coverage">Debt Service Coverage</SelectItem>
                        <SelectItem value="minimum_liquidity">Minimum Liquidity</SelectItem>
                        <SelectItem value="capex">CapEx</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="compliance_event">Compliance Events</SelectItem>
                        <SelectItem value="covenant_test">Covenant Tests</SelectItem>
                        <SelectItem value="notification_due">Notifications</SelectItem>
                        <SelectItem value="waiver_expiration">Waiver Expirations</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              )}

              {facilityFilter !== undefined && onFacilityChange && facilities.length > 0 && (
                <Select value={facilityFilter} onValueChange={onFacilityChange}>
                  <SelectTrigger
                    className="w-64 transition-shadow hover:shadow-sm"
                    data-testid="filter-facility-select"
                  >
                    <SelectValue placeholder="All Facilities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Facilities</SelectItem>
                    <SelectItem value="my_facilities">My Facilities</SelectItem>
                    {facilities.map((facility) => (
                      <SelectItem key={facility} value={facility}>
                        {facility}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Preset filter buttons */}
            {showPresets && presets.length > 0 && onApplyPreset && isPresetActive && (
              <FilterPresets
                presets={presets}
                onApplyPreset={onApplyPreset}
                isPresetActive={isPresetActive}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active filter chips */}
      {showActiveChips && activeFilters.length > 0 && onRemoveFilter && onClearAll && (
        <ActiveFilterChips
          activeFilters={activeFilters}
          onRemoveFilter={onRemoveFilter}
          onClearAll={onClearAll}
        />
      )}
    </div>
  );
});
