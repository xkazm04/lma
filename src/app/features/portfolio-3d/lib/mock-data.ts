/**
 * Portfolio-3D Module - Dedicated Mock Data
 *
 * Provides 3D visualization data including:
 * - Node positions for borrowers
 * - Correlation links between entities
 * - Health terrain data
 * - Camera presets
 */

import {
  borrowers,
  facilities,
  covenants,
  getAllBorrowers,
  getAllFacilities,
  getCovenantsByFacility,
  getFacilitiesByBorrower,
  BORROWER_IDS,
} from '@/lib/shared/registry';
import { calculateCovenantCorrelations, getPortfolioContagionSummary } from '@/lib/shared/cross-module-features';

// =============================================================================
// Types
// =============================================================================

export interface Node3D {
  id: string;
  label: string;
  position: { x: number; y: number; z: number };
  size: number;
  color: string;
  type: 'borrower' | 'facility' | 'covenant';
  metadata: {
    name: string;
    industry?: string;
    riskLevel: string;
    exposure: number;
    healthScore: number;
  };
}

export interface Link3D {
  id: string;
  source: string;
  target: string;
  strength: number;
  type: 'ownership' | 'correlation' | 'contagion';
  color: string;
  animated: boolean;
}

export interface HealthTerrainPoint {
  x: number;
  z: number;
  height: number;
  color: string;
  label?: string;
}

export interface CameraPreset {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  description: string;
}

export interface Portfolio3DData {
  nodes: Node3D[];
  links: Link3D[];
  terrain: HealthTerrainPoint[];
  cameraPresets: CameraPreset[];
  stats: {
    totalNodes: number;
    totalLinks: number;
    averageHealthScore: number;
    riskClusters: number;
  };
}

// =============================================================================
// Color Mapping
// =============================================================================

const riskColors = {
  low: '#22c55e',      // Green
  medium: '#eab308',   // Yellow
  high: '#f97316',     // Orange
  critical: '#ef4444', // Red
};

const industryColors: Record<string, string> = {
  Technology: '#3b82f6',
  Manufacturing: '#8b5cf6',
  Energy: '#f59e0b',
  Retail: '#ec4899',
  'Clean Energy': '#10b981',
  'Financial Services': '#6366f1',
};

// =============================================================================
// Node Generation
// =============================================================================

function generateBorrowerNodes(): Node3D[] {
  const allBorrowers = getAllBorrowers();
  const allFacilities = getAllFacilities();

  // Arrange borrowers in a circular pattern
  const radius = 50;
  const angleStep = (2 * Math.PI) / allBorrowers.length;

  return allBorrowers.map((borrower, index) => {
    const angle = angleStep * index;
    const borrowerFacilities = allFacilities.filter((f) => f.borrowerId === borrower.id);
    const totalExposure = borrowerFacilities.reduce((sum, f) => sum + f.amount, 0);

    // Calculate health score based on risk level
    const healthScore = {
      low: 85 + Math.random() * 10,
      medium: 60 + Math.random() * 15,
      high: 40 + Math.random() * 15,
      critical: 15 + Math.random() * 20,
    }[borrower.riskLevel];

    // Size based on exposure (normalized)
    const maxExposure = 200_000_000;
    const normalizedSize = 5 + (totalExposure / maxExposure) * 15;

    return {
      id: borrower.id,
      label: borrower.shortName,
      position: {
        x: Math.cos(angle) * radius,
        y: (healthScore - 50) / 5, // Height based on health
        z: Math.sin(angle) * radius,
      },
      size: normalizedSize,
      color: riskColors[borrower.riskLevel],
      type: 'borrower' as const,
      metadata: {
        name: borrower.name,
        industry: borrower.industry,
        riskLevel: borrower.riskLevel,
        exposure: totalExposure,
        healthScore,
      },
    };
  });
}

