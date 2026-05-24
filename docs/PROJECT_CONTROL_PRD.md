# Project Control (Dashboard + Reports) — Sub-PRD

Updated: 2026-05-24
Status: Sprint 6 spec — pending implementation
Depends on: Sprint 0 `projects` · Sprint 1 `costCodes` · Sprint 2 `suppliers` · Sprint 3-4 `procurement` · Sprint 5 cashflow extension + rollup engine
Implementation status: Sprint 6 core is implemented (`src/projectControl.ts`, `src/csvExport.ts`, `/project-control` dashboard/reports/settings route). Deferred: Project Detail embedded snapshot, Hub over-budget/stale PR tile, backend materialized view, AI Insights.
Source: `docs/BUILK_PARITY_PLAN.md` Section 4.6-4.7
Implements: `docs/PRD.md` Section 9 Business Apps

## 1. Purpose

Project Control = view layer + report engine on top of data ที่ Sprint 0-5 collect ไว้. ไม่มี data ใหม่ของตัวเอง — เน้น aggregation + visualization + export.

เป้าหมาย:
- Per-project dashboard: Budget vs Committed vs Actual ต่อ cost code + variance alert
- 5 standard reports (MVP) — match Builk's 9 reports แบบเลือกเฉพาะ 5 ที่สำคัญ
- AI insights (Phase 2): "ถามอะไรก็ได้ ได้คำตอบ + chart" สำหรับโครงการ

**Key insight**: Builk has 9 reports, แต่จาก analysis ของ Claude in Chrome พบว่า user ส่วนใหญ่ใช้แค่ 3-5 — เรา ship 5 ก่อน เพิ่มทีหลังตาม feedback

## 2. Non-Goals (v0.1)

- ไม่ทำ custom report builder (drag-drop) — รอ v0.3
- ไม่ทำ scheduled email reports — รอ v0.3
- ไม่ทำ multi-project comparison report — Sprint 6 ทำ per-project, cross-project ใน v0.2
- ไม่ทำ PDF report generation — export = CSV/Excel/print (browser print → PDF) v0.1
- ไม่ทำ chart export to PNG/SVG — รอ v0.2
- ไม่ทำ historical snapshots (compare month-over-month) — รอ v0.3

## 3. Storage Contract

**ไม่มี storage ของตัวเอง** — Project Control เป็น aggregator + view layer:

- อ่าน `projects` (Sprint 0)
- อ่าน `costCodes` (Sprint 1)
- อ่าน `suppliers` + `supplierPriceHistory` (Sprint 2)
- อ่าน `purchaseRequests` + `rfqs` + `rfqResponses` (Sprint 3-4)
- อ่าน `cashflowEntries` with `projectId` + `costCodeId` (Sprint 5)
- อ่าน `documents` from BuildDocs (existing — for invoice/revenue)

Settings เท่านั้น (เช่น report defaults) — เก็บใน:
| Storage Key | Module | Type |
|---|---|---|
| `project-control.settings.v1` | `src/projectControl.ts` | `ProjectControlSettings` |

## 4. Data Model

**Pure computed types** — no persisted entities ของตัวเอง:

```ts
export type CostCodeRollup = {
  costCodeId: string;
  costCodeName: string;
  category: string;
  budget: number;              // sum of PR estimatedAmount per cost code (or planned cost from cashflow draft)
  committed: number;           // sum of approved PR amounts (not yet received)
  actual: number;              // sum of confirmed cashflow entries
  variance: number;            // budget - actual
  variancePct: number;         // variance / budget * 100
  isOverBudget: boolean;
};

export type ProjectFinancialSnapshot = {
  projectId: string;
  projectCode: string;
  projectName: string;
  generatedAt: string;
  totalBudget: number;
  totalCommitted: number;
  totalActual: number;
  totalRevenue: number;
  totalPaidRevenue: number;
  netCashflow: number;         // totalPaidRevenue - totalActual
  marginPct: number | null;
  daysRemaining: number;
  status: string;
  costCodeRollups: CostCodeRollup[];
  alerts: ProjectAlert[];
};

export type ProjectAlert = {
  id: string;
  severity: "info" | "warn" | "critical";
  type:
    | "over_budget"
    | "near_budget"          // >= 85% spent
    | "overdue"
    | "pending_invoice"
    | "stale_pr"             // PR pending >30 days
    | "low_margin"           // margin < 10%
    | "no_recent_activity";  // no activity >14 days
  message: string;
  costCodeId: string;        // optional
  actionUrl: string;         // deep link to fix it
  computedAt: string;
};

export type ReportType =
  | "project_pl"           // 1. Project P&L
  | "cashflow_forecast"    // 2. Cash flow 90-day forecast
  | "cost_variance"        // 3. Cost code variance
  | "supplier_spend"       // 4. Top suppliers by spend
  | "pr_aging";            // 5. PR aging (oldest pending)

export type ReportResult = {
  type: ReportType;
  projectId: string;       // empty = workspace-wide
  generatedAt: string;
  data: unknown;           // shape varies by type
  rows: Array<Record<string, unknown>>;  // tabular form for export
};

export type ProjectControlSettings = {
  workspaceId: string;
  defaultReportType: ReportType;
  alertThresholds: {
    nearBudgetPct: number;       // default 85
    lowMarginPct: number;        // default 10
    staleDaysPR: number;         // default 30
    noActivityDays: number;      // default 14
  };
  updatedAt: string;
};
```

