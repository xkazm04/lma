// ============================================
// Clause Library Types for Document Comparison
// ============================================

/**
 * The party that a clause language favors
 */
export type ClauseFavor = 'lender' | 'borrower' | 'neutral';

/**
 * Source/origin of a clause in the library
 */
export type ClauseSource = 'lsta_standard' | 'market_standard' | 'custom' | 'negotiated';

/**
 * Category of clause
 */
export type ClauseCategory =
  | 'financial_covenants'
  | 'reporting_requirements'
  | 'representations_warranties'
  | 'events_of_default'
  | 'definitions'
  | 'conditions_precedent'
  | 'affirmative_covenants'
  | 'negative_covenants'
  | 'indemnification'
  | 'assignments_participations'
  | 'miscellaneous';

/**
 * How closely a document clause matches a library clause
 */
export type MatchStrength = 'exact' | 'similar' | 'partial' | 'deviation' | 'none';

/**
 * A single clause template in the library
 */
export interface ClauseTemplate {
  /** Unique identifier */
  id: string;
  /** Short name for the clause */
  name: string;
  /** Category of the clause */
  category: ClauseCategory;
  /** Which party this language favors */
  favor: ClauseFavor;
  /** Source/origin of this clause */
  source: ClauseSource;
  /** The full clause text */
  text: string;
  /** Short description of what this clause does */
  description: string;
  /** Key terms/phrases that identify this clause pattern */
  keyPhrases: string[];
  /** Tags for search and filtering */
  tags: string[];
  /** Whether this is an approved/pre-approved clause */
  isApproved: boolean;
  /** Usage count in organization's documents */
  usageCount: number;
  /** Last used date */
  lastUsedAt: string | null;
  /** Who created this clause template */
  createdBy: string;
  /** Creation timestamp */
  createdAt: string;
  /** Last updated timestamp */
  updatedAt: string;
  /** Notes from legal team */
  legalNotes?: string;
  /** Typical negotiation points for this clause */
  negotiationPoints?: string[];
  /** Alternative clause IDs that could replace this */
  alternativeClauseIds?: string[];
}

/**
 * A clause variant - same concept but different language
 */
export interface ClauseVariant {
  /** Unique identifier */
  id: string;
  /** Parent clause template ID */
  parentClauseId: string;
  /** Which party this variant favors */
  favor: ClauseFavor;
  /** The variant text */
  text: string;
  /** Description of what makes this variant different */
  variantDescription: string;
  /** Whether this is an approved variant */
  isApproved: boolean;
  /** Source of this variant */
  source: ClauseSource;
  /** Usage count */
  usageCount: number;
}

/**
 * Result of matching document text against the clause library
 */
export interface ClauseMatchResult {
  /** The matched clause template (if any) */
  matchedClause: ClauseTemplate | null;
  /** The matched variant (if a variant matched better) */
  matchedVariant: ClauseVariant | null;
  /** Strength of the match */
  matchStrength: MatchStrength;
  /** Similarity score (0.0 to 1.0) */
  similarityScore: number;
  /** The document text that was matched */
  documentText: string;
  /** Key differences from the matched clause */
  differences: string[];
  /** Whether this deviates from standard language */
  isDeviation: boolean;
  /** AI-generated analysis of the match */
  analysis: string;
  /** Suggested alternative clauses */
  suggestedAlternatives: ClauseTemplate[];
}

/**
 * Clause match for a specific comparison change
 */
export interface ChangeClauseMatch {
  /** The change ID this match is for */
  changeId: string;
  /** Match result for document 1 value */
  doc1Match: ClauseMatchResult | null;
  /** Match result for document 2 value */
  doc2Match: ClauseMatchResult | null;
  /** Analysis of how the clause changed between documents */
  changeAnalysis: {
    /** Did the clause move toward or away from standard? */
    direction: 'toward_standard' | 'away_from_standard' | 'neutral_change';
    /** Did the favor change? */
    favorChange: {
      from: ClauseFavor | null;
      to: ClauseFavor | null;
    };
    /** Summary of the change */
    summary: string;
  };
}

/**
 * Filter options for clause library
 */
export interface ClauseLibraryFilters {
  /** Search query */
  searchQuery: string;
  /** Filter by categories */
  categories: ClauseCategory[];
  /** Filter by favor */
  favor: ClauseFavor[];
  /** Filter by source */
  sources: ClauseSource[];
  /** Only show approved clauses */
  approvedOnly: boolean;
  /** Filter by tags */
  tags: string[];
}

/**
 * Clause insertion request for drag-and-drop
 */
export interface ClauseInsertionRequest {
  /** The clause template to insert */
  clauseId: string;
  /** Target document ID */
  targetDocumentId: string;
  /** Target location in document */
  targetLocation: {
    /** Section reference */
    section?: string;
    /** Page number */
    page?: number;
    /** Position indicator */
    position: 'before' | 'after' | 'replace';
    /** Reference clause/text to position relative to */
    referenceText?: string;
  };
  /** Whether to use a specific variant */
  variantId?: string;
}

/**
 * Configuration for clause library display
 */
export interface ClauseLibraryConfig {
  /** Whether to show the library panel */
  showPanel: boolean;
  /** Panel position */
  panelPosition: 'left' | 'right';
  /** Default expanded categories */
  expandedCategories: ClauseCategory[];
  /** Whether to auto-match clauses during comparison */
  autoMatchEnabled: boolean;
  /** Minimum similarity score to consider a match */
  matchThreshold: number;
}

