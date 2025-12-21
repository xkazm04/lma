/**
 * StatsProvider - A cross-cutting concern pattern for computed entity statistics
 *
 * This module provides a declarative, composable approach to computing stats for entities.
 * Instead of scattering useMemo hooks and inline calculations, stats become:
 * - Declarative: Define stats as configurations
 * - Composable: Combine multiple stat definitions
 * - Cacheable: Enable provider-level caching
 * - Testable: Pure functions with clear contracts
 */

import { useMemo } from 'react';

/**
 * A stat definition describes how to compute a single statistic
 */
export interface StatDefinition<TEntity, TValue = unknown> {
  /** Unique key for this stat */
  key: string;
  /** Function to compute the stat value */
  compute: (entity: TEntity, context?: Record<string, unknown>) => TValue;
  /** Optional dependencies for caching (default: entity reference) */
  dependencies?: (entity: TEntity) => unknown[];
  /** Optional formatter for display */
  format?: (value: TValue) => string;
}

/**
 * A collection of stat definitions for an entity type
 */
export interface StatsDefinition<TEntity> {
  definitions: StatDefinition<TEntity, any>[];
}

/**
 * Computed stats result
 */
export type ComputedStats<TEntity, TDef extends StatsDefinition<TEntity>> = {
  [K in TDef['definitions'][number]['key']]: Extract<
    TDef['definitions'][number],
    { key: K }
  >['compute'] extends (entity: TEntity, context?: any) => infer R
    ? R
    : never;
};

/**
 * Entity with computed stats attached
 */
export type WithStats<TEntity, TStats = Record<string, unknown>> = TEntity & {
  stats: TStats;
};

/**
 * Core function to compute stats for an entity
 */
export function computeStats<TEntity, TDef extends StatsDefinition<TEntity>>(
  entity: TEntity,
  definition: TDef,
  context?: Record<string, unknown>
): ComputedStats<TEntity, TDef> {
  const stats = {} as ComputedStats<TEntity, TDef>;

  for (const def of definition.definitions) {
    (stats as any)[def.key] = def.compute(entity, context);
  }

  return stats;
}

/**
 * Higher-order function to attach stats to an entity
 */
export function withStats<TEntity, TDef extends StatsDefinition<TEntity>>(
  entity: TEntity,
  definition: TDef,
  context?: Record<string, unknown>
): WithStats<TEntity, ComputedStats<TEntity, TDef>> {
  const stats = computeStats(entity, definition, context);
  return { ...entity, stats };
}

/**
 * Batch compute stats for multiple entities
 */
export function withStatsBatch<TEntity, TDef extends StatsDefinition<TEntity>>(
  entities: TEntity[],
  definition: TDef,
  context?: Record<string, unknown>
): WithStats<TEntity, ComputedStats<TEntity, TDef>>[] {
  return entities.map((entity) => withStats(entity, definition, context));
}

/**
 * React hook for computing stats with automatic memoization
 */
export function useStats<TEntity, TDef extends StatsDefinition<TEntity>>(
  entity: TEntity | null | undefined,
  definition: TDef,
  context?: Record<string, unknown>
): ComputedStats<TEntity, TDef> | null {
  return useMemo(() => {
    if (!entity) return null;
    return computeStats(entity, definition, context) as ComputedStats<TEntity, TDef>;
  }, [entity, definition, context]);
}

/**
 * React hook for batch computing stats with automatic memoization
 */
export function useStatsBatch<TEntity, TDef extends StatsDefinition<TEntity>>(
  entities: TEntity[],
  definition: TDef,
  context?: Record<string, unknown>
): WithStats<TEntity, ComputedStats<TEntity, TDef>>[] {
  return useMemo(() => {
    return withStatsBatch(entities, definition, context);
  }, [entities, definition, context]);
}

/**
 * Compose multiple stat definitions into one
 */
export function composeStats<TEntity>(
  ...definitions: StatsDefinition<TEntity>[]
): StatsDefinition<TEntity> {
  return {
    definitions: definitions.flatMap((def) => def.definitions),
  };
}

/**
 * Create a stat definition with type safety
 */
export function defineStats<TEntity>(
  definitions: StatDefinition<TEntity, any>[]
): StatsDefinition<TEntity> {
  return { definitions };
}

/**
 * Helper to create a single stat definition
 */
export function defineStat<TEntity, TValue = unknown>(
  key: string,
  compute: (entity: TEntity, context?: Record<string, unknown>) => TValue,
  options?: {
    dependencies?: (entity: TEntity) => unknown[];
    format?: (value: TValue) => string;
  }
): StatDefinition<TEntity, TValue> {
  return {
    key,
    compute,
    dependencies: options?.dependencies,
    format: options?.format,
  };
}
