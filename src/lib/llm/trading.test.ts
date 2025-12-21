/**
 * Trading Module Tests
 *
 * Tests for the trading/due diligence LLM functions.
 * Uses mocked Claude API responses to test:
 * - Due diligence Q&A
 * - Auto-verification
 * - DD report generation
 * - Settlement memo generation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Create hoisted mock for @anthropic-ai/sdk
const { mockCreate } = vi.hoisted(() => {
  return { mockCreate: vi.fn() };
});

// Mock @anthropic-ai/sdk
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = {
        create: mockCreate,
      };
    },
  };
});

// Import after mocking
import * as trading from './trading';

describe('trading module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('answerDDQuestion', () => {
    it('answers questions about trade terms', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              question: 'What is the trade settlement date?',
              answer: 'The settlement date for trade TRD-2024-001 is T+7, scheduled for January 22, 2025.',
              sources: [
                {
                  type: 'trade_data',
                  reference: 'Trade TRD-2024-001',
                  excerpt: 'Settlement: T+7',
                },
              ],
              confidence: 0.95,
              suggested_actions: ['Confirm wire instructions'],
              related_dd_items: [],
            }),
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await trading.answerDDQuestion({
        question: 'What is the trade settlement date?',
        trade_context: {
          facility_name: 'Apollo Credit Facility',
          borrower_name: 'Apollo Holdings',
          trade_amount: 10000000,
          trade_price: 99.5,
          facility_status: 'performing',
          transferability: 'consent_required',
        },
      });

      expect(mockCreate).toHaveBeenCalled();
      expect(result.answer).toContain('January 22');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('includes document excerpts in context', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              question: 'What are the consent requirements?',
              answer: 'Based on the credit agreement, consent is required.',
              sources: [{ type: 'document', reference: 'Credit Agreement' }],
              confidence: 0.88,
              suggested_actions: [],
              related_dd_items: [],
            }),
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      await trading.answerDDQuestion({
        question: 'What are the consent requirements?',
        trade_context: {
          facility_name: 'Test Facility',
          borrower_name: 'Test Borrower',
          trade_amount: 5000000,
          trade_price: 98.0,
          facility_status: 'performing',
          transferability: 'consent_required',
        },
        document_excerpts: [
          'Section 10.4: Assignments require borrower consent',
        ],
      });

      expect(mockCreate).toHaveBeenCalled();
      const callArg = mockCreate.mock.calls[0][0];
      expect(callArg.messages[0].content).toContain('DOCUMENT EXCERPTS');
    });

    it('includes compliance data in context', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              question: 'What is the covenant status?',
              answer: 'All covenants are in compliance',
              sources: [],
              confidence: 0.9,
              suggested_actions: [],
              related_dd_items: [],
            }),
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      await trading.answerDDQuestion({
        question: 'What is the covenant status?',
        trade_context: {
          facility_name: 'Test Facility',
          borrower_name: 'Test Borrower',
          trade_amount: 5000000,
          trade_price: 98.0,
          facility_status: 'performing',
          transferability: 'free',
        },
        compliance_data: {
          covenant_status: 'compliant',
          recent_test_results: [
            { covenant_name: 'Leverage Ratio', result: 'pass', headroom: 15 },
          ],
        },
      });

      expect(mockCreate).toHaveBeenCalled();
      const callArg = mockCreate.mock.calls[0][0];
      expect(callArg.messages[0].content).toContain('COMPLIANCE DATA');
    });

    it('handles API errors gracefully', async () => {
      mockCreate.mockRejectedValue(new Error('Service unavailable'));

      await expect(
        trading.answerDDQuestion({
          question: 'Test question?',
          trade_context: {
            facility_name: 'Test',
            borrower_name: 'Test',
            trade_amount: 1000000,
            trade_price: 100,
            facility_status: 'performing',
            transferability: 'free',
          },
        })
      ).rejects.toThrow('Service unavailable');
    });

    it('handles malformed JSON response gracefully', async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'Invalid JSON response that cannot be parsed',
          },
        ],
      });

      const result = await trading.answerDDQuestion({
        question: 'Test?',
        trade_context: {
          facility_name: 'Test',
          borrower_name: 'Test',
          trade_amount: 1000000,
          trade_price: 100,
          facility_status: 'performing',
          transferability: 'free',
        },
      });

      // Should return fallback response
      expect(result.confidence).toBe(0);
      expect(result.suggested_actions).toContain('Manual review required');
    });
  });

  describe('autoVerifyDDItem', () => {
    it('verifies DD item based on provided data', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              can_auto_verify: true,
              verification_status: 'verified',
              confidence: 0.92,
              verification_data: { covenant_tests_passed: 8 },
              notes: 'All covenant tests passed for past 8 quarters',
            }),
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await trading.autoVerifyDDItem({
        item_name: 'Covenant Compliance History',
        item_description: 'Verify covenant compliance history over the past 2 years',
        category: 'covenant_compliance',
        facility_data: {
          facility_name: 'Apollo Credit Facility',
          borrower_name: 'Apollo Holdings',
          facility_status: 'performing',
          maturity_date: '2029-01-15',
        },
        compliance_data: {
          covenant_results: [
            { name: 'Leverage Ratio', result: 'pass', test_date: '2024-09-30' },
            { name: 'Leverage Ratio', result: 'pass', test_date: '2024-06-30' },
          ],
          recent_financials_date: '2024-09-30',
          overdue_obligations: 0,
        },
      });

      expect(mockCreate).toHaveBeenCalled();
      expect(result.verification_status).toBe('verified');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('flags items requiring attention', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              can_auto_verify: false,
              verification_status: 'flagged',
              confidence: 0.75,
              verification_data: {},
              notes: 'Amendment referenced but not provided',
              flag_reason: 'Missing Amendment No. 3',
              flag_severity: 'warning',
            }),
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await trading.autoVerifyDDItem({
        item_name: 'Credit Agreement Review',
        item_description: 'Review credit agreement and all amendments',
        category: 'documentation',
        facility_data: {
          facility_name: 'Test Facility',
          borrower_name: 'Test Borrower',
          facility_status: 'performing',
          maturity_date: '2028-06-30',
        },
        document_data: {
          credit_agreement_exists: true,
          recent_amendments: 2,
          information_package_available: true,
        },
      });

      expect(result.verification_status).toBe('flagged');
      expect(result.flag_reason).toContain('Missing Amendment No. 3');
    });

    it('handles API errors by returning pending_manual status', async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'not valid json',
          },
        ],
      });

      const result = await trading.autoVerifyDDItem({
        item_name: 'Test Item',
        item_description: 'Test description',
        category: 'test',
        facility_data: {
          facility_name: 'Test Facility',
          borrower_name: 'Test Borrower',
          facility_status: 'performing',
          maturity_date: '2028-01-01',
        },
      });

      expect(result.verification_status).toBe('pending_manual');
      expect(result.can_auto_verify).toBe(false);
    });
  });

  describe('generateDDReport', () => {
    it('generates comprehensive DD report', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              risk_assessment: 'Due diligence complete with minor flags. One item pending Q3 financials audit.',
              recommendations: ['Proceed to settlement', 'Follow up on Q3 financials when available'],
            }),
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await trading.generateDDReport({
        trade: {
          trade_reference: 'TRD-2024-001',
          trade_date: '2025-01-15',
          settlement_date: '2025-01-22',
          trade_amount: 10000000,
          trade_price: 99.5,
          facility_name: 'Apollo Credit Facility',
          borrower_name: 'Apollo Holdings',
          seller_name: 'Bank ABC',
          buyer_name: 'Fund XYZ',
        },
        checklist: {
          status: 'ready_to_close',
          categories: [
            {
              category: 'documentation',
              items: [
                { item_name: 'Credit Agreement', status: 'verified', is_critical: true, verification_notes: 'Reviewed', flag_reason: null, flag_severity: null },
                { item_name: 'Amendment 1', status: 'verified', is_critical: true, verification_notes: 'Reviewed', flag_reason: null, flag_severity: null },
              ],
            },
            {
              category: 'compliance',
              items: [
                { item_name: 'Covenant Status', status: 'verified', is_critical: true, verification_notes: 'All pass', flag_reason: null, flag_severity: null },
                { item_name: 'Q3 Financials', status: 'flagged', is_critical: false, verification_notes: null, flag_reason: 'Pending audit', flag_severity: 'info' },
              ],
            },
          ],
        },
        include_qa: false,
        include_timeline: false,
      });

      expect(mockCreate).toHaveBeenCalled();
      expect(result.risk_assessment).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('includes Q&A summary when requested', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              risk_assessment: 'Trade ready to proceed.',
              recommendations: ['Close trade'],
            }),
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      await trading.generateDDReport({
        trade: {
          trade_reference: 'TRD-2024-002',
          trade_date: '2025-01-15',
          settlement_date: '2025-01-22',
          trade_amount: 5000000,
          trade_price: 98.0,
          facility_name: 'Test Facility',
          borrower_name: 'Test Borrower',
          seller_name: 'Seller Bank',
          buyer_name: 'Buyer Fund',
        },
        checklist: {
          status: 'in_progress',
          categories: [
            {
              category: 'documentation',
              items: [
                { item_name: 'Credit Agreement', status: 'verified', is_critical: true, verification_notes: 'OK', flag_reason: null, flag_severity: null },
              ],
            },
          ],
        },
        questions: [
          { question: 'What is the maturity date?', answer: '2029-01-15', status: 'answered', asked_at: '2025-01-10' },
          { question: 'Any pending amendments?', answer: null, status: 'open', asked_at: '2025-01-12' },
        ],
        include_qa: true,
        include_timeline: false,
      });

      expect(mockCreate).toHaveBeenCalled();
      const callArg = mockCreate.mock.calls[0][0];
      expect(callArg.messages[0].content).toContain('Q&A SUMMARY');
    });
  });

  describe('generateSettlementMemo', () => {
    it('generates settlement calculation memo', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              summary: 'Trade TRD-2024-001 ready for settlement on 2025-01-22.',
              key_terms: ['Principal: $10,000,000', 'Trade Price: 99.5%', 'Accrued Interest: $60,684.93'],
              settlement_breakdown: 'Purchase Price: $9,950,000 + Accrued Interest: $60,684.93 = Total: $10,010,684.93',
              conditions_precedent: ['DD complete', 'Wire instructions confirmed'],
              next_steps: ['Execute assignment agreement', 'Wire funds'],
            }),
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await trading.generateSettlementMemo({
        trade: {
          trade_reference: 'TRD-2024-001',
          facility_name: 'Apollo Credit Facility',
          borrower_name: 'Apollo Holdings',
          seller_name: 'Bank ABC',
          buyer_name: 'Fund XYZ',
          trade_date: '2025-01-15',
          settlement_date: '2025-01-22',
        },
        settlement: {
          principal_amount: 10000000,
          trade_price: 99.5,
          purchase_price_amount: 9950000,
          accrued_interest: 60684.93,
          delayed_compensation: null,
          total_settlement_amount: 10010684.93,
        },
        dd_summary: {
          status: 'complete',
          total_items: 15,
          verified_items: 14,
          flagged_items: 1,
          open_questions: 0,
        },
        consent_status: {
          required: true,
          received: true,
          consent_date: '2025-01-18',
        },
      });

      expect(mockCreate).toHaveBeenCalled();
      expect(result.summary).toBeDefined();
      expect(result.key_terms.length).toBeGreaterThan(0);
      expect(result.next_steps.length).toBeGreaterThan(0);
    });

    it('handles malformed response with fallback', async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'not valid json',
          },
        ],
      });

      const result = await trading.generateSettlementMemo({
        trade: {
          trade_reference: 'TRD-2024-001',
          facility_name: 'Test Facility',
          borrower_name: 'Test Borrower',
          seller_name: 'Seller',
          buyer_name: 'Buyer',
          trade_date: '2025-01-15',
          settlement_date: '2025-01-22',
        },
        settlement: {
          principal_amount: 5000000,
          trade_price: 98.0,
          purchase_price_amount: 4900000,
          accrued_interest: null,
          delayed_compensation: null,
          total_settlement_amount: 4900000,
        },
        dd_summary: {
          status: 'in_progress',
          total_items: 10,
          verified_items: 8,
          flagged_items: 2,
          open_questions: 1,
        },
      });

      // Should return fallback response
      expect(result.summary).toContain('TRD-2024-001');
      expect(result.conditions_precedent).toContain('Complete due diligence');
    });
  });

  describe('screenTrade', () => {
    it('screens trade for risks', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              risk_level: 'low',
              blocking_issues: [],
              warnings: ['Consent required from borrower'],
              recommendations: ['Initiate consent request early'],
              proceed_with_caution: false,
            }),
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await trading.screenTrade({
        facility: {
          facility_name: 'Apollo Credit Facility',
          borrower_name: 'Apollo Holdings',
          facility_status: 'performing',
          transferability: 'consent_required',
          maturity_date: '2029-01-15',
        },
        trade: {
          trade_amount: 10000000,
          trade_price: 99.5,
          seller_name: 'Bank ABC',
          buyer_name: 'Fund XYZ',
        },
      });

      expect(mockCreate).toHaveBeenCalled();
      expect(result.risk_level).toBe('low');
      expect(result.blocking_issues).toEqual([]);
    });

    it('detects high risk trades', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              risk_level: 'high',
              blocking_issues: ['Party matches restricted list'],
              warnings: ['Recent covenant breach'],
              recommendations: ['Do not proceed without compliance approval'],
              proceed_with_caution: true,
            }),
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await trading.screenTrade({
        facility: {
          facility_name: 'Test Facility',
          borrower_name: 'Test Borrower',
          facility_status: 'watchlist',
          transferability: 'restricted',
          maturity_date: '2026-06-30',
        },
        trade: {
          trade_amount: 5000000,
          trade_price: 85.0,
          seller_name: 'Distressed Seller',
          buyer_name: 'Restricted Buyer',
        },
        compliance_summary: {
          covenant_status: 'breach',
          overdue_items: 3,
          recent_breaches: 1,
        },
        restricted_parties: ['Restricted Buyer'],
      });

      expect(result.risk_level).toBe('high');
      expect(result.blocking_issues.length).toBeGreaterThan(0);
      expect(result.proceed_with_caution).toBe(true);
    });
  });
});
