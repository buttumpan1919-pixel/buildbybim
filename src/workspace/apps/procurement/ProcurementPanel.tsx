// ProcurementPanel — Sprint 3 (PR) + Sprint 4 scaffold (RFQ)
// Spec: docs/PROCUREMENT_PRD.md Section 6
// Mockup reference: src/MockupGallery.tsx PRMockup + RFQMockup
//
// Routes (single panel, multi-tab):
//   /procurement?tab=pr-list                  (default) PR list
//   /procurement?tab=pr-list&id=<prId>        PR detail (inline drawer)
//   /procurement?tab=rfq-list                 RFQ list (Sprint 4 — placeholder)
//   /procurement?tab=archive                  closed/cancelled

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ClipboardList,
  FileCheck2,
  FileSearch,
  Home,
  Plus,
  Trash2
} from "lucide-react";
import type { WorkspaceAppId } from "../../../apps";
import {
  loadCostCodes,
  type CostCode
} from "../../../costCodes";
import {
  loadProjects,
  type Project
} from "../../../projects";
import {
  addPriceHistoryEntry,
  loadSuppliers,
  saveSuppliers,
  type Supplier,
  type SupplierState
} from "../../../suppliers";
import {
  applyPRAction,
  awardRFQ,
  awardReasonCopy,
  buildComparisonMatrix,
  createPR,
  draftRFQFromPR,
  filterPRs,
  filterRFQs,
  legalActionsFor,
  legalRFQActionsFor,
  loadPRs,
  loadRFQs,
  nextPrNumber,
  nextRfqNumber,
  normalizePRLineItem,
  normalizeRFQResponseExported,
  prStatusCopy,
  recordResponse,
  removePR,
  removeRFQ,
  removeResponse,
  rfqStatusCopy,
  savePRs,
  saveRFQs,
  summarizePRs,
  summarizeRFQs,
  upsertPR,
  upsertRFQ,
  validatePR,
  type AwardReason,
  type PRAction,
  type PRLineItem,
  type PRState,
  type PRStatus,
  type PurchaseRequest,
  type RFQ,
  type RFQResponse,
  type RFQState,
  type RFQStatus
} from "../../../procurement";
import {
  buildEvidenceTargetsForApproval,
  evaluateEvidenceApprovalPolicy,
  evaluateEvidenceRequirement,
  loadEvidenceApprovalPolicy,
  loadEvidenceState,
  type EvidenceApprovalPolicy,
  type EvidenceState
} from "../../../evidence";
import {
  evaluateLocalProjectAccess,
  filterProjectScopedRecordsByAccess,
  getProjectAccessDecisionText,
  hasActiveProjectAccessGrants,
  loadProjectAccessState
} from "../../../projectAccess";
import { PageHeader } from "../../shared/PageHeader";
import { ProjectAccessNotice } from "../../shared/ProjectAccessNotice";
import { SummaryTile } from "../../shared/SummaryTile";

type WorkspaceLanguage = "th" | "en";

type ProcurementPanelProps = {
  activeTab: string;
  language: WorkspaceLanguage;
  onSelectApp: (id: WorkspaceAppId) => void;
};

const money = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0
});

