import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createRatingSchema } from '@/lib/validations';
import type { ApiResponse, ESGFacilityRatingsOverview } from '@/types';
import type { ESGRating } from '@/types/database';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/esg/facilities/[id]/ratings - Get ESG ratings for facility
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: facilityId } = await context.params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User profile not found',
        },
      }, { status: 404 });
    }

    // Verify facility exists
    const { data: facility } = await supabase
      .from('esg_facilities')
      .select('id, borrower_name')
      .eq('id', facilityId)
      .eq('organization_id', userData.organization_id)
      .single();

    if (!facility) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'ESG facility not found',
        },
      }, { status: 404 });
    }

    // Get all ratings
    const { data: ratings, error: ratingsError } = await supabase
      .from('esg_ratings')
      .select('*')
      .eq('facility_id', facilityId)
      .order('rating_date', { ascending: false });

    if (ratingsError) {
      console.error('Error fetching ratings:', ratingsError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch ratings',
        },
      }, { status: 500 });
    }

    // Get latest rating per provider
    const latestByProvider: Record<string, ESGRating> = {};
    for (const rating of ratings || []) {
      if (!latestByProvider[rating.rating_provider]) {
        latestByProvider[rating.rating_provider] = rating;
      }
    }

    // Calculate rating history by provider
    const historyByProvider: Record<string, ESGRating[]> = (ratings || []).reduce(
      (acc: Record<string, ESGRating[]>, r: ESGRating) => {
        if (!acc[r.rating_provider]) acc[r.rating_provider] = [];
        acc[r.rating_provider].push(r);
        return acc;
      },
      {}
    );

    // Build summary
    const summary: ESGFacilityRatingsOverview = {
      borrower_name: facility.borrower_name,
      latest_ratings: Object.values(latestByProvider),
      rating_count: (ratings || []).length,
      providers_covered: Object.keys(latestByProvider),
      average_score: null,
      rating_history: historyByProvider,
    };

    // Calculate average score from ESG components
    const ratingsWithScores = Object.values(latestByProvider).filter(
      (r) => r.environmental_score !== null || r.social_score !== null || r.governance_score !== null
    );
    if (ratingsWithScores.length > 0) {
      let totalScore = 0;
      let scoreCount = 0;
      for (const r of ratingsWithScores) {
        if (r.environmental_score !== null) { totalScore += r.environmental_score; scoreCount++; }
        if (r.social_score !== null) { totalScore += r.social_score; scoreCount++; }
        if (r.governance_score !== null) { totalScore += r.governance_score; scoreCount++; }
      }
      if (scoreCount > 0) {
        summary.average_score = totalScore / scoreCount;
      }
    }

    return NextResponse.json<ApiResponse<ESGFacilityRatingsOverview>>({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Error in GET /api/esg/facilities/[id]/ratings:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// POST /api/esg/facilities/[id]/ratings - Add a new rating
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: facilityId } = await context.params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User profile not found',
        },
      }, { status: 404 });
    }

    // Verify facility exists
    const { data: facility } = await supabase
      .from('esg_facilities')
      .select('id, facility_name, borrower_name')
      .eq('id', facilityId)
      .eq('organization_id', userData.organization_id)
      .single();

    if (!facility) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'ESG facility not found',
        },
      }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createRatingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: parsed.error.flatten(),
        },
      }, { status: 400 });
    }

    const { data: rating, error: createError } = await supabase
      .from('esg_ratings')
      .insert({
        ...parsed.data,
        facility_id: facilityId,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating rating:', createError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create rating',
        },
      }, { status: 500 });
    }

    // Log activity
    await supabase.from('activities').insert({
      organization_id: userData.organization_id,
      source_module: 'esg',
      activity_type: 'rating_added',
      actor_id: user.id,
      entity_type: 'esg_rating',
      entity_id: rating.id,
      entity_name: `${rating.rating_provider} - ${rating.rating}`,
      description: `Added ${rating.rating_provider} rating "${rating.rating}" for ${facility.borrower_name}`,
      metadata: { facility_id: facilityId },
    });

    return NextResponse.json<ApiResponse<ESGRating>>({
      success: true,
      data: rating,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/esg/facilities/[id]/ratings:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
