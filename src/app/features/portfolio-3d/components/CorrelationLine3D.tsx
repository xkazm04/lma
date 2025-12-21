'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { QuadraticBezierLine } from '@react-three/drei';
import type { Mesh } from 'three';
import type { CorrelationLink, BorrowerNode, LinkInteractionEvent } from '../lib/types';

interface CorrelationLine3DProps {
  link: CorrelationLink;
  sourceNode: BorrowerNode | undefined;
  targetNode: BorrowerNode | undefined;
  onHover?: (event: LinkInteractionEvent | null) => void;
  onClick?: (event: LinkInteractionEvent) => void;
}

export function CorrelationLine3D({
  link,
  sourceNode,
  targetNode,
}: CorrelationLine3DProps) {

  // Don't render if nodes are missing
  if (!sourceNode || !targetNode) return null;

  // Calculate midpoint with curve
  const midPoint = useMemo(() => {
    const midX = (sourceNode.position.x + targetNode.position.x) / 2;
    const midY =
      (sourceNode.position.y + targetNode.position.y) / 2 +
      link.strength * 1.5; // Higher correlation = higher curve
    const midZ = (sourceNode.position.z + targetNode.position.z) / 2;
    return [midX, midY, midZ] as [number, number, number];
  }, [sourceNode.position, targetNode.position, link.strength]);

  const startPoint: [number, number, number] = [
    sourceNode.position.x,
    sourceNode.position.y,
    sourceNode.position.z,
  ];

  const endPoint: [number, number, number] = [
    targetNode.position.x,
    targetNode.position.y,
    targetNode.position.z,
  ];

  // Determine visual properties based on correlation strength
  const lineWidth = useMemo(() => {
    if (link.isHighlighted) return 4;
    return 1 + link.strength * 3;
  }, [link.strength, link.isHighlighted]);

  const opacity = useMemo(() => {
    if (link.isHighlighted) return 1;
    return link.opacity;
  }, [link.opacity, link.isHighlighted]);

  return (
    <QuadraticBezierLine
      start={startPoint}
      end={endPoint}
      mid={midPoint}
      color={link.color}
      lineWidth={lineWidth}
      transparent
      opacity={opacity}
      dashed={link.strength < 0.3}
      dashScale={10}
      dashSize={0.5}
      gapSize={0.2}
    />
  );
}

// Animated flow particles on correlation lines for high-strength connections
interface FlowParticleProps {
  startPoint: [number, number, number];
  midPoint: [number, number, number];
  endPoint: [number, number, number];
  color: string;
  speed: number;
}

export function FlowParticle({
  startPoint,
  midPoint,
  endPoint,
  color,
  speed,
}: FlowParticleProps) {
  const meshRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Quadratic bezier interpolation
      const t = ((state.clock.elapsedTime * speed) % 2) / 2; // 0 to 1, then restart
      const oneMinusT = 1 - t;

      // B(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
      const x =
        oneMinusT * oneMinusT * startPoint[0] +
        2 * oneMinusT * t * midPoint[0] +
        t * t * endPoint[0];
      const y =
        oneMinusT * oneMinusT * startPoint[1] +
        2 * oneMinusT * t * midPoint[1] +
        t * t * endPoint[1];
      const z =
        oneMinusT * oneMinusT * startPoint[2] +
        2 * oneMinusT * t * midPoint[2] +
        t * t * endPoint[2];

      meshRef.current.position.set(x, y, z);
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.8} />
    </mesh>
  );
}

// Render correlation lines with optional flow particles
interface CorrelationLinesGroupProps {
  links: CorrelationLink[];
  nodes: BorrowerNode[];
  showFlowParticles?: boolean;
  onLinkHover?: (event: LinkInteractionEvent | null) => void;
  onLinkClick?: (event: LinkInteractionEvent) => void;
}

export function CorrelationLinesGroup({
  links,
  nodes,
  showFlowParticles = false,
  onLinkHover,
  onLinkClick,
}: CorrelationLinesGroupProps) {
  const nodeMap = useMemo(() => {
    return new Map(nodes.map((n) => [n.id, n]));
  }, [nodes]);

  return (
    <group data-testid="correlation-lines-group">
      {links.map((link) => {
        const sourceNode = nodeMap.get(link.source);
        const targetNode = nodeMap.get(link.target);

        if (!sourceNode || !targetNode) return null;

        return (
          <CorrelationLine3D
            key={link.id}
            link={link}
            sourceNode={sourceNode}
            targetNode={targetNode}
            onHover={onLinkHover}
            onClick={onLinkClick}
          />
        );
      })}

      {/* Flow particles for high-strength correlations */}
      {showFlowParticles &&
        links
          .filter((l) => l.strength >= 0.5)
          .map((link) => {
            const sourceNode = nodeMap.get(link.source);
            const targetNode = nodeMap.get(link.target);

            if (!sourceNode || !targetNode) return null;

            const startPoint: [number, number, number] = [
              sourceNode.position.x,
              sourceNode.position.y,
              sourceNode.position.z,
            ];
            const endPoint: [number, number, number] = [
              targetNode.position.x,
              targetNode.position.y,
              targetNode.position.z,
            ];
            const midPoint: [number, number, number] = [
              (startPoint[0] + endPoint[0]) / 2,
              (startPoint[1] + endPoint[1]) / 2 + link.strength * 1.5,
              (startPoint[2] + endPoint[2]) / 2,
            ];

            return (
              <FlowParticle
                key={`particle-${link.id}`}
                startPoint={startPoint}
                midPoint={midPoint}
                endPoint={endPoint}
                color={link.color}
                speed={0.5 + link.strength}
              />
            );
          })}
    </group>
  );
}
