# Pojjaman ERP - Codex Reference Document

Updated: 2026-05-24
Status: User-provided reference for future Codex analysis and implementation planning
Verification note: This document captures the supplied analysis summary. Re-check Pojjaman's live site before quoting current marketing claims, pricing, security, or contact details externally.

## 1. Product Identity

| Field | Summary |
|---|---|
| Name meaning | Project Accounting Management |
| Positioning | Cloud ERP for project-based businesses |
| Tagline | Business Intelligence ERP for Project-Based Organizations |
| Main claim | Thai ERP designed specifically for construction/project industries |
| Site | `pojjaman.com` marketing site; app is separate |

## 2. Target Markets

| Vertical | URL slug | Domain-specific strength |
|---|---|---|
| Construction | `/construction-erp/` | BOQ, subcontract, progress billing |
| Real Estate | `/real-estate-erp/` | pre-sales, Ploy CRM, unit-level cost |
| Energy | `/erp-energy-business/` | installation tracking, solar project control |
| Media / Event / Agency | `/event-agency-organizer-erp/` | timesheet, freelance management, petty cash |
| Software Development | `/software-house-business-erp/` | project tracking |

## 3. Target Personas

- Business Owner: dashboard, real-time overview, growth control.
- Project Owner / PM: cost control, progress, budget risk.
- Procurement: PR, PO, RFQ, vendor comparison.
- Inventory: multi-site stock, warehouse/site issue.
- Accounting & Finance: GL, AR/AP, financial close.

## 4. Inferred System Architecture

### Layer 1: Foundation

- Cloud-native multi-tenant SaaS
- Role-Based Access Control (RBAC)
- Cloud document management
- Audit trail / logging
- Centralized approval workflow engine

### Layer 2: Core Business Modules

- General Ledger / Chart of Accounts
- Accounts Receivable (AR)
- Accounts Payable (AP)
- Procurement: PR / PO / RFQ / vendor comparison
- Inventory and multi-warehouse
- Cashflow and budget control
- Project master and cost code hierarchy

### Layer 3: Industry Add-ons

- Construction: BOQ, subcontract, progress billing, job costing
- Real Estate: booking to contract to transfer, Ploy CRM, unit master
- Energy: installation progress, equipment tracking, maintenance
- Media/Event: timesheet, freelance vendor, campaign budget, advance/petty cash

### Layer 4: Cross-Cutting Services

- Pojjaman APP for mobile approval
- PJM Task Center as universal approval inbox
- Real-time dashboard and BI
- E-procurement and RFQ portal

## 5. Key Data Model Concept

Project is the primary dimension of every transaction.

```text
Company
  -> Project
    -> Sub-Project / Phase / Unit / Building / Floor
      -> Cost Code
        -> Activity
          -> Transaction Line tagged with Project ID
```

Enterprise concept:

- Encumbrance / budget reservation: budget is reserved before actual payment.
- This lets the system show committed cost and budget availability before cash leaves the company.

## 6. Workflow Engine

Pojjaman's approval model appears configurable by:

```text
Document Type x Amount Limit x Project x Department x Role
```

Expected behavior:

- route document to approver hierarchy
- consolidate pending approvals in PJM Task Center
- approve via mobile app
- keep approval and audit history

## 7. Implementation Methodology

1. Plan & Scope: define goals and implementation scope
2. Discover: create business blueprint
3. Develop: configure system from blueprint
4. Deploy: migrate data and run UAT
5. Deliver: go-live and support

Typical timeline: 3-6 months, shortened by template-driven configuration compared with custom software development.

## 8. Business Model

| Area | Pattern |
|---|---|
| Type | High-touch enterprise software |
| Pricing | per-seat license + implementation fee + monthly subscription |
| Sales | direct sales and demo request |
| Public pricing | not public |
| Free trial / self-signup | not positioned as self-serve |

## 9. Key Selling Points

- Standard workflow
- Real-time accounting
- Project cost control
- Cloud security and log
- Business growth credibility: IPO-ready, auditor-accepted positioning

## 10. Customer Outcome Patterns

Observed testimonial pattern:

- Manage more projects with the same back-office team.
- Grow revenue without proportional admin hiring.
- Scale from smaller project volume into larger contracts.

Examples from supplied summary:

- Master Plan 101: 3-4 houses to 40-50 houses with same team
- Creeful Interior: revenue 500M to 1,000M with same team
- EM Group / The Megawatt: 3x revenue growth
- Construction Lines: billion-baht annual work

Common theme:

```text
Scale operations without scaling back-office headcount at the same rate.
```

## 11. Strengths

- Project-centric data model
- Approval-centric mobile UX
- Deep domain template per industry
- Front-office to back-office integration
- Audit trail and cloud controls
- Template-driven configuration
- Encumbrance accounting / committed-cost control

## 12. Weaknesses / Constraints

- Closed ecosystem: no obvious public API docs or developer portal
- No public marketplace or partner app network
- User-based license may restrict broad adoption
- Vendor lock-in through Pojjaman-led customization
- Enterprise-level implementation cost
- No self-serve onboarding or free trial path
- Security certifications, tech stack, SLA, and uptime are not publicly obvious from the supplied summary

## 13. Differentiation

| Competitor | Difference |
|---|---|
| BUILK | BUILK is free/single-purpose cost control; Pojjaman is full ERP suite |
| Express / Formula / BPlus | General accounting lacks project P&L depth; Pojjaman is project P&L real-time |
| SAP B1 / NetSuite | Foreign ERP is generic and expensive; Pojjaman is localized Thai + industry template |

## 14. Opportunities For Buildbybim.space

The market opening is not to be a larger Pojjaman. The opening is to be easier, more open, and more AI-native.

### A. API-first / Headless ERP

Pojjaman appears closed. Buildbybim can later expose clear data contracts:

- `Project`
- `CostCode`
- `PR`
- `RFQ`
- `PO`
- `CashflowEntry`
- `ApprovalRequest`
- `EvidenceAsset`

### B. Self-Serve Onboarding

Pojjaman is sales-led. Buildbybim can start with:

```text
create project -> choose cost-code template -> add first cost -> see dashboard
```

Target activation time: 10-15 minutes.

### C. Transparent Pricing

Thai ERP market often hides pricing. Buildbybim can offer:

- free local workspace / starter tools
- support monthly
- setup package
- implementation service
- later SaaS tier

### D. Plugin / Marketplace Direction

Future opportunity:

- cost-code template packs
- report templates
- document templates
- supplier import adapters
- industry packs: contractor, interior, solar, real estate unit, agency

### E. AI-Native ERP

Use AI to reduce input work:

- quotation image -> RFQ response
- receipt/photo -> draft cashflow entry
- description -> cost code suggestion
- variance -> explanation
- project status -> owner report

### F. Vertical Slice Focus

Start narrower than Pojjaman:

- small contractor
- interior contractor
- architect-led design-build studio
- QS/estimator
- solar installer

## 15. Buildbybim Implementation Implications

Current Buildbybim ERP path:

```text
Project -> Cost Code -> Supplier -> PR -> RFQ -> Cashflow Rollup -> Project Dashboard
```

Next high-value moves:

1. Project Control Dashboard: budget, committed, actual, remaining, over-budget alerts.
2. Approval Request Core: reusable approval for PR, RFQ award, PO, cashflow, invoice.
3. Evidence Asset Layer: attach proof to project, defect, PR/RFQ/PO, cashflow, invoice.
4. PO / receiving bridge: awarded RFQ -> PO -> receiving -> draft cashflow.
5. Accounting export package: AP/AR aging, project P&L, CSV export for accountant.

## 16. Codex Usage Rules

- Treat Pojjaman as the enterprise north star, not a clone target.
- Keep Buildbybim's advantage: self-serve, lightweight, AI-assisted, design/BOQ/site-evidence aware.
- Do not build GL, tax filing, or complex inventory before project dashboard + approval core.
- Prefer existing repo patterns: local-first storage adapter, `src/apps.ts` manifest, workspace route/subnav helpers, TH/EN copy.
- Before coding, re-check `docs/TASKS.md`, `docs/ERP_ADAPTATION_PLAN.md`, and current source files because implementation is moving quickly.

## 17. Reference Contact

From supplied summary:

- Phone: `02-026-6856`
- Website: `https://www.pojjaman.com/`
- Demo: contact form
- Resources: `/article/`
- Case studies: `/success-by-pojjaman/`
