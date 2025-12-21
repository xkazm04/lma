import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import type {
  DashboardStats,
  ESGFacility,
  ESGFacilityDetail,
  FacilityAllocation,
  UpcomingDeadline,
  RecentActivity,
  FacilityAtRisk,
} from './types';

// Types for export configuration
export interface ExportConfig {
  title: string;
  dateRange?: { start: Date; end: Date };
  selectedFacilities?: string[];
  includeCharts?: boolean;
  templateStyle?: 'standard' | 'executive' | 'detailed';
}

export type ExportFormat = 'pdf' | 'excel';

// Helper functions
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMM d, yyyy');
}

function formatCurrencyFull(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getLoanTypeLabel(type: string): string {
  switch (type) {
    case 'sustainability_linked':
      return 'Sustainability-Linked';
    case 'green_loan':
      return 'Green Loan';
    case 'social_loan':
      return 'Social Loan';
    case 'transition_loan':
      return 'Transition Loan';
    case 'esg_linked_hybrid':
      return 'ESG Hybrid';
    default:
      return type;
  }
}

function getStatusLabel(status: string): string {
  return status.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

// PDF Export Functions
function addPDFHeader(doc: jsPDF, title: string, config: ExportConfig): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Brand header
  doc.setFillColor(24, 24, 27); // zinc-900
  doc.rect(0, 0, pageWidth, 35, 'F');

  // Logo/Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('LoanOS', 20, 22);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('ESG Performance Platform', 60, 22);

  // Report title
  doc.setTextColor(24, 24, 27);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 20, 55);

  // Date range
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(113, 113, 122); // zinc-500
  let dateText = `Generated: ${formatDate(new Date())}`;
  if (config.dateRange) {
    dateText += ` | Period: ${formatDate(config.dateRange.start)} - ${formatDate(config.dateRange.end)}`;
  }
  doc.text(dateText, 20, 65);

  return 75; // Return Y position after header
}

function addPDFFooter(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(161, 161, 170); // zinc-400
    doc.text(
      `Page ${i} of ${pageCount} | LoanOS ESG Report | Confidential`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }
}

