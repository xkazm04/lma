// =============================================================================
// Automated Calendar Event Generation Logic
// =============================================================================

import type { Covenant, Obligation, CalendarEvent, ItemType, ItemStatus } from '../../lib/types';
import type {
  AutomatedCalendarEvent,
  EventPriority,
  ReminderConfig,
  DefaultReminderSettings,
  ReminderTiming,
  ReminderChannel,
} from './types';

/**
 * Default reminder settings for different event types
 */
export const DEFAULT_REMINDER_SETTINGS: DefaultReminderSettings = {
  covenant_test: {
    timings: [7, 3, 1],
    channels: ['email', 'in_app'],
  },
  compliance_event: {
    timings: [14, 7, 3],
    channels: ['email', 'in_app'],
  },
  notification_due: {
    timings: [7, 3],
    channels: ['email', 'in_app'],
  },
  waiver_expiration: {
    timings: [30, 14, 7, 1],
    channels: ['email', 'slack', 'in_app'],
  },
};

/**
 * Calculate event priority based on deadline proximity and event type
 */
export function calculateEventPriority(
  date: string,
  eventType: ItemType,
  status: ItemStatus
): EventPriority {
  const daysUntil = Math.ceil(
    (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  // Overdue events are always critical
  if (status === 'overdue' || daysUntil < 0) {
    return 'critical';
  }

  // Waiver expirations are high priority if within 14 days
  if (eventType === 'waiver_expiration') {
    if (daysUntil <= 7) return 'critical';
    if (daysUntil <= 14) return 'high';
    if (daysUntil <= 30) return 'medium';
    return 'low';
  }

  // Covenant tests are high priority
  if (eventType === 'covenant_test') {
    if (daysUntil <= 3) return 'critical';
    if (daysUntil <= 7) return 'high';
    if (daysUntil <= 14) return 'medium';
    return 'low';
  }

  // Standard deadline proximity rules
  if (daysUntil <= 3) return 'critical';
  if (daysUntil <= 7) return 'high';
  if (daysUntil <= 14) return 'medium';
  return 'low';
}

/**
 * Determine event status based on date and completion
 */
export function determineEventStatus(
  date: string,
  completedAt?: string
): ItemStatus {
  if (completedAt) {
    return 'completed';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(date);
  eventDate.setHours(0, 0, 0, 0);

  const daysUntil = Math.ceil(
    (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntil < 0) return 'overdue';
  if (daysUntil <= 3) return 'pending';
  return 'upcoming';
}

/**
 * Generate reminder configurations for an event
 */
export function generateReminders(
  eventId: string,
  eventType: ItemType,
  eventDate: string,
  settings: DefaultReminderSettings = DEFAULT_REMINDER_SETTINGS,
  recipients: string[] = []
): ReminderConfig[] {
  const typeSettings = settings[eventType];
  const reminders: ReminderConfig[] = [];

  for (const timing of typeSettings.timings) {
    const reminderDate = new Date(eventDate);
    reminderDate.setDate(reminderDate.getDate() - timing);

    // Only create reminders for future dates
    if (reminderDate > new Date()) {
      reminders.push({
        id: `${eventId}-reminder-${timing}d`,
        event_id: eventId,
        timing_days: timing as ReminderTiming,
        channels: typeSettings.channels as ReminderChannel[],
        recipients,
        is_active: true,
        created_at: new Date().toISOString(),
      });
    }
  }

  return reminders;
}

/**
 * Map testing frequency to event frequency
 */
function mapTestFrequency(
  frequency: string
): 'one_time' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual' {
  switch (frequency) {
    case 'monthly':
      return 'monthly';
    case 'quarterly':
      return 'quarterly';
    case 'semi_annual':
      return 'semi_annual';
    case 'annually':
    case 'annual':
      return 'annual';
    default:
      return 'quarterly';
  }
}

/**
 * Calculate next occurrence date based on frequency
 */
export function calculateNextOccurrence(
  currentDate: string,
  frequency: 'one_time' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual'
): string | undefined {
  if (frequency === 'one_time') return undefined;

  const date = new Date(currentDate);

  switch (frequency) {
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'semi_annual':
      date.setMonth(date.getMonth() + 6);
      break;
    case 'annual':
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date.toISOString().split('T')[0];
}

/**
 * Generate calendar events from a covenant
 */
export function generateCovenantEvents(
  covenant: Covenant,
  settings: DefaultReminderSettings = DEFAULT_REMINDER_SETTINGS,
  recipientEmails: string[] = []
): AutomatedCalendarEvent[] {
  const events: AutomatedCalendarEvent[] = [];
  const now = new Date();

  // Generate event for next test date
  if (covenant.next_test_date) {
    const status = determineEventStatus(covenant.next_test_date);
    const eventId = `covenant-${covenant.id}-test-${covenant.next_test_date}`;

    const event: AutomatedCalendarEvent = {
      id: eventId,
      source_type: 'covenant',
      source_id: covenant.id,
      source_name: covenant.name,
      title: `${covenant.name} Test`,
      description: `${covenant.threshold_type === 'maximum' ? 'Maximum' : 'Minimum'} ${covenant.current_threshold}x - ${covenant.covenant_type.replace(/_/g, ' ')}`,
      event_type: 'covenant_test',
      date: covenant.next_test_date,
      facility_id: covenant.facility_id,
      facility_name: covenant.facility_name,
      borrower_name: covenant.borrower_name,
      status,
      priority: calculateEventPriority(covenant.next_test_date, 'covenant_test', status),
      frequency: mapTestFrequency(covenant.test_frequency),
      next_occurrence: calculateNextOccurrence(
        covenant.next_test_date,
        mapTestFrequency(covenant.test_frequency)
      ),
      reminders: generateReminders(
        eventId,
        'covenant_test',
        covenant.next_test_date,
        settings,
        recipientEmails
      ),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    events.push(event);
  }

  // Generate waiver expiration event if applicable
  if (covenant.waiver?.expiration_date) {
    const status = determineEventStatus(covenant.waiver.expiration_date);
    const eventId = `covenant-${covenant.id}-waiver-${covenant.waiver.expiration_date}`;

    const event: AutomatedCalendarEvent = {
      id: eventId,
      source_type: 'covenant',
      source_id: covenant.id,
      source_name: covenant.name,
      title: `${covenant.name} Waiver Expires`,
      description: `Waiver for ${covenant.name} expires. Ensure compliance or negotiate extension.`,
      event_type: 'waiver_expiration',
      date: covenant.waiver.expiration_date,
      facility_id: covenant.facility_id,
      facility_name: covenant.facility_name,
      borrower_name: covenant.borrower_name,
      status,
      priority: calculateEventPriority(
        covenant.waiver.expiration_date,
        'waiver_expiration',
        status
      ),
      frequency: 'one_time',
      reminders: generateReminders(
        eventId,
        'waiver_expiration',
        covenant.waiver.expiration_date,
        settings,
        recipientEmails
      ),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    events.push(event);
  }

  return events;
}

/**
 * Generate calendar events from an obligation
 */
export function generateObligationEvents(
  obligation: Obligation,
  facilityId: string,
  facilityName: string,
  borrowerName: string,
  settings: DefaultReminderSettings = DEFAULT_REMINDER_SETTINGS,
  recipientEmails: string[] = []
): AutomatedCalendarEvent[] {
  const events: AutomatedCalendarEvent[] = [];
  const now = new Date();

  if (obligation.upcoming_event) {
    const status = determineEventStatus(obligation.upcoming_event.deadline_date);
    const eventId = `obligation-${obligation.id}-${obligation.upcoming_event.deadline_date}`;

    const event: AutomatedCalendarEvent = {
      id: eventId,
      source_type: 'obligation',
      source_id: obligation.id,
      source_name: obligation.name,
      title: obligation.name,
      description: `${obligation.obligation_type.replace(/_/g, ' ')} - Due within ${obligation.deadline_days_after_period} days of period end`,
      event_type: 'compliance_event',
      date: obligation.upcoming_event.deadline_date,
      facility_id: facilityId,
      facility_name: facilityName,
      borrower_name: borrowerName,
      status,
      priority: calculateEventPriority(
        obligation.upcoming_event.deadline_date,
        'compliance_event',
        status
      ),
      frequency: mapTestFrequency(obligation.frequency),
      next_occurrence: calculateNextOccurrence(
        obligation.upcoming_event.deadline_date,
        mapTestFrequency(obligation.frequency)
      ),
      deadline_days_after_period: obligation.deadline_days_after_period,
      reminders: generateReminders(
        eventId,
        'compliance_event',
        obligation.upcoming_event.deadline_date,
        settings,
        recipientEmails
      ),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    events.push(event);
  }

  return events;
}

/**
 * Generate multiple future occurrences for a recurring event
 */
export function generateFutureOccurrences(
  baseEvent: AutomatedCalendarEvent,
  numberOfOccurrences: number = 4,
  settings: DefaultReminderSettings = DEFAULT_REMINDER_SETTINGS,
  recipientEmails: string[] = []
): AutomatedCalendarEvent[] {
  const events: AutomatedCalendarEvent[] = [baseEvent];

  if (baseEvent.frequency === 'one_time') {
    return events;
  }

  let currentDate = baseEvent.date;

  for (let i = 1; i < numberOfOccurrences; i++) {
    const nextDate = calculateNextOccurrence(currentDate, baseEvent.frequency);
    if (!nextDate) break;

    const eventId = `${baseEvent.source_type}-${baseEvent.source_id}-${nextDate}`;
    const status = determineEventStatus(nextDate);

    const event: AutomatedCalendarEvent = {
      ...baseEvent,
      id: eventId,
      date: nextDate,
      status,
      priority: calculateEventPriority(nextDate, baseEvent.event_type, status),
      next_occurrence: calculateNextOccurrence(nextDate, baseEvent.frequency),
      reminders: generateReminders(
        eventId,
        baseEvent.event_type,
        nextDate,
        settings,
        recipientEmails
      ),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    events.push(event);
    currentDate = nextDate;
  }

  return events;
}

/**
 * Generate iCal format string for an event
 */
export function generateICalEvent(event: AutomatedCalendarEvent): string {
  const uid = `${event.id}@loanos.app`;
  const dtstart = event.date.replace(/-/g, '');
  const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  let ical = `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART;VALUE=DATE:${dtstart}
SUMMARY:${event.title}
DESCRIPTION:${event.description.replace(/\n/g, '\\n')}
CATEGORIES:${event.event_type}
STATUS:${event.status === 'completed' ? 'CANCELLED' : 'CONFIRMED'}
PRIORITY:${event.priority === 'critical' ? 1 : event.priority === 'high' ? 3 : event.priority === 'medium' ? 5 : 9}
`;

  // Add alarms for reminders
  for (const reminder of event.reminders) {
    if (reminder.is_active) {
      ical += `BEGIN:VALARM
TRIGGER:-P${reminder.timing_days}D
ACTION:DISPLAY
DESCRIPTION:${event.title} due in ${reminder.timing_days} day(s)
END:VALARM
`;
    }
  }

  ical += 'END:VEVENT\n';

  return ical;
}

/**
 * Generate complete iCal calendar file
 */
export function generateICalCalendar(
  events: AutomatedCalendarEvent[],
  calendarName: string = 'LoanOS Compliance Calendar'
): string {
  const prodId = '-//LoanOS//Compliance Calendar//EN';

  let ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:${prodId}
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${calendarName}
X-WR-TIMEZONE:UTC
`;

  for (const event of events) {
    ical += generateICalEvent(event);
  }

  ical += 'END:VCALENDAR';

  return ical;
}

/**
 * Convert AutomatedCalendarEvent to CalendarEvent for compatibility
 */
export function toCalendarEvent(event: AutomatedCalendarEvent): CalendarEvent {
  return {
    id: event.id,
    facility_id: event.facility_id,
    date: event.date,
    type: event.event_type,
    title: event.title,
    facility_name: event.facility_name,
    borrower_name: event.borrower_name,
    status: event.status,
  };
}

/**
 * Sort events by date and priority
 */
export function sortEvents(events: AutomatedCalendarEvent[]): AutomatedCalendarEvent[] {
  const priorityOrder: Record<EventPriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return [...events].sort((a, b) => {
    // First sort by date
    const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateCompare !== 0) return dateCompare;

    // Then by priority
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Group events by date
 */
export function groupEventsByDate(
  events: AutomatedCalendarEvent[]
): Record<string, AutomatedCalendarEvent[]> {
  return events.reduce(
    (acc, event) => {
      if (!acc[event.date]) {
        acc[event.date] = [];
      }
      acc[event.date].push(event);
      return acc;
    },
    {} as Record<string, AutomatedCalendarEvent[]>
  );
}

/**
 * Filter events based on criteria
 */
export function filterEvents(
  events: AutomatedCalendarEvent[],
  filters: {
    eventTypes?: ItemType[];
    statuses?: ItemStatus[];
    priorities?: EventPriority[];
    facilityIds?: string[];
    startDate?: string;
    endDate?: string;
    showCompleted?: boolean;
  }
): AutomatedCalendarEvent[] {
  return events.filter((event) => {
    if (filters.eventTypes?.length && !filters.eventTypes.includes(event.event_type)) {
      return false;
    }
    if (filters.statuses?.length && !filters.statuses.includes(event.status)) {
      return false;
    }
    if (filters.priorities?.length && !filters.priorities.includes(event.priority)) {
      return false;
    }
    if (filters.facilityIds?.length && !filters.facilityIds.includes(event.facility_id)) {
      return false;
    }
    if (filters.startDate && event.date < filters.startDate) {
      return false;
    }
    if (filters.endDate && event.date > filters.endDate) {
      return false;
    }
    if (!filters.showCompleted && event.status === 'completed') {
      return false;
    }
    return true;
  });
}
