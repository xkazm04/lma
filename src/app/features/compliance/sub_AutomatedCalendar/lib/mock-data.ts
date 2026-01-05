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
  EscalationChain,
  EscalationEvent,
  EscalationAuditEntry,
  EscalationStats,
  EscalationAssignee,
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

// =============================================================================
// Mock Escalation Chain Data
// =============================================================================

/**
 * Mock assignees for escalation chains
 */
export const mockEscalationAssignees: EscalationAssignee[] = [
  {
    id: 'user-analyst-1',
    name: 'Sarah Chen',
    email: 'sarah.chen@company.com',
    role: 'Compliance Analyst',
  },
  {
    id: 'user-analyst-2',
    name: 'Michael Brown',
    email: 'michael.brown@company.com',
    role: 'Compliance Analyst',
  },
  {
    id: 'user-manager-1',
    name: 'Jennifer Williams',
    email: 'jennifer.williams@company.com',
    role: 'Compliance Manager',
    phone: '+1-555-0101',
  },
  {
    id: 'user-manager-2',
    name: 'Robert Davis',
    email: 'robert.davis@company.com',
    role: 'Compliance Manager',
    phone: '+1-555-0102',
  },
  {
    id: 'user-vp-1',
    name: 'Elizabeth Taylor',
    email: 'elizabeth.taylor@company.com',
    role: 'VP of Compliance',
    phone: '+1-555-0201',
  },
  {
    id: 'user-exec-1',
    name: 'James Anderson',
    email: 'james.anderson@company.com',
    role: 'Chief Risk Officer',
    phone: '+1-555-0301',
  },
];

/**
 * Mock escalation chains
 */
export const mockEscalationChains: EscalationChain[] = [
  {
    id: 'chain-1',
    name: 'Standard Covenant Escalation',
    description: 'Default escalation chain for covenant test deadlines. Escalates from analyst to manager at 3 days overdue, VP at 7 days, and executive at 14 days.',
    is_active: true,
    applies_to_event_types: ['covenant_test'],
    applies_to_facility_ids: [],
    steps: [
      {
        id: 'step-1-1',
        level: 1,
        trigger_days_overdue: 0,
        assignees: [mockEscalationAssignees[0], mockEscalationAssignees[1]],
        channels: ['email', 'in_app'],
        notify_previous_levels: false,
      },
      {
        id: 'step-1-2',
        level: 2,
        trigger_days_overdue: 3,
        assignees: [mockEscalationAssignees[2]],
        channels: ['email', 'in_app', 'slack'],
        notify_previous_levels: true,
      },
      {
        id: 'step-1-3',
        level: 3,
        trigger_days_overdue: 7,
        assignees: [mockEscalationAssignees[4]],
        channels: ['email', 'in_app', 'slack'],
        notify_previous_levels: true,
      },
      {
        id: 'step-1-4',
        level: 4,
        trigger_days_overdue: 14,
        assignees: [mockEscalationAssignees[5]],
        channels: ['email', 'in_app', 'slack', 'calendar_push'],
        notify_previous_levels: true,
      },
    ],
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-06-01T14:30:00Z',
    created_by: 'user-admin',
  },
  {
    id: 'chain-2',
    name: 'Critical Compliance Escalation',
    description: 'Fast-track escalation for critical compliance events. Shorter intervals: 1 day to manager, 3 days to VP, 5 days to executive.',
    is_active: true,
    applies_to_event_types: ['compliance_event', 'waiver_expiration'],
    applies_to_facility_ids: [],
    steps: [
      {
        id: 'step-2-1',
        level: 1,
        trigger_days_overdue: 0,
        assignees: [mockEscalationAssignees[0]],
        channels: ['email', 'in_app', 'slack'],
        notify_previous_levels: false,
      },
      {
        id: 'step-2-2',
        level: 2,
        trigger_days_overdue: 1,
        assignees: [mockEscalationAssignees[2], mockEscalationAssignees[3]],
        channels: ['email', 'in_app', 'slack'],
        notify_previous_levels: true,
      },
      {
        id: 'step-2-3',
        level: 3,
        trigger_days_overdue: 3,
        assignees: [mockEscalationAssignees[4]],
        channels: ['email', 'in_app', 'slack', 'calendar_push'],
        notify_previous_levels: true,
      },
      {
        id: 'step-2-4',
        level: 4,
        trigger_days_overdue: 5,
        assignees: [mockEscalationAssignees[5]],
        channels: ['email', 'in_app', 'slack', 'calendar_push'],
        notify_previous_levels: true,
      },
    ],
    created_at: '2024-02-20T14:00:00Z',
    updated_at: '2024-06-01T14:30:00Z',
    created_by: 'user-admin',
  },
  {
    id: 'chain-3',
    name: 'Notification Due Escalation',
    description: 'Standard escalation for notification deadlines with moderate urgency.',
    is_active: true,
    applies_to_event_types: ['notification_due'],
    applies_to_facility_ids: [],
    steps: [
      {
        id: 'step-3-1',
        level: 1,
        trigger_days_overdue: 0,
        assignees: [mockEscalationAssignees[1]],
        channels: ['email', 'in_app'],
        notify_previous_levels: false,
      },
      {
        id: 'step-3-2',
        level: 2,
        trigger_days_overdue: 2,
        assignees: [mockEscalationAssignees[3]],
        channels: ['email', 'in_app', 'slack'],
        notify_previous_levels: true,
      },
      {
        id: 'step-3-3',
        level: 3,
        trigger_days_overdue: 5,
        assignees: [mockEscalationAssignees[4]],
        channels: ['email', 'in_app', 'slack'],
        notify_previous_levels: true,
      },
    ],
    created_at: '2024-03-10T09:00:00Z',
    updated_at: '2024-06-01T14:30:00Z',
    created_by: 'user-admin',
  },
];

