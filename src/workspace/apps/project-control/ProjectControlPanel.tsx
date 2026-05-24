import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  ClipboardList,
  Download,
  ExternalLink,
  FileCheck2,
  Home,
  LineChart,
  Printer,
  RefreshCw,
  Settings
} from "lucide-react";
import type { WorkspaceAppId } from "../../../apps";
import { ensureSeedCostCodes } from "../../../costCodes";
import { loadCashflowState } from "../../../cashflow";
import { loadPRs } from "../../../procurement";
import {
  ensureSeedProjects,
  projectStatusCopy,
  type Project
} from "../../../projects";
import { loadSuppliers } from "../../../suppliers";
import { loadBoqTaskLinkageState } from "../../../boqTaskLinkage";
import { rowsToCsv } from "../../../csvExport";
import {
  filterProjectScopedRecordsByAccess,
  hasActiveProjectAccessGrants,
  loadProjectAccessState
} from "../../../projectAccess";
import {
  DEFAULT_ALERT_THRESHOLDS,
  computeProjectSnapshot,
  generateReport,
  loadSettings,
  normalizeSettings,
  saveSettings,
  type ProjectControlSettings,
  type ProjectFinancialSnapshot,
  type CostCodeRollupSourceLink,
  type ReportContext,
  type ReportResult,
  type ReportType
} from "../../../projectControl";
import { PageHeader } from "../../shared/PageHeader";
import { ProjectAccessNotice } from "../../shared/ProjectAccessNotice";
import { SummaryTile } from "../../shared/SummaryTile";

type WorkspaceLanguage = "th" | "en";

type ProjectControlPanelProps = {
  activeTab: string;
  language: WorkspaceLanguage;
  onSelectApp: (id: WorkspaceAppId) => void;
  onSelectAppTab: (appId: WorkspaceAppId, tabKey: string) => void;
};

const money = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0
});

const reportTypes: ReportType[] = [
  "project_pl",
  "cashflow_forecast",
  "cost_variance",
  "supplier_spend",
  "pr_aging"
];

