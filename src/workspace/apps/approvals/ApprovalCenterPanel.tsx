import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  ClipboardList,
  FileCheck2,
  Home,
  RefreshCw,
  Settings,
  Users,
  X
} from "lucide-react";
import type { WorkspaceAppId } from "../../../apps";
import {
  applyApprovalAction,
  filterApprovalRequests,
  loadApprovalState,
  saveApprovalState,
  summarizeApprovals,
  syncApprovalRequestsFromCashflow,
  syncApprovalRequestsFromDocuments,
  syncApprovalRequestsFromPRs,
  type ApprovalRequest,
  type ApprovalState,
  type ApprovalStatus,
  type ApprovalTargetType
} from "../../../approvals";
import {
  loadCashflowState,
  saveCashflowState,
  upsertCashflowEntry,
  type CashflowState
} from "../../../cashflow";
import { ensureSeedCostCodes } from "../../../costCodes";
import {
  buildEvidenceTargetsForApproval,
  evaluateEvidenceApprovalPolicy,
  evaluateEvidenceRequirement,
  loadEvidenceApprovalPolicy,
  loadEvidenceState,
  saveEvidenceApprovalPolicy,
  type EvidenceApprovalPolicy,
  type EvidenceApprovalPolicyMode,
  type EvidenceRequirementResult,
  type EvidenceState
} from "../../../evidence";
import { ensureSeedProjects } from "../../../projects";
import {
  LOCAL_PROJECT_ACCESS_ACTOR,
  applyApprovalDecisionToDocumentAuthorityState,
  evaluateProjectAccessGuard,
  loadDocumentAuthorityState,
  loadProjectAccessState,
  saveDocumentAuthorityState,
  type DocumentAuthorityState,
  type ProjectAccessDecision,
  type ProjectPermission
} from "../../../projectAccess";
import { applyPRAction, loadPRs, savePRs, upsertPR, type PRState } from "../../../procurement";
import type { StoredDocument } from "../../../storage";
import { loadSuppliers } from "../../../suppliers";
import { PageHeader } from "../../shared/PageHeader";
import { SummaryTile } from "../../shared/SummaryTile";

type WorkspaceLanguage = "th" | "en";

type ApprovalCenterPanelProps = {
  activeTab: string;
  documents: StoredDocument[];
  language: WorkspaceLanguage;
  onDocumentAuthorityChange: (state: DocumentAuthorityState) => void;
  onDocumentsChange: (documents: StoredDocument[]) => void;
  onOpenDocument: (id: string) => void;
  onSelectApp: (id: WorkspaceAppId) => void;
  onSelectAppTab: (appId: WorkspaceAppId, tabKey: string) => void;
};

const money = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0
});

const LOCAL_APPROVER = {
  actorId: LOCAL_PROJECT_ACCESS_ACTOR.memberId,
  actorName: LOCAL_PROJECT_ACCESS_ACTOR.memberName
};

const terminalStatuses = new Set<ApprovalStatus>(["approved", "rejected", "cancelled"]);

