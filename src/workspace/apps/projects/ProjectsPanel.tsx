// ProjectsPanel — Sprint 0 (Builk parity)
// Spec: docs/PROJECT_PRD.md Section 6
// Mockup reference: src/MockupGallery.tsx ProjectListMockup + ProjectDetailMockup
//
// Routes:
//   /projects?tab=list&version=0.1                       → list view (default)
//   /projects?tab=list&version=0.1&id=<projectId>        → detail view
//   /projects?tab=archive&version=0.1                    → archive (closed/cancelled)
//   /projects?tab=analytics&version=0.1                  → analytics placeholder

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Home,
  Plus,
  Trash2
} from "lucide-react";
import type { WorkspaceAppId } from "../../../apps";
import {
  applyAutoStatus,
  computeProject,
  createProject,
  customerTypeCopy,
  detectCustomerType,
  ensureSeedProjects,
  loadProjects,
  projectStatusCopy,
  removeProject as removeProjectFromState,
  saveProjects,
  suggestNextProjectCode,
  summarizeProjectList,
  upsertProject,
  type CustomerType,
  type Project,
  type ProjectListState,
  type ProjectStatus
} from "../../../projects";
import { PageHeader } from "../../shared/PageHeader";
import type { WorkspaceLanguage } from "../../shell/workspaceLanguage";
import {
  cashflowCategoryCopy,
  loadCashflowState
} from "../../../cashflow";
import {
  computeProjectRollup,
  filterCashflowEntries
} from "../../../cashflow.rollup";
import {
  LOCAL_PROJECT_ACCESS_ACTOR,
  evaluateProjectAccessGuard,
  listAccessibleProjectIds,
  loadProjectAccessState,
  type ProjectAccessDecision,
  type ProjectAccessState,
  type ProjectPermission
} from "../../../projectAccess";
import { projectsPanelCopy } from "./projectsPanelCopy";

type ProjectsPanelProps = {
  activeTab: string;
  language: WorkspaceLanguage;
  onSelectApp: (id: WorkspaceAppId) => void;
};

type ProjectDetailTabId =
  | "overview"
  | "pr"
  | "rfq"
  | "po"
  | "cost"
  | "invoice"
  | "reports";

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

const STATUS_BADGE: Record<
  ProjectStatus,
  { bg: string; color: string; dot: string }
> = {
  draft: { bg: "#E5EDF7", color: "#2A4F86", dot: "#2A4F86" },
  normal: { bg: "#E1F0E5", color: "#2A6D45", dot: "#2A6D45" },
  delayed: { bg: "#FFF1CC", color: "#92651A", dot: "#92651A" },
  closed: { bg: "#EAEAE7", color: "#4A4A47", dot: "#4A4A47" },
  cancelled: { bg: "#FFE6E1", color: "#B23E1F", dot: "#B23E1F" }
};

const STATUS_FILTER_ORDER: Array<"all" | ProjectStatus> = [
  "all",
  "normal",
  "delayed",
  "draft",
  "closed",
  "cancelled"
];

function getQueryParam(name: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
}

function setQueryParam(name: string, value: string | null) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  if (value === null || value === "") {
    params.delete(name);
  } else {
    params.set(name, value);
  }
  const next = `${window.location.pathname}?${params.toString()}`;
  window.history.pushState(window.history.state, "", next);
}

const projectAccessDecisionLabels: Record<ProjectAccessDecision["reason"], string> = {
  workspace_admin: "workspace admin",
  no_configured_grants: "project access is not configured yet",
  role_allows: "role allows this action",
  extra_permission: "extra permission allows this action",
  denied_permission: "permission denied by override",
  supplier_mismatch: "supplier scope does not match",
  no_active_grant: "no active project grant",
  no_permission: "role does not include this permission"
};

function getProjectAccessDecisionText(decision: ProjectAccessDecision) {
  return projectAccessDecisionLabels[decision.reason] ?? decision.reason;
}

function hasActiveProjectAccessGrants(state: ProjectAccessState) {
  return state.grants.some((grant) => grant.active);
}

function evaluateLocalProjectAccess(
  state: ProjectAccessState,
  permission: ProjectPermission,
  projectId?: string
) {
  return evaluateProjectAccessGuard(state, {
    memberId: LOCAL_PROJECT_ACCESS_ACTOR.memberId,
    workspaceRole: LOCAL_PROJECT_ACCESS_ACTOR.workspaceRole,
    projectId,
    permission
  });
}