const copy = {
  th: {
    heroTitle: "Project Control",
    heroDetail:
      "ภาพรวมงบประมาณ committed actual cost และรายงานหลักของทุกโครงการใน workspace",
    backToHub: "กลับ Hub",
    openCashflow: "เปิด Cashflow",
    dashboardTitle: "ภาพรวมโครงการ",
    dashboardDetail: "Budget vs committed vs actual แยกตาม Cost Code พร้อม alert",
    projectLabel: "Project",
    noProject: "ยังไม่มี project ให้เลือก",
    generate: "Generate snapshot",
    exportCsv: "Export CSV",
    print: "Print",
    budget: "Budget",
    committed: "Committed",
    actual: "Actual",
    remaining: "Remaining",
    revenue: "Paid revenue",
    net: "Net cashflow",
    margin: "Margin",
    daysLeft: "Schedule",
    alertsTitle: "Alerts",
    alertsDetail: "เรียงตามความรุนแรงจาก critical ไป info",
    noAlerts: "ยังไม่มี alert จากข้อมูลปัจจุบัน",
    breakdownTitle: "Cost Breakdown",
    breakdownDetail: "เรียงจาก % ใช้งบสูงสุด",
    noBreakdown: "ยังไม่มี PR หรือ cashflow ที่ผูก cost code กับ project นี้",
    sourceLinks: "ต้นทาง BOQ",
    sourceLinksDetail: "รายการจาก Construction Planner ที่ใช้เป็น baseline",
    openBoqSource: "เปิด BOQ ต้นทาง",
    reviewBoqSource: "ตรวจ BOQ linkage",
    unlinkedPlannerBudget: "งบจากแผนที่ยังไม่มี BOQ linkage รายการย่อย",
    reportsTitle: "Reports",
    reportsDetail: "5 report หลักสำหรับ MVP ERP",
    allProjects: "All projects",
    resultTitle: "Report result",
    noRows: "ยังไม่มี row จาก report นี้",
    settingsTitle: "Settings",
    settingsDetail: "ตั้ง threshold สำหรับ alert ของ Project Control",
    nearBudget: "Near budget %",
    lowMargin: "Low margin %",
    stalePr: "Stale PR days",
    noActivity: "No activity days",
    defaultReport: "Default report",
    saveSettings: "Save settings",
    resetDefaults: "Reset defaults",
    saved: "Saved",
    aiTitle: "AI Insights (Phase 2)",
    aiDetail:
      "ต่อยอดจาก snapshot นี้ให้ถามได้ว่า cost code ไหนเสี่ยง ทำไม margin ต่ำ หรือ PR ไหนควรเร่ง",
    openProcurement: "เปิด Procurement",
    status: "Status",
    projectAccessActive: "Project Access เปิดใช้งาน",
    projectAccessVisibleProjects: "โครงการที่เห็นได้ใน Project Control"
  },
  en: {
    heroTitle: "Project Control",
    heroDetail:
      "Project budget, committed cost, actual cost, and standard workspace reports.",
    backToHub: "Back to Hub",
    openCashflow: "Open Cashflow",
    dashboardTitle: "Project Dashboard",
    dashboardDetail: "Budget vs committed vs actual by cost code with alerts.",
    projectLabel: "Project",
    noProject: "No project available",
    generate: "Generate snapshot",
    exportCsv: "Export CSV",
    print: "Print",
    budget: "Budget",
    committed: "Committed",
    actual: "Actual",
    remaining: "Remaining",
    revenue: "Paid revenue",
    net: "Net cashflow",
    margin: "Margin",
    daysLeft: "Schedule",
    alertsTitle: "Alerts",
    alertsDetail: "Sorted by severity from critical to info.",
    noAlerts: "No active alert from current data.",
    breakdownTitle: "Cost Breakdown",
    breakdownDetail: "Sorted by highest spend percentage.",
    noBreakdown: "No PR or cashflow line is linked to this project's cost codes yet.",
    sourceLinks: "BOQ sources",
    sourceLinksDetail: "Construction Planner rows used as this baseline.",
    openBoqSource: "Open BOQ source",
    reviewBoqSource: "Review BOQ linkage",
    unlinkedPlannerBudget: "Planner budget not linked to detailed BOQ rows yet.",
    reportsTitle: "Reports",
    reportsDetail: "5 standard reports for the ERP MVP.",
    allProjects: "All projects",
    resultTitle: "Report result",
    noRows: "This report has no rows yet.",
    settingsTitle: "Settings",
    settingsDetail: "Configure Project Control alert thresholds.",
    nearBudget: "Near budget %",
    lowMargin: "Low margin %",
    stalePr: "Stale PR days",
    noActivity: "No activity days",
    defaultReport: "Default report",
    saveSettings: "Save settings",
    resetDefaults: "Reset defaults",
    saved: "Saved",
    aiTitle: "AI Insights (Phase 2)",
    aiDetail:
      "Use this snapshot later to ask which cost code is risky, why margin is low, or which PR needs action.",
    openProcurement: "Open Procurement",
    status: "Status",
    projectAccessActive: "Project Access active",
    projectAccessVisibleProjects: "projects visible in Project Control"
  }
} satisfies Record<WorkspaceLanguage, Record<string, string>>;

