import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createESGFacilitySchema } from '@/lib/validations';
import type { ESGFacilityWithKPIs } from '@/types';
import type { ESGFacility, ESGKPI } from '@/types/database';
import {
  respondSuccess,
  respondUnauthorized,
  respondNotFound,
  respondValidationError,
  respondDatabaseError,
  respondInternalError,
  groupBy,
} from '@/lib/utils';

// GET /api/esg/facilities - List all ESG facilities
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return respondUnauthorized();
    }

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return respondNotFound('User profile not found');
    }

    const { searchParams } = new URL(request.url);
    const esgLoanType = searchParams.get('esg_loan_type');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('esg_facilities')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (esgLoanType && esgLoanType !== 'all') {
      query = query.eq('esg_loan_type', esgLoanType);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`facility_name.ilike.%${search}%,borrower_name.ilike.%${search}%`);
    }

    const { data: facilities, error: facilitiesError } = await query;

    if (facilitiesError) {
      console.error('Error fetching ESG facilities:', facilitiesError);
      return respondDatabaseError('Failed to fetch ESG facilities');
    }

    // Get KPIs for each facility
    const facilityIds = (facilities || []).map((f: ESGFacility) => f.id);

    let kpisByFacility: Record<string, ESGKPI[]> = {};
    let performanceStats: Record<string, { achieved: number; total: number }> = {};

    if (facilityIds.length > 0) {
      const { data: kpis } = await supabase
        .from('esg_kpis')
        .select('*')
        .in('facility_id', facilityIds)
        .eq('is_active', true);

      kpisByFacility = groupBy(kpis || [], (kpi: ESGKPI) => kpi.facility_id);

      // Get performance stats (targets achieved)
      const { data: targets } = await supabase
        .from('esg_targets')
        .select('kpi_id, target_status')
        .in('kpi_id', (kpis || []).map((k: ESGKPI) => k.id));

      const targetsByKpi = groupBy(
        (targets || []) as Array<{ kpi_id: string; target_status: string }>,
        (t: { kpi_id: string; target_status: string }) => t.kpi_id
      );

      // Calculate performance stats per facility
      for (const facilityId of facilityIds) {
        const facilityKpis = kpisByFacility[facilityId] || [];
        let achieved = 0;
        let total = 0;
        for (const kpi of facilityKpis) {
          const kpiTargets = targetsByKpi[kpi.id] || [];
          total += kpiTargets.length;
          achieved += kpiTargets.filter((t) => t.target_status === 'achieved').length;
        }
        performanceStats[facilityId] = { achieved, total };
      }
    }

    const facilitiesWithKPIs: ESGFacilityWithKPIs[] = (facilities || []).map(
      (facility: ESGFacility) => {
        const kpis = kpisByFacility[facility.id] || [];
        const stats = performanceStats[facility.id] || { achieved: 0, total: 0 };

        return {
          ...facility,
          kpis,
          kpi_count: kpis.length,
          targets_achieved: stats.achieved,
          targets_total: stats.total,
          overall_performance_status: stats.total > 0
            ? (stats.achieved / stats.total >= 0.8 ? 'on_track' : stats.achieved / stats.total >= 0.5 ? 'at_risk' : 'off_track')
            : 'pending',
        };
      }
    );

    return respondSuccess<ESGFacilityWithKPIs[]>(facilitiesWithKPIs);
  } catch (error) {
    console.error('Error in GET /api/esg/facilities:', error);
    return respondInternalError();
  }
}

// POST /api/esg/facilities - Create a new ESG facility
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return respondUnauthorized();
    }

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return respondNotFound('User profile not found');
    }

    const body = await request.json();
    const parsed = createESGFacilitySchema.safeParse(body);

    if (!parsed.success) {
      return respondValidationError('Invalid request data', parsed.error.flatten());
    }

    const { data: facility, error: createError } = await supabase
      .from('esg_facilities')
      .insert({
        ...parsed.data,
        organization_id: userData.organization_id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating ESG facility:', createError);
      return respondDatabaseError('Failed to create ESG facility');
    }

    // Log activity
    await supabase.from('activities').insert({
      organization_id: userData.organization_id,
      source_module: 'esg',
      activity_type: 'esg_facility_created',
      actor_id: user.id,
      entity_type: 'esg_facility',
      entity_id: facility.id,
      entity_name: facility.facility_name,
      description: `Created ESG facility ${facility.facility_name} (${facility.esg_loan_type}) for ${facility.borrower_name}`,
    });

    return respondSuccess<ESGFacility>(facility, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/esg/facilities:', error);
    return respondInternalError();
  }
}
