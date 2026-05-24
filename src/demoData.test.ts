import { beforeEach, describe, expect, it } from "vitest";
import { loadCashflowState } from "./cashflow";
import { computeProjectSnapshot } from "./projectControl";
import { createProject, loadProjects, saveProjects } from "./projects";
import { loadPRs, loadRFQs } from "./procurement";
import { loadWorkspaceData } from "./storage";
import { loadSuppliers } from "./suppliers";
import { ensureSeedCostCodes } from "./costCodes";
import {
  DEMO_PROJECT_ID,
  resetDemoScenario,
  seedDemoScenario
} from "./demoData";

describe("seedDemoScenario", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("seeds linked demo data across project, supplier, procurement, cashflow, and defect modules", () => {
    const result = seedDemoScenario();

    expect(result).toMatchObject({
      projects: 2,
      suppliers: 5,
      purchaseRequests: 3,
      rfqs: 1,
      cashflowEntries: 6,
      workspaceDocuments: 1,
      defects: 3
    });

    expect(loadProjects().projects.some((project) => project.id === DEMO_PROJECT_ID)).toBe(true);
    expect(loadSuppliers().suppliers.filter((supplier) => supplier.id.startsWith("demo-"))).toHaveLength(5);
    expect(loadPRs().prs.filter((pr) => pr.id.startsWith("demo-"))).toHaveLength(3);
    expect(loadRFQs().rfqs.filter((rfq) => rfq.id.startsWith("demo-"))).toHaveLength(1);
    expect(loadCashflowState().entries.filter((entry) => entry.id.startsWith("demo-"))).toHaveLength(6);
    expect(loadWorkspaceData().defects.filter((defect) => defect.id.startsWith("demo-"))).toHaveLength(3);
  });

  it("is idempotent and creates a project-control snapshot with useful alerts", () => {
    seedDemoScenario();
    seedDemoScenario();

    const projects = loadProjects().projects;
    const cashflow = loadCashflowState();
    const prs = loadPRs();
    const costCodes = ensureSeedCostCodes().codes;
    const project = projects.find((item) => item.id === DEMO_PROJECT_ID);

    expect(project).toBeDefined();
    expect(projects.filter((item) => item.id.startsWith("demo-"))).toHaveLength(2);
    expect(cashflow.entries.filter((entry) => entry.id.startsWith("demo-"))).toHaveLength(6);
    expect(prs.prs.filter((pr) => pr.id.startsWith("demo-"))).toHaveLength(3);

    const snapshot = computeProjectSnapshot({
      project: project!,
      costCodes,
      cashflowEntries: cashflow.entries,
      purchaseRequests: prs.prs,
      referenceDate: new Date("2026-05-24T00:00:00.000Z")
    });

    expect(snapshot.totalActual).toBe(1_698_000);
    expect(snapshot.totalPaidRevenue).toBe(1_260_000);
    expect(snapshot.alerts.some((alert) => alert.type === "over_budget")).toBe(true);
    expect(snapshot.alerts.some((alert) => alert.type === "stale_pr")).toBe(true);
  });

  it("resets only demo records and preserves non-demo project data", () => {
    seedDemoScenario();

    const userProject = createProject({
      id: "user-project-main",
      workspaceId: "user-workspace",
      code: "u-2601",
      name: "User Project Main",
      clientId: "user-client",
      clientName: "Real Client",
      customerType: "corporate",
      contractValue: 900_000,
      plannedCost: 650_000,
      actualCost: 0,
      plannedRevenue: 900_000,
      actualRevenue: 0,
      startDate: "2026-05-01",
      endDate: "2026-07-01",
      status: "normal",
      hasBudget: true,
      notes: "Must survive demo reset"
    });
    const currentProjects = loadProjects();
    saveProjects({
      projects: [userProject, ...currentProjects.projects],
      updatedAt: new Date().toISOString()
    });

    const result = resetDemoScenario();

    expect(result).toMatchObject({
      projects: 2,
      suppliers: 5,
      purchaseRequests: 3,
      rfqs: 1,
      cashflowEntries: 6,
      supplierPriceHistory: 3,
      workspaceDocuments: 1,
      workspaceClients: 1,
      workspaceProjects: 1,
      employees: 3,
      siteTeams: 1,
      defects: 3
    });

    expect(loadProjects().projects.some((project) => project.id === "user-project-main")).toBe(true);
    expect(loadProjects().projects.some((project) => project.id.startsWith("demo-"))).toBe(false);
    expect(loadSuppliers().suppliers.some((supplier) => supplier.id.startsWith("demo-"))).toBe(false);
    expect(loadSuppliers().priceHistory.some((entry) => entry.id.startsWith("demo-"))).toBe(false);
    expect(loadPRs().prs.some((pr) => pr.id.startsWith("demo-"))).toBe(false);
    expect(loadRFQs().rfqs.some((rfq) => rfq.id.startsWith("demo-"))).toBe(false);
    expect(loadCashflowState().entries.some((entry) => entry.id.startsWith("demo-"))).toBe(false);
    expect(loadWorkspaceData().documents.some((document) => document.id.startsWith("demo-"))).toBe(false);
    expect(loadWorkspaceData().defects.some((defect) => defect.id.startsWith("demo-"))).toBe(false);
  });
});