export function ProjectsPanel({ activeTab, language, onSelectApp }: ProjectsPanelProps) {
  const copy = projectsPanelCopy[language];
  const [state, setState] = useState<ProjectListState>(() => ensureSeedProjects());
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() =>
    getQueryParam("id")
  );
  const [projectAccessNotice, setProjectAccessNotice] = useState("");

  useEffect(() => {
    saveProjects(state);
  }, [state]);

  // Listen to popstate so back/forward updates the detail view
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => setActiveProjectId(getQueryParam("id"));
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  const projectAccessState = loadProjectAccessState();
  const hasProjectAccessConfig = hasActiveProjectAccessGrants(projectAccessState);
  const readableProjectIds = hasProjectAccessConfig
    ? listAccessibleProjectIds(projectAccessState, {
        memberId: LOCAL_PROJECT_ACCESS_ACTOR.memberId,
        workspaceRole: LOCAL_PROJECT_ACCESS_ACTOR.workspaceRole,
        permission: "project.read"
      })
    : ["*"];
  const canReadAllProjects = readableProjectIds.includes("*");
  const readableProjectKey = readableProjectIds.join("|");
  const visibleProjects = useMemo(
    () => {
      if (!hasProjectAccessConfig || canReadAllProjects) return state.projects;
      const readableIds = readableProjectKey.split("|").filter(Boolean);
      return state.projects.filter((project) => readableIds.includes(project.id));
    },
    [canReadAllProjects, hasProjectAccessConfig, readableProjectKey, state.projects]
  );
  const visibleState = useMemo(
    () => ({ ...state, projects: visibleProjects }),
    [state, visibleProjects]
  );
  const summary = useMemo(() => summarizeProjectList(visibleState), [visibleState]);
  const createAccess = evaluateLocalProjectAccess(projectAccessState, "project.write");

  const openDetail = (id: string) => {
    const access = evaluateLocalProjectAccess(loadProjectAccessState(), "project.read", id);
    if (!access.allowed) {
      setProjectAccessNotice(
        `${copy.projectAccessBlocked}: ${getProjectAccessDecisionText(access)}`
      );
      return;
    }
    setActiveProjectId(id);
    setQueryParam("id", id);
  };

  const closeDetail = () => {
    setActiveProjectId(null);
    setQueryParam("id", null);
  };

  const handleUpsert = (project: Project) => {
    const isExistingProject = state.projects.some((item) => item.id === project.id);
    const access = evaluateLocalProjectAccess(
      loadProjectAccessState(),
      "project.write",
      isExistingProject ? project.id : undefined
    );
    if (!access.allowed) {
      setProjectAccessNotice(
        `${isExistingProject ? copy.projectAccessEditBlocked : copy.projectAccessCreateBlocked}: ${getProjectAccessDecisionText(access)}`
      );
      return false;
    }

    setState((current) => upsertProject(current, applyAutoStatus(project)));
    setProjectAccessNotice("");
    return true;
  };

  const handleRemove = (id: string) => {
    const access = evaluateLocalProjectAccess(loadProjectAccessState(), "project.admin", id);
    if (!access.allowed) {
      setProjectAccessNotice(
        `${copy.projectAccessDeleteBlocked}: ${getProjectAccessDecisionText(access)}`
      );
      return false;
    }

    setState((current) => removeProjectFromState(current, id));
    if (activeProjectId === id) {
      closeDetail();
    }
    setProjectAccessNotice("");
    return true;
  };

  const activeProject =
    activeProjectId !== null
      ? visibleProjects.find((p) => p.id === activeProjectId) ?? null
      : null;
  const activeProjectWriteAccess = activeProject
    ? evaluateLocalProjectAccess(projectAccessState, "project.write", activeProject.id)
    : createAccess;
  const activeProjectAdminAccess = activeProject
    ? evaluateLocalProjectAccess(projectAccessState, "project.admin", activeProject.id)
    : createAccess;
  const inaccessibleActiveProject = activeProjectId !== null && activeProject === null;

  // Tab routing: archive shows closed+cancelled, analytics shows summary
  const tabFilter: "all" | "archive" | "analytics" =
    activeTab === "archive" ? "archive" : activeTab === "analytics" ? "analytics" : "all";

  if (activeProject) {
    return (
      <ProjectDetailView
        project={activeProject}
        copy={copy}
        onBack={closeDetail}
        onSelectApp={onSelectApp}
        onRemove={() => handleRemove(activeProject.id)}
        onUpsert={handleUpsert}
        writeAccess={activeProjectWriteAccess}
        adminAccess={activeProjectAdminAccess}
        language={language}
      />
    );
  }

  return (
    <section className="workspace-hub" aria-label={copy.heroTitleList}>
      <div className="module-hero">
        <div>
          <h1>{copy.heroTitleList}</h1>
          <p>{copy.heroDetailList}</p>
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

      {/* Top stats row */}
      <div
        style={{
          display: "flex",
          gap: 18,
          alignItems: "center",
          padding: "10px 14px",
          background: "var(--panel)",
          border: "1px solid var(--line)",
          borderRadius: 8,
          flexWrap: "wrap",
          fontFamily: "var(--mono)",
          fontSize: 12,
          color: "var(--ink-4)"
        }}
      >
        <span>
          {copy.countLabel}{" "}
          <strong style={{ color: "var(--ink)" }}>{summary.total}</strong>
        </span>
        {summary.overdueActive > 0 && (
          <span style={{ color: "#B23E1F" }}>
            ⚠ overdue <strong>{summary.overdueActive}</strong>
          </span>
        )}
        {summary.overBudgetActive > 0 && (
          <span style={{ color: "#92651A" }}>
            ⚠ over-budget <strong>{summary.overBudgetActive}</strong>
          </span>
        )}
        <span style={{ marginLeft: "auto" }}>
          {language === "th" ? "ต้นทุนรวมจริง" : "Total actual cost"}{" "}
          <strong style={{ color: "var(--ink)" }}>{money.format(summary.totalActualCost)}</strong>
        </span>
      </div>

      {hasProjectAccessConfig && (
        <ProjectAccessCallout>
          {copy.projectAccessActive}: {visibleProjects.length} / {state.projects.length}{" "}
          {copy.projectAccessVisibleProjects}
        </ProjectAccessCallout>
      )}
      {inaccessibleActiveProject && (
        <ProjectAccessCallout tone="warning">
          {copy.projectAccessBlocked}: {copy.projectAccessNoProject}
        </ProjectAccessCallout>
      )}
      {projectAccessNotice && (
        <ProjectAccessCallout tone="warning">{projectAccessNotice}</ProjectAccessCallout>
      )}

      {tabFilter === "analytics" ? (
        <AnalyticsView state={visibleState} summary={summary} language={language} />
      ) : (
        <>
          <RecentActiveCarousel
            state={visibleState}
            copy={copy}
            onOpen={openDetail}
            language={language}
          />
          <ProjectListTable
            state={visibleState}
            copy={copy}
            tabFilter={tabFilter}
            onOpen={openDetail}
            onUpsert={handleUpsert}
            canCreate={createAccess.allowed}
            createBlockedReason={getProjectAccessDecisionText(createAccess)}
            language={language}
          />
        </>
      )}
    </section>
  );
}

