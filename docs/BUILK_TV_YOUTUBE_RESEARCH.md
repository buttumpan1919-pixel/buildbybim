# BUILK TV YouTube Research For Buildbybim ERP

Updated: 2026-05-24
Source channel: https://www.youtube.com/@BuilkTV
Channel id: `UCDl7LP2G4aKFn56J3y4hZmw`
Status: Product research note for ERP direction

## 1. What The Channel Is Really Selling

`BUILK ONE` is not positioned as a simple tutorial channel. The channel is a top-of-funnel education and proof channel for a construction/business software suite:

- `Pojjaman ERP`: ERP for project-based businesses such as construction, real estate, event, and technology.
- `JUBILI CRM`: CRM for B2B sales teams.
- `BUILK ConTech`: construction technology for time, cost, quality, and project collaboration.
- `BUILK360` / `BUILK iNSITE`: site visibility, progress, defect, and real-time project operations.
- `IX` / academy / community content: trust building, business education, and customer success storytelling.

The repeated message is: a growing contractor or developer does not fail only because there is no work; it fails when it does not know the real numbers, real status, and real responsibility in time.

## 2. Content Themes Observed

Recent public channel metadata and playlists show these core themes:

| Theme | Evidence from channel titles/playlists | Product meaning for us |
|---|---|---|
| Project-based ERP | `Pojjaman ERP`, project accounting, reduce cost, increase profit | ERP must start from project cost and accounting, not generic business tables |
| Real-time numbers | "ไม่รู้ตัวเลขจริง...ให้ทันเวลา", dashboard/report messaging | Buildbybim needs project health, budget vs actual, debtor/creditor, cashflow status |
| Site operations | `BUILK iNSITE`, real-time construction management | Merge tasks, progress, checklist, defect, photo evidence into SiteOps flow |
| Reality capture | `BUILK360`, 360 site view, remote inspection | Add evidence asset layer before building any heavy 360 viewer |
| B2B CRM | `JUBILI CRM`, lead/deal/follow-up, quote, sales performance | `clientOps` should become B2B CRM, not only customer list |
| Community/academy | `IX`, interviews, user stories, construction community | Content and onboarding should be treated as a product surface |

## 3. Main Insight For Buildbybim.space

The ERP path should be:

```text
Project
  -> Cost Code / Budget Line
  -> Supplier / Team / Client
  -> PR / RFQ / PO
  -> Cost Entry / Invoice / Receipt / Payment
  -> Site Task / Defect / Evidence
  -> Project Dashboard / Report / AI Insight
```

This matches the current Buildbybim direction in `docs/BUILK_PARITY_PLAN.md`, but the YouTube channel adds a clearer market message:

> Do not sell "ERP" first. Sell "see real project numbers and site status before it is too late".

## 4. Product Direction To Apply

### 4.1 Prioritize the cost-control spine

Current repo already has `projects`, `costCodes`, `suppliers`, `procurement`, `boqData`, `builddocs`, and `cashflow` foundations. The next ERP-critical step is to make money flow through the same spine:

- every PR/RFQ/PO item links to `projectId` + `costCodeId`
- every cost/cashflow entry links to `projectId` + `costCodeId` + optional `supplierId`
- every invoice/receipt links to `projectId` + billing milestone
- dashboard computes budget, committed, actual, paid, unpaid, and margin

### 4.2 Turn `clientOps` into B2B CRM

Use the JUBILI pattern:

- lead
- company/contact
- deal/opportunity
- activity/follow-up
- quote/request
- deal stage
- sales performance

This should connect to `BuildDocs` so a won deal can create a quote, project, and first contract draft.

### 4.3 Create SiteOps as a connected workspace, not separate tools

`BUILK iNSITE` points to one combined site workflow:

- work plan
- daily progress
- checklist
- defect
- photo evidence
- responsible person
- dashboard/report

Buildbybim already has `defectTracker`, `employees`, and project modules. The next design should connect them instead of adding another isolated panel.

### 4.4 Add an evidence layer before 360 technology

Do not build a full 360 viewer first. Build a generic `EvidenceAsset` model:

- `projectId`
- `taskId` / `defectId` / `costEntryId`
- file type: photo, video, 360 link, PDF, receipt
- capture date
- location/space/zone
- note
- source

Later, this can support BUILK360-like remote inspection, BIM linking, and AI review.

### 4.5 Use AI where the channel reveals manual pain

AI should reduce entry work and explain risk:

- receipt/photo -> draft cost entry
- supplier quote in LINE/chat -> RFQ response
- project description -> suggested cost codes
- late/over-budget project -> variance explanation
- site photos -> draft daily report / defect note
- owner asks: "โครงการไหนเสี่ยงขาดทุน" -> natural language report

## 5. Suggested Roadmap Adjustment

| Priority | Build next | Why |
|---|---|---|
| P0 | PR/RFQ/PO detail workflow | This completes the procurement spine seen in construction ERP content |
| P0 | Project cost recording + cashflow linkage | Turns documents and cost codes into real ERP numbers |
| P1 | Project dashboard and 5 reports | Matches the "real numbers in time" pain from BUILK/Pojjaman messaging |
| P1 | `clientOps` CRM v0.1 | Converts JUBILI lessons into lead/deal/follow-up flow |
| P2 | SiteOps integration | Connects task, defect, checklist, staff, and photo evidence |
| P2 | Evidence asset layer | Prepares for 360/reality capture and BIM-ready workflows |
| P3 | AI/LINE intake | Differentiates Buildbybim from plain Builk parity |

## 6. Positioning For Buildbybim

Avoid positioning as a Builk clone. A stronger position:

```text
Buildbybim.space = construction ERP for small teams that starts simple,
keeps project numbers visible, connects site evidence, and adds AI/BIM-ready workflows.
```

Differentiators:

- simpler first-use flow for small contractors, architects, and freelancers
- design/BOQ/document workflow in the same platform
- AI intake from chat, receipt, site photo, and project note
- BIM-ready data model without forcing users to understand BIM on day one
- content-to-tool loop: every education post can link to a small tool/template

## 7. Content Ideas We Can Reuse Cleanly

Do not copy scripts, visuals, or brand assets. Reuse the pain-point pattern:

- "ธุรกิจไม่ได้พังเพราะไม่มีงาน แต่พังเพราะไม่รู้ตัวเลขทันเวลา" -> free `Project Health Check`
- "ลด Manual เพื่อเห็น Report ทันที" -> demo `Project Dashboard`
- "ทีมขายไม่พลาด follow-up" -> `ClientOps CRM`
- "ไซต์งานเห็นข้อมูลเดียวกัน" -> `SiteOps Daily Report`
- "ภาพถ่ายเยอะแต่ตรวจย้อนยาก" -> `Evidence Timeline`

## 8. Source Links

- YouTube channel: https://www.youtube.com/@BuilkTV
- YouTube RSS: https://www.youtube.com/feeds/videos.xml?channel_id=UCDl7LP2G4aKFn56J3y4hZmw
- BUILK cost-control site: https://www.builk.com/en/
- BUILK ONE GROUP: https://www.builk.one/th/
- BUILK ONE investment/product overview: https://www.builk.one/scg-krungsri-finnovate-and-bch-ventures-jointly-invest-series-b-in-builk-one-group/
