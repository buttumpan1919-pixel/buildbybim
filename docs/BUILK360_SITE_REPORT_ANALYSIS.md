# BUILK360 Site Report Analysis

Updated: 2026-05-24
Sources:
- Video: https://www.youtube.com/watch?v=Dnvhl98t-Cs
- Product page: https://www.builk.com/builk360/
- Manual: https://www.builk.com/builk360/manual/
PRD handoff: `docs/SITE_REPORT_360_PRD.md`
Video title: การตรวจไซต์ก่อสร้าง และดูรายงานประสานงานผ่าน BUILK360

## What The Video Shows

BUILK360 is not only a 360 viewer. The core workflow is site coordination:

- Owner, contractor, architect, and engineer inspect the same site view.
- Yellow comment pins make issues visible inside the 360 view.
- `Go to` jumps from a comment to the exact location/view.
- Users can reply to a comment and attach photos/files as evidence.
- Time comparison shows the same location across earlier dates.
- Locked view helps compare the same camera angle.
- Reports can filter event/comment types, export to PDF, and include a QR/deep link back to the 360 view.

## What The Product Page Adds

The product page confirms that BUILK360 is positioned as a construction-site coordination layer around 360 evidence:

- 360 virtual site tour is anchored to a Floor Plan.
- Users mark communication points, tag statuses such as pass/fail, and attach photos or documents.
- Collaboration happens from the same image/plan context, with comments, replies, and responsible parties.
- Time comparison is a first-class workflow, with the same site view across different dates and locked-view comparison.
- Project Dashboard aggregates site-tour activity, comments, replies, and project tracking over daily-to-project-lifetime ranges.
- Collaboration Report turns the communication history into a site document without rebuilding the data manually.
- File Center collects documents from points on the Floor Plan, tracks file status, and supports update notifications.
- Notifications are part of the coordination loop through email and LINE Notify.

## What The Manual Adds

The manual is more useful for implementation because it defines the operating workflow:

- Capture planning starts from numbered Pins on a Floor Plan.
- 360 photos should be taken in pin order so upload order maps cleanly back to the plan.
- Camera direction should stay consistent between captures to make time comparison understandable.
- Original files should be stored by project, plan/floor, week/date, and pin number.
- The tour creation flow connects each uploaded 360 image to a numbered plan pin, then stores tour name, capture date, and description.
- Tour Duplicate copies pin count, pin positions, hotspot settings, timeline, and descriptions for the next capture round.
- Hotspot Setting connects one pin to another and stores viewing direction plus hotspot position.
- Dashboard includes team tasks, project board, activity log, comments/replies, mentions, and dashboard-level file comments.
- Project Board has task status, due date highlighting, assignees, progress percent, notes, and attachments.
- Virtual Site Tour includes full screen, reset, center target, split screen, timeline selector, and likes.
- Split Screen supports two selected time periods and a lock/unlock mode so both sides move together.
- Plan view lets users pick a pin to jump the 360 view to that pin.
- Comments support @mentions, attachments, Add Point inside 360 view, tags, status, replies, edit/delete, and likes.
- Add Point stores the exact view target; Go to moves the viewer back to that locked comment point.
- Comment Center filters by name, date, and comment type; comments can be opened back into the related tour position and converted into tasks.
- File Center lists all files, uploader, upload time, source location, description, status, tracking, and direct uploads.
- Report generation starts from month/year plus report settings before generating a communication report.
- Role permissions separate Company Admin, Project Admin, and other project participants.

## Product Fit For Buildbybim.space

The common ground is `SiteOps / Evidence / Report`, not the 360 renderer itself.

Buildbybim already has:

- `Projects`
- `BuildDocs`
- `Defect`
- milestone data from documents
- photo evidence attached to defect records
- shared Evidence Asset layer (`src/evidence.ts`)
- local-first workspace backup

The most useful first slice is therefore:

```text
Project -> Defect/Comment -> Photo Evidence -> Site Coordination Report -> PDF/Meeting Output
```

This gives the user an immediately useful construction report workflow while keeping the data model ready for a future 360 viewer.

## Clean-Room Feature Map

Do not copy BUILK360 UI, brand, icons, screenshots, or exact report templates. Use the reference as workflow evidence only.

Buildbybim.space should evolve the current Site Report in these layers:

1. `Plan` layer: floor plan image, plan name/type, and numbered pins.
2. `Capture` layer: capture set/tour with date, folder/week, pin order, and camera direction note.
3. `Pin` layer: stable pin number plus optional floor, room, zone, viewpoint, drawing x/y, and 360 yaw/pitch.
4. `Evidence` layer: site_360, site_photo, pdf, dwg, video, and external links stored through EvidenceAsset.
5. `Comment` layer: status, tag, assignee/mention, replies, attachments, and locked view target.
6. `Task` layer: comment-to-task conversion with due date, assignee, progress, and done state.
7. `Compare` layer: same pin across two capture dates with optional locked view.
8. `Report` layer: monthly/weekly/meeting report generator with filters and export.
9. `File Center` layer: project-scoped file list with source pin/task/comment, status, and tracking flag.

## Implemented Slice

Added a `Site Report` tab inside the existing `Defect` workspace:

- build report events from defects, photos, and milestones
- filter report events by all / needs reply / answered / evidence / milestone
- summarize total events, pending replies, answered items, evidence, and milestones
- copy report text for LINE/email/meeting notes
- print/export through browser PDF
- simulate time comparison with `before` vs `after/checkpoint` evidence photos
- show a deep link placeholder that can become QR/360-link later
- add project-linked `site_360` / `site_file` EvidenceAssets through the existing Evidence layer
- store floor, room, zone, and viewpoint metadata on Site Report EvidenceAsset tags
- group that metadata into local Location pins so selecting a pin scopes the report events and evidence list
- avoid duplicate workspace storage by using project `EvidenceLink` records as the shared join point

## Next Build Direction

1. Add a lightweight Plan Pin board: upload/select plan image, create numbered pins, and bind existing Location pins to pin numbers.
2. Add capture-set fields to Site Report evidence: capture date, plan/floor, pin number, camera direction note, and source folder/week.
3. Add same-pin time compare: choose two capture dates for one pin, show reference/current evidence, and keep the selected pin scope.
4. Add comment-to-task flow: turn a Site Report event/comment into a task with assignee, due date, progress, and attachments.
5. Add report templates for owner meeting, weekly progress, defect closeout, and consultant response log.
6. Add File Center view for EvidenceAsset grouped by source pin/task/comment, status, and tracking flag.
7. Persist real 360 camera coordinates, image hotspots, or drawing coordinates for each Location pin.
8. Move evidence binaries/external preview metadata to Supabase Storage + relational `evidence_assets` mapper before production use.
