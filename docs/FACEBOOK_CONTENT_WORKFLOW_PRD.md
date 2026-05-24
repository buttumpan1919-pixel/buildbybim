# Facebook Content Workflow - PRD

Updated: 2026-05-23
Status: planned
Parent: `docs/PRD.md`

## 1. Purpose

`Facebook Content Workflow` คือแอป auto workflow สำหรับช่วยสร้างคอนเทนต์โพสต์ Facebook จากหัวข้อ ไอเดีย ไฟล์ รูปภาพ โครงการ หรือแอปที่ต้องการโปรโมต

เป้าหมายคือช่วย owner และผู้ใช้ทำ content ได้เร็วขึ้น มีโครงสร้างมากขึ้น และต่อยอดเป็น content calendar, lead funnel, app landing page, และ membership funnel ได้

## 2. Core Loop

```text
Idea / source / app
  -> Content angle
  -> Draft post
  -> Visual prompt / asset checklist
  -> Human review
  -> Export / copy / schedule note
  -> Save performance notes
```

## 3. Target Users

- Owner / creator: ทำโพสต์ให้แฟนเพจ BuildbyBIM และโปรโมตแอปใน platform
- Small business owner: ทำโพสต์ขายสินค้า/บริการ
- Freelancer / consultant: ทำโพสต์ให้ลูกค้าเข้าใจบริการ
- Designer / contractor: ทำโพสต์จากงานจริง progress, before/after, case study, knowledge
- Admin / marketing staff: เตรียม post draft, schedule, caption, hashtag และ checklist ก่อนส่งอนุมัติ

## 4. Modes

### Quick Mode

- ใส่หัวข้อหรือ pain point
- เลือกเป้าหมายโพสต์ เช่น educate, sell, announce, case study, before/after
- ได้ draft 1-3 แบบพร้อม hook, caption, CTA, hashtag และ image prompt
- copy/export ได้ทันที

### Saved Mode

- เก็บ campaign, audience, brand voice, post draft, approval status และ performance note
- ผูกกับ app, landing page, resource, project หรือ profession pack ได้
- ใช้ทำ content calendar และ reuse idea ได้

## 5. Inputs

- Topic / pain point
- Target audience
- Goal: awareness, education, lead, conversion, support, retention
- Source: text, file, image, app, project, article, template, previous post
- Tone: professional, friendly, technical, simple, sales, story
- Platform: Facebook page first; other platforms later
- CTA: use free tool, read resource, message page, subscribe, book consult
- Optional brand voice and banned words

## 6. Outputs

- Post hook
- Caption draft
- Short version / long version
- Hashtags
- CTA
- Image idea or image generation prompt
- Carousel outline
- Content category/tag
- Suggested publish time note
- Review checklist
- Export/copy format

## 7. Data Model

```ts
type ContentWorkflow = {
  id: string;
  workspaceId: string;
  ownerId: string;
  title: string;
  campaignId?: string;
  sourceType: "manual" | "file" | "image" | "app" | "project" | "article";
  sourceRefs: string[];
  audience: string;
  goal: string;
  status: "draft" | "reviewing" | "approved" | "exported" | "archived";
  createdAt: string;
  updatedAt: string;
};

type ContentPostDraft = {
  id: string;
  workflowId: string;
  platform: "facebook";
  hook: string;
  caption: string;
  cta: string;
  hashtags: string[];
  imagePrompt?: string;
  approvalStatus: "draft" | "approved" | "rejected";
  version: number;
};

type ContentPerformanceNote = {
  id: string;
  postDraftId: string;
  publishedUrl?: string;
  publishedAt?: string;
  reach?: number;
  engagement?: number;
  note?: string;
};
```

Future backend tables:

- `content_workflows`
- `content_post_drafts`
- `content_approvals`
- `content_performance_notes`
- `content_campaigns`
- `file_assets`

## 8. Safety And Approval

- MVP ต้องเป็น draft-first ไม่ auto publish
- publish หรือ schedule จริงต้องผ่าน human approval
- ห้ามสร้างคำกล่าวอ้างเกินจริง รีวิวปลอม หรือข้อมูลลูกค้าที่ไม่ได้รับอนุญาต
- ต้องเก็บ source/reference เพื่อย้อนดูที่มาของเนื้อหา
- ถ้าใช้ AI image prompt ต้องบอกว่าเป็น concept/reference ไม่ใช่ภาพงานจริง เว้นแต่เป็นรูปจาก project จริง

## 9. Handoff Targets

- `Public Site`: link ไป app/resource/pricing
- `Tools Apps`: ใช้เป็น content lead magnet
- `App Marketplace`: ทำโพสต์โปรโมตแอปแต่ละตัว
- `Agent Control`: ใช้ agent ช่วย draft, summarize, repurpose
- `Library`: เก็บภาพ prompt template และ source files

## 10. MVP Scope

1. Topic input
2. Audience and goal selector
3. Generate 3 draft post options
4. Edit/approve one draft
5. Copy/export caption
6. Generate image prompt or carousel outline
7. Save draft locally
8. Link draft to app/resource/project manually

## 11. Non-Goals For MVP

- Auto publish to Facebook
- Facebook login/OAuth
- Paid ads manager integration
- Full content calendar
- Performance analytics automation
- Multi-platform scheduler

## 12. Acceptance Criteria

- User can create a Facebook post draft from a topic in under 2 minutes
- Draft includes hook, caption, CTA, hashtags, and image idea
- User can edit and mark a draft as approved
- User can copy/export approved draft
- Saved draft reloads locally
- No production publish happens without explicit future integration and approval flow
