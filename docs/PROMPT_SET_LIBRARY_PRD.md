# Prompt Set Library - PRD

Updated: 2026-05-23
Status: planned
Parent: `docs/PRD.md`

## 1. Purpose

`Prompt Set Library` คือแอปสำหรับเก็บ แชร์ ใช้ซ้ำ และขาย `prompt` หรือ `prompt set` แบบเครื่องมือสำเร็จรูป คล้ายแนวคิดคลัง prompt/AI tools ที่ผู้ใช้เลือกชุด prompt แล้วกรอกตัวแปรเพื่อใช้งานได้ทันที

เป้าหมายคือเปลี่ยนความรู้และ workflow ของ owner ให้กลายเป็น asset ที่ใช้ซ้ำได้ เช่น prompt งานออกแบบ prompt ทำคอนเทนต์ prompt สรุปไฟล์ prompt เขียนเอกสาร และ prompt สำหรับอาชีพต่าง ๆ

## 2. Core Loop

```text
Browse prompt set
  -> Preview use case
  -> Fill variables
  -> Generate final prompt
  -> Copy / run / save
  -> Share result or save to workspace
```

## 3. Prompt Set Types

- Single prompt: prompt เดี่ยวพร้อมคำอธิบายและตัวอย่างผลลัพธ์
- Prompt set: ชุด prompt หลายขั้นตอน เช่น research -> draft -> refine -> export
- Workflow prompt pack: prompt ที่ผูกกับ app/workflow เช่น Facebook content, Plan Review, Design Brief
- Role prompt: prompt สำหรับบทบาท เช่น architect, estimator, site admin, marketer, consultant
- Template prompt: prompt ที่มี variables เช่น `{project_type}`, `{target_audience}`, `{tone}`, `{budget}`

## 4. Target Users

- Owner / creator: สร้าง prompt pack ของตัวเองเพื่อใช้ซ้ำและขาย/แจก
- Free member: ใช้ prompt ฟรีเพื่อเห็นคุณค่าของ platform
- Paid member: เข้าถึง prompt set ขั้นสูง template และ workflow เฉพาะอาชีพ
- Designer / architect: ใช้ prompt สำหรับ moodboard, render, plan review, presentation
- Business / marketing user: ใช้ prompt สำหรับ content, proposal, customer follow-up
- Support operator: ใช้ prompt set มาตรฐานเพื่อตอบคำถามหรือเตรียมเอกสารให้ลูกค้า

## 5. MVP Features

- Prompt catalog with category, profession, difficulty, free/paid tag
- Prompt set detail page
- Variable form for prompt placeholders
- Generate final prompt text
- Copy prompt
- Save favorite prompt set locally
- Version note and usage instructions
- Example output/reference

## 6. Future Features

- Creator profile and shared prompt packs
- Paid prompt pack access through membership/support tiers
- Community submission and moderation
- Prompt run history
- Prompt quality rating
- Prompt variables connected to project/client/app data
- One-click handoff to `Agent Chat`, `Design Studio`, `Facebook Content Workflow`, or app-specific workflows

## 7. Data Model

```ts
type PromptSet = {
  id: string;
  workspaceId?: string;
  ownerId: string;
  title: string;
  slug: string;
  description: string;
  category: "design" | "construction" | "business" | "content" | "life" | "agent" | "general";
  professionTags: string[];
  accessLevel: "free" | "member" | "paid" | "private";
  visibility: "public" | "workspace" | "private";
  version: string;
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
};

type PromptTemplate = {
  id: string;
  promptSetId: string;
  title: string;
  order: number;
  body: string;
  variables: PromptVariable[];
  modelHint?: string;
  outputFormat?: string;
};

type PromptVariable = {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "number" | "boolean";
  required: boolean;
  defaultValue?: string | number | boolean;
  options?: string[];
};

type PromptExample = {
  id: string;
  promptTemplateId: string;
  inputSample: Record<string, unknown>;
  outputSample: string;
};
```

Future backend tables:

- `prompt_sets`
- `prompt_templates`
- `prompt_versions`
- `prompt_examples`
- `prompt_favorites`
- `prompt_access_rules`
- `prompt_run_history`

## 8. Safety And Quality

- ห้ามเก็บ API key, password, token หรือข้อมูลลับใน prompt set
- Prompt ที่ใช้กับกฎหมาย การเงิน สุขภาพ หรือความปลอดภัย ต้องมี caveat และ human review
- ต้องเก็บ version และ owner เพื่อย้อนกลับได้
- Prompt สาธารณะต้องผ่าน moderation ก่อนเปิดให้คนอื่นใช้หรือซื้อ
- Prompt ที่สร้างภาพ/งานออกแบบต้องระบุว่าเป็น concept/reference เมื่อยังไม่ใช่เอกสารจริง

## 9. Handoff Targets

- `Design Studio`: ใช้ prompt set สำหรับ render/design workflow
- `Facebook Content Workflow`: ใช้ prompt set เป็นโครงสร้างการสร้างโพสต์
- `Agent Chat`: เรียก prompt set เป็น command/template
- `Library`: เก็บ prompt assets, examples, images, files
- `App Marketplace`: แสดง prompt pack เป็น product หรือ add-on
- `Membership`: จำกัด prompt set ตาม tier

## 10. MVP Scope

1. Static prompt set catalog
2. Prompt set detail view
3. Variable form
4. Final prompt generator
5. Copy prompt
6. Save favorite locally
7. Example output block
8. Access label: free/member/paid/private

## 11. Non-Goals For MVP

- Marketplace payment
- Public user-generated prompt submission
- Real AI execution inside prompt library
- Team permission model
- Auto moderation
- Prompt analytics

## 12. Acceptance Criteria

- User can browse at least 5 sample prompt sets
- User can open one prompt set and fill variables
- App generates final prompt from variables
- User can copy final prompt
- User can save favorite prompt set locally
- Prompt set has category, access label, version, owner, and example output
