'use client';

import React, { memo, useMemo, useCallback, useRef, useEffect, useState } from 'react';
import {
  GitBranch,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { CategoryWithTerms } from '../lib/types';
import {
  type TermDependencyGraph,
  type TermNode,
  type DependencyType,
  type DependencyStrength,
  buildDependencyGraph,
  STANDARD_TERM_DEPENDENCIES,
  getDependencyStrengthColor,
  getDependencyTypeLabel
} from '../lib/term-dependency-graph';

interface Position {
  x: number;
  y: number;
}

interface GraphNode extends TermNode {
  position: Position;
  categoryName: string;
  categoryColor: string;
}

// Category colors for visual distinction
const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'Facility Terms': { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  'Pricing Terms': { bg: '#dcfce7', border: '#22c55e', text: '#166534' },
  'Financial Covenants': { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  'default': { bg: '#f4f4f5', border: '#71717a', text: '#3f3f46' }
};

// Dependency edge colors
const DEPENDENCY_COLORS: Record<DependencyStrength, string> = {
  strong: '#ef4444',
  moderate: '#f59e0b',
  weak: '#3b82f6'
};

interface TermDependencyGraphVizProps {
  categories: CategoryWithTerms[];
  selectedTermId?: string | null;
  onSelectTerm?: (termId: string) => void;
  onClose?: () => void;
  width?: number;
  height?: number;
}

/**
 * TermDependencyGraphViz renders an interactive visual representation of the term
 * dependency graph. It shows terms as nodes and dependencies as edges, allowing
 * users to understand the interconnected nature of loan terms.
 */
export const TermDependencyGraphViz = memo(function TermDependencyGraphViz({
  categories,
  selectedTermId,
  onSelectTerm,
  onClose,
  width = 600,
  height = 400
}: TermDependencyGraphVizProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Position>({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState<Position>({ x: 0, y: 0 });

  // Build dependency graph
  const graph = useMemo(() => {
    return buildDependencyGraph(categories, STANDARD_TERM_DEPENDENCIES);
  }, [categories]);

  // Create positioned graph nodes using force-directed layout simulation
  const graphNodes = useMemo(() => {
    const nodes: Map<string, GraphNode> = new Map();
    const categoryMap = new Map<string, string>();

    // First pass: create nodes with initial positions
    categories.forEach((category, catIndex) => {
      const categoryColors = CATEGORY_COLORS[category.name] || CATEGORY_COLORS.default;
      const angleStart = (catIndex * 2 * Math.PI) / categories.length;

      category.terms.forEach((term, termIndex) => {
        categoryMap.set(term.id, category.name);
        const graphNode = graph.nodes.get(term.id);
        if (graphNode) {
          // Position nodes in clusters by category
          const radius = 120 + termIndex * 30;
          const angle = angleStart + (termIndex * 0.3);

          nodes.set(term.id, {
            ...graphNode,
            position: {
              x: width / 2 + radius * Math.cos(angle),
              y: height / 2 + radius * Math.sin(angle)
            },
            categoryName: category.name,
            categoryColor: categoryColors.border
          });
        }
      });
    });

    // Apply simple force-directed adjustments (limited iterations for performance)
    const iterations = 50;
    for (let i = 0; i < iterations; i++) {
      nodes.forEach((node, nodeId) => {
        let fx = 0, fy = 0;

        // Repulsion from other nodes
        nodes.forEach((other, otherId) => {
          if (nodeId !== otherId) {
            const dx = node.position.x - other.position.x;
            const dy = node.position.y - other.position.y;
            const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
            const force = 1000 / (dist * dist);
            fx += (dx / dist) * force;
            fy += (dy / dist) * force;
          }
        });

        // Attraction to connected nodes
        const graphNode = graph.nodes.get(nodeId);
        if (graphNode) {
          [...graphNode.dependents, ...graphNode.dependencies].forEach(dep => {
            const targetId = dep.targetTermId === nodeId ? dep.sourceTermId : dep.targetTermId;
            const target = nodes.get(targetId);
            if (target) {
              const dx = target.position.x - node.position.x;
              const dy = target.position.y - node.position.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const idealDist = 100;
              const force = (dist - idealDist) * 0.01;
              fx += (dx / dist) * force;
              fy += (dy / dist) * force;
            }
          });
        }

        // Center attraction
        const cx = width / 2 - node.position.x;
        const cy = height / 2 - node.position.y;
        fx += cx * 0.001;
        fy += cy * 0.001;

        // Update position with damping
        node.position.x += fx * 0.3;
        node.position.y += fy * 0.3;

        // Keep within bounds
        node.position.x = Math.max(60, Math.min(width - 60, node.position.x));
        node.position.y = Math.max(40, Math.min(height - 40, node.position.y));
      });
    }

    return nodes;
  }, [graph, categories, width, height]);

  // Draw the graph on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Apply transformations
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw edges first (behind nodes)
    graph.edges.forEach(edge => {
      const source = graphNodes.get(edge.sourceTermId);
      const target = graphNodes.get(edge.targetTermId);
      if (!source || !target) return;

      const isHighlighted =
        selectedTermId === edge.sourceTermId ||
        selectedTermId === edge.targetTermId ||
        hoveredNode === edge.sourceTermId ||
        hoveredNode === edge.targetTermId;

      ctx.beginPath();
      ctx.moveTo(source.position.x, source.position.y);

      // Draw curved line for better visibility
      const midX = (source.position.x + target.position.x) / 2;
      const midY = (source.position.y + target.position.y) / 2;
      const dx = target.position.x - source.position.x;
      const dy = target.position.y - source.position.y;
      const perpX = -dy * 0.2;
      const perpY = dx * 0.2;

      ctx.quadraticCurveTo(midX + perpX, midY + perpY, target.position.x, target.position.y);

      ctx.strokeStyle = isHighlighted
        ? DEPENDENCY_COLORS[edge.strength]
        : `${DEPENDENCY_COLORS[edge.strength]}40`;
      ctx.lineWidth = isHighlighted ? (edge.strength === 'strong' ? 3 : 2) : 1;
      ctx.stroke();

      // Draw arrowhead
      const angle = Math.atan2(
        target.position.y - (midY + perpY),
        target.position.x - (midX + perpX)
      );
      const arrowSize = isHighlighted ? 10 : 6;
      ctx.beginPath();
      ctx.moveTo(target.position.x, target.position.y);
      ctx.lineTo(
        target.position.x - arrowSize * Math.cos(angle - Math.PI / 6),
        target.position.y - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        target.position.x - arrowSize * Math.cos(angle + Math.PI / 6),
        target.position.y - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = isHighlighted
        ? DEPENDENCY_COLORS[edge.strength]
        : `${DEPENDENCY_COLORS[edge.strength]}40`;
      ctx.fill();
    });

    // Draw nodes
    graphNodes.forEach((node, nodeId) => {
      const isSelected = selectedTermId === nodeId;
      const isHovered = hoveredNode === nodeId;
      const isConnected = selectedTermId && (
        graph.nodes.get(selectedTermId)?.dependents.some(d => d.targetTermId === nodeId) ||
        graph.nodes.get(selectedTermId)?.dependencies.some(d => d.sourceTermId === nodeId)
      );

      const nodeRadius = isSelected || isHovered ? 28 : 24;
      const categoryColors = CATEGORY_COLORS[node.categoryName] || CATEGORY_COLORS.default;

      // Node circle
      ctx.beginPath();
      ctx.arc(node.position.x, node.position.y, nodeRadius, 0, Math.PI * 2);

      if (isSelected) {
        ctx.fillStyle = categoryColors.border;
        ctx.strokeStyle = '#1d4ed8';
        ctx.lineWidth = 3;
      } else if (isHovered) {
        ctx.fillStyle = categoryColors.bg;
        ctx.strokeStyle = categoryColors.border;
        ctx.lineWidth = 2;
      } else if (isConnected) {
        ctx.fillStyle = categoryColors.bg;
        ctx.strokeStyle = categoryColors.border;
        ctx.lineWidth = 2;
      } else {
        ctx.fillStyle = selectedTermId ? `${categoryColors.bg}80` : categoryColors.bg;
        ctx.strokeStyle = selectedTermId ? `${categoryColors.border}60` : categoryColors.border;
        ctx.lineWidth = 1.5;
      }

      ctx.fill();
      ctx.stroke();

      // Connection count badge
      const connectionCount = node.dependents.length + node.dependencies.length;
      if (connectionCount > 0) {
        ctx.beginPath();
        ctx.arc(node.position.x + nodeRadius * 0.7, node.position.y - nodeRadius * 0.7, 10, 0, Math.PI * 2);
        ctx.fillStyle = connectionCount > 2 ? '#ef4444' : connectionCount > 1 ? '#f59e0b' : '#3b82f6';
        ctx.fill();

        ctx.font = 'bold 10px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(String(connectionCount), node.position.x + nodeRadius * 0.7, node.position.y - nodeRadius * 0.7);
      }

      // Node label
      ctx.font = isSelected || isHovered ? 'bold 11px system-ui' : '10px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isSelected ? '#ffffff' : categoryColors.text;

      // Truncate long labels
      const maxLabelWidth = 50;
      let label = node.termLabel;
      while (ctx.measureText(label).width > maxLabelWidth && label.length > 3) {
        label = label.slice(0, -4) + '...';
      }
      ctx.fillText(label, node.position.x, node.position.y);
    });

    ctx.restore();
  }, [graph, graphNodes, width, height, zoom, pan, selectedTermId, hoveredNode]);

  // Handle mouse events for interaction
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    if (isDragging) {
      setPan(prev => ({
        x: prev.x + (e.clientX - lastMousePos.x),
        y: prev.y + (e.clientY - lastMousePos.y)
      }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
      return;
    }

    // Check if hovering over a node
    let foundNode: string | null = null;
    graphNodes.forEach((node, nodeId) => {
      const dist = Math.sqrt(
        Math.pow(x - node.position.x, 2) + Math.pow(y - node.position.y, 2)
      );
      if (dist < 28) {
        foundNode = nodeId;
      }
    });

    if (foundNode !== hoveredNode) {
      setHoveredNode(foundNode);
      canvas.style.cursor = foundNode ? 'pointer' : (isDragging ? 'grabbing' : 'grab');
    }
  }, [graphNodes, zoom, pan, isDragging, lastMousePos, hoveredNode]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredNode) {
      onSelectTerm?.(hoveredNode);
    } else {
      setIsDragging(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  }, [hoveredNode, onSelectTerm]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.5, Math.min(2, prev * delta)));
  }, []);

  // Zoom controls
  const handleZoomIn = useCallback(() => setZoom(prev => Math.min(2, prev * 1.2)), []);
  const handleZoomOut = useCallback(() => setZoom(prev => Math.max(0.5, prev / 1.2)), []);
  const handleReset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Get hovered node info for tooltip
  const hoveredNodeInfo = useMemo(() => {
    if (!hoveredNode) return null;
    return graphNodes.get(hoveredNode);
  }, [hoveredNode, graphNodes]);

  // Calculate legend info
  const legendItems = useMemo(() => {
    return categories.map(cat => ({
      name: cat.name,
      color: (CATEGORY_COLORS[cat.name] || CATEGORY_COLORS.default).border,
      count: cat.terms.length
    }));
  }, [categories]);

  return (
    <Card
      className="animate-in fade-in slide-in-from-right-4 duration-500"
      data-testid="term-dependency-graph-viz"
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-zinc-500" aria-hidden="true" />
            <CardTitle className="text-base">Dependency Graph</CardTitle>
            <Badge variant="outline" className="text-xs">
              {graph.nodes.size} terms, {graph.edges.length} dependencies
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleZoomOut}
                    data-testid="graph-zoom-out-btn"
                  >
                    <ZoomOut className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom out</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleZoomIn}
                    data-testid="graph-zoom-in-btn"
                  >
                    <ZoomIn className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom in</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleReset}
                    data-testid="graph-reset-btn"
                  >
                    <Maximize2 className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset view</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onClose}
                data-testid="close-graph-viz-btn"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={containerRef}
          className="relative bg-zinc-50 rounded-b-lg overflow-hidden"
          style={{ height }}
        >
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            className="w-full h-full"
            data-testid="dependency-graph-canvas"
          />

          {/* Hover tooltip */}
          {hoveredNodeInfo && (
            <div
              className="absolute pointer-events-none bg-white border border-zinc-200 rounded-lg shadow-lg p-3 text-sm max-w-xs z-10"
              style={{
                left: hoveredNodeInfo.position.x * zoom + pan.x + 40,
                top: hoveredNodeInfo.position.y * zoom + pan.y - 20
              }}
              data-testid="graph-node-tooltip"
            >
              <p className="font-medium text-zinc-900">{hoveredNodeInfo.termLabel}</p>
              <p className="text-xs text-zinc-500 mb-2">{hoveredNodeInfo.categoryName}</p>
              {(hoveredNodeInfo.dependents.length > 0 || hoveredNodeInfo.dependencies.length > 0) && (
                <div className="space-y-1 text-xs">
                  {hoveredNodeInfo.dependencies.length > 0 && (
                    <p className="text-zinc-600">
                      Depends on {hoveredNodeInfo.dependencies.length} term{hoveredNodeInfo.dependencies.length !== 1 ? 's' : ''}
                    </p>
                  )}
                  {hoveredNodeInfo.dependents.length > 0 && (
                    <p className="text-zinc-600">
                      Affects {hoveredNodeInfo.dependents.length} term{hoveredNodeInfo.dependents.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm border border-zinc-200 rounded-lg p-2 text-xs">
            <div className="font-medium text-zinc-700 mb-1.5">Categories</div>
            <div className="space-y-1">
              {legendItems.map(item => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-zinc-600">{item.name}</span>
                  <span className="text-zinc-400">({item.count})</span>
                </div>
              ))}
            </div>
            <div className="border-t border-zinc-200 mt-2 pt-2">
              <div className="font-medium text-zinc-700 mb-1.5">Dependencies</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5" style={{ backgroundColor: DEPENDENCY_COLORS.strong }} />
                  <span className="text-zinc-600">Strong</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5" style={{ backgroundColor: DEPENDENCY_COLORS.moderate }} />
                  <span className="text-zinc-600">Moderate</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5" style={{ backgroundColor: DEPENDENCY_COLORS.weak }} />
                  <span className="text-zinc-600">Weak</span>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm border border-zinc-200 rounded-lg px-2 py-1.5 text-xs text-zinc-500 flex items-center gap-1.5">
            <Info className="w-3 h-3" aria-hidden="true" />
            Click node to select, drag to pan, scroll to zoom
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default TermDependencyGraphViz;
