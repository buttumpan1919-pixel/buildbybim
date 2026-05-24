# Pojjaman-Grade ERP Gap Roadmap

Updated: 2026-05-24
Status: Decision note after BUILK TV + Pojjaman ERP research
Related:
- `docs/BUILK_TV_YOUTUBE_RESEARCH.md`
- `docs/POJJAMAN_CODEX_REFERENCE.md`
- `docs/POJJAMAN_ERP_RESEARCH.md`
- `docs/ERP_ADAPTATION_PLAN.md`
- `docs/BUILK_PARITY_PLAN.md`
- `docs/PROCUREMENT_PRD.md`
- `docs/CASHFLOW_PROJECT_EXTENSION_PRD.md`
- `docs/PROJECT_CONTROL_PRD.md`

## 1. Executive Read

Pojjaman is not just a bigger Builk. It is a full project-based ERP where accounting, approval, procurement, inventory, and project reporting are connected.

For Buildbybim.space, the correct strategy is:

```text
Builk parity = MVP workflow
Pojjaman = full ERP north star
Buildbybim advantage = easier start + AI + design/BOQ/site evidence layer
```

Do not try to implement a full Pojjaman clone. Build the smallest ERP path that proves value:

```text
Project -> PR/RFQ/PO -> Cost/Cashflow -> Dashboard -> Approval/Audit
```

Then add inventory, AP/AR, and accounting export.

Current implementation note:

`docs/TASKS.md` now marks Sprint 4 RFQ comparison/award, Sprint 5 cashflow rollup core, and Sprint 6 project dashboard/reports as done. The next practical implementation cycle should start at Sprint 7 approval + audit. See `docs/ERP_ADAPTATION_PLAN.md` for the current-project adaptation.

## 2. Current Buildbybim Status Against Pojjaman

| ERP area | Current status | Practical meaning |
|---|---|---|
| Project master | strong prototype | `projects` has financial fields, status, detail view |
| Cost code / CBS | strong prototype | `costCodes` exists with Thai seed and import/export |
| Suppliers | strong prototype | supplier directory + price history exists |
| PR | strong prototype | `procurement` has PR state machine and line items |
| RFQ | strong prototype | comparison matrix, response entry, award flow, and supplier price history are implemented |
| PO | partial | BuildDocs can create PO-like docs, but no committed-cost PO ledger yet |
| Cost recording | partial | `cashflow` exists, but not fully project/cost-code scoped |
| Project dashboard | strong prototype | `/project-control` exists with dashboard, alerts, cost breakdown, 5 reports, CSV export, print, and settings |
| Approval | weak | membership access exists, but document approval chain is not ERP-grade |
| Audit | weak | membership audit exists, but transaction/document audit is missing |
| Inventory | missing | no stock, receiving, site issue, or warehouse movement |
| AP/AR | weak | BuildDocs + cashflow exist, but no payable/receivable ledger |
| Financial close | missing | no accounting period, export package, or tax/auditor-ready bridge |
| Implementation service | concept only | support plans exist, but not packaged as ERP setup service |

## 3. Main Gaps That Matter

### Gap 1: Transaction spine is not complete

The system has project, cost code, supplier, PR, cashflow, and documents. The missing value is the connection between them.

Every transaction should carry:

- `workspaceId`
- `projectId`
- `costCodeId`
- `supplierId` or `clientId`
- `sourceDocumentId`
- `status`
- `amount`
- `committedAmount`
- `actualAmount`
- `approvedBy`
- `evidenceAssetIds`

Without this, dashboards will be decorative. With this, Buildbybim becomes a real ERP workspace.

### Gap 2: Cashflow is not yet project accounting

Cashflow currently answers: "เงินเข้า/ออกเท่าไหร่"

Pojjaman-grade ERP needs to answer:

- project นี้กำไร/ขาดทุนเท่าไหร่
- cost code ไหนเกินงบ
- committed cost เท่าไหร่
- actual cost เท่าไหร่
- ลูกหนี้ค้างรับเท่าไหร่
- เจ้าหนี้ค้างจ่ายเท่าไหร่
- เงินสดจะตึงใน 30/60/90 วันไหม

So the next major step is not a new app. It is `cashflow` extension + rollup.

### Gap 3: Approval is business control, not only permission

Current access control decides who can open apps.

ERP approval decides whether money can move.

Minimum approval objects:

- PR approval
- PO approval
- supplier quote award approval
- payable approval
- invoice/receipt approval
- budget override approval

Start with one approval model and reuse it.

### Gap 4: Inventory should wait until PO/cashflow is stable

