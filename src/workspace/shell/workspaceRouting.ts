import {
  Banknote,
  Bug,
  Building2,
  Camera,
  CalendarDays,
  Check,
  ClipboardList,
  Database,
  Download,
  FileCheck2,
  FileSpreadsheet,
  FileSignature,
  FileText,
  FolderOpen,
  Home,
  Image as ImageIcon,
  LayoutGrid,
  LineChart,
  MessageCircle,
  ReceiptText,
  RefreshCw,
  Settings,
  Sheet,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
  Users,
  WandSparkles,
  type LucideIcon
} from "lucide-react";

import {
  defaultWorkspaceAppId,
  getDefaultWorkspaceAppVersion,
  getWorkspaceApp,
  getWorkspaceAppVersion,
  workspaceApps
} from "../../apps";
import type { WorkspaceAppId } from "../../apps";

export type AppPage = "documents" | "contracts" | "sheets" | "clients" | "projects" | "costs" | "settings";

export const designWorkflowIds = [
  "envision",
  "redesign",
  "diy",
  "outpaint",
  "analyzer",
  "gallery",
  "angles"
] as const;
export type DesignWorkflowId = (typeof designWorkflowIds)[number];

export const libraryTabIds = ["images", "documents", "prompts", "trash"] as const;
export type LibraryTabId = (typeof libraryTabIds)[number];

export type WorkspaceSubnavItem = {
  key: string;
  label: string;
  detail: string;
  icon: LucideIcon;
};

export type WorkspaceRouteState = {
  appId: WorkspaceAppId;
  tabKey: string;
  versionId: string;
};

export const navItems = [
  { key: "documents", label: "เอกสาร", icon: FileText },
  { key: "contracts", label: "สัญญา", icon: FileSignature },
  { key: "sheets", label: "Google Sheet", icon: Sheet },
  { key: "clients", label: "ลูกค้า", icon: Users },
  { key: "projects", label: "โครงการ", icon: Building2 },
  { key: "costs", label: "ต้นทุน", icon: LineChart },
  { key: "settings", label: "ตั้งค่า", icon: Settings }
] satisfies Array<{ key: AppPage; label: string; icon: LucideIcon }>;

const appPageKeys = navItems.map((item) => item.key);

const buildDocsSubnavDetails: Record<AppPage, string> = {
  documents: "Quote · PO · Invoice",
  contracts: "Agreement",
  sheets: "Import CSV",
  clients: "CRM",
  projects: "Jobs",
  costs: "BOQ",
  settings: "Backup"
};

