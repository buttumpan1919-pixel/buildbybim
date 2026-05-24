import {
  boqCatalogRows,
  type BoqCatalogRow,
  type BoqPublishStatus,
  type BoqPriceStatus
} from "../../../data";
import { getStorageAdapter, readJson, writeJson, type StorageAdapter } from "../../../storageAdapter";

export type { BoqPriceStatus, BoqPublishStatus } from "../../../data";

export const BOQ_CATALOG_STORAGE_KEY = "builddocs-pro.boq-catalog.v1";
export const BOQ_VERSION_ALL = "all";

export const boqPriceStatusLabels: Record<BoqPriceStatus, string> = {
  current: "ราคาปัจจุบัน",
  watch: "ติดตามราคา",
  archived: "ประวัติราคา"
};

export const boqPublishStatusLabels: Record<BoqPublishStatus, string> = {
  public: "Public",
  review: "Review",
  private: "Private"
};

export const boqFilterOptions = [
  "all",
  "L1",
  "L2",
  "L3+",
  "A1000",
  "ขุดดิน",
  "คอนกรีต",
  "เหล็ก"
] as const;
export type BoqFilterOption = (typeof boqFilterOptions)[number];

export type BoqDraft = Pick<
  BoqCatalogRow,
  | "id"
  | "keynote"
  | "item"
  | "unit"
  | "allowance"
  | "material"
  | "labor"
  | "level"
  | "brand"
  | "supplier"
  | "priceStatus"
  | "publishStatus"
  | "priceVersion"
  | "source"
  | "dataOwner"
  | "license"
  | "suggestedCostCodeId"
  | "updatedAt"
  | "note"
>;

export function createBlankBoqDraft(): BoqDraft {
  return {
    id: undefined,
    keynote: "",
    item: "",
    unit: "งาน",
    allowance: "0%",
    material: "0",
    labor: "0",
    level: 3,
    brand: "",
    supplier: "",
    priceStatus: "current",
    publishStatus: "review",
    priceVersion: `manual-${new Date().toISOString().slice(0, 10)}`,
    source: "manual",
    dataOwner: "Build By BIM",
    license: "CC BY 4.0",
    suggestedCostCodeId: "",
    updatedAt: new Date().toISOString().slice(0, 10),
    note: ""
  };
}

export function normalizeBoqKey(value: string) {
  return value.trim().toLocaleUpperCase("th-TH");
}

