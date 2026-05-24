# Procurement (PR + RFQ) — Sub-PRD

Updated: 2026-05-24
Status: Sprint 3 + Sprint 4 spec — combined because PR and RFQ share data + UI infrastructure
Depends on: Sprint 0 `projects` · Sprint 1 `costCodes` · Sprint 2 `suppliers`
Source: `docs/BUILK_PARITY_PLAN.md` Section 4.3-4.4
Implements: `docs/PRD.md` Section 9 + Section 6 Architecture

## 1. Purpose

Procurement workflow = **heart ของ Builk's daily UX** (มากที่สุดที่ user ใช้รายวัน). Workflow:

```
Project → Need to buy → Create PR (internal request)
                     → Approve PR (manager)
                     → Send RFQ to 2-3 suppliers (price comparison)
                     → Award supplier → Convert to PO (BuildDocs)
                     → Receive goods → Close PR
```

แต่ละ step มี state, log, audit. Builk's value = ทำให้ workflow นี้ไหลลื่นทั้งทีม + บันทึก committed cost ก่อนใช้จริง (ป้องกัน budget surprise)

เป้าหมาย Buildbybim:
- Match Builk's PR/RFQ workflow 100% (มี migration story)
- Layer AI: AI draft PR จาก spec/drawing, LINE quote intake แทนคีย์
- ผูกอัตโนมัติกับ Project + Cost Code + Supplier (ใช้ของ Sprint 0-2)

## 2. Non-Goals (v0.1)

- ไม่ทำ multi-level PR approval (1-level approval only: requester → approver)
- ไม่ทำ budget pre-check ก่อน approve (ทำใน Sprint 6 dashboard)
- ไม่ทำ partial receive (received = all-or-nothing) — รอ v0.2
- ไม่ทำ goods return / credit note — รอ v0.2
- ไม่ทำ supplier portal สำหรับตอบ RFQ — รอ v0.5
- ไม่ทำ auto-RFQ จาก PR (user click manually) — รอ v0.2
- ไม่ทำ PR template — copy-from-existing only

## 3. Storage Contract

| Storage Key | Module | Type |
|---|---|---|
| `procurement.pr.v1` | `src/procurement.ts` | `PRState` |
| `procurement.rfq.v1` | `src/procurement.ts` | `RFQState` (อาจ merge กับ PR เป็น state เดียว) |

ใช้ `defaultStorageAdapter` ตาม PRD Section 6.

## 4. Data Model

```ts
// ---------------- PR ----------------

export type PRStatus =
  | "draft"
  | "submitted"        // user submitted, รอ approver
  | "approved"
  | "rejected"
  | "rfq_sent"         // PR ผ่าน + ส่ง RFQ ออกแล้ว
  | "awarded"          // supplier ถูกเลือกใน RFQ
  | "ordered"          // PO ออกแล้วใน BuildDocs
  | "received"
  | "closed"
  | "cancelled";

export type PRLineItem = {
  id: string;
  costCodeId: string;          // FK CostCode (required)
  description: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice: number;  // budget estimate
  amount: number;              // computed = qty * estUnitPrice
  preferredSupplierId: string; // optional
  note: string;
};

export type PurchaseRequest = {
  id: string;
  workspaceId: string;
  projectId: string;           // required FK Project
  prNo: string;                // auto: PR-2026-001
  requestedBy: string;         // user id
  approvedBy: string;          // user id, empty if not yet
  rejectedReason: string;
  status: PRStatus;
  requestDate: string;         // ISO date
  neededByDate: string;
  notes: string;
  items: PRLineItem[];
  totalAmount: number;         // computed = sum(items.amount)
  linkedRfqId: string;         // if RFQ created
  linkedPoDocumentId: string;  // BuildDocs PO id
  createdAt: string;
  updatedAt: string;
};

export type PRState = {
  prs: PurchaseRequest[];
  updatedAt: string;
};

// ---------------- RFQ ----------------

export type RFQStatus =
  | "draft"
  | "sent"             // sent to suppliers, waiting responses
  | "partial_response" // some suppliers responded
  | "responses_complete"
  | "awarded"
  | "cancelled";

export type RFQItemQuote = {
  prLineItemId: string;        // FK PRLineItem
  costCodeId: string;          // denormalized for filter
  description: string;
  unitPrice: number;
  amount: number;              // = unitPrice * qty (qty from PR)
  alternativeSpec: string;     // supplier may propose substitution
  available: boolean;          // supplier ไม่มีรายการนี้ก็ได้
  note: string;
};

export type RFQResponse = {
  id: string;
  supplierId: string;          // FK Supplier
  itemQuotes: RFQItemQuote[];
  totalAmount: number;
  paymentTerms: string;        // "30 days"
  deliveryDate: string;
  validUntil: string;
  notes: string;
  receivedAt: string;
  receivedVia: "email" | "line" | "manual" | "phone";
};

export type RFQ = {
  id: string;
  workspaceId: string;
  projectId: string;
  prId: string;                // source PR (required)
  rfqNo: string;               // auto: RFQ-2026-001
  status: RFQStatus;
  invitedSupplierIds: string[];
  responses: RFQResponse[];
  awardedSupplierId: string;
  awardedAt: string;
  awardReason: string;         // why this supplier (price/delivery/payment)
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type RFQState = {
  rfqs: RFQ[];
  updatedAt: string;
};
```

