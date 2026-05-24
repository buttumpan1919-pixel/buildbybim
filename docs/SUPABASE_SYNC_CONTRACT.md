# Buildbybim.space - Supabase Sync Contract

Updated: 2026-05-24

Status: contract for Phase D relational mappers. The current app syncs storage keys to `kv_store`; this document defines how to move high-value keys into relational tables without breaking local-first behavior.

Use this with:

- `docs/DATA_DICTIONARY.md` for fields and enums.
- `docs/IMPLEMENTED_ERD.md` for table relationships.
- `docs/SUPABASE_SETUP.md` for setup steps and migrations.
- `src/storageAdapter.ts` and `src/supabaseAdapter.ts` for current adapter behavior.

## 1. Current Sync State

Current behavior:

```text
localStorage key -> SupabaseAdapter -> kv_store(workspace_id, key, value)
```

This is good for backup and multi-device JSON restore, but not enough for ERP-grade reporting because Supabase cannot query individual PR lines, cashflow rows, or supplier prices efficiently while they remain only inside JSON blobs.

Phase D behavior:

```text
localStorage key -> kv_store backup
                 -> relational mapper -> normalized Supabase tables
```

Rule: do not remove `kv_store` backup when adding relational mappers. It remains the compatibility and recovery layer.

## 2. Storage Key Mapping

| Storage key | Local module | Current cloud target | Phase D relational target | Priority |
|---|---|---|---|---|
| `projects.list.v1` | `src/projects.ts` | `kv_store` | `projects` | P0 |
| `cost-codes.catalog.v1` | `src/costCodes.ts` | `kv_store` | `cost_codes` | P0 |
| `suppliers.directory.v1` | `src/suppliers.ts` | `kv_store` | `suppliers`, `supplier_price_history` | P0 |
| `procurement.pr.v1` | `src/procurement.ts` | `kv_store` | `purchase_requests`, `pr_line_items` | P0 |
| `procurement.rfq.v1` | `src/procurement.ts` | `kv_store` | `rfqs`, `rfq_responses`, `rfq_item_quotes` | P0 |
| `cashflow.entries.v1` | `src/cashflow.ts` | `kv_store` | `cashflow_entries` | P0 |
| `cashflow.recurring.v1` | `src/cashflow.recurring.ts` | `kv_store` | `recurring_templates` | P1 |
| `project-control.settings.v1` | `src/projectControl.ts` | `kv_store` | `project_control_settings` | P1 |
| `approvals.requests.v1` | `src/approvals.ts` | `kv_store` | `approval_requests`, `approval_events` | P0 |
| `project-access.grants.v1` | `src/projectAccess.ts` | `kv_store` | `project_access_grants` | P0 |
| `document.authority.v1` | `src/projectAccess.ts` | `kv_store` | `document_authority` | P0 |
| `evidence.assets.v1` | `src/evidence.ts` | `kv_store` | `evidence_assets`, `evidence_links` | P0 |
| `evidence.approval-policy.v1` | `src/evidence.ts` | `kv_store` | future `approval_evidence_policies` or workspace settings | P1 |
| `membership.plans.v1` | `src/membership.ts` | `kv_store` | `plans`, `app_access_rules` | P1 |
| `membership.subscription.v1` | `src/membership.ts` | `kv_store` | future `workspace_subscriptions` | P2 |
| `membership.audit.v1` | `src/membership.ts` | `kv_store` | `audit_logs` | P1 |
| `builddocs-pro.workspace.v1` | `src/storage.ts` | `kv_store` | future `documents`, `clients`, `file_assets` | P2 |
| `builddocs-pro.boq-catalog.v1` | `workspace/apps/boq-data/boqDataService.ts` | `kv_store` | future `boq_catalog_rows` | P2 |
| `boq-data.task-linkage.v1` | `src/boqTaskLinkage.ts` | `kv_store` | future `boq_project_tasks`, `boq_task_allocations` | P2 |
| `employees.workspace.v1` | `workspace/apps/employees/employeeService.ts` | `kv_store` | future employee tables | P3 |
| `defect-tracker.records.v1` | `workspace/apps/defects/defectService.ts` | `kv_store` | future `defects`, `file_assets` | P3 |
| `contractor-feed.workspace.v1` | `workspace/apps/social-feed/socialFeedService.ts` | `kv_store` | future feed tables | P3 |

Local-only keys:

| Key or prefix | Reason |
|---|---|
| `buildbybim.auth.*` | Supabase auth/session local cache. Never mirror manually. |
| `build-by-bim.workspace-language*` | UI preference. |
| `build-by-bim.app-version-selection.v1` | UI routing preference unless later made account preference. |

## 3. Mapper Interface

Each mapper should be small, pure where possible, and testable without React.

