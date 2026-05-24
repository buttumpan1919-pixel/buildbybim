import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_ALERT_THRESHOLDS,
  PROJECT_CONTROL_SETTINGS_KEY,
  computeProjectSnapshot,
  generateAlerts,
  generateCashflowForecast,
  generateCostVariance,
  generatePRAging,
  generateProjectPL,
  generateSupplierSpend,
  loadSettings,
  normalizeSettings,
  saveSettings,
  summarizeWorkspaceControl,
  type ProjectControlSettings,
  type ReportContext,
  type SnapshotContext
} from "./projectControl";
import { createProject, type Project } from "./projects";
import { normalizeCostCode, type CostCode } from "./costCodes";
import {
  upsertCashflowEntry,
  type CashflowEntry,
  type CashflowState
} from "./cashflow";
import { rowsToCsv } from "./csvExport";
import {
  normalizePurchaseRequest,
  normalizePRLineItem,
  type PRLineItem,
  type PurchaseRequest
} from "./procurement";
import { normalizeSupplier, type Supplier } from "./suppliers";
import { createBoqProjectTask } from "./boqTaskLinkage";

function resetStorage() {
  if (typeof window !== "undefined") window.localStorage.clear();
}

function makeProject(overrides: Partial<Project> = {}): Project {
  return createProject({
    id: "p-1",
    workspaceId: "ws-1",
    code: "j-2600",
    name: "Test project",
    plannedCost: 100_000,
    plannedRevenue: 150_000,
    actualCost: 0,
    actualRevenue: 0,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    status: "normal",
    hasBudget: true,
    ...overrides
  });
}

function makeCostCode(overrides: Partial<CostCode> = {}): CostCode {
  return normalizeCostCode({
    workspaceId: "ws-1",
    code: "01-100",
    name: "ปรับระดับ",
    category: "site",
    defaultUnit: "sq_m",
    defaultUnitPrice: 100,
    ...overrides
  });
}

function makeEntry(overrides: Partial<CashflowEntry> = {}): CashflowEntry {
  return upsertCashflowEntry(
    { entries: [], updatedAt: "" },
    {
      direction: "expense",
      category: "material",
      amount: 100,
      status: "confirmed",
      entryDate: "2026-04-15",
      projectId: "p-1",
      ...overrides
    }
  ).entries[0];
}

function makePRItem(overrides: Partial<PRLineItem> = {}): PRLineItem {
  return normalizePRLineItem({
    costCodeId: "01-100",
    description: "x",
    quantity: 10,
    unit: "x",
    estimatedUnitPrice: 100,
    ...overrides
  });
}

function makePR(overrides: Partial<PurchaseRequest> = {}): PurchaseRequest {
  return normalizePurchaseRequest({
    workspaceId: "ws-1",
    projectId: "p-1",
    prNo: "PR-2026-001",
    status: "approved",
    requestDate: "2026-04-01",
    items: [makePRItem()],
    ...overrides
  });
}

function makeSupplier(overrides: Partial<Supplier> = {}): Supplier {
  return normalizeSupplier({
    workspaceId: "ws-1",
    name: "บจก. ทดสอบ",
    shortName: "TEST",
    type: "manufacturer",
    rating: 4,
    active: true,
    ...overrides
  });
}

const REF = new Date("2026-05-24T00:00:00Z");

describe("settings", () => {
  beforeEach(resetStorage);

  it("uses namespaced key", () => {
    expect(PROJECT_CONTROL_SETTINGS_KEY).toBe("project-control.settings.v1");
  });

  it("normalizeSettings fills defaults", () => {
    const s = normalizeSettings({});
    expect(s.defaultReportType).toBe("project_pl");
    expect(s.alertThresholds.nearBudgetPct).toBe(85);
    expect(s.alertThresholds.lowMarginPct).toBe(10);
  });

  it("normalizeSettings respects custom thresholds", () => {
    const s = normalizeSettings({
      alertThresholds: { nearBudgetPct: 70 } as ProjectControlSettings["alertThresholds"]
    });
    expect(s.alertThresholds.nearBudgetPct).toBe(70);
    expect(s.alertThresholds.lowMarginPct).toBe(10); // default kept
  });

  it("save + load round-trip", () => {
    const settings: ProjectControlSettings = {
      workspaceId: "ws-1",
      defaultReportType: "supplier_spend",
      alertThresholds: {
        nearBudgetPct: 75,
        lowMarginPct: 8,
        staleDaysPR: 45,
        noActivityDays: 21
      },
      updatedAt: new Date().toISOString()
    };
    saveSettings(settings);
    const loaded = loadSettings();
    expect(loaded.defaultReportType).toBe("supplier_spend");
    expect(loaded.alertThresholds.nearBudgetPct).toBe(75);
  });
});

