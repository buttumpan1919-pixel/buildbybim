# Suppliers Directory — Sub-PRD

Updated: 2026-05-24
Status: Sprint 2 spec — pending implementation (depends on Sprint 0 Project + Sprint 1 Cost Codes done)
Source: `docs/BUILK_PARITY_PLAN.md` Section 4.2
Implements: `docs/PRD.md` Section 9 + Section 6 Architecture

## 1. Purpose

Supplier directory + price history → ใช้ใน RFQ (Sprint 4) เพื่อเชิญ supplier เสนอราคา + เปรียบเทียบราคาในอดีต + tracking total spend.

เป้าหมาย:
- ที่เก็บรายชื่อ supplier (โรงงาน/ผู้รับเหมาช่วง/ร้านวัสดุ) ของ workspace
- Price history per supplier × cost code (track ราคาที่เคยซื้อ)
- Rating + notes สำหรับ subjective evaluation
- ใช้เป็น input สำหรับ RFQ workflow (Sprint 4) + Cost Recording (Sprint 5)

Builk เรียกหน้านี้ว่า "รายชื่อผู้รับเหมา" — เราเรียก "Suppliers" หรือ "ผู้ขาย/ผู้รับเหมาช่วง"

## 2. Non-Goals (v0.1)

- ไม่ทำ supplier rating system แบบ multi-user vote — single rating ต่อ workspace
- ไม่ทำ contract/agreement attachment — รอ v0.2
- ไม่ทำ supplier portal (supplier login เพื่อตอบ RFQ) — รอ v0.5
- ไม่ทำ auto sync จาก e-marketplace (Lazada, Shopee) — out of scope
- ไม่ทำ tax invoice OCR — supplier ใช้ตรงจาก receipt OCR (LINE intake Phase 2)
- ไม่ทำ payment processing — แค่ track ว่า paid/unpaid

## 3. Storage Contract

| Storage Key | Module | Type |
|---|---|---|
| `suppliers.directory.v1` | `src/suppliers.ts` | `SupplierState` |
| `suppliers.price-history.v1` | `src/suppliers.ts` | `PriceHistoryState` (อาจ merge เป็น state เดียว) |

ใช้ `defaultStorageAdapter` + `readJson`/`writeJson` ตาม PRD Section 6.

## 4. Data Model

```ts
export type SupplierType = "manufacturer" | "distributor" | "subcontractor" | "service" | "other";

export type Supplier = {
  id: string;
  workspaceId: string;
  name: string;                 // เต็ม: "บจก. ปูนซิเมนต์ไทย"
  shortName: string;            // "SCC"
  type: SupplierType;
  taxId: string;                // เลข VAT (13 หลัก)
  address: string;
  city: string;                 // separate field for filter
  province: string;
  postalCode: string;
  phone: string;
  email: string;
  lineId: string;               // important for Thai context (LINE intake Phase 2)
  paymentTerms: string;         // "30 days", "Cash", "45 days"
  rating: number;               // 0-5 (0 = unrated)
  notes: string;
  tags: string[];               // ["main supplier", "fast delivery", "credit issue"]
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SupplierPriceHistoryEntry = {
  id: string;
  workspaceId: string;
  supplierId: string;
  costCodeId: string;           // FK to CostCode (Sprint 1)
  itemDescription: string;      // free-text เพิ่มเติม
  unitPrice: number;
  unit: string;
  quantity: number;             // optional
  totalAmount: number;          // computed = unitPrice * quantity
  quotedAt: string;             // ISO date
  sourceType: "rfq" | "po" | "manual" | "line_intake";
  sourceDocumentId: string;     // link to RFQ/PO if applicable
  note: string;
  createdAt: string;
};

export type SupplierState = {
  suppliers: Supplier[];
  priceHistory: SupplierPriceHistoryEntry[];
  updatedAt: string;
};

// Computed (for summary tile / list page)
export type SupplierSummary = {
  supplierId: string;
  name: string;
  totalSpend: number;           // sum of priceHistory totalAmount (last 12 months)
  orderCount: number;
  lastOrderDate: string;
  topCategories: string[];      // top 3 categories by spend
  averageRating: number;
};
```

