# Trade Due Diligence Module

Manage secondary market loan trades with comprehensive due diligence workflows.

## Purpose

The Trading module enables financial institutions to:
- Track loan positions and trading book
- Manage trade lifecycle from inception to settlement
- Conduct due diligence with structured checklists
- Ask AI-powered questions about trade documentation
- Monitor settlement timelines and consent workflows
- Track trade counterparty interactions

## Component Hierarchy

```
trading/
├── page.tsx                    → Trading dashboard (imports page)
├── trades/
│   ├── page.tsx               → Trades list/blotter
│   └── [id]/page.tsx          → Trade detail view
└── positions/page.tsx         → Position book
```

## Feature Components (src/app/features/trading/)

```
features/trading/
├── components/
│   ├── index.ts               → Component exports
│   ├── DashboardStats.tsx     → Dashboard statistics grid
│   ├── TradeCard.tsx          → Trade summary card
│   ├── PositionCard.tsx       → Position summary card
│   ├── UpcomingSettlements.tsx → Settlement timeline
│   └── RecentActivity.tsx     → Activity feed
├── lib/
│   ├── index.ts               → Library exports
│   ├── types.ts               → Trading type definitions
│   ├── fixtures.ts            → Mock fixture data
│   ├── utils.ts               → Utility functions
│   ├── useTradingDashboard.ts → Dashboard data hook
│   └── priority-engine-config.ts → Priority scoring
├── sub_TradeDetail/
│   ├── index.ts               → Detail exports
│   ├── DDChecklist.tsx        → Due diligence checklist
│   ├── QuestionsPanel.tsx     → Q&A panel
│   └── TradeTimeline.tsx      → Trade event timeline
└── index.ts                    → Feature exports
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Routes                                │
│  /api/trading/facilities        → Trading facilities             │
│  /api/trading/positions         → Position management            │
│  /api/trading/trades            → Trade CRUD                     │
│  /api/trading/trades/[id]/checklist → DD checklist               │
│  /api/trading/trades/[id]/questions → Q&A management             │
│  /api/trading/trades/[id]/ai-query  → AI-powered queries         │
│  /api/trading/trades/[id]/settlement → Settlement tracking       │
│  /api/trading/trades/[id]/consent   → Consent workflow           │
│  /api/trading/trades/[id]/events    → Trade events               │
│  /api/trading/dashboard         → Dashboard aggregation          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     LLM Integration                              │
│  src/lib/llm/trading.ts         → Trading analysis prompts       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Feature Components                             │
│  useTradingDashboard → Components → Local State → UI            │
│  (hook → DashboardStats/TradeCard → useState → JSX)              │
└─────────────────────────────────────────────────────────────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| `features/trading/index.ts` | Barrel exports for trading features |
| `(platform)/trading/page.tsx` | Main dashboard with trades and settlements |
| `features/trading/components/DashboardStats.tsx` | Statistics grid |
| `features/trading/sub_TradeDetail/DDChecklist.tsx` | DD checklist UI |
| `features/trading/lib/useTradingDashboard.ts` | Dashboard data hook |
| `lib/llm/trading.ts` | LLM prompts for trade analysis |
| `lib/validations/trading.ts` | Zod schemas for trading data |

## Integration Points

- **Documents Module**: Access loan documents for due diligence
- **Deals Module**: Trade terms from negotiated deals
- **Compliance Module**: Verify compliance before settlement
- **ESG Module**: ESG due diligence requirements

## Sub-Feature Connections

```
                    ┌─────────────────┐
                    │Trading Dashboard│
                    │   (Main Page)   │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Trades      │   │  Positions    │   │  Settlements  │
│   Blotter     │   │    Book       │   │  (Upcoming)   │
└───────┬───────┘   └───────────────┘   └───────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────┐
│                    Trade Detail                        │
└───────────────────────────┬───────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│     DD        │   │   Questions   │   │    Trade      │
│  Checklist    │   │    Panel      │   │   Timeline    │
└───────────────┘   └───────────────┘   └───────────────┘
        │                   │
        ▼                   ▼
┌───────────────┐   ┌───────────────┐
│  Item Review  │   │   AI Query    │
│  & Flagging   │   │   Interface   │
└───────────────┘   └───────────────┘
```

## Key Patterns

- **Trade Lifecycle**: Stages from inquiry → agreed → settling → settled
- **DD Checklist**: Structured checklist items with verification workflow
- **Item States**: pending, verified, flagged, not_applicable
- **Questions Panel**: Q&A thread with AI-assisted answers
- **Settlement Tracking**: Timeline with T+N day calculations
- **Consent Workflow**: Multi-party consent management
- **Activity Feed**: Real-time trade event updates
- **Dashboard Hook**: `useTradingDashboard` for centralized data fetching

## Trade States

```
inquiry → negotiating → agreed → settling → settled
                                    │
                                    ├── consent_pending
                                    └── cancelled
```

## DD Checklist Item States

```
pending → verified
     │
     └── flagged (with comment)
     │
     └── not_applicable (with reason)
```
