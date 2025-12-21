import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createTradeFacilitySchema } from '@/lib/validations';
import { groupBy, countBy } from '@/lib/utils';
import type { ApiResponse, TradeFacilityWithPositions } from '@/types';
import type { TradeFacility, LenderPosition } from '@/types/database';

// GET /api/trading/facilities - List all trade facilities
export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('trade_facilities')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      query = query.eq('current_status', status);
    }

    if (search) {
      query = query.or(`facility_name.ilike.%${search}%,borrower_name.ilike.%${search}%`);
    }

    const { data: facilities, error: facilitiesError } = await query;

    if (facilitiesError) {
      console.error('Error fetching facilities:', facilitiesError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch facilities',
        },
      }, { status: 500 });
    }

    // Get positions for each facility
    const facilityIds = (facilities || []).map((f: TradeFacility) => f.id);

    let positionsByFacility: Record<string, LenderPosition[]> = {};
    let activeTradesByFacility: Record<string, number> = {};

    if (facilityIds.length > 0) {
      // Get positions
      const { data: positions } = await supabase
        .from('lender_positions')
        .select('*')
        .in('facility_id', facilityIds)
        .eq('organization_id', userData.organization_id)
        .eq('is_active', true);

      positionsByFacility = groupBy(positions || [], (pos: LenderPosition) => pos.facility_id);

      // Get active trade counts
      const { data: tradeCounts } = await supabase
        .from('trades')
        .select('facility_id')
        .in('facility_id', facilityIds)
        .not('status', 'in', '("settled","cancelled","failed")');

      activeTradesByFacility = countBy(tradeCounts || [], (t: { facility_id: string }) => t.facility_id);
    }

    // Build response with positions
    const facilitiesWithPositions: TradeFacilityWithPositions[] = (facilities || []).map(
      (facility: TradeFacility) => {
        const positions = positionsByFacility[facility.id] || [];
        const totalPositionAmount = positions.reduce((sum, p) => sum + p.commitment_amount, 0);

        return {
          ...facility,
          positions,
          active_trades_count: activeTradesByFacility[facility.id] || 0,
          total_position_amount: totalPositionAmount,
        };
      }
    );

    return NextResponse.json<ApiResponse<TradeFacilityWithPositions[]>>({
      success: true,
      data: facilitiesWithPositions,
    });
  } catch (error) {
    console.error('Error in GET /api/trading/facilities:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// POST /api/trading/facilities - Create a new trade facility
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const parsed = createTradeFacilitySchema.safeParse(body);

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

    // Create facility
    const { data: facility, error: createError } = await supabase
      .from('trade_facilities')
      .insert({
        ...parsed.data,
        organization_id: userData.organization_id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating facility:', createError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create facility',
        },
      }, { status: 500 });
    }

    // Log activity
    await supabase.from('activities').insert({
      organization_id: userData.organization_id,
      source_module: 'trading',
      activity_type: 'facility_created',
      actor_id: user.id,
      entity_type: 'trade_facility',
      entity_id: facility.id,
      entity_name: facility.facility_name,
      description: `Created trade facility ${facility.facility_name} for ${facility.borrower_name}`,
    });

    return NextResponse.json<ApiResponse<TradeFacility>>({
      success: true,
      data: facility,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/trading/facilities:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
