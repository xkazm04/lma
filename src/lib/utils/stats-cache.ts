/**
 * Stats Cache - Provider-level caching for computed statistics
 *
 * This module provides a caching layer for stats computation to avoid
 * unnecessary recalculations. It uses a simple Map-based cache with
 * configurable TTL and size limits.
 */

import type { StatsDefinition, ComputedStats } from './stats-provider';

export interface CacheConfig {
  /** Maximum number of cache entries (default: 1000) */
  maxSize?: number;
  /** Time-to-live in milliseconds (default: 5 minutes) */
  ttl?: number;
  /** Enable cache statistics tracking (default: false) */
  trackStats?: boolean;
}

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
}

/**
 * Stats cache with LRU eviction and TTL support
 */
export class StatsCache {
  private cache = new Map<string, CacheEntry<any>>();
  private config: Required<CacheConfig>;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0,
  };

  constructor(config: CacheConfig = {}) {
    this.config = {
      maxSize: config.maxSize ?? 1000,
      ttl: config.ttl ?? 5 * 60 * 1000, // 5 minutes
      trackStats: config.trackStats ?? false,
    };
  }

  /**
   * Generate cache key from entity ID and stat definition
   */
  private getCacheKey(entityId: string, definitionId: string): string {
    return `${entityId}::${definitionId}`;
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > this.config.ttl;
  }

  /**
   * Get cached stats or compute and cache them
   */
  get<TEntity, TDef extends StatsDefinition<TEntity>>(
    entityId: string,
    definition: TDef,
    compute: () => ComputedStats<TEntity, TDef>
  ): ComputedStats<TEntity, TDef> {
    const definitionId = this.getDefinitionId(definition);
    const key = this.getCacheKey(entityId, definitionId);
    const entry = this.cache.get(key);

    // Cache hit - return cached value if not expired
    if (entry && !this.isExpired(entry)) {
      entry.accessCount++;
      if (this.config.trackStats) this.stats.hits++;
      return entry.value;
    }

    // Cache miss - compute and cache
    if (this.config.trackStats) this.stats.misses++;
    const value = compute();
    this.set(key, value);
    return value;
  }

  /**
   * Set cache entry
   */
  private set(key: string, value: any): void {
    // Evict oldest entry if cache is full
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 1,
    });
    this.stats.size = this.cache.size;
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruAccessCount = Infinity;
    let lruTimestamp = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      // Remove expired entries first
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        if (this.config.trackStats) this.stats.evictions++;
        return;
      }

      // Find LRU entry
      if (
        entry.accessCount < lruAccessCount ||
        (entry.accessCount === lruAccessCount && entry.timestamp < lruTimestamp)
      ) {
        lruKey = key;
        lruAccessCount = entry.accessCount;
        lruTimestamp = entry.timestamp;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      if (this.config.trackStats) this.stats.evictions++;
    }
  }

  /**
   * Generate unique ID for stats definition
   */
  private getDefinitionId(definition: StatsDefinition<any>): string {
    return definition.definitions.map((d) => d.key).join(':');
  }

  /**
   * Invalidate cache for specific entity
   */
  invalidate(entityId: string, definitionId?: string): void {
    if (definitionId) {
      const key = this.getCacheKey(entityId, definitionId);
      this.cache.delete(key);
    } else {
      // Invalidate all entries for entity
      const prefix = `${entityId}::`;
      for (const key of this.cache.keys()) {
        if (key.startsWith(prefix)) {
          this.cache.delete(key);
        }
      }
    }
    this.stats.size = this.cache.size;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache hit rate
   */
  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total === 0 ? 0 : this.stats.hits / total;
  }
}

/**
 * Global stats cache instance
 */
let globalCache: StatsCache | null = null;

/**
 * Get or create global stats cache
 */
export function getStatsCache(config?: CacheConfig): StatsCache {
  if (!globalCache) {
    globalCache = new StatsCache(config);
  }
  return globalCache;
}

/**
 * Reset global stats cache
 */
export function resetStatsCache(): void {
  globalCache = null;
}
