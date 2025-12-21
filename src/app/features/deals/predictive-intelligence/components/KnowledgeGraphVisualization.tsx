'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Network,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { GraphVisualizationData } from '../lib/types';

interface KnowledgeGraphVisualizationProps {
  graphData: GraphVisualizationData;
  onNodeClick?: (nodeId: string) => void;
  onExpandGraph?: () => void;
}

export function KnowledgeGraphVisualization({
  graphData,
  onNodeClick,
  onExpandGraph,
}: KnowledgeGraphVisualizationProps) {
  const [zoom, setZoom] = useState(1);
  const [filterType, setFilterType] = useState<string>('all');
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const nodeTypeColors: Record<string, string> = {
    deal: '#3b82f6',
    term: '#ec4899',
    participant: '#f59e0b',
    counterparty: '#8b5cf6',
    market_condition: '#6366f1',
    outcome: '#10b981',
    term_structure: '#14b8a6',
    negotiation_pattern: '#f97316',
  };

  const nodeTypeLabels: Record<string, string> = {
    deal: 'Deals',
    term: 'Terms',
    participant: 'Participants',
    counterparty: 'Counterparties',
    market_condition: 'Market',
    outcome: 'Outcomes',
    term_structure: 'Structures',
    negotiation_pattern: 'Patterns',
  };

  const filteredNodes = useMemo(() => {
    if (filterType === 'all') return graphData.nodes;
    return graphData.nodes.filter((n) => n.type === filterType);
  }, [graphData.nodes, filterType]);

  const filteredEdges = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    return graphData.edges.filter(
      (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
    );
  }, [filteredNodes, graphData.edges]);

  // Simple force-directed layout calculation
  const layoutNodes = useMemo(() => {
    const centerX = 300;
    const centerY = 200;
    const radius = 150;

    return filteredNodes.map((node, i) => {
      const angle = (2 * Math.PI * i) / filteredNodes.length;
      const r = node.type === 'deal' ? 0 : radius;
      return {
        ...node,
        x: node.x ?? centerX + r * Math.cos(angle),
        y: node.y ?? centerY + r * Math.sin(angle),
      };
    });
  }, [filteredNodes]);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + 0.2, 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - 0.2, 0.5));
  }, []);

  const nodeTypes = useMemo(() => {
    const types = new Set(graphData.nodes.map((n) => n.type));
    return Array.from(types);
  }, [graphData.nodes]);

  return (
    <Card data-testid="knowledge-graph-visualization">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Network className="w-4 h-4 text-indigo-500" />
            Knowledge Graph
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32 h-8" data-testid="graph-filter">
                <Filter className="w-3 h-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {nodeTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {nodeTypeLabels[type] || type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Graph Container */}
        <div
          className="relative w-full h-80 rounded-lg border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white overflow-hidden"
          data-testid="graph-container"
        >
          {/* SVG Graph */}
          <svg
            className="w-full h-full"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
          >
            {/* Edges */}
            <g className="edges">
              {filteredEdges.map((edge) => {
                const source = layoutNodes.find((n) => n.id === edge.source);
                const target = layoutNodes.find((n) => n.id === edge.target);
                if (!source || !target) return null;

                const isHighlighted =
                  hoveredNode === edge.source || hoveredNode === edge.target;

                return (
                  <line
                    key={edge.id}
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={isHighlighted ? '#3b82f6' : edge.color || '#94a3b8'}
                    strokeWidth={isHighlighted ? 2 : 1}
                    strokeOpacity={isHighlighted ? 1 : 0.5}
                    className="transition-all duration-200"
                  />
                );
              })}
            </g>

            {/* Nodes */}
            <g className="nodes">
              {layoutNodes.map((node) => {
                const isHighlighted = hoveredNode === node.id;
                const connectedToHighlighted =
                  hoveredNode &&
                  filteredEdges.some(
                    (e) =>
                      (e.source === node.id && e.target === hoveredNode) ||
                      (e.target === node.id && e.source === hoveredNode)
                  );

                return (
                  <g
                    key={node.id}
                    className="cursor-pointer transition-all duration-200"
                    transform={`translate(${node.x}, ${node.y})`}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={() => onNodeClick?.(node.id)}
                    data-testid={`graph-node-${node.id}`}
                  >
                    {/* Node Circle */}
                    <circle
                      r={isHighlighted ? node.size * 1.2 : node.size}
                      fill={node.color || nodeTypeColors[node.type] || '#94a3b8'}
                      stroke={isHighlighted ? '#1e3a8a' : '#fff'}
                      strokeWidth={isHighlighted ? 3 : 2}
                      opacity={
                        hoveredNode && !isHighlighted && !connectedToHighlighted
                          ? 0.4
                          : 1
                      }
                    />

                    {/* Node Label */}
                    {(isHighlighted || node.size >= 20) && (
                      <text
                        y={node.size + 12}
                        textAnchor="middle"
                        className="text-xs fill-zinc-600 font-medium"
                        style={{ fontSize: '10px' }}
                      >
                        {node.label.length > 15
                          ? `${node.label.slice(0, 15)}...`
                          : node.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Zoom Controls */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white rounded-lg border border-zinc-200 shadow-sm p-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={handleZoomOut}
              data-testid="zoom-out-btn"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs text-zinc-500 px-1">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={handleZoomIn}
              data-testid="zoom-in-btn"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            {onExpandGraph && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={onExpandGraph}
                data-testid="expand-graph-btn"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-2">
          {nodeTypes.map((type) => (
            <Badge
              key={type}
              variant="outline"
              className={cn(
                'text-xs cursor-pointer transition-all',
                filterType === type
                  ? 'ring-1 ring-offset-1'
                  : 'opacity-70 hover:opacity-100'
              )}
              style={{
                borderColor: nodeTypeColors[type],
                color: nodeTypeColors[type],
              }}
              onClick={() =>
                setFilterType(filterType === type ? 'all' : type)
              }
            >
              <span
                className="w-2 h-2 rounded-full mr-1"
                style={{ backgroundColor: nodeTypeColors[type] }}
              />
              {nodeTypeLabels[type] || type}
            </Badge>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
          <span>
            {filteredNodes.length} nodes, {filteredEdges.length} connections
          </span>
          <span>Layout: {graphData.layout}</span>
        </div>
      </CardContent>
    </Card>
  );
}
