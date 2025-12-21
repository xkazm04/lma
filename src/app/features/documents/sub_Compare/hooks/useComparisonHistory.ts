'use client';

import { useState, useCallback, useEffect } from 'react';
import type { ComparisonResult } from '@/types';
import type {
  ComparisonHistoryEntryWithDetails,
  ListComparisonHistoryResponse,
  ComparisonDiff,
} from '../lib/history-types';

interface UseComparisonHistoryOptions {
  document1Id?: string;
  document2Id?: string;
  autoLoad?: boolean;
}

interface UseComparisonHistoryReturn {
  // Data
  entries: ComparisonHistoryEntryWithDetails[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadHistory: () => Promise<void>;
  loadMore: () => Promise<void>;
  saveComparison: (
    document1Id: string,
    document2Id: string,
    result: ComparisonResult,
    label?: string,
    notes?: string
  ) => Promise<string | null>;
  updateEntry: (id: string, label: string, notes: string) => Promise<boolean>;
  deleteEntry: (id: string) => Promise<boolean>;
  compareEntries: (
    entry1Id: string,
    entry2Id: string
  ) => Promise<ComparisonDiff | null>;

  // Comparison diff state
  comparisonDiff: ComparisonDiff | null;
  isComparingEntries: boolean;
  clearComparisonDiff: () => void;
}

export function useComparisonHistory(
  options: UseComparisonHistoryOptions = {}
): UseComparisonHistoryReturn {
  const { document1Id, document2Id, autoLoad = false } = options;

  const [entries, setEntries] = useState<ComparisonHistoryEntryWithDetails[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  const [comparisonDiff, setComparisonDiff] = useState<ComparisonDiff | null>(null);
  const [isComparingEntries, setIsComparingEntries] = useState(false);

  const LIMIT = 20;

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (document1Id && document2Id) {
        params.set('documentPairIds', `${document1Id},${document2Id}`);
      } else if (document1Id) {
        params.set('document1Id', document1Id);
      } else if (document2Id) {
        params.set('document2Id', document2Id);
      }
      params.set('limit', LIMIT.toString());
      params.set('offset', '0');

      const response = await fetch(`/api/documents/compare/history?${params}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to load history');
      }

      const result: ListComparisonHistoryResponse = data.data;
      setEntries(result.entries);
      setTotal(result.total);
      setHasMore(result.hasMore);
      setOffset(LIMIT);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setIsLoading(false);
    }
  }, [document1Id, document2Id]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (document1Id && document2Id) {
        params.set('documentPairIds', `${document1Id},${document2Id}`);
      } else if (document1Id) {
        params.set('document1Id', document1Id);
      } else if (document2Id) {
        params.set('document2Id', document2Id);
      }
      params.set('limit', LIMIT.toString());
      params.set('offset', offset.toString());

      const response = await fetch(`/api/documents/compare/history?${params}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to load more history');
      }

      const result: ListComparisonHistoryResponse = data.data;
      setEntries((prev) => [...prev, ...result.entries]);
      setHasMore(result.hasMore);
      setOffset((prev) => prev + LIMIT);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more');
    } finally {
      setIsLoading(false);
    }
  }, [document1Id, document2Id, offset, isLoading, hasMore]);

  const saveComparison = useCallback(
    async (
      doc1Id: string,
      doc2Id: string,
      result: ComparisonResult,
      label?: string,
      notes?: string
    ): Promise<string | null> => {
      try {
        const response = await fetch('/api/documents/compare/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            document1Id: doc1Id,
            document2Id: doc2Id,
            result,
            label,
            notes,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error?.message || 'Failed to save comparison');
        }

        // Reload history to include the new entry
        await loadHistory();

        return data.data.id;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save');
        return null;
      }
    },
    [loadHistory]
  );

  const updateEntry = useCallback(
    async (id: string, label: string, notes: string): Promise<boolean> => {
      try {
        const response = await fetch(`/api/documents/compare/history/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label, notes }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error?.message || 'Failed to update entry');
        }

        // Update local state
        setEntries((prev) =>
          prev.map((entry) =>
            entry.id === id ? { ...entry, label, notes } : entry
          )
        );

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update');
        return false;
      }
    },
    []
  );

  const deleteEntry = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/documents/compare/history/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to delete entry');
      }

      // Update local state
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
      setTotal((prev) => prev - 1);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      return false;
    }
  }, []);

  const compareEntries = useCallback(
    async (
      entry1Id: string,
      entry2Id: string
    ): Promise<ComparisonDiff | null> => {
      setIsComparingEntries(true);
      setComparisonDiff(null);

      try {
        const response = await fetch('/api/documents/compare/history/diff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            comparison1Id: entry1Id,
            comparison2Id: entry2Id,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error?.message || 'Failed to compare entries');
        }

        setComparisonDiff(data.data);
        return data.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to compare');
        return null;
      } finally {
        setIsComparingEntries(false);
      }
    },
    []
  );

  const clearComparisonDiff = useCallback(() => {
    setComparisonDiff(null);
  }, []);

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad) {
      loadHistory();
    }
  }, [autoLoad, loadHistory]);

  return {
    entries,
    total,
    hasMore,
    isLoading,
    error,
    loadHistory,
    loadMore,
    saveComparison,
    updateEntry,
    deleteEntry,
    compareEntries,
    comparisonDiff,
    isComparingEntries,
    clearComparisonDiff,
  };
}
