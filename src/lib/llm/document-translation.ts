import { generateStructuredOutput, generateCompletion } from './client';
import type { ExtractedCovenant, ExtractedObligation, ExtractedFacility } from '@/types';

/**
 * Types for Document Translation Layer
 */

export interface TranslationRequest {
  /** Type of clause being generated */
  clauseType: 'covenant' | 'obligation' | 'facility_term' | 'definition' | 'general';
  /** The structured data to translate back to legal language */
  structuredData: Record<string, unknown>;
  /** Original clause text (if available) for style reference */
  originalClause?: string;
  /** Precedent clause examples to match style */
  precedentClauses?: string[];
  /** Document context for terminology consistency */
  documentContext?: {
    borrowerName?: string;
    facilityName?: string;
    governingLaw?: string;
    definedTerms?: Record<string, string>;
  };
  /** Output format preferences */
  formatOptions?: {
    /** Include section numbering */
    includeNumbering?: boolean;
    /** Use defined term capitalization */
    useDefinedTerms?: boolean;
    /** Include clause reference cross-references */
    includeCrossReferences?: boolean;
    /** Target formality level */
    formalityLevel?: 'standard' | 'formal' | 'simplified';
  };
}

export interface TranslatedClause {
  /** Unique identifier */
  id: string;
  /** The generated legal clause text */
  clauseText: string;
  /** Suggested section reference */
  suggestedSection: string;
  /** Title for the clause */
  clauseTitle: string;
  /** Category of the clause */
  category: string;
  /** Confidence in the translation quality */
  confidence: number;
  /** Precedent match if applicable */
  precedentMatch?: {
    sourceDocument: string;
    matchPercentage: number;
    adaptations: string[];
  };
  /** Warnings or notes about the translation */
  warnings?: string[];
  /** Alternative phrasings */
  alternatives?: string[];
}

export interface TranslationBatchRequest {
  clauses: TranslationRequest[];
  /** Global context for all clauses */
  globalContext: {
    borrowerName: string;
    facilityName: string;
    governingLaw?: string;
    definedTerms?: Record<string, string>;
    documentType?: 'credit_agreement' | 'amendment' | 'consent' | 'waiver';
    institutionStyle?: string;
  };
}

export interface TranslationBatchResponse {
  translatedClauses: TranslatedClause[];
  /** Full document assembly if requested */
  assembledDocument?: string;
  /** Overall quality metrics */
  metrics: {
    averageConfidence: number;
    totalClauses: number;
    warningsCount: number;
  };
}

/**
 * System prompt for covenant translation
 */
const COVENANT_TRANSLATION_PROMPT = `You are an expert legal document drafter specializing in loan agreement covenants.
Your task is to generate professional legal clause language from structured covenant data.

Follow these guidelines:
1. Use formal legal language consistent with standard loan documentation practices
2. Follow LSTA (Loan Syndications and Trading Association) conventions
3. Use proper defined term capitalization (e.g., "Borrower", "Leverage Ratio")
4. Include testing frequency and measurement methodology
5. Be precise with numerical thresholds and ratios
6. Reference appropriate defined terms and cross-references
7. Include cure rights and grace periods where applicable
8. Match the style of precedent clauses if provided

Respond ONLY with valid JSON in the specified format.`;

/**
 * System prompt for obligation translation
 */
const OBLIGATION_TRANSLATION_PROMPT = `You are an expert legal document drafter specializing in loan agreement reporting obligations.
Your task is to generate professional legal clause language from structured obligation data.

Follow these guidelines:
1. Specify the exact deliverable required
2. Include precise timing requirements (days after period end, specific dates)
3. Identify the recipient (Administrative Agent, Required Lenders)
4. Include certification requirements where applicable
5. Reference the form of delivery (via email, physical delivery)
6. Include consequences of non-compliance where appropriate
7. Use standard loan documentation language

Respond ONLY with valid JSON in the specified format.`;

/**
 * System prompt for general term translation
 */
const GENERAL_TRANSLATION_PROMPT = `You are an expert legal document drafter specializing in loan agreements.
Your task is to generate professional legal clause language from structured data.

Follow these guidelines:
1. Use formal legal language consistent with New York law governed loan documentation
2. Follow LSTA (Loan Syndications and Trading Association) conventions
3. Be precise with all numerical values, dates, and percentages
4. Use proper capitalization for defined terms
5. Include appropriate cross-references
6. Match institution-specific drafting styles when precedents are provided

Respond ONLY with valid JSON in the specified format.`;

/**
 * Translate a covenant from structured data to legal clause language
 */