describe("computeProjectSnapshot", () => {
  it("sums actual from confirmed cashflow only", () => {
    const ctx: SnapshotContext = {
      project: makeProject({ id: "p-1" }),
      costCodes: [makeCostCode({ code: "01-100" })],
      cashflowEntries: [
        makeEntry({ amount: 100, status: "confirmed", costCodeId: "01-100" }),
        makeEntry({ amount: 200, status: "draft", costCodeId: "01-100" }),
        makeEntry({ amount: 500, status: "void", costCodeId: "01-100" })
      ],
      purchaseRequests: [],
      referenceDate: REF
    };
    const snap = computeProjectSnapshot(ctx);
    expect(snap.totalActual).toBe(100);
  });

  it("sums committed from approved/ordered/received PRs", () => {
    const ctx: SnapshotContext = {
      project: makeProject({ id: "p-1" }),
      costCodes: [makeCostCode({ code: "01-100" })],
      cashflowEntries: [],
      purchaseRequests: [
        makePR({ id: "1", status: "approved", items: [makePRItem({ quantity: 1, estimatedUnitPrice: 500 })] }),
        makePR({ id: "2", status: "ordered", items: [makePRItem({ quantity: 1, estimatedUnitPrice: 300 })] }),
        makePR({ id: "3", status: "draft", items: [makePRItem({ quantity: 1, estimatedUnitPrice: 999 })] }),
        makePR({ id: "4", status: "rejected", items: [makePRItem({ quantity: 1, estimatedUnitPrice: 888 })] })
      ],
      referenceDate: REF
    };
    const snap = computeProjectSnapshot(ctx);
    expect(snap.totalCommitted).toBe(800);
  });

  it("scopes everything to project id", () => {
    const ctx: SnapshotContext = {
      project: makeProject({ id: "p-1" }),
      costCodes: [makeCostCode({ code: "01-100" })],
      cashflowEntries: [
        makeEntry({ projectId: "p-1", amount: 100 }),
        makeEntry({ projectId: "p-other", amount: 999 })
      ],
      purchaseRequests: [
        makePR({ id: "1", projectId: "p-1", items: [makePRItem({ quantity: 1, estimatedUnitPrice: 500 })] }),
        makePR({ id: "2", projectId: "p-other", items: [makePRItem({ quantity: 1, estimatedUnitPrice: 999 })] })
      ],
      referenceDate: REF
    };
    const snap = computeProjectSnapshot(ctx);
    expect(snap.totalActual).toBe(100);
    expect(snap.totalCommitted).toBe(500);
  });

  it("returns null marginPct for internal project (plannedRevenue=0)", () => {
    const ctx: SnapshotContext = {
      project: makeProject({
        id: "p-1",
        plannedRevenue: 0,
        contractValue: 0
      }),
      costCodes: [],
      cashflowEntries: [],
      purchaseRequests: [],
      referenceDate: REF
    };
    expect(computeProjectSnapshot(ctx).marginPct).toBeNull();
  });

  it("uses planned cost as the forecast margin basis before actual cost exists", () => {
    const snap = computeProjectSnapshot({
      project: makeProject({
        id: "p-1",
        plannedCost: 100_000,
        plannedRevenue: 150_000,
        actualCost: 0
      }),
      costCodes: [],
      cashflowEntries: [],
      purchaseRequests: [],
      referenceDate: REF
    });

    expect(snap.marginPct).toBeCloseTo(33.333, 3);
  });

  it("uses Construction Planner BOQ linkage as a project-control baseline budget", () => {
    const snap = computeProjectSnapshot({
      project: makeProject({
        id: "p-1",
        plannedCost: 1_000,
        plannedRevenue: 1_000
      }),
      costCodes: [],
      cashflowEntries: [],
      purchaseRequests: [],
      boqProjectTasks: [
        createBoqProjectTask({
          id: "planner-task-1",
          projectId: "p-1",
          name: "Planner task",
          boqLinkage: [
            {
              id: "planner-boq-1-task-1",
              recordId: "planner-boq-1",
              boqItemId: "planner-boq-1",
              keynote: "1.1",
              boqKeynote: "1.1",
              boqCode: "1.1",
              item: "Planner BOQ item",
              boqItemName: "Planner BOQ item",
              boqName: "Planner BOQ item",
              unit: "work",
              boqUnit: "work",
              unitPrice: 1_000,
              boqUnitPrice: 1_000,
              costCodeId: "",
              costCodeCode: "",
              costCodeName: "",
              allocatedAmount: 1_000,
              linkedAt: "2026-05-24T00:00:00.000Z",
              updatedAt: "2026-05-24T00:00:00.000Z"
            }
          ]
        })
      ],
      referenceDate: REF
    });

    expect(snap.totalBudget).toBe(1_000);
    expect(snap.costCodeRollups).toHaveLength(1);
    expect(snap.costCodeRollups[0]).toMatchObject({
      costCodeId: "planner-baseline",
      costCodeName: "Construction Planner baseline",
      budget: 1_000,
      committed: 0,
      actual: 0
    });
  });

  it("keeps Construction Planner source links on baseline rollups", () => {
    const snap = computeProjectSnapshot({
      project: makeProject({
        id: "p-1",
        plannedCost: 1_000,
        plannedRevenue: 1_000
      }),
      costCodes: [],
      cashflowEntries: [],
      purchaseRequests: [],
      boqProjectTasks: [
        createBoqProjectTask({
          id: "planner-task-1",
          projectId: "p-1",
          name: "Planner task",
          boqLinkage: [
            {
              id: "planner-boq-1-task-1",
              recordId: "planner-boq-1",
              boqItemId: "planner-boq-1",
              keynote: "1.1",
              boqKeynote: "1.1",
              boqCode: "1.1",
              item: "Planner BOQ item",
              boqItemName: "Planner BOQ item",
              boqName: "Planner BOQ item",
              unit: "work",
              boqUnit: "work",
              unitPrice: 1_000,
              boqUnitPrice: 1_000,
              costCodeId: "",
              costCodeCode: "",
              costCodeName: "",
              allocatedAmount: 1_000,
              linkedAt: "2026-05-24T00:00:00.000Z",
              updatedAt: "2026-05-24T00:00:00.000Z"
            }
          ]
        })
      ],
      referenceDate: REF
    });

    expect(snap.costCodeRollups[0].sourceLinks).toEqual([
      {
        source: "construction_planner",
        taskId: "planner-task-1",
        taskName: "Planner task",
        projectId: "p-1",
        boqItemId: "planner-boq-1",
        boqCode: "1.1",
        boqName: "Planner BOQ item",
        amount: 1_000,
        costCodeId: "planner-baseline"
      }
    ]);
  });

  it("reconciles unlinked planner budget back to the project total", () => {
    const snap = computeProjectSnapshot({
      project: makeProject({
        id: "p-1",
        plannedCost: 1_200,
        plannedRevenue: 1_200
      }),
      costCodes: [],
      cashflowEntries: [],
      purchaseRequests: [],
      boqProjectTasks: [
        createBoqProjectTask({
          id: "planner-task-1",
          projectId: "p-1",
          name: "Planner task",
          boqLinkage: [
            {
              id: "planner-boq-1-task-1",
              recordId: "planner-boq-1",
              boqItemId: "planner-boq-1",
              keynote: "1.1",
              boqKeynote: "1.1",
              boqCode: "1.1",
              item: "Planner BOQ item",
              boqItemName: "Planner BOQ item",
              boqName: "Planner BOQ item",
              unit: "work",
              boqUnit: "work",
              unitPrice: 1_000,
              boqUnitPrice: 1_000,
              costCodeId: "",
              costCodeCode: "",
              costCodeName: "",
              allocatedAmount: 1_000,
              linkedAt: "2026-05-24T00:00:00.000Z",
              updatedAt: "2026-05-24T00:00:00.000Z"
            }
          ]
        })
      ],
      referenceDate: REF
    });

    expect(snap.totalBudget).toBe(1_200);
    expect(snap.costCodeRollups.some((rollup) => rollup.costCodeId === "planner-unlinked")).toBe(true);
  });

  it("orders costCodeRollups by spent% desc", () => {
    const ctx: SnapshotContext = {
      project: makeProject({ id: "p-1" }),
      costCodes: [
        makeCostCode({ code: "01-100" }),
        makeCostCode({ code: "02-200" }),
        makeCostCode({ code: "03-300" })
      ],
      cashflowEntries: [
        makeEntry({ costCodeId: "01-100", amount: 50 }),
        makeEntry({ costCodeId: "02-200", amount: 90 }),
        makeEntry({ costCodeId: "03-300", amount: 30 })
      ],
      purchaseRequests: [
        makePR({ id: "1", items: [makePRItem({ costCodeId: "01-100", quantity: 1, estimatedUnitPrice: 100 })] }),
        makePR({ id: "2", items: [makePRItem({ costCodeId: "02-200", quantity: 1, estimatedUnitPrice: 100 })] }),
        makePR({ id: "3", items: [makePRItem({ costCodeId: "03-300", quantity: 1, estimatedUnitPrice: 100 })] })
      ],
      referenceDate: REF
    };
    const snap = computeProjectSnapshot(ctx);
    expect(snap.costCodeRollups[0].costCodeId).toBe("02-200"); // 90% spent
    expect(snap.costCodeRollups[1].costCodeId).toBe("01-100"); // 50%
    expect(snap.costCodeRollups[2].costCodeId).toBe("03-300"); // 30%
  });

  it("flags isOverBudget when actual > budget", () => {
    const ctx: SnapshotContext = {
      project: makeProject({ id: "p-1" }),
      costCodes: [makeCostCode({ code: "01-100" })],
      cashflowEntries: [makeEntry({ costCodeId: "01-100", amount: 200 })],
      purchaseRequests: [
        makePR({ id: "1", items: [makePRItem({ costCodeId: "01-100", quantity: 1, estimatedUnitPrice: 100 })] })
      ],
      referenceDate: REF
    };
    const snap = computeProjectSnapshot(ctx);
    expect(snap.costCodeRollups[0].isOverBudget).toBe(true);
  });

  it("canonicalizes cost code ids from cashflow and PR codes into one rollup", () => {
    const costCode = makeCostCode({ id: "cc-structure", code: "02-200", name: "Structure" });
    const ctx: SnapshotContext = {
      project: makeProject({ id: "p-1" }),
      costCodes: [costCode],
      cashflowEntries: [
        makeEntry({ costCodeId: "cc-structure", amount: 60 })
      ],
      purchaseRequests: [
        makePR({
          id: "1",
          items: [makePRItem({ costCodeId: "02-200", quantity: 1, estimatedUnitPrice: 100 })]
        })
      ],
      referenceDate: REF
    };

    const snap = computeProjectSnapshot(ctx);

    expect(snap.costCodeRollups).toHaveLength(1);
    expect(snap.costCodeRollups[0].costCodeId).toBe("02-200");
    expect(snap.costCodeRollups[0].actual).toBe(60);
    expect(snap.costCodeRollups[0].committed).toBe(100);
  });
});

