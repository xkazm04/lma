'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Circle,
  CheckCircle2,
  AlertCircle,
  Clock,
  GitBranch,
  Zap,
} from 'lucide-react';
import type { EventCascade, CausalPattern, CausalChainInstance } from '../../lib/temporal-graph-types';
import { getEntityTypeColor, getEntityTypeLabel, getCausalRelationColor, getCausalRelationLabel } from '../../lib/temporal-graph-types';

interface CausalChainVisualizationProps {
  cascade?: EventCascade;
  pattern?: CausalPattern;
  activeInstance?: CausalChainInstance;
}

export const CausalChainVisualization = memo(function CausalChainVisualization({
  cascade,
  pattern,
  activeInstance,
}: CausalChainVisualizationProps) {
  if (cascade) {
    return <CascadeView cascade={cascade} />;
  }

  if (pattern) {
    return <PatternView pattern={pattern} activeInstance={activeInstance} />;
  }

  return null;
});

interface CascadeViewProps {
  cascade: EventCascade;
}

function CascadeView({ cascade }: CascadeViewProps) {
  const allEvents = [cascade.trigger_event, ...cascade.cascade_events];

  return (
    <Card data-testid="cascade-visualization">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-muted-foreground" />
            Event Cascade
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cascade.is_active ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}
            >
              {cascade.is_active ? 'Active' : 'Completed'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Cascade Metrics */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-lg font-semibold">{cascade.total_impact.entities_affected}</div>
            <div className="text-xs text-muted-foreground">Entities</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-lg font-semibold">{cascade.total_impact.states_changed}</div>
            <div className="text-xs text-muted-foreground">State Changes</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-lg font-semibold">{cascade.depth}</div>
            <div className="text-xs text-muted-foreground">Depth</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-lg font-semibold">{cascade.total_impact.duration_days}d</div>
            <div className="text-xs text-muted-foreground">Duration</div>
          </div>
        </div>

        {/* Event Flow */}
        <div className="space-y-0">
          {allEvents.map((event, idx) => {
            const edge = idx > 0 ? cascade.cascade_edges[idx - 1] : null;
            const isFirst = idx === 0;
            const isLast = idx === allEvents.length - 1;

            return (
              <div key={event.id} data-testid={`cascade-event-${idx}`}>
                {/* Edge (if not first) */}
                {edge && (
                  <div className="flex items-center gap-2 py-2 pl-6">
                    <div className="flex-1 border-l-2 border-dashed border-muted-foreground/30 h-4" />
                    <div className={`flex items-center gap-1.5 text-xs ${getCausalRelationColor(edge.relation_type)}`}>
                      <ArrowRight className="h-3 w-3" />
                      <span>{getCausalRelationLabel(edge.relation_type)}</span>
                      <span className="text-muted-foreground">({edge.time_delta_days}d)</span>
                    </div>
                    <div className="flex-1 border-l-2 border-dashed border-muted-foreground/30 h-4" />
                  </div>
                )}

                {/* Event Node */}
                <div className={`flex items-center gap-3 p-3 rounded-lg ${
                  isFirst ? 'bg-red-50 border border-red-200' :
                  isLast ? 'bg-green-50 border border-green-200' :
                  'bg-muted/30'
                }`}>
                  <div className={`p-1.5 rounded-full ${
                    isFirst ? 'bg-red-100' :
                    isLast ? 'bg-green-100' :
                    'bg-muted'
                  }`}>
                    {isFirst && <Zap className="h-4 w-4 text-red-600" />}
                    {isLast && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    {!isFirst && !isLast && <Circle className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getEntityTypeColor(event.entity_type)}>
                        {getEntityTypeLabel(event.entity_type)}
                      </Badge>
                      <span className="font-medium text-sm">{event.entity_name}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="font-medium">{event.state}</span>
                      <span>{new Date(event.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {isFirst && (
                    <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                      Trigger
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface PatternViewProps {
  pattern: CausalPattern;
  activeInstance?: CausalChainInstance;
}

function PatternView({ pattern, activeInstance }: PatternViewProps) {
  const chain = pattern.canonical_chain;
  const stats = pattern.statistics;

  return (
    <Card data-testid="pattern-visualization">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{pattern.name}</CardTitle>
          <Badge
            variant="outline"
            className={
              chain.outcome_type === 'negative'
                ? 'bg-red-100 text-red-700 border-red-200'
                : chain.outcome_type === 'positive'
                ? 'bg-green-100 text-green-700 border-green-200'
                : 'bg-zinc-100 text-zinc-700 border-zinc-200'
            }
          >
            {chain.outcome_type === 'negative' ? 'Risk Pattern' :
             chain.outcome_type === 'positive' ? 'Recovery Pattern' : 'Neutral'}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{pattern.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pattern Flow */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getEntityTypeColor(chain.entry_point.entity_type)}>
              {chain.entry_point.state}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <ArrowRight className="h-4 w-4" />
            <span className="text-sm">{stats.avg_duration_days} days avg</span>
            <ArrowRight className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getEntityTypeColor(chain.exit_point.entity_type)}>
              {chain.exit_point.state}
            </Badge>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{stats.total_occurrences}</div>
            <div className="text-xs text-muted-foreground">Occurrences</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{stats.completion_probability}%</div>
            <div className="text-xs text-muted-foreground">Probability</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{stats.avg_duration_days}d</div>
            <div className="text-xs text-muted-foreground">Avg Duration</div>
          </div>
        </div>

        {/* Duration Range */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Duration Range</span>
            <span>{stats.min_duration_days}d - {stats.max_duration_days}d</span>
          </div>
          <div className="relative h-2 bg-muted rounded-full">
            <div
              className={`absolute h-full rounded-full ${
                chain.outcome_type === 'negative' ? 'bg-red-400' :
                chain.outcome_type === 'positive' ? 'bg-green-400' : 'bg-zinc-400'
              }`}
              style={{
                left: `${(stats.min_duration_days / stats.max_duration_days) * 100}%`,
                width: `${((stats.avg_duration_days - stats.min_duration_days) / stats.max_duration_days) * 100}%`,
              }}
            />
            <div
              className="absolute h-4 w-1 -top-1 bg-foreground rounded"
              style={{ left: `${(stats.avg_duration_days / stats.max_duration_days) * 100}%` }}
            />
          </div>
        </div>

        {/* Outcome Distribution */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Outcome Distribution</div>
          <div className="flex gap-1 h-3 rounded-full overflow-hidden">
            {stats.outcome_distribution.positive > 0 && (
              <div
                className="bg-green-500"
                style={{ width: `${(stats.outcome_distribution.positive / stats.total_occurrences) * 100}%` }}
              />
            )}
            {stats.outcome_distribution.neutral > 0 && (
              <div
                className="bg-zinc-400"
                style={{ width: `${(stats.outcome_distribution.neutral / stats.total_occurrences) * 100}%` }}
              />
            )}
            {stats.outcome_distribution.negative > 0 && (
              <div
                className="bg-red-500"
                style={{ width: `${(stats.outcome_distribution.negative / stats.total_occurrences) * 100}%` }}
              />
            )}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Positive ({stats.outcome_distribution.positive})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-zinc-400" />
              Neutral ({stats.outcome_distribution.neutral})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Negative ({stats.outcome_distribution.negative})
            </span>
          </div>
        </div>

        {/* Recommended Actions */}
        {pattern.recommended_actions.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Recommended Actions</div>
            <ul className="space-y-1">
              {pattern.recommended_actions.map((action, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  {action}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Active Instance */}
        {activeInstance && (
          <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50" data-testid="active-instance">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="font-medium text-sm">Active Instance</span>
            </div>
            <div className="text-sm text-muted-foreground">
              <div>{activeInstance.facility_name} - {activeInstance.borrower_name}</div>
              <div className="flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />
                Started: {new Date(activeInstance.started_at).toLocaleDateString()}
                {activeInstance.current_position !== undefined && (
                  <span className="ml-2">
                    (Step {activeInstance.current_position + 1})
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tags */}
        {pattern.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {pattern.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
