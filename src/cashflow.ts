import { defaultStorageAdapter, readJson, writeJson } from "./storageAdapter";

export const CASHFLOW_STORAGE_KEY = "cashflow.entries.v1";

export type CashflowDirection = "income" | "expense";

export type CashflowCategory =
  | "client_payment"
  | "loan_in"
  | "other_income"
  | "material"
  | "labor"
  | "subcontract"
  | "transport"
  | "equipment"
  | "office"
  | "tax_fee"
  | "other_expense";

export type CashflowEntryStatus = "draft" | "confirmed" | "void";
export type CashflowSourceType =
  | "manual"
  | "pr"
  | "rfq"
  | "po"
  | "invoice"
  | "receipt"
  | "recurring";

export type CashflowEntry = {
  id: string;
  direction: CashflowDirection;
  category: CashflowCategory;
  amount: number;
  description: string;
  projectId: string;
  documentId: string;
  entryDate: string;
  status: CashflowEntryStatus;
  sourceType: CashflowSourceType;
  sourceDocumentId: string;
  note: string;
  createdAt: string;
  updatedAt: string;

  // Sprint 5 — Cashflow project extension. All optional + back-compat via normalize.
  costCodeId: string;
  supplierId: string;
  prId: string;
  rfqId: string;
  poDocumentId: string;
  quantityActual: number;
  unitActual: string;
  recurringTemplateId: string;
};

export type CashflowState = {
  entries: CashflowEntry[];
  updatedAt: string;
};

type CashflowStateInput = {
  entries?: Partial<CashflowEntry>[];
  updatedAt?: string;
};

export const cashflowCategoryCopy: Record<CashflowCategory, { th: string; en: string }> = {
  client_payment: { th: "ลูกค้าจ่าย", en: "Client payment" },
  loan_in: { th: "เงินกู้เข้า", en: "Loan in" },
  other_income: { th: "รายรับอื่น", en: "Other income" },
  material: { th: "วัสดุ", en: "Material" },
  labor: { th: "ค่าแรง", en: "Labor" },
  subcontract: { th: "ผู้รับเหมาช่วง", en: "Subcontract" },
  transport: { th: "ค่าขนส่ง", en: "Transport" },
  equipment: { th: "เครื่องมือ/เช่า", en: "Equipment / rental" },
  office: { th: "ค่าออฟฟิศ", en: "Office" },
  tax_fee: { th: "ภาษี/ค่าธรรมเนียม", en: "Tax / fees" },
  other_expense: { th: "รายจ่ายอื่น", en: "Other expense" }
};

const INCOME_CATEGORIES: ReadonlySet<CashflowCategory> = new Set<CashflowCategory>([
  "client_payment",
  "loan_in",
  "other_income"
]);

const EXPENSE_CATEGORIES: ReadonlySet<CashflowCategory> = new Set<CashflowCategory>([
  "material",
  "labor",
  "subcontract",
  "transport",
  "equipment",
  "office",
  "tax_fee",
  "other_expense"
]);

function createCashflowId(index = 0) {
  return `cashflow-${Date.now().toString(36)}-${index}-${Math.random().toString(16).slice(2)}`;
}

function todayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeCashflowDirection(direction: unknown): CashflowDirection {
  return direction === "income" || direction === "expense" ? direction : "expense";
}

function normalizeCashflowCategory(
  category: unknown,
  direction: CashflowDirection
): CashflowCategory {
  if (typeof category === "string") {
    if (INCOME_CATEGORIES.has(category as CashflowCategory)) {
      return category as CashflowCategory;
    }
    if (EXPENSE_CATEGORIES.has(category as CashflowCategory)) {
      return category as CashflowCategory;
    }
  }
  return direction === "income" ? "other_income" : "other_expense";
}

function normalizeCashflowStatus(status: unknown): CashflowEntryStatus {
  return status === "draft" || status === "confirmed" || status === "void" ? status : "draft";
}

