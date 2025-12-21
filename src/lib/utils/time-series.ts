/**
 * Universal Temporal Tracking Pattern
 *
 * This module provides a unified time-series data model that can be used across
 * all ESG temporal data: margin history, KPI trends, allocation timelines, reports,
 * and deadlines.
 *
 * @module TimeSeries
 */

import {
  parseISO,
  isValid,
  format,
  differenceInDays,
  startOfQuarter,
  endOfQuarter,
  getQuarter,
  getYear,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isAfter,
  isBefore,
  isWithinInterval,
  compareAsc,
} from 'date-fns';

// ============================================
// Core Types
// ============================================

/**
 * Period granularity for time-series data
 */
export type PeriodGranularity = 'day' | 'week' | 'month' | 'quarter' | 'year';

/**
 * Trend direction derived from time-series analysis
 */
export type TrendDirection = 'improving' | 'stable' | 'declining';

/**
 * A single data point in a time series
 */
export interface TimeSeriesDataPoint<T = number> {
  /** ISO date string or period label (e.g., "Q1 2024") */
  period: string;
  /** The value at this point in time */
  value: T;
  /** Optional metadata for this data point */
  metadata?: Record<string, unknown>;
}

/**
 * Parsed period with start and end dates
 */
export interface ParsedPeriod {
  label: string;
  start: Date;
  end: Date;
  granularity: PeriodGranularity;
}

/**
 * Unified time-series container with metadata and utilities
 */
export interface TimeSeries<T = number> {
  /** Unique identifier for this series */
  id: string;
  /** Display name for the series */
  name: string;
  /** Unit of measurement (e.g., "bps", "%", "tCO2e") */
  unit: string;
  /** The granularity of data points */
  granularity: PeriodGranularity;
  /** Array of data points, sorted chronologically */
  dataPoints: TimeSeriesDataPoint<T>[];
  /** Optional baseline value for comparison */
  baseline?: T;
  /** Optional target value */
  target?: T;
  /** When this series was last updated */
  lastUpdated?: string;
}

/**
 * Trend analysis result
 */
export interface TrendAnalysis {
  direction: TrendDirection;
  /** Percentage change from first to last point */
  percentageChange: number;
  /** Absolute change from first to last point */
  absoluteChange: number;
  /** Average value across the series */
  average: number;
  /** Minimum value in the series */
  min: number;
  /** Maximum value in the series */
  max: number;
  /** Number of data points analyzed */
  dataPointCount: number;
  /** Whether the trend is consistent (no major reversals) */
  isConsistent: boolean;
}

/**
 * Aggregation result for grouped data
 */
export interface AggregatedData<T = number> {
  period: string;
  values: T[];
  sum: number;
  average: number;
  count: number;
}

// ============================================
// Period Parsing Utilities
// ============================================

const QUARTER_REGEX = /^Q([1-4])\s*(\d{4})$/i;
const YEAR_MONTH_REGEX = /^(\w+)\s*(\d{4})$/i;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}/;

/**
 * Parse a period string into structured date information
 *
 * Supported formats:
 * - "Q1 2024" -> Quarter
 * - "Jan 2024" or "January 2024" -> Month
 * - "2024-01-15" -> Day (ISO format)
 * - "2024" -> Year
 */
export function parsePeriod(period: string): ParsedPeriod | null {
  const trimmed = period.trim();

  // Try quarter format: "Q1 2024"
  const quarterMatch = trimmed.match(QUARTER_REGEX);
  if (quarterMatch) {
    const quarter = parseInt(quarterMatch[1], 10);
    const year = parseInt(quarterMatch[2], 10);
    const baseDate = new Date(year, (quarter - 1) * 3, 1);
    return {
      label: `Q${quarter} ${year}`,
      start: startOfQuarter(baseDate),
      end: endOfQuarter(baseDate),
      granularity: 'quarter',
    };
  }

  // Try ISO date format: "2024-01-15"
  if (ISO_DATE_REGEX.test(trimmed)) {
    const date = parseISO(trimmed);
    if (isValid(date)) {
      return {
        label: format(date, 'MMM d, yyyy'),
        start: date,
        end: date,
        granularity: 'day',
      };
    }
  }

  // Try year only: "2024"
  if (/^\d{4}$/.test(trimmed)) {
    const year = parseInt(trimmed, 10);
    const baseDate = new Date(year, 0, 1);
    return {
      label: trimmed,
      start: startOfYear(baseDate),
      end: endOfYear(baseDate),
      granularity: 'year',
    };
  }

  // Try month format: "Jan 2024" or "January 2024"
  const monthMatch = trimmed.match(YEAR_MONTH_REGEX);
  if (monthMatch) {
    const monthStr = monthMatch[1];
    const year = parseInt(monthMatch[2], 10);
    const monthDate = new Date(`${monthStr} 1, ${year}`);
    if (isValid(monthDate)) {
      return {
        label: format(monthDate, 'MMM yyyy'),
        start: startOfMonth(monthDate),
        end: endOfMonth(monthDate),
        granularity: 'month',
      };
    }
  }

  return null;
}

