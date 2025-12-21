# ESG Dashboard Module

Monitor sustainability performance and ESG metrics across the loan portfolio.

## Purpose

The ESG Dashboard enables financial institutions to:
- Track KPIs for sustainability-linked loans (SLLs)
- Monitor green, social, and transition loan facilities
- Manage ESG targets and performance reporting
- Analyze use of proceeds allocations
- Predict ESG performance and margin impacts
- Optimize portfolio ESG composition

## Component Hierarchy

```
esg/
├── page.tsx                    → ESG dashboard (main page)
├── facilities/
│   ├── page.tsx               → Facilities list
│   └── [id]/page.tsx          → Facility detail view
├── allocations/page.tsx       → Use of proceeds tracking
├── compare/page.tsx           → Facility comparison
├── predictions/page.tsx       → AI performance predictions
├── portfolio-optimization/page.tsx → Portfolio optimization
└── decision-support/page.tsx  → AI decision support
```

## Feature Components (src/app/features/esg/)

```
features/esg/
├── components/
│   ├── index.ts               → Component exports
│   ├── KPICard.tsx            → KPI metric card
│   ├── StatusBadge.tsx        → Status indicator badge
│   ├── LoanTypeBadge.tsx      → Loan type badge (SLL, Green, etc.)
│   ├── RatingDisplay.tsx      → ESG rating display
│   ├── AllocationChart.tsx    → Allocation progress chart
│   ├── AllocationSankey.tsx   → Sankey diagram for allocations
│   ├── ExportButton.tsx       → Export trigger button
│   ├── ExportModal.tsx        → Export format modal
│   ├── EmptyState.tsx         → Empty state display
│   ├── FacilitySelector.tsx   → Facility selection dropdown
│   ├── FacilityComparisonView.tsx → Side-by-side comparison
│   ├── PredictionCard.tsx     → AI prediction card
│   ├── WhatIfScenarioCard.tsx → Scenario analysis
│   ├── MarginImpactChart.tsx  → Margin impact visualization
│   ├── ConcentrationChart.tsx → Concentration analysis
│   ├── SectorAllocationChart.tsx → Sector breakdown
│   ├── DiversificationOpportunityCard.tsx → Diversification
│   ├── SyndicationOpportunityCard.tsx → Syndication opportunities
│   ├── DivestmentCandidateCard.tsx → Divestment candidates
│   ├── OptimizationScenarioCard.tsx → Optimization scenarios
│   ├── PortfolioESGScoreCard.tsx → Portfolio score
│   ├── MarketBenchmarkCard.tsx → Market benchmarks
│   ├── InstitutionalTargetsCard.tsx → Institutional targets
│   ├── ActionableEntityCard.tsx → Action items
│   └── TimeSeriesChart.tsx    → Time series visualization
├── lib/
│   ├── index.ts               → Library exports
│   ├── types.ts               → ESG type definitions
│   ├── mock-data.ts           → Mock ESG data
│   ├── formatters.ts          → Value formatters
│   ├── export.ts              → Export utilities (PDF, Excel)
│   ├── comparison.ts          → Comparison logic
│   ├── priority-engine-config.ts → Priority scoring
│   ├── actionable-entity.ts   → Actionable entity logic
│   ├── actionable-entity-adapters.ts → Entity adapters
│   └── time-series-adapters.ts → Time series adapters
├── sub_FacilityDetail/
│   ├── index.ts               → Detail exports
│   ├── KPIsSection.tsx        → KPIs tab content
│   ├── TargetsSection.tsx     → Targets tab content
│   └── ReportsSection.tsx     → Reports tab content
└── index.ts                    → Feature exports
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Routes                                │
│  /api/esg/facilities            → Facility CRUD                  │
│  /api/esg/facilities/[id]/kpis  → KPI management                 │
│  /api/esg/facilities/[id]/ratings → ESG ratings                  │
│  /api/esg/facilities/[id]/reports → ESG reports                  │
│  /api/esg/facilities/[id]/allocations → Use of proceeds          │
│  /api/esg/predictions           → AI predictions                 │
│  /api/esg/portfolio-optimization → Optimization suggestions      │
│  /api/esg/syndication           → Syndication opportunities      │
│  /api/esg/dashboard             → Dashboard aggregation          │
│  /api/esg/ai                    → AI assistant                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     LLM Integration                              │
│  src/lib/llm/esg.ts             → ESG analysis prompts           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Feature Components                             │
│  Mock Data → Dashboard Stats → Cards → UI Rendering              │
│  (lib/mock-data.ts → aggregation → KPICard → JSX)                │
└─────────────────────────────────────────────────────────────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| `features/esg/index.ts` | Barrel exports for ESG features |
| `(platform)/esg/page.tsx` | Main dashboard with portfolio overview |
| `features/esg/components/KPICard.tsx` | Reusable KPI metric card |
| `features/esg/lib/mock-data.ts` | Comprehensive mock ESG data |
| `lib/llm/esg.ts` | LLM prompts for ESG analysis |
| `lib/validations/esg.ts` | Zod schemas for ESG data |

## Integration Points

- **Documents Module**: Extract ESG clauses from loan documents
- **Deals Module**: Include ESG terms in negotiations
- **Compliance Module**: Track ESG-related compliance requirements
- **Trading Module**: ESG due diligence for trade decisions

## Sub-Feature Connections

```
                    ┌─────────────────┐
                    │  ESG Dashboard  │
                    │  (Main Page)    │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  Facilities   │   │  Allocations  │   │   Compare     │
│    List       │   │  (Use of      │   │   Facilities  │
│               │   │   Proceeds)   │   │               │
└───────┬───────┘   └───────────────┘   └───────────────┘
        │
        ▼
┌───────────────┐
│   Facility    │
│   Detail      │
└───────┬───────┘
        │
        ├─────────────────────────────────┐
        │                │                │
        ▼                ▼                ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│    KPIs &     │ │    Reports    │ │   Ratings     │
│   Targets     │ │               │ │               │
└───────────────┘ └───────────────┘ └───────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│  Predictions  │ │   Portfolio   │ │   Decision    │
│  (AI Forecast)│ │ Optimization  │ │   Support     │
└───────────────┘ └───────────────┘ └───────────────┘
```

## Key Patterns

- **Loan Type Classification**: SLL, Green, Social, Transition, Hybrid
- **KPI Status Tracking**: on_track, at_risk, off_track, achieved, missed
- **Margin Impact Analysis**: Calculate margin adjustments from KPI performance
- **Use of Proceeds Tracking**: Allocation by category (renewable, efficiency, etc.)
- **AI Predictions**: 90-day forecasts with confidence intervals
- **Portfolio Optimization**: Diversification and syndication suggestions
- **Export System**: PDF and Excel report generation
- **Time Series Analysis**: Trend visualization for KPIs and metrics
