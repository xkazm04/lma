import type {
  DocumentTemplate,
  GeneratedDocument,
  DocumentListItem,
  SignatureWorkflow,
  Signer,
  AuditTrailEntry,
  DocumentContent,
  DocumentDataSource,
  CovenantCalculationData,
  FinancialData,
  BorrowingBaseData,
  DocumentTemplateType,
  DocumentStatus,
  SignatureStatus,
  SignerRole,
} from './document-generation-types';

// =============================================================================
// Document Templates
// =============================================================================

export const mockDocumentTemplates: DocumentTemplate[] = [
  {
    id: 'tpl-compliance-cert',
    type: 'compliance_certificate',
    name: 'Compliance Certificate',
    description: 'Standard compliance certificate with covenant calculations and certifications',
    version: '2.0',
    required_data_fields: ['facility_id', 'period_start_date', 'period_end_date', 'submission_date'],
    optional_data_fields: ['financials', 'covenants', 'notes'],
    required_signers: ['borrower_cfo'],
    optional_signers: ['borrower_controller'],
    default_expiration_days: 30,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-06-15T00:00:00Z',
  },
  {
    id: 'tpl-covenant-worksheet',
    type: 'covenant_calculation_worksheet',
    name: 'Covenant Calculation Worksheet',
    description: 'Detailed covenant calculation worksheet with supporting documentation',
    version: '1.5',
    required_data_fields: ['facility_id', 'period_start_date', 'period_end_date', 'covenants'],
    optional_data_fields: ['financials', 'notes'],
    required_signers: ['borrower_cfo'],
    optional_signers: ['borrower_controller', 'auditor'],
    default_expiration_days: 30,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-06-15T00:00:00Z',
  },
  {
    id: 'tpl-financial-summary',
    type: 'financial_summary',
    name: 'Financial Summary',
    description: 'Quarterly or annual financial summary with key metrics',
    version: '1.0',
    required_data_fields: ['facility_id', 'period_start_date', 'period_end_date', 'financials'],
    optional_data_fields: ['notes'],
    required_signers: ['borrower_cfo'],
    optional_signers: [],
    default_expiration_days: 45,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-06-15T00:00:00Z',
  },
  {
    id: 'tpl-borrowing-base',
    type: 'borrowing_base_certificate',
    name: 'Borrowing Base Certificate',
    description: 'Monthly borrowing base calculation and certification',
    version: '1.2',
    required_data_fields: ['facility_id', 'period_end_date', 'borrowing_base'],
    optional_data_fields: ['notes', 'attachments'],
    required_signers: ['borrower_controller', 'borrower_cfo'],
    optional_signers: [],
    default_expiration_days: 15,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-06-15T00:00:00Z',
  },
  {
    id: 'tpl-notification',
    type: 'notification_letter',
    name: 'Notification Letter',
    description: 'Formal notification letter for required disclosures',
    version: '1.0',
    required_data_fields: ['facility_id', 'submission_date'],
    optional_data_fields: ['notes'],
    required_signers: ['borrower_authorized_officer'],
    optional_signers: [],
    default_expiration_days: 30,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-06-15T00:00:00Z',
  },
  {
    id: 'tpl-waiver-request',
    type: 'waiver_request',
    name: 'Waiver Request',
    description: 'Covenant waiver request with remediation plan',
    version: '1.0',
    required_data_fields: ['facility_id', 'submission_date', 'covenants'],
    optional_data_fields: ['financials', 'notes'],
    required_signers: ['borrower_cfo'],
    optional_signers: ['borrower_authorized_officer'],
    default_expiration_days: 45,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-06-15T00:00:00Z',
  },
];

// =============================================================================
// Sample Financial Data
// =============================================================================

export const mockFinancialData: FinancialData = {
  revenue: 125000000,
  ebitda: 28000000,
  net_income: 12500000,
  total_assets: 180000000,
  total_liabilities: 95000000,
  total_debt: 78000000,
  cash_and_equivalents: 15000000,
  accounts_receivable: 22000000,
  inventory: 18000000,
  interest_expense: 5200000,
  capital_expenditures: 8500000,
  depreciation_amortization: 4200000,
  currency: 'USD',
  period_type: 'quarterly',
};

