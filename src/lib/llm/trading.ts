import Anthropic from '@anthropic-ai/sdk';
import type { TradingAIQueryResult, DueDiligenceReport, SettlementReport } from '@/types';

const anthropic = new Anthropic();

// ============================================
// DD Q&A - Answer buyer/seller questions about the trade
// ============================================

interface DDQuestionContext {
  question: string;
  trade_context: {
    facility_name: string;
    borrower_name: string;
    trade_amount: number;
    trade_price: number;
    facility_status: string;
    transferability: string;
  };
  dd_item_context?: {
    item_name: string;
    category: string;
    status: string;
    verification_notes?: string;
  };
  document_excerpts?: string[];
  compliance_data?: {
    covenant_status?: string;
    recent_test_results?: Array<{
      covenant_name: string;
      result: string;
      headroom?: number;
    }>;
    upcoming_obligations?: string[];
  };
}

/**
 * Answer due diligence questions using context from trade, documents, and compliance data
 */
export async function answerDDQuestion(
  context: DDQuestionContext
): Promise<TradingAIQueryResult> {
  const tradeContext = `
FACILITY: ${context.trade_context.facility_name}
BORROWER: ${context.trade_context.borrower_name}
TRADE AMOUNT: ${context.trade_context.trade_amount.toLocaleString()}
TRADE PRICE: ${context.trade_context.trade_price}%
FACILITY STATUS: ${context.trade_context.facility_status}
TRANSFERABILITY: ${context.trade_context.transferability}`;

  const ddItemContext = context.dd_item_context
    ? `\n\nRELATED DD ITEM:
Item: ${context.dd_item_context.item_name}
Category: ${context.dd_item_context.category}
Status: ${context.dd_item_context.status}
${context.dd_item_context.verification_notes ? `Notes: ${context.dd_item_context.verification_notes}` : ''}`
    : '';

  const docContext = context.document_excerpts?.length
    ? `\n\nDOCUMENT EXCERPTS:\n${context.document_excerpts.join('\n\n---\n\n')}`
    : '';

  const complianceContext = context.compliance_data
    ? `\n\nCOMPLIANCE DATA:
Covenant Status: ${context.compliance_data.covenant_status || 'N/A'}
Recent Tests: ${context.compliance_data.recent_test_results?.map((t) => `${t.covenant_name}: ${t.result}${t.headroom ? ` (${t.headroom}% headroom)` : ''}`).join(', ') || 'None'}
Upcoming Obligations: ${context.compliance_data.upcoming_obligations?.join(', ') || 'None pending'}`
    : '';

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `You are a loan trading due diligence expert. Answer the following question about a secondary loan trade:

QUESTION: ${context.question}

TRADE CONTEXT:${tradeContext}${ddItemContext}${docContext}${complianceContext}

Respond in JSON format:
{
  "question": "the original question",
  "answer": "detailed, accurate answer based on available context",
  "sources": [
    {
      "type": "document" | "compliance_data" | "trade_data" | "external",
      "reference": "specific reference",
      "excerpt": "relevant excerpt if applicable"
    }
  ],
  "confidence": number between 0 and 1,
  "suggested_actions": ["action items if any"],
  "related_dd_items": [
    {
      "item_id": "if known",
      "item_name": "item name",
      "relevance": "why this is relevant"
    }
  ]
}

Be precise, reference specific data points, and highlight any concerns that may affect the trade.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from LLM');
  }

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]) as TradingAIQueryResult;
  } catch {
    return {
      question: context.question,
      answer: 'Unable to process the question. Please review the available documentation or contact the counterparty.',
      sources: [],
      confidence: 0,
      suggested_actions: ['Manual review required'],
    };
  }
}

// ============================================
// Auto-verification assistance
// ============================================

interface AutoVerificationContext {
  item_name: string;
  item_description: string;
  category: string;
  facility_data: {
    facility_name: string;
    borrower_name: string;
    facility_status: string;
    maturity_date: string;
  };
  compliance_data?: {
    covenant_results?: Array<{
      name: string;
      result: string;
      test_date: string;
    }>;
    recent_financials_date?: string;
    overdue_obligations?: number;
  };
  document_data?: {
    credit_agreement_exists: boolean;
    recent_amendments?: number;
    information_package_available: boolean;
  };
}

interface AutoVerificationResult {
  can_auto_verify: boolean;
  verification_status: 'verified' | 'flagged' | 'pending_manual';
  confidence: number;
  verification_data: Record<string, unknown>;
  notes: string;
  flag_reason?: string;
  flag_severity?: 'info' | 'warning' | 'blocker';
}

/**
 * Attempt to auto-verify a due diligence item based on available data
 */
export async function autoVerifyDDItem(
  context: AutoVerificationContext
): Promise<AutoVerificationResult> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: `You are a loan trading due diligence expert. Evaluate whether the following DD item can be automatically verified based on available data:

DD ITEM: ${context.item_name}
DESCRIPTION: ${context.item_description}
CATEGORY: ${context.category}

FACILITY DATA:
- Name: ${context.facility_data.facility_name}
- Borrower: ${context.facility_data.borrower_name}
- Status: ${context.facility_data.facility_status}
- Maturity: ${context.facility_data.maturity_date}

${context.compliance_data ? `COMPLIANCE DATA:
- Covenant Results: ${context.compliance_data.covenant_results?.map((c) => `${c.name}: ${c.result} (${c.test_date})`).join(', ') || 'None'}
- Recent Financials: ${context.compliance_data.recent_financials_date || 'N/A'}
- Overdue Obligations: ${context.compliance_data.overdue_obligations || 0}` : ''}

${context.document_data ? `DOCUMENT DATA:
- Credit Agreement: ${context.document_data.credit_agreement_exists ? 'Available' : 'Missing'}
- Recent Amendments: ${context.document_data.recent_amendments || 0}
- Info Package: ${context.document_data.information_package_available ? 'Available' : 'Not prepared'}` : ''}

Respond in JSON format:
{
  "can_auto_verify": boolean,
  "verification_status": "verified" | "flagged" | "pending_manual",
  "confidence": number between 0 and 1,
  "verification_data": { key data points used for verification },
  "notes": "explanation of verification decision",
  "flag_reason": "reason if flagged",
  "flag_severity": "info" | "warning" | "blocker" if flagged
}

Be conservative - only auto-verify if data is clear and reliable. Flag items that show concerns.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from LLM');
  }

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]) as AutoVerificationResult;
  } catch {
    return {
      can_auto_verify: false,
      verification_status: 'pending_manual',
      confidence: 0,
      verification_data: {},
      notes: 'Unable to perform automated verification. Manual review required.',
    };
  }
}

