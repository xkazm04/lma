import { NextRequest, NextResponse } from 'next/server';
import {
  mockAutopilotDashboardStats,
  mockAutopilotPredictions,
  mockAutopilotAlerts,
  mockMarketSignals,
  mockTransactionPatterns,
  mockNewsSentiment,
  mockBenchmarkSignals,
} from '@/app/features/compliance/sub_Autopilot/lib';

/**
 * GET /api/compliance/autopilot
 *
 * Returns autopilot dashboard data including stats, predictions, alerts, and signals.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const include = searchParams.get('include')?.split(',') || ['all'];

  const response: Record<string, unknown> = {};

  if (include.includes('all') || include.includes('stats')) {
    response.stats = mockAutopilotDashboardStats;
  }

  if (include.includes('all') || include.includes('predictions')) {
    const riskLevel = searchParams.get('risk_level');
    let predictions = mockAutopilotPredictions;

    if (riskLevel) {
      predictions = predictions.filter(p => p.overall_risk_level === riskLevel);
    }

    response.predictions = predictions;
  }

  if (include.includes('all') || include.includes('alerts')) {
    const acknowledged = searchParams.get('acknowledged');
    let alerts = mockAutopilotAlerts;

    if (acknowledged === 'false') {
      alerts = alerts.filter(a => !a.acknowledged);
    } else if (acknowledged === 'true') {
      alerts = alerts.filter(a => a.acknowledged);
    }

    response.alerts = alerts;
  }

  if (include.includes('all') || include.includes('signals')) {
    response.signals = {
      market_data: mockMarketSignals,
      transaction_patterns: mockTransactionPatterns,
      news_sentiment: mockNewsSentiment,
      benchmarks: mockBenchmarkSignals,
    };
  }

  return NextResponse.json(response);
}

/**
 * POST /api/compliance/autopilot
 *
 * Trigger autopilot analysis for specific covenants.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, covenant_ids, facility_ids } = body;

    switch (action) {
      case 'run_prediction':
        // In production, this would trigger the LLM analysis
        return NextResponse.json({
          success: true,
          message: 'Prediction analysis queued',
          job_id: `job-${Date.now()}`,
          covenant_ids,
          estimated_completion: new Date(Date.now() + 60000).toISOString(),
        });

      case 'refresh_signals':
        // In production, this would fetch fresh signals from external sources
        return NextResponse.json({
          success: true,
          message: 'Signal refresh initiated',
          sources: ['market_data', 'transaction_patterns', 'news_sentiment', 'benchmarks'],
        });

      case 'acknowledge_alert':
        const { alert_id, user } = body;
        return NextResponse.json({
          success: true,
          message: 'Alert acknowledged',
          alert_id,
          acknowledged_by: user,
          acknowledged_at: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
