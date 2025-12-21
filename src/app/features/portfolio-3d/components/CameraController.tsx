'use client';

import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, FlyControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import type { PerspectiveCamera as ThreePerspectiveCamera } from 'three';
import type { CameraState, Vector3D, VisualizationSettings } from '../lib/types';

interface CameraControllerProps {
  mode: VisualizationSettings['cameraMode'];
  onCameraChange?: (state: CameraState) => void;
  targetPosition?: Vector3D;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
}

export function CameraController({
  mode,
  onCameraChange,
  targetPosition,
  autoRotate = false,
  autoRotateSpeed = 0.5,
}: CameraControllerProps) {
  const controlsRef = useRef<OrbitControlsType>(null);
  const { camera } = useThree();

  // Handle target position changes (fly to node)
  useEffect(() => {
    if (targetPosition && controlsRef.current) {
      // Animate camera to target
      const target = controlsRef.current.target;
      target.set(targetPosition.x, targetPosition.y, targetPosition.z);
      controlsRef.current.update();
    }
  }, [targetPosition]);

  // Report camera changes
  useFrame(() => {
    if (onCameraChange && controlsRef.current) {
      const target = controlsRef.current.target;
      onCameraChange({
        position: {
          x: camera.position.x,
          y: camera.position.y,
          z: camera.position.z,
        },
        target: {
          x: target.x,
          y: target.y,
          z: target.z,
        },
        fov: 'fov' in camera ? (camera as ThreePerspectiveCamera).fov : 50,
        zoom: camera.zoom,
      });
    }
  });

  if (mode === 'fly') {
    return (
      <FlyControls
        movementSpeed={5}
        rollSpeed={0.5}
        dragToLook
        data-testid="fly-controls"
      />
    );
  }

  // Default to orbit controls
  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      rotateSpeed={0.5}
      zoomSpeed={0.8}
      panSpeed={0.5}
      minDistance={3}
      maxDistance={50}
      maxPolarAngle={Math.PI * 0.85}
      autoRotate={autoRotate}
      autoRotateSpeed={autoRotateSpeed}
      data-testid="orbit-controls"
    />
  );
}

// Camera presets for different views
export const CAMERA_PRESETS = {
  overview: {
    position: { x: 15, y: 12, z: 15 },
    target: { x: 0, y: 0, z: 0 },
    fov: 50,
    zoom: 1,
  },
  topDown: {
    position: { x: 0, y: 25, z: 0 },
    target: { x: 0, y: 0, z: 0 },
    fov: 50,
    zoom: 1,
  },
  frontView: {
    position: { x: 0, y: 5, z: 20 },
    target: { x: 0, y: 0, z: 0 },
    fov: 50,
    zoom: 1,
  },
  sideView: {
    position: { x: 20, y: 5, z: 0 },
    target: { x: 0, y: 0, z: 0 },
    fov: 50,
    zoom: 1,
  },
  closeUp: {
    position: { x: 5, y: 3, z: 5 },
    target: { x: 0, y: 0, z: 0 },
    fov: 35,
    zoom: 1,
  },
} as const;

// Animated camera that smoothly transitions between positions
interface AnimatedCameraProps {
  targetState: CameraState;
  duration?: number;
}

export function AnimatedCamera({
  targetState,
  duration = 1000,
}: AnimatedCameraProps) {
  const { camera } = useThree();
  const startTime = useRef<number | null>(null);
  const startPosition = useRef({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    startTime.current = Date.now();
    startPosition.current = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
    };
  }, [targetState, camera.position]);

  useFrame(() => {
    if (startTime.current === null) return;

    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(1, elapsed / duration);

    // Easing function (ease-out cubic)
    const eased = 1 - Math.pow(1 - progress, 3);

    camera.position.x =
      startPosition.current.x +
      (targetState.position.x - startPosition.current.x) * eased;
    camera.position.y =
      startPosition.current.y +
      (targetState.position.y - startPosition.current.y) * eased;
    camera.position.z =
      startPosition.current.z +
      (targetState.position.z - startPosition.current.z) * eased;

    if (progress >= 1) {
      startTime.current = null;
    }
  });

  return null;
}
