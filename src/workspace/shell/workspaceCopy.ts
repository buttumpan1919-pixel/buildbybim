import type { WorkspaceAppDefinition, WorkspaceAppId } from "../../apps";
import type { WorkspaceAppGroupDefinition } from "./workspaceGroups";
import {
  getWorkspaceLanguageCopy,
  type WorkspaceLanguage,
  type WorkspaceLanguageCopyMap
} from "./workspaceLanguage";
import type { WorkspaceSubnavItem } from "./workspaceRouting";

export const workspaceShellCopy: WorkspaceLanguageCopyMap<{
    activeAppTabs: string;
    addApp: string;
    apps: string;
    viewPlans: string;
    accessRequiredAria: string;
    accessRequiredTitle: string;
    accessRequiredDetail: string;
    accessOptionsTitle: string;
    accessOptionsDetail: string;
    accessPlanTitle: string;
    accessPlanDetail: string;
    accessAdminTitle: string;
    accessAdminDetail: string;
    accessCatalogTitle: string;
    accessCatalogDetail: string;
    buildDocsAction: string;
    buildDocsSidebarSummary: string;
    command: string;
    documentTotal: string;
    documentsInBuildDocs: string;
    savedDocuments: string;
    createDocument: string;
    billingReceiptDocument: string;
    billingDocument: string;
    purchaseDocument: string;
    documentReference: string;
    quoteDocument: string;
    purchaseOrderDocument: string;
    invoiceDocument: string;
    receiptDocument: string;
    contractDocument: string;
    expandApps: string;
    expandSidebar: string;
    languageLabel: string;
    manageApps: string;
    map: string;
    pinnedApps: string;
    publicSite: string;
    backToHub: string;
    backToPublicSite: string;
    sortApps: string;
    systemNormal: string;
    version: string;
    versionManagement: string;
    websiteDirectionTitle: string;
    collapseApps: string;
    collapseSidebar: string;
  }> = {
  th: {
    activeAppTabs: "แท็บของแอป",
    addApp: "เพิ่มแอปใหม่",
    apps: "แอป",
    viewPlans: "ดูแผน Support",
    accessRequiredAria: "{app} ต้องมีสิทธิ์ใช้งาน",
    accessRequiredTitle: "{app} ต้องอัปเกรดก่อนใช้งาน",
    accessRequiredDetail: "แผนปัจจุบันยังไม่เปิดสิทธิ์แอปนี้ เปลี่ยนแผนหรือขอ admin เพิ่ม override ก่อนใช้งาน",
    accessOptionsTitle: "ทางเลือกของคุณ",
    accessOptionsDetail: "3 ทางลัดในการปลดล็อกแอปนี้บนเครื่องนี้",
    accessPlanTitle: "เปลี่ยนเป็นแผนที่เปิดแอปนี้",
    accessPlanDetail: "ดูตาราง apps × plans",
    accessAdminTitle: "ขอ admin เพิ่ม override",
    accessAdminDetail: "Admin Console → Overrides → grant แอปให้ workspace/member/user",
    accessCatalogTitle: "ดูแอปอื่นใน catalog",
    accessCatalogDetail: "กรอง free / freemium เพื่อหาแอปที่ใช้ได้ทันที",
    buildDocsAction: "เปิด BuildDocs Pro",
    buildDocsSidebarSummary: "{version} · {documents} เอกสาร / {items} รายการงาน",
    command: "⌘K",
    documentTotal: "ยอดสุทธิเอกสารนี้",
    documentsInBuildDocs: "{count} เอกสารใน BuildDocs",
    savedDocuments: "เอกสารที่บันทึก",
    createDocument: "สร้างเอกสารใหม่",
    billingReceiptDocument: "ใบเสร็จจากใบวางบิล",
    billingDocument: "ใบวางบิลงวดงาน",
    purchaseDocument: "ใบสั่งซื้อจากใบเสนอราคา",
    documentReference: "อ้างอิง",
    quoteDocument: "ใบเสนอราคา",
    purchaseOrderDocument: "ใบสั่งซื้อ",
    invoiceDocument: "ใบแจ้งหนี้",
    receiptDocument: "ใบเสร็จรับเงิน",
    contractDocument: "สัญญารับเหมา",
    expandApps: "ขยายรายการแอป",
    expandSidebar: "ขยาย sidebar",
    languageLabel: "ภาษา",
    manageApps: "ตัวเลือกแอป",
    map: "ผัง",
    pinnedApps: "แอปหลัก",
    publicSite: "เว็บหลัก",
    backToHub: "กลับ Hub",
    backToPublicSite: "กลับเว็บหลัก",
    sortApps: "จัดเรียงแอป",
    systemNormal: "ระบบปกติ",
    version: "เวอร์ชัน",
    versionManagement: "จัดการเวอร์ชัน",
    websiteDirectionTitle: "แนวทางพัฒนาต่อ",
    collapseApps: "พับรายการแอป",
    collapseSidebar: "ย่อ sidebar"
  },
  en: {
    activeAppTabs: "Active App Tabs",
    addApp: "Add new app",
    apps: "Apps",
    viewPlans: "View plans",
    accessRequiredAria: "{app} access required",
    accessRequiredTitle: "{app} requires an upgrade",
    accessRequiredDetail: "Your current plan does not grant access to this app. Switch plans or ask an admin to add an override.",
    accessOptionsTitle: "What you can do",
    accessOptionsDetail: "Three quick paths to unlock this app on this device.",
    accessPlanTitle: "Switch to a plan that unlocks it",
    accessPlanDetail: "See the apps × plans access matrix",
    accessAdminTitle: "Ask admin for an override",
    accessAdminDetail: "Admin Console → Overrides → grant this app to a workspace/member/user",
    accessCatalogTitle: "Browse all apps in the catalog",
    accessCatalogDetail: "Filter by free / freemium to find apps you can use now",
    buildDocsAction: "Open BuildDocs Pro",
    buildDocsSidebarSummary: "{version} · {documents} documents / {items} line items",
    command: "⌘K",
    documentTotal: "Document total",
    documentsInBuildDocs: "{count} documents in BuildDocs",
    savedDocuments: "Saved documents",
    createDocument: "Create document",
    billingReceiptDocument: "Receipt from billing",
    billingDocument: "Progress billing",
    purchaseDocument: "Purchase order from quote",
    documentReference: "Reference",
    quoteDocument: "Quote",
    purchaseOrderDocument: "Purchase order",
    invoiceDocument: "Invoice",
    receiptDocument: "Receipt",
    contractDocument: "Contract",
    expandApps: "Expand apps",
    expandSidebar: "Expand sidebar",
    languageLabel: "Language",
    manageApps: "App options",
    map: "Map",
    pinnedApps: "Pinned apps",
    publicSite: "Public",
    backToHub: "Back to Hub",
    backToPublicSite: "Back to public site",
    sortApps: "Sort apps",
    systemNormal: "System ok",
    version: "Version",
    versionManagement: "Manage versions",
    websiteDirectionTitle: "Next Website Direction",
    collapseApps: "Collapse apps",
    collapseSidebar: "Collapse sidebar"
  }
};

