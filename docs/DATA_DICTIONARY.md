# Buildbybim.space - Data Dictionary

Updated: 2026-05-24

Status: implementation handoff for the current ERP core. This document reflects the local TypeScript modules and Supabase migrations `0001`-`0012`.

Use this with:

- `docs/IMPLEMENTED_ERD.md` for relationships.
- `docs/WORKFLOW_SEQUENCE.md` for business flows.
- `docs/SUPABASE_SYNC_CONTRACT.md` for local-first to Supabase sync rules.
- `supabase/migrations/*.sql` for exact SQL definitions.

## 1. Current Data Architecture

The app is still local-first.

```text
UI -> domain module -> storageAdapter -> localStorage
                                  -> SupabaseAdapter -> kv_store
```

Relational Supabase tables already exist for the ERP core, but the current `SupabaseAdapter` writes JSON state by storage key into `kv_store`. Phase D must add per-key relational mappers before reports can query Supabase tables directly.

## 2. Global Conventions

| Convention | Rule |
|---|---|
| Tenant boundary | `workspace_id` in SQL, `workspaceId` in TypeScript. Every business row must be scoped to one workspace unless explicitly system-shared. |
| ID format | SQL uses a mix of `uuid` and `text`; local modules use `string`. Mappers must normalize and validate before insert. |
| Naming | Local state uses camelCase. SQL uses snake_case. |
| Money | Use `number` locally and `numeric(14,2)` in SQL. Default currency is `THB` unless a field says otherwise. |
| Dates | Business dates are `YYYY-MM-DD`. Event timestamps are ISO locally and `timestamptz` in SQL. |
| Soft delete | Prefer `active=false` or terminal status when available. Hard delete is allowed only when current module already supports remove. |
| References | Some relationships are reference-by-convention because BuildDocs and several local modules still live in JSON state. |
| Audit | Business decisions should create `approval_events`; permission/system changes should create `audit_logs`. |

## 3. Identity, Access, and Sync

### `workspaces`

Purpose: tenant root for all cloud data.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key. |
| `name` | text | Workspace display name. |
| `slug` | text | Optional unique slug. |
| `owner_user_id` | uuid | References `auth.users(id)`. |
| `status` | text | `active`, `archived`. |

Relationships: owns `workspace_members`, projects, suppliers, procurement, cashflow, approval, settings, audit, and `kv_store`.

### `workspace_members`

Purpose: who can access a workspace.

Roles: `owner`, `admin`, `member`, `reviewer`, `vendor`, `support_operator`, `viewer`.

Statuses: `active`, `invited`, `removed`.

Mapper note: user-facing permission checks should not rely only on local plan state once cloud multi-user is enabled. Use Supabase membership plus app access evaluation.

### `project_access_grants`

Local storage: `project-access.grants.v1`.

SQL table: `project_access_grants`.

Purpose: project-scoped RBAC for deciding who can see or act inside each project.

Project roles: `owner`, `admin`, `project_manager`, `procurement`, `accounting`, `reviewer`, `vendor`, `viewer`, `member`, `support_operator`.

Important fields:

- `projectId`: empty means workspace-wide grant, otherwise project-specific.
- `memberId`, `memberName`: local member/user reference until cloud membership mapper is active.
- `supplierId`: limits vendor-style grants to one supplier when present.
- `extraPermissions`, `deniedPermissions`: per-grant override on top of role defaults.
- `active`: soft switch for revoking access without deleting history.

Permission groups include project, document, procurement, cashflow, evidence, report, vendor response, and settings actions.

### `plans`

Local storage: `membership.plans.v1`.

SQL table: `plans`.

Purpose: admin-configurable support and app access tiers.

Key fields: `id`, `workspace_id`, `name`, `price_amount`, `currency`, `billing_interval`, `support_quota`, `status`.

Statuses: `active`, `draft`, `archived`.

Billing intervals: `monthly`, `yearly`, `one_time`, `none`.

### `app_access_rules`

Local storage: nested under `membership.plans.v1`.

SQL table: `app_access_rules`.

Purpose: plan-level entitlements for each app or feature.

Access levels: `none`, `preview`, `quick`, `saved`, `read`, `write`, `export`, `admin`, `support`.

### `app_access_overrides`

Local storage: nested under membership state.

SQL table: `app_access_overrides`.

Purpose: workspace/member/user-specific allow or deny overrides.

Scopes: `workspace`, `member`, `user`.

Effects: `allow`, `deny`.

### `audit_logs`

Local storage: `membership.audit.v1`.

SQL table: `audit_logs`.

Purpose: immutable log for permission, subscription, admin, sync, and agent actions.

Actor types: `user`, `admin`, `agent`, `system`.

