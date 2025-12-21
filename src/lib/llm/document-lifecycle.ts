/**
 * Document Lifecycle Automation Pipeline
 *
 * This module handles end-to-end document workflow automation.
 * When a document is uploaded and processed, it automatically triggers downstream actions:
 * - Creates compliance obligations from extracted covenants
 * - Populates deal room terms from facility agreements
 * - Generates ESG KPI tracking from sustainability clauses
 * - Creates trading DD checklists from facility data
 *
 * Documents become the single source of truth that cascades through all five modules.
 */

import type {
  ExtractionResult,
  ExtractedFacility,
  ExtractedCovenant,
  ExtractedObligation,
  ExtractedEvent,
  ExtractedESG,
} from '@/types';

// ============================================
// Types for Document Lifecycle Automation
// ============================================

export interface DocumentLifecycleConfig {
  documentId: string;
  organizationId: string;
  enableCompliance: boolean;
  enableDeals: boolean;
  enableTrading: boolean;
  enableESG: boolean;
  autoConfirmLowRiskItems: boolean;
  confidenceThreshold: number;
}

export interface LifecycleAutomationResult {
  documentId: string;
  extractionResult: ExtractionResult;
  compliance: ComplianceAutomationResult | null;
  deals: DealsAutomationResult | null;
  trading: TradingAutomationResult | null;
  esg: ESGAutomationResult | null;
  automationStatus: 'completed' | 'partial' | 'failed';
  errors: AutomationError[];
  processingTimeMs: number;
}

export interface ComplianceAutomationResult {
  facilityCreated: boolean;
  facilityId: string | null;
  covenantsCreated: number;
  obligationsCreated: number;
  eventsScheduled: number;
  notificationsCreated: number;
  itemsPendingReview: number;
}

export interface DealsAutomationResult {
  termsPopulated: number;
  categoriesCreated: number;
  baseTermsFromFacility: number;
  definedTermsLinked: number;
}

export interface TradingAutomationResult {
  facilityCreated: boolean;
  facilityId: string | null;
  ddChecklistItemsGenerated: number;
  transferabilityIdentified: boolean;
}

export interface ESGAutomationResult {
  facilityCreated: boolean;
  facilityId: string | null;
  kpisCreated: number;
  targetsCreated: number;
  proceedsCategoriesCreated: number;
}

export interface AutomationError {
  module: 'compliance' | 'deals' | 'trading' | 'esg' | 'extraction';
  code: string;
  message: string;
  recoverable: boolean;
  timestamp: string;
}

export interface AutomationProgress {
  documentId: string;
  phase: AutomationPhase;
  percentComplete: number;
  currentStep: string;
  stepsCompleted: number;
  totalSteps: number;
  modulesProcessed: string[];
  startedAt: string;
  estimatedTimeRemainingMs: number | null;
}

export type AutomationPhase =
  | 'queued'
  | 'extracting'
  | 'processing_compliance'
  | 'processing_deals'
  | 'processing_trading'
  | 'processing_esg'
  | 'finalizing'
  | 'completed'
  | 'failed';

// ============================================
// Covenant to Compliance Mapping
// ============================================

interface MappedComplianceCovenant {
  source_covenant_id?: string;
  covenant_type: string;
  name: string;
  description: string | null;
  numerator_definition: string | null;
  denominator_definition: string | null;
  threshold_type: 'maximum' | 'minimum';
  threshold_schedule: Array<{ effective_from: string; threshold_value: number }> | null;
  testing_frequency: 'quarterly' | 'semi_annual' | 'annual';
  testing_basis: 'period_end' | 'rolling_12_months' | 'rolling_4_quarters';
  has_equity_cure: boolean;
  clause_reference: string | null;
  confidence: number;
  requires_review: boolean;
}

