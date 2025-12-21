import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAllocationSchema, createProceedsCategorySchema } from '@/lib/validations';
import type { ApiResponse, UseOfProceedsCategoryWithAllocations, ProceedsAllocationWithImpact } from '@/types';
import type { UseOfProceedsCategory, ProceedsAllocation, UnallocatedProceeds } from '@/types/database';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/esg/facilities/[id]/allocations - Get allocation summary and details
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
      .select('id, commitment_amount')
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

    // Get use of proceeds categories
    const { data: categories, error: categoriesError } = await supabase
      .from('use_of_proceeds_categories')
      .select('*')
      .eq('facility_id', facilityId)
      .order('created_at', { ascending: true });

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch categories',
        },
      }, { status: 500 });
    }

    const categoryIds = (categories || []).map((c: UseOfProceedsCategory) => c.id);

    // Get allocations for each category
    let allocationsByCategory: Record<string, ProceedsAllocation[]> = {};

    if (categoryIds.length > 0) {
      const { data: allocations } = await supabase
        .from('proceeds_allocations')
        .select('*')
        .in('category_id', categoryIds)
        .order('allocation_date', { ascending: false });

      allocationsByCategory = (allocations || []).reduce(
        (acc: Record<string, ProceedsAllocation[]>, a: ProceedsAllocation) => {
          if (!acc[a.category_id]) acc[a.category_id] = [];
          acc[a.category_id].push(a);
          return acc;
        },
        {}
      );
    }

    // Get unallocated proceeds
    const { data: unallocated } = await supabase
      .from('unallocated_proceeds')
      .select('*')
      .eq('facility_id', facilityId)
      .order('as_of_date', { ascending: false })
      .limit(1)
      .single();

    // Calculate totals
    let totalAllocated = 0;
    const categoriesWithAllocations: UseOfProceedsCategoryWithAllocations[] = (categories || []).map(
      (cat: UseOfProceedsCategory) => {
        const allocations = allocationsByCategory[cat.id] || [];
        const categoryTotal = allocations.reduce((sum, a) => sum + a.allocated_amount, 0);
        totalAllocated += categoryTotal;

        return {
          ...cat,
          allocations,
          total_allocated: categoryTotal,
          allocation_count: allocations.length,
          utilization_percentage: cat.eligible_amount
            ? (categoryTotal / cat.eligible_amount) * 100
            : 0,
        };
      }
    );

    const totalEligible = (categories || []).reduce(
      (sum: number, c: UseOfProceedsCategory) => sum + (c.eligible_amount || 0),
      0
    );

    const response = {
      facility_id: facilityId,
      commitment_amount: facility.commitment_amount,
      categories: categoriesWithAllocations,
      summary: {
        total_categories: categoriesWithAllocations.length,
        total_eligible_amount: totalEligible,
        total_allocated_amount: totalAllocated,
        unallocated_amount: unallocated?.unallocated_amount || (facility.commitment_amount - totalAllocated),
        overall_utilization_percentage: totalEligible > 0 ? (totalAllocated / totalEligible) * 100 : 0,
      },
      unallocated_proceeds: unallocated || null,
    };

    return NextResponse.json<ApiResponse<typeof response>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error in GET /api/esg/facilities/[id]/allocations:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// POST /api/esg/facilities/[id]/allocations - Create allocation or category
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

    // Verify facility exists and get commitment_amount for validation
    const { data: facility } = await supabase
      .from('esg_facilities')
      .select('id, facility_name, commitment_amount')
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
    const { type, ...data } = body;

    // Determine if creating a category or an allocation
    if (type === 'category') {
      const parsed = createProceedsCategorySchema.safeParse(data);

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

      const { data: category, error: createError } = await supabase
        .from('use_of_proceeds_categories')
        .insert({
          ...parsed.data,
          facility_id: facilityId,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating category:', createError);
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to create category',
          },
        }, { status: 500 });
      }

      // Log activity
      await supabase.from('activities').insert({
        organization_id: userData.organization_id,
        source_module: 'esg',
        activity_type: 'proceeds_category_created',
        actor_id: user.id,
        entity_type: 'use_of_proceeds_category',
        entity_id: category.id,
        entity_name: category.category_name,
        description: `Created use of proceeds category "${category.category_name}"`,
        metadata: { facility_id: facilityId },
      });

      return NextResponse.json<ApiResponse<UseOfProceedsCategory>>({
        success: true,
        data: category,
      }, { status: 201 });
    } else {
      // Creating an allocation
      const parsed = createAllocationSchema.safeParse(data);

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

      // Verify category exists and belongs to this facility
      const { data: category } = await supabase
        .from('use_of_proceeds_categories')
        .select('id, category_name, eligible_amount')
        .eq('id', parsed.data.category_id)
        .eq('facility_id', facilityId)
        .single();

      if (!category) {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Category not found for this facility',
          },
        }, { status: 404 });
      }

      // Get all category IDs for this facility to sum all allocations
      const { data: facilityCategories } = await supabase
        .from('use_of_proceeds_categories')
        .select('id')
        .eq('facility_id', facilityId);

      const facilityCategoryIds = (facilityCategories || []).map((c: { id: string }) => c.id);

      // Check allocation doesn't exceed facility commitment_amount
      if (facility.commitment_amount && facilityCategoryIds.length > 0) {
        const { data: allFacilityAllocations } = await supabase
          .from('proceeds_allocations')
          .select('allocated_amount')
          .in('category_id', facilityCategoryIds);

        const totalFacilityAllocated = (allFacilityAllocations || []).reduce(
          (sum: number, a: { allocated_amount: number }) => sum + a.allocated_amount,
          0
        );

        if (totalFacilityAllocated + parsed.data.allocated_amount > facility.commitment_amount) {
          const available = facility.commitment_amount - totalFacilityAllocated;
          return NextResponse.json<ApiResponse<null>>({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: `Allocation would exceed facility commitment amount. Total commitment: ${facility.commitment_amount.toLocaleString()}, already allocated: ${totalFacilityAllocated.toLocaleString()}, available: ${available.toLocaleString()}`,
            },
          }, { status: 400 });
        }
      }

      // Check allocation doesn't exceed category eligible amount
      const { data: existingAllocations } = await supabase
        .from('proceeds_allocations')
        .select('allocated_amount')
        .eq('category_id', parsed.data.category_id);

      const currentTotal = (existingAllocations || []).reduce(
        (sum: number, a: { allocated_amount: number }) => sum + a.allocated_amount,
        0
      );

      if (category.eligible_amount && currentTotal + parsed.data.allocated_amount > category.eligible_amount) {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Allocation would exceed category eligible amount. Available: ${(category.eligible_amount - currentTotal).toLocaleString()}`,
          },
        }, { status: 400 });
      }

      const { data: allocation, error: createError } = await supabase
        .from('proceeds_allocations')
        .insert(parsed.data)
        .select()
        .single();

      if (createError) {
        console.error('Error creating allocation:', createError);
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to create allocation',
          },
        }, { status: 500 });
      }

      // Log activity
      await supabase.from('activities').insert({
        organization_id: userData.organization_id,
        source_module: 'esg',
        activity_type: 'proceeds_allocated',
        actor_id: user.id,
        entity_type: 'proceeds_allocation',
        entity_id: allocation.id,
        entity_name: allocation.project_name,
        description: `Allocated ${allocation.allocated_amount.toLocaleString()} to "${allocation.project_name}" in category "${category.category_name}"`,
        metadata: { facility_id: facilityId, category_id: category.id },
      });

      return NextResponse.json<ApiResponse<ProceedsAllocation>>({
        success: true,
        data: allocation,
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error in POST /api/esg/facilities/[id]/allocations:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
