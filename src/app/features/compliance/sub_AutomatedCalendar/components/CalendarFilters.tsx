'use client';

import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  X,
  Scale,
  FileCheck,
  Bell,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ItemType, ItemStatus } from '../../lib/types';
import type { EventPriority } from '../lib/types';

interface CalendarFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTypes: ItemType[];
  onTypesChange: (types: ItemType[]) => void;
  selectedStatuses: ItemStatus[];
  onStatusesChange: (statuses: ItemStatus[]) => void;
  selectedPriorities: EventPriority[];
  onPrioritiesChange: (priorities: EventPriority[]) => void;
  selectedFacility: string;
  onFacilityChange: (facility: string) => void;
  facilities: string[];
  showCompleted: boolean;
  onShowCompletedChange: (show: boolean) => void;
}

export const CalendarFilters = memo(function CalendarFilters({
  searchQuery,
  onSearchChange,
  selectedTypes,
  onTypesChange,
  selectedStatuses,
  onStatusesChange,
  selectedPriorities,
  onPrioritiesChange,
  selectedFacility,
  onFacilityChange,
  facilities,
  showCompleted,
  onShowCompletedChange,
}: CalendarFiltersProps) {
  const eventTypes: { type: ItemType; label: string; icon: typeof Scale }[] = [
    { type: 'covenant_test', label: 'Covenant Tests', icon: Scale },
    { type: 'compliance_event', label: 'Compliance Events', icon: FileCheck },
    { type: 'notification_due', label: 'Notifications', icon: Bell },
    { type: 'waiver_expiration', label: 'Waiver Expirations', icon: AlertTriangle },
  ];

  const statuses: { status: ItemStatus; label: string }[] = [
    { status: 'upcoming', label: 'Upcoming' },
    { status: 'pending', label: 'Pending' },
    { status: 'overdue', label: 'Overdue' },
  ];

  const priorities: { priority: EventPriority; label: string; color: string }[] = [
    { priority: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700' },
    { priority: 'high', label: 'High', color: 'bg-amber-100 text-amber-700' },
    { priority: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-700' },
    { priority: 'low', label: 'Low', color: 'bg-green-100 text-green-700' },
  ];

  const toggleType = (type: ItemType) => {
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter((t) => t !== type));
    } else {
      onTypesChange([...selectedTypes, type]);
    }
  };

  const toggleStatus = (status: ItemStatus) => {
    if (selectedStatuses.includes(status)) {
      onStatusesChange(selectedStatuses.filter((s) => s !== status));
    } else {
      onStatusesChange([...selectedStatuses, status]);
    }
  };

  const togglePriority = (priority: EventPriority) => {
    if (selectedPriorities.includes(priority)) {
      onPrioritiesChange(selectedPriorities.filter((p) => p !== priority));
    } else {
      onPrioritiesChange([...selectedPriorities, priority]);
    }
  };

  const hasActiveFilters =
    selectedTypes.length > 0 ||
    selectedStatuses.length > 0 ||
    selectedPriorities.length > 0 ||
    selectedFacility !== 'all' ||
    searchQuery !== '';

  const clearFilters = () => {
    onSearchChange('');
    onTypesChange([]);
    onStatusesChange([]);
    onPrioritiesChange([]);
    onFacilityChange('all');
  };

  return (
    <div className="space-y-4">
      {/* Search and facility filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            data-testid="search-events-input"
          />
        </div>

        <select
          value={selectedFacility}
          onChange={(e) => onFacilityChange(e.target.value)}
          className="px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          data-testid="facility-filter-select"
        >
          <option value="all">All Facilities</option>
          {facilities.map((facility) => (
            <option key={facility} value={facility}>
              {facility}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm text-zinc-600">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => onShowCompletedChange(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            data-testid="show-completed-checkbox"
          />
          Show completed
        </label>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            data-testid="clear-filters-btn"
          >
            <X className="w-4 h-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Event type filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-zinc-500 flex items-center gap-1">
          <Filter className="w-4 h-4" />
          Types:
        </span>
        {eventTypes.map(({ type, label, icon: Icon }) => (
          <Button
            key={type}
            variant={selectedTypes.includes(type) ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleType(type)}
            className="transition-all"
            data-testid={`filter-type-${type}`}
          >
            <Icon className="w-4 h-4 mr-1" />
            {label}
          </Button>
        ))}
      </div>

      {/* Status and priority filters */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500">Status:</span>
          {statuses.map(({ status, label }) => (
            <Badge
              key={status}
              variant={selectedStatuses.includes(status) ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer transition-all hover:scale-105',
                selectedStatuses.includes(status) && 'ring-2 ring-offset-1 ring-blue-500'
              )}
              onClick={() => toggleStatus(status)}
              data-testid={`filter-status-${status}`}
            >
              {label}
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500">Priority:</span>
          {priorities.map(({ priority, label, color }) => (
            <Badge
              key={priority}
              variant="outline"
              className={cn(
                'cursor-pointer transition-all hover:scale-105',
                selectedPriorities.includes(priority) && `${color} ring-2 ring-offset-1`
              )}
              onClick={() => togglePriority(priority)}
              data-testid={`filter-priority-${priority}`}
            >
              {label}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
});