```ts
export type SyncDirection = "push" | "pull";

export type RelationalMapper<TLocalState> = {
  storageKey: string;
  normalizeLocal(input: unknown): TLocalState;
  pull(workspaceId: string): Promise<TLocalState>;
  push(workspaceId: string, state: TLocalState): Promise<SyncResult>;
};

export type SyncResult = {
  storageKey: string;
  upserted: number;
  deleted: number;
  skipped: number;
  conflicts: number;
  warnings: string[];
};
```

Recommended file shape:

```text
src/sync/
  relationalMapper.ts
  projectMapper.ts
  costCodeMapper.ts
  supplierMapper.ts
  procurementMapper.ts
  cashflowMapper.ts
  approvalMapper.ts
```

## 4. Push Contract

Push means local state is the source of truth and Supabase rows are updated to match it.

Required steps:

1. Read local state through the existing domain `load*State()` helper.
2. Normalize with the domain normalizer.
3. Upsert parent rows first.
4. Upsert child rows second.
5. Delete or tombstone child rows missing from local state only when the module supports delete.
6. Write the original JSON state to `kv_store` after relational push succeeds.
7. Return `SyncResult`.
8. Add audit log for bulk push if it changes many rows or overwrites cloud state.

Parent-child order:

| Domain | Push order |
|---|---|
| Projects | `projects` |
| Cost Codes | `cost_codes` |
| Suppliers | `suppliers` -> `supplier_price_history` |
| Procurement PR | `purchase_requests` -> `pr_line_items` |
| RFQ | `rfqs` -> `rfq_responses` -> `rfq_item_quotes` |
| Cashflow | `cashflow_entries` |
| Approval | `approval_requests` -> `approval_events` |
| Evidence | `evidence_assets` -> `evidence_links` |
| Membership | `plans` -> `app_access_rules` -> `app_access_overrides` -> `audit_logs` |

## 5. Pull Contract

Pull means Supabase rows are transformed back into local state shape.

Required steps:

1. Verify workspace membership before query through Supabase RLS.
2. Query parent rows and nested child rows in deterministic order.
3. Convert snake_case to camelCase.
4. Preserve local state shape exactly.
5. Write the pulled state using the existing domain `save*State()` helper.
6. Also write the reconstructed JSON to `kv_store` for backup parity.
7. Warn the user before destructive local overwrite unless pull is first-time setup.

Deterministic ordering:

- Projects: `code ASC`, then `updated_at DESC`.
- Cost codes: `code ASC`, then `name ASC`.
- Suppliers: active first, then name.
- PR: `request_date DESC`, then `pr_no DESC`.
- RFQ: `created_at DESC`, then `rfq_no DESC`.
- Cashflow: `entry_date DESC`, then `updated_at DESC`.
- Approval: submitted first by priority, then `updated_at DESC`.
- Evidence: `uploaded_at DESC`, then `updated_at DESC`.

## 6. Conflict Policy

Phase D default: local-first, last-write-wins per row where `updated_at` exists.

Rules:

| Case | Rule |
|---|---|
| Local newer than cloud | Push local row. |
| Cloud newer than local | Pull cloud row only if user chooses pull or auto-sync is in cloud-priority mode. |
| Same row changed on both sides | Keep local by default, count as conflict, include warning. |
| Parent missing for child | Skip child and report warning. Do not create orphan records. |
| Invalid enum | Normalize to safe default locally; reject or warn before relational push. |
| Delete conflict | Prefer soft-delete/status where available. Hard delete only after explicit local delete. |

Future improvement: add per-row `sync_version`, `deleted_at`, and `last_synced_at` metadata for safer merge.

## 7. Field Conversion Rules

| Local | SQL | Rule |
|---|---|---|
| `workspaceId` | `workspace_id` | Required for all workspace-scoped rows. Empty local workspace should map to active cloud workspace on first push. |
| `createdAt` | `created_at` | ISO to `timestamptz`. |
| `updatedAt` | `updated_at` | ISO to `timestamptz`. |
| `projectId` | `project_id` | Validate UUID for tables where SQL column is `uuid`; otherwise skip or map through ID registry. |
| `costCodeId` | `cost_code_id` | Preserve as text. Resolve by both `CostCode.id` and `CostCode.code`. |
| `supplierId` | `supplier_id` | Preserve as text. |
| arrays | `text[]` or child rows | Use `text[]` only when SQL column exists, otherwise child rows. |
| nested arrays | child table rows | Upsert children after parent. |
| `metadata` | `jsonb` | Preserve string/number/boolean only unless schema explicitly supports nested JSON. |

## 8. Per-Key Notes

### `projects.list.v1`

Target: `projects`.

Risk: SQL `project_id` references are UUID in several migrations, but local IDs are strings. Before mapper implementation, decide one of:

1. enforce UUID local project IDs, or
2. add cloud ID registry mapping local ID to cloud UUID, or
3. alter SQL project references to `text`.

