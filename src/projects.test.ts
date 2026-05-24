import { beforeEach, describe, expect, it } from "vitest";
import {
  PROJECTS_STORAGE_KEY,
  applyAutoStatus,
  computeProject,
  createProject,
  createSeedProjects,
  detectCustomerType,
  ensureSeedProjects,
  loadProjects,
  normalizeProjectListState,
  removeProject,
  saveProjects,
  suggestNextProjectCode,
  summarizeProjectList,
  upsertProject,
  type Project,
  type ProjectListState
} from "./projects";

function resetStorage() {
  if (typeof window !== "undefined") {
    window.localStorage.clear();
  }
}

function baseProject(overrides: Partial<Project> = {}): Project {
  return createProject({
    code: "j-2600",
    name: "Test project",
    contractValue: 1_000_000,
    plannedCost: 800_000,
    actualCost: 400_000,
    plannedRevenue: 1_000_000,
    actualRevenue: 500_000,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    status: "normal",
    hasBudget: true,
    ...overrides
  });
}

describe("storage", () => {
  beforeEach(resetStorage);

  it("uses namespaced storage key", () => {
    expect(PROJECTS_STORAGE_KEY).toBe("projects.list.v1");
  });

  it("loadProjects returns empty list when storage is empty", () => {
    const state = loadProjects();
    expect(state.projects).toEqual([]);
    expect(state.updatedAt).toBe("");
  });

  it("saveProjects round-trips via storage adapter", () => {
    const state: ProjectListState = {
      projects: [baseProject({ code: "j-2601", name: "saved" })],
      updatedAt: new Date().toISOString()
    };
    saveProjects(state);
    const reloaded = loadProjects();
    expect(reloaded.projects).toHaveLength(1);
    expect(reloaded.projects[0].code).toBe("j-2601");
    expect(reloaded.projects[0].name).toBe("saved");
  });
});

describe("normalizeProjectListState", () => {
  it("accepts a bare projects array", () => {
    const state = normalizeProjectListState([
      { code: "j-2600", name: "A" },
      { code: "j-2601", name: "B" }
    ]);
    expect(state.projects).toHaveLength(2);
    expect(state.projects[0].code).toBe("j-2600");
  });

  it("defaults invalid status to draft", () => {
    const state = normalizeProjectListState({ projects: [{ status: "garbage" }] });
    expect(state.projects[0].status).toBe("draft");
  });

  it("clamps negative amounts to zero", () => {
    const state = normalizeProjectListState({
      projects: [{ contractValue: -100, plannedCost: -50, actualCost: -1 }]
    });
    expect(state.projects[0].contractValue).toBe(0);
    expect(state.projects[0].plannedCost).toBe(0);
    expect(state.projects[0].actualCost).toBe(0);
  });

  it("forces hasBudget false when plannedCost is zero", () => {
    const state = normalizeProjectListState({
      projects: [{ plannedCost: 0, hasBudget: true }]
    });
    expect(state.projects[0].hasBudget).toBe(false);
  });

  it("returns empty list for non-object input", () => {
    expect(normalizeProjectListState(null).projects).toEqual([]);
    expect(normalizeProjectListState("oops").projects).toEqual([]);
  });
});

describe("upsertProject / removeProject", () => {
  beforeEach(resetStorage);

  it("appends new project to front of list", () => {
    let state: ProjectListState = { projects: [], updatedAt: "" };
    state = upsertProject(state, baseProject({ code: "j-2600", name: "first" }));
    state = upsertProject(state, baseProject({ code: "j-2601", name: "second" }));
    expect(state.projects).toHaveLength(2);
    expect(state.projects[0].name).toBe("second");
  });

  it("updates existing project by id", () => {
    const original = baseProject({ name: "original" });
    let state: ProjectListState = { projects: [original], updatedAt: "" };
    state = upsertProject(state, { ...original, name: "renamed" });
    expect(state.projects).toHaveLength(1);
    expect(state.projects[0].name).toBe("renamed");
  });

  it("removes by id; no-op when missing", () => {
    let state: ProjectListState = {
      projects: [baseProject({ id: "p1" }), baseProject({ id: "p2" })],
      updatedAt: ""
    };
    state = removeProject(state, "p1");
    expect(state.projects.map((p) => p.id)).toEqual(["p2"]);
    state = removeProject(state, "nonexistent");
    expect(state.projects.map((p) => p.id)).toEqual(["p2"]);
  });
});

