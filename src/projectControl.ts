// Project Control aggregation engine — Sprint 6
// Spec: docs/PROJECT_CONTROL_PRD.md
//
// Pure read-only aggregation. Reads data from projects + costCodes +
// cashflow + procurement + planner BOQ linkage (+ BuildDocs invoice match in Phase 2). No
// persisted entities of its own except optional ProjectControlSettings.
//
// All computation is client-side for v0.1 (workspace < 10K rows).

import { defaultStorageAdapter, readJson, writeJson } from "./storageAdapter";
import {
  computeProject,
  type Project
} from "./projects";
import type { CostCode } from "./costCodes";
import type { CashflowEntry } from "./cashflow";
import {
  filterCashflowEntries,
  computeProjectRollup,
  type ProjectRollup
} from "./cashflow.rollup";
import type { PurchaseRequest, PRStatus } from "./procurement";
import type { Supplier } from "./suppliers";
import type { BoqProjectTask } from "./boqTaskLinkage";

export const PROJECT_CONTROL_SETTINGS_KEY = "project-control.settings.v1";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export type CostCodeRollup = {
  costCodeId: string;
  costCodeName: string;
  category: string;
  budget: number;
  committed: number;
  actual: number;
  remaining: number; // budget - actual
  variance: number; // budget - actual (alias for sign clarity; positive = under budget)
  variancePct: number; // (actual / budget) * 100 (0 when budget = 0)
  spentPct: number; // alias for variancePct, more obvious
  isOverBudget: boolean;
  sourceLinks?: CostCodeRollupSourceLink[];
};

export type CostCodeRollupSourceLink = {
  source: "construction_planner";
  taskId: string;
  taskName: string;
  projectId: string;
  boqItemId: string;
  boqCode: string;
  boqName: string;
  amount: number;
  costCodeId: string;
};

export type ProjectAlertSeverity = "info" | "warn" | "critical";

export type ProjectAlertType =
  | "over_budget"
  | "near_budget"
  | "overdue"
  | "pending_invoice"
  | "stale_pr"
  | "low_margin"
  | "no_recent_activity";

export type ProjectAlert = {
  id: string;
  severity: ProjectAlertSeverity;
  type: ProjectAlertType;
  message: string;
  costCodeId: string;
  actionUrl: string;
  computedAt: string;
};

export type ProjectFinancialSnapshot = {
  projectId: string;
  projectCode: string;
  projectName: string;
  generatedAt: string;
  totalBudget: number;
  totalCommitted: number;
  totalActual: number;
  totalRevenue: number;
  totalPaidRevenue: number;
  netCashflow: number;
  marginPct: number | null;
  daysRemaining: number;
  status: string;
  costCodeRollups: CostCodeRollup[];
  alerts: ProjectAlert[];
};

export type ReportType =
  | "project_pl"
  | "cashflow_forecast"
  | "cost_variance"
  | "supplier_spend"
  | "pr_aging";

export type ReportResult<TData = unknown> = {
  type: ReportType;
  projectId: string;
  generatedAt: string;
  title: string;
  data: TData;
  headers: string[];
  rows: Array<Record<string, string | number>>;
};

export type AlertThresholds = {
  nearBudgetPct: number;
  lowMarginPct: number;
  staleDaysPR: number;
  noActivityDays: number;
};

export type ProjectControlSettings = {
  workspaceId: string;
  defaultReportType: ReportType;
  alertThresholds: AlertThresholds;
  updatedAt: string;
};

export const DEFAULT_ALERT_THRESHOLDS: AlertThresholds = {
  nearBudgetPct: 85,
  lowMarginPct: 10,
  staleDaysPR: 30,
  noActivityDays: 14
};

const DEFAULT_SETTINGS: ProjectControlSettings = {
  workspaceId: "",
  defaultReportType: "project_pl",
  alertThresholds: DEFAULT_ALERT_THRESHOLDS,
  updatedAt: ""
};

