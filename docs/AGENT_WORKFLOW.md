# Agent Workflow

Updated: 2026-05-22

Use this file when multiple agents work on this repo at the same time.

## 1. Source Of Truth Order

When documents conflict, follow this order:

1. `docs/PRD.md`
2. `docs/ARCHITECTURE.md`
3. `docs/DECISIONS.md`
4. `docs/TASKS.md`
5. `README.md`
6. Current source code

If source code behavior differs from docs, either update the docs or explicitly log the mismatch in `docs/TASKS.md`.

User-facing progress lives in `src/roadmap.ts` and `/roadmap`. After any completed task that changes feature status, route/app availability, tests/build status, or next work, update `src/roadmap.ts` in the same turn.

## 2. Before Editing

Every agent must:

- Run `git status --short`
- Read the relevant section in `docs/PRD.md`
- Read `docs/ARCHITECTURE.md` if touching routes, storage, app manifest, build, or deployment
- Check `docs/TASKS.md` for overlapping work
- Avoid touching unrelated files or generated output

## 3. File Ownership Map

| Area | Main files | Extra caution |
| --- | --- | --- |
| App manifest/routing | `src/apps.ts`, `src/App.tsx` | Keep `WorkspaceAppId`, icons, subnav, and route panel in sync |
| Documents | `src/App.tsx`, `src/data.ts`, `src/storage.ts` | Preserve quote/invoice/receipt/contract flows |
| Storage/import/export | `src/storage.ts`, `src/sheets.ts` | Add normalizers/migrations before schema changes |
| BOQ | `src/App.tsx`, `src/data.ts` | Keep seed rows, custom rows, and line item conversion stable |
| Defect | `src/App.tsx`, `src/storage.ts` | Photos can increase localStorage size |
| Employees | `src/App.tsx`, `src/storage.ts` | Preserve project allocation logic |
| UI styling | `src/styles.css`, `src/App.tsx` | Verify desktop and mobile layout |
| Docs | `docs/*.md`, `README.md` | Update when scope or workflow changes |

## 4. Task Protocol

- Pick one task from `docs/TASKS.md`.
- Mark owner as your agent name if you can edit that file safely.
- Keep changes narrow and tied to the task.
- If you discover a blocker, add it to the task notes instead of silently changing scope.
- If two agents touch `src/App.tsx`, coordinate by module/line area because it is the highest-conflict file.
- When the task is finished, update `src/roadmap.ts` and, if scope changed, `docs/PRD.md` / `docs/TASKS.md` before the final report.

## 5. Required Quality Gates

For code changes:

```bash
npm run build
```

For UI changes:

- Run the app with `npm run dev`
- Check the changed flow in browser
- Verify no obvious text overlap on desktop and mobile widths

For storage changes:

- Test load of existing localStorage data if possible
- Test backup export/import if the schema changed
- Keep legacy keys readable unless a migration is implemented

For docs-only changes:

- No build is required, but run build if docs encode decisions that affect code assumptions.

## 6. Report Format

Final report should include:

- What changed
- Files changed
- Validation run
- Roadmap update status
- Remaining risk or next task

Keep it concise and factual.

## 7. Do Not Do

- Do not edit `dist/` manually.
- Do not delete or reset user changes.
- Do not rename localStorage keys without migration.
- Do not introduce a backend/auth/payment dependency without asking first.
- Do not convert the app into a landing page.
- Do not add broad refactors while implementing a narrow feature.
