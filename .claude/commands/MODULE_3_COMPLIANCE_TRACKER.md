# Module 3: Compliance Tracker & Obligation Calendar

## Overview

A comprehensive system for tracking and managing loan compliance obligations. Handles reporting deadlines, covenant monitoring, event notifications, and compliance documentation - ensuring borrowers and lenders never miss critical obligations.

---

## Core Problem Statement

Each loan agreement contains:
- Multiple reporting obligations with different deadlines
- Financial covenants tested quarterly/annually
- Event notification requirements (triggered by business events)
- Information undertakings
- Conditions that must be maintained

Managing these across a portfolio of 10, 50, or 100+ loans is operationally intensive. Missing a deadline can trigger technical defaults, reputation damage, or cross-default cascades.

---

## User Perspectives

```
USER_PERSONAS:

Borrower Corporate Treasury:
  - Manage compliance across all their facilities
  - Submit required reports and certificates
  - Track covenant headroom
  - Receive deadline reminders
  - Evidence compliance to lenders

Lender Portfolio Manager:
  - Monitor compliance across lending portfolio
  - Receive borrower submissions
  - Track covenant breaches and waivers
  - Aggregate reporting across facilities
  - Risk management oversight

Agent Bank Operations:
  - Process compliance submissions
  - Distribute to lender syndicate
  - Track completion status
  - Manage communication flow
```

---

## Data Schema

