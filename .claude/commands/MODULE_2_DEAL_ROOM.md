# Module 2: Deal Room & Negotiation Accelerator

## Overview

A collaborative workspace for negotiating loan terms between lenders and borrowers. Instead of tracking changes across 400-page documents, parties negotiate at the **concept level** - viewing and modifying structured terms with automatic impact analysis.

---

## Core Problem Statement

Traditional loan negotiation involves:
- Dozens of document versions via email
- Legal counsel making tracked changes in Word
- Last-minute changes that cascade through documents
- No clear view of what's actually agreed vs. pending
- Version confusion leading to errors

This module provides a structured, real-time negotiation environment.

---

## User Roles & Permissions

```
DEAL_ROLES:

deal_lead:
  - Create and configure deals
  - Invite participants
  - Lock/unlock terms for negotiation
  - Mark terms as agreed
  - Export final documentation
  
negotiator:
  - Propose term changes
  - Comment on terms
  - Accept/reject proposals (for their party)
  - View all terms and history
  
reviewer:
  - View terms and comments
  - Add comments
  - Cannot propose changes
  
observer:
  - Read-only access
  - Cannot comment

PARTY_TYPES:
- borrower_side: Borrower, Borrower's Counsel
- lender_side: Agent, Lead Arranger, Lender, Lender's Counsel
- third_party: Rating Agency, Auditor, Consultant
```

---

## Data Schema

```
DEAL_SCHEMA:

deal {
  id: uuid (primary key)
  organization_id: uuid
  
  -- Basic Info
  deal_name: string
  deal_reference: string
  deal_type: enum [new_facility, amendment, refinancing, restructuring]
  
  -- Linked Facility (from Document Intelligence Hub)
  base_facility_id: uuid (nullable, foreign key)
  
  -- Status
  status: enum [draft, active, paused, agreed, closed, terminated]
  
  -- Configuration
  negotiation_mode: enum [bilateral, multilateral]
  require_unanimous_consent: boolean
  auto_lock_agreed_terms: boolean
  
  -- Dates
  target_signing_date: date
  target_closing_date: date
  created_at: timestamp
  updated_at: timestamp
  created_by: uuid
}

deal_participant {
  id: uuid
  deal_id: uuid (foreign key)
  user_id: uuid (foreign key)
  
  party_name: string  -- Organization name
  party_type: enum [borrower_side, lender_side, third_party]
  party_role: string  -- e.g., "Borrower", "Agent", "Lead Arranger"
  deal_role: enum [deal_lead, negotiator, reviewer, observer]
  
  can_approve: boolean  -- Can mark terms as agreed for their side
  
  invited_at: timestamp
  joined_at: timestamp
  status: enum [pending, active, removed]
}

term_category {
  id: uuid
  deal_id: uuid (foreign key)
  
  name: string  -- e.g., "Financial Terms", "Covenants", "Conditions Precedent"
  display_order: integer
  
  parent_category_id: uuid (nullable, self-reference for nesting)
}

negotiation_term {
  id: uuid
  deal_id: uuid (foreign key)
  category_id: uuid (foreign key)
  
  -- Identification
  term_key: string  -- Unique identifier, e.g., "interest_margin"
  term_label: string  -- Display name, e.g., "Interest Margin"
  term_description: text  -- Explanation of what this term covers
  
  -- Source (if imported from existing document)
  source_facility_id: uuid (nullable)
  source_clause_reference: string (nullable)
  
  -- Value Type
  value_type: enum [
    text,
    number,
    percentage,
    currency_amount,
    date,
    boolean,
    selection,      -- Single choice from options
    multi_select,   -- Multiple choices from options
    table,          -- Structured data (e.g., margin grid)
    rich_text       -- Longer form text
  ]
  
  -- For selection types
  allowed_values: jsonb  -- [{value, label}]
  
  -- Current State
  current_value: jsonb  -- Flexible to handle all value types
  current_value_text: text  -- Human-readable representation
  
  -- Negotiation State
  negotiation_status: enum [
    not_started,
    proposed,
    under_discussion,
    pending_approval,
    agreed,
    locked
  ]
  
  -- Locking
  is_locked: boolean
  locked_by: uuid
  locked_at: timestamp
  lock_reason: text
  
  -- Dependencies
  depends_on: uuid[]  -- Other term IDs this depends on
  impacts: uuid[]  -- Other term IDs affected by changes to this
  
  display_order: integer
  created_at: timestamp
  updated_at: timestamp
}

term_proposal {
  id: uuid
  term_id: uuid (foreign key)
  deal_id: uuid (foreign key)
  
  -- Proposer
  proposed_by: uuid (foreign key to users)
  proposed_by_party: string
  proposed_at: timestamp
  
  -- Value
  proposed_value: jsonb
  proposed_value_text: text
  
  -- Context
  rationale: text  -- Why this change is proposed
  
  -- Status
  status: enum [pending, accepted, rejected, superseded, withdrawn]
  
  -- Responses
  responses: jsonb  -- [{party, user_id, response: accept|reject|counter, timestamp, comment}]
  
  -- Resolution
  resolved_at: timestamp
  resolved_by: uuid
  resolution_note: text
}

term_comment {
  id: uuid
  term_id: uuid (foreign key)
  deal_id: uuid (foreign key)
  proposal_id: uuid (nullable, foreign key)  -- If comment is on a specific proposal
  
  author_id: uuid (foreign key)
  author_party: string
  
  content: text
  
  -- Threading
  parent_comment_id: uuid (nullable)
  
  -- Status
  is_resolved: boolean
  resolved_by: uuid
  resolved_at: timestamp
  
  created_at: timestamp
  updated_at: timestamp
}

term_history {
  id: uuid
  term_id: uuid (foreign key)
  deal_id: uuid (foreign key)
  
  -- Change Details
  change_type: enum [
    created,
    value_changed,
    status_changed,
    locked,
    unlocked,
    proposal_accepted,
    proposal_rejected
  ]
  
  previous_value: jsonb
  new_value: jsonb
  previous_status: string
  new_status: string
  
  -- Who and When
  changed_by: uuid
  changed_by_party: string
  changed_at: timestamp
  
  -- Context
  change_note: text
  related_proposal_id: uuid (nullable)
}

deal_activity {
  id: uuid
  deal_id: uuid (foreign key)
  
  activity_type: enum [
    deal_created,
    participant_joined,
    participant_removed,
    term_proposed,
    term_agreed,
    term_locked,
    comment_added,
    document_exported,
    status_changed
  ]
  
  actor_id: uuid
  actor_party: string
  
  -- Reference
  term_id: uuid (nullable)
  proposal_id: uuid (nullable)
  comment_id: uuid (nullable)
  
  -- Details
  details: jsonb
  
  created_at: timestamp
}
```

