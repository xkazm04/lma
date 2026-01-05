'use client';

import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { CrossRefGraphNode } from './CrossRefGraphNode';
import { CrossRefGraphLink } from './CrossRefGraphLink';
import type {
  CrossRefNodeWithPosition,
  CrossRefLink,
  Position2D,
  GraphVisualizationSettings,
} from '../lib/types';

interface CrossRefGraphProps {
  /** Nodes with positions */
  nodes: CrossRefNodeWithPosition[];
  /** Links between nodes */
  links: CrossRefLink[];
  /** Visualization settings */
  settings: GraphVisualizationSettings;
  /** Currently selected node ID */
  selectedNodeId: string | null;
  /** Currently hovered node ID */
  hoveredNodeId: string | null;
  /** Highlighted node IDs */
  highlightedNodeIds: Set<string>;
  /** Zoom level */
  zoomLevel: number;
  /** Pan offset */
  panOffset: Position2D;
  /** Get node color */
  getNodeColor: (node: CrossRefNodeWithPosition) => string;
  /** Get link color */
  getLinkColor: (link: CrossRefLink) => string;
  /** Handle node click */
  onNodeClick: (nodeId: string) => void;
  /** Handle node hover */
  onNodeHover: (nodeId: string | null) => void;
  /** Handle node double-click (trigger ripple) */
  onNodeDoubleClick: (nodeId: string) => void;
  /** Handle node drag */
  onNodeDrag: (nodeId: string, position: Position2D) => void;
  /** Handle zoom change */
  onZoomChange: (zoom: number) => void;
  /** Handle pan change */
  onPanChange: (offset: Position2D) => void;
  /** Handle background click (deselect) */
  onBackgroundClick: () => void;
  /** CSS class name */
  className?: string;
}

/**
 * SVG-based cross-reference graph visualization
 */
