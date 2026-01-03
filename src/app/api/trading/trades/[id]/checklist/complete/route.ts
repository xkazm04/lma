// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { completeDDSchema } from '@/lib/validations';
import type { ApiResponse } from '@/types';
import type { Trade, DueDiligenceChecklist } from '@/types/database';

// POST /api/trading/trades/[id]/checklist/complete - Mark DD complete for party
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

    // Verify trade access
    const { data: trade } = await supabase
      .from('trades')
      .select('id, status, trade_reference, seller_organization_id, buyer_organization_id, consent_required')
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

    const body = await request.json();
    const parsed = completeDDSchema.safeParse(body);

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

    // Get checklist
    const { data: checklist } = await supabase
      .from('due_diligence_checklists')
      .select('*')
      .eq('trade_id', tradeId)
      .single();

    if (!checklist) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Checklist not found',
        },
      }, { status: 404 });
    }

    // Check for blocking flags
    const { data: blockingItems } = await supabase
      .from('due_diligence_items')
      .select('id, item_name')
      .eq('checklist_id', checklist.id)
      .eq('status', 'flagged')
      .eq('flag_severity', 'blocker');

    if (blockingItems?.length > 0) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Cannot complete DD with blocking issues: ${blockingItems.map((i: { item_name: string }) => i.item_name).join(', ')}`,
        },
      }, { status: 400 });
    }

    // Determine which party is completing
    const isBuyer = trade.buyer_organization_id === userData.organization_id;
    const isSeller = trade.seller_organization_id === userData.organization_id;
    const now = new Date().toISOString();

    // Check required items for this party
    const { data: pendingRequired } = await supabase
      .from('due_diligence_items')
      .select('id, item_name')
      .eq('checklist_id', checklist.id)
      .eq('is_critical', true)
      .eq('required_for', isBuyer ? 'buyer' : isSeller ? 'seller' : 'both')
      .not('status', 'in', '("verified","waived","not_applicable")');

    // Also check items required for 'both'
    const { data: pendingBoth } = await supabase
      .from('due_diligence_items')
      .select('id, item_name')
      .eq('checklist_id', checklist.id)
      .eq('is_critical', true)
      .eq('required_for', 'both')
      .not('status', 'in', '("verified","waived","not_applicable")');

    const allPending = [...(pendingRequired || []), ...(pendingBoth || [])];
    if (allPending.length > 0) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Critical items not verified: ${allPending.map((i: { item_name: string }) => i.item_name).join(', ')}`,
        },
      }, { status: 400 });
    }

    // Update checklist
    const updateData: Partial<DueDiligenceChecklist> = {
      updated_at: now,
    };

    if (isBuyer) {
      updateData.buyer_completed_at = now;
    }
    if (isSeller) {
      updateData.seller_completed_at = now;
    }

    // Check if both parties have completed
    const buyerCompleted = isBuyer ? true : !!checklist.buyer_completed_at;
    const sellerCompleted = isSeller ? true : !!checklist.seller_completed_at;

    if (buyerCompleted && sellerCompleted) {
      updateData.status = 'complete';
    }

    const { data: updatedChecklist, error: updateError } = await supabase
      .from('due_diligence_checklists')
      .update(updateData)
      .eq('id', checklist.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error completing checklist:', updateError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to complete checklist',
        },
      }, { status: 500 });
    }

    // Update trade status if both parties completed
    let updatedTrade: Trade | null = null;
    if (buyerCompleted && sellerCompleted) {
      const nextStatus = trade.consent_required ? 'pending_consent' : 'documentation';
      const { data: newTrade } = await supabase
        .from('trades')
        .update({ status: nextStatus, updated_at: now })
        .eq('id', tradeId)
        .select()
        .single();
      updatedTrade = newTrade;

      // Log DD completed event
      await supabase.from('trade_events').insert({
        trade_id: tradeId,
        event_type: 'dd_completed',
        event_data: {
          buyer_completed_at: checklist.buyer_completed_at || now,
          seller_completed_at: checklist.seller_completed_at || now,
        },
        actor_id: user.id,
      });

      // Create settlement record
      await supabase.from('settlements').insert({
        trade_id: tradeId,
        status: 'pending',
        principal_amount: trade.trade_amount || 0,
        purchase_price_percentage: trade.trade_price || 100,
        purchase_price_amount: (trade.trade_amount || 0) * ((trade.trade_price || 100) / 100),
        total_settlement_amount: (trade.trade_amount || 0) * ((trade.trade_price || 100) / 100),
      });
    }

    // Log activity
    const activityBase = {
      source_module: 'trading',
      activity_type: 'dd_completed_by_party',
      actor_id: user.id,
      entity_type: 'due_diligence_checklist',
      entity_id: checklist.id,
      entity_name: `DD for ${trade.trade_reference}`,
      description: `${isBuyer ? 'Buyer' : 'Seller'} completed due diligence for trade ${trade.trade_reference}`,
    };

    await supabase.from('activities').insert([
      { ...activityBase, organization_id: trade.seller_organization_id },
      { ...activityBase, organization_id: trade.buyer_organization_id },
    ]);

    return NextResponse.json<ApiResponse<{ checklist: DueDiligenceChecklist; trade?: Trade }>>({
      success: true,
      data: {
        checklist: updatedChecklist,
        trade: updatedTrade || undefined,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/trading/trades/[id]/checklist/complete:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