export function normalizeSettings(input: unknown): ProjectControlSettings {
  if (!input || typeof input !== "object") return { ...DEFAULT_SETTINGS };
  const s = input as Partial<ProjectControlSettings>;
  return {
    workspaceId: s.workspaceId?.trim() ?? "",
    defaultReportType:
      s.defaultReportType === "cashflow_forecast" ||
      s.defaultReportType === "cost_variance" ||
      s.defaultReportType === "supplier_spend" ||
      s.defaultReportType === "pr_aging"
        ? s.defaultReportType
        : "project_pl",
    alertThresholds: {
      nearBudgetPct: Number(s.alertThresholds?.nearBudgetPct) || DEFAULT_ALERT_THRESHOLDS.nearBudgetPct,
      lowMarginPct: Number(s.alertThresholds?.lowMarginPct) || DEFAULT_ALERT_THRESHOLDS.lowMarginPct,
      staleDaysPR: Number(s.alertThresholds?.staleDaysPR) || DEFAULT_ALERT_THRESHOLDS.staleDaysPR,
      noActivityDays: Number(s.alertThresholds?.noActivityDays) || DEFAULT_ALERT_THRESHOLDS.noActivityDays
    },
    updatedAt: s.updatedAt ?? ""
  };
}

export function loadSettings(): ProjectControlSettings {
  return readJson<ProjectControlSettings>(
    defaultStorageAdapter,
    PROJECT_CONTROL_SETTINGS_KEY,
    DEFAULT_SETTINGS,
    (raw) => normalizeSettings(raw)
  );
}

export function saveSettings(settings: ProjectControlSettings): void {
  writeJson(defaultStorageAdapter, PROJECT_CONTROL_SETTINGS_KEY, normalizeSettings(settings));
}

// ----------------------------------------------------------------------------
// Core snapshot computation
// ----------------------------------------------------------------------------

const COMMITTED_PR_STATUSES: ReadonlySet<PRStatus> = new Set<PRStatus>([
  "approved",
  "rfq_sent",
  "awarded",
  "ordered",
  "received"
]);

const ACTIVE_PR_STATUSES: ReadonlySet<PRStatus> = new Set<PRStatus>([
  "draft",
  "submitted",
  "approved",
  "rfq_sent",
  "awarded",
  "ordered"
]);

export type SnapshotContext = {
  project: Project;
  costCodes: CostCode[];
  cashflowEntries: CashflowEntry[];
  purchaseRequests: PurchaseRequest[];
  boqProjectTasks?: BoqProjectTask[];
  settings?: ProjectControlSettings;
  referenceDate?: Date;
};

