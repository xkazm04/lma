'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, AlertTriangle, Clock, Plus, Search, GitCompareArrows } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  KPICard,
  LoanTypeBadge,
  StatusBadge,
  EmptyState,
  ExportButton,
  formatCurrency,
  mockFacilities,
  exportFacilitiesListPDF,
  exportFacilitiesListExcel,
  type ExportFormat,
} from '@/app/features/esg';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Not set';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ESGFacilitiesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredFacilities = mockFacilities.filter((facility) => {
    const matchesSearch =
      searchQuery === '' ||
      facility.facility_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      facility.borrower_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'all' || facility.esg_loan_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || facility.overall_performance_status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const totalCommitment = mockFacilities.reduce((sum, f) => sum + f.commitment_amount, 0);
  const hasActiveFilters = searchQuery !== '' || typeFilter !== 'all' || statusFilter !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setStatusFilter('all');
  };

  const handleExport = (format: ExportFormat) => {
    const config = { title: 'ESG Facilities Report' };
    // Export filtered facilities to show what user is currently viewing
    if (format === 'pdf') {
      exportFacilitiesListPDF(filteredFacilities, config);
    } else {
      exportFacilitiesListExcel(filteredFacilities, config);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">ESG Facilities</h1>
          <p className="text-zinc-500">
            {mockFacilities.length} facilities totaling {formatCurrency(totalCommitment)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/esg/compare">
            <Button variant="outline" className="transition-transform hover:scale-105" data-testid="compare-facilities-btn">
              <GitCompareArrows className="w-4 h-4 mr-2" />
              Compare
            </Button>
          </Link>
          <ExportButton onExport={handleExport} label="Export List" />
          <Link href="/esg/facilities/new">
            <Button className="transition-transform hover:scale-105" data-testid="add-facility-btn">
              <Plus className="w-4 h-4 mr-2" />
              Add Facility
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="On Track"
          value={mockFacilities.filter((f) => f.overall_performance_status === 'on_track').length}
          variant="success"
          icon={<CheckCircle className="w-5 h-5 text-green-600" />}
        />
        <KPICard
          title="At Risk"
          value={mockFacilities.filter((f) => f.overall_performance_status === 'at_risk').length}
          variant="warning"
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
        />
        <KPICard
          title="Off Track"
          value={mockFacilities.filter((f) => f.overall_performance_status === 'off_track').length}
          variant="danger"
          icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
        />
        <KPICard
          title="Pending Setup"
          value={mockFacilities.filter((f) => f.overall_performance_status === 'pending').length}
          icon={<Clock className="w-5 h-5 text-zinc-600" />}
        />
      </div>

      {/* Filters */}
      <Card className="animate-in slide-in-from-top-4 duration-500 delay-200">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  placeholder="Search facilities or borrowers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Loan Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sustainability_linked">Sustainability-Linked</SelectItem>
                <SelectItem value="green_loan">Green Loan</SelectItem>
                <SelectItem value="social_loan">Social Loan</SelectItem>
                <SelectItem value="transition_loan">Transition Loan</SelectItem>
                <SelectItem value="esg_linked_hybrid">ESG Hybrid</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="on_track">On Track</SelectItem>
                <SelectItem value="at_risk">At Risk</SelectItem>
                <SelectItem value="off_track">Off Track</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Facilities List */}
      <div className="space-y-4">
        {filteredFacilities.length === 0 && hasActiveFilters ? (
          <Card className="animate-in fade-in duration-500">
            <EmptyState
              variant="facilities"
              onAction={handleResetFilters}
              actionLabel="Reset Filters"
            />
          </Card>
        ) : filteredFacilities.length === 0 ? (
          <Card className="animate-in fade-in duration-500">
            <EmptyState
              variant="no-data"
              title="No facilities yet"
              description="Add your first ESG facility to start tracking sustainability-linked loans and performance metrics."
              showAction={false}
            />
          </Card>
        ) : (
          filteredFacilities.map((facility, index) => (
            <Link key={facility.id} href={`/esg/facilities/${facility.id}`}>
              <Card
                className="hover:shadow-md transition-all cursor-pointer animate-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 50 + 300}ms` }}
              >
                <CardContent className="py-6">
                  <div className="flex items-start gap-6">
                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-zinc-900 hover:text-blue-600 transition-colors">
                              {facility.facility_name}
                            </h3>
                            <LoanTypeBadge type={facility.esg_loan_type} />
                          </div>
                          <p className="text-sm text-zinc-500">{facility.borrower_name}</p>
                        </div>
                        <StatusBadge status={facility.overall_performance_status} />
                      </div>

                      {/* Stats Row */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-zinc-500">Commitment</p>
                          <p className="text-sm font-medium text-zinc-900">
                            {formatCurrency(facility.commitment_amount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">KPIs</p>
                          <p className="text-sm font-medium text-zinc-900">{facility.kpi_count} defined</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Target Progress</p>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={
                                facility.targets_total > 0
                                  ? (facility.targets_achieved / facility.targets_total) * 100
                                  : 0
                              }
                              className="h-2 flex-1"
                              animate
                              animationDelay={300}
                              data-testid={`facility-list-progress-${facility.id}`}
                            />
                            <span className="text-xs text-zinc-600">
                              {facility.targets_achieved}/{facility.targets_total}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Next Report</p>
                          <p className="text-sm font-medium text-zinc-900">
                            {formatDate(facility.next_reporting_date)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Margin Impact</p>
                          <p
                            className={`text-sm font-medium ${
                              facility.margin_adjustment_bps < 0
                                ? 'text-green-600'
                                : facility.margin_adjustment_bps > 0
                                ? 'text-red-600'
                                : 'text-zinc-900'
                            }`}
                          >
                            {facility.margin_adjustment_bps > 0 ? '+' : ''}
                            {facility.margin_adjustment_bps}bps
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
