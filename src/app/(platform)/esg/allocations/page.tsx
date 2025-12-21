'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { DollarSign, CheckCircle, Clock, TrendingUp, Plus, ChevronRight, ExternalLink, BarChart3, GitBranch } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import {
  KPICard,
  AllocationChart,
  AllocationSankey,
  LoanTypeBadge,
  ExportButton,
  EmptyState,
  formatCurrency,
  mockAllocations,
  exportAllocationsPDF,
  exportAllocationsExcel,
  type ExportFormat,
  type SankeyFilter,
} from '@/app/features/esg';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getDaysUntil(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

type ViewMode = 'sankey' | 'bar';

/**
 * Unified view state that combines facility expansion and Sankey filter state.
 * This prevents cognitive dissonance where a filter is active but expansion shows all projects.
 *
 * - 'collapsed': Default state, shows only the chart
 * - 'filtered': Sankey filter is active, shows filtered projects
 * - 'expanded': Full expansion showing all projects (no filter active)
 */
type FacilityViewMode = 'collapsed' | 'filtered' | 'expanded';

interface FacilityViewState {
  facilityId: string;
  view: FacilityViewMode;
  filter?: SankeyFilter;
}

export default function ESGAllocationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('sankey');
  // Unified state: maps facilityId -> view state (replaces separate expandedFacility and activeFilters)
  const [facilityViewStates, setFacilityViewStates] = useState<Record<string, FacilityViewState>>({});

  /**
   * Handle filter change from Sankey component.
   * When a filter is applied, the view state transitions to 'filtered'.
   * When filter is cleared, the view state transitions to 'collapsed'.
   */
  const handleFilterChange = useCallback((facilityId: string, filter: SankeyFilter | null) => {
    setFacilityViewStates(prev => {
      if (filter) {
        // Applying a filter: set to filtered view
        return {
          ...prev,
          [facilityId]: {
            facilityId,
            view: 'filtered',
            filter,
          },
        };
      } else {
        // Clearing filter: collapse the view
        const { [facilityId]: _, ...rest } = prev;
        return rest;
      }
    });
  }, []);

  /**
   * Toggle between showing all projects and collapsed view.
   * Respects the current filter state:
   * - If filtered, toggle maintains filter but shows all filtered projects
   * - If expanded, collapses back
   * - If collapsed, expands to show all
   */
  const handleToggleExpansion = useCallback((facilityId: string) => {
    setFacilityViewStates(prev => {
      const current = prev[facilityId];

      if (!current || current.view === 'collapsed') {
        // No state or collapsed -> expand to show all
        return {
          ...prev,
          [facilityId]: {
            facilityId,
            view: 'expanded',
          },
        };
      } else if (current.view === 'expanded') {
        // Expanded -> collapse
        const { [facilityId]: _, ...rest } = prev;
        return rest;
      } else if (current.view === 'filtered') {
        // Filtered -> toggle between filtered and expanded (preserving filter info for return)
        return {
          ...prev,
          [facilityId]: {
            ...current,
            view: 'expanded',
          },
        };
      }

      return prev;
    });
  }, []);

  // Helper to get current view state for a facility
  const getFacilityViewState = useCallback((facilityId: string): FacilityViewState | null => {
    return facilityViewStates[facilityId] || null;
  }, [facilityViewStates]);

  // Helper to get active filter for a facility (for backward compatibility with AllocationSankey)
  const getActiveFilter = useCallback((facilityId: string): SankeyFilter | null => {
    const state = facilityViewStates[facilityId];
    return state?.filter || null;
  }, [facilityViewStates]);

  const totalCommitment = mockAllocations.reduce((sum, f) => sum + f.commitment_amount, 0);
  const totalAllocated = mockAllocations.reduce(
    (sum, f) => sum + f.categories.reduce((catSum, c) => catSum + c.total_allocated, 0),
    0
  );
  const totalUnallocated = mockAllocations.reduce((sum, f) => sum + f.unallocated_amount, 0);

  // Filter allocations based on search query
  const filteredAllocations = mockAllocations.filter((facility) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const matchesFacility =
      facility.facility_name.toLowerCase().includes(query) ||
      facility.borrower_name.toLowerCase().includes(query);
    const matchesProject = facility.categories.some((cat) =>
      cat.projects.some((proj) => proj.project_name.toLowerCase().includes(query))
    );
    return matchesFacility || matchesProject;
  });

  const hasActiveFilters = searchQuery !== '';

  const handleResetFilters = () => {
    setSearchQuery('');
  };

  const handleExport = (format: ExportFormat) => {
    const config = { title: 'Use of Proceeds Report' };
    if (format === 'pdf') {
      exportAllocationsPDF(filteredAllocations, config);
    } else {
      exportAllocationsExcel(filteredAllocations, config);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Use of Proceeds Tracker</h1>
          <p className="text-zinc-500">Track and manage Green/Social loan allocations</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton onExport={handleExport} label="Export Report" />
          <Button className="transition-transform hover:scale-105" data-testid="add-allocation-btn">
            <Plus className="w-4 h-4 mr-2" />
            Add Allocation
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <KPICard
          title="Total Commitment"
          value={formatCurrency(totalCommitment)}
          icon={<DollarSign className="w-5 h-5 text-blue-600" />}
        />
        <KPICard
          title="Total Allocated"
          value={formatCurrency(totalAllocated)}
          variant="success"
          icon={<CheckCircle className="w-5 h-5 text-green-600" />}
        />
        <KPICard
          title="Unallocated"
          value={formatCurrency(totalUnallocated)}
          variant="warning"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
        />
        <KPICard
          title="Utilization Rate"
          value={`${((totalAllocated / totalCommitment) * 100).toFixed(1)}%`}
          icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
        />
      </div>

      {/* Search and View Toggle */}
      <Card className="animate-in slide-in-from-top-4 duration-500 delay-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Search facilities or projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="allocation-search-input"
              />
            </div>
            <div className="flex items-center gap-1 border border-zinc-200 rounded-md p-1">
              <Button
                variant={viewMode === 'sankey' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 px-3"
                onClick={() => setViewMode('sankey')}
                data-testid="view-mode-sankey-btn"
              >
                <GitBranch className="w-4 h-4 mr-1.5" />
                Flow View
              </Button>
              <Button
                variant={viewMode === 'bar' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 px-3"
                onClick={() => setViewMode('bar')}
                data-testid="view-mode-bar-btn"
              >
                <BarChart3 className="w-4 h-4 mr-1.5" />
                Bar View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Facilities with Allocations */}
      <div className="space-y-4">
        {filteredAllocations.length === 0 && hasActiveFilters ? (
          <Card className="animate-in fade-in duration-500">
            <EmptyState
              variant="allocations"
              onAction={handleResetFilters}
              actionLabel="Clear Search"
            />
          </Card>
        ) : filteredAllocations.length === 0 ? (
          <Card className="animate-in fade-in duration-500">
            <EmptyState
              variant="no-data"
              title="No allocations yet"
              description="Add your first allocation to start tracking use of proceeds for Green and Social loans."
              showAction={false}
            />
          </Card>
        ) : (
          filteredAllocations.map((facility, index) => {
            const daysUntilLookback = getDaysUntil(facility.lookback_period_end);
            const viewState = getFacilityViewState(facility.facility_id);
            const activeFilter = getActiveFilter(facility.facility_id);
            const isExpanded = viewState?.view === 'expanded';
            const isFiltered = viewState?.view === 'filtered';
            const showProjects = isExpanded || isFiltered;

            // Get projects to display based on current view state
            const getProjectsToDisplay = () => {
              if (isExpanded) {
                // Show all projects
                return facility.categories.flatMap(c =>
                  c.projects.map(p => ({ ...p, categoryName: c.category_name }))
                );
              } else if (isFiltered && activeFilter) {
                // Show filtered projects only
                if (activeFilter.type === 'category') {
                  const category = facility.categories.find(c => c.id === activeFilter.id);
                  return category?.projects.map(p => ({ ...p, categoryName: category.category_name })) || [];
                } else {
                  // Project filter - find the specific project
                  for (const category of facility.categories) {
                    const project = category.projects.find(p => p.id === activeFilter.id);
                    if (project) {
                      return [{ ...project, categoryName: category.category_name }];
                    }
                  }
                  return [];
                }
              }
              return [];
            };

            const projectsToDisplay = getProjectsToDisplay();

            // Determine button text based on current state
            const getToggleButtonText = () => {
              if (isExpanded) return 'Hide Projects';
              if (isFiltered) return 'Show All Projects';
              return 'Show All Projects';
            };

            return (
              <Card
              key={facility.facility_id}
              className="animate-in slide-in-from-bottom-4 transition-shadow hover:shadow-lg"
              style={{ animationDelay: `${index * 100 + 300}ms` }}
              data-testid={`facility-card-${facility.facility_id}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle>{facility.facility_name}</CardTitle>
                      <LoanTypeBadge type={facility.esg_loan_type} />
                      {viewState && (
                        <Badge
                          variant="outline"
                          className="text-xs"
                          data-testid={`view-state-badge-${facility.facility_id}`}
                        >
                          {viewState.view === 'filtered' ? `Filtered: ${activeFilter?.name}` : 'All Projects'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-zinc-500">{facility.borrower_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-zinc-500">Lookback Period Ends</p>
                    <p className="font-medium text-zinc-900">{formatDate(facility.lookback_period_end)}</p>
                    {daysUntilLookback <= 90 && (
                      <Badge variant={daysUntilLookback <= 30 ? 'destructive' : 'secondary'} className="mt-1">
                        {daysUntilLookback} days remaining
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {viewMode === 'sankey' ? (
                  <AllocationSankey
                    facility={facility}
                    onFilterChange={(filter) => handleFilterChange(facility.facility_id, filter)}
                  />
                ) : (
                  <AllocationChart categories={facility.categories} />
                )}

                {/* Unified Projects Display - respects both filter and expansion state */}
                {showProjects && projectsToDisplay.length > 0 && (
                  <div
                    className="mt-4 p-4 bg-zinc-50 rounded-lg animate-in fade-in slide-in-from-top-2"
                    data-testid={`projects-panel-${facility.facility_id}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-zinc-900">
                        {isFiltered && activeFilter
                          ? `Filtered: ${activeFilter.name}`
                          : `All Projects (${projectsToDisplay.length})`}
                      </h4>
                      {isFiltered && (
                        <Badge variant="secondary" className="text-xs">
                          {projectsToDisplay.length} project{projectsToDisplay.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2">
                      {projectsToDisplay.map(project => (
                        <div
                          key={project.id}
                          className="flex items-center justify-between p-2 bg-white rounded border border-zinc-200"
                          data-testid={`project-item-${project.id}`}
                        >
                          <div className="flex flex-col">
                            <span className="text-sm text-zinc-700">{project.project_name}</span>
                            {isExpanded && (
                              <span className="text-xs text-zinc-400">{project.categoryName}</span>
                            )}
                          </div>
                          <span className="text-sm font-medium text-zinc-900">{formatCurrency(project.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex justify-between items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleExpansion(facility.facility_id)}
                    className="transition-transform hover:scale-105"
                    data-testid={`toggle-projects-btn-${facility.facility_id}`}
                  >
                    {getToggleButtonText()}
                    <ChevronRight
                      className={`w-4 h-4 ml-1 transition-transform ${showProjects ? 'rotate-90' : ''}`}
                    />
                  </Button>
                  <Link href={`/esg/facilities/${facility.facility_id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="transition-transform hover:scale-105"
                      data-testid={`view-facility-btn-${facility.facility_id}`}
                    >
                      View Facility
                      <ExternalLink className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
