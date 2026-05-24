import { describe, expect, it } from "vitest";
import { seedThaiCostCodes } from "../../../costCodes.seed";
import type { BoqCatalogRow } from "../../../data";
import { MemoryAdapter } from "../../../storageAdapter";
import {
  BOQ_COST_CODE_MAPPING_STORAGE_KEY,
  inferCostCodeForBoq,
  loadBoqCostCodeMappings,
  removeBoqCostCodeMapping,
  resolveBoqCostCode,
  saveBoqCostCodeMappings,
  summarizeBoqCostCodeCoverage,
  upsertBoqCostCodeMapping
} from "./boqCostCodeMapping";

function makeRow(overrides: Partial<BoqCatalogRow> = {}): BoqCatalogRow {
  return {
    id: "row-1",
    keynote: "A3000",
    item: "Concrete slab",
    unit: "sq.m.",
    allowance: "0%",
    material: "850",
    labor: "120",
    level: 3,
    ...overrides
  };
}

describe("boqCostCodeMapping", () => {
  it("saves and loads manual mapping state through the storage adapter", () => {
    const adapter = new MemoryAdapter();
    const state = upsertBoqCostCodeMapping(
      { mappings: [], updatedAt: "" },
      {
        keynote: " A3000 ",
        boqRecordId: "row-1",
        costCodeId: "seed-02-400",
        note: "manual test"
      }
    );

    saveBoqCostCodeMappings(state, adapter);

    expect(adapter.read(BOQ_COST_CODE_MAPPING_STORAGE_KEY)).not.toBeNull();
    expect(loadBoqCostCodeMappings(adapter).mappings[0]).toMatchObject({
      keynote: "A3000",
      boqRecordId: "row-1",
      costCodeId: "seed-02-400",
      confidence: "manual"
    });
  });

  it("infers common structural BOQ rows from keynote and text rules", () => {
    const codes = seedThaiCostCodes();

    expect(inferCostCodeForBoq(makeRow({ keynote: "A3000", item: "Concrete beam" }), codes).costCode?.code).toBe(
      "02-400"
    );
    expect(inferCostCodeForBoq(makeRow({ keynote: "A5000", item: "Rebar SD40" }), codes).costCode?.code).toBe(
      "02-800"
    );
  });

  it("infers BBB database prefixes across architecture and MEP roots", () => {
    const codes = seedThaiCostCodes();

    expect(inferCostCodeForBoq(makeRow({ keynote: "B6000", item: "Wall Painting" }), codes).costCode?.code).toBe(
      "05-300"
    );
    expect(inferCostCodeForBoq(makeRow({ keynote: "C1001", item: "Low Voltage Cables" }), codes).costCode?.code).toBe(
      "04-210"
    );
    expect(inferCostCodeForBoq(makeRow({ keynote: "D2005", item: "Water Tank" }), codes).costCode?.code).toBe(
      "04-120"
    );
    expect(inferCostCodeForBoq(makeRow({ keynote: "E2000", item: "Ventilation fan" }), codes).costCode?.code).toBe(
      "04-410"
    );
    expect(inferCostCodeForBoq(makeRow({ keynote: "F2000", item: "Earthwork" }), codes).costCode?.code).toBe(
      "01-300"
    );
  });

  it("prefers manual mapping, then row suggestion, then rule inference", () => {
    const codes = seedThaiCostCodes();
    const row = makeRow({ suggestedCostCodeId: "05-100" });

    expect(resolveBoqCostCode(row, { mappings: [], updatedAt: "" }, codes).costCode?.code).toBe("05-100");

    const state = upsertBoqCostCodeMapping(
      { mappings: [], updatedAt: "" },
      {
        keynote: row.keynote,
        boqRecordId: row.id,
        costCodeId: "seed-03-300"
      }
    );

    const resolved = resolveBoqCostCode(row, state, codes);
    expect(resolved.source).toBe("manual");
    expect(resolved.costCode?.code).toBe("03-300");

    const removed = removeBoqCostCodeMapping(state, { boqRecordId: row.id });
    expect(resolveBoqCostCode(row, removed, codes).source).toBe("row");
  });

  it("summarizes mapped coverage for priced rows only", () => {
    const codes = seedThaiCostCodes();
    const rows = [
      makeRow({ id: "summary", keynote: "A", level: 1 }),
      makeRow({ id: "concrete", keynote: "A3000", item: "Concrete slab" }),
      makeRow({ id: "unknown", keynote: "Z9999", item: "Unknown special item" })
    ];
    const state = upsertBoqCostCodeMapping(
      { mappings: [], updatedAt: "" },
      {
        boqRecordId: "unknown",
        keynote: "Z9999",
        costCodeId: "seed-07-100"
      }
    );

    expect(summarizeBoqCostCodeCoverage(rows, state, codes)).toMatchObject({
      totalRows: 2,
      mappedRows: 2,
      unmappedRows: 0,
      coveragePct: 100
    });
  });
});
