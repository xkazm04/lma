/**
 * Risk Correlation Engine Utilities
 *
 * Utility functions for calculating correlations, ripple effects, and metrics.
 */

import type {
  BorrowerRiskProfile,
  RiskCorrelation,
  RippleEffect,
  RiskEvent,
  AffectedBorrower,
  RelatedCovenant,
  PortfolioCorrelationMetrics,
  ConcentrationRisk,
  SectorExposure,
  GeographyExposure,
  CorrelationCluster,
  CorrelationMatrixData,
  MatrixHighlight,
  RiskSeverity,
  CorrelationType,
  CorrelationFilters,
} from './risk-correlation-types';

/**
 * Calculate correlation strength between two borrowers based on shared factors
 */
export function calculateCorrelationStrength(
  borrower1: BorrowerRiskProfile,
  borrower2: BorrowerRiskProfile
): { strength: number; type: CorrelationType; sharedFactors: string[] } {
  let totalScore = 0;
  const sharedFactors: string[] = [];
  let dominantType: CorrelationType = 'sector';
  let maxTypeScore = 0;

  // Sector correlation (weight: 0.35)
  if (borrower1.industry === borrower2.industry) {
    totalScore += 0.35;
    sharedFactors.push(`Same sector: ${borrower1.industry}`);
    if (0.35 > maxTypeScore) {
      maxTypeScore = 0.35;
      dominantType = 'sector';
    }
  }

  // Geography correlation (weight: 0.25)
  if (borrower1.geography === borrower2.geography) {
    totalScore += 0.25;
    sharedFactors.push(`Same region: ${borrower1.geography}`);
    if (0.25 > maxTypeScore) {
      maxTypeScore = 0.25;
      dominantType = 'geography';
    }
  }

  // Covenant type overlap (weight: 0.20)
  const sharedCovenants = borrower1.covenantTypes.filter((c) =>
    borrower2.covenantTypes.includes(c)
  );
  if (sharedCovenants.length > 0) {
    const covenantScore = Math.min(0.2, sharedCovenants.length * 0.05);
    totalScore += covenantScore;
    sharedFactors.push(`Shared covenants: ${sharedCovenants.join(', ')}`);
    if (covenantScore > maxTypeScore) {
      maxTypeScore = covenantScore;
      dominantType = 'covenant_type';
    }
  }

  // ESG score similarity (weight: 0.10)
  if (borrower1.esgScore !== null && borrower2.esgScore !== null) {
    const esgDiff = Math.abs(borrower1.esgScore - borrower2.esgScore);
    if (esgDiff <= 10) {
      const esgScore = 0.1 * (1 - esgDiff / 10);
      totalScore += esgScore;
      sharedFactors.push(`Similar ESG scores: ${borrower1.esgScore} vs ${borrower2.esgScore}`);
      if (esgScore > maxTypeScore) {
        maxTypeScore = esgScore;
        dominantType = 'esg_factor';
      }
    }
  }

  // Maturity profile (weight: 0.10)
  const maturity1 = new Date(borrower1.maturityDate).getTime();
  const maturity2 = new Date(borrower2.maturityDate).getTime();
  const monthsDiff = Math.abs(maturity1 - maturity2) / (1000 * 60 * 60 * 24 * 30);
  if (monthsDiff <= 6) {
    const maturityScore = 0.1 * (1 - monthsDiff / 6);
    totalScore += maturityScore;
    sharedFactors.push('Similar maturity dates');
    if (maturityScore > maxTypeScore) {
      maxTypeScore = maturityScore;
      dominantType = 'maturity_profile';
    }
  }

  return {
    strength: Math.min(1, totalScore),
    type: dominantType,
    sharedFactors,
  };
}

/**
 * Calculate all pairwise correlations in a portfolio
 */
