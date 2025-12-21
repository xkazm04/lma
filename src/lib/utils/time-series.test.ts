/**
 * Time Series Module Tests
 *
 * These tests serve as living documentation of time series data handling behavior.
 * They cover period parsing, trend analysis, and value formatting.
 *
 * DESIGN DECISIONS DOCUMENTED BY THESE TESTS:
 * 1. parsePeriod supports multiple formats: "Q1 2024", "Jan 2024", "2024-05-15", "2024"
 * 2. Invalid/unrecognized period strings return null (fail gracefully)
 * 3. createTimeSeries auto-sorts data points chronologically
 * 4. Granularity is inferred from the first data point's period format
 * 5. analyzeTrend uses first→last comparison for direction (not best fit)
 * 6. "lowerIsBetter" option inverts trend direction interpretation
 * 7. "stabilityThreshold" option marks small changes as "stable"
 * 8. formatValue abbreviates large numbers: K (thousands), M (millions), B (billions)
 * 9. Basis points (bps) are formatted with explicit +/- sign
 * 10. aggregateByPeriod calculates sum, count, and average per period
 * 11. compareSeries calculates point-by-point differences (A - B)
 * 12. Running totals preserve cumulative state including negative values
 */

import { describe, it, expect } from 'vitest';
import {
  parsePeriod,
  formatPeriod,
  createTimeSeries,
  analyzeTrend,
  projectValue,
  calculateCumulative,
  formatValue,
  getDaysUntilPeriodEnd,
  isPeriodPast,
  isPeriodCurrent,
  isPeriodFuture,
  aggregateByPeriod,
  filterByDateRange,
  sortDataPoints,
  compareSeries,
  getRunningTotals,
  type TimeSeriesDataPoint,
} from './time-series';

describe('parsePeriod', () => {
  it('parses quarter format correctly', () => {
    const result = parsePeriod('Q1 2024');
    expect(result).not.toBeNull();
    expect(result?.label).toBe('Q1 2024');
    expect(result?.granularity).toBe('quarter');
    expect(result?.start.getMonth()).toBe(0); // January
    expect(result?.end.getMonth()).toBe(2); // March
  });

  it('parses ISO date format correctly', () => {
    const result = parsePeriod('2024-05-15');
    expect(result).not.toBeNull();
    expect(result?.granularity).toBe('day');
    expect(result?.start.getDate()).toBe(15);
  });

  it('parses month format correctly', () => {
    const result = parsePeriod('Jan 2024');
    expect(result).not.toBeNull();
    expect(result?.granularity).toBe('month');
  });

  it('parses year format correctly', () => {
    const result = parsePeriod('2024');
    expect(result).not.toBeNull();
    expect(result?.granularity).toBe('year');
    expect(result?.label).toBe('2024');
  });

  it('returns null for invalid format', () => {
    expect(parsePeriod('invalid')).toBeNull();
  });
});

describe('formatPeriod', () => {
  it('formats date as quarter', () => {
    const result = formatPeriod(new Date(2024, 3, 15), 'quarter');
    expect(result).toBe('Q2 2024');
  });

  it('formats date as month', () => {
    const result = formatPeriod(new Date(2024, 0, 15), 'month');
    expect(result).toBe('Jan 2024');
  });
});

describe('createTimeSeries', () => {
  it('creates a time series with sorted data points', () => {
    const dataPoints: TimeSeriesDataPoint[] = [
      { period: 'Q3 2024', value: 10 },
      { period: 'Q1 2024', value: 5 },
      { period: 'Q2 2024', value: 8 },
    ];

    const series = createTimeSeries('test', 'Test Series', 'units', dataPoints);

    expect(series.id).toBe('test');
    expect(series.name).toBe('Test Series');
    expect(series.dataPoints.length).toBe(3);
    // Should be sorted chronologically
    expect(series.dataPoints[0].period).toBe('Q1 2024');
    expect(series.dataPoints[1].period).toBe('Q2 2024');
    expect(series.dataPoints[2].period).toBe('Q3 2024');
  });

  it('detects granularity from data points', () => {
    const series = createTimeSeries('test', 'Test', 'units', [
      { period: 'Q1 2024', value: 5 },
    ]);
    expect(series.granularity).toBe('quarter');
  });
});

