export type RoadmapLanguage = "th" | "en";

export type RoadmapStatus = "done" | "in_progress" | "next" | "planned";

export type RoadmapText = Record<RoadmapLanguage, string>;

export type RoadmapMilestone = {
  id: string;
  status: RoadmapStatus;
  phase: string;
  title: RoadmapText;
  summary: RoadmapText;
  shipped: RoadmapText[];
  next: RoadmapText[];
};

export type RoadmapFocus = {
  status: RoadmapStatus;
  label: RoadmapText;
  detail: RoadmapText;
};

export const ROADMAP_LAST_UPDATED = "2026-05-25";
export const ROADMAP_VERSION_LABEL = "v0.4.28";
export const ROADMAP_TEST_LABEL = "580/580 tests pass";
export const ROADMAP_BUILD_LABEL = "build pass · first-run checklist on Hub (4-step guided onboarding for alpha testers)";

export const roadmapHero = {
  title: {
    th: "Roadmap การพัฒนา Buildbybim.space",
    en: "Buildbybim.space Development Roadmap"
  },
  lede: {
    th:
      "หน้านี้สรุปให้ผู้ใช้เห็นว่าเว็บพัฒนาไปถึงจุดไหนแล้ว อะไรเปิดทดลองใช้ได้ และงานถัดไปคืออะไร",
    en:
      "A user-facing view of what has shipped, what is usable now, and what is coming next."
  },
  note: {
    th:
      "หลังงานพัฒนาแต่ละครั้ง ต้องอัปเดต Roadmap พร้อม PRD/TASKS เพื่อให้ตรวจสอบทิศทางและความคืบหน้าได้",
    en:
      "After every development task, update this Roadmap together with PRD/TASKS so progress stays auditable."
  }
} satisfies Record<string, RoadmapText>;

export const roadmapStatusCopy: Record<RoadmapStatus, RoadmapText> = {
  done: { th: "เสร็จแล้ว", en: "Done" },
  in_progress: { th: "กำลังพัฒนา", en: "In progress" },
  next: { th: "ทำต่อ", en: "Next" },
  planned: { th: "วางแผนไว้", en: "Planned" }
};

