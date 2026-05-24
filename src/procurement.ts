// Procurement domain module — Sprint 3 (PR) + Sprint 4 (RFQ)
// Spec: docs/PROCUREMENT_PRD.md
//
// Combines PR + RFQ in one module since they share auto-numbering,
// project/cost-code/supplier linkage, and state machine patterns.
// Storage uses two separate keys so PR mutations don't trigger RFQ writes
// (and vice versa) but the public API is unified.

import { defaultStorageAdapter, readJson, writeJson } from "./storageAdapter";

export const PR_STORAGE_KEY = "procurement.pr.v1";
export const RFQ_STORAGE_KEY = "procurement.rfq.v1";

// ----------------------------------------------------------------------------
// PR types
// ----------------------------------------------------------------------------

export type PRStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "rfq_sent"
  | "awarded"
  | "ordered"
  | "received"
  | "closed"
  | "cancelled";

export type PRLineItem = {
  id: string;
  costCodeId: string;
  description: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice: number;
  amount: number;
  preferredSupplierId: string;
  note: string;
};

export type PurchaseRequest = {
  id: string;
  workspaceId: string;
  projectId: string;
  prNo: string;
  requestedBy: string;
  approvedBy: string;
  rejectedReason: string;
  status: PRStatus;
  requestDate: string;
  neededByDate: string;
  notes: string;
  items: PRLineItem[];
  totalAmount: number;
  linkedRfqId: string;
  linkedPoDocumentId: string;
  createdAt: string;
  updatedAt: string;
};

export type PRState = {
  prs: PurchaseRequest[];
  updatedAt: string;
};

// ----------------------------------------------------------------------------
// RFQ types (schema defined now so Sprint 3 storage can ignore them; UI in Sprint 4)
// ----------------------------------------------------------------------------

export type RFQStatus =
  | "draft"
  | "sent"
  | "partial_response"
  | "responses_complete"
  | "awarded"
  | "cancelled";

export type RFQItemQuote = {
  prLineItemId: string;
  costCodeId: string;
  description: string;
  unitPrice: number;
  amount: number;
  alternativeSpec: string;
  available: boolean;
  note: string;
};

export type RFQResponseChannel = "email" | "line" | "manual" | "phone";

export type RFQResponse = {
  id: string;
  supplierId: string;
  itemQuotes: RFQItemQuote[];
  totalAmount: number;
  paymentTerms: string;
  deliveryDate: string;
  validUntil: string;
  notes: string;
  receivedAt: string;
  receivedVia: RFQResponseChannel;
};