function generateFacilityNodes(borrowerNodes: Node3D[]): Node3D[] {
  const allFacilities = getAllFacilities();
  const nodes: Node3D[] = [];

  allFacilities.forEach((facility) => {
    const parentNode = borrowerNodes.find((n) => n.id === facility.borrowerId);
    if (!parentNode) {
      return;
    }

    // Position facilities around their parent borrower
    const offset = {
      x: (Math.random() - 0.5) * 10,
      y: -5,
      z: (Math.random() - 0.5) * 10,
    };

    const healthScore = facility.status === 'active' ? 80 : facility.status === 'watchlist' ? 45 : 20;

    // Map facility status to risk level
    const riskLevel: 'low' | 'medium' | 'high' | 'critical' =
      facility.status === 'active' ? 'low' :
      facility.status === 'watchlist' ? 'high' :
      facility.status === 'default' ? 'critical' : 'low';

    nodes.push({
      id: facility.id,
      label: facility.name,
      position: {
        x: parentNode.position.x + offset.x,
        y: parentNode.position.y + offset.y,
        z: parentNode.position.z + offset.z,
      },
      size: 3,
      color: industryColors[borrowers[facility.borrowerId]?.industry] || '#6b7280',
      type: 'facility' as const,
      metadata: {
        name: facility.name,
        riskLevel,
        exposure: facility.amount,
        healthScore,
      },
    });
  });

  return nodes;
}

// =============================================================================
// Link Generation
// =============================================================================

function generateOwnershipLinks(borrowerNodes: Node3D[], facilityNodes: Node3D[]): Link3D[] {
  return facilityNodes.map((facilityNode) => {
    const facility = facilities[facilityNode.id];
    return {
      id: `link-own-${facilityNode.id}`,
      source: facility?.borrowerId || '',
      target: facilityNode.id,
      strength: 1.0,
      type: 'ownership' as const,
      color: '#94a3b8',
      animated: false,
    };
  }).filter((l) => l.source);
}

function generateCorrelationLinks(borrowerNodes: Node3D[]): Link3D[] {
  const correlations = calculateCovenantCorrelations();
  const links: Link3D[] = [];
  const seenPairs = new Set<string>();

  // Group correlations by borrower pairs
  correlations.forEach((corr) => {
    const cov1 = covenants[corr.covenant1Id];
    const cov2 = covenants[corr.covenant2Id];
    if (!cov1 || !cov2) return;

    const pairKey = [cov1.borrowerId, cov2.borrowerId].sort().join('-');
    if (seenPairs.has(pairKey) || cov1.borrowerId === cov2.borrowerId) return;
    seenPairs.add(pairKey);

    links.push({
      id: `link-corr-${pairKey}`,
      source: cov1.borrowerId,
      target: cov2.borrowerId,
      strength: corr.correlationStrength,
      type: 'correlation',
      color: corr.correlationStrength > 0.5 ? '#f97316' : '#94a3b8',
      animated: corr.correlationStrength > 0.7,
    });
  });

  return links;
}

function generateContagionLinks(): Link3D[] {
  const contagionSummary = getPortfolioContagionSummary();
  const links: Link3D[] = [];

  contagionSummary.contagionRisks.forEach((risk) => {
    risk.affectedBorrowers.forEach((affected) => {
      links.push({
        id: `link-cont-${risk.sourceBorrowerId}-${affected.borrowerId}`,
        source: risk.sourceBorrowerId,
        target: affected.borrowerId,
        strength: risk.contagionProbability,
        type: 'contagion',
        color: '#ef4444',
        animated: true,
      });
    });
  });

  return links;
}

// =============================================================================
// Terrain Generation
// =============================================================================

function generateHealthTerrain(borrowerNodes: Node3D[]): HealthTerrainPoint[] {
  const terrain: HealthTerrainPoint[] = [];
  const gridSize = 20;
  const gridSpacing = 10;

  // Create a grid of points
  for (let i = -gridSize / 2; i <= gridSize / 2; i++) {
    for (let j = -gridSize / 2; j <= gridSize / 2; j++) {
      const x = i * gridSpacing;
      const z = j * gridSpacing;

      // Calculate height based on proximity to borrower nodes
      let height = 0;
      let totalWeight = 0;

      borrowerNodes.forEach((node) => {
        const dx = x - node.position.x;
        const dz = z - node.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        const weight = Math.max(0, 1 - distance / 80);

        if (weight > 0) {
          height += node.metadata.healthScore * weight;
          totalWeight += weight;
        }
      });

      if (totalWeight > 0) {
        height = (height / totalWeight - 50) / 10;
      } else {
        height = -5;
      }

      // Determine color based on height
      let color = '#22c55e';
      if (height < -2) color = '#ef4444';
      else if (height < 0) color = '#f97316';
      else if (height < 2) color = '#eab308';

      terrain.push({ x, z, height, color });
    }
  }

  return terrain;
}

// =============================================================================
// Camera Presets
// =============================================================================

