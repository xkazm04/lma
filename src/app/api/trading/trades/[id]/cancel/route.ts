// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cancelTradeSchema } from '@/lib/validations';
import type { ApiResponse } from '@/types';
import type { Trade } from '@/types/database';

// POST /api/trading/trades/[id]/cancel - Cancel a trade
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

    // Get trade
    const { data: trade } = await supabase
      .from('trades')
      .select('*')
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

    // Cannot cancel settled or already cancelled trades
    if (['settled', 'cancelled', 'failed'].includes(trade.status)) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Cannot cancel trade in ${trade.status} status`,
        },
      }, { status: 400 });
    }

    const body = await request.json();
    const parsed = cancelTradeSchema.safeParse(body);

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

    // Update trade status
    const { data: updatedTrade, error: updateError } = await supabase
      .from('trades')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', tradeId)
      .select()
      .single();

    if (updateError) {
      console.error('Error cancelling trade:', updateError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to cancel trade',
        },
      }, { status: 500 });
    }

    // Log trade event
    await supabase.from('trade_events').insert({
      trade_id: tradeId,
      event_type: 'trade_cancelled',
      event_data: {
        cancelled_by: userData.organization_id,
        reason: parsed.data.reason,
      },
      actor_id: user.id,
    });

    // Log activity for both parties
    const isSeller = trade.seller_organization_id === userData.organization_id;
    const activityBase = {
      source_module: 'trading',
      activity_type: 'trade_cancelled',
      actor_id: user.id,
      entity_type: 'trade',
      entity_id: tradeId,
      entity_name: trade.trade_reference,
      description: `Trade ${trade.trade_reference} cancelled by ${isSeller ? 'seller' : 'buyer'}: ${parsed.data.reason}`,
      details: {
        reason: parsed.data.reason,
        cancelled_by_role: isSeller ? 'seller' : 'buyer',
      },
    };

    await supabase.from('activities').insert([
      { ...activityBase, organization_id: trade.seller_organization_id },
      { ...activityBase, organization_id: trade.buyer_organization_id },
    ]);

    return NextResponse.json<ApiResponse<Trade>>({
      success: true,
      data: updatedTrade,
    });
  } catch (error) {
    console.error('Error in POST /api/trading/trades/[id]/cancel:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
