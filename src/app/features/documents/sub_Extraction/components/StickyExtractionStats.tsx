'use client';

import React, { memo, useMemo, useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExtractionCategory } from '../../lib/types';

interface FlaggedField {
  categoryId: string;
  categoryName: string;
  fieldIndex: number;
  fieldName: string;
  confidence: number;
}

interface StickyExtractionStatsProps {
  categories: ExtractionCategory[];
  verifiedFieldsMap: Map<string, Set<number>>;
  onJumpToField: (categoryId: string, fieldIndex: number) => void;
}

export const StickyExtractionStats = memo(function StickyExtractionStats({
  categories,
  verifiedFieldsMap,
  onJumpToField,
}: StickyExtractionStatsProps) {
  const [isCompact, setIsCompact] = useState(false);
  const [showFlaggedDropdown, setShowFlaggedDropdown] = useState(false);

  // Calculate stats
  const stats = useMemo(() => {
    let totalFields = 0;
    let verifiedFields = 0;
    let flaggedFields = 0;
    let totalConfidence = 0;

    categories.forEach((cat) => {
      totalFields += cat.fields.length;
      const catVerified = verifiedFieldsMap.get(cat.id) || new Set();
      verifiedFields += catVerified.size;
      flaggedFields += cat.fields.filter((f) => f.flagged).length;
      totalConfidence += cat.fields.reduce((a, f) => a + f.confidence, 0);
    });

    const avgConfidence = totalFields > 0 ? totalConfidence / totalFields : 0;
    const reviewProgress = totalFields > 0 ? (verifiedFields / totalFields) * 100 : 0;

    return {
      totalFields,
      verifiedFields,
      flaggedFields,
      avgConfidence,
      reviewProgress,
    };
  }, [categories, verifiedFieldsMap]);

  // Get list of flagged fields for quick-jump
  const flaggedFieldsList = useMemo(() => {
    const result: FlaggedField[] = [];
    categories.forEach((cat) => {
      cat.fields.forEach((field, idx) => {
        if (field.flagged) {
          result.push({
            categoryId: cat.id,
            categoryName: cat.category,
            fieldIndex: idx,
            fieldName: field.name,
            confidence: field.confidence,
          });
        }
      });
    });
    return result;
  }, [categories]);

  // Handle scroll to detect when to collapse
  useEffect(() => {
    const handleScroll = () => {
      // Find the scrollable container - the left pane content
      const scrollContainer = document.querySelector('[data-extraction-scroll-container]');
      if (scrollContainer) {
        const scrollTop = scrollContainer.scrollTop;
        setIsCompact(scrollTop > 200);
      }
    };

    const scrollContainer = document.querySelector('[data-extraction-scroll-container]');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const handleJumpToFlagged = useCallback(
    (categoryId: string, fieldIndex: number) => {
      onJumpToField(categoryId, fieldIndex);
      setShowFlaggedDropdown(false);
    },
    [onJumpToField]
  );

  const handleToggleDropdown = useCallback(() => {
    setShowFlaggedDropdown((prev) => !prev);
  }, []);

  // Compact version - minimal sticky bar
  if (isCompact) {
    return (
      <div
        className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b shadow-sm transition-all duration-300 animate-in slide-in-from-top-2"
        data-testid="sticky-extraction-stats-compact"
      >
        <div className="px-4 py-2 flex items-center justify-between gap-4">
          {/* Progress section */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-[200px]">
              <span className="text-sm font-medium text-zinc-700 whitespace-nowrap">
                Review Progress
              </span>
              <Progress
                value={stats.reviewProgress}
                className="h-2 w-24"
                data-testid="compact-review-progress"
              />
              <span className="text-sm text-zinc-600 whitespace-nowrap">
                {stats.verifiedFields}/{stats.totalFields}
              </span>
            </div>
            <div className="h-4 w-px bg-zinc-200" />
            <span className="text-sm text-zinc-500">
              {Math.round(stats.avgConfidence * 100)}% avg confidence
            </span>
          </div>

          {/* Flagged fields quick jump */}
          {stats.flaggedFields > 0 && (
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleDropdown}
                className="border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-700"
                data-testid="compact-flagged-jump-btn"
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                {stats.flaggedFields} Flagged
                {showFlaggedDropdown ? (
                  <ChevronUp className="w-4 h-4 ml-1" />
                ) : (
                  <ChevronDown className="w-4 h-4 ml-1" />
                )}
              </Button>

              {showFlaggedDropdown && (
                <div
                  className="absolute right-0 top-full mt-1 w-72 bg-white rounded-lg shadow-lg border border-zinc-200 py-1 z-30 animate-in fade-in slide-in-from-top-2 duration-200"
                  data-testid="flagged-fields-dropdown"
                >
                  <div className="px-3 py-2 border-b border-zinc-100">
                    <p className="text-xs font-medium text-zinc-500 uppercase">Jump to flagged field</p>
                  </div>
                  <div className="max-h-64 overflow-auto">
                    {flaggedFieldsList.map((field, idx) => (
                      <button
                        key={`${field.categoryId}-${field.fieldIndex}`}
                        onClick={() => handleJumpToFlagged(field.categoryId, field.fieldIndex)}
                        className="w-full px-3 py-2 text-left hover:bg-zinc-50 flex items-center justify-between gap-2 transition-colors"
                        data-testid={`jump-to-flagged-${idx}`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-zinc-900 truncate">
                            {field.fieldName}
                          </p>
                          <p className="text-xs text-zinc-500 truncate">{field.categoryName}</p>
                        </div>
                        <Badge
                          variant="warning"
                          className="text-xs shrink-0"
                          data-testid={`flagged-confidence-${idx}`}
                        >
                          {Math.round(field.confidence * 100)}%
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full version - expanded stats display
  return (
    <div
      className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm pb-4 transition-all duration-300"
      data-testid="sticky-extraction-stats-full"
    >
      <div className="grid grid-cols-4 gap-4">
        {/* Total Fields */}
        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <CardContent className="py-4">
            <p className="text-sm text-zinc-500">Total Fields</p>
            <p className="text-2xl font-bold text-zinc-900" data-testid="stat-total-fields">
              {stats.totalFields}
            </p>
          </CardContent>
        </Card>

        {/* Review Progress */}
        <Card
          className="animate-in fade-in slide-in-from-bottom-2 duration-300 border-indigo-200 bg-indigo-50"
          style={{ animationDelay: '50ms', animationFillMode: 'both' }}
        >
          <CardContent className="py-4">
            <p className="text-sm text-indigo-600 font-medium">Review Progress</p>
            <div className="flex items-center gap-2 mt-1">
              <Progress
                value={stats.reviewProgress}
                className="h-2.5 flex-1 bg-indigo-100 [&>div]:bg-indigo-600"
                data-testid="full-review-progress"
              />
              <span className="text-lg font-bold text-indigo-700" data-testid="stat-verified-fields">
                {stats.verifiedFields}/{stats.totalFields}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Flagged Fields with Quick Jump */}
        <Card
          className={cn(
            'animate-in fade-in slide-in-from-bottom-2 duration-300 relative',
            stats.flaggedFields > 0 && 'border-amber-200 bg-amber-50'
          )}
          style={{ animationDelay: '100ms', animationFillMode: 'both' }}
        >
          <CardContent className="py-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-zinc-500">Needs Review</p>
                <p
                  className="text-2xl font-bold text-amber-600"
                  data-testid="stat-flagged-fields"
                >
                  {stats.flaggedFields}
                </p>
              </div>
              {stats.flaggedFields > 0 && (
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleDropdown}
                    className="text-amber-700 hover:bg-amber-100"
                    data-testid="full-flagged-jump-btn"
                  >
                    <Target className="w-4 h-4 mr-1" />
                    Jump
                    {showFlaggedDropdown ? (
                      <ChevronUp className="w-3 h-3 ml-0.5" />
                    ) : (
                      <ChevronDown className="w-3 h-3 ml-0.5" />
                    )}
                  </Button>

                  {showFlaggedDropdown && (
                    <div
                      className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-zinc-200 py-1 z-30 animate-in fade-in slide-in-from-top-2 duration-200"
                      data-testid="flagged-fields-dropdown-full"
                    >
                      <div className="px-3 py-2 border-b border-zinc-100">
                        <p className="text-xs font-medium text-zinc-500 uppercase">
                          Jump to flagged field
                        </p>
                      </div>
                      <div className="max-h-48 overflow-auto">
                        {flaggedFieldsList.map((field, idx) => (
                          <button
                            key={`${field.categoryId}-${field.fieldIndex}`}
                            onClick={() => handleJumpToFlagged(field.categoryId, field.fieldIndex)}
                            className="w-full px-3 py-2 text-left hover:bg-zinc-50 flex items-center justify-between gap-2 transition-colors"
                            data-testid={`jump-to-flagged-full-${idx}`}
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-zinc-900 truncate">
                                {field.fieldName}
                              </p>
                              <p className="text-xs text-zinc-500 truncate">{field.categoryName}</p>
                            </div>
                            <Badge variant="warning" className="text-xs shrink-0">
                              {Math.round(field.confidence * 100)}%
                            </Badge>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Average Confidence */}
        <Card
          className="animate-in fade-in slide-in-from-bottom-2 duration-300"
          style={{ animationDelay: '150ms', animationFillMode: 'both' }}
        >
          <CardContent className="py-4">
            <p className="text-sm text-zinc-500">Average Confidence</p>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={stats.avgConfidence * 100} className="h-2 flex-1" />
              <span
                className="text-lg font-bold text-zinc-900"
                data-testid="stat-avg-confidence"
              >
                {Math.round(stats.avgConfidence * 100)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});
