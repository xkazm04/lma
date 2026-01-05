/**
 * Trading Priority Engine Configuration
 *
 * Uses the generic PriorityEngine with trading-specific factors:
 * - Settlement deadline proximity
 * - DD checklist completion
 * - Flagged items severity
 * - Open questions
 * - Consent status
 */

import {
  PriorityEngine,
  CommonFactors,
  type PriorityResult,
  type FactorExtractor,
} from '@/lib/utils/priority-engine';
import type { Trade, TradeDetail, DDChecklist, Settlement } from './types';

/**
 * Trading-specific prioritized types
 */
export interface PrioritizedTrade {
  item: Trade;
  priority: PriorityResult;
}

export interface PrioritizedTradeDetail {
  item: TradeDetail;
  priority: PriorityResult;
}

export interface PrioritizedSettlement {
  item: Settlement;
  priority: PriorityResult;
}

/**
 * Flagged items factor
 */
const flaggedItemsFactor: FactorExtractor<Trade> = (trade) => {
  if (trade.flagged_items === 0) return { score: 0 };

  if (trade.flagged_items >= 5) {
    return {
      score: 35,
      reason: {
        type: 'flagged_items',
        label: `${trade.flagged_items} items flagged`,
        weight: 35,
      },
    };
  } else if (trade.flagged_items >= 3) {
    return {
      score: 22,
      reason: {
        type: 'flagged_items',
        label: `${trade.flagged_items} items flagged`,
        weight: 22,
      },
    };
  } else if (trade.flagged_items > 0) {
    return {
      score: 12,
      reason: {
        type: 'flagged_items',
        label: `${trade.flagged_items} item${trade.flagged_items === 1 ? '' : 's'} flagged`,
        weight: 12,
      },
    };
  }

  return { score: 0 };
};

/**
 * Open questions factor
 */
const openQuestionsFactor: FactorExtractor<Trade> = (trade) => {
  if (trade.open_questions === 0) return { score: 0 };

  if (trade.open_questions >= 10) {
    return {
      score: 20,
      reason: {
        type: 'open_questions',
        label: `${trade.open_questions} open questions`,
        weight: 20,
      },
    };
  } else if (trade.open_questions >= 5) {
    return {
      score: 12,
      reason: {
        type: 'open_questions',
        label: `${trade.open_questions} open questions`,
        weight: 12,
      },
    };
  } else if (trade.open_questions > 0) {
    return {
      score: 5,
      reason: {
        type: 'open_questions',
        label: `${trade.open_questions} open question${trade.open_questions === 1 ? '' : 's'}`,
        weight: 5,
      },
    };
  }

  return { score: 0 };
};

/**
 * Consent status factor (for TradeDetail)
 */
const consentStatusFactor: FactorExtractor<TradeDetail> = (trade) => {
  if (!trade.consent_required) return { score: 0 };

  if (!trade.consent_received && trade.status === 'pending_consent') {
    return {
      score: 30,
      reason: {
        type: 'consent',
        label: 'Awaiting consent',
        weight: 30,
      },
    };
  }

  return { score: 0 };
};

/**
 * Trade Priority Engine
 */
const createTradePriorityEngine = () => {
  return new PriorityEngine<Trade>({
    factors: [
      // Factor 1: Settlement deadline proximity
      CommonFactors.deadlineProximity(
        (trade) => trade.settlement_date,
        {
          overdue: 50,
          today: 45,
          within3Days: 35,
          within7Days: 25,
        }
      ),

      // Factor 2: Flagged items
      flaggedItemsFactor,

      // Factor 3: Open questions
      openQuestionsFactor,

      // Factor 4: DD completion (only for in_due_diligence status)
      (trade) => {
        if (trade.status !== 'in_due_diligence') return { score: 0 };

        if (trade.dd_progress < 30) {
          return {
            score: 25,
            reason: {
              type: 'dd_progress',
              label: `Only ${trade.dd_progress}% DD complete`,
              weight: 25,
            },
          };
        } else if (trade.dd_progress < 60) {
          return {
            score: 12,
            reason: {
              type: 'dd_progress',
              label: `${trade.dd_progress}% DD complete`,
              weight: 12,
            },
          };
        }

        return { score: 0 };
      },

      // Factor 5: Trade status priority
      (trade) => {
        switch (trade.status) {
          case 'pending_settlement':
            return { score: 15 };
          case 'pending_consent':
            return { score: 12 };
          case 'in_due_diligence':
            return { score: 8 };
          case 'documentation':
            return { score: 5 };
          default:
            return { score: 0 };
        }
      },
    ],

    actionSuggestionGenerator: (trade, reasons) => {
      if (reasons.length === 0) {
        return 'Monitor trade progress';
      }

      const topReason = reasons[0];

      switch (topReason.type) {
        case 'deadline':
          if (topReason.label.includes('overdue')) {
            return 'Expedite settlement immediately';
          }
          return 'Prepare settlement documentation';
        case 'flagged_items':
          return 'Review and resolve flagged DD items';
        case 'open_questions':
          return 'Follow up on open questions with counterparty';
        case 'dd_progress':
          return 'Accelerate due diligence process';
        case 'consent':
          return 'Obtain consent from required parties';
        default:
          return 'Review trade status';
      }
    },
  });
};

