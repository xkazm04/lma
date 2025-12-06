# Module 5: ESG Performance Dashboard

## Overview

A centralized platform for tracking, verifying, and reporting ESG (Environmental, Social, Governance) performance across loan portfolios. Handles sustainability-linked loan (SLL) KPIs, green loan use-of-proceeds tracking, and ESG reporting requirements - providing transparency for borrowers, lenders, and stakeholders.

---

## Core Problem Statement

ESG in lending is growing rapidly but faces challenges:

**Fragmentation:**
- ESG obligations vary significantly between loans
- No standardized data formats across institutions
- Multiple reporting frameworks (SFDR, TCFD, EU Taxonomy, etc.)

**Verification:**
- Self-reported data raises credibility concerns
- External verification is expensive and time-consuming
- Greenwashing risks

**Comparison:**
- Hard to benchmark across portfolio
- Different KPIs across loans
- Varying baseline years and methodologies

This module creates a unified view of ESG performance with verification workflows and standardized reporting.

---

## ESG Loan Types Supported

```
ESG_LOAN_TYPES:

1. Sustainability-Linked Loans (SLLs)
   - General purpose loans
   - Margin adjusts based on ESG KPI performance
   - Key focus: KPI tracking and target verification

2. Green Loans
   - Use-of-proceeds restricted to eligible green projects
   - Key focus: Allocation tracking and impact reporting

3. Social Loans
   - Use-of-proceeds for social benefit projects
   - Key focus: Social impact metrics and allocation

4. Transition Loans
   - Funding decarbonization in hard-to-abate sectors
   - Key focus: Transition pathway adherence

5. ESG-Linked Facilities
   - Hybrid structures with multiple ESG elements
   - Combined tracking requirements
```

---

## Data Schema