Recommendation: enforce UUID for new project IDs and migrate old non-UUID IDs through an ID registry during first push.

### `cost-codes.catalog.v1`

Target: `cost_codes`.

System seed rows use `workspace_id IS NULL`. Workspace custom rows use a real workspace ID.

Do not let workspace users update system seed rows. If a seed row is customized, create a workspace row with a distinct `id` and same or derived `code`.

### `suppliers.directory.v1`

Targets: `suppliers`, `supplier_price_history`.

Push `suppliers` first. Then upsert price history by `id`.

Delete rule: if a supplier is removed locally, cascade delete price history only if the local module already removed it. Otherwise prefer `active=false`.

### `procurement.pr.v1`

Targets: `purchase_requests`, `pr_line_items`.

Upsert PR headers first. Replace line items for each PR by comparing item IDs.

Status must pass the PR state machine. Mapper should not invent status transitions.

### `procurement.rfq.v1`

Targets: `rfqs`, `rfq_responses`, `rfq_item_quotes`.

Upsert order: RFQ header, responses, item quotes.

On award, supplier price history must also be synced through `suppliers.directory.v1` or a dedicated price history mapper so reporting stays consistent.

### `cashflow.entries.v1`

Target: `cashflow_entries`.

Only confirmed rows feed Project Control. The mapper should still sync draft and void rows for continuity.

If `projectId` is not a valid cloud UUID, keep the row in `kv_store` and warn rather than inserting bad relational data.

### `approvals.requests.v1`

Targets: `approval_requests`, `approval_events`.

`target_type + target_id` is polymorphic. Keep it as text. Do not enforce FK until source table coverage is complete.

The mapper must preserve the event order by `createdAt`.

### `project-access.grants.v1`

Target: `project_access_grants`.

The mapper should preserve string `project_id` and `member_id` until the project/member UUID strategy is finalized. `supplier_id` is optional and should remain text because supplier IDs can be local strings.

### `document.authority.v1`

Target: `document_authority`.

This table is the authority stamp for BuildDocs and future relational documents. Sync by `(workspace_id, document_id)` and keep `approval_request_id` as text until approval/document relationships are fully relational.

### `evidence.assets.v1`

Targets: `evidence_assets`, `evidence_links`.

Push evidence assets first, then links. `type` maps to SQL `asset_type`, `size` maps to `file_size`, and local `dataUrl` should not be inserted into relational tables. Until Supabase Storage is enabled, keep binary previews in `kv_store` only and write empty `storage_path`.

`target_type + target_id` is polymorphic. Keep `target_id` as text and validate only that known target IDs exist locally when the mapper has the relevant local state available.

When Storage is added, upload files to a workspace-scoped bucket path, store that path in `storage_path`, and keep only metadata plus optional signed preview URL in the row.

### `evidence.approval-policy.v1`

Target: future `approval_evidence_policies` or a JSONB field in workspace settings.

Current shape is small and safe to keep in `kv_store`: `mode`, `minimumAmount`, `targetTypes`, `updatedAt`.

If this becomes relational, keep one row per workspace and preserve the default behavior: block PR, RFQ award, and Cashflow decisions at or above 50,000 THB unless direct verified evidence exists.

## 9. UI Contract

Cloud Sync UI should show separate statuses:

| Status | Meaning |
|---|---|
| `JSON backup synced` | key exists in `kv_store`. |
| `Relational synced` | mapper pushed or pulled rows successfully. |
| `Partial` | `kv_store` synced but relational mapper skipped rows or hit warnings. |
| `Conflict` | local and cloud both changed. User decision required. |
| `Local only` | key is intentionally not synced. |

Do not show "Supabase synced" as a single boolean once mappers exist.

## 10. Acceptance Tests for Each Mapper

Each mapper needs tests for:

1. local to SQL row conversion.
2. SQL row to local state conversion.
3. parent-child upsert order.
4. missing parent warning.
5. invalid enum normalization or rejection.
6. delete or tombstone behavior.
7. idempotent second push.
8. conflict count when both sides changed.
9. `workspace_id` isolation.
10. `kv_store` compatibility remains intact.

## 11. Recommended Implementation Order

1. Project ID strategy and `projectMapper`.
2. `costCodeMapper`.
3. `supplierMapper`.
4. `procurementMapper` for PR.
5. `procurementMapper` for RFQ.
6. `cashflowMapper`.
7. `approvalMapper`.
8. Project Control cloud read path.
9. `projectAccessMapper` for project grants + document authority.
10. `evidenceMapper` + Supabase Storage path strategy.
11. Approval evidence policy mapper or workspace settings field.
12. BuildDocs document mapper.

Reasoning: this order follows dependency direction and keeps Project Control useful as soon as the first six mappers are done.
