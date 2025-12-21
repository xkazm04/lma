'use client';

import React, { memo } from 'react';
import {
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Intervention } from '../lib/mocks';
import {
  interventionTypeConfig,
  interventionStatusConfig,
  priorityConfig,
} from '../lib/theme';

interface InterventionCardProps {
  intervention: Intervention;
  index?: number;
  compact?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onExecute?: () => void;
  onClick?: () => void;
}

export const InterventionCard = memo(function InterventionCard({
  intervention,
  index = 0,
  compact = false,
  onApprove,
  onReject,
  onExecute,
  onClick,
}: InterventionCardProps) {
  const typeConfig = interventionTypeConfig[intervention.type];
  const statConfig = interventionStatusConfig[intervention.status];
  const priConfig = priorityConfig[intervention.priority];
  const Icon = typeConfig.icon;
  const StatusIcon = statConfig.icon;

  const isActionable = intervention.status === 'pending' && intervention.requiresApproval;
  const isExecutable = intervention.status === 'approved';

  if (compact) {
    return (
      <div
        className={cn(
          'p-2.5 rounded-lg border border-zinc-100 bg-white hover:border-zinc-200 transition-all cursor-pointer group animate-in fade-in slide-in-from-left-2'
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
        data-testid={`intervention-card-${intervention.id}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn('p-1 rounded', typeConfig.bgColor)}>
              <Icon className={cn('w-3.5 h-3.5', typeConfig.color)} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-900 truncate">
                {intervention.title}
              </p>
              <p className="text-[10px] text-zinc-500 truncate">
                {intervention.borrowerName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={priConfig.color === 'text-red-600' ? 'destructive' : 'secondary'}
              className="text-[9px] px-1.5 py-0"
            >
              {priConfig.label}
            </Badge>
            <StatusIcon className={cn('w-3.5 h-3.5', statConfig.color)} />
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
        intervention.priority === 'urgent' && 'ring-1 ring-red-200'
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
      data-testid={`intervention-card-${intervention.id}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-2 min-w-0">
          <div className={cn('p-1.5 rounded-lg mt-0.5', typeConfig.bgColor)}>
            <Icon className={cn('w-4 h-4', typeConfig.color)} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h4 className="text-sm font-medium text-zinc-900 truncate">
                {intervention.title}
              </h4>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {typeConfig.label}
              </Badge>
              <Badge
                variant={priConfig.color === 'text-red-600' ? 'destructive' : 'secondary'}
                className="text-[10px] px-1.5 py-0"
              >
                {priConfig.label}
              </Badge>
              <Badge variant={statConfig.variant} className="text-[10px] px-1.5 py-0">
                <StatusIcon className="w-2.5 h-2.5 mr-0.5" />
                {statConfig.label}
              </Badge>
            </div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Details */}
      <div className="mb-2">
        <p className="text-xs text-zinc-600 line-clamp-2">{intervention.description}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-[10px] text-zinc-500">
            <span className="font-medium">Borrower:</span> {intervention.borrowerName}
          </span>
          {intervention.facilityName && (
            <span className="text-[10px] text-zinc-500">
              <span className="font-medium">Facility:</span> {intervention.facilityName}
            </span>
          )}
        </div>
      </div>

      {/* Timing */}
      <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 mb-2">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-[10px] text-zinc-500">Optimal Timing:</span>
          <span className="text-xs font-medium text-zinc-700">
            {intervention.optimalTiming}
          </span>
        </div>
        <span className="text-[10px] text-zinc-500">
          Deadline: {intervention.deadlineDate}
        </span>
      </div>

      {/* Rationale */}
      <div className="p-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 mb-2">
        <p className="text-[10px] font-medium text-blue-600 mb-0.5">Rationale</p>
        <p className="text-[11px] text-zinc-600 line-clamp-2">{intervention.rationale}</p>
      </div>

      {/* Action Buttons */}
      {(isActionable || isExecutable) && (
        <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
          {isActionable && (
            <>
              <Button
                size="sm"
                variant="default"
                onClick={(e) => {
                  e.stopPropagation();
                  onApprove?.();
                }}
                className="h-7 text-xs"
                data-testid={`approve-intervention-${intervention.id}`}
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
                data-testid={`reject-intervention-${intervention.id}`}
              >
                <XCircle className="w-3.5 h-3.5 mr-1" />
                Reject
              </Button>
            </>
          )}
          {isExecutable && (
            <Button
              size="sm"
              variant="default"
              onClick={(e) => {
                e.stopPropagation();
                onExecute?.();
              }}
              className="h-7 text-xs bg-green-600 hover:bg-green-700"
              data-testid={`execute-intervention-${intervention.id}`}
            >
              <Loader2 className="w-3.5 h-3.5 mr-1" />
              Execute
            </Button>
          )}
        </div>
      )}
    </div>
  );
});