export function parseBoqAmount(value: string) {
  const parsed = Number(value.replace(/,/g, "").replace("%", "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatBoqAmount(value: number) {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return value % 1 === 0
    ? String(Math.round(value))
    : value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function normalizeBoqPriceStatus(value: unknown): BoqPriceStatus {
  if (value === "watch" || value === "archived" || value === "current") {
    return value;
  }

  const normalized = String(value ?? "").trim().toLocaleLowerCase("th-TH");

  if (
    normalized.includes("archive") ||
    normalized.includes("history") ||
    normalized.includes("เก่า") ||
    normalized.includes("ประวัติ")
  ) {
    return "archived";
  }

  if (
    normalized.includes("watch") ||
    normalized.includes("ติดตาม") ||
    normalized.includes("ตรวจ")
  ) {
    return "watch";
  }

  return "current";
}

export function normalizeBoqPublishStatus(value: unknown): BoqPublishStatus {
  if (value === "public" || value === "review" || value === "private") {
    return value;
  }

  const normalized = String(value ?? "").trim().toLocaleLowerCase("th-TH");

  if (
    normalized.includes("private") ||
    normalized.includes("internal") ||
    normalized.includes("ไม่เผยแพร่") ||
    normalized.includes("ส่วนตัว")
  ) {
    return "private";
  }

  if (
    normalized.includes("review") ||
    normalized.includes("draft") ||
    normalized.includes("ตรวจ") ||
    normalized.includes("รอ")
  ) {
    return "review";
  }

  return "public";
}

export function createBoqRecordId(
  row: Pick<BoqCatalogRow, "keynote" | "brand" | "supplier" | "priceVersion" | "material" | "labor">,
  index = 0
) {
  const raw = [
    row.keynote,
    row.supplier || "source",
    row.brand || "brand",
    row.priceVersion || "version",
    row.material,
    row.labor,
    String(index)
  ]
    .join("-")
    .toLocaleLowerCase("th-TH");
  const slug = raw
    .replace(/[^a-z0-9ก-๙]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);

  return `boq-${slug || index}`;
}

export function getBoqRecordId(row: BoqCatalogRow, index = 0) {
  return row.id?.trim() || createBoqRecordId(row, index);
}

export function getBoqSearchText(row: BoqCatalogRow) {
  return [
    row.keynote,
    row.item,
    row.unit,
    row.brand,
    row.supplier,
    row.priceVersion,
    row.source,
    row.dataOwner,
    row.license,
    row.suggestedCostCodeId,
    row.priceStatus ? boqPriceStatusLabels[row.priceStatus] : "",
    row.publishStatus ? boqPublishStatusLabels[row.publishStatus] : "",
    row.note
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("th-TH");
}

export function inferBoqLevel(
  keynote: string,
  material: string,
  labor: string
): BoqCatalogRow["level"] {
  const hasPrice = parseBoqAmount(material) > 0 || parseBoqAmount(labor) > 0;

  if (hasPrice || /\d{3,}/.test(keynote)) {
    return 3;
  }

  return keynote.length <= 1 ? 1 : 2;
}

export function normalizeBoqRow(row: Partial<BoqCatalogRow>, index = 0): BoqCatalogRow {
  const keynote = normalizeBoqKey(row.keynote || `CUSTOM-${index + 1}`);
  const material = row.material?.trim() || "0";
  const labor = row.labor?.trim() || "0";
  const level =
    row.level === 1 || row.level === 2 || row.level === 3
      ? row.level
      : inferBoqLevel(keynote, material, labor);

  const normalizedRow: BoqCatalogRow = {
    keynote,
    item: row.item?.trim() || "รายการ BOQ ใหม่",
    unit: row.unit?.trim() || "งาน",
    allowance: row.allowance?.trim() || "0%",
    material,
    labor,
    level,
    brand: row.brand?.trim() || "",
    supplier: row.supplier?.trim() || "",
    priceStatus: normalizeBoqPriceStatus(row.priceStatus),
    publishStatus: normalizeBoqPublishStatus(row.publishStatus),
    priceVersion: row.priceVersion?.trim() || "manual",
    source: row.source?.trim() || "manual",
    dataOwner: row.dataOwner?.trim() || "Build By BIM",
    license: row.license?.trim() || "CC BY 4.0",
    suggestedCostCodeId: row.suggestedCostCodeId?.trim() || "",
    updatedAt: row.updatedAt?.trim() || new Date().toISOString().slice(0, 10),
    note: row.note?.trim() || ""
  };

  return {
    ...normalizedRow,
    id: row.id?.trim() || createBoqRecordId(normalizedRow, index)
  };
}

export function mergeBoqCatalogRows(customRows: BoqCatalogRow[]) {
  const rowsById = new globalThis.Map<string, BoqCatalogRow>();

  [...boqCatalogRows, ...customRows].forEach((row, index) => {
    const normalized = normalizeBoqRow(row, index);
    rowsById.set(getBoqRecordId(normalized, index), normalized);
  });

  return [...rowsById.values()].sort((a, b) => {
    const keynoteSort = a.keynote.localeCompare(b.keynote, "th-TH");
    if (keynoteSort !== 0) {
      return keynoteSort;
    }

    const statusSort =
      (a.priceStatus === "current" ? 0 : a.priceStatus === "watch" ? 1 : 2) -
      (b.priceStatus === "current" ? 0 : b.priceStatus === "watch" ? 1 : 2);
    if (statusSort !== 0) {
      return statusSort;
    }

    return (b.updatedAt || "").localeCompare(a.updatedAt || "");
  });
}

export function loadCustomBoqRows(adapter: StorageAdapter = getStorageAdapter()) {
  return readJson<BoqCatalogRow[]>(adapter, BOQ_CATALOG_STORAGE_KEY, [], (raw) =>
    Array.isArray(raw)
      ? raw.map((row, index) => normalizeBoqRow(row as Partial<BoqCatalogRow>, index))
      : []
  );
}

export function saveCustomBoqRows(
  rows: BoqCatalogRow[],
  adapter: StorageAdapter = getStorageAdapter()
) {
  writeJson(adapter, BOQ_CATALOG_STORAGE_KEY, rows.map((row) => normalizeBoqRow(row)));
}

export function parseCsvRows(text: string) {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === "\"" && nextChar === "\"") {
      current += "\"";
      index += 1;
      continue;
    }

    if (char === "\"") {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      row.push(current.trim());
      if (row.some(Boolean)) {
        rows.push(row);
      }
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  row.push(current.trim());
  if (row.some(Boolean)) {
    rows.push(row);
  }

  return rows;
}

export function parseSpreadsheetClipboard(text: string) {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const trimmedTrailingLine = normalized.endsWith("\n") ? normalized.slice(0, -1) : normalized;

  if (!trimmedTrailingLine) {
    return [];
  }

  return trimmedTrailingLine.split("\n").map((row) => row.split("\t"));
}

export const BOQ_INLINE_EDITABLE_FIELDS = [
  "keynote",
  "item",
  "brand",
  "supplier",
  "priceVersion",
  "source",
  "dataOwner",
  "license",
  "updatedAt",
  "unit",
  "allowance",
  "material",
  "labor"
] as const;

export type BoqInlineEditableField = (typeof BOQ_INLINE_EDITABLE_FIELDS)[number];

function isBoqNumberLike(value: string) {
  const trimmed = value.trim();

  if (!trimmed || trimmed === "-") {
    return true;
  }

  return Number.isFinite(Number(trimmed.replace(/,/g, "").replace("%", "")));
}

export function normalizeBoqInlineCellValue(field: BoqInlineEditableField, value: string) {
  const trimmed = value.trim();

  if (field === "allowance") {
    if (!trimmed || trimmed === "-") {
      return "0%";
    }
    return trimmed.includes("%") ? trimmed : `${trimmed}%`;
  }

  if (field === "material" || field === "labor") {
    return trimmed || "0";
  }

  return trimmed;
}

export function validateBoqInlineCellValue(field: BoqInlineEditableField, value: string) {
  const normalizedValue = normalizeBoqInlineCellValue(field, value);

  if ((field === "keynote" || field === "item" || field === "unit") && !normalizedValue) {
    return {
      valid: false,
      value: normalizedValue,
      message: "ต้องมีค่า"
    };
  }

  if ((field === "material" || field === "labor" || field === "allowance") && !isBoqNumberLike(normalizedValue)) {
    return {
      valid: false,
      value: normalizedValue,
      message: "ต้องเป็นตัวเลข"
    };
  }

  if (field === "updatedAt" && normalizedValue) {
    const looksLikeDate = /^\d{4}-\d{2}-\d{2}$/.test(normalizedValue);
    const [year, month, day] = normalizedValue.split("-").map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));
    const isRealDate =
      parsedDate.getUTCFullYear() === year &&
      parsedDate.getUTCMonth() === month - 1 &&
      parsedDate.getUTCDate() === day;

    if (!looksLikeDate || !isRealDate) {
      return {
        valid: false,
        value: normalizedValue,
        message: "ใช้รูปแบบ YYYY-MM-DD"
      };
    }
  }

  return {
    valid: true,
    value: normalizedValue,
    message: ""
  };
}

export type BoqImportCell = string | number | boolean | Date | typeof Date | null | undefined;

export type BoqWorkbookSheet = {
  sheet: string;
  data: BoqImportCell[][];
};

export type BoqWorkbookImportResult = {
  sheetName: string;
  sheetCount: number;
  rows: BoqCatalogRow[];
};

export type BoqWorkbookParseOptions = {
  sourcePrefix?: string;
  priceVersionPrefix?: string;
  idPrefix?: string;
};

type BoqTableParseOptions = {
  defaultPriceVersion?: string;
  defaultSource?: string;
  idPrefix?: string;
  updatedAt?: string;
};

export const BOQ_IMPORT_TEMPLATE_HEADERS = [
  "Keynote",
  "Parent Keynote",
  "Level",
  "Category",
  "Item / รายการ",
  "Unit",
  "Material (THB)",
  "Labor (THB)",
  "Loss %",
  "Region",
  "Notes",
  "publish_status",
  "data_owner",
  "license",
  "cost_code"
] as const;

export const BOQ_IMPORT_TEMPLATE_ROWS: BoqImportCell[][] = [
  [
    "A1000.1",
    "A1000",
    4,
    "A หมวดงานวิศวกรรมโครงสร้าง",
    "งานขุดดินฐานราก",
    "ลบ.ม.",
    0,
    150,
    30,
    "TH",
    "ตัวอย่างแถวข้อมูล: ระบบจะแปลง Level > 3 เป็น L3+ และเก็บ original_level ใน note",
    "review",
    "Build By BIM",
    "CC BY 4.0",
    "01-300"
  ],
  [
    "B6000",
    "B6",
    3,
    "B หมวดงานสถาปัตยกรรม",
    "งานทาสีผนัง",
    "ตร.ม.",
    45,
    50,
    5,
    "TH",
    "ถ้าไม่มี cost_code ระบบจะ infer จาก Keynote ให้เมื่อทำ BOQ linkage",
    "review",
    "Build By BIM",
    "CC BY 4.0",
    ""
  ]
];

function stringifyImportCell(value: BoqImportCell) {
  if (value === null || value === undefined) {
    return "";
  }
  if (value === Date) {
    return "";
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "" : value.toISOString().slice(0, 10);
  }
  return String(value).trim();
}

function escapeCsvValue(value: BoqImportCell) {
  const text = stringifyImportCell(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
}

export function buildBoqImportTemplateCsv() {
  return [BOQ_IMPORT_TEMPLATE_HEADERS, ...BOQ_IMPORT_TEMPLATE_ROWS]
    .map((row) => row.map((cell) => escapeCsvValue(cell)).join(","))
    .join("\n");
}

export function getCsvColumnIndex(headers: string[], candidates: string[]) {
  const normalizedHeaders = headers.map((header) => header.trim().toLocaleLowerCase("th-TH"));
  const normalizedCandidates = candidates.map((candidate) => candidate.toLocaleLowerCase("th-TH"));

  const exactIndex = normalizedHeaders.findIndex((header) =>
    normalizedCandidates.some((candidate) => header === candidate)
  );

  if (exactIndex >= 0) {
    return exactIndex;
  }

  return normalizedHeaders.findIndex((header) =>
    normalizedCandidates.some((candidate) => {
      if (candidate === "note" && header === "keynote") {
        return false;
      }
      return header.includes(candidate);
    })
  );
}

function normalizeCsvAllowance(value: string, header = "") {
  const trimmed = value.trim();
  if (!trimmed) {
    return "0%";
  }
  if (trimmed.includes("%")) {
    return trimmed;
  }

  const normalizedHeader = header.toLocaleLowerCase("th-TH");
  if (
    normalizedHeader.includes("loss") ||
    normalizedHeader.includes("waste") ||
    normalizedHeader.includes("เผื่อ") ||
    normalizedHeader.includes("%")
  ) {
    return `${trimmed}%`;
  }

  return trimmed;
}

export function parseBoqTableRows(tableRows: BoqImportCell[][], options: BoqTableParseOptions = {}) {
  const rows = tableRows.map((row) => row.map((cell) => stringifyImportCell(cell)));
  const headers = rows[0] ?? [];

  if (rows.length < 2) {
    return [];
  }

  const columns = {
    id: getCsvColumnIndex(headers, ["id", "record", "record_id"]),
    parentKeynote: getCsvColumnIndex(headers, ["parent_keynote", "parent keynote", "parent"]),
    keynote: getCsvColumnIndex(headers, ["keynote", "code", "รหัส", "ลำดับ"]),
    category: getCsvColumnIndex(headers, ["category", "หมวด"]),
    item: getCsvColumnIndex(headers, ["รายการ", "description", "item", "name", "งาน"]),
    unit: getCsvColumnIndex(headers, ["หน่วย", "unit"]),
    allowance: getCsvColumnIndex(headers, ["%เผื่อ", "allowance", "เผื่อ", "waste", "loss"]),
    material: getCsvColumnIndex(headers, ["ราคาวัสดุ", "material", "วัสดุ"]),
    labor: getCsvColumnIndex(headers, ["ราคาแรงงาน", "labor", "ค่าแรง", "แรงงาน"]),
    level: getCsvColumnIndex(headers, ["level", "ระดับ"]),
    brand: getCsvColumnIndex(headers, ["brand", "ยี่ห้อ", "รุ่น", "spec"]),
    supplier: getCsvColumnIndex(headers, ["supplier", "vendor", "ร้าน", "ร้านค้า", "ผู้ขาย"]),
    priceStatus: getCsvColumnIndex(headers, ["status", "สถานะ", "price_status"]),
    publishStatus: getCsvColumnIndex(headers, ["publish_status", "publish status", "publish", "visibility", "public", "เผยแพร่"]),
    priceVersion: getCsvColumnIndex(headers, ["version", "pricebook", "price_book", "ชุดราคา", "เวอร์ชัน"]),
    source: getCsvColumnIndex(headers, ["source", "แหล่งข้อมูล", "ที่มา", "google sheet"]),
    dataOwner: getCsvColumnIndex(headers, ["data_owner", "data owner", "owner", "เจ้าของข้อมูล"]),
    license: getCsvColumnIndex(headers, ["license", "licence", "ลิขสิทธิ์", "สิทธิ์ใช้งาน"]),
    suggestedCostCodeId: getCsvColumnIndex(headers, ["cost_code", "cost code", "cost_code_id", "costcode", "suggested_cost_code", "suggested_cost_code_id"]),
    updatedAt: getCsvColumnIndex(headers, ["updated", "updated_at", "วันที่", "date", "อัปเดต"]),
    region: getCsvColumnIndex(headers, ["region", "พื้นที่"]),
    note: getCsvColumnIndex(headers, ["notes", "note", "remark", "หมายเหตุ"])
  };
  const importBatchId = Date.now().toString(36);

  return rows
    .slice(1)
    .map((cells, index) => {
      const keynote = columns.keynote >= 0 ? cells[columns.keynote] : "";
      const material = columns.material >= 0 ? cells[columns.material] : "0";
      const labor = columns.labor >= 0 ? cells[columns.labor] : "0";
      const parsedLevel = columns.level >= 0 ? Number(cells[columns.level]) : 0;
      const level =
        parsedLevel === 1 || parsedLevel === 2 || parsedLevel === 3
          ? parsedLevel
          : parsedLevel > 3
            ? 3
            : inferBoqLevel(keynote, material, labor);
      const allowance =
        columns.allowance >= 0
          ? normalizeCsvAllowance(cells[columns.allowance] ?? "", headers[columns.allowance] ?? "")
          : "0%";
      const noteParts = [
        columns.note >= 0 ? cells[columns.note] : "",
        columns.parentKeynote >= 0 && cells[columns.parentKeynote] ? `parent=${cells[columns.parentKeynote]}` : "",
        parsedLevel > 3 ? `original_level=${parsedLevel}` : "",
        columns.category >= 0 && cells[columns.category] ? `category=${cells[columns.category]}` : "",
        columns.region >= 0 && cells[columns.region] ? `region=${cells[columns.region]}` : ""
      ].filter(Boolean);

      return normalizeBoqRow(
        {
          keynote,
          item: columns.item >= 0 ? cells[columns.item] : "",
          unit: columns.unit >= 0 ? cells[columns.unit] : "",
          allowance,
          material,
          labor,
          level,
          brand: columns.brand >= 0 ? cells[columns.brand] : "",
          supplier: columns.supplier >= 0 ? cells[columns.supplier] : "",
          priceStatus: normalizeBoqPriceStatus(
            columns.priceStatus >= 0 ? cells[columns.priceStatus] : "current"
          ),
          publishStatus: normalizeBoqPublishStatus(
            columns.publishStatus >= 0 ? cells[columns.publishStatus] : "review"
          ),
          priceVersion: columns.priceVersion >= 0 ? cells[columns.priceVersion] : options.defaultPriceVersion ?? `sheet-${importBatchId}`,
          source: columns.source >= 0 ? cells[columns.source] : options.defaultSource ?? "google-sheet",
          dataOwner: columns.dataOwner >= 0 ? cells[columns.dataOwner] : "Build By BIM",
          license: columns.license >= 0 ? cells[columns.license] : "CC BY 4.0",
          suggestedCostCodeId: columns.suggestedCostCodeId >= 0 ? cells[columns.suggestedCostCodeId] : "",
          updatedAt: columns.updatedAt >= 0 ? cells[columns.updatedAt] : options.updatedAt ?? new Date().toISOString().slice(0, 10),
          note: noteParts.join("; "),
          id: columns.id >= 0 ? cells[columns.id] : `${options.idPrefix ?? "sheet"}-${importBatchId}-${index + 1}`
        },
        index
      );
    })
    .filter((row) => row.keynote && row.item);
}

export function parseBoqCsv(text: string) {
  return parseBoqTableRows(parseCsvRows(text));
}

export function parseBoqWorkbookSheets(
  sheets: BoqWorkbookSheet[],
  options: BoqWorkbookParseOptions = {}
): BoqWorkbookImportResult {
  const selectedSheet =
    sheets.find((sheet) => sheet.sheet.trim().toLocaleLowerCase("th-TH") === "all items") ??
    sheets.find((sheet) => parseBoqTableRows(sheet.data).length > 0) ??
    sheets[0];

  if (!selectedSheet) {
    return { sheetName: "", sheetCount: 0, rows: [] };
  }

  const sourcePrefix = options.sourcePrefix ?? "xlsx";
  const priceVersionPrefix = options.priceVersionPrefix ?? sourcePrefix;

  return {
    sheetName: selectedSheet.sheet,
    sheetCount: sheets.length,
    rows: parseBoqTableRows(selectedSheet.data, {
      defaultPriceVersion: `${priceVersionPrefix}-${new Date().toISOString().slice(0, 10)}`,
      defaultSource: `${sourcePrefix}:${selectedSheet.sheet}`,
      idPrefix: options.idPrefix ?? sourcePrefix
    })
  };
}
