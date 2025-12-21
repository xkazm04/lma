/**
 * Mock data for Cross-Document Term Comparison Intelligence
 */

import type {
  PortfolioDocument,
  AggregatedTerm,
  PortfolioAnomaly,
  PortfolioComparisonResult,
  PortfolioSummary,
  PortfolioRiskScore,
  MarketBenchmark,
} from './types';

/**
 * Mock documents in the portfolio
 */
export const mockPortfolioDocuments: PortfolioDocument[] = [
  {
    id: 'doc-1',
    name: 'Facility Agreement - Project Apollo.pdf',
    documentType: 'facility_agreement',
    uploadedAt: '2024-12-05T10:30:00Z',
    extractionConfidence: 0.96,
    facilityName: 'Project Apollo Senior Secured Term Loan',
    borrowerName: 'Apollo Holdings Inc.',
  },
  {
    id: 'doc-2',
    name: 'Amendment No. 1 - Project Apollo.docx',
    documentType: 'amendment',
    uploadedAt: '2024-12-04T14:20:00Z',
    extractionConfidence: 0.91,
    facilityName: 'Project Apollo Senior Secured Term Loan',
    borrowerName: 'Apollo Holdings Inc.',
  },
  {
    id: 'doc-3',
    name: 'Revolving Credit Agreement - Neptune Ltd.pdf',
    documentType: 'facility_agreement',
    uploadedAt: '2024-12-02T16:45:00Z',
    extractionConfidence: 0.88,
    facilityName: 'Neptune Revolving Credit Facility',
    borrowerName: 'Neptune Ltd.',
  },
  {
    id: 'doc-4',
    name: 'Term Loan Agreement - XYZ Corp.pdf',
    documentType: 'facility_agreement',
    uploadedAt: '2024-12-01T11:00:00Z',
    extractionConfidence: 0.94,
    facilityName: 'XYZ Corp Senior Term Loan',
    borrowerName: 'XYZ Corporation',
  },
  {
    id: 'doc-5',
    name: 'Bridge Facility - Titan Industries.pdf',
    documentType: 'facility_agreement',
    uploadedAt: '2024-11-28T09:30:00Z',
    extractionConfidence: 0.92,
    facilityName: 'Titan Bridge Facility',
    borrowerName: 'Titan Industries LLC',
  },
];

/**
 * Mock market benchmarks
 */
export const mockMarketBenchmarks: MarketBenchmark[] = [
  {
    termType: 'initial_margin',
    marketMin: 1.5,
    marketMax: 5.0,
    marketMedian: 3.0,
    marketMean: 3.1,
    sampleSize: 1250,
    asOfDate: '2024-12-01',
  },
  {
    termType: 'leverage_ratio',
    marketMin: 2.5,
    marketMax: 6.0,
    marketMedian: 4.0,
    marketMean: 4.2,
    sampleSize: 1180,
    asOfDate: '2024-12-01',
  },
  {
    termType: 'interest_coverage',
    marketMin: 1.5,
    marketMax: 4.0,
    marketMedian: 2.5,
    marketMean: 2.6,
    sampleSize: 1100,
    asOfDate: '2024-12-01',
  },
  {
    termType: 'commitment_fee',
    marketMin: 0.25,
    marketMax: 0.75,
    marketMedian: 0.375,
    marketMean: 0.4,
    sampleSize: 980,
    asOfDate: '2024-12-01',
  },
];

/**
 * Mock aggregated terms across portfolio
 */
