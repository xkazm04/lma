// =============================================================================
// Document Generation & E-Signature Types
// =============================================================================

import type { ItemType, CalendarEvent, Covenant } from './types';

/**
 * Document template types for compliance documents.
 */
export type DocumentTemplateType =
  | 'compliance_certificate'
  | 'covenant_calculation_worksheet'
  | 'financial_summary'
  | 'borrowing_base_certificate'
  | 'notification_letter'
  | 'waiver_request';

/**
 * Document generation status.
 */
export type DocumentStatus =
  | 'draft'
  | 'pending_review'
  | 'pending_signature'
  | 'partially_signed'
  | 'completed'
  | 'rejected'
  | 'expired';

/**
 * E-signature status for individual signers.
 */
export type SignatureStatus =
  | 'pending'
  | 'viewed'
  | 'signed'
  | 'declined'
  | 'expired';

/**
 * Signer role types.
 */
export type SignerRole =
  | 'borrower_cfo'
  | 'borrower_controller'
  | 'borrower_authorized_officer'
  | 'agent_bank'
  | 'lender_representative'
  | 'auditor';

// Note: getDocumentStatusColor and getSignatureStatusColor have been moved to
// @/lib/utils/color-resolver.ts for centralized color management.
// Import from '@/lib/utils' instead.

/**
 * Helper function for document status label.
 */
export function getDocumentStatusLabel(status: DocumentStatus): string {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'pending_review':
      return 'Pending Review';
    case 'pending_signature':
      return 'Awaiting Signature';
    case 'partially_signed':
      return 'Partially Signed';
    case 'completed':
      return 'Completed';
    case 'rejected':
      return 'Rejected';
    case 'expired':
      return 'Expired';
    default:
      return 'Unknown';
  }
}

/**
 * Helper function for template type label.
 */
export function getTemplateTypeLabel(type: DocumentTemplateType): string {
  switch (type) {
    case 'compliance_certificate':
      return 'Compliance Certificate';
    case 'covenant_calculation_worksheet':
      return 'Covenant Calculation Worksheet';
    case 'financial_summary':
      return 'Financial Summary';
    case 'borrowing_base_certificate':
      return 'Borrowing Base Certificate';
    case 'notification_letter':
      return 'Notification Letter';
    case 'waiver_request':
      return 'Waiver Request';
    default:
      return 'Unknown Document';
  }
}

/**
 * Helper function for signer role label.
 */
export function getSignerRoleLabel(role: SignerRole): string {
  switch (role) {
    case 'borrower_cfo':
      return 'CFO';
    case 'borrower_controller':
      return 'Controller';
    case 'borrower_authorized_officer':
      return 'Authorized Officer';
    case 'agent_bank':
      return 'Agent Bank Representative';
    case 'lender_representative':
      return 'Lender Representative';
    case 'auditor':
      return 'Auditor';
    default:
      return 'Unknown';
  }
}

// =============================================================================
// Document Template Interfaces
// =============================================================================

/**
 * Document template configuration.
 */
export interface DocumentTemplate {
  id: string;
  type: DocumentTemplateType;
  name: string;
  description: string;
  version: string;
  required_data_fields: string[];
  optional_data_fields: string[];
  required_signers: SignerRole[];
  optional_signers: SignerRole[];
  default_expiration_days: number;
  created_at: string;
  updated_at: string;
}

/**
 * Data source for document generation.
 */
export interface DocumentDataSource {
  facility_id: string;
  facility_name: string;
  borrower_name: string;
  period_start_date: string;
  period_end_date: string;
  submission_date: string;

  // Financial data
  financials?: FinancialData;

  // Covenant data
  covenants?: CovenantCalculationData[];

  // Borrowing base data
  borrowing_base?: BorrowingBaseData;

  // Additional context
  notes?: string;
  attachments?: string[];
}

/**
 * Financial data for document generation.
 */
export interface FinancialData {
  revenue: number;
  ebitda: number;
  net_income: number;
  total_assets: number;
  total_liabilities: number;
  total_debt: number;
  cash_and_equivalents: number;
  accounts_receivable: number;
  inventory: number;
  interest_expense: number;
  capital_expenditures: number;
  depreciation_amortization: number;
  currency: string;
  period_type: 'monthly' | 'quarterly' | 'annually';
}

