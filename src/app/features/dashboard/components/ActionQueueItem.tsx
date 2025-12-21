'use client';

import React, { memo } from 'react';
import {
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Play,
  Pause,
  AlertTriangle,
  Bot,
  User,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ActionQueueItem as ActionQueueItemType, ActionQueueStatus } from '../lib/mocks';

interface ActionQueueItemProps {
  item: ActionQueueItemType;
  index?: number;
  compact?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onExecute?: () => void;
  onCancel?: () => void;
  onClick?: () => void;
}

const statusConfig: Record<
  ActionQueueStatus,
  {
    icon: typeof Clock;
    label: string;
    color: string;
    bgColor: string;
  }
> = {
  queued: {
    icon: Clock,
    label: 'Queued',
    color: 'text-zinc-600',
    bgColor: 'bg-zinc-100',
  },
  auto_approved: {
    icon: Bot,
    label: 'Auto-Approved',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  pending_review: {
    icon: User,
    label: 'Needs Review',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  executing: {
    icon: Loader2,
    label: 'Executing',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  completed: {
    icon: CheckCircle2,
    label: 'Completed',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  failed: {
    icon: XCircle,
    label: 'Failed',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
};

const impactConfig = {
  low: { color: 'text-zinc-500', bgColor: 'bg-zinc-100' },
  medium: { color: 'text-blue-600', bgColor: 'bg-blue-100' },
  high: { color: 'text-orange-600', bgColor: 'bg-orange-100' },
  critical: { color: 'text-red-600', bgColor: 'bg-red-100' },
};

const ConfidenceIndicator = memo(function ConfidenceIndicator({
  score,
  threshold,
  showThreshold = false,
}: {
  score: number;
  threshold?: number;
  showThreshold?: boolean;
}) {
  const getColor = (s: number) => {
    if (s >= 85) return 'bg-green-500';
    if (s >= 70) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Zap className={cn('w-3 h-3', score >= 85 ? 'text-green-600' : score >= 70 ? 'text-amber-600' : 'text-red-600')} />
        <span className={cn('text-xs font-semibold', score >= 85 ? 'text-green-600' : score >= 70 ? 'text-amber-600' : 'text-red-600')}>
          {score}%
        </span>
      </div>
      {showThreshold && threshold && (
        <span className="text-[10px] text-zinc-400">/ {threshold}%</span>
      )}
      <div className="w-16 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', getColor(score))} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
});

export const ActionQueueItemComponent = memo(function ActionQueueItemComponent({
  item,
  index = 0,
  compact = false,
  onApprove,
  onReject,
  onExecute,
  onCancel,
  onClick,
}: ActionQueueItemProps) {
  const config = statusConfig[item.status];
  const impactCfg = impactConfig[item.estimatedImpact];
  const StatusIcon = config.icon;

  const isPendingReview = item.status === 'pending_review';
  const isAutoApproved = item.status === 'auto_approved';
  const isExecuting = item.status === 'executing';

  if (compact) {
    return (
      <div
        className={cn(
          'p-2.5 rounded-lg border border-zinc-100 bg-white hover:border-zinc-200 transition-all cursor-pointer group animate-in fade-in slide-in-from-left-2',
          isPendingReview && 'border-amber-200 bg-amber-50/30',
          isAutoApproved && 'border-green-200 bg-green-50/30'
        )}
        style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.();
          }
        }}
        data-testid={`action-queue-item-${item.id}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn('p-1 rounded', config.bgColor)}>
              <StatusIcon className={cn('w-3.5 h-3.5', config.color, isExecuting && 'animate-spin')} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-900 truncate">
                {item.intervention.title}
              </p>
              <p className="text-[10px] text-zinc-500 truncate">
                {item.intervention.borrowerName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ConfidenceIndicator score={item.confidenceScore} />
            <Badge
              variant={item.autoApprovalEligible ? 'default' : 'secondary'}
              className="text-[9px] px-1.5 py-0"
            >
              {item.autoApprovalEligible ? 'Auto' : 'Manual'}
            </Badge>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'p-3 rounded-lg border border-zinc-100 bg-white hover:shadow-md transition-all cursor-pointer group animate-in fade-in slide-in-from-bottom-2',
        isPendingReview && 'border-amber-200 bg-gradient-to-r from-amber-50/50 to-white',
        isAutoApproved && 'border-green-200 bg-gradient-to-r from-green-50/50 to-white'
      )}
      style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'both' }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      data-testid={`action-queue-item-${item.id}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-2 min-w-0">
          <div className={cn('p-1.5 rounded-lg mt-0.5', config.bgColor)}>
            <StatusIcon className={cn('w-4 h-4', config.color, isExecuting && 'animate-spin')} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h4 className="text-sm font-medium text-zinc-900 truncate">
                {item.intervention.title}
              </h4>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {config.label}
              </Badge>
              <Badge
                variant={item.autoApprovalEligible ? 'default' : 'outline'}
                className="text-[10px] px-1.5 py-0"
              >
                {item.autoApprovalEligible ? (
                  <>
                    <Bot className="w-2.5 h-2.5 mr-0.5" />
                    Auto
                  </>
                ) : (
                  <>
                    <User className="w-2.5 h-2.5 mr-0.5" />
                    Manual
                  </>
                )}
              </Badge>
              <Badge
                variant="secondary"
                className={cn('text-[10px] px-1.5 py-0', impactCfg.color)}
              >
                {item.estimatedImpact} impact
              </Badge>
            </div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Description */}
      <p className="text-xs text-zinc-600 line-clamp-2 mb-2">
        {item.intervention.description}
      </p>

      {/* Confidence Section */}
      <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 mb-2">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-indigo-600" />
            <span className="text-[10px] font-medium text-indigo-600">Confidence Score</span>
          </div>
          <span className={cn(
            'text-sm font-bold',
            item.confidenceScore >= 85 ? 'text-green-600' : item.confidenceScore >= 70 ? 'text-amber-600' : 'text-red-600'
          )}>
            {item.confidenceScore}%
          </span>
        </div>
        <Progress value={item.confidenceScore} className="h-1.5 mb-2" />

        {/* Top Confidence Factors */}
        <div className="space-y-1">
          {item.confidenceFactors.slice(0, 2).map((factor, idx) => (
            <div key={idx} className="flex items-center justify-between text-[10px]">
              <span className="text-zinc-600 truncate">{factor.factor}</span>
              <span className={cn(
                'font-medium',
                factor.score >= 80 ? 'text-green-600' : factor.score >= 60 ? 'text-amber-600' : 'text-red-600'
              )}>
                {factor.score}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Auto-Approval Status */}
      {item.autoApprovalEligible ? (
        <div className="p-2 rounded-lg bg-green-50 border border-green-100 mb-2">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            <span className="text-[10px] text-green-700">{item.autoApprovalReason}</span>
          </div>
          {item.scheduledExecutionTime && (
            <div className="flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3 text-green-600" />
              <span className="text-[10px] text-green-600">
                Scheduled: {new Date(item.scheduledExecutionTime).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      ) : item.autoApprovalBlockers && item.autoApprovalBlockers.length > 0 ? (
        <div className="p-2 rounded-lg bg-amber-50 border border-amber-100 mb-2">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[10px] font-medium text-amber-700">Requires Review</span>
          </div>
          <ul className="space-y-0.5">
            {item.autoApprovalBlockers.slice(0, 2).map((blocker, idx) => (
              <li key={idx} className="text-[10px] text-amber-600 flex items-start gap-1">
                <span className="text-amber-400 mt-0.5">•</span>
                <span>{blocker}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Execution Result (if completed or failed) */}
      {item.executionResult && (
        <div className={cn(
          'p-2 rounded-lg border mb-2',
          item.executionResult.success ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
        )}>
          <div className="flex items-center gap-1.5 mb-1">
            {item.executionResult.success ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-red-600" />
            )}
            <span className={cn(
              'text-[10px] font-medium',
              item.executionResult.success ? 'text-green-700' : 'text-red-700'
            )}>
              {item.executionResult.success ? 'Completed' : 'Failed'}
            </span>
          </div>
          <p className="text-[10px] text-zinc-600">{item.executionResult.outcome}</p>
          {item.executionResult.artifacts && item.executionResult.artifacts.length > 0 && (
            <div className="mt-1 pt-1 border-t border-zinc-100">
              <span className="text-[9px] text-zinc-500">
                {item.executionResult.artifacts.length} artifact(s) generated
              </span>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {(isPendingReview || isAutoApproved) && (
        <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
          {isPendingReview && (
            <>
              <Button
                size="sm"
                variant="default"
                onClick={(e) => {
                  e.stopPropagation();
                  onApprove?.();
                }}
                className="h-7 text-xs"
                data-testid={`approve-action-${item.id}`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onReject?.();
                }}
                className="h-7 text-xs"
                data-testid={`reject-action-${item.id}`}
              >
                <XCircle className="w-3.5 h-3.5 mr-1" />
                Reject
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onExecute?.();
                      }}
                      className="h-7 text-xs"
                      data-testid={`execute-now-action-${item.id}`}
                    >
                      <Play className="w-3.5 h-3.5 mr-1" />
                      Execute Now
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Skip review and execute immediately</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
          {isAutoApproved && (
            <>
              <Button
                size="sm"
                variant="default"
                onClick={(e) => {
                  e.stopPropagation();
                  onExecute?.();
                }}
                className="h-7 text-xs bg-green-600 hover:bg-green-700"
                data-testid={`execute-action-${item.id}`}
              >
                <Play className="w-3.5 h-3.5 mr-1" />
                Execute Now
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel?.();
                }}
                className="h-7 text-xs"
                data-testid={`cancel-action-${item.id}`}
              >
                <Pause className="w-3.5 h-3.5 mr-1" />
                Cancel
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
});