export function calculatePortfolioCorrelations(
  borrowers: BorrowerRiskProfile[]
): RiskCorrelation[] {
  const correlations: RiskCorrelation[] = [];

  for (let i = 0; i < borrowers.length; i++) {
    for (let j = i + 1; j < borrowers.length; j++) {
      const { strength, type, sharedFactors } = calculateCorrelationStrength(
        borrowers[i],
        borrowers[j]
      );

      if (strength > 0.1) {
        // Only include meaningful correlations
        correlations.push({
          id: `corr-${borrowers[i].id}-${borrowers[j].id}`,
          borrower1Id: borrowers[i].id,
          borrower1Name: borrowers[i].name,
          borrower2Id: borrowers[j].id,
          borrower2Name: borrowers[j].name,
          correlationType: type,
          correlationStrength: strength,
          sharedFactors: sharedFactors.map((f) => ({
            factorName: f,
            factorType: type,
            value: f,
            impactScore: strength,
          })),
          historicalCoMovement: Math.round(strength * 100 * 0.8 + Math.random() * 20), // Simulated
          confidence: Math.round(70 + Math.random() * 25),
        });
      }
    }
  }

  return correlations.sort((a, b) => b.correlationStrength - a.correlationStrength);
}

/**
 * Calculate ripple effects from a risk event
 */
export function calculateRippleEffect(
  event: RiskEvent,
  borrowers: BorrowerRiskProfile[],
  correlations: RiskCorrelation[]
): RippleEffect {
  const sourceBorrower = borrowers.find((b) => b.id === event.borrowerId);
  if (!sourceBorrower) {
    return {
      sourceEvent: event,
      affectedBorrowers: [],
      totalExposureAtRisk: 0,
      portfolioImpactPercentage: 0,
      recommendations: [],
    };
  }

  // Find correlated borrowers
  const relatedCorrelations = correlations.filter(
    (c) =>
      c.borrower1Id === event.borrowerId || c.borrower2Id === event.borrowerId
  );

  const mappedBorrowers = relatedCorrelations
    .map((corr) => {
      const affectedId =
        corr.borrower1Id === event.borrowerId
          ? corr.borrower2Id
          : corr.borrower1Id;
      const affectedBorrower = borrowers.find((b) => b.id === affectedId);
      if (!affectedBorrower) return null;

      const riskProbability = corr.correlationStrength * getSeverityMultiplier(event.severity);

      return {
        borrowerId: affectedBorrower.id,
        borrowerName: affectedBorrower.name,
        facilityId: affectedBorrower.facilityId,
        facilityName: affectedBorrower.facilityName,
        exposure: affectedBorrower.totalExposure,
        correlationStrength: corr.correlationStrength,
        correlationType: corr.correlationType,
        sharedFactors: corr.sharedFactors.map((f) => f.factorName),
        riskProbability,
        estimatedImpact: getEstimatedImpact(riskProbability),
        relatedCovenants: [] as RelatedCovenant[],
      };
    });

  const affectedBorrowers: AffectedBorrower[] = mappedBorrowers
    .filter((b): b is NonNullable<typeof b> => b !== null)
    .sort((a, b) => b.riskProbability - a.riskProbability);

  const totalExposureAtRisk = affectedBorrowers.reduce(
    (sum, b) => sum + b.exposure * b.riskProbability,
    0
  );

  const totalPortfolioExposure = borrowers.reduce(
    (sum, b) => sum + b.totalExposure,
    0
  );

  const portfolioImpactPercentage =
    totalPortfolioExposure > 0
      ? (totalExposureAtRisk / totalPortfolioExposure) * 100
      : 0;

  const recommendations = generateRippleRecommendations(
    event,
    affectedBorrowers,
    portfolioImpactPercentage
  );

  return {
    sourceEvent: event,
    affectedBorrowers,
    totalExposureAtRisk,
    portfolioImpactPercentage,
    recommendations,
  };
}

/**
 * Calculate portfolio-level correlation metrics
 */
