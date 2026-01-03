// @ts-nocheck
/**
 * Amendment Module Tests
 *
 * Tests for the document amendment generation LLM functions.
 * Uses mocked Claude API responses to test:
 * - Amendment draft generation
 * - Single clause generation
 * - Markdown/text conversion
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as amendment from './amendment';
import type { ComparisonResult } from '@/types';
import type { AmendmentDraft } from '@/app/features/documents/sub_Compare/lib/amendment-types';

// Mock the client module
vi.mock('./client', () => ({
  generateStructuredOutput: vi.fn(),
  generateCompletion: vi.fn(),
}));

import { generateStructuredOutput } from './client';

const mockGenerateStructuredOutput = vi.mocked(generateStructuredOutput);

describe('amendment module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const mockComparisonResult: ComparisonResult = {
    document1: {
      id: 'doc-1',
      name: 'Original Credit Agreement',
    },
    document2: {
      id: 'doc-2',
      name: 'Amended Credit Agreement',
    },
    differences: [
      {
        category: 'Financial Terms',
        field: 'Total Commitments',
        changeType: 'modified',
        document1Value: '$500,000,000',
        document2Value: '$550,000,000',
        significance: 'high',
      },
      {
        category: 'Financial Terms',
        field: 'Applicable Margin',
        changeType: 'modified',
        document1Value: '3.50%',
        document2Value: '3.25%',
        significance: 'high',
      },
    ],
    impactAnalysis: 'Facility size increased by $50M with 25bps margin reduction.',
    overallScore: 0.85,
    comparedAt: new Date().toISOString(),
  };

  describe('generateAmendmentDraft', () => {
    it('generates amendment draft from comparison result', async () => {
      const mockDraftResponse = {
        title: 'FIRST AMENDMENT TO CREDIT AGREEMENT',
        recitals: [
          'WHEREAS, the Borrower, the Lenders and the Administrative Agent are parties to that certain Credit Agreement dated as of January 15, 2024...',
          'WHEREAS, the parties hereto wish to amend certain provisions of the Credit Agreement as set forth herein...',
        ],
        clauses: [
          {
            sectionNumber: '1',
            title: 'Amendment to Section 2.01 (Commitments)',
            content: 'Section 2.01(a) of the Credit Agreement is hereby amended by deleting "$500,000,000" appearing therein and substituting "$550,000,000" therefor.',
            originalValue: '$500,000,000',
            newValue: '$550,000,000',
            category: 'Financial Terms',
            changeType: 'modified',
            confidence: 0.95,
            originalClauseReference: 'Section 2.01(a)',
          },
          {
            sectionNumber: '2',
            title: 'Amendment to Section 2.05 (Interest Rates)',
            content: 'Section 2.05(a) of the Credit Agreement is hereby amended by deleting "3.50%" appearing therein and substituting "3.25%" therefor.',
            originalValue: '3.50%',
            newValue: '3.25%',
            category: 'Financial Terms',
            changeType: 'modified',
            confidence: 0.92,
            originalClauseReference: 'Section 2.05(a)',
          },
        ],
        generalProvisions: [
          'Except as specifically amended hereby, the Credit Agreement and the other Loan Documents shall remain in full force and effect.',
          'This Amendment may be executed in counterparts.',
        ],
        summary: 'This amendment increases total facility commitments by $50,000,000 and reduces the applicable margin by 25 basis points.',
      };

      mockGenerateStructuredOutput.mockResolvedValue(mockDraftResponse);

      const result = await amendment.generateAmendmentDraft(mockComparisonResult, {
        effectiveDate: '2025-01-20',
        amendmentNumber: 'First',
      });

      expect(result.title).toBe('FIRST AMENDMENT TO CREDIT AGREEMENT');
      expect(result.clauses).toHaveLength(2);
      expect(result.clauses[0].content).toContain('$550,000,000');
      expect(result.recitals).toHaveLength(2);
      expect(result.generalProvisions).toHaveLength(2);
      expect(result.overallConfidence).toBeGreaterThan(0.9);
      expect(result.status).toBe('ready');
    });

    it('handles waiver amendments', async () => {
      const waiverComparison: ComparisonResult = {
        document1: { id: 'doc-1', name: 'Original' },
        document2: { id: 'doc-2', name: 'Waiver' },
        differences: [
          {
            category: 'Covenants',
            field: 'Maximum Leverage Ratio - Q4 2024',
            changeType: 'modified',
            document1Value: 'Tested at 4.50x',
            document2Value: 'Waived for Q4 2024',
            significance: 'high',
          },
        ],
        impactAnalysis: 'Limited waiver of leverage covenant for Q4 2024.',
        overallScore: 0.8,
        comparedAt: new Date().toISOString(),
      };

      mockGenerateStructuredOutput.mockResolvedValue({
        title: 'LIMITED WAIVER AND FIRST AMENDMENT TO CREDIT AGREEMENT',
        recitals: [
          'WHEREAS, the Borrower has informed the Administrative Agent that it anticipates a breach of Section 7.01(a) for the fiscal quarter ending December 31, 2024...',
        ],
        clauses: [
          {
            sectionNumber: '1',
            title: 'Limited Waiver',
            content: 'The Required Lenders hereby waive compliance with Section 7.01(a) (Maximum Leverage Ratio) solely for the fiscal quarter ending December 31, 2024.',
            originalValue: '4.50x tested quarterly',
            newValue: 'Waived for Q4 2024',
            category: 'Covenants',
            changeType: 'modified',
            confidence: 0.88,
            originalClauseReference: 'Section 7.01(a)',
          },
        ],
        generalProvisions: [
          'This waiver is limited solely to the extent described herein.',
        ],
        summary: 'Limited waiver of leverage covenant for Q4 2024.',
      });

      const result = await amendment.generateAmendmentDraft(waiverComparison);

      expect(result.title).toContain('WAIVER');
      expect(result.clauses[0].content).toContain('waive');
    });

    it('excludes recitals when option is false', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        title: 'AMENDMENT',
        recitals: [],
        clauses: [
          {
            sectionNumber: '1',
            title: 'Amendment',
            content: 'Amendment content',
            category: 'Terms',
            changeType: 'modified',
            confidence: 0.9,
          },
        ],
        generalProvisions: [],
        summary: 'Summary',
      });

      const result = await amendment.generateAmendmentDraft(mockComparisonResult, {
        includeRecitals: false,
        includeGeneralProvisions: false,
      });

      expect(result.recitals).toHaveLength(0);
      expect(result.generalProvisions).toHaveLength(0);
    });

    it('handles API errors', async () => {
      mockGenerateStructuredOutput.mockRejectedValue(new Error('API timeout'));

      await expect(
        amendment.generateAmendmentDraft(mockComparisonResult)
      ).rejects.toThrow('Failed to generate amendment draft');
    });
  });

  describe('generateAmendmentClause', () => {
    it('generates a single amendment clause', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        sectionNumber: '1',
        title: 'Amendment to Commitment Amount',
        content: 'Section 2.01 is hereby amended by deleting "$500,000,000" and substituting "$600,000,000" therefor.',
        originalClauseReference: 'Section 2.01',
        confidence: 0.93,
      });

      const result = await amendment.generateAmendmentClause(
        'Total Commitments',
        'Financial Terms',
        'modified',
        '$500,000,000',
        '$600,000,000'
      );

      expect(result.title).toBe('Amendment to Commitment Amount');
      expect(result.content).toContain('$600,000,000');
      expect(result.category).toBe('Financial Terms');
      expect(result.changeType).toBe('modified');
      expect(result.confidence).toBe(0.93);
      expect(result.id).toContain('clause-');
    });

    it('handles added provisions', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        sectionNumber: '2',
        title: 'Addition of ESG Reporting Provision',
        content: 'A new Section 6.15 is hereby added to the Credit Agreement to read as follows: "Section 6.15. ESG Reporting. The Borrower shall deliver to the Administrative Agent quarterly ESG reports..."',
        confidence: 0.88,
      });

      const result = await amendment.generateAmendmentClause(
        'ESG Reporting Requirement',
        'Reporting Covenants',
        'added',
        null,
        'Quarterly ESG reporting required'
      );

      expect(result.content).toContain('new Section');
      expect(result.changeType).toBe('added');
    });

    it('handles removed provisions', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        sectionNumber: '3',
        title: 'Deletion of Minimum Cash Covenant',
        content: 'Section 7.08 of the Credit Agreement is hereby deleted in its entirety.',
        originalClauseReference: 'Section 7.08',
        confidence: 0.95,
      });

      const result = await amendment.generateAmendmentClause(
        'Minimum Cash Covenant',
        'Financial Covenants',
        'removed',
        'Maintain minimum cash of $25,000,000',
        null
      );

      expect(result.content).toContain('deleted');
      expect(result.changeType).toBe('removed');
    });
  });

  describe('amendmentToMarkdown', () => {
    it('converts amendment draft to markdown format', () => {
      const draft: AmendmentDraft = {
        id: 'amendment-1',
        title: 'FIRST AMENDMENT TO CREDIT AGREEMENT',
        originalDocument: { id: 'doc-1', name: 'Original' },
        amendedDocument: { id: 'doc-2', name: 'Amended' },
        effectiveDate: 'January 20, 2025',
        recitals: [
          'WHEREAS, the parties wish to amend the Credit Agreement...',
        ],
        clauses: [
          {
            id: 'clause-1',
            sectionNumber: '1',
            title: 'Amendment to Commitments',
            content: 'Section 2.01 is hereby amended...',
            originalValue: '$500M',
            newValue: '$550M',
            category: 'Financial Terms',
            changeType: 'modified',
            confidence: 0.95,
          },
        ],
        generalProvisions: [
          'This Amendment may be executed in counterparts.',
        ],
        summary: 'Increases facility by $50M.',
        overallConfidence: 0.95,
        generatedAt: new Date().toISOString(),
        status: 'ready',
      };

      const markdown = amendment.amendmentToMarkdown(draft);

      expect(markdown).toContain('# FIRST AMENDMENT TO CREDIT AGREEMENT');
      expect(markdown).toContain('**Effective Date:** January 20, 2025');
      expect(markdown).toContain('## RECITALS');
      expect(markdown).toContain('A. WHEREAS');
      expect(markdown).toContain('## AMENDMENTS');
      expect(markdown).toContain('### Section 1: Amendment to Commitments');
      expect(markdown).toContain('> **From:** $500M');
      expect(markdown).toContain('> **To:** $550M');
      expect(markdown).toContain('## GENERAL PROVISIONS');
      expect(markdown).toContain('## SIGNATURES');
    });

    it('handles drafts without recitals', () => {
      const draft: AmendmentDraft = {
        id: 'amendment-2',
        title: 'AMENDMENT',
        originalDocument: { id: 'doc-1', name: 'Original' },
        amendedDocument: { id: 'doc-2', name: 'Amended' },
        effectiveDate: '[DATE]',
        recitals: [],
        clauses: [
          {
            id: 'clause-1',
            sectionNumber: '1',
            title: 'Amendment',
            content: 'Content here.',
            category: 'Terms',
            changeType: 'modified',
            confidence: 0.9,
            originalValue: null,
            newValue: null,
          },
        ],
        generalProvisions: [],
        summary: 'Summary',
        overallConfidence: 0.9,
        generatedAt: new Date().toISOString(),
        status: 'ready',
      };

      const markdown = amendment.amendmentToMarkdown(draft);

      expect(markdown).not.toContain('## RECITALS');
      expect(markdown).not.toContain('## GENERAL PROVISIONS');
      expect(markdown).toContain('## AMENDMENTS');
    });
  });

  describe('amendmentToText', () => {
    it('converts amendment draft to plain text format', () => {
      const draft: AmendmentDraft = {
        id: 'amendment-1',
        title: 'FIRST AMENDMENT',
        originalDocument: { id: 'doc-1', name: 'Original' },
        amendedDocument: { id: 'doc-2', name: 'Amended' },
        effectiveDate: 'January 20, 2025',
        recitals: ['WHEREAS, the parties wish to amend...'],
        clauses: [
          {
            id: 'clause-1',
            sectionNumber: '1',
            title: 'Amendment to Commitments',
            content: 'Section 2.01 is hereby amended...',
            originalValue: '$500M',
            newValue: '$550M',
            category: 'Financial Terms',
            changeType: 'modified',
            confidence: 0.95,
          },
        ],
        generalProvisions: ['May be executed in counterparts.'],
        summary: 'Increases facility.',
        overallConfidence: 0.95,
        generatedAt: new Date().toISOString(),
        status: 'ready',
      };

      const text = amendment.amendmentToText(draft);

      expect(text).toContain('FIRST AMENDMENT');
      expect(text).toContain('Effective Date: January 20, 2025');
      expect(text).toContain('RECITALS');
      expect(text).toContain('AMENDMENTS');
      expect(text).toContain('Section 1: Amendment to Commitments');
      expect(text).toContain('From: $500M');
      expect(text).toContain('To: $550M');
      expect(text).toContain('GENERAL PROVISIONS');
    });

    it('handles empty sections', () => {
      const draft: AmendmentDraft = {
        id: 'amendment-2',
        title: 'AMENDMENT',
        originalDocument: { id: 'doc-1', name: 'Original' },
        amendedDocument: { id: 'doc-2', name: 'Amended' },
        effectiveDate: '[DATE]',
        recitals: [],
        clauses: [
          {
            id: 'clause-1',
            sectionNumber: '1',
            title: 'Amendment',
            content: 'Content.',
            category: 'Terms',
            changeType: 'modified',
            confidence: 0.9,
            originalValue: null,
            newValue: null,
          },
        ],
        generalProvisions: [],
        summary: 'Summary',
        overallConfidence: 0.9,
        generatedAt: new Date().toISOString(),
        status: 'ready',
      };

      const text = amendment.amendmentToText(draft);

      expect(text).not.toContain('RECITALS');
      expect(text).not.toContain('GENERAL PROVISIONS');
      expect(text).toContain('AMENDMENTS');
    });
  });

  describe('error handling', () => {
    it('wraps API errors with descriptive message', async () => {
      mockGenerateStructuredOutput.mockRejectedValue(new Error('Network error'));

      await expect(
        amendment.generateAmendmentDraft(mockComparisonResult)
      ).rejects.toThrow('Failed to generate amendment draft: Network error');
    });

    it('handles unknown errors', async () => {
      mockGenerateStructuredOutput.mockRejectedValue('Unknown error');

      await expect(
        amendment.generateAmendmentDraft(mockComparisonResult)
      ).rejects.toThrow('Failed to generate amendment draft: Unknown error');
    });
  });
});
