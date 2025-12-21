# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev      # Start development server (Next.js)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
npm run test     # Run tests in watch mode (Vitest)
npm run test:run # Run tests once
```

## Architecture Overview

**LoanOS** is a loan lifecycle management platform built with Next.js 16 (App Router) that uses AI to help financial institutions manage loan documents, negotiate deals, track compliance, perform trade due diligence, and monitor ESG performance.

### Tech Stack
- **Framework**: Next.js 16 with App Router
- **Database**: Supabase (PostgreSQL + Auth)
- **LLM**: Anthropic Claude API (claude-sonnet-4-20250514)
- **UI**: Tailwind CSS 4 + Radix UI primitives
- **State**: Zustand + React Query
- **Validation**: Zod v4
- **Document parsing**: pdf-parse, mammoth (DOCX)

### Project Structure

```
src/
├── app/
│   ├── (auth)/          # Auth routes (login, register)
│   ├── (platform)/      # Protected platform routes
│   │   ├── dashboard/   # Platform overview
│   │   ├── documents/   # Document Intelligence Hub
│   │   ├── deals/       # Deal Room (negotiation)
│   │   ├── compliance/  # Compliance Tracker
│   │   ├── trading/     # Trade Due Diligence
│   │   └── esg/         # ESG Performance Dashboard
│   └── api/             # API route handlers
├── components/
│   ├── ui/              # Reusable UI primitives (shadcn-style)
│   ├── layout/          # Shell, header, sidebar
│   ├── documents/       # Document-specific components
│   └── deals/           # Deal-specific components
├── lib/
│   ├── llm/             # LLM client and domain-specific prompts
│   │   ├── client.ts    # Anthropic client wrapper (generateCompletion, generateStructuredOutput)
│   │   └── *.ts         # Domain modules: extraction, query, negotiation, compliance, trading, esg, amendment, similarity, risk-scoring, covenant-extraction, document-lifecycle, risk-detection
│   ├── supabase/        # Database client (client.ts, server.ts, middleware.ts)
│   ├── validations/     # Zod schemas per module
│   └── utils/           # cn() helper, formatters, animation utilities
└── types/
    ├── database.ts      # Supabase generated types
    └── index.ts         # Application-level types
```

### Five Core Modules

1. **Document Intelligence Hub** (`/documents`) - Upload, extract, compare loan documents
2. **Deal Room** (`/deals`) - Multi-party term negotiation with proposals/comments
3. **Compliance Tracker** (`/compliance`) - Obligations, covenants, calendar, waivers
4. **Trade Due Diligence** (`/trading`) - Secondary market trade lifecycle, DD checklists
5. **ESG Dashboard** (`/esg`) - KPIs, targets, ratings, use of proceeds tracking

### Key Patterns

- **API Routes**: All in `src/app/api/`, RESTful with nested dynamic segments
- **LLM Integration**: Use `generateCompletion()` or `generateStructuredOutput<T>()` from `@/lib/llm`
- **Database Access**: Server-side uses `createClient()` from `@/lib/supabase/server`
- **Path alias**: `@/*` maps to `./src/*`
- **Component exports**: Each component folder has an `index.ts` barrel export

### Environment Variables Required

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
ANTHROPIC_API_KEY
```
