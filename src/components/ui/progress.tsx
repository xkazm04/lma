'use client';

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  /**
   * Enable entrance animation that fills from 0 to target value over 800ms with easing
   */
  animate?: boolean;
  /**
   * Delay before animation starts (in ms). Only applies when animate is true.
   */
  animationDelay?: number;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, animate = false, animationDelay = 0, ...props }, ref) => {
  const [displayValue, setDisplayValue] = React.useState(animate ? 0 : (value || 0));

  React.useEffect(() => {
    if (animate) {
      // Start from 0 and animate to target value after delay
      const timer = setTimeout(() => {
        setDisplayValue(value || 0);
      }, animationDelay);
      return () => clearTimeout(timer);
    } else {
      setDisplayValue(value || 0);
    }
  }, [value, animate, animationDelay]);

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        'relative h-4 w-full overflow-hidden rounded-full bg-zinc-100',
        className
      )}
      data-testid="progress-root"
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          'h-full w-full flex-1 bg-zinc-900',
          animate
            ? 'transition-transform duration-[800ms] ease-out'
            : 'transition-all duration-500 ease-out'
        )}
        style={{ transform: `translateX(-${100 - displayValue}%)` }}
        data-testid="progress-indicator"
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