### 4.1 Auto-numbering

```ts
function nextPrNumber(prs: PurchaseRequest[]): string {
  const year = new Date().getFullYear();
  const prefix = `PR-${year}-`;
  const seqs = prs
    .map((p) => p.prNo)
    .filter((no) => no.startsWith(prefix))
    .map((no) => parseInt(no.slice(prefix.length), 10))
    .filter((n) => Number.isFinite(n));
  const next = (seqs.length > 0 ? Math.max(...seqs) : 0) + 1;
  return `${prefix}${next.toString().padStart(3, "0")}`;
}
// Same pattern for RFQ: "RFQ-2026-001"
```

### 4.2 PR Status state machine

```
draft ──submit──→ submitted ──approve──→ approved ──create RFQ──→ rfq_sent
   ↑                  │ reject                              ↓ award supplier
   └─edit             ↓                                    awarded
                  rejected                                  ↓ create PO (BuildDocs)
                                                          ordered
                                                            ↓ receive goods
                                                          received
                                                            ↓ close (auto or manual)
                                                          closed

                  (any state) ──cancel──→ cancelled
```

### 4.3 RFQ Status state machine

```
draft ──send──→ sent ──first response──→ partial_response
                              ↓ all responses
                       responses_complete
                              ↓ award
                          awarded
                              ↓ revert PR status
                       (PR goes to "awarded")

                (any state) ──cancel──→ cancelled
```

### 4.4 Validation

- PR `projectId` required + must reference existing project
- PR `items[]` ≥ 1
- Each item: `costCodeId` required, `quantity > 0`, `unit` required
- `totalAmount` auto-computed (read-only)
- PR submit → require approver assignment (workspace_member with role = `owner` or `admin`)
- RFQ `prId` required + PR must be in `approved` state
- RFQ `invitedSupplierIds[]` ≥ 1 (recommend ≥ 2 for fair comparison)
- RFQ award → require `awardedSupplierId` ∈ `invitedSupplierIds` + response received
- RFQ award → check `evidence.approval-policy.v1`; default blocks high-value awards without direct verified evidence linked to the RFQ

## 5. Cross-App Linkage

