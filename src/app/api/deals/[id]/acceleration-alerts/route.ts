import { NextRequest, NextResponse } from 'next/server';
import type { DealHealthSummary, DealAccelerationAlert } from '@/app/features/deals/lib/velocity-types';
import {
  calculateVelocityMetrics,
  generateMockActivities,
  generateMockParticipantEngagement,
  DEFAULT_BENCHMARK,
} from '@/app/features/deals/lib/velocity-service';
import { assessStallRisk } from '@/app/features/deals/lib/stall-prediction';
import { generateAlerts } from '@/app/features/deals/lib/alert-generator';
import { mockDeal, mockCategories, mockParticipants } from '@/app/features/deals/lib/mock-data';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/deals/[id]/acceleration-alerts
 * Returns deal health summary with velocity metrics, stall risk assessment, and alerts
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: dealId } = await params;

    // In a real implementation, this would fetch from the database
    // For now, we use mock data and generate realistic metrics

    // Generate mock activity data
    const activities = generateMockActivities(dealId);
    const participantEngagement = generateMockParticipantEngagement(dealId, activities);

    // Calculate velocity metrics
    const totalTerms = mockCategories.reduce((sum, c) => sum + c.terms.length, 0);
    const agreedTerms = mockCategories.reduce(
      (sum, c) => sum + c.terms.filter((t) => t.negotiation_status === 'agreed').length,
      0
    );

    const velocityMetrics = calculateVelocityMetrics(
      dealId,
      activities,
      participantEngagement,
      totalTerms,
      agreedTerms,
      DEFAULT_BENCHMARK
    );

    // Assess stall risk
    const stallRisk = assessStallRisk(
      dealId,
      velocityMetrics,
      participantEngagement,
      mockCategories,
      DEFAULT_BENCHMARK
    );

    // Generate alerts
    const alerts = generateAlerts(
      dealId,
      mockDeal.deal_name,
      stallRisk,
      velocityMetrics,
      participantEngagement,
      mockCategories
    );

    // Determine overall health
    let overallHealth: 'healthy' | 'at_risk' | 'critical';
    let healthScore: number;

    if (stallRisk.riskLevel === 'critical') {
      overallHealth = 'critical';
      healthScore = Math.max(0, 30 - stallRisk.overallRiskScore / 3);
    } else if (stallRisk.riskLevel === 'high' || stallRisk.riskLevel === 'medium') {
      overallHealth = 'at_risk';
      healthScore = Math.max(30, 70 - stallRisk.overallRiskScore / 2);
    } else {
      overallHealth = 'healthy';
      healthScore = Math.max(70, 100 - stallRisk.overallRiskScore);
    }

    // Generate executive summary
    const executiveSummary = generateExecutiveSummary(
      mockDeal.deal_name,
      velocityMetrics,
      stallRisk,
      alerts
    );

    // Generate priorities and indicators
    const topPriorities = generateTopPriorities(alerts, stallRisk);
    const positiveIndicators = generatePositiveIndicators(velocityMetrics, participantEngagement);
    const concernAreas = generateConcernAreas(stallRisk, velocityMetrics);

    const healthSummary: DealHealthSummary = {
      dealId,
      dealName: mockDeal.deal_name,
      overallHealth,
      healthScore,
      velocityMetrics,
      stallRisk,
      activeAlerts: alerts,
      participantEngagement,
      executiveSummary,
      topPriorities,
      positiveIndicators,
      concernAreas,
    };

    return NextResponse.json({
      success: true,
      data: healthSummary,
    });
  } catch (error) {
    console.error('Error fetching acceleration alerts:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch deal acceleration alerts',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/deals/[id]/acceleration-alerts
 * Acknowledge or act on an alert
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: dealId } = await params;
    const body = await request.json();

    const { alertId, action, interventionId, notes } = body as {
      alertId: string;
      action: 'acknowledge' | 'dismiss' | 'act' | 'resolve';
      interventionId?: string;
      notes?: string;
    };

    if (!alertId || !action) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'alertId and action are required',
          },
        },
        { status: 400 }
      );
    }

    // In a real implementation, this would update the database
    // For now, we return a success response with the updated alert status

    const now = new Date().toISOString();
    let updatedStatus: DealAccelerationAlert['status'];

    switch (action) {
      case 'acknowledge':
        updatedStatus = 'active';
        break;
      case 'dismiss':
        updatedStatus = 'dismissed';
        break;
      case 'act':
        updatedStatus = 'acted_upon';
        break;
      case 'resolve':
        updatedStatus = 'resolved';
        break;
      default:
        updatedStatus = 'active';
    }

    return NextResponse.json({
      success: true,
      data: {
        alertId,
        dealId,
        status: updatedStatus,
        acknowledgedAt: action === 'acknowledge' ? now : null,
        actionTakenAt: action === 'act' ? now : null,
        selectedInterventionId: interventionId || null,
        resolutionNotes: notes || null,
        updatedAt: now,
      },
    });
  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to update alert',
        },
      },
      { status: 500 }
    );
  }
}

