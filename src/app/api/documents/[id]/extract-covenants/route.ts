import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types';
import {
  extractCovenantsForCompliance,
  transformToComplianceCovenant,
  type CovenantExtractionResult,
  type ExtractedCovenantForCompliance,
} from '@/lib/llm/covenant-extraction';

export interface ExtractCovenantsResponse {
  extraction: CovenantExtractionResult;
}

export interface ConfirmCovenantsRequest {
  facilityId: string;
  covenants: Array<{
    extracted: ExtractedCovenantForCompliance;
    status: 'confirmed' | 'modified' | 'rejected';
    modifications?: Partial<ExtractedCovenantForCompliance>;
  }>;
}

export interface ConfirmCovenantsResponse {
  createdCovenants: number;
  rejectedCovenants: number;
  facilityId: string;
}

// POST /api/documents/[id]/extract-covenants - Extract covenants for compliance module
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get document with extracted text
    const { data: document, error: docError } = await supabase
      .from('loan_documents')
      .select('id, original_filename, document_type, extracted_text')
      .eq('id', id)
      .single();

    if (docError || !document) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Document not found',
        },
      }, { status: 404 });
    }

    // Check if document has extracted text
    if (!document.extracted_text) {
      // For demo purposes, use mock text if no extraction available
      const mockDocumentText = `
CREDIT AGREEMENT

FACILITY AGREEMENT dated as of November 15, 2024 (this "Agreement"), among APOLLO HOLDINGS INC., a Delaware corporation (the "Borrower"), the LENDERS party hereto, and GLOBAL BANK NA, as Administrative Agent.

SECTION 7. FINANCIAL COVENANTS

7.1 Maximum Total Leverage Ratio. The Borrower shall not permit the ratio (the "Total Leverage Ratio") of (a) Consolidated Total Indebtedness as of the last day of any fiscal quarter to (b) Consolidated EBITDA for the period of four consecutive fiscal quarters ending on such date to exceed 4.50:1.00; provided that upon the consummation of a Material Acquisition, such ratio shall be permitted to be 5.00:1.00 for the fiscal quarter in which such acquisition is consummated and the next succeeding fiscal quarter.

7.2 Minimum Interest Coverage Ratio. The Borrower shall not permit the ratio (the "Interest Coverage Ratio") of (a) Consolidated EBITDA for any period of four consecutive fiscal quarters to (b) Consolidated Interest Expense for such period to be less than 3.00:1.00 at the end of any fiscal quarter.

7.3 Maximum Senior Secured Leverage Ratio. The Borrower shall not permit the ratio (the "Senior Secured Leverage Ratio") of (a) Consolidated Senior Secured Indebtedness as of the last day of any fiscal quarter to (b) Consolidated EBITDA for the period of four consecutive fiscal quarters ending on such date to exceed 3.00:1.00.

7.4 Minimum Fixed Charge Coverage Ratio. The Borrower shall not permit the ratio (the "Fixed Charge Coverage Ratio") of (a) Consolidated EBITDA minus Unfinanced Capital Expenditures minus cash taxes paid for any period of four consecutive fiscal quarters to (b) Fixed Charges for such period to be less than 1.25:1.00 at the end of any fiscal quarter.

7.5 Maximum Annual Capital Expenditures. The Borrower shall not permit Capital Expenditures in any fiscal year to exceed $50,000,000; provided that (i) any unused portion of the permitted Capital Expenditure amount in any fiscal year may be carried forward to the immediately succeeding fiscal year (but not any other fiscal year), and (ii) such amount may be increased by amounts attributable to Permitted Acquisitions.

DEFINITIONS

"Consolidated EBITDA" means, for any period, Consolidated Net Income for such period plus (a) the following to the extent deducted in calculating such Consolidated Net Income: (i) Consolidated Interest Expense, (ii) the provision for federal, state, local and foreign income taxes, (iii) depreciation and amortization expense, and (iv) other non-cash charges minus (b) non-cash items increasing Consolidated Net Income for such period.

"Consolidated Total Indebtedness" means, as of any date, the aggregate principal amount of all Indebtedness of the Borrower and its Subsidiaries outstanding on such date, determined on a consolidated basis.

"Fixed Charges" means, for any period, the sum of (a) scheduled principal payments of Indebtedness, (b) Consolidated Interest Expense, (c) Restricted Payments actually made in cash, and (d) Capital Lease Obligations actually paid.

Testing Frequency: All financial covenants shall be tested quarterly based on the financial statements delivered pursuant to Section 6.1 hereof.
      `;

      const extraction = await extractCovenantsForCompliance(mockDocumentText, id);

      return NextResponse.json<ApiResponse<ExtractCovenantsResponse>>({
        success: true,
        data: { extraction },
      });
    }

    // Run extraction on actual document text
    const extraction = await extractCovenantsForCompliance(document.extracted_text, id);

    return NextResponse.json<ApiResponse<ExtractCovenantsResponse>>({
      success: true,
      data: { extraction },
    });
  } catch (error) {
    console.error('Covenant extraction error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'EXTRACTION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to extract covenants',
      },
    }, { status: 500 });
  }
}

// PUT /api/documents/[id]/extract-covenants - Confirm and save extracted covenants to compliance module
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body: ConfirmCovenantsRequest = await request.json();

    if (!body.facilityId || !body.covenants) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'facilityId and covenants are required',
        },
      }, { status: 400 });
    }

    // Verify facility exists
    const { data: facility, error: facilityError } = await supabase
      .from('compliance_facilities')
      .select('id')
      .eq('id', body.facilityId)
      .single();

    if (facilityError || !facility) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'FACILITY_NOT_FOUND',
          message: 'Compliance facility not found',
        },
      }, { status: 404 });
    }

    let createdCount = 0;
    let rejectedCount = 0;

    for (const covenantItem of body.covenants) {
      if (covenantItem.status === 'rejected') {
        rejectedCount++;
        continue;
      }

      // Apply modifications if any
      const finalCovenant = covenantItem.modifications
        ? { ...covenantItem.extracted, ...covenantItem.modifications }
        : covenantItem.extracted;

      // Transform to compliance format
      const complianceCovenant = transformToComplianceCovenant(finalCovenant, body.facilityId);

      // Insert into compliance_covenants table
      const { error: insertError } = await supabase
        .from('compliance_covenants')
        .insert({
          ...complianceCovenant,
          source_document_id: id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (!insertError) {
        createdCount++;
      }
    }

    return NextResponse.json<ApiResponse<ConfirmCovenantsResponse>>({
      success: true,
      data: {
        createdCovenants: createdCount,
        rejectedCovenants: rejectedCount,
        facilityId: body.facilityId,
      },
    });
  } catch (error) {
    console.error('Covenant confirmation error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'CONFIRMATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to confirm covenants',
      },
    }, { status: 500 });
  }
}