| Source | Field | Purpose |
|---|---|---|
| Project (Sprint 0) | `pr.projectId` → `Project.id` | scope PR to project |
| Cost Code (Sprint 1) | `prLineItem.costCodeId` → `CostCode.id` | budget categorization |
| Supplier (Sprint 2) | `rfq.invitedSupplierIds`, `rfqResponse.supplierId` | invite + track |
| Supplier (Sprint 2) | `prLineItem.preferredSupplierId` | hint for RFQ invite |
| Price History (Sprint 2) | on RFQ response received → append `SupplierPriceHistoryEntry` | track price |
| BuildDocs (existing) | `pr.linkedPoDocumentId`, on award → create PO doc | issue PO |
| Cashflow (Sprint 5) | on PO received → create draft cashflow entry | actual cost rollup |
| Hub Dashboard (existing) | "PR awaiting approval N", "RFQ pending response M" tiles | overview |
| Audit log (Membership) | every status change → append entry | compliance |

## 6. UI Flow

### 6.1 Subnav (new app `procurement`)

| Tab | Sprint | Content |
|---|---|---|
| `pr-list` (default) | 3 | PR list with status filter + filter by project + create button |
| `rfq-list` | 4 | RFQ list + comparison matrix shortcut |
| `pr-detail` | 3 | PR form (create/edit) + state actions |
| `rfq-detail` | 4 | RFQ form + supplier invite + response entry + comparison + award |
| `archive` | 4 | closed/cancelled PRs and RFQs |

### 6.2 PR list page (`/procurement?tab=pr-list`)

ตาม mockup `/mockup?tab=procurement`:

```
[Filter chips: ทั้งหมด/draft/submitted/approved/ordered/received/closed]
                          [Project filter ▼] [+ สร้าง PR]

PR No        Project           Status        Items   Amount    Needed by
─────────────────────────────────────────────────────────────────────
PR-2026-009  บ้านคุณเอ        Draft         4       ฿85K      2026-06-01
PR-2026-008  คอนโดสาทร       Submitted ⚠   8       ฿320K     2026-06-05
PR-2026-007  บ้านคุณเอ        Approved      5       ฿120K     2026-05-30
PR-2026-006  บ้านคุณบี        Ordered       12      ฿1.5M     2026-06-15
PR-2026-005  บ้านคุณบี        Received      3       ฿280K     2026-05-20
```

### 6.3 PR Detail form (`/procurement?tab=pr-detail&id=...`)

- Header: PR No (auto) + Status badge + Action buttons (Submit / Approve / Reject / Cancel / Create RFQ)
- Project (dropdown, required)
- Request date + Needed by date
- Notes
- **Line items table** (inline edit):
  - Cost Code (autocomplete from Sprint 1 catalog)
  - Description (default from cost code name)
  - Quantity + Unit (default from cost code)
  - Estimated unit price (default from cost code, supplier history overrides)
  - Amount (computed read-only)
  - Preferred supplier (optional autocomplete from Sprint 2)
  - Note
  - [+ เพิ่มรายการ]
- **AI assist** (Phase 2): "ใส่ spec/drawing → AI fill items"

### 6.4 RFQ Detail page (`/procurement?tab=rfq-detail&id=...`)

3 sub-sections:

**(a) Invite suppliers**
- List of suppliers from Sprint 2 directory (multi-select)
- Default invitation: 3 suppliers based on (1) preferred from PR (2) past history for cost codes (3) rating
- Send method: Email + LINE (Phase 2 will auto-deliver; v0.1 = manual notification with copyable summary)

**(b) Record responses**
- For each invited supplier: form to enter quote (unit price per item) + payment terms + delivery + validUntil
- "Mark as no-bid" if supplier declined
- AI assist (Phase 2): paste quotation image → OCR fill

**(c) Compare + Award**
- Matrix table ตาม mockup `/mockup?tab=rfq` (item × supplier, best-price highlight)
- "Award to [supplier]" button → opens reason dropdown
  - Lowest price / Best payment terms / Fastest delivery / Preferred vendor / Other
- On award:
  - RFQ status = `awarded`
  - PR status = `awarded`
  - Create PO in BuildDocs (auto-fill)
  - Append SupplierPriceHistoryEntry for awarded items
  - Audit log entry

## 7. Acceptance Criteria

### Sprint 3 (PR)

