import type { LoanDocument } from '@/types';

/**
 * Valid document status filter values including 'all' for no filtering
 */
export type DocumentStatusFilter = 'all' | 'pending' | 'processing' | 'completed' | 'failed' | 'review_required';

/**
 * Valid document type filter values including 'all' for no filtering
 */
export type DocumentTypeFilter = 'all' | 'facility_agreement' | 'amendment' | 'consent' | 'assignment' | 'other';

/**
 * View mode for document display
 */
export type DocumentViewMode = 'grid' | 'list';

/**
 * Bounding box coordinates for precise highlighting within a PDF page.
 * All values are percentages (0-100) relative to page dimensions.
 */
export interface BoundingBox {
  /** X position as percentage from left edge */
  x: number;
  /** Y position as percentage from top edge */
  y: number;
  /** Width as percentage of page width */
  width: number;
  /** Height as percentage of page height */
  height: number;
}

/**
 * Represents a single extracted field from a loan document.
 *
 * Extraction fields are the atomic units of data pulled from documents
 * during AI-powered document processing. Each field includes its extracted
 * value along with metadata about extraction confidence and source location.
 *
 * ## Confidence Threshold Flagging Rules
 *
 * Fields are flagged based on explicit confidence thresholds defined in
 * `@/app/features/documents/sub_Extraction/lib/constants`:
 *
 * | Confidence Level | Threshold | Flagging Behavior |
 * |-----------------|-----------|-------------------|
 * | **Trusted** | >= 85% | Not flagged. Reliable extraction. |
 * | **Optional Review** | 70-84% | Not auto-flagged. Review optional. |
 * | **Auto-Flag** | < 70% | Automatically flagged for mandatory review. |
 * | **Reject** | < 30% | May be too unreliable to display. |
 *
 * Use `shouldAutoFlag(confidence)` from the constants module to determine
 * if a field should be flagged based on its confidence score.
 *
 * @example
 * // High confidence field - not flagged (>= 85%)
 * const borrowerField: ExtractionField = {
 *   name: 'Borrower Name',
 *   value: 'Acme Corporation',
 *   confidence: 0.95,
 *   source: 'Page 1, Paragraph 2',
 *   flagged: false  // High confidence, trusted
 * };
 *
 * @example
 * // Auto-flagged field - low confidence (< 70%)
 * const uncertainDate: ExtractionField = {
 *   name: 'Maturity Date',
 *   value: 'December 31, 2025',
 *   confidence: 0.65,
 *   source: 'Page 3, Section 2.1',
 *   flagged: true  // Auto-flagged due to confidence < 70%
 * };
 *
 * @example
 * // Explicitly flagged despite acceptable confidence (72%)
 * const ambiguousFee: ExtractionField = {
 *   name: 'Commitment Fee',
 *   value: '0.50%',
 *   confidence: 0.72,
 *   source: 'Page 15, Section 4.5',
 *   flagged: true  // Explicitly flagged due to ambiguous source text
 * };
 */
export interface ExtractionField {
  /** Display name of the extracted field (e.g., 'Borrower Name', 'Maturity Date', 'Total Commitment') */
  name: string;
  /** The extracted value as a string (e.g., 'Acme Corp', '2025-12-31', '$500,000,000') */
  value: string;
  /**
   * AI confidence score from 0.0 to 1.0 indicating extraction reliability.
   *
   * Threshold guidelines:
   * - >= 0.85 (85%): Trusted - no flagging required
   * - 0.70-0.84 (70-84%): Optional review - not auto-flagged
   * - < 0.70 (70%): Auto-flagged for mandatory review
   * - < 0.30 (30%): May be rejected as unreliable
   */
  confidence: number;
  /** Location reference in the source document (e.g., 'Page 1, Paragraph 2', 'Section 3.1', 'Exhibit A') */
  source: string;
  /**
   * When true, indicates this field requires manual review or verification.
   *
   * ## Auto-Flagging Rules (based on confidence thresholds)
   *
   * Fields are **automatically flagged** when:
   * - Confidence score is below 70% (use `shouldAutoFlag(confidence)`)
   *
   * Fields may be **explicitly flagged** regardless of confidence when:
   * - Value appears inconsistent with other extracted data
   * - Multiple conflicting values were found in the document
   * - Source text contains ambiguous or bracketed negotiation language
   * - The field contains critical financial or legal information
   *
   * ## Threshold Summary
   * | Range | Status | Action Required |
   * |-------|--------|-----------------|
   * | >= 85% | Trusted | None |
   * | 70-84% | Optional | Verification recommended |
   * | < 70% | Auto-flagged | Mandatory review |
   *
   * @default false (or auto-calculated based on confidence)
   * @see shouldAutoFlag - Use this function to determine if a field should be flagged
   */
  flagged?: boolean;
  /**
   * The exact text excerpt from the source document where this value was found.
   * Used for source-linked extraction to show context alongside the extracted value.
   */
  sourceExcerpt?: string;
  /**
   * AI-generated reasoning explaining why this value was extracted.
   * Provides transparency into the extraction logic for verification.
   */
  extractionReasoning?: string;
  /**
   * Precise bounding box coordinates for highlighting the source location in the PDF.
   * All coordinates are percentages (0-100) of page dimensions.
   */
  boundingBox?: BoundingBox;
}

