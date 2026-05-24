# Migration from Builk to Buildbybim.space

Updated: 2026-05-24
Status: Customer-facing guide (Thai-primary) · used during alpha onboarding + sales pitch
Companion: `docs/BUILK_PARITY_PLAN.md` (internal strategy) · `docs/COMPETITIVE_LANDSCAPE.md` (when written)

> **Audience**: ผู้ที่ใช้ Builk Cost Control อยู่ตอนนี้ และพิจารณาย้ายมา Buildbybim.space — guide นี้ตอบคำถาม "ย้ายมายังไง?" + "อะไรเหมือน/ต่าง?" + "ข้อมูลเก่าจะอยู่ตรงไหน?"

---

## TL;DR — ทำไมต้องย้าย?

| คุณใช้ Builk อยู่เพราะ | Buildbybim ให้เพิ่ม |
|---|---|
| ฟรี + ใช้ง่าย | ✅ ฟรีทุก feature คุณใช้บ่อย + paid plan ราคาเข้าใจง่าย |
| Workflow PR/RFQ/PO/Invoice ครบ | ✅ Workflow เดียวกัน + ผูกกับ Project + Cost Code อัตโนมัติ |
| Multi-company switcher | ✅ + Multi-workspace + collaboration เพื่อทีม |
| Cloud + multi-device | ✅ Local-first ทำงานได้แม้ออฟไลน์ + sync เมื่อพร้อม |
| มาตรฐาน CBS Thailand | ✅ Cost Code ไทย 100+ codes seed + custom ได้ + import จาก Builk ตรงๆ |
| **ขาด: AI ช่วยทำงาน** | ✅ **AI draft PR, OCR สลิป LINE, suggest cost code, margin warning** |
| **ขาด: Design workflow** | ✅ **Plan Review, Brief Check, Moodboard, Presentation** (สายสถาปนิก) |
| **ขาด: Content workflow** | ✅ **Facebook content workflow, prompt library** |
| **ขาด: ปรับ plan/สิทธิ์เอง** | ✅ **Admin Console + custom plan + per-member override + audit log** |

**Migration ไม่ใช่ all-or-nothing** — ใช้ทั้ง 2 ได้พร้อมกัน แล้วค่อยตัดสินใจหลัง 30 วัน

---

## Section 1 — Quick start (15 นาที)

### 1.1 สมัคร Buildbybim (ฟรี ไม่ต้องใส่บัตร)

1. เข้า https://buildbybim.space
2. กด `เริ่มจาก Tools ฟรี` → เลือก `เปิด Workspace`
3. ที่ `/account` → ใส่อีเมล → กด `Send magic link` → คลิก link ในอีเมล
4. กลับมา → กด `Create my first workspace` → เสร็จ

### 1.2 Export ข้อมูลจาก Builk

ใน Builk:
- **Cost codes**: ไปที่ `รายการ Cost Code` → คลิก `Export` (CSV)
- **Suppliers**: ไปที่ `รายชื่อผู้รับเหมา` → `Export`
- **Projects**: ไปที่ `โครงการ` → `Export` (1 project = 1 row)
- **Transactions** (optional, large): export per project

### 1.3 Import เข้า Buildbybim

ใน Buildbybim Workspace:
1. **Cost codes**: `/cost-codes?tab=import` → upload CSV → field mapping wizard → confirm
2. **Suppliers**: `/suppliers?tab=import` → upload CSV → confirm
3. **Projects**: `/projects?tab=import` → upload CSV → confirm

(field mapping wizard มี default mapping สำหรับ Builk format — กดผ่านได้)

### 1.4 ตรวจสอบ

- `/projects` ควรเห็นโครงการของคุณครบ
- `/cost-codes` ควรเห็น cost code ที่ import มา + 100 seed codes ไทย
- `/suppliers` ควรเห็น supplier directory

---

## Section 2 — Terminology Mapping (Builk → Buildbybim)

เราใช้คำเดียวกับ Builk เพื่อให้คุ้นเลย — ส่วนใหญ่ไม่ต้องเรียนใหม่:

| Builk | Buildbybim | หมายเหตุ |
|---|---|---|
| ใบขอซื้อ (PR) | ใบขอซื้อ (PR) | เหมือนกัน |
| ขอราคา (RFQ) | ขอราคา (RFQ) | เหมือนกัน |
| จัดซื้อ (PO) | ใบสั่งซื้อ (BuildDocs) | ออกผ่าน BuildDocs Pro |
| รับเงิน (Invoice) | ใบแจ้งหนี้ (BuildDocs) | ออกผ่าน BuildDocs Pro |
| Cost Code (CBS) | หมวดต้นทุน (Cost Code) | เหมือนกัน |
| Customer | ลูกค้า (Client) | เหมือนกัน |
| Supplier / ผู้รับเหมา | Supplier / ผู้ขาย | เพิ่ม `subcontractor` type สำหรับผู้รับเหมาช่วง |
| กิจการ (Company) | Workspace | เปลี่ยน workspace ที่ topbar |
| แผงบริหาร (Dashboard) | Hub Dashboard / Project Control | แยก: Hub = ภาพรวม, Project Control = per-project |
| โครงการ (Project) | โครงการ (Project) | เหมือนกัน + เพิ่ม internal/no-customer type |
| งบประมาณ | งบประมาณ | เหมือนกัน |
| กำไรรับรู้เบื้องต้น | กำไรปัจจุบัน (คาดการณ์) | เพิ่ม tooltip อธิบายสูตร |
| ระยะเวลาคงเหลือ -X วัน | เลย deadline X วัน — ปิดงาน? | actionable แทน read-only |

---

## Section 3 — Workflow Mapping (ทำเหมือนกันได้)

### 3.1 สร้างโครงการใหม่

**Builk**: คลิก `+ สร้างโครงการ` ในหน้า `โครงการ` → กรอก ชื่อ/ลูกค้า/มูลค่า/วันที่ → save

**Buildbybim**: `/projects` → คลิก `+ สร้างโครงการ` → form auto-suggest code `j-2601` → กรอกเหมือน Builk → save

**ของเรา**: + customer type auto-detect (gov/corporate/individual), + AI estimate budget (Phase 2)

### 3.2 บันทึกต้นทุนรายวัน

**Builk**: `บันทึกต้นทุน` → เลือก project → เลือก cost code → ใส่ supplier/amount/qty → save

**Buildbybim**: `/cashflow` → `+ Quick add` → เลือก project (autocomplete) → cost code → supplier → amount → save

**ของเรา**: + LINE intake (สลิป → OCR → draft entry, Phase 2), + supplier price history เก็บอัตโนมัติ

### 3.3 ใบขอซื้อ (PR)

**Builk**: `ใบขอซื้อ` → สร้าง PR → เลือก project → add items (1 row = 1 item) → submit → manager approve → ออก PO

**Buildbybim**: `/procurement?tab=pr-detail` → เหมือน Builk + items บังคับ cost code (better reporting) + AI draft จาก spec photo (Phase 2)

### 3.4 ขอราคา (RFQ)

**Builk**: จาก PR → คลิก `ขอราคา` → เลือก supplier → ส่ง → ใส่ราคา/ supplier → เลือกผู้ชนะ

**Buildbybim**: `/procurement?tab=rfq-detail` → เหมือน Builk + matrix comparison view (UX ดีกว่า) + best-price auto-highlight + LINE quote intake (Phase 2)

### 3.5 รายงานโครงการ

**Builk**: `แผงบริหาร` → 9 reports เลือก type → generate

**Buildbybim**: `/project-control?tab=reports` → 5 reports หลัก (Project P&L, Cashflow Forecast, Cost Variance, Supplier Spend, PR Aging) + AI "ถามอะไรก็ได้" (Phase 2)

---

## Section 4 — ข้อแตกต่างสำคัญ

### 4.1 ที่ดีกว่าใน Buildbybim

