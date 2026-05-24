# Project Entity + List/Detail App — Sub-PRD

Updated: 2026-05-24
Status: Sprint 0 spec — pending implementation
Source: `docs/BUILK_PARITY_PLAN.md` Section 4.0 + Builk `/costcontrol/project/search` analysis
Implements: `docs/PRD.md` Section 9 Business Apps + Section 6 Architecture (storage adapter)

## 1. Purpose

`projects` คือ entry point ของ Buildbybim Cost Control workflow ทั้งหมด — ทุก PR, RFQ, cost recording, invoice ต้องผูกกับ Project ก่อน. หน้านี้คือสิ่งที่ user เห็นทันทีเมื่อเข้า workspace.

เป้าหมาย: เลียน Builk's `/costcontrol/project/search` workflow (list + carousel + filter + table) + เพิ่ม:
- AI insights (Phase 2): margin warning, NL search, age-based action
- Multi-company switcher (UI ใหม่ — Supabase `workspaces` table มีอยู่แล้ว)
- 4 financial fields แบบ planned/actual คู่ขนาน (ไม่ใช่แค่ budget vs spent)

## 2. Non-Goals (v0.1)

- ไม่ทำ Gantt chart / schedule แบบเต็ม
- ไม่ทำ resource leveling
- ไม่ทำ Critical Path Method analysis
- ไม่ทำ project template (สร้าง project ใหม่จาก template) — รอ v0.2
- ไม่ทำ sub-project / change order linking — รอ Sprint 7
- ไม่ทำ rollup engine automatic (manual update ก่อน) — รอ Sprint 5
- ไม่ทำ multi-currency — THB only

## 3. Storage Contract

| Storage Key | Module | Type |
|---|---|---|
| (existing extended) `builddocs-pro.workspace.v1` → `projects[]` | `src/projects.ts` | `Project[]` extended fields |
| (or new) `projects.list.v1` | `src/projects.ts` | `ProjectListState` |

**Recommendation**: สร้าง `src/projects.ts` ใหม่ที่ใช้ adapter pattern (ตาม `cashflow.ts`/`membership.ts`) แทนการ extend `storage.ts` เพื่อ:
- เป็น module-isolated ตาม PRD Section 6
- ใช้ `defaultStorageAdapter` + `readJson`/`writeJson` ตรง
- รองรับ Supabase sync ผ่าน adapter (Phase C ทำได้แล้ว)
- ขยายเป็น relational mapper (Phase D) ได้ตรงไปยัง `projects` table

Migration: เก็บ `ProjectRecord` เดิมใน `storage.ts` ไว้ก่อน → `src/projects.ts` ใหม่ค่อย ๆ ดูดเอา + sync ระหว่างกัน (1 source of truth ในเวอร์ชันถัดไป)

## 4. Data Model

```ts
export type ProjectStatus = "draft" | "normal" | "delayed" | "closed" | "cancelled";
export type CustomerType = "individual" | "gov" | "corporate";

export type Project = {
  id: string;                       // UUID v4 (cuid for cloud)
  workspaceId: string;              // tenant boundary (Supabase workspace.id)
  code: string;                     // user-defined "j-2600" (auto-suggest from pattern)
  name: string;
  clientId: string;                 // FK Client.id, empty = no customer (internal)
  clientName: string;               // denormalized for display
  customerType: CustomerType | null;
  contractValue: number;            // มูลค่าสัญญา (THB, non-negative)
  plannedCost: number;              // ต้นทุนที่วางแผน
  actualCost: number;               // computed rollup จาก cashflow entries (Sprint 5)
  plannedRevenue: number;
  actualRevenue: number;            // computed rollup จาก invoice paid
  startDate: string;                // ISO date "YYYY-MM-DD"
  endDate: string;                  // ISO date
  status: ProjectStatus;
  hasBudget: boolean;               // plannedCost > 0
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectListState = {
  projects: Project[];
  updatedAt: string;
};

// Computed fields (not stored — calculated at read time)
export type ProjectComputed = Project & {
  daysRemaining: number;            // negative = overdue
  marginPct: number | null;         // (plannedRevenue - actualCost) / plannedRevenue * 100
  budgetRemaining: number;          // plannedCost - actualCost
  isOverBudget: boolean;
  isOverdue: boolean;
};
```

### 4.1 Project code convention

- Pattern: `{prefix}-{YY}{seq}` (Builk uses `j-YYNN`)
- User-configurable prefix per workspace (default `j-`)
- Auto-suggest next: scan existing codes in workspace, pick max `seq` + 1, year-roll on Jan 1
- Allow user override (free-text)