// ============================================
// DD Report Generation
// ============================================

interface DDReportContext {
  trade: {
    trade_reference: string;
    trade_date: string;
    settlement_date: string;
    trade_amount: number;
    trade_price: number;
    facility_name: string;
    borrower_name: string;
    seller_name: string;
    buyer_name: string;
  };
  checklist: {
    status: string;
    categories: Array<{
      category: string;
      items: Array<{
        item_name: string;
        status: string;
        is_critical: boolean;
        verification_notes: string | null;
        flag_reason: string | null;
        flag_severity: string | null;
      }>;
    }>;
  };
  questions?: Array<{
    question: string;
    answer: string | null;
    status: string;
    asked_at: string;
  }>;
  timeline?: Array<{
    event_type: string;
    description: string;
    occurred_at: string;
    actor_name: string;
  }>;
  include_qa: boolean;
  include_timeline: boolean;
}

/**
 * Generate a comprehensive DD report with risk assessment
 */
export async function generateDDReport(
  context: DDReportContext
): Promise<{ risk_assessment: string; recommendations: string[] }> {
  const categorySummary = context.checklist.categories
    .map((cat) => {
      const verified = cat.items.filter((i) => i.status === 'verified').length;
      const flagged = cat.items.filter((i) => i.status === 'flagged').length;
      const flags = cat.items
        .filter((i) => i.status === 'flagged')
        .map((i) => `  - ${i.item_name}: ${i.flag_reason} (${i.flag_severity})`);
      return `${cat.category}: ${verified}/${cat.items.length} verified, ${flagged} flagged${flags.length ? '\n' + flags.join('\n') : ''}`;
    })
    .join('\n');

  const qaSummary = context.include_qa && context.questions?.length
    ? `\n\nQ&A SUMMARY:
Total: ${context.questions.length}
Open: ${context.questions.filter((q) => q.status === 'open').length}
Key Questions: ${context.questions.slice(0, 3).map((q) => q.question).join('; ')}`
    : '';

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `You are a loan trading due diligence expert. Generate a risk assessment and recommendations for this trade:

TRADE DETAILS:
Reference: ${context.trade.trade_reference}
Trade Date: ${context.trade.trade_date}
Settlement Date: ${context.trade.settlement_date}
Amount: ${context.trade.trade_amount.toLocaleString()}
Price: ${context.trade.trade_price}%
Facility: ${context.trade.facility_name}
Borrower: ${context.trade.borrower_name}
Seller: ${context.trade.seller_name}
Buyer: ${context.trade.buyer_name}

DD CHECKLIST STATUS: ${context.checklist.status}

BY CATEGORY:
${categorySummary}${qaSummary}

Respond in JSON format:
{
  "risk_assessment": "comprehensive risk assessment paragraph covering key findings, concerns, and overall trade viability",
  "recommendations": ["specific actionable recommendations for proceeding with or addressing concerns in the trade"]
}

Be thorough but concise. Focus on material issues that could affect the trade.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from LLM');
  }

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch {
    return {
      risk_assessment: 'Unable to generate automated risk assessment. Please review the DD checklist manually.',
      recommendations: ['Complete manual review of all DD items', 'Address any flagged items before settlement'],
    };
  }
}

// ============================================
// Settlement memo generation
// ============================================

interface SettlementMemoContext {
  trade: {
    trade_reference: string;
    facility_name: string;
    borrower_name: string;
    seller_name: string;
    buyer_name: string;
    trade_date: string;
    settlement_date: string;
  };
  settlement: {
    principal_amount: number;
    trade_price: number;
    purchase_price_amount: number;
    accrued_interest: number | null;
    delayed_compensation: number | null;
    total_settlement_amount: number;
  };
  dd_summary: {
    status: string;
    total_items: number;
    verified_items: number;
    flagged_items: number;
    open_questions: number;
  };
  consent_status?: {
    required: boolean;
    received: boolean;
    consent_date?: string;
  };
}

interface SettlementMemo {
  summary: string;
  key_terms: string[];
  settlement_breakdown: string;
  conditions_precedent: string[];
  next_steps: string[];
}

/**
 * Generate a settlement memo for internal/external use
 */
export async function generateSettlementMemo(
  context: SettlementMemoContext
): Promise<SettlementMemo> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `You are a loan trading settlement specialist. Generate a settlement memo for this trade:

TRADE:
Reference: ${context.trade.trade_reference}
Facility: ${context.trade.facility_name}
Borrower: ${context.trade.borrower_name}
Seller: ${context.trade.seller_name}
Buyer: ${context.trade.buyer_name}
Trade Date: ${context.trade.trade_date}
Settlement Date: ${context.trade.settlement_date}

SETTLEMENT AMOUNTS:
Principal: ${context.settlement.principal_amount.toLocaleString()}
Trade Price: ${context.settlement.trade_price}%
Purchase Price: ${context.settlement.purchase_price_amount.toLocaleString()}
Accrued Interest: ${context.settlement.accrued_interest?.toLocaleString() || 'N/A'}
Delayed Compensation: ${context.settlement.delayed_compensation?.toLocaleString() || 'N/A'}
TOTAL: ${context.settlement.total_settlement_amount.toLocaleString()}

DD STATUS: ${context.dd_summary.status}
- Verified: ${context.dd_summary.verified_items}/${context.dd_summary.total_items}
- Flagged: ${context.dd_summary.flagged_items}
- Open Questions: ${context.dd_summary.open_questions}

CONSENT: ${context.consent_status?.required ? (context.consent_status.received ? `Received on ${context.consent_status.consent_date}` : 'Pending') : 'Not Required'}

Respond in JSON format:
{
  "summary": "executive summary of the trade and settlement",
  "key_terms": ["key commercial terms"],
  "settlement_breakdown": "formatted breakdown of settlement amounts",
  "conditions_precedent": ["list of conditions that must be satisfied"],
  "next_steps": ["action items for settlement"]
}

Make it professional and suitable for internal stakeholders and counterparties.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from LLM');
  }

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]) as SettlementMemo;
  } catch {
    return {
      summary: `Trade ${context.trade.trade_reference} pending settlement.`,
      key_terms: [`Amount: ${context.settlement.principal_amount.toLocaleString()}`, `Price: ${context.settlement.trade_price}%`],
      settlement_breakdown: `Total: ${context.settlement.total_settlement_amount.toLocaleString()}`,
      conditions_precedent: ['Complete due diligence', 'Obtain required consents'],
      next_steps: ['Confirm wire instructions', 'Execute assignment documentation'],
    };
  }
}

