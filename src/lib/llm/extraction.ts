import { generateStructuredOutput } from './client';
import type { ExtractionResult, ExtractedFacility, ExtractedCovenant, ExtractedObligation, ExtractedEvent, ExtractedESG, ExtractedTerm } from '@/types';

const FACILITY_EXTRACTION_PROMPT = `You are an expert legal analyst specializing in loan documentation. Your task is to extract structured information from loan agreements.

Extract the following information and return it as a JSON object. For each field, also provide a confidence score between 0 and 1 based on how certain you are about the extraction.

Required fields:
- facilityName: The name of the facility
- facilityReference: Any reference number or identifier
- executionDate: Date the agreement was signed (YYYY-MM-DD format)
- effectiveDate: Date the agreement becomes effective (YYYY-MM-DD format)
- maturityDate: When the loan matures (YYYY-MM-DD format)
- facilityType: One of [term, revolving, delayed_draw, swingline, other]
- currency: The currency code (e.g., USD, EUR)
- totalCommitments: Total facility amount as a number
- interestRateType: One of [floating, fixed, hybrid]
- baseRate: The base rate name (e.g., SOFR, EURIBOR)
- marginInitial: The initial margin as a decimal percentage
- governingLaw: The governing law jurisdiction
- borrowers: Array of {name, jurisdiction, role}
- lenders: Array of {name, commitmentAmount, percentage}
- agents: Array of {name, role}

Return your response as a JSON object matching this structure.`;

const COVENANT_EXTRACTION_PROMPT = `You are an expert legal analyst. Extract all financial covenants from the loan agreement.

For each covenant, extract:
- covenantType: One of [leverage_ratio, interest_coverage, debt_service_coverage, net_worth, current_ratio, capex_limit, other]
- covenantName: The name as stated in the document
- numeratorDefinition: How the numerator is defined
- denominatorDefinition: How the denominator is defined
- thresholdType: One of [maximum, minimum, range]
- thresholdValue: The threshold value as a number
- testingFrequency: One of [quarterly, semi_annual, annual]
- clauseReference: The section reference (e.g., "Section 7.1(a)")
- pageNumber: The page number where found
- rawText: The exact text from the document
- confidence: Your confidence score (0-1)

Return as a JSON array of covenant objects.`;

const OBLIGATION_EXTRACTION_PROMPT = `You are an expert legal analyst. Extract all reporting obligations from the loan agreement.

For each obligation, extract:
- obligationType: One of [annual_financials, quarterly_financials, compliance_certificate, budget, audit_report, event_notice, other]
- description: Description of what must be reported
- frequency: One of [annual, quarterly, monthly, on_occurrence, other]
- deadlineDays: Number of days after period end to submit
- recipientRole: Who receives the report (e.g., "Administrative Agent")
- clauseReference: The section reference
- pageNumber: The page number where found
- rawText: The exact text
- confidence: Your confidence score (0-1)

Return as a JSON array of obligation objects.`;

const EVENT_EXTRACTION_PROMPT = `You are an expert legal analyst. Extract all Events of Default from the loan agreement.

For each event, extract:
- eventCategory: One of [payment_default, covenant_breach, representation_breach, cross_default, insolvency, material_adverse_change, change_of_control, other]
- description: Description of the event
- gracePeriodDays: Number of days grace period (if any)
- cureRights: Description of any cure rights
- consequences: What happens if the event occurs
- clauseReference: The section reference
- pageNumber: The page number where found
- rawText: The exact text
- confidence: Your confidence score (0-1)

Return as a JSON array of event objects.`;

const ESG_EXTRACTION_PROMPT = `You are an expert legal analyst. Extract all ESG/sustainability provisions from the loan agreement.

For each provision, extract:
- provisionType: One of [sustainability_linked_margin, green_use_of_proceeds, esg_reporting, esg_covenant, other]
- kpiName: Name of the KPI (if applicable)
- kpiDefinition: How the KPI is defined
- kpiBaseline: The baseline value
- kpiTargets: Array of {date, targetValue, marginAdjustment}
- verificationRequired: Whether external verification is required
- clauseReference: The section reference
- pageNumber: The page number where found
- rawText: The exact text
- confidence: Your confidence score (0-1)

Return as a JSON array of ESG provision objects. If no ESG provisions exist, return an empty array.`;

