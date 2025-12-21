/**
 * Document Lifecycle Module Tests
 *
 * Tests for the document lifecycle automation pipeline.
 * Tests mapping functions from extraction to various modules:
 * - Covenant to compliance mapping
 * - Obligation to compliance mapping
 * - ESG provision to KPI mapping
 * - Facility to deal terms mapping
 * - Trading module mapping
 * - DD checklist generation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  mapExtractedCovenantToCompliance,
  mapExtractedObligationToCompliance,
  mapExtractedESGToKPI,
  mapFacilityToDealtTerms,
  mapFacilityToTrading,
  generateDDChecklistFromExtraction,
  generateComplianceEventsForYear,
  initializeAutomationProgress,
  updateAutomationProgress,
  getAutomationProgress,
  clearAutomationProgress,
  createCascadeDataPackage,
} from './document-lifecycle';
import type {
  ExtractedCovenant,
  ExtractedObligation,
  ExtractedESG,
  ExtractedFacility,
  ExtractedEvent,
  ExtractionResult,
} from '@/types';

describe('document-lifecycle module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('mapExtractedCovenantToCompliance', () => {
    const mockCovenant: ExtractedCovenant = {
      covenantType: 'leverage_ratio',
      covenantName: 'Maximum Total Leverage Ratio',
      numeratorDefinition: 'Consolidated Total Indebtedness',
      denominatorDefinition: 'Consolidated EBITDA',
      thresholdType: 'maximum',
      thresholdValue: 4.5,
      testingFrequency: 'quarterly',
      clauseReference: 'Section 7.1(a)',
      pageNumber: 45,
      rawText: 'The Borrower shall not permit...',
      confidence: 0.95,
    };

    it('maps covenant type correctly', () => {
      const result = mapExtractedCovenantToCompliance(mockCovenant, 0.8);

      expect(result.covenant_type).toBe('leverage_ratio');
      expect(result.name).toBe('Maximum Total Leverage Ratio');
    });

    it('sets threshold schedule from value', () => {
      const result = mapExtractedCovenantToCompliance(mockCovenant, 0.8);

      expect(result.threshold_schedule).toHaveLength(1);
      expect(result.threshold_schedule![0].threshold_value).toBe(4.5);
    });

    it('flags low confidence covenants for review', () => {
      const lowConfidenceCovenant = { ...mockCovenant, confidence: 0.6 };
      const result = mapExtractedCovenantToCompliance(lowConfidenceCovenant, 0.8);

      expect(result.requires_review).toBe(true);
    });

    it('does not flag high confidence covenants for review', () => {
      const result = mapExtractedCovenantToCompliance(mockCovenant, 0.8);

      expect(result.requires_review).toBe(false);
    });

    it('maps unknown covenant types to other', () => {
      const unknownType = { ...mockCovenant, covenantType: 'custom_type' };
      const result = mapExtractedCovenantToCompliance(unknownType, 0.8);

      expect(result.covenant_type).toBe('other');
    });
  });

  describe('mapExtractedObligationToCompliance', () => {
    const mockObligation: ExtractedObligation = {
      obligationType: 'annual_financials',
      description: 'Annual audited financial statements',
      frequency: 'annual',
      deadlineDays: 120,
      recipientRole: 'Administrative Agent',
      clauseReference: 'Section 6.1(a)',
      pageNumber: 35,
      rawText: 'The Borrower shall deliver...',
      confidence: 0.9,
    };

    it('maps obligation type correctly', () => {
      const result = mapExtractedObligationToCompliance(mockObligation, 0.8);

      expect(result.obligation_type).toBe('annual_audited_financials');
      expect(result.frequency).toBe('annual');
      expect(result.deadline_days).toBe(120);
    });

    it('sets audit requirement for annual financials', () => {
      const result = mapExtractedObligationToCompliance(mockObligation, 0.8);

      expect(result.requires_audit).toBe(true);
    });

    it('sets certification requirement for compliance certificates', () => {
      const complianceCert: ExtractedObligation = {
        ...mockObligation,
        obligationType: 'compliance_certificate',
      };
      const result = mapExtractedObligationToCompliance(complianceCert, 0.8);

      expect(result.requires_certification).toBe(true);
    });

    it('includes recipient roles', () => {
      const result = mapExtractedObligationToCompliance(mockObligation, 0.8);

      expect(result.recipient_roles).toContain('Administrative Agent');
    });
  });

  describe('mapExtractedESGToKPI', () => {
    const mockESG: ExtractedESG = {
      provisionType: 'sustainability_linked_margin',
      kpiName: 'GHG Emissions Reduction',
      kpiDefinition: 'Scope 1 and 2 emissions measured in tCO2e',
      kpiBaseline: 50000,
      kpiTargets: [
        { date: '2025-12-31', targetValue: 45000, marginAdjustment: -0.05 },
        { date: '2026-12-31', targetValue: 40000, marginAdjustment: -0.10 },
      ],
      verificationRequired: true,
      clauseReference: 'Schedule 5',
      pageNumber: 120,
      rawText: 'Sustainability linked provisions...',
      confidence: 0.88,
    };

    it('creates KPI from ESG provision', () => {
      const result = mapExtractedESGToKPI(mockESG, 0.8);

      expect(result).not.toBeNull();
      expect(result!.kpi_name).toBe('GHG Emissions Reduction');
      expect(result!.baseline_value).toBe(50000);
    });

    it('infers KPI category from name', () => {
      const result = mapExtractedESGToKPI(mockESG, 0.8);

      expect(result!.kpi_category).toBe('environmental_emissions');
    });

    it('infers improvement direction', () => {
      const result = mapExtractedESGToKPI(mockESG, 0.8);

      expect(result!.improvement_direction).toBe('decrease');
    });

    it('infers unit of measure', () => {
      const result = mapExtractedESGToKPI(mockESG, 0.8);

      expect(result!.unit_of_measure).toBe('tCO2e');
    });

    it('maps targets with margin adjustments', () => {
      const result = mapExtractedESGToKPI(mockESG, 0.8);

      expect(result!.targets).toHaveLength(2);
      expect(result!.targets[0].margin_adjustment_bps).toBe(-0.05);
    });

    it('returns null for provisions without KPI name', () => {
      const noKPI = { ...mockESG, kpiName: undefined };
      const result = mapExtractedESGToKPI(noKPI, 0.8);

      expect(result).toBeNull();
    });

    it('identifies core KPIs from sustainability linked provisions', () => {
      const result = mapExtractedESGToKPI(mockESG, 0.8);

      expect(result!.is_core_kpi).toBe(true);
    });
  });

  describe('mapFacilityToDealtTerms', () => {
    const mockFacility: ExtractedFacility = {
      facilityName: 'Apollo Credit Facility',
      facilityType: 'term',
      currency: 'USD',
      totalCommitments: 500000000,
      interestRateType: 'floating',
      baseRate: 'SOFR',
      marginInitial: 325,
      effectiveDate: '2024-01-15',
      maturityDate: '2029-01-15',
      governingLaw: 'New York',
      confidence: 0.92,
    };

    it('creates deal terms from facility', () => {
      const result = mapFacilityToDealtTerms(mockFacility);

      expect(result.length).toBeGreaterThan(0);
    });

    it('includes facility name and type', () => {
      const result = mapFacilityToDealtTerms(mockFacility);

      const nameTermIndex = result.findIndex(t => t.term_key === 'facility_name');
      expect(nameTermIndex).toBeGreaterThanOrEqual(0);
      expect(result[nameTermIndex].current_value).toBe('Apollo Credit Facility');
    });

    it('includes financial terms', () => {
      const result = mapFacilityToDealtTerms(mockFacility);

      const commitmentsTermIndex = result.findIndex(t => t.term_key === 'total_commitments');
      expect(commitmentsTermIndex).toBeGreaterThanOrEqual(0);
      expect(result[commitmentsTermIndex].current_value).toBe(500000000);
    });

    it('includes key dates', () => {
      const result = mapFacilityToDealtTerms(mockFacility);

      const maturityTermIndex = result.findIndex(t => t.term_key === 'maturity_date');
      expect(maturityTermIndex).toBeGreaterThanOrEqual(0);
    });

    it('categorizes terms correctly', () => {
      const result = mapFacilityToDealtTerms(mockFacility);

      const categories = new Set(result.map(t => t.category));
      expect(categories.has('Financial Terms')).toBe(true);
      expect(categories.has('Key Dates')).toBe(true);
    });
  });

  describe('mapFacilityToTrading', () => {
    const mockFacility: ExtractedFacility = {
      facilityName: 'Apollo Credit Facility',
      facilityReference: 'ACF-2024-001',
      borrowers: [{ name: 'Apollo Holdings Inc.', jurisdiction: 'Delaware' }],
      currency: 'USD',
      totalCommitments: 500000000,
      maturityDate: '2029-01-15',
      confidence: 0.9,
    };

    it('creates trading facility record', () => {
      const result = mapFacilityToTrading(mockFacility);

      expect(result).not.toBeNull();
      expect(result!.facility_name).toBe('Apollo Credit Facility');
      expect(result!.borrower_name).toBe('Apollo Holdings Inc.');
    });

    it('sets default transferability to consent required', () => {
      const result = mapFacilityToTrading(mockFacility);

      expect(result!.transferability).toBe('consent_required');
    });

    it('returns null when facility name missing', () => {
      const noName = { ...mockFacility, facilityName: '' };
      const result = mapFacilityToTrading(noName);

      expect(result).toBeNull();
    });
  });

  describe('generateDDChecklistFromExtraction', () => {
    const mockFacility: ExtractedFacility = {
      facilityName: 'Test Facility',
      totalCommitments: 100000000,
      maturityDate: '2028-01-15',
      confidence: 0.9,
    };

    const mockCovenants: ExtractedCovenant[] = [
      {
        covenantType: 'leverage_ratio',
        covenantName: 'Max Leverage',
        thresholdType: 'maximum',
        confidence: 0.9,
      },
    ];

    const mockObligations: ExtractedObligation[] = [
      {
        obligationType: 'compliance_certificate',
        confidence: 0.88,
      },
    ];

    const mockEvents: ExtractedEvent[] = [
      {
        eventCategory: 'payment_default',
        confidence: 0.9,
      },
    ];

    it('generates standard DD checklist items', () => {
      const result = generateDDChecklistFromExtraction(
        mockFacility,
        mockCovenants,
        mockObligations,
        mockEvents
      );

      expect(result.length).toBeGreaterThan(0);
    });

    it('includes facility verification item', () => {
      const result = generateDDChecklistFromExtraction(mockFacility, [], [], []);

      const facilityVerification = result.find(i => i.item_name.includes('Facility Agreement'));
      expect(facilityVerification).toBeDefined();
      expect(facilityVerification!.is_critical).toBe(true);
    });

    it('includes covenant compliance items when covenants present', () => {
      const result = generateDDChecklistFromExtraction(
        mockFacility,
        mockCovenants,
        [],
        []
      );

      const covenantItem = result.find(i => i.category === 'covenant_compliance');
      expect(covenantItem).toBeDefined();
    });

    it('includes documentation items when obligations present', () => {
      const result = generateDDChecklistFromExtraction(
        mockFacility,
        [],
        mockObligations,
        []
      );

      const docItem = result.find(i => i.item_name.includes('Compliance Certificates'));
      expect(docItem).toBeDefined();
    });

    it('includes events of default status when events present', () => {
      const result = generateDDChecklistFromExtraction(
        mockFacility,
        [],
        [],
        mockEvents
      );

      const eodItem = result.find(i => i.item_name.includes('Events of Default'));
      expect(eodItem).toBeDefined();
    });

    it('sets display order sequentially', () => {
      const result = generateDDChecklistFromExtraction(
        mockFacility,
        mockCovenants,
        mockObligations,
        mockEvents
      );

      const orders = result.map(i => i.display_order);
      expect(orders).toEqual([...orders].sort((a, b) => a - b));
    });
  });

  describe('generateComplianceEventsForYear', () => {
    const mockObligations = [
      {
        obligation_type: 'quarterly_financials',
        name: 'Quarterly Financial Statements',
        frequency: 'quarterly' as const,
        deadline_days: 45,
        recipient_roles: ['Agent'],
        requires_certification: false,
        requires_audit: false,
        clause_reference: null,
        confidence: 0.9,
        requires_review: false,
      },
      {
        obligation_type: 'annual_financials',
        name: 'Annual Financial Statements',
        frequency: 'annual' as const,
        deadline_days: 120,
        recipient_roles: ['Agent'],
        requires_certification: false,
        requires_audit: true,
        clause_reference: null,
        confidence: 0.9,
        requires_review: false,
      },
    ];

    it('generates quarterly events', () => {
      const result = generateComplianceEventsForYear(mockObligations);

      const quarterlyEvents = result.filter(e => e.obligation_type === 'quarterly_financials');
      expect(quarterlyEvents.length).toBe(4);
    });

    it('generates annual events', () => {
      const result = generateComplianceEventsForYear(mockObligations);

      const annualEvents = result.filter(e => e.obligation_type === 'annual_financials');
      expect(annualEvents.length).toBe(1);
    });

    it('calculates deadline dates correctly', () => {
      const result = generateComplianceEventsForYear(mockObligations);

      const quarterlyEvent = result.find(e => e.obligation_type === 'quarterly_financials');
      expect(quarterlyEvent!.deadline_date).toBeDefined();
    });

    it('sets grace deadline after primary deadline', () => {
      const result = generateComplianceEventsForYear(mockObligations);

      const event = result[0];
      const deadline = new Date(event.deadline_date);
      const graceDeadline = new Date(event.grace_deadline_date);
      expect(graceDeadline.getTime()).toBeGreaterThan(deadline.getTime());
    });
  });

  describe('automation progress tracking', () => {
    const documentId = 'test-doc-123';

    afterEach(() => {
      clearAutomationProgress(documentId);
    });

    it('initializes automation progress', () => {
      const progress = initializeAutomationProgress(documentId);

      expect(progress.documentId).toBe(documentId);
      expect(progress.phase).toBe('queued');
      expect(progress.percentComplete).toBe(0);
    });

    it('updates automation progress', () => {
      initializeAutomationProgress(documentId);

      const updated = updateAutomationProgress(documentId, {
        phase: 'extracting',
        percentComplete: 25,
        currentStep: 'Extracting facility data',
      });

      expect(updated!.phase).toBe('extracting');
      expect(updated!.percentComplete).toBe(25);
    });

    it('retrieves automation progress', () => {
      initializeAutomationProgress(documentId);

      const progress = getAutomationProgress(documentId);

      expect(progress).not.toBeNull();
      expect(progress!.documentId).toBe(documentId);
    });

    it('returns null for unknown document', () => {
      const progress = getAutomationProgress('unknown-doc');

      expect(progress).toBeNull();
    });

    it('clears automation progress', () => {
      initializeAutomationProgress(documentId);
      clearAutomationProgress(documentId);

      const progress = getAutomationProgress(documentId);

      expect(progress).toBeNull();
    });
  });

  describe('createCascadeDataPackage', () => {
    const mockExtractionResult: ExtractionResult = {
      documentId: 'doc-123',
      facility: {
        facilityName: 'Test Facility',
        totalCommitments: 100000000,
        currency: 'USD',
        maturityDate: '2028-01-15',
        confidence: 0.9,
      },
      covenants: [
        { covenantType: 'leverage_ratio', covenantName: 'Max Leverage', thresholdType: 'maximum', confidence: 0.9 },
      ],
      obligations: [
        { obligationType: 'quarterly_financials', confidence: 0.88 },
      ],
      eventsOfDefault: [],
      esgProvisions: [],
      definedTerms: [],
      overallConfidence: 0.89,
    };

    const mockConfig = {
      documentId: 'doc-123',
      organizationId: 'org-456',
      enableCompliance: true,
      enableDeals: true,
      enableTrading: true,
      enableESG: false,
      autoConfirmLowRiskItems: true,
      confidenceThreshold: 0.8,
    };

    it('creates cascade data package', () => {
      const result = createCascadeDataPackage(mockExtractionResult, mockConfig);

      expect(result.documentId).toBe('doc-123');
      expect(result.organizationId).toBe('org-456');
    });

    it('includes compliance data when enabled', () => {
      const result = createCascadeDataPackage(mockExtractionResult, mockConfig);

      expect(result.compliance).not.toBeNull();
      expect(result.compliance!.covenants.length).toBe(1);
    });

    it('includes deals data when enabled', () => {
      const result = createCascadeDataPackage(mockExtractionResult, mockConfig);

      expect(result.deals).not.toBeNull();
      expect(result.deals!.terms.length).toBeGreaterThan(0);
    });

    it('includes trading data when enabled', () => {
      const result = createCascadeDataPackage(mockExtractionResult, mockConfig);

      expect(result.trading).not.toBeNull();
    });

    it('excludes ESG data when disabled', () => {
      const result = createCascadeDataPackage(mockExtractionResult, mockConfig);

      expect(result.esg).toBeNull();
    });

    it('calculates stats correctly', () => {
      const result = createCascadeDataPackage(mockExtractionResult, mockConfig);

      expect(result.stats.totalCovenants).toBe(1);
      expect(result.stats.totalObligations).toBe(1);
      expect(result.stats.overallConfidence).toBe(0.89);
    });
  });
});