export function mapExtractedCovenantToCompliance(
  covenant: ExtractedCovenant,
  confidenceThreshold: number
): MappedComplianceCovenant {
  // Map covenant type from extraction to compliance schema
  const covenantTypeMap: Record<string, string> = {
    'leverage_ratio': 'leverage_ratio',
    'interest_coverage': 'interest_coverage',
    'debt_service_coverage': 'debt_service_coverage',
    'net_worth': 'net_worth',
    'current_ratio': 'current_ratio',
    'capex_limit': 'capex',
    'minimum_liquidity': 'minimum_liquidity',
    'fixed_charge_coverage': 'fixed_charge_coverage',
    'other': 'other',
  };

  // Map testing frequency
  const frequencyMap: Record<string, 'quarterly' | 'semi_annual' | 'annual'> = {
    'quarterly': 'quarterly',
    'semi_annual': 'semi_annual',
    'annual': 'annual',
  };

  // Determine threshold type from extracted data
  const thresholdType: 'maximum' | 'minimum' =
    covenant.thresholdType?.toLowerCase() === 'minimum' ? 'minimum' : 'maximum';

  // Build threshold schedule if value is available
  const thresholdSchedule = covenant.thresholdValue !== undefined ? [{
    effective_from: new Date().toISOString().split('T')[0],
    threshold_value: covenant.thresholdValue,
  }] : null;

  return {
    covenant_type: covenantTypeMap[covenant.covenantType] || 'other',
    name: covenant.covenantName,
    description: covenant.rawText || null,
    numerator_definition: covenant.numeratorDefinition || null,
    denominator_definition: covenant.denominatorDefinition || null,
    threshold_type: thresholdType,
    threshold_schedule: thresholdSchedule,
    testing_frequency: frequencyMap[covenant.testingFrequency || 'quarterly'] || 'quarterly',
    testing_basis: 'period_end',
    has_equity_cure: false,
    clause_reference: covenant.clauseReference || null,
    confidence: covenant.confidence,
    requires_review: covenant.confidence < confidenceThreshold,
  };
}

// ============================================
// Obligation to Compliance Mapping
// ============================================

interface MappedComplianceObligation {
  source_obligation_id?: string;
  obligation_type: string;
  name: string;
  description: string | null;
  frequency: 'annual' | 'semi_annual' | 'quarterly' | 'monthly' | 'one_time' | 'on_event';
  reference_point: 'period_end' | 'fiscal_year_end' | 'fixed_date' | 'event_date';
  deadline_days: number;
  recipient_roles: string[];
  requires_certification: boolean;
  requires_audit: boolean;
  clause_reference: string | null;
  confidence: number;
  requires_review: boolean;
}

export function mapExtractedObligationToCompliance(
  obligation: ExtractedObligation,
  confidenceThreshold: number
): MappedComplianceObligation {
  // Map obligation type from extraction to compliance schema
  const obligationTypeMap: Record<string, string> = {
    'annual_financials': 'annual_audited_financials',
    'quarterly_financials': 'quarterly_financials',
    'compliance_certificate': 'compliance_certificate',
    'budget': 'annual_budget',
    'audit_report': 'annual_audited_financials',
    'event_notice': 'other',
    'other': 'other',
  };

  // Map frequency
  const frequencyMap: Record<string, 'annual' | 'semi_annual' | 'quarterly' | 'monthly' | 'one_time' | 'on_event'> = {
    'annual': 'annual',
    'quarterly': 'quarterly',
    'monthly': 'monthly',
    'on_occurrence': 'on_event',
    'other': 'quarterly',
  };

  return {
    obligation_type: obligationTypeMap[obligation.obligationType] || 'other',
    name: obligation.description || `${obligation.obligationType} Reporting`,
    description: obligation.rawText || null,
    frequency: frequencyMap[obligation.frequency || 'quarterly'] || 'quarterly',
    reference_point: 'period_end',
    deadline_days: obligation.deadlineDays || 90,
    recipient_roles: obligation.recipientRole ? [obligation.recipientRole] : ['Agent'],
    requires_certification: obligation.obligationType === 'compliance_certificate',
    requires_audit: obligation.obligationType === 'annual_financials' || obligation.obligationType === 'audit_report',
    clause_reference: obligation.clauseReference || null,
    confidence: obligation.confidence,
    requires_review: obligation.confidence < confidenceThreshold,
  };
}

// ============================================
// ESG Provision to ESG Module Mapping
// ============================================

