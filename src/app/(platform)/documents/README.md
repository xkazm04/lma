# Document Intelligence Hub Module

Upload, extract, compare, and analyze loan documents with AI assistance.

## Purpose

The Document Intelligence Hub enables financial institutions to:
- Upload and parse loan documents (PDF, DOCX)
- Extract structured data using AI (terms, parties, covenants)
- Compare documents to identify differences
- Track document evolution over time
- Detect risks and anomalies in document portfolios
- Translate documents between formats

## Component Hierarchy

```
documents/
├── page.tsx                    → Document list (imports DocumentsListPage)
├── upload/page.tsx            → Document upload
├── [id]/
│   ├── page.tsx               → Document detail view
│   └── extraction/page.tsx    → Extraction review
├── compare/page.tsx           → Document comparison
├── portfolio/page.tsx         → Portfolio comparison
├── risk-detection/page.tsx    → Risk detection dashboard
├── evolution/page.tsx         → Document evolution tracking
└── translate/page.tsx         → Document translation
```

## Feature Components (src/app/features/documents/)

```
features/documents/
├── DocumentsListPage.tsx      → Main document list
├── DocumentUploadPage.tsx     → Upload interface
├── components/
│   ├── index.ts               → Component exports
│   ├── GlobalDropzone.tsx     → Drag-and-drop upload
│   ├── DocumentFiltersBar.tsx → Filter controls
│   ├── DocumentStatsBar.tsx   → Summary statistics
│   ├── BatchActionsToolbar.tsx → Bulk operations
│   ├── FolderTree.tsx         → Folder navigation
│   ├── FolderCreateModal.tsx  → Create folder
│   ├── SaveViewDialog.tsx     → Save custom views
│   ├── SavedViewsSidebar.tsx  → Saved views list
│   └── DocumentLifecycleAutomation.tsx → Lifecycle automation
├── lib/
│   ├── types.ts               → Document types
│   ├── folder-store.ts        → Folder state (Zustand)
│   ├── folder-mock-data.ts    → Mock folder data
│   ├── saved-views-store.ts   → Saved views state
│   ├── document-list-store.ts → List state
│   ├── useDocumentLifecycle.ts → Lifecycle hook
│   └── priority-engine-config.ts → Priority scoring
├── sub_DocumentDetail/
│   ├── index.ts               → Detail page export
│   ├── components/
│   │   ├── FacilityDetailsTab.tsx → Facility info
│   │   ├── PartiesTab.tsx     → Parties list
│   │   ├── CovenantsTab.tsx   → Covenants display
│   │   ├── ObligationsTab.tsx → Obligations display
│   │   ├── CovenantExtractionReview.tsx → Covenant review
│   │   └── similarity/
│   │       ├── SimilarityTab.tsx → Similarity analysis
│   │       ├── PrecedentFinder.tsx → Find precedents
│   │       ├── DeviationHighlighter.tsx → Show deviations
│   │       └── MarketBenchmarks.tsx → Market comparison
│   └── lib/
│       └── mock-data.ts       → Mock document data
├── sub_Extraction/
│   ├── index.ts               → Extraction page export
│   ├── components/
│   │   ├── SplitPaneLayout.tsx → Split view layout
│   │   ├── PDFPreviewPane.tsx → PDF preview
│   │   ├── FieldRow.tsx       → Extraction field row
│   │   ├── FieldSuggestions.tsx → AI suggestions
│   │   ├── StickyExtractionStats.tsx → Stats display
│   │   ├── TemplateSelector.tsx → Template selection
│   │   ├── TemplateValidationResults.tsx → Validation
│   │   ├── SourceContextPanel.tsx → Source context
│   │   ├── DocumentAIChat.tsx → AI chat interface
│   │   ├── ExplainExtractionButton.tsx → Explain extraction
│   │   └── KeyboardShortcutsHelp.tsx → Keyboard help
│   ├── hooks/
│   │   ├── useExtractionTemplate.ts → Template hook
│   │   └── useKeyboardNavigation.ts → Keyboard nav
│   └── lib/
│       ├── templates.ts       → Extraction templates
│       ├── template-types.ts  → Template types
│       ├── template-detector.ts → Auto-detect template
│       ├── template-validator.ts → Template validation
│       ├── sourceParser.ts    → Source parsing
│       ├── confidenceHelpers.ts → Confidence utilities
│       └── mock-data.ts       → Mock extraction data
├── sub_Compare/
│   ├── index.ts               → Compare exports
│   ├── TemporalComparisonPage.tsx → Temporal comparison
│   ├── components/
│   │   ├── ChangeIcon.tsx     → Change type icon
│   │   ├── ReviewStatusBadge.tsx → Review status
│   │   ├── ReviewStatusDropdown.tsx → Status dropdown
│   │   ├── AnnotationPanel.tsx → Annotations
│   │   ├── ChangeAnnotationButton.tsx → Add annotation
│   │   ├── CommentThread.tsx  → Comment thread
│   │   ├── UserMention.tsx    → User mentions
│   │   ├── MentionInput.tsx   → Mention input
│   │   ├── DocumentEvolutionTimeline.tsx → Evolution
│   │   ├── ComparisonDiffView.tsx → Diff view
│   │   ├── HistoryEntryEditModal.tsx → Edit history
│   │   ├── RiskScoreBadge.tsx → Risk score
│   │   ├── RiskScoreSummary.tsx → Risk summary
│   │   ├── MarketBenchmark.tsx → Benchmarks
│   │   └── AmendmentDraftModal.tsx → Draft amendments
│   ├── hooks/
│   │   ├── useAnnotations.ts  → Annotation state
│   │   ├── useComparisonStats.ts → Comparison stats
│   │   ├── useComparisonHistory.ts → History hook
│   │   └── useDocumentTimeline.ts → Timeline hook
│   └── lib/
│       ├── types.ts           → Comparison types
│       ├── validation.ts      → Comparison validation
│       ├── history-types.ts   → History types
│       ├── temporal-types.ts  → Temporal types
│       ├── amendment-types.ts → Amendment types
│       └── mock-data.ts       → Mock comparison data
├── sub_PortfolioComparison/
│   ├── index.ts               → Portfolio exports
│   ├── PortfolioComparisonPage.tsx → Main page
│   ├── components/
│   │   ├── PortfolioSummaryCards.tsx → Summary cards
│   │   ├── PortfolioFilters.tsx → Portfolio filters
│   │   ├── AIInsightsPanel.tsx → AI insights
│   │   ├── AnomalyCard.tsx    → Anomaly display
│   │   └── RiskBreakdownChart.tsx → Risk breakdown
│   ├── hooks/
│   │   └── usePortfolioFilters.ts → Filter hook
│   └── lib/
│       ├── types.ts           → Portfolio types
│       └── mock-data.ts       → Mock portfolio data
├── sub_RiskDashboard/
│   ├── index.ts               → Risk dashboard exports
│   ├── RiskDashboardPage.tsx  → Main risk page
│   └── components/
│       ├── RiskStatsCards.tsx → Risk statistics
│       ├── RiskFiltersBar.tsx → Risk filters
│       └── RiskAlertsList.tsx → Risk alerts list
└── sub_Evolution/
    └── EvolutionDashboardPage.tsx → Evolution tracking
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Routes                                │
│  /api/documents                 → Document CRUD                  │
│  /api/documents/[id]/extraction → AI extraction                  │
│  /api/documents/[id]/chat       → Document chat                  │
│  /api/documents/compare         → Document comparison            │
│  /api/documents/portfolio-comparison → Portfolio analysis        │
│  /api/documents/risk-detection  → Risk scanning                  │
│  /api/documents/translate       → Translation                    │
│  /api/documents/evolution       → Evolution tracking             │
│  /api/documents/folders         → Folder management              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     LLM Integration                              │
│  src/lib/llm/extraction.ts      → Field extraction               │
│  src/lib/llm/query.ts           → Document Q&A                   │
│  src/lib/llm/similarity.ts      → Document similarity            │
│  src/lib/llm/amendment.ts       → Amendment drafting             │
│  src/lib/llm/risk-detection.ts  → Risk identification            │
│  src/lib/llm/document-lifecycle.ts → Lifecycle automation        │
│  src/lib/llm/document-translation.ts → Translation               │
│  src/lib/llm/evolution-engine.ts → Evolution suggestions         │
│  src/lib/llm/covenant-extraction.ts → Covenant parsing           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Feature Components                             │
│  Upload → Parse → Extract → Review → Approve → Export            │
│  (Dropzone → API → LLM → ExtractionReview → Approve → JSON)      │
└─────────────────────────────────────────────────────────────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| `features/documents/index.ts` | Barrel exports for document features |
| `features/documents/DocumentsListPage.tsx` | Main list with folder navigation |
| `features/documents/sub_Extraction/` | AI extraction review workflow |
| `lib/llm/extraction.ts` | LLM prompts for field extraction |
| `lib/validations/documents.ts` | Zod schemas for document data |

## Integration Points

- **Deals Module**: Import extracted terms into negotiations
- **Compliance Module**: Generate obligations from document covenants
- **ESG Module**: Extract ESG-related clauses and KPIs
- **Trading Module**: Provide document due diligence data

## Sub-Feature Connections

```
                    ┌─────────────────┐
                    │DocumentsListPage│
                    │   (List/Grid)   │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│    Upload     │   │   Document    │   │   Portfolio   │
│    Page       │   │   Detail      │   │  Comparison   │
└───────────────┘   └───────┬───────┘   └───────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  Extraction   │   │   Compare     │   │  Similarity   │
│   Review      │   │    View       │   │   Analysis    │
└───────────────┘   └───────┬───────┘   └───────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│    Risk       │   │   Evolution   │   │  Translation  │
│  Detection    │   │   Tracking    │   │    Engine     │
└───────────────┘   └───────────────┘   └───────────────┘
```

## Key Patterns

- **Split Pane Layout**: PDF preview alongside extraction fields
- **Template System**: Pre-defined extraction templates by document type
- **Confidence Scoring**: AI confidence levels with human review
- **Folder Organization**: Hierarchical document organization
- **Saved Views**: Persistent filter and view configurations
- **Annotation System**: Collaborative review with comments
- **Risk Scoring**: Automated risk assessment with explanations
- **Temporal Comparison**: Track changes across document versions
