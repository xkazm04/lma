/**
 * Composable Lens Functions for Document Comparison Analysis
 *
 * Each lens provides a different perspective on a document change:
 * - riskLens: Risk severity and deviation analysis
 * - marketLens: Market benchmark positioning
 * - partyLens: Which party benefits from the change
 * - impactLens: Business impact assessment
 *
 * Lenses can be composed to create powerful queries like:
 * "show me high-risk borrower-favorable below-market changes"
 */

import type { ComparisonChange, ChangeRiskScore, ChangeMarketBenchmark, RiskSeverity } from '../../lib/types';
import type {
  Lens,
  LensPredicate,
  RiskLensResult,
  MarketLensResult,
  PartyLensResult,
  ImpactLensResult,
  LensDataProviders,
  LensFiltersState,
  ChangeWithLensData,
  RiskFilterOption,
  MarketFilterOption,
  PartyFilterOption,
} from './lens-types';

// ============================================
// Lens Factory Functions
// ============================================

/**
 * Creates a Risk lens with the given data provider
 */
export function createRiskLens(
  getRiskScore: (changeId: string) => ChangeRiskScore | undefined
): Lens<RiskLensResult> {
  return (_change: ComparisonChange, changeId: string): RiskLensResult | undefined => {
    const score = getRiskScore(changeId);
    if (!score) return undefined;

    return {
      severityScore: score.severityScore,
      severity: score.severity,
      riskAnalysis: score.riskAnalysis,
      deviatesFromMarket: score.deviatesFromMarket,
      confidence: score.confidence,
    };
  };
}

/**
 * Creates a Market lens with the given data provider
 */
export function createMarketLens(
  getMarketBenchmark: (changeId: string) => ChangeMarketBenchmark | undefined
): Lens<MarketLensResult> {
  return (_change: ComparisonChange, changeId: string): MarketLensResult | undefined => {
    const benchmark = getMarketBenchmark(changeId);
    if (!benchmark) return undefined;

    return {
      marketPosition: benchmark.marketPosition,
      percentile: benchmark.percentile,
      marketRangeLow: benchmark.marketRangeLow,
      marketRangeHigh: benchmark.marketRangeHigh,
      marketMedian: benchmark.marketMedian,
      marketInsight: benchmark.marketInsight,
      sampleSize: benchmark.sampleSize,
      benchmarkPeriod: benchmark.benchmarkPeriod,
    };
  };
}

/**
 * Creates a Party lens with the given data provider
 */
export function createPartyLens(
  getRiskScore: (changeId: string) => ChangeRiskScore | undefined
): Lens<PartyLensResult> {
  return (_change: ComparisonChange, changeId: string): PartyLensResult | undefined => {
    const score = getRiskScore(changeId);
    if (!score) return undefined;

    // Determine direction based on favored party and context
    const direction =
      score.favoredParty === 'borrower'
        ? 'favorable' // Assumes analysis from borrower perspective
        : score.favoredParty === 'lender'
        ? 'unfavorable'
        : 'neutral';

    return {
      favoredParty: score.favoredParty,
      direction,
      explanation: score.riskAnalysis,
    };
  };
}

/**
 * Creates an Impact lens that derives impact from risk score and change type
 */
export function createImpactLens(
  getRiskScore: (changeId: string) => ChangeRiskScore | undefined
): Lens<ImpactLensResult> {
  return (change: ComparisonChange, changeId: string): ImpactLensResult | undefined => {
    const score = getRiskScore(changeId);

    // Map severity to impact level
    const severityToImpact = (severity?: RiskSeverity): 'low' | 'medium' | 'high' | 'critical' => {
      if (!severity) return 'medium';
      return severity;
    };

    const impactLevel = score ? severityToImpact(score.severity) : 'medium';

    return {
      impactLevel,
      impactDescription: change.impact,
      businessContext: score?.riskAnalysis,
    };
  };
}

// ============================================
// Lens Predicate Factories
// ============================================

/**
 * Creates a predicate that filters by risk severity
 */
