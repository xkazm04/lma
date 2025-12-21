import type {
  DashboardStats,
  UpcomingItem,
  FacilityAtRisk,
  RecentActivity,
  Facility,
  Covenant,
  CalendarEvent,
  FacilityDetail,
  Obligation,
  BreachPrediction,
  IndustryBenchmark,
  CovenantBenchmarkComparison,
  MarketComparisonAlert,
  BenchmarkDashboardStats,
  BenchmarkTrend,
  NetworkContributionStatus,
} from './types';

export const dashboardStats: DashboardStats = {
  total_facilities: 12,
  facilities_in_compliance: 9,
  facilities_in_waiver: 2,
  facilities_in_default: 1,
  upcoming_deadlines_7_days: 5,
  upcoming_deadlines_30_days: 18,
  overdue_items: 2,
  pending_waivers: 3,
};

export const upcomingItems: UpcomingItem[] = [
  {
    id: '1',
    date: '2024-12-12',
    type: 'compliance_event',
    title: 'Q4 Financial Statements',
    facility_name: 'ABC Holdings - Term Loan A',
    borrower_name: 'ABC Holdings LLC',
    status: 'upcoming',
  },
  {
    id: '2',
    date: '2024-12-15',
    type: 'covenant_test',
    title: 'Leverage Ratio Test',
    facility_name: 'XYZ Corp Revolver',
    borrower_name: 'XYZ Corporation',
    status: 'pending',
  },
  {
    id: '3',
    date: '2024-12-18',
    type: 'compliance_event',
    title: 'Compliance Certificate',
    facility_name: 'Neptune Holdings TL',
    borrower_name: 'Neptune Holdings Inc',
    status: 'upcoming',
  },
  {
    id: '4',
    date: '2024-12-20',
    type: 'notification_due',
    title: 'Material Contract Notice',
    facility_name: 'Project Apollo',
    borrower_name: 'Apollo Industries',
    status: 'pending',
  },
  {
    id: '5',
    date: '2024-12-31',
    type: 'waiver_expiration',
    title: 'Covenant Waiver Expires',
    facility_name: 'Delta Manufacturing',
    borrower_name: 'Delta Manufacturing Co',
    status: 'pending',
  },
];

export const facilitiesAtRisk: FacilityAtRisk[] = [
  {
    facility_id: '1',
    facility_name: 'Delta Manufacturing TL',
    borrower_name: 'Delta Manufacturing Co',
    risk_reason: 'In waiver period',
    covenant_name: 'Fixed Charge Coverage',
    headroom_percentage: null,
  },
  {
    facility_id: '2',
    facility_name: 'Omega Enterprises',
    borrower_name: 'Omega Enterprises LLC',
    risk_reason: 'Low covenant headroom',
    covenant_name: 'Leverage Ratio',
    headroom_percentage: 8.5,
  },
  {
    facility_id: '3',
    facility_name: 'Sigma Holdings',
    borrower_name: 'Sigma Holdings Inc',
    risk_reason: 'In default',
    covenant_name: 'Interest Coverage',
    headroom_percentage: null,
  },
];

export const recentActivity: RecentActivity[] = [
  {
    id: '1',
    activity_type: 'covenant_test_passed',
    description: 'Leverage Ratio test passed for ABC Holdings',
    entity_name: 'Leverage Ratio',
    created_at: '2024-12-07T10:30:00Z',
  },
  {
    id: '2',
    activity_type: 'compliance_submitted',
    description: 'Q3 Financials submitted for Neptune Holdings',
    entity_name: 'Q3 Financial Statements',
    created_at: '2024-12-06T15:45:00Z',
  },
  {
    id: '3',
    activity_type: 'waiver_granted',
    description: 'Covenant waiver granted for Delta Manufacturing',
    entity_name: 'Fixed Charge Coverage',
    created_at: '2024-12-05T09:00:00Z',
  },
  {
    id: '4',
    activity_type: 'event_analyzed',
    description: 'Business event analyzed for notification triggers',
    entity_name: 'Notification Analysis',
    created_at: '2024-12-04T14:20:00Z',
  },
];

export const mockFacilities: Facility[] = [
  {
    id: '1',
    facility_name: 'ABC Holdings - Term Loan A',
    borrower_name: 'ABC Holdings LLC',
    facility_type: 'term_loan',
    status: 'active',
    commitment_amount: 250000000,
    currency: 'USD',
    maturity_date: '2028-12-15',
    created_at: '2024-01-15T10:00:00Z',
    stats: {
      total_obligations: 12,
      upcoming_30_days: 3,
      overdue: 0,
      total_covenants: 4,
      covenants_at_risk: 0,
    },
  },
  {
    id: '2',
    facility_name: 'XYZ Corp - Revolving Facility',
    borrower_name: 'XYZ Corporation',
    facility_type: 'revolving_credit',
    status: 'active',
    commitment_amount: 100000000,
    currency: 'USD',
    maturity_date: '2027-06-30',
    created_at: '2024-02-20T14:00:00Z',
    stats: {
      total_obligations: 8,
      upcoming_30_days: 2,
      overdue: 0,
      total_covenants: 3,
      covenants_at_risk: 1,
    },
  },
  {
    id: '3',
    facility_name: 'Delta Manufacturing - Term Loan',
    borrower_name: 'Delta Manufacturing Co',
    facility_type: 'term_loan',
    status: 'waiver_period',
    commitment_amount: 75000000,
    currency: 'USD',
    maturity_date: '2026-09-15',
    created_at: '2023-09-15T09:00:00Z',
    stats: {
      total_obligations: 10,
      upcoming_30_days: 1,
      overdue: 1,
      total_covenants: 3,
      covenants_at_risk: 1,
    },
  },
  {
    id: '4',
    facility_name: 'Neptune Holdings - Senior Secured',
    borrower_name: 'Neptune Holdings Inc',
    facility_type: 'term_loan',
    status: 'active',
    commitment_amount: 500000000,
    currency: 'USD',
    maturity_date: '2029-03-31',
    created_at: '2024-03-01T11:00:00Z',
    stats: {
      total_obligations: 15,
      upcoming_30_days: 4,
      overdue: 0,
      total_covenants: 5,
      covenants_at_risk: 0,
    },
  },
  {
    id: '5',
    facility_name: 'Sigma Holdings - ABL',
    borrower_name: 'Sigma Holdings Inc',
    facility_type: 'abl',
    status: 'default',
    commitment_amount: 50000000,
    currency: 'USD',
    maturity_date: '2025-12-31',
    created_at: '2023-06-01T08:00:00Z',
    stats: {
      total_obligations: 6,
      upcoming_30_days: 0,
      overdue: 2,
      total_covenants: 2,
      covenants_at_risk: 2,
    },
  },
];

export const mockCovenants: Covenant[] = [
  {
    id: '1',
    name: 'Leverage Ratio',
    covenant_type: 'leverage_ratio',
    facility_id: '1',
    facility_name: 'ABC Holdings - Term Loan A',
    borrower_name: 'ABC Holdings LLC',
    threshold_type: 'maximum',
    current_threshold: 4.0,
    status: 'active',
    test_frequency: 'quarterly',
    next_test_date: '2024-12-31',
    latest_test: {
      test_date: '2024-09-30',
      calculated_ratio: 3.2,
      test_result: 'pass',
      headroom_percentage: 20.0,
      headroom_absolute: 0.8,
    },
    test_history: [
      {
        test_date: '2023-12-31',
        calculated_ratio: 3.5,
        test_result: 'pass',
        headroom_percentage: 12.5,
        headroom_absolute: 0.5,
      },
      {
        test_date: '2024-03-31',
        calculated_ratio: 3.4,
        test_result: 'pass',
        headroom_percentage: 15.0,
        headroom_absolute: 0.6,
      },
      {
        test_date: '2024-06-30',
        calculated_ratio: 3.3,
        test_result: 'pass',
        headroom_percentage: 17.5,
        headroom_absolute: 0.7,
      },
      {
        test_date: '2024-09-30',
        calculated_ratio: 3.2,
        test_result: 'pass',
        headroom_percentage: 20.0,
        headroom_absolute: 0.8,
      },
    ],
  },
  {
    id: '2',
    name: 'Interest Coverage Ratio',
    covenant_type: 'interest_coverage',
    facility_id: '1',
    facility_name: 'ABC Holdings - Term Loan A',
    borrower_name: 'ABC Holdings LLC',
    threshold_type: 'minimum',
    current_threshold: 2.5,
    status: 'active',
    test_frequency: 'quarterly',
    next_test_date: '2024-12-31',
    latest_test: {
      test_date: '2024-09-30',
      calculated_ratio: 3.8,
      test_result: 'pass',
      headroom_percentage: 52.0,
      headroom_absolute: 1.3,
    },
    test_history: [
      {
        test_date: '2023-12-31',
        calculated_ratio: 3.6,
        test_result: 'pass',
        headroom_percentage: 44.0,
        headroom_absolute: 1.1,
      },
      {
        test_date: '2024-03-31',
        calculated_ratio: 3.5,
        test_result: 'pass',
        headroom_percentage: 40.0,
        headroom_absolute: 1.0,
      },
      {
        test_date: '2024-06-30',
        calculated_ratio: 3.7,
        test_result: 'pass',
        headroom_percentage: 48.0,
        headroom_absolute: 1.2,
      },
      {
        test_date: '2024-09-30',
        calculated_ratio: 3.8,
        test_result: 'pass',
        headroom_percentage: 52.0,
        headroom_absolute: 1.3,
      },
    ],
  },
  {
    id: '3',
    name: 'Leverage Ratio',
    covenant_type: 'leverage_ratio',
    facility_id: '2',
    facility_name: 'XYZ Corp Revolver',
    borrower_name: 'XYZ Corporation',
    threshold_type: 'maximum',
    current_threshold: 3.5,
    status: 'active',
    test_frequency: 'quarterly',
    next_test_date: '2024-12-31',
    latest_test: {
      test_date: '2024-09-30',
      calculated_ratio: 3.1,
      test_result: 'pass',
      headroom_percentage: 11.4,
      headroom_absolute: 0.4,
    },
    test_history: [
      {
        test_date: '2023-12-31',
        calculated_ratio: 2.8,
        test_result: 'pass',
        headroom_percentage: 20.0,
        headroom_absolute: 0.7,
      },
      {
        test_date: '2024-03-31',
        calculated_ratio: 2.9,
        test_result: 'pass',
        headroom_percentage: 17.1,
        headroom_absolute: 0.6,
      },
      {
        test_date: '2024-06-30',
        calculated_ratio: 3.0,
        test_result: 'pass',
        headroom_percentage: 14.3,
        headroom_absolute: 0.5,
      },
      {
        test_date: '2024-09-30',
        calculated_ratio: 3.1,
        test_result: 'pass',
        headroom_percentage: 11.4,
        headroom_absolute: 0.4,
      },
    ],
  },
  {
    id: '4',
    name: 'Fixed Charge Coverage',
    covenant_type: 'fixed_charge_coverage',
    facility_id: '3',
    facility_name: 'Delta Manufacturing TL',
    borrower_name: 'Delta Manufacturing Co',
    threshold_type: 'minimum',
    current_threshold: 1.2,
    status: 'waived',
    test_frequency: 'quarterly',
    next_test_date: '2025-03-31',
    latest_test: {
      test_date: '2024-09-30',
      calculated_ratio: 1.05,
      test_result: 'fail',
      headroom_percentage: -12.5,
      headroom_absolute: -0.15,
    },
    test_history: [
      {
        test_date: '2023-12-31',
        calculated_ratio: 1.35,
        test_result: 'pass',
        headroom_percentage: 12.5,
        headroom_absolute: 0.15,
      },
      {
        test_date: '2024-03-31',
        calculated_ratio: 1.25,
        test_result: 'pass',
        headroom_percentage: 4.2,
        headroom_absolute: 0.05,
      },
      {
        test_date: '2024-06-30',
        calculated_ratio: 1.15,
        test_result: 'fail',
        headroom_percentage: -4.2,
        headroom_absolute: -0.05,
      },
      {
        test_date: '2024-09-30',
        calculated_ratio: 1.05,
        test_result: 'fail',
        headroom_percentage: -12.5,
        headroom_absolute: -0.15,
      },
    ],
    waiver: {
      expiration_date: '2025-03-31',
    },
  },
  {
    id: '5',
    name: 'Minimum Liquidity',
    covenant_type: 'minimum_liquidity',
    facility_id: '4',
    facility_name: 'Neptune Holdings TL',
    borrower_name: 'Neptune Holdings Inc',
    threshold_type: 'minimum',
    current_threshold: 25000000,
    status: 'active',
    test_frequency: 'monthly',
    next_test_date: '2024-12-15',
    latest_test: {
      test_date: '2024-11-30',
      calculated_ratio: 42000000,
      test_result: 'pass',
      headroom_percentage: 68.0,
      headroom_absolute: 17000000,
    },
    test_history: [
      {
        test_date: '2024-08-31',
        calculated_ratio: 38000000,
        test_result: 'pass',
        headroom_percentage: 52.0,
        headroom_absolute: 13000000,
      },
      {
        test_date: '2024-09-30',
        calculated_ratio: 40000000,
        test_result: 'pass',
        headroom_percentage: 60.0,
        headroom_absolute: 15000000,
      },
      {
        test_date: '2024-10-31',
        calculated_ratio: 41000000,
        test_result: 'pass',
        headroom_percentage: 64.0,
        headroom_absolute: 16000000,
      },
      {
        test_date: '2024-11-30',
        calculated_ratio: 42000000,
        test_result: 'pass',
        headroom_percentage: 68.0,
        headroom_absolute: 17000000,
      },
    ],
  },
  {
    id: '6',
    name: 'Interest Coverage',
    covenant_type: 'interest_coverage',
    facility_id: '5',
    facility_name: 'Sigma Holdings ABL',
    borrower_name: 'Sigma Holdings Inc',
    threshold_type: 'minimum',
    current_threshold: 2.0,
    status: 'breached',
    test_frequency: 'quarterly',
    next_test_date: null,
    latest_test: {
      test_date: '2024-09-30',
      calculated_ratio: 1.4,
      test_result: 'fail',
      headroom_percentage: -30.0,
      headroom_absolute: -0.6,
    },
    test_history: [
      {
        test_date: '2023-12-31',
        calculated_ratio: 2.1,
        test_result: 'pass',
        headroom_percentage: 5.0,
        headroom_absolute: 0.1,
      },
      {
        test_date: '2024-03-31',
        calculated_ratio: 1.9,
        test_result: 'fail',
        headroom_percentage: -5.0,
        headroom_absolute: -0.1,
      },
      {
        test_date: '2024-06-30',
        calculated_ratio: 1.6,
        test_result: 'fail',
        headroom_percentage: -20.0,
        headroom_absolute: -0.4,
      },
      {
        test_date: '2024-09-30',
        calculated_ratio: 1.4,
        test_result: 'fail',
        headroom_percentage: -30.0,
        headroom_absolute: -0.6,
      },
    ],
  },
];

