'use client';

import React, { memo, useState, useMemo, type ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ChevronDown,
  ChevronUp,
  Target,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  Zap,
  Play,
  ArrowRight,
  Lightbulb,
  Building2,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';
import type {
  ActionableEntity,
  EntityBase,
  ActionBase,
  OutcomeBase,
  EntityState,
  ActionPriority,
  ActionCategory,
  FinancialImpact,
} from '../lib/actionable-entity';
import type { RiskLevel } from '../lib/types';
import { formatCurrency } from '../lib/formatters';

// ============================================
// Types
// ============================================

interface ActionableEntityCardProps<
  E extends EntityBase,
  A extends ActionBase,
  O extends OutcomeBase
> {
  /** The actionable entity to render */
  entity: ActionableEntity<E, A, O>;
  /** Callback when primary action is triggered */
  onPrimaryAction?: (entity: ActionableEntity<E, A, O>, action: A) => void;
  /** Callback when secondary action is triggered */
  onSecondaryAction?: (entity: ActionableEntity<E, A, O>) => void;
  /** Callback when entity details are requested */
  onViewDetails?: (entity: ActionableEntity<E, A, O>) => void;
  /** Custom render for entity header */
  renderEntityHeader?: (entity: E) => ReactNode;
  /** Custom render for outcome details */
  renderOutcomeDetails?: (outcome: OutcomeBase) => ReactNode;
  /** Whether card is initially expanded */
  defaultExpanded?: boolean;
  /** Custom labels for buttons */
  labels?: {
    primaryAction?: string;
    secondaryAction?: string;
    viewDetails?: string;
  };
  /** Visual variant */
  variant?: 'default' | 'compact' | 'detailed';
  /** Whether to show all actions or just recommended */
  showAllActions?: boolean;
}

// ============================================
// Helper Components
// ============================================

const priorityColors: Record<ActionPriority, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-green-100 text-green-700 border-green-200',
};

const riskColors: Record<RiskLevel, string> = {
  critical: 'text-red-600',
  high: 'text-orange-600',
  medium: 'text-amber-600',
  low: 'text-green-600',
};

const categoryIcons: Record<ActionCategory, LucideIcon> = {
  operational: Zap,
  capital: DollarSign,
  strategic: Target,
  regulatory: Shield,
  portfolio: BarChart3,
  monitoring: Clock,
};

