import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateParticipantSchema } from '@/lib/validations';
import type { ApiResponse, DealParticipant } from '@/types';

// PUT /api/deals/[id]/participants/[participantId] - Update a participant
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  try {
    const { id: dealId, participantId } = await params;
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
    const parsed = updateParticipantSchema.safeParse(body);
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
    const { data: currentParticipant } = await supabase
      .from('deal_participants')
      .select('deal_role')
      .eq('deal_id', dealId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!currentParticipant || currentParticipant.deal_role !== 'deal_lead') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only deal leads can update participants',
        },
      }, { status: 403 });
    }

    // Update participant
    const { data: participant, error: updateError } = await supabase
      .from('deal_participants')
      .update(parsed.data)
      .eq('id', participantId)
      .eq('deal_id', dealId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DB_ERROR',
          message: updateError.message,
        },
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<DealParticipant>>({
      success: true,
      data: participant,
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

// DELETE /api/deals/[id]/participants/[participantId] - Remove a participant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  try {
    const { id: dealId, participantId } = await params;
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

    // Check if the current user is a deal lead
    const { data: currentParticipant } = await supabase
      .from('deal_participants')
      .select('deal_role, party_name')
      .eq('deal_id', dealId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!currentParticipant || currentParticipant.deal_role !== 'deal_lead') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only deal leads can remove participants',
        },
      }, { status: 403 });
    }

    // Get participant info before removing
    const { data: targetParticipant } = await supabase
      .from('deal_participants')
      .select('party_name, deal_role')
      .eq('id', participantId)
      .eq('deal_id', dealId)
      .single();

    if (!targetParticipant) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Participant not found',
        },
      }, { status: 404 });
    }

    // Don't allow removing the last deal lead
    if (targetParticipant.deal_role === 'deal_lead') {
      const { count } = await supabase
        .from('deal_participants')
        .select('*', { count: 'exact', head: true })
        .eq('deal_id', dealId)
        .eq('deal_role', 'deal_lead')
        .eq('status', 'active');

      if (count <= 1) {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Cannot remove the last deal lead',
          },
        }, { status: 403 });
      }
    }

    // Soft delete - mark as removed
    const { error: updateError } = await supabase
      .from('deal_participants')
      .update({ status: 'removed' })
      .eq('id', participantId)
      .eq('deal_id', dealId);

    if (updateError) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DB_ERROR',
          message: updateError.message,
        },
      }, { status: 500 });
    }

    // Log activity
    await supabase
      .from('deal_activities')
      .insert({
        deal_id: dealId,
        activity_type: 'participant_removed',
        actor_id: user.id,
        actor_party: currentParticipant.party_name,
        details: {
          participant_id: participantId,
          party_name: targetParticipant.party_name,
        },
      });

    return NextResponse.json<ApiResponse<null>>({
      success: true,
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