interface MappedESGKPI {
  source_provision_id?: string;
  kpi_name: string;
  kpi_category: string;
  kpi_subcategory: string | null;
  unit_of_measure: string;
  measurement_methodology: string | null;
  baseline_year: number | null;
  baseline_value: number | null;
  improvement_direction: 'decrease' | 'increase';
  is_core_kpi: boolean;
  requires_external_verification: boolean;
  clause_reference: string | null;
  targets: Array<{
    target_year: number;
    target_value: number;
    margin_adjustment_bps: number | null;
  }>;
  confidence: number;
  requires_review: boolean;
}

export function mapExtractedESGToKPI(
  esgProvision: ExtractedESG,
  confidenceThreshold: number
): MappedESGKPI | null {
  // Only process provisions with KPI information
  if (!esgProvision.kpiName) {
    return null;
  }

  // Determine KPI category based on provision type and name
  const categoryFromName = inferKPICategoryFromName(esgProvision.kpiName);

  // Map targets from extracted data
  const targets = (esgProvision.kpiTargets || []).map((target, index) => ({
    target_year: new Date(target.date).getFullYear() || (new Date().getFullYear() + index + 1),
    target_value: target.targetValue,
    margin_adjustment_bps: target.marginAdjustment || null,
  }));

  return {
    kpi_name: esgProvision.kpiName,
    kpi_category: categoryFromName,
    kpi_subcategory: null,
    unit_of_measure: inferUnitOfMeasure(esgProvision.kpiName, esgProvision.kpiDefinition),
    measurement_methodology: esgProvision.kpiDefinition || null,
    baseline_year: esgProvision.kpiBaseline ? new Date().getFullYear() - 1 : null,
    baseline_value: esgProvision.kpiBaseline || null,
    improvement_direction: inferImprovementDirection(esgProvision.kpiName),
    is_core_kpi: esgProvision.provisionType === 'sustainability_linked_margin',
    requires_external_verification: esgProvision.verificationRequired || false,
    clause_reference: esgProvision.clauseReference || null,
    targets,
    confidence: esgProvision.confidence,
    requires_review: esgProvision.confidence < confidenceThreshold,
  };
}

function inferKPICategoryFromName(kpiName: string): string {
  const lowerName = kpiName.toLowerCase();

  if (lowerName.includes('carbon') || lowerName.includes('emission') || lowerName.includes('ghg') || lowerName.includes('co2')) {
    return 'environmental_emissions';
  }
  if (lowerName.includes('energy') || lowerName.includes('renewable') || lowerName.includes('electricity')) {
    return 'environmental_energy';
  }
  if (lowerName.includes('water') || lowerName.includes('effluent')) {
    return 'environmental_water';
  }
  if (lowerName.includes('waste') || lowerName.includes('recycl')) {
    return 'environmental_waste';
  }
  if (lowerName.includes('diversity') || lowerName.includes('gender') || lowerName.includes('employee')) {
    return 'social_workforce';
  }
  if (lowerName.includes('safety') || lowerName.includes('injury') || lowerName.includes('accident')) {
    return 'social_health_safety';
  }
  if (lowerName.includes('board') || lowerName.includes('governance')) {
    return 'governance_board';
  }

  return 'other';
}

function inferUnitOfMeasure(kpiName: string, definition?: string): string {
  const lowerName = (kpiName + ' ' + (definition || '')).toLowerCase();

  if (lowerName.includes('ratio') || lowerName.includes('percentage') || lowerName.includes('%')) {
    return '%';
  }
  if (lowerName.includes('tco2') || lowerName.includes('tonnes co2') || lowerName.includes('carbon')) {
    return 'tCO2e';
  }
  if (lowerName.includes('mwh') || lowerName.includes('megawatt')) {
    return 'MWh';
  }
  if (lowerName.includes('kwh') || lowerName.includes('kilowatt')) {
    return 'kWh';
  }
  if (lowerName.includes('cubic') || lowerName.includes('m3') || lowerName.includes('water')) {
    return 'm³';
  }
  if (lowerName.includes('tonnes') || lowerName.includes('tons')) {
    return 'tonnes';
  }

  return 'units';
}

function inferImprovementDirection(kpiName: string): 'decrease' | 'increase' {
  const lowerName = kpiName.toLowerCase();

  // Things that should decrease
  if (lowerName.includes('emission') || lowerName.includes('carbon') ||
      lowerName.includes('waste') || lowerName.includes('injury') ||
      lowerName.includes('accident') || lowerName.includes('water consumption') ||
      lowerName.includes('energy consumption')) {
    return 'decrease';
  }

  // Things that should increase (default)
  return 'increase';
}

