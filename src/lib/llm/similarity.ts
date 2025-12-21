import { generateStructuredOutput } from './client';
import type {
  SimilarDocument,
  TermDeviation,
  MarketBenchmark,
  DocumentSimilarityAnalysis,
  NegotiationPrecedent,
  PrecedentClause,
} from '@/app/features/documents/lib/types';

const SIMILARITY_ANALYSIS_PROMPT = `You are an expert loan document analyst specializing in syndicated lending and credit agreements. Your task is to analyze a loan document and identify similar documents based on key characteristics.

Analyze the provided document data and compare it against the repository of historical documents. Consider the following factors for similarity:

1. **Deal Structure**: Facility type (term, revolving, bridge), syndication structure, secured vs unsecured
2. **Financial Terms**: Commitment size, margin/pricing, tenor, currency
3. **Borrower Profile**: Industry sector, credit rating tier, geographic region
4. **Covenant Package**: Types of financial covenants, testing frequency, threshold levels
5. **Legal Framework**: Governing law, jurisdiction, documentation style

For each similar document found, provide:
- A similarity score (0.0 to 1.0) based on overall alignment
- Key matching terms that drove the similarity
- A brief summary explaining why the documents are similar

Return your analysis as a JSON object with the structure specified.`;

const DEVIATION_ANALYSIS_PROMPT = `You are an expert loan documentation analyst. Your task is to identify terms in the current document that deviate from organizational norms and market standards.

Analyze the document's key terms and compare them against typical organizational standards for similar deals. For each deviation found:

1. **Identify the term** that deviates from norms
2. **Categorize** it (financial_terms, covenants, legal_provisions, key_dates, parties, other)
3. **Compare values**: current document value vs. organizational norm
4. **Assess direction**: Is this deviation favorable (better for lender), unfavorable (worse for lender), or neutral?
5. **Explain implications**: What does this deviation mean for risk and negotiation?
6. **Rate severity**: low (minor variance), medium (notable difference), high (significant deviation), critical (requires immediate attention)

Focus on terms that have meaningful business impact. Return as a JSON array of deviation objects.`;

const MARKET_BENCHMARK_PROMPT = `You are an expert loan market analyst with deep knowledge of syndicated loan market pricing and terms. Your task is to benchmark the document's key terms against current market standards.

For each term, provide:
1. **Current value** in the document
2. **Market average** for similar deals
3. **Market range** (minimum to maximum observed)
4. **Percentile position** of the current value in the market distribution
5. **Assessment**: Is this term below market, at market, or above market?
6. **Market insight**: A brief explanation of the market positioning and any relevant trends

Consider factors like:
- Deal size and borrower credit profile
- Industry sector benchmarks
- Recent market conditions and trends
- Geographic considerations

Return as a JSON array of benchmark objects.`;

const NEGOTIATION_PRECEDENT_PROMPT = `You are an expert loan negotiation analyst. Your task is to analyze how similar terms were negotiated in historical deals and identify precedents that could inform current negotiations.

For each relevant precedent, provide:
1. **Source document** reference and borrower name
2. **Initial proposed value** at the start of negotiations
3. **Final negotiated value** that was agreed
4. **Negotiation progression**: How many rounds, key turning points
5. **Key arguments** used by both parties during negotiation
6. **Outcome assessment**: Was the final outcome favorable, neutral, or unfavorable for the lender?

Focus on precedents that are most relevant to the current document's terms and deal structure. Return as a JSON array of negotiation precedent objects.`;

const PRECEDENT_CLAUSE_PROMPT = `You are an expert legal analyst specializing in loan documentation. Your task is to find similar clauses from precedent documents and analyze how they compare to the current document.

For each precedent clause found:
1. **Identify the source** document and clause reference
2. **Extract the clause text** from the precedent
3. **Calculate similarity** score (0.0 to 1.0) based on semantic similarity
4. **List key differences** between the precedent and current clause
5. **Provide negotiation context** if available

Focus on clauses that are most relevant for comparison and could serve as useful precedents. Return as a JSON array of precedent clause objects.`;