✅ **Local-first**: ทำงานต่อได้แม้ออฟไลน์ — sync เมื่อ online พร้อม
✅ **Mono brand design**: clean ขาว/ดำ ไม่รก ตา (Builk เน้นส้ม + ตารางหนาแน่น)
✅ **AI layer** (Phase 2 roadmap): draft PR, OCR สลิป LINE, suggest cost code, margin warning
✅ **Design workflow** (Phase 2-3): Plan Review, Brief Check, Moodboard, Presentation — สำหรับสายสถาปนิก
✅ **Content workflow** (Phase 2): Facebook content + prompt library
✅ **Custom plan + admin override**: admin ตั้งค่าสิทธิ์เองได้ ไม่ใช่ tier ตายตัว
✅ **Storage adapter pattern**: data ของคุณอยู่ในเครื่อง + sync ขึ้น Supabase ของคุณเอง (Phase C เปิดใช้แล้ว)
✅ **Multi-profession ready**: เริ่มจากก่อสร้าง แต่ขยายไปสายอื่นได้ (designer/freelancer/SME)

### 4.2 ที่ Builk ดีกว่า (ตอนนี้)

⚠ **30,000+ user base** — network effect, มี community Facebook
⚠ **Multi-language**: TH/EN/ID/MM/KH (เราตอนนี้แค่ TH/EN)
⚠ **9 standard reports** (เราเริ่มแค่ 5)
⚠ **Email distribution** built-in (เราใช้ Web Share + LINE)
⚠ **Credit/quota per project** ที่ established (เราเริ่มจาก unlimited free + flat Support 290฿)
⚠ **Documentation Thai** ละเอียดมาก (เรากำลังเขียน)

### 4.3 Migration risks

⚠️ **Sub-project / change order**: Builk ทำเป็นโครงการแยก (เช่น `j-2300` + `j-2300 งานเพิ่มเติม`) — Buildbybim ก็ทำได้เหมือนกัน (สร้างโครงการใหม่)

⚠️ **Multi-level approval**: Builk รองรับ 2+ level — Buildbybim v0.1 มีแค่ 1 level (requester → approver). หากต้องการ multi-level โปรดรอ v0.2

⚠️ **Transaction history เก่า**: ถ้า Builk export ไม่ได้ครบทุก field → ข้อมูลย้อนหลังอาจขาด supplier/note บางส่วน. แนะนำ:
   - Run cutoff date: data ก่อนนั้น stay in Builk (read-only reference)
   - data จากวันนั้นใหม่ทั้งหมดใน Buildbybim

---

## Section 5 — Hybrid mode (แนะนำ 30 วันแรก)

**ไม่ต้องย้ายทันที** — ใช้ทั้ง 2 ระบบพร้อมกันสำหรับ 30 วันแรก:

### Phase 1: Days 1-7 — Read-only import
- Import data จาก Builk เข้า Buildbybim
- ดูใน `/projects` + `/cost-codes` ว่าข้อมูลครบมั้ย
- บันทึกใน Builk ต่อไปตามปกติ (Buildbybim = mirror)

### Phase 2: Days 8-21 — Dual write
- เริ่มใช้ Buildbybim สำหรับ **PR ใหม่ + cashflow entry ใหม่**
- Builk: continue สำหรับ historical project + old approval chain
- เปรียบเทียบ UX + speed สองระบบ

### Phase 3: Days 22-30 — Decision
- ตัดสินใจ: continue Buildbybim full / กลับ Builk / hybrid permanent
- ถ้าเลือก Buildbybim full → run final export จาก Builk + final import → archive Builk account

**ไม่ตัด account Builk ทันที** — เก็บไว้เป็น backup 90 วัน

---

## Section 6 — Pricing ที่เทียบได้

| Builk | Buildbybim |
|---|---|
| ฟรี + paid premium cost codes (จำนวน project credit) | **ฟรี wider**: unlimited cost codes + 3 projects + Quick tools ทุกตัว |
| (paid plan ของ Builk — ตามที่ enterprise inquire) | **Support Monthly: 290฿/เดือน** — ครบทุก feature, workspace ไม่จำกัด, AI 10 runs/เดือน, priority support 24h |
| - | **Custom plan**: admin กำหนดสิทธิ์เอง — สำหรับทีม/องค์กร |

> ราคา 290฿ จริงเทียบกับ Builk premium ของคุณ — ขอข้อมูลใน chat ได้ ผมเทียบให้

