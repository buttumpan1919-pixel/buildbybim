# Build By BIM Platform - Data Strategy

Updated: 2026-05-23
Status: Product and architecture data policy

## 1. Core Position

ข้อมูลคือสินทรัพย์หลักของ Build By BIM Platform

ทุกแอปต้องช่วยผู้ใช้แก้ปัญหาเฉพาะหน้าได้เร็ว แต่เมื่อผู้ใช้เลือกบันทึก ข้อมูลนั้นต้องถูกจัดเก็บอย่างมีโครงสร้าง ปลอดภัย ค้นหาได้ ใช้ซ้ำได้ export ได้ และเชื่อมต่อ workflow อื่นได้ในอนาคต

หลักสำคัญ:

- Quick output creates trust
- Saved data creates long-term value
- Connected data creates platform value
- Trusted data creates revenue and retention

## 2. Data Product Principles

1. User owns their workspace data
   - ข้อมูลของผู้ใช้ต้องแยกตาม `workspace`
   - ผู้ใช้ต้อง export ข้อมูลสำคัญของตัวเองได้
   - ห้ามผูกข้อมูลไว้กับ provider เดียวจนย้ายออกไม่ได้

2. Save only useful structured data
   - อย่าเก็บเป็น text blob อย่างเดียวถ้าข้อมูลนั้นใช้คำนวณหรือ report ต่อได้
   - ใบเสร็จต้องแยก merchant, date, amount, category, project
   - BOQ ต้องแยก code, description, unit, quantity, unit cost
   - defect ต้องแยก project, location, severity, status, owner, due date

3. Keep raw source and structured result
   - รูปใบเสร็จ, PDF, CSV, BIM file หรือ LINE image ควรเก็บเป็น `FILE_ASSET`
   - ผลลัพธ์จาก OCR/AI/import ต้องเก็บเป็น structured record
   - ต้องย้อนกลับไปดู source ได้เมื่อข้อมูลผิด

4. Draft before commit
   - ข้อมูลจาก AI/OCR/agent ต้องเป็น draft ก่อน
   - write จริงต้องผ่าน validation, permission และ confirmation ตามความเสี่ยง
   - confidence ต่ำต้องให้ผู้ใช้ตรวจ

5. Data must be reusable
   - ข้อมูลลูกค้าใช้ซ้ำในเอกสารได้
   - BOQ ใช้ต่อใน document, task, cashflow, BIM mapping ได้
   - receipt ใช้ต่อใน expense, cashflow, project cost, tax/report ได้
   - defect ใช้ต่อใน handover, team task, support, BIM location ได้

## 3. Data Classes

| Class | Examples | Storage priority | Notes |
| --- | --- | --- | --- |
| Identity | user, workspace, member, role | Backend only | ต้องใช้ auth/RLS |
| Access control | plan, subscription, app feature, access rule, access override, permission change | Backend only + audit | admin ตั้งสิทธิ์แบบอิสระได้ แต่ต้องมี audit trail |
| Business master | client, project, app, plan | Backend primary | ใช้ซ้ำหลายแอป |
| Tools app data | life plan, checklist, calculator input, generated plan, habit, personal note | Local-first + backend optional | ต้องแยก personal/workspace data และ export ได้ |
| Workflow automation data | content workflow, campaign, post draft, approval, prompt input, export history, performance note | Local-first + backend primary later | ต้องเก็บ source และ approval ก่อน publish/send |
| Prompt asset | prompt set, prompt template, prompt version, variables, examples, access rule, favorite | Backend primary + local favorite | ต้องมี owner, version, visibility, access tier และห้ามเก็บ secret |
| Design data | brief, requirement, option, moodboard, prompt, feedback | Backend primary + storage | ต้องต่อ BIM/BOQ/Docs ได้ |
| Transaction | document, expense, cashflow, payment | Backend primary | ต้องมี audit trail |
| Work item | task, defect, support request | Backend primary | ต้องมี status/history |
| File source | receipt image, PDF, BIM file, photo | Object storage | metadata อยู่ใน database |
| AI result | extraction, summary, draft, embedding | Database + storage | ต้องโยงกับ source |
| BIM data | model, version, element, space, zone | Backend structured | เริ่มจาก metadata ก่อน viewer |
| IoT data | device, telemetry, alert | Backend/time-series ready | เพิ่มเมื่อ product พร้อม |
| Audit | agent action, user action, permission change | Append-only | ห้ามลบง่าย |

## 4. Storage Stages

### Stage 1: Local-first prototype

- ใช้ `localStorage` สำหรับทดลอง flow
- ต้องมี JSON backup/import
- ห้ามเก็บไฟล์ใหญ่หรือรูปจำนวนมากเป็น `dataUrl` ระยะยาว
- ทุก schema change ต้องมี normalizer/migration

### Stage 2: Member-ready backend

- ใช้ Supabase/Postgres เป็น database หลัก
- ใช้ `workspace_id` เป็น tenant boundary
- ใช้ app taxonomy จาก `docs/APP_TAXONOMY.md` เพื่อกำหนด privacy, AI usage, monetization และ persistence ก่อนสร้างตารางใหม่
- ใช้ RLS/permission layer สำหรับข้อมูลทุก workspace
- ใช้ entitlement resolver กลางสำหรับ `Plan` + `AppAccessRule` + `AppAccessOverride`
- ทุก permission change ต้องเขียน audit log และไม่ควรแก้ผ่าน frontend state อย่างเดียว
- ใช้ object storage สำหรับไฟล์
- localStorage เป็น cache/draft ได้ แต่ไม่ใช่ source of truth