```
ESG_SCHEMA:

# ESG-enabled facilities
esg_facility {
  id: uuid (primary key)
  organization_id: uuid
  
  -- Links
  source_facility_id: uuid (foreign key, Document Hub)
  compliance_facility_id: uuid (foreign key, Compliance)
  
  -- Basic Info
  facility_name: string
  facility_reference: string
  borrower_name: string
  borrower_industry: string
  
  -- ESG Classification
  esg_loan_type: enum [
    sustainability_linked,
    green_loan,
    social_loan,
    transition_loan,
    esg_linked_hybrid
  ]
  
  -- Framework Alignment
  aligned_frameworks: string[]  -- ["LMA GLP", "LMA SLLP", "EU Taxonomy", etc.]
  
  -- Financial Terms (for SLLs)
  base_margin: decimal
  margin_adjustment_mechanism: jsonb  -- Details of ratchet
  
  -- Dates
  effective_date: date
  maturity_date: date
  
  -- Status
  status: enum [active, closed, suspended]
  
  created_at: timestamp
  updated_at: timestamp
}

# KPIs for Sustainability-Linked Loans
esg_kpi {
  id: uuid
  facility_id: uuid (foreign key)
  
  -- From Document Hub extraction
  source_provision_id: uuid (nullable)
  
  -- KPI Definition
  kpi_name: string
  kpi_category: enum [
    environmental_emissions,
    environmental_energy,
    environmental_water,
    environmental_waste,
    environmental_biodiversity,
    social_workforce,
    social_health_safety,
    social_community,
    social_supply_chain,
    governance_board,
    governance_ethics,
    governance_risk,
    other
  ]
  
  kpi_subcategory: string  -- e.g., "Scope 1 GHG Emissions"
  
  -- Measurement
  unit_of_measure: string  -- e.g., "tCO2e", "MWh", "% women in leadership"
  measurement_methodology: text
  boundary_scope: text  -- What's included in measurement
  
  -- Baseline
  baseline_year: integer
  baseline_value: decimal
  baseline_verified: boolean
  baseline_verifier: string
  
  -- Direction
  improvement_direction: enum [decrease, increase]
  
  -- Materiality
  is_core_kpi: boolean  -- Distinguishes material vs. supporting KPIs
  weighting: decimal (nullable)  -- If multiple KPIs affect margin
  
  -- Verification
  requires_external_verification: boolean
  verification_frequency: enum [annual, semi_annual, per_test]
  acceptable_verifiers: text[]
  
  -- Source
  clause_reference: string
  
  is_active: boolean
  created_at: timestamp
  updated_at: timestamp
}

# KPI Targets
esg_target {
  id: uuid
  kpi_id: uuid (foreign key)
  
  -- Target Period
  target_year: integer
  target_period: enum [annual, h1, h2, q1, q2, q3, q4]
  target_date: date  -- Specific measurement date
  
  -- Target Value
  target_value: decimal
  target_type: enum [absolute, intensity, percentage_reduction]
  
  -- Ambitiousness Reference
  science_based: boolean
  science_based_initiative: string (nullable)  -- e.g., "SBTi"
  paris_aligned: boolean
  
  -- Margin Impact
  margin_adjustment_bps: decimal  -- +/- basis points if met/missed
  margin_adjustment_direction: enum [benefit_if_met, penalty_if_missed, both]
  
  created_at: timestamp
}

# KPI Performance Results
esg_performance {
  id: uuid
  kpi_id: uuid (foreign key)
  target_id: uuid (foreign key)
  facility_id: uuid (foreign key)
  
  -- Period
  reporting_period_start: date
  reporting_period_end: date
  measurement_date: date
  
  -- Actual Performance
  actual_value: decimal
  actual_vs_baseline_change: decimal  -- Percentage change
  actual_vs_target_variance: decimal
  
  -- Result
  target_met: boolean
  margin_adjustment_applied: decimal  -- Actual bps adjustment
  
  -- Data Quality
  data_source: enum [borrower_reported, system_calculated, third_party, verified]
  data_quality_score: decimal  -- 0-100
  
  -- Verification
  verification_status: enum [pending, in_progress, verified, rejected]
  verifier_name: string (nullable)
  verification_date: date (nullable)
  verification_report_id: uuid (nullable)
  verification_notes: text
  
  -- Supporting Data
  calculation_details: jsonb
  supporting_documents: uuid[]
  
  -- Submission
  submitted_by: uuid
  submitted_at: timestamp
  
  created_at: timestamp
  updated_at: timestamp
}

# Green/Social Loan Use of Proceeds
use_of_proceeds_category {
  id: uuid
  facility_id: uuid (foreign key)
  
  -- Category Definition
  category_name: string  -- e.g., "Renewable Energy", "Clean Transportation"
  category_type: enum [green, social]
  
  -- Eligibility Criteria
  eligibility_criteria: text
  aligned_taxonomy: string  -- e.g., "EU Taxonomy", "Climate Bonds Initiative"
  taxonomy_activity_code: string (nullable)
  
  -- Allocation Limits
  minimum_allocation_percentage: decimal (nullable)
  maximum_allocation_percentage: decimal (nullable)
  
  -- Expected Impact
  expected_impact_metrics: jsonb  -- [{metric, unit, expected_value}]
  
  -- Source
  clause_reference: string
  
  created_at: timestamp
}

# Proceeds Allocation
proceeds_allocation {
  id: uuid
  facility_id: uuid (foreign key)
  category_id: uuid (foreign key)
  
  -- Project/Asset Details
  project_name: string
  project_description: text
  project_location: string
  project_start_date: date
  project_status: enum [planned, in_progress, completed]
  
  -- Allocation
  allocated_amount: decimal
  allocation_date: date
  allocation_currency: string
  
  -- Impact
  impact_metrics: jsonb  -- [{metric, unit, value, period}]
  
  -- Verification
  allocation_verified: boolean
  verification_date: date
  verifier_name: string
  
  created_at: timestamp
  updated_at: timestamp
}

# Unallocated Proceeds (for Green Loans)
unallocated_proceeds {
  id: uuid
  facility_id: uuid (foreign key)
  
  as_of_date: date
  unallocated_amount: decimal
  temporary_investment: text  -- How unallocated proceeds are held
  
  created_at: timestamp
}

# ESG Reporting Requirements
esg_reporting_requirement {
  id: uuid
  facility_id: uuid (foreign key)
  
  report_type: enum [
    annual_sustainability_report,
    kpi_performance_report,
    allocation_report,
    impact_report,
    verification_assurance_report,
    external_rating_update,
    other
  ]
  
  report_name: string
  description: text
  
  -- Timing
  frequency: enum [annual, semi_annual, quarterly, on_occurrence]
  deadline_days_after_period: integer
  
  -- Recipients
  recipients: string[]
  
  -- Requirements
  format_requirements: text
  content_requirements: text
  
  -- Linked to Compliance
  compliance_obligation_id: uuid (nullable)
  
  clause_reference: string
  is_active: boolean
  created_at: timestamp
}

# ESG Reports Submitted
esg_report {
  id: uuid
  facility_id: uuid (foreign key)
  requirement_id: uuid (foreign key, nullable)
  
  -- Report Details
  report_type: string
  report_title: string
  reporting_period_start: date
  reporting_period_end: date
  
  -- Document
  document_id: uuid
  file_name: string
  
  -- Submission
  submitted_by: uuid
  submitted_at: timestamp
  
  -- Review
  status: enum [submitted, under_review, accepted, rejected]
  reviewed_by: uuid
  reviewed_at: timestamp
  review_notes: text
  
  created_at: timestamp
}

# ESG Scores and Ratings
esg_rating {
  id: uuid
  facility_id: uuid (nullable)  -- Or at borrower level
  borrower_id: uuid (nullable)
  
  -- Rating Provider
  rating_provider: enum [
    msci,
    sustainalytics,
    sp_global,
    moodys_esg,
    cdp,
    internal,
    other
  ]
  provider_name: string
  
  -- Rating Details
  rating_type: string  -- e.g., "ESG Risk Rating", "Climate Score"
  rating_value: string  -- e.g., "AA", "32.4", "B-"
  rating_scale: string  -- e.g., "AAA-CCC", "0-100"
  rating_category: enum [leader, average, laggard]
  
  -- Components (if available)
  environmental_score: decimal (nullable)
  social_score: decimal (nullable)
  governance_score: decimal (nullable)
  
  -- Validity
  rating_date: date
  valid_until: date
  
  -- Source Document
  rating_document_id: uuid (nullable)
  
  created_at: timestamp
  updated_at: timestamp
}

# Portfolio ESG Aggregation
portfolio_esg_summary {
  id: uuid
  organization_id: uuid
  
  -- Period
  as_of_date: date
  
  -- Portfolio Metrics
  total_esg_facilities: integer
  total_esg_exposure: decimal
  
  -- By Type
  sll_count: integer
  sll_exposure: decimal
  green_loan_count: integer
  green_loan_exposure: decimal
  social_loan_count: integer
  social_loan_exposure: decimal
  
  -- Performance Summary
  kpis_on_track: integer
  kpis_at_risk: integer
  kpis_missed: integer
  
  -- Allocation Summary (Green/Social)
  total_allocated_proceeds: decimal
  total_unallocated_proceeds: decimal
  
  -- Weighted Metrics
  weighted_carbon_intensity: decimal (nullable)
  portfolio_alignment_score: decimal (nullable)
  
  calculation_details: jsonb
  
  created_at: timestamp
}
```

