# Module 4: Trade Due Diligence Automator

## Overview

Automates the due diligence process for secondary loan trading. When lenders buy or sell loan positions, they must verify numerous conditions about the loan, the borrower, and the transferability. This module streamlines these checks, reducing trade settlement time and costs.

---

## Core Problem Statement

When trading loan positions on the secondary market:

**Seller must verify:**
- Transfer restrictions and consents required
- Any defaulted interest or fees
- Minimum hold requirements
- Competitor/restricted party lists

**Buyer must verify:**
- Loan status (any defaults, waivers?)
- Financial performance and covenant compliance
- Litigation or material events
- Document completeness
- Borrower creditworthiness

**Both parties need:**
- Settlement mechanics
- Assignment documentation
- Agent notification process
- Fee calculations

Current process: Emails, phone calls, manual document review, spreadsheet checklists.
This module: Automated checklists, instant data access, streamlined workflow.

---

## Trade Lifecycle Stages

```
TRADE_STAGES:

1. INDICATION
   - Seller indicates willingness to sell
   - Buyer expresses interest
   - Preliminary pricing

2. TRADE AGREEMENT
   - Parties agree on terms
   - Trade date established
   - Settlement date set (typically T+7 to T+20)

3. DUE DILIGENCE
   - Buyer reviews facility information
   - Seller confirms trade details
   - Both verify transferability

4. DOCUMENTATION
   - Assignment agreement prepared
   - Borrower consent (if required)
   - Agent notification

5. SETTLEMENT
   - Funds transfer
   - Agent records transfer
   - Position updated in systems

6. POST-TRADE
   - Confirmation to all parties
   - Records updated
   - Audit trail complete
```

---

## User Roles

```
TRADE_ROLES:

seller:
  - List positions for sale
  - Respond to due diligence questions
  - Provide documentation access
  - Execute assignment documentation
  
buyer:
  - Search available positions
  - Conduct due diligence
  - Request information
  - Execute assignment documentation
  
agent:
  - Verify trade compliance
  - Process consents
  - Record transfers
  - Distribute notices
  
broker (optional):
  - Match buyers and sellers
  - Facilitate negotiations
  - Track trade pipeline
```

---

## Data Schema

