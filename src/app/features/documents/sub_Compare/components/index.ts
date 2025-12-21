export { ChangeIcon, ChangeBadge } from './ChangeIcon';
export { ComparisonCategorySection } from './ComparisonCategorySection';
export { ComparisonStats } from './ComparisonStats';
export { ComparisonFilters } from './ComparisonFilters';
export type { ComparisonFiltersState, ChangeTypeFilter } from './ComparisonFilters';

// Inline diff components for character-level highlighting
export { InlineDiff, getInlineDiffPair } from './InlineDiff';

// Annotation components
export { ReviewStatusBadge } from './ReviewStatusBadge';
export { ReviewStatusDropdown } from './ReviewStatusDropdown';
export { UserMention, UserAvatar } from './UserMention';
export { MentionInput } from './MentionInput';
export { CommentThread } from './CommentThread';
export { AnnotationPanel, AnnotationPanelBackdrop } from './AnnotationPanel';
export { ChangeAnnotationButton, AnnotationSummaryBadge } from './ChangeAnnotationButton';

// Amendment draft components
export { AmendmentDraftModal } from './AmendmentDraftModal';

// Comparison history components
export { ComparisonHistoryItem } from './ComparisonHistoryItem';
export { ComparisonHistoryTimeline } from './ComparisonHistoryTimeline';
export { ComparisonDiffView } from './ComparisonDiffView';
export { HistoryEntryEditModal } from './HistoryEntryEditModal';

// AI Risk Scoring components
export { RiskScoreBadge, FavoredPartyBadge, SeverityScoreMeter } from './RiskScoreBadge';
export { MarketBenchmarkBadge, MarketBenchmarkCard, MarketBenchmarkSection } from './MarketBenchmark';
export { RiskScoreSummary, CompactRiskSummary } from './RiskScoreSummary';

// Temporal comparison components
export { DocumentEvolutionTimeline } from './DocumentEvolutionTimeline';
