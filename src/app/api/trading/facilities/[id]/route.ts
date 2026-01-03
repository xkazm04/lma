// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateTradeFacilitySchema } from '@/lib/validations';
import type { ApiResponse, TradeFacilityWithPositions } from '@/types';
import type { TradeFacility, LenderPosition } from '@/types/database';

// GET /api/trading/facilities/[id] - Get facility details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: facilityId } = await params;
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

    // Get facility
    const { data: facility, error: facilityError } = await supabase
      .from('trade_facilities')
      .select('*')
      .eq('id', facilityId)
      .eq('organization_id', userData.organization_id)
      .single();

    if (facilityError || !facility) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Facility not found',
        },
      }, { status: 404 });
    }

    // Get positions
    const { data: positions } = await supabase
      .from('lender_positions')
      .select('*')
      .eq('facility_id', facilityId)
      .eq('organization_id', userData.organization_id)
      .order('acquisition_date', { ascending: false });

    // Get active trades count
    const { count: activeTradesCount } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .eq('facility_id', facilityId)
      .not('status', 'in', '("settled","cancelled","failed")');

    const totalPositionAmount = (positions || []).reduce(
      (sum: number, p: LenderPosition) => sum + p.commitment_amount,
      0
    );

    const facilityWithPositions: TradeFacilityWithPositions = {
      ...facility,
      positions: positions || [],
      active_trades_count: activeTradesCount || 0,
      total_position_amount: totalPositionAmount,
    };

    return NextResponse.json<ApiResponse<TradeFacilityWithPositions>>({
      success: true,
      data: facilityWithPositions,
    });
  } catch (error) {
    console.error('Error in GET /api/trading/facilities/[id]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// PUT /api/trading/facilities/[id] - Update facility
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: facilityId } = await params;
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

    // Verify facility exists and belongs to user's org
    const { data: existingFacility } = await supabase
      .from('trade_facilities')
      .select('id, facility_name')
      .eq('id', facilityId)
      .eq('organization_id', userData.organization_id)
      .single();

    if (!existingFacility) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Facility not found',
        },
      }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateTradeFacilitySchema.safeParse(body);

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

    // Update facility
    const { data: facility, error: updateError } = await supabase
      .from('trade_facilities')
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facilityId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating facility:', updateError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update facility',
        },
      }, { status: 500 });
    }

    // Log activity
    await supabase.from('activities').insert({
      organization_id: userData.organization_id,
      source_module: 'trading',
      activity_type: 'facility_updated',
      actor_id: user.id,
      entity_type: 'trade_facility',
      entity_id: facility.id,
      entity_name: facility.facility_name,
      description: `Updated trade facility ${facility.facility_name}`,
    });

    return NextResponse.json<ApiResponse<TradeFacility>>({
      success: true,
      data: facility,
    });
  } catch (error) {
    console.error('Error in PUT /api/trading/facilities/[id]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// DELETE /api/trading/facilities/[id] - Delete facility
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: facilityId } = await params;
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

    // Get facility
    const { data: facility } = await supabase
      .from('trade_facilities')
      .select('id, facility_name')
      .eq('id', facilityId)
      .eq('organization_id', userData.organization_id)
      .single();

    if (!facility) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Facility not found',
        },
      }, { status: 404 });
    }

    // Check for active trades
    const { count: activeTradesCount } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .eq('facility_id', facilityId)
      .not('status', 'in', '("settled","cancelled","failed")');

    if (activeTradesCount && activeTradesCount > 0) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Cannot delete facility with active trades',
        },
      }, { status: 400 });
    }

    // Delete facility (cascades to positions)
    const { error: deleteError } = await supabase
      .from('trade_facilities')
      .delete()
      .eq('id', facilityId);

    if (deleteError) {
      console.error('Error deleting facility:', deleteError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to delete facility',
        },
      }, { status: 500 });
    }

    // Log activity
    await supabase.from('activities').insert({
      organization_id: userData.organization_id,
      source_module: 'trading',
      activity_type: 'facility_deleted',
      actor_id: user.id,
      entity_type: 'trade_facility',
      entity_id: facilityId,
      entity_name: facility.facility_name,
      description: `Deleted trade facility ${facility.facility_name}`,
    });

    return NextResponse.json<ApiResponse<{ deleted: boolean }>>({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Error in DELETE /api/trading/facilities/[id]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