- เปิด `/procurement?tab=pr-list` เห็น list + filter
- สร้าง PR ใหม่ → auto-suggest PR-2026-NNN
- เลือก project → dropdown filter จาก Project (Sprint 0)
- เพิ่ม line item → cost code autocomplete (Sprint 1) + default unit/price
- Submit PR → status change + audit log entry
- Approve PR (ถ้า role permits) → status change + Hub Dashboard tile update
- Reject PR → require reason
- Cancel PR (จาก draft/submitted) → status = cancelled
- Test cases ผ่าน (Section 8)

### Sprint 4 (RFQ)

- จาก approved PR → กด "Create RFQ" → form prefill items
- Invite 2-3 suppliers → save → status `sent`
- Manually enter response per supplier → comparison matrix update real-time
- Best-price cell highlighted
- Award supplier → reason required → status `awarded` + PR status `awarded`
- On award → BuildDocs PO drafted (with copy-paste fallback if BuildDocs integration not ready)
- Price history appended for awarded items (visible in supplier detail)
- All acceptance criteria for PR remain valid

### Common

- `npm test` ผ่าน
- `npm run build` ผ่าน
- TH/EN dictionary ครบ

## 8. Tests to Write

```ts
// src/procurement.test.ts

describe("PR auto-numbering", () => {
  it("starts at PR-{YYYY}-001 when no PRs exist", () => { ... });
  it("increments sequence for current year", () => { ... });
  it("resets sequence on year change", () => { ... });
});

describe("PR validation", () => {
  it("requires projectId", () => { ... });
  it("requires at least 1 line item", () => { ... });
  it("computes totalAmount from items", () => { ... });
  it("rejects costCodeId not in catalog", () => { ... });
});

describe("PR status transitions", () => {
  it("draft → submitted on submit", () => { ... });
  it("submitted → approved with approver assignment", () => { ... });
  it("submitted → rejected with reason required", () => { ... });
  it("blocks invalid transitions (e.g. closed → draft)", () => { ... });
  it("appends audit log entry on every transition", () => { ... });
});

describe("RFQ creation from PR", () => {
  it("requires PR in approved state", () => { ... });
  it("prefills items from PR", () => { ... });
  it("auto-numbers RFQ-{YYYY}-NNN", () => { ... });
});

describe("RFQ award", () => {
  it("requires awardedSupplierId in invitedSupplierIds", () => { ... });
  it("requires response from awarded supplier", () => { ... });
  it("on award: updates PR.status to awarded + adds price history", () => { ... });
});

describe("Best price computation (matrix)", () => {
  it("highlights cheapest per item", () => { ... });
  it("highlights cheapest total", () => { ... });
  it("excludes no-bid suppliers", () => { ... });
});

describe("storage adapter usage", () => {
  it("loadPRs returns empty when storage empty", () => { ... });
  it("uses defaultStorageAdapter (not localStorage)", () => { ... });
});
```

## 9. Out-of-scope but Planned

- v0.2 Multi-level approval (level 1 + level 2)
- v0.2 Budget pre-check (block submit if cost code budget remaining < amount)
- v0.2 Partial receive + back-order tracking
- v0.2 Goods return / credit note
- v0.2 PR template library
- v0.2 Auto-RFQ from PR (one-click)
- v0.5 Supplier portal (supplier login to respond)
- Phase 2 AI auto-fill PR from drawing/spec photo
- Phase 2 LINE quote intake — OCR supplier quotation → fill RFQ response
- Phase 2 AI award recommendation (multi-factor: price + delivery + history + risk)

## 10. Mapping to Master PRD/ERD

