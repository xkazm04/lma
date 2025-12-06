import { z } from 'zod';

// Enums
export const dealTypeSchema = z.enum([
  'new_facility',
  'amendment',
  'refinancing',
  'restructuring',
]);

export const dealStatusSchema = z.enum([
  'draft',
  'active',
  'paused',
  'agreed',
  'closed',
  'terminated',
]);

export const negotiationModeSchema = z.enum([
  'bilateral',
  'multilateral',
]);

export const partyTypeSchema = z.enum([
  'borrower_side',
  'lender_side',
  'third_party',
]);

export const dealRoleSchema = z.enum([
  'deal_lead',
  'negotiator',
  'reviewer',
  'observer',
]);

export const participantStatusSchema = z.enum([
  'pending',
  'active',
  'removed',
]);

export const valueTypeSchema = z.enum([
  'text',
  'number',
  'percentage',
  'currency_amount',
  'date',
  'boolean',
  'selection',
  'multi_select',
  'table',
  'rich_text',
]);

export const negotiationStatusSchema = z.enum([
  'not_started',
  'proposed',
  'under_discussion',
  'pending_approval',
  'agreed',
  'locked',
]);

export const proposalStatusSchema = z.enum([
  'pending',
  'accepted',
  'rejected',
  'superseded',
  'withdrawn',
]);

export const proposalResponseSchema = z.enum([
  'accept',
  'reject',
  'counter',
]);

// Deal schemas
export const createDealSchema = z.object({
  deal_name: z.string().min(1).max(200),
  deal_reference: z.string().max(100).optional(),
  deal_type: dealTypeSchema,
  base_facility_id: z.string().uuid().optional(),
  negotiation_mode: negotiationModeSchema.optional().default('bilateral'),
  require_unanimous_consent: z.boolean().optional().default(false),
  auto_lock_agreed_terms: z.boolean().optional().default(true),
  target_signing_date: z.string().optional(),
  target_closing_date: z.string().optional(),
});

export const updateDealSchema = z.object({
  deal_name: z.string().min(1).max(200).optional(),
  deal_reference: z.string().max(100).optional().nullable(),
  negotiation_mode: negotiationModeSchema.optional(),
  require_unanimous_consent: z.boolean().optional(),
  auto_lock_agreed_terms: z.boolean().optional(),
  target_signing_date: z.string().optional().nullable(),
  target_closing_date: z.string().optional().nullable(),
});

export const updateDealStatusSchema = z.object({
  status: dealStatusSchema,
  reason: z.string().max(500).optional(),
});

// Participant schemas
export const inviteParticipantSchema = z.object({
  user_id: z.string().uuid().optional(),
  email: z.string().email().optional(),
  party_name: z.string().min(1).max(200),
  party_type: partyTypeSchema,
  party_role: z.string().min(1).max(100),
  deal_role: dealRoleSchema.optional().default('negotiator'),
  can_approve: z.boolean().optional().default(false),
}).refine(
  (data) => data.user_id || data.email,
  { message: 'Either user_id or email must be provided' }
);

export const updateParticipantSchema = z.object({
  party_name: z.string().min(1).max(200).optional(),
  party_type: partyTypeSchema.optional(),
  party_role: z.string().min(1).max(100).optional(),
  deal_role: dealRoleSchema.optional(),
  can_approve: z.boolean().optional(),
});

// Category schemas
export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  display_order: z.number().int().min(0).optional(),
  parent_category_id: z.string().uuid().optional().nullable(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  display_order: z.number().int().min(0).optional(),
  parent_category_id: z.string().uuid().optional().nullable(),
});

// Term schemas
export const createTermSchema = z.object({
  category_id: z.string().uuid(),
  term_key: z.string().min(1).max(100),
  term_label: z.string().min(1).max(200),
  term_description: z.string().max(1000).optional(),
  source_facility_id: z.string().uuid().optional(),
  source_clause_reference: z.string().max(100).optional(),
  value_type: valueTypeSchema,
  allowed_values: z.any().optional(),
  current_value: z.any().optional(),
  current_value_text: z.string().optional(),
  depends_on: z.array(z.string().uuid()).optional(),
  impacts: z.array(z.string().uuid()).optional(),
  display_order: z.number().int().min(0).optional(),
});

export const updateTermSchema = z.object({
  term_label: z.string().min(1).max(200).optional(),
  term_description: z.string().max(1000).optional().nullable(),
  allowed_values: z.any().optional(),
  current_value: z.any().optional(),
  current_value_text: z.string().optional().nullable(),
  negotiation_status: negotiationStatusSchema.optional(),
  depends_on: z.array(z.string().uuid()).optional(),
  impacts: z.array(z.string().uuid()).optional(),
  display_order: z.number().int().min(0).optional(),
});

export const lockTermSchema = z.object({
  reason: z.string().max(500).optional(),
});

// Proposal schemas
export const createProposalSchema = z.object({
  proposed_value: z.any(),
  proposed_value_text: z.string().optional(),
  rationale: z.string().max(2000).optional(),
});

export const respondToProposalSchema = z.object({
  response: proposalResponseSchema,
  comment: z.string().max(2000).optional(),
  counter_value: z.any().optional(),
}).refine(
  (data) => !(data.response === 'counter' && data.counter_value === undefined),
  { message: 'Counter-proposal requires a counter_value' }
);

// Comment schemas
export const createCommentSchema = z.object({
  content: z.string().min(1).max(5000),
  proposal_id: z.string().uuid().optional(),
  parent_comment_id: z.string().uuid().optional(),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(5000),
});

// Impact analysis schema
export const impactAnalysisSchema = z.object({
  proposed_value: z.any(),
});

// Suggestion schema
export const suggestionRequestSchema = z.object({
  context: z.string().max(2000).optional(),
});

// Export schemas
export const exportTermSheetSchema = z.object({
  include_pending: z.boolean().optional().default(false),
  format: z.enum(['pdf', 'docx', 'json']).optional().default('pdf'),
});

export const exportAuditTrailSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  format: z.enum(['pdf', 'csv', 'json']).optional().default('pdf'),
});

// Import facility schema
export const importFacilitySchema = z.object({
  facility_id: z.string().uuid(),
  import_covenants: z.boolean().optional().default(true),
  import_obligations: z.boolean().optional().default(true),
  import_esg: z.boolean().optional().default(true),
});

// Type exports
export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;
export type UpdateDealStatusInput = z.infer<typeof updateDealStatusSchema>;
export type InviteParticipantInput = z.infer<typeof inviteParticipantSchema>;
export type UpdateParticipantInput = z.infer<typeof updateParticipantSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateTermInput = z.infer<typeof createTermSchema>;
export type UpdateTermInput = z.infer<typeof updateTermSchema>;
export type LockTermInput = z.infer<typeof lockTermSchema>;
export type CreateProposalInput = z.infer<typeof createProposalSchema>;
export type RespondToProposalInput = z.infer<typeof respondToProposalSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type ImpactAnalysisInput = z.infer<typeof impactAnalysisSchema>;
export type SuggestionRequestInput = z.infer<typeof suggestionRequestSchema>;
export type ExportTermSheetInput = z.infer<typeof exportTermSheetSchema>;
export type ExportAuditTrailInput = z.infer<typeof exportAuditTrailSchema>;
export type ImportFacilityInput = z.infer<typeof importFacilitySchema>;
