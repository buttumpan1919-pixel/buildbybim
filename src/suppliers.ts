// Suppliers domain module — Sprint 2 (Builk parity)
// Spec: docs/SUPPLIERS_PRD.md
//
// Module-isolated per PRD Section 6 — UI -> domain service -> storageAdapter
// -> localStorage/Supabase. Never touches window.localStorage directly.
//
// Cross-links: Cost Codes (Sprint 1, src/costCodes.ts) — priceHistory entries
// reference costCodeId. RFQ (Sprint 4) and Cashflow (Sprint 5) will consume
// suppliers via supplierId fields.

import { defaultStorageAdapter, readJson, writeJson } from "./storageAdapter";

export const SUPPLIERS_STORAGE_KEY = "suppliers.directory.v1";

export type SupplierType =
  | "manufacturer"
  | "distributor"
  | "subcontractor"
  | "service"
  | "other";

export type Supplier = {
  id: string;
  workspaceId: string;
  name: string;
  shortName: string;
  type: SupplierType;
  taxId: string; // 13 digits (Thai)
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  email: string;
  lineId: string;
  paymentTerms: string;
  rating: number; // 0-5
  notes: string;
  tags: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PriceHistorySource = "rfq" | "po" | "manual" | "line_intake";

export type SupplierPriceHistoryEntry = {
  id: string;
  workspaceId: string;
  supplierId: string;
  costCodeId: string;
  itemDescription: string;
  unitPrice: number;
  unit: string;
  quantity: number;
  totalAmount: number;
  quotedAt: string; // YYYY-MM-DD
  sourceType: PriceHistorySource;
  sourceDocumentId: string;
  note: string;
  createdAt: string;
};

export type SupplierState = {
  suppliers: Supplier[];
  priceHistory: SupplierPriceHistoryEntry[];
  updatedAt: string;
};

type SupplierStateInput = {
  suppliers?: Partial<Supplier>[];
  priceHistory?: Partial<SupplierPriceHistoryEntry>[];
  updatedAt?: string;
};

export const supplierTypeCopy: Record<SupplierType, { th: string; en: string }> = {
  manufacturer: { th: "ผู้ผลิต", en: "Manufacturer" },
  distributor: { th: "ตัวแทนจำหน่าย", en: "Distributor" },
  subcontractor: { th: "ผู้รับเหมาช่วง", en: "Subcontractor" },
  service: { th: "บริการ / ฟรีแลนซ์", en: "Service / Freelance" },
  other: { th: "อื่น ๆ", en: "Other" }
};

export const priceHistorySourceCopy: Record<PriceHistorySource, { th: string; en: string }> = {
  rfq: { th: "RFQ", en: "RFQ" },
  po: { th: "ใบสั่งซื้อ", en: "PO" },
  manual: { th: "บันทึกเอง", en: "Manual" },
  line_intake: { th: "LINE", en: "LINE intake" }
};

const SUPPLIER_TYPES: ReadonlySet<SupplierType> = new Set<SupplierType>([
  "manufacturer",
  "distributor",
  "subcontractor",
  "service",
  "other"
]);

const PRICE_HISTORY_SOURCES: ReadonlySet<PriceHistorySource> = new Set<PriceHistorySource>([
  "rfq",
  "po",
  "manual",
  "line_intake"
]);

function createId(prefix: string, index = 0): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now().toString(36)}-${index}-${Math.random().toString(16).slice(2)}`;
}

function normalizeAmount(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return value < 0 ? 0 : value;
}

function normalizeRating(value: unknown): number {
  const n = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return Math.max(0, Math.min(5, Math.round(n)));
}

function normalizeIsoDate(value: unknown): string {
  if (typeof value !== "string") return "";
  const m = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : "";
}

function normalizeType(value: unknown): SupplierType {
  return typeof value === "string" && SUPPLIER_TYPES.has(value as SupplierType)
    ? (value as SupplierType)
    : "other";
}

function normalizeSource(value: unknown): PriceHistorySource {
  return typeof value === "string" && PRICE_HISTORY_SOURCES.has(value as PriceHistorySource)
    ? (value as PriceHistorySource)
    : "manual";
}

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((t): t is string => typeof t === "string")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function normalizeSupplier(input: Partial<Supplier>, index = 0): Supplier {
  const now = new Date().toISOString();
  return {
    id: input.id?.trim() || createId("sup", index),
    workspaceId: input.workspaceId?.trim() ?? "",
    name: input.name?.trim() ?? "",
    shortName: input.shortName?.trim() ?? "",
    type: normalizeType(input.type),
    taxId: input.taxId?.replace(/\D/g, "") ?? "",
    address: input.address?.trim() ?? "",
    city: input.city?.trim() ?? "",
    province: input.province?.trim() ?? "",
    postalCode: input.postalCode?.trim() ?? "",
    phone: input.phone?.trim() ?? "",
    email: input.email?.trim() ?? "",
    lineId: input.lineId?.trim() ?? "",
    paymentTerms: input.paymentTerms?.trim() ?? "",
    rating: normalizeRating(input.rating),
    notes: input.notes?.trim() ?? "",
    tags: normalizeTags(input.tags),
    active: input.active === false ? false : true,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now
  };
}

export function normalizePriceHistoryEntry(
  input: Partial<SupplierPriceHistoryEntry>,
  index = 0
): SupplierPriceHistoryEntry {
  const unitPrice = normalizeAmount(input.unitPrice);
  const quantity = normalizeAmount(input.quantity);
  const totalAmount =
    typeof input.totalAmount === "number" && Number.isFinite(input.totalAmount)
      ? normalizeAmount(input.totalAmount)
      : unitPrice * quantity;

  return {
    id: input.id?.trim() || createId("ph", index),
    workspaceId: input.workspaceId?.trim() ?? "",
    supplierId: input.supplierId?.trim() ?? "",
    costCodeId: input.costCodeId?.trim() ?? "",
    itemDescription: input.itemDescription?.trim() ?? "",
    unitPrice,
    unit: input.unit?.trim() ?? "",
    quantity,
    totalAmount,
    quotedAt: normalizeIsoDate(input.quotedAt) || new Date().toISOString().slice(0, 10),
    sourceType: normalizeSource(input.sourceType),
    sourceDocumentId: input.sourceDocumentId?.trim() ?? "",
    note: input.note?.trim() ?? "",
    createdAt: input.createdAt ?? new Date().toISOString()
  };
}

export function normalizeSupplierState(input: unknown): SupplierState {
  if (input && typeof input === "object") {
    const state = input as SupplierStateInput;
    return {
      suppliers: Array.isArray(state.suppliers)
        ? state.suppliers.map((s, i) => normalizeSupplier((s ?? {}) as Partial<Supplier>, i))
        : [],
      priceHistory: Array.isArray(state.priceHistory)
        ? state.priceHistory.map((p, i) =>
            normalizePriceHistoryEntry(
              (p ?? {}) as Partial<SupplierPriceHistoryEntry>,
              i
            )
          )
        : [],
      updatedAt: state.updatedAt ?? new Date().toISOString()
    };
  }
  return { suppliers: [], priceHistory: [], updatedAt: "" };
}

export function loadSuppliers(): SupplierState {
  return readJson<SupplierState>(
    defaultStorageAdapter,
    SUPPLIERS_STORAGE_KEY,
    { suppliers: [], priceHistory: [], updatedAt: "" },
    (raw) => normalizeSupplierState(raw)
  );
}

export function saveSuppliers(state: SupplierState): void {
  writeJson(defaultStorageAdapter, SUPPLIERS_STORAGE_KEY, normalizeSupplierState(state));
}

// ----------------------------------------------------------------------------
// Validation
// ----------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSupplier(input: Partial<Supplier>): string[] {
  const errors: string[] = [];
  if (!input.name?.trim()) errors.push("name is required");

  const taxDigits = (input.taxId ?? "").replace(/\D/g, "");
  if (taxDigits && taxDigits.length !== 13) {
    errors.push("tax_id must be 13 digits when present");
  }

  if (input.email?.trim() && !EMAIL_RE.test(input.email.trim())) {
    errors.push("email format is invalid");
  }

  if (typeof input.rating === "number" && (input.rating < 0 || input.rating > 5)) {
    errors.push("rating must be between 0 and 5");
  }

  return errors;
}

// ----------------------------------------------------------------------------
// Auto-detect supplier type from Thai name patterns
// ----------------------------------------------------------------------------

/**
 * Detect supplier type from name. Heuristic:
 * - "บจก./บมจ./บริษัท" + "รับเหมา"/"ก่อสร้าง" → subcontractor
 * - "บจก./บมจ./บริษัท" alone → manufacturer (default for companies)
 * - "หจก./ห้างหุ้นส่วน" → distributor
 * - "ร้าน" → distributor
 * - else (personal name, freelance) → service
 */
export function detectSupplierType(name: string): SupplierType {
  const n = name.trim();
  if (!n) return "other";

  const subcontractorPattern = /(รับเหมา|ก่อสร้าง|ติดตั้ง)/;
  const companyPattern = /^(บจก|บมจ|บริษัท)/;
  const partnershipPattern = /^(หจก|ห้างหุ้นส่วน|ร้าน)/;

  if (subcontractorPattern.test(n) && (companyPattern.test(n) || partnershipPattern.test(n))) {
    return "subcontractor";
  }
  if (subcontractorPattern.test(n)) return "subcontractor";
  if (companyPattern.test(n)) return "manufacturer";
  if (partnershipPattern.test(n)) return "distributor";
  if (/\b(Co\.?|Ltd\.?|Inc\.?|Corp\.?|LLC)\b/i.test(n)) return "manufacturer";

  return "service";
}

// ----------------------------------------------------------------------------
// Thai tax ID formatter
// ----------------------------------------------------------------------------

/**
 * Format a 13-digit Thai tax id into the canonical `0-1057-12345-67-8`
 * pattern. Strips non-digits first. Returns the cleaned digits unchanged
 * if length ≠ 13 (caller validates separately).
 */
export function formatThaiTaxId(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 13) return digits;
  return `${digits[0]}-${digits.slice(1, 5)}-${digits.slice(5, 10)}-${digits.slice(10, 12)}-${digits[12]}`;
}

export function stripTaxIdFormat(value: string): string {
  return value.replace(/\D/g, "");
}

// ----------------------------------------------------------------------------
// Mutations
// ----------------------------------------------------------------------------

export function upsertSupplier(
  state: SupplierState,
  candidate: Partial<Supplier>
): SupplierState {
  const now = new Date().toISOString();
  const normalized = normalizeSupplier({
    ...candidate,
    id: candidate.id ?? createId("sup"),
    updatedAt: now
  });
  const base = normalizeSupplierState(state);
  const exists = base.suppliers.some((s) => s.id === normalized.id);
  return normalizeSupplierState({
    suppliers: exists
      ? base.suppliers.map((s) => (s.id === normalized.id ? normalized : s))
      : [normalized, ...base.suppliers],
    priceHistory: base.priceHistory,
    updatedAt: now
  });
}

export function deactivateSupplier(state: SupplierState, id: string): SupplierState {
  const base = normalizeSupplierState(state);
  return normalizeSupplierState({
    ...base,
    suppliers: base.suppliers.map((s) =>
      s.id === id ? { ...s, active: false, updatedAt: new Date().toISOString() } : s
    ),
    updatedAt: new Date().toISOString()
  });
}

export function removeSupplier(state: SupplierState, id: string): SupplierState {
  const base = normalizeSupplierState(state);
  return normalizeSupplierState({
    suppliers: base.suppliers.filter((s) => s.id !== id),
    priceHistory: base.priceHistory.filter((p) => p.supplierId !== id),
    updatedAt: new Date().toISOString()
  });
}

export function addPriceHistoryEntry(
  state: SupplierState,
  entry: Partial<SupplierPriceHistoryEntry>
): SupplierState {
  const normalized = normalizePriceHistoryEntry({
    ...entry,
    id: entry.id ?? createId("ph")
  });
  const base = normalizeSupplierState(state);
  return normalizeSupplierState({
    ...base,
    priceHistory: [normalized, ...base.priceHistory],
    updatedAt: new Date().toISOString()
  });
}

export function removePriceHistoryEntry(
  state: SupplierState,
  entryId: string
): SupplierState {
  const base = normalizeSupplierState(state);
  return normalizeSupplierState({
    ...base,
    priceHistory: base.priceHistory.filter((p) => p.id !== entryId),
    updatedAt: new Date().toISOString()
  });
}

// ----------------------------------------------------------------------------
// Query helpers
// ----------------------------------------------------------------------------

export function searchSuppliers(state: SupplierState, query: string): Supplier[] {
  const q = query.trim().toLowerCase();
  if (!q) return state.suppliers;
  const digitsOnly = q.replace(/\D/g, "");
  return state.suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.shortName.toLowerCase().includes(q) ||
      (digitsOnly !== "" && s.taxId.includes(digitsOnly)) ||
      s.city.toLowerCase().includes(q) ||
      s.tags.some((t) => t.toLowerCase().includes(q))
  );
}

export function filterSuppliers(
  state: SupplierState,
  opts: { type?: SupplierType | "all"; city?: string; activeOnly?: boolean } = {}
): Supplier[] {
  const activeOnly = opts.activeOnly !== false;
  return state.suppliers.filter((s) => {
    if (activeOnly && !s.active) return false;
    if (opts.type && opts.type !== "all" && s.type !== opts.type) return false;
    if (opts.city && s.city !== opts.city) return false;
    return true;
  });
}

export type SupplierSortKey = "name" | "spend" | "lastOrder" | "rating";

export function sortSuppliers(
  suppliers: Supplier[],
  summaries: Map<string, SupplierSummary>,
  key: SupplierSortKey
): Supplier[] {
  const list = [...suppliers];
  switch (key) {
    case "name":
      return list.sort((a, b) => a.name.localeCompare(b.name, "th-TH"));
    case "rating":
      return list.sort((a, b) => b.rating - a.rating);
    case "spend":
      return list.sort((a, b) => {
        const sa = summaries.get(a.id)?.totalSpend ?? 0;
        const sb = summaries.get(b.id)?.totalSpend ?? 0;
        return sb - sa;
      });
    case "lastOrder":
      return list.sort((a, b) => {
        const da = summaries.get(a.id)?.lastOrderDate ?? "";
        const db = summaries.get(b.id)?.lastOrderDate ?? "";
        return db.localeCompare(da);
      });
  }
}

// ----------------------------------------------------------------------------
// Computed: per-supplier summary
// ----------------------------------------------------------------------------

export type SupplierSummary = {
  supplierId: string;
  name: string;
  totalSpend: number;
  orderCount: number;
  lastOrderDate: string;
  topCostCodeIds: string[];
  averageUnitPrice: number;
};

function monthsAgoIsoDate(months: number, reference: Date = new Date()): string {
  const d = new Date(reference);
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}

/**
 * Compute a per-supplier summary. Default window = last 12 months from the
 * reference date (`now` by default). Returns totalSpend, orderCount, last
 * order date, and top 3 cost codes by spend.
 */
export function computeSupplierSummary(
  supplier: Supplier,
  priceHistory: SupplierPriceHistoryEntry[],
  reference: Date = new Date()
): SupplierSummary {
  const cutoff = monthsAgoIsoDate(12, reference);
  const entries = priceHistory.filter(
    (p) => p.supplierId === supplier.id && p.quotedAt >= cutoff
  );
  const totalSpend = entries.reduce((sum, p) => sum + p.totalAmount, 0);
  const lastOrderDate = entries.reduce(
    (latest, p) => (p.quotedAt > latest ? p.quotedAt : latest),
    ""
  );

  // top 3 cost codes by spend
  const spendByCode = new Map<string, number>();
  for (const p of entries) {
    if (!p.costCodeId) continue;
    spendByCode.set(p.costCodeId, (spendByCode.get(p.costCodeId) ?? 0) + p.totalAmount);
  }
  const topCostCodeIds = [...spendByCode.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([code]) => code);

  const averageUnitPrice =
    entries.length > 0
      ? entries.reduce((sum, p) => sum + p.unitPrice, 0) / entries.length
      : 0;

  return {
    supplierId: supplier.id,
    name: supplier.name,
    totalSpend,
    orderCount: entries.length,
    lastOrderDate,
    topCostCodeIds,
    averageUnitPrice
  };
}

export function computeAllSupplierSummaries(
  state: SupplierState,
  reference: Date = new Date()
): Map<string, SupplierSummary> {
  const map = new Map<string, SupplierSummary>();
  for (const s of state.suppliers) {
    map.set(s.id, computeSupplierSummary(s, state.priceHistory, reference));
  }
  return map;
}

export type SupplierDirectorySummary = {
  totalSuppliers: number;
  active: number;
  inactive: number;
  totalSpend: number;
  totalOrders: number;
  highRated: number; // rating === 5
};

export function summarizeSupplierDirectory(
  state: SupplierState,
  reference: Date = new Date()
): SupplierDirectorySummary {
  const summaries = computeAllSupplierSummaries(state, reference);
  let totalSpend = 0;
  let totalOrders = 0;
  let active = 0;
  let inactive = 0;
  let highRated = 0;
  for (const s of state.suppliers) {
    if (s.active) active += 1;
    else inactive += 1;
    if (s.rating === 5) highRated += 1;
    const summary = summaries.get(s.id);
    if (summary) {
      totalSpend += summary.totalSpend;
      totalOrders += summary.orderCount;
    }
  }
  return {
    totalSuppliers: state.suppliers.length,
    active,
    inactive,
    totalSpend,
    totalOrders,
    highRated
  };
}

// ----------------------------------------------------------------------------
// Recent prices per cost code (for "price drift" display)
// ----------------------------------------------------------------------------

export type RecentPrice = {
  entry: SupplierPriceHistoryEntry;
  driftPct: number | null; // change vs previous entry for same cost_code
};

export function recentPricesForSupplier(
  state: SupplierState,
  supplierId: string,
  limit = 10
): RecentPrice[] {
  const entries = state.priceHistory
    .filter((p) => p.supplierId === supplierId)
    .sort((a, b) => b.quotedAt.localeCompare(a.quotedAt));

  return entries.slice(0, limit).map((entry) => {
    const prev = entries.find(
      (p) =>
        p.id !== entry.id &&
        p.costCodeId === entry.costCodeId &&
        p.quotedAt < entry.quotedAt
    );
    const driftPct =
      prev && prev.unitPrice > 0
        ? ((entry.unitPrice - prev.unitPrice) / prev.unitPrice) * 100
        : null;
    return { entry, driftPct };
  });
}

// ----------------------------------------------------------------------------
// Seed data (optional first-run)
// ----------------------------------------------------------------------------

export function createSeedSuppliers(workspaceId = "local-workspace"): Supplier[] {
  const now = new Date().toISOString();
  return [
    {
      name: "บจก. ปูนซีเมนต์ไทย",
      shortName: "SCC",
      type: "manufacturer",
      taxId: "0105000000001",
      city: "Bangkok",
      province: "กรุงเทพมหานคร",
      paymentTerms: "30 days",
      rating: 5,
      tags: ["ปูน", "main supplier"]
    },
    {
      name: "บจก. ทีพีไอ โพลีน",
      shortName: "TPI",
      type: "manufacturer",
      taxId: "0107000000002",
      city: "Saraburi",
      province: "สระบุรี",
      paymentTerms: "45 days",
      rating: 4,
      tags: ["ปูน", "เหล็ก"]
    },
    {
      name: "บจก. อินทรี ซีเมนต์",
      shortName: "Insee",
      type: "manufacturer",
      taxId: "0105000000003",
      city: "Bangkok",
      province: "กรุงเทพมหานคร",
      paymentTerms: "45 days",
      rating: 4,
      tags: ["ปูน"]
    },
    {
      name: "หจก. ค้าวัสดุภาคเหนือ",
      shortName: "NorthMat",
      type: "distributor",
      taxId: "0507000000004",
      city: "Chiang Mai",
      province: "เชียงใหม่",
      paymentTerms: "Cash",
      rating: 3,
      tags: ["ทราย", "หิน"]
    },
    {
      name: "บจก. เหล็กไทย",
      shortName: "ThaiSteel",
      type: "manufacturer",
      taxId: "0105000000005",
      city: "Samut Prakan",
      province: "สมุทรปราการ",
      paymentTerms: "60 days",
      rating: 5,
      tags: ["เหล็กเส้น", "เหล็กรูปพรรณ"]
    }
  ].map((s, i) =>
    normalizeSupplier({
      ...s,
      id: `seed-sup-${s.shortName.toLowerCase()}`,
      workspaceId,
      createdAt: now,
      updatedAt: now
    } as Partial<Supplier>, i)
  );
}

/**
 * Idempotent: if `suppliers.directory.v1` is empty (no suppliers yet), seed
 * with 5 sample Thai suppliers + price history. Otherwise returns the
 * existing state. Caller decides whether to call this on first load.
 */
export function ensureSeedSuppliers(workspaceId = "local-workspace"): SupplierState {
  const state = loadSuppliers();
  if (state.suppliers.length > 0) return state;
  const seeded: SupplierState = {
    suppliers: createSeedSuppliers(workspaceId),
    priceHistory: [],
    updatedAt: new Date().toISOString()
  };
  saveSuppliers(seeded);
  return seeded;
}

// ----------------------------------------------------------------------------
// CSV import
// ----------------------------------------------------------------------------

const SUPPLIER_FIELD_MAPPING: Record<string, keyof Supplier> = {
  name: "name",
  short_name: "shortName",
  shortname: "shortName",
  short: "shortName",
  type: "type",
  tax_id: "taxId",
  taxid: "taxId",
  vat: "taxId",
  address: "address",
  city: "city",
  province: "province",
  postal_code: "postalCode",
  postal: "postalCode",
  zip: "postalCode",
  phone: "phone",
  email: "email",
  line_id: "lineId",
  line: "lineId",
  payment_terms: "paymentTerms",
  payment: "paymentTerms",
  rating: "rating",
  notes: "notes",
  note: "notes",
  tags: "tags",
  active: "active"
};

function normalizeHeaderKey(header: string): string {
  return header.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

export type SupplierCsvRow = {
  rowIndex: number;
  raw: Record<string, string>;
  parsed: Partial<Supplier> | null;
  errors: string[];
};

export type SupplierCsvResult = {
  rows: SupplierCsvRow[];
  validRows: SupplierCsvRow[];
  invalidRows: SupplierCsvRow[];
  totalParsed: number;
};

/** Simple CSV parser (same shape as costCodes.parseCsv). */
function parseCsv(text: string): { headers: string[]; rows: string[][] } {
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
      if (current.some((c) => c.trim() !== "")) rows.push(current);
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
        } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") pushField();
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      pushRow();
    } else field += ch;
  }
  pushRow();
  const headers = rows.shift() ?? [];
  return { headers: headers.map((h) => h.trim()), rows };
}

export function parseSupplierRow(
  row: Record<string, string>,
  workspaceId = ""
): { parsed: Partial<Supplier>; errors: string[] } {
  const out: Partial<Supplier> = { workspaceId };
  const errors: string[] = [];

  for (const [rawHeader, value] of Object.entries(row)) {
    const key = normalizeHeaderKey(rawHeader);
    const target = SUPPLIER_FIELD_MAPPING[key];
    if (!target) continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    switch (target) {
      case "name":
        out.name = trimmed;
        break;
      case "shortName":
        out.shortName = trimmed;
        break;
      case "type":
        if (SUPPLIER_TYPES.has(trimmed as SupplierType)) {
          out.type = trimmed as SupplierType;
        } else {
          out.type = "other";
        }
        break;
      case "taxId":
        out.taxId = trimmed.replace(/\D/g, "");
        break;
      case "rating": {
        const n = parseFloat(trimmed);
        if (Number.isFinite(n)) out.rating = Math.max(0, Math.min(5, n));
        break;
      }
      case "active":
        out.active = !["false", "0", "no", "n", "inactive"].includes(
          trimmed.toLowerCase()
        );
        break;
      case "tags":
        out.tags = trimmed
          .split(/[;,|]/)
          .map((t) => t.trim())
          .filter(Boolean);
        break;
      default:
        (out as Record<string, unknown>)[target] = trimmed;
    }
  }

  if (!out.name) errors.push("missing name");

  // Validate tax id length if present
  if (out.taxId && out.taxId.length !== 13) {
    errors.push("tax_id must be 13 digits");
  }

  // Auto-detect type if not provided
  if (!out.type && out.name) {
    out.type = detectSupplierType(out.name);
  }

  return { parsed: out, errors };
}

export function parseSuppliersCsv(text: string, workspaceId = ""): SupplierCsvResult {
  const { headers, rows } = parseCsv(text);
  const importRows: SupplierCsvRow[] = rows.map((row, rowIndex) => {
    const raw: Record<string, string> = {};
    headers.forEach((h, i) => {
      raw[h] = row[i] ?? "";
    });
    const { parsed, errors } = parseSupplierRow(raw, workspaceId);
    return { rowIndex, raw, parsed: errors.length === 0 ? parsed : null, errors };
  });
  return {
    rows: importRows,
    validRows: importRows.filter((r) => r.errors.length === 0),
    invalidRows: importRows.filter((r) => r.errors.length > 0),
    totalParsed: importRows.length
  };
}

export type SupplierImportMode = "skip_duplicates" | "update_existing";

/**
 * Apply parsed supplier CSV rows. Duplicate detection prefers `taxId` when
 * both candidate and existing have a tax id; falls back to case-insensitive
 * `name` match.
 */
export function applySupplierCsvImport(
  state: SupplierState,
  rows: SupplierCsvRow[],
  mode: SupplierImportMode,
  workspaceId = ""
): { added: number; updated: number; skipped: number; state: SupplierState } {
  let next = normalizeSupplierState(state);
  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    if (!row.parsed) {
      skipped += 1;
      continue;
    }
    const candidate = { ...row.parsed, workspaceId };
    const existing = next.suppliers.find((s) => {
      if (candidate.taxId && s.taxId) return candidate.taxId === s.taxId;
      return (
        s.name.toLowerCase().trim() === (candidate.name ?? "").toLowerCase().trim()
      );
    });
    if (existing) {
      if (mode === "skip_duplicates") {
        skipped += 1;
        continue;
      }
      next = upsertSupplier(next, { ...existing, ...candidate });
      updated += 1;
    } else {
      next = upsertSupplier(next, candidate);
      added += 1;
    }
  }

  return { added, updated, skipped, state: next };
}
