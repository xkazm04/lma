# LoanOS Platform - Overall Architecture & Integration Guide

## Platform Vision

LoanOS is a unified loan lifecycle management platform that transforms how financial institutions originate, document, trade, and manage loans. By connecting five specialized modules through a shared data layer, it eliminates silos and provides unprecedented visibility across the loan lifecycle.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LoanOS Platform                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     NextJS Application Layer                         │   │
│  │  ┌──────────┬──────────┬──────────┬──────────┬──────────┐          │   │
│  │  │  Module  │  Module  │  Module  │  Module  │  Module  │          │   │
│  │  │    1     │    2     │    3     │    4     │    5     │          │   │
│  │  │ Document │  Deal    │Compliance│  Trade   │   ESG    │          │   │
│  │  │   Hub    │  Room    │ Tracker  │   D.D.   │Dashboard │          │   │
│  │  └────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┘          │   │
│  │       │          │          │          │          │                 │   │
│  │       └──────────┴──────────┴──────────┴──────────┘                 │   │
│  │                            │                                        │   │
│  │  ┌─────────────────────────┴─────────────────────────────────────┐ │   │
│  │  │                   Shared Services Layer                        │ │   │
│  │  │  ┌──────────────┬──────────────┬──────────────┬─────────────┐ │ │   │
│  │  │  │     Auth     │Notifications │   Search     │  File Mgmt  │ │ │   │
│  │  │  └──────────────┴──────────────┴──────────────┴─────────────┘ │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────┴────────────────────────────────────┐  │
│  │                        API Layer (NextJS API Routes)                  │  │
│  └─────────────────────────────────┬────────────────────────────────────┘  │
│                                    │                                        │
│  ┌─────────────────────────────────┴────────────────────────────────────┐  │
│  │                          Supabase Backend                             │  │
│  │  ┌────────────┬────────────┬────────────┬────────────┬────────────┐  │  │
│  │  │ PostgreSQL │   Auth     │  Storage   │  Realtime  │  Edge Fn   │  │  │
│  │  │ + pgvector │            │            │            │            │  │  │
│  │  └────────────┴────────────┴────────────┴────────────┴────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│  ┌─────────────────────────────────┴────────────────────────────────────┐  │
│  │                        External Services                              │  │
│  │  ┌────────────────┬────────────────┬────────────────┐                │  │
│  │  │  Claude API    │  Email Service │  Future: KYC,  │                │  │
│  │  │  (LLM)         │  (Resend/etc)  │  Trading APIs  │                │  │
│  │  └────────────────┴────────────────┴────────────────┘                │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
```
FRONTEND_STACK:
  Framework: NextJS 14+ (App Router)
  Language: TypeScript
  Styling: Tailwind CSS
  UI Components: shadcn/ui (customized)
  State Management: React Query (server state) + Zustand (client state)
  Forms: React Hook Form + Zod validation
  Charts: Recharts
  Tables: TanStack Table
  Real-time: Supabase Realtime subscriptions
```

### Backend
```
BACKEND_STACK:
  API: NextJS API Routes (Route Handlers)
  Database: Supabase PostgreSQL
  Vector DB: pgvector (for RAG)
  File Storage: Supabase Storage
  Authentication: Supabase Auth
  Real-time: Supabase Realtime
  Background Jobs: Supabase Edge Functions + pg_cron
```

### AI/LLM
```
AI_STACK:
  Primary LLM: Claude API (Anthropic)
  Embeddings: Claude or OpenAI embeddings
  RAG: Custom implementation with pgvector
  Document Processing: pdf-parse, mammoth
```

### DevOps
```
DEVOPS_STACK:
  Hosting: Vercel (NextJS) + Supabase Cloud
  CI/CD: GitHub Actions
  Monitoring: Vercel Analytics + Sentry
  Logging: Supabase Logs + custom logging
```

---

## Database Design Principles

### Multi-tenancy
```
MULTI_TENANCY:
  Approach: Shared database, row-level security
  
  Every table includes:
    - organization_id: uuid (required)
    - created_at: timestamp
    - updated_at: timestamp
  
  Row Level Security (RLS):
    - All queries filtered by organization_id
    - User's organization_id from JWT claims
    - No cross-organization data access possible
```

### Foreign Key Strategy
```
FK_STRATEGY:
  Cross-module references use UUIDs
  
  Pattern:
    source_facility_id → Document Hub facility
    compliance_facility_id → Compliance Tracker facility
    
  Soft links:
    - FK constraints within module
    - Soft references across modules (UUID stored, no FK constraint)
    - Allows independent module deployment/scaling
```

