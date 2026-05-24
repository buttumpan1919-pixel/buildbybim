import { beforeEach, describe, expect, it } from "vitest";
import {
  COST_CODES_STORAGE_KEY,
  applyCsvImport,
  costCodeCategoryCopy,
  deactivateCostCode,
  ensureSeedCostCodes,
  exportCostCodesToCsv,
  filterCostCodesByCategory,
  groupCostCodesByParent,
  loadCostCodes,
  mapUnitLabelToCostCodeUnit,
  normalizeCostCode,
  normalizeCostCodeState,
  parseCostCodeCsv,
  parseCsv,
  removeCostCode,
  saveCostCodes,
  searchCostCodes,
  summarizeCostCodes,
  upsertCostCode,
  validateCostCode,
  type CostCode,
  type CostCodeState
} from "./costCodes";
import { SEED_THAI_COST_CODE_COUNT, seedThaiCostCodes } from "./costCodes.seed";

function resetStorage() {
  if (typeof window !== "undefined") {
    window.localStorage.clear();
  }
}

function makeCode(overrides: Partial<CostCode> = {}): CostCode {
  return normalizeCostCode({
    code: "TEST-100",
    name: "งานทดสอบ",
    category: "custom",
    defaultUnit: "sq_m",
    defaultUnitPrice: 100,
    workspaceId: "ws-1",
    ...overrides
  });
}

describe("storage", () => {
  beforeEach(resetStorage);

  it("uses namespaced storage key", () => {
    expect(COST_CODES_STORAGE_KEY).toBe("cost-codes.catalog.v1");
  });

  it("loadCostCodes returns empty when storage missing", () => {
    const state = loadCostCodes();
    expect(state.codes).toEqual([]);
  });

  it("saveCostCodes round-trips via adapter", () => {
    saveCostCodes({
      codes: [makeCode({ code: "X-1" })],
      updatedAt: new Date().toISOString()
    });
    expect(loadCostCodes().codes[0].code).toBe("X-1");
  });
});

describe("normalizeCostCodeState", () => {
  it("accepts bare array", () => {
    const state = normalizeCostCodeState([{ code: "A", name: "a", category: "site", defaultUnit: "sq_m" }]);
    expect(state.codes).toHaveLength(1);
  });

  it("clamps negative defaultUnitPrice to 0", () => {
    const state = normalizeCostCodeState({
      codes: [{ code: "A", name: "a", category: "site", defaultUnit: "sq_m", defaultUnitPrice: -50 }]
    });
    expect(state.codes[0].defaultUnitPrice).toBe(0);
  });

  it("defaults invalid category to custom", () => {
    const state = normalizeCostCodeState({
      codes: [{ code: "A", name: "a", category: "garbage", defaultUnit: "sq_m" } as unknown as CostCode]
    });
    expect(state.codes[0].category).toBe("custom");
  });

  it("defaults invalid unit to lump_sum", () => {
    const state = normalizeCostCodeState({
      codes: [{ code: "A", name: "a", category: "site", defaultUnit: "garbage" } as unknown as CostCode]
    });
    expect(state.codes[0].defaultUnit).toBe("lump_sum");
  });

  it("returns empty for non-object", () => {
    expect(normalizeCostCodeState(null).codes).toEqual([]);
    expect(normalizeCostCodeState("nope").codes).toEqual([]);
  });
});