describe('analyzeTrend', () => {
  it('detects improving trend when values increase', () => {
    const series = createTimeSeries('test', 'Test', 'units', [
      { period: 'Q1 2024', value: 10 },
      { period: 'Q2 2024', value: 15 },
      { period: 'Q3 2024', value: 20 },
    ]);

    const trend = analyzeTrend(series);
    expect(trend.direction).toBe('improving');
    expect(trend.percentageChange).toBe(100); // 10 to 20 = 100%
    expect(trend.average).toBe(15);
    expect(trend.min).toBe(10);
    expect(trend.max).toBe(20);
  });

  it('detects declining trend when values decrease', () => {
    const series = createTimeSeries('test', 'Test', 'units', [
      { period: 'Q1 2024', value: 20 },
      { period: 'Q2 2024', value: 15 },
      { period: 'Q3 2024', value: 10 },
    ]);

    const trend = analyzeTrend(series);
    expect(trend.direction).toBe('declining');
  });

  it('respects lowerIsBetter option', () => {
    const series = createTimeSeries('test', 'Test', 'units', [
      { period: 'Q1 2024', value: 20 },
      { period: 'Q2 2024', value: 15 },
      { period: 'Q3 2024', value: 10 },
    ]);

    const trend = analyzeTrend(series, { lowerIsBetter: true });
    expect(trend.direction).toBe('improving'); // Decreasing is good
  });

  it('detects stable trend for small changes', () => {
    const series = createTimeSeries('test', 'Test', 'units', [
      { period: 'Q1 2024', value: 100 },
      { period: 'Q2 2024', value: 101 },
      { period: 'Q3 2024', value: 102 },
    ]);

    const trend = analyzeTrend(series, { stabilityThreshold: 5 });
    expect(trend.direction).toBe('stable');
  });
});

describe('calculateCumulative', () => {
  it('calculates running totals correctly', () => {
    const dataPoints: TimeSeriesDataPoint[] = [
      { period: 'Q1 2024', value: -5 },
      { period: 'Q2 2024', value: -5 },
      { period: 'Q3 2024', value: 3 },
    ];

    const cumulative = calculateCumulative(dataPoints);

    expect(cumulative[0].metadata?.cumulativeValue).toBe(-5);
    expect(cumulative[1].metadata?.cumulativeValue).toBe(-10);
    expect(cumulative[2].metadata?.cumulativeValue).toBe(-7);
  });
});

describe('getRunningTotals', () => {
  it('returns array of running totals', () => {
    const dataPoints: TimeSeriesDataPoint[] = [
      { period: 'Q1 2024', value: 10 },
      { period: 'Q2 2024', value: 5 },
      { period: 'Q3 2024', value: -3 },
    ];

    const totals = getRunningTotals(dataPoints);

    expect(totals).toEqual([10, 15, 12]);
  });
});

describe('formatValue', () => {
  it('formats percentage values', () => {
    expect(formatValue(75.5, '%')).toBe('75.5%');
  });

  it('formats basis points with sign', () => {
    expect(formatValue(10, 'bps')).toBe('+10bps');
    expect(formatValue(-5, 'bps')).toBe('-5bps');
  });

  it('formats large numbers with abbreviations', () => {
    expect(formatValue(1500000000, 'tons')).toBe('1.5B tons');
    expect(formatValue(2500000, 'units')).toBe('2.5M units');
    expect(formatValue(1500, 'items')).toBe('1.5K items');
  });
});

describe('aggregateByPeriod', () => {
  it('aggregates data points by quarter', () => {
    const dataPoints: TimeSeriesDataPoint[] = [
      { period: '2024-01-15', value: 10 },
      { period: '2024-02-15', value: 20 },
      { period: '2024-04-15', value: 15 },
    ];

    const aggregated = aggregateByPeriod(dataPoints, 'quarter');

    expect(aggregated.length).toBe(2);
    expect(aggregated[0].count).toBe(2); // Q1 has 2 points
    expect(aggregated[0].sum).toBe(30);
    expect(aggregated[0].average).toBe(15);
  });
});

describe('compareSeries', () => {
  it('compares two series and finds differences', () => {
    const seriesA = createTimeSeries('a', 'Series A', 'units', [
      { period: 'Q1 2024', value: 10 },
      { period: 'Q2 2024', value: 20 },
    ]);

    const seriesB = createTimeSeries('b', 'Series B', 'units', [
      { period: 'Q1 2024', value: 15 },
      { period: 'Q2 2024', value: 18 },
    ]);

    const comparison = compareSeries(seriesA, seriesB);

    expect(comparison.periods.length).toBe(2);
    expect(comparison.differences[0].difference).toBe(-5); // 10 - 15
    expect(comparison.differences[1].difference).toBe(2); // 20 - 18
  });
});

describe('sortDataPoints', () => {
  it('sorts data points chronologically', () => {
    const dataPoints: TimeSeriesDataPoint[] = [
      { period: 'Q4 2024', value: 40 },
      { period: 'Q1 2024', value: 10 },
      { period: 'Q3 2024', value: 30 },
      { period: 'Q2 2024', value: 20 },
    ];

    const sorted = sortDataPoints(dataPoints);

    expect(sorted[0].value).toBe(10);
    expect(sorted[1].value).toBe(20);
    expect(sorted[2].value).toBe(30);
    expect(sorted[3].value).toBe(40);
  });
});
