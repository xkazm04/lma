import { NextRequest, NextResponse } from 'next/server';
import { mockLiveCovenants, mockLiveTestingStats } from '@/app/features/compliance/sub_LiveTesting/lib';

/**
 * GET /api/compliance/live-testing
 * Retrieves all live-monitored covenants with real-time data
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get('filter'); // 'all' | 'critical' | 'warning' | 'healthy'
    const facilityId = searchParams.get('facility_id');

    let covenants = [...mockLiveCovenants];

    // Filter by facility if specified
    if (facilityId) {
      covenants = covenants.filter(c => c.facility_id === facilityId);
    }

    // Filter by headroom threshold
    if (filter && filter !== 'all') {
      covenants = covenants.filter(covenant => {
        if (filter === 'critical') {
          return covenant.current_headroom_percentage < 5;
        }
        if (filter === 'warning') {
          return covenant.current_headroom_percentage >= 5 && covenant.current_headroom_percentage < 15;
        }
        if (filter === 'healthy') {
          return covenant.current_headroom_percentage >= 15;
        }
        return true;
      });
    }

    return NextResponse.json({
      covenants,
      stats: mockLiveTestingStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching live testing data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live testing data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/compliance/live-testing/refresh
 * Triggers a manual refresh of covenant calculations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { covenant_id } = body;

    // In a real implementation, this would:
    // 1. Fetch latest financial data from integration
    // 2. Recalculate covenant ratios
    // 3. Update headroom percentages
    // 4. Check if any alert thresholds are crossed
    // 5. Trigger notifications if needed

    // For now, return mock success
    return NextResponse.json({
      success: true,
      covenant_id,
      calculated_at: new Date().toISOString(),
      message: 'Covenant calculation refreshed successfully',
    });
  } catch (error) {
    console.error('Error refreshing covenant:', error);
    return NextResponse.json(
      { error: 'Failed to refresh covenant calculation' },
      { status: 500 }
    );
  }
}