export const cameraPresets: CameraPreset[] = [
  {
    id: 'overview',
    name: 'Portfolio Overview',
    position: { x: 0, y: 100, z: 100 },
    target: { x: 0, y: 0, z: 0 },
    description: 'Bird\'s eye view of entire portfolio',
  },
  {
    id: 'risk-focus',
    name: 'Risk Clusters',
    position: { x: 80, y: 40, z: 0 },
    target: { x: 0, y: 0, z: 0 },
    description: 'Focus on high-risk borrowers',
  },
  {
    id: 'correlation',
    name: 'Correlation View',
    position: { x: 0, y: 30, z: 80 },
    target: { x: 0, y: 0, z: 0 },
    description: 'View showing correlation links',
  },
  {
    id: 'contagion',
    name: 'Contagion Paths',
    position: { x: -60, y: 50, z: 60 },
    target: { x: 0, y: -10, z: 0 },
    description: 'Highlight contagion risk paths',
  },
  {
    id: 'terrain',
    name: 'Health Terrain',
    position: { x: 0, y: 120, z: 20 },
    target: { x: 0, y: -20, z: 0 },
    description: 'View health landscape from above',
  },
];

// =============================================================================
// Main Data Generator
// =============================================================================

export function generatePortfolio3DData(): Portfolio3DData {
  const borrowerNodes = generateBorrowerNodes();
  const facilityNodes = generateFacilityNodes(borrowerNodes);
  const allNodes = [...borrowerNodes, ...facilityNodes];

  const ownershipLinks = generateOwnershipLinks(borrowerNodes, facilityNodes);
  const correlationLinks = generateCorrelationLinks(borrowerNodes);
  const contagionLinks = generateContagionLinks();
  const allLinks = [...ownershipLinks, ...correlationLinks, ...contagionLinks];

  const terrain = generateHealthTerrain(borrowerNodes);

  const averageHealthScore =
    borrowerNodes.reduce((sum, n) => sum + n.metadata.healthScore, 0) / borrowerNodes.length;

  // Count risk clusters (groups of connected high-risk nodes)
  const highRiskNodes = borrowerNodes.filter(
    (n) => n.metadata.riskLevel === 'high' || n.metadata.riskLevel === 'critical'
  );
  const riskClusters = Math.ceil(highRiskNodes.length / 2);

  return {
    nodes: allNodes,
    links: allLinks,
    terrain,
    cameraPresets,
    stats: {
      totalNodes: allNodes.length,
      totalLinks: allLinks.length,
      averageHealthScore,
      riskClusters,
    },
  };
}

// =============================================================================
// Pre-generated Mock Data
// =============================================================================

export const mockPortfolio3DData = generatePortfolio3DData();

// =============================================================================
// Individual Node Data for Detail Views
// =============================================================================

export function getNodeDetails(nodeId: string): Node3D | undefined {
  return mockPortfolio3DData.nodes.find((n) => n.id === nodeId);
}

export function getConnectedNodes(nodeId: string): Node3D[] {
  const connectedIds = new Set<string>();

  mockPortfolio3DData.links.forEach((link) => {
    if (link.source === nodeId) connectedIds.add(link.target);
    if (link.target === nodeId) connectedIds.add(link.source);
  });

  return mockPortfolio3DData.nodes.filter((n) => connectedIds.has(n.id));
}

export function getLinksForNode(nodeId: string): Link3D[] {
  return mockPortfolio3DData.links.filter(
    (l) => l.source === nodeId || l.target === nodeId
  );
}

export function getNodesByRiskLevel(riskLevel: string): Node3D[] {
  return mockPortfolio3DData.nodes.filter(
    (n) => n.type === 'borrower' && n.metadata.riskLevel === riskLevel
  );
}

export function getNodesByIndustry(industry: string): Node3D[] {
  return mockPortfolio3DData.nodes.filter(
    (n) => n.type === 'borrower' && n.metadata.industry === industry
  );
}

// =============================================================================
// Animation Data
// =============================================================================

export interface AnimationConfig {
  pulseSpeed: number;
  linkFlowSpeed: number;
  rotationSpeed: number;
  terrainWaveSpeed: number;
}

export const defaultAnimationConfig: AnimationConfig = {
  pulseSpeed: 0.5,
  linkFlowSpeed: 2.0,
  rotationSpeed: 0.1,
  terrainWaveSpeed: 0.3,
};

// =============================================================================
// XR/AR Support Data
// =============================================================================

export interface XRPlacement {
  floorOffset: number;
  scale: number;
  rotationY: number;
}

export const defaultXRPlacement: XRPlacement = {
  floorOffset: 0.8,
  scale: 0.01,
  rotationY: 0,
};
