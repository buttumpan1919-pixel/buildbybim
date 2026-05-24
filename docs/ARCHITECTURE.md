# Architecture

Updated: 2026-05-24

## 1. Stack

- Frontend: Vite + React 19 + TypeScript
- Icons: `lucide-react`
- Styling: plain CSS in `src/styles.css`
- State/storage: React state + `localStorage`
- Build/deploy: `npm run build`, Netlify via `netlify.toml`

## 2. Important Files

| Path | Purpose |
| --- | --- |
| `src/main.tsx` | React entry point |
| `src/App.tsx` | Main UI shell and most module UI logic |
| `src/apps.ts` | App manifest: ids, labels, route bases, status, storage keys |
| `src/workspace/shell/*` | Workspace routing, app groups/icons, language persistence, and TH/EN shell copy |
| `src/workspace/apps/construction-planner/*` | Construction Planner Preview panel, workbook parser/normalizer, workspace integration sync, seed data, and tests |
| `src/data.ts` | Document types, seed BOQ rows, initial document data, contract templates |
| `src/storage.ts` | Workspace data model, document creation, normalization, backup/import logic |
| `src/sheets.ts` | Google Sheet CSV URL conversion and CSV item parser |
| `src/styles.css` | Global app styling |
| `netlify.toml` | Build command, SPA fallback, security/cache headers |
| `docs/PRD.md` | Product source of truth |
| `docs/TASKS.md` | Shared multi-agent task board |
| `docs/DECISIONS.md` | Architecture/product decision log |
| `docs/PLATFORM_ERD.md` | Conceptual platform ER diagram and future backend model |
| `docs/DEVELOPMENT_PLAN.md` | Phased development and go-to-market roadmap |
| `docs/DATA_STRATEGY.md` | Data ownership, persistence, backup/export, privacy, and quality rules |
| `docs/APP_TAXONOMY.md` | Shared app metadata taxonomy for categories, professions, monetization, privacy, AI usage, and persistence |
| `docs/PUBLIC_ROUTES.md` | Public website route map for app discovery, tools, prompts, workflows, pricing, and developer page |
| `docs/MEMBERSHIP_ACCESS_PRD.md` | PRD for flexible plans, app/feature access rules, admin overrides, and audit expectations |
| `docs/DESIGN_PLAN_REVIEW_PRD.md` | PRD for Architect Brain plan/brief review app |
| `docs/FACEBOOK_CONTENT_WORKFLOW_PRD.md` | PRD for draft-first Facebook content workflow app |
| `docs/PROMPT_SET_LIBRARY_PRD.md` | PRD for prompt/prompt set catalog, sharing, variables, and access tiers |

## 3. Runtime Shape

The app is a single-page React app.

- `src/apps.ts` defines every workspace app and its route.
- `src/workspace/shell/workspaceRouting.ts` maps `window.location.pathname` to the active `WorkspaceAppId`, subnav tab, and app version.
- `src/App.tsx` renders the active workspace panel from that route state.
- Subnav/tab state is stored in URL query params.
- App version selection is saved in `localStorage`.
- Netlify redirects all routes to `index.html` for SPA routing.

## 4. App Manifest Contract

Every app must have:

- `id`: stable `WorkspaceAppId`
- `label` and `shortLabel`
- `description`
- `status`: `ready`, `prototype`, `next`, or `planned`
- `routeBase`
- `storageKey`
- `versions`

When adding a new app:

1. Add the `WorkspaceAppId` union value in `src/apps.ts`.
2. Add the app object to `workspaceApps`.
3. Add icon and app grouping in `src/workspace/shell/workspaceGroups.ts`.
4. Add subnav mapping in `src/workspace/shell/workspaceRouting.ts`.
5. Add TH/EN app/group/subnav copy in `src/workspace/shell/workspaceCopy.ts`.
6. Add route-aware panel rendering in `WorkspaceAppPanel`.
7. Add a storage schema and normalizer before saving user data.

## 5. Data Model

Core shared model lives in `src/storage.ts`.

- `WorkspaceData`
  - `activeDocumentId`
  - `documents`
  - `clients`
  - `projects`
  - `employees`
  - `defects`