export const mockCalendarItems: CalendarEvent[] = [
  {
    id: '1',
    facility_id: '1',
    date: '2024-12-10',
    type: 'compliance_event',
    title: 'Q3 Financial Statements',
    facility_name: 'ABC Holdings - Term Loan A',
    borrower_name: 'ABC Holdings LLC',
    status: 'completed',
  },
  {
    id: '2',
    facility_id: '2',
    date: '2024-12-12',
    type: 'compliance_event',
    title: 'Compliance Certificate',
    facility_name: 'XYZ Corp Revolver',
    borrower_name: 'XYZ Corporation',
    status: 'upcoming',
  },
  {
    id: '3',
    facility_id: '1',
    date: '2024-12-15',
    type: 'covenant_test',
    title: 'Leverage Ratio Test',
    facility_name: 'ABC Holdings - Term Loan A',
    borrower_name: 'ABC Holdings LLC',
    status: 'pending',
  },
  {
    id: '4',
    facility_id: '4',
    date: '2024-12-15',
    type: 'compliance_event',
    title: 'Q4 Financial Statements',
    facility_name: 'Neptune Holdings TL',
    borrower_name: 'Neptune Holdings Inc',
    status: 'upcoming',
  },
  {
    id: '5',
    facility_id: '6',
    date: '2024-12-18',
    type: 'notification_due',
    title: 'Material Contract Notice',
    facility_name: 'Project Apollo',
    borrower_name: 'Apollo Industries',
    status: 'pending',
  },
  {
    id: '6',
    facility_id: '1',
    date: '2024-12-20',
    type: 'compliance_event',
    title: 'Borrowing Base Certificate',
    facility_name: 'ABC Holdings - Term Loan A',
    borrower_name: 'ABC Holdings LLC',
    status: 'pending',
  },
  {
    id: '7',
    facility_id: '3',
    date: '2024-12-31',
    type: 'waiver_expiration',
    title: 'Covenant Waiver Expires',
    facility_name: 'Delta Manufacturing',
    borrower_name: 'Delta Manufacturing Co',
    status: 'pending',
  },
  {
    id: '8',
    facility_id: '2',
    date: '2024-12-31',
    type: 'covenant_test',
    title: 'Interest Coverage Test',
    facility_name: 'XYZ Corp Revolver',
    borrower_name: 'XYZ Corporation',
    status: 'pending',
  },
  {
    id: '9',
    facility_id: '5',
    date: '2025-01-05',
    type: 'compliance_event',
    title: 'Monthly Financials',
    facility_name: 'Sigma Holdings ABL',
    borrower_name: 'Sigma Holdings Inc',
    status: 'pending',
  },
  {
    id: '10',
    facility_id: '6',
    date: '2025-01-15',
    type: 'compliance_event',
    title: 'Budget Submission',
    facility_name: 'Project Apollo',
    borrower_name: 'Apollo Industries',
    status: 'pending',
  },
];

export const mockFacilityDetail: FacilityDetail = {
  id: '1',
  facility_name: 'ABC Holdings - Term Loan A',
  borrower_name: 'ABC Holdings LLC',
  facility_type: 'term_loan',
  status: 'active',
  commitment_amount: 250000000,
  currency: 'USD',
  maturity_date: '2028-12-15',
  signing_date: '2024-01-15',
  agent_bank: 'First National Bank',
  source_document_id: 'doc-123',
  created_at: '2024-01-15T10:00:00Z',
  stats: {
    total_obligations: 12,
    upcoming_30_days: 3,
    overdue: 0,
    total_covenants: 4,
    covenants_at_risk: 0,
  },
};

export const mockObligations: Obligation[] = [
  {
    id: '1',
    name: 'Quarterly Financial Statements',
    obligation_type: 'quarterly_financials',
    frequency: 'quarterly',
    deadline_days_after_period: 45,
    is_active: true,
    upcoming_event: {
      deadline_date: '2024-12-15',
      status: 'upcoming',
    },
  },
  {
    id: '2',
    name: 'Annual Audited Financials',
    obligation_type: 'annual_audited_financials',
    frequency: 'annually',
    deadline_days_after_period: 120,
    is_active: true,
    upcoming_event: {
      deadline_date: '2025-04-30',
      status: 'pending',
    },
  },
  {
    id: '3',
    name: 'Compliance Certificate',
    obligation_type: 'compliance_certificate',
    frequency: 'quarterly',
    deadline_days_after_period: 45,
    is_active: true,
    upcoming_event: {
      deadline_date: '2024-12-15',
      status: 'upcoming',
    },
  },
  {
    id: '4',
    name: 'Borrowing Base Certificate',
    obligation_type: 'borrowing_base',
    frequency: 'monthly',
    deadline_days_after_period: 15,
    is_active: true,
    upcoming_event: {
      deadline_date: '2024-12-20',
      status: 'pending',
    },
  },
];

// =============================================================================
// Mock Breach Predictions
// =============================================================================

