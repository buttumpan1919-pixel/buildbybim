# Buildbybim.space - Workflow Sequence Reference

Updated: 2026-05-24

Status: implementation handoff for the current ERP loop. This document describes what is already built and what each next module should preserve.

Use this with:

- `docs/IMPLEMENTED_ERD.md` for entities.
- `docs/DATA_DICTIONARY.md` for fields and enums.
- `docs/SUPABASE_SYNC_CONTRACT.md` for sync and mapper rules.

## 1. Current ERP Loop

This is the first complete project-cost control loop:

```mermaid
sequenceDiagram
  autonumber
  participant Owner as Owner or PM
  participant Project as Projects
  participant Cost as Cost Codes
  participant Supplier as Suppliers
  participant PR as Procurement PR
  participant Approval as Approval Center
  participant RFQ as RFQ
  participant Cashflow as Cashflow
  participant Control as Project Control

  Owner->>Project: Create project with planned cost and revenue
  Owner->>Cost: Use seed/custom cost code catalog
  Owner->>Supplier: Add supplier directory and price history
  Owner->>PR: Create PR with project, cost code, supplier hint
  PR->>Approval: Submit PR approval request
  Approval-->>PR: Approve or reject and sync source status
  PR->>RFQ: Create RFQ from approved PR
  RFQ->>Supplier: Invite suppliers and record responses
  RFQ->>RFQ: Compare item quotes and award supplier
  RFQ-->>Supplier: Append supplier price history
  Owner->>Cashflow: Confirm actual expense or income
  Cashflow-->>Project: Recompute actual cost and revenue
  Project->>Control: Feed dashboard, alerts, and reports
```

Outcome: the user can see project budget, committed cost, actual cost, paid revenue, margin, stale PRs, and supplier spend from one flow.

## 2. Project Setup Flow

```mermaid
sequenceDiagram
  autonumber
  participant User
  participant ProjectsPanel
  participant ProjectsService as src/projects.ts
  participant Storage as StorageAdapter
  participant Supabase as SupabaseAdapter or localStorage

  User->>ProjectsPanel: Create or edit project
  ProjectsPanel->>ProjectsService: normalizeProjectListState and upsert
  ProjectsService->>ProjectsService: compute status, margin, budget flags
  ProjectsService->>Storage: write projects.list.v1
  Storage-->>Supabase: if cloud sync active, mirror key to kv_store
  ProjectsPanel-->>User: Show list/detail, cost tab, alerts
```

Rules:

- `code` should be unique per workspace.
- `plannedCost` and `plannedRevenue` are user inputs.
- `actualCost` and `actualRevenue` should be recomputed from confirmed cashflow where possible.
- Status can be user-set, but delayed indicators should be derived from dates and budget state in reports.

## 3. Purchase Request Approval Flow

```mermaid
sequenceDiagram
  autonumber
  participant Requester
  participant ProcurementUI as ProcurementPanel
  participant PRService as src/procurement.ts
  participant ApprovalService as src/approvals.ts
  participant Audit as src/membership.ts audit
  participant Storage

  Requester->>ProcurementUI: Create PR draft
  ProcurementUI->>PRService: validatePR
  PRService-->>ProcurementUI: valid or field errors
  Requester->>ProcurementUI: Submit PR
  ProcurementUI->>PRService: applyPRAction submit
  PRService->>Storage: save procurement.pr.v1
  ProcurementUI->>ApprovalService: sync approval request targetType pr
  ApprovalService->>Storage: save approvals.requests.v1
  Requester->>ApprovalService: Approve or reject in Approval Center
  ApprovalService->>PRService: apply source sync to PR
  ApprovalService->>Audit: appendAuditEntry
  ApprovalService->>Storage: save approval event and source state
```

Acceptance rules:

- PR cannot submit without `projectId` and at least one valid line item.
- Only `submitted` PR should be actionable in the approval inbox.
- Approve maps PR to `approved`.
- Reject maps PR to `rejected` and requires a reason.
- Every decision must append `ApprovalEvent`.
- Source sync should write an audit entry because it changes business state.

## 4. RFQ Compare and Award Flow

```mermaid
sequenceDiagram
  autonumber
  participant QS
  participant PR as PR State
  participant RFQService as src/procurement.ts RFQ
  participant SupplierService as src/suppliers.ts
  participant Storage

  QS->>PR: Select approved PR
  QS->>RFQService: draftRFQFromPR
  RFQService->>Storage: save procurement.rfq.v1
  QS->>RFQService: Send RFQ to invited suppliers
  QS->>RFQService: Record supplier responses
  RFQService->>RFQService: recomputeRFQStatus
  QS->>RFQService: buildComparisonMatrix
  QS->>Evidence: Check rfq_award policy and direct RFQ evidence
  QS->>RFQService: awardRFQ with supplier and reason
  RFQService-->>PR: Return PR advanced to awarded
  RFQService-->>SupplierService: Return priceHistoryAppendages
  SupplierService->>Storage: append supplier price history
  RFQService->>Storage: save RFQ and PR
```

Acceptance rules:

- RFQ should start only from approved PR.
- Response can be recorded only for invited suppliers.
- Award requires supplier, matching PR, response present, and reason.
- Award also checks `evidence.approval-policy.v1`; default blocks high-value RFQ awards without direct verified evidence linked to the RFQ.
- Award updates RFQ, advances PR, and appends supplier price history.

## 5. Cashflow and Project Actuals Flow