// Dashboard Export
export function exportDashboardPDF(
  stats: DashboardStats,
  deadlines: UpcomingDeadline[],
  activities: RecentActivity[],
  facilitiesAtRisk: FacilityAtRisk[],
  config: ExportConfig
): void {
  const doc = new jsPDF();
  let yPos = addPDFHeader(doc, config.title || 'ESG Portfolio Dashboard', config);

  // Portfolio Overview Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(24, 24, 27);
  doc.text('Portfolio Overview', 20, yPos);
  yPos += 10;

  // Stats table
  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value']],
    body: [
      ['Total Facilities', stats.total_facilities.toString()],
      ['Total Commitment', formatCurrencyFull(stats.total_commitment)],
      ['KPIs On Track', `${stats.kpi_summary.on_track} of ${stats.kpi_summary.total_kpis}`],
      ['Target Achievement Rate', `${stats.target_achievement.achievement_rate.toFixed(1)}%`],
      ['Proceeds Utilization', `${stats.allocation_summary.utilization_rate.toFixed(1)}%`],
      ['Reports Overdue', stats.reporting_status.reports_overdue.toString()],
    ],
    theme: 'striped',
    headStyles: { fillColor: [24, 24, 27] },
    margin: { left: 20, right: 20 },
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // Portfolio Composition
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Portfolio Composition by Loan Type', 20, yPos);
  yPos += 10;

  const compositionData = Object.entries(stats.facilities_by_type)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => [
      getLoanTypeLabel(type),
      count.toString(),
      `${((count / stats.total_facilities) * 100).toFixed(1)}%`,
    ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Loan Type', 'Count', 'Percentage']],
    body: compositionData,
    theme: 'striped',
    headStyles: { fillColor: [24, 24, 27] },
    margin: { left: 20, right: 20 },
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // Facilities at Risk
  if (facilitiesAtRisk.length > 0) {
    if (yPos > 220) {
      doc.addPage();
      yPos = 30;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(217, 119, 6); // amber-600
    doc.text('Facilities At Risk', 20, yPos);
    yPos += 10;

    const riskData = facilitiesAtRisk.map((f) => [
      f.facility_name,
      f.borrower_name,
      getLoanTypeLabel(f.esg_loan_type),
      `${f.at_risk_kpis} KPI(s)`,
      formatDate(f.next_deadline),
      `+${f.margin_impact_bps}bps`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Facility', 'Borrower', 'Type', 'At Risk', 'Deadline', 'Impact']],
      body: riskData,
      theme: 'striped',
      headStyles: { fillColor: [217, 119, 6] },
      margin: { left: 20, right: 20 },
    });

    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  }

  // Upcoming Deadlines
  if (deadlines.length > 0) {
    if (yPos > 200) {
      doc.addPage();
      yPos = 30;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(24, 24, 27);
    doc.text('Upcoming Deadlines', 20, yPos);
    yPos += 10;

    const deadlineData = deadlines.map((d) => [
      formatDate(d.deadline),
      d.description,
      d.type.charAt(0).toUpperCase() + d.type.slice(1),
      d.priority.charAt(0).toUpperCase() + d.priority.slice(1),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Description', 'Type', 'Priority']],
      body: deadlineData,
      theme: 'striped',
      headStyles: { fillColor: [24, 24, 27] },
      margin: { left: 20, right: 20 },
    });
  }

  addPDFFooter(doc);
  doc.save(`esg-dashboard-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

export function exportDashboardExcel(
  stats: DashboardStats,
  deadlines: UpcomingDeadline[],
  activities: RecentActivity[],
  facilitiesAtRisk: FacilityAtRisk[],
  _config: ExportConfig
): void {
  const wb = XLSX.utils.book_new();

  // Overview sheet
  const overviewData = [
    ['ESG Portfolio Dashboard'],
    [`Generated: ${formatDate(new Date())}`],
    [''],
    ['Portfolio Overview'],
    ['Metric', 'Value'],
    ['Total Facilities', stats.total_facilities],
    ['Total Commitment', stats.total_commitment],
    ['KPIs On Track', stats.kpi_summary.on_track],
    ['Total KPIs', stats.kpi_summary.total_kpis],
    ['KPIs At Risk', stats.kpi_summary.at_risk],
    ['KPIs Off Track', stats.kpi_summary.off_track],
    ['Target Achievement Rate (%)', stats.target_achievement.achievement_rate],
    ['Targets Achieved', stats.target_achievement.achieved],
    ['Targets In Progress', stats.target_achievement.in_progress],
    ['Targets Missed', stats.target_achievement.missed],
    ['Proceeds Allocated', stats.allocation_summary.total_allocated],
    ['Proceeds Eligible', stats.allocation_summary.total_eligible],
    ['Utilization Rate (%)', stats.allocation_summary.utilization_rate],
    ['Reports Due', stats.reporting_status.reports_due],
    ['Reports Submitted', stats.reporting_status.reports_submitted],
    ['Reports Overdue', stats.reporting_status.reports_overdue],
  ];
  const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Overview');

  // Portfolio Composition sheet
  const compositionData = [
    ['Portfolio Composition by Loan Type'],
    [''],
    ['Loan Type', 'Count', 'Percentage'],
    ...Object.entries(stats.facilities_by_type).map(([type, count]) => [
      getLoanTypeLabel(type),
      count,
      ((count / stats.total_facilities) * 100).toFixed(1) + '%',
    ]),
  ];
  const wsComposition = XLSX.utils.aoa_to_sheet(compositionData);
  XLSX.utils.book_append_sheet(wb, wsComposition, 'Composition');

  // Facilities at Risk sheet
  if (facilitiesAtRisk.length > 0) {
    const riskData = [
      ['Facilities At Risk'],
      [''],
      ['Facility Name', 'Borrower', 'Loan Type', 'At Risk KPIs', 'Next Deadline', 'Margin Impact (bps)'],
      ...facilitiesAtRisk.map((f) => [
        f.facility_name,
        f.borrower_name,
        getLoanTypeLabel(f.esg_loan_type),
        f.at_risk_kpis,
        f.next_deadline,
        f.margin_impact_bps,
      ]),
    ];
    const wsRisk = XLSX.utils.aoa_to_sheet(riskData);
    XLSX.utils.book_append_sheet(wb, wsRisk, 'At Risk');
  }

  // Deadlines sheet
  if (deadlines.length > 0) {
    const deadlineData = [
      ['Upcoming Deadlines'],
      [''],
      ['Date', 'Description', 'Type', 'Priority', 'Facility ID'],
      ...deadlines.map((d) => [
        d.deadline,
        d.description,
        d.type,
        d.priority,
        d.facility_id,
      ]),
    ];
    const wsDeadlines = XLSX.utils.aoa_to_sheet(deadlineData);
    XLSX.utils.book_append_sheet(wb, wsDeadlines, 'Deadlines');
  }

  // Recent Activity sheet
  if (activities.length > 0) {
    const activityData = [
      ['Recent Activity'],
      [''],
      ['Date', 'Type', 'Description', 'Facility'],
      ...activities.map((a) => [
        a.occurred_at,
        a.type,
        a.description,
        a.facility_name,
      ]),
    ];
    const wsActivity = XLSX.utils.aoa_to_sheet(activityData);
    XLSX.utils.book_append_sheet(wb, wsActivity, 'Activity');
  }

  XLSX.writeFile(wb, `esg-dashboard-data-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

// Facility Detail Export
export function exportFacilityDetailPDF(
  facility: ESGFacilityDetail,
  config: ExportConfig
): void {
  const doc = new jsPDF();
  let yPos = addPDFHeader(doc, config.title || `${facility.facility_name} - ESG Report`, config);

  // Facility Overview
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(24, 24, 27);
  doc.text('Facility Overview', 20, yPos);
  yPos += 10;

  autoTable(doc, {
    startY: yPos,
    head: [['Property', 'Value']],
    body: [
      ['Borrower', facility.borrower_name],
      ['Industry', facility.borrower_industry],
      ['Loan Type', getLoanTypeLabel(facility.esg_loan_type)],
      ['Framework', facility.framework_reference],
      ['Commitment', formatCurrencyFull(facility.commitment_amount)],
      ['Outstanding', formatCurrencyFull(facility.outstanding_amount)],
      ['Base Margin', `${facility.base_margin_bps} bps`],
      ['Current Margin', `${facility.current_margin_bps} bps`],
      ['Margin Adjustment', `${facility.margin_adjustment_bps > 0 ? '+' : ''}${facility.margin_adjustment_bps} bps`],
      ['Effective Date', formatDate(facility.effective_date)],
      ['Maturity Date', formatDate(facility.maturity_date)],
      ['Sustainability Coordinator', facility.sustainability_coordinator || 'N/A'],
      ['External Verifier', facility.external_verifier || 'N/A'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [24, 24, 27] },
    margin: { left: 20, right: 20 },
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // KPIs Section
  if (facility.kpis.length > 0) {
    if (yPos > 180) {
      doc.addPage();
      yPos = 30;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Key Performance Indicators', 20, yPos);
    yPos += 10;

    const kpiData = facility.kpis.map((kpi) => [
      kpi.kpi_name,
      kpi.kpi_category.replace(/_/g, ' '),
      `${kpi.baseline_value} ${kpi.unit}`,
      `${kpi.current_value} ${kpi.unit}`,
      `${kpi.weight}%`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['KPI Name', 'Category', 'Baseline', 'Current', 'Weight']],
      body: kpiData,
      theme: 'striped',
      headStyles: { fillColor: [24, 24, 27] },
      margin: { left: 20, right: 20 },
    });

    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  }

  // Targets Section
  const allTargets = facility.kpis.flatMap((kpi) =>
    kpi.targets.map((t) => ({
      kpiName: kpi.kpi_name,
      unit: kpi.unit,
      ...t,
    }))
  );

  if (allTargets.length > 0) {
    if (yPos > 180) {
      doc.addPage();
      yPos = 30;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Targets & Progress', 20, yPos);
    yPos += 10;

    const targetData = allTargets.map((t) => [
      t.kpiName,
      t.target_year.toString(),
      `${t.target_value} ${t.unit}`,
      t.actual_value ? `${t.actual_value} ${t.unit}` : '-',
      getStatusLabel(t.target_status),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['KPI', 'Year', 'Target', 'Actual', 'Status']],
      body: targetData,
      theme: 'striped',
      headStyles: { fillColor: [24, 24, 27] },
      margin: { left: 20, right: 20 },
    });

    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  }

  // Margin History
  if (facility.margin_history.length > 0) {
    if (yPos > 200) {
      doc.addPage();
      yPos = 30;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Margin Adjustment History', 20, yPos);
    yPos += 10;

    const marginData = facility.margin_history.map((m) => [
      m.period,
      `${m.adjustment_bps > 0 ? '+' : ''}${m.adjustment_bps} bps`,
      `${m.cumulative_bps > 0 ? '+' : ''}${m.cumulative_bps} bps`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Period', 'Adjustment', 'Cumulative']],
      body: marginData,
      theme: 'striped',
      headStyles: { fillColor: [24, 24, 27] },
      margin: { left: 20, right: 20 },
    });

    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  }

  // Ratings
  if (facility.ratings.length > 0) {
    if (yPos > 220) {
      doc.addPage();
      yPos = 30;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ESG Ratings', 20, yPos);
    yPos += 10;

    const ratingData = facility.ratings.map((r) => [
      r.provider.toUpperCase(),
      r.rating,
      formatDate(r.rating_date),
      r.outlook || '-',
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Provider', 'Rating', 'Date', 'Outlook']],
      body: ratingData,
      theme: 'striped',
      headStyles: { fillColor: [24, 24, 27] },
      margin: { left: 20, right: 20 },
    });
  }

  addPDFFooter(doc);
  doc.save(`esg-facility-${facility.id}-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

export function exportFacilityDetailExcel(
  facility: ESGFacilityDetail,
  _config: ExportConfig
): void {
  const wb = XLSX.utils.book_new();

  // Overview sheet
  const overviewData = [
    [`${facility.facility_name} - ESG Report`],
    [`Generated: ${formatDate(new Date())}`],
    [''],
    ['Facility Overview'],
    ['Property', 'Value'],
    ['Facility Name', facility.facility_name],
    ['Borrower', facility.borrower_name],
    ['Industry', facility.borrower_industry],
    ['Loan Type', getLoanTypeLabel(facility.esg_loan_type)],
    ['Framework', facility.framework_reference],
    ['Status', facility.status],
    ['Commitment Amount', facility.commitment_amount],
    ['Outstanding Amount', facility.outstanding_amount],
    ['Base Margin (bps)', facility.base_margin_bps],
    ['Current Margin (bps)', facility.current_margin_bps],
    ['Max Margin Adjustment (bps)', facility.max_margin_adjustment_bps],
    ['Margin Adjustment (bps)', facility.margin_adjustment_bps],
    ['Effective Date', facility.effective_date],
    ['Maturity Date', facility.maturity_date],
    ['Sustainability Coordinator', facility.sustainability_coordinator || ''],
    ['External Verifier', facility.external_verifier || ''],
    ['Overall Performance Status', facility.overall_performance_status],
  ];
  const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Overview');

  // KPIs sheet
  if (facility.kpis.length > 0) {
    const kpiData = [
      ['Key Performance Indicators'],
      [''],
      ['KPI Name', 'Category', 'Unit', 'Baseline Value', 'Baseline Year', 'Current Value', 'Weight (%)'],
      ...facility.kpis.map((kpi) => [
        kpi.kpi_name,
        kpi.kpi_category,
        kpi.unit,
        kpi.baseline_value,
        kpi.baseline_year,
        kpi.current_value,
        kpi.weight,
      ]),
    ];
    const wsKPIs = XLSX.utils.aoa_to_sheet(kpiData);
    XLSX.utils.book_append_sheet(wb, wsKPIs, 'KPIs');
  }

  // Targets sheet
  const allTargets = facility.kpis.flatMap((kpi) =>
    kpi.targets.map((t) => ({
      kpiName: kpi.kpi_name,
      unit: kpi.unit,
      ...t,
    }))
  );

  if (allTargets.length > 0) {
    const targetData = [
      ['Targets & Progress'],
      [''],
      ['KPI Name', 'Target Year', 'Target Value', 'Actual Value', 'Status'],
      ...allTargets.map((t) => [
        t.kpiName,
        t.target_year,
        t.target_value,
        t.actual_value || '',
        t.target_status,
      ]),
    ];
    const wsTargets = XLSX.utils.aoa_to_sheet(targetData);
    XLSX.utils.book_append_sheet(wb, wsTargets, 'Targets');
  }

  // Margin History sheet
  if (facility.margin_history.length > 0) {
    const marginData = [
      ['Margin Adjustment History'],
      [''],
      ['Period', 'Adjustment (bps)', 'Cumulative (bps)'],
      ...facility.margin_history.map((m) => [m.period, m.adjustment_bps, m.cumulative_bps]),
    ];
    const wsMargin = XLSX.utils.aoa_to_sheet(marginData);
    XLSX.utils.book_append_sheet(wb, wsMargin, 'Margin History');
  }

  // Ratings sheet
  if (facility.ratings.length > 0) {
    const ratingData = [
      ['ESG Ratings'],
      [''],
      ['Provider', 'Rating', 'Date', 'Outlook'],
      ...facility.ratings.map((r) => [r.provider, r.rating, r.rating_date, r.outlook || '']),
    ];
    const wsRatings = XLSX.utils.aoa_to_sheet(ratingData);
    XLSX.utils.book_append_sheet(wb, wsRatings, 'Ratings');
  }

  // Reports sheet
  if (facility.reports.length > 0) {
    const reportData = [
      ['ESG Reports'],
      [''],
      ['Report Type', 'Period End', 'Status', 'Submitted At'],
      ...facility.reports.map((r) => [r.report_type, r.period_end, r.status, r.submitted_at || '']),
    ];
    const wsReports = XLSX.utils.aoa_to_sheet(reportData);
    XLSX.utils.book_append_sheet(wb, wsReports, 'Reports');
  }

  XLSX.writeFile(wb, `esg-facility-${facility.id}-data-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

// Allocations Export
export function exportAllocationsPDF(
  allocations: FacilityAllocation[],
  config: ExportConfig
): void {
  const doc = new jsPDF();
  let yPos = addPDFHeader(doc, config.title || 'Use of Proceeds Report', config);

  // Summary
  const totalCommitment = allocations.reduce((sum, f) => sum + f.commitment_amount, 0);
  const totalAllocated = allocations.reduce(
    (sum, f) => sum + f.categories.reduce((catSum, c) => catSum + c.total_allocated, 0),
    0
  );
  const totalUnallocated = allocations.reduce((sum, f) => sum + f.unallocated_amount, 0);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(24, 24, 27);
  doc.text('Portfolio Summary', 20, yPos);
  yPos += 10;

  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value']],
    body: [
      ['Total Commitment', formatCurrencyFull(totalCommitment)],
      ['Total Allocated', formatCurrencyFull(totalAllocated)],
      ['Total Unallocated', formatCurrencyFull(totalUnallocated)],
      ['Utilization Rate', `${((totalAllocated / totalCommitment) * 100).toFixed(1)}%`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [24, 24, 27] },
    margin: { left: 20, right: 20 },
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // Facility-level detail
  allocations.forEach((facility) => {
    if (yPos > 180) {
      doc.addPage();
      yPos = 30;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(24, 24, 27);
    doc.text(`${facility.facility_name} (${getLoanTypeLabel(facility.esg_loan_type)})`, 20, yPos);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(113, 113, 122);
    doc.text(`${facility.borrower_name} | Lookback ends: ${formatDate(facility.lookback_period_end)}`, 20, yPos + 6);
    yPos += 15;

    // Categories and projects
    const categoryData = facility.categories.map((cat) => [
      cat.category_name,
      formatCurrencyFull(cat.eligible_amount),
      formatCurrencyFull(cat.total_allocated),
      `${((cat.total_allocated / cat.eligible_amount) * 100).toFixed(1)}%`,
      cat.allocation_count.toString(),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Category', 'Eligible', 'Allocated', 'Utilization', 'Projects']],
      body: categoryData,
      theme: 'striped',
      headStyles: { fillColor: [107, 33, 168] }, // purple-700
      margin: { left: 20, right: 20 },
    });

    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    // Projects
    const allProjects = facility.categories.flatMap((cat) =>
      cat.projects.map((p) => [p.project_name, cat.category_name, formatCurrencyFull(p.amount), formatDate(p.date)])
    );

    if (allProjects.length > 0 && yPos < 220) {
      autoTable(doc, {
        startY: yPos,
        head: [['Project', 'Category', 'Amount', 'Date']],
        body: allProjects,
        theme: 'striped',
        headStyles: { fillColor: [82, 82, 91] }, // zinc-600
        margin: { left: 25, right: 25 },
        styles: { fontSize: 9 },
      });

      yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
    }
  });

  addPDFFooter(doc);
  doc.save(`esg-allocations-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

export function exportAllocationsExcel(
  allocations: FacilityAllocation[],
  _config: ExportConfig
): void {
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const totalCommitment = allocations.reduce((sum, f) => sum + f.commitment_amount, 0);
  const totalAllocated = allocations.reduce(
    (sum, f) => sum + f.categories.reduce((catSum, c) => catSum + c.total_allocated, 0),
    0
  );
  const totalUnallocated = allocations.reduce((sum, f) => sum + f.unallocated_amount, 0);

  const summaryData = [
    ['Use of Proceeds Report'],
    [`Generated: ${formatDate(new Date())}`],
    [''],
    ['Portfolio Summary'],
    ['Metric', 'Value'],
    ['Total Commitment', totalCommitment],
    ['Total Allocated', totalAllocated],
    ['Total Unallocated', totalUnallocated],
    ['Utilization Rate (%)', ((totalAllocated / totalCommitment) * 100).toFixed(1)],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // Facilities sheet
  const facilitiesData = [
    ['Facilities Overview'],
    [''],
    ['Facility Name', 'Borrower', 'Loan Type', 'Commitment', 'Allocated', 'Unallocated', 'Utilization (%)', 'Lookback End'],
    ...allocations.map((f) => {
      const allocated = f.categories.reduce((sum, c) => sum + c.total_allocated, 0);
      return [
        f.facility_name,
        f.borrower_name,
        getLoanTypeLabel(f.esg_loan_type),
        f.commitment_amount,
        allocated,
        f.unallocated_amount,
        ((allocated / f.commitment_amount) * 100).toFixed(1),
        f.lookback_period_end,
      ];
    }),
  ];
  const wsFacilities = XLSX.utils.aoa_to_sheet(facilitiesData);
  XLSX.utils.book_append_sheet(wb, wsFacilities, 'Facilities');

  // Categories sheet
  const categoriesData = [
    ['Allocation Categories'],
    [''],
    ['Facility', 'Category', 'Eligible Category', 'Eligible Amount', 'Allocated', 'Utilization (%)', 'Project Count'],
    ...allocations.flatMap((f) =>
      f.categories.map((c) => [
        f.facility_name,
        c.category_name,
        c.eligible_category,
        c.eligible_amount,
        c.total_allocated,
        ((c.total_allocated / c.eligible_amount) * 100).toFixed(1),
        c.allocation_count,
      ])
    ),
  ];
  const wsCategories = XLSX.utils.aoa_to_sheet(categoriesData);
  XLSX.utils.book_append_sheet(wb, wsCategories, 'Categories');

  // Projects sheet
  const projectsData = [
    ['Projects'],
    [''],
    ['Facility', 'Category', 'Project Name', 'Amount', 'Date'],
    ...allocations.flatMap((f) =>
      f.categories.flatMap((c) =>
        c.projects.map((p) => [f.facility_name, c.category_name, p.project_name, p.amount, p.date])
      )
    ),
  ];
  const wsProjects = XLSX.utils.aoa_to_sheet(projectsData);
  XLSX.utils.book_append_sheet(wb, wsProjects, 'Projects');

  XLSX.writeFile(wb, `esg-allocations-data-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

// Facilities List Export
export function exportFacilitiesListPDF(
  facilities: ESGFacility[],
  config: ExportConfig
): void {
  const doc = new jsPDF('landscape');
  const yPos = addPDFHeader(doc, config.title || 'ESG Facilities Report', config);

  const facilityData = facilities.map((f) => [
    f.facility_name,
    f.borrower_name,
    getLoanTypeLabel(f.esg_loan_type),
    formatCurrencyFull(f.commitment_amount),
    getStatusLabel(f.overall_performance_status),
    `${f.targets_achieved}/${f.targets_total}`,
    `${f.margin_adjustment_bps > 0 ? '+' : ''}${f.margin_adjustment_bps}bps`,
    f.next_reporting_date ? formatDate(f.next_reporting_date) : '-',
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Facility', 'Borrower', 'Type', 'Commitment', 'Status', 'Targets', 'Margin Adj.', 'Next Report']],
    body: facilityData,
    theme: 'striped',
    headStyles: { fillColor: [24, 24, 27] },
    margin: { left: 15, right: 15 },
    styles: { fontSize: 9 },
  });

  addPDFFooter(doc);
  doc.save(`esg-facilities-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

export function exportFacilitiesListExcel(
  facilities: ESGFacility[],
  _config: ExportConfig
): void {
  const wb = XLSX.utils.book_new();

  const facilitiesData = [
    ['ESG Facilities Report'],
    [`Generated: ${formatDate(new Date())}`],
    [''],
    [
      'Facility Name',
      'Borrower',
      'Industry',
      'Loan Type',
      'Status',
      'Commitment',
      'Outstanding',
      'Base Margin (bps)',
      'Current Margin (bps)',
      'Margin Adjustment (bps)',
      'KPI Count',
      'Targets Achieved',
      'Targets Total',
      'Performance Status',
      'Next Reporting Date',
      'Effective Date',
      'Maturity Date',
    ],
    ...facilities.map((f) => [
      f.facility_name,
      f.borrower_name,
      f.borrower_industry,
      getLoanTypeLabel(f.esg_loan_type),
      f.status,
      f.commitment_amount,
      f.outstanding_amount,
      f.base_margin_bps,
      f.current_margin_bps,
      f.margin_adjustment_bps,
      f.kpi_count,
      f.targets_achieved,
      f.targets_total,
      f.overall_performance_status,
      f.next_reporting_date || '',
      f.effective_date,
      f.maturity_date,
    ]),
  ];
  const wsFacilities = XLSX.utils.aoa_to_sheet(facilitiesData);
  XLSX.utils.book_append_sheet(wb, wsFacilities, 'Facilities');

  XLSX.writeFile(wb, `esg-facilities-data-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}
