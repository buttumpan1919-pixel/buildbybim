# Doc-arcH Workflow Import Plan

## Direction

This project will not depend on Firebase. Doc-arcH is used as a workflow reference only. The new app should stay local-first during development, then move to a real hosting/domain setup with a replaceable backend adapter.

## Architecture Rule

Keep business logic separate from storage and hosting.

```
UI components
  -> domain services
    -> storage adapter
      -> localStorage / IndexedDB / API backend
```

The first development target is local runtime on `127.0.0.1`. Production hosting can be Netlify, Vercel, a VPS, or another static host with an API layer later.

## Workflow Mapping

| Doc-arcH workflow | New app target | First implementation |
| --- | --- | --- |
| BOQ task allocation | BOQ Data / Docs / Project Work | Local-first allocation service |
| PO spending and budget tracking | Cash / Docs / BOQ Data | Domain model, then UI summary |
| Payment milestone reminders | Docs / Cash | Local reminder data first |
| Worker check-in/out | Team | Local timesheet service |
| Defect reports and site photos | Defect / Library | Local photo records, then project linkage |
| Daily site report | Defect / Docs | Report draft from tasks/photos |
| LINE bot commands | Agent Chat | Command catalog only, no Firebase dependency |
| BIM 5D viewer | Future Tool app | Separate module after BOQ/task model is stable |

## Import Priority

1. BOQ allocation foundation
   - `BoqAllocationItem`
   - `BoqTaskAllocation`
   - summary calculation
   - over-allocation validation

2. Project workflow layer
   - task to BOQ item linkage
   - project-level budget summary
   - document line item linkage

3. Field operation layer
   - worker check-in/out
   - defect/photo report
   - daily report

4. External adapter layer
   - LINE or chat command adapter
   - hosted API adapter
   - export/import adapter

## Non-Goals

- Do not copy Firebase Functions directly into the app.
- Do not use Firestore schema as the internal source of truth.
- Do not reverse-engineer the bundled `dist` frontend as maintainable source.
- Do not hardcode one hosting provider into domain services.

## Current Status And Next Step

The local-first BOQ allocation service and BOQ Data summary are in place. The next implementation step must follow the master PRD: build Task-to-BOQ linkage inside BOQ Data first, using `boq-data.task-linkage.v1` as its own storage key and keeping Docs line items separate.
