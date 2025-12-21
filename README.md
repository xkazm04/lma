# LoanOS

A comprehensive loan lifecycle management platform built with Next.js 16 (App Router) that leverages AI to help financial institutions manage loan documents, negotiate deals, track compliance, perform trade due diligence, and monitor ESG performance.

## Overview

LoanOS provides six core modules to manage the complete loan lifecycle:

| Module | Route | Description |
|--------|-------|-------------|
| **Dashboard** | `/dashboard` | Portfolio-wide analytics with AI-powered autopilot, risk correlation engine, and stakeholder collaboration |
| **Document Intelligence** | `/documents` | AI-powered document processing, extraction, comparison, translation, and risk detection |
| **Deal Room** | `/deals` | Multi-party term negotiation with real-time collaboration and market intelligence |
| **Compliance Tracker** | `/compliance` | Covenant monitoring, obligation calendar, and predictive compliance autopilot |
| **Trade Due Diligence** | `/trading` | Secondary market trade lifecycle, DD checklists, and Q&A management |
| **ESG Dashboard** | `/esg` | Sustainability KPI tracking, AI predictions, portfolio optimization, and governance |

---

## Module Features

### Dashboard (`/dashboard`)

| Feature | Description |
|---------|-------------|
| Portfolio Health Score | Multi-dimensional health scoring with benchmark comparison and trend analysis |
| Portfolio Autopilot | AI-driven predictive management with configurable auto-approval thresholds |
| Action Queue | Confidence-weighted execution queue for pending portfolio actions |
| Risk Correlation Engine | Cross-portfolio risk analysis with correlation discovery |
| Stakeholder Command Center | Real-time team collaboration, activity streams, and counterparty tracking |
| Stat Drilldown | Interactive drilldown into loans, documents, deadlines, negotiations, and ESG metrics |
| 3D Portfolio Landscape | Immersive 3D visualization of borrower correlations |

### Document Intelligence Hub (`/documents`)

| Feature | Description |
|---------|-------------|
| Document List | Folder-based organization with status tracking, saved views, and batch actions |
| AI Extraction | Automated extraction of key terms, covenants, and obligations from loan documents |
| Document Comparison | Side-by-side comparison of document versions with diff highlighting |
| Document Translation | Convert structured data (covenants, obligations, terms) into legal clause language |
| Risk Detection Dashboard | Proactive risk scanning with category/status filtering and export capability |
| Document Evolution Engine | Autonomous monitoring with AI-generated amendment suggestions |
| Portfolio Comparison | Cross-portfolio document analysis |

### Deal Room (`/deals`)

| Feature | Description |
|---------|-------------|
| Deal List | Multi-view layouts (list, grid, kanban, timeline) with Smart Inbox for triage |
| New Deal Wizard | Multi-step deal creation with facility import and participant management |
| Negotiation War Room | Real-time term negotiation with focus mode, live presence, and timeline theater |
| Term Dependencies | Visual dependency graph between negotiation terms |
| Acceleration Alerts | AI-detected negotiation velocity issues with intervention suggestions |
| Term Intelligence | Market context for negotiated terms |
| Market Intelligence | Competitive deal analysis and market benchmarks |
| Calendar Integration | Export deadlines to Google, Outlook, or iCal |

### Compliance Tracker (`/compliance`)

| Feature | Description |
|---------|-------------|
| Compliance Dashboard | Deadline grouping, facilities at risk, and recent activity feed |
| Obligation Calendar | Interactive calendar view of all compliance deadlines |
| Covenant Tracking | Test results, headroom monitoring, and waiver management |
| Predictive Autopilot | 6-12 month breach prediction with multi-signal intelligence (market, transactions, news) |
| Compliance Agent | Natural language AI assistant for compliance tasks and document generation |
| Live Testing | Real-time covenant test monitoring |
| Automated Calendar | Smart reminders with calendar provider sync |
| Headroom Exchange | Trading covenant flexibility across facilities |
| Covenant Network | Cross-facility correlation analysis |
| Benchmark Network | Industry standard comparisons |
| Event Notifications | Regulatory and compliance event monitoring |

### Trade Due Diligence (`/trading`)

| Feature | Description |
|---------|-------------|
| Trading Dashboard | Position book, trade blotter, and settlement overview |
| Trade Detail | Due diligence checklist with category-based verification workflow |
| DD Item Verification | Atomic verification with timeline event creation |
| Q&A Management | Buyer/seller question exchange with response tracking |
| Trade Timeline | Complete event history for audit trail |
| AI Trade Assistant | Natural language queries about trade risks and status |
| Consent Tracking | Consent requirement monitoring and request workflow |
| Settlement Calculator | Trade settlement amount computation |

### ESG Dashboard (`/esg`)

| Feature | Description |
|---------|-------------|
| ESG Overview | Portfolio-wide KPI status, target achievement, and proceeds allocation |
| Facility Management | Individual facility KPI tracking, targets, and reporting |
| AI Performance Predictor | 90-day KPI trajectory forecast with margin impact analysis |
| Facilities at Risk | Identification of facilities with KPIs at risk of missing targets |
| Portfolio Optimizer | ESG mix optimization with what-if scenarios |
| Facility Comparison | Side-by-side facility ESG analysis |
| Use of Proceeds | Sankey visualization of proceeds allocation |
| Governance | Proxy voting signals and ESG governance tracking |
| Decision Support | AI-powered ESG decision recommendations |
| Report Export | PDF/Excel export of ESG dashboards and facility reports |

---

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Database**: Supabase (PostgreSQL + Auth)
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514)
- **UI**: Tailwind CSS 4 + Radix UI primitives
- **State**: Zustand + React Query
- **Validation**: Zod v4
- **Testing**: Vitest (unit), Playwright (E2E)
- **Document Parsing**: pdf-parse, mammoth (DOCX)

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your SUPABASE_URL, SUPABASE_ANON_KEY, and ANTHROPIC_API_KEY

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |

## Development

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint
npm run test     # Run tests in watch mode
npm run test:e2e # Run Playwright E2E tests
```

See [CLAUDE.md](./CLAUDE.md) for detailed development guidelines and architecture documentation.