/**
 * Mock active escalation events
 */
export const mockEscalationEvents: EscalationEvent[] = [
  {
    id: 'esc-1',
    event_id: 'manual-3',
    chain_id: 'chain-2',
    chain_name: 'Critical Compliance Escalation',
    status: 'level_2',
    current_level: 2,
    started_at: '2024-12-17T09:00:00Z',
    last_escalated_at: '2024-12-18T09:00:00Z',
    current_assignee_id: 'user-manager-1',
    current_assignee_name: 'Jennifer Williams',
    days_overdue: 2,
    snoozes: [],
    is_snoozed: false,
    resolved_at: null,
    resolution_notes: null,
  },
  {
    id: 'esc-2',
    event_id: 'manual-2',
    chain_id: 'chain-1',
    chain_name: 'Standard Covenant Escalation',
    status: 'snoozed',
    current_level: 1,
    started_at: '2024-12-15T09:00:00Z',
    last_escalated_at: null,
    current_assignee_id: 'user-analyst-1',
    current_assignee_name: 'Sarah Chen',
    days_overdue: 1,
    snoozes: [
      {
        id: 'snooze-1',
        event_id: 'manual-2',
        snoozed_by: 'user-analyst-1',
        snoozed_by_name: 'Sarah Chen',
        snoozed_at: '2024-12-16T10:00:00Z',
        snooze_until: '2024-12-18T10:00:00Z',
        reason: 'Waiting for updated financial statements from borrower. Expected delivery by end of day tomorrow.',
        is_active: true,
        audit_logged: true,
      },
    ],
    is_snoozed: true,
    active_snooze: {
      id: 'snooze-1',
      event_id: 'manual-2',
      snoozed_by: 'user-analyst-1',
      snoozed_by_name: 'Sarah Chen',
      snoozed_at: '2024-12-16T10:00:00Z',
      snooze_until: '2024-12-18T10:00:00Z',
      reason: 'Waiting for updated financial statements from borrower. Expected delivery by end of day tomorrow.',
      is_active: true,
      audit_logged: true,
    },
    resolved_at: null,
    resolution_notes: null,
  },
];

/**
 * Mock escalation audit log entries
 */
export const mockEscalationAuditEntries: EscalationAuditEntry[] = [
  {
    id: 'audit-1',
    escalation_id: 'esc-1',
    event_id: 'manual-3',
    action: 'escalation_started',
    performed_by: null,
    performed_by_name: 'System',
    timestamp: '2024-12-17T09:00:00Z',
    previous_level: null,
    new_level: 1,
    previous_assignee: null,
    new_assignee: 'Sarah Chen',
    details: 'Escalation initiated for overdue Material Event Notification Deadline',
  },
  {
    id: 'audit-2',
    escalation_id: 'esc-1',
    event_id: 'manual-3',
    action: 'notification_sent',
    performed_by: null,
    performed_by_name: 'System',
    timestamp: '2024-12-17T09:00:05Z',
    previous_level: null,
    new_level: 1,
    previous_assignee: null,
    new_assignee: null,
    details: 'Initial assignment notification sent to analyst',
    notification_channels: ['email', 'in_app', 'slack'],
  },
  {
    id: 'audit-3',
    escalation_id: 'esc-1',
    event_id: 'manual-3',
    action: 'escalation_level_increased',
    performed_by: null,
    performed_by_name: 'System',
    timestamp: '2024-12-18T09:00:00Z',
    previous_level: 1,
    new_level: 2,
    previous_assignee: 'Sarah Chen',
    new_assignee: 'Jennifer Williams',
    details: 'Auto-escalated to Level 2 (Manager) after 1 day overdue threshold reached',
  },
  {
    id: 'audit-4',
    escalation_id: 'esc-2',
    event_id: 'manual-2',
    action: 'escalation_started',
    performed_by: null,
    performed_by_name: 'System',
    timestamp: '2024-12-15T09:00:00Z',
    previous_level: null,
    new_level: 1,
    previous_assignee: null,
    new_assignee: 'Sarah Chen',
    details: 'Escalation initiated for Insurance Certificate Renewal',
  },
  {
    id: 'audit-5',
    escalation_id: 'esc-2',
    event_id: 'manual-2',
    action: 'escalation_snoozed',
    performed_by: 'user-analyst-1',
    performed_by_name: 'Sarah Chen',
    timestamp: '2024-12-16T10:00:00Z',
    previous_level: 1,
    new_level: null,
    previous_assignee: 'Sarah Chen',
    new_assignee: null,
    details: 'Escalation snoozed for 48 hours',
    snooze_reason: 'Waiting for updated financial statements from borrower. Expected delivery by end of day tomorrow.',
    snooze_duration_hours: 48,
  },
];

/**
 * Mock escalation statistics
 */
export const mockEscalationStats: EscalationStats = {
  total_active_escalations: 2,
  level_1_count: 0,
  level_2_count: 1,
  level_3_count: 0,
  level_4_count: 0,
  snoozed_count: 1,
  resolved_today: 3,
  average_resolution_time_hours: 18.5,
  escalations_by_event_type: {
    covenant_test: 0,
    compliance_event: 1,
    notification_due: 1,
    waiver_expiration: 0,
  },
};
