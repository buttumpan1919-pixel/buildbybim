import { describe, expect, it } from "vitest";
import {
  cashflowEntryToRow,
  prLineItemToRow,
  projectToRow,
  purchaseRequestToRow,
  resolveByUpdatedAt,
  rowToCashflowEntry,
  rowToPRLineItem,
  rowToProject,
  rowToPurchaseRequest,
  type CashflowEntryRow,
  type PurchaseRequestRow,
  type PRLineItemRow,
  type ProjectRow
} from "./relationalMapper";
import { createProject } from "./projects";
import { upsertCashflowEntry } from "./cashflow";
import {
  normalizePRLineItem,
  normalizePurchaseRequest
} from "./procurement";

describe("Project ⇄ row", () => {
  it("round-trips a complete project", () => {
    const project = createProject({
      id: "p-1",
      workspaceId: "ws-1",
      code: "j-2601",
      name: "Test project",
      clientId: "c-1",
      clientName: "Khun A",
      customerType: "individual",
      contractValue: 1_500_000,
      plannedCost: 1_200_000,
      actualCost: 350_000,
      plannedRevenue: 1_500_000,
      actualRevenue: 200_000,
      startDate: "2026-01-15",
      endDate: "2026-08-30",
      status: "normal",
      hasBudget: true,
      notes: "Test notes"
    });
    const row = projectToRow(project);
    const back = rowToProject(row);
    expect(back.id).toBe(project.id);
    expect(back.code).toBe(project.code);
    expect(back.clientId).toBe(project.clientId);
    expect(back.customerType).toBe(project.customerType);
    expect(back.contractValue).toBe(project.contractValue);
    expect(back.status).toBe(project.status);
    expect(back.hasBudget).toBe(project.hasBudget);
  });

  it("maps empty clientId to null and back to empty string", () => {
    const project = createProject({
      workspaceId: "ws-1",
      code: "j-internal",
      name: "Internal office work",
      clientId: ""
    });
    const row = projectToRow(project);
    expect(row.client_id).toBeNull();
    const back = rowToProject(row);
    expect(back.clientId).toBe("");
  });

  it("preserves customerType=null for internal projects", () => {
    const project = createProject({
      workspaceId: "ws-1",
      code: "j-int",
      name: "Internal",
      customerType: null
    });
    const row = projectToRow(project);
    expect(row.customer_type).toBeNull();
    expect(rowToProject(row).customerType).toBeNull();
  });

  it("defaults invalid status from row to draft", () => {
    const row: ProjectRow = {
      id: "p-bad",
      workspace_id: "ws-1",
      code: "j-bad",
      name: "bad status",
      client_id: null,
      client_name: "",
      customer_type: null,
      contract_value: 0,
      planned_cost: 0,
      actual_cost: 0,
      planned_revenue: 0,
      actual_revenue: 0,
      start_date: null,
      end_date: null,
      status: "garbage",
      has_budget: false,
      notes: "",
      created_at: "2026-05-25T00:00:00.000Z",
      updated_at: "2026-05-25T00:00:00.000Z"
    };
    expect(rowToProject(row).status).toBe("draft");
  });
});