### 4.1 Validation

- `name` required
- `taxId` 13 digits if present (Thai format)
- `email` valid format if present
- `rating` 0-5
- `paymentTerms` free-text but ควรมี suggestion (Cash/30 days/45 days/60 days)

### 4.2 Customer Type heuristics

Auto-detect on form save:
- name starts with "บจก." or "บมจ." → `manufacturer` or `distributor`
- name มี "รับเหมา" หรือ "ก่อสร้าง" → `subcontractor`
- name เป็นบุคคล (no company prefix) → `service` (freelance)

User override always wins.

## 5. Cross-App Linkage

| Source | Field | Purpose |
|---|---|---|
| RFQ (Sprint 4) | `rfq.invitedSupplierIds` | invite supplier ให้เสนอราคา |
| RFQ response (Sprint 4) | `rfqResponse.supplierId` | track quote ตาม supplier |
| PO / BuildDocs (existing) | `documentInfo.companyName` ↔ Supplier | match PO กับ supplier directory |
| Cashflow entry (Sprint 5) | `cashflowEntry.supplierId` (new field) | track spend ตาม supplier |
| Cost Code (Sprint 1) | `priceHistory.costCodeId` | benchmark price ต่อ code |
| LINE intake (Phase 2) | OCR receipt → match supplier name | auto-fill supplier on cashflow draft |

## 6. UI Flow

### 6.1 Subnav (new app `suppliers`)

| Tab | Status v0.1 | Content |
|---|---|---|
| `directory` (default) | Sprint 2 | list + detail panel (split-view) |
| `price-history` | Sprint 2 | price history table cross-supplier |
| `analytics` | Sprint 6 | top suppliers by spend + price drift |
| `import` | Sprint 2 | CSV import |

### 6.2 Directory page (`/suppliers`)

ตาม mockup ที่ `/mockup?tab=suppliers`:

```
┌── List (left, 1fr) ────────┐  ┌── Detail (right, 1.4fr) ──────────┐
│ [search]   [+ เพิ่ม]       │  │ บจก. ปูนซิเมนต์ไทย (SCC)         │
│                            │  │ Tax: 0105-xxx-1234                │
│ ⭐⭐⭐⭐⭐ SCC      ฿1.2M    │  │ Bangkok · Manufacturer            │
│ ⭐⭐⭐⭐  TPI       ฿850K   │  │ 30 days payment terms             │
│ ⭐⭐⭐⭐  Insee     ฿620K   │  │                                   │
│ ⭐⭐⭐   NorthMat  ฿280K   │  │ Recent prices:                    │
│ ⭐⭐⭐⭐⭐ ThaiSteel ฿2.1M   │  │ ปูน 50kg  | ถุง | ฿240  -3% ↓     │
│                            │  │ ปูน 50kg  | ถุง | ฿245           │
│                            │  │ ทรายหยาบ | ลบ.ม. | ฿480  +2% ↑   │
└────────────────────────────┘  └───────────────────────────────────┘
```

### 6.3 Add / Edit Supplier form

- **Name** (required) + Short name
- **Type** (dropdown 5 options)
- **Tax ID** (13-digit input + auto-format `0-1057-xxxxx-xx-x`)
- **Address** + **City** + **Province** + **Postal code**
- **Phone** + **Email** + **LINE ID**
- **Payment terms** (autocomplete: Cash, 7d, 15d, 30d, 45d, 60d, 90d)
- **Rating** (0-5 stars)
- **Notes** (textarea)
- **Tags** (multi-select, free-create)
- **Active** (toggle, default true)

### 6.4 Add Price History (inline)

