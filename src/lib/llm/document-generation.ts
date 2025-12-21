import Anthropic from '@anthropic-ai/sdk';
import type {
  DocumentTemplateType,
  DocumentDataSource,
  DocumentContent,
  DocumentSection,
  DocumentTable,
  CertificationStatement,
  SignatureBlock,
  CovenantCalculationData,
  FinancialData,
  BorrowingBaseData,
  SignerRole,
} from '@/app/features/compliance/lib/document-generation-types';
import { getTemplateTypeLabel, getSignerRoleLabel } from '@/app/features/compliance/lib/document-generation-types';

const anthropic = new Anthropic();

// =============================================================================
// Document Content Generation
// =============================================================================

/**
 * Generate document content using AI based on template type and data source.
 */
export async function generateDocumentContent(
  templateType: DocumentTemplateType,
  dataSource: DocumentDataSource,
  customFields?: Record<string, string>
): Promise<DocumentContent> {
  switch (templateType) {
    case 'compliance_certificate':
      return generateComplianceCertificate(dataSource, customFields);
    case 'covenant_calculation_worksheet':
      return generateCovenantWorksheet(dataSource, customFields);
    case 'financial_summary':
      return generateFinancialSummary(dataSource, customFields);
    case 'borrowing_base_certificate':
      return generateBorrowingBaseCertificate(dataSource, customFields);
    case 'notification_letter':
      return generateNotificationLetter(dataSource, customFields);
    case 'waiver_request':
      return generateWaiverRequest(dataSource, customFields);
    default:
      throw new Error(`Unknown template type: ${templateType}`);
  }
}

/**
 * Generate a compliance certificate document.
 */
async function generateComplianceCertificate(
  dataSource: DocumentDataSource,
  customFields?: Record<string, string>
): Promise<DocumentContent> {
  const periodLabel = formatPeriodLabel(dataSource.period_start_date, dataSource.period_end_date);
  const certDate = formatDate(dataSource.submission_date);

  // Build covenant compliance section if covenants provided
  let covenantSection: DocumentSection | null = null;
  let covenantTable: DocumentTable | null = null;

  if (dataSource.covenants && dataSource.covenants.length > 0) {
    covenantTable = buildCovenantComplianceTable(dataSource.covenants);
    covenantSection = {
      id: 'covenant-compliance',
      title: 'Financial Covenant Compliance',
      content: 'The undersigned hereby certifies that as of the end of the Compliance Period, the Borrower is in compliance with the following financial covenants:',
      tables: [covenantTable],
    };
  }

  // Build financial highlights section
  let financialSection: DocumentSection | null = null;
  if (dataSource.financials) {
    financialSection = buildFinancialHighlightsSection(dataSource.financials);
  }

  // Build certifications
  const certifications: CertificationStatement[] = [
    {
      id: 'cert-1',
      statement: `As of the date hereof and as of ${certDate}, the representations and warranties contained in the Credit Agreement are true and correct in all material respects.`,
      is_required: true,
    },
    {
      id: 'cert-2',
      statement: 'No Default or Event of Default has occurred and is continuing.',
      is_required: true,
    },
    {
      id: 'cert-3',
      statement: `The financial statements delivered herewith fairly present in all material respects the financial condition of the Borrower and its Subsidiaries as of the dates indicated and the results of operations for the periods indicated.`,
      is_required: true,
    },
  ];

  if (dataSource.covenants?.some(c => c.test_result === 'fail')) {
    certifications.push({
      id: 'cert-breach',
      statement: 'As noted in the covenant compliance table above, certain financial covenants are not in compliance. Attached hereto is additional information regarding such non-compliance.',
      is_required: true,
    });
  }

  // Build signature blocks
  const signatureBlocks: SignatureBlock[] = [
    {
      id: 'sig-borrower',
      signer_role: 'borrower_cfo',
      signer_title: 'Chief Financial Officer',
      organization: dataSource.borrower_name,
      placeholder_text: `[Authorized Signatory - ${dataSource.borrower_name}]`,
    },
  ];

  // Assemble sections
  const sections: DocumentSection[] = [];

  // Opening section
  sections.push({
    id: 'opening',
    content: `Reference is made to the Credit Agreement dated as of [DATE] (as amended, restated, supplemented or otherwise modified from time to time, the "Credit Agreement"), among ${dataSource.borrower_name} (the "Borrower"), the Lenders party thereto, and [AGENT NAME], as Administrative Agent.`,
  });

  // Period section
  sections.push({
    id: 'period',
    title: 'Compliance Period',
    content: `This Compliance Certificate is being delivered pursuant to Section [X] of the Credit Agreement for the fiscal period ending ${periodLabel} (the "Compliance Period").`,
  });

  if (financialSection) {
    sections.push(financialSection);
  }

  if (covenantSection) {
    sections.push(covenantSection);
  }

  // Certification section
  sections.push({
    id: 'certifications',
    title: 'Certifications',
    content: 'The undersigned, a duly authorized officer of the Borrower, hereby certifies as follows:',
  });

  return {
    title: 'COMPLIANCE CERTIFICATE',
    subtitle: `${dataSource.borrower_name}`,
    header: {
      id: 'header',
      content: `Date: ${certDate}\nFacility: ${dataSource.facility_name}\nBorrower: ${dataSource.borrower_name}`,
    },
    sections,
    certifications,
    signature_blocks: signatureBlocks,
    footer: {
      id: 'footer',
      content: customFields?.footer_note || '',
    },
  };
}

