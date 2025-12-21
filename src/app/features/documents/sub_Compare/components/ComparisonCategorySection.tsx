'use client';

import React, { memo, useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, BarChart3, TrendingUp, TrendingDown, Minus, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChangeIcon, ChangeBadge } from './ChangeIcon';
import { ChangeAnnotationButton, AnnotationSummaryBadge } from './ChangeAnnotationButton';
import { getInlineDiffPair } from './InlineDiff';
import { RiskScoreBadge } from './RiskScoreBadge';
import { MarketBenchmarkBadge } from './MarketBenchmark';
import type { ComparisonCategory, ComparisonChange, ChangeRiskScore, ChangeMarketBenchmark, CategoryRiskSummary } from '../../lib/types';
import type { Annotation } from '../lib/types';
import { createChangeId } from '../lib/mock-data';

interface ComparisonCategorySectionProps {
  category: ComparisonCategory;
  index?: number;
  // Document name labels
  doc1Name?: string;
  doc2Name?: string;
  // Annotation props
  getAnnotation?: (changeId: string) => Annotation | undefined;
  onAnnotationClick?: (change: ComparisonChange, changeId: string) => void;
  // Risk scoring props
  getRiskScore?: (changeId: string) => ChangeRiskScore | undefined;
  getMarketBenchmark?: (changeId: string) => ChangeMarketBenchmark | undefined;
  categorySummary?: CategoryRiskSummary;
}

