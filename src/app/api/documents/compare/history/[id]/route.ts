import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { ApiResponse } from '@/types';
import type { ComparisonHistoryEntryWithDetails } from '@/app/features/documents/sub_Compare/lib/history-types';

const updateHistorySchema = z.object({
  label: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/documents/compare/history/[id] - Get a specific history entry
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to view comparison history',
        },
      }, { status: 401 });
    }

    const { data: entry, error: queryError } = await supabase
      .from('document_comparison_history')
      .select(`
        *,
        compared_by_user:users!compared_by(id, full_name, email),
        doc1:loan_documents!document1_id(id, original_filename, document_type),
        doc2:loan_documents!document2_id(id, original_filename, document_type)
      `)
      .eq('id', id)
      .single();

    if (queryError || !entry) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Comparison history entry not found',
        },
      }, { status: 404 });
    }

    const result: ComparisonHistoryEntryWithDetails = {
      id: entry.id,
      organizationId: entry.organization_id,
      document1Id: entry.document1_id,
      document2Id: entry.document2_id,
      comparedBy: entry.compared_by,
      comparedByName: entry.compared_by_user?.full_name || 'Unknown User',
      comparedByEmail: entry.compared_by_user?.email,
      comparedAt: entry.compared_at,
      differences: entry.differences,
      impactAnalysis: entry.impact_analysis,
      totalChanges: entry.total_changes,
      addedCount: entry.added_count,
      modifiedCount: entry.modified_count,
      removedCount: entry.removed_count,
      label: entry.label,
      notes: entry.notes,
      createdAt: entry.created_at,
      updatedAt: entry.updated_at,
      document1: {
        id: entry.doc1?.id || entry.document1_id,
        name: entry.doc1?.original_filename || 'Unknown Document',
        type: entry.doc1?.document_type || 'other',
      },
      document2: {
        id: entry.doc2?.id || entry.document2_id,
        name: entry.doc2?.original_filename || 'Unknown Document',
        type: entry.doc2?.document_type || 'other',
      },
    };

    return NextResponse.json<ApiResponse<ComparisonHistoryEntryWithDetails>>({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching comparison history entry:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// PATCH /api/documents/compare/history/[id] - Update a history entry (label/notes)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to update comparison history',
        },
      }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateHistorySchema.safeParse(body);
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

    const updates: Record<string, string | null> = {};
    if (parsed.data.label !== undefined) {
      updates.label = parsed.data.label || null;
    }
    if (parsed.data.notes !== undefined) {
      updates.notes = parsed.data.notes || null;
    }

    const { data: updated, error: updateError } = await supabase
      .from('document_comparison_history')
      .update(updates)
      .eq('id', id)
      .eq('compared_by', user.id) // Only allow updating own entries
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update comparison history:', updateError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: 'Failed to update comparison history. You may not have permission to edit this entry.',
        },
      }, { status: 403 });
    }

    return NextResponse.json<ApiResponse<{ id: string }>>({
      success: true,
      data: { id: updated.id },
    });
  } catch (error) {
    console.error('Error updating comparison history:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// DELETE /api/documents/compare/history/[id] - Delete a history entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to delete comparison history',
        },
      }, { status: 401 });
    }

    const { error: deleteError } = await supabase
      .from('document_comparison_history')
      .delete()
      .eq('id', id)
      .eq('compared_by', user.id); // Only allow deleting own entries

    if (deleteError) {
      console.error('Failed to delete comparison history:', deleteError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: 'Failed to delete comparison history. You may not have permission to delete this entry.',
        },
      }, { status: 403 });
    }

    return NextResponse.json<ApiResponse<{ success: true }>>({
      success: true,
      data: { success: true },
    });
  } catch (error) {
    console.error('Error deleting comparison history:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