/**
 * Generate a covenant calculation worksheet.
 */
async function generateCovenantWorksheet(
  dataSource: DocumentDataSource,
  _customFields?: Record<string, string>
): Promise<DocumentContent> {
  const periodLabel = formatPeriodLabel(dataSource.period_start_date, dataSource.period_end_date);

  if (!dataSource.covenants || dataSource.covenants.length === 0) {
    throw new Error('Covenant data is required for covenant calculation worksheet');
  }

  // Build individual covenant calculation sections
  const covenantSections: DocumentSection[] = dataSource.covenants.map((covenant, index) => {
    return buildCovenantCalculationSection(covenant, index + 1);
  });

  // Summary table
  const summaryTable = buildCovenantComplianceTable(dataSource.covenants);

  // Signature blocks
  const signatureBlocks: SignatureBlock[] = [
    {
      id: 'sig-preparer',
      signer_role: 'borrower_controller',
      signer_title: 'Controller',
      organization: dataSource.borrower_name,
      placeholder_text: 'Prepared By',
    },
    {
      id: 'sig-reviewer',
      signer_role: 'borrower_cfo',
      signer_title: 'Chief Financial Officer',
      organization: dataSource.borrower_name,
      placeholder_text: 'Reviewed & Approved By',
    },
  ];

  const certifications: CertificationStatement[] = [
    {
      id: 'cert-1',
      statement: 'The calculations contained herein have been prepared in accordance with the definitions and terms set forth in the Credit Agreement.',
      is_required: true,
    },
    {
      id: 'cert-2',
      statement: 'All financial data used in these calculations is derived from the financial statements of the Borrower for the applicable period.',
      is_required: true,
    },
  ];

  return {
    title: 'COVENANT CALCULATION WORKSHEET',
    subtitle: `${dataSource.borrower_name} - ${periodLabel}`,
    header: {
      id: 'header',
      content: `Facility: ${dataSource.facility_name}\nTest Period: ${periodLabel}\nSubmission Date: ${formatDate(dataSource.submission_date)}`,
    },
    sections: [
      {
        id: 'intro',
        content: 'This worksheet details the calculation of financial covenants as required under the Credit Agreement.',
      },
      ...covenantSections,
      {
        id: 'summary',
        title: 'Compliance Summary',
        content: 'Summary of all covenant test results:',
        tables: [summaryTable],
      },
    ],
    certifications,
    signature_blocks: signatureBlocks,
  };
}

/**
 * Generate a financial summary document.
 */