export function computeProjectSnapshot(
  ctx: SnapshotContext
): ProjectFinancialSnapshot {
  const { project, costCodes, cashflowEntries, purchaseRequests } = ctx;
  const boqProjectTasks = ctx.boqProjectTasks ?? [];
  const settings = ctx.settings ?? DEFAULT_SETTINGS;
  const reference = ctx.referenceDate ?? new Date();
  const generatedAt = reference.toISOString();

  // Index by both id and code because existing modules store costCodeId
  // differently: Cashflow uses CostCode.id, while PR line items use CostCode.code.
  const codeIndex = new Map<string, CostCode>();
  for (const c of costCodes) {
    codeIndex.set(c.id, c);
    codeIndex.set(c.code, c);
  }

  const getCostCodeKey = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "uncategorized";
    return codeIndex.get(trimmed)?.code ?? trimmed;
  };

  // Group confirmed cashflow expense by cost code → actual
  const actualByCode = new Map<string, number>();
  for (const entry of cashflowEntries) {
    if (entry.projectId !== project.id) continue;
    if (entry.status !== "confirmed") continue;
    if (entry.direction !== "expense") continue;
    const code = getCostCodeKey(entry.costCodeId);
    actualByCode.set(code, (actualByCode.get(code) ?? 0) + entry.amount);
  }

  // Group committed PR amounts by cost code (line items × status filter)
  const committedByCode = new Map<string, number>();
  const projectPRs = purchaseRequests.filter((pr) => pr.projectId === project.id);
  for (const pr of projectPRs) {
    if (!COMMITTED_PR_STATUSES.has(pr.status)) continue;
    for (const item of pr.items) {
      const code = getCostCodeKey(item.costCodeId);
      committedByCode.set(code, (committedByCode.get(code) ?? 0) + item.amount);
    }
  }

  const plannerBudgetByCode = new Map<string, number>();
  const plannerSourcesByCode = new Map<string, CostCodeRollupSourceLink[]>();
  const projectBoqTasks = boqProjectTasks.filter((task) => task.projectId === project.id);
  for (const task of projectBoqTasks) {
    for (const allocation of task.boqLinkage) {
      const rawCode =
        allocation.costCodeCode?.trim() ||
        allocation.costCodeId?.trim() ||
        "planner-baseline";
      const code = rawCode === "planner-baseline" ? rawCode : getCostCodeKey(rawCode);
      plannerBudgetByCode.set(code, (plannerBudgetByCode.get(code) ?? 0) + allocation.allocatedAmount);
      const sourceLinks = plannerSourcesByCode.get(code) ?? [];
      sourceLinks.push({
        source: "construction_planner",
        taskId: task.id,
        taskName: task.name,
        projectId: task.projectId,
        boqItemId: allocation.boqItemId,
        boqCode: allocation.boqKeynote || allocation.boqCode || allocation.keynote,
        boqName: allocation.boqItemName || allocation.boqName || allocation.item,
        amount: allocation.allocatedAmount,
        costCodeId: code
      });
      plannerSourcesByCode.set(code, sourceLinks);
    }
  }

  // Budget per cost code = max(committed, planned-cost-share).
  // v0.1 heuristic: distribute project.plannedCost proportionally across
  // committed codes when no per-code budget exists. Cost codes that
  // appear only in actual (not in PR) get budget = actual (no variance).
  const allCodeKeys = new Set<string>([
    ...actualByCode.keys(),
    ...committedByCode.keys(),
    ...plannerBudgetByCode.keys()
  ]);
  const committedTotal = [...committedByCode.values()].reduce((s, v) => s + v, 0);

  const costCodeRollups: CostCodeRollup[] = [];
  for (const codeKey of allCodeKeys) {
    const codeMeta = codeIndex.get(codeKey);
    const actual = actualByCode.get(codeKey) ?? 0;
    const committed = committedByCode.get(codeKey) ?? 0;
    const plannerBudget = plannerBudgetByCode.get(codeKey) ?? 0;
    // Budget rule (v0.1):
    //   - committed > 0 → budget = committed (PR is the plan)
    //   - committed === 0 + plannedCost > 0 → distribute plannedCost
    //     proportionally to "actual share" so signals stay meaningful
    //   - else → budget = 0 (no plan + no PR; show actual without alert)
    let budget = Math.max(committed, plannerBudget);
    if (committed === 0 && committedTotal === 0 && project.plannedCost > 0) {
      // No PR cut yet across all codes; treat plannedCost as a single bucket
      // and split proportionally to actual share so the over-budget signal
      // can still fire when total actual blows plannedCost.
      const totalActualSoFar = [...actualByCode.values()].reduce((s, v) => s + v, 0);
      if (totalActualSoFar > 0) {
        budget = project.plannedCost * (actual / totalActualSoFar);
      }
    }
    const remaining = budget - actual;
    const variance = budget - actual;
    const spentPct = budget > 0 ? (actual / budget) * 100 : 0;
    costCodeRollups.push({
      costCodeId: codeKey,
      costCodeName:
        codeMeta?.name ??
        (codeKey === "planner-baseline"
          ? "Construction Planner baseline"
          : codeKey === "uncategorized"
            ? "Uncategorized"
            : codeKey),
      category: codeMeta?.category ?? "custom",
      budget,
      committed,
      actual,
      remaining,
      variance,
      variancePct: spentPct,
      spentPct,
      isOverBudget: actual > budget && budget > 0,
      sourceLinks: plannerSourcesByCode.get(codeKey) ?? []
    });
  }

  const trackedBudget = costCodeRollups.reduce((sum, rollup) => sum + rollup.budget, 0);
  const unlinkedPlannerBudget = project.plannedCost - trackedBudget;
  if (plannerBudgetByCode.size > 0 && unlinkedPlannerBudget > 0.01) {
    costCodeRollups.push({
      costCodeId: "planner-unlinked",
      costCodeName: "Construction Planner unlinked budget",
      category: "custom",
      budget: unlinkedPlannerBudget,
      committed: 0,
      actual: 0,
      remaining: unlinkedPlannerBudget,
      variance: unlinkedPlannerBudget,
      variancePct: 0,
      spentPct: 0,
      isOverBudget: false
    });
  }
  costCodeRollups.sort((a, b) => b.spentPct - a.spentPct);

  // Cashflow rollup (project totals)
  const rollup: ProjectRollup = computeProjectRollup(project.id, cashflowEntries);
  const totalActual = rollup.actualCost;
  const totalRevenue = project.plannedRevenue || rollup.actualRevenue;
  const totalPaidRevenue = rollup.actualRevenue;
  const totalBudget = costCodeRollups.reduce((s, r) => s + r.budget, 0) || project.plannedCost;
  const totalCommitted = costCodeRollups.reduce((s, r) => s + r.committed, 0);
  const netCashflow = totalPaidRevenue - totalActual;
  const computed = computeProject(project, reference);
  const marginCostBasis = Math.max(project.plannedCost, totalActual);
  const marginPct =
    totalRevenue > 0 ? ((totalRevenue - marginCostBasis) / totalRevenue) * 100 : null;
  const daysRemaining = computed.daysRemaining;

  const snapshot: ProjectFinancialSnapshot = {
    projectId: project.id,
    projectCode: project.code,
    projectName: project.name,
    generatedAt,
    totalBudget,
    totalCommitted,
    totalActual,
    totalRevenue,
    totalPaidRevenue,
    netCashflow,
    marginPct,
    daysRemaining,
    status: project.status,
    costCodeRollups,
    alerts: []
  };

  snapshot.alerts = generateAlerts(snapshot, projectPRs, cashflowEntries, settings, reference);
  return snapshot;
}