export async function translateCovenant(
  covenant: ExtractedCovenant,
  context?: TranslationRequest['documentContext'],
  precedentClauses?: string[]
): Promise<TranslatedClause> {
  const userPrompt = `Generate a formal covenant clause from the following structured data:

COVENANT DATA:
- Covenant Name: ${covenant.covenantName}
- Covenant Type: ${covenant.covenantType}
- Threshold Type: ${covenant.thresholdType}
- Threshold Value: ${covenant.thresholdValue ?? 'Not specified'}
- Testing Frequency: ${covenant.testingFrequency ?? 'Quarterly'}
- Numerator Definition: ${covenant.numeratorDefinition ?? 'Not specified'}
- Denominator Definition: ${covenant.denominatorDefinition ?? 'Not specified'}

${context ? `DOCUMENT CONTEXT:
- Borrower: ${context.borrowerName ?? 'the Borrower'}
- Facility: ${context.facilityName ?? 'the Facility'}
- Governing Law: ${context.governingLaw ?? 'New York'}
` : ''}

${precedentClauses?.length ? `PRECEDENT CLAUSES (match this style):
${precedentClauses.map((c, i) => `${i + 1}. ${c}`).join('\n\n')}
` : ''}

Generate the clause in this JSON format:
{
  "clauseText": "The complete legal clause text...",
  "suggestedSection": "Section X.X",
  "clauseTitle": "Title for this clause",
  "category": "Financial Covenants",
  "confidence": 0.95,
  "warnings": ["Any drafting notes or warnings"],
  "alternatives": ["Alternative phrasing option 1", "Alternative phrasing option 2"]
}`;

  const response = await generateStructuredOutput<{
    clauseText: string;
    suggestedSection: string;
    clauseTitle: string;
    category: string;
    confidence: number;
    warnings?: string[];
    alternatives?: string[];
  }>(COVENANT_TRANSLATION_PROMPT, userPrompt, {
    maxTokens: 4096,
    temperature: 0.2,
  });

  return {
    id: `covenant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    clauseText: response.clauseText,
    suggestedSection: response.suggestedSection,
    clauseTitle: response.clauseTitle,
    category: response.category,
    confidence: response.confidence,
    warnings: response.warnings,
    alternatives: response.alternatives,
  };
}

/**
 * Translate an obligation from structured data to legal clause language
 */
export async function translateObligation(
  obligation: ExtractedObligation,
  context?: TranslationRequest['documentContext'],
  precedentClauses?: string[]
): Promise<TranslatedClause> {
  const userPrompt = `Generate a formal reporting obligation clause from the following structured data:

OBLIGATION DATA:
- Obligation Type: ${obligation.obligationType}
- Description: ${obligation.description ?? 'Not specified'}
- Frequency: ${obligation.frequency ?? 'Not specified'}
- Deadline Days: ${obligation.deadlineDays ?? 'Not specified'} days after period end
- Recipient: ${obligation.recipientRole ?? 'Administrative Agent'}

${context ? `DOCUMENT CONTEXT:
- Borrower: ${context.borrowerName ?? 'the Borrower'}
- Facility: ${context.facilityName ?? 'the Facility'}
- Governing Law: ${context.governingLaw ?? 'New York'}
` : ''}

${precedentClauses?.length ? `PRECEDENT CLAUSES (match this style):
${precedentClauses.map((c, i) => `${i + 1}. ${c}`).join('\n\n')}
` : ''}

Generate the clause in this JSON format:
{
  "clauseText": "The complete legal clause text...",
  "suggestedSection": "Section X.X",
  "clauseTitle": "Title for this clause",
  "category": "Reporting Covenants",
  "confidence": 0.95,
  "warnings": ["Any drafting notes or warnings"],
  "alternatives": ["Alternative phrasing option 1"]
}`;

  const response = await generateStructuredOutput<{
    clauseText: string;
    suggestedSection: string;
    clauseTitle: string;
    category: string;
    confidence: number;
    warnings?: string[];
    alternatives?: string[];
  }>(OBLIGATION_TRANSLATION_PROMPT, userPrompt, {
    maxTokens: 4096,
    temperature: 0.2,
  });

  return {
    id: `obligation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    clauseText: response.clauseText,
    suggestedSection: response.suggestedSection,
    clauseTitle: response.clauseTitle,
    category: response.category,
    confidence: response.confidence,
    warnings: response.warnings,
    alternatives: response.alternatives,
  };
}

/**
 * Translate a facility term from structured data to legal clause language
 */
