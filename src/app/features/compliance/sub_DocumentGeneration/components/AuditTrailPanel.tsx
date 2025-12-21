'use client';

import React, { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  FileText,
  Eye,
  Edit,
  Send,
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  GitBranch,
  ChevronDown,
  ChevronUp,
  History,
  type LucideIcon,
} from 'lucide-react';
import type { AuditTrailEntry, AuditAction } from '../../lib';

interface AuditTrailPanelProps {
  entries: AuditTrailEntry[];
  maxInitialDisplay?: number;
}

const ACTION_CONFIG: Record<AuditAction, { icon: LucideIcon; color: string; label: string }> = {
  document_generated: { icon: FileText, color: 'text-blue-600 bg-blue-100', label: 'Generated' },
  document_viewed: { icon: Eye, color: 'text-zinc-600 bg-zinc-100', label: 'Viewed' },
  document_edited: { icon: Edit, color: 'text-amber-600 bg-amber-100', label: 'Edited' },
  document_submitted: { icon: Send, color: 'text-purple-600 bg-purple-100', label: 'Submitted' },
  workflow_started: { icon: Send, color: 'text-blue-600 bg-blue-100', label: 'Workflow Started' },
  reminder_sent: { icon: Bell, color: 'text-amber-600 bg-amber-100', label: 'Reminder Sent' },
  document_viewed_by_signer: { icon: Eye, color: 'text-blue-600 bg-blue-100', label: 'Viewed by Signer' },
  signature_applied: { icon: CheckCircle2, color: 'text-green-600 bg-green-100', label: 'Signed' },
  signature_declined: { icon: XCircle, color: 'text-red-600 bg-red-100', label: 'Declined' },
  document_completed: { icon: CheckCircle2, color: 'text-green-600 bg-green-100', label: 'Completed' },
  document_rejected: { icon: XCircle, color: 'text-red-600 bg-red-100', label: 'Rejected' },
  document_expired: { icon: Clock, color: 'text-zinc-500 bg-zinc-100', label: 'Expired' },
  document_downloaded: { icon: Download, color: 'text-zinc-600 bg-zinc-100', label: 'Downloaded' },
  version_created: { icon: GitBranch, color: 'text-purple-600 bg-purple-100', label: 'New Version' },
};

export const AuditTrailPanel = memo(function AuditTrailPanel({
  entries,
  maxInitialDisplay = 5,
}: AuditTrailPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const displayedEntries = showAll
    ? sortedEntries
    : sortedEntries.slice(0, maxInitialDisplay);

  const hasMore = sortedEntries.length > maxInitialDisplay;

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatFullTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <Card className="animate-in fade-in" data-testid="audit-trail-panel">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="w-4 h-4" />
            Audit Trail
            <Badge variant="outline" className="ml-1 text-xs">
              {entries.length} events
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            data-testid="toggle-audit-trail-btn"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-6 text-zinc-500 text-sm">
              No audit trail entries yet
            </div>
          ) : (
            <div className="space-y-0">
              {displayedEntries.map((entry, index) => {
                const config = ACTION_CONFIG[entry.action] || {
                  icon: FileText,
                  color: 'text-zinc-600 bg-zinc-100',
                  label: entry.action,
                };
                const Icon = config.icon;
                const isLast = index === displayedEntries.length - 1;

                return (
                  <div
                    key={entry.id}
                    className="relative pl-8 pb-4"
                    data-testid={`audit-entry-${entry.id}`}
                  >
                    {/* Timeline line */}
                    {!isLast && (
                      <div className="absolute left-[13px] top-6 bottom-0 w-0.5 bg-zinc-200" />
                    )}

                    {/* Icon */}
                    <div
                      className={cn(
                        'absolute left-0 w-7 h-7 rounded-full flex items-center justify-center',
                        config.color
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>

                    {/* Content */}
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-sm font-medium text-zinc-900">
                            {config.label}
                          </span>
                          <span className="text-sm text-zinc-500 ml-2">
                            by {entry.actor_name}
                          </span>
                        </div>
                        <span
                          className="text-xs text-zinc-400 flex-shrink-0"
                          title={formatFullTimestamp(entry.timestamp)}
                        >
                          {formatTimestamp(entry.timestamp)}
                        </span>
                      </div>

                      {entry.details && (
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {entry.details}
                        </p>
                      )}

                      {entry.ip_address && (
                        <p className="text-xs text-zinc-400 mt-0.5">
                          IP: {entry.ip_address}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Show more/less button */}
              {hasMore && (
                <div className="pt-2 border-t border-zinc-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAll(!showAll)}
                    className="w-full text-xs"
                    data-testid="show-more-audit-btn"
                  >
                    {showAll ? (
                      <>
                        <ChevronUp className="w-3 h-3 mr-1" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3 mr-1" />
                        Show {sortedEntries.length - maxInitialDisplay} more
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
});
