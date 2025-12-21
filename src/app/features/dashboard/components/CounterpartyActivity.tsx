'use client';

import React, { memo, useMemo } from 'react';
import {
  Eye,
  FileEdit,
  MessageSquare,
  HelpCircle,
  CheckCircle,
  XCircle,
  Building2,
  ExternalLink,
  Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { CounterpartyAction } from '../lib/mocks';

interface CounterpartyActivityProps {
  actions: CounterpartyAction[];
  maxItems?: number;
  onActionClick?: (action: CounterpartyAction) => void;
  onViewDealRoom?: (dealId: string) => void;
}

type ActionType = CounterpartyAction['actionType'];

const actionTypeConfig: Record<
  ActionType,
  { icon: typeof Eye; color: string; bgColor: string; label: string; pulse?: boolean }
> = {
  viewing: {
    icon: Eye,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Viewing',
    pulse: true,
  },
  proposing: {
    icon: FileEdit,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    label: 'Drafting proposal',
    pulse: true,
  },
  commented: {
    icon: MessageSquare,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    label: 'Commented',
  },
  requested: {
    icon: HelpCircle,
    color: 'text-zinc-600',
    bgColor: 'bg-zinc-100',
    label: 'Requested',
  },
  approved: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'Approved',
  },
  rejected: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Rejected',
  },
};

const resourceTypeLabels: Record<CounterpartyAction['resourceType'], string> = {
  term: 'Term',
  document: 'Document',
  condition: 'Condition',
  general: 'General',
};

const ActiveIndicator = memo(function ActiveIndicator() {
  return (
    <span className="flex items-center gap-1 text-[10px] font-medium text-green-600">
      <Radio className="w-2.5 h-2.5 animate-pulse" />
      LIVE
    </span>
  );
});

const CounterpartyActionItem = memo(function CounterpartyActionItem({
  action,
  index,
  onClick,
  onViewDealRoom,
}: {
  action: CounterpartyAction;
  index: number;
  onClick?: () => void;
  onViewDealRoom?: (dealId: string) => void;
}) {
  const config = actionTypeConfig[action.actionType];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'relative p-3 rounded-lg border',
        'transition-all duration-200',
        action.isActive
          ? 'border-green-200 bg-green-50/50'
          : 'border-zinc-100 bg-white hover:bg-zinc-50',
        'animate-in fade-in slide-in-from-right-2'
      )}
      style={{ animationDelay: `${index * 40}ms`, animationFillMode: 'both' }}
      data-testid={`counterparty-action-${action.id}`}
    >
      {/* Active indicator */}
      {action.isActive && (
        <div className="absolute top-2 right-2">
          <ActiveIndicator />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-2">
        {/* Action Type Icon */}
        <div className={cn('flex-shrink-0 p-1.5 rounded-md', config.bgColor)}>
          <Icon className={cn('w-3.5 h-3.5', config.color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-900">
              {action.counterpartyName}
            </span>
            <span className="text-xs text-zinc-400">•</span>
            <span className="text-xs text-zinc-500">{action.counterpartyOrg}</span>
          </div>

          {/* Action description */}
          <div className="mt-1">
            <span className="text-sm text-zinc-600">{action.description}</span>
          </div>

          {/* Resource and deal badges */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {action.dealName}
            </Badge>
            {action.resourceName && (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 max-w-[120px] truncate"
                    >
                      {resourceTypeLabels[action.resourceType]}: {action.resourceName}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      {resourceTypeLabels[action.resourceType]}: {action.resourceName}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <span className="text-[10px] text-zinc-400 ml-auto">
              {action.relativeTime}
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-100">
        <button
          onClick={() => onViewDealRoom?.(action.dealId)}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium',
            'bg-zinc-100 text-zinc-700',
            'transition-all duration-200 hover:bg-zinc-200',
            'focus:outline-none focus:ring-2 focus:ring-blue-400'
          )}
          data-testid={`counterparty-action-view-deal-${action.id}`}
        >
          <ExternalLink className="w-3 h-3" />
          View in Deal Room
        </button>
        {action.isActive && (
          <button
            onClick={onClick}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium',
              'bg-green-600 text-white',
              'transition-all duration-200 hover:bg-green-700',
              'focus:outline-none focus:ring-2 focus:ring-green-400'
            )}
            data-testid={`counterparty-action-respond-${action.id}`}
          >
            Respond Now
          </button>
        )}
      </div>
    </div>
  );
});

export const CounterpartyActivity = memo(function CounterpartyActivity({
  actions,
  maxItems = 4,
  onActionClick,
  onViewDealRoom,
}: CounterpartyActivityProps) {
  // Separate active and past actions
  const { activeActions, pastActions } = useMemo(() => {
    const active = actions.filter((a) => a.isActive);
    const past = actions.filter((a) => !a.isActive);
    return { activeActions: active, pastActions: past };
  }, [actions]);

  // Combine with active first, limited to maxItems
  const displayedActions = useMemo(() => {
    const combined = [...activeActions, ...pastActions];
    return combined.slice(0, maxItems);
  }, [activeActions, pastActions, maxItems]);

  const activeCount = activeActions.length;

  return (
    <Card className="h-full" data-testid="counterparty-activity-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">
              Counterparty Activity
            </CardTitle>
            {activeCount > 0 && (
              <Badge
                variant="success"
                className="text-[10px] px-1.5 py-0 animate-pulse"
              >
                {activeCount} active
              </Badge>
            )}
          </div>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                  aria-label="What is counterparty activity?"
                  data-testid="counterparty-activity-help"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[200px]">
                <p className="text-xs">
                  Real-time visibility into what counterparties are viewing or
                  proposing in your active deals.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {displayedActions.length > 0 ? (
          <div className="space-y-3">
            {displayedActions.map((action, index) => (
              <CounterpartyActionItem
                key={action.id}
                action={action}
                index={index}
                onClick={() => onActionClick?.(action)}
                onViewDealRoom={onViewDealRoom}
              />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <Building2 className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">No counterparty activity</p>
            <p className="text-xs text-zinc-300 mt-1">
              Activity will appear here when counterparties engage with your deals
            </p>
          </div>
        )}

        {actions.length > maxItems && (
          <button
            onClick={() => onViewDealRoom?.('all')}
            className={cn(
              'w-full mt-3 py-2 text-sm font-medium text-zinc-600',
              'rounded-md border border-zinc-200',
              'transition-all duration-200 hover:bg-zinc-50 hover:text-zinc-900',
              'focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2'
            )}
            data-testid="counterparty-activity-view-all"
          >
            View all counterparty activity
          </button>
        )}
      </CardContent>
    </Card>
  );
});
