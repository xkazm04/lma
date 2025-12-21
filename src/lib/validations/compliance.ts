import { z } from 'zod';

// Enums
export const complianceFacilityStatusSchema = z.enum([
  'active',
  'waiver_period',
  'default',
  'closed',
]);

export const obligationTypeSchema = z.enum([
  'annual_audited_financials',
  'quarterly_financials',
  'monthly_financials',
  'compliance_certificate',
  'annual_budget',
  'projections',
  'covenant_calculation',
  'esg_report',
  'insurance_certificate',
  'other',
]);

export const frequencySchema = z.enum([
  'annual',
  'semi_annual',
  'quarterly',
  'monthly',
  'one_time',
  'on_event',
]);

export const referencePointSchema = z.enum([
  'period_end',
  'fiscal_year_end',
  'fixed_date',
  'event_date',
]);

export const complianceEventStatusSchema = z.enum([
  'upcoming',
  'due_soon',
  'overdue',
  'submitted',
  'under_review',
  'accepted',
  'rejected',
  'waived',
]);

export const complianceDocumentTypeSchema = z.enum([
  'financial_statements',
  'compliance_certificate',
  'covenant_calculation',
  'supporting_schedule',
  'other',
]);

export const covenantTypeSchema = z.enum([
  'leverage_ratio',
  'interest_coverage',
  'fixed_charge_coverage',
  'debt_service_coverage',
  'current_ratio',
  'net_worth',
  'tangible_net_worth',
  'capex',
  'minimum_liquidity',
  'maximum_debt',
  'other',
]);

export const thresholdTypeSchema = z.enum(['maximum', 'minimum']);

export const testingFrequencySchema = z.enum([
  'quarterly',
  'semi_annual',
  'annual',
]);

export const testingBasisSchema = z.enum([
  'period_end',
  'rolling_12_months',
  'rolling_4_quarters',
]);

export const testResultSchema = z.enum(['pass', 'fail', 'cured', 'waived']);

export const notificationEventTypeSchema = z.enum([
  'default_event',
  'potential_default',
  'material_litigation',
  'change_of_control',
  'material_acquisition',
  'material_disposal',
  'material_contract',
  'environmental_claim',
  'insurance_claim',
  'change_of_auditors',
  'material_adverse_change',
  'other',
]);

export const notificationStatusSchema = z.enum([
  'pending',
  'sent',
  'acknowledged',
  'resolved',
]);

export const reminderTypeSchema = z.enum([
  'deadline_approaching',
  'covenant_test_due',
  'waiver_expiring',
  'custom',
]);

export const notificationChannelSchema = z.enum(['in_app', 'email', 'both']);

export const waiverTypeSchema = z.enum([
  'covenant_waiver',
  'deadline_extension',
  'consent',
  'amendment',
]);

export const requiredConsentSchema = z.enum([
  'agent',
  'majority_lenders',
  'all_lenders',
]);

export const waiverStatusSchema = z.enum([
  'requested',
  'approved',
  'rejected',
  'expired',
  'superseded',
]);

// Facility schemas
export const createComplianceFacilitySchema = z.object({
  source_facility_id: z.string().uuid().optional(),
  facility_name: z.string().min(1).max(200),
  facility_reference: z.string().max(100).optional(),
  borrower_name: z.string().min(1).max(200),
  maturity_date: z.string().optional(),
  fiscal_year_end: z.string().optional(),
  reporting_currency: z.string().min(3).max(3).default('USD'),
});

export const updateComplianceFacilitySchema = z.object({
  facility_name: z.string().min(1).max(200).optional(),
  facility_reference: z.string().max(100).optional().nullable(),
  borrower_name: z.string().min(1).max(200).optional(),
  maturity_date: z.string().optional().nullable(),
  fiscal_year_end: z.string().optional().nullable(),
  reporting_currency: z.string().min(3).max(3).optional(),
  status: complianceFacilityStatusSchema.optional(),
});

export const syncFacilitySchema = z.object({
  source_facility_id: z.string().uuid(),
  import_obligations: z.boolean().default(true),
  import_covenants: z.boolean().default(true),
  import_notifications: z.boolean().default(true),
});

// Obligation schemas
export const createObligationSchema = z.object({
  source_obligation_id: z.string().uuid().optional(),
  obligation_type: obligationTypeSchema,
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  frequency: frequencySchema,
  reference_point: referencePointSchema.default('period_end'),
  deadline_days: z.number().int().min(0).default(90),
  deadline_business_days: z.boolean().default(false),
  fixed_deadline_dates: z.array(z.string()).optional(),
  grace_period_days: z.number().int().min(0).default(0),
  recipient_roles: z.array(z.string()).default(['Agent']),
  requires_certification: z.boolean().default(false),
  requires_audit: z.boolean().default(false),
  format_requirements: z.string().max(1000).optional(),
  clause_reference: z.string().max(100).optional(),
});