async function generateFinancialSummary(
  dataSource: DocumentDataSource,
  _customFields?: Record<string, string>
): Promise<DocumentContent> {
  const periodLabel = formatPeriodLabel(dataSource.period_start_date, dataSource.period_end_date);

  if (!dataSource.financials) {
    throw new Error('Financial data is required for financial summary');
  }

  const fin = dataSource.financials;
  const currency = fin.currency || 'USD';

  // Income statement section
  const incomeTable: DocumentTable = {
    id: 'income-table',
    title: 'Income Statement Highlights',
    headers: ['Line Item', 'Amount'],
    rows: [
      { cells: [{ value: 'Revenue' }, { value: formatCurrency(fin.revenue, currency), align: 'right', format: 'currency' }] },
      { cells: [{ value: 'EBITDA' }, { value: formatCurrency(fin.ebitda, currency), align: 'right', format: 'currency' }] },
      { cells: [{ value: 'Net Income' }, { value: formatCurrency(fin.net_income, currency), align: 'right', format: 'currency' }] },
      { cells: [{ value: 'Interest Expense' }, { value: formatCurrency(fin.interest_expense, currency), align: 'right', format: 'currency' }] },
      { cells: [{ value: 'Capital Expenditures' }, { value: formatCurrency(fin.capital_expenditures, currency), align: 'right', format: 'currency' }] },
      { cells: [{ value: 'D&A' }, { value: formatCurrency(fin.depreciation_amortization, currency), align: 'right', format: 'currency' }] },
    ],
  };

  // Balance sheet section
  const balanceTable: DocumentTable = {
    id: 'balance-table',
    title: 'Balance Sheet Highlights',
    headers: ['Line Item', 'Amount'],
    rows: [
      { cells: [{ value: 'Total Assets' }, { value: formatCurrency(fin.total_assets, currency), align: 'right', format: 'currency' }] },
      { cells: [{ value: 'Total Liabilities' }, { value: formatCurrency(fin.total_liabilities, currency), align: 'right', format: 'currency' }] },
      { cells: [{ value: 'Total Debt' }, { value: formatCurrency(fin.total_debt, currency), align: 'right', format: 'currency' }] },
      { cells: [{ value: 'Cash & Equivalents' }, { value: formatCurrency(fin.cash_and_equivalents, currency), align: 'right', format: 'currency' }] },
      { cells: [{ value: 'Accounts Receivable' }, { value: formatCurrency(fin.accounts_receivable, currency), align: 'right', format: 'currency' }] },
      { cells: [{ value: 'Inventory' }, { value: formatCurrency(fin.inventory, currency), align: 'right', format: 'currency' }] },
    ],
  };

  // Key ratios section
  const leverageRatio = fin.total_debt / fin.ebitda;
  const interestCoverage = fin.ebitda / fin.interest_expense;
  const currentRatio = (fin.cash_and_equivalents + fin.accounts_receivable + fin.inventory) / (fin.total_liabilities * 0.3); // Simplified

  const ratiosTable: DocumentTable = {
    id: 'ratios-table',
    title: 'Key Financial Ratios',
    headers: ['Ratio', 'Value'],
    rows: [
      { cells: [{ value: 'Leverage Ratio (Debt/EBITDA)' }, { value: leverageRatio.toFixed(2) + 'x', align: 'right' }] },
      { cells: [{ value: 'Interest Coverage (EBITDA/Interest)' }, { value: interestCoverage.toFixed(2) + 'x', align: 'right' }] },
      { cells: [{ value: 'EBITDA Margin' }, { value: ((fin.ebitda / fin.revenue) * 100).toFixed(1) + '%', align: 'right' }] },
      { cells: [{ value: 'Net Margin' }, { value: ((fin.net_income / fin.revenue) * 100).toFixed(1) + '%', align: 'right' }] },
    ],
  };

  const signatureBlocks: SignatureBlock[] = [
    {
      id: 'sig-cfo',
      signer_role: 'borrower_cfo',
      signer_title: 'Chief Financial Officer',
      organization: dataSource.borrower_name,
      placeholder_text: 'Prepared By',
    },
  ];

  return {
    title: 'FINANCIAL SUMMARY',
    subtitle: `${dataSource.borrower_name} - ${periodLabel}`,
    header: {
      id: 'header',
      content: `Facility: ${dataSource.facility_name}\nReporting Period: ${periodLabel}\nPrepared: ${formatDate(dataSource.submission_date)}`,
    },
    sections: [
      {
        id: 'income',
        title: 'Income Statement',
        content: `Financial performance for the period ending ${formatDate(dataSource.period_end_date)}:`,
        tables: [incomeTable],
      },
      {
        id: 'balance',
        title: 'Balance Sheet',
        content: `Financial position as of ${formatDate(dataSource.period_end_date)}:`,
        tables: [balanceTable],
      },
      {
        id: 'ratios',
        title: 'Key Ratios',
        content: 'Summary of key financial metrics:',
        tables: [ratiosTable],
      },
    ],
    certifications: [
      {
        id: 'cert-1',
        statement: 'This financial summary is prepared from unaudited management accounts and is subject to year-end adjustments.',
        is_required: true,
      },
    ],
    signature_blocks: signatureBlocks,
  };
}