const TERMS_EXTRACTION_PROMPT = `You are an expert legal analyst. Extract key defined terms from the loan agreement's definitions section.

For each term, extract:
- term: The defined term name
- definition: The full definition text
- clauseReference: Where the term is defined
- pageNumber: The page number
- referencesTerms: Array of other defined terms referenced in this definition

Focus on financial and legal terms that are important for understanding the agreement. Return as a JSON array of term objects.`;

export async function extractFacilityData(documentText: string): Promise<ExtractedFacility & { confidence: number }> {
  const result = await generateStructuredOutput<ExtractedFacility & { confidence: number }>(
    FACILITY_EXTRACTION_PROMPT,
    `Here is the loan agreement text to analyze:\n\n${documentText.slice(0, 100000)}`, // Limit to ~100k chars
    { maxTokens: 4096 }
  );
  return result;
}

export async function extractCovenants(documentText: string): Promise<ExtractedCovenant[]> {
  const result = await generateStructuredOutput<ExtractedCovenant[]>(
    COVENANT_EXTRACTION_PROMPT,
    `Here is the loan agreement text to analyze:\n\n${documentText.slice(0, 100000)}`,
    { maxTokens: 4096 }
  );
  return result;
}

export async function extractObligations(documentText: string): Promise<ExtractedObligation[]> {
  const result = await generateStructuredOutput<ExtractedObligation[]>(
    OBLIGATION_EXTRACTION_PROMPT,
    `Here is the loan agreement text to analyze:\n\n${documentText.slice(0, 100000)}`,
    { maxTokens: 4096 }
  );
  return result;
}

export async function extractEventsOfDefault(documentText: string): Promise<ExtractedEvent[]> {
  const result = await generateStructuredOutput<ExtractedEvent[]>(
    EVENT_EXTRACTION_PROMPT,
    `Here is the loan agreement text to analyze:\n\n${documentText.slice(0, 100000)}`,
    { maxTokens: 4096 }
  );
  return result;
}

export async function extractESGProvisions(documentText: string): Promise<ExtractedESG[]> {
  const result = await generateStructuredOutput<ExtractedESG[]>(
    ESG_EXTRACTION_PROMPT,
    `Here is the loan agreement text to analyze:\n\n${documentText.slice(0, 100000)}`,
    { maxTokens: 4096 }
  );
  return result;
}

export async function extractDefinedTerms(documentText: string): Promise<ExtractedTerm[]> {
  const result = await generateStructuredOutput<ExtractedTerm[]>(
    TERMS_EXTRACTION_PROMPT,
    `Here is the loan agreement text to analyze:\n\n${documentText.slice(0, 50000)}`, // Limit for terms
    { maxTokens: 4096 }
  );
  return result;
}

export async function runFullExtraction(documentText: string): Promise<ExtractionResult> {
  // Run extractions in parallel where possible
  const [facility, covenants, obligations, eventsOfDefault, esgProvisions, definedTerms] = await Promise.all([
    extractFacilityData(documentText).catch(() => null),
    extractCovenants(documentText).catch(() => []),
    extractObligations(documentText).catch(() => []),
    extractEventsOfDefault(documentText).catch(() => []),
    extractESGProvisions(documentText).catch(() => []),
    extractDefinedTerms(documentText).catch(() => []),
  ]);

  // Calculate overall confidence
  const confidences: number[] = [];
  if (facility?.confidence) confidences.push(facility.confidence);
  covenants.forEach(c => confidences.push(c.confidence));
  obligations.forEach(o => confidences.push(o.confidence));
  eventsOfDefault.forEach(e => confidences.push(e.confidence));
  esgProvisions.forEach(p => confidences.push(p.confidence));

  const overallConfidence = confidences.length > 0
    ? confidences.reduce((a, b) => a + b, 0) / confidences.length
    : 0;

  return {
    documentId: '', // Will be set by caller
    facility,
    covenants,
    obligations,
    eventsOfDefault,
    esgProvisions,
    definedTerms,
    overallConfidence,
  };
}
