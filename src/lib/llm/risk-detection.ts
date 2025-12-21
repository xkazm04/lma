import { generateStructuredOutput } from './client';
import type {
  RiskAlert,
  RiskAlertSeverity,
  RiskCategory,
  RiskDashboardStats,
  RiskScanResponse,
} from '@/app/features/documents/lib/types';

const RISK_DETECTION_SYSTEM_PROMPT = `You are an expert loan document risk analyst specializing in identifying regulatory, compliance, and financial risks in syndicated and bilateral loan agreements. Your task is to analyze loan documents and detect potential risks.

You must identify the following types of risks:

1. **Covenant Threshold Risks** (covenant_threshold):
   - Unusual covenant levels that deviate significantly from market standards
   - Leverage ratios above 5.5x or below 2.0x
   - Interest coverage below 2.0x
   - Fixed charge coverage below 1.1x

2. **Sanctions Screening Risks** (sanctions_screening):
   - Borrower, guarantor, or agent names that may appear on sanctions lists
   - Names matching known sanctioned entities (OFAC, EU, UN)
   - Related parties in high-risk jurisdictions

3. **Missing Required Clauses** (missing_clause):
   - Material adverse change (MAC) clause
   - Cross-default provisions
   - Mandatory prepayment triggers
   - Representations and warranties
   - Information covenants

4. **Conflicting Terms** (conflicting_terms):
   - Terms that contradict other documents in the same deal
   - Inconsistent definitions across documents
   - Ambiguous provisions

5. **Unusual Terms** (unusual_terms):
   - Terms that deviate significantly from market practice
   - Unusually borrower-friendly or lender-friendly provisions
   - Non-standard provisions

6. **Regulatory Compliance** (regulatory_compliance):
   - Potential regulatory violations
   - Missing regulatory disclosures
   - Non-compliant structures

7. **Document Quality** (document_quality):
   - Missing signatures or dates
   - Incomplete schedules or exhibits
   - Draft watermarks
   - Execution errors

8. **Party Risk** (party_risk):
   - Entities with known credit issues
   - Unusual corporate structures
   - Missing guarantees from key entities

For each detected risk, provide:
- A clear title and detailed description
- Severity level (info, low, medium, high, critical)
- Confidence score (0.0 to 1.0)
- Specific recommendation for addressing the risk
- Business impact assessment

Always respond with valid JSON matching the expected schema.`;

interface RawRiskDetectionResponse {
  alerts: Array<{
    category: RiskCategory;
    severity: RiskAlertSeverity;
    title: string;
    description: string;
    triggeredValue?: string;
    expectedValue?: string;
    sourceLocation?: {
      page?: number;
      section?: string;
      clauseReference?: string;
    };
    confidence: number;
    recommendation: string;
    businessImpact?: string;
    regulatoryReference?: string;
  }>;
  summary: {
    overallRiskScore: number;
    criticalIssuesCount: number;
    highPriorityIssuesCount: number;
    keyFindings: string[];
  };
}

/**
 * Generate AI-powered risk detection for a document
 */
