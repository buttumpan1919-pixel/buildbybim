# Site Report 360 Coordination PRD

Updated: 2026-05-24
Status: Product PRD for the next Defect Site Report slice
Owner: Codex
Primary route: `/defect?tab=site-report&version=0.1`

## 1. Purpose

Turn the current Defect `Site Report` tab into a site coordination workflow that can handle plan pins, 360/site evidence, comments, tasks, time comparison, file tracking, and report output.

This PRD is based on a clean-room study of:

- Video: https://www.youtube.com/watch?v=Dnvhl98t-Cs
- Product page: https://www.builk.com/builk360/
- Manual: https://www.builk.com/builk360/manual/
- Internal analysis: `docs/BUILK360_SITE_REPORT_ANALYSIS.md`

Use these references for workflow behavior only. Do not copy BUILK360 UI, branding, screenshots, icons, report templates, or proprietary wording.

## 2. Problem

The current Site Report can list events and evidence, but the construction workflow still misses the spatial source of truth:

- no floor plan or drawing pin board
- location pins are derived from evidence metadata, not placed on a plan
- time compare is global, not scoped to one pin across dates
- comments cannot become tasks yet
- files are visible in evidence rows but not organized as a File Center
- report output has no template selection or monthly/weekly settings

Without a plan/pin layer, site photos and 360 links become a flat file list instead of a coordination record.

## 3. Goals

- Give each site issue/evidence item a clear location on a floor plan.
- Let users compare the same pin across capture dates.
- Keep all files in the shared Evidence Asset layer.
- Convert report events/comments into trackable tasks.
- Produce useful owner/consultant/weekly reports without manual rebuilding.
- Stay local-first for MVP and keep Supabase migration paths clear.

## 4. Non-Goals

- Build a full 360 panorama renderer in this slice.
- Copy BUILK360 visual UI, brand, or report layout.
- Replace the existing Defect Tracker or Evidence app.
- Add paid SaaS collaboration, realtime multiplayer, or mobile camera upload in the first slice.
- Store large binary files in localStorage for production.

## 5. Current Baseline

Already implemented:

- `Site Report` tab in Defect Tracker.
- report events from defects, photos, milestones, and EvidenceAsset records.
- filters for all / needs reply / answered / evidence / milestone.
- copy report text and browser print/PDF.
- basic time compare using before/current defect photos.
- project-linked `site_360` and `site_file` EvidenceAssets.
- `site-floor`, `site-room`, `site-zone`, `site-viewpoint` tags.
- local Location pins derived from those tags.
- pin selection scopes report events and evidence list.

Current source modules:

- `src/App.tsx` for `DefectTrackerPanel` UI.
- `src/workspace/apps/defects/defectService.ts` for Site Report helpers.
- `src/evidence.ts` for EvidenceAsset storage and links.
- `src/storage.ts` for legacy workspace defect records.

## 6. Users

- Project owner: reviews progress and issues by location.
- Site engineer / project manager: creates pins, comments, evidence, and tasks.
- Contractor / subcontractor: receives tasks and replies with evidence.
- Architect / consultant: reviews defects and comments with exact site context.
- Back office: exports reports and tracks files for meetings or handover.

## 7. Core Concepts

### 7.1 Plan

A plan is a drawing or image used as the spatial base for site coordination.

Fields:

- `id`
- `projectId`
- `name`
- `planType`: `floor_plan | elevation | section | site_plan | other`
- `floor`
- `revision`
- `imageAssetId`
- `createdAt`
- `updatedAt`

### 7.2 Plan Pin

A plan pin is a stable numbered point on a plan.

Fields:

- `id`
- `projectId`
- `planId`
- `pinNo`
- `label`
- `floor`
- `room`
- `zone`
- `viewpoint`
- `x`
- `y`
- `yaw`
- `pitch`
- `linkedLocationPinId`
- `status`: `open | watching | done | archived`
- `createdAt`
- `updatedAt`

### 7.3 Capture Set

A capture set groups evidence captured on the same site round.

Fields:

- `id`
- `projectId`
- `planId`
- `name`
- `capturedAt`
- `weekLabel`
- `folderLabel`
- `cameraDirectionNote`
- `createdBy`
- `createdAt`

### 7.4 Pin Evidence

Evidence stays in `EvidenceAsset`. Pin linkage should be represented with tags and EvidenceLink first, then promoted to a relational mapper later.

Reserved tags:

- `site-plan:{planId}`
- `site-pin:{pinNo}`
- `site-capture:{captureSetId}`
- `site-floor:{floor}`
- `site-room:{room}`
- `site-zone:{zone}`
- `site-viewpoint:{viewpoint}`

### 7.5 Site Comment

A site comment is a coordination item tied to a pin, evidence, defect, or report event.

Fields:

- `id`
- `projectId`
- `pinId`
- `sourceEventId`
- `title`
- `body`
- `status`: `open | replied | resolved | rejected`
- `tag`: `question | defect | progress | safety | quality | handover | other`
- `assignee`
- `mentions`
- `attachmentAssetIds`
- `viewTarget`: optional `{ yaw, pitch, zoom }`
- `createdAt`
- `updatedAt`

### 7.6 Site Task

A site task is created from a comment or event.

Fields:

- `id`
- `projectId`
- `pinId`
- `sourceCommentId`
- `title`
- `assignee`
- `dueDate`
- `progressPct`
- `status`: `todo | in_progress | done | blocked | cancelled`
- `attachmentAssetIds`
- `createdAt`
- `updatedAt`

## 8. MVP Workflow

### 8.1 Plan Pin Board