จากหน้า supplier detail:
- เลือก Cost Code (autocomplete จาก Sprint 1)
- Description (optional, ถ้า cost code ไม่ครอบคลุม)
- Unit price + Unit
- Quantity (optional)
- Quoted at (date)
- Source: manual / paste from RFQ / paste from PO
- Note

### 6.5 CSV Import (Builk format)

1. Upload .csv
2. Auto-detect columns: name, taxId, address, phone, email
3. Field mapping wizard
4. Preview + skip duplicates by `taxId` or `name`
5. Save

## 7. Acceptance Criteria (v0.1 Sprint 2)

- เปิด `/suppliers` เห็น split-view list + detail
- เพิ่ม supplier ใหม่ → form validate tax_id (13 digits)
- เลือก supplier ใน list → detail panel update
- เพิ่ม price history entry → ผูก cost code (autocomplete จาก Sprint 1)
- Sort suppliers by: total spend / last order / rating
- Filter by: type / city / active
- Tax ID format suggestion (`0-1057-xxxxx-xx-x`)
- Rating starbar UI (click to set)
- Delete supplier → soft-delete (active=false), เตือนถ้ามี priceHistory
- `npm test` ผ่าน (validation, search, sort, computed summary)
- `npm run build` ผ่าน
- รองรับ TH/EN

## 8. Tests to Write

```ts
// src/suppliers.test.ts

describe("Supplier validation", () => {
  it("requires name", () => { ... });
  it("validates tax_id 13 digits", () => { ... });
  it("accepts empty tax_id", () => { ... });
  it("validates email format if present", () => { ... });
  it("clamps rating to 0-5", () => { ... });
});

describe("Supplier type auto-detect", () => {
  it("detects บจก. as manufacturer", () => { ... });
  it("detects รับเหมา as subcontractor", () => { ... });
  it("falls back to service for personal name", () => { ... });
});

describe("Tax ID formatter", () => {
  it("formats 13 digits to dashed pattern", () => { ... });
  it("strips non-digits before formatting", () => { ... });
});

describe("computeSupplierSummary", () => {
  it("sums totalSpend from price history last 12 months", () => { ... });
  it("returns lastOrderDate as max(quotedAt)", () => { ... });
  it("returns top 3 categories by spend", () => { ... });
});

describe("CSV import", () => {
  it("parses Builk supplier format", () => { ... });
  it("skips duplicates by tax_id", () => { ... });
});
```

## 9. Out-of-scope but Planned

- v0.2 Contract/agreement attachment per supplier
- v0.2 Bulk price adjustment (% change across cost codes)
- v0.2 Supplier comparison view (3 suppliers × top 10 cost codes matrix)
- Sprint 4 RFQ workflow integration
- Sprint 5 Cashflow entry auto-fill from supplier select
- Sprint 6 Supplier analytics (top spend, price drift, delivery performance)
- Phase 2 AI rating from delivery/payment history pattern
- Phase 2 LINE intake — supplier match from OCR receipt → auto-fill cashflow
- v0.5 Supplier portal — supplier login to respond RFQ
- v0.6 e-marketplace sync (Lazada/Shopee/SCG website price feed)

## 10. Mapping to Master PRD/ERD

| Master PRD reference | This PRD section |
|---|---|
| `docs/PRD.md` Section 6 Architecture | Section 3 |
| `docs/PRD.md` Section 9 Business Apps | Section 1-7 |
| `docs/BUILK_PARITY_PLAN.md` Section 4.2 + Sprint 2 | This entire PRD |
| `docs/COST_CODES_PRD.md` Section 5 (cross-link) | Section 5 row "Cost Code" |
| `docs/PLATFORM_ERD.md` (no direct entity — new in this PRD) | Section 4 |

## 11. Implementation Notes for Codex

