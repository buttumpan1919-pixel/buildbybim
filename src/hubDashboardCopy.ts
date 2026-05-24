// Hub Dashboard i18n
// AGENTS.md: เก็บข้อความ Hub Dashboard ทั้งภาษาไทย/อังกฤษไว้ในที่เดียว เพื่อให้ App.tsx เลือก copy ตาม WorkspaceLanguage ได้โดยไม่ hardcode

import type { WorkspaceLanguage, WorkspaceLanguageCopyMap } from "./workspace/shell/workspaceLanguage";

export type HubDashboardLanguage = WorkspaceLanguage;

export type HubDashboardCopy = {
  // hero
  workspaceHubTitle: string;

  // summary tiles (existing + new)
  summaryDocs: string;
  summaryDocValue: string;
  summaryDefectsOpen: string;
  summaryActiveEmployees: string;
  summaryMonthlyLabor: string;
  summaryProjects: string;
  summaryBoqAllocated: string;
  summaryCashflowNet: string;

  // unit suffixes used inside summary tile values
  unitDocs: string;
  unitPeople: string;
  unitProjects: string;
  unitTasks: string;
  unitApps: string;
  unitTeams: string;
  unitConnections: string;
  unitChannels: string;

  // app card metrics and quick actions
  metricDocuments: string;
  metricQuotes: string;
  metricPurchaseOrders: string;
  metricInvoices: string;
  metricTasks: string;
  metricActive: string;
  metricLinked: string;
  metricAllocated: string;
  metricEmployees: string;
  metricOffice: string;
  metricSiteTeams: string;
  metricMonthlyLaborShort: string;
  metricPosts: string;
  metricNetwork: string;
  metricFollowers: string;
  metricHiring: string;
  metricWebchat: string;
  metricFiles: string;
  metricApi: string;
  metricAction: string;
  metricNetMonth: string;
  metricDraft: string;
  metricConfirmed: string;
  metricEntries: string;
  valueReadyToChat: string;
  valueDropIn: string;
  valueFourChannels: string;
  valueOrganizeData: string;
  quickTeams: string;
  quickPayroll: string;
  quickFeed: string;
  quickProfile: string;
  quickChat: string;
  quickApi: string;

  // tab header
  tabActiveLabel: string;
  tabReadyLabel: string;
  tabPipelineLabel: string;
  tabActiveDetail: string;
  tabReadyDetail: string;
  tabPipelineDetail: string;
  tabSourceLabel: string;
  tabSourceValue: string;

  // ready tab empty state
  readyEmptyTitle: string;
  readyEmptyDetail: string;
  readyEmptyOpenDocs: string;
  readyEmptyOpenDefect: string;

  // demo seed board
  demoSeedTitle: string;
  demoSeedDetail: string;
  demoSeedAction: string;
  demoSeedOpenProjectControl: string;
  demoSeedResetAction: string;
  demoSeedResetNote: string;
  demoSeedNote: string;

  // pipeline tab
  pipelinePrototype: string;
  pipelineNext: string;
  pipelinePlanned: string;
  pipelinePrototypeDetail: string;
  pipelineNextDetail: string;
  pipelinePlannedDetail: string;

  // pending actions board
  actionsTitle: string;
  actionsDetail: string;
  actionsEmptyTitle: string;
  actionsEmptyDetail: string;

  // action row templates - use {count} placeholder
  actionDefectsHigh: string;
  actionDefectsHighDetail: string;
  actionDefectsOpen: string;
  actionDefectsOpenDetail: string;
  actionQuoteDraft: string;
  actionQuoteDraftDetail: string;
  actionInvoiceSent: string;
  actionInvoiceSentDetail: string;
  actionNoEmployees: string;
  actionNoEmployeesDetail: string;
  actionBoqOverbudget: string;
  actionBoqOverbudgetDetail: string;
  actionCashflowNegative: string;
  actionCashflowNegativeDetail: string;
  actionCashflowDraft: string;
  actionCashflowDraftDetail: string;
  actionMilestoneReady: string;
  actionMilestoneReadyDetail: string;

  // recent activity board
  activityTitle: string;
  activityDetail: string;
  activityEmptyTitle: string;
  activityEmptyDetail: string;
  activityUnknownArea: string;
  activityBoqTask: string;
  activityLinkedItems: string;

  // relative time labels (for formatHubRelativeTime)
  timeJustNow: string;
  timeMinutesAgo: string;
  timeHoursAgo: string;
  timeDaysAgo: string;
  timeWeeksAgo: string;
  timeMonthsAgo: string;
};

