'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { ArrowUpDown, ChevronDown, ChevronUp, Building2, TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DealBenchmarkComparison } from '../lib/types';
import { formatCurrency, getPositionColor, getPositionBgColor } from '../lib/mock-data';

interface DealComparisonTableProps {
  currentDeal: DealBenchmarkComparison;
  peerDeals: DealBenchmarkComparison[];
  onDealClick?: (dealId: string) => void;
}

type SortField = 'dealName' | 'facilitySize' | 'margin' | 'leverage' | 'score';
type SortDirection = 'asc' | 'desc';

const borrowerProfileLabels: Record<string, string> = {
  investment_grade: 'IG',
  leveraged: 'Lev',
  middle_market: 'MM',
  distressed: 'Dist',
  sponsor_backed: 'Sponsor',
};

const dealTypeLabels: Record<string, string> = {
  new_facility: 'New',
  amendment: 'Amend',
  refinancing: 'Refi',
  extension: 'Ext',
  consent: 'Consent',
  waiver: 'Waiver',
};

// Moved outside component to avoid re-creation during render
function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <TrendingUp className="w-3.5 h-3.5 text-amber-500" />;
  if (trend === 'down') return <TrendingDown className="w-3.5 h-3.5 text-green-500" />;
  return <Minus className="w-3.5 h-3.5 text-zinc-400" />;
}

interface SortHeaderProps {
  field: SortField;
  label: string;
  className?: string;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

function SortHeader({ field, label, className, sortField, sortDirection, onSort }: SortHeaderProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('h-8 px-2 font-medium', className)}
      onClick={() => onSort(field)}
      data-testid={`sort-header-${field}`}
    >
      {label}
      {sortField === field ? (
        sortDirection === 'asc' ? (
          <ChevronUp className="w-3.5 h-3.5 ml-1" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 ml-1" />
        )
      ) : (
        <ArrowUpDown className="w-3.5 h-3.5 ml-1 opacity-50" />
      )}
    </Button>
  );
}

