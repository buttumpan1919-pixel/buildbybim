import { beforeEach, describe, expect, it } from "vitest";
import {
  CASHFLOW_STORAGE_KEY,
  loadCashflowState,
  removeCashflowEntry,
  summarizeCashflow,
  upsertCashflowEntry,
  type CashflowEntry,
  type CashflowState
} from "./cashflow";

function resetStorage() {
  if (typeof window !== "undefined") {
    window.localStorage.clear();
  }
}

function makeEntry(overrides: Partial<CashflowEntry> = {}): Partial<CashflowEntry> {
  return {
    direction: "expense",
    category: "material",
    amount: 100,
    description: "test",
    entryDate: new Date().toISOString().slice(0, 10),
    status: "confirmed",
    ...overrides
  };
}

describe("loadCashflowState", () => {
  beforeEach(resetStorage);

  it("returns empty state when storage is empty", () => {
    const state = loadCashflowState();
    expect(state.entries).toEqual([]);
    expect(state.updatedAt).toBe("");
  });

  it("uses storage adapter (namespace key)", () => {
    expect(CASHFLOW_STORAGE_KEY).toBe("cashflow.entries.v1");
  });
});

describe("upsertCashflowEntry", () => {
  beforeEach(resetStorage);

  it("appends new entry to the front", () => {
    const base: CashflowState = { entries: [], updatedAt: "" };
    const next = upsertCashflowEntry(base, makeEntry({ description: "first" }));
    expect(next.entries).toHaveLength(1);
    expect(next.entries[0].description).toBe("first");
  });

  it("updates existing entry when id matches", () => {
    const base = upsertCashflowEntry(
      { entries: [], updatedAt: "" },
      makeEntry({ description: "first" })
    );
    const id = base.entries[0].id;
    const next = upsertCashflowEntry(base, {
      id,
      direction: "expense",
      category: "material",
      amount: 250,
      description: "first updated",
      entryDate: base.entries[0].entryDate,
      status: "confirmed"
    });
    expect(next.entries).toHaveLength(1);
    expect(next.entries[0].amount).toBe(250);
    expect(next.entries[0].description).toBe("first updated");
  });

  it("normalizes negative amount to zero", () => {
    const next = upsertCashflowEntry(
      { entries: [], updatedAt: "" },
      makeEntry({ amount: -50 })
    );
    expect(next.entries[0].amount).toBe(0);
  });
});

describe("removeCashflowEntry", () => {
  beforeEach(resetStorage);

  it("removes by id", () => {
    let state = upsertCashflowEntry({ entries: [], updatedAt: "" }, makeEntry());
    state = upsertCashflowEntry(state, makeEntry({ description: "second" }));
    const targetId = state.entries[0].id;
    const next = removeCashflowEntry(state, targetId);
    expect(next.entries.find((e) => e.id === targetId)).toBeUndefined();
    expect(next.entries).toHaveLength(1);
  });

  it("no-op when id not found", () => {
    const state = upsertCashflowEntry({ entries: [], updatedAt: "" }, makeEntry());
    const next = removeCashflowEntry(state, "nonexistent");
    expect(next.entries).toHaveLength(state.entries.length);
  });
});

describe("summarizeCashflow", () => {
  beforeEach(resetStorage);

  it("counts confirmed income and expense separately", () => {
    let state: CashflowState = { entries: [], updatedAt: "" };
    state = upsertCashflowEntry(
      state,
      makeEntry({ direction: "income", category: "client_payment", amount: 1000 })
    );
    state = upsertCashflowEntry(
      state,
      makeEntry({ direction: "expense", category: "material", amount: 300 })
    );
    state = upsertCashflowEntry(
      state,
      makeEntry({ direction: "expense", category: "labor", amount: 200 })
    );
    const summary = summarizeCashflow(state);
    expect(summary.totalIncome).toBe(1000);
    expect(summary.totalExpense).toBe(500);
    expect(summary.netCash).toBe(500);
    expect(summary.entryCount).toBe(3);
  });

  it("excludes draft entries from totals but counts them in draftCount", () => {
    let state: CashflowState = { entries: [], updatedAt: "" };
    state = upsertCashflowEntry(
      state,
      makeEntry({ direction: "income", amount: 500, status: "confirmed" })
    );
    state = upsertCashflowEntry(
      state,
      makeEntry({ direction: "income", amount: 999, status: "draft" })
    );
    const summary = summarizeCashflow(state);
    expect(summary.totalIncome).toBe(500);
    expect(summary.draftCount).toBe(1);
    expect(summary.entryCount).toBe(2);
  });

  it("excludes void entries from totals", () => {
    let state: CashflowState = { entries: [], updatedAt: "" };
    state = upsertCashflowEntry(
      state,
      makeEntry({ direction: "expense", amount: 100, status: "void" })
    );
    const summary = summarizeCashflow(state);
    expect(summary.totalExpense).toBe(0);
  });

  it("computes monthIncome / monthExpense for current month only", () => {
    const today = new Date();
    const currentMonthDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-15`;
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 15);
    const lastMonthDate = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}-15`;

    let state: CashflowState = { entries: [], updatedAt: "" };
    state = upsertCashflowEntry(
      state,
      makeEntry({
        direction: "income",
        amount: 1000,
        entryDate: currentMonthDate,
        status: "confirmed"
      })
    );
    state = upsertCashflowEntry(
      state,
      makeEntry({
        direction: "expense",
        amount: 300,
        entryDate: currentMonthDate,
        status: "confirmed"
      })
    );
    state = upsertCashflowEntry(
      state,
      makeEntry({
        direction: "income",
        amount: 999,
        entryDate: lastMonthDate,
        status: "confirmed"
      })
    );

    const summary = summarizeCashflow(state);
    expect(summary.monthIncome).toBe(1000);
    expect(summary.monthExpense).toBe(300);
    expect(summary.monthNet).toBe(700);
    expect(summary.totalIncome).toBe(1999);
  });

  it("tracks lastEntryDate as the latest entry's date", () => {
    let state: CashflowState = { entries: [], updatedAt: "" };
    state = upsertCashflowEntry(state, makeEntry({ entryDate: "2024-01-05" }));
    state = upsertCashflowEntry(state, makeEntry({ entryDate: "2024-03-15" }));
    state = upsertCashflowEntry(state, makeEntry({ entryDate: "2024-02-10" }));
    const summary = summarizeCashflow(state);
    expect(summary.lastEntryDate).toBe("2024-03-15");
  });

  it("returns zero summary for empty state", () => {
    const summary = summarizeCashflow({ entries: [], updatedAt: "" });
    expect(summary.totalIncome).toBe(0);
    expect(summary.totalExpense).toBe(0);
    expect(summary.netCash).toBe(0);
    expect(summary.entryCount).toBe(0);
  });
});