```
TRADE_SCHEMA:

# Trading facilities
trade_facility {
  id: uuid (primary key)
  organization_id: uuid
  
  -- Link to source
  source_facility_id: uuid (foreign key, Document Hub)
  compliance_facility_id: uuid (foreign key, Compliance)
  
  -- Basic Info
  facility_name: string
  facility_reference: string
  borrower_name: string
  
  -- Position Info
  total_commitments: decimal
  currency: string
  maturity_date: date
  
  -- Trading Characteristics
  transferability: enum [freely_transferable, consent_required, restricted]
  minimum_transfer_amount: decimal
  minimum_hold_amount: decimal
  restricted_parties: text[]
  
  -- Current Status (synced)
  current_status: enum [performing, default, restructuring]
  
  is_active: boolean
  created_at: timestamp
  updated_at: timestamp
}

# Lender positions
lender_position {
  id: uuid
  facility_id: uuid (foreign key)
  organization_id: uuid  -- The lender
  
  -- Position Details
  commitment_amount: decimal
  outstanding_principal: decimal
  unfunded_commitment: decimal
  
  -- Percentage
  pro_rata_share: decimal  -- Percentage of facility
  
  -- Acquisition
  acquisition_date: date
  acquisition_price: decimal  -- As percentage of par
  acquisition_type: enum [primary, secondary]
  predecessor_lender: string (nullable)
  
  -- Status
  is_current: boolean  -- False after sold
  
  created_at: timestamp
  updated_at: timestamp
}

# Individual trades
trade {
  id: uuid
  
  -- Facility
  facility_id: uuid (foreign key)
  
  -- Parties
  seller_organization_id: uuid
  seller_position_id: uuid (foreign key)
  buyer_organization_id: uuid
  
  -- Trade Terms
  trade_date: date
  settlement_date: date
  settlement_date_type: enum [t_plus_days, specific_date]
  settlement_days: integer
  
  -- Amount
  trade_amount: decimal  -- Commitment amount being transferred
  trade_price: decimal   -- As percentage of par (e.g., 99.5)
  trade_currency: string
  
  -- Accrued
  accrued_interest_handling: enum [buyer_pays, seller_retains, settle_at_closing]
  accrued_interest_amount: decimal (nullable)
  
  -- Fees
  delayed_compensation: boolean
  delayed_compensation_rate: decimal
  
  -- Status
  status: enum [
    draft,
    agreed,
    in_due_diligence,
    documentation,
    pending_consent,
    pending_settlement,
    settled,
    cancelled,
    failed
  ]
  
  -- Tracking
  consent_required: boolean
  consent_received: boolean
  consent_date: date
  
  agent_notified: boolean
  agent_notification_date: date
  
  -- Assignment Document
  assignment_document_id: uuid (nullable)
  
  created_by: uuid
  created_at: timestamp
  updated_at: timestamp
}

# Due diligence checklist
due_diligence_checklist {
  id: uuid
  trade_id: uuid (foreign key)
  
  -- Auto-generated based on facility type
  checklist_template_id: uuid (nullable)
  
  -- Overall Status
  status: enum [not_started, in_progress, complete, flagged]
  
  -- Progress
  total_items: integer
  completed_items: integer
  flagged_items: integer
  
  -- Assignments
  buyer_assigned_to: uuid
  seller_assigned_to: uuid
  
  completed_at: timestamp
  created_at: timestamp
  updated_at: timestamp
}

# Individual checklist items
due_diligence_item {
  id: uuid
  checklist_id: uuid (foreign key)
  
  -- Item Definition
  category: enum [
    facility_status,
    borrower_creditworthiness,
    financial_performance,
    covenant_compliance,
    documentation,
    transferability,
    legal_regulatory,
    operational
  ]
  
  item_key: string  -- Unique identifier
  item_name: string
  item_description: text
  
  -- Requirements
  required_for: enum [buyer, seller, both]
  data_source: enum [auto_system, seller_provided, document_review, external]
  
  -- Status
  status: enum [pending, in_review, verified, flagged, waived, not_applicable]
  
  -- Resolution
  verified_by: uuid
  verified_at: timestamp
  verification_notes: text
  
  -- If flagged
  flag_reason: text
  flag_severity: enum [info, warning, blocker]
  
  -- Supporting Evidence
  evidence_document_ids: uuid[]
  evidence_notes: text
  
  display_order: integer
  created_at: timestamp
  updated_at: timestamp
}

# Due diligence questions (buyer to seller)
due_diligence_question {
  id: uuid
  trade_id: uuid (foreign key)
  checklist_item_id: uuid (nullable)
  
  -- Question
  asked_by: uuid
  asked_by_party: enum [buyer, seller]
  question_text: text
  
  -- Response
  response_text: text (nullable)
  responded_by: uuid
  responded_at: timestamp
  
  -- Attachments
  question_attachments: uuid[]
  response_attachments: uuid[]
  
  -- Status
  status: enum [open, answered, closed]
  
  created_at: timestamp
}

# Information packages
information_package {
  id: uuid
  facility_id: uuid (foreign key)
  trade_id: uuid (nullable)  -- If created for specific trade
  
  name: string
  description: text
  
  -- Access Control
  visibility: enum [private, invited_only, all_approved_buyers]
  
  -- Contents
  document_ids: uuid[]  -- References to documents
  
  -- Timestamps
  prepared_by: uuid
  prepared_at: timestamp
  expires_at: timestamp (nullable)
  
  created_at: timestamp
}

# Trade timeline / audit
trade_event {
  id: uuid
  trade_id: uuid (foreign key)
  
  event_type: enum [
    trade_created,
    terms_agreed,
    dd_started,
    dd_item_verified,
    dd_item_flagged,
    question_asked,
    question_answered,
    dd_completed,
    consent_requested,
    consent_received,
    consent_rejected,
    documentation_prepared,
    documentation_executed,
    agent_notified,
    funds_received,
    transfer_recorded,
    trade_settled,
    trade_cancelled
  ]
  
  actor_id: uuid
  actor_organization: string
  actor_role: string
  
  details: jsonb
  
  created_at: timestamp
}

# Settlement tracking
settlement {
  id: uuid
  trade_id: uuid (foreign key)
  
  -- Amounts
  principal_amount: decimal
  accrued_interest: decimal
  fees: decimal
  delayed_compensation: decimal
  total_amount: decimal
  
  -- Wire Details
  seller_wire_instructions: jsonb
  buyer_wire_reference: string
  
  -- Tracking
  funds_sent_at: timestamp
  funds_received_at: timestamp
  
  -- Agent Processing
  agent_received_docs_at: timestamp
  agent_processed_at: timestamp
  transfer_effective_date: date
  
  -- Confirmation
  seller_confirmed: boolean
  buyer_confirmed: boolean
  agent_confirmed: boolean
  
  status: enum [pending, funds_in_transit, settled, failed]
  
  created_at: timestamp
  updated_at: timestamp
}
```

