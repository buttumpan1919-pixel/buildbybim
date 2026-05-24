# App.tsx Module Split Plan

Updated: 2026-05-24  
Status: phase 3 shell helpers extracted

## Progress

| Date | Move | Status | Verification |
| --- | --- | --- | --- |
| 2026-05-23 | `PageHeader` -> `src/workspace/shared/PageHeader.tsx` | done | `npm test -- --run`, `npm run build` |
| 2026-05-23 | `SummaryTile` -> `src/workspace/shared/SummaryTile.tsx` | done | `npm test -- --run`, `npm run build` |
| 2026-05-23 | `CashflowPanel` -> `src/workspace/apps/cashflow/CashflowPanel.tsx` | done | `npm test -- --run`, `npm run build`, browser smoke `/cashflow` -> `/hub` |
| 2026-05-23 | `AgentChatPanel` -> `src/workspace/apps/agent-chat/AgentChatPanel.tsx` | done | `npm test -- --run`, `npm run build`, browser smoke `/agent-chat` -> `/hub` |
| 2026-05-23 | `DesignStudioPanel` -> `src/workspace/apps/design-studio/DesignStudioPanel.tsx` | done | `npm test -- --run`, `npm run build`, browser smoke `/design` -> `/hub` |
| 2026-05-23 | `LibraryPanel` -> `src/workspace/apps/library/LibraryPanel.tsx` | done | `npm test -- --run`, `npm run build`, browser smoke `/library` -> `/hub` |
| 2026-05-24 | Social feed types/helpers/storage -> `src/workspace/apps/social-feed/socialFeedService.ts` | done | `npm test -- --run`, `npm run build`, browser smoke `/feed` -> `/hub` |
| 2026-05-24 | Employee types/helpers/legacy storage -> `src/workspace/apps/employees/employeeService.ts` | done | `npm test -- --run`, `npm run build`, browser smoke `/employees` -> `/hub` |
| 2026-05-24 | Defect labels/photo helpers/legacy storage -> `src/workspace/apps/defects/defectService.ts` | done | `npm test -- --run`, `npm run build`, browser smoke `/defect` -> `/hub` |
| 2026-05-24 | BOQ catalog storage, row normalization, search, merge, and CSV parser -> `src/workspace/apps/boq-data/boqDataService.ts` | done | `npm test -- --run`, `npm run build`, Playwright smoke `/boq-data` database + task-linkage |
| 2026-05-24 | Workspace route parsing, shell copy, groups, icons, and language storage -> `src/workspace/shell/*` | done | `npm test -- --run` (381 tests current suite), `npm run build` |

## Goal

Reduce merge conflicts and agent collisions in `src/App.tsx` before adding more apps. The file started at about 10,895 lines and currently mixes app shell, routing, dashboard, domain helpers, and multiple app panels. After Phase 1 component moves, Phase 2 service splits, and the first Phase 3 shell helper extraction, `App.tsx` is about 8.2k lines. Later UI work may change this count, so use it as a conflict-risk signal rather than a strict metric.

The split must keep routes and behavior stable while moving one low-risk area at a time.

## Current Hotspots

| Area | Current Location | Risk |
| --- | --- | --- |
| Workspace shell, route parsing, language, app switcher | `src/workspace/shell/*` helpers + remaining UI components in `src/App.tsx` | Medium/high, used by every app |
| Hub Dashboard | `WorkspaceAppPanel` | High, cross-app data summary |
| BuildDocs editor + preview | `App`, `DocumentPreview`, `LinkedPagePanel`, `SheetImportPanel` | High, many props and document state |
| BOQ Data | `App.tsx` BoqDataPanel + `workspace/apps/boq-data/boqDataService.ts` + `boqTaskLinkage.ts` + `boqAllocation.ts` | Medium, data/helpers extracted; UI panel still in `App.tsx` |
| Cashflow | `CashflowPanel` | Low, already has `cashflow.ts` service |
| Employee / Defect | `App.tsx` EmployeePanel + `workspace/apps/employees/employeeService.ts`; `App.tsx` DefectTrackerPanel + `workspace/apps/defects/defectService.ts` | Medium, data/helpers extracted; UI panels still in `App.tsx` |
| Social Feed | `App.tsx` SocialFeedPanel + `workspace/apps/social-feed/socialFeedService.ts` | Low/medium, data layer extracted; UI panel still in `App.tsx` |
| Agent Chat | `AgentChatPanel` | Low, mostly isolated prototype |
| Design / Library | `DesignStudioPanel`, `LibraryPanel` | Low/medium, mostly presentational |

## Target Folder Shape

