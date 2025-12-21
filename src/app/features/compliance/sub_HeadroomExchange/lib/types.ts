// =============================================================================
// Covenant Headroom Exchange Types
// =============================================================================

export type TradeStatus = 'proposed' | 'negotiating' | 'accepted' | 'executed' | 'rejected' | 'expired';
export type ExchangeType = 'pricing_adjustment' | 'cross_guarantee' | 'shared_covenant' | 'fee_sharing' | 'hybrid';
export type RiskTier = 'low' | 'medium' | 'high' | 'very_high';

/**
 * Available headroom for trading
 */
export interface HeadroomListing {
  id: string;
  covenant_id: string;
  covenant_name: string;
  covenant_type: string;
  facility_id: string;
  facility_name: string;
  borrower_name: string;

  // Headroom details
  current_headroom_percentage: number;
  current_headroom_absolute: number;
  available_for_trade_percentage: number; // How much they're willing to trade
  available_for_trade_absolute: number;

  // Current covenant values
  current_threshold: number;
  current_value: number;
  threshold_type: 'maximum' | 'minimum';

  // Offering terms
  seeking_exchange_types: ExchangeType[];
  minimum_trade_size: number; // Minimum headroom % to trade

  // Risk profile
  borrower_risk_tier: RiskTier;
  facility_credit_rating: string;
  industry_sector: string;

  // Status
  listing_status: 'active' | 'pending_trade' | 'inactive';
  listed_date: string;
  expires_date: string;
}

/**
 * Trade proposal between two facilities
 */
export interface HeadroomTrade {
  id: string;

  // Offering side (has excess headroom)
  offering_listing_id: string;
  offering_covenant_id: string;
  offering_covenant_name: string;
  offering_facility_name: string;
  offering_borrower_name: string;
  offering_headroom_percentage: number;

  // Receiving side (needs headroom)
  receiving_covenant_id: string;
  receiving_covenant_name: string;
  receiving_facility_name: string;
  receiving_borrower_name: string;
  receiving_headroom_percentage: number;

  // Trade terms
  headroom_amount_traded: number; // Percentage points
  exchange_type: ExchangeType;
  exchange_details: ExchangeTerms;

  // AI matching score
  compatibility_score: number; // 0-100
  fair_value_score: number; // 0-100
  risk_adjusted_score: number; // 0-100

  // Status
  status: TradeStatus;
  proposed_date: string;
  accepted_date: string | null;
  executed_date: string | null;
  expires_date: string;

  // Participants
  proposed_by: 'offering_party' | 'receiving_party' | 'system';
}

/**
 * Exchange terms based on trade type
 */
export interface ExchangeTerms {
  type: ExchangeType;

  // Pricing adjustment terms
  pricing_adjustment?: {
    basis_points_reduction: number; // Interest rate reduction for receiving party
    duration_months: number;
    estimated_value_usd: number;
  };

  // Cross-guarantee terms
  cross_guarantee?: {
    guarantee_amount_usd: number;
    guarantee_percentage: number; // % of receiving facility
    guarantee_duration_months: number;
    guarantee_conditions: string[];
  };

  // Shared covenant terms
  shared_covenant?: {
    new_shared_threshold: number;
    pooled_calculation: boolean;
    shared_liability_percentage: number;
  };

  // Fee sharing terms
  fee_sharing?: {
    annual_fee_reduction_usd: number;
    commitment_fee_reduction_bps: number;
    duration_months: number;
  };

  // Hybrid (combination of above)
  hybrid?: {
    components: ExchangeType[];
    component_weights: number[]; // Must sum to 100
  };
}

/**
 * AI-generated trade matching recommendation
 */
export interface TradeMatchRecommendation {
  id: string;
  listing_id: string;

  // Matched covenant
  matched_covenant_id: string;
  matched_covenant_name: string;
  matched_facility_name: string;
  matched_borrower_name: string;
  matched_headroom_percentage: number;

  // Match quality scores
  compatibility_score: number; // 0-100, based on industry, size, risk profile
  risk_compatibility: number; // How well risk profiles match
  covenant_compatibility: number; // How compatible covenant types are
  timing_compatibility: number; // Test dates, maturity alignment

  // Recommended exchange
  recommended_exchange_type: ExchangeType;
  recommended_exchange_terms: ExchangeTerms;
  fair_exchange_rate: number; // Headroom units per unit of consideration

  // Value analysis
  value_to_offering_party: number; // Estimated USD value
  value_to_receiving_party: number; // Estimated USD value
  mutual_benefit_score: number; // 0-100

  // Explanation
  match_rationale: string;
  risk_assessment: string;
  recommendation_summary: string;

  // Generated date
  generated_date: string;
}

/**
 * Portfolio-wide headroom optimization analysis
 */
export interface PortfolioOptimizationAnalysis {
  portfolio_id: string;
  analysis_date: string;

  // Current state
  total_facilities: number;
  total_covenants: number;
  covenants_at_risk: number;
  average_headroom_percentage: number;

  // Inefficiency metrics
  total_excess_headroom: number; // Sum of all headroom above 30%
  total_deficit_headroom: number; // Sum of all headroom below 15%
  optimization_opportunity_score: number; // 0-100, potential improvement

  // Recommended trades
  recommended_trades: TradeMatchRecommendation[];
  potential_breach_prevention: number; // Number of potential breaches preventable
  estimated_total_value_created: number; // USD value from all trades

  // Risk metrics
  portfolio_breach_probability_current: number; // % prob any breach in 12 months
  portfolio_breach_probability_optimized: number; // After recommended trades
  risk_reduction_percentage: number;

  // Summary
  summary: string;
  top_priorities: string[];
}

/**
 * Market statistics for headroom exchange
 */
export interface HeadroomMarketStats {
  total_active_listings: number;
  total_facilities_participating: number;
  average_excess_headroom: number;
  average_deficit_headroom: number;

  // Trade activity
  trades_completed_30d: number;
  trades_in_negotiation: number;
  total_value_exchanged_30d: number; // USD

  // Most common exchange types
  most_common_exchange_type: ExchangeType;
  exchange_type_distribution: Record<ExchangeType, number>;

  // Covenant types most traded
  most_traded_covenant_types: Array<{
    covenant_type: string;
    trade_count: number;
    average_headroom_traded: number;
  }>;

  last_updated: string;
}

/**
 * Trade negotiation message
 */
export interface TradeNegotiationMessage {
  id: string;
  trade_id: string;
  from_party: 'offering' | 'receiving';
  message_type: 'proposal' | 'counter_offer' | 'question' | 'acceptance' | 'rejection';

  // Message content
  message: string;
  proposed_terms?: Partial<ExchangeTerms>;

  created_at: string;
  created_by: string;
}

/**
 * User's headroom exchange dashboard
 */
export interface UserExchangeDashboard {
  // User's listings
  active_listings: HeadroomListing[];

  // Incoming proposals
  incoming_proposals: HeadroomTrade[];

  // Outgoing proposals
  outgoing_proposals: HeadroomTrade[];

  // Active trades
  active_trades: HeadroomTrade[];

  // Recommended matches for user's deficit covenants
  recommended_matches: TradeMatchRecommendation[];

  // Statistics
  total_value_received: number; // USD value from past trades
  total_value_given: number;
  trades_completed_count: number;
}
