-- LoanOS Database Schema
-- Initial migration with all 5 modules

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- Core Tables (Shared across modules)
-- ===========================================

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bank', 'borrower', 'law_firm', 'agent', 'other')),
  settings JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users
CREATE TABLE loan_users (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user', 'viewer')),
  preferences JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES loan_users(id) ON DELETE CASCADE,
  source_module TEXT NOT NULL CHECK (source_module IN ('documents', 'deals', 'compliance', 'trading', 'esg')),
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  related_entity_type TEXT,
  related_entity_id UUID,
  action_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activities
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_module TEXT NOT NULL CHECK (source_module IN ('documents', 'deals', 'compliance', 'trading', 'esg')),
  activity_type TEXT NOT NULL,
  actor_id UUID NOT NULL REFERENCES loan_users(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  entity_name TEXT,
  description TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===========================================
-- Module 1: Document Intelligence Hub
-- ===========================================

-- Loan Documents
CREATE TABLE loan_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES loan_users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  original_filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'other' CHECK (document_type IN ('facility_agreement', 'amendment', 'consent', 'assignment', 'other')),
  processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'review_required')),
  extraction_version INTEGER NOT NULL DEFAULT 1,
  raw_text TEXT,
  page_count INTEGER,
  file_size INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Loan Facilities
CREATE TABLE loan_facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_document_id UUID NOT NULL REFERENCES loan_documents(id) ON DELETE CASCADE,
  facility_name TEXT NOT NULL,
  facility_reference TEXT,
  execution_date DATE,
  effective_date DATE,
  maturity_date DATE,
  borrowers JSONB,
  guarantors JSONB,
  lenders JSONB,
  agents JSONB,
  facility_type TEXT NOT NULL DEFAULT 'other' CHECK (facility_type IN ('term', 'revolving', 'delayed_draw', 'swingline', 'other')),
  currency TEXT NOT NULL DEFAULT 'USD',
  total_commitments NUMERIC,
  interest_rate_type TEXT CHECK (interest_rate_type IN ('floating', 'fixed', 'hybrid')),
  base_rate TEXT,
  margin_initial NUMERIC,
  margin_grid JSONB,
  commitment_fee NUMERIC,
  utilization_fee JSONB,
  arrangement_fee NUMERIC,
  governing_law TEXT,
  jurisdiction TEXT,
  syndicated BOOLEAN NOT NULL DEFAULT FALSE,
  extraction_confidence NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'defaulted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Financial Covenants (extracted)
CREATE TABLE financial_covenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES loan_facilities(id) ON DELETE CASCADE,
  source_document_id UUID NOT NULL REFERENCES loan_documents(id) ON DELETE CASCADE,
  covenant_type TEXT NOT NULL CHECK (covenant_type IN ('leverage_ratio', 'interest_coverage', 'debt_service_coverage', 'net_worth', 'current_ratio', 'capex_limit', 'other')),
  covenant_name TEXT NOT NULL,
  numerator_definition TEXT,
  denominator_definition TEXT,
  calculation_methodology TEXT,
  threshold_type TEXT NOT NULL DEFAULT 'maximum' CHECK (threshold_type IN ('maximum', 'minimum', 'range')),
  threshold_value NUMERIC,
  threshold_schedule JSONB,
  testing_frequency TEXT NOT NULL DEFAULT 'quarterly' CHECK (testing_frequency IN ('quarterly', 'semi_annual', 'annual')),
  testing_dates JSONB,
  cure_rights TEXT,
  clause_reference TEXT,
  page_number INTEGER,
  raw_text TEXT,
  extraction_confidence NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reporting Obligations (extracted)
CREATE TABLE reporting_obligations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES loan_facilities(id) ON DELETE CASCADE,
  source_document_id UUID NOT NULL REFERENCES loan_documents(id) ON DELETE CASCADE,
  obligation_type TEXT NOT NULL CHECK (obligation_type IN ('annual_financials', 'quarterly_financials', 'compliance_certificate', 'budget', 'audit_report', 'event_notice', 'other')),
  description TEXT,
  frequency TEXT NOT NULL DEFAULT 'quarterly' CHECK (frequency IN ('annual', 'quarterly', 'monthly', 'on_occurrence', 'other')),
  deadline_days INTEGER,
  deadline_description TEXT,
  recipient_role TEXT,
  clause_reference TEXT,
  page_number INTEGER,
  raw_text TEXT,
  extraction_confidence NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Events of Default (extracted)
