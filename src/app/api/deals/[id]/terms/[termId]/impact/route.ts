import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeTermImpact } from '@/lib/llm';
import { impactAnalysisSchema } from '@/lib/validations';
import type { ApiResponse, ImpactAnalysisResult, NegotiationTerm } from '@/types';

// Type helpers for tables not in generated Supabase types
type DealInfo = { deal_type: string; deal_name: string; base_facility_id: string | null };
type FacilityInfo = { currency: string; total_commitments: number };

// POST /api/deals/[id]/terms/[termId]/impact - Analyze impact of a proposed value change
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; termId: string }> }
) {
  try {
    const { id: dealId, termId } = await params;
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const parsed = impactAnalysisSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request',
          details: parsed.error.flatten(),
        },
      }, { status: 400 });
    }

    // Get the term
    const { data: term, error: termError } = await (supabase
      .from('negotiation_terms' as 'documents')
      .select('*')
      .eq('id', termId)
      .eq('deal_id' as 'id', dealId)
      .single() as unknown as Promise<{ data: NegotiationTerm | null; error: Error | null }>);

    if (termError || !term) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Term not found',
        },
      }, { status: 404 });
    }

    // Get related terms (same category or linked)
    const { data: relatedTerms } = await (supabase
      .from('negotiation_terms' as 'documents')
      .select('*')
      .eq('deal_id' as 'id', dealId)
      .neq('id', termId)
      .limit(10) as unknown as Promise<{ data: NegotiationTerm[] | null }>);

    // Get deal context
    const { data: deal } = await (supabase
      .from('deals' as 'documents')
      .select('deal_type, deal_name, base_facility_id')
      .eq('id', dealId)
      .single() as unknown as Promise<{ data: DealInfo | null }>);

    // Get facility info if available
    let facilityInfo: FacilityInfo | null = null;
    if (deal?.base_facility_id) {
      const { data: facility } = await (supabase
        .from('loan_facilities' as 'documents')
        .select('currency, total_commitments')
        .eq('id', deal.base_facility_id)
        .single() as unknown as Promise<{ data: FacilityInfo | null }>);
      facilityInfo = facility;
    }

    // Analyze impact using LLM
    const impact = await analyzeTermImpact({
      term: term as NegotiationTerm,
      proposedValue: parsed.data.proposed_value,
      relatedTerms: (relatedTerms || []) as NegotiationTerm[],
      dealContext: {
        dealType: deal?.deal_type || 'unknown',
        dealSize: facilityInfo?.total_commitments,
        currency: facilityInfo?.currency,
      },
    });

    return NextResponse.json<ApiResponse<ImpactAnalysisResult>>({
      success: true,
      data: impact,
    });
  } catch (error) {
    console.error('Error analyzing impact:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'LLM_ERROR',
        message: 'Failed to analyze term impact',
      },
    }, { status: 500 });
  }
}
