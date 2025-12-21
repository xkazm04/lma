import { generateStructuredOutput } from './client';
import type { ComparisonResult } from '@/types';
import type {
  ComparisonRiskAnalysis,
  ChangeRiskScore,
  ChangeMarketBenchmark,
  ComparisonRiskSummary,
  RiskSeverity,
  FavoredParty,
  CategoryRiskSummary,
} from '@/app/features/documents/lib/types';

/**
 * Creates a unique change ID from category and field
 */
function createChangeId(category: string, field: string): string {
  return `${category}-${field}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/**
 * Converts severity score (1-10) to severity category
 */
function scoreToSeverity(score: number): RiskSeverity {
  if (score <= 3) return 'low';
  if (score <= 5) return 'medium';
  if (score <= 7) return 'high';
  return 'critical';
}

const RISK_SCORING_SYSTEM_PROMPT = `You are an expert loan document analyst specializing in risk assessment for syndicated and bilateral loan agreements. Your task is to analyze changes between two loan documents and provide detailed risk scoring.

For each change, you must assess:
1. **Severity Score (1-10)**: How significant is this change?
   - 1-3: Minor/cosmetic changes with minimal business impact
   - 4-5: Moderate changes that may affect terms but are within normal ranges
   - 6-7: Significant changes that materially affect deal economics or risk profile
   - 8-10: Critical changes that fundamentally alter the deal or create substantial risk

2. **Favored Party**: Which party benefits from this change?
   - "borrower": Change is favorable to the borrower (e.g., lower rates, looser covenants, longer maturity)
   - "lender": Change is favorable to the lender (e.g., higher rates, tighter covenants, more restrictions)
   - "neutral": Change is balanced or administrative in nature

3. **Market Deviation**: Does this change deviate from standard market practice?
   - Compare against typical terms in similar credit facilities
   - Consider current market conditions for leveraged/investment grade loans

4. **Risk Analysis**: Provide a concise explanation of risk implications.

For market benchmarks, provide typical ranges seen in:
- Similar credit ratings
- Same loan type (term loan, revolver, etc.)
- Current market conditions (2024-2025)

Always respond with valid JSON matching the expected schema.`;

interface RiskScoringInput {
  document1: { id: string; name: string };
  document2: { id: string; name: string };
  changes: Array<{
    category: string;
    field: string;
    document1Value: unknown;
    document2Value: unknown;
    changeType: 'added' | 'removed' | 'modified';
  }>;
}

interface RawRiskAnalysisResponse {
  changeScores: Array<{
    changeId: string;
    severityScore: number;
    favoredParty: FavoredParty;
    riskAnalysis: string;
    deviatesFromMarket: boolean;
    confidence: number;
  }>;
  marketBenchmarks: Array<{
    changeId: string;
    termName: string;
    category: string;
    originalValue: string | null;
    amendedValue: string | null;
    marketRangeLow: string;
    marketRangeHigh: string;
    marketMedian: string;
    marketPosition: 'below_market' | 'at_market' | 'above_market';
    percentile: number;
    sampleSize: number;
    benchmarkPeriod: string;
    marketInsight: string;
  }>;
  summary: {
    overallRiskScore: number;
    overallDirection: 'borrower_favorable' | 'lender_favorable' | 'balanced';
    keyFindings: string[];
    executiveSummary: string;
  };
}

/**
 * Generate AI-powered risk analysis for a document comparison
 */
export async function generateRiskAnalysis(
  comparisonResult: ComparisonResult
): Promise<ComparisonRiskAnalysis> {
  const input: RiskScoringInput = {
    document1: comparisonResult.document1,
    document2: comparisonResult.document2,
    changes: comparisonResult.differences.map((diff) => ({
      category: diff.category,
      field: diff.field,
      document1Value: diff.document1Value,
      document2Value: diff.document2Value,
      changeType: diff.changeType,
    })),
  };

  const userPrompt = `Analyze the following document comparison and provide risk scores for each change, market benchmarks where applicable, and an overall summary.

**Document 1**: ${input.document1.name} (ID: ${input.document1.id})
**Document 2**: ${input.document2.name} (ID: ${input.document2.id})

**Changes to Analyze**:
${input.changes
  .map((change, i) => {
    const changeId = createChangeId(change.category, change.field);
    return `
${i + 1}. [${changeId}] Category: ${change.category}
   Field: ${change.field}
   Change Type: ${change.changeType}
   Original Value: ${change.document1Value ?? 'Not present'}
   New Value: ${change.document2Value ?? 'Not present'}`;
  })
  .join('\n')}

Provide your analysis in the following JSON format:
\`\`\`json
{
  "changeScores": [
    {
      "changeId": "category-field-identifier",
      "severityScore": 1-10,
      "favoredParty": "borrower" | "lender" | "neutral",
      "riskAnalysis": "Explanation of risk implications",
      "deviatesFromMarket": true | false,
      "confidence": 0.0-1.0
    }
  ],
  "marketBenchmarks": [
    {
      "changeId": "category-field-identifier",
      "termName": "Field name",
      "category": "Category",
      "originalValue": "Original value or null",
      "amendedValue": "New value or null",
      "marketRangeLow": "Lower bound of market range",
      "marketRangeHigh": "Upper bound of market range",
      "marketMedian": "Typical market value",
      "marketPosition": "below_market" | "at_market" | "above_market",
      "percentile": 0-100,
      "sampleSize": number,
      "benchmarkPeriod": "Q4 2024",
      "marketInsight": "Analysis of market positioning"
    }
  ],
  "summary": {
    "overallRiskScore": 1-10,
    "overallDirection": "borrower_favorable" | "lender_favorable" | "balanced",
    "keyFindings": ["Finding 1", "Finding 2"],
    "executiveSummary": "Overall analysis summary"
  }
}
\`\`\`

Important:
- Include a risk score for EVERY change listed above
- Include market benchmarks for financial terms, covenants, and key dates (not for party changes)
- Use the exact changeId format provided for each change
- Be specific and practical in your risk analysis`;

  const rawResponse = await generateStructuredOutput<RawRiskAnalysisResponse>(
    RISK_SCORING_SYSTEM_PROMPT,
    userPrompt,
    { maxTokens: 8192, temperature: 0.2 }
  );

  // Process and enrich the response
  const changeScores: ChangeRiskScore[] = rawResponse.changeScores.map((score) => ({
    ...score,
    severity: scoreToSeverity(score.severityScore),
  }));

  const marketBenchmarks: ChangeMarketBenchmark[] = rawResponse.marketBenchmarks;

  // Calculate category summaries
  const categoryMap = new Map<string, {
    scores: number[];
    borrowerFavored: number;
    lenderFavored: number;
    neutral: number;
    marketDeviations: number;
    highestRiskChange: { id: string; score: number } | null;
  }>();

  // Group changes by category for summary calculation
  input.changes.forEach((change) => {
    const changeId = createChangeId(change.category, change.field);
    const score = changeScores.find((s) => s.changeId === changeId);

    if (!score) return;

    if (!categoryMap.has(change.category)) {
      categoryMap.set(change.category, {
        scores: [],
        borrowerFavored: 0,
        lenderFavored: 0,
        neutral: 0,
        marketDeviations: 0,
        highestRiskChange: null,
      });
    }

    const cat = categoryMap.get(change.category)!;
    cat.scores.push(score.severityScore);

    if (score.favoredParty === 'borrower') cat.borrowerFavored++;
    else if (score.favoredParty === 'lender') cat.lenderFavored++;
    else cat.neutral++;

    if (score.deviatesFromMarket) cat.marketDeviations++;

    if (!cat.highestRiskChange || score.severityScore > cat.highestRiskChange.score) {
      cat.highestRiskChange = { id: changeId, score: score.severityScore };
    }
  });

  const categorySummaries: CategoryRiskSummary[] = Array.from(categoryMap.entries()).map(
    ([category, data]) => ({
      category,
      averageSeverityScore:
        data.scores.length > 0
          ? Math.round((data.scores.reduce((a, b) => a + b, 0) / data.scores.length) * 10) / 10
          : 0,
      borrowerFavoredCount: data.borrowerFavored,
      lenderFavoredCount: data.lenderFavored,
      neutralCount: data.neutral,
      marketDeviationCount: data.marketDeviations,
      highestRiskChange: data.highestRiskChange?.id ?? null,
    })
  );

  // Calculate overall summary
  const highRiskCount = changeScores.filter((s) => s.severityScore >= 7).length;
  const totalMarketDeviations = changeScores.filter((s) => s.deviatesFromMarket).length;

  const summary: ComparisonRiskSummary = {
    overallRiskScore: rawResponse.summary.overallRiskScore,
    overallSeverity: scoreToSeverity(rawResponse.summary.overallRiskScore),
    overallDirection: rawResponse.summary.overallDirection,
    totalChangesAnalyzed: changeScores.length,
    highRiskCount,
    marketDeviationCount: totalMarketDeviations,
    categorySummaries,
    keyFindings: rawResponse.summary.keyFindings,
    executiveSummary: rawResponse.summary.executiveSummary,
    analyzedAt: new Date().toISOString(),
  };

  return {
    document1: comparisonResult.document1,
    document2: comparisonResult.document2,
    changeScores,
    marketBenchmarks,
    summary,
  };
}