export const ComparisonCategorySection = memo(function ComparisonCategorySection({
  category,
  index = 0,
  doc1Name = 'Document 1',
  doc2Name = 'Document 2',
  getAnnotation,
  onAnnotationClick,
  getRiskScore,
  getMarketBenchmark,
  categorySummary,
}: ComparisonCategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Get annotations for this category for the summary
  const categoryAnnotations: Annotation[] = [];
  if (getAnnotation) {
    category.changes.forEach((change) => {
      const changeId = createChangeId(category.category, change.field);
      const annotation = getAnnotation(changeId);
      if (annotation) {
        categoryAnnotations.push(annotation);
      }
    });
  }

  return (
    <Card
      className="animate-in fade-in slide-in-from-bottom-2 transition-all duration-200 hover:shadow-sm"
      style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'both' }}
      data-testid={`comparison-category-${category.category.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <CardHeader
        className="cursor-pointer py-4 transition-colors hover:bg-zinc-50/50"
        onClick={() => setIsExpanded(!isExpanded)}
        data-testid="category-header"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="transition-transform duration-200">
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-zinc-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-zinc-400" />
              )}
            </span>
            <CardTitle className="text-lg">{category.category}</CardTitle>
            <Badge variant="secondary">{category.changes.length} changes</Badge>
            {/* Category risk summary badge */}
            {categorySummary && (
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs',
                  categorySummary.averageSeverityScore <= 3 && 'bg-green-100 text-green-700',
                  categorySummary.averageSeverityScore > 3 &&
                    categorySummary.averageSeverityScore <= 5 &&
                    'bg-amber-100 text-amber-700',
                  categorySummary.averageSeverityScore > 5 &&
                    categorySummary.averageSeverityScore <= 7 &&
                    'bg-orange-100 text-orange-700',
                  categorySummary.averageSeverityScore > 7 && 'bg-red-100 text-red-700'
                )}
                data-testid="category-risk-badge"
              >
                Risk: {categorySummary.averageSeverityScore.toFixed(1)}
              </Badge>
            )}
            {/* Lens-based party summary badge */}
            {categorySummary && (categorySummary.borrowerFavoredCount > 0 || categorySummary.lenderFavoredCount > 0) && (
              <Badge
                variant="secondary"
                className="text-xs bg-zinc-100 text-zinc-700 flex items-center gap-1"
                data-testid="category-party-summary-badge"
              >
                <Users className="w-3 h-3" />
                {categorySummary.borrowerFavoredCount > 0 && (
                  <span className="flex items-center text-blue-600">
                    <TrendingUp className="w-3 h-3" />
                    {categorySummary.borrowerFavoredCount}
                  </span>
                )}
                {categorySummary.lenderFavoredCount > 0 && (
                  <span className="flex items-center text-purple-600 ml-1">
                    <TrendingDown className="w-3 h-3" />
                    {categorySummary.lenderFavoredCount}
                  </span>
                )}
                {categorySummary.neutralCount > 0 && (
                  <span className="flex items-center text-zinc-500 ml-1">
                    <Minus className="w-3 h-3" />
                    {categorySummary.neutralCount}
                  </span>
                )}
              </Badge>
            )}
            {/* Annotation summary for the category */}
            <AnnotationSummaryBadge annotations={categoryAnnotations} />
          </div>
        </div>
      </CardHeader>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <CardContent className="pt-0">
          <div className="space-y-3">
            {category.changes.map((change, i) => {
              const changeId = createChangeId(category.category, change.field);
              const annotation = getAnnotation?.(changeId) || null;
              const riskScore = getRiskScore?.(changeId);
              const marketBenchmark = getMarketBenchmark?.(changeId);

              return (
                <div
                  key={i}
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-lg border transition-all duration-200 hover:shadow-sm',
                    change.changeType === 'added' && 'border-green-200 bg-green-50',
                    change.changeType === 'removed' && 'border-red-200 bg-red-50',
                    change.changeType === 'modified' && 'border-blue-200 bg-blue-50'
                  )}
                  data-testid={`change-item-${changeId}`}
                >
                  <ChangeIcon type={change.changeType} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-zinc-900">{change.field}</span>
                      <div className="flex items-center gap-2">
                        {/* Risk Score Badge */}
                        {riskScore && (
                          <RiskScoreBadge
                            score={riskScore.severityScore}
                            severity={riskScore.severity}
                            favoredParty={riskScore.favoredParty}
                            deviatesFromMarket={riskScore.deviatesFromMarket}
                            riskAnalysis={riskScore.riskAnalysis}
                            size="sm"
                          />
                        )}
                        {/* Market Benchmark Badge */}
                        {marketBenchmark && (
                          <MarketBenchmarkBadge benchmark={marketBenchmark} compact />
                        )}
                        {/* Annotation button */}
                        {onAnnotationClick && (
                          <ChangeAnnotationButton
                            annotation={annotation}
                            onClick={() => onAnnotationClick(change, changeId)}
                          />
                        )}
                        <ChangeBadge type={change.changeType} />
                      </div>
                    </div>

                    <div
                      className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2"
                      data-testid={`comparison-values-grid-${changeId}`}
                    >
                      {(() => {
                        const { oldDisplay, newDisplay } = getInlineDiffPair({
                          oldText: change.doc1Value,
                          newText: change.doc2Value,
                          isModified: change.changeType === 'modified',
                          placeholder: 'Not present',
                          testId: `diff-${changeId}`,
                        });
                        return (
                          <>
                            <div
                              className="max-w-full"
                              data-testid={`doc1-value-${changeId}`}
                            >
                              <p className="text-xs text-zinc-500 mb-1" data-testid={`doc1-label-${changeId}`}>{doc1Name}</p>
                              <p
                                className={cn(
                                  'text-sm p-2 rounded bg-white border break-words overflow-wrap-anywhere max-w-full',
                                  change.changeType === 'removed' && 'border-red-200'
                                )}
                              >
                                {oldDisplay}
                              </p>
                            </div>
                            {/* Visual separator for mobile (visible only on small screens) */}
                            <div
                              className="md:hidden h-px bg-zinc-200 my-1"
                              aria-hidden="true"
                              data-testid={`mobile-separator-${changeId}`}
                            />
                            <div
                              className="max-w-full"
                              data-testid={`doc2-value-${changeId}`}
                            >
                              <p className="text-xs text-zinc-500 mb-1" data-testid={`doc2-label-${changeId}`}>{doc2Name}</p>
                              <p
                                className={cn(
                                  'text-sm p-2 rounded bg-white border break-words overflow-wrap-anywhere max-w-full',
                                  change.changeType === 'added' && 'border-green-200'
                                )}
                              >
                                {newDisplay}
                              </p>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* Risk Analysis (if available) */}
                    {riskScore && (
                      <div className="mb-2 p-2 bg-white/70 rounded border border-zinc-200 text-xs text-zinc-600">
                        <div className="flex items-start gap-2">
                          <BarChart3 className="w-3 h-3 mt-0.5 text-zinc-400 flex-shrink-0" />
                          <span>{riskScore.riskAnalysis}</span>
                        </div>
                      </div>
                    )}

                    <p className="text-sm text-zinc-600 flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3" />
                      {change.impact}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </div>
    </Card>
  );
});