describe("validateCostCode", () => {
  it("requires code and name", () => {
    const errors = validateCostCode({ name: "" }, { codes: [], updatedAt: "" });
    expect(errors).toContain("code is required");
    expect(errors).toContain("name is required");
  });

  it("rejects duplicate code in same workspace", () => {
    const state: CostCodeState = {
      codes: [makeCode({ id: "1", code: "DUP", workspaceId: "ws-A" })],
      updatedAt: ""
    };
    const errors = validateCostCode(
      { code: "DUP", name: "dup", workspaceId: "ws-A" },
      state
    );
    expect(errors.some((e) => e.includes("already exists"))).toBe(true);
  });

  it("allows same code in different workspaces", () => {
    const state: CostCodeState = {
      codes: [makeCode({ id: "1", code: "DUP", workspaceId: "ws-A" })],
      updatedAt: ""
    };
    const errors = validateCostCode(
      { code: "DUP", name: "dup-in-other-ws", workspaceId: "ws-B" },
      state
    );
    expect(errors.some((e) => e.includes("already exists"))).toBe(false);
  });

  it("rejects parentCode that doesn't exist", () => {
    const errors = validateCostCode(
      { code: "Z-1", name: "z", workspaceId: "ws-A", parentCode: "MISSING" },
      { codes: [], updatedAt: "" }
    );
    expect(errors.some((e) => e.includes("does not exist"))).toBe(true);
  });

  it("accepts parentCode from system seed (workspaceId='')", () => {
    const state: CostCodeState = {
      codes: [
        makeCode({ id: "seed-root", code: "01", workspaceId: "" })
      ],
      updatedAt: ""
    };
    const errors = validateCostCode(
      { code: "01-CUSTOM", name: "custom child", workspaceId: "ws-A", parentCode: "01" },
      state
    );
    expect(errors).toEqual([]);
  });

  it("requires customUnit when defaultUnit is custom", () => {
    const errors = validateCostCode(
      { code: "Z-1", name: "z", workspaceId: "ws-A", defaultUnit: "custom" },
      { codes: [], updatedAt: "" }
    );
    expect(errors.some((e) => e.includes("custom_unit"))).toBe(true);
  });

  it("rejects parentCode equal to own code", () => {
    const errors = validateCostCode(
      { code: "SELF", name: "self", workspaceId: "ws-A", parentCode: "SELF" },
      { codes: [], updatedAt: "" }
    );
    expect(errors.some((e) => e.includes("parent_code cannot equal code"))).toBe(true);
  });
});

describe("upsertCostCode / removeCostCode / deactivateCostCode", () => {
  it("appends new code", () => {
    let state: CostCodeState = { codes: [], updatedAt: "" };
    state = upsertCostCode(state, makeCode({ code: "A" }));
    state = upsertCostCode(state, makeCode({ code: "B" }));
    expect(state.codes).toHaveLength(2);
  });

  it("updates existing by id", () => {
    const orig = makeCode({ id: "x", name: "original" });
    let state: CostCodeState = { codes: [orig], updatedAt: "" };
    state = upsertCostCode(state, { ...orig, name: "renamed" });
    expect(state.codes).toHaveLength(1);
    expect(state.codes[0].name).toBe("renamed");
  });

  it("deactivateCostCode sets active=false", () => {
    let state: CostCodeState = { codes: [makeCode({ id: "x" })], updatedAt: "" };
    state = deactivateCostCode(state, "x");
    expect(state.codes[0].active).toBe(false);
  });

  it("removeCostCode hard-deletes by id", () => {
    let state: CostCodeState = {
      codes: [makeCode({ id: "a" }), makeCode({ id: "b" })],
      updatedAt: ""
    };
    state = removeCostCode(state, "a");
    expect(state.codes.map((c) => c.id)).toEqual(["b"]);
  });
});

describe("search / filter / group", () => {
  const state: CostCodeState = {
    codes: [
      makeCode({ id: "1", code: "01-100", name: "ปรับระดับ", category: "site" }),
      makeCode({ id: "2", code: "02-100", name: "ฐานราก", category: "structure" }),
      makeCode({ id: "3", code: "03-200", name: "ฉาบปูน", category: "architecture" }),
      makeCode({ id: "4", code: "03-300", name: "ติดประตู", category: "architecture", active: false })
    ],
    updatedAt: ""
  };

  it("searchCostCodes matches Thai name", () => {
    expect(searchCostCodes(state, "ปูน")).toHaveLength(1);
  });

  it("searchCostCodes matches code prefix", () => {
    expect(searchCostCodes(state, "03-")).toHaveLength(2);
  });

  it("searchCostCodes is case-insensitive", () => {
    expect(searchCostCodes(state, "PUNK").length).toBe(0);
    expect(searchCostCodes(state, "")).toHaveLength(state.codes.length);
  });

  it("filterCostCodesByCategory respects activeOnly", () => {
    expect(filterCostCodesByCategory(state, "architecture")).toHaveLength(1);
    expect(filterCostCodesByCategory(state, "architecture", false)).toHaveLength(2);
  });

  it("filterCostCodesByCategory all returns active codes", () => {
    expect(filterCostCodesByCategory(state, "all")).toHaveLength(3);
  });

  it("groupCostCodesByParent groups children under root", () => {
    const codes: CostCode[] = [
      makeCode({ id: "r", code: "01", parentCode: "" }),
      makeCode({ id: "c1", code: "01-100", parentCode: "01" }),
      makeCode({ id: "c2", code: "01-200", parentCode: "01" })
    ];
    const groups = groupCostCodesByParent(codes);
    expect(groups).toHaveLength(1);
    expect(groups[0].children).toHaveLength(2);
  });
});