/**
 * Groups related extraction fields under a logical category for organized display.
 *
 * Categories help organize extracted data into meaningful sections that align
 * with how loan professionals review documents. Standard categories include
 * deal identification, financial terms, key dates, and covenant information.
 *
 * @example
 * const financialTerms: ExtractionCategory = {
 *   id: 'financial-terms',
 *   category: 'Financial Terms',
 *   fields: [
 *     { name: 'Total Commitment', value: '$500,000,000', confidence: 0.98, source: 'Page 1' },
 *     { name: 'Initial Margin', value: '3.25%', confidence: 0.95, source: 'Page 5, Section 2.3' }
 *   ]
 * };
 *
 * @example
 * const keyDates: ExtractionCategory = {
 *   id: 'key-dates',
 *   category: 'Key Dates',
 *   fields: [
 *     { name: 'Effective Date', value: '2024-01-15', confidence: 0.99, source: 'Preamble' },
 *     { name: 'Maturity Date', value: '2029-01-15', confidence: 0.97, source: 'Section 2.1' }
 *   ]
 * };
 */
export interface ExtractionCategory {
  /** Unique identifier for the category (e.g., 'financial-terms', 'key-dates', 'covenants') */
  id: string;
  /** Human-readable category name for display (e.g., 'Financial Terms', 'Key Dates', 'Covenants') */
  category: string;
  /** Array of extracted fields belonging to this category */
  fields: ExtractionField[];
}

/**
 * Represents a single field change detected between two compared documents.
 *
 * The null semantics for doc1Value and doc2Value indicate addition/removal:
 * - `doc1Value: null` + `doc2Value: string` = field was added (not in doc1)
 * - `doc1Value: string` + `doc2Value: null` = field was removed (not in doc2)
 * - Both non-null = field was modified between documents
 *
 * @example
 * // A modified field (both values present)
 * const modifiedMargin: ComparisonChange = {
 *   field: 'Initial Margin',
 *   doc1Value: '3.25%',
 *   doc2Value: '3.00%',
 *   changeType: 'modified',
 *   impact: 'Margin reduced by 25bps'
 * };
 *
 * @example
 * // A removed field (doc2Value is null)
 * const removedCovenant: ComparisonChange = {
 *   field: 'Annual CapEx Limit',
 *   doc1Value: '$50,000,000',
 *   doc2Value: null,
 *   changeType: 'removed',
 *   impact: 'CapEx covenant removed'
 * };
 *
 * @example
 * // An added field (doc1Value is null)
 * const addedLender: ComparisonChange = {
 *   field: 'Lender: Asian Credit Corp',
 *   doc1Value: null,
 *   doc2Value: '5%',
 *   changeType: 'added',
 *   impact: 'New lender added'
 * };
 */
export interface ComparisonChange {
  /** The name of the field that changed (e.g., 'Total Commitments', 'Maturity Date') */
  field: string;
  /** Value from the first (original) document; null if field was added in doc2 */
  doc1Value: string | null;
  /** Value from the second (amended) document; null if field was removed from doc1 */
  doc2Value: string | null;
  /** The type of change: 'added' (new in doc2), 'removed' (missing in doc2), or 'modified' (different values) */
  changeType: 'added' | 'removed' | 'modified';
  /** Human-readable description of the business impact of this change */
  impact: string;
}

/**
 * Groups related changes under a logical category for organized display.
 *
 * Standard categories used in loan document comparisons:
 * - 'Financial Terms' - Commitments, margins, fees, interest rates
 * - 'Key Dates' - Maturity, effective dates, availability periods
 * - 'Covenants' - Financial covenants, maintenance ratios, restrictions
 * - 'Parties' - Lenders, borrowers, agents, guarantors
 *
 * Additional categories may be used based on document type and content.
 *
 * @example
 * const financialTermsCategory: ComparisonCategory = {
 *   category: 'Financial Terms',
 *   changes: [
 *     { field: 'Total Commitments', doc1Value: '$500,000,000', doc2Value: '$550,000,000', changeType: 'modified', impact: 'Facility size increased by $50M' },
 *     { field: 'Initial Margin', doc1Value: '3.25%', doc2Value: '3.00%', changeType: 'modified', impact: 'Margin reduced by 25bps' }
 *   ]
 * };
 */
export interface ComparisonCategory {
  /** The category name (e.g., 'Financial Terms', 'Key Dates', 'Covenants', 'Parties') */
  category: string;
  /** Array of field changes that belong to this category */
  changes: ComparisonChange[];
}



/**
 * Filter and display configuration for the document list view.
 *
 * Controls how documents are filtered, searched, and displayed in the
 * Document Intelligence Hub. Used by DocumentFiltersBar component and
 * persisted in SavedView configurations.
 *
 * @example
 * // Default filters showing all documents in grid view
 * const defaultFilters: DocumentFilters = {
 *   searchQuery: '',
 *   statusFilter: 'all',
 *   typeFilter: 'all',
 *   viewMode: 'grid'
 * };
 *
 * @example
 * // Filter for pending facility agreements requiring attention
 * const pendingFacilities: DocumentFilters = {
 *   searchQuery: 'apollo',
 *   statusFilter: 'pending',
 *   typeFilter: 'facility_agreement',
 *   viewMode: 'list'
 * };
 */
