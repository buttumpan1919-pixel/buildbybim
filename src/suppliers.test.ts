import { beforeEach, describe, expect, it } from "vitest";
import {
  SUPPLIERS_STORAGE_KEY,
  addPriceHistoryEntry,
  applySupplierCsvImport,
  computeAllSupplierSummaries,
  computeSupplierSummary,
  createSeedSuppliers,
  deactivateSupplier,
  detectSupplierType,
  ensureSeedSuppliers,
  filterSuppliers,
  formatThaiTaxId,
  loadSuppliers,
  normalizePriceHistoryEntry,
  normalizeSupplier,
  parseSuppliersCsv,
  recentPricesForSupplier,
  removePriceHistoryEntry,
  removeSupplier,
  saveSuppliers,
  searchSuppliers,
  sortSuppliers,
  stripTaxIdFormat,
  summarizeSupplierDirectory,
  upsertSupplier,
  validateSupplier,
  type Supplier,
  type SupplierState
} from "./suppliers";

function resetStorage() {
  if (typeof window !== "undefined") window.localStorage.clear();
}

function makeSupplier(overrides: Partial<Supplier> = {}): Supplier {
  return normalizeSupplier({
    workspaceId: "ws-1",
    name: "บจก. ทดสอบ",
    shortName: "TEST",
    type: "manufacturer",
    taxId: "0105000000001",
    rating: 4,
    active: true,
    ...overrides
  });
}

describe("storage", () => {
  beforeEach(resetStorage);

  it("uses namespaced storage key", () => {
    expect(SUPPLIERS_STORAGE_KEY).toBe("suppliers.directory.v1");
  });

  it("loadSuppliers returns empty state", () => {
    const state = loadSuppliers();
    expect(state.suppliers).toEqual([]);
    expect(state.priceHistory).toEqual([]);
  });

  it("saveSuppliers round-trips", () => {
    saveSuppliers({
      suppliers: [makeSupplier({ name: "Saved" })],
      priceHistory: [],
      updatedAt: new Date().toISOString()
    });
    const reloaded = loadSuppliers();
    expect(reloaded.suppliers).toHaveLength(1);
    expect(reloaded.suppliers[0].name).toBe("Saved");
  });
});

describe("normalize", () => {
  it("strips non-digits from taxId", () => {
    const s = normalizeSupplier({ name: "X", taxId: "0-1057-12345-67-8" });
    expect(s.taxId).toBe("0105712345678");
  });

  it("clamps negative rating to 0 and >5 to 5", () => {
    expect(normalizeSupplier({ name: "X", rating: -3 }).rating).toBe(0);
    expect(normalizeSupplier({ name: "X", rating: 99 }).rating).toBe(5);
  });

  it("normalizes tags to trimmed string array", () => {
    const s = normalizeSupplier({ name: "X", tags: ["  one  ", "", "two"] });
    expect(s.tags).toEqual(["one", "two"]);
  });

  it("defaults invalid type to 'other'", () => {
    const s = normalizeSupplier({ name: "X", type: "garbage" as unknown as Supplier["type"] });
    expect(s.type).toBe("other");
  });

  it("normalizePriceHistoryEntry computes totalAmount when missing", () => {
    const p = normalizePriceHistoryEntry({
      supplierId: "s1",
      unitPrice: 240,
      quantity: 50,
      unit: "ถุง"
    });
    expect(p.totalAmount).toBe(12000);
  });
});

describe("validateSupplier", () => {
  it("requires name", () => {
    const errors = validateSupplier({ name: "" });
    expect(errors).toContain("name is required");
  });

  it("accepts empty tax_id", () => {
    const errors = validateSupplier({ name: "X", taxId: "" });
    expect(errors.filter((e) => e.includes("tax_id"))).toHaveLength(0);
  });

  it("rejects tax_id with wrong digit count", () => {
    const errors = validateSupplier({ name: "X", taxId: "12345" });
    expect(errors).toContain("tax_id must be 13 digits when present");
  });

  it("accepts properly formatted 13-digit tax_id", () => {
    const errors = validateSupplier({ name: "X", taxId: "0-1057-12345-67-8" });
    expect(errors.some((e) => e.includes("tax_id"))).toBe(false);
  });

  it("rejects invalid email", () => {
    const errors = validateSupplier({ name: "X", email: "not-an-email" });
    expect(errors).toContain("email format is invalid");
  });

  it("accepts valid email", () => {
    const errors = validateSupplier({ name: "X", email: "sales@scc.co.th" });
    expect(errors.some((e) => e.includes("email"))).toBe(false);
  });
});