CREATE TABLE events_of_default (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES loan_facilities(id) ON DELETE CASCADE,
  source_document_id UUID NOT NULL REFERENCES loan_documents(id) ON DELETE CASCADE,
  event_category TEXT NOT NULL CHECK (event_category IN ('payment_default', 'covenant_breach', 'representation_breach', 'cross_default', 'insolvency', 'material_adverse_change', 'change_of_control', 'other')),
  description TEXT,
  grace_period_days INTEGER,
  cure_rights TEXT,
  consequences TEXT,
  clause_reference TEXT,
  page_number INTEGER,
  raw_text TEXT,
  extraction_confidence NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ESG Provisions (extracted)
CREATE TABLE esg_provisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES loan_facilities(id) ON DELETE CASCADE,
  source_document_id UUID NOT NULL REFERENCES loan_documents(id) ON DELETE CASCADE,
  provision_type TEXT NOT NULL CHECK (provision_type IN ('sustainability_linked_margin', 'green_use_of_proceeds', 'esg_reporting', 'esg_covenant', 'other')),
  kpi_name TEXT,
  kpi_definition TEXT,
  kpi_baseline NUMERIC,
  kpi_targets JSONB,
  verification_required BOOLEAN NOT NULL DEFAULT FALSE,
  verifier_requirements TEXT,
  clause_reference TEXT,
  page_number INTEGER,
  raw_text TEXT,
  extraction_confidence NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Defined Terms (extracted)
CREATE TABLE defined_terms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES loan_facilities(id) ON DELETE CASCADE,
  source_document_id UUID NOT NULL REFERENCES loan_documents(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  clause_reference TEXT,
  page_number INTEGER,
  references_terms TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===========================================
-- Module 2: Deal Room & Negotiation Accelerator
-- ===========================================

-- Deals
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES loan_users(id),
  deal_name TEXT NOT NULL,
  deal_reference TEXT,
  deal_type TEXT NOT NULL CHECK (deal_type IN ('new_facility', 'amendment', 'refinancing', 'restructuring')),
  base_facility_id UUID REFERENCES loan_facilities(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'agreed', 'closed', 'terminated')),
  negotiation_mode TEXT NOT NULL DEFAULT 'bilateral' CHECK (negotiation_mode IN ('bilateral', 'multilateral')),
  require_unanimous_consent BOOLEAN NOT NULL DEFAULT FALSE,
  auto_lock_agreed_terms BOOLEAN NOT NULL DEFAULT TRUE,
  target_signing_date DATE,
  target_closing_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deal Participants
CREATE TABLE deal_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES loan_users(id),
  party_name TEXT NOT NULL,
  party_type TEXT NOT NULL CHECK (party_type IN ('borrower_side', 'lender_side', 'third_party')),
  party_role TEXT NOT NULL,
  deal_role TEXT NOT NULL DEFAULT 'negotiator' CHECK (deal_role IN ('deal_lead', 'negotiator', 'reviewer', 'observer')),
  can_approve BOOLEAN NOT NULL DEFAULT FALSE,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'removed')),
  UNIQUE(deal_id, user_id)
);

-- Term Categories
CREATE TABLE term_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  parent_category_id UUID REFERENCES term_categories(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Negotiation Terms
CREATE TABLE negotiation_terms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES term_categories(id) ON DELETE CASCADE,
  term_key TEXT NOT NULL,
  term_label TEXT NOT NULL,
  term_description TEXT,
  source_facility_id UUID REFERENCES loan_facilities(id),
  source_clause_reference TEXT,
  value_type TEXT NOT NULL CHECK (value_type IN ('text', 'number', 'percentage', 'currency_amount', 'date', 'boolean', 'selection', 'multi_select', 'table', 'rich_text')),
  allowed_values JSONB,
  current_value JSONB,
  current_value_text TEXT,
  negotiation_status TEXT NOT NULL DEFAULT 'not_started' CHECK (negotiation_status IN ('not_started', 'proposed', 'under_discussion', 'pending_approval', 'agreed', 'locked')),
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  locked_by UUID REFERENCES loan_users(id),
  locked_at TIMESTAMPTZ,
  lock_reason TEXT,
  depends_on TEXT[],
  impacts TEXT[],
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(deal_id, term_key)
);

-- Term Proposals
CREATE TABLE term_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  term_id UUID NOT NULL REFERENCES negotiation_terms(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  proposed_by UUID NOT NULL REFERENCES loan_users(id),
  proposed_by_party TEXT NOT NULL,
  proposed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  proposed_value JSONB NOT NULL,
  proposed_value_text TEXT,
  rationale TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'superseded', 'withdrawn', 'countered')),
  responded_by UUID REFERENCES loan_users(id),
  responded_at TIMESTAMPTZ,
  response_comment TEXT,
  counter_value JSONB,
  counter_value_text TEXT,
  responses JSONB,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES loan_users(id),
  resolution_note TEXT
);

