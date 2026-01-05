import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';
import type { DocumentChatResponse, DocumentChatMessage } from '@/app/features/documents/lib/types';

// Mock responses for common document questions
const mockResponses: Record<string, DocumentChatResponse> = {
  covenant: {
    answer: 'The document contains several financial covenants that the Borrower must maintain throughout the facility term. The key covenants include:\n\n1. **Maximum Leverage Ratio**: The Borrower shall not permit the ratio of Consolidated Total Debt to Consolidated EBITDA to exceed 4.50 to 1.00 as of the last day of any fiscal quarter.\n\n2. **Minimum Interest Coverage Ratio**: The Borrower shall maintain a ratio of Consolidated EBITDA to Consolidated Interest Expense of not less than 3.00 to 1.00.\n\n3. **Minimum Liquidity**: The Borrower shall maintain unrestricted cash and cash equivalents of not less than $10,000,000 at all times.\n\nThese covenants are tested quarterly based on trailing twelve-month figures.',
    sources: [
      { page: 45, section: 'Section 7.11 - Financial Covenants', excerpt: 'The Borrower shall not permit the Leverage Ratio...' },
      { page: 46, section: 'Section 7.11(b) - Interest Coverage', excerpt: 'The Borrower shall maintain an Interest Coverage Ratio...' },
    ],
    confidence: 0.95,
  },
  maturity: {
    answer: 'The facility has a maturity date of November 20, 2029, which is 5 years from the Closing Date. The Borrower has the option to request up to two 1-year extensions, subject to lender consent and satisfaction of certain conditions precedent including no existing defaults and updated representations.',
    sources: [
      { page: 15, section: 'Section 2.1 - Facility Terms', excerpt: 'The Maturity Date shall be the date that is five (5) years after the Closing Date...' },
      { page: 16, section: 'Section 2.1(c) - Extension Options', excerpt: 'The Borrower may request up to two (2) extensions...' },
    ],
    confidence: 0.98,
  },
  interest: {
    answer: 'The interest rate structure is based on SOFR plus an Applicable Margin that varies based on the Leverage Ratio according to the pricing grid:\n\n- Leverage ≤ 3.00x: SOFR + 2.25%\n- Leverage > 3.00x and ≤ 3.50x: SOFR + 2.50%\n- Leverage > 3.50x and ≤ 4.00x: SOFR + 2.75%\n- Leverage > 4.00x: SOFR + 3.00%\n\nInterest is payable quarterly in arrears for SOFR loans and on the last day of each interest period.',
    sources: [
      { page: 20, section: 'Section 2.05 - Interest Rate', excerpt: 'The Applicable Margin shall be determined based on the Leverage Ratio...' },
      { page: 21, section: 'Schedule 2.05 - Pricing Grid', excerpt: 'Pricing Grid showing margin tiers...' },
    ],
    confidence: 0.96,
  },
  parties: {
    answer: 'The key parties to this agreement are:\n\n1. **Borrower**: Apollo Industries Inc., a Delaware corporation\n2. **Administrative Agent**: BigBank NA\n3. **Lead Arrangers**: BigBank NA and Capital Partners LLC\n4. **Lenders**: A syndicate of 8 financial institutions listed in Schedule 2.01\n\nThe Borrower is a manufacturing company with principal operations in North America and Europe.',
    sources: [
      { page: 1, section: 'Preamble', excerpt: 'This FACILITY AGREEMENT dated as of [Date] among APOLLO INDUSTRIES INC....' },
      { page: 3, section: 'Parties', excerpt: 'Administrative Agent: BigBank NA...' },
    ],
    confidence: 0.99,
  },
  default: {
    answer: 'Based on my analysis of this loan document, I can help you understand its key terms and provisions. The document appears to be a syndicated facility agreement with standard provisions for:\n\n- Facility amount and commitment structure\n- Interest rate and fee provisions\n- Financial covenants and reporting requirements\n- Representations and warranties\n- Events of default and remedies\n\nWould you like me to explain any specific section in more detail? You can ask about covenants, interest rates, maturity, parties, or any other aspect of the document.',
    sources: [
      { page: 1, section: 'Table of Contents', excerpt: 'Overview of document structure and sections...' },
    ],
    confidence: 0.85,
  },
};

function getMockResponse(question: string): DocumentChatResponse {
  const lowerQuestion = question.toLowerCase();

  if (lowerQuestion.includes('covenant') || lowerQuestion.includes('ratio') || lowerQuestion.includes('leverage') || lowerQuestion.includes('ebitda')) {
    return mockResponses.covenant;
  }
  if (lowerQuestion.includes('maturity') || lowerQuestion.includes('term') || lowerQuestion.includes('expir') || lowerQuestion.includes('duration')) {
    return mockResponses.maturity;
  }
  if (lowerQuestion.includes('interest') || lowerQuestion.includes('rate') || lowerQuestion.includes('sofr') || lowerQuestion.includes('margin') || lowerQuestion.includes('pricing')) {
    return mockResponses.interest;
  }
  if (lowerQuestion.includes('party') || lowerQuestion.includes('parties') || lowerQuestion.includes('borrower') || lowerQuestion.includes('lender') || lowerQuestion.includes('agent')) {
    return mockResponses.parties;
  }

  return mockResponses.default;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params; // Acknowledge document ID
    const body = await request.json();

    const { question } = body as {
      question: string;
      history?: DocumentChatMessage[];
    };

    if (!question || typeof question !== 'string') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'question is required',
        },
      }, { status: 400 });
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const response = getMockResponse(question);

    return NextResponse.json<ApiResponse<DocumentChatResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error in document chat:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while processing your question',
      },
    }, { status: 500 });
  }
}