---

## Core Workflows

### Workflow 1: ESG Facility Onboarding

```
ONBOARDING_FLOW:

1. Import from Document Intelligence Hub
   - Select facility with ESG provisions
   - System pulls extracted ESG clauses
   - Creates esg_facility record

2. Configure KPIs (for SLLs)
   - Review extracted KPIs
   - Add measurement details
   - Set baseline values
   - Configure targets and margin ratchet

3. Configure Use of Proceeds (for Green/Social)
   - Define eligible categories
   - Set allocation requirements
   - Define impact metrics

4. Set Up Reporting
   - Define reporting requirements
   - Link to Compliance Tracker
   - Set reminder schedules

5. Establish Verification Process
   - Define verification requirements
   - Pre-approve verifiers (if applicable)
   - Set verification timeline
```

### Workflow 2: KPI Performance Tracking

```
KPI_TRACKING_FLOW:

1. Data Collection
   Options:
   a. Manual Entry
      - Borrower logs into dashboard
      - Enters KPI values with supporting data
      - Uploads documentation
      
   b. Data Import
      - Upload standardized template
      - System parses and validates
      - Maps to KPIs
      
   c. API Integration (future)
      - Connect to borrower systems
      - Automated data feed
      - Real-time tracking

2. Calculation
   - System calculates:
     - Performance vs. baseline
     - Performance vs. target
     - Margin adjustment (if applicable)
   - Flags anomalies for review

3. Verification (if required)
   - Submit to external verifier
   - Verifier reviews and confirms
   - Verification report uploaded
   - Status updated

4. Result Finalization
   - Performance result confirmed
   - Margin adjustment triggered
   - Stakeholders notified

5. Reporting
   - Performance reflected in dashboard
   - Included in periodic reports
   - Historical trend updated
```

