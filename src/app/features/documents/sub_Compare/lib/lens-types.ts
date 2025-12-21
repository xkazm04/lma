/**
 * Lens-based Model Risk Analysis System
 *
 * Provides composable "lenses" for viewing document comparison changes
 * through different analytical perspectives: Risk, Market, Party, and Impact.
 *
 * Users can combine lenses to create custom views like:
 * "show me changes that are high-risk AND borrower-favorable AND below-market"
 */

import type { ComparisonChange, ChangeRiskScore, ChangeMarketBenchmark, FavoredParty, RiskSeverity } from '../../lib/types';

// ============================================
// Core Lens Types
// ============================================

/**
 * A Lens is a function that extracts a specific view/perspective from a change.
 * Each lens returns a typed result or undefined if the lens data is not available.
 */
export type Lens<TResult> = (change: ComparisonChange, changeId: string) => TResult | undefined;

/**
 * A LensPredicate is a function that filters changes based on lens criteria.
 * Returns true if the change passes the filter.
 */
export type LensPredicate = (change: ComparisonChange, changeId: string) => boolean;

/**
 * Change with all lens data attached for unified access
 */
export interface ChangeWithLensData extends ComparisonChange {
  changeId: string;
  riskView?: RiskLensResult;
  marketView?: MarketLensResult;
  partyView?: PartyLensResult;
  impactView?: ImpactLensResult;
}

// ============================================
// Individual Lens Result Types
// ============================================

/**
 * Result from the Risk lens - severity and risk analysis
 */
export interface RiskLensResult {
  severityScore: number;
  severity: RiskSeverity;
  riskAnalysis: string;
  deviatesFromMarket: boolean;
  confidence: number;
}

/**
 * Result from the Market lens - benchmark positioning
 */
export interface MarketLensResult {
  marketPosition: 'below_market' | 'at_market' | 'above_market';
  percentile: number;
  marketRangeLow: string;
  marketRangeHigh: string;
  marketMedian: string;
  marketInsight: string;
  sampleSize: number;
  benchmarkPeriod: string;
}

/**
 * Result from the Party lens - who benefits
 */
export interface PartyLensResult {
  favoredParty: FavoredParty;
  direction: 'favorable' | 'unfavorable' | 'neutral';
  explanation?: string;
}

/**
 * Result from the Impact lens - business impact assessment
 */
export interface ImpactLensResult {
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
  impactDescription: string;
  businessContext?: string;
}

// ============================================
// Lens Filter Options
// ============================================

/**
 * Risk filter options
 */
export type RiskFilterOption =
  | 'all'
  | 'low'       // 1-3
  | 'medium'    // 4-5
  | 'high'      // 6-7
  | 'critical'; // 8-10

/**
 * Market position filter options
 */
export type MarketFilterOption =
  | 'all'
  | 'below_market'
  | 'at_market'
  | 'above_market'
  | 'deviates';  // Any deviation from market

/**
 * Party filter options
 */
export type PartyFilterOption =
  | 'all'
  | 'borrower'
  | 'lender'
  | 'neutral';

/**
 * Impact level filter options
 */
export type ImpactFilterOption =
  | 'all'
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

/**
 * Combined lens filter state - enables multi-dimensional filtering
 */
export interface LensFiltersState {
  /** Risk severity filters (multiple can be selected) */
  riskLevels: RiskFilterOption[];
  /** Market position filters (multiple can be selected) */
  marketPositions: MarketFilterOption[];
  /** Party filters (multiple can be selected) */
  favoredParties: PartyFilterOption[];
  /** Impact level filters (multiple can be selected) */
  impactLevels: ImpactFilterOption[];
  /** Require market deviation */
  requiresMarketDeviation?: boolean;
}

/**
 * Default lens filter state - show all
 */
export const DEFAULT_LENS_FILTERS: LensFiltersState = {
  riskLevels: [],
  marketPositions: [],
  favoredParties: [],
  impactLevels: [],
  requiresMarketDeviation: false,
};

// ============================================
// Lens Provider Configuration
// ============================================

/**
 * Data providers for lens functions
 */
export interface LensDataProviders {
  /** Get risk score for a change */
  getRiskScore?: (changeId: string) => ChangeRiskScore | undefined;
  /** Get market benchmark for a change */
  getMarketBenchmark?: (changeId: string) => ChangeMarketBenchmark | undefined;
}

// ============================================
// Lens Filter Presets
// ============================================

/**
 * Pre-defined lens filter combinations for common use cases
 */
export interface LensPreset {
  id: string;
  name: string;
  description: string;
  filters: LensFiltersState;
  icon?: string;
}

export const LENS_PRESETS: LensPreset[] = [
  {
    id: 'high-risk-borrower',
    name: 'High-Risk Borrower Favorable',
    description: 'Changes that are high-risk and favor the borrower',
    filters: {
      riskLevels: ['high', 'critical'],
      marketPositions: [],
      favoredParties: ['borrower'],
      impactLevels: [],
    },
  },
  {
    id: 'market-deviations',
    name: 'Market Deviations',
    description: 'Changes that deviate from market standards',
    filters: {
      riskLevels: [],
      marketPositions: ['deviates'],
      favoredParties: [],
      impactLevels: [],
      requiresMarketDeviation: true,
    },
  },
  {
    id: 'lender-unfavorable',
    name: 'Lender Unfavorable',
    description: 'Changes that favor borrower with high risk',
    filters: {
      riskLevels: ['medium', 'high', 'critical'],
      marketPositions: [],
      favoredParties: ['borrower'],
      impactLevels: [],
    },
  },
  {
    id: 'critical-review',
    name: 'Critical Review',
    description: 'All critical and high risk changes requiring attention',
    filters: {
      riskLevels: ['critical', 'high'],
      marketPositions: [],
      favoredParties: [],
      impactLevels: ['critical', 'high'],
    },
  },
  {
    id: 'below-market-terms',
    name: 'Below Market Terms',
    description: 'Terms more favorable than typical market',
    filters: {
      riskLevels: [],
      marketPositions: ['below_market'],
      favoredParties: [],
      impactLevels: [],
    },
  },
  {
    id: 'above-market-terms',
    name: 'Above Market Terms',
    description: 'Terms exceeding typical market standards',
    filters: {
      riskLevels: [],
      marketPositions: ['above_market'],
      favoredParties: [],
      impactLevels: [],
    },
  },
];

// ============================================
// Helper Type Guards
// ============================================

export function isValidRiskLevel(value: string): value is RiskFilterOption {
  return ['all', 'low', 'medium', 'high', 'critical'].includes(value);
}

export function isValidMarketPosition(value: string): value is MarketFilterOption {
  return ['all', 'below_market', 'at_market', 'above_market', 'deviates'].includes(value);
}

export function isValidPartyOption(value: string): value is PartyFilterOption {
  return ['all', 'borrower', 'lender', 'neutral'].includes(value);
}

export function isValidImpactLevel(value: string): value is ImpactFilterOption {
  return ['all', 'low', 'medium', 'high', 'critical'].includes(value);
}
