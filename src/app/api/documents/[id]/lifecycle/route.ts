// @ts-nocheck
/**
 * Document Lifecycle Automation API
 *
 * POST /api/documents/[id]/lifecycle - Trigger full lifecycle automation
 * GET /api/documents/[id]/lifecycle - Get automation status and results
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, type TypedSupabaseClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types';
import { runFullExtraction } from '@/lib/llm/extraction';
import {
  createCascadeDataPackage,
  initializeAutomationProgress,
  updateAutomationProgress,
  getAutomationProgress,
  type DocumentLifecycleConfig,
  type LifecycleAutomationResult,
  type AutomationError,
  type CascadeDataPackage,
} from '@/lib/llm/document-lifecycle';

// Request validation schema
interface TriggerLifecycleRequest {
  enableCompliance?: boolean;
  enableDeals?: boolean;
  enableTrading?: boolean;
  enableESG?: boolean;
  autoConfirmLowRiskItems?: boolean;
  confidenceThreshold?: number;
}

// Response types
interface LifecycleStatusResponse {
  documentId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  phase: string;
  percentComplete: number;
  currentStep: string;
  result: LifecycleAutomationResult | null;
  cascadeData: CascadeDataPackage | null;
}

// GET /api/documents/[id]/lifecycle - Get automation status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    const supabase = await createClient();

    // Get document
    const { data: document, error: docError } = await supabase
      .from('loan_documents')
      .select('*, lifecycle_automation_result')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Document not found',
        },
      }, { status: 404 });
    }

    // Check in-memory progress first
    const progress = getAutomationProgress(documentId);

    if (progress) {
      return NextResponse.json<ApiResponse<LifecycleStatusResponse>>({
        success: true,
        data: {
          documentId,
          status: progress.phase === 'completed' ? 'completed' :
                  progress.phase === 'failed' ? 'failed' : 'in_progress',
          phase: progress.phase,
          percentComplete: progress.percentComplete,
          currentStep: progress.currentStep,
          result: null,
          cascadeData: null,
        },
      });
    }

    // Check persisted result
    const lifecycleResult = document.lifecycle_automation_result;

    return NextResponse.json<ApiResponse<LifecycleStatusResponse>>({
      success: true,
      data: {
        documentId,
        status: lifecycleResult ? 'completed' : 'not_started',
        phase: lifecycleResult ? 'completed' : 'not_started',
        percentComplete: lifecycleResult ? 100 : 0,
        currentStep: lifecycleResult ? 'Automation completed' : 'Not started',
        result: lifecycleResult || null,
        cascadeData: lifecycleResult?.cascadeData || null,
      },
    });
  } catch (error) {
    console.error('Lifecycle status error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get lifecycle status',
      },
    }, { status: 500 });
  }
}

// POST /api/documents/[id]/lifecycle - Trigger lifecycle automation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const errors: AutomationError[] = [];

  try {
    const { id: documentId } = await params;
    const supabase = await createClient();

    // Get current user
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

    // Parse request body
    const body: TriggerLifecycleRequest = await request.json().catch(() => ({}));

    // Get document with raw text
    const { data: document, error: docError } = await supabase
      .from('loan_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Document not found',
        },
      }, { status: 404 });
    }

    // Verify document has been processed
    if (document.processing_status !== 'completed' && !document.raw_text) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DOCUMENT_NOT_READY',
          message: 'Document must be processed before lifecycle automation can run',
        },
      }, { status: 400 });
    }

    // Initialize progress tracking
    initializeAutomationProgress(documentId);
    updateAutomationProgress(documentId, {
      phase: 'extracting',
      percentComplete: 5,
      currentStep: 'Running AI extraction',
    });

    // Build config
    const config: DocumentLifecycleConfig = {
      documentId,
      organizationId: document.organization_id,
      enableCompliance: body.enableCompliance !== false,
      enableDeals: body.enableDeals !== false,
      enableTrading: body.enableTrading !== false,
      enableESG: body.enableESG !== false,
      autoConfirmLowRiskItems: body.autoConfirmLowRiskItems ?? false,
      confidenceThreshold: body.confidenceThreshold ?? 0.8,
    };

    // Run extraction if not already done
    let extractionResult;
    try {
      updateAutomationProgress(documentId, {
        phase: 'extracting',
        percentComplete: 10,
        currentStep: 'Extracting document data with AI',
      });

      extractionResult = await runFullExtraction(document.raw_text);
      extractionResult.documentId = documentId;

      updateAutomationProgress(documentId, {
        percentComplete: 30,
        currentStep: 'Extraction complete',
        stepsCompleted: 1,
      });
    } catch (extractError) {
      errors.push({
        module: 'extraction',
        code: 'EXTRACTION_FAILED',
        message: extractError instanceof Error ? extractError.message : 'Extraction failed',
        recoverable: false,
        timestamp: new Date().toISOString(),
      });

      updateAutomationProgress(documentId, {
        phase: 'failed',
        currentStep: 'Extraction failed',
      });

      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'EXTRACTION_FAILED',
          message: 'Document extraction failed',
        },
      }, { status: 500 });
    }

    // Create cascade data package
    const cascadeData = createCascadeDataPackage(extractionResult, config);

    // Initialize result object
    const result: LifecycleAutomationResult = {
      documentId,
      extractionResult,
      compliance: null,
      deals: null,
      trading: null,
      esg: null,
      automationStatus: 'completed',
      errors: [],
      processingTimeMs: 0,
    };

    // Process Compliance Module
    if (config.enableCompliance && cascadeData.compliance) {
      try {
        updateAutomationProgress(documentId, {
          phase: 'processing_compliance',
          percentComplete: 40,
          currentStep: 'Creating compliance facility and obligations',
        });

        const complianceResult = await processComplianceModule(
          supabase,
          cascadeData,
          config
        );
        result.compliance = complianceResult;

        updateAutomationProgress(documentId, {
          percentComplete: 50,
          stepsCompleted: 2,
          modulesProcessed: ['compliance'],
        });
      } catch (complianceError) {
        errors.push({
          module: 'compliance',
          code: 'COMPLIANCE_PROCESSING_FAILED',
          message: complianceError instanceof Error ? complianceError.message : 'Compliance processing failed',
          recoverable: true,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Process Deals Module
    if (config.enableDeals && cascadeData.deals) {
      try {
        updateAutomationProgress(documentId, {
          phase: 'processing_deals',
          percentComplete: 60,
          currentStep: 'Populating deal room terms',
        });

        const dealsResult = await processDealsModule(
          supabase,
          cascadeData,
          config
        );
        result.deals = dealsResult;

        updateAutomationProgress(documentId, {
          percentComplete: 70,
          stepsCompleted: 3,
          modulesProcessed: ['compliance', 'deals'],
        });
      } catch (dealsError) {
        errors.push({
          module: 'deals',
          code: 'DEALS_PROCESSING_FAILED',
          message: dealsError instanceof Error ? dealsError.message : 'Deals processing failed',
          recoverable: true,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Process Trading Module
    if (config.enableTrading && cascadeData.trading) {
      try {
        updateAutomationProgress(documentId, {
          phase: 'processing_trading',
          percentComplete: 80,
          currentStep: 'Setting up trading DD checklist',
        });

        const tradingResult = await processTradingModule(
          supabase,
          cascadeData,
          config
        );
        result.trading = tradingResult;

        updateAutomationProgress(documentId, {
          percentComplete: 85,
          stepsCompleted: 4,
          modulesProcessed: ['compliance', 'deals', 'trading'],
        });
      } catch (tradingError) {
        errors.push({
          module: 'trading',
          code: 'TRADING_PROCESSING_FAILED',
          message: tradingError instanceof Error ? tradingError.message : 'Trading processing failed',
          recoverable: true,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Process ESG Module
    if (config.enableESG && cascadeData.esg) {
      try {
        updateAutomationProgress(documentId, {
          phase: 'processing_esg',
          percentComplete: 90,
          currentStep: 'Creating ESG KPIs and targets',
        });

        const esgResult = await processESGModule(
          supabase,
          cascadeData,
          config
        );
        result.esg = esgResult;

        updateAutomationProgress(documentId, {
          percentComplete: 95,
          stepsCompleted: 5,
          modulesProcessed: ['compliance', 'deals', 'trading', 'esg'],
        });
      } catch (esgError) {
        errors.push({
          module: 'esg',
          code: 'ESG_PROCESSING_FAILED',
          message: esgError instanceof Error ? esgError.message : 'ESG processing failed',
          recoverable: true,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Finalize
    result.errors = errors;
    result.processingTimeMs = Date.now() - startTime;
    result.automationStatus = errors.length === 0 ? 'completed' :
                              errors.some(e => !e.recoverable) ? 'failed' : 'partial';

    // Persist result to document
    await supabase
      .from('loan_documents')
      .update({
        lifecycle_automation_result: {
          ...result,
          cascadeData,
          processedAt: new Date().toISOString(),
          processedBy: user.id,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    updateAutomationProgress(documentId, {
      phase: 'completed',
      percentComplete: 100,
      currentStep: 'Automation completed',
      stepsCompleted: 6,
    });

    return NextResponse.json<ApiResponse<LifecycleAutomationResult>>({
      success: true,
      data: result,
      meta: {
        timing: result.processingTimeMs,
      },
    });
  } catch (error) {
    console.error('Lifecycle automation error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred during lifecycle automation',
      },
    }, { status: 500 });
  }
}

// ============================================
// Module Processing Functions
// ============================================

import type {
  ComplianceAutomationResult,
  DealsAutomationResult,
  TradingAutomationResult,
  ESGAutomationResult,
} from '@/lib/llm/document-lifecycle';

async function processComplianceModule(
   
  supabase: TypedSupabaseClient,
  cascadeData: CascadeDataPackage,
  config: DocumentLifecycleConfig
): Promise<ComplianceAutomationResult> {
  const result: ComplianceAutomationResult = {
    facilityCreated: false,
    facilityId: null,
    covenantsCreated: 0,
    obligationsCreated: 0,
    eventsScheduled: 0,
    notificationsCreated: 0,
    itemsPendingReview: 0,
  };

  if (!cascadeData.compliance) return result;

  const { facilityData, covenants, obligations } = cascadeData.compliance;

  // Create compliance facility if we have facility data
  if (facilityData) {
    const { data: facility, error: facilityError } = await supabase
      .from('compliance_facilities')
      .insert({
        organization_id: config.organizationId,
        source_document_id: config.documentId,
        ...facilityData,
        status: 'active',
      })
      .select()
      .single();

    if (!facilityError && facility) {
      result.facilityCreated = true;
      result.facilityId = facility.id;

      // Create covenants
      if (covenants.length > 0) {
        const covenantRecords = covenants.map(c => ({
          facility_id: facility.id,
          source_document_id: config.documentId,
          covenant_type: c.covenant_type,
          name: c.name,
          description: c.description,
          numerator_definition: c.numerator_definition,
          denominator_definition: c.denominator_definition,
          threshold_type: c.threshold_type,
          threshold_schedule: c.threshold_schedule,
          testing_frequency: c.testing_frequency,
          testing_basis: c.testing_basis,
          has_equity_cure: c.has_equity_cure,
          clause_reference: c.clause_reference,
          is_active: true,
          requires_review: c.requires_review,
          extraction_confidence: c.confidence,
        }));

        const { data: createdCovenants } = await supabase
          .from('compliance_covenants')
          .insert(covenantRecords)
          .select();

        if (createdCovenants) {
          result.covenantsCreated = createdCovenants.length;
          result.itemsPendingReview += createdCovenants.filter(
            (c: { requires_review: boolean }) => c.requires_review
          ).length;
        }
      }

      // Create obligations
      if (obligations.length > 0) {
        const obligationRecords = obligations.map(o => ({
          facility_id: facility.id,
          source_document_id: config.documentId,
          obligation_type: o.obligation_type,
          name: o.name,
          description: o.description,
          frequency: o.frequency,
          reference_point: o.reference_point,
          deadline_days: o.deadline_days,
          recipient_roles: o.recipient_roles,
          requires_certification: o.requires_certification,
          requires_audit: o.requires_audit,
          clause_reference: o.clause_reference,
          is_active: true,
          requires_review: o.requires_review,
          extraction_confidence: o.confidence,
        }));

        const { data: createdObligations } = await supabase
          .from('compliance_obligations')
          .insert(obligationRecords)
          .select();

        if (createdObligations) {
          result.obligationsCreated = createdObligations.length;
          result.itemsPendingReview += createdObligations.filter(
            (o: { requires_review: boolean }) => o.requires_review
          ).length;
        }
      }
    }
  }

  return result;
}

async function processDealsModule(
   
  supabase: TypedSupabaseClient,
  cascadeData: CascadeDataPackage,
  config: DocumentLifecycleConfig
): Promise<DealsAutomationResult> {
  const result: DealsAutomationResult = {
    termsPopulated: 0,
    categoriesCreated: 0,
    baseTermsFromFacility: 0,
    definedTermsLinked: 0,
  };

  if (!cascadeData.deals) return result;

  const { terms, categories } = cascadeData.deals;

  // Store terms template for future deal creation
  // This creates a reference that can be used when creating new deals
  const { data: termTemplate } = await supabase
    .from('deal_term_templates')
    .upsert({
      organization_id: config.organizationId,
      source_document_id: config.documentId,
      template_name: `From ${config.documentId}`,
      categories,
      terms: terms.map(t => ({
        ...t,
        source_document_id: config.documentId,
      })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (termTemplate) {
    result.termsPopulated = terms.length;
    result.categoriesCreated = categories.length;
    result.baseTermsFromFacility = terms.length;
  }

  return result;
}

async function processTradingModule(
   
  supabase: TypedSupabaseClient,
  cascadeData: CascadeDataPackage,
  config: DocumentLifecycleConfig
): Promise<TradingAutomationResult> {
  const result: TradingAutomationResult = {
    facilityCreated: false,
    facilityId: null,
    ddChecklistItemsGenerated: 0,
    transferabilityIdentified: false,
  };

  if (!cascadeData.trading) return result;

  const { facility, ddChecklistItems } = cascadeData.trading;

  // Create trade facility
  if (facility) {
    const { data: tradeFacility, error: facilityError } = await supabase
      .from('trade_facilities')
      .insert({
        organization_id: config.organizationId,
        source_document_id: config.documentId,
        ...facility,
      })
      .select()
      .single();

    if (!facilityError && tradeFacility) {
      result.facilityCreated = true;
      result.facilityId = tradeFacility.id;
      result.transferabilityIdentified = true;
    }
  }

  // Store DD checklist template
  if (ddChecklistItems.length > 0) {
    const { data: template } = await supabase
      .from('dd_checklist_templates')
      .upsert({
        organization_id: config.organizationId,
        source_document_id: config.documentId,
        template_name: `Generated from ${config.documentId}`,
        items: ddChecklistItems,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (template) {
      result.ddChecklistItemsGenerated = ddChecklistItems.length;
    }
  }

  return result;
}

async function processESGModule(
   
  supabase: TypedSupabaseClient,
  cascadeData: CascadeDataPackage,
  config: DocumentLifecycleConfig
): Promise<ESGAutomationResult> {
  const result: ESGAutomationResult = {
    facilityCreated: false,
    facilityId: null,
    kpisCreated: 0,
    targetsCreated: 0,
    proceedsCategoriesCreated: 0,
  };

  if (!cascadeData.esg) return result;

  const { kpis, proceedsCategories } = cascadeData.esg;

  // Only create ESG facility if we have ESG-relevant data
  if (kpis.length > 0 || proceedsCategories.length > 0) {
    // Determine ESG loan type based on extracted data
    const esgLoanType = cascadeData.esg.hasMarginAdjustment
      ? 'sustainability_linked'
      : proceedsCategories.length > 0
        ? 'green_loan'
        : 'esg_linked_hybrid';

    const borrowerName = cascadeData.compliance?.facilityData?.borrower_name || 'Unknown';
    const facilityName = cascadeData.compliance?.facilityData?.facility_name || `ESG Facility - ${config.documentId.slice(0, 8)}`;

    const { data: esgFacility, error: facilityError } = await supabase
      .from('esg_facilities')
      .insert({
        organization_id: config.organizationId,
        source_document_id: config.documentId,
        facility_name: facilityName,
        facility_reference: config.documentId.slice(0, 20),
        borrower_name: borrowerName,
        esg_loan_type: esgLoanType,
        effective_date: new Date().toISOString().split('T')[0],
        maturity_date: cascadeData.compliance?.facilityData?.maturity_date ||
          new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active',
      })
      .select()
      .single();

    if (!facilityError && esgFacility) {
      result.facilityCreated = true;
      result.facilityId = esgFacility.id;

      // Create KPIs
      if (kpis.length > 0) {
        const kpiRecords = kpis.map(kpi => ({
          facility_id: esgFacility.id,
          source_document_id: config.documentId,
          kpi_name: kpi.kpi_name,
          kpi_category: kpi.kpi_category,
          kpi_subcategory: kpi.kpi_subcategory,
          unit_of_measure: kpi.unit_of_measure,
          measurement_methodology: kpi.measurement_methodology,
          baseline_year: kpi.baseline_year,
          baseline_value: kpi.baseline_value,
          improvement_direction: kpi.improvement_direction,
          is_core_kpi: kpi.is_core_kpi,
          requires_external_verification: kpi.requires_external_verification,
          clause_reference: kpi.clause_reference,
          is_active: true,
          requires_review: kpi.requires_review,
          extraction_confidence: kpi.confidence,
        }));

        const { data: createdKPIs } = await supabase
          .from('esg_kpis')
          .insert(kpiRecords)
          .select();

        if (createdKPIs) {
          result.kpisCreated = createdKPIs.length;

          // Create targets for each KPI
          let totalTargets = 0;
          for (let i = 0; i < createdKPIs.length; i++) {
            const kpi = createdKPIs[i];
            const kpiData = kpis[i];

            if (kpiData.targets && kpiData.targets.length > 0) {
              const targetRecords = kpiData.targets.map(t => ({
                kpi_id: kpi.id,
                target_year: t.target_year,
                target_period: 'annual',
                target_date: `${t.target_year}-12-31`,
                target_value: t.target_value,
                target_type: 'absolute',
                margin_adjustment_bps: t.margin_adjustment_bps,
              }));

              const { data: createdTargets } = await supabase
                .from('esg_targets')
                .insert(targetRecords)
                .select();

              if (createdTargets) {
                totalTargets += createdTargets.length;
              }
            }
          }
          result.targetsCreated = totalTargets;
        }
      }

      // Create proceeds categories
      if (proceedsCategories.length > 0) {
        const categoryRecords = proceedsCategories.map(cat => ({
          facility_id: esgFacility.id,
          category_name: cat.category_name,
          category_type: cat.category_type,
          eligibility_criteria: cat.eligibility_criteria,
          clause_reference: cat.clause_reference,
        }));

        const { data: createdCategories } = await supabase
          .from('use_of_proceeds_categories')
          .insert(categoryRecords)
          .select();

        if (createdCategories) {
          result.proceedsCategoriesCreated = createdCategories.length;
        }
      }
    }
  }

  return result;
}