/**
 * Covenant calculation data for worksheets.
 */
export interface CovenantCalculationData {
  covenant_id: string;
  covenant_name: string;
  covenant_type: string;
  threshold_type: 'maximum' | 'minimum';
  threshold_value: number;
  calculated_value: number;
  numerator_value: number;
  numerator_description: string;
  denominator_value: number;
  denominator_description: string;
  test_result: 'pass' | 'fail';
  headroom_percentage: number;
  headroom_absolute: number;
  calculation_notes?: string;
}

/**
 * Borrowing base data for certificates.
 */
export interface BorrowingBaseData {
  eligible_receivables: number;
  receivables_advance_rate: number;
  receivables_available: number;
  eligible_inventory: number;
  inventory_advance_rate: number;
  inventory_available: number;
  total_availability: number;
  outstanding_loans: number;
  outstanding_letters_of_credit: number;
  excess_availability: number;
  currency: string;
}

// =============================================================================
// Generated Document Interfaces
// =============================================================================

/**
 * Generated compliance document.
 */
export interface GeneratedDocument {
  id: string;
  template_id: string;
  template_type: DocumentTemplateType;
  document_name: string;
  facility_id: string;
  facility_name: string;
  borrower_name: string;
  event_id: string | null;
  event_type: ItemType | null;

  // Status tracking
  status: DocumentStatus;
  version: number;

  // Content
  content: DocumentContent;

  // Data snapshot (what was used to generate)
  data_snapshot: DocumentDataSource;

  // E-signature workflow
  signature_workflow: SignatureWorkflow | null;

  // Timestamps
  generated_at: string;
  generated_by: string;
  last_modified_at: string;
  submitted_at: string | null;
  completed_at: string | null;
  expires_at: string | null;

  // Audit trail
  audit_trail: AuditTrailEntry[];
}

/**
 * Document content structure.
 */
export interface DocumentContent {
  title: string;
  subtitle?: string;
  header: DocumentSection;
  sections: DocumentSection[];
  footer?: DocumentSection;
  certifications: CertificationStatement[];
  signature_blocks: SignatureBlock[];
}

/**
 * Document section.
 */
export interface DocumentSection {
  id: string;
  title?: string;
  content: string;
  tables?: DocumentTable[];
  subsections?: DocumentSection[];
}

/**
 * Document table for financial data.
 */
export interface DocumentTable {
  id: string;
  title?: string;
  headers: string[];
  rows: TableRow[];
  footer_row?: TableRow;
  notes?: string;
}

/**
 * Table row data.
 */
export interface TableRow {
  cells: TableCell[];
  is_highlight?: boolean;
  is_total?: boolean;
}

/**
 * Table cell data.
 */
export interface TableCell {
  value: string;
  align?: 'left' | 'center' | 'right';
  format?: 'text' | 'number' | 'currency' | 'percentage';
  is_bold?: boolean;
}

/**
 * Certification statement in compliance documents.
 */
export interface CertificationStatement {
  id: string;
  statement: string;
  is_required: boolean;
}

/**
 * Signature block for signers.
 */
export interface SignatureBlock {
  id: string;
  signer_role: SignerRole;
  signer_title: string;
  organization: string;
  placeholder_text: string;
}

// =============================================================================
// E-Signature Workflow Interfaces
// =============================================================================

/**
 * E-signature workflow for a document.
 */
export interface SignatureWorkflow {
  id: string;
  document_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'expired';
  signers: Signer[];
  signing_order: 'sequential' | 'parallel';
  reminder_frequency_hours: number;
  expires_at: string;
  created_at: string;
  completed_at: string | null;
}

/**
 * Individual signer in a workflow.
 */
export interface Signer {
  id: string;
  role: SignerRole;
  name: string;
  email: string;
  title: string;
  organization: string;
  signing_order: number;
  status: SignatureStatus;
  signature_data: SignatureData | null;
  viewed_at: string | null;
  signed_at: string | null;
  declined_at: string | null;
  decline_reason: string | null;
  reminder_sent_at: string | null;
  reminders_count: number;
}

