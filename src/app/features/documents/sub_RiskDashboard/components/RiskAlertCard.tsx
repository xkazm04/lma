'use client';

import React, { memo, useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  Info,
  ChevronDown,
  ChevronUp,
  FileText,
  ExternalLink,
  CheckCircle,
  Eye,
  Search,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { RiskAlert, RiskAlertSeverity, RiskCategory, RiskAlertStatus } from '../../lib/types';

interface RiskAlertCardProps {
  alert: RiskAlert;
  onStatusChange?: (alertId: string, status: RiskAlertStatus) => void;
  onViewDocument?: (documentId: string) => void;
}

const severityConfig: Record<RiskAlertSeverity, { icon: LucideIcon; color: string; bg: string; border: string }> = {
  critical: {
    icon: ShieldAlert,
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-l-red-600',
  },
  high: {
    icon: AlertTriangle,
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-l-orange-500',
  },
  medium: {
    icon: AlertCircle,
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-l-amber-500',
  },
  low: {
    icon: Info,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-l-blue-500',
  },
  info: {
    icon: Info,
    color: 'text-zinc-600',
    bg: 'bg-zinc-50',
    border: 'border-l-zinc-400',
  },
};

const categoryLabels: Record<RiskCategory, string> = {
  covenant_threshold: 'Covenant Threshold',
  sanctions_screening: 'Sanctions Screening',
  missing_clause: 'Missing Clause',
  conflicting_terms: 'Conflicting Terms',
  unusual_terms: 'Unusual Terms',
  regulatory_compliance: 'Regulatory Compliance',
  document_quality: 'Document Quality',
  party_risk: 'Party Risk',
};

const statusConfig: Record<RiskAlertStatus, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' }> = {
  new: { label: 'New', variant: 'destructive' },
  acknowledged: { label: 'Acknowledged', variant: 'warning' },
  investigating: { label: 'Investigating', variant: 'info' as any },
  resolved: { label: 'Resolved', variant: 'success' },
  false_positive: { label: 'False Positive', variant: 'secondary' },
};

export const RiskAlertCard = memo(function RiskAlertCard({
  alert,
  onStatusChange,
  onViewDocument,
}: RiskAlertCardProps) {
  const [expanded, setExpanded] = useState(false);

  const config = severityConfig[alert.severity];
  const SeverityIcon = config.icon;
  const statusInfo = statusConfig[alert.status];

  return (
    <Card
      className={cn(
        'overflow-hidden border-l-4 transition-all duration-200 hover:shadow-md',
        config.border
      )}
      data-testid={`risk-alert-card-${alert.id}`}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={cn('p-2 rounded-lg shrink-0', config.bg)}>
            <SeverityIcon className={cn('w-5 h-5', config.color)} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-zinc-900 text-sm leading-tight">
                  {alert.title}
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {categoryLabels[alert.category]}
                  </Badge>
                  <Badge variant={statusInfo.variant} className="text-xs">
                    {statusInfo.label}
                  </Badge>
                  <span className="text-xs text-zinc-400">
                    {Math.round(alert.confidence * 100)}% confidence
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(!expanded)}
                  className="h-8 w-8 p-0"
                  data-testid={`risk-alert-expand-${alert.id}`}
                >
                  {expanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Document Reference */}
            <button
              onClick={() => onViewDocument?.(alert.documentId)}
              className="flex items-center gap-1.5 mt-2 text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
              data-testid={`risk-alert-view-doc-${alert.id}`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="truncate max-w-[200px]">{alert.documentName}</span>
              {alert.sourceLocation?.page && (
                <span className="text-zinc-400">· Page {alert.sourceLocation.page}</span>
              )}
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Expanded Content */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-zinc-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Description */}
            <div>
              <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                Description
              </h4>
              <p className="text-sm text-zinc-700">{alert.description}</p>
            </div>

            {/* Values Comparison */}
            {(alert.triggeredValue || alert.expectedValue) && (
              <div className="grid grid-cols-2 gap-4">
                {alert.triggeredValue && (
                  <div>
                    <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                      Detected Value
                    </h4>
                    <p className={cn('text-sm font-medium', config.color)}>
                      {alert.triggeredValue}
                    </p>
                  </div>
                )}
                {alert.expectedValue && (
                  <div>
                    <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                      Expected Value
                    </h4>
                    <p className="text-sm font-medium text-zinc-700">
                      {alert.expectedValue}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Recommendation */}
            <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-100">
              <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                Recommendation
              </h4>
              <p className="text-sm text-zinc-700">{alert.recommendation}</p>
            </div>

            {/* Business Impact */}
            {alert.businessImpact && (
              <div>
                <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                  Business Impact
                </h4>
                <p className="text-sm text-zinc-600">{alert.businessImpact}</p>
              </div>
            )}

            {/* Regulatory Reference */}
            {alert.regulatoryReference && (
              <div>
                <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                  Regulatory Reference
                </h4>
                <p className="text-sm text-zinc-600 font-mono">
                  {alert.regulatoryReference}
                </p>
              </div>
            )}

            {/* Resolution Notes (if resolved) */}
            {alert.status === 'resolved' && alert.resolutionNotes && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                <h4 className="text-xs font-medium text-green-700 uppercase tracking-wider mb-1">
                  Resolution Notes
                </h4>
                <p className="text-sm text-green-800">{alert.resolutionNotes}</p>
                {alert.resolvedBy && (
                  <p className="text-xs text-green-600 mt-1">
                    Resolved by {alert.resolvedBy}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {alert.status !== 'resolved' && alert.status !== 'false_positive' && (
              <div className="flex items-center gap-2 pt-2">
                {alert.status === 'new' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStatusChange?.(alert.id, 'acknowledged')}
                    className="text-xs"
                    data-testid={`risk-alert-acknowledge-${alert.id}`}
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    Acknowledge
                  </Button>
                )}
                {(alert.status === 'new' || alert.status === 'acknowledged') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStatusChange?.(alert.id, 'investigating')}
                    className="text-xs"
                    data-testid={`risk-alert-investigate-${alert.id}`}
                  >
                    <Search className="w-3.5 h-3.5 mr-1.5" />
                    Investigate
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStatusChange?.(alert.id, 'resolved')}
                  className="text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                  data-testid={`risk-alert-resolve-${alert.id}`}
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                  Resolve
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onStatusChange?.(alert.id, 'false_positive')}
                  className="text-xs text-zinc-500 hover:text-zinc-700"
                  data-testid={`risk-alert-false-positive-${alert.id}`}
                >
                  <XCircle className="w-3.5 h-3.5 mr-1.5" />
                  False Positive
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
