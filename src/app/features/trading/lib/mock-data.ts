/**
 * Trading Module - Comprehensive Mock Data
 *
 * This file provides all mock data for the trading module including:
 * - Positions
 * - Trades
 * - Settlements
 * - DD Checklists
 * - Questions
 * - Timeline Events
 * - Dashboard Stats
 */

import {
  borrowers,
  facilities,
  trades as registeredTrades,
  futureDate,
  pastDate,
  BORROWER_IDS,
  FACILITY_IDS,
  TRADE_IDS,
} from '@/lib/shared/registry';
import type {
  Position,
  Trade,
  TradeDetail,
  TradeStatus,
  DDChecklist,
  DDCategory,
  DDChecklistItem,
  Question,
  TimelineEvent,
  TradingDashboardStats,
  Settlement,
  Activity,
  CalendarSettlement,
  SettlementReminder,
  FundingForecast,
} from './types';

// =============================================================================
// Positions Mock Data
// =============================================================================

export const mockPositions: Position[] = [
  {
    id: 'pos-1',
    facility_name: 'Term Loan A',
    borrower_name: 'ABC Holdings',
    lender_name: 'BigBank NA',
    position_type: 'agent',
    commitment_amount: 50_000_000,
    funded_amount: 45_000_000,
    unfunded_amount: 5_000_000,
    acquisition_date: pastDate(365),
    acquisition_price: 100.0,
    current_price: 99.5,
    facility_status: 'active',
    has_active_trade: true,
    trade_reference: 'TR-2024-006',
  },
  {
    id: 'pos-2',
    facility_name: 'Revolving Facility',
    borrower_name: 'XYZ Corp',
    lender_name: 'BigBank NA',
    position_type: 'participant',
    commitment_amount: 15_000_000,
    funded_amount: 8_000_000,
    unfunded_amount: 7_000_000,
    acquisition_date: pastDate(180),
    acquisition_price: 99.75,
    current_price: 99.875,
    facility_status: 'active',
    has_active_trade: true,
    trade_reference: 'TR-2024-004',
  },
  {
    id: 'pos-3',
    facility_name: 'Project Apollo',
    borrower_name: 'Apollo Industries',
    lender_name: 'BigBank NA',
    position_type: 'participant',
    commitment_amount: 25_000_000,
    funded_amount: 25_000_000,
    unfunded_amount: 0,
    acquisition_date: pastDate(90),
    acquisition_price: 99.0,
    current_price: 98.25,
    facility_status: 'watchlist',
    has_active_trade: true,
    trade_reference: 'TR-2024-001',
  },
  {
    id: 'pos-4',
    facility_name: 'Project Neptune',
    borrower_name: 'Neptune LLC',
    lender_name: 'BigBank NA',
    position_type: 'participant',
    commitment_amount: 12_000_000,
    funded_amount: 12_000_000,
    unfunded_amount: 0,
    acquisition_date: pastDate(270),
    acquisition_price: 97.5,
    current_price: 94.0,
    facility_status: 'watchlist',
    has_active_trade: true,
    trade_reference: 'TR-2024-002',
  },
  {
    id: 'pos-5',
    facility_name: 'Working Capital',
    borrower_name: 'Delta Corp',
    lender_name: 'BigBank NA',
    position_type: 'agent',
    commitment_amount: 25_000_000,
    funded_amount: 18_000_000,
    unfunded_amount: 7_000_000,
    acquisition_date: pastDate(450),
    acquisition_price: 100.0,
    current_price: 100.125,
    facility_status: 'active',
    has_active_trade: true,
    trade_reference: 'TR-2024-003',
  },
  {
    id: 'pos-6',
    facility_name: 'Acquisition Finance',
    borrower_name: 'Omega Holdings',
    lender_name: 'BigBank NA',
    position_type: 'participant',
    commitment_amount: 40_000_000,
    funded_amount: 40_000_000,
    unfunded_amount: 0,
    acquisition_date: pastDate(120),
    acquisition_price: 98.5,
    current_price: 97.0,
    facility_status: 'active',
    has_active_trade: true,
    trade_reference: 'TR-2024-005',
  },
  {
    id: 'pos-7',
    facility_name: 'Green Bond',
    borrower_name: 'EcoTech Ltd',
    lender_name: 'BigBank NA',
    position_type: 'participant',
    commitment_amount: 10_000_000,
    funded_amount: 10_000_000,
    unfunded_amount: 0,
    acquisition_date: pastDate(60),
    acquisition_price: 100.25,
    current_price: 100.5,
    facility_status: 'active',
    has_active_trade: false,
    trade_reference: null,
  },
  {
    id: 'pos-8',
    facility_name: 'Bridge Loan',
    borrower_name: 'Alpha Partners',
    lender_name: 'BigBank NA',
    position_type: 'agent',
    commitment_amount: 15_000_000,
    funded_amount: 15_000_000,
    unfunded_amount: 0,
    acquisition_date: pastDate(30),
    acquisition_price: 100.0,
    current_price: 99.875,
    facility_status: 'active',
    has_active_trade: false,
    trade_reference: null,
  },
];

