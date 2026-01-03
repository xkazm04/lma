// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, LenderPositionWithDetails } from '@/types';
import type { LenderPosition, TradeFacility } from '@/types/database';

// GET /api/trading/positions - List all positions across facilities
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
    const activeOnly = searchParams.get('active_only') !== 'false';
    const facilityId = searchParams.get('facility_id');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('lender_positions')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .order('acquisition_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    if (facilityId) {
      query = query.eq('facility_id', facilityId);
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

    // Get facilities for these positions
    const facilityIds = [...new Set((positions || []).map((p: LenderPosition) => p.facility_id))];
    let facilitiesMap: Record<string, { facility_name: string; borrower_name: string; maturity_date: string; current_status: string }> = {};

    if (facilityIds.length > 0) {
      const { data: facilities } = await supabase
        .from('trade_facilities')
        .select('id, facility_name, borrower_name, maturity_date, current_status')
        .in('id', facilityIds);

      facilitiesMap = (facilities || []).reduce(
        (acc: Record<string, { facility_name: string; borrower_name: string; maturity_date: string; current_status: string }>, f: TradeFacility) => {
          acc[f.id] = {
            facility_name: f.facility_name,
            borrower_name: f.borrower_name,
            maturity_date: f.maturity_date,
            current_status: f.current_status,
          };
          return acc;
        },
        {}
      );
    }

    // Get active trade counts
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
        facility: facilitiesMap[position.facility_id],
        active_trades: activeTradesByPosition[position.id] || 0,
      })
    );

    return NextResponse.json<ApiResponse<LenderPositionWithDetails[]>>({
      success: true,
      data: positionsWithDetails,
    });
  } catch (error) {
    console.error('Error in GET /api/trading/positions:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