export interface SimilarityAnalysisInput {
  documentText: string;
  extractedData: {
    facilityName?: string;
    facilityType?: string;
    totalCommitments?: number;
    currency?: string;
    maturityDate?: string;
    borrowerName?: string;
    governingLaw?: string;
    covenants?: Array<{
      name: string;
      type: string;
      threshold: number;
    }>;
  };
  repositoryDocuments: Array<{
    id: string;
    filename: string;
    documentType: string;
    date: string;
    extractedData?: Record<string, unknown>;
  }>;
}

export interface DeviationAnalysisInput {
  documentText: string;
  extractedTerms: Array<{
    name: string;
    value: string;
    category: string;
    clauseReference?: string;
  }>;
  organizationalNorms: Array<{
    termName: string;
    normValue: string;
    tolerance?: number;
  }>;
}

export interface MarketBenchmarkInput {
  documentTerms: Array<{
    name: string;
    value: string;
    category: string;
  }>;
  industrySegment?: string;
  dealSize?: number;
  borrowerCreditProfile?: string;
}

export interface NegotiationPrecedentInput {
  currentTerms: Array<{
    name: string;
    value: string;
    clauseReference?: string;
  }>;
  historicalDeals: Array<{
    id: string;
    documentName: string;
    borrowerName: string;
    dealDate: string;
    terms?: Array<{
      name: string;
      initialValue?: string;
      finalValue: string;
    }>;
  }>;
}

export async function analyzeSimilarity(
  input: SimilarityAnalysisInput
): Promise<SimilarDocument[]> {
  const userMessage = `
Analyze the following document and find similar documents from the repository:

**Current Document Data:**
${JSON.stringify(input.extractedData, null, 2)}

**Document Text Excerpt:**
${input.documentText.slice(0, 50000)}

**Repository Documents to Compare:**
${JSON.stringify(input.repositoryDocuments, null, 2)}

Find and rank the most similar documents. Return a JSON array of similar documents with the following structure for each:
{
  "id": "document id",
  "filename": "document filename",
  "documentType": "facility_agreement|amendment|consent|assignment|other",
  "similarityScore": 0.0-1.0,
  "date": "YYYY-MM-DD",
  "borrowerName": "borrower name",
  "dealReference": "deal reference if available",
  "totalCommitment": number or null,
  "currency": "USD|EUR|etc",
  "matchingTerms": ["list", "of", "matching", "terms"],
  "similaritySummary": "Brief explanation of similarity"
}`;

  const result = await generateStructuredOutput<SimilarDocument[]>(
    SIMILARITY_ANALYSIS_PROMPT,
    userMessage,
    { maxTokens: 4096 }
  );
  return result;
}

export async function analyzeDeviations(
  input: DeviationAnalysisInput
): Promise<TermDeviation[]> {
  const userMessage = `
Analyze the following document terms for deviations from organizational norms:

**Extracted Terms from Document:**
${JSON.stringify(input.extractedTerms, null, 2)}

**Organizational Norms/Standards:**
${JSON.stringify(input.organizationalNorms, null, 2)}

**Document Text Excerpt:**
${input.documentText.slice(0, 30000)}

Identify all terms that deviate from organizational norms. Return a JSON array with the following structure for each deviation:
{
  "id": "unique-id",
  "termName": "name of the term",
  "category": "financial_terms|covenants|legal_provisions|key_dates|parties|other",
  "currentValue": "value in document",
  "normValue": "organizational norm value",
  "deviationDirection": "better|worse|neutral",
  "deviationPercentage": number or null,
  "explanation": "detailed explanation of deviation and implications",
  "severity": "low|medium|high|critical",
  "clauseReference": "section reference if available",
  "pageNumber": number or null
}`;

  const result = await generateStructuredOutput<TermDeviation[]>(
    DEVIATION_ANALYSIS_PROMPT,
    userMessage,
    { maxTokens: 4096 }
  );
  return result;
}

