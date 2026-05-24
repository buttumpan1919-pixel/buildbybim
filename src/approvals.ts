import { appendAuditEntry } from "./membership";
import type { CashflowEntry } from "./cashflow";
import type { PurchaseRequest } from "./procurement";
import type { StoredDocument } from "./storage";
import { defaultStorageAdapter, readJson, writeJson } from "./storageAdapter";

export const APPROVALS_STORAGE_KEY = "approvals.requests.v1";

export type ApprovalTargetType =
  | "pr"
  | "rfq_award"
  | "po"
  | "cashflow_entry"
  | "invoice"
  | "budget_override";

export type ApprovalStatus = "draft" | "submitted" | "approved" | "rejected" | "cancelled";
export type ApprovalPriority = "normal" | "high" | "urgent";
export type ApprovalAction = "submit" | "approve" | "reject" | "cancel";
export type ApprovalEventAction = "created" | "submitted" | "approved" | "rejected" | "cancelled" | "synced";

export type ApprovalActor = {
  actorId: string;
  actorName: string;
};

export type ApprovalEvent = {
  id: string;
  action: ApprovalEventAction;
  actorId: string;
  actorName: string;
  fromStatus: ApprovalStatus;
  toStatus: ApprovalStatus;
  reason: string;
  createdAt: string;
};

export type ApprovalRequest = {
  id: string;
  workspaceId: string;
  targetType: ApprovalTargetType;
  targetId: string;
  sourceAppId: string;
  projectId: string;
  costCodeId: string;
  supplierId: string;
  targetLabel: string;
  amount: number;
  currency: string;
  status: ApprovalStatus;
  priority: ApprovalPriority;
  requestedBy: string;
  requestedByName: string;
  approverId: string;
  approverName: string;
  reason: string;
  note: string;
  metadata: Record<string, string | number | boolean>;
  submittedAt: string;
  decidedAt: string;
  createdAt: string;
  updatedAt: string;
  events: ApprovalEvent[];
};

export type ApprovalState = {
  requests: ApprovalRequest[];
  updatedAt: string;
};

type ApprovalStateInput = {
  requests?: Partial<ApprovalRequest>[];
  updatedAt?: string;
};

const TARGET_TYPES = new Set<ApprovalTargetType>([
  "pr",
  "rfq_award",
  "po",
  "cashflow_entry",
  "invoice",
  "budget_override"
]);

const STATUSES = new Set<ApprovalStatus>([
  "draft",
  "submitted",
  "approved",
  "rejected",
  "cancelled"
]);

