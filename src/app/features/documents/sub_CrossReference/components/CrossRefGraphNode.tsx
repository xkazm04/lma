'use client';

import React, { memo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { CrossRefNodeWithPosition } from '../lib/types';
import { NODE_TYPE_LABELS, IMPACT_COLORS } from '../lib/types';

interface CrossRefGraphNodeProps {
  node: CrossRefNodeWithPosition;
  color: string;
  showLabel: boolean;
  isSelected: boolean;
  isHovered: boolean;
  isHighlighted: boolean;
  onClick: (nodeId: string) => void;
  onMouseEnter: (nodeId: string) => void;
  onMouseLeave: () => void;
  onDragStart: (nodeId: string, e: React.MouseEvent) => void;
  onDoubleClick: (nodeId: string) => void;
}

/**
 * Individual node in the cross-reference graph
 */
export const CrossRefGraphNode = memo(function CrossRefGraphNode({
  node,
  color,
  showLabel,
  isSelected,
  isHovered,
  isHighlighted,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onDragStart,
  onDoubleClick,
}: CrossRefGraphNodeProps) {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(node.id);
  }, [onClick, node.id]);

  const handleMouseEnter = useCallback(() => {
    onMouseEnter(node.id);
  }, [onMouseEnter, node.id]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDragStart(node.id, e);
  }, [onDragStart, node.id]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDoubleClick(node.id);
  }, [onDoubleClick, node.id]);

  // Calculate node size based on connections and importance
  const baseSize = 16;
  const connectionBonus = Math.min((node.incomingCount + node.outgoingCount) * 2, 16);
  const modifiedBonus = node.isModified ? 4 : 0;
  const size = baseSize + connectionBonus + modifiedBonus;

  // Impact ring size
  const impactRingSize = size + 8;

  // Ripple animation
  const rippleSize = node.rippleProgress !== undefined ? size + (node.rippleProgress * 60) : 0;
  const rippleOpacity = node.rippleProgress !== undefined ? (1 - node.rippleProgress) * 0.5 : 0;

  return (
    <g
      transform={`translate(${node.position.x}, ${node.position.y})`}
      className="cursor-pointer transition-transform duration-150"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      data-testid={`graph-node-${node.id}`}
      role="button"
      tabIndex={0}
      aria-label={`${node.name} (${NODE_TYPE_LABELS[node.type]})`}
    >
      {/* Ripple effect */}
      {node.rippleProgress !== undefined && (
        <circle
          r={rippleSize / 2}
          fill="none"
          stroke={IMPACT_COLORS[node.impactSeverity]}
          strokeWidth={2}
          opacity={rippleOpacity}
          className="pointer-events-none"
        />
      )}

      {/* Impact severity ring */}
      {(isSelected || isHighlighted) && node.impactSeverity !== 'none' && (
        <circle
          r={impactRingSize / 2}
          fill="none"
          stroke={IMPACT_COLORS[node.impactSeverity]}
          strokeWidth={2}
          strokeDasharray={isHighlighted && !isSelected ? '4 2' : 'none'}
          opacity={0.7}
          className="pointer-events-none animate-pulse"
        />
      )}

      {/* Selection/hover glow */}
      {(isSelected || isHovered) && (
        <circle
          r={(size + 6) / 2}
          fill={color}
          opacity={0.3}
          className="pointer-events-none"
        />
      )}

      {/* Main node circle */}
      <circle
        r={size / 2}
        fill={color}
        stroke={isSelected ? '#1e1e1e' : isHovered ? '#404040' : 'transparent'}
        strokeWidth={isSelected ? 3 : isHovered ? 2 : 0}
        opacity={isHighlighted || isSelected || isHovered ? 1 : 0.8}
        className="transition-all duration-150"
      />

      {/* Modified indicator */}
      {node.isModified && (
        <circle
          r={4}
          cx={(size / 2) - 2}
          cy={-(size / 2) + 2}
          fill="#f97316"
          stroke="white"
          strokeWidth={1.5}
        />
      )}

      {/* Pinned indicator */}
      {node.fx !== undefined && (
        <circle
          r={3}
          cx={-(size / 2) + 2}
          cy={-(size / 2) + 2}
          fill="#3b82f6"
          stroke="white"
          strokeWidth={1}
        />
      )}

      {/* Label */}
      {showLabel && (
        <text
          y={size / 2 + 14}
          textAnchor="middle"
          fontSize={11}
          fontWeight={isSelected || isHovered ? 600 : 400}
          fill={isSelected || isHovered ? '#1e1e1e' : '#525252'}
          className="pointer-events-none select-none"
          style={{ paintOrder: 'stroke', stroke: 'white', strokeWidth: 3 }}
        >
          {node.name.length > 20 ? `${node.name.slice(0, 18)}...` : node.name}
        </text>
      )}

      {/* Type indicator (small) */}
      {showLabel && (
        <text
          y={size / 2 + 26}
          textAnchor="middle"
          fontSize={9}
          fill="#737373"
          className="pointer-events-none select-none"
        >
          {NODE_TYPE_LABELS[node.type]}
        </text>
      )}
    </g>
  );
});