-- Term Comments
CREATE TABLE term_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  term_id UUID NOT NULL REFERENCES negotiation_terms(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES term_proposals(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES loan_users(id),
  author_party TEXT NOT NULL,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES term_comments(id),
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_by UUID REFERENCES loan_users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Term History
CREATE TABLE term_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  term_id UUID NOT NULL REFERENCES negotiation_terms(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK (change_type IN ('created', 'value_changed', 'status_changed', 'locked', 'unlocked', 'proposal_accepted', 'proposal_rejected')),
  previous_value JSONB,
  new_value JSONB,
  previous_status TEXT,
  new_status TEXT,
  changed_by UUID NOT NULL REFERENCES loan_users(id),
  changed_by_party TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  change_note TEXT,
  related_proposal_id UUID REFERENCES term_proposals(id),
  metadata JSONB
);

-- Deal Activities
CREATE TABLE deal_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('deal_created', 'participant_joined', 'participant_removed', 'term_proposed', 'term_agreed', 'term_locked', 'comment_added', 'document_exported', 'status_changed')),
  actor_id UUID NOT NULL REFERENCES loan_users(id),
  actor_party TEXT NOT NULL,
  term_id UUID REFERENCES negotiation_terms(id),
  proposal_id UUID REFERENCES term_proposals(id),
  comment_id UUID REFERENCES term_comments(id),
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===========================================
-- Module 3: Compliance Tracker & Obligation Calendar
-- ===========================================

-- Compliance Facilities
CREATE TABLE compliance_facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_facility_id UUID REFERENCES loan_facilities(id),
  facility_name TEXT NOT NULL,
  facility_reference TEXT,
  borrower_name TEXT NOT NULL,
  maturity_date DATE,
  fiscal_year_end TEXT,
  reporting_currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'waiver_period', 'default', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compliance Obligations
CREATE TABLE compliance_obligations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES compliance_facilities(id) ON DELETE CASCADE,
  source_obligation_id UUID REFERENCES reporting_obligations(id),
  obligation_type TEXT NOT NULL CHECK (obligation_type IN ('annual_audited_financials', 'quarterly_financials', 'monthly_financials', 'compliance_certificate', 'annual_budget', 'projections', 'covenant_calculation', 'esg_report', 'insurance_certificate', 'other')),
  name TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('annual', 'semi_annual', 'quarterly', 'monthly', 'one_time', 'on_event')),
  reference_point TEXT NOT NULL DEFAULT 'period_end' CHECK (reference_point IN ('period_end', 'fiscal_year_end', 'fixed_date', 'event_date')),
  deadline_days INTEGER NOT NULL DEFAULT 45,
  deadline_business_days BOOLEAN NOT NULL DEFAULT FALSE,
  fixed_deadline_dates DATE[],
  grace_period_days INTEGER NOT NULL DEFAULT 0,
  recipient_roles TEXT[] NOT NULL DEFAULT '{}',
  requires_certification BOOLEAN NOT NULL DEFAULT FALSE,
  requires_audit BOOLEAN NOT NULL DEFAULT FALSE,
  format_requirements TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  clause_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compliance Events
