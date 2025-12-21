import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { inviteParticipantSchema } from '@/lib/validations';
import type { ApiResponse, DealParticipant, ParticipantWithUser } from '@/types';

// GET /api/deals/[id]/participants - List all participants
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: participants, error } = await supabase
      .from('deal_participants')
      .select('*')
      .eq('deal_id', id)
      .neq('status', 'removed')
      .order('invited_at', { ascending: true });

    if (error) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DB_ERROR',
          message: error.message,
        },
      }, { status: 500 });
    }

    // Group by party type
    const grouped = {
      borrower_side: participants?.filter((p: DealParticipant) => p.party_type === 'borrower_side') || [],
      lender_side: participants?.filter((p: DealParticipant) => p.party_type === 'lender_side') || [],
      third_party: participants?.filter((p: DealParticipant) => p.party_type === 'third_party') || [],
    };

    return NextResponse.json<ApiResponse<{ participants: ParticipantWithUser[]; grouped: typeof grouped }>>({
      success: true,
      data: {
        participants: participants || [],
        grouped,
      },
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// POST /api/deals/[id]/participants - Invite a participant
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
    const parsed = inviteParticipantSchema.safeParse(body);
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

    // Check if the current user is a deal lead
    interface ParticipantRoleData {
      deal_role: string;
    }
    const { data: currentParticipant } = await (supabase
      .from('deal_participants') as ReturnType<typeof supabase.from>)
      .select('deal_role')
      .eq('deal_id', dealId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single() as { data: ParticipantRoleData | null };

    if (!currentParticipant || currentParticipant.deal_role !== 'deal_lead') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only deal leads can invite participants',
        },
      }, { status: 403 });
    }

    // Resolve user_id if email is provided
    let userId = parsed.data.user_id;
    if (!userId && parsed.data.email) {
      // In a real app, you would look up the user by email or send an invitation
      // For now, we'll create a placeholder
      userId = `pending-${parsed.data.email}`;
    }

    // Check if participant already exists
    interface ExistingParticipantData {
      id: string;
      status: string;
    }
    const { data: existingParticipant } = await (supabase
      .from('deal_participants') as ReturnType<typeof supabase.from>)
      .select('id, status')
      .eq('deal_id', dealId)
      .eq('user_id', userId)
      .single() as { data: ExistingParticipantData | null };

    if (existingParticipant) {
      if (existingParticipant.status === 'removed') {
        // Re-invite removed participant
        const { data: participant, error: updateError } = await (supabase
          .from('deal_participants') as ReturnType<typeof supabase.from>)
          .update({
            ...parsed.data,
            status: 'pending',
            invited_at: new Date().toISOString(),
            joined_at: null,
          })
          .eq('id', existingParticipant.id)
          .select()
          .single() as { data: DealParticipant | null; error: unknown };

        if (updateError || !participant) {
          return NextResponse.json<ApiResponse<null>>({
            success: false,
            error: {
              code: 'DB_ERROR',
              message: updateError && typeof updateError === 'object' && 'message' in updateError ? String(updateError.message) : 'Unknown error',
            },
          }, { status: 500 });
        }

        return NextResponse.json<ApiResponse<DealParticipant>>({
          success: true,
          data: participant,
        }, { status: 201 });
      }

      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Participant already exists in this deal',
        },
      }, { status: 409 });
    }

    // Create new participant
    const { data: participant, error: createError } = await (supabase
      .from('deal_participants') as ReturnType<typeof supabase.from>)
      .insert({
        deal_id: dealId,
        user_id: userId,
        party_name: parsed.data.party_name,
        party_type: parsed.data.party_type,
        party_role: parsed.data.party_role,
        deal_role: parsed.data.deal_role,
        can_approve: parsed.data.can_approve,
        status: 'pending',
      })
      .select()
      .single() as { data: DealParticipant | null; error: unknown };

    if (createError || !participant) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DB_ERROR',
          message: createError && typeof createError === 'object' && 'message' in createError ? String(createError.message) : 'Unknown error',
        },
      }, { status: 500 });
    }

    // Get inviter's party name for activity log
    interface InviterData {
      party_name: string;
    }
    const { data: inviterInfo } = await (supabase
      .from('deal_participants') as ReturnType<typeof supabase.from>)
      .select('party_name')
      .eq('deal_id', dealId)
      .eq('user_id', user.id)
      .single() as { data: InviterData | null };

    // Log activity
    await (supabase
      .from('deal_activities') as ReturnType<typeof supabase.from>)
      .insert({
        deal_id: dealId,
        activity_type: 'participant_joined', // Using for invite as well
        actor_id: user.id,
        actor_party: inviterInfo?.party_name || 'Unknown',
        details: {
          action: 'invited',
          participant_id: participant.id,
          party_name: parsed.data.party_name,
          party_role: parsed.data.party_role,
        },
      });

    return NextResponse.json<ApiResponse<DealParticipant>>({
      success: true,
      data: participant,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
