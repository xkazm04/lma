// Graph utilities for 3D portfolio visualization

import type { BorrowerRiskProfile, RiskCorrelation, RiskSeverity } from '@/app/features/dashboard/lib/mocks';
import type {
  BorrowerNode,
  CorrelationLink,
  Vector3D,
  Portfolio3DData,
  PortfolioRegion,
  TerrainPoint,
  VisualizationSettings,
} from './types';
import {
  getSeverityHexColor,
  getCorrelationHexColor,
} from '@/lib/utils/color-resolver';

// Default settings
export const DEFAULT_SETTINGS: VisualizationSettings = {
  showLabels: true,
  showCorrelationLines: true,
  showHealthTerrain: true,
  showRegionBoundaries: false,
  labelScale: 1,
  correlationThreshold: 0.2,
  nodeScale: 1,
  animationSpeed: 1,
  enablePhysics: true,
  cameraMode: 'orbit',
  colorScheme: 'risk',
};

// Color palettes for sector and geography (domain-specific, not unified)
const SECTOR_COLORS: Record<string, string> = {
  Technology: '#8b5cf6', // violet-500
  Manufacturing: '#3b82f6', // blue-500
  Energy: '#f97316', // orange-500
  Retail: '#ec4899', // pink-500
  'Clean Energy': '#22c55e', // green-500
  'Financial Services': '#06b6d4', // cyan-500
  default: '#6b7280', // gray-500
};

const GEOGRAPHY_COLORS: Record<string, string> = {
  'North America': '#3b82f6', // blue-500
  Europe: '#8b5cf6', // violet-500
  'Asia Pacific': '#22c55e', // green-500
  default: '#6b7280', // gray-500
};

/**
 * Get color based on risk severity (uses unified color resolver)
 */
export function getRiskColor(severity: RiskSeverity): string {
  return getSeverityHexColor(severity);
}

/**
 * Get color based on sector
 */
export function getSectorColor(sector: string): string {
  return SECTOR_COLORS[sector] || SECTOR_COLORS.default;
}

/**
 * Get color based on geography
 */
export function getGeographyColor(geography: string): string {
  return GEOGRAPHY_COLORS[geography] || GEOGRAPHY_COLORS.default;
}

/**
 * Calculate node color based on settings
 */
export function getNodeColor(
  borrower: BorrowerRiskProfile,
  colorScheme: VisualizationSettings['colorScheme']
): string {
  switch (colorScheme) {
    case 'risk':
      return getRiskColor(getBorrowerRiskLevel(borrower));
    case 'sector':
      return getSectorColor(borrower.industry);
    case 'geography':
      return getGeographyColor(borrower.geography);
    case 'esg':
      if (borrower.esgScore === null) return '#6b7280';
      if (borrower.esgScore >= 70) return '#22c55e';
      if (borrower.esgScore >= 50) return '#eab308';
      return '#ef4444';
    default:
      return '#6b7280';
  }
}

/**
 * Determine borrower risk level
 */
export function getBorrowerRiskLevel(borrower: BorrowerRiskProfile): RiskSeverity {
  const criticalFactors = borrower.riskFactors.filter(f => f.severity === 'critical').length;
  const highFactors = borrower.riskFactors.filter(f => f.severity === 'high').length;

  if (criticalFactors > 0) return 'critical';
  if (highFactors > 0) return 'high';
  if (borrower.complianceScore < 70 || (borrower.esgScore !== null && borrower.esgScore < 50)) {
    return 'medium';
  }
  return 'low';
}

/**
 * Calculate node radius based on exposure
 */
export function calculateNodeRadius(
  exposure: number,
  allExposures: number[],
  minRadius = 0.3,
  maxRadius = 1.5
): number {
  const maxExposure = Math.max(...allExposures);
  const minExposure = Math.min(...allExposures);
  const range = maxExposure - minExposure || 1;
  const normalized = (exposure - minExposure) / range;
  return minRadius + normalized * (maxRadius - minRadius);
}

/**
 * Calculate glow intensity based on active risk factors
 */
export function calculateGlowIntensity(borrower: BorrowerRiskProfile): number {
  const criticalCount = borrower.riskFactors.filter(f => f.severity === 'critical').length;
  const highCount = borrower.riskFactors.filter(f => f.severity === 'high').length;
  return Math.min(1, criticalCount * 0.4 + highCount * 0.2);
}

/**
 * Calculate borrower health score
 */