const workspaceAppEnglishCopy: Record<
  WorkspaceAppId,
  { label: string; shortLabel: string; description: string }
> = {
  hub: {
    label: "Workspace Hub",
    shortLabel: "Hub",
    description: "Choose tools and review overall workspace status."
  },
  projects: {
    label: "Projects",
    shortLabel: "Projects",
    description: "Create projects, connect customers, budgets, costs, and downstream controls."
  },
  costCodes: {
    label: "Cost Codes (CBS)",
    shortLabel: "Codes",
    description: "Standard cost code library — spine of PR, RFQ, and cost recording."
  },
  suppliers: {
    label: "Suppliers",
    shortLabel: "Suppliers",
    description: "Supplier directory + price history — used by RFQ and cost recording."
  },
  procurement: {
    label: "Procurement (PR/RFQ)",
    shortLabel: "PR/RFQ",
    description: "Purchase requests + RFQ workflow with 10-state machine and supplier comparison."
  },
  projectControl: {
    label: "Project Control",
    shortLabel: "Control",
    description: "Dashboard + 5 reports — budget vs committed vs actual, variance, forecast, supplier spend, PR aging."
  },
  approvals: {
    label: "Approval Center",
    shortLabel: "Approvals",
    description: "Unified approval inbox for PR, Cashflow, PO, and Invoice with audit logging."
  },
  evidence: {
    label: "Evidence",
    shortLabel: "Evidence",
    description: "Central proof library for receipts, site photos, RFQ quotes, invoices, and linked project files."
  },
  builddocs: {
    label: "BuildDocs Pro",
    shortLabel: "Docs",
    description: "Quotes, purchase orders, invoices, receipts, completion docs, and contracts."
  },
  boqData: {
    label: "BOQ Data",
    shortLabel: "BOQ",
    description: "Central rate database for keynote lookup and BOQ reuse."
  },
  constructionPlanner: {
    label: "Construction Planner",
    shortLabel: "Plan",
    description: "Read-only preview for a construction schedule workbook with Gantt, BOQ, and planned curve."
  },
  designStudio: {
    label: "Design Studio",
    shortLabel: "Design",
    description: "Create architectural prompts, styles, materials, lighting, and render workflows."
  },
  library: {
    label: "Library",
    shortLabel: "Library",
    description: "Images, documents, prompts, and trash for design and project files."
  },
  defectTracker: {
    label: "Defect",
    shortLabel: "Defect",
    description: "Track project progress, open defects, inspections, and handover items."
  },
  employees: {
    label: "Team",
    shortLabel: "Team",
    description: "Manage wages, benefits, positions, office staff, and site crews."
  },
  socialFeed: {
    label: "Social Feed",
    shortLabel: "Social",
    description: "Post site updates, find contractor networks, suppliers, crews, and manage your profile."
  },
  agentChat: {
    label: "Agent Chat",
    shortLabel: "Agent",
    description: "Talk with an AI agent, drop files for immediate data handling, and connect webchat channels by API."
  },
  debtPlanner: {
    label: "Debt Planner",
    shortLabel: "Debt",
    description: "Prioritize debts, monthly payoff goals, and repayment plans."
  },
  cashflow: {
    label: "Cashflow",
    shortLabel: "Cash",
    description: "Track income, expenses, remaining cash, and upcoming obligations."
  },
  clientOps: {
    label: "Client Ops",
    shortLabel: "CRM",
    description: "Track clients, projects, follow-ups, related documents, and pending work."
  },
  admin: {
    label: "Admin",
    shortLabel: "Admin",
    description: "Manage plans, access rules, admin overrides, and audit logs."
  }
};