describe("suggestNextProjectCode", () => {
  it("increments from max seq within current year", () => {
    const ref = new Date("2026-05-24T00:00:00Z");
    const code = suggestNextProjectCode(
      [{ code: "j-2600" }, { code: "j-2601" }, { code: "j-2603" }],
      "j-",
      ref
    );
    expect(code).toBe("j-2604");
  });

  it("starts at {YY}01 when no codes exist for current year", () => {
    const ref = new Date("2026-05-24T00:00:00Z");
    expect(suggestNextProjectCode([], "j-", ref)).toBe("j-2601");
  });

  it("ignores codes from other years (prefix mismatch)", () => {
    const ref = new Date("2026-05-24T00:00:00Z");
    const code = suggestNextProjectCode([{ code: "j-2599" }, { code: "j-2598" }], "j-", ref);
    expect(code).toBe("j-2601");
  });

  it("respects custom prefix", () => {
    const ref = new Date("2026-05-24T00:00:00Z");
    expect(suggestNextProjectCode([], "p-", ref)).toBe("p-2601");
  });

  it("rolls year on Jan 1", () => {
    const ref = new Date("2027-01-01T00:00:00Z");
    expect(suggestNextProjectCode([{ code: "j-2699" }], "j-", ref)).toBe("j-2701");
  });
});

describe("computeProject", () => {
  it("computes negative daysRemaining for past endDate", () => {
    const ref = new Date("2026-05-24T00:00:00Z");
    const computed = computeProject(baseProject({ endDate: "2026-04-30" }), ref);
    expect(computed.daysRemaining).toBeLessThan(0);
    expect(computed.isOverdue).toBe(true);
  });

  it("computes positive daysRemaining for future endDate", () => {
    const ref = new Date("2026-05-24T00:00:00Z");
    const computed = computeProject(baseProject({ endDate: "2026-08-30" }), ref);
    expect(computed.daysRemaining).toBeGreaterThan(0);
    expect(computed.isOverdue).toBe(false);
  });

  it("returns positive marginPct when plannedRevenue > actualCost", () => {
    const computed = computeProject(
      baseProject({ plannedRevenue: 1_000_000, actualCost: 800_000 })
    );
    expect(computed.marginPct).toBeCloseTo(20, 1);
  });

  it("returns null marginPct when plannedRevenue is zero (internal project)", () => {
    const computed = computeProject(
      baseProject({ plannedRevenue: 0, contractValue: 0, name: "internal" })
    );
    expect(computed.marginPct).toBeNull();
  });

  it("flags isOverBudget when actualCost exceeds plannedCost and hasBudget", () => {
    const computed = computeProject(
      baseProject({ plannedCost: 800_000, actualCost: 900_000, hasBudget: true })
    );
    expect(computed.isOverBudget).toBe(true);
  });

  it("does not flag isOverBudget when hasBudget is false", () => {
    const computed = computeProject(
      baseProject({ plannedCost: 0, actualCost: 100_000, hasBudget: false })
    );
    expect(computed.isOverBudget).toBe(false);
  });

  it("does not flag isOverdue when status is closed", () => {
    const ref = new Date("2026-05-24T00:00:00Z");
    const computed = computeProject(
      baseProject({ endDate: "2025-12-31", status: "closed" }),
      ref
    );
    expect(computed.daysRemaining).toBeLessThan(0);
    expect(computed.isOverdue).toBe(false);
  });

  it("computes budgetRemaining as plannedCost - actualCost", () => {
    const computed = computeProject(
      baseProject({ plannedCost: 1_000_000, actualCost: 750_000 })
    );
    expect(computed.budgetRemaining).toBe(250_000);
  });
});

describe("applyAutoStatus", () => {
  it("transitions normal → delayed when overdue", () => {
    const ref = new Date("2026-05-24T00:00:00Z");
    const next = applyAutoStatus(
      baseProject({ status: "normal", endDate: "2026-04-30" }),
      ref
    );
    expect(next.status).toBe("delayed");
  });

  it("transitions normal → delayed when over 5% budget", () => {
    const ref = new Date("2026-05-24T00:00:00Z");
    const next = applyAutoStatus(
      baseProject({
        status: "normal",
        endDate: "2026-12-31",
        plannedCost: 1_000_000,
        actualCost: 1_060_000,
        hasBudget: true
      }),
      ref
    );
    expect(next.status).toBe("delayed");
  });

  it("does not transition when on track and under budget", () => {
    const ref = new Date("2026-05-24T00:00:00Z");
    const next = applyAutoStatus(
      baseProject({
        status: "normal",
        endDate: "2026-12-31",
        plannedCost: 1_000_000,
        actualCost: 500_000,
        hasBudget: true
      }),
      ref
    );
    expect(next.status).toBe("normal");
  });

  it("never auto-transitions to closed/cancelled", () => {
    const ref = new Date("2026-05-24T00:00:00Z");
    const next = applyAutoStatus(
      baseProject({ status: "normal", endDate: "2020-01-01" }),
      ref
    );
    expect(next.status).not.toBe("closed");
    expect(next.status).not.toBe("cancelled");
  });

  it("leaves draft / closed / cancelled / delayed untouched", () => {
    const ref = new Date("2026-05-24T00:00:00Z");
    for (const status of ["draft", "delayed", "closed", "cancelled"] as const) {
      const next = applyAutoStatus(
        baseProject({ status, endDate: "2020-01-01", actualCost: 999_999 }),
        ref
      );
      expect(next.status).toBe(status);
    }
  });
});

