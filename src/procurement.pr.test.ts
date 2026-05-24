import { beforeEach, describe, expect, it } from "vitest";
import {
  PR_STORAGE_KEY,
  applyPRAction,
  canTransition,
  createPR,
  draftRFQFromPR,
  filterPRs,
  legalActionsFor,
  loadPRs,
  nextPrNumber,
  nextRfqNumber,
  normalizePRLineItem,
  normalizePurchaseRequest,
  removePR,
  savePRs,
  summarizePRs,
  transitionPRStatus,
  upsertPR,
  validatePR,
  type PRLineItem,
  type PRState,
  type PurchaseRequest
} from "./procurement";

function resetStorage() {
  if (typeof window !== "undefined") window.localStorage.clear();
}

function makeLineItem(overrides: Partial<PRLineItem> = {}): PRLineItem {
  return normalizePRLineItem({
    costCodeId: "01-100",
    description: "test",
    quantity: 10,
    unit: "ตร.ม.",
    estimatedUnitPrice: 100,
    ...overrides
  });
}

function makePR(overrides: Partial<PurchaseRequest> = {}): PurchaseRequest {
  return normalizePurchaseRequest({
    workspaceId: "ws-1",
    projectId: "p1",
    prNo: "PR-2026-001",
    status: "draft",
    items: [makeLineItem()],
    ...overrides
  });
}

describe("storage", () => {
  beforeEach(resetStorage);

  it("uses namespaced key", () => {
    expect(PR_STORAGE_KEY).toBe("procurement.pr.v1");
  });

  it("loadPRs returns empty", () => {
    expect(loadPRs().prs).toEqual([]);
  });

  it("savePRs round-trips", () => {
    savePRs({ prs: [makePR({ prNo: "PR-2026-099" })], updatedAt: new Date().toISOString() });
    expect(loadPRs().prs[0].prNo).toBe("PR-2026-099");
  });
});

describe("normalize", () => {
  it("computes line item amount = qty * estimatedUnitPrice", () => {
    const item = normalizePRLineItem({ quantity: 5, estimatedUnitPrice: 200 });
    expect(item.amount).toBe(1000);
  });

  it("clamps negative quantity to 0", () => {
    const item = normalizePRLineItem({ quantity: -5, estimatedUnitPrice: 100 });
    expect(item.quantity).toBe(0);
    expect(item.amount).toBe(0);
  });

  it("computes PR totalAmount as sum of item amounts", () => {
    const pr = normalizePurchaseRequest({
      items: [
        normalizePRLineItem({ costCodeId: "01", quantity: 2, estimatedUnitPrice: 100, unit: "x" }),
        normalizePRLineItem({ costCodeId: "02", quantity: 3, estimatedUnitPrice: 50, unit: "x" })
      ]
    });
    expect(pr.totalAmount).toBe(350);
  });

  it("defaults invalid status to draft", () => {
    const pr = normalizePurchaseRequest({
      status: "garbage" as unknown as PurchaseRequest["status"]
    });
    expect(pr.status).toBe("draft");
  });

  it("normalizes empty items to empty array", () => {
    const pr = normalizePurchaseRequest({ items: undefined });
    expect(pr.items).toEqual([]);
    expect(pr.totalAmount).toBe(0);
  });
});

describe("nextPrNumber", () => {
  it("starts at PR-YYYY-001 when no PRs exist", () => {
    const ref = new Date("2026-05-24T00:00:00Z");
    expect(nextPrNumber([], ref)).toBe("PR-2026-001");
  });

  it("increments sequence for current year", () => {
    const ref = new Date("2026-05-24T00:00:00Z");
    expect(
      nextPrNumber([{ prNo: "PR-2026-001" }, { prNo: "PR-2026-005" }], ref)
    ).toBe("PR-2026-006");
  });

  it("resets sequence on year change", () => {
    const ref = new Date("2027-01-01T00:00:00Z");
    expect(
      nextPrNumber([{ prNo: "PR-2026-099" }, { prNo: "PR-2026-100" }], ref)
    ).toBe("PR-2027-001");
  });

  it("ignores malformed pr numbers", () => {
    const ref = new Date("2026-05-24T00:00:00Z");
    expect(
      nextPrNumber([{ prNo: "junk" }, { prNo: "PR-2026-003" }], ref)
    ).toBe("PR-2026-004");
  });

  it("pads to 3 digits", () => {
    const ref = new Date("2026-05-24T00:00:00Z");
    expect(nextPrNumber([], ref)).toMatch(/PR-2026-\d{3}/);
  });
});