// ----------------------------------------------------------------------------
// Alerts
// ----------------------------------------------------------------------------

const SEVERITY_RANK: Record<ProjectAlertSeverity, number> = {
  critical: 0,
  warn: 1,
  info: 2
};

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / (24 * 60 * 60 * 1000));
}

function parseIsoDate(iso: string): Date | null {
  if (!iso) return null;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
}

export function generateAlerts(
  snapshot: ProjectFinancialSnapshot,
  projectPRs: PurchaseRequest[],
  projectCashflow: CashflowEntry[],
  settings: ProjectControlSettings = DEFAULT_SETTINGS,
  referenceDate: Date = new Date()
): ProjectAlert[] {
  const thresholds = settings.alertThresholds ?? DEFAULT_ALERT_THRESHOLDS;
  const now = referenceDate.toISOString();
  const alerts: ProjectAlert[] = [];

  // Over-budget / near-budget per cost code
  for (const r of snapshot.costCodeRollups) {
    if (r.isOverBudget) {
      alerts.push({
        id: `over-${r.costCodeId}`,
        severity: "critical",
        type: "over_budget",
        message: `${r.costCodeId} ${r.costCodeName} ใช้เกินงบ ฿${(r.actual - r.budget).toLocaleString()} (${r.spentPct.toFixed(0)}%)`,
        costCodeId: r.costCodeId,
        actionUrl: `/cashflow?tab=overview&version=0.1`,
        computedAt: now
      });
    } else if (r.budget > 0 && r.spentPct >= thresholds.nearBudgetPct) {
      alerts.push({
        id: `near-${r.costCodeId}`,
        severity: "warn",
        type: "near_budget",
        message: `${r.costCodeId} ${r.costCodeName} ใช้ ${r.spentPct.toFixed(0)}% (เหลือ ฿${r.remaining.toLocaleString()})`,
        costCodeId: r.costCodeId,
        actionUrl: `/projects?id=${snapshot.projectId}`,
        computedAt: now
      });
    }
  }

  // Overdue project
  if (
    snapshot.daysRemaining < 0 &&
    (snapshot.status === "normal" || snapshot.status === "delayed")
  ) {
    alerts.push({
      id: `overdue-${snapshot.projectId}`,
      severity: "critical",
      type: "overdue",
      message: `โครงการเลย deadline ${Math.abs(snapshot.daysRemaining)} วัน`,
      costCodeId: "",
      actionUrl: `/projects?id=${snapshot.projectId}`,
      computedAt: now
    });
  }

  // Pending invoice (received but no paid revenue)
  if (
    snapshot.status === "received" ||
    (snapshot.totalCommitted > 0 && snapshot.totalPaidRevenue === 0)
  ) {
    if (snapshot.totalPaidRevenue === 0 && snapshot.totalCommitted > 0) {
      alerts.push({
        id: `invoice-${snapshot.projectId}`,
        severity: "warn",
        type: "pending_invoice",
        message: "ยังไม่มีรายได้รับเข้า แม้ committed cost ออกไปแล้ว — ตรวจ invoicing",
        costCodeId: "",
        actionUrl: `/docs?project=${snapshot.projectId}`,
        computedAt: now
      });
    }
  }

  // Stale PR (submitted > N days)
  for (const pr of projectPRs) {
    if (pr.status !== "submitted") continue;
    const requestDate = parseIsoDate(pr.requestDate);
    if (!requestDate) continue;
    const age = daysBetween(referenceDate, requestDate);
    if (age > thresholds.staleDaysPR) {
      alerts.push({
        id: `stale-${pr.id}`,
        severity: "warn",
        type: "stale_pr",
        message: `${pr.prNo} ค้างอนุมัติ ${age} วัน`,
        costCodeId: "",
        actionUrl: `/procurement?tab=pr-list&id=${pr.id}`,
        computedAt: now
      });
    }
  }

  // Low margin
  if (
    snapshot.marginPct !== null &&
    snapshot.marginPct < thresholds.lowMarginPct &&
    snapshot.totalRevenue > 0 &&
    (snapshot.status === "normal" || snapshot.status === "delayed")
  ) {
    alerts.push({
      id: `margin-${snapshot.projectId}`,
      severity: snapshot.marginPct < 0 ? "critical" : "warn",
      type: "low_margin",
      message: `Margin เหลือ ${snapshot.marginPct.toFixed(1)}% (ต่ำกว่า ${thresholds.lowMarginPct}%)`,
      costCodeId: "",
      actionUrl: `/projects?id=${snapshot.projectId}`,
      computedAt: now
    });
  }

  // No recent activity (project in normal status with no cashflow in last N days)
  if (snapshot.status === "normal") {
    const recentEntries = projectCashflow
      .filter((e) => e.projectId === snapshot.projectId)
      .map((e) => parseIsoDate(e.entryDate))
      .filter((d): d is Date => d !== null);
    const latest =
      recentEntries.length > 0
        ? recentEntries.reduce((a, b) => (a > b ? a : b))
        : null;
    if (
      latest === null ||
      daysBetween(referenceDate, latest) > thresholds.noActivityDays
    ) {
      alerts.push({
        id: `idle-${snapshot.projectId}`,
        severity: "info",
        type: "no_recent_activity",
        message: latest
          ? `ไม่มีกิจกรรม ${daysBetween(referenceDate, latest)} วัน`
          : `ยังไม่มี cashflow บันทึก`,
        costCodeId: "",
        actionUrl: `/cashflow?tab=overview&version=0.1`,
        computedAt: now
      });
    }
  }

  alerts.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
  return alerts;
}

