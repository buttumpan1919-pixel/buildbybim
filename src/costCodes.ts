// Cost Codes (CBS) domain module — Sprint 1 (Builk parity)
// Spec: docs/COST_CODES_PRD.md
//
// Module-isolated per PRD Section 6 — UI -> domain service -> storageAdapter
// -> localStorage/Supabase. Never touches window.localStorage directly.

import { defaultStorageAdapter, readJson, writeJson } from "./storageAdapter";
import { seedThaiCostCodes } from "./costCodes.seed";

export const COST_CODES_STORAGE_KEY = "cost-codes.catalog.v1";

export type CostCodeCategory =
  | "site"
  | "structure"
  | "architecture"
  | "mep"
  | "finishing"
  | "external"
  | "indirect"
  | "custom";

export type CostCodeUnit =
  | "lump_sum"
  | "sq_m"
  | "cubic_m"
  | "linear_m"
  | "piece"
  | "set"
  | "kg"
  | "ton"
  | "day"
  | "month"
  | "custom";

export type CostCode = {
  id: string;
  workspaceId: string; // empty = system seed (shared); else custom per workspace
  code: string;
  parentCode: string; // empty = root
  name: string;
  nameEn: string;
  description: string;
  category: CostCodeCategory;
  defaultUnit: CostCodeUnit;
  customUnit: string;
  defaultUnitPrice: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CostCodeState = {
  codes: CostCode[];
  updatedAt: string;
};

type CostCodeStateInput = {
  codes?: Partial<CostCode>[];
  updatedAt?: string;
};

export const costCodeCategoryCopy: Record<
  CostCodeCategory,
  { th: string; en: string; emoji: string; codePrefix: string }
> = {
  site: { th: "งานพื้นที่", en: "Site Work", emoji: "🏗️", codePrefix: "01" },
  structure: { th: "โครงสร้าง", en: "Structure", emoji: "🏛️", codePrefix: "02" },
  architecture: { th: "สถาปัตยกรรม", en: "Architecture", emoji: "🧱", codePrefix: "03" },
  mep: { th: "งานระบบ MEP", en: "MEP", emoji: "⚡", codePrefix: "04" },
  finishing: { th: "งานตกแต่ง", en: "Finishing", emoji: "🎨", codePrefix: "05" },
  external: { th: "ภายนอก", en: "External", emoji: "🌳", codePrefix: "06" },
  indirect: { th: "ค่าใช้จ่ายทางอ้อม", en: "Indirect", emoji: "📋", codePrefix: "07" },
  custom: { th: "กำหนดเอง", en: "Custom", emoji: "✏️", codePrefix: "99" }
};

export const costCodeUnitCopy: Record<
  CostCodeUnit,
  { th: string; en: string; short: string }
> = {
  lump_sum: { th: "เหมา", en: "Lump sum", short: "เหมา" },
  sq_m: { th: "ตารางเมตร", en: "Square meter", short: "ตร.ม." },
  cubic_m: { th: "ลูกบาศก์เมตร", en: "Cubic meter", short: "ลบ.ม." },
  linear_m: { th: "เมตรเชิงเส้น", en: "Linear meter", short: "เมตร" },
  piece: { th: "ชิ้น", en: "Piece", short: "ชิ้น" },
  set: { th: "ชุด", en: "Set", short: "ชุด" },
  kg: { th: "กิโลกรัม", en: "Kilogram", short: "kg" },
  ton: { th: "ตัน", en: "Ton", short: "ตัน" },
  day: { th: "วัน", en: "Day", short: "วัน" },
  month: { th: "เดือน", en: "Month", short: "เดือน" },
  custom: { th: "กำหนดเอง", en: "Custom", short: "—" }
};

const CATEGORIES: ReadonlySet<CostCodeCategory> = new Set<CostCodeCategory>([
  "site",
  "structure",
  "architecture",
  "mep",
  "finishing",
  "external",
  "indirect",
  "custom"
]);

const UNITS: ReadonlySet<CostCodeUnit> = new Set<CostCodeUnit>([
  "lump_sum",
  "sq_m",
  "cubic_m",
  "linear_m",
  "piece",
  "set",
  "kg",
  "ton",
  "day",
  "month",
  "custom"
]);

function createCostCodeId(index = 0): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `cc-${Date.now().toString(36)}-${index}-${Math.random().toString(16).slice(2)}`;
}