const PRIORITIES = new Set<ApprovalPriority>(["normal", "high", "urgent"]);

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix: string, index = 0) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now().toString(36)}-${index}-${Math.random().toString(16).slice(2)}`;
}

function normalizeString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizeAmount(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
}

function normalizeTargetType(value: unknown): ApprovalTargetType {
  return typeof value === "string" && TARGET_TYPES.has(value as ApprovalTargetType)
    ? (value as ApprovalTargetType)
    : "pr";
}

function normalizeStatus(value: unknown): ApprovalStatus {
  return typeof value === "string" && STATUSES.has(value as ApprovalStatus)
    ? (value as ApprovalStatus)
    : "draft";
}

function normalizePriority(value: unknown): ApprovalPriority {
  return typeof value === "string" && PRIORITIES.has(value as ApprovalPriority)
    ? (value as ApprovalPriority)
    : "normal";
}

function normalizeMetadata(value: unknown): Record<string, string | number | boolean> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, string | number | boolean>>(
    (metadata, [key, raw]) => {
      if (!key) return metadata;
      if (typeof raw === "string" || typeof raw === "number" || typeof raw === "boolean") {
        metadata[key] = raw;
      }
      return metadata;
    },
    {}
  );
}

function normalizeEventAction(value: unknown): ApprovalEventAction {
  return value === "submitted" ||
    value === "approved" ||
    value === "rejected" ||
    value === "cancelled" ||
    value === "synced"
    ? value
    : "created";
}

export function getApprovalTargetKey(targetType: ApprovalTargetType, targetId: string) {
  return `${targetType}:${targetId.trim()}`;
}

function normalizeApprovalEvent(event: Partial<ApprovalEvent>, index = 0): ApprovalEvent {
  const toStatus = normalizeStatus(event.toStatus);
  return {
    id: normalizeString(event.id) || createId("approval-event", index),
    action: normalizeEventAction(event.action),
    actorId: normalizeString(event.actorId),
    actorName: normalizeString(event.actorName),
    fromStatus: normalizeStatus(event.fromStatus),
    toStatus,
    reason: normalizeString(event.reason),
    createdAt: normalizeString(event.createdAt) || nowIso()
  };
}

export function normalizeApprovalRequest(input: Partial<ApprovalRequest>, index = 0): ApprovalRequest {
  const now = nowIso();
  const status = normalizeStatus(input.status);
  const targetType = normalizeTargetType(input.targetType);
  const targetId = normalizeString(input.targetId);
  const fallbackId = targetId ? `approval-${getApprovalTargetKey(targetType, targetId)}` : createId("approval", index);
  return {
    id: normalizeString(input.id) || fallbackId,
    workspaceId: normalizeString(input.workspaceId) || "local-workspace",
    targetType,
    targetId,
    sourceAppId: normalizeString(input.sourceAppId),
    projectId: normalizeString(input.projectId),
    costCodeId: normalizeString(input.costCodeId),
    supplierId: normalizeString(input.supplierId),
    targetLabel: normalizeString(input.targetLabel) || `${targetType} ${targetId}`,
    amount: normalizeAmount(input.amount),
    currency: normalizeString(input.currency) || "THB",
    status,
    priority: normalizePriority(input.priority),
    requestedBy: normalizeString(input.requestedBy),
    requestedByName: normalizeString(input.requestedByName),
    approverId: normalizeString(input.approverId),
    approverName: normalizeString(input.approverName),
    reason: normalizeString(input.reason),
    note: normalizeString(input.note),
    metadata: normalizeMetadata(input.metadata),
    submittedAt: normalizeString(input.submittedAt),
    decidedAt: normalizeString(input.decidedAt),
    createdAt: normalizeString(input.createdAt) || now,
    updatedAt: normalizeString(input.updatedAt) || now,
    events: Array.isArray(input.events)
      ? input.events.map((event, eventIndex) => normalizeApprovalEvent(event ?? {}, eventIndex))
      : []
  };
}

export function normalizeApprovalState(input: unknown): ApprovalState {
  if (Array.isArray(input)) {
    return {
      requests: input.map((request, index) =>
        normalizeApprovalRequest((request ?? {}) as Partial<ApprovalRequest>, index)
      ),
      updatedAt: nowIso()
    };
  }

  if (input && typeof input === "object") {
    const state = input as ApprovalStateInput;
    return {
      requests: Array.isArray(state.requests)
        ? state.requests.map((request, index) =>
            normalizeApprovalRequest((request ?? {}) as Partial<ApprovalRequest>, index)
          )
        : [],
      updatedAt: normalizeString(state.updatedAt) || nowIso()
    };
  }

  return { requests: [], updatedAt: "" };
}

export function loadApprovalState(): ApprovalState {
  return readJson<ApprovalState>(
    defaultStorageAdapter,
    APPROVALS_STORAGE_KEY,
    { requests: [], updatedAt: "" },
    (raw) => normalizeApprovalState(raw)
  );
}

export function saveApprovalState(state: ApprovalState): void {
  writeJson(defaultStorageAdapter, APPROVALS_STORAGE_KEY, normalizeApprovalState(state));
}

export function createApprovalRequest(input: Partial<ApprovalRequest> = {}): ApprovalRequest {
  const now = nowIso();
  const request = normalizeApprovalRequest({
    ...input,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now
  });

  if (request.events.length > 0) {
    return request;
  }

  return normalizeApprovalRequest({
    ...request,
    events: [
      {
        id: createId("approval-event"),
        action: request.status === "submitted" ? "submitted" : "created",
        actorId: request.requestedBy,
        actorName: request.requestedByName,
        fromStatus: "draft",
        toStatus: request.status,
        reason: request.reason,
        createdAt: request.submittedAt || now
      }
    ]
  });
}

export function upsertApprovalRequest(
  state: ApprovalState,
  request: Partial<ApprovalRequest>
): ApprovalState {
  const now = nowIso();
  const normalized = normalizeApprovalRequest({
    ...request,
    updatedAt: now
  });
  const base = normalizeApprovalState(state);
  const exists = base.requests.some((item) => item.id === normalized.id);

  return normalizeApprovalState({
    requests: exists
      ? base.requests.map((item) => (item.id === normalized.id ? normalized : item))
      : [normalized, ...base.requests],
    updatedAt: now
  });
}

function eventForTransition(
  request: ApprovalRequest,
  action: ApprovalEventAction,
  toStatus: ApprovalStatus,
  actor: ApprovalActor,
  reason = ""
): ApprovalEvent {
  return normalizeApprovalEvent({
    action,
    actorId: actor.actorId,
    actorName: actor.actorName,
    fromStatus: request.status,
    toStatus,
    reason,
    createdAt: nowIso()
  });
}

export function transitionApprovalRequest(
  request: ApprovalRequest,
  action: ApprovalAction,
  actor: ApprovalActor,
  opts: { reason?: string } = {}
): ApprovalRequest {
  const base = normalizeApprovalRequest(request);
  const reason = normalizeString(opts.reason);
  const actorId = normalizeString(actor.actorId);
  const actorName = normalizeString(actor.actorName);

  if (action === "submit") {
    if (base.status !== "draft") throw new Error("approval can only be submitted from draft");
    const event = eventForTransition(base, "submitted", "submitted", { actorId, actorName }, reason);
    return normalizeApprovalRequest({
      ...base,
      status: "submitted",
      requestedBy: actorId || base.requestedBy,
      requestedByName: actorName || base.requestedByName,
      submittedAt: event.createdAt,
      updatedAt: event.createdAt,
      events: [event, ...base.events]
    });
  }

  if (action === "approve") {
    if (base.status !== "submitted") throw new Error("approval can only be approved from submitted");
    if (!actorId && !actorName) throw new Error("approver required");
    const event = eventForTransition(base, "approved", "approved", { actorId, actorName }, reason);
    return normalizeApprovalRequest({
      ...base,
      status: "approved",
      approverId: actorId,
      approverName: actorName,
      decidedAt: event.createdAt,
      updatedAt: event.createdAt,
      events: [event, ...base.events]
    });
  }

  if (action === "reject") {
    if (base.status !== "submitted") throw new Error("approval can only be rejected from submitted");
    if (!reason) throw new Error("reject reason required");
    const event = eventForTransition(base, "rejected", "rejected", { actorId, actorName }, reason);
    return normalizeApprovalRequest({
      ...base,
      status: "rejected",
      approverId: actorId,
      approverName: actorName,
      reason,
      decidedAt: event.createdAt,
      updatedAt: event.createdAt,
      events: [event, ...base.events]
    });
  }

  if (base.status !== "draft" && base.status !== "submitted") {
    throw new Error("approval can only be cancelled before a decision");
  }
  const event = eventForTransition(base, "cancelled", "cancelled", { actorId, actorName }, reason);
  return normalizeApprovalRequest({
    ...base,
    status: "cancelled",
    reason,
    decidedAt: event.createdAt,
    updatedAt: event.createdAt,
    events: [event, ...base.events]
  });
}

export function appendApprovalAudit(request: ApprovalRequest, event: ApprovalEvent): void {
  appendAuditEntry({
    action: `approval.${event.action}`,
    actorType: "user",
    actorId: event.actorId,
    targetType: request.targetType,
    targetId: request.targetId,
    payload: {
      approvalRequestId: request.id,
      workspaceId: request.workspaceId,
      projectId: request.projectId,
      sourceAppId: request.sourceAppId,
      amount: request.amount,
      currency: request.currency,
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      reason: event.reason
    }
  });
}

export function applyApprovalAction(
  state: ApprovalState,
  id: string,
  action: ApprovalAction,
  actor: ApprovalActor,
  opts: { reason?: string; writeAudit?: boolean } = {}
): { state: ApprovalState; request: ApprovalRequest; event: ApprovalEvent } {
  const base = normalizeApprovalState(state);
  const request = base.requests.find((item) => item.id === id);
  if (!request) throw new Error("approval request not found");

  const nextRequest = transitionApprovalRequest(request, action, actor, { reason: opts.reason });
  const event = nextRequest.events[0];
  const nextState = upsertApprovalRequest(base, nextRequest);

  if (opts.writeAudit !== false) {
    appendApprovalAudit(nextRequest, event);
  }

  return { state: nextState, request: nextRequest, event };
}

export function buildApprovalRequestFromPR(pr: PurchaseRequest): ApprovalRequest {
  const submittedAt = pr.status === "submitted" ? pr.updatedAt || pr.createdAt : "";
  return createApprovalRequest({
    id: `approval-pr-${pr.id}`,
    workspaceId: pr.workspaceId || "local-workspace",
    targetType: "pr",
    targetId: pr.id,
    sourceAppId: "procurement",
    projectId: pr.projectId,
    targetLabel: pr.prNo || "Purchase Request",
    amount: pr.totalAmount,
    status: pr.status === "submitted" ? "submitted" : pr.status === "approved" ? "approved" : pr.status === "rejected" ? "rejected" : "draft",
    priority: pr.totalAmount >= 500000 ? "urgent" : pr.totalAmount >= 100000 ? "high" : "normal",
    requestedBy: pr.requestedBy,
    requestedByName: pr.requestedBy || "Requester",
    approverId: pr.approvedBy,
    approverName: pr.approvedBy,
    reason: pr.rejectedReason,
    submittedAt,
    decidedAt: pr.status === "approved" || pr.status === "rejected" ? pr.updatedAt : "",
    metadata: {
      prNo: pr.prNo,
      sourceStatus: pr.status,
      itemCount: pr.items.length,
      neededByDate: pr.neededByDate
    }
  });
}

export function buildApprovalRequestFromCashflow(entry: CashflowEntry): ApprovalRequest {
  return createApprovalRequest({
    id: `approval-cashflow-${entry.id}`,
    workspaceId: "local-workspace",
    targetType: "cashflow_entry",
    targetId: entry.id,
    sourceAppId: "cashflow",
    projectId: entry.projectId,
    costCodeId: entry.costCodeId,
    supplierId: entry.supplierId,
    targetLabel: entry.description || `${entry.direction} ${entry.category}`,
    amount: entry.amount,
    status: entry.status === "draft" ? "submitted" : entry.status === "confirmed" ? "approved" : "cancelled",
    priority: entry.amount >= 500000 ? "urgent" : entry.amount >= 100000 ? "high" : "normal",
    submittedAt: entry.updatedAt || entry.createdAt,
    decidedAt: entry.status === "confirmed" || entry.status === "void" ? entry.updatedAt : "",
    metadata: {
      sourceStatus: entry.status,
      direction: entry.direction,
      category: entry.category,
      entryDate: entry.entryDate,
      sourceType: entry.sourceType
    }
  });
}

export function buildApprovalRequestFromDocument(document: StoredDocument): ApprovalRequest | null {
  const targetType =
    document.docType === "purchaseOrder"
      ? "po"
      : document.docType === "invoice"
        ? "invoice"
        : null;
  if (!targetType) return null;
  const status =
    document.documentStatus === "sent"
      ? "submitted"
      : document.documentStatus === "approved" || document.documentStatus === "paid"
        ? "approved"
        : document.documentStatus === "cancelled"
          ? "cancelled"
          : "draft";
  const requestedByName =
    document.documentInfo.signerName ||
    document.documentInfo.companyName ||
    "BuildDocs User";

  return createApprovalRequest({
    id: `approval-${targetType}-${document.id}`,
    workspaceId: "local-workspace",
    targetType,
    targetId: document.id,
    sourceAppId: "builddocs",
    projectId: document.documentInfo.projectName,
    targetLabel: document.title || document.documentInfo.documentNo,
    amount: document.total,
    status,
    priority: document.total >= 500000 ? "urgent" : document.total >= 100000 ? "high" : "normal",
    requestedBy: requestedByName,
    requestedByName,
    submittedAt: status === "submitted" ? document.updatedAt || document.savedAt || "" : "",
    decidedAt: status === "approved" || status === "cancelled" ? document.updatedAt || document.savedAt || "" : "",
    metadata: {
      documentNo: document.documentInfo.documentNo,
      documentStatus: document.documentStatus,
      docType: document.docType,
      contractNo: document.documentInfo.contractNo
    }
  });
}

function mergeSyncedRequest(current: ApprovalRequest | undefined, incoming: ApprovalRequest): ApprovalRequest {
  if (!current) return incoming;
  if (current.status === "approved" || current.status === "rejected" || current.status === "cancelled") {
    return normalizeApprovalRequest({
      ...current,
      amount: incoming.amount,
      targetLabel: incoming.targetLabel,
      metadata: { ...current.metadata, ...incoming.metadata },
      updatedAt: nowIso()
    });
  }

  return normalizeApprovalRequest({
    ...current,
    status: incoming.status,
    amount: incoming.amount,
    priority: incoming.priority,
    targetLabel: incoming.targetLabel,
    projectId: incoming.projectId,
    costCodeId: incoming.costCodeId,
    supplierId: incoming.supplierId,
    metadata: { ...current.metadata, ...incoming.metadata },
    submittedAt: incoming.submittedAt || current.submittedAt,
    decidedAt: incoming.decidedAt || current.decidedAt,
    updatedAt: nowIso()
  });
}

export function syncApprovalRequestsFromPRs(
  state: ApprovalState,
  prs: PurchaseRequest[]
): ApprovalState {
  let next = normalizeApprovalState(state);
  const existingById = new Map(next.requests.map((request) => [request.id, request]));

  for (const pr of prs) {
    if (pr.status !== "submitted" && pr.status !== "approved" && pr.status !== "rejected") {
      continue;
    }
    const incoming = buildApprovalRequestFromPR(pr);
    next = upsertApprovalRequest(next, mergeSyncedRequest(existingById.get(incoming.id), incoming));
    existingById.set(incoming.id, incoming);
  }

  return next;
}

export function syncApprovalRequestsFromCashflow(
  state: ApprovalState,
  entries: CashflowEntry[]
): ApprovalState {
  let next = normalizeApprovalState(state);
  const existingById = new Map(next.requests.map((request) => [request.id, request]));

  for (const entry of entries) {
    if (entry.status !== "draft" && entry.status !== "confirmed" && entry.status !== "void") {
      continue;
    }
    if (entry.status === "confirmed" && !existingById.has(`approval-cashflow-${entry.id}`)) {
      continue;
    }
    if (entry.status === "void" && !existingById.has(`approval-cashflow-${entry.id}`)) {
      continue;
    }
    const incoming = buildApprovalRequestFromCashflow(entry);
    next = upsertApprovalRequest(next, mergeSyncedRequest(existingById.get(incoming.id), incoming));
    existingById.set(incoming.id, incoming);
  }

  return next;
}

export function syncApprovalRequestsFromDocuments(
  state: ApprovalState,
  documents: StoredDocument[]
): ApprovalState {
  let next = normalizeApprovalState(state);
  const existingById = new Map(next.requests.map((request) => [request.id, request]));

  for (const document of documents) {
    const incoming = buildApprovalRequestFromDocument(document);
    if (!incoming) continue;
    if (
      document.documentStatus !== "sent" &&
      document.documentStatus !== "approved" &&
      document.documentStatus !== "paid" &&
      document.documentStatus !== "cancelled"
    ) {
      continue;
    }
    if (incoming.status !== "submitted" && !existingById.has(incoming.id)) {
      continue;
    }
    next = upsertApprovalRequest(next, mergeSyncedRequest(existingById.get(incoming.id), incoming));
    existingById.set(incoming.id, incoming);
  }

  return next;
}

export function filterApprovalRequests(
  state: ApprovalState,
  opts: {
    status?: ApprovalStatus | "all";
    targetType?: ApprovalTargetType | "all";
    projectId?: string | "all";
    search?: string;
  } = {}
): ApprovalRequest[] {
  const normalized = normalizeApprovalState(state);
  const search = normalizeString(opts.search).toLowerCase();

  return normalized.requests.filter((request) => {
    if (opts.status && opts.status !== "all" && request.status !== opts.status) return false;
    if (opts.targetType && opts.targetType !== "all" && request.targetType !== opts.targetType) {
      return false;
    }
    if (opts.projectId && opts.projectId !== "all" && request.projectId !== opts.projectId) {
      return false;
    }
    if (search) {
      const haystack = `${request.targetLabel} ${request.targetType} ${request.metadata.prNo ?? ""}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

export type ApprovalSummary = {
  total: number;
  submitted: number;
  approved: number;
  rejected: number;
  cancelled: number;
  urgent: number;
  pendingAmount: number;
};

export function summarizeApprovals(state: ApprovalState): ApprovalSummary {
  const normalized = normalizeApprovalState(state);
  return normalized.requests.reduce<ApprovalSummary>(
    (summary, request) => {
      summary.total += 1;
      if (request.status === "submitted") {
        summary.submitted += 1;
        summary.pendingAmount += request.amount;
      }
      if (request.status === "approved") summary.approved += 1;
      if (request.status === "rejected") summary.rejected += 1;
      if (request.status === "cancelled") summary.cancelled += 1;
      if (request.priority === "urgent" && request.status === "submitted") summary.urgent += 1;
      return summary;
    },
    {
      total: 0,
      submitted: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
      urgent: 0,
      pendingAmount: 0
    }
  );
}
