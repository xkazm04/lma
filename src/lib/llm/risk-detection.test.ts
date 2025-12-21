/**
 * Risk Detection Module Tests
 *
 * Tests for the document risk detection LLM functions.
 * Uses mocked Claude API responses to test:
 * - Risk alert detection
 * - Severity scoring
 * - Mock data generation
 * - Dashboard statistics
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  detectDocumentRisks,
  generateMockRiskAlerts,
  generateMockRiskStats,
  generateMockScanResponse,
} from './risk-detection';

// Mock the client module
vi.mock('./client', () => ({
  generateStructuredOutput: vi.fn(),
}));

import { generateStructuredOutput } from './client';

const mockGenerateStructuredOutput = vi.mocked(generateStructuredOutput);

describe('risk-detection module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('detectDocumentRisks', () => {
    it('detects multiple risk categories', async () => {
      const mockResponse = {
        alerts: [
          {
            category: 'covenant_threshold',
            severity: 'high',
            title: 'Leverage Covenant Exceeds Market Standard',
            description: 'The maximum leverage ratio of 5.50x is significantly higher than market median.',
            triggeredValue: '5.50x',
            expectedValue: '4.00x - 4.50x',
            sourceLocation: {
              page: 45,
              section: 'Section 7.1',
              clauseReference: 'Financial Covenants',
            },
            confidence: 0.92,
            recommendation: 'Consider negotiating tighter leverage covenant.',
            businessImpact: 'Higher default risk.',
          },
          {
            category: 'missing_clause',
            severity: 'medium',
            title: 'Missing Material Adverse Change Clause',
            description: 'No MAC clause found in the document.',
            triggeredValue: 'Not present',
            expectedValue: 'Standard MAC clause',
            confidence: 0.95,
            recommendation: 'Request addition of market-standard MAC clause.',
          },
        ],
        summary: {
          overallRiskScore: 65,
          criticalIssuesCount: 0,
          highPriorityIssuesCount: 1,
          keyFindings: [
            'Leverage covenant significantly above market',
            'Missing standard protective provisions',
          ],
        },
      };

      mockGenerateStructuredOutput.mockResolvedValue(mockResponse);

      const result = await detectDocumentRisks(
        'doc-123',
        'Credit Agreement.pdf',
        'Credit agreement document content...'
      );

      expect(result.alerts).toHaveLength(2);
      expect(result.alerts[0].category).toBe('covenant_threshold');
      expect(result.alerts[0].severity).toBe('high');
      expect(result.summary.highPriorityIssuesCount).toBe(1);
    });

    it('assigns unique IDs to alerts', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        alerts: [
          { category: 'covenant_threshold', severity: 'medium', title: 'Alert 1', description: 'Desc', confidence: 0.9, recommendation: 'Rec' },
          { category: 'missing_clause', severity: 'low', title: 'Alert 2', description: 'Desc', confidence: 0.85, recommendation: 'Rec' },
        ],
        summary: { overallRiskScore: 40, criticalIssuesCount: 0, highPriorityIssuesCount: 0, keyFindings: [] },
      });

      const result = await detectDocumentRisks('doc-1', 'Doc.pdf', 'Content...');

      const ids = result.alerts.map(a => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('sets initial status to new', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        alerts: [
          { category: 'document_quality', severity: 'info', title: 'Draft Watermark', description: 'Desc', confidence: 0.99, recommendation: 'Rec' },
        ],
        summary: { overallRiskScore: 10, criticalIssuesCount: 0, highPriorityIssuesCount: 0, keyFindings: [] },
      });

      const result = await detectDocumentRisks('doc-1', 'Doc.pdf', 'Content...');

      expect(result.alerts[0].status).toBe('new');
    });

    it('filters by specified categories', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        alerts: [
          { category: 'covenant_threshold', severity: 'high', title: 'Covenant Issue', description: 'Desc', confidence: 0.9, recommendation: 'Rec' },
        ],
        summary: { overallRiskScore: 50, criticalIssuesCount: 0, highPriorityIssuesCount: 1, keyFindings: [] },
      });

      await detectDocumentRisks(
        'doc-1',
        'Doc.pdf',
        'Content...',
        ['covenant_threshold', 'missing_clause']
      );

      const promptUsed = mockGenerateStructuredOutput.mock.calls[0][1];
      expect(promptUsed).toContain('covenant_threshold');
      expect(promptUsed).toContain('missing_clause');
    });

    it('truncates long document content', async () => {
      const longContent = 'x'.repeat(60000);

      mockGenerateStructuredOutput.mockResolvedValue({
        alerts: [],
        summary: { overallRiskScore: 0, criticalIssuesCount: 0, highPriorityIssuesCount: 0, keyFindings: [] },
      });

      await detectDocumentRisks('doc-1', 'Long.pdf', longContent);

      const promptUsed = mockGenerateStructuredOutput.mock.calls[0][1];
      expect(promptUsed).toContain('[truncated]');
    });

    it('includes document metadata in alerts', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        alerts: [
          { category: 'party_risk', severity: 'high', title: 'Missing Guarantee', description: 'Desc', confidence: 0.87, recommendation: 'Rec' },
        ],
        summary: { overallRiskScore: 60, criticalIssuesCount: 0, highPriorityIssuesCount: 1, keyFindings: [] },
      });

      const result = await detectDocumentRisks('doc-789', 'Test Agreement.pdf', 'Content...');

      expect(result.alerts[0].documentId).toBe('doc-789');
      expect(result.alerts[0].documentName).toBe('Test Agreement.pdf');
    });

    it('includes timestamps', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        alerts: [
          { category: 'regulatory_compliance', severity: 'medium', title: 'Missing Disclosure', description: 'Desc', confidence: 0.91, recommendation: 'Rec' },
        ],
        summary: { overallRiskScore: 45, criticalIssuesCount: 0, highPriorityIssuesCount: 0, keyFindings: [] },
      });

      const beforeTime = new Date().toISOString();
      const result = await detectDocumentRisks('doc-1', 'Doc.pdf', 'Content...');
      const afterTime = new Date().toISOString();

      expect(result.alerts[0].createdAt).toBeDefined();
      expect(result.alerts[0].createdAt >= beforeTime).toBe(true);
      expect(result.alerts[0].createdAt <= afterTime).toBe(true);
    });
  });

  describe('generateMockRiskAlerts', () => {
    it('generates mock alerts for demo purposes', () => {
      const alerts = generateMockRiskAlerts();

      expect(alerts.length).toBeGreaterThan(0);
    });

    it('includes all required alert fields', () => {
      const alerts = generateMockRiskAlerts();
      const alert = alerts[0];

      expect(alert.id).toBeDefined();
      expect(alert.documentId).toBeDefined();
      expect(alert.documentName).toBeDefined();
      expect(alert.category).toBeDefined();
      expect(alert.severity).toBeDefined();
      expect(alert.status).toBeDefined();
      expect(alert.title).toBeDefined();
      expect(alert.description).toBeDefined();
      expect(alert.confidence).toBeDefined();
      expect(alert.recommendation).toBeDefined();
      expect(alert.createdAt).toBeDefined();
    });

    it('includes variety of categories', () => {
      const alerts = generateMockRiskAlerts();
      const categories = new Set(alerts.map(a => a.category));

      expect(categories.size).toBeGreaterThan(3);
    });

    it('includes variety of severities', () => {
      const alerts = generateMockRiskAlerts();
      const severities = new Set(alerts.map(a => a.severity));

      expect(severities.has('critical')).toBe(true);
      expect(severities.has('high')).toBe(true);
      expect(severities.has('medium')).toBe(true);
      expect(severities.has('low')).toBe(true);
    });

    it('includes variety of statuses', () => {
      const alerts = generateMockRiskAlerts();
      const statuses = new Set(alerts.map(a => a.status));

      expect(statuses.size).toBeGreaterThan(1);
    });

    it('includes source locations for some alerts', () => {
      const alerts = generateMockRiskAlerts();
      const alertsWithLocation = alerts.filter(a => a.sourceLocation);

      expect(alertsWithLocation.length).toBeGreaterThan(0);
    });

    it('includes regulatory references for compliance alerts', () => {
      const alerts = generateMockRiskAlerts();
      const complianceAlerts = alerts.filter(a => a.category === 'regulatory_compliance');

      const withReference = complianceAlerts.filter(a => a.regulatoryReference);
      expect(withReference.length).toBeGreaterThan(0);
    });
  });

  describe('generateMockRiskStats', () => {
    it('generates dashboard statistics', () => {
      const stats = generateMockRiskStats();

      expect(stats.totalAlerts).toBeGreaterThan(0);
      expect(stats.bySeverity).toBeDefined();
      expect(stats.byCategory).toBeDefined();
      expect(stats.byStatus).toBeDefined();
    });

    it('includes severity breakdown', () => {
      const stats = generateMockRiskStats();

      expect(stats.bySeverity.critical).toBeDefined();
      expect(stats.bySeverity.high).toBeDefined();
      expect(stats.bySeverity.medium).toBeDefined();
      expect(stats.bySeverity.low).toBeDefined();
      expect(stats.bySeverity.info).toBeDefined();
    });

    it('includes category breakdown', () => {
      const stats = generateMockRiskStats();

      expect(stats.byCategory.covenant_threshold).toBeDefined();
      expect(stats.byCategory.sanctions_screening).toBeDefined();
      expect(stats.byCategory.missing_clause).toBeDefined();
    });

    it('includes status breakdown', () => {
      const stats = generateMockRiskStats();

      expect(stats.byStatus.new).toBeDefined();
      expect(stats.byStatus.acknowledged).toBeDefined();
      expect(stats.byStatus.investigating).toBeDefined();
      expect(stats.byStatus.resolved).toBeDefined();
    });

    it('includes document metrics', () => {
      const stats = generateMockRiskStats();

      expect(stats.documentsAtRisk).toBeGreaterThan(0);
      expect(stats.totalDocumentsScanned).toBeGreaterThan(0);
      expect(stats.documentsAtRisk).toBeLessThanOrEqual(stats.totalDocumentsScanned);
    });

    it('includes overall risk score', () => {
      const stats = generateMockRiskStats();

      expect(stats.overallRiskScore).toBeGreaterThanOrEqual(0);
      expect(stats.overallRiskScore).toBeLessThanOrEqual(100);
    });

    it('includes trend information', () => {
      const stats = generateMockRiskStats();

      expect(['improving', 'stable', 'worsening']).toContain(stats.trendDirection);
      expect(stats.trendPercentage).toBeDefined();
    });

    it('includes timestamp', () => {
      const stats = generateMockRiskStats();

      expect(stats.lastScanTimestamp).toBeDefined();
      expect(new Date(stats.lastScanTimestamp).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('generateMockScanResponse', () => {
    it('generates scan response', () => {
      const response = generateMockScanResponse();

      expect(response.scanId).toBeDefined();
      expect(response.status).toBe('completed');
    });

    it('includes scan metrics', () => {
      const response = generateMockScanResponse();

      expect(response.documentsScanned).toBeGreaterThan(0);
      expect(response.alertsDetected).toBeGreaterThan(0);
      expect(response.durationMs).toBeGreaterThan(0);
    });

    it('includes severity breakdown', () => {
      const response = generateMockScanResponse();

      expect(response.alertsBySeverity).toBeDefined();
      expect(response.alertsBySeverity.critical).toBeDefined();
      expect(response.alertsBySeverity.high).toBeDefined();
      expect(response.alertsBySeverity.medium).toBeDefined();
      expect(response.alertsBySeverity.low).toBeDefined();
      expect(response.alertsBySeverity.info).toBeDefined();
    });

    it('generates scan IDs with timestamp format', () => {
      const response = generateMockScanResponse();

      // Scan ID should be in format 'scan-{timestamp}'
      expect(response.scanId).toMatch(/^scan-\d+$/);
    });
  });

  describe('error handling', () => {
    it('handles API errors gracefully', async () => {
      mockGenerateStructuredOutput.mockRejectedValue(new Error('API unavailable'));

      await expect(
        detectDocumentRisks('doc-1', 'Doc.pdf', 'Content...')
      ).rejects.toThrow('API unavailable');
    });

    it('handles empty document content', async () => {
      mockGenerateStructuredOutput.mockResolvedValue({
        alerts: [],
        summary: {
          overallRiskScore: 0,
          criticalIssuesCount: 0,
          highPriorityIssuesCount: 0,
          keyFindings: ['Document appears to be empty or unreadable'],
        },
      });

      const result = await detectDocumentRisks('doc-1', 'Empty.pdf', '');

      expect(result.alerts).toHaveLength(0);
      expect(result.summary.keyFindings).toContain('Document appears to be empty or unreadable');
    });
  });
});