// ----------------------------------------------------------------------------
// Reports — 5 standard reports
// ----------------------------------------------------------------------------

export type ReportContext = {
  projects: Project[];
  costCodes: CostCode[];
  cashflowEntries: CashflowEntry[];
  purchaseRequests: PurchaseRequest[];
  suppliers: Supplier[];
  referenceDate?: Date;
};

export type ReportGeneratorOptions = {
  forecastDays?: number;
  supplierMonths?: number;
  agingThresholdDays?: number;
};

function nowIso(date: Date = new Date()): string {
  return date.toISOString();
}

// Report 1 — Project P&L
export function generateProjectPL(projectId: string, ctx: ReportContext): ReportResult {
  const ref = ctx.referenceDate ?? new Date();
  const scopedProjects =
    projectId && projectId !== "all"
      ? ctx.projects.filter((p) => p.id === projectId)
      : ctx.projects;
  const rows = scopedProjects.map((project) => {
    const rollup = computeProjectRollup(project.id, ctx.cashflowEntries);
    const revenue = rollup.actualRevenue;
    const expense = rollup.actualCost;
    const profit = revenue - expense;
    const marginPct = revenue > 0 ? (profit / revenue) * 100 : 0;
    return {
      project_code: project.code,
      project_name: project.name,
      status: project.status,
      planned_revenue: project.plannedRevenue,
      actual_revenue: revenue,
      actual_cost: expense,
      profit,
      margin_pct: Number(marginPct.toFixed(2))
    };
  });
  return {
    type: "project_pl",
    projectId,
    generatedAt: nowIso(ref),
    title: "Project P&L",
    data: rows,
    headers: [
      "project_code",
      "project_name",
      "status",
      "planned_revenue",
      "actual_revenue",
      "actual_cost",
      "profit",
      "margin_pct"
    ],
    rows
  };
}