/**
 * Clause library statistics
 */
export interface ClauseLibraryStats {
  /** Total clauses in library */
  totalClauses: number;
  /** Clauses by category */
  byCategory: Record<ClauseCategory, number>;
  /** Clauses by favor */
  byFavor: Record<ClauseFavor, number>;
  /** Clauses by source */
  bySource: Record<ClauseSource, number>;
  /** Most used clauses */
  mostUsed: Array<{ clauseId: string; name: string; usageCount: number }>;
  /** Recently added clauses */
  recentlyAdded: ClauseTemplate[];
}

// ============================================
// Category Display Configuration
// ============================================

export const CLAUSE_CATEGORY_CONFIG: Record<ClauseCategory, {
  label: string;
  description: string;
  icon: 'shield' | 'file-text' | 'alert-triangle' | 'calendar' | 'users' | 'lock' | 'check-circle' | 'x-circle' | 'scale' | 'refresh' | 'more-horizontal';
  color: string;
}> = {
  financial_covenants: {
    label: 'Financial Covenants',
    description: 'Leverage ratios, interest coverage, minimum liquidity requirements',
    icon: 'shield',
    color: 'text-blue-600',
  },
  reporting_requirements: {
    label: 'Reporting Requirements',
    description: 'Financial statements, compliance certificates, notices',
    icon: 'file-text',
    color: 'text-green-600',
  },
  representations_warranties: {
    label: 'Representations & Warranties',
    description: 'Legal status, authorization, financial condition representations',
    icon: 'check-circle',
    color: 'text-purple-600',
  },
  events_of_default: {
    label: 'Events of Default',
    description: 'Payment defaults, covenant breaches, cross-defaults',
    icon: 'alert-triangle',
    color: 'text-red-600',
  },
  definitions: {
    label: 'Definitions',
    description: 'Key defined terms and their interpretations',
    icon: 'file-text',
    color: 'text-zinc-600',
  },
  conditions_precedent: {
    label: 'Conditions Precedent',
    description: 'Requirements before closing or borrowing',
    icon: 'calendar',
    color: 'text-amber-600',
  },
  affirmative_covenants: {
    label: 'Affirmative Covenants',
    description: 'Obligations the borrower must fulfill',
    icon: 'check-circle',
    color: 'text-emerald-600',
  },
  negative_covenants: {
    label: 'Negative Covenants',
    description: 'Restrictions on borrower activities',
    icon: 'x-circle',
    color: 'text-orange-600',
  },
  indemnification: {
    label: 'Indemnification',
    description: 'Indemnity and expense reimbursement provisions',
    icon: 'scale',
    color: 'text-indigo-600',
  },
  assignments_participations: {
    label: 'Assignments & Participations',
    description: 'Transfer restrictions and consent requirements',
    icon: 'refresh',
    color: 'text-cyan-600',
  },
  miscellaneous: {
    label: 'Miscellaneous',
    description: 'Other standard clauses and boilerplate',
    icon: 'more-horizontal',
    color: 'text-zinc-500',
  },
};

export const CLAUSE_FAVOR_CONFIG: Record<ClauseFavor, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  lender: {
    label: 'Lender-Favorable',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200',
  },
  borrower: {
    label: 'Borrower-Favorable',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
  },
  neutral: {
    label: 'Neutral/Balanced',
    color: 'text-zinc-700',
    bgColor: 'bg-zinc-100',
    borderColor: 'border-zinc-200',
  },
};

export const CLAUSE_SOURCE_CONFIG: Record<ClauseSource, {
  label: string;
  description: string;
}> = {
  lsta_standard: {
    label: 'LSTA Standard',
    description: 'Standard LSTA market forms',
  },
  market_standard: {
    label: 'Market Standard',
    description: 'Common market practice language',
  },
  custom: {
    label: 'Custom',
    description: 'Organization-specific language',
  },
  negotiated: {
    label: 'Negotiated',
    description: 'Language from prior negotiations',
  },
};

export const MATCH_STRENGTH_CONFIG: Record<MatchStrength, {
  label: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  exact: {
    label: 'Exact Match',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    description: 'Language matches standard clause exactly',
  },
  similar: {
    label: 'Similar',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
    description: 'Language is substantially similar to standard',
  },
  partial: {
    label: 'Partial Match',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    description: 'Some elements match, others differ',
  },
  deviation: {
    label: 'Deviation',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    description: 'Significant deviation from standard language',
  },
  none: {
    label: 'No Match',
    color: 'text-zinc-700',
    bgColor: 'bg-zinc-100',
    description: 'No matching clause found in library',
  },
};

/**
 * Default filters for clause library
 */
export const DEFAULT_CLAUSE_FILTERS: ClauseLibraryFilters = {
  searchQuery: '',
  categories: [],
  favor: [],
  sources: [],
  approvedOnly: false,
  tags: [],
};

/**
 * Default clause library configuration
 */
export const DEFAULT_CLAUSE_LIBRARY_CONFIG: ClauseLibraryConfig = {
  showPanel: false,
  panelPosition: 'right',
  expandedCategories: [],
  autoMatchEnabled: true,
  matchThreshold: 0.7,
};