export const updateObligationSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  frequency: frequencySchema.optional(),
  reference_point: referencePointSchema.optional(),
  deadline_days: z.number().int().min(0).optional(),
  deadline_business_days: z.boolean().optional(),
  fixed_deadline_dates: z.array(z.string()).optional().nullable(),
  grace_period_days: z.number().int().min(0).optional(),
  recipient_roles: z.array(z.string()).optional(),
  requires_certification: z.boolean().optional(),
  requires_audit: z.boolean().optional(),
  format_requirements: z.string().max(1000).optional().nullable(),
  clause_reference: z.string().max(100).optional().nullable(),
  is_active: z.boolean().optional(),
});

// Compliance Event schemas
export const submitComplianceEventSchema = z.object({
  submission_notes: z.string().max(2000).optional(),
});

export const reviewComplianceEventSchema = z.object({
  status: z.enum(['accepted', 'rejected']),
  review_notes: z.string().max(2000).optional(),
});

export const updateComplianceEventSchema = z.object({
  status: complianceEventStatusSchema.optional(),
  deadline_date: z.string().optional(),
  grace_deadline_date: z.string().optional(),
});

// Covenant schemas
export const createCovenantSchema = z.object({
  source_covenant_id: z.string().uuid().optional(),
  covenant_type: covenantTypeSchema,
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  numerator_definition: z.string().max(1000).optional(),
  denominator_definition: z.string().max(1000).optional(),
  formula_description: z.string().max(2000).optional(),
  threshold_type: thresholdTypeSchema.default('maximum'),
  threshold_schedule: z.array(z.object({
    effective_from: z.string(),
    threshold_value: z.number(),
  })).optional(),
  testing_frequency: testingFrequencySchema.default('quarterly'),
  testing_basis: testingBasisSchema.default('period_end'),
  has_equity_cure: z.boolean().default(false),
  equity_cure_details: z.string().max(2000).optional(),
  cure_period_days: z.number().int().min(0).optional(),
  max_cures: z.number().int().min(0).optional(),
  consecutive_cure_limit: z.number().int().min(0).optional(),
  clause_reference: z.string().max(100).optional(),
});

export const updateCovenantSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  numerator_definition: z.string().max(1000).optional().nullable(),
  denominator_definition: z.string().max(1000).optional().nullable(),
  formula_description: z.string().max(2000).optional().nullable(),
  threshold_type: thresholdTypeSchema.optional(),
  threshold_schedule: z.array(z.object({
    effective_from: z.string(),
    threshold_value: z.number(),
  })).optional().nullable(),
  testing_frequency: testingFrequencySchema.optional(),
  testing_basis: testingBasisSchema.optional(),
  has_equity_cure: z.boolean().optional(),
  equity_cure_details: z.string().max(2000).optional().nullable(),
  cure_period_days: z.number().int().min(0).optional().nullable(),
  max_cures: z.number().int().min(0).optional().nullable(),
  consecutive_cure_limit: z.number().int().min(0).optional().nullable(),
  clause_reference: z.string().max(100).optional().nullable(),
  is_active: z.boolean().optional(),
});

// Covenant Test schemas
export const submitCovenantTestSchema = z.object({
  test_date: z.string(),
  period_start: z.string(),
  period_end: z.string(),
  numerator_value: z.number().optional(),
  denominator_value: z.number().optional(),
  calculated_ratio: z.number().optional(),
  threshold_value: z.number(),
  calculation_details: z.record(z.string(), z.any()).optional(),
  compliance_event_id: z.string().uuid().optional(),
});

export const calculateCovenantSchema = z.object({
  inputs: z.record(z.string(), z.number()),
  period_end: z.string(),
});

export const updateCovenantTestSchema = z.object({
  test_result: testResultSchema.optional(),
  cure_applied: z.boolean().optional(),
  cure_amount: z.number().optional().nullable(),
  waiver_obtained: z.boolean().optional(),
  waiver_reference: z.string().max(200).optional().nullable(),
});

// Notification Requirement schemas
export const createNotificationRequirementSchema = z.object({
  event_type: notificationEventTypeSchema,
  name: z.string().min(1).max(200),
  trigger_description: z.string().max(2000).optional(),
  notification_deadline: z.string().max(100).optional(),
  notification_deadline_days: z.number().int().optional(),
  recipient_roles: z.array(z.string()).default(['Agent']),
  required_content: z.string().max(2000).optional(),
  clause_reference: z.string().max(100).optional(),
});

export const updateNotificationRequirementSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  trigger_description: z.string().max(2000).optional().nullable(),
  notification_deadline: z.string().max(100).optional().nullable(),
  notification_deadline_days: z.number().int().optional().nullable(),
  recipient_roles: z.array(z.string()).optional(),
  required_content: z.string().max(2000).optional().nullable(),
  clause_reference: z.string().max(100).optional().nullable(),
  is_active: z.boolean().optional(),
});

// Notification Event schemas
export const createNotificationEventSchema = z.object({
  requirement_id: z.string().uuid(),
  event_date: z.string(),
  event_description: z.string().max(2000).optional(),
  notification_due_date: z.string(),
  notification_content: z.string().max(5000).optional(),
});

export const updateNotificationEventSchema = z.object({
  status: notificationStatusSchema.optional(),
  notification_sent_date: z.string().optional(),
  notification_content: z.string().max(5000).optional(),
});

