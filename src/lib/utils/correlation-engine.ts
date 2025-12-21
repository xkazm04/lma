/**
 * Generic Correlation Engine
 *
 * Discovers and computes relationships between any entity types in the system.
 * This is the core intelligence capability of LoanOS.
 */

// ============================================================================
// Core Types
// ============================================================================

export interface Entity {
  id: string;
  type: string;
  [key: string]: unknown;
}

export interface CorrelationFactor<A extends Entity = Entity, B extends Entity = Entity> {
  factorName: string;
  factorType: string;
  value: unknown;
  impactScore: number; // 0-1
  entityA: A;
  entityB: B;
}

export interface Correlation<A extends Entity = Entity, B extends Entity = Entity> {
  id: string;
  entityA: A;
  entityB: B;
  correlationType: string;
  strength: number; // -1 to 1 (negative correlation possible)
  confidence: number; // 0-1
  sharedFactors: CorrelationFactor<A, B>[];
  metadata: Record<string, unknown>;
}

export interface CorrelationInsight {
  id: string;
  title: string;
  description: string;
  metric: string;
  value: string | number;
  change?: number;
  correlatedEntities: {
    typeA: string;
    typeB: string;
    count: number;
  };
  significance: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
  recommendations?: string[];
}

// ============================================================================
// Correlation Engine Interface
// ============================================================================

export interface ICorrelationEngine<A extends Entity, B extends Entity> {
  /**
   * Compute correlation between two entities
   */
  computeCorrelation(entityA: A, entityB: B): Correlation<A, B> | null;

  /**
   * Compute all correlations in a dataset
   */
  computeAllCorrelations(entitiesA: A[], entitiesB: B[]): Correlation<A, B>[];

  /**
   * Find entities correlated with a specific entity
   */
  findCorrelated(entity: A, candidates: B[], minStrength?: number): Correlation<A, B>[];

  /**
   * Generate insights from correlations
   */
  generateInsights(correlations: Correlation<A, B>[]): CorrelationInsight[];
}

// ============================================================================
// Generic Correlation Engine Implementation
// ============================================================================

