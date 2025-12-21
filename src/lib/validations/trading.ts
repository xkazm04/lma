import { z } from 'zod';

// Enums
export const transferabilitySchema = z.enum([
  'freely_transferable',
  'consent_required',
  'restricted',
]);

export const facilityStatusSchema = z.enum([
  'performing',
  'default',
  'restructuring',
]);

export const acquisitionTypeSchema = z.enum([
  'primary',
  'secondary',
]);

export const settlementDateTypeSchema = z.enum([
  't_plus_days',
  'specific_date',
]);

export const accruedInterestHandlingSchema = z.enum([
  'buyer_pays',
  'seller_retains',
  'settle_at_closing',
]);

export const tradeStatusSchema = z.enum([
  'draft',
  'agreed',
  'in_due_diligence',
  'documentation',
  'pending_consent',
  'pending_settlement',
  'settled',
  'cancelled',
  'failed',
]);

export const ddChecklistStatusSchema = z.enum([
  'not_started',
  'in_progress',
  'complete',
  'flagged',
]);

export const ddCategorySchema = z.enum([
  'facility_status',
  'borrower_creditworthiness',
  'financial_performance',
  'covenant_compliance',
  'documentation',
  'transferability',
  'legal_regulatory',
  'operational',
]);

export const ddDataSourceSchema = z.enum([
  'auto_system',
  'seller_provided',
  'document_review',
  'external',
]);

export const ddItemStatusSchema = z.enum([
  'pending',
  'in_review',
  'verified',
  'flagged',
  'waived',
  'not_applicable',
]);

export const ddFlagSeveritySchema = z.enum([
  'info',
  'warning',
  'blocker',
]);

export const ddRequiredForSchema = z.enum([
  'buyer',
  'seller',
  'both',
]);

export const questionStatusSchema = z.enum([
  'open',
  'answered',
  'closed',
]);

export const tradingPartySchema = z.enum([
  'buyer',
  'seller',
]);

export const visibilitySchema = z.enum([
  'private',
  'invited_only',
  'all_approved_buyers',
]);

export const tradeEventTypeSchema = z.enum([
  'trade_created',
  'terms_agreed',
  'dd_started',
  'dd_item_verified',
  'dd_item_flagged',
  'question_asked',
  'question_answered',
  'dd_completed',
  'consent_requested',
  'consent_received',
  'consent_rejected',
  'documentation_prepared',
  'documentation_executed',
  'agent_notified',
  'funds_received',
  'transfer_recorded',
  'trade_settled',
  'trade_cancelled',
]);

export const settlementStatusSchema = z.enum([
  'pending',
  'funds_in_transit',
  'settled',
  'failed',
]);

// Trade Facility Schemas
export const createTradeFacilitySchema = z.object({
  source_facility_id: z.string().uuid().optional().nullable(),
  compliance_facility_id: z.string().uuid().optional().nullable(),
  facility_name: z.string().min(1).max(500),
  facility_reference: z.string().max(100).optional().nullable(),
  borrower_name: z.string().min(1).max(500),
  total_commitments: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  maturity_date: z.string(),
  transferability: transferabilitySchema.default('consent_required'),
  minimum_transfer_amount: z.number().positive().optional().nullable(),
  minimum_hold_amount: z.number().positive().optional().nullable(),
  restricted_parties: z.array(z.string()).optional().nullable(),
  current_status: facilityStatusSchema.default('performing'),
});

export const updateTradeFacilitySchema = createTradeFacilitySchema.partial();

// Lender Position Schemas
export const createLenderPositionSchema = z.object({
  facility_id: z.string().uuid(),
  commitment_amount: z.number().positive(),
  outstanding_principal: z.number().nonnegative().default(0),
  unfunded_commitment: z.number().nonnegative().default(0),
  pro_rata_share: z.number().min(0).max(100),
  acquisition_date: z.string(),
  acquisition_price: z.number().positive().default(100),
  acquisition_type: acquisitionTypeSchema.default('primary'),
  predecessor_lender: z.string().max(500).optional().nullable(),
});

export const updateLenderPositionSchema = createLenderPositionSchema.partial().omit({ facility_id: true });

// Trade Schemas
export const createTradeSchema = z.object({
  facility_id: z.string().uuid(),
  seller_position_id: z.string().uuid(),
  buyer_organization_id: z.string().uuid(),
  trade_date: z.string(),
  settlement_date: z.string(),
  settlement_date_type: settlementDateTypeSchema.default('t_plus_days'),
  settlement_days: z.number().int().positive().optional().nullable(),
  trade_amount: z.number().positive(),
  trade_price: z.number().positive(),
  trade_currency: z.string().length(3).default('USD'),
  accrued_interest_handling: accruedInterestHandlingSchema.default('settle_at_closing'),
  accrued_interest_amount: z.number().optional().nullable(),
  delayed_compensation: z.boolean().default(false),
  delayed_compensation_rate: z.number().optional().nullable(),
  consent_required: z.boolean().default(false),
});