export interface DocumentFilters {
  /**
   * Text search query to filter documents by name or content.
   * Case-insensitive partial matching. Empty string means no text filter.
   * @example '' - No text filter
   * @example 'apollo' - Documents containing 'apollo'
   * @example 'facility' - Documents containing 'facility'
   */
  searchQuery: string;
  /**
   * Filter documents by processing status.
   * @see DocumentStatusFilter for valid values
   * - 'all' - Show all documents regardless of status
   * - 'pending' - Documents awaiting processing
   * - 'processing' - Documents currently being analyzed
   * - 'completed' - Successfully processed documents
   * - 'failed' - Documents that failed processing
   * - 'review_required' - Documents needing manual review
   */
  statusFilter: DocumentStatusFilter;
  /**
   * Filter documents by document type.
   * @see DocumentTypeFilter for valid values
   * - 'all' - Show all document types
   * - 'facility_agreement' - Primary loan facility agreements
   * - 'amendment' - Amendments to existing agreements
   * - 'consent' - Consent letters and waivers
   * - 'assignment' - Assignment and transfer documents
   * - 'other' - Other document types
   */
  typeFilter: DocumentTypeFilter;
  /**
   * Display mode for the document list.
   * @see DocumentViewMode for valid values
   * - 'grid' - Card-based grid layout (default, better for visual scanning)
   * - 'list' - Compact table/list layout (better for dense information)
   */
  viewMode: DocumentViewMode;
}

/**
 * Represents a saved view configuration
 */
export interface SavedView {
  /** Unique identifier for the view */
  id: string;
  /** Display name for the view */
  name: string;
  /** Filter configuration */
  filters: DocumentFilters;
  /** User ID of the view creator */
  createdBy: string;
  /** Creation timestamp */
  createdAt: string;
  /** Last updated timestamp */
  updatedAt: string;
  /** Whether this view is shared with team members */
  isShared: boolean;
  /** Whether this is the default view for the user */
  isDefault: boolean;
  /** Optional color for visual distinction in sidebar */
  color?: string;
  /** Optional icon name for visual distinction */
  icon?: string;
}

/**
 * User preferences for saved views
 */
export interface SavedViewsPreferences {
  /** ID of the default view to load on page visit */
  defaultViewId: string | null;
  /** Whether to show shared views from team members */
  showSharedViews: boolean;
}

/**
 * Represents an alternative value that the AI considered during extraction.
 *
 * When a field has low confidence, the AI may have considered multiple possible
 * values. This type captures those alternatives along with explanations for
 * why each was rejected in favor of the selected value.
 *
 * @example
 * const alternative: AlternativeValue = {
 *   value: 'December 31, 2024',
 *   confidence: 0.45,
 *   source: 'Page 5, Section 3.2',
 *   rejectionReason: 'This date appears in a different context discussing historical amendments rather than the current maturity date'
 * };
 */
export interface AlternativeValue {
  /** The alternative value that was considered */
  value: string;
  /** Confidence score for this alternative (0.0 to 1.0) */
  confidence: number;
  /** Location in the document where this value was found */
  source: string;
  /** AI-generated explanation for why this value was rejected */
  rejectionReason: string;
}

/**
 * Extended extraction field with AI suggestions and alternatives.
 *
 * Extends the base ExtractionField with additional AI-powered features:
 * - Alternative values the AI considered
 * - Detailed extraction logic explanation
 * - Source document context
 *
 * @example
 * const fieldWithSuggestions: ExtractionFieldWithSuggestions = {
 *   ...baseField,
 *   alternatives: [
 *     { value: '$450M', confidence: 0.35, source: 'Page 2', rejectionReason: 'Appears to be historical amount' }
 *   ],
 *   extractionLogic: 'The value was extracted from the defined terms section...',
 *   documentContext: 'The borrower shall repay the total commitment of $500,000,000...'
 * };
 */
export interface ExtractionFieldWithSuggestions extends ExtractionField {
  /** Alternative values the AI considered but rejected */
  alternatives?: AlternativeValue[];
  /** AI-generated explanation of the extraction logic and reasoning */
  extractionLogic?: string;
  /** Raw text context from the source document around the extracted value */
  documentContext?: string;
}

/**
 * Request payload for explaining extraction logic.
 */
export interface ExplainExtractionRequest {
  /** The document ID */
  documentId: string;
  /** The field name to explain */
  fieldName: string;
  /** The extracted value */
  extractedValue: string;
  /** The source location in the document */
  source: string;
  /** The confidence score */
  confidence: number;
}

/**
 * Response from the extraction explanation API.
 */
export interface ExplainExtractionResponse {
  /** Detailed explanation of the extraction logic */
  explanation: string;
  /** Alternative values that were considered */
  alternatives: AlternativeValue[];
  /** Relevant context from the source document */
  documentContext: string;
  /** Suggested verification steps for the user */
  verificationSteps: string[];
}

/**
 * Message in the document AI chat.
 */
export interface DocumentChatMessage {
  /** Unique message ID */
  id: string;
  /** Message sender role */
  role: 'user' | 'assistant';
  /** Message content */
  content: string;
  /** Timestamp of the message */
  timestamp: string;
  /** Optional sources referenced in the response */
  sources?: Array<{
    page: number;
    section?: string;
    excerpt: string;
  }>;
}

/**
 * Request payload for document AI chat.
 */
export interface DocumentChatRequest {
  /** The document ID */
  documentId: string;
  /** User's question */
  question: string;
  /** Previous messages for context */
  history?: DocumentChatMessage[];
}

/**
 * Response from the document AI chat API.
 */
export interface DocumentChatResponse {
  /** The AI's response */
  answer: string;
  /** Sources referenced in the answer */
  sources: Array<{
    page: number;
    section?: string;
    excerpt: string;
  }>;
  /** Confidence in the answer */
  confidence: number;
}

// ============================================
// Document Folder Types
// ============================================

