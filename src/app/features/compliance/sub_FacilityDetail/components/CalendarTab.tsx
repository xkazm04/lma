'use client';

import React, { memo, useMemo } from 'react';
import { CalendarView } from '../../sub_Calendar/components';
import { mockCalendarItems, useCalendarViewState } from '../../lib';

interface CalendarTabProps {
  facilityId: string;
  facilityName: string;
}

export const CalendarTab = memo(function CalendarTab({ facilityId, facilityName }: CalendarTabProps) {
  // Filter calendar items for this facility
  const facilityEvents = useMemo(() => {
    return mockCalendarItems.filter((event) => event.facility_name === facilityName);
  }, [facilityName]);

  // Use shared calendar view state hook
  const calendarState = useCalendarViewState({ events: facilityEvents });

  // If no events for this facility, show empty state
  if (facilityEvents.length === 0) {
    return (
      <div
        className="text-center text-zinc-500 py-12"
        data-testid="facility-calendar-empty"
      >
        No calendar events for this facility
      </div>
    );
  }

  return (
    <div data-testid={`facility-calendar-tab-${facilityId}`}>
      <CalendarView
        currentMonth={calendarState.currentMonth}
        filteredItems={calendarState.filteredItems}
        onPreviousMonth={calendarState.handlePreviousMonth}
        onNextMonth={calendarState.handleNextMonth}
        onToday={calendarState.handleToday}
        today={calendarState.today}
        onEventStatusChange={calendarState.handleEventStatusChange}
      />
    </div>
  );
});
