# Design Plan Review / Architect Brain - PRD

Updated: 2026-05-23
Status: Planned design wedge app
Reference: `E:\File\Narongsakb\arch-brain-web\PRD.md`

## 1. Purpose

`Design Plan Review` คือแอปตรวจสอบ brief/แปลน/แนวคิดงานออกแบบด้วยคลังสมองสถาปนิก เพื่อช่วยสถาปนิก เจ้าของบ้าน และนักเรียนสถาปัตย์ตรวจงานเบื้องต้นได้เร็ว

แอปนี้ต่อยอดจากแนวคิด `สมองจำลองของสถาปนิก` ใน `arch-brain-web`: ใส่ brief หรือแนบแปลน แล้วระบบวิเคราะห์หลายชั้นความรู้ เช่น กฎหมายเบื้องต้น วิศวกรรมเบื้องต้น การออกแบบ วัฒนธรรมไทย ภูมิอากาศเขตร้อน และฮวงจุ้ยแบบ optional จากนั้นสรุปเป็น checklist, score, issue, action และรายงานส่งลูกค้า

## 2. Users

- Architect / Designer: ต้องการ second opinion, cross-check และ client-ready report
- Home Owner: ต้องการประเมินแบบบ้าน/ไอเดียก่อนลงทุนต่อ
- Architecture Student: ต้องการเรียนรู้ข้อดีข้อเสียของแปลนและกฎหมายพื้นฐาน
- Contractor / Estimator: ต้องการดูความเสี่ยงของแบบก่อนถอด BOQ หรือเสนอราคา

## 3. Core Loop

```text
Brief / Plan Upload
  -> AI + Architect Knowledge Review
  -> Structured Findings
  -> Client Report / Design Action Plan
  -> Save to Project
  -> Handoff to BIM / BOQ / Docs / Presentation
```

## 4. Quick Mode And Saved Mode

### Quick Mode

ใช้ได้ทันทีโดยไม่ต้องตั้งค่าซับซ้อน:

- กรอก brief สั้น ๆ
- ใส่ขนาดที่ดิน/พื้นที่/จำนวนชั้น/ห้อง/งบ
- upload รูปแปลน JPG/PNG/PDF
- กดวิเคราะห์
- ได้ผลลัพธ์แรกภายใน 60-120 วินาที
- export/copy summary ได้

### Saved Mode

เมื่อ login/save:

- บันทึกเป็น `project`
- เก็บ source file เป็น `file_asset`
- เก็บผลวิเคราะห์เป็น structured data
- เชื่อมกับ `Design Brief`, `Design Options`, `Presentation Builder`, `BOQ Data`, `BuildDocs`, `BIM Link`

## 5. Inputs

| Group | Fields |
| --- | --- |
| Basic | project name, project type, province, site width/depth, floor count, bedroom/bathroom count, budget |
| Context | orientation, road/street, adjacent context, topography, climate concern, family profile, elderly/accessibility |
| Design | style preference, priority, special requirement, material preference, cultural/fengshui option |
| Files | plan image/PDF, site photo, sketch, reference image |
| Meta | client name, tags, notes, version label |

## 6. Analysis Layers

1. Code / Zoning Check
   - ระยะร่นเบื้องต้น
   - FAR/OSR concept
   - parking/access/fire/accessibility checklist แบบเบื้องต้น

2. Architecture Design Check
   - zoning/function
   - circulation
   - room relationship
   - privacy/public-private separation
   - daylight/ventilation
   - tropical design

3. Engineering Feasibility Check
   - structural risk hint
   - span/opening concern
   - MEP routing concern
   - buildability concern

4. Thai Living / Culture Check
   - family lifestyle
   - elderly-friendly use
   - kitchen/service/utility behavior
   - Thai climate and daily use

5. Optional Feng Shui / Belief Check
   - ใช้เป็น optional advisory ไม่ใช่ข้อสรุปทางวิชาชีพ

6. Cost / BOQ Readiness Check
   - จุดที่กระทบต้นทุน
   - material/area assumption
   - readiness to estimate

## 7. Outputs

- Feasibility score
- Layer scores
- Strengths
- Risks/issues ranked by severity
- Compliance checklist
- Room/space comments
- Design action list
- Design phase recommendation
- Cost/BOQ readiness note
- Client-ready report
- Export: markdown, JSON, print/PDF-ready HTML

## 8. Data Model

```ts
type DesignPlanReview = {
  id: string;
  workspaceId: string;
  projectId?: string;
  designBriefId?: string;
  title: string;
  sourceFileIds: string[];
  input: DesignPlanReviewInput;
  result: DesignPlanReviewResult;
  status: "draft" | "reviewed" | "approved" | "archived";
  createdAt: string;
  updatedAt: string;
};

type DesignPlanReviewFinding = {
  id: string;
  reviewId: string;
  layer: "code" | "architecture" | "engineering" | "thai_living" | "fengshui" | "cost";
  severity: "info" | "low" | "medium" | "high";
  title: string;
  note: string;
  action: string;
  confidence: number;
};
```

Backend tables later:

- `design_plan_reviews`
- `design_plan_review_findings`
- `design_plan_review_exports`
- `file_assets`
- links to `projects`, `design_briefs`, `design_options`

## 9. Handoff Targets

- `Design Brief`: เก็บ requirement ที่ชัดขึ้น
- `Moodboard`: เก็บ reference/style/material
- `Design Options`: สร้าง option จาก findings
- `Presentation Builder`: ทำ report ส่งลูกค้า
- `BOQ Data`: ส่งพื้นที่/วัสดุ/ข้อสังเกตไปเตรียม estimate
- `BuildDocs`: ทำ proposal/fee/TOR/contract
- `BIM Link`: ส่ง room/space requirement ไปเป็นข้อมูลตั้งต้น

## 10. Non-Goals

- ไม่รับรองผลกฎหมายแทนผู้เชี่ยวชาญ/หน่วยงานราชการ
- ไม่แทนวิศวกรโครงสร้าง/MEP
- ไม่ทำแบบก่อสร้างอัตโนมัติในรอบแรก
- ไม่สั่งแก้ BIM/Revit โดยตรงในรอบแรก
- ไม่ให้ AI ตัดสิน approval แทนสถาปนิก

## 11. Acceptance Criteria

- ผู้ใช้สร้าง review จาก brief อย่างเดียวได้
- ผู้ใช้ upload plan image/PDF และผูกกับ review ได้
- ระบบสร้าง structured findings แยกตาม layer ได้
- ระบบแสดง severity, issue, action และ confidence
- ระบบ export summary/report ได้
- ระบบ save review เข้า project ได้
- source file และ structured result ถูกเก็บแยกแต่เชื่อมกันได้
- มีคำเตือนว่าเป็น advisory review ไม่ใช่ legal/engineering certification

## 12. MVP Scope

รอบแรกควรทำ:

1. Brief form
2. Plan upload
3. AI review mock/prototype หรือ manual parser fallback
4. Structured result UI
5. Export/copy summary
6. Save to project/local-first
7. Link to Design Studio/Library

ยังไม่ทำ:

- full OCR/CAD parsing
- automatic dimension extraction
- government code certification
- Revit/BIM direct sync
- paid review workflow