```
COMPLIANCE_SCHEMA:

# Core entity - links to facilities from Module 1
compliance_facility {
  id: uuid (primary key)
  organization_id: uuid
  
  -- Link to Document Intelligence Hub
  source_facility_id: uuid (foreign key)
  
  -- Basic Info (copied/synced from source)
  facility_name: string
  facility_reference: string
  borrower_name: string
  maturity_date: date
  
  -- Compliance Config
  fiscal_year_end: date  -- e.g., "12-31"
  reporting_currency: string
  
  -- Status
  status: enum [active, waiver_period, default, closed]
  
  created_at: timestamp
  updated_at: timestamp
}

# Reporting Obligations
reporting_obligation {
  id: uuid
  facility_id: uuid (foreign key)
  
  -- From Document Intelligence Hub extraction
  source_obligation_id: uuid (nullable)
  
  -- Obligation Definition
  obligation_type: enum [
    annual_audited_financials,
    quarterly_financials,
    monthly_financials,
    compliance_certificate,
    annual_budget,
    projections,
    covenant_calculation,
    esg_report,
    insurance_certificate,
    other
  ]
  
  name: string
  description: text
  
  -- Timing Configuration
  frequency: enum [annual, semi_annual, quarterly, monthly, one_time, on_event]
  
  -- Deadline Calculation
  reference_point: enum [period_end, fiscal_year_end, fixed_date, event_date]
  deadline_days: integer  -- Days after reference point
  deadline_business_days: boolean  -- Use business days?
  
  -- For fixed dates
  fixed_deadline_dates: date[]
  
  -- Grace Period
  grace_period_days: integer
  
  -- Recipients
  recipient_roles: string[]  -- ["Agent", "All Lenders"]
  
  -- Requirements
  requires_certification: boolean
  requires_audit: boolean
  format_requirements: text
  
  -- Status
  is_active: boolean
  
  -- Source
  clause_reference: string
  
  created_at: timestamp
  updated_at: timestamp
}

# Individual instances of obligations
compliance_event {
  id: uuid
  facility_id: uuid (foreign key)
  obligation_id: uuid (foreign key)
  
  -- Period
  reference_period_start: date  -- e.g., Q1 start
  reference_period_end: date    -- e.g., Q1 end
  
  -- Deadlines
  deadline_date: date
  grace_deadline_date: date
  
  -- Status Tracking
  status: enum [
    upcoming,
    due_soon,
    overdue,
    submitted,
    under_review,
    accepted,
    rejected,
    waived
  ]
  
  -- Submission
  submitted_at: timestamp
  submitted_by: uuid
  submission_notes: text
  
  -- Review
  reviewed_at: timestamp
  reviewed_by: uuid
  review_notes: text
  
  -- Attachments stored separately
  
  created_at: timestamp
  updated_at: timestamp
}

# Documents attached to compliance events
compliance_document {
  id: uuid
  event_id: uuid (foreign key)
  
  filename: string
  storage_path: string
  file_type: string
  file_size: integer
  
  document_type: enum [
    financial_statements,
    compliance_certificate,
    covenant_calculation,
    supporting_schedule,
    other
  ]
  
  uploaded_by: uuid
  uploaded_at: timestamp
}

# Financial Covenants
covenant {
  id: uuid
  facility_id: uuid (foreign key)
  
  -- From Document Intelligence Hub
  source_covenant_id: uuid (nullable)
  
  -- Definition
  covenant_type: enum [
    leverage_ratio,
    interest_coverage,
    fixed_charge_coverage,
    debt_service_coverage,
    current_ratio,
    net_worth,
    tangible_net_worth,
    capex,
    minimum_liquidity,
    maximum_debt,
    other
  ]
  
  name: string
  description: text
  
  -- Calculation
  numerator_definition: text
  denominator_definition: text
  formula_description: text
  
  -- Threshold
  threshold_type: enum [maximum, minimum]
  
  -- Schedule (threshold may change over time)
  threshold_schedule: jsonb  -- [{effective_from, threshold_value}]
  
  -- Testing
  testing_frequency: enum [quarterly, semi_annual, annual]
  testing_basis: enum [period_end, rolling_12_months, rolling_4_quarters]
  
  -- Cure Rights
  has_equity_cure: boolean
  equity_cure_details: text
  cure_period_days: integer
  max_cures: integer
  consecutive_cure_limit: integer
  
  -- Status
  is_active: boolean
  
  -- Source
  clause_reference: string
  
  created_at: timestamp
  updated_at: timestamp
}

# Covenant test results
covenant_test {
  id: uuid
  covenant_id: uuid (foreign key)
  facility_id: uuid (foreign key)
  
  -- Test Period
  test_date: date
  period_start: date
  period_end: date
  
  -- Results
  numerator_value: decimal
  denominator_value: decimal
  calculated_ratio: decimal
  threshold_value: decimal
  
  -- Pass/Fail
  test_result: enum [pass, fail, cured, waived]
  headroom_absolute: decimal  -- Distance from threshold
  headroom_percentage: decimal
  
  -- If failed
  breach_amount: decimal
  cure_applied: boolean
  cure_amount: decimal
  waiver_obtained: boolean
  waiver_reference: string
  
  -- Submission
  submitted_at: timestamp
  submitted_by: uuid
  
  -- Supporting calculation
  calculation_details: jsonb
  
  -- Compliance Event Link
  compliance_event_id: uuid (nullable)
  
  created_at: timestamp
  updated_at: timestamp
}

# Event Notifications (triggered by business events)
notification_requirement {
  id: uuid
  facility_id: uuid (foreign key)
  
  -- Definition
  event_type: enum [
    default_event,
    potential_default,
    material_litigation,
    change_of_control,
    material_acquisition,
    material_disposal,
    material_contract,
    environmental_claim,
    insurance_claim,
    change_of_auditors,
    material_adverse_change,
    other
  ]
  
  name: string
  trigger_description: text
  
  -- Timing
  notification_deadline: string  -- e.g., "prompt", "5 business days", "within 30 days"
  notification_deadline_days: integer (nullable)
  
  -- Recipients
  recipient_roles: string[]
  
  -- Content Requirements
  required_content: text
  
  -- Source
  clause_reference: string
  
  is_active: boolean
  created_at: timestamp
}

# Actual notification events
notification_event {
  id: uuid
  requirement_id: uuid (foreign key)
  facility_id: uuid (foreign key)
  
  -- Event Details
  event_date: date
  event_description: text
  
  -- Notification
  notification_due_date: date
  notification_sent_date: date
  
  -- Status
  status: enum [pending, sent, acknowledged, resolved]
  
  -- Content
  notification_content: text
  
  created_by: uuid
  created_at: timestamp
  updated_at: timestamp
}

# Reminders and alerts
compliance_reminder {
  id: uuid
  
  -- Target
  facility_id: uuid (nullable)
  compliance_event_id: uuid (nullable)
  covenant_id: uuid (nullable)
  
  -- Reminder Config
  reminder_type: enum [deadline_approaching, covenant_test_due, waiver_expiring, custom]
  days_before: integer
  
  -- Delivery
  notify_users: uuid[]
  notify_roles: string[]
  
  notification_channel: enum [in_app, email, both]
  
  -- Status
  is_sent: boolean
  sent_at: timestamp
  
  -- Scheduling
  scheduled_for: timestamp
  
  created_at: timestamp
}

# Waivers and amendments
waiver {
  id: uuid
  facility_id: uuid (foreign key)
  
  waiver_type: enum [covenant_waiver, deadline_extension, consent, amendment]
  
  -- What's being waived
  related_covenant_id: uuid (nullable)
  related_event_id: uuid (nullable)
  
  -- Details
  description: text
  waiver_period_start: date
  waiver_period_end: date
  
  -- Conditions
  conditions: text
  fee_amount: decimal
  fee_currency: string
  
  -- Approvals
  required_consent: enum [agent, majority_lenders, all_lenders]
  consent_obtained_date: date
  
  -- Status
  status: enum [requested, approved, rejected, expired, superseded]
  
  -- Documentation
  waiver_document_id: uuid (nullable)
  
  created_at: timestamp
  updated_at: timestamp
}
```

