'use client';

import React, { memo, useState, useMemo } from 'react';
import { format, isSameDay, parseISO } from 'date-fns';
import {
  History,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  GitCompare,
  X,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ComparisonHistoryItem } from './ComparisonHistoryItem';
import type { ComparisonHistoryEntryWithDetails, HistoryViewMode } from '../lib/history-types';

interface ComparisonHistoryTimelineProps {
  entries: ComparisonHistoryEntryWithDetails[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onSelect?: (entry: ComparisonHistoryEntryWithDetails) => void;
  onView?: (entry: ComparisonHistoryEntryWithDetails) => void;
  onCompareWith?: (entry1: ComparisonHistoryEntryWithDetails, entry2: ComparisonHistoryEntryWithDetails) => void;
  onEdit?: (entry: ComparisonHistoryEntryWithDetails) => void;
  onDelete?: (entry: ComparisonHistoryEntryWithDetails) => void;
  selectedEntryId?: string;
  className?: string;
}

interface GroupedEntries {
  date: string;
  formattedDate: string;
  entries: ComparisonHistoryEntryWithDetails[];
}

export const ComparisonHistoryTimeline = memo(function ComparisonHistoryTimeline({
  entries,
  isLoading = false,
  onRefresh,
  onSelect,
  onView,
  onCompareWith,
  onEdit,
  onDelete,
  selectedEntryId,
  className,
}: ComparisonHistoryTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<HistoryViewMode>('timeline');
  const [compareEntryId, setCompareEntryId] = useState<string | null>(null);

  // Filter entries based on search
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;

    const query = searchQuery.toLowerCase();
    return entries.filter((entry) => {
      return (
        entry.label?.toLowerCase().includes(query) ||
        entry.notes?.toLowerCase().includes(query) ||
        entry.comparedByName.toLowerCase().includes(query) ||
        entry.document1.name.toLowerCase().includes(query) ||
        entry.document2.name.toLowerCase().includes(query)
      );
    });
  }, [entries, searchQuery]);

