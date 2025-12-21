import { NextRequest, NextResponse } from 'next/server';
import type {
  PortfolioComparisonResult,
  PortfolioRiskScore,
  AggregatedTerm,
  PortfolioAnomaly,
  PortfolioSummary,
  PortfolioDocument,
  AnomalyType,
  TermCategory,
} from '@/app/features/documents/sub_PortfolioComparison/lib/types';

// Mock market benchmark data
const MARKET_BENCHMARKS = {
  initial_margin: { min: 1.5, max: 5.0, median: 3.0, mean: 3.1 },
  leverage_ratio: { min: 2.5, max: 6.0, median: 4.0, mean: 4.2 },
  interest_coverage: { min: 1.5, max: 4.0, median: 2.5, mean: 2.6 },
  commitment_fee: { min: 0.25, max: 0.75, median: 0.375, mean: 0.4 },
};

/**
 * Detect anomalies in aggregated terms
 */
function detectAnomalies(
  terms: AggregatedTerm[],
  documents: PortfolioDocument[]
): PortfolioAnomaly[] {
  const anomalies: PortfolioAnomaly[] = [];
  let anomalyId = 1;

  for (const term of terms) {
    // Check for low confidence extractions
    for (const value of term.values) {
      if (value.confidence > 0 && value.confidence < 0.85) {
        anomalies.push({
          id: `anom-${anomalyId++}`,
          type: 'low_confidence',
          severity: 'info',
          termCategory: term.termCategory,
          termName: term.termName,
          documentId: value.documentId,
          documentName: value.documentName,
          value: value.value,
          description: `Extraction confidence of ${(value.confidence * 100).toFixed(0)}% is below the 85% threshold.`,
          recommendation: `Manually verify the ${term.termName} in the source document.`,
        });
      }
    }

    // Check for missing terms (when most documents have it but some don't)
    const missingDocs = term.values.filter((v) => v.value === null);
    const presentDocs = term.values.filter((v) => v.value !== null);

    if (missingDocs.length > 0 && presentDocs.length >= 2) {
      for (const missing of missingDocs) {
        anomalies.push({
          id: `anom-${anomalyId++}`,
          type: 'missing_term',
          severity: presentDocs.length >= 3 ? 'critical' : 'warning',
          termCategory: term.termCategory,
          termName: term.termName,
          documentId: missing.documentId,
          documentName: missing.documentName,
          value: null,
          description: `${term.termName} is missing from this document but present in ${presentDocs.length} other portfolio documents.`,
          recommendation: `Verify if this term was intentionally omitted or if extraction failed.`,
        });
      }
    }

    // Check for statistical outliers (if numeric)
    if (
      term.statistics.mean !== undefined &&
      term.statistics.stdDev !== undefined &&
      term.statistics.stdDev > 0
    ) {
      for (const value of term.values) {
        if (typeof value.value === 'number') {
          const zScore = Math.abs((value.value - term.statistics.mean) / term.statistics.stdDev);
          if (zScore > 2) {
            const deviation = ((value.value - term.statistics.mean) / term.statistics.mean) * 100;
            anomalies.push({
              id: `anom-${anomalyId++}`,
              type: 'outlier',
              severity: zScore > 3 ? 'warning' : 'info',
              termCategory: term.termCategory,
              termName: term.termName,
              documentId: value.documentId,
              documentName: value.documentName,
              value: value.value,
              expectedRange: {
                min: term.statistics.min!,
                max: term.statistics.max!,
                portfolioAvg: term.statistics.mean,
              },
              deviation,
              description: `Value is ${Math.abs(deviation).toFixed(1)}% ${deviation > 0 ? 'above' : 'below'} portfolio average. This is a statistical outlier (${zScore.toFixed(1)} standard deviations from mean).`,
              recommendation: `Review if this deviation is justified by the specific deal terms or risk profile.`,
            });
          }
        }
      }
    }

    // Check against market benchmarks
    if (term.marketBenchmark) {
      for (const value of term.values) {
        if (typeof value.value === 'number') {
          const { marketMin, marketMax, marketMean } = term.marketBenchmark;

          if (value.value < marketMin || value.value > marketMax) {
            const deviation = ((value.value - marketMean) / marketMean) * 100;
            anomalies.push({
              id: `anom-${anomalyId++}`,
              type: 'market_deviation',
              severity: value.value < marketMin * 0.8 || value.value > marketMax * 1.2 ? 'critical' : 'warning',
              termCategory: term.termCategory,
              termName: term.termName,
              documentId: value.documentId,
              documentName: value.documentName,
              value: value.value,
              expectedRange: {
                min: marketMin,
                max: marketMax,
                marketAvg: marketMean,
                portfolioAvg: term.statistics.mean,
              },
              deviation,
              description: `Value ${value.value < marketMin ? 'below market minimum' : 'exceeds market maximum'} (${marketMin} - ${marketMax}). ${Math.abs(deviation).toFixed(1)}% ${deviation > 0 ? 'above' : 'below'} market average.`,
              recommendation: `Review pricing/terms. Consider if deviation is justified by credit profile or market conditions.`,
            });
          }
        }
      }
    }
  }

  return anomalies;
}

/**
 * Calculate portfolio risk score
 */
