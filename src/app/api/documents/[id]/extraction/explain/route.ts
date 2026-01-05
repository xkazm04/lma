import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';
import type { ExplainExtractionResponse, AlternativeValue } from '@/app/features/documents/lib/types';

// Mock explanations for different field types
const mockExplanations: Record<string, {
  explanation: string;
  alternatives: AlternativeValue[];
  documentContext: string;
  verificationSteps: string[];
}> = {
  facility_amount: {
    explanation: 'The facility amount was extracted by identifying the primary commitment section of the credit agreement. The system identified "$500,000,000" as the Total Commitments by locating the defined term "Aggregate Commitments" in Section 1.01 and cross-referencing with the commitment schedule. This value appeared in multiple locations including the preamble, definitions section, and Schedule 2.01, providing high confidence.',
    alternatives: [
      {
        value: '$450,000,000',
        confidence: 0.25,
        source: 'Page 3, Section 1.01 - "Initial Commitment"',
        rejectionReason: 'This represents the Initial Commitment amount before the accordion increase. The total facility includes the $50M accordion that was exercised.',
      },
      {
        value: '$550,000,000',
        confidence: 0.15,
        source: 'Page 12, Section 2.06 - "Maximum Facility Size"',
        rejectionReason: 'This represents the maximum potential facility size including unexercised accordion. Current commitments are $500M.',
      },
    ],
    documentContext: '"Aggregate Commitments" means the aggregate of the Commitments of all the Lenders. As of the Closing Date, the Aggregate Commitments equal FIVE HUNDRED MILLION DOLLARS ($500,000,000).',
    verificationSteps: [
      'Check Section 1.01 for the definition of "Aggregate Commitments"',
      'Verify against Schedule 2.01 - Commitment Schedule',
      'Confirm no subsequent amendments have modified this amount',
      'Cross-reference with any accordion or incremental facility provisions',
    ],
  },
  maturity_date: {
    explanation: 'The maturity date was extracted from the defined term "Maturity Date" in Section 1.01 of the credit agreement. The document specifies November 20, 2029 as the Termination Date, calculated as 5 years from the Closing Date of November 20, 2024. The extraction verified this against multiple references including the facility termination provisions.',
    alternatives: [
      {
        value: 'November 20, 2030',
        confidence: 0.20,
        source: 'Page 16, Section 2.1(c) - Extension Options',
        rejectionReason: 'This is the potential extended maturity if the first extension option is exercised. The base maturity remains November 20, 2029.',
      },
      {
        value: 'November 20, 2031',
        confidence: 0.10,
        source: 'Page 16, Section 2.1(c) - Extension Options',
        rejectionReason: 'This is the maximum extended maturity if both extension options are exercised. Extensions are not automatic and require lender consent.',
      },
    ],
    documentContext: '"Maturity Date" means November 20, 2029; provided that if such date is not a Business Day, the Maturity Date shall be the immediately preceding Business Day.',
    verificationSteps: [
      'Verify the Closing Date in the preamble',
      'Check Section 1.01 for the Maturity Date definition',
      'Review any extension provisions in Section 2.1',
      'Confirm no amendments have modified the maturity',
    ],
  },
  borrower_name: {
    explanation: 'The borrower name was extracted from the preamble and defined terms section of the credit agreement. "Apollo Industries Inc." was identified as the primary Borrower entity through pattern matching of the "BORROWER:" designation and cross-referencing with the party definitions.',
    alternatives: [
      {
        value: 'Apollo Industries Holdings LLC',
        confidence: 0.30,
        source: 'Page 2, Recitals',
        rejectionReason: 'This is the parent company of the Borrower, mentioned as a Guarantor but not the direct Borrower under the facility.',
      },
      {
        value: 'Apollo Manufacturing Corp',
        confidence: 0.15,
        source: 'Page 45, Schedule 5.12',
        rejectionReason: 'This is a subsidiary of the Borrower listed on the Subsidiary schedule, not the primary Borrower entity.',
      },
    ],
    documentContext: 'This CREDIT AGREEMENT (this "Agreement") is entered into as of November 20, 2024, among APOLLO INDUSTRIES INC., a Delaware corporation (the "Borrower"), the Lenders from time to time party hereto, and BIGBANK NA, as Administrative Agent.',
    verificationSteps: [
      'Verify the Borrower designation in the preamble',
      'Check Section 1.01 for the Borrower definition',
      'Confirm corporate jurisdiction and entity type',
      'Review signature pages for Borrower execution',
    ],
  },
  leverage_ratio: {
    explanation: 'The maximum leverage ratio covenant of 4.50x was extracted from Section 7.11(a) - Financial Covenants. The system identified the specific numerical threshold by parsing the covenant language and extracting the ratio limit. This covenant requires the ratio of Consolidated Total Debt to Consolidated EBITDA not to exceed the specified threshold.',
    alternatives: [
      {
        value: '4.00x',
        confidence: 0.35,
        source: 'Page 45, Section 7.11(a) - Step-down Schedule',
        rejectionReason: 'This is the step-down level that applies after 4 fiscal quarters. Current covenant level remains at 4.50x for the initial period.',
      },
      {
        value: '5.00x',
        confidence: 0.20,
        source: 'Page 48, Section 7.11(e) - Acquisition Spike',
        rejectionReason: 'This is the temporary elevated covenant level permitted for 2 quarters following a Permitted Acquisition. Standard level is 4.50x.',
      },
    ],
    documentContext: '(a) Maximum Leverage Ratio. The Borrower shall not permit the Leverage Ratio as of the last day of any fiscal quarter to exceed 4.50 to 1.00; provided that, following a Permitted Acquisition with a purchase price exceeding $50,000,000, such ratio may be 5.00 to 1.00 for the two fiscal quarters immediately following such acquisition.',
    verificationSteps: [
      'Review Section 7.11(a) for the covenant threshold',
      'Check for any step-down schedule in the covenant',
      'Verify if acquisition spike provisions apply',
      'Confirm definitions of Consolidated Total Debt and EBITDA',
    ],
  },
  default: {
    explanation: 'This value was extracted by analyzing the document structure and identifying the most likely source based on field type patterns. The extraction algorithm matched the field name against common document sections and extracted the value with the highest confidence score from multiple candidate locations.',
    alternatives: [
      {
        value: 'Alternative interpretation 1',
        confidence: 0.30,
        source: 'Various sections',
        rejectionReason: 'Lower confidence match based on contextual analysis',
      },
    ],
    documentContext: 'Relevant document text containing the extracted value...',
    verificationSteps: [
      'Review the source page and section indicated',
      'Cross-reference with the definitions section',
      'Check for any amendments that may have modified this value',
      'Verify against the document summary or term sheet if available',
    ],
  },
};

function getMockExplanation(fieldName: string): ExplainExtractionResponse {
  const lowerField = fieldName.toLowerCase().replace(/[_\s]/g, '');

  if (lowerField.includes('facility') && lowerField.includes('amount') || lowerField.includes('commitment') || lowerField.includes('principal')) {
    return mockExplanations.facility_amount;
  }
  if (lowerField.includes('maturity') || lowerField.includes('termination') || lowerField.includes('expir')) {
    return mockExplanations.maturity_date;
  }
  if (lowerField.includes('borrower') || lowerField.includes('obligor') || lowerField.includes('company')) {
    return mockExplanations.borrower_name;
  }
  if (lowerField.includes('leverage') || lowerField.includes('ratio') || lowerField.includes('covenant')) {
    return mockExplanations.leverage_ratio;
  }

  return mockExplanations.default;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params; // Acknowledge document ID
    const body = await request.json();

    const { fieldName, extractedValue } = body;

    if (!fieldName || !extractedValue) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'fieldName and extractedValue are required',
        },
      }, { status: 400 });
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 200));

    const response = getMockExplanation(fieldName);

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
