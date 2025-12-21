/**
 * Generic Priority Engine
 *
 * A domain-agnostic prioritization system that calculates weighted scores
 * based on configurable factors. Can be used across Documents, Compliance,
 * ESG, Trading, and Deals modules.
 *
 * Pattern: deadline proximity + pending items + staleness + progress
 */

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

export interface PriorityReason {
  type: string;
  label: string;
  weight: number;
}

export interface PriorityResult {
  score: number; // 0-100, higher = more urgent
  level: PriorityLevel;
  reasons: PriorityReason[];
  primaryReason: string;
  actionSuggestion: string;
}

export interface PrioritizedItem<T> {
  item: T;
  priority: PriorityResult;
}

/**
 * Factor extractor function - extracts a specific factor from an item
 */
export type FactorExtractor<T> = (item: T) => {
  score: number;
  reason?: PriorityReason;
};

/**
 * Action suggestion generator
 */
export type ActionSuggestionGenerator<T> = (
  item: T,
  reasons: PriorityReason[]
) => string;

/**
 * Priority engine configuration
 */
export interface PriorityEngineConfig<T> {
  factors: FactorExtractor<T>[];
  actionSuggestionGenerator?: ActionSuggestionGenerator<T>;
  levelThresholds?: {
    critical: number; // default: 50
    high: number;     // default: 30
    medium: number;   // default: 15
  };
}

/**
 * Generic Priority Engine
 */
export class PriorityEngine<T> {
  private config: Required<PriorityEngineConfig<T>>;

  constructor(config: PriorityEngineConfig<T>) {
    this.config = {
      ...config,
      levelThresholds: config.levelThresholds || {
        critical: 50,
        high: 30,
        medium: 15,
      },
      actionSuggestionGenerator:
        config.actionSuggestionGenerator || this.defaultActionSuggestion,
    };
  }

  /**
   * Calculate priority for a single item
   */
  calculatePriority(item: T): PriorityResult {
    let totalScore = 0;
    const reasons: PriorityReason[] = [];

    // Apply all factor extractors
    for (const extractor of this.config.factors) {
      const result = extractor(item);
      totalScore += result.score;

      if (result.reason) {
        reasons.push(result.reason);
      }
    }

    // Determine priority level
    const level = this.determinePriorityLevel(totalScore);

    // Sort reasons by weight to get primary reason
    const sortedReasons = [...reasons].sort((a, b) => b.weight - a.weight);
    const primaryReason = sortedReasons[0]?.label || 'On track';

    // Generate action suggestion
    const actionSuggestion = this.config.actionSuggestionGenerator(item, sortedReasons);

    return {
      score: Math.min(totalScore, 100),
      level,
      reasons,
      primaryReason,
      actionSuggestion,
    };
  }

  /**
   * Calculate priority for multiple items and sort by priority
   */
  prioritizeItems(items: T[]): PrioritizedItem<T>[] {
    return items
      .map(item => ({
        item,
        priority: this.calculatePriority(item),
      }))
      .sort((a, b) => b.priority.score - a.priority.score);
  }

  /**
   * Get stats from prioritized items
   */
  getStats(items: PrioritizedItem<T>[]) {
    return {
      total: items.length,
      critical: items.filter(i => i.priority.level === 'critical').length,
      high: items.filter(i => i.priority.level === 'high').length,
      medium: items.filter(i => i.priority.level === 'medium').length,
      low: items.filter(i => i.priority.level === 'low').length,
      requiresAction: items.filter(i => i.priority.score >= this.config.levelThresholds.high).length,
    };
  }