// =============================================================================
// Trades Mock Data
// =============================================================================

export const mockTrades: Trade[] = [
  {
    id: TRADE_IDS.APOLLO_SELL,
    trade_reference: 'TR-2024-001',
    facility_name: 'Project Apollo',
    borrower_name: 'Apollo Industries',
    seller_name: 'BigBank NA',
    buyer_name: 'Capital Partners Fund',
    is_buyer: false,
    status: 'in_due_diligence',
    trade_amount: 15_000_000,
    trade_price: 98.5,
    trade_date: pastDate(10),
    settlement_date: futureDate(5),
    dd_progress: 65,
    flagged_items: 2,
    open_questions: 3,
  },
  {
    id: TRADE_IDS.NEPTUNE_BUY,
    trade_reference: 'TR-2024-002',
    facility_name: 'Project Neptune',
    borrower_name: 'Neptune LLC',
    seller_name: 'European Credit AG',
    buyer_name: 'BigBank NA',
    is_buyer: true,
    status: 'pending_settlement',
    trade_amount: 8_500_000,
    trade_price: 94.25,
    trade_date: pastDate(15),
    settlement_date: futureDate(3),
    dd_progress: 100,
    flagged_items: 0,
    open_questions: 0,
  },
  {
    id: TRADE_IDS.DELTA_SELL,
    trade_reference: 'TR-2024-003',
    facility_name: 'Working Capital',
    borrower_name: 'Delta Corp',
    seller_name: 'BigBank NA',
    buyer_name: 'Retail Credit Fund',
    is_buyer: false,
    status: 'documentation',
    trade_amount: 5_000_000,
    trade_price: 100.125,
    trade_date: pastDate(7),
    settlement_date: futureDate(10),
    dd_progress: 85,
    flagged_items: 1,
    open_questions: 1,
  },
  {
    id: TRADE_IDS.XYZ_BUY,
    trade_reference: 'TR-2024-004',
    facility_name: 'Revolving Facility',
    borrower_name: 'XYZ Corp',
    seller_name: 'Tech Lenders LLC',
    buyer_name: 'BigBank NA',
    is_buyer: true,
    status: 'agreed',
    trade_amount: 12_000_000,
    trade_price: 99.75,
    trade_date: pastDate(3),
    settlement_date: futureDate(15),
    dd_progress: 25,
    flagged_items: 0,
    open_questions: 2,
  },
  {
    id: TRADE_IDS.OMEGA_SELL,
    trade_reference: 'TR-2024-005',
    facility_name: 'Acquisition Finance',
    borrower_name: 'Omega Holdings',
    seller_name: 'BigBank NA',
    buyer_name: 'Asia Pacific Credit',
    is_buyer: false,
    status: 'pending_consent',
    trade_amount: 25_000_000,
    trade_price: 97.0,
    trade_date: pastDate(12),
    settlement_date: futureDate(8),
    dd_progress: 90,
    flagged_items: 0,
    open_questions: 1,
  },
  {
    id: TRADE_IDS.ABC_BUY,
    trade_reference: 'TR-2024-006',
    facility_name: 'Term Loan A',
    borrower_name: 'ABC Holdings',
    seller_name: 'North American Fund',
    buyer_name: 'BigBank NA',
    is_buyer: true,
    status: 'settled',
    trade_amount: 7_500_000,
    trade_price: 99.0,
    trade_date: pastDate(20),
    settlement_date: pastDate(5),
    dd_progress: 100,
    flagged_items: 0,
    open_questions: 0,
  },
];

