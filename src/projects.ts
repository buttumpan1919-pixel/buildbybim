// Project domain module — Sprint 0 (Builk parity)
// Spec: docs/PROJECT_PRD.md
//
// Architecture: module-isolated per PRD Section 6 — UI -> domain service ->
// storageAdapter -> localStorage/Supabase. Never touches window.localStorage
// directly.

import { defaultStorageAdapter, readJson, writeJson } from "./storageAdapter";

export const PROJECTS_STORAGE_KEY = "projects.list.v1";

export type ProjectStatus = "draft" | "normal" | "delayed" | "closed" | "cancelled";
export type CustomerType = "individual" | "gov" | "corporate";

export type Project = {
  id: string;
  workspaceId: string;
  code: string;
  name: string;
  clientId: string;
  clientName: string;
  customerType: CustomerType | null;
  contractValue: number;
  plannedCost: number;
  actualCost: number;
  plannedRevenue: number;
  actualRevenue: number;
  startDate: string; // ISO date "YYYY-MM-DD"
  endDate: string;
  status: ProjectStatus;
  hasBudget: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectListState = {
  projects: Project[];
  updatedAt: string;
};

export type ProjectComputed = Project & {
  daysRemaining: number;
  marginPct: number | null;
  budgetRemaining: number;
  isOverBudget: boolean;
  isOverdue: boolean;
};

type ProjectListInput = {
  projects?: Partial<Project>[];
  updatedAt?: string;
};

export const projectStatusCopy: Record<ProjectStatus, { th: string; en: string; tone: string }> = {
  draft: { th: "ร่าง", en: "Draft", tone: "info" },
  normal: { th: "ปกติ", en: "Normal", tone: "success" },
  delayed: { th: "ชะลอ", en: "Delayed", tone: "warning" },
  closed: { th: "สิ้นสุด", en: "Closed", tone: "neutral" },
  cancelled: { th: "ยกเลิก", en: "Cancelled", tone: "danger" }
};

export const customerTypeCopy: Record<CustomerType, { th: string; en: string; badge: string }> = {
  individual: { th: "บุคคลธรรมดา", en: "Individual", badge: "" },
  gov: { th: "หน่วยงานราชการ", en: "Government", badge: "GOV" },
  corporate: { th: "นิติบุคคล", en: "Corporate", badge: "CORP" }
};

const PROJECT_STATUSES: ReadonlySet<ProjectStatus> = new Set<ProjectStatus>([
  "draft",
  "normal",
  "delayed",
  "closed",
  "cancelled"
]);

const CUSTOMER_TYPES: ReadonlySet<CustomerType> = new Set<CustomerType>([
  "individual",
  "gov",
  "corporate"
]);

function createProjectId(index = 0): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `proj-${Date.now().toString(36)}-${index}-${Math.random().toString(16).slice(2)}`;
}

function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

function normalizeIsoDate(value: unknown, fallback = ""): string {
  if (typeof value !== "string") {
    return fallback;
  }
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : fallback;
}

function normalizeAmount(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  return value < 0 ? 0 : value;
}

function normalizeStatus(value: unknown): ProjectStatus {
  return typeof value === "string" && PROJECT_STATUSES.has(value as ProjectStatus)
    ? (value as ProjectStatus)
    : "draft";
}

function normalizeCustomerType(value: unknown): CustomerType | null {
  return typeof value === "string" && CUSTOMER_TYPES.has(value as CustomerType)
    ? (value as CustomerType)
    : null;
}

function normalizeProject(project: Partial<Project>, index = 0): Project {
  const now = new Date().toISOString();
  const plannedCost = normalizeAmount(project.plannedCost);
  const hasBudgetFlag =
    typeof project.hasBudget === "boolean" ? project.hasBudget : plannedCost > 0;

  return {
    id: project.id?.trim() || createProjectId(index),
    workspaceId: project.workspaceId?.trim() ?? "",
    code: project.code?.trim() || "",
    name: project.name?.trim() || "โครงการใหม่",
    clientId: project.clientId?.trim() ?? "",
    clientName: project.clientName?.trim() ?? "",
    customerType: normalizeCustomerType(project.customerType),
    contractValue: normalizeAmount(project.contractValue),
    plannedCost,
    actualCost: normalizeAmount(project.actualCost),
    plannedRevenue: normalizeAmount(project.plannedRevenue),
    actualRevenue: normalizeAmount(project.actualRevenue),
    startDate: normalizeIsoDate(project.startDate),
    endDate: normalizeIsoDate(project.endDate),
    status: normalizeStatus(project.status),
    hasBudget: hasBudgetFlag && plannedCost > 0,
    notes: project.notes?.trim() ?? "",
    createdAt: project.createdAt ?? now,
    updatedAt: project.updatedAt ?? now
  };
}

