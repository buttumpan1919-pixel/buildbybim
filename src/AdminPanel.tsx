import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";
import {
  Banknote,
  Check,
  ClipboardList,
  Cloud,
  CloudOff,
  Clock,
  FileCheck2,
  Home,
  Settings,
  Shield,
  Upload,
  Users
} from "lucide-react";

import {
  isSupabaseConfigured,
  supabaseConnectionStatus
} from "./supabaseClient";
import {
  activateSupabaseSync,
  deactivateSupabaseSync,
  getActiveSupabaseAdapter
} from "./supabaseAdapter";
import { getSupabaseClient } from "./supabaseClient";
import {
  twoWaySync,
  type SupabaseLikeClient,
  type SyncReport
} from "./supabase.sync";
import {
  ensureWorkspace,
  getMyWorkspaces,
  onAuthChange,
  type AuthUser,
  type WorkspaceSummary
} from "./auth";

import {
  activateSubscription,
  appendAuditEntry,
  loadAuditState,
  loadPlansState,
  loadSubscriptionState,
  savePlansState,
  summarizeMembership,
  upsertAppAccessOverride,
  upsertPlan,
  type AuditState,
  type Plan,
  type PlansState,
  type SubscriptionState
} from "./membership";
import {
  workspaceApps,
  workspaceAppCategoryCopy,
  type WorkspaceAppAccessLevel,
  type WorkspaceAppId
} from "./apps";
import {
  PROJECT_PERMISSIONS,
  PROJECT_ROLES,
  WORKSPACE_ROLES,
  createProjectAccessGrant,
  effectivePermissionsForProjectAccessGrant,
  evaluateProjectAccess,
  listAccessibleProjectIds,
  loadProjectAccessState,
  removeProjectAccessGrant,
  saveProjectAccessState,
  upsertProjectAccessGrant,
  type ProjectAccessDecision,
  type ProjectAccessGrant,
  type ProjectAccessState,
  type ProjectPermission,
  type ProjectRole,
  type WorkspaceRole
} from "./projectAccess";
import { ensureSeedProjects } from "./projects";
import { ensureSeedSuppliers } from "./suppliers";

// ---------------------------------------------------------------------------
// Props + copy
// ---------------------------------------------------------------------------

type Language = "th" | "en";

type AdminPanelProps = {
  activeTab: string; // "overview" | "plans" | "audit" | "overrides" | "project-access"
  language: Language;
  onSelectApp: (id: WorkspaceAppId) => void;
};

type AdminCopy = {
  heroTitle: string;
  heroDetail: string;
  backToHub: string;

  overviewTitle: string;
  overviewDetail: string;
  plansTitle: string;
  plansDetail: string;
  overridesTitle: string;
  overridesDetail: string;
  auditTitle: string;
  auditDetail: string;

  // Summary tiles
  summaryTotalPlans: string;
  summaryActiveRules: string;
  summaryOverrides: string;
  summaryAllowedApps: string;
  summaryDeniedApps: string;
  summaryAuditEntries: string;

  // Boards
  recentAuditTitle: string;
  recentAuditDetail: string;
  activeSubscriptionTitle: string;
  activeSubscriptionDetail: string;
  allPlansTitle: string;
  allPlansDetail: string;
  newPlanTitle: string;
  newPlanDetail: string;
  overridesBoardTitle: string;
  overridesBoardDetail: string;
  newOverrideTitle: string;
  newOverrideDetail: string;
  auditBoardTitle: string;
  auditBoardDetail: string;

  // Buttons
  buttonSwitchPlan: string;
  buttonActivate: string;
  buttonCurrent: string;
  buttonNewPlan: string;
  buttonCreateOverride: string;
  buttonSave: string;
  buttonCancel: string;

  // Plan table columns
  colName: string;
  colPrice: string;
  colInterval: string;
  colStatus: string;
  colRules: string;
  colAction: string;

  // Override table columns
  colScope: string;
  colScopeId: string;
  colApp: string;
  colEffect: string;
  colAccessLevel: string;
  colReason: string;

  // Audit table columns
  colWhen: string;
  colActionLabel: string;
  colActor: string;
  colTarget: string;
  colPayload: string;

  // Subscription card
  subscriptionPlan: string;
  subscriptionStatus: string;
  subscriptionPeriodEnd: string;
  subscriptionNone: string;

  // Form labels
  formPlanName: string;
  formPlanDescription: string;
  formPlanPrice: string;
  formPlanInterval: string;
  formScope: string;
  formScopeId: string;
  formAppId: string;
  formEffect: string;
  formAccessLevel: string;
  formReason: string;

  // Status labels
  statusActive: string;
  statusDraft: string;
  statusArchived: string;
  statusTrial: string;
  statusPastDue: string;
  statusCancelled: string;
  statusNone: string;

  // Interval labels
  intervalMonthly: string;
  intervalYearly: string;
  intervalOneTime: string;
  intervalNone: string;

  // Effect / scope
  effectAllow: string;
  effectDeny: string;
  scopeWorkspace: string;
  scopeMember: string;
  scopeUser: string;

  // Empty states + captions
  emptyAudit: string;
  emptyPlans: string;
  emptyOverrides: string;
  auditCaption: string;
  rulesCountSuffix: string;
  unknownPlan: string;
  noPeriodEnd: string;
};

