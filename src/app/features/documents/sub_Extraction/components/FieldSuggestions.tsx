'use client';

import React, { memo } from 'react';
import { AlertTriangle, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Confidence } from '@/components/ui/confidence';
import { cn } from '@/lib/utils';
import type { AlternativeValue } from '../../lib/types';

interface FieldSuggestionsProps {
  alternatives: AlternativeValue[];
  currentValue: string;
  onSelectAlternative: (value: string) => void;
  className?: string;
}

/**
 * Component that displays alternative values the AI considered during extraction.
 * Shows each alternative with its confidence score and the reason it was rejected.
 * Allows users to select an alternative if they believe it's more accurate.
 *
 * @example
 * <FieldSuggestions
 *   alternatives={[
 *     { value: '$450M', confidence: 0.35, source: 'Page 2', rejectionReason: 'Historical amount' }
 *   ]}
 *   currentValue="$500,000,000"
 *   onSelectAlternative={(value) => handleSelect(value)}
 * />
 */
export const FieldSuggestions = memo(function FieldSuggestions({
  alternatives,
  currentValue,
  onSelectAlternative,
  className,
}: FieldSuggestionsProps) {
  if (!alternatives || alternatives.length === 0) {
    return (
      <div
        className={cn(
          'p-4 bg-green-50 border border-green-200 rounded-lg',
          className
        )}
        data-testid="field-suggestions-empty"
      >
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">No alternative values were considered</span>
        </div>
        <p className="text-xs text-green-600 mt-1 ml-6">
          The AI was confident in this extraction with no competing values found.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn('space-y-3', className)}
      data-testid="field-suggestions"
    >
      <div className="flex items-center gap-2 text-amber-700 mb-2">
        <AlertTriangle className="w-4 h-4" />
        <span className="text-sm font-medium">
          {alternatives.length} alternative value{alternatives.length > 1 ? 's' : ''} considered
        </span>
      </div>

      <div className="space-y-2">
        {alternatives.map((alt, index) => (
          <div
            key={`${alt.value}-${index}`}
            className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100 transition-colors"
            data-testid={`alternative-value-${index}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="font-mono text-sm font-medium text-zinc-900 truncate"
                    data-testid={`alternative-value-text-${index}`}
                  >
                    {alt.value}
                  </span>
                  <Confidence value={alt.confidence} variant="badge" />
                </div>
                <p className="text-xs text-zinc-500 mb-2">
                  Source: {alt.source}
                </p>
                <div className="flex items-start gap-2">
                  <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                  <p
                    className="text-xs text-zinc-600 leading-relaxed"
                    data-testid={`alternative-rejection-reason-${index}`}
                  >
                    <span className="font-medium text-red-600">Rejected: </span>
                    {alt.rejectionReason}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectAlternative(alt.value)}
                className="shrink-0"
                data-testid={`select-alternative-btn-${index}`}
              >
                Use This
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-zinc-200">
        <div className="flex items-center gap-2 text-zinc-500">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-xs">
            Current value: <span className="font-mono font-medium text-zinc-900">{currentValue}</span>
          </span>
        </div>
      </div>
    </div>
  );
});
