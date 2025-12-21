'use client';

import { useState, useEffect, useRef } from 'react';

interface UseCountUpOptions {
  duration?: number; // Animation duration in ms
  easing?: (t: number) => number; // Easing function
}

const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);

/**
 * Hook for count-up animation using requestAnimationFrame
 * Provides smooth 60fps animations with CSS transform-friendly output
 */
export function useCountUp(
  targetValue: number,
  options: UseCountUpOptions = {}
): number {
  const { duration = 800, easing = easeOutQuart } = options;
  const [currentValue, setCurrentValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const previousTargetRef = useRef<number>(0);

  useEffect(() => {
    // Skip animation if target hasn't changed
    if (targetValue === previousTargetRef.current && currentValue === targetValue) {
      return;
    }

    const startValue = previousTargetRef.current;
    previousTargetRef.current = targetValue;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);

      const newValue = Math.round(startValue + (targetValue - startValue) * easedProgress);
      setCurrentValue(newValue);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [targetValue, duration, easing, currentValue]);

  return currentValue;
}