---

## Core Workflows

### Workflow 1: Deal Creation

```
DEAL_CREATION_FLOW:

1. Create New Deal
   - Enter deal name, type, target dates
   - Select negotiation mode (bilateral/multilateral)
   - Configure consent requirements

2. Import Base Terms (Optional)
   - Select existing facility from Document Intelligence Hub
   - System creates negotiation_terms from extracted data
   - Terms linked to source clauses for reference

3. Or Start from Template
   - Select deal type template
   - Pre-populated term categories and common terms
   - Based on LMA standard structures

4. Add Custom Terms
   - Deal lead can add additional terms
   - Define value type and constraints
   - Set dependencies

5. Invite Participants
   - Add by email
   - Assign party and role
   - Set permissions
   - Participants receive invitation
```

### Workflow 2: Term Negotiation

```
NEGOTIATION_FLOW:

1. View Term
   - Current value displayed
   - Source clause reference (if from document)
   - History of changes
   - Active proposals
   - Comments thread

2. Make Proposal
   - Enter new proposed value
   - Provide rationale
   - System validates against constraints
   - System shows impact analysis (affected terms)
   - Submit proposal

3. Proposal Response
   - All relevant parties notified
   - Each party can: Accept, Reject (with reason), Counter-propose
   - Comments can be added

4. Resolution
   - If all required parties accept → Term updated, status = agreed
   - If rejected → Proposer can withdraw or counter
   - If countered → New proposal created, supersedes original

5. Agreement
   - Deal lead marks term as agreed
   - Term locked (if auto-lock enabled)
   - History recorded
```

### Workflow 3: Impact Analysis