// Report 2 — Cashflow forecast (90 days)
export function generateCashflowForecast(
  projectId: string,
  ctx: ReportContext,
  days = 90
): ReportResult {
  const ref = ctx.referenceDate ?? new Date();
  const horizon = new Date(ref);
  horizon.setDate(horizon.getDate() + days);
  const horizonIso = horizon.toISOString().slice(0, 10);
  const refIso = ref.toISOString().slice(0, 10);
  // Pull confirmed entries dated in the future (committed inflows/outflows)
  const projectEntries = ctx.cashflowEntries.filter((e) => {
    if (projectId && projectId !== "all" && e.projectId !== projectId) return false;
    if (e.status === "void") return false;
    return e.entryDate >= refIso && e.entryDate <= horizonIso;
  });
  // Bucket by week
  const buckets = new Map<string, { income: number; expense: number }>();
  for (const e of projectEntries) {
    const week = e.entryDate.slice(0, 7); // YYYY-MM (month bucket for v0.1)
    const bucket = buckets.get(week) ?? { income: 0, expense: 0 };
    if (e.direction === "income") bucket.income += e.amount;
    else bucket.expense += e.amount;
    buckets.set(week, bucket);
  }
  const rows = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, bucket]) => ({
      period,
      forecast_income: bucket.income,
      forecast_expense: bucket.expense,
      forecast_net: bucket.income - bucket.expense
    }));
  return {
    type: "cashflow_forecast",
    projectId,
    generatedAt: nowIso(ref),
    title: `Cashflow Forecast (${days} days)`,
    data: rows,
    headers: ["period", "forecast_income", "forecast_expense", "forecast_net"],
    rows
  };
}