### Workflow 3: Proceeds Allocation Tracking

```
ALLOCATION_FLOW:

1. Record Drawdown
   - Link to facility disbursement
   - Capture amount drawn

2. Allocate to Projects
   - Select eligible category
   - Enter project details
   - Record allocation amount
   - Upload supporting documentation

3. Track Unallocated
   - System calculates unallocated balance
   - Monitor temporary investment
   - Alert if allocation deadline approaching

4. Report Impact
   - Enter impact metrics for projects
   - System aggregates across portfolio
   - Compare to expectations

5. Verify Allocation
   - Periodic verification of eligibility
   - Confirm funds used as intended
   - Update allocation status
```

### Workflow 4: ESG Report Generation

```
REPORT_GENERATION_FLOW:

1. Select Report Type
   - KPI Performance Report
   - Allocation Report
   - Impact Report
   - Annual Sustainability Summary

2. Define Parameters
   - Reporting period
   - Facilities to include
   - Metrics to highlight

3. Auto-Generate Content
   - System pulls data from database
   - LLM structures narrative sections
   - Charts and tables generated

4. Review and Edit
   - User reviews generated content
   - Makes edits as needed
   - Adds commentary

5. Export and Submit
   - Export in required format
   - Submit through Compliance workflow
   - Archive for records
```

### Workflow 5: Margin Adjustment Calculation

```
MARGIN_ADJUSTMENT_FLOW:

1. Test Date Trigger
   - System identifies upcoming margin test dates
   - Alerts relevant parties

2. Collect Final Data
   - Ensure all KPI data entered
   - Verification complete (if required)

3. Calculate Adjustment
   - For each KPI:
     - Compare actual to target
     - Apply pass/fail criteria
     - Calculate individual adjustment
   - Aggregate across KPIs (if weighted)
   - Determine net margin adjustment

4. Apply Adjustment
   - Record new margin
   - Notify lenders
   - Update interest calculations

5. Document
   - Full calculation audit trail
   - Supporting evidence linked
   - Confirmation to all parties
```

---

## Dashboard Views

```
DASHBOARD_VIEWS:

1. Portfolio Overview
   - Total ESG exposure by type
   - KPI performance summary (pie chart: on track / at risk / missed)
   - Upcoming measurement dates
   - Recent activity feed

2. Facility Deep Dive
   - All KPIs for selected facility
   - Performance trend charts
   - Target trajectory visualization
   - Margin adjustment history
   - Document repository

3. KPI Analytics
   - Cross-portfolio KPI comparison
   - Benchmark against industry
   - Performance trends over time
   - Correlation analysis

4. Allocation Tracker (Green/Social)
   - Total proceeds vs. allocated
   - Allocation by category
   - Project pipeline
   - Unallocated balance trend

5. Impact Dashboard
   - Aggregated impact metrics
   - Carbon avoided/reduced
   - Social impact statistics
   - SDG alignment mapping

6. Verification Status
   - Pending verifications
   - Completed verifications
   - Verification timeline
   - Verifier performance

7. Reporting Calendar
   - Upcoming report deadlines
   - Report status tracking
   - Historical report archive
```

