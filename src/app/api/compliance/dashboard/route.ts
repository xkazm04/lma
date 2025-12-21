import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, ComplianceDashboardStats, CalendarItem } from '@/types';

// GET /api/compliance/dashboard - Get dashboard stats
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

    interface FacilityData {
      id: string;
      status: string;
    }

    // Get facilities for org
    const { data: facilities } = await (supabase
      .from('compliance_facilities') as ReturnType<typeof supabase.from>)
      .select('id, status')
      .eq('organization_id', userData.organization_id) as { data: FacilityData[] | null };

    const facilityIds = (facilities || []).map((f: { id: string }) => f.id);

    if (facilityIds.length === 0) {
      return NextResponse.json<ApiResponse<ComplianceDashboardStats>>({
        success: true,
        data: {
          total_facilities: 0,
          facilities_in_compliance: 0,
          facilities_in_waiver: 0,
          facilities_in_default: 0,
          upcoming_deadlines_7_days: 0,
          upcoming_deadlines_30_days: 0,
          overdue_items: 0,
          pending_waivers: 0,
          recent_activity: [],
          upcoming_items: [],
          facilities_at_risk: [],
        },
      });
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Count facilities by status
    const facilityList = facilities || [];
    const facilityStats = {
      total: facilityList.length,
      active: facilityList.filter((f: { status: string }) => f.status === 'active').length,
      waiver: facilityList.filter((f: { status: string }) => f.status === 'waiver_period').length,
      default: facilityList.filter((f: { status: string }) => f.status === 'default').length,
    };

    // Count upcoming events in 7 days
    const { count: upcoming7 } = await (supabase
      .from('compliance_events') as ReturnType<typeof supabase.from>)
      .select('*', { count: 'exact', head: true })
      .in('facility_id', facilityIds)
      .in('status', ['pending', 'upcoming'])
      .gte('deadline_date', today)
      .lte('deadline_date', in7Days);

    // Count upcoming events in 30 days
    const { count: upcoming30 } = await (supabase
      .from('compliance_events') as ReturnType<typeof supabase.from>)
      .select('*', { count: 'exact', head: true })
      .in('facility_id', facilityIds)
      .in('status', ['pending', 'upcoming'])
      .gte('deadline_date', today)
      .lte('deadline_date', in30Days);

    // Count overdue items
    const { count: overdue } = await (supabase
      .from('compliance_events') as ReturnType<typeof supabase.from>)
      .select('*', { count: 'exact', head: true })
      .in('facility_id', facilityIds)
      .eq('status', 'overdue');

    // Count pending waivers
    const { count: pendingWaivers } = await (supabase
      .from('compliance_waivers') as ReturnType<typeof supabase.from>)
      .select('*', { count: 'exact', head: true })
      .in('facility_id', facilityIds)
      .eq('status', 'pending');

    // Get recent activity
    const { data: activities } = await (supabase
      .from('activities') as ReturnType<typeof supabase.from>)
      .select('*')
      .eq('organization_id', userData.organization_id)
      .eq('source_module', 'compliance')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get upcoming items (next 14 days)
    const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const upcomingItems: CalendarItem[] = [];

    interface EventData {
      id: string;
      deadline_date: string;
      status: string;
      compliance_obligations: {
        name: string;
        obligation_type: string;
      };
      compliance_facilities: {
        id: string;
        facility_name: string;
        borrower_name: string;
      };
    }

    // Upcoming compliance events
    const { data: upcomingEvents } = await (supabase
      .from('compliance_events') as ReturnType<typeof supabase.from>)
      .select(`
        id,
        deadline_date,
        status,
        compliance_obligations!inner (
          name,
          obligation_type
        ),
        compliance_facilities!inner (
          id,
          facility_name,
          borrower_name
        )
      `)
      .in('facility_id', facilityIds)
      .in('status', ['pending', 'upcoming'])
      .gte('deadline_date', today)
      .lte('deadline_date', in14Days)
      .order('deadline_date')
      .limit(10) as { data: EventData[] | null };

    for (const event of upcomingEvents || []) {
      upcomingItems.push({
        id: event.id,
        date: event.deadline_date,
        type: 'compliance_event',
        title: event.compliance_obligations.name,
        facility_id: event.compliance_facilities.id,
        facility_name: event.compliance_facilities.facility_name,
        borrower_name: event.compliance_facilities.borrower_name,
        status: event.status,
        details: {
          obligation_type: event.compliance_obligations.obligation_type,
        },
      });
    }

    interface CovenantData {
      id: string;
      name: string;
      covenant_type: string;
      next_test_date: string | null;
      compliance_facilities: {
        id: string;
        facility_name: string;
        borrower_name: string;
      };
    }

    // Upcoming covenant tests
    const { data: upcomingTests } = await (supabase
      .from('compliance_covenants') as ReturnType<typeof supabase.from>)
      .select(`
        id,
        name,
        covenant_type,
        next_test_date,
        compliance_facilities!inner (
          id,
          facility_name,
          borrower_name
        )
      `)
      .in('facility_id', facilityIds)
      .eq('status', 'active')
      .gte('next_test_date', today)
      .lte('next_test_date', in14Days)
      .order('next_test_date')
      .limit(5) as { data: CovenantData[] | null };

    for (const covenant of upcomingTests || []) {
      if (covenant.next_test_date) {
        upcomingItems.push({
          id: covenant.id,
          date: covenant.next_test_date,
          type: 'covenant_test',
          title: `${covenant.name} Test`,
          facility_id: covenant.compliance_facilities.id,
          facility_name: covenant.compliance_facilities.facility_name,
          borrower_name: covenant.compliance_facilities.borrower_name,
          status: 'pending',
          details: {
            covenant_type: covenant.covenant_type,
          },
        });
      }
    }

    // Sort upcoming items by date
    upcomingItems.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    interface CovenantTestData {
      covenant_id: string;
      test_result: string;
      headroom_percentage: number | null;
      compliance_covenants: {
        name: string;
        facility_id: string;
      };
      compliance_facilities: {
        id: string;
        facility_name: string;
        borrower_name: string;
      };
    }

    // Get facilities at risk (low headroom or in waiver period)
    const { data: covenantTests } = await (supabase
      .from('covenant_tests') as ReturnType<typeof supabase.from>)
      .select(`
        covenant_id,
        test_result,
        headroom_percentage,
        compliance_covenants!inner (
          name,
          facility_id
        ),
        compliance_facilities!inner (
          id,
          facility_name,
          borrower_name
        )
      `)
      .in('facility_id', facilityIds)
      .order('test_date', { ascending: false }) as { data: CovenantTestData[] | null };

    // Get latest test per covenant and identify at-risk facilities
    const latestTests = new Map<string, { headroom: number; test_result: string; facility_id: string; facility_name: string; borrower_name: string; covenant_name: string }>();
    for (const test of covenantTests || []) {
      if (!latestTests.has(test.covenant_id)) {
        latestTests.set(test.covenant_id, {
          headroom: test.headroom_percentage || 0,
          test_result: test.test_result,
          facility_id: test.compliance_facilities.id,
          facility_name: test.compliance_facilities.facility_name,
          borrower_name: test.compliance_facilities.borrower_name,
          covenant_name: test.compliance_covenants.name,
        });
      }
    }

    const facilitiesAtRisk: Array<{
      facility_id: string;
      facility_name: string;
      borrower_name: string;
      risk_reason: string;
      covenant_name?: string;
      headroom_percentage?: number;
    }> = [];

    interface FacilityDetail {
      id: string;
      facility_name: string;
      borrower_name: string;
    }

    // Add facilities in waiver or default
    for (const facility of facilities || []) {
      if (facility.status === 'waiver_period' || facility.status === 'default') {
        const { data: fac } = await (supabase
          .from('compliance_facilities') as ReturnType<typeof supabase.from>)
          .select('id, facility_name, borrower_name')
          .eq('id', facility.id)
          .single() as { data: FacilityDetail | null };

        if (fac) {
          facilitiesAtRisk.push({
            facility_id: fac.id,
            facility_name: fac.facility_name,
            borrower_name: fac.borrower_name,
            risk_reason: facility.status === 'default' ? 'In default' : 'In waiver period',
          });
        }
      }
    }

    // Add facilities with low headroom (<15%)
    for (const [, test] of latestTests) {
      if (test.headroom !== null && test.headroom < 15 && test.test_result === 'pass') {
        // Avoid duplicates
        if (!facilitiesAtRisk.find(f => f.facility_id === test.facility_id)) {
          facilitiesAtRisk.push({
            facility_id: test.facility_id,
            facility_name: test.facility_name,
            borrower_name: test.borrower_name,
            risk_reason: 'Low covenant headroom',
            covenant_name: test.covenant_name,
            headroom_percentage: test.headroom,
          });
        }
      }
    }

    const dashboardStats: ComplianceDashboardStats = {
      total_facilities: facilityStats.total,
      facilities_in_compliance: facilityStats.active,
      facilities_in_waiver: facilityStats.waiver,
      facilities_in_default: facilityStats.default,
      upcoming_deadlines_7_days: upcoming7 || 0,
      upcoming_deadlines_30_days: upcoming30 || 0,
      overdue_items: overdue || 0,
      pending_waivers: pendingWaivers || 0,
      recent_activity: activities || [],
      upcoming_items: upcomingItems.slice(0, 10),
      facilities_at_risk: facilitiesAtRisk,
    };

    return NextResponse.json<ApiResponse<ComplianceDashboardStats>>({
      success: true,
      data: dashboardStats,
    });
  } catch (error) {
    console.error('Error in GET /api/compliance/dashboard:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
