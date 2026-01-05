'use client';

import React, { useMemo } from 'react';
import { parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';
import { useSettlementCalendar } from '../lib/useSettlementCalendar';
import {
  CalendarHeader,
  CalendarGrid,
  SettlementListView,
  ReminderPanel,
  FundingForecastPanel,
  SettlementDetailPanel,
} from './components';

interface SettlementCalendarProps {
  onViewTrade?: (tradeId: string) => void;
  className?: string;
}

export const SettlementCalendar: React.FC<SettlementCalendarProps> = ({
  onViewTrade,
  className,
}) => {
  const {
    viewMode,
    selectedDate,
    settlements,
    calendarDays,
    forecasts,
    isLoading,
    error,
    setViewMode,
    goToNext,
    goToPrevious,
    goToToday,
    selectDate,
    upcomingReminders,
    criticalSettlements,
    totalFundingRequired,
    monthLabel,
  } = useSettlementCalendar();

  // Get settlements for selected date
  const selectedDateSettlements = useMemo(() => {
    if (!selectedDate) return [];
    return settlements.filter((s) => s.settlement_date === selectedDate);
  }, [selectedDate, settlements]);

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center h-[600px] bg-white rounded-lg border border-zinc-200"
        data-testid="settlement-calendar-loading"
      >
        <Spinner className="w-8 h-8 text-zinc-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex items-center justify-center h-[600px] bg-white rounded-lg border border-zinc-200"
        data-testid="settlement-calendar-error"
      >
        <div className="text-center text-zinc-500">
          <p className="text-sm">Failed to load calendar</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden',
        'animate-in fade-in slide-in-from-bottom-4 duration-500',
        className
      )}
      data-testid="settlement-calendar"
    >
      {/* Header */}
      <CalendarHeader
        monthLabel={monthLabel}
        viewMode={viewMode}
        criticalCount={criticalSettlements.length}
        onViewModeChange={setViewMode}
        onPrevious={goToPrevious}
        onNext={goToNext}
        onToday={goToToday}
      />

      {/* Main content area */}
      <div className="flex">
        {/* Calendar / List view */}
        <div className="flex-1 flex flex-col min-h-[500px]">
          {viewMode === 'list' ? (
            <SettlementListView
              settlements={settlements}
              selectedDate={selectedDate}
              onSelectDate={selectDate}
            />
          ) : (
            <CalendarGrid
              days={calendarDays}
              selectedDate={selectedDate}
              onSelectDate={selectDate}
              isWeekView={viewMode === 'week'}
            />
          )}
        </div>

        {/* Right sidebar */}
        <div className="w-80 border-l border-zinc-200 p-4 bg-zinc-50 space-y-4">
          {/* Selected date detail */}
          {selectedDate && selectedDateSettlements.length > 0 && (
            <SettlementDetailPanel
              date={selectedDate}
              settlements={selectedDateSettlements}
              onClose={() => selectDate(null)}
              onViewTrade={onViewTrade}
            />
          )}

          {/* Reminders */}
          {!selectedDate && (
            <>
              <ReminderPanel
                reminders={upcomingReminders}
                settlements={settlements}
                onViewSettlement={onViewTrade}
              />

              {/* Funding Forecast */}
              <FundingForecastPanel
                forecasts={forecasts}
                totalFundingRequired={totalFundingRequired}
              />
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-t border-zinc-200 bg-zinc-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-zinc-600">Critical</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-zinc-600">High Risk</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <span className="text-zinc-600">Medium</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-zinc-600">Low Risk</span>
            </div>
          </div>
          <div className="text-xs text-zinc-500">
            Click a date to view settlement details
          </div>
        </div>
      </div>
    </div>
  );
};

SettlementCalendar.displayName = 'SettlementCalendar';