const copy = {
  th: {
    heroTitle: "Approval Center",
    heroDetail:
      "กล่องรวมงานอนุมัติจาก PR และ Cashflow พร้อม audit log สำหรับต่อยอดเป็น ERP",
    backToHub: "กลับ Hub",
    sync: "Sync",
    openProcurement: "เปิด Procurement",
    openCashflow: "เปิด Cashflow",
    summaryPending: "รออนุมัติ",
    summaryUrgent: "เร่งด่วน",
    summaryPendingAmount: "ยอดรอตัดสินใจ",
    summaryApproved: "อนุมัติแล้ว",
    summaryRejected: "ปฏิเสธ",
    inboxTitle: "Inbox รออนุมัติ",
    inboxDetail: "รายการ submitted จาก PR และ draft cashflow จะถูกรวมไว้ที่นี่",
    historyTitle: "Decision History",
    historyDetail: "ประวัติอนุมัติ ปฏิเสธ และยกเลิก พร้อมเหตุผลล่าสุด",
    rulesTitle: "Approval Rules",
    rulesDetail: "ตั้งค่า evidence gate ก่อนอนุมัติ แล้วค่อยต่อยอดเป็น matrix ตาม amount/project/role",
    searchPlaceholder: "ค้นหา PR, รายละเอียด, ประเภท...",
    filterAll: "ทุกประเภท",
    emptyInbox: "ยังไม่มีรายการรออนุมัติ",
    emptyHistory: "ยังไม่มีประวัติการตัดสินใจ",
    approve: "อนุมัติ",
    reject: "ปฏิเสธ",
    openSource: "เปิดต้นทาง",
    amount: "Amount",
    project: "Project",
    source: "Source",
    priority: "Priority",
    status: "Status",
    requested: "Requested",
    reasonPrompt: "ระบุเหตุผลในการปฏิเสธ",
    rejectedFallback: "Rejected from Approval Center",
    approvedFeedback: "อนุมัติและ sync กลับต้นทางแล้ว",
    rejectedFeedback: "ปฏิเสธและบันทึก audit แล้ว",
    syncFeedback: "Sync inbox ล่าสุดแล้ว",
    errorPrefix: "ทำรายการไม่สำเร็จ:",
    evidenceVerified: "มีหลักฐานยืนยันแล้ว",
    evidenceNeedsReview: "มีหลักฐานแต่ยังไม่ verify",
    evidenceMissing: "ยังไม่มีหลักฐานตรงรายการ",
    evidenceOpen: "เปิด Evidence",
    evidenceConfirmApprove:
      "รายการนี้ยังไม่มี verified evidence ที่ผูกกับธุรกรรมโดยตรง ต้องการอนุมัติต่อหรือไม่?",
    evidenceBlockedFeedback: "บล็อกการอนุมัติ: รายการนี้ต้องมี direct verified evidence ก่อน",
    projectAccessAllowed: "Project Access OK",
    projectAccessBlocked: "Project Access blocked",
    projectAccessFeedback: "Project Access blocked: {reason}",
    policyTitle: "Evidence Gate",
    policyDetail: "กำหนดว่า approval ยอดตั้งแต่ threshold ต้องมีหลักฐานที่ verify แล้ว",
    policyMode: "โหมด",
    policyOff: "ปิด",
    policyWarn: "เตือนก่อนอนุมัติ",
    policyBlock: "บล็อกถ้าไม่มีหลักฐาน",
    policyMinimumAmount: "ยอดขั้นต่ำ",
    policyTargets: "ใช้กับ",
    policySave: "บันทึกกติกา",
    policySaved: "บันทึก evidence gate แล้ว",
    noProject: "ไม่ผูกโครงการ",
    noCostCode: "No cost code",
    noSupplier: "No supplier",
    ruleAmount: "Amount limit",
    ruleProject: "Project",
    ruleRole: "Role",
    ruleAudit: "Audit trail",
    ruleAmountDetail: "ต่อยอด threshold เช่น >=100K = Manager, >=500K = Owner",
    ruleProjectDetail: "ผูก approval route ตาม project owner หรือ department ได้",
    ruleRoleDetail: "MVP ใช้ Owner เป็น approver หลัก ก่อนเพิ่ม RBAC matrix",
    ruleAuditDetail: "ทุก transition เขียนลง membership audit ด้วย target business object"
  },
  en: {
    heroTitle: "Approval Center",
    heroDetail:
      "Unified approval inbox for PR and Cashflow with audit logging for the ERP path.",
    backToHub: "Back to Hub",
    sync: "Sync",
    openProcurement: "Open Procurement",
    openCashflow: "Open Cashflow",
    summaryPending: "Pending",
    summaryUrgent: "Urgent",
    summaryPendingAmount: "Pending amount",
    summaryApproved: "Approved",
    summaryRejected: "Rejected",
    inboxTitle: "Approval Inbox",
    inboxDetail: "Submitted PRs and draft cashflow entries are consolidated here.",
    historyTitle: "Decision History",
    historyDetail: "Approved, rejected, and cancelled requests with the latest reason.",
    rulesTitle: "Approval Rules",
    rulesDetail: "Configure the evidence gate before moving into amount/project/role matrix rules.",
    searchPlaceholder: "Search PR, description, type...",
    filterAll: "All types",
    emptyInbox: "No pending approvals",
    emptyHistory: "No decisions yet",
    approve: "Approve",
    reject: "Reject",
    openSource: "Open source",
    amount: "Amount",
    project: "Project",
    source: "Source",
    priority: "Priority",
    status: "Status",
    requested: "Requested",
    reasonPrompt: "Reason for rejection",
    rejectedFallback: "Rejected from Approval Center",
    approvedFeedback: "Approved and synced back to source.",
    rejectedFeedback: "Rejected and audit logged.",
    syncFeedback: "Inbox synced.",
    errorPrefix: "Action failed:",
    evidenceVerified: "Verified evidence",
    evidenceNeedsReview: "Evidence needs review",
    evidenceMissing: "No direct evidence",
    evidenceOpen: "Open Evidence",
    evidenceConfirmApprove:
      "This request has no verified evidence linked directly to the transaction. Approve anyway?",
    evidenceBlockedFeedback: "Approval blocked: direct verified evidence is required first.",
    projectAccessAllowed: "Project Access OK",
    projectAccessBlocked: "Project Access blocked",
    projectAccessFeedback: "Project Access blocked: {reason}",
    policyTitle: "Evidence Gate",
    policyDetail: "Require verified evidence for approvals at or above the threshold.",
    policyMode: "Mode",
    policyOff: "Off",
    policyWarn: "Warn before approval",
    policyBlock: "Block without evidence",
    policyMinimumAmount: "Minimum amount",
    policyTargets: "Applies to",
    policySave: "Save rule",
    policySaved: "Evidence gate saved.",
    noProject: "No project",
    noCostCode: "No cost code",
    noSupplier: "No supplier",
    ruleAmount: "Amount limit",
    ruleProject: "Project",
    ruleRole: "Role",
    ruleAudit: "Audit trail",
    ruleAmountDetail: "Next: threshold rules such as >=100K Manager, >=500K Owner.",
    ruleProjectDetail: "Route approvals by project owner or department.",
    ruleRoleDetail: "MVP uses Owner as the approver before adding an RBAC matrix.",
    ruleAuditDetail: "Every transition writes membership audit with a business target object."
  }
} satisfies Record<WorkspaceLanguage, Record<string, string>>;

