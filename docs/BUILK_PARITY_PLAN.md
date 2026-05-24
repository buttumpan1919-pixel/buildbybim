# Builk Parity + AI Differentiation Plan

Created: 2026-05-24
Status: **Decision document** — owner must pick one of 3 variants before implementation
Owner: Buildbybim.space

> **Purpose**: ผู้ใช้ Builk 30,000+ บริษัทพิสูจน์แล้วว่า construction cost control workflow แบบ procurement-style (Cost Code → Project → PR → RFQ → Cost Recording → Invoice → Dashboard) ใช้งานได้จริงในตลาดไทย. แผนนี้สรุปว่าจะ "เลียนแบบ Builk แค่ไหน" และจะ layer AI/design/agent ทับยังไง.

---

## 0. Decision Framework — owner ต้องตัดสิน 5 เรื่องก่อนเริ่ม

1. **Strategy variant** (A/B/C ด้านล่าง)
2. **Target user แรก**: contractor SME / architect studio / freelancer / hybrid
3. **Migration path**: import Builk export / manual onboarding / both
4. **Pricing position**: ฟรีกว่า Builk / แพงกว่า + คุณภาพ AI ดีกว่า / เท่ากันแต่ทำได้มากกว่า
5. **Timeline tolerance**: 4 สัปดาห์ / 8 สัปดาห์ / 12 สัปดาห์ + ขนาดทีม

---

## 1. Builk Module Inventory (ที่ต้องตัดสินใจว่าจะ mirror อะไรบ้าง)

| # | Builk Module | คำไทย | Workflow position | Volume usage (สมมติ) |
|---:|---|---|---|---|
| 1 | **Cost Codes (CBS)** | งบประมาณตามหมวด | Setup phase | สูง (ทุก project) |
| 2 | **Project Setup** | สร้างโครงการ + plan | Setup phase | สูง |
| 3 | **Purchase Request (PR)** | ใบขอซื้อ | Daily ops | สูงมาก |
| 4 | **Price Quotation (RFQ)** | ขอราคาเทียบ supplier | Pre-PO | กลาง |
| 5 | **Cost Recording** | บันทึกต้นทุนจริง | Daily ops | สูงมาก |
| 6 | **Invoice/Revenue** | ใบแจ้งหนี้รายโครงการ | Billing | กลาง |
| 7 | **Project Dashboard** | budget vs actual real-time | Reporting | สูง (ทุกวัน) |
| 8 | **Reports (9 types)** | งบกำไร/ขาดทุน/cashflow/etc. | Monthly | กลาง |
| 9 | **List Manager** | team/supplier/customer directory | Setup | กลาง |
| 10 | **Audit Trail** | log การเปลี่ยนแปลง | Compliance | ต่ำ (admin) |
| 11 | **Email Distribution** | ส่งเอกสารผ่าน email | Daily | สูง |
| 12 | **Multi-business entity** | หลายบริษัทใน account เดียว | Setup | กลาง (agency) |
| 13 | **Mobile responsive** | ใช้บนมือถือ/แท็บเล็ต | Cross-cut | สูง |

**Key insight ของ Builk's UX**: ทุก action เริ่มจาก **cost code** เสมอ — สร้าง PR ต้องระบุ cost code, บันทึก cost ต้องระบุ cost code, รายงานทุกอันแยกตาม cost code. นี่คือ "spine" ของระบบ — copy spine นี้ก็คุ้นเลย.

---

## 2. Buildbybim Current Assets (สิ่งที่มีแล้ว ใช้ต่อได้)

| Builk module | Buildbybim equivalent | สถานะ | File ปัจจุบัน |
|---|---|---|---|
| Cost Codes (CBS) | BOQ Catalog (per-item, not category-tree) | partial | `src/data.ts` boqCatalogRows |
| Project Setup | ProjectRecord | partial | `src/storage.ts` ProjectRecord |
| Purchase Request | — | ❌ ไม่มี | (need new module) |
| Price Quotation (RFQ) | — | ❌ ไม่มี | (need new module) |
| Cost Recording | Cashflow Entry (NOT project-scoped) | partial | `src/cashflow.ts` |
| Invoice/Revenue | BuildDocs invoice doc | ✅ มี | `src/App.tsx` BuildDocs |
| Project Dashboard | Hub Dashboard (workspace-wide) | partial | `src/App.tsx` WorkspaceAppPanel hub |
| Reports | — | ❌ ไม่มี | (need new module) |
| List Manager | Clients + Employees | partial | `src/storage.ts` ClientRecord, EmployeeRecord |
| Audit Trail | Membership AuditLog (admin only) | partial | `src/membership.ts` |
| Email Distribution | (Web Share API only) | partial | — |
| Multi-business entity | Workspaces (Supabase) | ✅ มี | `supabase/migrations/0001_*` workspaces |
| Mobile responsive | partial responsive | partial | `src/styles.css` |

**Gap แบบกว้าง**: เราขาด **Suppliers directory**, **PR/RFQ workflow**, **Project-scoped cost recording**, **Per-project dashboard**, **Standard reports**.

---

## 3. Three Strategy Variants

### Variant A — Full Builk Parity (Phase 1) → AI Overlay (Phase 2)