---

## Core Workflows

### Workflow 1: Position Listing (Seller)

```
LISTING_FLOW:

1. Select Position to Sell
   - View current positions
   - Select facility and amount
   - System validates against minimum hold requirements

2. Set Trade Parameters
   - Indicative price
   - Settlement preference
   - Confidentiality requirements

3. Prepare Information Package
   - System auto-generates from Document Hub + Compliance
   - Select additional documents to include
   - Review and approve

4. List Position
   - Make available to approved counterparties
   - Or share with specific buyers
   
5. Track Interest
   - Receive buyer inquiries
   - Respond to questions
   - Negotiate terms
```

### Workflow 2: Trade Initiation

```
TRADE_CREATION_FLOW:

1. Agree Terms
   - Parties agree on price, amount, settlement date
   - Create trade record in system

2. Generate Due Diligence Checklist
   - System analyzes facility characteristics
   - Creates appropriate checklist
   - Assigns items to buyer/seller

3. Grant Information Access
   - Seller provides access to information package
   - System links to relevant documents
   - Buyer receives notification

4. Start Due Diligence
   - Checklist status: In Progress
   - Timeline begins
```

### Workflow 3: Due Diligence Execution

```
DUE_DILIGENCE_FLOW:

1. Auto-Verification (System)
   For items with data_source = auto_system:
   - Facility Status: Pull from Document Hub
   - Covenant Compliance: Pull from Compliance Tracker
   - Outstanding Amounts: Pull from position records
   - Material Events: Check notification history
   
   System automatically verifies and marks complete

2. Document Review (Buyer)
   For items requiring document review:
   - Access information package
   - Review relevant documents
   - Mark as verified or flag issues

3. Seller-Provided Information
   For items requiring seller input:
   - Seller receives request
   - Provides information/documents
   - Buyer verifies

4. Q&A Process
   - Buyer asks questions
   - Seller responds
   - Thread attached to checklist item

5. Issue Resolution
   For flagged items:
   - Discuss resolution
   - Obtain waiver if needed
   - Document resolution

6. Completion
   - All required items verified
   - Checklist marked complete
   - Proceed to documentation
```

### Workflow 4: AI-Powered Q&A

```
AI_QA_FLOW:

1. Buyer Asks Question
   - Natural language question about the loan
   - e.g., "Has there been any change of control at the borrower in the last 12 months?"

2. System Processing
   - Query routed to LLM with RAG
   - Retrieves relevant documents and data
   - Analyzes across Document Hub, Compliance, Notification history

3. Generate Answer
   - Provide direct answer
   - Cite source documents and data
   - Flag if information is uncertain or unavailable

4. Verification
   - Seller can confirm/correct AI answer
   - Answer becomes part of DD record
```

### Workflow 5: Consent Management