// =============================================================================
// Trade Details Mock Data
// =============================================================================

export const mockTradeDetails: Record<string, TradeDetail> = {
  [TRADE_IDS.APOLLO_SELL]: {
    ...mockTrades.find((t) => t.id === TRADE_IDS.APOLLO_SELL)!,
    facility: {
      id: FACILITY_IDS.APOLLO_PROJECT,
      facility_name: 'Project Apollo',
      borrower_name: 'Apollo Industries',
      facility_type: 'Project Finance',
      total_commitment: 120_000_000,
    },
    seller: {
      organization_id: 'org-bigbank',
      organization_name: 'BigBank NA',
      contact_name: 'Sarah Johnson',
      contact_email: 'sarah.johnson@bigbank.com',
    },
    buyer: {
      organization_id: 'org-capital',
      organization_name: 'Capital Partners Fund',
      contact_name: 'Michael Chen',
      contact_email: 'mchen@capitalpartners.com',
    },
    settlement_amount: 14_775_000,
    consent_required: true,
    consent_received: false,
    created_at: pastDate(10) + 'T09:00:00Z',
    updated_at: pastDate(1) + 'T14:30:00Z',
  },
  [TRADE_IDS.NEPTUNE_BUY]: {
    ...mockTrades.find((t) => t.id === TRADE_IDS.NEPTUNE_BUY)!,
    facility: {
      id: FACILITY_IDS.NEPTUNE_SYNDICATED,
      facility_name: 'Project Neptune',
      borrower_name: 'Neptune LLC',
      facility_type: 'Syndicated Loan',
      total_commitment: 85_000_000,
    },
    seller: {
      organization_id: 'org-european',
      organization_name: 'European Credit AG',
      contact_name: 'Hans Mueller',
      contact_email: 'hmueller@europeancredit.de',
    },
    buyer: {
      organization_id: 'org-bigbank',
      organization_name: 'BigBank NA',
      contact_name: 'David Kim',
      contact_email: 'david.kim@bigbank.com',
    },
    settlement_amount: 8_011_250,
    consent_required: true,
    consent_received: true,
    created_at: pastDate(15) + 'T10:00:00Z',
    updated_at: pastDate(0) + 'T11:00:00Z',
  },
};

// =============================================================================
// DD Checklists Mock Data
// =============================================================================

