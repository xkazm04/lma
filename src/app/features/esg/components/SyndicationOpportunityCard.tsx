'use client';

import React, { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Calendar,
  TrendingUp,
  Star,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Building2,
  Leaf,
  Clock,
} from 'lucide-react';
import type { SyndicationOpportunity, ESGLoanType } from '../lib';
import { formatCurrency } from '../lib';

interface SyndicationOpportunityCardProps {
  data: SyndicationOpportunity[];
  title?: string;
  description?: string;
  onParticipate?: (opportunityId: string) => void;
  onViewDetails?: (opportunityId: string) => void;
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

function getMatchScoreColor(score: number): string {
  if (score >= 85) return 'bg-green-500';
  if (score >= 70) return 'bg-blue-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-zinc-500';
}

function getDaysUntil(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export const SyndicationOpportunityCard = memo(function SyndicationOpportunityCard({
  data,
  title = 'Syndication Opportunities',
  description = 'Market opportunities matching your portfolio strategy',
  onParticipate,
  onViewDetails,
}: SyndicationOpportunityCardProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'match_score' | 'deadline' | 'esg_score'>('match_score');

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const sortedData = [...data].sort((a, b) => {
    switch (sortBy) {
      case 'match_score':
        return b.match_score - a.match_score;
      case 'deadline':
        return new Date(a.syndication_deadline).getTime() - new Date(b.syndication_deadline).getTime();
      case 'esg_score':
        return b.esg_score - a.esg_score;
      default:
        return 0;
    }
  });

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500" data-testid="syndication-opportunity-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-xs border rounded px-2 py-1 bg-white"
              data-testid="syndication-sort-select"
            >
              <option value="match_score">Match Score</option>
              <option value="deadline">Deadline</option>
              <option value="esg_score">ESG Score</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedData.map((opportunity) => {
            const isExpanded = expandedId === opportunity.id;
            const daysUntil = getDaysUntil(opportunity.syndication_deadline);
            const isUrgent = daysUntil <= 14;

            return (
              <div
                key={opportunity.id}
                className="rounded-lg border border-zinc-200 overflow-hidden transition-all hover:border-zinc-300"
                data-testid={`syndication-item-${opportunity.id}`}
              >
                {/* Header */}
                <div
                  className="flex items-center justify-between p-4 bg-zinc-50 cursor-pointer"
                  onClick={() => toggleExpanded(opportunity.id)}
                  data-testid={`syndication-toggle-${opportunity.id}`}
                >
                  <div className="flex items-center gap-4">
                    {/* Match Score Circle */}
                    <div className="relative">
                      <div
                        className={`w-12 h-12 rounded-full ${getMatchScoreColor(opportunity.match_score)} flex items-center justify-center`}
                      >
                        <span className="text-white font-bold text-sm">{opportunity.match_score}</span>
                      </div>
                      <Star className="absolute -bottom-1 -right-1 w-4 h-4 text-amber-400 fill-amber-400" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-zinc-900">{opportunity.facility_name}</h4>
                        <Badge className={getLoanTypeColor(opportunity.esg_loan_type)}>
                          {getLoanTypeLabel(opportunity.esg_loan_type)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-zinc-500 mt-0.5">
                        <Building2 className="w-3 h-3" />
                        <span>{opportunity.borrower_name}</span>
                        <span>|</span>
                        <span>{opportunity.lead_arranger}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-xs text-zinc-500">Available</div>
                      <div className="font-semibold text-zinc-900">{formatCurrency(opportunity.available_participation)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-zinc-500">ESG Rating</div>
                      <div className="font-semibold text-green-600">{opportunity.esg_rating}</div>
                    </div>
                    <div className="text-right">
                      <div className={`flex items-center gap-1 text-xs ${isUrgent ? 'text-red-600' : 'text-zinc-500'}`}>
                        <Clock className="w-3 h-3" />
                        {daysUntil <= 0 ? 'Deadline passed' : `${daysUntil} days`}
                      </div>
                      <div className="text-sm text-zinc-500">{formatDate(opportunity.syndication_deadline)}</div>
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
                    {/* Recommendation */}
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 mb-4">
                      <div className="flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                        <p className="text-sm text-blue-800">{opportunity.recommendation_reason}</p>
                      </div>
                    </div>

                    {/* Key Details Grid */}
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="p-3 rounded-lg bg-zinc-50">
                        <div className="text-xs text-zinc-500 mb-1">Total Facility</div>
                        <div className="font-semibold text-zinc-900">{formatCurrency(opportunity.total_facility_amount)}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-zinc-50">
                        <div className="text-xs text-zinc-500 mb-1">Min Participation</div>
                        <div className="font-semibold text-zinc-900">{formatCurrency(opportunity.min_participation)}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-zinc-50">
                        <div className="text-xs text-zinc-500 mb-1">Margin</div>
                        <div className="font-semibold text-zinc-900">{opportunity.margin_bps}bps</div>
                      </div>
                      <div className="p-3 rounded-lg bg-zinc-50">
                        <div className="text-xs text-zinc-500 mb-1">Maturity</div>
                        <div className="font-semibold text-zinc-900">{formatDate(opportunity.maturity_date)}</div>
                      </div>
                    </div>

                    {/* KPIs and Framework */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <h5 className="text-sm font-medium text-zinc-700 mb-2">Key KPIs</h5>
                        <div className="flex flex-wrap gap-1">
                          {opportunity.key_kpis.map((kpi, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {kpi}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-zinc-700 mb-2">Framework Alignment</h5>
                        <div className="flex flex-wrap gap-1">
                          {opportunity.framework_alignment.map((framework, idx) => (
                            <Badge key={idx} className="bg-green-100 text-green-700 text-xs">
                              <Leaf className="w-3 h-3 mr-1" />
                              {framework}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4 border-t border-zinc-200">
                      {onParticipate && (
                        <Button
                          onClick={() => onParticipate(opportunity.id)}
                          data-testid={`participate-btn-${opportunity.id}`}
                        >
                          Express Interest
                        </Button>
                      )}
                      {onViewDetails && (
                        <Button
                          variant="outline"
                          onClick={() => onViewDetails(opportunity.id)}
                          data-testid={`view-details-btn-${opportunity.id}`}
                        >
                          View Full Details
                          <ExternalLink className="w-4 h-4 ml-2" />
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
