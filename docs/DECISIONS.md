# Decision Log

Updated: 2026-05-23

## ADR-001: Use Docs As Multi-Agent Coordination Layer

Decision: Use `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/AGENT_WORKFLOW.md`, `docs/TASKS.md`, and this file as the shared coordination layer.

Reason: Multiple agents can work in parallel only if product scope, data boundaries, quality gates, and task ownership are visible in repo.

Implication: Agents must update docs when changing scope, architecture, storage, or workflow.

## ADR-002: Keep The App Local-First For Now

Decision: Keep current data storage in `localStorage` and JSON backup/import.

Reason: The current app already works without backend setup and fits fast local iteration.

Implication: No auth, multi-user sync, or server authority exists yet. Storage schema changes must include normalization or migration.

## ADR-003: `src/apps.ts` Is The App Manifest Source

Decision: New modules must be registered through `src/apps.ts`.

Reason: The Work Hub depends on stable app ids, route bases, labels, status, and storage keys.

Implication: Adding an app requires syncing `WorkspaceAppId`, app object, icon mapping, subnav mapping, and `WorkspaceAppPanel`.

## ADR-004: Public CSV Is The Current Google Sheet Contract

Decision: Google Sheet import supports public/exported CSV URLs only.

Reason: The app has no backend/OAuth layer.

Implication: Private sheets that require login are out of scope until a backend/OAuth plan is approved.

## ADR-005: Browser Print Is The Current PDF Contract

Decision: PDF output remains browser print/save-as-PDF for now.

Reason: No server/client PDF rendering engine is currently implemented.

Implication: Pixel-perfect PDF, batch PDF export, and server-generated PDF are future scope.

## ADR-006: Thai UI With English Technical Identifiers

Decision: User-facing prose stays Thai; technical identifiers stay English.

Reason: The app serves Thai workflows, while code, APIs, commands, and keys are clearer in English.

Implication: Do not translate storage keys, type names, commands, route ids, or package names.

## ADR-007: Agent Chat Starts As A Local Prototype

Decision: Register `agentChat` as a Work Hub module with local UI for chat, file intake, and API channel planning.

Reason: The app has no backend, auth, bot tokens, or AI gateway yet, so real LINE/Telegram/Discord/Webchat processing must wait for a server-side API layer.

Implication: The current Agent Chat can demonstrate conversation, file queue, and channel contracts, but production AI/file processing requires backend endpoints, token storage, and provider credentials.

## ADR-008: Develop Major Features PRD-First And App-By-App

Decision: Major feature work must start from `docs/PRD.md` or a linked PRD/spec, then implement one active app at a time. The current active implementation target is BOQ Data, specifically Task-to-BOQ linkage.

Reason: The product is growing into multiple apps, and app-by-app delivery keeps scope, storage keys, UI flows, and acceptance criteria clear before coding.

Alternatives Considered: Implement directly from chat instructions; keep separate unlinked feature notes; develop multiple apps in parallel.

Implication: Before coding a major feature, identify the owning app, confirm the relevant PRD section, update `docs/TASKS.md`, and avoid cross-app coupling until the owner app acceptance criteria pass.

Date: 2026-05-22

## ADR-009: Portfolio Is Secondary To Tools, Membership, And Support

Decision: Build By BIM Platform is not primarily a portfolio website. The core product is a public content/free-tools funnel, member app hub, configurable support membership, and service upsell. Portfolio content is limited to a `Developer / About` page.

Reason: The business goal is to earn revenue from construction tools, business workflows, AI workflow support, membership, and consulting. A full portfolio-first website would dilute the product path from social media traffic to app usage and paid support.

Alternatives Considered: Build a portfolio-first site with apps as secondary showcases; keep only the internal operating studio without public acquisition pages.

Implication: Public pages must prioritize `apps`, `resources`, `pricing`, and free tools. The developer page supports credibility but should not become the main landing page or primary navigation focus.

Date: 2026-05-22

## ADR-010: Start With Construction But Keep The Platform Profession-Extensible

Decision: Construction is the first vertical because it matches the owner's expertise and current app inventory, but the platform must support apps, templates, workflows, and support plans for other professions.

Reason: The long-term business goal is broader reach and revenue across multiple occupations. Locking shared models, pricing, navigation, or app access around construction would make later expansion expensive.