describe("seed catalog (Thai)", () => {
  it("yields 100+ codes", () => {
    const seeds = seedThaiCostCodes();
    expect(seeds.length).toBeGreaterThanOrEqual(100);
    expect(seeds.length).toBe(SEED_THAI_COST_CODE_COUNT);
  });

  it("covers all 7 production categories", () => {
    const seeds = seedThaiCostCodes();
    const cats = new Set(seeds.map((c) => c.category));
    for (const expected of [
      "site",
      "structure",
      "architecture",
      "mep",
      "finishing",
      "external",
      "indirect"
    ] as const) {
      expect(cats.has(expected)).toBe(true);
    }
  });

  it("every root has parentCode === ''", () => {
    const seeds = seedThaiCostCodes();
    const roots = seeds.filter((c) => !c.parentCode);
    for (const root of roots) {
      expect(root.parentCode).toBe("");
    }
    expect(roots.length).toBeGreaterThanOrEqual(7);
  });

  it("every child references a valid parent code", () => {
    const seeds = seedThaiCostCodes();
    const codes = new Set(seeds.map((c) => c.code));
    for (const seed of seeds) {
      if (seed.parentCode) {
        expect(codes.has(seed.parentCode)).toBe(true);
      }
    }
  });

  it("all seeds have workspaceId === '' (system shared)", () => {
    const seeds = seedThaiCostCodes();
    expect(seeds.every((c) => c.workspaceId === "")).toBe(true);
  });

  it("category copy is defined for every used category", () => {
    const seeds = seedThaiCostCodes();
    for (const seed of seeds) {
      expect(costCodeCategoryCopy[seed.category]).toBeDefined();
    }
  });
});

describe("ensureSeedCostCodes", () => {
  beforeEach(resetStorage);

  it("loads seeds on first run", () => {
    const state = ensureSeedCostCodes();
    expect(state.codes.length).toBeGreaterThanOrEqual(100);
  });

  it("does not duplicate on second run", () => {
    ensureSeedCostCodes();
    const first = loadCostCodes().codes.length;
    ensureSeedCostCodes();
    expect(loadCostCodes().codes.length).toBe(first);
  });

  it("preserves user-added codes alongside seeds", () => {
    ensureSeedCostCodes();
    const after = upsertCostCode(loadCostCodes(), makeCode({ code: "USER-1", workspaceId: "ws-1" }));
    saveCostCodes(after);
    const again = ensureSeedCostCodes();
    expect(again.codes.some((c) => c.code === "USER-1")).toBe(true);
  });
});

describe("CSV parser (parseCsv)", () => {
  it("splits header + rows", () => {
    const { headers, rows } = parseCsv("a,b,c\n1,2,3\n4,5,6");
    expect(headers).toEqual(["a", "b", "c"]);
    expect(rows).toEqual([["1", "2", "3"], ["4", "5", "6"]]);
  });

  it("handles quoted fields with commas", () => {
    const { rows } = parseCsv('a,b\n"1,000",2');
    expect(rows[0]).toEqual(["1,000", "2"]);
  });

  it("handles escaped double quotes", () => {
    const { rows } = parseCsv('a\n"hello ""world"""');
    expect(rows[0][0]).toBe('hello "world"');
  });

  it("ignores empty rows", () => {
    const { rows } = parseCsv("a\n1\n\n2\n");
    expect(rows).toEqual([["1"], ["2"]]);
  });

  it("handles CRLF line endings", () => {
    const { headers, rows } = parseCsv("a,b\r\n1,2\r\n3,4");
    expect(headers).toEqual(["a", "b"]);
    expect(rows).toEqual([["1", "2"], ["3", "4"]]);
  });
});

