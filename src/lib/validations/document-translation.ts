import { z } from 'zod';

/**
 * Validation schemas for Document Translation Layer
 */

// Clause type enum
export const clauseTypeSchema = z.enum([
  'covenant',
  'obligation',
  'facility_term',
  'definition',
  'general',
]);

// Format options schema
export const formatOptionsSchema = z.object({
  includeNumbering: z.boolean().optional().default(true),
  useDefinedTerms: z.boolean().optional().default(true),
  includeCrossReferences: z.boolean().optional().default(true),
  formalityLevel: z.enum(['standard', 'formal', 'simplified']).optional().default('formal'),
});

// Document context schema
export const documentContextSchema = z.object({
  borrowerName: z.string().optional(),
  facilityName: z.string().optional(),
  governingLaw: z.string().optional(),
  definedTerms: z.record(z.string(), z.string()).optional(),
});

// Single translation request schema
export const translationRequestSchema = z.object({
  clauseType: clauseTypeSchema,
  structuredData: z.record(z.string(), z.unknown()),
  originalClause: z.string().optional(),
  precedentClauses: z.array(z.string()).optional(),
  documentContext: documentContextSchema.optional(),
  formatOptions: formatOptionsSchema.optional(),
});

// Covenant translation request schema
export const covenantTranslationRequestSchema = z.object({
  covenantName: z.string().min(1, 'Covenant name is required'),
  covenantType: z.string().min(1, 'Covenant type is required'),
  thresholdType: z.enum(['maximum', 'minimum', 'range']),
  thresholdValue: z.number().optional(),
  testingFrequency: z.string().optional(),
  numeratorDefinition: z.string().optional(),
  denominatorDefinition: z.string().optional(),
  documentContext: documentContextSchema.optional(),
  precedentClauses: z.array(z.string()).optional(),
});

// Obligation translation request schema
export const obligationTranslationRequestSchema = z.object({
  obligationType: z.string().min(1, 'Obligation type is required'),
  description: z.string().optional(),
  frequency: z.string().optional(),
  deadlineDays: z.number().int().positive().optional(),
  recipientRole: z.string().optional(),
  documentContext: documentContextSchema.optional(),
  precedentClauses: z.array(z.string()).optional(),
});

// Facility term translation request schema
export const facilityTermTranslationRequestSchema = z.object({
  termName: z.string().min(1, 'Term name is required'),
  termValue: z.unknown(),
  termType: z.string().min(1, 'Term type is required'),
  documentContext: documentContextSchema.optional(),
  precedentClauses: z.array(z.string()).optional(),
});

// Batch translation global context
export const batchGlobalContextSchema = z.object({
  borrowerName: z.string().min(1, 'Borrower name is required'),
  facilityName: z.string().min(1, 'Facility name is required'),
  governingLaw: z.string().optional().default('New York'),
  definedTerms: z.record(z.string(), z.string()).optional(),
  documentType: z.enum(['credit_agreement', 'amendment', 'consent', 'waiver']).optional().default('credit_agreement'),
  institutionStyle: z.string().optional(),
});

// Batch translation request schema
export const batchTranslationRequestSchema = z.object({
  clauses: z.array(translationRequestSchema).min(1, 'At least one clause is required'),
  globalContext: batchGlobalContextSchema,
});

// Precedent style analysis request schema
export const precedentAnalysisRequestSchema = z.object({
  precedentClauses: z.array(z.string()).min(1, 'At least one precedent clause is required'),
  clauseType: z.string().min(1, 'Clause type is required'),
});

// Translated clause response schema (for validation of LLM output)
export const translatedClauseResponseSchema = z.object({
  id: z.string(),
  clauseText: z.string().min(1, 'Clause text cannot be empty'),
  suggestedSection: z.string(),
  clauseTitle: z.string(),
  category: z.string(),
  confidence: z.number().min(0).max(1),
  precedentMatch: z.object({
    sourceDocument: z.string(),
    matchPercentage: z.number().min(0).max(1),
    adaptations: z.array(z.string()),
  }).optional(),
  warnings: z.array(z.string()).optional(),
  alternatives: z.array(z.string()).optional(),
});

// Batch translation response schema
export const batchTranslationResponseSchema = z.object({
  translatedClauses: z.array(translatedClauseResponseSchema),
  assembledDocument: z.string().optional(),
  metrics: z.object({
    averageConfidence: z.number().min(0).max(1),
    totalClauses: z.number().int().nonnegative(),
    warningsCount: z.number().int().nonnegative(),
  }),
});

// Precedent analysis response schema
export const precedentAnalysisResponseSchema = z.object({
  stylePatterns: z.array(z.string()),
  commonPhrases: z.array(z.string()),
  structureNotes: z.string(),
  recommendations: z.array(z.string()),
});

// Export format schema
export const exportFormatSchema = z.enum(['markdown', 'text', 'docx', 'json']);

// Export request schema
export const exportTranslationRequestSchema = z.object({
  clauses: z.array(translatedClauseResponseSchema),
  format: exportFormatSchema,
  documentTitle: z.string().optional().default('Generated Legal Document'),
  effectiveDate: z.string().optional().default('[DATE]'),
  includeMetrics: z.boolean().optional().default(true),
});

// Type exports
export type ClauseType = z.infer<typeof clauseTypeSchema>;
export type FormatOptions = z.infer<typeof formatOptionsSchema>;
export type DocumentContext = z.infer<typeof documentContextSchema>;
export type TranslationRequestInput = z.infer<typeof translationRequestSchema>;
export type CovenantTranslationInput = z.infer<typeof covenantTranslationRequestSchema>;
export type ObligationTranslationInput = z.infer<typeof obligationTranslationRequestSchema>;
export type FacilityTermTranslationInput = z.infer<typeof facilityTermTranslationRequestSchema>;
export type BatchGlobalContext = z.infer<typeof batchGlobalContextSchema>;
export type BatchTranslationInput = z.infer<typeof batchTranslationRequestSchema>;
export type PrecedentAnalysisInput = z.infer<typeof precedentAnalysisRequestSchema>;
export type TranslatedClauseResponse = z.infer<typeof translatedClauseResponseSchema>;
export type BatchTranslationResponse = z.infer<typeof batchTranslationResponseSchema>;
export type PrecedentAnalysisResponse = z.infer<typeof precedentAnalysisResponseSchema>;
export type ExportFormat = z.infer<typeof exportFormatSchema>;
export type ExportTranslationInput = z.infer<typeof exportTranslationRequestSchema>;