export const hubDashboardCopy: WorkspaceLanguageCopyMap<HubDashboardCopy> = {
  th: {
    workspaceHubTitle: "ศูนย์รวมแอปทำงาน",

    summaryDocs: "เอกสารทั้งหมด",
    summaryDocValue: "มูลค่าเอกสารล่าสุด",
    summaryDefectsOpen: "Defect เปิดอยู่",
    summaryActiveEmployees: "พนักงานใช้งาน",
    summaryMonthlyLabor: "ค่าแรงต่อเดือน",
    summaryProjects: "โครงการ",
    summaryBoqAllocated: "งบที่แบ่งให้งาน",
    summaryCashflowNet: "Cashflow สุทธิเดือนนี้",

    unitDocs: "ฉบับ",
    unitPeople: "คน",
    unitProjects: "โครงการ",
    unitTasks: "งาน",
    unitApps: "แอป",
    unitTeams: "ทีม",
    unitConnections: "ราย",
    unitChannels: "ช่องทาง",

    metricDocuments: "เอกสาร",
    metricQuotes: "ใบเสนอราคา",
    metricPurchaseOrders: "ใบสั่งซื้อ",
    metricInvoices: "ใบแจ้งหนี้",
    metricTasks: "งาน",
    metricActive: "กำลังทำ",
    metricLinked: "ผูก BOQ",
    metricAllocated: "งบผูกแล้ว",
    metricEmployees: "พนักงาน",
    metricOffice: "ออฟฟิศ",
    metricSiteTeams: "ทีมหน้างาน",
    metricMonthlyLaborShort: "ค่าแรง/เดือน",
    metricPosts: "โพสต์",
    metricNetwork: "เครือข่าย",
    metricFollowers: "Follower",
    metricHiring: "หาทีม",
    metricWebchat: "Webchat",
    metricFiles: "ไฟล์",
    metricApi: "API",
    metricAction: "Action",
    metricNetMonth: "สุทธิเดือนนี้",
    metricDraft: "รอ confirm",
    metricConfirmed: "ยืนยันแล้ว",
    metricEntries: "รายการ",
    valueReadyToChat: "พร้อมคุย",
    valueDropIn: "Drop-in",
    valueFourChannels: "4 ช่องทาง",
    valueOrganizeData: "จัดข้อมูล",
    quickTeams: "ทีม",
    quickPayroll: "ค่าแรง",
    quickFeed: "ฟีด",
    quickProfile: "โปรไฟล์",
    quickChat: "แชต",
    quickApi: "API",

    tabActiveLabel: "ภาพรวมการทำงาน",
    tabReadyLabel: "Active Apps",
    tabPipelineLabel: "Pipeline",
    tabActiveDetail: "{totalApps} แอป · {readyCount} approved · {activeCount} active",
    tabReadyDetail: "แอปที่มีข้อมูลใช้งานจริงในเครื่องตอนนี้",
    tabPipelineDetail: "ลำดับการพัฒนาแอป จาก prototype ถึง planned",
    tabSourceLabel: "data source",
    tabSourceValue: "เก็บในเครื่อง",

    readyEmptyTitle: "ยังไม่มีแอปที่มีข้อมูล",
    readyEmptyDetail: "เริ่มสร้างเอกสารใน BuildDocs, ลง Defect หรือเพิ่มพนักงาน แล้วแอปจะปรากฏที่นี่",
    readyEmptyOpenDocs: "เปิด BuildDocs",
    readyEmptyOpenDefect: "เปิด Defect",

    demoSeedTitle: "โหลดข้อมูล Demo สำหรับทดสอบระบบ",
    demoSeedDetail:
      "เพิ่มตัวอย่าง project, supplier, PR/RFQ, cashflow, defect, รูป evidence และทีมงานที่เชื่อมกันครบ เพื่อทดสอบ flow แบบ Builk-inspired ได้ทันที",
    demoSeedAction: "โหลด Demo แล้วเปิด Project Control",
    demoSeedOpenProjectControl: "เปิด Project Control",
    demoSeedResetAction: "ล้าง Demo",
    demoSeedResetNote: "ลบเฉพาะข้อมูลตัวอย่างที่ขึ้นต้น demo-* ไม่แตะข้อมูลจริงที่ผู้ใช้สร้างเอง",
    demoSeedNote: "ไม่ลบข้อมูลเดิม และรันซ้ำได้โดยไม่เพิ่มรายการซ้ำ",

    pipelinePrototype: "Prototype",
    pipelineNext: "Next",
    pipelinePlanned: "Planned",
    pipelinePrototypeDetail: "ทดลองโครงร่างและข้อมูลตัวอย่าง",
    pipelineNextDetail: "เตรียมต่อข้อมูลจริงในรอบถัดไป",
    pipelinePlannedDetail: "ยังอยู่ใน roadmap รอเริ่มพัฒนา",

    actionsTitle: "งานที่ต้องทำต่อ",
    actionsDetail: "ดึงจาก Docs และ Defect ในเครื่องตอนนี้ คลิกเพื่อเปิดแอปที่เกี่ยวข้อง",
    actionsEmptyTitle: "ไม่มี action ค้างในขณะนี้",
    actionsEmptyDetail: "เริ่มงานใหม่จาก app card ด้านบนเพื่อสร้างเอกสาร, defect, หรือเพิ่มทีม",

    actionDefectsHigh: "Defect ระดับสูง {count} รายการ",
    actionDefectsHighDetail: "ตรวจและจัดลำดับการแก้ก่อนงวดส่งมอบ",
    actionDefectsOpen: "Defect เปิดอยู่ {count} รายการ",
    actionDefectsOpenDetail: "บันทึกความคืบหน้าและแนบรูปหลังแก้",
    actionQuoteDraft: "ใบเสนอราคา draft {count} ฉบับ",
    actionQuoteDraftDetail: "ปรับยอดและส่งให้ลูกค้าก่อนปิดสัปดาห์",
    actionInvoiceSent: "ใบแจ้งหนี้ส่งแล้ว {count} ฉบับ",
    actionInvoiceSentDetail: "ติดตามการชำระและบันทึกใบเสร็จเมื่อรับเงิน",
    actionNoEmployees: "ยังไม่มีพนักงาน",
    actionNoEmployeesDetail: "เพิ่มทีมออฟฟิศหรือทีมหน้างานเพื่อคิดค่าแรงและจัดทีม",
    actionBoqOverbudget: "Task เกินงบ {count} รายการ",
    actionBoqOverbudgetDetail: "ปรับยอดหรือจัดสรรงบใหม่ก่อนเซ็นงวด",
    actionCashflowNegative: "Cashflow เดือนนี้ติดลบ {count}",
    actionCashflowNegativeDetail: "รายจ่ายที่ยืนยันแล้วมากกว่ารายรับ เปิด Cashflow เพื่อตรวจรายการ",
    actionCashflowDraft: "Cashflow รอ confirm {count} รายการ",
    actionCashflowDraftDetail: "ตรวจรายการเข้า–ออก แล้วยืนยันเพื่ออัปเดตยอดสุทธิ",
    actionMilestoneReady: "งวดงานพร้อมวางบิล {count} รายการ",
    actionMilestoneReadyDetail: "เปิดเอกสารใน BuildDocs เพื่อออกใบวางบิล/ใบแจ้งหนี้",

    activityTitle: "กิจกรรมล่าสุด",
    activityDetail: "ลำดับเวลาเอกสารและ defect ที่อัปเดตล่าสุด คลิกเพื่อเปิดต่อ",
    activityEmptyTitle: "ยังไม่มีกิจกรรม",
    activityEmptyDetail: "สร้างเอกสารหรือลง defect แล้วจะมาแสดงที่นี่อัตโนมัติ",
    activityUnknownArea: "พื้นที่ไม่ระบุ",
    activityBoqTask: "งาน BOQ",
    activityLinkedItems: "รายการที่ผูก",

    timeJustNow: "เมื่อกี้",
    timeMinutesAgo: "{n} นาทีที่แล้ว",
    timeHoursAgo: "{n} ชั่วโมงที่แล้ว",
    timeDaysAgo: "{n} วันก่อน",
    timeWeeksAgo: "{n} สัปดาห์ก่อน",
    timeMonthsAgo: "{n} เดือนก่อน"
  },
  en: {
    workspaceHubTitle: "Workspace Hub",

    summaryDocs: "All documents",
    summaryDocValue: "Latest document value",
    summaryDefectsOpen: "Open defects",
    summaryActiveEmployees: "Active employees",
    summaryMonthlyLabor: "Monthly labor cost",
    summaryProjects: "Projects",
    summaryBoqAllocated: "Allocated to tasks",
    summaryCashflowNet: "Net cashflow this month",

    unitDocs: "docs",
    unitPeople: "people",
    unitProjects: "projects",
    unitTasks: "tasks",
    unitApps: "apps",
    unitTeams: "teams",
    unitConnections: "contacts",
    unitChannels: "channels",

    metricDocuments: "Documents",
    metricQuotes: "Quotes",
    metricPurchaseOrders: "Purchase orders",
    metricInvoices: "Invoices",
    metricTasks: "Tasks",
    metricActive: "Active",
    metricLinked: "Linked",
    metricAllocated: "Allocated",
    metricEmployees: "Employees",
    metricOffice: "Office",
    metricSiteTeams: "Site teams",
    metricMonthlyLaborShort: "Monthly labor",
    metricPosts: "Posts",
    metricNetwork: "Network",
    metricFollowers: "Followers",
    metricHiring: "Hiring",
    metricWebchat: "Webchat",
    metricFiles: "Files",
    metricApi: "API",
    metricAction: "Action",
    metricNetMonth: "Net month",
    metricDraft: "Draft",
    metricConfirmed: "Confirmed",
    metricEntries: "Entries",
    valueReadyToChat: "Ready",
    valueDropIn: "Drop-in",
    valueFourChannels: "4 channels",
    valueOrganizeData: "Organize data",
    quickTeams: "Teams",
    quickPayroll: "Payroll",
    quickFeed: "Feed",
    quickProfile: "Profile",
    quickChat: "Chat",
    quickApi: "API",

    tabActiveLabel: "Workspace overview",
    tabReadyLabel: "Active Apps",
    tabPipelineLabel: "Pipeline",
    tabActiveDetail: "{totalApps} apps · {readyCount} approved · {activeCount} active",
    tabReadyDetail: "Apps with real data on this device right now",
    tabPipelineDetail: "App development order, from prototype to planned",
    tabSourceLabel: "data source",
    tabSourceValue: "localStorage",

    readyEmptyTitle: "No apps with data yet",
    readyEmptyDetail: "Create a document in BuildDocs, log a defect, or add an employee and apps will show up here.",
    readyEmptyOpenDocs: "Open BuildDocs",
    readyEmptyOpenDefect: "Open Defect",

    demoSeedTitle: "Load demo data for testing",
    demoSeedDetail:
      "Adds a linked project, suppliers, PR/RFQ, cashflow, defects, evidence photos, and a site team so the Builk-inspired workflow can be tested immediately.",
    demoSeedAction: "Load demo and open Project Control",
    demoSeedOpenProjectControl: "Open Project Control",
    demoSeedResetAction: "Reset demo data",
    demoSeedResetNote: "Removes only demo-* sample records and keeps your own records intact.",
    demoSeedNote: "Keeps existing data and can be run again without duplicating demo rows.",

    pipelinePrototype: "Prototype",
    pipelineNext: "Next",
    pipelinePlanned: "Planned",
    pipelinePrototypeDetail: "Trying out layouts and sample data",
    pipelineNextDetail: "Wiring real data in the next round",
    pipelinePlannedDetail: "Still on the roadmap, build hasn't started",

    actionsTitle: "What to do next",
    actionsDetail: "Pulled from Docs and Defect on this device. Click to jump to the related app.",
    actionsEmptyTitle: "No pending actions right now",
    actionsEmptyDetail: "Start something new from an app card above to add a document, defect, or team.",

    actionDefectsHigh: "{count} high-severity defects",
    actionDefectsHighDetail: "Review and prioritize fixes before the next handover",
    actionDefectsOpen: "{count} open defects",
    actionDefectsOpenDetail: "Log progress and attach photos after each fix",
    actionQuoteDraft: "{count} draft quotes",
    actionQuoteDraftDetail: "Adjust totals and send to clients before week's end",
    actionInvoiceSent: "{count} invoices sent",
    actionInvoiceSentDetail: "Follow up on payment and record receipts when paid",
    actionNoEmployees: "No employees yet",
    actionNoEmployeesDetail: "Add an office or site team to track wages and assignments",
    actionBoqOverbudget: "{count} tasks over budget",
    actionBoqOverbudgetDetail: "Rebalance allocations or adjust totals before signing the milestone",
    actionCashflowNegative: "Cashflow is negative by {count}",
    actionCashflowNegativeDetail: "Confirmed expenses exceed income this month. Open Cashflow to review entries.",
    actionCashflowDraft: "{count} cashflow entries pending confirm",
    actionCashflowDraftDetail: "Review income and expenses, then confirm to update the net balance",
    actionMilestoneReady: "{count} milestones ready to bill",
    actionMilestoneReadyDetail: "Open the document in BuildDocs to issue a billing note or invoice",

    activityTitle: "Recent activity",
    activityDetail: "Timeline of recently updated documents and defects. Click to open.",
    activityEmptyTitle: "No activity yet",
    activityEmptyDetail: "Create a document or log a defect and it'll show up here automatically.",
    activityUnknownArea: "Unspecified area",
    activityBoqTask: "BOQ task",
    activityLinkedItems: "linked items",

    timeJustNow: "just now",
    timeMinutesAgo: "{n} min ago",
    timeHoursAgo: "{n} hr ago",
    timeDaysAgo: "{n} days ago",
    timeWeeksAgo: "{n} weeks ago",
    timeMonthsAgo: "{n} months ago"
  }
};