describe("mapUnitLabelToCostCodeUnit", () => {
  it("maps Thai unit shorts", () => {
    expect(mapUnitLabelToCostCodeUnit("ตร.ม.").unit).toBe("sq_m");
    expect(mapUnitLabelToCostCodeUnit("ลบ.ม.").unit).toBe("cubic_m");
    expect(mapUnitLabelToCostCodeUnit("เมตร").unit).toBe("linear_m");
    expect(mapUnitLabelToCostCodeUnit("ชิ้น").unit).toBe("piece");
    expect(mapUnitLabelToCostCodeUnit("ชุด").unit).toBe("set");
    expect(mapUnitLabelToCostCodeUnit("ต้น").unit).toBe("piece");
  });

  it("maps English unit shorts", () => {
    expect(mapUnitLabelToCostCodeUnit("kg").unit).toBe("kg");
    expect(mapUnitLabelToCostCodeUnit("m2").unit).toBe("sq_m");
    expect(mapUnitLabelToCostCodeUnit("m3").unit).toBe("cubic_m");
    expect(mapUnitLabelToCostCodeUnit("LS").unit).toBe("lump_sum");
  });

  it("falls back to custom when unknown", () => {
    const mapped = mapUnitLabelToCostCodeUnit("ปี๊บ");
    expect(mapped.unit).toBe("custom");
    expect(mapped.custom).toBe("ปี๊บ");
  });
});

describe("parseCostCodeCsv", () => {
  it("parses Builk-style CSV with default headers", () => {
    const csv = `code,name,parent_code,unit,price,category
01,Site,,,0,site
01-100,Grading,01,ตร.ม.,120,site
01-200,Demo,01,ตร.ม.,200,site`;
    const result = parseCostCodeCsv(csv);
    expect(result.totalParsed).toBe(3);
    expect(result.invalidRows).toHaveLength(0);
    expect(result.validRows[1].parsed?.code).toBe("01-100");
    expect(result.validRows[1].parsed?.defaultUnitPrice).toBe(120);
    expect(result.validRows[1].parsed?.defaultUnit).toBe("sq_m");
  });

  it("tolerates thousand-separator in price", () => {
    const csv = `code,name,unit,price\n02-100,Pile,piece,"8,500"`;
    const result = parseCostCodeCsv(csv);
    expect(result.validRows[0].parsed?.defaultUnitPrice).toBe(8500);
  });

  it("flags missing code or name", () => {
    const csv = `code,name\n,no-code\nX-1,`;
    const result = parseCostCodeCsv(csv);
    expect(result.invalidRows).toHaveLength(2);
    expect(result.invalidRows[0].errors).toContain("missing code");
    expect(result.invalidRows[1].errors).toContain("missing name");
  });

  it("accepts alternate header aliases (Parent, Default Unit, Default Price)", () => {
    const csv = `Code,Parent,Name,Default Unit,Default Price\n01-100,01,Grading,sq_m,120`;
    const result = parseCostCodeCsv(csv);
    expect(result.validRows[0].parsed?.parentCode).toBe("01");
    expect(result.validRows[0].parsed?.defaultUnit).toBe("sq_m");
    expect(result.validRows[0].parsed?.defaultUnitPrice).toBe(120);
  });
});

