'use client';

import React, { memo, useMemo } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  Info,
  FileText,
  ExternalLink,
  CheckCircle,
  Eye,
  Search,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ExpandableRow,
  KeyValueSection,
  HighlightBox,
  type Severity,
} from '@/components/ui/expandable-row';
import type { RiskAlert, RiskAlertSeverity, RiskCategory, RiskAlertStatus } from '../../lib/types';

interface RiskAlertCardProps {
  alert: RiskAlert;
  onStatusChange?: (alertId: string, status: RiskAlertStatus) => void;
  onViewDocument?: (documentId: string) => void;
}

const severityIcons: Record<RiskAlertSeverity, LucideIcon> = {
  critical: ShieldAlert,
  high: AlertTriangle,
  medium: AlertCircle,
  low: Info,
  info: Info,
};

const severityToExpandable: Record<RiskAlertSeverity, Severity> = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'low',
  info: 'info',
};

const categoryLabels: Record<RiskCategory, string> = {
  covenant_threshold: 'Covenant',
  sanctions_screening: 'Sanctions',
  missing_clause: 'Missing Clause',
  conflicting_terms: 'Conflict',
  unusual_terms: 'Unusual',
  regulatory_compliance: 'Regulatory',
  document_quality: 'Quality',
  party_risk: 'Party Risk',
};

const statusConfig: Record<RiskAlertStatus, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' }> = {
  new: { label: 'New', variant: 'destructive' },
  acknowledged: { label: 'Ack', variant: 'warning' },
  investigating: { label: 'Investigating', variant: 'default' },
  resolved: { label: 'Resolved', variant: 'success' },
  false_positive: { label: 'False +', variant: 'secondary' },
};

export const RiskAlertCard = memo(function RiskAlertCard({
  alert,
  onStatusChange,
  onViewDocument,
}: RiskAlertCardProps) {
  const SeverityIcon = severityIcons[alert.severity];
  const statusInfo = statusConfig[alert.status];

  const badges = useMemo(() => [
    { label: categoryLabels[alert.category], variant: 'outline' as const },
    { label: statusInfo.label, variant: statusInfo.variant },
  ], [alert.category, statusInfo]);

  const sections = useMemo(() => [
    {
      label: 'Description',
      content: alert.description,
      show: true,
    },
    {
      label: 'Values',
      content: (
        <KeyValueSection
          pairs={[
            ...(alert.triggeredValue ? [{ label: 'Detected', value: <span className="text-red-600 font-medium">{alert.triggeredValue}</span> }] : []),
            ...(alert.expectedValue ? [{ label: 'Expected', value: alert.expectedValue }] : []),
          ]}
          columns={2}
        />
      ),
      show: !!(alert.triggeredValue || alert.expectedValue),
    },
    {
      label: 'Recommendation',
      content: <HighlightBox variant="info">{alert.recommendation}</HighlightBox>,
      show: true,
    },
    {
      label: 'Business Impact',
      content: alert.businessImpact,
      show: !!alert.businessImpact,
    },
    {
      label: 'Regulatory Reference',
      content: <span className="font-mono text-xs">{alert.regulatoryReference}</span>,
      show: !!alert.regulatoryReference,
    },
    {
      label: 'Document',
      content: (
        <button
          onClick={() => onViewDocument?.(alert.documentId)}
          className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
          <span className="truncate max-w-[200px]">{alert.documentName}</span>
          {alert.sourceLocation?.page && (
            <span className="text-zinc-400">· Page {alert.sourceLocation.page}</span>
          )}
          <ExternalLink className="w-3 h-3" />
        </button>
      ),
      show: true,
    },
    {
      label: 'Resolution',
      content: (
        <HighlightBox variant="success">
          <p>{alert.resolutionNotes}</p>
          {alert.resolvedBy && (
            <p className="text-xs mt-1 opacity-80">Resolved by {alert.resolvedBy}</p>
          )}
        </HighlightBox>
      ),
      show: alert.status === 'resolved' && !!alert.resolutionNotes,
    },
  ], [alert, onViewDocument]);

  const actions = useMemo(() => {
    if (alert.status === 'resolved' || alert.status === 'false_positive') {
      return null;
    }

    return (
      <>
        {alert.status === 'new' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStatusChange?.(alert.id, 'acknowledged')}
            className="text-xs h-7"
          >
            <Eye className="w-3 h-3 mr-1" />
            Acknowledge
          </Button>
        )}
        {(alert.status === 'new' || alert.status === 'acknowledged') && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStatusChange?.(alert.id, 'investigating')}
            className="text-xs h-7"
          >
            <Search className="w-3 h-3 mr-1" />
            Investigate
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onStatusChange?.(alert.id, 'resolved')}
          className="text-xs h-7 text-green-600 hover:text-green-700 hover:bg-green-50"
        >
          <CheckCircle className="w-3 h-3 mr-1" />
          Resolve
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onStatusChange?.(alert.id, 'false_positive')}
          className="text-xs h-7 text-zinc-500 hover:text-zinc-700"
        >
          <XCircle className="w-3 h-3 mr-1" />
          False +
        </Button>
      </>
    );
  }, [alert.id, alert.status, onStatusChange]);

  return (
    <ExpandableRow
      item={alert}
      id={alert.id}
      icon={SeverityIcon}
      title={alert.title}
      badges={badges}
      severity={severityToExpandable[alert.severity]}
      confidence={Math.round(alert.confidence * 100)}
      sections={sections}
      actions={actions}
      testId="risk-alert-card"
    />
  );
});
