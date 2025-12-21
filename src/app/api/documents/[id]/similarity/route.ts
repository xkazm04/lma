import { NextRequest, NextResponse } from 'next/server';
import type {
  DocumentSimilarityAnalysis,
  SimilarDocument,
  TermDeviation,
  MarketBenchmark,
  FindSimilarDocumentsRequest,
  GetDeviationsRequest,
  GetMarketBenchmarksRequest,
} from '@/app/features/documents/lib/types';

// Mock data for similar documents - in production, this would come from the database
const mockSimilarDocuments: SimilarDocument[] = [
  {
    id: 'doc-2',
    filename: 'Credit Agreement - Neptune Holdings.pdf',
    documentType: 'facility_agreement',
    similarityScore: 0.87,
    date: '2024-09-15',
    borrowerName: 'Neptune Holdings LLC',
    dealReference: 'NEPTUNE-2024-001',
    totalCommitment: 450000000,
    currency: 'USD',
    matchingTerms: ['SOFR + Margin', 'Leverage Covenant', 'Interest Coverage', 'Term Loan Structure'],
    similaritySummary: 'Similar deal structure with comparable leverage and interest coverage covenants. Both are senior secured term loans with SOFR-based pricing and 5-year tenors.',
  },
  {
    id: 'doc-3',
    filename: 'Facility Agreement - Titan Industries.pdf',
    documentType: 'facility_agreement',
    similarityScore: 0.79,
    date: '2024-07-22',
    borrowerName: 'Titan Industries Inc.',
    dealReference: 'TITAN-2024-002',
    totalCommitment: 600000000,
    currency: 'USD',
    matchingTerms: ['Syndicated Structure', 'Financial Covenants', 'New York Law', 'Quarterly Testing'],
    similaritySummary: 'Comparable syndicated facility with similar covenant package. Both deals feature quarterly covenant testing and New York law governing.',
  },
  {
    id: 'doc-4',
    filename: 'Term Loan Agreement - Quantum Corp.pdf',
    documentType: 'facility_agreement',
    similarityScore: 0.72,
    date: '2024-05-10',
    borrowerName: 'Quantum Corporation',
    dealReference: 'QUANTUM-2024-001',
    totalCommitment: 350000000,
    currency: 'USD',
    matchingTerms: ['Term Loan', 'Floating Rate', 'Administrative Agent'],
    similaritySummary: 'Similar term loan structure with floating rate mechanism. Both utilize the same administrative agent framework.',
  },
  {
    id: 'doc-5',
    filename: 'Senior Secured Credit Facility - Atlas Group.pdf',
    documentType: 'facility_agreement',
    similarityScore: 0.68,
    date: '2024-03-18',
    borrowerName: 'Atlas Group Holdings',
    dealReference: 'ATLAS-2024-001',
    totalCommitment: 750000000,
    currency: 'USD',
    matchingTerms: ['Senior Secured', 'Covenant Package', 'Material Adverse Change'],
    similaritySummary: 'Larger deal with similar senior secured structure and comparable MAC clause formulation.',
  },
];

// Mock data for term deviations
const mockDeviations: TermDeviation[] = [
  {
    id: 'dev-1',
    termName: 'Initial Margin',
    category: 'financial_terms',
    currentValue: '3.25%',
    normValue: '3.00%',
    deviationDirection: 'better',
    deviationPercentage: 8.3,
    explanation: 'The initial margin of 3.25% is 25 basis points above our standard rate of 3.00% for comparable credit profiles. This represents favorable pricing for the lender, providing additional spread income.',
    severity: 'low',
    clauseReference: 'Section 2.3(a)',
    pageNumber: 15,
  },
  {
    id: 'dev-2',
    termName: 'Maximum Leverage Ratio',
    category: 'covenants',
    currentValue: '4.50x',
    normValue: '4.00x',
    deviationDirection: 'worse',
    deviationPercentage: 12.5,
    explanation: 'The maximum leverage ratio of 4.50x exceeds our standard threshold of 4.00x by 0.50x. This provides the borrower with more financial flexibility but increases credit risk exposure.',
    severity: 'medium',
    clauseReference: 'Section 7.1(a)',
    pageNumber: 45,
  },
  {
    id: 'dev-3',
    termName: 'Minimum Interest Coverage Ratio',
    category: 'covenants',
    currentValue: '3.00x',
    normValue: '3.00x',
    deviationDirection: 'neutral',
    deviationPercentage: 0,
    explanation: 'The minimum interest coverage ratio is in line with organizational standards.',
    severity: 'low',
    clauseReference: 'Section 7.1(b)',
    pageNumber: 46,
  },
  {
    id: 'dev-4',
    termName: 'Financial Reporting Deadline',
    category: 'covenants',
    currentValue: '90 days',
    normValue: '60 days',
    deviationDirection: 'worse',
    deviationPercentage: 50,
    explanation: 'The 90-day deadline for annual financial statements significantly exceeds our standard 60-day requirement. This delays our ability to monitor borrower performance and could mask developing credit issues.',
    severity: 'high',
    clauseReference: 'Section 6.1(a)',
    pageNumber: 32,
  },
  {
    id: 'dev-5',
    termName: 'Prepayment Premium',
    category: 'financial_terms',
    currentValue: '1.00%',
    normValue: '2.00%',
    deviationDirection: 'worse',
    deviationPercentage: -50,
    explanation: 'The prepayment premium of 1.00% is below our standard 2.00%. This reduces call protection and increases refinancing risk for the lender.',
    severity: 'medium',
    clauseReference: 'Section 2.5',
    pageNumber: 18,
  },
];

