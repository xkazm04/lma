'use client';

import React, { useMemo, memo } from 'react';
import Link from 'next/link';
import {
  MoreHorizontal,
  Users,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Pause,
  XCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils/cn';
import { calculateUrgency } from '@/lib/utils';
import type { DealWithStats } from '@/types';

interface DealCardProps {
  deal: DealWithStats;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
  isStatusPending?: boolean;
}

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-zinc-100 text-zinc-700', icon: FileText },
  active: { label: 'Active', color: 'bg-green-100 text-green-700', icon: Clock },
  paused: { label: 'Paused', color: 'bg-amber-100 text-amber-700', icon: Pause },
  agreed: { label: 'Agreed', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  closed: { label: 'Closed', color: 'bg-purple-100 text-purple-700', icon: CheckCircle },
  terminated: { label: 'Terminated', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const dealTypeLabels: Record<string, string> = {
  new_facility: 'New Facility',
  amendment: 'Amendment',
  refinancing: 'Refinancing',
  extension: 'Extension',
  consent: 'Consent',
  waiver: 'Waiver',
};

function arePropsEqual(prevProps: DealCardProps, nextProps: DealCardProps): boolean {
  // Check primitive props first (fast path)
  if (prevProps.isStatusPending !== nextProps.isStatusPending) {
    return false;
  }

  // Check if callback references changed
  if (
    prevProps.onDelete !== nextProps.onDelete ||
    prevProps.onStatusChange !== nextProps.onStatusChange
  ) {
    return false;
  }

  // Deep compare deal object - compare relevant fields
  const prevDeal = prevProps.deal;
  const nextDeal = nextProps.deal;
  if (
    prevDeal.id !== nextDeal.id ||
    prevDeal.deal_name !== nextDeal.deal_name ||
    prevDeal.description !== nextDeal.description ||
    prevDeal.status !== nextDeal.status ||
    prevDeal.deal_type !== nextDeal.deal_type ||
    prevDeal.target_close_date !== nextDeal.target_close_date ||
    prevDeal.created_at !== nextDeal.created_at
  ) {
    return false;
  }

  // Compare stats object if present
  const prevStats = prevDeal.stats;
  const nextStats = nextDeal.stats;
  if (prevStats !== nextStats) {
    if (!prevStats || !nextStats) {
      return false;
    }
    if (
      prevStats.total_terms !== nextStats.total_terms ||
      prevStats.agreed_terms !== nextStats.agreed_terms ||
      prevStats.pending_proposals !== nextStats.pending_proposals ||
      prevStats.participant_count !== nextStats.participant_count
    ) {
      return false;
    }
  }

  return true;
}

export const DealCard = memo(function DealCard({ deal, onDelete, onStatusChange, isStatusPending }: DealCardProps) {
  const status = statusConfig[deal.status as keyof typeof statusConfig] || statusConfig.draft;
  const StatusIcon = status.icon;
  const isPending = isStatusPending ?? false;

  // Calculate urgency based on target close date
  const urgency = useMemo(() => {
    // Only show urgency for active deals
    if (deal.status !== 'active' && deal.status !== 'draft') {
      return { level: null, daysRemaining: null, isOverdue: false, label: null };
    }
    return calculateUrgency(deal.target_close_date);
  }, [deal.target_close_date, deal.status]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getProgressPercentage = () => {
    if (!deal.stats) return 0;
    const total = deal.stats.total_terms || 0;
    const agreed = deal.stats.agreed_terms || 0;
    if (total <= 0) return 0;
    const percentage = Math.round((agreed / total) * 100);
    // Clamp to valid range to guard against edge cases (NaN, Infinity, negative values)
    return Math.min(100, Math.max(0, Number.isFinite(percentage) ? percentage : 0));
  };

  // Get card styling based on urgency level
  const getCardClassName = () => {
    const baseClasses = 'transition-all duration-200';

    switch (urgency.level) {
      case 'critical':
        return cn(
          baseClasses,
          'border-red-400 border-2 shadow-[0_0_12px_rgba(239,68,68,0.25)] hover:shadow-[0_0_16px_rgba(239,68,68,0.35)]',
          'animate-pulse-urgent'
        );
      case 'warning':
        return cn(
          baseClasses,
          'border-amber-400 border-2 shadow-[0_0_12px_rgba(245,158,11,0.2)] hover:shadow-[0_0_16px_rgba(245,158,11,0.3)]'
        );
      default:
        return cn(baseClasses, 'hover:shadow-md');
    }
  };

  return (
    <Card className={getCardClassName()} data-testid={`deal-card-${deal.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={cn(status.color, isPending && 'opacity-70')} data-testid={`deal-card-${deal.id}-status`}>
                {isPending ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <StatusIcon className="w-3 h-3 mr-1" />
                )}
                {status.label}
              </Badge>
              <Badge variant="outline" className="bg-zinc-50" data-testid={`deal-card-${deal.id}-type`}>
                {dealTypeLabels[deal.deal_type] || deal.deal_type}
              </Badge>
            </div>

            <Link href={`/deals/${deal.id}`} data-testid={`deal-card-${deal.id}-link`}>
              <h3 className="text-lg font-semibold text-zinc-900 hover:text-blue-600 transition-colors">
                {deal.deal_name}
              </h3>
            </Link>

            {deal.description && (
              <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{deal.description}</p>
            )}

            {/* Stats Row */}
            <div className="flex items-center gap-4 mt-3 text-sm text-zinc-500">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{deal.stats?.participant_count || 0} participants</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                <span>{deal.stats?.total_terms || 0} terms</span>
              </div>
              {deal.stats?.pending_proposals && deal.stats.pending_proposals > 0 && (
                <div className="flex items-center gap-1 text-amber-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>{deal.stats.pending_proposals} pending</span>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {(deal.stats?.total_terms || 0) > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                  <span>Negotiation Progress</span>
                  <span>{getProgressPercentage()}% agreed</span>
                </div>
                <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${getProgressPercentage()}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`deal-card-${deal.id}-menu`}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" data-testid={`deal-card-${deal.id}-menu-content`}>
              <DropdownMenuItem asChild data-testid={`deal-card-${deal.id}-view`}>
                <Link href={`/deals/${deal.id}`}>View Deal</Link>
              </DropdownMenuItem>
              {deal.status === 'draft' && (
                <DropdownMenuItem
                  onClick={() => onStatusChange?.(deal.id, 'active')}
                  disabled={isPending}
                  data-testid={`deal-card-${deal.id}-activate`}
                >
                  {isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                  Activate Deal
                </DropdownMenuItem>
              )}
              {deal.status === 'active' && (
                <>
                  <DropdownMenuItem
                    onClick={() => onStatusChange?.(deal.id, 'paused')}
                    disabled={isPending}
                    data-testid={`deal-card-${deal.id}-pause`}
                  >
                    {isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                    Pause Deal
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onStatusChange?.(deal.id, 'agreed')}
                    disabled={isPending}
                    data-testid={`deal-card-${deal.id}-agree`}
                  >
                    {isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                    Mark as Agreed
                  </DropdownMenuItem>
                </>
              )}
              {deal.status === 'paused' && (
                <DropdownMenuItem
                  onClick={() => onStatusChange?.(deal.id, 'active')}
                  disabled={isPending}
                  data-testid={`deal-card-${deal.id}-resume`}
                >
                  {isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                  Resume Deal
                </DropdownMenuItem>
              )}
              {deal.status === 'draft' && (
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => onDelete?.(deal.id)}
                  data-testid={`deal-card-${deal.id}-delete`}
                >
                  Delete Draft
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-100 text-xs text-zinc-400">
          <span>Created {formatDate(deal.created_at)}</span>
          {deal.target_close_date && (
            <>
              {urgency.label ? (
                <Badge
                  variant="outline"
                  className={cn(
                    'flex items-center gap-1 font-medium',
                    urgency.level === 'critical' && 'bg-red-50 text-red-700 border-red-200',
                    urgency.level === 'warning' && 'bg-amber-50 text-amber-700 border-amber-200'
                  )}
                  data-testid={`deal-card-${deal.id}-urgency-badge`}
                >
                  {urgency.level === 'critical' ? (
                    <AlertTriangle className="w-3 h-3" />
                  ) : (
                    <Clock className="w-3 h-3" />
                  )}
                  {urgency.label}
                </Badge>
              ) : (
                <span className="flex items-center gap-1" data-testid={`deal-card-${deal.id}-target-date`}>
                  <Clock className="w-3 h-3" />
                  Target: {formatDate(deal.target_close_date)}
                </span>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}, arePropsEqual);