export function calculatePortfolioMetrics(
  borrowers: BorrowerRiskProfile[],
  correlations: RiskCorrelation[]
): PortfolioCorrelationMetrics {
  // Average correlation
  const avgCorrelation =
    correlations.length > 0
      ? correlations.reduce((sum, c) => sum + c.correlationStrength, 0) /
        correlations.length
      : 0;

  // Concentration risk by type
  const concentrationRisk = calculateConcentrationRisk(borrowers);

  // Sector exposure
  const sectorExposure = calculateSectorExposure(borrowers);

  // Geography exposure
  const geographyExposure = calculateGeographyExposure(borrowers);

  // Correlation clusters
  const correlationClusters = identifyCorrelationClusters(
    borrowers,
    correlations
  );

  // Calculate systemic risk score (0-100)
  const systemicRiskScore = Math.min(
    100,
    Math.round(
      avgCorrelation * 50 +
        Math.max(
          0,
          ...concentrationRisk.map((c) => (c.percentage > 30 ? 20 : 0))
        ) +
        (correlationClusters.length > 3 ? 15 : 0) +
        (sectorExposure.some((s) => s.percentage > 40) ? 15 : 0)
    )
  );

  // Calculate diversification score (inverse of concentration)
  const diversificationScore = Math.max(
    0,
    Math.round(100 - systemicRiskScore * 0.7 - avgCorrelation * 30)
  );

  return {
    averageCorrelation: Math.round(avgCorrelation * 100) / 100,
    concentrationRisk,
    sectorExposure,
    geographyExposure,
    correlationClusters,
    systemicRiskScore,
    diversificationScore,
  };
}

/**
 * Generate correlation matrix data for visualization
 */
export function generateCorrelationMatrix(
  borrowers: BorrowerRiskProfile[],
  correlations: RiskCorrelation[]
): CorrelationMatrixData {
  const matrix: number[][] = [];
  const highlights: MatrixHighlight[] = [];

  // Create lookup for faster access
  const correlationLookup = new Map<string, number>();
  correlations.forEach((c) => {
    correlationLookup.set(`${c.borrower1Id}-${c.borrower2Id}`, c.correlationStrength);
    correlationLookup.set(`${c.borrower2Id}-${c.borrower1Id}`, c.correlationStrength);
  });

  for (let i = 0; i < borrowers.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < borrowers.length; j++) {
      if (i === j) {
        matrix[i][j] = 1;
      } else {
        const key = `${borrowers[i].id}-${borrowers[j].id}`;
        matrix[i][j] = correlationLookup.get(key) || 0;

        // Add highlights for significant correlations
        if (matrix[i][j] >= 0.7) {
          highlights.push({
            row: i,
            col: j,
            type: 'high_positive',
            tooltip: `Strong correlation between ${borrowers[i].name} and ${borrowers[j].name}`,
          });
        } else if (matrix[i][j] >= 0.4) {
          highlights.push({
            row: i,
            col: j,
            type: 'significant',
            tooltip: `Moderate correlation between ${borrowers[i].name} and ${borrowers[j].name}`,
          });
        }
      }
    }
  }

  return {
    borrowers: borrowers.map((b) => ({
      id: b.id,
      name: b.name,
      shortName: b.name.split(' ')[0].slice(0, 8),
    })),
    matrix,
    highlights,
  };
}

/**
 * Filter correlations based on provided criteria
 */
export function filterCorrelations(
  correlations: RiskCorrelation[],
  filters: CorrelationFilters
): RiskCorrelation[] {
  return correlations.filter((c) => {
    if (
      filters.correlationTypes &&
      !filters.correlationTypes.includes(c.correlationType)
    ) {
      return false;
    }
    if (
      filters.minCorrelation !== undefined &&
      c.correlationStrength < filters.minCorrelation
    ) {
      return false;
    }
    if (
      filters.maxCorrelation !== undefined &&
      c.correlationStrength > filters.maxCorrelation
    ) {
      return false;
    }
    if (filters.borrowerIds && filters.borrowerIds.length > 0) {
      const matchesBorrower =
        filters.borrowerIds.includes(c.borrower1Id) ||
        filters.borrowerIds.includes(c.borrower2Id);
      if (!matchesBorrower) return false;
    }
    return true;
  });
}

// Helper functions

function getSeverityMultiplier(severity: RiskSeverity): number {
  switch (severity) {
    case 'critical':
      return 1.0;
    case 'high':
      return 0.8;
    case 'medium':
      return 0.5;
    case 'low':
      return 0.3;
    default:
      return 0.5;
  }
}

function getEstimatedImpact(probability: number): RiskSeverity {
  if (probability >= 0.7) return 'critical';
  if (probability >= 0.5) return 'high';
  if (probability >= 0.3) return 'medium';
  return 'low';
}

