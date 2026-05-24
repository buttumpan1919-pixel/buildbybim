import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadBoqTaskLinkageState } from "../../../boqTaskLinkage";
import { loadProjects } from "../../../projects";
import {
  LocalStorageAdapter,
  defaultStorageAdapter,
  setStorageAdapter
} from "../../../storageAdapter";
import { loadCustomBoqRows } from "../boq-data/boqDataService";
import { constructionPlanningSeed } from "./constructionPlanningSeed";
import {
  buildPlannerProjectId,
  parseBoqRowsFromFormula,
  syncConstructionPlannerToWorkspace
} from "./constructionPlannerIntegration";

function resetStorage() {
  if (typeof window !== "undefined") {
    window.localStorage.clear();
  }
  setStorageAdapter(new LocalStorageAdapter());
}

describe("constructionPlannerIntegration", () => {
  beforeEach(resetStorage);

  afterEach(() => {
    if (typeof window !== "undefined") {
      window.localStorage.clear();
    }
    setStorageAdapter(defaultStorageAdapter);
  });

  it("syncs the planner preview into Projects as a reusable baseline", () => {
    const result = syncConstructionPlannerToWorkspace(constructionPlanningSeed);
    const projectState = loadProjects();

    expect(result.projectCreated).toBe(true);
    expect(result.project.id).toBe(buildPlannerProjectId(constructionPlanningSeed));
    expect(projectState.projects).toHaveLength(1);
    expect(projectState.projects[0]).toMatchObject({
      id: result.project.id,
      code: "cp-2401",
      contractValue: constructionPlanningSeed.project.totalAmount,
      plannedCost: constructionPlanningSeed.project.totalAmount,
      plannedRevenue: constructionPlanningSeed.project.totalAmount,
      startDate: constructionPlanningSeed.project.startDate,
      endDate: constructionPlanningSeed.project.endDate,
      status: "draft",
      hasBudget: true
    });
    expect(projectState.projects[0].notes).toContain("construction-planner.preview.v1");
  });

  it("syncs schedule tasks, BOQ catalog rows, and formula-based task links", () => {
    const result = syncConstructionPlannerToWorkspace(constructionPlanningSeed);
    const linkageState = loadBoqTaskLinkageState();
    const customBoqRows = loadCustomBoqRows();

    expect(result.taskCount).toBe(constructionPlanningSeed.tasks.length);
    expect(result.boqCatalogCount).toBe(constructionPlanningSeed.boqItems.length);
    expect(result.linkedBoqItemsCount).toBeGreaterThan(0);
    expect(linkageState.tasks).toHaveLength(constructionPlanningSeed.tasks.length);
    expect(linkageState.tasks.every((task) => task.projectId === result.project.id)).toBe(true);
    expect(linkageState.tasks.some((task) => task.boqLinkage.length > 0)).toBe(true);
    expect(customBoqRows).toHaveLength(constructionPlanningSeed.boqItems.length);
    expect(customBoqRows[0].source).toContain("construction-planner:");
  });

  it("is idempotent when syncing the same workbook more than once", () => {
    const first = syncConstructionPlannerToWorkspace(constructionPlanningSeed);
    const second = syncConstructionPlannerToWorkspace(constructionPlanningSeed);

    expect(first.project.id).toBe(second.project.id);
    expect(second.projectCreated).toBe(false);
    expect(loadProjects().projects).toHaveLength(1);
    expect(loadBoqTaskLinkageState().tasks).toHaveLength(constructionPlanningSeed.tasks.length);
    expect(loadCustomBoqRows()).toHaveLength(constructionPlanningSeed.boqItems.length);
  });

  it("extracts BOQ row references from direct cells and ranges", () => {
    expect(parseBoqRowsFromFormula("=BOQ!N9")).toEqual([9]);
    expect(parseBoqRowsFromFormula("=SUM(BOQ!N9:N11)+BOQ!N14")).toEqual([9, 10, 11, 14]);
    expect(parseBoqRowsFromFormula("=SUM(L9:L11)")).toEqual([]);
  });
});
