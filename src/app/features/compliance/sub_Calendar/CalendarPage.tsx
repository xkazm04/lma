'use client';

import React, { useState, useMemo, memo } from 'react';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimatedViewTransition } from '@/components/ui';
import { List, Grid } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { ComplianceFiltersBar } from '../components';
import { mockCalendarItems, useCalendarViewState } from '../lib';
import { CalendarView, ListView } from './components';

export const CalendarPage = memo(function CalendarPage() {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');
  const [typeFilter, setTypeFilter] = useState('all');
  const [facilityFilter, setFacilityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter events based on type, facility, and search query
  const filteredEvents = useMemo(() => {
    return mockCalendarItems.filter((item) => {
      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      const matchesFacility = facilityFilter === 'all' || item.facility_name === facilityFilter;
      const matchesSearch = searchQuery === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.facility_name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesFacility && matchesSearch;
    });
  }, [typeFilter, facilityFilter, searchQuery]);

  // Use shared calendar view state hook - start at December 2024 to match mock data
  const calendarState = useCalendarViewState({
    events: filteredEvents,
    initialMonth: new Date(2024, 11, 1), // December 2024
  });

  const groupedItems = useMemo(() => {
    return calendarState.filteredItems.reduce((acc, item) => {
      if (!acc[item.date]) {
        acc[item.date] = [];
      }
      acc[item.date].push(item);
      return acc;
    }, {} as Record<string, typeof mockCalendarItems>);
  }, [calendarState.filteredItems]);

  const sortedDates = useMemo(() => {
    return Object.keys(groupedItems).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [groupedItems]);

  const facilities = useMemo(() => {
    return [...new Set(mockCalendarItems.map((item) => item.facility_name))];
  }, []);

  return (
    <PageContainer>
      <div className="space-y-4 animate-in fade-in">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-zinc-500 mb-1">
              <Link href="/compliance" className="hover:text-zinc-900 transition-colors">
                Compliance
              </Link>
              <span>/</span>
              <span className="text-zinc-900">Calendar</span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">Obligation Calendar</h1>
            <p className="text-zinc-500 text-sm">View all compliance deadlines and events</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <ComplianceFiltersBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter="all"
                onStatusChange={() => {}}
                typeFilter={typeFilter}
                onTypeChange={setTypeFilter}
                facilityFilter={facilityFilter}
                onFacilityChange={setFacilityFilter}
                facilities={facilities}
              />
            </div>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'calendar' | 'list')}>
              <TabsList>
                <TabsTrigger value="list" className="transition-all" data-testid="calendar-view-list-tab">
                  <List className="w-4 h-4 mr-1" />
                  List
                </TabsTrigger>
                <TabsTrigger value="calendar" className="transition-all" data-testid="calendar-view-calendar-tab">
                  <Grid className="w-4 h-4 mr-1" />
                  Calendar
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-zinc-500">Event Types:</span>
            {[
              { color: 'bg-blue-500', label: 'Compliance' },
              { color: 'bg-purple-500', label: 'Covenant' },
              { color: 'bg-amber-500', label: 'Notification' },
              { color: 'bg-red-500', label: 'Waiver' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${color}`} />
                <span className="text-zinc-600">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <AnimatedViewTransition viewKey={viewMode} data-testid="calendar-view-transition">
          {viewMode === 'list' ? (
            <ListView groupedItems={groupedItems} sortedDates={sortedDates} today={calendarState.today} />
          ) : (
            <CalendarView
              currentMonth={calendarState.currentMonth}
              filteredItems={calendarState.filteredItems}
              onPreviousMonth={calendarState.handlePreviousMonth}
              onNextMonth={calendarState.handleNextMonth}
              onToday={calendarState.handleToday}
              today={calendarState.today}
              onEventStatusChange={calendarState.handleEventStatusChange}
            />
          )}
        </AnimatedViewTransition>
      </div>
    </PageContainer>
  );
});
