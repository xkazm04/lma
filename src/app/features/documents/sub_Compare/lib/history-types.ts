/**
 * Comparison History Types
 *
 * Types for storing and displaying historical comparison results,
 * enabling a version history timeline like Google Docs.
 */

import type { ComparisonResult } from '@/types';

/**
 * Represents a single comparison history entry
 */
export interface ComparisonHistoryEntry {
  /** Unique identifier */
  id: string;
  /** Organization ID */
  organizationId: string;
  /** First document ID */
  document1Id: string;
  /** Second document ID */
  document2Id: string;
  /** User who performed the comparison */
  comparedBy: string;
  /** Timestamp of comparison */
  comparedAt: string;
  /** Full comparison result (differences array) */
  differences: ComparisonResult['differences'];
  /** AI-generated impact analysis */
  impactAnalysis?: string;
  /** Total number of changes */
  totalChanges: number;
  /** Number of added fields */
  addedCount: number;
  /** Number of modified fields */
  modifiedCount: number;
  /** Number of removed fields */
  removedCount: number;
  /** Optional user-provided label */
  label?: string;
  /** Optional user notes */
  notes?: string;
  /** Created timestamp */
  createdAt: string;
  /** Updated timestamp */
  updatedAt: string;
}

/**
 * Comparison history entry with user details
 */
export interface ComparisonHistoryEntryWithUser extends ComparisonHistoryEntry {
  /** Full name of the user who performed the comparison */
  comparedByName: string;
  /** Email of the user who performed the comparison */
  comparedByEmail?: string;
  /** Avatar URL if available */
  comparedByAvatar?: string;
}

/**
 * Comparison history entry with document details
 */
export interface ComparisonHistoryEntryWithDetails extends ComparisonHistoryEntryWithUser {
  /** First document details */
  document1: {
    id: string;
    name: string;
    type: string;
  };
  /** Second document details */
  document2: {
    id: string;
    name: string;
    type: string;
  };
}

/**
 * Request to save a comparison to history
 */
export interface SaveComparisonHistoryRequest {
  /** First document ID */
  document1Id: string;
  /** Second document ID */
  document2Id: string;
  /** Comparison result to save */
  result: ComparisonResult;
  /** Optional label for this snapshot */
  label?: string;
  /** Optional notes */
  notes?: string;
}

/**
 * Request to list comparison history
 */
export interface ListComparisonHistoryRequest {
  /** Filter by first document ID (optional) */
  document1Id?: string;
  /** Filter by second document ID (optional) */
  document2Id?: string;
  /** Filter by document pair (either direction) */
  documentPairIds?: [string, string];
  /** Filter by user who performed comparison */
  comparedBy?: string;
  /** Filter by date range start */
  fromDate?: string;
  /** Filter by date range end */
  toDate?: string;
  /** Maximum number of entries to return */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/**
 * Response for listing comparison history
 */
export interface ListComparisonHistoryResponse {
  /** History entries */
  entries: ComparisonHistoryEntryWithDetails[];
  /** Total count for pagination */
  total: number;
  /** Whether there are more entries */
  hasMore: boolean;
}

/**
 * Request to update a comparison history entry
 */
export interface UpdateComparisonHistoryRequest {
  /** ID of the entry to update */
  id: string;
  /** New label (optional) */
  label?: string;
  /** New notes (optional) */
  notes?: string;
}

/**
 * Represents a diff between two comparison results (comparison of comparisons)
 */
export interface ComparisonDiff {
  /** First comparison ID */
  comparison1Id: string;
  /** Second comparison ID */
  comparison2Id: string;
  /** Timestamp of first comparison */
  comparison1At: string;
  /** Timestamp of second comparison */
  comparison2At: string;
  /** Fields that are only in comparison 1 */
  onlyInComparison1: ComparisonResult['differences'];
  /** Fields that are only in comparison 2 */
  onlyInComparison2: ComparisonResult['differences'];
  /** Fields that changed between comparisons */
  changedBetweenComparisons: Array<{
    field: string;
    category: string;
    inComparison1: {
      changeType: 'added' | 'removed' | 'modified';
      doc1Value: unknown;
      doc2Value: unknown;
    };
    inComparison2: {
      changeType: 'added' | 'removed' | 'modified';
      doc1Value: unknown;
      doc2Value: unknown;
    };
  }>;
  /** Summary of differences */
  summary: {
    newChangesCount: number;
    resolvedChangesCount: number;
    evolvedChangesCount: number;
  };
}

/**
 * Timeline view mode
 */
export type HistoryViewMode = 'timeline' | 'list' | 'compact';

/**
 * Timeline filter options
 */
export interface HistoryFilterOptions {
  /** View mode */
  viewMode: HistoryViewMode;
  /** Filter by user */
  userId?: string;
  /** Filter by date range */
  dateRange?: {
    from: string;
    to: string;
  };
  /** Show only labeled entries */
  labeledOnly?: boolean;
  /** Search query for labels/notes */
  searchQuery?: string;
}