```
IMPACT_ANALYSIS_FLOW:

When a term change is proposed:

1. Identify Dependent Terms
   - Query term dependencies
   - Traverse dependency graph

2. Analyze Impact
   - For each dependent term, determine if change affects it
   - Categories:
     - Direct impact: Definition references changed term
     - Calculation impact: Formula uses changed value
     - Threshold impact: Related limits may need adjustment
     - Consistency impact: Related terms may become inconsistent

3. Generate Impact Report
   - List all affected terms
   - Describe nature of impact
   - Recommend review/update

4. Present to Users
   - Show before proposing
   - Require acknowledgment
   - Optionally create linked proposals for affected terms
```

### Workflow 4: Market Standard Suggestions

```
SUGGESTION_FLOW:

Integration with LLM for intelligent suggestions:

1. When editing a term:
   - Analyze term type and context
   - Query LLM for market standard language/values
   - Consider deal type, jurisdiction, facility size

2. Suggestion Types:
   - Value suggestion: "Typical margin for this leverage level is 2.25-2.75%"
   - Language suggestion: "Standard LMA wording for this clause..."
   - Alternative structures: "Consider tiered covenant structure..."

3. Explanation:
   - Each suggestion includes reasoning
   - Reference to market practice
   - Disclaimer: suggestions are informational, not legal advice
```

### Workflow 5: Document Export

```
EXPORT_FLOW:

1. Generate Term Sheet
   - Compile all agreed terms
   - Format as summary document
   - Export as PDF or DOCX

2. Generate Clause Markup
   - For terms linked to source document
   - Show proposed changes vs. original
   - Standard tracked changes format

3. Full Agreement Export
   - If integrated with document generation
   - Populate template with agreed values
   - Mark incomplete sections

4. Audit Trail Export
   - Complete history of negotiations
   - All proposals and responses
   - Timeline of agreement
```

---

## Real-time Collaboration

```
REALTIME_FEATURES:

1. Presence Indicators
   - Show who is currently viewing the deal
   - Show who is viewing each term
   - Typing indicators for comments

2. Live Updates
   - Proposals appear immediately
   - Status changes reflected instantly
   - Comments stream in real-time
   - Using Supabase Realtime subscriptions

3. Notifications
   - In-app notifications for:
     - New proposals on terms you're watching
     - Responses to your proposals
     - Mentions in comments
     - Terms reaching agreed status
   - Email digests (configurable frequency)

4. Conflict Prevention
   - Optimistic locking on term edits
   - Warning if another user is editing same term
   - Automatic merge for non-conflicting changes
```

---

## API Endpoints

```
ENDPOINTS:

# Deals
POST   /api/deals                          # Create deal
GET    /api/deals                          # List deals
GET    /api/deals/:id                      # Get deal details
PUT    /api/deals/:id                      # Update deal settings
DELETE /api/deals/:id                      # Delete/archive deal
POST   /api/deals/:id/import-facility      # Import from Document Hub
PUT    /api/deals/:id/status               # Update deal status

# Participants
POST   /api/deals/:id/participants         # Invite participant
GET    /api/deals/:id/participants         # List participants
PUT    /api/deals/:id/participants/:pid    # Update participant role
DELETE /api/deals/:id/participants/:pid    # Remove participant

# Terms
GET    /api/deals/:id/terms                # Get all terms (with categories)
POST   /api/deals/:id/terms                # Add new term
GET    /api/deals/:id/terms/:tid           # Get term detail
PUT    /api/deals/:id/terms/:tid           # Update term directly (deal_lead only)
DELETE /api/deals/:id/terms/:tid           # Remove term
POST   /api/deals/:id/terms/:tid/lock      # Lock term
POST   /api/deals/:id/terms/:tid/unlock    # Unlock term

# Proposals
POST   /api/deals/:id/terms/:tid/proposals         # Create proposal
GET    /api/deals/:id/terms/:tid/proposals         # Get proposals for term
POST   /api/deals/:id/proposals/:pid/respond       # Accept/reject/counter
POST   /api/deals/:id/proposals/:pid/withdraw      # Withdraw proposal

# Comments
GET    /api/deals/:id/terms/:tid/comments          # Get comments
POST   /api/deals/:id/terms/:tid/comments          # Add comment
PUT    /api/deals/:id/comments/:cid                # Edit comment
POST   /api/deals/:id/comments/:cid/resolve        # Mark resolved

# Impact Analysis
POST   /api/deals/:id/terms/:tid/impact-analysis   # Analyze change impact
  body: { proposed_value }

# Suggestions
POST   /api/deals/:id/terms/:tid/suggest           # Get market suggestions
  body: { context?: string }

# History & Activity
GET    /api/deals/:id/terms/:tid/history           # Term change history
GET    /api/deals/:id/activity                     # Deal activity feed

# Export
POST   /api/deals/:id/export/term-sheet            # Generate term sheet
POST   /api/deals/:id/export/markup                # Generate document markup
POST   /api/deals/:id/export/audit-trail           # Export negotiation history
```

