import type { DashboardStats, UpcomingDeadline, RecentActivity, FacilityAtRisk } from './types';

export const mockDashboardStats: DashboardStats = {
  total_facilities: 12,
  total_commitment: 850000000,
  facilities_by_type: {
    sustainability_linked: 5,
    green_loan: 4,
    social_loan: 2,
    transition_loan: 1,
    esg_linked_hybrid: 0,
  },
  kpi_summary: {
    total_kpis: 28,
    on_track: 18,
    at_risk: 6,
    off_track: 2,
    pending_verification: 5,
  },
  target_achievement: {
    total_targets: 42,
    achieved: 24,
    in_progress: 14,
    missed: 4,
    achievement_rate: 57.1,
  },
  allocation_summary: {
    total_allocated: 320000000,
    total_eligible: 450000000,
    unallocated: 130000000,
    utilization_rate: 71.1,
  },
  reporting_status: {
    reports_due: 3,
    reports_submitted: 8,
    reports_overdue: 1,
  },
};

export const mockUpcomingDeadlines: UpcomingDeadline[] = [
  {
    type: 'report',
    description: 'Annual ESG Report - ABC Corp',
    deadline: '2024-12-15',
    facility_id: '1',
    priority: 'high',
  },
  {
    type: 'target',
    description: 'GHG Emissions Target - XYZ Holdings',
    deadline: '2024-12-31',
    facility_id: '2',
    priority: 'medium',
  },
  {
    type: 'verification',
    description: 'Q4 KPI Verification - Neptune Inc',
    deadline: '2025-01-10',
    facility_id: '3',
    priority: 'medium',
  },
  {
    type: 'allocation',
    description: 'Lookback Period Ends - Green Project Fund',
    deadline: '2025-01-31',
    facility_id: '4',
    priority: 'high',
  },
];

export const mockRecentActivity: RecentActivity[] = [
  {
    id: '1',
    type: 'performance_submitted',
    description: 'Q3 performance data submitted',
    facility_name: 'ABC Corp SLL',
    occurred_at: '2024-12-07T10:30:00Z',
  },
  {
    id: '2',
    type: 'target_achieved',
    description: 'Renewable energy target achieved',
    facility_name: 'XYZ Holdings Green Loan',
    occurred_at: '2024-12-06T15:45:00Z',
  },
  {
    id: '3',
    type: 'rating_updated',
    description: 'MSCI rating upgraded to AA',
    facility_name: 'Neptune Inc',
    occurred_at: '2024-12-05T09:00:00Z',
  },
  {
    id: '4',
    type: 'allocation_made',
    description: 'Allocated $5M to solar project',
    facility_name: 'Green Project Fund',
    occurred_at: '2024-12-04T14:20:00Z',
  },
];

export const mockFacilitiesAtRisk: FacilityAtRisk[] = [
  {
    id: '1',
    facility_name: 'ABC Corp SLL',
    borrower_name: 'ABC Corporation',
    esg_loan_type: 'sustainability_linked',
    at_risk_kpis: 2,
    next_deadline: '2024-12-31',
    margin_impact_bps: 15,
  },
  {
    id: '4',
    facility_name: 'Neptune Transition',
    borrower_name: 'Neptune Industries',
    esg_loan_type: 'transition_loan',
    at_risk_kpis: 1,
    next_deadline: '2025-01-15',
    margin_impact_bps: 10,
  },
];
