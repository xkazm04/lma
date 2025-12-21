import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { answerQuestionSchema, closeQuestionSchema } from '@/lib/validations';
import type { ApiResponse, DueDiligenceQuestionWithResponses } from '@/types';
import type { DueDiligenceQuestion } from '@/types/database';

// GET /api/trading/trades/[id]/questions/[qid] - Get question details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; qid: string }> }
) {
  try {
    const { id: tradeId, qid: questionId } = await params;
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

    // Get question with checklist verification
    const { data: question, error: questionError } = await supabase
      .from('due_diligence_questions')
      .select(`
        *,
        due_diligence_checklists!inner (
          trade_id
        )
      `)
      .eq('id', questionId)
      .single();

    if (questionError || !question || question.due_diligence_checklists.trade_id !== tradeId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Question not found',
        },
      }, { status: 404 });
    }

    // Get user names
    const userIds = [question.asker_id, question.responder_id].filter(Boolean);
    const { data: users } = await supabase
      .from('users')
      .select('id, display_name, email')
      .in('id', userIds);

    const usersMap = (users || []).reduce(
      (acc: Record<string, string>, u: { id: string; display_name: string | null; email: string }) => {
        acc[u.id] = u.display_name || u.email;
        return acc;
      },
      {}
    );

    // Get related item if any
    let relatedItem: { item_name: string; category: string } | undefined;
    if (question.checklist_item_id) {
      const { data: item } = await supabase
        .from('due_diligence_items')
        .select('item_name, category')
        .eq('id', question.checklist_item_id)
        .single();
      relatedItem = item;
    }

    const questionWithDetails: DueDiligenceQuestionWithResponses = {
      id: question.id,
      checklist_id: question.checklist_id,
      checklist_item_id: question.checklist_item_id,
      asker_party: question.asker_party,
      asker_id: question.asker_id,
      question_text: question.question_text,
      question_attachments: question.question_attachments,
      status: question.status,
      responder_id: question.responder_id,
      response_text: question.response_text,
      response_attachments: question.response_attachments,
      responded_at: question.responded_at,
      closed_at: question.closed_at,
      created_at: question.created_at,
      updated_at: question.updated_at,
      asker_name: usersMap[question.asker_id],
      responder_name: question.responder_id ? usersMap[question.responder_id] : undefined,
      related_item: relatedItem,
    };

    return NextResponse.json<ApiResponse<DueDiligenceQuestionWithResponses>>({
      success: true,
      data: questionWithDetails,
    });
  } catch (error) {
    console.error('Error in GET /api/trading/trades/[id]/questions/[qid]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// PUT /api/trading/trades/[id]/questions/[qid] - Answer question
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; qid: string }> }
) {
  try {
    const { id: tradeId, qid: questionId } = await params;
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
      .select('id, trade_reference, seller_organization_id, buyer_organization_id')
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

    // Get question
    const { data: existingQuestion } = await supabase
      .from('due_diligence_questions')
      .select(`
        *,
        due_diligence_checklists!inner (
          trade_id
        )
      `)
      .eq('id', questionId)
      .single();

    if (!existingQuestion || existingQuestion.due_diligence_checklists.trade_id !== tradeId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Question not found',
        },
      }, { status: 404 });
    }

    // Verify responder is opposite party
    const isBuyer = trade.buyer_organization_id === userData.organization_id;
    const askerWasBuyer = existingQuestion.asker_party === 'buyer';

    if ((isBuyer && askerWasBuyer) || (!isBuyer && !askerWasBuyer)) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only the counterparty can answer this question',
        },
      }, { status: 403 });
    }

    // Question must be open
    if (existingQuestion.status !== 'open') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Question is already answered or closed',
        },
      }, { status: 400 });
    }

    const body = await request.json();
    const parsed = answerQuestionSchema.safeParse(body);

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

    // Update question
    const now = new Date().toISOString();
    const { data: question, error: updateError } = await supabase
      .from('due_diligence_questions')
      .update({
        status: 'answered',
        responder_id: user.id,
        response_text: parsed.data.response_text,
        response_attachments: parsed.data.response_attachments,
        responded_at: now,
        updated_at: now,
      })
      .eq('id', questionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error answering question:', updateError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to answer question',
        },
      }, { status: 500 });
    }

    // Log trade event
    await supabase.from('trade_events').insert({
      trade_id: tradeId,
      event_type: 'question_answered',
      event_data: {
        question_id: questionId,
        responder_party: isBuyer ? 'buyer' : 'seller',
      },
      actor_id: user.id,
    });

    // Log activity
    const activityBase = {
      source_module: 'trading',
      activity_type: 'question_answered',
      actor_id: user.id,
      entity_type: 'due_diligence_question',
      entity_id: questionId,
      entity_name: `Question for ${trade.trade_reference}`,
      description: `Question answered for trade ${trade.trade_reference}`,
    };

    await supabase.from('activities').insert([
      { ...activityBase, organization_id: trade.seller_organization_id },
      { ...activityBase, organization_id: trade.buyer_organization_id },
    ]);

    return NextResponse.json<ApiResponse<DueDiligenceQuestion>>({
      success: true,
      data: question,
    });
  } catch (error) {
    console.error('Error in PUT /api/trading/trades/[id]/questions/[qid]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// DELETE /api/trading/trades/[id]/questions/[qid] - Close question
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; qid: string }> }
) {
  try {
    const { id: tradeId, qid: questionId } = await params;
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
      .select('id, seller_organization_id, buyer_organization_id')
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

    // Get question
    const { data: existingQuestion } = await supabase
      .from('due_diligence_questions')
      .select(`
        *,
        due_diligence_checklists!inner (
          trade_id
        )
      `)
      .eq('id', questionId)
      .single();

    if (!existingQuestion || existingQuestion.due_diligence_checklists.trade_id !== tradeId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Question not found',
        },
      }, { status: 404 });
    }

    // Only original asker can close the question
    if (existingQuestion.asker_id !== user.id) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only the original asker can close this question',
        },
      }, { status: 403 });
    }

    // Update question
    const now = new Date().toISOString();
    const { data: question, error: updateError } = await supabase
      .from('due_diligence_questions')
      .update({
        status: 'closed',
        closed_at: now,
        updated_at: now,
      })
      .eq('id', questionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error closing question:', updateError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to close question',
        },
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<DueDiligenceQuestion>>({
      success: true,
      data: question,
    });
  } catch (error) {
    console.error('Error in DELETE /api/trading/trades/[id]/questions/[qid]:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
