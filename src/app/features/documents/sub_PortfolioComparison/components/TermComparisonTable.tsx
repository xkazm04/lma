'use client';

import React, { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CONFIDENCE_THRESHOLDS } from '@/app/features/documents/lib/constants';
import type { AggregatedTerm, DocumentTermValue, TermCategory } from '../lib/types';
import { TERM_CATEGORY_CONFIG } from '../lib/types';

interface TermComparisonTableProps {
  terms: AggregatedTerm[];
  onViewDocument?: (documentId: string) => void;
}

interface TermRowProps {
  term: AggregatedTerm;
  onViewDocument?: (documentId: string) => void;
}

const formatValue = (value: string | number | null, dataType: string, _termName: string): string => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value;

  if (dataType === 'currency') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
  if (dataType === 'percentage') {
    return `${value}%`;
  }
  if (dataType === 'ratio') {
    return `${value}x`;
  }
  return value.toString();
};

const getConfidenceColor = (confidence: number): string => {
  if (confidence >= CONFIDENCE_THRESHOLDS.TRUSTED) return 'text-green-600';
  if (confidence >= CONFIDENCE_THRESHOLDS.REVIEW_OPTIONAL) return 'text-amber-600';
  return 'text-red-600';
};

const TermRow = memo(function TermRow({ term, onViewDocument }: TermRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const categoryConfig = TERM_CATEGORY_CONFIG[term.termCategory];

  const getVarianceIndicator = (value: DocumentTermValue) => {
    if (term.statistics.mean === undefined || value.value === null || typeof value.value !== 'number') {
      return null;
    }
    const variance = ((value.value - term.statistics.mean) / term.statistics.mean) * 100;
    if (Math.abs(variance) < 5) {
      return <Minus className="w-3 h-3 text-zinc-400" />;
    }
    if (variance > 0) {
      return <TrendingUp className="w-3 h-3 text-green-600" />;
    }
    return <TrendingDown className="w-3 h-3 text-red-600" />;
  };

  return (
    <div className="border-b border-zinc-100 last:border-0">
      {/* Summary Row */}
      <div
        className={cn(
          'flex items-center gap-4 py-3 px-4 cursor-pointer hover:bg-zinc-50 transition-colors',
          term.hasOutliers && 'bg-amber-50/50'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
        data-testid={`term-row-${term.termName.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          data-testid={`expand-term-${term.termName.replace(/\s+/g, '-').toLowerCase()}`}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-zinc-900">{term.termName}</span>
            {term.hasOutliers && (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            )}
          </div>
        </div>

        <Badge
          variant="outline"
          className={cn(categoryConfig.bgColor, categoryConfig.color, 'text-xs')}
        >
          {categoryConfig.label}
        </Badge>

        <div className="w-24 text-right">
          <span className="text-sm text-zinc-600">
            {term.statistics.count}/{term.statistics.count + term.statistics.missingCount}
          </span>
        </div>

        {term.statistics.mean !== undefined && (
          <div className="w-32 text-right">
            <span className="text-sm text-zinc-700 font-medium">
              {formatValue(term.statistics.mean, term.dataType, term.termName)}
            </span>
            <span className="text-xs text-zinc-400 ml-1">avg</span>
          </div>
        )}

        {term.statistics.min !== undefined && term.statistics.max !== undefined && (
          <div className="w-40 text-right">
            <span className="text-xs text-zinc-500">
              {formatValue(term.statistics.min, term.dataType, term.termName)} – {formatValue(term.statistics.max, term.dataType, term.termName)}
            </span>
          </div>
        )}

        {term.anomalies.length > 0 && (
          <Badge variant="secondary" className="bg-amber-100 text-amber-700">
            {term.anomalies.length} issue{term.anomalies.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Expanded Detail */}
      {isExpanded && (
        <div className="bg-zinc-50/50 px-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="pl-10">
            {/* Market Benchmark */}
            {term.marketBenchmark && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-2">
                  Market Benchmark
                </p>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600">Min:</span>{' '}
                    <span className="font-medium">{formatValue(term.marketBenchmark.marketMin, term.dataType, term.termName)}</span>
                  </div>
                  <div>
                    <span className="text-blue-600">Max:</span>{' '}
                    <span className="font-medium">{formatValue(term.marketBenchmark.marketMax, term.dataType, term.termName)}</span>
                  </div>
                  <div>
                    <span className="text-blue-600">Median:</span>{' '}
                    <span className="font-medium">{formatValue(term.marketBenchmark.marketMedian, term.dataType, term.termName)}</span>
                  </div>
                  <div>
                    <span className="text-blue-600">Sample:</span>{' '}
                    <span className="font-medium">{term.marketBenchmark.sampleSize.toLocaleString()} deals</span>
                  </div>
                </div>
              </div>
            )}

            {/* Values Table */}
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-500 border-b border-zinc-200">
                  <th className="pb-2 font-medium">Document</th>
                  <th className="pb-2 font-medium text-right">Value</th>
                  <th className="pb-2 font-medium text-right w-24">Confidence</th>
                  <th className="pb-2 font-medium text-right w-20">Variance</th>
                  <th className="pb-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {term.values.map((docValue, index) => {
                  const hasAnomaly = term.anomalies.some(
                    (a) => a.documentId === docValue.documentId
                  );
                  return (
                    <tr
                      key={docValue.documentId}
                      className={cn(
                        'border-b border-zinc-100 last:border-0',
                        hasAnomaly && 'bg-amber-50/50'
                      )}
                      data-testid={`term-value-${term.termName.replace(/\s+/g, '-').toLowerCase()}-${index}`}
                    >
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-zinc-400" />
                          <span className="truncate max-w-[250px]">{docValue.documentName}</span>
                          {hasAnomaly && (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          )}
                        </div>
                      </td>
                      <td className="py-2 text-right font-medium">
                        {formatValue(docValue.value, term.dataType, term.termName)}
                      </td>
                      <td className="py-2 text-right">
                        <span className={getConfidenceColor(docValue.confidence)}>
                          {docValue.confidence > 0 ? `${(docValue.confidence * 100).toFixed(0)}%` : '—'}
                        </span>
                      </td>
                      <td className="py-2 text-right">
                        {getVarianceIndicator(docValue)}
                      </td>
                      <td className="py-2 text-right">
                        {onViewDocument && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewDocument(docValue.documentId);
                            }}
                            data-testid={`view-doc-${docValue.documentId}`}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Statistics */}
            {(term.statistics.stdDev !== undefined || term.statistics.mode !== undefined) && (
              <div className="mt-3 pt-3 border-t border-zinc-200 flex gap-6 text-xs text-zinc-500">
                {term.statistics.stdDev !== undefined && (
                  <span>
                    Std Dev: <span className="font-medium text-zinc-700">{formatValue(term.statistics.stdDev, term.dataType, term.termName)}</span>
                  </span>
                )}
                {term.statistics.mode !== undefined && (
                  <span>
                    Mode: <span className="font-medium text-zinc-700">{term.statistics.mode}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export const TermComparisonTable = memo(function TermComparisonTable({
  terms,
  onViewDocument,
}: TermComparisonTableProps) {
  // Group terms by category
  const termsByCategory = terms.reduce((acc, term) => {
    if (!acc[term.termCategory]) {
      acc[term.termCategory] = [];
    }
    acc[term.termCategory].push(term);
    return acc;
  }, {} as Record<TermCategory, AggregatedTerm[]>);

  const categories = Object.keys(termsByCategory) as TermCategory[];

  return (
    <Card data-testid="term-comparison-table">
      <CardHeader>
        <CardTitle className="text-lg">Term Comparison Across Portfolio</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {categories.map((category) => {
          const categoryConfig = TERM_CATEGORY_CONFIG[category];
          const categoryTerms = termsByCategory[category];
          const anomalyCount = categoryTerms.reduce((sum, t) => sum + t.anomalies.length, 0);

          return (
            <div key={category} className="border-b border-zinc-200 last:border-0">
              {/* Category Header */}
              <div className={cn('px-4 py-3 flex items-center justify-between', categoryConfig.bgColor)}>
                <div className="flex items-center gap-2">
                  <h3 className={cn('font-semibold', categoryConfig.color)}>
                    {categoryConfig.label}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {categoryTerms.length} terms
                  </Badge>
                </div>
                {anomalyCount > 0 && (
                  <Badge className="bg-amber-500">
                    {anomalyCount} anomal{anomalyCount !== 1 ? 'ies' : 'y'}
                  </Badge>
                )}
              </div>

              {/* Terms */}
              {categoryTerms.map((term) => (
                <TermRow
                  key={term.termName}
                  term={term}
                  onViewDocument={onViewDocument}
                />
              ))}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
});
