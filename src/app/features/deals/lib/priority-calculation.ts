/**
 * Smart Deal Inbox - AI Priority Calculation
 *
 * Uses the generic PriorityEngine with deal-specific configuration:
 * - Deadline proximity
 * - Stalled negotiations
 * - Pending proposals awaiting response
 * - Participant inactivity
 */

import type { DealWithStats } from './types';
import {
  PriorityEngine,
  CommonFactors,
  type PriorityLevel,
  type PriorityReason,
  type PriorityResult,
  type FactorExtractor,
} from '@/lib/utils/priority-engine';

export type { PriorityLevel, PriorityReason };

export interface DealPriority extends PriorityResult {}

export interface PrioritizedDeal extends DealWithStats {
  priority: DealPriority;
}

/**
 * Deal-specific factor extractors
 */

/**
 * Stalled negotiation factor
 */
const stalledNegotiationFactor: FactorExtractor<DealWithStats> = (deal) => {
  // Consider stalled if:
  // 1. Deal is active
  // 2. Has terms but progress < 50%
  // 3. No updates in more than 5 days
  if (deal.status !== 'active') return { score: 0 };

  const progress = deal.stats?.total_terms
    ? (deal.stats.agreed_terms / deal.stats.total_terms) * 100
    : 0;

  const lastUpdate = new Date(deal.updated_at);
  const now = new Date();
  const daysSinceUpdate = Math.floor(
    (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (progress < 50 && daysSinceUpdate > 5) {
    return {
      score: 18,
      reason: {
        type: 'stalled',
        label: 'Negotiation appears stalled',
        weight: 18,
      },
    };
  }

  return { score: 0 };
};

/**
 * Status-based modifiers
 */
const statusModifierFactor: FactorExtractor<DealWithStats> = (deal) => {
  // Paused deals get lower priority but still tracked
  if (deal.status === 'paused') {
    return {
      score: 0, // Will be handled in post-processing
      reason: {
        type: 'stalled',
        label: 'Deal is paused',
        weight: 0,
      },
    };
  }

  return { score: 0 };
};

/**
 * Create Deal Priority Engine with domain-specific factors
 */
const createDealPriorityEngine = () => {
  return new PriorityEngine<DealWithStats>({
    factors: [
      // Factor 1: Deadline proximity
      CommonFactors.deadlineProximity(
        (deal) => deal.target_close_date,
        {
          overdue: 40,
          today: 35,
          within3Days: 25,
          within7Days: 15,
        }
      ),

      // Factor 2: Pending proposals
      CommonFactors.pendingItems(
        (deal) => deal.stats?.pending_proposals || 0,
        {
          high: { threshold: 5, score: 20 },
          medium: { threshold: 3, score: 12 },
          low: { threshold: 1, score: 5 },
        },
        'proposals'
      ),

      // Factor 3: Stalled negotiation (custom)
      stalledNegotiationFactor,

      // Factor 4: Low progress on active deals
      (deal) => {
        if (deal.status !== 'active') return { score: 0 };

        const progress = deal.stats?.total_terms
          ? (deal.stats.agreed_terms / deal.stats.total_terms) * 100
          : 0;

        if (progress < 25 && deal.stats && deal.stats.total_terms > 0) {
          return {
            score: 10,
            reason: {
              type: 'progress',
              label: `Only ${Math.round(progress)}% progress`,
              weight: 10,
            },
          };
        }

        return { score: 0 };
      },

      // Factor 5: Participant inactivity
      (deal) => {
        if (deal.status !== 'active') return { score: 0 };
        return CommonFactors.staleness<typeof deal>(
          (d) => d.updated_at,
          7,
          15
        )(deal);
      },

      // Factor 6: Status modifiers
      statusModifierFactor,
    ],

    actionSuggestionGenerator: (deal, reasons) => {
      if (reasons.length === 0) {
        return 'Monitor progress';
      }

      const topReason = reasons[0];

      switch (topReason.type) {
        case 'deadline':
          if (topReason.label.includes('overdue')) {
            return 'Escalate or request deadline extension';
          }
          return 'Review outstanding items and expedite';
        case 'pending_items':
          return 'Review and respond to proposals';
        case 'stalled':
          return 'Schedule follow-up with counterparties';
        case 'inactivity':
          return 'Send reminder to participants';
        case 'progress':
          return 'Identify blockers and accelerate negotiations';
        default:
          return 'Review deal status';
      }
    },
  });
};

// Singleton instance
const dealPriorityEngine = createDealPriorityEngine();

/**
 * Calculate priority score for a single deal
 */
export function calculateDealPriority(deal: DealWithStats): DealPriority {
  // Skip calculation for non-active deals (except drafts needing attention)
  if (deal.status === 'agreed' || deal.status === 'closed' || deal.status === 'terminated') {
    return {
      score: 0,
      level: 'low',
      reasons: [],
      primaryReason: 'Deal completed',
      actionSuggestion: 'No action needed',
    };
  }

  let priority = dealPriorityEngine.calculatePriority(deal);

  // Post-processing: Paused deals get lower priority but still tracked
  if (deal.status === 'paused') {
    priority = {
      ...priority,
      score: Math.max(priority.score * 0.5, 10),
    };
  }

  return priority;
}

/**
 * Calculate priority for all deals and sort by priority
 */
export function prioritizeDeals(deals: DealWithStats[]): PrioritizedDeal[] {
  const prioritized = deals.map(deal => ({
    ...deal,
    priority: calculateDealPriority(deal),
  }));

  // Sort by priority score, then by pending proposals, then by updated date
  return prioritized.sort((a, b) => {
    // First sort by priority score (descending)
    if (b.priority.score !== a.priority.score) {
      return b.priority.score - a.priority.score;
    }
    // Then by pending proposals
    const aPending = a.stats?.pending_proposals || 0;
    const bPending = b.stats?.pending_proposals || 0;
    if (bPending !== aPending) {
      return bPending - aPending;
    }
    // Then by updated date (most recent first)
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
}

/**
 * Get inbox stats from prioritized deals
 */
export function getInboxStats(deals: PrioritizedDeal[]) {
  return {
    total: deals.length,
    critical: deals.filter(d => d.priority.level === 'critical').length,
    high: deals.filter(d => d.priority.level === 'high').length,
    medium: deals.filter(d => d.priority.level === 'medium').length,
    low: deals.filter(d => d.priority.level === 'low').length,
    requiresAction: deals.filter(d => d.priority.score >= 30).length,
    pendingProposalsTotal: deals.reduce((acc, d) => acc + (d.stats?.pending_proposals || 0), 0),
  };
}

/**
 * Triage action types for quick actions
 */
export type TriageAction =
  | 'respond_proposals'
  | 'schedule_followup'
  | 'request_extension'
  | 'escalate'
  | 'mark_reviewed'
  | 'snooze_24h'
  | 'snooze_7d';

export interface TriageActionConfig {
  id: TriageAction;
  label: string;
  shortLabel: string;
  icon: string;
  keyboard: string;
  description: string;
}

export const TRIAGE_ACTIONS: TriageActionConfig[] = [
  {
    id: 'respond_proposals',
    label: 'Respond to Proposals',
    shortLabel: 'Respond',
    icon: 'MessageSquare',
    keyboard: 'r',
    description: 'Open deal to respond to pending proposals',
  },
  {
    id: 'schedule_followup',
    label: 'Schedule Follow-up',
    shortLabel: 'Follow-up',
    icon: 'Calendar',
    keyboard: 'f',
    description: 'Schedule a follow-up meeting or reminder',
  },
  {
    id: 'request_extension',
    label: 'Request Extension',
    shortLabel: 'Extend',
    icon: 'Clock',
    keyboard: 'x',
    description: 'Request deadline extension',
  },
  {
    id: 'escalate',
    label: 'Escalate',
    shortLabel: 'Escalate',
    icon: 'AlertTriangle',
    keyboard: 'e',
    description: 'Escalate to senior management',
  },
  {
    id: 'mark_reviewed',
    label: 'Mark as Reviewed',
    shortLabel: 'Done',
    icon: 'Check',
    keyboard: 'd',
    description: 'Mark deal as reviewed for today',
  },
  {
    id: 'snooze_24h',
    label: 'Snooze 24 Hours',
    shortLabel: '24h',
    icon: 'BellOff',
    keyboard: 's',
    description: 'Snooze notifications for 24 hours',
  },
  {
    id: 'snooze_7d',
    label: 'Snooze 7 Days',
    shortLabel: '7d',
    icon: 'BellOff',
    keyboard: 'w',
    description: 'Snooze notifications for 7 days',
  },
];
