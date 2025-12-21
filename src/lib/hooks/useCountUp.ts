'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseCountUpOptions {
  duration?: number;
  startFrom?: number;
  decimals?: number;
  easing?: (t: number) => number;
}

// Ease-out cubic: starts fast, slows down at end
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Hook that animates a number from a start value to an end value.
 * Returns the current animated value and a function to detect if value increased.
 */
export function useCountUp(
  target: number,
  options: UseCountUpOptions = {}
): { value: number; didIncrease: boolean } {
  const {
    duration = 300,
    startFrom = 0,
    decimals = 0,
    easing = easeOutCubic,
  } = options;

  const [displayValue, setDisplayValue] = useState(startFrom);
  const [didIncrease, setDidIncrease] = useState(false);
  const previousTarget = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const startValueRef = useRef(startFrom);

  const animate = useCallback((timestamp: number) => {
    if (startTimeRef.current === null) {
      startTimeRef.current = timestamp;
    }

    const elapsed = timestamp - startTimeRef.current;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);

    const currentValue = startValueRef.current + (target - startValueRef.current) * easedProgress;

    if (decimals === 0) {
      setDisplayValue(Math.round(currentValue));
    } else {
      setDisplayValue(Number(currentValue.toFixed(decimals)));
    }

    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [target, duration, decimals, easing]);

  useEffect(() => {
    // Detect if this is an increase
    if (previousTarget.current !== null && target > previousTarget.current) {
      setDidIncrease(true);
      // Reset the increase flag after animation + a small buffer
      const timer = setTimeout(() => setDidIncrease(false), duration + 200);
      return () => clearTimeout(timer);
    }
    previousTarget.current = target;
  }, [target, duration]);

  useEffect(() => {
    // Cancel any existing animation
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }

    // Reset animation state
    startTimeRef.current = null;
    startValueRef.current = displayValue;

    // Start new animation
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [target, animate]);

  // Update previous target ref
  useEffect(() => {
    previousTarget.current = target;
  }, [target]);

  return { value: displayValue, didIncrease };
}
