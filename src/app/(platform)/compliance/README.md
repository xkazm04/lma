# Compliance Tracker Module

Monitor obligations, covenants, and reporting deadlines across loan facilities.

## Purpose

The Compliance Tracker enables financial institutions to:
- Track covenant tests and compliance obligations
- Monitor headroom and predict potential breaches
- Manage compliance calendars with automated reminders
- Benchmark covenants against market standards
- Visualize covenant correlations across facilities

## Component Hierarchy

```
compliance/
├── page.tsx                    → Main dashboard (imports CompliancePage)
├── facilities/
│   ├── page.tsx               → Facilities list
│   └── [id]/page.tsx          → Facility detail view
├── calendar/page.tsx          → Obligation calendar
├── covenants/page.tsx         → Covenant tracking & tests
├── benchmarks/page.tsx        → Market benchmark comparison
├── automated-calendar/page.tsx → Smart reminders & sync
├── live-testing/page.tsx      → Real-time covenant monitoring
├── covenant-network/page.tsx  → Cross-facility correlations
├── headroom-exchange/page.tsx → Trade covenant flexibility
├── agent/page.tsx             → AI compliance assistant
├── autopilot/page.tsx         → Predictive breach detection
└── simulation/page.tsx        → Scenario simulations
```

## Feature Components (src/app/features/compliance/)

```
features/compliance/
├── CompliancePage.tsx         → Main dashboard component
├── components/
│   ├── ComplianceStatsBar.tsx → Summary statistics bar
│   ├── ComplianceFiltersBar.tsx → Filter controls
│   ├── GroupedDeadlinesList.tsx → Grouped deadline items
│   ├── FacilityAtRiskCard.tsx  → At-risk facility card
│   ├── ActivityCard.tsx        → Activity feed card
│   ├── FilterPresets.tsx       → Saved filter presets
│   └── ActiveFilterChips.tsx   → Active filter display
├── lib/
│   ├── useFilterPersistence.ts → Filter state persistence
│   ├── entropy.ts              → Entropy calculations
│   ├── entropy-sorting.ts      → Entropy-based sorting
│   ├── covenant-state-machine.ts → Covenant state management
│   ├── correlation-types.ts    → Correlation type definitions
│   ├── correlation-mock-data.ts → Mock correlation data
│   ├── priority-engine-config.ts → Priority scoring config
│   └── document-generation-types.ts → Document generation types
├── sub_Calendar/              → Calendar sub-feature
├── sub_Covenants/             → Covenant tracking sub-feature
│   ├── components/
│   │   ├── BulkImportDialog.tsx → Bulk import wizard
│   │   ├── CovenantSparkline.tsx → Trend sparklines
│   │   ├── BreachPredictionPanel.tsx → AI breach predictions
│   │   ├── HeadroomProgressBar.tsx → Headroom visualization
│   │   └── StateHistoryTimeline.tsx → State change history
│   └── lib/
│       ├── spreadsheet-parser.ts → Excel/CSV parsing
│       ├── covenant-validator.ts → Validation logic
│       └── import-history.ts    → Import tracking
├── sub_FacilityDetail/        → Facility detail sub-feature
├── sub_Benchmarks/            → Benchmark comparison
├── sub_AutomatedCalendar/     → Smart calendar automation
├── sub_LiveTesting/           → Real-time testing
├── sub_CovenantNetwork/       → Network visualization
├── sub_HeadroomExchange/      → Headroom trading
└── sub_DocumentGeneration/    → Compliance document generation
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Routes                                │
│  /api/compliance/facilities     → Facility CRUD                  │
│  /api/compliance/covenants      → Covenant management            │
│  /api/compliance/calendar       → Calendar events                │
│  /api/compliance/predictions    → AI breach predictions          │
│  /api/compliance/autopilot      → Automated actions              │
│  /api/compliance/simulation     → Scenario simulations           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     LLM Integration                              │
│  src/lib/llm/compliance.ts      → Compliance analysis            │
│  src/lib/llm/compliance-agent.ts → AI assistant                  │
│  src/lib/llm/autopilot-*.ts     → Predictive automation          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Feature Components                             │
│  Mock Data → Components → Local State → UI Rendering             │
│  (lib/mock-data.ts → CompliancePage.tsx → useState → JSX)        │
└─────────────────────────────────────────────────────────────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| `features/compliance/index.ts` | Barrel exports for all compliance features |
| `features/compliance/CompliancePage.tsx` | Main dashboard with stats, deadlines, activity |
| `features/compliance/lib/covenant-state-machine.ts` | State transitions for covenants |
| `lib/llm/compliance.ts` | LLM prompts for compliance analysis |
| `lib/validations/compliance.ts` | Zod schemas for compliance data |

## Integration Points

- **Documents Module**: Sync obligations from parsed documents
- **Deals Module**: Import covenant terms from negotiated deals
- **ESG Module**: Track ESG-related compliance requirements
- **Trading Module**: Due diligence compliance checks

## Sub-Feature Connections

```
                    ┌─────────────────┐
                    │  CompliancePage │
                    │   (Dashboard)   │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Calendar    │◄──│   Covenants   │──►│   Facilities  │
│   Events      │   │   Tracking    │   │   Management  │
└───────────────┘   └───────┬───────┘   └───────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Benchmarks  │   │  Covenant     │   │   Headroom    │
│   Network     │   │   Network     │   │   Exchange    │
└───────────────┘   └───────────────┘   └───────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  Autopilot    │
                    │  (AI Agent)   │
                    └───────────────┘
```

## Key Patterns

- **State Machine**: Covenant states (compliant, warning, breach) managed via state machine
- **Entropy Sorting**: Smart sorting based on information entropy
- **Filter Persistence**: URL-based filter state for shareability
- **Bulk Import**: Multi-step wizard for spreadsheet imports
- **Real-time Testing**: Live covenant monitoring with WebSocket-like updates
