# Cost Codes (CBS) — Sub-PRD

Updated: 2026-05-24
Status: Sprint 1 spec — pending implementation (depends on Sprint 0 Project done)
Source: `docs/BUILK_PARITY_PLAN.md` Section 4.1
Implements: `docs/PRD.md` Section 9 + Section 6 Architecture (storage adapter)

## 1. Purpose

Cost Code (CBS — Cost Breakdown Structure) คือ **spine** ของ Cost Control workflow ทั้งหมด — ทุก PR/RFQ/cost recording/report ผูกกับ cost code 1 ตัวเสมอ. ถ้าไม่มี cost code ที่ตรงกับงาน → user คีย์เป็น free-text → ทำ report aggregate ไม่ได้ → defeat purpose ของระบบ.

เป้าหมาย:
- มี library 100+ Thai construction cost codes (มาตรฐานอุตสาหกรรม) seed มาให้
- User เพิ่ม custom code ได้
- Import จาก Builk CSV / Excel
- AI auto-categorize เวลาบันทึก cost (Phase 2)
- ผูกกับ supplier price history (Sprint 2) เพื่อแสดง benchmark

## 2. Non-Goals (v0.1)

- ไม่ทำ multi-level CBS (4+ levels) — รองรับแค่ parent → child (2 levels)
- ไม่ทำ cost code translation (TH→EN) — Thai primary, English label optional
- ไม่ทำ versioning ของ cost code (revision history)
- ไม่ทำ approval workflow สำหรับ adding new cost code — user-direct edit
- ไม่ทำ unit conversion (ลบ.ม. ↔ ตร.ม. ↔ kg) — user เลือก unit ตรงๆ
- ไม่ทำ formula-based cost (= cost A + cost B * 0.5) — รอ v0.2

## 3. Storage Contract

| Storage Key | Module | Type |
|---|---|---|
| `cost-codes.catalog.v1` | `src/costCodes.ts` | `CostCodeState` |

ใช้ `defaultStorageAdapter` + `readJson`/`writeJson` ตาม PRD Section 6.

## 4. Data Model

```ts
export type CostCodeCategory =
  | "site"
  | "structure"
  | "architecture"
  | "mep"
  | "finishing"
  | "external"
  | "indirect"
  | "custom";

export type CostCodeUnit =
  | "lump_sum"
  | "sq_m"
  | "cubic_m"
  | "linear_m"
  | "piece"
  | "set"
  | "kg"
  | "ton"
  | "day"
  | "month"
  | "custom";

export type CostCode = {
  id: string;                   // UUID
  workspaceId: string;          // empty = system seed (shared); else custom per workspace
  code: string;                 // "01-100", "ST-040" — must be unique per workspace
  parentCode: string;           // empty = root, else points to parent's `code`
  name: string;                 // "งานคอนกรีต โครงสร้าง"
  nameEn: string;               // optional English label
  description: string;
  category: CostCodeCategory;
  defaultUnit: CostCodeUnit;
  customUnit: string;           // if defaultUnit === "custom"
  defaultUnitPrice: number;     // 0 = no benchmark
  active: boolean;              // false = soft-delete (still referenced by PRs)
  createdAt: string;
  updatedAt: string;
};

export type CostCodeState = {
  codes: CostCode[];
  updatedAt: string;
};
```

### 4.1 Validation

- `code` required + unique per workspace (excluding system seeds)
- `name` required (Thai)
- `parentCode` if present must reference existing `code`
- `defaultUnitPrice` >= 0
- `defaultUnit === "custom"` → `customUnit` required

### 4.2 Seed catalog (100 Thai cost codes — minimum 6 categories)

| Category | Code prefix | Count | Example sub-codes |
|---|---|---|---|
| `site` | `01` | ~10 | 01-100 ปรับระดับ, 01-200 รื้อถอน, 01-300 ขุดดิน, 01-400 ถมดิน, 01-500 ทำรั้วชั่วคราว |
| `structure` | `02` | ~15 | 02-100 ฐานราก, 02-200 เสา คสล., 02-300 คาน คสล., 02-400 พื้น คสล., 02-500 บันได, 02-600 หลังคาโครงเหล็ก |
| `architecture` | `03` | ~20 | 03-100 ผนังก่ออิฐ, 03-200 ฉาบปูน, 03-300 ติดประตู-หน้าต่าง, 03-400 ฝ้าเพดาน, 03-500 ติดตั้งกระเบื้องผนัง |
| `mep` | `04` | ~15 | 04-100 ระบบประปา, 04-200 ระบบไฟฟ้า, 04-300 ระบบสุขภัณฑ์, 04-400 ระบบแอร์, 04-500 ระบบ CCTV |
| `finishing` | `05` | ~20 | 05-100 ปูพื้นกระเบื้อง, 05-200 พื้นลามิเนต, 05-300 ทาสี, 05-400 บิวท์อิน, 05-500 ติดมุ้งลวด, 05-600 wallpaper |
| `external` | `06` | ~10 | 06-100 ปูทางเดิน, 06-200 จัดสวน, 06-300 ระบบรดน้ำ, 06-400 รั้วถาวร, 06-500 ที่จอดรถ |
| `indirect` | `07` | ~10 | 07-100 ค่าแรงควบคุมงาน, 07-200 ค่าออกแบบ, 07-300 ค่าขอใบอนุญาต, 07-400 ค่าประกัน, 07-500 ค่าขนส่ง |

