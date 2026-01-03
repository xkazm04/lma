// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { agreeTradeSchema } from '@/lib/validations';
import type { ApiResponse } from '@/types';
import type { Trade } from '@/types/database';

// Standard DD checklist items by category
const DD_CHECKLIST_TEMPLATE = [
  // Facility Status
  { category: 'facility_status', item_name: 'Facility performing status', item_description: 'Verify facility is not in default', data_source: 'auto_system', required_for: 'both', is_critical: true },
  { category: 'facility_status', item_name: 'No pending amendments', item_description: 'Confirm no material amendments pending', data_source: 'seller_provided', required_for: 'buyer', is_critical: false },
  { category: 'facility_status', item_name: 'Maturity date confirmation', item_description: 'Verify maturity date matches records', data_source: 'document_review', required_for: 'both', is_critical: true },

  // Borrower Creditworthiness
  { category: 'borrower_creditworthiness', item_name: 'Credit rating review', item_description: 'Review current borrower credit rating', data_source: 'external', required_for: 'buyer', is_critical: true },
  { category: 'borrower_creditworthiness', item_name: 'Material adverse change', item_description: 'Confirm no MAC since last reporting', data_source: 'seller_provided', required_for: 'buyer', is_critical: true },

  // Financial Performance
  { category: 'financial_performance', item_name: 'Latest financial statements', item_description: 'Review most recent audited financials', data_source: 'document_review', required_for: 'buyer', is_critical: true },
  { category: 'financial_performance', item_name: 'Quarterly reports received', item_description: 'Confirm quarterly reporting is current', data_source: 'auto_system', required_for: 'buyer', is_critical: false },

  // Covenant Compliance
  { category: 'covenant_compliance', item_name: 'Covenant compliance status', item_description: 'All covenants currently in compliance', data_source: 'auto_system', required_for: 'both', is_critical: true },
  { category: 'covenant_compliance', item_name: 'Recent covenant test results', item_description: 'Review last 4 quarters of covenant tests', data_source: 'document_review', required_for: 'buyer', is_critical: true },
  { category: 'covenant_compliance', item_name: 'Headroom analysis', item_description: 'Assess covenant headroom trends', data_source: 'document_review', required_for: 'buyer', is_critical: false },

  // Documentation
  { category: 'documentation', item_name: 'Credit agreement available', item_description: 'Original credit agreement on file', data_source: 'document_review', required_for: 'both', is_critical: true },
  { category: 'documentation', item_name: 'All amendments available', item_description: 'Complete amendment history available', data_source: 'document_review', required_for: 'buyer', is_critical: true },
  { category: 'documentation', item_name: 'Assignment agreement prepared', item_description: 'Draft assignment agreement ready', data_source: 'seller_provided', required_for: 'both', is_critical: true },

  // Transferability
  { category: 'transferability', item_name: 'Transfer restrictions review', item_description: 'Review assignment/transfer provisions', data_source: 'document_review', required_for: 'both', is_critical: true },
  { category: 'transferability', item_name: 'Minimum transfer amount', item_description: 'Verify trade meets minimum thresholds', data_source: 'auto_system', required_for: 'both', is_critical: true },
  { category: 'transferability', item_name: 'Restricted party check', item_description: 'Buyer not on restricted list', data_source: 'auto_system', required_for: 'seller', is_critical: true },

  // Legal/Regulatory
  { category: 'legal_regulatory', item_name: 'No pending litigation', item_description: 'Confirm no material litigation affecting facility', data_source: 'seller_provided', required_for: 'buyer', is_critical: true },
  { category: 'legal_regulatory', item_name: 'KYC/AML clearance', item_description: 'Buyer KYC/AML verification complete', data_source: 'external', required_for: 'seller', is_critical: true },
  { category: 'legal_regulatory', item_name: 'Regulatory compliance', item_description: 'Trade complies with applicable regulations', data_source: 'document_review', required_for: 'both', is_critical: false },

  // Operational
  { category: 'operational', item_name: 'Agent notification prepared', item_description: 'Agent notice of transfer drafted', data_source: 'seller_provided', required_for: 'seller', is_critical: true },
  { category: 'operational', item_name: 'Wire instructions confirmed', item_description: 'Settlement wire instructions verified', data_source: 'seller_provided', required_for: 'buyer', is_critical: true },
  { category: 'operational', item_name: 'Settlement date confirmed', item_description: 'All parties agree on settlement date', data_source: 'auto_system', required_for: 'both', is_critical: true },
];

// POST /api/trading/trades/[id]/agree - Buyer agrees to trade terms
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

    // Get trade
    const { data: trade } = await supabase
      .from('trades')
      .select('*, trade_facilities!inner(facility_name)')
      .eq('id', tradeId)
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

    // Only buyer can agree to trade
    if (trade.buyer_organization_id !== userData.organization_id) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only buyer can agree to trade terms',
        },
      }, { status: 403 });
    }

    // Trade must be in draft status
    if (trade.status !== 'draft') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Cannot agree to trade in ${trade.status} status`,
        },
      }, { status: 400 });
    }

    const body = await request.json();
    const parsed = agreeTradeSchema.safeParse(body);

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

    // Update trade status
    const { data: updatedTrade, error: updateError } = await supabase
      .from('trades')
      .update({
        status: 'agreed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', tradeId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating trade:', updateError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update trade',
        },
      }, { status: 500 });
    }

    // Create DD checklist
    const { data: checklist, error: checklistError } = await supabase
      .from('due_diligence_checklists')
      .insert({
        trade_id: tradeId,
        status: 'not_started',
      })
      .select()
      .single();

    if (checklistError) {
      console.error('Error creating checklist:', checklistError);
    } else {
      // Create checklist items
      const checklistItems = DD_CHECKLIST_TEMPLATE.map((item, index) => ({
        checklist_id: checklist.id,
        ...item,
        display_order: index + 1,
        status: 'pending',
      }));

      await supabase.from('due_diligence_items').insert(checklistItems);
    }

    // Log trade event
    await supabase.from('trade_events').insert({
      trade_id: tradeId,
      event_type: 'terms_agreed',
      event_data: {
        agreed_by: userData.organization_id,
      },
      actor_id: user.id,
    });

    // Log activity for both parties
    const activityBase = {
      source_module: 'trading',
      activity_type: 'trade_agreed',
      actor_id: user.id,
      entity_type: 'trade',
      entity_id: tradeId,
      entity_name: trade.trade_reference,
      description: `Trade ${trade.trade_reference} terms agreed - DD can begin`,
    };

    await supabase.from('activities').insert([
      { ...activityBase, organization_id: trade.seller_organization_id },
      { ...activityBase, organization_id: trade.buyer_organization_id },
    ]);

    return NextResponse.json<ApiResponse<Trade>>({
      success: true,
      data: updatedTrade,
    });
  } catch (error) {
    console.error('Error in POST /api/trading/trades/[id]/agree:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
