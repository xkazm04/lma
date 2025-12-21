import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { peerRankingRequestSchema, portfolioPeerRankingRequestSchema } from '@/lib/validations/esg';
import {
  generateFacilityPeerRanking,
  generatePeerBenchmarkInsights,
} from '@/lib/llm/esg';
import type { ApiResponse } from '@/types';
import type {
  FacilityPeerRanking,
  PeerBenchmarkInsights,
  PortfolioPeerBenchmark,
  KPICategory,
  PeerPositioning,
  PerformanceTrend,
} from '@/app/features/esg/lib/types';

interface PeerKPIStats {
  kpi_name: string;
  kpi_category: KPICategory;
  values: number[];
  min: number;
  max: number;
  mean: number;
  median: number;
  p25: number;
  p75: number;
}

/**
 * Calculate statistics for peer KPI data
 */
function calculatePeerStats(values: number[]): { min: number; max: number; mean: number; median: number; p25: number; p75: number } {
  if (values.length === 0) {
    return { min: 0, max: 0, mean: 0, median: 0, p25: 0, p75: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const len = sorted.length;

  return {
    min: sorted[0],
    max: sorted[len - 1],
    mean: values.reduce((a, b) => a + b, 0) / len,
    median: len % 2 === 0 ? (sorted[len / 2 - 1] + sorted[len / 2]) / 2 : sorted[Math.floor(len / 2)],
    p25: sorted[Math.floor(len * 0.25)],
    p75: sorted[Math.floor(len * 0.75)],
  };
}

/**
 * Get positioning label from percentile
 */
function getPositioning(percentile: number): PeerPositioning {
  if (percentile >= 80) return 'leader';
  if (percentile >= 60) return 'above_average';
  if (percentile >= 40) return 'average';
  if (percentile >= 20) return 'below_average';
  return 'laggard';
}

// POST /api/esg/peer-rankings - Get peer percentile rankings for a facility
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    const body = await request.json();
    const parsed = peerRankingRequestSchema.safeParse(body);

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

    const { facility_id, peer_group_id, kpi_ids, kpi_category, period, include_trajectory } = parsed.data;

    // Fetch the target facility
    const { data: facility, error: facilityError } = await supabase
      .from('esg_facilities')
      .select('*')
      .eq('id', facility_id)
      .eq('organization_id', userData.organization_id)
      .single();

    if (facilityError || !facility) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'ESG facility not found',
        },
      }, { status: 404 });
    }

    // Fetch peer group definition or use default industry-based peer group
    let peerGroupInfo = {
      id: 'default-industry',
      name: `${facility.borrower_industry || 'All Industries'} Peer Group`,
      description: `Facilities in the ${facility.borrower_industry || 'all industries'} sector`,
      member_count: 0,
    };

    let peerFilter: { column: string; value: string } | null = null;

    if (peer_group_id) {
      const { data: peerGroup } = await supabase
        .from('esg_peer_groups')
        .select('*')
        .eq('id', peer_group_id)
        .eq('organization_id', userData.organization_id)
        .single();

      if (peerGroup) {
        peerGroupInfo = {
          id: peerGroup.id,
          name: peerGroup.name,
          description: peerGroup.description,
          member_count: 0,
        };
        // Custom peer group filtering would apply here based on definition
      }
    } else if (facility.borrower_industry) {
      // Default to industry-based peer group
      peerFilter = { column: 'borrower_industry', value: facility.borrower_industry };
    }

    // Fetch facility KPIs
    let kpiQuery = supabase
      .from('esg_kpis')
      .select('*')
      .eq('facility_id', facility_id)
      .eq('is_active', true);

    if (kpi_ids && kpi_ids.length > 0) {
      kpiQuery = kpiQuery.in('id', kpi_ids);
    }
    if (kpi_category) {
      kpiQuery = kpiQuery.eq('kpi_category', kpi_category);
    }

    const { data: facilityKpis, error: kpiError } = await kpiQuery;

    if (kpiError || !facilityKpis || facilityKpis.length === 0) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'No KPIs found for this facility',
        },
      }, { status: 404 });
    }

    // Fetch peer facilities
    let peerFacilitiesQuery = supabase
      .from('esg_facilities')
      .select('id, facility_name, borrower_name, borrower_industry')
      .eq('organization_id', userData.organization_id)
      .eq('status', 'active')
      .neq('id', facility_id);

    if (peerFilter) {
      peerFacilitiesQuery = peerFacilitiesQuery.eq(peerFilter.column, peerFilter.value);
    }

    const { data: peerFacilities } = await peerFacilitiesQuery;

    const peerFacilityIds = (peerFacilities || []).map(f => f.id);
    peerGroupInfo.member_count = peerFacilityIds.length + 1; // Include target facility

    // Fetch KPI data for all peer facilities
    const peerKpiData: PeerKPIStats[] = [];

    if (peerFacilityIds.length > 0) {
      // Get the most recent performance data for each KPI across peer facilities
      const { data: peerPerformances } = await supabase
        .from('esg_kpis')
        .select(`
          kpi_name,
          kpi_category,
          facility_id,
          esg_performance!inner(actual_value, reporting_period_end)
        `)
        .in('facility_id', peerFacilityIds)
        .eq('is_active', true);

      // Aggregate peer data by KPI name
      const kpiValueMap = new Map<string, { values: number[]; category: KPICategory }>();

      if (peerPerformances) {
        for (const perf of peerPerformances) {
          const performances = perf.esg_performance as Array<{ actual_value: number; reporting_period_end: string }>;
          if (performances && performances.length > 0) {
            // Get the most recent performance
            const sorted = performances.sort((a, b) =>
              new Date(b.reporting_period_end).getTime() - new Date(a.reporting_period_end).getTime()
            );
            const latestValue = sorted[0].actual_value;

            const existing = kpiValueMap.get(perf.kpi_name) || {
              values: [],
              category: perf.kpi_category as KPICategory,
            };
            existing.values.push(latestValue);
            kpiValueMap.set(perf.kpi_name, existing);
          }
        }
      }

      // Convert to stats format
      for (const [kpiName, data] of kpiValueMap.entries()) {
        const stats = calculatePeerStats(data.values);
        peerKpiData.push({
          kpi_name: kpiName,
          kpi_category: data.category,
          values: data.values,
          ...stats,
        });
      }
    }

    // Get latest performance for facility KPIs
    const facilityKpiIds = facilityKpis.map(k => k.id);
    const { data: facilityPerformances } = await supabase
      .from('esg_performance')
      .select('kpi_id, actual_value, reporting_period_end')
      .in('kpi_id', facilityKpiIds)
      .order('reporting_period_end', { ascending: false });

    // Build context for peer ranking
    const facilityKpisWithValues = facilityKpis.map(kpi => {
      const perf = facilityPerformances?.find(p => p.kpi_id === kpi.id);
      return {
        kpi_id: kpi.id,
        kpi_name: kpi.kpi_name,
        kpi_category: kpi.kpi_category as KPICategory,
        unit: kpi.unit_of_measure,
        current_value: perf?.actual_value || kpi.baseline_value || 0,
        baseline_value: kpi.baseline_value || 0,
        target_value: 0, // Will be populated from targets
        improvement_direction: kpi.improvement_direction as 'increase' | 'decrease',
      };
    });

    // Fetch historical performance for trajectory analysis
    let historicalPerformance: Array<{
      period: string;
      kpi_name: string;
      facility_value: number;
      peer_median: number;
    }> | undefined;

    if (include_trajectory) {
      const startDate = period?.start || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = period?.end || new Date().toISOString().split('T')[0];

      const { data: historicalData } = await supabase
        .from('esg_performance')
        .select('kpi_id, actual_value, reporting_period_end')
        .in('kpi_id', facilityKpiIds)
        .gte('reporting_period_end', startDate)
        .lte('reporting_period_end', endDate)
        .order('reporting_period_end', { ascending: true });

      if (historicalData && historicalData.length > 0) {
        historicalPerformance = historicalData.map(h => {
          const kpi = facilityKpis.find(k => k.id === h.kpi_id);
          const peerData = peerKpiData.find(p => p.kpi_name === kpi?.kpi_name);
          return {
            period: h.reporting_period_end,
            kpi_name: kpi?.kpi_name || '',
            facility_value: h.actual_value,
            peer_median: peerData?.median || h.actual_value,
          };
        });
      }
    }

    // Generate peer ranking
    const ranking = await generateFacilityPeerRanking({
      facility: {
        facility_id: facility.id,
        facility_name: facility.facility_name,
        borrower_name: facility.borrower_name,
        borrower_industry: facility.borrower_industry || 'Unknown',
        esg_loan_type: facility.esg_loan_type,
      },
      peer_group: peerGroupInfo,
      facility_kpis: facilityKpisWithValues,
      peer_kpi_data: peerKpiData,
      historical_performance: historicalPerformance,
    });

    return NextResponse.json<ApiResponse<FacilityPeerRanking>>({
      success: true,
      data: ranking,
    });
  } catch (error) {
    console.error('Error in POST /api/esg/peer-rankings:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// GET /api/esg/peer-rankings/insights - Get AI-generated peer benchmarking insights
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get('facility_id');

    if (!facilityId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'facility_id is required',
        },
      }, { status: 400 });
    }

    // First generate the ranking
    const rankingResponse = await POST(new NextRequest(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify({ facility_id: facilityId, include_trajectory: true }),
    }));

    const rankingResult = await rankingResponse.json() as ApiResponse<FacilityPeerRanking>;

    if (!rankingResult.success || !rankingResult.data) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: rankingResult.error || {
          code: 'INTERNAL_ERROR',
          message: 'Failed to generate peer ranking',
        },
      }, { status: 400 });
    }

    const facilityRanking = rankingResult.data;

    // Fetch peer leaders for insights
    const { data: peerFacilities } = await supabase
      .from('esg_facilities')
      .select('id, facility_name, borrower_name')
      .eq('organization_id', userData.organization_id)
      .eq('borrower_industry', facilityRanking.borrower_industry)
      .eq('status', 'active')
      .neq('id', facilityId)
      .limit(10);

    // For simplicity, assume top performers have higher KPI achievement
    const peerLeaders = (peerFacilities || []).slice(0, 3).map(p => ({
      facility_name: p.facility_name,
      borrower_name: p.borrower_name,
      overall_percentile: 85, // Placeholder - would calculate from actual data
      top_kpis: facilityRanking.kpi_rankings.slice(0, 2).map(k => k.kpi_name),
    }));

    // Generate AI insights
    const insights = await generatePeerBenchmarkInsights({
      facility_ranking: facilityRanking,
      peer_leaders: peerLeaders,
    });

    return NextResponse.json<ApiResponse<PeerBenchmarkInsights>>({
      success: true,
      data: insights,
    });
  } catch (error) {
    console.error('Error in GET /api/esg/peer-rankings:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
