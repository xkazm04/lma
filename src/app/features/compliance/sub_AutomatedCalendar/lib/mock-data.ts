// =============================================================================
// Mock Data for Automated Compliance Calendar
// =============================================================================

import type {
  AutomatedCalendarEvent,
  CalendarStats,
  CalendarSyncConfig,
  NotificationPreferences,
  NotificationLog,
  ComplianceCertificateUpload,
} from './types';
import { mockCovenants, mockObligations, mockFacilityDetail } from '../../lib/mock-data';
import {
  generateCovenantEvents,
  generateObligationEvents,
  generateFutureOccurrences,
  DEFAULT_REMINDER_SETTINGS,
} from './event-generator';

/**
 * Generate automated calendar events from existing mock data
 */
function generateMockEvents(): AutomatedCalendarEvent[] {
  const events: AutomatedCalendarEvent[] = [];
  const defaultRecipients = ['compliance@company.com', 'john.smith@company.com'];

  // Generate events from covenants
  for (const covenant of mockCovenants) {
    const covenantEvents = generateCovenantEvents(
      covenant,
      DEFAULT_REMINDER_SETTINGS,
      defaultRecipients
    );

    // Generate 2 future occurrences for each recurring event
    for (const event of covenantEvents) {
      const allOccurrences = generateFutureOccurrences(
        event,
        2,
        DEFAULT_REMINDER_SETTINGS,
        defaultRecipients
      );
      events.push(...allOccurrences);
    }
  }

  // Generate events from obligations
  for (const obligation of mockObligations) {
    const obligationEvents = generateObligationEvents(
      obligation,
      mockFacilityDetail.id,
      mockFacilityDetail.facility_name,
      mockFacilityDetail.borrower_name,
      DEFAULT_REMINDER_SETTINGS,
      defaultRecipients
    );

    // Generate 2 future occurrences for each recurring event
    for (const event of obligationEvents) {
      const allOccurrences = generateFutureOccurrences(
        event,
        2,
        DEFAULT_REMINDER_SETTINGS,
        defaultRecipients
      );
      events.push(...allOccurrences);
    }
  }

  // Add some additional manually created events for variety
  const additionalEvents: AutomatedCalendarEvent[] = [
    {
      id: 'manual-1',
      source_type: 'obligation',
      source_id: 'manual-audit',
      source_name: 'Annual Audit',
      title: 'Annual Audited Financial Statements',
      description: 'Submit audited annual financial statements for ABC Holdings. Due within 120 days of fiscal year end.',
      event_type: 'compliance_event',
      date: '2025-04-30',
      facility_id: '1',
      facility_name: 'ABC Holdings - Term Loan A',
      borrower_name: 'ABC Holdings LLC',
      status: 'upcoming',
      priority: 'medium',
      frequency: 'annual',
      next_occurrence: '2026-04-30',
      deadline_days_after_period: 120,
      recipient_role: 'Administrative Agent',
      recipient_emails: ['compliance@company.com'],
      reminders: [
        {
          id: 'manual-1-reminder-30d',
          event_id: 'manual-1',
          timing_days: 30,
          channels: ['email', 'in_app'],
          recipients: ['compliance@company.com'],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 'manual-1-reminder-14d',
          event_id: 'manual-1',
          timing_days: 14,
          channels: ['email', 'in_app', 'slack'],
          recipients: ['compliance@company.com', 'john.smith@company.com'],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 'manual-1-reminder-7d',
          event_id: 'manual-1',
          timing_days: 7,
          channels: ['email', 'in_app', 'slack'],
          recipients: ['compliance@company.com', 'john.smith@company.com', 'manager@company.com'],
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ],
      clause_reference: 'Section 6.1(a)',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'manual-2',
      source_type: 'obligation',
      source_id: 'manual-insurance',
      source_name: 'Insurance Certificate',
      title: 'Insurance Certificate Renewal',
      description: 'Annual insurance certificate renewal for XYZ Corporation facility.',
      event_type: 'compliance_event',
      date: '2025-01-31',
      facility_id: '2',
      facility_name: 'XYZ Corp - Revolving Facility',
      borrower_name: 'XYZ Corporation',
      status: 'pending',
      priority: 'high',
      frequency: 'annual',
      next_occurrence: '2026-01-31',
      recipient_role: 'Administrative Agent',
      recipient_emails: ['compliance@company.com'],
      reminders: [
        {
          id: 'manual-2-reminder-14d',
          event_id: 'manual-2',
          timing_days: 14,
          channels: ['email', 'in_app'],
          recipients: ['compliance@company.com'],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 'manual-2-reminder-7d',
          event_id: 'manual-2',
          timing_days: 7,
          channels: ['email', 'in_app', 'slack'],
          recipients: ['compliance@company.com', 'john.smith@company.com'],
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ],
      clause_reference: 'Section 6.5',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'manual-3',
      source_type: 'obligation',
      source_id: 'manual-material-event',
      source_name: 'Material Event Notice',
      title: 'Material Event Notification Deadline',
      description: 'Deadline to notify lenders of material adverse event reported by Neptune Holdings.',
      event_type: 'notification_due',
      date: '2024-12-20',
      facility_id: '4',
      facility_name: 'Neptune Holdings - Senior Secured',
      borrower_name: 'Neptune Holdings Inc',
      status: 'pending',
      priority: 'high',
      frequency: 'one_time',
      deadline_days_after_period: 5,
      recipient_role: 'All Lenders',
      recipient_emails: ['compliance@company.com', 'lender-relations@company.com'],
      reminders: [
        {
          id: 'manual-3-reminder-3d',
          event_id: 'manual-3',
          timing_days: 3,
          channels: ['email', 'in_app', 'slack'],
          recipients: ['compliance@company.com', 'lender-relations@company.com'],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 'manual-3-reminder-1d',
          event_id: 'manual-3',
          timing_days: 1,
          channels: ['email', 'in_app', 'slack'],
          recipients: ['compliance@company.com', 'lender-relations@company.com', 'legal@company.com'],
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ],
      clause_reference: 'Section 6.3',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  events.push(...additionalEvents);

  return events;
}

export const mockAutomatedEvents: AutomatedCalendarEvent[] = generateMockEvents();

export const mockCalendarStats: CalendarStats = {
  total_events: mockAutomatedEvents.length,
  upcoming_7_days: mockAutomatedEvents.filter((e) => {
    const daysUntil = Math.ceil(
      (new Date(e.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntil >= 0 && daysUntil <= 7;
  }).length,
  upcoming_30_days: mockAutomatedEvents.filter((e) => {
    const daysUntil = Math.ceil(
      (new Date(e.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntil >= 0 && daysUntil <= 30;
  }).length,
  overdue_count: mockAutomatedEvents.filter((e) => e.status === 'overdue').length,
  completed_this_month: 5,
  by_type: {
    compliance_event: mockAutomatedEvents.filter((e) => e.event_type === 'compliance_event').length,
    covenant_test: mockAutomatedEvents.filter((e) => e.event_type === 'covenant_test').length,
    notification_due: mockAutomatedEvents.filter((e) => e.event_type === 'notification_due').length,
    waiver_expiration: mockAutomatedEvents.filter((e) => e.event_type === 'waiver_expiration').length,
  },
  by_priority: {
    critical: mockAutomatedEvents.filter((e) => e.priority === 'critical').length,
    high: mockAutomatedEvents.filter((e) => e.priority === 'high').length,
    medium: mockAutomatedEvents.filter((e) => e.priority === 'medium').length,
    low: mockAutomatedEvents.filter((e) => e.priority === 'low').length,
  },
  by_status: {
    upcoming: mockAutomatedEvents.filter((e) => e.status === 'upcoming').length,
    pending: mockAutomatedEvents.filter((e) => e.status === 'pending').length,
    overdue: mockAutomatedEvents.filter((e) => e.status === 'overdue').length,
    completed: mockAutomatedEvents.filter((e) => e.status === 'completed').length,
  },
  compliance_rate: 94.5,
};

export const mockCalendarSyncConfigs: CalendarSyncConfig[] = [
  {
    id: 'sync-1',
    user_id: 'user-1',
    provider: 'outlook',
    calendar_id: 'compliance-calendar-outlook',
    calendar_name: 'LoanOS Compliance',
    sync_status: 'synced',
    last_sync_at: '2024-12-08T10:30:00Z',
    auto_sync_enabled: true,
    sync_interval_minutes: 15,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-12-08T10:30:00Z',
  },
  {
    id: 'sync-2',
    user_id: 'user-1',
    provider: 'google',
    calendar_id: 'compliance-calendar-google',
    calendar_name: 'Compliance Deadlines',
    sync_status: 'synced',
    last_sync_at: '2024-12-08T10:25:00Z',
    auto_sync_enabled: true,
    sync_interval_minutes: 30,
    created_at: '2024-02-20T14:00:00Z',
    updated_at: '2024-12-08T10:25:00Z',
  },
];

export const mockNotificationPreferences: NotificationPreferences = {
  id: 'prefs-1',
  user_id: 'user-1',
  email_enabled: true,
  email_address: 'john.smith@company.com',
  slack_enabled: true,
  slack_webhook_url: 'https://hooks.slack.com/services/xxx/yyy/zzz',
  slack_channel: '#compliance-alerts',
  in_app_enabled: true,
  calendar_push_enabled: true,
  quiet_hours_start: '22:00',
  quiet_hours_end: '07:00',
  timezone: 'America/New_York',
  default_reminder_settings: DEFAULT_REMINDER_SETTINGS,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-12-01T09:00:00Z',
};

export const mockNotificationLogs: NotificationLog[] = [
  {
    id: 'log-1',
    event_id: 'covenant-1-test-2024-12-31',
    reminder_id: 'covenant-1-test-2024-12-31-reminder-7d',
    channel: 'email',
    recipient: 'john.smith@company.com',
    sent_at: '2024-12-24T09:00:00Z',
    status: 'opened',
  },
  {
    id: 'log-2',
    event_id: 'covenant-1-test-2024-12-31',
    reminder_id: 'covenant-1-test-2024-12-31-reminder-7d',
    channel: 'in_app',
    recipient: 'user-1',
    sent_at: '2024-12-24T09:00:00Z',
    status: 'sent',
  },
  {
    id: 'log-3',
    event_id: 'obligation-1-2024-12-15',
    reminder_id: 'obligation-1-2024-12-15-reminder-3d',
    channel: 'slack',
    recipient: '#compliance-alerts',
    sent_at: '2024-12-12T09:00:00Z',
    status: 'sent',
  },
  {
    id: 'log-4',
    event_id: 'manual-3',
    reminder_id: 'manual-3-reminder-3d',
    channel: 'email',
    recipient: 'compliance@company.com',
    sent_at: '2024-12-17T09:00:00Z',
    status: 'sent',
  },
];

export const mockComplianceCertificates: ComplianceCertificateUpload[] = [
  {
    id: 'cert-1',
    event_id: 'obligation-3-2024-09-30',
    facility_id: '1',
    document_id: 'doc-cert-1',
    filename: 'Q3_2024_Compliance_Certificate_ABC_Holdings.pdf',
    file_size: 245000,
    uploaded_by: 'user-1',
    uploaded_at: '2024-11-10T14:30:00Z',
    verification_status: 'verified',
    verified_by: 'user-2',
    verified_at: '2024-11-11T09:15:00Z',
    notes: 'All covenants in compliance. No exceptions noted.',
  },
  {
    id: 'cert-2',
    event_id: 'obligation-1-2024-09-30',
    facility_id: '1',
    document_id: 'doc-cert-2',
    filename: 'Q3_2024_Financial_Statements_ABC_Holdings.pdf',
    file_size: 1250000,
    uploaded_by: 'user-1',
    uploaded_at: '2024-11-08T16:45:00Z',
    verification_status: 'verified',
    verified_by: 'user-2',
    verified_at: '2024-11-09T10:00:00Z',
  },
  {
    id: 'cert-3',
    event_id: 'obligation-4-2024-11-30',
    facility_id: '1',
    document_id: 'doc-cert-3',
    filename: 'November_2024_Borrowing_Base_Certificate.pdf',
    file_size: 185000,
    uploaded_by: 'user-1',
    uploaded_at: '2024-12-05T11:20:00Z',
    verification_status: 'pending',
    notes: 'Pending review by credit team.',
  },
];
