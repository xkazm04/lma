'use client';

import React, { memo, useState, useCallback } from 'react';
import {
  Lightbulb,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ConfidenceBadge } from '../primitives/ConfidenceBadge';
import type { InlineAISuggestion, Domain } from '../types';

interface AISuggestionRowProps {
  /** The suggestion data */
  suggestion: InlineAISuggestion;
  /** Domain context */
  domain?: Domain;
  /** Whether the suggestion is selected */
  selected?: boolean;
  /** Whether actions are loading */
  loading?: boolean;
  /** Callback when suggestion is accepted */
  onAccept?: (suggestion: InlineAISuggestion) => void;
  /** Callback when suggestion is dismissed */
  onDismiss?: (suggestion: InlineAISuggestion) => void;
  /** Callback when view details is clicked */
  onViewDetails?: (suggestion: InlineAISuggestion) => void;
  /** Display variant */
  variant?: 'compact' | 'full' | 'card';
  /** Additional className */
  className?: string;
  /** Test ID */
  testId?: string;
}

const impactColors = {
  high: { bg: 'bg-green-100', text: 'text-green-700', label: 'High Impact' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Medium Impact' },
  low: { bg: 'bg-zinc-100', text: 'text-zinc-600', label: 'Low Impact' },
};

const categoryColors: Record<string, { bg: string; text: string }> = {
  risk: { bg: 'bg-red-100', text: 'text-red-700' },
  opportunity: { bg: 'bg-green-100', text: 'text-green-700' },
  compliance: { bg: 'bg-purple-100', text: 'text-purple-700' },
  optimization: { bg: 'bg-blue-100', text: 'text-blue-700' },
  default: { bg: 'bg-zinc-100', text: 'text-zinc-600' },
};

export const AISuggestionRow = memo(function AISuggestionRow({
  suggestion,
  domain,
  selected = false,
  loading = false,
  onAccept,
  onDismiss,
  onViewDetails,
  variant = 'full',
  className,
  testId,
}: AISuggestionRowProps) {
  const [expanded, setExpanded] = useState(false);

  const handleAccept = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onAccept?.(suggestion);
    },
    [suggestion, onAccept]
  );

  const handleDismiss = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDismiss?.(suggestion);
    },
    [suggestion, onDismiss]
  );

  const handleViewDetails = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onViewDetails?.(suggestion);
    },
    [suggestion, onViewDetails]
  );

  const impactConfig = suggestion.impact ? impactColors[suggestion.impact] : null;
  const categoryConfig = suggestion.category
    ? categoryColors[suggestion.category] || categoryColors.default
    : null;

  // Compact variant
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-2 p-2 rounded-lg transition-all',
          'hover:bg-zinc-50',
          selected && 'bg-indigo-50 border border-indigo-200',
          className
        )}
        data-testid={testId || `suggestion-row-${suggestion.id}`}
      >
        <Lightbulb className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
        <p className="text-xs text-zinc-700 flex-1 truncate">{suggestion.title}</p>
        {suggestion.confidence !== undefined && (
          <ConfidenceBadge confidence={suggestion.confidence} size="sm" variant="minimal" />
        )}
        {onAccept && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={handleAccept}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Check className="w-3 h-3" />
            )}
          </Button>
        )}
      </div>
    );
  }

  // Card variant
  if (variant === 'card') {
    return (
      <div
        className={cn(
          'p-3 rounded-lg border transition-all',
          'bg-gradient-to-br from-amber-50/30 to-white',
          selected ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-zinc-200',
          'hover:shadow-sm',
          className
        )}
        data-testid={testId || `suggestion-card-${suggestion.id}`}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-100">
            <Lightbulb className="w-4 h-4 text-amber-600" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="text-sm font-medium text-zinc-900">{suggestion.title}</h4>
              {impactConfig && (
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded font-medium',
                    impactConfig.bg,
                    impactConfig.text
                  )}
                >
                  {impactConfig.label}
                </span>
              )}
            </div>

            <p className="text-xs text-zinc-600 mb-2">{suggestion.description}</p>

            <div className="flex items-center gap-2 flex-wrap">
              {categoryConfig && suggestion.category && (
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded capitalize',
                    categoryConfig.bg,
                    categoryConfig.text
                  )}
                >
                  {suggestion.category}
                </span>
              )}
              {suggestion.confidence !== undefined && (
                <ConfidenceBadge confidence={suggestion.confidence} size="sm" />
              )}
              {suggestion.source && (
                <span className="text-[10px] text-zinc-400">{suggestion.source}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {onAccept && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs text-green-600 border-green-200 hover:bg-green-50"
                onClick={handleAccept}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Accept
                  </>
                )}
              </Button>
            )}
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-600"
                onClick={handleDismiss}
                disabled={loading}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {onViewDetails && (
          <div className="mt-3 pt-2 border-t border-zinc-100">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-zinc-500 hover:text-zinc-700"
              onClick={handleViewDetails}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              View Details
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Full variant (default)
  return (
    <div
      className={cn(
        'rounded-lg border transition-all',
        selected ? 'border-indigo-300 bg-indigo-50/50' : 'border-zinc-200 bg-white',
        'hover:shadow-sm',
        className
      )}
      data-testid={testId || `suggestion-row-${suggestion.id}`}
    >
      {/* Main row */}
      <div
        className={cn(
          'flex items-center gap-3 p-3 cursor-pointer',
          suggestion.details && 'hover:bg-zinc-50/50'
        )}
        onClick={() => suggestion.details && setExpanded(!expanded)}
      >
        <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-zinc-800 truncate">{suggestion.title}</p>
            {impactConfig && (
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0',
                  impactConfig.bg,
                  impactConfig.text
                )}
              >
                {impactConfig.label}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 truncate">{suggestion.description}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {suggestion.confidence !== undefined && (
            <ConfidenceBadge confidence={suggestion.confidence} size="sm" />
          )}

          {onAccept && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={handleAccept}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
            </Button>
          )}

          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-600"
              onClick={handleDismiss}
              disabled={loading}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}

          {suggestion.details && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && suggestion.details && (
        <div className="px-3 pb-3 pt-0 border-t border-zinc-100 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="pl-7">
            <p className="text-xs text-zinc-600 leading-relaxed">{suggestion.details}</p>

            {suggestion.actionItems && suggestion.actionItems.length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                  Action Items
                </p>
                <ul className="space-y-1">
                  {suggestion.actionItems.map((item, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-1.5 text-xs text-zinc-600"
                    >
                      <span className="text-zinc-400 mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {onViewDetails && (
              <Button
                variant="link"
                size="sm"
                className="h-6 text-xs p-0 mt-2"
                onClick={handleViewDetails}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                View Full Details
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