/**
 * Trade Detail Priority Engine
 */
const createTradeDetailPriorityEngine = () => {
  return new PriorityEngine<TradeDetail>({
    factors: [
      // Factor 1: Settlement deadline proximity
      CommonFactors.deadlineProximity(
        (trade) => trade.settlement_date,
        {
          overdue: 50,
          today: 45,
          within3Days: 35,
          within7Days: 25,
        }
      ),

      // Factor 2: Flagged items
      (trade) => flaggedItemsFactor(trade),

      // Factor 3: Open questions
      (trade) => openQuestionsFactor(trade),

      // Factor 4: Consent status
      consentStatusFactor,

      // Factor 5: DD completion
      (trade) => {
        if (trade.status !== 'in_due_diligence') return { score: 0 };

        if (trade.dd_progress < 30) {
          return {
            score: 25,
            reason: {
              type: 'dd_progress',
              label: `Only ${trade.dd_progress}% DD complete`,
              weight: 25,
            },
          };
        } else if (trade.dd_progress < 60) {
          return {
            score: 12,
            reason: {
              type: 'dd_progress',
              label: `${trade.dd_progress}% DD complete`,
              weight: 12,
            },
          };
        }

        return { score: 0 };
      },
    ],

    actionSuggestionGenerator: (trade, reasons) => {
      if (reasons.length === 0) {
        return 'Monitor trade progress';
      }

      const topReason = reasons[0];

      switch (topReason.type) {
        case 'deadline':
          if (topReason.label.includes('overdue')) {
            return 'Expedite settlement immediately';
          }
          return 'Prepare settlement documentation';
        case 'flagged_items':
          return 'Review and resolve flagged DD items';
        case 'open_questions':
          return 'Follow up on open questions with counterparty';
        case 'dd_progress':
          return 'Accelerate due diligence process';
        case 'consent':
          return 'Obtain consent from required parties';
        default:
          return 'Review trade status';
      }
    },
  });
};

/**
 * Settlement Priority Engine
 */
const createSettlementPriorityEngine = () => {
  return new PriorityEngine<Settlement>({
    factors: [
      // Factor 1: Settlement date proximity
      CommonFactors.deadlineProximity(
        (settlement) => settlement.settlement_date,
        {
          overdue: 50,
          today: 45,
          within3Days: 35,
          within7Days: 25,
        }
      ),

      // Factor 2: Settlement amount (larger = higher priority)
      (settlement) => {
        if (settlement.amount >= 50000000) {
          return {
            score: 15,
            reason: {
              type: 'amount',
              label: 'Large settlement amount',
              weight: 15,
            },
          };
        } else if (settlement.amount >= 10000000) {
          return { score: 8 };
        } else if (settlement.amount >= 1000000) {
          return { score: 3 };
        }
        return { score: 0 };
      },
    ],

    actionSuggestionGenerator: (settlement, reasons) => {
      if (reasons.length === 0) {
        return 'Monitor settlement schedule';
      }

      const topReason = reasons[0];

      switch (topReason.type) {
        case 'deadline':
          if (topReason.label.includes('overdue')) {
            return 'Complete overdue settlement immediately';
          }
          return 'Prepare funds and finalize settlement';
        case 'amount':
          return 'Ensure funds availability for large settlement';
        default:
          return 'Review settlement requirements';
      }
    },
  });
};

// Singleton instances
const tradeEngine = createTradePriorityEngine();
const tradeDetailEngine = createTradeDetailPriorityEngine();
const settlementEngine = createSettlementPriorityEngine();

/**
 * Calculate priority for trades
 */
export function calculateTradePriority(trade: Trade): PriorityResult {
  return tradeEngine.calculatePriority(trade);
}

export function prioritizeTrades(trades: Trade[]): PrioritizedTrade[] {
  return tradeEngine.prioritizeItems(trades);
}

/**
 * Calculate priority for trade details
 */
export function calculateTradeDetailPriority(trade: TradeDetail): PriorityResult {
  return tradeDetailEngine.calculatePriority(trade);
}

export function prioritizeTradeDetails(trades: TradeDetail[]): PrioritizedTradeDetail[] {
  return tradeDetailEngine.prioritizeItems(trades);
}

/**
 * Calculate priority for settlements
 */
export function calculateSettlementPriority(settlement: Settlement): PriorityResult {
  return settlementEngine.calculatePriority(settlement);
}

export function prioritizeSettlements(settlements: Settlement[]): PrioritizedSettlement[] {
  return settlementEngine.prioritizeItems(settlements);
}

/**
 * Get inbox stats from prioritized trading items
 */
export function getTradeInboxStats(trades: PrioritizedTrade[]) {
  return tradeEngine.getStats(trades);
}

export function getTradeDetailInboxStats(trades: PrioritizedTradeDetail[]) {
  return tradeDetailEngine.getStats(trades);
}

export function getSettlementInboxStats(settlements: PrioritizedSettlement[]) {
  return settlementEngine.getStats(settlements);
}
