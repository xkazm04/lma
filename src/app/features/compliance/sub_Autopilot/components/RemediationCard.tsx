'use client';

import React, { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  FileEdit,
  FileCheck,
  Cog,
  GitBranch,
  Building,
  TrendingUp,
  RefreshCw,
  Users,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Circle,
  Clock,
  DollarSign,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RemediationStrategy, ImplementationStep } from '../lib/types';
import { getRemediationStrategyLabel } from '../lib/types';
import { getNotificationPriorityColor } from '@/lib/utils';

interface RemediationCardProps {
  remediation: RemediationStrategy;
  onStartStep?: (stepNumber: number) => void;
  onCompleteStep?: (stepNumber: number) => void;
}

function getStrategyIcon(type: RemediationStrategy['strategy_type']) {
  switch (type) {
    case 'covenant_amendment':
      return FileEdit;
    case 'waiver_request':
      return FileCheck;
    case 'operational_improvement':
      return Cog;
    case 'debt_restructuring':
      return GitBranch;
    case 'asset_sale':
      return Building;
    case 'equity_injection':
      return TrendingUp;
    case 'refinancing':
      return RefreshCw;
    case 'stakeholder_negotiation':
      return Users;
    default:
      return Cog;
  }
}

function getStepIcon(status: ImplementationStep['status']) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'in_progress':
      return <Clock className="w-4 h-4 text-blue-600" />;
    default:
      return <Circle className="w-4 h-4 text-zinc-400" />;
  }
}

function getDifficultyColor(difficulty: RemediationStrategy['implementation_difficulty']) {
  switch (difficulty) {
    case 'low':
      return 'bg-green-100 text-green-700';
    case 'medium':
      return 'bg-amber-100 text-amber-700';
    case 'high':
      return 'bg-red-100 text-red-700';
  }
}

