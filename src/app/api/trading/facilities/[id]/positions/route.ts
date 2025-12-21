import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createLenderPositionSchema } from '@/lib/validations';
import type { ApiResponse, LenderPositionWithDetails } from '@/types';
import type { LenderPosition } from '@/types/database';

// GET /api/trading/facilities/[id]/positions - List positions for a facility
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

    // Verify facility access
    const { data: facility } = await supabase
      .from('trade_facilities')
      .select('id, facility_name, borrower_name, maturity_date, current_status')
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

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active_only') !== 'false';

    // Get positions
    let query = supabase
      .from('lender_positions')
      .select('*')
      .eq('facility_id', facilityId)
      .eq('organization_id', userData.organization_id)
      .order('acquisition_date', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: positions, error: positionsError } = await query;

    if (positionsError) {
      console.error('Error fetching positions:', positionsError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch positions',
        },
      }, { status: 500 });
    }

    // Get active trade counts for each position
    const positionIds = (positions || []).map((p: LenderPosition) => p.id);
    let activeTradesByPosition: Record<string, number> = {};

    if (positionIds.length > 0) {
      const { data: tradeCounts } = await supabase
        .from('trades')
        .select('seller_position_id')
        .in('seller_position_id', positionIds)
        .not('status', 'in', '("settled","cancelled","failed")');

      activeTradesByPosition = (tradeCounts || []).reduce(
        (acc: Record<string, number>, t: { seller_position_id: string }) => {
          acc[t.seller_position_id] = (acc[t.seller_position_id] || 0) + 1;
          return acc;
        },
        {}
      );
    }

    // Build response
    const positionsWithDetails: LenderPositionWithDetails[] = (positions || []).map(
      (position: LenderPosition) => ({
        ...position,
        facility: {
          facility_name: facility.facility_name,
          borrower_name: facility.borrower_name,
          maturity_date: facility.maturity_date,
          current_status: facility.current_status,
        },
        active_trades: activeTradesByPosition[position.id] || 0,
      })
    );

    return NextResponse.json<ApiResponse<LenderPositionWithDetails[]>>({
      success: true,
      data: positionsWithDetails,
    });
  } catch (error) {
    console.error('Error in GET /api/trading/facilities/[id]/positions:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// POST /api/trading/facilities/[id]/positions - Create a new position
export async function POST(
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

    // Verify facility access
    const { data: facility } = await supabase
      .from('trade_facilities')
      .select('id, facility_name, total_commitments')
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

    const body = await request.json();
    const parsed = createLenderPositionSchema.safeParse({
      ...body,
      facility_id: facilityId,
    });

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

    // Create position
    const { data: position, error: createError } = await supabase
      .from('lender_positions')
      .insert({
        ...parsed.data,
        organization_id: userData.organization_id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating position:', createError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create position',
        },
      }, { status: 500 });
    }

    // Log activity
    await supabase.from('activities').insert({
      organization_id: userData.organization_id,
      source_module: 'trading',
      activity_type: 'position_created',
      actor_id: user.id,
      entity_type: 'lender_position',
      entity_id: position.id,
      entity_name: `${facility.facility_name} position`,
      description: `Created ${position.commitment_amount.toLocaleString()} position in ${facility.facility_name}`,
      details: {
        facility_id: facilityId,
        commitment_amount: position.commitment_amount,
        pro_rata_share: position.pro_rata_share,
      },
    });

    return NextResponse.json<ApiResponse<LenderPosition>>({
      success: true,
      data: position,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/trading/facilities/[id]/positions:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
