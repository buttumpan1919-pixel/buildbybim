# Cashflow Project Extension + Rollup Engine — Sub-PRD

Updated: 2026-05-24
Status: Sprint 5 core implemented — extends `docs/CASHFLOW_PRD.md`
Depends on: Sprint 0 `projects` · Sprint 1 `costCodes` · Sprint 2 `suppliers` · Sprint 3-4 `procurement`
Source: `docs/BUILK_PARITY_PLAN.md` Section 4.5 + Sprint 5
Implements: `docs/PRD.md` Section 9 + `docs/PROJECT_CONTROL_PRD.md` Section 4

## 1. Purpose

ปัจจุบัน `CashflowEntry` มี `projectId` field แต่ใช้น้อยมาก — UI ไม่บังคับเลือก project, ไม่มี cost code linkage, ไม่มี rollup กลับไป Project entity.

Sprint 5 ขยายให้ Cashflow เป็น **single source of truth ของ actual cost/revenue ต่อโครงการ** — เป็น input ให้ Project Control Dashboard (Sprint 6) ทำงานได้

เป้าหมาย:
- บังคับ project + cost code ในทุก cashflow entry (ผ่อนได้สำหรับ general overhead)
- Rollup engine: บันทึก/แก้/ลบ entry → trigger update `Project.actualCost`/`actualRevenue`
- Link จาก PR/RFQ/PO/Invoice → cashflow entry สร้างอัตโนมัติเป็น draft
- Supplier autocomplete ในฟอร์ม
- LINE intake (Phase 2): สลิป → OCR → draft entry

## 2. Non-Goals (v0.1)

- ไม่ทำ recurring entries แบบ scheduled cron (manual recurring template เท่านั้น)
- ไม่ทำ reconciliation กับ bank statement / online banking
- ไม่ทำ multi-currency conversion (THB only ต่อตามต้นน้ำ)
- ไม่ทำ tax calculation automation (user คีย์ตัวเลขรวม VAT/WHT เอง)
- ไม่ทำ accounting standards mapping (TFRS/IFRS) — ไม่ใช่ replacement สำหรับโปรแกรมบัญชี

## 3. Storage Contract

**No new storage key** — extend existing:
- `cashflow.entries.v1` (CashflowEntry — add new fields)
- `projects.list.v1` (Project — `actualCost`/`actualRevenue` updated via rollup)

Backward compat: old `CashflowEntry` records จะ default new fields เป็นค่าว่าง — `normalizeCashflowState` รองรับ.

## 4. Data Model Changes

### 4.1 Extended `CashflowEntry`

```ts
// Existing fields from docs/CASHFLOW_PRD.md Section 4
type CashflowEntry = {
  id: string;
  direction: CashflowDirection;
  category: CashflowCategory;
  amount: number;
  description: string;
  projectId: string;        // EXISTING but unused → now USED in UI/rollup
  documentId: string;       // EXISTING → now linked to BuildDocs invoice/receipt
  entryDate: string;
  status: CashflowEntryStatus;
  note: string;
  createdAt: string;
  updatedAt: string;

  // NEW fields (Sprint 5)
  costCodeId: string;       // optional — required when projectId set
  supplierId: string;       // optional — autocomplete from Sprint 2
  prId: string;             // optional — link to source PR
  rfqId: string;            // optional — link to source RFQ
  poDocumentId: string;     // optional — BuildDocs PO id
  quantityActual: number;   // optional — actual qty (for unit reconciliation)
  unitActual: string;       // optional — actual unit
  recurringTemplateId: string;  // optional — created from recurring template
};
```

### 4.2 New `RecurringTemplate` (manual recurring)

```ts
export type RecurringFrequency = "monthly" | "weekly" | "quarterly" | "yearly";

export type RecurringTemplate = {
  id: string;
  workspaceId: string;
  name: string;             // "ค่าเช่าออฟฟิศ"
  direction: CashflowDirection;
  category: CashflowCategory;
  amount: number;
  projectId: string;        // empty = workspace-level (no project)
  costCodeId: string;       // empty = no cost code (general overhead)
  supplierId: string;
  description: string;
  frequency: RecurringFrequency;
  startDate: string;
  endDate: string;          // empty = no end
  lastGeneratedDate: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CashflowStateExtended = CashflowState & {
  recurringTemplates: RecurringTemplate[];
};
```