const StepItem = memo(function StepItem({
  step,
  onStart,
  onComplete,
}: {
  step: ImplementationStep;
  onStart?: () => void;
  onComplete?: () => void;
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border transition-colors',
        step.status === 'completed'
          ? 'bg-green-50 border-green-200'
          : step.status === 'in_progress'
            ? 'bg-blue-50 border-blue-200'
            : 'bg-white border-zinc-200'
      )}
      data-testid={`step-item-${step.step_number}`}
    >
      <div className="mt-0.5">{getStepIcon(step.status)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-zinc-900">
            {step.step_number}. {step.title}
          </span>
          {step.status === 'pending' && onStart && (
            <Button
              variant="outline"
              size="sm"
              onClick={onStart}
              className="h-6 text-xs"
              data-testid={`start-step-btn-${step.step_number}`}
            >
              Start
            </Button>
          )}
          {step.status === 'in_progress' && onComplete && (
            <Button
              size="sm"
              onClick={onComplete}
              className="h-6 text-xs bg-green-600 hover:bg-green-700"
              data-testid={`complete-step-btn-${step.step_number}`}
            >
              Complete
            </Button>
          )}
        </div>
        <p className="text-xs text-zinc-600 mt-1">{step.description}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
          <span>{step.responsible_party}</span>
          {step.due_date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(step.due_date).toLocaleDateString()}
            </span>
          )}
        </div>
        {step.documents_required.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {step.documents_required.map((doc, idx) => (
              <Badge key={idx} className="text-xs bg-zinc-100 text-zinc-600">
                {doc}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export const RemediationCard = memo(function RemediationCard({
  remediation,
  onStartStep,
  onCompleteStep,
}: RemediationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const Icon = getStrategyIcon(remediation.strategy_type);

  const completedSteps = remediation.implementation_steps.filter(
    (s) => s.status === 'completed'
  ).length;
  const totalSteps = remediation.implementation_steps.length;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);

  const isActive = remediation.status === 'in_progress';
  const isCritical = remediation.priority === 'critical';

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md',
        isCritical && 'border-red-200 bg-red-50/30',
        isActive && 'border-blue-200'
      )}
      data-testid={`remediation-card-${remediation.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'p-2 rounded-lg shrink-0',
                isActive ? 'bg-blue-100' : 'bg-purple-100'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5',
                  isActive ? 'text-blue-600' : 'text-purple-600'
                )}
              />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                {remediation.strategy_title}
                <Badge className={cn('text-xs', getNotificationPriorityColor(remediation.priority))}>
                  {remediation.priority}
                </Badge>
                <Badge className={cn('text-xs', getDifficultyColor(remediation.implementation_difficulty))}>
                  {remediation.implementation_difficulty} difficulty
                </Badge>
              </CardTitle>
              <p className="text-xs text-zinc-500 mt-1">
                {getRemediationStrategyLabel(remediation.strategy_type)} |{' '}
                {remediation.time_to_implement}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            data-testid="remediation-expand-btn"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-zinc-700">{remediation.strategy_description}</p>

        {/* Effectiveness Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
            <p className="text-xs text-green-600 font-medium">Effectiveness</p>
            <p className="text-lg font-bold text-green-700">
              {remediation.estimated_effectiveness}%
            </p>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-xs text-blue-600 font-medium">Headroom Improvement</p>
            <p className="text-lg font-bold text-blue-700">
              +{remediation.projected_headroom_improvement}%
            </p>
          </div>
          <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
            <p className="text-xs text-purple-600 font-medium">Breach Risk Reduction</p>
            <p className="text-lg font-bold text-purple-700">
              -{remediation.projected_breach_probability_reduction}%
            </p>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-zinc-700">
              Implementation Progress
            </span>
            <span className="text-sm text-zinc-500">
              {completedSteps}/{totalSteps} steps
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Cost Estimate */}
        {remediation.estimated_cost && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-zinc-50 border border-zinc-200">
            <DollarSign className="w-4 h-4 text-zinc-600" />
            <span className="text-sm text-zinc-700">
              Estimated Cost:{' '}
              <strong>
                ${remediation.estimated_cost.total_estimated_cost.toLocaleString()}
              </strong>
            </span>
            <Badge className="text-xs bg-zinc-100 text-zinc-600 ml-auto">
              {remediation.estimated_cost.confidence_level} confidence
            </Badge>
          </div>
        )}

        {/* Expanded Content */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t border-zinc-200 animate-in fade-in slide-in-from-top-2">
            {/* Implementation Steps */}
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 mb-3">
                Implementation Steps
              </h4>
              <div className="space-y-2">
                {remediation.implementation_steps.map((step) => (
                  <StepItem
                    key={step.step_number}
                    step={step}
                    onStart={() => onStartStep?.(step.step_number)}
                    onComplete={() => onCompleteStep?.(step.step_number)}
                  />
                ))}
              </div>
            </div>

            {/* Required Approvals */}
            {remediation.required_approvals.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 mb-2">
                  Required Approvals
                </h4>
                <div className="flex flex-wrap gap-2">
                  {remediation.required_approvals.map((approval, idx) => (
                    <Badge key={idx} className="text-xs bg-amber-100 text-amber-700">
                      {approval}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Key Stakeholders */}
            {remediation.key_stakeholders.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 mb-2">
                  Key Stakeholders
                </h4>
                <div className="flex flex-wrap gap-2">
                  {remediation.key_stakeholders.map((stakeholder, idx) => (
                    <Badge key={idx} className="text-xs bg-blue-100 text-blue-700">
                      {stakeholder}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Implementation Risks */}
            {remediation.implementation_risks.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Implementation Risks
                </h4>
                <ul className="space-y-1">
                  {remediation.implementation_risks.map((risk, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm text-zinc-700"
                    >
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cost Breakdown */}
            {remediation.estimated_cost &&
              remediation.estimated_cost.cost_breakdown.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-zinc-900 mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-zinc-600" />
                    Cost Breakdown
                  </h4>
                  <div className="space-y-2">
                    {remediation.estimated_cost.cost_breakdown.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded bg-zinc-50"
                      >
                        <div>
                          <span className="text-sm font-medium text-zinc-900">
                            {item.category}
                          </span>
                          <p className="text-xs text-zinc-500">{item.description}</p>
                        </div>
                        <span className="text-sm font-semibold text-zinc-900">
                          ${item.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default RemediationCard;
