/**
 * Group-By Utility Tests
 *
 * These tests serve as living documentation of array grouping and aggregation utilities.
 * They cover common patterns used throughout the codebase for data organization.
 *
 * DESIGN DECISIONS DOCUMENTED BY THESE TESTS:
 * 1. groupBy groups items into arrays keyed by the keyFn result
 * 2. Empty arrays return empty objects (no errors, no undefined)
 * 3. Numeric keys work correctly (stored as string keys in JS objects)
 * 4. groupByWithTransform applies a transform to each item before grouping
 * 5. keyBy creates a lookup map (first item wins for duplicate keys)
 * 6. keyByWithTransform transforms values in the lookup map
 * 7. countBy returns occurrence counts per key
 * 8. sumBy aggregates a numeric field per key
 * 9. Zero values are included in sums (not treated as falsy)
 * 10. Negative values are supported in sums
 * 11. groupByWithLimit caps items per group (useful for "top N" scenarios)
 * 12. All utilities are pure functions (no mutation of input arrays)
 */

import { describe, it, expect } from 'vitest';
import {
  groupBy,
  groupByWithTransform,
  keyBy,
  keyByWithTransform,
  countBy,
  sumBy,
  groupByWithLimit,
} from './group-by';

describe('groupBy', () => {
  it('should group items by key', () => {
    const data = [
      { kpi_id: 'a', value: 1 },
      { kpi_id: 'a', value: 2 },
      { kpi_id: 'b', value: 3 },
    ];

    const result = groupBy(data, (item) => item.kpi_id);

    expect(result).toEqual({
      a: [
        { kpi_id: 'a', value: 1 },
        { kpi_id: 'a', value: 2 },
      ],
      b: [{ kpi_id: 'b', value: 3 }],
    });
  });

  it('should handle empty array', () => {
    const result = groupBy([] as { id: string }[], (item) => item.id);
    expect(result).toEqual({});
  });

  it('should handle single item', () => {
    const data = [{ id: 'a', name: 'Test' }];
    const result = groupBy(data, (item) => item.id);
    expect(result).toEqual({ a: [{ id: 'a', name: 'Test' }] });
  });

  it('should work with numeric keys', () => {
    const data = [
      { year: 2023, value: 100 },
      { year: 2023, value: 200 },
      { year: 2024, value: 300 },
    ];

    const result = groupBy(data, (item) => item.year);

    expect(result).toEqual({
      2023: [
        { year: 2023, value: 100 },
        { year: 2023, value: 200 },
      ],
      2024: [{ year: 2024, value: 300 }],
    });
  });
});

describe('groupByWithTransform', () => {
  it('should group and transform items', () => {
    const data = [
      { kpi_id: 'a', value: 10, date: '2024-01' },
      { kpi_id: 'a', value: 20, date: '2024-02' },
      { kpi_id: 'b', value: 30, date: '2024-01' },
    ];

    const result = groupByWithTransform(
      data,
      (item) => item.kpi_id,
      (item) => item.value
    );

    expect(result).toEqual({
      a: [10, 20],
      b: [30],
    });
  });

  it('should handle complex transformations', () => {
    const data = [
      { category: 'env', name: 'CO2', value: 100 },
      { category: 'env', name: 'Water', value: 200 },
    ];

    const result = groupByWithTransform(
      data,
      (item) => item.category,
      (item) => ({ name: item.name, value: item.value })
    );

    expect(result).toEqual({
      env: [
        { name: 'CO2', value: 100 },
        { name: 'Water', value: 200 },
      ],
    });
  });
});

describe('keyBy', () => {
  it('should create a lookup map', () => {
    const data = [
      { id: 'a', name: 'Facility A' },
      { id: 'b', name: 'Facility B' },
    ];

    const result = keyBy(data, (item) => item.id);

    expect(result).toEqual({
      a: { id: 'a', name: 'Facility A' },
      b: { id: 'b', name: 'Facility B' },
    });
  });

  it('should keep first item for duplicate keys', () => {
    const data = [
      { id: 'a', name: 'First' },
      { id: 'a', name: 'Second' },
    ];

    const result = keyBy(data, (item) => item.id);

    expect(result).toEqual({
      a: { id: 'a', name: 'First' },
    });
  });

  it('should handle empty array', () => {
    const result = keyBy([] as { id: string }[], (item) => item.id);
    expect(result).toEqual({});
  });
});