function normalizeCashflowSourceType(
  sourceType: unknown,
  entry: Partial<CashflowEntry>
): CashflowSourceType {
  if (
    sourceType === "manual" ||
    sourceType === "pr" ||
    sourceType === "rfq" ||
    sourceType === "po" ||
    sourceType === "invoice" ||
    sourceType === "receipt" ||
    sourceType === "recurring"
  ) {
    return sourceType;
  }
  if (entry.recurringTemplateId?.trim()) return "recurring";
  if (entry.poDocumentId?.trim()) return "po";
  if (entry.rfqId?.trim()) return "rfq";
  if (entry.prId?.trim()) return "pr";
  if (entry.documentId?.trim()) return entry.direction === "income" ? "invoice" : "po";
  return "manual";
}

function normalizeCashflowAmount(amount: unknown): number {
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    return 0;
  }
  return amount < 0 ? 0 : amount;
}

function normalizeIsoDate(value: unknown): string {
  if (typeof value !== "string") {
    return todayIsoDate();
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return todayIsoDate();
  }
  // Accept either YYYY-MM-DD or a full ISO timestamp; coerce to YYYY-MM-DD.
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : todayIsoDate();
}

function normalizeCashflowEntry(entry: Partial<CashflowEntry>, index = 0): CashflowEntry {
  const now = new Date().toISOString();
  const direction = normalizeCashflowDirection(entry.direction);
  const category = normalizeCashflowCategory(entry.category, direction);
  const sourceType = normalizeCashflowSourceType(entry.sourceType, {
    ...entry,
    direction
  });
  const quantityActual =
    typeof entry.quantityActual === "number" && Number.isFinite(entry.quantityActual)
      ? Math.max(0, entry.quantityActual)
      : 0;

  return {
    id: entry.id?.trim() || createCashflowId(index),
    direction,
    category,
    amount: normalizeCashflowAmount(entry.amount),
    description: entry.description?.trim() || "",
    projectId: entry.projectId?.trim() || "",
    documentId: entry.documentId?.trim() || "",
    entryDate: normalizeIsoDate(entry.entryDate),
    status: normalizeCashflowStatus(entry.status),
    sourceType,
    sourceDocumentId:
      entry.sourceDocumentId?.trim() ||
      entry.poDocumentId?.trim() ||
      entry.rfqId?.trim() ||
      entry.prId?.trim() ||
      entry.documentId?.trim() ||
      "",
    note: entry.note?.trim() || "",
    createdAt: entry.createdAt ?? now,
    updatedAt: entry.updatedAt ?? now,
    // Sprint 5 — back-compat defaults; old records without these fields load fine
    costCodeId: entry.costCodeId?.trim() ?? "",
    supplierId: entry.supplierId?.trim() ?? "",
    prId: entry.prId?.trim() ?? "",
    rfqId: entry.rfqId?.trim() ?? "",
    poDocumentId: entry.poDocumentId?.trim() ?? "",
    quantityActual,
    unitActual: entry.unitActual?.trim() ?? "",
    recurringTemplateId: entry.recurringTemplateId?.trim() ?? ""
  };
}

export function normalizeCashflowState(input: unknown): CashflowState {
  if (Array.isArray(input)) {
    return {
      entries: input.map((entry, index) =>
        normalizeCashflowEntry((entry ?? {}) as Partial<CashflowEntry>, index)
      ),
      updatedAt: new Date().toISOString()
    };
  }

  if (input && typeof input === "object") {
    const state = input as CashflowStateInput;
    return {
      entries: Array.isArray(state.entries)
        ? state.entries.map((entry, index) =>
            normalizeCashflowEntry((entry ?? {}) as Partial<CashflowEntry>, index)
          )
        : [],
      updatedAt: state.updatedAt ?? new Date().toISOString()
    };
  }

  return {
    entries: [],
    updatedAt: ""
  };
}

export function createCashflowEntry(input: Partial<CashflowEntry> = {}): CashflowEntry {
  const now = new Date().toISOString();

  return normalizeCashflowEntry({
    ...input,
    id: input.id ?? createCashflowId(),
    entryDate: input.entryDate ?? todayIsoDate(),
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now
  });
}

