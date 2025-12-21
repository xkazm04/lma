'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type {
  Portfolio3DData,
  BorrowerNode,
  CorrelationLink,
  NodeInteractionEvent,
  VisualizationSettings,
} from '../lib/types';
import { formatExposure, getRiskColor } from '../lib/graph-utils';

interface Fallback2DViewProps {
  data: Portfolio3DData;
  settings: VisualizationSettings;
  selectedNodeId?: string | null;
  onNodeClick?: (event: NodeInteractionEvent) => void;
  onNodeHover?: (event: NodeInteractionEvent | null) => void;
  className?: string;
}

// Simple 2D force-directed layout
function use2DLayout(nodes: BorrowerNode[], links: CorrelationLink[]) {
  return useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();
    const width = 800;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;

    // Initialize positions in a circle
    nodes.forEach((node, i) => {
      const angle = (i / nodes.length) * Math.PI * 2;
      const radius = 200;
      positions.set(node.id, {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      });
    });

    // Simple force simulation (10 iterations)
    for (let iter = 0; iter < 50; iter++) {
      // Repulsion between nodes
      nodes.forEach((nodeA) => {
        const posA = positions.get(nodeA.id)!;
        nodes.forEach((nodeB) => {
          if (nodeA.id === nodeB.id) return;
          const posB = positions.get(nodeB.id)!;

          const dx = posA.x - posB.x;
          const dy = posA.y - posB.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          const repulsion = 500 / (dist * dist);
          posA.x += (dx / dist) * repulsion;
          posA.y += (dy / dist) * repulsion;
        });
      });

      // Attraction along links
      links.forEach((link) => {
        const posA = positions.get(link.source);
        const posB = positions.get(link.target);
        if (!posA || !posB) return;

        const dx = posB.x - posA.x;
        const dy = posB.y - posA.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        const attraction = link.strength * dist * 0.01;
        posA.x += (dx / dist) * attraction;
        posA.y += (dy / dist) * attraction;
        posB.x -= (dx / dist) * attraction;
        posB.y -= (dy / dist) * attraction;
      });

      // Center gravity
      nodes.forEach((node) => {
        const pos = positions.get(node.id)!;
        pos.x += (centerX - pos.x) * 0.01;
        pos.y += (centerY - pos.y) * 0.01;
      });
    }

    // Normalize to fit in view
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    positions.forEach((pos) => {
      minX = Math.min(minX, pos.x);
      maxX = Math.max(maxX, pos.x);
      minY = Math.min(minY, pos.y);
      maxY = Math.max(maxY, pos.y);
    });

    const scaleX = width * 0.8 / (maxX - minX || 1);
    const scaleY = height * 0.8 / (maxY - minY || 1);
    const scale = Math.min(scaleX, scaleY);

    positions.forEach((pos, id) => {
      pos.x = centerX + (pos.x - (minX + maxX) / 2) * scale;
      pos.y = centerY + (pos.y - (minY + maxY) / 2) * scale;
      positions.set(id, pos);
    });

    return positions;
  }, [nodes, links]);
}