### 4.1 Rollup computation

```ts
function computeProjectSnapshot(
  projectId: string,
  ctx: {
    project: Project;
    costCodes: CostCode[];
    cashflowEntries: CashflowEntry[];
    purchaseRequests: PurchaseRequest[];
    documents: StoredDocument[];
    settings: ProjectControlSettings;
  }
): ProjectFinancialSnapshot {
  // 1. Group cashflow entries by costCodeId (only confirmed + projectId match)
  // 2. Group PR amounts by costCodeId (only approved/ordered/received, not draft/cancelled)
  // 3. For each cost code: budget = max(PR sum, project.plannedCost * weight), actual = cashflow sum
  // 4. totalRevenue = sum of confirmed invoices (BuildDocs) for project
  // 5. Generate alerts based on thresholds
  // 6. Return snapshot
}
```

### 4.2 Alert thresholds (defaults)

- `over_budget`: actual > budget → critical (red)
- `near_budget`: actual >= 85% of budget → warn (yellow)
- `overdue`: project.daysRemaining < 0 → critical
- `pending_invoice`: project.status = `received` but no invoice issued → warn
- `stale_pr`: PR in `submitted` state > 30 days → warn
- `low_margin`: marginPct < 10 → warn
- `no_recent_activity`: no cashflow/PR activity in last 14 days for `normal` status project → info

User-customizable per workspace via `ProjectControlSettings`.

## 5. Cross-App Linkage

| Source | Aggregation | Used in |
|---|---|---|
| Project (Sprint 0) | `projectId` scope filter for all queries | All reports |
| Cost Code (Sprint 1) | group by `costCodeId` | Cost variance + breakdown |
| Cashflow entry (Sprint 5) | filter by `projectId` + `costCodeId` + `status='confirmed'` | actual cost |
| Cashflow entry (income type) | filter by `direction='income'` | actual revenue |
| PR (Sprint 3) | filter by `projectId` + `status in (approved, ordered, received)` | committed |
| BuildDocs invoice | filter by project name match + `status='paid'` | paid revenue |
| Supplier (Sprint 2) | join cashflow entries via `supplierId` | Supplier spend report |
| Audit log (Membership) | filter by project context | Recent activity timeline |

## 6. UI Flow

### 6.1 Subnav (new app `projectControl`)

| Tab | Sprint | Content |
|---|---|---|
| `dashboard` (default) | 6 | Project picker + financial snapshot + cost breakdown + alerts |
| `reports` | 6 | 5 report cards + click to generate |
| `settings` | 6 | Alert threshold customization |

### 6.2 Dashboard page (`/project-control?tab=dashboard&projectId=...`)

ตาม mockup `/mockup?tab=project-control`:

```
[Project picker: บ้านพักคุณเอ ▼]    [Generate snapshot] [Export]

┌── KPI Row (4 tiles) ────────────────────────┐
│ Budget  │ Committed │ Actual  │ Remaining   │
│ ฿4.5M   │ ฿4.18M    │ ฿2.15M  │ ฿2.35M     │
│         │           │  48%    │             │
└─────────────────────────────────────────────┘

┌── Alert Banner ──────────────────────────────┐
│ ⚠ 02 Structure committed เกินงบ ฿20,000     │
│ ⚠ Project เลย deadline 24 วัน               │
└─────────────────────────────────────────────┘

┌── Cost Breakdown (per cost code) ──────────────────┐
│ 01 Site       ▓▓▓▓▓░░░░░  60% ฿120K / ฿200K       │
│ 02 Structure  ▓▓▓▓▓▓▓▓██  103% ⚠ ฿1.52M / ฿1.5M  │
│ 03 Architecture ▓▓░░░░░░░░  25% ฿200K / ฿800K     │
│ 04 MEP        ▓▓▓▓▓░░░░░  45% ฿450K / ฿1M         │
│ 05 Finishing  ▓░░░░░░░░░  19% ฿150K / ฿800K       │
│ 06 External   ▓▓░░░░░░░░  25% ฿50K / ฿200K        │
└────────────────────────────────────────────────────┘

[💡 AI Insights (Phase 2)] dark card
```

