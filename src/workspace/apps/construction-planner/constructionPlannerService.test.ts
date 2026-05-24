import { describe, expect, it } from "vitest";

import { MemoryAdapter } from "../../../storageAdapter";
import { constructionPlanningSeed } from "./constructionPlanningSeed";
import {
  CONSTRUCTION_PLANNER_STORAGE_KEY,
  formatBuddhistDate,
  loadConstructionPlanPreview,
  parseConstructionPlanWorkbook,
  saveConstructionPlanPreview,
  summarizeConstructionPlan,
  type ConstructionImportCell,
  type ConstructionWorkbookSheet
} from "./constructionPlannerService";

function makeRows(rowCount: number, columnCount: number): ConstructionImportCell[][] {
  return Array.from({ length: rowCount }, () => Array.from({ length: columnCount }, () => ""));
}

function createWorkbookFixture(): ConstructionWorkbookSheet[] {
  const planRows = makeRows(63, 14);
  planRows[0][1] = "แผนงานก่อสร้างบ้านพักอาศัย";
  planRows[1][1] = "โครงการ: บ้านพักอาศัยทดสอบ";
  planRows[1][11] = "ADT-TEST/67";
  planRows[2][1] = "สถานที่: กรุงเทพฯ";
  planRows[6] = [
    1,
    "แผนงานก่อสร้างบ้านพักอาศัย",
    "แผนงานก่อสร้างบ้านพักอาศัย",
    "",
    "",
    "",
    "",
    "",
    new Date(2567, 2, 1),
    new Date(2567, 2, 10),
    10,
    1000
  ];
  planRows[7] = [
    2,
    1,
    "งานเตรียมการ",
    "",
    "",
    "",
    "",
    "",
    new Date(2567, 2, 1),
    new Date(2567, 2, 10),
    10,
    1000
  ];
  planRows[8] = [
    3,
    "1.1",
    "งานถางป่า",
    "",
    "",
    "",
    "",
    "",
    new Date(2567, 2, 1),
    new Date(2567, 2, 10),
    10,
    1000
  ];

  const boqRows = makeRows(91, 14);
  boqRows[7] = ["1", "งานเตรียมการ"];
  boqRows[8] = ["1.1", "งานถางป่า", "", "", "", "", "", "ตร.ม.", 10, 50, 500, 50, 500, 1000];

  return [
    {
      sheet: "แผนงานก่อสร้าง",
      data: planRows,
      formulas: {
        L7: "L8",
        L8: "SUM(L9:L9)",
        L9: "BOQ!N9"
      }
    },
    {
      sheet: "BOQ",
      data: boqRows,
      formulas: {
        N9: "K9+M9"
      }
    }
  ];
}

describe("constructionPlannerService", () => {
  it("parses Thai construction plan and BOQ matrices", () => {
    const preview = parseConstructionPlanWorkbook(createWorkbookFixture(), "fixture.xlsx");

    expect(preview.sourceLabel).toBe("fixture.xlsx");
    expect(preview.project).toMatchObject({
      title: "แผนงานก่อสร้างบ้านพักอาศัย",
      projectName: "บ้านพักอาศัยทดสอบ",
      location: "กรุงเทพฯ",
      contractNo: "ADT-TEST/67",
      startDate: "2024-03-01",
      endDate: "2024-03-10",
      durationDays: 10,
      totalAmount: 1000
    });
    expect(preview.tasks).toHaveLength(3);
    expect(preview.tasks[0]).toMatchObject({
      row: 7,
      level: 0,
      amountFormula: "=L8"
    });
    expect(preview.tasks[2]).toMatchObject({
      code: "1.1",
      level: 2,
      amountFormula: "=BOQ!N9"
    });
    expect(preview.boqItems).toHaveLength(2);
    expect(preview.boqItems[1]).toMatchObject({
      row: 9,
      code: "1.1",
      unit: "ตร.ม.",
      quantity: 10,
      materialAmount: 500,
      laborAmount: 500,
      totalAmount: 1000,
      totalFormula: "=K9+M9"
    });
    expect(preview.curve[preview.curve.length - 1]?.plannedPercent).toBe(100);
  });

  it("converts Buddhist-year dates for display and internal timeline", () => {
    const preview = parseConstructionPlanWorkbook(createWorkbookFixture());

    expect(preview.tasks[0].startDate).toBe("2024-03-01");
    expect(formatBuddhistDate(preview.tasks[0].startDate)).toBe("01/03/2567");
  });

  it("loads and saves preview data through the storage adapter", () => {
    const adapter = new MemoryAdapter();
    const preview = parseConstructionPlanWorkbook(createWorkbookFixture(), "stored.xlsx");

    saveConstructionPlanPreview(preview, adapter);

    expect(adapter.list()).toContain(CONSTRUCTION_PLANNER_STORAGE_KEY);
    expect(loadConstructionPlanPreview(adapter)).toMatchObject({
      sourceLabel: "stored.xlsx",
      project: {
        contractNo: "ADT-TEST/67"
      }
    });
  });

  it("rejects empty or invalid workbooks", () => {
    expect(() => parseConstructionPlanWorkbook([], "empty.xlsx")).toThrow("ไม่พบ sheet แผนงานก่อสร้าง");
    expect(() =>
      parseConstructionPlanWorkbook([{ sheet: "แผนงานก่อสร้าง", data: makeRows(63, 14) }], "missing-boq.xlsx")
    ).toThrow("ไม่พบ sheet BOQ");
  });

  it("keeps the built-in seed aligned with the source workbook preview counts", () => {
    const summary = summarizeConstructionPlan(constructionPlanningSeed);

    expect(constructionPlanningSeed.project.durationDays).toBe(150);
    expect(constructionPlanningSeed.project.totalAmount).toBeCloseTo(2169750.589125, 6);
    expect(summary.taskCount).toBe(57);
    expect(summary.boqCount).toBe(84);
    expect(constructionPlanningSeed.curve.length).toBeGreaterThan(0);
  });
});
