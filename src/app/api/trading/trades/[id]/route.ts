import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateTradeSchema } from '@/lib/validations';
import { keyByWithTransform } from '@/lib/utils';
import type { ApiResponse, TradeWithDetails } from '@/types';
import type { Trade } from '@/types/database';

// GET /api/trading/trades/[id] - Get trade details
export async function GET(
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

    // Get trade (user must be buyer or seller)
    const { data: trade, error: tradeError } = await supabase
      .from('trades')
      .select('*')
      .eq('id', tradeId)
      .or(`seller_organization_id.eq.${userData.organization_id},buyer_organization_id.eq.${userData.organization_id}`)
      .single();

    if (tradeError || !trade) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Trade not found',
        },
      }, { status: 404 });
    }

    // Get facility
    const { data: facility } = await supabase
      .from('trade_facilities')
      .select('facility_name, borrower_name, transferability, current_status')
      .eq('id', trade.facility_id)
      .single();

    // Get organizations
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name')
      .in('id', [trade.seller_organization_id, trade.buyer_organization_id]);

    const orgsMap = keyByWithTransform(
      orgs || [],
      (o: { id: string; name: string }) => o.id,
      (o: { id: string; name: string }) => o.name
    );

    // Get seller position
    const { data: position } = await supabase
      .from('lender_positions')
      .select('commitment_amount')
      .eq('id', trade.seller_position_id)
      .single();

    // Get checklist
    const { data: checklist } = await supabase
      .from('due_diligence_checklists')
      .select('id, status, buyer_completed_at, seller_completed_at')
      .eq('trade_id', tradeId)
      .single();

    let checklistSummary = undefined;
    if (checklist) {
      const { data: items } = await supabase
        .from('due_diligence_items')
        .select('status')
        .eq('checklist_id', checklist.id);

      const total = items?.length || 0;
      const verified = items?.filter((i: { status: string }) => i.status === 'verified').length || 0;
      const flagged = items?.filter((i: { status: string }) => i.status === 'flagged').length || 0;

      checklistSummary = {
        id: checklist.id,
        status: checklist.status,
        total_items: total,
        verified_items: verified,
        flagged_items: flagged,
        pending_items: total - verified - flagged,
        completion_percentage: total > 0 ? Math.round((verified / total) * 100) : 0,
        buyer_completed_at: checklist.buyer_completed_at,
        seller_completed_at: checklist.seller_completed_at,
      };
    }

    // Get settlement
    const { data: settlement } = await supabase
      .from('settlements')
      .select('id, status, principal_amount, purchase_price_percentage, purchase_price_amount, accrued_interest, delayed_compensation, total_settlement_amount, funds_received_at, transfer_effective_date')
      .eq('trade_id', tradeId)
      .single();

    const tradeWithDetails: TradeWithDetails = {
      ...trade,
      facility: facility
        ? {
            facility_name: facility.facility_name,
            borrower_name: facility.borrower_name,
            transferability: facility.transferability,
            current_status: facility.current_status,
          }
        : undefined,
      seller: {
        organization_name: orgsMap[trade.seller_organization_id] || 'Unknown',
        position_amount: position?.commitment_amount || 0,
      },
      buyer: {
        organization_name: orgsMap[trade.buyer_organization_id] || 'Unknown',
      },
      checklist: checklistSummary,
      settlement: settlement
        ? {
            id: settlement.id,
            status: settlement.status,
            principal_amount: settlement.principal_amount,
            purchase_price_percentage: settlement.purchase_price_percentage,
            purchase_price_amount: settlement.purchase_price_amount,
            accrued_interest: settlement.accrued_interest,
            delayed_compensation: settlement.delayed_compensation,
            total_settlement_amount: settlement.total_settlement_amount,
            funds_received_at: settlement.funds_received_at,
            transfer_effective_date: settlement.transfer_effective_date,
          }
        : undefined,
    };

    return NextResponse.json<ApiResponse<TradeWithDetails>>({
      success: true,
      data: tradeWithDetails,
    });
  } catch (error) {
    console.error('Error in GET /api/trading/trades/[id]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// PUT /api/trading/trades/[id] - Update trade
export async function PUT(
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

    // Get trade (only seller can update in draft status)
    const { data: existingTrade } = await supabase
      .from('trades')
      .select('id, status, trade_reference, seller_organization_id')
      .eq('id', tradeId)
      .single();

    if (!existingTrade) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Trade not found',
        },
      }, { status: 404 });
    }

    // Check permissions - seller can update in draft, both can update some fields later
    const isSeller = existingTrade.seller_organization_id === userData.organization_id;
    if (!isSeller && existingTrade.status === 'draft') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only seller can update trade in draft status',
        },
      }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateTradeSchema.safeParse(body);

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

    // Prevent certain updates after trade is agreed
    if (existingTrade.status !== 'draft') {
      const restrictedFields = ['trade_amount', 'trade_price', 'settlement_date'];
      const hasRestrictedChanges = restrictedFields.some((f) => parsed.data[f as keyof typeof parsed.data] !== undefined);
      if (hasRestrictedChanges) {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Cannot modify trade terms after agreement',
          },
        }, { status: 400 });
      }
    }

    // Update trade
    const { data: trade, error: updateError } = await supabase
      .from('trades')
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tradeId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating trade:', updateError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update trade',
        },
      }, { status: 500 });
    }

    // Log activity
    await supabase.from('activities').insert({
      organization_id: userData.organization_id,
      source_module: 'trading',
      activity_type: 'trade_updated',
      actor_id: user.id,
      entity_type: 'trade',
      entity_id: trade.id,
      entity_name: trade.trade_reference,
      description: `Updated trade ${trade.trade_reference}`,
    });

    return NextResponse.json<ApiResponse<Trade>>({
      success: true,
      data: trade,
    });
  } catch (error) {
    console.error('Error in PUT /api/trading/trades/[id]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