// ============================================
// Facility to Deal Terms Mapping
// ============================================

interface MappedDealTerm {
  term_key: string;
  term_label: string;
  term_description: string | null;
  value_type: string;
  current_value: unknown;
  current_value_text: string | null;
  source_clause_reference: string | null;
  category: string;
}

export function mapFacilityToDealtTerms(facility: ExtractedFacility): MappedDealTerm[] {
  const terms: MappedDealTerm[] = [];

  // Facility name and type
  if (facility.facilityName) {
    terms.push({
      term_key: 'facility_name',
      term_label: 'Facility Name',
      term_description: 'The name of the facility',
      value_type: 'text',
      current_value: facility.facilityName,
      current_value_text: facility.facilityName,
      source_clause_reference: null,
      category: 'General',
    });
  }

  if (facility.facilityType) {
    terms.push({
      term_key: 'facility_type',
      term_label: 'Facility Type',
      term_description: 'Type of credit facility',
      value_type: 'selection',
      current_value: facility.facilityType,
      current_value_text: facility.facilityType,
      source_clause_reference: null,
      category: 'General',
    });
  }

  // Amounts and currency
  if (facility.totalCommitments !== undefined) {
    terms.push({
      term_key: 'total_commitments',
      term_label: 'Total Commitments',
      term_description: 'Total facility commitment amount',
      value_type: 'currency_amount',
      current_value: facility.totalCommitments,
      current_value_text: `${facility.currency || 'USD'} ${facility.totalCommitments.toLocaleString()}`,
      source_clause_reference: null,
      category: 'Financial Terms',
    });
  }

  if (facility.currency) {
    terms.push({
      term_key: 'currency',
      term_label: 'Currency',
      term_description: 'Facility currency',
      value_type: 'selection',
      current_value: facility.currency,
      current_value_text: facility.currency,
      source_clause_reference: null,
      category: 'Financial Terms',
    });
  }

  // Interest rate terms
  if (facility.interestRateType) {
    terms.push({
      term_key: 'interest_rate_type',
      term_label: 'Interest Rate Type',
      term_description: 'Type of interest rate (fixed, floating, hybrid)',
      value_type: 'selection',
      current_value: facility.interestRateType,
      current_value_text: facility.interestRateType,
      source_clause_reference: null,
      category: 'Pricing',
    });
  }

  if (facility.baseRate) {
    terms.push({
      term_key: 'base_rate',
      term_label: 'Base Rate',
      term_description: 'Reference rate for floating interest',
      value_type: 'selection',
      current_value: facility.baseRate,
      current_value_text: facility.baseRate,
      source_clause_reference: null,
      category: 'Pricing',
    });
  }

  if (facility.marginInitial !== undefined) {
    terms.push({
      term_key: 'initial_margin',
      term_label: 'Initial Margin',
      term_description: 'Initial margin over base rate (bps)',
      value_type: 'number',
      current_value: facility.marginInitial,
      current_value_text: `${facility.marginInitial} bps`,
      source_clause_reference: null,
      category: 'Pricing',
    });
  }

  // Key dates
  if (facility.effectiveDate) {
    terms.push({
      term_key: 'effective_date',
      term_label: 'Effective Date',
      term_description: 'Date the facility becomes effective',
      value_type: 'date',
      current_value: facility.effectiveDate,
      current_value_text: facility.effectiveDate,
      source_clause_reference: null,
      category: 'Key Dates',
    });
  }

  if (facility.maturityDate) {
    terms.push({
      term_key: 'maturity_date',
      term_label: 'Maturity Date',
      term_description: 'Final maturity date of the facility',
      value_type: 'date',
      current_value: facility.maturityDate,
      current_value_text: facility.maturityDate,
      source_clause_reference: null,
      category: 'Key Dates',
    });
  }

  // Legal terms
  if (facility.governingLaw) {
    terms.push({
      term_key: 'governing_law',
      term_label: 'Governing Law',
      term_description: 'Jurisdiction governing the agreement',
      value_type: 'selection',
      current_value: facility.governingLaw,
      current_value_text: facility.governingLaw,
      source_clause_reference: null,
      category: 'Legal',
    });
  }

  return terms;
}