describe("CashflowEntry ⇄ row", () => {
  it("round-trips with all Sprint 5 fields", () => {
    const state = upsertCashflowEntry(
      { entries: [], updatedAt: "" },
      {
        id: "cf-1",
        direction: "expense",
        category: "material",
        amount: 1200,
        description: "Cement 50kg × 4",
        projectId: "p-1",
        documentId: "",
        entryDate: "2026-05-25",
        status: "confirmed",
        note: "",
        costCodeId: "01-100",
        supplierId: "s-1",
        prId: "",
        rfqId: "",
        poDocumentId: "",
        quantityActual: 4,
        unitActual: "ถุง",
        recurringTemplateId: ""
      }
    );
    const entry = state.entries[0];
    const row = cashflowEntryToRow(entry, "ws-1");
    expect(row.workspace_id).toBe("ws-1");
    expect(row.project_id).toBe("p-1");
    expect(row.cost_code_id).toBe("01-100");
    expect(row.supplier_id).toBe("s-1");
    expect(row.quantity_actual).toBe(4);
    const back = rowToCashflowEntry(row);
    expect(back.id).toBe(entry.id);
    expect(back.amount).toBe(entry.amount);
    expect(back.status).toBe(entry.status);
    expect(back.costCodeId).toBe(entry.costCodeId);
  });

  it("maps empty projectId to null in row", () => {
    const state = upsertCashflowEntry(
      { entries: [], updatedAt: "" },
      {
        id: "cf-2",
        direction: "expense",
        category: "office",
        amount: 100,
        status: "draft",
        projectId: "",
        entryDate: "2026-05-25"
      }
    );
    const row = cashflowEntryToRow(state.entries[0], "ws-1");
    expect(row.project_id).toBeNull();
    expect(rowToCashflowEntry(row).projectId).toBe("");
  });

  it("preserves sourceType when round-tripping", () => {
    const state = upsertCashflowEntry(
      { entries: [], updatedAt: "" },
      {
        id: "cf-pr",
        direction: "expense",
        category: "material",
        amount: 500,
        status: "draft",
        prId: "pr-1",
        sourceType: "pr",
        entryDate: "2026-05-25"
      }
    );
    const row = cashflowEntryToRow(state.entries[0], "ws-1");
    expect(row.source_type).toBe("pr");
    expect(rowToCashflowEntry(row).sourceType).toBe("pr");
  });
});

describe("PurchaseRequest ⇄ rows (PR + line items)", () => {
  it("round-trips PR + line items", () => {
    const pr = normalizePurchaseRequest({
      id: "pr-1",
      workspaceId: "ws-1",
      projectId: "p-1",
      prNo: "PR-2026-001",
      requestedBy: "user-1",
      approvedBy: "user-2",
      status: "approved",
      requestDate: "2026-05-25",
      neededByDate: "2026-06-15",
      notes: "Urgent",
      linkedRfqId: "rfq-1",
      linkedPoDocumentId: "po-1",
      items: [
        normalizePRLineItem({
          id: "pli-1",
          costCodeId: "01-100",
          description: "Cement",
          quantity: 10,
          unit: "ถุง",
          estimatedUnitPrice: 250,
          preferredSupplierId: "s-1"
        }),
        normalizePRLineItem({
          id: "pli-2",
          costCodeId: "02-200",
          description: "Rebar",
          quantity: 1,
          unit: "ตัน",
          estimatedUnitPrice: 26500
        })
      ]
    });
    const headRow = purchaseRequestToRow(pr);
    const itemRows = pr.items.map((item) => prLineItemToRow(item, pr.id));
    expect(headRow.workspace_id).toBe("ws-1");
    expect(headRow.pr_no).toBe("PR-2026-001");
    expect(headRow.linked_rfq_id).toBe("rfq-1");
    expect(headRow.needed_by_date).toBe("2026-06-15");
    expect(itemRows).toHaveLength(2);
    expect(itemRows[0].pr_id).toBe("pr-1");
    const back = rowToPurchaseRequest(headRow, itemRows);
    expect(back.id).toBe(pr.id);
    expect(back.status).toBe(pr.status);
    expect(back.items).toHaveLength(2);
    expect(back.items[0].costCodeId).toBe("01-100");
    expect(back.items[0].amount).toBe(2500);
    expect(back.items[1].amount).toBe(26500);
  });

  it("maps empty user fields (requested_by/approved_by) to null in row", () => {
    const pr = normalizePurchaseRequest({
      id: "pr-2",
      workspaceId: "ws-1",
      projectId: "p-1",
      prNo: "PR-2026-002",
      requestedBy: "",
      approvedBy: "",
      requestDate: "2026-05-25",
      neededByDate: "",
      items: [normalizePRLineItem({ costCodeId: "01", quantity: 1, unit: "x", estimatedUnitPrice: 100 })]
    });
    const row = purchaseRequestToRow(pr);
    expect(row.requested_by).toBeNull();
    expect(row.approved_by).toBeNull();
    expect(row.needed_by_date).toBeNull();
  });

  it("rowToPRLineItem auto-computes amount via normalizePRLineItem", () => {
    const row: PRLineItemRow = {
      id: "pli-x",
      pr_id: "pr-x",
      cost_code_id: "01",
      description: "x",
      quantity: 5,
      unit: "ตัน",
      estimated_unit_price: 100,
      amount: 0, // wrong on purpose — normalizer should re-derive
      preferred_supplier_id: "",
      note: ""
    };
    expect(rowToPRLineItem(row).amount).toBe(500);
  });

  it("rowToPurchaseRequest filters line items by pr_id (only attaches own items)", () => {
    const headRow: PurchaseRequestRow = {
      id: "pr-A",
      workspace_id: "ws-1",
      project_id: "p-1",
      pr_no: "PR-A",
      requested_by: null,
      approved_by: null,
      rejected_reason: "",
      status: "draft",
      request_date: "2026-05-25",
      needed_by_date: null,
      notes: "",
      total_amount: 0,
      linked_rfq_id: "",
      linked_po_document_id: "",
      created_at: "2026-05-25T00:00:00.000Z",
      updated_at: "2026-05-25T00:00:00.000Z"
    };
    const items: PRLineItemRow[] = [
      {
        id: "pli-1",
        pr_id: "pr-A",
        cost_code_id: "01",
        description: "mine",
        quantity: 1,
        unit: "x",
        estimated_unit_price: 100,
        amount: 100,
        preferred_supplier_id: "",
        note: ""
      },
      {
        id: "pli-other",
        pr_id: "pr-B",
        cost_code_id: "01",
        description: "someone else's",
        quantity: 1,
        unit: "x",
        estimated_unit_price: 999,
        amount: 999,
        preferred_supplier_id: "",
        note: ""
      }
    ];
    const back = rowToPurchaseRequest(headRow, items);
    expect(back.items).toHaveLength(1);
    expect(back.items[0].description).toBe("mine");
  });
});

