# Build By BIM Platform - Master PRD

Updated: 2026-05-24 (Implementation Snapshot v0.4.25)
Status: Living product document
Primary source of truth: `docs/PRD.md`

## 0. Current Implementation Snapshot (ใช้สำหรับ continue ใน Codex)

**Last sync**: 2026-05-24 · **Branch**: main · **Test**: 536/536 pass · **Build**: pass (`npm run build`, Vite chunk warning only)

### 0.1 Platform skeleton — DONE
Public website + workspace shell + multi-language + funnel + access enforcement ครบทุก step:

```
Facebook content → / landing → /apps catalog → workspace (lazy)
                                                    ↓ ถ้า plan ไม่พอ
                                          WorkspaceAccessGate (3-path upgrade)
                                                    ↓
                            /support-plans (access matrix + Activate) → /account (sign-in)
                                                    ↓
                                     /admin (Cloud Sync + Plans + Audit) → multi-device sync
```

### 0.2 Implemented apps (ตรงกับ `src/apps.ts` manifest)

| Group | App id | Route | Status | Module file |
|---|---|---|---|---|
| Core | `hub` | `/hub` | prototype | `App.tsx` WorkspaceAppPanel (8-tile dashboard + pending actions + recent activity) |
| Project Work | `projects` | `/projects` | prototype | `workspace/apps/projects/ProjectsPanel.tsx` + `projects.ts` |
| Procurement | `costCodes` | `/cost-codes` | prototype | `workspace/apps/cost-codes/CostCodesPanel.tsx` + `costCodes.ts` + `costCodes.seed.ts` |
| Procurement | `suppliers` | `/suppliers` | prototype | `workspace/apps/suppliers/SuppliersPanel.tsx` + `suppliers.ts` |
| Procurement | `procurement` | `/procurement` | prototype | `workspace/apps/procurement/ProcurementPanel.tsx` + `procurement.ts` |
| Procurement | `projectControl` | `/project-control` | prototype | `workspace/apps/project-control/ProjectControlPanel.tsx` + `projectControl.ts` with Construction Planner baseline rollup and BOQ source drill-down |
| Procurement | `approvals` | `/approvals` | prototype | `workspace/apps/approvals/ApprovalCenterPanel.tsx` + `approvals.ts` |
| Project Work | `evidence` | `/evidence` | prototype | `workspace/apps/evidence/EvidencePanel.tsx` + `evidence.ts` + `docs/EVIDENCE_ASSET_PRD.md` |
| Project Work | `builddocs` | `/docs` | usable | `App.tsx` BuildDocs (quote/PO/invoice/receipt/contract + document authority panel/stamps) |
| Project Work | `boqData` | `/boq-data` | active | `App.tsx` BoqDataPanel + `workspace/apps/boq-data/boqDataService.ts` + `boqTaskLinkage.ts` + `boqAllocation.ts` |
| Project Work | `constructionPlanner` | `/construction-planner` | prototype | `workspace/apps/construction-planner/ConstructionPlannerPanel.tsx` workbook-style sheet preview + `constructionPlannerService.ts` + `constructionPlannerIntegration.ts` sync + built-in seed from `Construction Planning Spreadsheet.xlsx` |
| Project Work | `defectTracker` | `/defect` | prototype | `App.tsx` DefectTrackerPanel + Site Report tab + EvidenceAsset floor/room/zone/viewpoint metadata + location pin board + `workspace/apps/defects/defectService.ts` + `docs/SITE_REPORT_360_PRD.md` |
| Project Work | `employees` | `/employees` | prototype | `App.tsx` EmployeePanel + `workspace/apps/employees/employeeService.ts` |
| Business | `cashflow` | `/cashflow` | **prototype (v0.1 ready)** | `workspace/apps/cashflow/CashflowPanel.tsx` + `cashflow.ts` + `docs/CASHFLOW_PRD.md` |
| Business | `clientOps` | `/clients` | planned | (manifest only) |
| Design | `designStudio` | `/design` | prototype | `workspace/apps/design-studio/DesignStudioPanel.tsx` |
| Design (storage) | `library` | `/library` | prototype | `workspace/apps/library/LibraryPanel.tsx` |
| Agent | `agentChat` | `/agent-chat` | prototype | `workspace/apps/agent-chat/AgentChatPanel.tsx` |
| Social | `socialFeed` | `/feed` | prototype | `App.tsx` SocialFeedPanel + `workspace/apps/social-feed/socialFeedService.ts` |
| Platform | `admin` | `/admin` | **prototype (v0.1 ready)** | `AdminPanel.tsx` (5 tabs + Cloud Sync card + Project Access grants/check) |
| Parked | `debtPlanner` | `/debt` | next | placeholder only, out of scope |

### 0.3 Public routes (impl ใน `PublicSite.tsx` + route modules)
`/`, `/apps`, `/tools`, `/prompts`, `/workflows`, `/roadmap`, `/pricing`, `/developer`, `/account`, `/support-plans`, `/style-preview` (alias) — TH/EN dictionary ครบทุก route

`/roadmap` ใช้ `src/roadmap.ts` เป็นข้อมูลกลาง และ render ผ่าน `src/public/RoadmapPage.tsx`; ต้องอัปเดตหลังจบงานพัฒนาที่เปลี่ยนสถานะ feature/app/route/test/build

### 0.4 Architecture layers — DONE
- **Storage adapter pattern** (`src/storageAdapter.ts`) — `StorageAdapter` interface + `LocalStorageAdapter` + `MemoryAdapter` + swappable singleton
- **Supabase Phase A** — `src/supabaseClient.ts` null-safe singleton, env vars wired in `.env.example` + `vite-env.d.ts`
- **Supabase Phase B** — `supabase/migrations/0001_initial_platform.sql` (7 tables + RLS) + `0002_kv_store.sql` (generic JSONB sync table)
- **Supabase Phase C** — `src/supabaseAdapter.ts` SupabaseAdapter (local cache + 800ms debounced cloud push + `pullFromCloud`/`pushToCloud`/`flushPending`) + Cloud Sync UI in `/admin?tab=overview`
- **Supabase Phase F** — `src/auth.ts` magic link + anonymous + `ensureWorkspace` auto-create; `/account` sign-in/up flow; AdminPanel auto-picks workspace from session

### 0.5 Data modules (all use storage adapter — no direct localStorage calls)
- `src/cashflow.ts` — Cashflow data layer + summarize
- `src/cashflow.rollup.ts` — Project cashflow rollup, supplier price-history sync, and rich cashflow filters
- `src/cashflow.recurring.ts` — Recurring cashflow template storage and entry generation
- `src/approvals.ts` — Generic ApprovalRequest state machine, PR/Cashflow/BuildDocs document sync, and audit bridge
- `src/evidence.ts` — Evidence asset data layer for receipts, site photos, site 360/files, RFQ quotes, invoices, file proof, links, statuses, summaries, and approval evidence gate policy
- `src/projectAccess.ts` — Project-scoped RBAC grants and document authority stamps for prepared/submitted/checked/approved/issued document workflows; Admin Project Access manages grants/checks, Projects filters read/write/admin actions, BuildDocs gates authority/print/share/export actions, Approval Center gates approve/reject actions, and Procurement/Cashflow/Project Control scope financial/control data plus write/confirm/approve/award actions before saving source records
- `src/membership.ts` — Plans + AccessRules + Overrides + Audit + `evaluateAppAccess()` per MEMBERSHIP_ACCESS_PRD Section 5
- `src/projects.ts` — Project list/detail data layer, computed project status, seed projects, and storage adapter load/save
- `src/boqTaskLinkage.ts` — BOQ task↔BOQ item linkage; `/boq-data?tab=task-linkage` accepts `projectId`, `taskId`, `boqItemId`, and `costCode` query context for cross-app drill-down
- `src/boqAllocation.ts` — BOQ catalog allocation validation
- `src/storage.ts` — Workspace data (docs/clients/projects/employees/defects)
- `src/stylePreviewI18n.ts` — TH/EN language preference
- `src/hubDashboardCopy.ts` — Hub dashboard TH/EN dictionary
- `src/workspace/apps/defects/defectService.ts` — Defect labels, legacy storage cleanup, file/date formatters, image upload helper, Site Report events, EvidenceAsset bridge helpers, Site Report location metadata tags, and location pin grouping
- `src/workspace/apps/employees/employeeService.ts` — Employee project options, normalization, site-team derivation, legacy storage cleanup, payroll helpers, and app stats
- `src/workspace/apps/social-feed/socialFeedService.ts` — Social Feed data layer, storage adapter load/save, normalization, stats, search, and post/comment helpers
- `src/workspace/apps/boq-data/boqDataService.ts` — BOQ custom catalog storage, row normalization, search text, merge rules, status/filter constants, and CSV parsing
- `src/workspace/apps/construction-planner/constructionPlannerService.ts` — Construction Planner workbook parser/normalizer for `แผนงานก่อสร้าง` + `BOQ`, Buddhist-year date conversion, local-first preview storage key `construction-planner.preview.v1`, planned-curve derivation, and workbook-style overview rendering
- `src/workspace/apps/construction-planner/constructionPlannerIntegration.ts` — local-first bridge from the planner preview to `projects.list.v1`, `boq-data.task-linkage.v1`, custom BOQ catalog rows, and Project Control-readable budget baselines with source links
- `src/workspace/shell/workspaceRouting.ts` — Workspace route parsing/building, subnav definitions, and app version selection storage
- `src/workspace/shell/workspaceLanguage.ts` — Workspace language persistence
- `src/workspace/shell/workspaceCopy.ts` — Shell/app/group/subnav copy source for TH/EN UI
- `src/workspace/shell/workspaceGroups.ts` — Sidebar app groups and app icon lookup
- `src/roadmap.ts` — Public Roadmap data source for shipped milestones, current focus, next work, and update rules
- `src/public/RoadmapPage.tsx` — Public Roadmap route component + page-specific CSS split out from `PublicSite.tsx`
- `src/apps.ts` — App manifest + 6 taxonomy types (Category/ProfessionTag/Monetization/AccessLevel/PrivacyLevel/AiUsage)
- `src/auth.ts` — Supabase auth wrapper (null-safe when env missing)