CREATE TABLE compliance_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES compliance_facilities(id) ON DELETE CASCADE,
  obligation_id UUID NOT NULL REFERENCES compliance_obligations(id) ON DELETE CASCADE,
  reference_period_start DATE NOT NULL,
  reference_period_end DATE NOT NULL,
  deadline_date DATE NOT NULL,
  grace_deadline_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'due_soon', 'overdue', 'submitted', 'under_review', 'accepted', 'rejected', 'waived')),
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES loan_users(id),
  submission_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES loan_users(id),
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compliance Documents
CREATE TABLE compliance_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES compliance_events(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'other' CHECK (document_type IN ('financial_statements', 'compliance_certificate', 'covenant_calculation', 'supporting_schedule', 'other')),
  uploaded_by UUID NOT NULL REFERENCES loan_users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compliance Covenants
CREATE TABLE compliance_covenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES compliance_facilities(id) ON DELETE CASCADE,
  source_covenant_id UUID REFERENCES financial_covenants(id),
  covenant_type TEXT NOT NULL CHECK (covenant_type IN ('leverage_ratio', 'interest_coverage', 'fixed_charge_coverage', 'debt_service_coverage', 'current_ratio', 'net_worth', 'tangible_net_worth', 'capex', 'minimum_liquidity', 'maximum_debt', 'other')),
  name TEXT NOT NULL,
  description TEXT,
  numerator_definition TEXT,
  denominator_definition TEXT,
  formula_description TEXT,
  threshold_type TEXT NOT NULL DEFAULT 'maximum' CHECK (threshold_type IN ('maximum', 'minimum')),
  threshold_schedule JSONB,
  testing_frequency TEXT NOT NULL DEFAULT 'quarterly' CHECK (testing_frequency IN ('quarterly', 'semi_annual', 'annual')),
  testing_basis TEXT NOT NULL DEFAULT 'rolling_4_quarters' CHECK (testing_basis IN ('period_end', 'rolling_12_months', 'rolling_4_quarters')),
  has_equity_cure BOOLEAN NOT NULL DEFAULT FALSE,
  equity_cure_details TEXT,
  cure_period_days INTEGER,
  max_cures INTEGER,
  consecutive_cure_limit INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  clause_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Covenant Tests
CREATE TABLE covenant_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  covenant_id UUID NOT NULL REFERENCES compliance_covenants(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES compliance_facilities(id) ON DELETE CASCADE,
  test_date DATE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  numerator_value NUMERIC,
  denominator_value NUMERIC,
  calculated_ratio NUMERIC,
  threshold_value NUMERIC NOT NULL,
  test_result TEXT NOT NULL DEFAULT 'pass' CHECK (test_result IN ('pass', 'fail', 'cured', 'waived')),
  headroom_absolute NUMERIC,
  headroom_percentage NUMERIC,
  breach_amount NUMERIC,
  cure_applied BOOLEAN NOT NULL DEFAULT FALSE,
  cure_amount NUMERIC,
  waiver_obtained BOOLEAN NOT NULL DEFAULT FALSE,
  waiver_reference TEXT,
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES loan_users(id),
  calculation_details JSONB,
  compliance_event_id UUID REFERENCES compliance_events(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notification Requirements
CREATE TABLE notification_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES compliance_facilities(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('default_event', 'potential_default', 'material_litigation', 'change_of_control', 'material_acquisition', 'material_disposal', 'material_contract', 'environmental_claim', 'insurance_claim', 'change_of_auditors', 'material_adverse_change', 'other')),
  name TEXT NOT NULL,
  trigger_description TEXT,
  notification_deadline TEXT,
  notification_deadline_days INTEGER,
  recipient_roles TEXT[] NOT NULL DEFAULT '{}',
  required_content TEXT,
  clause_reference TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notification Events
CREATE TABLE notification_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requirement_id UUID NOT NULL REFERENCES notification_requirements(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES compliance_facilities(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  event_description TEXT,
  notification_due_date DATE NOT NULL,
  notification_sent_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'acknowledged', 'resolved')),
  notification_content TEXT,
  created_by UUID NOT NULL REFERENCES loan_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compliance Reminders
CREATE TABLE compliance_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID REFERENCES compliance_facilities(id) ON DELETE CASCADE,
  compliance_event_id UUID REFERENCES compliance_events(id) ON DELETE CASCADE,
  covenant_id UUID REFERENCES compliance_covenants(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('deadline_approaching', 'covenant_test_due', 'waiver_expiring', 'custom')),
  days_before INTEGER NOT NULL DEFAULT 7,
  notify_users UUID[] NOT NULL DEFAULT '{}',
  notify_roles TEXT[] NOT NULL DEFAULT '{}',
  notification_channel TEXT NOT NULL DEFAULT 'in_app' CHECK (notification_channel IN ('in_app', 'email', 'both')),
  is_sent BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compliance Waivers
CREATE TABLE compliance_waivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES compliance_facilities(id) ON DELETE CASCADE,
  waiver_type TEXT NOT NULL CHECK (waiver_type IN ('covenant_waiver', 'deadline_extension', 'consent', 'amendment')),
  related_covenant_id UUID REFERENCES compliance_covenants(id),
  related_event_id UUID REFERENCES compliance_events(id),
  description TEXT,
  waiver_period_start DATE,
  waiver_period_end DATE,
  conditions TEXT,
  fee_amount NUMERIC,
  fee_currency TEXT,
  required_consent TEXT NOT NULL DEFAULT 'agent' CHECK (required_consent IN ('agent', 'majority_lenders', 'all_lenders')),
  consent_obtained_date DATE,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'expired', 'superseded')),
  waiver_document_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===========================================
-- Module 4: Trade Due Diligence Automator
-- ===========================================

-- Trade Facilities
CREATE TABLE trade_facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_facility_id UUID REFERENCES loan_facilities(id),
  compliance_facility_id UUID REFERENCES compliance_facilities(id),
  facility_name TEXT NOT NULL,
  facility_reference TEXT,
  borrower_name TEXT NOT NULL,
  total_commitments NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  maturity_date DATE NOT NULL,
  transferability TEXT NOT NULL DEFAULT 'consent_required' CHECK (transferability IN ('freely_transferable', 'consent_required', 'restricted')),
  minimum_transfer_amount NUMERIC,
  minimum_hold_amount NUMERIC,
  restricted_parties TEXT[],
  current_status TEXT NOT NULL DEFAULT 'performing' CHECK (current_status IN ('performing', 'default', 'restructuring')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lender Positions
CREATE TABLE lender_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES trade_facilities(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  commitment_amount NUMERIC NOT NULL,
  outstanding_principal NUMERIC NOT NULL DEFAULT 0,
  unfunded_commitment NUMERIC NOT NULL DEFAULT 0,
  pro_rata_share NUMERIC NOT NULL,
  acquisition_date DATE NOT NULL,
  acquisition_price NUMERIC NOT NULL DEFAULT 100,
  acquisition_type TEXT NOT NULL DEFAULT 'primary' CHECK (acquisition_type IN ('primary', 'secondary')),
  predecessor_lender TEXT,
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trades
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES trade_facilities(id) ON DELETE CASCADE,
  seller_organization_id UUID NOT NULL REFERENCES organizations(id),
  seller_position_id UUID NOT NULL REFERENCES lender_positions(id),
  buyer_organization_id UUID NOT NULL REFERENCES organizations(id),
  trade_reference TEXT NOT NULL UNIQUE,
  trade_date DATE NOT NULL,
  settlement_date DATE NOT NULL,
  settlement_date_type TEXT NOT NULL DEFAULT 't_plus_days' CHECK (settlement_date_type IN ('t_plus_days', 'specific_date')),
  settlement_days INTEGER,
  trade_amount NUMERIC NOT NULL,
  trade_price NUMERIC NOT NULL,
  trade_currency TEXT NOT NULL DEFAULT 'USD',
  accrued_interest_handling TEXT NOT NULL DEFAULT 'buyer_pays' CHECK (accrued_interest_handling IN ('buyer_pays', 'seller_retains', 'settle_at_closing')),
  accrued_interest_amount NUMERIC,
  delayed_compensation BOOLEAN NOT NULL DEFAULT FALSE,
  delayed_compensation_rate NUMERIC,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'agreed', 'in_due_diligence', 'documentation', 'pending_consent', 'pending_settlement', 'settled', 'cancelled', 'failed')),
  consent_required BOOLEAN NOT NULL DEFAULT TRUE,
  consent_received BOOLEAN NOT NULL DEFAULT FALSE,
  consent_date DATE,
  agent_notified BOOLEAN NOT NULL DEFAULT FALSE,
  agent_notification_date DATE,
  assignment_document_id UUID,
  created_by UUID NOT NULL REFERENCES loan_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Due Diligence Checklists
CREATE TABLE due_diligence_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE UNIQUE,
  checklist_template_id UUID,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'complete', 'flagged')),
  total_items INTEGER NOT NULL DEFAULT 0,
  completed_items INTEGER NOT NULL DEFAULT 0,
  flagged_items INTEGER NOT NULL DEFAULT 0,
  buyer_assigned_to UUID REFERENCES loan_users(id),
  seller_assigned_to UUID REFERENCES loan_users(id),
  buyer_completed_at TIMESTAMPTZ,
  seller_completed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Due Diligence Items
