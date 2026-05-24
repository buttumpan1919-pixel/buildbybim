import { beforeEach, describe, expect, it } from "vitest";
import {
  APPROVALS_STORAGE_KEY,
  applyApprovalAction,
  buildApprovalRequestFromCashflow,
  buildApprovalRequestFromDocument,
  buildApprovalRequestFromPR,
  createApprovalRequest,
  filterApprovalRequests,
  getApprovalTargetKey,
  loadApprovalState,
  normalizeApprovalRequest,
  normalizeApprovalState,
  saveApprovalState,
  summarizeApprovals,
  syncApprovalRequestsFromCashflow,
  syncApprovalRequestsFromDocuments,
  syncApprovalRequestsFromPRs,
  transitionApprovalRequest,
  type ApprovalState
} from "./approvals";
import { upsertCashflowEntry, type CashflowEntry } from "./cashflow";
import { loadAuditState } from "./membership";
import { normalizePRLineItem, normalizePurchaseRequest, type PurchaseRequest } from "./procurement";
import { createBlankDocument, createPurchaseOrderDocument } from "./storage";

function resetStorage() {
  if (typeof window !== "undefined") {
    window.localStorage.clear();
  }
}

function makePR(overrides: Partial<PurchaseRequest> = {}): PurchaseRequest {
  return normalizePurchaseRequest({
    id: "pr-1",
    workspaceId: "ws-1",
    projectId: "project-1",
    prNo: "PR-2026-001",
    requestedBy: "site-user",
    status: "submitted",
    items: [
      normalizePRLineItem({
        costCodeId: "01-100",
        description: "Concrete",
        quantity: 5,
        unit: "m3",
        estimatedUnitPrice: 20000
      })
    ],
    ...overrides
  });
}

function makeCashflow(overrides: Partial<CashflowEntry> = {}): CashflowEntry {
  return upsertCashflowEntry(
    { entries: [], updatedAt: "" },
    {
      id: "cash-1",
      direction: "expense",
      category: "material",
      amount: 120000,
      description: "Cement payout",
      projectId: "project-1",
      costCodeId: "01-100",
      supplierId: "supplier-1",
      entryDate: "2026-05-24",
      status: "draft",
      sourceType: "manual",
      ...overrides
    }
  ).entries[0];
}

describe("approval storage", () => {
  beforeEach(resetStorage);

  it("uses namespaced storage key", () => {
    expect(APPROVALS_STORAGE_KEY).toBe("approvals.requests.v1");
  });

  it("loadApprovalState returns an empty state when storage is empty", () => {
    expect(loadApprovalState()).toEqual({ requests: [], updatedAt: "" });
  });

  it("saveApprovalState round-trips normalized requests", () => {
    saveApprovalState({
      requests: [createApprovalRequest({ targetType: "pr", targetId: "pr-99", targetLabel: "PR-99" })],
      updatedAt: "2026-05-24T00:00:00.000Z"
    });

    expect(loadApprovalState().requests[0].targetLabel).toBe("PR-99");
  });
});

describe("approval normalization", () => {
  it("builds a stable target key", () => {
    expect(getApprovalTargetKey("pr", " pr-1 ")).toBe("pr:pr-1");
  });

  it("creates a deterministic fallback id when targetId exists", () => {
    const request = normalizeApprovalRequest({ targetType: "pr", targetId: "pr-1" });
    expect(request.id).toBe("approval-pr:pr-1");
  });

  it("normalizes invalid raw state safely", () => {
    const state = normalizeApprovalState({
      requests: [
        {
          targetType: "unknown",
          targetId: "bad",
          status: "done",
          amount: -100,
          priority: "critical",
          metadata: { keep: true, drop: { nested: true } }
        }
      ]
    });

    expect(state.requests[0]).toMatchObject({
      targetType: "pr",
      status: "draft",
      amount: 0,
      priority: "normal",
      metadata: { keep: true }
    });
  });
});

