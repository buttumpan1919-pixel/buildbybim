import { describe, expect, it } from "vitest";
import {
  createBoqProjectTask,
  summarizeBoqTaskLinkage,
  upsertBoqProjectTask,
  upsertBoqTaskLinkage,
  type BoqTaskLinkageState
} from "./boqTaskLinkage";

describe("boqTaskLinkage", () => {
  it("stores cost code metadata on BOQ task allocations", () => {
    const task = createBoqProjectTask({ id: "task-1", name: "Structure task" });
    let state: BoqTaskLinkageState = { tasks: [], updatedAt: "" };
    state = upsertBoqProjectTask(state, task);
    state = upsertBoqTaskLinkage(
      state,
      "task-1",
      {
        id: "boq-1",
        keynote: "A3000",
        item: "Concrete slab",
        unit: "sq.m.",
        unitPrice: 970,
        costCodeId: "seed-02-400",
        costCodeCode: "02-400",
        costCodeName: "RC slab"
      },
      12000
    );

    expect(state.tasks[0].boqLinkage[0]).toMatchObject({
      boqItemId: "boq-1",
      costCodeId: "seed-02-400",
      costCodeCode: "02-400",
      costCodeName: "RC slab",
      allocatedAmount: 12000
    });
  });

  it("defaults cost code fields when older callers do not send them", () => {
    const task = createBoqProjectTask({ id: "task-legacy", name: "Legacy task" });
    let state: BoqTaskLinkageState = { tasks: [], updatedAt: "" };
    state = upsertBoqProjectTask(state, task);
    state = upsertBoqTaskLinkage(
      state,
      "task-legacy",
      {
        id: "legacy-boq",
        keynote: "A1000",
        item: "Legacy BOQ item",
        unit: "item",
        unitPrice: 100
      },
      100
    );

    expect(state.tasks[0].boqLinkage[0]).toMatchObject({
      costCodeId: "",
      costCodeCode: "",
      costCodeName: ""
    });
    expect(summarizeBoqTaskLinkage(state).linkedItemsCount).toBe(1);
  });
});