CREATE TABLE due_diligence_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id UUID NOT NULL REFERENCES due_diligence_checklists(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('facility_status', 'borrower_creditworthiness', 'financial_performance', 'covenant_compliance', 'documentation', 'transferability', 'legal_regulatory', 'operational')),
  item_key TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_description TEXT,
  required_for TEXT NOT NULL DEFAULT 'both' CHECK (required_for IN ('buyer', 'seller', 'both')),
  data_source TEXT NOT NULL DEFAULT 'seller_provided' CHECK (data_source IN ('auto_system', 'seller_provided', 'document_review', 'external')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'verified', 'flagged', 'waived', 'not_applicable')),
  verified_by UUID REFERENCES loan_users(id),
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  flag_reason TEXT,
  flag_severity TEXT CHECK (flag_severity IN ('info', 'warning', 'blocker')),
  evidence_document_ids UUID[],
  evidence_notes TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(checklist_id, item_key)
);

-- Due Diligence Questions
CREATE TABLE due_diligence_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  checklist_item_id UUID REFERENCES due_diligence_items(id) ON DELETE SET NULL,
  asked_by UUID NOT NULL REFERENCES loan_users(id),
  asked_by_party TEXT NOT NULL CHECK (asked_by_party IN ('buyer', 'seller')),
  question_text TEXT NOT NULL,
  response_text TEXT,
  responded_by UUID REFERENCES loan_users(id),
  responded_at TIMESTAMPTZ,
  question_attachments UUID[],
  response_attachments UUID[],
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Information Packages
CREATE TABLE information_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES trade_facilities(id) ON DELETE CASCADE,
  trade_id UUID REFERENCES trades(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'invited_only', 'all_approved_buyers')),
  document_ids UUID[] NOT NULL DEFAULT '{}',
  prepared_by UUID NOT NULL REFERENCES loan_users(id),
  prepared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trade Events
CREATE TABLE trade_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('trade_created', 'terms_agreed', 'dd_started', 'dd_item_verified', 'dd_item_flagged', 'question_asked', 'question_answered', 'dd_completed', 'consent_requested', 'consent_received', 'consent_rejected', 'documentation_prepared', 'documentation_executed', 'agent_notified', 'funds_received', 'transfer_recorded', 'trade_settled', 'trade_cancelled')),
  event_data JSONB,
  actor_id UUID NOT NULL REFERENCES loan_users(id),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Settlements
