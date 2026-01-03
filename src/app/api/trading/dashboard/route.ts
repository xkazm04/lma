// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { keyByWithTransform } from '@/lib/utils';
import type { ApiResponse, TradingDashboardStats, TradingDashboardTrade } from '@/types';
import type { Trade, TradeEvent } from '@/types/database';

// Extended trade type for dashboard with joined fields
interface TradeWithDetails extends Trade {
  trade_facilities?: {
    facility_name: string;
    borrower_name: string;
  };
}

// GET /api/trading/dashboard - Get trading dashboard stats (unified endpoint)
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

    const orgId = userData.organization_id;

    // Get facilities count
    const { count: totalFacilities } = await supabase
      .from('trade_facilities')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId);

    // Get positions
    const { data: positions } = await supabase
      .from('lender_positions')
      .select('commitment_amount')
      .eq('organization_id', orgId)
      .eq('is_active', true);

    const totalPositions = positions?.length || 0;
    const totalPositionValue = (positions || []).reduce(
      (sum: number, p: { commitment_amount: number }) => sum + p.commitment_amount,
      0
    );

    // Get trades where org is buyer or seller (with facility details for trades_in_progress)
    const { data: trades } = await supabase
      .from('trades')
      .select(`
        id, status, trade_amount, trade_price, trade_date, settlement_date,
        seller_organization_id, buyer_organization_id, trade_reference,
        trade_facilities (facility_name, borrower_name)
      `)
      .or(`seller_organization_id.eq.${orgId},buyer_organization_id.eq.${orgId}`);

    const allTrades: TradeWithDetails[] = trades || [];

    // Calculate trade stats
    const activeTrades = allTrades.filter((t) =>
      !['settled', 'cancelled', 'failed'].includes(t.status)
    ).length;

    const tradesInDD = allTrades.filter((t) =>
      ['agreed', 'in_due_diligence'].includes(t.status)
    ).length;

    const tradesPendingSettlement = allTrades.filter((t) =>
      ['documentation', 'pending_consent', 'pending_settlement'].includes(t.status)
    ).length;

    // Get settled trades this month
    const now = new Date();
    const settledThisMonth = allTrades.filter((t) =>
      t.status === 'settled'
    );
    const settledVolumeThisMonth = settledThisMonth.reduce(
      (sum: number, t) => sum + (t.trade_amount || 0),
      0
    );

    // Get DD checklists for completion rate and per-trade DD progress
    const tradeIds = allTrades.map((t) => t.id);
    let ddCompletionRate = 0;
    let flaggedItemsCount = 0;
    let openQuestionsCount = 0;
    const ddProgressByTrade: Record<string, { progress: number; flagged: number; questions: number }> = {};

    if (tradeIds.length > 0) {
      const { data: checklists } = await supabase
        .from('due_diligence_checklists')
        .select('id, trade_id, status, total_items, completed_items')
        .in('trade_id', tradeIds);

      if (checklists?.length) {
        const completedChecklists = checklists.filter((c: { status: string }) => c.status === 'complete');
        ddCompletionRate = Math.round((completedChecklists.length / checklists.length) * 100);

        const checklistIds = checklists.map((c: { id: string }) => c.id);
        const checklistByTrade: Record<string, { id: string; total_items: number; completed_items: number }> = {};
        checklists.forEach((c: { id: string; trade_id: string; total_items: number; completed_items: number }) => {
          checklistByTrade[c.trade_id] = { id: c.id, total_items: c.total_items || 0, completed_items: c.completed_items || 0 };
        });

        // Get flagged items count per checklist
        const { data: flaggedItems } = await supabase
          .from('due_diligence_items')
          .select('checklist_id')
          .in('checklist_id', checklistIds)
          .eq('status', 'flagged');

        const flaggedByChecklist: Record<string, number> = {};
        (flaggedItems || []).forEach((item: { checklist_id: string }) => {
          flaggedByChecklist[item.checklist_id] = (flaggedByChecklist[item.checklist_id] || 0) + 1;
        });
        flaggedItemsCount = flaggedItems?.length || 0;

        // Get open questions count per checklist
        const { data: openQuestions } = await supabase
          .from('due_diligence_questions')
          .select('checklist_id')
          .in('checklist_id', checklistIds)
          .eq('status', 'open');

        const questionsByChecklist: Record<string, number> = {};
        (openQuestions || []).forEach((q: { checklist_id: string }) => {
          questionsByChecklist[q.checklist_id] = (questionsByChecklist[q.checklist_id] || 0) + 1;
        });
        openQuestionsCount = openQuestions?.length || 0;

        // Build per-trade DD progress map
        Object.entries(checklistByTrade).forEach(([tradeId, cl]) => {
          const totalItems = cl.total_items || 1;
          const completedItems = cl.completed_items || 0;
          const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
          ddProgressByTrade[tradeId] = {
            progress,
            flagged: flaggedByChecklist[cl.id] || 0,
            questions: questionsByChecklist[cl.id] || 0,
          };
        });
      }
    }

    // Get all organization IDs for name lookups
    const allOrgIds = [...new Set(allTrades.flatMap((t) =>
      [t.seller_organization_id, t.buyer_organization_id]
    ))];

    let orgsMap: Record<string, string> = {};
    if (allOrgIds.length > 0) {
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', allOrgIds);

      orgsMap = keyByWithTransform(
        orgs || [],
        (o: { id: string; name: string }) => o.id,
        (o: { id: string; name: string }) => o.name
      );
    }

    // Build trades_in_progress (non-settled, non-cancelled, non-failed trades)
    const tradesInProgressList: TradingDashboardTrade[] = allTrades
      .filter((t) => !['settled', 'cancelled', 'failed'].includes(t.status))
      .map((t) => {
        const isBuyer = t.buyer_organization_id === orgId;
        const ddProgress = ddProgressByTrade[t.id] || { progress: 0, flagged: 0, questions: 0 };
        return {
          id: t.id,
          trade_reference: t.trade_reference,
          facility_name: t.trade_facilities?.facility_name || 'Unknown Facility',
          borrower_name: t.trade_facilities?.borrower_name || 'Unknown Borrower',
          seller_name: orgsMap[t.seller_organization_id] || 'Unknown',
          buyer_name: orgsMap[t.buyer_organization_id] || 'Unknown',
          is_buyer: isBuyer,
          status: t.status,
          trade_amount: t.trade_amount || 0,
          trade_price: t.trade_price || 100,
          trade_date: t.trade_date || '',
          settlement_date: t.settlement_date || null,
          dd_progress: ddProgress.progress,
          flagged_items: ddProgress.flagged,
          open_questions: ddProgress.questions,
        };
      })
      .sort((a, b) => new Date(b.trade_date).getTime() - new Date(a.trade_date).getTime());

    // Get upcoming settlements (next 14 days)
    const futureDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const upcomingSettlementTrades = allTrades
      .filter((t) =>
        ['documentation', 'pending_consent', 'pending_settlement'].includes(t.status) &&
        t.settlement_date &&
        t.settlement_date <= futureDate
      )
      .sort((a, b) => (a.settlement_date || '').localeCompare(b.settlement_date || ''))
      .slice(0, 5);

    const upcomingSettlements = upcomingSettlementTrades.map((t) => {
      const isBuyer = t.buyer_organization_id === orgId;
      const counterpartyId = isBuyer ? t.seller_organization_id : t.buyer_organization_id;
      return {
        trade_id: t.id,
        trade_reference: t.trade_reference,
        settlement_date: t.settlement_date || '',
        amount: t.trade_amount || 0,
        counterparty: orgsMap[counterpartyId] || 'Unknown',
        is_buyer: isBuyer,
      };
    });

    // Get recent activity
    let recentActivity: Array<{
      id: string;
      type: string;
      description: string;
      trade_id: string;
      trade_reference: string;
      occurred_at: string;
    }> = [];

    if (tradeIds.length > 0) {
      const { data: recentEvents } = await supabase
        .from('trade_events')
        .select('id, trade_id, event_type, occurred_at')
        .in('trade_id', tradeIds)
        .order('occurred_at', { ascending: false })
        .limit(10);

      // Get trade references for events
      const eventTradeMap = keyByWithTransform(
        allTrades,
        (t) => t.id,
        (t) => t.trade_reference
      );

      const eventDescriptions: Record<string, string> = {
        trade_created: 'Trade created',
        terms_agreed: 'Terms agreed',
        dd_started: 'DD started',
        dd_item_verified: 'DD item verified',
        dd_item_flagged: 'DD item flagged',
        question_asked: 'Question asked',
        question_answered: 'Question answered',
        dd_completed: 'DD completed',
        consent_requested: 'Consent requested',
        consent_received: 'Consent received',
        trade_settled: 'Trade settled',
        trade_cancelled: 'Trade cancelled',
      };

      recentActivity = (recentEvents || []).map((e: TradeEvent) => ({
        id: e.id,
        type: e.event_type,
        description: eventDescriptions[e.event_type] || e.event_type,
        trade_id: e.trade_id,
        trade_reference: eventTradeMap[e.trade_id] || 'Unknown',
        occurred_at: e.occurred_at,
      }));
    }

    // Calculate average settlement days (simplified)
    const averageSettlementDays = 10; // Would calculate from actual settlement data

    const stats: TradingDashboardStats = {
      total_facilities: totalFacilities || 0,
      total_positions: totalPositions,
      total_position_value: totalPositionValue,
      active_trades: activeTrades,
      trades_in_dd: tradesInDD,
      trades_pending_settlement: tradesPendingSettlement,
      settled_this_month: settledThisMonth.length,
      settled_volume_this_month: settledVolumeThisMonth,
      dd_completion_rate: ddCompletionRate,
      average_settlement_days: averageSettlementDays,
      flagged_items_count: flaggedItemsCount,
      open_questions_count: openQuestionsCount,
      trades_in_progress: tradesInProgressList,
      upcoming_settlements: upcomingSettlements,
      recent_activity: recentActivity,
    };

    return NextResponse.json<ApiResponse<TradingDashboardStats>>({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error in GET /api/trading/dashboard:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
