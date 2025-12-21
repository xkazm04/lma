/**
 * ESG Time Series Adapters
 *
 * This module provides adapter functions to convert existing ESG data types
 * to the unified TimeSeries format, enabling consistent temporal analysis
 * across margin history, KPI trends, allocations, and reports.
 *
 * @module ESGTimeSeriesAdapters
 */

import type {
  TimeSeries,
  TimeSeriesDataPoint,
  TrendAnalysis,
} from '@/lib/utils/time-series';
import {
  createTimeSeries,
  analyzeTrend,
  projectValue,
  calculateCumulative,
  formatValue,
  getDaysUntilPeriodEnd,
  isPeriodPast,
  parsePeriod,
  sortDataPoints,
} from '@/lib/utils/time-series';

import type {
  MarginHistory,
  ESGKPI,
  ESGFacilityDetail,
  AllocationProject,
  AllocationCategory,
  ESGReport,
  UpcomingDeadline,
  KPIPrediction,
  ESGTarget,
} from './types';

// ============================================
// Margin History Adapters
// ============================================

/**
 * Convert margin history to a time series of incremental adjustments
 */
export function marginHistoryToTimeSeries(
  facilityId: string,
  facilityName: string,
  marginHistory: MarginHistory[]
): TimeSeries<number> {
  const dataPoints: TimeSeriesDataPoint<number>[] = marginHistory.map((entry) => ({
    period: entry.period,
    value: entry.adjustment_bps,
    metadata: {
      cumulativeValue: entry.cumulative_bps,
    },
  }));

  return createTimeSeries(
    `margin-history-${facilityId}`,
    `${facilityName} - Margin Adjustments`,
    'bps',
    dataPoints,
    { granularity: 'quarter' }
  );
}

/**
 * Convert margin history to a cumulative time series
 */
export function marginHistoryToCumulativeSeries(
  facilityId: string,
  facilityName: string,
  marginHistory: MarginHistory[]
): TimeSeries<number> {
  const dataPoints: TimeSeriesDataPoint<number>[] = marginHistory.map((entry) => ({
    period: entry.period,
    value: entry.cumulative_bps,
    metadata: {
      incrementalValue: entry.adjustment_bps,
    },
  }));

  return createTimeSeries(
    `margin-history-cumulative-${facilityId}`,
    `${facilityName} - Cumulative Margin Impact`,
    'bps',
    dataPoints,
    { granularity: 'quarter' }
  );
}

/**
 * Analyze margin adjustment trend
 */
export function analyzeMarginTrend(marginHistory: MarginHistory[]): TrendAnalysis & {
  totalAdjustment: number;
  lastAdjustment: number;
  avgQuarterlyAdjustment: number;
} {
  const series = createTimeSeries(
    'margin-temp',
    'Margin Analysis',
    'bps',
    marginHistory.map((h) => ({ period: h.period, value: h.adjustment_bps })),
    { granularity: 'quarter' }
  );

  // For margin adjustments, lower (more negative) is better
  const trend = analyzeTrend(series, { lowerIsBetter: true });

  const totalAdjustment = marginHistory.reduce((sum, h) => sum + h.adjustment_bps, 0);
  const lastAdjustment = marginHistory.length > 0
    ? marginHistory[marginHistory.length - 1].adjustment_bps
    : 0;
  const avgQuarterlyAdjustment = marginHistory.length > 0
    ? totalAdjustment / marginHistory.length
    : 0;

  return {
    ...trend,
    totalAdjustment,
    lastAdjustment,
    avgQuarterlyAdjustment,
  };
}

// ============================================
// KPI Prediction Adapters
// ============================================

/**
 * Convert KPI historical data to a time series
 */
export function kpiHistoryToTimeSeries(kpi: KPIPrediction): TimeSeries<number> {
  const dataPoints: TimeSeriesDataPoint<number>[] = kpi.historical_data.map((entry) => ({
    period: entry.period,
    value: entry.value,
  }));

  return createTimeSeries(
    `kpi-history-${kpi.kpi_id}`,
    kpi.kpi_name,
    kpi.unit,
    dataPoints,
    {
      granularity: 'quarter',
      baseline: kpi.baseline_value,
      target: kpi.target_value,
    }
  );
}