CREATE TABLE settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE UNIQUE,
  principal_amount NUMERIC NOT NULL,
  accrued_interest NUMERIC NOT NULL DEFAULT 0,
  fees NUMERIC NOT NULL DEFAULT 0,
  delayed_compensation NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  seller_wire_instructions JSONB,
  buyer_wire_reference TEXT,
  funds_sent_at TIMESTAMPTZ,
  funds_received_at TIMESTAMPTZ,
  agent_received_docs_at TIMESTAMPTZ,
  agent_processed_at TIMESTAMPTZ,
  transfer_effective_date DATE,
  seller_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  buyer_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  agent_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'funds_in_transit', 'settled', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===========================================
-- Module 5: ESG Performance Dashboard
-- ===========================================

-- ESG Facilities
CREATE TABLE esg_facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_facility_id UUID REFERENCES loan_facilities(id),
  compliance_facility_id UUID REFERENCES compliance_facilities(id),
  facility_name TEXT NOT NULL,
  facility_reference TEXT NOT NULL,
  borrower_name TEXT NOT NULL,
  borrower_industry TEXT,
  esg_loan_type TEXT NOT NULL CHECK (esg_loan_type IN ('sustainability_linked', 'green_loan', 'social_loan', 'transition_loan', 'esg_linked_hybrid')),
  aligned_frameworks TEXT[],
  base_margin NUMERIC,
  margin_adjustment_mechanism JSONB,
  effective_date DATE NOT NULL,
  maturity_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ESG KPIs
CREATE TABLE esg_kpis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES esg_facilities(id) ON DELETE CASCADE,
  source_provision_id UUID REFERENCES esg_provisions(id),
  kpi_name TEXT NOT NULL,
  kpi_category TEXT NOT NULL CHECK (kpi_category IN ('environmental_emissions', 'environmental_energy', 'environmental_water', 'environmental_waste', 'environmental_biodiversity', 'social_workforce', 'social_health_safety', 'social_community', 'social_supply_chain', 'governance_board', 'governance_ethics', 'governance_risk', 'other')),
  kpi_subcategory TEXT,
  unit_of_measure TEXT NOT NULL,
  measurement_methodology TEXT,
  boundary_scope TEXT,
  baseline_year INTEGER,
  baseline_value NUMERIC,
  baseline_verified BOOLEAN NOT NULL DEFAULT FALSE,
  baseline_verifier TEXT,
  improvement_direction TEXT NOT NULL CHECK (improvement_direction IN ('decrease', 'increase')),
  is_core_kpi BOOLEAN NOT NULL DEFAULT TRUE,
  weighting NUMERIC,
  requires_external_verification BOOLEAN NOT NULL DEFAULT FALSE,
  verification_frequency TEXT CHECK (verification_frequency IN ('annual', 'semi_annual', 'per_test')),
  acceptable_verifiers TEXT[],
  clause_reference TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ESG Targets