const StatusIndicator = memo(function StatusIndicator({ state }: { state: EntityState }) {
  const getStatusConfig = () => {
    if (state.status === 'off_track' || state.riskLevel === 'critical') {
      return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100', label: 'Critical' };
    }
    if (state.status === 'at_risk' || state.riskLevel === 'high') {
      return { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100', label: 'At Risk' };
    }
    if (state.status === 'on_track') {
      return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'On Track' };
    }
    return { icon: Clock, color: 'text-zinc-600', bg: 'bg-zinc-100', label: 'Pending' };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${config.bg}`}>
      <Icon className={`w-3.5 h-3.5 ${config.color}`} />
      <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
    </div>
  );
});

const FinancialImpactDisplay = memo(function FinancialImpactDisplay({
  impact,
  showDetailed = false,
}: {
  impact: FinancialImpact;
  showDetailed?: boolean;
}) {
  const hasMarginImpact = impact.marginImpactBps !== undefined;
  const hasMonetaryValue = impact.monetaryValue !== undefined;
  const isPositive = (impact.marginImpactBps ?? 0) < 0 || (impact.monetaryValue ?? 0) > 0;

  return (
    <div className={`p-3 rounded-lg ${isPositive ? 'bg-green-50' : 'bg-red-50'}`}>
      <div className="flex items-center gap-2 mb-1">
        {isPositive ? (
          <TrendingUp className="w-4 h-4 text-green-600" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-600" />
        )}
        <span className={`text-xs ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
          Financial Impact
        </span>
      </div>
      <div className="space-y-1">
        {hasMarginImpact && (
          <div className={`text-lg font-bold ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
            {impact.marginImpactBps! > 0 ? '+' : ''}{impact.marginImpactBps}bps
          </div>
        )}
        {hasMonetaryValue && showDetailed && (
          <div className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(impact.monetaryValue!)}
          </div>
        )}
        {impact.percentageChange !== undefined && showDetailed && (
          <div className="text-xs text-zinc-500">
            {impact.percentageChange > 0 ? '+' : ''}{impact.percentageChange.toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
});

const ActionItem = memo(function ActionItem<A extends ActionBase>({
  action,
  onExecute,
  isRecommended,
}: {
  action: A;
  onExecute?: (action: A) => void;
  isRecommended?: boolean;
}) {
  const CategoryIcon = categoryIcons[action.category];

  return (
    <div
      className={`p-3 rounded-lg border transition-all ${
        isRecommended
          ? 'border-blue-200 bg-blue-50/50 hover:border-blue-300'
          : 'border-zinc-200 bg-white hover:border-zinc-300'
      }`}
      data-testid={`action-item-${action.id}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded ${isRecommended ? 'bg-blue-100' : 'bg-zinc-100'}`}>
            <CategoryIcon className={`w-4 h-4 ${isRecommended ? 'text-blue-600' : 'text-zinc-600'}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900">{action.title}</p>
            {isRecommended && (
              <Badge variant="outline" className="text-blue-600 border-blue-200 mt-0.5">
                <Lightbulb className="w-3 h-3 mr-1" />
                Recommended
              </Badge>
            )}
          </div>
        </div>
        <Badge className={priorityColors[action.priority]}>
          {action.priority}
        </Badge>
      </div>

      <p className="text-xs text-zinc-500 mb-3">{action.description}</p>

      <div className="grid grid-cols-3 gap-2 text-center mb-3">
        <div className="p-2 rounded bg-zinc-50">
          <div className="text-xs text-zinc-400">Risk</div>
          <div className={`text-sm font-medium ${riskColors[action.riskLevel]}`}>
            {action.riskLevel}
          </div>
        </div>
        <div className="p-2 rounded bg-zinc-50">
          <div className="text-xs text-zinc-400">Time</div>
          <div className="text-sm font-medium text-zinc-700">{action.timeToImplement}</div>
        </div>
        {action.estimatedCost !== undefined && (
          <div className="p-2 rounded bg-zinc-50">
            <div className="text-xs text-zinc-400">Cost</div>
            <div className="text-sm font-medium text-zinc-700">
              {formatCurrency(action.estimatedCost)}
            </div>
          </div>
        )}
      </div>

      {onExecute && (
        <Button
          size="sm"
          variant={isRecommended ? 'default' : 'outline'}
          className="w-full"
          onClick={() => onExecute(action)}
          data-testid={`execute-action-${action.id}`}
        >
          <Play className="w-3 h-3 mr-1" />
          Take Action
        </Button>
      )}
    </div>
  );
});

const OutcomePreview = memo(function OutcomePreview({
  outcome,
  renderCustom,
}: {
  outcome: OutcomeBase;
  renderCustom?: (outcome: OutcomeBase) => ReactNode;
}) {
  if (renderCustom) {
    return <>{renderCustom(outcome)}</>;
  }

  const confidenceColor =
    outcome.confidence === 'high' ? 'text-green-600' :
    outcome.confidence === 'medium' ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-white border border-purple-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-purple-900">Predicted Outcome</span>
        <Badge variant="outline" className={`${confidenceColor} border-current`}>
          {outcome.probability}% likely
        </Badge>
      </div>

      <p className="text-sm text-zinc-600 mb-3">{outcome.summary}</p>

      <div className="grid grid-cols-2 gap-2">
        <FinancialImpactDisplay impact={outcome.financialImpact} />

        <div className="p-3 rounded-lg bg-zinc-50">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-zinc-600" />
            <span className="text-xs text-zinc-500">Time Horizon</span>
          </div>
          <div className="text-sm font-medium text-zinc-700">{outcome.timeHorizon}</div>
        </div>
      </div>

      {outcome.benefits && outcome.benefits.length > 0 && (
        <div className="mt-3 pt-3 border-t border-purple-100">
          <div className="text-xs text-zinc-500 mb-1">Key Benefits</div>
          <div className="flex flex-wrap gap-1">
            {outcome.benefits.map((benefit, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {benefit}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

const EntityProgress = memo(function EntityProgress({ state }: { state: EntityState }) {
  if (state.currentValue === undefined || state.targetValue === undefined) {
    return null;
  }

  const progress = Math.min(100, (state.currentValue / state.targetValue) * 100);
  const isOnTrack = progress >= 80;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-500">Progress to Target</span>
        <span className={isOnTrack ? 'text-green-600' : 'text-amber-600'}>
          {progress.toFixed(0)}%
        </span>
      </div>
      <Progress
        value={progress}
        className={`h-2 ${isOnTrack ? 'bg-green-100' : 'bg-amber-100'}`}
      />
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>Current: {state.currentValue.toLocaleString()}</span>
        <span>Target: {state.targetValue.toLocaleString()}</span>
      </div>
    </div>
  );
});

// ============================================
// Main Component
// ============================================

function ActionableEntityCardInner<
  E extends EntityBase,
  A extends ActionBase,
  O extends OutcomeBase
>({
  entity,
  onPrimaryAction,
  onSecondaryAction,
  onViewDetails,
  renderEntityHeader,
  renderOutcomeDetails,
  defaultExpanded = false,
  labels = {},
  variant = 'default',
  showAllActions = false,
}: ActionableEntityCardProps<E, A, O>) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const {
    recommendedAction,
    displayActions,
    bestOutcome,
  } = useMemo(() => {
    const recommended = entity.availableActions.find(a => a.isRecommended);
    const actions = showAllActions
      ? entity.availableActions
      : entity.availableActions.filter(a => a.isRecommended);

    // Get outcomes - handle both Map and Record
    const outcomes = entity.predictedOutcomes instanceof Map
      ? Array.from(entity.predictedOutcomes.values())
      : Object.values(entity.predictedOutcomes);

    const best = outcomes.sort((a, b) => b.probability - a.probability)[0];

    return {
      recommendedAction: recommended,
      displayActions: actions,
      bestOutcome: best,
    };
  }, [entity, showAllActions]);

  const borderColor = entity.requiresAttention
    ? 'border-red-200 hover:border-red-300'
    : 'border-zinc-200 hover:border-zinc-300';

  const headerBg = entity.requiresAttention
    ? 'bg-red-50/50'
    : 'bg-zinc-50/50';

  return (
    <Card
      className={`transition-all duration-300 ${borderColor} animate-in fade-in slide-in-from-bottom-4`}
      data-testid={`actionable-entity-card-${entity.id}`}
    >
      <CardHeader className={headerBg}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {renderEntityHeader ? (
              renderEntityHeader(entity.entity)
            ) : (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white shadow-sm">
                  <Building2 className="w-5 h-5 text-zinc-600" />
                </div>
                <div>
                  <CardTitle className="text-base">{entity.entity.name}</CardTitle>
                  {entity.entity.description && (
                    <CardDescription>{entity.entity.description}</CardDescription>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <StatusIndicator state={entity.currentState} />
            {entity.currentState.daysToDeadline !== undefined && (
              <Badge variant="outline" className="text-zinc-600">
                <Clock className="w-3 h-3 mr-1" />
                {entity.currentState.daysToDeadline}d
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Progress Section */}
        <EntityProgress state={entity.currentState} />

        {/* Best Outcome Preview */}
        {bestOutcome && variant !== 'compact' && (
          <OutcomePreview outcome={bestOutcome} renderCustom={renderOutcomeDetails} />
        )}

        {/* Recommended Action Quick View */}
        {recommendedAction && !isExpanded && (
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  {recommendedAction.title}
                </span>
              </div>
              <Button
                size="sm"
                onClick={() => onPrimaryAction?.(entity, recommendedAction)}
                data-testid={`quick-action-${entity.id}`}
              >
                <ArrowRight className="w-3 h-3 mr-1" />
                {labels.primaryAction ?? 'Take Action'}
              </Button>
            </div>
          </div>
        )}

        {/* Expand/Collapse */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between"
          onClick={() => setIsExpanded(!isExpanded)}
          data-testid={`expand-toggle-${entity.id}`}
        >
          <span className="text-sm">
            {displayActions.length} Action{displayActions.length !== 1 ? 's' : ''} Available
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>

        {/* Expanded Actions List */}
        {isExpanded && (
          <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
            {displayActions.map((action) => (
              <ActionItem
                key={action.id}
                action={action}
                onExecute={(a) => onPrimaryAction?.(entity, a as A)}
                isRecommended={action.isRecommended}
              />
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-zinc-200">
          {onViewDetails && (
            <Button
              variant="outline"
              onClick={() => onViewDetails(entity)}
              data-testid={`view-details-${entity.id}`}
            >
              {labels.viewDetails ?? 'View Details'}
            </Button>
          )}
          {onSecondaryAction && (
            <Button
              variant="ghost"
              onClick={() => onSecondaryAction(entity)}
              data-testid={`secondary-action-${entity.id}`}
            >
              {labels.secondaryAction ?? 'More Options'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Export memoized version with generic constraint
export const ActionableEntityCard = memo(ActionableEntityCardInner) as typeof ActionableEntityCardInner;

// ============================================
// List Component
// ============================================

interface ActionableEntityListProps<
  E extends EntityBase,
  A extends ActionBase,
  O extends OutcomeBase
> {
  entities: ActionableEntity<E, A, O>[];
  onPrimaryAction?: (entity: ActionableEntity<E, A, O>, action: A) => void;
  onSecondaryAction?: (entity: ActionableEntity<E, A, O>) => void;
  onViewDetails?: (entity: ActionableEntity<E, A, O>) => void;
  emptyMessage?: string;
  sortByPriority?: boolean;
  filterRequiringAttention?: boolean;
  maxItems?: number;
}

export function ActionableEntityList<
  E extends EntityBase,
  A extends ActionBase,
  O extends OutcomeBase
>({
  entities,
  onPrimaryAction,
  onSecondaryAction,
  onViewDetails,
  emptyMessage = 'No actionable items found.',
  sortByPriority = true,
  filterRequiringAttention = false,
  maxItems,
}: ActionableEntityListProps<E, A, O>) {
  const displayEntities = useMemo(() => {
    let result = [...entities];

    if (filterRequiringAttention) {
      result = result.filter(e => e.requiresAttention);
    }

    if (sortByPriority) {
      result.sort((a, b) => (b.priorityRank ?? 0) - (a.priorityRank ?? 0));
    }

    if (maxItems !== undefined) {
      result = result.slice(0, maxItems);
    }

    return result;
  }, [entities, sortByPriority, filterRequiringAttention, maxItems]);

  if (displayEntities.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">
        <Target className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="actionable-entity-list">
      {displayEntities.map((entity) => (
        <ActionableEntityCard
          key={entity.id}
          entity={entity}
          onPrimaryAction={onPrimaryAction}
          onSecondaryAction={onSecondaryAction}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
}