/**
 * Classification rule type for automatic folder placement
 */
export type ClassificationRuleType =
  | 'borrower_name'
  | 'deal_reference'
  | 'document_type'
  | 'date_range'
  | 'custom_field';

/**
 * Operator for classification rule matching
 */
export type ClassificationOperator =
  | 'equals'
  | 'contains'
  | 'starts_with'
  | 'ends_with'
  | 'regex';

/**
 * A single classification rule for automatic folder placement
 */
export interface ClassificationRule {
  /** Unique identifier for the rule */
  id: string;
  /** Type of field to match against */
  fieldType: ClassificationRuleType;
  /** Operator for matching */
  operator: ClassificationOperator;
  /** Value to match */
  value: string;
  /** Whether this rule is case-sensitive */
  caseSensitive?: boolean;
  /** Priority of this rule (higher = evaluated first) */
  priority: number;
}

/**
 * Represents a document folder in the hierarchy
 */
export interface DocumentFolder {
  /** Unique identifier for the folder */
  id: string;
  /** Organization ID this folder belongs to */
  organizationId: string;
  /** Parent folder ID, null for root-level folders */
  parentId: string | null;
  /** Display name of the folder */
  name: string;
  /** Optional description of the folder */
  description?: string;
  /** Folder color for visual distinction */
  color?: string;
  /** Icon name for the folder */
  icon?: string;
  /** Whether this folder is a smart folder with auto-classification rules */
  isSmartFolder: boolean;
  /** Auto-classification rules for this folder */
  classificationRules?: ClassificationRule[];
  /** Whether this folder accepts documents that match ANY rule (true) or ALL rules (false) */
  matchAnyRule?: boolean;
  /** Number of documents directly in this folder */
  documentCount: number;
  /** Number of child folders */
  childFolderCount: number;
  /** User who created the folder */
  createdBy: string;
  /** Creation timestamp */
  createdAt: string;
  /** Last updated timestamp */
  updatedAt: string;
  /** Display order within parent */
  displayOrder: number;
}

/**
 * Folder with nested children for tree display
 */
export interface FolderTreeNode extends DocumentFolder {
  /** Child folders */
  children: FolderTreeNode[];
  /** Total document count including all descendants */
  totalDocumentCount: number;
  /** Whether this node is expanded in the UI */
  isExpanded?: boolean;
}

/**
 * AI-suggested folder placement for a document
 */
export interface FolderSuggestion {
  /** The folder being suggested */
  folderId: string;
  /** Folder name for display */
  folderName: string;
  /** Full path of the folder */
  folderPath: string;
  /** Confidence score from 0.0 to 1.0 */
  confidence: number;
  /** Reason for the suggestion */
  reasoning: string;
  /** Which rules matched (for smart folders) */
  matchedRules?: {
    ruleId: string;
    fieldType: ClassificationRuleType;
    matchedValue: string;
  }[];
  /** Extracted data that led to this suggestion */
  extractedData?: {
    borrowerName?: string;
    dealReference?: string;
    documentType?: string;
    date?: string;
  };
}

/**
 * Request to create a new folder
 */
export interface CreateFolderRequest {
  /** Parent folder ID, null for root-level */
  parentId: string | null;
  /** Display name */
  name: string;
  /** Optional description */
  description?: string;
  /** Optional color */
  color?: string;
  /** Optional icon */
  icon?: string;
  /** Whether this is a smart folder */
  isSmartFolder?: boolean;
  /** Classification rules for smart folders */
  classificationRules?: Omit<ClassificationRule, 'id'>[];
  /** Match any or all rules */
  matchAnyRule?: boolean;
}

/**
 * Request to move a document to a folder
 */
export interface MoveDocumentRequest {
  /** Document ID to move */
  documentId: string;
  /** Target folder ID, null for root (unfiled) */
  targetFolderId: string | null;
}

/**
 * Request to move multiple documents to a folder
 */
export interface BulkMoveDocumentsRequest {
  /** Document IDs to move */
  documentIds: string[];
  /** Target folder ID, null for root (unfiled) */
  targetFolderId: string | null;
}

/**
 * Request to get AI folder suggestions for a document
 */
export interface GetFolderSuggestionsRequest {
  /** Document ID to get suggestions for */
  documentId: string;
  /** Maximum number of suggestions to return */
  maxSuggestions?: number;
}

/**
 * Response with AI folder suggestions
 */
export interface GetFolderSuggestionsResponse {
  /** The document ID */
  documentId: string;
  /** List of folder suggestions */
  suggestions: FolderSuggestion[];
  /** Whether auto-placement is recommended */
  autoPlacementRecommended: boolean;
  /** If auto-placement is recommended, the folder ID */
  recommendedFolderId?: string;
}

/**
 * Folder filter options for the document list
 */
export type FolderFilter =
  | { type: 'all' }
  | { type: 'unfiled' }
  | { type: 'folder'; folderId: string; includeSubfolders?: boolean };

/**
 * Extended document filters including folder
 */
export interface DocumentFiltersWithFolder extends DocumentFilters {
  /** Folder filter */
  folderFilter?: FolderFilter;
}

// ============================================
// Document Similarity & Precedent Finder Types
// ============================================

/**
 * Represents a similar document found in the organization's repository
 */