---

## Core Workflows

### Workflow 1: Obligation Calendar Setup

```
SETUP_FLOW:

1. Import from Document Intelligence Hub
   - Select facility
   - Pull extracted reporting obligations
   - Pull extracted covenants
   - Pull notification requirements

2. Configure Calendar
   - Set fiscal year end
   - Define business day calendar (jurisdiction)
   - Set default reminder schedules

3. Generate Compliance Events
   - System calculates all upcoming deadlines
   - Creates compliance_event records
   - Schedules reminders

4. Review and Adjust
   - User reviews generated calendar
   - Adjust dates if needed (e.g., first reporting period shorter)
   - Mark any obligations as waived/not applicable
```

### Workflow 2: Compliance Submission

```
SUBMISSION_FLOW:

1. Reminder Triggered
   - X days before deadline
   - Notification to assigned users
   - Link to compliance event

2. Prepare Submission
   - View obligation requirements
   - Upload required documents
   - For covenants: Enter calculation worksheet

3. Submit
   - Attach documents
   - Add submission notes
   - Mark as submitted
   - Timestamp recorded

4. Review (for Agents/Lenders)
   - Receive notification of submission
   - Review documents
   - Accept or request clarification

5. Complete
   - Mark as accepted
   - Archive for audit trail
```

### Workflow 3: Covenant Monitoring

```
COVENANT_FLOW:

1. Test Date Approaches
   - Reminder sent to borrower
   - Covenant worksheet available

2. Input Financial Data
   - Enter covenant calculation inputs
   - System calculates ratio
   - Compare to threshold

3. Result Determination
   - Pass: Headroom displayed, status green
   - Fail: Breach flagged, cure options shown

4. If Breach:
   a. Cure Period
      - Track cure deadline
      - Record cure actions (equity injection, etc.)
      
   b. Waiver Request
      - Document waiver request
      - Track consent process
      - Record outcome

5. Trend Analysis
   - Historical covenant performance
   - Headroom trends
   - Projection warnings
```

### Workflow 4: Event Notification

```
EVENT_NOTIFICATION_FLOW:

1. Business Event Occurs
   - User logs event in system
   - Describes the event

2. AI-Assisted Analysis
   - System queries: "Given this event, what notifications are required?"
   - LLM analyzes event against notification requirements
   - Returns list of triggered notifications

3. Notification Generation
   - System identifies affected facilities
   - Calculates notification deadlines
   - Drafts notification content

4. Review and Send
   - User reviews and edits notification
   - Sends to required parties
   - System records delivery

5. Track Response
   - Mark acknowledgments
   - Track any follow-up required
```