```ts
function suggestNextProjectCode(projects: Project[], prefix = "j-"): string {
  const year = new Date().getFullYear() % 100;
  const yearPrefix = `${prefix}${year.toString().padStart(2, "0")}`;
  const seqs = projects
    .map((p) => p.code)
    .filter((c) => c.startsWith(yearPrefix))
    .map((c) => parseInt(c.slice(yearPrefix.length), 10))
    .filter((n) => Number.isFinite(n));
  const next = (seqs.length > 0 ? Math.max(...seqs) : 0) + 1;
  return `${yearPrefix}${next.toString().padStart(2, "0")}`;
}
```

### 4.2 Status state machine

```
            create
              ↓
            draft
              ↓ start work
            normal ────────────┐
              ↓ ↑               │
            delayed             │
              ↓                 │
            closed              │
                                ↓
                            cancelled
```

- `draft`: ตั้งโครงการแต่ยังไม่เริ่ม
- `normal`: กำลังทำ on track
- `delayed`: กำลังทำ แต่เลย deadline หรือเกินงบ
- `closed`: ปิดงานเรียบร้อย
- `cancelled`: ยกเลิกระหว่างทาง

**Auto status transitions** (Sprint 1+):
- `normal` → `delayed` ถ้า `daysRemaining < 0` หรือ `actualCost > plannedCost * 1.05`
- ไม่ทำ auto → `closed`/`cancelled` (manual only — เกี่ยวกับ business action)

### 4.3 Computed fields

```ts
function computeProject(project: Project): ProjectComputed {
  const today = new Date();
  const endMs = Date.parse(project.endDate);
  const daysRemaining = Math.floor((endMs - today.getTime()) / (24 * 60 * 60 * 1000));
  const marginPct =
    project.plannedRevenue > 0
      ? ((project.plannedRevenue - project.actualCost) / project.plannedRevenue) * 100
      : null;
  const budgetRemaining = project.plannedCost - project.actualCost;
  return {
    ...project,
    daysRemaining,
    marginPct,
    budgetRemaining,
    isOverBudget: project.hasBudget && project.actualCost > project.plannedCost,
    isOverdue: daysRemaining < 0 && (project.status === "normal" || project.status === "delayed")
  };
}
```

## 5. Cross-App Linkage

| Source | Field | Purpose |
|---|---|---|
| BuildDocs document | `documentInfo.projectName` → `Project.name` | match documents กับ project |
| Cashflow entry (Sprint 5) | `projectId` | scope expenses ตาม project + rollup `actualCost` |
| BOQ Task Linkage | `BoqProjectTask.projectId` | task อยู่ใน project |
| PR (Sprint 3) | `pr.projectId` | PR ผูก project |
| RFQ (Sprint 4) | `rfq.projectId` | RFQ ผูก project |
| Workspace switcher | `workspaceId` → `Supabase workspaces.id` | tenant boundary |

## 6. UI Flow

### 6.1 Subnav (new app `projects` in `src/apps.ts`)

| Tab | Status v0.1 | Content |
|---|---|---|
| `list` (default) | Sprint 0 | List page (mockup ทำแล้ว) |
| `archive` | Sprint 2 | โครงการที่ closed/cancelled แล้ว, hidden จาก default list |
| `analytics` | Sprint 6 | ภาพรวมข้าม project |

### 6.2 List page layout (`/projects`)

