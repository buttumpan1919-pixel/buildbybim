export type WorkspaceAppId =
  | "hub"
  | "projects"
  | "costCodes"
  | "suppliers"
  | "procurement"
  | "projectControl"
  | "approvals"
  | "evidence"
  | "builddocs"
  | "boqData"
  | "constructionPlanner"
  | "designStudio"
  | "library"
  | "defectTracker"
  | "employees"
  | "socialFeed"
  | "agentChat"
  | "debtPlanner"
  | "cashflow"
  | "clientOps"
  | "admin";

export type WorkspaceAppStatus = "ready" | "prototype" | "next" | "planned";

// Taxonomy per docs/APP_TAXONOMY.md Sections 3-9
export type WorkspaceAppCategory =
  | "construction"
  | "design"
  | "business"
  | "ai_workflow"
  | "auto_workflow"
  | "tools"
  | "prompt_assets"
  | "agent"
  | "platform"
  | "bim_iot";

export type WorkspaceAppProfessionTag =
  | "architect"
  | "designer"
  | "contractor"
  | "site_team"
  | "engineer"
  | "qs_estimator"
  | "owner_developer"
  | "supplier_vendor"
  | "admin_accounting"
  | "sales_marketing"
  | "small_business"
  | "freelancer"
  | "consultant"
  | "personal"
  | "support_operator";

export type WorkspaceAppMonetization =
  | "free"
  | "freemium"
  | "member"
  | "paid_app"
  | "paid_pack"
  | "support_plan"
  | "custom";

export type WorkspaceAppAccessLevel =
  | "none"
  | "preview"
  | "quick"
  | "saved"
  | "read"
  | "write"
  | "export"
  | "admin"
  | "support";

export type WorkspaceAppPrivacyLevel =
  | "public"
  | "anonymous"
  | "personal"
  | "workspace"
  | "project"
  | "sensitive"
  | "admin_only";

export type WorkspaceAppAiUsage =
  | "none"
  | "optional"
  | "required"
  | "agent"
  | "external_api";

export type WorkspaceAppVersionDefinition = {
  id: string;
  label: string;
  shortLabel: string;
  stageLabel: string;
  description: string;
  storageKey: string;
};

export type WorkspaceAppDefinition = {
  id: WorkspaceAppId;
  label: string;
  shortLabel: string;
  description: string;
  status: WorkspaceAppStatus;
  statusLabel: string;
  routeBase: string;
  storageKey: string;
  versions: WorkspaceAppVersionDefinition[];
  // Taxonomy fields (required per APP_TAXONOMY.md Section 2)
  category: WorkspaceAppCategory;
  professionTags: WorkspaceAppProfessionTag[];
  monetization: WorkspaceAppMonetization;
  accessLevel: WorkspaceAppAccessLevel;
  privacyLevel: WorkspaceAppPrivacyLevel;
  aiUsage: WorkspaceAppAiUsage;
};

export const workspaceAppCategoryCopy: Record<
  WorkspaceAppCategory,
  { th: string; en: string }
> = {
  construction: { th: "ก่อสร้าง", en: "Construction" },
  design: { th: "ออกแบบ", en: "Design" },
  business: { th: "ธุรกิจ", en: "Business" },
  ai_workflow: { th: "AI Workflow", en: "AI Workflow" },
  auto_workflow: { th: "Auto Workflow", en: "Auto Workflow" },
  tools: { th: "Tools", en: "Tools" },
  prompt_assets: { th: "Prompt", en: "Prompt" },
  agent: { th: "Agent", en: "Agent" },
  platform: { th: "Platform", en: "Platform" },
  bim_iot: { th: "BIM/IoT", en: "BIM/IoT" }
};

export const workspaceAppMonetizationCopy: Record<
  WorkspaceAppMonetization,
  { th: string; en: string }
> = {
  free: { th: "ฟรี", en: "Free" },
  freemium: { th: "Freemium", en: "Freemium" },
  member: { th: "Member", en: "Member" },
  paid_app: { th: "Paid App", en: "Paid App" },
  paid_pack: { th: "Paid Pack", en: "Paid Pack" },
  support_plan: { th: "Support Plan", en: "Support Plan" },
  custom: { th: "Custom", en: "Custom" }
};