describe("approval state machine", () => {
  beforeEach(resetStorage);

  it("moves draft to submitted with requester stamps", () => {
    const draft = createApprovalRequest({ targetType: "pr", targetId: "pr-1" });
    const submitted = transitionApprovalRequest(draft, "submit", {
      actorId: "u-1",
      actorName: "Requester"
    });

    expect(submitted.status).toBe("submitted");
    expect(submitted.requestedBy).toBe("u-1");
    expect(submitted.events[0].action).toBe("submitted");
  });

  it("approves only submitted requests and requires an approver", () => {
    const submitted = createApprovalRequest({
      targetType: "pr",
      targetId: "pr-1",
      status: "submitted"
    });

    expect(() =>
      transitionApprovalRequest(submitted, "approve", { actorId: "", actorName: "" })
    ).toThrow(/approver/);

    const approved = transitionApprovalRequest(submitted, "approve", {
      actorId: "owner",
      actorName: "Owner"
    });
    expect(approved.status).toBe("approved");
    expect(approved.approverName).toBe("Owner");
  });

  it("rejects only with a reason", () => {
    const submitted = createApprovalRequest({
      targetType: "cashflow_entry",
      targetId: "cash-1",
      status: "submitted"
    });

    expect(() =>
      transitionApprovalRequest(submitted, "reject", { actorId: "owner", actorName: "Owner" })
    ).toThrow(/reason/);

    const rejected = transitionApprovalRequest(
      submitted,
      "reject",
      { actorId: "owner", actorName: "Owner" },
      { reason: "over budget" }
    );
    expect(rejected.status).toBe("rejected");
    expect(rejected.reason).toBe("over budget");
  });

  it("applyApprovalAction updates state and writes audit by default", () => {
    const request = createApprovalRequest({
      id: "approval-1",
      targetType: "pr",
      targetId: "pr-1",
      sourceAppId: "procurement",
      status: "submitted",
      amount: 1000
    });
    const state: ApprovalState = { requests: [request], updatedAt: "" };

    const result = applyApprovalAction(state, "approval-1", "approve", {
      actorId: "owner",
      actorName: "Owner"
    });

    expect(result.request.status).toBe("approved");
    expect(result.state.requests[0].status).toBe("approved");
    const audit = loadAuditState();
    expect(audit.entries[0]).toMatchObject({
      action: "approval.approved",
      targetType: "pr",
      targetId: "pr-1"
    });
  });

  it("can skip audit writes for pure tests", () => {
    const request = createApprovalRequest({
      id: "approval-1",
      targetType: "pr",
      targetId: "pr-1",
      status: "submitted"
    });

    applyApprovalAction(
      { requests: [request], updatedAt: "" },
      "approval-1",
      "approve",
      { actorId: "owner", actorName: "Owner" },
      { writeAudit: false }
    );

    expect(loadAuditState().entries).toEqual([]);
  });
});

