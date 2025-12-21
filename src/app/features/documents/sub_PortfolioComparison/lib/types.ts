/**
 * Types for Cross-Document Term Comparison Intelligence
 *
 * This module provides portfolio-level comparison and analysis
 * of extracted terms across multiple documents, surfacing anomalies
 * and outliers for risk assessment.
 */

/**
 * Represents a single document in the portfolio with its extracted terms
 */
export interface PortfolioDocument {
  id: string;
  name: string;
  documentType: 'facility_agreement' | 'amendment' | 'consent' | 'assignment';
  uploadedAt: string;
  extractionConfidence: number;
  facilityName?: string;
  borrowerName?: string;
}

/**
 * A term value extracted from a specific document
 */
export interface DocumentTermValue {
  documentId: string;
  documentName: string;
  value: string | number | null;
  confidence: number;
  source?: string;
}

/**
 * Market benchmark data for a specific term type
 */
export interface MarketBenchmark {
  termType: string;
  marketMin: number;
  marketMax: number;
  marketMedian: number;
  marketMean: number;
  sampleSize: number;
  asOfDate: string;
}

/**
 * Anomaly severity levels
 */
export type AnomalySeverity = 'info' | 'warning' | 'critical';

/**
 * Types of anomalies that can be detected
 */
export type AnomalyType =
  | 'unusual_value' // Value significantly deviates from portfolio/market norms
  | 'missing_term' // Standard term missing from document
  | 'inconsistent_term' // Same borrower/deal has inconsistent terms across docs
  | 'market_deviation' // Term deviates significantly from market norms
  | 'low_confidence' // Extraction confidence below threshold
  | 'outlier'; // Statistical outlier in the portfolio

/**
 * An anomaly detected in the portfolio
 */
export interface PortfolioAnomaly {
  id: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  termCategory: string;
  termName: string;
  documentId: string;
  documentName: string;
  value: string | number | null;
  expectedRange?: {
    min: number;
    max: number;
    portfolioAvg?: number;
    marketAvg?: number;
  };
  deviation?: number; // Percentage deviation from expected
  description: string;
  recommendation?: string;
}

/**
 * Term category for grouping related terms
 */
export type TermCategory =
  | 'financial_terms'
  | 'covenants'
  | 'key_dates'
  | 'parties'
  | 'interest_rates'
  | 'fees';

/**
 * Aggregated term across the portfolio
 */
export interface AggregatedTerm {
  termName: string;
  termCategory: TermCategory;
  dataType: 'currency' | 'percentage' | 'ratio' | 'date' | 'string' | 'number';
  values: DocumentTermValue[];
  statistics: {
    count: number;
    missingCount: number;
    min?: number;
    max?: number;
    mean?: number;
    median?: number;
    stdDev?: number;
    mode?: string | number;
  };
  marketBenchmark?: MarketBenchmark;
  anomalies: PortfolioAnomaly[];
  hasOutliers: boolean;
}

/**
 * Portfolio-level summary statistics
 */
export interface PortfolioSummary {
  totalDocuments: number;
  documentsByType: Record<string, number>;
  totalTermsAnalyzed: number;
  termsWithAnomalies: number;
  anomaliesBySeverity: {
    info: number;
    warning: number;
    critical: number;
  };
  anomaliesByType: Record<AnomalyType, number>;
  avgExtractionConfidence: number;
  lastAnalyzedAt: string;
}

/**
 * Filter options for portfolio comparison view
 */
export interface PortfolioComparisonFilters {
  selectedDocuments: string[]; // Empty means all
  termCategories: TermCategory[];
  showOnlyAnomalies: boolean;
  anomalySeverity: AnomalySeverity[];
  anomalyTypes: AnomalyType[];
  searchQuery: string;
}

/**
 * Complete portfolio comparison result
 */
export interface PortfolioComparisonResult {
  portfolioId: string;
  analyzedAt: string;
  documents: PortfolioDocument[];
  terms: AggregatedTerm[];
  anomalies: PortfolioAnomaly[];
  summary: PortfolioSummary;
  aiInsights?: string;
}

/**
 * Risk score breakdown for the portfolio
 */
export interface PortfolioRiskScore {
  overallScore: number; // 0-100, higher = more risk
  termConsistencyScore: number;
  marketAlignmentScore: number;
  coverageScore: number; // How complete are extractions
  breakdown: {
    category: TermCategory;
    score: number;
    contributingFactors: string[];
  }[];
}

/**
 * Term trend data over time (for historical analysis)
 */
export interface TermTrend {
  termName: string;
  dataPoints: {
    date: string;
    value: number;
    documentId: string;
  }[];
  trendDirection: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  changePercentage: number;
}

/**
 * Default filter state
 */
export const DEFAULT_PORTFOLIO_FILTERS: PortfolioComparisonFilters = {
  selectedDocuments: [],
  termCategories: ['financial_terms', 'covenants', 'key_dates', 'interest_rates', 'fees', 'parties'],
  showOnlyAnomalies: false,
  anomalySeverity: ['info', 'warning', 'critical'],
  anomalyTypes: ['unusual_value', 'missing_term', 'inconsistent_term', 'market_deviation', 'low_confidence', 'outlier'],
  searchQuery: '',
};

/**
 * Category display names and colors
 */
export const TERM_CATEGORY_CONFIG: Record<TermCategory, { label: string; color: string; bgColor: string }> = {
  financial_terms: { label: 'Financial Terms', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  covenants: { label: 'Covenants', color: 'text-purple-700', bgColor: 'bg-purple-50' },
  key_dates: { label: 'Key Dates', color: 'text-amber-700', bgColor: 'bg-amber-50' },
  parties: { label: 'Parties', color: 'text-green-700', bgColor: 'bg-green-50' },
  interest_rates: { label: 'Interest Rates', color: 'text-red-700', bgColor: 'bg-red-50' },
  fees: { label: 'Fees', color: 'text-cyan-700', bgColor: 'bg-cyan-50' },
};

/**
 * Anomaly severity configuration
 */
export const ANOMALY_SEVERITY_CONFIG: Record<AnomalySeverity, { label: string; color: string; bgColor: string; borderColor: string }> = {
  info: { label: 'Info', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  warning: { label: 'Warning', color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  critical: { label: 'Critical', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
};

/**
 * Anomaly type configuration
 */
export const ANOMALY_TYPE_CONFIG: Record<AnomalyType, { label: string; icon: string }> = {
  unusual_value: { label: 'Unusual Value', icon: 'AlertTriangle' },
  missing_term: { label: 'Missing Term', icon: 'FileQuestion' },
  inconsistent_term: { label: 'Inconsistent Term', icon: 'GitCompare' },
  market_deviation: { label: 'Market Deviation', icon: 'TrendingDown' },
  low_confidence: { label: 'Low Confidence', icon: 'AlertCircle' },
  outlier: { label: 'Statistical Outlier', icon: 'Zap' },
};
