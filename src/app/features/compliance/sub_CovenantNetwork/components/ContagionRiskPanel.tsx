'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ContagionRiskAssessment } from '../../lib/correlation-types';
import { AlertTriangle, TrendingDown, Clock, ChevronRight } from 'lucide-react';

interface ContagionRiskPanelProps {
  assessment: ContagionRiskAssessment;
  onCovenantClick?: (covenantId: string) => void;
}

/**
 * Displays contagion risk assessment for a covenant breach scenario.
 */
export const ContagionRiskPanel = memo(function ContagionRiskPanel({
  assessment,
  onCovenantClick,
}: ContagionRiskPanelProps) {
  const getRiskLevelColor = (level: string): string => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  const getRiskLevelBadgeColor = (level: string): string => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'medium':
        return 'bg-amber-100 text-amber-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-zinc-100 text-zinc-700';
    }
  };

  return (
    <Card data-testid="contagion-risk-panel" className="border-orange-200">
      <CardHeader className="bg-orange-50">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <CardTitle className="text-orange-900">Contagion Risk Assessment</CardTitle>
            </div>
            <CardDescription>
              Breach propagation analysis for: <strong>{assessment.source_covenant_name}</strong>
            </CardDescription>
          </div>
          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
            {assessment.portfolio_impact.estimated_breach_cascade_probability}% Cascade Risk
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Portfolio Impact Summary */}
        <div className="mb-6 p-4 bg-zinc-50 border border-zinc-200 rounded-md">
          <h4 className="text-sm font-semibold text-zinc-900 mb-3">Portfolio-Wide Impact</h4>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-zinc-500">Facilities at Risk</p>
              <p className="text-2xl font-bold text-zinc-900">
                {assessment.portfolio_impact.total_facilities_at_risk}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Covenants at Risk</p>
              <p className="text-2xl font-bold text-zinc-900">
                {assessment.portfolio_impact.total_covenants_at_risk}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Cascade Probability</p>
              <p className="text-2xl font-bold text-orange-600">
                {assessment.portfolio_impact.estimated_breach_cascade_probability}%
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Expected Timeline</p>
              <p className="text-2xl font-bold text-zinc-900">
                {assessment.portfolio_impact.expected_contagion_timeline_quarters}Q
              </p>
            </div>
          </div>
        </div>

        {/* Affected Covenants */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-zinc-900 mb-3">Affected Covenants</h4>
          <div className="space-y-3">
            {assessment.affected_covenants.map((covenant) => (
              <div
                key={covenant.covenant_id}
                className={cn(
                  'p-4 border rounded-md transition-all hover:shadow-sm',
                  getRiskLevelColor(covenant.risk_level)
                )}
                data-testid={`affected-covenant-${covenant.covenant_id}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-semibold text-sm">{covenant.covenant_name}</h5>
                      <Badge className={getRiskLevelBadgeColor(covenant.risk_level)}>
                        {covenant.risk_level.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs opacity-80">{covenant.facility_name}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCovenantClick?.(covenant.covenant_id)}
                    data-testid={`view-covenant-${covenant.covenant_id}-btn`}
                  >
                    View <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>

                <div className="grid grid-cols-4 gap-4 text-xs mt-3">
                  <div>
                    <p className="opacity-70 flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" />
                      Propagation Risk
                    </p>
                    <p className="font-semibold text-base">
                      {covenant.propagation_probability}%
                    </p>
                  </div>
                  <div>
                    <p className="opacity-70 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Impact Timeline
                    </p>
                    <p className="font-semibold text-base">
                      {covenant.expected_impact_quarters}Q
                    </p>
                  </div>
                  <div>
                    <p className="opacity-70">Current Headroom</p>
                    <p className="font-semibold text-base">
                      {covenant.current_headroom.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="opacity-70">Post-Breach Est.</p>
                    <p
                      className={cn(
                        'font-semibold text-base',
                        covenant.post_breach_headroom_estimate < 0 && 'text-red-700'
                      )}
                    >
                      {covenant.post_breach_headroom_estimate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <h4 className="text-sm font-semibold text-zinc-900 mb-3">Recommended Actions</h4>
          <div className="space-y-2">
            {assessment.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 text-sm text-zinc-700"
                data-testid={`recommendation-${idx}`}
              >
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold mt-0.5 shrink-0">
                  {idx + 1}
                </div>
                <p>{rec}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Assessment Timestamp */}
        <div className="mt-6 pt-4 border-t border-zinc-200 text-xs text-zinc-500">
          Assessment generated: {new Date(assessment.assessed_at).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
});