```mermaid
sequenceDiagram
  autonumber
  participant User
  participant CashflowUI as CashflowPanel
  participant Cashflow as src/cashflow.ts
  participant Rollup as src/cashflow.rollup.ts
  participant Projects as src/projects.ts
  participant Suppliers as src/suppliers.ts
  participant Storage

  User->>CashflowUI: Add draft income or expense
  CashflowUI->>Cashflow: normalizeCashflowEntry
  User->>CashflowUI: Confirm entry
  CashflowUI->>Cashflow: save cashflow.entries.v1
  CashflowUI->>Rollup: syncProjectsFromCashflow
  Rollup-->>Projects: Update actualCost and actualRevenue
  CashflowUI->>Rollup: syncSupplierPriceHistoryFromCashflow
  Rollup-->>Suppliers: Upsert cashflow-price entry when eligible
  Projects->>Storage: save projects.list.v1
  Suppliers->>Storage: save suppliers.directory.v1
```

Rules:

- Only `confirmed` entries affect actual project totals.
- `draft` entries remain forecast or pending review.
- `void` entries should not affect rollups.
- Expense with `supplierId + costCodeId` can produce supplier price history.
- Income should update project revenue, not supplier price history.

## 6. Project Control Reporting Flow

```mermaid
sequenceDiagram
  autonumber
  participant User
  participant UI as ProjectControlPanel
  participant Control as src/projectControl.ts
  participant Projects
  participant PR
  participant Cashflow
  participant Suppliers
  participant CSV as src/csvExport.ts

  User->>UI: Open dashboard or reports
  UI->>Projects: loadProjects
  UI->>PR: loadPRState
  UI->>Cashflow: loadCashflowState
  UI->>Suppliers: loadSupplierState
  UI->>Control: computeProjectSnapshot
  Control-->>UI: KPIs, cost code rollups, alerts
  User->>UI: Generate report
  UI->>Control: generateReport
  Control-->>UI: table rows
  User->>CSV: Download CSV or print
```

Reports implemented:

- `project_pl`
- `cashflow_forecast`
- `cost_variance`
- `supplier_spend`
- `pr_aging`

Project Control is read-only except `project-control.settings.v1`.

## 7. Approval Center Sync Flow

```mermaid
sequenceDiagram
  autonumber
  participant Source as Source App
  participant Approval as src/approvals.ts
  participant Target as PR or Cashflow
  participant Audit as Audit Log
  participant Storage

  Source->>Approval: createOrSyncApprovalRequest
  Approval->>Storage: save approvals.requests.v1
  Approval->>Source: Check evidence approval policy and direct verified EvidenceAsset
  Approval->>Approval: applyApprovalAction
  Approval->>Approval: append ApprovalEvent
  Approval->>Target: sync decision to source object
  Approval->>Audit: appendAuditEntry
  Approval->>Storage: save source and approval state
```

Important distinction:

- `approval_events` is the timeline inside an approval request.
- `audit_logs` is the workspace-level audit trail for governance and admin review.
- Evidence gate is active in Approval Center and Procurement RFQ award: `off | warn | block` can be configured by minimum amount and target type. Default blocks PR, RFQ award, and Cashflow decisions at or above 50,000 THB when no direct verified evidence is linked to the source transaction.

## 8. Supabase Cloud Sync Flow

```mermaid
sequenceDiagram
  autonumber
  participant UI
  participant Domain as Domain Module
  participant Adapter as StorageAdapter
  participant Local as localStorage
  participant Cloud as SupabaseAdapter
  participant KV as kv_store
  participant Mapper as Future Relational Mapper

  UI->>Domain: save state
  Domain->>Adapter: write storage key
  Adapter->>Local: update local cache
  Adapter->>Cloud: debounce push if enabled
  Cloud->>KV: upsert workspace_id + key + value
  Mapper-->>KV: read JSON key in Phase D
  Mapper-->>Mapper: normalize and diff rows
  Mapper-->>Cloud: upsert relational tables
```

Current truth: cloud sync is key-level JSON in `kv_store`.

Future truth: relational mappers should populate high-value tables while keeping local-first cache for offline and fast UI.

## 9. Required Audit Points

Add audit events for:

1. Approval decisions that mutate source status.
2. Import operations that create or update many records.
3. Delete or archive actions.
4. Cloud pull that overwrites local data.
5. Payment/subscription/app access changes.
6. Agent actions that create, approve, export, send, or delete data.

## 10. Evidence Asset Flow

Evidence Asset Layer is now implemented as `/evidence`. It links real-world proof to the existing ERP loop.

```mermaid
sequenceDiagram
  autonumber
  participant User
  participant EvidenceUI as EvidencePanel
  participant Evidence as src/evidence.ts
  participant Source as Project/PR/RFQ/Cashflow
  participant Storage
  participant Report as CSV Export

  User->>EvidenceUI: Add receipt, photo, quote, invoice, or metadata
  EvidenceUI->>Evidence: validateEvidenceAsset and normalize links
  Evidence->>Storage: save evidence.assets.v1
  EvidenceUI->>Source: Link by project, cost code, supplier, PR, RFQ, or cashflow ID
  User->>EvidenceUI: Verify, reject, archive, or delete
  EvidenceUI->>Evidence: setEvidenceStatus or removeEvidenceAsset
  User->>Report: Export filtered evidence CSV
```

This fills the main ERP gap before deeper accounting: every cost, quote, payment, defect, and invoice can have evidence.

Current workflow rule: Approval Center and RFQ award can now hard-block covered decisions without direct verified evidence. Next step is to persist evidence policy relationally and add project/app/role dimensions.
