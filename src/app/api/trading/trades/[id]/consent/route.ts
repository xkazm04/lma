// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requestConsentSchema, updateConsentSchema } from '@/lib/validations';
import type { ApiResponse, ConsentStatus } from '@/types';
import type { Trade } from '@/types/database';

// GET /api/trading/trades/[id]/consent - Get consent status
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
      .select('id, consent_required, consent_received, consent_date')
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

    const consentStatus: ConsentStatus = {
      trade_id: tradeId,
      consent_required: trade.consent_required,
      consent_received: trade.consent_received,
      consent_date: trade.consent_date,
    };

    return NextResponse.json<ApiResponse<ConsentStatus>>({
      success: true,
      data: consentStatus,
    });
  } catch (error) {
    console.error('Error in GET /api/trading/trades/[id]/consent:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// POST /api/trading/trades/[id]/consent - Request consent
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

    // Verify trade access (only seller can request consent)
    const { data: trade } = await supabase
      .from('trades')
      .select('id, status, trade_reference, seller_organization_id, buyer_organization_id, consent_required')
      .eq('id', tradeId)
      .eq('seller_organization_id', userData.organization_id)
      .single();

    if (!trade) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Trade not found or you are not the seller',
        },
      }, { status: 404 });
    }

    // Trade must be in pending_consent status
    if (trade.status !== 'pending_consent') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Cannot request consent in ${trade.status} status`,
        },
      }, { status: 400 });
    }

    const body = await request.json();
    const parsed = requestConsentSchema.safeParse(body);

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

    // Log trade event
    await supabase.from('trade_events').insert({
      trade_id: tradeId,
      event_type: 'consent_requested',
      event_data: {
        consent_type: parsed.data.consent_type,
        request_notes: parsed.data.request_notes,
      },
      actor_id: user.id,
    });

    // Log activity
    const activityBase = {
      source_module: 'trading',
      activity_type: 'consent_requested',
      actor_id: user.id,
      entity_type: 'trade',
      entity_id: tradeId,
      entity_name: trade.trade_reference,
      description: `Consent requested for trade ${trade.trade_reference} (${parsed.data.consent_type})`,
    };

    await supabase.from('activities').insert([
      { ...activityBase, organization_id: trade.seller_organization_id },
      { ...activityBase, organization_id: trade.buyer_organization_id },
    ]);

    return NextResponse.json<ApiResponse<{ requested: boolean }>>({
      success: true,
      data: { requested: true },
    });
  } catch (error) {
    console.error('Error in POST /api/trading/trades/[id]/consent:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// PUT /api/trading/trades/[id]/consent - Update consent (received/rejected)
export async function PUT(
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

    // Verify trade access (only seller can update consent status)
    const { data: trade } = await supabase
      .from('trades')
      .select('id, status, trade_reference, seller_organization_id, buyer_organization_id')
      .eq('id', tradeId)
      .eq('seller_organization_id', userData.organization_id)
      .single();

    if (!trade) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Trade not found or you are not the seller',
        },
      }, { status: 404 });
    }

    // Trade must be in pending_consent status
    if (trade.status !== 'pending_consent') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Cannot update consent in ${trade.status} status`,
        },
      }, { status: 400 });
    }

    const body = await request.json();
    const parsed = updateConsentSchema.safeParse(body);

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

    const now = new Date().toISOString();

    // Update trade
    const updateData: Partial<Trade> = {
      consent_received: parsed.data.consent_received,
      consent_date: parsed.data.consent_received ? (parsed.data.consent_date || now) : null,
      updated_at: now,
    };

    // If consent received, move to documentation phase
    if (parsed.data.consent_received) {
      updateData.status = 'documentation';
    }

    const { data: updatedTrade, error: updateError } = await supabase
      .from('trades')
      .update(updateData)
      .eq('id', tradeId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating consent:', updateError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update consent',
        },
      }, { status: 500 });
    }

    // Log trade event
    const eventType = parsed.data.consent_received ? 'consent_received' : 'consent_rejected';
    await supabase.from('trade_events').insert({
      trade_id: tradeId,
      event_type: eventType,
      event_data: {
        consent_date: parsed.data.consent_date,
        consent_notes: parsed.data.consent_notes,
      },
      actor_id: user.id,
    });

    // Log activity
    const activityBase = {
      source_module: 'trading',
      activity_type: eventType,
      actor_id: user.id,
      entity_type: 'trade',
      entity_id: tradeId,
      entity_name: trade.trade_reference,
      description: parsed.data.consent_received
        ? `Consent received for trade ${trade.trade_reference}`
        : `Consent rejected for trade ${trade.trade_reference}`,
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
    console.error('Error in PUT /api/trading/trades/[id]/consent:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
