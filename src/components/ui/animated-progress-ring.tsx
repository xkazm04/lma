'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { CONFIDENCE_DISPLAY_THRESHOLDS } from '@/app/features/documents/lib/constants';

export interface AnimatedProgressRingProps {
  /**
   * Progress value from 0 to 100
   */
  value: number;
  /**
   * Size of the circular progress indicator in pixels
   */
  size?: number;
  /**
   * Stroke width of the progress ring
   */
  strokeWidth?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Animation duration in milliseconds
   */
  animationDuration?: number;
  /**
   * Animation delay in milliseconds
   */
  animationDelay?: number;
  /**
   * Show glow effect
   */
  showGlow?: boolean;
  /**
   * Test ID for automated testing
   */
  'data-testid'?: string;
}

/**
 * Get confidence color based on value (0-100)
 * Uses unified CONFIDENCE_DISPLAY_THRESHOLDS for consistent styling.
 * High confidence (>= 85%): green
 * Medium confidence (70-84%): amber
 * Low confidence (< 70%): red
 */
function getConfidenceColor(value: number): {
  stroke: string;
  glow: string;
  text: string;
  glowColor: string;
} {
  if (value >= CONFIDENCE_DISPLAY_THRESHOLDS.HIGH) {
    return {
      stroke: '#22c55e', // green-500
      glow: 'rgba(34, 197, 94, 0.4)',
      text: 'text-green-600',
      glowColor: '0 0 20px rgba(34, 197, 94, 0.5), 0 0 40px rgba(34, 197, 94, 0.3)',
    };
  }
  if (value >= CONFIDENCE_DISPLAY_THRESHOLDS.MEDIUM) {
    return {
      stroke: '#f59e0b', // amber-500
      glow: 'rgba(245, 158, 11, 0.4)',
      text: 'text-amber-600',
      glowColor: '0 0 20px rgba(245, 158, 11, 0.5), 0 0 40px rgba(245, 158, 11, 0.3)',
    };
  }
  return {
    stroke: '#ef4444', // red-500
    glow: 'rgba(239, 68, 68, 0.4)',
    text: 'text-red-600',
    glowColor: '0 0 20px rgba(239, 68, 68, 0.5), 0 0 40px rgba(239, 68, 68, 0.3)',
  };
}

/**
 * Easing function for smooth animation (easeOutExpo)
 */
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

const AnimatedProgressRing = React.forwardRef<HTMLDivElement, AnimatedProgressRingProps>(
  (
    {
      value,
      size = 80,
      strokeWidth = 6,
      className,
      animationDuration = 1500,
      animationDelay = 0,
      showGlow = true,
      'data-testid': testId,
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = React.useState(0);
    const [strokeProgress, setStrokeProgress] = React.useState(0);
    const animationRef = React.useRef<number | null>(null);
    const startTimeRef = React.useRef<number | null>(null);

    // Clamp target value between 0 and 100
    const targetValue = Math.min(100, Math.max(0, value));
    const colors = getConfidenceColor(targetValue);

    // SVG circle calculations
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (strokeProgress / 100) * circumference;

    React.useEffect(() => {
      const animate = (timestamp: number) => {
        if (startTimeRef.current === null) {
          startTimeRef.current = timestamp;
        }

        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / animationDuration, 1);
        const easedProgress = easeOutExpo(progress);

        const currentValue = Math.round(easedProgress * targetValue);
        const currentStroke = easedProgress * targetValue;

        setDisplayValue(currentValue);
        setStrokeProgress(currentStroke);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      const delayTimeout = setTimeout(() => {
        startTimeRef.current = null;
        animationRef.current = requestAnimationFrame(animate);
      }, animationDelay);

      return () => {
        clearTimeout(delayTimeout);
        if (animationRef.current !== null) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, [targetValue, animationDuration, animationDelay]);

    return (
      <div
        ref={ref}
        className={cn('relative inline-flex items-center justify-center', className)}
        style={{ width: size, height: size }}
        data-testid={testId}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
          style={{
            filter: showGlow && strokeProgress > 0 ? `drop-shadow(${colors.glowColor})` : undefined,
          }}
        >
          {/* Background circle (track) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className="stroke-zinc-200"
            strokeWidth={strokeWidth}
            data-testid={testId ? `${testId}-track` : undefined}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: 'stroke 0.3s ease',
            }}
            data-testid={testId ? `${testId}-indicator` : undefined}
          />
        </svg>
        {/* Center content - animated percentage */}
        <div
          className={cn(
            'absolute inset-0 flex flex-col items-center justify-center',
            colors.text
          )}
          data-testid={testId ? `${testId}-content` : undefined}
        >
          <span className="text-xl font-bold leading-none">{displayValue}%</span>
        </div>
      </div>
    );
  }
);

AnimatedProgressRing.displayName = 'AnimatedProgressRing';

export { AnimatedProgressRing, getConfidenceColor };