export const workspaceAppSubnavItems: Record<WorkspaceAppId, WorkspaceSubnavItem[]> = {
  hub: [
    { key: "overview", label: "Overview", detail: "Apps · Status", icon: Home },
    { key: "ready", label: "Ready Apps", detail: "Docs · Hub", icon: Check },
    { key: "pipeline", label: "Pipeline", detail: "Prototype · Next", icon: ClipboardList }
  ],
  projects: [
    { key: "list", label: "List", detail: "All projects", icon: Building2 },
    { key: "archive", label: "Archive", detail: "Closed · Cancelled", icon: FolderOpen },
    { key: "analytics", label: "Analytics", detail: "Cross-project", icon: LineChart }
  ],
  costCodes: [
    { key: "catalog", label: "Catalog", detail: "Tree · Search", icon: Database },
    { key: "import", label: "Import", detail: "CSV · Builk", icon: Upload },
    { key: "export", label: "Export", detail: "CSV · Excel", icon: Download },
    { key: "usage", label: "Usage", detail: "Analytics", icon: LineChart }
  ],
  suppliers: [
    { key: "directory", label: "Directory", detail: "List · Detail", icon: Users },
    { key: "price-history", label: "Price History", detail: "Cross-supplier", icon: LineChart },
    { key: "import", label: "Import", detail: "CSV", icon: Upload },
    { key: "analytics", label: "Analytics", detail: "Top spend", icon: ClipboardList }
  ],
  procurement: [
    { key: "pr-list", label: "PR", detail: "Purchase Requests", icon: ClipboardList },
    { key: "rfq-list", label: "RFQ", detail: "Quotation compare", icon: FileCheck2 },
    { key: "archive", label: "Archive", detail: "Closed · Cancelled", icon: FolderOpen }
  ],
  projectControl: [
    { key: "dashboard", label: "Dashboard", detail: "Budget vs actual", icon: LineChart },
    { key: "reports", label: "Reports", detail: "5 standard reports", icon: ClipboardList },
    { key: "settings", label: "Settings", detail: "Alert thresholds", icon: Settings }
  ],
  approvals: [
    { key: "inbox", label: "Inbox", detail: "Pending approvals", icon: ClipboardList },
    { key: "history", label: "History", detail: "Decisions", icon: FileCheck2 },
    { key: "rules", label: "Rules", detail: "Approval matrix", icon: Settings }
  ],
  evidence: [
    { key: "library", label: "Library", detail: "Files · Proof", icon: FileCheck2 },
    { key: "intake", label: "Intake", detail: "Upload · Link", icon: Upload },
    { key: "links", label: "Links", detail: "Project · Cost", icon: ClipboardList },
    { key: "reports", label: "Reports", detail: "CSV · Review", icon: LineChart }
  ],
  builddocs: navItems.map((item) => ({
    key: item.key,
    label: item.label,
    detail: buildDocsSubnavDetails[item.key],
    icon: item.icon
  })),
  boqData: [
    { key: "database", label: "Database", detail: "Keynote · Rates", icon: Database },
    { key: "task-linkage", label: "Task Linkage", detail: "Task · BOQ", icon: ClipboardList },
    { key: "import", label: "Import", detail: "CSV · Source", icon: Upload },
    { key: "export", label: "Export", detail: "Excel · CSV", icon: Download },
    { key: "bulk", label: "Bulk Adjust", detail: "Material · Labor", icon: SlidersHorizontal }
  ],
  constructionPlanner: [
    { key: "overview", label: "Overview", detail: "Project · KPI", icon: Home },
    { key: "schedule", label: "Schedule", detail: "Gantt · Tasks", icon: CalendarDays },
    { key: "boq", label: "BOQ", detail: "Material · Labor", icon: FileSpreadsheet },
    { key: "curve", label: "Curve", detail: "Planned value", icon: LineChart }
  ],
  designStudio: [
    { key: "envision", label: "Envision", detail: "Text -> Concept", icon: Sparkles },
    { key: "redesign", label: "ReDesign", detail: "Image -> Restyle", icon: RefreshCw },
    { key: "diy", label: "DIY Editor", detail: "Mask + Prompt", icon: WandSparkles },
    { key: "outpaint", label: "Outpaint", detail: "Extend frame", icon: ImageIcon },
    { key: "analyzer", label: "Analyzer", detail: "Image -> Report", icon: ClipboardList },
    { key: "gallery", label: "Gallery", detail: "Asset · Upscale", icon: LayoutGrid },
    { key: "angles", label: "Angles", detail: "Views · Video", icon: Camera }
  ],
  library: [
    { key: "images", label: "Images", detail: "Gallery · Viewer", icon: ImageIcon },
    { key: "documents", label: "Documents", detail: "PDF · XLSX", icon: FileText },
    { key: "prompts", label: "Prompt", detail: "Reuse · Copy", icon: WandSparkles },
    { key: "trash", label: "Trash", detail: "Restore", icon: Trash2 }
  ],
  defectTracker: [
    { key: "overview", label: "ภาพรวม", detail: "ความคืบหน้า", icon: Bug },
    { key: "defects", label: "Defects", detail: "รายการแก้ไข", icon: ClipboardList },
    { key: "inspection", label: "Inspection", detail: "ส่งมอบ", icon: FileCheck2 },
    { key: "site-report", label: "Site Report", detail: "360 / PDF", icon: Camera }
  ],
  employees: [
    { key: "overview", label: "Overview", detail: "Wage · Benefits", icon: Users },
    { key: "teams", label: "Teams", detail: "Office · Site", icon: Building2 },
    { key: "payroll", label: "Payroll", detail: "Project labor", icon: ReceiptText }
  ],
  socialFeed: [
    { key: "feed", label: "Feed", detail: "Posts · Updates", icon: MessageCircle },
    { key: "network", label: "Network", detail: "Contractors", icon: Users },
    { key: "profile", label: "Profile", detail: "My account", icon: UserRound }
  ],
  agentChat: [
    { key: "chat", label: "Chat", detail: "Ask · File", icon: MessageCircle },
    { key: "files", label: "Files", detail: "Upload · Extract", icon: Upload },
    { key: "channels", label: "Channels", detail: "API · Webhook", icon: Settings }
  ],
  debtPlanner: [
    { key: "plan", label: "Debt Plan", detail: "Snowball · Priority", icon: Banknote },
    { key: "targets", label: "Targets", detail: "Monthly payoff", icon: Check },
    { key: "history", label: "History", detail: "Payment log", icon: ReceiptText }
  ],
  cashflow: [
    { key: "overview", label: "Overview", detail: "Income · Expense", icon: LineChart },
    { key: "forecast", label: "Forecast", detail: "Next 90 days", icon: ClipboardList },
    { key: "reports", label: "Reports", detail: "Analytics", icon: FileCheck2 }
  ],
  clientOps: [
    { key: "clients", label: "Clients", detail: "Contacts", icon: Users },
    { key: "projects", label: "Projects", detail: "Active jobs", icon: Building2 },
    { key: "followups", label: "Follow-ups", detail: "Queue", icon: MessageCircle }
  ],
  admin: [
    { key: "overview", label: "Overview", detail: "Plans · Stats", icon: Home },
    { key: "plans", label: "Plans", detail: "Tier · Rules", icon: Banknote },
    { key: "overrides", label: "Overrides", detail: "Admin grants", icon: Settings },
    { key: "project-access", label: "Project Access", detail: "Roles · Permissions", icon: Users },
    { key: "audit", label: "Audit", detail: "Permission log", icon: ClipboardList }
  ]
};

