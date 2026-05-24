// Copy/translations for Projects panel — Sprint 0 (Builk parity)
// Spec: docs/PROJECT_PRD.md Section 6

import type {
  WorkspaceLanguage,
  WorkspaceLanguageCopyMap
} from "../../shell/workspaceLanguage";

export type ProjectsPanelCopy = {
  heroTitleList: string;
  heroTitleDetail: string;
  heroDetailList: string;
  backToHub: string;
  backToList: string;
  createProject: string;
  cancel: string;
  save: string;
  edit: string;
  delete: string;
  projectAccessActive: string;
  projectAccessVisibleProjects: string;
  projectAccessBlocked: string;
  projectAccessNoProject: string;
  projectAccessCreateBlocked: string;
  projectAccessEditBlocked: string;
  projectAccessDeleteBlocked: string;

  // List page
  countLabel: string;
  creditsLabel: string;
  carouselTitle: string;
  carouselDetail: string;
  tableTitle: string;
  tableDetail: string;
  searchPlaceholder: string;
  emptyTitle: string;
  emptyDetail: string;
  noBudget: string;
  noCustomer: string;
  remainingDays: string;
  overdueDays: string;

  // Status chip labels (already in projectStatusCopy but keep filter-chip "ทั้งหมด" here)
  filterAll: string;

  // Table headers
  thCode: string;
  thName: string;
  thCustomer: string;
  thContract: string;
  thPlanned: string;
  thActual: string;
  thMargin: string;
  thDays: string;
  thStatus: string;

  // KPI labels
  kpiBudgetLeft: string;
  kpiTimeLeft: string;
  kpiMargin: string;
  kpiContract: string;
  kpiPlannedCost: string;
  kpiActualCost: string;

  // Form
  formTitleCreate: string;
  formTitleEdit: string;
  fieldCode: string;
  fieldName: string;
  fieldClientName: string;
  fieldCustomerType: string;
  fieldContractValue: string;
  fieldPlannedCost: string;
  fieldPlannedRevenue: string;
  fieldStartDate: string;
  fieldEndDate: string;
  fieldStatus: string;
  fieldNotes: string;
  fieldNotesPlaceholder: string;

  // Detail page
  detailHeader: string;
  alertOverdueTitle: string;
  alertOverdueDetail: string;
  alertOverBudgetTitle: string;
  recentActivityTitle: string;
  recentActivityEmpty: string;
  aiInsightsTitle: string;
  aiInsightsDetail: string;
  costBreakdownTitle: string;
  costBreakdownPlaceholder: string;

  // Tabs
  tabOverview: string;
  tabPR: string;
  tabRFQ: string;
  tabPO: string;
  tabCost: string;
  tabInvoice: string;
  tabReports: string;
  tabComingSoon: string;
};