export const roadmapMilestones: RoadmapMilestone[] = [
  {
    id: "foundation",
    status: "done",
    phase: "01",
    title: {
      th: "โครงแพลตฟอร์มและเว็บหลัก",
      en: "Platform shell and public website"
    },
    summary: {
      th:
        "วางโครง public site, workspace shell, app manifest, language switcher, access plan, storage adapter และ roadmap page แล้ว",
      en:
        "Public site, workspace shell, app manifest, language switcher, access plan, storage adapter, and roadmap page are in place."
    },
    shipped: [
      {
        th: "Public routes: /, /apps, /tools, /prompts, /workflows, /roadmap, /pricing, /developer, /account, /support-plans",
        en: "Public routes: /, /apps, /tools, /prompts, /workflows, /roadmap, /pricing, /developer, /account, /support-plans"
      },
      {
        th: "Workspace shell พร้อม route, subnav, version query และ language persistence",
        en: "Workspace shell with route, subnav, version query, and language persistence"
      },
      {
        th: "Sidebar, app switcher, breadcrumb, topbar และ BuildDocs document library ใช้ copy กลางสองภาษา",
        en: "Sidebar, app switcher, breadcrumb, topbar, and the BuildDocs document library now use shared bilingual copy."
      },
      {
        th: "BuildDocs action bar, document tabs, workflow cards และ preview title ใช้ buildDocsCopy สำหรับ TH/EN",
        en: "BuildDocs action bar, document tabs, workflow cards, and preview title now use buildDocsCopy for TH/EN."
      },
      {
        th: "เพิ่ม language registry, locale/direction metadata และ fallback copy helper เพื่อให้เพิ่มภาษาใหม่ได้จาก config + dictionary",
        en: "Added a language registry, locale/direction metadata, and fallback copy helper so new languages can be added through config and dictionaries."
      },
      {
        th: "แยก shell helpers ไปที่ src/workspace/shell/* เพื่อลดการชนกันของหลาย agent",
        en: "Shell helpers split into src/workspace/shell/* to reduce multi-agent collisions"
      },
      {
        th: "แยกหน้า /roadmap ไปที่ src/public/RoadmapPage.tsx เพื่อลดขนาด PublicSite.tsx และลด conflict ระหว่าง agent",
        en: "Split /roadmap into src/public/RoadmapPage.tsx to reduce PublicSite.tsx size and multi-agent conflicts"
      }
    ],
    next: [
      {
        th: "แยก shell UI components ออกจาก App.tsx ต่อ",
        en: "Continue extracting shell UI components from App.tsx"
      },
      {
        th: "ลดขนาด workspace bundle ด้วย dynamic imports เพิ่มเติม",
        en: "Reduce workspace bundle size with more dynamic imports"
      }
    ]
  },
  {
    id: "construction-core",
    status: "in_progress",
    phase: "02",
    title: {
      th: "แกนงานก่อสร้างและ Cost Control",
      en: "Construction and cost-control core"
    },
    summary: {
      th:
        "แกน ERP สำหรับงานก่อสร้างเปิดใช้แบบ prototype แล้ว: Projects, Construction Planner, Cost Codes, Suppliers, PR/RFQ, Cashflow, Project Control, Approval Center และ Evidence",
      en:
        "The construction ERP core is usable as a prototype: Projects, Construction Planner, Cost Codes, Suppliers, PR/RFQ, Cashflow, Project Control, Approval Center, Evidence, Project RBAC, document authority, and project-scoped access enforcement."
    },
    shipped: [
      { th: "Projects: รายการโครงการ + detail + cost tab", en: "Projects: project list, detail view, and cost tab" },
      { th: "Cost Codes + Suppliers + price history", en: "Cost Codes, Suppliers, and price history" },
      { th: "Procurement: Purchase Request + RFQ comparison + award flow", en: "Procurement: Purchase Request, RFQ comparison, and award flow" },
      { th: "Cashflow: project rollup + recurring templates", en: "Cashflow: project rollup and recurring templates" },
      { th: "Project Control: dashboard + 5 standard reports + Construction Planner baseline rollup", en: "Project Control: dashboard, 5 standard reports, and Construction Planner baseline rollup" },
      {
        th: "Project Control: drill-down จาก cost breakdown ไป BOQ Data task linkage ต้นทาง พร้อม source row จาก Construction Planner",
        en: "Project Control: cost-breakdown drill-down into BOQ Data task linkage, including Construction Planner source rows"
      },
      {
        th: "Construction Planner Preview: เปิดไฟล์ seed จาก Excel เป็น workbook-style sheet preview พร้อม sync local-first เข้า Projects, BOQ Data task linkage/catalog และ Project Control budget baseline",
        en: "Construction Planner Preview: Excel-seeded workbook-style sheet preview with local-first sync into Projects, BOQ Data task linkage/catalog, and the Project Control budget baseline"
      },
      { th: "Project RBAC + document authority foundation + BuildDocs stamps + action enforcement", en: "Project RBAC, document authority foundation, BuildDocs stamps, Approval Center authority linkage, and BuildDocs/Approval action enforcement" },
      {
        th: "Project Access enforcement: Projects list/detail/create/edit/delete และ BuildDocs print/share/backup export ถูกคุมด้วย grant รายโครงการ",
        en: "Project Access enforcement: Projects list/detail/create/edit/delete and BuildDocs print/share/backup export are now guarded by project grants"
      },
      {
        th: "Project Access enforcement: Procurement, Cashflow และ Project Control scope ข้อมูลตาม grant และ guard write/confirm/approve/award ก่อนบันทึก",
        en: "Project Access enforcement: Procurement, Cashflow, and Project Control now scope data by grants and guard write/confirm/approve/award actions before saving"
      },
      {
        th: "Admin Project Access tab สำหรับกำหนด role, supplier scope, permission override และ access check รายโครงการ",
        en: "Admin Project Access tab for project-scoped roles, supplier scope, permission overrides, and access checks"
      },
      { th: "Approval Center + Evidence gate สำหรับ warn/block approval", en: "Approval Center plus Evidence gate for warn/block approval decisions" },
      {
        th: "Defect: Site Report tab พร้อม event filter, time compare, report deep link, EvidenceAsset 360/ไฟล์ไซต์, metadata ชั้น/ห้อง/โซน/viewpoint และ location pin board สำหรับกรอง report/evidence ตามจุดไซต์",
        en: "Defect: Site Report tab with event filters, time compare, report deep link, EvidenceAsset support for 360/site file links, floor/room/zone/viewpoint metadata, and a location pin board for scoped report/evidence review"
      },
      {
        th: "Site Report 360 PRD พร้อมต่อยอดเป็น plan pin board, capture set, same-pin compare, comment-to-task, File Center และ report templates",
        en: "Site Report 360 PRD is ready for plan pins, capture sets, same-pin compare, comment-to-task, File Center, and report templates"
      },
      {
        th: "BOQ Data: เพิ่ม Column picker สำหรับซ่อน/แสดงคอลัมน์ตารางตามงานที่ต้องดู พร้อมจำค่าไว้ใน localStorage",
        en: "BOQ Data: added a column picker to show/hide table columns per workflow, with localStorage persistence"
      },
      {
        th: "BOQ Data: เพิ่มการตั้งค่า Filter หลักและตัวเลือกซ่อนปุ่ม Actions ที่ใช้ไม่ได้ พร้อมจำค่าไว้ใน localStorage",
        en: "BOQ Data: added primary-filter persistence and an option to hide unusable Actions buttons, both saved in localStorage"
      },
      {
        th: "BOQ Data: เพิ่ม Public data hub สำหรับสรุปชุดข้อมูลราคาและดาวน์โหลด Public CSV สำหรับแจกใช้งานต่อ",
        en: "BOQ Data: added a Public data hub summary and a clean Public CSV download for external reuse"
      },
      {
        th: "BOQ Data: เพิ่ม publish workflow ด้วยสถานะ Public/Review/Private, เจ้าของข้อมูล, License และ source update log",
        en: "BOQ Data: added a publish workflow with Public/Review/Private status, data owner, license, and source update log"
      }
    ],
    next: [
      {
        th: "ทำ Site Report Plan Pin board จาก docs/SITE_REPORT_360_PRD.md Phase 1",
        en: "Build the Site Report Plan Pin board from docs/SITE_REPORT_360_PRD.md Phase 1"
      },
      {
        th: "ทำ relational mapper ให้ข้อมูลหลัก sync ไป Supabase tables แทน kv_store",
        en: "Add relational mappers so core data syncs to Supabase tables instead of only kv_store"
      },
      {
        th: "เพิ่ม Supabase Storage bucket สำหรับ evidence files และรูปภาพ",
        en: "Add Supabase Storage bucket support for evidence files and images"
      },
      {
        th: "ต่อยอด Construction Planner จาก read-only preview ไปสู่ edit/dependency/export เมื่อ workflow ชัดเจน",
        en: "Extend Construction Planner from read-only preview into edit/dependency/export once the workflow is clear"
      }
    ]
  },
  {
    id: "user-growth",
    status: "in_progress",
    phase: "03",
    title: {
      th: "การใช้งานจริง รายได้ และหน้า public",
      en: "Real usage, revenue, and public pages"
    },
    summary: {
      th:
        "เริ่มวางเส้นทางจากผู้ใช้ใหม่ ไปยังแอปฟรี workspace support plan และ roadmap ที่บอกสถานะโปรเจกต์อย่างโปร่งใส",
      en:
        "The funnel from visitor to free app, workspace, support plan, and transparent project status is being shaped."
    },
    shipped: [
      { th: "App marketplace ดึงข้อมูลจาก src/apps.ts", en: "App marketplace reads from src/apps.ts" },
      { th: "Support plan + account pages พร้อม access matrix", en: "Support plan and account pages with access matrix" },
      { th: "Roadmap public page สำหรับบอกความคืบหน้าผู้ใช้", en: "Public roadmap page for user-facing progress" }
    ],
    next: [
      { th: "ทำ landing สำหรับ wedge app แรกที่โปรโมตจริง", en: "Build the first real wedge-app landing page" },
      { th: "ตัดสินใจ payment provider ก่อนรับเงินจริง", en: "Finalize payment provider before accepting real payments" }
    ]
  },
  {
    id: "ai-workflow",
    status: "next",
    phase: "04",
    title: {
      th: "AI Workflow, Prompt และ LINE Agent",
      en: "AI Workflow, prompts, and LINE Agent"
    },
    summary: {
      th:
        "มี PRD สำหรับ prompt/workflow/agent แล้ว ขั้นต่อไปคือ prototype ที่รับไฟล์ รูป หรือข้อความ แล้วแปลงเป็น draft data ให้ผู้ใช้ตรวจ",
      en:
        "Prompt, workflow, and agent PRDs exist. Next is a prototype that turns files, images, or messages into reviewable draft data."
    },
    shipped: [
      { th: "Agent direction, tool safety และ audit requirements อยู่ใน PRD/ARCHITECTURE", en: "Agent direction, tool safety, and audit requirements are in PRD/ARCHITECTURE" },
      { th: "Prompt Set Library PRD และ Facebook Content Workflow PRD พร้อมเริ่มทำ", en: "Prompt Set Library PRD and Facebook Content Workflow PRD are ready" }
    ],
    next: [
      { th: "LINE receipt/file intake -> draft expense/document/cashflow", en: "LINE receipt/file intake -> draft expense/document/cashflow" },
      { th: "Prompt Set Library catalog + prompt builder", en: "Prompt Set Library catalog and prompt builder" },
      { th: "Facebook Content Workflow draft-first prototype", en: "Draft-first Facebook Content Workflow prototype" }
    ]
  },
  {
    id: "backend",
    status: "planned",
    phase: "05",
    title: {
      th: "Backend, Sync, Payment และความปลอดภัย",
      en: "Backend, sync, payment, and security"
    },
    summary: {
      th:
        "ระบบยัง local-first เป็นหลัก และมี Supabase scaffold แล้ว งานถัดไปคือข้อมูล production-grade, file storage, payment และ realtime",
      en:
        "The system remains local-first with Supabase scaffolding. Next is production-grade data, file storage, payment, and realtime sync."
    },
    shipped: [
      { th: "Storage adapter + Supabase scaffold + migrations ชุดแรก", en: "Storage adapter, Supabase scaffold, and first migrations" },
      { th: "Membership/access model + admin overrides + audit direction", en: "Membership/access model, admin overrides, and audit direction" }
    ],
    next: [
      { th: "Relational mappers สำหรับ projects/cost codes/suppliers/PR/RFQ/cashflow/approvals/evidence", en: "Relational mappers for projects, cost codes, suppliers, PR/RFQ, cashflow, approvals, and evidence" },
      { th: "Backup/export MVP และ file/image storage plan", en: "Backup/export MVP and file/image storage plan" },
      { th: "Project access and document authority relational mapper", en: "Project access and document authority relational mapper" },
      { th: "Payment provider: Omise/PromptPay + Stripe", en: "Payment provider: Omise/PromptPay plus Stripe" }
    ]
  }
];