**ปรัชญา**: ทำให้ feel เหมือน Builk ก่อน 100% → คนคุ้นจะ migrate ได้ทันที → ค่อย showcase AI ทีหลัง

**Pros:**
- Migration story แข็งสุด: "ใช้ Builk อยู่? เปลี่ยนมาเราได้เลย workflow เหมือนกัน + AI"
- Risk ต่ำ — Builk validate UX แล้ว
- Codex implement ได้ตรงสุด (มี Builk เป็น reference)
- Network effect: target user ที่มีอยู่ของ Builk = pool ใหญ่
- Marketing คำตอบง่าย "Builk แต่ดีกว่า"

**Cons:**
- AI ค่อยมา → ไม่ได้ใช้ value differentiation ตั้งแต่ day 1
- คนใหม่ที่ยังไม่ใช้ Builk อาจไม่เห็น "ทำไมต้องเลือกเราแทน Builk"
- Implement modules ใหม่ 4-6 ตัว — งานใหญ่ ~3-4 สัปดาห์
- เสี่ยงดู "me-too" ในตา investor/partner

**Timeline** (single dev / Codex pair):

| Sprint | สัปดาห์ | งาน |
|---|---|---|
| 1 | 1 | Cost Codes (CBS) library + Thai seed (~100 codes) + UI |
| 2 | 2 | Suppliers directory + price history |
| 3 | 3 | Project Setup polish + ProjectScope linkage to Cost Codes |
| 4 | 4 | Purchase Request (PR) workflow + state machine (draft/sent/approved/closed) |
| 5 | 5 | Price Quotation (RFQ) + multi-supplier comparison view |
| 6 | 6 | Project Cost Recording (cost entries scoped to project + cost code) |
| 7 | 7 | Project Dashboard (budget vs actual vs committed) + 3-5 standard reports |
| 8 | 8 | Polish + import from Builk CSV + bug fix |
| 9-12 | 9-12 | **Phase 2 AI overlay**: PR auto-fill from spec, LINE supplier quote intake, AI cost variance alert |

---

### Variant B — Selective Parity (Top 5 modules) + AI Native Day 1

**ปรัชญา**: เลือกเฉพาะ Builk modules ที่ "ทุกคน" ใช้ — ตัด long tail — แทนที่ AI feature ตั้งแต่ day 1

**ทำเฉพาะ:**
- ✅ Cost Codes (essential spine)
- ✅ Project Cost Recording
- ✅ Project Dashboard
- ✅ Suppliers
- ✅ PR (simplified — ไม่ทำ full RFQ comparison)
- ❌ Skip: RFQ multi-supplier, Standard 9 reports (ทำ 2-3 พอ), Email distribution (ใช้ Web Share)

**AI Native day 1:**
- LINE intake สลิป → auto-create cost recording (draft)
- AI suggest cost code จาก photo/description
- AI draft PR จาก project plan
- Prompt library "negotiate กับ supplier"

**Pros:**
- เร็วกว่า Variant A ~2-3 สัปดาห์
- Differentiation ชัดตั้งแต่ day 1 — ไม่ดู me-too
- AI = sticky feature → harder to switch back
- Targets early adopters / tech-forward SME

**Cons:**
- Migration จาก Builk ยากขึ้น (ขาด RFQ, reports เต็ม)
- ต้อง storytelling เก่งกว่า ("ทำไมไม่มี RFQ เต็ม?")
- AI feature ต้อง integrate OpenAI/Claude API → ต้องตั้ง backend Edge Function
- ใช้เงิน AI quota — ต้อง pricing model รองรับ

**Timeline**:

| Sprint | สัปดาห์ | งาน |
|---|---|---|
| 1 | 1 | Cost Codes + Suppliers + Project Setup polish |
| 2 | 2 | Project Cost Recording + LINE intake scaffold |
| 3 | 3 | Project Dashboard (budget vs actual) + simplified PR |
| 4 | 4 | Agent edge function (Supabase Edge / Netlify Function) + AI integration |
| 5 | 5 | AI features: cost code suggest + PR auto-draft + receipt OCR |
| 6 | 6 | Prompt library + supplier directory + polish |
| 7 | 7 | Import from Builk CSV + onboarding |
| 8 | 8 | Bug + launch prep |

---

### Variant C — AI-First, Builk as UX Inspiration Only

**ปรัชญา**: ไม่ทำตาม Builk module-by-module — เอา UX patterns ดีๆ (sidebar nav, project-scoped dashboard, cost code spine) ไปใช้ใน app ที่เราออกแบบเอง — focus เป็น "AI-powered architect-led platform" 100%

**ใช้ Builk inspiration:**
- Sidebar layout 3-pane (groups → apps → content)
- Cost code spine concept (ทุก action ผูก code)
- Real-time dashboard pattern
- Free tier hook

**ไม่ implement:**
- PR workflow แบบเดิม (แทนที่ด้วย "AI draft any document from context")
- RFQ multi-supplier เปรียบเทียบ (แทนที่ด้วย "LINE supplier quote intake + auto rank")
- Standard reports 9 ตัว (แทนที่ด้วย "ask question, get chart" AI report)
- Cost code library แบบ static (แทนที่ด้วย "auto-categorize จาก description")

