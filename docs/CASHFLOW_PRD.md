# Cashflow App PRD

Updated: 2026-05-23
Status: Draft — covers v0.1 prototype (local-first)
Source of truth: `docs/PRD.md` Section 9 "Business Apps Requirements / Cashflow"

## 1. Purpose

`cashflow` คือกระแสเงินสดของธุรกิจ/โครงการ ไม่ใช่แผนปลดหนี้ส่วนตัว เป้าหมายของแอปคือเก็บรายการเงินเข้า–ออกของผู้รับเหมา/ทีมออกแบบ ให้ตรวจสอบยอดสุทธิรายเดือนได้เร็ว และเป็น source ที่ Hub Dashboard, BuildDocs และ BOQ Data ใช้อ้างอิงได้ในอนาคต

แอปนี้ตอบเป้าหมายของ PRD Section 3.4 "Wedge App" — `Acceptance criteria: ผู้ใช้ใหม่ต้องเข้าใจงานหลักของแอปภายใน 30 วินาที` และ Section 2 `Instant utility, future memory` — ใช้ได้ทันทีในเครื่อง บันทึกเป็น asset ที่ต่อยอดได้

## 2. Non-Goals (v0.1)

- ไม่เชื่อมกับ payment provider จริง
- ไม่ทำ multi-user permission/RLS
- ไม่ทำ Gantt/Schedule รายเดือนล่วงหน้า
- ไม่ทำ recurring engine แบบ cron — รอบบิลใน v0.1 ผู้ใช้บันทึกเอง (recurring เป็น v0.2)
- ไม่ทำ AI/Agent intake รอบนี้ — LINE receipt intake เป็น scope ของ `agentControl` (PRD 3.5)
- ไม่ทำ PO spending model — รอ `boqData` → `cashflow` linkage รอบถัดไป (PRD Release Plan v0.2)

## 3. Storage Contract

ใช้คีย์เดียวแยกจาก workspace อื่นตามกติกา PRD Section 6 (storage adapter):

| Storage Key | Module | Type |
| --- | --- | --- |
| `cashflow.entries.v1` | `src/cashflow.ts` | `CashflowState = { entries: CashflowEntry[]; updatedAt: string }` |

ห้าม overwrite key เดิม เช่น `builddocs-pro.workspace.v1`, `boq-data.task-linkage.v1`

## 4. Data Model

(implemented in `src/cashflow.ts`)

```ts
type CashflowDirection = "income" | "expense";

type CashflowCategory =
  | "client_payment" | "loan_in" | "other_income"          // income
  | "material" | "labor" | "subcontract" | "transport"
  | "equipment" | "office" | "tax_fee" | "other_expense"; // expense

type CashflowEntryStatus = "draft" | "confirmed" | "void";

type CashflowEntry = {
  id: string;
  direction: CashflowDirection;
  category: CashflowCategory;
  amount: number;          // always positive; direction tells sign
  description: string;
  projectId: string;       // empty = ไม่ผูก project
  documentId: string;      // empty = ไม่ผูกเอกสาร
  entryDate: string;       // ISO date "YYYY-MM-DD"
  status: CashflowEntryStatus;
  note: string;
  createdAt: string;
  updatedAt: string;
};
```

Status flow: `draft` → ผู้ใช้ตรวจ → `confirmed` ใช้คำนวณ summary, `void` ไม่นับ

## 5. Cross-App Linkage

| Source | Field | Purpose |
| --- | --- | --- |
| `BuildDocs` document id | `CashflowEntry.documentId` | ผูก expense กับใบเสนอราคา/ใบเสร็จ |
| `ProjectRecord.id` | `CashflowEntry.projectId` | กรองรายการตามโครงการ |
| Hub Dashboard | `summarizeCashflow(state)` | สรุป `monthNet`, `draftCount` แสดงใน summary tile + action row |

ตามกติกา PRD Section 6 ห้ามให้ UI เรียก localStorage ตรง — ต้องผ่าน `loadCashflowState` / `saveCashflowState` ใน `src/cashflow.ts`

## 6. UI Flow

### 6.1 Subnav

ใช้ subnav เดิมจาก `src/App.tsx` `workspaceAppSubnavItems.cashflow`:

| Tab | Status v0.1 | Content |
| --- | --- | --- |
| `overview` | implemented | summary tiles + entry list + quick add form + confirm draft |
| `forecast` | placeholder | scaffold พร้อม empty state ระบุ scope ของ v0.2 |
| `reports` | placeholder | scaffold พร้อม empty state ระบุ scope ของ v0.3 |

### 6.2 Overview tab layout

