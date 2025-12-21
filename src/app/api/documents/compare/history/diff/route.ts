import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { ApiResponse, ComparisonResult } from '@/types';
import type { ComparisonDiff } from '@/app/features/documents/sub_Compare/lib/history-types';

const diffSchema = z.object({
  comparison1Id: z.string().uuid(),
  comparison2Id: z.string().uuid(),
});

// POST /api/documents/compare/history/diff - Compare two comparison results
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to compare comparison results',
        },
      }, { status: 401 });
    }

    const body = await request.json();
    const parsed = diffSchema.safeParse(body);
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

    const { comparison1Id, comparison2Id } = parsed.data;

    // Fetch both comparison history entries
    const [result1, result2] = await Promise.all([
      supabase
        .from('document_comparison_history')
        .select('id, compared_at, differences')
        .eq('id', comparison1Id)
        .single(),
      supabase
        .from('document_comparison_history')
        .select('id, compared_at, differences')
        .eq('id', comparison2Id)
        .single(),
    ]);

    if (result1.error || !result1.data) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Comparison ${comparison1Id} not found`,
        },
      }, { status: 404 });
    }

    if (result2.error || !result2.data) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Comparison ${comparison2Id} not found`,
        },
      }, { status: 404 });
    }

    const comp1 = result1.data;
    const comp2 = result2.data;

    // Analyze the differences between the two comparisons
    const diff1: ComparisonResult['differences'] = comp1.differences || [];
    const diff2: ComparisonResult['differences'] = comp2.differences || [];

    // Create maps for easier lookup
    const map1 = new Map<string, ComparisonResult['differences'][0]>();
    const map2 = new Map<string, ComparisonResult['differences'][0]>();

    for (const d of diff1) {
      map1.set(`${d.category}::${d.field}`, d);
    }
    for (const d of diff2) {
      map2.set(`${d.category}::${d.field}`, d);
    }

    // Find changes only in comparison 1
    const onlyInComparison1: ComparisonResult['differences'] = [];
    for (const [key, d] of map1) {
      if (!map2.has(key)) {
        onlyInComparison1.push(d);
      }
    }

    // Find changes only in comparison 2
    const onlyInComparison2: ComparisonResult['differences'] = [];
    for (const [key, d] of map2) {
      if (!map1.has(key)) {
        onlyInComparison2.push(d);
      }
    }

    // Find changes that evolved between comparisons
    const changedBetweenComparisons: ComparisonDiff['changedBetweenComparisons'] = [];
    for (const [key, d1] of map1) {
      const d2 = map2.get(key);
      if (d2) {
        // Both have this change - check if it evolved
        const changed =
          d1.changeType !== d2.changeType ||
          JSON.stringify(d1.document1Value) !== JSON.stringify(d2.document1Value) ||
          JSON.stringify(d1.document2Value) !== JSON.stringify(d2.document2Value);

        if (changed) {
          changedBetweenComparisons.push({
            field: d1.field,
            category: d1.category,
            inComparison1: {
              changeType: d1.changeType,
              doc1Value: d1.document1Value,
              doc2Value: d1.document2Value,
            },
            inComparison2: {
              changeType: d2.changeType,
              doc1Value: d2.document1Value,
              doc2Value: d2.document2Value,
            },
          });
        }
      }
    }

    const diffResult: ComparisonDiff = {
      comparison1Id,
      comparison2Id,
      comparison1At: comp1.compared_at,
      comparison2At: comp2.compared_at,
      onlyInComparison1,
      onlyInComparison2,
      changedBetweenComparisons,
      summary: {
        newChangesCount: onlyInComparison2.length,
        resolvedChangesCount: onlyInComparison1.length,
        evolvedChangesCount: changedBetweenComparisons.length,
      },
    };

    return NextResponse.json<ApiResponse<ComparisonDiff>>({
      success: true,
      data: diffResult,
    });
  } catch (error) {
    console.error('Error comparing comparison results:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