const statusCopy: Record<ApprovalStatus, { th: string; en: string }> = {
  draft: { th: "Draft", en: "Draft" },
  submitted: { th: "รออนุมัติ", en: "Pending" },
  approved: { th: "อนุมัติแล้ว", en: "Approved" },
  rejected: { th: "ปฏิเสธ", en: "Rejected" },
  cancelled: { th: "ยกเลิก", en: "Cancelled" }
};

const targetTypeCopy: Record<ApprovalTargetType, { th: string; en: string }> = {
  pr: { th: "Purchase Request", en: "Purchase Request" },
  rfq_award: { th: "RFQ Award", en: "RFQ Award" },
  po: { th: "Purchase Order", en: "Purchase Order" },
  cashflow_entry: { th: "Cashflow", en: "Cashflow" },
  invoice: { th: "Invoice", en: "Invoice" },
  budget_override: { th: "Budget Override", en: "Budget Override" }
};

const priorityCopy = {
  normal: { th: "ปกติ", en: "Normal" },
  high: { th: "สูง", en: "High" },
  urgent: { th: "เร่งด่วน", en: "Urgent" }
} satisfies Record<ApprovalRequest["priority"], Record<WorkspaceLanguage, string>>;

const targetTypes: Array<ApprovalTargetType | "all"> = [
  "all",
  "pr",
  "cashflow_entry",
  "rfq_award",
  "po",
  "invoice",
  "budget_override"
];

function syncSourcesToApprovals(
  base: ApprovalState,
  prState: PRState,
  cashflowState: CashflowState,
  documents: StoredDocument[]
) {
  return syncApprovalRequestsFromDocuments(
    syncApprovalRequestsFromCashflow(
      syncApprovalRequestsFromPRs(base, prState.prs),
      cashflowState.entries
    ),
    documents
  );
}

function getInitialApprovalState(
  prState: PRState,
  cashflowState: CashflowState,
  documents: StoredDocument[]
) {
  const synced = syncSourcesToApprovals(loadApprovalState(), prState, cashflowState, documents);
  saveApprovalState(synced);
  return synced;
}