Required on: plan changes, overrides, approval source sync, destructive sync, agent actions, payment state changes.

### `kv_store`

Local storage: all cloud-eligible storage keys.

SQL table: `kv_store`.

Purpose: current generic sync layer. One row per `(workspace_id, key)` with JSONB `value`.

Do not sync local-only keys:

- `buildbybim.auth.*`
- `build-by-bim.workspace-language*`
- app version selection and UI-only preferences unless explicitly needed.

## 4. Business Spine

### `projects`

Local storage: `projects.list.v1`.

SQL table: `projects`.

Purpose: project is the primary ERP dimension. Procurement, cashflow, approvals, and reports should resolve to a project whenever possible.

Key local type: `Project`.

| Field | Notes |
|---|---|
| `id` / `code` / `name` | `code` must be unique per workspace in SQL. |
| `clientId`, `clientName`, `customerType` | Client is still reference-by-convention; no relational client table yet. |
| `contractValue`, `plannedCost`, `actualCost` | Cost control fields. `actualCost` is recomputed from confirmed cashflow when rollup sync runs. |
| `plannedRevenue`, `actualRevenue` | Revenue control fields. `actualRevenue` is recomputed from confirmed cashflow income. |
| `startDate`, `endDate`, `status` | Lifecycle and overdue reporting. |
| `hasBudget` | Local flag for budget-aware workflows. |

Statuses: `draft`, `normal`, `delayed`, `closed`, `cancelled`.

Mapper note: SQL `projects.id` is `uuid`; local `Project.id` is `string`. Existing local generated IDs may be UUIDs, but the mapper must verify before inserting into relational tables.

### `cost_codes`

Local storage: `cost-codes.catalog.v1`.

SQL table: `cost_codes`.

Purpose: construction cost breakdown structure (CBS). This is the shared classifier for PR lines, RFQ quotes, cashflow, supplier prices, and project control reports.

Key local type: `CostCode`.

Categories: `site`, `structure`, `architecture`, `mep`, `finishing`, `external`, `indirect`, `custom`.

Units: `lump_sum`, `sq_m`, `cubic_m`, `linear_m`, `piece`, `set`, `kg`, `ton`, `day`, `month`, `custom`.

Special rule: `workspaceId=""` locally and `workspace_id IS NULL` in SQL mean system seed catalog.

Reference rule: some modules store `CostCode.id`, while PR line items may store a cost code string by convention. Project Control already indexes both `id` and `code`; mappers must keep that compatibility.

### `suppliers`

Local storage: `suppliers.directory.v1`.

SQL table: `suppliers`.

Purpose: vendor, subcontractor, service, and material directory per workspace.

Types: `manufacturer`, `distributor`, `subcontractor`, `service`, `other`.

Key fields: identity (`name`, `shortName`, `taxId`), contact (`phone`, `email`, `lineId`), commercial terms (`paymentTerms`, `rating`, `tags`, `active`).

### `supplier_price_history`

Local storage: `suppliers.directory.v1` under `priceHistory`.

SQL table: `supplier_price_history`.

Purpose: historical unit prices from RFQ awards, PO/cashflow, manual entry, or LINE intake.

Source types: `rfq`, `po`, `manual`, `line_intake`.

Important links: `supplier_id`, `cost_code_id`, `source_document_id`.

Generated IDs:

- RFQ award entries come from `awardRFQ` side effects.
- Cashflow sync entries use `cashflow-price-{cashflowEntryId}` convention.

## 5. Procurement

### `purchase_requests`

Local storage: `procurement.pr.v1`.

SQL table: `purchase_requests`.

Purpose: purchase request header. This starts the procurement control chain.

Key local type: `PurchaseRequest`.

Statuses: `draft`, `submitted`, `approved`, `rejected`, `rfq_sent`, `awarded`, `ordered`, `received`, `closed`, `cancelled`.

Required fields before submit: `projectId`, at least one item, each item has cost code, unit, quantity greater than 0.

Important fields:

- `prNo`: generated as `PR-{YYYY}-{NNN}`.
- `projectId`: should point to `projects.id`.
- `totalAmount`: sum of line amounts.
- `linkedRfqId`: set when RFQ is created.
- `linkedPoDocumentId`: reserved for BuildDocs PO bridge.

### `pr_line_items`

Local storage: nested in each PR under `items`.

SQL table: `pr_line_items`.

Purpose: item-level requested cost with cost code and preferred supplier.

Important fields: `costCodeId`, `description`, `quantity`, `unit`, `estimatedUnitPrice`, `amount`, `preferredSupplierId`.

Mapper note: line items must be upserted after PR headers and removed when missing from local state for the same PR.

### `rfqs`

Local storage: `procurement.rfq.v1`.