const reportCopy: Record<ReportType, { th: { title: string; detail: string }; en: { title: string; detail: string } }> = {
  project_pl: {
    th: { title: "Project P&L", detail: "รายรับ รายจ่าย กำไร และ margin แยกตามโครงการ" },
    en: { title: "Project P&L", detail: "Revenue, cost, profit, and margin by project." }
  },
  cashflow_forecast: {
    th: { title: "Cashflow Forecast", detail: "เงินเข้าออกใน 90 วันจากรายการที่ลงวันที่อนาคต" },
    en: { title: "Cashflow Forecast", detail: "90-day inflow and outflow forecast." }
  },
  cost_variance: {
    th: { title: "Cost Variance", detail: "Budget, committed, actual และ % spent ต่อ cost code" },
    en: { title: "Cost Variance", detail: "Budget, committed, actual, and spent % by cost code." }
  },
  supplier_spend: {
    th: { title: "Supplier Spend", detail: "Top supplier spend จาก cashflow 12 เดือนล่าสุด" },
    en: { title: "Supplier Spend", detail: "Top supplier spend from the last 12 months." }
  },
  pr_aging: {
    th: { title: "PR Aging", detail: "PR ที่ค้างนานและควรเร่งตามสถานะ" },
    en: { title: "PR Aging", detail: "Old pending PRs that need follow-up." }
  }
};

function downloadTextFile(filename: string, content: string, type = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function formatPercent(value: number | null) {
  return value === null ? "-" : `${value.toFixed(1)}%`;
}

function formatScheduleValue(
  daysRemaining: number,
  status: string,
  statusLabel: string,
  language: WorkspaceLanguage
) {
  if (status === "draft" || status === "closed" || status === "cancelled") {
    return statusLabel;
  }

  if (daysRemaining < 0) {
    const days = Math.abs(daysRemaining);
    return language === "th" ? `เกิน ${days} วัน` : `${days}d overdue`;
  }

  return language === "th" ? `${daysRemaining} วัน` : `${daysRemaining}d`;
}

function getInitialProjectId(projects: Project[]) {
  if (typeof window !== "undefined") {
    const requested = new URLSearchParams(window.location.search).get("projectId");
    if (requested && projects.some((project) => project.id === requested)) {
      return requested;
    }
  }

  return projects[0]?.id ?? "";
}

function updateProjectQuery(projectId: string) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (projectId) {
    url.searchParams.set("projectId", projectId);
  } else {
    url.searchParams.delete("projectId");
  }
  window.history.replaceState({}, "", `${url.pathname}?${url.searchParams.toString()}`);
}

function buildBoqTaskLinkageRoute(
  projectId: string,
  costCodeId: string,
  source?: CostCodeRollupSourceLink
) {
  const params = new URLSearchParams({
    tab: "task-linkage",
    version: "0.1"
  });

  if (projectId) params.set("projectId", projectId);
  if (source?.taskId) params.set("taskId", source.taskId);
  if (source?.boqItemId) params.set("boqItemId", source.boqItemId);
  if (costCodeId && !costCodeId.startsWith("planner-")) params.set("costCode", costCodeId);

  return `/boq-data?${params.toString()}`;
}

