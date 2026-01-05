'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  ArrowRight,
  Lightbulb,
  Activity,
  BarChart3,
} from 'lucide-react';
import type { FacilityPrediction } from '../../lib/temporal-graph-types';
import { getRiskLevelColor, getRiskLevelLabel, getEntityTypeColor } from '../../lib/temporal-graph-types';

interface FacilityPredictionPanelProps {
  prediction: FacilityPrediction;
}

export const FacilityPredictionPanel = memo(function FacilityPredictionPanel({
  prediction,
}: FacilityPredictionPanelProps) {
  const { risk_assessment, active_patterns, predicted_states, interventions } = prediction;

  return (
    <div className="space-y-4" data-testid="facility-prediction-panel">
      {/* Risk Assessment Summary */}
      <Card className="border-2" data-testid="risk-assessment-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Predictive Risk Assessment
            </CardTitle>
            <Badge
              variant="outline"
              className={`${getRiskLevelColor(risk_assessment.risk_level)} border`}
              data-testid="risk-level-badge"
            >
              {getRiskLevelLabel(risk_assessment.risk_level)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Risk Score and Trajectory */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold" data-testid="risk-score">
                  {risk_assessment.overall_score}
                </div>
                <div className="text-xs text-muted-foreground">Risk Score</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="flex items-center gap-1.5">
                {risk_assessment.trajectory === 'improving' && (
                  <TrendingDown className="h-5 w-5 text-green-600" />
                )}
                {risk_assessment.trajectory === 'deteriorating' && (
                  <TrendingUp className="h-5 w-5 text-red-600" />
                )}
                {risk_assessment.trajectory === 'stable' && (
                  <ArrowRight className="h-5 w-5 text-zinc-500" />
                )}
                <span className="text-sm capitalize" data-testid="risk-trajectory">
                  {risk_assessment.trajectory}
                </span>
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <div>Confidence: {prediction.overall_confidence}%</div>
              <div className="text-xs">
                {prediction.prediction_horizon_days} day horizon
              </div>
            </div>
          </div>

          {/* Default Probability Grid */}
          <div className="grid grid-cols-4 gap-2" data-testid="default-probability-grid">
            {Object.entries(risk_assessment.default_probability).map(([period, prob]) => (
              <div
                key={period}
                className="text-center p-2 rounded-lg bg-muted/50"
              >
                <div className="text-lg font-semibold">{prob.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">
                  {period.replace('days_', '')} days
                </div>
              </div>
            ))}
          </div>

          {/* Risk Factors */}
          {risk_assessment.risk_factors.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Key Risk Factors</div>
              <div className="space-y-1.5">
                {risk_assessment.risk_factors.slice(0, 3).map((factor, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm"
                    data-testid={`risk-factor-${idx}`}
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      <span>{factor.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Impact: {factor.impact_score}</span>
                      {factor.trend === 'increasing' && (
                        <TrendingUp className="h-3 w-3 text-red-500" />
                      )}
                      {factor.trend === 'decreasing' && (
                        <TrendingDown className="h-3 w-3 text-green-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Patterns */}
      {active_patterns.length > 0 && (
        <Card data-testid="active-patterns-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              Active Pattern Detection
              <Badge variant="secondary" className="ml-1">{active_patterns.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {active_patterns.map((pattern, idx) => (
              <div
                key={pattern.pattern_id}
                className="p-3 rounded-lg border bg-card"
                data-testid={`active-pattern-${idx}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium">{pattern.pattern_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {pattern.match_confidence}% match confidence
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      pattern.expected_outcome === 'negative'
                        ? 'bg-red-100 text-red-700 border-red-200'
                        : pattern.expected_outcome === 'positive'
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                    }
                  >
                    {pattern.expected_outcome === 'negative' ? 'Risk' :
                     pattern.expected_outcome === 'positive' ? 'Recovery' : 'Neutral'}
                  </Badge>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-xs">
                    <span>Progress: Step {pattern.progress.current_step}/{pattern.progress.total_steps}</span>
                    <span>{pattern.progress.percentage}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        pattern.expected_outcome === 'negative' ? 'bg-red-500' :
                        pattern.expected_outcome === 'positive' ? 'bg-green-500' : 'bg-zinc-500'
                      }`}
                      style={{ width: `${pattern.progress.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Predictions */}
                {pattern.predicted_remaining.length > 0 && (
                  <div className="space-y-1">
                    {pattern.predicted_remaining.map((pred, predIdx) => (
                      <div
                        key={predIdx}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <ArrowRight className="h-3 w-3" />
                        <span>{pred.description}</span>
                        <span className="text-xs">({pred.probability}% in ~{pred.estimated_days}d)</span>
                      </div>
                    ))}
                  </div>
                )}

                {pattern.days_until_critical !== undefined && pattern.days_until_critical < 60 && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
                    <Clock className="h-3 w-3" />
                    {pattern.days_until_critical} days until critical point
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Predicted State Transitions */}
      {predicted_states.length > 0 && (
        <Card data-testid="predicted-states-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Predicted State Transitions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {predicted_states.slice(0, 4).map((state, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                  data-testid={`predicted-state-${idx}`}
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={getEntityTypeColor(state.entity_type)}
                    >
                      {state.entity_type}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="font-medium">{state.current_state}</span>
                      <ArrowRight className="h-3 w-3" />
                      <span className="font-medium">{state.predicted_state}</span>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div>{state.probability}% probability</div>
                    <div className="text-xs text-muted-foreground">
                      ~{state.estimated_days} days
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommended Interventions */}
      {interventions.length > 0 && (
        <Card data-testid="interventions-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-muted-foreground" />
              Recommended Interventions
              <Badge variant="secondary" className="ml-1">{interventions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {interventions.map((intervention, idx) => (
              <div
                key={intervention.id}
                className={`p-3 rounded-lg border ${
                  intervention.priority === 'critical'
                    ? 'border-red-200 bg-red-50/50'
                    : intervention.priority === 'high'
                    ? 'border-orange-200 bg-orange-50/50'
                    : intervention.priority === 'medium'
                    ? 'border-amber-200 bg-amber-50/50'
                    : 'border-zinc-200 bg-zinc-50/50'
                }`}
                data-testid={`intervention-${idx}`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="font-medium text-sm">{intervention.title}</div>
                  <Badge
                    variant="outline"
                    className={
                      intervention.priority === 'critical'
                        ? 'bg-red-100 text-red-700 border-red-200'
                        : intervention.priority === 'high'
                        ? 'bg-orange-100 text-orange-700 border-orange-200'
                        : intervention.priority === 'medium'
                        ? 'bg-amber-100 text-amber-700 border-amber-200'
                        : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                    }
                  >
                    {intervention.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {intervention.description}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span className="text-muted-foreground">
                    Expected: {intervention.expected_impact}
                  </span>
                </div>
                {intervention.deadline && (
                  <div className="flex items-center gap-2 text-xs mt-1">
                    <Clock className="h-3 w-3 text-amber-600" />
                    <span className="text-muted-foreground">
                      Deadline: {new Date(intervention.deadline).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
});
