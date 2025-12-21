'use client';

import React, { memo } from 'react';
import { format } from 'date-fns';
import {
  GitCompare,
  ArrowRight,
  Plus,
  Minus,
  Edit2,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ComparisonDiff, ComparisonHistoryEntryWithDetails } from '../lib/history-types';

interface ComparisonDiffViewProps {
  diff: ComparisonDiff;
  entry1: ComparisonHistoryEntryWithDetails;
  entry2: ComparisonHistoryEntryWithDetails;
  onClose: () => void;
  isLoading?: boolean;
}

export const ComparisonDiffView = memo(function ComparisonDiffView({
  diff,
  entry1,
  entry2,
  onClose,
  isLoading = false,
}: ComparisonDiffViewProps) {
  const formatDate = (dateStr: string) => format(new Date(dateStr), 'MMM d, yyyy h:mm a');

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300" data-testid="comparison-diff-view">
      {/* Header */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-purple-600" />
              Comparing Comparison Results
            </CardTitle>
            <Button variant="outline" size="sm" onClick={onClose} data-testid="close-diff-view">
              Close
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex-1">
              <div className="font-medium text-purple-900">
                {entry1.label || formatDate(entry1.comparedAt)}
              </div>
              <div className="text-purple-700 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(entry1.comparedAt)}
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-purple-400" />
            <div className="flex-1 text-right">
              <div className="font-medium text-purple-900">
                {entry2.label || formatDate(entry2.comparedAt)}
              </div>
              <div className="text-purple-700 flex items-center gap-1 justify-end">
                <Clock className="w-3 h-3" />
                {formatDate(entry2.comparedAt)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-zinc-400" />
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-green-50 border-green-200" data-testid="diff-new-changes">
              <CardContent className="py-4 text-center">
                <div className="text-2xl font-bold text-green-700">
                  {diff.summary.newChangesCount}
                </div>
                <div className="text-sm text-green-600 flex items-center justify-center gap-1">
                  <Plus className="w-4 h-4" />
                  New Changes
                </div>
                <div className="text-xs text-green-500 mt-1">
                  Changes found in later comparison only
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200" data-testid="diff-evolved-changes">
              <CardContent className="py-4 text-center">
                <div className="text-2xl font-bold text-blue-700">
                  {diff.summary.evolvedChangesCount}
                </div>
                <div className="text-sm text-blue-600 flex items-center justify-center gap-1">
                  <RefreshCw className="w-4 h-4" />
                  Evolved Changes
                </div>
                <div className="text-xs text-blue-500 mt-1">
                  Changes that modified between comparisons
                </div>
              </CardContent>
            </Card>

            <Card className="bg-amber-50 border-amber-200" data-testid="diff-resolved-changes">
              <CardContent className="py-4 text-center">
                <div className="text-2xl font-bold text-amber-700">
                  {diff.summary.resolvedChangesCount}
                </div>
                <div className="text-sm text-amber-600 flex items-center justify-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Resolved Changes
                </div>
                <div className="text-xs text-amber-500 mt-1">
                  Changes present earlier, now resolved
                </div>
              </CardContent>
            </Card>
          </div>

          {/* New changes section */}
          {diff.onlyInComparison2.length > 0 && (
            <Card data-testid="diff-new-section">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-green-700">
                  <Plus className="w-4 h-4" />
                  New Changes ({diff.onlyInComparison2.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {diff.onlyInComparison2.map((change, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 px-3 bg-green-50 rounded-md"
                    >
                      <div>
                        <span className="text-sm font-medium text-zinc-900">
                          {change.field}
                        </span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {change.category}
                        </Badge>
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-xs',
                          change.changeType === 'added' && 'bg-green-100 text-green-700',
                          change.changeType === 'modified' && 'bg-blue-100 text-blue-700',
                          change.changeType === 'removed' && 'bg-red-100 text-red-700'
                        )}
                      >
                        {change.changeType}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Evolved changes section */}
          {diff.changedBetweenComparisons.length > 0 && (
            <Card data-testid="diff-evolved-section">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-blue-700">
                  <RefreshCw className="w-4 h-4" />
                  Evolved Changes ({diff.changedBetweenComparisons.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {diff.changedBetweenComparisons.map((change, i) => (
                    <div
                      key={i}
                      className="py-3 px-3 bg-blue-50 rounded-md"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-zinc-900">
                          {change.field}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {change.category}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-white p-2 rounded">
                          <div className="text-xs text-zinc-500 mb-1">Earlier Comparison</div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className={cn(
                                'text-xs',
                                change.inComparison1.changeType === 'added' && 'bg-green-100 text-green-700',
                                change.inComparison1.changeType === 'modified' && 'bg-blue-100 text-blue-700',
                                change.inComparison1.changeType === 'removed' && 'bg-red-100 text-red-700'
                              )}
                            >
                              {change.inComparison1.changeType}
                            </Badge>
                            <span className="text-zinc-600 truncate">
                              {String(change.inComparison1.doc1Value || '-')} → {String(change.inComparison1.doc2Value || '-')}
                            </span>
                          </div>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <div className="text-xs text-zinc-500 mb-1">Later Comparison</div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className={cn(
                                'text-xs',
                                change.inComparison2.changeType === 'added' && 'bg-green-100 text-green-700',
                                change.inComparison2.changeType === 'modified' && 'bg-blue-100 text-blue-700',
                                change.inComparison2.changeType === 'removed' && 'bg-red-100 text-red-700'
                              )}
                            >
                              {change.inComparison2.changeType}
                            </Badge>
                            <span className="text-zinc-600 truncate">
                              {String(change.inComparison2.doc1Value || '-')} → {String(change.inComparison2.doc2Value || '-')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resolved changes section */}
          {diff.onlyInComparison1.length > 0 && (
            <Card data-testid="diff-resolved-section">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-amber-700">
                  <CheckCircle className="w-4 h-4" />
                  Resolved Changes ({diff.onlyInComparison1.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {diff.onlyInComparison1.map((change, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 px-3 bg-amber-50 rounded-md"
                    >
                      <div>
                        <span className="text-sm font-medium text-zinc-900 line-through opacity-70">
                          {change.field}
                        </span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {change.category}
                        </Badge>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-xs bg-amber-100 text-amber-700"
                      >
                        resolved
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No changes */}
          {diff.summary.newChangesCount === 0 &&
            diff.summary.evolvedChangesCount === 0 &&
            diff.summary.resolvedChangesCount === 0 && (
              <Card className="bg-zinc-50" data-testid="diff-no-changes">
                <CardContent className="py-8 text-center">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-500" />
                  <p className="text-zinc-600">No differences found between these comparisons</p>
                  <p className="text-sm text-zinc-400 mt-1">
                    Both comparisons detected the same changes
                  </p>
                </CardContent>
              </Card>
            )}
        </>
      )}
    </div>
  );
});