describe("detectCustomerType", () => {
  it("detects gov from Thai prefixes", () => {
    expect(detectCustomerType("องค์การบริหารส่วนตำบลอุ่มเม่า")).toBe("gov");
    expect(detectCustomerType("เทศบาลเมืองหนองคาย")).toBe("gov");
    expect(detectCustomerType("กรมโยธาธิการ")).toBe("gov");
  });

  it("detects corporate from Thai company prefixes", () => {
    expect(detectCustomerType("บจก. ธ.ธ.ธ. พัฒนาที่ดิน")).toBe("corporate");
    expect(detectCustomerType("บริษัท ปูนซีเมนต์ไทย")).toBe("corporate");
    expect(detectCustomerType("หจก. สามพี่น้อง")).toBe("corporate");
  });

  it("detects corporate from English suffixes", () => {
    expect(detectCustomerType("Buildbybim Co., Ltd.")).toBe("corporate");
    expect(detectCustomerType("Acme Inc.")).toBe("corporate");
  });

  it("defaults to individual for personal names", () => {
    expect(detectCustomerType("คุณสุขฤดี ถิ่นวังสะพุง")).toBe("individual");
    expect(detectCustomerType("John Smith")).toBe("individual");
  });

  it("returns individual for empty string", () => {
    expect(detectCustomerType("")).toBe("individual");
    expect(detectCustomerType("   ")).toBe("individual");
  });
});

describe("summarizeProjectList", () => {
  it("counts each status bucket", () => {
    const ref = new Date("2026-05-24T00:00:00Z");
    const state: ProjectListState = {
      projects: [
        baseProject({ status: "normal" }),
        baseProject({ status: "normal" }),
        baseProject({ status: "delayed" }),
        baseProject({ status: "closed" }),
        baseProject({ status: "cancelled" })
      ],
      updatedAt: ""
    };
    const summary = summarizeProjectList(state, ref);
    expect(summary.total).toBe(5);
    expect(summary.normal).toBe(2);
    expect(summary.delayed).toBe(1);
    expect(summary.closed).toBe(1);
    expect(summary.cancelled).toBe(1);
  });

  it("sums financial totals", () => {
    const state: ProjectListState = {
      projects: [
        baseProject({ contractValue: 1_000_000, plannedCost: 800_000, actualCost: 400_000 }),
        baseProject({ contractValue: 2_000_000, plannedCost: 1_500_000, actualCost: 1_000_000 })
      ],
      updatedAt: ""
    };
    const summary = summarizeProjectList(state);
    expect(summary.totalContractValue).toBe(3_000_000);
    expect(summary.totalPlannedCost).toBe(2_300_000);
    expect(summary.totalActualCost).toBe(1_400_000);
  });

  it("counts overdueActive and overBudgetActive", () => {
    const ref = new Date("2026-05-24T00:00:00Z");
    const state: ProjectListState = {
      projects: [
        baseProject({ status: "normal", endDate: "2026-04-30" }), // overdue
        baseProject({
          status: "normal",
          endDate: "2026-12-31",
          plannedCost: 100,
          actualCost: 200,
          hasBudget: true
        }), // over budget
        baseProject({ status: "closed", endDate: "2026-04-30" }) // overdue but closed
      ],
      updatedAt: ""
    };
    const summary = summarizeProjectList(state, ref);
    expect(summary.overdueActive).toBe(1);
    expect(summary.overBudgetActive).toBe(1);
  });
});

describe("createSeedProjects + ensureSeedProjects", () => {
  beforeEach(resetStorage);

  it("createSeedProjects returns 6 sample projects", () => {
    const seeds = createSeedProjects("ws-test");
    expect(seeds).toHaveLength(6);
    expect(seeds.map((p) => p.code)).toEqual([
      "j-2600",
      "j-2599",
      "j-2598",
      "j-2597",
      "j-2596",
      "j-2595"
    ]);
    expect(seeds.every((p) => p.workspaceId === "ws-test")).toBe(true);
  });

  it("ensureSeedProjects seeds storage on first run", () => {
    const state = ensureSeedProjects("ws-test");
    expect(state.projects).toHaveLength(6);
    const reloaded = loadProjects();
    expect(reloaded.projects).toHaveLength(6);
  });

  it("ensureSeedProjects is idempotent", () => {
    ensureSeedProjects("ws-test");
    const state = upsertProject(loadProjects(), baseProject({ code: "j-2700", name: "added" }));
    saveProjects(state);
    const after = ensureSeedProjects("ws-test");
    expect(after.projects).toHaveLength(7);
    expect(after.projects.some((p) => p.code === "j-2700")).toBe(true);
  });
});
