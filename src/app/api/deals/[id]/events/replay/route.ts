import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { ApiResponse } from '@/types';

/**
 * Event Replay API
 *
 * Provides state projection at any point in time by replaying events.
 * This enables time-travel debugging and historical state reconstruction.
 */

// Validation schemas
const replayQuerySchema = z.object({
  until_sequence: z.coerce.number().int().min(0).optional(),
  until_timestamp: z.string().datetime().optional(),
  term_ids: z.array(z.string().uuid()).optional(),
  include_stats: z.coerce.boolean().default(true),
});

interface ProjectedState {
  deal: {
    id: string;
    deal_name: string;
    status: string;
    negotiation_mode: string;
    updated_at: string;
  };
  terms: Map<string, {
    id: string;
    term_label: string;
    current_value: unknown;
    current_value_text: string | null;
    negotiation_status: string;
    is_locked: boolean;
    pending_proposals_count: number;
    comments_count: number;
  }>;
  participants: Map<string, {
    id: string;
    party_name: string;
    party_type: string;
    deal_role: string;
    status: string;
  }>;
  stats?: {
    total_terms: number;
    agreed_terms: number;
    locked_terms: number;
    pending_proposals: number;
    active_participants: number;
    total_events: number;
    replayed_to_sequence: number;
  };
}

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
  created_at: string;
}

