/**
 * Evolution Engine API - Main endpoint
 *
 * GET: Get evolution engine status and dashboard stats
 * POST: Trigger analysis for facilities
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateMockMarketConditions,
  generateMockAmendmentSuggestions,
  generateMockCovenantAnalysis,
} from '@/lib/llm/evolution-engine';
import type {
  EvolutionDashboardStats,
  EvolutionEngineStatus,
  AmendmentSuggestionType,
} from '@/app/features/documents/sub_Evolution/lib/types';

/**
 * GET /api/documents/evolution
 * Returns evolution engine status and dashboard statistics
 */
export async function GET() {
  try {
    const suggestions = generateMockAmendmentSuggestions();
    const covenants = generateMockCovenantAnalysis();
    const marketConditions = generateMockMarketConditions();

    // Calculate stats
    const suggestionsByPriority = {
      urgent: suggestions.filter((s) => s.priority === 'urgent').length,
      high: suggestions.filter((s) => s.priority === 'high').length,
      medium: suggestions.filter((s) => s.priority === 'medium').length,
      low: suggestions.filter((s) => s.priority === 'low').length,
    };

    const suggestionsByType = suggestions.reduce(
      (acc, s) => {
        acc[s.type] = (acc[s.type] || 0) + 1;
        return acc;
      },
      {} as Record<AmendmentSuggestionType, number>
    );

    const covenantsAtRisk = covenants.filter(
      (c) => c.riskLevel === 'at_risk' || c.riskLevel === 'tight'
    ).length;

    const averageHeadroom =
      covenants.reduce((sum, c) => sum + c.currentHeadroom, 0) / covenants.length;

    // Calculate interest rate trend
    const interestRateTrend = marketConditions.interestRates.some((r) => r.direction === 'up')
      ? 'rising'
      : marketConditions.interestRates.some((r) => r.direction === 'down')
        ? 'falling'
        : 'stable';

    // Calculate credit spread trend
    const creditSpreadTrend = marketConditions.creditSpreads.some((s) => s.direction === 'widening')
      ? 'widening'
      : marketConditions.creditSpreads.some((s) => s.direction === 'tightening')
        ? 'tightening'
        : 'stable';

    const engineStatus: EvolutionEngineStatus = {
      isRunning: true,
      lastRunAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      nextRunAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      facilitiesMonitored: 12,
      activeSuggestions: suggestions.length,
      recentAlerts: [
        {
          id: 'alert-1',
          type: 'covenant_risk',
          severity: 'warning',
          title: 'Leverage Covenant Headroom Declining',
          message: 'Apollo Industries leverage headroom has fallen below 10%',
          relatedEntity: {
            type: 'facility',
            id: 'fac-1',
            name: 'Apollo Industries Revolver',
          },
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          isRead: false,
          isDismissed: false,
        },
        {
          id: 'alert-2',
          type: 'market_movement',
          severity: 'info',
          title: 'Credit Spreads Widening',
          message: 'BBB credit spreads have widened 15bps this week',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          isRead: true,
          isDismissed: false,
        },
        {
          id: 'alert-3',
          type: 'suggestion_generated',
          severity: 'info',
          title: 'New Amendment Suggestion',
          message: 'LIBOR transition amendment suggested for Meridian Holdings',
          relatedEntity: {
            type: 'suggestion',
            id: 'sug-3',
            name: 'LIBOR Fallback Language Update',
          },
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          isRead: false,
          isDismissed: false,
        },
      ],
      health: {
        status: 'healthy',
        message: 'All systems operational',
      },
    };

    const dashboardStats: EvolutionDashboardStats = {
      totalFacilitiesMonitored: 12,
      facilitiesWithSuggestions: 3,
      activeSuggestions: suggestions.length,
      suggestionsByPriority,
      suggestionsByType,
      covenantsAtRisk,
      averageCovenantHeadroom: Math.round(averageHeadroom * 10) / 10,
      marketConditionsSummary: {
        interestRateTrend,
        creditSpreadTrend,
        recentRegulatoryChanges: marketConditions.regulatoryAnnouncements.length,
      },
      engineStatus,
      recentActivity: [
        {
          type: 'suggestion_created',
          description: 'New covenant reset suggestion for Apollo Industries',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          entityId: 'sug-1',
          entityName: 'Proactive Leverage Covenant Reset',
        },
        {
          type: 'market_scan',
          description: 'Completed market conditions scan',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          type: 'covenant_analysis',
          description: 'Analyzed 24 covenants across 12 facilities',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          type: 'regulatory_scan',
          description: 'New LIBOR transition guidance detected',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          entityId: 'reg-1',
          entityName: 'Federal Reserve LIBOR Guidance',
        },
      ],
    };

    return NextResponse.json({
      success: true,
      data: dashboardStats,
    });
  } catch (error) {
    console.error('Evolution engine status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'EVOLUTION_STATUS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get evolution engine status',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/documents/evolution
 * Trigger evolution analysis for specified facilities
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { facilityIds, forceRefresh = false, analysisType = 'full' } = body;

    // In production, this would trigger actual analysis
    // For now, return mock results
    const suggestions = generateMockAmendmentSuggestions();
    const filteredSuggestions = facilityIds?.length
      ? suggestions.filter((s) => facilityIds.includes(s.facilityId))
      : suggestions;

    return NextResponse.json({
      success: true,
      data: {
        analysisId: `analysis-${Date.now()}`,
        status: 'completed',
        facilitiesAnalyzed: facilityIds?.length || 12,
        suggestionsGenerated: filteredSuggestions.length,
        suggestions: filteredSuggestions,
        marketConditions: generateMockMarketConditions(),
        covenantAnalysis: generateMockCovenantAnalysis(),
        analyzedAt: new Date().toISOString(),
        forceRefresh,
        analysisType,
      },
    });
  } catch (error) {
    console.error('Evolution analysis error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'EVOLUTION_ANALYSIS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to run evolution analysis',
        },
      },
      { status: 500 }
    );
  }
}