SQL table: `rfqs`.

Purpose: request for quotation header created from an approved PR.

Statuses: `draft`, `sent`, `partial_response`, `responses_complete`, `awarded`, `cancelled`.

Key fields: `rfqNo`, `prId`, `projectId`, `invitedSupplierIds`, `awardedSupplierId`, `awardReason`, `awardedAt`.

Award reasons: `lowest_price`, `best_payment_terms`, `fastest_delivery`, `preferred_vendor`, `other`.

### `rfq_responses`

Local storage: nested under each RFQ as `responses`.

SQL table: `rfq_responses`.

Purpose: one supplier's response to an RFQ.

Channels: `email`, `line`, `manual`, `phone`.

Unique rule: one response per `(rfq_id, supplier_id)`.

### `rfq_item_quotes`

Local storage: nested under each RFQ response as `itemQuotes`.

SQL table: `rfq_item_quotes`.

Purpose: quoted price per PR line per supplier.

Important fields: `prLineItemId`, `costCodeId`, `unitPrice`, `amount`, `available`, `alternativeSpec`.

## 6. Cashflow and Project Control

### `cashflow_entries`

Local storage: `cashflow.entries.v1`.

SQL table: `cashflow_entries`.

Purpose: project ledger for actual income and expense.

Directions: `income`, `expense`.

Statuses: `draft`, `confirmed`, `void`.

Source types: `manual`, `pr`, `rfq`, `po`, `invoice`, `receipt`, `recurring`.

Categories:

- Income: `client_payment`, `loan_in`, `other_income`.
- Expense: `material`, `labor`, `subcontract`, `transport`, `equipment`, `office`, `tax_fee`, `other_expense`.

Important links: `projectId`, `costCodeId`, `supplierId`, `prId`, `rfqId`, `poDocumentId`, `documentId`, `sourceDocumentId`.

Rollup rule: only `status="confirmed"` entries affect project actuals and Project Control.

### `recurring_templates`

Local storage: `cashflow.recurring.v1`.

SQL table: `recurring_templates`.

Purpose: user-triggered recurring cashflow drafts. There is no cron yet.

Frequency: `monthly`, `weekly`, `quarterly`, `yearly`.

Generated entries are draft by default and carry `recurringTemplateId`.

### `project_control_settings`

Local storage: `project-control.settings.v1`.

SQL table: `project_control_settings`.

Purpose: one settings row per workspace. Project Control reports are computed, not stored.

Report types: `project_pl`, `cashflow_forecast`, `cost_variance`, `supplier_spend`, `pr_aging`.

Default alert thresholds:

| Key | Default | Meaning |
|---|---:|---|
| `nearBudgetPct` | 85 | Warn before cost reaches budget. |
| `lowMarginPct` | 10 | Warn when project margin is too low. |
| `staleDaysPR` | 30 | Warn when submitted PR is stale. |
| `noActivityDays` | 14 | Info alert for no recent cashflow activity. |

## 7. Approval and Audit

### `approval_requests`

Local storage: `approvals.requests.v1`.

SQL table: `approval_requests`.

Purpose: generic approval request pointing at a business object.

Target types: `pr`, `rfq_award`, `po`, `cashflow_entry`, `invoice`, `budget_override`.

Statuses: `draft`, `submitted`, `approved`, `rejected`, `cancelled`.

Priorities: `normal`, `high`, `urgent`.

Uniqueness rule: `(workspace_id, target_type, target_id)` is unique in SQL.

Mapper note: `target_id` is polymorphic and should stay `text`. Do not add hard FK until each target module is relational.

### `approval_events`

Local storage: nested under each approval request as `events`.

SQL table: `approval_events`.

Purpose: immutable business timeline for approval status transitions.

Actions: `created`, `submitted`, `approved`, `rejected`, `cancelled`, `synced`.

Rule: every approval decision must append an event and should append a low-level `audit_logs` entry when it changes source data.

### `document_authority`

Local storage: `document.authority.v1`.

SQL table: `document_authority`.

Purpose: issuer/checker/approver/issuer stamp for BuildDocs and future official documents.

Statuses: `draft`, `submitted`, `checked`, `approved`, `issued`, `void`.

Key fields: `documentId`, `documentNo`, `documentType`, `projectId`, `preparedByName`, `submittedByName`, `checkedByName`, `approvedByName`, `issuedByName`, timestamp fields, and `approvalRequestId`.

Rule: document authority is separate from document content so the same approval/audit layer can stamp Quote, PO, Invoice, Receipt, and Contract without rewriting the BuildDocs data model first.

## 8. Evidence Assets

### `evidence_assets`

Local storage: `evidence.assets.v1`.

SQL table: `evidence_assets`.

