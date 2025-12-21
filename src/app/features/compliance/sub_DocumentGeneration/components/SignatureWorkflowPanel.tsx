'use client';

import React, { memo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Send,
  Bell,
  UserCircle,
  PenLine,
  Mail,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import type {
  SignatureWorkflow,
  Signer,
  SignatureStatus,
  SignerRole,
} from '../../lib';
import {
  getSignatureStatusColor,
  getSignerRoleLabel,
} from '../../lib';

interface SignatureWorkflowPanelProps {
  workflow: SignatureWorkflow | null;
  onInitiateWorkflow?: () => void;
  onSendReminder?: (signerId: string) => void;
  onCancelWorkflow?: () => void;
  isReadOnly?: boolean;
}

export const SignatureWorkflowPanel = memo(function SignatureWorkflowPanel({
  workflow,
  onInitiateWorkflow,
  onSendReminder,
  onCancelWorkflow,
  isReadOnly = false,
}: SignatureWorkflowPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!workflow && !onInitiateWorkflow) {
    return null;
  }

  const getStatusIcon = (status: SignatureStatus) => {
    switch (status) {
      case 'signed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'viewed':
        return <Eye className="w-4 h-4 text-blue-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-zinc-400" />;
      case 'declined':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4 text-zinc-400" />;
      default:
        return <Clock className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getStatusLabel = (status: SignatureStatus): string => {
    switch (status) {
      case 'signed':
        return 'Signed';
      case 'viewed':
        return 'Viewed';
      case 'pending':
        return 'Pending';
      case 'declined':
        return 'Declined';
      case 'expired':
        return 'Expired';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Calculate workflow progress
  const signedCount = workflow?.signers.filter(s => s.status === 'signed').length || 0;
  const totalSigners = workflow?.signers.length || 0;
  const progressPercent = totalSigners > 0 ? (signedCount / totalSigners) * 100 : 0;

  return (
    <Card className="animate-in fade-in" data-testid="signature-workflow-panel">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <PenLine className="w-4 h-4" />
            E-Signature Workflow
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            data-testid="toggle-workflow-panel-btn"
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
        <CardContent className="space-y-4">
          {!workflow ? (
            // No workflow - show initiate button
            <div className="text-center py-6">
              <PenLine className="w-10 h-10 mx-auto text-zinc-300 mb-3" />
              <p className="text-sm text-zinc-500 mb-4">
                No signature workflow initiated for this document.
              </p>
              {!isReadOnly && onInitiateWorkflow && (
                <Button
                  onClick={onInitiateWorkflow}
                  data-testid="initiate-workflow-btn"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send for Signature
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Workflow Status & Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Status</span>
                  <Badge
                    className={cn(
                      workflow.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : workflow.status === 'cancelled'
                        ? 'bg-red-100 text-red-700'
                        : workflow.status === 'expired'
                        ? 'bg-zinc-100 text-zinc-500'
                        : 'bg-blue-100 text-blue-700'
                    )}
                    data-testid="workflow-status-badge"
                  >
                    {workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1).replace('_', ' ')}
                  </Badge>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>Signatures</span>
                    <span>{signedCount} of {totalSigners}</span>
                  </div>
                  <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                      data-testid="workflow-progress-bar"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Expires</span>
                  <span className="text-zinc-700">{formatDate(workflow.expires_at)}</span>
                </div>
              </div>

              {/* Signers List */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-zinc-700">Signers</h4>
                <div className="space-y-2">
                  {workflow.signers.map((signer, index) => (
                    <SignerCard
                      key={signer.id}
                      signer={signer}
                      index={index}
                      signingOrder={workflow.signing_order}
                      onSendReminder={onSendReminder}
                      isReadOnly={isReadOnly}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              {!isReadOnly && workflow.status === 'in_progress' && onCancelWorkflow && (
                <div className="pt-2 border-t border-zinc-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onCancelWorkflow}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    data-testid="cancel-workflow-btn"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Workflow
                  </Button>
                </div>
              )}

              {/* Completed Info */}
              {workflow.status === 'completed' && workflow.completed_at && (
                <div className="pt-2 border-t border-zinc-100">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Completed {formatDate(workflow.completed_at)}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
});

interface SignerCardProps {
  signer: Signer;
  index: number;
  signingOrder: 'sequential' | 'parallel';
  onSendReminder?: (signerId: string) => void;
  isReadOnly: boolean;
}

const SignerCard = memo(function SignerCard({
  signer,
  index,
  signingOrder,
  onSendReminder,
  isReadOnly,
}: SignerCardProps) {
  const canSendReminder =
    !isReadOnly &&
    signer.status === 'pending' &&
    onSendReminder;

  const getStatusIcon = (status: SignatureStatus) => {
    switch (status) {
      case 'signed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'viewed':
        return <Eye className="w-4 h-4 text-blue-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-zinc-400" />;
      case 'declined':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4 text-zinc-400" />;
      default:
        return <Clock className="w-4 h-4 text-zinc-400" />;
    }
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div
      className={cn(
        'p-3 rounded-lg border transition-all',
        signer.status === 'signed'
          ? 'bg-green-50/50 border-green-200'
          : signer.status === 'declined'
          ? 'bg-red-50/50 border-red-200'
          : 'bg-white border-zinc-200'
      )}
      data-testid={`signer-card-${signer.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Order indicator for sequential signing */}
          {signingOrder === 'sequential' && (
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-medium text-zinc-600">
              {index + 1}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-zinc-900 truncate">
                {signer.name}
              </span>
              {getStatusIcon(signer.status)}
            </div>
            <div className="text-xs text-zinc-500 truncate">
              {signer.title} • {signer.organization}
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-zinc-400">
              <Mail className="w-3 h-3" />
              <span className="truncate">{signer.email}</span>
            </div>

            {/* Timestamps */}
            <div className="mt-2 space-y-0.5 text-xs">
              {signer.viewed_at && (
                <div className="text-blue-600">
                  Viewed: {formatDate(signer.viewed_at)}
                </div>
              )}
              {signer.signed_at && (
                <div className="text-green-600">
                  Signed: {formatDate(signer.signed_at)}
                </div>
              )}
              {signer.declined_at && (
                <div className="text-red-600">
                  Declined: {formatDate(signer.declined_at)}
                  {signer.decline_reason && (
                    <span className="block text-zinc-500">
                      Reason: {signer.decline_reason}
                    </span>
                  )}
                </div>
              )}
              {signer.reminders_count > 0 && signer.status === 'pending' && (
                <div className="text-amber-600">
                  {signer.reminders_count} reminder(s) sent
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reminder button */}
        {canSendReminder && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSendReminder(signer.id)}
            className="flex-shrink-0"
            data-testid={`send-reminder-btn-${signer.id}`}
          >
            <Bell className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
});