```
[Hero: รายรับ–รายจ่าย รายเดือน + ปุ่มเพิ่มรายการ]

[Summary grid 4 tiles]
- รายรับเดือนนี้ (monthIncome)
- รายจ่ายเดือนนี้ (monthExpense)
- สุทธิเดือนนี้ (monthNet, strong=true ถ้าบวก)
- รายการรอ confirm (draftCount)

[Quick add form]
- direction toggle (income/expense)
- category select (filter ตาม direction)
- amount input
- description input
- entryDate (default today)
- ปุ่ม "บันทึก draft" + "บันทึก + confirm"

[Entry list]
- เรียงตาม entryDate desc
- แต่ละแถวมี: วันที่ · category · description · amount (สี + sign) · status badge
- คลิก draft → confirm action
- คลิก row → expand note/edit
- ปุ่ม delete (มี confirm)
```

### 6.3 Add entry flow

1. ผู้ใช้เลือก income หรือ expense
2. เลือก category จาก dropdown (filter ตาม direction)
3. ใส่ยอด + description
4. เลือกวันที่ (default = วันนี้)
5. กด "บันทึก draft" → status `draft`, ยังไม่นับ summary
6. หรือกด "บันทึก + confirm" → status `confirmed`, นับ summary ทันที

### 6.4 Confirm draft flow

1. ใน entry list, row ที่ `status === "draft"` มีปุ่ม "Confirm"
2. กด → เรียก `upsertCashflowEntry(state, {...entry, status: "confirmed"})`
3. summary tile + Hub action row "Cashflow รอ confirm" อัปเดตทันที

## 7. Acceptance Criteria (v0.1)

- เปิด `/cashflow?tab=overview&version=0.1` ได้ ไม่มี runtime error
- เพิ่ม entry แล้ว reload หน้า ข้อมูลยังอยู่
- รายการ confirm แล้วสะท้อนใน Hub summary tile `Cashflow สุทธิเดือนนี้` ทันที
- รายการ draft สะท้อนใน Hub action row `Cashflow รอ confirm {count}` ทันที
- ลบ entry ทำงานและ summary คำนวณใหม่ถูกต้อง
- ไม่กระทบ storage key ของแอปอื่น (Docs/BOQ/Defect/Employees)
- `npm run build` ผ่าน
- รองรับ TH/EN ผ่าน dictionary ใน App.tsx (ไม่ hardcode ภาษาเดียว)

## 8. Out-of-scope but Planned

- v0.2 Recurring entries (รายการประจำเดือน เช่น ค่าออฟฟิศ ค่าแรงทีมถาวร)
- v0.2 Project-level cashflow filter (filter ตามโครงการที่เลือก)
- v0.2 Document linkage UI (เลือก document id เมื่อเพิ่มรายการ)
- v0.3 Forecast tab (กระแสเงินสด 90 วันถัดไปจาก recurring + milestones)
- v0.3 Reports tab (กราฟ income/expense รายเดือน, รายปี, ต่อ category, ต่อ project)
- v0.4 Backend sync ผ่าน adapter เดียวกับแอปอื่น (PRD Section 6)
- v0.5 LINE receipt intake → draft cashflow entry (ผ่าน `agentControl`, PRD 3.5)

## 9. Mapping To Master PRD/ERD

| Master PRD reference | This PRD section |
| --- | --- |
| Section 9 "Cashflow" requirements | Section 1-7 |
| Section 6 "Architecture" (storage adapter, no Firebase) | Section 3 |
| Section 2 "Instant utility, future memory" | Section 6.3 (quick add) + 6.4 (confirm) |
| Section 3.4 "Wedge App" acceptance | Section 7 |
| `PLATFORM_ERD.md` `CASHFLOW_ENTRY` entity | Section 4 (data model maps to fields: id, project_id, direction, category, amount, entry_date, source_expense_id-via-documentId) |
| `DATA_STRATEGY.md` draft-first principle | Section 6.4 (status flow draft → confirmed) |

## 10. Implementation Notes

- ไฟล์หลัก: `src/cashflow.ts` (pure data module, ไม่ import React)
- UI: `src/App.tsx` → `CashflowPanel` (new component) inserted into `WorkspaceAppPanel` dispatcher
- Dictionary: ใช้ `hubDashboardCopy.cashflowCategoryCopy` (TH/EN ระดับ category) + เพิ่ม cashflow-specific copy ใน App.tsx หรือไฟล์แยก
- ปุ่มเพิ่มรายการเรียก `upsertCashflowEntry(state, entry)` แล้ว `saveCashflowState(nextState)`
- เปลี่ยน `cashflow` status ใน `src/apps.ts` จาก `planned` เป็น `prototype` หลัง UI พร้อมใช้
