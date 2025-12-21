'use client';

import React, { useRef, useMemo, useCallback, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Stars, Float } from '@react-three/drei';
import type {
  Portfolio3DData,
  VisualizationSettings,
  NodeInteractionEvent,
  LinkInteractionEvent,
  CameraState,
  BorrowerNode,
} from '../lib/types';
import { applyForceSimulation, DEFAULT_SETTINGS } from '../lib/graph-utils';
import { BorrowerNode3D } from './BorrowerNode3D';
import { CorrelationLinesGroup } from './CorrelationLine3D';
import { HealthTerrain, TerrainGrid } from './HealthTerrain';
import { CameraController } from './CameraController';
import { XRSceneWrapper } from './XRSupport';

interface Scene3DProps {
  data: Portfolio3DData;
  settings: VisualizationSettings;
  selectedNodeId?: string | null;
  onNodeClick?: (event: NodeInteractionEvent) => void;
  onNodeHover?: (event: NodeInteractionEvent | null) => void;
  onLinkClick?: (event: LinkInteractionEvent) => void;
  onCameraChange?: (state: CameraState) => void;
  enableXR?: boolean;
}

// Scene content component (runs inside Canvas)
function SceneContent({
  data,
  settings,
  selectedNodeId,
  onNodeClick,
  onNodeHover,
  onLinkClick,
  onCameraChange,
}: Omit<Scene3DProps, 'enableXR'>) {
  const [nodes, setNodes] = useState<BorrowerNode[]>(data.nodes);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Update nodes when data changes
  useEffect(() => {
    setNodes(data.nodes);
  }, [data.nodes]);

  // Apply force simulation
  useFrame(() => {
    if (settings.enablePhysics) {
      setNodes((currentNodes) =>
        applyForceSimulation(currentNodes, data.links, settings)
      );
    }
  });

  // Handle node hover
  const handleNodeHover = useCallback(
    (event: NodeInteractionEvent | null) => {
      setHoveredNode(event?.nodeId || null);
      onNodeHover?.(event);
    },
    [onNodeHover]
  );

  // Handle node click - select node
  const handleNodeClick = useCallback(
    (event: NodeInteractionEvent) => {
      onNodeClick?.(event);
    },
    [onNodeClick]
  );

  // Calculate target position for camera (selected node)
  const targetPosition = useMemo(() => {
    if (selectedNodeId) {
      const node = nodes.find((n) => n.id === selectedNodeId);
      if (node) {
        return node.position;
      }
    }
    return undefined;
  }, [selectedNodeId, nodes]);

  // Highlight links connected to hovered/selected node
  const highlightedLinks = useMemo(() => {
    const activeNodeId = hoveredNode || selectedNodeId;
    if (!activeNodeId) return data.links;

    return data.links.map((link) => ({
      ...link,
      isHighlighted:
        link.source === activeNodeId || link.target === activeNodeId,
    }));
  }, [data.links, hoveredNode, selectedNodeId]);

  // Update nodes with selection state
  const nodesWithState = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      isSelected: node.id === selectedNodeId,
      isHovered: node.id === hoveredNode,
    }));
  }, [nodes, selectedNodeId, hoveredNode]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={0.8} castShadow />
      <pointLight position={[-10, 10, -10]} intensity={0.3} color="#a5b4fc" />

      {/* Environment */}
      <Stars
        radius={100}
        depth={50}
        count={1000}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />

      {/* Camera controls */}
      <CameraController
        mode={settings.cameraMode}
        onCameraChange={onCameraChange}
        targetPosition={targetPosition}
        autoRotate={!selectedNodeId && !hoveredNode}
        autoRotateSpeed={0.3}
      />

      {/* Health terrain */}
      {settings.showHealthTerrain && (
        <>
          <HealthTerrain terrain={data.terrain} opacity={0.3} />
          <TerrainGrid />
        </>
      )}

      {/* Correlation lines */}
      {settings.showCorrelationLines && (
        <CorrelationLinesGroup
          links={highlightedLinks}
          nodes={nodesWithState}
          showFlowParticles={!!selectedNodeId}
          onLinkClick={onLinkClick}
        />
      )}

      {/* Borrower nodes */}
      {nodesWithState.map((node) => (
        <BorrowerNode3D
          key={node.id}
          node={node}
          showLabel={settings.showLabels}
          labelScale={settings.labelScale}
          onClick={handleNodeClick}
          onHover={handleNodeHover}
        />
      ))}

      {/* Region boundaries (optional) */}
      {settings.showRegionBoundaries &&
        data.regions.map((region) => (
          <mesh
            key={region.id}
            position={[region.center.x, region.center.y, region.center.z]}
          >
            <boxGeometry
              args={[
                region.bounds.max.x - region.bounds.min.x,
                region.bounds.max.y - region.bounds.min.y,
                region.bounds.max.z - region.bounds.min.z,
              ]}
            />
            <meshBasicMaterial
              color={region.color}
              transparent
              opacity={0.1}
              wireframe
            />
          </mesh>
        ))}
    </>
  );
}

// Main Scene3D component
export function Scene3D({
  data,
  settings,
  selectedNodeId,
  onNodeClick,
  onNodeHover,
  onLinkClick,
  onCameraChange,
  enableXR = false,
}: Scene3DProps) {
  const SceneWrapper = enableXR ? XRSceneWrapper : React.Fragment;

  return (
    <Canvas
      camera={{ position: [15, 12, 15], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
      data-testid="portfolio-3d-canvas"
    >
      <SceneWrapper>
        <SceneContent
          data={data}
          settings={settings}
          selectedNodeId={selectedNodeId}
          onNodeClick={onNodeClick}
          onNodeHover={onNodeHover}
          onLinkClick={onLinkClick}
          onCameraChange={onCameraChange}
        />
      </SceneWrapper>
    </Canvas>
  );
}
