// TypeScript interfaces for mock data structures

export interface DocumentMock {
  id: string;
  original_filename: string;
  document_type: 'facility_agreement' | 'credit_agreement' | 'amendment' | 'side_letter' | 'security_document' | 'guarantee';
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  uploaded_at: string;
  page_count: number;
  file_size: number;
  extraction_confidence: number;
}

export interface BorrowerMock {
  name: string;
  jurisdiction: string;
  role: string;
}

export interface LenderMock {
  name: string;
  commitment_amount: number;
  percentage: number;
}

export interface AgentMock {
  name: string;
  role: 'Administrative Agent' | 'Documentation Agent' | 'Collateral Agent' | 'Syndication Agent';
}

export interface FacilityMock {
  facility_name: string;
  facility_reference: string;
  execution_date: string;
  effective_date: string;
  maturity_date: string;
  facility_type: 'term' | 'revolving' | 'bridge' | 'delayed_draw';
  currency: string;
  total_commitments: number;
  interest_rate_type: 'fixed' | 'floating';
  base_rate: 'SOFR' | 'LIBOR' | 'EURIBOR' | 'Prime';
  margin_initial: number;
  governing_law: string;
  syndicated: boolean;
  borrowers: BorrowerMock[];
  lenders: LenderMock[];
  agents: AgentMock[];
}

export interface CovenantMock {
  id: string;
  covenant_type: 'leverage_ratio' | 'interest_coverage' | 'capex_limit' | 'debt_service' | 'liquidity' | 'net_worth';
  covenant_name: string;
  threshold_type: 'minimum' | 'maximum';
  threshold_value: number;
  testing_frequency: 'quarterly' | 'annual' | 'monthly' | 'semi_annual';
  clause_reference: string;
  confidence: number;
}

export interface ObligationMock {
  id: string;
  obligation_type: 'annual_financials' | 'quarterly_financials' | 'compliance_certificate' | 'budget' | 'insurance' | 'audit';
  description: string;
  frequency: 'annual' | 'quarterly' | 'monthly' | 'semi_annual' | 'one_time';
  deadline_days: number;
  recipient_role: string;
  clause_reference: string;
  confidence: number;
}

// Mock data instances

export const mockDocument: DocumentMock = {
  id: '1',
  original_filename: 'Facility Agreement - Project Apollo.pdf',
  document_type: 'facility_agreement',
  processing_status: 'completed',
  uploaded_at: '2024-12-05T10:30:00Z',
  page_count: 245,
  file_size: 2500000,
  extraction_confidence: 0.92,
};

export const mockFacility: FacilityMock = {
  facility_name: 'Project Apollo Senior Secured Term Loan Facility',
  facility_reference: 'APOLLO-2024-001',
  execution_date: '2024-11-15',
  effective_date: '2024-11-20',
  maturity_date: '2029-11-20',
  facility_type: 'term',
  currency: 'USD',
  total_commitments: 500000000,
  interest_rate_type: 'floating',
  base_rate: 'SOFR',
  margin_initial: 3.25,
  governing_law: 'New York',
  syndicated: true,
  borrowers: [
    { name: 'Apollo Holdings Inc.', jurisdiction: 'Delaware', role: 'Borrower' },
  ],
  lenders: [
    { name: 'Global Bank NA', commitment_amount: 150000000, percentage: 30 },
    { name: 'European Credit AG', commitment_amount: 100000000, percentage: 20 },
    { name: 'Pacific Finance Ltd', commitment_amount: 100000000, percentage: 20 },
    { name: 'Regional Trust Bank', commitment_amount: 75000000, percentage: 15 },
    { name: 'Credit Union Partners', commitment_amount: 75000000, percentage: 15 },
  ],
  agents: [
    { name: 'Global Bank NA', role: 'Administrative Agent' },
    { name: 'European Credit AG', role: 'Documentation Agent' },
  ],
};

export const mockCovenants: CovenantMock[] = [
  {
    id: '1',
    covenant_type: 'leverage_ratio',
    covenant_name: 'Maximum Total Leverage Ratio',
    threshold_type: 'maximum',
    threshold_value: 4.5,
    testing_frequency: 'quarterly',
    clause_reference: 'Section 7.1(a)',
    confidence: 0.95,
  },
  {
    id: '2',
    covenant_type: 'interest_coverage',
    covenant_name: 'Minimum Interest Coverage Ratio',
    threshold_type: 'minimum',
    threshold_value: 3.0,
    testing_frequency: 'quarterly',
    clause_reference: 'Section 7.1(b)',
    confidence: 0.93,
  },
  {
    id: '3',
    covenant_type: 'capex_limit',
    covenant_name: 'Annual Capital Expenditure Limit',
    threshold_type: 'maximum',
    threshold_value: 50000000,
    testing_frequency: 'annual',
    clause_reference: 'Section 7.2',
    confidence: 0.88,
  },
];

export const mockObligations: ObligationMock[] = [
  {
    id: '1',
    obligation_type: 'annual_financials',
    description: 'Audited annual financial statements',
    frequency: 'annual',
    deadline_days: 90,
    recipient_role: 'Administrative Agent',
    clause_reference: 'Section 6.1(a)',
    confidence: 0.96,
  },
  {
    id: '2',
    obligation_type: 'quarterly_financials',
    description: 'Quarterly unaudited financial statements',
    frequency: 'quarterly',
    deadline_days: 45,
    recipient_role: 'Administrative Agent',
    clause_reference: 'Section 6.1(b)',
    confidence: 0.94,
  },
  {
    id: '3',
    obligation_type: 'compliance_certificate',
    description: 'Compliance certificate with covenant calculations',
    frequency: 'quarterly',
    deadline_days: 45,
    recipient_role: 'Administrative Agent',
    clause_reference: 'Section 6.2',
    confidence: 0.91,
  },
];

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