  // Group entries by date for timeline view
  const groupedEntries = useMemo<GroupedEntries[]>(() => {
    if (viewMode !== 'timeline') return [];

    const groups = new Map<string, ComparisonHistoryEntryWithDetails[]>();

    for (const entry of filteredEntries) {
      const date = format(parseISO(entry.comparedAt), 'yyyy-MM-dd');
      if (!groups.has(date)) {
        groups.set(date, []);
      }
      groups.get(date)!.push(entry);
    }

    return Array.from(groups.entries())
      .map(([date, entries]) => ({
        date,
        formattedDate: format(parseISO(date), 'EEEE, MMMM d, yyyy'),
        entries,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredEntries, viewMode]);

  const handleStartCompare = (entry: ComparisonHistoryEntryWithDetails) => {
    setCompareEntryId(entry.id);
  };

  const handleCancelCompare = () => {
    setCompareEntryId(null);
  };

  const handleSelectForCompare = (entry: ComparisonHistoryEntryWithDetails) => {
    if (compareEntryId && compareEntryId !== entry.id) {
      const entry1 = entries.find((e) => e.id === compareEntryId);
      if (entry1) {
        onCompareWith?.(entry1, entry);
        setCompareEntryId(null);
      }
    }
  };

  const isCompareMode = compareEntryId !== null;

  return (
    <Card className={cn('animate-in fade-in slide-in-from-right-4 duration-300', className)} data-testid="comparison-history-timeline">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsExpanded(!isExpanded)}
              data-testid="history-timeline-toggle"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-5 h-5" />
              Comparison History
              <Badge variant="secondary" className="ml-1">
                {entries.length}
              </Badge>
            </CardTitle>
          </div>

          <div className="flex items-center gap-2">
            {isCompareMode && (
              <Badge
                variant="secondary"
                className="bg-purple-100 text-purple-700 flex items-center gap-1"
              >
                <GitCompare className="w-3 h-3" />
                Select another to compare
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1"
                  onClick={handleCancelCompare}
                  data-testid="cancel-compare-mode"
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh history"
              data-testid="refresh-history-btn"
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {/* Search and filter bar */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="history-search-input"
              />
            </div>
            <Select
              value={viewMode}
              onValueChange={(v) => setViewMode(v as HistoryViewMode)}
            >
              <SelectTrigger className="w-[120px]" data-testid="history-view-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="timeline">Timeline</SelectItem>
                <SelectItem value="list">List</SelectItem>
                <SelectItem value="compact">Compact</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Empty state */}
          {filteredEntries.length === 0 && (
            <div className="py-8 text-center text-zinc-500" data-testid="history-empty-state">
              {entries.length === 0 ? (
                <>
                  <History className="w-10 h-10 mx-auto mb-2 text-zinc-300" />
                  <p>No comparison history yet</p>
                  <p className="text-sm text-zinc-400 mt-1">
                    Comparisons will be saved automatically
                  </p>
                </>
              ) : (
                <>
                  <Search className="w-10 h-10 mx-auto mb-2 text-zinc-300" />
                  <p>No results found</p>
                  <p className="text-sm text-zinc-400 mt-1">
                    Try a different search term
                  </p>
                </>
              )}
            </div>
          )}

          {/* Timeline view */}
          {viewMode === 'timeline' && groupedEntries.length > 0 && (
            <div className="space-y-6" data-testid="history-timeline-view">
              {groupedEntries.map((group) => (
                <div key={group.date} className="space-y-2">
                  {/* Date header */}
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-zinc-300" />
                    <span className="text-sm font-medium text-zinc-600">
                      {group.formattedDate}
                    </span>
                    <div className="flex-1 h-px bg-zinc-200" />
                  </div>

                  {/* Entries for this date */}
                  <div className="ml-4 border-l-2 border-zinc-200 pl-4 space-y-2">
                    {group.entries.map((entry) => (
                      <ComparisonHistoryItem
                        key={entry.id}
                        entry={entry}
                        isSelected={selectedEntryId === entry.id}
                        onSelect={onSelect}
                        onView={onView}
                        onCompareWith={
                          isCompareMode ? handleSelectForCompare : handleStartCompare
                        }
                        onEdit={onEdit}
                        onDelete={onDelete}
                        isCompareMode={isCompareMode}
                        compareEntryId={compareEntryId || undefined}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* List view */}
          {viewMode === 'list' && filteredEntries.length > 0 && (
            <div className="space-y-2" data-testid="history-list-view">
              {filteredEntries.map((entry) => (
                <ComparisonHistoryItem
                  key={entry.id}
                  entry={entry}
                  isSelected={selectedEntryId === entry.id}
                  onSelect={onSelect}
                  onView={onView}
                  onCompareWith={
                    isCompareMode ? handleSelectForCompare : handleStartCompare
                  }
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isCompareMode={isCompareMode}
                  compareEntryId={compareEntryId || undefined}
                />
              ))}
            </div>
          )}

          {/* Compact view */}
          {viewMode === 'compact' && filteredEntries.length > 0 && (
            <div className="space-y-1" data-testid="history-compact-view">
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className={cn(
                    'flex items-center justify-between py-2 px-3 rounded-md cursor-pointer transition-colors hover:bg-zinc-50',
                    selectedEntryId === entry.id && 'bg-blue-50',
                    compareEntryId === entry.id && 'bg-purple-50'
                  )}
                  onClick={() => {
                    if (isCompareMode && compareEntryId !== entry.id) {
                      handleSelectForCompare(entry);
                    } else {
                      onSelect?.(entry);
                    }
                  }}
                  data-testid={`history-compact-item-${entry.id}`}
                  data-history-entry-id={entry.id}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-zinc-500 flex-shrink-0">
                      {format(parseISO(entry.comparedAt), 'MMM d')}
                    </span>
                    <span className="text-sm text-zinc-700 truncate">
                      {entry.label || `${entry.totalChanges} changes`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700 text-xs px-1"
                    >
                      +{entry.addedCount}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-700 text-xs px-1"
                    >
                      ~{entry.modifiedCount}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-red-100 text-red-700 text-xs px-1"
                    >
                      -{entry.removedCount}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
});