**Pros:**
- Differentiation ชัดสุด — defensible IP
- ไม่ดู "Builk clone"
- AI moat — competitor copy ยาก
- Targets premium pricing tier (AI value)

**Cons:**
- Migration story แทบไม่มี — ผู้ใช้ Builk ไม่เห็นเหตุผลต้องเปลี่ยน
- Risk สูง — UX ใหม่ทั้งหมด ต้อง onboarding heavy
- ขายยากกับตลาดไทย SME (conservative, ต้องเห็นของคุ้น)
- AI infra cost สูงตั้งแต่ day 1
- Timeline ยาวเพราะต้อง R&D AI features

**Timeline**: 12-16 สัปดาห์ + ต้องการ AI expertise / ML budget

---

## 4. Detailed Module Sketches (สำหรับ Variant A & B)

### 4.0 Project Entity + Project List (SPRINT 0 — entry point) ⭐ **NEW**

> **Why this is Sprint 0**: ผู้ใช้ Builk ลึก `/costcontrol/project/search` คือหน้าที่เห็นทุกวัน (เปิด login → เห็นทันที). Modules อื่นทั้งหมด (PR/RFQ/Cost recording) ต้องเลือก project ก่อนเสมอ → Project = spine ของระบบ ไม่ใช่ Cost Codes
>
> ปัจจุบัน `src/storage.ts` มี `ProjectRecord` แค่ 7 fields (id/name/clientId/clientName/templateName/paymentTerms/notes/updatedAt) — ขาด financial tracking + status + dates เกือบทั้งหมด

**Extended Project type** (ใหม่ — ปัจจุบันมีแค่ stub):

```ts
type ProjectStatus = "draft" | "normal" | "delayed" | "closed" | "cancelled";
type CustomerType = "individual" | "gov" | "corporate";

type Project = {
  id: string;
  workspaceId: string;
  code: string;                  // user-defined "j-2600" (auto-suggest next from pattern)
  name: string;
  clientId: string;              // FK Client, may be empty for internal projects
  clientName: string;            // denormalized
  customerType: CustomerType | null;  // affects tax/withholding template
  contractValue: number;         // มูลค่าสัญญา
  plannedCost: number;           // ต้นทุนที่วางแผน
  actualCost: number;            // computed rollup จาก cashflow entries / PO
  plannedRevenue: number;
  actualRevenue: number;
  marginPct: number | null;      // computed: (plannedRevenue - actualCost) / plannedRevenue
  startDate: string;             // ISO date
  endDate: string;               // ISO date
  daysRemaining: number;         // computed at read time, negative allowed
  status: ProjectStatus;
  hasBudget: boolean;            // helper for "ไม่มีงบประมาณ" badge
  notes: string;
  createdAt: string;
  updatedAt: string;
};
```

**Project List page** (`/projects` หรือ extend `/cost-codes` workspace):
- **Company switcher** ที่ topbar (multi-workspace ที่มีอยู่แล้วใน `workspaces` table) — **UI ใหม่**
- **Recent active carousel** 4-5 cards (status=normal|delayed only)
  - Card KPIs: งบคงเหลือ · เวลาคงเหลือ (negative=red) · กำไร %
  - "ไม่มีลูกค้า" + "ไม่มีงบประมาณ" empty-state badges
- **5-state status filter chips**: ทั้งหมด / ปกติ / ชะลอ / สิ้นสุด / ยกเลิก
- **Search**: เลขที่/โครงการ/ลูกค้า (multi-attribute)
- **8-col sortable table**: code · name · customer · contract · plannedCost · actualCost · margin% · daysLeft · status
- **Pagination + count**: "แสดง 1-24 จาก 24" + "เครดิตคงเหลือ X" (monetization hook ของ Builk)
- **CTA**: `+ สร้างโครงการ`

**Inferred Builk monetization**: pay-per-project credits (จำนวนโครงการ active = quota). เราอาจไม่ copy แต่ดูเป็น option

**Project code convention**: user-defined template `{prefix}-{YY}{seq}` ต่อ workspace, auto-increment

**Rollup engine** (Sprint 5+): บันทึก cashflow entry ที่ผูก projectId → trigger update `actualCost`/`actualRevenue` ของ project

**View live mockup**: `http://127.0.0.1:5173/mockup` → tab "Project List"

### 4.1 Cost Codes (CBS) — `src/costCodes.ts` + `/cost-codes`

```ts
type CostCodeCategory = "site" | "structure" | "architecture" | "mep" | "finishing" | "external" | "indirect" | "custom";
type CostCodeUnit = "lump_sum" | "sq_m" | "cubic_m" | "linear_m" | "piece" | "kg" | "ton" | "day" | "month";

type CostCode = {
  id: string;
  workspaceId?: string;     // null = system seed; with id = user custom
  code: string;             // e.g. "01-100", "ST-040" (Thai industry common format)
  parentCode: string;       // empty = root, else points to parent for nesting
  name: string;             // "งานคอนกรีต โครงสร้าง"
  description: string;
  category: CostCodeCategory;
  defaultUnit: CostCodeUnit;
  defaultUnitPrice: number; // optional benchmark
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type CostCodeState = {
  codes: CostCode[];
  updatedAt: string;
};

// Seed: ~100 standardized Thai construction cost codes per VR กฎหมาย/บริษัทรับเหมา
```