function ProjectAccessCallout({
  children,
  tone = "info"
}: {
  children: React.ReactNode;
  tone?: "info" | "warning";
}) {
  const isWarning = tone === "warning";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        borderRadius: 8,
        border: isWarning ? "1px solid #F4DD9C" : "1px solid var(--line)",
        background: isWarning ? "#FFF8E6" : "var(--panel-soft, #F4F4F2)",
        color: isWarning ? "#92651A" : "var(--ink-3)",
        fontSize: 12
      }}
    >
      <AlertTriangle size={16} />
      <span>{children}</span>
    </div>
  );
}

function RecentActiveCarousel({
  state,
  copy,
  onOpen,
  language
}: {
  state: ProjectListState;
  copy: ReturnType<typeof getCopy>;
  onOpen: (id: string) => void;
  language: WorkspaceLanguage;
}) {
  const active = state.projects
    .filter((p) => p.status === "normal" || p.status === "delayed")
    .slice(0, 4);

  if (active.length === 0) return null;

  return (
    <div className="module-board" style={{ padding: 18 }}>
      <PageHeader title={copy.carouselTitle} detail={copy.carouselDetail} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 12,
          marginTop: 10
        }}
      >
        {active.map((p) => {
          const computed = computeProject(p);
          const badge = STATUS_BADGE[p.status];
          const overdue = computed.daysRemaining < 0;
          const label = projectStatusCopy[p.status][language];
          return (
            <button
              key={p.id}
              onClick={() => onOpen(p.id)}
              type="button"
              style={{
                padding: 16,
                border: "1px solid var(--line)",
                borderRadius: 8,
                background: "var(--panel)",
                display: "grid",
                gap: 10,
                cursor: "pointer",
                textAlign: "left",
                font: "inherit",
                color: "inherit"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 11,
                    color: "var(--ink-5)"
                  }}
                >
                  {p.code}
                </span>
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
                  {label}
                </span>
              </div>
              <strong style={{ fontSize: 14, lineHeight: 1.35, minHeight: 38 }}>{p.name}</strong>
              <div
                style={{
                  fontSize: 11,
                  color: p.clientName ? "var(--ink-5)" : "var(--ink-5)",
                  fontFamily: "var(--mono)",
                  fontStyle: p.clientName ? "normal" : "italic"
                }}
              >
                {p.clientName || copy.noCustomer}
              </div>
              <div
                style={{
                  borderTop: "1px solid var(--line)",
                  paddingTop: 10,
                  display: "grid",
                  gap: 6
                }}
              >
                <KpiRow
                  label={copy.kpiBudgetLeft}
                  value={
                    p.hasBudget ? shortMoney(computed.budgetRemaining) : copy.noBudget
                  }
                  warn={!p.hasBudget || computed.budgetRemaining < 0}
                />
                <KpiRow
                  label={copy.kpiTimeLeft}
                  value={
                    overdue
                      ? `${copy.overdueDays} ${Math.abs(computed.daysRemaining)} ${language === "th" ? "วัน" : "d"}`
                      : `${computed.daysRemaining} ${language === "th" ? "วัน" : "d"}`
                  }
                  warn={overdue}
                />
                <KpiRow
                  label={copy.kpiMargin}
                  value={
                    computed.marginPct !== null ? `${computed.marginPct.toFixed(1)}%` : "—"
                  }
                  positive={computed.marginPct !== null && computed.marginPct >= 15}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProjectListTable({
  state,
  copy,
  tabFilter,
  onOpen,
  onUpsert,
  canCreate,
  createBlockedReason,
  language
}: {
  state: ProjectListState;
  copy: ReturnType<typeof getCopy>;
  tabFilter: "all" | "archive";
  onOpen: (id: string) => void;
  onUpsert: (project: Project) => boolean;
  canCreate: boolean;
  createBlockedReason: string;
  language: WorkspaceLanguage;
}) {
  const [statusFilter, setStatusFilter] = useState<"all" | ProjectStatus>("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Archive tab limits to closed/cancelled regardless of chip
  const baseProjects = useMemo(() => {
    if (tabFilter === "archive") {
      return state.projects.filter(
        (p) => p.status === "closed" || p.status === "cancelled"
      );
    }
    return state.projects;
  }, [state.projects, tabFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return baseProjects.filter((p) => {
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      const matchesSearch =
        !q ||
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [baseProjects, statusFilter, search]);

  const statusCounts: Record<"all" | ProjectStatus, number> = useMemo(() => {
    const counts = { all: baseProjects.length, draft: 0, normal: 0, delayed: 0, closed: 0, cancelled: 0 };
    for (const p of baseProjects) counts[p.status] += 1;
    return counts;
  }, [baseProjects]);

  return (
    <div className="module-board" style={{ padding: 18 }}>
      <PageHeader title={copy.tableTitle} detail={copy.tableDetail} />

      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          alignItems: "center",
          margin: "14px 0"
        }}
      >
        {STATUS_FILTER_ORDER.map((s) => {
          if (tabFilter === "archive" && (s === "normal" || s === "delayed" || s === "draft")) {
            return null;
          }
          const isActive = statusFilter === s;
          const dot = s === "all" ? null : STATUS_BADGE[s as ProjectStatus].dot;
          const label =
            s === "all" ? copy.filterAll : projectStatusCopy[s as ProjectStatus][language];
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                border: isActive ? "1px solid var(--ink)" : "1px solid var(--line)",
                background: isActive ? "var(--ink)" : "var(--panel)",
                color: isActive ? "#fff" : "var(--ink-3)",
                cursor: "pointer",
                fontSize: 12,
                fontFamily: "var(--mono)",
                display: "inline-flex",
                alignItems: "center",
                gap: 6
              }}
            >
              {dot && (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: dot,
                    display: "inline-block"
                  }}
                />
              )}
              {label}
              <span style={{ opacity: 0.6 }}>{statusCounts[s]}</span>
            </button>
          );
        })}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={copy.searchPlaceholder}
          style={{
            flex: "1 1 220px",
            padding: "8px 12px",
            border: "1px solid var(--line)",
            borderRadius: 6,
            fontFamily: "inherit",
            fontSize: 13,
            marginLeft: 8
          }}
        />
        <button
          className="primary-button"
          type="button"
          onClick={() => {
            if (canCreate) setShowForm(true);
          }}
          disabled={!canCreate}
          title={canCreate ? copy.createProject : `${copy.projectAccessCreateBlocked}: ${createBlockedReason}`}
        >
          <Plus size={16} /> {copy.createProject}
        </button>
      </div>

      {!canCreate && (
        <ProjectAccessCallout tone="warning">
          {copy.projectAccessCreateBlocked}: {createBlockedReason}
        </ProjectAccessCallout>
      )}

      {showForm && (
        <ProjectForm
          mode="create"
          copy={copy}
          existingProjects={state.projects}
          onCancel={() => setShowForm(false)}
          onSave={(p) => {
            if (onUpsert(p)) {
              setShowForm(false);
            }
          }}
          language={language}
        />
      )}

      {filtered.length === 0 ? (
        <div
          style={{
            padding: "30px 12px",
            textAlign: "center",
            color: "var(--ink-5)",
            background: "var(--panel-soft, #F4F4F2)",
            borderRadius: 8
          }}
        >
          <Building2 size={28} style={{ opacity: 0.4, marginBottom: 8 }} />
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
              minWidth: 940
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                {[
                  { label: copy.thCode },
                  { label: copy.thName },
                  { label: copy.thCustomer },
                  { label: copy.thContract, right: true },
                  { label: copy.thPlanned, right: true },
                  { label: copy.thActual, right: true },
                  { label: copy.thMargin, right: true },
                  { label: copy.thDays, right: true },
                  { label: copy.thStatus }
                ].map((c) => (
                  <th
                    key={c.label}
                    style={{
                      textAlign: c.right ? "right" : "left",
                      padding: "10px 12px",
                      background: "var(--panel-soft, #F4F4F2)",
                      fontFamily: "var(--mono)",
                      fontSize: 10,
                      letterSpacing: "0.06em",
                      color: "var(--ink-5)",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const computed = computeProject(p);
                const overdue = computed.daysRemaining < 0;
                const badge = STATUS_BADGE[p.status];
                const label = projectStatusCopy[p.status][language];
                return (
                  <tr
                    key={p.id}
                    onClick={() => onOpen(p.id)}
                    style={{ borderBottom: "1px solid var(--line)", cursor: "pointer" }}
                  >
                    <td
                      style={{
                        padding: "10px 12px",
                        fontFamily: "var(--mono)",
                        fontWeight: 700,
                        color: "var(--ink-2)"
                      }}
                    >
                      {p.code || "—"}
                    </td>
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>{p.name}</td>
                    <td
                      style={{
                        padding: "10px 12px",
                        color: p.clientName ? "var(--ink-2)" : "var(--ink-5)",
                        fontStyle: p.clientName ? "normal" : "italic"
                      }}
                    >
                      {p.clientName || copy.noCustomer}
                      {p.customerType && customerTypeCopy[p.customerType].badge && (
                        <span
                          style={{
                            marginLeft: 6,
                            fontSize: 9,
                            padding: "1px 5px",
                            border: "1px solid var(--line-strong, #C7C7C2)",
                            borderRadius: 3,
                            color: "var(--ink-4)"
                          }}
                        >
                          {customerTypeCopy[p.customerType].badge}
                        </span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        textAlign: "right",
                        fontFamily: "var(--mono)"
                      }}
                    >
                      {p.contractValue > 0 ? money.format(p.contractValue) : "—"}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        textAlign: "right",
                        fontFamily: "var(--mono)",
                        color: p.hasBudget ? "var(--ink-4)" : "#B23E1F"
                      }}
                    >
                      {p.hasBudget ? money.format(p.plannedCost) : copy.noBudget}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        textAlign: "right",
                        fontFamily: "var(--mono)",
                        color: computed.isOverBudget ? "#B23E1F" : "var(--ink-2)",
                        fontWeight: computed.isOverBudget ? 700 : 500
                      }}
                    >
                      {money.format(p.actualCost)} {computed.isOverBudget && "⚠"}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        textAlign: "right",
                        fontFamily: "var(--mono)",
                        color:
                          computed.marginPct === null
                            ? "var(--ink-5)"
                            : computed.marginPct >= 15
                              ? "#2A6D45"
                              : "#B23E1F",
                        fontWeight: 700
                      }}
                    >
                      {computed.marginPct !== null
                        ? `${computed.marginPct.toFixed(1)}%`
                        : "—"}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        textAlign: "right",
                        fontFamily: "var(--mono)",
                        color: overdue ? "#B23E1F" : "var(--ink-3)"
                      }}
                    >
                      {computed.daysRemaining}
                    </td>
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
                        {label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div
        style={{
          marginTop: 12,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          color: "var(--ink-5)",
          fontFamily: "var(--mono)"
        }}
      >
        <span>
          {language === "th" ? "แสดงรายการ" : "Showing"} {filtered.length} /{" "}
          {baseProjects.length}
        </span>
      </div>
    </div>
  );
}

type FormMode = "create" | "edit";

function ProjectForm({
  mode,
  copy,
  existingProjects,
  initialValue,
  onCancel,
  onSave,
  language
}: {
  mode: FormMode;
  copy: ReturnType<typeof getCopy>;
  existingProjects: Project[];
  initialValue?: Project;
  onCancel: () => void;
  onSave: (project: Project) => void;
  language: WorkspaceLanguage;
}) {
  const [code, setCode] = useState(
    initialValue?.code || suggestNextProjectCode(existingProjects)
  );
  const [name, setName] = useState(initialValue?.name ?? "");
  const [clientName, setClientName] = useState(initialValue?.clientName ?? "");
  const [customerType, setCustomerType] = useState<CustomerType | null>(
    initialValue?.customerType ?? null
  );
  const [contractValue, setContractValue] = useState(
    initialValue?.contractValue?.toString() ?? ""
  );
  const [plannedCost, setPlannedCost] = useState(
    initialValue?.plannedCost?.toString() ?? ""
  );
  const [plannedRevenue, setPlannedRevenue] = useState(
    initialValue?.plannedRevenue?.toString() ?? ""
  );
  const [startDate, setStartDate] = useState(initialValue?.startDate ?? "");
  const [endDate, setEndDate] = useState(initialValue?.endDate ?? "");
  const [status, setStatus] = useState<ProjectStatus>(initialValue?.status ?? "draft");
  const [notes, setNotes] = useState(initialValue?.notes ?? "");

  const handleClientNameChange = (value: string) => {
    setClientName(value);
    if (!initialValue) {
      setCustomerType(detectCustomerType(value));
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    const project = createProject({
      ...initialValue,
      code: code.trim(),
      name: name.trim(),
      clientName: clientName.trim(),
      customerType,
      contractValue: parseFloat(contractValue) || 0,
      plannedCost: parseFloat(plannedCost) || 0,
      plannedRevenue: parseFloat(plannedRevenue) || 0,
      startDate,
      endDate,
      status,
      hasBudget: (parseFloat(plannedCost) || 0) > 0,
      notes: notes.trim()
    });
    onSave(project);
  };

  return (
    <div
      style={{
        border: "1px solid var(--line)",
        borderRadius: 8,
        padding: 18,
        marginBottom: 16,
        background: "var(--panel)"
      }}
    >
      <PageHeader
        title={mode === "create" ? copy.formTitleCreate : copy.formTitleEdit}
        detail=""
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
          marginTop: 14
        }}
      >
        <FormField label={copy.fieldCode}>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={inputStyle}
          />
        </FormField>
        <FormField label={copy.fieldName} required>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
        </FormField>
        <FormField label={copy.fieldClientName}>
          <input
            value={clientName}
            onChange={(e) => handleClientNameChange(e.target.value)}
            style={inputStyle}
          />
        </FormField>
        <FormField label={copy.fieldCustomerType}>
          <select
            value={customerType ?? ""}
            onChange={(e) =>
              setCustomerType((e.target.value as CustomerType) || null)
            }
            style={inputStyle}
          >
            <option value="">—</option>
            <option value="individual">{customerTypeCopy.individual[language]}</option>
            <option value="gov">{customerTypeCopy.gov[language]}</option>
            <option value="corporate">{customerTypeCopy.corporate[language]}</option>
          </select>
        </FormField>
        <FormField label={copy.fieldContractValue}>
          <input
            type="number"
            min="0"
            value={contractValue}
            onChange={(e) => setContractValue(e.target.value)}
            style={inputStyle}
          />
        </FormField>
        <FormField label={copy.fieldPlannedCost}>
          <input
            type="number"
            min="0"
            value={plannedCost}
            onChange={(e) => setPlannedCost(e.target.value)}
            style={inputStyle}
          />
        </FormField>
        <FormField label={copy.fieldPlannedRevenue}>
          <input
            type="number"
            min="0"
            value={plannedRevenue}
            onChange={(e) => setPlannedRevenue(e.target.value)}
            style={inputStyle}
          />
        </FormField>
        <FormField label={copy.fieldStartDate}>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={inputStyle}
          />
        </FormField>
        <FormField label={copy.fieldEndDate}>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={inputStyle}
          />
        </FormField>
        <FormField label={copy.fieldStatus}>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            style={inputStyle}
          >
            {(Object.keys(projectStatusCopy) as ProjectStatus[]).map((s) => (
              <option key={s} value={s}>
                {projectStatusCopy[s][language]}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      <FormField label={copy.fieldNotes}>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={copy.fieldNotesPlaceholder}
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </FormField>
      <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
        <button className="secondary-button" type="button" onClick={onCancel}>
          {copy.cancel}
        </button>
        <button
          className="primary-button"
          type="button"
          onClick={handleSubmit}
          disabled={!name.trim()}
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
    <label style={{ display: "grid", gap: 4, fontSize: 12, marginTop: 8 }}>
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
  padding: "8px 12px",
  border: "1px solid var(--line)",
  borderRadius: 6,
  fontFamily: "inherit",
  fontSize: 13
};

function KpiRow({
  label,
  value,
  warn,
  positive
}: {
  label: string;
  value: React.ReactNode;
  warn?: boolean;
  positive?: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
      <span
        style={{
          fontFamily: "var(--mono)",
          fontSize: 10,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--ink-5)"
        }}
      >
        {label}
      </span>
      <strong
        style={{
          fontFamily: "var(--mono)",
          fontSize: 13,
          color: warn ? "#B23E1F" : positive ? "#2A6D45" : "var(--ink)"
        }}
      >
        {value}
      </strong>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail view
// ---------------------------------------------------------------------------

function ProjectDetailView({
  project,
  copy,
  onBack,
  onSelectApp,
  onRemove,
  onUpsert,
  writeAccess,
  adminAccess,
  language
}: {
  project: Project;
  copy: ReturnType<typeof getCopy>;
  onBack: () => void;
  onSelectApp: (id: WorkspaceAppId) => void;
  onRemove: () => boolean;
  onUpsert: (project: Project) => boolean;
  writeAccess: ProjectAccessDecision;
  adminAccess: ProjectAccessDecision;
  language: WorkspaceLanguage;
}) {
  const [activeTab, setActiveTab] = useState<ProjectDetailTabId>("overview");
  const [editing, setEditing] = useState(false);
  const computed = computeProject(project);
  const badge = STATUS_BADGE[project.status];
  const statusLabel = projectStatusCopy[project.status][language];

  const tabs: Array<{ id: ProjectDetailTabId; label: string }> = [
    { id: "overview", label: copy.tabOverview },
    { id: "pr", label: copy.tabPR },
    { id: "rfq", label: copy.tabRFQ },
    { id: "po", label: copy.tabPO },
    { id: "cost", label: copy.tabCost },
    { id: "invoice", label: copy.tabInvoice },
    { id: "reports", label: copy.tabReports }
  ];

  return (
    <section className="workspace-hub" aria-label={project.name}>
      <div className="module-hero">
        <div>
          <h1>
            <span
              style={{
                fontFamily: "var(--mono)",
                fontSize: 14,
                color: "var(--ink-5)",
                marginRight: 8
              }}
            >
              {project.code}
            </span>
            {project.name}
          </h1>
          <p>
            {project.clientName || copy.noCustomer}
            {project.customerType && customerTypeCopy[project.customerType].badge && (
              <span style={{ marginLeft: 8, color: "var(--ink-5)" }}>
                · {customerTypeCopy[project.customerType][language]}
              </span>
            )}
          </p>
        </div>
        <div className="module-actions">
          <button className="secondary-button" type="button" onClick={onBack}>
            <ArrowLeft size={16} /> {copy.backToList}
          </button>
          <button className="secondary-button" type="button" onClick={() => onSelectApp("hub")}>
            <Home size={16} /> {copy.backToHub}
          </button>
        </div>
      </div>

      {editing ? (
        <ProjectForm
          mode="edit"
          copy={copy}
          existingProjects={[]}
          initialValue={project}
          onCancel={() => setEditing(false)}
          onSave={(p) => {
            if (onUpsert(p)) {
              setEditing(false);
            }
          }}
          language={language}
        />
      ) : (
        <div
          style={{
            padding: 20,
            background: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: 10,
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 20,
            alignItems: "center"
          }}
        >
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
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
                ● {statusLabel}
              </span>
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  color: "var(--ink-5)"
                }}
              >
                {project.startDate || "—"} → {project.endDate || "—"}
              </span>
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 12,
                  fontWeight: 700,
                  color: computed.isOverdue ? "#B23E1F" : "var(--ink-3)"
                }}
              >
                {computed.isOverdue
                  ? `⚠ ${copy.overdueDays} ${Math.abs(computed.daysRemaining)} ${language === "th" ? "วัน" : "d"}`
                  : `${computed.daysRemaining} ${copy.remainingDays}`}
              </span>
            </div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              <HeaderKpi label={copy.kpiContract} value={money.format(project.contractValue)} />
              <HeaderKpi label={copy.kpiPlannedCost} value={money.format(project.plannedCost)} />
              <HeaderKpi
                label={copy.kpiActualCost}
                value={money.format(project.actualCost)}
                warn={computed.isOverBudget}
              />
              <HeaderKpi
                label={copy.kpiMargin}
                value={computed.marginPct !== null ? `${computed.marginPct.toFixed(1)}%` : "—"}
                positive={computed.marginPct !== null && computed.marginPct >= 15}
                warn={computed.marginPct !== null && computed.marginPct < 10}
              />
              <HeaderKpi
                label={copy.kpiBudgetLeft}
                value={shortMoney(computed.budgetRemaining)}
                warn={computed.budgetRemaining < 0}
              />
            </div>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            <button
              className="primary-button"
              type="button"
              onClick={() => {
                if (writeAccess.allowed) setEditing(true);
              }}
              disabled={!writeAccess.allowed}
              title={
                writeAccess.allowed
                  ? copy.edit
                  : `${copy.projectAccessEditBlocked}: ${getProjectAccessDecisionText(writeAccess)}`
              }
            >
              {copy.edit}
            </button>
            <button
              className="secondary-button"
              type="button"
              disabled={!adminAccess.allowed}
              title={
                adminAccess.allowed
                  ? copy.delete
                  : `${copy.projectAccessDeleteBlocked}: ${getProjectAccessDecisionText(adminAccess)}`
              }
              onClick={() => {
                if (!adminAccess.allowed) return;
                if (
                  typeof window !== "undefined" &&
                  window.confirm(
                    language === "th"
                      ? `ลบโครงการ "${project.name}" ?`
                      : `Delete project "${project.name}"?`
                  )
                ) {
                  onRemove();
                }
              }}
            >
              <Trash2 size={16} /> {copy.delete}
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: 4,
          borderBottom: "1px solid var(--line)",
          overflowX: "auto",
          marginTop: 18
        }}
      >
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: "12px 18px",
                background: "transparent",
                border: 0,
                borderBottom: isActive ? "2px solid var(--ink)" : "2px solid transparent",
                color: isActive ? "var(--ink)" : "var(--ink-4)",
                fontWeight: isActive ? 700 : 500,
                fontSize: 13,
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === "overview" ? (
        <OverviewTabContent project={project} computed={computed} copy={copy} />
      ) : activeTab === "cost" ? (
        <ProjectCashflowTab project={project} copy={copy} language={language} />
      ) : (
        <TabPlaceholder copy={copy} />
      )}

      {project.notes && (
        <div
          className="module-board"
          style={{ padding: 18, marginTop: 14, whiteSpace: "pre-wrap" }}
        >
          <PageHeader title={copy.fieldNotes} detail="" />
          <p style={{ marginTop: 8 }}>{project.notes}</p>
        </div>
      )}
    </section>
  );
}

function HeaderKpi({
  label,
  value,
  warn,
  positive
}: {
  label: string;
  value: string;
  warn?: boolean;
  positive?: boolean;
}) {
  return (
    <div style={{ display: "grid", gap: 2 }}>
      <span
        style={{
          fontFamily: "var(--mono)",
          fontSize: 10,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--ink-5)"
        }}
      >
        {label}
      </span>
      <strong
        style={{
          fontFamily: "var(--mono)",
          fontSize: 16,
          color: warn ? "#B23E1F" : positive ? "#2A6D45" : "var(--ink)"
        }}
      >
        {value} {warn && "⚠"}
      </strong>
    </div>
  );
}

