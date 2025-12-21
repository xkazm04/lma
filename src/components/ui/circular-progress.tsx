'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CircularProgressProps {
  /**
   * Progress value from 0 to 100 (percentage of time elapsed toward deadline)
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
   * Content to display inside the circle (typically days remaining)
   */
  children?: React.ReactNode;
  /**
   * Enable entrance animation
   */
  animate?: boolean;
  /**
   * Animation delay in milliseconds
   */
  animationDelay?: number;
  /**
   * Test ID for automated testing
   */
  'data-testid'?: string;
}

/**
 * Calculates the color based on progress percentage.
 * - 0-50%: green (plenty of time)
 * - 50-75%: amber/yellow (approaching deadline)
 * - 75-100%: red (urgent)
 */
function getProgressColor(value: number): { stroke: string; bg: string; text: string } {
  if (value <= 50) {
    return {
      stroke: 'stroke-green-500',
      bg: 'bg-green-50',
      text: 'text-green-700',
    };
  }
  if (value <= 75) {
    return {
      stroke: 'stroke-amber-500',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
    };
  }
  return {
    stroke: 'stroke-red-500',
    bg: 'bg-red-50',
    text: 'text-red-700',
  };
}

const CircularProgress = React.forwardRef<HTMLDivElement, CircularProgressProps>(
  (
    {
      value,
      size = 40,
      strokeWidth = 3,
      className,
      children,
      animate = true,
      animationDelay = 0,
      'data-testid': testId,
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = React.useState(animate ? 0 : value);

    React.useEffect(() => {
      if (animate) {
        const timer = setTimeout(() => {
          setDisplayValue(value);
        }, animationDelay);
        return () => clearTimeout(timer);
      } else {
        setDisplayValue(value);
      }
    }, [value, animate, animationDelay]);

    // Clamp value between 0 and 100
    const clampedValue = Math.min(100, Math.max(0, displayValue));
    const colors = getProgressColor(value); // Use original value for color (not animated)

    // SVG circle calculations
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    // Show remaining time (decreasing), so strokeDashoffset represents time elapsed
    const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

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
          {/* Progress circle (fills as deadline approaches) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className={cn(
              colors.stroke,
              animate && 'transition-[stroke-dashoffset] duration-700 ease-out'
            )}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            data-testid={testId ? `${testId}-indicator` : undefined}
          />
        </svg>
        {/* Center content */}
        {children && (
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center text-xs font-semibold',
              colors.text
            )}
            data-testid={testId ? `${testId}-content` : undefined}
          >
            {children}
          </div>
        )}
      </div>
    );
  }
);

CircularProgress.displayName = 'CircularProgress';

export { CircularProgress, getProgressColor };
