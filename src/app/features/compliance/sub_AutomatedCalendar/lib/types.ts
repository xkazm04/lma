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
  /** Escalation level for this reminder (optional) */
  escalation_level?: 1 | 2 | 3 | 4;
  /** Assigned user ID at this level (optional) */
  assignee_id?: string;
  /** Assigned user name at this level (optional) */
  assignee_name?: string;
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

  // Escalation
  /** Associated escalation chain ID */
  escalation_chain_id?: string;
  /** Current escalation event (if escalated) */
  escalation?: {
    id: string;
    status: 'not_escalated' | 'level_1' | 'level_2' | 'level_3' | 'level_4' | 'snoozed' | 'resolved';
    current_level: 1 | 2 | 3 | 4 | null;
    current_assignee_id: string | null;
    current_assignee_name: string | null;
    is_snoozed: boolean;
    snooze_until?: string;
    snooze_reason?: string;
  };

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

// =============================================================================
// Escalation Chain Types
// =============================================================================

/**
 * Escalation level tiers (like PagerDuty)
 */
export type EscalationLevel = 1 | 2 | 3 | 4;

/**
 * Helper function for escalation level label
 */
export function getEscalationLevelLabel(level: EscalationLevel): string {
  switch (level) {
    case 1:
      return 'Analyst';
    case 2:
      return 'Manager';
    case 3:
      return 'VP/Director';
    case 4:
      return 'Executive';
  }
}

/**
 * Helper function for escalation level color styling
 */
export function getEscalationLevelColor(level: EscalationLevel): string {
  switch (level) {
    case 1:
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 2:
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 3:
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 4:
      return 'bg-red-100 text-red-700 border-red-200';
  }
}

/**
 * Escalation status for an event
 */
export type EscalationStatus = 'not_escalated' | 'level_1' | 'level_2' | 'level_3' | 'level_4' | 'snoozed' | 'resolved';

/**
 * Helper function for escalation status color styling
 */
export function getEscalationStatusColor(status: EscalationStatus): string {
  switch (status) {
    case 'not_escalated':
      return 'bg-zinc-100 text-zinc-600';
    case 'level_1':
      return 'bg-blue-100 text-blue-700';
    case 'level_2':
      return 'bg-amber-100 text-amber-700';
    case 'level_3':
      return 'bg-orange-100 text-orange-700';
    case 'level_4':
      return 'bg-red-100 text-red-700';
    case 'snoozed':
      return 'bg-purple-100 text-purple-700';
    case 'resolved':
      return 'bg-green-100 text-green-700';
  }
}

/**
 * Helper function for escalation status label
 */
export function getEscalationStatusLabel(status: EscalationStatus): string {
  switch (status) {
    case 'not_escalated':
      return 'Not Escalated';
    case 'level_1':
      return 'Level 1 - Analyst';
    case 'level_2':
      return 'Level 2 - Manager';
    case 'level_3':
      return 'Level 3 - VP/Director';
    case 'level_4':
      return 'Level 4 - Executive';
    case 'snoozed':
      return 'Snoozed';
    case 'resolved':
      return 'Resolved';
  }
}

/**
 * Individual assignee for an escalation level
 */
export interface EscalationAssignee {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
}

/**
 * Single escalation step within a chain
 */
export interface EscalationStep {
  id: string;
  level: EscalationLevel;
  /** Days overdue before this level triggers */
  trigger_days_overdue: number;
  /** Assignees at this level */
  assignees: EscalationAssignee[];
  /** Notification channels for this level */
  channels: ReminderChannel[];
  /** Whether to also notify all previous level assignees */
  notify_previous_levels: boolean;
}

/**
 * Complete escalation chain configuration
 */
