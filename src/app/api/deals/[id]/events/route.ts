import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { ApiResponse } from '@/types';

/**
 * Event Sourcing API for Negotiations
 *
 * This endpoint manages negotiation events - the source of truth
 * for all negotiation activity. Events are immutable and append-only.
 */

// Validation schemas
const negotiationEventTypeSchema = z.enum([
  'deal_created',
  'deal_status_changed',
  'term_created',
  'term_updated',
  'term_status_changed',
  'term_locked',
  'term_unlocked',
  'proposal_made',
  'proposal_accepted',
  'proposal_rejected',
  'proposal_withdrawn',
  'proposal_superseded',
  'counter_proposal_made',
  'comment_added',
  'comment_resolved',
  'comment_deleted',
  'participant_joined',
  'participant_left',
  'participant_role_changed',
  'deadline_set',
  'deadline_removed',
  'deadline_extended',
]);

const createEventSchema = z.object({
  type: negotiationEventTypeSchema,
  payload: z.record(z.string(), z.unknown()),
  correlation_id: z.string().uuid().optional(),
  causation_id: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const queryEventsSchema = z.object({
  from_sequence: z.coerce.number().int().min(0).optional(),
  until_timestamp: z.string().datetime().optional(),
  term_id: z.string().uuid().optional(),
  event_types: z.array(negotiationEventTypeSchema).optional(),
  actor_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

interface NegotiationEventRow {
  id: string;
  deal_id: string;
  sequence: number;
  event_type: string;
  actor_id: string;
  actor_name: string;
  actor_party_type: string;
  actor_organization_id: string;
  payload: Record<string, unknown>;
  correlation_id: string | null;
  causation_id: string | null;
  metadata: Record<string, unknown> | null;
  version: number;
  created_at: string;
}

// GET /api/deals/[id]/events - Get events for a deal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dealId } = await params;
    const supabase = await createClient();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      from_sequence: searchParams.get('from_sequence') || undefined,
      until_timestamp: searchParams.get('until_timestamp') || undefined,
      term_id: searchParams.get('term_id') || undefined,
      event_types: searchParams.get('event_types')?.split(',') || undefined,
      actor_id: searchParams.get('actor_id') || undefined,
      limit: searchParams.get('limit') || '100',
      offset: searchParams.get('offset') || '0',
    };

    const parsed = queryEventsSchema.safeParse(queryParams);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: parsed.error.flatten(),
        },
      }, { status: 400 });
    }

    const { from_sequence, until_timestamp, term_id, event_types, actor_id, limit, offset } = parsed.data;

    // Build query
    let query = supabase
      .from('negotiation_events')
      .select('*', { count: 'exact' })
      .eq('deal_id', dealId)
      .order('sequence', { ascending: true });

    // Apply filters
    if (from_sequence !== undefined) {
      query = query.gte('sequence', from_sequence);
    }

    if (until_timestamp) {
      query = query.lte('created_at', until_timestamp);
    }

    if (term_id) {
      // Filter by term_id in payload using JSONB containment
      query = query.contains('payload', { term_id });
    }

    if (event_types && event_types.length > 0) {
      query = query.in('event_type', event_types);
    }

    if (actor_id) {
      query = query.eq('actor_id', actor_id);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: events, error, count } = await query;

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === '42P01') {
        return NextResponse.json<ApiResponse<NegotiationEventRow[]>>({
          success: true,
          data: [],
          meta: {
            pagination: {
              page: Math.floor(offset / limit) + 1,
              pageSize: limit,
              total: 0,
              totalPages: 0,
            },
          },
        });
      }

      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DB_ERROR',
          message: error.message,
        },
      }, { status: 500 });
    }

    // Transform events to match expected format
    const transformedEvents = (events || []).map((event: NegotiationEventRow) => ({
      id: event.id,
      type: event.event_type,
      deal_id: event.deal_id,
      sequence: event.sequence,
      timestamp: event.created_at,
      actor_id: event.actor_id,
      actor_name: event.actor_name,
      actor_party_type: event.actor_party_type,
      actor_organization_id: event.actor_organization_id,
      payload: event.payload,
      correlation_id: event.correlation_id,
      causation_id: event.causation_id,
      metadata: event.metadata,
      version: event.version,
    }));

    return NextResponse.json<ApiResponse<typeof transformedEvents>>({
      success: true,
      data: transformedEvents,
      meta: {
        pagination: {
          page: Math.floor(offset / limit) + 1,
          pageSize: limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// POST /api/deals/[id]/events - Append a new event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dealId } = await params;
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

    const body = await request.json();

    // Validate input
    const parsed = createEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request',
          details: parsed.error.flatten(),
        },
      }, { status: 400 });
    }

    interface ParticipantRow {
      deal_role: string;
      party_name: string;
      party_type: string;
    }

    // Check if user is a participant in this deal
    const { data: participant, error: participantError } = await (supabase
      .from('deal_participants') as ReturnType<typeof supabase.from>)
      .select('deal_role, party_name, party_type')
      .eq('deal_id', dealId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single() as { data: ParticipantRow | null; error: unknown };

    if (participantError || !participant) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You are not a participant in this deal',
        },
      }, { status: 403 });
    }

    // Get next sequence number
    const { data: lastEvent } = await (supabase
      .from('negotiation_events') as ReturnType<typeof supabase.from>)
      .select('sequence')
      .eq('deal_id', dealId)
      .order('sequence', { ascending: false })
      .limit(1)
      .single() as { data: { sequence: number } | null };

    const nextSequence = (lastEvent?.sequence || 0) + 1;

    interface UserDataRow {
      organization_id: string;
      full_name: string;
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, full_name')
      .eq('id', user.id)
      .single() as { data: UserDataRow | null };

    interface NegotiationEventRow {
      id: string;
      deal_id: string;
      sequence: number;
      event_type: string;
      actor_id: string;
      actor_name: string;
      actor_party_type: string;
      actor_organization_id: string;
      payload: Record<string, unknown>;
      correlation_id: string | null;
      causation_id: string | null;
      metadata: Record<string, unknown> | null;
      version: number;
      created_at: string;
    }

    // Create the event
    const { data: event, error: createError } = await (supabase
      .from('negotiation_events') as ReturnType<typeof supabase.from>)
      .insert({
        deal_id: dealId,
        sequence: nextSequence,
        event_type: parsed.data.type,
        actor_id: user.id,
        actor_name: participant.party_name || userData?.full_name || 'Unknown',
        actor_party_type: participant.party_type,
        actor_organization_id: userData?.organization_id,
        payload: parsed.data.payload,
        correlation_id: parsed.data.correlation_id,
        causation_id: parsed.data.causation_id,
        metadata: parsed.data.metadata,
        version: 1,
      })
      .select()
      .single() as { data: NegotiationEventRow | null; error: { code?: string; message: string } | null };

    if (createError) {
      // Handle concurrent write conflict
      if (createError.code === '23505') {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'Event sequence conflict. Please retry.',
          },
        }, { status: 409 });
      }

      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DB_ERROR',
          message: createError.message,
        },
      }, { status: 500 });
    }

    if (!event) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DB_ERROR',
          message: 'Failed to create event',
        },
      }, { status: 500 });
    }

    // Transform response
    const transformedEvent = {
      id: event.id,
      type: event.event_type,
      deal_id: event.deal_id,
      sequence: event.sequence,
      timestamp: event.created_at,
      actor_id: event.actor_id,
      actor_name: event.actor_name,
      actor_party_type: event.actor_party_type,
      actor_organization_id: event.actor_organization_id,
      payload: event.payload,
      correlation_id: event.correlation_id,
      causation_id: event.causation_id,
      metadata: event.metadata,
      version: event.version,
    };

    return NextResponse.json<ApiResponse<typeof transformedEvent>>({
      success: true,
      data: transformedEvent,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
