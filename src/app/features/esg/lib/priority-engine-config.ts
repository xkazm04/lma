/**
 * ESG Priority Engine Configuration
 *
 * Uses the generic PriorityEngine with ESG-specific factors:
 * - Target deadline proximity
 * - At-risk KPIs
 * - Report due dates
 * - Margin impact exposure
 * - Performance status
 */

import {
  PriorityEngine,
  CommonFactors,
  type PriorityResult,
  type FactorExtractor,
} from '@/lib/utils/priority-engine';
import type { ESGKPI, ESGTarget, ESGReport, FacilityAtRisk, ESGFacility } from './types';

/**
 * ESG-specific prioritized types
 */
export interface PrioritizedESGKPI {
  item: ESGKPI;
  priority: PriorityResult;
}

export interface PrioritizedESGReport {
  item: ESGReport;
  priority: PriorityResult;
}

export interface PrioritizedFacilityAtRisk {
  item: FacilityAtRisk;
  priority: PriorityResult;
}

/**
 * KPI performance risk factor
 */
const kpiPerformanceRiskFactor: FactorExtractor<ESGKPI> = (kpi) => {
  if (!kpi.is_active) return { score: 0 };

  // Find current/latest target
  const currentTarget = kpi.targets.find(t => t.target_status !== 'achieved');

  if (!currentTarget) return { score: 0 };

  // Priority based on target status
  switch (currentTarget.target_status) {
    case 'off_track':
      return {
        score: 40,
        reason: {
          type: 'performance',
          label: 'KPI off track',
          weight: 40,
        },
      };
    case 'at_risk':
      return {
        score: 25,
        reason: {
          type: 'performance',
          label: 'KPI at risk',
          weight: 25,
        },
      };
    case 'missed':
      return {
        score: 50,
        reason: {
          type: 'performance',
          label: 'Target missed',
          weight: 50,
        },
      };
    default:
      return { score: 0 };
  }
};

/**
 * KPI weight/importance factor
 */
const kpiWeightFactor: FactorExtractor<ESGKPI> = (kpi) => {
  // Higher weight KPIs get higher priority
  if (kpi.weight >= 30) {
    return {
      score: 15,
      reason: {
        type: 'importance',
        label: `High impact KPI (${kpi.weight}% weight)`,
        weight: 15,
      },
    };
  } else if (kpi.weight >= 20) {
    return { score: 8 };
  } else if (kpi.weight >= 10) {
    return { score: 3 };
  }
  return { score: 0 };
};

/**
 * Report status urgency factor
 */
const reportStatusFactor: FactorExtractor<ESGReport> = (report) => {
  switch (report.status) {
    case 'overdue':
      return {
        score: 45,
        reason: {
          type: 'status',
          label: 'Report overdue',
          weight: 45,
        },
      };
    case 'draft':
      return {
        score: 20,
        reason: {
          type: 'status',
          label: 'Draft pending submission',
          weight: 20,
        },
      };
    default:
      return { score: 0 };
  }
};

/**
 * Margin impact factor for at-risk facilities
 */
const marginImpactFactor: FactorExtractor<FacilityAtRisk> = (facility) => {
  const impact = facility.margin_impact_bps;

  if (impact >= 20) {
    return {
      score: 35,
      reason: {
        type: 'margin_impact',
        label: `${impact} bps margin risk`,
        weight: 35,
      },
    };
  } else if (impact >= 10) {
    return {
      score: 20,
      reason: {
        type: 'margin_impact',
        label: `${impact} bps margin risk`,
        weight: 20,
      },
    };
  } else if (impact > 0) {
    return {
      score: 10,
      reason: {
        type: 'margin_impact',
        label: `${impact} bps margin risk`,
        weight: 10,
      },
    };
  }

  return { score: 0 };
};

/**
 * ESG KPI Priority Engine
 */
const createESGKPIPriorityEngine = () => {
  return new PriorityEngine<ESGKPI>({
    factors: [
      // Factor 1: Target deadline proximity
      (kpi) => {
        const currentTarget = kpi.targets.find(t => t.target_status !== 'achieved');
        if (!currentTarget) return { score: 0 };

        const targetDate = `${currentTarget.target_year}-12-31`; // End of target year
        return CommonFactors.deadlineProximity(
          () => targetDate,
          {
            overdue: 40,
            today: 35,
            within3Days: 0,
            within7Days: 0,
          }
        )(kpi);
      },

      // Factor 2: Performance risk
      kpiPerformanceRiskFactor,

      // Factor 3: KPI weight/importance
      kpiWeightFactor,
    ],

    actionSuggestionGenerator: (kpi, reasons) => {
      if (reasons.length === 0) {
        return 'Monitor KPI performance';
      }

      const topReason = reasons[0];

      switch (topReason.type) {
        case 'performance':
          if (topReason.label.includes('missed')) {
            return 'Initiate remediation plan and stakeholder communication';
          }
          if (topReason.label.includes('off track')) {
            return 'Implement corrective actions immediately';
          }
          return 'Review performance drivers and adjust strategy';
        case 'deadline':
          return 'Accelerate KPI initiatives to meet target';
        case 'importance':
          return 'Prioritize high-impact KPI monitoring';
        default:
          return 'Review KPI status';
      }
    },
  });
};

