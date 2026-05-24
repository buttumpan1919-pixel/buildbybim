import { getStorageAdapter, readJson, writeJson, type StorageAdapter } from "../../../storageAdapter";

export const CONSTRUCTION_PLANNER_STORAGE_KEY = "construction-planner.preview.v1";

export type ConstructionImportCell = string | number | boolean | Date | null | undefined;

export type ConstructionWorkbookSheet = {
  sheet: string;
  data: ConstructionImportCell[][];
  formulas?: Record<string, string>;
};

export type ConstructionPlanProject = {
  title: string;
  projectName: string;
  location: string;
  contractNo: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  totalAmount: number;
};

export type ConstructionTask = {
  row: number;
  sequence: number;
  code: string;
  name: string;
  level: 0 | 1 | 2;
  startDate: string;
  endDate: string;
  durationDays: number;
  amount: number;
  amountFormula: string;
};

export type ConstructionBoqItem = {
  row: number;
  code: string;
  name: string;
  level: 1 | 2 | 3;
  unit: string;
  quantity: number | null;
  materialUnit: number | null;
  materialAmount: number | null;
  laborUnit: number | null;
  laborAmount: number | null;
  totalAmount: number | null;
  totalFormula: string;
};

export type ConstructionCurvePoint = {
  week: number;
  date: string;
  plannedAmount: number;
  plannedPercent: number;
};

export type ConstructionPlanPreview = {
  sourceLabel: string;
  importedAt: string;
  project: ConstructionPlanProject;
  tasks: ConstructionTask[];
  boqItems: ConstructionBoqItem[];
  curve: ConstructionCurvePoint[];
};

export function parseConstructionPlanWorkbook(
  sheets: ConstructionWorkbookSheet[],
  sourceLabel = "Construction Planning Spreadsheet.xlsx"
): ConstructionPlanPreview {
  const planSheet = findSheet(sheets, ["แผนงาน", "schedule", "plan"]);
  const boqSheet = findSheet(sheets, ["boq"]);

  if (!planSheet) {
    throw new Error("ไม่พบ sheet แผนงานก่อสร้าง");
  }

  if (!boqSheet) {
    throw new Error("ไม่พบ sheet BOQ");
  }

  const tasks = parseConstructionTasks(planSheet);
  const boqItems = parseConstructionBoqItems(boqSheet);

  if (!tasks.length) {
    throw new Error("ไม่พบรายการงานใน sheet แผนงานก่อสร้าง");
  }

  if (!boqItems.length) {
    throw new Error("ไม่พบรายการ BOQ ใน workbook");
  }

  const rootTask = tasks[0];
  const project: ConstructionPlanProject = {
    title: stringifyCell(getCell(planSheet.data, 1, 2)) || rootTask.name,
    projectName: textAfterColon(stringifyCell(getCell(planSheet.data, 2, 2))) || rootTask.name,
    location: textAfterColon(stringifyCell(getCell(planSheet.data, 3, 2))),
    contractNo: stringifyCell(getCell(planSheet.data, 2, 12)),
    startDate: rootTask.startDate,
    endDate: rootTask.endDate,
    durationDays: rootTask.durationDays,
    totalAmount: rootTask.amount
  };

  return {
    sourceLabel,
    importedAt: new Date().toISOString(),
    project,
    tasks,
    boqItems,
    curve: buildPlannedCurve(tasks, project)
  };
}

export function normalizeConstructionPlanPreview(
  raw: Partial<ConstructionPlanPreview>
): ConstructionPlanPreview | null {
  if (!raw.project || !Array.isArray(raw.tasks) || !Array.isArray(raw.boqItems)) {
    return null;
  }

  const project: ConstructionPlanProject = {
    title: String(raw.project.title ?? ""),
    projectName: String(raw.project.projectName ?? ""),
    location: String(raw.project.location ?? ""),
    contractNo: String(raw.project.contractNo ?? ""),
    startDate: normalizeIsoDate(raw.project.startDate) ?? "",
    endDate: normalizeIsoDate(raw.project.endDate) ?? "",
    durationDays: parseNumber(raw.project.durationDays),
    totalAmount: parseNumber(raw.project.totalAmount)
  };

  const tasks = raw.tasks
    .map((task) => normalizeTask(task as Partial<ConstructionTask>))
    .filter((task): task is ConstructionTask => Boolean(task));
  const boqItems = raw.boqItems
    .map((item) => normalizeBoqItem(item as Partial<ConstructionBoqItem>))
    .filter((item): item is ConstructionBoqItem => Boolean(item));

  if (!tasks.length || !boqItems.length) {
    return null;
  }

  return {
    sourceLabel: String(raw.sourceLabel ?? "Imported workbook"),
    importedAt: String(raw.importedAt ?? new Date().toISOString()),
    project,
    tasks,
    boqItems,
    curve:
      Array.isArray(raw.curve) && raw.curve.length
        ? raw.curve.map(normalizeCurvePoint).filter((point): point is ConstructionCurvePoint => Boolean(point))
        : buildPlannedCurve(tasks, project)
  };
}