  /**
   * Determine priority level based on score
   */
  private determinePriorityLevel(score: number): PriorityLevel {
    if (score >= this.config.levelThresholds.critical) {
      return 'critical';
    } else if (score >= this.config.levelThresholds.high) {
      return 'high';
    } else if (score >= this.config.levelThresholds.medium) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Default action suggestion
   */
  private defaultActionSuggestion(item: T, reasons: PriorityReason[]): string {
    if (reasons.length === 0) {
      return 'Monitor progress';
    }
    return 'Review and take action';
  }
}

/**
 * Common factor extractors that can be reused across modules
 */
export const CommonFactors = {
  /**
   * Deadline proximity factor
   */
  deadlineProximity: <T>(
    dateExtractor: (item: T) => string | null,
    weights: {
      overdue: number;
      today: number;
      within3Days: number;
      within7Days: number;
    }
  ): FactorExtractor<T> => {
    return (item: T) => {
      const dateStr = dateExtractor(item);
      if (!dateStr) return { score: 0 };

      const daysUntil = getDaysUntilDate(dateStr);

      if (daysUntil < 0) {
        return {
          score: weights.overdue,
          reason: {
            type: 'deadline',
            label: `${Math.abs(daysUntil)} days overdue`,
            weight: weights.overdue,
          },
        };
      } else if (daysUntil === 0) {
        return {
          score: weights.today,
          reason: {
            type: 'deadline',
            label: 'Due today',
            weight: weights.today,
          },
        };
      } else if (daysUntil <= 3) {
        return {
          score: weights.within3Days,
          reason: {
            type: 'deadline',
            label: `Due in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`,
            weight: weights.within3Days,
          },
        };
      } else if (daysUntil <= 7) {
        return {
          score: weights.within7Days,
          reason: {
            type: 'deadline',
            label: `Due in ${daysUntil} days`,
            weight: weights.within7Days,
          },
        };
      }

      return { score: 0 };
    };
  },

  /**
   * Pending items factor
   */
  pendingItems: <T>(
    countExtractor: (item: T) => number,
    weights: {
      high: { threshold: number; score: number };
      medium: { threshold: number; score: number };
      low: { threshold: number; score: number };
    },
    itemLabel: string
  ): FactorExtractor<T> => {
    return (item: T) => {
      const count = countExtractor(item);

      if (count >= weights.high.threshold) {
        return {
          score: weights.high.score,
          reason: {
            type: 'pending_items',
            label: `${count} ${itemLabel} awaiting response`,
            weight: weights.high.score,
          },
        };
      } else if (count >= weights.medium.threshold) {
        return {
          score: weights.medium.score,
          reason: {
            type: 'pending_items',
            label: `${count} ${itemLabel} pending`,
            weight: weights.medium.score,
          },
        };
      } else if (count > 0) {
        return {
          score: weights.low.score,
          reason: {
            type: 'pending_items',
            label: `${count} ${itemLabel}${count === 1 ? '' : 's'} pending`,
            weight: weights.low.score,
          },
        };
      }

      return { score: 0 };
    };
  },

  /**
   * Staleness/inactivity factor
   */
  staleness: <T>(
    dateExtractor: (item: T) => string,
    thresholdDays: number,
    weight: number
  ): FactorExtractor<T> => {
    return (item: T) => {
      const dateStr = dateExtractor(item);
      const daysSince = getDaysSinceDate(dateStr);

      if (daysSince > thresholdDays) {
        return {
          score: weight,
          reason: {
            type: 'inactivity',
            label: `No activity for ${daysSince} days`,
            weight,
          },
        };
      }

      return { score: 0 };
    };
  },

  /**
   * Progress factor (low progress = higher priority)
   */
  lowProgress: <T>(
    progressExtractor: (item: T) => number, // 0-100
    threshold: number, // e.g., 25 for 25%
    weight: number
  ): FactorExtractor<T> => {
    return (item: T) => {
      const progress = progressExtractor(item);

      if (progress < threshold) {
        return {
          score: weight,
          reason: {
            type: 'progress',
            label: `Only ${Math.round(progress)}% progress`,
            weight,
          },
        };
      }

      return { score: 0 };
    };
  },
};

/**
 * Helper: Calculate days until a future date
 */
function getDaysUntilDate(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();

  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffMs = targetDay.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Helper: Calculate days since a past date
 */
function getDaysSinceDate(dateStr: string): number {
  const lastUpdate = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - lastUpdate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