export const roadmapCurrentFocus: RoadmapFocus[] = [
  {
    status: "done",
    label: { th: "Extensible workspace i18n base", en: "Extensible workspace i18n base" },
    detail: {
      th: "ยังเปิดใช้งานแค่ TH/EN แต่ workspaceLanguage มี registry, locale, direction และ fallback helper แล้ว เพื่อเพิ่มภาษาใหม่ได้โดยขยาย config + copy maps",
      en: "Only TH/EN are enabled now, but workspaceLanguage now has a registry, locale, direction, and fallback helper so new languages can be added by extending config and copy maps."
    }
  },
  {
    status: "in_progress",
    label: { th: "Construction ERP prototype", en: "Construction ERP prototype" },
    detail: {
      th: "Construction Planner sync เข้า Projects, BOQ Data และ Project Control แล้ว; Site Report 360 มี PRD สำหรับ Plan Pin board ถัดไป",
      en: "Project Control can drill down into BOQ task-linkage sources, and Site Report 360 now has a PRD for the next Plan Pin board slice."
    }
  },
  {
    status: "next",
    label: { th: "งานต่อไป", en: "Next work" },
    detail: {
      th: "Site Report Plan Pin board, relational mapper, Supabase Storage, Evidence follow-up, LINE/AI intake และ payment decision",
      en: "Site Report Plan Pin board, relational mappers, Supabase Storage, Evidence follow-up, LINE/AI intake, and payment decision."
    }
  }
];

export const roadmapUpdateRules: RoadmapText[] = [
  {
    th: "หลังแก้ feature หรือ app ต้องอัปเดต milestone/status ใน src/roadmap.ts",
    en: "After changing a feature or app, update milestone/status in src/roadmap.ts."
  },
  {
    th: "ถ้าเพิ่ม route/app ใหม่ ต้องอัปเดต src/apps.ts, docs/PRD.md, docs/TASKS.md และหน้า Roadmap",
    en: "When adding a route/app, update src/apps.ts, docs/PRD.md, docs/TASKS.md, and the Roadmap page."
  },
  {
    th: "ถ้า test/build/smoke เปลี่ยน ต้องบันทึกผลล่าสุดใน TASKS และ Roadmap",
    en: "When test/build/smoke status changes, record the latest result in TASKS and Roadmap."
  }
];
