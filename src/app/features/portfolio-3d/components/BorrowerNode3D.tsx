'use client';

import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard, Html } from '@react-three/drei';
import type * as THREE from 'three';
import type { BorrowerNode, NodeInteractionEvent } from '../lib/types';
import { formatExposure } from '../lib/graph-utils';

interface BorrowerNode3DProps {
  node: BorrowerNode;
  showLabel: boolean;
  labelScale: number;
  onClick?: (event: NodeInteractionEvent) => void;
  onHover?: (event: NodeInteractionEvent | null) => void;
}

export function BorrowerNode3D({
  node,
  showLabel,
  labelScale,
  onClick,
  onHover,
}: BorrowerNode3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Animation
  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y =
        node.position.y + Math.sin(state.clock.elapsedTime * 0.5 + node.position.x) * 0.05;

      // Pulse when hovered or selected
      if (hovered || node.isSelected) {
        const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.05;
        meshRef.current.scale.setScalar(pulse);
      } else {
        meshRef.current.scale.setScalar(1);
      }
    }

    // Glow animation
    if (glowRef.current && node.glowIntensity > 0) {
      const glowPulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
      glowRef.current.scale.setScalar(glowPulse * 1.5);
    }
  });

  // Calculate display values
  const displayColor = useMemo(() => {
    if (node.isSelected) return '#ffffff';
    if (hovered) return '#a5b4fc'; // indigo-300
    return node.color;
  }, [node.color, node.isSelected, hovered]);

  const handlePointerOver = () => {
    setHovered(true);
    document.body.style.cursor = 'pointer';
    onHover?.({
      type: 'hover',
      nodeId: node.id,
      node,
      position: node.position,
    });
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'default';
    onHover?.(null);
  };

  const handleClick = () => {
    onClick?.({
      type: 'click',
      nodeId: node.id,
      node,
      position: node.position,
    });
  };

  return (
    <group position={[node.position.x, node.position.y, node.position.z]}>
      {/* Glow effect for high-risk nodes */}
      {node.glowIntensity > 0 && (
        <mesh ref={glowRef}>
          <sphereGeometry args={[node.radius * 1.5, 16, 16]} />
          <meshBasicMaterial
            color={node.color}
            transparent
            opacity={node.glowIntensity * 0.3}
          />
        </mesh>
      )}

      {/* Main sphere */}
      <mesh
        ref={meshRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        data-testid={`borrower-node-${node.id}`}
      >
        <sphereGeometry args={[node.radius, 32, 32]} />
        <meshStandardMaterial
          color={displayColor}
          emissive={displayColor}
          emissiveIntensity={hovered || node.isSelected ? 0.3 : 0.1}
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>

      {/* Selection ring */}
      {node.isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[node.radius * 1.3, node.radius * 1.5, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
      )}

      {/* Label */}
      {showLabel && (
        <Billboard follow lockX={false} lockY={false} lockZ={false}>
          <Text
            position={[0, node.radius + 0.4 * labelScale, 0]}
            fontSize={0.25 * labelScale}
            color="#ffffff"
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            {node.name}
          </Text>
        </Billboard>
      )}

      {/* Hover tooltip */}
      {hovered && (
        <Html
          position={[0, node.radius + 1, 0]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div
            className="bg-zinc-900/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-xl border border-zinc-700 min-w-[180px]"
            data-testid={`node-tooltip-${node.id}`}
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
                Rating:{' '}
                <span className="text-zinc-200">
                  {node.profile.creditRating || 'N/A'}
                </span>
              </p>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
