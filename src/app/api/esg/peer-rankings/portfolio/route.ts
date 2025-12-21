import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { portfolioPeerRankingRequestSchema } from '@/lib/validations/esg';
import { generateFacilityPeerRanking } from '@/lib/llm/esg';
import type { ApiResponse } from '@/types';
import type {
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

// POST /api/esg/peer-rankings/portfolio - Get portfolio-wide peer benchmarking
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
    const parsed = portfolioPeerRankingRequestSchema.safeParse(body);

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

    const { facility_ids, peer_group_id, kpi_category, period, include_trajectory } = parsed.data;

    // Fetch organization's facilities
    let facilitiesQuery = supabase
      .from('esg_facilities')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .eq('status', 'active');

    if (facility_ids && facility_ids.length > 0) {
      facilitiesQuery = facilitiesQuery.in('id', facility_ids);
    }

    const { data: facilities, error: facilitiesError } = await facilitiesQuery;

    if (facilitiesError || !facilities || facilities.length === 0) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'No ESG facilities found',
        },
      }, { status: 404 });
    }

    // Determine peer group
    let peerGroupInfo = {
      id: peer_group_id || 'organization-portfolio',
      name: 'Organization Portfolio',
      member_count: facilities.length,
    };

    // Collect all KPIs across the portfolio
    const facilityIds = facilities.map(f => f.id);
    let kpiQuery = supabase
      .from('esg_kpis')
      .select('*')
      .in('facility_id', facilityIds)
      .eq('is_active', true);

    if (kpi_category) {
      kpiQuery = kpiQuery.eq('kpi_category', kpi_category);
    }

    const { data: allKpis } = await kpiQuery;

    if (!allKpis || allKpis.length === 0) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'No KPIs found for portfolio facilities',
        },
      }, { status: 404 });
    }

    // Get latest performance for all KPIs
    const allKpiIds = allKpis.map(k => k.id);
    const { data: allPerformances } = await supabase
      .from('esg_performance')
      .select('kpi_id, actual_value, reporting_period_end')
      .in('kpi_id', allKpiIds)
      .order('reporting_period_end', { ascending: false });

    // Build peer KPI statistics across portfolio
    const kpiValueMap = new Map<string, { values: number[]; category: KPICategory }>();

    for (const kpi of allKpis) {
      const latestPerf = allPerformances?.find(p => p.kpi_id === kpi.id);
      if (latestPerf) {
        const existing = kpiValueMap.get(kpi.kpi_name) || {
          values: [],
          category: kpi.kpi_category as KPICategory,
        };
        existing.values.push(latestPerf.actual_value);
        kpiValueMap.set(kpi.kpi_name, existing);
      }
    }

    const peerKpiData: PeerKPIStats[] = [];
    for (const [kpiName, data] of kpiValueMap.entries()) {
      const stats = calculatePeerStats(data.values);
      peerKpiData.push({
        kpi_name: kpiName,
        kpi_category: data.category,
        values: data.values,
        ...stats,
      });
    }

    // Generate rankings for each facility
    const facilityRankings: Array<{
      facility_id: string;
      facility_name: string;
      borrower_name: string;
      overall_percentile: number;
      positioning: PeerPositioning;
      trend: PerformanceTrend;
    }> = [];

    const categoryPerformanceMap = new Map<KPICategory, { percentiles: number[]; facilities: { name: string; percentile: number }[] }>();

    for (const facility of facilities) {
      const facilityKpis = allKpis.filter(k => k.facility_id === facility.id);

      if (facilityKpis.length === 0) continue;

      const facilityKpisWithValues = facilityKpis.map(kpi => {
        const perf = allPerformances?.find(p => p.kpi_id === kpi.id);
        return {
          kpi_id: kpi.id,
          kpi_name: kpi.kpi_name,
          kpi_category: kpi.kpi_category as KPICategory,
          unit: kpi.unit_of_measure,
          current_value: perf?.actual_value || kpi.baseline_value || 0,
          baseline_value: kpi.baseline_value || 0,
          target_value: 0,
          improvement_direction: kpi.improvement_direction as 'increase' | 'decrease',
        };
      });

      // Exclude this facility from peer data for ranking
      const peerDataExcludingFacility = peerKpiData.map(pd => {
        const facilityKpi = facilityKpis.find(k => k.kpi_name === pd.kpi_name);
        const facilityPerf = allPerformances?.find(p => p.kpi_id === facilityKpi?.id);
        const valuesExcluding = pd.values.filter(v => v !== facilityPerf?.actual_value);
        const stats = calculatePeerStats(valuesExcluding);
        return { ...pd, values: valuesExcluding, ...stats };
      });

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
        peer_kpi_data: peerDataExcludingFacility,
      });

      facilityRankings.push({
        facility_id: facility.id,
        facility_name: facility.facility_name,
        borrower_name: facility.borrower_name,
        overall_percentile: ranking.overall_percentile,
        positioning: ranking.overall_positioning,
        trend: ranking.trajectory_summary?.overall_trend || 'stable',
      });

      // Aggregate category performance
      for (const catRanking of ranking.category_rankings) {
        const existing = categoryPerformanceMap.get(catRanking.category) || { percentiles: [], facilities: [] };
        existing.percentiles.push(catRanking.percentile);
        existing.facilities.push({ name: facility.facility_name, percentile: catRanking.percentile });
        categoryPerformanceMap.set(catRanking.category, existing);
      }
    }

    // Calculate portfolio summary
    const percentiles = facilityRankings.map(f => f.overall_percentile);
    const avgPercentile = percentiles.length > 0
      ? Math.round(percentiles.reduce((a, b) => a + b, 0) / percentiles.length)
      : 50;
    const sortedPercentiles = [...percentiles].sort((a, b) => a - b);
    const medianPercentile = sortedPercentiles.length % 2 === 0
      ? (sortedPercentiles[sortedPercentiles.length / 2 - 1] + sortedPercentiles[sortedPercentiles.length / 2]) / 2
      : sortedPercentiles[Math.floor(sortedPercentiles.length / 2)];

    const portfolioSummary = {
      total_facilities: facilityRankings.length,
      avg_percentile: avgPercentile,
      median_percentile: medianPercentile,
      leaders_count: facilityRankings.filter(f => f.positioning === 'leader').length,
      above_average_count: facilityRankings.filter(f => f.positioning === 'above_average').length,
      average_count: facilityRankings.filter(f => f.positioning === 'average').length,
      below_average_count: facilityRankings.filter(f => f.positioning === 'below_average').length,
      laggards_count: facilityRankings.filter(f => f.positioning === 'laggard').length,
    };

    // Build category performance summary
    const categoryPerformance = Array.from(categoryPerformanceMap.entries()).map(([category, data]) => {
      const avgPct = Math.round(data.percentiles.reduce((a, b) => a + b, 0) / data.percentiles.length);
      const sorted = data.facilities.sort((a, b) => b.percentile - a.percentile);
      return {
        category,
        avg_percentile: avgPct,
        positioning: getPositioning(avgPct),
        best_facility: sorted[0]?.name || 'N/A',
        worst_facility: sorted[sorted.length - 1]?.name || 'N/A',
      };
    });

    // Identify improvement opportunities
    const improvementOpportunities = facilityRankings
      .filter(f => f.overall_percentile < 50)
      .slice(0, 5)
      .map(f => ({
        facility_id: f.facility_id,
        facility_name: f.facility_name,
        kpi_name: 'Overall ESG Performance',
        current_percentile: f.overall_percentile,
        target_percentile: Math.min(f.overall_percentile + 25, 75),
        required_improvement: 25 - f.overall_percentile,
        impact_assessment: `Moving ${f.facility_name} to the ${getPositioning(f.overall_percentile + 25)} tier would improve portfolio average`,
      }));

    // Best practices (placeholder - would be derived from leader analysis)
    const bestPractices = categoryPerformance.slice(0, 3).map(cp => ({
      category: cp.category,
      practice: `Industry-leading ${cp.category.replace(/_/g, ' ')} management`,
      adopted_by_leaders: portfolioSummary.leaders_count,
      recommendation: `Review ${cp.best_facility}'s approach to ${cp.category.replace(/_/g, ' ')}`,
    }));

    const result: PortfolioPeerBenchmark = {
      organization_id: userData.organization_id,
      generated_at: new Date().toISOString(),
      peer_group: peerGroupInfo,
      portfolio_summary: portfolioSummary,
      category_performance: categoryPerformance,
      facility_rankings: facilityRankings,
      improvement_opportunities: improvementOpportunities,
      best_practices: bestPractices,
    };

    return NextResponse.json<ApiResponse<PortfolioPeerBenchmark>>({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in POST /api/esg/peer-rankings/portfolio:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
