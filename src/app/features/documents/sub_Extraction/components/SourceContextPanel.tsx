'use client';

import React, { memo } from 'react';
import { FileText, Brain, Quote, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Confidence } from '@/components/ui/confidence';
import type { ExtractionField } from '../../lib/types';

interface SourceContextPanelProps {
  field: ExtractionField | null;
  className?: string;
}

/**
 * Source Context Panel - Shows the source excerpt and AI reasoning for a selected field.
 * Transforms verification from guessing to certainty by showing exactly where values came from.
 */
export const SourceContextPanel = memo(function SourceContextPanel({
  field,
  className,
}: SourceContextPanelProps) {
  if (!field) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center p-6 text-center',
          'bg-gradient-to-b from-zinc-50 to-zinc-100/50',
          className
        )}
        data-testid="source-context-empty"
      >
        <FileText className="w-12 h-12 text-zinc-300 mb-3" />
        <p className="text-sm font-medium text-zinc-500">Select a field to view source</p>
        <p className="text-xs text-zinc-400 mt-1">
          Click any extraction field to see where it was found
        </p>
      </div>
    );
  }

  const hasSourceExcerpt = field.sourceExcerpt && field.sourceExcerpt.length > 0;
  const hasReasoning = field.extractionReasoning && field.extractionReasoning.length > 0;
  const isFlagged = field.flagged;

  return (
    <div
      className={cn(
        'flex flex-col gap-3 p-4 overflow-auto',
        'bg-gradient-to-b from-white to-zinc-50/50',
        'animate-in fade-in slide-in-from-right-2 duration-300',
        className
      )}
      data-testid="source-context-panel"
    >
      {/* Field Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isFlagged ? (
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
            )}
            <h3 className="font-semibold text-zinc-900 truncate" data-testid="source-field-name">
              {field.name}
            </h3>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5" data-testid="source-location">
            {field.source}
          </p>
        </div>
        <Confidence value={field.confidence} variant="badge" />
      </div>

      {/* Extracted Value Card */}
      <Card className={cn(
        'border-2 transition-colors',
        isFlagged ? 'border-amber-200 bg-amber-50/50' : 'border-indigo-200 bg-indigo-50/50'
      )}>
        <CardContent className="py-3">
          <div className="flex items-start gap-2">
            <ChevronRight className={cn(
              'w-4 h-4 shrink-0 mt-0.5',
              isFlagged ? 'text-amber-500' : 'text-indigo-500'
            )} />
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Extracted Value
              </p>
              <p
                className={cn(
                  'text-lg font-semibold mt-0.5',
                  isFlagged ? 'text-amber-900' : 'text-indigo-900'
                )}
                data-testid="source-extracted-value"
              >
                {field.value}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Source Excerpt */}
      {hasSourceExcerpt && (
        <Card className="border-zinc-200">
          <CardHeader className="py-2 px-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Quote className="w-4 h-4 text-zinc-400" />
              Source Text
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-3 pt-0">
            <div
              className="relative pl-3 border-l-2 border-zinc-200"
              data-testid="source-excerpt"
            >
              <p className="text-sm text-zinc-700 italic leading-relaxed whitespace-pre-wrap">
                &ldquo;{field.sourceExcerpt}&rdquo;
              </p>
            </div>
            <Badge variant="secondary" className="mt-2 text-xs">
              <FileText className="w-3 h-3 mr-1" />
              {field.source}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* AI Reasoning */}
      {hasReasoning && (
        <Card className={cn(
          'border-zinc-200',
          isFlagged && 'border-amber-200'
        )}>
          <CardHeader className="py-2 px-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Brain className={cn(
                'w-4 h-4',
                isFlagged ? 'text-amber-500' : 'text-indigo-500'
              )} />
              AI Reasoning
              {isFlagged && (
                <Badge variant="warning" className="ml-auto text-xs">
                  Review Recommended
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-3 pt-0">
            <p
              className={cn(
                'text-sm leading-relaxed',
                isFlagged ? 'text-amber-800' : 'text-zinc-600'
              )}
              data-testid="source-reasoning"
            >
              {field.extractionReasoning}
            </p>
          </CardContent>
        </Card>
      )}

      {/* No context available message */}
      {!hasSourceExcerpt && !hasReasoning && (
        <div className="text-center py-4 text-sm text-zinc-400">
          <p>No additional source context available for this field.</p>
        </div>
      )}
    </div>
  );
});