/**
 * Format a date into a period string based on granularity
 */
export function formatPeriod(date: Date | string, granularity: PeriodGranularity): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return 'Invalid Date';

  switch (granularity) {
    case 'day':
      return format(d, 'MMM d, yyyy');
    case 'week':
      return format(d, "'Week' w, yyyy");
    case 'month':
      return format(d, 'MMM yyyy');
    case 'quarter':
      return `Q${getQuarter(d)} ${getYear(d)}`;
    case 'year':
      return format(d, 'yyyy');
    default:
      return format(d, 'MMM d, yyyy');
  }
}

/**
 * Get the current period based on granularity
 */
export function getCurrentPeriod(granularity: PeriodGranularity): string {
  return formatPeriod(new Date(), granularity);
}

// ============================================
// Time Series Creation Utilities
// ============================================

/**
 * Create a new TimeSeries from an array of data points
 */
export function createTimeSeries<T = number>(
  id: string,
  name: string,
  unit: string,
  dataPoints: TimeSeriesDataPoint<T>[],
  options?: {
    granularity?: PeriodGranularity;
    baseline?: T;
    target?: T;
  }
): TimeSeries<T> {
  // Detect granularity from first data point if not provided
  let granularity = options?.granularity;
  if (!granularity && dataPoints.length > 0) {
    const parsed = parsePeriod(dataPoints[0].period);
    granularity = parsed?.granularity ?? 'quarter';
  }

  // Sort data points chronologically
  const sortedPoints = sortDataPoints(dataPoints);

  return {
    id,
    name,
    unit,
    granularity: granularity ?? 'quarter',
    dataPoints: sortedPoints,
    baseline: options?.baseline,
    target: options?.target,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Sort data points chronologically
 */
export function sortDataPoints<T>(dataPoints: TimeSeriesDataPoint<T>[]): TimeSeriesDataPoint<T>[] {
  return [...dataPoints].sort((a, b) => {
    const parsedA = parsePeriod(a.period);
    const parsedB = parsePeriod(b.period);
    if (!parsedA || !parsedB) return 0;
    return compareAsc(parsedA.start, parsedB.start);
  });
}

// ============================================
// Trend Analysis Utilities
// ============================================

/**
 * Analyze the trend of a numeric time series
 *
 * @param series - The time series to analyze
 * @param options - Analysis options
 * @returns Trend analysis result
 */
export function analyzeTrend(
  series: TimeSeries<number>,
  options?: {
    /** Whether lower values are better (e.g., emissions, injury rate) */
    lowerIsBetter?: boolean;
    /** Threshold for considering trend stable (percentage change) */
    stabilityThreshold?: number;
  }
): TrendAnalysis {
  const { lowerIsBetter = false, stabilityThreshold = 5 } = options ?? {};
  const points = series.dataPoints;

  if (points.length === 0) {
    return {
      direction: 'stable',
      percentageChange: 0,
      absoluteChange: 0,
      average: 0,
      min: 0,
      max: 0,
      dataPointCount: 0,
      isConsistent: true,
    };
  }

  const values = points.map((p) => p.value);
  const first = values[0];
  const last = values[values.length - 1];

  const absoluteChange = last - first;
  const percentageChange = first !== 0 ? ((last - first) / Math.abs(first)) * 100 : 0;

  const average = values.reduce((a, b) => a + b, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  // Determine direction
  let direction: TrendDirection = 'stable';
  if (Math.abs(percentageChange) > stabilityThreshold) {
    const isDecreasing = absoluteChange < 0;
    if (lowerIsBetter) {
      direction = isDecreasing ? 'improving' : 'declining';
    } else {
      direction = isDecreasing ? 'declining' : 'improving';
    }
  }

  // Check consistency (no major reversals)
  let isConsistent = true;
  if (points.length >= 3) {
    const expectedDirection = absoluteChange > 0 ? 1 : -1;
    let reversals = 0;
    for (let i = 1; i < values.length; i++) {
      const pointChange = values[i] - values[i - 1];
      if (pointChange !== 0 && Math.sign(pointChange) !== expectedDirection) {
        reversals++;
      }
    }
    isConsistent = reversals <= Math.floor(points.length / 3);
  }

  return {
    direction,
    percentageChange,
    absoluteChange,
    average,
    min,
    max,
    dataPointCount: points.length,
    isConsistent,
  };
}

/**
 * Calculate the projected value at a future period based on current trend
 */
export function projectValue(
  series: TimeSeries<number>,
  targetPeriod: string
): { projectedValue: number; confidence: 'high' | 'medium' | 'low' } | null {
  const points = series.dataPoints;
  if (points.length < 2) return null;

  const trend = analyzeTrend(series);
  const values = points.map((p) => p.value);

  // Simple linear projection
  const avgChange = trend.absoluteChange / (points.length - 1);

  // Count periods between last point and target
  const lastParsed = parsePeriod(points[points.length - 1].period);
  const targetParsed = parsePeriod(targetPeriod);

  if (!lastParsed || !targetParsed) return null;

  const daysDiff = differenceInDays(targetParsed.start, lastParsed.end);

  // Estimate periods based on granularity
  let periodsAhead = 0;
  switch (series.granularity) {
    case 'day':
      periodsAhead = daysDiff;
      break;
    case 'week':
      periodsAhead = Math.ceil(daysDiff / 7);
      break;
    case 'month':
      periodsAhead = Math.ceil(daysDiff / 30);
      break;
    case 'quarter':
      periodsAhead = Math.ceil(daysDiff / 90);
      break;
    case 'year':
      periodsAhead = Math.ceil(daysDiff / 365);
      break;
  }

  const projectedValue = values[values.length - 1] + avgChange * periodsAhead;

  // Determine confidence based on consistency and data points
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (trend.isConsistent && points.length >= 4) {
    confidence = 'high';
  } else if (trend.isConsistent || points.length >= 3) {
    confidence = 'medium';
  }

  return { projectedValue, confidence };
}

// ============================================
// Aggregation Utilities
// ============================================

/**
 * Aggregate data points by a target granularity
 */
export function aggregateByPeriod(
  dataPoints: TimeSeriesDataPoint<number>[],
  targetGranularity: PeriodGranularity
): AggregatedData[] {
  const groups = new Map<string, number[]>();

  for (const point of dataPoints) {
    const parsed = parsePeriod(point.period);
    if (!parsed) continue;

    const periodKey = formatPeriod(parsed.start, targetGranularity);
    const existing = groups.get(periodKey) || [];
    existing.push(point.value);
    groups.set(periodKey, existing);
  }

  const result: AggregatedData[] = [];
  for (const [period, values] of groups) {
    const sum = values.reduce((a, b) => a + b, 0);
    result.push({
      period,
      values,
      sum,
      average: sum / values.length,
      count: values.length,
    });
  }

  return result.sort((a, b) => {
    const pa = parsePeriod(a.period);
    const pb = parsePeriod(b.period);
    if (!pa || !pb) return 0;
    return compareAsc(pa.start, pb.start);
  });
}

/**
 * Filter data points within a date range
 */
export function filterByDateRange<T>(
  dataPoints: TimeSeriesDataPoint<T>[],
  startDate: Date | string,
  endDate: Date | string
): TimeSeriesDataPoint<T>[] {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;

  return dataPoints.filter((point) => {
    const parsed = parsePeriod(point.period);
    if (!parsed) return false;
    return isWithinInterval(parsed.start, { start, end });
  });
}

// ============================================
// Formatting Utilities
// ============================================

/**
 * Format a data point value for display
 */
export function formatValue(value: number, unit: string, options?: { decimals?: number }): string {
  const { decimals = 1 } = options ?? {};

  // Handle special units
  if (unit === '%') {
    return `${value.toFixed(decimals)}%`;
  }
  if (unit === 'bps') {
    return `${value > 0 ? '+' : ''}${value}bps`;
  }
  if (unit.toLowerCase().includes('usd') || unit === '$') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  // Large number abbreviations
  if (Math.abs(value) >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(decimals)}B ${unit}`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(decimals)}M ${unit}`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(decimals)}K ${unit}`;
  }

  return `${value.toFixed(decimals)} ${unit}`;
}

/**
 * Get days until a deadline, accounting for period end dates
 */
export function getDaysUntilPeriodEnd(period: string): number {
  const parsed = parsePeriod(period);
  if (!parsed) return 0;
  return differenceInDays(parsed.end, new Date());
}

/**
 * Check if a period has passed
 */
export function isPeriodPast(period: string): boolean {
  const parsed = parsePeriod(period);
  if (!parsed) return false;
  return isBefore(parsed.end, new Date());
}

/**
 * Check if a period is current (ongoing)
 */
export function isPeriodCurrent(period: string): boolean {
  const parsed = parsePeriod(period);
  if (!parsed) return false;
  const now = new Date();
  return isWithinInterval(now, { start: parsed.start, end: parsed.end });
}

/**
 * Check if a period is in the future
 */
export function isPeriodFuture(period: string): boolean {
  const parsed = parsePeriod(period);
  if (!parsed) return false;
  return isAfter(parsed.start, new Date());
}

// ============================================
// Cumulative Calculation Utilities
// ============================================

/**
 * Calculate cumulative values from a series of incremental changes
 * (e.g., margin adjustments that compound over time)
 */
export function calculateCumulative(
  dataPoints: TimeSeriesDataPoint<number>[]
): TimeSeriesDataPoint<number>[] {
  const sorted = sortDataPoints(dataPoints);
  let cumulative = 0;

  return sorted.map((point) => {
    cumulative += point.value;
    return {
      ...point,
      metadata: {
        ...point.metadata,
        incrementalValue: point.value,
        cumulativeValue: cumulative,
      },
    };
  });
}

/**
 * Get the running total at each point
 */
export function getRunningTotals(dataPoints: TimeSeriesDataPoint<number>[]): number[] {
  const sorted = sortDataPoints(dataPoints);
  let running = 0;
  return sorted.map((point) => {
    running += point.value;
    return running;
  });
}

// ============================================
// Comparison Utilities
// ============================================

/**
 * Compare two time series and find differences
 */
export function compareSeries(
  seriesA: TimeSeries<number>,
  seriesB: TimeSeries<number>
): {
  periods: string[];
  differences: Array<{ period: string; valueA: number; valueB: number; difference: number }>;
} {
  const periodsA = new Map(seriesA.dataPoints.map((p) => [p.period, p.value]));
  const periodsB = new Map(seriesB.dataPoints.map((p) => [p.period, p.value]));

  const allPeriods = new Set([...periodsA.keys(), ...periodsB.keys()]);
  const periods = Array.from(allPeriods).sort((a, b) => {
    const pa = parsePeriod(a);
    const pb = parsePeriod(b);
    if (!pa || !pb) return 0;
    return compareAsc(pa.start, pb.start);
  });

  const differences = periods.map((period) => ({
    period,
    valueA: periodsA.get(period) ?? 0,
    valueB: periodsB.get(period) ?? 0,
    difference: (periodsA.get(period) ?? 0) - (periodsB.get(period) ?? 0),
  }));

  return { periods, differences };
}

// ============================================
// Type Guards
// ============================================

export function isTimeSeriesDataPoint<T>(value: unknown): value is TimeSeriesDataPoint<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'period' in value &&
    'value' in value &&
    typeof (value as TimeSeriesDataPoint<T>).period === 'string'
  );
}

export function isTimeSeries<T>(value: unknown): value is TimeSeries<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'unit' in value &&
    'dataPoints' in value &&
    Array.isArray((value as TimeSeries<T>).dataPoints)
  );
}
