'use client';

import React, { useState, useMemo } from 'react';
import { AlertTriangle, CheckCircle, TrendingDown, TrendingUp, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { TermGroundAnalysis, TermCategory } from '../lib/types';
import { getCategoryLabel, getDeltaColor } from '../lib/mock-data';

interface TermGroundAnalysisTableProps {
  termAnalysis: TermGroundAnalysis[];
}

type SortField = 'termLabel' | 'variance' | 'successRate' | 'totalNegotiations';
type SortDirection = 'asc' | 'desc';

export function TermGroundAnalysisTable({ termAnalysis }: TermGroundAnalysisTableProps) {
  const [sortField, setSortField] = useState<SortField>('variance');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterCategory, setFilterCategory] = useState<TermCategory | 'all'>('all');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedTerms = useMemo(() => {
    let filtered = termAnalysis;
    if (filterCategory !== 'all') {
      filtered = termAnalysis.filter((t) => t.termCategory === filterCategory);
    }

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'termLabel':
          comparison = a.termLabel.localeCompare(b.termLabel);
          break;
        case 'variance':
          comparison = Math.abs(b.variance) - Math.abs(a.variance);
          break;
        case 'successRate':
          comparison = b.successRate - a.successRate;
          break;
        case 'totalNegotiations':
          comparison = b.totalNegotiations - a.totalNegotiations;
          break;
      }
      return sortDirection === 'asc' ? -comparison : comparison;
    });
  }, [termAnalysis, filterCategory, sortField, sortDirection]);

  const problemTerms = useMemo(
    () => termAnalysis.filter((t) => t.consistentlyGivesGround),
    [termAnalysis]
  );

  const strongTerms = useMemo(
    () => termAnalysis.filter((t) => !t.consistentlyGivesGround && t.successRate >= 70),
    [termAnalysis]
  );

  const categories: (TermCategory | 'all')[] = ['all', 'pricing', 'covenants', 'structure', 'facility'];

  return (
    <Card data-testid="term-ground-analysis-table">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Terms Where You Consistently Give Ground</CardTitle>
            <CardDescription>
              Identify negotiation patterns where your outcomes differ from market average
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {problemTerms.length} Areas to Improve
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="w-3 h-3 mr-1" />
              {strongTerms.length} Strengths
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500">Filter:</span>
          <div className="flex flex-wrap gap-1">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={filterCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterCategory(cat)}
                className="text-xs"
                data-testid={`filter-${cat}`}
              >
                {cat === 'all' ? 'All Categories' : getCategoryLabel(cat)}
              </Button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200">
                <th
                  className="text-left py-3 px-2 text-xs font-medium text-zinc-500 cursor-pointer hover:text-zinc-700"
                  onClick={() => handleSort('termLabel')}
                  data-testid="sort-term-label"
                >
                  <div className="flex items-center gap-1">
                    Term
                    {sortField === 'termLabel' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
                <th className="text-left py-3 px-2 text-xs font-medium text-zinc-500">Category</th>
                <th className="text-center py-3 px-2 text-xs font-medium text-zinc-500">Your Avg</th>
                <th className="text-center py-3 px-2 text-xs font-medium text-zinc-500">Market Avg</th>
                <th
                  className="text-center py-3 px-2 text-xs font-medium text-zinc-500 cursor-pointer hover:text-zinc-700"
                  onClick={() => handleSort('variance')}
                  data-testid="sort-variance"
                >
                  <div className="flex items-center justify-center gap-1">
                    Variance
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-zinc-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Difference between your average outcome and market average. Positive = giving more ground.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {sortField === 'variance' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
                <th
                  className="text-center py-3 px-2 text-xs font-medium text-zinc-500 cursor-pointer hover:text-zinc-700"
                  onClick={() => handleSort('successRate')}
                  data-testid="sort-success-rate"
                >
                  <div className="flex items-center justify-center gap-1">
                    Success Rate
                    {sortField === 'successRate' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
                <th
                  className="text-center py-3 px-2 text-xs font-medium text-zinc-500 cursor-pointer hover:text-zinc-700"
                  onClick={() => handleSort('totalNegotiations')}
                  data-testid="sort-negotiations"
                >
                  <div className="flex items-center justify-center gap-1">
                    Deals
                    {sortField === 'totalNegotiations' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
                <th className="text-center py-3 px-2 text-xs font-medium text-zinc-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedTerms.map((term) => (
                <tr
                  key={term.termKey}
                  className={cn(
                    'border-b border-zinc-100 hover:bg-zinc-50 transition-colors',
                    term.consistentlyGivesGround && 'bg-amber-50/50'
                  )}
                  data-testid={`term-row-${term.termKey}`}
                >
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      {term.consistentlyGivesGround && (
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      <span className="text-sm font-medium text-zinc-900">{term.termLabel}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <Badge variant="outline" className="text-xs">
                      {getCategoryLabel(term.termCategory)}
                    </Badge>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className={cn('text-sm font-medium', getDeltaColor(term.avgUserDelta, term.termCategory === 'covenants'))}>
                      {term.avgUserDelta > 0 ? '+' : ''}{(term.avgUserDelta * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className="text-sm text-zinc-600">
                      {term.avgMarketDelta > 0 ? '+' : ''}{(term.avgMarketDelta * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className={cn(
                        'text-sm font-semibold',
                        term.variance > 0.05 ? 'text-red-600' : term.variance < -0.05 ? 'text-green-600' : 'text-zinc-600'
                      )}>
                        {term.variance > 0 ? '+' : ''}{(term.variance * 100).toFixed(0)}%
                      </span>
                      {term.variance > 0.05 ? (
                        <TrendingUp className="w-3 h-3 text-red-500" />
                      ) : term.variance < -0.05 ? (
                        <TrendingDown className="w-3 h-3 text-green-500" />
                      ) : null}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-2 bg-zinc-200 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            term.successRate >= 70 ? 'bg-green-500' :
                            term.successRate >= 50 ? 'bg-amber-500' : 'bg-red-500'
                          )}
                          style={{ width: `${term.successRate}%` }}
                        />
                      </div>
                      <span className="text-sm text-zinc-700">{term.successRate}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className="text-sm text-zinc-600">{term.totalNegotiations}</span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    {term.consistentlyGivesGround ? (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                        Needs Work
                      </Badge>
                    ) : term.successRate >= 70 ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                        Strong
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-zinc-50 text-zinc-600 border-zinc-200 text-xs">
                        Average
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Insights */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-100">
          {problemTerms.length > 0 && (
            <div className="p-4 bg-amber-50 rounded-lg">
              <h4 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Priority Improvement Areas
              </h4>
              <ul className="space-y-1">
                {problemTerms.slice(0, 3).map((term) => (
                  <li key={term.termKey} className="text-sm text-amber-700">
                    • {term.termLabel}: {(Math.abs(term.variance) * 100).toFixed(0)}% worse than market
                  </li>
                ))}
              </ul>
            </div>
          )}
          {strongTerms.length > 0 && (
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Your Negotiation Strengths
              </h4>
              <ul className="space-y-1">
                {strongTerms.slice(0, 3).map((term) => (
                  <li key={term.termKey} className="text-sm text-green-700">
                    • {term.termLabel}: {term.successRate}% success rate
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