const workspaceAppThaiCopy: Record<
  WorkspaceAppId,
  { label: string; shortLabel: string; description: string }
> = {
  hub: {
    label: "ศูนย์รวม Workspace",
    shortLabel: "ศูนย์รวม",
    description: "เลือกเครื่องมือและดูสถานะงานรวมของ workspace"
  },
  projects: {
    label: "โครงการ",
    shortLabel: "โครงการ",
    description: "สร้างโครงการ ผูกลูกค้า งบ ต้นทุน และงานต่อเนื่อง"
  },
  costCodes: {
    label: "รหัสต้นทุน (CBS)",
    shortLabel: "รหัสต้นทุน",
    description: "คลังรหัสต้นทุนกลางสำหรับ PR, RFQ และการบันทึกต้นทุน"
  },
  suppliers: {
    label: "ผู้ขาย/ซัพพลายเออร์",
    shortLabel: "ผู้ขาย",
    description: "รายชื่อผู้ขายและประวัติราคา สำหรับ RFQ และ cost recording"
  },
  procurement: {
    label: "จัดซื้อ (PR/RFQ)",
    shortLabel: "PR/RFQ",
    description: "Purchase request และ RFQ พร้อมเปรียบเทียบผู้ขาย"
  },
  projectControl: {
    label: "ควบคุมโครงการ",
    shortLabel: "คุมต้นทุน",
    description: "Dashboard และรายงานงบประมาณ ต้นทุนจริง forecast และ PR aging"
  },
  approvals: {
    label: "ศูนย์อนุมัติ",
    shortLabel: "อนุมัติ",
    description: "กล่องรวมงานอนุมัติ PR, Cashflow, PO และ Invoice พร้อม audit log"
  },
  evidence: {
    label: "หลักฐาน",
    shortLabel: "หลักฐาน",
    description: "คลังหลักฐานกลางสำหรับใบเสร็จ รูปหน้างาน ใบเสนอราคา และไฟล์โครงการ"
  },
  builddocs: {
    label: "BuildDocs Pro",
    shortLabel: "เอกสาร",
    description: "ใบเสนอราคา ใบสั่งซื้อ ใบแจ้งหนี้ ใบเสร็จ เอกสารส่งมอบ และสัญญา"
  },
  boqData: {
    label: "ข้อมูล BOQ",
    shortLabel: "BOQ",
    description: "ฐานข้อมูลราคากลางสำหรับค้นหา Keynote และนำรายการไปใช้ใน BOQ"
  },
  constructionPlanner: {
    label: "แผนงานก่อสร้าง",
    shortLabel: "แผนงาน",
    description: "Preview แผนงานก่อสร้าง, Gantt, BOQ และ planned curve จากไฟล์ Excel"
  },
  designStudio: {
    label: "สตูดิโอออกแบบ",
    shortLabel: "ออกแบบ",
    description: "สร้าง prompt ภาพสถาปัตย์ สไตล์ วัสดุ แสง และ workflow งาน render"
  },
  library: {
    label: "คลังข้อมูล",
    shortLabel: "คลัง",
    description: "คลังภาพ เอกสาร prompt และถังขยะสำหรับงานออกแบบและเอกสารโครงการ"
  },
  defectTracker: {
    label: "ติดตาม Defect",
    shortLabel: "Defect",
    description: "ติดตามความคืบหน้า defect งานตรวจรับ และรายการส่งมอบ"
  },
  employees: {
    label: "ทีมงาน",
    shortLabel: "ทีม",
    description: "จัดการค่าแรง สวัสดิการ ตำแหน่ง ทีมออฟฟิศ และทีมหน้างาน"
  },
  socialFeed: {
    label: "ฟีดรับเหมา",
    shortLabel: "ฟีด",
    description: "โพสต์งานหน้างาน หาเครือข่ายผู้รับเหมา ซัพพลายเออร์ และดูโปรไฟล์ธุรกิจ"
  },
  agentChat: {
    label: "แชต Agent",
    shortLabel: "Agent",
    description: "คุยกับ AI agent โยนไฟล์ให้จัดข้อมูล และเตรียมต่อ Webchat, LINE, Telegram, Discord"
  },
  debtPlanner: {
    label: "แผนปลดหนี้",
    shortLabel: "หนี้",
    description: "จัดลำดับหนี้ เป้าหมายรายเดือน และแผนชำระคืน"
  },
  cashflow: {
    label: "กระแสเงินสด",
    shortLabel: "เงินสด",
    description: "ติดตามรายรับ รายจ่าย เงินคงเหลือ และภาระที่ต้องจ่าย"
  },
  clientOps: {
    label: "งานลูกค้า",
    shortLabel: "ลูกค้า",
    description: "ติดตามลูกค้า โครงการ follow-up เอกสารที่เกี่ยวข้อง และงานค้าง"
  },
  admin: {
    label: "แอดมิน",
    shortLabel: "แอดมิน",
    description: "จัดการแผน สิทธิ์การใช้แอป admin override และ audit log"
  }
};