---

## Integration Points

```
INTEGRATIONS:

← FROM Document Intelligence Hub:
  - Import facility data as base terms
  - Link terms to source clause references
  - Access defined terms dictionary for consistency
  - Query interface for background information

→ TO Compliance Tracker:
  - Once deal closed, export agreed terms
  - Create compliance calendar from agreed obligations
  - Initialize covenant tracking with agreed thresholds

→ TO Trade Due Diligence:
  - Expose deal history for trading context
  - Amendments history for facility
  - Negotiation audit trail if relevant

→ TO ESG Dashboard:
  - Export agreed ESG provisions
  - Initialize ESG KPI tracking
  - Set up sustainability-linked margin mechanics
```

---

## Term Templates

```
STANDARD_TERM_TEMPLATES:

facility_terms:
  - Facility Amount
  - Currency
  - Facility Type
  - Availability Period
  - Maturity Date
  - Extension Options

pricing_terms:
  - Interest Rate Base (SOFR/EURIBOR/etc.)
  - Initial Margin
  - Margin Ratchet (table)
  - Default Rate Uplift
  - Commitment Fee
  - Utilization Fee
  - Arrangement Fee
  - Agency Fee

covenant_terms:
  - Leverage Ratio (Max)
  - Interest Coverage (Min)
  - Net Worth (Min)
  - Capex Limit
  - Dividend Restrictions
  - Debt Incurrence Basket

reporting_terms:
  - Annual Financials Deadline
  - Quarterly Financials Deadline
  - Compliance Certificate Timing
  - Budget Delivery
  - Audit Requirements

esg_terms:
  - Sustainability KPIs
  - KPI Targets
  - ESG Margin Adjustment
  - Reporting Requirements
  - Verification Requirements

conditions_precedent:
  - Legal Opinions
  - Board Resolutions
  - Officer's Certificates
  - Financial Statements
  - KYC Documentation
```

---

## LLM Integration

```
LLM_USAGE:

1. Market Standard Suggestions
   Prompt pattern:
   - Context: Deal type, facility size, borrower industry
   - Question: Suggest appropriate [term] value/language
   - Output: Suggested value with market context explanation

2. Consistency Checking
   Prompt pattern:
   - Input: All current term values
   - Question: Identify any inconsistencies or conflicts
   - Output: List of potential issues with explanations

3. Impact Explanation
   Prompt pattern:
   - Input: Term being changed, related terms, definitions
   - Question: Explain how change affects related terms
   - Output: Plain-English impact description

4. Drafting Assistance
   Prompt pattern:
   - Input: Agreed term values
   - Question: Draft clause language for [term]
   - Output: Suggested clause text following LMA conventions
```

---

## Notification Rules

```
NOTIFICATION_CONFIG:

proposal_created:
  - Notify: All negotiators on opposite party
  - Channel: In-app + email
  
proposal_response:
  - Notify: Proposal creator
  - Channel: In-app + email

term_agreed:
  - Notify: All participants
  - Channel: In-app + email

term_locked:
  - Notify: All participants
  - Channel: In-app

comment_added:
  - Notify: Thread participants + mentioned users
  - Channel: In-app

comment_mention:
  - Notify: Mentioned user
  - Channel: In-app + email

deal_status_change:
  - Notify: All participants
  - Channel: In-app + email

deadline_approaching:
  - Notify: Deal leads
  - Channel: In-app + email
  - Trigger: 7 days, 3 days, 1 day before target date
```

---

## Success Criteria

1. Deal setup with imported facility terms < 5 minutes
2. Proposal-to-response cycle tracked with full audit trail
3. Real-time updates visible to all participants within 1 second
4. Impact analysis generated < 3 seconds
5. Complete negotiation history exportable for compliance
6. Support 20+ concurrent users on a single deal