### 0.6 Quality + testing — DONE
- Vitest + jsdom + coverage installed (`npm test` / `npm run test:watch` / `npm run test:coverage`)
- 536 tests pass: storage adapter, membership/audit, project access/document authority/enforcement guards, Admin Project Access route/copy, cashflow + rollup/recurring, approvals, evidence, SupabaseAdapter, sheets, workspace storage, projects, cost codes, suppliers, procurement PR/RFQ, Project Control planner-baseline/source drill-down rollup, social/employee/defect/BOQ services, Construction Planner parser/seed/sync tests, and workspace shell routing/language tests
- TypeScript build clean
- Code-split: `main.tsx` uses `React.lazy(() => import("./App"))` — landing visitor ไม่โหลด workspace app bundle before entering `/hub` or app routes

### 0.7 Files reference (ทุก doc ที่ Codex ต้องอ่าน)

| File | Purpose |
|---|---|
| `docs/PRD.md` (this file) | master PRD + implementation snapshot |
| `docs/IMPLEMENTED_ERD.md` | ER diagram ที่สะท้อน Supabase tables + local TS types ที่ build แล้ว |
| `docs/DATA_DICTIONARY.md` | implementation data dictionary for current ERP tables, storage keys, enums, and known gaps |
| `docs/WORKFLOW_SEQUENCE.md` | current project-cost ERP workflow sequences from Project -> PR -> Approval -> RFQ -> Cashflow -> Project Control |
| `docs/SUPABASE_SYNC_CONTRACT.md` | Phase D relational mapper contract from local storage keys / `kv_store` to Supabase tables |
| `docs/EVIDENCE_ASSET_PRD.md` | Evidence Asset Layer PRD for receipts, site photos, RFQ attachments, invoices, and proof links |
| `docs/SITE_REPORT_360_PRD.md` | Site Report 360 coordination PRD: plan pins, capture sets, same-pin compare, comments, tasks, File Center, and report templates |
| `docs/PLATFORM_ERD.md` | conceptual ERD (รวมถึง BIM/IoT/Agent ที่ยังไม่ทำ) |
| `docs/MEMBERSHIP_ACCESS_PRD.md` | Plans/Rules/Overrides/Audit + evaluation order |
| `docs/CASHFLOW_PRD.md` | Cashflow v0.1 acceptance criteria + future v0.2-v0.3 |
| `docs/SUPABASE_SETUP.md` | Phase A→F step-by-step + roadmap |
| `docs/PUBLIC_ROUTES.md` | Public route IA |
| `docs/APP_TAXONOMY.md` | Required app metadata + category/profession/monetization tables |
| `docs/DATA_STRATEGY.md` | Data ownership + privacy + backup principles |
| `docs/DEVELOPMENT_PLAN.md` | Phased roadmap |
| `docs/AGENT_WORKFLOW.md` | Multi-agent dev workflow |
| `docs/DECISIONS.md` | Architecture decision log |
| `docs/APP_TSX_MODULE_SPLIT_PLAN.md` | Safe split plan for reducing `src/App.tsx` conflicts before moving code |
| `docs/TASKS.md` | Task board + Done Log (เก็บประวัติทุก session) |
| `docs/DESIGN_PLAN_REVIEW_PRD.md`, `docs/PROMPT_SET_LIBRARY_PRD.md`, `docs/FACEBOOK_CONTENT_WORKFLOW_PRD.md` | sub-PRDs สำหรับ future apps |
| `supabase/migrations/*.sql` | SQL ที่ user run แล้วใน Supabase project `mnanqmmgniaqpvkzupmn` |

### 0.8 What to build next (priorities ตาม PRD release plan)

1. **Site Report 360 Plan Pin slice** — implement `docs/SITE_REPORT_360_PRD.md` Phase 1: plan image, numbered pins, bind existing Location pins, and keep report/evidence scope.
2. **Phase D relational mappers** — implement `docs/SUPABASE_SYNC_CONTRACT.md` so high-value keys (projects, cost codes, suppliers, PR/RFQ, cashflow, approvals, evidence, project access, document authority) populate Supabase tables instead of only `kv_store`.
3. **Evidence Asset follow-up** — add relational mapper + Supabase Storage bucket, then add project/app/role dimensions and RFQ quote auto-link helpers to the current evidence gate.
4. **Phase E realtime + anonymous→email upgrade** — Supabase Realtime subscription + linkIdentity API.
5. **Phase G payment** — Omise (Thai PromptPay) + Stripe (international) wired to `/support-plans` Activate.
6. **Wedge app deepening** (one at a time per user instruction): Plan Review, Facebook Content Workflow, Design Brief.
7. **Continue App.tsx module split** — phase 1 leaf panels moved (`CashflowPanel`, `AgentChatPanel`, `DesignStudioPanel`, `LibraryPanel`); phase 2 moved `socialFeedService.ts`, `employeeService.ts`, `defectService.ts`, and `boqDataService.ts`; phase 3 shell helpers moved into `src/workspace/shell/*`; continue with shell UI components (`WorkspaceTopbar`, sidebar, app switcher, subnav) or one medium-risk panel extraction before BuildDocs.

### 0.9 How to run

```bash
# Dev
npm install
npm run dev                 # http://127.0.0.1:5173

# Test
npm test                    # 536 tests
npm run test:watch
npm run test:coverage

# Build + preview
npm run build
npm run preview

# Deploy
npm run deploy:netlify          # preview
npm run deploy:netlify:prod     # production

# Supabase setup (one-time, see docs/SUPABASE_SETUP.md)
# 1. paste keys into .env (copy from .env.example)
# 2. run supabase/migrations/0001_initial_platform.sql
# 3. run supabase/migrations/0002_kv_store.sql
# 4. enable Email + Anonymous auth providers
# 5. add /account redirect URLs in Supabase auth settings
```

---

## 1. Product Direction

Build By BIM Platform คือเว็บศูนย์กลางเครื่องมือ ความรู้ และบริการสนับสนุนสำหรับงานออกแบบ งานก่อสร้าง ธุรกิจ และ AI Workflow ภายใต้แบรนด์ `Build by BIM` โดยใช้แฟนเพจ Facebook และช่องทางสื่ออื่นเป็นทางเข้าหลักสู่ free tools, app hub, membership และบริการแบบจ่ายเงินจริง

แกนหลักของผลิตภัณฑ์ไม่ใช่เว็บ portfolio แต่เป็นระบบที่เปลี่ยนผู้ติดตาม/ผู้สนใจให้เป็นผู้ใช้และลูกค้า ผ่าน flow: `content -> free tool/template -> member account -> paid support plan -> consulting/custom workflow`

งานออกแบบและงานก่อสร้างเป็นตลาดเริ่มต้นและเป็นความเชี่ยวชาญหลักช่วงแรก เพราะ owner เป็นสถาปนิกและเข้าใจ workflow ตั้งแต่รับ brief, concept, schematic design, presentation, BIM, BOQ, เอกสารก่อสร้าง จนถึงหน้างาน แต่ architecture ต้องไม่ล็อกระบบไว้เฉพาะสายก่อสร้าง ในอนาคตต้องรองรับแอปสำหรับอาชีพอื่น เช่น เจ้าของธุรกิจขนาดเล็ก ฟรีแลนซ์ ที่ปรึกษา นักออกแบบ ทีมขาย แอดมิน และอาชีพที่ต้องใช้เอกสาร ตาราง งานซ้ำ หรือ AI Workflow

ข้อได้เปรียบของสายก่อสร้างคือเป็นงานที่ต้องติดต่อหลายอาชีพอยู่แล้ว เช่น เจ้าของโครงการ สถาปนิก วิศวกร ผู้รับเหมา ซัพพลายเออร์ บัญชี ฝ่ายขาย แอดมิน อสังหา การตลาด และทีมบริการหลังการขาย ดังนั้น platform ควรใช้ construction เป็น bridge เพื่อค่อย ๆ เชื่อม workflow ของสายงานอื่น ไม่ใช่สร้างเป็นเครื่องมือก่อสร้างแบบปิดวง

หน้า portfolio เป็นเรื่องรอง ให้จำกัดเป็น `Developer / About` page สำหรับแนะนำผู้พัฒนา ความเชี่ยวชาญ ช่องทางติดต่อ และความน่าเชื่อถือเท่านั้น ไม่ควรใช้เป็น landing page หลักของผลิตภัณฑ์

