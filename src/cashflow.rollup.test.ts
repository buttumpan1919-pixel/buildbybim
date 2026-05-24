import { describe, expect, it } from "vitest";
import {
  createCashflowEntry,
  type CashflowEntry,
  type CashflowState
} from "./cashflow";
import {
  buildSupplierPriceHistoryEntryFromCashflow,
  computeProjectRollup,
  filterCashflowEntries,
  removeCashflowPriceHistory,
  syncProjectFromCashflow,
  syncSupplierPriceHistoryFromCashflow
} from "./cashflow.rollup";
import type { ProjectListState } from "./projects";
import type { SupplierState } from "./suppliers";

function entry(overrides: Partial<CashflowEntry> = {}): CashflowEntry {
  return createCashflowEntry({
    direction: "expense",
    category: "material",
    amount: 100,
    description: "cement",
    projectId: "p1",
    costCodeId: "cc-structure",
    supplierId: "s1",
    entryDate: "2026-05-10",
    status: "confirmed",
    ...overrides
  });
}

function cashflow(entries: CashflowEntry[]): CashflowState {
  return { entries, updatedAt: "2026-05-10T00:00:00.000Z" };
}

function projects(): ProjectListState {
  return {
    projects: [
      {
        id: "p1",
        workspaceId: "local",
        code: "j-2601",
        name: "Project 1",
        clientId: "",
        clientName: "",
        customerType: null,
        contractValue: 1000,
        plannedCost: 700,
        actualCost: 0,
        plannedRevenue: 1000,
        actualRevenue: 0,
        startDate: "2026-05-01",
        endDate: "2026-06-01",
        status: "normal",
        hasBudget: true,
        notes: "",
        createdAt: "2026-05-01T00:00:00.000Z",
        updatedAt: "2026-05-01T00:00:00.000Z"
      },
      {
        id: "p2",
        workspaceId: "local",
        code: "j-2602",
        name: "Project 2",
        clientId: "",
        clientName: "",
        customerType: null,
        contractValue: 500,
        plannedCost: 300,
        actualCost: 12,
        plannedRevenue: 500,
        actualRevenue: 34,
        startDate: "2026-05-01",
        endDate: "2026-06-01",
        status: "normal",
        hasBudget: true,
        notes: "",
        createdAt: "2026-05-01T00:00:00.000Z",
        updatedAt: "2026-05-01T00:00:00.000Z"
      }
    ],
    updatedAt: "2026-05-01T00:00:00.000Z"
  };
}

describe("computeProjectRollup", () => {
  it("sums confirmed expenses and income by project", () => {
    const rollup = computeProjectRollup("p1", [
      entry({ amount: 150, direction: "expense", costCodeId: "cc-structure" }),
      entry({
        amount: 900,
        direction: "income",
        category: "client_payment",
        costCodeId: "",
        entryDate: "2026-05-12"
      }),
      entry({ amount: 999, projectId: "p2" })
    ]);

    expect(rollup.actualCost).toBe(150);
    expect(rollup.actualRevenue).toBe(900);
    expect(rollup.costCodeRollups["cc-structure"]).toBe(150);
    expect(rollup.lastEntryAt).toBe("2026-05-12");
    expect(rollup.confirmedEntryCount).toBe(2);
  });

  it("excludes draft and void entries", () => {
    const rollup = computeProjectRollup("p1", [
      entry({ amount: 100, status: "draft" }),
      entry({ amount: 200, status: "void" }),
      entry({ amount: 300, status: "confirmed" })
    ]);

    expect(rollup.actualCost).toBe(300);
  });
});

describe("syncProjectFromCashflow", () => {
  it("updates only the matching project's actual cost and revenue", () => {
    const next = syncProjectFromCashflow(
      "p1",
      cashflow([
        entry({ amount: 240 }),
        entry({ amount: 500, direction: "income", category: "client_payment" }),
        entry({ amount: 999, projectId: "p2" })
      ]),
      projects()
    );

    expect(next.projects.find((p) => p.id === "p1")?.actualCost).toBe(240);
    expect(next.projects.find((p) => p.id === "p1")?.actualRevenue).toBe(500);
    expect(next.projects.find((p) => p.id === "p2")?.actualCost).toBe(12);
    expect(next.projects.find((p) => p.id === "p2")?.actualRevenue).toBe(34);
  });
});

describe("filterCashflowEntries", () => {
  it("filters by project, cost code, supplier, status, direction, source, and search", () => {
    const match = entry({
      description: "cement paid by PO",
      sourceType: "po",
      sourceDocumentId: "po-1"
    });
    const list = filterCashflowEntries(
      cashflow([
        match,
        entry({ projectId: "p2" }),
        entry({ costCodeId: "cc-site" }),
        entry({ supplierId: "s2" }),
        entry({ status: "draft" })
      ]),
      {
        projectId: "p1",
        costCodeId: "cc-structure",
        supplierId: "s1",
        status: "confirmed",
        direction: "expense",
        sourceType: "po",
        search: "po-1"
      }
    );

    expect(list.map((item) => item.id)).toEqual([match.id]);
  });
});

describe("cashflow supplier price history sync", () => {
  const supplierState: SupplierState = {
    suppliers: [],
    priceHistory: [],
    updatedAt: ""
  };

  it("builds manual price history from confirmed supplier expense", () => {
    const source = entry({
      id: "cf-1",
      quantityActual: 4,
      unitActual: "bag",
      amount: 800,
      note: "paid cash"
    });
    const history = buildSupplierPriceHistoryEntryFromCashflow(source);

    expect(history?.id).toBe("cashflow-price-cf-1");
    expect(history?.unitPrice).toBe(200);
    expect(history?.quantity).toBe(4);
    expect(history?.sourceType).toBe("manual");
    expect(history?.sourceDocumentId).toBe("cf-1");
  });

  it("dedupes when syncing the same cashflow entry again", () => {
    const source = entry({ id: "cf-1", amount: 800 });
    const once = syncSupplierPriceHistoryFromCashflow(supplierState, source);
    const twice = syncSupplierPriceHistoryFromCashflow(once, source);

    expect(twice.priceHistory).toHaveLength(1);
    expect(twice.priceHistory[0].sourceDocumentId).toBe("cf-1");
  });

  it("removes linked price history when the cashflow entry is no longer valid", () => {
    const source = entry({ id: "cf-1", amount: 800 });
    const once = syncSupplierPriceHistoryFromCashflow(supplierState, source);
    const removed = removeCashflowPriceHistory(once, "cf-1");

    expect(removed.priceHistory).toHaveLength(0);
  });
});