// ============================================
// Facility to Trading Module Mapping
// ============================================

interface MappedTradeFacility {
  source_facility_id?: string;
  facility_name: string;
  facility_reference: string | null;
  borrower_name: string;
  total_commitments: number;
  currency: string;
  maturity_date: string;
  transferability: 'freely_transferable' | 'consent_required' | 'restricted';
  minimum_transfer_amount: number | null;
  current_status: 'performing' | 'default' | 'restructuring';
}

export function mapFacilityToTrading(facility: ExtractedFacility): MappedTradeFacility | null {
  // Need at least facility name to create trading record
  if (!facility.facilityName) {
    return null;
  }

  const borrowerName = facility.borrowers?.[0]?.name || 'Unknown Borrower';

  return {
    facility_name: facility.facilityName,
    facility_reference: facility.facilityReference || null,
    borrower_name: borrowerName,
    total_commitments: facility.totalCommitments || 0,
    currency: facility.currency || 'USD',
    maturity_date: facility.maturityDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    transferability: 'consent_required', // Default - will need review
    minimum_transfer_amount: null,
    current_status: 'performing',
  };
}

// ============================================
// DD Checklist Item Generation
// ============================================

interface GeneratedDDChecklistItem {
  category: string;
  item_name: string;
  item_description: string;
  data_source: 'auto_system' | 'seller_provided' | 'document_review' | 'external';
  required_for: 'buyer' | 'seller' | 'both';
  is_critical: boolean;
  display_order: number;
}

export function generateDDChecklistFromExtraction(
  facility: ExtractedFacility | null,
  covenants: ExtractedCovenant[],
  obligations: ExtractedObligation[],
  eventsOfDefault: ExtractedEvent[]
): GeneratedDDChecklistItem[] {
  const items: GeneratedDDChecklistItem[] = [];
  let order = 0;

  // Facility Status items
  items.push({
    category: 'facility_status',
    item_name: 'Facility Agreement Verification',
    item_description: 'Verify existence and terms of the facility agreement',
    data_source: 'document_review',
    required_for: 'both',
    is_critical: true,
    display_order: order++,
  });

  if (facility?.maturityDate) {
    items.push({
      category: 'facility_status',
      item_name: 'Maturity Date Confirmation',
      item_description: `Confirm facility maturity date: ${facility.maturityDate}`,
      data_source: 'document_review',
      required_for: 'buyer',
      is_critical: true,
      display_order: order++,
    });
  }

  if (facility?.totalCommitments) {
    items.push({
      category: 'facility_status',
      item_name: 'Commitment Amount Verification',
      item_description: `Verify total commitments: ${facility.currency || 'USD'} ${facility.totalCommitments.toLocaleString()}`,
      data_source: 'seller_provided',
      required_for: 'buyer',
      is_critical: true,
      display_order: order++,
    });
  }

  // Covenant Compliance items
  if (covenants.length > 0) {
    items.push({
      category: 'covenant_compliance',
      item_name: 'Current Covenant Compliance Status',
      item_description: `Review compliance status for ${covenants.length} financial covenants`,
      data_source: 'seller_provided',
      required_for: 'buyer',
      is_critical: true,
      display_order: order++,
    });

    // Add specific items for critical covenants
    covenants.filter(c => c.covenantType === 'leverage_ratio' || c.covenantType === 'interest_coverage').forEach(covenant => {
      items.push({
        category: 'covenant_compliance',
        item_name: `${covenant.covenantName} Test Results`,
        item_description: `Review most recent test results for ${covenant.covenantName}`,
        data_source: 'seller_provided',
        required_for: 'buyer',
        is_critical: true,
        display_order: order++,
      });
    });
  }

  // Documentation items
  items.push({
    category: 'documentation',
    item_name: 'Credit Agreement (Execution Copy)',
    item_description: 'Obtain executed copy of the credit agreement',
    data_source: 'seller_provided',
    required_for: 'both',
    is_critical: true,
    display_order: order++,
  });

  if (obligations.length > 0) {
    items.push({
      category: 'documentation',
      item_name: 'Recent Compliance Certificates',
      item_description: 'Review last four compliance certificates',
      data_source: 'seller_provided',
      required_for: 'buyer',
      is_critical: false,
      display_order: order++,
    });
  }

  // Transferability items
  items.push({
    category: 'transferability',
    item_name: 'Assignment Provisions Review',
    item_description: 'Review assignment and transfer provisions in credit agreement',
    data_source: 'document_review',
    required_for: 'both',
    is_critical: true,
    display_order: order++,
  });

  items.push({
    category: 'transferability',
    item_name: 'Consent Requirements',
    item_description: 'Identify any required consents for assignment',
    data_source: 'document_review',
    required_for: 'both',
    is_critical: true,
    display_order: order++,
  });

  // Events of Default items
  if (eventsOfDefault.length > 0) {
    items.push({
      category: 'legal_regulatory',
      item_name: 'Events of Default Status',
      item_description: 'Confirm no existing events of default',
      data_source: 'seller_provided',
      required_for: 'buyer',
      is_critical: true,
      display_order: order++,
    });
  }

  // Standard operational items
  items.push({
    category: 'operational',
    item_name: 'Agent Confirmation',
    item_description: 'Confirm identity of administrative agent and wire instructions',
    data_source: 'external',
    required_for: 'both',
    is_critical: true,
    display_order: order++,
  });

  return items;
}

