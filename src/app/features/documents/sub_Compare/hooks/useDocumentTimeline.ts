'use client';

import { useState, useCallback, useEffect } from 'react';
import type {
  FacilityTimeline,
  TimelinePoint,
  FacilityTimelineResponse,
  DocumentState,
  TemporalComparisonResult,
} from '../lib/temporal-types';

interface UseDocumentTimelineOptions {
  facilityId?: string;
  documentId?: string;
  autoFetch?: boolean;
}

interface UseDocumentTimelineReturn {
  // Timeline data
  timeline: FacilityTimeline | null;
  visualPoints: TimelinePoint[];
  isLoading: boolean;
  error: string | null;

  // Selection state
  selectedFromState: DocumentState | null;
  selectedToState: DocumentState | null;

  // Comparison state
  comparisonResult: TemporalComparisonResult | null;
  isComparing: boolean;
  comparisonError: string | null;

  // Actions
  fetchTimeline: () => Promise<void>;
  selectFromState: (state: DocumentState | null) => void;
  selectToState: (state: DocumentState | null) => void;
  clearSelection: () => void;
  compareSelected: () => Promise<void>;
  compareStates: (from: DocumentState, to: DocumentState) => Promise<void>;
}

export function useDocumentTimeline({
  facilityId,
  documentId,
  autoFetch = true,
}: UseDocumentTimelineOptions = {}): UseDocumentTimelineReturn {
  // Timeline state
  const [timeline, setTimeline] = useState<FacilityTimeline | null>(null);
  const [visualPoints, setVisualPoints] = useState<TimelinePoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selection state
  const [selectedFromState, setSelectedFromState] = useState<DocumentState | null>(null);
  const [selectedToState, setSelectedToState] = useState<DocumentState | null>(null);

  // Comparison state
  const [comparisonResult, setComparisonResult] = useState<TemporalComparisonResult | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonError, setComparisonError] = useState<string | null>(null);

  // Fetch timeline
  const fetchTimeline = useCallback(async () => {
    if (!facilityId && !documentId) {
      setError('Either facilityId or documentId must be provided');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (facilityId) params.append('facilityId', facilityId);
      if (documentId) params.append('documentId', documentId);
      params.append('includeKeyTerms', 'true');

      const response = await fetch(`/api/documents/timeline?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to fetch timeline');
      }

      const timelineResponse = data.data as FacilityTimelineResponse;
      setTimeline(timelineResponse.timeline);
      setVisualPoints(timelineResponse.visualPoints);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setTimeline(null);
      setVisualPoints([]);
    } finally {
      setIsLoading(false);
    }
  }, [facilityId, documentId]);

  // Auto-fetch on mount/change
  useEffect(() => {
    if (autoFetch && (facilityId || documentId)) {
      fetchTimeline();
    }
  }, [autoFetch, facilityId, documentId, fetchTimeline]);

  // Selection actions
  const selectFromState = useCallback((state: DocumentState | null) => {
    setSelectedFromState(state);
    // Clear comparison result when selection changes
    setComparisonResult(null);
    setComparisonError(null);
  }, []);

  const selectToState = useCallback((state: DocumentState | null) => {
    setSelectedToState(state);
    // Clear comparison result when selection changes
    setComparisonResult(null);
    setComparisonError(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFromState(null);
    setSelectedToState(null);
    setComparisonResult(null);
    setComparisonError(null);
  }, []);

  // Compare two states
  const compareStates = useCallback(async (from: DocumentState, to: DocumentState) => {
    if (!from || !to || from.id === to.id) {
      setComparisonError('Please select two different document states to compare');
      return;
    }

    setIsComparing(true);
    setComparisonError(null);

    try {
      const response = await fetch('/api/documents/compare/temporal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromDocumentId: from.id,
          toDocumentId: to.id,
          includeFullDiff: true,
          includeNarrative: true,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to compare documents');
      }

      setComparisonResult(data.data as TemporalComparisonResult);
    } catch (err) {
      setComparisonError(err instanceof Error ? err.message : 'An error occurred');
      setComparisonResult(null);
    } finally {
      setIsComparing(false);
    }
  }, []);

  // Compare currently selected states
  const compareSelected = useCallback(async () => {
    if (selectedFromState && selectedToState) {
      await compareStates(selectedFromState, selectedToState);
    }
  }, [selectedFromState, selectedToState, compareStates]);

  return {
    // Timeline data
    timeline,
    visualPoints,
    isLoading,
    error,

    // Selection state
    selectedFromState,
    selectedToState,

    // Comparison state
    comparisonResult,
    isComparing,
    comparisonError,

    // Actions
    fetchTimeline,
    selectFromState,
    selectToState,
    clearSelection,
    compareSelected,
    compareStates,
  };
}