```
CONSENT_FLOW:

1. Determine Consent Requirement
   - System checks transferability rules
   - Identifies required consents (borrower, agent, other lenders)

2. Prepare Consent Request
   - Generate consent request documentation
   - Pre-fill with trade details

3. Submit Request
   - Route to appropriate party
   - Track submission date

4. Monitor Response
   - Track consent deadline
   - Send reminders
   - Record response

5. Handle Outcome
   - Consent received: Proceed to documentation
   - Consent rejected: Options to modify or cancel trade
   - No response: Escalation process
```

### Workflow 6: Settlement

```
SETTLEMENT_FLOW:

1. Calculate Settlement Amount
   - Principal amount
   - Accrued interest calculation
   - Fees (if any)
   - Delayed compensation (if settlement delayed)
   - Total wire amount

2. Exchange Wire Instructions
   - Seller provides wire details
   - Securely stored in system

3. Execute Transfer
   - Buyer initiates wire
   - Records wire reference
   - Tracks funds

4. Agent Processing
   - Submit assignment documentation
   - Agent records transfer
   - Effective date confirmed

5. Confirm Settlement
   - All parties confirm
   - Positions updated
   - Trade marked as settled

6. Post-Settlement
   - Generate confirmations
   - Update position records
   - Complete audit trail
```

---

## Due Diligence Templates

```
CHECKLIST_TEMPLATES:

standard_dd_checklist:
  
  facility_status:
    - "Facility is current and performing"
    - "No Event of Default exists"
    - "No Potential Event of Default exists"
    - "No material waivers currently in effect"
    - "Agent has confirmed facility status"
  
  borrower_creditworthiness:
    - "Recent financial statements reviewed"
    - "Credit rating current (if rated)"
    - "No material adverse change"
    - "No significant litigation"
    - "Corporate structure unchanged"
  
  financial_performance:
    - "Last 4 quarters financial performance reviewed"
    - "Covenant compliance history verified"
    - "Budget vs. actual comparison"
    - "Cash flow adequacy confirmed"
  
  covenant_compliance:
    - "Current covenant test results obtained"
    - "All covenants passing"
    - "Covenant headroom acceptable"
    - "Covenant trend analysis reviewed"
    - "No outstanding cure periods"
  
  documentation:
    - "Credit agreement obtained"
    - "All amendments obtained"
    - "Security documents confirmed"
    - "Guarantees in place"
    - "Legal opinions obtained"
  
  transferability:
    - "Transfer restrictions reviewed"
    - "Buyer not on restricted list"
    - "Minimum transfer amount met"
    - "Minimum hold requirement met"
    - "Required consents identified"
  
  legal_regulatory:
    - "Know Your Customer completed"
    - "Anti-money laundering cleared"
    - "Sanctions screening completed"
    - "Tax considerations reviewed"
    - "Regulatory approvals obtained (if required)"
  
  operational:
    - "Agent contact details confirmed"
    - "Wire instructions verified"
    - "Settlement timeline confirmed"
    - "Assignment documentation template obtained"

leverage_loan_additions:
  - "Sponsor confirmation obtained"
  - "Sponsor equity cushion reviewed"
  - "Management presentation reviewed"
  - "Industry analysis current"
  - "Comparable transaction analysis"

esg_linked_additions:
  - "ESG KPI performance history"
  - "Current ESG rating/status"
  - "ESG reporting up to date"
  - "Sustainability targets on track"
  - "ESG margin adjustment status"
```

---

## API Endpoints