/**
 * Analyze KPI trend and predict future performance
 */
export function analyzeKPITrend(kpi: KPIPrediction): TrendAnalysis & {
  projectedValue: number | null;
  confidence: 'high' | 'medium' | 'low';
  gapToTarget: number;
  gapPercentage: number;
  willLikelyMeetTarget: boolean;
} {
  const series = kpiHistoryToTimeSeries(kpi);

  // Determine if lower is better based on KPI category
  const lowerIsBetter = isLowerBetterKPI(kpi.kpi_category);
  const trend = analyzeTrend(series, { lowerIsBetter });

  // Project to target date
  const projection = projectValue(series, kpi.target_date);

  const gapToTarget = kpi.target_value - kpi.current_value;
  const gapPercentage = kpi.target_value !== 0
    ? (gapToTarget / kpi.target_value) * 100
    : 0;

  // Determine if target will be met
  const projectedValue = projection?.projectedValue ?? kpi.predicted_value;
  let willLikelyMeetTarget = false;
  if (lowerIsBetter) {
    willLikelyMeetTarget = projectedValue <= kpi.target_value;
  } else {
    willLikelyMeetTarget = projectedValue >= kpi.target_value;
  }

  return {
    ...trend,
    projectedValue: projection?.projectedValue ?? null,
    confidence: projection?.confidence ?? 'low',
    gapToTarget,
    gapPercentage,
    willLikelyMeetTarget,
  };
}

/**
 * Determine if a KPI category measures something where lower is better
 */
function isLowerBetterKPI(category: string): boolean {
  const lowerIsBetterCategories = [
    'environmental_emissions',
    'environmental_waste',
    'social_health_safety', // injury rates
  ];
  return lowerIsBetterCategories.includes(category);
}

/**
 * Convert ESGKPI targets to time series for visualization
 */
export function kpiTargetsToTimeSeries(kpi: ESGKPI): TimeSeries<number> {
  const dataPoints: TimeSeriesDataPoint<number>[] = kpi.targets.map((target) => ({
    period: target.target_year.toString(),
    value: target.target_value,
    metadata: {
      status: target.target_status,
      actual_value: target.actual_value,
    },
  }));

  // Add baseline as first point
  dataPoints.unshift({
    period: kpi.baseline_year.toString(),
    value: kpi.baseline_value,
    metadata: { isBaseline: true },
  });

  return createTimeSeries(
    `kpi-targets-${kpi.id}`,
    `${kpi.kpi_name} - Target Trajectory`,
    kpi.unit,
    dataPoints,
    {
      granularity: 'year',
      baseline: kpi.baseline_value,
    }
  );
}

// ============================================
// Allocation Project Adapters
// ============================================

/**
 * Convert allocation projects to a time series of fund deployments
 */
export function allocationProjectsToTimeSeries(
  categoryId: string,
  categoryName: string,
  projects: AllocationProject[]
): TimeSeries<number> {
  const dataPoints: TimeSeriesDataPoint<number>[] = projects.map((project) => ({
    period: project.date,
    value: project.amount,
    metadata: {
      projectId: project.id,
      projectName: project.project_name,
    },
  }));

  return createTimeSeries(
    `allocation-projects-${categoryId}`,
    `${categoryName} - Fund Deployment`,
    'USD',
    dataPoints,
    { granularity: 'day' }
  );
}

/**
 * Get cumulative allocation over time
 */
export function allocationsToCumulativeSeries(
  categoryId: string,
  categoryName: string,
  projects: AllocationProject[]
): TimeSeries<number> {
  const sorted = [...projects].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let cumulative = 0;
  const dataPoints: TimeSeriesDataPoint<number>[] = sorted.map((project) => {
    cumulative += project.amount;
    return {
      period: project.date,
      value: cumulative,
      metadata: {
        incrementalAmount: project.amount,
        projectName: project.project_name,
      },
    };
  });

  return createTimeSeries(
    `allocation-cumulative-${categoryId}`,
    `${categoryName} - Cumulative Allocation`,
    'USD',
    dataPoints,
    { granularity: 'day' }
  );
}

/**
 * Aggregate all allocations across categories for a facility
 */