`Buildbybim.space` คือชื่อโปรเจกต์/โฟลเดอร์งานหลักของเว็บนี้ ส่วนเป้าหมายส่วนตัวเรื่องการปลดหนี้ไม่ใช่ product scope ของเว็บแอปนี้ ดังนั้น `debtPlanner` ไม่ใช่ module ที่ต้องพัฒนาในรอบนี้ เว้นแต่ owner จะสั่ง re-scope ใหม่อย่างชัดเจน

เป้าหมายระยะนี้คือพัฒนาและทดสอบบนเครื่องก่อนที่ `http://127.0.0.1:5173` แล้วค่อยนำขึ้น hosting/domain ใหม่ภายหลัง โดยไม่ผูกกับ Firebase หรือ provider ใด provider หนึ่ง

## 2. Product Principles

- Develop app-by-app: พัฒนาให้จบทีละแอป ไม่กระจาย scope พร้อมกันหลายแอป
- PRD-first: ก่อนทำ feature สำคัญ ต้องมี PRD/spec ในไฟล์นี้หรือไฟล์ docs ที่อ้างจากไฟล์นี้
- Local-first: ข้อมูลต้องใช้งานได้ในเครื่องก่อน ผ่าน `localStorage`, `IndexedDB`, หรือ adapter ที่เปลี่ยนได้
- Hosting-agnostic: business logic ต้องไม่ผูกกับ Firebase, Netlify, Vercel, Supabase หรือ backend เฉพาะเจ้า
- Modular apps: แต่ละแอปมี route, storage key, state, acceptance criteria และ development backlog ของตัวเอง
- Shared shell: topbar, sidebar, breadcrumb, app switcher, language switcher และ version selector เป็น shared UI
- Multi-language ready: shared UI ต้องผ่าน dictionary/helper ไม่ hardcode ภาษาเดียว
- Revenue-aware: free tools, content, membership, support และ consulting ต้องออกแบบให้เชื่อมกันเป็น funnel
- Portfolio-light: หน้าแนะนำผู้พัฒนาเป็น supporting page ไม่ใช่ core product หรือ hero หลัก
- Construction-first, profession-extensible: เริ่มจากงานก่อสร้าง แต่ data model, app manifest, pricing, access rules และ content taxonomy ต้องรองรับหลายอาชีพ
- Architect-led design workflow: ระบบต้องรองรับกระบวนการออกแบบของสถาปนิกตั้งแต่ brief, concept, precedent, moodboard, prompt/render, option comparison, presentation, BIM handoff และ design document
- Workflow-network first: การเชื่อมหลายอาชีพต้องเริ่มจาก workflow ที่ทำงานร่วมกันจริง เช่น ส่งเอกสาร ขอราคา ส่งงาน ตรวจงาน support ไม่ใช่ social network กว้าง ๆ ตั้งแต่แรก
- Wedge app first: การตลาดช่วงแรกต้องขายแอปเดี่ยวที่แก้ pain ชัดเจนก่อน ไม่ขายคำว่า `BIM and IoT Integration Platform` กับตลาดทั่วไปเร็วเกินไป
- Instant utility, future memory: ทุกแอปต้องช่วยแก้ปัญหาเฉพาะหน้าได้เร็วทันที และถ้าผู้ใช้เลือกบันทึก ข้อมูลนั้นต้องกลายเป็น asset ที่ค้นหา ใช้ซ้ำ export หรือเชื่อม workflow ต่อได้ในอนาคต
- Tools apps allowed: ระบบต้องรองรับแอปเครื่องมือขนาดเล็กที่ใช้แก้ปัญหาเฉพาะหน้า เช่น planning, calculator, checklist, generator, tracker หรือ assistant เฉพาะเรื่อง โดยเรียกรวมว่า `Tools Apps`
- Auto workflow apps allowed: ระบบต้องรองรับแอปที่ช่วยทำงานซ้ำหลายขั้นตอนแบบกึ่งอัตโนมัติ เช่น สร้างคอนเทนต์ Facebook, สรุปไฟล์, สร้างเอกสาร, เตรียม report หรือ follow-up แต่ต้องเป็น draft/review ก่อน action จริง
- Prompt assets are products: prompt, prompt template และ prompt set ต้องถือเป็น product asset ที่ค้นหา แชร์ ใช้ซ้ำ จัด tier และต่อยอดเป็น paid pack ได้

## 3. Users

- Visitor / Lead: มาจาก Facebook, social media, Google หรือการแชร์ลิงก์ ต้องเจอ free tool, template, article หรือ use case ที่เริ่มใช้ได้เร็ว
- Free Member: สมัครเพื่อใช้ free tools, เก็บงานบางส่วน, ดาวน์โหลด template หรือรับ resource
- Paid Support Member: จ่ายรายเดือนเพื่อใช้ app/template เพิ่มขึ้น ขอ support ได้ตาม quota และเข้าถึง workflow ที่ลึกกว่า
- Business / Team Customer: ใช้งาน workflow เพื่อธุรกิจ รับบริการ setup, training, consulting หรือ custom app
- Other Professional User: ผู้ใช้จากอาชีพอื่นที่ต้องการเครื่องมือจัดการงาน เอกสาร ลูกค้า ตาราง ต้นทุน content หรือ AI Workflow โดยไม่จำเป็นต้องอยู่ในสายก่อสร้าง
- Architect / Designer: รับ brief, วิเคราะห์ site, สร้าง concept, moodboard, prompt/render, เปรียบเทียบ option, ทำ presentation และส่งต่อข้อมูลไป BIM/BOQ/Docs
- Owner / Contractor: ดูภาพรวมงาน เอกสาร ต้นทุน งวดงาน ทีม และสถานะโครงการ
- Admin / Accounting: ทำใบเสนอราคา สัญญา ใบวางบิล ใบแจ้งหนี้ ใบเสร็จ และ backup/import/export
- Site Lead: ติดตาม task, BOQ allocation, defect, รูปหน้างาน และรายงานประจำวัน
- Estimator / QS: จัดการ BOQ, ราคา, keynote, allocation, budget remaining และข้อมูลต้นทุน
- Developer / Agent: เพิ่มแอปใหม่หรือพัฒนาแอปเดิมโดยไม่ชน scope ของแอปอื่น

## 3.1 Business Model And Acquisition Funnel

Build By BIM ต้องรองรับรายได้ 3 ชั้น:

1. Free-to-paid membership: ให้ใช้ฟรีบางส่วน แล้ว upgrade เพื่อปลดล็อก app, template, export, storage, support quota หรือ workflow ขั้นสูง
2. Monthly support: owner ตั้งระดับ support รายเดือน เงื่อนไข ราคา สิทธิ์ และจำนวน request ได้เอง
3. Service upsell: งานวางระบบเอกสารก่อสร้าง, dashboard ธุรกิจ, AI workflow, training และ custom implementation

ช่องทางหลัก:

- Facebook Page: `https://www.facebook.com/BuildbyBIM/`
- Social media อื่น: ใช้เป็นช่องทางกระจาย content และ link กลับมายัง free tools หรือ pricing
- Organic search: บทความ คู่มือ template และหน้าเครื่องมือควรมี SEO metadata และ social preview ที่แชร์ได้ดี

สิ่งที่ public website ต้องเน้น:

- แสดงปัญหาและเครื่องมือที่แก้ปัญหาได้ทันที
- พาผู้ใช้เข้า free tools/app hub มากกว่าหน้า portfolio
- เก็บ lead หรือชวนสมัครสมาชิกเมื่อผู้ใช้ต้องการ save/export/support
- มีหน้า `Developer / About` แบบสั้นเพื่อสร้างความน่าเชื่อถือ ไม่ใช่จุดขายหลัก

## 3.1.1 Flexible App Access And Admin Plan Rules

ระบบสมาชิกและสิทธิ์การใช้แอปต้องตั้งค่าได้แบบอิสระโดย admin ไม่ควร hardcode ว่าแผนใดเปิด app ใดแบบตายตัวใน frontend

หลักการ:

- `Plan` ใช้กำหนดแพ็กเกจ ราคา รอบบิล support quota และ default entitlement
- `AppAccessRule` ใช้กำหนดว่า plan ใดเปิด app/feature ใด พร้อม access level และ limits
- `AppAccessOverride` ใช้ให้ admin grant/deny สิทธิ์เฉพาะ workspace, member หรือ user ได้โดยไม่ต้องสร้าง plan ใหม่
- workspace role เช่น owner, member, reviewer, vendor, support operator ใช้ควบคุมสิทธิ์กับข้อมูล ส่วน app access ใช้ควบคุมว่าเข้า app/feature ได้หรือไม่ ทั้งสองชั้นต้องถูกตรวจพร้อมกัน
- destructive หรือ sensitive action เช่น payment, delete, export จำนวนมาก, permission change และ agent write ต้องเช็ค role + app access + confirmation + audit log

Access level เริ่มต้นที่ต้องรองรับ: `none`, `preview`, `quick`, `saved`, `read`, `write`, `export`, `admin`, `support`

Admin ต้องสามารถตั้งค่า:

- app/feature ที่แต่ละ plan ใช้ได้
- quota เช่น support request, export, AI run, storage, project count, member count
- temporary access/trial พร้อมวันหมดอายุ
- override เฉพาะลูกค้าหรือทีม เช่น เปิด app พิเศษให้ลูกค้ารายหนึ่ง หรือ deny app บางตัวให้สมาชิกบางคน
- audit log ทุกครั้งที่มีการเปลี่ยนสิทธิ์

PRD รายละเอียดอยู่ที่ `docs/MEMBERSHIP_ACCESS_PRD.md`

## 3.2 Multi-Profession Expansion Strategy

กลยุทธ์การขยายคือเริ่มจาก vertical ที่ owner เข้าใจดีที่สุดก่อน แล้วค่อยแตกแอปที่ใช้ซ้ำได้ข้ามอาชีพ:

1. Construction-first: BOQ, Docs, Defect, Team, Cashflow และ Project Ops เป็นชุดเริ่มต้น
2. Business workflow: CRM, proposal, invoice, cashflow, checklist, resource library และ dashboard ใช้ได้กับหลายธุรกิจ
3. AI workflow: prompt library, file intake, agent chat, content workflow, automation และ template generator เป็นแกนที่ขยายได้ทุกสายงาน
4. Profession packs: รวมแอป, template, workflow และ content ตามอาชีพ เช่น `Construction`, `Small Business`, `Freelancer`, `Designer`, `Consultant`, `Sales/Admin`

กฎสำคัญ:

- ห้ามตั้งชื่อ data model กลางให้ผูกกับ construction โดยไม่จำเป็น เช่น `Project`, `Client`, `Task`, `Document`, `Resource`, `Plan`, `SupportRequest` ต้องใช้ได้ข้ามอาชีพ
- construction-specific fields ต้องอยู่ใน module เฉพาะ เช่น BOQ, defect, site team, construction document
- App Hub ต้องรองรับ category, profession tag, difficulty, free/paid access, และ recommended pack
- Pricing/support ต้องตั้งค่าได้ตาม app, profession pack หรือ use case ไม่ใช่ตามแอปก่อสร้างเท่านั้น

## 3.2.1 Tools Apps Strategy

`Tools Apps` คือแอปเครื่องมือขนาดเล็กที่ทำงานจบในตัว ช่วยให้ผู้ใช้ได้ผลลัพธ์เร็วโดยไม่ต้องเข้าใจ platform ทั้งระบบก่อน

ตัวอย่าง:

- Life planning tools: วางแผนชีวิต เป้าหมายส่วนตัว เวลา สุขภาพ การเรียน การเงินส่วนบุคคล หรือ habit
- Business tools: คำนวณราคา กระแสเงินสด checklist เอกสาร content plan หรือ proposal helper
- Design/construction tools: site checklist, room requirement, quick BOQ, plan review, defect checklist, report generator
- AI workflow tools: prompt helper, file summarizer, document extractor, receipt intake, template generator
- Prompt set tools: prompt pack สำเร็จรูปสำหรับงานออกแบบ คอนเทนต์ เอกสาร ธุรกิจ ชีวิตส่วนตัว หรือ agent command

กติกา:

- ต้องมี quick mode ใช้ได้ทันที ไม่บังคับสมัครก่อนเห็นคุณค่า
- ถ้ามี saved mode ต้องกำหนด data contract, storage key, owner, export และ privacy level
- ถ้าเกี่ยวกับข้อมูลส่วนตัว เช่น ชีวิต สุขภาพ การเงิน ต้องแยกจาก project/business workspace ชัดเจน
- Tools Apps สามารถเป็น free lead magnet, paid mini app, หรือส่วนหนึ่งของ membership/profession pack ได้
- Tools Apps ไม่จำเป็นต้องเชื่อม BIM/IoT ทุกตัว แต่ควรออกแบบให้ข้อมูลที่มีประโยชน์ export หรือเชื่อมต่อภายหลังได้

## 3.2.2 Auto Workflow Apps Strategy

`Auto Workflow Apps` คือแอปที่ช่วยทำงานซ้ำหลายขั้นตอนให้เป็น workflow กึ่งอัตโนมัติ โดยเน้นให้ AI ช่วย draft, organize, transform, summarize หรือ prepare งาน แต่ action สำคัญต้องผ่านมนุษย์ก่อน

ตัวอย่าง:

- Facebook content workflow: สร้างไอเดีย hook caption CTA hashtag image prompt และ content calendar note
- Document workflow: สร้างใบเสนอราคา สัญญา report หรือ template จากข้อมูลที่มี
- File-to-data workflow: สรุปไฟล์ รูป ใบเสร็จ สลิป หรือเอกสารเป็น structured data
- Follow-up workflow: เตรียมข้อความติดตามลูกค้า สถานะงาน หรือ support reply
- Repurpose workflow: แปลงโพสต์ยาวเป็น short post, carousel, script, newsletter หรือ resource page

กติกา:

- MVP ต้องเป็น draft-first และ human-review-first
- ห้าม auto publish, auto send, auto charge, หรือ auto write ข้อมูลสำคัญโดยไม่มี confirmation
- ต้องเก็บ source, prompt/input, generated output, approval status และ export history
- Workflow ที่เรียก agent หรือ external API ต้องผ่าน Agent API/tool allowlist และ audit log
- Workflow content ต้องเชื่อมกับ funnel ได้ เช่น free tool, app page, resource, pricing หรือ support plan

## 3.3 Cross-Profession Collaboration Strategy

เป้าหมายระยะยาวคือให้ Build By BIM Platform เป็นพื้นที่ทำงานร่วมกันระหว่างหลายอาชีพ โดยเริ่มจาก workflow ที่เกิดขึ้นจริงในงานก่อสร้าง แล้วแยกออกเป็นเครื่องมือที่อาชีพอื่นใช้ได้เอง

กลุ่มอาชีพที่เชื่อมจาก construction ได้โดยธรรมชาติ:

- Owner / Developer: ต้องการ dashboard, budget, document approval, progress report
- Architect / Designer: ต้องการ brief, design option, render workflow, revision, presentation
- Engineer / Consultant: ต้องการ review, checklist, calculation note, issue tracking
- Contractor / Site Team: ต้องการ BOQ, task, defect, daily report, team coordination
- Supplier / Vendor: ต้องการ quote request, price catalog, delivery status, product data
- Admin / Accounting: ต้องการ proposal, billing, invoice, receipt, contract, cashflow
- Sales / Marketing / Real Estate: ต้องการ content, lead, property info, proposal, follow-up

Workflow ที่ควรทำก่อน social/feed เต็มรูปแบบ:

1. Request/response: ขอราคา ขอเอกสาร ขอ review ขอ support
2. Shared document: ส่ง quote, contract, invoice, receipt, report, approval link
3. Project handoff: ส่ง task, checklist, defect, file, photo, note ข้ามบทบาท
4. App-to-app workflow: ข้อมูลจาก BOQ ไป Docs, Cashflow, Support, Resource หรือ Client Ops
5. Referral/lead: ส่งงานหรือแนะนำผู้เชี่ยวชาญได้ในอนาคต หลังจาก workflow พื้นฐานนิ่งแล้ว

ข้อจำกัดช่วงแรก:

- ยังไม่ทำ marketplace หาคนงานหรือ social network เปิดเต็มรูปแบบ
- ยังไม่ให้ user ภายนอกแก้ข้อมูล project หลักโดยไม่มี permission model
- external sharing ต้องเริ่มจาก read-only/share link/export ก่อน แล้วค่อยเพิ่ม collaboration แบบ login
- ต้องมี role/access model ก่อนรองรับ multi-user จริง

## 3.3.1 Design Workflow Strategy

เพราะ owner เป็นสถาปนิก Build By BIM ต้องมีสายแอปสำหรับกระบวนการออกแบบโดยตรง ไม่ใช่มีเฉพาะ BOQ/เอกสาร/หน้างาน

Design workflow ที่ควรรองรับ:

1. Client Brief: เก็บความต้องการ งบประมาณ lifestyle พื้นที่ รูปแบบ และข้อจำกัด
2. Site Analysis: เก็บรูป พิกัด ทิศแดด ลม บริบท ผัง และข้อจำกัดกฎหมายเบื้องต้น
3. Precedent / Moodboard: เก็บ reference, style, material, color, atmosphere
4. AI Concept / Prompt Studio: สร้าง prompt, render brief, style option และภาพ concept
5. Plan Review / Architect Brain: ตรวจ brief/แปลนด้วยคลังสมองสถาปนิก แยก finding ตามกฎหมายเบื้องต้น วิศวกรรมเบื้องต้น ออกแบบ วัฒนธรรมไทย ฮวงจุ้ย optional และ cost readiness
6. Option Comparison: เปรียบเทียบ design option ตามงบ พื้นที่ style function และความเสี่ยง
7. Presentation Builder: รวมภาพ concept, moodboard, note, diagram และ proposal สำหรับลูกค้า
8. BIM Handoff: ส่งข้อมูล concept/space/zone/room requirement ไปต่อเป็น BIM model หรือ schedule
9. Design-to-BOQ: เมื่อ design ชัดขึ้น ข้อมูล room/area/material ต้องต่อยอดไป BOQ และ Docs ได้

แอปออกแบบต้องยึดหลัก `quick mode + saved mode`:

- Quick mode: สร้าง prompt, moodboard, design checklist หรือ presentation draft ได้ทันที
- Saved mode: เก็บ brief, reference, generated image, design option, material, room/space requirement เข้า project เพื่อใช้ต่อใน BIM/BOQ/Docs

ข้อมูลออกแบบที่ควรเก็บเป็น structured data:

- design brief
- site observation
- style preference
- material palette
- room/space requirement
- design option
- prompt version
- generated image/file
- client feedback
- approval decision

ข้อควรระวัง:

- Generated image เป็น concept/reference ไม่ใช่ construction document
- ต้องระบุ source และ version ของ prompt/render เพื่อย้อนกลับได้
- งานแบบก่อสร้างจริงต้องส่งต่อไป BIM/Docs/BOQ ผ่านข้อมูลที่ตรวจสอบแล้ว

## 3.4 Wedge App Go-To-Market Strategy

ช่วงแรกต้องขายด้วยภาษาที่คนไทยเข้าใจง่าย เช่น `ทำ BOQ เร็วขึ้น`, `ทำใบเสนอราคาเร็วขึ้น`, `จัด defect ไม่หลุด`, `สรุปรายงานหน้างาน`, `เก็บรูปและเอกสารเป็นระบบ` มากกว่าขายคำว่า `BIM`, `IoT`, `integration platform`, `digital twin` หรือ `automation ecosystem`

ผู้ใช้ส่วนใหญ่จะเริ่มจากความต้องการเฉพาะหน้า เช่น ต้องทำใบเสนอราคาเดี๋ยวนี้ ต้องเก็บใบเสร็จตอนนี้ ต้องสรุป defect ให้ลูกค้าดู หรืออยากให้ AI อ่านไฟล์ให้ทันที ดังนั้นแต่ละแอปต้องเปิดใช้งานได้เร็ว ลด friction และให้ผลลัพธ์ทันที ก่อนค่อยชวนสมัครเพื่อเก็บข้อมูลและใช้ต่อระยะยาว

แนวทาง:

1. สร้างและขายทีละแอป โดยเลือก pain ที่ชัดและวัดผลได้
2. แต่ละแอปต้องใช้งานเดี่ยวได้จริง มี free entry และ paid upgrade ที่เข้าใจง่าย
3. ใช้ Facebook/content สอนปัญหาและโชว์ before/after ของ workflow
4. เก็บ feedback จากผู้ใช้จริงก่อนขยายเป็น pack หรือ platform
5. โครงข้อมูลหลังบ้านต้องรองรับ BIM/IoT ตั้งแต่ต้น แต่ไม่ต้องสื่อสารเป็น selling point หลัก

ทุก wedge app ต้องมี 2 ชั้น:

- Quick mode: ใช้ได้ทันที แก้ปัญหาเฉพาะหน้า เช่น กรอกเร็ว แปลงไฟล์ สร้างเอกสาร สรุปข้อมูล หรือ export
- Saved mode: เมื่อ login/save ข้อมูลจะถูกเก็บใน workspace เพื่อใช้ซ้ำ เช่น client, project, BOQ, document, receipt, defect, file, prompt หรือ report

ลำดับ wedge app ที่เหมาะกับตลาดเริ่มต้น:

- `BOQ Data`: ค้นราคา/จัดรายการ/ผูกงบกับ task
- `BuildDocs`: ใบเสนอราคา สัญญา ใบวางบิล invoice receipt จากข้อมูลเดิม
- `Defect`: บันทึกปัญหา รูป จุดแก้ไข และรายงานส่งมอบ
- `Site Report / Daily Report`: รายงานหน้างานแบบเร็วจากรูป note และ task
- `AI Document Assistant`: ให้ AI ช่วยสรุปไฟล์ ทำเอกสาร หรือจัดข้อมูล

ข้อความขายที่ควรใช้:

- พูดเรื่องประหยัดเวลา ลดงานซ้ำ ลดเอกสารหลุด ลดการตามงานในแชท
- ใช้คำว่า `BIM-ready` หรือ `รองรับการต่อยอดกับ BIM` เฉพาะกลุ่มที่เข้าใจ
- ใช้คำว่า `IoT-ready` เฉพาะใน roadmap หรือบริการเฉพาะทาง ไม่ใช้เป็น headline ช่วงแรก

เป้าหมายของ wedge app ไม่ใช่ขายแอปเล็กแบบแยกขาด แต่เป็นการพิสูจน์ผู้ใช้จริง แล้วค่อยรวมเป็น app hub, profession pack, membership, collaboration และ BIM/IoT integration layer ตามลำดับ

Acceptance criteria ของแอปใหม่ทุกตัว:

- ผู้ใช้ใหม่ต้องเข้าใจงานหลักของแอปภายใน 30 วินาที
- ต้องสร้างผลลัพธ์แรกได้ภายใน 2-3 นาทีโดยไม่ต้องตั้งค่าซับซ้อน
- ต้องมีทางเลือก `download/export/copy/share` สำหรับคนที่ยังไม่สมัคร
- ต้องมีทางเลือก `save to workspace` สำหรับคนที่อยากเก็บไว้ใช้ต่อ
- ข้อมูลที่ save ต้องเชื่อมกับ entity กลาง เช่น `client`, `project`, `document`, `task`, `expense`, `file`, `support_request` หรือ `agent_run`
- ต้องมี upgrade trigger ที่เป็นธรรมชาติ เช่น save history, export professional format, template library, support, collaboration หรือ AI automation

## 3.5 Agent Control Layer

Build By BIM Platform ต้องรองรับ agent ที่ช่วยจัดการข้อมูลผ่าน web chat, LINE chat และ internal CLI ได้ในอนาคต แต่ต้องออกแบบเป็น `Agent API` ที่อยู่หลัง backend ไม่ใช่ฝัง CLI หรือ API key ไว้ใน browser

ช่องทางที่รองรับ:

- Web Agent: ผู้ใช้คุยในเว็บเพื่อค้นข้อมูล สร้างเอกสาร สรุปไฟล์ หรือจัดการงาน
- LINE Agent: ผู้ใช้ส่งข้อความ รูป ใบเสร็จ สลิป หรือไฟล์ผ่าน LINE แล้ว agent แปลงเป็นข้อมูลที่ใช้ต่อในเว็บ
- Internal Agent CLI: owner/developer ใช้ในเครื่องหรือ worker เพื่อ batch import, migration, report, QA หรือ support โดยเรียก API เดียวกับเว็บ

กฎสำคัญ:

- ห้ามให้ browser หรือ LINE webhook ถือ `OPENAI_API_KEY`, service role key, database password หรือ token ลับ
- ห้ามให้ผู้ใช้ทั่วไปสั่ง shell/CLI command ตรงจาก chat
- ทุก agent action ต้องผ่าน backend permission, workspace scope, app access rule และ audit log
- คำสั่งที่แก้ข้อมูลต้องมี confirmation หรือ confidence threshold ก่อนบันทึกจริง
- destructive action เช่น delete, overwrite, payment, permission change ต้องใช้ explicit confirmation และ role ที่เหมาะสม
- Agent tool ต้องเป็น allowlist function เท่านั้น เช่น `createExpenseFromReceipt`, `createDocumentDraft`, `createDefect`, `searchProjectFiles`, `linkBoqToTask`

ตัวอย่าง flow ใบเสร็จผ่าน LINE:

1. ผู้ใช้ส่งรูปใบเสร็จเข้า LINE
2. LINE webhook ส่ง event เข้า backend
3. backend ดึงรูปจาก LINE และเก็บไฟล์ต้นฉบับใน private storage
4. agent OCR/อ่านข้อมูล แล้วสร้าง draft structured data
5. ระบบตอบกลับให้ผู้ใช้ confirm
6. เมื่อ confirm แล้วจึงบันทึกเข้า `expenses`, `documents`, `cashflow_entries` หรือ project cost
7. ทุกขั้นตอนถูกบันทึกใน `agent_runs`, `agent_actions`, `audit_logs`

Agent API ต้องรองรับ tool classes:

- Read tools: ค้น project, BOQ, document, defect, cashflow, files, support history
- Draft tools: สร้าง draft เอกสาร ใบเสนอราคา expense defect หรือ report โดยยังไม่บันทึกจริง
- Write tools: บันทึกข้อมูลหลังผ่าน permission และ confirmation
- Search tools: ค้นเอกสาร/ไฟล์ผ่าน keyword search หรือ vector search
- Handoff tools: ส่งต่อให้ human support, accounting review, admin approval หรือ specialist agent

แนวทาง implementation:

- ใช้ backend endpoint เช่น `/api/agent/runs`, `/api/agent/tools/*`, `/api/line/webhook`
- เก็บสถานะ conversation และ run ใน database ไม่พึ่ง localStorage
- แยก `agent_inbox_items` สำหรับข้อความ/ไฟล์ที่รอประมวลผล
- เก็บ output แบบ draft ก่อน commit เข้า business tables
- ทำ trace/audit ให้ตรวจย้อนหลังได้ว่า agent อ่านอะไร เสนออะไร และบันทึกอะไร

## 4. App Map

Route รายละเอียดสำหรับ public website อยู่ที่ `docs/PUBLIC_ROUTES.md`

