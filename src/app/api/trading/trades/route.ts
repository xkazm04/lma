// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createTradeSchema } from '@/lib/validations';
import type { ApiResponse, TradeWithDetails } from '@/types';
import type { Trade, TradeFacility, LenderPosition } from '@/types/database';

// Helper to generate trade reference
function generateTradeReference(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TR-${year}${month}-${random}`;
}

// GET /api/trading/trades - List all trades
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
    const facilityId = searchParams.get('facility_id');
    const role = searchParams.get('role'); // 'buyer' | 'seller' | 'all'
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query for trades where org is buyer or seller
    let query = supabase
      .from('trades')
      .select('*')
      .or(`seller_organization_id.eq.${userData.organization_id},buyer_organization_id.eq.${userData.organization_id}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      if (status === 'active') {
        query = query.not('status', 'in', '("settled","cancelled","failed")');
      } else {
        query = query.eq('status', status);
      }
    }

    if (facilityId) {
      query = query.eq('facility_id', facilityId);
    }

    if (role === 'buyer') {
      query = query.eq('buyer_organization_id', userData.organization_id);
    } else if (role === 'seller') {
      query = query.eq('seller_organization_id', userData.organization_id);
    }

    const { data: trades, error: tradesError } = await query;

    if (tradesError) {
      console.error('Error fetching trades:', tradesError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch trades',
        },
      }, { status: 500 });
    }

    // Get related data
    const facilityIds = [...new Set((trades || []).map((t: Trade) => t.facility_id))];
    const organizationIds = [...new Set((trades || []).flatMap((t: Trade) => [t.seller_organization_id, t.buyer_organization_id]))];
    const tradeIds = (trades || []).map((t: Trade) => t.id);

    // Get facilities
    let facilitiesMap: Record<string, { facility_name: string; borrower_name: string; transferability: string; current_status: string }> = {};
    if (facilityIds.length > 0) {
      const { data: facilities } = await supabase
        .from('trade_facilities')
        .select('id, facility_name, borrower_name, transferability, current_status')
        .in('id', facilityIds);

      facilitiesMap = (facilities || []).reduce(
        (acc: Record<string, { facility_name: string; borrower_name: string; transferability: string; current_status: string }>, f: TradeFacility) => {
          acc[f.id] = {
            facility_name: f.facility_name,
            borrower_name: f.borrower_name,
            transferability: f.transferability,
            current_status: f.current_status,
          };
          return acc;
        },
        {}
      );
    }

    // Get organizations
    let orgsMap: Record<string, string> = {};
    if (organizationIds.length > 0) {
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', organizationIds);

      orgsMap = (orgs || []).reduce(
        (acc: Record<string, string>, o: { id: string; name: string }) => {
          acc[o.id] = o.name;
          return acc;
        },
        {}
      );
    }

    // Get seller positions
    const positionIds = [...new Set((trades || []).map((t: Trade) => t.seller_position_id))];
    let positionsMap: Record<string, number> = {};
    if (positionIds.length > 0) {
      const { data: positions } = await supabase
        .from('lender_positions')
        .select('id, commitment_amount')
        .in('id', positionIds);

      positionsMap = (positions || []).reduce(
        (acc: Record<string, number>, p: LenderPosition) => {
          acc[p.id] = p.commitment_amount;
          return acc;
        },
        {}
      );
    }

    // Get checklist summaries
    let checklistsMap: Record<string, { id: string; status: string; total: number; verified: number; flagged: number }> = {};
    if (tradeIds.length > 0) {
      const { data: checklists } = await supabase
        .from('due_diligence_checklists')
        .select('id, trade_id, status')
        .in('trade_id', tradeIds);

      if (checklists?.length) {
        const checklistIds = checklists.map((c: { id: string }) => c.id);
        const { data: items } = await supabase
          .from('due_diligence_items')
          .select('checklist_id, status')
          .in('checklist_id', checklistIds);

        const itemsByChecklist = (items || []).reduce(
          (acc: Record<string, { total: number; verified: number; flagged: number }>, item: { checklist_id: string; status: string }) => {
            if (!acc[item.checklist_id]) {
              acc[item.checklist_id] = { total: 0, verified: 0, flagged: 0 };
            }
            acc[item.checklist_id].total++;
            if (item.status === 'verified') acc[item.checklist_id].verified++;
            if (item.status === 'flagged') acc[item.checklist_id].flagged++;
            return acc;
          },
          {}
        );

        checklistsMap = checklists.reduce(
          (acc: Record<string, { id: string; status: string; total: number; verified: number; flagged: number }>, c: { id: string; trade_id: string; status: string }) => {
            const itemStats = itemsByChecklist[c.id] || { total: 0, verified: 0, flagged: 0 };
            acc[c.trade_id] = {
              id: c.id,
              status: c.status,
              ...itemStats,
            };
            return acc;
          },
          {}
        );
      }
    }

    // Build response
    const tradesWithDetails: TradeWithDetails[] = (trades || []).map((trade: Trade) => {
      const checklist = checklistsMap[trade.id];
      return {
        ...trade,
        facility: facilitiesMap[trade.facility_id],
        seller: {
          organization_name: orgsMap[trade.seller_organization_id] || 'Unknown',
          position_amount: positionsMap[trade.seller_position_id] || 0,
        },
        buyer: {
          organization_name: orgsMap[trade.buyer_organization_id] || 'Unknown',
        },
        checklist: checklist
          ? {
              id: checklist.id,
              status: checklist.status as 'not_started' | 'in_progress' | 'complete' | 'flagged',
              total_items: checklist.total,
              verified_items: checklist.verified,
              flagged_items: checklist.flagged,
              pending_items: checklist.total - checklist.verified - checklist.flagged,
              completion_percentage: checklist.total > 0 ? Math.round((checklist.verified / checklist.total) * 100) : 0,
              buyer_completed_at: null,
              seller_completed_at: null,
            }
          : undefined,
      };
    });

    return NextResponse.json<ApiResponse<TradeWithDetails[]>>({
      success: true,
      data: tradesWithDetails,
    });
  } catch (error) {
    console.error('Error in GET /api/trading/trades:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// POST /api/trading/trades - Create a new trade
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
    const parsed = createTradeSchema.safeParse(body);

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

    // Verify seller position belongs to user's org
    const { data: position } = await supabase
      .from('lender_positions')
      .select('id, facility_id, commitment_amount, organization_id')
      .eq('id', parsed.data.seller_position_id)
      .eq('organization_id', userData.organization_id)
      .eq('is_active', true)
      .single();

    if (!position) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid seller position',
        },
      }, { status: 400 });
    }

    // Verify trade amount doesn't exceed position
    if (parsed.data.trade_amount > position.commitment_amount) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Trade amount exceeds position commitment',
        },
      }, { status: 400 });
    }

    // Verify facility matches
    if (parsed.data.facility_id !== position.facility_id) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Position does not belong to specified facility',
        },
      }, { status: 400 });
    }

    // Get facility for transferability check
    const { data: facility } = await supabase
      .from('trade_facilities')
      .select('id, facility_name, transferability')
      .eq('id', parsed.data.facility_id)
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

    // Set consent required based on transferability
    const consentRequired = facility.transferability === 'consent_required' || facility.transferability === 'restricted';

    // Create trade
    const tradeReference = generateTradeReference();
    const { data: trade, error: createError } = await supabase
      .from('trades')
      .insert({
        ...parsed.data,
        trade_reference: tradeReference,
        seller_organization_id: userData.organization_id,
        consent_required: consentRequired,
        status: 'draft',
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating trade:', createError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create trade',
        },
      }, { status: 500 });
    }

    // Log trade event
    await supabase.from('trade_events').insert({
      trade_id: trade.id,
      event_type: 'trade_created',
      event_data: {
        trade_amount: trade.trade_amount,
        trade_price: trade.trade_price,
      },
      actor_id: user.id,
    });

    // Log activity
    await supabase.from('activities').insert({
      organization_id: userData.organization_id,
      source_module: 'trading',
      activity_type: 'trade_created',
      actor_id: user.id,
      entity_type: 'trade',
      entity_id: trade.id,
      entity_name: tradeReference,
      description: `Created trade ${tradeReference} for ${facility.facility_name}`,
      details: {
        facility_id: facility.id,
        trade_amount: trade.trade_amount,
        trade_price: trade.trade_price,
      },
    });

    return NextResponse.json<ApiResponse<Trade>>({
      success: true,
      data: trade,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/trading/trades:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