// Report 3 — Cost code variance
export function generateCostVariance(projectId: string, ctx: ReportContext): ReportResult {
  const ref = ctx.referenceDate ?? new Date();
  const projects =
    projectId && projectId !== "all"
      ? ctx.projects.filter((p) => p.id === projectId)
      : ctx.projects;
  const rows: Array<Record<string, string | number>> = [];
  for (const project of projects) {
    const snapshot = computeProjectSnapshot({
      project,
      costCodes: ctx.costCodes,
      cashflowEntries: ctx.cashflowEntries,
      purchaseRequests: ctx.purchaseRequests,
      referenceDate: ref
    });
    for (const rollup of snapshot.costCodeRollups) {
      rows.push({
        project_code: project.code,
        cost_code: rollup.costCodeId,
        cost_code_name: rollup.costCodeName,
        budget: rollup.budget,
        committed: rollup.committed,
        actual: rollup.actual,
        remaining: rollup.remaining,
        spent_pct: Number(rollup.spentPct.toFixed(2)),
        is_over_budget: rollup.isOverBudget ? "yes" : "no"
      });
    }
  }
  rows.sort((a, b) => (b.spent_pct as number) - (a.spent_pct as number));
  return {
    type: "cost_variance",
    projectId,
    generatedAt: nowIso(ref),
    title: "Cost Variance",
    data: rows,
    headers: [
      "project_code",
      "cost_code",
      "cost_code_name",
      "budget",
      "committed",
      "actual",
      "remaining",
      "spent_pct",
      "is_over_budget"
    ],
    rows
  };
}

// Report 4 — Supplier spend (top by spend in last N months)
export function generateSupplierSpend(
  projectId: string,
  ctx: ReportContext,
  months = 12
): ReportResult {
  const ref = ctx.referenceDate ?? new Date();
  const cutoff = new Date(ref);
  cutoff.setMonth(cutoff.getMonth() - months);
  const cutoffIso = cutoff.toISOString().slice(0, 10);
  const spendBySupplier = new Map<string, { spend: number; orderCount: number }>();
  for (const entry of ctx.cashflowEntries) {
    if (entry.status !== "confirmed") continue;
    if (entry.direction !== "expense") continue;
    if (!entry.supplierId) continue;
    if (entry.entryDate < cutoffIso) continue;
    if (projectId && projectId !== "all" && entry.projectId !== projectId) continue;
    const existing = spendBySupplier.get(entry.supplierId) ?? { spend: 0, orderCount: 0 };
    existing.spend += entry.amount;
    existing.orderCount += 1;
    spendBySupplier.set(entry.supplierId, existing);
  }
  const supplierIndex = new Map<string, Supplier>();
  for (const s of ctx.suppliers) supplierIndex.set(s.id, s);
  const rows = [...spendBySupplier.entries()]
    .map(([supplierId, agg]) => {
      const supplier = supplierIndex.get(supplierId);
      return {
        supplier_id: supplierId,
        supplier_name: supplier?.name ?? "Unknown supplier",
        supplier_short: supplier?.shortName ?? "",
        total_spend: agg.spend,
        order_count: agg.orderCount,
        rating: supplier?.rating ?? 0
      };
    })
    .sort((a, b) => b.total_spend - a.total_spend)
    .slice(0, 10);
  return {
    type: "supplier_spend",
    projectId,
    generatedAt: nowIso(ref),
    title: `Top Supplier Spend (${months} months)`,
    data: rows,
    headers: [
      "supplier_short",
      "supplier_name",
      "total_spend",
      "order_count",
      "rating"
    ],
    rows
  };
}

