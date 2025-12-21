'use client';

import { useState, useCallback, useMemo } from 'react';

export interface UsePaginationOptions {
  /** Initial page number (1-indexed) */
  initialPage?: number;
  /** Number of items per page */
  pageSize?: number;
  /** Total number of items (for calculating total pages) */
  totalItems?: number;
}

export interface UsePaginationResult {
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of items */
  totalItems: number;
  /** Whether there is a next page */
  hasNextPage: boolean;
  /** Whether there is a previous page */
  hasPreviousPage: boolean;
  /** Go to a specific page */
  goToPage: (page: number) => void;
  /** Go to next page */
  nextPage: () => void;
  /** Go to previous page */
  previousPage: () => void;
  /** Go to first page */
  firstPage: () => void;
  /** Go to last page */
  lastPage: () => void;
  /** Set the page size */
  setPageSize: (size: number) => void;
  /** Set the total number of items */
  setTotalItems: (total: number) => void;
  /** Reset to first page */
  reset: () => void;
  /** Calculate offset for database queries (0-indexed) */
  offset: number;
  /** Calculate limit for database queries */
  limit: number;
  /** Range of items being displayed (e.g., { from: 1, to: 10 }) */
  displayRange: { from: number; to: number };
  /** Page numbers to display in pagination UI */
  pageNumbers: number[];
}

/**
 * A hook for managing pagination state with helper functions.
 *
 * @example
 * ```tsx
 * const {
 *   page,
 *   pageSize,
 *   totalPages,
 *   hasNextPage,
 *   hasPreviousPage,
 *   nextPage,
 *   previousPage,
 *   goToPage,
 *   offset,
 *   limit,
 * } = usePagination({ initialPage: 1, pageSize: 10, totalItems: 100 });
 *
 * // Use with Supabase query
 * const { data } = useSupabaseQuery(
 *   (supabase) => supabase
 *     .from('documents')
 *     .select('*', { count: 'exact' })
 *     .range(offset, offset + limit - 1),
 *   { deps: [page, pageSize] }
 * );
 * ```
 */
export function usePagination(options: UsePaginationOptions = {}): UsePaginationResult {
  const {
    initialPage = 1,
    pageSize: initialPageSize = 10,
    totalItems: initialTotalItems = 0,
  } = options;

  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [totalItems, setTotalItemsState] = useState(initialTotalItems);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / pageSize)),
    [totalItems, pageSize]
  );

  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setPage((p) => p + 1);
    }
  }, [hasNextPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setPage((p) => p - 1);
    }
  }, [hasPreviousPage]);

  const firstPage = useCallback(() => {
    setPage(1);
  }, []);

  const lastPage = useCallback(() => {
    setPage(totalPages);
  }, [totalPages]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(Math.max(1, size));
    setPage(1); // Reset to first page when page size changes
  }, []);

  const setTotalItems = useCallback((total: number) => {
    setTotalItemsState(Math.max(0, total));
  }, []);

  const reset = useCallback(() => {
    setPage(initialPage);
    setPageSizeState(initialPageSize);
  }, [initialPage, initialPageSize]);

  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  const displayRange = useMemo(() => {
    const from = totalItems === 0 ? 0 : offset + 1;
    const to = Math.min(offset + pageSize, totalItems);
    return { from, to };
  }, [offset, pageSize, totalItems]);

  // Generate page numbers for pagination UI (show max 5 pages centered around current)
  const pageNumbers = useMemo(() => {
    const maxVisible = 5;
    const pages: number[] = [];

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, page - Math.floor(maxVisible / 2));
      const end = Math.min(totalPages, start + maxVisible - 1);

      if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  }, [page, totalPages]);

  return {
    page,
    pageSize,
    totalPages,
    totalItems,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    setPageSize,
    setTotalItems,
    reset,
    offset,
    limit,
    displayRange,
    pageNumbers,
  };
}
