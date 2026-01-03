// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, DueDiligenceChecklistWithItems, DueDiligenceItemWithDetails } from '@/types';
import type { DueDiligenceItem, DueDiligenceQuestion } from '@/types/database';

// GET /api/trading/trades/[id]/checklist - Get DD checklist with items
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
      .select('id, status')
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
    const { data: checklist, error: checklistError } = await supabase
      .from('due_diligence_checklists')
      .select('*')
      .eq('trade_id', tradeId)
      .single();

    if (checklistError || !checklist) {
      // Return empty checklist if not yet created
      if (trade.status === 'draft') {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Checklist not yet created - trade must be agreed first',
          },
        }, { status: 404 });
      }
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Checklist not found',
        },
      }, { status: 404 });
    }

    // Get all items
    const { data: items } = await supabase
      .from('due_diligence_items')
      .select('*')
      .eq('checklist_id', checklist.id)
      .order('display_order', { ascending: true });

    // Get verifier names
    const verifierIds = [...new Set((items || [])
      .filter((i: DueDiligenceItem) => i.verified_by)
      .map((i: DueDiligenceItem) => i.verified_by))];

    let verifiersMap: Record<string, string> = {};
    if (verifierIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, display_name, email')
        .in('id', verifierIds);

      verifiersMap = (users || []).reduce(
        (acc: Record<string, string>, u: { id: string; display_name: string | null; email: string }) => {
          acc[u.id] = u.display_name || u.email;
          return acc;
        },
        {}
      );
    }

    // Get open questions count
    const { count: openQuestionsCount } = await supabase
      .from('due_diligence_questions')
      .select('*', { count: 'exact', head: true })
      .eq('checklist_id', checklist.id)
      .eq('status', 'open');

    // Group items by category
    const categories = [
      'facility_status',
      'borrower_creditworthiness',
      'financial_performance',
      'covenant_compliance',
      'documentation',
      'transferability',
      'legal_regulatory',
      'operational',
    ];

    const categorizedItems = categories.map((category) => {
      const categoryItems = (items || []).filter((i: DueDiligenceItem) => i.category === category);
      const itemsWithDetails: DueDiligenceItemWithDetails[] = categoryItems.map((item: DueDiligenceItem) => ({
        ...item,
        verifier_name: item.verified_by ? verifiersMap[item.verified_by] : undefined,
      }));

      return {
        category,
        items: itemsWithDetails,
        stats: {
          total: categoryItems.length,
          verified: categoryItems.filter((i: DueDiligenceItem) => i.status === 'verified').length,
          flagged: categoryItems.filter((i: DueDiligenceItem) => i.status === 'flagged').length,
          pending: categoryItems.filter((i: DueDiligenceItem) => ['pending', 'in_review'].includes(i.status)).length,
        },
      };
    }).filter((cat) => cat.items.length > 0);

    const checklistWithItems: DueDiligenceChecklistWithItems = {
      id: checklist.id,
      trade_id: checklist.trade_id,
      status: checklist.status,
      buyer_completed_at: checklist.buyer_completed_at,
      seller_completed_at: checklist.seller_completed_at,
      created_at: checklist.created_at,
      updated_at: checklist.updated_at,
      categories: categorizedItems,
      open_questions_count: openQuestionsCount || 0,
    };

    return NextResponse.json<ApiResponse<DueDiligenceChecklistWithItems>>({
      success: true,
      data: checklistWithItems,
    });
  } catch (error) {
    console.error('Error in GET /api/trading/trades/[id]/checklist:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