// ============================================
// Compliance Calendar Event Generation
// ============================================

interface GeneratedComplianceEvent {
  obligation_type: string;
  obligation_name: string;
  reference_period_start: string;
  reference_period_end: string;
  deadline_date: string;
  grace_deadline_date: string;
  status: 'upcoming';
}

export function generateComplianceEventsForYear(
  obligations: MappedComplianceObligation[],
  fiscalYearEnd: string = '12-31'
): GeneratedComplianceEvent[] {
  const events: GeneratedComplianceEvent[] = [];
  const currentYear = new Date().getFullYear();
  const [fyMonth, fyDay] = fiscalYearEnd.split('-').map(Number);

  obligations.forEach(obligation => {
    if (obligation.frequency === 'quarterly') {
      // Generate quarterly events
      for (let quarter = 1; quarter <= 4; quarter++) {
        const quarterEnd = getQuarterEndDate(currentYear, quarter, fyMonth);
        const deadline = addDays(quarterEnd, obligation.deadline_days);

        events.push({
          obligation_type: obligation.obligation_type,
          obligation_name: obligation.name,
          reference_period_start: getQuarterStartDate(currentYear, quarter, fyMonth),
          reference_period_end: quarterEnd,
          deadline_date: deadline,
          grace_deadline_date: addDays(deadline, 5),
          status: 'upcoming',
        });
      }
    } else if (obligation.frequency === 'annual') {
      // Generate annual event
      const yearEnd = `${currentYear}-${String(fyMonth).padStart(2, '0')}-${String(fyDay).padStart(2, '0')}`;
      const yearStart = `${currentYear - 1}-${String(fyMonth + 1).padStart(2, '0')}-01`;
      const deadline = addDays(yearEnd, obligation.deadline_days);

      events.push({
        obligation_type: obligation.obligation_type,
        obligation_name: obligation.name,
        reference_period_start: yearStart,
        reference_period_end: yearEnd,
        deadline_date: deadline,
        grace_deadline_date: addDays(deadline, 10),
        status: 'upcoming',
      });
    }
  });

  return events;
}

