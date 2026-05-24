# Build By BIM Platform - Development Plan

Updated: 2026-05-22
Status: Working roadmap

## 1. Strategy

ตั้งต้นด้วยแอปเดี่ยวที่ขายง่ายและแก้ปัญหาชัดเจนก่อน จากนั้นค่อยรวมเป็น platform:

```text
Wedge app
  -> App hub
    -> Membership/support
      -> Agent API + LINE
        -> BIM-ready workflow
          -> Cross-profession collaboration
            -> IoT-ready integration
```

ข้อความตลาดช่วงแรกต้องเป็นภาษาที่ผู้ใช้เข้าใจ เช่น ทำแบบ/brief/presentation เร็วขึ้น ทำเอกสารเร็วขึ้น ลดงานซ้ำ จัด defect ไม่หลุด เก็บใบเสร็จเป็นระบบ ไม่ขายคำว่า `BIM and IoT Integration Platform` เป็น headline แรก

หลักการออกแบบแอปคือ `Instant Utility + Future Memory`: ผู้ใช้ต้องได้ประโยชน์ทันทีแม้ยังไม่เข้าใจ platform และเมื่อเขาเลือก save ข้อมูลนั้นต้องกลายเป็นฐานข้อมูลที่ใช้ซ้ำได้ในอนาคต

ข้อมูลคือสินทรัพย์หลักของระบบ ทุกเฟสต้องรักษา data strategy ใน `docs/DATA_STRATEGY.md`: เก็บข้อมูลเป็นโครงสร้าง, มี source file เมื่อจำเป็น, export/backup ได้, แยก workspace ชัดเจน, และ audit action สำคัญได้

## 2. Recommended Stack

### Frontend

- ใช้ Vite + React + TypeScript เดิมต่อไป
- แยก public website ออกจาก workspace dashboard
- Deploy frontend บน Netlify/Vercel/Hostinger static ได้

### Backend

- Supabase/Postgres เป็น backend หลัก
- Supabase Auth สำหรับ login/member
- Row Level Security สำหรับ workspace permission
- Supabase Storage หรือ S3/R2 สำหรับไฟล์ รูป ใบเสร็จ PDF และ BIM files
- Edge Functions หรือ serverless functions สำหรับ LINE webhook, payment webhook, AI/OCR, Agent API

### AI / Agent

- Agent API อยู่หลัง backend
- Web, LINE, และ internal CLI เรียก API เดียวกัน แต่ใช้ role/scope ต่างกัน
- ใช้ tool allowlist และ audit log
- เริ่มจาก read/draft tools ก่อน write tools

### Payment

- รอบแรกใช้ manual transfer/PromptPay + admin approval
- ต่อมาเชื่อม Opn/Omise สำหรับตลาดไทย หรือ Stripe ถ้ารองรับเงื่อนไขบัญชีและลูกค้า

## 3. Phase Plan

### Phase 0: Stabilize Foundation

Goal: ทำให้ repo พร้อมพัฒนาหลาย agent และลด conflict

Tasks:

- เลือก wedge app แรก
- park `debtPlanner` ใน UI/code ให้ชัด
- ลดความเสี่ยงจาก `src/App.tsx` ที่ใหญ่เกินไป
- เพิ่ม test strategy ขั้นต่ำสำหรับ storage/import/calculation
- ทำ public route plan ก่อนเขียนหน้าเว็บจริง
- ระบุ data contract ของ wedge app แรกตาม `docs/DATA_STRATEGY.md`

Exit criteria:

- `npm run build` ผ่าน
- docs, app manifest, storage keys ตรงกัน
- data contract ของแอปแรกชัดเจน
- เลือกแอปแรกที่จะใช้ขาย/ทำ content แล้ว

### Phase 1: First Wedge App

Recommended first options:

1. `BuildDocs`: ใบเสนอราคา สัญญา ใบวางบิล invoice receipt
2. `BOQ Data`: ค้นราคา จัด BOQ ผูกงบกับ task
3. `Defect`: บันทึก defect รูป รายงานส่งมอบ
4. `Design Studio / Design Brief`: รับ brief สร้าง prompt/moodboard/concept/presentation draft
5. `Plan Review / Architect Brain`: ตรวจ brief/แปลนด้วยคลังสมองสถาปนิก สรุป finding, score, action และรายงานส่งลูกค้า
6. `Tools Apps`: แอปเครื่องมือเล็ก เช่น life planner, checklist, calculator, generator หรือ assistant เฉพาะเรื่อง
7. `Facebook Content Workflow`: auto workflow สำหรับสร้าง draft โพสต์ Facebook จาก pain/app/project/resource เพื่อทำการตลาด
8. `Prompt Set Library`: คลัง prompt/prompt set สำเร็จรูปสำหรับแจก ขาย หรือใช้ใน workflow ต่าง ๆ