App catalog, Tools Apps, Prompt Set และ Workflow Apps ต้องใช้ taxonomy กลางจาก `docs/APP_TAXONOMY.md` เพื่อกำหนด category, profession tag, free/paid, privacy level, AI usage และ data persistence ก่อน implement

| Group | App id | Route | Status | Primary role |
| --- | --- | --- | --- | --- |
| Growth | `publicSite` | `/`, `/apps`, `/tools`, `/prompts`, `/workflows`, `/pricing` | prototype | public website สำหรับ content, free tools, prompts, workflows, pricing และ acquisition (impl ที่ `src/PublicSite.tsx`) |
| Growth | `publicRoadmap` | `/roadmap` | prototype | user-facing development status page; data source `src/roadmap.ts`; route component `src/public/RoadmapPage.tsx`; must be updated after completed development work |
| Growth | `developerPage` | `/developer` | prototype | หน้าแนะนำผู้พัฒนาแบบสั้น ไม่ใช่ core portfolio (impl ใน `src/PublicSite.tsx`) |
| Growth | `landing` | `/`, `/style-preview` | prototype | landing page ที่มี hero, modules, quick start, pricing (impl ที่ `src/PublicStylePreview.tsx`) |
| Membership | `memberAccount` | `/account` | prototype | current plan summary, switch plan, apps allowed/denied (impl ที่ `src/PublicSite.tsx` AccountPage) |
| Membership | `supportPlans` | `/support-plans` | prototype | plan catalog + access matrix table + Activate button (impl ที่ `src/PublicSite.tsx` SupportPlansPage) |
| Platform | `appMarketplace` | `/apps` | prototype | catalog แอป multi-dim filter (status × category × plan) + taxonomy badges; live จาก `src/apps.ts` |
| Platform | `professionPacks` | `/packs` | planned | ชุดแอป/template/workflow ตามอาชีพหรือ use case |
| Tools | `toolsCatalog` | `/tools` | prototype | catalog stub สำหรับ Tools Apps; รอ detail page `/tools/:toolSlug` |
| Tools | `lifePlanner` | `/tools/life-planner` | planned | เครื่องมือวางแผนชีวิต/เป้าหมายส่วนตัวแบบแยกจาก project/business workspace |
| Tools | `quickCalculators` | `/tools/calculators` | planned | เครื่องมือคำนวณเร็วสำหรับชีวิต ธุรกิจ งานออกแบบ และงานก่อสร้าง |
| AI Workflow | `promptSetLibrary` | `/prompts` | prototype | catalog stub พร้อม PRD ref; รอ detail page `/prompts/:promptSetId` + `/prompts/builder` |
| AI Workflow | `promptSetBuilder` | `/prompts/builder` | planned | สร้าง แก้ไข version และจัดหมวด prompt set เพื่อแชร์หรือขายเป็น pack |
| Auto Workflow | `workflowCatalog` | `/workflows` | prototype | catalog stub สำหรับ workflow automation apps |
| Auto Workflow | `facebookContentWorkflow` | `/workflows/facebook-content` | planned | สร้าง draft โพสต์ Facebook จากหัวข้อ ไฟล์ โครงการ หรือแอป พร้อม hook, caption, CTA, hashtag และ image prompt |
| Collaboration | `collaborationHub` | `/collaboration` | planned | request, handoff, shared document, role-based collaboration ข้ามอาชีพ |
| Collaboration | `professionalNetwork` | `/network` | future | เครือข่ายผู้เชี่ยวชาญ/referral หลัง workflow และ permission model พร้อม |
| Core | `hub` | `/hub` | prototype | workspace home dashboard — 8 summary tiles + pending actions + recent activity (`src/App.tsx` WorkspaceAppPanel) |
| Platform | `admin` | `/admin` | prototype | Admin Console — plans, access rules, overrides, audit log (impl `src/AdminPanel.tsx`) |
| Project Work | `projects` | `/projects` | prototype | Project list + detail live in `workspace/apps/projects/ProjectsPanel.tsx` + data layer `src/projects.ts`; PRD: `docs/PROJECT_PRD.md` |
| Project Work | `builddocs` | `/docs` | usable prototype | เอกสารและสัญญา |
| Project Work | `boqData` | `/boq-data` | active prototype | BOQ, price database, budget allocation; helpers in `workspace/apps/boq-data/boqDataService.ts` |
| Project Work | `defectTracker` | `/defect` | prototype | defect, รูปหน้างาน, handover, Site Report tab with EvidenceAsset links, floor/room/zone/viewpoint metadata, location pin board, and Site Report 360 PRD (`docs/SITE_REPORT_360_PRD.md`) |
| Project Work | `employees` | `/employees` | prototype | พนักงาน ทีม ค่าแรง |
| Procurement | `costCodes` | `/cost-codes` | prototype | CBS spine — 100 Thai seed codes + tree view + CSV import; PRD: `docs/COST_CODES_PRD.md`; impl `src/costCodes.ts` + `workspace/apps/cost-codes/CostCodesPanel.tsx` |
| Procurement | `suppliers` | `/suppliers` | prototype | Supplier directory + price history + rating; PRD: `docs/SUPPLIERS_PRD.md`; impl `src/suppliers.ts` + `workspace/apps/suppliers/SuppliersPanel.tsx` |
| Procurement | `procurement` | `/procurement` | prototype | Purchase Request + RFQ comparison/award live; RFQ award checks evidence policy before finalizing high-value awards; PRD: `docs/PROCUREMENT_PRD.md`; impl `src/procurement.ts` + `workspace/apps/procurement/ProcurementPanel.tsx` |
| Procurement | `projectControl` | `/project-control` | prototype (Sprint 6) | Per-project budget vs actual dashboard + 5 standard reports; dashboard/reports/settings route live |
| Procurement | `approvals` | `/approvals` | prototype (Sprint 7+) | Approval Center for PR/Cashflow/BuildDocs PO+Invoice decisions + audit trail + document authority sync; PRD: `docs/APPROVAL_AUDIT_PRD.md`; impl `src/approvals.ts` + `workspace/apps/approvals/ApprovalCenterPanel.tsx` |
| Project Work | `evidence` | `/evidence` | prototype (Sprint 8+) | Evidence library/intake/link/report app for receipts, site photos, RFQ quotes, invoices, and proof files; Evidence gate can warn/block Approval Center decisions and RFQ awards without direct verified evidence by amount and target type; PRD: `docs/EVIDENCE_ASSET_PRD.md`; impl `src/evidence.ts` + `workspace/apps/evidence/EvidencePanel.tsx` |
| Design | `designBrief` | `/design/brief` | planned | รับ brief, site analysis, requirement และ design criteria |
| Design | `moodboard` | `/design/moodboard` | planned | precedent, style, material, color, atmosphere และ reference library |
| Design | `planReview` | `/design/plan-review` | planned | ตรวจ brief/แปลนด้วย Architect Brain, checklist, findings, score และ action |
| Design | `designOptions` | `/design/options` | planned | เปรียบเทียบ design option, note, feedback และ approval |
| Design | `presentationBuilder` | `/design/presentation` | planned | สร้าง presentation/proposal จาก brief, moodboard, image และ document data |
| Social | `socialFeed` | `/feed` | prototype | feed รับเหมาและเครือข่าย |
| Library | `library` | `/library` | prototype | รูป เอกสาร prompt ถังขยะ |
| Tool | `designStudio` | `/design` | prototype | prompt/render workflow |
| Agent | `agentChat` | `/agent-chat` | prototype | webchat/file intake/API channel plan |
| Agent | `agentControl` | `/agent-control` | planned | Agent API, tool registry, permissions, LINE/web agent runs, audit log |
| Parked | `debtPlanner` | `/debt` | out of scope | placeholder เดิมใน code; ไม่ใช่ scope เว็บแอปตอนนี้ |
| Business | `cashflow` | `/cashflow` | prototype | Cashflow entries, project rollup, recurring templates, and project cost tab integration |
| Business | `clientOps` | `/clients` | planned | CRM ลูกค้าและ project ops |

## 5. Development Contract

ทุก feature ใหม่ต้องผ่านขั้นตอนนี้:

1. ระบุว่า feature อยู่ในแอปไหน
2. เพิ่มหรืออัปเดต PRD/spec ของแอปนั้น
3. ระบุ data model, storage key, UI flow, acceptance criteria
4. Implement เฉพาะ scope ของแอปนั้น
5. Run `npm run build`
6. ตรวจ route ที่เกี่ยวข้อง
7. อัปเดต `docs/TASKS.md` หรือ `docs/DECISIONS.md` เมื่อ scope หรือ architecture เปลี่ยน

## 6. Architecture Requirements

โครงสร้างที่ยึด (implemented):

```text
UI component (React)
  -> domain service (cashflow.ts, membership.ts, boqTaskLinkage.ts, ...)
    -> storage adapter (storageAdapter.ts → defaultStorageAdapter)
      -> LocalStorageAdapter (default)
      -> MemoryAdapter (SSR/test)
      -> SupabaseAdapter (when activated via /admin Cloud Sync)
```

กฎที่ enforce แล้ว:

- ✅ ห้ามให้ domain service เรียก Firebase/Firestore โดยตรง — ไม่มี Firebase ใน codebase
- ✅ ห้ามผูก data model กับ schema จาก Doc-arcH แบบตรง ๆ
- ✅ Doc-arcH ใช้เป็น workflow reference เท่านั้น
- ✅ การเพิ่ม backend ใหม่ทำผ่าน adapter — SupabaseAdapter ใช้ pattern เดียวกัน, domain modules ไม่ต้องแก้
- ✅ ทุก storage schema มี normalizer + load-fallback (เช่น `normalizeCashflowState`, `normalizePlansState`)
- ✅ Adapter swap ผ่าน `setStorageAdapter()` — `activateSupabaseSync(workspaceId)` switch the runtime
- ✅ Keys local-only (auth tokens, language preference) protect ด้วย `LOCAL_ONLY_PREFIXES` ใน `supabaseAdapter.ts`

Code-split ทำแล้ว: `main.tsx` ใช้ `React.lazy()` แยก workspace bundle ออกจาก public site (landing visitor ไม่โหลด workspace).

เอกสาร backend/platform:

- Implemented ERD (สิ่งที่ build จริง): `docs/IMPLEMENTED_ERD.md`
- Conceptual ERD (รวม future BIM/IoT/Agent): `docs/PLATFORM_ERD.md`
- Supabase setup + roadmap A→G: `docs/SUPABASE_SETUP.md`
- Phased development plan: `docs/DEVELOPMENT_PLAN.md`
- Data strategy: `docs/DATA_STRATEGY.md`
- Membership + access control: `docs/MEMBERSHIP_ACCESS_PRD.md`

## 7. Current Active App: BOQ Data

### 7.1 App Purpose

BOQ Data เป็นแหล่งข้อมูลหลักของราคา BOQ, keynote, unit cost, material/labor cost, version ราคา และ budget allocation สำหรับ task/project

BOQ Data ต้องเป็น source of truth ด้านงบก่อนที่ Docs, Cash, Defect หรือ Team จะนำข้อมูลไปใช้ต่อ

### 7.2 Current Capabilities

- Seed BOQ catalog
- Custom BOQ row
- CSV import
- Google Sheet public CSV import
- Price version filter
- Search/filter by level/keynote/text
- Send selected BOQ rows into Docs
- Local-first allocation summary prototype
- Task-to-BOQ linkage workspace with persisted task allocation summary
- BOQ service split: custom catalog storage, CSV parser, row normalization, and search/merge helpers live outside `App.tsx`

### 7.3 Implemented Feature: Task-to-BOQ Linkage

#### Problem

ตอนนี้ BOQ row สามารถส่งเข้าเอกสารได้ แต่ยังไม่มี workflow ที่บอกว่า task ใดใช้งบจาก BOQ item ไหน และใช้ไปเท่าไร ทำให้ยังต่อยอดไปยัง PO, business cashflow, Defect หรือ Daily Report ได้ไม่แม่น

#### Goal

เพิ่ม UI ใน BOQ Data เพื่อสร้าง task แล้วเชื่อม BOQ item เข้ากับ task พร้อมกำหนด allocated budget ต่อรายการ

#### Non-Goals

- ยังไม่ทำ Firebase/backend sync
- ยังไม่ทำ multi-user permission
- ยังไม่ทำ PO spending จริง
- ยังไม่เชื่อม business cashflow อัตโนมัติในรอบแรก
- ยังไม่ทำ Gantt/Schedule เต็มรูปแบบ

#### User Flow

1. ผู้ใช้เปิด `BOQ Data`
2. เข้าแท็บ `Task Linkage`
3. สร้างหรือเลือก task เช่น `งานโครงสร้างชั้น 1`
4. ค้นหา BOQ item เช่น `A3000`, `คอนกรีต`, `เหล็ก`
5. เลือก BOQ item ที่เกี่ยวข้อง
6. ใส่ยอด allocated budget สำหรับ task นั้น
7. ระบบแสดง available budget และเตือนเมื่อเกินงบ
8. บันทึก linkage
9. Summary ของ BOQ item และ task อัปเดตทันที

#### Data Model

```ts
type BoqProjectTask = {
  id: string;
  name: string;
  projectId: string;
  status: "planned" | "in_progress" | "done";
  note: string;
  boqLinkage: BoqTaskAllocation[];
  createdAt: string;
  updatedAt: string;
};

type BoqTaskAllocation = {
  taskId: string;
  taskName: string;
  projectId?: string;
  allocatedAmount: number;
  linkedAt?: string;
  updatedAt?: string;
};
```

Storage rule:

- BOQ catalog ใช้ key เดิม `builddocs-pro.boq-catalog.v1`
- Task linkage ต้องใช้ key ใหม่ของ BOQ Data เช่น `boq-data.task-linkage.v1`
- ห้ามเก็บ linkage ปนกับ document line items

#### UI Requirements

แท็บ `Task Linkage` ใน BOQ Data ต้องมี:

- Task list
- Task detail panel
- BOQ search/picker
- Allocation amount input
- Available/allocated/remaining summary
- Warning state เมื่อ over budget
- Remove linkage
- Save locally

#### Acceptance Criteria

- ผู้ใช้สร้าง task ได้อย่างน้อย 1 รายการ
- ผู้ใช้ค้นหาและเลือก BOQ item จาก catalog ได้
- ผู้ใช้กำหนด allocated amount ต่อ BOQ item ได้
- ระบบคำนวณ total allocated, remaining, over budget ได้ทันที
- reload หน้าแล้วข้อมูล linkage ยังอยู่
- ไม่กระทบ Docs line item flow เดิม
- `npm run build` ผ่าน
- route `/boq-data?tab=task-linkage&version=0.1` เปิดได้

## 8. Docs App Requirements

BuildDocs ต้องโฟกัสเอกสาร:

- quote
- contract
- billing document
- invoice
- receipt
- document relationship
- milestone billing
- print/save PDF ผ่าน browser

Docs จะอ่าน BOQ linkage ได้ในอนาคต แต่ไม่เป็นเจ้าของ BOQ allocation

## 9. Business Apps Requirements

### Cashflow — v0.1 prototype LIVE

`cashflow` หมายถึงกระแสเงินสดของธุรกิจ/โครงการ ไม่ใช่แผนปลดหนี้ส่วนตัว

PRD ย่อย: **`docs/CASHFLOW_PRD.md`** (ครบ 10 sections — purpose, non-goals, storage contract, data model, cross-app linkage, UI flow, acceptance, future roadmap, PRD/ERD mapping)

Status:
- ✅ Income/expense data model (`src/cashflow.ts`)
- ✅ Quick-add form + entry list + draft→confirm flow (`/cashflow?tab=overview`)
- ✅ Monthly summary (income/expense/net) + Hub Dashboard tile
- ✅ Negative monthly cashflow warning + Hub pending action linking back to Cashflow review
- ✅ Adapter pattern compliant (works with both LocalStorage และ Supabase sync)
- DONE: Recurring template data layer + draft entry generation (`src/cashflow.recurring.ts`)
- DONE: Project expense/revenue rollup + Project Detail cost tab (`src/cashflow.rollup.ts`)
- PARTIAL: PO/PR/RFQ spending linkage fields exist; full BuildDocs PO posting flow still pending
- ⏳ Forecast/Reports tabs (v0.3)

### Membership + Access Control — v0.1 prototype LIVE

PRD: **`docs/MEMBERSHIP_ACCESS_PRD.md`**

Status:
- ✅ Plan + AppAccessRule + AppAccessOverride + AuditLog (`src/membership.ts`)
- ✅ Seeded 3 plans (Free, Support Monthly, Custom) + 26 rules
- ✅ `evaluateAppAccess()` ครบ PRD Section 5 evaluation order
- ✅ `WorkspaceAccessGate` ใน workspace block preview/none/deny
- ✅ Admin Console `/admin` 5 tabs (overview/plans/overrides/project-access/audit)
- ✅ `/account` + `/support-plans` ใน public site
- ⏳ Payment provider (Omise/Stripe) — v0.5
- ⏳ Anonymous→email upgrade — v0.4 Phase E

### Out Of Scope: Debt Planner

`debtPlanner` เป็น placeholder ที่ยังอยู่ใน code manifest เดิม แต่ไม่ใช่ module ของเว็บแอปนี้ในรอบปัจจุบัน ห้ามเริ่ม implement หรือแตก task ต่อจาก debt payoff โดยไม่มีคำสั่ง re-scope ใหม่จาก owner

## 9.1 Design Apps Requirements

### Design Studio

`designStudio` เป็นฐานของ design workflow ปัจจุบัน ต้องค่อย ๆ ขยายจาก prompt/render ไปสู่ระบบออกแบบที่ใช้ซ้ำได้:

- prompt builder
- style/material/light controls
- design option history
- generated image library
- project/design brief link
- export/share concept board
- handoff note ไป `BuildDocs`, `BOQ Data`, `BIM Link` และ `Library`

### Design Brief

ต้องมี PRD ย่อยก่อน implement:

- client need
- project type
- room/space requirement
- budget range
- style preference
- site condition
- design constraints
- acceptance criteria สำหรับ brief completeness

### Plan Review / Architect Brain

PRD ย่อยอยู่ที่ `docs/DESIGN_PLAN_REVIEW_PRD.md`

