/**
 * Trading Module Development Fixtures
 *
 * Factory functions for generating realistic trading data for tests and local development.
 * Each factory provides valid defaults that can be overridden for specific scenarios.
 */

import type {
  Facility,
  Organization,
  Position,
  Trade,
  TradeDetail,
  TradeStatus,
  DDChecklistItem,
  DDCategory,
  DDChecklist,
  Question,
  TimelineEvent,
  TradingDashboardStats,
  Settlement,
  Activity,
} from './types';

// ============================================================================
// ID and Reference Generation
// ============================================================================

let idCounter = 1000;

/**
 * Generates a unique ID for test entities.
 * Uses a counter to ensure uniqueness within a test session.
 */
export function generateId(): string {
  return `test-${++idCounter}`;
}

/**
 * Generates a trade reference in the format TR-YYYY-NNN.
 */
export function generateTradeReference(): string {
  const year = new Date().getFullYear();
  return `TR-${year}-${String(idCounter++).padStart(3, '0')}`;
}

/**
 * Resets the ID counter. Useful for deterministic tests.
 */
export function resetIdCounter(value: number = 1000): void {
  idCounter = value;
}

// ============================================================================
// Date Helpers
// ============================================================================

/**
 * Returns an ISO date string for today.
 */
export function today(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Returns an ISO date string offset by the given number of days.
 */
export function daysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Returns an ISO datetime string offset by the given number of hours.
 */
export function hoursFromNow(hours: number): string {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

/**
 * Returns an ISO datetime string for a specific number of days ago.
 */
export function daysAgo(days: number): string {
  return daysFromNow(-days);
}

// ============================================================================
// Sample Data Arrays
// ============================================================================

const BORROWER_NAMES = [
  'Acme Corporation',
  'Global Industries LLC',
  'Pinnacle Holdings Inc',
  'Summit Enterprises',
  'Nexus Capital Group',
  'Horizon Partners LP',
  'Atlas Manufacturing Co',
  'Vanguard Technologies',
  'Sterling Investments',
  'Meridian Resources',
];

const BANK_NAMES = [
  'Bank of America',
  'JP Morgan Chase',
  'Goldman Sachs',
  'Morgan Stanley',
  'Citibank',
  'Wells Fargo',
  'Credit Suisse',
  'Barclays Capital',
  'Deutsche Bank',
  'HSBC',
  'UBS',
  'BNP Paribas',
];

const FACILITY_TYPES = [
  'Term Loan A',
  'Term Loan B',
  'Revolver',
  'ABL',
  'Bridge Loan',
  'Delayed Draw',
];

const DD_CATEGORY_NAMES = [
  { name: 'Credit Documentation', key: 'credit_docs' },
  { name: 'Financial Statements', key: 'financials' },
  { name: 'Legal Documents', key: 'legal' },
  { name: 'KYC/AML', key: 'kyc_aml' },
  { name: 'Consents & Waivers', key: 'consents' },
];

const DD_ITEMS_BY_CATEGORY: Record<string, string[]> = {
  credit_docs: [
    'Credit Agreement',
    'Amendment History',
    'Security Documents',
    'Intercreditor Agreement',
  ],
  financials: [
    'Annual Financial Statements',
    'Quarterly Reports',
    'Compliance Certificate',
    'Borrowing Base Certificate',
  ],
  legal: [
    'Corporate Authorization',
    'Legal Opinion',
    'UCC Filing Verification',
    'Perfection Certificate',
  ],
  kyc_aml: [
    'KYC Documentation',
    'AML Screening',
    'OFAC Clearance',
    'Beneficial Ownership',
  ],
  consents: [
    'Agent Consent',
    'Required Lender Consent',
    'Borrower Acknowledgment',
  ],
};

const ACTIVITY_TYPES = [
  'dd_item_verified',
  'question_asked',
  'question_answered',
  'trade_created',
  'consent_received',
  'settlement_scheduled',
  'document_uploaded',
  'flag_raised',
  'flag_resolved',
];

// ============================================================================
// Utility Functions
// ============================================================================

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomAmount(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) / 100000) * 100000;
}

