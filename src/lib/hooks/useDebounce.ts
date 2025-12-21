'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * A hook that returns a debounced version of the provided value.
 * The debounced value will only reflect the latest value when the hook
 * hasn't been called for the specified delay period.
 *
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 300);
 *
 * useEffect(() => {
 *   // This will only run 300ms after the user stops typing
 *   fetchSearchResults(debouncedSearch);
 * }, [debouncedSearch]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export interface UseDebouncedCallbackOptions {
  /** Whether to call immediately on leading edge */
  leading?: boolean;
  /** Whether to call on trailing edge (default: true) */
  trailing?: boolean;
  /** Maximum wait time before forcing execution */
  maxWait?: number;
}

export interface UseDebouncedCallbackResult<T extends (...args: unknown[]) => unknown> {
  /** The debounced function */
  debouncedFn: (...args: Parameters<T>) => void;
  /** Cancel any pending invocation */
  cancel: () => void;
  /** Flush and execute immediately */
  flush: () => void;
  /** Whether there's a pending invocation */
  isPending: boolean;
}

/**
 * A hook that returns a debounced version of the provided callback function.
 *
 * @example
 * ```tsx
 * const { debouncedFn: handleSearch, cancel } = useDebouncedCallback(
 *   (query: string) => {
 *     fetchSearchResults(query);
 *   },
 *   300
 * );
 *
 * // Usage
 * <input onChange={(e) => handleSearch(e.target.value)} />
 * ```
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 300,
  options: UseDebouncedCallbackOptions = {}
): UseDebouncedCallbackResult<T> {
  const { leading = false, trailing = true, maxWait } = options;

  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastArgsRef = useRef<Parameters<T> | null>(null);
  const lastCallTimeRef = useRef<number | null>(null);
  const [isPending, setIsPending] = useState(false);

  // Update callback ref on each render
  callbackRef.current = callback;

  const invokeCallback = useCallback(() => {
    if (lastArgsRef.current !== null) {
      callbackRef.current(...lastArgsRef.current);
      lastArgsRef.current = null;
      lastCallTimeRef.current = null;
      setIsPending(false);
    }
  }, []);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
    lastArgsRef.current = null;
    lastCallTimeRef.current = null;
    setIsPending(false);
  }, []);

  const flush = useCallback(() => {
    cancel();
    invokeCallback();
  }, [cancel, invokeCallback]);

  const debouncedFn = useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const isFirstCall = lastCallTimeRef.current === null;

    lastArgsRef.current = args;
    lastCallTimeRef.current = now;
    setIsPending(true);

    // Leading edge call
    if (leading && isFirstCall) {
      invokeCallback();
      return;
    }

    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Set new timer for trailing edge
    if (trailing) {
      timerRef.current = setTimeout(() => {
        invokeCallback();
        if (maxTimerRef.current) {
          clearTimeout(maxTimerRef.current);
          maxTimerRef.current = null;
        }
      }, delay);
    }

    // Set max wait timer if specified
    if (maxWait !== undefined && !maxTimerRef.current) {
      maxTimerRef.current = setTimeout(() => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        invokeCallback();
        maxTimerRef.current = null;
      }, maxWait);
    }
  }, [delay, leading, trailing, maxWait, invokeCallback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (maxTimerRef.current) {
        clearTimeout(maxTimerRef.current);
      }
    };
  }, []);

  return {
    debouncedFn,
    cancel,
    flush,
    isPending,
  };
}

export interface UseDebouncedStateResult<T> {
  /** The current immediate value */
  value: T;
  /** The debounced value */
  debouncedValue: T;
  /** Set the value (will update debouncedValue after delay) */
  setValue: (value: T | ((prev: T) => T)) => void;
  /** Whether the debounced value is pending update */
  isPending: boolean;
}

/**
 * A hook that combines useState with debouncing.
 * Returns both the immediate value and the debounced value.
 *
 * @example
 * ```tsx
 * const { value, debouncedValue, setValue } = useDebouncedState('', 300);
 *
 * // Show immediate value in input, use debounced value for API calls
 * <input
 *   value={value}
 *   onChange={(e) => setValue(e.target.value)}
 * />
 * ```
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number = 300
): UseDebouncedStateResult<T> {
  const [value, setValueState] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    setIsPending(true);
    const timer = setTimeout(() => {
      setDebouncedValue(value);
      setIsPending(false);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  const setValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setValueState(newValue);
  }, []);

  return {
    value,
    debouncedValue,
    setValue,
    isPending,
  };
}