---

## API Endpoints

```
ENDPOINTS:

# ESG Facilities
GET    /api/esg/facilities                           # List ESG facilities
POST   /api/esg/facilities                           # Add ESG facility
GET    /api/esg/facilities/:id                       # Get facility detail
PUT    /api/esg/facilities/:id                       # Update facility
POST   /api/esg/facilities/:id/sync                  # Sync from Document Hub

# KPIs
GET    /api/esg/facilities/:id/kpis                  # List KPIs
POST   /api/esg/facilities/:id/kpis                  # Add KPI
GET    /api/esg/kpis/:kid                            # KPI detail
PUT    /api/esg/kpis/:kid                            # Update KPI
DELETE /api/esg/kpis/:kid                            # Remove KPI

# Targets
GET    /api/esg/kpis/:kid/targets                    # List targets
POST   /api/esg/kpis/:kid/targets                    # Add target
PUT    /api/esg/targets/:tid                         # Update target

# Performance
GET    /api/esg/kpis/:kid/performance                # Performance history
POST   /api/esg/kpis/:kid/performance                # Submit performance
GET    /api/esg/performance/:pid                     # Performance detail
PUT    /api/esg/performance/:pid                     # Update performance
POST   /api/esg/performance/:pid/verify              # Submit for verification
PUT    /api/esg/performance/:pid/verification       # Update verification status

# Use of Proceeds
GET    /api/esg/facilities/:id/proceeds-categories   # List categories
POST   /api/esg/facilities/:id/proceeds-categories   # Add category
GET    /api/esg/facilities/:id/allocations           # List allocations
POST   /api/esg/facilities/:id/allocations           # Add allocation
PUT    /api/esg/allocations/:aid                     # Update allocation
GET    /api/esg/facilities/:id/unallocated           # Get unallocated

# Ratings
GET    /api/esg/facilities/:id/ratings               # Facility ratings
POST   /api/esg/ratings                              # Add rating
PUT    /api/esg/ratings/:rid                         # Update rating

# Reports
GET    /api/esg/facilities/:id/report-requirements   # Report requirements
GET    /api/esg/facilities/:id/reports               # Submitted reports
POST   /api/esg/facilities/:id/reports               # Submit report
POST   /api/esg/facilities/:id/reports/generate      # Generate report
  body: { report_type, period_start, period_end, options }

# Margin Adjustment
GET    /api/esg/facilities/:id/margin-tests          # Margin test schedule
POST   /api/esg/facilities/:id/margin-tests/:mtid/calculate  # Calculate adjustment
GET    /api/esg/facilities/:id/margin-history        # Margin adjustment history

# Portfolio
GET    /api/esg/portfolio/summary                    # Portfolio ESG summary
GET    /api/esg/portfolio/analytics                  # Portfolio analytics
POST   /api/esg/portfolio/benchmark                  # Benchmark analysis
  body: { kpi_category, period }

# Dashboard
GET    /api/esg/dashboard                            # Dashboard data
GET    /api/esg/dashboard/alerts                     # ESG alerts
GET    /api/esg/dashboard/upcoming                   # Upcoming events
```

---

## Integration Points

```
INTEGRATIONS:

← FROM Document Intelligence Hub:
  - ESG provisions extraction
  - KPI definitions
  - Margin ratchet mechanics
  - Reporting requirements
  - Clause references

← FROM Compliance Tracker:
  - ESG reporting deadlines
  - Compliance event creation
  - Deadline management
  - Submission tracking

→ TO Compliance Tracker:
  - Create compliance events for ESG reports
  - Link verification requirements
  - Alert on missed KPIs

→ TO Trade Due Diligence:
  - ESG performance history
  - Current ESG status
  - Verification status
  - Rating information
```

---

## LLM Integration