export interface SimilarDocument {
  /** Unique identifier of the similar document */
  id: string;
  /** Original filename of the document */
  filename: string;
  /** Document type (facility_agreement, amendment, etc.) */
  documentType: string;
  /** Overall similarity score from 0.0 to 1.0 */
  similarityScore: number;
  /** Date the document was uploaded/created */
  date: string;
  /** Borrower name from the document */
  borrowerName: string;
  /** Deal/facility reference */
  dealReference?: string;
  /** Total commitment amount if applicable */
  totalCommitment?: number;
  /** Currency of the commitment */
  currency?: string;
  /** Key terms that matched between documents */
  matchingTerms: string[];
  /** Brief summary of why this document is similar */
  similaritySummary: string;
}

/**
 * A clause or term that deviates from organizational norms
 */
export interface TermDeviation {
  /** Unique identifier for the deviation */
  id: string;
  /** Name of the term or clause */
  termName: string;
  /** Category of the term (financial, covenant, legal, etc.) */
  category: 'financial_terms' | 'covenants' | 'legal_provisions' | 'key_dates' | 'parties' | 'other';
  /** Value in the current document */
  currentValue: string;
  /** The organizational norm/standard value */
  normValue: string;
  /** Direction of deviation: better (more favorable), worse, or neutral */
  deviationDirection: 'better' | 'worse' | 'neutral';
  /** Percentage deviation from norm (if applicable) */
  deviationPercentage?: number;
  /** AI-generated explanation of the deviation and its implications */
  explanation: string;
  /** Severity level of the deviation */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Reference to clause in the document */
  clauseReference?: string;
  /** Page number where found */
  pageNumber?: number;
}

/**
 * How a similar clause was negotiated in past deals
 */
export interface NegotiationPrecedent {
  /** Unique identifier */
  id: string;
  /** The document this precedent is from */
  sourceDocumentId: string;
  /** Source document name */
  sourceDocumentName: string;
  /** Date of the source document/deal */
  dealDate: string;
  /** The borrower in that deal */
  borrowerName: string;
  /** Initial proposed value */
  initialValue: string;
  /** Final negotiated value */
  finalValue: string;
  /** Number of negotiation rounds (if known) */
  negotiationRounds?: number;
  /** Summary of how the negotiation progressed */
  negotiationSummary: string;
  /** Key arguments used during negotiation */
  keyArguments: string[];
  /** Outcome quality assessment */
  outcomeAssessment: 'favorable' | 'neutral' | 'unfavorable';
}

/**
 * Market benchmark data for a specific term
 */
export interface MarketBenchmark {
  /** Unique identifier */
  id: string;
  /** Name of the term being benchmarked */
  termName: string;
  /** Category of the term */
  category: 'financial_terms' | 'covenants' | 'legal_provisions' | 'key_dates';
  /** Current value in the document */
  currentValue: string;
  /** Market average value */
  marketAverage: string;
  /** Market median value */
  marketMedian?: string;
  /** Range of values seen in market (min) */
  marketRangeMin: string;
  /** Range of values seen in market (max) */
  marketRangeMax: string;
  /** Percentile of current value in market distribution */
  percentile: number;
  /** Sample size for the benchmark */
  sampleSize: number;
  /** Time period of the benchmark data */
  benchmarkPeriod: string;
  /** Industry segment if applicable */
  industrySegment?: string;
  /** Assessment of current value vs market */
  assessment: 'below_market' | 'at_market' | 'above_market';
  /** AI-generated insight about market positioning */
  marketInsight: string;
}

/**
 * Matched clause from a precedent document
 */
export interface PrecedentClause {
  /** Unique identifier */
  id: string;
  /** Source document ID */
  sourceDocumentId: string;
  /** Source document name */
  sourceDocumentName: string;
  /** The clause name/type */
  clauseName: string;
  /** The clause text from the precedent */
  clauseText: string;
  /** How similar this clause is to the current document's clause (0.0 to 1.0) */
  similarity: number;
  /** Key differences from current document */
  keyDifferences: string[];
  /** Clause reference in source document */
  sourceClauseReference: string;
  /** Negotiation history for this clause if available */
  negotiationHistory?: NegotiationPrecedent;
}

/**
 * Complete similarity analysis result for a document
 */
export interface DocumentSimilarityAnalysis {
  /** The document being analyzed */
  documentId: string;
  /** When the analysis was performed */
  analysisTimestamp: string;
  /** Overall match quality indicator */
  overallMatchQuality: 'excellent' | 'good' | 'moderate' | 'limited';
  /** Similar documents found */
  similarDocuments: SimilarDocument[];
  /** Term deviations from organizational norms */
  deviations: TermDeviation[];
  /** Market benchmarks for key terms */
  marketBenchmarks: MarketBenchmark[];
  /** AI-generated summary of the analysis */
  analysisSummary: string;
  /** Key recommendations based on the analysis */
  recommendations: string[];
}

/**
 * Request to find similar documents
 */
export interface FindSimilarDocumentsRequest {
  /** Document ID to find similar documents for */
  documentId: string;
  /** Maximum number of similar documents to return */
  maxResults?: number;
  /** Minimum similarity score threshold (0.0 to 1.0) */
  minSimilarity?: number;
  /** Filter by document type */
  documentTypeFilter?: string[];
  /** Date range filter (start) */
  dateFrom?: string;
  /** Date range filter (end) */
  dateTo?: string;
  /** Include negotiation history in results */
  includeNegotiationHistory?: boolean;
}

/**
 * Request to get term deviations analysis
 */
export interface GetDeviationsRequest {
  /** Document ID to analyze */
  documentId: string;
  /** Minimum deviation severity to include */
  minSeverity?: 'low' | 'medium' | 'high' | 'critical';
  /** Categories to analyze */
  categories?: ('financial_terms' | 'covenants' | 'legal_provisions' | 'key_dates' | 'parties' | 'other')[];
}