1. **Create `src/suppliers.ts`** — module-isolated, uses storage adapter
2. **Combine state**: `SupplierState` includes both suppliers + priceHistory (1 storage key, simpler)
3. **Add to `src/apps.ts`**: app `suppliers` (route `/suppliers`, group `procurement`, category `construction`, professionTags `contractor`/`qs_estimator`, monetization `freemium`, access `write`, privacy `workspace`, AI `optional`)
4. **Sidebar group `procurement`** (created in Sprint 1)
5. **UI**: extract from `MockupGallery.tsx` `SuppliersMockup` → `src/workspace/apps/suppliers/SuppliersPanel.tsx`
6. **Seed**: 5 suppliers from mockup (SCC, TPI, Insee, NorthMat, ThaiSteel) เป็น optional seed (ทาง user เลือก import on first run)
7. **Tests**: write `src/suppliers.test.ts` per Section 8
8. **SQL migration**: `supabase/migrations/0005_suppliers.sql` (see Section 12)
9. **Update Hub Dashboard**: tile "Suppliers: X / Last order: Y days ago"
10. **Wire to Cashflow** (Sprint 5): cashflow entry form gets supplier autocomplete

## 12. Sample SQL migration

```sql
-- 0005_suppliers.sql

create table if not exists suppliers (
  id text primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  short_name text default '',
  type text not null default 'other' check (type in (
    'manufacturer', 'distributor', 'subcontractor', 'service', 'other'
  )),
  tax_id text default '',
  address text default '',
  city text default '',
  province text default '',
  postal_code text default '',
  phone text default '',
  email text default '',
  line_id text default '',
  payment_terms text default '',
  rating integer default 0 check (rating >= 0 and rating <= 5),
  notes text default '',
  tags text[] default '{}',
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index suppliers_workspace_idx on suppliers(workspace_id);
create index suppliers_active_idx on suppliers(workspace_id, active);
create index suppliers_tax_id_idx on suppliers(workspace_id, tax_id) where tax_id != '';

create table if not exists supplier_price_history (
  id text primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  supplier_id text not null references suppliers(id) on delete cascade,
  cost_code_id text,                -- FK to cost_codes when Sprint 1 live
  item_description text default '',
  unit_price numeric(14, 2) not null,
  unit text not null,
  quantity numeric(14, 4) default 0,
  total_amount numeric(14, 2) default 0,
  quoted_at date not null,
  source_type text default 'manual' check (source_type in (
    'rfq', 'po', 'manual', 'line_intake'
  )),
  source_document_id text default '',
  note text default '',
  created_at timestamptz default now()
);

create index price_history_workspace_idx on supplier_price_history(workspace_id);
create index price_history_supplier_idx on supplier_price_history(supplier_id);
create index price_history_cost_code_idx on supplier_price_history(cost_code_id) where cost_code_id is not null;
create index price_history_quoted_idx on supplier_price_history(workspace_id, quoted_at desc);

alter table suppliers enable row level security;
alter table supplier_price_history enable row level security;

create policy suppliers_select on suppliers
  for select using (is_workspace_member(workspace_id));
create policy suppliers_insert on suppliers
  for insert with check (is_workspace_member(workspace_id));
create policy suppliers_update on suppliers
  for update using (is_workspace_member(workspace_id));
create policy suppliers_delete on suppliers
  for delete using (is_workspace_member(workspace_id));

create policy price_history_select on supplier_price_history
  for select using (is_workspace_member(workspace_id));
create policy price_history_insert on supplier_price_history
  for insert with check (is_workspace_member(workspace_id));
create policy price_history_update on supplier_price_history
  for update using (is_workspace_member(workspace_id));
create policy price_history_delete on supplier_price_history
  for delete using (is_workspace_member(workspace_id));

drop trigger if exists suppliers_updated_at on suppliers;
create trigger suppliers_updated_at
  before update on suppliers
  for each row execute function set_updated_at();
```

---

**Ready for Codex Sprint 2** (after Sprint 1 Cost Codes): เริ่มจาก `src/suppliers.ts` + seed (optional) + tests → app manifest → UI panel → SQL migration → wire ไปยัง Cost Code autocomplete