```text
src/
  workspace/
    shell/
      WorkspaceShell.tsx
      WorkspaceTopbar.tsx
      WorkspaceSidebar.tsx
      WorkspaceSubnav.tsx
      workspaceRouting.ts
      workspaceCopy.ts
      workspaceGroups.ts
      workspaceLanguage.ts
    hub/
      HubDashboard.tsx
      hubMetrics.ts
    apps/
      cashflow/
        CashflowPanel.tsx
        cashflowCopy.ts
      agent-chat/
        AgentChatPanel.tsx
      social-feed/
        SocialFeedPanel.tsx
        socialFeedService.ts
        socialFeedTypes.ts
      employees/
        EmployeePanel.tsx
        employeeService.ts
        employeeTypes.ts
      defects/
        DefectTrackerPanel.tsx
        defectService.ts
      boq-data/
        BoqDataPanel.tsx
        boqDataService.ts
      design-studio/
        DesignStudioPanel.tsx
      library/
        LibraryPanel.tsx
      builddocs/
        BuildDocsWorkspace.tsx
        DocumentPreview.tsx
        SheetImportPanel.tsx
        BillingSchedulePanel.tsx
        LinkedPagePanel.tsx
    shared/
      PageHeader.tsx
      SummaryTile.tsx
      WorkspaceAccessGate.tsx
```

## Split Order

### Phase 1: Leaf Components, Lowest Risk

Move components that have clear props and little shared state:

1. `PageHeader`, `SummaryTile`
2. `CashflowPanel` + `cashflowPanelCopy`
3. `AgentChatPanel`
4. `DesignStudioPanel`
5. `LibraryPanel`

Acceptance:
- Route behavior unchanged
- `npm test -- --run` passes
- `npm run build` passes
- One browser smoke check for `/hub` and the moved route

### Phase 2: Isolated App Services

Move local service/helper groups that are currently inside `App.tsx`:

1. Social feed types/helpers/load/save into `workspace/apps/social-feed/` - done as `socialFeedService.ts`
2. Employee helpers into `workspace/apps/employees/` - done as `employeeService.ts`
3. Defect photo/read-file helpers into `workspace/apps/defects/` - done as `defectService.ts`
4. BOQ catalog storage, row normalization, search, merge, and CSV helpers into `workspace/apps/boq-data/` - done as `boqDataService.ts`

Acceptance:
- Existing behavior remains local-first
- No storage key changes
- Tests added for moved pure helpers where practical

### Phase 3: Workspace Shell

Only after leaf panels are stable:

1. Move route parsing/building to `workspace/shell/workspaceRouting.ts` - done
2. Move shell copy, group definitions, app icons, and language persistence to `workspace/shell/*` - done
3. Move `WorkspaceTopbar`, sidebar, app switcher, and subnav components
4. Keep top-level `App.tsx` as orchestrator until BuildDocs split is complete

Acceptance:
- Browser back/forward works
- App version query remains stable
- Language toggle persists
- Public route bridge still returns to `/`

### Phase 4: BuildDocs Workspace

This is highest risk and should be last:

1. Extract document preview components
2. Extract sheet import panel
3. Extract linked clients/projects pages
4. Extract BuildDocs editor shell
5. Then reduce top-level `App.tsx` to state orchestration and route rendering

Acceptance:
- Quote/PO/Invoice/Receipt/Contract flows still render
- CSV import still appends items
- Save/load workspace still works
- Existing tests and manual smoke pass

## Guardrails

- Do not change route bases while splitting.
- Do not rename localStorage keys.
- Do not move multiple high-risk panels in one PR/session.
- Keep `src/apps.ts` as the app manifest source of truth.
- Keep domain data modules (`cashflow.ts`, `membership.ts`, `boqTaskLinkage.ts`, `boqAllocation.ts`, `workspace/apps/boq-data/boqDataService.ts`, `storage.ts`) independent from React components.
- If a moved component needs more than 12 props, first create a typed view model or split the component further.

## Recommended Next Move

Phase 1 started with `CashflowPanel` because:

- Business logic is already in `src/cashflow.ts`
- Copy is self-contained
- It has focused tests
- Route is isolated at `/cashflow?tab=overview&version=0.1`
- Recent warning behavior can be browser-smoked quickly

Phase 1 leaf panel moves are complete for `CashflowPanel`, `AgentChatPanel`, `DesignStudioPanel`, and `LibraryPanel`. Phase 2 has moved `socialFeedService.ts`, `employeeService.ts`, `defectService.ts`, and `boqDataService.ts`, keeping larger UI panels in `App.tsx` while moving data, storage, normalization, stats, and helper logic into tested services. Phase 3 has started by extracting shell helpers into `src/workspace/shell/*` and adding focused routing/language tests. Next move should be the shell UI component extraction (`WorkspaceTopbar`, sidebar, app switcher, subnav) or one medium-risk panel extraction with a typed view model. Avoid moving BuildDocs until shell and leaf panels are stable.

## Verification Checklist Per Move

```text
npm test -- --run
npm run build
```

Browser smoke:

```text
/hub?tab=overview&version=0.1
/<moved-app-route>?tab=<main-tab>&version=0.1
```

Check:

- No blank screen
- Route query stays stable
- App card opens the same app
- Relevant persisted local data still renders
- No horizontal overflow in the moved panel

## Done Definition

This planning task is done when this document exists and `docs/TASKS.md` points to it. Actual code moves should be tracked as separate tasks, one phase at a time.