export const mockCovenantCalculations: CovenantCalculationData[] = [
  {
    covenant_id: '1',
    covenant_name: 'Leverage Ratio',
    covenant_type: 'leverage_ratio',
    threshold_type: 'maximum',
    threshold_value: 4.0,
    calculated_value: 3.2,
    numerator_value: 78000000,
    numerator_description: 'Total Debt',
    denominator_value: 24375000,
    denominator_description: 'LTM EBITDA (Adjusted)',
    test_result: 'pass',
    headroom_percentage: 20.0,
    headroom_absolute: 0.8,
    calculation_notes: 'EBITDA adjusted for one-time restructuring charges of $3.625M',
  },
  {
    covenant_id: '2',
    covenant_name: 'Interest Coverage Ratio',
    covenant_type: 'interest_coverage',
    threshold_type: 'minimum',
    threshold_value: 2.5,
    calculated_value: 4.69,
    numerator_value: 24375000,
    numerator_description: 'LTM EBITDA (Adjusted)',
    denominator_value: 5200000,
    denominator_description: 'Interest Expense',
    test_result: 'pass',
    headroom_percentage: 87.6,
    headroom_absolute: 2.19,
  },
  {
    covenant_id: '5',
    covenant_name: 'Minimum Liquidity',
    covenant_type: 'minimum_liquidity',
    threshold_type: 'minimum',
    threshold_value: 10000000,
    calculated_value: 15000000,
    numerator_value: 15000000,
    numerator_description: 'Cash and Cash Equivalents',
    denominator_value: 1,
    denominator_description: 'N/A',
    test_result: 'pass',
    headroom_percentage: 50.0,
    headroom_absolute: 5000000,
  },
];

export const mockBorrowingBaseData: BorrowingBaseData = {
  eligible_receivables: 20000000,
  receivables_advance_rate: 0.85,
  receivables_available: 17000000,
  eligible_inventory: 15000000,
  inventory_advance_rate: 0.50,
  inventory_available: 7500000,
  total_availability: 24500000,
  outstanding_loans: 18000000,
  outstanding_letters_of_credit: 2000000,
  excess_availability: 4500000,
  currency: 'USD',
};

// =============================================================================
// Sample Data Sources
// =============================================================================

export const mockDataSources: Record<string, DocumentDataSource> = {
  'abc-holdings-q3': {
    facility_id: '1',
    facility_name: 'ABC Holdings - Term Loan A',
    borrower_name: 'ABC Holdings LLC',
    period_start_date: '2024-07-01',
    period_end_date: '2024-09-30',
    submission_date: '2024-11-14',
    financials: mockFinancialData,
    covenants: mockCovenantCalculations,
    notes: 'Q3 2024 compliance submission',
  },
  'abc-holdings-bb': {
    facility_id: '1',
    facility_name: 'ABC Holdings - Term Loan A',
    borrower_name: 'ABC Holdings LLC',
    period_start_date: '2024-11-01',
    period_end_date: '2024-11-30',
    submission_date: '2024-12-10',
    borrowing_base: mockBorrowingBaseData,
    notes: 'November 2024 borrowing base',
  },
};

// =============================================================================
// Generated Documents
// =============================================================================

