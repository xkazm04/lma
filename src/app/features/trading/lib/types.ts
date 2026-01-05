export interface Facility {
  id: string;
  facility_name: string;
  borrower_name: string;
  facility_type?: string;
  total_commitment?: number;
}

export interface Organization {
  organization_id: string;
  organization_name: string;
  contact_name: string;
  contact_email: string;
}

export interface Position {
  id: string;
  facility_name: string;
  borrower_name: string;
  lender_name: string;
  position_type: 'agent' | 'participant';
  commitment_amount: number;
  funded_amount: number;
  unfunded_amount: number;
  acquisition_date: string;
  acquisition_price: number;
  current_price: number;
  facility_status: 'active' | 'watchlist' | 'default' | 'matured';
  has_active_trade: boolean;
  trade_reference: string | null;
}

export interface Trade {
  id: string;
  trade_reference: string;
  facility_name: string;
  borrower_name: string;
  seller_name: string;
  buyer_name: string;
  is_buyer: boolean;
  status: TradeStatus;
  trade_amount: number;
  trade_price: number;
  trade_date: string;
  settlement_date: string | null;
  dd_progress: number;
  flagged_items: number;
  open_questions: number;
}

export interface TradeDetail extends Trade {
  facility: Facility;
  seller: Organization;
  buyer: Organization;
  settlement_amount: number;
  consent_required: boolean;
  consent_received: boolean;
  created_at: string;
  updated_at: string;
}

export type TradeStatus =
  | 'draft'
  | 'indication'
  | 'agreed'
  | 'in_due_diligence'
  | 'documentation'
  | 'pending_consent'
  | 'pending_settlement'
  | 'settled'
  | 'cancelled'
  | 'failed';

export interface DDChecklistItem {
  id: string;
  item_name: string;
  status: 'pending' | 'verified' | 'flagged' | 'in_review' | 'waived';
  verified_at?: string;
  flag_reason?: string;
  flag_severity?: 'warning' | 'blocker';
}

export interface DDCategory {
  name: string;
  key: string;
  items: DDChecklistItem[];
}

export interface DDChecklist {
  id: string;
  status: string;
  total_items: number;
  completed_items: number;
  flagged_items: number;
  categories: DDCategory[];
}

export interface Question {
  id: string;
  asked_by_party: string;
  asker_name: string;
  question_text: string;
  status: 'open' | 'answered';
  response_text: string | null;
  responder_name: string | null;
  created_at: string;
  responded_at: string | null;
}

export interface TimelineEvent {
  id: string;
  event_type: string;
  description: string;
  occurred_at: string;
  actor_name: string;
}

export interface TradingDashboardStats {
  total_facilities: number;
  total_positions: number;
  total_position_value: number;
  active_trades: number;
  trades_in_dd: number;
  trades_pending_settlement: number;
  settled_this_month: number;
  settled_volume_this_month: number;
  dd_completion_rate: number;
  average_settlement_days: number;
  flagged_items_count: number;
  open_questions_count: number;
  trades_in_progress: Trade[];
  upcoming_settlements: Settlement[];
  recent_activity: Activity[];
}

export interface Settlement {
  trade_id: string;
  trade_reference: string;
  settlement_date: string;
  amount: number;
  counterparty: string;
  is_buyer: boolean;
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  trade_id: string;
  trade_reference: string;
  occurred_at: string;
}

// ============================================================================
// Settlement Calendar Types
// ============================================================================

/**
 * Risk level for settlements based on various factors
 */
export type SettlementRiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Reminder interval type (T minus days)
 */
export type ReminderInterval = 7 | 3 | 1;

/**
 * Reminder status for auto-reminders
 */
export interface SettlementReminder {
  id: string;
  settlement_id: string;
  days_before: ReminderInterval;
  scheduled_date: string;
  sent: boolean;
  sent_at: string | null;
  channel: 'email' | 'slack' | 'in_app';
}

/**
 * Extended settlement with calendar-specific data
 */
export interface CalendarSettlement extends Settlement {
  risk_level: SettlementRiskLevel;
  has_flagged_items: boolean;
  missing_consents: boolean;
  dd_complete: boolean;
  days_until: number;
  funding_requirement: number;
  reminders: SettlementReminder[];
  borrower_name: string;
  facility_name: string;
}

/**
 * Funding forecast for a specific date
 */
export interface FundingForecast {
  date: string;
  total_inflows: number;
  total_outflows: number;
  net_position: number;
  settlements: CalendarSettlement[];
}

/**
 * Calendar day with settlements
 */
export interface CalendarDay {
  date: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  settlements: CalendarSettlement[];
  totalAmount: number;
  highestRisk: SettlementRiskLevel | null;
  fundingForecast: FundingForecast | null;
}

/**
 * Calendar view mode
 */
export type CalendarViewMode = 'month' | 'week' | 'list';

/**
 * Settlement calendar state
 */
export interface SettlementCalendarState {
  currentDate: Date;
  viewMode: CalendarViewMode;
  selectedDate: string | null;
  settlements: CalendarSettlement[];
  forecasts: FundingForecast[];
  isLoading: boolean;
  error: string | null;
}
