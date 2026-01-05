'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Network, Loader2, AlertCircle, GitCompare, FileText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CrossRefGraph,
  GraphFilterBar,
  GraphControls,
  GraphLegend,
  NodeDetailPanel,
} from './components';
import { useCrossRefGraph } from './hooks';
import { getNodeById } from './lib/mock-data';

interface CrossReferencePageProps {
  documentId?: string;
  comparisonDocumentId?: string;
}

/**
 * Obsidian-style cross-reference graph visualization page
 */
export function CrossReferencePage({
  documentId,
  comparisonDocumentId,
}: CrossReferencePageProps) {
  const {
    graphData,
    nodesWithPositions,
    filteredLinks,
    filters,
    setFilters,
    resetFilters,
    settings,
    setSettings,
    selectedNodeId,
    selectNode,
    hoveredNodeId,
    setHoveredNode,
    impactAnalysis,
    highlightedNodeIds,
    isLoading,
    error,
    refresh,
    zoomLevel,
    setZoomLevel,
    panOffset,
    setPanOffset,
    resetView,
    getNodeColor,
    getLinkColor,
    triggerRipple,
    updateNodePosition,
    toggleNodePin,
  } = useCrossRefGraph({
    documentId,
    comparisonDocumentId,
  });

  // Get selected node
  const selectedNode = selectedNodeId ? getNodeById(selectedNodeId) : null;

  // Handle node navigation
  const handleNavigateToNode = useCallback((nodeId: string) => {
    selectNode(nodeId);
    // Center view on node
    const node = nodesWithPositions.find(n => n.id === nodeId);
    if (node) {
      setPanOffset({
        x: 400 - node.position.x * zoomLevel,
        y: 300 - node.position.y * zoomLevel,
      });
    }
  }, [selectNode, nodesWithPositions, zoomLevel, setPanOffset]);

  // Handle ripple trigger
  const handleTriggerRipple = useCallback(() => {
    if (selectedNodeId) {
      triggerRipple(selectedNodeId);
    }
  }, [selectedNodeId, triggerRipple]);

  // Handle zoom
  const handleZoomIn = useCallback(() => {
    setZoomLevel(Math.min(3, zoomLevel + 0.2));
  }, [zoomLevel, setZoomLevel]);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(Math.max(0.3, zoomLevel - 0.2));
  }, [zoomLevel, setZoomLevel]);

  // Handle node double-click (trigger ripple effect)
  const handleNodeDoubleClick = useCallback((nodeId: string) => {
    triggerRipple(nodeId);
  }, [triggerRipple]);

  return (
    <div className="h-full flex flex-col" data-testid="cross-reference-page">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-zinc-200 bg-white animate-in fade-in slide-in-from-top-4 duration-500">
        <Link href="/documents/compare" data-testid="back-to-compare-link">
          <Button variant="ghost" size="icon" className="transition-transform hover:scale-110" data-testid="back-btn">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-zinc-900">Cross-Reference Graph</h1>
          </div>
          <p className="text-sm text-zinc-500">
            Visualize relationships between clauses, definitions, and terms
          </p>
        </div>

        {/* Document Info */}
        {graphData && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-zinc-700">
                {graphData.documentName}
              </p>
              {graphData.comparisonDocumentName && (
                <div className="flex items-center gap-1 text-xs text-zinc-500">
                  <GitCompare className="w-3 h-3" />
                  vs {graphData.comparisonDocumentName}
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              data-testid="refresh-graph-btn"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center bg-zinc-50">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-sm text-zinc-500">Loading cross-reference data...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex-1 flex items-center justify-center bg-zinc-50">
          <Card className="w-96 border-red-200 bg-red-50">
            <CardContent className="py-6">
              <div className="flex flex-col items-center gap-3 text-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
                <div>
                  <p className="font-medium text-red-800">Failed to load graph</p>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={refresh}
                  className="mt-2"
                  data-testid="retry-btn"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      {graphData && !isLoading && !error && (
        <div className="flex-1 flex overflow-hidden">
          {/* Graph Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Filter Bar */}
            <GraphFilterBar
              filters={filters}
              settings={settings}
              onFiltersChange={setFilters}
              onSettingsChange={setSettings}
              onResetFilters={resetFilters}
              totalNodes={graphData.nodes.length}
              filteredNodes={nodesWithPositions.length}
            />

            {/* Graph */}
            <div className="flex-1 relative">
              <CrossRefGraph
                nodes={nodesWithPositions}
                links={filteredLinks}
                settings={settings}
                selectedNodeId={selectedNodeId}
                hoveredNodeId={hoveredNodeId}
                highlightedNodeIds={highlightedNodeIds}
                zoomLevel={zoomLevel}
                panOffset={panOffset}
                getNodeColor={getNodeColor}
                getLinkColor={getLinkColor}
                onNodeClick={selectNode}
                onNodeHover={setHoveredNode}
                onNodeDoubleClick={handleNodeDoubleClick}
                onNodeDrag={updateNodePosition}
                onZoomChange={setZoomLevel}
                onPanChange={setPanOffset}
                onBackgroundClick={() => selectNode(null)}
              />

              {/* Controls */}
              <GraphControls
                settings={settings}
                zoomLevel={zoomLevel}
                onSettingsChange={setSettings}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onResetView={resetView}
              />

              {/* Legend */}
              <GraphLegend settings={settings} />

              {/* Stats Summary */}
              <div className="absolute top-4 right-4 bg-white rounded-lg border border-zinc-200 shadow-sm p-3">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <p className="text-xs text-zinc-400">Modified Terms</p>
                    <p className="font-semibold text-orange-600">
                      {graphData.stats.modifiedNodes}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">High Impact</p>
                    <p className="font-semibold text-red-600">
                      {graphData.stats.highImpactNodes}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Avg Connections</p>
                    <p className="font-semibold text-zinc-700">
                      {graphData.stats.avgConnections.toFixed(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Most Connected</p>
                    <p className="font-semibold text-indigo-600 truncate" title={graphData.stats.mostConnectedNode?.name}>
                      {graphData.stats.mostConnectedNode?.name.slice(0, 12) || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Empty State (no visible nodes) */}
              {nodesWithPositions.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Card className="w-80 pointer-events-auto">
                    <CardContent className="py-6 text-center">
                      <Network className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                      <p className="text-zinc-600 font-medium">No terms match your filters</p>
                      <p className="text-sm text-zinc-400 mt-1">
                        Try adjusting your filter criteria
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetFilters}
                        className="mt-4"
                        data-testid="clear-filters-btn"
                      >
                        Reset Filters
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>

          {/* Node Detail Panel */}
          {selectedNode && (
            <NodeDetailPanel
              node={selectedNode}
              impactAnalysis={impactAnalysis}
              onClose={() => selectNode(null)}
              onNavigateToNode={handleNavigateToNode}
              onTriggerRipple={handleTriggerRipple}
            />
          )}
        </div>
      )}

      {/* Empty State (no document selected) */}
      {!graphData && !isLoading && !error && (
        <div className="flex-1 flex items-center justify-center bg-zinc-50">
          <Card className="w-96">
            <CardContent className="py-8 text-center">
              <Network className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-zinc-700">No Document Selected</h3>
              <p className="text-sm text-zinc-500 mt-2 mb-4">
                Select a document to visualize its cross-references and term relationships.
              </p>
              <Link href="/documents">
                <Button data-testid="select-document-btn">
                  <FileText className="w-4 h-4 mr-2" />
                  Select Document
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
