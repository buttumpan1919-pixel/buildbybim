# Build By BIM Platform - App Taxonomy

Updated: 2026-05-23
Status: Draft taxonomy for app catalog, tools apps, prompts, workflows, and pricing

## 1. Purpose

เอกสารนี้กำหนด taxonomy กลางสำหรับแอปทั้งหมดใน Buildbybim.space เพื่อให้ app catalog, public route, membership access, pricing, prompt packs, tools apps และ workflow apps ใช้ metadata เดียวกัน

ทุกแอปใหม่ควรถูกจัดหมวดด้วยข้อมูลชุดนี้ก่อนเริ่มทำ UI หรือ schema จริง

## 2. Required App Metadata

| Field | Required | Meaning |
| --- | --- | --- |
| `id` | yes | stable app id ใช้ใน manifest, access rule, route และ audit |
| `name` | yes | ชื่อที่แสดงใน UI |
| `route` | yes | public หรือ workspace route หลัก |
| `route_group` | yes | `public`, `app`, `tool`, `prompt`, `workflow`, `account`, `admin`, `developer` |
| `category` | yes | หมวดหลักของแอป |
| `tool_pattern` | tools only | รูปแบบ tool เช่น planner, calculator, checklist |
| `profession_tags` | yes | อาชีพ/กลุ่มผู้ใช้เป้าหมาย |
| `use_case_tags` | yes | ปัญหาหรือ workflow ที่แก้ |
| `difficulty` | yes | `easy`, `standard`, `advanced`, `expert` |
| `monetization` | yes | วิธีหารายได้ เช่น free, freemium, paid pack |
| `access_level` | yes | สิทธิ์เริ่มต้น เช่น preview, quick, saved, export |
| `privacy_level` | yes | ระดับความเป็นส่วนตัวของข้อมูล |
| `ai_usage` | yes | ใช้ AI หรือไม่ และใช้ระดับไหน |
| `data_persistence` | yes | ไม่เก็บข้อมูล, local draft, user profile, workspace, project |
| `storage_mode` | yes | `none`, `local`, `backend`, `hybrid`, `object_storage` |
| `export_options` | optional | copy, PDF, CSV, image, JSON, share link |
| `required_role` | optional | role ขั้นต่ำ เช่น owner, member, support operator |
| `status` | yes | `planned`, `prototype`, `active`, `ready`, `parked`, `future` |

## 3. Categories

| Category | Scope |
| --- | --- |
| `construction` | BOQ, defect, site report, task, handover, project documents |
| `design` | brief, plan review, moodboard, prompt/render, presentation, BIM handoff |
| `business` | CRM, proposal, invoice, cashflow, admin/accounting |
| `ai_workflow` | prompt library, file summary, document extraction, AI assistant |
| `auto_workflow` | content workflow, report generation, follow-up, file-to-data |
| `tools` | small practical apps that solve one focused task |
| `prompt_assets` | prompt set, template, variable form, example output, prompt pack |
| `agent` | agent chat, LINE intake, tool registry, audit, automation control |
| `platform` | account, app marketplace, pricing, support plan, admin settings |
| `bim_iot` | BIM model, equipment, telemetry, alert, digital twin future layer |

## 4. Tools App Patterns

| Pattern | Example |
| --- | --- |
| `planner` | life planner, project kickoff planner, content plan |
| `calculator` | quick BOQ, cost estimate, cashflow, fee calculator |
| `checklist` | site checklist, design review checklist, handover checklist |
| `generator` | caption generator, proposal draft, report draft |
| `tracker` | defect tracker, habit tracker, support request tracker |
| `assistant` | focused AI helper for one task |
| `converter` | file/text/table format converter |
| `extractor` | receipt/image/PDF to structured data |
| `template` | reusable document, prompt, checklist, workflow template |

## 5. Profession Tags

เริ่มต้นให้รองรับ tag เหล่านี้ก่อน:

- `architect`
- `designer`
- `contractor`
- `site_team`
- `engineer`
- `qs_estimator`
- `owner_developer`
- `supplier_vendor`
- `admin_accounting`
- `sales_marketing`
- `small_business`
- `freelancer`
- `consultant`
- `personal`
- `support_operator`

## 6. Monetization

| Value | Meaning |
| --- | --- |
| `free` | ใช้ได้ฟรี |
| `freemium` | quick/free ก่อน upgrade เพื่อ save/export/AI/support |
| `member` | รวมใน membership plan |
| `paid_app` | ขายสิทธิ์ app เดี่ยว |
| `paid_pack` | ขายเป็น prompt pack, template pack, profession pack |
| `support_plan` | รวมกับ support รายเดือน |
| `custom` | admin กำหนดสิทธิ์เองผ่าน override/manual billing |

## 7. Privacy Levels

| Level | Use |
| --- | --- |
| `public` | ข้อมูล public เช่น app page, prompt ตัวอย่าง, landing page |
| `anonymous` | ใช้งาน quick mode โดยไม่ต้อง login และไม่ผูกตัวตน |
| `personal` | ข้อมูลส่วนตัว เช่น life planner หรือ habit |
| `workspace` | ข้อมูลของทีม/ธุรกิจ/ลูกค้า |
| `project` | ข้อมูลผูกกับ project หรือ client |
| `sensitive` | เอกสารการเงิน สัญญา ใบเสร็จ รูปหน้างาน ข้อมูลลูกค้า |
| `admin_only` | plan, payment, permission, audit, service key |

## 8. AI Usage

| Value | Meaning |
| --- | --- |
| `none` | ไม่ใช้ AI |
| `optional` | ใช้ AI เป็นตัวช่วย แต่ workflow หลักยังทำเองได้ |
| `required` | ต้องใช้ AI เพื่อสร้างผลลัพธ์หลัก |
| `agent` | ใช้ agent/tool call/read-write workflow |
| `external_api` | ต้องเรียก provider ภายนอก |

AI output ที่กลายเป็นข้อมูลจริงต้องใช้กติกา draft-before-commit, permission check, confirmation และ audit log ตาม `docs/DATA_STRATEGY.md`

## 9. Data Persistence

| Value | Meaning |
| --- | --- |
| `none` | ไม่บันทึกข้อมูล |
| `local_draft` | บันทึก draft ในเครื่องหรือ browser |
| `user_profile` | บันทึกกับ user รายคน |
| `workspace` | บันทึกกับ workspace |
| `project` | บันทึกกับ project/client |
| `shared_asset` | ใช้ร่วมกันเป็น public/template/prompt/resource |
| `audit_only` | เก็บเฉพาะ event/audit ไม่เก็บเนื้อหาเต็ม |

## 10. Example App Records

| App | Category | Route | Monetization | Privacy | AI | Data |
| --- | --- | --- | --- | --- | --- | --- |
| `toolsCatalog` | `tools` | `/tools` | `free` | `public` | `none` | `none` |
| `promptSetLibrary` | `prompt_assets` | `/prompts` | `freemium` | `public/workspace` | `optional` | `shared_asset` |
| `facebookContentWorkflow` | `auto_workflow` | `/workflows/facebook-content` | `member` | `workspace` | `required` | `workspace` |
| `planReview` | `design` | `/design/plan-review` | `freemium` | `project/sensitive` | `required` | `project` |
| `lifePlanner` | `tools` | `/tools/life-planner` | `freemium` | `personal` | `optional` | `user_profile` |

## 11. Implementation Notes

- `src/apps.ts` remains the manifest for implemented workspace apps.
- Planned public routes and catalog routes live in `docs/PUBLIC_ROUTES.md` until UI routes are implemented.
- Backend tables should store taxonomy metadata in `apps`, `app_features`, and app-specific config tables.
- Access checks must use taxonomy metadata together with `AppAccessRule` and `AppAccessOverride`.