export const mockGeneratedDocuments: GeneratedDocument[] = [
  {
    id: 'doc-001',
    template_id: 'tpl-compliance-cert',
    template_type: 'compliance_certificate',
    document_name: 'Q3 2024 Compliance Certificate',
    facility_id: '1',
    facility_name: 'ABC Holdings - Term Loan A',
    borrower_name: 'ABC Holdings LLC',
    event_id: '1',
    event_type: 'compliance_event',
    status: 'completed',
    version: 1,
    content: {
      title: 'COMPLIANCE CERTIFICATE',
      subtitle: 'ABC Holdings LLC',
      header: {
        id: 'header',
        content: 'Date: November 14, 2024\nFacility: ABC Holdings - Term Loan A\nBorrower: ABC Holdings LLC',
      },
      sections: [
        {
          id: 'opening',
          content: 'Reference is made to the Credit Agreement dated as of January 15, 2024.',
        },
      ],
      certifications: [
        {
          id: 'cert-1',
          statement: 'All representations and warranties are true and correct.',
          is_required: true,
        },
      ],
      signature_blocks: [
        {
          id: 'sig-1',
          signer_role: 'borrower_cfo',
          signer_title: 'Chief Financial Officer',
          organization: 'ABC Holdings LLC',
          placeholder_text: '[Authorized Signatory]',
        },
      ],
    },
    data_snapshot: mockDataSources['abc-holdings-q3'],
    signature_workflow: {
      id: 'wf-001',
      document_id: 'doc-001',
      status: 'completed',
      signers: [
        {
          id: 'signer-001',
          role: 'borrower_cfo',
          name: 'John Smith',
          email: 'john.smith@abcholdings.com',
          title: 'Chief Financial Officer',
          organization: 'ABC Holdings LLC',
          signing_order: 1,
          status: 'signed',
          signature_data: {
            signature_type: 'typed',
            signature_value: 'John Smith',
            ip_address: '192.168.1.100',
            user_agent: 'Mozilla/5.0',
            timestamp: '2024-11-14T16:30:00Z',
          },
          viewed_at: '2024-11-14T16:25:00Z',
          signed_at: '2024-11-14T16:30:00Z',
          declined_at: null,
          decline_reason: null,
          reminder_sent_at: null,
          reminders_count: 0,
        },
      ],
      signing_order: 'sequential',
      reminder_frequency_hours: 24,
      expires_at: '2024-12-14T00:00:00Z',
      created_at: '2024-11-14T10:00:00Z',
      completed_at: '2024-11-14T16:30:00Z',
    },
    generated_at: '2024-11-14T10:00:00Z',
    generated_by: 'system',
    last_modified_at: '2024-11-14T16:30:00Z',
    submitted_at: '2024-11-14T10:05:00Z',
    completed_at: '2024-11-14T16:30:00Z',
    expires_at: null,
    audit_trail: [
      {
        id: 'audit-001',
        timestamp: '2024-11-14T10:00:00Z',
        action: 'document_generated',
        actor_id: 'system',
        actor_name: 'System',
        actor_email: 'system@loanos.com',
        actor_role: 'system',
        details: 'Compliance certificate generated from Q3 2024 financial data',
      },
      {
        id: 'audit-002',
        timestamp: '2024-11-14T10:05:00Z',
        action: 'workflow_started',
        actor_id: 'user-001',
        actor_name: 'Sarah Johnson',
        actor_email: 'sarah.johnson@loanos.com',
        actor_role: 'admin',
        details: 'E-signature workflow initiated',
      },
      {
        id: 'audit-003',
        timestamp: '2024-11-14T16:25:00Z',
        action: 'document_viewed_by_signer',
        actor_id: 'signer-001',
        actor_name: 'John Smith',
        actor_email: 'john.smith@abcholdings.com',
        actor_role: 'borrower_cfo',
        details: 'Document viewed by CFO',
        ip_address: '192.168.1.100',
      },
      {
        id: 'audit-004',
        timestamp: '2024-11-14T16:30:00Z',
        action: 'signature_applied',
        actor_id: 'signer-001',
        actor_name: 'John Smith',
        actor_email: 'john.smith@abcholdings.com',
        actor_role: 'borrower_cfo',
        details: 'Signature applied (typed)',
        ip_address: '192.168.1.100',
      },
      {
        id: 'audit-005',
        timestamp: '2024-11-14T16:30:00Z',
        action: 'document_completed',
        actor_id: 'system',
        actor_name: 'System',
        actor_email: 'system@loanos.com',
        actor_role: 'system',
        details: 'All signatures collected, document completed',
      },
    ],
  },
  {
    id: 'doc-002',
    template_id: 'tpl-compliance-cert',
    template_type: 'compliance_certificate',
    document_name: 'Q4 2024 Compliance Certificate',
    facility_id: '1',
    facility_name: 'ABC Holdings - Term Loan A',
    borrower_name: 'ABC Holdings LLC',
    event_id: '2',
    event_type: 'compliance_event',
    status: 'pending_signature',
    version: 1,
    content: {
      title: 'COMPLIANCE CERTIFICATE',
      subtitle: 'ABC Holdings LLC',
      header: {
        id: 'header',
        content: 'Date: December 12, 2024\nFacility: ABC Holdings - Term Loan A\nBorrower: ABC Holdings LLC',
      },
      sections: [],
      certifications: [],
      signature_blocks: [],
    },
    data_snapshot: mockDataSources['abc-holdings-q3'],
    signature_workflow: {
      id: 'wf-002',
      document_id: 'doc-002',
      status: 'in_progress',
      signers: [
        {
          id: 'signer-002',
          role: 'borrower_cfo',
          name: 'John Smith',
          email: 'john.smith@abcholdings.com',
          title: 'Chief Financial Officer',
          organization: 'ABC Holdings LLC',
          signing_order: 1,
          status: 'pending',
          signature_data: null,
          viewed_at: null,
          signed_at: null,
          declined_at: null,
          decline_reason: null,
          reminder_sent_at: '2024-12-10T10:00:00Z',
          reminders_count: 1,
        },
      ],
      signing_order: 'sequential',
      reminder_frequency_hours: 24,
      expires_at: '2025-01-12T00:00:00Z',
      created_at: '2024-12-08T10:00:00Z',
      completed_at: null,
    },
    generated_at: '2024-12-08T10:00:00Z',
    generated_by: 'system',
    last_modified_at: '2024-12-08T10:00:00Z',
    submitted_at: '2024-12-08T10:05:00Z',
    completed_at: null,
    expires_at: '2025-01-12T00:00:00Z',
    audit_trail: [
      {
        id: 'audit-010',
        timestamp: '2024-12-08T10:00:00Z',
        action: 'document_generated',
        actor_id: 'system',
        actor_name: 'System',
        actor_email: 'system@loanos.com',
        actor_role: 'system',
        details: 'Compliance certificate generated',
      },
      {
        id: 'audit-011',
        timestamp: '2024-12-08T10:05:00Z',
        action: 'workflow_started',
        actor_id: 'user-001',
        actor_name: 'Sarah Johnson',
        actor_email: 'sarah.johnson@loanos.com',
        actor_role: 'admin',
        details: 'E-signature workflow initiated',
      },
      {
        id: 'audit-012',
        timestamp: '2024-12-10T10:00:00Z',
        action: 'reminder_sent',
        actor_id: 'system',
        actor_name: 'System',
        actor_email: 'system@loanos.com',
        actor_role: 'system',
        details: 'Reminder sent to John Smith',
      },
    ],
  },
  {
    id: 'doc-003',
    template_id: 'tpl-borrowing-base',
    template_type: 'borrowing_base_certificate',
    document_name: 'November 2024 Borrowing Base Certificate',
    facility_id: '1',
    facility_name: 'ABC Holdings - Term Loan A',
    borrower_name: 'ABC Holdings LLC',
    event_id: '6',
    event_type: 'compliance_event',
    status: 'draft',
    version: 1,
    content: {
      title: 'BORROWING BASE CERTIFICATE',
      subtitle: 'ABC Holdings LLC',
      header: {
        id: 'header',
        content: 'Facility: ABC Holdings - Term Loan A\nAs of: November 30, 2024',
      },
      sections: [],
      certifications: [],
      signature_blocks: [],
    },
    data_snapshot: mockDataSources['abc-holdings-bb'],
    signature_workflow: null,
    generated_at: '2024-12-07T14:00:00Z',
    generated_by: 'user-001',
    last_modified_at: '2024-12-07T14:00:00Z',
    submitted_at: null,
    completed_at: null,
    expires_at: null,
    audit_trail: [
      {
        id: 'audit-020',
        timestamp: '2024-12-07T14:00:00Z',
        action: 'document_generated',
        actor_id: 'user-001',
        actor_name: 'Sarah Johnson',
        actor_email: 'sarah.johnson@loanos.com',
        actor_role: 'admin',
        details: 'Borrowing base certificate generated',
      },
    ],
  },
];