const workspaceGroupCopy: WorkspaceLanguageCopyMap<
  Record<string, { label: string; detail: string }>
> = {
  th: {
    project: { label: "งานโครงการ", detail: "Hub · แผนงาน · เอกสาร · BOQ" },
    procurement: { label: "ควบคุมต้นทุน", detail: "รหัส · ผู้ขาย · PR/RFQ" },
    business: { label: "ธุรกิจ", detail: "เงินสด · ลูกค้า" },
    design: { label: "ออกแบบ", detail: "Studio · คลัง" },
    agent: { label: "Agent", detail: "AI · ไฟล์ · API" },
    social: { label: "เครือข่าย", detail: "ฟีด · ผู้รับเหมา" },
    platform: { label: "ระบบ", detail: "แอดมิน · สิทธิ์" },
    more: { label: "แอปเพิ่มเติม", detail: "โมดูลใหม่" }
  },
  en: {
    project: { label: "Project Work", detail: "Hub · Plan · Docs · BOQ" },
    procurement: { label: "Cost Control", detail: "Codes · Suppliers · PR/RFQ" },
    business: { label: "Business", detail: "Cash · CRM" },
    design: { label: "Design", detail: "Studio · Library" },
    agent: { label: "Agent", detail: "AI · File · API" },
    social: { label: "Social", detail: "Feed · Network" },
    platform: { label: "Platform", detail: "Admin · Access rules" },
    more: { label: "More Apps", detail: "New modules" }
  }
};

