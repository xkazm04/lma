import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { respondToProposalSchema } from '@/lib/validations';
import type { ApiResponse, TermProposal, NegotiationTerm } from '@/types';
import {
  isTransitionValid,
  createDefaultContext,
  type NegotiationStatus,
} from '@/app/features/deals/lib/term-status-state-machine';

// GET /api/deals/[id]/terms/[termId]/proposals/[proposalId] - Get proposal detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; termId: string; proposalId: string }> }
) {
  try {
    const { id: dealId, termId, proposalId } = await params;
    const supabase = await createClient();

    const { data: proposal, error } = await supabase
      .from('term_proposals')
      .select('*')
      .eq('id', proposalId)
      .eq('term_id', termId)
      .single();

    if (error) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Proposal not found',
        },
      }, { status: 404 });
    }

    // Get proposer info
    const { data: proposer } = await supabase
      .from('deal_participants')
      .select('party_name, party_role')
      .eq('deal_id', dealId)
      .eq('user_id', proposal.proposed_by)
      .single();

    // Get responder info if responded
    let responder = null;
    if (proposal.responded_by) {
      const { data: responderData } = await supabase
        .from('deal_participants')
        .select('party_name, party_role')
        .eq('deal_id', dealId)
        .eq('user_id', proposal.responded_by)
        .single();
      responder = responderData;
    }

    return NextResponse.json<ApiResponse<TermProposal & { proposer_name: string; responder_name?: string }>>({
      success: true,
      data: {
        ...proposal,
        proposer_name: proposer?.party_name || 'Unknown',
        responder_name: responder?.party_name,
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

// PUT /api/deals/[id]/terms/[termId]/proposals/[proposalId] - Respond to proposal (accept/reject/counter)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; termId: string; proposalId: string }> }
) {
  try {
    const { id: dealId, termId, proposalId } = await params;
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
    const parsed = respondToProposalSchema.safeParse(body);
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

    // Check if user is a participant with appropriate role
    const { data: participant } = await supabase
      .from('deal_participants')
      .select('deal_role, party_name, can_approve')
      .eq('deal_id', dealId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!participant) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You are not a participant in this deal',
        },
      }, { status: 403 });
    }

    // Only deal leads, negotiators, and reviewers with can_approve can respond
    const canRespond = ['deal_lead', 'negotiator'].includes(participant.deal_role) ||
      (participant.deal_role === 'reviewer' && participant.can_approve);

    if (!canRespond) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to respond to proposals',
        },
      }, { status: 403 });
    }

    // Get the proposal
    const { data: proposal, error: proposalError } = await supabase
      .from('term_proposals')
      .select('*')
      .eq('id', proposalId)
      .eq('term_id', termId)
      .single();

    if (proposalError) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Proposal not found',
        },
      }, { status: 404 });
    }

    // Check proposal is pending
    if (proposal.status !== 'pending') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'CONFLICT',
          message: `Proposal has already been ${proposal.status}`,
        },
      }, { status: 409 });
    }

    // Cannot respond to own proposal (except to withdraw)
    if (proposal.proposed_by === user.id && parsed.data.response !== 'withdrawn') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Cannot respond to your own proposal',
        },
      }, { status: 403 });
    }

    // Get current term value for history
    const { data: term } = await supabase
      .from('negotiation_terms')
      .select('current_value, negotiation_status')
      .eq('id', termId)
      .single();

    // Update proposal
    const updateData: Record<string, unknown> = {
      status: parsed.data.response,
      responded_by: user.id,
      responded_at: new Date().toISOString(),
      response_comment: parsed.data.response_comment,
    };

    if (parsed.data.response === 'countered' && parsed.data.counter_value !== undefined) {
      updateData.counter_value = parsed.data.counter_value;
      updateData.counter_value_text = parsed.data.counter_value_text;
    }

    const { data: updatedProposal, error: updateError } = await supabase
      .from('term_proposals')
      .update(updateData)
      .eq('id', proposalId)
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

    // If accepted, update the term value with state machine validation
    if (parsed.data.response === 'accepted') {
      // Validate the transition to under_discussion
      const transitionContext = createDefaultContext({
        isDealLead: participant.deal_role === 'deal_lead',
        canApprove: participant.can_approve || participant.deal_role === 'deal_lead',
        hasPendingProposals: true,
        isLocked: false,
      });

      const targetStatus = 'under_discussion' as NegotiationStatus;
      const transitionResult = isTransitionValid(
        term.negotiation_status as NegotiationStatus,
        targetStatus,
        transitionContext
      );

      // Use valid target status or stay in current status if transition is invalid
      const newStatus = transitionResult.valid ? targetStatus : term.negotiation_status;

      await supabase
        .from('negotiation_terms')
        .update({
          current_value: proposal.proposed_value,
          current_value_text: proposal.proposed_value_text,
          negotiation_status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', termId);

      // Log value change in history
      await supabase
        .from('term_history')
        .insert({
          term_id: termId,
          deal_id: dealId,
          change_type: 'value_changed',
          previous_value: term.current_value,
          new_value: proposal.proposed_value,
          previous_status: term.negotiation_status,
          new_status: newStatus,
          changed_by: user.id,
          changed_by_party: participant.party_name,
          metadata: { reason: 'proposal_accepted', proposal_id: proposalId },
        });
    }

    // Log response in history
    await supabase
      .from('term_history')
      .insert({
        term_id: termId,
        deal_id: dealId,
        change_type: `proposal_${parsed.data.response}`,
        changed_by: user.id,
        changed_by_party: participant.party_name,
        metadata: {
          proposal_id: proposalId,
          response_comment: parsed.data.response_comment,
          counter_value: parsed.data.counter_value,
        },
      });

    // Log activity
    await supabase
      .from('deal_activities')
      .insert({
        deal_id: dealId,
        activity_type: `proposal_${parsed.data.response}`,
        actor_id: user.id,
        actor_party: participant.party_name,
        term_id: termId,
        details: {
          proposal_id: proposalId,
          response: parsed.data.response,
        },
      });

    return NextResponse.json<ApiResponse<TermProposal>>({
      success: true,
      data: updatedProposal,
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

// DELETE /api/deals/[id]/terms/[termId]/proposals/[proposalId] - Withdraw proposal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; termId: string; proposalId: string }> }
) {
  try {
    const { id: dealId, termId, proposalId } = await params;
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

    // Get the proposal
    const { data: proposal, error: proposalError } = await supabase
      .from('term_proposals')
      .select('*')
      .eq('id', proposalId)
      .eq('term_id', termId)
      .single();

    if (proposalError) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Proposal not found',
        },
      }, { status: 404 });
    }

    // Can only withdraw own proposals
    if (proposal.proposed_by !== user.id) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only withdraw your own proposals',
        },
      }, { status: 403 });
    }

    // Can only withdraw pending proposals
    if (proposal.status !== 'pending') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'CONFLICT',
          message: `Cannot withdraw a ${proposal.status} proposal`,
        },
      }, { status: 409 });
    }

    // Get participant info
    const { data: participant } = await supabase
      .from('deal_participants')
      .select('party_name')
      .eq('deal_id', dealId)
      .eq('user_id', user.id)
      .single();

    // Update proposal status to withdrawn
    const { error: updateError } = await supabase
      .from('term_proposals')
      .update({
        status: 'withdrawn',
        responded_by: user.id,
        responded_at: new Date().toISOString(),
      })
      .eq('id', proposalId);

    if (updateError) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DB_ERROR',
          message: updateError.message,
        },
      }, { status: 500 });
    }

    // Log in history
    await supabase
      .from('term_history')
      .insert({
        term_id: termId,
        deal_id: dealId,
        change_type: 'proposal_withdrawn',
        changed_by: user.id,
        changed_by_party: participant?.party_name || 'Unknown',
        metadata: { proposal_id: proposalId },
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