export function loadConstructionPlanPreview(adapter: StorageAdapter = getStorageAdapter()) {
  return readJson<ConstructionPlanPreview | null>(
    adapter,
    CONSTRUCTION_PLANNER_STORAGE_KEY,
    null,
    (raw) => normalizeConstructionPlanPreview(raw as Partial<ConstructionPlanPreview>)
  );
}

export function saveConstructionPlanPreview(
  preview: ConstructionPlanPreview,
  adapter: StorageAdapter = getStorageAdapter()
) {
  writeJson(adapter, CONSTRUCTION_PLANNER_STORAGE_KEY, preview);
}

export function removeConstructionPlanPreview(adapter: StorageAdapter = getStorageAdapter()) {
  adapter.remove(CONSTRUCTION_PLANNER_STORAGE_KEY);
}

export function formatBuddhistDate(isoDate: string) {
  const parts = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!parts) {
    return "-";
  }

  return `${parts[3]}/${parts[2]}/${Number(parts[1]) + 543}`;
}

export function getConstructionLeafTasks(tasks: ConstructionTask[]) {
  return tasks.filter((task) => task.level === 2 && task.amount > 0 && task.startDate && task.endDate);
}

export function summarizeConstructionPlan(preview: ConstructionPlanPreview) {
  const leafTasks = getConstructionLeafTasks(preview.tasks);
  const boqTotal = preview.boqItems.reduce((sum, item) => sum + (item.totalAmount ?? 0), 0);
  const materialTotal = preview.boqItems.reduce((sum, item) => sum + (item.materialAmount ?? 0), 0);
  const laborTotal = preview.boqItems.reduce((sum, item) => sum + (item.laborAmount ?? 0), 0);

  return {
    taskCount: preview.tasks.length,
    leafTaskCount: leafTasks.length,
    boqCount: preview.boqItems.length,
    boqTotal,
    materialTotal,
    laborTotal,
    plannedWeeks: preview.curve.length,
    firstTask: leafTasks[0],
    lastTask: leafTasks[leafTasks.length - 1]
  };
}

function parseConstructionTasks(sheet: ConstructionWorkbookSheet) {
  const tasks: ConstructionTask[] = [];

  for (let row = 7; row <= 63; row += 1) {
    const values = sheet.data[row - 1] ?? [];
    const sequence = parseNumber(values[0]);
    const rawCode = values[1];
    const rawName = values[2] || values[1];
    const name = stringifyCell(rawName);
    const startDate = normalizeSpreadsheetDate(values[8]);
    const endDate = normalizeSpreadsheetDate(values[9]);
    const durationDays = parseNumber(values[10]);
    const amount = parseNumber(values[11]);

    if (!sequence || !name || !startDate || !endDate) {
      continue;
    }

    tasks.push({
      row,
      sequence,
      code: stringifyCell(rawCode),
      name,
      level: inferTaskLevel(row, rawCode),
      startDate,
      endDate,
      durationDays: durationDays || differenceInDays(startDate, endDate) + 1,
      amount,
      amountFormula: getFormula(sheet, row, 12)
    });
  }

  return tasks;
}