export function createRiskPredicate(
  riskLens: Lens<RiskLensResult>,
  levels: RiskFilterOption[]
): LensPredicate {
  return (change: ComparisonChange, changeId: string): boolean => {
    // Empty levels means "all" - no filtering
    if (levels.length === 0 || levels.includes('all')) {
      return true;
    }

    const riskView = riskLens(change, changeId);
    if (!riskView) {
      // If no risk data available, only include if 'all' was selected
      return levels.includes('all');
    }

    return levels.includes(riskView.severity);
  };
}

/**
 * Creates a predicate that filters by market position
 */
export function createMarketPredicate(
  marketLens: Lens<MarketLensResult>,
  riskLens: Lens<RiskLensResult>,
  positions: MarketFilterOption[],
  requiresDeviation?: boolean
): LensPredicate {
  return (change: ComparisonChange, changeId: string): boolean => {
    // Empty positions means "all" - no filtering
    if (positions.length === 0 || positions.includes('all')) {
      if (requiresDeviation) {
        const riskView = riskLens(change, changeId);
        return riskView?.deviatesFromMarket ?? false;
      }
      return true;
    }

    // Check for deviation filter
    if (positions.includes('deviates')) {
      const riskView = riskLens(change, changeId);
      if (riskView?.deviatesFromMarket) {
        return true;
      }
    }

    const marketView = marketLens(change, changeId);
    if (!marketView) {
      // No market data available
      return positions.includes('all');
    }

    // Check specific positions
    const specificPositions = positions.filter(
      (p) => p !== 'all' && p !== 'deviates'
    ) as Array<'below_market' | 'at_market' | 'above_market'>;

    if (specificPositions.length === 0) {
      return true;
    }

    return specificPositions.includes(marketView.marketPosition);
  };
}

/**
 * Creates a predicate that filters by favored party
 */
export function createPartyPredicate(
  partyLens: Lens<PartyLensResult>,
  parties: PartyFilterOption[]
): LensPredicate {
  return (change: ComparisonChange, changeId: string): boolean => {
    // Empty parties means "all" - no filtering
    if (parties.length === 0 || parties.includes('all')) {
      return true;
    }

    const partyView = partyLens(change, changeId);
    if (!partyView) {
      // No party data available
      return parties.includes('all');
    }

    return parties.includes(partyView.favoredParty);
  };
}

/**
 * Creates a predicate that filters by impact level
 */
export function createImpactPredicate(
  impactLens: Lens<ImpactLensResult>,
  levels: ('all' | 'low' | 'medium' | 'high' | 'critical')[]
): LensPredicate {
  return (change: ComparisonChange, changeId: string): boolean => {
    // Empty levels means "all" - no filtering
    if (levels.length === 0 || levels.includes('all')) {
      return true;
    }

    const impactView = impactLens(change, changeId);
    if (!impactView) {
      // No impact data available
      return levels.includes('all');
    }

    return levels.includes(impactView.impactLevel);
  };
}

// ============================================
// Lens Composition
// ============================================

/**
 * Composes multiple predicates with AND logic
 * All predicates must return true for the change to pass
 */
export function composeLensPredicates(...predicates: LensPredicate[]): LensPredicate {
  return (change: ComparisonChange, changeId: string): boolean => {
    return predicates.every((predicate) => predicate(change, changeId));
  };
}

/**
 * Composes multiple predicates with OR logic
 * At least one predicate must return true for the change to pass
 */
export function composeLensPredicatesOr(...predicates: LensPredicate[]): LensPredicate {
  return (change: ComparisonChange, changeId: string): boolean => {
    // Empty predicates means pass all
    if (predicates.length === 0) return true;
    return predicates.some((predicate) => predicate(change, changeId));
  };
}

/**
 * Creates a combined predicate from lens filter state
 */
