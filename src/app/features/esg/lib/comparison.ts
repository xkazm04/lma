import type { ESGFacility, ESGFacilityDetail, ESGKPI, ESGRating, PerformanceStatus } from './types';

export type ComparisonResult = 'better' | 'worse' | 'equal' | 'neutral';

/**
 * Compare two numeric values where higher is better
 */
export function compareHigherIsBetter(a: number, b: number): ComparisonResult {
  if (a > b) return 'better';
  if (a < b) return 'worse';
  return 'equal';
}

/**
 * Compare two numeric values where lower is better (e.g., emissions, margin)
 */
export function compareLowerIsBetter(a: number, b: number): ComparisonResult {
  if (a < b) return 'better';
  if (a > b) return 'worse';
  return 'equal';
}

/**
 * Compare performance statuses
 */
export function compareStatus(a: PerformanceStatus, b: PerformanceStatus): ComparisonResult {
  const statusRank: Record<PerformanceStatus, number> = {
    on_track: 3,
    at_risk: 2,
    off_track: 1,
    pending: 0,
  };
  const rankA = statusRank[a];
  const rankB = statusRank[b];
  if (rankA > rankB) return 'better';
  if (rankA < rankB) return 'worse';
  return 'equal';
}

/**
 * Get the delta between two values
 */
export function getDelta(a: number, b: number): { value: number; percentage: number } {
  const value = a - b;
  const percentage = b !== 0 ? ((a - b) / b) * 100 : 0;
  return { value, percentage };
}

/**
 * Get the CSS classes for comparison highlighting
 */
export function getComparisonClass(result: ComparisonResult): string {
  switch (result) {
    case 'better':
      return 'bg-green-50 border-green-200 text-green-700';
    case 'worse':
      return 'bg-red-50 border-red-200 text-red-700';
    case 'equal':
      return 'bg-zinc-50 border-zinc-200 text-zinc-700';
    default:
      return '';
  }
}

/**
 * Get icon indicator for comparison result
 */
export function getComparisonIndicator(result: ComparisonResult): '↑' | '↓' | '=' | '' {
  switch (result) {
    case 'better':
      return '↑';
    case 'worse':
      return '↓';
    case 'equal':
      return '=';
    default:
      return '';
  }
}

export interface ComparisonMetric {
  label: string;
  getValue: (facility: ESGFacility | ESGFacilityDetail) => string | number;
  getRawValue: (facility: ESGFacility | ESGFacilityDetail) => number;
  compare: (a: number, b: number) => ComparisonResult;
  format?: (value: number) => string;
  unit?: string;
  category: 'financial' | 'performance' | 'targets' | 'margin';
}

export const facilityComparisonMetrics: ComparisonMetric[] = [
  {
    label: 'Commitment Amount',
    category: 'financial',
    getValue: (f) => f.commitment_amount,
    getRawValue: (f) => f.commitment_amount,
    compare: compareHigherIsBetter,
    unit: '$',
  },
  {
    label: 'Outstanding Amount',
    category: 'financial',
    getValue: (f) => f.outstanding_amount,
    getRawValue: (f) => f.outstanding_amount,
    compare: () => 'neutral',
    unit: '$',
  },
  {
    label: 'KPI Count',
    category: 'performance',
    getValue: (f) => f.kpi_count,
    getRawValue: (f) => f.kpi_count,
    compare: compareHigherIsBetter,
  },
  {
    label: 'Targets Achieved',
    category: 'targets',
    getValue: (f) => `${f.targets_achieved}/${f.targets_total}`,
    getRawValue: (f) => f.targets_total > 0 ? (f.targets_achieved / f.targets_total) * 100 : 0,
    compare: compareHigherIsBetter,
    unit: '%',
  },
  {
    label: 'Target Achievement Rate',
    category: 'targets',
    getValue: (f) => f.targets_total > 0 ? `${((f.targets_achieved / f.targets_total) * 100).toFixed(1)}%` : 'N/A',
    getRawValue: (f) => f.targets_total > 0 ? (f.targets_achieved / f.targets_total) * 100 : 0,
    compare: compareHigherIsBetter,
    unit: '%',
  },
  {
    label: 'Base Margin',
    category: 'margin',
    getValue: (f) => `${f.base_margin_bps}bps`,
    getRawValue: (f) => f.base_margin_bps,
    compare: compareLowerIsBetter,
    unit: 'bps',
  },
  {
    label: 'Current Margin',
    category: 'margin',
    getValue: (f) => `${f.current_margin_bps}bps`,
    getRawValue: (f) => f.current_margin_bps,
    compare: compareLowerIsBetter,
    unit: 'bps',
  },
  {
    label: 'Margin Adjustment',
    category: 'margin',
    getValue: (f) => `${f.margin_adjustment_bps > 0 ? '+' : ''}${f.margin_adjustment_bps}bps`,
    getRawValue: (f) => f.margin_adjustment_bps,
    compare: compareLowerIsBetter,
    unit: 'bps',
  },
  {
    label: 'Max Margin Adjustment',
    category: 'margin',
    getValue: (f) => `±${f.max_margin_adjustment_bps}bps`,
    getRawValue: (f) => f.max_margin_adjustment_bps,
    compare: () => 'neutral',
    unit: 'bps',
  },
];

/**
 * Find the best performer for a metric across multiple facilities
 */
export function findBestPerformer(
  facilities: (ESGFacility | ESGFacilityDetail)[],
  metric: ComparisonMetric
): string | null {
  if (facilities.length < 2) return null;

  let bestId: string | null = null;
  let bestValue: number | null = null;

  for (const facility of facilities) {
    const value = metric.getRawValue(facility);
    if (bestValue === null) {
      bestValue = value;
      bestId = facility.id;
    } else {
      const comparison = metric.compare(value, bestValue);
      if (comparison === 'better') {
        bestValue = value;
        bestId = facility.id;
      }
    }
  }

  return bestId;
}

/**
 * Compare facilities and return a map of which facility performs best on each metric
 */
export function compareFacilities(
  facilities: (ESGFacility | ESGFacilityDetail)[]
): Map<string, string | null> {
  const results = new Map<string, string | null>();

  for (const metric of facilityComparisonMetrics) {
    results.set(metric.label, findBestPerformer(facilities, metric));
  }

  return results;
}

/**
 * Get aggregated ESG ratings for comparison
 */
export function getAggregatedRatings(ratings: ESGRating[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const rating of ratings) {
    result[rating.provider.toLowerCase()] = rating.rating;
  }
  return result;
}

/**
 * Compare ESG ratings (higher letter grade = better, lower risk score = better)
 */
export function compareRating(a: string, b: string, provider: string): ComparisonResult {
  // For Sustainalytics, lower is better (risk score)
  if (provider.toLowerCase().includes('sustainalytics')) {
    const scoreA = parseFloat(a) || 100;
    const scoreB = parseFloat(b) || 100;
    return compareLowerIsBetter(scoreA, scoreB);
  }

  // For letter grades (MSCI, CDP), use letter comparison
  const gradeOrder = ['AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-', 'BBB+', 'BBB', 'BBB-', 'BB+', 'BB', 'BB-', 'B+', 'B', 'B-', 'CCC', 'CC', 'C', 'D'];
  const indexA = gradeOrder.indexOf(a.toUpperCase());
  const indexB = gradeOrder.indexOf(b.toUpperCase());

  if (indexA === -1 || indexB === -1) return 'neutral';
  return compareLowerIsBetter(indexA, indexB); // Lower index = higher grade = better
}