export async function detectDocumentRisks(
  documentId: string,
  documentName: string,
  documentContent: string,
  categories?: RiskCategory[]
): Promise<{ alerts: RiskAlert[]; summary: RawRiskDetectionResponse['summary'] }> {
  const categoryFilter = categories?.length
    ? `Focus on the following risk categories: ${categories.join(', ')}`
    : 'Analyze all risk categories';

  const userPrompt = `Analyze the following loan document for potential risks.

**Document ID**: ${documentId}
**Document Name**: ${documentName}

${categoryFilter}

**Document Content**:
${documentContent.slice(0, 50000)} ${documentContent.length > 50000 ? '... [truncated]' : ''}

Provide your analysis in the following JSON format:
\`\`\`json
{
  "alerts": [
    {
      "category": "covenant_threshold" | "sanctions_screening" | "missing_clause" | "conflicting_terms" | "unusual_terms" | "regulatory_compliance" | "document_quality" | "party_risk",
      "severity": "info" | "low" | "medium" | "high" | "critical",
      "title": "Brief risk title",
      "description": "Detailed description of the risk",
      "triggeredValue": "The specific value or text that triggered this alert",
      "expectedValue": "The expected or normal value",
      "sourceLocation": {
        "page": 1,
        "section": "Section name",
        "clauseReference": "Clause reference"
      },
      "confidence": 0.0-1.0,
      "recommendation": "Specific recommendation for addressing this risk",
      "businessImpact": "Description of potential business impact",
      "regulatoryReference": "Regulatory reference if applicable"
    }
  ],
  "summary": {
    "overallRiskScore": 0-100,
    "criticalIssuesCount": 0,
    "highPriorityIssuesCount": 0,
    "keyFindings": ["Finding 1", "Finding 2"]
  }
}
\`\`\`

Important:
- Be thorough but avoid false positives
- Provide actionable recommendations
- Be specific about locations in the document
- Consider both legal and business implications`;

  const rawResponse = await generateStructuredOutput<RawRiskDetectionResponse>(
    RISK_DETECTION_SYSTEM_PROMPT,
    userPrompt,
    { maxTokens: 8192, temperature: 0.2 }
  );

  // Transform raw alerts to full RiskAlert objects
  const now = new Date().toISOString();
  const alerts: RiskAlert[] = rawResponse.alerts.map((alert, index) => ({
    id: `risk-${documentId}-${index}-${Date.now()}`,
    documentId,
    documentName,
    category: alert.category,
    severity: alert.severity,
    status: 'new',
    title: alert.title,
    description: alert.description,
    triggeredValue: alert.triggeredValue,
    expectedValue: alert.expectedValue,
    sourceLocation: alert.sourceLocation,
    confidence: alert.confidence,
    recommendation: alert.recommendation,
    businessImpact: alert.businessImpact,
    regulatoryReference: alert.regulatoryReference,
    createdAt: now,
    updatedAt: now,
  }));

  return { alerts, summary: rawResponse.summary };
}

/**
 * Generate mock risk alerts for development/demo purposes
 */