Alternatives Considered: Build only for construction contractors; create separate websites for each profession; build a generic marketplace before proving one vertical.

Implication: Shared entities should use cross-profession names such as `Project`, `Client`, `Task`, `Document`, `Resource`, `Plan`, and `SupportRequest`. Construction-only concepts such as BOQ, defect, site team, and construction document stay inside construction modules. App catalog and membership rules must support category, profession tags, packs, and free/paid access.

Date: 2026-05-22

## ADR-011: Use Construction As A Cross-Profession Workflow Bridge

Decision: Treat construction as the first bridge into adjacent professions, not as a closed vertical. The platform should connect practical workflows between owners, architects, engineers, contractors, suppliers, admin/accounting, sales, marketing, and support teams.

Reason: Construction naturally requires many professions to coordinate. Supporting those handoffs can expand the platform to new users while still starting from a market the owner understands.

Alternatives Considered: Build construction-only tools; build a generic social network for professionals; launch a broad professional marketplace before workflow value is proven.

Implication: Prioritize workflow collaboration such as quote requests, shared documents, review requests, project handoff, support requests, and read-only external sharing. Do not build a broad social network or open professional marketplace before role/access control and workflow-specific value are defined.

Date: 2026-05-22

## ADR-012: Sell Practical Wedge Apps Before Marketing The BIM/IoT Platform

Decision: The first go-to-market motion must sell one practical app at a time, using concrete workflow pain points. `BIM and IoT Integration Platform` stays as a long-term architecture and advanced roadmap, not the first public marketing message.

Reason: Most Thai small contractors and working professionals are more likely to buy tools that save time immediately than abstract platform concepts. Wedge apps can educate the market, prove demand, and produce revenue before the full platform is obvious to users.

Alternatives Considered: Market the full BIM/IoT integration platform from day one; build all apps before selling; only offer consulting without productized apps.

Implication: Landing pages, Facebook content, pricing, and demos should focus on app-level outcomes such as faster BOQ, cleaner quotes, defect reports, site reports, document automation, and AI file assistance. Data models should remain BIM/IoT-ready behind the scenes.

Date: 2026-05-22

## ADR-013: Use Agent API For Product Automation And Keep CLI Internal

Decision: Product automation must be exposed through a backend-owned Agent API with tool allowlists, permission checks, confirmations, and audit logs. Agent CLI is allowed only as an internal owner/developer/admin tool that calls the same safe API or service layer.

Reason: Web and LINE users need AI-assisted data management, but exposing shell commands, service keys, or direct database access through chat would create severe security and data integrity risk.

Alternatives Considered: Embed a CLI directly in the web app; let the browser call AI/provider APIs directly; let agents write directly to database tables without tool contracts.

Implication: Browser and LINE clients never hold AI keys, database service keys, or production shell access. Agent actions must be routed through named server-side tools such as `createExpenseFromReceipt`, `createDocumentDraft`, `createDefect`, `searchProjectFiles`, and `linkBoqToTask`. Risky writes require user confirmation and all runs must be auditable.

Date: 2026-05-22

## ADR-014: Design Every App For Instant Utility And Future Memory

Decision: Every app should solve an immediate user problem quickly, then offer a path to save the result as reusable workspace data.

Reason: Users often arrive with a specific pain and need a fast result before they understand or trust the broader platform. Saved outputs become long-term value only after the quick utility is proven.

Alternatives Considered: Require signup and workspace setup before use; build only deep integrated workflows; focus only on one-off calculators without persistence.

Implication: New apps need a quick mode for immediate output and a saved mode for long-term data. Upgrade triggers should come from useful persistence, history, export, templates, support, collaboration, or AI automation.

Date: 2026-05-22

## ADR-015: Treat User Data As The Core Platform Asset

Decision: Saved user data is a core product asset and must be stored with clear ownership, structure, exportability, permission boundaries, and auditability.

Reason: The platform's long-term value comes from reusable client, project, document, BOQ, expense, defect, file, BIM, IoT, and agent data. If data is inconsistent, trapped, lost, or exposed across workspaces, the product loses trust.

Alternatives Considered: Treat each app as a standalone local tool; store most data as unstructured blobs; delay backup/export/security rules until after launch.