function normalizeAmount(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  return value < 0 ? 0 : value;
}

function normalizeCategory(value: unknown): CostCodeCategory {
  return typeof value === "string" && CATEGORIES.has(value as CostCodeCategory)
    ? (value as CostCodeCategory)
    : "custom";
}

function normalizeUnit(value: unknown): CostCodeUnit {
  return typeof value === "string" && UNITS.has(value as CostCodeUnit)
    ? (value as CostCodeUnit)
    : "lump_sum";
}

export function normalizeCostCode(input: Partial<CostCode>, index = 0): CostCode {
  const now = new Date().toISOString();
  const defaultUnit = normalizeUnit(input.defaultUnit);
  return {
    id: input.id?.trim() || createCostCodeId(index),
    workspaceId: input.workspaceId?.trim() ?? "",
    code: input.code?.trim() ?? "",
    parentCode: input.parentCode?.trim() ?? "",
    name: input.name?.trim() ?? "",
    nameEn: input.nameEn?.trim() ?? "",
    description: input.description?.trim() ?? "",
    category: normalizeCategory(input.category),
    defaultUnit,
    customUnit: (input.customUnit ?? "").trim(),
    defaultUnitPrice: normalizeAmount(input.defaultUnitPrice),
    active: input.active === false ? false : true,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now
  };
}

export function normalizeCostCodeState(input: unknown): CostCodeState {
  if (Array.isArray(input)) {
    return {
      codes: input.map((c, i) => normalizeCostCode((c ?? {}) as Partial<CostCode>, i)),
      updatedAt: new Date().toISOString()
    };
  }
  if (input && typeof input === "object") {
    const state = input as CostCodeStateInput;
    return {
      codes: Array.isArray(state.codes)
        ? state.codes.map((c, i) => normalizeCostCode((c ?? {}) as Partial<CostCode>, i))
        : [],
      updatedAt: state.updatedAt ?? new Date().toISOString()
    };
  }
  return { codes: [], updatedAt: "" };
}

export function loadCostCodes(): CostCodeState {
  return readJson<CostCodeState>(
    defaultStorageAdapter,
    COST_CODES_STORAGE_KEY,
    { codes: [], updatedAt: "" },
    (raw) => normalizeCostCodeState(raw)
  );
}

export function saveCostCodes(state: CostCodeState): void {
  writeJson(defaultStorageAdapter, COST_CODES_STORAGE_KEY, normalizeCostCodeState(state));
}

/**
 * Validate a cost code candidate against an existing state.
 * Returns array of errors (empty = valid).
 */
export function validateCostCode(
  candidate: Partial<CostCode>,
  state: CostCodeState
): string[] {
  const errors: string[] = [];
  const code = candidate.code?.trim() ?? "";
  const name = candidate.name?.trim() ?? "";
  const workspaceId = candidate.workspaceId?.trim() ?? "";
  const parentCode = candidate.parentCode?.trim() ?? "";

  if (!code) errors.push("code is required");
  if (!name) errors.push("name is required");

  if (code && parentCode === code) {
    errors.push("parent_code cannot equal code");
  }

  // Unique check: per workspace (different workspaces may share same code).
  // System seeds (workspaceId === "") are always read-only — duplicates of system
  // seed codes in a workspace ARE allowed (workspace override).
  if (code && workspaceId) {
    const dup = state.codes.find(
      (c) =>
        c.code === code &&
        c.workspaceId === workspaceId &&
        c.id !== candidate.id
    );
    if (dup) errors.push(`code "${code}" already exists in workspace`);
  }

  // parentCode must reference an existing code (in same workspace or system seed)
  if (parentCode) {
    const parent = state.codes.find(
      (c) =>
        c.code === parentCode && (c.workspaceId === workspaceId || c.workspaceId === "")
    );
    if (!parent) {
      errors.push(`parent_code "${parentCode}" does not exist`);
    }
  }

  if (
    candidate.defaultUnit === "custom" &&
    !(candidate.customUnit ?? "").trim()
  ) {
    errors.push("custom_unit is required when default_unit is 'custom'");
  }

  return errors;
}

