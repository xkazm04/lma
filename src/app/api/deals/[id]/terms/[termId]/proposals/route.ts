import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createProposalSchema } from '@/lib/validations';
import type { ApiResponse, TermProposal, ProposalWithResponses } from '@/types';
import {
  isTransitionValid,
  createDefaultContext,
  type NegotiationStatus,
} from '@/app/features/deals/lib/term-status-state-machine';

// Type helpers for tables not in generated Supabase types
type ParticipantInfo = { party_name: string; party_role: string };
type ParticipantRole = { deal_role: string; party_name: string };
type TermInfo = { is_locked: boolean; negotiation_status: string; current_value: unknown };

// GET /api/deals/[id]/terms/[termId]/proposals - List proposals for a term
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; termId: string }> }
) {
  try {
    const { id: dealId, termId } = await params;
    const supabase = await createClient();

    // Get proposals with responses
    const { data: proposals, error } = await (supabase
      .from('term_proposals' as 'documents')
      .select('*')
      .eq('term_id' as 'id', termId)
      .order('proposed_at', { ascending: false }) as unknown as Promise<{ data: TermProposal[] | null; error: Error | null }>);

    if (error) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DB_ERROR',
          message: error.message,
        },
      }, { status: 500 });
    }

    // Get participant info for each proposal
    const proposalsWithInfo: ProposalWithResponses[] = await Promise.all(
      (proposals || []).map(async (proposal: TermProposal) => {
        // Get proposer info
        const { data: proposer } = await (supabase
          .from('deal_participants' as 'documents')
          .select('party_name, party_role')
          .eq('deal_id' as 'id', dealId)
          .eq('user_id' as 'id', proposal.proposed_by)
          .single() as unknown as Promise<{ data: ParticipantInfo | null }>);

        // Get response info if responded
        let responder: ParticipantInfo | null = null;
        if (proposal.responded_by) {
          const { data: responderData } = await (supabase
            .from('deal_participants' as 'documents')
            .select('party_name, party_role')
            .eq('deal_id' as 'id', dealId)
            .eq('user_id' as 'id', proposal.responded_by)
            .single() as unknown as Promise<{ data: ParticipantInfo | null }>);
          responder = responderData;
        }

        return {
          ...proposal,
          proposer_name: proposer?.party_name || 'Unknown',
          proposer_role: proposer?.party_role || 'Unknown',
          responder_name: responder?.party_name,
          responder_role: responder?.party_role,
        } as unknown as ProposalWithResponses;
      })
    );

    return NextResponse.json<ApiResponse<ProposalWithResponses[]>>({
      success: true,
      data: proposalsWithInfo,
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

// POST /api/deals/[id]/terms/[termId]/proposals - Create a new proposal
export async function POST(
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
    const parsed = createProposalSchema.safeParse(body);
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

    // Check if user is a participant with negotiator or deal_lead role
    const { data: participant } = await (supabase
      .from('deal_participants' as 'documents')
      .select('deal_role, party_name')
      .eq('deal_id' as 'id', dealId)
      .eq('user_id' as 'id', user.id)
      .eq('status' as 'id', 'active')
      .single() as unknown as Promise<{ data: ParticipantRole | null }>);

    if (!participant || !['deal_lead', 'negotiator'].includes(participant.deal_role)) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only deal leads and negotiators can create proposals',
        },
      }, { status: 403 });
    }

    // Check if term exists and is not locked
    const { data: term, error: termError } = await (supabase
      .from('negotiation_terms' as 'documents')
      .select('is_locked, negotiation_status, current_value')
      .eq('id', termId)
      .eq('deal_id' as 'id', dealId)
      .single() as unknown as Promise<{ data: TermInfo | null; error: Error | null }>);

    if (termError || !term) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Term not found',
        },
      }, { status: 404 });
    }

    if (term.is_locked) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Cannot propose changes to a locked term',
        },
      }, { status: 403 });
    }

    if (term.negotiation_status === 'agreed') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Cannot propose changes to an agreed term',
        },
      }, { status: 403 });
    }

    // Check for existing pending proposals from this user
    const { data: existingProposal } = await (supabase
      .from('term_proposals' as 'documents')
      .select('id')
      .eq('term_id' as 'id', termId)
      .eq('proposed_by' as 'id', user.id)
      .eq('status' as 'id', 'pending')
      .single() as unknown as Promise<{ data: { id: string } | null }>);

    if (existingProposal) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'You already have a pending proposal for this term',
        },
      }, { status: 409 });
    }

    // Create proposal
    const proposalData = {
      term_id: termId,
      deal_id: dealId,
      proposed_value: parsed.data.proposed_value,
      proposed_value_text: parsed.data.proposed_value_text,
      rationale: parsed.data.rationale,
      proposed_by: user.id,
      proposed_by_party: participant.party_name,
      status: 'pending',
    };

    const { data: proposal, error: createError } = await (supabase
      .from('term_proposals' as 'documents')
      .insert(proposalData as never)
      .select()
      .single() as unknown as Promise<{ data: TermProposal | null; error: Error | null }>);

    if (createError || !proposal) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DB_ERROR',
          message: createError?.message || 'Failed to create proposal',
        },
      }, { status: 500 });
    }

    // Update term status if not already in negotiation - validate transition first
    if (term.negotiation_status === 'not_started') {
      const transitionContext = createDefaultContext({
        isDealLead: participant.deal_role === 'deal_lead',
        canApprove: false,
        hasPendingProposals: false,
        isLocked: term.is_locked,
      });

      const transitionResult = isTransitionValid(
        term.negotiation_status as NegotiationStatus,
        'proposed' as NegotiationStatus,
        transitionContext
      );

      if (transitionResult.valid) {
        await (supabase
          .from('negotiation_terms' as 'documents')
          .update({
            negotiation_status: 'proposed',
            updated_at: new Date().toISOString(),
          } as never)
          .eq('id', termId) as unknown as Promise<unknown>);
      }
    }

    // Log in term history
    await (supabase
      .from('term_history' as 'documents')
      .insert({
        term_id: termId,
        deal_id: dealId,
        change_type: 'proposal_made',
        previous_value: term.current_value,
        new_value: parsed.data.proposed_value,
        changed_by: user.id,
        changed_by_party: participant.party_name,
        metadata: { proposal_id: proposal.id, rationale: parsed.data.rationale },
      } as never) as unknown as Promise<unknown>);

    // Log activity
    await (supabase
      .from('deal_activities' as 'documents')
      .insert({
        deal_id: dealId,
        activity_type: 'proposal_made',
        actor_id: user.id,
        actor_party: participant.party_name,
        term_id: termId,
        details: {
          proposal_id: proposal.id,
          proposed_value: parsed.data.proposed_value,
        },
      } as never) as unknown as Promise<unknown>);

    return NextResponse.json<ApiResponse<TermProposal>>({
      success: true,
      data: proposal,
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