export async function getMarketBenchmarks(
  input: MarketBenchmarkInput
): Promise<MarketBenchmark[]> {
  const userMessage = `
Benchmark the following document terms against market standards:

**Document Terms:**
${JSON.stringify(input.documentTerms, null, 2)}

**Context:**
- Industry Segment: ${input.industrySegment || 'General'}
- Deal Size: ${input.dealSize ? `$${input.dealSize.toLocaleString()}` : 'Not specified'}
- Borrower Credit Profile: ${input.borrowerCreditProfile || 'Not specified'}

Provide market benchmarks for each term. Return a JSON array with the following structure:
{
  "id": "unique-id",
  "termName": "name of the term",
  "category": "financial_terms|covenants|legal_provisions|key_dates",
  "currentValue": "value in document",
  "marketAverage": "average market value",
  "marketMedian": "median market value",
  "marketRangeMin": "minimum observed in market",
  "marketRangeMax": "maximum observed in market",
  "percentile": 0-100,
  "sampleSize": number,
  "benchmarkPeriod": "Last 12 months",
  "industrySegment": "industry if applicable",
  "assessment": "below_market|at_market|above_market",
  "marketInsight": "explanation of market positioning and trends"
}`;

  const result = await generateStructuredOutput<MarketBenchmark[]>(
    MARKET_BENCHMARK_PROMPT,
    userMessage,
    { maxTokens: 4096 }
  );
  return result;
}

export async function findNegotiationPrecedents(
  input: NegotiationPrecedentInput
): Promise<NegotiationPrecedent[]> {
  const userMessage = `
Find negotiation precedents for the following terms:

**Current Document Terms:**
${JSON.stringify(input.currentTerms, null, 2)}

**Historical Deals to Search:**
${JSON.stringify(input.historicalDeals, null, 2)}

Find relevant negotiation precedents showing how similar terms were negotiated. Return a JSON array with the following structure:
{
  "id": "unique-id",
  "sourceDocumentId": "document id",
  "sourceDocumentName": "document name",
  "dealDate": "YYYY-MM-DD",
  "borrowerName": "borrower name",
  "initialValue": "initial proposed value",
  "finalValue": "final negotiated value",
  "negotiationRounds": number or null,
  "negotiationSummary": "summary of negotiation process",
  "keyArguments": ["list", "of", "key", "arguments"],
  "outcomeAssessment": "favorable|neutral|unfavorable"
}`;

  const result = await generateStructuredOutput<NegotiationPrecedent[]>(
    NEGOTIATION_PRECEDENT_PROMPT,
    userMessage,
    { maxTokens: 4096 }
  );
  return result;
}

export async function findPrecedentClauses(
  clauseName: string,
  currentClauseText: string,
  precedentDocuments: Array<{
    id: string;
    documentName: string;
    clauses: Array<{
      name: string;
      text: string;
      reference: string;
    }>;
  }>
): Promise<PrecedentClause[]> {
  const userMessage = `
Find precedent clauses similar to the following:

**Clause Name:** ${clauseName}

**Current Clause Text:**
${currentClauseText}

**Precedent Documents to Search:**
${JSON.stringify(precedentDocuments, null, 2)}

Find similar clauses from precedent documents. Return a JSON array with the following structure:
{
  "id": "unique-id",
  "sourceDocumentId": "document id",
  "sourceDocumentName": "document name",
  "clauseName": "clause name",
  "clauseText": "full clause text",
  "similarity": 0.0-1.0,
  "keyDifferences": ["list", "of", "differences"],
  "sourceClauseReference": "section reference"
}`;

  const result = await generateStructuredOutput<PrecedentClause[]>(
    PRECEDENT_CLAUSE_PROMPT,
    userMessage,
    { maxTokens: 4096 }
  );
  return result;
}