export function calculateHealthScore(borrower: BorrowerRiskProfile): number {
  let score = 100;

  // Deduct for risk factors
  borrower.riskFactors.forEach(factor => {
    switch (factor.severity) {
      case 'critical':
        score -= 25;
        break;
      case 'high':
        score -= 15;
        break;
      case 'medium':
        score -= 8;
        break;
      case 'low':
        score -= 3;
        break;
    }
  });

  // Factor in compliance score
  score = score * 0.7 + borrower.complianceScore * 0.3;

  // Factor in ESG if available
  if (borrower.esgScore !== null) {
    score = score * 0.8 + borrower.esgScore * 0.2;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Get correlation line color (uses unified color resolver)
 */
export function getCorrelationColor(strength: number): string {
  return getCorrelationHexColor(strength);
}

/**
 * Convert borrowers and correlations to 3D graph data
 */
export function createPortfolio3DData(
  borrowers: BorrowerRiskProfile[],
  correlations: RiskCorrelation[],
  settings: VisualizationSettings = DEFAULT_SETTINGS
): Portfolio3DData {
  const exposures = borrowers.map(b => b.totalExposure);

  // Create nodes with initial random positions
  const nodes: BorrowerNode[] = borrowers.map((borrower, index) => {
    const angle = (index / borrowers.length) * Math.PI * 2;
    const radius = 5 + Math.random() * 3;

    return {
      id: borrower.id,
      name: borrower.name,
      position: {
        x: Math.cos(angle) * radius,
        y: (Math.random() - 0.5) * 4,
        z: Math.sin(angle) * radius,
      },
      velocity: { x: 0, y: 0, z: 0 },
      radius: calculateNodeRadius(borrower.totalExposure, exposures) * settings.nodeScale,
      color: getNodeColor(borrower, settings.colorScheme),
      glowIntensity: calculateGlowIntensity(borrower),
      profile: borrower,
      healthScore: calculateHealthScore(borrower),
      riskLevel: getBorrowerRiskLevel(borrower),
      isSelected: false,
      isHovered: false,
    };
  });

  // Create links from correlations
  const links: CorrelationLink[] = correlations
    .filter(c => c.correlationStrength >= settings.correlationThreshold)
    .map(correlation => ({
      id: correlation.id,
      source: correlation.borrower1Id,
      target: correlation.borrower2Id,
      strength: correlation.correlationStrength,
      type: correlation.correlationType,
      color: getCorrelationColor(correlation.correlationStrength),
      width: 0.02 + correlation.correlationStrength * 0.05,
      opacity: 0.3 + correlation.correlationStrength * 0.5,
      isHighlighted: false,
    }));

  // Create regions
  const regions = createRegions(nodes);

  // Create terrain
  const terrain = settings.showHealthTerrain ? createHealthTerrain(nodes) : [];

  // Calculate summary
  const totalExposure = borrowers.reduce((sum, b) => sum + b.totalExposure, 0);
  const avgCorrelation = correlations.length > 0
    ? correlations.reduce((sum, c) => sum + c.correlationStrength, 0) / correlations.length
    : 0;

  return {
    nodes,
    links,
    regions,
    terrain,
    summary: {
      totalExposure,
      avgCorrelation,
      systemicRisk: Math.round(avgCorrelation * 100),
      diversificationScore: Math.round((1 - avgCorrelation) * 100),
    },
  };
}

/**
 * Create regions based on sector/geography groupings
 */
function createRegions(nodes: BorrowerNode[]): PortfolioRegion[] {
  const sectorGroups = new Map<string, BorrowerNode[]>();

  nodes.forEach(node => {
    const sector = node.profile.industry;
    const existing = sectorGroups.get(sector) || [];
    existing.push(node);
    sectorGroups.set(sector, existing);
  });

  const regions: PortfolioRegion[] = [];

  sectorGroups.forEach((sectorNodes, sector) => {
    if (sectorNodes.length < 2) return;

    const positions = sectorNodes.map(n => n.position);
    const center = {
      x: positions.reduce((sum, p) => sum + p.x, 0) / positions.length,
      y: positions.reduce((sum, p) => sum + p.y, 0) / positions.length,
      z: positions.reduce((sum, p) => sum + p.z, 0) / positions.length,
    };

    const avgHealth = sectorNodes.reduce((sum, n) => sum + n.healthScore, 0) / sectorNodes.length;

    regions.push({
      id: `region-${sector.toLowerCase().replace(/\s+/g, '-')}`,
      name: sector,
      type: 'sector',
      center,
      bounds: {
        min: {
          x: Math.min(...positions.map(p => p.x)) - 1,
          y: Math.min(...positions.map(p => p.y)) - 1,
          z: Math.min(...positions.map(p => p.z)) - 1,
        },
        max: {
          x: Math.max(...positions.map(p => p.x)) + 1,
          y: Math.max(...positions.map(p => p.y)) + 1,
          z: Math.max(...positions.map(p => p.z)) + 1,
        },
      },
      borrowerIds: sectorNodes.map(n => n.id),
      healthScore: avgHealth,
      color: getSectorColor(sector),
    });
  });

  return regions;
}

/**
 * Create health terrain visualization
 */
function createHealthTerrain(nodes: BorrowerNode[]): TerrainPoint[] {
  const terrain: TerrainPoint[] = [];
  const gridSize = 20;
  const gridExtent = 15;
  const step = (gridExtent * 2) / gridSize;

  for (let xi = 0; xi <= gridSize; xi++) {
    for (let zi = 0; zi <= gridSize; zi++) {
      const x = -gridExtent + xi * step;
      const z = -gridExtent + zi * step;

      // Calculate height based on nearby node health scores
      let totalWeight = 0;
      let weightedHealth = 0;

      nodes.forEach(node => {
        const dist = Math.sqrt(
          Math.pow(node.position.x - x, 2) +
          Math.pow(node.position.z - z, 2)
        );
        const weight = Math.max(0, 1 - dist / 8);
        if (weight > 0) {
          totalWeight += weight;
          weightedHealth += node.healthScore * weight;
        }
      });

      const health = totalWeight > 0 ? weightedHealth / totalWeight : 50;
      const height = -3 + (health / 100) * 2; // Range from -3 to -1

      // Color based on health
      let color: string;
      if (health >= 70) color = '#22c55e40';
      else if (health >= 50) color = '#eab30840';
      else color = '#ef444440';

      terrain.push({
        x,
        z,
        height,
        color,
        intensity: health / 100,
      });
    }
  }

  return terrain;
}

/**
 * Apply force simulation step to update node positions
 */
export function applyForceSimulation(
  nodes: BorrowerNode[],
  links: CorrelationLink[],
  settings: VisualizationSettings
): BorrowerNode[] {
  if (!settings.enablePhysics) return nodes;

  const updatedNodes = [...nodes];

  // Create a map for quick lookup
  const nodeMap = new Map(updatedNodes.map(n => [n.id, n]));

  // Apply forces
  updatedNodes.forEach(node => {
    if (node.fx !== undefined && node.fy !== undefined && node.fz !== undefined) {
      return; // Skip fixed nodes
    }

    let fx = 0, fy = 0, fz = 0;

    // Repulsion from other nodes
    updatedNodes.forEach(other => {
      if (other.id === node.id) return;

      const dx = node.position.x - other.position.x;
      const dy = node.position.y - other.position.y;
      const dz = node.position.z - other.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.1;

      const repulsion = 2 / (dist * dist);
      fx += (dx / dist) * repulsion;
      fy += (dy / dist) * repulsion;
      fz += (dz / dist) * repulsion;
    });

    // Attraction to linked nodes
    links.forEach(link => {
      if (link.source !== node.id && link.target !== node.id) return;

      const otherId = link.source === node.id ? link.target : link.source;
      const other = nodeMap.get(otherId);
      if (!other) return;

      const dx = other.position.x - node.position.x;
      const dy = other.position.y - node.position.y;
      const dz = other.position.z - node.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.1;

      const attraction = link.strength * dist * 0.1;
      fx += (dx / dist) * attraction;
      fy += (dy / dist) * attraction;
      fz += (dz / dist) * attraction;
    });

    // Center gravity
    const centerDist = Math.sqrt(
      node.position.x * node.position.x +
      node.position.y * node.position.y +
      node.position.z * node.position.z
    ) || 0.1;
    fx -= node.position.x * 0.01;
    fy -= node.position.y * 0.02;
    fz -= node.position.z * 0.01;

    // Update velocity with damping
    const damping = 0.9;
    const speed = settings.animationSpeed * 0.1;
    node.velocity.x = (node.velocity.x + fx * speed) * damping;
    node.velocity.y = (node.velocity.y + fy * speed) * damping;
    node.velocity.z = (node.velocity.z + fz * speed) * damping;

    // Update position
    node.position.x += node.velocity.x;
    node.position.y += node.velocity.y;
    node.position.z += node.velocity.z;

    // Clamp to bounds
    const bound = 20;
    node.position.x = Math.max(-bound, Math.min(bound, node.position.x));
    node.position.y = Math.max(-10, Math.min(10, node.position.y));
    node.position.z = Math.max(-bound, Math.min(bound, node.position.z));
  });

  return updatedNodes;
}

/**
 * Format exposure for display
 */
export function formatExposure(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`;
  }
  return `$${amount.toFixed(0)}`;
}
