import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { flagDDItemSchema } from '@/lib/validations';
import type { ApiResponse } from '@/types';
import type { DueDiligenceItem } from '@/types/database';

// POST /api/trading/trades/[id]/checklist/items/[itemId]/flag - Flag DD item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: tradeId, itemId } = await params;
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

    // Verify trade access
    const { data: trade } = await supabase
      .from('trades')
      .select('id, status, trade_reference, seller_organization_id, buyer_organization_id')
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

    // Trade must be in DD phase
    if (!['agreed', 'in_due_diligence'].includes(trade.status)) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Trade is not in due diligence phase',
        },
      }, { status: 400 });
    }

    // Get item
    const { data: existingItem } = await supabase
      .from('due_diligence_items')
      .select(`
        *,
        due_diligence_checklists!inner (
          id,
          trade_id
        )
      `)
      .eq('id', itemId)
      .single();

    if (!existingItem || existingItem.due_diligence_checklists.trade_id !== tradeId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Item not found',
        },
      }, { status: 404 });
    }

    const body = await request.json();
    const parsed = flagDDItemSchema.safeParse(body);

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

    // Update item
    const { data: item, error: updateError } = await supabase
      .from('due_diligence_items')
      .update({
        status: 'flagged',
        flag_reason: parsed.data.flag_reason,
        flag_severity: parsed.data.flag_severity,
        flagged_by: user.id,
        flagged_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)
      .select()
      .single();

    if (updateError) {
      console.error('Error flagging item:', updateError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to flag item',
        },
      }, { status: 500 });
    }

    // Update checklist status to flagged
    await supabase
      .from('due_diligence_checklists')
      .update({ status: 'flagged', updated_at: new Date().toISOString() })
      .eq('id', existingItem.due_diligence_checklists.id);

    // Update trade status if first item flagged during agreed phase
    await supabase
      .from('trades')
      .update({ status: 'in_due_diligence', updated_at: new Date().toISOString() })
      .eq('id', tradeId)
      .eq('status', 'agreed');

    // Log trade event
    await supabase.from('trade_events').insert({
      trade_id: tradeId,
      event_type: 'dd_item_flagged',
      event_data: {
        item_id: itemId,
        item_name: existingItem.item_name,
        category: existingItem.category,
        reason: parsed.data.flag_reason,
        severity: parsed.data.flag_severity,
      },
      actor_id: user.id,
    });

    // Log activity for both parties
    const isBuyer = trade.buyer_organization_id === userData.organization_id;
    const activityBase = {
      source_module: 'trading',
      activity_type: 'dd_item_flagged',
      actor_id: user.id,
      entity_type: 'due_diligence_item',
      entity_id: itemId,
      entity_name: existingItem.item_name,
      description: `Flagged DD item: ${existingItem.item_name} (${parsed.data.flag_severity}) - ${parsed.data.flag_reason}`,
      details: {
        trade_reference: trade.trade_reference,
        severity: parsed.data.flag_severity,
        flagged_by_role: isBuyer ? 'buyer' : 'seller',
      },
    };

    await supabase.from('activities').insert([
      { ...activityBase, organization_id: trade.seller_organization_id },
      { ...activityBase, organization_id: trade.buyer_organization_id },
    ]);

    return NextResponse.json<ApiResponse<DueDiligenceItem>>({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Error in POST /api/trading/trades/[id]/checklist/items/[itemId]/flag:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