export function facilityAllocationsToTimeSeries(
  facilityId: string,
  facilityName: string,
  categories: AllocationCategory[]
): TimeSeries<number> {
  const allProjects: TimeSeriesDataPoint<number>[] = [];

  for (const category of categories) {
    for (const project of category.projects) {
      allProjects.push({
        period: project.date,
        value: project.amount,
        metadata: {
          category: category.category_name,
          projectName: project.project_name,
        },
      });
    }
  }

  return createTimeSeries(
    `facility-allocations-${facilityId}`,
    `${facilityName} - All Allocations`,
    'USD',
    allProjects,
    { granularity: 'month' }
  );
}

// ============================================
// Report Adapters
// ============================================

/**
 * Convert ESG reports to a timeline
 */
export function reportsToTimeSeries(
  facilityId: string,
  reports: ESGReport[]
): TimeSeries<number> {
  // Use 1 for submitted/verified, 0 for draft/overdue
  const dataPoints: TimeSeriesDataPoint<number>[] = reports.map((report) => ({
    period: report.period_end,
    value: report.status === 'submitted' || report.status === 'verified' ? 1 : 0,
    metadata: {
      reportId: report.id,
      reportType: report.report_type,
      status: report.status,
      submittedAt: report.submitted_at,
    },
  }));

  return createTimeSeries(
    `reports-${facilityId}`,
    'Report Submission Timeline',
    'status',
    dataPoints,
    { granularity: 'quarter' }
  );
}

/**
 * Get report submission rate over time
 */
export function calculateReportSubmissionRate(reports: ESGReport[]): {
  totalReports: number;
  submittedOnTime: number;
  overdue: number;
  rate: number;
} {
  const total = reports.length;
  const submitted = reports.filter(
    (r) => r.status === 'submitted' || r.status === 'verified'
  ).length;
  const overdue = reports.filter((r) => r.status === 'overdue').length;

  return {
    totalReports: total,
    submittedOnTime: submitted,
    overdue,
    rate: total > 0 ? (submitted / total) * 100 : 0,
  };
}

// ============================================
// Deadline Adapters
// ============================================

/**
 * Convert upcoming deadlines to a timeline
 */
export function deadlinesToTimeSeries(deadlines: UpcomingDeadline[]): TimeSeries<number> {
  // Value is days until deadline (negative = overdue)
  const dataPoints: TimeSeriesDataPoint<number>[] = deadlines.map((deadline) => ({
    period: deadline.deadline,
    value: getDaysUntilPeriodEnd(deadline.deadline),
    metadata: {
      type: deadline.type,
      description: deadline.description,
      facilityId: deadline.facility_id,
      priority: deadline.priority,
    },
  }));

  return createTimeSeries(
    'upcoming-deadlines',
    'Upcoming Deadlines',
    'days',
    dataPoints,
    { granularity: 'day' }
  );
}

/**
 * Group deadlines by month for calendar view
 */
export function groupDeadlinesByMonth(
  deadlines: UpcomingDeadline[]
): Map<string, UpcomingDeadline[]> {
  const groups = new Map<string, UpcomingDeadline[]>();

  for (const deadline of deadlines) {
    const parsed = parsePeriod(deadline.deadline);
    if (!parsed) continue;

    const monthKey = `${parsed.start.getFullYear()}-${String(parsed.start.getMonth() + 1).padStart(2, '0')}`;
    const existing = groups.get(monthKey) || [];
    existing.push(deadline);
    groups.set(monthKey, existing);
  }

  return groups;
}

// ============================================
// Facility-Level Aggregation
// ============================================

/**
 * Create a comprehensive temporal summary for a facility
 */
export interface FacilityTemporalSummary {
  facilityId: string;
  facilityName: string;
  marginSeries: TimeSeries<number>;
  marginTrend: TrendAnalysis;
  kpiSeries: TimeSeries<number>[];
  allocationSeries: TimeSeries<number>;
  reportTimeline: TimeSeries<number>;
  upcomingDeadlineCount: number;
  nextDeadline: UpcomingDeadline | null;
}

