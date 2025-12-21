/**
 * Temporal Comparison Types
 *
 * Types for tracking document evolution over time through amendments.
 * Enables temporal comparison: viewing how a document evolved across all its amendments
 * vs. spatial comparison (doc1 vs doc2).
 */

import type { ComparisonResult } from '@/types';

/**
 * Represents a single document state in the facility's timeline
 */
export interface DocumentState {
  /** Document ID */
  id: string;
  /** Document name/filename */
  name: string;
  /** Document type (credit_agreement, amendment, etc.) */
  documentType: string;
  /** Amendment number if applicable (null for original) */
  amendmentNumber: number | null;
  /** Effective date of this document version */
  effectiveDate: string;
  /** Upload/creation date */
  createdAt: string;
  /** Brief description or label */
  description?: string;
  /** Key terms snapshot at this state */
  keyTerms?: DocumentKeyTerms;
}

/**
 * Key terms captured at a document state for quick comparison
 */
export interface DocumentKeyTerms {
  facilityName?: string;
  totalCommitments?: number;
  currency?: string;
  maturityDate?: string;
  baseRate?: string;
  marginInitial?: number;
  covenants?: Array<{
    name: string;
    type: string;
    threshold: number | null;
    thresholdType: 'maximum' | 'minimum';
  }>;
}

/**
 * Represents the full timeline of a facility's document evolution
 */
export interface FacilityTimeline {
  /** Facility ID this timeline belongs to */
  facilityId: string;
  /** Facility name */
  facilityName: string;
  /** Borrower name */
  borrowerName: string;
  /** Original document (credit agreement) */
  originalDocument: DocumentState;
  /** Ordered list of amendments (by effective date) */
  amendments: DocumentState[];
  /** All document states in chronological order */
  timeline: DocumentState[];
  /** Summary statistics */
  stats: TimelineStats;
}

/**
 * Statistics for a facility timeline
 */
export interface TimelineStats {
  /** Total number of document states */
  totalDocuments: number;
  /** Number of amendments */
  amendmentCount: number;
  /** Date range */
  dateRange: {
    earliest: string;
    latest: string;
  };
  /** Total changes across all amendments */
  totalChangesOverTime: number;
}

/**
 * Comparison result between two points in time
 */
export interface TemporalComparisonResult extends ComparisonResult {
  /** First document state (earlier) */
  fromState: DocumentState;
  /** Second document state (later) */
  toState: DocumentState;
  /** Time elapsed between states */
  timeElapsed: {
    days: number;
    months: number;
    years: number;
  };
  /** Changes categorized by type */
  changesSummary: TemporalChangesSummary;
}

/**
 * Summary of changes between two temporal states
 */
export interface TemporalChangesSummary {
  /** Financial term changes */
  financialTerms: {
    commitmentChange?: {
      from: number;
      to: number;
      percentageChange: number;
      direction: 'increase' | 'decrease';
    };
    marginChange?: {
      from: number;
      to: number;
      bpsChange: number;
      direction: 'tightened' | 'loosened';
    };
  };
  /** Covenant changes */
  covenants: {
    tightened: string[];
    loosened: string[];
    added: string[];
    removed: string[];
  };
  /** Date changes */
  dateChanges: {
    maturityExtended: boolean;
    maturityDays?: number;
  };
  /** Overall risk direction */
  riskDirection: 'more_favorable' | 'less_favorable' | 'neutral';
  /** Key narrative points */
  narrativePoints: string[];
}

/**
 * Timeline point for visualization
 */
export interface TimelinePoint {
  /** Document state at this point */
  state: DocumentState;
  /** Position in timeline (0-100 for percentage) */
  position: number;
  /** Is this the original document? */
  isOriginal: boolean;
  /** Is this the current/latest state? */
  isCurrent: boolean;
  /** Cumulative changes from original */
  cumulativeChanges: number;
  /** Changes from previous state */
  changesFromPrevious: number;
}

/**
 * Request for temporal comparison between two document states
 */
export interface TemporalCompareRequest {
  /** ID of the earlier document state */
  fromDocumentId: string;
  /** ID of the later document state */
  toDocumentId: string;
  /** Include full diff details */
  includeFullDiff?: boolean;
  /** Include narrative analysis */
  includeNarrative?: boolean;
}

/**
 * Request for facility timeline
 */
export interface GetFacilityTimelineRequest {
  /** Facility ID */
  facilityId?: string;
  /** Or original document ID to find associated facility */
  documentId?: string;
  /** Include key terms for each state */
  includeKeyTerms?: boolean;
}

/**
 * Response containing facility timeline
 */
export interface FacilityTimelineResponse {
  timeline: FacilityTimeline;
  /** Prepared timeline points for visualization */
  visualPoints: TimelinePoint[];
}

/**
 * Evolution insight from comparing adjacent states
 */
export interface EvolutionInsight {
  /** Insight ID */
  id: string;
  /** Type of insight */
  type: 'covenant_tightening' | 'covenant_loosening' | 'commitment_change' | 'maturity_extension' | 'margin_change' | 'structural_change' | 'other';
  /** Severity/importance */
  severity: 'info' | 'warning' | 'critical';
  /** The amendment where this occurred */
  amendmentNumber: number;
  /** Effective date of change */
  effectiveDate: string;
  /** Short title */
  title: string;
  /** Detailed description */
  description: string;
  /** From value (stringified) */
  fromValue?: string;
  /** To value (stringified) */
  toValue?: string;
  /** Category */
  category: string;
}

/**
 * Full evolution analysis for a facility
 */
export interface FacilityEvolutionAnalysis {
  /** Facility information */
  facilityId: string;
  facilityName: string;
  borrowerName: string;
  /** Timeline of states */
  timeline: DocumentState[];
  /** Key insights extracted from evolution */
  insights: EvolutionInsight[];
  /** Overall evolution narrative */
  narrative: string;
  /** Risk trajectory */
  riskTrajectory: {
    direction: 'improving' | 'stable' | 'deteriorating';
    confidence: number;
    reasoning: string;
  };
}