describe("applyCsvImport", () => {
  it("adds new codes", () => {
    const state: CostCodeState = { codes: [], updatedAt: "" };
    const result = parseCostCodeCsv(`code,name,unit\nA,Alpha,sq_m\nB,Beta,sq_m`);
    const applied = applyCsvImport(state, result.rows, "skip_duplicates", "ws-1");
    expect(applied.added).toBe(2);
    expect(applied.skipped).toBe(0);
    expect(applied.state.codes).toHaveLength(2);
  });

  it("skip_duplicates leaves existing rows untouched", () => {
    let state: CostCodeState = {
      codes: [makeCode({ code: "A", name: "old", workspaceId: "ws-1" })],
      updatedAt: ""
    };
    const result = parseCostCodeCsv(`code,name,unit\nA,New,sq_m\nB,Beta,sq_m`);
    const applied = applyCsvImport(state, result.rows, "skip_duplicates", "ws-1");
    expect(applied.added).toBe(1);
    expect(applied.skipped).toBe(1);
    state = applied.state;
    expect(state.codes.find((c) => c.code === "A")?.name).toBe("old");
  });

  it("update_existing overwrites by code", () => {
    let state: CostCodeState = {
      codes: [makeCode({ code: "A", name: "old", workspaceId: "ws-1" })],
      updatedAt: ""
    };
    const result = parseCostCodeCsv(`code,name,unit,price\nA,Renamed,sq_m,999`);
    const applied = applyCsvImport(state, result.rows, "update_existing", "ws-1");
    expect(applied.updated).toBe(1);
    state = applied.state;
    expect(state.codes.find((c) => c.code === "A")?.name).toBe("Renamed");
    expect(state.codes.find((c) => c.code === "A")?.defaultUnitPrice).toBe(999);
  });

  it("skips invalid rows entirely", () => {
    const state: CostCodeState = { codes: [], updatedAt: "" };
    const result = parseCostCodeCsv(`code,name,unit\n,nocode,sq_m\nA,Alpha,sq_m`);
    const applied = applyCsvImport(state, result.rows, "skip_duplicates", "ws-1");
    expect(applied.added).toBe(1);
    expect(applied.skipped).toBe(1);
  });
});

describe("exportCostCodesToCsv", () => {
  it("includes header + data rows", () => {
    const state: CostCodeState = {
      codes: [makeCode({ code: "A", name: "Alpha", defaultUnit: "sq_m", defaultUnitPrice: 100 })],
      updatedAt: ""
    };
    const csv = exportCostCodesToCsv(state);
    expect(csv.split("\n")[0]).toContain("code");
    expect(csv).toContain("A");
    expect(csv).toContain("Alpha");
  });

  it("round-trips: export → parse → reimport equals original count", () => {
    const original: CostCodeState = {
      codes: [
        makeCode({ id: "1", code: "A", name: "Alpha", workspaceId: "ws-1" }),
        makeCode({ id: "2", code: "B", name: "Beta", workspaceId: "ws-1" })
      ],
      updatedAt: ""
    };
    const csv = exportCostCodesToCsv(original);
    const reparsed = parseCostCodeCsv(csv, "ws-1");
    expect(reparsed.validRows).toHaveLength(2);
  });

  it("excludes inactive codes by default", () => {
    const state: CostCodeState = {
      codes: [
        makeCode({ code: "A", active: true }),
        makeCode({ code: "B", active: false })
      ],
      updatedAt: ""
    };
    const csv = exportCostCodesToCsv(state);
    expect(csv).toContain("A");
    expect(csv).not.toContain(",B,");
  });

  it("escapes fields containing commas/quotes/newlines", () => {
    const state: CostCodeState = {
      codes: [makeCode({ code: "A", name: 'has "quotes", commas' })],
      updatedAt: ""
    };
    const csv = exportCostCodesToCsv(state);
    expect(csv).toContain('"has ""quotes"", commas"');
  });
});

describe("summarizeCostCodes", () => {
  it("counts active / inactive / by category", () => {
    const seeds = seedThaiCostCodes();
    const summary = summarizeCostCodes({ codes: seeds, updatedAt: "" });
    expect(summary.total).toBe(SEED_THAI_COST_CODE_COUNT);
    expect(summary.active).toBe(SEED_THAI_COST_CODE_COUNT);
    expect(summary.byCategory.site).toBeGreaterThan(0);
    expect(summary.byCategory.structure).toBeGreaterThan(0);
    expect(summary.systemSeed).toBe(SEED_THAI_COST_CODE_COUNT);
    expect(summary.custom).toBe(0);
  });
});