**UI**:
- Tree view (parent → children) like Builk's CBS
- Search + filter by category
- "Bulk import from CSV" + "Bulk export"
- Inline edit unit price (benchmark)
- "Copy from system seed" button for new workspace

**Subnav**: catalog · custom · import · export · seed-library

### 4.2 Suppliers — `src/suppliers.ts` + `/suppliers`

```ts
type Supplier = {
  id: string;
  workspaceId: string;
  name: string;             // "บจก. ปูนซีเมนต์ไทย"
  shortName: string;        // "SCC"
  taxId: string;
  address: string;
  phone: string;
  email: string;
  lineId: string;
  paymentTerms: string;     // "30 วัน"
  rating: number;           // 1-5 user-rated
  notes: string;
  createdAt: string;
  updatedAt: string;
};

type SupplierPriceHistory = {
  id: string;
  supplierId: string;
  costCodeId: string;
  unitPrice: number;
  unit: string;
  quotedAt: string;
  sourceDocumentId: string; // link to RFQ or PR
  note: string;
};
```

**UI**: list + detail panel + price history chart

### 4.3 Purchase Request (PR) — `src/procurement.ts` + `/procurement`

```ts
type PRStatus = "draft" | "submitted" | "approved" | "rejected" | "ordered" | "received" | "cancelled";

type PurchaseRequest = {
  id: string;
  workspaceId: string;
  projectId: string;
  prNo: string;              // auto: PR-2026-001
  requestedBy: string;       // user id
  approvedBy: string;
  status: PRStatus;
  requestDate: string;
  neededByDate: string;
  notes: string;
  items: PRLineItem[];
  totalAmount: number;       // sum of items
  createdAt: string;
  updatedAt: string;
};

type PRLineItem = {
  id: string;
  costCodeId: string;
  description: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice: number;
  amount: number;
  supplierId: string;        // optional preferred supplier
  note: string;
};
```

**Workflow**: Draft → Submit → (Manager) Approve → Convert to PO (BuildDocs) → Receive → Close

**UI**: list filter by status + detail editor + approve/reject buttons + convert-to-PO button

### 4.4 RFQ — `src/procurement.ts` (same file as PR)

```ts
type RFQStatus = "draft" | "sent" | "responses_received" | "awarded" | "cancelled";

type RFQ = {
  id: string;
  workspaceId: string;
  projectId: string;
  prId: string;              // source PR (optional)
  rfqNo: string;
  status: RFQStatus;
  invitedSuppliers: string[];// supplier ids
  responses: RFQResponse[];  // each supplier's quote
  awardedSupplierId: string;
  awardedAt: string;
};

type RFQResponse = {
  supplierId: string;
  itemQuotes: RFQItemQuote[];
  totalAmount: number;
  paymentTerms: string;
  deliveryDate: string;
  validUntil: string;
  receivedAt: string;
  notes: string;
};

type RFQItemQuote = {
  prLineItemId: string;
  unitPrice: number;
  amount: number;
  alternativeSpec: string;   // supplier may propose alternative
};
```

**UI Comparison view**:
```
                  | SCC      | TPI     | Insee    |
ปูน 50kg / 1000 ถ | 4,800 ⭐ | 4,950   | 4,820    |  ← lowest highlighted
เหล็ก / 5 ตัน     | 88,000   | 87,500⭐ | 89,000   |
รวม              | 92,800   | 92,450⭐ | 93,820   |
Payment terms    | 30 d     | 30 d    | 45 d ⭐  |
Delivery         | 7 d ⭐   | 10 d    | 8 d      |
```

### 4.5 Project Cost Recording — extend `src/cashflow.ts`

Add fields to `CashflowEntry`:
```ts
projectId: string;        // EXISTING but mostly unused
costCodeId: string;       // NEW
quantityActual: number;   // NEW
unitActual: string;       // NEW
prId: string;             // NEW — source PR if any
rfqId: string;            // NEW — source RFQ if any
poDocumentId: string;     // NEW — source PO from BuildDocs
```

`summarizeCashflow` becomes per-project + per-cost-code.

### 4.6 Project Cost Dashboard — new tab in BOQ Data or new app `projectControl`

```
Project: บ้านพักคุณเอ - กรุงเทพ
─────────────────────────────────
Cost Code  | Budget    | Committed | Actual    | Remaining | %
───────────────────────────────────────────────────────────────
01 Site    | 200,000   | 180,000   | 120,000   | 80,000    | 60%
02 Struct  | 1,500,000 | 1,520,000⚠| 980,000   | 520,000   | 65%
03 Arch    | 800,000   | 600,000   | 200,000   | 600,000   | 25%
...
TOTAL      | 4,500,000 | 4,180,000 | 2,150,000 | 2,350,000 | 48%

⚠ 02 Structure committed > budget by 20,000 — เกินงบ
```

### 4.7 Standard Reports — `src/reports.ts`