export type RFQ = {
  id: string;
  workspaceId: string;
  projectId: string;
  prId: string;
  rfqNo: string;
  status: RFQStatus;
  invitedSupplierIds: string[];
  responses: RFQResponse[];
  awardedSupplierId: string;
  awardedAt: string;
  awardReason: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type RFQState = {
  rfqs: RFQ[];
  updatedAt: string;
};

// ----------------------------------------------------------------------------
// Copy maps (TH/EN)
// ----------------------------------------------------------------------------

export const prStatusCopy: Record<
  PRStatus,
  { th: string; en: string; tone: "info" | "warn" | "success" | "danger" | "neutral" }
> = {
  draft: { th: "ร่าง", en: "Draft", tone: "info" },
  submitted: { th: "รออนุมัติ", en: "Submitted", tone: "warn" },
  approved: { th: "อนุมัติ", en: "Approved", tone: "success" },
  rejected: { th: "ปฏิเสธ", en: "Rejected", tone: "danger" },
  rfq_sent: { th: "ส่ง RFQ", en: "RFQ sent", tone: "info" },
  awarded: { th: "เลือก supplier", en: "Awarded", tone: "success" },
  ordered: { th: "ออก PO", en: "Ordered", tone: "success" },
  received: { th: "รับของแล้ว", en: "Received", tone: "success" },
  closed: { th: "ปิดงาน", en: "Closed", tone: "neutral" },
  cancelled: { th: "ยกเลิก", en: "Cancelled", tone: "danger" }
};

export const rfqStatusCopy: Record<RFQStatus, { th: string; en: string }> = {
  draft: { th: "ร่าง", en: "Draft" },
  sent: { th: "ส่งแล้ว", en: "Sent" },
  partial_response: { th: "ตอบบางส่วน", en: "Partial response" },
  responses_complete: { th: "ตอบครบ", en: "Responses complete" },
  awarded: { th: "เลือกแล้ว", en: "Awarded" },
  cancelled: { th: "ยกเลิก", en: "Cancelled" }
};

const PR_STATUSES: ReadonlySet<PRStatus> = new Set<PRStatus>([
  "draft",
  "submitted",
  "approved",
  "rejected",
  "rfq_sent",
  "awarded",
  "ordered",
  "received",
  "closed",
  "cancelled"
]);

const RFQ_STATUSES: ReadonlySet<RFQStatus> = new Set<RFQStatus>([
  "draft",
  "sent",
  "partial_response",
  "responses_complete",
  "awarded",
  "cancelled"
]);

// ----------------------------------------------------------------------------
// ID helpers + numbering
// ----------------------------------------------------------------------------

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

function normalizeIsoDate(value: unknown): string {
  if (typeof value !== "string") return "";
  const m = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : "";
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/**
 * Auto-suggest next PR number in `PR-{YYYY}-NNN` pattern. Resets sequence
 * on year change. Pads sequence to 3 digits.
 */
export function nextPrNumber(
  prs: Pick<PurchaseRequest, "prNo">[],
  reference: Date = new Date()
): string {
  const year = reference.getFullYear();
  const prefix = `PR-${year}-`;
  const seqs = prs
    .map((p) => p.prNo)
    .filter((no): no is string => typeof no === "string" && no.startsWith(prefix))
    .map((no) => parseInt(no.slice(prefix.length), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  const next = (seqs.length > 0 ? Math.max(...seqs) : 0) + 1;
  return `${prefix}${next.toString().padStart(3, "0")}`;
}

/** Same shape as nextPrNumber but for RFQ. `RFQ-{YYYY}-NNN`. */
export function nextRfqNumber(
  rfqs: Pick<RFQ, "rfqNo">[],
  reference: Date = new Date()
): string {
  const year = reference.getFullYear();
  const prefix = `RFQ-${year}-`;
  const seqs = rfqs
    .map((r) => r.rfqNo)
    .filter((no): no is string => typeof no === "string" && no.startsWith(prefix))
    .map((no) => parseInt(no.slice(prefix.length), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  const next = (seqs.length > 0 ? Math.max(...seqs) : 0) + 1;
  return `${prefix}${next.toString().padStart(3, "0")}`;
}

// ----------------------------------------------------------------------------
// Normalize
// ----------------------------------------------------------------------------

export function normalizePRLineItem(
  input: Partial<PRLineItem>,
  index = 0
): PRLineItem {
  const quantity = normalizeAmount(input.quantity);
  const estimatedUnitPrice = normalizeAmount(input.estimatedUnitPrice);
  return {
    id: input.id?.trim() || createId("pli", index),
    costCodeId: input.costCodeId?.trim() ?? "",
    description: input.description?.trim() ?? "",
    quantity,
    unit: input.unit?.trim() ?? "",
    estimatedUnitPrice,
    amount: quantity * estimatedUnitPrice,
    preferredSupplierId: input.preferredSupplierId?.trim() ?? "",
    note: input.note?.trim() ?? ""
  };
}

function normalizePRStatus(value: unknown): PRStatus {
  return typeof value === "string" && PR_STATUSES.has(value as PRStatus)
    ? (value as PRStatus)
    : "draft";
}

function normalizeRFQStatus(value: unknown): RFQStatus {
  return typeof value === "string" && RFQ_STATUSES.has(value as RFQStatus)
    ? (value as RFQStatus)
    : "draft";
}

export function normalizePurchaseRequest(
  input: Partial<PurchaseRequest>,
  index = 0
): PurchaseRequest {
  const now = new Date().toISOString();
  const items = Array.isArray(input.items)
    ? input.items.map((it, i) => normalizePRLineItem(it ?? {}, i))
    : [];
  const totalAmount = items.reduce((sum, it) => sum + it.amount, 0);
  return {
    id: input.id?.trim() || createId("pr", index),
    workspaceId: input.workspaceId?.trim() ?? "",
    projectId: input.projectId?.trim() ?? "",
    prNo: input.prNo?.trim() ?? "",
    requestedBy: input.requestedBy?.trim() ?? "",
    approvedBy: input.approvedBy?.trim() ?? "",
    rejectedReason: input.rejectedReason?.trim() ?? "",
    status: normalizePRStatus(input.status),
    requestDate: normalizeIsoDate(input.requestDate) || todayIso(),
    neededByDate: normalizeIsoDate(input.neededByDate),
    notes: input.notes?.trim() ?? "",
    items,
    totalAmount,
    linkedRfqId: input.linkedRfqId?.trim() ?? "",
    linkedPoDocumentId: input.linkedPoDocumentId?.trim() ?? "",
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now
  };
}

function normalizePRState(input: unknown): PRState {
  if (input && typeof input === "object") {
    const state = input as { prs?: Partial<PurchaseRequest>[]; updatedAt?: string };
    return {
      prs: Array.isArray(state.prs)
        ? state.prs.map((p, i) => normalizePurchaseRequest((p ?? {}) as Partial<PurchaseRequest>, i))
        : [],
      updatedAt: state.updatedAt ?? new Date().toISOString()
    };
  }
  return { prs: [], updatedAt: "" };
}

function normalizeRFQItemQuote(input: Partial<RFQItemQuote>): RFQItemQuote {
  return {
    prLineItemId: input.prLineItemId?.trim() ?? "",
    costCodeId: input.costCodeId?.trim() ?? "",
    description: input.description?.trim() ?? "",
    unitPrice: normalizeAmount(input.unitPrice),
    amount: normalizeAmount(input.amount), // caller-supplied summary; matrix recomputes from qty when needed
    alternativeSpec: input.alternativeSpec?.trim() ?? "",
    available: input.available === false ? false : true,
    note: input.note?.trim() ?? ""
  };
}

function normalizeRFQResponse(input: Partial<RFQResponse>, index = 0): RFQResponse {
  const itemQuotes = Array.isArray(input.itemQuotes)
    ? input.itemQuotes.map((q) => normalizeRFQItemQuote(q ?? {}))
    : [];
  const totalAmount =
    input.totalAmount !== undefined && Number.isFinite(input.totalAmount)
      ? normalizeAmount(input.totalAmount)
      : itemQuotes.reduce((sum, q) => sum + (q.available ? q.amount : 0), 0);
  return {
    id: input.id?.trim() || createId("rfqr", index),
    supplierId: input.supplierId?.trim() ?? "",
    itemQuotes,
    totalAmount,
    paymentTerms: input.paymentTerms?.trim() ?? "",
    deliveryDate: normalizeIsoDate(input.deliveryDate),
    validUntil: normalizeIsoDate(input.validUntil),
    notes: input.notes?.trim() ?? "",
    receivedAt: input.receivedAt ?? new Date().toISOString(),
    receivedVia:
      input.receivedVia === "email" ||
      input.receivedVia === "line" ||
      input.receivedVia === "phone"
        ? input.receivedVia
        : "manual"
  };
}

export function normalizeRFQ(input: Partial<RFQ>, index = 0): RFQ {
  const now = new Date().toISOString();
  return {
    id: input.id?.trim() || createId("rfq", index),
    workspaceId: input.workspaceId?.trim() ?? "",
    projectId: input.projectId?.trim() ?? "",
    prId: input.prId?.trim() ?? "",
    rfqNo: input.rfqNo?.trim() ?? "",
    status: normalizeRFQStatus(input.status),
    invitedSupplierIds: Array.isArray(input.invitedSupplierIds)
      ? input.invitedSupplierIds.filter((id): id is string => typeof id === "string" && id.length > 0)
      : [],
    responses: Array.isArray(input.responses)
      ? input.responses.map((r, i) => normalizeRFQResponse(r ?? {}, i))
      : [],
    awardedSupplierId: input.awardedSupplierId?.trim() ?? "",
    awardedAt: input.awardedAt ?? "",
    awardReason: input.awardReason?.trim() ?? "",
    createdBy: input.createdBy?.trim() ?? "",
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now
  };
}

function normalizeRFQState(input: unknown): RFQState {
  if (input && typeof input === "object") {
    const state = input as { rfqs?: Partial<RFQ>[]; updatedAt?: string };
    return {
      rfqs: Array.isArray(state.rfqs)
        ? state.rfqs.map((r, i) => normalizeRFQ((r ?? {}) as Partial<RFQ>, i))
        : [],
      updatedAt: state.updatedAt ?? new Date().toISOString()
    };
  }
  return { rfqs: [], updatedAt: "" };
}

// ----------------------------------------------------------------------------
// Storage
// ----------------------------------------------------------------------------

export function loadPRs(): PRState {
  return readJson<PRState>(
    defaultStorageAdapter,
    PR_STORAGE_KEY,
    { prs: [], updatedAt: "" },
    (raw) => normalizePRState(raw)
  );
}

export function savePRs(state: PRState): void {
  writeJson(defaultStorageAdapter, PR_STORAGE_KEY, normalizePRState(state));
}

export function loadRFQs(): RFQState {
  return readJson<RFQState>(
    defaultStorageAdapter,
    RFQ_STORAGE_KEY,
    { rfqs: [], updatedAt: "" },
    (raw) => normalizeRFQState(raw)
  );
}

export function saveRFQs(state: RFQState): void {
  writeJson(defaultStorageAdapter, RFQ_STORAGE_KEY, normalizeRFQState(state));
}

// ----------------------------------------------------------------------------
// Validation
// ----------------------------------------------------------------------------

export function validatePR(pr: Partial<PurchaseRequest>): string[] {
  const errors: string[] = [];
  if (!pr.projectId?.trim()) errors.push("projectId is required");
  if (!Array.isArray(pr.items) || pr.items.length === 0) {
    errors.push("at least one line item is required");
    return errors;
  }
  pr.items.forEach((it, idx) => {
    const label = `item ${idx + 1}`;
    if (!it.costCodeId?.trim()) errors.push(`${label}: costCodeId is required`);
    if (!it.unit?.trim()) errors.push(`${label}: unit is required`);
    if (typeof it.quantity !== "number" || it.quantity <= 0) {
      errors.push(`${label}: quantity must be > 0`);
    }
  });
  return errors;
}

// ----------------------------------------------------------------------------
// State machine — pure function
// ----------------------------------------------------------------------------

export type PRAction =
  | "submit"
  | "approve"
  | "reject"
  | "send_rfq"
  | "award"
  | "order"
  | "receive"
  | "close"
  | "cancel"
  | "edit"; // edit returns to draft from rejected

const PR_TRANSITIONS: Record<PRStatus, Partial<Record<PRAction, PRStatus>>> = {
  draft: { submit: "submitted", cancel: "cancelled" },
  submitted: { approve: "approved", reject: "rejected", cancel: "cancelled" },
  rejected: { edit: "draft", cancel: "cancelled" },
  approved: { send_rfq: "rfq_sent", order: "ordered", cancel: "cancelled" },
  rfq_sent: { award: "awarded", cancel: "cancelled" },
  awarded: { order: "ordered", cancel: "cancelled" },
  ordered: { receive: "received", cancel: "cancelled" },
  received: { close: "closed" },
  closed: {}, // terminal
  cancelled: {} // terminal
};

export type TransitionContext = {
  approverId?: string;
  reason?: string;
  awardedSupplierId?: string;
  linkedRfqId?: string;
  linkedPoDocumentId?: string;
};

/**
 * Pure state-machine transition. Validates legal transition + required
 * context (e.g. reject requires reason). Returns the next status or throws
 * with a descriptive error.
 */
export function transitionPRStatus(
  current: PRStatus,
  action: PRAction,
  context: TransitionContext = {}
): PRStatus {
  const next = PR_TRANSITIONS[current]?.[action];
  if (!next) {
    throw new Error(`illegal transition ${current} --${action}--> ?`);
  }
  if (action === "approve" && !context.approverId?.trim()) {
    throw new Error("approver id required");
  }
  if (action === "reject" && !context.reason?.trim()) {
    throw new Error("reject reason required");
  }
  if (action === "award" && !context.awardedSupplierId?.trim()) {
    throw new Error("awarded supplier required");
  }
  return next;
}

export function canTransition(current: PRStatus, action: PRAction): boolean {
  return PR_TRANSITIONS[current]?.[action] !== undefined;
}

export function legalActionsFor(current: PRStatus): PRAction[] {
  return Object.keys(PR_TRANSITIONS[current] ?? {}) as PRAction[];
}

// ----------------------------------------------------------------------------
// Mutations
// ----------------------------------------------------------------------------

export function createPR(input: Partial<PurchaseRequest> = {}): PurchaseRequest {
  const now = new Date().toISOString();
  return normalizePurchaseRequest({
    ...input,
    id: input.id ?? createId("pr"),
    status: input.status ?? "draft",
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now
  });
}

export function upsertPR(state: PRState, candidate: Partial<PurchaseRequest>): PRState {
  const now = new Date().toISOString();
  const normalized = normalizePurchaseRequest({
    ...candidate,
    id: candidate.id ?? createId("pr"),
    updatedAt: now
  });
  const base = normalizePRState(state);
  const exists = base.prs.some((p) => p.id === normalized.id);
  return normalizePRState({
    prs: exists
      ? base.prs.map((p) => (p.id === normalized.id ? normalized : p))
      : [normalized, ...base.prs],
    updatedAt: now
  });
}

export function removePR(state: PRState, id: string): PRState {
  const base = normalizePRState(state);
  return normalizePRState({
    prs: base.prs.filter((p) => p.id !== id),
    updatedAt: new Date().toISOString()
  });
}

/**
 * Apply a PR action that mutates status. Returns the updated PR or throws
 * if the transition is illegal. The PR is also normalized so the updatedAt
 * stamp moves forward.
 */
export function applyPRAction(
  pr: PurchaseRequest,
  action: PRAction,
  context: TransitionContext = {}
): PurchaseRequest {
  const nextStatus = transitionPRStatus(pr.status, action, context);
  const now = new Date().toISOString();
  const patch: Partial<PurchaseRequest> = {
    ...pr,
    status: nextStatus,
    updatedAt: now
  };
  if (action === "approve") patch.approvedBy = context.approverId ?? pr.approvedBy;
  if (action === "reject") patch.rejectedReason = context.reason ?? pr.rejectedReason;
  if (action === "send_rfq" && context.linkedRfqId) patch.linkedRfqId = context.linkedRfqId;
  if (action === "order" && context.linkedPoDocumentId) {
    patch.linkedPoDocumentId = context.linkedPoDocumentId;
  }
  if (action === "edit") {
    // Clear rejection metadata when sending back to draft for re-work
    patch.rejectedReason = "";
  }
  return normalizePurchaseRequest(patch);
}

// ----------------------------------------------------------------------------
// Query helpers
// ----------------------------------------------------------------------------

export function filterPRs(
  state: PRState,
  opts: { status?: PRStatus | "all"; projectId?: string | "all"; search?: string } = {}
): PurchaseRequest[] {
  const search = (opts.search ?? "").trim().toLowerCase();
  return state.prs.filter((pr) => {
    if (opts.status && opts.status !== "all" && pr.status !== opts.status) return false;
    if (opts.projectId && opts.projectId !== "all" && pr.projectId !== opts.projectId) {
      return false;
    }
    if (search) {
      const haystack = `${pr.prNo} ${pr.notes}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

export type PRSummary = {
  total: number;
  byStatus: Record<PRStatus, number>;
  totalAmount: number;
  pendingApproval: number;
  inProgress: number; // approved + rfq_sent + awarded + ordered
};

export function summarizePRs(state: PRState): PRSummary {
  const byStatus: Record<PRStatus, number> = {
    draft: 0,
    submitted: 0,
    approved: 0,
    rejected: 0,
    rfq_sent: 0,
    awarded: 0,
    ordered: 0,
    received: 0,
    closed: 0,
    cancelled: 0
  };
  let totalAmount = 0;
  for (const pr of state.prs) {
    byStatus[pr.status] += 1;
    totalAmount += pr.totalAmount;
  }
  const inProgress =
    byStatus.approved + byStatus.rfq_sent + byStatus.awarded + byStatus.ordered;
  return {
    total: state.prs.length,
    byStatus,
    totalAmount,
    pendingApproval: byStatus.submitted,
    inProgress
  };
}

// ----------------------------------------------------------------------------
// RFQ helpers (used in Sprint 4; provided now so PR can link)
// ----------------------------------------------------------------------------

export function upsertRFQ(state: RFQState, candidate: Partial<RFQ>): RFQState {
  const now = new Date().toISOString();
  const normalized = normalizeRFQ({
    ...candidate,
    id: candidate.id ?? createId("rfq"),
    updatedAt: now
  });
  const base = normalizeRFQState(state);
  const exists = base.rfqs.some((r) => r.id === normalized.id);
  return normalizeRFQState({
    rfqs: exists
      ? base.rfqs.map((r) => (r.id === normalized.id ? normalized : r))
      : [normalized, ...base.rfqs],
    updatedAt: now
  });
}

/**
 * Build a draft RFQ from an approved PR — prefills items from PR line items.
 * Caller is responsible for assigning the rfqNo + saving via upsertRFQ.
 */
export function draftRFQFromPR(pr: PurchaseRequest, createdBy = ""): RFQ {
  if (pr.status !== "approved") {
    throw new Error("RFQ can only be drafted from an approved PR");
  }
  return normalizeRFQ({
    workspaceId: pr.workspaceId,
    projectId: pr.projectId,
    prId: pr.id,
    rfqNo: "",
    status: "draft",
    invitedSupplierIds: pr.items
      .map((it) => it.preferredSupplierId)
      .filter((id): id is string => !!id && id.length > 0),
    responses: [],
    createdBy
  });
}

export function removeRFQ(state: RFQState, id: string): RFQState {
  const base = normalizeRFQState(state);
  return normalizeRFQState({
    rfqs: base.rfqs.filter((r) => r.id !== id),
    updatedAt: new Date().toISOString()
  });
}

// ----------------------------------------------------------------------------
// RFQ state machine
// ----------------------------------------------------------------------------

export type RFQAction = "send" | "record_response" | "complete" | "award" | "cancel";

const RFQ_TRANSITIONS: Record<RFQStatus, Partial<Record<RFQAction, RFQStatus>>> = {
  draft: { send: "sent", cancel: "cancelled" },
  sent: { record_response: "partial_response", cancel: "cancelled" },
  partial_response: {
    record_response: "partial_response",
    complete: "responses_complete",
    award: "awarded",
    cancel: "cancelled"
  },
  responses_complete: { award: "awarded", cancel: "cancelled" },
  awarded: {}, // terminal until cancelled
  cancelled: {}
};

export type RFQTransitionContext = {
  awardedSupplierId?: string;
  awardReason?: string;
};

export function transitionRFQStatus(
  current: RFQStatus,
  action: RFQAction,
  context: RFQTransitionContext = {}
): RFQStatus {
  const next = RFQ_TRANSITIONS[current]?.[action];
  if (!next) {
    throw new Error(`illegal RFQ transition ${current} --${action}--> ?`);
  }
  if (action === "award") {
    if (!context.awardedSupplierId?.trim()) {
      throw new Error("awardedSupplierId required to award RFQ");
    }
    if (!context.awardReason?.trim()) {
      throw new Error("awardReason required to award RFQ");
    }
  }
  return next;
}

export function canTransitionRFQ(current: RFQStatus, action: RFQAction): boolean {
  return RFQ_TRANSITIONS[current]?.[action] !== undefined;
}

export function legalRFQActionsFor(current: RFQStatus): RFQAction[] {
  return Object.keys(RFQ_TRANSITIONS[current] ?? {}) as RFQAction[];
}

// ----------------------------------------------------------------------------
// RFQ response mutations
// ----------------------------------------------------------------------------

/**
 * Auto-derive the RFQ status from response coverage. Called after
 * recordResponse / removeResponse to keep the state machine honest.
 * - awarded / cancelled / draft → unchanged
 * - sent with ≥1 response → partial_response or responses_complete
 * - partial_response with all invited responded → responses_complete
 */
export function recomputeRFQStatus(rfq: RFQ): RFQStatus {
  if (rfq.status === "awarded" || rfq.status === "cancelled" || rfq.status === "draft") {
    return rfq.status;
  }
  if (rfq.invitedSupplierIds.length === 0) return rfq.status;
  const respondedSet = new Set(rfq.responses.map((r) => r.supplierId));
  const respondedAll = rfq.invitedSupplierIds.every((id) => respondedSet.has(id));
  if (respondedAll) return "responses_complete";
  if (rfq.responses.length > 0) return "partial_response";
  return "sent";
}

/**
 * Record (insert or update) a supplier response on an RFQ. Auto-recomputes
 * status. Sets `receivedAt` if missing.
 */
export function recordResponse(rfq: RFQ, response: Partial<RFQResponse>): RFQ {
  if (rfq.status === "awarded" || rfq.status === "cancelled") {
    throw new Error(`cannot record response on ${rfq.status} RFQ`);
  }
  if (!response.supplierId?.trim()) {
    throw new Error("supplierId required");
  }
  if (!rfq.invitedSupplierIds.includes(response.supplierId)) {
    throw new Error("supplier was not invited to this RFQ");
  }
  const normalized = normalizeRFQResponseExported({
    ...response,
    id: response.id ?? rfq.responses.find((r) => r.supplierId === response.supplierId)?.id
  });
  const exists = rfq.responses.some((r) => r.supplierId === normalized.supplierId);
  const responses = exists
    ? rfq.responses.map((r) =>
        r.supplierId === normalized.supplierId ? normalized : r
      )
    : [...rfq.responses, normalized];
  const next: RFQ = {
    ...rfq,
    responses,
    updatedAt: new Date().toISOString()
  };
  next.status = recomputeRFQStatus(next);
  return normalizeRFQ(next);
}

export function removeResponse(rfq: RFQ, responseId: string): RFQ {
  const responses = rfq.responses.filter((r) => r.id !== responseId);
  const next: RFQ = {
    ...rfq,
    responses,
    updatedAt: new Date().toISOString()
  };
  next.status = recomputeRFQStatus(next);
  return normalizeRFQ(next);
}

// Re-export normalizer so external callers (UI) can build a clean response object.
export function normalizeRFQResponseExported(
  input: Partial<RFQResponse>,
  index = 0
): RFQResponse {
  return normalizeRFQResponse(input, index);
}

// ----------------------------------------------------------------------------
// Comparison matrix
// ----------------------------------------------------------------------------

export type ComparisonCell = {
  supplierId: string;
  unitPrice: number;
  amount: number;
  available: boolean;
  isBest: boolean; // cheapest available across responding suppliers for this line
};

export type ComparisonRow = {
  prLineItemId: string;
  costCodeId: string;
  description: string;
  quantity: number;
  unit: string;
  cells: ComparisonCell[];
};

export type ComparisonMatrix = {
  rows: ComparisonRow[];
  suppliers: string[]; // supplierIds in column order
  totals: { supplierId: string; total: number; isBest: boolean }[];
  bestTotalSupplierId: string;
};

/**
 * Build a comparison matrix for an RFQ + the source PR line items.
 * - Cells marked `isBest: true` are the lowest-price *available* quote for
 *   that line item across all responding suppliers.
 * - Suppliers that did not respond at all appear in `suppliers[]` but their
 *   cells default to `available: false, unitPrice: 0`.
 * - `bestTotalSupplierId` is the supplier with the lowest sum of available
 *   quote amounts (skips suppliers that didn't quote every line).
 */
export function buildComparisonMatrix(rfq: RFQ, prItems: PRLineItem[]): ComparisonMatrix {
  const suppliers = rfq.invitedSupplierIds;
  const responseBySupplier = new Map<string, RFQResponse>();
  for (const r of rfq.responses) responseBySupplier.set(r.supplierId, r);

  const rows: ComparisonRow[] = prItems.map((item) => {
    const cells: ComparisonCell[] = suppliers.map((supplierId) => {
      const response = responseBySupplier.get(supplierId);
      const quote = response?.itemQuotes.find((q) => q.prLineItemId === item.id);
      if (!quote || !quote.available) {
        return {
          supplierId,
          unitPrice: 0,
          amount: 0,
          available: false,
          isBest: false
        };
      }
      const amount = quote.amount > 0 ? quote.amount : quote.unitPrice * item.quantity;
      return {
        supplierId,
        unitPrice: quote.unitPrice,
        amount,
        available: true,
        isBest: false
      };
    });

    // Flag cheapest available cell per row
    const availableCells = cells.filter((c) => c.available);
    if (availableCells.length > 0) {
      const minPrice = Math.min(...availableCells.map((c) => c.unitPrice));
      cells.forEach((c) => {
        if (c.available && c.unitPrice === minPrice) c.isBest = true;
      });
    }

    return {
      prLineItemId: item.id,
      costCodeId: item.costCodeId,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      cells
    };
  });

  // Per-supplier total only counts rows the supplier *did* quote
  const totals = suppliers.map((supplierId) => {
    let total = 0;
    let fullyQuoted = true;
    for (const row of rows) {
      const cell = row.cells.find((c) => c.supplierId === supplierId);
      if (cell?.available) total += cell.amount;
      else fullyQuoted = false;
    }
    return { supplierId, total, fullyQuoted };
  });

  // Best total = lowest total among suppliers who quoted every line; fall
  // back to lowest total among partial quoters when none are complete.
  const fullyQuoted = totals.filter((t) => t.fullyQuoted);
  const candidatePool = fullyQuoted.length > 0 ? fullyQuoted : totals.filter((t) => t.total > 0);
  let bestTotalSupplierId = "";
  if (candidatePool.length > 0) {
    const bestEntry = candidatePool.reduce((best, t) => (t.total < best.total ? t : best));
    bestTotalSupplierId = bestEntry.supplierId;
  }

  return {
    rows,
    suppliers,
    totals: totals.map(({ supplierId, total }) => ({
      supplierId,
      total,
      isBest: supplierId === bestTotalSupplierId
    })),
    bestTotalSupplierId
  };
}

// ----------------------------------------------------------------------------
// Award flow
// ----------------------------------------------------------------------------

export type AwardReason =
  | "lowest_price"
  | "best_payment_terms"
  | "fastest_delivery"
  | "preferred_vendor"
  | "other";

export const awardReasonCopy: Record<AwardReason, { th: string; en: string }> = {
  lowest_price: { th: "ราคาต่ำที่สุด", en: "Lowest price" },
  best_payment_terms: { th: "เครดิตเทอมดีที่สุด", en: "Best payment terms" },
  fastest_delivery: { th: "ส่งเร็วที่สุด", en: "Fastest delivery" },
  preferred_vendor: { th: "เป็น vendor หลัก", en: "Preferred vendor" },
  other: { th: "อื่นๆ", en: "Other" }
};

export type AwardResult = {
  rfq: RFQ;
  pr: PurchaseRequest;
  /**
   * Price history entries the caller should append to SupplierState.
   * Caller decides whether to call `addPriceHistoryEntry` for each (we
   * stop short of mutating SupplierState directly so the procurement
   * module stays free of supplier-storage side effects).
   */
  priceHistoryAppendages: Array<{
    workspaceId: string;
    supplierId: string;
    costCodeId: string;
    itemDescription: string;
    unitPrice: number;
    unit: string;
    quantity: number;
    totalAmount: number;
    quotedAt: string;
    sourceType: "rfq";
    sourceDocumentId: string;
    note: string;
  }>;
};

/**
 * Award an RFQ to a supplier. Validates that the supplier was invited and
 * responded. Returns the updated RFQ + updated PR + price history entries
 * the caller should append to the supplier directory.
 *
 * Side effects (caller-owned):
 *   - call `upsertRFQ(rfqState, result.rfq)`
 *   - call `upsertPR(prState, result.pr)`
 *   - call `addPriceHistoryEntry(supplierState, entry)` for each in `priceHistoryAppendages`
 */
export function awardRFQ(
  rfq: RFQ,
  pr: PurchaseRequest,
  awardedSupplierId: string,
  awardReason: string
): AwardResult {
  if (rfq.status === "awarded" || rfq.status === "cancelled") {
    throw new Error(`cannot award ${rfq.status} RFQ`);
  }
  if (!rfq.invitedSupplierIds.includes(awardedSupplierId)) {
    throw new Error("awarded supplier was not invited to this RFQ");
  }
  const response = rfq.responses.find((r) => r.supplierId === awardedSupplierId);
  if (!response) {
    throw new Error("no response recorded from awarded supplier");
  }
  if (!awardReason.trim()) {
    throw new Error("award reason required");
  }
  if (pr.id !== rfq.prId) {
    throw new Error("PR id does not match RFQ.prId");
  }

  const now = new Date().toISOString();
  const updatedRfq: RFQ = normalizeRFQ({
    ...rfq,
    status: transitionRFQStatus(rfq.status, "award", {
      awardedSupplierId,
      awardReason
    }),
    awardedSupplierId,
    awardedAt: now,
    awardReason,
    updatedAt: now
  });

  const prAfterAward = applyPRAction(pr, "award", {
    awardedSupplierId,
    linkedRfqId: rfq.id
  });
  // Always stamp linkedRfqId on award — applyPRAction only stamps it on send_rfq
  const updatedPr = normalizePurchaseRequest({
    ...prAfterAward,
    linkedRfqId: rfq.id
  });

  // For each line item the awarded supplier quoted and was available, build
  // a price history entry the caller can persist to the supplier directory.
  const priceHistoryAppendages = response.itemQuotes
    .filter((q) => q.available && q.unitPrice > 0)
    .map((q) => {
      const prItem = pr.items.find((it) => it.id === q.prLineItemId);
      const quantity = prItem?.quantity ?? 0;
      const unit = prItem?.unit ?? "";
      const totalAmount = q.amount > 0 ? q.amount : q.unitPrice * quantity;
      return {
        workspaceId: rfq.workspaceId,
        supplierId: awardedSupplierId,
        costCodeId: q.costCodeId || prItem?.costCodeId || "",
        itemDescription: q.description || prItem?.description || "",
        unitPrice: q.unitPrice,
        unit,
        quantity,
        totalAmount,
        quotedAt: response.receivedAt.slice(0, 10),
        sourceType: "rfq" as const,
        sourceDocumentId: rfq.id,
        note: `Awarded via ${updatedRfq.rfqNo}`
      };
    });

  return { rfq: updatedRfq, pr: updatedPr, priceHistoryAppendages };
}

// ----------------------------------------------------------------------------
// RFQ queries
// ----------------------------------------------------------------------------

export function filterRFQs(
  state: RFQState,
  opts: {
    status?: RFQStatus | "all";
    projectId?: string | "all";
    prId?: string;
    search?: string;
  } = {}
): RFQ[] {
  const search = (opts.search ?? "").trim().toLowerCase();
  return state.rfqs.filter((rfq) => {
    if (opts.status && opts.status !== "all" && rfq.status !== opts.status) return false;
    if (opts.projectId && opts.projectId !== "all" && rfq.projectId !== opts.projectId) {
      return false;
    }
    if (opts.prId && rfq.prId !== opts.prId) return false;
    if (search) {
      const haystack = `${rfq.rfqNo} ${rfq.awardReason}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

export type RFQSummary = {
  total: number;
  byStatus: Record<RFQStatus, number>;
  pendingResponse: number; // sent + partial_response
  awarded: number;
};

export function summarizeRFQs(state: RFQState): RFQSummary {
  const byStatus: Record<RFQStatus, number> = {
    draft: 0,
    sent: 0,
    partial_response: 0,
    responses_complete: 0,
    awarded: 0,
    cancelled: 0
  };
  for (const rfq of state.rfqs) byStatus[rfq.status] += 1;
  return {
    total: state.rfqs.length,
    byStatus,
    pendingResponse: byStatus.sent + byStatus.partial_response,
    awarded: byStatus.awarded
  };
}
