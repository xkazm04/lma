import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateCommentSchema } from '@/lib/validations';
import type { ApiResponse, TermComment } from '@/types';

// Type for comment query data
interface CommentQuery {
  author_id: string;
}

// Type for participant query data
interface ParticipantQuery {
  deal_role: string;
  party_name?: string;
}

// PUT /api/deals/[id]/terms/[termId]/comments/[commentId] - Update a comment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; termId: string; commentId: string }> }
) {
  try {
    const { id: dealId, termId, commentId } = await params;
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
    const parsed = updateCommentSchema.safeParse(body);
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

    // Get the comment
    const { data: comment, error: commentError } = await supabase
      .from('term_comments')
      .select('author_id')
      .eq('id', commentId)
      .eq('term_id', termId)
      .single() as { data: CommentQuery | null; error: Error | null };

    if (commentError || !comment) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Comment not found',
        },
      }, { status: 404 });
    }

    // Get participant info
    const { data: participant } = await supabase
      .from('deal_participants')
      .select('deal_role, party_name')
      .eq('deal_id', dealId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single() as { data: ParticipantQuery | null };

    if (!participant) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You are not a participant in this deal',
        },
      }, { status: 403 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Content can only be updated by author
    if (parsed.data.content !== undefined) {
      if (comment.author_id !== user.id) {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only edit your own comments',
          },
        }, { status: 403 });
      }
      updateData.content = parsed.data.content;
    }

    // is_resolved can be updated by any participant
    if (parsed.data.is_resolved !== undefined) {
      updateData.is_resolved = parsed.data.is_resolved;
      if (parsed.data.is_resolved) {
        updateData.resolved_by = user.id;
        updateData.resolved_at = new Date().toISOString();
      } else {
        updateData.resolved_by = null;
        updateData.resolved_at = null;
      }
    }

    // Update comment
    const { data: updatedComment, error: updateError } = await (supabase
      .from('term_comments') as ReturnType<typeof supabase.from>)
      .update(updateData)
      .eq('id', commentId)
      .select()
      .single() as unknown as { data: TermComment | null; error: Error | null };

    if (updateError || !updatedComment) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: updateError ? 'DB_ERROR' : 'NOT_FOUND',
          message: updateError?.message ?? 'Comment not found',
        },
      }, { status: updateError ? 500 : 404 });
    }

    // Log activity if resolved
    if (parsed.data.is_resolved !== undefined) {
      await (supabase
        .from('deal_activities') as ReturnType<typeof supabase.from>)
        .insert({
          deal_id: dealId,
          activity_type: parsed.data.is_resolved ? 'comment_resolved' : 'comment_reopened',
          actor_id: user.id,
          actor_party: participant.party_name,
          term_id: termId,
          details: {
            comment_id: commentId,
          },
        });
    }

    return NextResponse.json<ApiResponse<TermComment>>({
      success: true,
      data: updatedComment,
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

// DELETE /api/deals/[id]/terms/[termId]/comments/[commentId] - Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; termId: string; commentId: string }> }
) {
  try {
    const { id: dealId, termId, commentId } = await params;
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

    // Get the comment
    const { data: comment, error: commentError } = await supabase
      .from('term_comments')
      .select('author_id')
      .eq('id', commentId)
      .eq('term_id', termId)
      .single() as { data: CommentQuery | null; error: Error | null };

    if (commentError || !comment) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Comment not found',
        },
      }, { status: 404 });
    }

    // Get participant info
    const { data: participant } = await supabase
      .from('deal_participants')
      .select('deal_role, party_name')
      .eq('deal_id', dealId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single() as { data: ParticipantQuery | null };

    if (!participant) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You are not a participant in this deal',
        },
      }, { status: 403 });
    }

    // Can only delete own comments or if deal_lead
    if (comment.author_id !== user.id && participant.deal_role !== 'deal_lead') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only delete your own comments',
        },
      }, { status: 403 });
    }

    // Delete replies first
    await (supabase
      .from('term_comments') as ReturnType<typeof supabase.from>)
      .delete()
      .eq('parent_comment_id', commentId);

    // Delete the comment
    const { error: deleteError } = await (supabase
      .from('term_comments') as ReturnType<typeof supabase.from>)
      .delete()
      .eq('id', commentId) as unknown as { error: Error | null };

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
