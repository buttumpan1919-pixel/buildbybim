import {
  normalizeCashflowState,
  type CashflowDirection,
  type CashflowEntry,
  type CashflowEntryStatus,
  type CashflowSourceType,
  type CashflowState
} from "./cashflow";
import {
  normalizeProjectListState,
  type ProjectListState
} from "./projects";
import {
  normalizeSupplierState,
  type SupplierPriceHistoryEntry,
  type SupplierState
} from "./suppliers";

export type ProjectRollup = {
  projectId: string;
  actualCost: number;
  actualRevenue: number;
  costCodeRollups: Record<string, number>;
  lastEntryAt: string;
  confirmedEntryCount: number;
};

export type CashflowFilterOptions = {
  projectId?: string | "all";
  costCodeId?: string | "all";
  supplierId?: string | "all";
  direction?: CashflowDirection | "all";
  status?: CashflowEntryStatus | "all";
  sourceType?: CashflowSourceType | "all";
  search?: string;
};

const CASHFLOW_PRICE_HISTORY_PREFIX = "cashflow-price-";

function trimFilter(value: string | undefined): string {
  return value && value !== "all" ? value.trim() : "";
}

export function computeProjectRollup(
  projectId: string,
  entries: CashflowEntry[]
): ProjectRollup {
  const target = projectId.trim();
  const rollup: ProjectRollup = {
    projectId: target,
    actualCost: 0,
    actualRevenue: 0,
    costCodeRollups: {},
    lastEntryAt: "",
    confirmedEntryCount: 0
  };

  if (!target) return rollup;

  for (const entry of entries) {
    if (entry.projectId !== target || entry.status !== "confirmed") continue;

    rollup.confirmedEntryCount += 1;
    if (entry.entryDate > rollup.lastEntryAt) {
      rollup.lastEntryAt = entry.entryDate;
    }

    if (entry.direction === "income") {
      rollup.actualRevenue += entry.amount;
      continue;
    }

    rollup.actualCost += entry.amount;
    if (entry.costCodeId) {
      rollup.costCodeRollups[entry.costCodeId] =
        (rollup.costCodeRollups[entry.costCodeId] ?? 0) + entry.amount;
    }
  }

  return rollup;
}

export function syncProjectFromCashflow(
  projectId: string,
  cashflowState: CashflowState,
  projectState: ProjectListState
): ProjectListState {
  const baseProjects = normalizeProjectListState(projectState);
  const baseCashflow = normalizeCashflowState(cashflowState);
  const rollup = computeProjectRollup(projectId, baseCashflow.entries);
  const now = new Date().toISOString();
  let changed = false;

  const projects = baseProjects.projects.map((project) => {
    if (project.id !== rollup.projectId) return project;
    if (
      project.actualCost === rollup.actualCost &&
      project.actualRevenue === rollup.actualRevenue
    ) {
      return project;
    }
    changed = true;
    return {
      ...project,
      actualCost: rollup.actualCost,
      actualRevenue: rollup.actualRevenue,
      updatedAt: now
    };
  });

  if (!changed) return baseProjects;
  return normalizeProjectListState({ projects, updatedAt: now });
}

export function syncProjectsFromCashflow(
  cashflowState: CashflowState,
  projectState: ProjectListState
): ProjectListState {
  const baseProjects = normalizeProjectListState(projectState);
  return baseProjects.projects.reduce(
    (next, project) => syncProjectFromCashflow(project.id, cashflowState, next),
    baseProjects
  );
}

export function filterCashflowEntries(
  state: CashflowState,
  opts: CashflowFilterOptions = {}
): CashflowEntry[] {
  const normalized = normalizeCashflowState(state);
  const projectId = trimFilter(opts.projectId);
  const costCodeId = trimFilter(opts.costCodeId);
  const supplierId = trimFilter(opts.supplierId);
  const search = (opts.search ?? "").trim().toLowerCase();

  return normalized.entries.filter((entry) => {
    if (projectId && entry.projectId !== projectId) return false;
    if (costCodeId && entry.costCodeId !== costCodeId) return false;
    if (supplierId && entry.supplierId !== supplierId) return false;
    if (opts.direction && opts.direction !== "all" && entry.direction !== opts.direction) {
      return false;
    }
    if (opts.status && opts.status !== "all" && entry.status !== opts.status) {
      return false;
    }
    if (opts.sourceType && opts.sourceType !== "all" && entry.sourceType !== opts.sourceType) {
      return false;
    }
    if (search) {
      const haystack = `${entry.description} ${entry.note} ${entry.sourceDocumentId}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

export function buildSupplierPriceHistoryEntryFromCashflow(
  entry: CashflowEntry
): SupplierPriceHistoryEntry | null {
  if (
    entry.status !== "confirmed" ||
    entry.direction !== "expense" ||
    !entry.supplierId ||
    !entry.costCodeId ||
    entry.amount <= 0
  ) {
    return null;
  }

  const quantity = entry.quantityActual > 0 ? entry.quantityActual : 1;
  const unitPrice = quantity > 0 ? entry.amount / quantity : entry.amount;
  const unit = entry.unitActual || "lump_sum";

  return {
    id: `${CASHFLOW_PRICE_HISTORY_PREFIX}${entry.id}`,
    workspaceId: "",
    supplierId: entry.supplierId,
    costCodeId: entry.costCodeId,
    itemDescription: entry.description,
    unitPrice,
    unit,
    quantity,
    totalAmount: entry.amount,
    quotedAt: entry.entryDate,
    sourceType: "manual",
    sourceDocumentId: entry.id,
    note: entry.note || `Synced from cashflow ${entry.entryDate}`,
    createdAt: entry.updatedAt || new Date().toISOString()
  };
}

export function removeCashflowPriceHistory(
  supplierState: SupplierState,
  cashflowEntryId: string
): SupplierState {
  const base = normalizeSupplierState(supplierState);
  const nextHistory = base.priceHistory.filter(
    (item) =>
      item.id !== `${CASHFLOW_PRICE_HISTORY_PREFIX}${cashflowEntryId}` &&
      !(item.sourceType === "manual" && item.sourceDocumentId === cashflowEntryId)
  );

  if (nextHistory.length === base.priceHistory.length) return base;
  return normalizeSupplierState({
    ...base,
    priceHistory: nextHistory,
    updatedAt: new Date().toISOString()
  });
}

export function syncSupplierPriceHistoryFromCashflow(
  supplierState: SupplierState,
  entry: CashflowEntry
): SupplierState {
  const withoutExisting = removeCashflowPriceHistory(supplierState, entry.id);
  const nextEntry = buildSupplierPriceHistoryEntryFromCashflow(entry);
  if (!nextEntry) return withoutExisting;

  return normalizeSupplierState({
    ...withoutExisting,
    priceHistory: [nextEntry, ...withoutExisting.priceHistory],
    updatedAt: new Date().toISOString()
  });
}
