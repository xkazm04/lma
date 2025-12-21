import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncFacilitySchema } from '@/lib/validations';
import type { ApiResponse } from '@/types';
import type { ComplianceFacility } from '@/types/database';

// POST /api/compliance/facilities/[id]/sync - Sync from Document Hub
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: facilityId } = await params;
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

    interface UserData {
      organization_id: string;
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single() as { data: UserData | null };

    if (!userData) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User profile not found',
        },
      }, { status: 404 });
    }

    // Check compliance facility exists
    const { data: complianceFacility } = await (supabase
      .from('compliance_facilities') as ReturnType<typeof supabase.from>)
      .select('*')
      .eq('id', facilityId)
      .eq('organization_id', userData.organization_id)
      .single() as { data: ComplianceFacility | null };

    if (!complianceFacility) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Compliance facility not found',
        },
      }, { status: 404 });
    }

    const body = await request.json();
    const parsed = syncFacilitySchema.safeParse(body);

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

    interface SourceFacilityData {
      id: string;
      facility_name: string;
      facility_reference: string;
      maturity_date: string | null;
    }

    // Get source facility from Document Hub
    const { data: sourceFacility, error: sourceError } = await (supabase
      .from('loan_facilities') as ReturnType<typeof supabase.from>)
      .select('*')
      .eq('id', parsed.data.source_facility_id)
      .eq('organization_id', userData.organization_id)
      .single() as { data: SourceFacilityData | null; error: unknown };

    if (sourceError || !sourceFacility) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Source facility not found',
        },
      }, { status: 404 });
    }

    let importedObligations = 0;
    let importedCovenants = 0;
    let importedNotifications = 0;

    interface SourceObligationData {
      id: string;
      obligation_type: string;
      frequency: string;
      description: string | null;
      raw_text: string | null;
      deadline_days: number | null;
      recipient_role: string | null;
      clause_reference: string | null;
    }

    // Import obligations
    if (parsed.data.import_obligations) {
      const { data: sourceObligations } = await (supabase
        .from('reporting_obligations') as ReturnType<typeof supabase.from>)
        .select('*')
        .eq('facility_id', parsed.data.source_facility_id) as { data: SourceObligationData[] | null };

      for (const obligation of sourceObligations || []) {
        // Map obligation type
        const obligationType = mapObligationType(obligation.obligation_type);
        const frequency = mapFrequency(obligation.frequency);

        await (supabase.from('compliance_obligations') as ReturnType<typeof supabase.from>).insert({
          facility_id: facilityId,
          source_obligation_id: obligation.id,
          obligation_type: obligationType,
          name: obligation.description || `${obligationType} obligation`,
          description: obligation.raw_text,
          frequency: frequency,
          deadline_days: obligation.deadline_days || 90,
          recipient_roles: obligation.recipient_role ? [obligation.recipient_role] : ['Agent'],
          clause_reference: obligation.clause_reference,
        });
        importedObligations++;
      }
    }

    interface SourceCovenantData {
      id: string;
      covenant_type: string;
      covenant_name: string;
      raw_text: string | null;
      numerator_definition: string | null;
      denominator_definition: string | null;
      calculation_methodology: string | null;
      threshold_type: string | null;
      threshold_schedule: unknown;
      threshold_value: number | null;
      testing_frequency: string | null;
      cure_rights: string | null;
      clause_reference: string | null;
    }

    // Import covenants
    if (parsed.data.import_covenants) {
      const { data: sourceCovenants } = await (supabase
        .from('financial_covenants') as ReturnType<typeof supabase.from>)
        .select('*')
        .eq('facility_id', parsed.data.source_facility_id) as { data: SourceCovenantData[] | null };

      for (const covenant of sourceCovenants || []) {
        // Map covenant type
        const covenantType = mapCovenantType(covenant.covenant_type);

        await (supabase.from('compliance_covenants') as ReturnType<typeof supabase.from>).insert({
          facility_id: facilityId,
          source_covenant_id: covenant.id,
          covenant_type: covenantType,
          name: covenant.covenant_name,
          description: covenant.raw_text,
          numerator_definition: covenant.numerator_definition,
          denominator_definition: covenant.denominator_definition,
          formula_description: covenant.calculation_methodology,
          threshold_type: covenant.threshold_type === 'minimum' ? 'minimum' : 'maximum',
          threshold_schedule: covenant.threshold_schedule || (covenant.threshold_value ? [{ effective_from: new Date().toISOString(), threshold_value: covenant.threshold_value }] : null),
          testing_frequency: covenant.testing_frequency || 'quarterly',
          testing_basis: 'period_end',
          has_equity_cure: !!covenant.cure_rights,
          equity_cure_details: covenant.cure_rights,
          clause_reference: covenant.clause_reference,
        });
        importedCovenants++;
      }
    }

    interface SourceEventData {
      id: string;
      event_category: string;
      description: string | null;
      grace_period_days: number | null;
      consequences: string | null;
      clause_reference: string | null;
    }

    // Import notification requirements from events of default
    if (parsed.data.import_notifications) {
      const { data: sourceEvents } = await (supabase
        .from('events_of_default') as ReturnType<typeof supabase.from>)
        .select('*')
        .eq('facility_id', parsed.data.source_facility_id) as { data: SourceEventData[] | null };

      for (const event of sourceEvents || []) {
        const eventType = mapEventType(event.event_category);

        await (supabase.from('notification_requirements') as ReturnType<typeof supabase.from>).insert({
          facility_id: facilityId,
          event_type: eventType,
          name: `${event.event_category} notification`,
          trigger_description: event.description,
          notification_deadline_days: event.grace_period_days || 5,
          required_content: event.consequences,
          clause_reference: event.clause_reference,
          recipient_roles: ['Agent'],
        });
        importedNotifications++;
      }
    }

    // Update compliance facility with source link
    const { data: updatedFacility } = await (supabase
      .from('compliance_facilities') as ReturnType<typeof supabase.from>)
      .update({
        source_facility_id: parsed.data.source_facility_id,
        facility_name: sourceFacility.facility_name,
        facility_reference: sourceFacility.facility_reference,
        maturity_date: sourceFacility.maturity_date,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facilityId)
      .select()
      .single() as { data: ComplianceFacility | null };

    // Log activity
    try {
      await (supabase.from('activities') as ReturnType<typeof supabase.from>).insert({
        organization_id: userData.organization_id,
        source_module: 'compliance',
        activity_type: 'facility_synced',
        actor_id: user.id,
        entity_type: 'compliance_facility',
        entity_id: facilityId,
        entity_name: updatedFacility?.facility_name || 'Unknown',
        description: `Synced from Document Hub: ${importedObligations} obligations, ${importedCovenants} covenants, ${importedNotifications} notifications`,
        details: {
          source_facility_id: parsed.data.source_facility_id,
          imported_obligations: importedObligations,
          imported_covenants: importedCovenants,
          imported_notifications: importedNotifications,
        },
      });
    } catch {
      // Ignore activity logging errors
    }

    return NextResponse.json<ApiResponse<{ facility: ComplianceFacility | null; imported: { obligations: number; covenants: number; notifications: number } }>>({
      success: true,
      data: {
        facility: updatedFacility,
        imported: {
          obligations: importedObligations,
          covenants: importedCovenants,
          notifications: importedNotifications,
        },
      },
    });
  } catch (error) {
    console.error('Error in POST /api/compliance/facilities/[id]/sync:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// Helper functions to map types
function mapObligationType(type: string): string {
  const mapping: Record<string, string> = {
    'annual_financials': 'annual_audited_financials',
    'quarterly_financials': 'quarterly_financials',
    'compliance_certificate': 'compliance_certificate',
    'budget': 'annual_budget',
    'audit_report': 'annual_audited_financials',
    'event_notice': 'other',
    'other': 'other',
  };
  return mapping[type] || 'other';
}

function mapFrequency(frequency: string): string {
  const mapping: Record<string, string> = {
    'annual': 'annual',
    'quarterly': 'quarterly',
    'monthly': 'monthly',
    'on_occurrence': 'on_event',
    'other': 'one_time',
  };
  return mapping[frequency] || 'quarterly';
}

function mapCovenantType(type: string): string {
  const mapping: Record<string, string> = {
    'leverage_ratio': 'leverage_ratio',
    'interest_coverage': 'interest_coverage',
    'debt_service_coverage': 'debt_service_coverage',
    'net_worth': 'net_worth',
    'current_ratio': 'current_ratio',
    'capex_limit': 'capex',
    'other': 'other',
  };
  return mapping[type] || 'other';
}

function mapEventType(category: string): string {
  const mapping: Record<string, string> = {
    'payment_default': 'default_event',
    'covenant_breach': 'default_event',
    'representation_breach': 'potential_default',
    'cross_default': 'default_event',
    'insolvency': 'default_event',
    'material_adverse_change': 'material_adverse_change',
    'change_of_control': 'change_of_control',
    'other': 'other',
  };
  return mapping[category] || 'other';
}
