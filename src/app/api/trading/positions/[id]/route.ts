import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateLenderPositionSchema } from '@/lib/validations';
import type { ApiResponse, LenderPositionWithDetails } from '@/types';
import type { LenderPosition } from '@/types/database';

// GET /api/trading/positions/[id] - Get position details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: positionId } = await params;
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

    // Get position with facility
    const { data: position, error: positionError } = await supabase
      .from('lender_positions')
      .select(`
        *,
        trade_facilities!inner (
          facility_name,
          borrower_name,
          maturity_date,
          current_status
        )
      `)
      .eq('id', positionId)
      .eq('organization_id', userData.organization_id)
      .single();

    if (positionError || !position) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Position not found',
        },
      }, { status: 404 });
    }

    // Get active trades count
    const { count: activeTradesCount } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .eq('seller_position_id', positionId)
      .not('status', 'in', '("settled","cancelled","failed")');

    const positionWithDetails: LenderPositionWithDetails = {
      id: position.id,
      facility_id: position.facility_id,
      organization_id: position.organization_id,
      commitment_amount: position.commitment_amount,
      outstanding_principal: position.outstanding_principal,
      unfunded_commitment: position.unfunded_commitment,
      pro_rata_share: position.pro_rata_share,
      acquisition_date: position.acquisition_date,
      acquisition_price: position.acquisition_price,
      acquisition_type: position.acquisition_type,
      predecessor_lender: position.predecessor_lender,
      is_active: position.is_active,
      created_at: position.created_at,
      updated_at: position.updated_at,
      facility: {
        facility_name: position.trade_facilities.facility_name,
        borrower_name: position.trade_facilities.borrower_name,
        maturity_date: position.trade_facilities.maturity_date,
        current_status: position.trade_facilities.current_status,
      },
      active_trades: activeTradesCount || 0,
    };

    return NextResponse.json<ApiResponse<LenderPositionWithDetails>>({
      success: true,
      data: positionWithDetails,
    });
  } catch (error) {
    console.error('Error in GET /api/trading/positions/[id]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// PUT /api/trading/positions/[id] - Update position
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: positionId } = await params;
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

    // Verify position exists
    const { data: existingPosition } = await supabase
      .from('lender_positions')
      .select(`
        id,
        facility_id,
        trade_facilities!inner (
          facility_name
        )
      `)
      .eq('id', positionId)
      .eq('organization_id', userData.organization_id)
      .single();

    if (!existingPosition) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Position not found',
        },
      }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateLenderPositionSchema.safeParse(body);

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

    // Update position
    const { data: position, error: updateError } = await supabase
      .from('lender_positions')
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', positionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating position:', updateError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update position',
        },
      }, { status: 500 });
    }

    // Log activity
    await supabase.from('activities').insert({
      organization_id: userData.organization_id,
      source_module: 'trading',
      activity_type: 'position_updated',
      actor_id: user.id,
      entity_type: 'lender_position',
      entity_id: position.id,
      entity_name: `${existingPosition.trade_facilities.facility_name} position`,
      description: `Updated position in ${existingPosition.trade_facilities.facility_name}`,
    });

    return NextResponse.json<ApiResponse<LenderPosition>>({
      success: true,
      data: position,
    });
  } catch (error) {
    console.error('Error in PUT /api/trading/positions/[id]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// DELETE /api/trading/positions/[id] - Delete/deactivate position
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: positionId } = await params;
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

    // Get position
    const { data: position } = await supabase
      .from('lender_positions')
      .select(`
        id,
        trade_facilities!inner (
          facility_name
        )
      `)
      .eq('id', positionId)
      .eq('organization_id', userData.organization_id)
      .single();

    if (!position) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Position not found',
        },
      }, { status: 404 });
    }

    // Check for active trades
    const { count: activeTradesCount } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .eq('seller_position_id', positionId)
      .not('status', 'in', '("settled","cancelled","failed")');

    if (activeTradesCount && activeTradesCount > 0) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Cannot delete position with active trades',
        },
      }, { status: 400 });
    }

    // Deactivate position instead of deleting to preserve history
    const { error: updateError } = await supabase
      .from('lender_positions')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', positionId);

    if (updateError) {
      console.error('Error deactivating position:', updateError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to delete position',
        },
      }, { status: 500 });
    }

    // Log activity
    await supabase.from('activities').insert({
      organization_id: userData.organization_id,
      source_module: 'trading',
      activity_type: 'position_deleted',
      actor_id: user.id,
      entity_type: 'lender_position',
      entity_id: positionId,
      entity_name: `${position.trade_facilities.facility_name} position`,
      description: `Deactivated position in ${position.trade_facilities.facility_name}`,
    });

    return NextResponse.json<ApiResponse<{ deleted: boolean }>>({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Error in DELETE /api/trading/positions/[id]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