---

## Section 7 — Support + Migration help

### 7.1 มีปัญหาตอน import?

- Email: `hello@buildbybim.space`
- LINE: `@buildbybim` (เร็วสุดสำหรับ Thai)
- Facebook: `Build by BIM` page

### 7.2 อยากปรับ field mapping?

CSV import wizard มี:
- Auto-detect Builk column names
- Manual mapping override (drag-drop)
- Preview ก่อน import + validation errors
- "Skip duplicates" หรือ "Update existing" toggle

### 7.3 ถ้า Builk export field ไม่ตรงกับเรา?

แจ้งได้เลย — เรา map field เพิ่มให้ในรอบถัดไป (พร้อม free 1-on-1 migration support สำหรับ 100 user แรก)

---

## Section 8 — FAQ

**Q: ข้อมูลของผมปลอดภัยมั้ย?**
A: Storage local-first (อยู่ในเครื่องคุณ) + sync ขึ้น Supabase ของคุณเอง (RLS เปิด, ดู `docs/SUPABASE_SETUP.md`) ไม่มีการ share ข้ามผู้ใช้

**Q: ใช้กับ Builk พร้อมกันได้มั้ย?**
A: ได้ — แนะนำตาม Section 5 (Hybrid mode 30 วัน)

**Q: ถ้า Buildbybim ปิด ข้อมูลผมจะเป็นยังไง?**
A: Local-first → ข้อมูลอยู่ในเครื่องคุณตลอด + export ออกได้ทุกรูปแบบ (CSV/Excel/JSON) — ไม่มี vendor lock-in

**Q: AI features จะเสียเงินเพิ่มมั้ย?**
A: Phase 2 จะมี AI quota ใน plan แต่ละ tier — Free ได้ 10 runs/เดือน, Support Monthly 100+ runs

**Q: Multi-language ตอนนี้รองรับอะไร?**
A: TH/EN พร้อมแล้ว · ID/MM/KH ใน roadmap v0.6+

**Q: รองรับ multi-company switcher แล้วยัง?**
A: Storage layer พร้อม (Supabase `workspaces` table) แต่ UI switcher ใน topbar กำลังพัฒนา Sprint 0 (PROJECT_PRD Section 6)

---

## Section 9 — Roadmap visibility

Roadmap public ที่ `docs/BUILK_PARITY_PLAN.md` Section 4 — Sprint timeline:

| Sprint | What | ETA |
|---|---|---|
| 0 | Project entity + List page | กำลังพัฒนา (spec ready: `docs/PROJECT_PRD.md`) |
| 1 | Cost Codes (CBS) catalog | ETA week 2 (spec: `docs/COST_CODES_PRD.md`) |
| 2 | Suppliers directory + price history | ETA week 3 (spec: `docs/SUPPLIERS_PRD.md`) |
| 3-4 | PR + RFQ workflow | ETA week 4-5 (spec: `docs/PROCUREMENT_PRD.md`) |
| 5 | Cashflow project extension + rollup | ETA week 6 (spec: `docs/CASHFLOW_PROJECT_EXTENSION_PRD.md`) |
| 6 | Project Control Dashboard + 5 reports | ETA week 7 (spec: `docs/PROJECT_CONTROL_PRD.md`) |
| 7 | Import wizard + multi-company switcher | ETA week 8 |
| 8-12 | AI overlay: PR draft, LINE intake, NL search | ETA Q3-Q4 |

ระหว่างนี้ใช้ `/mockup` ดูตัวอย่าง UI ทุก module ได้

---

## Section 10 — Contact for migration

อยากย้ายมาแต่ติดปัญหา? ส่งมาทาง:

- **Email**: `hello@buildbybim.space`
- **LINE**: `@buildbybim`
- **Facebook page**: `Build by BIM`

หรือถ้าอยากเป็น **alpha tester** (ฟรี + ได้ migration support 1-on-1 + เห็น feature ก่อนใคร) → reply ใน Facebook/LINE ของเราพร้อม "Migrate from Builk"

---

**ยินดีต้อนรับครับ — Buildbybim.space**

> Tools first · Workspace later · Agent ready
