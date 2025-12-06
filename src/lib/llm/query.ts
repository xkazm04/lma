import { generateCompletion } from './client';
import type { QueryResponse } from '@/types';

const QUERY_SYSTEM_PROMPT = `You are an AI assistant specialized in analyzing loan documentation. You have access to extracted data from loan agreements and can answer questions about them.

When answering:
1. Be precise and cite specific clauses or sections when possible
2. If the information is not available, say so clearly
3. Provide relevant context that might help understand the answer
4. If there are multiple relevant pieces of information, present them organized

Format your response as JSON with:
- answer: Your direct answer to the question
- sources: Array of relevant sources [{documentName, clauseReference, excerpt}]
- confidence: Your confidence in the answer (0-1)
- additionalContext: Any relevant context the user should know`;

export interface QueryContext {
  facilities?: Array<{
    id: string;
    name: string;
    data: Record<string, unknown>;
  }>;
  covenants?: Array<{
    id: string;
    type: string;
    name: string;
    threshold: number;
    clauseReference?: string;
  }>;
  obligations?: Array<{
    id: string;
    type: string;
    description: string;
    frequency?: string;
    clauseReference?: string;
  }>;
  definedTerms?: Array<{
    term: string;
    definition: string;
  }>;
}

export async function queryDocuments(
  question: string,
  context: QueryContext
): Promise<QueryResponse> {
  const contextStr = `
Available Data:

FACILITIES:
${JSON.stringify(context.facilities || [], null, 2)}

COVENANTS:
${JSON.stringify(context.covenants || [], null, 2)}

REPORTING OBLIGATIONS:
${JSON.stringify(context.obligations || [], null, 2)}

DEFINED TERMS:
${JSON.stringify(context.definedTerms?.slice(0, 50) || [], null, 2)}
`;

  const userMessage = `
Based on the following loan documentation data, please answer this question:

${question}

${contextStr}
`;

  try {
    const responseText = await generateCompletion(
      QUERY_SYSTEM_PROMPT,
      userMessage,
      { maxTokens: 2048, temperature: 0.2 }
    );

    // Parse the response
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          answer: parsed.answer || responseText,
          sources: parsed.sources || [],
          confidence: parsed.confidence || 0.7,
        };
      }
    } catch {
      // If JSON parsing fails, return the raw text
    }

    return {
      answer: responseText,
      sources: [],
      confidence: 0.7,
    };
  } catch (error) {
    console.error('Query error:', error);
    return {
      answer: 'Sorry, I was unable to process your question. Please try again.',
      sources: [],
      confidence: 0,
    };
  }
}

export async function compareDocumentsWithLLM(
  doc1Summary: string,
  doc2Summary: string
): Promise<{
  summary: string;
  keyChanges: string[];
  riskAssessment: string;
}> {
  const systemPrompt = `You are an expert at analyzing loan documentation changes. Compare two document versions and identify key differences.

Focus on:
1. Financial terms (amounts, rates, fees)
2. Covenant changes (loosening or tightening)
3. Date changes (extensions, etc.)
4. Party changes
5. Any changes that could affect the borrower or lender rights

Return your analysis as JSON with:
- summary: A brief summary of the overall changes
- keyChanges: Array of key change descriptions
- riskAssessment: Your assessment of the risk implications`;

  const userMessage = `
DOCUMENT 1:
${doc1Summary}

DOCUMENT 2:
${doc2Summary}

Please compare these documents and identify key differences.`;

  try {
    const responseText = await generateCompletion(
      systemPrompt,
      userMessage,
      { maxTokens: 2048, temperature: 0.2 }
    );

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      summary: responseText,
      keyChanges: [],
      riskAssessment: 'Unable to assess',
    };
  } catch (error) {
    console.error('Comparison error:', error);
    return {
      summary: 'Unable to generate comparison',
      keyChanges: [],
      riskAssessment: 'Error occurred during analysis',
    };
  }
}