function randomPrice(min: number = 95, max: number = 102): number {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

function randomPercentage(): number {
  return Math.floor(Math.random() * 101);
}

// ============================================================================
// Factory: Facility
// ============================================================================

export interface CreateFacilityOptions extends Partial<Facility> {}

/**
 * Creates a Facility with valid defaults.
 * Override any property by passing it in options.
 */
export function createFacility(options: CreateFacilityOptions = {}): Facility {
  const borrower = randomItem(BORROWER_NAMES);
  const facilityType = randomItem(FACILITY_TYPES);

  return {
    id: generateId(),
    facility_name: `${borrower.split(' ')[0]} ${facilityType}`,
    borrower_name: borrower,
    facility_type: facilityType,
    total_commitment: randomAmount(10_000_000, 100_000_000),
    ...options,
  };
}

// ============================================================================
// Factory: Organization
// ============================================================================

export interface CreateOrganizationOptions extends Partial<Organization> {}

/**
 * Creates an Organization with valid defaults.
 */
export function createOrganization(
  options: CreateOrganizationOptions = {}
): Organization {
  const bankName = options.organization_name ?? randomItem(BANK_NAMES);
  const firstName = ['John', 'Sarah', 'Michael', 'Emma', 'David'][
    Math.floor(Math.random() * 5)
  ];
  const lastName = ['Smith', 'Johnson', 'Williams', 'Brown', 'Davis'][
    Math.floor(Math.random() * 5)
  ];

  return {
    organization_id: generateId(),
    organization_name: bankName,
    contact_name: `${firstName} ${lastName}`,
    contact_email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${bankName
      .toLowerCase()
      .replace(/\s+/g, '')}.com`,
    ...options,
  };
}

// ============================================================================
// Factory: Position
// ============================================================================

export interface CreatePositionOptions extends Partial<Position> {}

/**
 * Creates a Position with valid defaults.
 * Automatically calculates unfunded_amount from commitment - funded.
 */
export function createPosition(options: CreatePositionOptions = {}): Position {
  const borrower = randomItem(BORROWER_NAMES);
  const facilityType = randomItem(FACILITY_TYPES);
  const commitment = options.commitment_amount ?? randomAmount(5_000_000, 50_000_000);
  const funded = options.funded_amount ?? Math.round(commitment * (0.6 + Math.random() * 0.4));
  const acquisitionPrice = options.acquisition_price ?? randomPrice(97, 101);
  const currentPrice = options.current_price ?? randomPrice(acquisitionPrice - 3, acquisitionPrice + 3);

  const finalCommitment = options.commitment_amount ?? commitment;
  const finalFunded = options.funded_amount ?? funded;
  const finalUnfunded = options.unfunded_amount ?? (finalCommitment - finalFunded);

  return {
    id: generateId(),
    facility_name: `${borrower.split(' ')[0]} ${facilityType}`,
    borrower_name: borrower,
    lender_name: 'Our Organization',
    position_type: Math.random() > 0.5 ? 'agent' : 'participant',
    commitment_amount: finalCommitment,
    funded_amount: finalFunded,
    unfunded_amount: finalUnfunded,
    acquisition_date: daysAgo(Math.floor(Math.random() * 365) + 30),
    acquisition_price: acquisitionPrice,
    current_price: currentPrice,
    facility_status: 'active',
    has_active_trade: false,
    trade_reference: null,
    ...options,
  };
}

// ============================================================================
// Factory: Trade
// ============================================================================

export interface CreateTradeOptions extends Partial<Trade> {}

/**
 * Creates a Trade with valid defaults.
 * DD progress and flags are auto-generated based on status unless overridden.
 */
export function createTrade(options: CreateTradeOptions = {}): Trade {
  const borrower = randomItem(BORROWER_NAMES);
  const facilityType = randomItem(FACILITY_TYPES);
  const status = options.status ?? 'in_due_diligence';

  // Auto-generate DD progress based on status
  let ddProgress = 0;
  let flaggedItems = 0;
  let openQuestions = 0;

  switch (status) {
    case 'draft':
    case 'indication':
      ddProgress = 0;
      break;
    case 'agreed':
      ddProgress = Math.floor(Math.random() * 20);
      break;
    case 'in_due_diligence':
      ddProgress = 20 + Math.floor(Math.random() * 60);
      flaggedItems = Math.floor(Math.random() * 4);
      openQuestions = Math.floor(Math.random() * 5);
      break;
    case 'documentation':
    case 'pending_consent':
      ddProgress = 80 + Math.floor(Math.random() * 20);
      flaggedItems = Math.floor(Math.random() * 2);
      openQuestions = Math.floor(Math.random() * 2);
      break;
    case 'pending_settlement':
    case 'settled':
      ddProgress = 100;
      flaggedItems = 0;
      openQuestions = 0;
      break;
    case 'cancelled':
    case 'failed':
      ddProgress = Math.floor(Math.random() * 80);
      break;
  }

  const tradeDate = daysAgo(Math.floor(Math.random() * 30) + 1);
  const hasSettlementDate = !['draft', 'indication', 'cancelled', 'failed'].includes(status);

  return {
    id: generateId(),
    trade_reference: generateTradeReference(),
    facility_name: `${borrower.split(' ')[0]} ${facilityType}`,
    borrower_name: borrower,
    seller_name: randomItem(BANK_NAMES),
    buyer_name: randomItem(BANK_NAMES),
    is_buyer: Math.random() > 0.5,
    status,
    trade_amount: randomAmount(5_000_000, 30_000_000),
    trade_price: randomPrice(96, 102),
    trade_date: tradeDate,
    settlement_date: hasSettlementDate ? daysFromNow(Math.floor(Math.random() * 30) + 5) : null,
    dd_progress: options.dd_progress ?? ddProgress,
    flagged_items: options.flagged_items ?? flaggedItems,
    open_questions: options.open_questions ?? openQuestions,
    ...options,
  };
}

// ============================================================================
// Factory: TradeDetail
// ============================================================================

export interface CreateTradeDetailOptions extends Partial<Omit<TradeDetail, 'facility' | 'seller' | 'buyer'>> {
  trade?: CreateTradeOptions;
  facility?: CreateFacilityOptions;
  seller?: CreateOrganizationOptions;
  buyer?: CreateOrganizationOptions;
}

/**
 * Creates a TradeDetail with valid defaults.
 * Includes nested facility, seller, and buyer organizations.
 */
export function createTradeDetail(
  options: CreateTradeDetailOptions = {}
): TradeDetail {
  const { trade: tradeOpts, facility: facilityOpts, seller: sellerOpts, buyer: buyerOpts, ...rest } = options;

  const baseTrade = createTrade(tradeOpts);
  const facility = createFacility({
    facility_name: baseTrade.facility_name,
    borrower_name: baseTrade.borrower_name,
    ...facilityOpts,
  });
  const seller = createOrganization({
    organization_name: baseTrade.seller_name,
    ...sellerOpts,
  });
  const buyer = createOrganization({
    organization_name: baseTrade.buyer_name,
    ...buyerOpts,
  });

  return {
    ...baseTrade,
    facility,
    seller,
    buyer,
    settlement_amount: Math.round(baseTrade.trade_amount * (baseTrade.trade_price / 100)),
    consent_required: Math.random() > 0.3,
    consent_received: baseTrade.status === 'pending_settlement' || baseTrade.status === 'settled',
    created_at: daysAgo(Math.floor(Math.random() * 60) + 10),
    updated_at: hoursFromNow(-Math.floor(Math.random() * 48)),
    ...rest,
  };
}

// ============================================================================
// Factory: DDChecklistItem
// ============================================================================

export interface CreateDDChecklistItemOptions extends Partial<DDChecklistItem> {}

/**
 * Creates a DDChecklistItem with valid defaults.
 */
export function createDDChecklistItem(
  options: CreateDDChecklistItemOptions = {}
): DDChecklistItem {
  const status = options.status ?? 'pending';
  const item: DDChecklistItem = {
    id: generateId(),
    item_name: options.item_name ?? 'Document Review',
    status,
    ...options,
  };

  if (status === 'verified') {
    item.verified_at = options.verified_at ?? hoursFromNow(-Math.floor(Math.random() * 72));
  }

  if (status === 'flagged') {
    item.flag_reason = options.flag_reason ?? 'Missing documentation or inconsistency found';
    item.flag_severity = options.flag_severity ?? (Math.random() > 0.5 ? 'warning' : 'blocker');
  }

  return item;
}

// ============================================================================
// Factory: DDCategory
// ============================================================================

export interface CreateDDCategoryOptions extends Partial<DDCategory> {
  itemCount?: number;
  itemOverrides?: CreateDDChecklistItemOptions[];
}

/**
 * Creates a DDCategory with items.
 */
export function createDDCategory(
  options: CreateDDCategoryOptions = {}
): DDCategory {
  const categoryInfo = randomItem(DD_CATEGORY_NAMES);
  const categoryKey = options.key ?? categoryInfo.key;
  const itemNames = DD_ITEMS_BY_CATEGORY[categoryKey] ?? DD_ITEMS_BY_CATEGORY.credit_docs;
  const itemCount = options.itemCount ?? itemNames.length;

  const items = Array.from({ length: itemCount }, (_, i) => {
    const override = options.itemOverrides?.[i] ?? {};
    return createDDChecklistItem({
      item_name: itemNames[i % itemNames.length],
      ...override,
    });
  });

  return {
    name: options.name ?? categoryInfo.name,
    key: categoryKey,
    items: options.items ?? items,
    ...options,
  };
}

// ============================================================================
// Factory: DDChecklist
// ============================================================================

export interface CreateDDChecklistOptions extends Partial<DDChecklist> {
  categoryCount?: number;
  completionRate?: number;
}

/**
 * Creates a DDChecklist with categories and items.
 * completionRate (0-100) controls how many items are verified.
 */
export function createDDChecklist(
  options: CreateDDChecklistOptions = {}
): DDChecklist {
  const categoryCount = options.categoryCount ?? 4;
  const completionRate = options.completionRate ?? randomPercentage();

  const categories = options.categories ?? DD_CATEGORY_NAMES.slice(0, categoryCount).map(
    (cat) => createDDCategory({ name: cat.name, key: cat.key })
  );

  // Calculate totals
  const allItems = categories.flatMap((c) => c.items);
  const totalItems = allItems.length;

  // Apply completion rate
  const targetCompleted = Math.floor(totalItems * (completionRate / 100));
  let completed = 0;
  let flagged = 0;

  for (const item of allItems) {
    if (completed < targetCompleted) {
      if (Math.random() > 0.1) {
        item.status = 'verified';
        item.verified_at = hoursFromNow(-Math.floor(Math.random() * 72));
        completed++;
      } else {
        item.status = 'flagged';
        item.flag_reason = 'Issue found during review';
        item.flag_severity = Math.random() > 0.7 ? 'blocker' : 'warning';
        flagged++;
      }
    }
  }

  return {
    id: generateId(),
    status: completionRate === 100 ? 'complete' : 'in_progress',
    total_items: totalItems,
    completed_items: completed,
    flagged_items: flagged,
    categories,
    ...options,
  };
}

// ============================================================================
// Factory: Question
// ============================================================================

export interface CreateQuestionOptions extends Partial<Question> {}

/**
 * Creates a Question with valid defaults.
 */
export function createQuestion(options: CreateQuestionOptions = {}): Question {
  const status = options.status ?? 'open';
  const askerBank = randomItem(BANK_NAMES);

  return {
    id: generateId(),
    asked_by_party: Math.random() > 0.5 ? 'buyer' : 'seller',
    asker_name: `${['John', 'Sarah', 'Michael'][Math.floor(Math.random() * 3)]} at ${askerBank}`,
    question_text:
      options.question_text ?? 'Can you confirm the current outstanding balance and any recent amendments?',
    status,
    response_text: status === 'answered' ? 'Please see attached confirmation.' : null,
    responder_name: status === 'answered' ? `${randomItem(['Emma', 'David', 'Lisa'])} at ${randomItem(BANK_NAMES)}` : null,
    created_at: hoursFromNow(-Math.floor(Math.random() * 168)),
    responded_at: status === 'answered' ? hoursFromNow(-Math.floor(Math.random() * 48)) : null,
    ...options,
  };
}

// ============================================================================
// Factory: TimelineEvent
// ============================================================================

export interface CreateTimelineEventOptions extends Partial<TimelineEvent> {}

/**
 * Creates a TimelineEvent with valid defaults.
 */
export function createTimelineEvent(
  options: CreateTimelineEventOptions = {}
): TimelineEvent {
  const eventTypes = [
    { type: 'trade_created', description: 'Trade was created' },
    { type: 'dd_started', description: 'Due diligence process started' },
    { type: 'document_verified', description: 'Credit Agreement verified' },
    { type: 'question_asked', description: 'Question raised by counterparty' },
    { type: 'consent_requested', description: 'Consent request sent to agent' },
    { type: 'consent_received', description: 'Agent consent received' },
    { type: 'settlement_scheduled', description: 'Settlement date confirmed' },
  ];

  const event = randomItem(eventTypes);

  return {
    id: generateId(),
    event_type: options.event_type ?? event.type,
    description: options.description ?? event.description,
    occurred_at: hoursFromNow(-Math.floor(Math.random() * 168)),
    actor_name: `${randomItem(['John', 'Sarah', 'Michael', 'Emma'])} at ${randomItem(BANK_NAMES)}`,
    ...options,
  };
}

// ============================================================================
// Factory: TradingDashboardStats
// ============================================================================

export interface CreateDashboardStatsOptions extends Partial<TradingDashboardStats> {}

/**
 * Creates TradingDashboardStats with valid defaults.
 */
export function createDashboardStats(
  options: CreateDashboardStatsOptions = {}
): TradingDashboardStats {
  const totalFacilities = options.total_facilities ?? Math.floor(Math.random() * 15) + 5;
  const totalPositions = options.total_positions ?? totalFacilities + Math.floor(Math.random() * 10);
  const activeTrades = options.active_trades ?? Math.floor(Math.random() * 8) + 1;

  return {
    total_facilities: totalFacilities,
    total_positions: totalPositions,
    total_position_value: randomAmount(50_000_000, 500_000_000),
    active_trades: activeTrades,
    trades_in_dd: Math.floor(activeTrades * 0.5),
    trades_pending_settlement: Math.floor(activeTrades * 0.25),
    settled_this_month: Math.floor(Math.random() * 10) + 1,
    settled_volume_this_month: randomAmount(20_000_000, 100_000_000),
    dd_completion_rate: 50 + Math.floor(Math.random() * 40),
    average_settlement_days: 8 + Math.floor(Math.random() * 7),
    flagged_items_count: Math.floor(Math.random() * 10),
    open_questions_count: Math.floor(Math.random() * 15),
    trades_in_progress: options.trades_in_progress ?? [],
    upcoming_settlements: options.upcoming_settlements ?? [],
    recent_activity: options.recent_activity ?? [],
    ...options,
  };
}

// ============================================================================
// Factory: Settlement
// ============================================================================

export interface CreateSettlementOptions extends Partial<Settlement> {}

/**
 * Creates a Settlement with valid defaults.
 */
export function createSettlement(options: CreateSettlementOptions = {}): Settlement {
  return {
    trade_id: generateId(),
    trade_reference: generateTradeReference(),
    settlement_date: daysFromNow(Math.floor(Math.random() * 14) + 1),
    amount: randomAmount(5_000_000, 30_000_000),
    counterparty: randomItem(BANK_NAMES),
    is_buyer: Math.random() > 0.5,
    ...options,
  };
}

// ============================================================================
// Factory: Activity
// ============================================================================

export interface CreateActivityOptions extends Partial<Activity> {}

/**
 * Creates an Activity with valid defaults.
 */
export function createActivity(options: CreateActivityOptions = {}): Activity {
  const activityType = options.type ?? randomItem(ACTIVITY_TYPES);

  const descriptionMap: Record<string, string> = {
    dd_item_verified: 'Verified: Credit Agreement',
    question_asked: 'Question: Confirm current debt levels...',
    question_answered: 'Answer provided for outstanding question',
    trade_created: 'Trade created',
    consent_received: 'Consent received from agent',
    settlement_scheduled: 'Settlement date scheduled',
    document_uploaded: 'Document uploaded: Financial Statements',
    flag_raised: 'Flag raised: Missing amendment',
    flag_resolved: 'Flag resolved: Documentation complete',
  };

  return {
    id: generateId(),
    type: activityType,
    description: options.description ?? descriptionMap[activityType] ?? 'Activity occurred',
    trade_id: options.trade_id ?? generateId(),
    trade_reference: options.trade_reference ?? generateTradeReference(),
    occurred_at: hoursFromNow(-Math.floor(Math.random() * 168)),
    ...options,
  };
}

// ============================================================================
// Presets: Common Test Scenarios
// ============================================================================

/**
 * Preset: Creates a trade with an overdue settlement date.
 * Settlement date is in the past, status is pending_settlement.
 */
export function overdueSettlement(overrides: CreateTradeOptions = {}): Trade {
  return createTrade({
    status: 'pending_settlement',
    settlement_date: daysAgo(Math.floor(Math.random() * 5) + 1),
    dd_progress: 100,
    flagged_items: 0,
    open_questions: 0,
    ...overrides,
  });
}

/**
 * Preset: Creates a position with a profitable price movement.
 * Current price is higher than acquisition price.
 */
export function profitablePosition(overrides: CreatePositionOptions = {}): Position {
  const acquisitionPrice = overrides.acquisition_price ?? randomPrice(96, 99);
  const profitBps = 50 + Math.floor(Math.random() * 200); // 0.5% to 2.5% profit

  return createPosition({
    acquisition_price: acquisitionPrice,
    current_price: Number((acquisitionPrice + profitBps / 100).toFixed(2)),
    facility_status: 'active',
    ...overrides,
  });
}

/**
 * Preset: Creates a position with a loss.
 * Current price is lower than acquisition price.
 */
export function losingPosition(overrides: CreatePositionOptions = {}): Position {
  const acquisitionPrice = overrides.acquisition_price ?? randomPrice(98, 101);
  const lossBps = 50 + Math.floor(Math.random() * 300); // 0.5% to 3.5% loss

  return createPosition({
    acquisition_price: acquisitionPrice,
    current_price: Number((acquisitionPrice - lossBps / 100).toFixed(2)),
    facility_status: Math.random() > 0.5 ? 'watchlist' : 'active',
    ...overrides,
  });
}

/**
 * Preset: Creates a trade with flagged items blocking progress.
 * Has multiple blocker flags and open questions.
 */
export function flaggedTrade(overrides: CreateTradeOptions = {}): Trade {
  return createTrade({
    status: 'in_due_diligence',
    dd_progress: 30 + Math.floor(Math.random() * 30),
    flagged_items: 2 + Math.floor(Math.random() * 3),
    open_questions: 1 + Math.floor(Math.random() * 3),
    ...overrides,
  });
}

/**
 * Preset: Creates a trade that is nearly complete.
 * High DD progress with minimal issues.
 */
export function nearlyCompleteTrade(overrides: CreateTradeOptions = {}): Trade {
  return createTrade({
    status: 'pending_consent',
    dd_progress: 95 + Math.floor(Math.random() * 5),
    flagged_items: Math.random() > 0.7 ? 1 : 0,
    open_questions: 0,
    settlement_date: daysFromNow(Math.floor(Math.random() * 10) + 3),
    ...overrides,
  });
}

/**
 * Preset: Creates a new draft trade.
 * No DD progress, no settlement date.
 */
export function draftTrade(overrides: CreateTradeOptions = {}): Trade {
  return createTrade({
    status: 'draft',
    dd_progress: 0,
    flagged_items: 0,
    open_questions: 0,
    settlement_date: null,
    trade_date: today(),
    ...overrides,
  });
}

/**
 * Preset: Creates a settled trade for historical data.
 * All DD complete, has past settlement date.
 */
export function settledTrade(overrides: CreateTradeOptions = {}): Trade {
  const settlementDate = daysAgo(Math.floor(Math.random() * 30) + 1);
  const tradeDate = daysAgo(Math.floor(Math.random() * 30) + 31);

  return createTrade({
    status: 'settled',
    dd_progress: 100,
    flagged_items: 0,
    open_questions: 0,
    trade_date: tradeDate,
    settlement_date: settlementDate,
    ...overrides,
  });
}

/**
 * Preset: Creates a failed/cancelled trade.
 */
export function failedTrade(overrides: CreateTradeOptions = {}): Trade {
  return createTrade({
    status: Math.random() > 0.5 ? 'failed' : 'cancelled',
    dd_progress: Math.floor(Math.random() * 60),
    settlement_date: null,
    ...overrides,
  });
}

/**
 * Preset: Creates a position in default status.
 */
export function defaultedPosition(overrides: CreatePositionOptions = {}): Position {
  const acquisitionPrice = overrides.acquisition_price ?? randomPrice(98, 101);

  return createPosition({
    facility_status: 'default',
    current_price: Number((acquisitionPrice * 0.7).toFixed(2)), // ~30% haircut
    acquisition_price: acquisitionPrice,
    ...overrides,
  });
}

/**
 * Preset: Creates a position on the watchlist.
 */
export function watchlistPosition(overrides: CreatePositionOptions = {}): Position {
  const acquisitionPrice = overrides.acquisition_price ?? randomPrice(98, 101);

  return createPosition({
    facility_status: 'watchlist',
    current_price: Number((acquisitionPrice * 0.95).toFixed(2)), // ~5% decline
    acquisition_price: acquisitionPrice,
    ...overrides,
  });
}

/**
 * Preset: Creates an upcoming settlement within 3 days.
 */
export function urgentSettlement(overrides: CreateSettlementOptions = {}): Settlement {
  return createSettlement({
    settlement_date: daysFromNow(Math.floor(Math.random() * 3) + 1),
    ...overrides,
  });
}

/**
 * Preset: Creates a DD checklist that is blocked by issues.
 */
export function blockedChecklist(overrides: CreateDDChecklistOptions = {}): DDChecklist {
  const checklist = createDDChecklist({
    completionRate: 60,
    ...overrides,
  });

  // Add some blocker flags
  for (const category of checklist.categories) {
    const pendingItems = category.items.filter((i) => i.status === 'pending');
    if (pendingItems.length > 0) {
      const itemToFlag = pendingItems[0];
      itemToFlag.status = 'flagged';
      itemToFlag.flag_reason = 'Critical documentation missing';
      itemToFlag.flag_severity = 'blocker';
      checklist.flagged_items++;
    }
  }

  return checklist;
}

// ============================================================================
// Batch Generators
// ============================================================================

/**
 * Creates an array of trades with various statuses.
 */
export function createTradeList(count: number, options?: CreateTradeOptions): Trade[] {
  return Array.from({ length: count }, () => createTrade(options));
}

/**
 * Creates an array of positions.
 */
export function createPositionList(count: number, options?: CreatePositionOptions): Position[] {
  return Array.from({ length: count }, () => createPosition(options));
}

/**
 * Creates an array of settlements.
 */
export function createSettlementList(count: number, options?: CreateSettlementOptions): Settlement[] {
  return Array.from({ length: count }, () => createSettlement(options));
}

/**
 * Creates an array of activities.
 */
export function createActivityList(count: number, options?: CreateActivityOptions): Activity[] {
  return Array.from({ length: count }, () => createActivity(options));
}

/**
 * Creates a diverse set of trades covering all statuses.
 */
export function createDiverseTradeSet(): Trade[] {
  const statuses: TradeStatus[] = [
    'draft',
    'indication',
    'agreed',
    'in_due_diligence',
    'documentation',
    'pending_consent',
    'pending_settlement',
    'settled',
    'cancelled',
  ];

  return statuses.map((status) => createTrade({ status }));
}

/**
 * Creates a realistic portfolio with mixed positions.
 */
export function createPortfolio(size: number = 10): Position[] {
  const positions: Position[] = [];

  // Mix of profitable, losing, watchlist, and active positions
  const profitable = Math.floor(size * 0.4);
  const losing = Math.floor(size * 0.2);
  const watchlist = Math.floor(size * 0.15);
  const rest = size - profitable - losing - watchlist;

  for (let i = 0; i < profitable; i++) {
    positions.push(profitablePosition());
  }
  for (let i = 0; i < losing; i++) {
    positions.push(losingPosition());
  }
  for (let i = 0; i < watchlist; i++) {
    positions.push(watchlistPosition());
  }
  for (let i = 0; i < rest; i++) {
    positions.push(createPosition());
  }

  return positions;
}