Implication: Every new app that persists data needs a data contract before implementation. It must define workspace scope, structured entities, source files, import/export behavior, backup/restore expectations, permission checks, audit events, and links to other apps.

Date: 2026-05-22

## ADR-016: Include Architect-Led Design Workflow As A First-Class Vertical

Decision: Build By BIM Platform must treat design workflow as a first-class vertical alongside construction operations. Design data includes brief, site analysis, moodboard, prompt/render, options, feedback, presentation, and handoff to BIM/BOQ/Docs.

Reason: The owner is an architect, and design is a strong wedge for both product value and market trust. Capturing design data early creates reusable project context for documents, estimates, BIM modeling, construction workflows, and AI assistance.

Alternatives Considered: Keep design as only a prompt/render tool; focus only on construction documents and BOQ; defer design workflow until after backend.

Implication: New design apps need structured data, versioning, source files, export/share, and links to project, library, BIM, BOQ, and Docs. Generated images are concept/reference outputs, not construction documents.

Date: 2026-05-23

## ADR-017: Support Small Practical Tools Apps

Decision: Buildbybim.space must support small practical `Tools Apps` in addition to larger construction, design, business, and AI workflow apps.

Reason: Some useful products will be narrow tools that solve one immediate problem, such as life planning, calculators, checklists, trackers, generators, or focused assistants. These can attract users, validate demand, and become free lead magnets or paid mini apps without forcing every idea into BIM, construction, or a full platform workflow.

Alternatives Considered: Only build construction/design apps; keep personal/life tools outside the platform; make every tool a full workspace app.

Implication: App catalog metadata must support a `tools` category, quick mode, optional saved mode, privacy level, and monetization type. Personal tools must be clearly separated from project/business data. Any tool that persists data still needs a data contract, export path, and ownership rules.

Date: 2026-05-23

## ADR-018: Auto Workflow Apps Must Be Draft-First

Decision: Buildbybim.space may include `Auto Workflow Apps` such as Facebook content creation, document generation, file-to-data processing, report preparation, and follow-up drafting, but MVP workflows must be draft-first and human-review-first.

Reason: Auto workflow apps can save time and create revenue, but automatic publish/send/write actions can damage trust, leak data, or create wrong business records if there is no review step.

Alternatives Considered: Build only manual tools; let AI publish or send automatically from the first version; keep automation only in internal CLI.

Implication: Workflow apps must store source input, prompt/generated output, approval status, export history, and audit events when connected to backend. Publishing to Facebook, sending messages, charging money, or writing important business records requires explicit confirmation and should go through Agent API/tool allowlists when automated.

Date: 2026-05-23

## ADR-019: Treat Prompt Sets As Product Assets

Decision: Buildbybim.space must treat prompts, prompt templates, and prompt sets as reusable product assets that can be searched, copied, shared, versioned, favorited, bundled into packs, and gated by access tier.

Reason: Prompt sets are a practical AI workflow product that can be used as free lead magnets, paid packs, member benefits, or workflow building blocks for apps such as Design Studio, Facebook Content Workflow, Agent Chat, and document generation.

Alternatives Considered: Keep prompts as plain text inside each app; build only one-off prompt generators; rely on external prompt libraries without owning platform assets.

Implication: Prompt data needs owner, version, variables, examples, visibility, access level, and safety rules. Public or paid prompt sets require moderation before sharing. Prompt sets must not store secrets, API keys, passwords, or private client data.

Date: 2026-05-23

## ADR-020: Keep App Access Configurable With Admin Overrides

Decision: Membership plans define default app and feature access, but admin can independently grant or deny access per workspace, member, or user through `AppAccessOverride`.

Reason: Buildbybim.space needs to sell free tools, paid mini apps, support plans, profession packs, trials, and custom client arrangements without creating a new hardcoded plan for every case.

Alternatives Considered: Hardcode Free/Pro/Enterprise access in frontend; create one plan for every customer exception; rely only on workspace roles.

Implication: Access checks must combine workspace role, plan entitlement, app/feature rule, override, limits, confirmation, and audit log. Permission changes are sensitive actions and must not be performed by unaudited client-only state.

Date: 2026-05-23

## ADR Template

Use this format for new decisions:

```md
## ADR-XXX: Title

Decision:

Reason:

Alternatives Considered:

Implication:

Date:
```
