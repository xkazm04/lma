# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev          # Start development server (Next.js)
npm run build        # Production build
npm run lint         # Run ESLint
npm run test         # Run tests in watch mode (Vitest)
npm run test:run     # Run tests once
npm run test:e2e     # Run Playwright E2E tests
npm run test:e2e:ui  # Run E2E tests with Playwright UI
```

### Running a Single Test

```bash
# Vitest - run single test file
npx vitest run src/lib/llm/client.test.ts

# Vitest - run tests matching a pattern
npx vitest run --grep "parseJSON"

# Playwright - run single E2E test
npx playwright test e2e/deal-status-filter-roundtrip.spec.ts
```

### Generating New API Routes

```bash
# Generate API route with Supabase integration
npm run generate:api -- --name invoices --methods GET,POST --supabase

# Generate LLM-powered endpoint
npm run generate:api -- --name analysis --methods POST --llm

# Generate dynamic route with both
npm run generate:api -- --name documents/[id]/analyze --methods POST --supabase --llm
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
- **Testing**: Vitest (unit), Playwright (E2E)
- **Document parsing**: pdf-parse, mammoth (DOCX)

### Project Structure

```
src/
├── app/
│   ├── (auth)/           # Auth routes (login, register)
│   ├── (platform)/       # Protected platform routes
│   ├── api/              # API route handlers
│   └── features/         # Feature-specific pages and components
│       ├── documents/    # Document Intelligence Hub
│       ├── deals/        # Deal Room
│       ├── compliance/   # Compliance Tracker
│       ├── trading/      # Trade Due Diligence
│       └── esg/          # ESG Dashboard
├── components/
│   ├── ui/               # Reusable UI primitives (shadcn-style)
│   └── layout/           # Shell, header, sidebar
├── lib/
│   ├── llm/              # LLM client and domain modules
│   ├── supabase/         # Database client (client.ts, server.ts)
│   ├── validations/      # Zod schemas per module
│   └── utils/            # Formatters, response helpers, urgency utils
├── types/
│   └── index.ts          # Application-level types (ApiResponse, etc.)
└── e2e/                  # Playwright E2E tests
```

### Feature Module Structure

Each feature in `src/app/features/` follows this pattern:
```
feature/
├── FeaturePage.tsx           # Main page component
├── components/               # Feature-specific components
├── lib/                      # Feature-specific utilities, stores, types
├── hooks/                    # Feature-specific hooks
└── sub_SubFeature/           # Sub-feature modules (prefixed with sub_)
    ├── index.ts
    └── components/
```

### Key Patterns

#### API Response Helpers
Use standardized response helpers from `@/lib/utils` in all API routes:
```typescript
import { respondSuccess, respondNotFound, respondValidationError } from '@/lib/utils';

// Success with data
return respondSuccess(data);
return respondSuccess(data, { status: 201 });
return respondSuccess(items, { pagination: { page, pageSize, total, totalPages } });

// Errors
return respondUnauthorized();
return respondNotFound('Document not found');
return respondValidationError('Invalid request', parsed.error.flatten());
return respondDatabaseError(error.message);
```

#### LLM Integration
Use wrappers from `@/lib/llm` - never call Anthropic SDK directly:
```typescript
import { generateCompletion, generateStructuredOutput, withLLMFallback } from '@/lib/llm';

// Simple completion
const text = await generateCompletion(systemPrompt, userMessage);

// Structured JSON output (auto-parses response)
const result = await generateStructuredOutput<MyType>(systemPrompt, userMessage);

// With fallback for graceful degradation
const result = await withLLMFallback(
  () => generateStructuredOutput<MyType>(systemPrompt, userMessage),
  context,
  { operation: 'myOperation', fallbackFactory: (ctx) => defaultResult }
);
```

#### Database Access
- Server-side: `createClient()` from `@/lib/supabase/server`
- Auth check pattern: `const { data: { user } } = await supabase.auth.getUser()`

#### Component Exports
Each component folder has an `index.ts` barrel export.

#### Path Alias
`@/*` maps to `./src/*`

### Environment Variables Required

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
ANTHROPIC_API_KEY
```
