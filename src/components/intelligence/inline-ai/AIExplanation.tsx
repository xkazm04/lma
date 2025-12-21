'use client';

import React, { memo } from 'react';
import { Sparkles, ExternalLink, ThumbsUp, ThumbsDown, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ConfidenceBadge } from '../primitives/ConfidenceBadge';
import type { Domain } from '../types';

interface AIExplanationProps {
  /** The explanation text */
  explanation: string;
  /** Domain context */
  domain?: Domain;
  /** Confidence score (0-100) */
  confidence?: number;
  /** Source references */
  sources?: { label: string; url?: string }[];
  /** Display variant */
  variant?: 'popover' | 'inline' | 'card';
  /** Trigger element for popover variant */
  trigger?: React.ReactNode;
  /** Callback for feedback */
  onFeedback?: (helpful: boolean) => void;
  /** Whether the popover is open (controlled) */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Additional className */
  className?: string;
  /** Test ID */
  testId?: string;
}

export const AIExplanation = memo(function AIExplanation({
  explanation,
  domain,
  confidence,
  sources,
  variant = 'inline',
  trigger,
  onFeedback,
  open,
  onOpenChange,
  className,
  testId,
}: AIExplanationProps) {
  const [copied, setCopied] = React.useState(false);
  const [feedbackGiven, setFeedbackGiven] = React.useState<boolean | null>(null);

  const handleCopy = React.useCallback(async () => {
    await navigator.clipboard.writeText(explanation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [explanation]);

  const handleFeedback = React.useCallback(
    (helpful: boolean) => {
      setFeedbackGiven(helpful);
      onFeedback?.(helpful);
    },
    [onFeedback]
  );

  const content = (
    <div className={cn('space-y-3', className)} data-testid={testId}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span className="text-xs font-medium text-zinc-700">AI Explanation</span>
        </div>
        {confidence !== undefined && (
          <ConfidenceBadge confidence={confidence} size="sm" />
        )}
      </div>

      {/* Explanation text */}
      <p className="text-xs text-zinc-600 leading-relaxed">{explanation}</p>

      {/* Sources */}
      {sources && sources.length > 0 && (
        <div className="pt-2 border-t border-zinc-100">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
            Sources
          </p>
          <div className="flex flex-wrap gap-1">
            {sources.map((source, index) => (
              <span
                key={index}
                className={cn(
                  'inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded',
                  'bg-zinc-100 text-zinc-600',
                  source.url && 'cursor-pointer hover:bg-zinc-200'
                )}
                onClick={() => source.url && window.open(source.url, '_blank')}
              >
                {source.label}
                {source.url && <ExternalLink className="w-2.5 h-2.5" />}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleCopy}
            title="Copy"
          >
            {copied ? (
              <Check className="w-3 h-3 text-green-500" />
            ) : (
              <Copy className="w-3 h-3 text-zinc-400" />
            )}
          </Button>
        </div>

        {onFeedback && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-zinc-400 mr-1">Helpful?</span>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-6 w-6 p-0',
                feedbackGiven === true && 'text-green-500 bg-green-50'
              )}
              onClick={() => handleFeedback(true)}
              disabled={feedbackGiven !== null}
            >
              <ThumbsUp className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-6 w-6 p-0',
                feedbackGiven === false && 'text-red-500 bg-red-50'
              )}
              onClick={() => handleFeedback(false)}
              disabled={feedbackGiven !== null}
            >
              <ThumbsDown className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  // Popover variant
  if (variant === 'popover') {
    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          {trigger || (
            <Button variant="ghost" size="sm" className="h-6 text-xs gap-1">
              <Sparkles className="w-3 h-3" />
              Explain
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3" align="start">
          {content}
        </PopoverContent>
      </Popover>
    );
  }

  // Card variant
  if (variant === 'card') {
    return (
      <div
        className={cn(
          'p-3 rounded-lg border bg-gradient-to-br from-indigo-50/50 to-white',
          'border-indigo-100',
          className
        )}
        data-testid={testId}
      >
        {content}
      </div>
    );
  }

  // Inline variant (default)
  return content;
});
