/**
 * War Room Types
 * Types for live presence, typing indicators, and negotiation theater
 */

export interface PresenceUser {
  id: string;
  name: string;
  avatar?: string;
  party_type: 'borrower_side' | 'lender_side' | 'third_party';
  is_online: boolean;
  current_view?: 'terms' | 'timeline' | 'proposals' | 'comments';
  viewing_term_id?: string | null;
  last_active: string;
}

export interface TypingIndicator {
  user_id: string;
  user_name: string;
  party_type: 'borrower_side' | 'lender_side' | 'third_party';
  term_id: string;
  action: 'proposal' | 'comment';
  started_at: string;
}

export interface NegotiationEvent {
  id: string;
  term_id: string;
  term_label: string;
  event_type: 'proposal' | 'counter_proposal' | 'comment' | 'accepted' | 'rejected' | 'locked';
  actor_name: string;
  actor_party_type: 'borrower_side' | 'lender_side' | 'third_party';
  description: string;
  old_value?: string;
  new_value?: string;
  timestamp: string;
}

export interface WarRoomMode {
  focus_mode: boolean;
  show_timeline: boolean;
  show_presence: boolean;
}

export interface HotkeyConfig {
  key: string;
  label: string;
  description: string;
  action: () => void;
}

export interface FocusModeConfig {
  show_resolved: boolean;
  highlight_critical: boolean;
  dim_level: number; // 0-100
}

export type TimelineViewMode = 'compact' | 'expanded' | 'theater';

// Mock data generators
export function generateMockPresenceUsers(): PresenceUser[] {
  return [
    {
      id: 'user-1',
      name: 'John Smith',
      party_type: 'borrower_side',
      is_online: true,
      current_view: 'terms',
      viewing_term_id: 'term-2',
      last_active: new Date().toISOString(),
    },
    {
      id: 'user-2',
      name: 'Sarah Johnson',
      party_type: 'lender_side',
      is_online: true,
      current_view: 'terms',
      viewing_term_id: 'term-4',
      last_active: new Date().toISOString(),
    },
    {
      id: 'user-3',
      name: 'Michael Chen',
      party_type: 'lender_side',
      is_online: true,
      current_view: 'proposals',
      viewing_term_id: 'term-2',
      last_active: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: 'user-4',
      name: 'Emily Davis',
      party_type: 'third_party',
      is_online: false,
      current_view: undefined,
      viewing_term_id: null,
      last_active: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
  ];
}

export function generateMockTypingIndicators(): TypingIndicator[] {
  return [
    {
      user_id: 'user-2',
      user_name: 'Sarah Johnson',
      party_type: 'lender_side',
      term_id: 'term-4',
      action: 'proposal',
      started_at: new Date().toISOString(),
    },
  ];
}

export function generateMockNegotiationEvents(): NegotiationEvent[] {
  const now = new Date();
  return [
    {
      id: 'event-1',
      term_id: 'term-1',
      term_label: 'Facility Amount',
      event_type: 'proposal',
      actor_name: 'Apollo Holdings',
      actor_party_type: 'borrower_side',
      description: 'Proposed increase to USD 500M',
      old_value: 'USD 450,000,000',
      new_value: 'USD 500,000,000',
      timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'event-2',
      term_id: 'term-1',
      term_label: 'Facility Amount',
      event_type: 'counter_proposal',
      actor_name: 'BigBank NA',
      actor_party_type: 'lender_side',
      description: 'Counter proposed USD 475M',
      old_value: 'USD 500,000,000',
      new_value: 'USD 475,000,000',
      timestamp: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'event-3',
      term_id: 'term-1',
      term_label: 'Facility Amount',
      event_type: 'accepted',
      actor_name: 'Apollo Holdings',
      actor_party_type: 'borrower_side',
      description: 'Accepted USD 500M after negotiation',
      new_value: 'USD 500,000,000',
      timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'event-4',
      term_id: 'term-1',
      term_label: 'Facility Amount',
      event_type: 'locked',
      actor_name: 'System',
      actor_party_type: 'third_party',
      description: 'Term locked after agreement',
      timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 1000).toISOString(),
    },
    {
      id: 'event-5',
      term_id: 'term-4',
      term_label: 'Interest Margin',
      event_type: 'proposal',
      actor_name: 'Apollo Holdings',
      actor_party_type: 'borrower_side',
      description: 'Proposed reduction to 2.25%',
      old_value: '3.00%',
      new_value: '2.25%',
      timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'event-6',
      term_id: 'term-4',
      term_label: 'Interest Margin',
      event_type: 'counter_proposal',
      actor_name: 'BigBank NA',
      actor_party_type: 'lender_side',
      description: 'Counter proposed 2.75%',
      old_value: '2.25%',
      new_value: '2.75%',
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'event-7',
      term_id: 'term-4',
      term_label: 'Interest Margin',
      event_type: 'counter_proposal',
      actor_name: 'Apollo Holdings',
      actor_party_type: 'borrower_side',
      description: 'Counter proposed 2.50%',
      old_value: '2.75%',
      new_value: '2.50%',
      timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'event-8',
      term_id: 'term-4',
      term_label: 'Interest Margin',
      event_type: 'comment',
      actor_name: 'Capital Partners Fund',
      actor_party_type: 'lender_side',
      description: 'Syndicate comfortable with 2.50%',
      timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'event-9',
      term_id: 'term-2',
      term_label: 'Maturity Date',
      event_type: 'proposal',
      actor_name: 'Apollo Holdings',
      actor_party_type: 'borrower_side',
      description: 'Proposed extension to Dec 2029',
      old_value: 'June 30, 2028',
      new_value: 'December 15, 2029',
      timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'event-10',
      term_id: 'term-7',
      term_label: 'Minimum Interest Coverage',
      event_type: 'proposal',
      actor_name: 'BigBank NA',
      actor_party_type: 'lender_side',
      description: 'Proposed increase to 3.00x',
      old_value: '2.50x',
      new_value: '3.00x',
      timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
    },
  ];
}