```
┌──────────────────────────────────────────────────────┐
│ [Company switcher]   โครงการทั้งหมด N · เครดิต X    │
├──────────────────────────────────────────────────────┤
│ ┌─ Recent Active Carousel (4 cards) ─────────────┐  │
│ │ [card] [card] [card] [card]                   │  │
│ │  KPI: งบคงเหลือ · เวลา · กำไร %                │  │
│ └────────────────────────────────────────────────┘  │
│                                                      │
│ ┌─ Project Table ─────────────────────────────────┐ │
│ │ Filter chips: ทั้งหมด/ปกติ/ชะลอ/สิ้นสุด/ยกเลิก │ │
│ │ Search box                       [+ สร้างโครงการ] │
│ │ ┌──────────────────────────────────────────────┐│ │
│ │ │ code │ name │ customer │ contract │ ...     ││ │
│ │ │ ──────────────────────────────────────       ││ │
│ │ │ rows (sortable, click → detail)              ││ │
│ │ └──────────────────────────────────────────────┘│ │
│ │ Pagination "1-24 จาก 24"                        │ │
│ └─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

(ดู mockup ที่ `/mockup` → tab "Project List")

### 6.3 Detail page (`/projects/:id` หรือ `/projects?id=...`)

```
┌──────────────────────────────────────────────────────┐
│ Header: code · name · status badge · KPIs (5 cells) │
│         [+ บันทึกต้นทุน] [+ สร้าง PR] [⋯ More]      │
├──────────────────────────────────────────────────────┤
│ Tabs: ภาพรวม | PR (3) | RFQ (1) | PO (5) | บันทึกต้นทุน (28) | ใบแจ้งหนี้ (4) | รายงาน │
├──────────────────────────────────────────────────────┤
│ ภาพรวม tab:                                          │
│  ⚠ Alert: เลย deadline / เกินงบ                      │
│  Cost Breakdown bars (per cost code)                 │
│  ┌──────────────┐ ┌─────────────────────┐          │
│  │ Recent       │ │ AI Insights (Phase 2)│         │
│  │ activity     │ │ (dark card)         │          │
│  │ feed         │ │                     │          │
│  └──────────────┘ └─────────────────────┘          │
└──────────────────────────────────────────────────────┘
```

(ดู mockup ที่ `/mockup` → tab "Project Detail")

### 6.4 Create / Edit Project form

- Inline form ใน Project List page (modal/drawer) หรือ separate route
- Fields:
  - **Code** (auto-suggest + editable)
  - **Name** (required)
  - **Customer** (autocomplete จาก ClientRecord; "ไม่มีลูกค้า / internal" toggle)
  - **Customer type** (auto-detect จาก customer name pattern: "องค์การ..." → gov, "บจก..." → corporate, else individual; user override)
  - **Contract value** + **Planned cost** + **Planned revenue** (number)
  - **Start date** + **End date** (date pickers)
  - **Status** (default: `draft`)
  - **Notes** (text area)

- Validation:
  - `code` unique per workspace
  - `endDate` >= `startDate`
  - amounts >= 0
  - ถ้า `plannedCost === 0` → `hasBudget = false`, แสดง "ไม่มีงบประมาณ" badge

## 7. Acceptance Criteria (v0.1 Sprint 0)

- เปิด `/projects` เห็น list + carousel + table — ใช้ seed 6 projects ใน mockup ก่อน
- กดสร้างโครงการใหม่ → form prefill code "j-2601" (auto-next)
- เลือก customer type 3 แบบ → badge GOV/CORP แสดงถูก
- "ไม่มีลูกค้า" + "ไม่มีงบประมาณ" empty states render correct
- 5-state filter chips ใช้งานได้ + counter ถูก
- คลิก row → ไป `/projects?id=<id>` detail page
- Detail page: tabs render, overview tab แสดง cost breakdown + activity + AI insights placeholder
- Negative `daysRemaining` แดง + "เลย deadline X วัน"
- `npm test` ผ่าน (project status machine + code suggester + computed fields)
- `npm run build` ผ่าน
- รองรับ TH/EN (เพิ่ม `projects.copy.ts` หรือ inline language switch)

## 8. Tests to Write

```ts
// src/projects.test.ts

describe("suggestNextProjectCode", () => {
  it("returns j-26{seq+1} when codes exist for current year", () => {
    const code = suggestNextProjectCode([{ ...p, code: "j-2600" }, { ...p, code: "j-2601" }]);
    expect(code).toBe("j-2602");
  });
  it("starts from j-{YY}01 when no codes for current year", () => {
    expect(suggestNextProjectCode([])).toMatch(/^j-\d{2}01$/);
  });
  it("respects custom prefix", () => {
    expect(suggestNextProjectCode([], "p-")).toMatch(/^p-/);
  });
});

describe("computeProject", () => {
  it("returns negative daysRemaining for past endDate", () => { ... });
  it("returns positive marginPct when revenue > cost", () => { ... });
  it("flags isOverBudget when actualCost > plannedCost and hasBudget", () => { ... });
  it("returns null marginPct when plannedRevenue is 0 (internal project)", () => { ... });
});

describe("Project status transitions", () => {
  it("auto-transitions normal → delayed when overdue", () => { ... });
  it("auto-transitions normal → delayed when over 5% budget", () => { ... });
  it("never auto-transitions to closed/cancelled", () => { ... });
});