function calculateConcentrationRisk(
  borrowers: BorrowerRiskProfile[]
): ConcentrationRisk[] {
  const totalExposure = borrowers.reduce((sum, b) => sum + b.totalExposure, 0);
  const risks: ConcentrationRisk[] = [];

  // By sector
  const sectorMap = new Map<string, { exposure: number; count: number }>();
  borrowers.forEach((b) => {
    const current = sectorMap.get(b.industry) || { exposure: 0, count: 0 };
    sectorMap.set(b.industry, {
      exposure: current.exposure + b.totalExposure,
      count: current.count + 1,
    });
  });

  sectorMap.forEach((data, sector) => {
    const percentage = (data.exposure / totalExposure) * 100;
    risks.push({
      type: 'sector',
      value: sector,
      exposure: data.exposure,
      percentage,
      borrowerCount: data.count,
      riskLevel: percentage > 40 ? 'high' : percentage > 25 ? 'medium' : 'low',
    });
  });

  // By geography
  const geoMap = new Map<string, { exposure: number; count: number }>();
  borrowers.forEach((b) => {
    const current = geoMap.get(b.geography) || { exposure: 0, count: 0 };
    geoMap.set(b.geography, {
      exposure: current.exposure + b.totalExposure,
      count: current.count + 1,
    });
  });

  geoMap.forEach((data, geo) => {
    const percentage = (data.exposure / totalExposure) * 100;
    risks.push({
      type: 'geography',
      value: geo,
      exposure: data.exposure,
      percentage,
      borrowerCount: data.count,
      riskLevel: percentage > 40 ? 'high' : percentage > 25 ? 'medium' : 'low',
    });
  });

  return risks.sort((a, b) => b.percentage - a.percentage);
}

function calculateSectorExposure(
  borrowers: BorrowerRiskProfile[]
): SectorExposure[] {
  const totalExposure = borrowers.reduce((sum, b) => sum + b.totalExposure, 0);
  const sectorMap = new Map<
    string,
    {
      exposure: number;
      count: number;
      esgScores: number[];
      complianceScores: number[];
    }
  >();

  borrowers.forEach((b) => {
    const current = sectorMap.get(b.industry) || {
      exposure: 0,
      count: 0,
      esgScores: [],
      complianceScores: [],
    };
    sectorMap.set(b.industry, {
      exposure: current.exposure + b.totalExposure,
      count: current.count + 1,
      esgScores:
        b.esgScore !== null
          ? [...current.esgScores, b.esgScore]
          : current.esgScores,
      complianceScores: [...current.complianceScores, b.complianceScore],
    });
  });

  const exposures: SectorExposure[] = [];
  sectorMap.forEach((data, sector) => {
    exposures.push({
      sector,
      exposure: data.exposure,
      percentage: (data.exposure / totalExposure) * 100,
      borrowerCount: data.count,
      avgEsgScore:
        data.esgScores.length > 0
          ? data.esgScores.reduce((a, b) => a + b, 0) / data.esgScores.length
          : null,
      avgComplianceScore:
        data.complianceScores.reduce((a, b) => a + b, 0) /
        data.complianceScores.length,
      riskFactors: [],
    });
  });

  return exposures.sort((a, b) => b.exposure - a.exposure);
}

function calculateGeographyExposure(
  borrowers: BorrowerRiskProfile[]
): GeographyExposure[] {
  const totalExposure = borrowers.reduce((sum, b) => sum + b.totalExposure, 0);
  const geoMap = new Map<string, { exposure: number; count: number }>();

  borrowers.forEach((b) => {
    const current = geoMap.get(b.geography) || { exposure: 0, count: 0 };
    geoMap.set(b.geography, {
      exposure: current.exposure + b.totalExposure,
      count: current.count + 1,
    });
  });

  const exposures: GeographyExposure[] = [];
  geoMap.forEach((data, region) => {
    const percentage = (data.exposure / totalExposure) * 100;
    exposures.push({
      region,
      exposure: data.exposure,
      percentage,
      borrowerCount: data.count,
      regulatoryRisk: percentage > 35 ? 'high' : percentage > 20 ? 'medium' : 'low',
    });
  });

  return exposures.sort((a, b) => b.exposure - a.exposure);
}