describe("approval builders and sync", () => {
  it("buildApprovalRequestFromPR maps submitted PRs into approval inbox rows", () => {
    const approval = buildApprovalRequestFromPR(makePR({ totalAmount: 150000 }));
    expect(approval).toMatchObject({
      id: "approval-pr-pr-1",
      targetType: "pr",
      status: "submitted",
      priority: "high",
      sourceAppId: "procurement"
    });
  });

  it("syncApprovalRequestsFromPRs creates one request and mirrors final source status", () => {
    const submitted = syncApprovalRequestsFromPRs({ requests: [], updatedAt: "" }, [makePR()]);
    expect(submitted.requests).toHaveLength(1);
    expect(submitted.requests[0].status).toBe("submitted");

    const approved = syncApprovalRequestsFromPRs(submitted, [
      makePR({ status: "approved", approvedBy: "owner" })
    ]);
    expect(approved.requests).toHaveLength(1);
    expect(approved.requests[0].status).toBe("approved");
  });

  it("buildApprovalRequestFromCashflow maps drafts to submitted approvals", () => {
    const approval = buildApprovalRequestFromCashflow(makeCashflow());
    expect(approval).toMatchObject({
      id: "approval-cashflow-cash-1",
      targetType: "cashflow_entry",
      status: "submitted",
      priority: "high"
    });
  });

  it("syncApprovalRequestsFromCashflow only mirrors confirmed entries after a draft request exists", () => {
    const confirmedOnly = syncApprovalRequestsFromCashflow({ requests: [], updatedAt: "" }, [
      makeCashflow({ status: "confirmed" })
    ]);
    expect(confirmedOnly.requests).toEqual([]);

    const draftSynced = syncApprovalRequestsFromCashflow({ requests: [], updatedAt: "" }, [
      makeCashflow({ status: "draft" })
    ]);
    const approved = syncApprovalRequestsFromCashflow(draftSynced, [
      makeCashflow({ status: "confirmed" })
    ]);
    expect(approved.requests[0].status).toBe("approved");
  });

  it("buildApprovalRequestFromDocument supports PO and invoice documents", () => {
    const quote = createBlankDocument(undefined, "quote");
    const po = createPurchaseOrderDocument(quote);

    expect(buildApprovalRequestFromDocument(quote)).toBeNull();
    expect(buildApprovalRequestFromDocument(po)?.targetType).toBe("po");
  });

  it("buildApprovalRequestFromDocument maps sent documents into submitted approvals", () => {
    const quote = createBlankDocument(undefined, "quote");
    const po = {
      ...createPurchaseOrderDocument(quote),
      documentStatus: "sent" as const,
      total: 150000,
      updatedAt: "2026-05-24T00:00:00.000Z"
    };
    const approval = buildApprovalRequestFromDocument(po);

    expect(approval).toMatchObject({
      targetType: "po",
      sourceAppId: "builddocs",
      status: "submitted",
      priority: "high",
      submittedAt: "2026-05-24T00:00:00.000Z"
    });
  });

  it("syncApprovalRequestsFromDocuments creates document approvals and mirrors final status", () => {
    const quote = createBlankDocument(undefined, "quote");
    const po = createPurchaseOrderDocument(quote);
    const draftOnly = syncApprovalRequestsFromDocuments({ requests: [], updatedAt: "" }, [po]);
    expect(draftOnly.requests).toEqual([]);

    const sentPo = { ...po, documentStatus: "sent" as const };
    const submitted = syncApprovalRequestsFromDocuments({ requests: [], updatedAt: "" }, [sentPo]);
    expect(submitted.requests).toHaveLength(1);
    expect(submitted.requests[0].status).toBe("submitted");

    const approved = syncApprovalRequestsFromDocuments(submitted, [
      { ...sentPo, documentStatus: "approved" as const }
    ]);
    expect(approved.requests[0].status).toBe("approved");
  });
});

describe("approval query helpers", () => {
  const state: ApprovalState = {
    updatedAt: "",
    requests: [
      createApprovalRequest({
        targetType: "pr",
        targetId: "pr-1",
        targetLabel: "PR-2026-001",
        projectId: "project-1",
        status: "submitted",
        amount: 100000,
        priority: "urgent"
      }),
      createApprovalRequest({
        targetType: "cashflow_entry",
        targetId: "cash-1",
        targetLabel: "Cement payout",
        projectId: "project-2",
        status: "approved",
        amount: 25000
      }),
      createApprovalRequest({
        targetType: "invoice",
        targetId: "inv-1",
        targetLabel: "Invoice 1",
        status: "rejected",
        amount: 5000
      })
    ]
  };

  it("filters by status, targetType, projectId, and search", () => {
    expect(filterApprovalRequests(state, { status: "submitted" })).toHaveLength(1);
    expect(filterApprovalRequests(state, { targetType: "cashflow_entry" })).toHaveLength(1);
    expect(filterApprovalRequests(state, { projectId: "project-1" })).toHaveLength(1);
    expect(filterApprovalRequests(state, { search: "cement" })[0].targetId).toBe("cash-1");
  });

  it("summarizes approval workload", () => {
    expect(summarizeApprovals(state)).toMatchObject({
      total: 3,
      submitted: 1,
      approved: 1,
      rejected: 1,
      cancelled: 0,
      urgent: 1,
      pendingAmount: 100000
    });
  });
});
