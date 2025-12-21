/**
 * Autopilot Action Queue API
 *
 * Endpoints for managing the confidence-weighted action queue where
 * high-confidence tasks execute automatically while uncertain ones
 * require human approval.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  mockActionQueueItems,
  mockActionQueueMetrics,
  mockAutoApprovalThresholds,
  mockActionQueueDashboardData,
  type ActionQueueStatus,
  type AutoApprovalThresholds,
} from '@/app/features/dashboard/lib/mocks';

/**
 * GET /api/autopilot/action-queue
 *
 * Fetch action queue data with optional filtering.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'dashboard';
    const status = searchParams.get('status') as ActionQueueStatus | null;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const sortBy = searchParams.get('sortBy') || 'queuePriority';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    switch (view) {
      case 'dashboard':
        return NextResponse.json({
          success: true,
          data: mockActionQueueDashboardData,
        });

      case 'queue':
        let items = [...mockActionQueueItems];

        // Filter by status
        if (status) {
          items = items.filter((item) => item.status === status);
        }

        // Sort
        items.sort((a, b) => {
          let comparison = 0;
          switch (sortBy) {
            case 'queuePriority':
              comparison = a.queuePriority - b.queuePriority;
              break;
            case 'confidenceScore':
              comparison = a.confidenceScore - b.confidenceScore;
              break;
            case 'queuedAt':
              comparison = new Date(a.queuedAt).getTime() - new Date(b.queuedAt).getTime();
              break;
            default:
              comparison = a.queuePriority - b.queuePriority;
          }
          return sortOrder === 'desc' ? -comparison : comparison;
        });

        // Paginate
        const total = items.length;
        items = items.slice(offset, offset + limit);

        return NextResponse.json({
          success: true,
          data: {
            items,
            pagination: {
              total,
              limit,
              offset,
              hasMore: offset + limit < total,
            },
          },
        });

      case 'metrics':
        return NextResponse.json({
          success: true,
          data: mockActionQueueMetrics,
        });

      case 'thresholds':
        return NextResponse.json({
          success: true,
          data: mockAutoApprovalThresholds,
        });

      case 'pending_review':
        const pendingReview = mockActionQueueItems
          .filter((item) => item.status === 'pending_review')
          .sort((a, b) => b.queuePriority - a.queuePriority);
        return NextResponse.json({
          success: true,
          data: {
            items: pendingReview,
            count: pendingReview.length,
          },
        });

      case 'auto_approved':
        const autoApproved = mockActionQueueItems
          .filter((item) => item.status === 'auto_approved')
          .sort((a, b) => {
            const timeA = a.scheduledExecutionTime ? new Date(a.scheduledExecutionTime).getTime() : Infinity;
            const timeB = b.scheduledExecutionTime ? new Date(b.scheduledExecutionTime).getTime() : Infinity;
            return timeA - timeB;
          });
        return NextResponse.json({
          success: true,
          data: {
            items: autoApproved,
            count: autoApproved.length,
          },
        });

      default:
        return NextResponse.json(
          { success: false, error: `Unknown view: ${view}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Action Queue API] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch action queue data',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/autopilot/action-queue
 *
 * Perform action queue operations: approve, reject, execute, update thresholds.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'approve': {
        const { actionId, approvedBy } = body as {
          action: string;
          actionId: string;
          approvedBy: string;
        };

        const queueItem = mockActionQueueItems.find((item) => item.id === actionId);
        if (!queueItem) {
          return NextResponse.json(
            { success: false, error: `Action not found: ${actionId}` },
            { status: 404 }
          );
        }

        if (queueItem.status !== 'pending_review') {
          return NextResponse.json(
            { success: false, error: 'Action is not pending review' },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          data: {
            ...queueItem,
            status: 'auto_approved' as ActionQueueStatus,
            requiresHumanReview: false,
            autoApprovalReason: `Manually approved by ${approvedBy}`,
            scheduledExecutionTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          },
          message: 'Action approved and queued for execution',
        });
      }

      case 'reject': {
        const { actionId, reason } = body as {
          action: string;
          actionId: string;
          reason: string;
        };

        const queueItem = mockActionQueueItems.find((item) => item.id === actionId);
        if (!queueItem) {
          return NextResponse.json(
            { success: false, error: `Action not found: ${actionId}` },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          data: {
            ...queueItem,
            status: 'failed' as ActionQueueStatus,
            executionResult: {
              success: false,
              outcome: `Rejected: ${reason}`,
            },
          },
          message: 'Action rejected',
        });
      }

      case 'execute_now': {
        const { actionId } = body as { action: string; actionId: string };

        const queueItem = mockActionQueueItems.find((item) => item.id === actionId);
        if (!queueItem) {
          return NextResponse.json(
            { success: false, error: `Action not found: ${actionId}` },
            { status: 404 }
          );
        }

        if (!['pending_review', 'auto_approved', 'queued'].includes(queueItem.status)) {
          return NextResponse.json(
            { success: false, error: `Cannot execute action with status: ${queueItem.status}` },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          data: {
            ...queueItem,
            status: 'executing' as ActionQueueStatus,
            executionStartedAt: new Date().toISOString(),
          },
          message: 'Action execution started',
        });
      }

      case 'cancel': {
        const { actionId, reason } = body as {
          action: string;
          actionId: string;
          reason?: string;
        };

        const queueItem = mockActionQueueItems.find((item) => item.id === actionId);
        if (!queueItem) {
          return NextResponse.json(
            { success: false, error: `Action not found: ${actionId}` },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          data: {
            ...queueItem,
            status: 'failed' as ActionQueueStatus,
            executionResult: {
              success: false,
              outcome: reason || 'Cancelled by user',
            },
          },
          message: 'Action cancelled',
        });
      }

      case 'update_thresholds': {
        const { thresholds } = body as {
          action: string;
          thresholds: Partial<AutoApprovalThresholds>;
        };

        const updatedThresholds = {
          ...mockAutoApprovalThresholds,
          ...thresholds,
        };

        return NextResponse.json({
          success: true,
          data: updatedThresholds,
          message: 'Thresholds updated successfully',
        });
      }

      case 'evaluate_auto_approval': {
        // Evaluate if an intervention should be auto-approved based on confidence
        const { interventionId, confidenceScore, interventionType, impactLevel } = body as {
          action: string;
          interventionId: string;
          confidenceScore: number;
          interventionType: string;
          impactLevel: 'low' | 'medium' | 'high' | 'critical';
        };

        const thresholds = mockAutoApprovalThresholds;
        const typeThreshold = thresholds.typeThresholds[interventionType as keyof typeof thresholds.typeThresholds] || thresholds.globalThreshold;
        const impactThreshold = thresholds.impactThresholds[impactLevel];
        const effectiveThreshold = Math.max(typeThreshold, impactThreshold);

        const alwaysRequiresApproval = thresholds.riskFactors.alwaysRequireApproval.includes(
          interventionType as never
        );

        const isAutoApprovalEligible = !alwaysRequiresApproval && confidenceScore >= effectiveThreshold;

        const blockers: string[] = [];
        if (alwaysRequiresApproval) {
          blockers.push(`${interventionType} interventions always require manual approval`);
        }
        if (confidenceScore < typeThreshold) {
          blockers.push(`Confidence (${confidenceScore}%) below type threshold (${typeThreshold}%)`);
        }
        if (confidenceScore < impactThreshold) {
          blockers.push(`Confidence (${confidenceScore}%) below impact threshold (${impactThreshold}%)`);
        }

        return NextResponse.json({
          success: true,
          data: {
            interventionId,
            isAutoApprovalEligible,
            confidenceScore,
            effectiveThreshold,
            blockers,
            recommendation: isAutoApprovalEligible ? 'auto_approve' : 'require_review',
          },
        });
      }

      case 'batch_approve': {
        const { actionIds, approvedBy } = body as {
          action: string;
          actionIds: string[];
          approvedBy: string;
        };

        const results = actionIds.map((id) => {
          const item = mockActionQueueItems.find((i) => i.id === id);
          if (!item) {
            return { id, success: false, error: 'Not found' };
          }
          if (item.status !== 'pending_review') {
            return { id, success: false, error: 'Not pending review' };
          }
          return { id, success: true };
        });

        const successful = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success).length;

        return NextResponse.json({
          success: true,
          data: {
            results,
            summary: {
              total: actionIds.length,
              successful,
              failed,
            },
          },
          message: `Batch approval complete: ${successful} approved, ${failed} failed`,
        });
      }

      case 'reschedule': {
        const { actionId, newExecutionTime } = body as {
          action: string;
          actionId: string;
          newExecutionTime: string;
        };

        const queueItem = mockActionQueueItems.find((item) => item.id === actionId);
        if (!queueItem) {
          return NextResponse.json(
            { success: false, error: `Action not found: ${actionId}` },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          data: {
            ...queueItem,
            scheduledExecutionTime: newExecutionTime,
          },
          message: 'Action rescheduled',
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Action Queue API] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process action queue request',
      },
      { status: 500 }
    );
  }
}
