'use client';

import React, { memo, useMemo } from 'react';
import type { CrossRefLink, CrossRefNodeWithPosition } from '../lib/types';
import { LINK_TYPE_LABELS } from '../lib/types';

interface CrossRefGraphLinkProps {
  link: CrossRefLink;
  sourceNode: CrossRefNodeWithPosition;
  targetNode: CrossRefNodeWithPosition;
  color: string;
  showLabel: boolean;
  isHighlighted: boolean;
}

/**
 * Link/edge between nodes in the cross-reference graph
 */
export const CrossRefGraphLink = memo(function CrossRefGraphLink({
  link,
  sourceNode,
  targetNode,
  color,
  showLabel,
  isHighlighted,
}: CrossRefGraphLinkProps) {
  // Calculate line parameters
  const dx = targetNode.position.x - sourceNode.position.x;
  const dy = targetNode.position.y - sourceNode.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Skip very short links
  if (distance < 20) return null;

  // Calculate arrow head position (slightly before target)
  const sourceRadius = 16 + Math.min((sourceNode.incomingCount + sourceNode.outgoingCount) * 2, 16);
  const targetRadius = 16 + Math.min((targetNode.incomingCount + targetNode.outgoingCount) * 2, 16);

  const unitDx = dx / distance;
  const unitDy = dy / distance;

  const startX = sourceNode.position.x + unitDx * (sourceRadius / 2 + 5);
  const startY = sourceNode.position.y + unitDy * (sourceRadius / 2 + 5);
  const endX = targetNode.position.x - unitDx * (targetRadius / 2 + 10);
  const endY = targetNode.position.y - unitDy * (targetRadius / 2 + 10);

  // Curved path for better readability
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  const perpX = -unitDy * (distance * 0.05);
  const perpY = unitDx * (distance * 0.05);
  const controlX = midX + perpX;
  const controlY = midY + perpY;

  // Arrow head
  const arrowSize = 6 + link.strength * 2;
  const arrowAngle = Math.atan2(endY - controlY, endX - controlX);
  const arrowX1 = endX - arrowSize * Math.cos(arrowAngle - Math.PI / 6);
  const arrowY1 = endY - arrowSize * Math.sin(arrowAngle - Math.PI / 6);
  const arrowX2 = endX - arrowSize * Math.cos(arrowAngle + Math.PI / 6);
  const arrowY2 = endY - arrowSize * Math.sin(arrowAngle + Math.PI / 6);

  // Link width based on strength
  const strokeWidth = 1 + link.strength * 2;

  // Opacity based on highlighting
  const opacity = isHighlighted ? 0.9 : 0.4;

  // Label position
  const labelX = controlX;
  const labelY = controlY - 8;

  return (
    <g
      className="pointer-events-none"
      data-testid={`graph-link-${link.id}`}
    >
      {/* Main link path */}
      <path
        d={`M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeOpacity={opacity}
        strokeDasharray={link.isModified ? '5 3' : 'none'}
        className="transition-opacity duration-150"
      />

      {/* Arrow head */}
      <polygon
        points={`${endX},${endY} ${arrowX1},${arrowY1} ${arrowX2},${arrowY2}`}
        fill={color}
        fillOpacity={opacity}
      />

      {/* Link type label */}
      {showLabel && isHighlighted && (
        <text
          x={labelX}
          y={labelY}
          textAnchor="middle"
          fontSize={9}
          fill="#525252"
          className="select-none"
          style={{ paintOrder: 'stroke', stroke: 'white', strokeWidth: 2 }}
        >
          {LINK_TYPE_LABELS[link.type]}
        </text>
      )}

      {/* Modified indicator */}
      {link.isModified && isHighlighted && (
        <circle
          cx={labelX}
          cy={labelY + 12}
          r={4}
          fill="#f97316"
          stroke="white"
          strokeWidth={1}
        />
      )}
    </g>
  );
});