export const workspaceAppPrivacyCopy: Record<
  WorkspaceAppPrivacyLevel,
  { th: string; en: string }
> = {
  public: { th: "Public", en: "Public" },
  anonymous: { th: "Anonymous", en: "Anonymous" },
  personal: { th: "ส่วนตัว", en: "Personal" },
  workspace: { th: "Workspace", en: "Workspace" },
  project: { th: "Project", en: "Project" },
  sensitive: { th: "Sensitive", en: "Sensitive" },
  admin_only: { th: "Admin", en: "Admin only" }
};

export const workspaceAppAiUsageCopy: Record<
  WorkspaceAppAiUsage,
  { th: string; en: string }
> = {
  none: { th: "ไม่ใช้ AI", en: "No AI" },
  optional: { th: "AI ตัวช่วย", en: "Optional AI" },
  required: { th: "ใช้ AI", en: "AI required" },
  agent: { th: "Agent", en: "Agent" },
  external_api: { th: "External AI", en: "External AI" }
};

export const defaultWorkspaceAppId: WorkspaceAppId = "hub";

function versionDraft(storageKey: string): WorkspaceAppVersionDefinition[] {
  return [
    {
      id: "0.1",
      label: "V0.1",
      shortLabel: "V0.1",
      stageLabel: "Draft",
      description: "Draft module under review before production approval",
      storageKey
    }
  ];
}

