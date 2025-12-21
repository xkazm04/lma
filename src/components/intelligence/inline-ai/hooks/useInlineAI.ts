'use client';

import { useState, useCallback, useRef } from 'react';
import type {
  InlineAIContext,
  InlineAIResponse,
  InlineAIAction,
  InlineAISuggestion,
} from '../../types';

interface UseInlineAIOptions {
  /** Auto-refresh interval in ms (0 to disable) */
  autoRefresh?: number;
  /** Cache key for caching responses */
  cacheKey?: string;
  /** Max cache age in ms */
  cacheMaxAge?: number;
}

interface UseInlineAIReturn {
  // State
  isLoading: boolean;
  error: Error | null;

  // Data
  explanation: string | null;
  suggestions: InlineAISuggestion[];
  response: InlineAIResponse | null;

  // Actions
  explain: (context: InlineAIContext, query?: string) => Promise<void>;
  getSuggestions: (context: InlineAIContext, query?: string) => Promise<void>;
  analyze: (context: InlineAIContext, query?: string) => Promise<void>;
  executeAction: (action: InlineAIAction, context: InlineAIContext, query?: string) => Promise<void>;

  // Helpers
  clearResponse: () => void;
  clearError: () => void;
}

// Simple in-memory cache
const responseCache = new Map<string, { response: InlineAIResponse; timestamp: number }>();

export function useInlineAI(options: UseInlineAIOptions = {}): UseInlineAIReturn {
  const { cacheKey, cacheMaxAge = 5 * 60 * 1000 } = options; // 5 minute default cache

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [response, setResponse] = useState<InlineAIResponse | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Helper to build cache key
  const buildCacheKey = useCallback(
    (context: InlineAIContext, action: InlineAIAction, query?: string) => {
      const base = cacheKey || `${context.domain}-${context.entityType}-${context.entityId}`;
      return `${base}-${action}-${query || 'default'}`;
    },
    [cacheKey]
  );

  // Check cache
  const checkCache = useCallback(
    (key: string): InlineAIResponse | null => {
      const cached = responseCache.get(key);
      if (cached && Date.now() - cached.timestamp < cacheMaxAge) {
        return cached.response;
      }
      if (cached) {
        responseCache.delete(key);
      }
      return null;
    },
    [cacheMaxAge]
  );

  // Set cache
  const setCache = useCallback((key: string, response: InlineAIResponse) => {
    responseCache.set(key, { response, timestamp: Date.now() });
  }, []);

  // Core API call function
  const callAPI = useCallback(
    async (
      action: InlineAIAction,
      context: InlineAIContext,
      query?: string
    ): Promise<InlineAIResponse> => {
      const key = buildCacheKey(context, action, query);

      // Check cache first
      const cached = checkCache(key);
      if (cached) {
        return cached;
      }

      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/intelligence/inline-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          context,
          query,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed: ${response.status}`);
      }

      const data = await response.json();
      const result: InlineAIResponse = data.data || data;

      // Cache the result
      setCache(key, result);

      return result;
    },
    [buildCacheKey, checkCache, setCache]
  );

  // Execute any action
  const executeAction = useCallback(
    async (action: InlineAIAction, context: InlineAIContext, query?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await callAPI(action, context, query);
        setResponse(result);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // Ignore aborted requests
          return;
        }
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    },
    [callAPI]
  );

  // Explain action
  const explain = useCallback(
    async (context: InlineAIContext, query?: string) => {
      await executeAction('explain', context, query);
    },
    [executeAction]
  );

  // Get suggestions action
  const getSuggestions = useCallback(
    async (context: InlineAIContext, query?: string) => {
      await executeAction('suggest', context, query);
    },
    [executeAction]
  );

  // Analyze action
  const analyze = useCallback(
    async (context: InlineAIContext, query?: string) => {
      await executeAction('analyze', context, query);
    },
    [executeAction]
  );

  // Clear response
  const clearResponse = useCallback(() => {
    setResponse(null);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    explanation: response?.explanation || null,
    suggestions: response?.suggestions || [],
    response,
    explain,
    getSuggestions,
    analyze,
    executeAction,
    clearResponse,
    clearError,
  };
}