export const mockPredictions: Record<string, BreachPrediction> = {
  // Covenant 1: ABC Holdings Leverage Ratio - Low risk, improving trend
  '1': {
    covenant_id: '1',
    prediction_date: '2024-12-08',
    breach_probability_2q: 8,
    breach_probability_3q: 12,
    overall_risk_level: 'low',
    confidence_score: 85,
    projected_breach_quarter: null,
    contributing_factors: [
      {
        factor: 'Improving Trend',
        impact: 'positive',
        description: 'Leverage ratio has steadily improved over the past 4 quarters',
        weight: 40,
      },
      {
        factor: 'Strong Headroom',
        impact: 'positive',
        description: 'Current 20% headroom provides substantial buffer',
        weight: 35,
      },
      {
        factor: 'Consistent Performance',
        impact: 'positive',
        description: 'No failed tests in the past 12 months',
        weight: 25,
      },
    ],
    quarterly_projections: [
      { quarter: 'Q1 2025', projected_ratio: 3.1, breach_probability: 5, confidence: 90 },
      { quarter: 'Q2 2025', projected_ratio: 3.0, breach_probability: 8, confidence: 82 },
      { quarter: 'Q3 2025', projected_ratio: 2.9, breach_probability: 12, confidence: 75 },
    ],
    seasonal_patterns: [
      { quarter: 'Q4', typical_impact: 'negative', description: 'Year-end adjustments typically increase leverage temporarily' },
      { quarter: 'Q2', typical_impact: 'positive', description: 'Strong cash flow generation in spring months' },
    ],
    recommendations: [
      'Continue monitoring quarterly test results',
      'No immediate action required given strong headroom position',
    ],
    summary: 'ABC Holdings maintains a healthy leverage position with an improving trend. The 20% headroom and consistent improvement over the past year indicate low breach risk in the foreseeable future.',
  },

  // Covenant 3: XYZ Corp Leverage Ratio - Medium risk, declining headroom
  '3': {
    covenant_id: '3',
    prediction_date: '2024-12-08',
    breach_probability_2q: 35,
    breach_probability_3q: 52,
    overall_risk_level: 'medium',
    confidence_score: 78,
    projected_breach_quarter: 'Q3 2025',
    contributing_factors: [
      {
        factor: 'Declining Headroom',
        impact: 'negative',
        description: 'Headroom has decreased from 20% to 11.4% over four quarters',
        weight: 45,
      },
      {
        factor: 'Consistent Deterioration',
        impact: 'negative',
        description: 'Each quarterly test shows incremental worsening',
        weight: 30,
      },
      {
        factor: 'Passing Tests',
        impact: 'positive',
        description: 'All recent tests have passed despite declining trend',
        weight: 25,
      },
    ],
    quarterly_projections: [
      { quarter: 'Q1 2025', projected_ratio: 3.2, breach_probability: 25, confidence: 85 },
      { quarter: 'Q2 2025', projected_ratio: 3.3, breach_probability: 35, confidence: 75 },
      { quarter: 'Q3 2025', projected_ratio: 3.45, breach_probability: 52, confidence: 68 },
    ],
    seasonal_patterns: [
      { quarter: 'Q4', typical_impact: 'negative', description: 'Holiday inventory buildup increases leverage' },
      { quarter: 'Q1', typical_impact: 'neutral', description: 'Post-holiday normalization period' },
    ],
    recommendations: [
      'Schedule meeting with borrower to discuss leverage trajectory',
      'Request updated financial projections for next 12 months',
      'Consider proactive covenant amendment discussions',
      'Monitor working capital management closely',
    ],
    summary: 'XYZ Corporation shows a concerning downward trend in covenant headroom. While still compliant, the consistent quarterly deterioration suggests potential breach risk by Q3 2025 without intervention. Recommend proactive engagement with borrower.',
  },

  // Covenant 4: Delta Manufacturing Fixed Charge - High risk, already in breach
  '4': {
    covenant_id: '4',
    prediction_date: '2024-12-08',
    breach_probability_2q: 85,
    breach_probability_3q: 78,
    overall_risk_level: 'high',
    confidence_score: 92,
    projected_breach_quarter: 'Q1 2025',
    contributing_factors: [
      {
        factor: 'Current Breach Status',
        impact: 'negative',
        description: 'Covenant currently breached and under waiver',
        weight: 50,
      },
      {
        factor: 'Accelerating Decline',
        impact: 'negative',
        description: 'FCCR dropped from 1.35x to 1.05x in 12 months',
        weight: 30,
      },
      {
        factor: 'Waiver Protection',
        impact: 'positive',
        description: 'Waiver provides temporary relief until Q1 2025',
        weight: 20,
      },
    ],
    quarterly_projections: [
      { quarter: 'Q1 2025', projected_ratio: 1.0, breach_probability: 85, confidence: 90 },
      { quarter: 'Q2 2025', projected_ratio: 1.08, breach_probability: 78, confidence: 82 },
      { quarter: 'Q3 2025', projected_ratio: 1.12, breach_probability: 65, confidence: 72 },
    ],
    seasonal_patterns: [
      { quarter: 'Q1', typical_impact: 'negative', description: 'Slow season for manufacturing sector' },
      { quarter: 'Q3', typical_impact: 'positive', description: 'Peak production season improves cash flow' },
    ],
    recommendations: [
      'Begin waiver extension or amendment negotiations immediately',
      'Request detailed operational improvement plan from borrower',
      'Evaluate collateral position and recovery scenarios',
      'Consider restructuring options if improvement not feasible',
      'Coordinate with workout team on contingency planning',
    ],
    summary: 'Delta Manufacturing is in breach with a waiver expiring Q1 2025. The underlying trend shows continued deterioration. High probability of continued non-compliance without significant operational improvements or debt restructuring.',
  },

  // Covenant 5: Neptune Holdings Minimum Liquidity - Low risk, strong position
  '5': {
    covenant_id: '5',
    prediction_date: '2024-12-08',
    breach_probability_2q: 3,
    breach_probability_3q: 5,
    overall_risk_level: 'low',
    confidence_score: 88,
    projected_breach_quarter: null,
    contributing_factors: [
      {
        factor: 'Strong Liquidity Buffer',
        impact: 'positive',
        description: '$42M current vs $25M minimum provides 68% headroom',
        weight: 50,
      },
      {
        factor: 'Consistent Growth',
        impact: 'positive',
        description: 'Liquidity has grown each of the past 4 months',
        weight: 30,
      },
      {
        factor: 'Stable Business Model',
        impact: 'positive',
        description: 'Holdings company structure provides diversified cash flows',
        weight: 20,
      },
    ],
    quarterly_projections: [
      { quarter: 'Q1 2025', projected_ratio: 43000000, breach_probability: 2, confidence: 92 },
      { quarter: 'Q2 2025', projected_ratio: 44500000, breach_probability: 3, confidence: 85 },
      { quarter: 'Q3 2025', projected_ratio: 45000000, breach_probability: 5, confidence: 78 },
    ],
    seasonal_patterns: [
      { quarter: 'Q4', typical_impact: 'neutral', description: 'Year-end settlements may temporarily reduce liquidity' },
      { quarter: 'Q2', typical_impact: 'positive', description: 'Dividend receipts boost cash position' },
    ],
    recommendations: [
      'Continue standard monitoring procedures',
      'No specific actions required',
    ],
    summary: 'Neptune Holdings maintains exceptionally strong liquidity well above covenant requirements. The consistent upward trend and substantial headroom indicate negligible breach risk for the foreseeable future.',
  },

  // Covenant 6: Sigma Holdings Interest Coverage - Critical risk, severe breach
  '6': {
    covenant_id: '6',
    prediction_date: '2024-12-08',
    breach_probability_2q: 95,
    breach_probability_3q: 92,
    overall_risk_level: 'critical',
    confidence_score: 95,
    projected_breach_quarter: 'Current',
    contributing_factors: [
      {
        factor: 'Severe Breach',
        impact: 'negative',
        description: 'Interest coverage at 1.4x vs 2.0x minimum (-30% headroom)',
        weight: 55,
      },
      {
        factor: 'Accelerating Decline',
        impact: 'negative',
        description: 'Dropped from 2.1x to 1.4x in 12 months',
        weight: 30,
      },
      {
        factor: 'Structural Issues',
        impact: 'negative',
        description: 'Declining EBITDA combined with high interest burden',
        weight: 15,
      },
    ],
    quarterly_projections: [
      { quarter: 'Q1 2025', projected_ratio: 1.3, breach_probability: 95, confidence: 95 },
      { quarter: 'Q2 2025', projected_ratio: 1.25, breach_probability: 92, confidence: 88 },
      { quarter: 'Q3 2025', projected_ratio: 1.2, breach_probability: 90, confidence: 80 },
    ],
    seasonal_patterns: [
      { quarter: 'Q1', typical_impact: 'negative', description: 'Seasonally weak period for ABL borrowers' },
      { quarter: 'Q4', typical_impact: 'neutral', description: 'Holiday period provides some uplift' },
    ],
    recommendations: [
      'URGENT: Escalate to senior credit committee immediately',
      'Engage workout and restructuring specialists',
      'Demand enhanced reporting and collateral monitoring',
      'Evaluate enforcement options and collateral position',
      'Prepare default notice documentation',
      'Consider participation sale to reduce exposure',
    ],
    summary: 'CRITICAL: Sigma Holdings is in severe default with interest coverage significantly below required minimum. The trajectory shows continued deterioration with no recovery indication. Immediate workout intervention required.',
  },
};

// Helper function to get prediction for a covenant
export function getMockPrediction(covenantId: string): BreachPrediction | undefined {
  return mockPredictions[covenantId];
}

// Helper function to get all predictions
export function getAllMockPredictions(): Record<string, BreachPrediction> {
  return mockPredictions;
}

// =============================================================================
// Covenant Benchmark Intelligence Network Mock Data
// =============================================================================

export const benchmarkDashboardStats: BenchmarkDashboardStats = {
  total_data_points: 12847,
  institutions_contributing: 156,
  industries_covered: 10,
  last_data_refresh: '2024-12-08T08:00:00Z',
  total_alerts: 8,
  tight_covenant_alerts: 3,
  loose_covenant_alerts: 2,
  market_shift_alerts: 3,
  covenants_benchmarked: 5,
  covenants_total: 6,
  benchmark_coverage_percentage: 83.3,
};