### 4.3 Rollup engine

```ts
// Pure function — given a project + all related cashflow entries,
// returns updated actualCost + actualRevenue (and per-cost-code rollup)
export type ProjectRollup = {
  projectId: string;
  actualCost: number;           // sum of confirmed expense entries
  actualRevenue: number;        // sum of confirmed income entries
  costCodeRollups: Record<string, number>;  // costCodeId → sum
  lastEntryAt: string;
};

export function computeProjectRollup(
  projectId: string,
  entries: CashflowEntry[]
): ProjectRollup {
  const confirmed = entries.filter(
    (e) => e.projectId === projectId && e.status === "confirmed"
  );
  // ... sum by direction + per-costCode
}

// Trigger: on cashflow upsert/delete, call this + update Project entity
export function syncProjectFromCashflow(
  projectId: string,
  cashflowState: CashflowState,
  projectState: ProjectListState
): ProjectListState {
  const rollup = computeProjectRollup(projectId, cashflowState.entries);
  return {
    ...projectState,
    projects: projectState.projects.map((p) =>
      p.id === projectId
        ? { ...p, actualCost: rollup.actualCost, actualRevenue: rollup.actualRevenue, updatedAt: new Date().toISOString() }
        : p
    )
  };
}
```

### 4.4 Validation rules

- If `projectId` set → `costCodeId` **strongly recommended** (warn if empty)
- If `direction === "income"` → `costCodeId` not required (revenue not categorized by cost code)
- `supplierId` optional but autocomplete suggestion based on cost code history
- `recurringTemplateId` set → entry was generated from template (informational)

## 5. Cross-App Linkage Updates

| Source | New behavior in Sprint 5 |
|---|---|
| Project Detail page (Sprint 0) | "บันทึกต้นทุน" tab shows cashflow entries filtered by `projectId`; "+ บันทึก" prefills `projectId` |
| Cost Code catalog (Sprint 1) | When entry uses code → increment usage counter (informational) |
| Supplier directory (Sprint 2) | When entry has `supplierId` + `costCodeId` + amount → append `SupplierPriceHistoryEntry` (sourceType=`manual`) |
| PR/RFQ (Sprint 3-4) | On `pr.status='received'` + manual confirm → auto-create draft cashflow entry with prefilled fields |
| BuildDocs (existing) | On invoice paid → auto-create draft income entry |
| Project Control (Sprint 6) | `computeProjectSnapshot` reads cashflow entries via this rollup |
| Hub Dashboard (existing) | "Cashflow รอ confirm N" tile triggers on `status='draft'` count |

## 6. UI Flow Changes

### 6.1 Cashflow entry form (extend existing)

Add fields below current form:
- **Project** (autocomplete from Sprint 0, optional but defaults to "ไม่ผูก project")
- **Cost Code** (autocomplete from Sprint 1, required if project set)
- **Supplier** (autocomplete from Sprint 2, optional)
- **Source link** (read-only chips): "from PR-2026-007", "from PO-12345" — created automatically when entry generated from other modules
- **Quantity Actual** + **Unit Actual** (optional pair)

Field validation:
- If user selects project but leaves cost code empty → warning toast "แนะนำให้เลือก cost code ด้วย — รายงานจะแม่นกว่า"
- ไม่ block save (user choice)

### 6.2 Cashflow list filters (extend existing)

Add filter chips:
- **By project** (dropdown ของ active projects)
- **By cost code** (autocomplete)
- **By supplier** (autocomplete)
- **By source** (manual / from PR / from PO / from invoice / from recurring)

### 6.3 New tab `recurring` in `/cashflow`