export function DealComparisonTable({ currentDeal, peerDeals, onDealClick }: DealComparisonTableProps) {
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showDetails, setShowDetails] = useState<string | null>(null);

  const allDeals = useMemo(() => [currentDeal, ...peerDeals], [currentDeal, peerDeals]);

  const sortedDeals = useMemo(() => {
    return [...allDeals].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortField) {
        case 'dealName':
          aValue = a.dealName.toLowerCase();
          bValue = b.dealName.toLowerCase();
          break;
        case 'facilitySize':
          aValue = a.facilitySize;
          bValue = b.facilitySize;
          break;
        case 'margin':
          aValue = a.margin.current;
          bValue = b.margin.current;
          break;
        case 'leverage':
          aValue = a.covenants.find((c) => c.type === 'leverage')?.current || 0;
          bValue = b.covenants.find((c) => c.type === 'leverage')?.current || 0;
          break;
        case 'score':
          aValue = a.overallScore;
          bValue = b.overallScore;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }

      return sortDirection === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
    });
  }, [allDeals, sortField, sortDirection]);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }, [sortField]);

  return (
    <Card data-testid="deal-comparison-table">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Peer Deal Comparison
        </CardTitle>
        <CardDescription>Compare your deal terms against similar market transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200">
                <th className="text-left py-2">
                  <SortHeader field="dealName" label="Deal" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                </th>
                <th className="text-left py-2">Type</th>
                <th className="text-right py-2">
                  <SortHeader field="facilitySize" label="Size" className="justify-end" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                </th>
                <th className="text-right py-2">
                  <SortHeader field="margin" label="Margin" className="justify-end" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                </th>
                <th className="text-right py-2">
                  <SortHeader field="leverage" label="Leverage" className="justify-end" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                </th>
                <th className="text-right py-2">
                  <SortHeader field="score" label="Score" className="justify-end" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                </th>
                <th className="text-center py-2">Position</th>
              </tr>
            </thead>
            <tbody>
              {sortedDeals.map((deal) => {
                const isCurrentDeal = deal.dealId === currentDeal.dealId;
                const leverage = deal.covenants.find((c) => c.type === 'leverage');

                return (
                  <React.Fragment key={deal.dealId}>
                    <tr
                      className={cn(
                        'border-b border-zinc-100 transition-colors cursor-pointer',
                        isCurrentDeal && 'bg-blue-50',
                        !isCurrentDeal && 'hover:bg-zinc-50'
                      )}
                      onClick={() => setShowDetails(showDetails === deal.dealId ? null : deal.dealId)}
                      data-testid={`deal-row-${deal.dealId}`}
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          {isCurrentDeal && (
                            <Badge variant="info" className="text-xs">
                              Your Deal
                            </Badge>
                          )}
                          <div>
                            <p className={cn('font-medium', isCurrentDeal && 'text-blue-700')}>
                              {deal.dealName}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {borrowerProfileLabels[deal.borrowerProfile]} · {deal.industry}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge variant="outline" className="text-xs">
                          {dealTypeLabels[deal.dealType]}
                        </Badge>
                      </td>
                      <td className="py-3 text-right font-medium">
                        {formatCurrency(deal.facilitySize, true)}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <TrendIcon trend={deal.margin.trend} />
                          <span className="font-medium">{deal.margin.current}%</span>
                        </div>
                        <p className="text-xs text-zinc-500">Mkt: {deal.margin.marketMedian}%</p>
                      </td>
                      <td className="py-3 text-right">
                        <span className="font-medium">{leverage?.current || '-'}x</span>
                        <p className="text-xs text-zinc-500">Mkt: {leverage?.marketMedian || '-'}x</p>
                      </td>
                      <td className="py-3 text-right">
                        <div
                          className={cn(
                            'inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm',
                            deal.overallScore >= 70 && 'bg-green-100 text-green-700',
                            deal.overallScore >= 50 && deal.overallScore < 70 && 'bg-blue-100 text-blue-700',
                            deal.overallScore < 50 && 'bg-amber-100 text-amber-700'
                          )}
                          data-testid={`deal-score-${deal.dealId}`}
                        >
                          {deal.overallScore}
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            getPositionBgColor(deal.marketPosition),
                            getPositionColor(deal.marketPosition)
                          )}
                        >
                          {deal.marketPosition === 'favorable'
                            ? 'Favorable'
                            : deal.marketPosition === 'aggressive'
                              ? 'Aggressive'
                              : 'At Market'}
                        </Badge>
                      </td>
                    </tr>

                    {/* Expanded details row */}
                    {showDetails === deal.dealId && (
                      <tr className="bg-zinc-50">
                        <td colSpan={7} className="py-4 px-6">
                          <div className="grid grid-cols-3 gap-6">
                            {/* Covenants */}
                            <div>
                              <h4 className="text-sm font-medium text-zinc-700 mb-2">Covenants</h4>
                              <div className="space-y-2">
                                {deal.covenants.map((cov) => (
                                  <div key={cov.type} className="flex justify-between text-sm">
                                    <span className="text-zinc-500">{cov.label}</span>
                                    <span className="font-medium">
                                      {cov.unit === '$' ? formatCurrency(cov.current, true) : `${cov.current}${cov.unit}`}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Structure Terms */}
                            <div>
                              <h4 className="text-sm font-medium text-zinc-700 mb-2">Key Structure Terms</h4>
                              <div className="space-y-2">
                                {deal.structureTerms.slice(0, 3).map((term) => (
                                  <div key={term.term} className="text-sm">
                                    <span className="text-zinc-500">{term.label}:</span>
                                    <span className="ml-1 font-medium">{term.currentValue}</span>
                                  </div>
                                ))}
                                {deal.structureTerms.length === 0 && (
                                  <p className="text-sm text-zinc-400">No structure terms available</p>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-end justify-end">
                              {!isCurrentDeal && onDealClick && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDealClick(deal.dealId);
                                  }}
                                  data-testid={`view-deal-btn-${deal.dealId}`}
                                >
                                  <ExternalLink className="w-4 h-4 mr-1" />
                                  View Details
                                </Button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-zinc-200 flex items-center gap-6 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-medium">70+</div>
            <span>Favorable terms</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">50+</div>
            <span>At market</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-medium">&lt;50</div>
            <span>Aggressive pricing</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
