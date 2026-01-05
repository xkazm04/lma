# LoanOS Module Analysis

> **Purpose**: Inventory of functional sections per module, mock data status, and AI integration status.
> **Goal**: Migrate to fully mocked solution and identify high-value cross-module feature opportunities.

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total Feature Modules | 6 |
| Total Sub-Features | 32 |
| Mock Data Files | 23 |
| AI/LLM Integration Points | 12+ |
| Total TS/TSX Files | 557 |

---

## 1. Documents Module (`/documents`)

**Purpose**: AI-powered document management for loan document ingestion, analysis, and comparison.

| Functional Section | Mock Data | AI Integration | Notes |
|--------------------|:---------:|:--------------:|-------|
| **DocumentsListPage** - Grid/list document view | Yes | No | Uses `mock-data.ts` |
| **DocumentUploadPage** - Drag-and-drop upload | Partial | No | UI only, no backend |
| **sub_DocumentDetail** - Document viewer | Yes | Yes | Extraction review, covenant parsing |
| ├─ CovenantExtractionReview | Yes | Yes | API `/api/documents/[id]/extraction` |
| ├─ CovenantsTab | Yes | Yes | Covenant parsing from documents |
| ├─ FacilityDetailsTab | Yes | No | Static extraction display |
| ├─ ObligationsTab | Yes | No | Mock obligations data |
| ├─ PartiesTab | Yes | No | Extracted party information |
| ├─ SimilarityTab | Yes | Partial | Similarity scoring (rule-based) |
| ├─ risk-simulation/* | Yes | Yes | `generateStructuredOutput` for risk |
| **sub_Compare** - Document comparison | Yes | Partial | |
| ├─ ComparisonDiffView | Yes | No | Visual diff rendering |
| ├─ AnnotationPanel | Yes | No | Manual annotations |
| ├─ ClauseLibraryPanel | Yes | No | `clause-library-mock-data.ts` |
| ├─ PDFComparisonPanel | Yes | No | Side-by-side PDF view |
| ├─ ExportModal | Yes | No | Export functionality |
| ├─ AmendmentDraftModal | Yes | Partial | Amendment suggestions |
| **sub_Extraction** - Field extraction | Yes | Yes | AI-powered extraction |
| ├─ DocumentAIChat | Partial | Yes | `/api/documents/[id]/chat` |
| ├─ FieldSuggestions | Yes | Yes | AI confidence scores |
| ├─ TemplateSelector | Yes | No | Template matching |
| **sub_Evolution** - Version tracking | Yes | No | Document history |
| **sub_CrossReference** - Cross-doc linking | Partial | No | Reference detection |
| **sub_RiskDashboard** - Risk analysis | Yes | Yes | Risk simulation AI |
| **sub_Translation** - Multilingual | No | No | Placeholder |

### Documents Module - Mock Data Files
- `lib/mock-data.ts` - Sample documents list
- `lib/folder-mock-data.ts` - Folder hierarchy
- `sub_Compare/lib/mock-data.ts` - Comparison results
- `sub_Compare/lib/clause-library-mock-data.ts` - Clause templates
- `sub_Compare/lib/pdf-overlay-mock-data.ts` - PDF overlay data
- `sub_Extraction/lib/mock-data.ts` - Extraction templates

---

## 2. Compliance Module (`/compliance`)

**Purpose**: Proactive monitoring of loan obligations, covenants, and reporting requirements.

| Functional Section | Mock Data | AI Integration | Notes |
|--------------------|:---------:|:--------------:|-------|
| **CompliancePage** - Dashboard overview | Yes | No | `mock-data.ts` |
| **sub_Agent** - AI compliance assistant | Yes | Yes | Chat-based AI agent |
| ├─ ComplianceAgentPage | Yes | Yes | Agent conversation UI |
| ├─ AlertCard | Yes | No | Alert display |
| ├─ AgentStatusPanel | Yes | No | Agent status indicator |
| **sub_AutomatedCalendar** - Smart calendar | Yes | Partial | Rule-based escalation |
| ├─ CalendarFilters | Yes | No | Filter controls |
| ├─ EscalationChainDialog | Yes | No | Escalation workflow |
| ├─ EscalationAuditLog | Yes | No | Audit trail |
| ├─ SnoozeDialog | Yes | No | Snooze management |
| **sub_Autopilot** - Autonomous monitoring | Yes | Yes | AI predictions |
| ├─ AlertsList | Yes | No | Alert queue |
| ├─ PredictionCard | Yes | Yes | AI-generated predictions |
| ├─ RemediationCard | Yes | Yes | AI remediation suggestions |
| ├─ SignalFeed | Yes | No | Signal streaming |
| **sub_Benchmarks** - Industry benchmarking | Yes | No | Static benchmarks |
| ├─ IndustryBenchmarkCard | Yes | No | Benchmark display |
| ├─ CovenantTrendChart | Yes | No | Trend visualization |
| **sub_Calendar** - Calendar view | Yes | No | Event calendar |
| **sub_CovenantNetwork** - Correlation analysis | Yes | Partial | Graph visualization |
| ├─ CorrelationMatrixHeatmap | Yes | No | Visual heatmap |
| ├─ NetworkGraph | Yes | No | Force-directed graph |
| ├─ CellHoverPreviewPanel | Yes | No | Hover details |
| ├─ ContagionRiskPanel | Yes | Partial | Risk propagation |
| **sub_Covenants** - Covenant tracking | Yes | Partial | State machine |
| ├─ CovenantCard | Yes | No | Covenant display |
| ├─ StateHistoryTimeline | Yes | No | State transitions |
| ├─ UnifiedCovenantTimeline | Yes | No | Combined timeline |
| **sub_DocumentGeneration** - Doc automation | Yes | Yes | AI document drafting |
| ├─ DocumentListCard | Yes | No | Document list |
| ├─ SignatureWorkflowPanel | Yes | No | e-Signature workflow |
| **sub_FacilityDetail** - Facility deep-dive | Yes | Yes | AI predictions |
| ├─ CovenantsTab | Yes | No | Facility covenants |
| ├─ WaiversTab | Yes | No | Waiver management |
| ├─ PredictionsTab | Yes | Yes | AI breach predictions |
| ├─ CausalChainVisualization | Yes | Partial | Causality graph |
| ├─ FacilityPredictionPanel | Yes | Yes | Prediction display |
| ├─ WaiverRequestModal | Yes | No | Waiver workflow |
| **sub_HeadroomExchange** - Headroom trading | Yes | No | Headroom calc |
| **sub_LiveTesting** - Integration testing | Yes | No | Test harness |
| ├─ IntegrationSetupDialog | Yes | No | Setup UI |
| ├─ LiveActivityFeed | Yes | No | Activity stream |
| **sub_MarketThermometer** - Market health | Yes | No | Health indicators |
| ├─ IndustryHealthGrid | Yes | No | Industry health |
| ├─ MarketTemperatureGauge | Yes | No | Temperature viz |
| **sub_SimulationSandbox** - Scenario simulation | Yes | Yes | `/api/compliance/simulation` |

### Compliance Module - Mock Data Files
- `lib/mock-data.ts` - Dashboard data
- `lib/mock-state-data.ts` - State transitions
- `lib/temporal-graph-mock-data.ts` - Graph structures
- `lib/correlation-mock-data.ts` - Correlation matrices
- `sub_Agent/lib/mock-data.ts` - Agent conversations
- `sub_AutomatedCalendar/lib/mock-data.ts` - Calendar events
- `sub_Autopilot/lib/mock-data.ts` - Autopilot status
- `sub_HeadroomExchange/lib/mock-data.ts` - Headroom data
- `sub_LiveTesting/lib/mock-data.ts` - Test scenarios

---

## 3. Deals Module (`/deals`)

**Purpose**: Multi-party negotiation workspace for structuring and closing loan transactions.

| Functional Section | Mock Data | AI Integration | Notes |
|--------------------|:---------:|:--------------:|-------|
| **DealsListPage** - Deal overview | Yes | Partial | Priority scoring |
| **DealDetailPage** - Deal workspace | Yes | Yes | AI acceleration alerts |
| **NewDealPage** - Deal creation | Yes | No | Multi-step wizard |
| **DealIntelligencePage** - Analytics | Yes | Yes | Market insights |
| **sub_DealDetail** - Detail panels | Yes | Yes | |
| ├─ DealHeader / DealStats | Yes | No | Static display |
| ├─ ActivityPanel | Yes | No | Activity log |
| ├─ AccelerationAlertsPanel | Yes | Yes | AI blocker detection |
| ├─ NegotiationTheater | Yes | Partial | Real-time view |
| ├─ ParticipantsPanel | Yes | No | Participant list |
| ├─ LivePresencePanel | Yes | No | Presence indicators |
| ├─ TermsCategory* | Yes | No | Term organization |
| ├─ TermDependencyPanel | Yes | Partial | Dependency graph |
| ├─ TermDetailPanel | Yes | No | Term details |
| ├─ EventSourcedTimeline | Yes | No | Event sourcing |
| **sub_NewDeal** - Creation workflow | Yes | No | |
| ├─ ProgressSteps | Yes | No | Step indicator |
| ├─ StepBasics/Import/Participants | Yes | No | Form steps |
| **intelligence** - Market intelligence | Yes | Partial | |
| ├─ DealComparisonTable | Yes | No | Deal comparison |
| ├─ MarketBenchmarkCard | Yes | No | Benchmarks |
| ├─ MarketInsightsPanel | Yes | Partial | AI insights |
| ├─ TrendAnalysisChart | Yes | No | Trend charts |
| **predictive-intelligence** - AI predictions | Yes | Yes | Full AI integration |
| ├─ KnowledgeGraphVisualization | Yes | Yes | AI knowledge graph |
| ├─ PredictionScoreCard | Yes | Yes | AI scores |
| ├─ CounterpartyInsightsPanel | Yes | Yes | Party analysis |
| ├─ MarketInsightsGrid | Yes | Partial | Market data |
| ├─ OptimalTermsPanel | Yes | Yes | AI term suggestions |
| ├─ SimilarDealsPanel | Yes | Yes | Deal matching |
| ├─ StickingPointsPanel | Yes | Yes | Blocker detection |
| ├─ StrategiesPanel | Yes | Yes | AI strategies |
| **term-intelligence** - Term analysis | Yes | Partial | |
| ├─ TermGroundAnalysisTable | Yes | No | Term analysis |
| ├─ CounterpartyHeatmap | Yes | No | Performance matrix |
| ├─ MarginDeltaChart | Yes | No | Margin analysis |
| ├─ NegotiationSequencesPanel | Yes | Partial | Pattern detection |
| ├─ PortfolioPerformanceCard | Yes | No | Portfolio metrics |

### Deals Module - Mock Data Files
- `lib/mock-data.ts` - Sample deals
- `intelligence/lib/mock-data.ts` - Market data
- `predictive-intelligence/lib/mock-data.ts` - Prediction data
- `term-intelligence/lib/mock-data.ts` - Term analysis data

### Deals Module - Advanced Patterns
- **Event Sourcing**: Full audit trail via `event-sourcing/` directory
- **State Machine**: Term lifecycle via `term-status-state-machine.ts`
- **Dependency Graph**: Term dependencies via `term-dependency-graph.ts`

---

## 4. Trading Module (`/trading`)

**Purpose**: Secondary market loan trading lifecycle management.

| Functional Section | Mock Data | AI Integration | Notes |
|--------------------|:---------:|:--------------:|-------|
| **TradingPage** - Main trading view | Partial | No | Basic dashboard |
| **RecentActivity** - Activity feed | Partial | No | Activity display |
| **DashboardStats** - Statistics | Partial | No | Stats display |
| **sub_SettlementCalendar** - Settlement tracking | Yes | Partial | |
| ├─ SettlementCalendar | Yes | No | Calendar view |
| ├─ CalendarDay/Grid/Header | Yes | No | Calendar components |
| ├─ FundingForecastPanel | Yes | Partial | Rule-based forecast |
| ├─ ReminderPanel | Yes | No | Reminder management |
| ├─ SettlementDetailPanel | Yes | No | Trade details |
| ├─ SettlementListView | Yes | No | List alternative |
| **sub_TradeDetail** - Trade details | Partial | No | |
| ├─ DDChecklist | Partial | No | Due diligence |
| **sub_Positions** - Position management | Partial | No | Position tracking |
| **sub_Trades** - Trade list | No | No | Placeholder |

### Trading Module - Mock Data Files
- `lib/fixtures.ts` - Test fixtures (partial)
- `lib/types.ts` - Type definitions with sample data inline

### Trading Module - Gaps
- **Most sections lack dedicated mock data files**
- **No AI integration attempted**
- **Limited functionality compared to other modules**

---

## 5. Dashboard Module (`/dashboard`)

**Purpose**: Central command center for portfolio-wide visibility and collaboration.

| Functional Section | Mock Data | AI Integration | Notes |
|--------------------|:---------:|:--------------:|-------|
| **DashboardPage** - Main dashboard | Yes | Partial | Central hub |
| **PortfolioHealthScore** - Health metric | Yes | Partial | Scoring algorithm |
| **StatsTopBar** - Quick metrics | Yes | No | Stats display |
| **CorrelationMatrix** - Risk correlation | Yes | Partial | Correlation engine |
| **CorrelationDiscovery** - Discovery view | Yes | Partial | Pattern detection |
| **RiskCorrelationEngine** - Analysis | Yes | Yes | AI correlation |
| **RippleEffectView** - Contagion risk | Yes | Partial | Risk propagation |
| **RiskAlertsList** - Risk alerts | Yes | No | Alert queue |
| **InterventionCard** - Interventions | Yes | Yes | AI suggestions |
| **RecentActivitySection** - Activity | Yes | No | Activity stream |
| **ActivityStream** - Activity feed | Yes | No | Event stream |
| **UpcomingDeadlinesSection** - Deadlines | Yes | No | Deadline alerts |
| **BenchmarkComparison** - Benchmarks | Yes | No | Comparison view |
| **TrendAnalysis** - Trends | Yes | No | Trend charts |
| **TeamPresence** - Collaboration | Yes | No | Presence indicators |
| **PredictionCard** - AI predictions | Yes | Yes | AI predictions |
| **CorrelatedBorrowersPanel** - Borrowers | Yes | Partial | Borrower links |
| **HealthScoreDrilldownModal** - Drilldown | Yes | No | Detail modal |
| **StatDrilldownModal** - Stat details | Yes | No | Stat breakdown |
| **CounterpartyActivity** - Party activity | Yes | No | Activity tracking |

### Dashboard Module - Mock Data Files
- `lib/mocks/dashboard-data.ts` - Main dashboard data
- `lib/mocks/autopilot-data.ts` - Autopilot status
- `lib/mocks/risk-correlation-data.ts` - Correlation matrices
- `lib/mocks/collaboration-data.ts` - Team data
- `lib/mocks/borrower-registry.ts` - Borrower registry
- `lib/mocks/date-factory.ts` - Date utilities

---

## 6. Portfolio-3D Module (`/portfolio-3d`)

**Purpose**: 3D visualization of portfolio health and correlations.

| Functional Section | Mock Data | AI Integration | Notes |
|--------------------|:---------:|:--------------:|-------|
| **Portfolio3DVisualization** - Main view | Partial | No | Three.js rendering |
| **Scene3D** - Scene setup | No | No | WebGL scene |
| **BorrowerNode3D** - Borrower nodes | Partial | No | 3D node rendering |
| **HealthTerrain** - Health landscape | No | No | Terrain mesh |
| **CorrelationLine3D** - Correlation lines | Partial | No | Line rendering |
| **CameraController** - Camera | No | No | Camera controls |
| **Fallback2DView** - 2D fallback | Partial | No | Fallback view |
| **XRSupport** - AR/VR support | No | No | XR integration |

### Portfolio-3D Module - Mock Data Files
- Uses data from Dashboard module (`borrower-registry.ts`, `risk-correlation-data.ts`)

### Portfolio-3D Module - Gaps
- **No dedicated mock data**
- **No AI integration**
- **Relies on other modules for data**

---

## Cross-Module Integration Opportunities

### High-Value Feature Connections

| Feature Idea | Modules Connected | Business Value | Implementation Complexity |
|--------------|-------------------|----------------|---------------------------|
| **1. Covenant Breach → Deal Impact Predictor** | Compliance + Deals | High | Medium |
| When a covenant breach is detected, predict impact on active deals with the same borrower | | | |
| **2. Document → Compliance Auto-Population** | Documents + Compliance | High | Medium |
| Extracted covenants from documents automatically populate compliance calendar and tracking | | | |
| **3. Trading Settlement → Cash Flow Forecast** | Trading + Dashboard | High | Low |
| Settlement calendar feeds into portfolio-wide cash flow forecasting on dashboard | | | |
| **4. Deal Velocity → Market Thermometer** | Deals + Compliance | Medium | Low |
| Deal negotiation velocity contributes to market health indicators | | | |
| **5. Risk Correlation → 3D Portfolio View** | Dashboard + Portfolio-3D | Medium | Medium |
| Risk correlation matrix drives 3D visualization positioning and connections | | | |
| **6. Document Evolution → Deal Amendment Tracking** | Documents + Deals | High | Medium |
| Document version history links to deal term changes and negotiations | | | |
| **7. Compliance Agent → Deal Acceleration** | Compliance + Deals | High | High |
| AI agent identifies compliance blockers affecting deal progress | | | |
| **8. Borrower Health → Trading Priority** | Dashboard + Trading | Medium | Low |
| Borrower health scores influence trade priority and due diligence focus | | | |
| **9. Covenant Network → Portfolio Contagion** | Compliance + Dashboard | High | Medium |
| Covenant network analysis feeds portfolio-wide contagion risk assessment | | | |
| **10. Document Similarity → Deal Benchmarking** | Documents + Deals | Medium | Medium |
| Similar document clauses inform deal term benchmarking and suggestions | | | |

### Recommended Priority Order

1. **Document → Compliance Auto-Population** (Quick win, high value)
2. **Covenant Breach → Deal Impact Predictor** (Core business value)
3. **Compliance Agent → Deal Acceleration** (Differentiating AI feature)
4. **Covenant Network → Portfolio Contagion** (Risk management)
5. **Trading Settlement → Cash Flow Forecast** (Operational efficiency)

---

## Mock Data Migration Plan

### Implementation Status (COMPLETED)

| Module | Mock Coverage | Status |
|--------|--------------|--------|
| Documents | 100% | DONE - Translation and CrossReference added |
| Compliance | 100% | DONE - Already complete |
| Deals | 100% | DONE - Already complete |
| Trading | 100% | DONE - Comprehensive mock-data.ts created |
| Dashboard | 100% | DONE - Already complete |
| Portfolio-3D | 100% | DONE - Dedicated mock-data.ts created |

### Completed Actions

1. **Trading Module** - Comprehensive mock data created
   - [x] `lib/mock-data.ts` - Complete trading mock data with positions, trades, settlements, DD checklists, questions, timeline events
   - [x] Calendar settlements with risk levels and reminders
   - [x] Funding forecasts and dashboard stats

2. **Portfolio-3D Module** - Dedicated mock data created
   - [x] `lib/mock-data.ts` - 3D node positions, links, terrain data
   - [x] Camera presets and animation config
   - [x] XR/AR support data

3. **Documents Module** - Gaps filled
   - [x] `sub_Translation/lib/mock-data.ts` - Translation jobs, glossary, quality reports
   - [x] `sub_CrossReference/lib/mock-data.ts` - Already existed with comprehensive data

4. **Cross-Module Data Consistency**
   - [x] `src/lib/shared/registry.ts` - Unified borrower, facility, document, deal, trade, covenant data
   - [x] Consistent IDs across all modules
   - [x] Unified date references with date helpers

---

## AI Integration Status (MIGRATED TO MOCK)

### All AI Features Now Use Mock Data

| Module | Feature | API Endpoint | Status |
|--------|---------|--------------|--------|
| Documents | Document Chat | `/api/documents/[id]/chat` | MOCKED |
| Documents | Extraction Explain | `/api/documents/[id]/extraction/explain` | MOCKED |
| Compliance | Simulation Analysis | `/api/compliance/simulation` | MOCKED |

### Mock Response Approach

All AI features now return comprehensive mock responses that simulate realistic behavior:
- **Document Chat**: Context-aware responses based on question keywords (covenants, maturity, interest, parties)
- **Extraction Explain**: Field-type specific explanations with alternatives and verification steps
- **Simulation Analysis**: Scenario-type specific risk analysis, cascade effects, and recommendations

---

## Cross-Module Features Implemented

All 5 priority cross-module features have been implemented in `src/lib/shared/cross-module-features.ts`:

### 1. Document → Compliance Auto-Population
- `extractCovenantsFromDocument(documentId)` - Extracts covenants from processed documents
- `generateComplianceEventsFromDocument(documentId)` - Auto-generates compliance calendar events
- `getAutoPopulatedComplianceEvents(facilityId)` - Gets all auto-generated events for a facility

### 2. Covenant Breach → Deal Impact Predictor
- `predictDealImpactFromBreach(covenantId)` - Predicts deal impacts from breached covenants
- `getAllBreachDealImpacts()` - Gets all deal impacts across portfolio
- `getBorrowersWithBreachAndActiveDeals()` - Identifies borrowers with both breaches and active deals

### 3. Compliance Agent → Deal Acceleration
- `detectDealBlockers(dealId)` - Detects compliance-related blockers for a deal
- `generateDealAccelerationSuggestions(dealId)` - Generates suggestions to accelerate deal closing
- `getAllDealAccelerationAnalysis()` - Analyzes all active deals for blockers

### 4. Covenant Network → Portfolio Contagion
- `calculateCovenantCorrelations()` - Calculates correlations between covenants
- `assessContagionRisk(covenantId)` - Assesses contagion risk from a breach
- `getPortfolioContagionSummary()` - Gets portfolio-wide contagion risk summary

### 5. Trading Settlement → Cash Flow Forecast
- `getDailySettlements(days)` - Gets settlements organized by date
- `generateCashFlowForecast(days)` - Generates daily cash flow forecast
- `getTradeSettlementImpact(tradeId)` - Gets impact of specific trade on cash flow

---

## Files Created/Modified

### New Files
- `src/lib/shared/registry.ts` - Unified data registry
- `src/lib/shared/cross-module-features.ts` - Cross-module feature implementations
- `src/lib/shared/index.ts` - Shared module exports
- `src/app/features/trading/lib/mock-data.ts` - Trading mock data
- `src/app/features/portfolio-3d/lib/mock-data.ts` - Portfolio-3D mock data
- `src/app/features/documents/sub_Translation/lib/mock-data.ts` - Translation mock data

### Modified Files (AI → Mock)
- `src/app/api/compliance/simulation/route.ts` - Removed LLM, uses mock analysis
- `src/app/api/documents/[id]/chat/route.ts` - Removed LLM, uses mock responses
- `src/app/api/documents/[id]/extraction/explain/route.ts` - Removed LLM, uses mock explanations

---

*Generated: 2025-01-05*
*Updated: 2025-01-05 - All mock data gaps filled, AI removed, cross-module features implemented*