- `AppData`
  - document info, document type, items, milestones, tax toggles, selected contract, relationship, status
- `StoredDocument`
  - `AppData` plus id, title, timestamps, total
- `EmployeeRecord`
  - team, wage, benefit, work days, assigned projects, status
- `DefectRecord`
  - project key, source document, severity, status, owner, due, note, photos

Document seed data and domain types live in `src/data.ts`.

## 6. Storage Keys

| Key | Owner |
| --- | --- |
| `builddocs-pro.workspace.v1` | Main workspace documents/clients/projects/employees/defects |
| `builddocs-pro.mvp.v1` | Legacy document data migrated by `loadWorkspaceData` |
| `builddocs-pro.boq-catalog.v1` | Custom BOQ catalog rows |
| `boq-data.cost-code-mapping.v1` | BOQ Keynote/record to Cost Code mapping records |
| `boq-data.task-linkage.v1` | BOQ Data task-to-BOQ linkage records; Project Control also reads Construction Planner allocations here as baseline budget and links cost breakdown rows back to task/BOQ source context |
| `construction-planner.preview.v1` | Construction Planner imported preview workbook data |
| `projects.list.v1` + `builddocs-pro.boq-catalog.v1` + `boq-data.task-linkage.v1` | Construction Planner sync targets for project baseline, BOQ catalog rows, and task-to-BOQ links |
| `build-by-bim.app-version-selection.v1` | Workspace app version selection |
| `employees.workspace.v1` | Legacy/compat employee records |
| `defect-tracker.records.v1` | Legacy/compat defect records |
| `contractor-feed.workspace.v1` | Social feed data |

Rules:

- Do not rename a key without migration.
- New modules must use module-specific keys until the shared `WorkspaceData` schema is intentionally expanded.
- Large files/images should not be stored as `dataUrl` long-term without quota handling.

## 7. Import/Export

- Google Sheet import supports public/exported CSV only.
- Required sheet columns: item/name, quantity, price; unit is optional.
- Backup/import is JSON and should preserve documents, clients, projects, employees, and defects.
- Import must call normalizers before writing state.

Data strategy rules live in `docs/DATA_STRATEGY.md`. Any new app that persists user data must define workspace scope, storage/backend tables, import/export behavior, backup behavior, permissions, audit events, and links to other apps before implementation.

## 8. Build And Deploy

Local:

```bash
npm install
npm run dev
```

Production check:

```bash
npm run build
npm run preview
```

Netlify:

```bash
npm run deploy:netlify
npm run deploy:netlify:prod
```

## 9. Future Agent API Shape

Production agent features must use a backend-owned Agent API. Browser, LINE, and CLI clients call the same API surface with different roles and scopes.

```text
Web / LINE / Internal CLI
  -> Agent API
    -> Auth + workspace permission
    -> Tool registry
    -> Agent run + audit log
    -> Domain services
    -> Postgres / storage / external APIs
```

Required backend tables when this moves beyond the local prototype:

- `agent_runs`
- `agent_messages`
- `agent_actions`
- `agent_tool_calls`
- `agent_inbox_items`
- `agent_files`
- `audit_logs`
- `line_accounts`

Tool safety rules:

- Tools must be allowlisted server functions, not arbitrary shell commands.
- Secrets stay server-side only.
- Read tools can run after auth and permission checks.
- Draft tools can prepare structured output without committing data.
- Write tools require workspace permission, app access, validation, and confirmation.
- Destructive tools require explicit confirmation and audit metadata.

Internal Agent CLI should call Agent API endpoints or admin-only service functions. It must not become the normal path for web users to run shell commands on the production host.

## 10. Architecture Risks

- `src/App.tsx` is currently monolithic. For large future work, split by module only when needed and keep exports/types stable.
- State is local-first; no server authority exists yet.
- Automated tests exist via Vitest; build remains the minimum quality gate for UI and routing changes.
- Document/legal/PDF behavior is browser-driven and should be treated as draft-quality until validated.
- Agent APIs can mutate business data, so production use requires auth, RLS/permission checks, tool allowlists, human confirmation for risky writes, and complete audit logs.
- Data loss, cross-workspace leakage, and unexportable user data are product-level failures, not just technical bugs.
