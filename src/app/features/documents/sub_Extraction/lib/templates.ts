/**
 * Pre-configured extraction templates for common loan document types
 */

import type { ExtractionTemplate, TemplateCategory, TemplateField } from './template-types';

// ============================================
// Shared Categories
// ============================================

const basicInfoCategory: TemplateCategory = {
  id: 'basic-info',
  name: 'Basic Information',
  description: 'Core facility identification and reference information',
  displayOrder: 1,
  icon: 'FileText',
};

const keyDatesCategory: TemplateCategory = {
  id: 'key-dates',
  name: 'Key Dates',
  description: 'Important dates for the facility lifecycle',
  displayOrder: 2,
  icon: 'Calendar',
};

const financialTermsCategory: TemplateCategory = {
  id: 'financial-terms',
  name: 'Financial Terms',
  description: 'Commitment amounts, pricing, and fee structures',
  displayOrder: 3,
  icon: 'DollarSign',
};

const partiesCategory: TemplateCategory = {
  id: 'parties',
  name: 'Parties',
  description: 'Borrowers, lenders, agents, and other participants',
  displayOrder: 4,
  icon: 'Users',
};

const covenantsCategory: TemplateCategory = {
  id: 'covenants',
  name: 'Covenants',
  description: 'Financial covenants and maintenance requirements',
  displayOrder: 5,
  icon: 'Shield',
};

const securityCategory: TemplateCategory = {
  id: 'security',
  name: 'Security & Collateral',
  description: 'Security interests and collateral arrangements',
  displayOrder: 6,
  icon: 'Lock',
};

// ============================================
// Shared Fields
// ============================================

const createBasicInfoFields = (startOrder: number): TemplateField[] => [
  {
    fieldKey: 'facility_name',
    label: 'Facility Name',
    category: 'basic-info',
    dataType: 'string',
    required: true,
    description: 'The official name of the credit facility',
    displayOrder: startOrder,
    extractionHints: ['facility', 'credit facility', 'loan facility', 'financing'],
  },
  {
    fieldKey: 'facility_reference',
    label: 'Facility Reference',
    category: 'basic-info',
    dataType: 'string',
    required: false,
    description: 'Internal or external reference number',
    displayOrder: startOrder + 1,
    extractionHints: ['reference', 'ref', 'deal id', 'facility id'],
  },
  {
    fieldKey: 'facility_type',
    label: 'Facility Type',
    category: 'basic-info',
    dataType: 'enum',
    required: true,
    description: 'The type of credit facility',
    displayOrder: startOrder + 2,
    validationRules: [
      {
        type: 'enum_values',
        value: ['Term Loan', 'Revolving Credit', 'Bridge Loan', 'Letter of Credit', 'Delayed Draw', 'Swingline'],
        message: 'Invalid facility type',
      },
    ],
    extractionHints: ['term loan', 'revolver', 'revolving', 'bridge', 'letter of credit', 'LOC'],
  },
  {
    fieldKey: 'governing_law',
    label: 'Governing Law',
    category: 'basic-info',
    dataType: 'string',
    required: true,
    description: 'The jurisdiction governing the agreement',
    displayOrder: startOrder + 3,
    typicalRange: {
      commonValues: ['New York', 'English Law', 'Delaware', 'California'],
    },
    extractionHints: ['governing law', 'jurisdiction', 'governed by', 'laws of'],
  },
];

const createKeyDatesFields = (startOrder: number): TemplateField[] => [
  {
    fieldKey: 'execution_date',
    label: 'Execution Date',
    category: 'key-dates',
    dataType: 'date',
    required: true,
    description: 'Date the agreement was signed',
    displayOrder: startOrder,
    extractionHints: ['dated', 'executed', 'signed', 'as of'],
  },
  {
    fieldKey: 'effective_date',
    label: 'Effective Date',
    category: 'key-dates',
    dataType: 'date',
    required: true,
    description: 'Date the agreement becomes effective',
    displayOrder: startOrder + 1,
    extractionHints: ['effective date', 'closing date', 'effective as of'],
  },
  {
    fieldKey: 'maturity_date',
    label: 'Maturity Date',
    category: 'key-dates',
    dataType: 'date',
    required: true,
    description: 'Final maturity date of the facility',
    displayOrder: startOrder + 2,
    extractionHints: ['maturity date', 'termination date', 'final maturity'],
  },
];

