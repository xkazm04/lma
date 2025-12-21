/**
 * Types for Amendment Draft Generation
 */

import type { ComparisonResult } from '@/types';

/**
 * Individual amendment clause generated from a comparison change
 */
export interface AmendmentClause {
  /** Unique identifier for this clause */
  id: string;
  /** Section number (e.g., "1", "2.1") */
  sectionNumber: string;
  /** Title of the amendment section */
  title: string;
  /** The amendment language */
  content: string;
  /** Original value being amended (if applicable) */
  originalValue?: string | null;
  /** New value after amendment */
  newValue?: string | null;
  /** Category of the change (e.g., "Financial Terms", "Covenants") */
  category: string;
  /** Type of change: added, removed, or modified */
  changeType: 'added' | 'removed' | 'modified';
  /** AI confidence in the generated language */
  confidence: number;
  /** Reference to the original agreement section (if known) */
  originalClauseReference?: string;
}

/**
 * Amendment document structure
 */
export interface AmendmentDraft {
  /** Unique identifier for this draft */
  id: string;
  /** Amendment title */
  title: string;
  /** Document 1 (original) reference */
  originalDocument: {
    id: string;
    name: string;
  };
  /** Document 2 (target) reference */
  amendedDocument: {
    id: string;
    name: string;
  };
  /** Effective date placeholder */
  effectiveDate: string;
  /** Recitals/Whereas clauses */
  recitals: string[];
  /** Individual amendment clauses */
  clauses: AmendmentClause[];
  /** General provisions section */
  generalProvisions: string[];
  /** AI-generated summary of the amendment */
  summary: string;
  /** Overall confidence score */
  overallConfidence: number;
  /** Timestamp of generation */
  generatedAt: string;
  /** Generation status */
  status: 'generating' | 'ready' | 'error';
  /** Error message if generation failed */
  errorMessage?: string;
}

/**
 * Request to generate an amendment draft
 */
export interface GenerateAmendmentRequest {
  /** Comparison result to generate amendment from */
  comparisonResult: ComparisonResult;
  /** Optional custom settings */
  options?: {
    /** Include recitals (default: true) */
    includeRecitals?: boolean;
    /** Include general provisions (default: true) */
    includeGeneralProvisions?: boolean;
    /** Custom effective date */
    effectiveDate?: string;
    /** Amendment number (e.g., "First", "Second") */
    amendmentNumber?: string;
  };
}

/**
 * Response from amendment generation
 */
export interface GenerateAmendmentResponse {
  success: boolean;
  draft?: AmendmentDraft;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Amendment export format options
 */
export type AmendmentExportFormat = 'docx' | 'pdf' | 'markdown' | 'text';

/**
 * Amendment export request
 */
export interface ExportAmendmentRequest {
  draft: AmendmentDraft;
  format: AmendmentExportFormat;
}
