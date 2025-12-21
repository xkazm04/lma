'use client';

import React, { memo, useState, useCallback } from 'react';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Calendar,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Zap,
  ArrowRight,
  Phone,
  Mail,
  FileText,
  UserPlus,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type {
  DealHealthSummary,
  DealAccelerationAlert,
  SuggestedIntervention,
} from '../lib/velocity-types';

interface AccelerationAlertsPanelProps {
  healthSummary: DealHealthSummary | null;
  isLoading?: boolean;
  onDismissAlert?: (alertId: string) => void;
  onActOnAlert?: (alertId: string, interventionId: string) => void;
  onScheduleCall?: (alertId: string, intervention: SuggestedIntervention) => void;
}

export const AccelerationAlertsPanel = memo(function AccelerationAlertsPanel({
  healthSummary,
  isLoading = false,
  onDismissAlert,
  onActOnAlert,
  onScheduleCall,
}: AccelerationAlertsPanelProps) {
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  const toggleAlert = useCallback((alertId: string) => {
    setExpandedAlert((prev) => (prev === alertId ? null : alertId));
  }, []);

  if (isLoading) {
    return (
      <Card className="animate-pulse" data-testid="acceleration-alerts-loading">
        <CardHeader className="pb-2">
          <div className="h-5 bg-zinc-200 rounded w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-20 bg-zinc-100 rounded" />
            <div className="h-16 bg-zinc-100 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!healthSummary) {
    return null;
  }

  const { overallHealth, healthScore, activeAlerts, velocityMetrics, executiveSummary } =
    healthSummary;

  const displayedAlerts = showAllAlerts ? activeAlerts : activeAlerts.slice(0, 3);
  const hasMoreAlerts = activeAlerts.length > 3;

  return (
    <Card
      className="animate-in fade-in slide-in-from-right-4 duration-500"
      data-testid="acceleration-alerts-panel"
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Deal Acceleration
          </CardTitle>
          <HealthBadge health={overallHealth} score={healthScore} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Health Score Progress */}
        <div className="space-y-1.5" data-testid="health-score-section">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">Deal Health Score</span>
            <span className="font-medium">{Math.round(healthScore)}/100</span>
          </div>
          <Progress
            value={healthScore}
            className="h-2"
            data-testid="health-score-progress"
          />
        </div>

        {/* Velocity Indicators */}
        <div
          className="grid grid-cols-2 gap-2 text-xs"
          data-testid="velocity-indicators"
        >
          <VelocityIndicator
            label="Activity"
            value={`${velocityMetrics.daysSinceLastActivity}d ago`}
            trend={velocityMetrics.velocityTrend}
            isWarning={velocityMetrics.daysSinceLastActivity >= 3}
          />
          <VelocityIndicator
            label="Engagement"
            value={`${Math.round(velocityMetrics.participantEngagementRate)}%`}
            trend={velocityMetrics.engagementTrend}
            isWarning={velocityMetrics.participantEngagementRate < 50}
          />
        </div>

        {/* Executive Summary */}
        <div
          className="bg-zinc-50 rounded-lg p-2.5 text-sm text-zinc-600"
          data-testid="executive-summary"
        >
          <p className="line-clamp-3">{executiveSummary}</p>
        </div>

        {/* Active Alerts */}
        {activeAlerts.length > 0 && (
          <div className="space-y-1.5" data-testid="alerts-section">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-zinc-700">
                Active Alerts ({activeAlerts.length})
              </h4>
            </div>
            <div className="space-y-1.5">
              {displayedAlerts.map((alert) => (
                <AlertItem
                  key={alert.id}
                  alert={alert}
                  isExpanded={expandedAlert === alert.id}
                  onToggle={() => toggleAlert(alert.id)}
                  onDismiss={onDismissAlert}
                  onAct={onActOnAlert}
                  onSchedule={onScheduleCall}
                />
              ))}
            </div>
            {hasMoreAlerts && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-zinc-500"
                onClick={() => setShowAllAlerts(!showAllAlerts)}
                data-testid="show-more-alerts-btn"
              >
                {showAllAlerts ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Show {activeAlerts.length - 3} More
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* No Alerts State */}
        {activeAlerts.length === 0 && (
          <div
            className="text-center py-3 text-sm text-zinc-500"
            data-testid="no-alerts-message"
          >
            <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-1.5" />
            <p>Deal is progressing smoothly</p>
            <p className="text-xs mt-1">No interventions needed at this time</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// Sub-components

interface HealthBadgeProps {
  health: 'healthy' | 'at_risk' | 'critical';
  score: number;
}

function HealthBadge({ health, score }: HealthBadgeProps) {
  const variants = {
    healthy: { variant: 'success' as const, icon: CheckCircle2 },
    at_risk: { variant: 'warning' as const, icon: AlertTriangle },
    critical: { variant: 'destructive' as const, icon: XCircle },
  };

  const { variant, icon: Icon } = variants[health];
  const label = health === 'at_risk' ? 'At Risk' : health.charAt(0).toUpperCase() + health.slice(1);

  return (
    <Badge variant={variant} className="gap-1" data-testid="health-badge">
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
}

interface VelocityIndicatorProps {
  label: string;
  value: string;
  trend: string;
  isWarning?: boolean;
}

function VelocityIndicator({ label, value, trend, isWarning }: VelocityIndicatorProps) {
  const TrendIcon =
    trend === 'accelerating' || trend === 'increasing'
      ? TrendingUp
      : trend === 'decelerating' || trend === 'decreasing'
      ? TrendingDown
      : Clock;

  const trendColor =
    trend === 'accelerating' || trend === 'increasing'
      ? 'text-green-500'
      : trend === 'decelerating' || trend === 'decreasing' || trend === 'stalled'
      ? 'text-red-500'
      : 'text-zinc-400';

  return (
    <div
      className={`flex items-center gap-2 p-2 rounded-md ${
        isWarning ? 'bg-amber-50' : 'bg-zinc-50'
      }`}
      data-testid={`velocity-indicator-${label.toLowerCase()}`}
    >
      <TrendIcon className={`w-3 h-3 ${trendColor}`} />
      <div>
        <p className="text-zinc-500">{label}</p>
        <p className={`font-medium ${isWarning ? 'text-amber-700' : 'text-zinc-900'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

interface AlertItemProps {
  alert: DealAccelerationAlert;
  isExpanded: boolean;
  onToggle: () => void;
  onDismiss?: (alertId: string) => void;
  onAct?: (alertId: string, interventionId: string) => void;
  onSchedule?: (alertId: string, intervention: SuggestedIntervention) => void;
}

function AlertItem({
  alert,
  isExpanded,
  onToggle,
  onDismiss,
  onAct,
  onSchedule,
}: AlertItemProps) {
  const severityStyles = {
    critical: 'border-red-200 bg-red-50',
    urgent: 'border-amber-200 bg-amber-50',
    warning: 'border-yellow-200 bg-yellow-50',
    info: 'border-blue-200 bg-blue-50',
  };

  const severityBadge = {
    critical: 'destructive' as const,
    urgent: 'warning' as const,
    warning: 'warning' as const,
    info: 'info' as const,
  };

  const primaryIntervention = alert.interventions.find((i) => i.priority === 'primary');

  return (
    <div
      className={`border rounded-lg overflow-hidden ${severityStyles[alert.severity]}`}
      data-testid={`alert-item-${alert.id}`}
    >
      {/* Alert Header */}
      <button
        className="w-full p-2.5 text-left flex items-start gap-2"
        onClick={onToggle}
        data-testid={`alert-toggle-${alert.id}`}
      >
        <AlertTriangle
          className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
            alert.severity === 'critical'
              ? 'text-red-500'
              : alert.severity === 'urgent'
              ? 'text-amber-500'
              : 'text-yellow-500'
          }`}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={severityBadge[alert.severity]} className="text-xs">
              {alert.severity}
            </Badge>
            <span className="text-xs text-zinc-500">{alert.category}</span>
          </div>
          <p className="font-medium text-sm text-zinc-900 truncate">{alert.title}</p>
          <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{alert.description}</p>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-zinc-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-400 flex-shrink-0" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div
          className="px-2.5 pb-2.5 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200"
          data-testid={`alert-expanded-${alert.id}`}
        >
          {/* Contextual Insight */}
          <div className="bg-white/60 rounded p-2 text-xs">
            <div className="flex items-start gap-2">
              <Sparkles className="w-3 h-3 text-purple-500 mt-0.5 flex-shrink-0" />
              <p className="text-zinc-600">{alert.contextualInsight}</p>
            </div>
          </div>

          {/* Historical Close Rate */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500">Historical close rate for similar situations:</span>
            <span
              className={`font-medium ${
                alert.historicalCloseRate >= 0.7
                  ? 'text-green-600'
                  : alert.historicalCloseRate >= 0.5
                  ? 'text-amber-600'
                  : 'text-red-600'
              }`}
            >
              {Math.round(alert.historicalCloseRate * 100)}%
            </span>
          </div>

          {/* Suggested Interventions */}
          {alert.interventions.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-zinc-700">Suggested Interventions:</p>
              {alert.interventions.slice(0, 3).map((intervention) => (
                <InterventionCard
                  key={intervention.id}
                  intervention={intervention}
                  alertId={alert.id}
                  onAct={onAct}
                  onSchedule={onSchedule}
                />
              ))}
            </div>
          )}

          {/* Alert Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200/50">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => onDismiss?.(alert.id)}
              data-testid={`dismiss-alert-${alert.id}`}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface InterventionCardProps {
  intervention: SuggestedIntervention;
  alertId: string;
  onAct?: (alertId: string, interventionId: string) => void;
  onSchedule?: (alertId: string, intervention: SuggestedIntervention) => void;
}

function InterventionCard({ intervention, alertId, onAct, onSchedule }: InterventionCardProps) {
  const getIcon = () => {
    switch (intervention.interventionType) {
      case 'schedule_call':
        return Phone;
      case 'send_summary':
        return Mail;
      case 'propose_package_deal':
        return FileText;
      case 'escalate_to_senior':
        return UserPlus;
      default:
        return ArrowRight;
    }
  };

  const Icon = getIcon();
  const hasScheduling = intervention.schedulingConfig !== undefined;
  const isPrimary = intervention.priority === 'primary';

  return (
    <div
      className={`p-2 rounded border ${
        isPrimary ? 'border-zinc-300 bg-white' : 'border-zinc-200 bg-white/50'
      }`}
      data-testid={`intervention-${intervention.id}`}
    >
      <div className="flex items-start gap-2">
        <Icon className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-zinc-800">{intervention.title}</p>
            {isPrimary && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                Recommended
              </Badge>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">{intervention.description}</p>

          {/* Impact Metrics */}
          <div className="flex items-center gap-3 mt-2 text-xs">
            <span className="text-green-600">
              +{intervention.estimatedImpact.velocityImprovement}% velocity
            </span>
            <span className="text-amber-600">
              -{intervention.estimatedImpact.stallRiskReduction}% risk
            </span>
            <span className="text-zinc-400">{intervention.timeToImplement}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-2">
            {hasScheduling ? (
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => onSchedule?.(alertId, intervention)}
                data-testid={`schedule-btn-${intervention.id}`}
              >
                <Calendar className="w-3 h-3 mr-1" />
                Schedule Call
              </Button>
            ) : (
              <Button
                size="sm"
                variant={isPrimary ? 'default' : 'outline'}
                className="h-7 text-xs"
                onClick={() => onAct?.(alertId, intervention.id)}
                data-testid={`act-btn-${intervention.id}`}
              >
                Take Action
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