describe('keyByWithTransform', () => {
  it('should create a lookup map with transformed values', () => {
    const orgs = [
      { id: 'a', name: 'Org A', other: 123 },
      { id: 'b', name: 'Org B', other: 456 },
    ];

    const result = keyByWithTransform(
      orgs,
      (o) => o.id,
      (o) => o.name
    );

    expect(result).toEqual({
      a: 'Org A',
      b: 'Org B',
    });
  });

  it('should transform to complex objects', () => {
    const facilities = [
      { id: 'a', name: 'Facility A', borrower: 'Corp A', status: 'active' },
      { id: 'b', name: 'Facility B', borrower: 'Corp B', status: 'pending' },
    ];

    const result = keyByWithTransform(
      facilities,
      (f) => f.id,
      (f) => ({ name: f.name, borrower: f.borrower })
    );

    expect(result).toEqual({
      a: { name: 'Facility A', borrower: 'Corp A' },
      b: { name: 'Facility B', borrower: 'Corp B' },
    });
  });
});

describe('countBy', () => {
  it('should count occurrences by key', () => {
    const data = [
      { term_id: 'a' },
      { term_id: 'a' },
      { term_id: 'b' },
      { term_id: 'a' },
    ];

    const result = countBy(data, (item) => item.term_id);

    expect(result).toEqual({
      a: 3,
      b: 1,
    });
  });

  it('should handle empty array', () => {
    const result = countBy([] as { id: string }[], (item) => item.id);
    expect(result).toEqual({});
  });

  it('should work with derived keys', () => {
    const data = [
      { status: 'verified' },
      { status: 'verified' },
      { status: 'pending' },
      { status: 'flagged' },
    ];

    const result = countBy(data, (item) => item.status);

    expect(result).toEqual({
      verified: 2,
      pending: 1,
      flagged: 1,
    });
  });
});

describe('sumBy', () => {
  it('should sum values by key', () => {
    const data = [
      { category_id: 'a', amount: 100 },
      { category_id: 'a', amount: 200 },
      { category_id: 'b', amount: 50 },
    ];

    const result = sumBy(
      data,
      (item) => item.category_id,
      (item) => item.amount
    );

    expect(result).toEqual({
      a: 300,
      b: 50,
    });
  });

  it('should handle empty array', () => {
    const result = sumBy(
      [] as { id: string; value: number }[],
      (item) => item.id,
      (item) => item.value
    );
    expect(result).toEqual({});
  });

  it('should handle zero values', () => {
    const data = [
      { id: 'a', value: 0 },
      { id: 'a', value: 100 },
      { id: 'b', value: 0 },
    ];

    const result = sumBy(
      data,
      (item) => item.id,
      (item) => item.value
    );

    expect(result).toEqual({
      a: 100,
      b: 0,
    });
  });

  it('should handle negative values', () => {
    const data = [
      { id: 'a', value: 100 },
      { id: 'a', value: -30 },
    ];

    const result = sumBy(
      data,
      (item) => item.id,
      (item) => item.value
    );

    expect(result).toEqual({
      a: 70,
    });
  });
});

