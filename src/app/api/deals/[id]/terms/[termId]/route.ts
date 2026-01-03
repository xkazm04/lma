// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateTermSchema, lockTermSchema } from '@/lib/validations';
import type { ApiResponse, NegotiationTerm, TermProposal, TermComment, TermHistory } from '@/types';
import {
  isTransitionValid,
  createDefaultContext,
  type NegotiationStatus,
  type TransitionContext,
} from '@/app/features/deals/lib/term-status-state-machine';

// GET /api/deals/[id]/terms/[termId] - Get term detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; termId: string }> }
) {
  try {
    const { id: dealId, termId } = await params;
    const supabase = await createClient();

    // Get the term
    const { data: term, error: termError } = await supabase
      .from('negotiation_terms')
      .select('*')
      .eq('id', termId)
      .eq('deal_id', dealId)
      .single();

    if (termError) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Term not found',
        },
      }, { status: 404 });
    }

    // Get proposals
    const { data: proposals } = await supabase
      .from('term_proposals')
      .select('*')
      .eq('term_id', termId)
      .order('proposed_at', { ascending: false });

    // Get comments
    const { data: comments } = await supabase
      .from('term_comments')
      .select('*')
      .eq('term_id', termId)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: true });

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      (comments || []).map(async (comment: TermComment) => {
        const { data: replies } = await supabase
          .from('term_comments')
          .select('*')
          .eq('parent_comment_id', comment.id)
          .order('created_at', { ascending: true });
        return { ...comment, replies: replies || [] };
      })
    );

    // Get history
    const { data: history } = await supabase
      .from('term_history')
      .select('*')
      .eq('term_id', termId)
      .order('changed_at', { ascending: false })
      .limit(20);

    // Get source clause info if linked
    let sourceClause = null;
    if (term.source_facility_id && term.source_clause_reference) {
      // In a real app, this would fetch the actual clause text from the document
      sourceClause = {
        reference: term.source_clause_reference,
        facilityId: term.source_facility_id,
      };
    }

    return NextResponse.json<ApiResponse<{
      term: NegotiationTerm;
      proposals: TermProposal[];
      comments: TermComment[];
      history: TermHistory[];
      sourceClause: typeof sourceClause;
    }>>({
      success: true,
      data: {
        term,
        proposals: proposals || [],
        comments: commentsWithReplies,
        history: history || [],
        sourceClause,
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

// PUT /api/deals/[id]/terms/[termId] - Update term (deal lead only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; termId: string }> }
) {
  try {
    const { id: dealId, termId } = await params;
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
    const parsed = updateTermSchema.safeParse(body);
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

    // Check if user is a deal lead
    const { data: participant } = await supabase
      .from('deal_participants')
      .select('deal_role, party_name')
      .eq('deal_id', dealId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!participant || participant.deal_role !== 'deal_lead') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only deal leads can directly update terms',
        },
      }, { status: 403 });
    }

    // Get current term
    const { data: currentTerm, error: fetchError } = await supabase
      .from('negotiation_terms')
      .select('*')
      .eq('id', termId)
      .eq('deal_id', dealId)
      .single();

    if (fetchError) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Term not found',
        },
      }, { status: 404 });
    }

    // Check if term is locked
    if (currentTerm.is_locked) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Term is locked and cannot be modified',
        },
      }, { status: 403 });
    }

    // Validate status transition if negotiation_status is being changed
    if (parsed.data.negotiation_status && parsed.data.negotiation_status !== currentTerm.negotiation_status) {
      // Get deal info for context
      const { data: deal } = await supabase
        .from('deals')
        .select('negotiation_mode, require_unanimous_consent')
        .eq('id', dealId)
        .single();

      // Count pending proposals for context
      const { count: pendingProposalsCount } = await supabase
        .from('term_proposals')
        .select('*', { count: 'exact', head: true })
        .eq('term_id', termId)
        .eq('status', 'pending');

      // Build transition context
      const transitionContext: TransitionContext = createDefaultContext({
        isDealLead: participant.deal_role === 'deal_lead',
        canApprove: participant.can_approve || participant.deal_role === 'deal_lead',
        hasPendingProposals: (pendingProposalsCount || 0) > 0,
        allPartiesApproved: false, // Would need to check proposal responses
        isLocked: currentTerm.is_locked,
        negotiationMode: deal?.negotiation_mode === 'collaborative' ? 'collaborative' : 'proposal_based',
        requireUnanimousConsent: deal?.require_unanimous_consent || false,
      });

      // Validate the transition
      const transitionResult = isTransitionValid(
        currentTerm.negotiation_status as NegotiationStatus,
        parsed.data.negotiation_status as NegotiationStatus,
        transitionContext
      );

      if (!transitionResult.valid) {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: {
            code: 'INVALID_STATUS_TRANSITION',
            message: transitionResult.reason || 'Invalid status transition',
            details: {
              currentStatus: currentTerm.negotiation_status,
              targetStatus: parsed.data.negotiation_status,
            },
          },
        }, { status: 400 });
      }
    }

    // Update term
    const { data: term, error: updateError } = await supabase
      .from('negotiation_terms')
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', termId)
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

    // Log change in history
    const changeType = parsed.data.current_value !== undefined
      ? 'value_changed'
      : parsed.data.negotiation_status !== undefined
        ? 'status_changed'
        : 'value_changed';

    await supabase
      .from('term_history')
      .insert({
        term_id: termId,
        deal_id: dealId,
        change_type: changeType,
        previous_value: currentTerm.current_value,
        new_value: parsed.data.current_value ?? currentTerm.current_value,
        previous_status: currentTerm.negotiation_status,
        new_status: parsed.data.negotiation_status ?? currentTerm.negotiation_status,
        changed_by: user.id,
        changed_by_party: participant.party_name,
      });

    return NextResponse.json<ApiResponse<NegotiationTerm>>({
      success: true,
      data: term,
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

// DELETE /api/deals/[id]/terms/[termId] - Remove term
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; termId: string }> }
) {
  try {
    const { id: dealId, termId } = await params;
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

    // Check if user is a deal lead
    const { data: participant } = await supabase
      .from('deal_participants')
      .select('deal_role')
      .eq('deal_id', dealId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!participant || participant.deal_role !== 'deal_lead') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only deal leads can remove terms',
        },
      }, { status: 403 });
    }

    // Check if term exists and is not locked
    const { data: term, error: fetchError } = await supabase
      .from('negotiation_terms')
      .select('is_locked, negotiation_status')
      .eq('id', termId)
      .eq('deal_id', dealId)
      .single();

    if (fetchError) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Term not found',
        },
      }, { status: 404 });
    }

    if (term.is_locked || term.negotiation_status === 'agreed') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Cannot delete locked or agreed terms',
        },
      }, { status: 403 });
    }

    // Delete related data
    await Promise.all([
      supabase.from('term_comments').delete().eq('term_id', termId),
      supabase.from('term_proposals').delete().eq('term_id', termId),
      supabase.from('term_history').delete().eq('term_id', termId),
    ]);

    // Delete the term
    const { error: deleteError } = await supabase
      .from('negotiation_terms')
      .delete()
      .eq('id', termId);

    if (deleteError) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DB_ERROR',
          message: deleteError.message,
        },
      }, { status: 500 });
    }

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
