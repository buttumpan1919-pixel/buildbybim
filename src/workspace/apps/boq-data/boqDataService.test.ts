import { describe, expect, it } from "vitest";
import { getBoqRowUnitPrice } from "../../../data";
import { MemoryAdapter } from "../../../storageAdapter";
import {
  BOQ_CATALOG_STORAGE_KEY,
  BOQ_INLINE_EDITABLE_FIELDS,
  buildBoqImportTemplateCsv,
  formatBoqAmount,
  getBoqSearchText,
  loadCustomBoqRows,
  mergeBoqCatalogRows,
  normalizeBoqPriceStatus,
  normalizeBoqRow,
  parseBoqAmount,
  parseBoqCsv,
  parseBoqWorkbookSheets,
  parseCsvRows,
  parseSpreadsheetClipboard,
  validateBoqInlineCellValue,
  saveCustomBoqRows
} from "./boqDataService";

describe("boqDataService", () => {
  it("normalizes BOQ rows and infers level/status", () => {
    const row = normalizeBoqRow({
      keynote: " a1000 ",
      item: "  Concrete work ",
      unit: " m3 ",
      allowance: "5%",
      material: "2,000",
      labor: "500",
      priceStatus: "ติดตามราคา" as never
    });

    expect(row.keynote).toBe("A1000");
    expect(row.item).toBe("Concrete work");
    expect(row.level).toBe(3);
    expect(row.priceStatus).toBe("watch");
    expect(row.id).toMatch(/^boq-/);
    expect(getBoqRowUnitPrice(row)).toBe(2625);
  });

  it("parses CSV rows with quoted commas", () => {
    const rows = parseCsvRows('keynote,item\nA1000,"Concrete, 240 ksc"\n');

    expect(rows).toEqual([
      ["keynote", "item"],
      ["A1000", "Concrete, 240 ksc"]
    ]);
  });

  it("parses spreadsheet clipboard tables copied from Excel or Google Sheets", () => {
    expect(parseSpreadsheetClipboard("Brand A\tSupplier A\r\nBrand B\tSupplier B\r\n")).toEqual([
      ["Brand A", "Supplier A"],
      ["Brand B", "Supplier B"]
    ]);
    expect(parseSpreadsheetClipboard("Single cell")).toEqual([["Single cell"]]);
    expect(parseSpreadsheetClipboard("")).toEqual([]);
  });

  it("validates inline spreadsheet edits before saving", () => {
    expect(BOQ_INLINE_EDITABLE_FIELDS).toContain("material");
    expect(validateBoqInlineCellValue("allowance", "5")).toEqual({
      valid: true,
      value: "5%",
      message: ""
    });
    expect(validateBoqInlineCellValue("material", "1,250")).toMatchObject({ valid: true });
    expect(validateBoqInlineCellValue("labor", "abc")).toMatchObject({
      valid: false,
      message: "ต้องเป็นตัวเลข"
    });
    expect(validateBoqInlineCellValue("updatedAt", "24/05/2026")).toMatchObject({
      valid: false,
      message: "ใช้รูปแบบ YYYY-MM-DD"
    });
    expect(validateBoqInlineCellValue("updatedAt", "2026-02-31")).toMatchObject({
      valid: false,
      message: "ใช้รูปแบบ YYYY-MM-DD"
    });
    expect(validateBoqInlineCellValue("keynote", " ")).toMatchObject({
      valid: false,
      message: "ต้องมีค่า"
    });
  });

  it("imports BOQ CSV into normalized rows", () => {
    const csv = [
      "keynote,item,unit,allowance,material,labor,level,brand,supplier,status,version,source,cost_code,updated,note",
      'A1000,"Concrete, 240 ksc",m3,5%,"2,580",620,3,Brand,Supplier,watch,BBB_2026,sheet,02-400,2026-05-24,"main item"'
    ].join("\n");
    const rows = parseBoqCsv(csv);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      keynote: "A1000",
      item: "Concrete, 240 ksc",
      unit: "m3",
      material: "2,580",
      labor: "620",
      level: 3,
      brand: "Brand",
      supplier: "Supplier",
      priceStatus: "watch",
      priceVersion: "BBB_2026",
      source: "sheet",
      suggestedCostCodeId: "02-400",
      updatedAt: "2026-05-24",
      note: "main item"
    });
  });

  it("imports BBB database CSV headers from the All items sheet", () => {
    const csv = [
      "Keynote,Parent Keynote,Level,Category,Item / รายการ,Unit,Material (THB),Labor (THB),Loss %,Region,Notes",
      "A1000.1,A1000,4,A หมวดงานวิศวกรรมโครงสร้าง,Foundation Excavation,ลบ.ม.,0,150,30,,parent item"
    ].join("\n");
    const rows = parseBoqCsv(csv);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      keynote: "A1000.1",
      item: "Foundation Excavation",
      unit: "ลบ.ม.",
      allowance: "30%",
      material: "0",
      labor: "150",
      level: 3,
    });
    expect(rows[0].note).toContain("parent item");
    expect(rows[0].note).toContain("original_level=4");
  });

  it("builds an import template that round-trips through the BOQ parser", () => {
    const rows = parseBoqCsv(buildBoqImportTemplateCsv());

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      keynote: "A1000.1",
      item: "งานขุดดินฐานราก",
      allowance: "30%",
      suggestedCostCodeId: "01-300",
      level: 3
    });
    expect(rows[0].note).toContain("original_level=4");
    expect(rows[1]).toMatchObject({
      keynote: "B6000",
      allowance: "5%",
      level: 3
    });
  });

  it("imports the All items sheet from an Excel workbook matrix", () => {
    const result = parseBoqWorkbookSheets([
      {
        sheet: "สรุป",
        data: [["Title"], ["Not importable"]]
      },
      {
        sheet: "All items",
        data: [
          ["Keynote", "Parent Keynote", "Level", "Category", "Item / รายการ", "Unit", "Material (THB)", "Labor (THB)", "Loss %", "Region", "Notes"],
          ["A1000.1", "A1000", 4, "A หมวดงานวิศวกรรมโครงสร้าง", "Foundation Excavation", "ลบ.ม.", 0, 150, 30, "TH", "excel note"]
        ]
      }
    ]);

    expect(result.sheetName).toBe("All items");
    expect(result.sheetCount).toBe(2);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      keynote: "A1000.1",
      item: "Foundation Excavation",
      allowance: "30%",
      material: "0",
      labor: "150",
      level: 3,
      source: "xlsx:All items"
    });
    expect(result.rows[0].note).toContain("original_level=4");
    expect(result.rows[0].note).toContain("parent=A1000");
  });

  it("preserves XLS source prefixes when parsing a legacy workbook matrix", () => {
    const result = parseBoqWorkbookSheets(
      [
        {
          sheet: "Legacy BOQ",
          data: [
            ["Keynote", "Item", "Unit", "Material", "Labor", "Cost Code"],
            ["C1001", "Electrical conduit", "m", 70, 40, "04-210"]
          ]
        }
      ],
      { sourcePrefix: "xls", priceVersionPrefix: "xls", idPrefix: "xls" }
    );

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      keynote: "C1001",
      item: "Electrical conduit",
      source: "xls:Legacy BOQ",
      suggestedCostCodeId: "04-210"
    });
    expect(result.rows[0].id).toMatch(/^xls-/);
    expect(result.rows[0].priceVersion).toMatch(/^xls-/);
  });

  it("saves and loads custom rows through the storage adapter", () => {
    const adapter = new MemoryAdapter();
    const row = normalizeBoqRow({
      keynote: "B2000",
      item: "Custom item",
      unit: "item",
      material: "100",
      labor: "50"
    });

    saveCustomBoqRows([row], adapter);

    expect(adapter.read(BOQ_CATALOG_STORAGE_KEY)).not.toBeNull();
    expect(loadCustomBoqRows(adapter)[0]).toMatchObject({
      keynote: "B2000",
      item: "Custom item",
      priceStatus: "current"
    });
  });

  it("merges custom rows over seed records by id", () => {
    const rows = mergeBoqCatalogRows([
      normalizeBoqRow({
        id: "seed-A1000-standard-2025",
        keynote: "A1000",
        item: "Custom seed override",
        unit: "m3",
        material: "999",
        labor: "1"
      })
    ]);

    expect(rows.find((row) => row.id === "seed-A1000-standard-2025")?.item).toBe(
      "Custom seed override"
    );
  });

  it("builds search text and handles amount/status formatting", () => {
    const row = normalizeBoqRow({
      keynote: "C3000",
      item: "Steel",
      unit: "kg",
      material: "25.50",
      labor: "5.20",
      priceStatus: "history" as never,
      note: "archive note"
    });

    expect(getBoqSearchText(row)).toContain("ประวัติราคา");
    expect(normalizeBoqPriceStatus("ตรวจราคา")).toBe("watch");
    expect(parseBoqAmount("1,250.50")).toBe(1250.5);
    expect(formatBoqAmount(1250.5)).toBe("1,250.5");
  });
});
