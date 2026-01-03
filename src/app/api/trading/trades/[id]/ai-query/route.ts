// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { aiQuerySchema } from '@/lib/validations';
import { answerDDQuestion } from '@/lib/llm/trading';
import type { ApiResponse, TradingAIQueryResult } from '@/types';

// POST /api/trading/trades/[id]/ai-query - Ask AI about the trade
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tradeId } = await params;
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

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User profile not found',
        },
      }, { status: 404 });
    }

    // Verify trade access and get full details
    const { data: trade } = await supabase
      .from('trades')
      .select(`
        *,
        trade_facilities!inner (
          facility_name,
          borrower_name,
          current_status,
          transferability,
          compliance_facility_id
        )
      `)
      .eq('id', tradeId)
      .or(`seller_organization_id.eq.${userData.organization_id},buyer_organization_id.eq.${userData.organization_id}`)
      .single();

    if (!trade) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Trade not found',
        },
      }, { status: 404 });
    }

    const body = await request.json();
    const parsed = aiQuerySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: parsed.error.flatten(),
        },
      }, { status: 400 });
    }

    // Gather context for the AI
    const tradeContext = {
      facility_name: trade.trade_facilities.facility_name,
      borrower_name: trade.trade_facilities.borrower_name,
      trade_amount: trade.trade_amount,
      trade_price: trade.trade_price,
      facility_status: trade.trade_facilities.current_status,
      transferability: trade.trade_facilities.transferability,
    };

    // Get compliance data if linked
    let complianceData: {
      covenant_status?: string;
      recent_test_results?: Array<{ covenant_name: string; result: string; headroom?: number }>;
      upcoming_obligations?: string[];
    } | undefined;

    if (trade.trade_facilities.compliance_facility_id) {
      const { data: complianceFacility } = await supabase
        .from('compliance_facilities')
        .select('status')
        .eq('id', trade.trade_facilities.compliance_facility_id)
        .single();

      if (complianceFacility) {
        // Get recent covenant tests
        const { data: covenantTests } = await supabase
          .from('compliance_covenant_tests')
          .select(`
            test_result,
            headroom_percentage,
            compliance_covenants!inner (
              name,
              facility_id
            )
          `)
          .eq('compliance_covenants.facility_id', trade.trade_facilities.compliance_facility_id)
          .order('test_date', { ascending: false })
          .limit(5);

        // Get upcoming obligations
        const { data: upcomingEvents } = await supabase
          .from('compliance_events')
          .select(`
            deadline_date,
            compliance_obligations!inner (
              name
            )
          `)
          .eq('facility_id', trade.trade_facilities.compliance_facility_id)
          .in('status', ['upcoming', 'due_soon'])
          .order('deadline_date', { ascending: true })
          .limit(5);

        complianceData = {
          covenant_status: complianceFacility.status,
          recent_test_results: (covenantTests || []).map((t: { test_result: string; headroom_percentage: number | null; compliance_covenants: { name: string } }) => ({
            covenant_name: t.compliance_covenants.name,
            result: t.test_result,
            headroom: t.headroom_percentage || undefined,
          })),
          upcoming_obligations: (upcomingEvents || []).map(
            (e: { compliance_obligations: { name: string }; deadline_date: string }) =>
              `${e.compliance_obligations.name} due ${e.deadline_date}`
          ),
        };
      }
    }

    // Call LLM
    const result = await answerDDQuestion({
      question: parsed.data.question,
      trade_context: tradeContext,
      compliance_data: complianceData,
    });

    // Log activity
    await supabase.from('activities').insert({
      organization_id: userData.organization_id,
      source_module: 'trading',
      activity_type: 'ai_query',
      actor_id: user.id,
      entity_type: 'trade',
      entity_id: tradeId,
      entity_name: trade.trade_reference,
      description: `AI query for trade ${trade.trade_reference}: ${parsed.data.question.substring(0, 100)}...`,
    });

    return NextResponse.json<ApiResponse<TradingAIQueryResult>>({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in POST /api/trading/trades/[id]/ai-query:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
