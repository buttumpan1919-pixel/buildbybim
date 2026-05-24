// Cashflow recurring templates — Sprint 5
// Spec: docs/CASHFLOW_PROJECT_EXTENSION_PRD.md Section 4.2 + 6.3
//
// Manual recurring (user-triggered "Generate this month's entries") — no
// scheduled cron. Stores templates in its own storage key so the cashflow
// module stays focused on entries.

import { defaultStorageAdapter, readJson, writeJson } from "./storageAdapter";
import type {
  CashflowCategory,
  CashflowDirection,
  CashflowEntry
} from "./cashflow";
import { createCashflowEntry } from "./cashflow";

export const RECURRING_STORAGE_KEY = "cashflow.recurring.v1";

export type RecurringFrequency = "monthly" | "weekly" | "quarterly" | "yearly";

export type RecurringTemplate = {
  id: string;
  workspaceId: string;
  name: string;
  direction: CashflowDirection;
  category: CashflowCategory;
  amount: number;
  projectId: string;
  costCodeId: string;
  supplierId: string;
  description: string;
  frequency: RecurringFrequency;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD, empty = no end
  lastGeneratedDate: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RecurringTemplateState = {
  templates: RecurringTemplate[];
  updatedAt: string;
};

const FREQUENCIES: ReadonlySet<RecurringFrequency> = new Set<RecurringFrequency>([
  "monthly",
  "weekly",
  "quarterly",
  "yearly"
]);

export const recurringFrequencyCopy: Record<
  RecurringFrequency,
  { th: string; en: string }
> = {
  monthly: { th: "ทุกเดือน", en: "Monthly" },
  weekly: { th: "ทุกสัปดาห์", en: "Weekly" },
  quarterly: { th: "ทุกไตรมาส", en: "Quarterly" },
  yearly: { th: "ทุกปี", en: "Yearly" }
};

function createTemplateId(index = 0): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `rec-${Date.now().toString(36)}-${index}-${Math.random().toString(16).slice(2)}`;
}

function normalizeIsoDate(value: unknown): string {
  if (typeof value !== "string") return "";
  const m = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : "";
}

function normalizeAmount(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return value < 0 ? 0 : value;
}

function normalizeFrequency(value: unknown): RecurringFrequency {
  return typeof value === "string" && FREQUENCIES.has(value as RecurringFrequency)
    ? (value as RecurringFrequency)
    : "monthly";
}

export function normalizeRecurringTemplate(
  input: Partial<RecurringTemplate>,
  index = 0
): RecurringTemplate {
  const now = new Date().toISOString();
  return {
    id: input.id?.trim() || createTemplateId(index),
    workspaceId: input.workspaceId?.trim() ?? "",
    name: input.name?.trim() || "Recurring template",
    direction: input.direction === "income" ? "income" : "expense",
    category: (input.category as CashflowCategory) ?? "other_expense",
    amount: normalizeAmount(input.amount),
    projectId: input.projectId?.trim() ?? "",
    costCodeId: input.costCodeId?.trim() ?? "",
    supplierId: input.supplierId?.trim() ?? "",
    description: input.description?.trim() ?? "",
    frequency: normalizeFrequency(input.frequency),
    startDate: normalizeIsoDate(input.startDate),
    endDate: normalizeIsoDate(input.endDate),
    lastGeneratedDate: normalizeIsoDate(input.lastGeneratedDate),
    active: input.active === false ? false : true,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now
  };
}

export function normalizeRecurringTemplateState(input: unknown): RecurringTemplateState {
  if (input && typeof input === "object") {
    const state = input as {
      templates?: Partial<RecurringTemplate>[];
      updatedAt?: string;
    };
    return {
      templates: Array.isArray(state.templates)
        ? state.templates.map((t, i) =>
            normalizeRecurringTemplate((t ?? {}) as Partial<RecurringTemplate>, i)
          )
        : [],
      updatedAt: state.updatedAt ?? new Date().toISOString()
    };
  }
  return { templates: [], updatedAt: "" };
}

export function loadRecurringTemplates(): RecurringTemplateState {
  return readJson<RecurringTemplateState>(
    defaultStorageAdapter,
    RECURRING_STORAGE_KEY,
    { templates: [], updatedAt: "" },
    (raw) => normalizeRecurringTemplateState(raw)
  );
}

export function saveRecurringTemplates(state: RecurringTemplateState): void {
  writeJson(
    defaultStorageAdapter,
    RECURRING_STORAGE_KEY,
    normalizeRecurringTemplateState(state)
  );
}