function getLastEventText(request: ApprovalRequest) {
  const lastEvent = request.events[0];
  if (!lastEvent) return request.updatedAt || request.createdAt || "-";
  const actor = lastEvent.actorName || lastEvent.actorId || "system";
  return `${lastEvent.action} by ${actor}`;
}

function getEvidenceCopy(c: Record<string, string>, evidence: EvidenceRequirementResult) {
  if (evidence.status === "verified") return c.evidenceVerified;
  if (evidence.status === "needs_review") return c.evidenceNeedsReview;
  return c.evidenceMissing;
}

function policyModeLabel(c: Record<string, string>, mode: EvidenceApprovalPolicyMode) {
  if (mode === "off") return c.policyOff;
  if (mode === "warn") return c.policyWarn;
  return c.policyBlock;
}

function isDocumentApprovalTarget(targetType: ApprovalTargetType) {
  return targetType === "po" || targetType === "invoice";
}

function getApprovalRequestPermission(request: ApprovalRequest): ProjectPermission {
  if (request.targetType === "pr" || request.targetType === "rfq_award") return "procurement.approve";
  if (request.targetType === "cashflow_entry" || request.targetType === "budget_override") {
    return "cashflow.approve";
  }
  return "document.approve";
}

function formatProjectAccessReason(reason: ProjectAccessDecision["reason"]) {
  return reason.replace(/_/g, " ");
}

function getProjectAccessFeedback(c: Record<string, string>, decision: ProjectAccessDecision) {
  return c.projectAccessFeedback.replace("{reason}", formatProjectAccessReason(decision.reason));
}

