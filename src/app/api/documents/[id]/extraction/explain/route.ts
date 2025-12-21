import { NextRequest, NextResponse } from 'next/server';
import { generateStructuredOutput } from '@/lib/llm';
import type { ApiResponse } from '@/types';
import type { ExplainExtractionResponse, AlternativeValue } from '@/app/features/documents/lib/types';

const EXPLAIN_EXTRACTION_PROMPT = `You are an expert document analyst specializing in loan agreements and financial documents.

Your task is to explain the extraction logic for a specific field extracted from a loan document.

For the given field extraction, provide:
1. A detailed explanation of how and why this value was extracted
2. Alternative values that might have been considered and why they were rejected
3. The document context where this value was found
4. Steps the user can take to verify the extraction

Be specific about:
- What patterns or indicators led to selecting this value
- Any ambiguity in the source document
- Related terms or definitions that influenced the extraction
- Potential sources of error or uncertainty

Respond in JSON format:
{
  "explanation": "Detailed explanation of extraction logic...",
  "alternatives": [
    {
      "value": "Alternative value",
      "confidence": 0.35,
      "source": "Page X, Section Y",
      "rejectionReason": "Why this was not selected..."
    }
  ],
  "documentContext": "The relevant text from the document...",
  "verificationSteps": [
    "Step 1: Check...",
    "Step 2: Verify..."
  ]
}`;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    const body = await request.json();

    const { fieldName, extractedValue, source, confidence } = body;

    if (!fieldName || !extractedValue) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'fieldName and extractedValue are required',
        },
      }, { status: 400 });
    }

    const userMessage = `Document ID: ${documentId}
Field Name: ${fieldName}
Extracted Value: ${extractedValue}
Source Location: ${source || 'Not specified'}
Confidence Score: ${confidence || 'Not specified'}

Please explain the extraction logic for this field, including what alternatives might have been considered and why the extracted value was selected.`;

    const result = await generateStructuredOutput<ExplainExtractionResponse>(
      EXPLAIN_EXTRACTION_PROMPT,
      userMessage,
      { temperature: 0.3 }
    );

    // Ensure alternatives have proper structure
    const alternatives: AlternativeValue[] = (result.alternatives || []).map(alt => ({
      value: alt.value || '',
      confidence: alt.confidence || 0,
      source: alt.source || 'Unknown',
      rejectionReason: alt.rejectionReason || 'No reason provided',
    }));

    const response: ExplainExtractionResponse = {
      explanation: result.explanation || 'Unable to generate explanation',
      alternatives,
      documentContext: result.documentContext || '',
      verificationSteps: result.verificationSteps || [],
    };

    return NextResponse.json<ApiResponse<ExplainExtractionResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error explaining extraction:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while explaining extraction',
      },
    }, { status: 500 });
  }
}