export const mockIndustryBenchmarks: IndustryBenchmark[] = [
  {
    id: 'bench-1',
    industry: 'manufacturing',
    company_size: 'mid_market',
    loan_type: 'term_loan',
    covenant_type: 'leverage_ratio',
    threshold_type: 'maximum',
    current_average: 4.2,
    current_median: 4.0,
    current_percentile_25: 3.5,
    current_percentile_75: 4.75,
    current_min: 2.5,
    current_max: 6.0,
    sample_size: 342,
    last_updated: '2024-12-08T08:00:00Z',
    historical_data: [
      { period: 'Q1 2023', average: 4.5, median: 4.25, percentile_25: 3.75, percentile_75: 5.0, min: 2.75, max: 6.5, sample_size: 298 },
      { period: 'Q2 2023', average: 4.4, median: 4.2, percentile_25: 3.7, percentile_75: 4.9, min: 2.7, max: 6.3, sample_size: 305 },
      { period: 'Q3 2023', average: 4.35, median: 4.15, percentile_25: 3.6, percentile_75: 4.85, min: 2.6, max: 6.2, sample_size: 318 },
      { period: 'Q4 2023', average: 4.3, median: 4.1, percentile_25: 3.55, percentile_75: 4.8, min: 2.55, max: 6.1, sample_size: 325 },
      { period: 'Q1 2024', average: 4.25, median: 4.05, percentile_25: 3.5, percentile_75: 4.78, min: 2.52, max: 6.05, sample_size: 332 },
      { period: 'Q2 2024', average: 4.22, median: 4.02, percentile_25: 3.5, percentile_75: 4.76, min: 2.5, max: 6.02, sample_size: 338 },
      { period: 'Q3 2024', average: 4.2, median: 4.0, percentile_25: 3.5, percentile_75: 4.75, min: 2.5, max: 6.0, sample_size: 342 },
    ],
    trend_direction: 'declining',
    trend_change_12m: -6.7,
  },
  {
    id: 'bench-2',
    industry: 'manufacturing',
    company_size: 'mid_market',
    loan_type: 'term_loan',
    covenant_type: 'interest_coverage',
    threshold_type: 'minimum',
    current_average: 2.8,
    current_median: 2.75,
    current_percentile_25: 2.25,
    current_percentile_75: 3.25,
    current_min: 1.75,
    current_max: 4.5,
    sample_size: 328,
    last_updated: '2024-12-08T08:00:00Z',
    historical_data: [
      { period: 'Q1 2023', average: 2.6, median: 2.5, percentile_25: 2.0, percentile_75: 3.0, min: 1.5, max: 4.0, sample_size: 285 },
      { period: 'Q2 2023', average: 2.65, median: 2.55, percentile_25: 2.05, percentile_75: 3.05, min: 1.55, max: 4.1, sample_size: 292 },
      { period: 'Q3 2023', average: 2.7, median: 2.6, percentile_25: 2.1, percentile_75: 3.1, min: 1.6, max: 4.2, sample_size: 305 },
      { period: 'Q4 2023', average: 2.72, median: 2.65, percentile_25: 2.15, percentile_75: 3.15, min: 1.65, max: 4.3, sample_size: 312 },
      { period: 'Q1 2024', average: 2.75, median: 2.68, percentile_25: 2.18, percentile_75: 3.18, min: 1.68, max: 4.35, sample_size: 318 },
      { period: 'Q2 2024', average: 2.78, median: 2.72, percentile_25: 2.22, percentile_75: 3.22, min: 1.72, max: 4.42, sample_size: 324 },
      { period: 'Q3 2024', average: 2.8, median: 2.75, percentile_25: 2.25, percentile_75: 3.25, min: 1.75, max: 4.5, sample_size: 328 },
    ],
    trend_direction: 'improving',
    trend_change_12m: 7.7,
  },
  {
    id: 'bench-3',
    industry: 'technology',
    company_size: 'mid_market',
    loan_type: 'revolving_credit',
    covenant_type: 'leverage_ratio',
    threshold_type: 'maximum',
    current_average: 3.5,
    current_median: 3.25,
    current_percentile_25: 2.75,
    current_percentile_75: 4.0,
    current_min: 2.0,
    current_max: 5.5,
    sample_size: 256,
    last_updated: '2024-12-08T08:00:00Z',
    historical_data: [
      { period: 'Q1 2023', average: 3.8, median: 3.5, percentile_25: 3.0, percentile_75: 4.25, min: 2.25, max: 6.0, sample_size: 218 },
      { period: 'Q2 2023', average: 3.75, median: 3.45, percentile_25: 2.95, percentile_75: 4.2, min: 2.2, max: 5.9, sample_size: 225 },
      { period: 'Q3 2023', average: 3.7, median: 3.4, percentile_25: 2.9, percentile_75: 4.15, min: 2.15, max: 5.8, sample_size: 232 },
      { period: 'Q4 2023', average: 3.65, median: 3.38, percentile_25: 2.85, percentile_75: 4.1, min: 2.1, max: 5.7, sample_size: 240 },
      { period: 'Q1 2024', average: 3.6, median: 3.32, percentile_25: 2.82, percentile_75: 4.05, min: 2.05, max: 5.6, sample_size: 245 },
      { period: 'Q2 2024', average: 3.55, median: 3.28, percentile_25: 2.78, percentile_75: 4.02, min: 2.02, max: 5.55, sample_size: 250 },
      { period: 'Q3 2024', average: 3.5, median: 3.25, percentile_25: 2.75, percentile_75: 4.0, min: 2.0, max: 5.5, sample_size: 256 },
    ],
    trend_direction: 'declining',
    trend_change_12m: -7.9,
  },
  {
    id: 'bench-4',
    industry: 'manufacturing',
    company_size: 'mid_market',
    loan_type: 'term_loan',
    covenant_type: 'fixed_charge_coverage',
    threshold_type: 'minimum',
    current_average: 1.25,
    current_median: 1.2,
    current_percentile_25: 1.1,
    current_percentile_75: 1.35,
    current_min: 1.0,
    current_max: 1.75,
    sample_size: 298,
    last_updated: '2024-12-08T08:00:00Z',
    historical_data: [
      { period: 'Q1 2023', average: 1.15, median: 1.1, percentile_25: 1.0, percentile_75: 1.25, min: 0.9, max: 1.6, sample_size: 265 },
      { period: 'Q2 2023', average: 1.17, median: 1.12, percentile_25: 1.02, percentile_75: 1.27, min: 0.92, max: 1.63, sample_size: 272 },
      { period: 'Q3 2023', average: 1.19, median: 1.14, percentile_25: 1.04, percentile_75: 1.29, min: 0.94, max: 1.66, sample_size: 278 },
      { period: 'Q4 2023', average: 1.21, median: 1.16, percentile_25: 1.06, percentile_75: 1.31, min: 0.96, max: 1.69, sample_size: 284 },
      { period: 'Q1 2024', average: 1.22, median: 1.17, percentile_25: 1.07, percentile_75: 1.32, min: 0.97, max: 1.71, sample_size: 289 },
      { period: 'Q2 2024', average: 1.24, median: 1.19, percentile_25: 1.09, percentile_75: 1.34, min: 0.99, max: 1.73, sample_size: 294 },
      { period: 'Q3 2024', average: 1.25, median: 1.2, percentile_25: 1.1, percentile_75: 1.35, min: 1.0, max: 1.75, sample_size: 298 },
    ],
    trend_direction: 'improving',
    trend_change_12m: 8.7,
  },
  {
    id: 'bench-5',
    industry: 'healthcare',
    company_size: 'large',
    loan_type: 'term_loan',
    covenant_type: 'leverage_ratio',
    threshold_type: 'maximum',
    current_average: 4.8,
    current_median: 4.5,
    current_percentile_25: 4.0,
    current_percentile_75: 5.5,
    current_min: 3.0,
    current_max: 7.0,
    sample_size: 189,
    last_updated: '2024-12-08T08:00:00Z',
    historical_data: [
      { period: 'Q1 2023', average: 5.2, median: 5.0, percentile_25: 4.5, percentile_75: 6.0, min: 3.5, max: 7.5, sample_size: 165 },
      { period: 'Q2 2023', average: 5.1, median: 4.9, percentile_25: 4.4, percentile_75: 5.9, min: 3.4, max: 7.4, sample_size: 170 },
      { period: 'Q3 2023', average: 5.0, median: 4.8, percentile_25: 4.3, percentile_75: 5.7, min: 3.3, max: 7.3, sample_size: 175 },
      { period: 'Q4 2023', average: 4.95, median: 4.7, percentile_25: 4.2, percentile_75: 5.6, min: 3.2, max: 7.2, sample_size: 180 },
      { period: 'Q1 2024', average: 4.9, median: 4.65, percentile_25: 4.1, percentile_75: 5.55, min: 3.1, max: 7.1, sample_size: 183 },
      { period: 'Q2 2024', average: 4.85, median: 4.58, percentile_25: 4.05, percentile_75: 5.52, min: 3.05, max: 7.05, sample_size: 186 },
      { period: 'Q3 2024', average: 4.8, median: 4.5, percentile_25: 4.0, percentile_75: 5.5, min: 3.0, max: 7.0, sample_size: 189 },
    ],
    trend_direction: 'declining',
    trend_change_12m: -7.7,
  },
];

export const mockBenchmarkTrends: BenchmarkTrend[] = [
  {
    covenant_type: 'leverage_ratio',
    industry: 'manufacturing',
    data_points: [
      { period: 'Q1 2023', average: 4.5, median: 4.25, percentile_25: 3.75, percentile_75: 5.0, min: 2.75, max: 6.5, sample_size: 298 },
      { period: 'Q2 2023', average: 4.4, median: 4.2, percentile_25: 3.7, percentile_75: 4.9, min: 2.7, max: 6.3, sample_size: 305 },
      { period: 'Q3 2023', average: 4.35, median: 4.15, percentile_25: 3.6, percentile_75: 4.85, min: 2.6, max: 6.2, sample_size: 318 },
      { period: 'Q4 2023', average: 4.3, median: 4.1, percentile_25: 3.55, percentile_75: 4.8, min: 2.55, max: 6.1, sample_size: 325 },
      { period: 'Q1 2024', average: 4.25, median: 4.05, percentile_25: 3.5, percentile_75: 4.78, min: 2.52, max: 6.05, sample_size: 332 },
      { period: 'Q2 2024', average: 4.22, median: 4.02, percentile_25: 3.5, percentile_75: 4.76, min: 2.5, max: 6.02, sample_size: 338 },
      { period: 'Q3 2024', average: 4.2, median: 4.0, percentile_25: 3.5, percentile_75: 4.75, min: 2.5, max: 6.0, sample_size: 342 },
    ],
    trend_direction: 'declining',
    trend_change_percentage: -6.7,
  },
  {
    covenant_type: 'interest_coverage',
    industry: 'manufacturing',
    data_points: [
      { period: 'Q1 2023', average: 2.6, median: 2.5, percentile_25: 2.0, percentile_75: 3.0, min: 1.5, max: 4.0, sample_size: 285 },
      { period: 'Q2 2023', average: 2.65, median: 2.55, percentile_25: 2.05, percentile_75: 3.05, min: 1.55, max: 4.1, sample_size: 292 },
      { period: 'Q3 2023', average: 2.7, median: 2.6, percentile_25: 2.1, percentile_75: 3.1, min: 1.6, max: 4.2, sample_size: 305 },
      { period: 'Q4 2023', average: 2.72, median: 2.65, percentile_25: 2.15, percentile_75: 3.15, min: 1.65, max: 4.3, sample_size: 312 },
      { period: 'Q1 2024', average: 2.75, median: 2.68, percentile_25: 2.18, percentile_75: 3.18, min: 1.68, max: 4.35, sample_size: 318 },
      { period: 'Q2 2024', average: 2.78, median: 2.72, percentile_25: 2.22, percentile_75: 3.22, min: 1.72, max: 4.42, sample_size: 324 },
      { period: 'Q3 2024', average: 2.8, median: 2.75, percentile_25: 2.25, percentile_75: 3.25, min: 1.75, max: 4.5, sample_size: 328 },
    ],
    trend_direction: 'improving',
    trend_change_percentage: 7.7,
  },
  {
    covenant_type: 'fixed_charge_coverage',
    industry: 'manufacturing',
    data_points: [
      { period: 'Q1 2023', average: 1.15, median: 1.1, percentile_25: 1.0, percentile_75: 1.25, min: 0.9, max: 1.6, sample_size: 265 },
      { period: 'Q2 2023', average: 1.17, median: 1.12, percentile_25: 1.02, percentile_75: 1.27, min: 0.92, max: 1.63, sample_size: 272 },
      { period: 'Q3 2023', average: 1.19, median: 1.14, percentile_25: 1.04, percentile_75: 1.29, min: 0.94, max: 1.66, sample_size: 278 },
      { period: 'Q4 2023', average: 1.21, median: 1.16, percentile_25: 1.06, percentile_75: 1.31, min: 0.96, max: 1.69, sample_size: 284 },
      { period: 'Q1 2024', average: 1.22, median: 1.17, percentile_25: 1.07, percentile_75: 1.32, min: 0.97, max: 1.71, sample_size: 289 },
      { period: 'Q2 2024', average: 1.24, median: 1.19, percentile_25: 1.09, percentile_75: 1.34, min: 0.99, max: 1.73, sample_size: 294 },
      { period: 'Q3 2024', average: 1.25, median: 1.2, percentile_25: 1.1, percentile_75: 1.35, min: 1.0, max: 1.75, sample_size: 298 },
    ],
    trend_direction: 'improving',
    trend_change_percentage: 8.7,
  },
];