const createFinancialFields = (startOrder: number): TemplateField[] => [
  {
    fieldKey: 'total_commitments',
    label: 'Total Commitments',
    category: 'financial-terms',
    dataType: 'currency',
    required: true,
    description: 'Total facility commitment amount',
    displayOrder: startOrder,
    typicalRange: {
      min: 1000000,
      max: 10000000000,
      unit: 'USD',
      context: 'Standard syndicated facilities range from $1M to $10B',
    },
    extractionHints: ['total commitments', 'aggregate commitments', 'facility amount', 'principal amount'],
  },
  {
    fieldKey: 'currency',
    label: 'Currency',
    category: 'financial-terms',
    dataType: 'enum',
    required: true,
    description: 'Currency of the facility',
    displayOrder: startOrder + 1,
    validationRules: [
      {
        type: 'enum_values',
        value: ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD'],
        message: 'Invalid currency code',
      },
    ],
    extractionHints: ['dollars', 'USD', 'EUR', 'GBP', 'currency'],
  },
  {
    fieldKey: 'base_rate',
    label: 'Base Rate',
    category: 'financial-terms',
    dataType: 'enum',
    required: true,
    description: 'The benchmark interest rate',
    displayOrder: startOrder + 2,
    validationRules: [
      {
        type: 'enum_values',
        value: ['SOFR', 'Term SOFR', 'EURIBOR', 'SONIA', 'LIBOR', 'Prime Rate', 'Base Rate'],
        message: 'Invalid base rate reference',
      },
    ],
    typicalRange: {
      commonValues: ['SOFR', 'Term SOFR', 'EURIBOR', 'SONIA'],
    },
    extractionHints: ['SOFR', 'EURIBOR', 'SONIA', 'LIBOR', 'base rate', 'reference rate'],
  },
  {
    fieldKey: 'initial_margin',
    label: 'Initial Margin',
    category: 'financial-terms',
    dataType: 'percentage',
    required: true,
    description: 'Initial spread over the base rate',
    displayOrder: startOrder + 3,
    typicalRange: {
      min: 0.5,
      max: 10,
      unit: '%',
      context: 'Investment grade typically 1-2%, leveraged typically 3-5%',
    },
    extractionHints: ['margin', 'spread', 'applicable margin', 'interest margin'],
  },
  {
    fieldKey: 'commitment_fee',
    label: 'Commitment Fee',
    category: 'financial-terms',
    dataType: 'percentage',
    required: false,
    description: 'Fee on undrawn commitment amounts',
    displayOrder: startOrder + 4,
    typicalRange: {
      min: 0.1,
      max: 1.0,
      unit: '%',
      context: 'Typically 0.25% to 0.50% for investment grade',
    },
    extractionHints: ['commitment fee', 'undrawn fee', 'unused fee', 'facility fee'],
  },
];