export async function translateFacilityTerm(
  termName: string,
  termValue: unknown,
  termType: string,
  context?: TranslationRequest['documentContext'],
  precedentClauses?: string[]
): Promise<TranslatedClause> {
  const userPrompt = `Generate a formal definition or facility term clause from the following structured data:

TERM DATA:
- Term Name: ${termName}
- Term Value: ${JSON.stringify(termValue)}
- Term Type: ${termType}

${context ? `DOCUMENT CONTEXT:
- Borrower: ${context.borrowerName ?? 'the Borrower'}
- Facility: ${context.facilityName ?? 'the Facility'}
- Governing Law: ${context.governingLaw ?? 'New York'}
` : ''}

${precedentClauses?.length ? `PRECEDENT CLAUSES (match this style):
${precedentClauses.map((c, i) => `${i + 1}. ${c}`).join('\n\n')}
` : ''}

Generate the clause in this JSON format:
{
  "clauseText": "The complete legal clause text or definition...",
  "suggestedSection": "Section X.X or Article I Definitions",
  "clauseTitle": "Title or defined term",
  "category": "Definitions or relevant category",
  "confidence": 0.95,
  "warnings": ["Any drafting notes"],
  "alternatives": ["Alternative phrasing"]
}`;

  const response = await generateStructuredOutput<{
    clauseText: string;
    suggestedSection: string;
    clauseTitle: string;
    category: string;
    confidence: number;
    warnings?: string[];
    alternatives?: string[];
  }>(GENERAL_TRANSLATION_PROMPT, userPrompt, {
    maxTokens: 4096,
    temperature: 0.2,
  });

  return {
    id: `term-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    clauseText: response.clauseText,
    suggestedSection: response.suggestedSection,
    clauseTitle: response.clauseTitle,
    category: response.category,
    confidence: response.confidence,
    warnings: response.warnings,
    alternatives: response.alternatives,
  };
}

/**
 * Generate a complete clause from flexible structured input
 */
export async function translateStructuredData(
  request: TranslationRequest
): Promise<TranslatedClause> {
  const { clauseType, structuredData, originalClause, precedentClauses, documentContext, formatOptions } = request;

  let systemPrompt: string;
  switch (clauseType) {
    case 'covenant':
      systemPrompt = COVENANT_TRANSLATION_PROMPT;
      break;
    case 'obligation':
      systemPrompt = OBLIGATION_TRANSLATION_PROMPT;
      break;
    default:
      systemPrompt = GENERAL_TRANSLATION_PROMPT;
  }

  const userPrompt = `Generate a formal legal clause from the following structured data:

CLAUSE TYPE: ${clauseType}

STRUCTURED DATA:
${JSON.stringify(structuredData, null, 2)}

${originalClause ? `ORIGINAL CLAUSE (for reference):
${originalClause}
` : ''}

${documentContext ? `DOCUMENT CONTEXT:
- Borrower: ${documentContext.borrowerName ?? 'the Borrower'}
- Facility: ${documentContext.facilityName ?? 'the Facility'}
- Governing Law: ${documentContext.governingLaw ?? 'New York'}
${documentContext.definedTerms ? `- Defined Terms: ${Object.keys(documentContext.definedTerms).join(', ')}` : ''}
` : ''}

${precedentClauses?.length ? `PRECEDENT CLAUSES (match this style):
${precedentClauses.map((c, i) => `${i + 1}. ${c}`).join('\n\n')}
` : ''}

${formatOptions ? `FORMAT OPTIONS:
- Include Numbering: ${formatOptions.includeNumbering ?? true}
- Use Defined Terms: ${formatOptions.useDefinedTerms ?? true}
- Include Cross-References: ${formatOptions.includeCrossReferences ?? true}
- Formality Level: ${formatOptions.formalityLevel ?? 'formal'}
` : ''}

Generate the clause in this JSON format:
{
  "clauseText": "The complete legal clause text...",
  "suggestedSection": "Section X.X",
  "clauseTitle": "Title for this clause",
  "category": "Appropriate category",
  "confidence": 0.95,
  "precedentMatch": {
    "sourceDocument": "Name if matched",
    "matchPercentage": 0.85,
    "adaptations": ["List of changes made"]
  },
  "warnings": ["Any drafting notes or warnings"],
  "alternatives": ["Alternative phrasing options"]
}`;

  const response = await generateStructuredOutput<{
    clauseText: string;
    suggestedSection: string;
    clauseTitle: string;
    category: string;
    confidence: number;
    precedentMatch?: {
      sourceDocument: string;
      matchPercentage: number;
      adaptations: string[];
    };
    warnings?: string[];
    alternatives?: string[];
  }>(systemPrompt, userPrompt, {
    maxTokens: 4096,
    temperature: 0.2,
  });

  return {
    id: `clause-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    clauseText: response.clauseText,
    suggestedSection: response.suggestedSection,
    clauseTitle: response.clauseTitle,
    category: response.category,
    confidence: response.confidence,
    precedentMatch: response.precedentMatch,
    warnings: response.warnings,
    alternatives: response.alternatives,
  };
}