/**
 * Request to get market benchmarks
 */
export interface GetMarketBenchmarksRequest {
  /** Document ID to benchmark */
  documentId: string;
  /** Specific terms to benchmark (if empty, benchmarks all available) */
  termNames?: string[];
  /** Industry segment filter */
  industrySegment?: string;
  /** Time period for benchmark data */
  benchmarkPeriod?: '6_months' | '1_year' | '2_years' | '5_years';
}

/**
 * Response containing precedent clauses for a specific term
 */
export interface PrecedentClausesResponse {
  /** The term being analyzed */
  termName: string;
  /** Current clause text in the document */
  currentClauseText: string;
  /** Precedent clauses found */
  precedentClauses: PrecedentClause[];
  /** Number of deals analyzed */
  dealsAnalyzed: number;
  /** AI-generated insights */
  insights: string[];
}

// ============================================
// AI Risk Scoring Types for Document Comparison
// ============================================

/**
 * Party that a change favors in the loan agreement
 */
export type FavoredParty = 'borrower' | 'lender' | 'neutral';

/**
 * Risk severity level based on score
 */
export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * AI-generated risk score for a single document change
 */
export interface ChangeRiskScore {
  /** Unique identifier for the change (matches changeId) */
  changeId: string;
  /** Risk severity score from 1-10 (1=minimal, 10=critical) */
  severityScore: number;
  /** Risk severity category derived from score */
  severity: RiskSeverity;
  /** Which party this change favors */
  favoredParty: FavoredParty;
  /** AI-generated explanation of the risk implications */
  riskAnalysis: string;
  /** Whether this change deviates from market standards */
  deviatesFromMarket: boolean;
  /** AI confidence in this assessment (0.0 to 1.0) */
  confidence: number;
}

/**
 * Market benchmark data for a specific change/term
 */
export interface ChangeMarketBenchmark {
  /** Unique identifier matching the change */
  changeId: string;
  /** The field/term being benchmarked */
  termName: string;
  /** Category of the term */
  category: string;
  /** Value in document 1 (original) */
  originalValue: string | null;
  /** Value in document 2 (amended) */
  amendedValue: string | null;
  /** Typical market range - lower bound */
  marketRangeLow: string;
  /** Typical market range - upper bound */
  marketRangeHigh: string;
  /** Market median/typical value */
  marketMedian: string;
  /** How the amended value compares to market */
  marketPosition: 'below_market' | 'at_market' | 'above_market';
  /** Percentile of the amended value in market distribution (0-100) */
  percentile: number;
  /** Sample size used for benchmark */
  sampleSize: number;
  /** Time period of benchmark data */
  benchmarkPeriod: string;
  /** AI insight about the market positioning */
  marketInsight: string;
}

/**
 * Summary of risk scores for a category of changes
 */
export interface CategoryRiskSummary {
  /** Category name */
  category: string;
  /** Average severity score across changes in this category */
  averageSeverityScore: number;
  /** Number of changes favoring borrower */
  borrowerFavoredCount: number;
  /** Number of changes favoring lender */
  lenderFavoredCount: number;
  /** Number of neutral changes */
  neutralCount: number;
  /** Number of changes deviating from market standards */
  marketDeviationCount: number;
  /** Highest severity change in this category */
  highestRiskChange: string | null;
}

/**
 * Overall risk analysis summary for the entire comparison
 */
export interface ComparisonRiskSummary {
  /** Overall risk score (1-10, weighted average) */
  overallRiskScore: number;
  /** Overall risk severity */
  overallSeverity: RiskSeverity;
  /** Net direction of changes */
  overallDirection: 'borrower_favorable' | 'lender_favorable' | 'balanced';
  /** Total number of changes analyzed */
  totalChangesAnalyzed: number;
  /** Number of high-risk changes (score >= 7) */
  highRiskCount: number;
  /** Number of changes deviating from market standards */
  marketDeviationCount: number;
  /** Per-category summaries */
  categorySummaries: CategoryRiskSummary[];
  /** Key findings and recommendations */
  keyFindings: string[];
  /** AI-generated executive summary */
  executiveSummary: string;
  /** Analysis timestamp */
  analyzedAt: string;
}

/**
 * Complete risk analysis result for a document comparison
 */
export interface ComparisonRiskAnalysis {
  /** Document 1 reference */
  document1: { id: string; name: string };
  /** Document 2 reference */
  document2: { id: string; name: string };
  /** Individual change risk scores */
  changeScores: ChangeRiskScore[];
  /** Market benchmarks for applicable changes */
  marketBenchmarks: ChangeMarketBenchmark[];
  /** Overall summary */
  summary: ComparisonRiskSummary;
}

/**
 * Change type used in flat comparison result structure
 */
export type ChangeType = 'added' | 'removed' | 'modified';

// ============================================
// Document Lifecycle Automation Types
// ============================================

/**
 * Configuration options for document lifecycle automation
 */
export interface LifecycleAutomationConfig {
  /** Enable creation of compliance facilities and obligations */
  enableCompliance: boolean;
  /** Enable population of deal room terms */
  enableDeals: boolean;
  /** Enable creation of trading DD checklists */
  enableTrading: boolean;
  /** Enable creation of ESG KPIs and targets */
  enableESG: boolean;
  /** Automatically confirm items with high confidence */
  autoConfirmLowRiskItems: boolean;
  /** Confidence threshold for auto-confirmation (0.0 to 1.0) */
  confidenceThreshold: number;
}

