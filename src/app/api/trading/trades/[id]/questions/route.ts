import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createQuestionSchema } from '@/lib/validations';
import type { ApiResponse, DueDiligenceQuestionWithResponses } from '@/types';
import type { DueDiligenceQuestion } from '@/types/database';

// GET /api/trading/trades/[id]/questions - List all questions for trade
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

    // Get checklist
    const { data: checklist } = await supabase
      .from('due_diligence_checklists')
      .select('id')
      .eq('trade_id', tradeId)
      .single();

    if (!checklist) {
      return NextResponse.json<ApiResponse<DueDiligenceQuestionWithResponses[]>>({
        success: true,
        data: [],
      });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const itemId = searchParams.get('item_id');

    // Get questions
    let query = supabase
      .from('due_diligence_questions')
      .select('*')
      .eq('checklist_id', checklist.id)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (itemId) {
      query = query.eq('checklist_item_id', itemId);
    }

    const { data: questions, error: questionsError } = await query;

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch questions',
        },
      }, { status: 500 });
    }

    // Get user names
    const userIds = [...new Set((questions || []).flatMap((q: DueDiligenceQuestion) =>
      [q.asked_by, q.responded_by].filter(Boolean)
    ))];

    let usersMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, display_name, email')
        .in('id', userIds);

      usersMap = (users || []).reduce(
        (acc: Record<string, string>, u: { id: string; display_name: string | null; email: string }) => {
          acc[u.id] = u.display_name || u.email;
          return acc;
        },
        {}
      );
    }

    // Get related items
    const itemIds = [...new Set((questions || [])
      .filter((q: DueDiligenceQuestion) => q.checklist_item_id)
      .map((q: DueDiligenceQuestion) => q.checklist_item_id))];

    let itemsMap: Record<string, { item_name: string; category: string }> = {};
    if (itemIds.length > 0) {
      const { data: items } = await supabase
        .from('due_diligence_items')
        .select('id, item_name, category')
        .in('id', itemIds);

      itemsMap = (items || []).reduce(
        (acc: Record<string, { item_name: string; category: string }>, i: { id: string; item_name: string; category: string }) => {
          acc[i.id] = { item_name: i.item_name, category: i.category };
          return acc;
        },
        {}
      );
    }

    // Build response
    const questionsWithDetails: DueDiligenceQuestionWithResponses[] = (questions || []).map(
      (q: DueDiligenceQuestion) => ({
        ...q,
        asker_name: usersMap[q.asked_by],
        responder_name: q.responded_by ? usersMap[q.responded_by] : undefined,
        related_item: q.checklist_item_id ? itemsMap[q.checklist_item_id] : undefined,
      })
    );

    return NextResponse.json<ApiResponse<DueDiligenceQuestionWithResponses[]>>({
      success: true,
      data: questionsWithDetails,
    });
  } catch (error) {
    console.error('Error in GET /api/trading/trades/[id]/questions:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// POST /api/trading/trades/[id]/questions - Create a new question
export async function POST(
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
      .select('id, status, trade_reference, seller_organization_id, buyer_organization_id')
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

    // Trade must be in DD phase
    if (!['agreed', 'in_due_diligence'].includes(trade.status)) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Questions can only be asked during due diligence',
        },
      }, { status: 400 });
    }

    // Get checklist
    const { data: checklist } = await supabase
      .from('due_diligence_checklists')
      .select('id')
      .eq('trade_id', tradeId)
      .single();

    if (!checklist) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Checklist not found',
        },
      }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createQuestionSchema.safeParse(body);

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

    // Determine asker party
    const isBuyer = trade.buyer_organization_id === userData.organization_id;
    const askerParty = isBuyer ? 'buyer' : 'seller';

    // Create question
    const { data: question, error: createError } = await supabase
      .from('due_diligence_questions')
      .insert({
        checklist_id: checklist.id,
        checklist_item_id: parsed.data.checklist_item_id,
        asker_party: askerParty,
        asker_id: user.id,
        question_text: parsed.data.question_text,
        question_attachments: parsed.data.question_attachments,
        status: 'open',
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating question:', createError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create question',
        },
      }, { status: 500 });
    }

    // Log trade event
    await supabase.from('trade_events').insert({
      trade_id: tradeId,
      event_type: 'question_asked',
      event_data: {
        question_id: question.id,
        question: parsed.data.question_text.substring(0, 200),
        asker_party: askerParty,
      },
      actor_id: user.id,
    });

    // Log activity for both parties
    const activityBase = {
      source_module: 'trading',
      activity_type: 'question_asked',
      actor_id: user.id,
      entity_type: 'due_diligence_question',
      entity_id: question.id,
      entity_name: `Question for ${trade.trade_reference}`,
      description: `New question from ${askerParty}: ${parsed.data.question_text.substring(0, 100)}...`,
    };

    await supabase.from('activities').insert([
      { ...activityBase, organization_id: trade.seller_organization_id },
      { ...activityBase, organization_id: trade.buyer_organization_id },
    ]);

    return NextResponse.json<ApiResponse<DueDiligenceQuestion>>({
      success: true,
      data: question,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/trading/trades/[id]/questions:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