| Tab | Content |
|---|---|
| `overview` (existing) | unchanged |
| `recurring` (new) | recurring templates list + form + "Generate this month's entries" button |
| `forecast` (existing placeholder) | finally implemented in Sprint 6 |
| `reports` (existing placeholder) | implemented in Sprint 6 (Project Control) |

### 6.4 New "Cashflow Entries" tab in Project Detail

(Already specced in PROJECT_PRD Section 6.3 — Sprint 5 makes it functional)

- Embed CashflowPanel filtered by `projectId`
- Toolbar: "+ บันทึกต้นทุน" prefills project + asks for cost code
- Summary: "ต้นทุนจริงในโครงการนี้: ฿X (ตาม code: …)"

## 7. Acceptance Criteria

- Existing cashflow data ยังเปิดได้ (backward compat)
- เพิ่ม entry → optional Project + Cost Code + Supplier autocomplete
- Project filter ใน list page ทำงาน
- Recurring template: สร้าง template → "Generate this month" → entries draft state
- เมื่อ entry confirmed → `Project.actualCost`/`actualRevenue` update ทันที (rollup engine)
- เมื่อ entry deleted → rollup recompute
- เมื่อ supplier+costCode+amount → SupplierPriceHistoryEntry auto-append
- Hub Dashboard "Cashflow รอ confirm" tile ยังทำงาน
- Project Detail "บันทึกต้นทุน" tab embed + filter ทำงาน
- `npm test` ผ่าน (rollup engine + recurring + supplier price history sync)
- `npm run build` ผ่าน
- TH/EN dictionary ครบ

## 8. Tests to Write

```ts
// src/cashflow.rollup.test.ts (new)

describe("computeProjectRollup", () => {
  it("sums confirmed expense entries by projectId", () => { ... });
  it("sums confirmed income entries separately", () => { ... });
  it("excludes draft and void entries", () => { ... });
  it("returns 0/0 when no entries for project", () => { ... });
  it("groups by costCodeId in costCodeRollups", () => { ... });
});

describe("syncProjectFromCashflow", () => {
  it("updates Project.actualCost in projectState", () => { ... });
  it("updates Project.updatedAt", () => { ... });
  it("doesn't affect other projects", () => { ... });
});

describe("Recurring templates", () => {
  it("generates entries for past months since lastGeneratedDate", () => { ... });
  it("skips inactive templates", () => { ... });
  it("respects endDate", () => { ... });
  it("sets recurringTemplateId on generated entries", () => { ... });
});

describe("SupplierPriceHistory auto-append", () => {
  it("appends entry when cashflow has supplierId+costCodeId+amount", () => { ... });
  it("does not append when supplierId missing", () => { ... });
  it("sets sourceType=manual", () => { ... });
});

describe("Project filter", () => {
  it("filterCashflowByProject returns only matching entries", () => { ... });
  it("returns empty array for non-existent project", () => { ... });
});

describe("backward compat", () => {
  it("old entries without costCodeId still load", () => { ... });
  it("old entries without supplierId still load", () => { ... });
});
```

## 9. Out-of-scope but Planned

- v0.2 Bank statement import (CSV from Thai banks: SCB, Kasikorn, BBL)
- v0.2 PromptPay receipt parser (Thai QR code → entry)
- v0.2 Multi-entry recurring (template generates multiple entries per period)
- v0.3 Forecast tab (90-day projection from recurring + scheduled milestones)
- v0.3 Reconciliation (match entries to invoice/PO records)
- Phase 2 LINE receipt OCR → draft entry (per `docs/PRD.md` Section 3.5)
- Phase 2 AI cost code suggestion from description
- Phase 2 AI supplier suggestion from item description

## 10. Mapping to Master PRD/ERD

| Master PRD | This PRD section |
|---|---|
| `docs/PRD.md` Section 9 Business Apps | Section 1-7 |
| `docs/CASHFLOW_PRD.md` (base) | This PRD extends it |
| `docs/PROJECT_PRD.md` Section 5 (rollup engine row) | Section 4.3 |
| `docs/COST_CODES_PRD.md` Section 5 (cashflow entry link) | Section 5 |
| `docs/SUPPLIERS_PRD.md` Section 5 (cashflow → price history) | Section 5 |
| `docs/PROCUREMENT_PRD.md` Section 5 (PO → cashflow auto-draft) | Section 5 |
| `docs/PROJECT_CONTROL_PRD.md` Section 4 (snapshot read source) | Section 5 |

