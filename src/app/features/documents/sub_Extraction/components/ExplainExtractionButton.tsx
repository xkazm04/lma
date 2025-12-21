'use client';

import React, { memo, useState, useCallback } from 'react';
import { Sparkles, ChevronDown, ChevronUp, FileText, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { FieldSuggestions } from './FieldSuggestions';
import type { ExtractionField, ExplainExtractionResponse } from '../../lib/types';

interface ExplainExtractionButtonProps {
  field: ExtractionField;
  documentId: string;
  onValueChange?: (newValue: string) => void;
  className?: string;
}

/**
 * Button component that triggers AI explanation of extraction logic.
 * When clicked, calls the explain API and displays:
 * - Detailed explanation of extraction reasoning
 * - Alternative values that were considered
 * - Document context around the extracted value
 * - Verification steps the user can take
 *
 * @example
 * <ExplainExtractionButton
 *   field={extractedField}
 *   documentId="doc-123"
 *   onValueChange={(newValue) => handleValueUpdate(newValue)}
 * />
 */
export const ExplainExtractionButton = memo(function ExplainExtractionButton({
  field,
  documentId,
  onValueChange,
  className,
}: ExplainExtractionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState<ExplainExtractionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchExplanation = useCallback(async () => {
    if (explanation) {
      setIsExpanded(!isExpanded);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/documents/${documentId}/extraction/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldName: field.name,
          extractedValue: field.value,
          source: field.source,
          confidence: field.confidence,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to get explanation');
      }

      setExplanation(data.data);
      setIsExpanded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [documentId, field, explanation, isExpanded]);

  const handleSelectAlternative = useCallback(
    (value: string) => {
      if (onValueChange) {
        onValueChange(value);
      }
    },
    [onValueChange]
  );

  return (
    <div className={cn('space-y-2', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={fetchExplanation}
        disabled={isLoading}
        className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
        data-testid="explain-extraction-btn"
      >
        {isLoading ? (
          <Spinner size="sm" className="mr-1" />
        ) : (
          <Sparkles className="w-4 h-4 mr-1" />
        )}
        {isLoading ? 'Analyzing...' : 'Explain Extraction'}
        {!isLoading && explanation && (
          isExpanded ? (
            <ChevronUp className="w-3 h-3 ml-1" />
          ) : (
            <ChevronDown className="w-3 h-3 ml-1" />
          )
        )}
      </Button>

      {error && (
        <Card className="border-red-200 bg-red-50" data-testid="explain-error">
          <CardContent className="py-3 text-sm text-red-700">
            {error}
          </CardContent>
        </Card>
      )}

      {isExpanded && explanation && (
        <Card
          className="animate-in slide-in-from-top-2 duration-300"
          data-testid="explain-content"
        >
          <CardContent className="py-4 space-y-4">
            {/* Explanation */}
            <div>
              <h4 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 mb-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                Extraction Logic
              </h4>
              <p
                className="text-sm text-zinc-600 leading-relaxed"
                data-testid="extraction-explanation"
              >
                {explanation.explanation}
              </p>
            </div>

            {/* Document Context */}
            {explanation.documentContext && (
              <div>
                <h4 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 mb-2">
                  <FileText className="w-4 h-4 text-zinc-500" />
                  Source Document Context
                </h4>
                <blockquote
                  className="pl-3 border-l-2 border-zinc-300 text-sm text-zinc-600 italic"
                  data-testid="document-context"
                >
                  &ldquo;{explanation.documentContext}&rdquo;
                </blockquote>
              </div>
            )}

            {/* Alternative Values */}
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 mb-2">
                Alternative Values Considered
              </h4>
              <FieldSuggestions
                alternatives={explanation.alternatives}
                currentValue={field.value}
                onSelectAlternative={handleSelectAlternative}
              />
            </div>

            {/* Verification Steps */}
            {explanation.verificationSteps && explanation.verificationSteps.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 mb-2">
                  <ListChecks className="w-4 h-4 text-green-500" />
                  Verification Steps
                </h4>
                <ol className="list-decimal list-inside space-y-1">
                  {explanation.verificationSteps.map((step, index) => (
                    <li
                      key={index}
                      className="text-sm text-zinc-600"
                      data-testid={`verification-step-${index}`}
                    >
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
});
