# LoanOS

A loan lifecycle management platform built with Next.js 16 (App Router) that uses AI to help financial institutions manage loan documents, negotiate deals, track compliance, and perform trade due diligence.

## Overview

LoanOS provides five core modules to manage the complete loan lifecycle:

| Module | Route | Description |
|--------|-------|-------------|
| **Dashboard** | `/dashboard` | Portfolio-wide analytics with health scoring, risk correlation, and activity tracking |
| **Document Intelligence** | `/documents` | AI-powered document processing, extraction, comparison, and risk detection |
| **Deal Room** | `/deals` | Multi-party term negotiation with real-time collaboration and pipeline management |
| **Compliance Tracker** | `/compliance` | Covenant monitoring, obligation calendar, and predictive breach alerts |
| **Trading** | `/trading` | Secondary market trade lifecycle, DD checklists, and position management |

---

## Module Features

### Dashboard (`/dashboard`)

| Feature | Description |
|---------|-------------|
| Portfolio Health Score | Multi-dimensional health scoring with trend analysis |
| Risk Correlation Engine | Cross-portfolio risk analysis with correlation discovery |
| Recent Activity Feed | Unified activity stream from all platform modules |
| Upcoming Deadlines | Quick view of approaching compliance deadlines |
| Stat Drilldown | Interactive drilldown into loans, documents, and deadlines |

### Document Intelligence Hub (`/documents`)

| Feature | Description |
|---------|-------------|
| Document List | Folder-based organization with status tracking and saved views |
| AI Extraction | Automated extraction of key terms, covenants, and obligations |
| Document Comparison | Side-by-side version comparison with diff highlighting |
| Risk Detection | Proactive risk scanning with category filtering |
| Batch Operations | Multi-document actions for efficient processing |

### Deal Room (`/deals`)

| Feature | Description |
|---------|-------------|
| Deal Pipeline | Multi-view layouts (list, grid, kanban, timeline) |
| Smart Inbox | Priority-based deal triage with action recommendations |
| Status Tracking | Visual deal stage progression with status counts |
| Term Negotiation | Collaborative workspace for multi-party negotiations |
| Deal Intelligence | Market context and competitive analysis |

### Compliance Tracker (`/compliance`)

| Feature | Description |
|---------|-------------|
| Compliance Dashboard | Deadline grouping, facilities at risk, and activity feed |
| Obligation Calendar | Interactive calendar view of all compliance deadlines |
| Covenant Tracking | Test results, headroom monitoring, and trend analysis |
| Predictive Autopilot | Multi-signal breach prediction with remediation suggestions |
| Facility Management | Per-facility compliance status and document tracking |

### Trading (`/trading`)

| Feature | Description |
|---------|-------------|
| Trading Dashboard | Upcoming settlements, recent activity, and portfolio stats |
| Trades Table | Trade lifecycle tracking with DD progress indicators |
| Positions Table | Position book with P&L monitoring and current pricing |
| DD Checklists | Automated due diligence verification workflow |
| Settlement Tracking | Countdown to settlement with alert indicators |

---

## Explore Mode

LoanOS includes a built-in **Explore Mode** that helps users discover features and understand each module:

- **Module Introduction** - Overview text and key highlights for the current page
- **Section Details** - Detailed information about clickable explorable areas
- **Section Sidebar** - Interactive list of all explorable sections on the page

Toggle Explore Mode using the compass button in the header to reveal guided documentation throughout the platform.

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

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Auth routes (login, register)
│   ├── (platform)/       # Protected platform routes
│   ├── api/              # API route handlers
│   └── features/         # Feature-specific pages and components
│       ├── dashboard/    # Portfolio dashboard
│       ├── documents/    # Document Intelligence Hub
│       ├── deals/        # Deal Room
│       ├── compliance/   # Compliance Tracker
│       └── trading/      # Trading module
├── components/
│   ├── ui/               # Reusable UI primitives
│   └── layout/           # Shell, header, sidebar
├── lib/
│   ├── llm/              # LLM client and domain modules
│   ├── supabase/         # Database client
│   ├── demo-guide/       # Explore mode system
│   └── utils/            # Formatters, helpers
└── types/                # Application-level types
```

See [CLAUDE.md](./CLAUDE.md) for detailed development guidelines and architecture documentation.