## 11. Implementation Notes for Codex

1. **Extend `src/cashflow.ts`** — add new fields with optional defaults; preserve backward compat via normalize
2. **Create `src/cashflow.rollup.ts`** — pure functions `computeProjectRollup`, `syncProjectFromCashflow`, `appendSupplierPriceHistory` (testable independently)
3. **Tests**: split into `src/cashflow.test.ts` (existing) + `src/cashflow.rollup.test.ts` (new)
4. **Wire upsert/remove**: in `upsertCashflowEntry`/`removeCashflowEntry`, call `syncProjectFromCashflow` if entry has `projectId`
5. **Wire supplier price history**: in `upsertCashflowEntry`, if `supplierId+costCodeId+amount` present + status confirmed → `appendSupplierPriceHistory`
6. **UI**: extend `CashflowPanel` form + list (in `src/workspace/apps/cashflow/CashflowPanel.tsx` after Codex's split)
7. **New recurring sub-app**: `src/workspace/apps/cashflow/RecurringPanel.tsx`
8. **Subnav update**: add `recurring` tab to cashflow subnav in `src/App.tsx`
9. **SQL migration**: `supabase/migrations/0008_cashflow_extension.sql` — add columns to `cashflow_entries`, create `recurring_templates`:
   ```sql
   alter table cashflow_entries
     add column if not exists cost_code_id text,
     add column if not exists supplier_id text,
     add column if not exists pr_id text,
     add column if not exists rfq_id text,
     add column if not exists po_document_id text default '',
     add column if not exists quantity_actual numeric(14, 4) default 0,
     add column if not exists unit_actual text default '',
     add column if not exists recurring_template_id text;

   create table if not exists recurring_templates (
     id text primary key,
     workspace_id uuid not null references workspaces(id) on delete cascade,
     name text not null,
     direction text not null,
     category text not null,
     amount numeric(14, 2) default 0,
     project_id uuid,
     cost_code_id text,
     supplier_id text,
     description text default '',
     frequency text not null check (frequency in ('monthly', 'weekly', 'quarterly', 'yearly')),
     start_date date not null,
     end_date date,
     last_generated_date date,
     active boolean default true,
     created_at timestamptz default now(),
     updated_at timestamptz default now()
   );
   -- RLS via is_workspace_member as usual
   ```
10. **Update Project Detail "บันทึกต้นทุน" tab**: replace stub with real CashflowPanel scoped to project
11. **Update PROJECT_PRD.md Section 6.3**: mark "บันทึกต้นทุน" tab → functional in Sprint 5

---

**Ready for Codex Sprint 5** (after Sprint 0-4 done): เริ่มจาก `src/cashflow.rollup.ts` pure functions + tests → extend types + storage normalize → UI form/filters + recurring panel → wire to Project + Supplier + BuildDocs → SQL migration

## 12. Implementation Snapshot

Implemented on 2026-05-24:

- `src/cashflow.ts` normalizes Sprint 5 linkage fields and `sourceType` / `sourceDocumentId`.
- `src/cashflow.rollup.ts` computes project actual cost/revenue from confirmed cashflow entries.
- `CashflowPanel` accepts Project, Cost Code, Supplier, actual quantity, and actual unit.
- Cashflow list filters by Project, Cost Code, and Supplier.
- Confirmed supplier expense entries can sync to supplier price history with deterministic de-dupe.
- `supabase/migrations/0008_cashflow_extension.sql` adds relational columns and indexes.
- `src/cashflow.rollup.test.ts` covers rollup, filtering, project sync, and supplier price history sync.

Deferred:

- recurring templates UI
- automatic PR/RFQ/PO/BuildDocs draft creation
- forecast tab implementation
- Project Detail embedded cashflow tab