/**
 * Status of lifecycle automation for a document
 */
export interface LifecycleAutomationStatus {
  /** Document ID */
  documentId: string;
  /** Overall automation status */
  status: 'not_started' | 'in_progress' | 'completed' | 'partial' | 'failed';
  /** Current phase of automation */
  phase: string;
  /** Percentage complete (0-100) */
  percentComplete: number;
  /** Current step description */
  currentStep: string;
  /** Modules that have been processed */
  modulesProcessed: string[];
  /** Any errors that occurred */
  errors: Array<{
    module: string;
    code: string;
    message: string;
    recoverable: boolean;
  }>;
  /** Processing time in milliseconds */
  processingTimeMs: number | null;
  /** Timestamp when automation started */
  startedAt: string | null;
  /** Timestamp when automation completed */
  completedAt: string | null;
}

/**
 * Result of compliance module automation
 */
export interface ComplianceAutomationResult {
  /** Whether a compliance facility was created */
  facilityCreated: boolean;
  /** ID of the created facility */
  facilityId: string | null;
  /** Number of covenants created */
  covenantsCreated: number;
  /** Number of obligations created */
  obligationsCreated: number;
  /** Number of calendar events scheduled */
  eventsScheduled: number;
  /** Number of notification requirements created */
  notificationsCreated: number;
  /** Number of items pending manual review */
  itemsPendingReview: number;
}

/**
 * Result of deals module automation
 */
export interface DealsAutomationResult {
  /** Number of terms populated from facility data */
  termsPopulated: number;
  /** Number of term categories created */
  categoriesCreated: number;
  /** Number of base terms imported from facility */
  baseTermsFromFacility: number;
  /** Number of defined terms linked */
  definedTermsLinked: number;
}

/**
 * Result of trading module automation
 */
export interface TradingAutomationResult {
  /** Whether a trade facility was created */
  facilityCreated: boolean;
  /** ID of the created trade facility */
  facilityId: string | null;
  /** Number of DD checklist items generated */
  ddChecklistItemsGenerated: number;
  /** Whether transferability restrictions were identified */
  transferabilityIdentified: boolean;
}

/**
 * Result of ESG module automation
 */
export interface ESGAutomationResult {
  /** Whether an ESG facility was created */
  facilityCreated: boolean;
  /** ID of the created ESG facility */
  facilityId: string | null;
  /** Number of KPIs created */
  kpisCreated: number;
  /** Number of targets created */
  targetsCreated: number;
  /** Number of proceeds categories created */
  proceedsCategoriesCreated: number;
}

/**
 * Complete lifecycle automation result
 */
export interface LifecycleAutomationResult {
  /** Document ID */
  documentId: string;
  /** Compliance module results */
  compliance: ComplianceAutomationResult | null;
  /** Deals module results */
  deals: DealsAutomationResult | null;
  /** Trading module results */
  trading: TradingAutomationResult | null;
  /** ESG module results */
  esg: ESGAutomationResult | null;
  /** Overall automation status */
  automationStatus: 'completed' | 'partial' | 'failed';
  /** Processing time in milliseconds */
  processingTimeMs: number;
  /** Errors encountered during processing */
  errors: Array<{
    module: string;
    code: string;
    message: string;
    recoverable: boolean;
    timestamp: string;
  }>;
  /** Extraction confidence score */
  extractionConfidence: number;
}

// ============================================
// Proactive Risk Detection Types
// ============================================

/**
 * Severity level for detected risks
 */
export type RiskAlertSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

/**
 * Category of detected risk
 */
export type RiskCategory =
  | 'covenant_threshold'
  | 'sanctions_screening'
  | 'missing_clause'
  | 'conflicting_terms'
  | 'unusual_terms'
  | 'regulatory_compliance'
  | 'document_quality'
  | 'party_risk';

/**
 * Status of a risk alert
 */
export type RiskAlertStatus = 'new' | 'acknowledged' | 'investigating' | 'resolved' | 'false_positive';

/**
 * A single detected risk alert from document analysis
 */
export interface RiskAlert {
  /** Unique identifier for the risk alert */
  id: string;
  /** Document ID that triggered this alert */
  documentId: string;
  /** Document filename for display */
  documentName: string;
  /** Category of the risk */
  category: RiskCategory;
  /** Severity level */
  severity: RiskAlertSeverity;
  /** Current status of the alert */
  status: RiskAlertStatus;
  /** Short title describing the risk */
  title: string;
  /** Detailed description of the risk */
  description: string;
  /** Specific value or text that triggered the alert */
  triggeredValue?: string;
  /** Expected or normal value for comparison */
  expectedValue?: string;
  /** Location in document where risk was found */
  sourceLocation?: {
    page?: number;
    section?: string;
    clauseReference?: string;
  };
  /** Related document IDs for conflicting terms */
  relatedDocumentIds?: string[];
  /** AI confidence in this detection (0.0 to 1.0) */
  confidence: number;
  /** AI-generated recommendation for addressing this risk */
  recommendation: string;
  /** Potential business impact description */
  businessImpact?: string;
  /** Regulatory reference if applicable */
  regulatoryReference?: string;
  /** When the alert was created */
  createdAt: string;
  /** When the alert was last updated */
  updatedAt: string;
  /** User who acknowledged/resolved the alert */
  resolvedBy?: string;
  /** Notes added during resolution */
  resolutionNotes?: string;
}

/**
 * Summary statistics for risk dashboard
 */