function OverviewTabContent({
  project,
  computed,
  copy
}: {
  project: Project;
  computed: ReturnType<typeof computeProject>;
  copy: ReturnType<typeof getCopy>;
}) {
  return (
    <>
      {computed.isOverdue && (
        <div
          style={{
            padding: 14,
            borderRadius: 8,
            background: "#FFE6E1",
            border: "1px solid #F2BCAE",
            color: "#B23E1F",
            fontSize: 13,
            display: "flex",
            gap: 12,
            alignItems: "center",
            marginTop: 14
          }}
        >
          <AlertTriangle size={20} />
          <div>
            <strong>
              {copy.alertOverdueTitle} {Math.abs(computed.daysRemaining)} d
            </strong>
            <div style={{ fontSize: 12 }}>{copy.alertOverdueDetail}</div>
          </div>
        </div>
      )}

      {computed.isOverBudget && (
        <div
          style={{
            padding: 14,
            borderRadius: 8,
            background: "#FFF1CC",
            border: "1px solid #F4DD9C",
            color: "#92651A",
            fontSize: 13,
            display: "flex",
            gap: 12,
            alignItems: "center",
            marginTop: 10
          }}
        >
          <AlertTriangle size={20} />
          <div>
            <strong>
              {copy.alertOverBudgetTitle}{" "}
              {money.format(project.actualCost - project.plannedCost)} (
              {(
                ((project.actualCost - project.plannedCost) / project.plannedCost) *
                100
              ).toFixed(1)}
              %)
            </strong>
          </div>
        </div>
      )}

      <div className="module-board" style={{ padding: 18, marginTop: 14 }}>
        <PageHeader title={copy.costBreakdownTitle} detail="" />
        <p
          style={{
            marginTop: 8,
            color: "var(--ink-5)",
            fontSize: 13,
            fontStyle: "italic"
          }}
        >
          {copy.costBreakdownPlaceholder}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          marginTop: 14
        }}
      >
        <div className="module-board" style={{ padding: 18 }}>
          <PageHeader title={copy.recentActivityTitle} detail="" />
          <p style={{ marginTop: 8, color: "var(--ink-5)", fontSize: 13 }}>
            {copy.recentActivityEmpty}
          </p>
        </div>
        <div
          style={{
            padding: 18,
            background: "var(--ink, #1a1a1a)",
            color: "#fff",
            borderRadius: 10
          }}
        >
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{copy.aiInsightsTitle}</h3>
          <p style={{ marginTop: 8, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
            {copy.aiInsightsDetail}
          </p>
        </div>
      </div>
    </>
  );
}