const adminPanelCopy: Record<Language, AdminCopy> = {
  th: {
    heroTitle: "Admin Console",
    heroDetail: "ดูแลแผนสมาชิก กฎสิทธิ์ Override และ Audit log",
    backToHub: "กลับหน้า Hub",

    overviewTitle: "ภาพรวม",
    overviewDetail: "สรุปสถานะแผน Override สิทธิ์แอป และเหตุการณ์ล่าสุด",
    plansTitle: "แผนทั้งหมด",
    plansDetail: "ดูและสลับแผน เพิ่มแผนใหม่",
    overridesTitle: "Admin Override",
    overridesDetail: "เปิดหรือปิดสิทธิ์เฉพาะ workspace สมาชิก หรือผู้ใช้",
    auditTitle: "Audit log",
    auditDetail: "เหตุการณ์ล่าสุดในระบบ membership (อ่านอย่างเดียว)",

    summaryTotalPlans: "จำนวนแผน",
    summaryActiveRules: "Rule ที่ใช้งาน",
    summaryOverrides: "Override ทั้งหมด",
    summaryAllowedApps: "แอปที่อนุญาต",
    summaryDeniedApps: "แอปที่ปิดสิทธิ์",
    summaryAuditEntries: "Audit entries",

    recentAuditTitle: "Audit ล่าสุด",
    recentAuditDetail: "5 รายการล่าสุดในระบบ",
    activeSubscriptionTitle: "แผนปัจจุบัน",
    activeSubscriptionDetail: "Subscription ที่ใช้งานอยู่ตอนนี้",
    allPlansTitle: "แผนทั้งหมด",
    allPlansDetail: "เลือกแผนที่ต้องการเปิดใช้งาน",
    newPlanTitle: "เพิ่มแผนใหม่",
    newPlanDetail: "สร้างแผนสำหรับเสนอลูกค้าหรือทีม",
    overridesBoardTitle: "Override ที่ตั้งค่าไว้",
    overridesBoardDetail: "รายการ allow/deny ที่บังคับเหนือกฎแผน",
    newOverrideTitle: "เพิ่ม Override",
    newOverrideDetail: "บังคับสิทธิ์เฉพาะ workspace สมาชิก หรือผู้ใช้",
    auditBoardTitle: "Audit log",
    auditBoardDetail: "ประวัติเหตุการณ์ membership ล่าสุด",

    buttonSwitchPlan: "เปลี่ยนแผน",
    buttonActivate: "ทำให้เป็นปัจจุบัน",
    buttonCurrent: "ใช้งานอยู่",
    buttonNewPlan: "บันทึกแผนใหม่",
    buttonCreateOverride: "บันทึก Override",
    buttonSave: "บันทึก",
    buttonCancel: "ยกเลิก",

    colName: "ชื่อ",
    colPrice: "ราคา",
    colInterval: "รอบบิล",
    colStatus: "สถานะ",
    colRules: "Rule",
    colAction: "การจัดการ",

    colScope: "Scope",
    colScopeId: "Scope ID",
    colApp: "แอป",
    colEffect: "Effect",
    colAccessLevel: "ระดับสิทธิ์",
    colReason: "เหตุผล",

    colWhen: "เวลา",
    colActionLabel: "Action",
    colActor: "ผู้ดำเนินการ",
    colTarget: "เป้าหมาย",
    colPayload: "Payload",

    subscriptionPlan: "แผน",
    subscriptionStatus: "สถานะ",
    subscriptionPeriodEnd: "หมดอายุ",
    subscriptionNone: "ยังไม่มีแผนที่ใช้งาน",

    formPlanName: "ชื่อแผน",
    formPlanDescription: "รายละเอียด",
    formPlanPrice: "ราคา (บาท)",
    formPlanInterval: "รอบบิล",
    formScope: "Scope",
    formScopeId: "Scope ID",
    formAppId: "แอป",
    formEffect: "Effect",
    formAccessLevel: "ระดับสิทธิ์",
    formReason: "เหตุผล",

    statusActive: "ใช้งาน",
    statusDraft: "ร่าง",
    statusArchived: "เก็บถาวร",
    statusTrial: "ทดลอง",
    statusPastDue: "เลยกำหนด",
    statusCancelled: "ยกเลิก",
    statusNone: "ไม่มี",

    intervalMonthly: "รายเดือน",
    intervalYearly: "รายปี",
    intervalOneTime: "ครั้งเดียว",
    intervalNone: "ไม่มี",

    effectAllow: "อนุญาต",
    effectDeny: "ปฏิเสธ",
    scopeWorkspace: "Workspace",
    scopeMember: "Member",
    scopeUser: "User",

    emptyAudit: "ยังไม่มี Audit entry",
    emptyPlans: "ยังไม่มีแผน",
    emptyOverrides: "ยังไม่มี Override",
    auditCaption: "ทั้งหมด {total} รายการ (จำกัด 200)",
    rulesCountSuffix: "rule",
    unknownPlan: "(ไม่ทราบแผน)",
    noPeriodEnd: "—"
  },
  en: {
    heroTitle: "Admin Console",
    heroDetail: "Manage plans, access rules, overrides, and audit log.",
    backToHub: "Back to Hub",

    overviewTitle: "Overview",
    overviewDetail: "Plan status, app access, overrides, and recent events.",
    plansTitle: "All plans",
    plansDetail: "Inspect plans, activate one, or create a new plan.",
    overridesTitle: "Admin Override",
    overridesDetail: "Allow or deny app access per workspace, member, or user.",
    auditTitle: "Audit log",
    auditDetail: "Recent membership events (read-only).",

    summaryTotalPlans: "Total plans",
    summaryActiveRules: "Active rules",
    summaryOverrides: "Overrides",
    summaryAllowedApps: "Allowed apps",
    summaryDeniedApps: "Denied apps",
    summaryAuditEntries: "Audit entries",

    recentAuditTitle: "Recent audit entries",
    recentAuditDetail: "Latest 5 events from the audit log.",
    activeSubscriptionTitle: "Active subscription",
    activeSubscriptionDetail: "Plan currently in effect.",
    allPlansTitle: "All plans",
    allPlansDetail: "Pick a plan to activate.",
    newPlanTitle: "New plan",
    newPlanDetail: "Add a plan you can later assign rules to.",
    overridesBoardTitle: "Configured overrides",
    overridesBoardDetail: "Allow/deny rules layered on top of plan rules.",
    newOverrideTitle: "Create override",
    newOverrideDetail: "Force an outcome for a specific scope.",
    auditBoardTitle: "Audit log",
    auditBoardDetail: "Most recent membership events.",

    buttonSwitchPlan: "Switch plan",
    buttonActivate: "Activate",
    buttonCurrent: "Current",
    buttonNewPlan: "Save new plan",
    buttonCreateOverride: "Save override",
    buttonSave: "Save",
    buttonCancel: "Cancel",

    colName: "Name",
    colPrice: "Price",
    colInterval: "Interval",
    colStatus: "Status",
    colRules: "Rules",
    colAction: "Action",

    colScope: "Scope",
    colScopeId: "Scope ID",
    colApp: "App",
    colEffect: "Effect",
    colAccessLevel: "Access",
    colReason: "Reason",

    colWhen: "When",
    colActionLabel: "Action",
    colActor: "Actor",
    colTarget: "Target",
    colPayload: "Payload",

    subscriptionPlan: "Plan",
    subscriptionStatus: "Status",
    subscriptionPeriodEnd: "Period end",
    subscriptionNone: "No active subscription",

    formPlanName: "Plan name",
    formPlanDescription: "Description",
    formPlanPrice: "Price (THB)",
    formPlanInterval: "Billing interval",
    formScope: "Scope",
    formScopeId: "Scope ID",
    formAppId: "App",
    formEffect: "Effect",
    formAccessLevel: "Access level",
    formReason: "Reason",

    statusActive: "Active",
    statusDraft: "Draft",
    statusArchived: "Archived",
    statusTrial: "Trial",
    statusPastDue: "Past due",
    statusCancelled: "Cancelled",
    statusNone: "None",

    intervalMonthly: "Monthly",
    intervalYearly: "Yearly",
    intervalOneTime: "One-time",
    intervalNone: "None",

    effectAllow: "Allow",
    effectDeny: "Deny",
    scopeWorkspace: "Workspace",
    scopeMember: "Member",
    scopeUser: "User",

    emptyAudit: "No audit entries yet",
    emptyPlans: "No plans yet",
    emptyOverrides: "No overrides yet",
    auditCaption: "Total: {total} entries (capped at 200)",
    rulesCountSuffix: "rules",
    unknownPlan: "(unknown plan)",
    noPeriodEnd: "—"
  }
};

// ---------------------------------------------------------------------------
// Local SummaryTile + PageHeader (cannot import from ./App — circular dep)
// Markup mirrors App.tsx so they pick up the same global styles.
// ---------------------------------------------------------------------------

type ProjectAccessCopy = {
  title: string;
  detail: string;
  summaryGrants: string;
  summaryActive: string;
  summaryMembers: string;
  summaryProjects: string;
  boardTitle: string;
  boardDetail: string;
  formTitle: string;
  formDetail: string;
  checkTitle: string;
  checkDetail: string;
  allProjects: string;
  noSupplier: string;
  active: string;
  inactive: string;
  empty: string;
  buttonCreate: string;
  buttonReset: string;
  buttonActivate: string;
  buttonDeactivate: string;
  buttonDelete: string;
  buttonCheck: string;
  colProject: string;
  colMember: string;
  colRole: string;
  colSupplier: string;
  colPermissions: string;
  colStatus: string;
  colAction: string;
  formProject: string;
  formMemberId: string;
  formMemberName: string;
  formRole: string;
  formSupplier: string;
  formExtraPermissions: string;
  formDeniedPermissions: string;
  formWorkspaceRole: string;
  formPermissionCheck: string;
  decisionAllowed: string;
  decisionDenied: string;
  matchedGrants: string;
  accessibleProjects: string;
};

const projectAccessPanelCopy: Record<Language, ProjectAccessCopy> = {
  th: {
    title: "Project Access",
    detail: "กำหนดสิทธิ์ผู้ใช้รายโครงการตาม role, supplier scope และ permission override",
    summaryGrants: "Grant ทั้งหมด",
    summaryActive: "เปิดใช้งาน",
    summaryMembers: "ผู้ใช้",
    summaryProjects: "โครงการที่ครอบคลุม",
    boardTitle: "รายการสิทธิ์รายโครงการ",
    boardDetail: "ใช้เป็นชั้นสิทธิ์ก่อนออกเอกสาร, ส่งอนุมัติ, อนุมัติ และดูข้อมูลโครงการ",
    formTitle: "เพิ่มสิทธิ์ใหม่",
    formDetail: "เลือกโครงการ ผู้ใช้ role และ permission override ที่ต้องการ",
    checkTitle: "ตรวจสิทธิ์",
    checkDetail: "จำลองผลลัพธ์ก่อนนำไปผูกกับ workflow อนุมัติจริง",
    allProjects: "ทุกโครงการ",
    noSupplier: "ไม่จำกัด supplier",
    active: "Active",
    inactive: "Inactive",
    empty: "ยังไม่มี Project Access grant",
    buttonCreate: "บันทึกสิทธิ์",
    buttonReset: "ล้างฟอร์ม",
    buttonActivate: "เปิดใช้",
    buttonDeactivate: "ปิดใช้",
    buttonDelete: "ลบ",
    buttonCheck: "ตรวจสิทธิ์",
    colProject: "โครงการ",
    colMember: "ผู้ใช้",
    colRole: "Role",
    colSupplier: "Supplier",
    colPermissions: "Effective permissions",
    colStatus: "สถานะ",
    colAction: "จัดการ",
    formProject: "โครงการ",
    formMemberId: "Member ID",
    formMemberName: "ชื่อผู้ใช้",
    formRole: "Project role",
    formSupplier: "Supplier scope",
    formExtraPermissions: "เพิ่มสิทธิ์พิเศษ",
    formDeniedPermissions: "ตัดสิทธิ์ออก",
    formWorkspaceRole: "Workspace role",
    formPermissionCheck: "Permission ที่ต้องการตรวจ",
    decisionAllowed: "อนุญาต",
    decisionDenied: "ไม่อนุญาต",
    matchedGrants: "Grant ที่ตรง",
    accessibleProjects: "โครงการที่เข้าถึงได้"
  },
  en: {
    title: "Project Access",
    detail: "Manage per-project roles, supplier scope, and permission overrides.",
    summaryGrants: "Total grants",
    summaryActive: "Active",
    summaryMembers: "Members",
    summaryProjects: "Covered projects",
    boardTitle: "Project access grants",
    boardDetail: "Access layer for document issuing, approval, and project data visibility.",
    formTitle: "Create grant",
    formDetail: "Pick a project, member, role, and permission overrides.",
    checkTitle: "Access check",
    checkDetail: "Preview the evaluator result before wiring the rule into live workflows.",
    allProjects: "All projects",
    noSupplier: "No supplier scope",
    active: "Active",
    inactive: "Inactive",
    empty: "No project access grants yet",
    buttonCreate: "Save grant",
    buttonReset: "Reset",
    buttonActivate: "Activate",
    buttonDeactivate: "Deactivate",
    buttonDelete: "Delete",
    buttonCheck: "Check access",
    colProject: "Project",
    colMember: "Member",
    colRole: "Role",
    colSupplier: "Supplier",
    colPermissions: "Effective permissions",
    colStatus: "Status",
    colAction: "Action",
    formProject: "Project",
    formMemberId: "Member ID",
    formMemberName: "Member name",
    formRole: "Project role",
    formSupplier: "Supplier scope",
    formExtraPermissions: "Extra permissions",
    formDeniedPermissions: "Denied permissions",
    formWorkspaceRole: "Workspace role",
    formPermissionCheck: "Permission to check",
    decisionAllowed: "Allowed",
    decisionDenied: "Denied",
    matchedGrants: "Matched grants",
    accessibleProjects: "Accessible projects"
  }
};

