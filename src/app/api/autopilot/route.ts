/**
 * Portfolio Autopilot API
 *
 * Main endpoint for autopilot dashboard data, predictions, and interventions.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  mockAutopilotDashboardData,
  mockAutopilotMetrics,
  mockBreachPredictions,
  mockInterventions,
  mockAutopilotAlerts,
  mockAutopilotActions,
  mockAutopilotSettings,
  type AutopilotStatus,
  type AutopilotSettings,
  type InterventionStatus,
} from '@/app/features/dashboard/lib/mocks';

/**
 * GET /api/autopilot
 *
 * Fetch autopilot dashboard data with optional filtering.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'dashboard';
    const riskLevel = searchParams.get('riskLevel');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    switch (view) {
      case 'dashboard':
        return NextResponse.json({
          success: true,
          data: mockAutopilotDashboardData,
        });

      case 'predictions':
        let predictions = mockBreachPredictions;
        if (riskLevel) {
          predictions = predictions.filter((p) => p.riskLevel === riskLevel);
        }
        return NextResponse.json({
          success: true,
          data: {
            predictions: predictions.slice(0, limit),
            totalCount: predictions.length,
            highRiskCount: predictions.filter((p) => p.riskLevel === 'high' || p.riskLevel === 'critical').length,
            criticalCount: predictions.filter((p) => p.riskLevel === 'critical').length,
          },
        });

      case 'interventions':
        let interventions = mockInterventions;
        if (status) {
          interventions = interventions.filter((i) => i.status === status);
        }
        return NextResponse.json({
          success: true,
          data: {
            interventions: interventions.slice(0, limit),
            totalCount: interventions.length,
            pendingCount: interventions.filter((i) => i.status === 'pending').length,
            approvedCount: interventions.filter((i) => i.status === 'approved').length,
          },
        });

      case 'alerts':
        const unreadOnly = searchParams.get('unreadOnly') === 'true';
        let alerts = mockAutopilotAlerts;
        if (unreadOnly) {
          alerts = alerts.filter((a) => !a.read);
        }
        return NextResponse.json({
          success: true,
          data: {
            alerts: alerts.slice(0, limit),
            totalCount: alerts.length,
            unreadCount: alerts.filter((a) => !a.read).length,
          },
        });

      case 'metrics':
        return NextResponse.json({
          success: true,
          data: mockAutopilotMetrics,
        });

      case 'settings':
        return NextResponse.json({
          success: true,
          data: mockAutopilotSettings,
        });

      case 'actions':
        return NextResponse.json({
          success: true,
          data: {
            actions: mockAutopilotActions.slice(0, limit),
            totalCount: mockAutopilotActions.length,
          },
        });

      default:
        return NextResponse.json(
          { success: false, error: `Unknown view: ${view}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Autopilot API] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch autopilot data',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/autopilot
 *
 * Perform autopilot actions: update settings, approve/reject interventions, etc.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'update_settings': {
        const { settings } = body as { action: string; settings: Partial<AutopilotSettings> };
        // In production, this would update the database
        const updatedSettings = {
          ...mockAutopilotSettings,
          ...settings,
        };
        return NextResponse.json({
          success: true,
          data: updatedSettings,
          message: 'Settings updated successfully',
        });
      }

      case 'update_status': {
        const { status } = body as { action: string; status: AutopilotStatus };
        const validStatuses: AutopilotStatus[] = ['active', 'paused', 'learning', 'disabled'];
        if (!validStatuses.includes(status)) {
          return NextResponse.json(
            { success: false, error: `Invalid status: ${status}` },
            { status: 400 }
          );
        }
        return NextResponse.json({
          success: true,
          data: { status },
          message: `Autopilot status changed to ${status}`,
        });
      }

      case 'approve_intervention': {
        const { interventionId, approvedBy } = body as {
          action: string;
          interventionId: string;
          approvedBy: string;
        };
        const intervention = mockInterventions.find((i) => i.id === interventionId);
        if (!intervention) {
          return NextResponse.json(
            { success: false, error: `Intervention not found: ${interventionId}` },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          data: {
            ...intervention,
            status: 'approved' as InterventionStatus,
            approvedBy,
            approvedAt: new Date().toISOString(),
          },
          message: 'Intervention approved successfully',
        });
      }

      case 'reject_intervention': {
        const { interventionId, rejectionReason } = body as {
          action: string;
          interventionId: string;
          rejectionReason: string;
        };
        const intervention = mockInterventions.find((i) => i.id === interventionId);
        if (!intervention) {
          return NextResponse.json(
            { success: false, error: `Intervention not found: ${interventionId}` },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          data: {
            ...intervention,
            status: 'rejected' as InterventionStatus,
            rejectionReason,
          },
          message: 'Intervention rejected',
        });
      }

      case 'execute_intervention': {
        const { interventionId } = body as { action: string; interventionId: string };
        const intervention = mockInterventions.find((i) => i.id === interventionId);
        if (!intervention) {
          return NextResponse.json(
            { success: false, error: `Intervention not found: ${interventionId}` },
            { status: 404 }
          );
        }
        if (intervention.status !== 'approved') {
          return NextResponse.json(
            { success: false, error: 'Intervention must be approved before execution' },
            { status: 400 }
          );
        }
        return NextResponse.json({
          success: true,
          data: {
            ...intervention,
            status: 'executed' as InterventionStatus,
            executedAt: new Date().toISOString(),
          },
          message: 'Intervention executed successfully',
        });
      }

      case 'mark_alert_read': {
        const { alertId } = body as { action: string; alertId: string };
        const alert = mockAutopilotAlerts.find((a) => a.id === alertId);
        if (!alert) {
          return NextResponse.json(
            { success: false, error: `Alert not found: ${alertId}` },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          data: { ...alert, read: true },
          message: 'Alert marked as read',
        });
      }

      case 'run_analysis': {
        // In production, this would trigger the AI analysis pipeline
        return NextResponse.json({
          success: true,
          data: {
            analysisId: `analysis-${Date.now()}`,
            startedAt: new Date().toISOString(),
            estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          },
          message: 'Analysis started. Results will be available shortly.',
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Autopilot API] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process autopilot action',
      },
      { status: 500 }
    );
  }
}