export interface RiskDashboardStats {
  /** Total number of alerts */
  totalAlerts: number;
  /** Alerts by severity */
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  /** Alerts by category */
  byCategory: {
    covenant_threshold: number;
    sanctions_screening: number;
    missing_clause: number;
    conflicting_terms: number;
    unusual_terms: number;
    regulatory_compliance: number;
    document_quality: number;
    party_risk: number;
  };
  /** Alerts by status */
  byStatus: {
    new: number;
    acknowledged: number;
    investigating: number;
    resolved: number;
    false_positive: number;
  };
  /** Documents with risks */
  documentsAtRisk: number;
  /** Total documents scanned */
  totalDocumentsScanned: number;
  /** Risk score (0-100) */
  overallRiskScore: number;
  /** Trend compared to previous period */
  trendDirection: 'improving' | 'stable' | 'worsening';
  /** Percentage change in alerts */
  trendPercentage: number;
  /** Last scan timestamp */
  lastScanTimestamp: string;
}

/**
 * Document with aggregated risk information
 */
export interface DocumentRiskProfile {
  /** Document ID */
  documentId: string;
  /** Document filename */
  documentName: string;
  /** Document type */
  documentType: string;
  /** Borrower name */
  borrowerName?: string;
  /** Total risk alerts for this document */
  alertCount: number;
  /** Highest severity alert */
  highestSeverity: RiskAlertSeverity;
  /** Categories of risks found */
  riskCategories: RiskCategory[];
  /** Document-level risk score (0-100) */
  riskScore: number;
  /** When document was last scanned */
  lastScannedAt: string;
  /** Upload date */
  uploadedAt: string;
}

/**
 * Covenant threshold alert details
 */
export interface CovenantThresholdAlert extends RiskAlert {
  category: 'covenant_threshold';
  /** Name of the covenant */
  covenantName: string;
  /** Current threshold value */
  currentThreshold: string;
  /** Typical market threshold */
  marketThreshold: string;
  /** Percentage deviation from market */
  deviationPercentage: number;
  /** Whether this is more or less restrictive than market */
  restrictiveness: 'more_restrictive' | 'less_restrictive';
}

/**
 * Sanctions screening alert details
 */
export interface SanctionsScreeningAlert extends RiskAlert {
  category: 'sanctions_screening';
  /** Entity name that matched */
  matchedEntityName: string;
  /** Type of entity (borrower, guarantor, agent, etc.) */
  entityType: string;
  /** Sanctions list that matched */
  sanctionsList: string;
  /** Match confidence */
  matchScore: number;
  /** Whether it's an exact or fuzzy match */
  matchType: 'exact' | 'fuzzy' | 'alias';
}

/**
 * Missing clause alert details
 */
export interface MissingClauseAlert extends RiskAlert {
  category: 'missing_clause';
  /** Name of the missing clause */
  clauseName: string;
  /** Why this clause is typically required */
  clausePurpose: string;
  /** Whether it's legally required or best practice */
  requirement: 'legal_requirement' | 'regulatory_requirement' | 'market_standard' | 'best_practice';
  /** Similar clauses found that may partially cover this */
  partialCoverage?: string[];
}

/**
 * Conflicting terms alert details
 */
export interface ConflictingTermsAlert extends RiskAlert {
  category: 'conflicting_terms';
  /** Term name that conflicts */
  termName: string;
  /** Value in this document */
  thisDocumentValue: string;
  /** Value in related document */
  relatedDocumentValue: string;
  /** Related document name */
  relatedDocumentName: string;
  /** Nature of the conflict */
  conflictType: 'contradiction' | 'inconsistency' | 'ambiguity';
}

/**
 * Request to scan documents for risks
 */
export interface RiskScanRequest {
  /** Document IDs to scan (empty for all) */
  documentIds?: string[];
  /** Categories to scan for */
  categories?: RiskCategory[];
  /** Minimum severity to report */
  minSeverity?: RiskAlertSeverity;
  /** Include previously scanned documents */
  rescan?: boolean;
}

/**
 * Response from risk scan
 */
export interface RiskScanResponse {
  /** Scan ID for tracking */
  scanId: string;
  /** Whether scan is complete or in progress */
  status: 'completed' | 'in_progress' | 'failed';
  /** Documents scanned */
  documentsScanned: number;
  /** New alerts detected */
  alertsDetected: number;
  /** Alerts by severity */
  alertsBySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  /** Scan duration in milliseconds */
  durationMs?: number;
  /** Error message if failed */
  error?: string;
}

/**
 * Filter options for risk alerts
 */
export interface RiskAlertFilters {
  /** Filter by severity */
  severity?: RiskAlertSeverity[];
  /** Filter by category */
  category?: RiskCategory[];
  /** Filter by status */
  status?: RiskAlertStatus[];
  /** Filter by document ID */
  documentId?: string;
  /** Filter by date range (start) */
  dateFrom?: string;
  /** Filter by date range (end) */
  dateTo?: string;
  /** Search query */
  searchQuery?: string;
  /** Sort by field */
  sortBy?: 'severity' | 'createdAt' | 'documentName' | 'category';
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
}

/**
 * Paginated risk alerts response
 */
export interface RiskAlertsResponse {
  /** Alerts matching the filter */
  alerts: RiskAlert[];
  /** Total count of matching alerts */
  total: number;
  /** Current page */
  page: number;
  /** Page size */
  pageSize: number;
  /** Dashboard statistics */
  stats: RiskDashboardStats;
}

