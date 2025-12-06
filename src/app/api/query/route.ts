import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { queryDocumentSchema } from '@/lib/validations';
import type { ApiResponse, QueryResponse } from '@/types';

// POST /api/query - Query documents using natural language
export async function POST(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await createClient();
    const body = await request.json();

    // Validate input
    const parsed = queryDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request',
          details: parsed.error.flatten(),
        },
      }, { status: 400 });
    }

    const { question, facilityIds, includeSources } = parsed.data;

    // For MVP, we'll do a simple keyword-based search
    // In production, this would use RAG with vector embeddings

    // Extract keywords from question
    const keywords = question
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3);

    // Search facilities
    let facilitiesQuery = supabase.from('loan_facilities').select('*');
    if (facilityIds && facilityIds.length > 0) {
      facilitiesQuery = facilitiesQuery.in('id', facilityIds);
    }
    const { data: facilities } = await facilitiesQuery;

    // Define types for query results
    interface CovenantData {
      covenant_type: string;
      covenant_name: string;
      threshold_type: string;
      threshold_value: number | null;
      testing_frequency: string | null;
      source_document_id: string;
      clause_reference: string | null;
      page_number: number | null;
      raw_text: string | null;
    }
    interface TermData {
      term: string;
      definition: string;
      source_document_id: string;
      clause_reference: string | null;
      page_number: number | null;
    }

    // Search covenants
    const { data: covenantsData } = await supabase.from('financial_covenants').select('*');
    const covenants: CovenantData[] = covenantsData || [];

    // Search defined terms
    const { data: termsData } = await supabase.from('defined_terms').select('*');
    const terms: TermData[] = termsData || [];

    // Build response based on question type
    let answer = '';
    const sources: QueryResponse['sources'] = [];
    let confidence = 0.85;

    // Simple pattern matching for common queries
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('interest') && (lowerQuestion.includes('margin') || lowerQuestion.includes('rate'))) {
      // Interest rate query
      const facility = facilities?.[0];
      if (facility) {
        answer = `The interest rate is ${facility.base_rate} + ${facility.margin_initial}% (${facility.interest_rate_type}).`;
        sources.push({
          documentId: facility.source_document_id,
          documentName: 'Facility Agreement',
          excerpt: `Base Rate: ${facility.base_rate}, Margin: ${facility.margin_initial}%`,
        });
        confidence = 0.92;
      } else {
        answer = 'No facility data found to answer this question.';
        confidence = 0.5;
      }
    } else if (lowerQuestion.includes('leverage') || lowerQuestion.includes('covenant')) {
      // Covenant query
      const leverageCovenant = covenants?.find(c => c.covenant_type === 'leverage_ratio');
      if (leverageCovenant) {
        answer = `The ${leverageCovenant.covenant_name} is set at ${leverageCovenant.threshold_type} ${leverageCovenant.threshold_value}x, tested ${leverageCovenant.testing_frequency}.`;
        sources.push({
          documentId: leverageCovenant.source_document_id,
          documentName: 'Facility Agreement',
          clauseReference: leverageCovenant.clause_reference || undefined,
          pageNumber: leverageCovenant.page_number || undefined,
          excerpt: leverageCovenant.raw_text || undefined,
        });
        confidence = 0.9;
      } else {
        answer = 'No leverage covenant data found.';
        confidence = 0.5;
      }
    } else if (lowerQuestion.includes('maturity') || lowerQuestion.includes('expir')) {
      // Maturity date query
      const facility = facilities?.[0];
      if (facility) {
        answer = `The facility matures on ${facility.maturity_date}.`;
        sources.push({
          documentId: facility.source_document_id,
          documentName: 'Facility Agreement',
        });
        confidence = 0.95;
      } else {
        answer = 'No maturity date found.';
        confidence = 0.5;
      }
    } else if (lowerQuestion.includes('commitment') || lowerQuestion.includes('amount') || lowerQuestion.includes('size')) {
      // Commitment amount query
      const facility = facilities?.[0];
      if (facility) {
        const formattedAmount = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: facility.currency || 'USD',
          minimumFractionDigits: 0,
        }).format(facility.total_commitments || 0);
        answer = `The total commitments are ${formattedAmount}.`;
        sources.push({
          documentId: facility.source_document_id,
          documentName: 'Facility Agreement',
        });
        confidence = 0.95;
      } else {
        answer = 'No commitment amount found.';
        confidence = 0.5;
      }
    } else if (lowerQuestion.includes('define') || lowerQuestion.includes('definition') || lowerQuestion.includes('mean')) {
      // Definition query
      const searchTerm = keywords.find(k => !['what', 'does', 'mean', 'define', 'definition'].includes(k));
      const term = terms?.find(t => t.term.toLowerCase().includes(searchTerm || ''));
      if (term) {
        answer = `"${term.term}" is defined as: ${term.definition}`;
        sources.push({
          documentId: term.source_document_id,
          documentName: 'Facility Agreement',
          clauseReference: term.clause_reference || undefined,
          pageNumber: term.page_number || undefined,
        });
        confidence = 0.88;
      } else {
        answer = 'No matching definition found.';
        confidence = 0.4;
      }
    } else {
      // Generic response
      answer = 'I found relevant information in the documents but need more specific context to provide a detailed answer. Please try rephrasing your question or be more specific about what aspect you\'re interested in.';
      confidence = 0.6;
    }

    const response: QueryResponse = {
      answer,
      sources: includeSources ? sources : [],
      confidence,
    };

    return NextResponse.json<ApiResponse<QueryResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