describe("detectSupplierType", () => {
  it("detects manufacturer for บจก. company", () => {
    expect(detectSupplierType("บจก. ปูนซีเมนต์ไทย")).toBe("manufacturer");
    expect(detectSupplierType("บมจ. สยามซีเมนต์")).toBe("manufacturer");
  });

  it("detects subcontractor when name mentions รับเหมา/ก่อสร้าง", () => {
    expect(detectSupplierType("บจก. ABC รับเหมาก่อสร้าง")).toBe("subcontractor");
    expect(detectSupplierType("ทีมรับเหมา รุ่งเรือง")).toBe("subcontractor");
  });

  it("detects distributor for หจก. / ร้าน", () => {
    expect(detectSupplierType("หจก. ค้าวัสดุภาคเหนือ")).toBe("distributor");
    expect(detectSupplierType("ร้านวัสดุภาคใต้")).toBe("distributor");
  });

  it("detects manufacturer from English suffix", () => {
    expect(detectSupplierType("Acme Co., Ltd.")).toBe("manufacturer");
  });

  it("falls back to service for personal name", () => {
    expect(detectSupplierType("คุณสมชาย")).toBe("service");
    expect(detectSupplierType("John Smith")).toBe("service");
  });

  it("returns 'other' for empty string", () => {
    expect(detectSupplierType("")).toBe("other");
  });
});

describe("formatThaiTaxId / stripTaxIdFormat", () => {
  it("formats 13-digit input to canonical pattern", () => {
    expect(formatThaiTaxId("0105712345678")).toBe("0-1057-12345-67-8");
  });

  it("strips non-digits before formatting", () => {
    expect(formatThaiTaxId(" 0-1057-12345-67-8 ")).toBe("0-1057-12345-67-8");
  });

  it("returns cleaned digits unchanged when length ≠ 13", () => {
    expect(formatThaiTaxId("123")).toBe("123");
  });

  it("stripTaxIdFormat removes all non-digit characters", () => {
    expect(stripTaxIdFormat("0-1057-12345-67-8")).toBe("0105712345678");
  });
});

describe("upsertSupplier / deactivate / remove", () => {
  it("appends new supplier to front", () => {
    let state: SupplierState = { suppliers: [], priceHistory: [], updatedAt: "" };
    state = upsertSupplier(state, makeSupplier({ id: "1", name: "A" }));
    state = upsertSupplier(state, makeSupplier({ id: "2", name: "B" }));
    expect(state.suppliers[0].name).toBe("B");
    expect(state.suppliers).toHaveLength(2);
  });

  it("updates existing by id", () => {
    let state: SupplierState = {
      suppliers: [makeSupplier({ id: "1", name: "Old" })],
      priceHistory: [],
      updatedAt: ""
    };
    state = upsertSupplier(state, { id: "1", name: "Renamed" });
    expect(state.suppliers[0].name).toBe("Renamed");
  });

  it("deactivateSupplier sets active=false", () => {
    let state: SupplierState = {
      suppliers: [makeSupplier({ id: "1" })],
      priceHistory: [],
      updatedAt: ""
    };
    state = deactivateSupplier(state, "1");
    expect(state.suppliers[0].active).toBe(false);
  });

  it("removeSupplier also removes related price history", () => {
    let state: SupplierState = {
      suppliers: [makeSupplier({ id: "s1" }), makeSupplier({ id: "s2" })],
      priceHistory: [
        normalizePriceHistoryEntry({ id: "p1", supplierId: "s1", unitPrice: 100, unit: "ชิ้น", quotedAt: "2026-01-01" }),
        normalizePriceHistoryEntry({ id: "p2", supplierId: "s2", unitPrice: 200, unit: "ชิ้น", quotedAt: "2026-01-01" })
      ],
      updatedAt: ""
    };
    state = removeSupplier(state, "s1");
    expect(state.suppliers.map((s) => s.id)).toEqual(["s2"]);
    expect(state.priceHistory.map((p) => p.id)).toEqual(["p2"]);
  });
});