/**
 * Batch translate multiple clauses with shared context
 */
export async function translateBatch(
  request: TranslationBatchRequest
): Promise<TranslationBatchResponse> {
  const translatedClauses: TranslatedClause[] = [];
  let totalConfidence = 0;
  let warningsCount = 0;

  // Process clauses sequentially to maintain context consistency
  for (const clauseRequest of request.clauses) {
    const translatedClause = await translateStructuredData({
      ...clauseRequest,
      documentContext: {
        ...clauseRequest.documentContext,
        borrowerName: request.globalContext.borrowerName,
        facilityName: request.globalContext.facilityName,
        governingLaw: request.globalContext.governingLaw,
        definedTerms: request.globalContext.definedTerms,
      },
    });

    translatedClauses.push(translatedClause);
    totalConfidence += translatedClause.confidence;
    warningsCount += translatedClause.warnings?.length ?? 0;
  }

  return {
    translatedClauses,
    metrics: {
      averageConfidence: translatedClauses.length > 0 ? totalConfidence / translatedClauses.length : 0,
      totalClauses: translatedClauses.length,
      warningsCount,
    },
  };
}

/**
 * Learn from precedent clauses to improve translation style
 */
export async function analyzePrecedentStyle(
  precedentClauses: string[],
  clauseType: string
): Promise<{
  stylePatterns: string[];
  commonPhrases: string[];
  structureNotes: string;
  recommendations: string[];
}> {
  const userPrompt = `Analyze the following precedent clauses for style patterns and conventions:

CLAUSE TYPE: ${clauseType}

PRECEDENT CLAUSES:
${precedentClauses.map((c, i) => `--- Clause ${i + 1} ---\n${c}`).join('\n\n')}

Analyze these clauses and provide:
1. Common style patterns (e.g., "shall not permit", "as of the last day of")
2. Frequently used phrases
3. Structural conventions (numbering, cross-references)
4. Recommendations for maintaining consistency

Return as JSON:
{
  "stylePatterns": ["pattern 1", "pattern 2"],
  "commonPhrases": ["phrase 1", "phrase 2"],
  "structureNotes": "Notes about structure and formatting",
  "recommendations": ["recommendation 1", "recommendation 2"]
}`;

  return generateStructuredOutput<{
    stylePatterns: string[];
    commonPhrases: string[];
    structureNotes: string;
    recommendations: string[];
  }>(GENERAL_TRANSLATION_PROMPT, userPrompt, {
    maxTokens: 2048,
    temperature: 0.3,
  });
}

/**
 * Convert translated clause to markdown format
 */
export function clauseToMarkdown(clause: TranslatedClause): string {
  let markdown = '';

  markdown += `## ${clause.clauseTitle}\n\n`;
  markdown += `*${clause.suggestedSection} - ${clause.category}*\n\n`;
  markdown += `${clause.clauseText}\n\n`;

  if (clause.warnings?.length) {
    markdown += `### Drafting Notes\n\n`;
    clause.warnings.forEach((warning) => {
      markdown += `- ${warning}\n`;
    });
    markdown += '\n';
  }

  if (clause.alternatives?.length) {
    markdown += `### Alternative Phrasings\n\n`;
    clause.alternatives.forEach((alt, i) => {
      markdown += `**Option ${i + 1}:** ${alt}\n\n`;
    });
  }

  markdown += `---\n`;
  markdown += `*Confidence: ${Math.round(clause.confidence * 100)}%*\n\n`;

  return markdown;
}

/**
 * Convert batch translation to full document markdown
 */
export function batchToDocument(
  response: TranslationBatchResponse,
  documentTitle: string,
  effectiveDate: string
): string {
  let document = '';

  document += `# ${documentTitle}\n\n`;
  document += `**Effective Date:** ${effectiveDate}\n\n`;
  document += `---\n\n`;

  // Group clauses by category
  const groupedClauses: Record<string, TranslatedClause[]> = {};
  response.translatedClauses.forEach((clause) => {
    if (!groupedClauses[clause.category]) {
      groupedClauses[clause.category] = [];
    }
    groupedClauses[clause.category].push(clause);
  });

  // Output by category
  for (const [category, clauses] of Object.entries(groupedClauses)) {
    document += `# ${category}\n\n`;
    clauses.forEach((clause) => {
      document += clauseToMarkdown(clause);
    });
  }

  document += `---\n\n`;
  document += `## Document Metrics\n\n`;
  document += `- **Total Clauses:** ${response.metrics.totalClauses}\n`;
  document += `- **Average Confidence:** ${Math.round(response.metrics.averageConfidence * 100)}%\n`;
  document += `- **Drafting Warnings:** ${response.metrics.warningsCount}\n`;

  return document;
}