describe("nextRfqNumber", () => {
  it("same shape RFQ-YYYY-NNN", () => {
    const ref = new Date("2026-05-24T00:00:00Z");
    expect(nextRfqNumber([], ref)).toBe("RFQ-2026-001");
    expect(
      nextRfqNumber([{ rfqNo: "RFQ-2026-005" }], ref)
    ).toBe("RFQ-2026-006");
  });
});

describe("validatePR", () => {
  it("requires projectId", () => {
    const errors = validatePR({ items: [makeLineItem()] });
    expect(errors).toContain("projectId is required");
  });

  it("requires at least one line item", () => {
    const errors = validatePR({ projectId: "p1", items: [] });
    expect(errors).toContain("at least one line item is required");
  });

  it("flags missing costCodeId per item", () => {
    const errors = validatePR({
      projectId: "p1",
      items: [{ ...makeLineItem(), costCodeId: "" }]
    });
    expect(errors.some((e) => e.includes("costCodeId is required"))).toBe(true);
  });

  it("flags missing unit per item", () => {
    const errors = validatePR({
      projectId: "p1",
      items: [{ ...makeLineItem(), unit: "" }]
    });
    expect(errors.some((e) => e.includes("unit is required"))).toBe(true);
  });

  it("flags zero / negative quantity per item", () => {
    const errors = validatePR({
      projectId: "p1",
      items: [{ ...makeLineItem(), quantity: 0 }]
    });
    expect(errors.some((e) => e.includes("quantity must be > 0"))).toBe(true);
  });

  it("returns empty array when valid", () => {
    expect(validatePR({ projectId: "p1", items: [makeLineItem()] })).toEqual([]);
  });
});

describe("transitionPRStatus", () => {
  it("draft → submitted on submit", () => {
    expect(transitionPRStatus("draft", "submit")).toBe("submitted");
  });

  it("submitted → approved with approverId", () => {
    expect(
      transitionPRStatus("submitted", "approve", { approverId: "u-1" })
    ).toBe("approved");
  });

  it("submitted approve throws without approverId", () => {
    expect(() => transitionPRStatus("submitted", "approve")).toThrow(/approver/);
  });

  it("submitted → rejected with reason", () => {
    expect(
      transitionPRStatus("submitted", "reject", { reason: "out of budget" })
    ).toBe("rejected");
  });

  it("submitted reject throws without reason", () => {
    expect(() => transitionPRStatus("submitted", "reject")).toThrow(/reason/);
  });

  it("approved → rfq_sent on send_rfq", () => {
    expect(transitionPRStatus("approved", "send_rfq")).toBe("rfq_sent");
  });

  it("approved → ordered on order (direct without RFQ)", () => {
    expect(transitionPRStatus("approved", "order")).toBe("ordered");
  });

  it("rfq_sent → awarded with awardedSupplierId", () => {
    expect(
      transitionPRStatus("rfq_sent", "award", { awardedSupplierId: "s-1" })
    ).toBe("awarded");
  });

  it("rfq_sent award throws without awardedSupplierId", () => {
    expect(() => transitionPRStatus("rfq_sent", "award")).toThrow(/supplier/);
  });

  it("awarded → ordered → received → closed happy path", () => {
    expect(transitionPRStatus("awarded", "order")).toBe("ordered");
    expect(transitionPRStatus("ordered", "receive")).toBe("received");
    expect(transitionPRStatus("received", "close")).toBe("closed");
  });

  it("rejected → draft on edit", () => {
    expect(transitionPRStatus("rejected", "edit")).toBe("draft");
  });

  it("any non-terminal can cancel", () => {
    for (const s of [
      "draft",
      "submitted",
      "approved",
      "rejected",
      "rfq_sent",
      "awarded",
      "ordered"
    ] as const) {
      expect(transitionPRStatus(s, "cancel")).toBe("cancelled");
    }
  });

  it("blocks illegal transitions", () => {
    expect(() => transitionPRStatus("closed", "submit")).toThrow(/illegal/);
    expect(() => transitionPRStatus("cancelled", "approve")).toThrow(/illegal/);
    expect(() => transitionPRStatus("draft", "approve")).toThrow(/illegal/);
    expect(() => transitionPRStatus("received", "cancel")).toThrow(/illegal/);
  });

  it("canTransition returns boolean without throwing", () => {
    expect(canTransition("draft", "submit")).toBe(true);
    expect(canTransition("closed", "submit")).toBe(false);
  });

  it("legalActionsFor returns available actions", () => {
    const actions = legalActionsFor("submitted");
    expect(actions).toContain("approve");
    expect(actions).toContain("reject");
    expect(actions).toContain("cancel");
    expect(legalActionsFor("closed")).toEqual([]);
  });
});

