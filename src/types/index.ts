export * from './database';
import type { ESGRating } from './database';

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    /**
     * Extended error details with actionable information.
     * May include requestId, fieldErrors, suggestions, etc.
     */
    details?: Record<string, unknown> | {
      requestId?: string;
      timestamp?: string;
      fieldErrors?: Array<{
        field: string;
        message: string;
        code?: string;
        received?: unknown;
        expected?: string;
      }>;
      formErrors?: string[];
      suggestions?: Array<{
        description: string;
        action?: string;
        example?: string;
      }>;
      path?: string;
      method?: string;
      context?: Record<string, unknown>;
    };
  };
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
    timing?: number;
  };
}

// Document processing types
export interface DocumentUploadResult {
  id: string;
  filename: string;
  storagePath: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface ExtractionResult {
  documentId: string;
  facility: ExtractedFacility | null;
  covenants: ExtractedCovenant[];
  obligations: ExtractedObligation[];
  eventsOfDefault: ExtractedEvent[];
  esgProvisions: ExtractedESG[];
  definedTerms: ExtractedTerm[];
  overallConfidence: number;
}

export interface ExtractedFacility {
  facilityName: string;
  facilityReference?: string;
  executionDate?: string;
  effectiveDate?: string;
  maturityDate?: string;
  borrowers?: Array<{ name: string; jurisdiction?: string; role?: string }>;
  lenders?: Array<{ name: string; commitmentAmount?: number; percentage?: number }>;
  agents?: Array<{ name: string; role: string }>;
  facilityType?: string;
  currency?: string;
  totalCommitments?: number;
  interestRateType?: string;
  baseRate?: string;
  marginInitial?: number;
  marginGrid?: Array<{ threshold: number; margin: number }>;
  governingLaw?: string;
  jurisdiction?: string;
  confidence: number;
}

export interface ExtractedCovenant {
  covenantType: string;
  covenantName: string;
  numeratorDefinition?: string;
  denominatorDefinition?: string;
  thresholdType: string;
  thresholdValue?: number;
  testingFrequency?: string;
  clauseReference?: string;
  pageNumber?: number;
  rawText?: string;
  confidence: number;
}

export interface ExtractedObligation {
  obligationType: string;
  description?: string;
  frequency?: string;
  deadlineDays?: number;
  recipientRole?: string;
  clauseReference?: string;
  pageNumber?: number;
  rawText?: string;
  confidence: number;
}

export interface ExtractedEvent {
  eventCategory: string;
  description?: string;
  gracePeriodDays?: number;
  cureRights?: string;
  consequences?: string;
  clauseReference?: string;
  pageNumber?: number;
  rawText?: string;
  confidence: number;
}

export interface ExtractedESG {
  provisionType: string;
  kpiName?: string;
  kpiDefinition?: string;
  kpiBaseline?: number;
  kpiTargets?: Array<{ date: string; targetValue: number; marginAdjustment?: number }>;
  verificationRequired?: boolean;
  clauseReference?: string;
  pageNumber?: number;
  rawText?: string;
  confidence: number;
}

export interface ExtractedTerm {
  term: string;
  definition: string;
  clauseReference?: string;
  pageNumber?: number;
  referencesTerms?: string[];
}

// Query types
export interface QueryRequest {
  question: string;
  facilityIds?: string[];
  includeSources?: boolean;
}

export interface QueryResponse {
  answer: string;
  sources: Array<{
    documentId: string;
    documentName: string;
    pageNumber?: number;
    clauseReference?: string;
    excerpt?: string;
  }>;
  confidence: number;
}

// Comparison types
export interface ComparisonResult {
  document1: { id: string; name: string };
  document2: { id: string; name: string };
  differences: Array<{
    field: string;
    category: string;
    document1Value: unknown;
    document2Value: unknown;
    changeType: 'added' | 'removed' | 'modified';
  }>;
  impactAnalysis?: string;
}

// Dashboard types
export interface DashboardStats {
  totalActiveLoans: number;
  documentsProcessed: number;
  upcomingDeadlines: number;
  openNegotiations: number;
  esgTargetsAtRisk: number;
}

export interface RecentActivity {
  id: string;
  type: string;
  description: string;
  entityName: string;
  actorName: string;
  timestamp: string;
  module: string;
}

// ============================================
// Module 2: Deal Room Types
// ============================================

// Deal creation and configuration
export interface CreateDealRequest {
  deal_name: string;
  deal_reference?: string;
  deal_type: 'new_facility' | 'amendment' | 'refinancing' | 'restructuring';
  base_facility_id?: string;
  negotiation_mode?: 'bilateral' | 'multilateral';
  require_unanimous_consent?: boolean;
  auto_lock_agreed_terms?: boolean;
  target_signing_date?: string;
  target_closing_date?: string;
}

export interface DealWithStats {
  id: string;
  organization_id: string;
  created_by: string;
  deal_name: string;
  deal_reference?: string | null;
  description?: string | null;
  deal_type: 'new_facility' | 'amendment' | 'refinancing' | 'restructuring' | 'extension' | 'consent' | 'waiver';
  status: 'draft' | 'active' | 'paused' | 'agreed' | 'closed' | 'terminated';
  negotiation_mode?: 'collaborative' | 'proposal_based';
  base_facility_id?: string | null;
  target_close_date?: string | null;
  target_signing_date?: string | null;
  target_closing_date?: string | null;
  created_at: string;
  updated_at: string;
  // Computed stats
  stats?: {
    total_terms: number;
    agreed_terms: number;
    pending_proposals: number;
    participant_count: number;
  };
}

// Participant management
export interface InviteParticipantRequest {
  user_id?: string;
  email?: string;
  party_name: string;
  party_type: 'borrower_side' | 'lender_side' | 'third_party';
  party_role: string;
  deal_role: 'deal_lead' | 'negotiator' | 'reviewer' | 'observer';
  can_approve?: boolean;
}

export interface ParticipantWithUser {
  id: string;
  deal_id: string;
  user_id: string;
  party_name: string;
  party_type: 'borrower_side' | 'lender_side' | 'third_party';
  party_role: string;
  deal_role: 'deal_lead' | 'negotiator' | 'reviewer' | 'observer';
  can_approve: boolean;
  status: 'pending' | 'active' | 'removed';
  invited_at: string;
  joined_at: string | null;
  // User info
  user_email?: string;
  user_name?: string;
}

// Term management
export interface TermWithProposals {
  id: string;
  deal_id: string;
  category_id: string;
  term_key: string;
  term_label: string;
  term_description?: string | null;
  value_type: string;
  current_value: unknown;
  current_value_text?: string | null;
  negotiation_status: string;
  is_locked: boolean;
  display_order: number;
  // Relations (optional for display)
  pending_proposals_count?: number;
  comments_count?: number;
  last_updated_at?: string;
}

export interface CategoryWithTerms {
  id: string;
  deal_id: string;
  name: string;
  display_order: number;
  parent_category_id: string | null;
  created_at: string;
  terms: TermWithProposals[];
  subcategories?: CategoryWithTerms[];
}

// Proposal types
export interface CreateProposalRequest {
  proposed_value: unknown;
  proposed_value_text?: string;
  rationale?: string;
}

export interface ProposalResponse {
  response: 'accept' | 'reject' | 'counter';
  comment?: string;
  counter_value?: unknown;
}

export interface ProposalWithResponses {
  id: string;
  term_id: string;
  proposed_by: string;
  proposed_by_party: string;
  proposed_at: string;
  proposed_value: unknown;
  proposed_value_text: string | null;
  rationale: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'superseded' | 'withdrawn';
  responses: Array<{
    party: string;
    user_id: string;
    response: 'accept' | 'reject' | 'counter';
    timestamp: string;
    comment?: string;
  }>;
  resolved_at: string | null;
  // Computed
  proposer_name?: string;
}

// Comment types
export interface CreateCommentRequest {
  content: string;
  proposal_id?: string;
  parent_comment_id?: string;
}

export interface CommentWithAuthor {
  id: string;
  term_id: string;
  proposal_id: string | null;
  author_id: string;
  author_party: string;
  content: string;
  parent_comment_id: string | null;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
  // User info
  author_name?: string;
  replies?: CommentWithAuthor[];
}

// Impact analysis
export interface ImpactAnalysisRequest {
  proposed_value: unknown;
}

export interface ImpactAnalysisResult {
  affected_terms: Array<{
    term_id: string;
    term_label: string;
    impact_type: 'direct' | 'calculation' | 'threshold' | 'consistency';
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  summary: string;
  recommendations: string[];
}

// Market suggestions
export interface MarketSuggestion {
  suggested_value: unknown;
  suggested_value_text: string;
  reasoning: string;
  market_context: string;
  confidence: number;
}

// Export types
export interface TermSheetExport {
  deal_name: string;
  deal_type: string;
  export_date: string;
  exported_by: string;
  format: string;
  sections: Array<{
    category_name: string;
    terms: Array<{
      term_label: string;
      current_value: string;
      status: string;
      is_locked: boolean;
      source_clause?: string | null;
    }>;
  }>;
  metadata: {
    total_terms: number;
    agreed_terms: number;
    locked_terms: number;
  };
}

export interface AuditTrailExport {
  deal_name: string;
  export_date: string;
  exported_by: string;
  date_range: {
    start: string | null;
    end: string | null;
  };
  entries: Array<{
    timestamp: string;
    term_label: string;
    change_type: string;
    previous_value: unknown;
    new_value: unknown;
    changed_by_party: string;
    metadata?: unknown;
  }>;
  summary: {
    total_changes: number;
    changes_by_party: Record<string, number>;
    changes_by_type: Record<string, number>;
  };
}

// Deal templates
export interface DealTemplate {
  id: string;
  name: string;
  deal_type: 'new_facility' | 'amendment' | 'refinancing' | 'restructuring';
  description: string;
  categories: Array<{
    name: string;
    display_order: number;
    terms: Array<{
      term_key: string;
      term_label: string;
      term_description?: string;
      value_type: string;
      allowed_values?: unknown;
      default_value?: unknown;
    }>;
  }>;
}

// ============================================
// Module 3: Compliance Tracker Types
// ============================================

// Compliance Facility with stats
export interface ComplianceFacilityWithStats {
  id: string;
  organization_id: string;
  source_facility_id: string | null;
  facility_name: string;
  facility_reference: string | null;
  borrower_name: string;
  maturity_date: string | null;
  fiscal_year_end: string | null;
  reporting_currency: string;
  status: 'active' | 'waiver_period' | 'default' | 'closed';
  created_at: string;
  updated_at: string;
  stats?: {
    total_obligations: number;
    upcoming_deadlines: number;
    overdue_items: number;
    active_covenants: number;
    covenant_breaches: number;
  };
}

// Obligation with events
export interface ObligationWithEvents {
  id: string;
  facility_id: string;
  obligation_type: string;
  name: string;
  description: string | null;
  frequency: string;
  deadline_days: number;
  is_active: boolean;
  upcoming_events?: Array<{
    id: string;
    deadline_date: string;
    status: string;
  }>;
}

// Compliance Event with details
export interface ComplianceEventWithDetails {
  id: string;
  facility_id: string;
  obligation_id: string;
  reference_period_start: string;
  reference_period_end: string;
  deadline_date: string;
  grace_deadline_date: string;
  status: 'upcoming' | 'due_soon' | 'overdue' | 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'waived';
  submitted_at: string | null;
  submitted_by: string | null;
  submission_notes: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  obligation?: {
    name: string;
    obligation_type: string;
    requires_certification: boolean;
    requires_audit: boolean;
  };
  facility?: {
    facility_name: string;
    borrower_name: string;
  };
  documents?: Array<{
    id: string;
    filename: string;
    document_type: string;
    uploaded_at: string;
  }>;
}

// Covenant with test history
export interface CovenantWithTests {
  id: string;
  facility_id: string;
  covenant_type: string;
  name: string;
  description: string | null;
  threshold_type: 'maximum' | 'minimum';
  threshold_schedule: Array<{ effective_from: string; threshold_value: number }> | null;
  testing_frequency: string;
  testing_basis: string;
  has_equity_cure: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Computed
  current_threshold?: number;
  latest_test?: {
    id: string;
    test_date: string;
    calculated_ratio: number | null;
    test_result: string;
    headroom_percentage: number | null;
  };
  test_history?: Array<{
    id: string;
    test_date: string;
    calculated_ratio: number | null;
    threshold_value: number;
    test_result: string;
  }>;
}

// Covenant test details
export interface CovenantTestWithDetails {
  id: string;
  covenant_id: string;
  facility_id: string;
  test_date: string;
  period_start: string;
  period_end: string;
  numerator_value: number | null;
  denominator_value: number | null;
  calculated_ratio: number | null;
  threshold_value: number;
  test_result: 'pass' | 'fail' | 'cured' | 'waived';
  headroom_absolute: number | null;
  headroom_percentage: number | null;
  breach_amount: number | null;
  cure_applied: boolean;
  cure_amount: number | null;
  waiver_obtained: boolean;
  waiver_reference: string | null;
  submitted_at: string | null;
  submitted_by: string | null;
  calculation_details: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  // Relations
  covenant?: {
    name: string;
    covenant_type: string;
    threshold_type: string;
  };
}

// Calendar event item
export interface CalendarItem {
  id: string;
  type: 'compliance_event' | 'covenant_test' | 'notification_due' | 'waiver_expiration';
  title: string;
  date: string;
  status: string;
  facility_id: string;
  facility_name: string;
  borrower_name: string;
  related_entity_id?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  details?: Record<string, unknown>;
}

// Dashboard stats
export interface ComplianceDashboardStats {
  total_facilities: number;
  facilities_in_compliance: number;
  facilities_in_waiver: number;
  facilities_in_default: number;
  upcoming_deadlines_7_days: number;
  upcoming_deadlines_30_days: number;
  overdue_items: number;
  pending_waivers: number;
  recent_activity: Array<Record<string, unknown>>;
  upcoming_items: CalendarItem[];
  facilities_at_risk: Array<{
    facility_id: string;
    facility_name: string;
    borrower_name: string;
    risk_reason: string;
    covenant_name?: string;
    headroom_percentage?: number;
  }>;
}

// Dashboard alerts
export interface ComplianceAlert {
  id: string;
  type: 'overdue' | 'due_soon' | 'covenant_breach' | 'waiver_expiring' | 'covenant_at_risk';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  facility_id: string;
  facility_name: string;
  related_entity_type: string;
  related_entity_id: string;
  action_url: string;
  created_at: string;
}

// Portfolio summary
export interface PortfolioSummary {
  by_status: Record<string, number>;
  by_obligation_type: Record<string, number>;
  covenant_performance: {
    total_tests: number;
    passed: number;
    failed: number;
    cured: number;
    waived: number;
  };
  upcoming_deadlines: Array<{
    date: string;
    count: number;
  }>;
}

// Event analysis result (from LLM)
export interface EventAnalysisResult {
  triggered_notifications: Array<{
    requirement_id: string;
    requirement_name: string;
    facility_id: string;
    facility_name: string;
    deadline_days: number | null;
    confidence: number;
    reasoning: string;
  }>;
  suggested_actions: string[];
  risk_assessment: string;
}

// Notification draft (from LLM)
export interface NotificationDraft {
  subject: string;
  content: string;
  recipients: string[];
  suggested_attachments: string[];
}

// Waiver with details
export interface WaiverWithDetails {
  id: string;
  facility_id: string;
  waiver_type: string;
  related_covenant_id: string | null;
  related_event_id: string | null;
  description: string | null;
  waiver_period_start: string | null;
  waiver_period_end: string | null;
  conditions: string | null;
  fee_amount: number | null;
  fee_currency: string | null;
  required_consent: string;
  consent_obtained_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  // Relations
  facility?: {
    facility_name: string;
    borrower_name: string;
  };
  covenant?: {
    name: string;
    covenant_type: string;
  };
  event?: {
    obligation_name: string;
    deadline_date: string;
  };
}

// Compliance Status Report
export interface ComplianceStatusReport {
  generated_at: string;
  generated_by: string;
  facilities: Array<{
    facility_id: string;
    facility_name: string;
    borrower_name: string;
    status: string;
    obligations: Array<{
      name: string;
      type: string;
      next_deadline: string | null;
      status: string;
    }>;
    covenants: Array<{
      name: string;
      type: string;
      latest_result: string | null;
      headroom: number | null;
    }>;
  }>;
  summary: {
    total_facilities: number;
    compliant: number;
    at_risk: number;
    in_breach: number;
  };
}

// Covenant Summary Report
export interface CovenantSummaryReport {
  generated_at: string;
  generated_by: string;
  covenants: Array<{
    covenant_id: string;
    facility_name: string;
    borrower_name: string;
    covenant_name: string;
    covenant_type: string;
    threshold_type: string;
    current_threshold: number;
    latest_test_date: string | null;
    latest_ratio: number | null;
    latest_result: string | null;
    headroom: number | null;
    trend: 'improving' | 'stable' | 'declining' | 'unknown';
  }>;
  summary: {
    total_covenants: number;
    passing: number;
    failing: number;
    average_headroom: number | null;
  };
}

// ============================================
// Module 4: Trade Due Diligence Automator Types
// ============================================

// Trade Facility with positions
export interface TradeFacilityWithPositions {
  id: string;
  organization_id: string;
  source_facility_id: string | null;
  compliance_facility_id: string | null;
  facility_name: string;
  facility_reference: string | null;
  borrower_name: string;
  total_commitments: number;
  currency: string;
  maturity_date: string;
  transferability: 'freely_transferable' | 'consent_required' | 'restricted';
  minimum_transfer_amount: number | null;
  minimum_hold_amount: number | null;
  restricted_parties: string[] | null;
  current_status: 'performing' | 'default' | 'restructuring';
  created_at: string;
  updated_at: string;
  // Relations
  positions?: LenderPositionWithDetails[];
  active_trades_count?: number;
  total_position_amount?: number;
}

// Lender Position with details
export interface LenderPositionWithDetails {
  id: string;
  facility_id: string;
  organization_id: string;
  commitment_amount: number;
  outstanding_principal: number;
  unfunded_commitment: number;
  pro_rata_share: number;
  acquisition_date: string;
  acquisition_price: number;
  acquisition_type: 'primary' | 'secondary';
  predecessor_lender: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  facility?: {
    facility_name: string;
    borrower_name: string;
    maturity_date: string;
    current_status: string;
  };
  active_trades?: number;
}

// Trade with full details
export interface TradeWithDetails {
  id: string;
  facility_id: string;
  seller_organization_id: string;
  seller_position_id: string;
  buyer_organization_id: string;
  trade_reference: string;
  trade_date: string;
  settlement_date: string;
  settlement_date_type: 't_plus_days' | 'specific_date';
  settlement_days: number | null;
  trade_amount: number;
  trade_price: number;
  trade_currency: string;
  accrued_interest_handling: 'buyer_pays' | 'seller_retains' | 'settle_at_closing';
  accrued_interest_amount: number | null;
  delayed_compensation: boolean;
  delayed_compensation_rate: number | null;
  status: 'draft' | 'agreed' | 'in_due_diligence' | 'documentation' | 'pending_consent' | 'pending_settlement' | 'settled' | 'cancelled' | 'failed';
  consent_required: boolean;
  consent_received: boolean;
  consent_date: string | null;
  agent_notified: boolean;
  agent_notification_date: string | null;
  assignment_document_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Relations
  facility?: {
    facility_name: string;
    borrower_name: string;
    transferability: string;
    current_status: string;
  };
  seller?: {
    organization_name: string;
    position_amount: number;
  };
  buyer?: {
    organization_name: string;
  };
  checklist?: DueDiligenceChecklistSummary;
  settlement?: SettlementSummary;
}

// Due Diligence Checklist summary
export interface DueDiligenceChecklistSummary {
  id: string;
  status: 'not_started' | 'in_progress' | 'complete' | 'flagged';
  total_items: number;
  verified_items: number;
  flagged_items: number;
  pending_items: number;
  completion_percentage: number;
  buyer_completed_at: string | null;
  seller_completed_at: string | null;
}

// Due Diligence Checklist with items
export interface DueDiligenceChecklistWithItems {
  id: string;
  trade_id: string;
  status: 'not_started' | 'in_progress' | 'complete' | 'flagged';
  buyer_completed_at: string | null;
  seller_completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Categories with items
  categories: Array<{
    category: string;
    items: DueDiligenceItemWithDetails[];
    stats: {
      total: number;
      verified: number;
      flagged: number;
      pending: number;
    };
  }>;
  // Questions
  open_questions_count: number;
}

// Due Diligence Item with details
export interface DueDiligenceItemWithDetails {
  id: string;
  checklist_id: string;
  category: 'facility_status' | 'borrower_creditworthiness' | 'financial_performance' | 'covenant_compliance' | 'documentation' | 'transferability' | 'legal_regulatory' | 'operational';
  item_name: string;
  item_description: string | null;
  data_source: 'auto_system' | 'seller_provided' | 'document_review' | 'external';
  required_for: 'buyer' | 'seller' | 'both';
  is_critical: boolean;
  status: 'pending' | 'in_review' | 'verified' | 'flagged' | 'waived' | 'not_applicable';
  auto_verified: boolean;
  auto_verified_at: string | null;
  auto_verified_data: Record<string, unknown> | null;
  verified_by: string | null;
  verified_at: string | null;
  verification_notes: string | null;
  flag_reason: string | null;
  flag_severity: 'info' | 'warning' | 'blocker' | null;
  flagged_by: string | null;
  flagged_at: string | null;
  evidence_document_ids: string[] | null;
  evidence_notes: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
  // Relations
  questions?: DueDiligenceQuestionWithResponses[];
  verifier_name?: string;
}

// Due Diligence Question with responses
export interface DueDiligenceQuestionWithResponses {
  id: string;
  checklist_id: string;
  checklist_item_id: string | null;
  asker_party: 'buyer' | 'seller';
  asker_id: string;
  question_text: string;
  question_attachments: string[] | null;
  status: 'open' | 'answered' | 'closed';
  responder_id: string | null;
  response_text: string | null;
  response_attachments: string[] | null;
  responded_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  asker_name?: string;
  responder_name?: string;
  related_item?: {
    item_name: string;
    category: string;
  };
}

// Information Package with documents
export interface InformationPackageWithDocuments {
  id: string;
  facility_id: string;
  trade_id: string | null;
  created_by: string;
  name: string;
  description: string | null;
  visibility: 'private' | 'invited_only' | 'all_approved_buyers';
  document_ids: string[];
  shared_with: string[] | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  documents?: Array<{
    id: string;
    filename: string;
    document_type: string;
    file_size: number;
  }>;
  shared_with_details?: Array<{
    organization_id: string;
    organization_name: string;
    accessed_at: string | null;
  }>;
}

// Settlement with calculations
export interface SettlementSummary {
  id: string;
  status: 'pending' | 'funds_in_transit' | 'settled' | 'failed';
  principal_amount: number;
  purchase_price_percentage: number;
  purchase_price_amount: number;
  accrued_interest: number | null;
  delayed_compensation: number | null;
  total_settlement_amount: number;
  funds_received_at: string | null;
  transfer_effective_date: string | null;
}

export interface SettlementCalculation {
  trade_id: string;
  calculation_date: string;
  principal_amount: number;
  trade_price: number;
  purchase_price_amount: number;
  accrued_interest: {
    from_date: string;
    to_date: string;
    days: number;
    rate: number | null;
    amount: number;
  } | null;
  delayed_compensation: {
    from_date: string;
    to_date: string;
    days: number;
    rate: number;
    amount: number;
  } | null;
  total_settlement_amount: number;
  buyer_pays: number;
  seller_receives: number;
  wire_instructions_required: boolean;
}

// Settlement with full details
export interface SettlementWithDetails {
  id: string;
  trade_id: string;
  status: 'pending' | 'funds_in_transit' | 'settled' | 'failed';
  principal_amount: number;
  purchase_price_percentage: number;
  purchase_price_amount: number;
  accrued_interest: number | null;
  accrued_interest_calculation: Record<string, unknown> | null;
  delayed_compensation: number | null;
  delayed_compensation_calculation: Record<string, unknown> | null;
  total_settlement_amount: number;
  seller_wire_instructions: Record<string, unknown> | null;
  buyer_wire_reference: string | null;
  funds_sent_at: string | null;
  funds_received_at: string | null;
  seller_confirmed: boolean;
  seller_confirmed_at: string | null;
  buyer_confirmed: boolean;
  buyer_confirmed_at: string | null;
  agent_received_docs_at: string | null;
  agent_processed_at: string | null;
  transfer_effective_date: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  trade?: {
    trade_reference: string;
    trade_date: string;
    settlement_date: string;
    facility_name: string;
    seller_name: string;
    buyer_name: string;
  };
}

// Trade Event with details
export interface TradeEventWithDetails {
  id: string;
  trade_id: string;
  event_type: string;
  event_data: Record<string, unknown> | null;
  actor_id: string;
  occurred_at: string;
  // Relations
  actor_name?: string;
  description?: string;
}

// AI Query result for trading
export interface TradingAIQueryResult {
  question: string;
  answer: string;
  sources: Array<{
    type: 'document' | 'compliance_data' | 'trade_data' | 'external';
    reference: string;
    excerpt?: string;
  }>;
  confidence: number;
  suggested_actions?: string[];
  related_dd_items?: Array<{
    item_id: string;
    item_name: string;
    relevance: string;
  }>;
}

// DD Report
export interface DueDiligenceReport {
  generated_at: string;
  generated_by: string;
  trade: {
    trade_reference: string;
    trade_date: string;
    settlement_date: string;
    trade_amount: number;
    trade_price: number;
    facility_name: string;
    borrower_name: string;
    seller_name: string;
    buyer_name: string;
  };
  checklist_summary: {
    status: string;
    total_items: number;
    verified_items: number;
    flagged_items: number;
    waived_items: number;
    completion_percentage: number;
  };
  categories: Array<{
    category: string;
    items: Array<{
      item_name: string;
      status: string;
      is_critical: boolean;
      verification_notes: string | null;
      flag_reason: string | null;
      flag_severity: string | null;
    }>;
    stats: {
      total: number;
      verified: number;
      flagged: number;
    };
  }>;
  flags_summary: Array<{
    item_name: string;
    category: string;
    severity: string;
    reason: string;
    flagged_at: string;
  }>;
  qa_summary?: {
    total_questions: number;
    answered: number;
    open: number;
    questions: Array<{
      question: string;
      answer: string | null;
      status: string;
      asked_at: string;
    }>;
  };
  timeline?: Array<{
    event_type: string;
    description: string;
    occurred_at: string;
    actor_name: string;
  }>;
  risk_assessment?: string;
  recommendations?: string[];
}

// Settlement Report
export interface SettlementReport {
  generated_at: string;
  generated_by: string;
  trade: {
    trade_reference: string;
    trade_date: string;
    settlement_date: string;
    facility_name: string;
    borrower_name: string;
    seller_name: string;
    buyer_name: string;
  };
  settlement: {
    status: string;
    principal_amount: number;
    trade_price: number;
    purchase_price_amount: number;
    accrued_interest: number | null;
    delayed_compensation: number | null;
    total_settlement_amount: number;
  };
  wire_instructions?: {
    bank_name: string;
    account_name: string;
    account_number: string;
    routing_number: string;
    swift_code?: string;
    reference: string;
  };
  confirmations: {
    seller_confirmed: boolean;
    seller_confirmed_at: string | null;
    buyer_confirmed: boolean;
    buyer_confirmed_at: string | null;
    agent_processed: boolean;
    agent_processed_at: string | null;
  };
  transfer_details?: {
    effective_date: string;
    new_lender_name: string;
    transferred_amount: number;
    new_pro_rata_share: number;
  };
}

// Trading Dashboard Trade Summary
export interface TradingDashboardTrade {
  id: string;
  trade_reference: string;
  facility_name: string;
  borrower_name: string;
  seller_name: string;
  buyer_name: string;
  is_buyer: boolean;
  status: string;
  trade_amount: number;
  trade_price: number;
  trade_date: string;
  settlement_date: string | null;
  dd_progress: number;
  flagged_items: number;
  open_questions: number;
}

// Trading Dashboard Stats
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
  trades_in_progress: TradingDashboardTrade[];
  upcoming_settlements: Array<{
    trade_id: string;
    trade_reference: string;
    settlement_date: string;
    amount: number;
    counterparty: string;
    is_buyer: boolean;
  }>;
  recent_activity: Array<{
    id: string;
    type: string;
    description: string;
    trade_id: string;
    trade_reference: string;
    occurred_at: string;
  }>;
}

// Trade filters
export interface TradeFilters {
  status?: string[];
  facility_id?: string;
  counterparty_id?: string;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
  is_buyer?: boolean;
  is_seller?: boolean;
}

// Consent request
export interface ConsentRequest {
  trade_id: string;
  consent_type: 'borrower' | 'agent' | 'lenders';
  request_notes?: string;
  requested_at: string;
  requested_by: string;
}

// Consent status
export interface ConsentStatus {
  trade_id: string;
  consent_required: boolean;
  consent_received: boolean;
  consent_date: string | null;
  consent_type?: string;
  request_notes?: string;
  response_notes?: string;
}

// ============================================
// Module 5: ESG Performance Dashboard Types
// ============================================

// ESG Facility with KPIs
export interface ESGFacilityWithKPIs {
  id: string;
  organization_id: string;
  source_facility_id: string | null;
  compliance_facility_id: string | null;
  facility_name: string;
  facility_reference: string;
  borrower_name: string;
  borrower_industry: string | null;
  esg_loan_type: 'sustainability_linked' | 'green_loan' | 'social_loan' | 'transition_loan' | 'esg_linked_hybrid';
  aligned_frameworks: string[] | null;
  base_margin: number | null;
  margin_adjustment_mechanism: Record<string, unknown> | null;
  effective_date: string;
  maturity_date: string;
  status: 'active' | 'closed' | 'suspended';
  created_at: string;
  updated_at: string;
  // Relations
  kpis?: ESGKPIWithTargets[];
  kpi_count?: number;
  on_track_count?: number;
  at_risk_count?: number;
  missed_count?: number;
  current_rating?: ESGRatingSummary;
}

// KPI with targets
export interface ESGKPIWithTargets {
  id: string;
  facility_id: string;
  kpi_name: string;
  kpi_category: string;
  kpi_subcategory: string | null;
  unit_of_measure: string;
  measurement_methodology: string | null;
  baseline_year: number | null;
  baseline_value: number | null;
  baseline_verified: boolean;
  improvement_direction: 'decrease' | 'increase';
  is_core_kpi: boolean;
  weighting: number | null;
  requires_external_verification: boolean;
  verification_frequency: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  targets: ESGTargetWithPerformance[];
  current_status: 'on_track' | 'at_risk' | 'missed' | 'no_data';
  latest_performance?: ESGPerformanceResult;
}

// Target with performance
export interface ESGTargetWithPerformance {
  id: string;
  kpi_id: string;
  target_year: number;
  target_period: string;
  target_date: string;
  target_value: number;
  target_type: 'absolute' | 'intensity' | 'percentage_reduction';
  science_based: boolean;
  science_based_initiative: string | null;
  paris_aligned: boolean;
  margin_adjustment_bps: number | null;
  margin_adjustment_direction: string | null;
  // Relations
  latest_performance?: ESGPerformanceResult;
  performance_history?: ESGPerformanceResult[];
}

// Performance result
export interface ESGPerformanceResult {
  id: string;
  kpi_id: string;
  target_id: string;
  facility_id: string;
  reporting_period_start: string;
  reporting_period_end: string;
  measurement_date: string;
  actual_value: number;
  actual_vs_baseline_change: number | null;
  actual_vs_target_variance: number | null;
  target_met: boolean | null;
  margin_adjustment_applied: number | null;
  data_source: 'borrower_reported' | 'system_calculated' | 'third_party' | 'verified';
  data_quality_score: number | null;
  verification_status: 'pending' | 'in_progress' | 'verified' | 'rejected';
  verifier_name: string | null;
  verification_date: string | null;
  verification_notes: string | null;
  submitted_by: string;
  submitted_at: string;
  // Calculated
  target_value?: number;
  variance_percentage?: number;
  trend_direction?: 'improving' | 'stable' | 'declining';
}

// Use of proceeds with allocations
export interface UseOfProceedsCategoryWithAllocations {
  id: string;
  facility_id: string;
  category_name: string;
  category_type: 'green' | 'social';
  eligibility_criteria: string | null;
  aligned_taxonomy: string | null;
  taxonomy_activity_code: string | null;
  minimum_allocation_percentage: number | null;
  maximum_allocation_percentage: number | null;
  expected_impact_metrics: Array<{
    metric: string;
    unit: string;
    expected_value?: number;
  }> | null;
  clause_reference: string | null;
  created_at: string;
  // Relations
  allocations: ProceedsAllocationWithImpact[];
  total_allocated: number;
  allocation_count: number;
}

// Allocation with impact
export interface ProceedsAllocationWithImpact {
  id: string;
  facility_id: string;
  category_id: string;
  project_name: string;
  project_description: string | null;
  project_location: string | null;
  project_start_date: string | null;
  project_status: 'planned' | 'in_progress' | 'completed';
  allocated_amount: number;
  allocation_date: string;
  allocation_currency: string;
  impact_metrics: Array<{
    metric: string;
    unit: string;
    value: number;
    period?: string;
  }> | null;
  allocation_verified: boolean;
  verification_date: string | null;
  verifier_name: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  category_name?: string;
  category_type?: string;
}

// Rating summary
export interface ESGRatingSummary {
  id: string;
  rating_provider: string;
  provider_name: string;
  rating_type: string;
  rating_value: string;
  rating_category: 'leader' | 'average' | 'laggard' | null;
  environmental_score: number | null;
  social_score: number | null;
  governance_score: number | null;
  rating_date: string;
  valid_until: string | null;
}

// Facility ratings overview (uses ESGRating from database.ts export)
export interface ESGFacilityRatingsOverview {
  borrower_name: string;
  latest_ratings: ESGRating[];
  rating_count: number;
  providers_covered: string[];
  average_score: number | null;
  rating_history: Record<string, ESGRating[]>;
}

// Report with details
export interface ESGReportWithDetails {
  id: string;
  facility_id: string;
  requirement_id: string | null;
  report_type: string;
  report_title: string;
  reporting_period_start: string;
  reporting_period_end: string;
  document_id: string | null;
  file_name: string | null;
  submitted_by: string;
  submitted_at: string;
  status: 'submitted' | 'under_review' | 'accepted' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  // Relations
  facility_name?: string;
  submitter_name?: string;
  reviewer_name?: string;
  requirement?: {
    report_name: string;
    frequency: string;
  };
}

// ESG Dashboard Stats
export interface ESGDashboardStats {
  total_esg_facilities: number;
  total_esg_exposure: number;
  by_loan_type: {
    sustainability_linked: { count: number; exposure: number };
    green_loan: { count: number; exposure: number };
    social_loan: { count: number; exposure: number };
    transition_loan: { count: number; exposure: number };
    esg_linked_hybrid: { count: number; exposure: number };
  };
  kpi_performance: {
    total_kpis: number;
    on_track: number;
    at_risk: number;
    missed: number;
    pending_verification: number;
  };
  allocation_summary: {
    total_proceeds: number;
    allocated: number;
    unallocated: number;
    allocation_percentage: number;
  };
  upcoming_deadlines: Array<{
    id: string;
    type: 'kpi_measurement' | 'report_due' | 'verification_due' | 'allocation_deadline';
    title: string;
    facility_name: string;
    due_date: string;
    days_until: number;
  }>;
  recent_activity: Array<{
    id: string;
    type: string;
    description: string;
    facility_name: string;
    occurred_at: string;
  }>;
  verification_queue: Array<{
    id: string;
    kpi_name: string;
    facility_name: string;
    submitted_at: string;
    status: string;
  }>;
}

// Portfolio ESG Summary
export interface PortfolioESGSummaryWithDetails {
  id: string;
  organization_id: string;
  as_of_date: string;
  total_esg_facilities: number;
  total_esg_exposure: number;
  sll_count: number;
  sll_exposure: number;
  green_loan_count: number;
  green_loan_exposure: number;
  social_loan_count: number;
  social_loan_exposure: number;
  kpis_on_track: number;
  kpis_at_risk: number;
  kpis_missed: number;
  total_allocated_proceeds: number;
  total_unallocated_proceeds: number;
  weighted_carbon_intensity: number | null;
  portfolio_alignment_score: number | null;
  calculation_details: Record<string, unknown> | null;
  created_at: string;
  // Calculated
  kpi_on_track_percentage?: number;
  allocation_percentage?: number;
  trend_vs_previous?: {
    exposure_change: number;
    kpi_improvement: number;
    allocation_change: number;
  };
}

// Margin adjustment calculation
export interface MarginAdjustmentCalculation {
  facility_id: string;
  test_date: string;
  kpi_results: Array<{
    kpi_id: string;
    kpi_name: string;
    target_value: number;
    actual_value: number;
    target_met: boolean;
    weighting: number | null;
    adjustment_bps: number;
  }>;
  total_adjustment_bps: number;
  new_margin: number;
  previous_margin: number;
  effective_from: string;
}

// ESG AI Query Result
export interface ESGAIQueryResult {
  query_type: 'kpi_definition' | 'methodology' | 'benchmarking' | 'gap_analysis' | 'report_narrative';
  question: string;
  answer: string;
  sources?: Array<{
    type: 'document' | 'kpi_data' | 'external' | 'framework';
    reference: string;
    excerpt?: string;
  }>;
  confidence: number;
  structured_output?: Record<string, unknown>;
  suggested_actions?: string[];
}

// KPI Definition Assistance
export interface KPIDefinitionAssistance {
  kpi_name: string;
  suggested_category: string;
  suggested_unit: string;
  measurement_guidance: string;
  boundary_recommendations: string;
  baseline_considerations: string;
  verification_requirements: string;
  common_targets: Array<{
    target_type: string;
    typical_value: string;
    timeframe: string;
  }>;
  framework_alignment: Array<{
    framework: string;
    alignment_notes: string;
  }>;
}

// Report generation output
export interface GeneratedESGReport {
  report_type: string;
  period_start: string;
  period_end: string;
  generated_at: string;
  sections: Array<{
    title: string;
    content: string;
    data_tables?: Array<{
      headers: string[];
      rows: string[][];
    }>;
    charts?: Array<{
      type: 'bar' | 'line' | 'pie' | 'progress';
      title: string;
      data: Record<string, unknown>;
    }>;
  }>;
  summary: {
    key_highlights: string[];
    areas_of_concern: string[];
    recommendations: string[];
  };
  appendices?: Array<{
    title: string;
    content: string;
  }>;
}

// ESG Filters
export interface ESGFacilityFilters {
  loan_type?: string[];
  status?: string[];
  borrower_industry?: string;
  has_active_kpis?: boolean;
  kpi_status?: string[];
  framework?: string;
}

export interface ESGPerformanceFilters {
  facility_id?: string;
  kpi_id?: string;
  kpi_category?: string;
  period_start?: string;
  period_end?: string;
  verification_status?: string[];
  target_met?: boolean;
}

export interface ESGAllocationFilters {
  facility_id?: string;
  category_type?: 'green' | 'social';
  project_status?: string[];
  verified?: boolean;
  date_from?: string;
  date_to?: string;
}