function identifyCorrelationClusters(
  borrowers: BorrowerRiskProfile[],
  correlations: RiskCorrelation[]
): CorrelationCluster[] {
  const clusters: CorrelationCluster[] = [];
  const visited = new Set<string>();

  // Simple clustering: group highly correlated borrowers
  const highCorrelations = correlations.filter(
    (c) => c.correlationStrength >= 0.5
  );

  highCorrelations.forEach((corr) => {
    if (visited.has(corr.borrower1Id) && visited.has(corr.borrower2Id)) return;

    const clusterBorrowers = new Set<string>();
    clusterBorrowers.add(corr.borrower1Id);
    clusterBorrowers.add(corr.borrower2Id);

    // Find other borrowers correlated with this pair
    highCorrelations.forEach((other) => {
      if (
        clusterBorrowers.has(other.borrower1Id) ||
        clusterBorrowers.has(other.borrower2Id)
      ) {
        clusterBorrowers.add(other.borrower1Id);
        clusterBorrowers.add(other.borrower2Id);
      }
    });

    const borrowerIds = Array.from(clusterBorrowers);
    const clusterBorrowerProfiles = borrowers.filter((b) =>
      borrowerIds.includes(b.id)
    );

    if (clusterBorrowerProfiles.length >= 2) {
      const totalExposure = clusterBorrowerProfiles.reduce(
        (sum, b) => sum + b.totalExposure,
        0
      );

      clusters.push({
        id: `cluster-${clusters.length + 1}`,
        name: `${corr.correlationType.replace('_', ' ')} cluster`,
        borrowerIds,
        correlationType: corr.correlationType,
        avgCorrelation: corr.correlationStrength,
        totalExposure,
        clusterRiskScore: Math.round(corr.correlationStrength * 100),
        primaryRiskFactors: corr.sharedFactors.map((f) => f.factorName),
      });

      borrowerIds.forEach((id) => visited.add(id));
    }
  });

  return clusters;
}

function generateRippleRecommendations(
  event: RiskEvent,
  affectedBorrowers: AffectedBorrower[],
  portfolioImpact: number
): string[] {
  const recommendations: string[] = [];

  if (portfolioImpact > 10) {
    recommendations.push(
      'Consider hedging strategies to mitigate concentrated exposure'
    );
  }

  if (affectedBorrowers.some((b) => b.riskProbability > 0.6)) {
    recommendations.push(
      'Initiate proactive outreach to high-risk correlated borrowers'
    );
  }

  if (event.category === 'esg') {
    recommendations.push(
      'Review ESG compliance status of correlated borrowers in same sector'
    );
  }

  if (event.category === 'compliance') {
    recommendations.push(
      'Check upcoming covenant deadlines for affected borrowers'
    );
  }

  const highPriorityCount = affectedBorrowers.filter(
    (b) => b.estimatedImpact === 'high' || b.estimatedImpact === 'critical'
  ).length;

  if (highPriorityCount >= 3) {
    recommendations.push(
      'Schedule portfolio stress test to assess systemic risk'
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('Continue monitoring correlated positions');
  }

  return recommendations;
}

/**
 * Format currency for display
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

/**
 * Get color for correlation strength
 */
export function getCorrelationColor(strength: number): string {
  if (strength >= 0.7) return 'text-red-600';
  if (strength >= 0.5) return 'text-amber-600';
  if (strength >= 0.3) return 'text-yellow-600';
  return 'text-green-600';
}

/**
 * Get background color for correlation strength
 */
export function getCorrelationBgColor(strength: number): string {
  if (strength >= 0.7) return 'bg-red-100';
  if (strength >= 0.5) return 'bg-amber-100';
  if (strength >= 0.3) return 'bg-yellow-100';
  return 'bg-green-100';
}

/**
 * Get severity color
 */
export function getSeverityColor(severity: RiskSeverity): string {
  switch (severity) {
    case 'critical':
      return 'text-red-700';
    case 'high':
      return 'text-red-600';
    case 'medium':
      return 'text-amber-600';
    case 'low':
      return 'text-green-600';
    default:
      return 'text-zinc-600';
  }
}

/**
 * Get severity badge variant
 */
export function getSeverityVariant(
  severity: RiskSeverity
): 'destructive' | 'warning' | 'success' | 'secondary' {
  switch (severity) {
    case 'critical':
    case 'high':
      return 'destructive';
    case 'medium':
      return 'warning';
    case 'low':
      return 'success';
    default:
      return 'secondary';
  }
}
