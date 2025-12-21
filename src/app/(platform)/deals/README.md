# Deal Room Module

Manage and negotiate loan terms with counterparties in multi-party negotiations.

## Purpose

The Deal Room enables financial institutions to:
- Create and manage loan deal negotiations
- Track term proposals and counterparty responses
- Analyze deal velocity and predict stalls
- Compare market benchmarks and intelligence
- Collaborate in real-time with negotiation participants

## Component Hierarchy

```
deals/
├── page.tsx                    → Deal list (imports DealsListPage)
├── new/page.tsx               → New deal wizard
├── [id]/
│   ├── page.tsx               → Deal detail view
│   ├── intelligence/page.tsx  → Deal-specific intelligence
│   └── predictive-intelligence/page.tsx → AI predictions
├── intelligence/page.tsx      → Market intelligence dashboard
└── term-intelligence/page.tsx → Term analysis dashboard
```

## Feature Components (src/app/features/deals/)

```
features/deals/
├── DealsListPage.tsx          → Main deals list with views
├── DealDetailPage.tsx         → Deal detail page
├── NewDealPage.tsx            → New deal wizard
├── components/
│   ├── DealFiltersBar.tsx     → Filter controls
│   ├── DealStatsBar.tsx       → Summary statistics
│   ├── DealListView.tsx       → Table/grid view
│   ├── DealKanbanView.tsx     → Kanban board view
│   ├── DealTimelineView.tsx   → Timeline view
│   ├── SortableColumnHeader.tsx → Sortable columns
│   ├── CovenantTrendSparkline.tsx → Trend visualization
│   └── SmartInbox/
│       ├── SmartInboxView.tsx → Priority inbox view
│       ├── PriorityDealCard.tsx → Priority deal card
│       └── InboxStatsHeader.tsx → Inbox statistics
├── lib/
│   ├── mock-data.ts           → Mock deal data
│   ├── search.ts              → Search utilities
│   ├── useDealSort.ts         → Sort hook
│   ├── sort-types.ts          → Sort type definitions
│   ├── filter-pipeline.ts     → Composable filter pipeline
│   ├── priority-calculation.ts → Priority scoring
│   ├── stats-definitions.ts   → Stats config
│   ├── term-status-state-machine.ts → Term state management
│   ├── term-dependency-graph.ts → Term dependencies
│   ├── velocity-types.ts      → Velocity metrics
│   ├── velocity-service.ts    → Velocity calculation
│   ├── stall-prediction.ts    → Stall detection
│   ├── alert-generator.ts     → Alert generation
│   ├── useAccelerationAlerts.ts → Alert hooks
│   ├── useDealStatusUpdate.ts → Status update hook
│   ├── useNavigationGuard.ts  → Unsaved changes guard
│   ├── war-room-types.ts      → War room types
│   ├── useWarRoomHotkeys.ts   → Keyboard shortcuts
│   ├── deadline-utils.ts      → Deadline calculations
│   └── event-sourcing/
│       ├── types.ts           → Event types
│       ├── event-store.ts     → Event storage
│       ├── projections.ts     → State projections
│       ├── time-travel.ts     → State replay
│       └── useEventSourcedDeal.ts → Event sourcing hook
├── sub_DealDetail/
│   ├── DealHeader.tsx         → Deal header
│   ├── DealStats.tsx          → Deal statistics
│   ├── ParticipantsPanel.tsx  → Participants list
│   ├── TermDependencyPanel.tsx → Term dependencies
│   ├── TermDependencyGraphViz.tsx → Dependency graph
│   ├── TermImpactWarningModal.tsx → Impact warnings
│   ├── AccelerationAlertsPanel.tsx → Velocity alerts
│   ├── CalendarExportMenu.tsx → Calendar export
│   ├── ScheduleCallModal.tsx  → Call scheduling
│   ├── EventSourcedTimeline.tsx → Event timeline
│   ├── LivePresencePanel.tsx  → Live collaboration
│   ├── NegotiationTheater.tsx → Negotiation view
│   ├── WarRoomControls.tsx    → War room controls
│   └── HotkeysPanel.tsx       → Keyboard help
├── sub_NewDeal/
│   ├── StepBasics.tsx         → Basic info step
│   ├── StepParticipants.tsx   → Participants step
│   ├── StepSettings.tsx       → Settings step
│   ├── ProgressSteps.tsx      → Progress indicator
│   └── UnsavedChangesDialog.tsx → Unsaved warning
├── intelligence/              → Market intelligence
│   ├── DealIntelligenceDashboard.tsx → Main dashboard
│   ├── components/
│   │   ├── MarketInsightsPanel.tsx → Market insights
│   │   ├── DealComparisonTable.tsx → Deal comparison
│   │   ├── MarketBenchmarkCard.tsx → Benchmarks
│   │   └── TrendAnalysisChart.tsx → Trend charts
│   └── lib/                   → Intelligence utilities
├── term-intelligence/         → Term analysis
│   ├── TermIntelligenceDashboard.tsx → Term dashboard
│   ├── components/
│   │   ├── MarginDeltaChart.tsx → Margin analysis
│   │   ├── TermGroundAnalysisTable.tsx → Term ground
│   │   ├── NegotiationSequencesPanel.tsx → Sequences
│   │   ├── CounterpartyHeatmap.tsx → Counterparty map
│   │   └── PortfolioPerformanceCard.tsx → Performance
│   └── lib/                   → Term utilities
└── predictive-intelligence/   → AI predictions
    ├── PredictiveIntelligenceDashboard.tsx → AI dashboard
    ├── components/
    │   ├── PredictionScoreCard.tsx → Prediction score
    │   ├── StickingPointsPanel.tsx → Sticking points
    │   ├── StrategiesPanel.tsx    → Strategy suggestions
    │   ├── SimilarDealsPanel.tsx  → Similar deals
    │   ├── MarketInsightsGrid.tsx → Market grid
    │   ├── KnowledgeGraphVisualization.tsx → Knowledge graph
    │   ├── CounterpartyInsightsPanel.tsx → Counterparty
    │   └── OptimalTermsPanel.tsx  → Optimal terms
    └── lib/
        ├── prediction-engine.ts → Prediction logic
        └── graph-engine.ts      → Knowledge graph
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Routes                                │
│  /api/deals                     → Deal CRUD                      │
│  /api/deals/[id]/terms          → Term management                │
│  /api/deals/[id]/participants   → Participant management         │
│  /api/deals/[id]/proposals      → Proposal tracking              │
│  /api/deals/[id]/events         → Event sourcing                 │
│  /api/deals/[id]/predictive-intelligence → AI predictions        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     LLM Integration                              │
│  src/lib/llm/negotiation.ts     → Negotiation suggestions        │
│  src/lib/llm/predictive-deal-intelligence.ts → AI predictions    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Feature Components                             │
│  Filter Pipeline → Sort → View Transform → UI Rendering          │
│  (lib/filter-pipeline.ts → useDealSort → viewData → JSX)         │
└─────────────────────────────────────────────────────────────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| `features/deals/index.ts` | Barrel exports for deal features |
| `features/deals/DealsListPage.tsx` | Main list with multiple view modes |
| `features/deals/lib/filter-pipeline.ts` | Composable filter functions |
| `features/deals/lib/event-sourcing/` | Event sourcing implementation |
| `lib/llm/negotiation.ts` | LLM prompts for term suggestions |

## Integration Points

- **Documents Module**: Import terms from parsed loan documents
- **Compliance Module**: Generate compliance obligations from agreed terms
- **ESG Module**: Include ESG terms in negotiations
- **Trading Module**: Export agreed terms for trade documentation

## Sub-Feature Connections

```
                    ┌─────────────────┐
                    │  DealsListPage  │
                    │   (List/Kanban) │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  Smart Inbox  │   │   New Deal    │   │   Deal        │
│  (Priority)   │   │   Wizard      │   │   Detail      │
└───────────────┘   └───────────────┘   └───────┬───────┘
                                                │
        ┌───────────────────────────────────────┼───────────────────┐
        │                   │                   │                   │
        ▼                   ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│    Terms      │   │  Participants │   │   Event       │   │  Acceleration │
│  Negotiation  │   │    Panel      │   │  Timeline     │   │   Alerts      │
└───────────────┘   └───────────────┘   └───────────────┘   └───────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
   │   Market    │   │    Term     │   │  Predictive │
   │Intelligence │   │Intelligence │   │Intelligence │
   └─────────────┘   └─────────────┘   └─────────────┘
```

## Key Patterns

- **Filter Pipeline**: Composable, pure functions for filtering (`pipe()`)
- **Event Sourcing**: Full deal history with time travel capability
- **State Machine**: Term status transitions with validation
- **Priority Inbox**: AI-prioritized deal queue with triage actions
- **Velocity Tracking**: Negotiation speed metrics and stall prediction
- **War Room**: Real-time collaboration with keyboard shortcuts
- **Optimistic Updates**: Immediate UI updates with rollback on failure
