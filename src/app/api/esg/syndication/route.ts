import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Request schema for syndication opportunities query
const syndicationQuerySchema = z.object({
  loanTypes: z.array(z.string()).optional(),
  minESGScore: z.number().min(0).max(100).optional(),
  maxParticipation: z.number().positive().optional(),
  minParticipation: z.number().positive().optional(),
  sectors: z.array(z.string()).optional(),
  frameworks: z.array(z.string()).optional(),
  closingWithinDays: z.number().positive().optional(),
  sortBy: z.enum(['match_score', 'esg_score', 'deadline', 'yield']).optional(),
  limit: z.number().positive().max(50).optional(),
});

// Mock syndication opportunities data
const mockSyndicationOpportunities = [
  {
    id: 'synd-1',
    facility_name: 'Nordic Wind Holdings SLL',
    borrower_name: 'Nordic Wind Holdings AS',
    borrower_industry: 'energy',
    esg_loan_type: 'green_loan',
    total_facility_amount: 500000000,
    available_participation: 75000000,
    min_participation: 25000000,
    lead_arranger: 'Nordea',
    syndication_deadline: '2025-01-31',
    esg_rating: 'AA',
    esg_score: 85,
    margin_bps: 165,
    maturity_date: '2030-06-30',
    key_kpis: ['Renewable capacity additions', 'Carbon avoided', 'Community benefit'],
    framework_alignment: ['EU Taxonomy', 'LMA Green Loan Principles'],
    match_score: 92,
    recommendation_reason: 'High ESG score would improve portfolio average. Green loan allocation currently below target.',
  },
  {
    id: 'synd-2',
    facility_name: 'HealthTech Global SLL',
    borrower_name: 'HealthTech Global Inc',
    borrower_industry: 'healthcare',
    esg_loan_type: 'social_loan',
    total_facility_amount: 300000000,
    available_participation: 45000000,
    min_participation: 15000000,
    lead_arranger: 'JP Morgan',
    syndication_deadline: '2025-02-15',
    esg_rating: 'A+',
    esg_score: 81,
    margin_bps: 180,
    maturity_date: '2029-12-31',
    key_kpis: ['Healthcare access expansion', 'Affordability index', 'Patient outcomes'],
    framework_alignment: ['LMA Social Loan Principles', 'SDG 3'],
    match_score: 88,
    recommendation_reason: 'Healthcare sector underweight. Social loan category below target.',
  },
  {
    id: 'synd-3',
    facility_name: 'TechForward Sustainability Facility',
    borrower_name: 'TechForward Corp',
    borrower_industry: 'technology',
    esg_loan_type: 'sustainability_linked',
    total_facility_amount: 400000000,
    available_participation: 60000000,
    min_participation: 20000000,
    lead_arranger: 'Goldman Sachs',
    syndication_deadline: '2025-03-01',
    esg_rating: 'AA-',
    esg_score: 79,
    margin_bps: 155,
    maturity_date: '2030-03-31',
    key_kpis: ['Data center PUE', 'Renewable energy usage', 'E-waste recycling rate'],
    framework_alignment: ['SLLP', 'Science Based Targets'],
    match_score: 85,
    recommendation_reason: 'Technology sector offers diversification with strong ESG credentials.',
  },
  {
    id: 'synd-4',
    facility_name: 'CleanTransit Europe Green Bond',
    borrower_name: 'CleanTransit Holdings BV',
    borrower_industry: 'transportation',
    esg_loan_type: 'green_loan',
    total_facility_amount: 250000000,
    available_participation: 40000000,
    min_participation: 10000000,
    lead_arranger: 'BNP Paribas',
    syndication_deadline: '2025-01-20',
    esg_rating: 'A',
    esg_score: 76,
    margin_bps: 170,
    maturity_date: '2028-09-30',
    key_kpis: ['EV fleet conversion', 'Emissions reduction', 'Route efficiency'],
    framework_alignment: ['EU Taxonomy', 'LMA Green Loan Principles'],
    match_score: 78,
    recommendation_reason: 'Transportation sector adds diversification. Aligned with EU taxonomy.',
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse filters from query params
    const minESGScore = searchParams.get('minESGScore') ? Number(searchParams.get('minESGScore')) : undefined;
    const closingWithinDays = searchParams.get('closingWithinDays') ? Number(searchParams.get('closingWithinDays')) : undefined;
    const sortBy = searchParams.get('sortBy') as 'match_score' | 'esg_score' | 'deadline' | 'yield' | undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 10;
    const loanTypes = searchParams.get('loanTypes')?.split(',');
    const sectors = searchParams.get('sectors')?.split(',');

    // Filter opportunities
    let filteredOpportunities = [...mockSyndicationOpportunities];

    if (minESGScore !== undefined) {
      filteredOpportunities = filteredOpportunities.filter(o => o.esg_score >= minESGScore);
    }

    if (closingWithinDays !== undefined) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + closingWithinDays);
      filteredOpportunities = filteredOpportunities.filter(
        o => new Date(o.syndication_deadline) <= cutoffDate
      );
    }

    if (loanTypes && loanTypes.length > 0) {
      filteredOpportunities = filteredOpportunities.filter(
        o => loanTypes.includes(o.esg_loan_type)
      );
    }

    if (sectors && sectors.length > 0) {
      filteredOpportunities = filteredOpportunities.filter(
        o => sectors.includes(o.borrower_industry)
      );
    }

    // Sort opportunities
    if (sortBy) {
      filteredOpportunities.sort((a, b) => {
        switch (sortBy) {
          case 'match_score':
            return b.match_score - a.match_score;
          case 'esg_score':
            return b.esg_score - a.esg_score;
          case 'deadline':
            return new Date(a.syndication_deadline).getTime() - new Date(b.syndication_deadline).getTime();
          case 'yield':
            return b.margin_bps - a.margin_bps;
          default:
            return 0;
        }
      });
    }

    // Apply limit
    filteredOpportunities = filteredOpportunities.slice(0, limit);

    // Calculate summary stats
    const summary = {
      total_opportunities: filteredOpportunities.length,
      total_available: filteredOpportunities.reduce((sum, o) => sum + o.available_participation, 0),
      avg_esg_score: filteredOpportunities.length > 0
        ? Math.round(filteredOpportunities.reduce((sum, o) => sum + o.esg_score, 0) / filteredOpportunities.length)
        : 0,
      avg_margin_bps: filteredOpportunities.length > 0
        ? Math.round(filteredOpportunities.reduce((sum, o) => sum + o.margin_bps, 0) / filteredOpportunities.length)
        : 0,
      closing_soon: filteredOpportunities.filter(o => {
        const daysUntil = Math.ceil((new Date(o.syndication_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysUntil <= 14;
      }).length,
    };

    return NextResponse.json({
      opportunities: filteredOpportunities,
      summary,
      filters_applied: {
        minESGScore,
        closingWithinDays,
        sortBy,
        limit,
        loanTypes,
        sectors,
      },
    });
  } catch (error) {
    console.error('Syndication opportunities query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch syndication opportunities' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const validationResult = syndicationQuerySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const params = validationResult.data;

    // In a real implementation, this would:
    // 1. Query external syndication platforms/APIs
    // 2. Match against portfolio needs
    // 3. Calculate match scores using AI
    // 4. Return personalized recommendations

    // For now, filter mock data based on params
    let filteredOpportunities = [...mockSyndicationOpportunities];

    if (params.minESGScore !== undefined) {
      filteredOpportunities = filteredOpportunities.filter(o => o.esg_score >= params.minESGScore!);
    }

    if (params.loanTypes && params.loanTypes.length > 0) {
      filteredOpportunities = filteredOpportunities.filter(
        o => params.loanTypes!.includes(o.esg_loan_type)
      );
    }

    if (params.sectors && params.sectors.length > 0) {
      filteredOpportunities = filteredOpportunities.filter(
        o => params.sectors!.includes(o.borrower_industry)
      );
    }

    // Sort
    const sortBy = params.sortBy || 'match_score';
    filteredOpportunities.sort((a, b) => {
      switch (sortBy) {
        case 'match_score':
          return b.match_score - a.match_score;
        case 'esg_score':
          return b.esg_score - a.esg_score;
        case 'deadline':
          return new Date(a.syndication_deadline).getTime() - new Date(b.syndication_deadline).getTime();
        case 'yield':
          return b.margin_bps - a.margin_bps;
        default:
          return 0;
      }
    });

    // Apply limit
    const limit = params.limit || 10;
    filteredOpportunities = filteredOpportunities.slice(0, limit);

    return NextResponse.json({
      request_id: `synd-query-${Date.now()}`,
      opportunities: filteredOpportunities,
      total_count: filteredOpportunities.length,
      query_params: params,
    });
  } catch (error) {
    console.error('Syndication query error:', error);
    return NextResponse.json(
      { error: 'Failed to query syndication opportunities' },
      { status: 500 }
    );
  }
}
