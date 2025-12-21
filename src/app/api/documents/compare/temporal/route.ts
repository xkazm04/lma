import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { ApiResponse, ComparisonResult } from '@/types';
import type {
  TemporalComparisonResult,
  TemporalChangesSummary,
  DocumentState,
} from '@/app/features/documents/sub_Compare/lib/temporal-types';
import { differenceInDays, differenceInMonths, differenceInYears } from 'date-fns';

// Validation schema
const temporalCompareSchema = z.object({
  fromDocumentId: z.string().uuid(),
  toDocumentId: z.string().uuid(),
  includeFullDiff: z.boolean().optional().default(true),
  includeNarrative: z.boolean().optional().default(true),
});

// POST /api/documents/compare/temporal - Compare two documents temporally
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate input
    const parsed = temporalCompareSchema.safeParse(body);
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

    const { fromDocumentId, toDocumentId, includeNarrative } = parsed.data;

    // Get both documents
    const [doc1Result, doc2Result] = await Promise.all([
      supabase.from('loan_documents').select('*').eq('id', fromDocumentId).single(),
      supabase.from('loan_documents').select('*').eq('id', toDocumentId).single(),
    ]);

    if (doc1Result.error || doc2Result.error) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'One or both documents not found',
        },
      }, { status: 404 });
    }

    const doc1 = doc1Result.data;
    const doc2 = doc2Result.data;

    // Determine which is earlier (from) and which is later (to)
    const date1 = new Date(doc1.created_at);
    const date2 = new Date(doc2.created_at);
    const [fromDoc, toDoc] = date1 <= date2 ? [doc1, doc2] : [doc2, doc1];
    const fromDate = date1 <= date2 ? date1 : date2;
    const toDate = date1 <= date2 ? date2 : date1;

    // Get facilities for both documents
    const [fac1Result, fac2Result] = await Promise.all([
      supabase.from('loan_facilities').select('*').eq('source_document_id', fromDoc.id).single(),
      supabase.from('loan_facilities').select('*').eq('source_document_id', toDoc.id).single(),
    ]);

    const facility1 = fac1Result.data;
    const facility2 = fac2Result.data;

    // Build document states
    const fromState: DocumentState = {
      id: fromDoc.id,
      name: fromDoc.original_filename,
      documentType: fromDoc.document_type,
      amendmentNumber: fromDoc.document_type === 'amendment' ? null : null,
      effectiveDate: facility1?.effective_date || fromDoc.created_at,
      createdAt: fromDoc.created_at,
    };

    const toState: DocumentState = {
      id: toDoc.id,
      name: toDoc.original_filename,
      documentType: toDoc.document_type,
      amendmentNumber: toDoc.document_type === 'amendment' ? null : null,
      effectiveDate: facility2?.effective_date || toDoc.created_at,
      createdAt: toDoc.created_at,
    };

    // Compare facilities and build differences
    const differences: ComparisonResult['differences'] = [];

    if (facility1 && facility2) {
      // Compare key fields
      const fieldsToCompare = [
        { field: 'facility_name', category: 'Basic Information' },
        { field: 'total_commitments', category: 'Financial Terms' },
        { field: 'currency', category: 'Financial Terms' },
        { field: 'maturity_date', category: 'Key Dates' },
        { field: 'effective_date', category: 'Key Dates' },
        { field: 'base_rate', category: 'Interest Terms' },
        { field: 'margin_initial', category: 'Interest Terms' },
        { field: 'governing_law', category: 'Legal' },
      ];

      for (const { field, category } of fieldsToCompare) {
        const val1 = facility1[field as keyof typeof facility1];
        const val2 = facility2[field as keyof typeof facility2];

        if (val1 !== val2) {
          let changeType: 'added' | 'removed' | 'modified' = 'modified';
          if (val1 === null || val1 === undefined) changeType = 'added';
          if (val2 === null || val2 === undefined) changeType = 'removed';

          differences.push({
            field,
            category,
            document1Value: val1,
            document2Value: val2,
            changeType,
          });
        }
      }
    }

    // Get covenants for both documents
    interface CovenantRecord {
      covenant_type: string;
      covenant_name: string;
      threshold_value: number | null;
      threshold_type: string;
    }

    const [cov1Result, cov2Result] = await Promise.all([
      supabase.from('financial_covenants').select('*').eq('source_document_id', fromDoc.id),
      supabase.from('financial_covenants').select('*').eq('source_document_id', toDoc.id),
    ]);

    const covenants1: CovenantRecord[] = cov1Result.data || [];
    const covenants2: CovenantRecord[] = cov2Result.data || [];

    // Compare covenants by type
    const covenantTypes = new Set([
      ...covenants1.map((c) => c.covenant_type),
      ...covenants2.map((c) => c.covenant_type),
    ]);

    for (const type of covenantTypes) {
      const cov1 = covenants1.find((c) => c.covenant_type === type);
      const cov2 = covenants2.find((c) => c.covenant_type === type);

      if (!cov1 && cov2) {
        differences.push({
          field: `Covenant: ${type}`,
          category: 'Covenants',
          document1Value: null,
          document2Value: cov2.threshold_value,
          changeType: 'added',
        });
      } else if (cov1 && !cov2) {
        differences.push({
          field: `Covenant: ${type}`,
          category: 'Covenants',
          document1Value: cov1.threshold_value,
          document2Value: null,
          changeType: 'removed',
        });
      } else if (cov1 && cov2 && cov1.threshold_value !== cov2.threshold_value) {
        differences.push({
          field: `Covenant: ${type}`,
          category: 'Covenants',
          document1Value: cov1.threshold_value,
          document2Value: cov2.threshold_value,
          changeType: 'modified',
        });
      }
    }

    // Build temporal changes summary
    const changesSummary = buildChangesSummary(
      facility1,
      facility2,
      covenants1,
      covenants2,
      differences,
      includeNarrative
    );

    // Calculate time elapsed
    const timeElapsed = {
      days: differenceInDays(toDate, fromDate),
      months: differenceInMonths(toDate, fromDate),
      years: differenceInYears(toDate, fromDate),
    };

    // Generate impact analysis
    let impactAnalysis = '';
    if (differences.length === 0) {
      impactAnalysis = 'No significant differences found between the two document states.';
    } else {
      const impacts: string[] = [];
      impacts.push(`Over ${timeElapsed.months} months:`);

      if (changesSummary.financialTerms.commitmentChange) {
        const cc = changesSummary.financialTerms.commitmentChange;
        impacts.push(
          `Commitment ${cc.direction}d by ${Math.abs(cc.percentageChange).toFixed(1)}%`
        );
      }

      if (changesSummary.financialTerms.marginChange) {
        const mc = changesSummary.financialTerms.marginChange;
        impacts.push(
          `Margin ${mc.direction} by ${Math.abs(mc.bpsChange)}bps`
        );
      }

      if (changesSummary.covenants.tightened.length > 0) {
        impacts.push(`${changesSummary.covenants.tightened.length} covenant(s) tightened`);
      }

      if (changesSummary.covenants.loosened.length > 0) {
        impacts.push(`${changesSummary.covenants.loosened.length} covenant(s) loosened`);
      }

      if (changesSummary.dateChanges.maturityExtended) {
        impacts.push(`Maturity extended by ${changesSummary.dateChanges.maturityDays} days`);
      }

      impactAnalysis = impacts.join('. ') + '.';
    }

    const result: TemporalComparisonResult = {
      document1: {
        id: fromDoc.id,
        name: fromDoc.original_filename,
      },
      document2: {
        id: toDoc.id,
        name: toDoc.original_filename,
      },
      differences,
      impactAnalysis,
      fromState,
      toState,
      timeElapsed,
      changesSummary,
    };

    return NextResponse.json<ApiResponse<TemporalComparisonResult>>({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error performing temporal comparison:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// Helper to build changes summary
function buildChangesSummary(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  facility1: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  facility2: any,
  covenants1: Array<{ covenant_type: string; covenant_name: string; threshold_value: number | null; threshold_type: string }>,
  covenants2: Array<{ covenant_type: string; covenant_name: string; threshold_value: number | null; threshold_type: string }>,
  differences: ComparisonResult['differences'],
  includeNarrative: boolean
): TemporalChangesSummary {
  const summary: TemporalChangesSummary = {
    financialTerms: {},
    covenants: {
      tightened: [],
      loosened: [],
      added: [],
      removed: [],
    },
    dateChanges: {
      maturityExtended: false,
    },
    riskDirection: 'neutral',
    narrativePoints: [],
  };

  // Analyze commitment changes
  if (facility1?.total_commitments && facility2?.total_commitments) {
    const from = facility1.total_commitments;
    const to = facility2.total_commitments;
    if (from !== to) {
      summary.financialTerms.commitmentChange = {
        from,
        to,
        percentageChange: ((to - from) / from) * 100,
        direction: to > from ? 'increase' : 'decrease',
      };

      if (includeNarrative) {
        const dir = to > from ? 'increased' : 'decreased';
        summary.narrativePoints.push(
          `Total commitments ${dir} from ${formatCurrency(from)} to ${formatCurrency(to)}`
        );
      }
    }
  }

  // Analyze margin changes
  if (facility1?.margin_initial !== undefined && facility2?.margin_initial !== undefined) {
    const from = facility1.margin_initial;
    const to = facility2.margin_initial;
    if (from !== to) {
      summary.financialTerms.marginChange = {
        from,
        to,
        bpsChange: (to - from) * 100, // Assuming margin is in percentage
        direction: to < from ? 'tightened' : 'loosened',
      };

      if (includeNarrative) {
        const dir = to < from ? 'decreased' : 'increased';
        summary.narrativePoints.push(
          `Initial margin ${dir} from ${from}% to ${to}%`
        );
      }
    }
  }

  // Analyze covenant changes
  const covenantTypes = new Set([
    ...covenants1.map(c => c.covenant_type),
    ...covenants2.map(c => c.covenant_type),
  ]);

  for (const type of covenantTypes) {
    const cov1 = covenants1.find(c => c.covenant_type === type);
    const cov2 = covenants2.find(c => c.covenant_type === type);

    if (!cov1 && cov2) {
      summary.covenants.added.push(cov2.covenant_name || type);
      if (includeNarrative) {
        summary.narrativePoints.push(`Added new covenant: ${cov2.covenant_name || type}`);
      }
    } else if (cov1 && !cov2) {
      summary.covenants.removed.push(cov1.covenant_name || type);
      if (includeNarrative) {
        summary.narrativePoints.push(`Removed covenant: ${cov1.covenant_name || type}`);
      }
    } else if (cov1 && cov2 && cov1.threshold_value !== cov2.threshold_value) {
      const isMaximum = cov1.threshold_type === 'maximum';
      const val1 = cov1.threshold_value || 0;
      const val2 = cov2.threshold_value || 0;

      // For maximum covenants: lower value = tighter
      // For minimum covenants: higher value = tighter
      const isTighter = isMaximum ? val2 < val1 : val2 > val1;

      if (isTighter) {
        summary.covenants.tightened.push(cov1.covenant_name || type);
        if (includeNarrative) {
          summary.narrativePoints.push(
            `${cov1.covenant_name || type} tightened from ${val1}x to ${val2}x`
          );
        }
      } else {
        summary.covenants.loosened.push(cov1.covenant_name || type);
        if (includeNarrative) {
          summary.narrativePoints.push(
            `${cov1.covenant_name || type} loosened from ${val1}x to ${val2}x`
          );
        }
      }
    }
  }

  // Analyze maturity changes
  if (facility1?.maturity_date && facility2?.maturity_date) {
    const mat1 = new Date(facility1.maturity_date);
    const mat2 = new Date(facility2.maturity_date);
    const daysDiff = differenceInDays(mat2, mat1);

    if (daysDiff !== 0) {
      summary.dateChanges.maturityExtended = daysDiff > 0;
      summary.dateChanges.maturityDays = Math.abs(daysDiff);

      if (includeNarrative) {
        const action = daysDiff > 0 ? 'extended' : 'shortened';
        summary.narrativePoints.push(
          `Maturity date ${action} by ${Math.abs(daysDiff)} days`
        );
      }
    }
  }

  // Determine overall risk direction
  let favorableChanges = 0;
  let unfavorableChanges = 0;

  // Borrower perspective: more commitments, lower margin, looser covenants = favorable
  if (summary.financialTerms.commitmentChange?.direction === 'increase') favorableChanges++;
  if (summary.financialTerms.commitmentChange?.direction === 'decrease') unfavorableChanges++;

  if (summary.financialTerms.marginChange?.direction === 'tightened') unfavorableChanges++;
  if (summary.financialTerms.marginChange?.direction === 'loosened') favorableChanges++;

  favorableChanges += summary.covenants.loosened.length;
  favorableChanges += summary.covenants.removed.length;
  unfavorableChanges += summary.covenants.tightened.length;
  unfavorableChanges += summary.covenants.added.length;

  if (summary.dateChanges.maturityExtended) favorableChanges++;
  else if (summary.dateChanges.maturityDays) unfavorableChanges++;

  if (favorableChanges > unfavorableChanges) {
    summary.riskDirection = 'more_favorable';
  } else if (unfavorableChanges > favorableChanges) {
    summary.riskDirection = 'less_favorable';
  } else {
    summary.riskDirection = 'neutral';
  }

  return summary;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`;
  }
  return `$${amount}`;
}