describe("generateAlerts", () => {
  function snapshotWith(overrides: Partial<ReturnType<typeof computeProjectSnapshot>> = {}) {
    const base = computeProjectSnapshot({
      project: makeProject({ id: "p-1" }),
      costCodes: [],
      cashflowEntries: [],
      purchaseRequests: [],
      referenceDate: REF
    });
    return { ...base, ...overrides };
  }

  it("emits over_budget alert for over-budget cost code", () => {
    const snap = snapshotWith({
      costCodeRollups: [
        {
          costCodeId: "01",
          costCodeName: "Test",
          category: "site",
          budget: 100,
          committed: 100,
          actual: 200,
          remaining: -100,
          variance: -100,
          variancePct: 200,
          spentPct: 200,
          isOverBudget: true
        }
      ]
    });
    const alerts = generateAlerts(snap, [], [], undefined, REF);
    expect(alerts.some((a) => a.type === "over_budget")).toBe(true);
  });

  it("emits near_budget at threshold (default 85%)", () => {
    const snap = snapshotWith({
      costCodeRollups: [
        {
          costCodeId: "01",
          costCodeName: "Test",
          category: "site",
          budget: 100,
          committed: 100,
          actual: 90,
          remaining: 10,
          variance: 10,
          variancePct: 90,
          spentPct: 90,
          isOverBudget: false
        }
      ]
    });
    const alerts = generateAlerts(snap, [], [], undefined, REF);
    expect(alerts.some((a) => a.type === "near_budget")).toBe(true);
  });

  it("emits overdue when daysRemaining < 0 and status normal", () => {
    const snap = snapshotWith({ daysRemaining: -10, status: "normal" });
    const alerts = generateAlerts(snap, [], [], undefined, REF);
    expect(alerts.some((a) => a.type === "overdue" && a.severity === "critical")).toBe(true);
  });

  it("does not emit overdue when status closed", () => {
    const snap = snapshotWith({ daysRemaining: -10, status: "closed" });
    const alerts = generateAlerts(snap, [], [], undefined, REF);
    expect(alerts.some((a) => a.type === "overdue")).toBe(false);
  });

  it("emits stale_pr for PR submitted > 30 days", () => {
    const oldPR = makePR({
      id: "old",
      status: "submitted",
      requestDate: "2026-03-01" // ~84 days before REF (2026-05-24)
    });
    const snap = snapshotWith();
    const alerts = generateAlerts(snap, [oldPR], [], undefined, REF);
    expect(alerts.some((a) => a.type === "stale_pr")).toBe(true);
  });

  it("respects custom stale threshold", () => {
    const recentPR = makePR({
      id: "recent",
      status: "submitted",
      requestDate: "2026-05-10" // 14 days before REF
    });
    const custom: ProjectControlSettings = {
      workspaceId: "",
      defaultReportType: "project_pl",
      alertThresholds: {
        ...DEFAULT_ALERT_THRESHOLDS,
        staleDaysPR: 7
      },
      updatedAt: ""
    };
    const snap = snapshotWith();
    const alerts = generateAlerts(snap, [recentPR], [], custom, REF);
    expect(alerts.some((a) => a.type === "stale_pr")).toBe(true);
  });

  it("emits low_margin when marginPct < threshold", () => {
    const snap = snapshotWith({
      marginPct: 5,
      totalRevenue: 100
    });
    const alerts = generateAlerts(snap, [], [], undefined, REF);
    const low = alerts.find((a) => a.type === "low_margin");
    expect(low).toBeDefined();
    expect(low?.severity).toBe("warn");
  });

  it("does not emit low_margin for draft baselines", () => {
    const snap = snapshotWith({
      marginPct: 0,
      totalRevenue: 100,
      status: "draft"
    });
    const alerts = generateAlerts(snap, [], [], undefined, REF);
    expect(alerts.some((a) => a.type === "low_margin")).toBe(false);
  });

  it("emits critical low_margin when marginPct < 0", () => {
    const snap = snapshotWith({
      marginPct: -5,
      totalRevenue: 100
    });
    const alerts = generateAlerts(snap, [], [], undefined, REF);
    const low = alerts.find((a) => a.type === "low_margin");
    expect(low?.severity).toBe("critical");
  });

  it("sorts alerts: critical → warn → info", () => {
    const snap = snapshotWith({
      daysRemaining: -10,
      status: "normal",
      costCodeRollups: [
        {
          costCodeId: "01",
          costCodeName: "x",
          category: "site",
          budget: 100,
          committed: 100,
          actual: 90,
          remaining: 10,
          variance: 10,
          variancePct: 90,
          spentPct: 90,
          isOverBudget: false
        }
      ]
    });
    const alerts = generateAlerts(snap, [], [], undefined, REF);
    expect(alerts[0].severity).toBe("critical");
    for (let i = 1; i < alerts.length; i += 1) {
      const prev = alerts[i - 1];
      const cur = alerts[i];
      const rank = { critical: 0, warn: 1, info: 2 } as const;
      expect(rank[cur.severity]).toBeGreaterThanOrEqual(rank[prev.severity]);
    }
  });
});