export const mockCovenantBenchmarkComparisons: CovenantBenchmarkComparison[] = [
  {
    covenant_id: '1',
    covenant_name: 'Leverage Ratio',
    covenant_type: 'leverage_ratio',
    facility_id: '1',
    facility_name: 'ABC Holdings - Term Loan A',
    borrower_name: 'ABC Holdings LLC',
    borrower_threshold: 4.0,
    borrower_current_value: 3.2,
    borrower_headroom: 20.0,
    benchmark_id: 'bench-1',
    industry: 'manufacturing',
    company_size: 'mid_market',
    percentile_rank: 52,
    market_position: 'market',
    deviation_from_median: 0.0,
    deviation_from_average: -4.8,
    comparison_summary: 'ABC Holdings\' leverage covenant is market-standard at 4.0x maximum, sitting at the 52nd percentile for mid-market manufacturing term loans. Current performance at 3.2x provides healthy headroom.',
  },
  {
    covenant_id: '2',
    covenant_name: 'Interest Coverage Ratio',
    covenant_type: 'interest_coverage',
    facility_id: '1',
    facility_name: 'ABC Holdings - Term Loan A',
    borrower_name: 'ABC Holdings LLC',
    borrower_threshold: 2.5,
    borrower_current_value: 3.8,
    borrower_headroom: 52.0,
    benchmark_id: 'bench-2',
    industry: 'manufacturing',
    company_size: 'mid_market',
    percentile_rank: 35,
    market_position: 'tight',
    deviation_from_median: -9.1,
    deviation_from_average: -10.7,
    comparison_summary: 'ABC Holdings\' interest coverage covenant at 2.5x minimum is tighter than market median (2.75x), placing it at the 35th percentile. This provides additional protection for lenders.',
  },
  {
    covenant_id: '3',
    covenant_name: 'Leverage Ratio',
    covenant_type: 'leverage_ratio',
    facility_id: '2',
    facility_name: 'XYZ Corp Revolver',
    borrower_name: 'XYZ Corporation',
    borrower_threshold: 3.5,
    borrower_current_value: 3.1,
    borrower_headroom: 11.4,
    benchmark_id: 'bench-3',
    industry: 'technology',
    company_size: 'mid_market',
    percentile_rank: 28,
    market_position: 'tight',
    deviation_from_median: 7.7,
    deviation_from_average: 0.0,
    comparison_summary: 'XYZ Corporation\'s leverage covenant at 3.5x is tighter than the technology sector median of 3.25x. At the 28th percentile, this represents stricter-than-market terms. Current value of 3.1x shows limited headroom.',
  },
  {
    covenant_id: '4',
    covenant_name: 'Fixed Charge Coverage',
    covenant_type: 'fixed_charge_coverage',
    facility_id: '3',
    facility_name: 'Delta Manufacturing TL',
    borrower_name: 'Delta Manufacturing Co',
    borrower_threshold: 1.2,
    borrower_current_value: 1.05,
    borrower_headroom: -12.5,
    benchmark_id: 'bench-4',
    industry: 'manufacturing',
    company_size: 'mid_market',
    percentile_rank: 48,
    market_position: 'market',
    deviation_from_median: 0.0,
    deviation_from_average: -4.0,
    comparison_summary: 'Delta Manufacturing\'s FCCR covenant at 1.2x is close to market median (1.2x). However, the borrower is currently in breach at 1.05x, requiring immediate attention.',
  },
  {
    covenant_id: '5',
    covenant_name: 'Minimum Liquidity',
    covenant_type: 'minimum_liquidity',
    facility_id: '4',
    facility_name: 'Neptune Holdings TL',
    borrower_name: 'Neptune Holdings Inc',
    borrower_threshold: 25000000,
    borrower_current_value: 42000000,
    borrower_headroom: 68.0,
    benchmark_id: 'bench-5',
    industry: 'healthcare',
    company_size: 'large',
    percentile_rank: 72,
    market_position: 'loose',
    deviation_from_median: 15.5,
    deviation_from_average: 12.3,
    comparison_summary: 'Neptune Holdings\' liquidity covenant is more borrower-friendly than market. At the 72nd percentile, this reflects the company\'s strong market position during negotiation.',
  },
];

export const mockMarketComparisonAlerts: MarketComparisonAlert[] = [
  {
    id: 'alert-1',
    covenant_id: '2',
    covenant_name: 'Interest Coverage Ratio',
    facility_name: 'ABC Holdings - Term Loan A',
    borrower_name: 'ABC Holdings LLC',
    covenant_type: 'interest_coverage',
    alert_type: 'unusually_tight',
    severity: 'info',
    borrower_value: 2.5,
    market_median: 2.75,
    market_average: 2.8,
    percentile_rank: 35,
    title: 'Covenant Tighter Than Market',
    message: 'Interest coverage covenant at 2.5x is 9% tighter than the market median of 2.75x for mid-market manufacturing term loans.',
    recommendation: 'Consider this as additional credit protection. May present opportunity for covenant relaxation during renewal if performance remains strong.',
    created_at: '2024-12-07T14:30:00Z',
    acknowledged: false,
    acknowledged_at: null,
    acknowledged_by: null,
  },
  {
    id: 'alert-2',
    covenant_id: '3',
    covenant_name: 'Leverage Ratio',
    facility_name: 'XYZ Corp Revolver',
    borrower_name: 'XYZ Corporation',
    covenant_type: 'leverage_ratio',
    alert_type: 'unusually_tight',
    severity: 'warning',
    borrower_value: 3.5,
    market_median: 3.25,
    market_average: 3.5,
    percentile_rank: 28,
    title: 'Leverage Covenant Significantly Tighter',
    message: 'Leverage covenant at 3.5x is at the 28th percentile for technology revolvers. Combined with declining headroom trend, this poses heightened breach risk.',
    recommendation: 'Monitor closely given the borrower\'s deteriorating leverage trend. Early engagement on potential covenant amendment may be prudent.',
    created_at: '2024-12-06T09:15:00Z',
    acknowledged: true,
    acknowledged_at: '2024-12-06T11:30:00Z',
    acknowledged_by: 'john.smith@bank.com',
  },
  {
    id: 'alert-3',
    covenant_id: '5',
    covenant_name: 'Minimum Liquidity',
    facility_name: 'Neptune Holdings TL',
    borrower_name: 'Neptune Holdings Inc',
    covenant_type: 'minimum_liquidity',
    alert_type: 'unusually_loose',
    severity: 'info',
    borrower_value: 25000000,
    market_median: 21500000,
    market_average: 22000000,
    percentile_rank: 72,
    title: 'Liquidity Covenant Looser Than Market',
    message: 'Minimum liquidity covenant at $25M is at the 72nd percentile, meaning 72% of similar deals have tighter liquidity requirements.',
    recommendation: 'While this reflects strong borrower negotiating position, consider tightening at renewal if market conditions allow.',
    created_at: '2024-12-05T16:45:00Z',
    acknowledged: false,
    acknowledged_at: null,
    acknowledged_by: null,
  },
  {
    id: 'alert-4',
    covenant_id: '1',
    covenant_name: 'Leverage Ratio',
    facility_name: 'ABC Holdings - Term Loan A',
    borrower_name: 'ABC Holdings LLC',
    covenant_type: 'leverage_ratio',
    alert_type: 'market_shift',
    severity: 'info',
    borrower_value: 4.0,
    market_median: 4.0,
    market_average: 4.2,
    percentile_rank: 52,
    title: 'Market Leverage Thresholds Tightening',
    message: 'Industry-wide leverage ratios have tightened 6.7% over the past 12 months. Your 4.0x threshold, previously above-market, is now market-standard.',
    recommendation: 'Be aware of shifting market dynamics. Future deals may require tighter covenants to remain competitive.',
    created_at: '2024-12-04T10:00:00Z',
    acknowledged: true,
    acknowledged_at: '2024-12-04T14:20:00Z',
    acknowledged_by: 'sarah.jones@bank.com',
  },
  {
    id: 'alert-5',
    covenant_id: '4',
    covenant_name: 'Fixed Charge Coverage',
    facility_name: 'Delta Manufacturing TL',
    borrower_name: 'Delta Manufacturing Co',
    covenant_type: 'fixed_charge_coverage',
    alert_type: 'trend_deviation',
    severity: 'critical',
    borrower_value: 1.05,
    market_median: 1.2,
    market_average: 1.25,
    percentile_rank: 15,
    title: 'Borrower Performance Below Market Peers',
    message: 'Delta Manufacturing\'s FCCR at 1.05x places them at the 15th percentile of peer performance. Market-standard threshold is 1.2x and they are in breach.',
    recommendation: 'Immediate action required. The borrower is underperforming significantly vs. peers, validating the covenant breach. Workout discussions should begin.',
    created_at: '2024-12-08T08:00:00Z',
    acknowledged: false,
    acknowledged_at: null,
    acknowledged_by: null,
  },
  {
    id: 'alert-6',
    covenant_id: '6',
    covenant_name: 'Interest Coverage',
    facility_name: 'Sigma Holdings ABL',
    borrower_name: 'Sigma Holdings Inc',
    covenant_type: 'interest_coverage',
    alert_type: 'trend_deviation',
    severity: 'critical',
    borrower_value: 1.4,
    market_median: 2.75,
    market_average: 2.8,
    percentile_rank: 5,
    title: 'Severe Underperformance vs. Market',
    message: 'Sigma Holdings\' interest coverage at 1.4x is at the 5th percentile of peer performance. Market minimum threshold is typically 2.0x.',
    recommendation: 'Critical situation requiring immediate escalation. Borrower performance is severely below market and in significant breach.',
    created_at: '2024-12-08T08:00:00Z',
    acknowledged: false,
    acknowledged_at: null,
    acknowledged_by: null,
  },
];

export const mockNetworkContributionStatus: NetworkContributionStatus = {
  institution_id: 'inst-001',
  institution_name: 'First National Bank',
  facilities_contributed: 42,
  covenants_contributed: 156,
  last_contribution_date: '2024-12-07T18:00:00Z',
  access_tier: 'premium',
  benchmark_access_level: 'detailed',
  can_export_data: true,
  can_view_trends: true,
  can_receive_alerts: true,
};

// Helper functions for benchmark data
export function getMockBenchmarkForCovenant(covenantId: string): CovenantBenchmarkComparison | undefined {
  return mockCovenantBenchmarkComparisons.find(c => c.covenant_id === covenantId);
}

export function getMockBenchmarksByIndustry(industry: string): IndustryBenchmark[] {
  return mockIndustryBenchmarks.filter(b => b.industry === industry);
}

export function getMockBenchmarkTrendByType(covenantType: string): BenchmarkTrend | undefined {
  return mockBenchmarkTrends.find(t => t.covenant_type === covenantType);
}

export function getMockAlertsForCovenant(covenantId: string): MarketComparisonAlert[] {
  return mockMarketComparisonAlerts.filter(a => a.covenant_id === covenantId);
}

export function getUnacknowledgedAlerts(): MarketComparisonAlert[] {
  return mockMarketComparisonAlerts.filter(a => !a.acknowledged);
}

// =============================================================================
// Market Thermometer Mock Data
// =============================================================================

