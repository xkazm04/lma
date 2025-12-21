/**
 * Compliance Priority Engine Configuration
 *
 * Uses the generic PriorityEngine with compliance-specific factors:
 * - Obligation deadline proximity
 * - Covenant test deadlines
 * - Pending compliance events
 * - Waiver expirations
 * - Risk level escalation
 */

import {
  PriorityEngine,
  CommonFactors,
  type PriorityResult,
  type FactorExtractor,
} from '@/lib/utils/priority-engine';
import type { UpcomingItem, Covenant, Obligation } from './types';

/**
 * Compliance-specific prioritized types
 */
export interface PrioritizedComplianceItem {
  item: UpcomingItem;
  priority: PriorityResult;
}

export interface PrioritizedCovenant {
  item: Covenant;
  priority: PriorityResult;
}

export interface PrioritizedObligation {
  item: Obligation;
  priority: PriorityResult;
}

/**
 * Risk level factor for covenants
 */
const covenantRiskFactor: FactorExtractor<Covenant> = (covenant) => {
  // Higher risk for breached covenants
  if (covenant.status === 'breached') {
    return {
      score: 50,
      reason: {
        type: 'breach',
        label: 'Covenant breached',
        weight: 50,
      },
    };
  }

  // Check headroom percentage
  const headroom = covenant.latest_test?.headroom_percentage;
  if (headroom !== undefined) {
    if (headroom < 10) {
      return {
        score: 35,
        reason: {
          type: 'risk',
          label: `Only ${headroom.toFixed(1)}% headroom`,
          weight: 35,
        },
      };
    } else if (headroom < 20) {
      return {
        score: 20,
        reason: {
          type: 'risk',
          label: `${headroom.toFixed(1)}% headroom`,
          weight: 20,
        },
      };
    } else if (headroom < 30) {
      return {
        score: 10,
        reason: {
          type: 'risk',
          label: `${headroom.toFixed(1)}% headroom`,
          weight: 10,
        },
      };
    }
  }

  return { score: 0 };
};

/**
 * Waiver expiration factor
 */
const waiverExpirationFactor: FactorExtractor<Covenant> = (covenant) => {
  if (!covenant.waiver?.expiration_date) {
    return { score: 0 };
  }

  return CommonFactors.deadlineProximity(
    () => covenant.waiver!.expiration_date,
    {
      overdue: 45,
      today: 40,
      within3Days: 30,
      within7Days: 20,
    }
  )(covenant);
};

/**
 * Upcoming Item Priority Engine
 */
const createUpcomingItemPriorityEngine = () => {
  return new PriorityEngine<UpcomingItem>({
    factors: [
      // Factor 1: Deadline proximity
      CommonFactors.deadlineProximity(
        (item) => item.date,
        {
          overdue: 45,
          today: 40,
          within3Days: 30,
          within7Days: 20,
        }
      ),

      // Factor 2: Item status urgency
      (item) => {
        if (item.status === 'overdue') {
          return {
            score: 45,
            reason: {
              type: 'status',
              label: 'Overdue',
              weight: 45,
            },
          };
        } else if (item.status === 'pending') {
          return {
            score: 25,
            reason: {
              type: 'status',
              label: 'Pending action',
              weight: 25,
            },
          };
        }
        return { score: 0 };
      },

      // Factor 3: Item type priority
      (item) => {
        switch (item.type) {
          case 'waiver_expiration':
            return { score: 15 };
          case 'covenant_test':
            return { score: 12 };
          case 'compliance_event':
            return { score: 8 };
          case 'notification_due':
            return { score: 5 };
          default:
            return { score: 0 };
        }
      },
    ],

    actionSuggestionGenerator: (item, reasons) => {
      if (reasons.length === 0) {
        return 'Monitor compliance schedule';
      }

      const topReason = reasons[0];

      switch (topReason.type) {
        case 'deadline':
          if (topReason.label.includes('overdue')) {
            return 'Address overdue compliance item immediately';
          }
          return 'Prepare compliance deliverable';
        case 'status':
          if (item.status === 'overdue') {
            return 'Escalate to compliance officer';
          }
          return 'Complete pending compliance task';
        default:
          return 'Review compliance item';
      }
    },
  });
};

/**
 * Covenant Priority Engine
 */
