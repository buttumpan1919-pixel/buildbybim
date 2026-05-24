# Build By BIM Platform - Membership And Access Control PRD

Updated: 2026-05-23
Status: Draft product contract
Owner: Buildbybim.space

Implementation note 2026-05-24: app-level membership access remains in `src/membership.ts`; project-level access is now split into `src/projectAccess.ts` and Supabase table `project_access_grants`. Use both layers together: app access decides whether the user can enter a module, while project access decides which project records and actions they can read/write/approve/export inside that module.

## 1. Purpose

ระบบสมาชิกของ Buildbybim.space ต้องตั้งค่าแผนการใช้งานและสิทธิ์การใช้แอปได้แบบอิสระ โดย admin ไม่ควรถูกบังคับให้ใช้ tier ตายตัว เช่น Free/Pro/Enterprise เท่านั้น

เป้าหมายคือให้ owner/admin สามารถขายได้หลายรูปแบบ เช่น free tool, paid mini app, monthly support, profession pack, special access, trial, coupon, หรือสิทธิ์เฉพาะลูกค้าบางราย

## 2. Core Rules

- `Plan` คือแพ็กเกจราคา/เงื่อนไขหลัก ไม่ใช่ตัวกำหนดสิทธิ์ทั้งหมดแบบ hardcode
- `AppAccessRule` คือสิทธิ์เริ่มต้นที่ผูกกับ plan ว่าเปิด app หรือ feature ใดได้บ้าง
- `AppAccessOverride` คือสิทธิ์พิเศษที่ admin ตั้งให้ workspace, member หรือ user รายคนได้
- `WorkspaceMember.role` ใช้คุมสิทธิ์กับข้อมูลใน workspace เช่น owner, member, reviewer, vendor, support operator
- app access และ workspace role ต้องเช็คพร้อมกันก่อน read/write/export/admin action
- ทุกการเปลี่ยนสิทธิ์ต้องเข้า `AUDIT_LOG`

## 3. Access Levels

ระดับสิทธิ์ควรเก็บแบบ config ได้ ไม่ควรฝัง logic ตายตัวใน UI อย่างเดียว

| Level | Meaning |
| --- | --- |
| `none` | ไม่มีสิทธิ์เห็นหรือเข้าใช้ |
| `preview` | เห็นหน้า/รายละเอียด แต่ใช้งานไม่ได้เต็ม |
| `quick` | ใช้ quick mode ได้ ไม่บันทึกข้อมูลระยะยาว |
| `saved` | บันทึกผลลัพธ์ไว้ใน workspace/profile ได้ |
| `read` | เปิดดูข้อมูลที่มีอยู่ได้ |
| `write` | สร้าง/แก้ไขข้อมูลได้ |
| `export` | export/download/share output ได้ |
| `admin` | ตั้งค่า app, team, access, billing หรือ workspace-level setting ได้ |
| `support` | support operator เข้าดู/ช่วยเหลือตามขอบเขตที่กำหนดได้ |

ระบบจริงควรเก็บ `access_level` พร้อม `permissions` หรือ `limits` JSON เพื่อรองรับเงื่อนไขย่อย เช่น จำนวน export, AI credit, storage, seat, support quota, workflow run หรือ app-specific limits

## 4. Admin Configuration

Admin ต้องทำสิ่งเหล่านี้ได้:

- สร้าง/แก้ไข/ปิด `Plan`
- ตั้งราคา รอบบิล currency และ note เช่น PromptPay/manual transfer
- เลือก app หรือ feature ที่ plan นั้นใช้งานได้
- ตั้ง limit ต่อ app เช่น export ต่อเดือน, AI run ต่อเดือน, storage, project count, member count
- เปิด trial หรือ temporary access พร้อม `expires_at`
- grant/revoke สิทธิ์เฉพาะ workspace
- grant/revoke สิทธิ์เฉพาะ member หรือ user
- ตั้ง explicit deny เพื่อปิดสิทธิ์บาง app แม้ plan หลักจะเปิดอยู่
- ดูประวัติการเปลี่ยนสิทธิ์ทั้งหมดจาก audit log

## 5. Access Evaluation Order

เวลาเช็คว่าผู้ใช้ใช้ app/feature ได้หรือไม่ ให้เรียงลำดับดังนี้:

1. ตรวจ auth และ workspace membership
2. ถ้าเป็น platform owner/super admin ให้ใช้สิทธิ์สูงสุด แต่ยังต้อง audit action สำคัญ
3. ตรวจ `AppAccessOverride` แบบ explicit deny ระดับ user/member/workspace
4. ตรวจ `AppAccessOverride` แบบ explicit allow ระดับ user/member/workspace
5. ตรวจ `AppAccessRule` จาก active subscription plan
6. ตรวจ default public/free rule ของ app
7. ถ้าไม่เจอ rule ที่อนุญาต ให้ deny

กติกานี้ทำให้ admin สามารถให้สิทธิ์พิเศษกับลูกค้าบางราย หรือปิดสิทธิ์บาง app ให้บางทีมได้โดยไม่ต้องสร้าง plan ใหม่ทุกครั้ง

## 6. Example Plans

| Plan | Example Access |
| --- | --- |
| Free | Public tools, preview prompt sets, quick mode only |
| Starter | Saved mode, basic export, selected construction/design tools |
| Support Monthly | Starter + support quota + selected workflow apps |
| Prompt Pack | Prompt Set Library + selected prompt categories |
| Content Workflow | Facebook Content Workflow + prompt packs + export |
| Custom Client | Admin-defined app set, temporary access, manual billing |

ชื่อ plan เป็นตัวอย่างเท่านั้น ระบบต้องให้ admin ตั้งชื่อและเงื่อนไขเองได้

## 7. MVP Scope

รอบแรกยังไม่ต้องทำ billing automation เต็มระบบ แต่ควรเตรียม data model ให้รองรับ:

- plans
- subscriptions
- apps
- app_features
- app_access_rules
- app_access_overrides
- workspace_members
- audit_logs

MVP admin UI ควรเริ่มจาก:

- plan list
- app access matrix
- user/workspace override form
- audit log view

## 8. Non-Goals

- ยังไม่ต้องทำ marketplace payment split
- ยังไม่ต้องทำ coupon engine เต็มรูปแบบ
- ยังไม่ต้องให้ user ตั้ง plan เอง
- ยังไม่ให้ agent เปลี่ยนสิทธิ์เองโดยไม่มี human confirmation

## 9. Acceptance Criteria

- Admin ตั้ง plan ได้โดยไม่ต้องแก้โค้ด
- Admin เลือกเปิด/ปิด app ต่อ plan ได้
- Admin override สิทธิ์เฉพาะ workspace/member/user ได้
- ระบบรองรับ explicit deny
- การเช็คสิทธิ์แยก app access ออกจาก workspace role ชัดเจน
- ทุก permission change ถูกบันทึก audit log
- Agent/API/write action ต้องผ่าน access check เดียวกันกับ web UI