function getQuarterEndDate(year: number, quarter: number, fyMonth: number): string {
  // Adjust for fiscal year offset
  const monthsFromFY = ((quarter * 3) + fyMonth - 1) % 12 + 1;
  const adjustedYear = monthsFromFY <= 3 && fyMonth > 3 ? year + 1 : year;
  const lastDay = new Date(adjustedYear, monthsFromFY, 0).getDate();
  return `${adjustedYear}-${String(monthsFromFY).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

function getQuarterStartDate(year: number, quarter: number, fyMonth: number): string {
  const monthsFromFY = (((quarter - 1) * 3) + fyMonth) % 12 + 1;
  const adjustedYear = monthsFromFY > fyMonth && quarter === 1 ? year - 1 : year;
  return `${adjustedYear}-${String(monthsFromFY).padStart(2, '0')}-01`;
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

// ============================================
// Automation Status Tracking
// ============================================

const automationProgressMap = new Map<string, AutomationProgress>();

export function initializeAutomationProgress(documentId: string): AutomationProgress {
  const progress: AutomationProgress = {
    documentId,
    phase: 'queued',
    percentComplete: 0,
    currentStep: 'Initializing automation pipeline',
    stepsCompleted: 0,
    totalSteps: 10,
    modulesProcessed: [],
    startedAt: new Date().toISOString(),
    estimatedTimeRemainingMs: null,
  };
  automationProgressMap.set(documentId, progress);
  return progress;
}

export function updateAutomationProgress(
  documentId: string,
  updates: Partial<AutomationProgress>
): AutomationProgress | null {
  const existing = automationProgressMap.get(documentId);
  if (!existing) return null;

  const updated = { ...existing, ...updates };
  automationProgressMap.set(documentId, updated);
  return updated;
}

export function getAutomationProgress(documentId: string): AutomationProgress | null {
  return automationProgressMap.get(documentId) || null;
}

export function clearAutomationProgress(documentId: string): void {
  automationProgressMap.delete(documentId);
}

// ============================================
// Main Orchestration Functions
// ============================================

export interface AutomationOrchestrator {
  processDocument(
    extractionResult: ExtractionResult,
    config: DocumentLifecycleConfig
  ): Promise<LifecycleAutomationResult>;
}

/**
 * Create cascade data package from extraction results
 * This bundles all transformed data for downstream module consumption
 */
export function createCascadeDataPackage(
  extractionResult: ExtractionResult,
  config: DocumentLifecycleConfig
) {
  const { facility, covenants, obligations, eventsOfDefault, esgProvisions } = extractionResult;

  return {
    documentId: extractionResult.documentId,
    organizationId: config.organizationId,
    extractedAt: new Date().toISOString(),

    // Compliance module data
    compliance: config.enableCompliance ? {
      covenants: covenants.map(c => mapExtractedCovenantToCompliance(c, config.confidenceThreshold)),
      obligations: obligations.map(o => mapExtractedObligationToCompliance(o, config.confidenceThreshold)),
      facilityData: facility ? {
        facility_name: facility.facilityName,
        facility_reference: facility.facilityReference || null,
        borrower_name: facility.borrowers?.[0]?.name || 'Unknown',
        maturity_date: facility.maturityDate || null,
        reporting_currency: facility.currency || 'USD',
      } : null,
    } : null,

    // Deals module data
    deals: config.enableDeals && facility ? {
      terms: mapFacilityToDealtTerms(facility),
      categories: ['General', 'Financial Terms', 'Pricing', 'Key Dates', 'Legal'],
    } : null,

    // Trading module data
    trading: config.enableTrading && facility ? {
      facility: mapFacilityToTrading(facility),
      ddChecklistItems: generateDDChecklistFromExtraction(facility, covenants, obligations, eventsOfDefault),
    } : null,

    // ESG module data
    esg: config.enableESG ? {
      kpis: esgProvisions
        .map(p => mapExtractedESGToKPI(p, config.confidenceThreshold))
        .filter((kpi): kpi is MappedESGKPI => kpi !== null),
      hasMarginAdjustment: esgProvisions.some(p => p.provisionType === 'sustainability_linked_margin'),
      proceedsCategories: esgProvisions
        .filter(p => p.provisionType === 'green_use_of_proceeds')
        .map(p => ({
          category_name: p.kpiName || 'Green Proceeds',
          category_type: 'green' as const,
          eligibility_criteria: p.kpiDefinition || null,
          clause_reference: p.clauseReference || null,
        })),
    } : null,

    // Summary stats
    stats: {
      totalCovenants: covenants.length,
      totalObligations: obligations.length,
      totalESGProvisions: esgProvisions.length,
      totalEventsOfDefault: eventsOfDefault.length,
      itemsRequiringReview: [
        ...covenants.filter(c => c.confidence < config.confidenceThreshold),
        ...obligations.filter(o => o.confidence < config.confidenceThreshold),
        ...esgProvisions.filter(e => e.confidence < config.confidenceThreshold),
      ].length,
      overallConfidence: extractionResult.overallConfidence,
    },
  };
}

export type CascadeDataPackage = ReturnType<typeof createCascadeDataPackage>;