// Report 5 — PR aging (oldest pending)
export function generatePRAging(
  projectId: string,
  ctx: ReportContext,
  thresholdDays = 14
): ReportResult {
  const ref = ctx.referenceDate ?? new Date();
  const projectIndex = new Map(ctx.projects.map((p) => [p.id, p]));
  const candidates = ctx.purchaseRequests.filter((pr) => {
    if (projectId && projectId !== "all" && pr.projectId !== projectId) return false;
    return ACTIVE_PR_STATUSES.has(pr.status);
  });
  const rows = candidates
    .map((pr) => {
      const requestDate = parseIsoDate(pr.requestDate);
      const ageDays = requestDate ? daysBetween(ref, requestDate) : 0;
      const project = projectIndex.get(pr.projectId);
      return {
        pr_no: pr.prNo,
        project_code: project?.code ?? "—",
        status: pr.status,
        request_date: pr.requestDate,
        needed_by: pr.neededByDate,
        age_days: ageDays,
        total_amount: pr.totalAmount,
        item_count: pr.items.length
      };
    })
    .filter((row) => row.age_days >= thresholdDays)
    .sort((a, b) => b.age_days - a.age_days);
  return {
    type: "pr_aging",
    projectId,
    generatedAt: nowIso(ref),
    title: `PR Aging (>= ${thresholdDays} days)`,
    data: rows,
    headers: [
      "pr_no",
      "project_code",
      "status",
      "request_date",
      "needed_by",
      "age_days",
      "total_amount",
      "item_count"
    ],
    rows
  };
}

export function generateReport(
  type: ReportType,
  projectId: string,
  ctx: ReportContext,
  options: ReportGeneratorOptions = {}
): ReportResult {
  if (type === "cashflow_forecast") {
    return generateCashflowForecast(projectId, ctx, options.forecastDays ?? 90);
  }
  if (type === "cost_variance") {
    return generateCostVariance(projectId, ctx);
  }
  if (type === "supplier_spend") {
    return generateSupplierSpend(projectId, ctx, options.supplierMonths ?? 12);
  }
  if (type === "pr_aging") {
    return generatePRAging(projectId, ctx, options.agingThresholdDays ?? 14);
  }
  return generateProjectPL(projectId, ctx);
}

// ----------------------------------------------------------------------------
// Workspace-wide summary (Hub Dashboard tile use)
// ----------------------------------------------------------------------------

export type WorkspaceControlSummary = {
  projectsOverBudget: number;
  projectsLowMargin: number;
  stalePRs: number;
  totalActualCost: number;
  totalPaidRevenue: number;
};

export function summarizeWorkspaceControl(
  ctx: ReportContext,
  settings: ProjectControlSettings = DEFAULT_SETTINGS
): WorkspaceControlSummary {
  const ref = ctx.referenceDate ?? new Date();
  let projectsOverBudget = 0;
  let projectsLowMargin = 0;
  let totalActualCost = 0;
  let totalPaidRevenue = 0;
  for (const project of ctx.projects) {
    const snapshot = computeProjectSnapshot({
      project,
      costCodes: ctx.costCodes,
      cashflowEntries: ctx.cashflowEntries,
      purchaseRequests: ctx.purchaseRequests,
      settings,
      referenceDate: ref
    });
    if (snapshot.costCodeRollups.some((r) => r.isOverBudget)) projectsOverBudget += 1;
    if (
      snapshot.marginPct !== null &&
      snapshot.marginPct < settings.alertThresholds.lowMarginPct &&
      snapshot.totalRevenue > 0
    ) {
      projectsLowMargin += 1;
    }
    totalActualCost += snapshot.totalActual;
    totalPaidRevenue += snapshot.totalPaidRevenue;
  }
  const stalePRs = ctx.purchaseRequests.filter((pr) => {
    if (pr.status !== "submitted") return false;
    const reqDate = parseIsoDate(pr.requestDate);
    if (!reqDate) return false;
    return daysBetween(ref, reqDate) > settings.alertThresholds.staleDaysPR;
  }).length;

  return {
    projectsOverBudget,
    projectsLowMargin,
    stalePRs,
    totalActualCost,
    totalPaidRevenue
  };
}

// Suppress unused-import for filterCashflowEntries (kept for future use in
// per-period dashboards / settings-driven filters).
export { filterCashflowEntries };
