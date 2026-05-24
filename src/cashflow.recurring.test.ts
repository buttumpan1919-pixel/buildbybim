import { beforeEach, describe, expect, it } from "vitest";
import {
  RECURRING_STORAGE_KEY,
  generateAllRecurring,
  generateEntriesFromTemplate,
  loadRecurringTemplates,
  normalizeRecurringTemplate,
  removeRecurringTemplate,
  saveRecurringTemplates,
  upsertRecurringTemplate,
  type RecurringFrequency,
  type RecurringTemplate,
  type RecurringTemplateState
} from "./cashflow.recurring";

function resetStorage() {
  if (typeof window !== "undefined") window.localStorage.clear();
}

function makeTemplate(overrides: Partial<RecurringTemplate> = {}): RecurringTemplate {
  return normalizeRecurringTemplate({
    workspaceId: "ws-1",
    name: "ค่าเช่าออฟฟิศ",
    direction: "expense",
    category: "office",
    amount: 10000,
    projectId: "",
    costCodeId: "",
    supplierId: "",
    description: "Office rent",
    frequency: "monthly",
    startDate: "2026-01-15",
    endDate: "",
    lastGeneratedDate: "",
    active: true,
    ...overrides
  });
}

describe("storage", () => {
  beforeEach(resetStorage);

  it("uses namespaced storage key", () => {
    expect(RECURRING_STORAGE_KEY).toBe("cashflow.recurring.v1");
  });

  it("loadRecurringTemplates returns empty by default", () => {
    expect(loadRecurringTemplates().templates).toEqual([]);
  });

  it("saveRecurringTemplates round-trips via adapter", () => {
    saveRecurringTemplates({
      templates: [makeTemplate({ name: "saved" })],
      updatedAt: new Date().toISOString()
    });
    expect(loadRecurringTemplates().templates[0].name).toBe("saved");
  });
});

describe("normalize", () => {
  it("defaults frequency to monthly when invalid", () => {
    const t = normalizeRecurringTemplate({
      frequency: "garbage" as unknown as RecurringFrequency
    });
    expect(t.frequency).toBe("monthly");
  });

  it("clamps negative amount to 0", () => {
    const t = normalizeRecurringTemplate({ amount: -100 });
    expect(t.amount).toBe(0);
  });

  it("defaults active to true when undefined", () => {
    const t = normalizeRecurringTemplate({});
    expect(t.active).toBe(true);
  });

  it("respects explicit active=false", () => {
    const t = normalizeRecurringTemplate({ active: false });
    expect(t.active).toBe(false);
  });
});

describe("upsertRecurringTemplate / removeRecurringTemplate", () => {
  it("prepends new template", () => {
    let state: RecurringTemplateState = { templates: [], updatedAt: "" };
    state = upsertRecurringTemplate(state, makeTemplate({ id: "1", name: "A" }));
    state = upsertRecurringTemplate(state, makeTemplate({ id: "2", name: "B" }));
    expect(state.templates[0].name).toBe("B");
  });

  it("updates existing by id", () => {
    let state: RecurringTemplateState = {
      templates: [makeTemplate({ id: "1", name: "old" })],
      updatedAt: ""
    };
    state = upsertRecurringTemplate(state, { id: "1", name: "new" });
    expect(state.templates[0].name).toBe("new");
  });

  it("removeRecurringTemplate by id", () => {
    let state: RecurringTemplateState = {
      templates: [makeTemplate({ id: "1" }), makeTemplate({ id: "2" })],
      updatedAt: ""
    };
    state = removeRecurringTemplate(state, "1");
    expect(state.templates.map((t) => t.id)).toEqual(["2"]);
  });
});