/**
 * ESG Report Priority Engine
 */
const createESGReportPriorityEngine = () => {
  return new PriorityEngine<ESGReport>({
    factors: [
      // Factor 1: Report period deadline
      CommonFactors.deadlineProximity(
        (report) => report.period_end,
        {
          overdue: 40,
          today: 35,
          within3Days: 28,
          within7Days: 18,
        }
      ),

      // Factor 2: Status urgency
      reportStatusFactor,

      // Factor 3: Report type priority
      (report) => {
        switch (report.report_type) {
          case 'annual':
            return { score: 10 };
          case 'semi_annual':
            return { score: 6 };
          case 'quarterly':
            return { score: 3 };
          default:
            return { score: 0 };
        }
      },
    ],

    actionSuggestionGenerator: (report, reasons) => {
      if (reasons.length === 0) {
        return 'Monitor reporting schedule';
      }

      const topReason = reasons[0];

      switch (topReason.type) {
        case 'deadline':
          if (topReason.label.includes('overdue')) {
            return 'Submit overdue report immediately';
          }
          return 'Finalize and submit report';
        case 'status':
          if (report.status === 'overdue') {
            return 'Escalate overdue report to management';
          }
          return 'Complete report draft and review';
        default:
          return 'Review report requirements';
      }
    },
  });
};

/**
 * At-Risk Facility Priority Engine
 */
const createAtRiskFacilityPriorityEngine = () => {
  return new PriorityEngine<FacilityAtRisk>({
    factors: [
      // Factor 1: Next deadline proximity
      CommonFactors.deadlineProximity(
        (facility) => facility.next_deadline,
        {
          overdue: 35,
          today: 30,
          within3Days: 25,
          within7Days: 15,
        }
      ),

      // Factor 2: Margin impact
      marginImpactFactor,

      // Factor 3: Number of at-risk KPIs
      (facility) => {
        if (facility.at_risk_kpis >= 5) {
          return {
            score: 30,
            reason: {
              type: 'risk_count',
              label: `${facility.at_risk_kpis} KPIs at risk`,
              weight: 30,
            },
          };
        } else if (facility.at_risk_kpis >= 3) {
          return {
            score: 18,
            reason: {
              type: 'risk_count',
              label: `${facility.at_risk_kpis} KPIs at risk`,
              weight: 18,
            },
          };
        } else if (facility.at_risk_kpis > 0) {
          return {
            score: 8,
            reason: {
              type: 'risk_count',
              label: `${facility.at_risk_kpis} KPI${facility.at_risk_kpis === 1 ? '' : 's'} at risk`,
              weight: 8,
            },
          };
        }
        return { score: 0 };
      },
    ],

    actionSuggestionGenerator: (facility, reasons) => {
      if (reasons.length === 0) {
        return 'Monitor facility performance';
      }

      const topReason = reasons[0];

      switch (topReason.type) {
        case 'margin_impact':
          return 'Implement mitigation strategies to avoid margin step-up';
        case 'risk_count':
          return 'Review multiple at-risk KPIs and develop action plan';
        case 'deadline':
          return 'Prepare performance documentation and engage with lender';
        default:
          return 'Review facility ESG status';
      }
    },
  });
};

// Singleton instances
const kpiEngine = createESGKPIPriorityEngine();
const reportEngine = createESGReportPriorityEngine();
const atRiskFacilityEngine = createAtRiskFacilityPriorityEngine();

/**
 * Calculate priority for ESG KPIs
 */
export function calculateESGKPIPriority(kpi: ESGKPI): PriorityResult {
  return kpiEngine.calculatePriority(kpi);
}

export function prioritizeESGKPIs(kpis: ESGKPI[]): PrioritizedESGKPI[] {
  return kpiEngine.prioritizeItems(kpis);
}

/**
 * Calculate priority for ESG reports
 */
export function calculateESGReportPriority(report: ESGReport): PriorityResult {
  return reportEngine.calculatePriority(report);
}

export function prioritizeESGReports(reports: ESGReport[]): PrioritizedESGReport[] {
  return reportEngine.prioritizeItems(reports);
}

/**
 * Calculate priority for at-risk facilities
 */
export function calculateAtRiskFacilityPriority(facility: FacilityAtRisk): PriorityResult {
  return atRiskFacilityEngine.calculatePriority(facility);
}

export function prioritizeAtRiskFacilities(facilities: FacilityAtRisk[]): PrioritizedFacilityAtRisk[] {
  return atRiskFacilityEngine.prioritizeItems(facilities);
}

/**
 * Get inbox stats from prioritized ESG items
 */
export function getESGKPIInboxStats(kpis: PrioritizedESGKPI[]) {
  return kpiEngine.getStats(kpis);
}

export function getESGReportInboxStats(reports: PrioritizedESGReport[]) {
  return reportEngine.getStats(reports);
}

export function getAtRiskFacilityInboxStats(facilities: PrioritizedFacilityAtRisk[]) {
  return atRiskFacilityEngine.getStats(facilities);
}
