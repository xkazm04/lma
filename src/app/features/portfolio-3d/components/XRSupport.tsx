'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import type { XRInteractionState, BorrowerNode, NodeInteractionEvent } from '../lib/types';

// Note: @react-three/xr v6 has a different API. This component provides
// XR support detection and UI components. Full XR integration requires
// additional setup with createXRStore from @react-three/xr.

interface XRSceneWrapperProps {
  children: React.ReactNode;
  onXRStateChange?: (state: XRInteractionState) => void;
}

export function XRSceneWrapper({ children, onXRStateChange }: XRSceneWrapperProps) {
  const [xrSupported, setXrSupported] = useState(false);

  useEffect(() => {
    // Check for WebXR support
    if (typeof navigator !== 'undefined' && 'xr' in navigator) {
      const xr = (navigator as Navigator & { xr: XRSystem }).xr;
      xr?.isSessionSupported('immersive-vr')
        .then((supported) => {
          setXrSupported(supported);
          onXRStateChange?.({
            isXRSupported: supported,
            isInXR: false,
            selectedController: null,
            grabbing: false,
            pointing: false,
            pointTarget: null,
          });
        })
        .catch(() => {
          setXrSupported(false);
        });
    }
  }, [onXRStateChange]);

  // For now, just render children. Full XR integration would wrap with XR store
  return <>{children}</>;
}

// XR-enabled borrower node with pointer interaction
interface XRBorrowerNodeProps {
  node: BorrowerNode;
  onSelect?: (event: NodeInteractionEvent) => void;
  onHover?: (event: NodeInteractionEvent | null) => void;
}

export function XRBorrowerNode({ node, onSelect, onHover }: XRBorrowerNodeProps) {
  const [hovered, setHovered] = useState(false);

  const handlePointerDown = useCallback(() => {
    onSelect?.({
      type: 'select',
      nodeId: node.id,
      node,
      position: node.position,
    });
  }, [node, onSelect]);

  const handlePointerOver = useCallback(() => {
    setHovered(true);
    onHover?.({
      type: 'hover',
      nodeId: node.id,
      node,
      position: node.position,
    });
  }, [node, onHover]);

  const handlePointerOut = useCallback(() => {
    setHovered(false);
    onHover?.(null);
  }, [onHover]);

  return (
    <mesh
      position={[node.position.x, node.position.y, node.position.z]}
      onPointerDown={handlePointerDown}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <sphereGeometry args={[node.radius * (hovered ? 1.2 : 1), 32, 32]} />
      <meshStandardMaterial
        color={hovered ? '#a5b4fc' : node.color}
        emissive={node.color}
        emissiveIntensity={hovered ? 0.4 : 0.2}
      />
    </mesh>
  );
}

// Teleport target for navigation
interface TeleportTargetProps {
  position: [number, number, number];
  onTeleport?: (position: [number, number, number]) => void;
}

export function TeleportTarget({ position, onTeleport }: TeleportTargetProps) {
  const handlePointerDown = useCallback(() => {
    onTeleport?.(position);
  }, [position, onTeleport]);

  return (
    <mesh
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      onPointerDown={handlePointerDown}
    >
      <ringGeometry args={[0.3, 0.5, 32]} />
      <meshBasicMaterial color="#4ade80" transparent opacity={0.5} />
    </mesh>
  );
}

// Info panel that follows the camera
interface XRInfoPanelProps {
  title: string;
  content: string;
  visible: boolean;
}

export function XRInfoPanel({ title, content, visible }: XRInfoPanelProps) {
  const { camera } = useThree();

  if (!visible) return null;

  // Position panel in front of camera
  const panelPosition: [number, number, number] = [
    camera.position.x,
    camera.position.y - 0.3,
    camera.position.z - 1,
  ];

  return (
    <group position={panelPosition}>
      <mesh>
        <planeGeometry args={[0.8, 0.4]} />
        <meshBasicMaterial color="#1f2937" transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

// XR Entry button for non-immersive fallback
interface XREntryButtonProps {
  onEnterXR?: () => void;
  supported: boolean;
}

export function XREntryButton({ onEnterXR, supported }: XREntryButtonProps) {
  if (!supported) {
    return (
      <div className="text-xs text-zinc-500 flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-zinc-400" />
        XR not available
      </div>
    );
  }

  return (
    <button
      onClick={onEnterXR}
      className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center gap-1.5"
      data-testid="xr-enter-btn"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
      Enter VR
    </button>
  );
}

// Hook to check XR availability
export function useXRAvailability(): {
  isVRSupported: boolean;
  isARSupported: boolean;
  isLoading: boolean;
} {
  const [vrSupported, setVRSupported] = useState(false);
  const [arSupported, setARSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('xr' in navigator)) {
      setIsLoading(false);
      return;
    }

    const xr = (navigator as Navigator & { xr: XRSystem }).xr;

    Promise.all([
      xr?.isSessionSupported('immersive-vr').catch(() => false),
      xr?.isSessionSupported('immersive-ar').catch(() => false),
    ]).then(([vr, ar]) => {
      setVRSupported(vr || false);
      setARSupported(ar || false);
      setIsLoading(false);
    });
  }, []);

  return { isVRSupported: vrSupported, isARSupported: arSupported, isLoading };
}
