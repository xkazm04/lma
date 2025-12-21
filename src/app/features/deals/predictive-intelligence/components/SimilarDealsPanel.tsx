'use client';

import React from 'react';
import {
  GitCompare,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SimilarDeal {
  dealId: string;
  dealName: string;
  similarity: number;
  outcome: string;
  closingDays: number;
}

interface SimilarDealsPanelProps {
  similarDeals: SimilarDeal[];
  avgMetrics: {
    closingDays: number;
    rounds: number;
    successRate: number;
  };
  onViewDeal?: (dealId: string) => void;
}

export function SimilarDealsPanel({
  similarDeals,
  avgMetrics,
  onViewDeal,
}: SimilarDealsPanelProps) {
  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.8) return 'text-green-600 bg-green-50';
    if (similarity >= 0.6) return 'text-blue-600 bg-blue-50';
    return 'text-zinc-600 bg-zinc-50';
  };

  return (
    <Card data-testid="similar-deals-panel">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-indigo-500" />
            Similar Historical Deals
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {similarDeals.length} matches
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Aggregate Stats */}
        <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
          <div className="text-center">
            <p className="text-xs text-indigo-600 mb-0.5">Avg Close Time</p>
            <p className="text-lg font-semibold text-indigo-900">
              {avgMetrics.closingDays} days
            </p>
          </div>
          <div className="text-center border-x border-indigo-100">
            <p className="text-xs text-indigo-600 mb-0.5">Avg Rounds</p>
            <p className="text-lg font-semibold text-indigo-900">
              {avgMetrics.rounds}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-indigo-600 mb-0.5">Success Rate</p>
            <p className="text-lg font-semibold text-green-600">
              {Math.round(avgMetrics.successRate * 100)}%
            </p>
          </div>
        </div>

        {/* Deal List */}
        <div className="space-y-2">
          {similarDeals.map((deal) => (
            <div
              key={deal.dealId}
              className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 transition-colors"
              data-testid={`similar-deal-${deal.dealId}`}
            >
              <div className="flex items-center gap-3">
                {/* Outcome Icon */}
                {deal.outcome === 'closed' ? (
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                    <XCircle className="w-4 h-4 text-red-600" />
                  </div>
                )}

                {/* Deal Info */}
                <div>
                  <p className="font-medium text-sm text-zinc-900">{deal.dealName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge
                      variant="outline"
                      className={cn('text-xs', getSimilarityColor(deal.similarity))}
                    >
                      {Math.round(deal.similarity * 100)}% match
                    </Badge>
                    {deal.outcome === 'closed' && deal.closingDays > 0 && (
                      <span className="text-xs text-zinc-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {deal.closingDays} days
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* View Button */}
              {onViewDeal && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewDeal(deal.dealId)}
                  data-testid={`view-deal-${deal.dealId}`}
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Insight */}
        <div className="p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">Pattern Insight</p>
              <p className="text-xs text-green-700 mt-0.5">
                {avgMetrics.successRate >= 0.75
                  ? 'Historically similar deals have a strong success rate. Focus on proven strategies.'
                  : 'Some similar deals faced challenges. Pay extra attention to identified sticking points.'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
