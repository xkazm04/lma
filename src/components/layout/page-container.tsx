'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  /** Max width constraint. Defaults to 'xl' (~1400px) */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  /** Additional className */
  className?: string;
  /** Remove horizontal padding */
  noPadding?: boolean;
}

const maxWidthClasses: Record<NonNullable<PageContainerProps['maxWidth']>, string> = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-5xl',
  xl: 'max-w-[1400px]',
  '2xl': 'max-w-7xl',
  full: 'max-w-none',
};

export function PageContainer({
  children,
  maxWidth = 'xl',
  className,
  noPadding = false,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full',
        maxWidthClasses[maxWidth],
        !noPadding && 'px-4 sm:px-6',
        className
      )}
    >
      {children}
    </div>
  );
}