describe("generateEntriesFromTemplate", () => {
  it("generates entries for past monthly periods since startDate", () => {
    const template = makeTemplate({
      id: "t1",
      frequency: "monthly",
      startDate: "2026-01-15",
      lastGeneratedDate: ""
    });
    const result = generateEntriesFromTemplate(
      template,
      new Date("2026-04-20T00:00:00Z")
    );
    // Jan 15, Feb 15, Mar 15, Apr 15 → 4 entries
    expect(result.generatedEntries).toHaveLength(4);
    expect(result.generatedEntries[0].entryDate).toBe("2026-01-15");
    expect(result.generatedEntries[3].entryDate).toBe("2026-04-15");
    expect(result.template.lastGeneratedDate).toBe("2026-04-15");
  });

  it("resumes from lastGeneratedDate not startDate", () => {
    const template = makeTemplate({
      frequency: "monthly",
      startDate: "2026-01-15",
      lastGeneratedDate: "2026-02-15"
    });
    const result = generateEntriesFromTemplate(
      template,
      new Date("2026-04-20T00:00:00Z")
    );
    // Resume = next period after Feb 15 = Mar 15, Apr 15 → 2 entries
    expect(result.generatedEntries).toHaveLength(2);
    expect(result.generatedEntries[0].entryDate).toBe("2026-03-15");
  });

  it("skips inactive templates", () => {
    const template = makeTemplate({ active: false });
    expect(
      generateEntriesFromTemplate(template, new Date("2026-04-20Z"))
        .generatedEntries
    ).toHaveLength(0);
  });

  it("respects endDate (stops generating after end)", () => {
    const template = makeTemplate({
      frequency: "monthly",
      startDate: "2026-01-15",
      endDate: "2026-02-28",
      lastGeneratedDate: ""
    });
    const result = generateEntriesFromTemplate(
      template,
      new Date("2026-06-15T00:00:00Z")
    );
    // Only Jan 15 + Feb 15 (Mar 15 > endDate)
    expect(result.generatedEntries).toHaveLength(2);
    expect(result.generatedEntries[1].entryDate).toBe("2026-02-15");
  });

  it("sets recurringTemplateId on generated entries", () => {
    const template = makeTemplate({ id: "tpl-77", startDate: "2026-04-01" });
    const result = generateEntriesFromTemplate(
      template,
      new Date("2026-04-15T00:00:00Z")
    );
    expect(result.generatedEntries[0].recurringTemplateId).toBe("tpl-77");
  });

  it("entries default to draft status (user reviews + confirms)", () => {
    const template = makeTemplate({ startDate: "2026-04-01" });
    const result = generateEntriesFromTemplate(
      template,
      new Date("2026-04-15T00:00:00Z")
    );
    expect(result.generatedEntries[0].status).toBe("draft");
  });

  it("idempotent — second call yields zero new entries", () => {
    const template = makeTemplate({
      frequency: "monthly",
      startDate: "2026-01-15",
      lastGeneratedDate: ""
    });
    const ref = new Date("2026-04-20T00:00:00Z");
    const first = generateEntriesFromTemplate(template, ref);
    const second = generateEntriesFromTemplate(first.template, ref);
    expect(first.generatedEntries.length).toBeGreaterThan(0);
    expect(second.generatedEntries).toHaveLength(0);
    expect(second.template.lastGeneratedDate).toBe(first.template.lastGeneratedDate);
  });

  it("supports weekly frequency", () => {
    const template = makeTemplate({
      frequency: "weekly",
      startDate: "2026-04-01",
      lastGeneratedDate: ""
    });
    const result = generateEntriesFromTemplate(
      template,
      new Date("2026-04-22T00:00:00Z")
    );
    // Apr 1, 8, 15, 22 → 4 entries
    expect(result.generatedEntries).toHaveLength(4);
  });

  it("supports quarterly frequency", () => {
    const template = makeTemplate({
      frequency: "quarterly",
      startDate: "2026-01-15",
      lastGeneratedDate: ""
    });
    const result = generateEntriesFromTemplate(
      template,
      new Date("2026-08-20T00:00:00Z")
    );
    // Jan 15, Apr 15, Jul 15 → 3 entries
    expect(result.generatedEntries).toHaveLength(3);
  });

  it("supports yearly frequency", () => {
    const template = makeTemplate({
      frequency: "yearly",
      startDate: "2024-06-01",
      lastGeneratedDate: ""
    });
    const result = generateEntriesFromTemplate(
      template,
      new Date("2026-07-01T00:00:00Z")
    );
    // 2024-06-01, 2025-06-01, 2026-06-01 → 3 entries
    expect(result.generatedEntries).toHaveLength(3);
  });

  it("zero entries when referenceDate before startDate", () => {
    const template = makeTemplate({ startDate: "2026-12-01" });
    const result = generateEntriesFromTemplate(
      template,
      new Date("2026-01-01T00:00:00Z")
    );
    expect(result.generatedEntries).toHaveLength(0);
  });

  it("propagates projectId + costCodeId + supplierId to generated entries", () => {
    const template = makeTemplate({
      projectId: "p-1",
      costCodeId: "01-100",
      supplierId: "s-1",
      startDate: "2026-04-01"
    });
    const result = generateEntriesFromTemplate(
      template,
      new Date("2026-04-15T00:00:00Z")
    );
    const entry = result.generatedEntries[0];
    expect(entry.projectId).toBe("p-1");
    expect(entry.costCodeId).toBe("01-100");
    expect(entry.supplierId).toBe("s-1");
    expect(entry.amount).toBe(10000);
  });
});

describe("generateAllRecurring", () => {
  it("processes all templates and aggregates generated entries", () => {
    const state: RecurringTemplateState = {
      templates: [
        makeTemplate({ id: "t1", startDate: "2026-04-01", lastGeneratedDate: "" }),
        makeTemplate({ id: "t2", startDate: "2026-04-15", lastGeneratedDate: "" }),
        makeTemplate({ id: "t3", active: false, startDate: "2026-04-01" })
      ],
      updatedAt: ""
    };
    const result = generateAllRecurring(state, new Date("2026-04-30T00:00:00Z"));
    // t1: 1 (Apr 1), t2: 1 (Apr 15), t3: skip (inactive) — 2 total
    expect(result.generatedEntries).toHaveLength(2);
    expect(result.state.templates).toHaveLength(3);
  });
});