const createCovenantFields = (startOrder: number): TemplateField[] => [
  {
    fieldKey: 'leverage_ratio_max',
    label: 'Maximum Leverage Ratio',
    category: 'covenants',
    dataType: 'ratio',
    required: false,
    description: 'Maximum Total Debt to EBITDA ratio',
    displayOrder: startOrder,
    typicalRange: {
      min: 2.0,
      max: 8.0,
      context: 'Investment grade typically 3.0-4.0x, leveraged typically 5.0-7.0x',
    },
    extractionHints: ['leverage ratio', 'debt to EBITDA', 'total leverage', 'net leverage'],
  },
  {
    fieldKey: 'interest_coverage_min',
    label: 'Minimum Interest Coverage',
    category: 'covenants',
    dataType: 'ratio',
    required: false,
    description: 'Minimum EBITDA to Interest Expense ratio',
    displayOrder: startOrder + 1,
    typicalRange: {
      min: 1.5,
      max: 4.0,
      context: 'Typically 2.0x to 3.0x',
    },
    extractionHints: ['interest coverage', 'EBITDA to interest', 'fixed charge coverage'],
  },
  {
    fieldKey: 'covenant_testing_frequency',
    label: 'Covenant Testing Frequency',
    category: 'covenants',
    dataType: 'enum',
    required: false,
    description: 'How often covenants are tested',
    displayOrder: startOrder + 2,
    validationRules: [
      {
        type: 'enum_values',
        value: ['Quarterly', 'Semi-Annual', 'Annual'],
        message: 'Invalid testing frequency',
      },
    ],
    extractionHints: ['tested quarterly', 'testing period', 'compliance certificate'],
  },
];

// ============================================
// Term Loan Template
// ============================================

