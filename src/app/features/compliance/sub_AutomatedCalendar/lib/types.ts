// =============================================================================
// Automated Compliance Calendar Types
// =============================================================================

import type { ItemType, ItemStatus } from '../../lib/types';

/**
 * Reminder channel types for notifications
 */
export type ReminderChannel = 'email' | 'slack' | 'in_app' | 'calendar_push';

/**
 * Reminder timing options (days before deadline)
 */
export type ReminderTiming = 1 | 3 | 7 | 14 | 30;

/**
 * Calendar sync status
 */
export type CalendarSyncStatus = 'not_connected' | 'syncing' | 'synced' | 'error';

/**
 * Calendar provider types for export/sync
 */
export type CalendarProvider = 'outlook' | 'google' | 'ical' | 'apple';

/**
 * Compliance event priority levels
 */
export type EventPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Helper function for event priority color styling
 */
export function getEventPriorityColor(priority: EventPriority): string {
  switch (priority) {
    case 'low':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'medium':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'high':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'critical':
      return 'bg-red-100 text-red-700 border-red-200';
  }
}

/**
 * Helper function for event priority badge styling
 */
export function getEventPriorityBadgeVariant(priority: EventPriority): 'success' | 'info' | 'warning' | 'destructive' {
  switch (priority) {
    case 'low':
      return 'success';
    case 'medium':
      return 'info';
    case 'high':
      return 'warning';
    case 'critical':
      return 'destructive';
  }
}

/**
 * Reminder configuration for a specific deadline
 */
export interface ReminderConfig {
  id: string;
  event_id: string;
  timing_days: ReminderTiming;
  channels: ReminderChannel[];
  recipients: string[];
  is_active: boolean;
  sent_at?: string;
  created_at: string;
}

/**
 * Calendar event generated from covenant or obligation
 */
export interface AutomatedCalendarEvent {
  id: string;
  source_type: 'covenant' | 'obligation';
  source_id: string;
  source_name: string;

  // Event details
  title: string;
  description: string;
  event_type: ItemType;
  date: string;
  deadline_time?: string;

  // Associated facility
  facility_id: string;
  facility_name: string;
  borrower_name: string;

  // Status tracking
  status: ItemStatus;
  priority: EventPriority;

  // Recurrence info
  frequency: 'one_time' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
  next_occurrence?: string;
  recurrence_end_date?: string;

  // Deadline specifics
  deadline_days_after_period?: number;
  period_start?: string;
  period_end?: string;
  grace_period_days?: number;

  // Recipient info
  recipient_role?: string;
  recipient_emails?: string[];

  // Completion tracking
  completed_at?: string;
  completed_by?: string;
  completion_document_id?: string;
  compliance_certificate_id?: string;

  // Reminders
  reminders: ReminderConfig[];

  // Metadata
  clause_reference?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Calendar sync configuration
 */
export interface CalendarSyncConfig {
  id: string;
  user_id: string;
  provider: CalendarProvider;
  calendar_id?: string;
  calendar_name?: string;
  sync_status: CalendarSyncStatus;
  last_sync_at?: string;
  sync_error?: string;
  auto_sync_enabled: boolean;
  sync_interval_minutes: number;
  created_at: string;
  updated_at: string;
}

/**
 * Default reminder settings for new events
 */
export interface DefaultReminderSettings {
  covenant_test: {
    timings: ReminderTiming[];
    channels: ReminderChannel[];
  };
  compliance_event: {
    timings: ReminderTiming[];
    channels: ReminderChannel[];
  };
  notification_due: {
    timings: ReminderTiming[];
    channels: ReminderChannel[];
  };
  waiver_expiration: {
    timings: ReminderTiming[];
    channels: ReminderChannel[];
  };
}

/**
 * User notification preferences
 */
export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_enabled: boolean;
  email_address: string;
  slack_enabled: boolean;
  slack_webhook_url?: string;
  slack_channel?: string;
  in_app_enabled: boolean;
  calendar_push_enabled: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  timezone: string;
  default_reminder_settings: DefaultReminderSettings;
  created_at: string;
  updated_at: string;
}

/**
 * Calendar view filter options
 */
export interface CalendarFilterOptions {
  event_types: ItemType[];
  statuses: ItemStatus[];
  priorities: EventPriority[];
  facilities: string[];
  date_range: {
    start: string;
    end: string;
  };
  show_completed: boolean;
}

/**
 * iCal export event format
 */
export interface ICalEvent {
  uid: string;
  summary: string;
  description: string;
  dtstart: string;
  dtend?: string;
  location?: string;
  categories: string[];
  priority: number;
  status: 'TENTATIVE' | 'CONFIRMED' | 'CANCELLED';
  alarm?: {
    trigger: string;
    action: 'DISPLAY' | 'EMAIL';
    description?: string;
  }[];
}

/**
 * Bulk event generation request
 */
export interface BulkEventGenerationRequest {
  facility_ids?: string[];
  include_covenants: boolean;
  include_obligations: boolean;
  start_date: string;
  end_date: string;
  apply_default_reminders: boolean;
}

/**
 * Bulk event generation result
 */
export interface BulkEventGenerationResult {
  events_created: number;
  events_updated: number;
  events_skipped: number;
  errors: Array<{
    source_type: string;
    source_id: string;
    error: string;
  }>;
}

/**
 * Calendar statistics
 */
export interface CalendarStats {
  total_events: number;
  upcoming_7_days: number;
  upcoming_30_days: number;
  overdue_count: number;
  completed_this_month: number;
  by_type: Record<ItemType, number>;
  by_priority: Record<EventPriority, number>;
  by_status: Record<ItemStatus, number>;
  compliance_rate: number;
}

/**
 * Notification log entry
 */
export interface NotificationLog {
  id: string;
  event_id: string;
  reminder_id: string;
  channel: ReminderChannel;
  recipient: string;
  sent_at: string;
  status: 'sent' | 'failed' | 'bounced' | 'opened';
  error_message?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Compliance certificate upload
 */
export interface ComplianceCertificateUpload {
  id: string;
  event_id: string;
  facility_id: string;
  document_id: string;
  filename: string;
  file_size: number;
  uploaded_by: string;
  uploaded_at: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  verified_by?: string;
  verified_at?: string;
  notes?: string;
}
