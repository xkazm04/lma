'use client';

import { useEffect, useCallback, useRef, useState } from 'react';

export interface NavigationGuardState {
  isBlocked: boolean;
  pendingNavigation: (() => void) | null;
}

export interface UseNavigationGuardOptions {
  /**
   * Whether navigation should be blocked
   */
  shouldBlock: boolean;
  /**
   * Message shown in the browser's native beforeunload dialog
   */
  message?: string;
  /**
   * Callback when navigation is blocked - use this to show a custom dialog
   */
  onNavigationBlocked?: (proceed: () => void, cancel: () => void) => void;
}

export interface UseNavigationGuardReturn {
  /**
   * Whether there's a pending navigation that was blocked
   */
  isBlocking: boolean;
  /**
   * Proceed with the blocked navigation
   */
  proceed: () => void;
  /**
   * Cancel the blocked navigation
   */
  cancel: () => void;
}

/**
 * Hook to guard against accidental navigation when there are unsaved changes.
 * Handles:
 * - Browser back/forward buttons (popstate)
 * - Tab close/refresh (beforeunload)
 * - Programmatic navigation via router
 */
export function useNavigationGuard(
  options: UseNavigationGuardOptions
): UseNavigationGuardReturn {
  const { shouldBlock, message = 'You have unsaved changes. Are you sure you want to leave?', onNavigationBlocked } = options;

  const [state, setState] = useState<NavigationGuardState>({
    isBlocked: false,
    pendingNavigation: null,
  });

  // Track if we're in the middle of handling navigation
  const isHandlingNavigationRef = useRef(false);
  // Store the current URL for popstate handling
  const currentUrlRef = useRef<string | null>(null);
  // Track if we pushed a duplicate entry
  const pushedDuplicateRef = useRef(false);

  // Handle beforeunload (tab close/refresh)
  useEffect(() => {
    if (!shouldBlock) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers ignore custom messages but still show a generic prompt
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [shouldBlock, message]);

  // Handle browser back/forward buttons (popstate)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Store the initial URL
    currentUrlRef.current = window.location.href;

    if (!shouldBlock) {
      pushedDuplicateRef.current = false;
      return;
    }

    // Push a duplicate entry to the history so we can intercept back navigation
    if (!pushedDuplicateRef.current) {
      window.history.pushState({ guardActive: true }, '', window.location.href);
      pushedDuplicateRef.current = true;
    }

    const handlePopState = (_e: PopStateEvent) => {
      if (isHandlingNavigationRef.current) return;

      // User pressed back/forward - we need to decide what to do
      isHandlingNavigationRef.current = true;

      const proceedWithNavigation = () => {
        isHandlingNavigationRef.current = false;
        pushedDuplicateRef.current = false;
        // Allow the navigation by going back again
        window.history.back();
      };

      const cancelNavigation = () => {
        isHandlingNavigationRef.current = false;
        // Push back to where we were (effectively canceling the navigation)
        window.history.pushState({ guardActive: true }, '', currentUrlRef.current);
      };

      if (onNavigationBlocked) {
        // Use custom dialog
        setState({
          isBlocked: true,
          pendingNavigation: proceedWithNavigation,
        });
        onNavigationBlocked(proceedWithNavigation, cancelNavigation);
      } else {
        // Use native confirm
        const confirmed = window.confirm(message);
        if (confirmed) {
          proceedWithNavigation();
        } else {
          cancelNavigation();
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [shouldBlock, message, onNavigationBlocked]);

  // Cleanup the extra history entry when unmounting or when shouldBlock becomes false
  useEffect(() => {
    return () => {
      if (pushedDuplicateRef.current && !shouldBlock) {
        // Clean up the duplicate history entry we pushed
        window.history.back();
        pushedDuplicateRef.current = false;
      }
    };
  }, [shouldBlock]);

  const proceed = useCallback(() => {
    const pendingAction = state.pendingNavigation;
    if (pendingAction) {
      pendingAction();
    }
    setState({ isBlocked: false, pendingNavigation: null });
  }, [state]);

  const cancel = useCallback(() => {
    // Push back to current URL if we need to
    if (currentUrlRef.current) {
      window.history.pushState({ guardActive: true }, '', currentUrlRef.current);
    }
    setState({ isBlocked: false, pendingNavigation: null });
  }, []);

  return {
    isBlocking: state.isBlocked,
    proceed,
    cancel,
  };
}