function calculateRiskScore(
  terms: AggregatedTerm[],
  anomalies: PortfolioAnomaly[]
): PortfolioRiskScore {
  // Count anomalies by category
  const anomaliesByCategory = anomalies.reduce((acc, a) => {
    acc[a.termCategory] = (acc[a.termCategory] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate category scores
  const categoryScores: PortfolioRiskScore['breakdown'] = [
    'financial_terms',
    'covenants',
    'interest_rates',
    'fees',
    'key_dates',
    'parties',
  ].map((category) => {
    const categoryTerms = terms.filter((t) => t.termCategory === category);
    const categoryAnomalies = anomalies.filter((a) => a.termCategory === category);

    // Base score on anomaly count and severity
    let score = 0;
    for (const a of categoryAnomalies) {
      score += a.severity === 'critical' ? 30 : a.severity === 'warning' ? 15 : 5;
    }

    // Normalize to 100
    score = Math.min(100, score);

    return {
      category: category as TermCategory,
      score,
      contributingFactors: categoryAnomalies.slice(0, 2).map((a) => a.description.slice(0, 50) + '...'),
    };
  });

  // Calculate sub-scores
  const termConsistencyScore = Math.round(
    categoryScores.reduce((sum, c) => sum + c.score, 0) / categoryScores.length * 0.8
  );

  const marketDeviationAnomalies = anomalies.filter((a) => a.type === 'market_deviation');
  const marketAlignmentScore = Math.min(100, marketDeviationAnomalies.length * 25);

  const missingTermAnomalies = anomalies.filter((a) => a.type === 'missing_term');
  const lowConfidenceAnomalies = anomalies.filter((a) => a.type === 'low_confidence');
  const coverageScore = Math.min(100, (missingTermAnomalies.length * 20) + (lowConfidenceAnomalies.length * 10));

  // Overall score is weighted average
  const overallScore = Math.round(
    termConsistencyScore * 0.4 + marketAlignmentScore * 0.35 + coverageScore * 0.25
  );

  return {
    overallScore,
    termConsistencyScore,
    marketAlignmentScore,
    coverageScore,
    breakdown: categoryScores,
  };
}

/**
 * GET /api/documents/portfolio-comparison
 * Analyze extracted terms across all portfolio documents
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const documentIds = searchParams.get('documentIds')?.split(',').filter(Boolean) || [];

    // In production, this would fetch real data from the database
    // For now, we'll import and use mock data
    const {
      mockPortfolioDocuments,
      mockAggregatedTerms,
      mockPortfolioComparisonResult,
    } = await import('@/app/features/documents/sub_PortfolioComparison/lib/mock-data');

    // Filter documents if specific IDs provided
    let documents = mockPortfolioDocuments;
    if (documentIds.length > 0) {
      documents = documents.filter((d) => documentIds.includes(d.id));
    }

    // Detect anomalies
    const anomalies = detectAnomalies(mockAggregatedTerms, documents);

    // Calculate risk score
    const riskScore = calculateRiskScore(mockAggregatedTerms, anomalies);

    // Build summary
    const summary: PortfolioSummary = {
      totalDocuments: documents.length,
      documentsByType: documents.reduce((acc, d) => {
        acc[d.documentType] = (acc[d.documentType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      totalTermsAnalyzed: mockAggregatedTerms.length,
      termsWithAnomalies: mockAggregatedTerms.filter((t) => t.hasOutliers).length,
      anomaliesBySeverity: {
        info: anomalies.filter((a) => a.severity === 'info').length,
        warning: anomalies.filter((a) => a.severity === 'warning').length,
        critical: anomalies.filter((a) => a.severity === 'critical').length,
      },
      anomaliesByType: anomalies.reduce((acc, a) => {
        acc[a.type] = (acc[a.type] || 0) + 1;
        return acc;
      }, {} as Record<AnomalyType, number>),
      avgExtractionConfidence:
        documents.reduce((sum, d) => sum + d.extractionConfidence, 0) / documents.length,
      lastAnalyzedAt: new Date().toISOString(),
    };

    const result: PortfolioComparisonResult = {
      portfolioId: 'portfolio-1',
      analyzedAt: new Date().toISOString(),
      documents,
      terms: mockAggregatedTerms,
      anomalies,
      summary,
      aiInsights: mockPortfolioComparisonResult.aiInsights,
    };

    return NextResponse.json({
      success: true,
      data: result,
      riskScore,
    });
  } catch (error) {
    console.error('Portfolio comparison error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PORTFOLIO_COMPARISON_ERROR',
          message: 'Failed to analyze portfolio documents',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/documents/portfolio-comparison
 * Trigger a new portfolio analysis (with AI insights generation)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentIds, includeMarketBenchmarks = true, generateInsights = true } = body;

    // In production, this would:
    // 1. Fetch extraction data for all documents
    // 2. Aggregate terms across documents
    // 3. Detect anomalies using statistical analysis
    // 4. Fetch market benchmarks from external sources
    // 5. Generate AI insights using LLM

    // For now, simulate processing time and return mock data
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const { mockPortfolioComparisonResult, mockPortfolioRiskScore } = await import(
      '@/app/features/documents/sub_PortfolioComparison/lib/mock-data'
    );

    return NextResponse.json({
      success: true,
      data: mockPortfolioComparisonResult,
      riskScore: mockPortfolioRiskScore,
    });
  } catch (error) {
    console.error('Portfolio comparison error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PORTFOLIO_COMPARISON_ERROR',
          message: 'Failed to analyze portfolio documents',
        },
      },
      { status: 500 }
    );
  }
}