ราคา default อ้างอิงจาก:
- ตำราราคามาตรฐานก่อสร้างของสำนักงบประมาณ (พิจารณา public domain)
- ราคากลางของผู้รับเหมาทั่วไปในกรุงเทพ-ปริมณฑล 2025-2026
- User สามารถปรับ default unit price ของ workspace ตัวเองได้

## 5. Cross-App Linkage

| Source | Field | Purpose |
|---|---|---|
| PR line items (Sprint 3) | `prLineItem.costCodeId` → `CostCode.id` | ผูก PR กับ cost code (required) |
| RFQ line items (Sprint 4) | `rfqLineItem.costCodeId` | RFQ ผูก cost code |
| Cashflow entry (Sprint 5) | `cashflowEntry.costCodeId` | cost recording ผูก code |
| Project Control Dashboard (Sprint 6) | aggregate by costCodeId per project | budget vs actual per code |
| BOQ Data (existing) | optional mapping `BoqCatalogRow.suggestedCostCode` | seed BOQ item แนะนำ cost code |
| Supplier price history (Sprint 2) | `priceHistory.costCodeId` | track ราคาตามcode |

## 6. UI Flow

### 6.1 Subnav (new app `costCodes`)

| Tab | Status v0.1 | Content |
|---|---|---|
| `catalog` (default) | Sprint 1 | tree view + search + add/edit |
| `import` | Sprint 1 | CSV import wizard + Builk format mapping |
| `export` | Sprint 1 | export to CSV/Excel |
| `usage` | Sprint 6 | analytics: which codes used most + price drift |

### 6.2 Catalog page (`/cost-codes` or `/cost-codes?tab=catalog`)

ตาม mockup ที่ `/mockup?tab=cost-codes`:

```
[Search ____________]  [+ เพิ่ม Code] [Import CSV] [Export]

🏗️ Site Work (01) — 5 codes              ▼ collapsible
   01-100  ปรับระดับ              ตร.ม.    ฿120
   01-200  รื้อถอน                ตร.ม.    ฿200
   ...

🏛️ Structure (02) — 15 codes              ▼
   02-100  ฐานราก                 ต้น      ฿8,500
   ...

[+ เพิ่ม Code] (inline form)
```

### 6.3 Add / Edit Code form

- **Code** (required, unique check)
- **Parent code** (autocomplete from existing codes)
- **Name** (Thai, required)
- **Name English** (optional)
- **Description** (textarea)
- **Category** (dropdown 8 options)
- **Default unit** (dropdown 11 options + "custom" field)
- **Default unit price** (number, optional)
- **Active** (toggle, default true)

### 6.4 CSV Import wizard

1. Upload .csv file (drag-drop or file picker)
2. Auto-detect Builk format vs custom
3. **Field mapping UI**: drag column → target field
   - Required: code, name, unit
   - Optional: parent_code, description, category, default_price
4. Preview table: 10 rows + validation errors highlighted
5. "Skip duplicates" vs "Update existing" toggle
6. Confirm → save → toast "import 87 codes (3 skipped)"

### 6.5 Export

- Format: CSV (Builk-compatible) / Excel / JSON
- Filter: all / category / active only

## 7. Acceptance Criteria (v0.1 Sprint 1)

- เปิด `/cost-codes` เห็น tree view ของ 100 seed codes
- กด collapse/expand แต่ละหมวด ทำงาน
- search "ปูน" → filter เหลือเฉพาะ code ที่มี "ปูน" ใน name/description
- กดเพิ่ม code ใหม่ → form validate code uniqueness
- Import CSV ของ Builk format → 80%+ rows ผ่าน (mismatch แสดงใน preview)
- Export → file โหลดได้ + reimport ได้สำเร็จ
- ลบ code → soft-delete (active=false), ถ้ามี PR ใช้อยู่ให้เตือน
- `npm test` ผ่าน (unique check, suggest, normalize, csv parse)
- `npm run build` ผ่าน
- รองรับ TH/EN ผ่าน dictionary

## 8. Tests to Write