export function ApprovalCenterPanel({
  activeTab,
  documents,
  language,
  onDocumentAuthorityChange,
  onDocumentsChange,
  onOpenDocument,
  onSelectApp,
  onSelectAppTab
}: ApprovalCenterPanelProps) {
  const c = copy[language];
  const currentTab = activeTab === "history" || activeTab === "rules" ? activeTab : "inbox";
  const [prState, setPrState] = useState<PRState>(() => loadPRs());
  const [cashflowState, setCashflowState] = useState<CashflowState>(() => loadCashflowState());
  const [evidenceState, setEvidenceState] = useState<EvidenceState>(() => loadEvidenceState());
  const [policy, setPolicy] = useState<EvidenceApprovalPolicy>(() => loadEvidenceApprovalPolicy());
  const [projectAccessState, setProjectAccessState] = useState(() => loadProjectAccessState());
  const [state, setState] = useState<ApprovalState>(() =>
    getInitialApprovalState(loadPRs(), loadCashflowState(), documents)
  );
  const [search, setSearch] = useState("");
  const [targetType, setTargetType] = useState<ApprovalTargetType | "all">("all");
  const [feedback, setFeedback] = useState("");

  const projects = useMemo(() => ensureSeedProjects().projects, []);
  const costCodes = useMemo(() => ensureSeedCostCodes().codes, []);
  const suppliers = useMemo(() => loadSuppliers().suppliers, []);
  const projectById = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);
  const costCodeById = useMemo(() => new Map(costCodes.map((costCode) => [costCode.id, costCode])), [costCodes]);
  const supplierById = useMemo(() => new Map(suppliers.map((supplier) => [supplier.id, supplier])), [suppliers]);

  const summary = useMemo(() => summarizeApprovals(state), [state]);
  const evidenceByRequest = useMemo(() => {
    return new Map(
      state.requests.map((request) => [
        request.id,
        evaluateEvidenceRequirement(
          evidenceState,
          buildEvidenceTargetsForApproval({
            targetType: request.targetType,
            targetId: request.targetId,
            projectId: request.projectId,
            costCodeId: request.costCodeId,
            supplierId: request.supplierId
          })
        )
      ])
    );
  }, [evidenceState, state.requests]);
  const projectAccessByRequest = useMemo(() => {
    return new Map(
      state.requests.map((request) => [
        request.id,
        evaluateProjectAccessGuard(projectAccessState, {
          memberId: LOCAL_PROJECT_ACCESS_ACTOR.memberId,
          workspaceRole: LOCAL_PROJECT_ACCESS_ACTOR.workspaceRole,
          projectId: request.projectId,
          supplierId: request.supplierId,
          permission: getApprovalRequestPermission(request)
        })
      ])
    );
  }, [projectAccessState, state.requests]);
  const pendingRequests = useMemo(
    () =>
      filterApprovalRequests(state, {
        status: "submitted",
        targetType,
        search
      }).sort((first, second) => {
        if (first.priority !== second.priority) {
          const weight = { urgent: 3, high: 2, normal: 1 };
          return weight[second.priority] - weight[first.priority];
        }
        return second.updatedAt.localeCompare(first.updatedAt);
      }),
    [search, state, targetType]
  );
  const historyRequests = useMemo(
    () =>
      filterApprovalRequests(state, {
        targetType,
        search
      })
        .filter((request) => terminalStatuses.has(request.status))
        .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt)),
    [search, state, targetType]
  );

  const persistApprovalState = (next: ApprovalState, message: string) => {
    setState(next);
    saveApprovalState(next);
    setFeedback(message);
  };

  const syncNow = () => {
    const nextPrState = loadPRs();
    const nextCashflowState = loadCashflowState();
    const nextEvidenceState = loadEvidenceState();
    setPrState(nextPrState);
    setCashflowState(nextCashflowState);
    setEvidenceState(nextEvidenceState);
    setPolicy(loadEvidenceApprovalPolicy());
    setProjectAccessState(loadProjectAccessState());
    persistApprovalState(syncSourcesToApprovals(state, nextPrState, nextCashflowState, documents), c.syncFeedback);
  };

  const applyDecision = (request: ApprovalRequest, action: "approve" | "reject") => {
    const freshProjectAccessState = loadProjectAccessState();
    const access = evaluateProjectAccessGuard(freshProjectAccessState, {
      memberId: LOCAL_PROJECT_ACCESS_ACTOR.memberId,
      workspaceRole: LOCAL_PROJECT_ACCESS_ACTOR.workspaceRole,
      projectId: request.projectId,
      supplierId: request.supplierId,
      permission: getApprovalRequestPermission(request)
    });
    setProjectAccessState(freshProjectAccessState);
    if (!access.allowed) {
      setFeedback(getProjectAccessFeedback(c, access));
      return;
    }

    const evidence = evidenceByRequest.get(request.id);
    if (action === "approve" && evidence) {
      const policyDecision = evaluateEvidenceApprovalPolicy(
        policy,
        { targetType: request.targetType, amount: request.amount },
        evidence
      );
      if (policyDecision.blocked) {
        setFeedback(c.evidenceBlockedFeedback);
        return;
      }
      if (policyDecision.shouldConfirm) {
        const confirmed = window.confirm(c.evidenceConfirmApprove);
        if (!confirmed) return;
      }
    }
    const reason =
      action === "reject"
        ? window.prompt(c.reasonPrompt, request.reason || c.rejectedFallback)?.trim()
        : "";
    if (action === "reject" && !reason) return;

    try {
      const result = applyApprovalAction(state, request.id, action, LOCAL_APPROVER, {
        reason,
        writeAudit: true
      });
      let nextApprovalState = result.state;
      let nextPrState = prState;
      let nextCashflowState = cashflowState;
      let nextDocuments = documents;

      if (request.targetType === "pr") {
        const source = prState.prs.find((pr) => pr.id === request.targetId);
        if (source?.status === "submitted") {
          const updatedPR =
            action === "approve"
              ? applyPRAction(source, "approve", { approverId: LOCAL_APPROVER.actorName })
              : applyPRAction(source, "reject", { reason: reason || c.rejectedFallback });
          nextPrState = upsertPR(prState, updatedPR);
          setPrState(nextPrState);
          savePRs(nextPrState);
          nextApprovalState = syncApprovalRequestsFromPRs(nextApprovalState, nextPrState.prs);
        }
      }

      if (request.targetType === "cashflow_entry") {
        const source = cashflowState.entries.find((entry) => entry.id === request.targetId);
        if (source?.status === "draft") {
          const updatedCashflow = upsertCashflowEntry(cashflowState, {
            ...source,
            status: action === "approve" ? "confirmed" : "void",
            note: action === "reject" ? reason || c.rejectedFallback : source.note
          });
          nextCashflowState = updatedCashflow;
          setCashflowState(nextCashflowState);
          saveCashflowState(nextCashflowState);
          nextApprovalState = syncApprovalRequestsFromCashflow(nextApprovalState, nextCashflowState.entries);
        }
      }

      if (isDocumentApprovalTarget(request.targetType)) {
        const source = documents.find((document) => document.id === request.targetId);
        if (source) {
          const now = new Date().toISOString();
          const nextDocument: StoredDocument = {
            ...source,
            documentStatus: action === "approve" ? "approved" : "cancelled",
            savedAt: now,
            updatedAt: now
          };
          nextDocuments = documents.map((document) =>
            document.id === source.id ? nextDocument : document
          );
          onDocumentsChange(nextDocuments);
          nextApprovalState = syncApprovalRequestsFromDocuments(nextApprovalState, nextDocuments);

          const authorityResult = applyApprovalDecisionToDocumentAuthorityState(
            loadDocumentAuthorityState(),
            action,
            {
              documentId: source.id,
              documentNo: String(request.metadata.documentNo || source.documentInfo.documentNo),
              documentType: source.docType,
              projectId: request.projectId || source.documentInfo.projectName,
              approvalRequestId: request.id,
              preparedBy: {
                actorId: request.requestedBy || "local-user",
                actorName:
                  request.requestedByName ||
                  source.documentInfo.signerName ||
                  source.documentInfo.companyName ||
                  "BuildDocs User"
              },
              reason: reason || c.rejectedFallback
            },
            LOCAL_APPROVER,
            { writeAudit: true }
          );
          saveDocumentAuthorityState(authorityResult.state);
          onDocumentAuthorityChange(authorityResult.state);
        }
      }

      persistApprovalState(
        nextApprovalState,
        action === "approve" ? c.approvedFeedback : c.rejectedFeedback
      );
    } catch (error) {
      setFeedback(`${c.errorPrefix} ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const openSource = (request: ApprovalRequest) => {
    if (request.targetType === "pr" || request.targetType === "rfq_award") {
      onSelectAppTab("procurement", request.targetType === "rfq_award" ? "rfq-list" : "pr-list");
      return;
    }
    if (request.targetType === "cashflow_entry") {
      onSelectAppTab("cashflow", "overview");
      return;
    }
    if (isDocumentApprovalTarget(request.targetType)) {
      if (documents.some((document) => document.id === request.targetId)) {
        onOpenDocument(request.targetId);
        return;
      }
      onSelectAppTab("builddocs", "documents");
    }
  };

  const togglePolicyTarget = (targetType: ApprovalTargetType) => {
    setPolicy((current) => {
      const exists = current.targetTypes.includes(targetType);
      const targetTypes = exists
        ? current.targetTypes.filter((item) => item !== targetType)
        : [...current.targetTypes, targetType];
      return {
        ...current,
        targetTypes: targetTypes.length > 0 ? targetTypes : current.targetTypes
      };
    });
  };

  const savePolicy = () => {
    const nextPolicy = {
      ...policy,
      minimumAmount: Math.max(0, policy.minimumAmount),
      updatedAt: new Date().toISOString()
    };
    saveEvidenceApprovalPolicy(nextPolicy);
    setPolicy(loadEvidenceApprovalPolicy());
    setFeedback(c.policySaved);
  };

  const requestRows = currentTab === "history" ? historyRequests : pendingRequests;

  return (
    <section className="workspace-hub approvals-app" aria-label={c.heroTitle}>
      <div className="module-hero approvals-hero">
        <div>
          <h1>{c.heroTitle}</h1>
          <p>{c.heroDetail}</p>
        </div>
        <div className="module-actions">
          <button className="secondary-button" onClick={syncNow} type="button">
            <RefreshCw size={18} />
            {c.sync}
          </button>
          <button className="secondary-button" onClick={() => onSelectApp("hub")} type="button">
            <Home size={18} />
            {c.backToHub}
          </button>
        </div>
      </div>

      <div className="summary-grid hub-summary-grid hub-summary-grid--wide">
        <SummaryTile label={c.summaryPending} value={`${summary.submitted}`} strong={summary.submitted > 0} />
        <SummaryTile label={c.summaryUrgent} value={`${summary.urgent}`} strong={summary.urgent > 0} />
        <SummaryTile label={c.summaryPendingAmount} value={money.format(summary.pendingAmount)} />
        <SummaryTile label={c.summaryApproved} value={`${summary.approved}`} />
        <SummaryTile label={c.summaryRejected} value={`${summary.rejected}`} />
      </div>

      {feedback && (
        <div className="approvals-feedback" role="status">
          <FileCheck2 size={16} />
          <span>{feedback}</span>
        </div>
      )}

      {currentTab === "rules" ? (
        <div className="module-board approvals-rules-board">
          <PageHeader title={c.rulesTitle} detail={c.rulesDetail} />
          <div className="approvals-policy-card">
            <div className="approvals-policy-copy">
              <strong>{c.policyTitle}</strong>
              <p>{c.policyDetail}</p>
            </div>
            <div className="approvals-policy-controls">
              <label className="approvals-field">
                <span>{c.policyMode}</span>
                <select
                  value={policy.mode}
                  onChange={(event) =>
                    setPolicy((current) => ({
                      ...current,
                      mode: event.target.value as EvidenceApprovalPolicyMode
                    }))
                  }
                >
                  {(["off", "warn", "block"] as EvidenceApprovalPolicyMode[]).map((mode) => (
                    <option key={mode} value={mode}>
                      {policyModeLabel(c, mode)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="approvals-field">
                <span>{c.policyMinimumAmount}</span>
                <input
                  min={0}
                  type="number"
                  value={policy.minimumAmount}
                  onChange={(event) =>
                    setPolicy((current) => ({
                      ...current,
                      minimumAmount: Number(event.target.value) || 0
                    }))
                  }
                />
              </label>
            </div>
            <fieldset className="approvals-policy-targets">
              <legend>{c.policyTargets}</legend>
              {targetTypes
                .filter((type): type is ApprovalTargetType => type !== "all")
                .map((type) => (
                  <label key={type}>
                    <input
                      checked={policy.targetTypes.includes(type)}
                      onChange={() => togglePolicyTarget(type)}
                      type="checkbox"
                    />
                    <span>{targetTypeCopy[type][language]}</span>
                  </label>
                ))}
            </fieldset>
            <div className="approvals-policy-actions">
              <button className="primary-button" onClick={savePolicy} type="button">
                <Settings size={18} />
                {c.policySave}
              </button>
            </div>
          </div>
          <div className="approvals-rule-grid">
            {[
              { icon: ClipboardList, title: c.ruleAmount, detail: c.ruleAmountDetail },
              { icon: FileCheck2, title: c.ruleProject, detail: c.ruleProjectDetail },
              { icon: Settings, title: c.ruleRole, detail: c.ruleRoleDetail },
              { icon: AlertTriangle, title: c.ruleAudit, detail: c.ruleAuditDetail }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <article className="approvals-rule-card" key={item.title}>
                  <Icon size={20} />
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </article>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="module-board approvals-list-board">
          <PageHeader
            title={currentTab === "history" ? c.historyTitle : c.inboxTitle}
            detail={currentTab === "history" ? c.historyDetail : c.inboxDetail}
          />
          <div className="approvals-toolbar">
            <label className="approvals-field approvals-field--search">
              <span>Search</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={c.searchPlaceholder}
                type="search"
              />
            </label>
            <label className="approvals-field">
              <span>{c.source}</span>
              <select
                value={targetType}
                onChange={(event) => setTargetType(event.target.value as ApprovalTargetType | "all")}
              >
                {targetTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === "all" ? c.filterAll : targetTypeCopy[type][language]}
                  </option>
                ))}
              </select>
            </label>
            <button className="secondary-button" onClick={() => onSelectAppTab("procurement", "pr-list")} type="button">
              <ClipboardList size={16} />
              {c.openProcurement}
            </button>
            <button className="secondary-button" onClick={() => onSelectAppTab("cashflow", "overview")} type="button">
              <FileCheck2 size={16} />
              {c.openCashflow}
            </button>
          </div>

          <div className="approvals-table" role="table" aria-label={c.heroTitle}>
            <div className="approvals-table-head" role="row">
              <span>{c.source}</span>
              <span>{c.project}</span>
              <span>{c.amount}</span>
              <span>{c.priority}</span>
              <span>{c.status}</span>
              <span>{currentTab === "history" ? c.requested : ""}</span>
            </div>

            {requestRows.length === 0 ? (
              <div className="approvals-empty">
                {currentTab === "history" ? c.emptyHistory : c.emptyInbox}
              </div>
            ) : (
              requestRows.map((request) => {
                const project = projectById.get(request.projectId);
                const costCode = costCodeById.get(request.costCodeId);
                const supplier = supplierById.get(request.supplierId);
                const evidence = evidenceByRequest.get(request.id);
                const projectAccess = projectAccessByRequest.get(request.id);
                const isProjectAccessBlocked = projectAccess ? !projectAccess.allowed : false;
                const projectAccessTitle = projectAccess
                  ? getProjectAccessFeedback(c, projectAccess)
                  : undefined;
                return (
                  <article
                    className={`approvals-row approvals-row--${request.status} approvals-row--${request.priority}`}
                    key={request.id}
                    role="row"
                  >
                    <div className="approvals-source-cell">
                      <strong>{request.targetLabel}</strong>
                      <span>
                        {targetTypeCopy[request.targetType][language]} / {request.sourceAppId || "-"}
                      </span>
                      {evidence && (
                        <span className={`approvals-evidence-chip approvals-evidence-chip--${evidence.status}`}>
                          <FileCheck2 size={13} />
                          {getEvidenceCopy(c, evidence)}
                          {evidence.directVerified > 0 || evidence.directTotal > 0
                            ? ` (${evidence.directVerified}/${evidence.directTotal})`
                            : ""}
                        </span>
                      )}
                      {projectAccess && (
                        <span
                          className={`approvals-evidence-chip approvals-evidence-chip--${
                            projectAccess.allowed ? "verified" : "missing"
                          }`}
                          title={projectAccessTitle}
                        >
                          <Users size={13} />
                          {projectAccess.allowed ? c.projectAccessAllowed : c.projectAccessBlocked}
                        </span>
                      )}
                    </div>
                    <div className="approvals-meta-cell">
                      <strong>{project ? `${project.code} ${project.name}` : c.noProject}</strong>
                      <span>{costCode ? `${costCode.code} ${costCode.name}` : c.noCostCode}</span>
                      <span>{supplier ? supplier.name : c.noSupplier}</span>
                    </div>
                    <div className="approvals-amount-cell">{money.format(request.amount)}</div>
                    <div>
                      <span className={`approvals-priority approvals-priority--${request.priority}`}>
                        {priorityCopy[request.priority][language]}
                      </span>
                    </div>
                    <div>
                      <span className={`approvals-status approvals-status--${request.status}`}>
                        {statusCopy[request.status][language]}
                      </span>
                    </div>
                    <div className="approvals-row-actions">
                      {currentTab === "history" ? (
                        <small>{request.reason || getLastEventText(request)}</small>
                      ) : (
                        <>
                          <button
                            className="approvals-row-button approvals-row-button--approve"
                            disabled={isProjectAccessBlocked}
                            onClick={() => applyDecision(request, "approve")}
                            title={isProjectAccessBlocked ? projectAccessTitle : undefined}
                            type="button"
                          >
                            <Check size={15} />
                            {c.approve}
                          </button>
                          <button
                            className="approvals-row-button approvals-row-button--reject"
                            disabled={isProjectAccessBlocked}
                            onClick={() => applyDecision(request, "reject")}
                            title={isProjectAccessBlocked ? projectAccessTitle : undefined}
                            type="button"
                          >
                            <X size={15} />
                            {c.reject}
                          </button>
                        </>
                      )}
                      <button className="approvals-row-button" onClick={() => openSource(request)} type="button">
                        {c.openSource}
                      </button>
                      <button
                        className="approvals-row-button"
                        onClick={() => onSelectAppTab("evidence", evidence?.hasAnyEvidence ? "library" : "intake")}
                        type="button"
                      >
                        {c.evidenceOpen}
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      )}
    </section>
  );
}