describe("Reports", () => {
  function reportCtx(): ReportContext {
    return {
      projects: [
        makeProject({ id: "p-1", code: "j-2601", plannedRevenue: 1000 }),
        makeProject({ id: "p-2", code: "j-2602", plannedRevenue: 500 })
      ],
      costCodes: [
        makeCostCode({ code: "01-100", name: "Site" }),
        makeCostCode({ code: "02-200", name: "Structure" })
      ],
      cashflowEntries: [
        makeEntry({ projectId: "p-1", direction: "income", category: "client_payment", amount: 600 }),
        makeEntry({ projectId: "p-1", direction: "expense", costCodeId: "01-100", supplierId: "s-1", amount: 300 }),
        makeEntry({ projectId: "p-2", direction: "expense", costCodeId: "02-200", supplierId: "s-2", amount: 200 })
      ],
      purchaseRequests: [
        makePR({
          id: "pr-1",
          projectId: "p-1",
          status: "approved",
          items: [makePRItem({ costCodeId: "01-100", quantity: 1, estimatedUnitPrice: 400 })]
        })
      ],
      suppliers: [
        makeSupplier({ id: "s-1", shortName: "SCC" }),
        makeSupplier({ id: "s-2", shortName: "TPI" })
      ],
      referenceDate: REF
    };
  }

  describe("Project P&L", () => {
    it("returns row per project with profit + margin", () => {
      const res = generateProjectPL("all", reportCtx());
      expect(res.rows).toHaveLength(2);
      const p1 = res.rows.find((r) => r.project_code === "j-2601");
      expect(p1?.actual_revenue).toBe(600);
      expect(p1?.actual_cost).toBe(300);
      expect(p1?.profit).toBe(300);
      expect(p1?.margin_pct).toBe(50);
    });

    it("filters by projectId", () => {
      const res = generateProjectPL("p-2", reportCtx());
      expect(res.rows).toHaveLength(1);
      expect(res.rows[0].project_code).toBe("j-2602");
    });

    it("returns 0 margin for projects without revenue", () => {
      const ctx = reportCtx();
      ctx.cashflowEntries = ctx.cashflowEntries.filter((e) => e.direction !== "income");
      const res = generateProjectPL("p-1", ctx);
      expect(res.rows[0].margin_pct).toBe(0);
    });
  });

  describe("Cashflow forecast", () => {
    it("includes only entries within horizon window", () => {
      const ctx: ReportContext = {
        ...reportCtx(),
        cashflowEntries: [
          makeEntry({ projectId: "p-1", status: "confirmed", entryDate: "2026-05-30", amount: 100, direction: "income", category: "client_payment" }),
          makeEntry({ projectId: "p-1", status: "confirmed", entryDate: "2027-01-01", amount: 999, direction: "income", category: "client_payment" }),
          makeEntry({ projectId: "p-1", status: "void", entryDate: "2026-06-01", amount: 555 })
        ]
      };
      const res = generateCashflowForecast("p-1", ctx, 90);
      // Window: 2026-05-24 → 2026-08-22. May 30 included; Jan 2027 excluded; void excluded
      expect(res.rows).toHaveLength(1);
      expect(res.rows[0].forecast_income).toBe(100);
    });
  });

  describe("Cost variance", () => {
    it("returns row per (project, cost code)", () => {
      const res = generateCostVariance("all", reportCtx());
      expect(res.rows.length).toBeGreaterThanOrEqual(2);
      expect(res.rows[0]).toHaveProperty("budget");
      expect(res.rows[0]).toHaveProperty("actual");
      expect(res.rows[0]).toHaveProperty("spent_pct");
    });
  });

  describe("Supplier spend", () => {
    it("aggregates by supplier over last 12 months, sorted desc", () => {
      const res = generateSupplierSpend("all", reportCtx());
      expect(res.rows).toHaveLength(2);
      expect(res.rows[0].total_spend).toBeGreaterThanOrEqual(res.rows[1].total_spend as number);
    });

    it("filters by project", () => {
      const res = generateSupplierSpend("p-1", reportCtx());
      expect(res.rows).toHaveLength(1);
      expect(res.rows[0].supplier_short).toBe("SCC");
    });

    it("excludes entries older than period", () => {
      const ctx: ReportContext = {
        ...reportCtx(),
        cashflowEntries: [
          makeEntry({ supplierId: "s-1", amount: 100, entryDate: "2020-01-01" })
        ]
      };
      const res = generateSupplierSpend("all", ctx, 12);
      expect(res.rows).toHaveLength(0);
    });
  });

  describe("PR aging", () => {
    it("returns PRs above threshold sorted by age desc", () => {
      const ctx: ReportContext = {
        ...reportCtx(),
        purchaseRequests: [
          makePR({ id: "old", status: "submitted", requestDate: "2026-03-01" }), // ~84 days
          makePR({ id: "recent", status: "submitted", requestDate: "2026-05-20" }) // 4 days
        ]
      };
      const res = generatePRAging("all", ctx, 14);
      expect(res.rows).toHaveLength(1);
      expect(res.rows[0].pr_no).toBe(ctx.purchaseRequests[0].prNo);
    });

    it("excludes terminal status PRs (closed/cancelled)", () => {
      const ctx: ReportContext = {
        ...reportCtx(),
        purchaseRequests: [
          makePR({ id: "1", status: "closed", requestDate: "2025-01-01" }),
          makePR({ id: "2", status: "cancelled", requestDate: "2025-01-01" })
        ]
      };
      const res = generatePRAging("all", ctx, 14);
      expect(res.rows).toHaveLength(0);
    });
  });
});

