// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, TradeEventWithDetails } from '@/types';
import type { TradeEvent } from '@/types/database';

// Event type descriptions
const EVENT_DESCRIPTIONS: Record<string, string> = {
  trade_created: 'Trade created',
  terms_agreed: 'Trade terms agreed by buyer',
  dd_started: 'Due diligence process started',
  dd_item_verified: 'DD item verified',
  dd_item_flagged: 'DD item flagged for review',
  question_asked: 'Question submitted',
  question_answered: 'Question answered',
  dd_completed: 'Due diligence completed',
  consent_requested: 'Consent requested',
  consent_received: 'Consent received',
  consent_rejected: 'Consent rejected',
  documentation_prepared: 'Documentation prepared',
  documentation_executed: 'Documentation executed',
  agent_notified: 'Agent notified of transfer',
  funds_received: 'Funds received',
  transfer_recorded: 'Transfer recorded with agent',
  trade_settled: 'Trade settled',
  trade_cancelled: 'Trade cancelled',
};

// GET /api/trading/trades/[id]/events - Get trade event timeline
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get events
    const { data: events, error: eventsError } = await supabase
      .from('trade_events')
      .select('*')
      .eq('trade_id', tradeId)
      .order('occurred_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch events',
        },
      }, { status: 500 });
    }

    // Get actor names
    const actorIds = [...new Set((events || []).map((e: TradeEvent) => e.actor_id))];
    let actorsMap: Record<string, string> = {};

    if (actorIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, display_name, email')
        .in('id', actorIds);

      actorsMap = (users || []).reduce(
        (acc: Record<string, string>, u: { id: string; display_name: string | null; email: string }) => {
          acc[u.id] = u.display_name || u.email;
          return acc;
        },
        {}
      );
    }

    // Build response
    const eventsWithDetails: TradeEventWithDetails[] = (events || []).map((event: TradeEvent) => {
      let description = EVENT_DESCRIPTIONS[event.event_type] || event.event_type;

      // Add context from event_data
      if (event.event_data && typeof event.event_data === 'object' && !Array.isArray(event.event_data)) {
        const data = event.event_data as Record<string, unknown>;
        if (event.event_type === 'dd_item_verified' && data.item_name) {
          description = `Verified: ${data.item_name}`;
        } else if (event.event_type === 'dd_item_flagged' && data.item_name) {
          description = `Flagged: ${data.item_name} - ${data.reason || 'Review required'}`;
        } else if (event.event_type === 'question_asked' && data.question) {
          description = `Question: ${String(data.question).substring(0, 100)}...`;
        } else if (event.event_type === 'trade_cancelled' && data.reason) {
          description = `Trade cancelled: ${data.reason}`;
        }
      }

      return {
        id: event.id,
        trade_id: event.trade_id,
        event_type: event.event_type,
        event_data: event.event_data,
        actor_id: event.actor_id,
        occurred_at: event.occurred_at,
        actor_name: actorsMap[event.actor_id] || 'Unknown',
        description,
      };
    });

    return NextResponse.json<ApiResponse<TradeEventWithDetails[]>>({
      success: true,
      data: eventsWithDetails,
    });
  } catch (error) {
    console.error('Error in GET /api/trading/trades/[id]/events:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