import type {
  MarketThermometerReading,
  MacroDashboardStats,
  IndustryHealthMetrics,
  HeadroomDistribution,
  SystematicTrend,
  MarketConditionAlert,
  EarlyWarningSignal,
} from './types';

export const mockMarketThermometerReading: MarketThermometerReading = {
  id: 'reading-2024-q4',
  reading_date: '2024-12-08T00:00:00Z',

  overall_temperature: 'cold',
  overall_score: 32,

  industry_readings: [
    {
      industry: 'manufacturing',
      temperature: 'cold',
      score: 28,
      change_from_last_quarter: -8,
    },
    {
      industry: 'technology',
      temperature: 'neutral',
      score: 48,
      change_from_last_quarter: -2,
    },
    {
      industry: 'healthcare',
      temperature: 'cold',
      score: 35,
      change_from_last_quarter: -12,
    },
    {
      industry: 'retail',
      temperature: 'very_cold',
      score: 18,
      change_from_last_quarter: -15,
    },
    {
      industry: 'financial_services',
      temperature: 'neutral',
      score: 52,
      change_from_last_quarter: 3,
    },
  ],

  covenant_type_readings: [
    {
      covenant_type: 'leverage_ratio',
      temperature: 'cold',
      score: 30,
      at_risk_percentage: 32,
    },
    {
      covenant_type: 'interest_coverage',
      temperature: 'neutral',
      score: 45,
      at_risk_percentage: 22,
    },
    {
      covenant_type: 'fixed_charge_coverage',
      temperature: 'very_cold',
      score: 25,
      at_risk_percentage: 38,
    },
    {
      covenant_type: 'debt_service_coverage',
      temperature: 'cold',
      score: 33,
      at_risk_percentage: 28,
    },
  ],

  indicators: {
    average_headroom: 18.5,
    headroom_change_3m: -5.2,
    at_risk_percentage: 28.7,
    at_risk_change_3m: 8.3,
    breach_percentage: 6.2,
    breach_change_3m: 2.1,
    threshold_tightening_percentage: 12.5,
  },

  market_summary: 'Credit markets showing elevated stress with 30% of manufacturing leverage covenants entering at-risk status this quarter. Aggregate headroom compressed 5.2% across the network, signaling systematic tightening. Retail sector experiencing severe deterioration.',

  key_trends: [
    'Manufacturing leverage covenants compressed from 22% to 32% at-risk over one quarter',
    'Healthcare sector showing accelerating deterioration with 12-point temperature drop',
    'Fixed charge coverage covenants under most pressure across all industries',
    'Retail sector in severe stress with 15-point temperature decline',
    'Technology sector remains relatively stable as defensive position',
  ],

  risk_outlook: 'deteriorating',

  total_covenants_analyzed: 12847,
  institutions_contributing: 156,
};

export const mockMacroDashboardStats: MacroDashboardStats = {
  as_of_date: '2024-12-08T00:00:00Z',

  market_temperature: 'cold',
  market_health_score: 32,

  total_covenants_tracked: 12847,
  total_institutions: 156,
  total_industries: 10,

  healthy_covenants_percentage: 45.2,
  moderate_covenants_percentage: 26.1,
  at_risk_covenants_percentage: 22.5,
  breached_covenants_percentage: 6.2,

  at_risk_change_from_last_quarter: 8.3,
  breach_change_from_last_quarter: 2.1,
  average_headroom_change_from_last_quarter: -5.2,

  industries_in_stress: 3,
  industries_stable: 5,
  industries_healthy: 2,

  active_market_alerts: 12,
  critical_alerts: 3,

  most_stressed_industry: 'retail',
  most_stressed_covenant_type: 'fixed_charge_coverage',
  institutions_with_systemic_issues: 8,
};

export const mockIndustryHealthMetrics: IndustryHealthMetrics[] = [
  {
    industry: 'manufacturing',
    as_of_date: '2024-12-08T00:00:00Z',

    overall_health_score: 42,
    credit_condition_index: 38,

    average_headroom_all_covenants: 16.8,
    median_headroom_all_covenants: 14.2,
    covenants_at_risk_percentage: 32.1,
    covenants_breached_percentage: 7.5,

    headroom_trend_3m: 'declining',
    headroom_change_3m_percentage: -8.5,
    headroom_trend_12m: 'declining',
    headroom_change_12m_percentage: -15.2,

    stress_level: 'elevated',
    institutions_with_breaches: 24,
    institutions_with_at_risk: 62,
    total_institutions: 89,

    predicted_deterioration_next_quarter: true,
    predicted_deterioration_probability: 72,
    early_warning_signals: [
      'Leverage covenant headroom compressed 8.5% in Q4',
      '30% of leverage covenants now at-risk vs 22% in Q3',
      'FCCR breaches accelerating across mid-market borrowers',
      'Working capital pressures increasing',
    ],

    relative_to_market: 'underperforming',
    rank_among_industries: 8,

    covenant_breakdown: [
      {
        covenant_type: 'leverage_ratio',
        average_headroom: 15.2,
        at_risk_percentage: 35.8,
        trend: 'declining',
      },
      {
        covenant_type: 'fixed_charge_coverage',
        average_headroom: 12.5,
        at_risk_percentage: 42.3,
        trend: 'declining',
      },
      {
        covenant_type: 'interest_coverage',
        average_headroom: 22.1,
        at_risk_percentage: 24.1,
        trend: 'stable',
      },
    ],
  },
  {
    industry: 'technology',
    as_of_date: '2024-12-08T00:00:00Z',

    overall_health_score: 68,
    credit_condition_index: 65,

    average_headroom_all_covenants: 28.5,
    median_headroom_all_covenants: 26.3,
    covenants_at_risk_percentage: 15.2,
    covenants_breached_percentage: 3.1,

    headroom_trend_3m: 'stable',
    headroom_change_3m_percentage: -1.2,
    headroom_trend_12m: 'stable',
    headroom_change_12m_percentage: -3.5,

    stress_level: 'moderate',
    institutions_with_breaches: 8,
    institutions_with_at_risk: 24,
    total_institutions: 52,

    predicted_deterioration_next_quarter: false,
    predicted_deterioration_probability: 28,
    early_warning_signals: [],

    relative_to_market: 'outperforming',
    rank_among_industries: 2,

    covenant_breakdown: [
      {
        covenant_type: 'leverage_ratio',
        average_headroom: 32.5,
        at_risk_percentage: 12.8,
        trend: 'stable',
      },
      {
        covenant_type: 'interest_coverage',
        average_headroom: 28.2,
        at_risk_percentage: 16.5,
        trend: 'improving',
      },
    ],
  },
  {
    industry: 'retail',
    as_of_date: '2024-12-08T00:00:00Z',

    overall_health_score: 22,
    credit_condition_index: 18,

    average_headroom_all_covenants: 9.2,
    median_headroom_all_covenants: 7.5,
    covenants_at_risk_percentage: 52.3,
    covenants_breached_percentage: 14.8,

    headroom_trend_3m: 'declining',
    headroom_change_3m_percentage: -18.5,
    headroom_trend_12m: 'declining',
    headroom_change_12m_percentage: -28.7,

    stress_level: 'high',
    institutions_with_breaches: 18,
    institutions_with_at_risk: 38,
    total_institutions: 42,

    predicted_deterioration_next_quarter: true,
    predicted_deterioration_probability: 88,
    early_warning_signals: [
      'Over 50% of retail leverage covenants now at-risk',
      'Headroom compressed 18.5% in single quarter',
      'Breach rate doubled from 7% to 14.8% in Q4',
      'Consumer spending pressures intensifying',
      'Inventory management challenges widespread',
    ],

    relative_to_market: 'underperforming',
    rank_among_industries: 10,

    covenant_breakdown: [
      {
        covenant_type: 'leverage_ratio',
        average_headroom: 8.5,
        at_risk_percentage: 58.2,
        trend: 'declining',
      },
      {
        covenant_type: 'fixed_charge_coverage',
        average_headroom: 6.8,
        at_risk_percentage: 62.5,
        trend: 'declining',
      },
      {
        covenant_type: 'interest_coverage',
        average_headroom: 12.5,
        at_risk_percentage: 45.3,
        trend: 'declining',
      },
    ],
  },
];

export const mockHeadroomDistributions: HeadroomDistribution[] = [
  {
    covenant_type: 'leverage_ratio',
    industry: 'manufacturing',

    mean_headroom: 16.8,
    median_headroom: 14.2,
    std_deviation: 12.5,

    percentile_10: -5.2,
    percentile_25: 8.5,
    percentile_50: 14.2,
    percentile_75: 24.8,
    percentile_90: 35.2,

    at_risk_percentage: 35.8,
    breached_percentage: 8.5,
    healthy_percentage: 32.5,

    sample_size: 3421,
    as_of_date: '2024-12-08T00:00:00Z',
  },
  {
    covenant_type: 'fixed_charge_coverage',
    industry: 'manufacturing',

    mean_headroom: 12.5,
    median_headroom: 10.8,
    std_deviation: 14.8,

    percentile_10: -12.5,
    percentile_25: 5.2,
    percentile_50: 10.8,
    percentile_75: 20.5,
    percentile_90: 28.3,

    at_risk_percentage: 42.3,
    breached_percentage: 11.2,
    healthy_percentage: 25.8,

    sample_size: 2985,
    as_of_date: '2024-12-08T00:00:00Z',
  },
];

export const mockSystematicTrends: SystematicTrend[] = [
  {
    id: 'trend-mfg-leverage-2024q4',
    covenant_type: 'leverage_ratio',
    industry: 'manufacturing',

    trend_direction: 'tightening',
    trend_strength: 'strong',

    threshold_change_percentage: -6.7,
    headroom_change_percentage: -8.5,
    at_risk_delta: 8.3,

    period_start: '2024-01-01',
    period_end: '2024-12-08',
    quarters_analyzed: 4,

    summary: 'Manufacturing leverage covenants experiencing systematic tightening with strong intensity. Average threshold compressed 6.7% while actual headroom deteriorated 8.5%, creating a double-compression effect. At-risk population increased 8.3 percentage points.',

    contributing_factors: [
      'Increased debt levels to finance inventory buildup',
      'EBITDA pressures from margin compression',
      'Rising interest rates increasing debt service burden',
      'Supply chain disruptions affecting profitability',
      'Lenders demanding tighter covenants on new originations',
    ],
  },
  {
    id: 'trend-retail-all-2024q4',
    covenant_type: 'leverage_ratio',
    industry: 'retail',

    trend_direction: 'tightening',
    trend_strength: 'strong',

    threshold_change_percentage: -12.5,
    headroom_change_percentage: -18.5,
    at_risk_delta: 15.8,

    period_start: '2024-01-01',
    period_end: '2024-12-08',
    quarters_analyzed: 4,

    summary: 'Retail sector experiencing severe systematic stress. Covenant thresholds tightened 12.5% while borrower performance deteriorated 18.5%, resulting in 15.8 percentage point increase in at-risk covenants.',

    contributing_factors: [
      'Weak consumer spending environment',
      'E-commerce margin pressures',
      'High inventory levels reducing liquidity',
      'Store closure costs impacting EBITDA',
      'Credit market repricing retail risk higher',
    ],
  },
];