describe("applyPRAction", () => {
  it("updates status + stamps approvedBy on approve", () => {
    const pr = makePR({ status: "submitted" });
    const next = applyPRAction(pr, "approve", { approverId: "user-42" });
    expect(next.status).toBe("approved");
    expect(next.approvedBy).toBe("user-42");
  });

  it("stamps rejectedReason on reject", () => {
    const pr = makePR({ status: "submitted" });
    const next = applyPRAction(pr, "reject", { reason: "over budget" });
    expect(next.status).toBe("rejected");
    expect(next.rejectedReason).toBe("over budget");
  });

  it("clears rejectedReason on edit", () => {
    const pr = makePR({ status: "rejected", rejectedReason: "old reason" });
    const next = applyPRAction(pr, "edit");
    expect(next.status).toBe("draft");
    expect(next.rejectedReason).toBe("");
  });

  it("stores linkedRfqId on send_rfq", () => {
    const pr = makePR({ status: "approved" });
    const next = applyPRAction(pr, "send_rfq", { linkedRfqId: "rfq-1" });
    expect(next.status).toBe("rfq_sent");
    expect(next.linkedRfqId).toBe("rfq-1");
  });

  it("stores linkedPoDocumentId on order", () => {
    const pr = makePR({ status: "approved" });
    const next = applyPRAction(pr, "order", { linkedPoDocumentId: "doc-1" });
    expect(next.status).toBe("ordered");
    expect(next.linkedPoDocumentId).toBe("doc-1");
  });

  it("throws on illegal action", () => {
    const pr = makePR({ status: "closed" });
    expect(() => applyPRAction(pr, "submit")).toThrow(/illegal/);
  });
});

describe("upsertPR / removePR", () => {
  it("prepends new PR", () => {
    let state: PRState = { prs: [], updatedAt: "" };
    state = upsertPR(state, makePR({ id: "1", prNo: "PR-2026-001" }));
    state = upsertPR(state, makePR({ id: "2", prNo: "PR-2026-002" }));
    expect(state.prs[0].prNo).toBe("PR-2026-002");
    expect(state.prs).toHaveLength(2);
  });

  it("updates existing by id", () => {
    let state: PRState = { prs: [makePR({ id: "1", notes: "old" })], updatedAt: "" };
    state = upsertPR(state, { id: "1", notes: "new", projectId: "p1", items: [makeLineItem()] });
    expect(state.prs).toHaveLength(1);
    expect(state.prs[0].notes).toBe("new");
  });

  it("removePR by id", () => {
    let state: PRState = {
      prs: [makePR({ id: "1" }), makePR({ id: "2" })],
      updatedAt: ""
    };
    state = removePR(state, "1");
    expect(state.prs.map((p) => p.id)).toEqual(["2"]);
  });
});