/**
 * Generate a borrowing base certificate.
 */
async function generateBorrowingBaseCertificate(
  dataSource: DocumentDataSource,
  _customFields?: Record<string, string>
): Promise<DocumentContent> {
  if (!dataSource.borrowing_base) {
    throw new Error('Borrowing base data is required for borrowing base certificate');
  }

  const bb = dataSource.borrowing_base;
  const currency = bb.currency || 'USD';

  const bbTable: DocumentTable = {
    id: 'bb-calculation',
    title: 'Borrowing Base Calculation',
    headers: ['Component', 'Gross Amount', 'Advance Rate', 'Available'],
    rows: [
      {
        cells: [
          { value: 'Eligible Accounts Receivable' },
          { value: formatCurrency(bb.eligible_receivables, currency), align: 'right' },
          { value: (bb.receivables_advance_rate * 100).toFixed(0) + '%', align: 'center' },
          { value: formatCurrency(bb.receivables_available, currency), align: 'right' },
        ],
      },
      {
        cells: [
          { value: 'Eligible Inventory' },
          { value: formatCurrency(bb.eligible_inventory, currency), align: 'right' },
          { value: (bb.inventory_advance_rate * 100).toFixed(0) + '%', align: 'center' },
          { value: formatCurrency(bb.inventory_available, currency), align: 'right' },
        ],
      },
      {
        cells: [
          { value: 'Total Borrowing Base', is_bold: true },
          { value: '', align: 'right' },
          { value: '', align: 'center' },
          { value: formatCurrency(bb.total_availability, currency), align: 'right', is_bold: true },
        ],
        is_total: true,
      },
    ],
  };

  const utilizationTable: DocumentTable = {
    id: 'utilization',
    title: 'Facility Utilization',
    headers: ['Item', 'Amount'],
    rows: [
      { cells: [{ value: 'Total Borrowing Base' }, { value: formatCurrency(bb.total_availability, currency), align: 'right' }] },
      { cells: [{ value: 'Less: Outstanding Loans' }, { value: '(' + formatCurrency(bb.outstanding_loans, currency) + ')', align: 'right' }] },
      { cells: [{ value: 'Less: Outstanding Letters of Credit' }, { value: '(' + formatCurrency(bb.outstanding_letters_of_credit, currency) + ')', align: 'right' }] },
      {
        cells: [
          { value: 'Excess Availability', is_bold: true },
          { value: formatCurrency(bb.excess_availability, currency), align: 'right', is_bold: true },
        ],
        is_total: true,
      },
    ],
  };

  const signatureBlocks: SignatureBlock[] = [
    {
      id: 'sig-controller',
      signer_role: 'borrower_controller',
      signer_title: 'Controller',
      organization: dataSource.borrower_name,
      placeholder_text: 'Prepared By',
    },
    {
      id: 'sig-cfo',
      signer_role: 'borrower_cfo',
      signer_title: 'Chief Financial Officer',
      organization: dataSource.borrower_name,
      placeholder_text: 'Approved By',
    },
  ];

  return {
    title: 'BORROWING BASE CERTIFICATE',
    subtitle: dataSource.borrower_name,
    header: {
      id: 'header',
      content: `Facility: ${dataSource.facility_name}\nAs of: ${formatDate(dataSource.period_end_date)}\nSubmission Date: ${formatDate(dataSource.submission_date)}`,
    },
    sections: [
      {
        id: 'intro',
        content: 'The undersigned hereby certifies that the following is a true and correct calculation of the Borrowing Base as of the date set forth above.',
      },
      {
        id: 'calculation',
        title: 'Borrowing Base Calculation',
        content: '',
        tables: [bbTable],
      },
      {
        id: 'utilization',
        title: 'Availability',
        content: '',
        tables: [utilizationTable],
      },
    ],
    certifications: [
      {
        id: 'cert-1',
        statement: 'The information contained herein is true and correct as of the date hereof.',
        is_required: true,
      },
      {
        id: 'cert-2',
        statement: 'All Eligible Receivables and Eligible Inventory included herein meet the eligibility criteria set forth in the Credit Agreement.',
        is_required: true,
      },
    ],
    signature_blocks: signatureBlocks,
  };
}