```
LLM_USAGE:

1. KPI Definition Assistance
   - Input: Raw KPI text from document
   - Output: Structured KPI definition with measurement guidance

2. Report Generation
   - Input: Performance data, facility context
   - Output: Narrative report sections
   - Follows SLLP/GLP reporting frameworks

3. Methodology Interpretation
   - Input: User question about calculation methodology
   - Output: Explanation with examples

4. Benchmarking Insights
   - Input: KPI performance data
   - Output: Comparison to industry standards, peer analysis

5. ESG News Monitoring (future)
   - Input: Borrower name
   - Output: Relevant ESG news and controversies

6. Gap Analysis
   - Input: Current KPIs vs. framework requirements
   - Output: Gaps and recommendations
```

---

## External Verifier Integration

```
VERIFIER_WORKFLOW:

1. Verifier Account Types
   - External verifier organizations
   - Read access to assigned facilities
   - Can update verification status
   - Can upload verification reports

2. Verification Request Flow
   - Borrower/Lender initiates request
   - System sends data package to verifier
   - Verifier reviews in platform (or externally)
   - Verifier confirms/rejects with notes
   - Report uploaded and linked

3. Acceptable Verifiers Registry
   - Pre-approved verifier list
   - Verifier qualifications
   - Track record and ratings
```

---

## Notifications

```
NOTIFICATION_RULES:

kpi_measurement_due:
  - Notify: Borrower
  - Timing: 30, 14, 7 days before measurement date

kpi_data_submitted:
  - Notify: Lender, Agent

kpi_target_at_risk:
  - Notify: Borrower, Lender
  - Trigger: Projection shows likely miss

kpi_target_missed:
  - Notify: All parties
  - Priority: High

margin_adjustment_applied:
  - Notify: All parties

verification_required:
  - Notify: Borrower, Verifier
  - Timing: On measurement, reminder at 7 days

verification_complete:
  - Notify: All parties

esg_report_due:
  - Notify: Borrower
  - Timing: Standard compliance schedule

allocation_deadline_approaching:
  - Notify: Borrower
  - Trigger: Unallocated proceeds and deadline near

esg_rating_change:
  - Notify: Lender
  - Trigger: External rating updated
```

---

## Standard KPI Library

```
KPI_LIBRARY:

Environmental - Emissions:
  - Scope 1 GHG Emissions (tCO2e)
  - Scope 2 GHG Emissions (tCO2e)
  - Scope 3 GHG Emissions (tCO2e)
  - Carbon Intensity (tCO2e/revenue)
  - Carbon Intensity (tCO2e/unit produced)

Environmental - Energy:
  - Total Energy Consumption (MWh)
  - Renewable Energy Percentage (%)
  - Energy Intensity (MWh/unit)

Environmental - Water:
  - Total Water Withdrawal (m³)
  - Water Recycling Rate (%)
  - Water Intensity (m³/unit)

Environmental - Waste:
  - Total Waste Generated (tonnes)
  - Recycling Rate (%)
  - Hazardous Waste (tonnes)

Social - Workforce:
  - Gender Diversity - Board (%)
  - Gender Diversity - Management (%)
  - Gender Diversity - Workforce (%)
  - Employee Training Hours (hours/employee)
  - Employee Turnover Rate (%)

Social - Health & Safety:
  - Lost Time Injury Rate
  - Total Recordable Incident Rate
  - Fatalities (count)

Social - Community:
  - Community Investment ($)
  - Local Employment (%)

Governance:
  - Board Independence (%)
  - ESG Committee Existence (Y/N)
  - Sustainability Report Published (Y/N)
  - Third-Party ESG Audit (Y/N)
```

---

## Success Criteria

1. KPI data entry time < 5 minutes per facility
2. Margin calculation accuracy: 100%
3. Automated report generation < 30 seconds
4. Portfolio ESG summary available in real-time
5. Verification workflow completion tracking
6. Full audit trail for all ESG data
7. Support for 1000+ KPIs across portfolio
8. Integration with major ESG data providers (future)