function parseConstructionBoqItems(sheet: ConstructionWorkbookSheet) {
  const items: ConstructionBoqItem[] = [];

  for (let row = 8; row <= 91; row += 1) {
    const values = sheet.data[row - 1] ?? [];
    const code = stringifyCell(values[0]);
    const name = stringifyCell(values[1]);

    if (!code && !name) {
      continue;
    }

    items.push({
      row,
      code,
      name,
      level: inferBoqLevel(code, values),
      unit: stringifyCell(values[7]),
      quantity: parseNullableNumber(values[8]),
      materialUnit: parseNullableNumber(values[9]),
      materialAmount: parseNullableNumber(values[10]),
      laborUnit: parseNullableNumber(values[11]),
      laborAmount: parseNullableNumber(values[12]),
      totalAmount: parseNullableNumber(values[13]),
      totalFormula: getFormula(sheet, row, 14)
    });
  }

  return items;
}

function buildPlannedCurve(tasks: ConstructionTask[], project: ConstructionPlanProject) {
  const leafTasks = getConstructionLeafTasks(tasks);
  const totalDays = Math.max(differenceInDays(project.startDate, project.endDate) + 1, 1);
  const totalAmount = project.totalAmount || leafTasks.reduce((sum, task) => sum + task.amount, 0);
  const curve: ConstructionCurvePoint[] = [];

  for (let offset = 0, week = 1; offset < totalDays; offset += 7, week += 1) {
    const pointDate = addDays(project.startDate, Math.min(offset + 6, totalDays - 1));
    const plannedAmount = leafTasks.reduce(
      (sum, task) => sum + getTaskPlannedAmount(task, pointDate),
      0
    );

    curve.push({
      week,
      date: pointDate,
      plannedAmount: Math.min(plannedAmount, totalAmount),
      plannedPercent: totalAmount > 0 ? Math.min((plannedAmount / totalAmount) * 100, 100) : 0
    });
  }

  const finalPoint = curve[curve.length - 1];
  if (finalPoint && finalPoint.date !== project.endDate) {
    curve.push({
      week: finalPoint.week + 1,
      date: project.endDate,
      plannedAmount: totalAmount,
      plannedPercent: 100
    });
  }

  return curve;
}

function getTaskPlannedAmount(task: ConstructionTask, pointDate: string) {
  if (pointDate < task.startDate) {
    return 0;
  }

  if (pointDate >= task.endDate) {
    return task.amount;
  }

  const elapsed = differenceInDays(task.startDate, pointDate) + 1;
  const duration = Math.max(task.durationDays, differenceInDays(task.startDate, task.endDate) + 1, 1);
  return task.amount * Math.min(elapsed / duration, 1);
}

function findSheet(sheets: ConstructionWorkbookSheet[], candidates: string[]) {
  return sheets.find((sheet) => {
    const name = sheet.sheet.toLocaleLowerCase("th-TH");
    return candidates.some((candidate) => name.includes(candidate.toLocaleLowerCase("th-TH")));
  });
}

function getCell(data: ConstructionImportCell[][], row: number, column: number) {
  return data[row - 1]?.[column - 1];
}

function getFormula(sheet: ConstructionWorkbookSheet, row: number, column: number) {
  const key = `${columnName(column)}${row}`;
  const formula = sheet.formulas?.[key];
  return formula ? `=${formula.replace(/^=/, "")}` : "";
}

function columnName(column: number) {
  let name = "";
  let current = column;

  while (current > 0) {
    const mod = (current - 1) % 26;
    name = String.fromCharCode(65 + mod) + name;
    current = Math.floor((current - mod) / 26);
  }

  return name;
}

function stringifyCell(value: ConstructionImportCell) {
  if (value instanceof Date) {
    return normalizeSpreadsheetDate(value) ?? "";
  }

  return String(value ?? "").trim();
}

function textAfterColon(value: string) {
  const colonIndex = value.indexOf(":");
  return (colonIndex >= 0 ? value.slice(colonIndex + 1) : value).trim();
}

function parseNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed =
    typeof value === "number" ? value : Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeIsoDate(value: unknown) {
  if (typeof value !== "string") {
    return normalizeSpreadsheetDate(value as ConstructionImportCell);
  }

  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    return normalizeSpreadsheetDate(value);
  }

  let year = Number(match[1]);
  if (year > 2400) {
    year -= 543;
  }

  return toIsoDate(year, Number(match[2]), Number(match[3]));
}