describe('groupByWithLimit', () => {
  it('should limit items per group', () => {
    const data = [
      { kpi_id: 'a', date: '2024-03' },
      { kpi_id: 'a', date: '2024-02' },
      { kpi_id: 'a', date: '2024-01' },
      { kpi_id: 'b', date: '2024-03' },
    ];

    const result = groupByWithLimit(data, (item) => item.kpi_id, 2);

    expect(result).toEqual({
      a: [
        { kpi_id: 'a', date: '2024-03' },
        { kpi_id: 'a', date: '2024-02' },
      ],
      b: [{ kpi_id: 'b', date: '2024-03' }],
    });
  });

  it('should handle limit greater than group size', () => {
    const data = [
      { id: 'a', value: 1 },
      { id: 'a', value: 2 },
    ];

    const result = groupByWithLimit(data, (item) => item.id, 10);

    expect(result).toEqual({
      a: [
        { id: 'a', value: 1 },
        { id: 'a', value: 2 },
      ],
    });
  });

  it('should handle limit of 1', () => {
    const data = [
      { id: 'a', value: 1 },
      { id: 'a', value: 2 },
      { id: 'b', value: 3 },
    ];

    const result = groupByWithLimit(data, (item) => item.id, 1);

    expect(result).toEqual({
      a: [{ id: 'a', value: 1 }],
      b: [{ id: 'b', value: 3 }],
    });
  });

  it('should handle empty array', () => {
    const result = groupByWithLimit([] as { id: string }[], (item) => item.id, 5);
    expect(result).toEqual({});
  });
});

// Integration test simulating real-world usage
describe('Real-world usage patterns', () => {
  it('should handle ESG targets by KPI pattern', () => {
    interface ESGTarget {
      kpi_id: string;
      target_year: number;
      target_value: number;
      target_status: string;
    }

    const targets: ESGTarget[] = [
      { kpi_id: 'kpi-1', target_year: 2024, target_value: 100, target_status: 'on_track' },
      { kpi_id: 'kpi-1', target_year: 2025, target_value: 80, target_status: 'pending' },
      { kpi_id: 'kpi-2', target_year: 2024, target_value: 50, target_status: 'achieved' },
    ];

    const targetsByKpi = groupBy(targets, (t) => t.kpi_id);

    expect(targetsByKpi['kpi-1']).toHaveLength(2);
    expect(targetsByKpi['kpi-2']).toHaveLength(1);
  });

  it('should handle organization name lookup pattern', () => {
    interface Org {
      id: string;
      name: string;
    }

    const orgs: Org[] = [
      { id: 'org-1', name: 'Acme Corp' },
      { id: 'org-2', name: 'Beta Inc' },
    ];

    const orgsMap = keyByWithTransform(
      orgs,
      (o) => o.id,
      (o) => o.name
    );

    expect(orgsMap['org-1']).toBe('Acme Corp');
    expect(orgsMap['org-2']).toBe('Beta Inc');
  });

  it('should handle allocation sums by category pattern', () => {
    interface Allocation {
      category_id: string;
      allocated_amount: number;
    }

    const allocations: Allocation[] = [
      { category_id: 'cat-1', allocated_amount: 1000000 },
      { category_id: 'cat-1', allocated_amount: 500000 },
      { category_id: 'cat-2', allocated_amount: 750000 },
    ];

    const totalByCategory = sumBy(
      allocations,
      (a) => a.category_id,
      (a) => a.allocated_amount
    );

    expect(totalByCategory['cat-1']).toBe(1500000);
    expect(totalByCategory['cat-2']).toBe(750000);
  });

  it('should handle recent performance with limit pattern', () => {
    interface Performance {
      kpi_id: string;
      reporting_period_end: string;
      actual_value: number;
    }

    // Pre-sorted by date descending
    const performances: Performance[] = [
      { kpi_id: 'kpi-1', reporting_period_end: '2024-03-31', actual_value: 95 },
      { kpi_id: 'kpi-1', reporting_period_end: '2024-02-28', actual_value: 92 },
      { kpi_id: 'kpi-1', reporting_period_end: '2024-01-31', actual_value: 88 },
      { kpi_id: 'kpi-1', reporting_period_end: '2023-12-31', actual_value: 85 },
      { kpi_id: 'kpi-1', reporting_period_end: '2023-11-30', actual_value: 82 },
      { kpi_id: 'kpi-1', reporting_period_end: '2023-10-31', actual_value: 80 },
    ];

    const recentByKpi = groupByWithLimit(performances, (p) => p.kpi_id, 5);

    expect(recentByKpi['kpi-1']).toHaveLength(5);
    expect(recentByKpi['kpi-1'][0].actual_value).toBe(95);
    expect(recentByKpi['kpi-1'][4].actual_value).toBe(82);
  });
});