/**
 * Generate a notification letter using AI.
 */
async function generateNotificationLetter(
  dataSource: DocumentDataSource,
  customFields?: Record<string, string>
): Promise<DocumentContent> {
  const notificationType = customFields?.notification_type || 'General Notification';
  const eventDescription = customFields?.event_description || '';
  const triggerReason = customFields?.trigger_reason || '';

  // Use AI to generate appropriate notification content
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `You are a loan compliance expert drafting a formal notification letter. Create a professional notification letter based on the following:

NOTIFICATION TYPE: ${notificationType}
FACILITY: ${dataSource.facility_name}
BORROWER: ${dataSource.borrower_name}
EVENT DESCRIPTION: ${eventDescription}
TRIGGER REASON: ${triggerReason}

Generate a formal notification letter in JSON format:
{
  "opening_paragraph": "Opening text explaining the purpose of the letter",
  "body_paragraphs": ["Paragraph 1", "Paragraph 2", ...],
  "closing_paragraph": "Closing text with next steps or requirements"
}

The letter should be formal, clear, and comply with typical loan agreement notification requirements.`,
      },
    ],
  });

  let letterContent = {
    opening_paragraph: `Reference is made to the Credit Agreement dated as of [DATE]. Pursuant to Section [X] of the Credit Agreement, ${dataSource.borrower_name} hereby provides notice of the following:`,
    body_paragraphs: [eventDescription || 'Event details to be provided.'],
    closing_paragraph: 'Please acknowledge receipt of this notification. We remain available to discuss any questions.',
  };

  const content = message.content[0];
  if (content.type === 'text') {
    try {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        letterContent = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Use default content
    }
  }

  const signatureBlocks: SignatureBlock[] = [
    {
      id: 'sig-auth',
      signer_role: 'borrower_authorized_officer',
      signer_title: 'Authorized Officer',
      organization: dataSource.borrower_name,
      placeholder_text: `[Authorized Signatory]`,
    },
  ];

  return {
    title: 'NOTICE',
    subtitle: notificationType,
    header: {
      id: 'header',
      content: `Date: ${formatDate(dataSource.submission_date)}\nTo: Administrative Agent\nFrom: ${dataSource.borrower_name}\nRe: ${dataSource.facility_name} - ${notificationType}`,
    },
    sections: [
      {
        id: 'opening',
        content: letterContent.opening_paragraph,
      },
      {
        id: 'body',
        content: letterContent.body_paragraphs.join('\n\n'),
      },
      {
        id: 'closing',
        content: letterContent.closing_paragraph,
      },
    ],
    certifications: [],
    signature_blocks: signatureBlocks,
  };
}

/**
 * Generate a waiver request document using AI.
 */