// แทน {count} ในข้อความ template ด้วยตัวเลขจริง
export function formatHubCount(template: string, count: number | string): string {
  return template.replace(/\{count\}/g, String(count));
}

// แปลงเวลา ISO เป็นรูปแบบ "X นาทีที่แล้ว" / "X min ago" ตามภาษา
// logic ตรงกับ formatHubTimeAgo เดิมใน App.tsx แต่รับ copy เข้ามาเพื่อสลับภาษาได้
export function formatHubRelativeTime(
  isoOrEmpty: string,
  language: HubDashboardLanguage,
  copy: HubDashboardCopy
): string {
  if (!isoOrEmpty) return "";
  const then = Date.parse(isoOrEmpty);
  if (Number.isNaN(then)) return isoOrEmpty;
  const diffMs = Date.now() - then;
  if (diffMs < 0) return copy.timeJustNow;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return copy.timeJustNow;
  if (minutes < 60) return copy.timeMinutesAgo.replace(/\{n\}/g, String(minutes));
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return copy.timeHoursAgo.replace(/\{n\}/g, String(hours));
  const days = Math.floor(hours / 24);
  if (days < 7) return copy.timeDaysAgo.replace(/\{n\}/g, String(days));
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return copy.timeWeeksAgo.replace(/\{n\}/g, String(weeks));
  const months = Math.floor(days / 30);
  if (months < 12) return copy.timeMonthsAgo.replace(/\{n\}/g, String(months));
  const locale = language === "en" ? "en-US" : "th-TH";
  return new Date(then).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}