export async function runFullSimilarityAnalysis(
  documentText: string,
  extractedData: SimilarityAnalysisInput['extractedData'],
  repositoryDocuments: SimilarityAnalysisInput['repositoryDocuments'],
  organizationalNorms: DeviationAnalysisInput['organizationalNorms']
): Promise<DocumentSimilarityAnalysis> {
  // Prepare extracted terms for deviation analysis
  type ExtractedTerm = { name: string; value: string; category: string };
  const extractedTerms: ExtractedTerm[] = [];

  if (extractedData.facilityType) {
    extractedTerms.push({
      name: 'Facility Type',
      value: extractedData.facilityType,
      category: 'financial_terms',
    });
  }
  if (extractedData.totalCommitments) {
    extractedTerms.push({
      name: 'Total Commitments',
      value: `$${extractedData.totalCommitments.toLocaleString()}`,
      category: 'financial_terms',
    });
  }
  if (extractedData.maturityDate) {
    extractedTerms.push({
      name: 'Maturity Date',
      value: extractedData.maturityDate,
      category: 'key_dates',
    });
  }
  if (extractedData.governingLaw) {
    extractedTerms.push({
      name: 'Governing Law',
      value: extractedData.governingLaw,
      category: 'legal_provisions',
    });
  }
  if (extractedData.covenants) {
    extractedData.covenants.forEach((c) => {
      extractedTerms.push({
        name: c.name,
        value: `${c.threshold}`,
        category: 'covenants',
      });
    });
  }

  // Run analyses in parallel
  const [similarDocuments, deviations, marketBenchmarks] = await Promise.all([
    analyzeSimilarity({
      documentText,
      extractedData,
      repositoryDocuments,
    }).catch(() => []),
    analyzeDeviations({
      documentText,
      extractedTerms,
      organizationalNorms,
    }).catch(() => []),
    getMarketBenchmarks({
      documentTerms: extractedTerms,
      dealSize: extractedData.totalCommitments,
    }).catch(() => []),
  ]);

  // Determine overall match quality
  const avgSimilarity =
    similarDocuments.length > 0
      ? similarDocuments.reduce((sum, doc) => sum + doc.similarityScore, 0) / similarDocuments.length
      : 0;

  const overallMatchQuality: DocumentSimilarityAnalysis['overallMatchQuality'] =
    avgSimilarity >= 0.8
      ? 'excellent'
      : avgSimilarity >= 0.6
        ? 'good'
        : avgSimilarity >= 0.4
          ? 'moderate'
          : 'limited';

  // Generate summary and recommendations
  const criticalDeviations = deviations.filter((d) => d.severity === 'critical').length;
  const highDeviations = deviations.filter((d) => d.severity === 'high').length;
  const belowMarketTerms = marketBenchmarks.filter((b) => b.assessment === 'below_market').length;

  const recommendations: string[] = [];
  if (criticalDeviations > 0) {
    recommendations.push(`Review ${criticalDeviations} critical deviation(s) that require immediate attention`);
  }
  if (highDeviations > 0) {
    recommendations.push(`Address ${highDeviations} high-severity deviation(s) from organizational norms`);
  }
  if (belowMarketTerms > 0) {
    recommendations.push(`Consider negotiating ${belowMarketTerms} term(s) currently below market rates`);
  }
  if (similarDocuments.length > 0) {
    recommendations.push(`Reference ${similarDocuments[0].filename} as the closest precedent for this deal structure`);
  }

  const analysisSummary = `Found ${similarDocuments.length} similar documents with ${overallMatchQuality} match quality. ` +
    `Identified ${deviations.length} term deviations from organizational norms ` +
    `(${criticalDeviations} critical, ${highDeviations} high severity). ` +
    `Market benchmark analysis shows ${belowMarketTerms} terms below market, ` +
    `${marketBenchmarks.filter((b) => b.assessment === 'at_market').length} at market, and ` +
    `${marketBenchmarks.filter((b) => b.assessment === 'above_market').length} above market.`;

  return {
    documentId: '', // Will be set by caller
    analysisTimestamp: new Date().toISOString(),
    overallMatchQuality,
    similarDocuments,
    deviations,
    marketBenchmarks,
    analysisSummary,
    recommendations,
  };
}