export const mockDDChecklists: Record<string, DDChecklist> = {
  [TRADE_IDS.APOLLO_SELL]: {
    id: `dd-${TRADE_IDS.APOLLO_SELL}`,
    status: 'in_progress',
    total_items: 24,
    completed_items: 16,
    flagged_items: 2,
    categories: [
      {
        name: 'Credit Documentation',
        key: 'credit',
        items: [
          { id: 'cd-1', item_name: 'Credit Agreement', status: 'verified', verified_at: pastDate(5) + 'T10:00:00Z' },
          { id: 'cd-2', item_name: 'All Amendments', status: 'verified', verified_at: pastDate(4) + 'T14:00:00Z' },
          { id: 'cd-3', item_name: 'Intercreditor Agreement', status: 'verified', verified_at: pastDate(3) + 'T09:00:00Z' },
          { id: 'cd-4', item_name: 'Security Documents', status: 'flagged', flag_reason: 'Missing UCC-1 filing confirmation', flag_severity: 'warning' },
          { id: 'cd-5', item_name: 'Guaranty Agreement', status: 'verified', verified_at: pastDate(2) + 'T11:00:00Z' },
          { id: 'cd-6', item_name: 'Subordination Agreement', status: 'pending' },
        ],
      },
      {
        name: 'Financial Information',
        key: 'financial',
        items: [
          { id: 'fi-1', item_name: 'Latest Annual Financials', status: 'verified', verified_at: pastDate(6) + 'T10:00:00Z' },
          { id: 'fi-2', item_name: 'Latest Quarterly Financials', status: 'verified', verified_at: pastDate(5) + 'T15:00:00Z' },
          { id: 'fi-3', item_name: 'Compliance Certificate', status: 'verified', verified_at: pastDate(4) + 'T09:00:00Z' },
          { id: 'fi-4', item_name: 'Covenant Calculation', status: 'flagged', flag_reason: 'Leverage ratio near breach threshold', flag_severity: 'blocker' },
          { id: 'fi-5', item_name: 'Projections/Budget', status: 'in_review' },
          { id: 'fi-6', item_name: 'Management Discussion', status: 'pending' },
        ],
      },
      {
        name: 'Legal & Regulatory',
        key: 'legal',
        items: [
          { id: 'lr-1', item_name: 'Legal Opinion', status: 'verified', verified_at: pastDate(3) + 'T16:00:00Z' },
          { id: 'lr-2', item_name: 'Corporate Authorization', status: 'verified', verified_at: pastDate(3) + 'T16:00:00Z' },
          { id: 'lr-3', item_name: 'Regulatory Filings', status: 'verified', verified_at: pastDate(2) + 'T10:00:00Z' },
          { id: 'lr-4', item_name: 'Litigation Review', status: 'in_review' },
          { id: 'lr-5', item_name: 'Insurance Certificates', status: 'pending' },
          { id: 'lr-6', item_name: 'Environmental Review', status: 'pending' },
        ],
      },
      {
        name: 'Trade Mechanics',
        key: 'mechanics',
        items: [
          { id: 'tm-1', item_name: 'Trade Confirmation', status: 'verified', verified_at: pastDate(8) + 'T09:00:00Z' },
          { id: 'tm-2', item_name: 'Assignment Agreement', status: 'verified', verified_at: pastDate(6) + 'T14:00:00Z' },
          { id: 'tm-3', item_name: 'Transfer Certificate', status: 'in_review' },
          { id: 'tm-4', item_name: 'Agent Consent', status: 'pending' },
          { id: 'tm-5', item_name: 'KYC/AML Documentation', status: 'verified', verified_at: pastDate(7) + 'T11:00:00Z' },
          { id: 'tm-6', item_name: 'Settlement Instructions', status: 'pending' },
        ],
      },
    ],
  },
  [TRADE_IDS.NEPTUNE_BUY]: {
    id: `dd-${TRADE_IDS.NEPTUNE_BUY}`,
    status: 'completed',
    total_items: 24,
    completed_items: 24,
    flagged_items: 0,
    categories: [
      {
        name: 'Credit Documentation',
        key: 'credit',
        items: [
          { id: 'cd-1', item_name: 'Credit Agreement', status: 'verified', verified_at: pastDate(10) + 'T10:00:00Z' },
          { id: 'cd-2', item_name: 'All Amendments', status: 'verified', verified_at: pastDate(10) + 'T14:00:00Z' },
          { id: 'cd-3', item_name: 'Intercreditor Agreement', status: 'verified', verified_at: pastDate(9) + 'T09:00:00Z' },
          { id: 'cd-4', item_name: 'Security Documents', status: 'verified', verified_at: pastDate(8) + 'T10:00:00Z' },
          { id: 'cd-5', item_name: 'Guaranty Agreement', status: 'verified', verified_at: pastDate(8) + 'T11:00:00Z' },
          { id: 'cd-6', item_name: 'Subordination Agreement', status: 'waived' },
        ],
      },
      {
        name: 'Financial Information',
        key: 'financial',
        items: [
          { id: 'fi-1', item_name: 'Latest Annual Financials', status: 'verified', verified_at: pastDate(12) + 'T10:00:00Z' },
          { id: 'fi-2', item_name: 'Latest Quarterly Financials', status: 'verified', verified_at: pastDate(11) + 'T15:00:00Z' },
          { id: 'fi-3', item_name: 'Compliance Certificate', status: 'verified', verified_at: pastDate(10) + 'T09:00:00Z' },
          { id: 'fi-4', item_name: 'Covenant Calculation', status: 'verified', verified_at: pastDate(9) + 'T14:00:00Z' },
          { id: 'fi-5', item_name: 'Projections/Budget', status: 'verified', verified_at: pastDate(8) + 'T10:00:00Z' },
          { id: 'fi-6', item_name: 'Management Discussion', status: 'verified', verified_at: pastDate(7) + 'T11:00:00Z' },
        ],
      },
      {
        name: 'Legal & Regulatory',
        key: 'legal',
        items: [
          { id: 'lr-1', item_name: 'Legal Opinion', status: 'verified', verified_at: pastDate(6) + 'T16:00:00Z' },
          { id: 'lr-2', item_name: 'Corporate Authorization', status: 'verified', verified_at: pastDate(6) + 'T16:00:00Z' },
          { id: 'lr-3', item_name: 'Regulatory Filings', status: 'verified', verified_at: pastDate(5) + 'T10:00:00Z' },
          { id: 'lr-4', item_name: 'Litigation Review', status: 'verified', verified_at: pastDate(5) + 'T14:00:00Z' },
          { id: 'lr-5', item_name: 'Insurance Certificates', status: 'verified', verified_at: pastDate(4) + 'T09:00:00Z' },
          { id: 'lr-6', item_name: 'Environmental Review', status: 'verified', verified_at: pastDate(4) + 'T11:00:00Z' },
        ],
      },
      {
        name: 'Trade Mechanics',
        key: 'mechanics',
        items: [
          { id: 'tm-1', item_name: 'Trade Confirmation', status: 'verified', verified_at: pastDate(14) + 'T09:00:00Z' },
          { id: 'tm-2', item_name: 'Assignment Agreement', status: 'verified', verified_at: pastDate(10) + 'T14:00:00Z' },
          { id: 'tm-3', item_name: 'Transfer Certificate', status: 'verified', verified_at: pastDate(5) + 'T10:00:00Z' },
          { id: 'tm-4', item_name: 'Agent Consent', status: 'verified', verified_at: pastDate(3) + 'T15:00:00Z' },
          { id: 'tm-5', item_name: 'KYC/AML Documentation', status: 'verified', verified_at: pastDate(12) + 'T11:00:00Z' },
          { id: 'tm-6', item_name: 'Settlement Instructions', status: 'verified', verified_at: pastDate(2) + 'T09:00:00Z' },
        ],
      },
    ],
  },
};