### Workflow 5: Compliance Dashboard

```
DASHBOARD_FLOW:

1. Portfolio Overview
   - All facilities with compliance status
   - Color-coded: Green (compliant), Yellow (upcoming), Red (overdue/breach)
   
2. Upcoming Deadlines
   - Calendar view
   - List view with filtering
   - Grouping by facility, type, deadline

3. Covenant Summary
   - All covenants across portfolio
   - Current status and headroom
   - Trend indicators

4. Alerts & Actions
   - Items requiring attention
   - Quick action buttons
   - Assignment to team members

5. Reports
   - Compliance status report
   - Covenant summary report
   - Historical compliance record
```

---

## Calculation Engine

```
COVENANT_CALCULATIONS:

The system supports configurable covenant calculations:

1. Standard Ratio Templates:
   - Leverage: Total Debt / EBITDA
   - Interest Coverage: EBITDA / Interest Expense
   - Fixed Charge Coverage: (EBITDA - CapEx) / Fixed Charges
   - Current Ratio: Current Assets / Current Liabilities
   - Net Worth: Total Assets - Total Liabilities

2. Custom Formulas:
   - Users can define custom calculations
   - Support for:
     - Addition, subtraction, multiplication, division
     - Min, max, average
     - Conditional logic
     - Period adjustments (annualization, rolling)

3. Adjustment Handling:
   - Pro forma adjustments
   - Permitted add-backs
   - Exclusions per facility agreement

4. Input Sources:
   - Manual entry
   - Import from financial statements (future)
   - API integration with accounting systems (future)

CALCULATION_SCHEMA:

covenant_calculation_template {
  id: uuid
  covenant_id: uuid
  
  -- Inputs
  required_inputs: jsonb  -- [{name, label, type, default_value}]
  
  -- Formula
  formula_expression: text  -- e.g., "total_debt / ebitda"
  
  -- Adjustments
  adjustment_rules: jsonb  -- [{name, description, formula}]
  
  -- Rounding
  rounding_precision: integer
  rounding_method: enum [round, floor, ceiling]
}

covenant_calculation_input {
  id: uuid
  covenant_test_id: uuid
  
  input_name: string
  input_value: decimal
  input_source: enum [manual, imported, calculated]
  
  -- Adjustments Applied
  adjustments: jsonb  -- [{adjustment_name, amount, description}]
  adjusted_value: decimal
}
```

---

## Reminder System

```
REMINDER_CONFIGURATION:

Default Reminder Schedule:
  30 days before: "Upcoming deadline" (email digest)
  14 days before: "Deadline approaching" (email)
  7 days before: "Deadline next week" (email + in-app)
  3 days before: "Urgent: deadline in 3 days" (email + in-app)
  1 day before: "FINAL REMINDER" (email + in-app)
  On deadline: "DUE TODAY" (email + in-app)
  After deadline: "OVERDUE" (email + in-app daily)

Customization:
  - Per-facility reminder schedules
  - Per-obligation overrides
  - User preferences for channels
  - Role-based routing

Escalation:
  - Configurable escalation paths
  - Manager notification on overdue
  - Executive alerts for breaches
```

---

## API Endpoints