| Master PRD | This PRD section |
|---|---|
| `docs/PRD.md` Section 9 Business Apps | Section 1-7 |
| `docs/PRD.md` Section 6 Architecture | Section 3 |
| `docs/BUILK_PARITY_PLAN.md` Section 4.3-4.4 + Sprint 3-4 | This entire PRD |
| `docs/PROJECT_PRD.md` Section 5 (linkage row "PR") | Section 5 |
| `docs/COST_CODES_PRD.md` Section 5 (linkage row "PR line items") | Section 5 |
| `docs/SUPPLIERS_PRD.md` Section 5 (linkage row "RFQ") | Section 5 |
| `docs/MEMBERSHIP_ACCESS_PRD.md` Section 5 | PR approve requires role check |

## 11. Implementation Notes for Codex

1. **Create `src/procurement.ts`** — single module for both PR + RFQ (shared types/helpers)
2. **Split tests**: `src/procurement.pr.test.ts` + `src/procurement.rfq.test.ts` for clarity
3. **Add to `src/apps.ts`**: app `procurement` (route `/procurement`, group `procurement`, professionTags `qs_estimator`/`contractor`/`admin_accounting`, monetization `freemium`, access `write`, privacy `workspace`, AI `optional`)
4. **UI**: extract from `MockupGallery.tsx` `PRMockup` + `RFQMockup` → `src/workspace/apps/procurement/ProcurementPanel.tsx`
5. **Sub-route handling**: use `?tab=pr-list|rfq-list|pr-detail|rfq-detail&id=...` pattern (consistent with rest of workspace)
6. **State machine**: implement as pure function `transitionPRStatus(current, action, context)` → returns next status or error (testable)
7. **Audit log**: every state change → call `appendAuditEntry({...})` from `src/membership.ts`
8. **BuildDocs PO bridge**: Sprint 3 don't fully integrate — provide "Copy to clipboard PO summary" button as v0.1 fallback; Sprint 4 add real PO creation via BuildDocs API (or shared state)
9. **SQL migrations**: `supabase/migrations/0006_purchase_requests.sql` (PR + items) + `0007_rfqs.sql` (RFQ + responses + item quotes)
10. **Update Hub Dashboard**: add pending action rows "PR awaiting approval: N", "RFQ pending response: M"
11. **Update Project Detail page** (Sprint 0): PR tab + RFQ tab now show real data (was stub)
12. **Update `BUILK_PARITY_PLAN.md`**: Sprint 3-4 → done

## 12. Sample SQL migration

```sql
-- 0006_purchase_requests.sql

create table if not exists purchase_requests (
  id text primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid not null,
  pr_no text not null,
  requested_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  rejected_reason text default '',
  status text not null check (status in (
    'draft', 'submitted', 'approved', 'rejected',
    'rfq_sent', 'awarded', 'ordered', 'received', 'closed', 'cancelled'
  )),
  request_date date not null,
  needed_by_date date,
  notes text default '',
  total_amount numeric(14, 2) default 0,
  linked_rfq_id text,
  linked_po_document_id text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (workspace_id, pr_no)
);

create table if not exists pr_line_items (
  id text primary key,
  pr_id text not null references purchase_requests(id) on delete cascade,
  cost_code_id text not null,
  description text default '',
  quantity numeric(14, 4) default 0,
  unit text not null,
  estimated_unit_price numeric(14, 2) default 0,
  amount numeric(14, 2) default 0,
  preferred_supplier_id text,
  note text default ''
);

create index pr_workspace_idx on purchase_requests(workspace_id);
create index pr_project_idx on purchase_requests(workspace_id, project_id);
create index pr_status_idx on purchase_requests(workspace_id, status);
create index pr_line_items_pr_idx on pr_line_items(pr_id);
create index pr_line_items_cost_code_idx on pr_line_items(cost_code_id);

alter table purchase_requests enable row level security;
alter table pr_line_items enable row level security;

create policy pr_select on purchase_requests
  for select using (is_workspace_member(workspace_id));
create policy pr_write on purchase_requests
  for all using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));

create policy pr_line_items_select on pr_line_items
  for select using (
    exists (select 1 from purchase_requests p
            where p.id = pr_id and is_workspace_member(p.workspace_id))
  );
create policy pr_line_items_write on pr_line_items
  for all using (
    exists (select 1 from purchase_requests p
            where p.id = pr_id and is_workspace_member(p.workspace_id))
  ) with check (
    exists (select 1 from purchase_requests p
            where p.id = pr_id and is_workspace_member(p.workspace_id))
  );

drop trigger if exists pr_updated_at on purchase_requests;
create trigger pr_updated_at
  before update on purchase_requests
  for each row execute function set_updated_at();
```