1. User opens Site Report.
2. User adds/selects a plan image.
3. User creates numbered pins on the plan.
4. User binds an existing Location pin to a numbered Plan Pin.
5. Selecting a pin scopes report events and evidence list.

Acceptance:

- Pin numbers are stable and visible.
- Selecting a plan pin updates the existing Site Report scope.
- Existing metadata-only Location pins still work when no plan exists.

### 8.2 Evidence Capture

1. User adds a 360 link, site photo, PDF, video, or file.
2. User chooses plan, pin number, capture date, floor, room, zone, and viewpoint.
3. EvidenceAsset is created with reserved tags and a project EvidenceLink.
4. The pin count, evidence list, and report events update immediately.

Acceptance:

- Evidence can be found by project, plan, pin number, and capture date.
- Adding evidence does not duplicate storage outside EvidenceAsset.
- Missing plan/pin should be allowed for quick intake, but highlighted as incomplete.

### 8.3 Same-Pin Time Compare

1. User selects one plan pin.
2. User chooses reference and current capture dates.
3. UI shows evidence from the same pin for both dates.
4. If only one side exists, show a clear empty state.

Acceptance:

- Compare never mixes evidence from different pins.
- The selected pin remains active while changing dates.
- Future 360 yaw/pitch can be added without changing the user flow.

### 8.4 Comment To Task

1. User creates a comment on a pin/report event.
2. User assigns status/tag/assignee and optional attachments.
3. User clicks `Create task`.
4. A site task is created and linked back to the comment/pin.

Acceptance:

- Task keeps source comment and pin context.
- Task can be filtered by assignee/status/due date.
- Done task can close or annotate the source comment.

### 8.5 File Center

1. User opens File Center from Site Report.
2. Files are grouped by source: plan pin, comment, task, report, or unlinked.
3. User filters by file type/status/tracking flag.

Acceptance:

- File Center reads from EvidenceAsset.
- It does not create a second file model.
- Each row shows source location, uploader/date when available, and status.

### 8.6 Report Generator

1. User selects report template: owner meeting, weekly progress, defect closeout, consultant response log.
2. User selects date range, project, plan/floor, status, and tag filters.
3. Report preview groups items by pin/location.
4. User prints/PDFs or copies report text.

Acceptance:

- Reports can be generated from existing events/comments/tasks/evidence.
- Output includes project, date range, summary counts, location groups, and evidence references.
- Deep links or QR placeholders remain available for future viewer links.

## 9. UI Surface

Use the existing Defect Site Report page and add sections progressively:

- `Location pins` becomes `Plan pins` when a plan exists.
- Add compact plan toolbar: plan selector, add pin, bind location, compare dates.
- Keep summary tiles and report event filters.
- Add right-side inspector for selected pin.
- Add tabs or segmented control inside Site Report: `Report`, `Plan`, `Compare`, `Comments`, `Tasks`, `Files`.

Do not make a marketing landing page. This is a working tool screen.

## 10. Data And Storage

MVP can be local-first:

- `site-report.plans.v1`
- `site-report.pins.v1`
- `site-report.capture-sets.v1`
- `site-report.comments.v1`
- `site-report.tasks.v1`
- existing `evidence.assets.v1`

Use storage adapter helpers and service modules instead of direct `localStorage`.

Preferred module split:

- `src/workspace/apps/defects/siteReportService.ts`
- tests in `src/workspace/apps/defects/siteReportService.test.ts`
- UI may remain in `App.tsx` initially, but complex helpers should move out of `App.tsx`.

## 11. Supabase Direction

Future relational tables:

- `site_report_plans`
- `site_report_pins`
- `site_report_capture_sets`
- `site_report_comments`
- `site_report_tasks`
- `evidence_assets`
- `evidence_links`

Supabase Storage should store plan images, photos, PDFs, videos, and 360 files. Local data URLs are acceptable only for MVP demos and tests.

## 12. Permission Rules

Reuse Project Access:

- view plan/report: `project.read` or `report.read`
- create/edit pin/comment/task/evidence: `project.write` or `evidence.write`
- export report/file list: `document.export` or `report.export`
- archive/delete: `project.admin`

External/vendor users should only see projects and pins allowed by their project grants.

## 13. Acceptance Criteria

MVP is accepted when:

- User can create a plan and numbered pins.
- User can bind existing Location pins to Plan Pins.
- User can add evidence with plan/pin/capture date metadata.
- Selecting a pin scopes report events and evidence.
- Same-pin time compare uses only evidence from that pin.
- User can create a comment and convert it into a task.
- File Center lists EvidenceAsset rows by source pin/comment/task.
- Report generator can produce at least weekly progress and defect closeout views.
- `npm test -- --run` passes.
- `npm run build` passes.
- Browser smoke covers `/defect?tab=site-report&version=0.1` and `/roadmap`.

## 14. Phased Delivery

### Phase 1: Plan Pin Board

- Add plan image metadata.
- Add numbered pin list and basic x/y placement.
- Bind existing Location pins to numbered pins.
- Keep current report/evidence filtering.

### Phase 2: Capture Sets And Same-Pin Compare

- Add capture date and capture set metadata.
- Scope time compare by pin and date pair.
- Add incomplete metadata warnings.

### Phase 3: Comments And Tasks

- Add site comments with status/tag/assignee.
- Add comment replies and attachments.
- Add comment-to-task conversion.

### Phase 4: File Center And Reports

- Add File Center grouped by source.
- Add weekly progress and defect closeout report templates.
- Add export/print polish.

### Phase 5: Production Storage

- Add Supabase relational mapper.
- Move binaries to Supabase Storage.
- Add project access enforcement for report/file export.