CREATE TABLE esg_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kpi_id UUID NOT NULL REFERENCES esg_kpis(id) ON DELETE CASCADE,
  target_year INTEGER NOT NULL,
  target_period TEXT NOT NULL CHECK (target_period IN ('annual', 'h1', 'h2', 'q1', 'q2', 'q3', 'q4')),
  target_date DATE NOT NULL,
  target_value NUMERIC NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('absolute', 'intensity', 'percentage_reduction')),
  science_based BOOLEAN NOT NULL DEFAULT FALSE,
  science_based_initiative TEXT,
  paris_aligned BOOLEAN NOT NULL DEFAULT FALSE,
  margin_adjustment_bps INTEGER,
  margin_adjustment_direction TEXT CHECK (margin_adjustment_direction IN ('benefit_if_met', 'penalty_if_missed', 'both')),
  target_status TEXT NOT NULL DEFAULT 'pending' CHECK (target_status IN ('pending', 'on_track', 'at_risk', 'achieved', 'missed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(kpi_id, target_year, target_period)
);

-- ESG Performance
CREATE TABLE esg_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kpi_id UUID NOT NULL REFERENCES esg_kpis(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES esg_targets(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES esg_facilities(id) ON DELETE CASCADE,
  reporting_period_start DATE NOT NULL,
  reporting_period_end DATE NOT NULL,
  measurement_date DATE NOT NULL,
  actual_value NUMERIC NOT NULL,
  actual_vs_baseline_change NUMERIC,
  actual_vs_target_variance NUMERIC,
  target_met BOOLEAN,
  margin_adjustment_applied NUMERIC,
  data_source TEXT NOT NULL CHECK (data_source IN ('borrower_reported', 'system_calculated', 'third_party', 'verified')),
  data_quality_score NUMERIC,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'in_progress', 'verified', 'rejected')),
  verifier_name TEXT,
  verification_date DATE,
  verification_report_id UUID,
  verification_notes TEXT,
  calculation_details JSONB,
  supporting_documents UUID[],
  submitted_by UUID NOT NULL REFERENCES loan_users(id),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Use of Proceeds Categories
CREATE TABLE use_of_proceeds_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES esg_facilities(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  category_type TEXT NOT NULL CHECK (category_type IN ('green', 'social')),
  eligible_amount NUMERIC,
  eligibility_criteria TEXT,
  aligned_taxonomy TEXT,
  taxonomy_activity_code TEXT,
  minimum_allocation_percentage NUMERIC,
  maximum_allocation_percentage NUMERIC,
  expected_impact_metrics JSONB,
  clause_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Proceeds Allocations
CREATE TABLE proceeds_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES esg_facilities(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES use_of_proceeds_categories(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  project_description TEXT,
  project_location TEXT,
  project_start_date DATE,
  project_status TEXT NOT NULL DEFAULT 'planned' CHECK (project_status IN ('planned', 'in_progress', 'completed')),
  allocated_amount NUMERIC NOT NULL,
  allocation_date DATE NOT NULL,
  allocation_currency TEXT NOT NULL DEFAULT 'USD',
  impact_metrics JSONB,
  allocation_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_date DATE,
  verifier_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unallocated Proceeds
CREATE TABLE unallocated_proceeds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES esg_facilities(id) ON DELETE CASCADE,
  as_of_date DATE NOT NULL,
  unallocated_amount NUMERIC NOT NULL,
  temporary_investment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ESG Reporting Requirements
CREATE TABLE esg_reporting_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES esg_facilities(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('annual_sustainability_report', 'kpi_performance_report', 'allocation_report', 'impact_report', 'verification_assurance_report', 'external_rating_update', 'other')),
  report_name TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('annual', 'semi_annual', 'quarterly', 'on_occurrence')),
  deadline_days_after_period INTEGER NOT NULL,
  recipients TEXT[],
  format_requirements TEXT,
  content_requirements TEXT,
  compliance_obligation_id UUID REFERENCES compliance_obligations(id),
  clause_reference TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ESG Reports
CREATE TABLE esg_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES esg_facilities(id) ON DELETE CASCADE,
  requirement_id UUID REFERENCES esg_reporting_requirements(id),
  report_type TEXT NOT NULL,
  report_title TEXT NOT NULL,
  reporting_period_start DATE NOT NULL,
  reporting_period_end DATE NOT NULL,
  document_id UUID,
  file_name TEXT,
  submitted_by UUID NOT NULL REFERENCES loan_users(id),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'accepted', 'rejected')),
  reviewed_by UUID REFERENCES loan_users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ESG Ratings
CREATE TABLE esg_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID REFERENCES esg_facilities(id) ON DELETE CASCADE,
  borrower_id UUID,
  rating_provider TEXT NOT NULL CHECK (rating_provider IN ('msci', 'sustainalytics', 'sp_global', 'moodys_esg', 'cdp', 'internal', 'other')),
  provider_name TEXT NOT NULL,
  rating_type TEXT NOT NULL,
  rating_value TEXT NOT NULL,
  rating_scale TEXT,
  rating_category TEXT CHECK (rating_category IN ('leader', 'average', 'laggard')),
  environmental_score NUMERIC,
  social_score NUMERIC,
  governance_score NUMERIC,
  rating_date DATE NOT NULL,
  valid_until DATE,
  rating_document_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Portfolio ESG Summaries
CREATE TABLE portfolio_esg_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  as_of_date DATE NOT NULL,
  total_esg_facilities INTEGER NOT NULL DEFAULT 0,
  total_esg_exposure NUMERIC NOT NULL DEFAULT 0,
  sll_count INTEGER NOT NULL DEFAULT 0,
  sll_exposure NUMERIC NOT NULL DEFAULT 0,
  green_loan_count INTEGER NOT NULL DEFAULT 0,
  green_loan_exposure NUMERIC NOT NULL DEFAULT 0,
  social_loan_count INTEGER NOT NULL DEFAULT 0,
  social_loan_exposure NUMERIC NOT NULL DEFAULT 0,
  kpis_on_track INTEGER NOT NULL DEFAULT 0,
  kpis_at_risk INTEGER NOT NULL DEFAULT 0,
  kpis_missed INTEGER NOT NULL DEFAULT 0,
  total_allocated_proceeds NUMERIC NOT NULL DEFAULT 0,
  total_unallocated_proceeds NUMERIC NOT NULL DEFAULT 0,
  weighted_carbon_intensity NUMERIC,
  portfolio_alignment_score NUMERIC,
  calculation_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, as_of_date)
);

-- ===========================================
-- Indexes for Performance
-- ===========================================