export const workspaceApps: WorkspaceAppDefinition[] = [
  {
    id: "hub",
    label: "ศูนย์รวมแอป",
    shortLabel: "Hub",
    description: "หน้าเลือกเครื่องมือและดูสถานะงานรวม",
    status: "prototype",
    statusLabel: "V0.1",
    routeBase: "/hub",
    storageKey: "builddocs-pro.workspace.v1",
    versions: versionDraft("builddocs-pro.workspace.v1"),
    category: "platform",
    professionTags: ["architect", "contractor", "designer", "admin_accounting"],
    monetization: "free",
    accessLevel: "read",
    privacyLevel: "workspace",
    aiUsage: "none"
  },
  {
    id: "projects",
    label: "โครงการ",
    shortLabel: "Projects",
    description:
      "เริ่มต้น Cost Control — สร้างโครงการ ผูกลูกค้า งบ และต้นทุน แล้วใช้ต่อใน PR/RFQ/บันทึกต้นทุน",
    status: "prototype",
    statusLabel: "V0.1",
    routeBase: "/projects",
    storageKey: "projects.list.v1",
    versions: versionDraft("projects.list.v1"),
    category: "construction",
    professionTags: ["contractor", "qs_estimator", "architect", "admin_accounting"],
    monetization: "freemium",
    accessLevel: "write",
    privacyLevel: "workspace",
    aiUsage: "optional"
  },
  {
    id: "costCodes",
    label: "หมวดต้นทุน (Cost Codes)",
    shortLabel: "Codes",
    description:
      "Cost Code (CBS) — spine ของระบบ Cost Control · ทุก PR/RFQ/บันทึกต้นทุน ผูกกับ code นี้",
    status: "prototype",
    statusLabel: "V0.1",
    routeBase: "/cost-codes",
    storageKey: "cost-codes.catalog.v1",
    versions: versionDraft("cost-codes.catalog.v1"),
    category: "construction",
    professionTags: ["qs_estimator", "contractor", "architect"],
    monetization: "freemium",
    accessLevel: "write",
    privacyLevel: "workspace",
    aiUsage: "optional"
  },
  {
    id: "suppliers",
    label: "Suppliers",
    shortLabel: "Suppliers",
    description:
      "ไดเรคทอรี supplier + price history · ใช้ใน RFQ และ cost recording · auto-detect ประเภทจากชื่อบริษัท",
    status: "prototype",
    statusLabel: "V0.1",
    routeBase: "/suppliers",
    storageKey: "suppliers.directory.v1",
    versions: versionDraft("suppliers.directory.v1"),
    category: "construction",
    professionTags: ["contractor", "qs_estimator", "admin_accounting"],
    monetization: "freemium",
    accessLevel: "write",
    privacyLevel: "workspace",
    aiUsage: "optional"
  },
  {
    id: "procurement",
    label: "Procurement",
    shortLabel: "PR/RFQ",
    description:
      "Purchase Request + RFQ workflow · ผูก Project + Cost Code + Supplier · มี state machine 10 สถานะ",
    status: "prototype",
    statusLabel: "V0.1",
    routeBase: "/procurement",
    storageKey: "procurement.pr.v1",
    versions: versionDraft("procurement.pr.v1"),
    category: "construction",
    professionTags: ["qs_estimator", "contractor", "admin_accounting"],
    monetization: "freemium",
    accessLevel: "write",
    privacyLevel: "workspace",
    aiUsage: "optional"
  },
  {
    id: "projectControl",
    label: "Project Control",
    shortLabel: "Control",
    description:
      "Dashboard + 5 รายงาน — budget vs committed vs actual · variance alert · cashflow forecast · supplier spend · PR aging",
    status: "prototype",
    statusLabel: "V0.1",
    routeBase: "/project-control",
    storageKey: "project-control.settings.v1",
    versions: versionDraft("project-control.settings.v1"),
    category: "construction",
    professionTags: ["qs_estimator", "owner_developer", "contractor", "admin_accounting"],
    monetization: "freemium",
    accessLevel: "read",
    privacyLevel: "workspace",
    aiUsage: "optional"
  },
  {
    id: "approvals",
    label: "Approval Center",
    shortLabel: "Approvals",
    description:
      "กล่องรวมงานอนุมัติสำหรับ PR, Cashflow, PO และ Invoice พร้อม audit log ต่อ transaction",
    status: "prototype",
    statusLabel: "V0.1",
    routeBase: "/approvals",
    storageKey: "approvals.requests.v1",
    versions: versionDraft("approvals.requests.v1"),
    category: "business",
    professionTags: ["owner_developer", "contractor", "admin_accounting", "qs_estimator"],
    monetization: "freemium",
    accessLevel: "write",
    privacyLevel: "workspace",
    aiUsage: "none"
  },
  {
    id: "evidence",
    label: "Evidence",
    shortLabel: "Evidence",
    description:
      "คลังหลักฐานกลางสำหรับใบเสร็จ รูปหน้างาน ใบเสนอราคา invoice และไฟล์ตรวจรับที่ผูกกับ Project, Cost Code, Supplier, PR/RFQ และ Cashflow",
    status: "prototype",
    statusLabel: "V0.1",
    routeBase: "/evidence",
    storageKey: "evidence.assets.v1",
    versions: versionDraft("evidence.assets.v1"),
    category: "construction",
    professionTags: ["site_team", "contractor", "qs_estimator", "admin_accounting"],
    monetization: "freemium",
    accessLevel: "write",
    privacyLevel: "workspace",
    aiUsage: "optional"
  },
  {
    id: "builddocs",
    label: "BuildDocs Pro",
    shortLabel: "Docs",
    description: "เอกสาร ใบเสนอราคา ใบสั่งซื้อ ใบแจ้งหนี้ ใบเสร็จ และสัญญา",
    status: "prototype",
    statusLabel: "V0.1",
    routeBase: "/docs",
    storageKey: "builddocs-pro.workspace.v1",
    versions: versionDraft("builddocs-pro.workspace.v1"),
    category: "business",
    professionTags: ["admin_accounting", "contractor", "architect", "small_business"],
    monetization: "freemium",
    accessLevel: "write",
    privacyLevel: "workspace",
    aiUsage: "none"
  },
  {
    id: "boqData",
    label: "BOQ Data",
    shortLabel: "BOQ",
    description: "ฐานข้อมูลราคากลางสำหรับค้นหา Keynote และดึงรายการไปใช้ใน BOQ",
    status: "prototype",
    statusLabel: "V0.1",
    routeBase: "/boq-data",
    storageKey: "boq-data.workspace.v1",
    versions: versionDraft("boq-data.workspace.v1"),
    category: "construction",
    professionTags: ["qs_estimator", "contractor", "architect", "site_team"],
    monetization: "freemium",
    accessLevel: "write",
    privacyLevel: "workspace",
    aiUsage: "none"
  },
  {
    id: "constructionPlanner",
    label: "Construction Planner",
    shortLabel: "Plan",
    description: "Preview แผนงานก่อสร้าง, Gantt, BOQ และ planned curve จากไฟล์ Excel",
    status: "prototype",
    statusLabel: "V0.1",
    routeBase: "/construction-planner",
    storageKey: "construction-planner.preview.v1",
    versions: versionDraft("construction-planner.preview.v1"),
    category: "construction",
    professionTags: ["contractor", "site_team", "qs_estimator", "architect", "owner_developer"],
    monetization: "freemium",
    accessLevel: "read",
    privacyLevel: "workspace",
    aiUsage: "none"
  },
  {
    id: "designStudio",
    label: "Design Studio",
    shortLabel: "Design",
    description: "สร้าง Prompt ภาพสถาปัตย์ เลือกสไตล์ วัสดุ แสง และ workflow งาน render",
    status: "prototype",
    statusLabel: "V0.1",
    routeBase: "/design",
    storageKey: "design-studio.workspace.v1",
    versions: versionDraft("design-studio.workspace.v1"),
    category: "design",
    professionTags: ["architect", "designer"],
    monetization: "freemium",
    accessLevel: "write",
    privacyLevel: "workspace",
    aiUsage: "required"
  },
  {
    id: "library",
    label: "คลังข้อมูล",
    shortLabel: "Library",
    description: "คลังภาพ เอกสาร Prompt และถังขยะสำหรับงานออกแบบและเอกสารโครงการ",
    status: "prototype",
    statusLabel: "V0.1",
    routeBase: "/library",
    storageKey: "library.workspace.v1",
    versions: versionDraft("library.workspace.v1"),
    category: "platform",
    professionTags: ["architect", "designer", "contractor", "admin_accounting"],
    monetization: "member",
    accessLevel: "read",
    privacyLevel: "workspace",
    aiUsage: "none"
  },
  {
    id: "defectTracker",
    label: "Defect",
    shortLabel: "Defect",
    description: "ตรวจสอบความคืบหน้าโครงการ ติดตาม defect ค้าง และเตรียมรายการส่งมอบ",
    status: "prototype",
    statusLabel: "V0.1",
    routeBase: "/defect",
    storageKey: "defect-tracker.workspace.v1",
    versions: versionDraft("defect-tracker.workspace.v1"),
    category: "construction",
    professionTags: ["site_team", "contractor", "architect"],
    monetization: "freemium",
    accessLevel: "write",
    privacyLevel: "project",
    aiUsage: "none"
  },
  {
    id: "employees",
    label: "พนักงาน",
    shortLabel: "Team",
    description: "จัดการค่าแรง สวัสดิการ ตำแหน่ง ทีมออฟฟิศ และทีมหน้างานหลายทีมที่ผูกกับโครงการ",
    status: "prototype",
    statusLabel: "V0.1",
    routeBase: "/employees",
    storageKey: "employees.workspace.v1",
    versions: versionDraft("employees.workspace.v1"),
    category: "construction",
    professionTags: ["contractor", "admin_accounting", "small_business"],
    monetization: "freemium",
    accessLevel: "write",
    privacyLevel: "workspace",
    aiUsage: "none"
  },
  {
    id: "socialFeed",
    label: "Feed รับเหมา",
    shortLabel: "Feed",
    description: "โพสต์งานหน้างาน หาเครือข่ายผู้รับเหมา ทีมช่าง ซัพพลายเออร์ และดู Profile ธุรกิจตัวเอง",
    status: "prototype",
    statusLabel: "V0.1",
    routeBase: "/feed",
    storageKey: "contractor-feed.workspace.v1",
    versions: versionDraft("contractor-feed.workspace.v1"),
    category: "platform",
    professionTags: ["contractor", "supplier_vendor", "site_team", "freelancer"],
    monetization: "free",
    accessLevel: "read",
    privacyLevel: "public",
    aiUsage: "none"
  },
  {
    id: "agentChat",
    label: "Agent Chat",
    shortLabel: "Agent",
    description: "คุยกับ AI agent โยนไฟล์ให้จัดการข้อมูล และเตรียมต่อ Webchat, LINE, Telegram, Discord ผ่าน API",
    status: "prototype",
    statusLabel: "V0.1",
    routeBase: "/agent-chat",
    storageKey: "agent-chat.workspace.v1",
    versions: versionDraft("agent-chat.workspace.v1"),
    category: "agent",
    professionTags: ["architect", "contractor", "designer", "admin_accounting", "consultant"],
    monetization: "freemium",
    accessLevel: "write",
    privacyLevel: "workspace",
    aiUsage: "agent"
  },
  {
    id: "debtPlanner",
    label: "การเงินส่วนตัว (พักไว้)",
    shortLabel: "Parked",
    description: "โมดูลส่วนตัวที่พักไว้ ไม่ใช่ scope หลักของ Buildbybim.space ตอนนี้",
    status: "next",
    statusLabel: "V0.1",
    routeBase: "/debt",
    storageKey: "debt-planner.workspace.v1",
    versions: versionDraft("debt-planner.workspace.v1"),
    category: "tools",
    professionTags: ["personal"],
    monetization: "free",
    accessLevel: "quick",
    privacyLevel: "personal",
    aiUsage: "none"
  },
  {
    id: "cashflow",
    label: "กระแสเงินสด",
    shortLabel: "Cash",
    description: "รายรับ รายจ่าย เงินคงเหลือ และภาระที่ต้องจ่าย",
    status: "prototype",
    statusLabel: "V0.1",
    routeBase: "/cashflow",
    storageKey: "cashflow.entries.v1",
    versions: versionDraft("cashflow.entries.v1"),
    category: "business",
    professionTags: ["admin_accounting", "contractor", "small_business", "freelancer"],
    monetization: "freemium",
    accessLevel: "write",
    privacyLevel: "workspace",
    aiUsage: "none"
  },
  {
    id: "clientOps",
    label: "งานลูกค้า",
    shortLabel: "CRM",
    description: "ติดตามลูกค้า โปรเจกต์ งานค้าง และเอกสารที่เกี่ยวข้อง",
    status: "planned",
    statusLabel: "V0.1",
    routeBase: "/clients",
    storageKey: "client-ops.workspace.v1",
    versions: versionDraft("client-ops.workspace.v1"),
    category: "business",
    professionTags: ["sales_marketing", "admin_accounting", "consultant", "small_business"],
    monetization: "member",
    accessLevel: "write",
    privacyLevel: "workspace",
    aiUsage: "none"
  },
  {
    id: "admin",
    label: "Admin Console",
    shortLabel: "Admin",
    description: "จัดการแผน สิทธิ์การใช้แอป admin override และ audit log",
    status: "prototype",
    statusLabel: "V0.1",
    routeBase: "/admin",
    storageKey: "membership.plans.v1",
    versions: versionDraft("membership.plans.v1"),
    category: "platform",
    professionTags: ["admin_accounting", "support_operator"],
    monetization: "custom",
    accessLevel: "admin",
    privacyLevel: "admin_only",
    aiUsage: "none"
  }
];

export function getWorkspaceApp(id: WorkspaceAppId) {
  return workspaceApps.find((app) => app.id === id) ?? workspaceApps[0];
}

export function getDefaultWorkspaceAppVersion(app: WorkspaceAppDefinition) {
  return app.versions[0];
}

export function getWorkspaceAppVersion(
  app: WorkspaceAppDefinition,
  versionId: string | null | undefined
) {
  return (
    app.versions.find((version) => version.id === versionId) ??
    getDefaultWorkspaceAppVersion(app)
  );
}
