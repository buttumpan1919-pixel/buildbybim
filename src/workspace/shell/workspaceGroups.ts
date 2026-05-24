import {
  Banknote,
  Bug,
  Building2,
  ChartGantt,
  ClipboardList,
  Database,
  FileCheck2,
  FileImage,
  FileText,
  FolderOpen,
  Home,
  LineChart,
  MessageCircle,
  Settings,
  Sparkles,
  Users,
  WandSparkles,
  type LucideIcon
} from "lucide-react";

import type { WorkspaceAppId } from "../../apps";

export type WorkspaceAppGroupDefinition = {
  id: string;
  label: string;
  detail: string;
  appIds: WorkspaceAppId[];
};

export const workspaceAppIcons: Record<WorkspaceAppId, LucideIcon> = {
  hub: Home,
  projects: Building2,
  costCodes: Database,
  suppliers: Users,
  procurement: ClipboardList,
  projectControl: LineChart,
  approvals: FileCheck2,
  evidence: FileImage,
  builddocs: FileText,
  boqData: Database,
  constructionPlanner: ChartGantt,
  designStudio: Sparkles,
  library: FolderOpen,
  defectTracker: Bug,
  employees: Users,
  socialFeed: MessageCircle,
  agentChat: WandSparkles,
  debtPlanner: Banknote,
  cashflow: LineChart,
  clientOps: Users,
  admin: Settings
};

export const workspaceAppGroups: WorkspaceAppGroupDefinition[] = [
  {
    id: "project",
    label: "Project Work",
    detail: "Hub · Projects · Plan · Docs · BOQ",
    appIds: [
      "hub",
      "projects",
      "constructionPlanner",
      "evidence",
      "builddocs",
      "boqData",
      "defectTracker",
      "employees"
    ]
  },
  {
    id: "procurement",
    label: "Cost Control",
    detail: "Codes · Suppliers · PR/RFQ",
    appIds: ["costCodes", "suppliers", "procurement", "projectControl", "approvals"]
  },
  {
    id: "business",
    label: "Business",
    detail: "Cash · CRM",
    appIds: ["cashflow", "clientOps"]
  },
  {
    id: "design",
    label: "Design",
    detail: "Studio · Library",
    appIds: ["designStudio", "library"]
  },
  {
    id: "agent",
    label: "Agent",
    detail: "AI · File · API",
    appIds: ["agentChat"]
  },
  {
    id: "social",
    label: "Social",
    detail: "Feed · Network",
    appIds: ["socialFeed"]
  },
  {
    id: "platform",
    label: "Platform",
    detail: "Admin · Access",
    appIds: ["admin"]
  }
];
