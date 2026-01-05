'use client';

import React, { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  TrendingUp,
  GitBranch,
  Activity,
  Info,
} from 'lucide-react';
import { FacilityPredictionPanel } from './FacilityPredictionPanel';
import { CausalChainVisualization } from './CausalChainVisualization';
import type { FacilityPrediction, CausalPattern, EventCascade } from '../../lib/temporal-graph-types';
import { getFacilityPrediction, getAllCausalPatterns, mockEventCascades, mockTemporalInsights } from '../../lib/temporal-graph-mock-data';

interface PredictionsTabProps {
  facilityId: string;
  facilityName: string;
}

export const PredictionsTab = memo(function PredictionsTab({
  facilityId,
  facilityName,
}: PredictionsTabProps) {
  const [selectedPattern, setSelectedPattern] = useState<CausalPattern | null>(null);

  const prediction = getFacilityPrediction(facilityId);
  const allPatterns = getAllCausalPatterns();
  const relevantCascades = mockEventCascades.filter(
    c => c.trigger_event.parent_ids.facility_id === facilityId
  );
  const relevantInsights = mockTemporalInsights.filter(
    i => i.affected_facilities.includes(facilityId)
  );

  if (!prediction) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No predictive analysis available for this facility.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Predictions become available once sufficient historical data is collected.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="predictions-tab">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Predictive Intelligence
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Temporal graph analysis and causality predictions for {facilityName}
          </p>
        </div>
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
          AI-Powered Analysis
        </Badge>
      </div>

      {/* Relevant Insights Banner */}
      {relevantInsights.length > 0 && (
        <div className="space-y-2">
          {relevantInsights.map(insight => (
            <Card
              key={insight.id}
              className={`border-l-4 ${
                insight.severity === 'critical' ? 'border-l-red-500 bg-red-50/50' :
                insight.severity === 'warning' ? 'border-l-amber-500 bg-amber-50/50' :
                'border-l-blue-500 bg-blue-50/50'
              }`}
              data-testid={`insight-${insight.id}`}
            >
              <CardContent className="py-3">
                <div className="flex items-start gap-3">
                  <Info className={`h-5 w-5 mt-0.5 shrink-0 ${
                    insight.severity === 'critical' ? 'text-red-600' :
                    insight.severity === 'warning' ? 'text-amber-600' :
                    'text-blue-600'
                  }`} />
                  <div>
                    <div className="font-medium text-sm">{insight.title}</div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {insight.description}
                    </p>
                    {insight.probability && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Probability: {insight.probability}% over {insight.time_horizon_days} days
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="predictions" className="space-y-4">
        <TabsList data-testid="predictions-subtabs">
          <TabsTrigger value="predictions" data-testid="predictions-subtab">
            <Activity className="h-4 w-4 mr-1.5" />
            Predictions
          </TabsTrigger>
          <TabsTrigger value="patterns" data-testid="patterns-subtab">
            <TrendingUp className="h-4 w-4 mr-1.5" />
            Patterns
          </TabsTrigger>
          <TabsTrigger value="cascades" data-testid="cascades-subtab">
            <GitBranch className="h-4 w-4 mr-1.5" />
            Event Cascades
          </TabsTrigger>
        </TabsList>

        {/* Predictions Tab */}
        <TabsContent value="predictions" data-testid="predictions-subtab-content">
          <FacilityPredictionPanel prediction={prediction} />
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns" data-testid="patterns-subtab-content">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Pattern List */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  Detected Causal Patterns
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {allPatterns.slice(0, 6).map(pattern => {
                  const isActive = prediction.active_patterns.some(
                    ap => ap.pattern_id === pattern.id
                  );
                  const isSelected = selectedPattern?.id === pattern.id;

                  return (
                    <button
                      key={pattern.id}
                      onClick={() => setSelectedPattern(pattern)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        isSelected
                          ? 'border-purple-500 bg-purple-50'
                          : isActive
                          ? 'border-amber-300 bg-amber-50/50 hover:bg-amber-50'
                          : 'border-border hover:bg-muted/50'
                      }`}
                      data-testid={`pattern-btn-${pattern.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-sm">{pattern.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {pattern.description}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge
                            variant="outline"
                            className={
                              pattern.canonical_chain.outcome_type === 'negative'
                                ? 'bg-red-100 text-red-700 border-red-200'
                                : pattern.canonical_chain.outcome_type === 'positive'
                                ? 'bg-green-100 text-green-700 border-green-200'
                                : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                            }
                          >
                            {pattern.statistics.completion_probability}%
                          </Badge>
                          {isActive && (
                            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                              Active
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Pattern Detail */}
            <div>
              {selectedPattern ? (
                <CausalChainVisualization
                  pattern={selectedPattern}
                  activeInstance={selectedPattern.instances.find(
                    i => i.facility_id === facilityId && i.is_active
                  )}
                />
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Select a pattern to view details
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Cascades Tab */}
        <TabsContent value="cascades" data-testid="cascades-subtab-content">
          {relevantCascades.length > 0 ? (
            <div className="space-y-4">
              {relevantCascades.map(cascade => (
                <CausalChainVisualization key={cascade.id} cascade={cascade} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <GitBranch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No event cascades recorded for this facility.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Event cascades are created when significant trigger events occur.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
});
