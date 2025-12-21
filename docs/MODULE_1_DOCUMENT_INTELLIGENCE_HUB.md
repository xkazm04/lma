# Module 1: Document Intelligence Hub + Platform Landing Page

## Overview

This is the foundational module of LoanOS. It serves two purposes:
1. Platform entry point with landing page introducing all modules
2. Core document processing engine that extracts structured data from loan agreements

This module feeds data to ALL other modules - it is the "source of truth" for loan document content.

---

## Part A: Landing Page & Platform Shell

### A1. Purpose

Provide a professional entry point that:
- Introduces LoanOS and its value proposition to non-technical banking professionals
- Provides clear navigation to each module
- Shows platform-wide statistics and recent activity
- Handles authentication and user management

### A2. User Roles

```
ROLES:
- admin: Full access to all modules, user management, system settings
- lender: Access to all modules, can create/edit loans they're party to
- borrower: Limited access - own loans only, compliance submission, ESG reporting
- viewer: Read-only access to assigned loans
```

### A3. Authentication Flow

```
AUTHENTICATION:
- Provider: Supabase Auth
- Methods: Email/password, Magic link
- Session: JWT stored in httpOnly cookie
- Row Level Security: All tables filtered by organization_id and user permissions
```

### A4. Platform Shell Components

```
SHELL_STRUCTURE:
├── Top Navigation Bar
│   ├── Logo + Platform Name
│   ├── Global Search (searches across all modules)
│   ├── Notifications Bell (aggregated from all modules)
│   └── User Menu (profile, settings, logout)
│
├── Side Navigation
│   ├── Dashboard (landing/home)
│   ├── Document Intelligence Hub
│   ├── Deal Room
│   ├── Compliance Tracker
│   ├── Trade Due Diligence
│   ├── ESG Dashboard
│   └── Settings
│
└── Main Content Area (module-specific)
```

### A5. Dashboard/Landing Page Data

```
DASHBOARD_SECTIONS:

1. Quick Stats Cards:
   - Total Active Loans
   - Documents Processed (this month)
   - Upcoming Compliance Deadlines (next 30 days)
   - Open Negotiations
   - ESG Targets At Risk

2. Recent Activity Feed:
   - Aggregated from all modules
   - Types: document_uploaded, term_changed, compliance_due, trade_initiated, esg_update
   - Show: timestamp, action, loan_reference, user

3. Upcoming Deadlines:
   - Combined view from Compliance + ESG modules
   - Sortable by date, loan, type
   - Quick action buttons

4. Module Quick Access:
   - Card for each module with:
     - Brief description
     - Key metric
     - "Open Module" CTA
```

---

## Part B: Document Intelligence Hub

### B1. Purpose

Transform unstructured loan documents (PDF, DOCX) into structured, queryable data. This is the AI-powered core of the platform.

### B2. Core Workflows

#### Workflow 1: Document Upload & Processing

```
UPLOAD_FLOW:
1. User uploads document(s)
   - Accepted formats: PDF, DOCX, DOC
   - Max size: 50MB per file
   - Batch upload supported

2. Document Preprocessing
   - Extract raw text (pdf-parse for PDF, mammoth for DOCX)
   - Preserve page numbers and structure markers
   - Store original file in Supabase Storage

3. AI Extraction Pipeline
   - Chunk document into processable segments
   - Send to LLM with structured extraction prompt
   - Parse LLM response into data schema
   - Confidence scoring for each extracted field

4. Human Review Queue
   - Flag low-confidence extractions
   - UI for manual verification/correction
   - Corrections improve future extractions (feedback loop)

5. Data Storage
   - Store structured data in Supabase
   - Link to original document
   - Version tracking for re-extractions
```

#### Workflow 2: Document Comparison

```
COMPARISON_FLOW:
1. User selects two documents (or two versions)
2. System aligns extracted data fields
3. Generate diff report:
   - Added terms
   - Removed terms
   - Changed values (with before/after)
4. Highlight "cascade impact" - other clauses affected by changes
5. Export comparison report
```

#### Workflow 3: Query Interface

```
QUERY_FLOW:
1. User asks natural language question about loan(s)
   - "What is the interest margin for Loan ABC?"
   - "Which loans have leverage covenant above 4.0x?"
   - "List all loans with ESG margin ratchets"

2. System determines:
   - Is this answerable from structured data? → Direct DB query
   - Needs document context? → RAG retrieval + LLM

3. Return answer with:
   - Direct answer
   - Source reference (document, page, clause)
   - Confidence level
```

### B3. Data Extraction Schema

