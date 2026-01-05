'use client';

import React, { memo, useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

interface CopyableValueProps {
  /** The raw value to copy to clipboard */
  value: string | null;
  /** The display content (can include diff highlighting) */
  children: React.ReactNode;
  /** Additional CSS classes for the container */
  className?: string;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

/**
 * Wraps a document value with a hover-to-copy button.
 * Uses the Clipboard API with fallback to execCommand for older browsers.
 * Shows a brief "Copied" toast notification on successful copy.
 */
export const CopyableValue = memo(function CopyableValue({
  value,
  children,
  className,
  'data-testid': testId,
}: CopyableValueProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!value) return;

    try {
      // Try modern Clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = value;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand('copy');
        } finally {
          document.body.removeChild(textArea);
        }
      }

      // Show success state
      setIsCopied(true);

      // Show toast notification
      toast({
        title: 'Copied',
        description: value.length > 50 ? `${value.slice(0, 50)}...` : value,
        variant: 'success',
        duration: 2000,
      });

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
      toast({
        title: 'Copy failed',
        description: 'Unable to copy to clipboard',
        variant: 'destructive',
        duration: 2000,
      });
    }
  }, [value]);

  // Don't show copy button if there's no value
  if (!value) {
    return (
      <div className={className} data-testid={testId}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn('relative group', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={testId}
    >
      {/* Main content */}
      <div className="pr-8">
        {children}
      </div>

      {/* Copy button - appears on hover at right edge */}
      <button
        type="button"
        onClick={handleCopy}
        className={cn(
          'absolute right-1 top-1/2 -translate-y-1/2',
          'w-6 h-6 flex items-center justify-center',
          'rounded bg-white/90 border border-zinc-200 shadow-sm',
          'text-zinc-400 hover:text-zinc-600 hover:bg-white hover:border-zinc-300',
          'transition-all duration-150',
          // Opacity transition for hover appearance
          isHovered ? 'opacity-100' : 'opacity-0',
          // Green success state when copied
          isCopied && 'text-green-600 border-green-200 bg-green-50'
        )}
        aria-label="Copy value to clipboard"
        data-testid={testId ? `${testId}-copy-btn` : 'copy-value-btn'}
      >
        {isCopied ? (
          <Check className="w-3.5 h-3.5" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
});