export function upsertRecurringTemplate(
  state: RecurringTemplateState,
  candidate: Partial<RecurringTemplate>
): RecurringTemplateState {
  const now = new Date().toISOString();
  const normalized = normalizeRecurringTemplate({
    ...candidate,
    id: candidate.id ?? createTemplateId(),
    updatedAt: now
  });
  const base = normalizeRecurringTemplateState(state);
  const exists = base.templates.some((t) => t.id === normalized.id);
  return normalizeRecurringTemplateState({
    templates: exists
      ? base.templates.map((t) => (t.id === normalized.id ? normalized : t))
      : [normalized, ...base.templates],
    updatedAt: now
  });
}

export function removeRecurringTemplate(
  state: RecurringTemplateState,
  id: string
): RecurringTemplateState {
  const base = normalizeRecurringTemplateState(state);
  return normalizeRecurringTemplateState({
    templates: base.templates.filter((t) => t.id !== id),
    updatedAt: new Date().toISOString()
  });
}

// ----------------------------------------------------------------------------
// Period iteration
// ----------------------------------------------------------------------------

function parseIsoDate(iso: string): Date | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
}

function isoFromDate(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate()
  ).padStart(2, "0")}`;
}

function addPeriod(d: Date, frequency: RecurringFrequency): Date {
  const next = new Date(d);
  switch (frequency) {
    case "weekly":
      next.setUTCDate(next.getUTCDate() + 7);
      break;
    case "monthly":
      next.setUTCMonth(next.getUTCMonth() + 1);
      break;
    case "quarterly":
      next.setUTCMonth(next.getUTCMonth() + 3);
      break;
    case "yearly":
      next.setUTCFullYear(next.getUTCFullYear() + 1);
      break;
  }
  return next;
}

export type GenerateRecurringResult = {
  template: RecurringTemplate; // template with lastGeneratedDate advanced
  generatedEntries: CashflowEntry[];
};

/**
 * Generate cashflow entries from a template, one per period since
 * `lastGeneratedDate` (or `startDate` if never generated) up to
 * `referenceDate` (today by default).
 *
 * Rules:
 *   - inactive templates → no entries
 *   - if `endDate` set and < startDate of period → stop
 *   - generated entries get `status: 'draft'` so user reviews + confirms
 *   - `template.lastGeneratedDate` advances to the most recent period
 *     so calling this twice in a row is idempotent
 */
export function generateEntriesFromTemplate(
  template: RecurringTemplate,
  referenceDate: Date = new Date()
): GenerateRecurringResult {
  if (!template.active) {
    return { template, generatedEntries: [] };
  }
  const startDate = parseIsoDate(template.startDate);
  if (!startDate) return { template, generatedEntries: [] };
  const endDate = template.endDate ? parseIsoDate(template.endDate) : null;
  const refUtc = new Date(
    Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate())
  );

  // First period to generate = next period after lastGeneratedDate, or startDate if never run
  const lastGen = parseIsoDate(template.lastGeneratedDate);
  let cursor = lastGen ? addPeriod(lastGen, template.frequency) : new Date(startDate);
  if (cursor < startDate) cursor = new Date(startDate);

  const generated: CashflowEntry[] = [];
  let lastFiredAt = template.lastGeneratedDate;

  while (cursor.getTime() <= refUtc.getTime()) {
    if (endDate && cursor.getTime() > endDate.getTime()) break;
    const entryDate = isoFromDate(cursor);
    const entry = createCashflowEntry({
      direction: template.direction,
      category: template.category,
      amount: template.amount,
      description: template.description || template.name,
      projectId: template.projectId,
      costCodeId: template.costCodeId,
      supplierId: template.supplierId,
      entryDate,
      status: "draft",
      note: `Auto-generated from recurring "${template.name}"`,
      recurringTemplateId: template.id
    });
    generated.push(entry);
    lastFiredAt = entryDate;
    cursor = addPeriod(cursor, template.frequency);
  }

  return {
    template: { ...template, lastGeneratedDate: lastFiredAt, updatedAt: new Date().toISOString() },
    generatedEntries: generated
  };
}

/** Convenience: generate from all active templates in state. */
export function generateAllRecurring(
  state: RecurringTemplateState,
  referenceDate: Date = new Date()
): {
  state: RecurringTemplateState;
  generatedEntries: CashflowEntry[];
} {
  const base = normalizeRecurringTemplateState(state);
  const generated: CashflowEntry[] = [];
  const templates: RecurringTemplate[] = [];
  for (const tpl of base.templates) {
    const result = generateEntriesFromTemplate(tpl, referenceDate);
    templates.push(result.template);
    generated.push(...result.generatedEntries);
  }
  return {
    state: normalizeRecurringTemplateState({
      templates,
      updatedAt: new Date().toISOString()
    }),
    generatedEntries: generated
  };
}
