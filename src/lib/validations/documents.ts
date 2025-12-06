import { z } from 'zod';

export const documentTypeSchema = z.enum([
  'facility_agreement',
  'amendment',
  'consent',
  'assignment',
  'other',
]);

export const processingStatusSchema = z.enum([
  'pending',
  'processing',
  'completed',
  'failed',
  'review_required',
]);

export const uploadDocumentSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string(),
  size: z.number().max(50 * 1024 * 1024), // 50MB max
  documentType: documentTypeSchema.optional().default('other'),
});

export const updateDocumentSchema = z.object({
  document_type: documentTypeSchema.optional(),
  processing_status: processingStatusSchema.optional(),
});

export const queryDocumentSchema = z.object({
  question: z.string().min(1).max(1000),
  facilityIds: z.array(z.string().uuid()).optional(),
  includeSources: z.boolean().optional().default(true),
});

export const compareDocumentsSchema = z.object({
  documentId1: z.string().uuid(),
  documentId2: z.string().uuid(),
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type QueryDocumentInput = z.infer<typeof queryDocumentSchema>;
export type CompareDocumentsInput = z.infer<typeof compareDocumentsSchema>;
