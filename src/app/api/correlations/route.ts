import { NextRequest, NextResponse } from 'next/server';
import { multiDomainEngine } from '@/lib/utils/domain-correlations';
import type {
  Document,
  Deal,
  Borrower,
  ComplianceItem,
  ESGMetric,
} from '@/lib/utils/domain-correlations';

/**
 * GET /api/correlations
 *
 * Discover correlations across all domain entities.
 * Returns cross-domain insights showing relationships between
 * documents, deals, borrowers, compliance items, and ESG metrics.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domains = searchParams.get('domains')?.split(',') || [
      'documents',
      'deals',
      'borrowers',
      'compliance',
      'esg',
    ];

    // In production, this would fetch from Supabase
    // For now, we'll generate mock data
    const data = await fetchCorrelationData(domains);

    // Discover all correlations
    const results = multiDomainEngine.discoverAll(data);

    return NextResponse.json({
      success: true,
      data: {
        insights: results.insights,
        correlations: {
          documentDeal: results.documentDeal.slice(0, 50), // Limit for performance
          borrowerESG: results.borrowerESG.slice(0, 50),
          borrowerBorrower: results.borrowerBorrower.slice(0, 50),
          complianceCompliance: results.complianceCompliance.slice(0, 50),
        },
        summary: {
          totalCorrelations:
            results.documentDeal.length +
            results.borrowerESG.length +
            results.borrowerBorrower.length +
            results.complianceCompliance.length,
          insightCount: results.insights.length,
          criticalInsights: results.insights.filter((i) => i.significance === 'critical')
            .length,
          highInsights: results.insights.filter((i) => i.significance === 'high').length,
        },
      },
    });
  } catch (error) {
    console.error('Error discovering correlations:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to discover correlations',
      },
      { status: 500 }
    );
  }
}

/**
 * Fetch correlation data from database (mock for now)
 */
async function fetchCorrelationData(domains: string[]) {
  const data: {
    documents?: Document[];
    deals?: Deal[];
    borrowers?: Borrower[];
    compliance?: ComplianceItem[];
    esg?: ESGMetric[];
  } = {};

  if (domains.includes('documents')) {
    data.documents = generateMockDocuments();
  }

  if (domains.includes('deals')) {
    data.deals = generateMockDeals();
  }

  if (domains.includes('borrowers')) {
    data.borrowers = generateMockBorrowers();
  }

  if (domains.includes('compliance')) {
    data.compliance = generateMockCompliance();
  }

  if (domains.includes('esg')) {
    data.esg = generateMockESG();
  }

  return data;
}

// ============================================================================
// Mock Data Generators
// ============================================================================

function generateMockDocuments(): Document[] {
  const types = ['Credit Agreement', 'Term Sheet', 'Guaranty', 'Security Agreement'];
  const sectors = ['Technology', 'Healthcare', 'Manufacturing', 'Real Estate'];
  const regions = ['North America', 'Europe', 'Asia Pacific'];

  return Array.from({ length: 20 }, (_, i) => ({
    id: `doc-${i + 1}`,
    type: 'document' as const,
    documentType: types[i % types.length],
    uploadedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
    processedAt: new Date(Date.now() - Math.random() * 85 * 24 * 60 * 60 * 1000).toISOString(),
    dealId: `deal-${Math.floor(i / 2) + 1}`,
    borrowerId: `borrower-${Math.floor(i / 3) + 1}`,
    tags: ['loan', 'commercial'],
    sector: sectors[i % sectors.length],
    region: regions[i % regions.length],
    processingTimeMs: 2000 + Math.random() * 8000,
  }));
}

function generateMockDeals(): Deal[] {
  const sectors = ['Technology', 'Healthcare', 'Manufacturing', 'Real Estate'];
  const regions = ['North America', 'Europe', 'Asia Pacific'];

  return Array.from({ length: 15 }, (_, i) => {
    const startedAt = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000);
    const velocity = 20 + Math.random() * 60; // 20-80 days
    const closedAt = new Date(startedAt.getTime() + velocity * 24 * 60 * 60 * 1000);

    return {
      id: `deal-${i + 1}`,
      type: 'deal' as const,
      status: i < 10 ? ('closed' as const) : ('active' as const),
      sector: sectors[i % sectors.length],
      region: regions[i % regions.length],
      borrowerId: `borrower-${Math.floor(i / 2) + 1}`,
      startedAt: startedAt.toISOString(),
      closedAt: i < 10 ? closedAt.toISOString() : undefined,
      velocity: i < 10 ? velocity : undefined,
      documentCount: 3 + Math.floor(Math.random() * 5),
      negotiationRounds: 1 + Math.floor(Math.random() * 4),
    };
  });
}

function generateMockBorrowers(): Borrower[] {
  const sectors = ['Technology', 'Healthcare', 'Manufacturing', 'Real Estate'];
  const regions = ['North America', 'Europe', 'Asia Pacific'];
  const ratings = ['AAA', 'AA', 'A', 'BBB', 'BB'];

  return Array.from({ length: 12 }, (_, i) => ({
    id: `borrower-${i + 1}`,
    type: 'borrower' as const,
    name: `Borrower ${i + 1}`,
    sector: sectors[i % sectors.length],
    region: regions[i % regions.length],
    creditRating: ratings[i % ratings.length],
    esgScore: 40 + Math.random() * 50,
    totalExposure: 10_000_000 + Math.random() * 90_000_000,
    activeLoans: 1 + Math.floor(Math.random() * 4),
    complianceScore: 60 + Math.random() * 35,
  }));
}

function generateMockCompliance(): ComplianceItem[] {
  const types = ['Financial Covenant', 'ESG Report', 'Audit', 'Insurance Certificate'];
  const sectors = ['Technology', 'Healthcare', 'Manufacturing', 'Real Estate'];
  const regions = ['North America', 'Europe', 'Asia Pacific'];

  return Array.from({ length: 25 }, (_, i) => {
    const dueDate = new Date(Date.now() + (Math.random() * 90 - 30) * 24 * 60 * 60 * 1000);
    const isOverdue = dueDate < new Date();

    return {
      id: `compliance-${i + 1}`,
      type: 'compliance' as const,
      itemType: types[i % types.length],
      borrowerId: `borrower-${Math.floor(i / 2) + 1}`,
      dealId: `deal-${Math.floor(i / 3) + 1}`,
      dueDate: dueDate.toISOString(),
      status: isOverdue ? 'overdue' : 'upcoming',
      priority: ['low', 'medium', 'high', 'critical'][
        Math.floor(Math.random() * 4)
      ] as 'low' | 'medium' | 'high' | 'critical',
      sector: sectors[i % sectors.length],
      region: regions[i % regions.length],
    };
  });
}

function generateMockESG(): ESGMetric[] {
  const types = ['Carbon Emissions', 'Water Usage', 'Diversity Score', 'Safety Record'];
  const sectors = ['Technology', 'Healthcare', 'Manufacturing', 'Real Estate'];
  const regions = ['North America', 'Europe', 'Asia Pacific'];
  const ratings = ['A', 'B', 'C', 'D'];

  return Array.from({ length: 18 }, (_, i) => ({
    id: `esg-${i + 1}`,
    type: 'esg' as const,
    metricType: types[i % types.length],
    borrowerId: `borrower-${Math.floor(i / 2) + 1}`,
    score: 40 + Math.random() * 50,
    rating: ratings[Math.floor(Math.random() * ratings.length)],
    sector: sectors[i % sectors.length],
    region: regions[i % regions.length],
    reportedAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
  }));
}