Inventory is important, but building it too early will create isolated stock screens.

Inventory should begin only after:

```text
PO -> receiving -> site issue -> actual cost
```

is ready. Otherwise it will not affect cost control.

### Gap 5: Accounting bridge should export first, not replace accounting

Do not build a full accounting system immediately.

Better MVP:

- AR aging
- AP aging
- project P&L
- cashflow forecast
- accounting-ready CSV export
- document package for accountant/auditor

This is enough for small teams and does not create legal/accounting risk too early.

## 4. Recommended Next 6 Sprints

### Sprint 4: RFQ Matrix + Award

Goal: complete procurement decision flow.

Scope:

- create RFQ from approved PR
- invite 2-3 suppliers
- record supplier quote per item
- compare by price, lead time, note
- award supplier
- append supplier price history
- generate PO draft or BuildDocs bridge

Exit:

- user can start from PR and end with awarded supplier
- project committed cost updates from awarded RFQ/PO

### Sprint 5: Project Cost Recording + Cashflow Rollup

Goal: turn cashflow into project accounting seed.

Scope:

- add `projectId`, `costCodeId`, `supplierId`, `clientId`
- add `sourceType`: manual, PR, RFQ, PO, invoice, receipt
- add `entryStatus`: draft, confirmed, void
- compute project actual cost/revenue
- compute supplier spend
- add filters by project/cost code/supplier

Exit:

- project actual cost/revenue comes from confirmed entries
- dashboard data can be trusted

### Sprint 6: Project Dashboard + 5 Reports

Goal: prove ERP value to owner.

Reports:

- project P&L
- budget vs committed vs actual
- 90-day cashflow forecast
- supplier spend
- PR aging / pending approval

Exit:

- user can answer "โครงการไหนเสี่ยงขาดทุน"
- user can export report CSV/PDF/print

### Sprint 7: Approval + Audit Core

Goal: add business control.

Status: core implemented on 2026-05-24.

Scope:

- generic `ApprovalRequest`
- approval states: draft, submitted, approved, rejected, cancelled
- approval target: PR, RFQ award, PO, cashflow entry, invoice
- audit log per transition
- role scopes: owner, manager, procurement, accounting, site, viewer

Implemented:

- `src/approvals.ts` reusable approval state machine + sync helpers
- `/approvals` Approval Center app with Inbox / History / Rules
- PR approve/reject syncs back to `procurement`
- Cashflow approve/reject syncs draft entries to confirmed/void
- `supabase/migrations/0010_approval_requests.sql`

Exit:

- important money actions have approval trail
- audit log can answer who changed what and when

### Sprint 8: Evidence Asset Layer

Goal: prepare for site, 360, AI, and BIM without overbuilding.

Scope:

- generic `EvidenceAsset`
- link to project/task/defect/PR/PO/cashflow
- support photo, PDF, receipt, video, external 360 link
- capture date, note, location/zone

Exit:

- site proof and financial proof can attach to transactions
- later AI/OCR/360 can reuse the same model

### Sprint 9: Inventory Lite

Goal: add stock only where it affects project cost.

Scope:

- warehouse/site
- item master
- receipt from PO
- issue to project/cost code
- adjustment
- stock balance

Exit:

- material receiving and site issue can become actual cost
- no attempt to build enterprise warehouse management yet

## 5. Product Positioning After This Analysis

Use this internally:

```text
Buildbybim is not trying to be Pojjaman for enterprises.
Buildbybim is a lighter ERP workspace for teams before they need enterprise ERP,
with AI and design/site evidence workflows that Pojjaman-style systems do not start from.
```

Use this externally:

```text
เห็นตัวเลขโครงการ เอกสาร จัดซื้อ หน้างาน และเงินสดในที่เดียว
เริ่มง่ายกว่า ERP ใหญ่ และต่อยอดด้วย AI ได้
```

## 6. What Not To Build Yet

Do not build these before Sprint 6:

- full general ledger
- tax filing automation
- multi-level approval with complex routing
- supplier portal
- full 360 viewer
- full BIM viewer
- payroll
- manufacturing-style inventory
- full CRM automation

These are valid later, but too heavy before the core ERP transaction spine is trusted.

## 7. Decision

Recommended decision:

1. Continue from Sprint 6: project dashboard.
2. Then Sprint 7 approval/audit core.
3. Then Sprint 8 evidence asset layer.
4. After dashboard is useful, promote the product message from "tools hub" to "lightweight construction ERP workspace".

This creates a credible path from current prototype to ERP without jumping too early into enterprise accounting complexity.