```ts
// src/costCodes.test.ts

describe("CostCode validation", () => {
  it("rejects duplicate code in same workspace", () => { ... });
  it("allows same code in different workspaces", () => { ... });
  it("rejects parentCode that doesn't exist", () => { ... });
  it("normalizes negative defaultUnitPrice to 0", () => { ... });
});

describe("seed catalog", () => {
  it("loads 100+ codes across 7 categories", () => { ... });
  it("every root code has parentCode === ''", () => { ... });
  it("every child references valid parent", () => { ... });
});

describe("CSV import", () => {
  it("parses Builk format with default mapping", () => { ... });
  it("returns row-level errors for invalid rows", () => { ... });
  it("skipDuplicates mode keeps existing codes", () => { ... });
  it("updateExisting mode overwrites by code", () => { ... });
});

describe("search/filter", () => {
  it("matches name (Thai)", () => { ... });
  it("matches code prefix", () => { ... });
  it("case-insensitive", () => { ... });
});

describe("storage adapter usage", () => {
  it("uses defaultStorageAdapter (not localStorage directly)", () => { ... });
  it("loadCostCodes returns seed when storage empty", () => { ... });
});
```

## 9. Out-of-scope but Planned

- v0.2 Multi-level CBS (4+ levels)
- v0.2 Cost code versioning (revision history)
- v0.2 Bulk price update (% adjustment across category)
- v0.2 Unit conversion suggestions
- Sprint 6 Usage analytics (most-used codes, price drift over time)
- Phase 2 AI auto-categorize: photo/description → suggested cost code
- Phase 2 AI BOQ → cost code mapping when import BOQ from Builk/Excel

## 10. Mapping to Master PRD/ERD

| Master PRD reference | This PRD section |
|---|---|
| `docs/PRD.md` Section 6 Architecture | Section 3 |
| `docs/PRD.md` Section 9 Business Apps | Section 1-7 |
| `docs/IMPLEMENTED_ERD.md` (no direct entity yet) | Section 4 introduces |
| `docs/PLATFORM_ERD.md` (no direct entity — Section 4 ของเอกสารนี้คือ first cut) | Section 4 |
| `docs/BUILK_PARITY_PLAN.md` Section 4.1 + Sprint 1 | This entire PRD |

## 11. Implementation Notes for Codex

1. **Create `src/costCodes.ts`** module-isolated, uses storage adapter
2. **Seed file**: `src/costCodes.seed.ts` exports `seedThaiCostCodes(): CostCode[]` with ~100 Thai codes
3. **Add to `src/apps.ts`**: app `costCodes` (route `/cost-codes`, group `procurement`, category `construction`, professionTags `qs_estimator`/`contractor`, monetization `freemium`, access `write`, privacy `workspace`, AI `optional`)
4. **Sidebar group `procurement`**: contains `costCodes`, `suppliers`, `procurement` (Sprint 2+)
5. **UI**: extract from `MockupGallery.tsx` `CostCodesMockup` → `src/workspace/apps/cost-codes/CostCodesPanel.tsx`
6. **Tests**: write `src/costCodes.test.ts` ตาม Section 8
7. **SQL migration**: `supabase/migrations/0004_cost_codes.sql` (see Section 12)
8. **Update Hub Dashboard**: add summary tile "Custom cost codes: X" (workspace count, not seed)
9. **Update Project Detail page** (Sprint 0): cost breakdown bars ใช้ cost_codes ตรงๆ
10. **Update PROJECT_PRD Section 5**: add Cost Code linkage row

## 12. Sample SQL migration

```sql
-- 0004_cost_codes.sql

create table if not exists cost_codes (
  id text primary key,
  workspace_id uuid references workspaces(id) on delete cascade,
  code text not null,
  parent_code text default '',
  name text not null,
  name_en text default '',
  description text default '',
  category text not null check (category in (
    'site', 'structure', 'architecture', 'mep', 'finishing', 'external', 'indirect', 'custom'
  )),
  default_unit text not null,
  custom_unit text default '',
  default_unit_price numeric(14, 2) default 0,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (workspace_id, code)
);

create index cost_codes_workspace_idx on cost_codes(workspace_id);
create index cost_codes_parent_idx on cost_codes(workspace_id, parent_code);
create index cost_codes_active_idx on cost_codes(workspace_id, active);

alter table cost_codes enable row level security;

-- Allow read of: own workspace + system seeds (workspace_id IS NULL)
create policy cost_codes_select on cost_codes
  for select using (
    workspace_id is null or is_workspace_member(workspace_id)
  );

-- Write only to own workspace (not system seeds)
create policy cost_codes_insert on cost_codes
  for insert with check (
    workspace_id is not null and is_workspace_member(workspace_id)
  );

create policy cost_codes_update on cost_codes
  for update using (
    workspace_id is not null and is_workspace_member(workspace_id)
  );

create policy cost_codes_delete on cost_codes
  for delete using (
    workspace_id is not null and is_workspace_member(workspace_id)
  );

drop trigger if exists cost_codes_updated_at on cost_codes;
create trigger cost_codes_updated_at
  before update on cost_codes
  for each row execute function set_updated_at();

-- Seed insert (run separately as system data)
-- insert into cost_codes (id, workspace_id, code, name, category, default_unit, default_unit_price)
-- values ('seed-01-100', null, '01-100', 'ปรับระดับ', 'site', 'sq_m', 120), ...
```

---

**Ready for Codex Sprint 1** (after Sprint 0 Project): เริ่มจาก `src/costCodes.ts` + seed + tests → app manifest → UI panel → SQL migration