// =============================================================================
// Questions Mock Data
// =============================================================================

export const mockQuestions: Record<string, Question[]> = {
  [TRADE_IDS.APOLLO_SELL]: [
    {
      id: 'q-1',
      asked_by_party: 'buyer',
      asker_name: 'Michael Chen',
      question_text: 'Can you provide the latest covenant compliance certificate showing the leverage ratio calculation?',
      status: 'answered',
      response_text: 'Please see attached Q3 compliance certificate. Note that leverage ratio is at 4.35x against 4.50x threshold.',
      responder_name: 'Sarah Johnson',
      created_at: pastDate(5) + 'T10:00:00Z',
      responded_at: pastDate(4) + 'T14:30:00Z',
    },
    {
      id: 'q-2',
      asked_by_party: 'buyer',
      asker_name: 'Michael Chen',
      question_text: 'Is there any pending litigation against the borrower that we should be aware of?',
      status: 'open',
      response_text: null,
      responder_name: null,
      created_at: pastDate(2) + 'T09:00:00Z',
      responded_at: null,
    },
    {
      id: 'q-3',
      asked_by_party: 'buyer',
      asker_name: 'Legal Team',
      question_text: 'Please confirm the UCC-1 filing status for the collateral package.',
      status: 'open',
      response_text: null,
      responder_name: null,
      created_at: pastDate(1) + 'T11:00:00Z',
      responded_at: null,
    },
  ],
  [TRADE_IDS.XYZ_BUY]: [
    {
      id: 'q-4',
      asked_by_party: 'buyer',
      asker_name: 'David Kim',
      question_text: 'What is the current drawn amount on the revolving facility?',
      status: 'answered',
      response_text: 'Current drawn amount is $8M against $75M total commitment.',
      responder_name: 'Tech Lenders Team',
      created_at: pastDate(2) + 'T15:00:00Z',
      responded_at: pastDate(1) + 'T09:00:00Z',
    },
    {
      id: 'q-5',
      asked_by_party: 'buyer',
      asker_name: 'David Kim',
      question_text: 'Are there any restrictions on further assignments in the credit agreement?',
      status: 'open',
      response_text: null,
      responder_name: null,
      created_at: pastDate(1) + 'T14:00:00Z',
      responded_at: null,
    },
  ],
};