// Helper functions for generating summary content

function generateExecutiveSummary(
  dealName: string,
  metrics: DealHealthSummary['velocityMetrics'],
  risk: DealHealthSummary['stallRisk'],
  alerts: DealAccelerationAlert[]
): string {
  const urgentAlerts = alerts.filter((a) => a.severity === 'critical' || a.severity === 'urgent');

  if (risk.riskLevel === 'critical') {
    return `${dealName} requires immediate attention. Deal velocity has declined significantly with ${risk.riskFactors.length} risk factors identified. ${urgentAlerts.length} urgent intervention${urgentAlerts.length !== 1 ? 's' : ''} recommended. Historical patterns suggest a ${Math.round((1 - (risk.matchedPatterns[0]?.historicalCloseRate || 0.5)) * 100)}% probability of extended delays without action.`;
  } else if (risk.riskLevel === 'high') {
    return `${dealName} is showing warning signs. ${metrics.daysSinceLastActivity} day${metrics.daysSinceLastActivity !== 1 ? 's' : ''} since last activity with engagement at ${Math.round(metrics.participantEngagementRate)}%. Consider the ${urgentAlerts.length} suggested intervention${urgentAlerts.length !== 1 ? 's' : ''} to maintain momentum.`;
  } else if (risk.riskLevel === 'medium') {
    return `${dealName} is progressing with some areas requiring attention. Current velocity is at ${Math.round(metrics.comparedToHistoricalAverage * 100)}% of historical average. ${alerts.length} optimization opportunit${alerts.length !== 1 ? 'ies' : 'y'} identified.`;
  } else {
    return `${dealName} is progressing well. Velocity metrics are healthy with ${Math.round(metrics.participantEngagementRate)}% participant engagement. ${metrics.estimatedDaysToCompletion ? `Estimated ${metrics.estimatedDaysToCompletion} days to completion based on current pace.` : 'Maintain current momentum for optimal results.'}`;
  }
}

function generateTopPriorities(
  alerts: DealAccelerationAlert[],
  risk: DealHealthSummary['stallRisk']
): string[] {
  const priorities: string[] = [];

  // Add priorities from urgent alerts
  const urgentAlerts = alerts
    .filter((a) => a.severity === 'critical' || a.severity === 'urgent')
    .slice(0, 3);

  for (const alert of urgentAlerts) {
    const primaryIntervention = alert.interventions.find((i) => i.priority === 'primary');
    if (primaryIntervention) {
      priorities.push(primaryIntervention.title);
    }
  }

  // Add priorities from risk factors
  const highRiskFactors = risk.riskFactors.filter((f) => f.severity === 'high').slice(0, 2);
  for (const factor of highRiskFactors) {
    if (!priorities.some((p) => p.toLowerCase().includes(factor.factorType.replace(/_/g, ' ')))) {
      priorities.push(`Address ${factor.factorType.replace(/_/g, ' ')}`);
    }
  }

  return priorities.slice(0, 3);
}

function generatePositiveIndicators(
  metrics: DealHealthSummary['velocityMetrics'],
  participants: DealHealthSummary['participantEngagement']
): string[] {
  const indicators: string[] = [];

  if (metrics.participantEngagementRate >= 60) {
    indicators.push(`Strong participant engagement (${Math.round(metrics.participantEngagementRate)}%)`);
  }

  if (metrics.velocityTrend === 'accelerating') {
    indicators.push('Deal velocity is accelerating');
  } else if (metrics.velocityTrend === 'stable' && metrics.comparedToHistoricalAverage >= 0.8) {
    indicators.push('Maintaining healthy negotiation pace');
  }

  if (metrics.responseRateToProposals >= 70) {
    indicators.push(`High proposal response rate (${Math.round(metrics.responseRateToProposals)}%)`);
  }

  if (metrics.agreedTermsPerDay >= 0.3) {
    indicators.push('Consistent progress on term agreements');
  }

  const activeParticipants = participants.filter((p) => p.isActive);
  if (activeParticipants.length >= 3) {
    indicators.push(`${activeParticipants.length} parties actively engaged`);
  }

  return indicators.slice(0, 4);
}

function generateConcernAreas(
  risk: DealHealthSummary['stallRisk'],
  metrics: DealHealthSummary['velocityMetrics']
): string[] {
  const concerns: string[] = [];

  for (const factor of risk.riskFactors.slice(0, 3)) {
    concerns.push(factor.description);
  }

  if (metrics.comparedToHistoricalAverage < 0.7) {
    concerns.push(
      `Deal velocity at ${Math.round(metrics.comparedToHistoricalAverage * 100)}% of typical pace`
    );
  }

  if (risk.matchedPatterns.length > 0 && risk.matchedPatterns[0].similarity >= 0.6) {
    concerns.push(
      `Pattern match: "${risk.matchedPatterns[0].patternName}" (${Math.round(risk.matchedPatterns[0].similarity * 100)}% similarity)`
    );
  }

  return concerns.slice(0, 4);
}
