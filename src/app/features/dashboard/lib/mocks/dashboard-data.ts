/**
 * Dashboard Mock Data
 *
 * Core dashboard data including stats, activity, deadlines, modules,
 * drill-down details, and portfolio health score.
 */

import {
  FileText,
  Handshake,
  ClipboardCheck,
  ArrowLeftRight,
  Leaf,
  Upload,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

import {
  borrowers,
  facilities,
  BORROWER_IDS,
  FACILITY_IDS,
} from './borrower-registry';

import {
  createDeadline,
  relativeMinutesAgo,
  relativeHoursAgo,
  relativeDaysAgo,
  getRecentMonths,
  lastUpdated,
  toShortDate,
  daysFromNow,
} from './date-factory';

// =============================================================================
// Core Dashboard Types
// =============================================================================

export interface DashboardStat {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  sparklineData?: number[];
}

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  user: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

export interface DeadlineItem {
  id: string;
  type: string;
  title: string;
  loan: string;
  dueDate: string;
  daysRemaining: number;
  priority: 'high' | 'medium' | 'low';
}

export interface ModuleItem {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  metric: string;
  color: string;
  available: boolean;
}

// =============================================================================
// Drill-down Types
// =============================================================================

export interface LoanDetail {
  id: string;
  name: string;
  borrower: string;
  amount: string;
  status: 'active' | 'pending' | 'closed';
  lastUpdated: string;
  type: string;
}

export interface DocumentDetail {
  id: string;
  name: string;
  type: string;
  uploadedBy: string;
  uploadedAt: string;
  status: 'processed' | 'pending' | 'failed';
  extractedFields: number;
}

export interface DeadlineDetail {
  id: string;
  title: string;
  loan: string;
  dueDate: string;
  daysRemaining: number;
  type: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed' | 'overdue';
}

export interface NegotiationDetail {
  id: string;
  deal: string;
  counterparty: string;
  status: 'awaiting_response' | 'in_progress' | 'completed';
  proposalsCount: number;
  lastActivity: string;
  openItems: number;
}

export interface ESGRiskDetail {
  id: string;
  kpi: string;
  facility: string;
  target: string;
  current: string;
  status: 'at_risk' | 'on_track' | 'achieved';
  impact: string;
  deadline: string;
}

export type StatDrilldownType = 'loans' | 'documents' | 'deadlines' | 'negotiations' | 'esg';

// =============================================================================
// Portfolio Health Score Types
// =============================================================================

export interface HealthScoreComponent {
  id: string;
  name: string;
  score: number;
  weight: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  description: string;
  benchmark: number;
}

export interface HealthScoreTrendPoint {
  date: string;
  score: number;
  benchmark: number;
}

export interface IndustryBenchmark {
  category: string;
  yourScore: number;
  industryAvg: number;
  topQuartile: number;
  bottomQuartile: number;
  percentile: number;
}

export interface PortfolioHealthData {
  overallScore: number;
  previousScore: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  industryRank: string;
  percentile: number;
  components: HealthScoreComponent[];
  trendHistory: HealthScoreTrendPoint[];
  benchmarks: IndustryBenchmark[];
  lastUpdated: string;
}

export interface HealthScoreDrilldownItem {
  id: string;
  name: string;
  status: 'good' | 'warning' | 'critical';
  score: number;
  detail: string;
  lastChecked: string;
}

// =============================================================================
// Core Dashboard Mock Data
// =============================================================================

export const stats: DashboardStat[] = [
  {
    label: 'Active Loans',
    value: '24',
    change: '+3 this month',
    trend: 'up',
    icon: FileText,
    sparklineData: [18, 19, 19, 20, 21, 21, 22, 22, 23, 23, 24, 24],
  },
  {
    label: 'Documents Processed',
    value: '156',
    change: '+28 this month',
    trend: 'up',
    icon: Upload,
    sparklineData: [95, 102, 108, 115, 122, 128, 135, 140, 145, 150, 154, 156],
  },
  {
    label: 'Upcoming Deadlines',
    value: '8',
    change: 'Next 30 days',
    trend: 'neutral',
    icon: Calendar,
    sparklineData: [6, 7, 8, 9, 8, 7, 8, 9, 10, 9, 8, 8],
  },
  {
    label: 'Open Negotiations',
    value: '3',
    change: '2 awaiting response',
    trend: 'neutral',
    icon: Handshake,
    sparklineData: [4, 5, 4, 3, 4, 5, 4, 3, 3, 4, 3, 3],
  },
  {
    label: 'ESG At Risk',
    value: '2',
    change: 'Action required',
    trend: 'down',
    icon: AlertTriangle,
    sparklineData: [0, 0, 1, 1, 1, 2, 1, 2, 2, 3, 2, 2],
  },
];

export const recentActivity: ActivityItem[] = [
  {
    id: '1',
    type: 'document_uploaded',
    title: 'Document uploaded',
    description: 'Facility Agreement - Project Apollo.pdf',
    timestamp: relativeMinutesAgo(2),
    user: 'Sarah Johnson',
    status: 'success',
  },
  {
    id: '2',
    type: 'extraction_complete',
    title: 'Extraction complete',
    description: 'Term Loan Agreement - XYZ Corp analyzed',
    timestamp: relativeMinutesAgo(15),
    user: 'System',
    status: 'success',
  },
  {
    id: '3',
    type: 'compliance_due',
    title: 'Compliance deadline',
    description: 'Q4 Financials due in 5 days - ABC Holdings',
    timestamp: relativeHoursAgo(1),
    user: 'System',
    status: 'warning',
  },
  {
    id: '4',
    type: 'term_change',
    title: 'Term negotiation',
    description: 'Margin ratchet updated - Project Neptune',
    timestamp: relativeHoursAgo(3),
    user: 'Mike Chen',
    status: 'info',
  },
  {
    id: '5',
    type: 'esg_update',
    title: 'ESG target at risk',
    description: 'Carbon reduction KPI below threshold',
    timestamp: relativeHoursAgo(5),
    user: 'System',
    status: 'error',
  },
];

// Helper to create deadline items with consistent dynamic dates
const deadline5Days = createDeadline(5);
const deadline10Days = createDeadline(10);
const deadline21Days = createDeadline(21);
const deadline36Days = createDeadline(36);

export const upcomingDeadlines: DeadlineItem[] = [
  {
    id: '1',
    type: 'compliance',
    title: 'Q4 Financial Statements',
    loan: 'ABC Holdings - Term Loan A',
    dueDate: deadline5Days.dueDate,
    daysRemaining: deadline5Days.daysRemaining,
    priority: 'high',
  },
  {
    id: '2',
    type: 'compliance',
    title: 'Compliance Certificate',
    loan: 'XYZ Corp - Revolving Facility',
    dueDate: deadline10Days.dueDate,
    daysRemaining: deadline10Days.daysRemaining,
    priority: 'medium',
  },
  {
    id: '3',
    type: 'esg',
    title: 'ESG Performance Report',
    loan: 'Project Neptune',
    dueDate: deadline21Days.dueDate,
    daysRemaining: deadline21Days.daysRemaining,
    priority: 'medium',
  },
  {
    id: '4',
    type: 'compliance',
    title: 'Budget Submission',
    loan: 'Project Apollo',
    dueDate: deadline36Days.dueDate,
    daysRemaining: deadline36Days.daysRemaining,
    priority: 'low',
  },
];

export const modules: ModuleItem[] = [
  {
    name: 'Document Hub',
    description: 'Upload and analyze loan documents with AI-powered extraction',
    icon: FileText,
    href: '/documents',
    metric: '156 documents',
    color: 'bg-blue-500',
    available: true,
  },
  {
    name: 'Deal Room',
    description: 'Negotiate terms and track deal progress in real-time',
    icon: Handshake,
    href: '/deals',
    metric: '3 active deals',
    color: 'bg-purple-500',
    available: true,
  },
  {
    name: 'Compliance Tracker',
    description: 'Monitor obligations, covenants, and reporting deadlines',
    icon: ClipboardCheck,
    href: '/compliance',
    metric: '8 upcoming',
    color: 'bg-amber-500',
    available: true,
  },
  {
    name: 'Trade Due Diligence',
    description: 'Streamline secondary loan trading with automated DD',
    icon: ArrowLeftRight,
    href: '/trading',
    metric: '2 in progress',
    color: 'bg-green-500',
    available: true,
  },
  {
    name: 'ESG Dashboard',
    description: 'Track sustainability KPIs and margin ratchets',
    icon: Leaf,
    href: '/esg',
    metric: '5 facilities',
    color: 'bg-emerald-500',
    available: true,
  },
];

// =============================================================================
// Drill-down Mock Data
// =============================================================================

// Helper to get borrower/facility data from registry
const abc = borrowers[BORROWER_IDS.ABC_HOLDINGS];
const xyz = borrowers[BORROWER_IDS.XYZ_CORP];
const apollo = borrowers[BORROWER_IDS.APOLLO_INDUSTRIES];
const neptune = borrowers[BORROWER_IDS.NEPTUNE_LLC];
const delta = borrowers[BORROWER_IDS.DELTA_CORP];
const omega = borrowers[BORROWER_IDS.OMEGA_HOLDINGS];
const ecotech = borrowers[BORROWER_IDS.ECOTECH_LTD];
const alpha = borrowers[BORROWER_IDS.ALPHA_PARTNERS];

const facAbc = facilities[FACILITY_IDS.ABC_TERM_A];
const facXyz = facilities[FACILITY_IDS.XYZ_REVOLVER];
const facApollo = facilities[FACILITY_IDS.APOLLO_PROJECT];
const facNeptune = facilities[FACILITY_IDS.NEPTUNE_SYNDICATED];
const facDelta = facilities[FACILITY_IDS.DELTA_WC];
const facOmega = facilities[FACILITY_IDS.OMEGA_ACQUISITION];
const facEcotech = facilities[FACILITY_IDS.ECOTECH_GREEN];
const facAlpha = facilities[FACILITY_IDS.ALPHA_BRIDGE];

export const activeLoansDetails: LoanDetail[] = [
  { id: facAbc.id, name: facAbc.name, borrower: abc.name, amount: facAbc.formattedAmount, status: 'active', lastUpdated: relativeDaysAgo(2), type: facAbc.type },
  { id: facXyz.id, name: facXyz.name, borrower: xyz.name, amount: facXyz.formattedAmount, status: 'active', lastUpdated: relativeDaysAgo(1), type: facXyz.type },
  { id: facApollo.id, name: facApollo.name, borrower: apollo.name, amount: facApollo.formattedAmount, status: 'active', lastUpdated: relativeHoursAgo(5), type: facApollo.type },
  { id: facNeptune.id, name: facNeptune.name, borrower: neptune.name, amount: facNeptune.formattedAmount, status: 'active', lastUpdated: relativeDaysAgo(3), type: facNeptune.type },
  { id: facDelta.id, name: facDelta.name, borrower: delta.name, amount: facDelta.formattedAmount, status: 'active', lastUpdated: relativeDaysAgo(7), type: facDelta.type },
  { id: facOmega.id, name: facOmega.name, borrower: omega.name, amount: facOmega.formattedAmount, status: 'pending', lastUpdated: relativeHoursAgo(2), type: facOmega.type },
  { id: facEcotech.id, name: facEcotech.name, borrower: ecotech.name, amount: facEcotech.formattedAmount, status: 'active', lastUpdated: relativeDaysAgo(4), type: facEcotech.type },
  { id: facAlpha.id, name: facAlpha.name, borrower: alpha.name, amount: facAlpha.formattedAmount, status: 'active', lastUpdated: relativeHoursAgo(6), type: facAlpha.type },
];

export const documentsProcessedDetails: DocumentDetail[] = [
  { id: '1', name: 'Facility Agreement - Project Apollo.pdf', type: 'Facility Agreement', uploadedBy: 'Sarah Johnson', uploadedAt: relativeMinutesAgo(2), status: 'processed', extractedFields: 42 },
  { id: '2', name: 'Term Loan Agreement - XYZ Corp.pdf', type: 'Term Sheet', uploadedBy: 'Mike Chen', uploadedAt: relativeMinutesAgo(15), status: 'processed', extractedFields: 38 },
  { id: '3', name: 'Amendment No. 3 - ABC Holdings.docx', type: 'Amendment', uploadedBy: 'Sarah Johnson', uploadedAt: relativeHoursAgo(1), status: 'processed', extractedFields: 15 },
  { id: '4', name: 'Compliance Certificate Q3.pdf', type: 'Compliance', uploadedBy: 'System', uploadedAt: relativeHoursAgo(2), status: 'processed', extractedFields: 8 },
  { id: '5', name: 'Financial Statements 2024.pdf', type: 'Financial', uploadedBy: 'Mike Chen', uploadedAt: relativeHoursAgo(3), status: 'pending', extractedFields: 0 },
  { id: '6', name: 'ESG Report - Neptune.pdf', type: 'ESG Report', uploadedBy: 'Sarah Johnson', uploadedAt: relativeHoursAgo(5), status: 'processed', extractedFields: 24 },
];

// Create deadlines for upcomingDeadlinesDetails
const ddl5 = createDeadline(5);
const ddl10 = createDeadline(10);
const ddl21 = createDeadline(21);
const ddl36 = createDeadline(36);
const ddl41 = createDeadline(41);
const ddl26 = createDeadline(26);
const ddl53 = createDeadline(53);

export const upcomingDeadlinesDetails: DeadlineDetail[] = [
  { id: '1', title: 'Q4 Financial Statements', loan: `${abc.name} - ${facAbc.name}`, dueDate: ddl5.dueDate, daysRemaining: ddl5.daysRemaining, type: 'Compliance', priority: 'high', status: 'pending' },
  { id: '2', title: 'Compliance Certificate', loan: `${xyz.name} - ${facXyz.name}`, dueDate: ddl10.dueDate, daysRemaining: ddl10.daysRemaining, type: 'Compliance', priority: 'medium', status: 'pending' },
  { id: '3', title: 'ESG Performance Report', loan: facNeptune.name, dueDate: ddl21.dueDate, daysRemaining: ddl21.daysRemaining, type: 'ESG', priority: 'medium', status: 'pending' },
  { id: '4', title: 'Budget Submission', loan: facApollo.name, dueDate: ddl36.dueDate, daysRemaining: ddl36.daysRemaining, type: 'Compliance', priority: 'low', status: 'pending' },
  { id: '5', title: 'Annual Review', loan: `${delta.name} - ${facDelta.name}`, dueDate: ddl41.dueDate, daysRemaining: ddl41.daysRemaining, type: 'Review', priority: 'low', status: 'pending' },
  { id: '6', title: 'Interest Payment', loan: omega.name, dueDate: ddl26.dueDate, daysRemaining: ddl26.daysRemaining, type: 'Payment', priority: 'high', status: 'pending' },
  { id: '7', title: 'Covenant Test', loan: abc.name, dueDate: ddl21.dueDate, daysRemaining: ddl21.daysRemaining, type: 'Covenant', priority: 'high', status: 'pending' },
  { id: '8', title: 'Insurance Renewal', loan: ecotech.name, dueDate: ddl53.dueDate, daysRemaining: ddl53.daysRemaining, type: 'Insurance', priority: 'low', status: 'pending' },
];

export const openNegotiationsDetails: NegotiationDetail[] = [
  { id: '1', deal: `${facApollo.name} - Amendment`, counterparty: apollo.name, status: 'awaiting_response', proposalsCount: 3, lastActivity: relativeHoursAgo(2), openItems: 4 },
  { id: '2', deal: 'Neptune Refinancing', counterparty: neptune.name, status: 'in_progress', proposalsCount: 7, lastActivity: relativeDaysAgo(1), openItems: 2 },
  { id: '3', deal: 'Delta Working Capital Increase', counterparty: delta.name, status: 'awaiting_response', proposalsCount: 2, lastActivity: relativeDaysAgo(3), openItems: 5 },
];

export const esgAtRiskDetails: ESGRiskDetail[] = [
  { id: '1', kpi: 'Carbon Emissions Reduction', facility: facNeptune.name, target: '-15%', current: '-8%', status: 'at_risk', impact: '10bps margin increase', deadline: toShortDate(daysFromNow(21)) },
  { id: '2', kpi: 'Renewable Energy Usage', facility: `${ecotech.name} ${facEcotech.name}`, target: '50%', current: '38%', status: 'at_risk', impact: '5bps margin increase', deadline: toShortDate(daysFromNow(90)) },
];

// =============================================================================
// Portfolio Health Score Mock Data
// =============================================================================

// Generate dynamic month labels for trend history
const trendMonths = getRecentMonths(6);

export const portfolioHealthData: PortfolioHealthData = {
  overallScore: 78,
  previousScore: 74,
  trend: 'up',
  change: 5.4,
  industryRank: 'Top 25%',
  percentile: 78,
  lastUpdated: lastUpdated(2),
  components: [
    {
      id: 'compliance',
      name: 'Compliance Adherence',
      score: 85,
      weight: 30,
      trend: 'up',
      change: 3.2,
      description: 'On-time reporting & covenant compliance',
      benchmark: 79,
    },
    {
      id: 'esg',
      name: 'ESG Performance',
      score: 72,
      weight: 20,
      trend: 'down',
      change: -2.1,
      description: 'Sustainability KPIs & targets achievement',
      benchmark: 68,
    },
    {
      id: 'documents',
      name: 'Document Completeness',
      score: 91,
      weight: 25,
      trend: 'stable',
      change: 0.5,
      description: 'Required documents extracted & verified',
      benchmark: 82,
    },
    {
      id: 'velocity',
      name: 'Deal Velocity',
      score: 64,
      weight: 25,
      trend: 'up',
      change: 8.7,
      description: 'Average time from initiation to close',
      benchmark: 71,
    },
  ],
  trendHistory: [
    { date: trendMonths[0], score: 68, benchmark: 72 },
    { date: trendMonths[1], score: 70, benchmark: 73 },
    { date: trendMonths[2], score: 72, benchmark: 73 },
    { date: trendMonths[3], score: 71, benchmark: 74 },
    { date: trendMonths[4], score: 74, benchmark: 74 },
    { date: trendMonths[5], score: 78, benchmark: 75 },
  ],
  benchmarks: [
    {
      category: 'Compliance Adherence',
      yourScore: 85,
      industryAvg: 79,
      topQuartile: 92,
      bottomQuartile: 65,
      percentile: 72,
    },
    {
      category: 'ESG Performance',
      yourScore: 72,
      industryAvg: 68,
      topQuartile: 85,
      bottomQuartile: 52,
      percentile: 65,
    },
    {
      category: 'Document Completeness',
      yourScore: 91,
      industryAvg: 82,
      topQuartile: 95,
      bottomQuartile: 70,
      percentile: 84,
    },
    {
      category: 'Deal Velocity',
      yourScore: 64,
      industryAvg: 71,
      topQuartile: 88,
      bottomQuartile: 55,
      percentile: 38,
    },
  ],
};

export const healthScoreDrilldownData: Record<string, HealthScoreDrilldownItem[]> = {
  compliance: [
    { id: '1', name: `${abc.name} - Q4 Financials`, status: 'warning', score: 75, detail: 'Due in 5 days', lastChecked: relativeHoursAgo(1) },
    { id: '2', name: `${xyz.name} - Covenant Test`, status: 'good', score: 95, detail: 'Passed Q3 test', lastChecked: relativeDaysAgo(2) },
    { id: '3', name: `${facApollo.name} - Compliance Cert`, status: 'good', score: 88, detail: 'Submitted on time', lastChecked: relativeDaysAgo(5) },
    { id: '4', name: `${neptune.name} - Annual Review`, status: 'critical', score: 62, detail: 'Overdue by 3 days', lastChecked: relativeDaysAgo(3) },
    { id: '5', name: `${delta.name} - Insurance`, status: 'good', score: 92, detail: `Valid until ${toShortDate(daysFromNow(60))}`, lastChecked: relativeDaysAgo(7) },
  ],
  esg: [
    { id: '1', name: `Carbon Emissions - ${neptune.shortName}`, status: 'critical', score: 45, detail: 'Below target by 7%', lastChecked: relativeDaysAgo(1) },
    { id: '2', name: `Renewable Energy - ${ecotech.shortName}`, status: 'warning', score: 68, detail: '12% below target', lastChecked: relativeDaysAgo(3) },
    { id: '3', name: `Water Usage - ${apollo.shortName}`, status: 'good', score: 89, detail: 'Exceeding target', lastChecked: relativeDaysAgo(2) },
    { id: '4', name: `Diversity Score - ${xyz.shortName}`, status: 'good', score: 85, detail: 'On track', lastChecked: relativeDaysAgo(7) },
  ],
  documents: [
    { id: '1', name: `Facility Agreement - ${apollo.shortName}`, status: 'good', score: 100, detail: '42 fields extracted', lastChecked: relativeMinutesAgo(2) },
    { id: '2', name: `Amendment - ${abc.name}`, status: 'good', score: 95, detail: '15 fields extracted', lastChecked: relativeHoursAgo(1) },
    { id: '3', name: `Term Sheet - ${neptune.shortName}`, status: 'warning', score: 78, detail: '3 fields pending review', lastChecked: relativeHoursAgo(5) },
    { id: '4', name: `Financial Statements - ${delta.shortName}`, status: 'critical', score: 0, detail: 'Processing failed', lastChecked: relativeHoursAgo(3) },
    { id: '5', name: `ESG Report - ${ecotech.shortName}`, status: 'good', score: 92, detail: '24 fields extracted', lastChecked: relativeHoursAgo(5) },
  ],
  velocity: [
    { id: '1', name: `${facApollo.name} Amendment`, status: 'warning', score: 65, detail: '45 days in negotiation', lastChecked: 'Active' },
    { id: '2', name: 'Neptune Refinancing', status: 'good', score: 82, detail: '28 days to close', lastChecked: 'Active' },
    { id: '3', name: `${delta.shortName} WC Increase`, status: 'critical', score: 48, detail: '60 days, awaiting docs', lastChecked: 'Active' },
    { id: '4', name: `${omega.shortName} Acquisition`, status: 'good', score: 90, detail: 'Closed in 21 days', lastChecked: 'Completed' },
  ],
};