### Audit Trail
```
AUDIT_STRATEGY:
  Approach: Event sourcing for key entities
  
  Tables:
    - {entity}_history for temporal data
    - {module}_activity for user actions
    
  Captured:
    - Who (user_id, organization_id)
    - What (action, old_value, new_value)
    - When (timestamp)
    - Context (related entities, notes)
```

---

## Module Integration Map

```
DATA_FLOW_MAP:

Module 1 (Document Hub) ──┬──→ Module 2 (Deal Room)
    │                     │       - Base terms for negotiation
    │                     │       - Defined terms dictionary
    │                     │
    │                     ├──→ Module 3 (Compliance)
    │                     │       - Reporting obligations
    │                     │       - Covenant definitions
    │                     │       - Event notification triggers
    │                     │
    │                     ├──→ Module 4 (Trade DD)
    │                     │       - Facility data
    │                     │       - Document repository
    │                     │       - Query interface
    │                     │
    │                     └──→ Module 5 (ESG)
    │                             - ESG provisions
    │                             - KPI definitions
    │                             - Reporting requirements


Module 2 (Deal Room) ─────┬──→ Module 3 (Compliance)
                          │       - Closed deals create facilities
                          │       - Agreed terms initialize tracking
                          │
                          └──→ Module 5 (ESG)
                                  - Agreed ESG terms
                                  - KPI targets


Module 3 (Compliance) ────┬──→ Module 4 (Trade DD)
                          │       - Compliance history
                          │       - Covenant test results
                          │       - Waiver history
                          │
                          └──→ Module 5 (ESG)
                                  - ESG report deadlines
                                  - Shared compliance events


Module 5 (ESG) ───────────→ Module 4 (Trade DD)
                                - ESG performance for DD
                                - Verification status
                                - Rating information
```

---

## Shared Data Entities

```
SHARED_ENTITIES:

organization {
  id: uuid
  name: string
  type: enum [bank, borrower, law_firm, agent, other]
  settings: jsonb
  created_at: timestamp
}

user {
  id: uuid (matches Supabase auth.users)
  organization_id: uuid
  email: string
  full_name: string
  role: enum [admin, manager, user, viewer]
  preferences: jsonb
  created_at: timestamp
}

# Core facility - source of truth
facility {
  id: uuid
  organization_id: uuid
  facility_name: string
  facility_reference: string
  borrower_name: string
  maturity_date: date
  status: enum [active, closed, defaulted]
  created_at: timestamp
}

# Cross-module notifications
notification {
  id: uuid
  organization_id: uuid
  user_id: uuid
  
  source_module: enum [documents, deals, compliance, trading, esg]
  notification_type: string
  title: string
  message: text
  
  related_entity_type: string
  related_entity_id: uuid
  action_url: string
  
  is_read: boolean
  read_at: timestamp
  
  created_at: timestamp
}

# Cross-module activity feed
activity {
  id: uuid
  organization_id: uuid
  
  source_module: enum [documents, deals, compliance, trading, esg]
  activity_type: string
  actor_id: uuid
  
  entity_type: string
  entity_id: uuid
  entity_name: string
  
  description: text
  details: jsonb
  
  created_at: timestamp
}
```

---

## API Design Standards

### Route Structure
```
API_ROUTES:
  Pattern: /api/{module}/{resource}/{action}
  
  Examples:
    /api/documents/upload
    /api/documents/[id]
    /api/documents/[id]/extraction
    /api/deals/[id]/terms/[tid]/proposals
    /api/compliance/facilities/[id]/covenants
    /api/trading/trades/[id]/checklist
    /api/esg/kpis/[kid]/performance

  Shared routes:
    /api/auth/*
    /api/users/*
    /api/notifications/*
    /api/search/*
```

### Response Format
```
API_RESPONSE:
  Success:
    {
      success: true,
      data: { ... },
      meta: { pagination, timing, etc. }
    }
  
  Error:
    {
      success: false,
      error: {
        code: "ERROR_CODE",
        message: "Human readable message",
        details: { ... }
      }
    }
```

### Authentication
```
AUTH_FLOW:
  1. Client calls Supabase Auth
  2. Receives JWT with claims: { user_id, organization_id, role }
  3. JWT passed in Authorization header
  4. API routes validate JWT via Supabase
  5. RLS policies use claims for filtering
```

---

## LLM Integration Architecture

