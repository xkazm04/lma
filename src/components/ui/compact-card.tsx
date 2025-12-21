'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CompactCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'ghost';
  padding?: 'none' | 'xs' | 'sm' | 'md';
  children: React.ReactNode;
}

const paddingClasses = {
  none: 'p-0',
  xs: 'p-2',
  sm: 'p-3',
  md: 'p-4',
};

const variantClasses = {
  default: 'border border-zinc-200 bg-white rounded-lg shadow-sm',
  bordered: 'border border-zinc-200 bg-white rounded-lg',
  ghost: 'bg-transparent',
};

export const CompactCard = forwardRef<HTMLDivElement, CompactCardProps>(
  ({ variant = 'default', padding = 'sm', className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(variantClasses[variant], paddingClasses[padding], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CompactCard.displayName = 'CompactCard';

interface CompactCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CompactCardHeader = forwardRef<HTMLDivElement, CompactCardHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('py-2 px-3 border-b border-zinc-100', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CompactCardHeader.displayName = 'CompactCardHeader';

interface CompactCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CompactCardContent = forwardRef<HTMLDivElement, CompactCardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('px-3 pb-3 pt-2', className)} {...props}>
        {children}
      </div>
    );
  }
);

CompactCardContent.displayName = 'CompactCardContent';

interface CompactCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CompactCardFooter = forwardRef<HTMLDivElement, CompactCardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('py-2 px-3 border-t border-zinc-100', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CompactCardFooter.displayName = 'CompactCardFooter';