// Mock data for market benchmarks
const mockMarketBenchmarks: MarketBenchmark[] = [
  {
    id: 'bench-1',
    termName: 'Initial Margin',
    category: 'financial_terms',
    currentValue: '3.25%',
    marketAverage: '3.15%',
    marketMedian: '3.00%',
    marketRangeMin: '2.50%',
    marketRangeMax: '4.00%',
    percentile: 62,
    sampleSize: 127,
    benchmarkPeriod: 'Last 12 months',
    industrySegment: 'General Corporate',
    assessment: 'above_market',
    marketInsight: 'Current margin is in the upper half of market distribution. Recent market trends show slight compression in spreads due to increased competition among lenders.',
  },
  {
    id: 'bench-2',
    termName: 'Maximum Leverage Ratio',
    category: 'covenants',
    currentValue: '4.50x',
    marketAverage: '4.25x',
    marketMedian: '4.25x',
    marketRangeMin: '3.50x',
    marketRangeMax: '5.50x',
    percentile: 55,
    sampleSize: 112,
    benchmarkPeriod: 'Last 12 months',
    industrySegment: 'General Corporate',
    assessment: 'at_market',
    marketInsight: 'Leverage covenant is slightly above market average but within normal range. Market has seen covenant loosening trend over past 6 months.',
  },
  {
    id: 'bench-3',
    termName: 'Facility Tenor',
    category: 'key_dates',
    currentValue: '5 years',
    marketAverage: '5.2 years',
    marketMedian: '5 years',
    marketRangeMin: '3 years',
    marketRangeMax: '7 years',
    percentile: 48,
    sampleSize: 134,
    benchmarkPeriod: 'Last 12 months',
    industrySegment: 'General Corporate',
    assessment: 'at_market',
    marketInsight: 'Standard 5-year tenor aligns with market norms. No significant deviation from typical deal structures.',
  },
  {
    id: 'bench-4',
    termName: 'Commitment Fee',
    category: 'financial_terms',
    currentValue: '0.375%',
    marketAverage: '0.40%',
    marketMedian: '0.375%',
    marketRangeMin: '0.25%',
    marketRangeMax: '0.50%',
    percentile: 45,
    sampleSize: 98,
    benchmarkPeriod: 'Last 12 months',
    industrySegment: 'General Corporate',
    assessment: 'below_market',
    marketInsight: 'Commitment fee is at the market median but slightly below average. Consider negotiating upward to capture additional fee income.',
  },
  {
    id: 'bench-5',
    termName: 'Interest Coverage Ratio',
    category: 'covenants',
    currentValue: '3.00x',
    marketAverage: '2.75x',
    marketMedian: '2.50x',
    marketRangeMin: '2.00x',
    marketRangeMax: '4.00x',
    percentile: 68,
    sampleSize: 108,
    benchmarkPeriod: 'Last 12 months',
    industrySegment: 'General Corporate',
    assessment: 'above_market',
    marketInsight: 'Interest coverage covenant is tighter than market average, providing stronger credit protection. This is favorable for lender risk management.',
  },
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const analysisType = searchParams.get('type') || 'full';

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (analysisType === 'similar') {
      const maxResults = parseInt(searchParams.get('maxResults') || '10', 10);
      const minSimilarity = parseFloat(searchParams.get('minSimilarity') || '0.5');

      const filteredDocs = mockSimilarDocuments
        .filter((doc) => doc.similarityScore >= minSimilarity)
        .slice(0, maxResults);

      return NextResponse.json({
        success: true,
        data: filteredDocs,
      });
    }

    if (analysisType === 'deviations') {
      const minSeverity = searchParams.get('minSeverity') as TermDeviation['severity'] | null;
      const categories = searchParams.get('categories')?.split(',') as TermDeviation['category'][] | undefined;

      let filteredDeviations = [...mockDeviations];

      if (minSeverity) {
        const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
        const minSeverityLevel = severityOrder[minSeverity];
        filteredDeviations = filteredDeviations.filter(
          (d) => severityOrder[d.severity] >= minSeverityLevel
        );
      }

      if (categories && categories.length > 0) {
        filteredDeviations = filteredDeviations.filter((d) =>
          categories.includes(d.category)
        );
      }

      return NextResponse.json({
        success: true,
        data: filteredDeviations,
      });
    }

    if (analysisType === 'benchmarks') {
      const termNames = searchParams.get('termNames')?.split(',');

      let filteredBenchmarks = [...mockMarketBenchmarks];

      if (termNames && termNames.length > 0) {
        filteredBenchmarks = filteredBenchmarks.filter((b) =>
          termNames.some((name) =>
            b.termName.toLowerCase().includes(name.toLowerCase())
          )
        );
      }

      return NextResponse.json({
        success: true,
        data: filteredBenchmarks,
      });
    }

    // Full analysis
    const criticalDeviations = mockDeviations.filter((d) => d.severity === 'critical').length;
    const highDeviations = mockDeviations.filter((d) => d.severity === 'high').length;
    const belowMarketTerms = mockMarketBenchmarks.filter((b) => b.assessment === 'below_market').length;

    const avgSimilarity =
      mockSimilarDocuments.reduce((sum, doc) => sum + doc.similarityScore, 0) /
      mockSimilarDocuments.length;

    const overallMatchQuality =
      avgSimilarity >= 0.8
        ? 'excellent'
        : avgSimilarity >= 0.6
          ? 'good'
          : avgSimilarity >= 0.4
            ? 'moderate'
            : 'limited';

    const recommendations: string[] = [];
    if (criticalDeviations > 0) {
      recommendations.push(
        `Review ${criticalDeviations} critical deviation(s) that require immediate attention`
      );
    }
    if (highDeviations > 0) {
      recommendations.push(
        `Address ${highDeviations} high-severity deviation(s) from organizational norms`
      );
    }
    if (belowMarketTerms > 0) {
      recommendations.push(
        `Consider negotiating ${belowMarketTerms} term(s) currently below market rates`
      );
    }
    if (mockSimilarDocuments.length > 0) {
      recommendations.push(
        `Reference ${mockSimilarDocuments[0].filename} as the closest precedent for this deal structure`
      );
    }

    const analysis: DocumentSimilarityAnalysis = {
      documentId,
      analysisTimestamp: new Date().toISOString(),
      overallMatchQuality: overallMatchQuality as DocumentSimilarityAnalysis['overallMatchQuality'],
      similarDocuments: mockSimilarDocuments,
      deviations: mockDeviations,
      marketBenchmarks: mockMarketBenchmarks,
      analysisSummary: `Found ${mockSimilarDocuments.length} similar documents with ${overallMatchQuality} match quality. ` +
        `Identified ${mockDeviations.length} term deviations from organizational norms ` +
        `(${criticalDeviations} critical, ${highDeviations} high severity). ` +
        `Market benchmark analysis shows ${belowMarketTerms} terms below market, ` +
        `${mockMarketBenchmarks.filter((b) => b.assessment === 'at_market').length} at market, and ` +
        `${mockMarketBenchmarks.filter((b) => b.assessment === 'above_market').length} above market.`,
      recommendations,
    };

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Error in similarity analysis:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SIMILARITY_ANALYSIS_ERROR',
          message: 'Failed to perform similarity analysis',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    const body = await request.json();
    const { type } = body;

    // In a production environment, this would trigger the actual LLM analysis
    // For now, return the same mock data as GET but with the custom parameters applied

    if (type === 'find_similar') {
      const { maxResults = 10, minSimilarity = 0.5 } = body as FindSimilarDocumentsRequest;
      const filteredDocs = mockSimilarDocuments
        .filter((doc) => doc.similarityScore >= minSimilarity)
        .slice(0, maxResults);

      return NextResponse.json({
        success: true,
        data: filteredDocs,
      });
    }

    if (type === 'analyze_deviations') {
      const { minSeverity, categories } = body as GetDeviationsRequest;
      let filteredDeviations = [...mockDeviations];

      if (minSeverity) {
        const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
        const minSeverityLevel = severityOrder[minSeverity];
        filteredDeviations = filteredDeviations.filter(
          (d) => severityOrder[d.severity] >= minSeverityLevel
        );
      }

      if (categories && categories.length > 0) {
        filteredDeviations = filteredDeviations.filter((d) =>
          categories.includes(d.category)
        );
      }

      return NextResponse.json({
        success: true,
        data: filteredDeviations,
      });
    }

    if (type === 'get_benchmarks') {
      const { termNames } = body as GetMarketBenchmarksRequest;
      let filteredBenchmarks = [...mockMarketBenchmarks];

      if (termNames && termNames.length > 0) {
        filteredBenchmarks = filteredBenchmarks.filter((b) =>
          termNames.some((name) =>
            b.termName.toLowerCase().includes(name.toLowerCase())
          )
        );
      }

      return NextResponse.json({
        success: true,
        data: filteredBenchmarks,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Invalid analysis type specified',
        },
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in similarity analysis POST:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SIMILARITY_ANALYSIS_ERROR',
          message: 'Failed to perform similarity analysis',
        },
      },
      { status: 500 }
    );
  }
}
