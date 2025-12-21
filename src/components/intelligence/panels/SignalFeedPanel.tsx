'use client';

import React, { memo, useState, useCallback } from 'react';
import {
  Activity,
  RefreshCw,
  Filter,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Newspaper,
  BarChart3,
  Zap,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { SignalCard } from '../cards/SignalCard';
import { signalTypeConfig, signalDirectionConfig } from '../config';
import type { SignalItem, SignalType, SignalDirection, Domain } from '../types';

type FilterType = SignalType | 'all';
type SortType = 'timestamp' | 'direction' | 'type';

interface SignalFeedPanelProps {
  /** Title */
  title?: string;
  /** Description */
  description?: string;
  /** Domain filter */
  domain?: Domain;
  /** Signals to display */
  signals: SignalItem[];
  /** Max height for scrolling */
  maxHeight?: string;
  /** Loading state */
  loading?: boolean;
  /** Auto refresh interval in ms */
  autoRefresh?: number;
  /** On refresh callback */
  onRefresh?: () => void;
  /** On signal click */
  onSignalClick?: (signal: SignalItem) => void;
  /** Show filter controls */
  showFilters?: boolean;
  /** Compact mode */
  compact?: boolean;
  /** Additional className */
  className?: string;
  /** Test ID */
  testId?: string;
}

export const SignalFeedPanel = memo(function SignalFeedPanel({
  title = 'Live Signal Feed',
  description = 'Real-time intelligence from multiple sources',
  domain,
  signals,
  maxHeight = '600px',
  loading = false,
  autoRefresh,
  onRefresh,
  onSignalClick,
  showFilters = true,
  compact = false,
  className,
  testId,
}: SignalFeedPanelProps) {
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterDirection, setFilterDirection] = useState<SignalDirection | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortType>('timestamp');

  // Filter signals
  const filteredSignals = signals.filter((signal) => {
    if (filterType !== 'all' && signal.type !== filterType) return false;
    if (filterDirection !== 'all' && signal.direction !== filterDirection) return false;
    if (domain && signal.domain !== domain) return false;
    return true;
  });

  // Sort signals
  const sortedSignals = [...filteredSignals].sort((a, b) => {
    switch (sortBy) {
      case 'timestamp':
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      case 'direction':
        const dirOrder = { positive: 0, negative: 1, neutral: 2 };
        return dirOrder[a.direction] - dirOrder[b.direction];
      case 'type':
        return a.type.localeCompare(b.type);
      default:
        return 0;
    }
  });

  // Group signals by time period
  const groupedSignals = groupSignalsByTime(sortedSignals);

  // Calculate stats
  const stats = {
    positive: signals.filter((s) => s.direction === 'positive').length,
    negative: signals.filter((s) => s.direction === 'negative').length,
    neutral: signals.filter((s) => s.direction === 'neutral').length,
  };

  return (
    <Card className={cn('overflow-hidden', className)} data-testid={testId || 'signal-feed-panel'}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-100">
              <Activity className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-xs">{description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {showFilters && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                    <Filter className="w-3.5 h-3.5" />
                    Filter
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-xs font-semibold text-zinc-500">
                    Signal Type
                  </div>
                  <DropdownMenuCheckboxItem
                    checked={filterType === 'all'}
                    onCheckedChange={() => setFilterType('all')}
                  >
                    All Types
                  </DropdownMenuCheckboxItem>
                  {(Object.keys(signalTypeConfig) as SignalType[]).map((type) => (
                    <DropdownMenuCheckboxItem
                      key={type}
                      checked={filterType === type}
                      onCheckedChange={() => setFilterType(type)}
                    >
                      <span className="capitalize">{type.replace('_', ' ')}</span>
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs font-semibold text-zinc-500">
                    Direction
                  </div>
                  <DropdownMenuCheckboxItem
                    checked={filterDirection === 'all'}
                    onCheckedChange={() => setFilterDirection('all')}
                  >
                    All
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filterDirection === 'positive'}
                    onCheckedChange={() => setFilterDirection('positive')}
                  >
                    <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                    Positive
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filterDirection === 'negative'}
                    onCheckedChange={() => setFilterDirection('negative')}
                  >
                    <TrendingDown className="w-3 h-3 text-red-600 mr-1" />
                    Negative
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filterDirection === 'neutral'}
                    onCheckedChange={() => setFilterDirection('neutral')}
                  >
                    Neutral
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={onRefresh}
                disabled={loading}
              >
                <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
                Refresh
              </Button>
            )}
          </div>
        </div>

        {/* Quick stats */}
        {!compact && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-zinc-100">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-green-600" />
              <span className="text-xs text-zinc-600">
                <span className="font-medium text-green-700">{stats.positive}</span> positive
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-red-600" />
              <span className="text-xs text-zinc-600">
                <span className="font-medium text-red-700">{stats.negative}</span> negative
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-xs text-zinc-600">
                <span className="font-medium">{stats.neutral}</span> neutral
              </span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent
        className="p-0 overflow-y-auto"
        style={{ maxHeight }}
      >
        {sortedSignals.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-zinc-500">No signals</p>
            <p className="text-xs text-zinc-400 mt-1">
              {filterType !== 'all' || filterDirection !== 'all'
                ? 'Try adjusting your filters'
                : 'Signals will appear here as they arrive'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {Object.entries(groupedSignals).map(([period, periodSignals]) => (
              <div key={period}>
                <div className="sticky top-0 px-3 py-1.5 bg-zinc-50 border-b border-zinc-100">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {period}
                  </span>
                </div>
                <div className="p-3 space-y-2">
                  {periodSignals.map((signal) => (
                    <SignalCard
                      key={signal.id}
                      signal={signal}
                      compact={compact}
                      onClick={() => onSignalClick?.(signal)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// Helper to group signals by time period
function groupSignalsByTime(signals: SignalItem[]): Record<string, SignalItem[]> {
  const now = new Date();
  const groups: Record<string, SignalItem[]> = {};

  signals.forEach((signal) => {
    const signalDate = new Date(signal.timestamp);
    const diffMs = now.getTime() - signalDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    let period: string;
    if (diffHours < 1) {
      period = 'Last Hour';
    } else if (diffHours < 24) {
      period = 'Today';
    } else if (diffHours < 48) {
      period = 'Yesterday';
    } else if (diffHours < 168) {
      period = 'This Week';
    } else {
      period = 'Earlier';
    }

    if (!groups[period]) {
      groups[period] = [];
    }
    groups[period].push(signal);
  });

  return groups;
}
