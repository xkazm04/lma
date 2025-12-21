'use client';

import React, { memo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Clock,
  Users,
  FileText,
  MessageSquare,
  Calendar,
  Check,
  BellOff,
  MoreHorizontal,
  ChevronRight,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { PrioritizedDeal, TriageAction } from '../../lib/priority-calculation';

interface PriorityDealCardProps {
  deal: PrioritizedDeal;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onTriageAction: (dealId: string, action: TriageAction) => void;
}

const priorityConfig = {
  critical: {
    label: 'Critical',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-300',
    textClass: 'text-red-700',
    badgeClass: 'bg-red-100 text-red-700 border-red-200',
    glowClass: 'shadow-[0_0_12px_rgba(239,68,68,0.2)]',
    icon: AlertTriangle,
  },
  high: {
    label: 'High',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-300',
    textClass: 'text-amber-700',
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
    glowClass: 'shadow-[0_0_8px_rgba(245,158,11,0.15)]',
    icon: Clock,
  },
  medium: {
    label: 'Medium',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    textClass: 'text-blue-700',
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
    glowClass: '',
    icon: Clock,
  },
  low: {
    label: 'Low',
    bgClass: 'bg-green-50',
    borderClass: 'border-green-200',
    textClass: 'text-green-700',
    badgeClass: 'bg-green-100 text-green-700 border-green-200',
    glowClass: '',
    icon: Check,
  },
};

const dealTypeLabels: Record<string, string> = {
  new_facility: 'New Facility',
  amendment: 'Amendment',
  refinancing: 'Refinancing',
  extension: 'Extension',
  consent: 'Consent',
  waiver: 'Waiver',
};

const QuickActionButton = memo(function QuickActionButton({
  icon: Icon,
  label,
  shortcut,
  onClick,
  testId,
}: {
  icon: LucideIcon;
  label: string;
  shortcut: string;
  onClick: () => void;
  testId: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClick();
            }}
            data-testid={testId}
          >
            <Icon className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {label} <kbd className="ml-1 px-1 py-0.5 bg-zinc-100 rounded text-[10px]">{shortcut}</kbd>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

export const PriorityDealCard = memo(function PriorityDealCard({
  deal,
  index,
  isSelected,
  onSelect,
  onTriageAction,
}: PriorityDealCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const config = priorityConfig[deal.priority.level];
  const PriorityIcon = config.icon;

  const progress = deal.stats?.total_terms
    ? Math.round((deal.stats.agreed_terms / deal.stats.total_terms) * 100)
    : 0;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div
      className={cn(
        'animate-in slide-in-from-left-4 fade-in duration-300',
        'transition-all'
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <Card
        className={cn(
          'transition-all duration-200 cursor-pointer',
          'border-l-4',
          config.borderClass,
          isSelected && 'ring-2 ring-blue-500 ring-offset-1',
          isHovered && 'shadow-md',
          deal.priority.level === 'critical' && config.glowClass
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onSelect(deal.id)}
        data-testid={`priority-deal-card-${deal.id}`}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            {/* Priority Indicator */}
            <div
              className={cn(
                'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                config.bgClass
              )}
            >
              <PriorityIcon className={cn('w-5 h-5', config.textClass)} />
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant="outline"
                  className={cn('text-[10px] px-1.5 py-0', config.badgeClass)}
                  data-testid={`priority-deal-card-${deal.id}-priority`}
                >
                  <Zap className="w-2.5 h-2.5 mr-0.5" />
                  {config.label}
                </Badge>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-zinc-50">
                  {dealTypeLabels[deal.deal_type] || deal.deal_type}
                </Badge>
                {deal.priority.score >= 50 && (
                  <span className="animate-pulse">
                    <span className="inline-block w-2 h-2 bg-red-500 rounded-full" />
                  </span>
                )}
              </div>

              <Link href={`/deals/${deal.id}`} onClick={(e) => e.stopPropagation()}>
                <h3
                  className="font-semibold text-zinc-900 hover:text-blue-600 transition-colors truncate text-sm"
                  data-testid={`priority-deal-card-${deal.id}-name`}
                >
                  {deal.deal_name}
                </h3>
              </Link>

              {/* Priority Reason */}
              <p className={cn('text-xs mt-1', config.textClass)}>
                {deal.priority.primaryReason}
              </p>

              {/* Stats Row */}
              <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {deal.stats?.participant_count || 0}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {deal.stats?.agreed_terms || 0}/{deal.stats?.total_terms || 0} terms
                </span>
                {(deal.stats?.pending_proposals || 0) > 0 && (
                  <span className="flex items-center gap-1 text-amber-600 font-medium">
                    <MessageSquare className="w-3 h-3" />
                    {deal.stats?.pending_proposals} pending
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              {deal.stats && deal.stats.total_terms > 0 && (
                <div className="mt-2">
                  <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        progress >= 75
                          ? 'bg-green-500'
                          : progress >= 50
                            ? 'bg-blue-500'
                            : progress >= 25
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right Side - Actions & Date */}
            <div className="flex-shrink-0 flex flex-col items-end gap-2">
              {/* Quick Actions - Show on hover */}
              <div
                className={cn(
                  'flex items-center gap-0.5 transition-opacity duration-150',
                  isHovered || isSelected ? 'opacity-100' : 'opacity-0'
                )}
              >
                <QuickActionButton
                  icon={MessageSquare}
                  label="Respond to Proposals"
                  shortcut="R"
                  onClick={() => onTriageAction(deal.id, 'respond_proposals')}
                  testId={`priority-deal-card-${deal.id}-respond`}
                />
                <QuickActionButton
                  icon={Calendar}
                  label="Schedule Follow-up"
                  shortcut="F"
                  onClick={() => onTriageAction(deal.id, 'schedule_followup')}
                  testId={`priority-deal-card-${deal.id}-followup`}
                />
                <QuickActionButton
                  icon={Check}
                  label="Mark as Reviewed"
                  shortcut="D"
                  onClick={() => onTriageAction(deal.id, 'mark_reviewed')}
                  testId={`priority-deal-card-${deal.id}-reviewed`}
                />
                <QuickActionButton
                  icon={BellOff}
                  label="Snooze"
                  shortcut="S"
                  onClick={() => onTriageAction(deal.id, 'snooze_24h')}
                  testId={`priority-deal-card-${deal.id}-snooze`}
                />
              </div>

              {/* Target Date */}
              {deal.target_close_date && (
                <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(deal.target_close_date)}
                </div>
              )}

              {/* View Deal Arrow */}
              <Link
                href={`/deals/${deal.id}`}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  'flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors',
                  'opacity-0 group-hover:opacity-100',
                  isHovered && 'opacity-100'
                )}
                data-testid={`priority-deal-card-${deal.id}-view`}
              >
                View <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Action Suggestion */}
          {(isSelected || (isHovered && deal.priority.level !== 'low')) && (
            <div
              className={cn(
                'mt-2 pt-2 border-t border-zinc-100 text-xs',
                'animate-in fade-in slide-in-from-top-1 duration-200'
              )}
            >
              <span className="text-zinc-400">Suggested action:</span>{' '}
              <span className={config.textClass}>{deal.priority.actionSuggestion}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});