```
LOAN_AGREEMENT_SCHEMA:

loan_document {
  id: uuid (primary key)
  organization_id: uuid (foreign key)
  uploaded_by: uuid (foreign key to users)
  uploaded_at: timestamp
  original_filename: string
  storage_path: string
  document_type: enum [facility_agreement, amendment, consent, assignment, other]
  processing_status: enum [pending, processing, completed, failed, review_required]
  extraction_version: integer
  raw_text: text
  page_count: integer
  created_at: timestamp
  updated_at: timestamp
}

loan_facility {
  id: uuid (primary key)
  organization_id: uuid
  source_document_id: uuid (foreign key)
  
  -- Identification
  facility_name: string
  facility_reference: string
  execution_date: date
  effective_date: date
  maturity_date: date
  
  -- Parties (stored as JSONB for flexibility)
  borrowers: jsonb  -- [{name, jurisdiction, role}]
  guarantors: jsonb
  lenders: jsonb    -- [{name, commitment_amount, percentage}]
  agents: jsonb     -- [{name, role: facility_agent|security_agent|etc}]
  
  -- Financial Terms
  facility_type: enum [term, revolving, delayed_draw, swingline, other]
  currency: string
  total_commitments: decimal
  
  -- Interest
  interest_rate_type: enum [floating, fixed, hybrid]
  base_rate: string  -- e.g., "SOFR", "EURIBOR", "SONIA"
  margin_initial: decimal
  margin_grid: jsonb  -- [{threshold, margin}] for margin ratchets
  
  -- Fees
  commitment_fee: decimal
  utilization_fee: jsonb
  arrangement_fee: decimal
  
  -- Metadata
  governing_law: string
  jurisdiction: string
  syndicated: boolean
  
  extraction_confidence: decimal  -- 0.0 to 1.0
  created_at: timestamp
  updated_at: timestamp
}

financial_covenant {
  id: uuid (primary key)
  facility_id: uuid (foreign key)
  source_document_id: uuid
  
  covenant_type: enum [
    leverage_ratio,
    interest_coverage,
    debt_service_coverage,
    net_worth,
    current_ratio,
    capex_limit,
    other
  ]
  covenant_name: string  -- as stated in document
  
  -- Definition
  numerator_definition: text
  denominator_definition: text
  calculation_methodology: text
  
  -- Threshold
  threshold_type: enum [maximum, minimum, range]
  threshold_value: decimal
  threshold_schedule: jsonb  -- [{effective_date, value}] if changes over time
  
  -- Testing
  testing_frequency: enum [quarterly, semi_annual, annual]
  testing_dates: jsonb
  cure_rights: text
  
  -- Source
  clause_reference: string  -- e.g., "Section 20.1(a)"
  page_number: integer
  raw_text: text
  
  extraction_confidence: decimal
  created_at: timestamp
}

reporting_obligation {
  id: uuid (primary key)
  facility_id: uuid (foreign key)
  source_document_id: uuid
  
  obligation_type: enum [
    annual_financials,
    quarterly_financials,
    compliance_certificate,
    budget,
    audit_report,
    event_notice,
    other
  ]
  description: text
  
  -- Timing
  frequency: enum [annual, quarterly, monthly, on_occurrence, other]
  deadline_days: integer  -- days after period end
  deadline_description: text
  
  -- Recipient
  recipient_role: string  -- e.g., "Agent", "All Lenders"
  
  -- Source
  clause_reference: string
  page_number: integer
  raw_text: text
  
  extraction_confidence: decimal
  created_at: timestamp
}

event_of_default {
  id: uuid (primary key)
  facility_id: uuid (foreign key)
  source_document_id: uuid
  
  event_category: enum [
    payment_default,
    covenant_breach,
    representation_breach,
    cross_default,
    insolvency,
    material_adverse_change,
    change_of_control,
    other
  ]
  description: text
  
  -- Grace/Cure
  grace_period_days: integer
  cure_rights: text
  
  -- Consequences
  consequences: text
  
  -- Source
  clause_reference: string
  page_number: integer
  raw_text: text
  
  extraction_confidence: decimal
  created_at: timestamp
}

esg_provision {
  id: uuid (primary key)
  facility_id: uuid (foreign key)
  source_document_id: uuid
  
  provision_type: enum [
    sustainability_linked_margin,
    green_use_of_proceeds,
    esg_reporting,
    esg_covenant,
    other
  ]
  
  -- For sustainability-linked
  kpi_name: string
  kpi_definition: text
  kpi_baseline: decimal
  kpi_targets: jsonb  -- [{date, target_value, margin_adjustment}]
  verification_required: boolean
  verifier_requirements: text
  
  -- Source
  clause_reference: string
  page_number: integer
  raw_text: text
  
  extraction_confidence: decimal
  created_at: timestamp
}

defined_term {
  id: uuid (primary key)
  facility_id: uuid (foreign key)
  source_document_id: uuid
  
  term: string
  definition: text
  clause_reference: string
  page_number: integer
  
  -- Cross-references
  references_terms: text[]  -- other defined terms used in this definition
  
  created_at: timestamp
}
```

### B4. LLM Integration

