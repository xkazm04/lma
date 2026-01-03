// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createTermSchema, createCategorySchema } from '@/lib/validations';
import { countBy } from '@/lib/utils';
import type { ApiResponse, NegotiationTerm, TermCategory, CategoryWithTerms } from '@/types';

// GET /api/deals/[id]/terms - Get all terms with categories
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dealId } = await params;
    const supabase = await createClient();

    // Get all categories
    const { data: categories, error: catError } = await supabase
      .from('term_categories')
      .select('*')
      .eq('deal_id', dealId)
      .order('display_order', { ascending: true });

    if (catError) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DB_ERROR',
          message: catError.message,
        },
      }, { status: 500 });
    }

    // Get all terms
    const { data: terms, error: termError } = await supabase
      .from('negotiation_terms')
      .select('*')
      .eq('deal_id', dealId)
      .order('display_order', { ascending: true });

    if (termError) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DB_ERROR',
          message: termError.message,
        },
      }, { status: 500 });
    }

    // Get proposal and comment counts for each term
    const termIds = terms?.map((t: NegotiationTerm) => t.id) || [];

    let proposalCounts: Record<string, number> = {};
    let commentCounts: Record<string, number> = {};

    if (termIds.length > 0) {
      // Get pending proposal counts
      const { data: proposals } = await supabase
        .from('term_proposals')
        .select('term_id')
        .in('term_id', termIds)
        .eq('status', 'pending');

      if (proposals) {
        proposalCounts = countBy(proposals, (p: { term_id: string }) => p.term_id);
      }

      // Get unresolved comment counts
      const { data: comments } = await supabase
        .from('term_comments')
        .select('term_id')
        .in('term_id', termIds)
        .eq('is_resolved', false);

      if (comments) {
        commentCounts = countBy(comments, (c: { term_id: string }) => c.term_id);
      }
    }

    // Build category tree with terms
    const categoriesWithTerms: CategoryWithTerms[] = (categories || [])
      .filter((c: TermCategory) => !c.parent_category_id)
      .map((category: TermCategory) => {
        const categoryTerms = (terms || [])
          .filter((t: NegotiationTerm) => t.category_id === category.id)
          .map((t: NegotiationTerm) => ({
            ...t,
            pending_proposals_count: proposalCounts[t.id] || 0,
            comments_count: commentCounts[t.id] || 0,
            last_updated_at: t.updated_at,
          }));

        const subcategories = (categories || [])
          .filter((c: TermCategory) => c.parent_category_id === category.id)
          .map((subcat: TermCategory) => ({
            ...subcat,
            terms: (terms || [])
              .filter((t: NegotiationTerm) => t.category_id === subcat.id)
              .map((t: NegotiationTerm) => ({
                ...t,
                pending_proposals_count: proposalCounts[t.id] || 0,
                comments_count: commentCounts[t.id] || 0,
                last_updated_at: t.updated_at,
              })),
          }));

        return {
          ...category,
          terms: categoryTerms,
          subcategories: subcategories.length > 0 ? subcategories : undefined,
        };
      });

    return NextResponse.json<ApiResponse<CategoryWithTerms[]>>({
      success: true,
      data: categoriesWithTerms,
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

// POST /api/deals/[id]/terms - Add a new term
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dealId } = await params;
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

    // Check if this is a category or term creation
    if (body.type === 'category') {
      const parsed = createCategorySchema.safeParse(body);
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

      const { data: category, error: createError } = await supabase
        .from('term_categories')
        .insert({
          ...parsed.data,
          deal_id: dealId,
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

      return NextResponse.json<ApiResponse<TermCategory>>({
        success: true,
        data: category,
      }, { status: 201 });
    }

    // Create term
    const parsed = createTermSchema.safeParse(body);
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

    // Verify category exists
    const { data: category } = await supabase
      .from('term_categories')
      .select('id')
      .eq('id', parsed.data.category_id)
      .eq('deal_id', dealId)
      .single();

    if (!category) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Category not found',
        },
      }, { status: 404 });
    }

    const { data: term, error: createError } = await supabase
      .from('negotiation_terms')
      .insert({
        ...parsed.data,
        deal_id: dealId,
        negotiation_status: 'not_started',
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

    // Get participant info for history
    const { data: participant } = await supabase
      .from('deal_participants')
      .select('party_name')
      .eq('deal_id', dealId)
      .eq('user_id', user.id)
      .single();

    // Log term creation in history
    await supabase
      .from('term_history')
      .insert({
        term_id: term.id,
        deal_id: dealId,
        change_type: 'created',
        new_value: parsed.data.current_value,
        new_status: 'not_started',
        changed_by: user.id,
        changed_by_party: participant?.party_name || 'Unknown',
      });

    return NextResponse.json<ApiResponse<NegotiationTerm>>({
      success: true,
      data: term,
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
