'use client';

import React, { memo } from 'react';
import { Search, Filter, RefreshCw, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { RiskAlertSeverity, RiskCategory, RiskAlertStatus } from '../../lib/types';

interface RiskFiltersBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  severityFilter: RiskAlertSeverity | 'all';
  onSeverityChange: (value: RiskAlertSeverity | 'all') => void;
  categoryFilter: RiskCategory | 'all';
  onCategoryChange: (value: RiskCategory | 'all') => void;
  statusFilter: RiskAlertStatus | 'all';
  onStatusChange: (value: RiskAlertStatus | 'all') => void;
  onScan?: () => void;
  onExport?: () => void;
  isScanning?: boolean;
}

const severityOptions: { value: RiskAlertSeverity | 'all'; label: string }[] = [
  { value: 'all', label: 'All Severities' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'info', label: 'Info' },
];

const categoryOptions: { value: RiskCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'covenant_threshold', label: 'Covenant Threshold' },
  { value: 'sanctions_screening', label: 'Sanctions Screening' },
  { value: 'missing_clause', label: 'Missing Clause' },
  { value: 'conflicting_terms', label: 'Conflicting Terms' },
  { value: 'unusual_terms', label: 'Unusual Terms' },
  { value: 'regulatory_compliance', label: 'Regulatory' },
  { value: 'document_quality', label: 'Document Quality' },
  { value: 'party_risk', label: 'Party Risk' },
];

const statusOptions: { value: RiskAlertStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'new', label: 'New' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'investigating', label: 'Investigating' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'false_positive', label: 'False Positive' },
];

export const RiskFiltersBar = memo(function RiskFiltersBar({
  searchQuery,
  onSearchChange,
  severityFilter,
  onSeverityChange,
  categoryFilter,
  onCategoryChange,
  statusFilter,
  onStatusChange,
  onScan,
  onExport,
  isScanning,
}: RiskFiltersBarProps) {
  return (
    <div
      className="flex flex-col lg:flex-row gap-4 p-4 bg-white rounded-lg border border-zinc-200 shadow-sm"
      data-testid="risk-filters-bar"
    >
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <Input
          placeholder="Search alerts by title, description, or document..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
          data-testid="risk-search-input"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 text-zinc-500">
          <Filter className="w-4 h-4" />
        </div>

        <Select value={severityFilter} onValueChange={onSeverityChange}>
          <SelectTrigger className="w-[140px]" data-testid="risk-severity-filter">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            {severityOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-[160px]" data-testid="risk-category-filter">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[140px]" data-testid="risk-status-filter">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onScan}
          disabled={isScanning}
          className="whitespace-nowrap"
          data-testid="risk-scan-btn"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
          {isScanning ? 'Scanning...' : 'Run Scan'}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          className="whitespace-nowrap"
          data-testid="risk-export-btn"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>
    </div>
  );
});
