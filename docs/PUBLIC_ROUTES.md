# Build By BIM Platform - Public Route Map

Updated: 2026-05-24
Status: Draft information architecture

## 1. Purpose

เอกสารนี้กำหนดเส้นทางเว็บหลักสำหรับ public website และ app discovery layer ก่อนทำ route จริงใน frontend

เป้าหมายคือให้ผู้ใช้จาก Facebook/social media เข้ามาเจอเครื่องมือที่ใช้ได้ทันที แล้วค่อยพาไปสมัครสมาชิก, save/export, support plan หรือบริการเสริม

## 2. Primary Routes

`/roadmap` is a P0 public route for user-facing development status. It summarizes current version, shipped milestones, current focus, next work, and the rule that every completed development task must update the Roadmap.

| Route | Page | Purpose | Priority |
| --- | --- | --- | --- |
| `/` | Home / App Hub entry | หน้าแรกที่พาไป free tools, apps, prompt packs, workflows และ pricing | P0 |
| `/apps` | App Marketplace | รวมแอปทั้งหมด แยกตามหมวด อาชีพ free/paid และระดับความยาก | P0 |
| `/tools` | Tools Catalog | รวม tools apps ขนาดเล็ก เช่น planner, calculator, checklist, generator, tracker, assistant | P0 |
| `/prompts` | Prompt Set Library | รวม prompt set, prompt template, prompt pack, favorite และ access tier | P0 |
| `/workflows` | Workflow Catalog | รวม auto workflow apps เช่น Facebook content, file-to-data, report, follow-up | P0 |
| `/pricing` | Pricing / Support Plans | แสดงแผนใช้งาน app access, support quota, paid packs และช่องทางจ่ายเงิน | P0 |
| `/developer` | Developer / About | แนะนำผู้พัฒนา ความเชี่ยวชาญ ความน่าเชื่อถือ และช่องทางติดต่อ | P1 |

## 3. Secondary Routes

| Route | Page | Purpose |
| --- | --- | --- |
| `/resources` | Resources | บทความ คู่มือ template และ market education |
| `/apps/:appId` | App Detail | หน้าอธิบายแต่ละแอป ตัวอย่างผลลัพธ์ ราคา และปุ่มใช้งาน |
| `/tools/:toolSlug` | Tool Detail | หน้าใช้ tool เฉพาะตัวแบบ quick mode หรือ saved mode |
| `/prompts/:promptSetId` | Prompt Set Detail | หน้า prompt set พร้อม variables, examples, copy/use action |
| `/prompts/builder` | Prompt Set Builder | หน้า admin/creator สร้าง prompt set และ version |
| `/workflows/:workflowSlug` | Workflow Detail | หน้า workflow app พร้อม input, draft, approval, export |
| `/support-plans` | Support Plans | หน้าแผน support รายเดือนและเงื่อนไข |
| `/account` | Member Account | profile, subscription, access summary, billing note |

## 4. Navigation Rules

- `/roadmap` ต้องอัปเดตหลังจบงานพัฒนาที่เปลี่ยนสถานะ feature/app/route/test/build เพื่อให้ผู้ใช้และ agent เห็นสถานะเดียวกัน

- หน้าแรกต้องพาผู้ใช้ไป `tools`, `apps`, `prompts`, `workflows`, `pricing` ได้ชัดเจน
- `developer` เป็นหน้าสนับสนุนความน่าเชื่อถือ ไม่ใช่ primary landing page
- `apps`, `tools`, `prompts`, `workflows` ต้องใช้ taxonomy จาก `docs/APP_TAXONOMY.md`
- route ที่เป็น quick mode ควรใช้งานได้ก่อน login ถ้าไม่แตะข้อมูลส่วนตัวหรือข้อมูลโครงการ
- route ที่ต้อง save/export/support ต้องพาไป signup/login หรือ pricing ตาม access rule
- ทุก route ที่ใช้ AI หรือเก็บข้อมูลต้องแสดง privacy/access behavior ให้ชัดใน app metadata

## 5. First Implementation Cut

ลำดับทำ route แรก:

1. `/` home ที่ชี้ไป free tools และ app groups
2. `/tools` catalog พร้อม filter ตาม pattern/profession/free-paid/privacy
3. `/prompts` prompt set catalog
4. `/workflows` workflow catalog และ `/workflows/facebook-content`
5. `/pricing` plan/support summary
6. `/developer` about page แบบสั้น

## 6. Relationship To Workspace Routes

Public routes ใช้สำหรับ discovery, education, pricing และ quick mode

Workspace routes เช่น `/docs`, `/boq-data`, `/design`, `/agent-chat`, `/cashflow` ใช้สำหรับ logged-in หรือ saved workflow ที่มีข้อมูล workspace/project จริง
