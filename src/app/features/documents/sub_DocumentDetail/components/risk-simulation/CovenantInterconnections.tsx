'use client';

import React, { memo, useMemo } from 'react';
import { Network, ArrowRight, LinkIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { RiskScenarioSimulationResult, BreachedCovenant } from '@/lib/llm/risk-scenario-simulation';

interface CovenantInterconnectionsProps {
  covenantInterconnections: RiskScenarioSimulationResult['covenantInterconnections'];
  breachedCovenants: BreachedCovenant[];
  allCovenantNames: Record<string, string>; // Map of covenantId to covenantName
}

const connectionTypeColors: Record<string, string> = {
  direct_dependency: 'border-red-300 bg-red-50',
  shared_metric: 'border-blue-300 bg-blue-50',
  cascading_impact: 'border-purple-300 bg-purple-50',
  cross_default: 'border-red-400 bg-red-100',
};

const connectionTypeLabels: Record<string, string> = {
  direct_dependency: 'Direct Dependency',
  shared_metric: 'Shared Metric',
  cascading_impact: 'Cascading Impact',
  cross_default: 'Cross Default',
};

const strengthColors: Record<string, string> = {
  weak: 'text-zinc-500',
  moderate: 'text-amber-600',
  strong: 'text-red-600',
};

export const CovenantInterconnections = memo(function CovenantInterconnections({
  covenantInterconnections,
  breachedCovenants,
  allCovenantNames,
}: CovenantInterconnectionsProps) {
  const breachedIds = useMemo(
    () => new Set(breachedCovenants.map(c => c.covenantId)),
    [breachedCovenants]
  );

  // Group interconnections by connection type
  const groupedConnections = useMemo(() => {
    const groups: Record<string, typeof covenantInterconnections> = {};
    covenantInterconnections.forEach(conn => {
      if (!groups[conn.connectionType]) {
        groups[conn.connectionType] = [];
      }
      groups[conn.connectionType].push(conn);
    });
    return groups;
  }, [covenantInterconnections]);

  // Calculate risk nodes (covenants that are part of interconnections with breached covenants)
  const riskNodes = useMemo(() => {
    const nodes = new Set<string>();
    covenantInterconnections.forEach(conn => {
      if (breachedIds.has(conn.sourceCovenantId)) {
        nodes.add(conn.targetCovenantId);
      }
      if (breachedIds.has(conn.targetCovenantId)) {
        nodes.add(conn.sourceCovenantId);
      }
    });
    return nodes;
  }, [covenantInterconnections, breachedIds]);

  if (covenantInterconnections.length === 0) {
    return (
      <Card className="border-zinc-200" data-testid="covenant-interconnections-empty">
        <CardContent className="py-6">
          <div className="text-center">
            <Network className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
            <div className="font-medium text-zinc-600">No Interconnections Identified</div>
            <div className="text-sm text-zinc-500">
              Covenants in this document operate independently
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid="covenant-interconnections">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-purple-600" />
            <CardTitle className="text-base">Covenant Interconnections</CardTitle>
          </div>
          <CardDescription>
            How covenants are related and how breaches can cascade
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Risk Summary */}
          {riskNodes.size > 0 && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-2 text-amber-800 font-medium text-sm">
                <LinkIcon className="w-4 h-4" />
                {riskNodes.size} covenant(s) at elevated risk due to interconnections
              </div>
            </div>
          )}

          {/* Interconnection Groups */}
          {Object.entries(groupedConnections).map(([type, connections]) => (
            <div key={type} className="space-y-2">
              <div className="text-xs font-medium text-zinc-500 uppercase">
                {connectionTypeLabels[type] || type}
              </div>
              {connections.map((conn, idx) => {
                const sourceBreached = breachedIds.has(conn.sourceCovenantId);
                const targetBreached = breachedIds.has(conn.targetCovenantId);
                const isRiskPath = sourceBreached || targetBreached;

                return (
                  <div
                    key={idx}
                    className={cn(
                      'p-3 rounded-lg border',
                      connectionTypeColors[conn.connectionType],
                      isRiskPath && 'ring-2 ring-red-300'
                    )}
                    data-testid={`interconnection-${idx}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {/* Source Covenant */}
                      <div className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        sourceBreached ? 'bg-red-200 text-red-800' : 'bg-zinc-100 text-zinc-700'
                      )}>
                        {allCovenantNames[conn.sourceCovenantId] || conn.sourceCovenantId}
                        {sourceBreached && ' (BREACHED)'}
                      </div>

                      <ArrowRight className={cn('w-4 h-4', strengthColors[conn.connectionStrength])} />

                      {/* Target Covenant */}
                      <div className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        targetBreached ? 'bg-red-200 text-red-800' :
                          (sourceBreached && riskNodes.has(conn.targetCovenantId)) ? 'bg-amber-100 text-amber-800' :
                            'bg-zinc-100 text-zinc-700'
                      )}>
                        {allCovenantNames[conn.targetCovenantId] || conn.targetCovenantId}
                        {targetBreached && ' (BREACHED)'}
                        {sourceBreached && riskNodes.has(conn.targetCovenantId) && !targetBreached && ' (AT RISK)'}
                      </div>

                      <Badge variant="outline" className={cn('ml-auto text-xs', strengthColors[conn.connectionStrength])}>
                        {conn.connectionStrength}
                      </Badge>
                    </div>

                    <p className="text-xs text-zinc-600">{conn.description}</p>
                  </div>
                );
              })}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Visual Network (Simplified) */}
      <Card data-testid="network-visualization">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Network Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 justify-center p-4">
            {Object.entries(allCovenantNames).map(([id, name]) => {
              const isBreached = breachedIds.has(id);
              const isAtRisk = riskNodes.has(id) && !isBreached;

              return (
                <div
                  key={id}
                  className={cn(
                    'px-3 py-2 rounded-lg border text-xs font-medium transition-all',
                    isBreached && 'bg-red-100 border-red-300 text-red-800 ring-2 ring-red-400',
                    isAtRisk && 'bg-amber-100 border-amber-300 text-amber-800',
                    !isBreached && !isAtRisk && 'bg-green-50 border-green-200 text-green-700'
                  )}
                  data-testid={`network-node-${id}`}
                >
                  {name}
                </div>
              );
            })}
          </div>
          <div className="flex justify-center gap-4 mt-2 text-xs text-zinc-500">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-100 border border-red-300" />
              Breached
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
              At Risk
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-50 border border-green-200" />
              Safe
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
