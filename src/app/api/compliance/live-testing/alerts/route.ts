import { NextRequest, NextResponse } from 'next/server';
import { mockRecentAlerts } from '@/app/features/compliance/sub_LiveTesting/lib';

/**
 * GET /api/compliance/live-testing/alerts
 * Retrieves headroom alerts with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const severity = searchParams.get('severity'); // 'critical' | 'high' | 'medium' | 'low'
    const acknowledged = searchParams.get('acknowledged'); // 'true' | 'false'
    const covenant_id = searchParams.get('covenant_id');

    let alerts = [...mockRecentAlerts];

    // Filter by severity
    if (severity) {
      alerts = alerts.filter(a => a.severity === severity);
    }

    // Filter by acknowledged status
    if (acknowledged !== null) {
      const isAcknowledged = acknowledged === 'true';
      alerts = alerts.filter(a => a.acknowledged === isAcknowledged);
    }

    // Filter by covenant
    if (covenant_id) {
      alerts = alerts.filter(a => a.covenant_id === covenant_id);
    }

    return NextResponse.json({
      alerts,
      count: alerts.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/compliance/live-testing/alerts/:id/acknowledge
 * Acknowledges a headroom alert
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { alert_id, acknowledged_by } = body;

    // In a real implementation, this would:
    // 1. Update the alert in the database
    // 2. Set acknowledged = true
    // 3. Set acknowledged_at timestamp
    // 4. Set acknowledged_by user

    return NextResponse.json({
      success: true,
      alert_id,
      acknowledged: true,
      acknowledged_at: new Date().toISOString(),
      acknowledged_by,
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    return NextResponse.json(
      { error: 'Failed to acknowledge alert' },
      { status: 500 }
    );
  }
}