// ============================================
// Trade risk screening
// ============================================

interface TradeScreeningContext {
  facility: {
    facility_name: string;
    borrower_name: string;
    facility_status: string;
    transferability: string;
    maturity_date: string;
  };
  trade: {
    trade_amount: number;
    trade_price: number;
    seller_name: string;
    buyer_name: string;
  };
  compliance_summary?: {
    covenant_status: string;
    overdue_items: number;
    recent_breaches: number;
  };
  restricted_parties?: string[];
}

interface TradeScreeningResult {
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  blocking_issues: string[];
  warnings: string[];
  recommendations: string[];
  proceed_with_caution: boolean;
}

/**
 * Screen a potential trade for risks before initiating
 */
export async function screenTrade(
  context: TradeScreeningContext
): Promise<TradeScreeningResult> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: `You are a loan trading risk analyst. Screen this potential trade for risks:

FACILITY:
Name: ${context.facility.facility_name}
Borrower: ${context.facility.borrower_name}
Status: ${context.facility.facility_status}
Transferability: ${context.facility.transferability}
Maturity: ${context.facility.maturity_date}

TRADE:
Amount: ${context.trade.trade_amount.toLocaleString()}
Price: ${context.trade.trade_price}%
Seller: ${context.trade.seller_name}
Buyer: ${context.trade.buyer_name}

${context.compliance_summary ? `COMPLIANCE:
Covenant Status: ${context.compliance_summary.covenant_status}
Overdue Items: ${context.compliance_summary.overdue_items}
Recent Breaches: ${context.compliance_summary.recent_breaches}` : ''}

${context.restricted_parties?.length ? `RESTRICTED PARTIES: ${context.restricted_parties.join(', ')}` : ''}

Respond in JSON format:
{
  "risk_level": "low" | "medium" | "high" | "critical",
  "blocking_issues": ["issues that should prevent the trade"],
  "warnings": ["concerns that need attention but aren't blocking"],
  "recommendations": ["specific recommendations"],
  "proceed_with_caution": boolean
}

Be thorough in identifying risks. Check for restricted party matches, transferability constraints, and credit concerns.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from LLM');
  }

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]) as TradeScreeningResult;
  } catch {
    return {
      risk_level: 'medium',
      blocking_issues: [],
      warnings: ['Unable to complete automated screening. Manual review required.'],
      recommendations: ['Perform manual risk assessment before proceeding'],
      proceed_with_caution: true,
    };
  }
}
