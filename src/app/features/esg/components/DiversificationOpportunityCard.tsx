'use client';

import React, { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, TrendingUp, Shield, ChevronDown, ChevronUp, ArrowRight, DollarSign } from 'lucide-react';
import type { DiversificationOpportunity } from '../lib';
import { formatCurrency } from '../lib';

interface DiversificationOpportunityCardProps {
  data: DiversificationOpportunity[];
  title?: string;
  description?: string;
  onViewOpportunity?: (opportunityId: string) => void;
}

function getPriorityBadgeVariant(priority: string): 'default' | 'secondary' | 'destructive' {
  switch (priority) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'secondary';
    default:
      return 'default';
  }
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case 'sector':
      return 'Sector';
    case 'loan_type':
      return 'Loan Type';
    case 'geography':
      return 'Geography';
    case 'esg_theme':
      return 'ESG Theme';
    default:
      return category;
  }
}

export const DiversificationOpportunityCard = memo(function DiversificationOpportunityCard({
  data,
  title = 'Diversification Opportunities',
  description = 'Recommended portfolio adjustments for better ESG alignment',
  onViewOpportunity,
}: DiversificationOpportunityCardProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500" data-testid="diversification-opportunity-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-600" />
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((opportunity) => {
            const isExpanded = expandedId === opportunity.id;

            return (
              <div
                key={opportunity.id}
                className="rounded-lg border border-zinc-200 overflow-hidden transition-all hover:border-zinc-300"
                data-testid={`opportunity-item-${opportunity.id}`}
              >
                {/* Header */}
                <div
                  className="flex items-center justify-between p-4 bg-zinc-50 cursor-pointer"
                  onClick={() => toggleExpanded(opportunity.id)}
                  data-testid={`opportunity-toggle-${opportunity.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-zinc-900">{opportunity.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {getCategoryLabel(opportunity.category)}
                        </Badge>
                        <Badge variant={getPriorityBadgeVariant(opportunity.priority)} className="text-xs">
                          {opportunity.priority} priority
                        </Badge>
                      </div>
                      <p className="text-sm text-zinc-500 mt-1">{opportunity.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-zinc-500">Gap Amount</div>
                      <div className="font-semibold text-zinc-900">{formatCurrency(opportunity.gap_amount)}</div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-zinc-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="p-4 border-t border-zinc-200 bg-white">
                    {/* Allocation Gap */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-6">
                        <div>
                          <div className="text-xs text-zinc-500">Current</div>
                          <div className="text-lg font-bold text-zinc-900">{opportunity.current_exposure_pct.toFixed(1)}%</div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-zinc-400" />
                        <div>
                          <div className="text-xs text-zinc-500">Target</div>
                          <div className="text-lg font-bold text-green-600">{opportunity.target_exposure_pct.toFixed(1)}%</div>
                        </div>
                      </div>
                    </div>

                    {/* Expected Impact */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="p-3 rounded-lg bg-green-50">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-green-700">ESG Score</span>
                        </div>
                        <div className="text-lg font-bold text-green-700">
                          +{opportunity.expected_portfolio_impact.esg_score_improvement.toFixed(1)}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-blue-50">
                        <div className="flex items-center gap-2 mb-1">
                          <Shield className="w-4 h-4 text-blue-600" />
                          <span className="text-xs text-blue-700">Risk Reduction</span>
                        </div>
                        <div className="text-lg font-bold text-blue-700">
                          {opportunity.expected_portfolio_impact.risk_reduction_pct.toFixed(1)}%
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-purple-50">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="w-4 h-4 text-purple-600" />
                          <span className="text-xs text-purple-700">Yield Impact</span>
                        </div>
                        <div className="text-lg font-bold text-purple-700">
                          {opportunity.expected_portfolio_impact.yield_impact_bps}bps
                        </div>
                      </div>
                    </div>

                    {/* Potential Facilities */}
                    {opportunity.potential_facilities.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-zinc-700 mb-2">
                          Matching Syndication Opportunities ({opportunity.potential_facilities.length})
                        </h5>
                        <div className="space-y-2">
                          {opportunity.potential_facilities.slice(0, 2).map((facility) => (
                            <div
                              key={facility.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-zinc-50"
                              data-testid={`facility-match-${facility.id}`}
                            >
                              <div>
                                <div className="font-medium text-zinc-900">{facility.facility_name}</div>
                                <div className="text-xs text-zinc-500">{facility.borrower_name}</div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <div className="text-sm font-semibold text-zinc-900">
                                    {formatCurrency(facility.available_participation)}
                                  </div>
                                  <div className="text-xs text-zinc-500">ESG: {facility.esg_score}</div>
                                </div>
                                <Badge className="bg-indigo-100 text-indigo-700">
                                  {facility.match_score}% match
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    {onViewOpportunity && (
                      <div className="mt-4 pt-4 border-t border-zinc-200">
                        <Button
                          variant="outline"
                          onClick={() => onViewOpportunity(opportunity.id)}
                          data-testid={`view-opportunity-btn-${opportunity.id}`}
                        >
                          View Details
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});