export function createFacilityTemporalSummary(
  facility: ESGFacilityDetail,
  deadlines: UpcomingDeadline[]
): FacilityTemporalSummary {
  const marginSeries = marginHistoryToCumulativeSeries(
    facility.id,
    facility.facility_name,
    facility.margin_history
  );

  const marginTrend = analyzeMarginTrend(facility.margin_history);

  const kpiSeries = facility.kpis.map((kpi) => kpiTargetsToTimeSeries(kpi));

  const allocationSeries = createTimeSeries(
    `facility-${facility.id}-allocations`,
    'Allocations',
    'USD',
    [],
    { granularity: 'month' }
  );

  const reportTimeline = reportsToTimeSeries(facility.id, facility.reports);

  const facilityDeadlines = deadlines.filter((d) => d.facility_id === facility.id);
  const sortedDeadlines = facilityDeadlines.sort(
    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  );

  return {
    facilityId: facility.id,
    facilityName: facility.facility_name,
    marginSeries,
    marginTrend,
    kpiSeries,
    allocationSeries,
    reportTimeline,
    upcomingDeadlineCount: facilityDeadlines.length,
    nextDeadline: sortedDeadlines[0] || null,
  };
}

// ============================================
// Cross-Domain Query Utilities
// ============================================

/**
 * Find all ESG events in a specific quarter
 */
export interface ESGEvent {
  type: 'margin_adjustment' | 'allocation' | 'report' | 'deadline' | 'kpi_milestone';
  date: string;
  description: string;
  value?: number;
  unit?: string;
  facilityId?: string;
  metadata?: Record<string, unknown>;
}

export function getEventsInPeriod(
  period: string,
  facility: ESGFacilityDetail,
  deadlines: UpcomingDeadline[]
): ESGEvent[] {
  const parsed = parsePeriod(period);
  if (!parsed) return [];

  const events: ESGEvent[] = [];
  const { start, end } = parsed;

  // Margin adjustments
  for (const margin of facility.margin_history) {
    const marginParsed = parsePeriod(margin.period);
    if (!marginParsed) continue;
    if (marginParsed.start >= start && marginParsed.end <= end) {
      events.push({
        type: 'margin_adjustment',
        date: margin.period,
        description: `Margin adjusted by ${formatValue(margin.adjustment_bps, 'bps')}`,
        value: margin.adjustment_bps,
        unit: 'bps',
        facilityId: facility.id,
        metadata: { cumulative: margin.cumulative_bps },
      });
    }
  }

  // Reports
  for (const report of facility.reports) {
    const reportDate = new Date(report.period_end);
    if (reportDate >= start && reportDate <= end) {
      events.push({
        type: 'report',
        date: report.period_end,
        description: `${report.report_type} report - ${report.status}`,
        facilityId: facility.id,
        metadata: { reportId: report.id, status: report.status },
      });
    }
  }

  // Deadlines
  for (const deadline of deadlines.filter((d) => d.facility_id === facility.id)) {
    const deadlineDate = new Date(deadline.deadline);
    if (deadlineDate >= start && deadlineDate <= end) {
      events.push({
        type: 'deadline',
        date: deadline.deadline,
        description: deadline.description,
        facilityId: facility.id,
        metadata: { type: deadline.type, priority: deadline.priority },
      });
    }
  }

  // Sort by date
  return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// ============================================
// Chart Data Preparation
// ============================================

export interface ChartDataPoint {
  label: string;
  value: number;
  formattedValue: string;
  metadata?: Record<string, unknown>;
}

/**
 * Prepare time series data for charting
 */
export function prepareChartData(series: TimeSeries<number>): ChartDataPoint[] {
  return series.dataPoints.map((point) => {
    const parsed = parsePeriod(point.period);
    return {
      label: parsed?.label ?? point.period,
      value: point.value,
      formattedValue: formatValue(point.value, series.unit),
      metadata: point.metadata,
    };
  });
}

/**
 * Prepare data for a trend chart with target line
 */
export function prepareTrendChartData(
  series: TimeSeries<number>
): {
  data: ChartDataPoint[];
  baseline?: number;
  target?: number;
  trend: TrendAnalysis;
} {
  const data = prepareChartData(series);
  const trend = analyzeTrend(series);

  return {
    data,
    baseline: series.baseline as number | undefined,
    target: series.target as number | undefined,
    trend,
  };
}