function normalizeSpreadsheetDate(value: ConstructionImportCell) {
  if (value instanceof Date) {
    let year = value.getFullYear();
    if (year > 2400) {
      year -= 543;
    }

    return toIsoDate(year, value.getMonth() + 1, value.getDate());
  }

  if (typeof value === "number" && value > 20000) {
    const date = new Date(Date.UTC(1899, 11, 30 + Math.floor(value)));
    let year = date.getUTCFullYear();
    if (year > 2400) {
      year -= 543;
    }

    return toIsoDate(year, date.getUTCMonth() + 1, date.getUTCDate());
  }

  const text = String(value ?? "").trim();
  const match = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);

  if (!match) {
    return "";
  }

  let year = Number(match[1]);
  if (year > 2400) {
    year -= 543;
  }

  return toIsoDate(year, Number(match[2]), Number(match[3]));
}

function toIsoDate(year: number, month: number, day: number) {
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}`;
}

function dateToTime(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function differenceInDays(startDate: string, endDate: string) {
  return Math.round((dateToTime(endDate) - dateToTime(startDate)) / 86_400_000);
}

function addDays(startDate: string, days: number) {
  const date = new Date(dateToTime(startDate) + days * 86_400_000);
  return toIsoDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

function inferTaskLevel(row: number, code: ConstructionImportCell): 0 | 1 | 2 {
  if (row === 7) {
    return 0;
  }

  if (typeof code === "number" && Number.isInteger(code)) {
    return 1;
  }

  const text = stringifyCell(code);
  return text && !text.includes(".") ? 1 : 2;
}

function inferBoqLevel(code: string, values: ConstructionImportCell[]): 1 | 2 | 3 {
  if (code && !code.includes(".")) {
    return 1;
  }

  const hasPrice =
    parseNumber(values[8]) > 0 ||
    parseNumber(values[9]) > 0 ||
    parseNumber(values[10]) > 0 ||
    parseNumber(values[11]) > 0 ||
    parseNumber(values[12]) > 0 ||
    parseNumber(values[13]) > 0;

  return hasPrice ? 3 : 2;
}

function normalizeTask(task: Partial<ConstructionTask>) {
  const name = String(task.name ?? "").trim();
  const startDate = normalizeIsoDate(task.startDate);
  const endDate = normalizeIsoDate(task.endDate);

  if (!name || !startDate || !endDate) {
    return null;
  }

  return {
    row: parseNumber(task.row),
    sequence: parseNumber(task.sequence),
    code: String(task.code ?? ""),
    name,
    level: task.level === 0 || task.level === 1 || task.level === 2 ? task.level : 2,
    startDate,
    endDate,
    durationDays: parseNumber(task.durationDays),
    amount: parseNumber(task.amount),
    amountFormula: String(task.amountFormula ?? "")
  } satisfies ConstructionTask;
}

function normalizeBoqItem(item: Partial<ConstructionBoqItem>) {
  const name = String(item.name ?? "").trim();

  if (!name) {
    return null;
  }

  return {
    row: parseNumber(item.row),
    code: String(item.code ?? ""),
    name,
    level: item.level === 1 || item.level === 2 || item.level === 3 ? item.level : 3,
    unit: String(item.unit ?? ""),
    quantity: item.quantity === null ? null : parseNullableNumber(item.quantity),
    materialUnit: item.materialUnit === null ? null : parseNullableNumber(item.materialUnit),
    materialAmount: item.materialAmount === null ? null : parseNullableNumber(item.materialAmount),
    laborUnit: item.laborUnit === null ? null : parseNullableNumber(item.laborUnit),
    laborAmount: item.laborAmount === null ? null : parseNullableNumber(item.laborAmount),
    totalAmount: item.totalAmount === null ? null : parseNullableNumber(item.totalAmount),
    totalFormula: String(item.totalFormula ?? "")
  } satisfies ConstructionBoqItem;
}

function normalizeCurvePoint(point: Partial<ConstructionCurvePoint>) {
  const date = normalizeIsoDate(point.date);
  if (!date) {
    return null;
  }

  return {
    week: parseNumber(point.week),
    date,
    plannedAmount: parseNumber(point.plannedAmount),
    plannedPercent: parseNumber(point.plannedPercent)
  } satisfies ConstructionCurvePoint;
}
