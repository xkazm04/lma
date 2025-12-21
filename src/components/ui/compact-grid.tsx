'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CompactGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 2 | 3 | 4 | 5 | 6;
  gap?: 'xs' | 'sm' | 'md';
  responsive?: boolean;
  children: React.ReactNode;
}

const gapClasses = {
  xs: 'gap-2',
  sm: 'gap-3',
  md: 'gap-4',
};

const columnClasses = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
};

const responsiveColumnClasses = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
  6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
};

export const CompactGrid = forwardRef<HTMLDivElement, CompactGridProps>(
  ({ columns = 4, gap = 'sm', responsive = true, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'grid',
          gapClasses[gap],
          responsive ? responsiveColumnClasses[columns] : columnClasses[columns],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CompactGrid.displayName = 'CompactGrid';