// Analyze Event schema (for LLM)
export const analyzeEventSchema = z.object({
  event_description: z.string().min(1).max(5000),
  facility_ids: z.array(z.string().uuid()).optional(),
});

// Waiver schemas
export const createWaiverSchema = z.object({
  waiver_type: waiverTypeSchema,
  related_covenant_id: z.string().uuid().optional(),
  related_event_id: z.string().uuid().optional(),
  description: z.string().max(2000).optional(),
  waiver_period_start: z.string().optional(),
  waiver_period_end: z.string().optional(),
  conditions: z.string().max(2000).optional(),
  fee_amount: z.number().optional(),
  fee_currency: z.string().min(3).max(3).optional(),
  required_consent: requiredConsentSchema.default('agent'),
});

export const updateWaiverSchema = z.object({
  description: z.string().max(2000).optional().nullable(),
  waiver_period_start: z.string().optional().nullable(),
  waiver_period_end: z.string().optional().nullable(),
  conditions: z.string().max(2000).optional().nullable(),
  fee_amount: z.number().optional().nullable(),
  fee_currency: z.string().min(3).max(3).optional().nullable(),
  required_consent: requiredConsentSchema.optional(),
  consent_obtained_date: z.string().optional().nullable(),
  status: waiverStatusSchema.optional(),
  waiver_document_id: z.string().uuid().optional().nullable(),
});

// Reminder schemas
export const createReminderSchema = z.object({
  compliance_event_id: z.string().uuid().optional(),
  covenant_id: z.string().uuid().optional(),
  reminder_type: reminderTypeSchema,
  days_before: z.number().int().min(0).default(7),
  notify_users: z.array(z.string().uuid()).default([]),
  notify_roles: z.array(z.string()).default([]),
  notification_channel: notificationChannelSchema.default('both'),
  scheduled_for: z.string(),
});

// Calendar query schema
export const calendarQuerySchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  facility_ids: z.array(z.string().uuid()).optional(),
  types: z.array(z.string()).optional(),
});

// Dashboard query schema
export const dashboardQuerySchema = z.object({
  facility_ids: z.array(z.string().uuid()).optional(),
});

// Report schemas
export const complianceStatusReportSchema = z.object({
  facility_ids: z.array(z.string().uuid()).optional(),
  as_of_date: z.string().optional(),
  format: z.enum(['pdf', 'json', 'csv']).default('json'),
});

export const covenantSummaryReportSchema = z.object({
  facility_ids: z.array(z.string().uuid()).optional(),
  include_history: z.boolean().default(false),
  format: z.enum(['pdf', 'json', 'csv']).default('json'),
});

export const complianceHistoryReportSchema = z.object({
  facility_ids: z.array(z.string().uuid()).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  format: z.enum(['pdf', 'json', 'csv']).default('json'),
});

// Type exports
export type CreateComplianceFacilityInput = z.infer<typeof createComplianceFacilitySchema>;
export type UpdateComplianceFacilityInput = z.infer<typeof updateComplianceFacilitySchema>;
export type SyncFacilityInput = z.infer<typeof syncFacilitySchema>;
export type CreateObligationInput = z.infer<typeof createObligationSchema>;
export type UpdateObligationInput = z.infer<typeof updateObligationSchema>;
export type SubmitComplianceEventInput = z.infer<typeof submitComplianceEventSchema>;
export type ReviewComplianceEventInput = z.infer<typeof reviewComplianceEventSchema>;
export type UpdateComplianceEventInput = z.infer<typeof updateComplianceEventSchema>;
export type CreateCovenantInput = z.infer<typeof createCovenantSchema>;
export type UpdateCovenantInput = z.infer<typeof updateCovenantSchema>;
export type SubmitCovenantTestInput = z.infer<typeof submitCovenantTestSchema>;
export type CalculateCovenantInput = z.infer<typeof calculateCovenantSchema>;
export type UpdateCovenantTestInput = z.infer<typeof updateCovenantTestSchema>;
export type CreateNotificationRequirementInput = z.infer<typeof createNotificationRequirementSchema>;
export type UpdateNotificationRequirementInput = z.infer<typeof updateNotificationRequirementSchema>;
export type CreateNotificationEventInput = z.infer<typeof createNotificationEventSchema>;
export type UpdateNotificationEventInput = z.infer<typeof updateNotificationEventSchema>;
export type AnalyzeEventInput = z.infer<typeof analyzeEventSchema>;
export type CreateWaiverInput = z.infer<typeof createWaiverSchema>;
export type UpdateWaiverInput = z.infer<typeof updateWaiverSchema>;
export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type CalendarQueryInput = z.infer<typeof calendarQuerySchema>;
export type DashboardQueryInput = z.infer<typeof dashboardQuerySchema>;
export type ComplianceStatusReportInput = z.infer<typeof complianceStatusReportSchema>;
export type CovenantSummaryReportInput = z.infer<typeof covenantSummaryReportSchema>;
export type ComplianceHistoryReportInput = z.infer<typeof complianceHistoryReportSchema>;