-- Core
CREATE INDEX idx_users_organization ON loan_users(organization_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_activities_organization ON activities(organization_id, created_at DESC);

-- Module 1
CREATE INDEX idx_loan_documents_organization ON loan_documents(organization_id);
CREATE INDEX idx_loan_documents_status ON loan_documents(processing_status);
CREATE INDEX idx_loan_facilities_organization ON loan_facilities(organization_id);
CREATE INDEX idx_financial_covenants_facility ON financial_covenants(facility_id);

-- Module 2
CREATE INDEX idx_deals_organization ON deals(organization_id);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deal_participants_deal ON deal_participants(deal_id);
CREATE INDEX idx_deal_participants_user ON deal_participants(user_id);
CREATE INDEX idx_negotiation_terms_deal ON negotiation_terms(deal_id);
CREATE INDEX idx_negotiation_terms_status ON negotiation_terms(deal_id, negotiation_status);
CREATE INDEX idx_term_proposals_term ON term_proposals(term_id);
CREATE INDEX idx_term_proposals_status ON term_proposals(status);

-- Module 3
CREATE INDEX idx_compliance_facilities_organization ON compliance_facilities(organization_id);
CREATE INDEX idx_compliance_obligations_facility ON compliance_obligations(facility_id);
CREATE INDEX idx_compliance_events_facility ON compliance_events(facility_id);
CREATE INDEX idx_compliance_events_deadline ON compliance_events(deadline_date, status);
CREATE INDEX idx_compliance_covenants_facility ON compliance_covenants(facility_id);
CREATE INDEX idx_covenant_tests_covenant ON covenant_tests(covenant_id);

-- Module 4
CREATE INDEX idx_trade_facilities_organization ON trade_facilities(organization_id);
CREATE INDEX idx_lender_positions_facility ON lender_positions(facility_id);
CREATE INDEX idx_lender_positions_organization ON lender_positions(organization_id);
CREATE INDEX idx_trades_facility ON trades(facility_id);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_trades_seller ON trades(seller_organization_id);
CREATE INDEX idx_trades_buyer ON trades(buyer_organization_id);
CREATE INDEX idx_due_diligence_items_checklist ON due_diligence_items(checklist_id);

-- Module 5
CREATE INDEX idx_esg_facilities_organization ON esg_facilities(organization_id);
CREATE INDEX idx_esg_kpis_facility ON esg_kpis(facility_id);
CREATE INDEX idx_esg_targets_kpi ON esg_targets(kpi_id);
CREATE INDEX idx_esg_performance_kpi ON esg_performance(kpi_id);
CREATE INDEX idx_esg_performance_target ON esg_performance(target_id);
CREATE INDEX idx_proceeds_allocations_facility ON proceeds_allocations(facility_id);
CREATE INDEX idx_esg_reports_facility ON esg_reports(facility_id);

-- ===========================================
-- Updated_at Triggers
-- ===========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON loan_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loan_documents_updated_at BEFORE UPDATE ON loan_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loan_facilities_updated_at BEFORE UPDATE ON loan_facilities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_covenants_updated_at BEFORE UPDATE ON financial_covenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reporting_obligations_updated_at BEFORE UPDATE ON reporting_obligations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_of_default_updated_at BEFORE UPDATE ON events_of_default FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_esg_provisions_updated_at BEFORE UPDATE ON esg_provisions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_defined_terms_updated_at BEFORE UPDATE ON defined_terms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_negotiation_terms_updated_at BEFORE UPDATE ON negotiation_terms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_term_comments_updated_at BEFORE UPDATE ON term_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_compliance_facilities_updated_at BEFORE UPDATE ON compliance_facilities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_compliance_obligations_updated_at BEFORE UPDATE ON compliance_obligations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_compliance_events_updated_at BEFORE UPDATE ON compliance_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_compliance_covenants_updated_at BEFORE UPDATE ON compliance_covenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_covenant_tests_updated_at BEFORE UPDATE ON covenant_tests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_events_updated_at BEFORE UPDATE ON notification_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_compliance_waivers_updated_at BEFORE UPDATE ON compliance_waivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trade_facilities_updated_at BEFORE UPDATE ON trade_facilities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lender_positions_updated_at BEFORE UPDATE ON lender_positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_due_diligence_checklists_updated_at BEFORE UPDATE ON due_diligence_checklists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_due_diligence_items_updated_at BEFORE UPDATE ON due_diligence_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settlements_updated_at BEFORE UPDATE ON settlements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_esg_facilities_updated_at BEFORE UPDATE ON esg_facilities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_esg_kpis_updated_at BEFORE UPDATE ON esg_kpis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_esg_performance_updated_at BEFORE UPDATE ON esg_performance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_proceeds_allocations_updated_at BEFORE UPDATE ON proceeds_allocations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_esg_ratings_updated_at BEFORE UPDATE ON esg_ratings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