export function CrossRefGraph({
  nodes,
  links,
  settings,
  selectedNodeId,
  hoveredNodeId,
  highlightedNodeIds,
  zoomLevel,
  panOffset,
  getNodeColor,
  getLinkColor,
  onNodeClick,
  onNodeHover,
  onNodeDoubleClick,
  onNodeDrag,
  onZoomChange,
  onPanChange,
  onBackgroundClick,
  className,
}: CrossRefGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState<Position2D>({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Create node map for quick lookup
  const nodeMap = useMemo(() => {
    return new Map(nodes.map(n => [n.id, n]));
  }, [nodes]);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Get SVG coordinates from mouse event
  const getSVGCoords = useCallback((e: React.MouseEvent): Position2D => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - panOffset.x) / zoomLevel,
      y: (e.clientY - rect.top - panOffset.y) / zoomLevel,
    };
  }, [panOffset, zoomLevel]);

  // Handle wheel for zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.3, Math.min(3, zoomLevel + delta));
    onZoomChange(newZoom);
  }, [zoomLevel, onZoomChange]);

  // Handle mouse down for pan/drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;

    setLastMousePos({ x: e.clientX, y: e.clientY });

    // If not clicking on a node, start panning
    if (!dragNodeId) {
      setIsPanning(true);
    }
  }, [dragNodeId]);

  // Handle node drag start
  const handleNodeDragStart = useCallback((nodeId: string, e: React.MouseEvent) => {
    setDragNodeId(nodeId);
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
    e.stopPropagation();
  }, []);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
    setLastMousePos({ x: e.clientX, y: e.clientY });

    if (isDragging && dragNodeId) {
      const coords = getSVGCoords(e);
      onNodeDrag(dragNodeId, coords);
    } else if (isPanning) {
      onPanChange({
        x: panOffset.x + dx,
        y: panOffset.y + dy,
      });
    }
  }, [isDragging, dragNodeId, isPanning, lastMousePos, panOffset, getSVGCoords, onNodeDrag, onPanChange]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragNodeId(null);
    setIsPanning(false);
  }, []);

  // Handle background click
  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as SVGElement).tagName === 'rect') {
      onBackgroundClick();
    }
  }, [onBackgroundClick]);

  // Transform for zoom and pan
  const transform = `translate(${panOffset.x}, ${panOffset.y}) scale(${zoomLevel})`;

  // Sort links and nodes for proper z-ordering
  const sortedLinks = useMemo(() => {
    return [...links].sort((a, b) => {
      const aHighlighted = highlightedNodeIds.has(a.sourceId) || highlightedNodeIds.has(a.targetId);
      const bHighlighted = highlightedNodeIds.has(b.sourceId) || highlightedNodeIds.has(b.targetId);
      if (aHighlighted && !bHighlighted) return 1;
      if (!aHighlighted && bHighlighted) return -1;
      return 0;
    });
  }, [links, highlightedNodeIds]);

  const sortedNodes = useMemo(() => {
    return [...nodes].sort((a, b) => {
      // Selected node on top
      if (a.id === selectedNodeId) return 1;
      if (b.id === selectedNodeId) return -1;
      // Hovered node next
      if (a.id === hoveredNodeId) return 1;
      if (b.id === hoveredNodeId) return -1;
      // Highlighted nodes next
      if (highlightedNodeIds.has(a.id) && !highlightedNodeIds.has(b.id)) return 1;
      if (!highlightedNodeIds.has(a.id) && highlightedNodeIds.has(b.id)) return -1;
      // Modified nodes next
      if (a.isModified && !b.isModified) return 1;
      if (!a.isModified && b.isModified) return -1;
      return 0;
    });
  }, [nodes, selectedNodeId, hoveredNodeId, highlightedNodeIds]);

  return (
    <svg
      ref={svgRef}
      className={cn(
        'w-full h-full bg-zinc-50 rounded-lg border border-zinc-200',
        isDragging && 'cursor-grabbing',
        isPanning && 'cursor-grab',
        className
      )}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleBackgroundClick}
      data-testid="cross-ref-graph-svg"
    >
      {/* Background */}
      <rect width="100%" height="100%" fill="#fafafa" />

      {/* Grid pattern for visual reference */}
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="#e4e4e7"
            strokeWidth="0.5"
          />
        </pattern>
        <pattern id="gridLarge" width="200" height="200" patternUnits="userSpaceOnUse">
          <path
            d="M 200 0 L 0 0 0 200"
            fill="none"
            stroke="#d4d4d8"
            strokeWidth="1"
          />
        </pattern>
      </defs>

      <g transform={transform}>
        {/* Grid */}
        <rect
          x={-dimensions.width}
          y={-dimensions.height}
          width={dimensions.width * 4}
          height={dimensions.height * 4}
          fill="url(#grid)"
        />
        <rect
          x={-dimensions.width}
          y={-dimensions.height}
          width={dimensions.width * 4}
          height={dimensions.height * 4}
          fill="url(#gridLarge)"
        />

        {/* Links layer */}
        <g className="links">
          {sortedLinks.map(link => {
            const sourceNode = nodeMap.get(link.sourceId);
            const targetNode = nodeMap.get(link.targetId);
            if (!sourceNode || !targetNode) return null;

            const isHighlighted =
              link.sourceId === selectedNodeId ||
              link.targetId === selectedNodeId ||
              link.sourceId === hoveredNodeId ||
              link.targetId === hoveredNodeId ||
              (highlightedNodeIds.has(link.sourceId) && highlightedNodeIds.has(link.targetId));

            return (
              <CrossRefGraphLink
                key={link.id}
                link={link}
                sourceNode={sourceNode}
                targetNode={targetNode}
                color={getLinkColor(link)}
                showLabel={settings.showLinkLabels}
                isHighlighted={isHighlighted}
              />
            );
          })}
        </g>

        {/* Nodes layer */}
        <g className="nodes">
          {sortedNodes.map(node => (
            <CrossRefGraphNode
              key={node.id}
              node={node}
              color={getNodeColor(node)}
              showLabel={settings.showLabels}
              isSelected={node.id === selectedNodeId}
              isHovered={node.id === hoveredNodeId}
              isHighlighted={highlightedNodeIds.has(node.id)}
              onClick={onNodeClick}
              onMouseEnter={onNodeHover}
              onMouseLeave={() => onNodeHover(null)}
              onDragStart={handleNodeDragStart}
              onDoubleClick={onNodeDoubleClick}
            />
          ))}
        </g>
      </g>

      {/* Zoom indicator */}
      <g transform={`translate(${dimensions.width - 80}, ${dimensions.height - 30})`}>
        <rect
          x={0}
          y={0}
          width={70}
          height={24}
          rx={4}
          fill="white"
          stroke="#e4e4e7"
          strokeWidth={1}
        />
        <text
          x={35}
          y={16}
          textAnchor="middle"
          fontSize={11}
          fill="#525252"
        >
          {Math.round(zoomLevel * 100)}%
        </text>
      </g>

      {/* Node count indicator */}
      <g transform="translate(10, 10)">
        <rect
          x={0}
          y={0}
          width={120}
          height={24}
          rx={4}
          fill="white"
          stroke="#e4e4e7"
          strokeWidth={1}
        />
        <text
          x={10}
          y={16}
          fontSize={11}
          fill="#525252"
        >
          {nodes.length} nodes, {links.length} links
        </text>
      </g>
    </svg>
  );
}