describe("summarizeWorkspaceControl", () => {
  it("counts over-budget projects + stale PRs + totals", () => {
    const ctx: ReportContext = {
      projects: [
        makeProject({ id: "p-1" }),
        makeProject({ id: "p-2" })
      ],
      costCodes: [makeCostCode({ code: "01-100" })],
      cashflowEntries: [
        makeEntry({ projectId: "p-1", costCodeId: "01-100", amount: 200 }) // over budget (100)
      ],
      purchaseRequests: [
        makePR({
          id: "pr-1",
          projectId: "p-1",
          status: "approved",
          items: [makePRItem({ costCodeId: "01-100", quantity: 1, estimatedUnitPrice: 100 })]
        }),
        makePR({
          id: "pr-stale",
          projectId: "p-1",
          status: "submitted",
          requestDate: "2026-01-01"
        })
      ],
      suppliers: [],
      referenceDate: REF
    };
    const summary = summarizeWorkspaceControl(ctx);
    expect(summary.projectsOverBudget).toBe(1);
    expect(summary.stalePRs).toBe(1);
    expect(summary.totalActualCost).toBe(200);
  });
});

describe("CSV export", () => {
  it("uses UTF-8 BOM for Thai characters in Excel", () => {
    const csv = rowsToCsv(["name", "amount"], [{ name: "ทดสอบ", amount: 100 }]);

    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain("ทดสอบ");
  });

  it("escapes commas and quotes in values", () => {
    const csv = rowsToCsv(
      ["name", "note"],
      [{ name: 'A "quoted" item', note: "one,two" }],
      { includeBom: false }
    );

    expect(csv).toBe('name,note\r\n"A ""quoted"" item","one,two"');
  });
});
