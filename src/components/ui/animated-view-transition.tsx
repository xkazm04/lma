'use client';

import React, { useState, useEffect, useRef, memo, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedViewTransitionProps {
  /** Unique key to identify the current view - changes trigger animation */
  viewKey: string;
  /** The content to render */
  children: ReactNode;
  /** Additional className for the container */
  className?: string;
  /** Duration of the transition in milliseconds (default: 220ms) */
  duration?: number;
  /** Test ID for the container */
  'data-testid'?: string;
}

/**
 * AnimatedViewTransition - A component that provides smooth crossfade transitions
 * between different views. Uses CSS animations with translateY and opacity for
 * a polished fade-up effect.
 *
 * Respects prefers-reduced-motion media query - when enabled, transitions are instant.
 *
 * @example
 * ```tsx
 * <AnimatedViewTransition viewKey={viewMode}>
 *   {viewMode === 'list' ? <ListView /> : <CalendarView />}
 * </AnimatedViewTransition>
 * ```
 */
export const AnimatedViewTransition = memo(function AnimatedViewTransition({
  viewKey,
  children,
  className,
  'data-testid': testId,
}: AnimatedViewTransitionProps) {
  const [displayedChildren, setDisplayedChildren] = useState<ReactNode>(children);
  const [prevChildren, setPrevChildren] = useState<ReactNode>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevKeyRef = useRef(viewKey);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clean up any pending timeout on unmount
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (viewKey !== prevKeyRef.current) {
      // View has changed, start transition
      setPrevChildren(displayedChildren);
      setDisplayedChildren(children);
      setIsTransitioning(true);
      prevKeyRef.current = viewKey;

      // Clear any existing timeout
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }

      // End transition after animation completes
      transitionTimeoutRef.current = setTimeout(() => {
        setIsTransitioning(false);
        setPrevChildren(null);
      }, 220);
    } else {
      // Same view, just update children
      setDisplayedChildren(children);
    }
  }, [viewKey, children, displayedChildren]);

  return (
    <div
      className={cn('view-transition-container', className)}
      data-testid={testId}
    >
      {/* Exiting view */}
      {isTransitioning && prevChildren && (
        <div
          className="view-transition-item view-transition-exit"
          aria-hidden="true"
        >
          {prevChildren}
        </div>
      )}

      {/* Entering/current view */}
      <div
        className={cn(
          'view-transition-item',
          isTransitioning && 'view-transition-enter'
        )}
        key={viewKey}
      >
        {displayedChildren}
      </div>
    </div>
  );
});