describe("Project load/save (storage adapter)", () => {
  it("loadProjects returns empty list when storage empty", () => { ... });
  it("upsertProject adds new + updates existing by id", () => { ... });
  it("uses defaultStorageAdapter not window.localStorage directly", () => { ... });
});
```

## 9. Out-of-scope but Planned

- v0.2 Project templates (สร้างจาก template)
- v0.2 Project archive view + filter
- v0.3 Project analytics (cross-project insights)
- Sprint 5 Rollup engine (actualCost/actualRevenue from cashflow + invoice events)
- Sprint 6 Project Dashboard (per-project budget vs actual)
- Sprint 7 Sub-project / change-order linking (`parentProjectId`)
- Sprint 7 Multi-company switcher full UI (`workspace_members` join)
- Phase 2 AI: BOQ→Project auto-create, NL search, margin early-warning, age-based action prompt
- Phase 2 LINE/voice expense input → auto-link to active project

## 10. Mapping to Master PRD/ERD

| Master PRD reference | This PRD section |
|---|---|
| `docs/PRD.md` Section 9 Business Apps | Section 1-7 |
| `docs/PRD.md` Section 6 Architecture (storage adapter) | Section 3 |
| `docs/PRD.md` Section 10 Shared UX (sidebar, topbar, multi-language) | Section 6 |
| `docs/IMPLEMENTED_ERD.md` `PROJECT_RECORD` (local TS) + `workspaces` (Supabase) | Section 4 |
| `docs/PLATFORM_ERD.md` PROJECT entity (lines 344-352) | Section 4 — superset |
| `docs/BUILK_PARITY_PLAN.md` Section 4.0 + Sprint 0 | This entire PRD |
| `docs/MEMBERSHIP_ACCESS_PRD.md` evaluateAppAccess | Section 6 (gate `projects` app per plan) |

## 11. Implementation Notes for Codex

1. **Create `src/projects.ts`** (don't extend `storage.ts`) — module-isolated, uses storage adapter
2. **Add `projects` app to `src/apps.ts`** with taxonomy fields (category: construction, professionTags: contractor/qs_estimator, monetization: freemium, accessLevel: write, privacyLevel: workspace, aiUsage: optional)
3. **Place in sidebar group `project`** before `boqData` (most used = first)
4. **Subnav**: `list` (default) · `archive` · `analytics`
5. **UI**: extract mockup components from `src/MockupGallery.tsx` `ProjectListMockup` + `ProjectDetailMockup` → `src/workspace/apps/projects/ProjectsPanel.tsx`
6. **Seed**: same 6 seed projects from `MockupGallery.tsx` as initial data
7. **Tests**: write `src/projects.test.ts` ตาม Section 8
8. **SQL migration**: `supabase/migrations/0003_projects.sql` — extended projects table per Section 4 schema + RLS via `is_workspace_member(workspace_id)`
9. **Update Hub Dashboard**: when projects exists, show "active projects: X / overdue: Y" tile
10. **Update PRD.md Section 0**: Sprint 0 → done after implementation

## 12. Sample SQL migration (Codex copy-paste base)

```sql
-- 0003_projects.sql (extends 0001_initial_platform.sql)

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  code text not null,
  name text not null,
  client_id uuid,
  client_name text default '',
  customer_type text check (customer_type in ('individual', 'gov', 'corporate')),
  contract_value numeric(14, 2) default 0,
  planned_cost numeric(14, 2) default 0,
  actual_cost numeric(14, 2) default 0,
  planned_revenue numeric(14, 2) default 0,
  actual_revenue numeric(14, 2) default 0,
  start_date date,
  end_date date,
  status text not null default 'draft' check (status in ('draft', 'normal', 'delayed', 'closed', 'cancelled')),
  has_budget boolean default false,
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (workspace_id, code)
);

create index projects_workspace_idx on projects(workspace_id);
create index projects_status_idx on projects(workspace_id, status);
create index projects_end_date_idx on projects(workspace_id, end_date);

alter table projects enable row level security;

create policy projects_select on projects
  for select using (is_workspace_member(workspace_id));
create policy projects_insert on projects
  for insert with check (is_workspace_member(workspace_id));
create policy projects_update on projects
  for update using (is_workspace_member(workspace_id));
create policy projects_delete on projects
  for delete using (is_workspace_member(workspace_id));

drop trigger if exists projects_updated_at on projects;
create trigger projects_updated_at
  before update on projects
  for each row execute function set_updated_at();
```

---

**Ready for Codex Sprint 0**: เริ่มจาก `src/projects.ts` → tests → app manifest → UI panel → SQL migration → ทดสอบใน `/projects` route
