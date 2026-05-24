// Relational mapper — Sprint 10B (mobile/multi-device sync foundation)
//
// Converts local TS state (snake_case-free, camelCase) ↔ Supabase row
// (snake_case, nullable timestamps) for the 3 core entities that drive
// the ERP loop:
//   - projects        (Sprint 0)
//   - cashflow_entries (Sprint 5)
//   - purchase_requests + pr_line_items (Sprint 3)
//
// Why these 3 first: they're the entities that change *most often* on
// site → office handoffs. Cost Codes, Suppliers, Evidence rows change
// rarely; KV store sync via `SupabaseAdapter` is good enough for them
// until v0.5.
//
// Pure functions only. Caller (UI) decides when to push/pull. No imports
// of supabase-js here — that lives in `src/supabase.sync.ts` (next round).

import { createProject, type Project } from "./projects";
import { normalizeCashflowState, type CashflowEntry } from "./cashflow";
import {
  normalizePRLineItem,
  normalizePurchaseRequest,
  type PRLineItem,
  type PurchaseRequest
} from "./procurement";

// ----------------------------------------------------------------------------
// Project ⇄ projects row
// ----------------------------------------------------------------------------

export type ProjectRow = {
  id: string;
  workspace_id: string;
  code: string;
  name: string;
  client_id: string | null;
  client_name: string;
  customer_type: string | null;
  contract_value: number;
  planned_cost: number;
  actual_cost: number;
  planned_revenue: number;
  actual_revenue: number;
  start_date: string | null;
  end_date: string | null;
  status: string;
  has_budget: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
};

function dateOrNull(value: string): string | null {
  return value && value.length > 0 ? value : null;
}

export function projectToRow(project: Project): ProjectRow {
  return {
    id: project.id,
    workspace_id: project.workspaceId,
    code: project.code,
    name: project.name,
    client_id: project.clientId ? project.clientId : null,
    client_name: project.clientName,
    customer_type: project.customerType ?? null,
    contract_value: project.contractValue,
    planned_cost: project.plannedCost,
    actual_cost: project.actualCost,
    planned_revenue: project.plannedRevenue,
    actual_revenue: project.actualRevenue,
    start_date: dateOrNull(project.startDate),
    end_date: dateOrNull(project.endDate),
    status: project.status,
    has_budget: project.hasBudget,
    notes: project.notes,
    created_at: project.createdAt,
    updated_at: project.updatedAt
  };
}

export function rowToProject(row: ProjectRow): Project {
  return createProject({
    id: row.id,
    workspaceId: row.workspace_id,
    code: row.code,
    name: row.name,
    clientId: row.client_id ?? "",
    clientName: row.client_name,
    customerType:
      row.customer_type === "individual" ||
      row.customer_type === "gov" ||
      row.customer_type === "corporate"
        ? row.customer_type
        : null,
    contractValue: Number(row.contract_value),
    plannedCost: Number(row.planned_cost),
    actualCost: Number(row.actual_cost),
    plannedRevenue: Number(row.planned_revenue),
    actualRevenue: Number(row.actual_revenue),
    startDate: row.start_date ?? "",
    endDate: row.end_date ?? "",
    status:
      row.status === "draft" ||
      row.status === "normal" ||
      row.status === "delayed" ||
      row.status === "closed" ||
      row.status === "cancelled"
        ? row.status
        : "draft",
    hasBudget: Boolean(row.has_budget),
    notes: row.notes ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  });
}

// ----------------------------------------------------------------------------
// CashflowEntry ⇄ cashflow_entries row
// ----------------------------------------------------------------------------

export type CashflowEntryRow = {
  id: string;
  workspace_id: string;
  project_id: string | null;
  document_id: string;
  direction: string;
  category: string;
  amount: number;
  description: string;
  entry_date: string;
  status: string;
  note: string;
  cost_code_id: string;
  supplier_id: string;
  pr_id: string;
  rfq_id: string;
  po_document_id: string;
  quantity_actual: number;
  unit_actual: string;
  recurring_template_id: string;
  source_type: string;
  source_document_id: string;
  created_at: string;
  updated_at: string;
};

export function cashflowEntryToRow(
  entry: CashflowEntry,
  workspaceId: string
): CashflowEntryRow {
  return {
    id: entry.id,
    workspace_id: workspaceId,
    project_id: entry.projectId ? entry.projectId : null,
    document_id: entry.documentId,
    direction: entry.direction,
    category: entry.category,
    amount: entry.amount,
    description: entry.description,
    entry_date: entry.entryDate,
    status: entry.status,
    note: entry.note,
    cost_code_id: entry.costCodeId,
    supplier_id: entry.supplierId,
    pr_id: entry.prId,
    rfq_id: entry.rfqId,
    po_document_id: entry.poDocumentId,
    quantity_actual: entry.quantityActual,
    unit_actual: entry.unitActual,
    recurring_template_id: entry.recurringTemplateId,
    source_type: entry.sourceType,
    source_document_id: entry.sourceDocumentId,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt
  };
}

export function rowToCashflowEntry(row: CashflowEntryRow): CashflowEntry {
  // Run through normalizeCashflowState with a 1-entry array so we reuse the
  // shared sanitization (direction/category/status fallbacks)
  const state = normalizeCashflowState({
    entries: [
      {
        id: row.id,
        direction: row.direction,
        category: row.category,
        amount: Number(row.amount),
        description: row.description,
        projectId: row.project_id ?? "",
        documentId: row.document_id,
        entryDate: row.entry_date,
        status: row.status,
        sourceType: row.source_type,
        sourceDocumentId: row.source_document_id,
        note: row.note,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        costCodeId: row.cost_code_id,
        supplierId: row.supplier_id,
        prId: row.pr_id,
        rfqId: row.rfq_id,
        poDocumentId: row.po_document_id,
        quantityActual: Number(row.quantity_actual),
        unitActual: row.unit_actual,
        recurringTemplateId: row.recurring_template_id
      }
    ]
  });
  return state.entries[0];
}

