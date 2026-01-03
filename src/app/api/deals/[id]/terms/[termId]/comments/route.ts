import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCommentSchema } from '@/lib/validations';
import type { ApiResponse, TermComment, CommentWithAuthor } from '@/types';

// Type helpers for tables not in generated Supabase types
type TermCommentRow = TermComment;
type ParticipantInfo = { party_name: string; party_role: string };
type ParticipantWithRole = { deal_role: string; party_name: string };

// GET /api/deals/[id]/terms/[termId]/comments - List comments for a term
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; termId: string }> }
) {
  try {
    const { id: dealId, termId } = await params;
    const supabase = await createClient();

    // Get top-level comments
    const { data: comments, error } = await (supabase
      .from('term_comments' as 'documents')
      .select('*')
      .eq('term_id' as 'id', termId)
      .is('parent_comment_id' as 'id', null)
      .order('created_at', { ascending: true }) as unknown as Promise<{ data: TermCommentRow[] | null; error: Error | null }>);

    if (error) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DB_ERROR',
          message: error.message,
        },
      }, { status: 500 });
    }

    // Get replies and author info for each comment
    const commentsWithReplies: CommentWithAuthor[] = await Promise.all(
      (comments || []).map(async (comment: TermComment) => {
        // Get author info
        const { data: author } = await (supabase
          .from('deal_participants' as 'documents')
          .select('party_name, party_role')
          .eq('deal_id' as 'id', dealId)
          .eq('user_id' as 'id', comment.author_id)
          .single() as unknown as Promise<{ data: ParticipantInfo | null }>);

        // Get replies
        const { data: replies } = await (supabase
          .from('term_comments' as 'documents')
          .select('*')
          .eq('parent_comment_id' as 'id', comment.id)
          .order('created_at', { ascending: true }) as unknown as Promise<{ data: TermCommentRow[] | null }>);

        // Get author info for each reply
        const repliesWithAuthors = await Promise.all(
          (replies || []).map(async (reply: TermComment) => {
            const { data: replyAuthor } = await (supabase
              .from('deal_participants' as 'documents')
              .select('party_name, party_role')
              .eq('deal_id' as 'id', dealId)
              .eq('user_id' as 'id', reply.author_id)
              .single() as unknown as Promise<{ data: ParticipantInfo | null }>);

            return {
              ...reply,
              author_name: replyAuthor?.party_name || 'Unknown',
              author_role: replyAuthor?.party_role || 'Unknown',
            };
          })
        );

        return {
          ...comment,
          author_name: author?.party_name || 'Unknown',
          author_role: author?.party_role || 'Unknown',
          replies: repliesWithAuthors,
        };
      })
    );

    return NextResponse.json<ApiResponse<CommentWithAuthor[]>>({
      success: true,
      data: commentsWithReplies,
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

// POST /api/deals/[id]/terms/[termId]/comments - Create a comment
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
    const parsed = createCommentSchema.safeParse(body);
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

    // Check if user is a participant
    const { data: participant } = await (supabase
      .from('deal_participants' as 'documents')
      .select('deal_role, party_name')
      .eq('deal_id' as 'id', dealId)
      .eq('user_id' as 'id', user.id)
      .eq('status' as 'id', 'active')
      .single() as unknown as Promise<{ data: ParticipantWithRole | null }>);

    if (!participant) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You are not a participant in this deal',
        },
      }, { status: 403 });
    }

    // Check term exists
    const { data: term, error: termError } = await (supabase
      .from('negotiation_terms' as 'documents')
      .select('id')
      .eq('id', termId)
      .eq('deal_id' as 'id', dealId)
      .single() as unknown as Promise<{ data: { id: string } | null; error: Error | null }>);

    if (termError || !term) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Term not found',
        },
      }, { status: 404 });
    }

    // If replying, check parent comment exists
    if (parsed.data.parent_comment_id) {
      const { data: parentComment } = await (supabase
        .from('term_comments' as 'documents')
        .select('id')
        .eq('id', parsed.data.parent_comment_id)
        .eq('term_id' as 'id', termId)
        .single() as unknown as Promise<{ data: { id: string } | null }>);

      if (!parentComment) {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Parent comment not found',
          },
        }, { status: 404 });
      }
    }

    // Create comment - use any to bypass strict typing for tables not in schema
    const commentData = {
      term_id: termId,
      deal_id: dealId,
      author_id: user.id,
      author_party: participant.party_name,
      content: parsed.data.content,
      parent_comment_id: parsed.data.parent_comment_id || null,
      is_internal: parsed.data.is_internal || false,
      is_resolved: false,
    };

    const { data: comment, error: createError } = await (supabase
      .from('term_comments' as 'documents')
      .insert(commentData as never)
      .select()
      .single() as unknown as Promise<{ data: TermCommentRow | null; error: Error | null }>);

    if (createError || !comment) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DB_ERROR',
          message: createError?.message || 'Failed to create comment',
        },
      }, { status: 500 });
    }

    // Log activity
    const activityData = {
      deal_id: dealId,
      activity_type: 'comment_added',
      actor_id: user.id,
      actor_party: participant.party_name,
      term_id: termId,
      details: {
        comment_id: comment.id,
        is_reply: !!parsed.data.parent_comment_id,
      },
    };

    await (supabase
      .from('deal_activities' as 'documents')
      .insert(activityData as never) as unknown as Promise<unknown>);

    return NextResponse.json<ApiResponse<TermComment>>({
      success: true,
      data: comment,
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