```
ENDPOINTS:

# Facilities
GET    /api/compliance/facilities                    # List facilities
POST   /api/compliance/facilities                    # Add facility
GET    /api/compliance/facilities/:id                # Get facility detail
POST   /api/compliance/facilities/:id/sync           # Sync from Document Hub

# Obligations
GET    /api/compliance/facilities/:id/obligations    # List obligations
POST   /api/compliance/facilities/:id/obligations    # Add obligation
PUT    /api/compliance/obligations/:oid              # Update obligation
DELETE /api/compliance/obligations/:oid              # Remove obligation

# Compliance Events
GET    /api/compliance/events                        # All events (with filters)
GET    /api/compliance/facilities/:id/events         # Events for facility
GET    /api/compliance/events/:eid                   # Event detail
PUT    /api/compliance/events/:eid                   # Update event
POST   /api/compliance/events/:eid/submit            # Submit compliance
POST   /api/compliance/events/:eid/review            # Review submission
POST   /api/compliance/events/:eid/documents         # Upload document

# Covenants
GET    /api/compliance/facilities/:id/covenants      # List covenants
POST   /api/compliance/facilities/:id/covenants      # Add covenant
PUT    /api/compliance/covenants/:cid                # Update covenant
GET    /api/compliance/covenants/:cid/tests          # Test history
POST   /api/compliance/covenants/:cid/tests          # Submit test result

# Covenant Calculations
GET    /api/compliance/covenants/:cid/template       # Get calculation template
POST   /api/compliance/covenants/:cid/calculate      # Calculate covenant
  body: { inputs: {...}, period_end: date }

# Notifications
GET    /api/compliance/facilities/:id/notifications  # List requirements
POST   /api/compliance/notifications                 # Log notification event
GET    /api/compliance/notifications/analyze         # AI analysis
  body: { event_description, facility_ids?: [] }

# Waivers
GET    /api/compliance/facilities/:id/waivers        # List waivers
POST   /api/compliance/waivers                       # Create waiver
PUT    /api/compliance/waivers/:wid                  # Update waiver

# Calendar
GET    /api/compliance/calendar                      # Aggregated calendar
  query: { start_date, end_date, facility_ids[], types[] }

# Dashboard
GET    /api/compliance/dashboard                     # Dashboard data
GET    /api/compliance/dashboard/portfolio-summary   # Portfolio overview
GET    /api/compliance/dashboard/alerts              # Active alerts

# Reports
POST   /api/compliance/reports/status                # Generate status report
POST   /api/compliance/reports/covenant-summary      # Covenant summary
POST   /api/compliance/reports/history               # Historical compliance
```

---

## Integration Points

```
INTEGRATIONS:

← FROM Document Intelligence Hub:
  - Reporting obligations with deadlines
  - Financial covenant definitions
  - Event notification requirements
  - Clause references for context

← FROM Deal Room:
  - Newly closed deals create compliance facilities
  - Agreed terms initialize covenant tracking
  - Amendment/waiver records

→ TO ESG Dashboard:
  - ESG-related compliance events
  - Sustainability reporting deadlines
  - KPI submission tracking

→ TO Trade Due Diligence:
  - Compliance history for trades
  - Covenant test history
  - Waiver/amendment history
```

---

## LLM Integration

```
LLM_USAGE:

1. Event Analysis
   - Input: Description of business event
   - Process: Analyze against all notification requirements
   - Output: List of triggered notifications with deadlines

2. Notification Drafting
   - Input: Event details, requirement specifications
   - Process: Draft notification letter
   - Output: Suggested notification content

3. Covenant Interpretation
   - Input: Covenant definition text, financial scenario
   - Process: Interpret how covenant applies
   - Output: Explanation of calculation requirements

4. Compliance Q&A
   - Input: User question about compliance requirements
   - Process: RAG retrieval from facility documents + LLM
   - Output: Answer with source references
```

---

## Background Jobs

```
SCHEDULED_JOBS:

1. generate_compliance_events
   - Run: Daily at 00:00 UTC
   - Action: Create compliance_event records for upcoming periods
   - Look ahead: 12 months

2. send_reminders
   - Run: Daily at 08:00 local time (per user timezone)
   - Action: Check all upcoming deadlines, send appropriate reminders

3. update_overdue_status
   - Run: Hourly
   - Action: Mark events past deadline as overdue

4. sync_from_document_hub
   - Run: On trigger (when source document reprocessed)
   - Action: Update obligations/covenants from new extraction

5. generate_daily_digest
   - Run: Daily at 07:00 local time
   - Action: Compile and send daily compliance digest email

6. covenant_headroom_alerts
   - Run: Daily
   - Action: Check covenant trends, alert if headroom declining
```

---

## Success Criteria

1. Zero missed compliance deadlines due to system failures
2. Reminder delivery 100% reliability
3. Calendar generation < 5 seconds for 100+ obligations
4. Covenant calculation with full audit trail
5. Event analysis response < 10 seconds
6. Support 500+ facilities per organization
7. Historical compliance data retained indefinitely
