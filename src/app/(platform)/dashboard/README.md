# Dashboard Module

Platform overview providing a unified view of all LoanOS modules.

## Purpose

The Dashboard serves as the central hub for:
- Portfolio health monitoring with aggregated stats
- Cross-module activity feeds and recent updates
- Upcoming deadlines from all modules
- Quick navigation to core platform features
- Risk correlation analysis across the portfolio
- AI-powered autopilot for predictive actions

## Component Hierarchy

```
dashboard/
└── page.tsx                    → Main dashboard (imports DashboardPage)
```

## Feature Components (src/app/features/dashboard/)

```
features/dashboard/
├── DashboardPage.tsx           → Main dashboard component
├── components/
│   ├── index.ts               → Component exports
│   ├── StatsTopBar.tsx        → Top-level stats display
│   ├── StatCard.tsx           → Individual stat card
│   ├── StatDrilldownModal.tsx → Stat detail modal
│   ├── PortfolioHealthScore.tsx → Overall health indicator
│   ├── HealthScoreDrilldownModal.tsx → Health detail modal
│   ├── ModuleCard.tsx         → Module navigation card
│   ├── RecentActivitySection.tsx → Activity feed section
│   ├── ActivityItem.tsx       → Individual activity item
│   ├── UpcomingDeadlinesSection.tsx → Deadlines section
│   ├── DeadlineItem.tsx       → Individual deadline item
│   ├── TrendAnalysis.tsx      → Trend visualization
│   ├── BenchmarkComparison.tsx → Benchmark comparison
│   ├── RiskCorrelationEngine.tsx → Risk correlation view
│   ├── CorrelationDiscovery.tsx → Correlation discovery
│   ├── CorrelationMatrix.tsx  → Correlation heatmap
│   ├── CorrelatedBorrowersPanel.tsx → Correlated borrowers
│   ├── RippleEffectView.tsx   → Risk ripple effects
│   ├── RiskAlertsList.tsx     → Risk alerts display
│   ├── StakeholderCommandCenter.tsx → Team collaboration
│   ├── TeamPresence.tsx       → Team presence indicators
│   ├── CounterpartyActivity.tsx → Counterparty feed
│   ├── ActivityStream.tsx     → Real-time activity
│   ├── PortfolioAutopilot.tsx → AI autopilot dashboard
│   ├── AutopilotAlertItem.tsx → Autopilot alert card
│   ├── AutopilotStatusBadge.tsx → Autopilot status
│   ├── AutopilotSettingsPanel.tsx → Autopilot config
│   ├── PredictionCard.tsx     → AI prediction card
│   ├── InterventionCard.tsx   → Intervention suggestion
│   └── ActionQueuePanel.tsx   → Queued actions panel
├── lib/
│   ├── theme.ts               → Dashboard theming
│   └── mocks/
│       ├── index.ts           → Mock data exports
│       ├── dashboard-data.ts  → Dashboard statistics
│       ├── risk-correlation-types.ts → Correlation types
│       ├── risk-correlation-utils.ts → Correlation utilities
│       ├── risk-correlation-data.ts → Mock correlations
│       ├── collaboration-data.ts → Collaboration mocks
│       ├── autopilot-types.ts → Autopilot type definitions
│       └── autopilot-data.ts  → Autopilot mock data
└── index.ts                    → Feature exports
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Aggregated Data Sources                       │
│  Documents API  │  Deals API  │  Compliance API  │  ESG API     │
│  Trading API    │  Correlations API                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Dashboard Aggregation                        │
│  - Stats from all modules                                        │
│  - Recent activity from all modules                              │
│  - Upcoming deadlines from all modules                           │
│  - Portfolio health calculation                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DashboardPage Component                       │
│  Mock Data → Sections → Local State → UI Rendering               │
│  (lib/mocks → DashboardPage.tsx → useState → JSX)                │
└─────────────────────────────────────────────────────────────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| `features/dashboard/index.ts` | Barrel exports for dashboard features |
| `features/dashboard/DashboardPage.tsx` | Main dashboard with all sections |
| `features/dashboard/components/PortfolioHealthScore.tsx` | Overall health indicator |
| `features/dashboard/components/RiskCorrelationEngine.tsx` | Cross-module risk analysis |
| `features/dashboard/lib/mocks/dashboard-data.ts` | Aggregated mock statistics |

## Integration Points

- **Documents Module**: Recent document uploads, processing status
- **Deals Module**: Active negotiations, pending proposals
- **Compliance Module**: Upcoming deadlines, at-risk facilities
- **ESG Module**: KPI status, sustainability metrics
- **Trading Module**: Active trades, settlement timelines

## Sub-Feature Connections

```
                    ┌─────────────────┐
                    │   DashboardPage │
                    │   (Hub View)    │
                    └────────┬────────┘
                             │
   ┌─────────────────────────┼─────────────────────────┐
   │                         │                         │
   ▼                         ▼                         ▼
┌─────────┐           ┌─────────────┐           ┌─────────────┐
│ Stats   │           │  Activity   │           │  Deadlines  │
│ TopBar  │           │   Feed      │           │   Section   │
└─────────┘           └─────────────┘           └─────────────┘
   │                         │                         │
   │    ┌────────────────────┼────────────────────┐   │
   │    │                    │                    │   │
   ▼    ▼                    ▼                    ▼   ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  Portfolio  │       │    Risk     │       │  Module     │
│   Health    │       │ Correlation │       │   Cards     │
└─────────────┘       └─────────────┘       └─────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Autopilot     │
                    │  (AI Actions)   │
                    └─────────────────┘
```

## Key Patterns

- **Aggregation**: Dashboard aggregates data from all platform modules
- **Health Scoring**: Composite score from multiple module metrics
- **Correlation Discovery**: AI-driven risk correlation identification
- **Autopilot**: Predictive actions based on portfolio state
- **Real-time Presence**: Team collaboration indicators
- **Drilldown Modals**: Click-through to detailed stat breakdowns