// ----------------------------------------------------------------------------
// PurchaseRequest ⇄ purchase_requests + pr_line_items rows
// ----------------------------------------------------------------------------

export type PurchaseRequestRow = {
  id: string;
  workspace_id: string;
  project_id: string;
  pr_no: string;
  requested_by: string | null;
  approved_by: string | null;
  rejected_reason: string;
  status: string;
  request_date: string;
  needed_by_date: string | null;
  notes: string;
  total_amount: number;
  linked_rfq_id: string;
  linked_po_document_id: string;
  created_at: string;
  updated_at: string;
};

export type PRLineItemRow = {
  id: string;
  pr_id: string;
  cost_code_id: string;
  description: string;
  quantity: number;
  unit: string;
  estimated_unit_price: number;
  amount: number;
  preferred_supplier_id: string;
  note: string;
};

export function purchaseRequestToRow(pr: PurchaseRequest): PurchaseRequestRow {
  return {
    id: pr.id,
    workspace_id: pr.workspaceId,
    project_id: pr.projectId,
    pr_no: pr.prNo,
    // requester/approver are workspace_member ids — stored as nullable text
    // until the auth/member relational link is wired in Sprint 10C
    requested_by: pr.requestedBy ? pr.requestedBy : null,
    approved_by: pr.approvedBy ? pr.approvedBy : null,
    rejected_reason: pr.rejectedReason,
    status: pr.status,
    request_date: pr.requestDate,
    needed_by_date: dateOrNull(pr.neededByDate),
    notes: pr.notes,
    total_amount: pr.totalAmount,
    linked_rfq_id: pr.linkedRfqId,
    linked_po_document_id: pr.linkedPoDocumentId,
    created_at: pr.createdAt,
    updated_at: pr.updatedAt
  };
}

export function prLineItemToRow(item: PRLineItem, prId: string): PRLineItemRow {
  return {
    id: item.id,
    pr_id: prId,
    cost_code_id: item.costCodeId,
    description: item.description,
    quantity: item.quantity,
    unit: item.unit,
    estimated_unit_price: item.estimatedUnitPrice,
    amount: item.amount,
    preferred_supplier_id: item.preferredSupplierId,
    note: item.note
  };
}

export function rowToPRLineItem(row: PRLineItemRow): PRLineItem {
  return normalizePRLineItem({
    id: row.id,
    costCodeId: row.cost_code_id,
    description: row.description,
    quantity: Number(row.quantity),
    unit: row.unit,
    estimatedUnitPrice: Number(row.estimated_unit_price),
    amount: Number(row.amount),
    preferredSupplierId: row.preferred_supplier_id,
    note: row.note
  });
}

export function rowToPurchaseRequest(
  row: PurchaseRequestRow,
  itemRows: PRLineItemRow[]
): PurchaseRequest {
  return normalizePurchaseRequest({
    id: row.id,
    workspaceId: row.workspace_id,
    projectId: row.project_id,
    prNo: row.pr_no,
    requestedBy: row.requested_by ?? "",
    approvedBy: row.approved_by ?? "",
    rejectedReason: row.rejected_reason,
    status:
      row.status === "draft" ||
      row.status === "submitted" ||
      row.status === "approved" ||
      row.status === "rejected" ||
      row.status === "rfq_sent" ||
      row.status === "awarded" ||
      row.status === "ordered" ||
      row.status === "received" ||
      row.status === "closed" ||
      row.status === "cancelled"
        ? row.status
        : "draft",
    requestDate: row.request_date,
    neededByDate: row.needed_by_date ?? "",
    notes: row.notes,
    items: itemRows.filter((it) => it.pr_id === row.id).map(rowToPRLineItem),
    linkedRfqId: row.linked_rfq_id,
    linkedPoDocumentId: row.linked_po_document_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  });
}

// ----------------------------------------------------------------------------
// Conflict resolution — last-write-wins by updated_at (v0.1)
//
// Returns the "winning" side based on which `updated_at` is more recent.
// Ties resolved by remote (treat cloud as source of truth when stamps
// match). Caller passes the pair as { local, remote } so the comparison
// is explicit.
// ----------------------------------------------------------------------------

export type ConflictPair<T> = {
  local: T | null;
  remote: T | null;
  localUpdatedAt: string;
  remoteUpdatedAt: string;
};

export type ConflictResolution<T> = {
  winner: T | null;
  reason: "local_newer" | "remote_newer" | "tied_remote_wins" | "local_only" | "remote_only" | "both_null";
};

export function resolveByUpdatedAt<T>(pair: ConflictPair<T>): ConflictResolution<T> {
  if (pair.local && !pair.remote) {
    return { winner: pair.local, reason: "local_only" };
  }
  if (!pair.local && pair.remote) {
    return { winner: pair.remote, reason: "remote_only" };
  }
  if (!pair.local && !pair.remote) {
    return { winner: null, reason: "both_null" };
  }
  if (pair.localUpdatedAt > pair.remoteUpdatedAt) {
    return { winner: pair.local, reason: "local_newer" };
  }
  if (pair.localUpdatedAt < pair.remoteUpdatedAt) {
    return { winner: pair.remote, reason: "remote_newer" };
  }
  // tie → trust remote
  return { winner: pair.remote, reason: "tied_remote_wins" };
}