```
ENDPOINTS:

# Facilities & Positions
GET    /api/trading/facilities                        # List tradeable facilities
GET    /api/trading/facilities/:id                    # Facility detail
GET    /api/trading/positions                         # My positions
GET    /api/trading/positions/:id                     # Position detail

# Trades
POST   /api/trading/trades                            # Create trade
GET    /api/trading/trades                            # List trades
GET    /api/trading/trades/:id                        # Trade detail
PUT    /api/trading/trades/:id                        # Update trade
POST   /api/trading/trades/:id/agree                  # Mark terms agreed
POST   /api/trading/trades/:id/cancel                 # Cancel trade

# Due Diligence
GET    /api/trading/trades/:id/checklist              # Get checklist
PUT    /api/trading/trades/:id/checklist/items/:iid   # Update item
POST   /api/trading/trades/:id/checklist/items/:iid/verify    # Verify item
POST   /api/trading/trades/:id/checklist/items/:iid/flag      # Flag item
POST   /api/trading/trades/:id/checklist/complete     # Mark DD complete

# Q&A
GET    /api/trading/trades/:id/questions              # List questions
POST   /api/trading/trades/:id/questions              # Ask question
PUT    /api/trading/trades/:id/questions/:qid         # Answer question

# AI Q&A
POST   /api/trading/trades/:id/ai-query               # AI-powered query
  body: { question: string }
  returns: { answer, sources[], confidence }

# Information Packages
GET    /api/trading/facilities/:id/packages           # List packages
POST   /api/trading/facilities/:id/packages           # Create package
GET    /api/trading/packages/:pid                     # Get package
POST   /api/trading/packages/:pid/share               # Share package

# Consent
POST   /api/trading/trades/:id/consent/request        # Request consent
PUT    /api/trading/trades/:id/consent                # Update consent status

# Settlement
GET    /api/trading/trades/:id/settlement             # Settlement details
POST   /api/trading/trades/:id/settlement/calculate   # Calculate amounts
PUT    /api/trading/trades/:id/settlement             # Update settlement
POST   /api/trading/trades/:id/settlement/confirm     # Confirm settlement

# Timeline
GET    /api/trading/trades/:id/timeline               # Trade event history

# Reports
POST   /api/trading/trades/:id/reports/dd-summary     # DD summary report
POST   /api/trading/trades/:id/reports/settlement     # Settlement report
```

---

## Integration Points

```
INTEGRATIONS:

← FROM Document Intelligence Hub:
  - Facility data and documents
  - Transfer restriction clauses
  - Defined terms
  - Query interface for DD questions

← FROM Compliance Tracker:
  - Covenant test history
  - Compliance status
  - Waiver history
  - Event notifications

← FROM Deal Room:
  - Amendment history
  - Negotiation audit trail (if relevant to DD)

→ External Systems (future):
  - Trading platforms (Markit, Loan Connector)
  - Agent systems
  - KYC/AML providers
```

---

## LLM Integration

```
LLM_USAGE:

1. DD Question Answering
   - RAG-powered Q&A about the facility
   - Sources: Document Hub, Compliance data, notification history
   - Provides cited answers with confidence levels

2. DD Report Generation
   - Input: Completed checklist, Q&A history
   - Output: Narrative DD summary report
   - Highlights key findings and flags

3. Document Analysis
   - Quick analysis of specific documents
   - Extract key terms relevant to trade
   - Compare to standard market terms

4. Risk Summary
   - Analyze facility data
   - Generate risk summary for buyer
   - Identify key risk factors

5. Settlement Calculation Verification
   - Double-check settlement calculations
   - Verify pro rata allocations
   - Flag potential errors
```

---

## Notifications

```
NOTIFICATION_RULES:

trade_created:
  - Notify: Seller (confirmation), Buyer (confirmation)
  
dd_item_flagged:
  - Notify: Both parties
  - Priority: High
  
question_asked:
  - Notify: Counterparty
  
question_answered:
  - Notify: Asker
  
dd_complete:
  - Notify: Both parties
  
consent_received:
  - Notify: Both parties
  - Action: Proceed prompt
  
settlement_approaching:
  - Notify: Both parties
  - Timing: 3 days, 1 day before
  
settlement_complete:
  - Notify: All parties
  - Include: Confirmation details
  
trade_cancelled:
  - Notify: All parties
  - Include: Reason
```

---

## Success Criteria

1. Due diligence checklist generation < 10 seconds
2. Auto-verification of system-sourced items: 100% accuracy
3. AI Q&A response time < 5 seconds
4. Complete DD cycle reduced by 50% vs. manual process
5. Settlement calculation accuracy: 100%
6. Full audit trail for regulatory compliance
7. Support 100+ concurrent trades
