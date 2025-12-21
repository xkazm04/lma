'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';
import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js';

type Tables = Database['public']['Tables'];
type TableName = keyof Tables;

export interface UseSupabaseQueryOptions<T> {
  /** Whether the query should be enabled */
  enabled?: boolean;
  /** Refetch interval in milliseconds */
  refetchInterval?: number;
  /** Callback when query succeeds */
  onSuccess?: (data: T) => void;
  /** Callback when query fails */
  onError?: (error: PostgrestError) => void;
  /** Dependencies that trigger a refetch when changed */
  deps?: unknown[];
}

export interface UseSupabaseQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: PostgrestError | null;
  refetch: () => Promise<void>;
  isFetching: boolean;
}

/**
 * A typed wrapper hook for Supabase queries with loading and error states.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useSupabaseQuery(
 *   (supabase) => supabase
 *     .from('loan_documents')
 *     .select('*')
 *     .eq('organization_id', orgId),
 *   { enabled: !!orgId, deps: [orgId] }
 * );
 * ```
 */
export function useSupabaseQuery<T>(
  queryFn: (supabase: SupabaseClient<Database>) => PromiseLike<{ data: T | null; error: PostgrestError | null }>,
  options: UseSupabaseQueryOptions<T> = {}
): UseSupabaseQueryResult<T> {
  const {
    enabled = true,
    refetchInterval,
    onSuccess,
    onError,
    deps = [],
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const supabaseRef = useRef<SupabaseClient<Database> | null>(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  // Keep refs updated
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }

    setIsFetching(true);

    try {
      const result = await queryFn(supabaseRef.current);

      if (result.error) {
        setError(result.error);
        setData(null);
        onErrorRef.current?.(result.error);
      } else {
        setData(result.data);
        setError(null);
        if (result.data) {
          onSuccessRef.current?.(result.data);
        }
      }
    } catch (err) {
      const postgrestError = {
        message: err instanceof Error ? err.message : 'Unknown error',
        details: '',
        hint: '',
        code: 'UNKNOWN',
        name: 'PostgrestError',
      } as PostgrestError;
      setError(postgrestError);
      setData(null);
      onErrorRef.current?.(postgrestError);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, [enabled, queryFn]);

  // Initial fetch and dependency-based refetch
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  // Refetch interval
  useEffect(() => {
    if (!refetchInterval || !enabled) return;

    const intervalId = setInterval(fetchData, refetchInterval);
    return () => clearInterval(intervalId);
  }, [refetchInterval, enabled, fetchData]);

  return {
    data,
    isLoading,
    isError: error !== null,
    error,
    refetch: fetchData,
    isFetching,
  };
}

/**
 * A typed mutation hook for Supabase insert/update/delete operations.
 *
 * @example
 * ```tsx
 * const { mutate, isLoading } = useSupabaseMutation(
 *   (supabase, doc) => supabase
 *     .from('loan_documents')
 *     .insert(doc)
 *     .select()
 *     .single(),
 *   { onSuccess: (data) => console.log('Created:', data) }
 * );
 *
 * // Usage
 * await mutate({ organization_id: '...', ... });
 * ```
 */
export interface UseSupabaseMutationOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: PostgrestError) => void;
  onSettled?: () => void;
}

export interface UseSupabaseMutationResult<T, TVariables> {
  mutate: (variables: TVariables) => Promise<T | null>;
  mutateAsync: (variables: TVariables) => Promise<T>;
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: PostgrestError | null;
  reset: () => void;
}

export function useSupabaseMutation<T, TVariables>(
  mutationFn: (
    supabase: SupabaseClient<Database>,
    variables: TVariables
  ) => PromiseLike<{ data: T | null; error: PostgrestError | null }>,
  options: UseSupabaseMutationOptions<T> = {}
): UseSupabaseMutationResult<T, TVariables> {
  const { onSuccess, onError, onSettled } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const supabaseRef = useRef<SupabaseClient<Database> | null>(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const onSettledRef = useRef(onSettled);

  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;
  onSettledRef.current = onSettled;

  const mutateAsync = useCallback(async (variables: TVariables): Promise<T> => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await mutationFn(supabaseRef.current, variables);

      if (result.error) {
        setError(result.error);
        onErrorRef.current?.(result.error);
        throw result.error;
      }

      setData(result.data);
      if (result.data) {
        onSuccessRef.current?.(result.data);
      }
      return result.data as T;
    } finally {
      setIsLoading(false);
      onSettledRef.current?.();
    }
  }, [mutationFn]);

  const mutate = useCallback(async (variables: TVariables): Promise<T | null> => {
    try {
      return await mutateAsync(variables);
    } catch {
      return null;
    }
  }, [mutateAsync]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    mutate,
    mutateAsync,
    data,
    isLoading,
    isError: error !== null,
    error,
    reset,
  };
}