เป้าหมายคือให้ผู้ใช้ใส่ brief หรือ upload แปลน แล้วได้ structured findings แบบสถาปนิก:

- feasibility score
- code/zoning checklist เบื้องต้น
- architecture design issues
- engineering feasibility hints
- Thai living/tropical design comments
- optional fengshui advisory
- cost/BOQ readiness
- next actions
- client-ready report

ผลลัพธ์เป็น advisory review ไม่ใช่ legal/engineering certification และต้องเก็บ source file แยกจาก structured result เพื่อย้อนตรวจได้

### Moodboard

ต้องมี PRD ย่อยก่อน implement:

- reference image/file
- material palette
- color palette
- style tag
- AI prompt notes
- source attribution
- link to design option

### Presentation Builder

ต้องมี PRD ย่อยก่อน implement:

- slide/section structure
- concept image
- project note
- design option comparison
- estimate summary
- export PDF/print
- client approval status

## 10. Shared UX Requirements

- โทนหลัก: ขาว เทา สะอาด ใช้งานง่าย
- Font: ใช้โครง typography กลางของแอป
- หน้าแรกของแต่ละ app ต้องเป็น usable workspace ไม่ใช่ landing page
- UI ต้องรองรับ desktop ก่อน และไม่พังบน mobile
- Sidebar ต้องแยก app group กับ active app tabs ชัดเจน
- Topbar ต้องมี language switcher ที่เปลี่ยนภาษาได้จริง
- Version selector ต้องเก็บค่าใน `localStorage`

## 11. Quality Gates

งานพัฒนาเสร็จเมื่อ:

- PRD/spec ของ feature มีอยู่ก่อน implementation
- `npm run build` ผ่าน
- route ที่เกี่ยวข้องตอบ 200 หรือเปิดใน browser ได้
- ไม่ทำให้ storage key เดิมเสีย
- ไม่ hardcode ภาษาใน shared UI
- ไม่เพิ่ม backend/provider dependency โดยไม่ผ่าน decision log

## 12. Release Plan

### v0.1 — ✅ DONE

- ✅ Stabilize shell, sidebar, topbar, language, app version
- ✅ Stabilize Docs and BOQ Data prototype
- ✅ Add BOQ Task-to-BOQ Linkage local-first
- ✅ (bonus) Storage adapter pattern + Memory adapter for tests

### v0.2 — IN PROGRESS

- ⏳ Connect BOQ linkage to Docs read-only
- ⏳ Add basic PO spending model
- ⏳ Start Team check-in/out PRD
- DONE: Recurring cashflow items
- DONE: Project-scoped cashflow filter + rollup

### v0.3 — MOSTLY DONE (foundation), apps pending

- ✅ Cashflow PRD (`docs/CASHFLOW_PRD.md`) and first implementation
- ✅ Defect Site Report tab + EvidenceAsset bridge + floor/room/zone/viewpoint metadata + location pin board (`docs/BUILK360_SITE_REPORT_ANALYSIS.md`) + Site Report 360 PRD (`docs/SITE_REPORT_360_PRD.md`)
- ⏳ Design Brief PRD and first implementation
- ✅ Plan Review / Architect Brain PRD (`docs/DESIGN_PLAN_REVIEW_PRD.md`) — implementation pending
- ✅ Facebook Content Workflow PRD (`docs/FACEBOOK_CONTENT_WORKFLOW_PRD.md`) — implementation pending
- ✅ Prompt Set Library PRD (`docs/PROMPT_SET_LIBRARY_PRD.md`) — implementation pending
- ✅ App taxonomy (`docs/APP_TAXONOMY.md` Section 2-9 + `src/apps.ts` 6 fields)
- ✅ Public route map for `/`, `/apps`, `/tools`, `/prompts`, `/workflows`, `/roadmap`, `/pricing`, `/developer` (router ใน `src/PublicSite.tsx`; Roadmap component แยกที่ `src/public/RoadmapPage.tsx`)

### v0.4 — DONE (architecture), Phase D/E pending

- ✅ Production backend adapter — `src/storageAdapter.ts` + `SupabaseAdapter`
- ⏳ Image/file storage strategy — รอ Supabase Storage bucket setup
- ✅ Auth + domain hosting plan — Supabase Auth (magic link + anonymous), Netlify recommended
- ✅ Write Agent Control Layer PRD section (Master PRD Section 3.5; standalone sub-PRD ยังไม่ทำ)
- ⏳ Moodboard and Design Options PRD

### v0.5 — IN PROGRESS

- ✅ Public website PRD — `docs/PUBLIC_ROUTES.md` + Master PRD Section 0 + implementation snapshot
- ✅ Membership/support plan PRD (`docs/MEMBERSHIP_ACCESS_PRD.md`) — implemented ครบ Section 5 evaluation
- ⏳ Decide payment/subscription provider (Omise for Thai PromptPay + Stripe for international)
- ⏳ Add safe Agent API prototype for read/draft actions only
- ⏳ Presentation Builder PRD and design-to-docs handoff

### v0.6

- Add multi-profession app marketplace PRD
- ✅ Add profession pack taxonomy and access rules — `WorkspaceAppProfessionTag` 15 tags + tag ทุก app แล้ว
- ⏳ Identify first non-construction app pack to test market demand
- ⏳ Add LINE Agent receipt/document intake after storage, auth, and audit model are ready

### v0.7

- ⏳ Add cross-profession collaboration PRD
- ⏳ Define role/access model — partial (workspace_members has role column, scopes defined)
- ⏳ Start with read-only share/export/request workflows before editable multi-user collaboration

### Future: BIM And IoT Integration

- ⏳ Add `BIM Link Layer` after wedge apps prove real usage
- ⏳ Add `IoT Device Layer` only after project/space/asset data model is stable
- Market this as advanced capability or enterprise/service package, not the first public message

## 13. Open Questions

### Resolved

- ✅ **Production hosting** → Netlify (static) + Supabase (backend) — `netlify.toml` + `docs/SUPABASE_SETUP.md` ready
- ✅ **ข้อมูลระยะยาวเก็บที่ไหน** → localStorage default + Supabase opt-in via `kv_store` table; relational mappers (Phase D) ทำเพิ่มได้
- ✅ **Free vs login users** → Per `MEMBERSHIP_ACCESS_PRD` Section 5; default Free plan = quick access ของ free apps + preview ของ paid apps (`WorkspaceAccessGate` block preview level)
- ✅ **Wedge app แรก** → BOQ Data (active prototype), BuildDocs (usable prototype), Cashflow (v0.1 ready) — owner เลือกได้
- ✅ **Design wedge app แรก** → Plan Review / Architect Brain (PRD ready ที่ `docs/DESIGN_PLAN_REVIEW_PRD.md`)
- ✅ **Profession tags** → 15 tags ใน `WorkspaceAppProfessionTag`, ทุก app tag แล้ว

### Still open

- ⏳ **รูปภาพ/ไฟล์ project storage** → ตอนนี้ defect photos เก็บ base64 ใน localStorage; ต้องย้ายไป Supabase Storage bucket ก่อน production
- ⏳ **LINE/Agent workflow backend** → ใช้ Supabase Edge Function หรือ Netlify Function (ยังไม่ได้ตัดสิน)
- ⏳ **Agent tools allowlist** → PRD Section 3.5 ระบุ tool classes (Read/Draft/Write/Search/Handoff) แต่ยังไม่ได้ระบุ tool list จริง
- ⏳ **Internal Agent CLI scope** → owner/admin only หรือเปิด support operator
- ⏳ **Payment provider** → Omise (Thai PromptPay) + Stripe (international) เป็น recommendation, ยังไม่เริ่ม integrate
- ⏳ **Support quota unit** → request count vs hour vs job; current PlansState ใช้ `supportQuota: integer` (request count) เป็นค่าเริ่มต้น
- ⏳ **อาชีพที่สอง** → professionTags array รองรับแล้ว, แต่ยังไม่เลือก first non-construction pack
- ⏳ **Profession pack pricing** → ยังไม่ตัดสิน per pack vs membership tier
- ⏳ **Collaboration first workflow** → ขอราคา / ส่งเอกสาร / review / support / project handoff
- ⏳ **External collaborator access** → share link / invite email / login / ผสม
- ⏳ **Plan Review knowledge source** → import KG / API bridge to `arch-brain-web` / rebuild
- ⏳ **Design output sharing format** → PDF / image board / public share link / client approval link

### Open questions ที่ Codex (continue dev) ควรพิจารณาก่อน

1. Phase D relational mappers: `cashflow.entries.v1` ควร map ไป `cashflow_entries` table 1:1 (one row per entry) หรือ keep aggregate ใน kv_store?
2. Anonymous → email upgrade flow (Phase E): ใช้ Supabase `linkIdentity` API หรือ migrate workspace ownership manually?
3. Realtime sync conflict resolution: last-write-wins (ตอนนี้) vs CRDT vs server-authority?
4. Module split (P0-004): แตก App.tsx ตาม app folder (`src/workspace/builddocs/`, `src/workspace/boq-data/`) หรือตาม layer (component/state/api)?
5. Production deploy strategy: deploy preview ทุก branch หรือเฉพาะ main?
6. Workspace switching UI: ถ้า user มีหลาย workspace, ควร switch ที่ topbar หรือใน `/account`?