/**
 * Mock risk analysis for development/demo purposes
 */
export function generateMockRiskAnalysis(
  comparisonResult: ComparisonResult
): ComparisonRiskAnalysis {
  const mockScores: ChangeRiskScore[] = comparisonResult.differences.map((diff) => {
    const changeId = createChangeId(diff.category, diff.field);

    // Generate realistic mock scores based on change characteristics
    let severityScore: number;
    let favoredParty: FavoredParty;
    let deviatesFromMarket = false;
    let riskAnalysis: string;

    switch (diff.field) {
      case 'Total Commitments':
        severityScore = 6;
        favoredParty = 'borrower';
        riskAnalysis = 'Facility size increase of $50M represents a 10% expansion. This is favorable to the borrower, providing additional liquidity. Lender exposure increases proportionally.';
        break;
      case 'Initial Margin':
        severityScore = 5;
        favoredParty = 'borrower';
        riskAnalysis = 'Margin reduction of 25bps reduces borrower interest expense. This is slightly below market for similar credits, suggesting strong negotiating position or improved credit profile.';
        deviatesFromMarket = true;
        break;
      case 'Maturity Date':
        severityScore = 7;
        favoredParty = 'borrower';
        riskAnalysis = 'One-year maturity extension significantly benefits the borrower by deferring principal repayment. Lenders face extended credit exposure and refinancing risk.';
        break;
      case 'Maximum Leverage Ratio':
        severityScore = 8;
        favoredParty = 'borrower';
        deviatesFromMarket = true;
        riskAnalysis = 'Loosening leverage covenant from 4.50x to 5.00x substantially increases headroom for the borrower. This exceeds typical market standards for investment-grade facilities and represents meaningful credit risk increase.';
        break;
      case 'Annual CapEx Limit':
        severityScore = 4;
        favoredParty = 'borrower';
        riskAnalysis = 'Removal of CapEx restriction provides operational flexibility to the borrower but eliminates a protective covenant for lenders.';
        break;
      case 'Lender: Pacific Finance Ltd':
        severityScore = 3;
        favoredParty = 'neutral';
        riskAnalysis = 'Reduction in Pacific Finance commitment from 20% to 15% appears to be a rebalancing of syndicate holdings, likely neutral to overall deal dynamics.';
        break;
      case 'Lender: Asian Credit Corp':
        severityScore = 2;
        favoredParty = 'neutral';
        riskAnalysis = 'Addition of new lender at 5% participation diversifies the syndicate. Administrative change with minimal risk implications.';
        break;
      default:
        severityScore = 4;
        favoredParty = 'neutral';
        riskAnalysis = 'Standard change with moderate risk implications.';
    }

    return {
      changeId,
      severityScore,
      severity: scoreToSeverity(severityScore),
      favoredParty,
      riskAnalysis,
      deviatesFromMarket,
      confidence: 0.85 + Math.random() * 0.1,
    };
  });

  const mockBenchmarks: ChangeMarketBenchmark[] = [
    {
      changeId: createChangeId('Financial Terms', 'Total Commitments'),
      termName: 'Total Commitments',
      category: 'Financial Terms',
      originalValue: '$500,000,000',
      amendedValue: '$550,000,000',
      marketRangeLow: '$300,000,000',
      marketRangeHigh: '$750,000,000',
      marketMedian: '$450,000,000',
      marketPosition: 'above_market',
      percentile: 72,
      sampleSize: 156,
      benchmarkPeriod: 'Q4 2024',
      marketInsight: 'Facility size is above median for comparable leveraged loan facilities, indicating a significant transaction size that may limit syndication flexibility.',
    },
    {
      changeId: createChangeId('Financial Terms', 'Initial Margin'),
      termName: 'Initial Margin',
      category: 'Financial Terms',
      originalValue: '3.25%',
      amendedValue: '3.00%',
      marketRangeLow: '2.50%',
      marketRangeHigh: '4.00%',
      marketMedian: '3.25%',
      marketPosition: 'below_market',
      percentile: 35,
      sampleSize: 203,
      benchmarkPeriod: 'Q4 2024',
      marketInsight: 'Amended margin of 3.00% is tighter than market median of 3.25%, suggesting either improved credit profile or competitive lender environment.',
    },
    {
      changeId: createChangeId('Key Dates', 'Maturity Date'),
      termName: 'Maturity Date',
      category: 'Key Dates',
      originalValue: 'November 20, 2029',
      amendedValue: 'November 20, 2030',
      marketRangeLow: '5 years',
      marketRangeHigh: '7 years',
      marketMedian: '5.5 years',
      marketPosition: 'above_market',
      percentile: 78,
      sampleSize: 189,
      benchmarkPeriod: 'Q4 2024',
      marketInsight: 'Extended maturity to 6 years (from original closing) exceeds typical market tenor. This provides borrower flexibility but increases lender duration risk.',
    },
    {
      changeId: createChangeId('Covenants', 'Maximum Leverage Ratio'),
      termName: 'Maximum Leverage Ratio',
      category: 'Covenants',
      originalValue: '4.50x',
      amendedValue: '5.00x',
      marketRangeLow: '3.50x',
      marketRangeHigh: '5.50x',
      marketMedian: '4.25x',
      marketPosition: 'above_market',
      percentile: 82,
      sampleSize: 178,
      benchmarkPeriod: 'Q4 2024',
      marketInsight: 'Leverage covenant at 5.00x is more permissive than 82% of comparable facilities. This represents a meaningful deviation from market standards and warrants close monitoring.',
    },
  ];

  // Calculate category summaries
  const categoryMap = new Map<string, {
    scores: number[];
    borrowerFavored: number;
    lenderFavored: number;
    neutral: number;
    marketDeviations: number;
    highestRiskChange: { id: string; score: number } | null;
  }>();

  comparisonResult.differences.forEach((diff) => {
    const changeId = createChangeId(diff.category, diff.field);
    const score = mockScores.find((s) => s.changeId === changeId);

    if (!score) return;

    if (!categoryMap.has(diff.category)) {
      categoryMap.set(diff.category, {
        scores: [],
        borrowerFavored: 0,
        lenderFavored: 0,
        neutral: 0,
        marketDeviations: 0,
        highestRiskChange: null,
      });
    }

    const cat = categoryMap.get(diff.category)!;
    cat.scores.push(score.severityScore);

    if (score.favoredParty === 'borrower') cat.borrowerFavored++;
    else if (score.favoredParty === 'lender') cat.lenderFavored++;
    else cat.neutral++;

    if (score.deviatesFromMarket) cat.marketDeviations++;

    if (!cat.highestRiskChange || score.severityScore > cat.highestRiskChange.score) {
      cat.highestRiskChange = { id: changeId, score: score.severityScore };
    }
  });

  const categorySummaries: CategoryRiskSummary[] = Array.from(categoryMap.entries()).map(
    ([category, data]) => ({
      category,
      averageSeverityScore:
        data.scores.length > 0
          ? Math.round((data.scores.reduce((a, b) => a + b, 0) / data.scores.length) * 10) / 10
          : 0,
      borrowerFavoredCount: data.borrowerFavored,
      lenderFavoredCount: data.lenderFavored,
      neutralCount: data.neutral,
      marketDeviationCount: data.marketDeviations,
      highestRiskChange: data.highestRiskChange?.id ?? null,
    })
  );

  const highRiskCount = mockScores.filter((s) => s.severityScore >= 7).length;
  const totalMarketDeviations = mockScores.filter((s) => s.deviatesFromMarket).length;

  const summary: ComparisonRiskSummary = {
    overallRiskScore: 5.7,
    overallSeverity: 'medium',
    overallDirection: 'borrower_favorable',
    totalChangesAnalyzed: mockScores.length,
    highRiskCount,
    marketDeviationCount: totalMarketDeviations,
    categorySummaries,
    keyFindings: [
      'Amendment significantly favors borrower with loosened covenants and extended maturity',
      'Leverage covenant deviation from market standards (5.00x vs 4.25x median) warrants attention',
      'Margin reduction below market suggests competitive dynamics or improved credit',
      'Removal of CapEx restriction eliminates a protective covenant for lenders',
    ],
    executiveSummary: 'This amendment package represents a material shift toward borrower-favorable terms. The combination of increased facility size, margin reduction, maturity extension, and covenant loosening collectively benefit the borrower while increasing lender risk exposure. The leverage covenant at 5.00x notably exceeds market standards. Lenders should carefully evaluate whether the amended terms adequately compensate for the increased risk profile.',
    analyzedAt: new Date().toISOString(),
  };

  return {
    document1: comparisonResult.document1,
    document2: comparisonResult.document2,
    changeScores: mockScores,
    marketBenchmarks: mockBenchmarks,
    summary,
  };
}