export function normalizeProjectListState(input: unknown): ProjectListState {
  if (Array.isArray(input)) {
    return {
      projects: input.map((entry, index) =>
        normalizeProject((entry ?? {}) as Partial<Project>, index)
      ),
      updatedAt: new Date().toISOString()
    };
  }

  if (input && typeof input === "object") {
    const state = input as ProjectListInput;
    return {
      projects: Array.isArray(state.projects)
        ? state.projects.map((entry, index) =>
            normalizeProject((entry ?? {}) as Partial<Project>, index)
          )
        : [],
      updatedAt: state.updatedAt ?? new Date().toISOString()
    };
  }

  return { projects: [], updatedAt: "" };
}

export function loadProjects(): ProjectListState {
  return readJson<ProjectListState>(
    defaultStorageAdapter,
    PROJECTS_STORAGE_KEY,
    { projects: [], updatedAt: "" },
    (raw) => normalizeProjectListState(raw)
  );
}

export function saveProjects(state: ProjectListState): void {
  writeJson(defaultStorageAdapter, PROJECTS_STORAGE_KEY, normalizeProjectListState(state));
}

export function upsertProject(
  state: ProjectListState,
  project: Partial<Project>
): ProjectListState {
  const now = new Date().toISOString();
  const normalized = normalizeProject({
    ...project,
    id: project.id ?? createProjectId(),
    updatedAt: now
  });
  const base = normalizeProjectListState(state);
  const exists = base.projects.some((item) => item.id === normalized.id);

  return normalizeProjectListState({
    projects: exists
      ? base.projects.map((item) => (item.id === normalized.id ? normalized : item))
      : [normalized, ...base.projects],
    updatedAt: now
  });
}

export function removeProject(state: ProjectListState, id: string): ProjectListState {
  const base = normalizeProjectListState(state);
  return normalizeProjectListState({
    projects: base.projects.filter((p) => p.id !== id),
    updatedAt: new Date().toISOString()
  });
}

export function createProject(input: Partial<Project> = {}): Project {
  const now = new Date().toISOString();
  return normalizeProject({
    ...input,
    id: input.id ?? createProjectId(),
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now
  });
}

/**
 * Auto-suggest next project code from existing codes.
 * Pattern: `{prefix}{YY}{seq}` — defaults to `j-`. e.g. `j-2601`.
 * Scans codes that match prefix + current year, picks max seq + 1.
 * Starts at `{prefix}{YY}01` when no codes exist for the current year.
 */
