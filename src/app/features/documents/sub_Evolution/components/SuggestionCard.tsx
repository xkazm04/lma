'use client';

import * as React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FileEdit,
  MessageSquare,
  Shield,
  TrendingDown,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AmendmentSuggestion, AmendmentSuggestionType } from '../lib/types';

interface SuggestionCardProps {
  suggestion: AmendmentSuggestion;
  onViewDetails?: (suggestion: AmendmentSuggestion) => void;
  onUpdateStatus?: (suggestionId: string, status: AmendmentSuggestion['status']) => void;
  onInitiateCommunication?: (suggestion: AmendmentSuggestion) => void;
}

const priorityStyles = {
  urgent: {
    badge: 'bg-red-100 text-red-700 border-red-200',
    border: 'border-l-red-500',
    icon: AlertCircle,
  },
  high: {
    badge: 'bg-orange-100 text-orange-700 border-orange-200',
    border: 'border-l-orange-500',
    icon: AlertTriangle,
  },
  medium: {
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    border: 'border-l-amber-500',
    icon: Clock,
  },
  low: {
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    border: 'border-l-blue-500',
    icon: Shield,
  },
};

const statusStyles = {
  new: 'bg-blue-100 text-blue-700',
  under_review: 'bg-purple-100 text-purple-700',
  approved: 'bg-green-100 text-green-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  dismissed: 'bg-zinc-100 text-zinc-500',
};

const typeLabels: Record<AmendmentSuggestionType, string> = {
  covenant_reset: 'Covenant Reset',
  margin_adjustment: 'Margin Adjustment',
  maturity_extension: 'Maturity Extension',
  commitment_change: 'Commitment Change',
  regulatory_compliance: 'Regulatory Compliance',
  definition_update: 'Definition Update',
  waiver_preemptive: 'Preemptive Waiver',
  structural_change: 'Structural Change',
  collateral_adjustment: 'Collateral Adjustment',
  reporting_frequency: 'Reporting Frequency',
  cure_rights_enhancement: 'Cure Rights',
  basket_adjustment: 'Basket Adjustment',
};

export function SuggestionCard({
  suggestion,
  onViewDetails,
  onUpdateStatus,
  onInitiateCommunication,
}: SuggestionCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const priorityStyle = priorityStyles[suggestion.priority];
  const PriorityIcon = priorityStyle.icon;

  const handleStatusChange = (newStatus: AmendmentSuggestion['status']) => {
    onUpdateStatus?.(suggestion.id, newStatus);
  };

  return (
    <Card
      className={cn('border-l-4', priorityStyle.border)}
      data-testid={`suggestion-card-${suggestion.id}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Badge variant="outline" className={priorityStyle.badge}>
                <PriorityIcon className="mr-1 h-3 w-3" />
                {suggestion.priority}
              </Badge>
              <Badge variant="outline" className={statusStyles[suggestion.status]}>
                {suggestion.status.replace('_', ' ')}
              </Badge>
              <Badge variant="outline" className="bg-zinc-50 text-zinc-600">
                {typeLabels[suggestion.type]}
              </Badge>
            </div>
            <CardTitle className="text-base font-semibold text-zinc-900">
              {suggestion.title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-zinc-500 whitespace-nowrap">
              {Math.round(suggestion.confidence * 100)}% confidence
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm text-zinc-600 line-clamp-2 mb-3">{suggestion.description}</p>

        {/* Risk if ignored */}
        <div className="flex items-start gap-2 rounded-md bg-zinc-50 p-2.5 mb-3">
          <TrendingDown className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium text-zinc-700">Risk if not addressed</p>
            <p className="text-xs text-zinc-600">
              {suggestion.riskIfIgnored.likelihood} likelihood, {suggestion.riskIfIgnored.impact} impact
            </p>
          </div>
        </div>

        {/* Expandable details */}
        {isExpanded && (
          <div className="space-y-4 pt-3 border-t border-zinc-100">
            {/* Rationale */}
            <div>
              <h4 className="text-xs font-medium text-zinc-700 mb-1">Rationale</h4>
              <p className="text-sm text-zinc-600">{suggestion.rationale}</p>
            </div>

            {/* Suggested Changes */}
            {suggestion.suggestedChanges.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-zinc-700 mb-2">Suggested Changes</h4>
                <div className="space-y-2">
                  {suggestion.suggestedChanges.map((change, idx) => (
                    <div key={idx} className="rounded-md bg-zinc-50 p-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-zinc-700">{change.field}</span>
                        <Badge variant="outline" className="text-xs bg-white">
                          {change.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-zinc-500">
                          {String(change.currentValue)} → {String(change.suggestedValue)}
                        </span>
                      </div>
                      {change.draftLanguage && (
                        <p className="mt-2 text-xs text-zinc-600 italic border-l-2 border-zinc-200 pl-2">
                          &quot;{change.draftLanguage}&quot;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Negotiation Points */}
            {suggestion.negotiationPoints.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-zinc-700 mb-2">Key Negotiation Points</h4>
                <div className="space-y-2">
                  {suggestion.negotiationPoints.slice(0, 2).map((point, idx) => (
                    <div key={idx} className="rounded-md bg-blue-50 p-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-blue-700">{point.title}</span>
                        <Badge variant="outline" className="text-xs bg-white text-blue-600 border-blue-200">
                          {point.priority.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-blue-600 mb-1">
                        <strong>Our position:</strong> {point.ourPosition}
                      </p>
                      <p className="text-xs text-blue-600">
                        <strong>Expected counter:</strong> {point.anticipatedCounterposition}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Calendar className="h-3.5 w-3.5" />
              <span>Estimated timeline: {suggestion.estimatedTimeline}</span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-zinc-600"
            data-testid={`suggestion-expand-btn-${suggestion.id}`}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="mr-1 h-4 w-4" />
                Less details
              </>
            ) : (
              <>
                <ChevronDown className="mr-1 h-4 w-4" />
                More details
              </>
            )}
          </Button>

          <div className="flex items-center gap-2">
            {suggestion.status === 'new' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('dismissed')}
                  className="text-zinc-500"
                  data-testid={`suggestion-dismiss-btn-${suggestion.id}`}
                >
                  <XCircle className="mr-1 h-4 w-4" />
                  Dismiss
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('under_review')}
                  data-testid={`suggestion-review-btn-${suggestion.id}`}
                >
                  <FileEdit className="mr-1 h-4 w-4" />
                  Review
                </Button>
              </>
            )}
            {suggestion.status === 'under_review' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onInitiateCommunication?.(suggestion)}
                  data-testid={`suggestion-communicate-btn-${suggestion.id}`}
                >
                  <MessageSquare className="mr-1 h-4 w-4" />
                  Draft Communication
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleStatusChange('approved')}
                  data-testid={`suggestion-approve-btn-${suggestion.id}`}
                >
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  Approve
                </Button>
              </>
            )}
            {suggestion.status === 'approved' && (
              <Button
                variant="default"
                size="sm"
                onClick={() => handleStatusChange('in_progress')}
                data-testid={`suggestion-start-btn-${suggestion.id}`}
              >
                <ArrowRight className="mr-1 h-4 w-4" />
                Start Amendment
              </Button>
            )}
            {(suggestion.status === 'new' || suggestion.status === 'under_review') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewDetails?.(suggestion)}
                className="text-blue-600"
                data-testid={`suggestion-details-btn-${suggestion.id}`}
              >
                View Full Details
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