async function generateWaiverRequest(
  dataSource: DocumentDataSource,
  customFields?: Record<string, string>
): Promise<DocumentContent> {
  const waiverReason = customFields?.waiver_reason || 'Covenant breach';
  const requestedRelief = customFields?.requested_relief || '';
  const proposedDuration = customFields?.proposed_duration || '90 days';

  // Find breached covenants
  const breachedCovenants = dataSource.covenants?.filter(c => c.test_result === 'fail') || [];

  // Use AI to generate waiver request content
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `You are a loan compliance expert drafting a formal waiver request. Create a professional waiver request based on the following:

FACILITY: ${dataSource.facility_name}
BORROWER: ${dataSource.borrower_name}
WAIVER REASON: ${waiverReason}
REQUESTED RELIEF: ${requestedRelief}
PROPOSED DURATION: ${proposedDuration}
BREACHED COVENANTS: ${breachedCovenants.map(c => `${c.covenant_name}: ${c.calculated_value} vs threshold ${c.threshold_value}`).join('; ')}

Generate a formal waiver request in JSON format:
{
  "background": "Background explaining the situation",
  "circumstances": "Explanation of circumstances leading to the request",
  "relief_requested": "Specific relief being requested",
  "remediation_plan": "Plan to address the underlying issue",
  "closing": "Closing paragraph"
}

Be professional and thorough.`,
      },
    ],
  });

  let requestContent = {
    background: `Reference is made to the Credit Agreement. ${dataSource.borrower_name} hereby requests a waiver of certain provisions.`,
    circumstances: waiverReason,
    relief_requested: requestedRelief || 'Temporary waiver of covenant compliance requirements.',
    remediation_plan: 'The Borrower is implementing operational improvements to address the underlying situation.',
    closing: 'We respectfully request approval of this waiver request and remain available to discuss.',
  };

  const content = message.content[0];
  if (content.type === 'text') {
    try {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        requestContent = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Use default content
    }
  }

  // Build covenant breach table if applicable
  let breachTable: DocumentTable | undefined;
  if (breachedCovenants.length > 0) {
    breachTable = {
      id: 'breach-table',
      title: 'Covenant Status',
      headers: ['Covenant', 'Threshold', 'Actual', 'Shortfall'],
      rows: breachedCovenants.map(c => ({
        cells: [
          { value: c.covenant_name },
          { value: c.threshold_value.toString(), align: 'right' as const },
          { value: c.calculated_value.toString(), align: 'right' as const },
          { value: c.headroom_percentage.toFixed(1) + '%', align: 'right' as const },
        ],
      })),
    };
  }

  const signatureBlocks: SignatureBlock[] = [
    {
      id: 'sig-cfo',
      signer_role: 'borrower_cfo',
      signer_title: 'Chief Financial Officer',
      organization: dataSource.borrower_name,
      placeholder_text: `[Authorized Signatory]`,
    },
  ];

  const sections: DocumentSection[] = [
    {
      id: 'background',
      title: 'Background',
      content: requestContent.background,
    },
    {
      id: 'circumstances',
      title: 'Circumstances',
      content: requestContent.circumstances,
      tables: breachTable ? [breachTable] : undefined,
    },
    {
      id: 'relief',
      title: 'Relief Requested',
      content: requestContent.relief_requested,
    },
    {
      id: 'remediation',
      title: 'Remediation Plan',
      content: requestContent.remediation_plan,
    },
    {
      id: 'closing',
      content: requestContent.closing,
    },
  ];

  return {
    title: 'WAIVER REQUEST',
    subtitle: dataSource.borrower_name,
    header: {
      id: 'header',
      content: `Date: ${formatDate(dataSource.submission_date)}\nTo: Administrative Agent and Lenders\nFrom: ${dataSource.borrower_name}\nRe: Request for Waiver - ${dataSource.facility_name}`,
    },
    sections,
    certifications: [],
    signature_blocks: signatureBlocks,
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

function buildCovenantComplianceTable(covenants: CovenantCalculationData[]): DocumentTable {
  return {
    id: 'covenant-compliance-table',
    headers: ['Covenant', 'Threshold', 'Actual', 'Headroom', 'Status'],
    rows: covenants.map(c => ({
      cells: [
        { value: c.covenant_name },
        { value: `${c.threshold_type === 'maximum' ? '≤' : '≥'} ${c.threshold_value}`, align: 'right' as const },
        { value: c.calculated_value.toFixed(2), align: 'right' as const },
        { value: c.headroom_percentage.toFixed(1) + '%', align: 'right' as const },
        { value: c.test_result === 'pass' ? '✓ Pass' : '✗ Fail', align: 'center' as const },
      ],
      is_highlight: c.test_result === 'fail',
    })),
  };
}

function buildFinancialHighlightsSection(financials: FinancialData): DocumentSection {
  const currency = financials.currency || 'USD';

  const table: DocumentTable = {
    id: 'financial-highlights',
    title: 'Financial Highlights',
    headers: ['Metric', 'Amount'],
    rows: [
      { cells: [{ value: 'Revenue' }, { value: formatCurrency(financials.revenue, currency), align: 'right' as const }] },
      { cells: [{ value: 'EBITDA' }, { value: formatCurrency(financials.ebitda, currency), align: 'right' as const }] },
      { cells: [{ value: 'Total Debt' }, { value: formatCurrency(financials.total_debt, currency), align: 'right' as const }] },
      { cells: [{ value: 'Cash' }, { value: formatCurrency(financials.cash_and_equivalents, currency), align: 'right' as const }] },
    ],
  };

  return {
    id: 'financial-highlights-section',
    title: 'Financial Highlights',
    content: '',
    tables: [table],
  };
}

function buildCovenantCalculationSection(covenant: CovenantCalculationData, index: number): DocumentSection {
  const calculationTable: DocumentTable = {
    id: `calc-${covenant.covenant_id}`,
    headers: ['Component', 'Value'],
    rows: [
      { cells: [{ value: covenant.numerator_description }, { value: covenant.numerator_value.toLocaleString(), align: 'right' as const }] },
      { cells: [{ value: covenant.denominator_description }, { value: covenant.denominator_value.toLocaleString(), align: 'right' as const }] },
      {
        cells: [
          { value: 'Calculated Ratio', is_bold: true },
          { value: covenant.calculated_value.toFixed(2), align: 'right' as const, is_bold: true },
        ],
        is_total: true,
      },
      { cells: [{ value: 'Covenant Threshold' }, { value: `${covenant.threshold_type === 'maximum' ? '≤' : '≥'} ${covenant.threshold_value}`, align: 'right' as const }] },
      { cells: [{ value: 'Headroom' }, { value: covenant.headroom_percentage.toFixed(1) + '%', align: 'right' as const }] },
      {
        cells: [
          { value: 'Test Result', is_bold: true },
          { value: covenant.test_result === 'pass' ? 'PASS' : 'FAIL', align: 'right' as const, is_bold: true },
        ],
        is_highlight: covenant.test_result === 'fail',
      },
    ],
    notes: covenant.calculation_notes,
  };

  return {
    id: `covenant-calc-${index}`,
    title: `${index}. ${covenant.covenant_name}`,
    content: `Covenant Type: ${covenant.covenant_type}`,
    tables: [calculationTable],
  };
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatPeriodLabel(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// =============================================================================
// AI-Enhanced Content Enhancement
// =============================================================================

/**
 * Enhance document content with AI-generated insights.
 */
export async function enhanceDocumentWithAI(
  content: DocumentContent,
  dataSource: DocumentDataSource
): Promise<DocumentContent> {
  // For compliance certificates and financial summaries, add AI analysis
  if (!dataSource.covenants || dataSource.covenants.length === 0) {
    return content;
  }

  const covenantSummary = dataSource.covenants
    .map(c => `${c.covenant_name}: ${c.calculated_value} (${c.test_result})`)
    .join(', ');

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: `Based on this covenant compliance data, provide a brief 2-3 sentence executive summary of the compliance status:

Covenants: ${covenantSummary}

Respond with just the summary text, no JSON.`,
      },
    ],
  });

  const aiContent = message.content[0];
  if (aiContent.type === 'text' && aiContent.text) {
    // Add AI summary section
    const summarySection: DocumentSection = {
      id: 'ai-summary',
      title: 'Executive Summary',
      content: aiContent.text,
    };

    return {
      ...content,
      sections: [summarySection, ...content.sections],
    };
  }

  return content;
}