export class CorrelationEngine<A extends Entity, B extends Entity = A>
  implements ICorrelationEngine<A, B>
{
  constructor(
    private config: {
      /**
       * Extract comparable features from entities
       */
      extractFeatures: (entityA: A, entityB: B) => CorrelationFactor<A, B>[];

      /**
       * Calculate strength from factors (default: weighted average)
       */
      calculateStrength?: (factors: CorrelationFactor<A, B>[]) => number;

      /**
       * Calculate confidence (default: based on factor count and consistency)
       */
      calculateConfidence?: (factors: CorrelationFactor<A, B>[], strength: number) => number;

      /**
       * Determine correlation type from factors
       */
      determineType?: (factors: CorrelationFactor<A, B>[]) => string;

      /**
       * Minimum strength threshold
       */
      minStrength?: number;
    }
  ) {}

  computeCorrelation(entityA: A, entityB: B): Correlation<A, B> | null {
    const factors = this.config.extractFeatures(entityA, entityB);

    if (factors.length === 0) {
      return null;
    }

    const strength = this.config.calculateStrength
      ? this.config.calculateStrength(factors)
      : this.defaultCalculateStrength(factors);

    const minStrength = this.config.minStrength ?? 0.1;
    if (Math.abs(strength) < minStrength) {
      return null;
    }

    const confidence = this.config.calculateConfidence
      ? this.config.calculateConfidence(factors, strength)
      : this.defaultCalculateConfidence(factors, strength);

    const correlationType = this.config.determineType
      ? this.config.determineType(factors)
      : this.defaultDetermineType(factors);

    return {
      id: `corr-${entityA.id}-${entityB.id}`,
      entityA,
      entityB,
      correlationType,
      strength,
      confidence,
      sharedFactors: factors,
      metadata: {},
    };
  }

  computeAllCorrelations(entitiesA: A[], entitiesB: B[]): Correlation<A, B>[] {
    const correlations: Correlation<A, B>[] = [];
    // Check if arrays reference the same array instance (for self-correlation)
    const isSameType = (entitiesA as unknown[]) === (entitiesB as unknown[]);

    for (let i = 0; i < entitiesA.length; i++) {
      const startJ = isSameType ? i + 1 : 0;
      for (let j = startJ; j < entitiesB.length; j++) {
        const corr = this.computeCorrelation(entitiesA[i], entitiesB[j]);
        if (corr) {
          correlations.push(corr);
        }
      }
    }

    return correlations.sort((a, b) => Math.abs(b.strength) - Math.abs(a.strength));
  }

  findCorrelated(
    entity: A,
    candidates: B[],
    minStrength: number = 0.1
  ): Correlation<A, B>[] {
    const correlations: Correlation<A, B>[] = [];

    for (const candidate of candidates) {
      const corr = this.computeCorrelation(entity, candidate);
      if (corr && Math.abs(corr.strength) >= minStrength) {
        correlations.push(corr);
      }
    }

    return correlations.sort((a, b) => Math.abs(b.strength) - Math.abs(a.strength));
  }

  generateInsights(correlations: Correlation<A, B>[]): CorrelationInsight[] {
    const insights: CorrelationInsight[] = [];

    // Group by correlation type
    const typeGroups = new Map<string, Correlation<A, B>[]>();
    correlations.forEach((corr) => {
      const group = typeGroups.get(corr.correlationType) || [];
      group.push(corr);
      typeGroups.set(corr.correlationType, group);
    });

    // Generate insights for each type
    typeGroups.forEach((group, type) => {
      const avgStrength = group.reduce((sum, c) => sum + Math.abs(c.strength), 0) / group.length;
      const highStrength = group.filter((c) => Math.abs(c.strength) > 0.7);

      if (highStrength.length > 0) {
        insights.push({
          id: `insight-${type}-${Date.now()}`,
          title: `Strong ${type} correlation detected`,
          description: `${highStrength.length} entity pairs show strong ${type} correlation`,
          metric: 'Average Correlation Strength',
          value: `${Math.round(avgStrength * 100)}%`,
          correlatedEntities: {
            typeA: group[0].entityA.type,
            typeB: group[0].entityB.type,
            count: group.length,
          },
          significance: avgStrength > 0.7 ? 'critical' : avgStrength > 0.5 ? 'high' : 'medium',
          actionable: true,
          recommendations: this.generateRecommendations(type, avgStrength),
        });
      }
    });

    // Identify clusters (entities with multiple high correlations)
    const entityCorrelationCount = new Map<string, number>();
    correlations.forEach((corr) => {
      if (Math.abs(corr.strength) > 0.6) {
        entityCorrelationCount.set(
          corr.entityA.id,
          (entityCorrelationCount.get(corr.entityA.id) || 0) + 1
        );
        entityCorrelationCount.set(
          corr.entityB.id,
          (entityCorrelationCount.get(corr.entityB.id) || 0) + 1
        );
      }
    });

    const highlyConnected = Array.from(entityCorrelationCount.entries())
      .filter(([_, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1]);

    if (highlyConnected.length > 0) {
      insights.push({
        id: `insight-clusters-${Date.now()}`,
        title: 'Correlation clusters identified',
        description: `${highlyConnected.length} entities are highly interconnected`,
        metric: 'Hub Entities',
        value: highlyConnected.length,
        correlatedEntities: {
          typeA: 'multiple',
          typeB: 'multiple',
          count: correlations.length,
        },
        significance: highlyConnected.length > 5 ? 'critical' : 'high',
        actionable: true,
        recommendations: [
          'Review concentration risk in highly connected entities',
          'Consider diversification strategies',
          'Monitor hub entities for systemic impact',
        ],
      });
    }

    return insights.sort((a, b) => {
      const sigOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return sigOrder[b.significance] - sigOrder[a.significance];
    });
  }

  // ============================================================================
  // Default Implementations
  // ============================================================================

  private defaultCalculateStrength(factors: CorrelationFactor<A, B>[]): number {
    if (factors.length === 0) return 0;
    return factors.reduce((sum, f) => sum + f.impactScore, 0) / factors.length;
  }

  private defaultCalculateConfidence(
    factors: CorrelationFactor<A, B>[],
    strength: number
  ): number {
    // More factors + higher strength = higher confidence
    const factorConfidence = Math.min(1, factors.length / 5);
    const strengthConfidence = Math.abs(strength);
    return (factorConfidence + strengthConfidence) / 2;
  }

  private defaultDetermineType(factors: CorrelationFactor<A, B>[]): string {
    if (factors.length === 0) return 'unknown';

    // Return the type of the highest impact factor
    const dominant = factors.reduce((max, f) =>
      f.impactScore > max.impactScore ? f : max
    );

    return dominant.factorType;
  }

  private generateRecommendations(type: string, strength: number): string[] {
    const recommendations: string[] = [];

    if (strength > 0.7) {
      recommendations.push(`Strong ${type} correlation detected - consider strategic implications`);
    }

    if (type.includes('sector') || type.includes('industry')) {
      recommendations.push('Evaluate sector concentration risk');
      recommendations.push('Consider cross-sector diversification');
    }

    if (type.includes('geography') || type.includes('region')) {
      recommendations.push('Assess regional regulatory risks');
      recommendations.push('Review geographic exposure limits');
    }

    if (type.includes('time') || type.includes('maturity')) {
      recommendations.push('Analyze temporal risk clustering');
      recommendations.push('Consider staggered maturity profiles');
    }

    return recommendations;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a correlation engine for same-type entities
 */
export function createSelfCorrelationEngine<T extends Entity>(
  extractFeatures: (entityA: T, entityB: T) => CorrelationFactor<T, T>[],
  options?: Omit<ConstructorParameters<typeof CorrelationEngine<T, T>>[0], 'extractFeatures'>
): CorrelationEngine<T, T> {
  return new CorrelationEngine<T, T>({
    extractFeatures,
    ...options,
  });
}

/**
 * Create a correlation engine for different entity types
 */
export function createCrossCorrelationEngine<A extends Entity, B extends Entity>(
  extractFeatures: (entityA: A, entityB: B) => CorrelationFactor<A, B>[],
  options?: Omit<ConstructorParameters<typeof CorrelationEngine<A, B>>[0], 'extractFeatures'>
): CorrelationEngine<A, B> {
  return new CorrelationEngine<A, B>({
    extractFeatures,
    ...options,
  });
}

/**
 * Standard feature extractors for common patterns
 */
export const FeatureExtractors = {
  /**
   * Extract exact match features
   */
  exactMatch: <A extends Entity, B extends Entity>(
    fieldName: string,
    factorType: string,
    impactScore: number = 0.5
  ) => (entityA: A, entityB: B): CorrelationFactor<A, B>[] => {
    const valueA = entityA[fieldName];
    const valueB = entityB[fieldName];

    if (valueA === valueB && valueA !== undefined) {
      return [{
        factorName: `${fieldName}: ${String(valueA)}`,
        factorType,
        value: valueA,
        impactScore,
        entityA,
        entityB,
      }];
    }

    return [];
  },

  /**
   * Extract numeric similarity features
   */
  numericSimilarity: <A extends Entity, B extends Entity>(
    fieldName: string,
    factorType: string,
    maxDiff: number,
    impactScore: number = 0.3
  ) => (entityA: A, entityB: B): CorrelationFactor<A, B>[] => {
    const valueA = entityA[fieldName] as number;
    const valueB = entityB[fieldName] as number;

    if (typeof valueA === 'number' && typeof valueB === 'number') {
      const diff = Math.abs(valueA - valueB);
      if (diff <= maxDiff) {
        const similarity = 1 - (diff / maxDiff);
        return [{
          factorName: `${fieldName} similarity`,
          factorType,
          value: { valueA, valueB, diff },
          impactScore: impactScore * similarity,
          entityA,
          entityB,
        }];
      }
    }

    return [];
  },

  /**
   * Extract date proximity features
   */
  dateProximity: <A extends Entity, B extends Entity>(
    fieldName: string,
    factorType: string,
    maxDaysApart: number,
    impactScore: number = 0.3
  ) => (entityA: A, entityB: B): CorrelationFactor<A, B>[] => {
    const valueA = entityA[fieldName];
    const valueB = entityB[fieldName];

    if (typeof valueA === 'string' && typeof valueB === 'string') {
      const dateA = new Date(valueA);
      const dateB = new Date(valueB);
      const daysDiff = Math.abs(dateA.getTime() - dateB.getTime()) / (1000 * 60 * 60 * 24);

      if (daysDiff <= maxDaysApart) {
        const proximity = 1 - (daysDiff / maxDaysApart);
        return [{
          factorName: `${fieldName} proximity`,
          factorType,
          value: { dateA: valueA, dateB: valueB, daysDiff },
          impactScore: impactScore * proximity,
          entityA,
          entityB,
        }];
      }
    }

    return [];
  },

  /**
   * Extract array overlap features
   */
  arrayOverlap: <A extends Entity, B extends Entity>(
    fieldName: string,
    factorType: string,
    impactScore: number = 0.4
  ) => (entityA: A, entityB: B): CorrelationFactor<A, B>[] => {
    const arrayA = entityA[fieldName] as unknown[];
    const arrayB = entityB[fieldName] as unknown[];

    if (Array.isArray(arrayA) && Array.isArray(arrayB)) {
      const overlap = arrayA.filter((item) => arrayB.includes(item));
      if (overlap.length > 0) {
        const overlapRatio = overlap.length / Math.max(arrayA.length, arrayB.length);
        return [{
          factorName: `${fieldName} overlap: ${overlap.join(', ')}`,
          factorType,
          value: overlap,
          impactScore: impactScore * overlapRatio,
          entityA,
          entityB,
        }];
      }
    }

    return [];
  },
};

/**
 * Combine multiple feature extractors
 */
export function combineExtractors<A extends Entity, B extends Entity>(
  ...extractors: Array<(entityA: A, entityB: B) => CorrelationFactor<A, B>[]>
): (entityA: A, entityB: B) => CorrelationFactor<A, B>[] {
  return (entityA: A, entityB: B) => {
    return extractors.flatMap((extractor) => extractor(entityA, entityB));
  };
}