/**
 * Captured signature data.
 */
export interface SignatureData {
  signature_type: 'drawn' | 'typed' | 'uploaded';
  signature_value: string;
  ip_address: string;
  user_agent: string;
  timestamp: string;
  geolocation?: {
    latitude: number;
    longitude: number;
  };
}

// =============================================================================
// Audit Trail Interfaces
// =============================================================================

/**
 * Audit trail entry for document tracking.
 */
export interface AuditTrailEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  actor_id: string;
  actor_name: string;
  actor_email: string;
  actor_role: SignerRole | 'system' | 'admin';
  details: string;
  ip_address?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Audit action types.
 */
export type AuditAction =
  | 'document_generated'
  | 'document_viewed'
  | 'document_edited'
  | 'document_submitted'
  | 'workflow_started'
  | 'reminder_sent'
  | 'document_viewed_by_signer'
  | 'signature_applied'
  | 'signature_declined'
  | 'document_completed'
  | 'document_rejected'
  | 'document_expired'
  | 'document_downloaded'
  | 'version_created';

// =============================================================================
// Document Generation Request/Response
// =============================================================================

/**
 * Request to generate a document.
 */
export interface GenerateDocumentRequest {
  template_type: DocumentTemplateType;
  event_id?: string;
  facility_id: string;
  data_source: DocumentDataSource;
  custom_fields?: Record<string, string>;
  signers?: SignerConfig[];
  signing_order?: 'sequential' | 'parallel';
  expiration_days?: number;
}

/**
 * Signer configuration for document generation.
 */
export interface SignerConfig {
  role: SignerRole;
  name: string;
  email: string;
  title: string;
  organization: string;
  is_required: boolean;
}

/**
 * Response from document generation.
 */
export interface GenerateDocumentResponse {
  success: boolean;
  document?: GeneratedDocument;
  error?: string;
  warnings?: string[];
}

/**
 * Request to initiate e-signature workflow.
 */
export interface InitiateSignatureRequest {
  document_id: string;
  signers: SignerConfig[];
  signing_order: 'sequential' | 'parallel';
  message?: string;
  reminder_frequency_hours?: number;
  expiration_days?: number;
}

/**
 * Response from signature initiation.
 */
export interface InitiateSignatureResponse {
  success: boolean;
  workflow?: SignatureWorkflow;
  error?: string;
}

/**
 * Request to apply signature.
 */
export interface ApplySignatureRequest {
  workflow_id: string;
  signer_id: string;
  signature_type: 'drawn' | 'typed' | 'uploaded';
  signature_value: string;
}

/**
 * Response from signature application.
 */
export interface ApplySignatureResponse {
  success: boolean;
  workflow?: SignatureWorkflow;
  document?: GeneratedDocument;
  error?: string;
}

// =============================================================================
// Document Version Interface
// =============================================================================

/**
 * Document version for tracking changes.
 */
export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  content: DocumentContent;
  data_snapshot: DocumentDataSource;
  created_at: string;
  created_by: string;
  change_summary: string;
}

// =============================================================================
// Helper Types for UI
// =============================================================================

/**
 * Document list item for display.
 */
export interface DocumentListItem {
  id: string;
  name: string;
  template_type: DocumentTemplateType;
  facility_name: string;
  borrower_name: string;
  status: DocumentStatus;
  version: number;
  generated_at: string;
  expires_at: string | null;
  pending_signatures: number;
  total_signatures: number;
}

/**
 * Calendar event with document context.
 */
export interface CalendarEventWithDocuments extends CalendarEvent {
  available_templates: DocumentTemplateType[];
  generated_documents: DocumentListItem[];
  has_pending_documents: boolean;
}

/**
 * Mapping of event types to available document templates.
 */
export const EVENT_TYPE_TEMPLATES: Record<ItemType, DocumentTemplateType[]> = {
  compliance_event: ['compliance_certificate', 'financial_summary', 'borrowing_base_certificate'],
  covenant_test: ['covenant_calculation_worksheet', 'compliance_certificate'],
  notification_due: ['notification_letter'],
  waiver_expiration: ['waiver_request'],
};
