// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient, type TypedSupabaseClient } from '@/lib/supabase/server';
import { updateDDItemSchema } from '@/lib/validations';
import type { ApiResponse, DueDiligenceItemWithDetails } from '@/types';
import type { DueDiligenceItem } from '@/types/database';

// GET /api/trading/trades/[id]/checklist/items/[itemId] - Get DD item details
export async function GET(
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
      .select('id')
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

    // Get item with checklist verification
    const { data: item, error: itemError } = await supabase
      .from('due_diligence_items')
      .select(`
        *,
        due_diligence_checklists!inner (
          trade_id
        )
      `)
      .eq('id', itemId)
      .single();

    if (itemError || !item || item.due_diligence_checklists.trade_id !== tradeId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Item not found',
        },
      }, { status: 404 });
    }

    // Get verifier name if verified
    let verifierName: string | undefined;
    if (item.verified_by) {
      const { data: verifier } = await supabase
        .from('users')
        .select('display_name, email')
        .eq('id', item.verified_by)
        .single();
      verifierName = verifier?.display_name || verifier?.email;
    }

    // Get related questions
    const { data: questions } = await supabase
      .from('due_diligence_questions')
      .select('*')
      .eq('checklist_item_id', itemId)
      .order('created_at', { ascending: false });

    const itemWithDetails: DueDiligenceItemWithDetails = {
      id: item.id,
      checklist_id: item.checklist_id,
      category: item.category,
      item_name: item.item_name,
      item_description: item.item_description,
      data_source: item.data_source,
      required_for: item.required_for,
      is_critical: item.is_critical,
      status: item.status,
      auto_verified: item.auto_verified,
      auto_verified_at: item.auto_verified_at,
      auto_verified_data: item.auto_verified_data,
      verified_by: item.verified_by,
      verified_at: item.verified_at,
      verification_notes: item.verification_notes,
      flag_reason: item.flag_reason,
      flag_severity: item.flag_severity,
      flagged_by: item.flagged_by,
      flagged_at: item.flagged_at,
      evidence_document_ids: item.evidence_document_ids,
      evidence_notes: item.evidence_notes,
      display_order: item.display_order,
      created_at: item.created_at,
      updated_at: item.updated_at,
      verifier_name: verifierName,
      questions: questions || [],
    };

    return NextResponse.json<ApiResponse<DueDiligenceItemWithDetails>>({
      success: true,
      data: itemWithDetails,
    });
  } catch (error) {
    console.error('Error in GET /api/trading/trades/[id]/checklist/items/[itemId]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// PUT /api/trading/trades/[id]/checklist/items/[itemId] - Update DD item
export async function PUT(
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
      .select('id, status')
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

    // Verify item belongs to trade's checklist
    const { data: existingItem } = await supabase
      .from('due_diligence_items')
      .select(`
        id,
        item_name,
        status,
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
    const parsed = updateDDItemSchema.safeParse(body);

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
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating item:', updateError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update item',
        },
      }, { status: 500 });
    }

    // Update checklist status if needed
    await updateChecklistStatus(supabase, existingItem.due_diligence_checklists.id);

    return NextResponse.json<ApiResponse<DueDiligenceItem>>({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Error in PUT /api/trading/trades/[id]/checklist/items/[itemId]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// Helper to update checklist status based on items
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateChecklistStatus(supabase: TypedSupabaseClient, checklistId: string) {
  const { data: items } = await supabase
    .from('due_diligence_items')
    .select('status')
    .eq('checklist_id', checklistId);

  if (!items?.length) return;

  const statuses = items.map((i: { status: string }) => i.status);
  let newStatus = 'not_started';

  if (statuses.some((s: string) => s === 'flagged')) {
    newStatus = 'flagged';
  } else if (statuses.every((s: string) => ['verified', 'waived', 'not_applicable'].includes(s))) {
    newStatus = 'complete';
  } else if (statuses.some((s: string) => ['verified', 'in_review', 'waived'].includes(s))) {
    newStatus = 'in_progress';
  }

  await supabase
    .from('due_diligence_checklists')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', checklistId);
}