// POST /api/deals/[id]/events/replay - Replay events to get projected state
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dealId } = await params;
    const supabase = await createClient();

    const body = await request.json();

    // Validate input
    const parsed = replayQuerySchema.safeParse(body);
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

    const { until_sequence, until_timestamp, term_ids, include_stats } = parsed.data;

    // Build query for events
    let query = (supabase
      .from('negotiation_events') as ReturnType<typeof supabase.from>)
      .select('*')
      .eq('deal_id', dealId)
      .order('sequence', { ascending: true });

    // Apply filters
    if (until_sequence !== undefined) {
      query = query.lte('sequence', until_sequence);
    }

    if (until_timestamp) {
      query = query.lte('created_at', until_timestamp);
    }

    const { data: events, error } = await query as { data: NegotiationEventRow[] | null; error: { code?: string; message: string } | null };

    if (error) {
      // If table doesn't exist, return empty state
      if (error.code === '42P01') {
        return NextResponse.json<ApiResponse<ProjectedState>>({
          success: true,
          data: createEmptyState(dealId),
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

    // Project state from events
    const state = projectState(dealId, events || [], term_ids);

    // Add stats if requested
    if (include_stats) {
      state.stats = {
        total_terms: state.terms.size,
        agreed_terms: Array.from(state.terms.values()).filter(
          (t) => t.negotiation_status === 'agreed' || t.is_locked
        ).length,
        locked_terms: Array.from(state.terms.values()).filter((t) => t.is_locked).length,
        pending_proposals: Array.from(state.terms.values()).reduce(
          (sum, t) => sum + t.pending_proposals_count,
          0
        ),
        active_participants: Array.from(state.participants.values()).filter(
          (p) => p.status === 'active'
        ).length,
        total_events: events?.length || 0,
        replayed_to_sequence: events && events.length > 0 ? events[events.length - 1].sequence : 0,
      };
    }

    // Convert Maps to plain objects for JSON serialization
    const serializedState = {
      deal: state.deal,
      terms: Object.fromEntries(state.terms),
      participants: Object.fromEntries(state.participants),
      stats: state.stats,
    };

    return NextResponse.json<ApiResponse<typeof serializedState>>({
      success: true,
      data: serializedState,
    });
  } catch (error) {
    console.error('Error replaying events:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

function createEmptyState(dealId: string): ProjectedState {
  return {
    deal: {
      id: dealId,
      deal_name: '',
      status: 'draft',
      negotiation_mode: 'proposal_based',
      updated_at: new Date().toISOString(),
    },
    terms: new Map(),
    participants: new Map(),
  };
}

function projectState(
  dealId: string,
  events: NegotiationEventRow[],
  termFilter?: string[]
): ProjectedState {
  const state = createEmptyState(dealId);
  const termFilterSet = termFilter ? new Set(termFilter) : null;

  for (const event of events) {
    // Update deal state
    state.deal.updated_at = event.created_at;

    switch (event.event_type) {
      case 'deal_created': {
        const payload = event.payload as {
          deal_name?: string;
          negotiation_mode?: string;
        };
        state.deal.deal_name = payload.deal_name || '';
        state.deal.negotiation_mode = payload.negotiation_mode || 'proposal_based';
        break;
      }

      case 'deal_status_changed': {
        const payload = event.payload as { new_status?: string };
        state.deal.status = payload.new_status || state.deal.status;
        break;
      }

      case 'term_created': {
        const payload = event.payload as {
          term_id?: string;
          term_label?: string;
          initial_value?: unknown;
          initial_value_text?: string;
        };
        if (payload.term_id) {
          // Skip if filtering and term not in filter
          if (termFilterSet && !termFilterSet.has(payload.term_id)) break;

          state.terms.set(payload.term_id, {
            id: payload.term_id,
            term_label: payload.term_label || '',
            current_value: payload.initial_value,
            current_value_text: payload.initial_value_text || null,
            negotiation_status: 'not_started',
            is_locked: false,
            pending_proposals_count: 0,
            comments_count: 0,
          });
        }
        break;
      }

      case 'term_status_changed': {
        const payload = event.payload as { term_id?: string; new_status?: string };
        if (payload.term_id) {
          const term = state.terms.get(payload.term_id);
          if (term) {
            term.negotiation_status = payload.new_status || term.negotiation_status;
          }
        }
        break;
      }

      case 'term_locked': {
        const payload = event.payload as {
          term_id?: string;
          final_value?: unknown;
          final_value_text?: string;
        };
        if (payload.term_id) {
          const term = state.terms.get(payload.term_id);
          if (term) {
            term.is_locked = true;
            term.negotiation_status = 'locked';
            term.current_value = payload.final_value ?? term.current_value;
            term.current_value_text = payload.final_value_text ?? term.current_value_text;
          }
        }
        break;
      }

      case 'term_unlocked': {
        const payload = event.payload as { term_id?: string };
        if (payload.term_id) {
          const term = state.terms.get(payload.term_id);
          if (term) {
            term.is_locked = false;
            term.negotiation_status = 'agreed';
          }
        }
        break;
      }

      case 'proposal_made': {
        const payload = event.payload as { term_id?: string };
        if (payload.term_id) {
          const term = state.terms.get(payload.term_id);
          if (term) {
            term.pending_proposals_count++;
          }
        }
        break;
      }

      case 'proposal_accepted': {
        const payload = event.payload as {
          term_id?: string;
          accepted_value?: unknown;
          accepted_value_text?: string;
        };
        if (payload.term_id) {
          const term = state.terms.get(payload.term_id);
          if (term) {
            term.current_value = payload.accepted_value ?? term.current_value;
            term.current_value_text = payload.accepted_value_text ?? term.current_value_text;
            term.negotiation_status = 'agreed';
            term.pending_proposals_count = Math.max(0, term.pending_proposals_count - 1);
          }
        }
        break;
      }

      case 'proposal_rejected':
      case 'proposal_withdrawn': {
        const payload = event.payload as { term_id?: string };
        if (payload.term_id) {
          const term = state.terms.get(payload.term_id);
          if (term) {
            term.pending_proposals_count = Math.max(0, term.pending_proposals_count - 1);
          }
        }
        break;
      }

      case 'comment_added': {
        const payload = event.payload as { term_id?: string };
        if (payload.term_id) {
          const term = state.terms.get(payload.term_id);
          if (term) {
            term.comments_count++;
          }
        }
        break;
      }

      case 'comment_deleted': {
        const payload = event.payload as { term_id?: string };
        if (payload.term_id) {
          const term = state.terms.get(payload.term_id);
          if (term) {
            term.comments_count = Math.max(0, term.comments_count - 1);
          }
        }
        break;
      }

      case 'participant_joined': {
        const payload = event.payload as {
          participant_id?: string;
          party_name?: string;
          party_type?: string;
          deal_role?: string;
        };
        if (payload.participant_id) {
          state.participants.set(payload.participant_id, {
            id: payload.participant_id,
            party_name: payload.party_name || '',
            party_type: payload.party_type || 'third_party',
            deal_role: payload.deal_role || 'observer',
            status: 'active',
          });
        }
        break;
      }

      case 'participant_left': {
        const payload = event.payload as { participant_id?: string };
        if (payload.participant_id) {
          const participant = state.participants.get(payload.participant_id);
          if (participant) {
            participant.status = 'inactive';
          }
        }
        break;
      }

      case 'participant_role_changed': {
        const payload = event.payload as {
          participant_id?: string;
          new_deal_role?: string;
        };
        if (payload.participant_id) {
          const participant = state.participants.get(payload.participant_id);
          if (participant) {
            participant.deal_role = payload.new_deal_role || participant.deal_role;
          }
        }
        break;
      }

      default:
        // Unknown event type, skip
        break;
    }
  }

  return state;
}
