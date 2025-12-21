/**
 * Reusable utility functions for grouping and keying data.
 * These replace repeated reduce patterns across API routes.
 */

/**
 * Groups an array of items by a key derived from each item.
 * Items with the same key are collected into an array.
 *
 * @param data - Array of items to group
 * @param keyFn - Function that extracts the grouping key from each item
 * @returns Record mapping keys to arrays of items
 *
 * @example
 * ```typescript
 * const targets = [
 *   { kpi_id: 'a', value: 1 },
 *   { kpi_id: 'a', value: 2 },
 *   { kpi_id: 'b', value: 3 },
 * ];
 * const targetsByKpi = groupBy(targets, t => t.kpi_id);
 * // { 'a': [{ kpi_id: 'a', value: 1 }, { kpi_id: 'a', value: 2 }], 'b': [{ kpi_id: 'b', value: 3 }] }
 * ```
 */
export function groupBy<T, K extends string | number>(
  data: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return data.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

/**
 * Groups an array of items by a key, applying a transform to each item.
 * Items with the same key are collected into an array of transformed values.
 *
 * @param data - Array of items to group
 * @param keyFn - Function that extracts the grouping key from each item
 * @param valueFn - Function that transforms each item to the desired value
 * @returns Record mapping keys to arrays of transformed values
 *
 * @example
 * ```typescript
 * const performances = [
 *   { kpi_id: 'a', value: 10, date: '2024-01' },
 *   { kpi_id: 'a', value: 20, date: '2024-02' },
 * ];
 * const valuesByKpi = groupByWithTransform(performances, p => p.kpi_id, p => p.value);
 * // { 'a': [10, 20] }
 * ```
 */
export function groupByWithTransform<T, K extends string | number, V>(
  data: T[],
  keyFn: (item: T) => K,
  valueFn: (item: T) => V
): Record<K, V[]> {
  return data.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(valueFn(item));
    return acc;
  }, {} as Record<K, V[]>);
}

/**
 * Creates a lookup map from an array of items, keyed by a derived key.
 * If multiple items have the same key, the first item wins.
 *
 * @param data - Array of items to index
 * @param keyFn - Function that extracts the key from each item
 * @returns Record mapping keys to items
 *
 * @example
 * ```typescript
 * const facilities = [
 *   { id: 'a', name: 'Facility A' },
 *   { id: 'b', name: 'Facility B' },
 * ];
 * const facilitiesMap = keyBy(facilities, f => f.id);
 * // { 'a': { id: 'a', name: 'Facility A' }, 'b': { id: 'b', name: 'Facility B' } }
 * ```
 */
export function keyBy<T, K extends string | number>(
  data: T[],
  keyFn: (item: T) => K
): Record<K, T> {
  return data.reduce((acc, item) => {
    const key = keyFn(item);
    if (!(key in acc)) {
      acc[key] = item;
    }
    return acc;
  }, {} as Record<K, T>);
}

/**
 * Creates a lookup map from an array of items, keyed by a derived key.
 * Each value is transformed using the valueFn.
 * If multiple items have the same key, the first item wins.
 *
 * @param data - Array of items to index
 * @param keyFn - Function that extracts the key from each item
 * @param valueFn - Function that transforms each item to the desired value
 * @returns Record mapping keys to transformed values
 *
 * @example
 * ```typescript
 * const orgs = [
 *   { id: 'a', name: 'Org A' },
 *   { id: 'b', name: 'Org B' },
 * ];
 * const orgNames = keyByWithTransform(orgs, o => o.id, o => o.name);
 * // { 'a': 'Org A', 'b': 'Org B' }
 * ```
 */
export function keyByWithTransform<T, K extends string | number, V>(
  data: T[],
  keyFn: (item: T) => K,
  valueFn: (item: T) => V
): Record<K, V> {
  return data.reduce((acc, item) => {
    const key = keyFn(item);
    if (!(key in acc)) {
      acc[key] = valueFn(item);
    }
    return acc;
  }, {} as Record<K, V>);
}

/**
 * Counts occurrences of items grouped by a key.
 *
 * @param data - Array of items to count
 * @param keyFn - Function that extracts the grouping key from each item
 * @returns Record mapping keys to counts
 *
 * @example
 * ```typescript
 * const proposals = [
 *   { term_id: 'a' },
 *   { term_id: 'a' },
 *   { term_id: 'b' },
 * ];
 * const proposalCounts = countBy(proposals, p => p.term_id);
 * // { 'a': 2, 'b': 1 }
 * ```
 */
export function countBy<T, K extends string | number>(
  data: T[],
  keyFn: (item: T) => K
): Record<K, number> {
  return data.reduce((acc, item) => {
    const key = keyFn(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<K, number>);
}

/**
 * Sums numeric values grouped by a key.
 *
 * @param data - Array of items to sum
 * @param keyFn - Function that extracts the grouping key from each item
 * @param valueFn - Function that extracts the numeric value from each item
 * @returns Record mapping keys to sums
 *
 * @example
 * ```typescript
 * const allocations = [
 *   { category_id: 'a', amount: 100 },
 *   { category_id: 'a', amount: 200 },
 *   { category_id: 'b', amount: 50 },
 * ];
 * const totalsByCategory = sumBy(allocations, a => a.category_id, a => a.amount);
 * // { 'a': 300, 'b': 50 }
 * ```
 */
export function sumBy<T, K extends string | number>(
  data: T[],
  keyFn: (item: T) => K,
  valueFn: (item: T) => number
): Record<K, number> {
  return data.reduce((acc, item) => {
    const key = keyFn(item);
    acc[key] = (acc[key] || 0) + valueFn(item);
    return acc;
  }, {} as Record<K, number>);
}

/**
 * Groups items by key with a limit on items per group.
 * Useful for keeping only the first N items per group (e.g., recent performances).
 *
 * @param data - Array of items to group (should be pre-sorted if order matters)
 * @param keyFn - Function that extracts the grouping key from each item
 * @param limit - Maximum number of items per group
 * @returns Record mapping keys to limited arrays of items
 *
 * @example
 * ```typescript
 * const performances = [
 *   { kpi_id: 'a', date: '2024-03' },
 *   { kpi_id: 'a', date: '2024-02' },
 *   { kpi_id: 'a', date: '2024-01' },
 * ];
 * const recentByKpi = groupByWithLimit(performances, p => p.kpi_id, 2);
 * // { 'a': [{ kpi_id: 'a', date: '2024-03' }, { kpi_id: 'a', date: '2024-02' }] }
 * ```
 */
export function groupByWithLimit<T, K extends string | number>(
  data: T[],
  keyFn: (item: T) => K,
  limit: number
): Record<K, T[]> {
  return data.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) {
      acc[key] = [];
    }
    if (acc[key].length < limit) {
      acc[key].push(item);
    }
    return acc;
  }, {} as Record<K, T[]>);
}