// =============================================================================
// Timeline Events Mock Data
// =============================================================================

export const mockTimelineEvents: Record<string, TimelineEvent[]> = {
  [TRADE_IDS.APOLLO_SELL]: [
    { id: 'te-1', event_type: 'trade_created', description: 'Trade initiated', occurred_at: pastDate(10) + 'T09:00:00Z', actor_name: 'Sarah Johnson' },
    { id: 'te-2', event_type: 'status_change', description: 'Status changed to Indication', occurred_at: pastDate(10) + 'T09:30:00Z', actor_name: 'System' },
    { id: 'te-3', event_type: 'price_agreed', description: 'Price agreed at 98.5', occurred_at: pastDate(9) + 'T14:00:00Z', actor_name: 'Michael Chen' },
    { id: 'te-4', event_type: 'status_change', description: 'Status changed to Agreed', occurred_at: pastDate(9) + 'T14:05:00Z', actor_name: 'System' },
    { id: 'te-5', event_type: 'dd_started', description: 'Due diligence process started', occurred_at: pastDate(8) + 'T10:00:00Z', actor_name: 'System' },
    { id: 'te-6', event_type: 'document_uploaded', description: 'Credit Agreement uploaded', occurred_at: pastDate(7) + 'T11:00:00Z', actor_name: 'Sarah Johnson' },
    { id: 'te-7', event_type: 'item_verified', description: 'Credit Agreement verified', occurred_at: pastDate(5) + 'T10:00:00Z', actor_name: 'Michael Chen' },
    { id: 'te-8', event_type: 'item_flagged', description: 'Covenant Calculation flagged - near breach', occurred_at: pastDate(3) + 'T14:00:00Z', actor_name: 'Michael Chen' },
    { id: 'te-9', event_type: 'question_asked', description: 'Question about litigation pending', occurred_at: pastDate(2) + 'T09:00:00Z', actor_name: 'Michael Chen' },
  ],
  [TRADE_IDS.NEPTUNE_BUY]: [
    { id: 'te-10', event_type: 'trade_created', description: 'Trade initiated', occurred_at: pastDate(15) + 'T10:00:00Z', actor_name: 'Hans Mueller' },
    { id: 'te-11', event_type: 'price_agreed', description: 'Price agreed at 94.25', occurred_at: pastDate(14) + 'T11:00:00Z', actor_name: 'David Kim' },
    { id: 'te-12', event_type: 'dd_completed', description: 'Due diligence completed', occurred_at: pastDate(4) + 'T16:00:00Z', actor_name: 'System' },
    { id: 'te-13', event_type: 'consent_received', description: 'Agent consent received', occurred_at: pastDate(3) + 'T15:00:00Z', actor_name: 'Agent Bank' },
    { id: 'te-14', event_type: 'status_change', description: 'Status changed to Pending Settlement', occurred_at: pastDate(2) + 'T10:00:00Z', actor_name: 'System' },
  ],
};

// =============================================================================
// Settlements Mock Data
// =============================================================================

