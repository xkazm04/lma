'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { toast } from '@/components/ui/use-toast';
import type { CalendarEvent, ItemStatus } from './types';

/**
 * Configuration options for useCalendarViewState hook
 */
export interface UseCalendarViewStateOptions {
  /** Source events to manage */
  events: CalendarEvent[];
  /** Optional initial month (defaults to current month) */
  initialMonth?: Date;
}

/**
 * Return type for useCalendarViewState hook
 */
export interface UseCalendarViewStateReturn {
  /** Current month being displayed */
  currentMonth: Date;
  /** Filtered events with up-to-date statuses */
  filteredItems: CalendarEvent[];
  /** Today's date as ISO string (YYYY-MM-DD) */
  today: string;
  /** Navigate to previous month */
  handlePreviousMonth: () => void;
  /** Navigate to next month */
  handleNextMonth: () => void;
  /** Navigate to current month */
  handleToday: () => void;
  /** Update an event's status */
  handleEventStatusChange: (eventId: string, newStatus: ItemStatus) => void;
  /** Whether a status update is in progress */
  isUpdating: boolean;
}

/**
 * API response type for calendar event status update
 */
interface CalendarEventStatusApiResponse {
  success: boolean;
  data?: {
    id: string;
    status: string;
    updated_at: string;
    updated_by?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Shared hook for calendar view state management.
 * Encapsulates common state and callbacks used by both CalendarPage and CalendarTab.
 *
 * @example
 * // In CalendarPage (all events)
 * const calendarState = useCalendarViewState({ events: allFilteredEvents });
 *
 * // In CalendarTab (facility-specific events)
 * const facilityEvents = allEvents.filter(e => e.facility_name === facilityName);
 * const calendarState = useCalendarViewState({ events: facilityEvents });
 *
 * return (
 *   <CalendarView
 *     currentMonth={calendarState.currentMonth}
 *     filteredItems={calendarState.filteredItems}
 *     onPreviousMonth={calendarState.handlePreviousMonth}
 *     onNextMonth={calendarState.handleNextMonth}
 *     onToday={calendarState.handleToday}
 *     today={calendarState.today}
 *     onEventStatusChange={calendarState.handleEventStatusChange}
 *   />
 * );
 */
export function useCalendarViewState({
  events,
  initialMonth,
}: UseCalendarViewStateOptions): UseCalendarViewStateReturn {
  // Month navigation state
  const [currentMonth, setCurrentMonth] = useState<Date>(() => initialMonth ?? new Date());

  // Local status overrides for optimistic UI updates
  const [eventStatuses, setEventStatuses] = useState<Record<string, ItemStatus>>({});

  // Track in-flight updates for loading state
  const [isUpdating, setIsUpdating] = useState(false);

  // Abort controller for cancelling pending requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Today's date as ISO string for highlighting
  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Merge source events with local status overrides
  const filteredItems = useMemo(() => {
    return events.map((event) => ({
      ...event,
      status: eventStatuses[event.id] ?? event.status,
    }));
  }, [events, eventStatuses]);

  // Navigation handlers
  const handlePreviousMonth = useCallback(() => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const handleToday = useCallback(() => {
    setCurrentMonth(new Date());
  }, []);

  /**
   * Event status change handler with optimistic updates.
   * 1. Immediately updates UI (optimistic)
   * 2. Persists to API
   * 3. Reverts on error with toast notification
   */
  const handleEventStatusChange = useCallback((eventId: string, newStatus: ItemStatus) => {
    // Get previous status for potential rollback
    const previousStatus = eventStatuses[eventId] ?? events.find(e => e.id === eventId)?.status;

    // Optimistic update - apply immediately for responsive UI
    setEventStatuses((prev) => ({
      ...prev,
      [eventId]: newStatus,
    }));

    // Cancel any pending request for this event
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    // Persist to API
    setIsUpdating(true);

    fetch(`/api/compliance/calendar/events/${encodeURIComponent(eventId)}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: newStatus }),
      signal: abortControllerRef.current.signal,
    })
      .then(async (response) => {
        const result: CalendarEventStatusApiResponse = await response.json();

        if (!result.success) {
          // API returned error, rollback
          throw new Error(result.error?.message || 'Failed to update status');
        }

        // Success - show confirmation toast
        toast({
          title: 'Status Updated',
          description: `Event status changed to ${newStatus}`,
        });
      })
      .catch((error) => {
        // Ignore abort errors (user triggered new update)
        if (error.name === 'AbortError') {
          return;
        }

        // Rollback to previous status
        setEventStatuses((prev) => {
          const next = { ...prev };
          if (previousStatus) {
            next[eventId] = previousStatus;
          } else {
            delete next[eventId];
          }
          return next;
        });

        // Show error toast
        toast({
          title: 'Update Failed',
          description: error.message || 'Failed to update event status. Please try again.',
          variant: 'destructive',
        });
      })
      .finally(() => {
        setIsUpdating(false);
        abortControllerRef.current = null;
      });
  }, [events, eventStatuses]);

  return {
    currentMonth,
    filteredItems,
    today,
    handlePreviousMonth,
    handleNextMonth,
    handleToday,
    handleEventStatusChange,
    isUpdating,
  };
}