export interface EscalationChain {
  id: string;
  name: string;
  description: string;
  /** Whether this chain is currently active */
  is_active: boolean;
  /** Event types this chain applies to */
  applies_to_event_types: ('covenant_test' | 'compliance_event' | 'notification_due' | 'waiver_expiration')[];
  /** Facility IDs this chain applies to (empty = all) */
  applies_to_facility_ids: string[];
  /** The escalation steps in order */
  steps: EscalationStep[];
  /** Created timestamp */
  created_at: string;
  /** Updated timestamp */
  updated_at: string;
  /** Created by user */
  created_by: string;
}

/**
 * Default escalation chain for new events
 */
export interface DefaultEscalationChainSettings {
  covenant_test: string | null; // Chain ID or null for no escalation
  compliance_event: string | null;
  notification_due: string | null;
  waiver_expiration: string | null;
}

/**
 * Snooze configuration for an escalation
 */
export interface EscalationSnooze {
  id: string;
  event_id: string;
  /** User who snoozed the escalation */
  snoozed_by: string;
  snoozed_by_name: string;
  /** Timestamp when snoozed */
  snoozed_at: string;
  /** Timestamp when snooze expires */
  snooze_until: string;
  /** Required justification for snoozing */
  reason: string;
  /** Whether the snooze is still active */
  is_active: boolean;
  /** Auto-logged to audit trail */
  audit_logged: boolean;
}

/**
 * Escalation event (a specific escalation occurrence)
 */
export interface EscalationEvent {
  id: string;
  /** The calendar event being escalated */
  event_id: string;
  /** The escalation chain being used */
  chain_id: string;
  chain_name: string;
  /** Current escalation status */
  status: EscalationStatus;
  /** Current escalation level */
  current_level: EscalationLevel | null;
  /** Timestamp when escalation started */
  started_at: string;
  /** Timestamp of last escalation */
  last_escalated_at: string | null;
  /** Current assignee ID */
  current_assignee_id: string | null;
  /** Current assignee name */
  current_assignee_name: string | null;
  /** Days overdue */
  days_overdue: number;
  /** Snooze history */
  snoozes: EscalationSnooze[];
  /** Whether currently snoozed */
  is_snoozed: boolean;
  /** Active snooze (if snoozed) */
  active_snooze?: EscalationSnooze;
  /** Timestamp when resolved */
  resolved_at: string | null;
  /** How it was resolved */
  resolution_notes: string | null;
}

/**
 * Audit log entry type for escalations
 */
export type EscalationAuditAction =
  | 'escalation_started'
  | 'escalation_level_increased'
  | 'escalation_assigned'
  | 'escalation_snoozed'
  | 'snooze_expired'
  | 'escalation_resolved'
  | 'escalation_acknowledged'
  | 'notification_sent';

/**
 * Audit trail entry for escalation actions
 */
export interface EscalationAuditEntry {
  id: string;
  /** The escalation event ID */
  escalation_id: string;
  /** The calendar event ID */
  event_id: string;
  /** Type of action */
  action: EscalationAuditAction;
  /** User who performed the action (null for system) */
  performed_by: string | null;
  performed_by_name: string | null;
  /** Timestamp of action */
  timestamp: string;
  /** Previous escalation level (if applicable) */
  previous_level: EscalationLevel | null;
  /** New escalation level (if applicable) */
  new_level: EscalationLevel | null;
  /** Previous assignee (if applicable) */
  previous_assignee: string | null;
  /** New assignee (if applicable) */
  new_assignee: string | null;
  /** Details about the action */
  details: string;
  /** Snooze reason (for snooze actions) */
  snooze_reason?: string;
  /** Snooze duration in hours (for snooze actions) */
  snooze_duration_hours?: number;
  /** Notification channels used (for notification actions) */
  notification_channels?: ReminderChannel[];
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Escalation statistics for dashboard
 */
export interface EscalationStats {
  total_active_escalations: number;
  level_1_count: number;
  level_2_count: number;
  level_3_count: number;
  level_4_count: number;
  snoozed_count: number;
  resolved_today: number;
  average_resolution_time_hours: number;
  escalations_by_event_type: Record<string, number>;
}
