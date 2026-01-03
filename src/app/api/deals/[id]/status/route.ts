import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateDealStatusSchema } from '@/lib/validations';
import type { ApiResponse, Deal } from '@/types';

// Type for partial deal data from queries
interface DealStatusQuery {
  status: string;
}

// PUT /api/deals/[id]/status - Update deal status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const parsed = updateDealStatusSchema.safeParse(body);
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

    // Get current deal
    const { data: currentDeal, error: fetchError } = await supabase
      .from('deals')
      .select('status')
      .eq('id', id)
      .single() as { data: DealStatusQuery | null; error: Error | null };

    if (fetchError || !currentDeal) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Deal not found',
        },
      }, { status: 404 });
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      draft: ['active', 'terminated'],
      active: ['paused', 'agreed', 'terminated'],
      paused: ['active', 'terminated'],
      agreed: ['closed', 'terminated'],
      closed: [], // Final state
      terminated: [], // Final state
    };

    const allowedNextStatuses = validTransitions[currentDeal.status] || [];
    if (!allowedNextStatuses.includes(parsed.data.status)) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'INVALID_TRANSITION',
          message: `Cannot transition from '${currentDeal.status}' to '${parsed.data.status}'`,
        },
      }, { status: 400 });
    }

    // Update the deal status
    const { data: deal, error: updateError } = await (supabase
      .from('deals') as ReturnType<typeof supabase.from>)
      .update({
        status: parsed.data.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single() as unknown as { data: Deal | null; error: Error | null };

    if (updateError || !deal) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: updateError ? 'DB_ERROR' : 'NOT_FOUND',
          message: updateError?.message ?? 'Deal not found',
        },
      }, { status: updateError ? 500 : 404 });
    }

    // Get participant info for actor_party
    const { data: participant } = await supabase
      .from('deal_participants')
      .select('party_name')
      .eq('deal_id', id)
      .eq('user_id', user.id)
      .single() as { data: { party_name?: string } | null };

    // Log activity
    await (supabase
      .from('deal_activities') as ReturnType<typeof supabase.from>)
      .insert({
        deal_id: id,
        activity_type: 'status_changed',
        actor_id: user.id,
        actor_party: participant?.party_name || 'Unknown',
        details: {
          previous_status: currentDeal.status,
          new_status: parsed.data.status,
          reason: parsed.data.reason,
        },
      });

    return NextResponse.json<ApiResponse<Deal>>({
      success: true,
      data: deal,
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