```
LLM_CONFIGURATION:
  provider: Anthropic Claude API
  model: claude-sonnet-4-20250514 (for extraction)
  
EXTRACTION_STRATEGY:
  1. Document Chunking:
     - Chunk by logical sections where possible
     - Max chunk size: 100,000 tokens
     - Overlap: 500 tokens between chunks
     
  2. Extraction Prompts:
     - Use structured output format (JSON)
     - Include schema definitions in prompt
     - Request confidence scores
     - Ask for source page/clause references
     
  3. Multi-pass Extraction:
     - Pass 1: Extract facility-level data
     - Pass 2: Extract covenants
     - Pass 3: Extract obligations & events of default
     - Pass 4: Extract ESG provisions
     - Pass 5: Extract defined terms
     
  4. Validation:
     - Cross-check extracted dates for consistency
     - Verify numerical values (e.g., lender commitments sum to total)
     - Flag contradictions for human review

QUERY_STRATEGY:
  - Maintain vector embeddings of document chunks
  - Store embeddings in Supabase pgvector
  - RAG retrieval for context-dependent queries
  - Hybrid: structured DB queries + RAG for complex questions
```

### B5. API Endpoints

```
ENDPOINTS:

# Document Management
POST   /api/documents/upload
GET    /api/documents
GET    /api/documents/:id
DELETE /api/documents/:id
POST   /api/documents/:id/reprocess

# Extraction Results
GET    /api/documents/:id/extraction
PUT    /api/documents/:id/extraction  (manual corrections)
GET    /api/documents/:id/extraction/confidence-report

# Facilities (extracted loan data)
GET    /api/facilities
GET    /api/facilities/:id
GET    /api/facilities/:id/covenants
GET    /api/facilities/:id/obligations
GET    /api/facilities/:id/esg-provisions
GET    /api/facilities/:id/defined-terms

# Comparison
POST   /api/documents/compare
  body: { document_id_1, document_id_2 }
  returns: { differences[], impact_analysis }

# Query
POST   /api/query
  body: { question, facility_ids?: [], include_sources: boolean }
  returns: { answer, sources[], confidence }

# Search
GET    /api/search?q={query}&type={facilities|covenants|terms}
```

### B6. Integration Points (Other Modules)

```
PROVIDES_TO_OTHER_MODULES:

→ Deal Room:
  - Base facility data for negotiation tracking
  - Defined terms dictionary
  - Document version history
  
→ Compliance Tracker:
  - Reporting obligations with deadlines
  - Financial covenant definitions and thresholds
  - Event notification requirements
  
→ Trade Due Diligence:
  - Complete facility data for buyer review
  - Document repository access
  - Query interface for due diligence questions
  
→ ESG Dashboard:
  - ESG provisions and KPIs
  - Sustainability-linked margin ratchets
  - Reporting requirements
```

### B7. Background Jobs

```
BACKGROUND_JOBS:

1. document_processing_queue
   - Triggered: On document upload
   - Action: Run extraction pipeline
   - Timeout: 10 minutes
   - Retries: 3
   
2. reextraction_job
   - Triggered: Manual or on schema update
   - Action: Re-run extraction on existing documents
   
3. embedding_generation
   - Triggered: After extraction complete
   - Action: Generate vector embeddings for RAG
   
4. consistency_check
   - Triggered: Daily
   - Action: Verify cross-document consistency for same facility
```

---

## Technical Implementation Notes

### NextJS Structure

```
app/
├── (auth)/
│   ├── login/
│   └── register/
├── (platform)/
│   ├── layout.tsx          # Platform shell with navigation
│   ├── dashboard/
│   │   └── page.tsx        # Landing page
│   └── documents/
│       ├── page.tsx        # Document list
│       ├── upload/
│       │   └── page.tsx    # Upload interface
│       ├── [id]/
│       │   ├── page.tsx    # Document detail
│       │   └── extraction/
│       │       └── page.tsx # Extraction review
│       └── compare/
│           └── page.tsx    # Comparison tool
├── api/
│   ├── documents/
│   ├── facilities/
│   ├── query/
│   └── search/
```

### Supabase Configuration

```
STORAGE_BUCKETS:
- loan-documents (private, 50MB max)

ROW_LEVEL_SECURITY:
- All tables filtered by organization_id
- Document access based on facility assignments

REALTIME:
- Enable for document processing_status updates
- Enable for extraction progress

DATABASE_FUNCTIONS:
- search_facilities(query text) - Full text search
- calculate_extraction_confidence(document_id uuid) - Aggregate confidence
```

### Error Handling

```
ERROR_SCENARIOS:

1. Document Processing Failure:
   - Store error message
   - Set status to 'failed'
   - Notify user
   - Allow retry

2. Low Confidence Extraction:
   - Set status to 'review_required'
   - Queue for human review
   - Highlight uncertain fields

3. LLM API Errors:
   - Retry with exponential backoff
   - Fall back to partial extraction
   - Log for monitoring
```

---

## Success Criteria

1. Upload a 400-page loan agreement and receive structured data within 5 minutes
2. Extraction accuracy >90% for standard LMA-format documents
3. Query response time <3 seconds for structured data questions
4. Comparison report generation <30 seconds
5. Support for 100 concurrent document processing jobs
