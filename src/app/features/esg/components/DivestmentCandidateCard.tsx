'use client';

import React, { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingDown,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  DollarSign,
  Shield,
  Building2,
} from 'lucide-react';
import type { DivestmentCandidate, ESGLoanType, PerformanceStatus } from '../lib';
import { formatCurrency } from '../lib';

interface DivestmentCandidateCardProps {
  data: DivestmentCandidate[];
  title?: string;
  description?: string;
  onInitiateDivestment?: (candidateId: string) => void;
  onViewDetails?: (candidateId: string) => void;
}

function getLoanTypeColor(type: ESGLoanType): string {
  switch (type) {
    case 'green_loan':
      return 'bg-green-100 text-green-700';
    case 'social_loan':
      return 'bg-purple-100 text-purple-700';
    case 'sustainability_linked':
      return 'bg-blue-100 text-blue-700';
    case 'transition_loan':
      return 'bg-amber-100 text-amber-700';
    case 'esg_linked_hybrid':
      return 'bg-indigo-100 text-indigo-700';
    default:
      return 'bg-zinc-100 text-zinc-700';
  }
}

function getLoanTypeLabel(type: ESGLoanType): string {
  switch (type) {
    case 'green_loan':
      return 'Green';
    case 'social_loan':
      return 'Social';
    case 'sustainability_linked':
      return 'SLL';
    case 'transition_loan':
      return 'Transition';
    case 'esg_linked_hybrid':
      return 'Hybrid';
    default:
      return type;
  }
}

function getPerformanceColor(status: PerformanceStatus): string {
  switch (status) {
    case 'on_track':
      return 'text-green-600';
    case 'at_risk':
      return 'text-amber-600';
    case 'off_track':
      return 'text-red-600';
    default:
      return 'text-zinc-600';
  }
}

function getPerformanceBadgeVariant(status: PerformanceStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'on_track':
      return 'default';
    case 'at_risk':
      return 'secondary';
    case 'off_track':
      return 'destructive';
    default:
      return 'outline';
  }
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

export const DivestmentCandidateCard = memo(function DivestmentCandidateCard({
  data,
  title = 'Divestment Candidates',
  description = 'Facilities recommended for portfolio exit',
  onInitiateDivestment,
  onViewDetails,
}: DivestmentCandidateCardProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const totalExposure = data.reduce((sum, item) => sum + item.current_exposure, 0);
  const totalImpact = data.reduce((sum, item) => sum + item.portfolio_impact.esg_score_improvement, 0);

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 border-red-200" data-testid="divestment-candidate-card">
      <CardHeader className="bg-red-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <div>
              <CardTitle className="text-red-800">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div>
              <div className="text-xs text-zinc-500">Total Exposure</div>
              <div className="font-semibold text-red-700">{formatCurrency(totalExposure)}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">Potential ESG Lift</div>
              <div className="font-semibold text-green-700">+{totalImpact.toFixed(1)} pts</div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {data.map((candidate) => {
            const isExpanded = expandedId === candidate.id;

            return (
              <div
                key={candidate.id}
                className="rounded-lg border border-red-200 overflow-hidden transition-all hover:border-red-300"
                data-testid={`divestment-item-${candidate.id}`}
              >
                {/* Header */}
                <div
                  className="flex items-center justify-between p-4 bg-red-50/50 cursor-pointer"
                  onClick={() => toggleExpanded(candidate.id)}
                  data-testid={`divestment-toggle-${candidate.id}`}
                >
                  <div className="flex items-center gap-4">
                    {/* ESG Score */}
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center border-2 border-red-300">
                      <span className="text-red-700 font-bold text-sm">{candidate.esg_score}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-zinc-900">{candidate.facility_name}</h4>
                        <Badge className={getLoanTypeColor(candidate.esg_loan_type)}>
                          {getLoanTypeLabel(candidate.esg_loan_type)}
                        </Badge>
                        <Badge variant={getPriorityBadgeVariant(candidate.priority)}>
                          {candidate.priority} priority
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-zinc-500 mt-0.5">
                        <Building2 className="w-3 h-3" />
                        <span>{candidate.borrower_name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-xs text-zinc-500">Current Exposure</div>
                      <div className="font-semibold text-zinc-900">{formatCurrency(candidate.current_exposure)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-zinc-500">ESG Status</div>
                      <Badge variant={getPerformanceBadgeVariant(candidate.esg_performance)}>
                        {candidate.esg_performance === 'off_track' ? 'Off Track' :
                         candidate.esg_performance === 'at_risk' ? 'At Risk' : 'On Track'}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-zinc-500">Market Price</div>
                      <div className="font-semibold text-zinc-900">{candidate.expected_market_price_pct}%</div>
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
                  <div className="p-4 border-t border-red-200 bg-white">
                    {/* Reasons */}
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-zinc-700 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        Divestment Reasons
                      </h5>
                      <ul className="space-y-1">
                        {candidate.reason.map((reason, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-zinc-600">
                            <span className="text-red-400 mt-1">•</span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Portfolio Impact */}
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-zinc-700 mb-2">Portfolio Impact</h5>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-3 rounded-lg bg-green-50">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingDown className="w-4 h-4 text-green-600 rotate-180" />
                            <span className="text-xs text-green-700">ESG Score</span>
                          </div>
                          <div className="text-lg font-bold text-green-700">
                            +{candidate.portfolio_impact.esg_score_improvement.toFixed(1)} pts
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-50">
                          <div className="flex items-center gap-2 mb-1">
                            <Shield className="w-4 h-4 text-blue-600" />
                            <span className="text-xs text-blue-700">Concentration</span>
                          </div>
                          <div className="text-lg font-bold text-blue-700">
                            -{candidate.portfolio_impact.concentration_improvement.toFixed(1)}%
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-purple-50">
                          <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="w-4 h-4 text-purple-600" />
                            <span className="text-xs text-purple-700">Exposure Reduction</span>
                          </div>
                          <div className="text-lg font-bold text-purple-700">
                            {formatCurrency(candidate.portfolio_impact.exposure_reduction)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Current Position */}
                    <div className="p-3 rounded-lg bg-zinc-50 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-zinc-500">Current Margin</div>
                          <div className="font-semibold text-zinc-900">{candidate.current_margin_bps}bps</div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-zinc-400" />
                        <div className="text-right">
                          <div className="text-xs text-zinc-500">Expected Exit Value</div>
                          <div className="font-semibold text-zinc-900">
                            {formatCurrency(candidate.current_exposure * (candidate.expected_market_price_pct / 100))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4 border-t border-zinc-200">
                      {onInitiateDivestment && (
                        <Button
                          variant="destructive"
                          onClick={() => onInitiateDivestment(candidate.id)}
                          data-testid={`divest-btn-${candidate.id}`}
                        >
                          Initiate Divestment
                        </Button>
                      )}
                      {onViewDetails && (
                        <Button
                          variant="outline"
                          onClick={() => onViewDetails(candidate.id)}
                          data-testid={`view-divest-details-btn-${candidate.id}`}
                        >
                          View Facility Details
                        </Button>
                      )}
                    </div>
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