const shortMoney = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `฿${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `฿${(n / 1_000).toFixed(0)}K`;
  return money.format(n);
};

const LOCAL_WORKSPACE_ID = "local-workspace";
const LOCAL_USER_ID = "local-user";

const STATUS_BADGE: Record<
  PRStatus,
  { bg: string; color: string }
> = {
  draft: { bg: "#E5EDF7", color: "#2A4F86" },
  submitted: { bg: "#FFF1CC", color: "#92651A" },
  approved: { bg: "#E1F0E5", color: "#2A6D45" },
  rejected: { bg: "#FFE6E1", color: "#B23E1F" },
  rfq_sent: { bg: "#E5EDF7", color: "#2A4F86" },
  awarded: { bg: "#E1F0E5", color: "#2A6D45" },
  ordered: { bg: "#E1F0E5", color: "#2A6D45" },
  received: { bg: "#E1F0E5", color: "#2A6D45" },
  closed: { bg: "#EAEAE7", color: "#4A4A47" },
  cancelled: { bg: "#FFE6E1", color: "#B23E1F" }
};

const ACTION_COPY: Record<PRAction, { th: string; en: string; tone: "primary" | "secondary" | "danger" }> = {
  submit: { th: "ส่งอนุมัติ", en: "Submit", tone: "primary" },
  approve: { th: "อนุมัติ", en: "Approve", tone: "primary" },
  reject: { th: "ปฏิเสธ", en: "Reject", tone: "danger" },
  send_rfq: { th: "สร้าง RFQ", en: "Create RFQ", tone: "secondary" },
  award: { th: "Award supplier", en: "Award supplier", tone: "primary" },
  order: { th: "ออก PO", en: "Create PO", tone: "primary" },
  receive: { th: "รับของแล้ว", en: "Mark received", tone: "primary" },
  close: { th: "ปิดงาน", en: "Close", tone: "secondary" },
  cancel: { th: "ยกเลิก", en: "Cancel PR", tone: "danger" },
  edit: { th: "กลับไปแก้", en: "Edit (back to draft)", tone: "secondary" }
};

const COPY: Record<
  WorkspaceLanguage,
  {
    heroTitle: string;
    heroDetail: string;
    backToHub: string;
    summaryTotal: string;
    summaryPending: string;
    summaryInProgress: string;
    summaryAmount: string;

    prListTitle: string;
    prListDetail: string;
    createPr: string;
    filterAll: string;
    projectFilterAll: string;
    searchPlaceholder: string;
    emptyTitle: string;
    emptyDetail: string;

    thPrNo: string;
    thProject: string;
    thStatus: string;
    thItems: string;
    thAmount: string;
    thNeeded: string;
    thActions: string;

    detailBackToList: string;
    detailHeader: string;
    fieldProject: string;
    fieldRequestDate: string;
    fieldNeededDate: string;
    fieldNotes: string;
    fieldItems: string;
    addLineItem: string;
    removeLineItem: string;
    itemCostCode: string;
    itemDescription: string;
    itemQuantity: string;
    itemUnit: string;
    itemUnitPrice: string;
    itemAmount: string;
    itemPreferredSupplier: string;
    itemNote: string;
    itemSelectCode: string;
    itemSelectSupplier: string;
    totalLabel: string;

    save: string;
    cancel: string;
    edit: string;
    deletePr: string;
    confirmDelete: string;

    actionPromptReason: string;
    actionPromptApprover: string;
    actionLogged: string;

    rfqPlaceholderTitle: string;
    rfqPlaceholderDetail: string;
    archiveTitle: string;
    archiveEmpty: string;

    // RFQ
    rfqListTitle: string;
    rfqListDetail: string;
    rfqEmptyTitle: string;
    rfqEmptyDetail: string;
    thRfqNo: string;
    thInvited: string;
    thResponses: string;
    thItem: string;
    sendRfq: string;
    cancelRfq: string;
    deleteRfq: string;
    rfqConfirmDelete: string;
    rfqOrphanTitle: string;
    rfqOrphanDetail: string;
    inviteTitle: string;
    inviteDetail: string;
    responsesTitle: string;
    responsesDetail: string;
    compareTitle: string;
    compareDetail: string;
    awardButton: string;
    awardPromptHeader: string;
    paymentTerms: string;
    deliveryDate: string;
    validUntil: string;
    responseNotes: string;
    noBidButton: string;
    rfqAwardEvidenceTitle: string;
    rfqAwardEvidenceDetail: string;
    rfqAwardEvidenceVerified: string;
    rfqAwardEvidenceNeedsReview: string;
    rfqAwardEvidenceMissing: string;
    rfqAwardEvidencePolicyOff: string;
    rfqAwardEvidenceBlocked: string;
    rfqAwardEvidenceConfirm: string;
    openEvidence: string;
    projectAccessActive: string;
    projectAccessVisibleProjects: string;
    projectAccessBlocked: string;
    projectAccessCreateBlocked: string;
    projectAccessWriteBlocked: string;
    projectAccessApproveBlocked: string;
  }
> = {
  th: {
    heroTitle: "Procurement (PR/RFQ)",
    heroDetail: "Purchase Request workflow · เชื่อมกับ Project + Cost Code + Supplier",
    backToHub: "กลับ Hub",
    summaryTotal: "PR ทั้งหมด",
    summaryPending: "รออนุมัติ",
    summaryInProgress: "ดำเนินการ",
    summaryAmount: "มูลค่ารวม",

    prListTitle: "รายการ Purchase Request",
    prListDetail: "filter ตามสถานะ/โครงการ · click row ดูรายละเอียด",
    createPr: "+ สร้าง PR",
    filterAll: "ทั้งหมด",
    projectFilterAll: "ทุกโครงการ",
    searchPlaceholder: "ค้นหา เลขที่ / บันทึก...",
    emptyTitle: "ยังไม่มี PR",
    emptyDetail: "กด + สร้าง PR เพื่อเริ่ม",

    thPrNo: "เลขที่",
    thProject: "โครงการ",
    thStatus: "สถานะ",
    thItems: "items",
    thAmount: "มูลค่า",
    thNeeded: "ต้องการก่อน",
    thActions: "",

    detailBackToList: "← กลับรายการ PR",
    detailHeader: "รายละเอียด PR",
    fieldProject: "โครงการ",
    fieldRequestDate: "วันที่ขอ",
    fieldNeededDate: "ต้องการก่อนวันที่",
    fieldNotes: "บันทึก",
    fieldItems: "รายการสินค้า / บริการ",
    addLineItem: "+ เพิ่มรายการ",
    removeLineItem: "ลบ",
    itemCostCode: "Cost Code",
    itemDescription: "รายการ",
    itemQuantity: "จำนวน",
    itemUnit: "หน่วย",
    itemUnitPrice: "ราคา/หน่วย",
    itemAmount: "รวม",
    itemPreferredSupplier: "Supplier (preferred)",
    itemNote: "หมายเหตุ",
    itemSelectCode: "เลือก code",
    itemSelectSupplier: "—",
    totalLabel: "รวมทั้งสิ้น",

    save: "บันทึก",
    cancel: "ยกเลิก",
    edit: "แก้",
    deletePr: "ลบ PR",
    confirmDelete: "ลบ PR นี้?",

    actionPromptReason: "เหตุผลที่ปฏิเสธ:",
    actionPromptApprover: "ผู้อนุมัติ (user id):",
    actionLogged: "อัพเดตสถานะแล้ว",

    rfqPlaceholderTitle: "RFQ workflow",
    rfqPlaceholderDetail:
      "Sprint 4 — invite suppliers · บันทึก response · เปรียบเทียบราคา · award + auto-create PO",
    archiveTitle: "PR ที่ปิด / ยกเลิก",
    archiveEmpty: "ยังไม่มี PR ที่ปิดหรือยกเลิก",

    rfqListTitle: "Request for Quotation (RFQ)",
    rfqListDetail: "ผ่าน Send RFQ จาก PR ที่ approved · click เพื่อจัดการ invite/response/award",
    rfqEmptyTitle: "ยังไม่มี RFQ",
    rfqEmptyDetail: "ไปที่ PR detail แล้วกด \"Send RFQ\" เพื่อเริ่ม",
    thRfqNo: "RFQ No",
    thInvited: "Invited",
    thResponses: "Responses",
    thItem: "รายการ",
    sendRfq: "Send to suppliers",
    cancelRfq: "ยกเลิก RFQ",
    deleteRfq: "ลบ RFQ",
    rfqConfirmDelete: "ลบ RFQ นี้?",
    rfqOrphanTitle: "ไม่พบ PR ต้นทาง",
    rfqOrphanDetail: "PR ที่อ้างถึงอาจถูกลบ — RFQ นี้ orphan",
    inviteTitle: "Invite suppliers",
    inviteDetail: "เลือก supplier ที่จะส่งคำขอราคา · suppliers ที่ตั้งเป็น preferred ใน PR จะถูก check ให้ก่อน",
    responsesTitle: "บันทึก response",
    responsesDetail: "ใส่ราคา/หน่วยรายตัว + payment terms + delivery date · กด no bid ถ้า supplier ไม่มีรายการนั้น",
    compareTitle: "เปรียบเทียบราคา",
    compareDetail: "Cell ที่ราคา ถูกที่สุดต่อรายการจะ highlight สีเขียว · row สุดท้ายแสดงรวมของแต่ละ supplier · click Award เพื่อเลือก",
    awardButton: "Award",
    awardPromptHeader: "เลือกเหตุผลการ award:",
    paymentTerms: "เครดิตเทอม",
    deliveryDate: "วันส่ง",
    validUntil: "ราคามีผลถึง",
    responseNotes: "หมายเหตุ",
    noBidButton: "Mark no-bid",
    rfqAwardEvidenceTitle: "Evidence Gate ก่อน Award",
    rfqAwardEvidenceDetail: "ต้องมี direct verified evidence ที่ผูกกับ RFQ นี้เมื่อยอดถึง policy",
    rfqAwardEvidenceVerified: "พร้อม award: มีหลักฐานตรง RFQ แล้ว",
    rfqAwardEvidenceNeedsReview: "มีหลักฐานแล้ว แต่ยังไม่ verified",
    rfqAwardEvidenceMissing: "ยังไม่มีหลักฐานตรง RFQ",
    rfqAwardEvidencePolicyOff: "ปิด gate สำหรับ RFQ award",
    rfqAwardEvidenceBlocked: "บล็อกการ award: RFQ นี้ต้องมี direct verified evidence ก่อน",
    rfqAwardEvidenceConfirm: "ยังไม่มี direct verified evidence สำหรับ RFQ นี้ ต้องการ award ต่อหรือไม่?",
    openEvidence: "เปิด Evidence",
    projectAccessActive: "Project Access เปิดใช้งาน",
    projectAccessVisibleProjects: "โครงการที่เห็นได้ใน Procurement",
    projectAccessBlocked: "Project Access บล็อกการทำงานนี้",
    projectAccessCreateBlocked: "ไม่มีสิทธิ์สร้าง PR ในโครงการที่เห็นได้",
    projectAccessWriteBlocked: "ไม่มีสิทธิ์แก้ไข PR/RFQ โครงการนี้",
    projectAccessApproveBlocked: "ไม่มีสิทธิ์อนุมัติ/award โครงการนี้"
  },
  en: {
    heroTitle: "Procurement (PR/RFQ)",
    heroDetail: "Purchase Request workflow — wired to Project + Cost Code + Supplier",
    backToHub: "Back to Hub",
    summaryTotal: "Total PRs",
    summaryPending: "Pending approval",
    summaryInProgress: "In progress",
    summaryAmount: "Total amount",

    prListTitle: "Purchase Requests",
    prListDetail: "Filter by status / project · click row for detail",
    createPr: "+ Create PR",
    filterAll: "All",
    projectFilterAll: "All projects",
    searchPlaceholder: "Search PR no / notes...",
    emptyTitle: "No PRs yet",
    emptyDetail: "Click + Create PR to start",

    thPrNo: "PR No",
    thProject: "Project",
    thStatus: "Status",
    thItems: "Items",
    thAmount: "Amount",
    thNeeded: "Needed by",
    thActions: "",

    detailBackToList: "← Back to PR list",
    detailHeader: "PR detail",
    fieldProject: "Project",
    fieldRequestDate: "Request date",
    fieldNeededDate: "Needed by",
    fieldNotes: "Notes",
    fieldItems: "Line items",
    addLineItem: "+ Add line item",
    removeLineItem: "Remove",
    itemCostCode: "Cost code",
    itemDescription: "Description",
    itemQuantity: "Qty",
    itemUnit: "Unit",
    itemUnitPrice: "Unit price",
    itemAmount: "Amount",
    itemPreferredSupplier: "Preferred supplier",
    itemNote: "Note",
    itemSelectCode: "Pick a code",
    itemSelectSupplier: "—",
    totalLabel: "Grand total",

    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    deletePr: "Delete PR",
    confirmDelete: "Delete this PR?",

    actionPromptReason: "Reject reason:",
    actionPromptApprover: "Approver (user id):",
    actionLogged: "Status updated",

    rfqPlaceholderTitle: "RFQ workflow",
    rfqPlaceholderDetail:
      "Sprint 4 — invite suppliers · record responses · compare prices · award + auto-create PO",
    archiveTitle: "Closed / cancelled PRs",
    archiveEmpty: "No closed or cancelled PRs yet",

    rfqListTitle: "Request for Quotation (RFQ)",
    rfqListDetail: "Created via Send RFQ from an approved PR — click to manage invite/responses/award",
    rfqEmptyTitle: "No RFQ yet",
    rfqEmptyDetail: 'Open a PR detail and click "Send RFQ" to start',
    thRfqNo: "RFQ No",
    thInvited: "Invited",
    thResponses: "Responses",
    thItem: "Item",
    sendRfq: "Send to suppliers",
    cancelRfq: "Cancel RFQ",
    deleteRfq: "Delete RFQ",
    rfqConfirmDelete: "Delete this RFQ?",
    rfqOrphanTitle: "Source PR not found",
    rfqOrphanDetail: "The referenced PR may have been deleted — this RFQ is orphan",
    inviteTitle: "Invite suppliers",
    inviteDetail: "Pick suppliers to invite — preferred suppliers from the source PR are pre-selected",
    responsesTitle: "Record responses",
    responsesDetail: "Enter unit price per item + payment terms + delivery date · click no-bid if supplier can't quote",
    compareTitle: "Compare quotes",
    compareDetail: "Cheapest available cell per item is highlighted green · last row shows per-supplier total · click Award to pick winner",
    awardButton: "Award",
    awardPromptHeader: "Pick award reason:",
    paymentTerms: "Payment terms",
    deliveryDate: "Delivery date",
    validUntil: "Valid until",
    responseNotes: "Notes",
    noBidButton: "Mark no-bid",
    rfqAwardEvidenceTitle: "Evidence Gate before award",
    rfqAwardEvidenceDetail: "Requires direct verified evidence linked to this RFQ once the policy amount is reached",
    rfqAwardEvidenceVerified: "Ready to award: direct RFQ evidence is verified",
    rfqAwardEvidenceNeedsReview: "Evidence exists, but it is not verified yet",
    rfqAwardEvidenceMissing: "No direct RFQ evidence yet",
    rfqAwardEvidencePolicyOff: "RFQ award gate is off",
    rfqAwardEvidenceBlocked: "Award blocked: direct verified evidence is required first.",
    rfqAwardEvidenceConfirm: "No direct verified evidence is linked to this RFQ. Continue awarding anyway?",
    openEvidence: "Open Evidence",
    projectAccessActive: "Project Access active",
    projectAccessVisibleProjects: "projects visible in Procurement",
    projectAccessBlocked: "Project Access blocked this action",
    projectAccessCreateBlocked: "No permission to create PRs in visible projects",
    projectAccessWriteBlocked: "No permission to edit PR/RFQ for this project",
    projectAccessApproveBlocked: "No permission to approve or award this project"
  }
};

function getQueryParam(name: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
}

function setQueryParam(name: string, value: string | null) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  if (value === null || value === "") params.delete(name);
  else params.set(name, value);
  const next = `${window.location.pathname}?${params.toString()}`;
  window.history.pushState(window.history.state, "", next);
}

export function ProcurementPanel({ activeTab, language, onSelectApp }: ProcurementPanelProps) {
  const copy = COPY[language];
  const [state, setState] = useState<PRState>(() => loadPRs());
  const [rfqState, setRfqState] = useState<RFQState>(() => loadRFQs());
  const [supplierState, setSupplierState] = useState<SupplierState>(() => loadSuppliers());
  const [evidenceState, setEvidenceState] = useState<EvidenceState>(() => loadEvidenceState());
  const [evidencePolicy, setEvidencePolicy] = useState<EvidenceApprovalPolicy>(() =>
    loadEvidenceApprovalPolicy()
  );
  const [activeId, setActiveId] = useState<string | null>(() => getQueryParam("id"));
  const [activeRfqId, setActiveRfqId] = useState<string | null>(() => getQueryParam("rfqId"));
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    savePRs(state);
  }, [state]);

  useEffect(() => {
    saveRFQs(rfqState);
  }, [rfqState]);

  useEffect(() => {
    saveSuppliers(supplierState);
  }, [supplierState]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
      setActiveId(getQueryParam("id"));
      setActiveRfqId(getQueryParam("rfqId"));
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  const projectAccessState = loadProjectAccessState();
  const hasProjectAccessConfig = hasActiveProjectAccessGrants(projectAccessState);
  const projects = useMemo(() => loadProjects().projects, []);
  const readableProjects = useMemo(
    () =>
      filterProjectScopedRecordsByAccess(
        projects,
        projectAccessState,
        "procurement.read",
        (project) => project.id,
        { includeUnscoped: false }
      ),
    [projectAccessState, projects]
  );
  const writableProjects = useMemo(
    () =>
      filterProjectScopedRecordsByAccess(
        projects,
        projectAccessState,
        "procurement.write",
        (project) => project.id,
        { includeUnscoped: false }
      ),
    [projectAccessState, projects]
  );
  const readableProjectIds = useMemo(
    () => new Set(readableProjects.map((project) => project.id)),
    [readableProjects]
  );
  const costCodes = useMemo(() => loadCostCodes().codes.filter((c) => c.active), []);
  const suppliers = useMemo(
    () => supplierState.suppliers.filter((s) => s.active),
    [supplierState.suppliers]
  );
  const scopedState = useMemo<PRState>(
    () => ({
      ...state,
      prs: hasProjectAccessConfig
        ? state.prs.filter((pr) => readableProjectIds.has(pr.projectId))
        : state.prs
    }),
    [hasProjectAccessConfig, readableProjectIds, state]
  );
  const scopedRfqState = useMemo<RFQState>(
    () => ({
      ...rfqState,
      rfqs: hasProjectAccessConfig
        ? rfqState.rfqs.filter((rfq) => readableProjectIds.has(rfq.projectId))
        : rfqState.rfqs
    }),
    [hasProjectAccessConfig, readableProjectIds, rfqState]
  );
  const summary = useMemo(() => summarizePRs(scopedState), [scopedState]);
  const rfqSummary = useMemo(() => summarizeRFQs(scopedRfqState), [scopedRfqState]);

  const canCreatePr = writableProjects.length > 0 || !hasProjectAccessConfig;
  const createBlockedReason = canCreatePr ? "" : copy.projectAccessCreateBlocked;

  const guardProjectAccess = (
    permission: "procurement.write" | "procurement.approve",
    projectId: string,
    blockedLabel: string
  ) => {
    const decision = evaluateLocalProjectAccess(loadProjectAccessState(), permission, projectId);
    if (decision.allowed) return true;
    if (typeof window !== "undefined") {
      window.alert(`${blockedLabel}: ${getProjectAccessDecisionText(decision)}`);
    }
    return false;
  };
  const accessNotice = hasProjectAccessConfig ? (
    <ProjectAccessNotice>
      {copy.projectAccessActive}: {readableProjects.length} / {projects.length}{" "}
      {copy.projectAccessVisibleProjects}
    </ProjectAccessNotice>
  ) : null;

  const openDetail = (id: string) => {
    setActiveId(id);
    setQueryParam("id", id);
  };
  const closeDetail = () => {
    setActiveId(null);
    setQueryParam("id", null);
    setShowCreate(false);
  };

  const openRfqDetail = (id: string) => {
    setActiveRfqId(id);
    setQueryParam("rfqId", id);
  };
  const closeRfqDetail = () => {
    setActiveRfqId(null);
    setQueryParam("rfqId", null);
  };

  const handleUpsert = (pr: Partial<PurchaseRequest>): string[] => {
    const errors = validatePR(pr);
    if (errors.length > 0) return errors;
    const existing = pr.id ? state.prs.find((item) => item.id === pr.id) : null;
    const projectId = pr.projectId || existing?.projectId || "";
    const access = evaluateLocalProjectAccess(
      loadProjectAccessState(),
      "procurement.write",
      projectId
    );
    if (!access.allowed) {
      return [`${copy.projectAccessWriteBlocked}: ${getProjectAccessDecisionText(access)}`];
    }
    setState((current) => upsertPR(current, { ...pr, workspaceId: LOCAL_WORKSPACE_ID }));
    return [];
  };

  const handleDelete = (id: string) => {
    const pr = state.prs.find((item) => item.id === id);
    if (
      pr &&
      !guardProjectAccess("procurement.write", pr.projectId, copy.projectAccessWriteBlocked)
    ) {
      return;
    }
    setState((current) => removePR(current, id));
    closeDetail();
  };

  const handleAction = (pr: PurchaseRequest, action: PRAction) => {
    const permission =
      action === "approve" || action === "reject" || action === "award"
        ? "procurement.approve"
        : "procurement.write";
    const blockedLabel =
      permission === "procurement.approve"
        ? copy.projectAccessApproveBlocked
        : copy.projectAccessWriteBlocked;
    if (!guardProjectAccess(permission, pr.projectId, blockedLabel)) return;

    let context = {};
    if (action === "reject") {
      const reason =
        typeof window !== "undefined"
          ? window.prompt(copy.actionPromptReason) ?? ""
          : "";
      if (!reason.trim()) return;
      context = { reason };
    } else if (action === "approve") {
      const approver =
        typeof window !== "undefined"
          ? window.prompt(copy.actionPromptApprover, LOCAL_USER_ID) ?? ""
          : LOCAL_USER_ID;
      if (!approver.trim()) return;
      context = { approverId: approver };
    } else if (action === "send_rfq") {
      // Sprint 4: create draft RFQ from PR + auto-number + open it
      try {
        const draft = draftRFQFromPR(pr, LOCAL_USER_ID);
        const rfqNo = nextRfqNumber(rfqState.rfqs);
        const draftWithNo: RFQ = { ...draft, rfqNo };
        setRfqState((current) => upsertRFQ(current, draftWithNo));
        const next = applyPRAction(pr, "send_rfq", { linkedRfqId: draft.id });
        setState((current) => upsertPR(current, next));
        openRfqDetail(draft.id);
        // Switch URL tab to rfq-list so the detail renders in the right place
        setQueryParam("tab", "rfq-list");
      } catch (err) {
        if (typeof window !== "undefined") {
          window.alert(err instanceof Error ? err.message : "send_rfq failed");
        }
      }
      return;
    } else if (action === "award") {
      // Direct award without RFQ flow — kept as escape hatch
      const fallback = pr.items[0]?.preferredSupplierId ?? "";
      const supplierId =
        typeof window !== "undefined"
          ? window.prompt("Awarded supplier id:", fallback) ?? fallback
          : fallback;
      if (!supplierId.trim()) return;
      context = { awardedSupplierId: supplierId };
    } else if (action === "order") {
      const docId =
        typeof window !== "undefined"
          ? window.prompt("BuildDocs PO id (optional):", "") ?? ""
          : "";
      context = docId ? { linkedPoDocumentId: docId } : {};
    }

    try {
      const next = applyPRAction(pr, action, context);
      setState((current) => upsertPR(current, next));
    } catch (err) {
      if (typeof window !== "undefined") {
        window.alert(err instanceof Error ? err.message : "transition failed");
      }
    }
  };

  // RFQ helpers passed down to RFQ detail
  const handleRfqUpsert = (rfq: RFQ) => {
    if (!guardProjectAccess("procurement.write", rfq.projectId, copy.projectAccessWriteBlocked)) {
      return;
    }
    setRfqState((current) => upsertRFQ(current, rfq));
  };
  const handleRfqDelete = (id: string) => {
    const rfq = rfqState.rfqs.find((item) => item.id === id);
    if (
      rfq &&
      !guardProjectAccess("procurement.write", rfq.projectId, copy.projectAccessWriteBlocked)
    ) {
      return;
    }
    setRfqState((current) => removeRFQ(current, id));
    closeRfqDetail();
  };
  const handleRfqRecordResponse = (rfq: RFQ, response: Partial<RFQResponse>) => {
    if (!guardProjectAccess("procurement.write", rfq.projectId, copy.projectAccessWriteBlocked)) {
      return;
    }
    try {
      const next = recordResponse(rfq, response);
      handleRfqUpsert(next);
    } catch (err) {
      if (typeof window !== "undefined") {
        window.alert(err instanceof Error ? err.message : "record failed");
      }
    }
  };
  const handleRfqRemoveResponse = (rfq: RFQ, responseId: string) => {
    if (!guardProjectAccess("procurement.write", rfq.projectId, copy.projectAccessWriteBlocked)) {
      return;
    }
    handleRfqUpsert(removeResponse(rfq, responseId));
  };
  const handleRfqAward = (
    rfq: RFQ,
    awardedSupplierId: string,
    awardReason: AwardReason
  ) => {
    if (!guardProjectAccess("procurement.approve", rfq.projectId, copy.projectAccessApproveBlocked)) {
      return;
    }
    const sourcePr = state.prs.find((p) => p.id === rfq.prId);
    if (!sourcePr) {
      if (typeof window !== "undefined") {
        window.alert("Source PR not found — cannot award");
      }
      return;
    }
    const currentEvidenceState = loadEvidenceState();
    const currentEvidencePolicy = loadEvidenceApprovalPolicy();
    setEvidenceState(currentEvidenceState);
    setEvidencePolicy(currentEvidencePolicy);
    const awardedResponse = rfq.responses.find((response) => response.supplierId === awardedSupplierId);
    const awardEvidence = evaluateEvidenceRequirement(
      currentEvidenceState,
      buildEvidenceTargetsForApproval({
        targetType: "rfq_award",
        targetId: rfq.id,
        projectId: rfq.projectId,
        supplierId: awardedSupplierId
      })
    );
    const policyDecision = evaluateEvidenceApprovalPolicy(
      currentEvidencePolicy,
      { targetType: "rfq_award", amount: awardedResponse?.totalAmount ?? 0 },
      awardEvidence
    );
    if (policyDecision.blocked) {
      if (typeof window !== "undefined") window.alert(copy.rfqAwardEvidenceBlocked);
      return;
    }
    if (policyDecision.shouldConfirm && typeof window !== "undefined") {
      const confirmed = window.confirm(copy.rfqAwardEvidenceConfirm);
      if (!confirmed) return;
    }
    try {
      const result = awardRFQ(rfq, sourcePr, awardedSupplierId, awardReason);
      handleRfqUpsert(result.rfq);
      setState((current) => upsertPR(current, result.pr));
      // Append to supplier price history
      if (result.priceHistoryAppendages.length > 0) {
        setSupplierState((current) => {
          let next = current;
          for (const entry of result.priceHistoryAppendages) {
            next = addPriceHistoryEntry(next, entry);
          }
          return next;
        });
      }
    } catch (err) {
      if (typeof window !== "undefined") {
        window.alert(err instanceof Error ? err.message : "award failed");
      }
    }
  };

  // ----- Render router -----
  if (activeTab === "rfq-list") {
    const activeRfq =
      activeRfqId !== null ? scopedRfqState.rfqs.find((r) => r.id === activeRfqId) ?? null : null;
    return (
      <PanelShell copy={copy} onSelectApp={onSelectApp} summary={summary} accessNotice={accessNotice}>
        {activeRfq ? (
          <RfqDetail
            copy={copy}
            rfq={activeRfq}
            prs={scopedState.prs}
            suppliers={suppliers}
            onBack={closeRfqDetail}
            onUpsert={handleRfqUpsert}
            onDelete={handleRfqDelete}
            onRecordResponse={handleRfqRecordResponse}
            onRemoveResponse={handleRfqRemoveResponse}
            onAward={handleRfqAward}
            evidenceState={evidenceState}
            evidencePolicy={evidencePolicy}
            onOpenEvidence={() => onSelectApp("evidence")}
            language={language}
          />
        ) : (
          <RfqListTab
            copy={copy}
            state={scopedRfqState}
            summary={rfqSummary}
            prs={scopedState.prs}
            projects={readableProjects}
            onOpen={openRfqDetail}
            language={language}
          />
        )}
      </PanelShell>
    );
  }
  if (activeTab === "archive") {
    return (
      <PanelShell copy={copy} onSelectApp={onSelectApp} summary={summary} accessNotice={accessNotice}>
        <ArchiveTab copy={copy} state={scopedState} projects={readableProjects} onOpen={openDetail} language={language} />
      </PanelShell>
    );
  }

  const activePr =
    activeId !== null ? scopedState.prs.find((p) => p.id === activeId) ?? null : null;

  return (
    <PanelShell copy={copy} onSelectApp={onSelectApp} summary={summary} accessNotice={accessNotice}>
      {activePr ? (
        <PrDetail
          copy={copy}
          pr={activePr}
          projects={readableProjects}
          costCodes={costCodes}
          suppliers={suppliers}
          onBack={closeDetail}
          onUpsert={handleUpsert}
          onDelete={handleDelete}
          onAction={handleAction}
          language={language}
        />
      ) : showCreate ? (
        <PrDetail
          copy={copy}
          pr={
            createPR({
              workspaceId: LOCAL_WORKSPACE_ID,
              prNo: nextPrNumber(state.prs),
              projectId: writableProjects[0]?.id ?? "",
              requestedBy: LOCAL_USER_ID,
              items: [normalizePRLineItem({})]
            })
          }
          projects={writableProjects}
          costCodes={costCodes}
          suppliers={suppliers}
          onBack={() => setShowCreate(false)}
          onUpsert={(pr) => {
            const errors = handleUpsert(pr);
            if (errors.length === 0) {
              setShowCreate(false);
              if (pr.id) openDetail(pr.id);
            }
            return errors;
          }}
          onDelete={() => setShowCreate(false)}
          onAction={handleAction}
          language={language}
        />
      ) : (
        <PrListTab
          copy={copy}
          state={scopedState}
          projects={readableProjects}
          onOpen={openDetail}
          onCreate={() => setShowCreate(true)}
          canCreate={canCreatePr}
          createBlockedReason={createBlockedReason}
          language={language}
        />
      )}
    </PanelShell>
  );
}

function PanelShell({
  copy,
  onSelectApp,
  summary,
  accessNotice,
  children
}: {
  copy: (typeof COPY)["th"];
  onSelectApp: (id: WorkspaceAppId) => void;
  summary: ReturnType<typeof summarizePRs>;
  accessNotice?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="workspace-hub" aria-label={copy.heroTitle}>
      <div className="module-hero">
        <div>
          <h1>{copy.heroTitle}</h1>
          <p>{copy.heroDetail}</p>
        </div>
        <div className="module-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={() => onSelectApp("hub")}
          >
            <Home size={18} /> {copy.backToHub}
          </button>
        </div>
      </div>
      <div className="summary-grid hub-summary-grid hub-summary-grid--wide">
        <SummaryTile label={copy.summaryTotal} value={summary.total.toString()} strong />
        <SummaryTile label={copy.summaryPending} value={summary.pendingApproval.toString()} />
        <SummaryTile label={copy.summaryInProgress} value={summary.inProgress.toString()} />
        <SummaryTile label={copy.summaryAmount} value={shortMoney(summary.totalAmount)} />
      </div>
      {accessNotice}
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// PR List tab
// ---------------------------------------------------------------------------

function PrListTab({
  copy,
  state,
  projects,
  onOpen,
  onCreate,
  canCreate,
  createBlockedReason,
  language
}: {
  copy: (typeof COPY)["th"];
  state: PRState;
  projects: Project[];
  onOpen: (id: string) => void;
  onCreate: () => void;
  canCreate: boolean;
  createBlockedReason: string;
  language: WorkspaceLanguage;
}) {
  const [statusFilter, setStatusFilter] = useState<PRStatus | "all">("all");
  const [projectFilter, setProjectFilter] = useState<string | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => filterPRs(state, { status: statusFilter, projectId: projectFilter, search }),
    [state, statusFilter, projectFilter, search]
  );

  const statusCounts: Record<"all" | PRStatus, number> = useMemo(() => {
    const counts: Record<string, number> = { all: state.prs.length };
    for (const s of Object.keys(prStatusCopy) as PRStatus[]) counts[s] = 0;
    for (const pr of state.prs) counts[pr.status] = (counts[pr.status] ?? 0) + 1;
    return counts as Record<"all" | PRStatus, number>;
  }, [state.prs]);

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? "—";

  const visibleStatusChips: Array<"all" | PRStatus> = [
    "all",
    "draft",
    "submitted",
    "approved",
    "rfq_sent",
    "awarded",
    "ordered",
    "received"
  ];

  return (
    <div className="module-board" style={{ padding: 18, marginTop: 14 }}>
      <PageHeader title={copy.prListTitle} detail={copy.prListDetail} />

      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          alignItems: "center",
          margin: "14px 0"
        }}
      >
        {visibleStatusChips.map((s) => {
          const isActive = statusFilter === s;
          const label =
            s === "all" ? copy.filterAll : prStatusCopy[s as PRStatus][language];
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                border: isActive ? "1px solid var(--ink)" : "1px solid var(--line)",
                background: isActive ? "var(--ink)" : "var(--panel)",
                color: isActive ? "#fff" : "var(--ink-3)",
                cursor: "pointer",
                fontSize: 12,
                fontFamily: "var(--mono)"
              }}
            >
              {label}
              <span style={{ marginLeft: 4, opacity: 0.6 }}>{statusCounts[s] ?? 0}</span>
            </button>
          );
        })}
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          style={{
            ...inputStyle,
            flex: "0 0 180px"
          }}
        >
          <option value="all">{copy.projectFilterAll}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code || p.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={copy.searchPlaceholder}
          style={{ ...inputStyle, flex: "1 1 200px" }}
        />
        <button
          className="primary-button"
          disabled={!canCreate}
          onClick={onCreate}
          title={canCreate ? undefined : createBlockedReason}
          type="button"
        >
          <Plus size={16} /> {copy.createPr}
        </button>
      </div>

      {!canCreate && (
        <ProjectAccessNotice tone="warning">
          {copy.projectAccessCreateBlocked}
        </ProjectAccessNotice>
      )}

      {filtered.length === 0 ? (
        <div
          style={{
            padding: 30,
            textAlign: "center",
            color: "var(--ink-5)",
            background: "var(--panel-soft, #F4F4F2)",
            borderRadius: 8
          }}
        >
          <ClipboardList size={28} style={{ opacity: 0.4, marginBottom: 8 }} />
          <div style={{ fontWeight: 700 }}>{copy.emptyTitle}</div>
          <div style={{ fontSize: 12 }}>{copy.emptyDetail}</div>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 12,
              minWidth: 840
            }}
          >
            <thead>
              <tr>
                {[
                  copy.thPrNo,
                  copy.thProject,
                  copy.thStatus,
                  copy.thItems,
                  copy.thAmount,
                  copy.thNeeded
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "10px 12px",
                      background: "var(--panel-soft, #F4F4F2)",
                      fontFamily: "var(--mono)",
                      fontSize: 10,
                      textTransform: "uppercase",
                      color: "var(--ink-5)"
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((pr) => {
                const badge = STATUS_BADGE[pr.status];
                return (
                  <tr
                    key={pr.id}
                    onClick={() => onOpen(pr.id)}
                    style={{ borderTop: "1px solid var(--line)", cursor: "pointer" }}
                  >
                    <td
                      style={{
                        padding: "10px 12px",
                        fontFamily: "var(--mono)",
                        fontWeight: 700
                      }}
                    >
                      {pr.prNo}
                    </td>
                    <td style={{ padding: "10px 12px" }}>{projectName(pr.projectId)}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span
                        style={{
                          background: badge.bg,
                          color: badge.color,
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600
                        }}
                      >
                        {prStatusCopy[pr.status][language]}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        fontFamily: "var(--mono)",
                        textAlign: "right"
                      }}
                    >
                      {pr.items.length}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        fontFamily: "var(--mono)",
                        textAlign: "right",
                        fontWeight: 700
                      }}
                    >
                      {money.format(pr.totalAmount)}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        fontFamily: "var(--mono)",
                        color: "var(--ink-4)"
                      }}
                    >
                      {pr.neededByDate || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PR Detail (edit / create) — single form for both modes
// ---------------------------------------------------------------------------

function PrDetail({
  copy,
  pr,
  projects,
  costCodes,
  suppliers,
  onBack,
  onUpsert,
  onDelete,
  onAction,
  language
}: {
  copy: (typeof COPY)["th"];
  pr: PurchaseRequest;
  projects: Project[];
  costCodes: CostCode[];
  suppliers: Supplier[];
  onBack: () => void;
  onUpsert: (pr: Partial<PurchaseRequest>) => string[];
  onDelete: (id: string) => void;
  onAction: (pr: PurchaseRequest, action: PRAction) => void;
  language: WorkspaceLanguage;
}) {
  const [draft, setDraft] = useState<PurchaseRequest>(pr);
  const [errors, setErrors] = useState<string[]>([]);

  // Reset draft when PR changes (e.g. via popstate or after status action)
  useEffect(() => {
    setDraft(pr);
    setErrors([]);
  }, [pr.id, pr.updatedAt]);

  const readonly = draft.status !== "draft" && draft.status !== "rejected";
  const totalAmount = draft.items.reduce((sum, it) => sum + it.amount, 0);
  const badge = STATUS_BADGE[draft.status];

  const updateField = <K extends keyof PurchaseRequest>(key: K, value: PurchaseRequest[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const updateItem = (index: number, patch: Partial<PRLineItem>) => {
    setDraft((current) => ({
      ...current,
      items: current.items.map((it, i) =>
        i === index ? normalizePRLineItem({ ...it, ...patch }) : it
      )
    }));
  };

  const removeItem = (index: number) => {
    setDraft((current) => ({
      ...current,
      items: current.items.filter((_, i) => i !== index)
    }));
  };

  const addItem = () => {
    setDraft((current) => ({
      ...current,
      items: [...current.items, normalizePRLineItem({})]
    }));
  };

  const handleSave = () => {
    const result = onUpsert({
      ...draft,
      items: draft.items.map((it) => normalizePRLineItem(it))
    });
    setErrors(result);
  };

  const actions = legalActionsFor(draft.status);

  return (
    <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
      <div
        style={{
          padding: 18,
          background: "var(--panel)",
          border: "1px solid var(--line)",
          borderRadius: 10,
          display: "grid",
          gap: 12
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button
            className="secondary-button"
            type="button"
            onClick={onBack}
            style={{ fontFamily: "inherit" }}
          >
            <ArrowLeft size={14} /> {copy.detailBackToList}
          </button>
          <h2
            style={{
              margin: 0,
              fontFamily: "var(--mono)",
              fontSize: 18,
              fontWeight: 700
            }}
          >
            {draft.prNo}
          </h2>
          <span
            style={{
              background: badge.bg,
              color: badge.color,
              padding: "3px 10px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600
            }}
          >
            ● {prStatusCopy[draft.status][language]}
          </span>
          {readonly && (
            <span style={{ fontSize: 11, color: "var(--ink-5)", fontFamily: "var(--mono)" }}>
              read-only · ใช้ "Edit (back to draft)" เพื่อแก้
            </span>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 10
          }}
        >
          <FormField label={copy.fieldProject} required>
            <select
              value={draft.projectId}
              onChange={(e) => updateField("projectId", e.target.value)}
              disabled={readonly}
              style={inputStyle}
            >
              <option value="">—</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code ? `${p.code} · ` : ""}
                  {p.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label={copy.fieldRequestDate}>
            <input
              type="date"
              value={draft.requestDate}
              onChange={(e) => updateField("requestDate", e.target.value)}
              disabled={readonly}
              style={inputStyle}
            />
          </FormField>
          <FormField label={copy.fieldNeededDate}>
            <input
              type="date"
              value={draft.neededByDate}
              onChange={(e) => updateField("neededByDate", e.target.value)}
              disabled={readonly}
              style={inputStyle}
            />
          </FormField>
        </div>
        <FormField label={copy.fieldNotes}>
          <textarea
            value={draft.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            disabled={readonly}
            rows={2}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </FormField>

        {draft.rejectedReason && (
          <div
            style={{
              padding: 10,
              background: "#FFE6E1",
              color: "#B23E1F",
              borderRadius: 6,
              fontSize: 13
            }}
          >
            <AlertTriangle size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
            <strong>Rejected:</strong> {draft.rejectedReason}
          </div>
        )}

        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8
            }}
          >
            <strong style={{ fontSize: 14 }}>{copy.fieldItems}</strong>
            {!readonly && (
              <button
                className="secondary-button"
                type="button"
                onClick={addItem}
              >
                <Plus size={14} /> {copy.addLineItem}
              </button>
            )}
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
                minWidth: 760
              }}
            >
              <thead>
                <tr>
                  {[
                    copy.itemCostCode,
                    copy.itemDescription,
                    copy.itemQuantity,
                    copy.itemUnit,
                    copy.itemUnitPrice,
                    copy.itemAmount,
                    copy.itemPreferredSupplier,
                    ""
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "6px 8px",
                        textAlign: "left",
                        background: "var(--panel-soft, #F4F4F2)",
                        fontFamily: "var(--mono)",
                        fontSize: 10,
                        textTransform: "uppercase",
                        color: "var(--ink-5)"
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {draft.items.map((item, idx) => (
                  <tr key={item.id} style={{ borderTop: "1px solid var(--line)" }}>
                    <td style={{ padding: "6px 8px" }}>
                      <select
                        value={item.costCodeId}
                        onChange={(e) => {
                          const code = costCodes.find((c) => c.code === e.target.value);
                          updateItem(idx, {
                            costCodeId: e.target.value,
                            description: item.description || code?.name || "",
                            unit: item.unit || (code?.defaultUnit === "custom" ? code.customUnit : code?.defaultUnit ?? ""),
                            estimatedUnitPrice:
                              item.estimatedUnitPrice || code?.defaultUnitPrice || 0
                          });
                        }}
                        disabled={readonly}
                        style={inputStyle}
                      >
                        <option value="">{copy.itemSelectCode}</option>
                        {costCodes.map((c) => (
                          <option key={c.id} value={c.code}>
                            {c.code} · {c.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      <input
                        value={item.description}
                        onChange={(e) => updateItem(idx, { description: e.target.value })}
                        disabled={readonly}
                        style={inputStyle}
                      />
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      <input
                        type="number"
                        min="0"
                        value={item.quantity || ""}
                        onChange={(e) =>
                          updateItem(idx, { quantity: parseFloat(e.target.value) || 0 })
                        }
                        disabled={readonly}
                        style={{ ...inputStyle, textAlign: "right" }}
                      />
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      <input
                        value={item.unit}
                        onChange={(e) => updateItem(idx, { unit: e.target.value })}
                        disabled={readonly}
                        style={inputStyle}
                      />
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      <input
                        type="number"
                        min="0"
                        value={item.estimatedUnitPrice || ""}
                        onChange={(e) =>
                          updateItem(idx, {
                            estimatedUnitPrice: parseFloat(e.target.value) || 0
                          })
                        }
                        disabled={readonly}
                        style={{ ...inputStyle, textAlign: "right" }}
                      />
                    </td>
                    <td
                      style={{
                        padding: "6px 8px",
                        fontFamily: "var(--mono)",
                        textAlign: "right",
                        fontWeight: 700
                      }}
                    >
                      {money.format(item.amount)}
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      <select
                        value={item.preferredSupplierId}
                        onChange={(e) =>
                          updateItem(idx, { preferredSupplierId: e.target.value })
                        }
                        disabled={readonly}
                        style={inputStyle}
                      >
                        <option value="">{copy.itemSelectSupplier}</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.shortName || s.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: "6px 8px", textAlign: "right" }}>
                      {!readonly && draft.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          style={{
                            background: "transparent",
                            border: 0,
                            cursor: "pointer",
                            color: "var(--ink-5)"
                          }}
                          aria-label={copy.removeLineItem}
                        >
                          ×
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                <tr style={{ borderTop: "2px solid var(--line)" }}>
                  <td colSpan={5}
                    style={{
                      padding: "10px 8px",
                      textAlign: "right",
                      fontFamily: "var(--mono)",
                      fontSize: 11,
                      textTransform: "uppercase",
                      color: "var(--ink-5)"
                    }}
                  >
                    {copy.totalLabel}
                  </td>
                  <td
                    style={{
                      padding: "10px 8px",
                      textAlign: "right",
                      fontFamily: "var(--mono)",
                      fontWeight: 700,
                      fontSize: 14
                    }}
                  >
                    {money.format(totalAmount)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {errors.length > 0 && (
          <div
            style={{
              padding: 10,
              background: "#FFE6E1",
              color: "#B23E1F",
              borderRadius: 6,
              fontSize: 13
            }}
          >
            <AlertTriangle size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
            {errors.join(" · ")}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {!readonly && (
            <button className="primary-button" type="button" onClick={handleSave}>
              {copy.save}
            </button>
          )}
          {actions.map((action) => {
            const label = ACTION_COPY[action];
            const className =
              label.tone === "danger"
                ? "secondary-button"
                : label.tone === "primary"
                  ? "primary-button"
                  : "secondary-button";
            return (
              <button
                key={action}
                className={className}
                type="button"
                onClick={() => onAction(draft, action)}
                style={
                  label.tone === "danger"
                    ? { color: "#B23E1F" }
                    : undefined
                }
              >
                {label[language]}
              </button>
            );
          })}
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              if (
                typeof window !== "undefined" &&
                window.confirm(copy.confirmDelete)
              ) {
                onDelete(draft.id);
              }
            }}
            style={{ color: "#B23E1F" }}
          >
            <Trash2 size={14} /> {copy.deletePr}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Archive + RFQ stub
// ---------------------------------------------------------------------------

function ArchiveTab({
  copy,
  state,
  projects,
  onOpen,
  language
}: {
  copy: (typeof COPY)["th"];
  state: PRState;
  projects: Project[];
  onOpen: (id: string) => void;
  language: WorkspaceLanguage;
}) {
  const archived = state.prs.filter((p) => p.status === "closed" || p.status === "cancelled");
  if (archived.length === 0) {
    return (
      <div
        className="module-board"
        style={{
          padding: 30,
          marginTop: 14,
          textAlign: "center",
          color: "var(--ink-5)",
          fontStyle: "italic"
        }}
      >
        <h3 style={{ margin: 0, color: "var(--ink)" }}>{copy.archiveTitle}</h3>
        <p style={{ marginTop: 8 }}>{copy.archiveEmpty}</p>
      </div>
    );
  }
  return (
    <div className="module-board" style={{ padding: 18, marginTop: 14 }}>
      <PageHeader title={copy.archiveTitle} detail="" />
      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginTop: 8 }}
      >
        <thead>
          <tr>
            {[copy.thPrNo, copy.thProject, copy.thStatus, copy.thAmount].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  background: "var(--panel-soft, #F4F4F2)",
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  textTransform: "uppercase",
                  color: "var(--ink-5)"
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {archived.map((pr) => {
            const badge = STATUS_BADGE[pr.status];
            const projectName = projects.find((p) => p.id === pr.projectId)?.name ?? "—";
            return (
              <tr
                key={pr.id}
                style={{ borderTop: "1px solid var(--line)", cursor: "pointer" }}
                onClick={() => onOpen(pr.id)}
              >
                <td style={{ padding: "10px 12px", fontFamily: "var(--mono)", fontWeight: 700 }}>
                  {pr.prNo}
                </td>
                <td style={{ padding: "10px 12px" }}>{projectName}</td>
                <td style={{ padding: "10px 12px" }}>
                  <span
                    style={{
                      background: badge.bg,
                      color: badge.color,
                      padding: "2px 8px",
                      borderRadius: 999,
                      fontSize: 11
                    }}
                  >
                    {prStatusCopy[pr.status][language]}
                  </span>
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    fontFamily: "var(--mono)",
                    textAlign: "right"
                  }}
                >
                  {money.format(pr.totalAmount)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RFQ List tab
// ---------------------------------------------------------------------------

const RFQ_STATUS_BADGE: Record<RFQStatus, { bg: string; color: string }> = {
  draft: { bg: "#E5EDF7", color: "#2A4F86" },
  sent: { bg: "#FFF1CC", color: "#92651A" },
  partial_response: { bg: "#FFF1CC", color: "#92651A" },
  responses_complete: { bg: "#E1F0E5", color: "#2A6D45" },
  awarded: { bg: "#E1F0E5", color: "#2A6D45" },
  cancelled: { bg: "#FFE6E1", color: "#B23E1F" }
};

function RfqListTab({
  copy,
  state,
  summary,
  prs,
  projects,
  onOpen,
  language
}: {
  copy: (typeof COPY)["th"];
  state: RFQState;
  summary: ReturnType<typeof summarizeRFQs>;
  prs: PurchaseRequest[];
  projects: Project[];
  onOpen: (id: string) => void;
  language: WorkspaceLanguage;
}) {
  const [statusFilter, setStatusFilter] = useState<RFQStatus | "all">("all");
  const filtered = useMemo(
    () => filterRFQs(state, { status: statusFilter }),
    [state, statusFilter]
  );

  const prByPid: Record<string, PurchaseRequest> = useMemo(() => {
    const map: Record<string, PurchaseRequest> = {};
    for (const p of prs) map[p.id] = p;
    return map;
  }, [prs]);

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? "—";

  return (
    <div className="module-board" style={{ padding: 18, marginTop: 14 }}>
      <PageHeader title={copy.rfqListTitle} detail={copy.rfqListDetail} />

      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          alignItems: "center",
          margin: "14px 0"
        }}
      >
        {(["all", "draft", "sent", "partial_response", "responses_complete", "awarded", "cancelled"] as const).map(
          (s) => {
            const isActive = statusFilter === s;
            const label =
              s === "all" ? copy.filterAll : rfqStatusCopy[s as RFQStatus][language];
            const count =
              s === "all" ? state.rfqs.length : summary.byStatus[s as RFQStatus] ?? 0;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: isActive ? "1px solid var(--ink)" : "1px solid var(--line)",
                  background: isActive ? "var(--ink)" : "var(--panel)",
                  color: isActive ? "#fff" : "var(--ink-3)",
                  cursor: "pointer",
                  fontSize: 12,
                  fontFamily: "var(--mono)"
                }}
              >
                {label}
                <span style={{ marginLeft: 4, opacity: 0.6 }}>{count}</span>
              </button>
            );
          }
        )}
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            padding: 30,
            textAlign: "center",
            color: "var(--ink-5)",
            background: "var(--panel-soft, #F4F4F2)",
            borderRadius: 8
          }}
        >
          <FileCheck2 size={28} style={{ opacity: 0.4, marginBottom: 8 }} />
          <div style={{ fontWeight: 700 }}>{copy.rfqEmptyTitle}</div>
          <div style={{ fontSize: 12 }}>{copy.rfqEmptyDetail}</div>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 760 }}
          >
            <thead>
              <tr>
                {[
                  copy.thRfqNo,
                  copy.thPrNo,
                  copy.thProject,
                  copy.thStatus,
                  copy.thInvited,
                  copy.thResponses
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "10px 12px",
                      background: "var(--panel-soft, #F4F4F2)",
                      fontFamily: "var(--mono)",
                      fontSize: 10,
                      textTransform: "uppercase",
                      color: "var(--ink-5)"
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((rfq) => {
                const badge = RFQ_STATUS_BADGE[rfq.status];
                const sourcePr = prByPid[rfq.prId];
                return (
                  <tr
                    key={rfq.id}
                    onClick={() => onOpen(rfq.id)}
                    style={{ borderTop: "1px solid var(--line)", cursor: "pointer" }}
                  >
                    <td
                      style={{
                        padding: "10px 12px",
                        fontFamily: "var(--mono)",
                        fontWeight: 700
                      }}
                    >
                      {rfq.rfqNo}
                    </td>
                    <td style={{ padding: "10px 12px", fontFamily: "var(--mono)" }}>
                      {sourcePr?.prNo ?? "—"}
                    </td>
                    <td style={{ padding: "10px 12px" }}>{projectName(rfq.projectId)}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span
                        style={{
                          background: badge.bg,
                          color: badge.color,
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600
                        }}
                      >
                        {rfqStatusCopy[rfq.status][language]}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        fontFamily: "var(--mono)",
                        textAlign: "right"
                      }}
                    >
                      {rfq.invitedSupplierIds.length}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        fontFamily: "var(--mono)",
                        textAlign: "right",
                        color:
                          rfq.responses.length === rfq.invitedSupplierIds.length
                            ? "#2A6D45"
                            : "var(--ink-3)"
                      }}
                    >
                      {rfq.responses.length} / {rfq.invitedSupplierIds.length}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// RFQ Detail — invite + responses + comparison matrix + award
// ---------------------------------------------------------------------------

function RfqDetail({
  copy,
  rfq,
  prs,
  suppliers,
  onBack,
  onUpsert,
  onDelete,
  onRecordResponse,
  onRemoveResponse,
  onAward,
  evidenceState,
  evidencePolicy,
  onOpenEvidence,
  language
}: {
  copy: (typeof COPY)["th"];
  rfq: RFQ;
  prs: PurchaseRequest[];
  suppliers: Supplier[];
  onBack: () => void;
  onUpsert: (rfq: RFQ) => void;
  onDelete: (id: string) => void;
  onRecordResponse: (rfq: RFQ, response: Partial<RFQResponse>) => void;
  onRemoveResponse: (rfq: RFQ, responseId: string) => void;
  onAward: (rfq: RFQ, supplierId: string, reason: AwardReason) => void;
  evidenceState: EvidenceState;
  evidencePolicy: EvidenceApprovalPolicy;
  onOpenEvidence: () => void;
  language: WorkspaceLanguage;
}) {
  const sourcePr = prs.find((p) => p.id === rfq.prId) ?? null;
  const supplierById = useMemo(() => {
    const map = new Map<string, Supplier>();
    for (const s of suppliers) map.set(s.id, s);
    return map;
  }, [suppliers]);
  const badge = RFQ_STATUS_BADGE[rfq.status];

  const matrix = useMemo(
    () => (sourcePr ? buildComparisonMatrix(rfq, sourcePr.items) : null),
    [rfq, sourcePr]
  );

  const actions = legalRFQActionsFor(rfq.status);
  const readonly = rfq.status === "awarded" || rfq.status === "cancelled";
  const awardEvidence = useMemo(
    () =>
      evaluateEvidenceRequirement(
        evidenceState,
        buildEvidenceTargetsForApproval({
          targetType: "rfq_award",
          targetId: rfq.id,
          projectId: rfq.projectId
        })
      ),
    [evidenceState, rfq.id, rfq.projectId]
  );
  const rfqAwardPolicyActive =
    evidencePolicy.mode !== "off" && evidencePolicy.targetTypes.includes("rfq_award");
  const awardEvidenceLabel = !rfqAwardPolicyActive
    ? copy.rfqAwardEvidencePolicyOff
    : awardEvidence.status === "verified"
      ? copy.rfqAwardEvidenceVerified
      : awardEvidence.status === "needs_review"
        ? copy.rfqAwardEvidenceNeedsReview
        : copy.rfqAwardEvidenceMissing;

  const handleInviteToggle = (supplierId: string) => {
    if (readonly) return;
    const next: RFQ = {
      ...rfq,
      invitedSupplierIds: rfq.invitedSupplierIds.includes(supplierId)
        ? rfq.invitedSupplierIds.filter((id) => id !== supplierId)
        : [...rfq.invitedSupplierIds, supplierId]
    };
    onUpsert(next);
  };

  const handleSendOrCancel = (action: "send" | "cancel") => {
    if (action === "send") {
      onUpsert({ ...rfq, status: "sent", updatedAt: new Date().toISOString() });
    } else {
      onUpsert({ ...rfq, status: "cancelled", updatedAt: new Date().toISOString() });
    }
  };

  const handleAwardClick = (supplierId: string) => {
    if (typeof window === "undefined") return;
    const reasons: AwardReason[] = [
      "lowest_price",
      "best_payment_terms",
      "fastest_delivery",
      "preferred_vendor",
      "other"
    ];
    const list = reasons
      .map((r, i) => `${i + 1}. ${awardReasonCopy[r][language]}`)
      .join("\n");
    const input = window.prompt(
      `${copy.awardPromptHeader}\n${list}\n\n1-5:`,
      "1"
    );
    if (!input) return;
    const idx = parseInt(input, 10) - 1;
    if (Number.isNaN(idx) || idx < 0 || idx >= reasons.length) return;
    onAward(rfq, supplierId, reasons[idx]);
  };

  if (!sourcePr) {
    return (
      <div
        className="module-board"
        style={{ padding: 30, marginTop: 14, textAlign: "center", color: "var(--ink-5)" }}
      >
        <AlertTriangle size={28} style={{ opacity: 0.4 }} />
        <h3 style={{ margin: "8px 0", color: "var(--ink)" }}>{copy.rfqOrphanTitle}</h3>
        <p style={{ fontSize: 13 }}>{copy.rfqOrphanDetail}</p>
        <button className="secondary-button" type="button" onClick={onBack}>
          <ArrowLeft size={14} /> {copy.detailBackToList}
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
      <div
        style={{
          padding: 18,
          background: "var(--panel)",
          border: "1px solid var(--line)",
          borderRadius: 10,
          display: "grid",
          gap: 10
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button
            className="secondary-button"
            type="button"
            onClick={onBack}
          >
            <ArrowLeft size={14} /> {copy.detailBackToList}
          </button>
          <h2
            style={{
              margin: 0,
              fontFamily: "var(--mono)",
              fontSize: 18,
              fontWeight: 700
            }}
          >
            {rfq.rfqNo}
          </h2>
          <span
            style={{
              background: badge.bg,
              color: badge.color,
              padding: "3px 10px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600
            }}
          >
            ● {rfqStatusCopy[rfq.status][language]}
          </span>
          <span style={{ fontSize: 12, color: "var(--ink-5)", fontFamily: "var(--mono)" }}>
            จาก {sourcePr.prNo}
          </span>
          {rfq.awardedSupplierId && (
            <span
              style={{
                fontSize: 11,
                color: "#2A6D45",
                fontFamily: "var(--mono)",
                fontWeight: 700
              }}
            >
              awarded: {supplierById.get(rfq.awardedSupplierId)?.shortName ||
                supplierById.get(rfq.awardedSupplierId)?.name ||
                rfq.awardedSupplierId}{" "}
              ({rfq.awardReason})
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {actions.includes("send") && (
            <button
              className="primary-button"
              type="button"
              onClick={() => handleSendOrCancel("send")}
              disabled={rfq.invitedSupplierIds.length === 0}
            >
              {copy.sendRfq}
            </button>
          )}
          {actions.includes("cancel") && (
            <button
              className="secondary-button"
              type="button"
              onClick={() => handleSendOrCancel("cancel")}
              style={{ color: "#B23E1F" }}
            >
              {copy.cancelRfq}
            </button>
          )}
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              if (
                typeof window !== "undefined" &&
                window.confirm(copy.rfqConfirmDelete)
              ) {
                onDelete(rfq.id);
              }
            }}
            style={{ color: "#B23E1F" }}
          >
            <Trash2 size={14} /> {copy.deleteRfq}
          </button>
        </div>

        <div className={`procurement-evidence-gate procurement-evidence-gate--${awardEvidence.status}`}>
          <div className="procurement-evidence-gate__copy">
            <span>
              <FileCheck2 size={16} /> {copy.rfqAwardEvidenceTitle}
            </span>
            <strong>{awardEvidenceLabel}</strong>
            <small>
              {copy.rfqAwardEvidenceDetail} · {money.format(evidencePolicy.minimumAmount)}
            </small>
          </div>
          <button className="secondary-button" type="button" onClick={onOpenEvidence}>
            <FileSearch size={14} /> {copy.openEvidence}
          </button>
        </div>
      </div>

      {/* Invite suppliers */}
      <div className="module-board" style={{ padding: 16 }}>
        <PageHeader title={copy.inviteTitle} detail={copy.inviteDetail} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 8,
            marginTop: 12
          }}
        >
          {suppliers.map((s) => {
            const invited = rfq.invitedSupplierIds.includes(s.id);
            return (
              <label
                key={s.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  border: invited ? "1px solid var(--ink)" : "1px solid var(--line)",
                  borderRadius: 6,
                  background: invited ? "#F4F4F2" : "var(--panel)",
                  cursor: readonly ? "not-allowed" : "pointer",
                  fontSize: 13,
                  opacity: readonly ? 0.6 : 1
                }}
              >
                <input
                  type="checkbox"
                  checked={invited}
                  onChange={() => handleInviteToggle(s.id)}
                  disabled={readonly}
                />
                <span style={{ flex: 1 }}>{s.shortName || s.name}</span>
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: "var(--mono)",
                    color: "var(--ink-5)"
                  }}
                >
                  ★{s.rating}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Record responses */}
      {rfq.status !== "draft" && rfq.invitedSupplierIds.length > 0 && (
        <div className="module-board" style={{ padding: 16 }}>
          <PageHeader title={copy.responsesTitle} detail={copy.responsesDetail} />
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {rfq.invitedSupplierIds.map((sid) => {
              const supplier = supplierById.get(sid);
              const response = rfq.responses.find((r) => r.supplierId === sid);
              return (
                <ResponseRow
                  key={sid}
                  copy={copy}
                  supplier={supplier}
                  supplierId={sid}
                  prItems={sourcePr.items}
                  response={response}
                  readonly={readonly}
                  onSave={(r) => onRecordResponse(rfq, r)}
                  onRemove={() => response && onRemoveResponse(rfq, response.id)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Comparison matrix + Award */}
      {matrix && rfq.responses.length > 0 && (
        <div className="module-board" style={{ padding: 16 }}>
          <PageHeader title={copy.compareTitle} detail={copy.compareDetail} />
          <div style={{ overflowX: "auto", marginTop: 12 }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
                minWidth: 720
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "8px 10px",
                      background: "var(--panel-soft, #F4F4F2)",
                      fontFamily: "var(--mono)",
                      fontSize: 10,
                      textTransform: "uppercase",
                      color: "var(--ink-5)"
                    }}
                  >
                    {copy.thItem}
                  </th>
                  {matrix.suppliers.map((sid) => (
                    <th
                      key={sid}
                      style={{
                        textAlign: "right",
                        padding: "8px 10px",
                        background: "var(--panel-soft, #F4F4F2)",
                        fontFamily: "var(--mono)",
                        fontSize: 10,
                        textTransform: "uppercase",
                        color: "var(--ink-5)"
                      }}
                    >
                      {supplierById.get(sid)?.shortName || supplierById.get(sid)?.name || sid}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.rows.map((row) => (
                  <tr key={row.prLineItemId} style={{ borderTop: "1px solid var(--line)" }}>
                    <td style={{ padding: "8px 10px" }}>
                      <div style={{ fontWeight: 600 }}>{row.description}</div>
                      <div
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: 10,
                          color: "var(--ink-5)"
                        }}
                      >
                        {row.costCodeId} · {row.quantity} {row.unit}
                      </div>
                    </td>
                    {row.cells.map((cell) => (
                      <td
                        key={cell.supplierId}
                        style={{
                          padding: "8px 10px",
                          textAlign: "right",
                          fontFamily: "var(--mono)",
                          background: cell.isBest ? "#E1F0E5" : "transparent",
                          color: cell.available
                            ? cell.isBest
                              ? "#2A6D45"
                              : "var(--ink)"
                            : "var(--ink-5)",
                          fontWeight: cell.isBest ? 700 : 400
                        }}
                      >
                        {cell.available ? (
                          <>
                            {money.format(cell.unitPrice)}
                            <div style={{ fontSize: 10, opacity: 0.7 }}>
                              = {money.format(cell.amount)}
                            </div>
                          </>
                        ) : (
                          <span style={{ fontStyle: "italic" }}>no bid</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Totals + Award buttons */}
                <tr style={{ borderTop: "2px solid var(--line)" }}>
                  <td
                    style={{
                      padding: "10px",
                      textAlign: "right",
                      fontFamily: "var(--mono)",
                      fontSize: 10,
                      textTransform: "uppercase",
                      color: "var(--ink-5)"
                    }}
                  >
                    {copy.totalLabel}
                  </td>
                  {matrix.totals.map((t) => (
                    <td
                      key={t.supplierId}
                      style={{
                        padding: "10px",
                        textAlign: "right",
                        fontFamily: "var(--mono)",
                        background: t.isBest ? "#E1F0E5" : "transparent",
                        color: t.isBest ? "#2A6D45" : "var(--ink)",
                        fontWeight: 700,
                        fontSize: 13
                      }}
                    >
                      {money.format(t.total)}
                      {t.isBest && (
                        <div style={{ fontSize: 9, marginTop: 2 }}>★ BEST TOTAL</div>
                      )}
                    </td>
                  ))}
                </tr>
                {!readonly &&
                  (rfq.status === "partial_response" || rfq.status === "responses_complete") && (
                    <tr>
                      <td />
                      {matrix.suppliers.map((sid) => {
                        const hasResponse = rfq.responses.some((r) => r.supplierId === sid);
                        return (
                          <td key={sid} style={{ padding: "8px 10px", textAlign: "right" }}>
                            {hasResponse && (
                              <button
                                className="primary-button"
                                type="button"
                                onClick={() => handleAwardClick(sid)}
                                style={{ padding: "4px 10px", fontSize: 11 }}
                              >
                                {copy.awardButton}
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ResponseRow({
  copy,
  supplier,
  supplierId,
  prItems,
  response,
  readonly,
  onSave,
  onRemove
}: {
  copy: (typeof COPY)["th"];
  supplier?: Supplier;
  supplierId: string;
  prItems: PRLineItem[];
  response?: RFQResponse;
  readonly: boolean;
  onSave: (response: Partial<RFQResponse>) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(!response);
  const [quotes, setQuotes] = useState<Record<string, { unitPrice: string; available: boolean }>>(() => {
    const initial: Record<string, { unitPrice: string; available: boolean }> = {};
    for (const item of prItems) {
      const q = response?.itemQuotes.find((q) => q.prLineItemId === item.id);
      initial[item.id] = {
        unitPrice: q?.unitPrice ? q.unitPrice.toString() : "",
        available: q?.available !== false
      };
    }
    return initial;
  });
  const [paymentTerms, setPaymentTerms] = useState(response?.paymentTerms ?? "");
  const [deliveryDate, setDeliveryDate] = useState(response?.deliveryDate ?? "");
  const [validUntil, setValidUntil] = useState(response?.validUntil ?? "");
  const [notes, setNotes] = useState(response?.notes ?? "");

  // Reset state when response prop changes (after onSave)
  useEffect(() => {
    if (response) {
      const initial: Record<string, { unitPrice: string; available: boolean }> = {};
      for (const item of prItems) {
        const q = response.itemQuotes.find((q) => q.prLineItemId === item.id);
        initial[item.id] = {
          unitPrice: q?.unitPrice ? q.unitPrice.toString() : "",
          available: q?.available !== false
        };
      }
      setQuotes(initial);
      setPaymentTerms(response.paymentTerms);
      setDeliveryDate(response.deliveryDate);
      setValidUntil(response.validUntil);
      setNotes(response.notes);
    }
  }, [response?.id, response?.receivedAt]);

  const handleSave = () => {
    const itemQuotes = prItems.map((item) => {
      const q = quotes[item.id];
      const unitPrice = parseFloat(q?.unitPrice ?? "0") || 0;
      return {
        prLineItemId: item.id,
        costCodeId: item.costCodeId,
        description: item.description,
        unitPrice,
        amount: unitPrice * item.quantity,
        available: q?.available !== false && unitPrice > 0,
        alternativeSpec: "",
        note: ""
      };
    });
    const totalAmount = itemQuotes.reduce(
      (sum, q) => sum + (q.available ? q.amount : 0),
      0
    );
    onSave({
      id: response?.id,
      supplierId,
      itemQuotes,
      totalAmount,
      paymentTerms,
      deliveryDate,
      validUntil,
      notes
    });
    setEditing(false);
  };

  const supplierLabel = supplier?.shortName || supplier?.name || supplierId;

  if (!editing && response) {
    return (
      <div
        style={{
          padding: 12,
          border: "1px solid var(--line)",
          borderRadius: 6,
          background: "var(--panel)"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8
          }}
        >
          <div>
            <strong>{supplierLabel}</strong>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                color: "var(--ink-5)",
                marginTop: 2
              }}
            >
              {money.format(response.totalAmount)} ·{" "}
              {response.paymentTerms || "—"} · delivery {response.deliveryDate || "—"}
            </div>
          </div>
          {!readonly && (
            <div style={{ display: "flex", gap: 6 }}>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setEditing(true)}
                style={{ padding: "4px 10px", fontSize: 11 }}
              >
                {copy.edit}
              </button>
              <button
                type="button"
                onClick={onRemove}
                style={{
                  border: 0,
                  background: "transparent",
                  cursor: "pointer",
                  color: "var(--ink-5)",
                  fontSize: 18
                }}
                aria-label="remove response"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 12,
        border: "1px dashed var(--line)",
        borderRadius: 6,
        background: "var(--panel-soft, #F4F4F2)"
      }}
    >
      <strong style={{ fontSize: 13 }}>{supplierLabel}</strong>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: 8,
          marginTop: 10
        }}
      >
        {prItems.map((item) => (
          <div key={item.id} style={{ display: "grid", gap: 4 }}>
            <span
              style={{
                fontFamily: "var(--mono)",
                fontSize: 10,
                color: "var(--ink-5)",
                textTransform: "uppercase"
              }}
            >
              {item.description || item.costCodeId}
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              <input
                type="number"
                min="0"
                placeholder="ราคา/หน่วย"
                value={quotes[item.id]?.unitPrice ?? ""}
                onChange={(e) =>
                  setQuotes((current) => ({
                    ...current,
                    [item.id]: {
                      available: current[item.id]?.available !== false,
                      unitPrice: e.target.value
                    }
                  }))
                }
                disabled={readonly}
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() =>
                  setQuotes((current) => ({
                    ...current,
                    [item.id]: {
                      unitPrice: current[item.id]?.unitPrice ?? "",
                      available: !(current[item.id]?.available !== false)
                    }
                  }))
                }
                disabled={readonly}
                title={copy.noBidButton}
                style={{
                  border: "1px solid var(--line)",
                  background:
                    quotes[item.id]?.available === false ? "#FFE6E1" : "var(--panel)",
                  color:
                    quotes[item.id]?.available === false ? "#B23E1F" : "var(--ink-5)",
                  fontSize: 11,
                  padding: "4px 6px",
                  borderRadius: 4,
                  cursor: "pointer"
                }}
              >
                {quotes[item.id]?.available === false ? "no bid" : "✓"}
              </button>
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 8,
          marginTop: 10
        }}
      >
        <FormField label={copy.paymentTerms}>
          <input
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            disabled={readonly}
            style={inputStyle}
            placeholder="30 days"
          />
        </FormField>
        <FormField label={copy.deliveryDate}>
          <input
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            disabled={readonly}
            style={inputStyle}
          />
        </FormField>
        <FormField label={copy.validUntil}>
          <input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            disabled={readonly}
            style={inputStyle}
          />
        </FormField>
        <FormField label={copy.responseNotes}>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={readonly}
            style={inputStyle}
          />
        </FormField>
      </div>
      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 8 }}>
        {response && (
          <button
            className="secondary-button"
            type="button"
            onClick={() => setEditing(false)}
            style={{ padding: "4px 10px", fontSize: 11 }}
          >
            {copy.cancel}
          </button>
        )}
        <button
          className="primary-button"
          type="button"
          onClick={handleSave}
          disabled={readonly}
          style={{ padding: "4px 10px", fontSize: 11 }}
        >
          {copy.save}
        </button>
      </div>
    </div>
  );
}

function FormField({
  label,
  required,
  children
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "grid", gap: 4, marginTop: 8 }}>
      <span
        style={{
          fontFamily: "var(--mono)",
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--ink-5)"
        }}
      >
        {label} {required && <span style={{ color: "#B23E1F" }}>*</span>}
      </span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 10px",
  border: "1px solid var(--line)",
  borderRadius: 4,
  fontFamily: "inherit",
  fontSize: 12
};
