export interface Deal {
  id: string;
  organization_id: string;
  created_by: string;
  deal_name: string;
  description: string | null;
  deal_type: 'new_facility' | 'amendment' | 'refinancing' | 'extension' | 'consent' | 'waiver';
  status: 'draft' | 'active' | 'paused' | 'agreed' | 'closed' | 'terminated';
  negotiation_mode: 'collaborative' | 'proposal_based';
  base_facility_id: string | null;
  target_close_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface DealStats {
  total_terms: number;
  agreed_terms: number;
  pending_proposals: number;
  participant_count: number;
  deadline_stats?: {
    total_with_deadlines: number;
    overdue: number;
    due_soon: number; // within 7 days
    on_track: number;
  };
}

export interface DealWithStats extends Deal {
  stats?: DealStats;
}

export interface NegotiationTerm {
  id: string;
  deal_id: string;
  category_id: string;
  term_key: string;
  term_label: string;
  value_type: string;
  current_value: unknown;
  current_value_text: string | null;
  original_value: unknown;
  original_value_text: string | null;
  negotiation_status: 'not_started' | 'proposed' | 'under_discussion' | 'pending_approval' | 'agreed' | 'locked';
  is_locked: boolean;
  display_order: number;
  deadline: string | null;
}

export interface CategoryWithTerms {
  id: string;
  deal_id: string;
  name: string;
  display_order: number;
  parent_category_id: string | null;
  created_at: string;
  terms: (NegotiationTerm & { pending_proposals_count: number; comments_count: number })[];
}

export interface DealParticipant {
  id: string;
  deal_id: string;
  user_id: string | null;
  party_name: string;
  party_type: 'borrower_side' | 'lender_side' | 'third_party';
  party_role: string;
  deal_role: 'deal_lead' | 'negotiator' | 'reviewer' | 'observer';
  can_approve: boolean;
  status: 'invited' | 'active' | 'inactive';
  invited_at: string;
  joined_at: string | null;
}

// Imported term from facility extraction
export interface ImportedTerm {
  termKey: string;
  termLabel: string;
  valueType: string;
  currentValue: unknown;
  currentValueText: string;
  sourceClauseReference?: string;
}

// Imported facility data structure
export interface ImportedFacilityData {
  facilityId: string;
  facilityName: string;
  documentId: string;
  documentName: string;
  facilityTerms: ImportedTerm[];
  covenantTerms: ImportedTerm[];
  obligationTerms: ImportedTerm[];
  esgTerms: ImportedTerm[];
}

export interface NewDealFormData {
  deal_name: string;
  deal_type: string;
  description: string;
  target_close_date: string;
  import_source: 'none' | 'facility' | 'template';
  selected_facility: string;
  import_covenants: boolean;
  import_obligations: boolean;
  import_esg: boolean;
  // Imported facility data
  imported_facility_data: ImportedFacilityData | null;
  participants: Array<{
    email: string;
    party_name: string;
    party_type: string;
    party_role: string;
    deal_role: string;
  }>;
  negotiation_mode: string;
}