export function generateMockRiskAlerts(): RiskAlert[] {
  const now = new Date().toISOString();
  const alerts: RiskAlert[] = [
    {
      id: 'risk-1',
      documentId: 'doc-1',
      documentName: 'Apollo Credit Facility Agreement.pdf',
      category: 'covenant_threshold',
      severity: 'high',
      status: 'new',
      title: 'Leverage Covenant Exceeds Market Standard',
      description: 'The maximum leverage ratio of 5.50x is significantly higher than the market median of 4.25x for similar investment-grade facilities. This represents a 29% deviation from market standards.',
      triggeredValue: '5.50x',
      expectedValue: '4.00x - 4.50x',
      sourceLocation: {
        page: 45,
        section: 'Section 7.1',
        clauseReference: 'Financial Covenants',
      },
      confidence: 0.92,
      recommendation: 'Consider negotiating tighter leverage covenant or adding step-downs over time. Review credit analysis to justify deviation from market.',
      businessImpact: 'Higher default risk and potential credit rating concerns.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'risk-2',
      documentId: 'doc-2',
      documentName: 'Meridian Holdings Term Loan B.pdf',
      category: 'sanctions_screening',
      severity: 'critical',
      status: 'new',
      title: 'Potential Sanctions Match - Guarantor Entity',
      description: 'Guarantor entity "Northern Star Holdings Ltd" has a 78% name match with a sanctioned entity on the OFAC SDN list. Manual verification required.',
      triggeredValue: 'Northern Star Holdings Ltd',
      expectedValue: 'Clear of sanctions',
      sourceLocation: {
        page: 2,
        section: 'Parties',
        clauseReference: 'Guarantors',
      },
      relatedDocumentIds: ['doc-3'],
      confidence: 0.78,
      recommendation: 'Immediately escalate to compliance team for enhanced due diligence. Obtain official sanctions screening certificate before proceeding.',
      businessImpact: 'Potential regulatory violation, significant fines, and reputational damage.',
      regulatoryReference: 'OFAC SDN List, Executive Order 13224',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'risk-3',
      documentId: 'doc-3',
      documentName: 'Silvergate Amendment No. 2.pdf',
      category: 'missing_clause',
      severity: 'medium',
      status: 'acknowledged',
      title: 'Missing Material Adverse Change (MAC) Clause',
      description: 'The amendment does not include a Material Adverse Change clause, which is standard in comparable facilities. This leaves lenders without protection against significant borrower deterioration.',
      triggeredValue: 'Not present',
      expectedValue: 'Standard MAC clause',
      sourceLocation: {
        section: 'Representations and Warranties',
      },
      confidence: 0.95,
      recommendation: 'Request addition of market-standard MAC clause covering business, financial condition, and ability to perform obligations.',
      businessImpact: 'Reduced lender protection in case of borrower distress.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'risk-4',
      documentId: 'doc-1',
      documentName: 'Apollo Credit Facility Agreement.pdf',
      category: 'conflicting_terms',
      severity: 'high',
      status: 'investigating',
      title: 'Inconsistent Interest Payment Dates',
      description: 'Interest payment dates specified in Section 2.8 (quarterly) conflict with the Payment Schedule in Schedule 3 (monthly). This creates ambiguity about payment obligations.',
      triggeredValue: 'Quarterly (Section 2.8)',
      expectedValue: 'Consistent dates',
      sourceLocation: {
        page: 12,
        section: 'Section 2.8',
        clauseReference: 'Interest Payments',
      },
      relatedDocumentIds: ['doc-1'],
      confidence: 0.88,
      recommendation: 'Request clarification amendment to align interest payment dates. Document agreed interpretation in side letter if amendment not possible.',
      businessImpact: 'Potential payment disputes and operational confusion.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'risk-5',
      documentId: 'doc-4',
      documentName: 'Cascade Industries Revolver.pdf',
      category: 'unusual_terms',
      severity: 'medium',
      status: 'new',
      title: 'Unusually Broad Borrower Indemnification',
      description: 'The indemnification clause (Section 11.3) extends borrower liability to cover lender gross negligence, which exceeds market standard protections.',
      triggeredValue: 'Including gross negligence',
      expectedValue: 'Excluding gross negligence and willful misconduct',
      sourceLocation: {
        page: 78,
        section: 'Section 11.3',
        clauseReference: 'Indemnification',
      },
      confidence: 0.85,
      recommendation: 'Negotiate standard carve-outs for lender gross negligence and willful misconduct. Review precedent documents for acceptable language.',
      businessImpact: 'Excessive borrower exposure to lender liability.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'risk-6',
      documentId: 'doc-5',
      documentName: 'Phoenix Capital Bridge Loan.pdf',
      category: 'regulatory_compliance',
      severity: 'medium',
      status: 'new',
      title: 'Missing Dodd-Frank Disclosure',
      description: 'Required Dodd-Frank Section 1071 small business lending data collection disclosures are not included in the facility agreement.',
      triggeredValue: 'Not present',
      expectedValue: 'Dodd-Frank 1071 disclosures',
      sourceLocation: {
        section: 'Regulatory Disclosures',
      },
      confidence: 0.91,
      recommendation: 'Add required regulatory disclosures in supplemental documentation. Ensure compliance with applicable reporting requirements.',
      businessImpact: 'Potential regulatory non-compliance and associated penalties.',
      regulatoryReference: 'Dodd-Frank Act Section 1071, 12 CFR Part 1002',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'risk-7',
      documentId: 'doc-6',
      documentName: 'Titan Holdings 2024 Amendment.pdf',
      category: 'document_quality',
      severity: 'low',
      status: 'new',
      title: 'Draft Watermark Present',
      description: 'Document contains "DRAFT" watermark on pages 1-15, suggesting this may not be the final executed version.',
      triggeredValue: 'DRAFT watermark',
      expectedValue: 'Clean final document',
      sourceLocation: {
        page: 1,
        section: 'All pages',
      },
      confidence: 0.99,
      recommendation: 'Verify this is the correct final executed version. Obtain clean copy without watermark if this is the official document.',
      businessImpact: 'Potential use of non-final document terms.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'risk-8',
      documentId: 'doc-7',
      documentName: 'Nexus Energy Credit Agreement.pdf',
      category: 'party_risk',
      severity: 'high',
      status: 'new',
      title: 'Missing Parent Company Guarantee',
      description: 'The borrower is a subsidiary entity but no guarantee from the parent company (Nexus Energy Holdings Inc.) is included in the credit documentation.',
      triggeredValue: 'No parent guarantee',
      expectedValue: 'Parent company guarantee',
      sourceLocation: {
        section: 'Guarantees',
      },
      confidence: 0.87,
      recommendation: 'Require parent company guarantee as condition to closing. Assess standalone creditworthiness of subsidiary if guarantee not obtainable.',
      businessImpact: 'Reduced credit support and higher recovery risk in default.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'risk-9',
      documentId: 'doc-1',
      documentName: 'Apollo Credit Facility Agreement.pdf',
      category: 'covenant_threshold',
      severity: 'low',
      status: 'resolved',
      title: 'Fixed Charge Coverage Ratio at Lower Bound',
      description: 'The minimum fixed charge coverage ratio of 1.10x is at the lower end of the market range (1.10x - 1.25x).',
      triggeredValue: '1.10x',
      expectedValue: '1.15x - 1.25x',
      sourceLocation: {
        page: 46,
        section: 'Section 7.2',
        clauseReference: 'Financial Covenants',
      },
      confidence: 0.75,
      recommendation: 'While within market range, monitor closely and consider step-up provisions.',
      businessImpact: 'Limited cushion for financial underperformance.',
      createdAt: now,
      updatedAt: now,
      resolvedBy: 'john.smith@lender.com',
      resolutionNotes: 'Reviewed with credit committee. Acceptable given strong borrower fundamentals and additional collateral package.',
    },
    {
      id: 'risk-10',
      documentId: 'doc-8',
      documentName: 'Quantum Tech Facility Agreement.pdf',
      category: 'unusual_terms',
      severity: 'info',
      status: 'new',
      title: 'Non-Standard Prepayment Premium',
      description: 'Prepayment premium structure (5/4/3/2/1%) is higher than typical market terms (3/2/1% or flat).',
      triggeredValue: '5/4/3/2/1% premium',
      expectedValue: '3/2/1% or flat',
      sourceLocation: {
        page: 22,
        section: 'Section 3.4',
        clauseReference: 'Voluntary Prepayments',
      },
      confidence: 0.82,
      recommendation: 'Document rationale for enhanced prepayment protection. Consider if market conditions justify this structure.',
      businessImpact: 'Increased cost of prepayment for borrower, beneficial for lender yield protection.',
      createdAt: now,
      updatedAt: now,
    },
  ];

  return alerts;
}