export const mockAggregatedTerms: AggregatedTerm[] = [
  {
    termName: 'Total Commitments',
    termCategory: 'financial_terms',
    dataType: 'currency',
    values: [
      { documentId: 'doc-1', documentName: 'Facility Agreement - Project Apollo.pdf', value: 500000000, confidence: 0.98, source: 'Page 1, Section 2.1' },
      { documentId: 'doc-2', documentName: 'Amendment No. 1 - Project Apollo.docx', value: 550000000, confidence: 0.96, source: 'Page 2, Section 1' },
      { documentId: 'doc-3', documentName: 'Revolving Credit Agreement - Neptune Ltd.pdf', value: 250000000, confidence: 0.92, source: 'Page 3, Section 2.1' },
      { documentId: 'doc-4', documentName: 'Term Loan Agreement - XYZ Corp.pdf', value: 350000000, confidence: 0.95, source: 'Page 1, Section 1.1' },
      { documentId: 'doc-5', documentName: 'Bridge Facility - Titan Industries.pdf', value: 75000000, confidence: 0.91, source: 'Page 1, Section 1' },
    ],
    statistics: {
      count: 5,
      missingCount: 0,
      min: 75000000,
      max: 550000000,
      mean: 345000000,
      median: 350000000,
      stdDev: 188739582,
    },
    anomalies: [],
    hasOutliers: false,
  },
  {
    termName: 'Initial Margin',
    termCategory: 'interest_rates',
    dataType: 'percentage',
    values: [
      { documentId: 'doc-1', documentName: 'Facility Agreement - Project Apollo.pdf', value: 3.25, confidence: 0.95, source: 'Page 12, Section 4.3' },
      { documentId: 'doc-2', documentName: 'Amendment No. 1 - Project Apollo.docx', value: 3.0, confidence: 0.93, source: 'Page 3, Section 2' },
      { documentId: 'doc-3', documentName: 'Revolving Credit Agreement - Neptune Ltd.pdf', value: 2.75, confidence: 0.89, source: 'Page 15, Section 5.1' },
      { documentId: 'doc-4', documentName: 'Term Loan Agreement - XYZ Corp.pdf', value: 3.5, confidence: 0.91, source: 'Page 10, Section 3.2' },
      { documentId: 'doc-5', documentName: 'Bridge Facility - Titan Industries.pdf', value: 5.75, confidence: 0.88, source: 'Page 8, Section 4' },
    ],
    statistics: {
      count: 5,
      missingCount: 0,
      min: 2.75,
      max: 5.75,
      mean: 3.65,
      median: 3.25,
      stdDev: 1.13,
    },
    marketBenchmark: mockMarketBenchmarks[0],
    anomalies: [
      {
        id: 'anom-1',
        type: 'market_deviation',
        severity: 'warning',
        termCategory: 'interest_rates',
        termName: 'Initial Margin',
        documentId: 'doc-5',
        documentName: 'Bridge Facility - Titan Industries.pdf',
        value: 5.75,
        expectedRange: { min: 1.5, max: 5.0, portfolioAvg: 3.65, marketAvg: 3.1 },
        deviation: 85.5,
        description: 'Initial margin of 5.75% exceeds market maximum of 5.0% and is 85% above market average.',
        recommendation: 'Review bridge facility pricing. Consider if premium is justified by risk profile or negotiate lower margin.',
      },
    ],
    hasOutliers: true,
  },
  {
    termName: 'Maximum Leverage Ratio',
    termCategory: 'covenants',
    dataType: 'ratio',
    values: [
      { documentId: 'doc-1', documentName: 'Facility Agreement - Project Apollo.pdf', value: 4.5, confidence: 0.95, source: 'Page 78, Section 7.1(a)' },
      { documentId: 'doc-2', documentName: 'Amendment No. 1 - Project Apollo.docx', value: 5.0, confidence: 0.92, source: 'Page 5, Section 3' },
      { documentId: 'doc-3', documentName: 'Revolving Credit Agreement - Neptune Ltd.pdf', value: 4.0, confidence: 0.88, source: 'Page 65, Section 6.1' },
      { documentId: 'doc-4', documentName: 'Term Loan Agreement - XYZ Corp.pdf', value: 4.25, confidence: 0.94, source: 'Page 55, Section 5.1' },
      { documentId: 'doc-5', documentName: 'Bridge Facility - Titan Industries.pdf', value: null, confidence: 0, source: '' },
    ],
    statistics: {
      count: 4,
      missingCount: 1,
      min: 4.0,
      max: 5.0,
      mean: 4.44,
      median: 4.38,
      stdDev: 0.42,
    },
    marketBenchmark: mockMarketBenchmarks[1],
    anomalies: [
      {
        id: 'anom-2',
        type: 'missing_term',
        severity: 'critical',
        termCategory: 'covenants',
        termName: 'Maximum Leverage Ratio',
        documentId: 'doc-5',
        documentName: 'Bridge Facility - Titan Industries.pdf',
        value: null,
        description: 'Maximum Leverage Ratio covenant is missing from the Bridge Facility agreement. This is a standard covenant present in 100% of other portfolio documents.',
        recommendation: 'Verify if leverage covenant was intentionally omitted or if extraction failed. Request amendment to add standard leverage covenant if missing.',
      },
    ],
    hasOutliers: true,
  },
  {
    termName: 'Interest Coverage Ratio',
    termCategory: 'covenants',
    dataType: 'ratio',
    values: [
      { documentId: 'doc-1', documentName: 'Facility Agreement - Project Apollo.pdf', value: 3.0, confidence: 0.93, source: 'Page 78, Section 7.1(b)' },
      { documentId: 'doc-2', documentName: 'Amendment No. 1 - Project Apollo.docx', value: 3.0, confidence: 0.91, source: 'Page 5, Section 3' },
      { documentId: 'doc-3', documentName: 'Revolving Credit Agreement - Neptune Ltd.pdf', value: 2.5, confidence: 0.86, source: 'Page 65, Section 6.2' },
      { documentId: 'doc-4', documentName: 'Term Loan Agreement - XYZ Corp.pdf', value: 1.25, confidence: 0.68, source: 'Page 56, Section 5.2' },
      { documentId: 'doc-5', documentName: 'Bridge Facility - Titan Industries.pdf', value: 2.0, confidence: 0.89, source: 'Page 22, Section 6' },
    ],
    statistics: {
      count: 5,
      missingCount: 0,
      min: 1.25,
      max: 3.0,
      mean: 2.35,
      median: 2.5,
      stdDev: 0.68,
    },
    marketBenchmark: mockMarketBenchmarks[2],
    anomalies: [
      {
        id: 'anom-3',
        type: 'unusual_value',
        severity: 'warning',
        termCategory: 'covenants',
        termName: 'Interest Coverage Ratio',
        documentId: 'doc-4',
        documentName: 'Term Loan Agreement - XYZ Corp.pdf',
        value: 1.25,
        expectedRange: { min: 1.5, max: 4.0, portfolioAvg: 2.35, marketAvg: 2.6 },
        deviation: -51.9,
        description: 'Interest Coverage Ratio of 1.25x is significantly below portfolio average of 2.35x and market minimum of 1.5x.',
        recommendation: 'This unusually low covenant may indicate higher credit risk. Review borrower creditworthiness and consider requiring additional protections.',
      },
      {
        id: 'anom-4',
        type: 'low_confidence',
        severity: 'info',
        termCategory: 'covenants',
        termName: 'Interest Coverage Ratio',
        documentId: 'doc-4',
        documentName: 'Term Loan Agreement - XYZ Corp.pdf',
        value: 1.25,
        description: 'Extraction confidence of 68% is below the 85% threshold. The extracted value may be inaccurate.',
        recommendation: 'Manually verify the Interest Coverage Ratio in the source document before relying on this data.',
      },
    ],
    hasOutliers: true,
  },
  {
    termName: 'Commitment Fee',
    termCategory: 'fees',
    dataType: 'percentage',
    values: [
      { documentId: 'doc-1', documentName: 'Facility Agreement - Project Apollo.pdf', value: 0.5, confidence: 0.72, source: 'Page 15, Section 4.5' },
      { documentId: 'doc-2', documentName: 'Amendment No. 1 - Project Apollo.docx', value: 0.5, confidence: 0.88, source: 'Page 4, Section 2.3' },
      { documentId: 'doc-3', documentName: 'Revolving Credit Agreement - Neptune Ltd.pdf', value: 0.375, confidence: 0.91, source: 'Page 18, Section 5.4' },
      { documentId: 'doc-4', documentName: 'Term Loan Agreement - XYZ Corp.pdf', value: null, confidence: 0, source: '' },
      { documentId: 'doc-5', documentName: 'Bridge Facility - Titan Industries.pdf', value: 1.0, confidence: 0.85, source: 'Page 10, Section 5' },
    ],
    statistics: {
      count: 4,
      missingCount: 1,
      min: 0.375,
      max: 1.0,
      mean: 0.594,
      median: 0.5,
      stdDev: 0.27,
    },
    marketBenchmark: mockMarketBenchmarks[3],
    anomalies: [
      {
        id: 'anom-5',
        type: 'outlier',
        severity: 'warning',
        termCategory: 'fees',
        termName: 'Commitment Fee',
        documentId: 'doc-5',
        documentName: 'Bridge Facility - Titan Industries.pdf',
        value: 1.0,
        expectedRange: { min: 0.25, max: 0.75, portfolioAvg: 0.594, marketAvg: 0.4 },
        deviation: 150,
        description: 'Commitment fee of 1.0% is 150% above market average and exceeds market maximum of 0.75%.',
        recommendation: 'Bridge facilities typically have higher fees, but 1.0% is above market norms. Consider negotiating or document justification.',
      },
      {
        id: 'anom-6',
        type: 'low_confidence',
        severity: 'info',
        termCategory: 'fees',
        termName: 'Commitment Fee',
        documentId: 'doc-1',
        documentName: 'Facility Agreement - Project Apollo.pdf',
        value: 0.5,
        description: 'Extraction confidence of 72% is below the 85% threshold.',
        recommendation: 'Manually verify the Commitment Fee in the source document.',
      },
    ],
    hasOutliers: true,
  },
  {
    termName: 'Maturity Date',
    termCategory: 'key_dates',
    dataType: 'date',
    values: [
      { documentId: 'doc-1', documentName: 'Facility Agreement - Project Apollo.pdf', value: '2029-11-20', confidence: 0.99, source: 'Page 2, Section 1.1' },
      { documentId: 'doc-2', documentName: 'Amendment No. 1 - Project Apollo.docx', value: '2030-11-20', confidence: 0.97, source: 'Page 1, Section 1' },
      { documentId: 'doc-3', documentName: 'Revolving Credit Agreement - Neptune Ltd.pdf', value: '2028-06-30', confidence: 0.95, source: 'Page 2, Section 1.1' },
      { documentId: 'doc-4', documentName: 'Term Loan Agreement - XYZ Corp.pdf', value: '2029-03-15', confidence: 0.98, source: 'Page 1, Section 1' },
      { documentId: 'doc-5', documentName: 'Bridge Facility - Titan Industries.pdf', value: '2025-05-28', confidence: 0.96, source: 'Page 1, Section 1' },
    ],
    statistics: {
      count: 5,
      missingCount: 0,
    },
    anomalies: [
      {
        id: 'anom-7',
        type: 'inconsistent_term',
        severity: 'info',
        termCategory: 'key_dates',
        termName: 'Maturity Date',
        documentId: 'doc-2',
        documentName: 'Amendment No. 1 - Project Apollo.docx',
        value: '2030-11-20',
        description: 'Maturity date differs from original Project Apollo facility agreement (2029-11-20 vs 2030-11-20). This appears to be an extension amendment.',
        recommendation: 'Verify that the maturity extension was intentional and properly documented.',
      },
    ],
    hasOutliers: false,
  },
  {
    termName: 'Base Rate',
    termCategory: 'interest_rates',
    dataType: 'string',
    values: [
      { documentId: 'doc-1', documentName: 'Facility Agreement - Project Apollo.pdf', value: 'SOFR', confidence: 0.99, source: 'Page 10, Section 4.1' },
      { documentId: 'doc-2', documentName: 'Amendment No. 1 - Project Apollo.docx', value: 'SOFR', confidence: 0.97, source: 'Page 2, Section 2' },
      { documentId: 'doc-3', documentName: 'Revolving Credit Agreement - Neptune Ltd.pdf', value: 'SOFR', confidence: 0.95, source: 'Page 12, Section 4.1' },
      { documentId: 'doc-4', documentName: 'Term Loan Agreement - XYZ Corp.pdf', value: 'LIBOR', confidence: 0.92, source: 'Page 8, Section 3.1' },
      { documentId: 'doc-5', documentName: 'Bridge Facility - Titan Industries.pdf', value: 'SOFR', confidence: 0.94, source: 'Page 6, Section 3' },
    ],
    statistics: {
      count: 5,
      missingCount: 0,
      mode: 'SOFR',
    },
    anomalies: [
      {
        id: 'anom-8',
        type: 'unusual_value',
        severity: 'critical',
        termCategory: 'interest_rates',
        termName: 'Base Rate',
        documentId: 'doc-4',
        documentName: 'Term Loan Agreement - XYZ Corp.pdf',
        value: 'LIBOR',
        description: 'LIBOR is being used as the base rate. LIBOR has been discontinued as of June 2023 and should be replaced with SOFR.',
        recommendation: 'Urgent: Execute LIBOR transition amendment to replace with SOFR before next interest period. This is a regulatory compliance issue.',
      },
    ],
    hasOutliers: true,
  },
  {
    termName: 'Governing Law',
    termCategory: 'parties',
    dataType: 'string',
    values: [
      { documentId: 'doc-1', documentName: 'Facility Agreement - Project Apollo.pdf', value: 'New York', confidence: 0.98, source: 'Page 120, Section 12.1' },
      { documentId: 'doc-2', documentName: 'Amendment No. 1 - Project Apollo.docx', value: 'New York', confidence: 0.96, source: 'Page 12, Section 8' },
      { documentId: 'doc-3', documentName: 'Revolving Credit Agreement - Neptune Ltd.pdf', value: 'New York', confidence: 0.97, source: 'Page 95, Section 11.1' },
      { documentId: 'doc-4', documentName: 'Term Loan Agreement - XYZ Corp.pdf', value: 'New York', confidence: 0.99, source: 'Page 78, Section 10.1' },
      { documentId: 'doc-5', documentName: 'Bridge Facility - Titan Industries.pdf', value: 'New York', confidence: 0.95, source: 'Page 35, Section 9' },
    ],
    statistics: {
      count: 5,
      missingCount: 0,
      mode: 'New York',
    },
    anomalies: [],
    hasOutliers: false,
  },
];