export const mockMarketConditionAlerts: MarketConditionAlert[] = [
  {
    id: 'alert-mkt-001',
    alert_type: 'systemic_stress',
    severity: 'critical',

    industry: 'manufacturing',
    covenant_type: 'leverage_ratio',

    affected_institution_count: 47,
    affected_covenant_count: 1156,
    affected_percentage: 30.2,

    title: 'Manufacturing Leverage Covenants Enter Systemic Stress',
    message: '30% of manufacturing leverage covenants entered at-risk status this quarter, affecting 47 institutions and 1,156 individual covenants. This represents an 8.3 percentage point increase from Q3 2024.',
    impact_summary: 'Widespread covenant stress signals macroeconomic headwinds in manufacturing sector. This pattern preceded the 2020 recession and 2008 financial crisis by 2-3 quarters.',
    recommendations: [
      'Increase monitoring frequency for manufacturing portfolio exposures',
      'Review concentration risk in manufacturing sector',
      'Prepare for potential wave of amendment/waiver requests',
      'Consider reducing new manufacturing originations',
      'Evaluate recovery scenarios for at-risk credits',
    ],

    triggered_at: '2024-12-08T08:00:00Z',
    trigger_condition: 'at_risk_percentage > 30% AND at_risk_delta > 8%',
    historical_context: 'Similar systemic stress events occurred in Q1 2020 (COVID-19), Q4 2015 (oil price collapse), and Q3 2008 (financial crisis). Average lead time to recession: 2.3 quarters.',

    acknowledged: false,
    acknowledged_at: null,
    acknowledged_by: null,
  },
  {
    id: 'alert-mkt-002',
    alert_type: 'sector_deterioration',
    severity: 'critical',

    industry: 'retail',
    covenant_type: 'all',

    affected_institution_count: 38,
    affected_covenant_count: 892,
    affected_percentage: 52.3,

    title: 'Retail Sector in Severe Distress',
    message: 'Over 52% of retail covenants now at-risk, with breach rate at 14.8%. Headroom compressed 18.5% in single quarter. This is the highest stress level recorded for retail since 2008.',
    impact_summary: 'Retail sector showing signs of systemic distress. Historical patterns suggest potential for cascading defaults if conditions persist for 1-2 additional quarters.',
    recommendations: [
      'URGENT: Review all retail exposures for potential credit deterioration',
      'Elevate retail credits to enhanced monitoring status',
      'Prepare workout strategies for most vulnerable credits',
      'Consider hedging retail sector exposure',
      'Halt new retail originations pending sector stabilization',
    ],

    triggered_at: '2024-12-08T08:00:00Z',
    trigger_condition: 'at_risk_percentage > 50% AND breach_percentage > 12%',
    historical_context: 'Last time retail at-risk percentage exceeded 50% was Q4 2008. That episode resulted in 23% default rate within 12 months.',

    acknowledged: false,
    acknowledged_at: null,
    acknowledged_by: null,
  },
  {
    id: 'alert-mkt-003',
    alert_type: 'widespread_tightening',
    severity: 'warning',

    industry: 'all',
    covenant_type: 'fixed_charge_coverage',

    affected_institution_count: 118,
    affected_covenant_count: 3247,
    affected_percentage: 38.2,

    title: 'Fixed Charge Coverage Covenants Tightening Across All Sectors',
    message: 'FCCR covenants showing systematic tightening across 8 of 10 industries. Average headroom declined 6.8% with 38.2% now at-risk. This broad-based pattern indicates economy-wide credit stress.',
    impact_summary: 'Cross-sector FCCR stress suggests macroeconomic factors (rising rates, margin pressure) rather than sector-specific issues. Predicts economic slowdown 1-2 quarters ahead.',
    recommendations: [
      'Review portfolio-wide FCCR exposure',
      'Prepare for increased amendment activity',
      'Consider macroeconomic scenario planning',
      'Adjust origination risk appetite accordingly',
    ],

    triggered_at: '2024-12-08T08:00:00Z',
    trigger_condition: 'multi_sector_stress AND covenant_type = FCCR',
    historical_context: 'Widespread FCCR stress preceded Q2 2020 and Q1 2016 credit cycles. Average advance warning: 1.5 quarters.',

    acknowledged: true,
    acknowledged_at: '2024-12-08T10:30:00Z',
    acknowledged_by: 'chief.risk.officer@bank.com',
  },
];

export const mockEarlyWarningSignals: EarlyWarningSignal[] = [
  {
    id: 'ews-001',
    signal_type: 'headroom_compression',
    severity: 'high',

    industry: 'manufacturing',
    covenant_type: 'leverage_ratio',

    current_value: 16.8,
    threshold_value: 20.0,
    deviation_from_threshold: -3.2,

    change_rate: -2.8,
    acceleration: -0.8,

    title: 'Manufacturing Leverage Headroom Compression Accelerating',
    description: 'Average headroom dropped to 16.8% (below 20% threshold) with compression rate accelerating to -2.8% per quarter and acceleration at -0.8%.',
    interpretation: 'Accelerating headroom compression indicates not just deterioration but worsening rate of deterioration. This pattern typically precedes widespread covenant breaches by 1-2 quarters.',

    detected_at: '2024-12-08T08:00:00Z',
    first_detected_at: '2024-09-15T08:00:00Z',

    historical_precedents: [
      'Q4 2019: Similar pattern preceded COVID-19 credit stress',
      'Q2 2015: Oil sector showed identical signal before downturn',
      'Q1 2008: Broad market acceleration preceded financial crisis',
    ],
    typical_outcomes: [
      '65% probability of breach rate doubling within 2 quarters',
      '45% probability of sector-wide covenant amendments',
      '30% probability of systemic stress requiring regulatory intervention',
    ],
  },
  {
    id: 'ews-002',
    signal_type: 'breach_acceleration',
    severity: 'high',

    industry: 'retail',
    covenant_type: 'all',

    current_value: 14.8,
    threshold_value: 10.0,
    deviation_from_threshold: 4.8,

    change_rate: 3.8,
    acceleration: 1.5,

    title: 'Retail Breach Rate Accelerating Above Warning Threshold',
    description: 'Retail breach rate hit 14.8% (well above 10% threshold) with acceleration of 1.5 percentage points per quarter. Rate of new breaches is increasing.',
    interpretation: 'Breach acceleration above threshold indicates sector entering distress phase. Without intervention, expect continued acceleration creating cascading effect.',

    detected_at: '2024-12-08T08:00:00Z',
    first_detected_at: '2024-10-01T08:00:00Z',

    historical_precedents: [
      'Q4 2008 retail: Breach rate accelerated from 8% to 31% over 3 quarters',
      'Q2 2020 retail: COVID-19 impact accelerated breaches to 28% in 2 quarters',
    ],
    typical_outcomes: [
      '78% probability breach rate reaches 20%+ within 2 quarters',
      '55% probability of sector default rate above 10%',
      '40% probability of systemic retail credit event',
    ],
  },
  {
    id: 'ews-003',
    signal_type: 'correlation_spike',
    severity: 'medium',

    industry: 'all',
    covenant_type: 'all',

    current_value: 0.72,
    threshold_value: 0.60,
    deviation_from_threshold: 0.12,

    change_rate: 0.08,
    acceleration: 0.03,

    title: 'Cross-Sector Covenant Stress Correlation Spiking',
    description: 'Correlation of covenant stress across sectors jumped to 0.72 (above 0.60 threshold), indicating systemic vs idiosyncratic risk.',
    interpretation: 'High correlation means sector-specific diversification providing less protection. Stress is driven by common macroeconomic factors affecting all sectors.',

    detected_at: '2024-12-08T08:00:00Z',
    first_detected_at: '2024-11-01T08:00:00Z',

    historical_precedents: [
      'Q1 2020: Correlation spiked to 0.85 during COVID-19 onset',
      'Q3 2008: Correlation hit 0.78 during financial crisis',
      'Q2 2001: Correlation reached 0.68 during dot-com recession',
    ],
    typical_outcomes: [
      '60% probability of broad market credit stress within 3 quarters',
      '45% probability of recession within 4 quarters',
      '35% probability of significant regulatory/policy intervention',
    ],
  },
];

// =============================================================================
// Waiver Mock Data
// =============================================================================

import type { Waiver, WaiverStats } from './types';