function TabPlaceholder({ copy }: { copy: ReturnType<typeof getCopy> }) {
  return (
    <div
      className="module-board"
      style={{
        padding: 30,
        textAlign: "center",
        marginTop: 14,
        color: "var(--ink-5)",
        fontStyle: "italic"
      }}
    >
      {copy.tabComingSoon}
    </div>
  );
}

function ProjectCashflowTab({
  project,
  copy,
  language
}: {
  project: Project;
  copy: ReturnType<typeof getCopy>;
  language: WorkspaceLanguage;
}) {
  const cashflowState = useMemo(() => loadCashflowState(), []);
  const entries = useMemo(
    () =>
      filterCashflowEntries(cashflowState, { projectId: project.id }).sort(
        (a, b) => b.entryDate.localeCompare(a.entryDate)
      ),
    [cashflowState, project.id]
  );
  const rollup = useMemo(
    () => computeProjectRollup(project.id, cashflowState.entries),
    [cashflowState.entries, project.id]
  );

  const onAdd = () => {
    if (typeof window !== "undefined") {
      window.location.href = `/cashflow?tab=overview&version=0.1`;
    }
  };

  return (
    <div className="module-board" style={{ padding: 18, marginTop: 14 }}>
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
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>
            {language === "th" ? "บันทึกต้นทุนของโครงการนี้" : "Cost recording for this project"}
          </h3>
          <p
            style={{
              marginTop: 4,
              color: "var(--ink-5)",
              fontSize: 12,
              fontFamily: "var(--mono)"
            }}
          >
            {language === "th"
              ? `Confirmed ${rollup.confirmedEntryCount} · ต้นทุนรวม ฿${rollup.actualCost.toLocaleString()} · รายรับ ฿${rollup.actualRevenue.toLocaleString()}`
              : `Confirmed ${rollup.confirmedEntryCount} · cost ฿${rollup.actualCost.toLocaleString()} · revenue ฿${rollup.actualRevenue.toLocaleString()}`}
          </p>
        </div>
        <button className="primary-button" type="button" onClick={onAdd}>
          {language === "th" ? "+ บันทึกใน Cashflow" : "+ Add in Cashflow"}
        </button>
      </div>

      {entries.length === 0 ? (
        <p
          style={{
            marginTop: 14,
            color: "var(--ink-5)",
            fontStyle: "italic",
            fontSize: 13
          }}
        >
          {language === "th"
            ? "ยังไม่มีบันทึกต้นทุนของโครงการนี้ — เปิด Cashflow แล้วเลือกโครงการนี้ในฟอร์ม"
            : "No cost entries for this project yet — open Cashflow and pick this project in the form"}
        </p>
      ) : (
        <div style={{ overflowX: "auto", marginTop: 14 }}>
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
                {[
                  language === "th" ? "วันที่" : "Date",
                  language === "th" ? "หมวด" : "Category",
                  language === "th" ? "รายการ" : "Description",
                  "Cost Code",
                  language === "th" ? "ยอด" : "Amount",
                  language === "th" ? "สถานะ" : "Status"
                ].map((h) => (
                  <th
                    key={h}
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
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={{ padding: "8px 10px", fontFamily: "var(--mono)" }}>
                    {entry.entryDate}
                  </td>
                  <td style={{ padding: "8px 10px", fontSize: 11 }}>
                    {cashflowCategoryCopy[entry.category]?.[language] ?? entry.category}
                  </td>
                  <td style={{ padding: "8px 10px" }}>{entry.description || "—"}</td>
                  <td style={{ padding: "8px 10px", fontFamily: "var(--mono)", fontSize: 11 }}>
                    {entry.costCodeId || "—"}
                  </td>
                  <td
                    style={{
                      padding: "8px 10px",
                      textAlign: "right",
                      fontFamily: "var(--mono)",
                      fontWeight: 700,
                      color: entry.direction === "income" ? "#2A6D45" : "var(--ink)"
                    }}
                  >
                    {entry.direction === "income" ? "+" : "-"}฿{entry.amount.toLocaleString()}
                  </td>
                  <td style={{ padding: "8px 10px", fontSize: 11, color: "var(--ink-5)" }}>
                    {entry.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {Object.keys(rollup.costCodeRollups).length > 0 && (
        <div style={{ marginTop: 18 }}>
          <PageHeader
            title={language === "th" ? "สรุปตาม Cost Code" : "By cost code"}
            detail=""
          />
          <div style={{ display: "grid", gap: 4, marginTop: 8 }}>
            {Object.entries(rollup.costCodeRollups)
              .sort(([, a], [, b]) => b - a)
              .map(([code, amount]) => (
                <div
                  key={code}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "4px 8px",
                    fontFamily: "var(--mono)",
                    fontSize: 12
                  }}
                >
                  <span>{code}</span>
                  <strong>฿{amount.toLocaleString()}</strong>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AnalyticsView({
  state,
  summary,
  language
}: {
  state: ProjectListState;
  summary: ReturnType<typeof summarizeProjectList>;
  language: WorkspaceLanguage;
}) {
  const totalCount = state.projects.length;
  return (
    <div className="module-board" style={{ padding: 18 }}>
      <PageHeader
        title={language === "th" ? "ภาพรวมข้าม project" : "Cross-project analytics"}
        detail={
          language === "th" ? "เริ่มต้น — ขยายใน Sprint 6" : "Stub — expand in Sprint 6"
        }
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
          marginTop: 14
        }}
      >
        <SummaryCard label={language === "th" ? "ทั้งหมด" : "Total"} value={totalCount} />
        <SummaryCard label={language === "th" ? "ปกติ" : "Normal"} value={summary.normal} />
        <SummaryCard label={language === "th" ? "ชะลอ" : "Delayed"} value={summary.delayed} />
        <SummaryCard
          label={language === "th" ? "เกินกำหนด" : "Overdue"}
          value={summary.overdueActive}
          warn={summary.overdueActive > 0}
        />
        <SummaryCard
          label={language === "th" ? "เกินงบ" : "Over budget"}
          value={summary.overBudgetActive}
          warn={summary.overBudgetActive > 0}
        />
        <SummaryCard
          label={language === "th" ? "ต้นทุนแผน" : "Planned cost"}
          value={shortMoney(summary.totalPlannedCost)}
        />
        <SummaryCard
          label={language === "th" ? "ต้นทุนจริง" : "Actual cost"}
          value={shortMoney(summary.totalActualCost)}
        />
        <SummaryCard
          label={language === "th" ? "มูลค่าสัญญา" : "Contract value"}
          value={shortMoney(summary.totalContractValue)}
        />
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  warn
}: {
  label: string;
  value: string | number;
  warn?: boolean;
}) {
  return (
    <div
      style={{
        padding: 14,
        border: "1px solid var(--line)",
        borderRadius: 8,
        background: "var(--panel)"
      }}
    >
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: 10,
          color: "var(--ink-5)",
          textTransform: "uppercase",
          letterSpacing: "0.06em"
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 4,
          fontSize: 18,
          fontWeight: 700,
          color: warn ? "#B23E1F" : "var(--ink)"
        }}
      >
        {value}
      </div>
    </div>
  );
}

// Type helper — extracts copy type without circular import
function getCopy(): typeof projectsPanelCopy.th {
  return projectsPanelCopy.th;
}
