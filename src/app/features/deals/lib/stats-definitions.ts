/**
 * Stats Definitions for Deals
 *
 * This module defines all stat computations for deal entities using the
 * StatsProvider pattern. Stats are declarative, composable, and cacheable.
 */

import { defineStats, defineStat, composeStats } from '@/lib/utils/stats-provider';
import type { Deal, DealStats, CategoryWithTerms } from './types';

/**
 * Basic deal stats definition
 */
export const basicDealStats = defineStats<Deal>([
  defineStat<Deal, number>(
    'total_terms',
    (deal, context) => {
      const categories = context?.categories as CategoryWithTerms[] | undefined;
      if (!categories) return 0;
      return categories
        .filter((cat) => cat.deal_id === deal.id)
        .reduce((sum, cat) => sum + cat.terms.length, 0);
    }
  ),

  defineStat<Deal, number>(
    'agreed_terms',
    (deal, context) => {
      const categories = context?.categories as CategoryWithTerms[] | undefined;
      if (!categories) return 0;
      return categories
        .filter((cat) => cat.deal_id === deal.id)
        .flatMap((cat) => cat.terms)
        .filter((term) => term.negotiation_status === 'agreed').length;
    }
  ),

  defineStat<Deal, number>(
    'pending_proposals',
    (deal, context) => {
      const categories = context?.categories as CategoryWithTerms[] | undefined;
      if (!categories) return 0;
      return categories
        .filter((cat) => cat.deal_id === deal.id)
        .flatMap((cat) => cat.terms)
        .reduce((sum, term) => sum + (term.pending_proposals_count || 0), 0);
    }
  ),

  defineStat<Deal, number>(
    'participant_count',
    (deal, context) => {
      const participants = context?.participants as any[] | undefined;
      if (!participants) return 0;
      return participants.filter(
        (p) => p.deal_id === deal.id && p.status === 'active'
      ).length;
    }
  ),
]);

/**
 * Deadline stats definition
 */
export const deadlineStats = defineStats<Deal>([
  defineStat(
    'deadline_stats',
    (deal, context) => {
      const categories = context?.categories as CategoryWithTerms[] | undefined;
      if (!categories) {
        return {
          total_with_deadlines: 0,
          overdue: 0,
          due_soon: 0,
          on_track: 0,
        };
      }

      const terms = categories
        .filter((cat) => cat.deal_id === deal.id)
        .flatMap((cat) => cat.terms)
        .filter((term) => term.deadline !== null);

      const now = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(now.getDate() + 7);

      let overdue = 0;
      let dueSoon = 0;
      let onTrack = 0;

      for (const term of terms) {
        if (!term.deadline) continue;
        const deadline = new Date(term.deadline);

        if (deadline < now) {
          overdue++;
        } else if (deadline <= sevenDaysFromNow) {
          dueSoon++;
        } else {
          onTrack++;
        }
      }

      return {
        total_with_deadlines: terms.length,
        overdue,
        due_soon: dueSoon,
        on_track: onTrack,
      };
    }
  ),
]);

/**
 * Progress stats definition
 */
export const progressStats = defineStats<Deal>([
  defineStat<Deal, number>(
    'progress_percentage',
    (deal, context) => {
      const categories = context?.categories as CategoryWithTerms[] | undefined;
      if (!categories) return 0;

      const terms = categories
        .filter((cat) => cat.deal_id === deal.id)
        .flatMap((cat) => cat.terms);

      const total = terms.length;
      const agreed = terms.filter((term) => term.negotiation_status === 'agreed').length;

      return total > 0 ? Math.round((agreed / total) * 100) : 0;
    },
    {
      format: (value) => `${value}%`,
    }
  ),

  defineStat<Deal, number>(
    'active_discussions',
    (deal, context) => {
      const categories = context?.categories as CategoryWithTerms[] | undefined;
      if (!categories) return 0;

      return categories
        .filter((cat) => cat.deal_id === deal.id)
        .flatMap((cat) => cat.terms)
        .filter(
          (term) =>
            term.negotiation_status === 'under_discussion' ||
            term.negotiation_status === 'proposed'
        ).length;
    }
  ),
]);

/**
 * Urgency stats definition
 */
export const urgencyStats = defineStats<Deal>([
  defineStat(
    'urgency_level',
    (deal) => {
      if (!deal.target_close_date) return null;
      if (deal.status !== 'active' && deal.status !== 'draft') return null;

      const now = new Date();
      const target = new Date(deal.target_close_date);
      const daysRemaining = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysRemaining < 0) {
        return { level: 'critical', daysRemaining, isOverdue: true, label: 'Overdue' };
      } else if (daysRemaining <= 3) {
        return {
          level: 'critical',
          daysRemaining,
          isOverdue: false,
          label: `${daysRemaining}d left`,
        };
      } else if (daysRemaining <= 7) {
        return {
          level: 'warning',
          daysRemaining,
          isOverdue: false,
          label: `${daysRemaining}d left`,
        };
      }

      return { level: null, daysRemaining, isOverdue: false, label: null };
    }
  ),
]);

/**
 * Complete deal stats definition (all stats combined)
 */
export const completeDealStats = composeStats(
  basicDealStats,
  deadlineStats,
  progressStats,
  urgencyStats
);

/**
 * Minimal stats for list views (performance optimized)
 */
export const minimalDealStats = composeStats(basicDealStats, urgencyStats);

/**
 * Type-safe helper to get DealStats shape from basic definition
 */
export type BasicDealStats = {
  total_terms: number;
  agreed_terms: number;
  pending_proposals: number;
  participant_count: number;
};

/**
 * Helper to transform computed stats to DealStats interface
 */
export function toDealStats(computed: BasicDealStats & Record<string, any>): DealStats {
  return {
    total_terms: computed.total_terms,
    agreed_terms: computed.agreed_terms,
    pending_proposals: computed.pending_proposals,
    participant_count: computed.participant_count,
    deadline_stats: computed.deadline_stats,
  };
}