/**
 * Generate mock risk dashboard statistics
 */
export function generateMockRiskStats(): RiskDashboardStats {
  return {
    totalAlerts: 23,
    bySeverity: {
      critical: 2,
      high: 5,
      medium: 8,
      low: 5,
      info: 3,
    },
    byCategory: {
      covenant_threshold: 6,
      sanctions_screening: 2,
      missing_clause: 4,
      conflicting_terms: 3,
      unusual_terms: 4,
      regulatory_compliance: 2,
      document_quality: 1,
      party_risk: 1,
    },
    byStatus: {
      new: 15,
      acknowledged: 3,
      investigating: 2,
      resolved: 2,
      false_positive: 1,
    },
    documentsAtRisk: 8,
    totalDocumentsScanned: 47,
    overallRiskScore: 62,
    trendDirection: 'worsening',
    trendPercentage: 12,
    lastScanTimestamp: new Date().toISOString(),
  };
}

/**
 * Generate mock scan response
 */
export function generateMockScanResponse(): RiskScanResponse {
  return {
    scanId: `scan-${Date.now()}`,
    status: 'completed',
    documentsScanned: 47,
    alertsDetected: 23,
    alertsBySeverity: {
      critical: 2,
      high: 5,
      medium: 8,
      low: 5,
      info: 3,
    },
    durationMs: 12450,
  };
}
