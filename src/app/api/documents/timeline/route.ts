import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { ApiResponse } from '@/types';
import type {
  FacilityTimeline,
  FacilityTimelineResponse,
  DocumentState,
  TimelinePoint,
  DocumentKeyTerms,
} from '@/app/features/documents/sub_Compare/lib/temporal-types';

// Validation schema
const getTimelineSchema = z.object({
  facilityId: z.string().uuid().optional(),
  documentId: z.string().uuid().optional(),
  includeKeyTerms: z.enum(['true', 'false']).optional().transform(v => v === 'true'),
}).refine(
  data => data.facilityId || data.documentId,
  { message: 'Either facilityId or documentId must be provided' }
);

// GET /api/documents/timeline - Get facility document evolution timeline
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const params = {
      facilityId: searchParams.get('facilityId') || undefined,
      documentId: searchParams.get('documentId') || undefined,
      includeKeyTerms: searchParams.get('includeKeyTerms') || 'true',
    };

    const parsed = getTimelineSchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: parsed.error.flatten(),
        },
      }, { status: 400 });
    }

    const { facilityId, documentId, includeKeyTerms } = parsed.data;

    let targetFacilityId = facilityId;

    // If documentId provided, find the facility it belongs to
    if (!targetFacilityId && documentId) {
      const { data: docFacility, error: docError } = await supabase
        .from('loan_facilities')
        .select('id')
        .eq('source_document_id', documentId)
        .single();

      if (docError || !docFacility) {
        // Check if this document is an amendment by looking at other documents
        // that might reference the same facility
        const { data: allDocs, error: allDocsError } = await supabase
          .from('loan_documents')
          .select('id')
          .eq('id', documentId)
          .single();

        if (allDocsError || !allDocs) {
          return NextResponse.json<ApiResponse<null>>({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Document not found',
            },
          }, { status: 404 });
        }

        // For now, return empty timeline if no facility is associated
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: {
            code: 'NO_FACILITY',
            message: 'No facility found for this document',
          },
        }, { status: 404 });
      }

      targetFacilityId = docFacility.id;
    }

    // Get facility details
    const { data: facility, error: facilityError } = await supabase
      .from('loan_facilities')
      .select(`
        *,
        source_document:loan_documents!source_document_id(
          id,
          original_filename,
          document_type,
          created_at
        )
      `)
      .eq('id', targetFacilityId)
      .single();

    if (facilityError || !facility) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Facility not found',
        },
      }, { status: 404 });
    }

    // Get all documents associated with this facility (by organization)
    // Including the original and any amendments
    const { data: relatedDocs, error: relatedError } = await supabase
      .from('loan_documents')
      .select('*')
      .eq('organization_id', facility.organization_id)
      .in('document_type', ['facility_agreement', 'amendment'])
      .order('created_at', { ascending: true });

    if (relatedError) {
      console.error('Error fetching related documents:', relatedError);
    }

    // Build document states
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allDocs: any[] = relatedDocs || [];

    // Original document state
    const originalState: DocumentState = {
      id: facility.source_document.id,
      name: facility.source_document.original_filename,
      documentType: facility.source_document.document_type,
      amendmentNumber: null,
      effectiveDate: facility.effective_date || facility.execution_date || facility.created_at,
      createdAt: facility.source_document.created_at,
      description: 'Original Credit Agreement',
    };

    // Add key terms if requested
    if (includeKeyTerms) {
      originalState.keyTerms = buildKeyTerms(facility);
    }

    // Find amendments (documents with type 'amendment' created after the original)
    const amendments: DocumentState[] = allDocs
      .filter(doc =>
        doc.document_type === 'amendment' &&
        doc.id !== facility.source_document.id &&
        new Date(doc.created_at) > new Date(facility.source_document.created_at)
      )
      .map((doc, index) => {
        const state: DocumentState = {
          id: doc.id,
          name: doc.original_filename,
          documentType: doc.document_type,
          amendmentNumber: index + 1,
          effectiveDate: doc.created_at, // Would be better with actual effective date
          createdAt: doc.created_at,
          description: `Amendment #${index + 1}`,
        };
        return state;
      });

    // Build full timeline
    const timeline: DocumentState[] = [originalState, ...amendments];

    // Get covenants for key terms if requested
    if (includeKeyTerms) {
      const { data: covenants } = await supabase
        .from('financial_covenants')
        .select('*')
        .eq('facility_id', targetFacilityId);

      if (covenants && covenants.length > 0) {
        // Add covenants to original state
        originalState.keyTerms = {
          ...originalState.keyTerms,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          covenants: covenants.map((c: any) => ({
            name: c.covenant_name,
            type: c.covenant_type,
            threshold: c.threshold_value,
            thresholdType: c.threshold_type,
          })),
        };
      }
    }

    // Calculate timeline statistics
    const stats = {
      totalDocuments: timeline.length,
      amendmentCount: amendments.length,
      dateRange: {
        earliest: timeline[0]?.effectiveDate || new Date().toISOString(),
        latest: timeline[timeline.length - 1]?.effectiveDate || new Date().toISOString(),
      },
      totalChangesOverTime: 0, // Would need comparison data to calculate
    };

    // Get borrower name from facility
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const borrowers = facility.borrowers as any[];
    const borrowerName = borrowers?.[0]?.name || 'Unknown Borrower';

    const facilityTimeline: FacilityTimeline = {
      facilityId: targetFacilityId!,
      facilityName: facility.facility_name,
      borrowerName,
      originalDocument: originalState,
      amendments,
      timeline,
      stats,
    };

    // Build visual points for timeline rendering
    const visualPoints: TimelinePoint[] = timeline.map((state, index) => {
      const position = timeline.length > 1
        ? (index / (timeline.length - 1)) * 100
        : 50;

      return {
        state,
        position,
        isOriginal: index === 0,
        isCurrent: index === timeline.length - 1,
        cumulativeChanges: 0, // Would need comparison data
        changesFromPrevious: 0, // Would need comparison data
      };
    });

    const response: FacilityTimelineResponse = {
      timeline: facilityTimeline,
      visualPoints,
    };

    return NextResponse.json<ApiResponse<FacilityTimelineResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error fetching document timeline:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// Helper function to build key terms from facility data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildKeyTerms(facility: any): DocumentKeyTerms {
  return {
    facilityName: facility.facility_name,
    totalCommitments: facility.total_commitments,
    currency: facility.currency,
    maturityDate: facility.maturity_date,
    baseRate: facility.base_rate,
    marginInitial: facility.margin_initial,
  };
}