export function upsertCostCode(
  state: CostCodeState,
  candidate: Partial<CostCode>
): CostCodeState {
  const now = new Date().toISOString();
  const normalized = normalizeCostCode({
    ...candidate,
    id: candidate.id ?? createCostCodeId(),
    updatedAt: now
  });
  const base = normalizeCostCodeState(state);
  const exists = base.codes.some((c) => c.id === normalized.id);

  return normalizeCostCodeState({
    codes: exists
      ? base.codes.map((c) => (c.id === normalized.id ? normalized : c))
      : [...base.codes, normalized],
    updatedAt: now
  });
}

/**
 * Soft-delete: set active=false. Caller decides whether to hard-delete later.
 */
export function deactivateCostCode(state: CostCodeState, id: string): CostCodeState {
  const base = normalizeCostCodeState(state);
  return normalizeCostCodeState({
    codes: base.codes.map((c) =>
      c.id === id ? { ...c, active: false, updatedAt: new Date().toISOString() } : c
    ),
    updatedAt: new Date().toISOString()
  });
}

export function removeCostCode(state: CostCodeState, id: string): CostCodeState {
  const base = normalizeCostCodeState(state);
  return normalizeCostCodeState({
    codes: base.codes.filter((c) => c.id !== id),
    updatedAt: new Date().toISOString()
  });
}

/**
 * Search across code + name + nameEn + description, case-insensitive.
 */
export function searchCostCodes(state: CostCodeState, query: string): CostCode[] {
  const q = query.trim().toLowerCase();
  if (!q) return state.codes;
  return state.codes.filter((c) => {
    return (
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.nameEn.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
    );
  });
}

export function filterCostCodesByCategory(
  state: CostCodeState,
  category: CostCodeCategory | "all",
  activeOnly = true
): CostCode[] {
  return state.codes.filter((c) => {
    if (activeOnly && !c.active) return false;
    if (category === "all") return true;
    return c.category === category;
  });
}

export function groupCostCodesByParent(
  codes: CostCode[]
): { root: CostCode; children: CostCode[] }[] {
  const roots = codes.filter((c) => !c.parentCode);
  return roots.map((root) => ({
    root,
    children: codes
      .filter((c) => c.parentCode === root.code && c.id !== root.id)
      .sort((a, b) => a.code.localeCompare(b.code))
  }));
}

export type CostCodeSummary = {
  total: number;
  active: number;
  inactive: number;
  systemSeed: number;
  custom: number;
  byCategory: Record<CostCodeCategory, number>;
};

export function summarizeCostCodes(state: CostCodeState): CostCodeSummary {
  const summary: CostCodeSummary = {
    total: state.codes.length,
    active: 0,
    inactive: 0,
    systemSeed: 0,
    custom: 0,
    byCategory: {
      site: 0,
      structure: 0,
      architecture: 0,
      mep: 0,
      finishing: 0,
      external: 0,
      indirect: 0,
      custom: 0
    }
  };
  for (const c of state.codes) {
    if (c.active) summary.active += 1;
    else summary.inactive += 1;
    if (c.workspaceId === "") summary.systemSeed += 1;
    else summary.custom += 1;
    summary.byCategory[c.category] += 1;
  }
  return summary;
}

/**
 * Ensure seed cost codes are loaded into storage on first run.
 * System seeds use workspaceId === "" so they're shared across local workspaces.
 * Returns the resulting state.
 */
export function ensureSeedCostCodes(): CostCodeState {
  const state = loadCostCodes();
  if (state.codes.length > 0) {
    return state;
  }
  const seeded: CostCodeState = {
    codes: seedThaiCostCodes(),
    updatedAt: new Date().toISOString()
  };
  saveCostCodes(seeded);
  return seeded;
}

// ----------------------------------------------------------------------------
// CSV import / export
// ----------------------------------------------------------------------------

export type CsvImportRow = {
  rowIndex: number;
  raw: Record<string, string>;
  parsed: Partial<CostCode> | null;
  errors: string[];
};

export type CsvImportResult = {
  rows: CsvImportRow[];
  validRows: CsvImportRow[];
  invalidRows: CsvImportRow[];
  totalParsed: number;
};