type SummaryTileProps = {
  label: string;
  value: string;
  strong?: boolean;
};

function SummaryTile({ label, value, strong }: SummaryTileProps) {
  return (
    <div className={strong ? "summary-tile strong" : "summary-tile"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

type PageHeaderProps = {
  title: string;
  detail: string;
};

function PageHeader({ title, detail }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div>
        <h2>{title}</h2>
        <p>{detail}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const accessLevels: WorkspaceAppAccessLevel[] = [
  "none",
  "preview",
  "quick",
  "saved",
  "read",
  "write",
  "export",
  "admin",
  "support"
];

const moneyFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0
});

function formatPlanPrice(plan: Plan): string {
  if (plan.priceAmount <= 0) {
    return "—";
  }
  try {
    return moneyFmt.format(plan.priceAmount);
  } catch {
    return `${plan.priceAmount} ${plan.currency}`;
  }
}

function formatWhen(iso: string): string {
  if (!iso) return "—";
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return iso;
  const d = new Date(ms);
  const pad = (n: number) => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function summarizePayload(payload: Record<string, unknown>): string {
  try {
    const json = JSON.stringify(payload);
    if (!json || json === "{}") return "—";
    return json.length > 80 ? `${json.slice(0, 80)}…` : json;
  } catch {
    return "—";
  }
}

function planStatusLabel(status: Plan["status"], copy: AdminCopy): string {
  switch (status) {
    case "active":
      return copy.statusActive;
    case "draft":
      return copy.statusDraft;
    case "archived":
      return copy.statusArchived;
    default:
      return status;
  }
}

type SubscriptionStatusValue =
  | "active"
  | "trial"
  | "past_due"
  | "cancelled"
  | "none";

function subscriptionStatusLabel(
  status: SubscriptionStatusValue,
  copy: AdminCopy
): string {
  switch (status) {
    case "active":
      return copy.statusActive;
    case "trial":
      return copy.statusTrial;
    case "past_due":
      return copy.statusPastDue;
    case "cancelled":
      return copy.statusCancelled;
    case "none":
      return copy.statusNone;
    default:
      return `${status}`;
  }
}

function intervalLabel(interval: Plan["billingInterval"], copy: AdminCopy): string {
  switch (interval) {
    case "monthly":
      return copy.intervalMonthly;
    case "yearly":
      return copy.intervalYearly;
    case "one_time":
      return copy.intervalOneTime;
    case "none":
      return copy.intervalNone;
    default:
      return interval;
  }
}

function scopeLabel(scope: "workspace" | "member" | "user", copy: AdminCopy): string {
  switch (scope) {
    case "workspace":
      return copy.scopeWorkspace;
    case "member":
      return copy.scopeMember;
    case "user":
      return copy.scopeUser;
    default:
      return scope;
  }
}

function effectLabel(effect: "allow" | "deny", copy: AdminCopy): string {
  return effect === "deny" ? copy.effectDeny : copy.effectAllow;
}

function appLabel(appId: WorkspaceAppId, language: Language): string {
  const app = workspaceApps.find((a) => a.id === appId);
  if (!app) return appId;
  const cat = workspaceAppCategoryCopy[app.category][language];
  return `${app.label} (${cat})`;
}

function optionLabel(value: string): string {
  return value
    .split(/[._]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function compactPermissions(permissions: ProjectPermission[]): string {
  if (permissions.length <= 4) return permissions.join(", ");
  return `${permissions.slice(0, 4).join(", ")} +${permissions.length - 4}`;
}

function projectAccessReasonLabel(reason: ProjectAccessDecision["reason"]): string {
  return optionLabel(reason);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminPanel({
  activeTab,
  language,
  onSelectApp
}: AdminPanelProps): ReactElement {
  const copy = adminPanelCopy[language];
  const projectAccessCopy = projectAccessPanelCopy[language];
  const currentTab =
    activeTab === "plans" ||
    activeTab === "audit" ||
    activeTab === "overrides" ||
    activeTab === "project-access"
      ? activeTab
      : "overview";

  const [plansState, setPlansState] = useState<PlansState>(() => loadPlansState());
  const [subscriptionState, setSubscriptionState] = useState<SubscriptionState>(() =>
    loadSubscriptionState()
  );
  const [auditState, setAuditState] = useState<AuditState>(() => loadAuditState());
  const [projectAccessState, setProjectAccessState] = useState<ProjectAccessState>(() =>
    loadProjectAccessState()
  );

  // Phase C cloud sync state
  const [syncWorkspaceId, setSyncWorkspaceId] = useState("");
  const [syncTick, setSyncTick] = useState(0);
  const [syncBusy, setSyncBusy] = useState<"" | "activate" | "push" | "pull" | "ensure" | "relational">("");
  const [syncMessage, setSyncMessage] = useState("");
  const supabaseReady = isSupabaseConfigured();
  const activeAdapter = getActiveSupabaseAdapter();
  const syncStatus = activeAdapter ? activeAdapter.getStatus() : null;
  void syncTick; // re-render trigger after async sync actions

  // Phase F: auth-aware workspace auto-pick
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [myWorkspaces, setMyWorkspaces] = useState<WorkspaceSummary[]>([]);

  useEffect(() => {
    if (!supabaseReady) return;
    const unsubscribe = onAuthChange((user) => {
      setAuthUser(user);
      if (user) {
        void getMyWorkspaces().then((list) => {
          setMyWorkspaces(list);
          if (list.length > 0 && !syncWorkspaceId) {
            setSyncWorkspaceId(list[0].id);
          }
        });
      } else {
        setMyWorkspaces([]);
      }
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabaseReady]);

  const handleEnsureWorkspace = async () => {
    setSyncBusy("ensure");
    setSyncMessage("");
    const result = await ensureWorkspace();
    setSyncBusy("");
    if (result.error) {
      setSyncMessage(result.error);
      return;
    }
    setSyncWorkspaceId(result.workspaceId);
    const list = await getMyWorkspaces();
    setMyWorkspaces(list);
    setSyncMessage(
      language === "en"
        ? `Workspace ready: ${result.workspaceId.slice(0, 8)}…`
        : `Workspace พร้อม: ${result.workspaceId.slice(0, 8)}…`
    );
  };

  const reload = useCallback(() => {
    setPlansState(loadPlansState());
    setSubscriptionState(loadSubscriptionState());
    setAuditState(loadAuditState());
    setProjectAccessState(loadProjectAccessState());
  }, []);

  const handleActivateSync = () => {
    if (!syncWorkspaceId.trim()) {
      setSyncMessage(language === "en" ? "Paste a workspace UUID first." : "ใส่ workspace UUID ก่อน");
      return;
    }
    setSyncBusy("activate");
    const adapter = activateSupabaseSync(syncWorkspaceId.trim());
    setSyncBusy("");
    setSyncTick((n) => n + 1);
    setSyncMessage(
      adapter
        ? language === "en"
          ? "Cloud sync activated. Local writes will now push to Supabase."
          : "เปิดสวิตช์ sync แล้ว — การเขียนข้อมูลจะ push ขึ้น Supabase อัตโนมัติ"
        : language === "en"
          ? "Could not activate — Supabase env missing."
          : "เปิดไม่ได้ — .env ของ Supabase ยังไม่ถูกตั้ง"
    );
  };

  const handlePush = async () => {
    if (!activeAdapter) return;
    setSyncBusy("push");
    setSyncMessage("");
    try {
      const result = await activeAdapter.pushToCloud();
      setSyncMessage(
        language === "en"
          ? `Pushed ${result.pushed} keys to cloud.`
          : `ส่งขึ้น cloud แล้ว ${result.pushed} keys`
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setSyncMessage(language === "en" ? `Push failed: ${msg}` : `Push ล้มเหลว: ${msg}`);
    } finally {
      setSyncBusy("");
      setSyncTick((n) => n + 1);
    }
  };

  const handlePull = async () => {
    if (!activeAdapter) return;
    setSyncBusy("pull");
    setSyncMessage("");
    try {
      const result = await activeAdapter.pullFromCloud();
      setSyncMessage(
        language === "en"
          ? `Pulled ${result.pulled} keys from cloud. Reload UI to see them.`
          : `ดึงจาก cloud ${result.pulled} keys — refresh หน้าเพื่อโหลด data ใหม่`
      );
      reload();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setSyncMessage(language === "en" ? `Pull failed: ${msg}` : `Pull ล้มเหลว: ${msg}`);
    } finally {
      setSyncBusy("");
      setSyncTick((n) => n + 1);
    }
  };

  const handleDeactivate = () => {
    deactivateSupabaseSync();
    setSyncMessage(
      language === "en" ? "Cloud sync turned off. Local data kept." : "ปิด sync แล้ว ข้อมูล local ยังอยู่"
    );
    setSyncTick((n) => n + 1);
  };

  /**
   * Sprint 10B — relational sync (projects + cashflow + PR tables).
   * Wraps the supabase-js client into our SupabaseLikeClient interface
   * and runs `twoWaySync` so local + cloud catch up in both directions.
   */
  const handleRelationalSync = async () => {
    const ws = syncWorkspaceId.trim();
    if (!ws) {
      setSyncMessage(
        language === "en" ? "Paste a workspace UUID first." : "ใส่ workspace UUID ก่อน"
      );
      return;
    }
    const client = getSupabaseClient();
    if (!client) {
      setSyncMessage(
        language === "en"
          ? "Supabase env missing — fill VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY."
          : "ยังไม่ได้ตั้งค่า Supabase — ใส่ VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY"
      );
      return;
    }
    // Cast the real supabase-js client to our SupabaseLikeClient shape.
    // The two shapes are compatible at runtime (from().select() / .upsert()
    // both return PostgrestFilterBuilder thenables resolving to {data,error}).
    const wrapped = client as unknown as SupabaseLikeClient;
    setSyncBusy("relational");
    setSyncMessage("");
    try {
      const report: SyncReport = await twoWaySync(wrapped, ws);
      if (!report.ok) {
        setSyncMessage(
          language === "en"
            ? `Relational sync failed: ${report.error}`
            : `Sync ตารางล้มเหลว: ${report.error}`
        );
      } else {
        const pushed =
          report.projects.pushed + report.cashflow.pushed + report.purchaseRequests.pushed;
        const pulled =
          report.projects.pulled + report.cashflow.pulled + report.purchaseRequests.pulled;
        const conflicts =
          report.projects.conflictsRemoteWon +
          report.cashflow.conflictsRemoteWon +
          report.purchaseRequests.conflictsRemoteWon +
          report.projects.conflictsLocalWon +
          report.cashflow.conflictsLocalWon +
          report.purchaseRequests.conflictsLocalWon;
        setSyncMessage(
          language === "en"
            ? `Synced tables — pushed ${pushed} · pulled ${pulled} · conflicts ${conflicts}`
            : `Sync ตาราง — push ${pushed} · pull ${pulled} · conflict ${conflicts}`
        );
        reload();
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setSyncMessage(
        language === "en" ? `Relational sync error: ${msg}` : `Sync ตาราง error: ${msg}`
      );
    } finally {
      setSyncBusy("");
      setSyncTick((n) => n + 1);
    }
  };

  const summary = useMemo(
    () => summarizeMembership(plansState, subscriptionState),
    [plansState, subscriptionState]
  );

  const enabledRulesCount = useMemo(
    () => plansState.rules.filter((r) => r.enabled).length,
    [plansState.rules]
  );

  const projectOptions = useMemo(() => ensureSeedProjects().projects, []);
  const supplierOptions = useMemo(
    () => ensureSeedSuppliers().suppliers.filter((supplier) => supplier.active),
    []
  );
  const projectNameById = useMemo(
    () =>
      new Map(
        projectOptions.map((project) => [
          project.id,
          project.code ? `${project.code} - ${project.name}` : project.name
        ])
      ),
    [projectOptions]
  );
  const supplierNameById = useMemo(
    () =>
      new Map(
        supplierOptions.map((supplier) => [
          supplier.id,
          supplier.shortName ? `${supplier.shortName} - ${supplier.name}` : supplier.name
        ])
      ),
    [supplierOptions]
  );

  const sortedAudit = useMemo(
    () =>
      [...auditState.entries].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
      ),
    [auditState.entries]
  );

  const recentAudit = sortedAudit.slice(0, 5);
  const fullAudit = sortedAudit.slice(0, 50);
  const auditCaption = copy.auditCaption.replace(
    "{total}",
    `${auditState.entries.length}`
  );

  const currentSubscription = subscriptionState.current;
  const currentPlan = summary.currentPlan;

  // --- Plan form -----------------------------------------------------------
  const [planName, setPlanName] = useState("");
  const [planDescription, setPlanDescription] = useState("");
  const [planPrice, setPlanPrice] = useState("");
  const [planInterval, setPlanInterval] = useState<Plan["billingInterval"]>("monthly");

  const resetPlanForm = () => {
    setPlanName("");
    setPlanDescription("");
    setPlanPrice("");
    setPlanInterval("monthly");
  };

  const submitNewPlan = () => {
    const trimmedName = planName.trim();
    if (!trimmedName) return;
    const priceNum = Number(planPrice.replace(/,/g, ""));
    const next = upsertPlan(plansState, {
      name: trimmedName,
      description: planDescription.trim(),
      priceAmount: Number.isFinite(priceNum) && priceNum > 0 ? priceNum : 0,
      billingInterval: planInterval,
      status: "draft"
    });
    savePlansState(next);
    setPlansState(next);
    resetPlanForm();
  };

  const handleActivatePlan = (planId: string) => {
    activateSubscription(planId);
    reload();
  };

  // --- Override form -------------------------------------------------------
  const defaultAppId: WorkspaceAppId =
    (workspaceApps[0]?.id as WorkspaceAppId) ?? "hub";
  const [ovScope, setOvScope] = useState<"workspace" | "member" | "user">("workspace");
  const [ovScopeId, setOvScopeId] = useState("");
  const [ovAppId, setOvAppId] = useState<WorkspaceAppId>(defaultAppId);
  const [ovEffect, setOvEffect] = useState<"allow" | "deny">("allow");
  const [ovAccessLevel, setOvAccessLevel] =
    useState<WorkspaceAppAccessLevel>("read");
  const [ovReason, setOvReason] = useState("");

  const resetOverrideForm = () => {
    setOvScope("workspace");
    setOvScopeId("");
    setOvAppId(defaultAppId);
    setOvEffect("allow");
    setOvAccessLevel("read");
    setOvReason("");
  };

  const submitNewOverride = () => {
    if (!ovScopeId.trim()) return;
    const next = upsertAppAccessOverride(plansState, {
      scope: ovScope,
      scopeId: ovScopeId.trim(),
      appId: ovAppId,
      featureKey: "",
      effect: ovEffect,
      accessLevel: ovEffect === "deny" ? "none" : ovAccessLevel,
      limits: {},
      reason: ovReason.trim(),
      createdBy: "admin"
    });
    savePlansState(next);
    setPlansState(next);
    resetOverrideForm();
  };

  // --- Project access form -------------------------------------------------
  const [paProjectId, setPaProjectId] = useState(projectOptions[0]?.id ?? "");
  const [paMemberId, setPaMemberId] = useState("site-manager");
  const [paMemberName, setPaMemberName] = useState("Site Manager");
  const [paRole, setPaRole] = useState<ProjectRole>("project_manager");
  const [paSupplierId, setPaSupplierId] = useState("");
  const [paExtraPermissions, setPaExtraPermissions] = useState<ProjectPermission[]>([]);
  const [paDeniedPermissions, setPaDeniedPermissions] = useState<ProjectPermission[]>([]);
  const [paCheckWorkspaceRole, setPaCheckWorkspaceRole] = useState<WorkspaceRole>("member");
  const [paCheckPermission, setPaCheckPermission] =
    useState<ProjectPermission>("document.approve");
  const [paDecision, setPaDecision] = useState<ProjectAccessDecision | null>(null);

  const projectAccessSummary = useMemo(() => {
    const activeGrants = projectAccessState.grants.filter((grant) => grant.active);
    return {
      total: projectAccessState.grants.length,
      active: activeGrants.length,
      members: new Set(activeGrants.map((grant) => grant.memberId).filter(Boolean)).size,
      projects: new Set(activeGrants.map((grant) => grant.projectId || "*")).size
    };
  }, [projectAccessState.grants]);

  const accessibleProjectIds = useMemo(
    () =>
      listAccessibleProjectIds(projectAccessState, {
        memberId: paMemberId,
        workspaceRole: paCheckWorkspaceRole,
        permission: paCheckPermission
      }),
    [paCheckPermission, paCheckWorkspaceRole, paMemberId, projectAccessState]
  );

  const resetProjectAccessForm = () => {
    setPaProjectId(projectOptions[0]?.id ?? "");
    setPaMemberId("site-manager");
    setPaMemberName("Site Manager");
    setPaRole("project_manager");
    setPaSupplierId("");
    setPaExtraPermissions([]);
    setPaDeniedPermissions([]);
    setPaDecision(null);
  };

  const auditProjectAccess = (action: string, grant: ProjectAccessGrant) => {
    appendAuditEntry({
      action: `project_access.${action}`,
      actorType: "admin",
      actorId: "local-admin",
      targetType: "project_access_grant",
      targetId: grant.id,
      payload: {
        projectId: grant.projectId || "*",
        memberId: grant.memberId,
        memberName: grant.memberName,
        role: grant.role,
        supplierId: grant.supplierId || "",
        active: grant.active
      }
    });
    setAuditState(loadAuditState());
  };

  const persistProjectAccess = (
    next: ProjectAccessState,
    action: string,
    grant: ProjectAccessGrant
  ) => {
    saveProjectAccessState(next);
    setProjectAccessState(next);
    auditProjectAccess(action, grant);
  };

  const submitProjectAccessGrant = () => {
    const memberId = paMemberId.trim();
    const memberName = paMemberName.trim();
    if (!memberId || !memberName) return;

    const projectKey = paProjectId || "all";
    const supplierKey = paSupplierId || "any";
    const grant = createProjectAccessGrant({
      id: `project-grant-${projectKey}-${memberId}-${paRole}-${supplierKey}`,
      workspaceId: "local-workspace",
      projectId: paProjectId,
      memberId,
      memberName,
      role: paRole,
      supplierId: paSupplierId,
      extraPermissions: paExtraPermissions,
      deniedPermissions: paDeniedPermissions,
      active: true,
      createdBy: "local-admin"
    });
    const next = upsertProjectAccessGrant(projectAccessState, grant);
    persistProjectAccess(next, "upsert", grant);
    setPaDecision(null);
  };

  const toggleProjectAccessGrant = (grant: ProjectAccessGrant) => {
    const updatedGrant: ProjectAccessGrant = { ...grant, active: !grant.active };
    const next = upsertProjectAccessGrant(projectAccessState, updatedGrant);
    persistProjectAccess(next, updatedGrant.active ? "activate" : "deactivate", updatedGrant);
  };

  const deleteProjectAccessGrant = (grant: ProjectAccessGrant) => {
    const next = removeProjectAccessGrant(projectAccessState, grant.id);
    persistProjectAccess(next, "delete", grant);
    setPaDecision(null);
  };

  const runProjectAccessCheck = () => {
    setPaDecision(
      evaluateProjectAccess(projectAccessState, {
        memberId: paMemberId,
        workspaceRole: paCheckWorkspaceRole,
        projectId: paProjectId,
        supplierId: paSupplierId,
        permission: paCheckPermission
      })
    );
  };

  // --- Header titles per tab ----------------------------------------------
  const tabHeader = (() => {
    switch (currentTab) {
      case "plans":
        return { title: copy.plansTitle, detail: copy.plansDetail };
      case "overrides":
        return { title: copy.overridesTitle, detail: copy.overridesDetail };
      case "project-access":
        return { title: projectAccessCopy.title, detail: projectAccessCopy.detail };
      case "audit":
        return { title: copy.auditTitle, detail: copy.auditDetail };
      default:
        return { title: copy.overviewTitle, detail: copy.overviewDetail };
    }
  })();

  return (
    <section className="workspace-hub admin-app" aria-label={copy.heroTitle}>
      <div className="module-hero">
        <div>
          <h1>{copy.heroTitle}</h1>
          <p>{copy.heroDetail}</p>
        </div>
        <div className="module-actions">
          <button
            className="secondary-button"
            onClick={() => onSelectApp("hub")}
            type="button"
          >
            <Home size={18} />
            {copy.backToHub}
          </button>
        </div>
      </div>

      {currentTab === "overview" && (
        <>
          <div className="summary-grid hub-summary-grid hub-summary-grid--wide">
            <SummaryTile
              label={copy.summaryTotalPlans}
              value={`${summary.totalPlans}`}
            />
            <SummaryTile
              label={copy.summaryActiveRules}
              value={`${enabledRulesCount}`}
            />
            <SummaryTile
              label={copy.summaryOverrides}
              value={`${summary.totalOverrides}`}
            />
            <SummaryTile
              label={copy.summaryAllowedApps}
              value={`${summary.allowedAppCount}`}
              strong
            />
            <SummaryTile
              label={copy.summaryDeniedApps}
              value={`${summary.deniedAppCount}`}
            />
            <SummaryTile
              label={copy.summaryAuditEntries}
              value={`${auditState.entries.length}`}
            />
          </div>

          <div className="module-board admin-overview-board">
            <PageHeader
              title={copy.recentAuditTitle}
              detail={copy.recentAuditDetail}
            />
            {recentAudit.length === 0 ? (
              <div className="hub-action-empty">
                <ClipboardList size={18} />
                <strong>{copy.emptyAudit}</strong>
                <span>—</span>
              </div>
            ) : (
              <div className="cashflow-table admin-table">
                <div className="cashflow-table-head admin-table-head--audit-short">
                  <span>{copy.colWhen}</span>
                  <span>{copy.colActionLabel}</span>
                  <span>{copy.colActor}</span>
                  <span>{copy.colTarget}</span>
                </div>
                {recentAudit.map((entry) => (
                  <div className="cashflow-row admin-row" key={entry.id}>
                    <span className="cashflow-cell-date">
                      {formatWhen(entry.createdAt)}
                    </span>
                    <span>{entry.action}</span>
                    <span>
                      {entry.actorType}
                      {entry.actorId ? `:${entry.actorId}` : ""}
                    </span>
                    <span>
                      {entry.targetType}
                      {entry.targetId ? `:${entry.targetId}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="module-board admin-overview-board">
            <PageHeader
              title={copy.activeSubscriptionTitle}
              detail={copy.activeSubscriptionDetail}
            />
            {currentSubscription ? (
              <div className="admin-subscription-card">
                <div className="admin-subscription-row">
                  <Shield size={18} />
                  <span className="admin-subscription-label">
                    {copy.subscriptionPlan}
                  </span>
                  <strong>
                    {currentPlan ? currentPlan.name : copy.unknownPlan}
                  </strong>
                </div>
                <div className="admin-subscription-row">
                  <FileCheck2 size={18} />
                  <span className="admin-subscription-label">
                    {copy.subscriptionStatus}
                  </span>
                  <span className="cashflow-badge admin-badge">
                    {subscriptionStatusLabel(currentSubscription.status, copy)}
                  </span>
                </div>
                <div className="admin-subscription-row">
                  <Clock size={18} />
                  <span className="admin-subscription-label">
                    {copy.subscriptionPeriodEnd}
                  </span>
                  <span>
                    {currentSubscription.currentPeriodEnd || copy.noPeriodEnd}
                  </span>
                </div>
                <div className="admin-subscription-actions">
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.location.href = "/support-plans";
                      }
                    }}
                  >
                    <Settings size={16} />
                    {copy.buttonSwitchPlan}
                  </button>
                </div>
              </div>
            ) : (
              <div className="hub-action-empty">
                <Shield size={18} />
                <strong>{copy.subscriptionNone}</strong>
                <span>—</span>
              </div>
            )}
          </div>

          <div className="module-board admin-overview-board">
            <PageHeader
              title={language === "en" ? "Cloud sync (Supabase)" : "Cloud sync (Supabase)"}
              detail={
                language === "en"
                  ? "Phase C — local-first cache + opt-in cloud sync. Local writes always succeed; cloud pushes happen in the background."
                  : "Phase C — local-first cache + cloud sync แบบ opt-in; การเขียน local สำเร็จเสมอ การ push ขึ้น cloud ทำงาน background"
              }
            />

            {!supabaseReady ? (
              <div className="hub-action-empty">
                <CloudOff size={18} />
                <strong>
                  {language === "en"
                    ? "Supabase env vars not set."
                    : ".env ของ Supabase ยังไม่ถูกตั้ง"}
                </strong>
                <span>
                  {language === "en"
                    ? "Follow docs/SUPABASE_SETUP.md step 1-2 to paste VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY into .env, then restart npm run dev."
                    : "ทำตาม docs/SUPABASE_SETUP.md step 1-2 ใส่ VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY ใน .env แล้ว restart npm run dev"}
                </span>
              </div>
            ) : syncStatus ? (
              <div className="admin-subscription-card">
                <div className="admin-subscription-row">
                  <Cloud size={18} />
                  <span className="admin-subscription-label">
                    {language === "en" ? "Status" : "สถานะ"}
                  </span>
                  <span className="cashflow-badge admin-badge">
                    {language === "en" ? "Active" : "เปิดใช้งาน"}
                  </span>
                </div>
                <div className="admin-subscription-row">
                  <Shield size={18} />
                  <span className="admin-subscription-label">
                    {language === "en" ? "Workspace" : "Workspace"}
                  </span>
                  <span style={{ fontFamily: "var(--mono, monospace)", fontSize: 12 }}>
                    {syncStatus.workspaceId}
                  </span>
                </div>
                <div className="admin-subscription-row">
                  <Upload size={18} />
                  <span className="admin-subscription-label">
                    {language === "en" ? "Pending writes" : "รอ push"}
                  </span>
                  <span>{syncStatus.pendingWrites}</span>
                </div>
                <div className="admin-subscription-row">
                  <Clock size={18} />
                  <span className="admin-subscription-label">
                    {language === "en" ? "Last push" : "Push ล่าสุด"}
                  </span>
                  <span>{syncStatus.lastPushAt || "—"}</span>
                </div>
                <div className="admin-subscription-row">
                  <Clock size={18} />
                  <span className="admin-subscription-label">
                    {language === "en" ? "Last pull" : "Pull ล่าสุด"}
                  </span>
                  <span>{syncStatus.lastPullAt || "—"}</span>
                </div>
                {syncStatus.lastError && (
                  <div className="admin-subscription-row" style={{ color: "#B23E1F" }}>
                    <CloudOff size={18} />
                    <span className="admin-subscription-label">
                      {language === "en" ? "Last error" : "Error ล่าสุด"}
                    </span>
                    <span>{syncStatus.lastError}</span>
                  </div>
                )}
                <div className="admin-subscription-actions">
                  <button
                    className="primary-button"
                    type="button"
                    onClick={handlePush}
                    disabled={syncBusy !== ""}
                  >
                    <Upload size={16} />
                    {syncBusy === "push"
                      ? language === "en"
                        ? "Pushing…"
                        : "กำลัง push…"
                      : language === "en"
                        ? "Push local → cloud"
                        : "Push local → cloud"}
                  </button>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={handlePull}
                    disabled={syncBusy !== ""}
                  >
                    <Cloud size={16} />
                    {syncBusy === "pull"
                      ? language === "en"
                        ? "Pulling…"
                        : "กำลัง pull…"
                      : language === "en"
                        ? "Pull cloud → local"
                        : "Pull cloud → local"}
                  </button>
                  <button
                    className="primary-button"
                    type="button"
                    onClick={handleRelationalSync}
                    disabled={syncBusy !== ""}
                    title={
                      language === "en"
                        ? "Two-way sync: projects + cashflow + PR tables (last-write-wins)"
                        : "Sync 2 ทาง: projects + cashflow + PR tables (ผู้แก้ล่าสุดชนะ)"
                    }
                  >
                    <Cloud size={16} />
                    {syncBusy === "relational"
                      ? language === "en"
                        ? "Syncing tables…"
                        : "กำลัง sync ตาราง…"
                      : language === "en"
                        ? "Sync tables (2-way)"
                        : "Sync ตาราง (2 ทาง)"}
                  </button>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={handleDeactivate}
                    disabled={syncBusy !== ""}
                  >
                    <CloudOff size={16} />
                    {language === "en" ? "Disconnect" : "ปิด sync"}
                  </button>
                </div>
                {syncMessage && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 10,
                      borderRadius: 6,
                      background: "#F4F4F2",
                      fontFamily: "var(--mono, monospace)",
                      fontSize: 12,
                      color: "#4A4A47"
                    }}
                  >
                    {syncMessage}
                  </div>
                )}
              </div>
            ) : (
              <div className="admin-subscription-card">
                <div className="admin-subscription-row">
                  <Cloud size={18} />
                  <span className="admin-subscription-label">
                    {language === "en" ? "Supabase URL" : "Supabase URL"}
                  </span>
                  <span style={{ fontFamily: "var(--mono, monospace)", fontSize: 12 }}>
                    {supabaseConnectionStatus.url || "—"}
                  </span>
                </div>
                <div className="admin-subscription-row">
                  <Shield size={18} />
                  <span className="admin-subscription-label">
                    {language === "en" ? "Signed in as" : "เข้าสู่ระบบ"}
                  </span>
                  <span>
                    {authUser
                      ? authUser.email || (language === "en" ? "Guest" : "ผู้เยี่ยมชม")
                      : language === "en"
                        ? "Not signed in"
                        : "ยังไม่ได้ sign in"}
                  </span>
                </div>
                {!authUser && (
                  <div
                    style={{
                      padding: 10,
                      borderRadius: 6,
                      background: "#FFF1CC",
                      color: "#92651A",
                      fontSize: 13,
                      marginTop: 8
                    }}
                  >
                    {language === "en"
                      ? "Sign in at /account first to enable cloud sync."
                      : "Sign in ที่ /account ก่อนเพื่อเปิด cloud sync"}{" "}
                    <a
                      href="/account"
                      style={{ color: "#92651A", fontWeight: 700 }}
                    >
                      → /account
                    </a>
                  </div>
                )}
                <div
                  style={{
                    display: "grid",
                    gap: 8,
                    marginTop: 14
                  }}
                >
                  <label style={{ display: "grid", gap: 4 }}>
                    <span
                      style={{
                        fontFamily: "var(--mono, monospace)",
                        fontSize: 10,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "#8A8A86"
                      }}
                    >
                      {language === "en" ? "Workspace UUID" : "Workspace UUID"}
                    </span>
                    {myWorkspaces.length > 0 ? (
                      <select
                        value={syncWorkspaceId}
                        onChange={(e) => setSyncWorkspaceId(e.target.value)}
                        style={{
                          padding: "8px 10px",
                          border: "1px solid var(--line)",
                          borderRadius: 6,
                          fontFamily: "var(--mono, monospace)",
                          fontSize: 13
                        }}
                      >
                        {myWorkspaces.map((ws) => (
                          <option key={ws.id} value={ws.id}>
                            {ws.name} · {ws.id.slice(0, 8)}… · {ws.role}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={syncWorkspaceId}
                        onChange={(e) => setSyncWorkspaceId(e.target.value)}
                        placeholder="00000000-0000-0000-0000-000000000000"
                        style={{
                          padding: "8px 10px",
                          border: "1px solid var(--line)",
                          borderRadius: 6,
                          fontFamily: "var(--mono, monospace)",
                          fontSize: 13
                        }}
                      />
                    )}
                    <small style={{ color: "#6B6B68", fontSize: 12 }}>
                      {myWorkspaces.length > 0
                        ? language === "en"
                          ? "Picked from your workspace memberships automatically."
                          : "เลือกอัตโนมัติจาก workspace ที่คุณเป็นสมาชิก"
                        : language === "en"
                          ? "Paste the workspace id from Supabase SQL editor, or use the button below to create one."
                          : "วาง workspace id จาก Supabase SQL editor หรือกดปุ่มข้างล่างเพื่อสร้างใหม่"}
                    </small>
                  </label>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                      className="primary-button"
                      type="button"
                      onClick={handleActivateSync}
                      disabled={syncBusy !== ""}
                    >
                      <Check size={16} />
                      {language === "en" ? "Activate cloud sync" : "เปิดสวิตช์ sync"}
                    </button>
                    {authUser && myWorkspaces.length === 0 && (
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={handleEnsureWorkspace}
                        disabled={syncBusy !== ""}
                      >
                        <Cloud size={16} />
                        {syncBusy === "ensure"
                          ? language === "en"
                            ? "Creating…"
                            : "กำลังสร้าง…"
                          : language === "en"
                            ? "Create my workspace"
                            : "สร้าง workspace ให้ฉัน"}
                      </button>
                    )}
                  </div>
                  {syncMessage && (
                    <div
                      style={{
                        padding: 10,
                        borderRadius: 6,
                        background: "#F4F4F2",
                        fontFamily: "var(--mono, monospace)",
                        fontSize: 12,
                        color: "#4A4A47"
                      }}
                    >
                      {syncMessage}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {currentTab === "plans" && (
        <>
          <div className="module-board admin-plans-board">
            <PageHeader title={tabHeader.title} detail={tabHeader.detail} />
            {plansState.plans.length === 0 ? (
              <div className="hub-action-empty">
                <Banknote size={18} />
                <strong>{copy.emptyPlans}</strong>
                <span>—</span>
              </div>
            ) : (
              <div className="cashflow-table admin-table">
                <div className="cashflow-table-head admin-table-head--plans">
                  <span>{copy.colName}</span>
                  <span>{copy.colPrice}</span>
                  <span>{copy.colInterval}</span>
                  <span>{copy.colStatus}</span>
                  <span>{copy.colRules}</span>
                  <span>{copy.colAction}</span>
                </div>
                {plansState.plans.map((plan) => {
                  const ruleCount = plansState.rules.filter(
                    (r) => r.planId === plan.id
                  ).length;
                  const isCurrent =
                    currentSubscription?.planId === plan.id;
                  return (
                    <div className="cashflow-row admin-row" key={plan.id}>
                      <span>
                        <strong>{plan.name}</strong>
                      </span>
                      <span>{formatPlanPrice(plan)}</span>
                      <span>{intervalLabel(plan.billingInterval, copy)}</span>
                      <span className="cashflow-badge admin-badge">
                        {planStatusLabel(plan.status, copy)}
                      </span>
                      <span>
                        {ruleCount} {copy.rulesCountSuffix}
                      </span>
                      <span className="cashflow-row-actions">
                        <button
                          className="cashflow-row-button"
                          type="button"
                          disabled={isCurrent}
                          onClick={() => handleActivatePlan(plan.id)}
                        >
                          {isCurrent ? copy.buttonCurrent : copy.buttonActivate}
                        </button>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="module-board admin-plan-form-board">
            <PageHeader title={copy.newPlanTitle} detail={copy.newPlanDetail} />
            <div className="admin-form">
              <label className="admin-field">
                <span>{copy.formPlanName}</span>
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                />
              </label>
              <label className="admin-field">
                <span>{copy.formPlanDescription}</span>
                <input
                  type="text"
                  value={planDescription}
                  onChange={(e) => setPlanDescription(e.target.value)}
                />
              </label>
              <label className="admin-field">
                <span>{copy.formPlanPrice}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={planPrice}
                  onChange={(e) => setPlanPrice(e.target.value)}
                />
              </label>
              <label className="admin-field">
                <span>{copy.formPlanInterval}</span>
                <select
                  value={planInterval}
                  onChange={(e) =>
                    setPlanInterval(e.target.value as Plan["billingInterval"])
                  }
                >
                  <option value="monthly">{copy.intervalMonthly}</option>
                  <option value="yearly">{copy.intervalYearly}</option>
                  <option value="one_time">{copy.intervalOneTime}</option>
                  <option value="none">{copy.intervalNone}</option>
                </select>
              </label>
              <div className="admin-form-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={resetPlanForm}
                >
                  {copy.buttonCancel}
                </button>
                <button
                  className="primary-button"
                  type="button"
                  onClick={submitNewPlan}
                  disabled={!planName.trim()}
                >
                  <FileCheck2 size={16} />
                  {copy.buttonNewPlan}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {currentTab === "overrides" && (
        <>
          <div className="module-board admin-overrides-board">
            <PageHeader title={tabHeader.title} detail={tabHeader.detail} />
            {plansState.overrides.length === 0 ? (
              <div className="hub-action-empty">
                <Users size={18} />
                <strong>{copy.emptyOverrides}</strong>
                <span>—</span>
              </div>
            ) : (
              <div className="cashflow-table admin-table">
                <div className="cashflow-table-head admin-table-head--overrides">
                  <span>{copy.colScope}</span>
                  <span>{copy.colScopeId}</span>
                  <span>{copy.colApp}</span>
                  <span>{copy.colEffect}</span>
                  <span>{copy.colAccessLevel}</span>
                  <span>{copy.colReason}</span>
                </div>
                {plansState.overrides.map((ov) => (
                  <div className="cashflow-row admin-row" key={ov.id}>
                    <span>{scopeLabel(ov.scope, copy)}</span>
                    <span>{ov.scopeId || "—"}</span>
                    <span>{appLabel(ov.appId, language)}</span>
                    <span
                      className={
                        ov.effect === "deny"
                          ? "cashflow-badge admin-badge admin-badge--deny"
                          : "cashflow-badge admin-badge"
                      }
                    >
                      {effectLabel(ov.effect, copy)}
                    </span>
                    <span>{ov.accessLevel}</span>
                    <span>{ov.reason || "—"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="module-board admin-override-form-board">
            <PageHeader
              title={copy.newOverrideTitle}
              detail={copy.newOverrideDetail}
            />
            <div className="admin-form">
              <label className="admin-field">
                <span>{copy.formScope}</span>
                <select
                  value={ovScope}
                  onChange={(e) =>
                    setOvScope(e.target.value as "workspace" | "member" | "user")
                  }
                >
                  <option value="workspace">{copy.scopeWorkspace}</option>
                  <option value="member">{copy.scopeMember}</option>
                  <option value="user">{copy.scopeUser}</option>
                </select>
              </label>
              <label className="admin-field">
                <span>{copy.formScopeId}</span>
                <input
                  type="text"
                  value={ovScopeId}
                  onChange={(e) => setOvScopeId(e.target.value)}
                />
              </label>
              <label className="admin-field">
                <span>{copy.formAppId}</span>
                <select
                  value={ovAppId}
                  onChange={(e) => setOvAppId(e.target.value as WorkspaceAppId)}
                >
                  {workspaceApps.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-field">
                <span>{copy.formEffect}</span>
                <select
                  value={ovEffect}
                  onChange={(e) =>
                    setOvEffect(e.target.value as "allow" | "deny")
                  }
                >
                  <option value="allow">{copy.effectAllow}</option>
                  <option value="deny">{copy.effectDeny}</option>
                </select>
              </label>
              <label className="admin-field">
                <span>{copy.formAccessLevel}</span>
                <select
                  value={ovAccessLevel}
                  onChange={(e) =>
                    setOvAccessLevel(e.target.value as WorkspaceAppAccessLevel)
                  }
                  disabled={ovEffect === "deny"}
                >
                  {accessLevels.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-field admin-field--reason">
                <span>{copy.formReason}</span>
                <input
                  type="text"
                  value={ovReason}
                  onChange={(e) => setOvReason(e.target.value)}
                />
              </label>
              <div className="admin-form-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={resetOverrideForm}
                >
                  {copy.buttonCancel}
                </button>
                <button
                  className="primary-button"
                  type="button"
                  onClick={submitNewOverride}
                  disabled={!ovScopeId.trim()}
                >
                  <Shield size={16} />
                  {copy.buttonCreateOverride}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {currentTab === "project-access" && (
        <>
          <div className="summary-grid hub-summary-grid hub-summary-grid--wide">
            <SummaryTile
              label={projectAccessCopy.summaryGrants}
              value={`${projectAccessSummary.total}`}
            />
            <SummaryTile
              label={projectAccessCopy.summaryActive}
              value={`${projectAccessSummary.active}`}
              strong
            />
            <SummaryTile
              label={projectAccessCopy.summaryMembers}
              value={`${projectAccessSummary.members}`}
            />
            <SummaryTile
              label={projectAccessCopy.summaryProjects}
              value={`${projectAccessSummary.projects}`}
            />
          </div>

          <div className="module-board admin-project-access-board" data-testid="project-access-panel">
            <PageHeader
              title={projectAccessCopy.boardTitle}
              detail={projectAccessCopy.boardDetail}
            />
            {projectAccessState.grants.length === 0 ? (
              <div className="hub-action-empty">
                <Users size={18} />
                <strong>{projectAccessCopy.empty}</strong>
                <span>-</span>
              </div>
            ) : (
              <div className="cashflow-table admin-table">
                <div className="cashflow-table-head admin-table-head--project-access">
                  <span>{projectAccessCopy.colProject}</span>
                  <span>{projectAccessCopy.colMember}</span>
                  <span>{projectAccessCopy.colRole}</span>
                  <span>{projectAccessCopy.colSupplier}</span>
                  <span>{projectAccessCopy.colPermissions}</span>
                  <span>{projectAccessCopy.colStatus}</span>
                  <span>{projectAccessCopy.colAction}</span>
                </div>
                {projectAccessState.grants.map((grant) => {
                  const projectLabel = grant.projectId
                    ? projectNameById.get(grant.projectId) ?? grant.projectId
                    : projectAccessCopy.allProjects;
                  const supplierLabel = grant.supplierId
                    ? supplierNameById.get(grant.supplierId) ?? grant.supplierId
                    : projectAccessCopy.noSupplier;
                  const permissions = effectivePermissionsForProjectAccessGrant(grant);
                  return (
                    <div className="cashflow-row admin-row project-access-row" key={grant.id}>
                      <span>{projectLabel}</span>
                      <span>
                        <strong>{grant.memberName || grant.memberId}</strong>
                        <small>{grant.memberId}</small>
                      </span>
                      <span>{optionLabel(grant.role)}</span>
                      <span>{supplierLabel}</span>
                      <span title={permissions.join(", ")}>
                        {compactPermissions(permissions)}
                      </span>
                      <span
                        className={
                          grant.active
                            ? "cashflow-badge admin-badge"
                            : "cashflow-badge admin-badge admin-badge--deny"
                        }
                      >
                        {grant.active ? projectAccessCopy.active : projectAccessCopy.inactive}
                      </span>
                      <span className="cashflow-row-actions project-access-actions">
                        <button
                          className="cashflow-row-button"
                          type="button"
                          onClick={() => toggleProjectAccessGrant(grant)}
                        >
                          {grant.active
                            ? projectAccessCopy.buttonDeactivate
                            : projectAccessCopy.buttonActivate}
                        </button>
                        <button
                          className="cashflow-row-button cashflow-row-button--danger"
                          type="button"
                          onClick={() => deleteProjectAccessGrant(grant)}
                        >
                          {projectAccessCopy.buttonDelete}
                        </button>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="module-board admin-project-access-form-board">
            <PageHeader
              title={projectAccessCopy.formTitle}
              detail={projectAccessCopy.formDetail}
            />
            <div className="admin-form project-access-form">
              <label className="admin-field">
                <span>{projectAccessCopy.formProject}</span>
                <select value={paProjectId} onChange={(e) => setPaProjectId(e.target.value)}>
                  <option value="">{projectAccessCopy.allProjects}</option>
                  {projectOptions.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.code ? `${project.code} - ${project.name}` : project.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-field">
                <span>{projectAccessCopy.formMemberId}</span>
                <input
                  type="text"
                  value={paMemberId}
                  onChange={(e) => setPaMemberId(e.target.value)}
                />
              </label>
              <label className="admin-field">
                <span>{projectAccessCopy.formMemberName}</span>
                <input
                  type="text"
                  value={paMemberName}
                  onChange={(e) => setPaMemberName(e.target.value)}
                />
              </label>
              <label className="admin-field">
                <span>{projectAccessCopy.formRole}</span>
                <select
                  value={paRole}
                  onChange={(e) => setPaRole(e.target.value as ProjectRole)}
                >
                  {PROJECT_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {optionLabel(role)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-field">
                <span>{projectAccessCopy.formSupplier}</span>
                <select
                  value={paSupplierId}
                  onChange={(e) => setPaSupplierId(e.target.value)}
                >
                  <option value="">{projectAccessCopy.noSupplier}</option>
                  {supplierOptions.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.shortName ? `${supplier.shortName} - ${supplier.name}` : supplier.name}
                    </option>
                  ))}
                </select>
              </label>

              <fieldset className="project-access-permission-set">
                <legend>{projectAccessCopy.formExtraPermissions}</legend>
                <div className="project-access-permission-grid">
                  {PROJECT_PERMISSIONS.map((permission) => (
                    <label className="project-access-permission" key={`extra-${permission}`}>
                      <input
                        type="checkbox"
                        checked={paExtraPermissions.includes(permission)}
                        onChange={(e) => {
                          setPaExtraPermissions((prev) =>
                            e.target.checked
                              ? Array.from(new Set([...prev, permission]))
                              : prev.filter((item) => item !== permission)
                          );
                          if (e.target.checked) {
                            setPaDeniedPermissions((prev) =>
                              prev.filter((item) => item !== permission)
                            );
                          }
                        }}
                      />
                      <span>{permission}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="project-access-permission-set">
                <legend>{projectAccessCopy.formDeniedPermissions}</legend>
                <div className="project-access-permission-grid">
                  {PROJECT_PERMISSIONS.map((permission) => (
                    <label className="project-access-permission" key={`deny-${permission}`}>
                      <input
                        type="checkbox"
                        checked={paDeniedPermissions.includes(permission)}
                        onChange={(e) => {
                          setPaDeniedPermissions((prev) =>
                            e.target.checked
                              ? Array.from(new Set([...prev, permission]))
                              : prev.filter((item) => item !== permission)
                          );
                          if (e.target.checked) {
                            setPaExtraPermissions((prev) =>
                              prev.filter((item) => item !== permission)
                            );
                          }
                        }}
                      />
                      <span>{permission}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="admin-form-actions project-access-form-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={resetProjectAccessForm}
                >
                  {projectAccessCopy.buttonReset}
                </button>
                <button
                  className="primary-button"
                  type="button"
                  onClick={submitProjectAccessGrant}
                  disabled={!paMemberId.trim() || !paMemberName.trim()}
                >
                  <Shield size={16} />
                  {projectAccessCopy.buttonCreate}
                </button>
              </div>
            </div>
          </div>

          <div className="module-board admin-project-access-check-board">
            <PageHeader
              title={projectAccessCopy.checkTitle}
              detail={projectAccessCopy.checkDetail}
            />
            <div className="admin-form project-access-check-form">
              <label className="admin-field">
                <span>{projectAccessCopy.formWorkspaceRole}</span>
                <select
                  value={paCheckWorkspaceRole}
                  onChange={(e) => setPaCheckWorkspaceRole(e.target.value as WorkspaceRole)}
                >
                  {WORKSPACE_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {optionLabel(role)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-field">
                <span>{projectAccessCopy.formPermissionCheck}</span>
                <select
                  value={paCheckPermission}
                  onChange={(e) => setPaCheckPermission(e.target.value as ProjectPermission)}
                >
                  {PROJECT_PERMISSIONS.map((permission) => (
                    <option key={permission} value={permission}>
                      {permission}
                    </option>
                  ))}
                </select>
              </label>
              <div className="admin-form-actions">
                <button
                  className="primary-button"
                  type="button"
                  onClick={runProjectAccessCheck}
                  disabled={!paMemberId.trim()}
                >
                  <Check size={16} />
                  {projectAccessCopy.buttonCheck}
                </button>
              </div>
            </div>
            {paDecision && (
              <div
                className={
                  paDecision.allowed
                    ? "project-access-decision project-access-decision--allowed"
                    : "project-access-decision project-access-decision--denied"
                }
              >
                <strong>
                  {paDecision.allowed
                    ? projectAccessCopy.decisionAllowed
                    : projectAccessCopy.decisionDenied}
                </strong>
                <span>{projectAccessReasonLabel(paDecision.reason)}</span>
                <small>
                  {projectAccessCopy.matchedGrants}:{" "}
                  {paDecision.matchedGrantIds.length > 0
                    ? paDecision.matchedGrantIds.join(", ")
                    : "-"}
                </small>
                <small>
                  {projectAccessCopy.accessibleProjects}:{" "}
                  {accessibleProjectIds.length > 0
                    ? accessibleProjectIds
                        .map((id) =>
                          id === "*"
                            ? projectAccessCopy.allProjects
                            : projectNameById.get(id) ?? id
                        )
                        .join(", ")
                    : "-"}
                </small>
              </div>
            )}
          </div>
        </>
      )}

      {currentTab === "audit" && (
        <div className="module-board admin-audit-board">
          <PageHeader title={copy.auditBoardTitle} detail={copy.auditBoardDetail} />
          <p className="admin-audit-caption">{auditCaption}</p>
          {fullAudit.length === 0 ? (
            <div className="hub-action-empty">
              <ClipboardList size={18} />
              <strong>{copy.emptyAudit}</strong>
              <span>—</span>
            </div>
          ) : (
            <div className="cashflow-table admin-table">
              <div className="cashflow-table-head admin-table-head--audit">
                <span>{copy.colWhen}</span>
                <span>{copy.colActionLabel}</span>
                <span>{copy.colActor}</span>
                <span>{copy.colTarget}</span>
                <span>{copy.colPayload}</span>
              </div>
              {fullAudit.map((entry) => (
                <div className="cashflow-row admin-row" key={entry.id}>
                  <span className="cashflow-cell-date">
                    {formatWhen(entry.createdAt)}
                  </span>
                  <span>{entry.action}</span>
                  <span>
                    {entry.actorType}
                    {entry.actorId ? `:${entry.actorId}` : ""}
                  </span>
                  <span>
                    {entry.targetType}
                    {entry.targetId ? `:${entry.targetId}` : ""}
                  </span>
                  <span className="admin-payload-cell">
                    {summarizePayload(entry.payload)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