export function createCombinedPredicate(
  filters: LensFiltersState,
  providers: LensDataProviders
): LensPredicate {
  const predicates: LensPredicate[] = [];

  // Create lenses from providers
  const riskLens = providers.getRiskScore
    ? createRiskLens(providers.getRiskScore)
    : () => undefined;

  const marketLens = providers.getMarketBenchmark
    ? createMarketLens(providers.getMarketBenchmark)
    : () => undefined;

  const partyLens = providers.getRiskScore
    ? createPartyLens(providers.getRiskScore)
    : () => undefined;

  const impactLens = providers.getRiskScore
    ? createImpactLens(providers.getRiskScore)
    : () => undefined;

  // Add risk predicate if filtering by risk
  if (filters.riskLevels.length > 0 && !filters.riskLevels.includes('all')) {
    predicates.push(createRiskPredicate(riskLens, filters.riskLevels));
  }

  // Add market predicate if filtering by market
  if (
    filters.marketPositions.length > 0 &&
    !filters.marketPositions.includes('all')
  ) {
    predicates.push(
      createMarketPredicate(
        marketLens,
        riskLens,
        filters.marketPositions,
        filters.requiresMarketDeviation
      )
    );
  }

  // Add party predicate if filtering by party
  if (
    filters.favoredParties.length > 0 &&
    !filters.favoredParties.includes('all')
  ) {
    predicates.push(createPartyPredicate(partyLens, filters.favoredParties));
  }

  // Add impact predicate if filtering by impact
  if (filters.impactLevels.length > 0 && !filters.impactLevels.includes('all')) {
    predicates.push(createImpactPredicate(impactLens, filters.impactLevels));
  }

  // If no predicates, pass all changes
  if (predicates.length === 0) {
    return () => true;
  }

  // Compose with AND logic (all conditions must match)
  return composeLensPredicates(...predicates);
}

// ============================================
// Lens Data Enrichment
// ============================================

/**
 * Enriches a change with all available lens data
 */
export function enrichChangeWithLensData(
  change: ComparisonChange,
  changeId: string,
  providers: LensDataProviders
): ChangeWithLensData {
  const enriched: ChangeWithLensData = {
    ...change,
    changeId,
  };

  if (providers.getRiskScore) {
    const riskLens = createRiskLens(providers.getRiskScore);
    enriched.riskView = riskLens(change, changeId);

    const partyLens = createPartyLens(providers.getRiskScore);
    enriched.partyView = partyLens(change, changeId);

    const impactLens = createImpactLens(providers.getRiskScore);
    enriched.impactView = impactLens(change, changeId);
  }

  if (providers.getMarketBenchmark) {
    const marketLens = createMarketLens(providers.getMarketBenchmark);
    enriched.marketView = marketLens(change, changeId);
  }

  return enriched;
}

/**
 * Checks if any lens filters are active
 */
export function hasActiveLensFilters(filters: LensFiltersState): boolean {
  return (
    (filters.riskLevels.length > 0 && !filters.riskLevels.includes('all')) ||
    (filters.marketPositions.length > 0 && !filters.marketPositions.includes('all')) ||
    (filters.favoredParties.length > 0 && !filters.favoredParties.includes('all')) ||
    (filters.impactLevels.length > 0 && !filters.impactLevels.includes('all')) ||
    !!filters.requiresMarketDeviation
  );
}

/**
 * Creates a human-readable description of active lens filters
 */
export function describeLensFilters(filters: LensFiltersState): string[] {
  const descriptions: string[] = [];

  if (filters.riskLevels.length > 0 && !filters.riskLevels.includes('all')) {
    descriptions.push(`Risk: ${filters.riskLevels.join(', ')}`);
  }

  if (filters.marketPositions.length > 0 && !filters.marketPositions.includes('all')) {
    descriptions.push(`Market: ${filters.marketPositions.join(', ')}`);
  }

  if (filters.favoredParties.length > 0 && !filters.favoredParties.includes('all')) {
    descriptions.push(`Favors: ${filters.favoredParties.join(', ')}`);
  }

  if (filters.impactLevels.length > 0 && !filters.impactLevels.includes('all')) {
    descriptions.push(`Impact: ${filters.impactLevels.join(', ')}`);
  }

  if (filters.requiresMarketDeviation) {
    descriptions.push('Deviates from market');
  }

  return descriptions;
}