export function suggestNextProjectCode(
  projects: Pick<Project, "code">[],
  prefix = "j-",
  referenceDate: Date = new Date()
): string {
  const year = referenceDate.getFullYear() % 100;
  const yearPrefix = `${prefix}${year.toString().padStart(2, "0")}`;
  const seqs = projects
    .map((p) => p.code)
    .filter((c): c is string => typeof c === "string" && c.startsWith(yearPrefix))
    .map((c) => parseInt(c.slice(yearPrefix.length), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  const next = (seqs.length > 0 ? Math.max(...seqs) : 0) + 1;
  return `${yearPrefix}${next.toString().padStart(2, "0")}`;
}

/**
 * Compute derived fields for a project at read time. Never stored.
 * - daysRemaining: integer days from today to endDate (negative = overdue)
 * - marginPct: (plannedRevenue - actualCost) / plannedRevenue * 100 or null for internal
 * - budgetRemaining: plannedCost - actualCost
 * - isOverBudget: hasBudget && actualCost > plannedCost
 * - isOverdue: daysRemaining < 0 && status in (normal|delayed)
 */
export function computeProject(
  project: Project,
  referenceDate: Date = new Date()
): ProjectComputed {
  const endMs = project.endDate ? Date.parse(`${project.endDate}T00:00:00`) : NaN;
  const todayMs = referenceDate.getTime();
  const daysRemaining = Number.isFinite(endMs)
    ? Math.floor((endMs - todayMs) / (24 * 60 * 60 * 1000))
    : 0;
  const marginPct =
    project.plannedRevenue > 0
      ? ((project.plannedRevenue - project.actualCost) / project.plannedRevenue) * 100
      : null;
  const budgetRemaining = project.plannedCost - project.actualCost;
  const isOverBudget = project.hasBudget && project.actualCost > project.plannedCost;
  const isOverdue =
    Number.isFinite(endMs) &&
    daysRemaining < 0 &&
    (project.status === "normal" || project.status === "delayed");

  return {
    ...project,
    daysRemaining,
    marginPct,
    budgetRemaining,
    isOverBudget,
    isOverdue
  };
}

/**
 * Auto status transition rules (Section 4.2):
 *   - `normal` → `delayed` if computed isOverdue OR actualCost > plannedCost * 1.05
 *   - Never auto-transitions to `closed` or `cancelled` (manual only).
 *   - `draft` and `delayed` are left untouched here.
 *
 * Returns the project unchanged when no transition is warranted.
 */
export function applyAutoStatus(
  project: Project,
  referenceDate: Date = new Date()
): Project {
  if (project.status !== "normal") {
    return project;
  }
  const computed = computeProject(project, referenceDate);
  const overBudget = project.hasBudget && project.actualCost > project.plannedCost * 1.05;
  if (computed.isOverdue || overBudget) {
    return { ...project, status: "delayed", updatedAt: new Date().toISOString() };
  }
  return project;
}

export type ProjectListSummary = {
  total: number;
  draft: number;
  normal: number;
  delayed: number;
  closed: number;
  cancelled: number;
  overdueActive: number;
  overBudgetActive: number;
  totalContractValue: number;
  totalPlannedCost: number;
  totalActualCost: number;
  totalActualRevenue: number;
};

export function summarizeProjectList(
  state: ProjectListState,
  referenceDate: Date = new Date()
): ProjectListSummary {
  const base = normalizeProjectListState(state);
  const summary: ProjectListSummary = {
    total: base.projects.length,
    draft: 0,
    normal: 0,
    delayed: 0,
    closed: 0,
    cancelled: 0,
    overdueActive: 0,
    overBudgetActive: 0,
    totalContractValue: 0,
    totalPlannedCost: 0,
    totalActualCost: 0,
    totalActualRevenue: 0
  };

  for (const project of base.projects) {
    summary[project.status] += 1;
    summary.totalContractValue += project.contractValue;
    summary.totalPlannedCost += project.plannedCost;
    summary.totalActualCost += project.actualCost;
    summary.totalActualRevenue += project.actualRevenue;
    const computed = computeProject(project, referenceDate);
    if (computed.isOverdue) summary.overdueActive += 1;
    if (computed.isOverBudget && (project.status === "normal" || project.status === "delayed")) {
      summary.overBudgetActive += 1;
    }
  }

  return summary;
}

/**
 * Heuristic to auto-detect customer type from a client name.
 * - "องค์การ...", "เทศบาล...", "อบต...", "อบจ..." → gov
 * - "บจก...", "บริษัท...", "หจก...", "ห้างหุ้นส่วน...", "Co.,", "Ltd" → corporate
 * - else → individual
 */
export function detectCustomerType(clientName: string): CustomerType {
  const name = clientName.trim();
  if (!name) return "individual";
  if (/^(องค์การ|เทศบาล|อบต|อบจ|กรม|สำนักงาน(?:เขต|จังหวัด)|กระทรวง)/.test(name)) {
    return "gov";
  }
  if (
    /^(บจก|บริษัท|หจก|ห้างหุ้นส่วน)/.test(name) ||
    /\b(Co\.?|Ltd\.?|Inc\.?|Corp\.?|LLC)\b/i.test(name)
  ) {
    return "corporate";
  }
  return "individual";
}

// ----------------------------------------------------------------------------
// Seed data — 6 sample projects matching MockupGallery for first-run UX.
// Dates are anchored to a reference (2026-05-24, current dev date) so the seed
// shows realistic overdue/active spread regardless of actual today's date.
// ----------------------------------------------------------------------------

export function createSeedProjects(workspaceId = "local-workspace"): Project[] {
  const now = new Date().toISOString();
  const seedProjects: Partial<Project>[] = [
    {
      id: "seed-j-2600",
      workspaceId,
      code: "j-2600",
      name: "งานบ้านเดี่ยวชั้นเดียวคุณสุขฤดี",
      clientId: "",
      clientName: "คุณสุขฤดี ถิ่นวังสะพุง",
      customerType: "individual",
      contractValue: 2_850_000,
      plannedCost: 2_100_000,
      actualCost: 1_580_000,
      plannedRevenue: 2_850_000,
      actualRevenue: 1_900_000,
      startDate: "2026-01-15",
      endDate: "2026-08-30",
      status: "normal",
      hasBudget: true,
      notes: "",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "seed-j-2599",
      workspaceId,
      code: "j-2599",
      name: "อาคารพาณิชย์ 3 ชั้น เทพารักษ์",
      clientId: "",
      clientName: "บจก. ธ.ธ.ธ. พัฒนาที่ดิน",
      customerType: "corporate",
      contractValue: 8_500_000,
      plannedCost: 6_400_000,
      actualCost: 6_580_000,
      plannedRevenue: 8_500_000,
      actualRevenue: 7_650_000,
      startDate: "2025-08-01",
      endDate: "2026-04-30",
      status: "delayed",
      hasBudget: true,
      notes: "",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "seed-j-2598",
      workspaceId,
      code: "j-2598",
      name: "งานปรับปรุง อบต. อุ่มเม่า",
      clientId: "",
      clientName: "องค์การบริหารส่วนตำบลอุ่มเม่า",
      customerType: "gov",
      contractValue: 1_200_000,
      plannedCost: 950_000,
      actualCost: 920_000,
      plannedRevenue: 1_200_000,
      actualRevenue: 1_200_000,
      startDate: "2025-11-10",
      endDate: "2026-03-15",
      status: "closed",
      hasBudget: true,
      notes: "",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "seed-j-2597",
      workspaceId,
      code: "j-2597",
      name: "งานเพิ่มเติม j-2300 — งานสวน",
      clientId: "",
      clientName: "คุณธีรภัทร์ วราพัฒน์",
      customerType: "individual",
      contractValue: 380_000,
      plannedCost: 0,
      actualCost: 125_000,
      plannedRevenue: 380_000,
      actualRevenue: 200_000,
      startDate: "2026-03-01",
      endDate: "2026-05-31",
      status: "normal",
      hasBudget: false,
      notes: "",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "seed-j-2596",
      workspaceId,
      code: "j-2596",
      name: "สำนักงานใหญ่ 2025 — internal",
      clientId: "",
      clientName: "",
      customerType: null,
      contractValue: 0,
      plannedCost: 450_000,
      actualCost: 380_000,
      plannedRevenue: 0,
      actualRevenue: 0,
      startDate: "2025-01-15",
      endDate: "2025-12-31",
      status: "normal",
      hasBudget: true,
      notes: "internal — no customer",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "seed-j-2595",
      workspaceId,
      code: "j-2595",
      name: "บ้าน 2 ชั้น คุณวรรณา (ยกเลิก)",
      clientId: "",
      clientName: "คุณวรรณา ศรีอนันต์",
      customerType: "individual",
      contractValue: 4_200_000,
      plannedCost: 3_100_000,
      actualCost: 280_000,
      plannedRevenue: 4_200_000,
      actualRevenue: 0,
      startDate: "2026-02-01",
      endDate: "2026-12-30",
      status: "cancelled",
      hasBudget: true,
      notes: "",
      createdAt: now,
      updatedAt: now
    }
  ];

  return seedProjects.map((project, index) => normalizeProject(project, index));
}

/**
 * Seed projects on first load if storage is empty. Idempotent: returns the
 * existing list when projects already exist.
 */
export function ensureSeedProjects(workspaceId?: string): ProjectListState {
  const state = loadProjects();
  if (state.projects.length > 0) {
    return state;
  }
  const seeded: ProjectListState = {
    projects: createSeedProjects(workspaceId),
    updatedAt: new Date().toISOString()
  };
  saveProjects(seeded);
  return seeded;
}
