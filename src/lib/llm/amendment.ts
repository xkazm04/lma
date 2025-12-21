import { generateCompletion, generateStructuredOutput } from './client';
import type { ComparisonResult } from '@/types';
import type { AmendmentDraft, AmendmentClause } from '@/app/features/documents/sub_Compare/lib/amendment-types';

/**
 * System prompt for amendment generation
 */
const AMENDMENT_SYSTEM_PROMPT = `You are an expert legal document drafter specializing in loan agreement amendments.
Your task is to generate professional amendment language based on detected changes between two loan documents.

Follow these guidelines:
1. Use formal legal language consistent with standard loan documentation practices
2. Reference the original agreement properly (e.g., "Section X of the Credit Agreement is hereby amended...")
3. For modifications, clearly state what is being changed from and to
4. For additions, use "The following new Section/provision is hereby added..."
5. For removals, use "Section X is hereby deleted in its entirety"
6. Be precise with numerical values, dates, and percentages
7. Include appropriate defined term references where applicable
8. Follow LSTA (Loan Syndications and Trading Association) conventions where appropriate

Respond ONLY with valid JSON in the specified format.`;

/**
 * Generate amendment draft from comparison result
 */
export async function generateAmendmentDraft(
  comparisonResult: ComparisonResult,
  options?: {
    includeRecitals?: boolean;
    includeGeneralProvisions?: boolean;
    effectiveDate?: string;
    amendmentNumber?: string;
  }
): Promise<AmendmentDraft> {
  const {
    includeRecitals = true,
    includeGeneralProvisions = true,
    effectiveDate = '[DATE]',
    amendmentNumber = 'First',
  } = options || {};

  // Prepare the changes for the LLM
  const changesDescription = comparisonResult.differences
    .map((diff, index) => {
      const original = diff.document1Value ?? 'N/A';
      const amended = diff.document2Value ?? 'N/A';
      return `${index + 1}. Category: ${diff.category}
   Field: ${diff.field}
   Change Type: ${diff.changeType}
   Original Value: ${original}
   New Value: ${amended}`;
    })
    .join('\n\n');

  const userPrompt = `Generate a loan agreement amendment based on the following comparison:

ORIGINAL DOCUMENT: ${comparisonResult.document1.name}
AMENDED DOCUMENT: ${comparisonResult.document2.name}
AMENDMENT NUMBER: ${amendmentNumber}
EFFECTIVE DATE: ${effectiveDate}

DETECTED CHANGES:
${changesDescription}

${comparisonResult.impactAnalysis ? `IMPACT ANALYSIS: ${comparisonResult.impactAnalysis}` : ''}

Generate the amendment draft in the following JSON format:
{
  "title": "AMENDMENT NO. X TO CREDIT AGREEMENT",
  "recitals": ["WHEREAS clause 1", "WHEREAS clause 2", ...],
  "clauses": [
    {
      "id": "clause-1",
      "sectionNumber": "1",
      "title": "Amendment to Section X",
      "content": "The full amendment language here...",
      "originalValue": "original value if applicable",
      "newValue": "new value if applicable",
      "category": "Financial Terms",
      "changeType": "modified",
      "confidence": 0.95,
      "originalClauseReference": "Section X.X"
    }
  ],
  "generalProvisions": ["Provision 1", "Provision 2", ...],
  "summary": "A brief summary of the key changes in this amendment"
}

${!includeRecitals ? 'Skip the recitals array (return empty array).' : ''}
${!includeGeneralProvisions ? 'Skip the generalProvisions array (return empty array).' : ''}`;

  try {
    const response = await generateStructuredOutput<{
      title: string;
      recitals: string[];
      clauses: Omit<AmendmentClause, 'id'>[];
      generalProvisions: string[];
      summary: string;
    }>(AMENDMENT_SYSTEM_PROMPT, userPrompt, {
      maxTokens: 8192,
      temperature: 0.2,
    });

    // Calculate overall confidence
    const avgConfidence =
      response.clauses.length > 0
        ? response.clauses.reduce((sum, c) => sum + (c.confidence || 0.85), 0) / response.clauses.length
        : 0.85;

    // Build the amendment draft
    const draft: AmendmentDraft = {
      id: `amendment-${Date.now()}`,
      title: response.title || `${amendmentNumber.toUpperCase()} AMENDMENT TO CREDIT AGREEMENT`,
      originalDocument: comparisonResult.document1,
      amendedDocument: comparisonResult.document2,
      effectiveDate,
      recitals: response.recitals || [],
      clauses: response.clauses.map((clause, index) => ({
        ...clause,
        id: `clause-${index + 1}`,
        confidence: clause.confidence || 0.85,
      })),
      generalProvisions: response.generalProvisions || [],
      summary: response.summary || comparisonResult.impactAnalysis || '',
      overallConfidence: avgConfidence,
      generatedAt: new Date().toISOString(),
      status: 'ready',
    };

    return draft;
  } catch (error) {
    console.error('Error generating amendment draft:', error);
    throw new Error(
      `Failed to generate amendment draft: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate a single amendment clause for a specific change
 */
export async function generateAmendmentClause(
  field: string,
  category: string,
  changeType: 'added' | 'removed' | 'modified',
  originalValue: unknown,
  newValue: unknown
): Promise<AmendmentClause> {
  const userPrompt = `Generate amendment language for the following change:

Category: ${category}
Field: ${field}
Change Type: ${changeType}
Original Value: ${originalValue ?? 'N/A'}
New Value: ${newValue ?? 'N/A'}

Respond with JSON:
{
  "sectionNumber": "X",
  "title": "Amendment Title",
  "content": "Full amendment clause content",
  "originalClauseReference": "Section reference if applicable",
  "confidence": 0.9
}`;

  const response = await generateStructuredOutput<{
    sectionNumber: string;
    title: string;
    content: string;
    originalClauseReference?: string;
    confidence: number;
  }>(AMENDMENT_SYSTEM_PROMPT, userPrompt, {
    maxTokens: 2048,
    temperature: 0.2,
  });

  return {
    id: `clause-${Date.now()}`,
    sectionNumber: response.sectionNumber,
    title: response.title,
    content: response.content,
    originalValue: originalValue as string | null,
    newValue: newValue as string | null,
    category,
    changeType,
    confidence: response.confidence,
    originalClauseReference: response.originalClauseReference,
  };
}

/**
 * Convert amendment draft to markdown format
 */
export function amendmentToMarkdown(draft: AmendmentDraft): string {
  let markdown = '';

  // Title
  markdown += `# ${draft.title}\n\n`;
  markdown += `**Effective Date:** ${draft.effectiveDate}\n\n`;
  markdown += `---\n\n`;

  // Recitals
  if (draft.recitals.length > 0) {
    markdown += `## RECITALS\n\n`;
    draft.recitals.forEach((recital, index) => {
      markdown += `${String.fromCharCode(65 + index)}. ${recital}\n\n`;
    });
  }

  // Amendment clauses
  markdown += `## AMENDMENTS\n\n`;
  draft.clauses.forEach((clause) => {
    markdown += `### Section ${clause.sectionNumber}: ${clause.title}\n\n`;
    markdown += `${clause.content}\n\n`;
    if (clause.originalValue && clause.newValue) {
      markdown += `> **From:** ${clause.originalValue}\n`;
      markdown += `> **To:** ${clause.newValue}\n\n`;
    }
  });

  // General Provisions
  if (draft.generalProvisions.length > 0) {
    markdown += `## GENERAL PROVISIONS\n\n`;
    draft.generalProvisions.forEach((provision, index) => {
      markdown += `${index + 1}. ${provision}\n\n`;
    });
  }

  // Signature blocks placeholder
  markdown += `---\n\n`;
  markdown += `## SIGNATURES\n\n`;
  markdown += `IN WITNESS WHEREOF, the parties hereto have caused this Amendment to be executed as of the date first written above.\n\n`;
  markdown += `**BORROWER:**\n\n`;
  markdown += `By: _______________________\n`;
  markdown += `Name:\n`;
  markdown += `Title:\n\n`;
  markdown += `**ADMINISTRATIVE AGENT:**\n\n`;
  markdown += `By: _______________________\n`;
  markdown += `Name:\n`;
  markdown += `Title:\n\n`;
  markdown += `**LENDERS:**\n\n`;
  markdown += `[Signature pages to follow]\n`;

  return markdown;
}

/**
 * Convert amendment draft to plain text format
 */
export function amendmentToText(draft: AmendmentDraft): string {
  let text = '';

  // Title
  text += `${draft.title}\n`;
  text += `${'='.repeat(draft.title.length)}\n\n`;
  text += `Effective Date: ${draft.effectiveDate}\n\n`;

  // Recitals
  if (draft.recitals.length > 0) {
    text += `RECITALS\n`;
    text += `---------\n\n`;
    draft.recitals.forEach((recital, index) => {
      text += `${String.fromCharCode(65 + index)}. ${recital}\n\n`;
    });
  }

  // Amendment clauses
  text += `AMENDMENTS\n`;
  text += `----------\n\n`;
  draft.clauses.forEach((clause) => {
    text += `Section ${clause.sectionNumber}: ${clause.title}\n\n`;
    text += `${clause.content}\n\n`;
    if (clause.originalValue && clause.newValue) {
      text += `  From: ${clause.originalValue}\n`;
      text += `  To: ${clause.newValue}\n\n`;
    }
  });

  // General Provisions
  if (draft.generalProvisions.length > 0) {
    text += `GENERAL PROVISIONS\n`;
    text += `------------------\n\n`;
    draft.generalProvisions.forEach((provision, index) => {
      text += `${index + 1}. ${provision}\n\n`;
    });
  }

  return text;
}