```
LLM_ARCHITECTURE:

┌────────────────────────────────────────────────────────────────────┐
│                        LLM Service Layer                           │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    Request Router                             │ │
│  │  - Determines request type                                    │ │
│  │  - Selects appropriate handler                                │ │
│  │  - Manages rate limiting                                      │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                     │
│  ┌────────────┬──────────────┼──────────────┬────────────────────┐│
│  │            │              │              │                    ││
│  ▼            ▼              ▼              ▼                    ▼│
│ ┌────────┐ ┌────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────┐ │
│ │Extract │ │ Query  │ │ Generate │ │   Analyze    │ │ Suggest  │ │
│ │Handler │ │Handler │ │ Handler  │ │   Handler    │ │ Handler  │ │
│ └────────┘ └────────┘ └──────────┘ └──────────────┘ └──────────┘ │
│     │           │           │             │              │        │
│     └───────────┴───────────┴─────────────┴──────────────┘        │
│                              │                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                     RAG Pipeline                              │ │
│  │  1. Embed query                                               │ │
│  │  2. Vector search (pgvector)                                  │ │
│  │  3. Retrieve relevant chunks                                  │ │
│  │  4. Build context                                             │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                   Claude API Client                           │ │
│  │  - Prompt construction                                        │ │
│  │  - API call with retry                                        │ │
│  │  - Response parsing                                           │ │
│  │  - Error handling                                             │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘

USE_CASES_BY_MODULE:

Module 1 - Document Hub:
  - Document extraction (structured output)
  - Query answering (RAG)
  - Comparison analysis
  
Module 2 - Deal Room:
  - Market standard suggestions
  - Consistency checking
  - Impact explanation
  
Module 3 - Compliance:
  - Event analysis (notification triggers)
  - Notification drafting
  - Compliance Q&A
  
Module 4 - Trade DD:
  - Due diligence Q&A (RAG)
  - Risk summary generation
  - Report generation
  
Module 5 - ESG:
  - KPI definition interpretation
  - Report narrative generation
  - Benchmarking insights
```

---

## File Storage Structure

```
STORAGE_STRUCTURE:

supabase-storage/
├── loan-documents/                    # Module 1
│   └── {organization_id}/
│       └── {document_id}/
│           ├── original.{ext}
│           └── extracted/
│               └── chunks/
│
├── deal-room/                         # Module 2
│   └── {organization_id}/
│       └── {deal_id}/
│           └── exports/
│
├── compliance/                        # Module 3
│   └── {organization_id}/
│       └── {facility_id}/
│           └── {event_id}/
│               └── submissions/
│
├── trading/                           # Module 4
│   └── {organization_id}/
│       └── {trade_id}/
│           ├── dd-documents/
│           └── settlement/
│
└── esg/                               # Module 5
    └── {organization_id}/
        └── {facility_id}/
            ├── kpi-evidence/
            ├── verification-reports/
            └── esg-reports/

ACCESS_CONTROL:
  - All buckets private
  - Signed URLs for downloads
  - RLS policies match database
  - Automatic cleanup for expired temp files
```

---

## Real-time Features

```
REALTIME_SUBSCRIPTIONS:

Module 1 - Document Hub:
  - Document processing status updates
  - Extraction progress
  
Module 2 - Deal Room:
  - Participant presence
  - Term updates
  - New proposals
  - Comments
  
Module 3 - Compliance:
  - Status changes
  - New submissions
  - Deadline alerts
  
Module 4 - Trade DD:
  - Trade status updates
  - DD item verification
  - Q&A responses
  
Module 5 - ESG:
  - Performance submissions
  - Verification updates

IMPLEMENTATION:
  Supabase Realtime with postgres_changes
  
  Client subscription pattern:
    supabase
      .channel('deals:{deal_id}')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'negotiation_term' },
          handleTermUpdate)
      .subscribe()
```

---

## Background Job Architecture

```
BACKGROUND_JOBS:

Using Supabase Edge Functions + pg_cron:

Scheduled Jobs:
  ┌─────────────────────────────────────────────────────────────┐
  │ Job Name                  │ Schedule    │ Module           │
  ├─────────────────────────────────────────────────────────────┤
  │ process_document_queue    │ Every 1 min │ Documents        │
  │ generate_embeddings       │ Every 5 min │ Documents        │
  │ send_compliance_reminders │ Daily 8am   │ Compliance       │
  │ update_overdue_status     │ Hourly      │ Compliance       │
  │ daily_compliance_digest   │ Daily 7am   │ Compliance       │
  │ check_covenant_headroom   │ Daily       │ Compliance       │
  │ sync_esg_deadlines        │ Daily       │ ESG              │
  │ portfolio_esg_summary     │ Daily       │ ESG              │
  │ clean_expired_files       │ Weekly      │ All              │
  └─────────────────────────────────────────────────────────────┘

Event-Driven Jobs (Triggered):
  - Document uploaded → Start extraction pipeline
  - Deal closed → Create compliance facility
  - Extraction complete → Generate embeddings
  - KPI submitted → Check margin adjustment
  - Trade agreed → Generate DD checklist
```