describe("price history mutations", () => {
  it("addPriceHistoryEntry prepends", () => {
    let state: SupplierState = { suppliers: [makeSupplier({ id: "s1" })], priceHistory: [], updatedAt: "" };
    state = addPriceHistoryEntry(state, {
      supplierId: "s1",
      unitPrice: 100,
      unit: "ชิ้น",
      quantity: 5,
      quotedAt: "2026-04-15"
    });
    expect(state.priceHistory).toHaveLength(1);
    expect(state.priceHistory[0].totalAmount).toBe(500);
  });

  it("removePriceHistoryEntry by id", () => {
    let state: SupplierState = {
      suppliers: [makeSupplier({ id: "s1" })],
      priceHistory: [
        normalizePriceHistoryEntry({ id: "p1", supplierId: "s1", unitPrice: 10, unit: "x", quotedAt: "2026-01-01" })
      ],
      updatedAt: ""
    };
    state = removePriceHistoryEntry(state, "p1");
    expect(state.priceHistory).toHaveLength(0);
  });
});

describe("search / filter / sort", () => {
  const state: SupplierState = {
    suppliers: [
      makeSupplier({ id: "1", name: "บจก. SCC", shortName: "SCC", city: "Bangkok", type: "manufacturer", tags: ["ปูน"] }),
      makeSupplier({ id: "2", name: "บจก. TPI", shortName: "TPI", city: "Saraburi", type: "manufacturer", tags: ["ปูน", "เหล็ก"] }),
      makeSupplier({ id: "3", name: "ทีมรับเหมา สุวรรณ", shortName: "Suwan", city: "Bangkok", type: "subcontractor", active: false })
    ],
    priceHistory: [],
    updatedAt: ""
  };

  it("searchSuppliers matches name", () => {
    expect(searchSuppliers(state, "SCC")).toHaveLength(1);
  });

  it("searchSuppliers matches city", () => {
    expect(searchSuppliers(state, "bangkok")).toHaveLength(2);
  });

  it("searchSuppliers matches tag", () => {
    expect(searchSuppliers(state, "เหล็ก")).toHaveLength(1);
  });

  it("filterSuppliers respects activeOnly default", () => {
    expect(filterSuppliers(state)).toHaveLength(2);
    expect(filterSuppliers(state, { activeOnly: false })).toHaveLength(3);
  });

  it("filterSuppliers by type", () => {
    expect(filterSuppliers(state, { type: "manufacturer" })).toHaveLength(2);
    expect(filterSuppliers(state, { type: "subcontractor", activeOnly: false })).toHaveLength(1);
  });

  it("sortSuppliers by name (th-TH)", () => {
    const summaries = computeAllSupplierSummaries(state);
    const sorted = sortSuppliers(state.suppliers, summaries, "name");
    expect(sorted[0].name.startsWith("ทีม")).toBe(true);
  });

  it("sortSuppliers by rating desc", () => {
    const ratingState: SupplierState = {
      suppliers: [
        makeSupplier({ id: "a", rating: 3 }),
        makeSupplier({ id: "b", rating: 5 }),
        makeSupplier({ id: "c", rating: 4 })
      ],
      priceHistory: [],
      updatedAt: ""
    };
    const summaries = computeAllSupplierSummaries(ratingState);
    const sorted = sortSuppliers(ratingState.suppliers, summaries, "rating");
    expect(sorted.map((s) => s.rating)).toEqual([5, 4, 3]);
  });
});