describe("filterPRs", () => {
  const state: PRState = {
    prs: [
      makePR({ id: "1", prNo: "PR-2026-001", status: "draft", projectId: "pA" }),
      makePR({ id: "2", prNo: "PR-2026-002", status: "submitted", projectId: "pA" }),
      makePR({ id: "3", prNo: "PR-2026-003", status: "approved", projectId: "pB" }),
      makePR({ id: "4", prNo: "PR-2026-004", status: "received", projectId: "pB", notes: "ปูน" })
    ],
    updatedAt: ""
  };

  it("filters by status", () => {
    expect(filterPRs(state, { status: "submitted" })).toHaveLength(1);
    expect(filterPRs(state, { status: "all" })).toHaveLength(4);
  });

  it("filters by projectId", () => {
    expect(filterPRs(state, { projectId: "pA" })).toHaveLength(2);
    expect(filterPRs(state, { projectId: "pB" })).toHaveLength(2);
  });

  it("filters by search across prNo + notes", () => {
    expect(filterPRs(state, { search: "002" })).toHaveLength(1);
    expect(filterPRs(state, { search: "ปูน" })).toHaveLength(1);
  });

  it("combines filters", () => {
    expect(filterPRs(state, { status: "received", projectId: "pB" })).toHaveLength(1);
  });
});

describe("summarizePRs", () => {
  it("counts by status + totals", () => {
    const state: PRState = {
      prs: [
        makePR({ status: "draft", items: [makeLineItem({ quantity: 1, estimatedUnitPrice: 100 })] }),
        makePR({ status: "submitted", items: [makeLineItem({ quantity: 2, estimatedUnitPrice: 200 })] }),
        makePR({ status: "approved", items: [makeLineItem({ quantity: 3, estimatedUnitPrice: 300 })] }),
        makePR({ status: "ordered", items: [makeLineItem({ quantity: 1, estimatedUnitPrice: 500 })] })
      ],
      updatedAt: ""
    };
    const sum = summarizePRs(state);
    expect(sum.total).toBe(4);
    expect(sum.byStatus.draft).toBe(1);
    expect(sum.byStatus.submitted).toBe(1);
    expect(sum.byStatus.approved).toBe(1);
    expect(sum.byStatus.ordered).toBe(1);
    expect(sum.pendingApproval).toBe(1);
    expect(sum.inProgress).toBe(2); // approved + ordered
    expect(sum.totalAmount).toBe(100 + 400 + 900 + 500);
  });
});

describe("createPR + draftRFQFromPR", () => {
  it("createPR defaults status to draft", () => {
    const pr = createPR({ projectId: "p1", items: [makeLineItem()] });
    expect(pr.status).toBe("draft");
    expect(pr.id).toBeTruthy();
  });

  it("draftRFQFromPR throws when PR not approved", () => {
    const pr = makePR({ status: "draft" });
    expect(() => draftRFQFromPR(pr)).toThrow(/approved/);
  });

  it("draftRFQFromPR prefills invitedSupplierIds from preferred suppliers", () => {
    const pr = makePR({
      status: "approved",
      items: [
        makeLineItem({ preferredSupplierId: "s-1" }),
        makeLineItem({ preferredSupplierId: "s-2" }),
        makeLineItem({ preferredSupplierId: "" })
      ]
    });
    const rfq = draftRFQFromPR(pr, "user-1");
    expect(rfq.invitedSupplierIds).toEqual(["s-1", "s-2"]);
    expect(rfq.prId).toBe(pr.id);
    expect(rfq.projectId).toBe(pr.projectId);
    expect(rfq.status).toBe("draft");
    expect(rfq.createdBy).toBe("user-1");
  });
});
