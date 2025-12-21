/**
 * Evolution Engine API - Market Conditions endpoint
 *
 * GET: Get current market conditions snapshot
 * POST: Trigger market analysis for specific facility context
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateMockMarketConditions,
  analyzeMarketConditions,
} from '@/lib/llm/evolution-engine';
import type { MarketConditionsSnapshot } from '@/app/features/documents/sub_Evolution/lib/types';

/**
 * GET /api/documents/evolution/market
 * Returns current market conditions snapshot
 */
export async function GET() {
  try {
    const marketConditions = generateMockMarketConditions();

    // Calculate some derived metrics
    const avgInterestRateChange =
      marketConditions.interestRates.reduce((sum, r) => sum + r.changeBps, 0) /
      marketConditions.interestRates.length;

    const avgCreditSpreadChange =
      marketConditions.creditSpreads.reduce((sum, s) => sum + s.changeBps, 0) /
      marketConditions.creditSpreads.length;

    return NextResponse.json({
      success: true,
      data: {
        snapshot: marketConditions,
        summary: {
          interestRates: {
            averageChange: avgInterestRateChange,
            trend:
              avgInterestRateChange > 5
                ? 'rising'
                : avgInterestRateChange < -5
                  ? 'falling'
                  : 'stable',
            volatility: 'normal',
          },
          creditSpreads: {
            averageChange: avgCreditSpreadChange,
            trend:
              avgCreditSpreadChange > 10
                ? 'widening'
                : avgCreditSpreadChange < -10
                  ? 'tightening'
                  : 'stable',
            riskSentiment: avgCreditSpreadChange > 20 ? 'risk_off' : 'neutral',
          },
          regulatory: {
            activeAnnouncements: marketConditions.regulatoryAnnouncements.length,
            highImpactAnnouncements: marketConditions.regulatoryAnnouncements.filter(
              (a) => a.impactLevel === 'high' || a.impactLevel === 'critical'
            ).length,
          },
          overallSentiment: marketConditions.marketSentiment.overall,
        },
      },
    });
  } catch (error) {
    console.error('Get market conditions error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'MARKET_CONDITIONS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get market conditions',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/documents/evolution/market
 * Analyze market conditions for a specific facility context
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      facilityName,
      borrowerName,
      borrowerIndustry,
      facilityType,
      baseRate,
      currentMargin,
      maturityDate,
      totalCommitment,
    } = body;

    if (!facilityName || !borrowerName) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'facilityName and borrowerName are required',
          },
        },
        { status: 400 }
      );
    }

    const marketConditions = generateMockMarketConditions();

    // Perform AI analysis of market conditions for this facility
    const analysis = await analyzeMarketConditions(marketConditions, {
      facilityName,
      borrowerName,
      borrowerIndustry: borrowerIndustry || 'General',
      facilityType: facilityType || 'Revolving Credit',
      baseRate: baseRate || 'SOFR',
      currentMargin: currentMargin || 150,
      maturityDate: maturityDate || new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      totalCommitment: totalCommitment || 100000000,
    });

    return NextResponse.json({
      success: true,
      data: {
        marketConditions,
        analysis,
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Market analysis error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'MARKET_ANALYSIS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to analyze market conditions',
        },
      },
      { status: 500 }
    );
  }
}