**MVP 5 reports** (skip Builk's 9):
1. Project P&L (revenue vs expense per project)
2. Cash flow forecast (next 90 days from confirmed + recurring)
3. Cost code variance (budget vs actual %)
4. Supplier spend ranking (top 10 suppliers by total spend)
5. PR aging (oldest pending PRs)

---

## 5. New Apps to Add to Manifest (`src/apps.ts`)

```ts
// Add to WorkspaceAppId union:
| "costCodes"
| "suppliers"
| "procurement"        // PR + RFQ
| "projectControl"     // Project-scoped cost dashboard + reports

// New app definitions:
{
  id: "costCodes",
  label: "หมวดต้นทุน",
  shortLabel: "Codes",
  description: "ระบบ Cost Code (CBS) ตามมาตรฐานงานก่อสร้างไทย",
  status: "next",
  routeBase: "/cost-codes",
  category: "construction",
  professionTags: ["qs_estimator", "contractor"],
  monetization: "freemium",
  accessLevel: "write",
  privacyLevel: "workspace",
  aiUsage: "optional",
  // ...
},
{
  id: "suppliers",
  label: "Suppliers",
  shortLabel: "Suppliers",
  description: "ไดเรคทอรี supplier + price history + rating",
  // category: "construction", professionTags: ["contractor", "qs_estimator"], ...
},
{
  id: "procurement",
  label: "Procurement",
  shortLabel: "PR/RFQ",
  description: "Purchase Request + Quotation + supplier comparison",
  // ...
  aiUsage: "optional",  // AI draft PR from spec — Phase 2
},
{
  id: "projectControl",
  label: "Project Control",
  shortLabel: "PCtrl",
  description: "Budget vs Actual ต่อโครงการ + variance alert + reports",
  // category: "construction", aiUsage: "optional", ...
}
```

**Sidebar group ใหม่**: `procurement` group กลุ่ม `Cost Control` รวม costCodes + suppliers + procurement + projectControl

---

## 6. New SQL Migrations (Supabase)

```sql
-- 0003_cost_control.sql
create table cost_codes (
  id text primary key,
  workspace_id uuid references workspaces(id) on delete cascade,
  code text not null,
  parent_code text,
  name text not null,
  description text default '',
  category text not null,
  default_unit text not null,
  default_unit_price numeric(14, 2) default 0,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (workspace_id, code)
);

create table suppliers (
  id text primary key,
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,
  short_name text default '',
  tax_id text default '',
  address text default '',
  phone text default '',
  email text default '',
  line_id text default '',
  payment_terms text default '',
  rating integer default 0,
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table supplier_price_history (
  id text primary key,
  supplier_id text references suppliers(id) on delete cascade,
  cost_code_id text references cost_codes(id) on delete set null,
  unit_price numeric(14, 2) not null,
  unit text not null,
  quoted_at timestamptz not null,
  source_document_id text default '',
  note text default ''
);

create table purchase_requests (
  id text primary key,
  workspace_id uuid references workspaces(id) on delete cascade,
  project_id uuid,
  pr_no text not null,
  requested_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  status text not null check (status in ('draft','submitted','approved','rejected','ordered','received','cancelled')),
  request_date date not null,
  needed_by_date date,
  notes text default '',
  total_amount numeric(14, 2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table pr_line_items (
  id text primary key,
  pr_id text references purchase_requests(id) on delete cascade,
  cost_code_id text references cost_codes(id),
  description text not null,
  quantity numeric(14, 4) default 0,
  unit text,
  estimated_unit_price numeric(14, 2) default 0,
  amount numeric(14, 2) default 0,
  supplier_id text references suppliers(id),
  note text default ''
);

create table rfqs (
  id text primary key,
  workspace_id uuid references workspaces(id) on delete cascade,
  project_id uuid,
  pr_id text references purchase_requests(id),
  rfq_no text not null,
  status text not null,
  invited_supplier_ids text[],
  awarded_supplier_id text references suppliers(id),
  awarded_at timestamptz,
  created_at timestamptz default now()
);

create table rfq_responses (
  id text primary key,
  rfq_id text references rfqs(id) on delete cascade,
  supplier_id text references suppliers(id),
  total_amount numeric(14, 2),
  payment_terms text,
  delivery_date date,
  valid_until date,
  notes text default '',
  received_at timestamptz default now()
);

-- All tables: enable RLS scoped to is_workspace_member(workspace_id)
-- ทุกตารางต้อง enable RLS + policy เหมือนใน 0001_initial_platform.sql
```

---

## 7. Migration Story from Builk

### 7.1 Import path

1. ใน Builk → Export → CSV ของ:
   - Cost codes
   - Projects
   - Suppliers
   - Transactions (cost recording)
2. ใน Buildbybim → `/cost-codes?tab=import` (และ tab import ของแต่ละ module)
3. Upload CSV → field mapping wizard (Builk column → Buildbybim column)
4. Preview + confirm → import

### 7.2 Terminology mapping (ใน UI ของเรา)

| Builk term (ไทย) | Buildbybim term (เก็บไว้เหมือนเดิม) |
|---|---|
| ใบขอซื้อ (PR) | ใบขอซื้อ (PR) |
| ขอราคา / RFQ | ขอราคา / RFQ |
| Cost code / CBS | หมวดต้นทุน (Cost Code) |
| ใบแจ้งหนี้ | ใบแจ้งหนี้ (เดิมใน BuildDocs) |
| Supplier | Supplier / ผู้ขาย |
| โครงการ | โครงการ |
| งบประมาณ | งบประมาณ |

**Don't reinvent terminology** — ใช้คำเดิมที่ผู้ใช้ Builk รู้

### 7.3 Onboarding flow

```
1. Sign up → /account
2. Are you using Builk now? [Yes / No]
   ├─ Yes → "Import from Builk" guided wizard (5 steps)
   └─ No  → "Setup from scratch" → seed Thai cost codes + sample project
3. First project → guided tour
4. After 7 days: prompt to try AI feature ("เคยลองให้ AI draft PR มั้ย?")
```

### 7.4 Free tier ที่ "wider" กว่า Builk

ปัจจุบัน Builk ฟรี: limited cost codes + จำกัด project count (suspect)

ของเราฟรี:
- Cost codes ครบ (ไม่จำกัด)
- 3 projects
- PR/RFQ unlimited
- Supplier unlimited
- AI 10 runs/เดือน
- Export PDF/CSV ครบ

= ใช้ฟรีได้นานกว่า + AI sample → กระตุ้น upgrade

---

## 8. Differentiation Matrix vs Builk (final positioning)

| Feature | Builk | Buildbybim (after parity) |
|---|---|---|
| Cost Codes (CBS) | ✅ มาตรฐานเดียว | ✅ มาตรฐาน + custom + AI auto-categorize |
| Project Setup | ✅ Manual | ✅ + AI suggest cost codes จาก scope description |
| Purchase Request | ✅ Manual entry | ✅ + AI draft จาก spec photo / drawing |
| RFQ Comparison | ✅ Manual entry | ✅ + LINE supplier quote intake (snap-and-go) |
| Cost Recording | ✅ Manual | ✅ + LINE receipt OCR → draft entry |
| Project Dashboard | ✅ | ✅ + AI variance explanation |
| Reports | ✅ 9 types | ✅ 5 types + AI "ask any question, get answer" |
| Supplier directory | ✅ | ✅ + AI rating from past performance |
| Email distribution | ✅ | ✅ + LINE distribution |
| Design Brief / Plan Review | ❌ | ✅ Architect Brain layer |
| Moodboard / Design Options | ❌ | ✅ Design Studio integration |
| Prompt library | ❌ | ✅ 240+ prompts library |
| Auto workflow (Facebook content) | ❌ | ✅ |
| Multi-profession packs | ❌ | ✅ professionTags 15 tags |
| Multi-language | ✅ TH/EN/ID/MM/KH | ✅ TH/EN (matched scope) |
| Pricing | ฟรี + paid codes | ฟรี wider + 290฿/month Support |
| Mobile | ✅ responsive | ✅ responsive |
| API/integrations | ❌ | ✅ Supabase + future Agent API |

**Net advantage**: AI layer + design workflow + prompt assets + multi-profession bridge

---

## 9. Cost & Resource Estimate

| Variant | Dev weeks | New files | New SQL | AI infra cost | Risk |
|---|---|---|---|---|---|
| **A** (Full parity → AI) | 12 weeks | ~12 files | 5 tables × 2 migrations | low (AI ใน phase 2) | Low |
| **B** (Selective + AI native) | 8 weeks | ~9 files | 4 tables | Medium (Edge Function + OpenAI/Claude API) | Medium |
| **C** (AI-first inspired) | 16 weeks | ~7 files but more R&D | 3 tables | High (AI moat from day 1) | High |

Codex bandwidth: assume 1 paired session = 2 dev hours of equivalent output (rough)

---

## 10. Decision Matrix — เลือกตามอะไร

| ถ้าเลือก… | เพราะ… |
|---|---|
| **Variant A** | กลัวพลาด, ต้องการ migration story ที่ชัดที่สุด, มี budget time 12 สัปดาห์, focus contractor SME |
| **Variant B** | อยาก differentiation ตั้งแต่ day 1, ยอมรับว่าทิ้ง Builk full migrate, focus tech-forward SME + freelancer |
| **Variant C** | มี AI expertise + investor backing, ยอมรับ risk สูง, focus premium tier, ต้องการ defensible moat |

**ผมแนะนำ Variant A** ถ้าตอบ user message ของคุณตรงๆ ("ดึงกลุ่มลูกค้าของ Builk มาอยู่กับเรา") เพราะ:
- Migration ง่ายสุด → Builk user เลือกเปลี่ยน
- Phase 2 AI = upgrade trigger ที่ถูกจังหวะ (user ติดงานคุณแล้ว AI = bonus)
- Risk ต่ำสุด — Builk validate workflow แล้ว
- Codex รับ implement ตรง — มี reference

แต่ถ้าอยากเร็วและ AI = key selling point ตั้งแต่แรก → **Variant B**

---

## 11. Open Questions for Owner (ตอบก่อนเริ่ม)

1. กลุ่มเป้าหมายแรก: **ผู้ใช้ Builk ปัจจุบัน** (migration play) หรือ **คนที่ยังไม่ใช้ระบบใดๆ** (greenfield play)?
2. มีเพื่อน/network ที่ใช้ Builk อยู่กี่คน? (potential alpha tester migration)
3. ต้องการรับเงินผ่าน Omise/Stripe ภายในกี่เดือน? (กระทบ Phase G priority)
4. AI infra budget: พร้อมจ่าย $20-50/เดือน OpenAI/Anthropic API ตอน Phase 2 มั้ย?
5. Reports จำเป็น day 1 หรือ wait ได้? (ลดงานได้ 1 สัปดาห์ถ้า defer)
6. Email distribution จำเป็นมั้ย? (resend.com integration ~3 วัน) หรือ Web Share + LINE พอ?
7. Multi-business entity (multiple บริษัท per user) จำเป็นใน MVP มั้ย? (workspaces table รองรับแล้วแต่ UI ยังไม่ทำ switcher)

---

## 12. Concrete First Step (ถ้าเลือก Variant A หรือ B)

### Sprint 0 (สัปดาห์แรก) — Project Entity + List page ✅ **DONE 2026-05-24**

> เปลี่ยน Sprint 1 เดิม (Cost Codes) ↓ เป็น Sprint 2 เพราะหลัง analyze Builk's `/costcontrol/project/search` พบว่า Project list คือ entry point ไม่ใช่ Cost Codes
>
> **Status (2026-05-24):** Implemented. ดู `docs/TASKS.md` Done Log + `src/projects.ts` + `src/workspace/apps/projects/ProjectsPanel.tsx` + `supabase/migrations/0003_projects.sql`. 138 tests pass. `/projects` route live. Next: Sprint 1 (Cost Codes).

**Goal**: สร้าง Project entity + List page ตาม Builk's entry-point pattern → user เห็นทันทีเมื่อ login ว่ามีโครงการอะไรบ้าง สถานะอะไร

**Deliverables**:
1. `docs/PROJECT_PRD.md` (sub-PRD) — entity, 5-state status, code convention, rollup design
2. Extend `src/storage.ts` `ProjectRecord` → เพิ่ม `code`, `customerType`, `contractValue`, `plannedCost`, `actualCost`, `plannedRevenue`, `actualRevenue`, `marginPct`, `startDate`, `endDate`, `status`, `hasBudget` (รักษา backward compat ของ workspace data)
3. หรือ สร้างใหม่ `src/projects.ts` (cleaner, ใช้ storageAdapter + types + summary helpers + project code generator)
4. `src/projects.test.ts` (unit tests สำหรับ status machine, code auto-suggest, computed fields)
5. New app `projects` ใน `src/apps.ts` (route `/projects`, group `Project Work`, ก่อน `boqData`)
6. `App.tsx` `ProjectsPanel` (Project List = card carousel + filter chips + 8-col sortable table + create button)
7. Workspace switcher ใน topbar (เชื่อม `workspaces` + `workspace_members` ที่มีอยู่แล้ว → dropdown)
8. `supabase/migrations/0003_projects.sql` — extended `projects` table with all financial fields + status check constraints + RLS
9. Update `BUILK_PARITY_PLAN.md` Sprint 0 → done

**Acceptance**:
- เปิด `/projects` เห็น carousel + table ของ 6+ seed projects
- 5-state filter chips ใช้งานได้ + counter ถูก
- Negative `daysRemaining` แสดงเป็นสีแดง + "เลย deadline X วัน"
- "ไม่มีลูกค้า" / "ไม่มีงบประมาณ" empty states ทำงาน
- Company switcher dropdown ที่ topbar (เริ่มมี 1 company seed)
- กดเพิ่ม project ใหม่ → auto-suggest code "j-2601" (ต่อจาก seed)
- `npm test` ผ่านเพิ่ม
- `npm run build` ผ่าน

### Sprint 1 — Cost Codes (CBS) ✅ **DONE 2026-05-24**

> **Status (2026-05-24):** Implemented. ดู `docs/TASKS.md` Done Log + `src/costCodes.ts` + `src/costCodes.seed.ts` (100 Thai codes) + `src/workspace/apps/cost-codes/CostCodesPanel.tsx` + `supabase/migrations/0004_cost_codes.sql`. 193 tests pass (55 new for cost codes). `/cost-codes` route live with Catalog/Import/Export tabs. Next: Sprint 2 (Suppliers).

**Goal**: ปลด "cost code spine" ที่ใช้ใน PR/RFQ/Cost Recording — มี library + catalog UI

**Deliverables**:
1. `docs/COST_CODES_PRD.md` (sub-PRD)
2. `src/costCodes.ts` (types + storage + CRUD via adapter)
3. `src/costCodes.test.ts` (unit tests)
4. Seed data: 100 Thai construction cost codes
5. New app `costCodes` in `src/apps.ts` + sidebar group `procurement`
6. `App.tsx` CostCodesPanel (catalog view + search + add custom + bulk import CSV)
7. `supabase/migrations/0004_cost_codes.sql` (cost_codes table + RLS)
8. Update `BUILK_PARITY_PLAN.md` Sprint 1 → done

**Acceptance**:
- เปิด `/cost-codes` เห็น 100 seed codes แสดงเป็น tree
- กด "เพิ่ม code" สร้าง custom code ได้
- Import CSV ของ Builk format ได้ (Field mapping: code, name, parent_code, unit, price)
- `npm test` ผ่านเพิ่ม
- `npm run build` ผ่าน

### Sprint 2 — Suppliers + Customer ✅ **DONE 2026-05-24**

> **Status (2026-05-24):** Suppliers implemented. ดู `docs/TASKS.md` Done Log + `src/suppliers.ts` + `src/workspace/apps/suppliers/SuppliersPanel.tsx` + `supabase/migrations/0005_suppliers.sql`. 247 tests pass (54 new for suppliers). `/suppliers` route live with Directory split-view, price history, CSV import. Customer-type extension already done in Sprint 0 (Project entity). Next: Sprint 3 (PR).

- Suppliers ตาม Section 4.2
- Customer entity extended: `customerType: individual | gov | corporate` (กระทบ tax/withholding)

### Sprint 3 — PR (Purchase Request) ✅ **DONE 2026-05-24**

> **Status (2026-05-24):** Implemented. ดู `docs/TASKS.md` Done Log + `src/procurement.ts` + `src/workspace/apps/procurement/ProcurementPanel.tsx` + `supabase/migrations/0006_purchase_requests.sql`. 307 tests pass (52 new for PR). `/procurement?tab=pr-list` live with full 10-state machine + line-items editor wired to Cost Codes + Suppliers. RFQ subnav rendered as placeholder. Next: Sprint 4 (RFQ compare + award flow).

- ตาม Section 4.3
- ผูกกับ Project + Cost Code

### Sprint 4 — RFQ (price comparison) ✅ **DONE 2026-05-24**

> **Status (2026-05-24):** Implemented. ดู `docs/TASKS.md` Done Log + `src/procurement.ts` (RFQ section) + RFQ tabs ใน `src/workspace/apps/procurement/ProcurementPanel.tsx` + `supabase/migrations/0007_rfqs.sql`. 351 tests pass (44 new for RFQ). Full flow live: PR "Send RFQ" → invite multi-select → record per-supplier responses inline → comparison matrix with best-price highlighting → award with reason → PR auto-transition + SupplierPriceHistory auto-append. Next: Sprint 5 (Cashflow project extension + rollup).

- ตาม Section 4.4

### Sprint 5 — Project Cost Recording (extend cashflow) + Rollup engine ✅ **DONE 2026-05-24**

> **Status (2026-05-24):** Implemented. ดู `docs/TASKS.md` P1-006 + Done Log + `src/cashflow.ts` (8 new fields + sourceType) + `src/cashflow.rollup.ts` (pure rollup + supplier price sync) + `src/cashflow.recurring.ts` (manual recurring templates) + `supabase/migrations/0008_cashflow_extension.sql`. 381 tests pass (30 new). Cashflow entries now roll up to Project actuals automatically on save; supplier price history auto-syncs; Project Detail "บันทึกต้นทุน" tab live. Recurring templates engine ready (UI wiring for Generate-this-month + RecurringPanel = light follow-up). Next: Sprint 6 (Project Control Dashboard + 5 standard reports).

- ตาม Section 4.5
- Rollup worker: cashflow entry confirmed → update `project.actualCost`, `project.actualRevenue`

### Sprint 6 — Project Dashboard + Reports ✅ **DONE 2026-05-24**

> **Status (2026-05-24):** Implemented (Pojjaman-grade north star move per `docs/POJJAMAN_GAP_ROADMAP.md`). ดู `docs/TASKS.md` P1-007 + Done Log + `src/projectControl.ts` (snapshot + 7 alert types + 5 report generators + summary) + `src/csvExport.ts` (Thai-safe UTF-8 BOM) + `src/workspace/apps/project-control/ProjectControlPanel.tsx` + `supabase/migrations/0009_project_control_settings.sql`. 429 tests pass (44 new). Dashboard + 5 reports + settings live at `/project-control`. Print CSS rules ready. **This completes the first credible ERP loop** (project → PR → RFQ → cashflow → dashboard). Next per ERP roadmap: Sprint 7 (Approval + Audit Core).

- ตาม Section 4.6 + 4.7

### Sprint 7 — Import from Builk + Polish + AI prep
- CSV import wizard
- Quota/credit system (optional — Builk monetization angle)
- Sub-project / change-order linking

### Sprint 8-12 — AI overlay (Phase 2)
- BOQ → Project auto-create
- Margin early-warning ML
- NL search "โครงการของคุณ X ที่ยังไม่ปิด"
- LINE/voice expense input

---

## 13. What to Read Next

- `docs/PRD.md` Section 0 — current implementation snapshot
- `docs/IMPLEMENTED_ERD.md` — สิ่งที่ build แล้ว (เห็นว่ายังขาด suppliers, PR/RFQ, cost_codes, project_dashboard)
- `docs/PLATFORM_ERD.md` — conceptual model (มี BOQ_ALLOCATION, EXPENSE, PROJECT — ใช้ extend ได้)
- `docs/CASHFLOW_PRD.md` — ตัวอย่าง sub-PRD pattern สำหรับเขียน COST_CODES_PRD, PROCUREMENT_PRD ฯลฯ
- `docs/MEMBERSHIP_ACCESS_PRD.md` — เพื่อรู้ว่า cost control modules ต้องผ่าน `evaluateAppAccess` ก่อน render

---

**Owner decision needed**: ตอบ Section 0 (5 เรื่อง) + Section 11 (7 questions) → ผมเริ่ม Sprint 1 ทันที
