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
    timestamp: '2 minutes ago',
    user: 'Sarah Johnson',
    status: 'success',
  },
  {
    id: '2',
    type: 'extraction_complete',
    title: 'Extraction complete',
    description: 'Term Loan Agreement - XYZ Corp analyzed',
    timestamp: '15 minutes ago',
    user: 'System',
    status: 'success',
  },
  {
    id: '3',
    type: 'compliance_due',
    title: 'Compliance deadline',
    description: 'Q4 Financials due in 5 days - ABC Holdings',
    timestamp: '1 hour ago',
    user: 'System',
    status: 'warning',
  },
  {
    id: '4',
    type: 'term_change',
    title: 'Term negotiation',
    description: 'Margin ratchet updated - Project Neptune',
    timestamp: '3 hours ago',
    user: 'Mike Chen',
    status: 'info',
  },
  {
    id: '5',
    type: 'esg_update',
    title: 'ESG target at risk',
    description: 'Carbon reduction KPI below threshold',
    timestamp: '5 hours ago',
    user: 'System',
    status: 'error',
  },
];

export const upcomingDeadlines: DeadlineItem[] = [
  {
    id: '1',
    type: 'compliance',
    title: 'Q4 Financial Statements',
    loan: 'ABC Holdings - Term Loan A',
    dueDate: 'Dec 15, 2024',
    daysRemaining: 5,
    priority: 'high',
  },
  {
    id: '2',
    type: 'compliance',
    title: 'Compliance Certificate',
    loan: 'XYZ Corp - Revolving Facility',
    dueDate: 'Dec 20, 2024',
    daysRemaining: 10,
    priority: 'medium',
  },
  {
    id: '3',
    type: 'esg',
    title: 'ESG Performance Report',
    loan: 'Project Neptune',
    dueDate: 'Dec 31, 2024',
    daysRemaining: 21,
    priority: 'medium',
  },
  {
    id: '4',
    type: 'compliance',
    title: 'Budget Submission',
    loan: 'Project Apollo',
    dueDate: 'Jan 15, 2025',
    daysRemaining: 36,
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

export const activeLoansDetails: LoanDetail[] = [
  { id: '1', name: 'Term Loan A', borrower: 'ABC Holdings', amount: '$50M', status: 'active', lastUpdated: '2 days ago', type: 'Term Loan' },
  { id: '2', name: 'Revolving Facility', borrower: 'XYZ Corp', amount: '$75M', status: 'active', lastUpdated: '1 day ago', type: 'Revolver' },
  { id: '3', name: 'Project Apollo', borrower: 'Apollo Industries', amount: '$120M', status: 'active', lastUpdated: '5 hours ago', type: 'Project Finance' },
  { id: '4', name: 'Project Neptune', borrower: 'Neptune LLC', amount: '$85M', status: 'active', lastUpdated: '3 days ago', type: 'Syndicated Loan' },
  { id: '5', name: 'Working Capital', borrower: 'Delta Corp', amount: '$25M', status: 'active', lastUpdated: '1 week ago', type: 'Working Capital' },
  { id: '6', name: 'Acquisition Finance', borrower: 'Omega Holdings', amount: '$200M', status: 'pending', lastUpdated: '2 hours ago', type: 'M&A' },
  { id: '7', name: 'Green Bond', borrower: 'EcoTech Ltd', amount: '$60M', status: 'active', lastUpdated: '4 days ago', type: 'Green Finance' },
  { id: '8', name: 'Bridge Loan', borrower: 'Alpha Partners', amount: '$15M', status: 'active', lastUpdated: '6 hours ago', type: 'Bridge' },
];

export const documentsProcessedDetails: DocumentDetail[] = [
  { id: '1', name: 'Facility Agreement - Project Apollo.pdf', type: 'Facility Agreement', uploadedBy: 'Sarah Johnson', uploadedAt: '2 minutes ago', status: 'processed', extractedFields: 42 },
  { id: '2', name: 'Term Loan Agreement - XYZ Corp.pdf', type: 'Term Sheet', uploadedBy: 'Mike Chen', uploadedAt: '15 minutes ago', status: 'processed', extractedFields: 38 },
  { id: '3', name: 'Amendment No. 3 - ABC Holdings.docx', type: 'Amendment', uploadedBy: 'Sarah Johnson', uploadedAt: '1 hour ago', status: 'processed', extractedFields: 15 },
  { id: '4', name: 'Compliance Certificate Q3.pdf', type: 'Compliance', uploadedBy: 'System', uploadedAt: '2 hours ago', status: 'processed', extractedFields: 8 },
  { id: '5', name: 'Financial Statements 2024.pdf', type: 'Financial', uploadedBy: 'Mike Chen', uploadedAt: '3 hours ago', status: 'pending', extractedFields: 0 },
  { id: '6', name: 'ESG Report - Neptune.pdf', type: 'ESG Report', uploadedBy: 'Sarah Johnson', uploadedAt: '5 hours ago', status: 'processed', extractedFields: 24 },
];

export const upcomingDeadlinesDetails: DeadlineDetail[] = [
  { id: '1', title: 'Q4 Financial Statements', loan: 'ABC Holdings - Term Loan A', dueDate: 'Dec 15, 2024', daysRemaining: 5, type: 'Compliance', priority: 'high', status: 'pending' },
  { id: '2', title: 'Compliance Certificate', loan: 'XYZ Corp - Revolving Facility', dueDate: 'Dec 20, 2024', daysRemaining: 10, type: 'Compliance', priority: 'medium', status: 'pending' },
  { id: '3', title: 'ESG Performance Report', loan: 'Project Neptune', dueDate: 'Dec 31, 2024', daysRemaining: 21, type: 'ESG', priority: 'medium', status: 'pending' },
  { id: '4', title: 'Budget Submission', loan: 'Project Apollo', dueDate: 'Jan 15, 2025', daysRemaining: 36, type: 'Compliance', priority: 'low', status: 'pending' },
  { id: '5', title: 'Annual Review', loan: 'Delta Corp - Working Capital', dueDate: 'Jan 20, 2025', daysRemaining: 41, type: 'Review', priority: 'low', status: 'pending' },
  { id: '6', title: 'Interest Payment', loan: 'Omega Holdings', dueDate: 'Jan 5, 2025', daysRemaining: 26, type: 'Payment', priority: 'high', status: 'pending' },
  { id: '7', title: 'Covenant Test', loan: 'ABC Holdings', dueDate: 'Dec 31, 2024', daysRemaining: 21, type: 'Covenant', priority: 'high', status: 'pending' },
  { id: '8', title: 'Insurance Renewal', loan: 'EcoTech Ltd', dueDate: 'Feb 1, 2025', daysRemaining: 53, type: 'Insurance', priority: 'low', status: 'pending' },
];

export const openNegotiationsDetails: NegotiationDetail[] = [
  { id: '1', deal: 'Project Apollo - Amendment', counterparty: 'Apollo Industries', status: 'awaiting_response', proposalsCount: 3, lastActivity: '2 hours ago', openItems: 4 },
  { id: '2', deal: 'Neptune Refinancing', counterparty: 'Neptune LLC', status: 'in_progress', proposalsCount: 7, lastActivity: '1 day ago', openItems: 2 },
  { id: '3', deal: 'Delta Working Capital Increase', counterparty: 'Delta Corp', status: 'awaiting_response', proposalsCount: 2, lastActivity: '3 days ago', openItems: 5 },
];

export const esgAtRiskDetails: ESGRiskDetail[] = [
  { id: '1', kpi: 'Carbon Emissions Reduction', facility: 'Project Neptune', target: '-15%', current: '-8%', status: 'at_risk', impact: '10bps margin increase', deadline: 'Dec 31, 2024' },
  { id: '2', kpi: 'Renewable Energy Usage', facility: 'EcoTech Green Bond', target: '50%', current: '38%', status: 'at_risk', impact: '5bps margin increase', deadline: 'Mar 31, 2025' },
];

// =============================================================================
// Portfolio Health Score Mock Data
// =============================================================================

export const portfolioHealthData: PortfolioHealthData = {
  overallScore: 78,
  previousScore: 74,
  trend: 'up',
  change: 5.4,
  industryRank: 'Top 25%',
  percentile: 78,
  lastUpdated: '2 hours ago',
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
    { date: 'Jul', score: 68, benchmark: 72 },
    { date: 'Aug', score: 70, benchmark: 73 },
    { date: 'Sep', score: 72, benchmark: 73 },
    { date: 'Oct', score: 71, benchmark: 74 },
    { date: 'Nov', score: 74, benchmark: 74 },
    { date: 'Dec', score: 78, benchmark: 75 },
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
    { id: '1', name: 'ABC Holdings - Q4 Financials', status: 'warning', score: 75, detail: 'Due in 5 days', lastChecked: '1 hour ago' },
    { id: '2', name: 'XYZ Corp - Covenant Test', status: 'good', score: 95, detail: 'Passed Q3 test', lastChecked: '2 days ago' },
    { id: '3', name: 'Project Apollo - Compliance Cert', status: 'good', score: 88, detail: 'Submitted on time', lastChecked: '5 days ago' },
    { id: '4', name: 'Neptune LLC - Annual Review', status: 'critical', score: 62, detail: 'Overdue by 3 days', lastChecked: '3 days ago' },
    { id: '5', name: 'Delta Corp - Insurance', status: 'good', score: 92, detail: 'Valid until Feb 2025', lastChecked: '1 week ago' },
  ],
  esg: [
    { id: '1', name: 'Carbon Emissions - Neptune', status: 'critical', score: 45, detail: 'Below target by 7%', lastChecked: '1 day ago' },
    { id: '2', name: 'Renewable Energy - EcoTech', status: 'warning', score: 68, detail: '12% below target', lastChecked: '3 days ago' },
    { id: '3', name: 'Water Usage - Apollo', status: 'good', score: 89, detail: 'Exceeding target', lastChecked: '2 days ago' },
    { id: '4', name: 'Diversity Score - XYZ', status: 'good', score: 85, detail: 'On track', lastChecked: '1 week ago' },
  ],
  documents: [
    { id: '1', name: 'Facility Agreement - Apollo', status: 'good', score: 100, detail: '42 fields extracted', lastChecked: '2 min ago' },
    { id: '2', name: 'Amendment - ABC Holdings', status: 'good', score: 95, detail: '15 fields extracted', lastChecked: '1 hour ago' },
    { id: '3', name: 'Term Sheet - Neptune', status: 'warning', score: 78, detail: '3 fields pending review', lastChecked: '5 hours ago' },
    { id: '4', name: 'Financial Statements - Delta', status: 'critical', score: 0, detail: 'Processing failed', lastChecked: '3 hours ago' },
    { id: '5', name: 'ESG Report - EcoTech', status: 'good', score: 92, detail: '24 fields extracted', lastChecked: '5 hours ago' },
  ],
  velocity: [
    { id: '1', name: 'Project Apollo Amendment', status: 'warning', score: 65, detail: '45 days in negotiation', lastChecked: 'Active' },
    { id: '2', name: 'Neptune Refinancing', status: 'good', score: 82, detail: '28 days to close', lastChecked: 'Active' },
    { id: '3', name: 'Delta WC Increase', status: 'critical', score: 48, detail: '60 days, awaiting docs', lastChecked: 'Active' },
    { id: '4', name: 'Omega Acquisition', status: 'good', score: 90, detail: 'Closed in 21 days', lastChecked: 'Completed' },
  ],
};
