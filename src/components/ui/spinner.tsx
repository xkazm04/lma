'use client';

import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function Spinner({ size = 'default', className }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900',
        sizeClasses[size],
        className
      )}
    />
  );
}
