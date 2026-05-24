# ERP Adaptation Plan For Buildbybim.space

Updated: 2026-05-24
Status: Current-project adaptation after BUILK TV + Pojjaman ERP benchmark
Primary benchmark reference: `docs/POJJAMAN_CODEX_REFERENCE.md`

## 1. What To Copy From Pojjaman/BUILK

Do not copy the whole enterprise ERP. Copy the operating logic:

```text
Project -> Cost Code -> Supplier -> PR -> RFQ -> PO -> Cashflow -> Project Dashboard -> Approval/Audit
```

For Buildbybim.space this means the product should become a lightweight construction ERP workspace, not a generic app hub.

## 2. Current Repo Fit

| ERP block | Current repo status | What it means |
|---|---|---|
| Project master | Implemented prototype | `projects` is already the anchor for job-level data |
| Cost code / CBS | Implemented prototype | `costCodes` can become the cost-control spine |
| Supplier directory | Implemented prototype | `suppliers` already has price history |
| PR | Implemented prototype | `procurement` has PR workflow and state machine |
| RFQ | Implemented prototype | Sprint 4 is done: comparison matrix, responses, award, price history |
| PO | Partial | BuildDocs can hold PO-like documents, but no committed-cost ledger yet |
| Cashflow | Implemented core rollup | `cashflow` now supports project/costCode/supplier/source linkage and project actual cost/revenue rollup |
| Project dashboard | Spec only | `PROJECT_CONTROL_PRD.md` exists, implementation pending |
| Approval/audit | Partial | membership audit exists; ERP approval needs reusable business approval |
| Inventory | Missing | Should wait until PO -> receiving -> actual cost is stable |
| Accounting bridge | Missing | Start with CSV/export package, not full GL |

## 3. Adaptation Strategy

### A. Turn existing modules into one transaction spine

Every money-related record should share these references:

- `workspaceId`
- `projectId`
- `costCodeId`
- `supplierId` or `clientId`
- `sourceType`
- `sourceDocumentId`
- `status`
- `amount`
- `createdBy` / `approvedBy`

This is what turns separate tools into ERP data.

### B. Make Cashflow the actual-cost ledger

Next implementation should extend `cashflow.entries.v1` instead of creating another accounting app.

Required fields:

- `costCodeId`
- `supplierId`
- `prId`
- `rfqId`
- `poDocumentId`
- `quantityActual`
- `unitActual`

Result:

- confirmed expense = actual project cost
- confirmed income = actual project revenue
- draft = pending accounting review
- dashboard can compute real project P&L

### C. Use RFQ award as committed cost

Current RFQ award flow should feed the next layer:

```text
Awarded RFQ -> PO draft -> committed cost -> receiving -> draft cashflow -> confirmed actual cost
```

Until PO is fully integrated, the fallback can be:

- awarded RFQ creates PO summary for BuildDocs
- user confirms received/paid manually
- system creates linked cashflow draft

### D. Build Project Control after cashflow rollup

Do not build dashboard before the rollup is reliable.

Project Control should answer:

- budget เท่าไหร่
- committed เท่าไหร่
- actual เท่าไหร่
- เหลือเท่าไหร่
- หมวดไหนเสี่ยงเกินงบ
- supplier ไหนใช้เงินเยอะ
- PR/RFQ ไหนค้าง

## 4. Recommended Next Implementation Order

1. Sprint 5: Cashflow Project Extension + Rollup (done: core)
   - extend `src/cashflow.ts`
   - add `src/cashflow.rollup.ts`
   - add project/costCode/supplier filters in `CashflowPanel`
   - sync confirmed entries back to `Project.actualCost` / `Project.actualRevenue`
   - add Supabase migration `0008_cashflow_extension.sql`

2. Sprint 6: Project Control Dashboard
   - status: core implemented on 2026-05-24
   - add `src/projectControl.ts`
   - add app `projectControl` in `src/apps.ts`
   - create `/project-control`
   - ship 5 reports: Project P&L, Cashflow Forecast, Cost Variance, Supplier Spend, PR Aging

3. Sprint 7: Approval + Audit Core
   - status: core implemented on 2026-05-24
   - create reusable `ApprovalRequest`
   - attach approval to PR, RFQ award, PO, cashflow entry, invoice
   - reuse membership audit as the low-level log, but add business-target fields
   - route `/approvals` ships Inbox / History / Rules

4. Sprint 8: Evidence Asset Layer
   - create generic file/photo/PDF/receipt/360-link attachment model
   - link evidence to project, defect, PR/RFQ/PO, cashflow, invoice
   - prepare for AI OCR and site evidence

5. Sprint 9: Inventory Lite
   - add item master, receiving, site issue, adjustment, stock balance
   - only build inventory actions that affect project cost

## 5. How We Become Easier Than Pojjaman

The product should not compete as "bigger ERP". It should compete as "ERP that starts easier".

Practical rules:

- First screen should show project health, not a large accounting menu.
- User should see value in 10-15 minutes: create project -> add cost -> see budget/actual/remaining.
- Use Thai contractor language: งบ, ใช้ไป, เหลือ, เกินงบ, รอจ่าย, รอรับเงิน.
- Keep 3-5 main workflows visible first: Project, Cost Codes, Suppliers, PR/RFQ, Cashflow.
- Hide enterprise features until needed: GL, tax filing, multi-level approval, inventory warehouse complexity.
- Use AI only where it reduces input work: read quote, suggest cost code, summarize variance, draft report.

## 6. Target Outcome

After Sprint 5-6, Buildbybim.space should be able to say:

```text
สร้างโครงการ -> ขอซื้อ -> เทียบราคา -> เลือก supplier -> บันทึกจ่ายจริง -> เห็นกำไร/ขาดทุนโครงการ
```

That is the first credible ERP loop.

## 7. Current Decision

RFQ and cashflow rollup core are already implemented. Do not spend the next cycle on another procurement rewrite or another cashflow-only refactor.

Current status:

```text
Sprint 5 cashflow rollup core is implemented.
Next move: Sprint 6 project dashboard.
```

This is the shortest path from the current repo to a usable ERP result.

## 8. Pojjaman-Derived Strategic Opportunities

From `docs/POJJAMAN_CODEX_REFERENCE.md`, the best market gaps for Buildbybim are:

- API-first / headless-ready data contracts
- self-serve onboarding instead of sales-led implementation only
- transparent starter pricing and support packages
- plugin/template ecosystem for reports, cost codes, document forms, and industry packs
- AI-native data entry: quotation, receipt, cost-code suggestion, variance explanation
- narrower vertical slices before full ERP: small contractor, interior, architect-led design-build, QS, solar installer

Use these as product strategy, not as reasons to overbuild enterprise accounting too early.
