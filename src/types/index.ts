export * from './database';

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
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
  deal_name: string;
  deal_reference: string | null;
  deal_type: 'new_facility' | 'amendment' | 'refinancing' | 'restructuring';
  status: 'draft' | 'active' | 'paused' | 'agreed' | 'closed' | 'terminated';
  target_signing_date: string | null;
  target_closing_date: string | null;
  created_at: string;
  updated_at: string;
  // Computed stats
  total_terms: number;
  agreed_terms: number;
  pending_proposals: number;
  participant_count: number;
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
  term_description: string | null;
  value_type: string;
  current_value: unknown;
  current_value_text: string | null;
  negotiation_status: string;
  is_locked: boolean;
  display_order: number;
  // Relations
  pending_proposals_count: number;
  comments_count: number;
  last_updated_at: string;
}

export interface CategoryWithTerms {
  id: string;
  name: string;
  display_order: number;
  parent_category_id: string | null;
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
  deal_reference: string | null;
  deal_type: string;
  generated_at: string;
  categories: Array<{
    name: string;
    terms: Array<{
      label: string;
      value: string;
      status: string;
    }>;
  }>;
}

export interface AuditTrailExport {
  deal_name: string;
  generated_at: string;
  timeline: Array<{
    timestamp: string;
    activity_type: string;
    actor: string;
    party: string;
    description: string;
    details?: unknown;
  }>;
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