Recommended choice: เริ่มจาก `BuildDocs + BOQ Data` สำหรับสายเอกสาร/ราคา และเพิ่ม `Design Brief + Plan Review + Design Studio` เป็น design wedge เพราะตรงกับความเชี่ยวชาญสถาปนิกของ owner และมี pain ชัดสำหรับทำ content/ขายแบบแอปเดี่ยว

Tools Apps ใช้เป็น free lead magnet หรือ paid mini app ได้ แต่ต้องไม่ทำให้ first wedge app หลักเสียโฟกัส กติกาคือทำให้เล็ก ใช้ได้จริงทันที และถ้าบันทึกข้อมูลต้องมี data contract ชัดเจน

Auto Workflow Apps ใช้ช่วย owner ผลิต content และช่วยผู้ใช้ทำงานซ้ำได้เร็วขึ้น รอบแรกให้เป็น draft/review/export ก่อน ยังไม่เชื่อม auto publish หรือส่งข้อมูลออกนอกระบบโดยไม่มี confirmation

Prompt Set Library เป็น asset ชั้นกลางของ AI workflow: เริ่มจาก prompt ฟรี 5-10 ชุดเพื่อดึงผู้ใช้ แล้วค่อยแยก member/paid prompt pack เมื่อมี feedback จริง

Tasks:

- ทำ landing page เฉพาะแอป
- ทำ quick mode ที่ไม่ต้องสมัครก็ได้ผลลัพธ์แรกเร็ว
- ทำ saved mode ที่เก็บข้อมูลเข้า workspace เมื่อผู้ใช้สมัคร/login
- ทำ demo flow ที่ผู้ใช้เข้าใจภายใน 1-2 นาที
- เพิ่ม export/print/share แบบใช้งานจริง
- เพิ่ม pricing placeholder/manual payment
- ทำ content Facebook 5-10 โพสต์จาก pain จริง

Exit criteria:

- คนทั่วไปเข้าเว็บแล้วเข้าใจว่าแอปช่วยอะไร
- ผู้ใช้ทดลองสร้างเอกสาร/BOQ ได้โดยไม่ต้องเข้าใจ BIM
- ผู้ใช้สายออกแบบสามารถสร้าง brief, prompt, moodboard หรือ concept draft ได้เร็ว
- ผู้ใช้ได้ผลลัพธ์แรกภายใน 2-3 นาที
- ข้อมูลที่ save กลายเป็น client/project/document/BOQ/task ที่ใช้ต่อได้
- มี call-to-action สมัคร/ติดต่อ/อัปเกรด

### Phase 2: Backend Foundation

Goal: เปลี่ยนจาก local-first เป็น member-ready โดยไม่ทำลาย flow เดิม

Tasks:

- เพิ่ม Supabase project
- สร้าง schema รอบแรกจาก `docs/PLATFORM_ERD.md`
- ทำ `users`, `workspaces`, `workspace_members`
- ทำ migration path จาก localStorage ไป backend
- ทำ RLS policy พื้นฐาน
- ทำ file storage สำหรับเอกสารและรูป

Exit criteria:

- user login ได้
- workspace แยกข้อมูลกันได้
- app เดิมยังใช้ได้
- ข้อมูลสำคัญเริ่ม sync backend ได้

### Phase 3: Membership And Support

Goal: เริ่มสร้างรายได้และควบคุมสิทธิ์ app

Tasks:

- ทำ `plans`, `subscriptions`, `app_access_rules`
- ทำ admin page สำหรับตั้ง plan
- ทำ support request และ quota
- เริ่ม manual transfer/PromptPay approval
- เพิ่ม upgrade gates ในแอป

Exit criteria:

- owner ตั้ง plan ได้
- free/pro/support tier ใช้งานต่างกันได้
- support request ถูกนับ quota ได้

### Phase 4: Agent API And LINE Intake

Goal: ให้ AI ช่วยจัดการข้อมูลได้จริงแต่ปลอดภัย

Tasks:

- ทำ `agent_runs`, `agent_messages`, `agent_tool_calls`, `agent_actions`, `audit_logs`
- ทำ tool registry ชุดแรก
- ทำ web agent แบบ read/draft
- ทำ LINE webhook
- ทำ receipt image intake: รับรูป, OCR, draft, confirm, save

Exit criteria:

- ผู้ใช้ส่งใบเสร็จใน LINE แล้วได้ draft กลับมา
- ผู้ใช้ confirm แล้วข้อมูลเข้า expense/cashflow/document ได้
- ทุก action มี audit log
- ไม่มี secret key อยู่ใน browser