const createCovenantPriorityEngine = () => {
  return new PriorityEngine<Covenant>({
    factors: [
      // Factor 1: Test deadline proximity
      CommonFactors.deadlineProximity(
        (covenant) => covenant.next_test_date,
        {
          overdue: 35,
          today: 30,
          within3Days: 25,
          within7Days: 15,
        }
      ),

      // Factor 2: Risk level (headroom/breach)
      covenantRiskFactor,

      // Factor 3: Waiver expiration
      waiverExpirationFactor,
    ],

    actionSuggestionGenerator: (covenant, reasons) => {
      if (reasons.length === 0) {
        return 'Monitor covenant compliance';
      }

      const topReason = reasons[0];

      switch (topReason.type) {
        case 'breach':
          return 'Initiate breach remediation or waiver request';
        case 'risk':
          if (covenant.latest_test?.headroom_percentage < 15) {
            return 'Prepare contingency plan and alert stakeholders';
          }
          return 'Monitor financial performance closely';
        case 'deadline':
          if (topReason.label.includes('waiver') || topReason.label.includes('Waiver')) {
            return 'Extend waiver or cure breach';
          }
          return 'Prepare covenant test calculation';
        default:
          return 'Review covenant status';
      }
    },
  });
};

/**
 * Obligation Priority Engine
 */
const createObligationPriorityEngine = () => {
  return new PriorityEngine<Obligation>({
    factors: [
      // Factor 1: Deadline proximity
      CommonFactors.deadlineProximity(
        (obligation) => obligation.upcoming_event.deadline_date,
        {
          overdue: 40,
          today: 35,
          within3Days: 28,
          within7Days: 18,
        }
      ),

      // Factor 2: Status urgency
      (obligation) => {
        if (obligation.upcoming_event.status === 'overdue') {
          return {
            score: 40,
            reason: {
              type: 'status',
              label: 'Overdue',
              weight: 40,
            },
          };
        } else if (obligation.upcoming_event.status === 'pending') {
          return {
            score: 22,
            reason: {
              type: 'status',
              label: 'Pending submission',
              weight: 22,
            },
          };
        }
        return { score: 0 };
      },

      // Factor 3: Frequency priority (more frequent = slightly higher priority)
      (obligation) => {
        switch (obligation.frequency) {
          case 'monthly':
            return { score: 5 };
          case 'quarterly':
            return { score: 3 };
          case 'annually':
            return { score: 1 };
          default:
            return { score: 0 };
        }
      },
    ],

    actionSuggestionGenerator: (obligation, reasons) => {
      if (reasons.length === 0) {
        return 'Monitor obligation calendar';
      }

      const topReason = reasons[0];

      switch (topReason.type) {
        case 'deadline':
          if (topReason.label.includes('overdue')) {
            return 'Submit overdue obligation immediately';
          }
          return 'Prepare and review obligation deliverable';
        case 'status':
          if (obligation.upcoming_event.status === 'overdue') {
            return 'Escalate overdue obligation';
          }
          return 'Complete pending obligation';
        default:
          return 'Review obligation requirements';
      }
    },
  });
};

// Singleton instances
const upcomingItemEngine = createUpcomingItemPriorityEngine();
const covenantEngine = createCovenantPriorityEngine();
const obligationEngine = createObligationPriorityEngine();

/**
 * Calculate priority for compliance items
 */
export function calculateUpcomingItemPriority(item: UpcomingItem): PriorityResult {
  return upcomingItemEngine.calculatePriority(item);
}

export function prioritizeUpcomingItems(items: UpcomingItem[]): PrioritizedComplianceItem[] {
  return upcomingItemEngine.prioritizeItems(items);
}

/**
 * Calculate priority for covenants
 */
export function calculateCovenantPriority(covenant: Covenant): PriorityResult {
  return covenantEngine.calculatePriority(covenant);
}

export function prioritizeCovenants(covenants: Covenant[]): PrioritizedCovenant[] {
  return covenantEngine.prioritizeItems(covenants);
}

/**
 * Calculate priority for obligations
 */
export function calculateObligationPriority(obligation: Obligation): PriorityResult {
  return obligationEngine.calculatePriority(obligation);
}

export function prioritizeObligations(obligations: Obligation[]): PrioritizedObligation[] {
  return obligationEngine.prioritizeItems(obligations);
}

/**
 * Get inbox stats from prioritized compliance items
 */
export function getComplianceInboxStats(items: PrioritizedComplianceItem[]) {
  return upcomingItemEngine.getStats(items);
}

export function getCovenantInboxStats(covenants: PrioritizedCovenant[]) {
  return covenantEngine.getStats(covenants);
}

export function getObligationInboxStats(obligations: PrioritizedObligation[]) {
  return obligationEngine.getStats(obligations);
}