```sql
-- 0007_rfqs.sql

create table if not exists rfqs (
  id text primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid not null,
  pr_id text references purchase_requests(id) on delete cascade,
  rfq_no text not null,
  status text not null check (status in (
    'draft', 'sent', 'partial_response', 'responses_complete', 'awarded', 'cancelled'
  )),
  invited_supplier_ids text[] default '{}',
  awarded_supplier_id text,
  awarded_at timestamptz,
  award_reason text default '',
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (workspace_id, rfq_no)
);

create table if not exists rfq_responses (
  id text primary key,
  rfq_id text not null references rfqs(id) on delete cascade,
  supplier_id text not null,
  total_amount numeric(14, 2) default 0,
  payment_terms text default '',
  delivery_date date,
  valid_until date,
  notes text default '',
  received_at timestamptz default now(),
  received_via text default 'manual' check (received_via in (
    'email', 'line', 'manual', 'phone'
  ))
);

create table if not exists rfq_item_quotes (
  id text primary key,
  response_id text not null references rfq_responses(id) on delete cascade,
  pr_line_item_id text not null,
  cost_code_id text,
  description text default '',
  unit_price numeric(14, 2) default 0,
  amount numeric(14, 2) default 0,
  alternative_spec text default '',
  available boolean default true,
  note text default ''
);

create index rfq_workspace_idx on rfqs(workspace_id);
create index rfq_pr_idx on rfqs(pr_id);
create index rfq_status_idx on rfqs(workspace_id, status);
create index rfq_responses_rfq_idx on rfq_responses(rfq_id);
create index rfq_item_quotes_response_idx on rfq_item_quotes(response_id);

alter table rfqs enable row level security;
alter table rfq_responses enable row level security;
alter table rfq_item_quotes enable row level security;

create policy rfqs_select on rfqs
  for select using (is_workspace_member(workspace_id));
create policy rfqs_write on rfqs
  for all using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));

create policy rfq_responses_select on rfq_responses
  for select using (
    exists (select 1 from rfqs r
            where r.id = rfq_id and is_workspace_member(r.workspace_id))
  );
create policy rfq_responses_write on rfq_responses
  for all using (
    exists (select 1 from rfqs r
            where r.id = rfq_id and is_workspace_member(r.workspace_id))
  ) with check (
    exists (select 1 from rfqs r
            where r.id = rfq_id and is_workspace_member(r.workspace_id))
  );

create policy rfq_item_quotes_select on rfq_item_quotes
  for select using (
    exists (select 1 from rfq_responses res
            join rfqs r on r.id = res.rfq_id
            where res.id = response_id and is_workspace_member(r.workspace_id))
  );
create policy rfq_item_quotes_write on rfq_item_quotes
  for all using (
    exists (select 1 from rfq_responses res
            join rfqs r on r.id = res.rfq_id
            where res.id = response_id and is_workspace_member(r.workspace_id))
  ) with check (
    exists (select 1 from rfq_responses res
            join rfqs r on r.id = res.rfq_id
            where res.id = response_id and is_workspace_member(r.workspace_id))
  );

drop trigger if exists rfqs_updated_at on rfqs;
create trigger rfqs_updated_at
  before update on rfqs
  for each row execute function set_updated_at();
```

---

**Ready for Codex Sprint 3-4** (after Sprint 0+1+2 done): เริ่มจาก `src/procurement.ts` types + auto-numbering + status machine → tests → app manifest + UI panel → SQL migrations → BuildDocs PO bridge → Hub Dashboard tiles update