export const mockSettlements: Settlement[] = [
  {
    trade_id: TRADE_IDS.NEPTUNE_BUY,
    trade_reference: 'TR-2024-002',
    settlement_date: futureDate(3),
    amount: 8_011_250,
    counterparty: 'European Credit AG',
    is_buyer: true,
  },
  {
    trade_id: TRADE_IDS.APOLLO_SELL,
    trade_reference: 'TR-2024-001',
    settlement_date: futureDate(5),
    amount: 14_775_000,
    counterparty: 'Capital Partners Fund',
    is_buyer: false,
  },
  {
    trade_id: TRADE_IDS.OMEGA_SELL,
    trade_reference: 'TR-2024-005',
    settlement_date: futureDate(8),
    amount: 24_250_000,
    counterparty: 'Asia Pacific Credit',
    is_buyer: false,
  },
  {
    trade_id: TRADE_IDS.DELTA_SELL,
    trade_reference: 'TR-2024-003',
    settlement_date: futureDate(10),
    amount: 5_006_250,
    counterparty: 'Retail Credit Fund',
    is_buyer: false,
  },
  {
    trade_id: TRADE_IDS.XYZ_BUY,
    trade_reference: 'TR-2024-004',
    settlement_date: futureDate(15),
    amount: 11_970_000,
    counterparty: 'Tech Lenders LLC',
    is_buyer: true,
  },
];

// =============================================================================
// Calendar Settlements Mock Data
// =============================================================================