// =============================================================================
// Document List Items (for UI display)
// =============================================================================

export const mockDocumentListItems: DocumentListItem[] = mockGeneratedDocuments.map(doc => ({
  id: doc.id,
  name: doc.document_name,
  template_type: doc.template_type,
  facility_name: doc.facility_name,
  borrower_name: doc.borrower_name,
  status: doc.status,
  version: doc.version,
  generated_at: doc.generated_at,
  expires_at: doc.expires_at,
  pending_signatures: doc.signature_workflow?.signers.filter(s => s.status === 'pending').length || 0,
  total_signatures: doc.signature_workflow?.signers.length || 0,
}));

// =============================================================================
// Helper Functions
// =============================================================================

export function getMockDocument(documentId: string): GeneratedDocument | undefined {
  return mockGeneratedDocuments.find(d => d.id === documentId);
}

export function getMockDocumentsByFacility(facilityId: string): DocumentListItem[] {
  return mockDocumentListItems.filter(d => {
    const fullDoc = mockGeneratedDocuments.find(fd => fd.id === d.id);
    return fullDoc?.facility_id === facilityId;
  });
}

export function getMockDocumentsByEvent(eventId: string): DocumentListItem[] {
  return mockDocumentListItems.filter(d => {
    const fullDoc = mockGeneratedDocuments.find(fd => fd.id === d.id);
    return fullDoc?.event_id === eventId;
  });
}

export function getMockDocumentsByStatus(status: DocumentStatus): DocumentListItem[] {
  return mockDocumentListItems.filter(d => d.status === status);
}

export function getMockTemplate(templateType: DocumentTemplateType): DocumentTemplate | undefined {
  return mockDocumentTemplates.find(t => t.type === templateType);
}

export function getMockPendingDocuments(): DocumentListItem[] {
  return mockDocumentListItems.filter(d =>
    d.status === 'pending_signature' || d.status === 'pending_review'
  );
}

export function getMockDocumentStats(): {
  total: number;
  drafts: number;
  pending_signature: number;
  completed: number;
  overdue: number;
} {
  const now = new Date();
  return {
    total: mockDocumentListItems.length,
    drafts: mockDocumentListItems.filter(d => d.status === 'draft').length,
    pending_signature: mockDocumentListItems.filter(d => d.status === 'pending_signature').length,
    completed: mockDocumentListItems.filter(d => d.status === 'completed').length,
    overdue: mockDocumentListItems.filter(d =>
      d.expires_at && new Date(d.expires_at) < now && d.status !== 'completed'
    ).length,
  };
}
