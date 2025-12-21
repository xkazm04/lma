import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { ApiResponse } from '@/types';
import type {
  ComparisonHistoryEntryWithDetails,
  ListComparisonHistoryResponse,
} from '@/app/features/documents/sub_Compare/lib/history-types';

// Validation schemas
const saveHistorySchema = z.object({
  document1Id: z.string().uuid(),
  document2Id: z.string().uuid(),
  result: z.object({
    document1: z.object({
      id: z.string(),
      name: z.string(),
    }),
    document2: z.object({
      id: z.string(),
      name: z.string(),
    }),
    differences: z.array(z.object({
      field: z.string(),
      category: z.string(),
      document1Value: z.unknown(),
      document2Value: z.unknown(),
      changeType: z.enum(['added', 'removed', 'modified']),
    })),
    impactAnalysis: z.string().optional(),
  }),
  label: z.string().optional(),
  notes: z.string().optional(),
});

const listHistorySchema = z.object({
  document1Id: z.string().uuid().optional(),
  document2Id: z.string().uuid().optional(),
  documentPairIds: z.tuple([z.string().uuid(), z.string().uuid()]).optional(),
  comparedBy: z.string().uuid().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
});

// POST /api/documents/compare/history - Save a comparison to history
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to save comparison history',
        },
      }, { status: 401 });
    }

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id, full_name')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      }, { status: 404 });
    }

    const body = await request.json();

    // Validate input
    const parsed = saveHistorySchema.safeParse(body);
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

    const { document1Id, document2Id, result, label, notes } = parsed.data;

    // Calculate stats
    const totalChanges = result.differences.length;
    const addedCount = result.differences.filter(d => d.changeType === 'added').length;
    const modifiedCount = result.differences.filter(d => d.changeType === 'modified').length;
    const removedCount = result.differences.filter(d => d.changeType === 'removed').length;

    // Insert into history
    const { data: historyEntry, error: insertError } = await supabase
      .from('document_comparison_history')
      .insert({
        organization_id: userData.organization_id,
        document1_id: document1Id,
        document2_id: document2Id,
        compared_by: user.id,
        differences: result.differences,
        impact_analysis: result.impactAnalysis,
        total_changes: totalChanges,
        added_count: addedCount,
        modified_count: modifiedCount,
        removed_count: removedCount,
        label,
        notes,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to save comparison history:', insertError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to save comparison history',
        },
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<{ id: string }>>({
      success: true,
      data: { id: historyEntry.id },
    }, { status: 201 });
  } catch (error) {
    console.error('Error saving comparison history:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// GET /api/documents/compare/history - List comparison history
export async function GET(request: NextRequest) {
  try {
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

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const params = {
      document1Id: searchParams.get('document1Id') || undefined,
      document2Id: searchParams.get('document2Id') || undefined,
      documentPairIds: searchParams.get('documentPairIds')
        ? (searchParams.get('documentPairIds')!.split(',') as [string, string])
        : undefined,
      comparedBy: searchParams.get('comparedBy') || undefined,
      fromDate: searchParams.get('fromDate') || undefined,
      toDate: searchParams.get('toDate') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    const parsed = listHistorySchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: parsed.error.flatten(),
        },
      }, { status: 400 });
    }

    const { document1Id, document2Id, documentPairIds, comparedBy, fromDate, toDate, limit, offset } = parsed.data;

    // Build query
    let query = supabase
      .from('document_comparison_history')
      .select(`
        *,
        compared_by_user:users!compared_by(id, full_name, email),
        doc1:loan_documents!document1_id(id, original_filename, document_type),
        doc2:loan_documents!document2_id(id, original_filename, document_type)
      `, { count: 'exact' });

    // Apply filters
    if (document1Id) {
      query = query.eq('document1_id', document1Id);
    }
    if (document2Id) {
      query = query.eq('document2_id', document2Id);
    }
    if (documentPairIds) {
      // Find comparisons where the pair matches in either direction
      const [id1, id2] = documentPairIds;
      query = query.or(
        `and(document1_id.eq.${id1},document2_id.eq.${id2}),and(document1_id.eq.${id2},document2_id.eq.${id1})`
      );
    }
    if (comparedBy) {
      query = query.eq('compared_by', comparedBy);
    }
    if (fromDate) {
      query = query.gte('compared_at', fromDate);
    }
    if (toDate) {
      query = query.lte('compared_at', toDate);
    }

    // Order and paginate
    query = query
      .order('compared_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, count, error: queryError } = await query;

    if (queryError) {
      console.error('Failed to fetch comparison history:', queryError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch comparison history',
        },
      }, { status: 500 });
    }

    // Transform data to match expected interface
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entries: ComparisonHistoryEntryWithDetails[] = (data || []).map((entry: any) => ({
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
    }));

    const response: ListComparisonHistoryResponse = {
      entries,
      total: count || 0,
      hasMore: (offset + limit) < (count || 0),
    };

    return NextResponse.json<ApiResponse<ListComparisonHistoryResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error fetching comparison history:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