/**
 * Parse a CSV string (comma-separated, quoted fields supported). Returns
 * header + row arrays. Handles CRLF/LF/CR. Empty rows ignored.
 */
export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;
  const pushField = () => {
    current.push(field);
    field = "";
  };
  const pushRow = () => {
    if (current.length > 0 || field) {
      pushField();
      if (current.some((c) => c.trim() !== "")) {
        rows.push(current);
      }
      current = [];
    }
  };
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      pushField();
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      pushRow();
    } else {
      field += ch;
    }
  }
  pushRow();

  const headers = rows.shift() ?? [];
  return { headers: headers.map((h) => h.trim()), rows };
}

const DEFAULT_FIELD_MAPPING: Record<string, keyof CostCode> = {
  code: "code",
  parent_code: "parentCode",
  parent: "parentCode",
  name: "name",
  name_en: "nameEn",
  description: "description",
  category: "category",
  unit: "defaultUnit",
  default_unit: "defaultUnit",
  custom_unit: "customUnit",
  price: "defaultUnitPrice",
  default_price: "defaultUnitPrice",
  default_unit_price: "defaultUnitPrice",
  active: "active"
};

/** Convert a header label (e.g. "Default Price", "Cost Code") into a snake_case key. */
function normalizeHeaderKey(header: string): string {
  return header.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

/** Convert a Builk-style unit string (ตร.ม., ลบ.ม., เมตร, ชิ้น, ชุด, ต้น) into CostCodeUnit. */
export function mapUnitLabelToCostCodeUnit(label: string): {
  unit: CostCodeUnit;
  custom: string;
} {
  const normalized = label.trim().toLowerCase();
  const directMap: Record<string, CostCodeUnit> = {
    "ตร.ม.": "sq_m",
    "ตรม": "sq_m",
    "ตารางเมตร": "sq_m",
    "sq_m": "sq_m",
    "sqm": "sq_m",
    "m2": "sq_m",
    "ลบ.ม.": "cubic_m",
    "ลบม": "cubic_m",
    "ลูกบาศก์เมตร": "cubic_m",
    "cubic_m": "cubic_m",
    "m3": "cubic_m",
    "เมตร": "linear_m",
    "m": "linear_m",
    "ชิ้น": "piece",
    "piece": "piece",
    "pc": "piece",
    "ชุด": "set",
    "set": "set",
    "ต้น": "piece",
    "kg": "kg",
    "กก": "kg",
    "kilogram": "kg",
    "ตัน": "ton",
    "ton": "ton",
    "วัน": "day",
    "day": "day",
    "เดือน": "month",
    "month": "month",
    "เหมา": "lump_sum",
    "lump_sum": "lump_sum",
    "ls": "lump_sum"
  };
  if (directMap[label.trim()]) return { unit: directMap[label.trim()], custom: "" };
  if (directMap[normalized]) return { unit: directMap[normalized], custom: "" };
  return { unit: "custom", custom: label.trim() };
}

/**
 * Parse a CSV row into a partial CostCode. Returns the parsed object and any
 * errors. Numbers tolerate thousand-separators ("1,200" → 1200) when the
 * column maps to defaultUnitPrice.
 */
export function parseCostCodeRow(
  row: Record<string, string>,
  workspaceId = ""
): { parsed: Partial<CostCode> | null; errors: string[] } {
  const errors: string[] = [];
  const out: Partial<CostCode> = { workspaceId };

  for (const [rawHeader, value] of Object.entries(row)) {
    const key = normalizeHeaderKey(rawHeader);
    const target = DEFAULT_FIELD_MAPPING[key];
    if (!target) continue;
    const trimmed = value.trim();
    if (!trimmed) continue;

    switch (target) {
      case "code":
        out.code = trimmed;
        break;
      case "parentCode":
        out.parentCode = trimmed;
        break;
      case "name":
        out.name = trimmed;
        break;
      case "nameEn":
        out.nameEn = trimmed;
        break;
      case "description":
        out.description = trimmed;
        break;
      case "category": {
        if (CATEGORIES.has(trimmed as CostCodeCategory)) {
          out.category = trimmed as CostCodeCategory;
        } else {
          errors.push(`unknown category "${trimmed}" — defaulting to "custom"`);
          out.category = "custom";
        }
        break;
      }
      case "defaultUnit": {
        if (UNITS.has(trimmed as CostCodeUnit)) {
          out.defaultUnit = trimmed as CostCodeUnit;
        } else {
          // Try to map Thai/English unit labels (e.g. "ตร.ม.", "kg")
          const mapped = mapUnitLabelToCostCodeUnit(trimmed);
          out.defaultUnit = mapped.unit;
          if (mapped.unit === "custom" && mapped.custom) out.customUnit = mapped.custom;
        }
        break;
      }
      case "customUnit":
        out.customUnit = trimmed;
        break;
      case "defaultUnitPrice": {
        const numeric = parseFloat(trimmed.replace(/,/g, ""));
        if (Number.isFinite(numeric) && numeric >= 0) {
          out.defaultUnitPrice = numeric;
        } else {
          errors.push(`invalid price "${trimmed}"`);
        }
        break;
      }
      case "active":
        out.active = !["false", "0", "no", "n", "inactive"].includes(
          trimmed.toLowerCase()
        );
        break;
    }
  }

  if (!out.code) errors.push("missing code");
  if (!out.name) errors.push("missing name");

  return { parsed: errors.length === 0 ? out : out, errors };
}

export function parseCostCodeCsv(text: string, workspaceId = ""): CsvImportResult {
  const { headers, rows } = parseCsv(text);
  const importRows: CsvImportRow[] = rows.map((row, rowIndex) => {
    const raw: Record<string, string> = {};
    headers.forEach((h, i) => {
      raw[h] = row[i] ?? "";
    });
    const { parsed, errors } = parseCostCodeRow(raw, workspaceId);
    return { rowIndex, raw, parsed: errors.length === 0 ? parsed : null, errors };
  });
  return {
    rows: importRows,
    validRows: importRows.filter((r) => r.errors.length === 0),
    invalidRows: importRows.filter((r) => r.errors.length > 0),
    totalParsed: importRows.length
  };
}

export type ImportMode = "skip_duplicates" | "update_existing";

export type ImportApplyResult = {
  added: number;
  updated: number;
  skipped: number;
  state: CostCodeState;
};

/**
 * Apply parsed CSV rows to a CostCodeState.
 * - skip_duplicates: existing code keeps as-is, new code added.
 * - update_existing: existing code is overwritten with new values.
 */
export function applyCsvImport(
  state: CostCodeState,
  rows: CsvImportRow[],
  mode: ImportMode,
  workspaceId = ""
): ImportApplyResult {
  let nextState = normalizeCostCodeState(state);
  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    if (!row.parsed) {
      skipped += 1;
      continue;
    }
    const candidate = { ...row.parsed, workspaceId };
    const existing = nextState.codes.find(
      (c) => c.code === candidate.code && c.workspaceId === workspaceId
    );
    if (existing) {
      if (mode === "skip_duplicates") {
        skipped += 1;
        continue;
      }
      // update_existing
      nextState = upsertCostCode(nextState, { ...existing, ...candidate });
      updated += 1;
    } else {
      nextState = upsertCostCode(nextState, candidate);
      added += 1;
    }
  }

  return { added, updated, skipped, state: nextState };
}

export function exportCostCodesToCsv(state: CostCodeState, opts: { activeOnly?: boolean } = {}): string {
  const activeOnly = opts.activeOnly !== false;
  const rows = state.codes.filter((c) => (activeOnly ? c.active : true));
  const headers = [
    "code",
    "parent_code",
    "name",
    "name_en",
    "description",
    "category",
    "default_unit",
    "custom_unit",
    "default_unit_price",
    "active"
  ];
  const escape = (value: string): string => {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };
  const lines: string[] = [headers.join(",")];
  for (const c of rows) {
    lines.push(
      [
        c.code,
        c.parentCode,
        c.name,
        c.nameEn,
        c.description,
        c.category,
        c.defaultUnit,
        c.customUnit,
        c.defaultUnitPrice.toString(),
        c.active ? "true" : "false"
      ]
        .map(escape)
        .join(",")
    );
  }
  return lines.join("\n");
}