describe("resolveByUpdatedAt", () => {
  it("returns local_only when remote is null", () => {
    const r = resolveByUpdatedAt({
      local: { id: "a" },
      remote: null,
      localUpdatedAt: "2026-05-25T00:00:00Z",
      remoteUpdatedAt: ""
    });
    expect(r.reason).toBe("local_only");
    expect(r.winner).toEqual({ id: "a" });
  });

  it("returns remote_only when local is null", () => {
    const r = resolveByUpdatedAt({
      local: null,
      remote: { id: "b" },
      localUpdatedAt: "",
      remoteUpdatedAt: "2026-05-25T00:00:00Z"
    });
    expect(r.reason).toBe("remote_only");
    expect(r.winner).toEqual({ id: "b" });
  });

  it("returns both_null when both are null", () => {
    const r = resolveByUpdatedAt({
      local: null,
      remote: null,
      localUpdatedAt: "",
      remoteUpdatedAt: ""
    });
    expect(r.reason).toBe("both_null");
    expect(r.winner).toBeNull();
  });

  it("returns local_newer when local timestamp is greater", () => {
    const r = resolveByUpdatedAt({
      local: { id: "L" },
      remote: { id: "R" },
      localUpdatedAt: "2026-05-25T12:00:00Z",
      remoteUpdatedAt: "2026-05-25T11:00:00Z"
    });
    expect(r.reason).toBe("local_newer");
    expect((r.winner as { id: string }).id).toBe("L");
  });

  it("returns remote_newer when remote timestamp is greater", () => {
    const r = resolveByUpdatedAt({
      local: { id: "L" },
      remote: { id: "R" },
      localUpdatedAt: "2026-05-25T10:00:00Z",
      remoteUpdatedAt: "2026-05-25T11:00:00Z"
    });
    expect(r.reason).toBe("remote_newer");
    expect((r.winner as { id: string }).id).toBe("R");
  });

  it("returns tied_remote_wins when timestamps match", () => {
    const r = resolveByUpdatedAt({
      local: { id: "L" },
      remote: { id: "R" },
      localUpdatedAt: "2026-05-25T12:00:00Z",
      remoteUpdatedAt: "2026-05-25T12:00:00Z"
    });
    expect(r.reason).toBe("tied_remote_wins");
    expect((r.winner as { id: string }).id).toBe("R");
  });
});