### Phase 5: BIM-Ready Layer

Goal: เชื่อมงานเอกสาร/BOQ/task/defect กับข้อมูล BIM โดยไม่ต้องทำ 3D viewer ก่อน

Tasks:

- ทำ `bim_models`, `bim_model_versions`, `bim_elements`, `spaces`, `zones`
- import Revit schedule/CSV ก่อน
- map design brief/space requirement ไป room/space/zone
- map BIM element/space/zone กับ BOQ item, task, defect
- ให้ Docs อ้าง `model_version_id`
- ให้ Agent ค้นและตอบจาก BIM metadata ได้

Exit criteria:

- BOQ/task/defect อ้าง BIM element หรือ space ได้
- design brief ต่อไปเป็น room/space requirement ได้
- เอกสารรู้ว่าอ้าง model version ไหน
- ผู้ใช้ยังไม่ต้องเข้าใจ BIM ลึกก็ใช้งานได้

### Phase 6: Cross-Profession Collaboration

Goal: ใช้งานร่วมกับอาชีพอื่นผ่าน workflow จริง

Tasks:

- ทำ collaboration hub
- เริ่มจาก read-only share/export/request
- ทำ role/access สำหรับ reviewer, vendor, collaborator
- ทำ request/response workflow เช่น quote request หรือ document review
- เพิ่ม profession packs

Exit criteria:

- เชิญคนนอกดูเอกสารหรือ review ได้แบบจำกัดสิทธิ์
- vendor/reviewer ทำงานผ่าน flow ที่กำหนดได้
- ยังไม่เปิดเป็น social network กว้าง

### Phase 7: IoT-Ready Integration

Goal: ต่อข้อมูล sensor/device เข้ากับ project, space, BIM element และ maintenance workflow

Tasks:

- ทำ `devices`, `telemetry_points`, `telemetry_readings`
- ทำ `alert_rules`, `alerts`, `maintenance_tasks`
- เริ่มจาก manual/import telemetry หรือ webhook ง่าย ๆ
- ให้ alert เปิด task/defect/maintenance draft
- ทำ dashboard เฉพาะ project/space/device

Exit criteria:

- device ผูกกับ project/space/BIM element ได้
- sensor/alert เปิด maintenance workflow ได้
- Agent สรุปสถานะพื้นที่หรืออุปกรณ์ได้

## 4. First 30-Day Plan

### Week 1

- เลือก wedge app แรก
- เขียน PRD ย่อยของแอปนั้น
- ทำ landing copy + feature list + pricing hypothesis
- park/ซ่อน module ที่ไม่ใช่ scope เช่น `debtPlanner`
- ถ้าเลือกสาย design ให้กำหนด design flow แรก: brief, prompt, moodboard, option หรือ presentation

### Week 2

- ปรับ UI ของ wedge app ให้คนทั่วไปลองใช้ได้
- เพิ่ม export/print/share flow
- เขียน content Facebook ชุดแรก
- เตรียม feedback form/contact channel

### Week 3

- ออกแบบ backend schema รอบแรกจาก ERD
- ตัดสินใจ Supabase project และ auth strategy
- ทำ workspace/member proof of concept
- ทำ file storage proof of concept

### Week 4

- ทำ manual payment/support flow
- เริ่ม Agent API PRD และ tool registry
- ทำ LINE receipt intake prototype เฉพาะ draft ยังไม่บันทึกอัตโนมัติ
- สรุป feedback และเลือก feature ที่ควรเก็บเงินรอบแรก

## 5. Key Decisions To Make Next

1. Wedge app แรกคือ `BuildDocs`, `BOQ Data`, `Defect`, `Design Brief / Design Studio`, `Plan Review / Architect Brain`, `Tools Apps` แบบ mini app, `Facebook Content Workflow`, หรือ `Prompt Set Library`
2. Domain/project name รอบแรกใช้ `Buildbybim.space`
3. Backend รอบแรกเริ่ม Supabase ตอนนี้หรือหลังปรับ wedge app
4. Payment รอบแรกเป็น manual transfer/PromptPay หรือเชื่อม provider ทันที
5. LINE agent รอบแรกทำ receipt intake, document assistant, หรือ support bot

## 6. Risk Controls

- อย่าขาย platform ใหญ่ก่อนผู้ใช้เห็นประโยชน์จากแอปเดี่ยว
- อย่าเพิ่ม backend หลายตัวพร้อมกัน
- อย่าให้ agent write ข้อมูลโดยไม่มี confirmation
- อย่าเริ่ม IoT/3D viewer ก่อน BIM metadata และ workflow พร้อม
- อย่าเปิด collaboration กว้างก่อน role/access model พร้อม