### 6.3 Reports page (`/project-control?tab=reports`)

Card grid:

```
┌─ Project P&L ──────────────┐  ┌─ Cash Flow Forecast ───────┐
│ รายรับ vs รายจ่าย          │  │ 90 วันถัดไป                 │
│ ต่อโครงการ                  │  │ จาก recurring + milestone   │
│ [Project: all ▼] [Generate]│  │ [Project: all ▼] [Generate] │
└────────────────────────────┘  └────────────────────────────┘

┌─ Cost Variance ────────────┐  ┌─ Supplier Spend ────────────┐
│ budget vs actual %         │  │ Top 10 supplier × spend     │
│ แยกตาม cost code           │  │ ในช่วง 12 เดือนหลัง         │
│ [Project: all ▼] [Generate]│  │ [Period: 12m ▼] [Generate]  │
└────────────────────────────┘  └────────────────────────────┘

┌─ PR Aging ─────────────────┐
│ PR ที่ค้างเก่าสุด           │
│ pending approval / ordered │
│ [Threshold: 14d ▼] [Gen]   │
└────────────────────────────┘
```

Each "Generate" → opens result page with table + chart + Export buttons (CSV / Excel / Print PDF).

### 6.4 Settings page (`/project-control?tab=settings`)

- Edit alert thresholds (number inputs)
- Reset to defaults button
- Default report type selector

## 7. Acceptance Criteria

### Dashboard

- เลือก project จาก dropdown → snapshot computed real-time (< 200ms for typical workspace)
- 4 KPI tiles แสดงถูก (Budget/Committed/Actual/Remaining)
- Cost breakdown bars แสดงทุก cost code ของโครงการ ในลำดับ % spent desc
- Over-budget rows ขึ้นสีแดง + ⚠ icon
- Alert banner ขึ้นทุก alert ที่ active (sorted by severity)
- คลิก alert → ไป URL ที่ relevant (เช่น click "stale PR" → ไป PR detail)
- Empty state: no project → "เลือก project" message
- Empty data: project มีอยู่ แต่ไม่มี cashflow → "ยังไม่มีรายการบันทึก"

### Reports

- 5 report cards ปรากฏใน `/project-control?tab=reports`
- คลิก Generate → table render < 500ms
- Export CSV → download file ที่ Excel เปิดได้ (UTF-8 BOM)
- Print → browser print dialog (CSS @print rules ครบ)
- Project filter ทำงาน (filter ก่อน aggregate)

### Common

- `npm test` ผ่าน (computeProjectSnapshot + all 5 report generators)
- `npm run build` ผ่าน
- TH/EN dictionary ครบ
- ไม่กระทบ data layer (read-only aggregation)

## 8. Tests to Write

```ts
// src/projectControl.test.ts

describe("computeProjectSnapshot", () => {
  it("sums actual from confirmed cashflow entries only (excludes draft/void)", () => { ... });
  it("sums committed from approved/ordered/received PRs (excludes draft/rejected/cancelled)", () => { ... });
  it("scopes to projectId (cashflow + PR + invoices)", () => { ... });
  it("computes marginPct = (plannedRevenue - actualCost) / plannedRevenue", () => { ... });
  it("returns null marginPct when plannedRevenue = 0 (internal project)", () => { ... });
  it("orders costCodeRollups by % spent desc", () => { ... });
});

describe("generateAlerts", () => {
  it("emits over_budget when actual > budget", () => { ... });
  it("emits near_budget at >= 85% threshold (customizable)", () => { ... });
  it("emits overdue when project.daysRemaining < 0 AND status in [normal, delayed]", () => { ... });
  it("emits stale_pr for PR in submitted state >30 days", () => { ... });
  it("emits low_margin when marginPct < 10", () => { ... });
  it("respects custom thresholds from settings", () => { ... });
  it("sorts alerts by severity (critical > warn > info)", () => { ... });
});

describe("Reports", () => {
  describe("Project P&L", () => {
    it("returns revenue, expense, profit per period", () => { ... });
    it("handles internal project (no revenue) gracefully", () => { ... });
  });
  describe("Cash flow forecast", () => {
    it("projects 90 days from confirmed + scheduled milestones", () => { ... });
  });
  describe("Cost variance", () => {
    it("returns row per cost code with planned/actual/variance/pct", () => { ... });
  });
  describe("Supplier spend", () => {
    it("aggregates cashflow entries by supplierId in last 12 months", () => { ... });
    it("returns top 10 by total spend", () => { ... });
  });
  describe("PR aging", () => {
    it("returns PRs in submitted/approved >threshold days, sorted by age desc", () => { ... });
  });
});

describe("CSV export", () => {
  it("uses UTF-8 BOM for Thai characters in Excel", () => { ... });
  it("escapes commas and quotes in values", () => { ... });
});
```

