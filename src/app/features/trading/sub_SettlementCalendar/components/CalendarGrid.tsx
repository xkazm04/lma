'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { CalendarDay } from '../../lib/types';
import { CalendarDayComponent } from './CalendarDay';

interface CalendarGridProps {
  days: CalendarDay[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  isWeekView?: boolean;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  days,
  selectedDate,
  onSelectDate,
  isWeekView = false,
}) => {
  return (
    <div className="flex-1 flex flex-col" data-testid="calendar-grid">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50">
        {WEEKDAY_LABELS.map((label, index) => (
          <div
            key={label}
            className={cn(
              'py-2 px-1 text-center text-xs font-medium text-zinc-500',
              (index === 0 || index === 6) && 'text-zinc-400'
            )}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div
        className={cn(
          'grid grid-cols-7 flex-1',
          isWeekView && 'min-h-[200px]'
        )}
      >
        {days.map((day) => (
          <CalendarDayComponent
            key={day.date}
            day={day}
            isSelected={selectedDate === day.date}
            onSelect={onSelectDate}
            compact={isWeekView}
          />
        ))}
      </div>
    </div>
  );
};

CalendarGrid.displayName = 'CalendarGrid';