const workspaceSubnavEnglishCopy: Partial<
  Record<WorkspaceAppId, Record<string, { label: string; detail: string }>>
> = {
  builddocs: {
    documents: { label: "Documents", detail: "Quote · PO · Invoice" },
    contracts: { label: "Contracts", detail: "Agreement" },
    sheets: { label: "Google Sheet", detail: "Import CSV" },
    clients: { label: "Clients", detail: "CRM" },
    projects: { label: "Projects", detail: "Jobs" },
    costs: { label: "Costs", detail: "BOQ" },
    settings: { label: "Settings", detail: "Backup" }
  },
  boqData: {
    database: { label: "Database", detail: "Keynote · Rates" },
    "task-linkage": { label: "Task Linkage", detail: "Task · BOQ" },
    import: { label: "Import", detail: "CSV · Source" },
    export: { label: "Export", detail: "Excel · CSV" },
    bulk: { label: "Bulk Adjust", detail: "Material · Labor" }
  },
  constructionPlanner: {
    overview: { label: "Overview", detail: "Project · KPI" },
    schedule: { label: "Schedule", detail: "Gantt · Tasks" },
    boq: { label: "BOQ", detail: "Material · Labor" },
    curve: { label: "Curve", detail: "Planned value" }
  },
  defectTracker: {
    overview: { label: "Overview", detail: "Progress" },
    defects: { label: "Defects", detail: "Open issues" },
    inspection: { label: "Inspection", detail: "Handover" },
    "site-report": { label: "Site Report", detail: "360 / PDF" }
  }
};

const workspaceSubnavThaiCopy: Partial<
  Record<WorkspaceAppId, Record<string, { label: string; detail: string }>>