### Stage 3: Agent and automation data

- เพิ่ม `agent_runs`, `agent_messages`, `agent_tool_calls`, `agent_actions`, `agent_inbox_items`, `audit_logs`
- ข้อมูลจาก LINE/OCR/AI ต้องมี source file และ draft record
- write action ต้อง audit ได้ว่าใคร/agent ตัวไหน/ข้อมูลไหน/เวลาไหน

### Stage 4: BIM/IoT data

- เพิ่ม BIM metadata ก่อน 3D viewer
- เพิ่ม IoT device/telemetry หลัง project/space/asset model นิ่ง
- telemetry จำนวนมากอาจต้องแยก storage strategy ภายหลัง

## 5. Minimum Data Contract For Every App

ทุกแอปใหม่ต้องระบุ:

- App owner and route
- Primary entities
- Workspace scope
- Storage key หรือ backend tables
- Import/export format
- Backup behavior
- Permission model
- Audit events
- Data retention expectation
- Links to other apps

ตัวอย่าง:

```text
BuildDocs
  primary entities: document, document_line_item, client, project
  saved mode: save to workspace
  export: print/PDF, JSON backup
  links: BOQ, Cashflow, Client Ops, Agent

Design Brief
  primary entities: design_brief, design_requirement, design_option, design_feedback, file_asset
  saved mode: save to project
  export: PDF/presentation/image board/JSON backup
  links: Library, Design Studio, Plan Review, BOQ, BuildDocs, BIM Link, Agent

Plan Review / Architect Brain
  primary entities: design_plan_review, design_plan_review_finding, design_plan_review_export, file_asset
  saved mode: save to project or design brief
  export: markdown, JSON, print/PDF-ready HTML
  links: Design Brief, Design Options, BuildDocs, BOQ, BIM Link, Agent
```

## 6. Backup, Export And Portability

ต้องรองรับอย่างน้อย:

- Export workspace data เป็น JSON
- Export document เป็น PDF/print
- Export BOQ/expense/cashflow เป็น CSV
- Download original files ที่ผู้ใช้ upload
- Import JSON backup กลับเข้า workspace
- Migration path จาก localStorage ไป backend

ระยะต่อไป:

- Scheduled backup
- Workspace snapshot
- Admin restore
- Audit log export

## 7. Privacy And Security Requirements

ต้องถือว่าข้อมูลเหล่านี้ sensitive:

- ข้อมูลลูกค้า
- ใบเสนอราคา/สัญญา/invoice/receipt
- รูปหน้างานและ defect
- ข้อมูลบัญชีและ cashflow
- LINE user id และ conversation
- payment/subscription records
- BIM/asset/device data ของอาคาร

กฎ:

- ห้าม expose service role key หรือ provider secret ใน frontend
- ใช้ signed/private file access สำหรับไฟล์ส่วนตัว
- ใช้ least privilege สำหรับ role และ agent tools
- ต้องมี audit log สำหรับ write/delete/permission/payment/agent actions
- ต้องมี explicit confirmation สำหรับ destructive action
- ต้องเตรียม privacy/consent/terms ก่อนเปิดใช้งานจริงกับบุคคลภายนอก

## 8. Data Quality Rules

- ใช้ stable id ไม่ใช้ชื่อเป็น primary key
- วันที่ต้องเก็บเป็น ISO date/datetime
- เงินต้องเก็บ amount + currency
- enum/status ต้องมีค่าแน่นอน ไม่ใช้ข้อความอิสระถ้าใช้ report ต่อ
- import ต้อง validate และ report error ชัดเจน
- AI extraction ต้องเก็บ confidence และ raw result
- records สำคัญต้องมี `created_at`, `updated_at`, `created_by`, `workspace_id`

## 9. First Backend Data Cut

เมื่อตัดสินใจเริ่ม backend ให้เริ่มจาก:

- `users`
- `workspaces`
- `workspace_members`
- `clients`
- `projects`
- `design_briefs`
- `design_requirements`
- `design_options`
- `design_plan_reviews`
- `design_plan_review_findings`
- `design_plan_review_exports`
- `documents`
- `document_line_items`
- `boq_items`
- `tasks`
- `boq_allocations`
- `file_assets`
- `audit_logs`

ยังไม่ต้องเริ่มพร้อมกัน:

- IoT telemetry
- full BIM viewer
- complex payment automation
- open professional network
- vector search เต็มรูปแบบ

## 10. Success Metrics

ระบบข้อมูลถือว่าเริ่มถูกทางเมื่อ:

- ผู้ใช้สร้าง output แรกได้เร็ว
- ผู้ใช้ยอม save ข้อมูลเข้า workspace
- ข้อมูลเดิมถูกใช้ซ้ำในแอปอื่นได้
- export/backup/restore ใช้งานได้
- agent action ตรวจย้อนหลังได้
- ข้อมูลไม่ปนข้าม workspace
- backend schema รองรับ app ใหม่โดยไม่ต้องรื้อฐานใหม่ทุกครั้ง