export const termLoanTemplate: ExtractionTemplate = {
  id: 'term-loan-standard',
  name: 'Term Loan Agreement',
  documentType: 'term_loan',
  description: 'Standard template for term loan facilities with amortization schedules',
  version: '1.0.0',
  categories: [
    basicInfoCategory,
    keyDatesCategory,
    financialTermsCategory,
    partiesCategory,
    covenantsCategory,
    securityCategory,
  ],
  fields: [
    ...createBasicInfoFields(1),
    ...createKeyDatesFields(5),
    ...createFinancialFields(8),
    // Term loan specific fields
    {
      fieldKey: 'amortization_schedule',
      label: 'Amortization Schedule',
      category: 'financial-terms',
      dataType: 'string',
      required: true,
      description: 'Principal repayment schedule',
      displayOrder: 14,
      extractionHints: ['amortization', 'principal payments', 'scheduled payments', 'repayment schedule'],
    },
    {
      fieldKey: 'prepayment_terms',
      label: 'Prepayment Terms',
      category: 'financial-terms',
      dataType: 'string',
      required: false,
      description: 'Optional prepayment provisions and penalties',
      displayOrder: 15,
      extractionHints: ['prepayment', 'voluntary prepayment', 'mandatory prepayment', 'prepayment premium'],
    },
    ...createCovenantFields(16),
    // Parties
    {
      fieldKey: 'borrower_name',
      label: 'Borrower',
      category: 'parties',
      dataType: 'string',
      required: true,
      description: 'Primary borrower name',
      displayOrder: 20,
      extractionHints: ['borrower', 'company', 'obligor'],
    },
    {
      fieldKey: 'administrative_agent',
      label: 'Administrative Agent',
      category: 'parties',
      dataType: 'string',
      required: true,
      description: 'Administrative agent bank',
      displayOrder: 21,
      extractionHints: ['administrative agent', 'agent', 'admin agent'],
    },
  ],
  detectionKeywords: [
    'term loan',
    'term facility',
    'amortization',
    'scheduled repayment',
    'principal payments',
    'term A',
    'term B',
    'TLA',
    'TLB',
  ],
  autoApplyThreshold: 0.7,
  isSystemTemplate: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// ============================================
// Revolving Credit Template
// ============================================

export const revolvingCreditTemplate: ExtractionTemplate = {
  id: 'revolving-credit-standard',
  name: 'Revolving Credit Facility',
  documentType: 'revolving_credit',
  description: 'Standard template for revolving credit facilities with drawdown and repayment flexibility',
  version: '1.0.0',
  categories: [
    basicInfoCategory,
    keyDatesCategory,
    financialTermsCategory,
    partiesCategory,
    covenantsCategory,
    securityCategory,
  ],
  fields: [
    ...createBasicInfoFields(1),
    ...createKeyDatesFields(5),
    ...createFinancialFields(8),
    // Revolver specific fields
    {
      fieldKey: 'availability_period',
      label: 'Availability Period',
      category: 'key-dates',
      dataType: 'string',
      required: true,
      description: 'Period during which drawings may be made',
      displayOrder: 14,
      extractionHints: ['availability period', 'commitment period', 'drawing period'],
    },
    {
      fieldKey: 'letter_of_credit_sublimit',
      label: 'Letter of Credit Sublimit',
      category: 'financial-terms',
      dataType: 'currency',
      required: false,
      description: 'Maximum amount available for letters of credit',
      displayOrder: 15,
      extractionHints: ['letter of credit sublimit', 'LC sublimit', 'L/C facility'],
    },
    {
      fieldKey: 'swingline_sublimit',
      label: 'Swingline Sublimit',
      category: 'financial-terms',
      dataType: 'currency',
      required: false,
      description: 'Maximum amount available for swingline loans',
      displayOrder: 16,
      extractionHints: ['swingline sublimit', 'swing line', 'same-day loans'],
    },
    {
      fieldKey: 'minimum_draw_amount',
      label: 'Minimum Draw Amount',
      category: 'financial-terms',
      dataType: 'currency',
      required: false,
      description: 'Minimum amount per borrowing',
      displayOrder: 17,
      typicalRange: {
        min: 100000,
        max: 10000000,
        unit: 'USD',
      },
      extractionHints: ['minimum borrowing', 'minimum draw', 'minimum principal amount'],
    },
    ...createCovenantFields(18),
    // Parties
    {
      fieldKey: 'borrower_name',
      label: 'Borrower',
      category: 'parties',
      dataType: 'string',
      required: true,
      description: 'Primary borrower name',
      displayOrder: 22,
      extractionHints: ['borrower', 'company', 'obligor'],
    },
    {
      fieldKey: 'administrative_agent',
      label: 'Administrative Agent',
      category: 'parties',
      dataType: 'string',
      required: true,
      description: 'Administrative agent bank',
      displayOrder: 23,
      extractionHints: ['administrative agent', 'agent', 'admin agent'],
    },
  ],
  detectionKeywords: [
    'revolving',
    'revolver',
    'revolving credit',
    'RCF',
    'revolving facility',
    'availability',
    'drawdown',
    'reborrowing',
  ],
  autoApplyThreshold: 0.7,
  isSystemTemplate: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// ============================================
// Syndicated Facility Template
// ============================================

export const syndicatedFacilityTemplate: ExtractionTemplate = {
  id: 'syndicated-facility-standard',
  name: 'Syndicated Credit Facility',
  documentType: 'syndicated_facility',
  description: 'Template for multi-lender syndicated facilities with detailed lender allocations',
  version: '1.0.0',
  categories: [
    basicInfoCategory,
    keyDatesCategory,
    financialTermsCategory,
    partiesCategory,
    covenantsCategory,
    securityCategory,
    {
      id: 'syndicate',
      name: 'Syndicate Structure',
      description: 'Lender commitments and voting requirements',
      displayOrder: 7,
      icon: 'Network',
    },
  ],
  fields: [
    ...createBasicInfoFields(1),
    ...createKeyDatesFields(5),
    ...createFinancialFields(8),
    // Syndicate specific fields
    {
      fieldKey: 'number_of_lenders',
      label: 'Number of Lenders',
      category: 'syndicate',
      dataType: 'number',
      required: false,
      description: 'Total number of lenders in the syndicate',
      displayOrder: 14,
      typicalRange: {
        min: 2,
        max: 100,
        context: 'Club deals typically 3-7 lenders, broadly syndicated 15-30+',
      },
      extractionHints: ['lenders', 'syndicate banks', 'participating banks'],
    },
    {
      fieldKey: 'lead_arranger',
      label: 'Lead Arranger',
      category: 'syndicate',
      dataType: 'string',
      required: true,
      description: 'Lead arranging bank(s)',
      displayOrder: 15,
      extractionHints: ['lead arranger', 'bookrunner', 'mandated lead arranger', 'MLA'],
    },
    {
      fieldKey: 'required_lenders_threshold',
      label: 'Required Lenders Threshold',
      category: 'syndicate',
      dataType: 'percentage',
      required: false,
      description: 'Voting threshold for Required Lenders',
      displayOrder: 16,
      typicalRange: {
        min: 50,
        max: 66.67,
        unit: '%',
        context: 'Typically 50% or 66.67%',
      },
      extractionHints: ['required lenders', 'majority lenders', 'voting threshold'],
    },
    {
      fieldKey: 'transferability',
      label: 'Transferability',
      category: 'syndicate',
      dataType: 'string',
      required: false,
      description: 'Assignment and participation provisions',
      displayOrder: 17,
      extractionHints: ['assignment', 'participation', 'transfer', 'eligible assignee'],
    },
    {
      fieldKey: 'minimum_hold_amount',
      label: 'Minimum Hold Amount',
      category: 'syndicate',
      dataType: 'currency',
      required: false,
      description: 'Minimum commitment each lender must hold',
      displayOrder: 18,
      typicalRange: {
        min: 1000000,
        max: 25000000,
        unit: 'USD',
      },
      extractionHints: ['minimum hold', 'minimum commitment', 'minimum assignment'],
    },
    ...createCovenantFields(19),
    // Parties
    {
      fieldKey: 'borrower_name',
      label: 'Borrower',
      category: 'parties',
      dataType: 'string',
      required: true,
      description: 'Primary borrower name',
      displayOrder: 23,
      extractionHints: ['borrower', 'company', 'obligor'],
    },
    {
      fieldKey: 'guarantors',
      label: 'Guarantors',
      category: 'parties',
      dataType: 'string',
      required: false,
      description: 'List of guarantor entities',
      displayOrder: 24,
      extractionHints: ['guarantor', 'guarantee', 'subsidiary guarantor'],
    },
    {
      fieldKey: 'administrative_agent',
      label: 'Administrative Agent',
      category: 'parties',
      dataType: 'string',
      required: true,
      description: 'Administrative agent bank',
      displayOrder: 25,
      extractionHints: ['administrative agent', 'agent', 'admin agent'],
    },
    {
      fieldKey: 'collateral_agent',
      label: 'Collateral Agent',
      category: 'parties',
      dataType: 'string',
      required: false,
      description: 'Collateral agent bank',
      displayOrder: 26,
      extractionHints: ['collateral agent', 'security agent', 'security trustee'],
    },
  ],
  detectionKeywords: [
    'syndicated',
    'syndicate',
    'lenders',
    'required lenders',
    'pro rata',
    'commitment schedule',
    'schedule of commitments',
    'arrangers',
    'bookrunner',
  ],
  autoApplyThreshold: 0.7,
  isSystemTemplate: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// ============================================
// Bridge Loan Template
// ============================================

export const bridgeLoanTemplate: ExtractionTemplate = {
  id: 'bridge-loan-standard',
  name: 'Bridge Loan Facility',
  documentType: 'bridge_loan',
  description: 'Template for short-term bridge financing with conversion options',
  version: '1.0.0',
  categories: [
    basicInfoCategory,
    keyDatesCategory,
    financialTermsCategory,
    partiesCategory,
    covenantsCategory,
  ],
  fields: [
    ...createBasicInfoFields(1),
    ...createKeyDatesFields(5),
    ...createFinancialFields(8),
    // Bridge loan specific fields
    {
      fieldKey: 'bridge_term',
      label: 'Bridge Term',
      category: 'key-dates',
      dataType: 'string',
      required: true,
      description: 'Initial bridge period duration',
      displayOrder: 14,
      typicalRange: {
        commonValues: ['6 months', '12 months', '18 months', '364 days'],
      },
      extractionHints: ['bridge term', 'initial term', 'bridge period'],
    },
    {
      fieldKey: 'extension_options',
      label: 'Extension Options',
      category: 'key-dates',
      dataType: 'string',
      required: false,
      description: 'Available extension periods',
      displayOrder: 15,
      extractionHints: ['extension', 'rollover', 'renewal option'],
    },
    {
      fieldKey: 'conversion_option',
      label: 'Conversion Option',
      category: 'financial-terms',
      dataType: 'string',
      required: false,
      description: 'Option to convert to permanent financing',
      displayOrder: 16,
      extractionHints: ['conversion', 'exchange', 'term out', 'permanent financing'],
    },
    {
      fieldKey: 'margin_step_up',
      label: 'Margin Step-Up',
      category: 'financial-terms',
      dataType: 'string',
      required: false,
      description: 'Margin increases over time',
      displayOrder: 17,
      extractionHints: ['step-up', 'margin increase', 'duration fee'],
    },
    ...createCovenantFields(18),
    // Parties
    {
      fieldKey: 'borrower_name',
      label: 'Borrower',
      category: 'parties',
      dataType: 'string',
      required: true,
      description: 'Primary borrower name',
      displayOrder: 22,
      extractionHints: ['borrower', 'company', 'obligor'],
    },
    {
      fieldKey: 'administrative_agent',
      label: 'Administrative Agent',
      category: 'parties',
      dataType: 'string',
      required: true,
      description: 'Administrative agent bank',
      displayOrder: 23,
      extractionHints: ['administrative agent', 'agent', 'admin agent'],
    },
  ],
  detectionKeywords: [
    'bridge',
    'bridge loan',
    'bridge facility',
    'interim financing',
    'short-term',
    'conversion',
    'takeout',
  ],
  autoApplyThreshold: 0.7,
  isSystemTemplate: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// ============================================
// Amendment Template
// ============================================

export const amendmentTemplate: ExtractionTemplate = {
  id: 'amendment-standard',
  name: 'Facility Amendment',
  documentType: 'amendment',
  description: 'Template for amendments to existing credit facilities',
  version: '1.0.0',
  categories: [
    basicInfoCategory,
    {
      id: 'amendment-details',
      name: 'Amendment Details',
      description: 'Specific changes being made to the facility',
      displayOrder: 2,
      icon: 'Edit',
    },
    {
      id: 'consents',
      name: 'Consents & Approvals',
      description: 'Required consents and approvals',
      displayOrder: 3,
      icon: 'CheckCircle',
    },
  ],
  fields: [
    // Basic info
    {
      fieldKey: 'amendment_number',
      label: 'Amendment Number',
      category: 'basic-info',
      dataType: 'string',
      required: true,
      description: 'Amendment sequence number (e.g., First Amendment)',
      displayOrder: 1,
      extractionHints: ['first amendment', 'second amendment', 'amendment no', 'omnibus amendment'],
    },
    {
      fieldKey: 'original_agreement_date',
      label: 'Original Agreement Date',
      category: 'basic-info',
      dataType: 'date',
      required: true,
      description: 'Date of the original credit agreement',
      displayOrder: 2,
      extractionHints: ['original agreement', 'credit agreement dated', 'as amended'],
    },
    {
      fieldKey: 'amendment_effective_date',
      label: 'Amendment Effective Date',
      category: 'basic-info',
      dataType: 'date',
      required: true,
      description: 'Date this amendment becomes effective',
      displayOrder: 3,
      extractionHints: ['effective date', 'amendment date', 'effective as of'],
    },
    // Amendment details
    {
      fieldKey: 'amendment_type',
      label: 'Amendment Type',
      category: 'amendment-details',
      dataType: 'enum',
      required: true,
      description: 'Type of amendment',
      displayOrder: 4,
      validationRules: [
        {
          type: 'enum_values',
          value: ['Pricing Amendment', 'Covenant Amendment', 'Extension', 'Increase', 'Waiver', 'Technical Amendment', 'Omnibus'],
          message: 'Invalid amendment type',
        },
      ],
      extractionHints: ['amendment and restatement', 'covenant relief', 'pricing reset', 'extension amendment'],
    },
    {
      fieldKey: 'sections_amended',
      label: 'Sections Amended',
      category: 'amendment-details',
      dataType: 'string',
      required: true,
      description: 'List of sections being amended',
      displayOrder: 5,
      extractionHints: ['section', 'article', 'hereby amended', 'deleted and replaced'],
    },
    {
      fieldKey: 'summary_of_changes',
      label: 'Summary of Changes',
      category: 'amendment-details',
      dataType: 'string',
      required: false,
      description: 'Brief summary of key changes',
      displayOrder: 6,
      extractionHints: ['whereas', 'recitals', 'background'],
    },
    {
      fieldKey: 'new_maturity_date',
      label: 'New Maturity Date',
      category: 'amendment-details',
      dataType: 'date',
      required: false,
      description: 'Extended maturity date if applicable',
      displayOrder: 7,
      extractionHints: ['maturity date', 'extended to', 'new termination date'],
    },
    {
      fieldKey: 'new_commitment_amount',
      label: 'New Commitment Amount',
      category: 'amendment-details',
      dataType: 'currency',
      required: false,
      description: 'New total commitments if changed',
      displayOrder: 8,
      extractionHints: ['total commitments', 'increased to', 'new aggregate'],
    },
    {
      fieldKey: 'new_margin',
      label: 'New Applicable Margin',
      category: 'amendment-details',
      dataType: 'percentage',
      required: false,
      description: 'New margin/spread if changed',
      displayOrder: 9,
      extractionHints: ['applicable margin', 'new margin', 'pricing grid'],
    },
    // Consents
    {
      fieldKey: 'consent_type_required',
      label: 'Consent Type Required',
      category: 'consents',
      dataType: 'enum',
      required: true,
      description: 'Level of lender consent required',
      displayOrder: 10,
      validationRules: [
        {
          type: 'enum_values',
          value: ['Required Lenders', 'All Lenders', 'Affected Lenders', 'Supermajority'],
          message: 'Invalid consent type',
        },
      ],
      extractionHints: ['required lenders', 'all lenders', 'unanimous consent', 'consent of'],
    },
    {
      fieldKey: 'amendment_fee',
      label: 'Amendment Fee',
      category: 'consents',
      dataType: 'percentage',
      required: false,
      description: 'Fee paid to consenting lenders',
      displayOrder: 11,
      typicalRange: {
        min: 0,
        max: 0.5,
        unit: '%',
        context: 'Typically 0.05% to 0.25% for routine amendments',
      },
      extractionHints: ['amendment fee', 'consent fee', 'work fee'],
    },
  ],
  detectionKeywords: [
    'amendment',
    'amended and restated',
    'first amendment',
    'second amendment',
    'waiver',
    'consent',
    'hereby amend',
    'modification',
  ],
  autoApplyThreshold: 0.7,
  isSystemTemplate: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// ============================================
// All Templates Export
// ============================================

export const systemTemplates: ExtractionTemplate[] = [
  termLoanTemplate,
  revolvingCreditTemplate,
  syndicatedFacilityTemplate,
  bridgeLoanTemplate,
  amendmentTemplate,
];

/**
 * Get a template by ID
 */
export function getTemplateById(templateId: string): ExtractionTemplate | undefined {
  return systemTemplates.find((t) => t.id === templateId);
}

/**
 * Get a template by document type
 */
export function getTemplateByDocumentType(documentType: string): ExtractionTemplate | undefined {
  return systemTemplates.find((t) => t.documentType === documentType);
}

/**
 * Get all available templates
 */
export function getAllTemplates(): ExtractionTemplate[] {
  return systemTemplates;
}

/**
 * Get template fields by category
 */
export function getFieldsByCategory(template: ExtractionTemplate, categoryId: string): TemplateField[] {
  return template.fields.filter((f) => f.category === categoryId).sort((a, b) => a.displayOrder - b.displayOrder);
}