## 9. Out-of-scope but Planned

- v0.2 Custom report builder (drag-drop fields, save report templates)
- v0.2 Cross-project comparison (multi-project P&L, portfolio view)
- v0.2 Historical snapshots (compare month-over-month, year-over-year)
- v0.3 Scheduled email reports (weekly/monthly summary)
- v0.3 Chart export (PNG/SVG)
- v0.3 PDF report generation (server-side, branded)
- Phase 2 AI: "Ask question, get answer + chart" — free-form NL query over project data
- Phase 2 AI: Variance explanation ("ทำไม Structure เกินงบ?" → narrative from PR/RFQ changes)
- Phase 2 AI: Benchmark vs similar projects in workspace

## 10. Mapping to Master PRD/ERD

| Master PRD | This PRD section |
|---|---|
| `docs/PRD.md` Section 9 Business Apps | Section 1-7 |
| `docs/PRD.md` Section 6 Architecture (read-only aggregation, no direct backend access) | Section 3 |
| `docs/BUILK_PARITY_PLAN.md` Section 4.6-4.7 + Sprint 6 | This entire PRD |
| `docs/PROJECT_PRD.md` Section 4 (Project entity) | Section 4 (read source) |
| `docs/COST_CODES_PRD.md` Section 4 (CostCode) | Section 4 (read source) |
| `docs/PROCUREMENT_PRD.md` Section 4 (PR + RFQ) | Section 4 (read source) |
| `docs/CASHFLOW_PRD.md` (extended Sprint 5) | Section 4 (read source) |

## 11. Implementation Notes for Codex

1. **Create `src/projectControl.ts`** — pure aggregation module, no persisted entities
2. **Pure functions**: `computeProjectSnapshot()`, `generateAlerts()`, `generate{ReportType}()` × 5 — easy to test
3. **Add to `src/apps.ts`**: app `projectControl` (route `/project-control`, group `procurement`, professionTags `qs_estimator`/`owner_developer`/`contractor`, monetization `freemium`, access `read`, privacy `workspace`, AI `optional`)
4. **UI**: extract from `MockupGallery.tsx` `ProjectControlMockup` → `src/workspace/apps/project-control/ProjectControlPanel.tsx`
5. **Performance**: `computeProjectSnapshot` should run < 200ms for workspace with 50 projects × 500 cashflow entries × 100 cost codes. If slower, memoize per (projectId, lastUpdated)
6. **CSV utility**: create `src/csvExport.ts` shared helper (UTF-8 BOM, comma escape, RFC 4180) — reusable by other modules
7. **Print CSS**: add `@media print` block to `styles.css` for report pages (hide nav/sidebar, full-width table)
8. **No new SQL migration needed** — all queries are SELECT joins over existing tables (Sprint 0-5 migrations); settings table optional:
   ```sql
   create table if not exists project_control_settings (
     workspace_id uuid primary key references workspaces(id) on delete cascade,
     default_report_type text default 'project_pl',
     alert_thresholds jsonb default '{"nearBudgetPct":85,"lowMarginPct":10,"staleDaysPR":30,"noActivityDays":14}',
     updated_at timestamptz default now()
   );
   -- RLS via is_workspace_member
   ```
9. **Wire to Project Detail page** (Sprint 0): "ภาพรวม" tab embeds snapshot directly (reuse computeProjectSnapshot)
10. **Wire to Hub Dashboard**: add tile "Projects over budget: N" / "Stale PRs: M"

## 12. Migration / Performance considerations

### When data grows beyond ~10K rows

- Move aggregation server-side (Supabase RPC function) instead of client computation
- Add materialized view: `project_financial_snapshot_mv` refreshed nightly
- Add real-time triggers on cashflow/PR inserts to invalidate cache

### CSV export for large reports

- > 10K rows: stream-write CSV chunks instead of building in-memory string
- > 100K rows: server-side generation + signed URL download

ตอนนี้ v0.1 ไม่มีปัญหา — workspace ทั่วไป < 1K rows ทั้ง dataset

---

**Ready for Codex Sprint 6** (after Sprint 0-5 done): เริ่มจาก `src/projectControl.ts` pure functions + tests → CSV utility → UI panel (dashboard + reports + settings) → wire Project Detail + Hub Dashboard → optional Supabase materialized view (if perf issue)