describe("computeSupplierSummary", () => {
  const today = new Date("2026-05-24T00:00:00Z");

  it("sums total spend from price history within last 12 months", () => {
    const supplier = makeSupplier({ id: "s1" });
    const history = [
      normalizePriceHistoryEntry({ id: "1", supplierId: "s1", unitPrice: 100, quantity: 10, unit: "x", quotedAt: "2026-04-01" }),
      normalizePriceHistoryEntry({ id: "2", supplierId: "s1", unitPrice: 200, quantity: 5, unit: "x", quotedAt: "2026-03-01" }),
      // older than 12 months — should be excluded
      normalizePriceHistoryEntry({ id: "3", supplierId: "s1", unitPrice: 999, quantity: 999, unit: "x", quotedAt: "2024-01-01" })
    ];
    const summary = computeSupplierSummary(supplier, history, today);
    expect(summary.totalSpend).toBe(1000 + 1000);
    expect(summary.orderCount).toBe(2);
    expect(summary.lastOrderDate).toBe("2026-04-01");
  });

  it("returns empty summary when no history", () => {
    const supplier = makeSupplier({ id: "s1" });
    const summary = computeSupplierSummary(supplier, [], today);
    expect(summary.totalSpend).toBe(0);
    expect(summary.orderCount).toBe(0);
    expect(summary.lastOrderDate).toBe("");
    expect(summary.topCostCodeIds).toEqual([]);
  });

  it("returns top 3 cost codes by spend", () => {
    const supplier = makeSupplier({ id: "s1" });
    const history = [
      normalizePriceHistoryEntry({ supplierId: "s1", costCodeId: "01-100", unitPrice: 100, quantity: 1, unit: "x", quotedAt: "2026-04-01" }),
      normalizePriceHistoryEntry({ supplierId: "s1", costCodeId: "02-200", unitPrice: 1000, quantity: 1, unit: "x", quotedAt: "2026-04-02" }),
      normalizePriceHistoryEntry({ supplierId: "s1", costCodeId: "03-300", unitPrice: 500, quantity: 1, unit: "x", quotedAt: "2026-04-03" }),
      normalizePriceHistoryEntry({ supplierId: "s1", costCodeId: "04-400", unitPrice: 50, quantity: 1, unit: "x", quotedAt: "2026-04-04" })
    ];
    const summary = computeSupplierSummary(supplier, history, today);
    expect(summary.topCostCodeIds).toEqual(["02-200", "03-300", "01-100"]);
  });

  it("excludes price history from other suppliers", () => {
    const supplier = makeSupplier({ id: "s1" });
    const history = [
      normalizePriceHistoryEntry({ id: "p1", supplierId: "s1", unitPrice: 100, quantity: 1, unit: "x", quotedAt: "2026-04-01" }),
      normalizePriceHistoryEntry({ id: "p2", supplierId: "s2", unitPrice: 999, quantity: 999, unit: "x", quotedAt: "2026-04-01" })
    ];
    const summary = computeSupplierSummary(supplier, history, today);
    expect(summary.totalSpend).toBe(100);
    expect(summary.orderCount).toBe(1);
  });
});

describe("recentPricesForSupplier", () => {
  it("returns entries sorted by quotedAt desc with drift vs prev same cost code", () => {
    const state: SupplierState = {
      suppliers: [makeSupplier({ id: "s1" })],
      priceHistory: [
        normalizePriceHistoryEntry({ id: "a", supplierId: "s1", costCodeId: "C", unitPrice: 200, unit: "ถุง", quotedAt: "2026-01-10" }),
        normalizePriceHistoryEntry({ id: "b", supplierId: "s1", costCodeId: "C", unitPrice: 240, unit: "ถุง", quotedAt: "2026-04-10" }),
        normalizePriceHistoryEntry({ id: "c", supplierId: "s1", costCodeId: "D", unitPrice: 480, unit: "ลบ.ม.", quotedAt: "2026-03-10" })
      ],
      updatedAt: ""
    };
    const recent = recentPricesForSupplier(state, "s1");
    expect(recent[0].entry.id).toBe("b");
    expect(recent[0].driftPct).toBeCloseTo(20, 1);
    expect(recent[1].entry.id).toBe("c");
    expect(recent[1].driftPct).toBeNull();
  });
});

describe("summarizeSupplierDirectory", () => {
  it("counts active/inactive/highRated", () => {
    const state: SupplierState = {
      suppliers: [
        makeSupplier({ id: "1", rating: 5 }),
        makeSupplier({ id: "2", rating: 3 }),
        makeSupplier({ id: "3", rating: 5, active: false })
      ],
      priceHistory: [],
      updatedAt: ""
    };
    const summary = summarizeSupplierDirectory(state);
    expect(summary.totalSuppliers).toBe(3);
    expect(summary.active).toBe(2);
    expect(summary.inactive).toBe(1);
    expect(summary.highRated).toBe(2);
  });
});

