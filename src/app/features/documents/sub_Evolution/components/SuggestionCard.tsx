'use client';

import * as React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  FileEdit,
  MessageSquare,
  Shield,
  TrendingDown,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ExpandableRow,
  HighlightBox,
  type Severity,
} from '@/components/ui/expandable-row';
import { cn } from '@/lib/utils';
import type { AmendmentSuggestion, AmendmentSuggestionType } from '../lib/types';

interface SuggestionCardProps {
  suggestion: AmendmentSuggestion;
  onViewDetails?: (suggestion: AmendmentSuggestion) => void;
  onUpdateStatus?: (suggestionId: string, status: AmendmentSuggestion['status']) => void;
  onInitiateCommunication?: (suggestion: AmendmentSuggestion) => void;
}

const priorityConfig: Record<AmendmentSuggestion['priority'], { icon: LucideIcon; severity: Severity }> = {
  urgent: { icon: AlertCircle, severity: 'critical' },
  high: { icon: AlertTriangle, severity: 'high' },
  medium: { icon: Clock, severity: 'medium' },
  low: { icon: Shield, severity: 'low' },
};

const statusLabels: Record<AmendmentSuggestion['status'], { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' }> = {
  new: { label: 'New', variant: 'default' },
  under_review: { label: 'Review', variant: 'warning' },
  approved: { label: 'Approved', variant: 'success' },
  in_progress: { label: 'In Progress', variant: 'warning' },
  completed: { label: 'Complete', variant: 'success' },
  dismissed: { label: 'Dismissed', variant: 'secondary' },
};

const typeLabels: Record<AmendmentSuggestionType, string> = {
  covenant_reset: 'Covenant',
  margin_adjustment: 'Margin',
  maturity_extension: 'Maturity',
  commitment_change: 'Commitment',
  regulatory_compliance: 'Regulatory',
  definition_update: 'Definition',
  waiver_preemptive: 'Waiver',
  structural_change: 'Structure',
  collateral_adjustment: 'Collateral',
  reporting_frequency: 'Reporting',
  cure_rights_enhancement: 'Cure Rights',
  basket_adjustment: 'Basket',
};

export function SuggestionCard({
  suggestion,
  onViewDetails,
  onUpdateStatus,
  onInitiateCommunication,
}: SuggestionCardProps) {
  const config = priorityConfig[suggestion.priority];
  const statusInfo = statusLabels[suggestion.status];

  const badges = React.useMemo(() => [
    { label: typeLabels[suggestion.type], variant: 'outline' as const },
    { label: statusInfo.label, variant: statusInfo.variant },
  ], [suggestion.type, statusInfo]);

  const sections = React.useMemo(() => [
    {
      label: 'Description',
      content: suggestion.description,
      show: true,
    },
    {
      label: 'Risk if Not Addressed',
      content: (
        <HighlightBox variant="warning">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            <span className="font-medium">
              {suggestion.riskIfIgnored.likelihood} likelihood, {suggestion.riskIfIgnored.impact} impact
            </span>
          </div>
          {suggestion.riskIfIgnored.description && (
            <p className="mt-1 text-sm opacity-90">{suggestion.riskIfIgnored.description}</p>
          )}
        </HighlightBox>
      ),
      show: true,
    },
    {
      label: 'Rationale',
      content: suggestion.rationale,
      show: !!suggestion.rationale,
    },
    {
      label: 'Suggested Changes',
      content: (
        <div className="space-y-2">
          {suggestion.suggestedChanges.map((change, idx) => (
            <div key={idx} className="rounded-md bg-zinc-50 p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-zinc-700">{change.field}</span>
                <Badge variant="outline" className="text-xs bg-white">
                  {change.category}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-600">
                <span className="line-through">{String(change.currentValue)}</span>
                <ArrowRight className="w-3 h-3" />
                <span className="text-green-700 font-medium">{String(change.suggestedValue)}</span>
              </div>
              {change.draftLanguage && (
                <p className="mt-2 text-xs text-zinc-600 italic border-l-2 border-zinc-200 pl-2">
                  &quot;{change.draftLanguage}&quot;
                </p>
              )}
            </div>
          ))}
        </div>
      ),
      show: suggestion.suggestedChanges.length > 0,
    },
    {
      label: 'Negotiation Points',
      content: (
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
      ),
      show: suggestion.negotiationPoints.length > 0,
    },
    {
      label: 'Timeline',
      content: (
        <div className="flex items-center gap-2 text-zinc-600">
          <Calendar className="h-4 w-4" />
          <span>{suggestion.estimatedTimeline}</span>
        </div>
      ),
      show: !!suggestion.estimatedTimeline,
    },
  ], [suggestion]);

  const actions = React.useMemo(() => {
    const handleStatusChange = (newStatus: AmendmentSuggestion['status']) => {
      onUpdateStatus?.(suggestion.id, newStatus);
    };

    return (
      <>
        {suggestion.status === 'new' && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('dismissed')}
              className="text-xs h-7 text-zinc-500"
            >
              <XCircle className="w-3 h-3 mr-1" />
              Dismiss
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('under_review')}
              className="text-xs h-7"
            >
              <FileEdit className="w-3 h-3 mr-1" />
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
              className="text-xs h-7"
            >
              <MessageSquare className="w-3 h-3 mr-1" />
              Draft
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => handleStatusChange('approved')}
              className="text-xs h-7"
            >
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Approve
            </Button>
          </>
        )}
        {suggestion.status === 'approved' && (
          <Button
            variant="default"
            size="sm"
            onClick={() => handleStatusChange('in_progress')}
            className="text-xs h-7"
          >
            <ArrowRight className="w-3 h-3 mr-1" />
            Start
          </Button>
        )}
        {(suggestion.status === 'new' || suggestion.status === 'under_review') && onViewDetails && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(suggestion)}
            className="text-xs h-7 text-blue-600"
          >
            Full Details
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        )}
      </>
    );
  }, [suggestion, onUpdateStatus, onInitiateCommunication, onViewDetails]);

  return (
    <ExpandableRow
      item={suggestion}
      id={suggestion.id}
      icon={config.icon}
      title={suggestion.title}
      badges={badges}
      severity={config.severity}
      confidence={Math.round(suggestion.confidence * 100)}
      sections={sections}
      actions={actions}
      testId="suggestion-card"
    />
  );
}