export function Fallback2DView({
  data,
  settings,
  selectedNodeId,
  onNodeClick,
  onNodeHover,
  className,
}: Fallback2DViewProps) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const positions = use2DLayout(data.nodes, data.links);

  const handleNodeClick = useCallback(
    (node: BorrowerNode) => {
      const pos = positions.get(node.id);
      onNodeClick?.({
        type: 'click',
        nodeId: node.id,
        node,
        position: { x: pos?.x || 0, y: pos?.y || 0, z: 0 },
      });
    },
    [onNodeClick, positions]
  );

  const handleNodeHover = useCallback(
    (node: BorrowerNode | null) => {
      setHoveredNodeId(node?.id || null);
      if (node) {
        const pos = positions.get(node.id);
        onNodeHover?.({
          type: 'hover',
          nodeId: node.id,
          node,
          position: { x: pos?.x || 0, y: pos?.y || 0, z: 0 },
        });
      } else {
        onNodeHover?.(null);
      }
    },
    [onNodeHover, positions]
  );

  // Highlighted links when a node is selected/hovered
  const activeNodeId = hoveredNodeId || selectedNodeId;

  return (
    <div className={cn('relative w-full h-full bg-zinc-900 rounded-lg overflow-hidden', className)}>
      <svg
        viewBox="0 0 800 600"
        className="w-full h-full"
        data-testid="fallback-2d-svg"
      >
        <defs>
          {/* Gradient for links */}
          <linearGradient id="link-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6b7280" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#6b7280" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#6b7280" stopOpacity="0.3" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Correlation lines */}
        {settings.showCorrelationLines &&
          data.links.map((link) => {
            const sourcePos = positions.get(link.source);
            const targetPos = positions.get(link.target);
            if (!sourcePos || !targetPos) return null;

            const isHighlighted =
              activeNodeId === link.source || activeNodeId === link.target;

            return (
              <line
                key={link.id}
                x1={sourcePos.x}
                y1={sourcePos.y}
                x2={targetPos.x}
                y2={targetPos.y}
                stroke={isHighlighted ? link.color : '#4b5563'}
                strokeWidth={isHighlighted ? 3 : 1 + link.strength * 2}
                strokeOpacity={isHighlighted ? 0.9 : 0.3 + link.strength * 0.3}
                strokeDasharray={link.strength < 0.3 ? '5,5' : 'none'}
                data-testid={`link-2d-${link.id}`}
              />
            );
          })}

        {/* Borrower nodes */}
        {data.nodes.map((node) => {
          const pos = positions.get(node.id);
          if (!pos) return null;

          const isSelected = node.id === selectedNodeId;
          const isHovered = node.id === hoveredNodeId;
          const nodeRadius = 20 + node.radius * 10;

          return (
            <g
              key={node.id}
              transform={`translate(${pos.x}, ${pos.y})`}
              onClick={() => handleNodeClick(node)}
              onMouseEnter={() => handleNodeHover(node)}
              onMouseLeave={() => handleNodeHover(null)}
              className="cursor-pointer"
              data-testid={`node-2d-${node.id}`}
            >
              {/* Glow effect for high-risk */}
              {node.glowIntensity > 0 && (
                <circle
                  r={nodeRadius * 1.5}
                  fill={node.color}
                  opacity={node.glowIntensity * 0.3}
                  filter="url(#glow)"
                />
              )}

              {/* Selection ring */}
              {isSelected && (
                <circle
                  r={nodeRadius + 6}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={2}
                  opacity={0.8}
                />
              )}

              {/* Main circle */}
              <circle
                r={nodeRadius}
                fill={node.color}
                stroke={isHovered || isSelected ? '#ffffff' : 'transparent'}
                strokeWidth={2}
                opacity={0.9}
                style={{
                  transition: 'all 0.2s ease',
                  transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                  transformOrigin: 'center',
                }}
              />

              {/* Label */}
              {settings.showLabels && (
                <text
                  y={nodeRadius + 16}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize={11 * settings.labelScale}
                  fontWeight={500}
                  className="pointer-events-none"
                >
                  {node.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip */}
      {hoveredNodeId && (
        <NodeTooltip
          node={data.nodes.find((n) => n.id === hoveredNodeId)!}
          position={positions.get(hoveredNodeId)!}
        />
      )}
    </div>
  );
}

// Tooltip component
interface NodeTooltipProps {
  node: BorrowerNode;
  position: { x: number; y: number };
}

function NodeTooltip({ node, position }: NodeTooltipProps) {
  // Convert SVG coordinates to percentage for positioning
  const left = `${(position.x / 800) * 100}%`;
  const top = `${(position.y / 600) * 100}%`;

  return (
    <div
      className="absolute bg-zinc-800/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-xl border border-zinc-700 min-w-[180px] pointer-events-none z-10"
      style={{
        left,
        top,
        transform: 'translate(-50%, -120%)',
      }}
      data-testid={`tooltip-2d-${node.id}`}
    >
      <p className="text-white font-medium text-sm mb-1">{node.name}</p>
      <div className="space-y-0.5 text-xs">
        <p className="text-zinc-400">
          Exposure:{' '}
          <span className="text-zinc-200">
            {formatExposure(node.profile.totalExposure)}
          </span>
        </p>
        <p className="text-zinc-400">
          Health:{' '}
          <span
            className={
              node.healthScore >= 70
                ? 'text-green-400'
                : node.healthScore >= 50
                ? 'text-yellow-400'
                : 'text-red-400'
            }
          >
            {Math.round(node.healthScore)}%
          </span>
        </p>
        <p className="text-zinc-400">
          Industry:{' '}
          <span className="text-zinc-200">{node.profile.industry}</span>
        </p>
        <p className="text-zinc-400">
          Risk Level:{' '}
          <span
            className={cn(
              node.riskLevel === 'critical' && 'text-red-400',
              node.riskLevel === 'high' && 'text-orange-400',
              node.riskLevel === 'medium' && 'text-yellow-400',
              node.riskLevel === 'low' && 'text-green-400'
            )}
          >
            {node.riskLevel.charAt(0).toUpperCase() + node.riskLevel.slice(1)}
          </span>
        </p>
      </div>
    </div>
  );
}