export const projectsPanelCopy: WorkspaceLanguageCopyMap<ProjectsPanelCopy> = {
  th: {
    heroTitleList: "โครงการ",
    heroTitleDetail: "รายละเอียดโครงการ",
    heroDetailList: "ศูนย์รวมโครงการทั้งหมด · entry point ของ Cost Control",
    backToHub: "กลับ Hub",
    backToList: "← กลับรายการโครงการ",
    createProject: "+ สร้างโครงการ",
    cancel: "ยกเลิก",
    save: "บันทึก",
    edit: "แก้ไข",
    delete: "ลบ",
    projectAccessActive: "Project Access เปิดใช้งาน",
    projectAccessVisibleProjects: "โครงการที่ผู้ใช้ปัจจุบันเข้าถึงได้",
    projectAccessBlocked: "Project Access บล็อกการทำงานนี้",
    projectAccessNoProject: "ไม่มีสิทธิ์ดูโครงการนี้ หรือโครงการไม่อยู่ในรายการแล้ว",
    projectAccessCreateBlocked: "ไม่มีสิทธิ์สร้างโครงการ",
    projectAccessEditBlocked: "ไม่มีสิทธิ์แก้ไขโครงการ",
    projectAccessDeleteBlocked: "ไม่มีสิทธิ์ลบ/จัดการโครงการ",

    countLabel: "โครงการทั้งหมด",
    creditsLabel: "เครดิตคงเหลือ",
    carouselTitle: "โครงการเคลื่อนไหวล่าสุด",
    carouselDetail: "โครงการที่กำลังดำเนินการ · KPI: งบคงเหลือ · เวลา · กำไร",
    tableTitle: "ข้อมูลโครงการ",
    tableDetail: "รายการทั้งหมด · click เพื่อดูรายละเอียด",
    searchPlaceholder: "ค้นหา เลขที่/ชื่อโครงการ/ลูกค้า...",
    emptyTitle: "ยังไม่มีโครงการ",
    emptyDetail: "กดปุ่ม + สร้างโครงการ เพื่อเริ่มต้น",
    noBudget: "ไม่มีงบประมาณ",
    noCustomer: "ไม่มีลูกค้า — internal",
    remainingDays: "วันคงเหลือ",
    overdueDays: "เลย deadline",

    filterAll: "ทั้งหมด",

    thCode: "เลขที่",
    thName: "โครงการ",
    thCustomer: "ลูกค้า",
    thContract: "มูลค่าสัญญา",
    thPlanned: "ต้นทุนแผน",
    thActual: "ต้นทุนจริง",
    thMargin: "กำไร %",
    thDays: "เวลา",
    thStatus: "สถานะ",

    kpiBudgetLeft: "งบคงเหลือ",
    kpiTimeLeft: "เวลาคงเหลือ",
    kpiMargin: "กำไรปัจจุบัน",
    kpiContract: "มูลค่าสัญญา",
    kpiPlannedCost: "ต้นทุนแผน",
    kpiActualCost: "ต้นทุนจริง",

    formTitleCreate: "สร้างโครงการใหม่",
    formTitleEdit: "แก้ไขโครงการ",
    fieldCode: "เลขที่โครงการ",
    fieldName: "ชื่อโครงการ",
    fieldClientName: "ชื่อลูกค้า",
    fieldCustomerType: "ประเภทลูกค้า",
    fieldContractValue: "มูลค่าสัญญา (THB)",
    fieldPlannedCost: "ต้นทุนแผน (THB)",
    fieldPlannedRevenue: "รายรับแผน (THB)",
    fieldStartDate: "วันเริ่ม",
    fieldEndDate: "วันสิ้นสุด",
    fieldStatus: "สถานะ",
    fieldNotes: "บันทึก",
    fieldNotesPlaceholder: "รายละเอียดเพิ่มเติม...",

    detailHeader: "รายละเอียดโครงการ",
    alertOverdueTitle: "โครงการเลย deadline",
    alertOverdueDetail: "ปิดโครงการ / เลื่อน deadline / ยกเลิก",
    alertOverBudgetTitle: "ต้นทุนเกินงบประมาณ",
    recentActivityTitle: "กิจกรรมล่าสุด",
    recentActivityEmpty: "ยังไม่มีกิจกรรม — รอ Sprint 3 (PR/RFQ) + Sprint 5 (cost recording)",
    aiInsightsTitle: "AI Insights",
    aiInsightsDetail:
      "Phase 2: margin warning · NL search · cross-project insight · auto-rebalance suggestion",
    costBreakdownTitle: "Cost Breakdown ตาม Cost Code",
    costBreakdownPlaceholder:
      "ต้นทุนจะแสดงเมื่อเริ่มบันทึกใน Sprint 5 (cashflow scoped to project)",

    tabOverview: "ภาพรวม",
    tabPR: "ใบขอซื้อ (PR)",
    tabRFQ: "ขอราคา (RFQ)",
    tabPO: "จัดซื้อ (PO)",
    tabCost: "บันทึกต้นทุน",
    tabInvoice: "ใบแจ้งหนี้",
    tabReports: "รายงาน",
    tabComingSoon: "จะเปิดใช้งานใน Sprint ถัดไป"
  },
  en: {
    heroTitleList: "Projects",
    heroTitleDetail: "Project Detail",
    heroDetailList: "All projects · Cost Control entry point",
    backToHub: "Back to Hub",
    backToList: "← Back to list",
    createProject: "+ Create project",
    cancel: "Cancel",
    save: "Save",
    edit: "Edit",
    delete: "Delete",
    projectAccessActive: "Project Access active",
    projectAccessVisibleProjects: "projects visible to the current user",
    projectAccessBlocked: "Project Access blocked this action",
    projectAccessNoProject: "This project is not visible to the current user or no longer exists",
    projectAccessCreateBlocked: "No permission to create projects",
    projectAccessEditBlocked: "No permission to edit this project",
    projectAccessDeleteBlocked: "No permission to delete/admin this project",

    countLabel: "Total projects",
    creditsLabel: "Credits remaining",
    carouselTitle: "Recent active projects",
    carouselDetail: "Ongoing projects · KPI: budget · time · margin",
    tableTitle: "Project list",
    tableDetail: "All rows · click for detail",
    searchPlaceholder: "Search code / name / customer...",
    emptyTitle: "No projects yet",
    emptyDetail: "Click + Create project to start",
    noBudget: "No budget",
    noCustomer: "No customer — internal",
    remainingDays: "days left",
    overdueDays: "overdue",

    filterAll: "All",

    thCode: "Code",
    thName: "Name",
    thCustomer: "Customer",
    thContract: "Contract",
    thPlanned: "Planned",
    thActual: "Actual",
    thMargin: "Margin %",
    thDays: "Days",
    thStatus: "Status",

    kpiBudgetLeft: "Budget left",
    kpiTimeLeft: "Time left",
    kpiMargin: "Margin",
    kpiContract: "Contract",
    kpiPlannedCost: "Planned cost",
    kpiActualCost: "Actual cost",

    formTitleCreate: "Create new project",
    formTitleEdit: "Edit project",
    fieldCode: "Project code",
    fieldName: "Project name",
    fieldClientName: "Customer name",
    fieldCustomerType: "Customer type",
    fieldContractValue: "Contract value (THB)",
    fieldPlannedCost: "Planned cost (THB)",
    fieldPlannedRevenue: "Planned revenue (THB)",
    fieldStartDate: "Start date",
    fieldEndDate: "End date",
    fieldStatus: "Status",
    fieldNotes: "Notes",
    fieldNotesPlaceholder: "Additional details...",

    detailHeader: "Project detail",
    alertOverdueTitle: "Project overdue",
    alertOverdueDetail: "Close / extend deadline / cancel",
    alertOverBudgetTitle: "Cost over budget",
    recentActivityTitle: "Recent activity",
    recentActivityEmpty: "No activity yet — Sprint 3 (PR/RFQ) + Sprint 5 (cost recording)",
    aiInsightsTitle: "AI Insights",
    aiInsightsDetail:
      "Phase 2: margin warning · NL search · cross-project insight · auto-rebalance",
    costBreakdownTitle: "Cost Breakdown by Cost Code",
    costBreakdownPlaceholder:
      "Costs will appear when Sprint 5 (cashflow scoped to project) is implemented",

    tabOverview: "Overview",
    tabPR: "PR",
    tabRFQ: "RFQ",
    tabPO: "PO",
    tabCost: "Cost recording",
    tabInvoice: "Invoices",
    tabReports: "Reports",
    tabComingSoon: "Activates in upcoming sprint"
  }
};