function navigateWorkspaceRoute(route: string) {
  if (typeof window === "undefined") return;
  window.history.pushState({ route }, "", route);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function ProjectControlPanel({
  activeTab,
  language,
  onSelectApp,
  onSelectAppTab
}: ProjectControlPanelProps) {
  const c = copy[language];
  const projectState = useMemo(() => ensureSeedProjects(), []);
  const costCodeState = useMemo(() => ensureSeedCostCodes(), []);
  const cashflowState = useMemo(() => loadCashflowState(), []);
  const prState = useMemo(() => loadPRs(), []);
  const supplierState = useMemo(() => loadSuppliers(), []);
  const boqTaskLinkageState = useMemo(() => loadBoqTaskLinkageState(), []);
  const projectAccessState = loadProjectAccessState();
  const hasProjectAccessConfig = hasActiveProjectAccessGrants(projectAccessState);
  const accessibleProjects = useMemo(
    () =>
      filterProjectScopedRecordsByAccess(
        projectState.projects,
        projectAccessState,
        "report.read",
        (project) => project.id,
        { includeUnscoped: false }
      ),
    [projectAccessState, projectState.projects]
  );
  const accessibleProjectIds = useMemo(
    () => new Set(accessibleProjects.map((project) => project.id)),
    [accessibleProjects]
  );
  const scopedCashflowEntries = useMemo(
    () =>
      hasProjectAccessConfig
        ? cashflowState.entries.filter(
            (entry) => !entry.projectId || accessibleProjectIds.has(entry.projectId)
          )
        : cashflowState.entries,
    [accessibleProjectIds, cashflowState.entries, hasProjectAccessConfig]
  );
  const scopedPurchaseRequests = useMemo(
    () =>
      hasProjectAccessConfig
        ? prState.prs.filter((pr) => accessibleProjectIds.has(pr.projectId))
        : prState.prs,
    [accessibleProjectIds, hasProjectAccessConfig, prState.prs]
  );
  const scopedBoqProjectTasks = useMemo(
    () =>
      hasProjectAccessConfig
        ? boqTaskLinkageState.tasks.filter((task) => accessibleProjectIds.has(task.projectId))
        : boqTaskLinkageState.tasks,
    [accessibleProjectIds, boqTaskLinkageState.tasks, hasProjectAccessConfig]
  );
  const reportContext: ReportContext = useMemo(
    () => ({
      projects: accessibleProjects,
      costCodes: costCodeState.codes,
      cashflowEntries: scopedCashflowEntries,
      purchaseRequests: scopedPurchaseRequests,
      suppliers: supplierState.suppliers
    }),
    [
      accessibleProjects,
      costCodeState.codes,
      scopedCashflowEntries,
      scopedPurchaseRequests,
      supplierState.suppliers
    ]
  );

  const [selectedProjectId, setSelectedProjectId] = useState(() =>
    getInitialProjectId(accessibleProjects)
  );
  const [settings, setSettings] = useState<ProjectControlSettings>(() => loadSettings());
  const [settingsStatus, setSettingsStatus] = useState("");
  const [reportType, setReportType] = useState<ReportType>(settings.defaultReportType);
  const [reportProjectId, setReportProjectId] = useState<string>("all");
  const [reportResult, setReportResult] = useState<ReportResult>(() =>
    generateReport(settings.defaultReportType, "all", reportContext)
  );

  const selectedProject =
    accessibleProjects.find((project) => project.id === selectedProjectId) ??
    accessibleProjects[0] ??
    null;

  const snapshot = useMemo<ProjectFinancialSnapshot | null>(() => {
    if (!selectedProject) return null;
    return computeProjectSnapshot({
      project: selectedProject,
      costCodes: costCodeState.codes,
      cashflowEntries: scopedCashflowEntries,
      purchaseRequests: scopedPurchaseRequests,
      boqProjectTasks: scopedBoqProjectTasks,
      settings
    });
  }, [
    costCodeState.codes,
    scopedBoqProjectTasks,
    scopedCashflowEntries,
    scopedPurchaseRequests,
    selectedProject,
    settings
  ]);

  const activeSection =
    activeTab === "reports" || activeTab === "settings" ? activeTab : "dashboard";

  const setProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    updateProjectQuery(projectId);
  };

  const runReport = (type = reportType) => {
    const result = generateReport(type, reportProjectId, reportContext, {
      agingThresholdDays: settings.alertThresholds.staleDaysPR
    });
    setReportType(type);
    setReportResult(result);
  };

  const exportReportCsv = () => {
    const csv = rowsToCsv(reportResult.headers, reportResult.rows);
    downloadTextFile(`${reportResult.type}-${reportResult.generatedAt.slice(0, 10)}.csv`, csv);
  };

  const exportSnapshotCsv = () => {
    if (!snapshot) return;
    const rows = snapshot.costCodeRollups.map((row) => ({
      cost_code: row.costCodeId,
      name: row.costCodeName,
      budget: row.budget,
      committed: row.committed,
      actual: row.actual,
      remaining: row.remaining,
      spent_pct: Number(row.spentPct.toFixed(2)),
      over_budget: row.isOverBudget ? "yes" : "no"
    }));
    downloadTextFile(
      `project-control-${snapshot.projectCode || snapshot.projectId}.csv`,
      rowsToCsv(
        ["cost_code", "name", "budget", "committed", "actual", "remaining", "spent_pct", "over_budget"],
        rows
      )
    );
  };

  const openBoqTaskLinkage = (costCodeId: string, source?: CostCodeRollupSourceLink) => {
    if (!snapshot) return;
    navigateWorkspaceRoute(buildBoqTaskLinkageRoute(snapshot.projectId, costCodeId, source));
  };

  const saveCurrentSettings = () => {
    const next = normalizeSettings({
      ...settings,
      updatedAt: new Date().toISOString()
    });
    setSettings(next);
    saveSettings(next);
    setSettingsStatus(c.saved);
  };

  const resetSettings = () => {
    const next = normalizeSettings({
      workspaceId: settings.workspaceId,
      defaultReportType: "project_pl",
      alertThresholds: DEFAULT_ALERT_THRESHOLDS,
      updatedAt: new Date().toISOString()
    });
    setSettings(next);
    saveSettings(next);
    setReportType(next.defaultReportType);
    setSettingsStatus(c.saved);
  };

  return (
    <section className="workspace-hub project-control-app" aria-label={c.heroTitle}>
      <div className="module-hero project-control-hero">
        <div>
          <h1>{c.heroTitle}</h1>
          <p>{c.heroDetail}</p>
        </div>
        <div className="module-actions">
          <button className="secondary-button" type="button" onClick={() => onSelectApp("hub")}>
            <Home size={18} /> {c.backToHub}
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={() => onSelectAppTab("cashflow", "overview")}
          >
            <Banknote size={18} /> {c.openCashflow}
          </button>
        </div>
      </div>

      {hasProjectAccessConfig && (
        <ProjectAccessNotice>
          {c.projectAccessActive}: {accessibleProjects.length} / {projectState.projects.length}{" "}
          {c.projectAccessVisibleProjects}
        </ProjectAccessNotice>
      )}

      {activeSection === "reports" ? (
        <ReportsView
          context={reportContext}
          language={language}
          projectId={reportProjectId}
          reportResult={reportResult}
          reportType={reportType}
          onExport={exportReportCsv}
          onPrint={() => window.print()}
          onProjectChange={setReportProjectId}
          onRun={runReport}
          onTypeChange={setReportType}
        />
      ) : activeSection === "settings" ? (
        <SettingsView
          language={language}
          settings={settings}
          status={settingsStatus}
          onChange={setSettings}
          onReset={resetSettings}
          onSave={saveCurrentSettings}
        />
      ) : (
        <DashboardView
          language={language}
          projects={accessibleProjects}
          selectedProjectId={selectedProject?.id ?? ""}
          snapshot={snapshot}
          onExport={exportSnapshotCsv}
          onOpenCashflow={() => onSelectAppTab("cashflow", "overview")}
          onOpenBoqSource={openBoqTaskLinkage}
          onOpenProcurement={() => onSelectApp("procurement")}
          onPrint={() => window.print()}
          onProjectChange={setProject}
        />
      )}
    </section>
  );
}