/**
 * All anomalies flattened from aggregated terms
 */
export const mockAnomalies: PortfolioAnomaly[] = mockAggregatedTerms.flatMap((term) => term.anomalies);

/**
 * Mock portfolio summary
 */
export const mockPortfolioSummary: PortfolioSummary = {
  totalDocuments: 5,
  documentsByType: {
    facility_agreement: 4,
    amendment: 1,
  },
  totalTermsAnalyzed: 8,
  termsWithAnomalies: 6,
  anomaliesBySeverity: {
    info: 3,
    warning: 3,
    critical: 2,
  },
  anomaliesByType: {
    unusual_value: 2,
    missing_term: 1,
    inconsistent_term: 1,
    market_deviation: 1,
    low_confidence: 2,
    outlier: 1,
  },
  avgExtractionConfidence: 0.922,
  lastAnalyzedAt: new Date().toISOString(),
};

/**
 * Mock portfolio risk score
 */
export const mockPortfolioRiskScore: PortfolioRiskScore = {
  overallScore: 42,
  termConsistencyScore: 35,
  marketAlignmentScore: 48,
  coverageScore: 38,
  breakdown: [
    {
      category: 'financial_terms',
      score: 25,
      contributingFactors: ['All financial terms extracted', 'Values within expected ranges'],
    },
    {
      category: 'covenants',
      score: 55,
      contributingFactors: ['Missing leverage covenant in one document', 'Low interest coverage ratio detected'],
    },
    {
      category: 'interest_rates',
      score: 65,
      contributingFactors: ['LIBOR reference still in use', 'Bridge facility margin above market'],
    },
    {
      category: 'fees',
      score: 45,
      contributingFactors: ['High commitment fee on bridge facility', 'Low extraction confidence on one fee'],
    },
    {
      category: 'key_dates',
      score: 20,
      contributingFactors: ['All dates extracted with high confidence'],
    },
    {
      category: 'parties',
      score: 15,
      contributingFactors: ['Consistent governing law across portfolio'],
    },
  ],
};