export function loadCashflowState(): CashflowState {
  return readJson<CashflowState>(
    defaultStorageAdapter,
    CASHFLOW_STORAGE_KEY,
    { entries: [], updatedAt: "" },
    (raw) => normalizeCashflowState(raw as CashflowStateInput)
  );
}

export function saveCashflowState(state: CashflowState): void {
  writeJson(defaultStorageAdapter, CASHFLOW_STORAGE_KEY, normalizeCashflowState(state));
}

export type CashflowSummary = {
  totalIncome: number;
  totalExpense: number;
  netCash: number;
  draftCount: number;
  monthIncome: number;
  monthExpense: number;
  monthNet: number;
  entryCount: number;
  lastEntryDate: string;
};

export function summarizeCashflow(
  state: CashflowState,
  opts: { sinceIso?: string } = {}
): CashflowSummary {
  const normalized = normalizeCashflowState(state);
  const sinceIso = opts.sinceIso ? normalizeIsoDate(opts.sinceIso) : "";
  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  let totalIncome = 0;
  let totalExpense = 0;
  let monthIncome = 0;
  let monthExpense = 0;
  let draftCount = 0;
  let lastEntryDate = "";

  for (const entry of normalized.entries) {
    if (sinceIso && entry.entryDate < sinceIso) {
      continue;
    }

    if (entry.status === "draft") {
      draftCount += 1;
    }

    if (entry.entryDate && entry.entryDate > lastEntryDate) {
      lastEntryDate = entry.entryDate;
    }

    if (entry.status !== "confirmed") {
      continue;
    }

    const inCurrentMonth = entry.entryDate.startsWith(monthPrefix);

    if (entry.direction === "income") {
      totalIncome += entry.amount;
      if (inCurrentMonth) {
        monthIncome += entry.amount;
      }
    } else {
      totalExpense += entry.amount;
      if (inCurrentMonth) {
        monthExpense += entry.amount;
      }
    }
  }

  return {
    totalIncome,
    totalExpense,
    netCash: totalIncome - totalExpense,
    draftCount,
    monthIncome,
    monthExpense,
    monthNet: monthIncome - monthExpense,
    entryCount: normalized.entries.length,
    lastEntryDate
  };
}

export function filterCashflowByProject(
  state: CashflowState,
  projectId: string
): CashflowEntry[] {
  const normalized = normalizeCashflowState(state);
  const target = projectId.trim();
  return normalized.entries.filter((entry) => entry.projectId === target);
}

export function filterCashflowByCostCode(
  state: CashflowState,
  costCodeId: string
): CashflowEntry[] {
  const normalized = normalizeCashflowState(state);
  const target = costCodeId.trim();
  return normalized.entries.filter((entry) => entry.costCodeId === target);
}

export function filterCashflowBySupplier(
  state: CashflowState,
  supplierId: string
): CashflowEntry[] {
  const normalized = normalizeCashflowState(state);
  const target = supplierId.trim();
  return normalized.entries.filter((entry) => entry.supplierId === target);
}

// NOTE: richer filterCashflowEntries + CashflowFilterOptions live in
// `src/cashflow.rollup.ts` (uses the new sourceType field directly).
// Keep the simple per-key helpers above for callers that only need one axis.

export function upsertCashflowEntry(
  state: CashflowState,
  entry: Partial<CashflowEntry>
): CashflowState {
  const now = new Date().toISOString();
  const normalizedEntry = normalizeCashflowEntry({
    ...entry,
    id: entry.id ?? createCashflowId(),
    updatedAt: now
  });
  const baseState = normalizeCashflowState(state);
  const hasExisting = baseState.entries.some((item) => item.id === normalizedEntry.id);

  return normalizeCashflowState({
    entries: hasExisting
      ? baseState.entries.map((item) =>
          item.id === normalizedEntry.id ? normalizedEntry : item
        )
      : [normalizedEntry, ...baseState.entries],
    updatedAt: now
  });
}

export function removeCashflowEntry(state: CashflowState, id: string): CashflowState {
  const baseState = normalizeCashflowState(state);
  const now = new Date().toISOString();

  return normalizeCashflowState({
    entries: baseState.entries.filter((entry) => entry.id !== id),
    updatedAt: now
  });
}
