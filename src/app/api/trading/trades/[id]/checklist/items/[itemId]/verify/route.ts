import { NextRequest, NextResponse } from 'next/server';
import { createClient, type TypedSupabaseClient } from '@/lib/supabase/server';
import { verifyDDItemSchema } from '@/lib/validations';
import type { ApiResponse } from '@/types';

// Response type for atomic verification
interface VerifyDDItemResult {
  item_id: string;
  item_status: string;
  item_name: string;
  item_category: string;
  event_id: string;
  verified_at: string;
  actor_name: string;
}

// POST /api/trading/trades/[id]/checklist/items/[itemId]/verify - Verify DD item atomically
// This endpoint handles both the item verification AND timeline event creation in a single transaction
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

    // Get user's organization and display name
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, display_name, email')
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

    // Get item to check permissions
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

    // Check if user can verify based on required_for
    const isBuyer = trade.buyer_organization_id === userData.organization_id;
    const isSeller = trade.seller_organization_id === userData.organization_id;
    const requiredFor = existingItem.required_for;

    if (
      (requiredFor === 'buyer' && !isBuyer) ||
      (requiredFor === 'seller' && !isSeller)
    ) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `This item must be verified by the ${requiredFor}`,
        },
      }, { status: 403 });
    }

    const body = await request.json();
    const parsed = verifyDDItemSchema.safeParse(body);

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

    // Call the atomic RPC function that verifies item AND creates timeline event in one transaction
    const { data: result, error: rpcError } = await supabase.rpc('verify_dd_item_atomic', {
      p_item_id: itemId,
      p_trade_id: tradeId,
      p_user_id: user.id,
      p_verification_notes: parsed.data.verification_notes || null,
      p_evidence_document_ids: parsed.data.evidence_document_ids || null,
      p_evidence_notes: parsed.data.evidence_notes || null,
    });

    if (rpcError) {
      console.error('Error in atomic verification:', rpcError);

      // Fallback to non-atomic operation if RPC is not available
      if (rpcError.code === 'PGRST202' || rpcError.message?.includes('function')) {
        return await fallbackVerification(
          supabase,
          itemId,
          tradeId,
          user.id,
          userData,
          existingItem,
          trade,
          parsed.data
        );
      }

      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to verify item',
        },
      }, { status: 500 });
    }

    // Get the first result from the RPC response
    const verifyResult: VerifyDDItemResult = Array.isArray(result) ? result[0] : result;

    // Log activity (non-critical, can be async)
    supabase.from('activities').insert({
      organization_id: userData.organization_id,
      source_module: 'trading',
      activity_type: 'dd_item_verified',
      actor_id: user.id,
      entity_type: 'due_diligence_item',
      entity_id: itemId,
      entity_name: verifyResult.item_name,
      description: `Verified DD item: ${verifyResult.item_name} for trade ${trade.trade_reference}`,
    }).then(() => {}).catch((e: Error) => console.error('Activity log error:', e));

    // Fetch the full updated item for the response
    const { data: updatedItem } = await supabase
      .from('due_diligence_items')
      .select('*')
      .eq('id', itemId)
      .single();

    return NextResponse.json<ApiResponse<typeof updatedItem & { timeline_event_id: string; actor_name: string }>>({
      success: true,
      data: {
        ...updatedItem,
        timeline_event_id: verifyResult.event_id,
        actor_name: verifyResult.actor_name,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/trading/trades/[id]/checklist/items/[itemId]/verify:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// Fallback for when RPC function is not deployed yet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fallbackVerification(
  supabase: TypedSupabaseClient,
  itemId: string,
  tradeId: string,
  userId: string,
  userData: { organization_id: string; display_name?: string; email?: string },
  existingItem: { item_name: string; category: string; due_diligence_checklists: { id: string } },
  trade: { trade_reference: string },
  data: { verification_notes?: string; evidence_document_ids?: string[]; evidence_notes?: string }
) {
  const now = new Date().toISOString();

  // Update item
  const { data: item, error: updateError } = await supabase
    .from('due_diligence_items')
    .update({
      status: 'verified',
      verified_by: userId,
      verified_at: now,
      verification_notes: data.verification_notes,
      evidence_document_ids: data.evidence_document_ids,
      evidence_notes: data.evidence_notes,
      flag_reason: null,
      flag_severity: null,
      updated_at: now,
    })
    .eq('id', itemId)
    .select()
    .single();

  if (updateError) {
    console.error('Error verifying item (fallback):', updateError);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to verify item',
      },
    }, { status: 500 });
  }

  // Create timeline event
  const { data: event } = await supabase.from('trade_events').insert({
    trade_id: tradeId,
    event_type: 'dd_item_verified',
    event_data: {
      item_id: itemId,
      item_name: existingItem.item_name,
      category: existingItem.category,
    },
    actor_id: userId,
    occurred_at: now,
  }).select().single();

  // Update checklist status
  await updateChecklistStatus(supabase, existingItem.due_diligence_checklists.id, tradeId);

  // Log activity
  await supabase.from('activities').insert({
    organization_id: userData.organization_id,
    source_module: 'trading',
    activity_type: 'dd_item_verified',
    actor_id: userId,
    entity_type: 'due_diligence_item',
    entity_id: itemId,
    entity_name: existingItem.item_name,
    description: `Verified DD item: ${existingItem.item_name} for trade ${trade.trade_reference}`,
  });

  return NextResponse.json<ApiResponse<typeof item & { timeline_event_id?: string; actor_name?: string }>>({
    success: true,
    data: {
      ...item,
      timeline_event_id: event?.id,
      actor_name: userData.display_name || userData.email || 'Unknown',
    },
  });
}

// Helper to update checklist and trade status (fallback)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateChecklistStatus(supabase: TypedSupabaseClient, checklistId: string, tradeId: string) {
  const { data: items } = await supabase
    .from('due_diligence_items')
    .select('status')
    .eq('checklist_id', checklistId);

  if (!items?.length) return;

  const statuses = items.map((i: { status: string }) => i.status);
  let newStatus = 'not_started';
  const completedCount = statuses.filter((s: string) => ['verified', 'waived', 'not_applicable'].includes(s)).length;
  const flaggedCount = statuses.filter((s: string) => s === 'flagged').length;

  if (flaggedCount > 0) {
    newStatus = 'flagged';
  } else if (completedCount === statuses.length) {
    newStatus = 'complete';
  } else if (statuses.some((s: string) => ['verified', 'in_review', 'waived'].includes(s))) {
    newStatus = 'in_progress';
  }

  await supabase
    .from('due_diligence_checklists')
    .update({
      status: newStatus,
      completed_items: completedCount,
      flagged_items: flaggedCount,
      updated_at: new Date().toISOString(),
      completed_at: newStatus === 'complete' ? new Date().toISOString() : null,
    })
    .eq('id', checklistId);

  // Update trade status to in_due_diligence if first item verified
  if (newStatus === 'in_progress') {
    await supabase
      .from('trades')
      .update({ status: 'in_due_diligence', updated_at: new Date().toISOString() })
      .eq('id', tradeId)
      .eq('status', 'agreed');
  }
}
