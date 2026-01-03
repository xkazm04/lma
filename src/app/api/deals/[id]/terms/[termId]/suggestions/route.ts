// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getMarketSuggestions, suggestCounterProposals } from '@/lib/llm';
import type { ApiResponse, MarketSuggestion, NegotiationTerm } from '@/types';
import type { CounterSuggestion } from '@/lib/llm/negotiation';

// GET /api/deals/[id]/terms/[termId]/suggestions - Get market suggestions for a term
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; termId: string }> }
) {
  try {
    const { id: dealId, termId } = await params;
    const supabase = await createClient();

    // Get the term
    const { data: term, error: termError } = await supabase
      .from('negotiation_terms')
      .select('*')
      .eq('id', termId)
      .eq('deal_id', dealId)
      .single();

    if (termError) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Term not found',
        },
      }, { status: 404 });
    }

    // Get deal context
    const { data: deal } = await supabase
      .from('deals')
      .select('deal_type, deal_name')
      .eq('id', dealId)
      .single();

    // Get facility info if available
    let facilityInfo = null;
    if (deal?.base_facility_id) {
      const { data: facility } = await supabase
        .from('loan_facilities')
        .select('facility_type, currency, total_commitments')
        .eq('id', deal.base_facility_id)
        .single();
      facilityInfo = facility;
    }

    // Generate suggestions using LLM
    const suggestions = await getMarketSuggestions({
      term: term as NegotiationTerm,
      dealContext: {
        dealType: deal?.deal_type || 'unknown',
        dealSize: facilityInfo?.total_commitments,
        currency: facilityInfo?.currency,
        facilityType: facilityInfo?.facility_type,
      },
    });

    return NextResponse.json<ApiResponse<MarketSuggestion[]>>({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'LLM_ERROR',
        message: 'Failed to generate market suggestions',
      },
    }, { status: 500 });
  }
}

// POST /api/deals/[id]/terms/[termId]/suggestions - Get counter-proposal suggestions
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
    const { proposed_value, proposer_party } = body;

    if (proposed_value === undefined || !proposer_party) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'proposed_value and proposer_party are required',
        },
      }, { status: 400 });
    }

    // Get the term
    const { data: term, error: termError } = await supabase
      .from('negotiation_terms')
      .select('*')
      .eq('id', termId)
      .eq('deal_id', dealId)
      .single();

    if (termError) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Term not found',
        },
      }, { status: 404 });
    }

    // Get responder info
    const { data: participant } = await supabase
      .from('deal_participants')
      .select('party_name')
      .eq('deal_id', dealId)
      .eq('user_id', user.id)
      .single();

    // Generate counter suggestions
    const counters = await suggestCounterProposals({
      term: term as NegotiationTerm,
      proposedValue: proposed_value,
      proposerParty: proposer_party,
      responderParty: participant?.party_name || 'Unknown',
    });

    return NextResponse.json<ApiResponse<CounterSuggestion[]>>({
      success: true,
      data: counters,
    });
  } catch (error) {
    console.error('Error generating counter suggestions:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'LLM_ERROR',
        message: 'Failed to generate counter suggestions',
      },
    }, { status: 500 });
  }
}
