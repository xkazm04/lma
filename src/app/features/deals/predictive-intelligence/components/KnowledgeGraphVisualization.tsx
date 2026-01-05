'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Network,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  RefreshCw,
} from 'lucide-react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';
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

// Extended node type for d3-force simulation
interface SimNode extends SimulationNodeDatum {
  id: string;
  label: string;
  type: string;
  size: number;
  color: string;
  // Animated positions (rendered)
  displayX: number;
  displayY: number;
  // Target scale for hover animation
  targetScale: number;
  currentScale: number;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  id: string;
  label?: string;
  weight: number;
  color?: string;
}

// Elastic easing function for smooth bouncy animations
function elasticOut(t: number): number {
  const p = 0.3;
  return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1;
}

// Smooth interpolation for node positions
function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

export function KnowledgeGraphVisualization({
  graphData,
  onNodeClick,
  onExpandGraph,
}: KnowledgeGraphVisualizationProps) {
  const [zoom, setZoom] = useState(1);
  const [filterType, setFilterType] = useState<string>('all');
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Refs for animation
  const simulationRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const nodesRef = useRef<SimNode[]>([]);
  const linksRef = useRef<SimLink[]>([]);
  const [renderTick, setRenderTick] = useState(0);

  // Track previous filter to detect changes
  const prevFilterRef = useRef<string>('all');

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

  const nodeTypes = useMemo(() => {
    const types = new Set(graphData.nodes.map((n) => n.type));
    return Array.from(types);
  }, [graphData.nodes]);

  // Initialize and run d3-force simulation when filter changes
  useEffect(() => {
    const centerX = 300;
    const centerY = 200;
    const filterChanged = prevFilterRef.current !== filterType;
    prevFilterRef.current = filterType;

    // Create or update nodes with positions
    const existingNodesMap = new Map(nodesRef.current.map(n => [n.id, n]));

    const simNodes: SimNode[] = filteredNodes.map((node, i) => {
      const existing = existingNodesMap.get(node.id);
      const angle = (2 * Math.PI * i) / Math.max(filteredNodes.length, 1);
      const radius = node.type === 'deal' ? 0 : 120;

      // Use existing position or calculate initial position
      const initialX = existing?.x ?? (node.x ?? centerX + radius * Math.cos(angle));
      const initialY = existing?.y ?? (node.y ?? centerY + radius * Math.sin(angle));

      return {
        id: node.id,
        label: node.label,
        type: node.type,
        size: node.size,
        color: node.color || nodeTypeColors[node.type] || '#94a3b8',
        x: initialX,
        y: initialY,
        displayX: existing?.displayX ?? initialX,
        displayY: existing?.displayY ?? initialY,
        targetScale: 1,
        currentScale: existing?.currentScale ?? 1,
      };
    });

    const simLinks: SimLink[] = filteredEdges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      weight: edge.weight,
      color: edge.color,
    }));

    nodesRef.current = simNodes;
    linksRef.current = simLinks;

    // Stop previous simulation
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    // Create new d3-force simulation
    const simulation = forceSimulation<SimNode>(simNodes)
      .force(
        'link',
        forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance(80)
          .strength(0.5)
      )
      .force('charge', forceManyBody().strength(-200))
      .force('center', forceCenter(centerX, centerY))
      .force('collide', forceCollide<SimNode>().radius((d) => d.size + 10))
      .alphaDecay(0.02)
      .velocityDecay(0.3);

    // If filter changed, reheat the simulation for smooth transition
    if (filterChanged) {
      simulation.alpha(0.8).restart();
      setIsSimulating(true);
    } else {
      simulation.alpha(0.3).restart();
      setIsSimulating(true);
    }

    simulationRef.current = simulation;

    // Animation loop using requestAnimationFrame for 60fps
    let lastTime = performance.now();
    const animationSmoothness = 0.08; // Lower = smoother but slower
    const scaleAnimationSpeed = 0.15;

    const animate = (currentTime: number) => {
      const deltaTime = Math.min((currentTime - lastTime) / 16.67, 2); // Normalize to ~60fps
      lastTime = currentTime;

      let needsUpdate = false;
      const isActive = simulation.alpha() > 0.001;

      // Update node display positions with smooth interpolation
      nodesRef.current.forEach((node) => {
        const targetX = node.x ?? 0;
        const targetY = node.y ?? 0;

        // Smooth position interpolation
        const newDisplayX = lerp(node.displayX, targetX, animationSmoothness * deltaTime * 3);
        const newDisplayY = lerp(node.displayY, targetY, animationSmoothness * deltaTime * 3);

        if (Math.abs(newDisplayX - node.displayX) > 0.01 || Math.abs(newDisplayY - node.displayY) > 0.01) {
          node.displayX = newDisplayX;
          node.displayY = newDisplayY;
          needsUpdate = true;
        }

        // Elastic scale animation for hover
        const scaleDiff = node.targetScale - node.currentScale;
        if (Math.abs(scaleDiff) > 0.001) {
          // Apply elastic easing for bouncy feel
          const progress = Math.min(scaleAnimationSpeed * deltaTime * 2, 1);
          const elasticProgress = progress < 1 ? elasticOut(progress * 0.5) * 2 : 1;
          node.currentScale = lerp(node.currentScale, node.targetScale, elasticProgress * 0.3);
          needsUpdate = true;
        }
      });

      if (needsUpdate || isActive) {
        setRenderTick((t) => t + 1);
      }

      if (!isActive && !needsUpdate) {
        setIsSimulating(false);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      simulation.stop();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [filteredNodes, filteredEdges, filterType, nodeTypeColors]);

  // Update hover scale targets
  useEffect(() => {
    nodesRef.current.forEach((node) => {
      if (node.id === hoveredNode) {
        node.targetScale = 1.3; // Larger scale for hovered node
      } else {
        node.targetScale = 1;
      }
    });
    setRenderTick((t) => t + 1);
  }, [hoveredNode]);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + 0.2, 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - 0.2, 0.5));
  }, []);

  const handleRefreshLayout = useCallback(() => {
    if (simulationRef.current) {
      // Randomize positions slightly and reheat
      nodesRef.current.forEach((node) => {
        node.x = (node.x ?? 300) + (Math.random() - 0.5) * 50;
        node.y = (node.y ?? 200) + (Math.random() - 0.5) * 50;
      });
      simulationRef.current.alpha(0.8).restart();
      setIsSimulating(true);
    }
  }, []);

  // Get current render state from refs
  const renderNodes = nodesRef.current;
  const renderLinks = linksRef.current;

  return (
    <Card data-testid="knowledge-graph-visualization">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Network className="w-4 h-4 text-indigo-500" />
            Knowledge Graph
            {isSimulating && (
              <span className="text-xs text-zinc-400 animate-pulse">
                (animating...)
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleRefreshLayout}
              data-testid="refresh-layout-btn"
              title="Refresh layout"
            >
              <RefreshCw className={cn("w-4 h-4", isSimulating && "animate-spin")} />
            </Button>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32 h-8" data-testid="graph-filter-select">
                <Filter className="w-3 h-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" data-testid="filter-option-all">All Types</SelectItem>
                {nodeTypes.map((type) => (
                  <SelectItem key={type} value={type} data-testid={`filter-option-${type}`}>
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
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center',
              transition: 'transform 0.2s ease-out',
            }}
            data-testid="graph-svg"
          >
            {/* Edges with smooth transitions */}
            <g className="edges">
              {renderLinks.map((edge) => {
                const source = renderNodes.find((n) => n.id === (typeof edge.source === 'object' ? edge.source.id : edge.source));
                const target = renderNodes.find((n) => n.id === (typeof edge.target === 'object' ? edge.target.id : edge.target));
                if (!source || !target) return null;

                const isHighlighted =
                  hoveredNode === source.id || hoveredNode === target.id;

                return (
                  <line
                    key={edge.id}
                    x1={source.displayX}
                    y1={source.displayY}
                    x2={target.displayX}
                    y2={target.displayY}
                    stroke={isHighlighted ? '#3b82f6' : edge.color || '#94a3b8'}
                    strokeWidth={isHighlighted ? 2.5 : 1}
                    strokeOpacity={isHighlighted ? 1 : hoveredNode ? 0.3 : 0.5}
                    data-testid={`graph-edge-${edge.id}`}
                  />
                );
              })}
            </g>

            {/* Nodes with elastic hover animation */}
            <g className="nodes">
              {renderNodes.map((node) => {
                const isHighlighted = hoveredNode === node.id;
                const connectedToHighlighted =
                  hoveredNode &&
                  renderLinks.some(
                    (e) => {
                      const sourceId = typeof e.source === 'object' ? e.source.id : e.source;
                      const targetId = typeof e.target === 'object' ? e.target.id : e.target;
                      return (sourceId === node.id && targetId === hoveredNode) ||
                             (targetId === node.id && sourceId === hoveredNode);
                    }
                  );

                const scale = node.currentScale;
                const opacity = hoveredNode && !isHighlighted && !connectedToHighlighted ? 0.4 : 1;

                return (
                  <g
                    key={node.id}
                    className="cursor-pointer"
                    transform={`translate(${node.displayX}, ${node.displayY}) scale(${scale})`}
                    style={{ transformOrigin: '0 0' }}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={() => onNodeClick?.(node.id)}
                    data-testid={`graph-node-${node.id}`}
                  >
                    {/* Glow effect for hovered node */}
                    {isHighlighted && (
                      <circle
                        r={node.size + 8}
                        fill="none"
                        stroke={node.color}
                        strokeWidth={3}
                        strokeOpacity={0.3}
                        data-testid={`graph-node-glow-${node.id}`}
                      />
                    )}

                    {/* Node Circle */}
                    <circle
                      r={node.size}
                      fill={node.color}
                      stroke={isHighlighted ? '#1e3a8a' : '#fff'}
                      strokeWidth={isHighlighted ? 3 : 2}
                      opacity={opacity}
                    />

                    {/* Node Label */}
                    {(isHighlighted || node.size >= 20) && (
                      <text
                        y={node.size + 14}
                        textAnchor="middle"
                        className="text-xs fill-zinc-600 font-medium pointer-events-none"
                        style={{ fontSize: '10px' }}
                        opacity={opacity}
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
            <span className="text-xs text-zinc-500 px-1" data-testid="zoom-level">
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
        <div className="mt-3 flex flex-wrap gap-2" data-testid="graph-legend">
          {nodeTypes.map((type) => (
            <Badge
              key={type}
              variant="outline"
              className={cn(
                'text-xs cursor-pointer transition-all duration-200',
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
              data-testid={`legend-badge-${type}`}
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
        <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500" data-testid="graph-stats">
          <span>
            {renderNodes.length} nodes, {renderLinks.length} connections
          </span>
          <span>Layout: force-directed (animated)</span>
        </div>
      </CardContent>
    </Card>
  );
}