> = {
  hub: {
    overview: { label: "ภาพรวม", detail: "แอป · สถานะ" },
    ready: { label: "แอปพร้อมใช้", detail: "เอกสาร · Hub" },
    pipeline: { label: "แผนงาน", detail: "Prototype · ถัดไป" }
  },
  projects: {
    list: { label: "รายการ", detail: "ทุกโครงการ" },
    archive: { label: "คลังเก่า", detail: "ปิดงาน · ยกเลิก" },
    analytics: { label: "วิเคราะห์", detail: "ข้ามโครงการ" }
  },
  costCodes: {
    catalog: { label: "แคตตาล็อก", detail: "Tree · ค้นหา" },
    import: { label: "นำเข้า", detail: "CSV · Builk" },
    export: { label: "ส่งออก", detail: "CSV · Excel" },
    usage: { label: "การใช้งาน", detail: "Analytics" }
  },
  suppliers: {
    directory: { label: "รายชื่อ", detail: "รายการ · รายละเอียด" },
    "price-history": { label: "ประวัติราคา", detail: "ข้ามผู้ขาย" },
    import: { label: "นำเข้า", detail: "CSV" },
    analytics: { label: "วิเคราะห์", detail: "ยอดใช้สูงสุด" }
  },
  procurement: {
    "pr-list": { label: "PR", detail: "ใบขอซื้อ" },
    "rfq-list": { label: "RFQ", detail: "เทียบใบเสนอราคา" },
    archive: { label: "คลังเก่า", detail: "ปิดงาน · ยกเลิก" }
  },
  projectControl: {
    dashboard: { label: "แดชบอร์ด", detail: "งบเทียบต้นทุนจริง" },
    reports: { label: "รายงาน", detail: "5 รายงานมาตรฐาน" },
    settings: { label: "ตั้งค่า", detail: "เกณฑ์แจ้งเตือน" }
  },
  approvals: {
    inbox: { label: "กล่องอนุมัติ", detail: "รออนุมัติ" },
    history: { label: "ประวัติ", detail: "ผลการตัดสินใจ" },
    rules: { label: "กฎอนุมัติ", detail: "Approval matrix" }
  },
  evidence: {
    library: { label: "คลัง", detail: "ไฟล์ · หลักฐาน" },
    intake: { label: "รับเข้า", detail: "อัปโหลด · ลิงก์" },
    links: { label: "ลิงก์", detail: "โครงการ · ต้นทุน" },
    reports: { label: "รายงาน", detail: "CSV · ตรวจทาน" }
  },
  builddocs: {
    documents: { label: "เอกสาร", detail: "ใบเสนอราคา · PO · Invoice" },
    contracts: { label: "สัญญา", detail: "ข้อตกลง" },
    sheets: { label: "Google Sheet", detail: "นำเข้า CSV" },
    clients: { label: "ลูกค้า", detail: "CRM" },
    projects: { label: "โครงการ", detail: "งาน" },
    costs: { label: "ต้นทุน", detail: "BOQ" },
    settings: { label: "ตั้งค่า", detail: "Backup" }
  },
  boqData: {
    database: { label: "ฐานข้อมูล", detail: "Keynote · ราคา" },
    "task-linkage": { label: "ผูก Task", detail: "Task · BOQ" },
    import: { label: "นำเข้า", detail: "CSV · แหล่งข้อมูล" },
    export: { label: "ส่งออก", detail: "Excel · CSV" },
    bulk: { label: "ปรับทีละชุด", detail: "วัสดุ · แรงงาน" }
  },
  constructionPlanner: {
    overview: { label: "ภาพรวม", detail: "โครงการ · KPI" },
    schedule: { label: "แผนงาน", detail: "Gantt · งาน" },
    boq: { label: "BOQ", detail: "วัสดุ · แรงงาน" },
    curve: { label: "Curve", detail: "Planned value" }
  },
  designStudio: {
    envision: { label: "สร้างภาพ", detail: "Text -> Concept" },
    redesign: { label: "ปรับแบบ", detail: "Image -> Restyle" },
    diy: { label: "แก้เอง", detail: "Mask + Prompt" },
    outpaint: { label: "ขยายภาพ", detail: "Extend frame" },
    analyzer: { label: "วิเคราะห์", detail: "Image -> Report" },
    gallery: { label: "แกลเลอรี", detail: "Asset · Upscale" },
    angles: { label: "มุมมอง", detail: "Views · Video" }
  },
  library: {
    images: { label: "รูปภาพ", detail: "Gallery · Viewer" },
    documents: { label: "เอกสาร", detail: "PDF · XLSX" },
    prompts: { label: "Prompt", detail: "Reuse · Copy" },
    trash: { label: "ถังขยะ", detail: "กู้คืน" }
  },
  defectTracker: {
    overview: { label: "ภาพรวม", detail: "ความคืบหน้า" },
    defects: { label: "Defect", detail: "รายการแก้ไข" },
    inspection: { label: "ตรวจรับ", detail: "ส่งมอบ" },
    "site-report": { label: "รายงานไซต์", detail: "360 / PDF" }
  },
  employees: {
    overview: { label: "ภาพรวม", detail: "ค่าแรง · สวัสดิการ" },
    teams: { label: "ทีม", detail: "ออฟฟิศ · ไซต์" },
    payroll: { label: "ค่าแรง", detail: "แรงงานโครงการ" }
  },
  socialFeed: {
    feed: { label: "ฟีด", detail: "โพสต์ · อัปเดต" },
    network: { label: "เครือข่าย", detail: "ผู้รับเหมา" },
    profile: { label: "โปรไฟล์", detail: "บัญชีของฉัน" }
  },
  agentChat: {
    chat: { label: "แชต", detail: "ถาม · ไฟล์" },
    files: { label: "ไฟล์", detail: "อัปโหลด · Extract" },
    channels: { label: "ช่องทาง", detail: "API · Webhook" }
  },
  debtPlanner: {
    plan: { label: "แผนหนี้", detail: "Snowball · Priority" },
    targets: { label: "เป้าหมาย", detail: "จ่ายรายเดือน" },
    history: { label: "ประวัติ", detail: "บันทึกการจ่าย" }
  },
  cashflow: {
    overview: { label: "ภาพรวม", detail: "รายรับ · รายจ่าย" },
    forecast: { label: "คาดการณ์", detail: "90 วันข้างหน้า" },
    reports: { label: "รายงาน", detail: "Analytics" }
  },
  clientOps: {
    clients: { label: "ลูกค้า", detail: "ผู้ติดต่อ" },
    projects: { label: "โครงการ", detail: "งานที่เปิดอยู่" },
    followups: { label: "ติดตาม", detail: "คิวงาน" }
  },
  admin: {
    overview: { label: "ภาพรวม", detail: "แพ็กเกจ · สถิติ" },
    plans: { label: "แพ็กเกจ", detail: "Tier · Rules" },
    overrides: { label: "สิทธิ์พิเศษ", detail: "Admin grants" },
    "project-access": { label: "สิทธิ์โครงการ", detail: "บทบาท · สิทธิ์" },
    audit: { label: "Audit", detail: "Permission log" }
  }
};

export function getWorkspaceAppCopy(app: WorkspaceAppDefinition, language: WorkspaceLanguage) {
  const appCopy = getWorkspaceLanguageCopy(
    {
      th: workspaceAppThaiCopy,
      en: workspaceAppEnglishCopy
    },
    language
  );
  return appCopy[app.id] ?? app;
}

export function getWorkspaceGroupCopy(
  group: Pick<WorkspaceAppGroupDefinition, "id" | "label" | "detail">,
  language: WorkspaceLanguage
) {
  return getWorkspaceLanguageCopy(workspaceGroupCopy, language)[group.id] ?? {
    label: group.label,
    detail: group.detail
  };
}

export function getWorkspaceSubnavCopy(
  appId: WorkspaceAppId,
  item: WorkspaceSubnavItem,
  language: WorkspaceLanguage
) {
  const subnavCopy = getWorkspaceLanguageCopy(
    {
      th: workspaceSubnavThaiCopy,
      en: workspaceSubnavEnglishCopy
    },
    language
  );

  return subnavCopy[appId]?.[item.key] ?? item;
}
