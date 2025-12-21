'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseLocalStorageOptions<T> {
  /** Custom serializer function */
  serializer?: (value: T) => string;
  /** Custom deserializer function */
  deserializer?: (value: string) => T;
  /** Sync across browser tabs */
  syncTabs?: boolean;
  /** Callback when value changes */
  onValueChange?: (value: T) => void;
  /** Callback when error occurs */
  onError?: (error: Error) => void;
}

export interface UseLocalStorageResult<T> {
  /** Current value */
  value: T;
  /** Set a new value */
  setValue: (value: T | ((prev: T) => T)) => void;
  /** Remove the item from storage */
  removeValue: () => void;
  /** Whether the initial value has been loaded from storage */
  isLoaded: boolean;
  /** Error if one occurred during storage operations */
  error: Error | null;
}

/**
 * A hook for persisting state in localStorage with SSR support.
 *
 * @example
 * ```tsx
 * const { value, setValue, removeValue } = useLocalStorage('theme', 'light');
 *
 * // Value is typed and persisted
 * setValue('dark');
 *
 * // Or use functional updates
 * setValue((prev) => prev === 'light' ? 'dark' : 'light');
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {}
): UseLocalStorageResult<T> {
  const {
    serializer = JSON.stringify,
    deserializer = JSON.parse,
    syncTabs = true,
    onValueChange,
    onError,
  } = options;

  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const onValueChangeRef = useRef(onValueChange);
  const onErrorRef = useRef(onError);
  onValueChangeRef.current = onValueChange;
  onErrorRef.current = onError;

  // Read from localStorage on mount
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;

      const item = window.localStorage.getItem(key);
      if (item !== null) {
        const parsed = deserializer(item);
        setStoredValue(parsed);
        onValueChangeRef.current?.(parsed);
      }
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to read from localStorage');
      setError(error);
      onErrorRef.current?.(error);
    } finally {
      setIsLoaded(true);
    }
  }, [key, deserializer]);

  // Sync across tabs
  useEffect(() => {
    if (!syncTabs || typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = deserializer(e.newValue);
          setStoredValue(newValue);
          onValueChangeRef.current?.(newValue);
          setError(null);
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Failed to parse storage event');
          setError(error);
          onErrorRef.current?.(error);
        }
      } else if (e.key === key && e.newValue === null) {
        // Item was removed
        setStoredValue(initialValue);
        onValueChangeRef.current?.(initialValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, deserializer, initialValue, syncTabs]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        if (typeof window === 'undefined') return;

        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        window.localStorage.setItem(key, serializer(valueToStore));
        onValueChangeRef.current?.(valueToStore);
        setError(null);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to write to localStorage');
        setError(error);
        onErrorRef.current?.(error);
      }
    },
    [key, serializer, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      if (typeof window === 'undefined') return;

      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
      onValueChangeRef.current?.(initialValue);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to remove from localStorage');
      setError(error);
      onErrorRef.current?.(error);
    }
  }, [key, initialValue]);

  return {
    value: storedValue,
    setValue,
    removeValue,
    isLoaded,
    error,
  };
}

/**
 * A hook for persisting state in sessionStorage with SSR support.
 * Same API as useLocalStorage but uses sessionStorage instead.
 *
 * @example
 * ```tsx
 * const { value, setValue } = useSessionStorage('tempData', {});
 * ```
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T,
  options: Omit<UseLocalStorageOptions<T>, 'syncTabs'> = {}
): Omit<UseLocalStorageResult<T>, never> {
  const {
    serializer = JSON.stringify,
    deserializer = JSON.parse,
    onValueChange,
    onError,
  } = options;

  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const onValueChangeRef = useRef(onValueChange);
  const onErrorRef = useRef(onError);
  onValueChangeRef.current = onValueChange;
  onErrorRef.current = onError;

  // Read from sessionStorage on mount
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;

      const item = window.sessionStorage.getItem(key);
      if (item !== null) {
        const parsed = deserializer(item);
        setStoredValue(parsed);
        onValueChangeRef.current?.(parsed);
      }
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to read from sessionStorage');
      setError(error);
      onErrorRef.current?.(error);
    } finally {
      setIsLoaded(true);
    }
  }, [key, deserializer]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        if (typeof window === 'undefined') return;

        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        window.sessionStorage.setItem(key, serializer(valueToStore));
        onValueChangeRef.current?.(valueToStore);
        setError(null);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to write to sessionStorage');
        setError(error);
        onErrorRef.current?.(error);
      }
    },
    [key, serializer, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      if (typeof window === 'undefined') return;

      window.sessionStorage.removeItem(key);
      setStoredValue(initialValue);
      onValueChangeRef.current?.(initialValue);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to remove from sessionStorage');
      setError(error);
      onErrorRef.current?.(error);
    }
  }, [key, initialValue]);

  return {
    value: storedValue,
    setValue,
    removeValue,
    isLoaded,
    error,
  };
}