Purpose: auditable proof layer for receipts, invoices, RFQ quotes, delivery notes, site photos, defect photos, contracts, and other project evidence.

Key local type: `EvidenceAsset`.

Asset types: `receipt`, `invoice`, `rfq_quote`, `delivery_note`, `site_photo`, `site_360`, `site_file`, `defect_photo`, `contract`, `other`.

Statuses: `draft`, `verified`, `rejected`, `archived`.

Important fields:

| Field | Notes |
|---|---|
| `type` / `asset_type` | Local uses `type`; SQL stores `asset_type`. |
| `fileName`, `mimeType`, `size` | SQL maps to `file_name`, `mime_type`, `file_size`. |
| `dataUrl` | Local-only MVP preview for small files. Do not push raw base64 into relational rows. |
| `storagePath` / `storage_path` | Production object storage pointer. Migration is ready; UI still uses local data URL until Supabase Storage is added. |
| `amount`, `currency` | Optional financial context for receipts, invoices, quotes, and payment proof. |
| `sourceAppId`, `sourceDocumentId` | Source workflow that created or owns the evidence. |
| `tags` | Search/export hints. Site Report evidence reserves `site-floor:*`, `site-room:*`, `site-zone:*`, and `site-viewpoint:*`; older records may still use `location:*`. The UI currently derives non-persistent Site Report Location pins from these tags; production can promote this into a dedicated pin table later. |

Rule: production should prefer `archived` over hard delete for financial proof.

### `evidence_links`

Local storage: nested under `EvidenceAsset.links`.

SQL table: `evidence_links`.

Purpose: polymorphic links from one evidence asset to ERP records.

Target types: `project`, `cost_code`, `supplier`, `pr`, `rfq`, `cashflow_entry`, `document`, `defect`, `approval`, `other`.

Unique rule: `(evidence_asset_id, target_type, target_id)`.

Mapper note: `target_id` stays `text` because source modules mix UUID and local string IDs.

### `evidence.approval-policy.v1`

Local storage only for current MVP.

Purpose: configurable approval evidence gate in Approval Center.

Fields:

| Field | Notes |
|---|---|
| `mode` | `off`, `warn`, or `block`. |
| `minimumAmount` | Approval amount threshold before the rule applies. Default is `50000`. |
| `targetTypes` | Approval targets covered by the rule. Default is `pr`, `rfq_award`, and `cashflow_entry`. |
| `updatedAt` | Last saved policy timestamp. |

Rule: when `mode="block"`, covered approvals or RFQ awards at or above `minimumAmount` cannot proceed without direct verified evidence linked to the source transaction.

## 9. Local-Only or Not Yet Relational

| Storage key | Current status | Future relational target |
|---|---|---|
| `builddocs-pro.workspace.v1` | BuildDocs documents, clients, older projects/employees/defects in workspace blob | `documents`, `clients`, `file_assets`, `document_lines` |
| `builddocs-pro.boq-catalog.v1` | BOQ custom catalog | `boq_catalog_rows` |
| `boq-data.cost-code-mapping.v1` | BOQ Keynote/record to Cost Code mapping | `boq_cost_code_mappings` |
| `boq-data.task-linkage.v1` | BOQ task to BOQ item linkage | `boq_project_tasks`, `boq_task_allocations` |
| `project-access.grants.v1` | Project-scoped RBAC grants | `project_access_grants` |
| `document.authority.v1` | Document issuer/checker/approver stamps | `document_authority` |
| `evidence.approval-policy.v1` | Approval evidence gate settings | future `approval_evidence_policies` or workspace settings |
| `employees.workspace.v1` | Employee/service prototype | `employees`, `payroll_entries`, `project_assignments` |
| `defect-tracker.records.v1` | Defect records | `defects`, `file_assets` |
| `contractor-feed.workspace.v1` | Social feed prototype | `posts`, `comments`, `file_assets` |
| `build-by-bim.workspace-language.v1` | UI language preference | local-only |
| `build-by-bim.app-version-selection.v1` | UI version selector | local-only unless multi-device preference is required |

## 10. Open Gaps Before Production ERP

1. Add relational mappers for high-value keys instead of only `kv_store`.
2. Resolve `uuid` vs `text` mismatch for `projects.id` and references before cloud insert.
3. Add Supabase Storage bucket and evidence relational mapper so file binaries move out of local `dataUrl`.
4. Add PO/receiving bridge from awarded RFQ to BuildDocs and cashflow.
5. Add accounting layers only after the project-cost loop is stable: GL, AR/AP, tax invoices, and closing periods.
6. Add row-level conflict handling with per-row `updated_at` and delete tombstones.
7. Expand audit coverage for destructive edits, imports, exports, and sync overwrite actions.