export const mockWaivers: Waiver[] = [
  {
    id: 'waiver-1',
    facility_id: '1',
    facility_name: 'ABC Holdings - Term Loan A',
    borrower_name: 'ABC Holdings LLC',
    covenant_id: '1',
    covenant_name: 'Leverage Ratio',
    covenant_type: 'leverage_ratio',
    status: 'approved',
    priority: 'high',
    requested_date: '2024-09-15',
    requested_by: 'john.smith@abcholdings.com',
    decision_date: '2024-09-22',
    decision_by: 'sarah.jones@bank.com',
    effective_date: '2024-10-01',
    expiration_date: '2025-03-31',
    request_reason: 'Temporary leverage increase due to strategic acquisition',
    justification: 'ABC Holdings completed the acquisition of XYZ Subsidiary on September 1st, which temporarily increased leverage ratio. The integration plan projects de-leveraging to below 4.0x by Q1 2025 through EBITDA improvement and debt paydown.',
    waiver_terms: 'Waiver granted for leverage covenant through Q1 2025. Borrower agrees to: (1) monthly reporting of integration progress, (2) $5M additional principal payment by Dec 31, 2024, (3) no additional acquisitions without lender consent.',
    rejection_reason: null,
    triggering_test: {
      test_date: '2024-09-30',
      calculated_ratio: 4.2,
      threshold: 4.0,
      headroom_percentage: -5.0,
    },
    waiver_fee: 50000,
    fee_currency: 'USD',
    supporting_documents: [
      { id: 'doc-1', name: 'Integration Plan.pdf', type: 'pdf', uploaded_at: '2024-09-15T10:00:00Z' },
      { id: 'doc-2', name: 'Financial Projections.xlsx', type: 'xlsx', uploaded_at: '2024-09-15T10:05:00Z' },
    ],
    comments: [
      { id: 'c-1', author: 'john.smith@abcholdings.com', content: 'Please expedite review - acquisition closing imminent', created_at: '2024-09-15T10:30:00Z' },
      { id: 'c-2', author: 'sarah.jones@bank.com', content: 'Reviewed integration plan. Strong strategic rationale. Recommending approval with conditions.', created_at: '2024-09-20T14:00:00Z' },
    ],
    created_at: '2024-09-15T10:00:00Z',
    updated_at: '2024-09-22T16:00:00Z',
  },
  {
    id: 'waiver-2',
    facility_id: '3',
    facility_name: 'Delta Manufacturing - Term Loan',
    borrower_name: 'Delta Manufacturing Co',
    covenant_id: '4',
    covenant_name: 'Fixed Charge Coverage',
    covenant_type: 'fixed_charge_coverage',
    status: 'approved',
    priority: 'critical',
    requested_date: '2024-10-01',
    requested_by: 'mike.johnson@deltamfg.com',
    decision_date: '2024-10-08',
    decision_by: 'robert.chen@bank.com',
    effective_date: '2024-10-01',
    expiration_date: '2025-03-31',
    request_reason: 'FCCR breach due to supply chain disruptions',
    justification: 'Delta Manufacturing experienced significant supply chain disruptions in Q3 2024 affecting production output and cash flow. Management has implemented cost reduction measures and secured alternative suppliers. Recovery expected by Q1 2025.',
    waiver_terms: 'Waiver granted through Q1 2025 with enhanced monitoring. Borrower agrees to: (1) weekly cash flow reporting, (2) no dividends or distributions, (3) CapEx limited to maintenance only, (4) monthly calls with credit team.',
    rejection_reason: null,
    triggering_test: {
      test_date: '2024-09-30',
      calculated_ratio: 1.05,
      threshold: 1.2,
      headroom_percentage: -12.5,
    },
    waiver_fee: 75000,
    fee_currency: 'USD',
    supporting_documents: [
      { id: 'doc-3', name: 'Cost Reduction Plan.pdf', type: 'pdf', uploaded_at: '2024-10-01T09:00:00Z' },
      { id: 'doc-4', name: 'Supply Chain Analysis.pdf', type: 'pdf', uploaded_at: '2024-10-01T09:10:00Z' },
      { id: 'doc-5', name: '13-Week Cash Flow.xlsx', type: 'xlsx', uploaded_at: '2024-10-01T09:15:00Z' },
    ],
    comments: [
      { id: 'c-3', author: 'mike.johnson@deltamfg.com', content: 'Attached updated 13-week cash flow showing recovery path', created_at: '2024-10-02T11:00:00Z' },
      { id: 'c-4', author: 'robert.chen@bank.com', content: 'Conducting enhanced due diligence. Requesting additional supplier documentation.', created_at: '2024-10-04T09:00:00Z' },
      { id: 'c-5', author: 'robert.chen@bank.com', content: 'Waiver approved with conditions. Enhanced monitoring in place.', created_at: '2024-10-08T15:00:00Z' },
    ],
    created_at: '2024-10-01T09:00:00Z',
    updated_at: '2024-10-08T15:00:00Z',
  },
  {
    id: 'waiver-3',
    facility_id: '1',
    facility_name: 'ABC Holdings - Term Loan A',
    borrower_name: 'ABC Holdings LLC',
    covenant_id: '2',
    covenant_name: 'Interest Coverage Ratio',
    covenant_type: 'interest_coverage',
    status: 'pending',
    priority: 'medium',
    requested_date: '2024-12-05',
    requested_by: 'john.smith@abcholdings.com',
    decision_date: null,
    decision_by: null,
    effective_date: null,
    expiration_date: null,
    request_reason: 'Proactive waiver request for potential Q4 covenant pressure',
    justification: 'Due to one-time integration costs from the XYZ acquisition and seasonal factors, Q4 interest coverage may fall slightly below the 2.5x threshold. Management projects a Q4 ratio of 2.3x-2.4x with full recovery in Q1 2025.',
    waiver_terms: null,
    rejection_reason: null,
    triggering_test: null,
    waiver_fee: null,
    fee_currency: 'USD',
    supporting_documents: [
      { id: 'doc-6', name: 'Q4 Projections.xlsx', type: 'xlsx', uploaded_at: '2024-12-05T14:00:00Z' },
    ],
    comments: [
      { id: 'c-6', author: 'john.smith@abcholdings.com', content: 'Submitting proactively to avoid year-end covenant breach. Integration on track.', created_at: '2024-12-05T14:30:00Z' },
    ],
    created_at: '2024-12-05T14:00:00Z',
    updated_at: '2024-12-05T14:30:00Z',
  },
  {
    id: 'waiver-4',
    facility_id: '2',
    facility_name: 'XYZ Corp - Revolving Facility',
    borrower_name: 'XYZ Corporation',
    covenant_id: '3',
    covenant_name: 'Leverage Ratio',
    covenant_type: 'leverage_ratio',
    status: 'pending',
    priority: 'high',
    requested_date: '2024-12-01',
    requested_by: 'lisa.wang@xyzcorp.com',
    decision_date: null,
    decision_by: null,
    effective_date: null,
    expiration_date: null,
    request_reason: 'Leverage ratio trending toward breach - requesting preemptive waiver',
    justification: 'XYZ Corporation\'s leverage ratio has been trending upward over the past four quarters. Current ratio of 3.1x against 3.5x threshold leaves limited headroom. Management is implementing operational improvements but requests a temporary threshold adjustment to 4.0x.',
    waiver_terms: null,
    rejection_reason: null,
    triggering_test: {
      test_date: '2024-09-30',
      calculated_ratio: 3.1,
      threshold: 3.5,
      headroom_percentage: 11.4,
    },
    waiver_fee: null,
    fee_currency: 'USD',
    supporting_documents: [
      { id: 'doc-7', name: 'Operational Improvement Plan.pdf', type: 'pdf', uploaded_at: '2024-12-01T11:00:00Z' },
      { id: 'doc-8', name: 'Leverage Analysis.xlsx', type: 'xlsx', uploaded_at: '2024-12-01T11:05:00Z' },
    ],
    comments: [
      { id: 'c-7', author: 'lisa.wang@xyzcorp.com', content: 'Requesting urgent review given declining headroom trajectory', created_at: '2024-12-01T11:30:00Z' },
      { id: 'c-8', author: 'sarah.jones@bank.com', content: 'Under review. Scheduling call to discuss operational improvement timeline.', created_at: '2024-12-03T10:00:00Z' },
    ],
    created_at: '2024-12-01T11:00:00Z',
    updated_at: '2024-12-03T10:00:00Z',
  },
  {
    id: 'waiver-5',
    facility_id: '5',
    facility_name: 'Sigma Holdings - ABL',
    borrower_name: 'Sigma Holdings Inc',
    covenant_id: '6',
    covenant_name: 'Interest Coverage',
    covenant_type: 'interest_coverage',
    status: 'rejected',
    priority: 'critical',
    requested_date: '2024-11-01',
    requested_by: 'david.brown@sigmaholdings.com',
    decision_date: '2024-11-15',
    decision_by: 'robert.chen@bank.com',
    effective_date: null,
    expiration_date: null,
    request_reason: 'Waiver request for severe interest coverage breach',
    justification: 'Sigma Holdings is experiencing significant cash flow challenges with interest coverage at 1.4x vs 2.0x minimum. Management requests a waiver while restructuring options are explored.',
    waiver_terms: null,
    rejection_reason: 'Waiver rejected due to severity of breach and insufficient restructuring plan. The borrower\'s interest coverage has deteriorated significantly over four consecutive quarters. Credit committee requires a comprehensive restructuring plan with third-party advisor involvement before any waiver consideration.',
    triggering_test: {
      test_date: '2024-09-30',
      calculated_ratio: 1.4,
      threshold: 2.0,
      headroom_percentage: -30.0,
    },
    waiver_fee: null,
    fee_currency: 'USD',
    supporting_documents: [
      { id: 'doc-9', name: 'Business Plan.pdf', type: 'pdf', uploaded_at: '2024-11-01T09:00:00Z' },
    ],
    comments: [
      { id: 'c-9', author: 'david.brown@sigmaholdings.com', content: 'Urgent - need waiver to avoid default declaration', created_at: '2024-11-01T09:30:00Z' },
      { id: 'c-10', author: 'robert.chen@bank.com', content: 'Business plan insufficient. Need comprehensive turnaround strategy with advisor support.', created_at: '2024-11-10T14:00:00Z' },
      { id: 'c-11', author: 'robert.chen@bank.com', content: 'Waiver rejected. Escalating to workout team. Recommend engaging restructuring advisor.', created_at: '2024-11-15T11:00:00Z' },
    ],
    created_at: '2024-11-01T09:00:00Z',
    updated_at: '2024-11-15T11:00:00Z',
  },
  {
    id: 'waiver-6',
    facility_id: '4',
    facility_name: 'Neptune Holdings - Senior Secured',
    borrower_name: 'Neptune Holdings Inc',
    covenant_id: '5',
    covenant_name: 'Minimum Liquidity',
    covenant_type: 'minimum_liquidity',
    status: 'expired',
    priority: 'low',
    requested_date: '2024-03-01',
    requested_by: 'anna.lee@neptuneholdings.com',
    decision_date: '2024-03-10',
    decision_by: 'sarah.jones@bank.com',
    effective_date: '2024-03-15',
    expiration_date: '2024-06-30',
    request_reason: 'Temporary liquidity reduction for strategic investment',
    justification: 'Neptune Holdings planned a strategic investment requiring temporary deployment of cash reserves. The investment would generate returns improving liquidity position by Q3 2024.',
    waiver_terms: 'Waiver granted for Q2 2024. Minimum liquidity threshold temporarily reduced from $25M to $20M. Borrower to provide monthly liquidity reports.',
    rejection_reason: null,
    triggering_test: null,
    waiver_fee: 25000,
    fee_currency: 'USD',
    supporting_documents: [
      { id: 'doc-10', name: 'Investment Memo.pdf', type: 'pdf', uploaded_at: '2024-03-01T10:00:00Z' },
    ],
    comments: [
      { id: 'c-12', author: 'anna.lee@neptuneholdings.com', content: 'Investment completed. Liquidity fully restored ahead of schedule.', created_at: '2024-05-15T09:00:00Z' },
    ],
    created_at: '2024-03-01T10:00:00Z',
    updated_at: '2024-06-30T23:59:59Z',
  },
];

/**
 * Get waivers for a specific facility.
 */
export function getWaiversByFacility(facilityId: string): Waiver[] {
  return mockWaivers.filter(w => w.facility_id === facilityId);
}

/**
 * Get waiver statistics for a specific facility.
 */
export function getWaiverStats(facilityId: string): WaiverStats {
  const facilityWaivers = getWaiversByFacility(facilityId);
  const now = new Date();

  return {
    total_waivers: facilityWaivers.length,
    pending_waivers: facilityWaivers.filter(w => w.status === 'pending').length,
    approved_waivers: facilityWaivers.filter(w => w.status === 'approved').length,
    rejected_waivers: facilityWaivers.filter(w => w.status === 'rejected').length,
    expired_waivers: facilityWaivers.filter(w => w.status === 'expired').length,
    active_waivers: facilityWaivers.filter(w =>
      w.status === 'approved' &&
      w.expiration_date &&
      new Date(w.expiration_date) > now
    ).length,
  };
}

/**
 * Get all pending waivers across all facilities.
 */
export function getPendingWaivers(): Waiver[] {
  return mockWaivers.filter(w => w.status === 'pending');
}

/**
 * Get all active (approved and not expired) waivers.
 */
export function getActiveWaivers(): Waiver[] {
  const now = new Date();
  return mockWaivers.filter(w =>
    w.status === 'approved' &&
    w.expiration_date &&
    new Date(w.expiration_date) > now
  );
}