describe("seed", () => {
  beforeEach(resetStorage);

  it("createSeedSuppliers returns 5 Thai suppliers", () => {
    const seeds = createSeedSuppliers();
    expect(seeds).toHaveLength(5);
    expect(seeds.map((s) => s.shortName)).toEqual(["SCC", "TPI", "Insee", "NorthMat", "ThaiSteel"]);
  });

  it("ensureSeedSuppliers seeds on first call", () => {
    const state = ensureSeedSuppliers("ws-1");
    expect(state.suppliers).toHaveLength(5);
  });

  it("ensureSeedSuppliers is idempotent", () => {
    ensureSeedSuppliers("ws-1");
    const before = loadSuppliers().suppliers.length;
    ensureSeedSuppliers("ws-1");
    expect(loadSuppliers().suppliers.length).toBe(before);
  });
});

describe("CSV import", () => {
  it("parses standard supplier CSV", () => {
    const csv = `name,short_name,type,tax_id,city,phone,rating
บจก. SCC,SCC,manufacturer,0105000000001,Bangkok,02-100-1000,5
บจก. TPI,TPI,manufacturer,0107000000002,Saraburi,036-100-1000,4`;
    const result = parseSuppliersCsv(csv, "ws-1");
    expect(result.totalParsed).toBe(2);
    expect(result.invalidRows).toHaveLength(0);
    expect(result.validRows[0].parsed?.shortName).toBe("SCC");
    expect(result.validRows[0].parsed?.rating).toBe(5);
  });

  it("auto-detects type when column missing", () => {
    const csv = `name,phone\nบจก. ABC ก่อสร้าง,02-100-1000`;
    const result = parseSuppliersCsv(csv, "ws-1");
    expect(result.validRows[0].parsed?.type).toBe("subcontractor");
  });

  it("flags row missing name", () => {
    const csv = `name,phone\n,02-1000`;
    const result = parseSuppliersCsv(csv, "ws-1");
    expect(result.invalidRows).toHaveLength(1);
    expect(result.invalidRows[0].errors).toContain("missing name");
  });

  it("flags malformed tax_id", () => {
    const csv = `name,tax_id\nบจก. X,12345`;
    const result = parseSuppliersCsv(csv, "ws-1");
    expect(result.invalidRows[0].errors).toContain("tax_id must be 13 digits");
  });

  it("parses comma/semicolon separated tags", () => {
    const csv = `name,tags\nบจก. X,"ปูน, main supplier; fast"`;
    const result = parseSuppliersCsv(csv, "ws-1");
    expect(result.validRows[0].parsed?.tags).toEqual(["ปูน", "main supplier", "fast"]);
  });
});

describe("applySupplierCsvImport", () => {
  it("dedupes by tax_id when present", () => {
    let state: SupplierState = {
      suppliers: [makeSupplier({ id: "s1", taxId: "0105000000001", name: "old" })],
      priceHistory: [],
      updatedAt: ""
    };
    const result = parseSuppliersCsv(
      `name,tax_id\nบจก. SCC,0105000000001\nบจก. TPI,0107000000002`,
      "ws-1"
    );
    const applied = applySupplierCsvImport(state, result.rows, "skip_duplicates", "ws-1");
    expect(applied.skipped).toBe(1);
    expect(applied.added).toBe(1);
    state = applied.state;
    expect(state.suppliers.find((s) => s.taxId === "0105000000001")?.name).toBe("old");
  });

  it("dedupes by name when tax_id missing", () => {
    let state: SupplierState = {
      suppliers: [makeSupplier({ id: "s1", taxId: "", name: "บจก. dup" })],
      priceHistory: [],
      updatedAt: ""
    };
    const result = parseSuppliersCsv(`name\nบจก. dup\nบจก. brand new`, "ws-1");
    const applied = applySupplierCsvImport(state, result.rows, "skip_duplicates", "ws-1");
    expect(applied.skipped).toBe(1);
    expect(applied.added).toBe(1);
  });

  it("update_existing overwrites by tax_id match", () => {
    let state: SupplierState = {
      suppliers: [makeSupplier({ id: "s1", taxId: "0105000000001", name: "old", rating: 2 })],
      priceHistory: [],
      updatedAt: ""
    };
    const result = parseSuppliersCsv(
      `name,tax_id,rating\nบจก. NEW,0105000000001,5`,
      "ws-1"
    );
    const applied = applySupplierCsvImport(state, result.rows, "update_existing", "ws-1");
    expect(applied.updated).toBe(1);
    state = applied.state;
    const updated = state.suppliers.find((s) => s.taxId === "0105000000001");
    expect(updated?.name).toBe("บจก. NEW");
    expect(updated?.rating).toBe(5);
  });
});
