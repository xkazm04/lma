'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { TerrainPoint } from '../lib/types';

interface HealthTerrainProps {
  terrain: TerrainPoint[];
  gridSize?: number;
  opacity?: number;
}

export function HealthTerrain({
  terrain,
  gridSize = 20,
  opacity = 0.4,
}: HealthTerrainProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Create geometry from terrain points
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    const sideLength = Math.sqrt(terrain.length);
    if (sideLength !== Math.floor(sideLength)) {
      console.warn('Terrain points should form a perfect grid');
      return geo;
    }

    const size = Math.floor(sideLength);

    // Create vertices
    terrain.forEach((point) => {
      vertices.push(point.x, point.height, point.z);

      // Parse color
      const color = new THREE.Color(point.color.slice(0, 7)); // Remove alpha
      colors.push(color.r, color.g, color.b);
    });

    // Create indices for triangles
    for (let i = 0; i < size - 1; i++) {
      for (let j = 0; j < size - 1; j++) {
        const a = i * size + j;
        const b = i * size + j + 1;
        const c = (i + 1) * size + j;
        const d = (i + 1) * size + j + 1;

        // Two triangles per grid cell
        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    geo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    geo.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(colors, 3)
    );
    geo.setIndex(indices);
    geo.computeVertexNormals();

    return geo;
  }, [terrain]);

  // Gentle wave animation
  useFrame((state) => {
    if (meshRef.current) {
      const positions = meshRef.current.geometry.getAttribute('position');
      const originalPositions = positions.array as Float32Array;

      // Very subtle wave effect
      for (let i = 0; i < positions.count; i++) {
        const x = originalPositions[i * 3];
        const z = originalPositions[i * 3 + 2];
        const baseY = terrain[i]?.height || -2;
        positions.setY(
          i,
          baseY + Math.sin(state.clock.elapsedTime * 0.3 + x * 0.2 + z * 0.2) * 0.05
        );
      }
      positions.needsUpdate = true;
    }
  });

  if (terrain.length === 0) return null;

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      rotation={[0, 0, 0]}
      data-testid="health-terrain"
    >
      <meshStandardMaterial
        vertexColors
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        wireframe={false}
        metalness={0.1}
        roughness={0.9}
      />
    </mesh>
  );
}

// Grid overlay for reference
interface TerrainGridProps {
  size?: number;
  divisions?: number;
  color?: string;
  opacity?: number;
}

export function TerrainGrid({
  size = 30,
  divisions = 30,
  color = '#374151',
  opacity = 0.2,
}: TerrainGridProps) {
  return (
    <gridHelper
      args={[size, divisions, color, color]}
      position={[0, -3, 0]}
      data-testid="terrain-grid"
    >
      <meshBasicMaterial transparent opacity={opacity} />
    </gridHelper>
  );
}

// Region boundary visualization
interface RegionBoundaryProps {
  center: [number, number, number];
  size: [number, number, number];
  color: string;
  label?: string;
  opacity?: number;
}

export function RegionBoundary({
  center,
  size,
  color,
  label,
  opacity = 0.1,
}: RegionBoundaryProps) {
  return (
    <group position={center}>
      {/* Semi-transparent box */}
      <mesh>
        <boxGeometry args={size} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Wireframe outline */}
      <lineSegments>
        <edgesGeometry
          args={[new THREE.BoxGeometry(...size)]}
        />
        <lineBasicMaterial color={color} transparent opacity={0.5} />
      </lineSegments>
    </group>
  );
}