export const updateTradeSchema = z.object({
  trade_date: z.string().optional(),
  settlement_date: z.string().optional(),
  settlement_date_type: settlementDateTypeSchema.optional(),
  settlement_days: z.number().int().positive().optional().nullable(),
  trade_amount: z.number().positive().optional(),
  trade_price: z.number().positive().optional(),
  accrued_interest_handling: accruedInterestHandlingSchema.optional(),
  accrued_interest_amount: z.number().optional().nullable(),
  delayed_compensation: z.boolean().optional(),
  delayed_compensation_rate: z.number().optional().nullable(),
  status: tradeStatusSchema.optional(),
  consent_required: z.boolean().optional(),
  consent_received: z.boolean().optional(),
  consent_date: z.string().optional().nullable(),
  agent_notified: z.boolean().optional(),
  agent_notification_date: z.string().optional().nullable(),
  assignment_document_id: z.string().uuid().optional().nullable(),
});

export const agreeTradeSchema = z.object({
  confirmed: z.literal(true),
});

export const cancelTradeSchema = z.object({
  reason: z.string().min(1).max(1000),
});

// Due Diligence Item Schemas
export const updateDDItemSchema = z.object({
  status: ddItemStatusSchema.optional(),
  verification_notes: z.string().optional().nullable(),
  flag_reason: z.string().optional().nullable(),
  flag_severity: ddFlagSeveritySchema.optional().nullable(),
  evidence_document_ids: z.array(z.string().uuid()).optional().nullable(),
  evidence_notes: z.string().optional().nullable(),
});

export const verifyDDItemSchema = z.object({
  verification_notes: z.string().optional(),
  evidence_document_ids: z.array(z.string().uuid()).optional(),
  evidence_notes: z.string().optional(),
});

export const flagDDItemSchema = z.object({
  flag_reason: z.string().min(1),
  flag_severity: ddFlagSeveritySchema,
});

export const completeDDSchema = z.object({
  confirmed: z.literal(true),
});

// Question Schemas
export const createQuestionSchema = z.object({
  checklist_item_id: z.string().uuid().optional().nullable(),
  question_text: z.string().min(1).max(5000),
  question_attachments: z.array(z.string().uuid()).optional(),
});

export const answerQuestionSchema = z.object({
  response_text: z.string().min(1).max(10000),
  response_attachments: z.array(z.string().uuid()).optional(),
});

export const closeQuestionSchema = z.object({
  confirmed: z.literal(true),
});

// AI Query Schema
export const aiQuerySchema = z.object({
  question: z.string().min(1).max(2000),
});

// Information Package Schemas
export const createInfoPackageSchema = z.object({
  facility_id: z.string().uuid(),
  trade_id: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  visibility: visibilitySchema.default('private'),
  document_ids: z.array(z.string().uuid()).default([]),
  expires_at: z.string().optional().nullable(),
});

export const updateInfoPackageSchema = createInfoPackageSchema.partial().omit({ facility_id: true });

export const sharePackageSchema = z.object({
  organization_ids: z.array(z.string().uuid()),
});

// Consent Schemas
export const requestConsentSchema = z.object({
  consent_type: z.enum(['borrower', 'agent', 'lenders']),
  request_notes: z.string().max(2000).optional(),
});

export const updateConsentSchema = z.object({
  consent_received: z.boolean(),
  consent_date: z.string().optional().nullable(),
  consent_notes: z.string().max(2000).optional(),
});

// Settlement Schemas
export const calculateSettlementSchema = z.object({
  calculation_date: z.string().optional(),
});

export const updateSettlementSchema = z.object({
  seller_wire_instructions: z.record(z.string(), z.any()).optional().nullable(),
  buyer_wire_reference: z.string().max(100).optional().nullable(),
  funds_sent_at: z.string().optional().nullable(),
  funds_received_at: z.string().optional().nullable(),
  agent_received_docs_at: z.string().optional().nullable(),
  agent_processed_at: z.string().optional().nullable(),
  transfer_effective_date: z.string().optional().nullable(),
});

export const confirmSettlementSchema = z.object({
  party: z.enum(['seller', 'buyer', 'agent']),
  confirmed: z.literal(true),
});

// Report Schemas
export const generateDDReportSchema = z.object({
  include_qa: z.boolean().default(true),
  include_timeline: z.boolean().default(true),
});

export const generateSettlementReportSchema = z.object({
  format: z.enum(['summary', 'detailed']).default('summary'),
});

// Export all schema types
export type CreateTradeFacilityInput = z.infer<typeof createTradeFacilitySchema>;
export type UpdateTradeFacilityInput = z.infer<typeof updateTradeFacilitySchema>;
export type CreateLenderPositionInput = z.infer<typeof createLenderPositionSchema>;
export type UpdateLenderPositionInput = z.infer<typeof updateLenderPositionSchema>;
export type CreateTradeInput = z.infer<typeof createTradeSchema>;
export type UpdateTradeInput = z.infer<typeof updateTradeSchema>;
export type UpdateDDItemInput = z.infer<typeof updateDDItemSchema>;
export type VerifyDDItemInput = z.infer<typeof verifyDDItemSchema>;
export type FlagDDItemInput = z.infer<typeof flagDDItemSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type AnswerQuestionInput = z.infer<typeof answerQuestionSchema>;
export type AIQueryInput = z.infer<typeof aiQuerySchema>;
export type CreateInfoPackageInput = z.infer<typeof createInfoPackageSchema>;
export type UpdateInfoPackageInput = z.infer<typeof updateInfoPackageSchema>;
export type RequestConsentInput = z.infer<typeof requestConsentSchema>;
export type UpdateConsentInput = z.infer<typeof updateConsentSchema>;
export type UpdateSettlementInput = z.infer<typeof updateSettlementSchema>;
export type ConfirmSettlementInput = z.infer<typeof confirmSettlementSchema>;