export const mockCalendarSettlements: CalendarSettlement[] = mockSettlements.map((s) => {
  const trade = mockTrades.find((t) => t.id === s.trade_id);
  const daysUntil = Math.ceil(
    (new Date(s.settlement_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  let riskLevel: CalendarSettlement['risk_level'] = 'low';
  if (trade?.flagged_items && trade.flagged_items > 0) {
    riskLevel = trade.flagged_items > 1 ? 'high' : 'medium';
  }
  if (daysUntil <= 3 && trade?.dd_progress && trade.dd_progress < 100) {
    riskLevel = 'critical';
  }

  const reminders: SettlementReminder[] = [
    {
      id: `rem-${s.trade_id}-7`,
      settlement_id: s.trade_id,
      days_before: 7,
      scheduled_date: futureDate(Math.max(0, daysUntil - 7)),
      sent: daysUntil <= 7,
      sent_at: daysUntil <= 7 ? pastDate(7 - daysUntil) + 'T09:00:00Z' : null,
      channel: 'email',
    },
    {
      id: `rem-${s.trade_id}-3`,
      settlement_id: s.trade_id,
      days_before: 3,
      scheduled_date: futureDate(Math.max(0, daysUntil - 3)),
      sent: daysUntil <= 3,
      sent_at: daysUntil <= 3 ? pastDate(3 - daysUntil) + 'T09:00:00Z' : null,
      channel: 'slack',
    },
    {
      id: `rem-${s.trade_id}-1`,
      settlement_id: s.trade_id,
      days_before: 1,
      scheduled_date: futureDate(Math.max(0, daysUntil - 1)),
      sent: daysUntil <= 1,
      sent_at: daysUntil <= 1 ? pastDate(1 - daysUntil) + 'T09:00:00Z' : null,
      channel: 'in_app',
    },
  ];

  return {
    ...s,
    risk_level: riskLevel,
    has_flagged_items: (trade?.flagged_items || 0) > 0,
    missing_consents: trade?.status === 'pending_consent',
    dd_complete: (trade?.dd_progress || 0) >= 100,
    days_until: daysUntil,
    funding_requirement: s.is_buyer ? s.amount : 0,
    reminders,
    borrower_name: trade?.borrower_name || 'Unknown',
    facility_name: trade?.facility_name || 'Unknown',
  };
});

// =============================================================================
// Funding Forecasts Mock Data
// =============================================================================

export function generateFundingForecasts(days: number = 30): FundingForecast[] {
  const forecasts: FundingForecast[] = [];

  for (let i = 0; i < days; i++) {
    const date = futureDate(i);
    const daySettlements = mockCalendarSettlements.filter((s) => s.settlement_date === date);

    const inflows = daySettlements
      .filter((s) => !s.is_buyer)
      .reduce((sum, s) => sum + s.amount, 0);

    const outflows = daySettlements
      .filter((s) => s.is_buyer)
      .reduce((sum, s) => sum + s.amount, 0);

    forecasts.push({
      date,
      total_inflows: inflows,
      total_outflows: outflows,
      net_position: inflows - outflows,
      settlements: daySettlements,
    });
  }

  return forecasts;
}

// =============================================================================
// Recent Activity Mock Data
// =============================================================================

export const mockRecentActivity: Activity[] = [
  {
    id: 'act-1',
    type: 'item_flagged',
    description: 'Covenant calculation flagged - leverage near breach',
    trade_id: TRADE_IDS.APOLLO_SELL,
    trade_reference: 'TR-2024-001',
    occurred_at: pastDate(0) + 'T14:00:00Z',
  },
  {
    id: 'act-2',
    type: 'consent_received',
    description: 'Agent consent received for Neptune trade',
    trade_id: TRADE_IDS.NEPTUNE_BUY,
    trade_reference: 'TR-2024-002',
    occurred_at: pastDate(0) + 'T11:00:00Z',
  },
  {
    id: 'act-3',
    type: 'question_answered',
    description: 'Question about revolver drawn amount answered',
    trade_id: TRADE_IDS.XYZ_BUY,
    trade_reference: 'TR-2024-004',
    occurred_at: pastDate(1) + 'T09:00:00Z',
  },
  {
    id: 'act-4',
    type: 'status_change',
    description: 'Trade moved to documentation phase',
    trade_id: TRADE_IDS.DELTA_SELL,
    trade_reference: 'TR-2024-003',
    occurred_at: pastDate(1) + 'T16:00:00Z',
  },
  {
    id: 'act-5',
    type: 'settlement_confirmed',
    description: 'ABC Holdings trade settled successfully',
    trade_id: TRADE_IDS.ABC_BUY,
    trade_reference: 'TR-2024-006',
    occurred_at: pastDate(5) + 'T15:00:00Z',
  },
];

// =============================================================================
// Dashboard Stats Mock Data
// =============================================================================

export const mockDashboardStats: TradingDashboardStats = {
  total_facilities: 8,
  total_positions: mockPositions.length,
  total_position_value: mockPositions.reduce(
    (sum, p) => sum + (p.funded_amount * p.current_price) / 100,
    0
  ),
  active_trades: mockTrades.filter((t) => !['settled', 'cancelled', 'failed'].includes(t.status)).length,
  trades_in_dd: mockTrades.filter((t) => t.status === 'in_due_diligence').length,
  trades_pending_settlement: mockTrades.filter((t) => t.status === 'pending_settlement').length,
  settled_this_month: 1,
  settled_volume_this_month: 7_425_000,
  dd_completion_rate: 73,
  average_settlement_days: 12,
  flagged_items_count: mockTrades.reduce((sum, t) => sum + t.flagged_items, 0),
  open_questions_count: mockTrades.reduce((sum, t) => sum + t.open_questions, 0),
  trades_in_progress: mockTrades.filter((t) => !['settled', 'cancelled', 'failed'].includes(t.status)),
  upcoming_settlements: mockSettlements.filter(
    (s) => new Date(s.settlement_date) > new Date()
  ),
  recent_activity: mockRecentActivity,
};

// =============================================================================
// Helper Functions
// =============================================================================

export function getTradeById(id: string): Trade | undefined {
  return mockTrades.find((t) => t.id === id);
}

export function getTradeDetailById(id: string): TradeDetail | undefined {
  return mockTradeDetails[id];
}

export function getDDChecklistByTradeId(tradeId: string): DDChecklist | undefined {
  return mockDDChecklists[tradeId];
}

export function getQuestionsByTradeId(tradeId: string): Question[] {
  return mockQuestions[tradeId] || [];
}

export function getTimelineByTradeId(tradeId: string): TimelineEvent[] {
  return mockTimelineEvents[tradeId] || [];
}

export function getPositionsByStatus(status: Position['facility_status']): Position[] {
  return mockPositions.filter((p) => p.facility_status === status);
}

export function getTradesByStatus(status: TradeStatus): Trade[] {
  return mockTrades.filter((t) => t.status === status);
}

export function getUpcomingSettlements(days: number = 14): CalendarSettlement[] {
  const cutoff = futureDate(days);
  return mockCalendarSettlements.filter(
    (s) => s.settlement_date <= cutoff && new Date(s.settlement_date) > new Date()
  );
}
