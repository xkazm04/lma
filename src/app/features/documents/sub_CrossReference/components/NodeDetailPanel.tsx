'use client';

import React from 'react';
import { X, MapPin, Link2, AlertTriangle, ArrowRight, ChevronRight, FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { CrossRefNode, ImpactAnalysis } from '../lib/types';
import {
  NODE_TYPE_LABELS,
  CATEGORY_LABELS,
  LINK_TYPE_LABELS,
  NODE_TYPE_COLORS,
  IMPACT_COLORS,
} from '../lib/types';
import { getLinksForNode, getNodeById } from '../lib/mock-data';

interface NodeDetailPanelProps {
  node: CrossRefNode;
  impactAnalysis: ImpactAnalysis | null;
  onClose: () => void;
  onNavigateToNode: (nodeId: string) => void;
  onTriggerRipple: () => void;
}

/**
 * Detail panel showing information about a selected node
 */
export function NodeDetailPanel({
  node,
  impactAnalysis,
  onClose,
  onNavigateToNode,
  onTriggerRipple,
}: NodeDetailPanelProps) {
  const links = getLinksForNode(node.id);

  return (
    <div
      className="w-80 h-full overflow-y-auto border-l border-zinc-200 bg-white"
      data-testid="node-detail-panel"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-zinc-200 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: NODE_TYPE_COLORS[node.type] }}
              />
              <Badge variant="secondary" className="text-xs">
                {NODE_TYPE_LABELS[node.type]}
              </Badge>
              {node.isModified && (
                <Badge variant="warning" className="text-xs">
                  Modified
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-zinc-900 truncate" title={node.name}>
              {node.name}
            </h3>
            <p className="text-xs text-zinc-500">
              {CATEGORY_LABELS[node.category]}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="flex-shrink-0"
            data-testid="close-node-detail-btn"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Location */}
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-zinc-600">
              {node.location.clauseRef || `Section ${node.location.section}`}
            </p>
            {node.location.page && (
              <p className="text-xs text-zinc-400">Page {node.location.page}</p>
            )}
          </div>
        </div>

        {/* Content */}
        <div>
          <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">
            Content
          </h4>
          <p className="text-sm text-zinc-700 bg-zinc-50 rounded-md p-2 border border-zinc-100">
            {node.content.length > 200 ? `${node.content.slice(0, 200)}...` : node.content}
          </p>
        </div>

        {/* Values (for definitions and covenants) */}
        {(node.currentValue || node.previousValue) && (
          <div>
            <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
              Value
            </h4>
            <div className="space-y-2">
              {node.currentValue && (
                <div className="flex items-start gap-2">
                  <Badge variant="secondary" className="text-xs flex-shrink-0">Current</Badge>
                  <span className="text-sm text-zinc-700">{node.currentValue}</span>
                </div>
              )}
              {node.previousValue && (
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="text-xs flex-shrink-0">Previous</Badge>
                  <span className="text-sm text-zinc-500 line-through">{node.previousValue}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Impact Severity */}
        <div>
          <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
            Impact if Changed
          </h4>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: IMPACT_COLORS[node.impactSeverity] }}
            />
            <span className="text-sm capitalize text-zinc-700">
              {node.impactSeverity} Impact
            </span>
            <span className="text-xs text-zinc-400">
              ({node.impactedNodeIds.length} affected terms)
            </span>
          </div>
          {node.impactSeverity !== 'none' && (
            <Button
              variant="outline"
              size="sm"
              onClick={onTriggerRipple}
              className="mt-2"
              data-testid="trigger-ripple-btn"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Show Ripple Effect
            </Button>
          )}
        </div>

        {/* Connections */}
        <div>
          <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
            Connections ({links.incoming.length + links.outgoing.length})
          </h4>

          {/* Outgoing */}
          {links.outgoing.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-zinc-400 mb-1">Outgoing ({links.outgoing.length})</p>
              <div className="space-y-1">
                {links.outgoing.slice(0, 5).map(link => {
                  const targetNode = getNodeById(link.targetId);
                  if (!targetNode) return null;
                  return (
                    <button
                      key={link.id}
                      onClick={() => onNavigateToNode(link.targetId)}
                      className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-zinc-50 transition-colors text-left group"
                      data-testid={`navigate-to-${link.targetId}`}
                    >
                      <ArrowRight className="w-3 h-3 text-zinc-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-700 truncate group-hover:text-blue-600">
                          {targetNode.name}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {LINK_TYPE_LABELS[link.type]}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-blue-500" />
                    </button>
                  );
                })}
                {links.outgoing.length > 5 && (
                  <p className="text-xs text-zinc-400 pl-2">
                    +{links.outgoing.length - 5} more
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Incoming */}
          {links.incoming.length > 0 && (
            <div>
              <p className="text-xs text-zinc-400 mb-1">Incoming ({links.incoming.length})</p>
              <div className="space-y-1">
                {links.incoming.slice(0, 5).map(link => {
                  const sourceNode = getNodeById(link.sourceId);
                  if (!sourceNode) return null;
                  return (
                    <button
                      key={link.id}
                      onClick={() => onNavigateToNode(link.sourceId)}
                      className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-zinc-50 transition-colors text-left group"
                      data-testid={`navigate-to-${link.sourceId}`}
                    >
                      <Link2 className="w-3 h-3 text-zinc-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-700 truncate group-hover:text-blue-600">
                          {sourceNode.name}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {LINK_TYPE_LABELS[link.type]}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-blue-500" />
                    </button>
                  );
                })}
                {links.incoming.length > 5 && (
                  <p className="text-xs text-zinc-400 pl-2">
                    +{links.incoming.length - 5} more
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Impact Analysis */}
        {impactAnalysis && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
                <AlertTriangle className="w-4 h-4" />
                Impact Analysis
              </CardTitle>
              <CardDescription className="text-amber-700">
                Score: {impactAnalysis.totalImpactScore}/100
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-amber-800">
                {impactAnalysis.summary}
              </p>

              {/* Direct Impacts */}
              {impactAnalysis.directImpacts.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-amber-700 mb-1">
                    Direct Impacts ({impactAnalysis.directImpacts.length})
                  </p>
                  <div className="space-y-1">
                    {impactAnalysis.directImpacts.slice(0, 3).map(impact => (
                      <div
                        key={impact.nodeId}
                        className="flex items-center gap-2 text-xs"
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: IMPACT_COLORS[impact.severity] }}
                        />
                        <span className="text-amber-800 truncate">{impact.nodeName}</span>
                      </div>
                    ))}
                    {impactAnalysis.directImpacts.length > 3 && (
                      <p className="text-xs text-amber-600">
                        +{impactAnalysis.directImpacts.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Cascading Impacts */}
              {impactAnalysis.cascadingImpacts.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-amber-700 mb-1">
                    Cascading Impacts ({impactAnalysis.cascadingImpacts.length})
                  </p>
                  <div className="space-y-1">
                    {impactAnalysis.cascadingImpacts.slice(0, 3).map(impact => (
                      <div
                        key={impact.nodeId}
                        className="flex items-center gap-2 text-xs"
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: IMPACT_COLORS[impact.severity] }}
                        />
                        <span className="text-amber-800 truncate">{impact.nodeName}</span>
                        <span className="text-amber-500">(depth {impact.depth})</span>
                      </div>
                    ))}
                    {impactAnalysis.cascadingImpacts.length > 3 && (
                      <p className="text-xs text-amber-600">
                        +{impactAnalysis.cascadingImpacts.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {impactAnalysis.recommendations.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-amber-700 mb-1">
                    Recommendations
                  </p>
                  <ul className="text-xs text-amber-800 space-y-1">
                    {impactAnalysis.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-amber-500">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Navigate to Document */}
        <Button
          variant="outline"
          className="w-full"
          data-testid="navigate-to-document-btn"
        >
          <FileText className="w-4 h-4 mr-2" />
          View in Document
        </Button>
      </div>
    </div>
  );
}
