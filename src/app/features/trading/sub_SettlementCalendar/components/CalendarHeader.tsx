'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, List, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CalendarViewMode } from '../../lib/types';

interface CalendarHeaderProps {
  monthLabel: string;
  viewMode: CalendarViewMode;
  criticalCount: number;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  monthLabel,
  viewMode,
  criticalCount,
  onViewModeChange,
  onPrevious,
  onNext,
  onToday,
}) => {
  return (
    <div className="flex items-center justify-between py-3 px-4 border-b border-zinc-200" data-testid="calendar-header">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrevious}
            className="h-8 w-8 p-0"
            data-testid="calendar-prev-btn"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNext}
            className="h-8 w-8 p-0"
            data-testid="calendar-next-btn"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <h2 className="text-lg font-semibold text-zinc-900" data-testid="calendar-month-label">
          {monthLabel}
        </h2>

        <Button
          variant="outline"
          size="sm"
          onClick={onToday}
          className="h-8 px-3 text-xs"
          data-testid="calendar-today-btn"
        >
          Today
        </Button>

        {criticalCount > 0 && (
          <Badge variant="destructive" className="text-xs" data-testid="calendar-critical-badge">
            {criticalCount} Critical
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-1 bg-zinc-100 rounded-md p-0.5" data-testid="calendar-view-toggle">
        <Button
          variant={viewMode === 'month' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('month')}
          className="h-7 px-2.5 text-xs"
          data-testid="calendar-view-month-btn"
        >
          <LayoutGrid className="h-3.5 w-3.5 mr-1" />
          Month
        </Button>
        <Button
          variant={viewMode === 'week' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('week')}
          className="h-7 px-2.5 text-xs"
          data-testid="calendar-view-week-btn"
        >
          <Calendar className="h-3.5 w-3.5 mr-1" />
          Week
        </Button>
        <Button
          variant={viewMode === 'list' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('list')}
          className="h-7 px-2.5 text-xs"
          data-testid="calendar-view-list-btn"
        >
          <List className="h-3.5 w-3.5 mr-1" />
          List
        </Button>
      </div>
    </div>
  );
};

CalendarHeader.displayName = 'CalendarHeader';
