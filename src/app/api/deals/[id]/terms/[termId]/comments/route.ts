import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCommentSchema } from '@/lib/validations';
import type { ApiResponse, TermComment, CommentWithAuthor } from '@/types';

// GET /api/deals/[id]/terms/[termId]/comments - List comments for a term
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; termId: string }> }
) {
  try {
    const { id: dealId, termId } = await params;
    const supabase = await createClient();

    // Get top-level comments
    const { data: comments, error } = await supabase
      .from('term_comments')
      .select('*')
      .eq('term_id', termId)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: true });

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
        const { data: author } = await supabase
          .from('deal_participants')
          .select('party_name, party_role')
          .eq('deal_id', dealId)
          .eq('user_id', comment.author_id)
          .single();

        // Get replies
        const { data: replies } = await supabase
          .from('term_comments')
          .select('*')
          .eq('parent_comment_id', comment.id)
          .order('created_at', { ascending: true });

        // Get author info for each reply
        const repliesWithAuthors = await Promise.all(
          (replies || []).map(async (reply: TermComment) => {
            const { data: replyAuthor } = await supabase
              .from('deal_participants')
              .select('party_name, party_role')
              .eq('deal_id', dealId)
              .eq('user_id', reply.author_id)
              .single();

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
    const { data: participant } = await supabase
      .from('deal_participants')
      .select('deal_role, party_name')
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

    // Check term exists
    const { data: term, error: termError } = await supabase
      .from('negotiation_terms')
      .select('id')
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

    // If replying, check parent comment exists
    if (parsed.data.parent_comment_id) {
      const { data: parentComment } = await supabase
        .from('term_comments')
        .select('id')
        .eq('id', parsed.data.parent_comment_id)
        .eq('term_id', termId)
        .single();

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

    // Create comment
    const { data: comment, error: createError } = await supabase
      .from('term_comments')
      .insert({
        term_id: termId,
        deal_id: dealId,
        author_id: user.id,
        author_party: participant.party_name,
        content: parsed.data.content,
        parent_comment_id: parsed.data.parent_comment_id || null,
        is_internal: parsed.data.is_internal || false,
        is_resolved: false,
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DB_ERROR',
          message: createError.message,
        },
      }, { status: 500 });
    }

    // Log activity
    await supabase
      .from('deal_activities')
      .insert({
        deal_id: dealId,
        activity_type: 'comment_added',
        actor_id: user.id,
        actor_party: participant.party_name,
        term_id: termId,
        details: {
          comment_id: comment.id,
          is_reply: !!parsed.data.parent_comment_id,
        },
      });

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