/**
 * Complete mock portfolio comparison result
 */
export const mockPortfolioComparisonResult: PortfolioComparisonResult = {
  portfolioId: 'portfolio-1',
  analyzedAt: new Date().toISOString(),
  documents: mockPortfolioDocuments,
  terms: mockAggregatedTerms,
  anomalies: mockAnomalies,
  summary: mockPortfolioSummary,
  aiInsights: `## Portfolio Intelligence Summary

**Key Findings:**
1. **LIBOR Transition Risk**: One facility (XYZ Corp) still references LIBOR as the base rate. This requires immediate attention as LIBOR has been discontinued.

2. **Covenant Coverage Gap**: The Titan Industries bridge facility is missing a maximum leverage ratio covenant, which is standard across all other portfolio documents.

3. **Pricing Anomalies**: The bridge facility shows above-market pricing on both initial margin (5.75% vs 3.1% market avg) and commitment fee (1.0% vs 0.4% market avg). While bridge facilities typically command premiums, these levels warrant review.

4. **Low Confidence Extractions**: Two terms (Interest Coverage Ratio in XYZ Corp and Commitment Fee in Apollo) have extraction confidence below 85%. Manual verification recommended.

**Recommendations:**
- Prioritize LIBOR transition amendment for XYZ Corp Term Loan
- Review and potentially amend Titan Industries bridge facility to add leverage covenant
- Validate low-confidence extractions before relying on this data
- Consider renegotiating bridge facility pricing if within amendment windows`,
};
