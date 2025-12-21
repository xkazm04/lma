'use client';

import React, { memo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  ShieldX,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Calendar,
  DollarSign,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Waiver } from '../../lib';
import {
  getWaiverStatusColor,
  getWaiverStatusLabel,
  getWaiverPriorityColor,
  getWaiverPriorityLabel,
} from '../../lib';

interface WaiverCardProps {
  waiver: Waiver;
  index?: number;
  onApprove?: (waiverId: string) => void;
  onReject?: (waiverId: string) => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCurrency(amount: number | null, currency: string): string {
  if (!amount) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusIcon(status: Waiver['status']) {
  switch (status) {
    case 'pending':
      return <Clock className="w-4 h-4" />;
    case 'approved':
      return <CheckCircle className="w-4 h-4" />;
    case 'rejected':
      return <XCircle className="w-4 h-4" />;
    case 'expired':
      return <ShieldX className="w-4 h-4" />;
    case 'withdrawn':
      return <XCircle className="w-4 h-4" />;
  }
}

function getCovenantTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    leverage_ratio: 'Leverage',
    interest_coverage: 'Interest Coverage',
    fixed_charge_coverage: 'FCCR',
    debt_service_coverage: 'DSCR',
    minimum_liquidity: 'Liquidity',
    capex: 'CapEx',
    net_worth: 'Net Worth',
  };
  return labels[type] || type;
}

export const WaiverCard = memo(function WaiverCard({
  waiver,
  index = 0,
  onApprove,
  onReject,
}: WaiverCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isPending = waiver.status === 'pending';
  const isApproved = waiver.status === 'approved';
  const isRejected = waiver.status === 'rejected';
  const isExpired = waiver.status === 'expired';

  const borderColor = cn(
    isPending && 'border-amber-200',
    isApproved && 'border-green-200',
    isRejected && 'border-red-200',
    isExpired && 'border-zinc-200'
  );

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md',
        borderColor,
        'animate-in fade-in slide-in-from-bottom-3'
      )}
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
      data-testid={`waiver-card-${waiver.id}`}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Header with badges */}
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h3 className="font-semibold text-zinc-900">{waiver.covenant_name}</h3>
              <Badge className={cn(getWaiverStatusColor(waiver.status), 'hover:opacity-90')}>
                {getStatusIcon(waiver.status)}
                <span className="ml-1">{getWaiverStatusLabel(waiver.status)}</span>
              </Badge>
              <Badge variant="outline">{getCovenantTypeLabel(waiver.covenant_type)}</Badge>
              <Badge className={cn(getWaiverPriorityColor(waiver.priority), 'hover:opacity-90')}>
                {getWaiverPriorityLabel(waiver.priority)}
              </Badge>
            </div>

            {/* Reason */}
            <p className="text-sm text-zinc-600 mb-4">{waiver.request_reason}</p>

            {/* Key metrics grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-zinc-500">Requested</p>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-zinc-400" />
                  <p className="text-sm font-medium text-zinc-900">
                    {formatDate(waiver.requested_date)}
                  </p>
                </div>
              </div>
              {isApproved && (
                <div>
                  <p className="text-xs text-zinc-500">Expires</p>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    <p className="text-sm font-medium text-zinc-900">
                      {formatDate(waiver.expiration_date)}
                    </p>
                  </div>
                </div>
              )}
              {waiver.waiver_fee && (
                <div>
                  <p className="text-xs text-zinc-500">Waiver Fee</p>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-zinc-400" />
                    <p className="text-sm font-medium text-zinc-900">
                      {formatCurrency(waiver.waiver_fee, waiver.fee_currency)}
                    </p>
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs text-zinc-500">Requested By</p>
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3 text-zinc-400" />
                  <p className="text-sm font-medium text-zinc-900 truncate">
                    {waiver.requested_by.split('@')[0]}
                  </p>
                </div>
              </div>
            </div>

            {/* Triggering test info */}
            {waiver.triggering_test && (
              <div className="mt-4 p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-medium text-zinc-700">Triggering Test Result</span>
                </div>
                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div>
                    <p className="text-zinc-500">Test Date</p>
                    <p className="font-medium">{formatDate(waiver.triggering_test.test_date)}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Actual</p>
                    <p className="font-medium">{waiver.triggering_test.calculated_ratio.toFixed(2)}x</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Threshold</p>
                    <p className="font-medium">{waiver.triggering_test.threshold.toFixed(2)}x</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Headroom</p>
                    <p className={cn(
                      'font-medium',
                      waiver.triggering_test.headroom_percentage < 0 ? 'text-red-600' : 'text-green-600'
                    )}>
                      {waiver.triggering_test.headroom_percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 ml-4 shrink-0">
            {isPending && onApprove && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => onApprove(waiver.id)}
                data-testid={`approve-waiver-btn-${waiver.id}`}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Approve
              </Button>
            )}
            {isPending && onReject && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onReject(waiver.id)}
                data-testid={`reject-waiver-btn-${waiver.id}`}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
              data-testid={`expand-waiver-btn-${waiver.id}`}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  More
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Expanded details */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-zinc-100 space-y-4 animate-in fade-in slide-in-from-top-2">
            {/* Justification */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-700 mb-1">Justification</h4>
              <p className="text-sm text-zinc-600">{waiver.justification}</p>
            </div>

            {/* Waiver Terms (if approved) */}
            {waiver.waiver_terms && (
              <div>
                <h4 className="text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-green-600" />
                  Waiver Terms
                </h4>
                <p className="text-sm text-zinc-600 bg-green-50 p-3 rounded-lg border border-green-100">
                  {waiver.waiver_terms}
                </p>
              </div>
            )}

            {/* Rejection Reason (if rejected) */}
            {waiver.rejection_reason && (
              <div>
                <h4 className="text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1">
                  <XCircle className="w-3 h-3 text-red-600" />
                  Rejection Reason
                </h4>
                <p className="text-sm text-zinc-600 bg-red-50 p-3 rounded-lg border border-red-100">
                  {waiver.rejection_reason}
                </p>
              </div>
            )}

            {/* Supporting Documents */}
            {waiver.supporting_documents.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-zinc-700 mb-2 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Supporting Documents ({waiver.supporting_documents.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {waiver.supporting_documents.map((doc) => (
                    <Badge
                      key={doc.id}
                      variant="outline"
                      className="cursor-pointer hover:bg-zinc-50"
                      data-testid={`waiver-doc-${doc.id}`}
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      {doc.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            {waiver.comments.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-zinc-700 mb-2 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  Comments ({waiver.comments.length})
                </h4>
                <div className="space-y-2">
                  {waiver.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="text-sm p-2 bg-zinc-50 rounded-lg"
                      data-testid={`waiver-comment-${comment.id}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-zinc-900">
                          {comment.author.split('@')[0]}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-zinc-600">{comment.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Decision info */}
            {waiver.decision_date && waiver.decision_by && (
              <div className="text-xs text-zinc-500 pt-2 border-t border-zinc-100">
                Decision made on {formatDate(waiver.decision_date)} by {waiver.decision_by}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
