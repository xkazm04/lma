// 3D Portfolio Visualization Types

import type { BorrowerRiskProfile, RiskCorrelation, RiskSeverity } from '@/app/features/dashboard/lib/mocks';

// Position in 3D space
export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

// Risk trend direction
export type RiskTrend = 'improving' | 'stable' | 'declining';

// Node representing a borrower in the 3D graph
export interface BorrowerNode {
  id: string;
  name: string;
  position: Vector3D;
  velocity: Vector3D;
  // Visual properties
  radius: number; // Based on exposure
  color: string; // Based on risk level
  glowIntensity: number; // Based on active alerts
  // Data
  profile: BorrowerRiskProfile;
  healthScore: number; // 0-100
  riskLevel: RiskSeverity;
  riskTrend: RiskTrend; // Overall risk trajectory
  isSelected: boolean;
  isHovered: boolean;
  // Force simulation
  fx?: number; // Fixed x position
  fy?: number; // Fixed y position
  fz?: number; // Fixed z position
}

// Link representing correlation between borrowers
export interface CorrelationLink {
  id: string;
  source: string; // borrower id
  target: string; // borrower id
  strength: number; // 0-1
  type: string;
  color: string;
  width: number;
  opacity: number;
  isHighlighted: boolean;
}

// Camera state for navigation
export interface CameraState {
  position: Vector3D;
  target: Vector3D;
  fov: number;
  zoom: number;
}

// Animation presets for camera movements
export interface CameraAnimation {
  name: string;
  duration: number;
  from: CameraState;
  to: CameraState;
  easing: 'linear' | 'easeInOut' | 'easeIn' | 'easeOut';
}

// Topographical terrain point for health metrics
export interface TerrainPoint {
  x: number;
  z: number;
  height: number; // Based on portfolio health at this region
  color: string;
  intensity: number;
}

// Region in the 3D space
export interface PortfolioRegion {
  id: string;
  name: string;
  type: 'sector' | 'geography' | 'risk';
  center: Vector3D;
  bounds: {
    min: Vector3D;
    max: Vector3D;
  };
  borrowerIds: string[];
  healthScore: number;
  color: string;
}

// XR interaction state
export interface XRInteractionState {
  isXRSupported: boolean;
  isInXR: boolean;
  selectedController: 'left' | 'right' | null;
  grabbing: boolean;
  pointing: boolean;
  pointTarget: Vector3D | null;
}

// Visualization settings
export interface VisualizationSettings {
  showLabels: boolean;
  showCorrelationLines: boolean;
  showHealthTerrain: boolean;
  showRegionBoundaries: boolean;
  labelScale: number;
  correlationThreshold: number; // Minimum correlation to show
  nodeScale: number;
  animationSpeed: number;
  enablePhysics: boolean;
  cameraMode: 'orbit' | 'fly' | 'xr';
  colorScheme: 'risk' | 'sector' | 'geography' | 'esg';
}

// View modes
export type ViewMode = '3d' | '2d' | 'xr';

// Interaction events
export interface NodeInteractionEvent {
  type: 'click' | 'hover' | 'select' | 'deselect';
  nodeId: string;
  node: BorrowerNode;
  position: Vector3D;
}

export interface LinkInteractionEvent {
  type: 'click' | 'hover';
  linkId: string;
  link: CorrelationLink;
}

// Graph data for the visualization
export interface Portfolio3DData {
  nodes: BorrowerNode[];
  links: CorrelationLink[];
  regions: PortfolioRegion[];
  terrain: TerrainPoint[];
  summary: {
    totalExposure: number;
    avgCorrelation: number;
    systemicRisk: number;
    diversificationScore: number;
  };
}

// Component props
export interface Portfolio3DVisualizationProps {
  borrowers: BorrowerRiskProfile[];
  correlations: RiskCorrelation[];
  settings?: Partial<VisualizationSettings>;
  onNodeClick?: (event: NodeInteractionEvent) => void;
  onNodeHover?: (event: NodeInteractionEvent | null) => void;
  onLinkClick?: (event: LinkInteractionEvent) => void;
  onCameraChange?: (state: CameraState) => void;
  className?: string;
}
