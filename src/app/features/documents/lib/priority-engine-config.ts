/**
 * Documents Priority Engine Configuration
 *
 * Uses the generic PriorityEngine with document-specific factors:
 * - Processing status urgency
 * - Review requirements
 * - Extraction confidence
 * - Upload staleness
 */

import {
  PriorityEngine,
  CommonFactors,
  type PriorityResult,
  type FactorExtractor,
} from '@/lib/utils/priority-engine';

/**
 * Document interface for priority calculation
 */
export interface DocumentForPriority {
  id: string;
  original_filename: string;
  document_type: 'facility_agreement' | 'amendment' | 'consent' | 'assignment' | 'other';
  processing_status: 'pending' | 'processing' | 'completed' | 'failed' | 'review_required';
  uploaded_at: string;
  updated_at: string;
  extraction_confidence?: number;
  flagged_fields_count?: number;
}

/**
 * Document-specific prioritized type
 */
export interface PrioritizedDocument {
  item: DocumentForPriority;
  priority: PriorityResult;
}

/**
 * Processing status urgency factor
 */
const processingStatusFactor: FactorExtractor<DocumentForPriority> = (doc) => {
  switch (doc.processing_status) {
    case 'failed':
      return {
        score: 50,
        reason: {
          type: 'status',
          label: 'Processing failed',
          weight: 50,
        },
      };
    case 'review_required':
      return {
        score: 40,
        reason: {
          type: 'status',
          label: 'Review required',
          weight: 40,
        },
      };
    case 'pending':
      return {
        score: 30,
        reason: {
          type: 'status',
          label: 'Pending processing',
          weight: 30,
        },
      };
    case 'processing':
      return {
        score: 15,
        reason: {
          type: 'status',
          label: 'Currently processing',
          weight: 15,
        },
      };
    default:
      return { score: 0 };
  }
};

/**
 * Extraction confidence factor
 */
const extractionConfidenceFactor: FactorExtractor<DocumentForPriority> = (doc) => {
  if (!doc.extraction_confidence || doc.processing_status !== 'completed') {
    return { score: 0 };
  }

  const confidence = doc.extraction_confidence * 100;

  if (confidence < 70) {
    return {
      score: 30,
      reason: {
        type: 'confidence',
        label: `Low confidence (${Math.round(confidence)}%)`,
        weight: 30,
      },
    };
  } else if (confidence < 85) {
    return {
      score: 15,
      reason: {
        type: 'confidence',
        label: `Medium confidence (${Math.round(confidence)}%)`,
        weight: 15,
      },
    };
  }

  return { score: 0 };
};

/**
 * Flagged fields factor
 */
const flaggedFieldsFactor: FactorExtractor<DocumentForPriority> = (doc) => {
  if (!doc.flagged_fields_count || doc.flagged_fields_count === 0) {
    return { score: 0 };
  }

  if (doc.flagged_fields_count >= 10) {
    return {
      score: 25,
      reason: {
        type: 'flagged_fields',
        label: `${doc.flagged_fields_count} fields flagged`,
        weight: 25,
      },
    };
  } else if (doc.flagged_fields_count >= 5) {
    return {
      score: 15,
      reason: {
        type: 'flagged_fields',
        label: `${doc.flagged_fields_count} fields flagged`,
        weight: 15,
      },
    };
  } else if (doc.flagged_fields_count > 0) {
    return {
      score: 8,
      reason: {
        type: 'flagged_fields',
        label: `${doc.flagged_fields_count} field${doc.flagged_fields_count === 1 ? '' : 's'} flagged`,
        weight: 8,
      },
    };
  }

  return { score: 0 };
};

/**
 * Document type priority factor
 */
const documentTypeFactor: FactorExtractor<DocumentForPriority> = (doc) => {
  switch (doc.document_type) {
    case 'facility_agreement':
      return { score: 10 };
    case 'amendment':
      return { score: 8 };
    case 'consent':
      return { score: 5 };
    case 'assignment':
      return { score: 3 };
    default:
      return { score: 0 };
  }
};

/**
 * Document Priority Engine
 */
const createDocumentPriorityEngine = () => {
  return new PriorityEngine<DocumentForPriority>({
    factors: [
      // Factor 1: Processing status urgency
      processingStatusFactor,

      // Factor 2: Extraction confidence
      extractionConfidenceFactor,

      // Factor 3: Flagged fields requiring review
      flaggedFieldsFactor,

      // Factor 4: Staleness (pending/failed documents)
      (doc) => {
        if (doc.processing_status === 'pending' || doc.processing_status === 'failed') {
          return CommonFactors.staleness<typeof doc>(
            (d) => d.uploaded_at,
            3,
            20
          )(doc);
        }
        return { score: 0 };
      },

      // Factor 5: Document type priority
      documentTypeFactor,
    ],

    actionSuggestionGenerator: (doc, reasons) => {
      if (reasons.length === 0) {
        return 'Monitor document processing';
      }

      const topReason = reasons[0];

      switch (topReason.type) {
        case 'status':
          if (doc.processing_status === 'failed') {
            return 'Retry processing or upload new version';
          }
          if (doc.processing_status === 'review_required') {
            return 'Review and validate extracted data';
          }
          if (doc.processing_status === 'pending') {
            return 'Initiate document processing';
          }
          return 'Monitor processing status';
        case 'confidence':
          return 'Review low-confidence extractions';
        case 'flagged_fields':
          return 'Review and verify flagged fields';
        case 'inactivity':
          return 'Check processing status and retry if needed';
        default:
          return 'Review document';
      }
    },
  });
};

// Singleton instance
const documentEngine = createDocumentPriorityEngine();

/**
 * Calculate priority for documents
 */
export function calculateDocumentPriority(doc: DocumentForPriority): PriorityResult {
  return documentEngine.calculatePriority(doc);
}

export function prioritizeDocuments(docs: DocumentForPriority[]): PrioritizedDocument[] {
  return documentEngine.prioritizeItems(docs);
}

/**
 * Get inbox stats from prioritized documents
 */
export function getDocumentInboxStats(docs: PrioritizedDocument[]) {
  return documentEngine.getStats(docs);
}