---

## Security Considerations

```
SECURITY_MEASURES:

Authentication:
  - Supabase Auth with email verification
  - Session management via JWT
  - Refresh token rotation
  
Authorization:
  - Row Level Security on all tables
  - Role-based access within organizations
  - Explicit permission checks for cross-org access
  
Data Protection:
  - All data encrypted at rest (Supabase default)
  - TLS for all connections
  - Signed URLs for file access (time-limited)
  - No sensitive data in logs
  
API Security:
  - Rate limiting on all endpoints
  - Input validation with Zod
  - CORS configuration
  - CSRF protection
  
LLM Security:
  - No PII sent to LLM without consent
  - Document content chunked appropriately
  - Response sanitization
```

---

## Development Phases

```
PHASE_1 (Weeks 1-2): Foundation
  □ Supabase project setup
  □ NextJS project scaffolding
  □ Authentication implementation
  □ Basic UI shell and navigation
  □ Database schema (shared entities)
  
PHASE_2 (Weeks 2-3): Module 1 - Document Hub
  □ Document upload and storage
  □ Extraction pipeline (LLM integration)
  □ Basic query interface
  □ Facility data model
  
PHASE_3 (Weeks 3-4): Module 3 - Compliance Tracker
  □ Compliance data model
  □ Calendar and deadline management
  □ Covenant tracking
  □ Reminder system
  
PHASE_4 (Week 4): Module 5 - ESG Dashboard
  □ ESG data model
  □ KPI tracking
  □ Performance visualization
  □ Basic reporting
  
PHASE_5 (Week 5): Module 2 - Deal Room
  □ Deal and term data model
  □ Real-time collaboration
  □ Proposal workflow
  □ Export functionality
  
PHASE_6 (Week 5-6): Module 4 - Trade DD
  □ Trade workflow
  □ Checklist generation
  □ DD automation
  □ Settlement tracking
  
PHASE_7 (Week 6): Integration & Polish
  □ Cross-module data flows
  □ Dashboard aggregations
  □ Performance optimization
  □ Testing and bug fixes
```

---

## Key Files to Create

```
PROJECT_STRUCTURE:

loanos/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (platform)/
│   │   ├── layout.tsx               # Shell with navigation
│   │   ├── dashboard/page.tsx       # Landing page
│   │   ├── documents/               # Module 1 pages
│   │   ├── deals/                   # Module 2 pages
│   │   ├── compliance/              # Module 3 pages
│   │   ├── trading/                 # Module 4 pages
│   │   ├── esg/                     # Module 5 pages
│   │   └── settings/
│   └── api/
│       ├── documents/
│       ├── deals/
│       ├── compliance/
│       ├── trading/
│       ├── esg/
│       └── shared/
├── components/
│   ├── ui/                          # shadcn components
│   ├── layout/                      # Shell, nav, etc.
│   ├── documents/                   # Module 1 components
│   ├── deals/                       # Module 2 components
│   ├── compliance/                  # Module 3 components
│   ├── trading/                     # Module 4 components
│   └── esg/                         # Module 5 components
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── admin.ts
│   ├── llm/
│   │   ├── client.ts
│   │   ├── extraction.ts
│   │   ├── query.ts
│   │   └── generation.ts
│   ├── utils/
│   └── validations/
├── types/
│   ├── database.ts                  # Generated from Supabase
│   └── index.ts
├── supabase/
│   ├── migrations/
│   └── functions/
└── public/
```

---

## Quick Reference: Starting Points

For Claude Code to begin implementation:

1. **Start with Module 1 requirement file** - It contains the landing page and core document extraction that all other modules depend on.

2. **Database migrations first** - Create Supabase migrations for shared entities, then module-specific tables.

3. **Authentication scaffold** - Get Supabase Auth working before module features.

4. **LLM integration early** - Set up Claude API client as it's used throughout.

5. **Build incrementally** - Each module can be developed with stub integrations to other modules, then connected.

Refer to individual MODULE_*.md files for detailed specifications of each module.
