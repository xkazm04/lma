import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { compareDocumentsSchema } from '@/lib/validations';
import type { ApiResponse, ComparisonResult } from '@/types';

// POST /api/documents/compare - Compare two documents
export async function POST(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await createClient();
    const body = await request.json();

    // Validate input
    const parsed = compareDocumentsSchema.safeParse(body);
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

    const { documentId1, documentId2 } = parsed.data;

    // Get both documents
    const [doc1Result, doc2Result] = await Promise.all([
      supabase.from('loan_documents').select('*').eq('id', documentId1).single(),
      supabase.from('loan_documents').select('*').eq('id', documentId2).single(),
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

    // Get facilities for both documents
    const [fac1Result, fac2Result] = await Promise.all([
      supabase.from('loan_facilities').select('*').eq('source_document_id', documentId1).single(),
      supabase.from('loan_facilities').select('*').eq('source_document_id', documentId2).single(),
    ]);

    const facility1 = fac1Result.data;
    const facility2 = fac2Result.data;

    // Compare facilities
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
    const [cov1Result, cov2Result] = await Promise.all([
      supabase.from('financial_covenants').select('*').eq('source_document_id', documentId1),
      supabase.from('financial_covenants').select('*').eq('source_document_id', documentId2),
    ]);

    interface CovenantRecord {
      covenant_type: string;
      threshold_value: number | null;
    }
    const covenants1: CovenantRecord[] = cov1Result.data || [];
    const covenants2: CovenantRecord[] = cov2Result.data || [];

    // Compare covenants by type
    const covenantTypes = new Set([
      ...covenants1.map((c: CovenantRecord) => c.covenant_type),
      ...covenants2.map((c: CovenantRecord) => c.covenant_type),
    ]);

    for (const type of covenantTypes) {
      const cov1 = covenants1.find((c: CovenantRecord) => c.covenant_type === type);
      const cov2 = covenants2.find((c: CovenantRecord) => c.covenant_type === type);

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

    // Generate impact analysis
    let impactAnalysis = '';
    if (differences.length === 0) {
      impactAnalysis = 'No significant differences found between the two documents.';
    } else {
      const financialChanges = differences.filter(d => d.category === 'Financial Terms');
      const covenantChanges = differences.filter(d => d.category === 'Covenants');

      const impacts: string[] = [];

      if (financialChanges.length > 0) {
        impacts.push(`${financialChanges.length} financial term change(s) detected`);
      }
      if (covenantChanges.length > 0) {
        impacts.push(`${covenantChanges.length} covenant change(s) detected`);

        // Check for covenant loosening/tightening
        for (const change of covenantChanges) {
          if (change.changeType === 'modified') {
            const val1 = change.document1Value as number;
            const val2 = change.document2Value as number;
            if (val2 > val1) {
              impacts.push(`${change.field} loosened (${val1} → ${val2})`);
            } else {
              impacts.push(`${change.field} tightened (${val1} → ${val2})`);
            }
          }
        }
      }

      impactAnalysis = impacts.join('. ') + '.';
    }

    const result: ComparisonResult = {
      document1: {
        id: documentId1,
        name: doc1Result.data.original_filename,
      },
      document2: {
        id: documentId2,
        name: doc2Result.data.original_filename,
      },
      differences,
      impactAnalysis,
    };

    return NextResponse.json<ApiResponse<ComparisonResult>>({
      success: true,
      data: result,
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
