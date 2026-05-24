import type { CostCode } from "../../../costCodes";
import type { BoqCatalogRow } from "../../../data";
import { getStorageAdapter, readJson, writeJson, type StorageAdapter } from "../../../storageAdapter";
import { getBoqRecordId, normalizeBoqKey } from "./boqDataService";

export const BOQ_COST_CODE_MAPPING_STORAGE_KEY = "boq-data.cost-code-mapping.v1";

export type BoqCostCodeMappingConfidence = "manual" | "rule" | "imported";

export type BoqCostCodeMapping = {
  id: string;
  workspaceId: string;
  keynote: string;
  boqRecordId: string;
  costCodeId: string;
  confidence: BoqCostCodeMappingConfidence;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type BoqCostCodeMappingState = {
  mappings: BoqCostCodeMapping[];
  updatedAt: string;
};

export type BoqCostCodeResolution = {
  costCode: CostCode | null;
  costCodeId: string;
  source: "manual" | "row" | "rule" | "unmapped";
  mapping: BoqCostCodeMapping | null;
  reason: string;
};

type BoqCostCodeMappingInput = {
  mappings?: Partial<BoqCostCodeMapping>[];
  updatedAt?: string;
};

function nowIso() {
  return new Date().toISOString();
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeConfidence(value: unknown): BoqCostCodeMappingConfidence {
  return value === "rule" || value === "imported" || value === "manual" ? value : "manual";
}

function slug(value: string) {
  return value
    .toLocaleLowerCase("th-TH")
    .replace(/[^a-z0-9\u0e01-\u0e5b]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

function createMappingId(keynote: string, boqRecordId: string, index = 0) {
  return `boq-cost-map-${slug(boqRecordId || keynote || String(index)) || index}`;
}

export function normalizeBoqCostCodeMapping(
  input: Partial<BoqCostCodeMapping>,
  index = 0
): BoqCostCodeMapping {
  const now = nowIso();
  const keynote = normalizeBoqKey(normalizeText(input.keynote));
  const boqRecordId = normalizeText(input.boqRecordId);

  return {
    id: normalizeText(input.id) || createMappingId(keynote, boqRecordId, index),
    workspaceId: normalizeText(input.workspaceId),
    keynote,
    boqRecordId,
    costCodeId: normalizeText(input.costCodeId),
    confidence: normalizeConfidence(input.confidence),
    note: normalizeText(input.note),
    createdAt: normalizeText(input.createdAt) || now,
    updatedAt: normalizeText(input.updatedAt) || now
  };
}

export function normalizeBoqCostCodeMappingState(input: unknown): BoqCostCodeMappingState {
  if (Array.isArray(input)) {
    return {
      mappings: input
        .map((mapping, index) =>
          normalizeBoqCostCodeMapping((mapping ?? {}) as Partial<BoqCostCodeMapping>, index)
        )
        .filter((mapping) => mapping.costCodeId && (mapping.keynote || mapping.boqRecordId)),
      updatedAt: nowIso()
    };
  }

  if (input && typeof input === "object") {
    const state = input as BoqCostCodeMappingInput;
    return {
      mappings: Array.isArray(state.mappings)
        ? state.mappings
            .map((mapping, index) => normalizeBoqCostCodeMapping(mapping ?? {}, index))
            .filter((mapping) => mapping.costCodeId && (mapping.keynote || mapping.boqRecordId))
        : [],
      updatedAt: normalizeText(state.updatedAt) || nowIso()
    };
  }

  return { mappings: [], updatedAt: "" };
}

export function loadBoqCostCodeMappings(
  adapter: StorageAdapter = getStorageAdapter()
): BoqCostCodeMappingState {
  return readJson<BoqCostCodeMappingState>(
    adapter,
    BOQ_COST_CODE_MAPPING_STORAGE_KEY,
    { mappings: [], updatedAt: "" },
    (raw) => normalizeBoqCostCodeMappingState(raw)
  );
}

export function saveBoqCostCodeMappings(
  state: BoqCostCodeMappingState,
  adapter: StorageAdapter = getStorageAdapter()
) {
  writeJson(adapter, BOQ_COST_CODE_MAPPING_STORAGE_KEY, normalizeBoqCostCodeMappingState(state));
}

export function upsertBoqCostCodeMapping(
  state: BoqCostCodeMappingState,
  mapping: Partial<BoqCostCodeMapping>
): BoqCostCodeMappingState {
  const normalized = normalizeBoqCostCodeMapping({
    ...mapping,
    updatedAt: nowIso()
  });
  const base = normalizeBoqCostCodeMappingState(state);
  const hasExisting = base.mappings.some(
    (item) =>
      item.id === normalized.id ||
      (!!normalized.boqRecordId && item.boqRecordId === normalized.boqRecordId) ||
      (!normalized.boqRecordId && item.keynote === normalized.keynote)
  );

  return normalizeBoqCostCodeMappingState({
    mappings: hasExisting
      ? base.mappings.map((item) =>
          item.id === normalized.id ||
          (!!normalized.boqRecordId && item.boqRecordId === normalized.boqRecordId) ||
          (!normalized.boqRecordId && item.keynote === normalized.keynote)
            ? { ...item, ...normalized, createdAt: item.createdAt }
            : item
        )
      : [normalized, ...base.mappings],
    updatedAt: nowIso()
  });
}

export function removeBoqCostCodeMapping(
  state: BoqCostCodeMappingState,
  opts: { id?: string; keynote?: string; boqRecordId?: string }
): BoqCostCodeMappingState {
  const keynote = opts.keynote ? normalizeBoqKey(opts.keynote) : "";
  const boqRecordId = opts.boqRecordId?.trim() ?? "";
  const id = opts.id?.trim() ?? "";

  return normalizeBoqCostCodeMappingState({
    mappings: normalizeBoqCostCodeMappingState(state).mappings.filter((mapping) => {
      if (id && mapping.id === id) return false;
      if (boqRecordId && mapping.boqRecordId === boqRecordId) return false;
      if (keynote && mapping.keynote === keynote && !mapping.boqRecordId) return false;
      return true;
    }),
    updatedAt: nowIso()
  });
}

export function findCostCode(costCodes: CostCode[], costCodeId: string): CostCode | null {
  const target = costCodeId.trim();
  if (!target) return null;
  return costCodes.find((code) => code.id === target || code.code === target) ?? null;
}

function findByCode(costCodes: CostCode[], code: string): CostCode | null {
  return costCodes.find((item) => item.code === code || item.id === code) ?? null;
}

function getBbbKeyNumber(keynote: string) {
  const match = keynote.match(/^[A-Z](\d{4})/);
  return match ? Number(match[1]) : null;
}

function isBbbKeyBetween(keyNumber: number | null, start: number, end = start) {
  return keyNumber !== null && keyNumber >= start && keyNumber <= end;
}

function inferBbbCostCodeByKeynote(keynote: string, text: string) {
  const root = keynote.slice(0, 1);
  const keyNumber = getBbbKeyNumber(keynote);

  if (root === "A") {
    if (isBbbKeyBetween(keyNumber, 1000, 1999)) return ["01-300", "BBB A1000 earthwork prefix"] as const;
    if (isBbbKeyBetween(keyNumber, 2000, 2999)) return ["02-100", "BBB A2000 pile/foundation prefix"] as const;
    if (isBbbKeyBetween(keyNumber, 3000, 3999)) return ["02-400", "BBB A3000 concrete prefix"] as const;
    if (isBbbKeyBetween(keyNumber, 4000, 4999)) return ["02-900", "BBB A4000 formwork prefix"] as const;
    if (isBbbKeyBetween(keyNumber, 5000, 5999)) return ["02-800", "BBB A5000 rebar prefix"] as const;
    if (isBbbKeyBetween(keyNumber, 7000, 7999)) return ["02-700", "BBB A7000 structural steel prefix"] as const;
    if (isBbbKeyBetween(keyNumber, 9000, 9999)) return ["02-600", "BBB A9000 roof prefix"] as const;
    if (isBbbKeyBetween(keyNumber, 6000, 6999) || isBbbKeyBetween(keyNumber, 8000, 8999)) {
      return ["02", "BBB structure material prefix"] as const;
    }
  }

  if (root === "B") {
    if (isBbbKeyBetween(keyNumber, 1000)) return ["03-100", "BBB B1000 wall prefix"] as const;
    if (isBbbKeyBetween(keyNumber, 1001)) return ["03-200", "BBB B1001 wall finish prefix"] as const;
    if (isBbbKeyBetween(keyNumber, 2000, 2001)) return ["05-100", "BBB B2000 floor/tile prefix"] as const;
    if (isBbbKeyBetween(keyNumber, 3000, 3002)) return ["03-500", "BBB B3000 ceiling prefix"] as const;
    if (isBbbKeyBetween(keyNumber, 4000)) return ["03-300", "BBB B4000 door prefix"] as const;
    if (isBbbKeyBetween(keyNumber, 4001)) return ["03-400", "BBB B4001 window prefix"] as const;
    if (isBbbKeyBetween(keyNumber, 5000, 5006)) return ["04-300", "BBB B5000 sanitary fixture prefix"] as const;
    if (isBbbKeyBetween(keyNumber, 6000, 6011)) return ["05-300", "BBB B6000 paint prefix"] as const;
    if (isBbbKeyBetween(keyNumber, 7000, 7004)) return ["05-800", "BBB B7000 stair/railing prefix"] as const;
    if (isBbbKeyBetween(keyNumber, 8000, 8010)) return ["02-600", "BBB B8000 roof finish prefix"] as const;
    if (isBbbKeyBetween(keyNumber, 9001, 9021)) {
      if (text.includes("solar") || text.includes("pv")) return ["04-600", "BBB B9000 solar item"] as const;
      if (text.includes("built-in") || text.includes("built in")) return ["05-400", "BBB B9000 built-in item"] as const;
      if (text.includes("mirror")) return ["05-900", "BBB B9000 mirror item"] as const;
      if (text.includes("carpet") || text.includes("vinyl") || text.includes("epoxy") || text.includes("floor")) {
        return ["05-200", "BBB B9000 floor finish item"] as const;
      }
      return ["05", "BBB B9000 finishing prefix"] as const;
    }
  }

  if (root === "C") {
    if (isBbbKeyBetween(keyNumber, 1000)) return ["04-220", "BBB C1000 panel prefix"] as const;
    if (isBbbKeyBetween(keyNumber, 1001, 1002)) return ["04-210", "BBB C1001 cable/conduit prefix"] as const;
    if (isBbbKeyBetween(keyNumber, 1003, 1004)) return ["04-200", "BBB C1003 electrical system prefix"] as const;
    if (isBbbKeyBetween(keyNumber, 2000, 2001)) return ["04-230", "BBB C2000 lighting prefix"] as const;
    if (isBbbKeyBetween(keyNumber, 3001, 3002)) return ["04-500", "BBB C3000 low voltage prefix"] as const;
    return keyNumber === null ? null : (["04-200", "BBB electrical prefix"] as const);
  }

  if (root === "D") {
    if (isBbbKeyBetween(keyNumber, 2005)) return ["04-120", "BBB D2005 tank/water equipment prefix"] as const;
    return keyNumber === null ? null : (["04-100", "BBB plumbing prefix"] as const);
  }

  if (root === "E") {
    if (isBbbKeyBetween(keyNumber, 2000, 2008)) return ["04-410", "BBB E2000 ventilation prefix"] as const;
    return keyNumber === null ? null : (["04-400", "BBB air conditioning prefix"] as const);
  }

  if (root === "F") {
    if (isBbbKeyBetween(keyNumber, 1000)) return ["01-100", "BBB F1000 survey prefix"] as const;
    if (isBbbKeyBetween(keyNumber, 1001)) return ["01-200", "BBB F1001 demolition prefix"] as const;
    if (isBbbKeyBetween(keyNumber, 2000, 2003)) return ["01-300", "BBB F2000 earthwork prefix"] as const;
    if (isBbbKeyBetween(keyNumber, 2004)) return ["04-100", "BBB F2004 drainage prefix"] as const;
    if (isBbbKeyBetween(keyNumber, 2006)) return ["06-200", "BBB F2006 landscape prefix"] as const;
    return keyNumber === null ? null : (["07-100", "BBB general/site management prefix"] as const);
  }

  return null;
}

export function inferCostCodeForBoq(row: BoqCatalogRow, costCodes: CostCode[]): {
  costCode: CostCode | null;
  reason: string;
} {
  const keynote = normalizeBoqKey(row.keynote);
  const text = `${row.keynote} ${row.item} ${row.brand ?? ""} ${row.note ?? ""}`.toLocaleLowerCase("th-TH");
  const bbbPrefix = inferBbbCostCodeByKeynote(keynote, text);
  if (bbbPrefix) {
    return { costCode: findByCode(costCodes, bbbPrefix[0]), reason: bbbPrefix[1] };
  }

  const candidates: Array<[RegExp, string, string]> = [
    [/^A1000|excavat|ขุด|ดิน/, "01-300", "site/excavation rule"],
    [/^A3|concrete|คอนกรีต|slab|พื้น\s*คสล/, "02-400", "structure/concrete rule"],
    [/^A5|rebar|steel|เหล็ก|sd40|sd50/, "02-800", "structure/rebar rule"],
    [/waterproof|กันรั่ว|กันซึม/, "03-800", "waterproofing rule"],
    [/tile|กระเบื้อง/, "05-100", "tile/finishing rule"],
    [/electric|ไฟฟ้า|panel|consumer/, "04-200", "electrical rule"],
    [/paint|สี/, "05-300", "paint rule"],
    [/door|ประตู|window|หน้าต่าง/, "03-300", "door/window architecture rule"],
    [/roof|หลังคา/, "02-600", "roof structure rule"],
    [/site|management|foreman|ควบคุมงาน/, "07-100", "site management rule"]
  ];

  for (const [pattern, code, reason] of candidates) {
    if (pattern.test(keynote) || pattern.test(text)) {
      return { costCode: findByCode(costCodes, code), reason };
    }
  }

  if (row.level <= 2) {
    return { costCode: null, reason: "summary row has no cost code" };
  }

  return { costCode: null, reason: "no matching rule" };
}

export function resolveBoqCostCode(
  row: BoqCatalogRow,
  state: BoqCostCodeMappingState,
  costCodes: CostCode[],
  index = 0
): BoqCostCodeResolution {
  const normalizedState = normalizeBoqCostCodeMappingState(state);
  const recordId = getBoqRecordId(row, index);
  const keynote = normalizeBoqKey(row.keynote);
  const manualMapping =
    normalizedState.mappings.find((mapping) => mapping.boqRecordId === recordId) ??
    normalizedState.mappings.find((mapping) => mapping.keynote === keynote && !mapping.boqRecordId) ??
    null;

  if (manualMapping) {
    const costCode = findCostCode(costCodes, manualMapping.costCodeId);
    return {
      costCode,
      costCodeId: manualMapping.costCodeId,
      source: "manual",
      mapping: manualMapping,
      reason: costCode ? "saved mapping" : "saved mapping points to missing cost code"
    };
  }

  const rowCostCodeId = normalizeText(row.suggestedCostCodeId);
  if (rowCostCodeId) {
    const costCode = findCostCode(costCodes, rowCostCodeId);
    return {
      costCode,
      costCodeId: rowCostCodeId,
      source: "row",
      mapping: null,
      reason: costCode ? "row suggested cost code" : "row suggested cost code is missing"
    };
  }

  const inferred = inferCostCodeForBoq(row, costCodes);
  if (inferred.costCode) {
    return {
      costCode: inferred.costCode,
      costCodeId: inferred.costCode.id,
      source: "rule",
      mapping: null,
      reason: inferred.reason
    };
  }

  return {
    costCode: null,
    costCodeId: "",
    source: "unmapped",
    mapping: null,
    reason: inferred.reason
  };
}

export function summarizeBoqCostCodeCoverage(
  rows: BoqCatalogRow[],
  state: BoqCostCodeMappingState,
  costCodes: CostCode[]
) {
  const pricedRows = rows.filter((row) => row.level === 3);
  const mappedRows = pricedRows.filter(
    (row, index) => resolveBoqCostCode(row, state, costCodes, index).costCode
  );

  return {
    totalRows: pricedRows.length,
    mappedRows: mappedRows.length,
    unmappedRows: Math.max(0, pricedRows.length - mappedRows.length),
    coveragePct: pricedRows.length > 0 ? Math.round((mappedRows.length / pricedRows.length) * 100) : 0
  };
}
