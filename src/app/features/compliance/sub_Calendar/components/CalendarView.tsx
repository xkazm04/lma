'use client';

import React, { memo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CalendarEvent, ItemStatus } from '../../lib';
import { getItemTypeCalendarColor } from '../../lib';
import { DayEventsModal } from './DayEventsModal';

interface CalendarViewProps {
  currentMonth: Date;
  filteredItems: CalendarEvent[];
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  today: string;
  onEventStatusChange?: (eventId: string, newStatus: ItemStatus) => void;
}

export const CalendarView = memo(function CalendarView({
  currentMonth,
  filteredItems,
  onPreviousMonth,
  onNextMonth,
  onToday,
  today,
  onEventStatusChange,
}: CalendarViewProps) {
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Modal state for expanded day view
  const [selectedDay, setSelectedDay] = useState<{ date: string; events: CalendarEvent[] } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDayClick = useCallback((date: string, events: CalendarEvent[]) => {
    if (events.length > 0) {
      setSelectedDay({ date, events });
      setIsModalOpen(true);
    }
  }, []);

  const handleMoreClick = useCallback((e: React.MouseEvent, date: string, events: CalendarEvent[]) => {
    e.stopPropagation();
    setSelectedDay({ date, events });
    setIsModalOpen(true);
  }, []);

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days = [];

    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const events = filteredItems.filter((item) => item.date === dateStr);
      days.push({ day, date: dateStr, events });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  return (
    <Card className="animate-in fade-in slide-in-from-top-3">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={onPreviousMonth}
            className="hover:bg-zinc-100 transition-colors"
            data-testid="calendar-prev-month-btn"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-semibold text-zinc-900 min-w-[180px] text-center">
            {monthName}
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={onNextMonth}
            className="hover:bg-zinc-100 transition-colors"
            data-testid="calendar-next-month-btn"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={onToday}
          className="hover:bg-zinc-100 transition-colors"
          data-testid="calendar-today-btn"
        >
          Today
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-px bg-zinc-200 rounded-lg overflow-hidden">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="bg-zinc-100 py-2 text-center text-sm font-medium text-zinc-600">
              {day}
            </div>
          ))}

          {calendarDays.map((dayData, index) => (
            <div
              key={index}
              className={cn(
                'bg-white min-h-[100px] p-2 transition-all',
                dayData?.date === today && 'ring-2 ring-inset ring-blue-500',
                dayData?.events?.length && 'cursor-pointer hover:bg-zinc-50'
              )}
              onClick={() => dayData?.events?.length && handleDayClick(dayData.date, dayData.events)}
              data-testid={dayData ? `calendar-day-${dayData.date}` : undefined}
            >
              {dayData && (
                <>
                  <div
                    className={cn(
                      'text-sm font-medium mb-1 transition-colors',
                      dayData.date === today ? 'text-blue-600' : 'text-zinc-900'
                    )}
                  >
                    {dayData.day}
                  </div>
                  <div className="space-y-1">
                    {dayData.events.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          'text-xs p-1 rounded truncate transition-all hover:shadow-sm',
                          getItemTypeCalendarColor(event.type)
                        )}
                        title={event.title}
                        data-testid={`calendar-event-${event.id}`}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayData.events.length > 3 && (
                      <button
                        type="button"
                        className="relative text-xs text-zinc-500 pl-1 hover:text-zinc-900 hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded min-h-[44px] flex items-center after:content-[''] after:absolute after:-inset-2 after:rounded"
                        onClick={(e) => handleMoreClick(e, dayData.date, dayData.events)}
                        data-testid={`calendar-more-btn-${dayData.date}`}
                      >
                        +{dayData.events.length - 3} more
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>

      {/* Day Events Modal */}
      {selectedDay && (
        <DayEventsModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          date={selectedDay.date}
          events={selectedDay.events}
          onStatusChange={onEventStatusChange}
        />
      )}
    </Card>
  );
});
