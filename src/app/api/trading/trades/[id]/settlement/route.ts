// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient, type TypedSupabaseClient } from '@/lib/supabase/server';
import { updateSettlementSchema, confirmSettlementSchema, calculateSettlementSchema } from '@/lib/validations';
import type { ApiResponse, SettlementWithDetails, SettlementCalculation } from '@/types';
import type { Settlement } from '@/types/database';

// GET /api/trading/trades/[id]/settlement - Get settlement details
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

    // Verify trade access
    const { data: trade } = await supabase
      .from('trades')
      .select(`
        id,
        trade_reference,
        trade_date,
        settlement_date,
        seller_organization_id,
        buyer_organization_id,
        trade_facilities!inner (
          facility_name,
          borrower_name
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

    // Get settlement
    const { data: settlement, error: settlementError } = await supabase
      .from('settlements')
      .select('*')
      .eq('trade_id', tradeId)
      .single();

    if (settlementError || !settlement) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Settlement not found - DD may not be complete',
        },
      }, { status: 404 });
    }

    // Get organization names
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name')
      .in('id', [trade.seller_organization_id, trade.buyer_organization_id]);

    const orgsMap = (orgs || []).reduce(
      (acc: Record<string, string>, o: { id: string; name: string }) => {
        acc[o.id] = o.name;
        return acc;
      },
      {}
    );

    const settlementWithDetails: SettlementWithDetails = {
      ...settlement,
      trade: {
        trade_reference: trade.trade_reference,
        trade_date: trade.trade_date,
        settlement_date: trade.settlement_date,
        facility_name: trade.trade_facilities.facility_name,
        seller_name: orgsMap[trade.seller_organization_id] || 'Unknown',
        buyer_name: orgsMap[trade.buyer_organization_id] || 'Unknown',
      },
    };

    return NextResponse.json<ApiResponse<SettlementWithDetails>>({
      success: true,
      data: settlementWithDetails,
    });
  } catch (error) {
    console.error('Error in GET /api/trading/trades/[id]/settlement:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// PUT /api/trading/trades/[id]/settlement - Update settlement
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

    // Verify trade access
    const { data: trade } = await supabase
      .from('trades')
      .select('id, trade_reference, seller_organization_id, buyer_organization_id')
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

    // Get existing settlement
    const { data: existingSettlement } = await supabase
      .from('settlements')
      .select('id, status')
      .eq('trade_id', tradeId)
      .single();

    if (!existingSettlement) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Settlement not found',
        },
      }, { status: 404 });
    }

    // Cannot update settled settlements
    if (existingSettlement.status === 'settled') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Cannot update settled settlement',
        },
      }, { status: 400 });
    }

    const body = await request.json();
    const parsed = updateSettlementSchema.safeParse(body);

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

    // Update settlement
    const { data: settlement, error: updateError } = await supabase
      .from('settlements')
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingSettlement.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating settlement:', updateError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update settlement',
        },
      }, { status: 500 });
    }

    // Update status if funds received
    if (parsed.data.funds_received_at && !existingSettlement.funds_received_at) {
      await supabase.from('trade_events').insert({
        trade_id: tradeId,
        event_type: 'funds_received',
        event_data: { received_at: parsed.data.funds_received_at },
        actor_id: user.id,
      });
    }

    return NextResponse.json<ApiResponse<Settlement>>({
      success: true,
      data: settlement,
    });
  } catch (error) {
    console.error('Error in PUT /api/trading/trades/[id]/settlement:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// POST /api/trading/trades/[id]/settlement - Calculate or confirm settlement
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

    const body = await request.json();

    // Check if this is a confirmation request
    const confirmParsed = confirmSettlementSchema.safeParse(body);
    if (confirmParsed.success) {
      return handleConfirmation(supabase, trade, userData, user, confirmParsed.data);
    }

    // Otherwise treat as calculation request
    const calcParsed = calculateSettlementSchema.safeParse(body);
    if (!calcParsed.success) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
        },
      }, { status: 400 });
    }

    // Calculate settlement amounts
    const calculationDate = calcParsed.data.calculation_date || new Date().toISOString().split('T')[0];
    const principalAmount = trade.trade_amount;
    const tradePrice = trade.trade_price;
    const purchasePriceAmount = principalAmount * (tradePrice / 100);

    // Calculate accrued interest (simplified - would need actual interest rate data)
    let accruedInterest: SettlementCalculation['accrued_interest'] = null;
    if (trade.accrued_interest_handling !== 'seller_retains') {
      // Simplified calculation - in reality would use actual interest rate
      const tradeDate = new Date(trade.trade_date);
      const calcDate = new Date(calculationDate);
      const days = Math.floor((calcDate.getTime() - tradeDate.getTime()) / (1000 * 60 * 60 * 24));
      if (days > 0) {
        accruedInterest = {
          from_date: trade.trade_date,
          to_date: calculationDate,
          days,
          rate: null, // Would come from facility data
          amount: trade.accrued_interest_amount || 0,
        };
      }
    }

    // Calculate delayed compensation if applicable
    let delayedCompensation: SettlementCalculation['delayed_compensation'] = null;
    if (trade.delayed_compensation && trade.delayed_compensation_rate) {
      const settlementDate = new Date(trade.settlement_date);
      const calcDate = new Date(calculationDate);
      const days = Math.floor((calcDate.getTime() - settlementDate.getTime()) / (1000 * 60 * 60 * 24));
      if (days > 0) {
        delayedCompensation = {
          from_date: trade.settlement_date,
          to_date: calculationDate,
          days,
          rate: trade.delayed_compensation_rate,
          amount: principalAmount * (trade.delayed_compensation_rate / 100) * (days / 360),
        };
      }
    }

    const totalSettlementAmount =
      purchasePriceAmount +
      (accruedInterest?.amount || 0) +
      (delayedCompensation?.amount || 0);

    const calculation: SettlementCalculation = {
      trade_id: tradeId,
      calculation_date: calculationDate,
      principal_amount: principalAmount,
      trade_price: tradePrice,
      purchase_price_amount: purchasePriceAmount,
      accrued_interest: accruedInterest,
      delayed_compensation: delayedCompensation,
      total_settlement_amount: totalSettlementAmount,
      buyer_pays: totalSettlementAmount,
      seller_receives: totalSettlementAmount,
      wire_instructions_required: true,
    };

    return NextResponse.json<ApiResponse<SettlementCalculation>>({
      success: true,
      data: calculation,
    });
  } catch (error) {
    console.error('Error in POST /api/trading/trades/[id]/settlement:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// Handle confirmation
async function handleConfirmation(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: TypedSupabaseClient,
  trade: { id: string; trade_reference: string; seller_organization_id: string; buyer_organization_id: string; status: string },
  userData: { organization_id: string },
  user: { id: string },
  data: { party: string; confirmed: boolean }
) {
  // Get settlement
  const { data: settlement } = await supabase
    .from('settlements')
    .select('*')
    .eq('trade_id', trade.id)
    .single();

  if (!settlement) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Settlement not found',
      },
    }, { status: 404 });
  }

  const now = new Date().toISOString();
  const isSeller = trade.seller_organization_id === userData.organization_id;
  const isBuyer = trade.buyer_organization_id === userData.organization_id;

  // Verify party matches user's role
  if (
    (data.party === 'seller' && !isSeller) ||
    (data.party === 'buyer' && !isBuyer)
  ) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You cannot confirm for this party',
      },
    }, { status: 403 });
  }

  // Update settlement confirmation
  const updateData: Record<string, unknown> = { updated_at: now };
  if (data.party === 'seller') {
    updateData.seller_confirmed = true;
    updateData.seller_confirmed_at = now;
  } else if (data.party === 'buyer') {
    updateData.buyer_confirmed = true;
    updateData.buyer_confirmed_at = now;
  }

  // Check if both parties confirmed
  const sellerConfirmed = data.party === 'seller' ? true : settlement.seller_confirmed;
  const buyerConfirmed = data.party === 'buyer' ? true : settlement.buyer_confirmed;

  if (sellerConfirmed && buyerConfirmed) {
    updateData.status = 'settled';
    updateData.transfer_effective_date = now;
  }

  const { data: updatedSettlement, error: updateError } = await supabase
    .from('settlements')
    .update(updateData)
    .eq('id', settlement.id)
    .select()
    .single();

  if (updateError) {
    console.error('Error confirming settlement:', updateError);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to confirm settlement',
      },
    }, { status: 500 });
  }

  // Update trade status if settled
  if (sellerConfirmed && buyerConfirmed) {
    await supabase
      .from('trades')
      .update({ status: 'settled', updated_at: now })
      .eq('id', trade.id);

    // Log trade settled event
    await supabase.from('trade_events').insert({
      trade_id: trade.id,
      event_type: 'trade_settled',
      event_data: {
        settlement_amount: settlement.total_settlement_amount,
        transfer_effective_date: now,
      },
      actor_id: user.id,
    });

    // Log activity for both parties
    const activityBase = {
      source_module: 'trading',
      activity_type: 'trade_settled',
      actor_id: user.id,
      entity_type: 'trade',
      entity_id: trade.id,
      entity_name: trade.trade_reference,
      description: `Trade ${trade.trade_reference} settled successfully`,
    };

    await supabase.from('activities').insert([
      { ...activityBase, organization_id: trade.seller_organization_id },
      { ...activityBase, organization_id: trade.buyer_organization_id },
    ]);
  }

  return NextResponse.json<ApiResponse<Settlement>>({
    success: true,
    data: updatedSettlement,
  });
}