export function isAppPage(value: string): value is AppPage {
  return (appPageKeys as string[]).includes(value);
}

export function isDesignWorkflowId(value: string): value is DesignWorkflowId {
  return (designWorkflowIds as readonly string[]).includes(value);
}

export function isLibraryTabId(value: string): value is LibraryTabId {
  return (libraryTabIds as readonly string[]).includes(value);
}

export function getDefaultSubnavKey(appId: WorkspaceAppId) {
  return workspaceAppSubnavItems[appId][0]?.key ?? "overview";
}

export function normalizeSubnavKey(appId: WorkspaceAppId, key: string | null) {
  if (appId === "builddocs") {
    return key && isAppPage(key) ? key : "documents";
  }

  if (appId === "designStudio") {
    return key && isDesignWorkflowId(key) ? key : "envision";
  }

  if (appId === "library") {
    return key && isLibraryTabId(key) ? key : "images";
  }

  return workspaceAppSubnavItems[appId].some((item) => item.key === key)
    ? key ?? getDefaultSubnavKey(appId)
    : getDefaultSubnavKey(appId);
}

export function getWorkspaceAppIdFromPath(pathname: string): WorkspaceAppId {
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const matchedApp = workspaceApps
    .filter((app) => app.routeBase !== "/")
    .sort((first, second) => second.routeBase.length - first.routeBase.length)
    .find((app) => normalizedPath === app.routeBase || normalizedPath.startsWith(`${app.routeBase}/`));

  return matchedApp?.id ?? defaultWorkspaceAppId;
}

export function normalizeWorkspaceAppVersionId(appId: WorkspaceAppId, versionId: string | null | undefined) {
  const app = getWorkspaceApp(appId);
  return getWorkspaceAppVersion(app, versionId)?.id ?? getDefaultWorkspaceAppVersion(app)?.id ?? "0.1";
}

export function getWorkspaceRouteFromLocation(): WorkspaceRouteState {
  if (typeof window === "undefined") {
    return {
      appId: defaultWorkspaceAppId,
      tabKey: getDefaultSubnavKey(defaultWorkspaceAppId),
      versionId: normalizeWorkspaceAppVersionId(defaultWorkspaceAppId, null)
    };
  }

  const appId = getWorkspaceAppIdFromPath(window.location.pathname);
  const params = new URLSearchParams(window.location.search);
  const requestedTab = params.get("tab");
  const requestedVersion = params.get("version");

  return {
    appId,
    tabKey: normalizeSubnavKey(appId, requestedTab),
    versionId: normalizeWorkspaceAppVersionId(appId, requestedVersion)
  };
}

export function buildWorkspaceRoute(appId: WorkspaceAppId, tabKey: string, versionId?: string) {
  const routeBase = getWorkspaceApp(appId).routeBase;
  const params = new URLSearchParams({ tab: normalizeSubnavKey(appId, tabKey) });
  params.set("version", normalizeWorkspaceAppVersionId(appId, versionId));

  return `${routeBase}?${params.toString()}`;
}

export const APP_VERSION_SELECTION_STORAGE_KEY = "build-by-bim.app-version-selection.v1";

export function loadWorkspaceAppVersionSelection(): Partial<Record<WorkspaceAppId, string>> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(APP_VERSION_SELECTION_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Record<WorkspaceAppId, string>>) : {};

    return workspaceApps.reduce<Partial<Record<WorkspaceAppId, string>>>((selection, app) => {
      const versionId = parsed[app.id];
      if (versionId) {
        selection[app.id] = normalizeWorkspaceAppVersionId(app.id, versionId);
      }

      return selection;
    }, {});
  } catch {
    return {};
  }
}

export function saveWorkspaceAppVersionSelection(selection: Partial<Record<WorkspaceAppId, string>>) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(APP_VERSION_SELECTION_STORAGE_KEY, JSON.stringify(selection));
  } catch {
    // App switching should keep working in restricted browsers.
  }
}