function DashboardView({
  language,
  projects,
  selectedProjectId,
  snapshot,
  onExport,
  onOpenCashflow,
  onOpenBoqSource,
  onOpenProcurement,
  onPrint,
  onProjectChange
}: {
  language: WorkspaceLanguage;
  projects: Project[];
  selectedProjectId: string;
  snapshot: ProjectFinancialSnapshot | null;
  onExport: () => void;
  onOpenCashflow: () => void;
  onOpenBoqSource: (costCodeId: string, source?: CostCodeRollupSourceLink) => void;
  onOpenProcurement: () => void;
  onPrint: () => void;
  onProjectChange: (id: string) => void;
}) {
  const c = copy[language];
  const statusLabel =
    snapshot && (projectStatusCopy as Record<string, { th: string; en: string }>)[snapshot.status]
      ? (projectStatusCopy as Record<string, { th: string; en: string }>)[snapshot.status][language]
      : snapshot?.status ?? "-";
  const scheduleValue = snapshot
    ? formatScheduleValue(snapshot.daysRemaining, snapshot.status, statusLabel, language)
    : "-";

  return (
    <>
      <div className="module-board project-control-toolbar">
        <PageHeader title={c.dashboardTitle} detail={c.dashboardDetail} />
        <div className="project-control-toolbar-actions">
          <label className="project-control-field">
            <span>{c.projectLabel}</span>
            <select value={selectedProjectId} onChange={(event) => onProjectChange(event.target.value)}>
              {projects.length === 0 ? (
                <option value="">{c.noProject}</option>
              ) : (
                projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.code ? `${project.code} - ${project.name}` : project.name}
                  </option>
                ))
              )}
            </select>
          </label>
          <button className="secondary-button" type="button" onClick={onPrint}>
            <Printer size={16} /> {c.print}
          </button>
          <button className="primary-button" type="button" onClick={onExport} disabled={!snapshot}>
            <Download size={16} /> {c.exportCsv}
          </button>
        </div>
      </div>

      {snapshot ? (
        <>
          <div className="summary-grid hub-summary-grid hub-summary-grid--wide">
            <SummaryTile label={c.budget} value={money.format(snapshot.totalBudget)} strong />
            <SummaryTile label={c.committed} value={money.format(snapshot.totalCommitted)} />
            <SummaryTile label={c.actual} value={money.format(snapshot.totalActual)} />
            <SummaryTile label={c.remaining} value={money.format(snapshot.totalBudget - snapshot.totalActual)} />
            <SummaryTile label={c.revenue} value={money.format(snapshot.totalPaidRevenue)} />
            <SummaryTile label={c.net} value={money.format(snapshot.netCashflow)} />
            <SummaryTile label={c.margin} value={formatPercent(snapshot.marginPct)} />
            <SummaryTile label={c.daysLeft} value={scheduleValue} />
          </div>

          <div className="project-control-grid">
            <div className="module-board project-control-alerts">
              <PageHeader title={c.alertsTitle} detail={c.alertsDetail} />
              {snapshot.alerts.length === 0 ? (
                <div className="hub-action-empty">
                  <FileCheck2 size={18} />
                  <strong>{c.noAlerts}</strong>
                  <span>{c.status}: {statusLabel}</span>
                </div>
              ) : (
                <div className="project-control-alert-list">
                  {snapshot.alerts.map((alert) => (
                    <a
                      className={`project-control-alert project-control-alert--${alert.severity}`}
                      href={alert.actionUrl}
                      key={alert.id}
                    >
                      <AlertTriangle size={17} />
                      <span>{alert.message}</span>
                      <small>{alert.type}</small>
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="module-board project-control-ai">
              <div>
                <LineChart size={22} />
                <strong>{c.aiTitle}</strong>
              </div>
              <p>{c.aiDetail}</p>
              <div className="project-control-ai-actions">
                <button className="secondary-button" type="button" onClick={onOpenProcurement}>
                  <ClipboardList size={16} /> {c.openProcurement}
                </button>
                <button className="secondary-button" type="button" onClick={onOpenCashflow}>
                  <Banknote size={16} /> {c.openCashflow}
                </button>
              </div>
            </div>
          </div>

          <div className="module-board project-control-breakdown">
            <PageHeader title={c.breakdownTitle} detail={c.breakdownDetail} />
            {snapshot.costCodeRollups.length === 0 ? (
              <div className="hub-action-empty">
                <LineChart size={18} />
                <strong>{c.noBreakdown}</strong>
                <span>{snapshot.projectCode || snapshot.projectName}</span>
              </div>
            ) : (
              <div className="project-control-cost-list">
                {snapshot.costCodeRollups.map((rollup) => {
                  const pct = Math.min(140, Math.max(0, rollup.spentPct));
                  const sourceLinks = rollup.sourceLinks ?? [];
                  const sourceTaskCount = new Set(sourceLinks.map((source) => source.taskId)).size;
                  return (
                    <div
                      className={rollup.isOverBudget ? "project-control-cost over" : "project-control-cost"}
                      key={rollup.costCodeId}
                    >
                      <div className="project-control-cost-main">
                        <strong>{rollup.costCodeId} · {rollup.costCodeName}</strong>
                        <span>
                          {money.format(rollup.actual)} / {money.format(rollup.budget)}
                        </span>
                      </div>
                      <div className="project-control-cost-track" aria-hidden="true">
                        <i style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                      <div className="project-control-cost-meta">
                        <span>{rollup.spentPct.toFixed(0)}%</span>
                        <span>{c.committed}: {money.format(rollup.committed)}</span>
                        <span>{c.remaining}: {money.format(rollup.remaining)}</span>
                      </div>
                      {(sourceLinks.length > 0 || rollup.costCodeId === "planner-unlinked") && (
                        <div className="project-control-cost-sources">
                          <div>
                            <small>{c.sourceLinks}</small>
                            <strong>
                              {sourceLinks.length > 0
                                ? `${sourceTaskCount} tasks · ${sourceLinks.length} BOQ rows`
                                : c.unlinkedPlannerBudget}
                            </strong>
                            {sourceLinks.length > 0 && <span>{c.sourceLinksDetail}</span>}
                          </div>
                          <div className="project-control-source-actions">
                            {sourceLinks.slice(0, 3).map((source) => (
                              <button
                                className="secondary-button"
                                key={`${source.taskId}-${source.boqItemId}`}
                                onClick={() => onOpenBoqSource(rollup.costCodeId, source)}
                                type="button"
                              >
                                <ExternalLink size={15} />
                                {source.boqCode} · {money.format(source.amount)}
                              </button>
                            ))}
                            <button
                              className="secondary-button"
                              onClick={() => onOpenBoqSource(rollup.costCodeId, sourceLinks[0])}
                              type="button"
                            >
                              <ClipboardList size={15} />
                              {sourceLinks.length > 0 ? c.openBoqSource : c.reviewBoqSource}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="hub-action-empty">
          <LineChart size={18} />
          <strong>{c.noProject}</strong>
          <span>-</span>
        </div>
      )}
    </>
  );
}

function ReportsView({
  context,
  language,
  projectId,
  reportResult,
  reportType,
  onExport,
  onPrint,
  onProjectChange,
  onRun,
  onTypeChange
}: {
  context: ReportContext;
  language: WorkspaceLanguage;
  projectId: string;
  reportResult: ReportResult;
  reportType: ReportType;
  onExport: () => void;
  onPrint: () => void;
  onProjectChange: (id: string) => void;
  onRun: (type?: ReportType) => void;
  onTypeChange: (type: ReportType) => void;
}) {
  const c = copy[language];

  return (
    <>
      <div className="module-board project-control-toolbar">
        <PageHeader title={c.reportsTitle} detail={c.reportsDetail} />
        <div className="project-control-toolbar-actions">
          <label className="project-control-field">
            <span>{c.projectLabel}</span>
            <select value={projectId} onChange={(event) => onProjectChange(event.target.value)}>
              <option value="all">{c.allProjects}</option>
              {context.projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.code ? `${project.code} - ${project.name}` : project.name}
                </option>
              ))}
            </select>
          </label>
          <button className="secondary-button" type="button" onClick={onPrint} disabled={context.projects.length === 0}>
            <Printer size={16} /> {c.print}
          </button>
          <button className="primary-button" type="button" onClick={onExport} disabled={reportResult.rows.length === 0}>
            <Download size={16} /> {c.exportCsv}
          </button>
        </div>
      </div>

      <div className="project-control-report-grid">
        {reportTypes.map((type) => {
          const meta = reportCopy[type][language];
          const active = reportType === type;
          return (
            <button
              className={active ? "project-control-report-card active" : "project-control-report-card"}
              key={type}
              onClick={() => {
                onTypeChange(type);
                onRun(type);
              }}
              type="button"
            >
              <span>
                {type === "project_pl" ? <LineChart size={18} /> : <FileCheck2 size={18} />}
                <strong>{meta.title}</strong>
              </span>
              <small>{meta.detail}</small>
            </button>
          );
        })}
      </div>

      <div className="module-board project-control-report-result">
        <PageHeader title={c.resultTitle} detail={reportResult.title} />
        {reportResult.rows.length === 0 ? (
          <div className="hub-action-empty">
            <FileCheck2 size={18} />
            <strong>{c.noRows}</strong>
            <span>{reportResult.type}</span>
          </div>
        ) : (
          <div className="project-control-table-wrap">
            <table className="project-control-table">
              <thead>
                <tr>
                  {reportResult.headers.map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportResult.rows.map((row, index) => (
                  <tr key={`${reportResult.type}-${index}`}>
                    {reportResult.headers.map((header) => (
                      <td key={header}>{row[header]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function SettingsView({
  language,
  settings,
  status,
  onChange,
  onReset,
  onSave
}: {
  language: WorkspaceLanguage;
  settings: ProjectControlSettings;
  status: string;
  onChange: (settings: ProjectControlSettings) => void;
  onReset: () => void;
  onSave: () => void;
}) {
  const c = copy[language];
  const updateThreshold = (key: keyof ProjectControlSettings["alertThresholds"], value: string) => {
    onChange(
      normalizeSettings({
        ...settings,
        alertThresholds: {
          ...settings.alertThresholds,
          [key]: Number(value)
        }
      })
    );
  };

  return (
    <div className="module-board project-control-settings">
      <PageHeader title={c.settingsTitle} detail={c.settingsDetail} />
      <div className="project-control-settings-grid">
        <label className="project-control-field">
          <span>{c.nearBudget}</span>
          <input
            type="number"
            min="1"
            max="100"
            value={settings.alertThresholds.nearBudgetPct}
            onChange={(event) => updateThreshold("nearBudgetPct", event.target.value)}
          />
        </label>
        <label className="project-control-field">
          <span>{c.lowMargin}</span>
          <input
            type="number"
            min="0"
            max="100"
            value={settings.alertThresholds.lowMarginPct}
            onChange={(event) => updateThreshold("lowMarginPct", event.target.value)}
          />
        </label>
        <label className="project-control-field">
          <span>{c.stalePr}</span>
          <input
            type="number"
            min="1"
            value={settings.alertThresholds.staleDaysPR}
            onChange={(event) => updateThreshold("staleDaysPR", event.target.value)}
          />
        </label>
        <label className="project-control-field">
          <span>{c.noActivity}</span>
          <input
            type="number"
            min="1"
            value={settings.alertThresholds.noActivityDays}
            onChange={(event) => updateThreshold("noActivityDays", event.target.value)}
          />
        </label>
        <label className="project-control-field project-control-field--wide">
          <span>{c.defaultReport}</span>
          <select
            value={settings.defaultReportType}
            onChange={(event) =>
              onChange(
                normalizeSettings({
                  ...settings,
                  defaultReportType: event.target.value as ReportType
                })
              )
            }
          >
            {reportTypes.map((type) => (
              <option key={type} value={type}>
                {reportCopy[type][language].title}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="project-control-settings-actions">
        <button className="secondary-button" type="button" onClick={onReset}>
          <RefreshCw size={16} /> {c.resetDefaults}
        </button>
        <button className="primary-button" type="button" onClick={onSave}>
          <Settings size={16} /> {c.saveSettings}
        </button>
        {status && <span>{status}</span>}
      </div>
    </div>
  );
}
