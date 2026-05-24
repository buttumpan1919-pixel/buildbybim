import { beforeEach, describe, expect, it } from "vitest";
import {
  RFQ_STORAGE_KEY,
  awardRFQ,
  buildComparisonMatrix,
  canTransitionRFQ,
  draftRFQFromPR,
  filterRFQs,
  legalRFQActionsFor,
  loadRFQs,
  nextRfqNumber,
  normalizePRLineItem,
  normalizePurchaseRequest,
  normalizeRFQ,
  recomputeRFQStatus,
  recordResponse,
  removeResponse,
  removeRFQ,
  saveRFQs,
  summarizeRFQs,
  transitionRFQStatus,
  upsertRFQ,
  type PRLineItem,
  type PurchaseRequest,
  type RFQ,
  type RFQResponse,
  type RFQState
} from "./procurement";

function resetStorage() {
  if (typeof window !== "undefined") window.localStorage.clear();
}

function makeItem(overrides: Partial<PRLineItem> = {}): PRLineItem {
  return normalizePRLineItem({
    id: overrides.id ?? `pli-${Math.random().toString(36).slice(2, 8)}`,
    costCodeId: "01-100",
    description: "test item",
    quantity: 10,
    unit: "ตร.ม.",
    estimatedUnitPrice: 100,
    ...overrides
  });
}

function makePR(overrides: Partial<PurchaseRequest> = {}): PurchaseRequest {
  return normalizePurchaseRequest({
    workspaceId: "ws-1",
    projectId: "p-1",
    prNo: "PR-2026-001",
    status: "approved",
    items: [makeItem()],
    ...overrides
  });
}

function makeRFQ(
  overrides: Omit<Partial<RFQ>, "responses"> & { responses?: Partial<RFQResponse>[] } = {}
): RFQ {
  const { responses, ...rest } = overrides;
  return normalizeRFQ({
    workspaceId: "ws-1",
    projectId: "p-1",
    prId: "pr-test",
    rfqNo: "RFQ-2026-001",
    status: "draft",
    invitedSupplierIds: ["s-1"],
    responses: (responses ?? []) as RFQResponse[],
    ...rest
  });
}

describe("storage + numbering", () => {
  beforeEach(resetStorage);

  it("uses namespaced key", () => {
    expect(RFQ_STORAGE_KEY).toBe("procurement.rfq.v1");
  });

  it("loadRFQs returns empty", () => {
    expect(loadRFQs().rfqs).toEqual([]);
  });

  it("saveRFQs round-trips", () => {
    saveRFQs({
      rfqs: [makeRFQ({ rfqNo: "RFQ-2026-099" })],
      updatedAt: new Date().toISOString()
    });
    expect(loadRFQs().rfqs[0].rfqNo).toBe("RFQ-2026-099");
  });

  it("nextRfqNumber resets on year change", () => {
    const ref = new Date("2027-01-01T00:00:00Z");
    expect(
      nextRfqNumber([{ rfqNo: "RFQ-2026-099" }], ref)
    ).toBe("RFQ-2027-001");
  });
});

describe("draftRFQFromPR", () => {
  it("throws when PR not approved", () => {
    expect(() => draftRFQFromPR(makePR({ status: "draft" }))).toThrow(/approved/);
  });

  it("inherits project + prId + status draft", () => {
    const pr = makePR({ id: "pr-99", projectId: "p-99" });
    const rfq = draftRFQFromPR(pr, "u-1");
    expect(rfq.prId).toBe("pr-99");
    expect(rfq.projectId).toBe("p-99");
    expect(rfq.status).toBe("draft");
    expect(rfq.createdBy).toBe("u-1");
  });

  it("seeds invitedSupplierIds from preferred suppliers", () => {
    const pr = makePR({
      items: [
        makeItem({ preferredSupplierId: "s-1" }),
        makeItem({ preferredSupplierId: "s-2" }),
        makeItem({ preferredSupplierId: "" })
      ]
    });
    const rfq = draftRFQFromPR(pr);
    expect(rfq.invitedSupplierIds).toEqual(["s-1", "s-2"]);
  });
});

describe("transitionRFQStatus", () => {
  it("draft → sent on send", () => {
    expect(transitionRFQStatus("draft", "send")).toBe("sent");
  });

  it("sent → partial_response on record_response", () => {
    expect(transitionRFQStatus("sent", "record_response")).toBe("partial_response");
  });

  it("partial_response → responses_complete on complete", () => {
    expect(transitionRFQStatus("partial_response", "complete")).toBe("responses_complete");
  });

  it("partial_response or responses_complete → awarded with context", () => {
    expect(
      transitionRFQStatus("partial_response", "award", {
        awardedSupplierId: "s-1",
        awardReason: "lowest_price"
      })
    ).toBe("awarded");
    expect(
      transitionRFQStatus("responses_complete", "award", {
        awardedSupplierId: "s-1",
        awardReason: "preferred"
      })
    ).toBe("awarded");
  });

  it("award throws without awardedSupplierId", () => {
    expect(() =>
      transitionRFQStatus("partial_response", "award", { awardReason: "x" })
    ).toThrow(/awardedSupplierId/);
  });

  it("award throws without awardReason", () => {
    expect(() =>
      transitionRFQStatus("partial_response", "award", { awardedSupplierId: "s-1" })
    ).toThrow(/awardReason/);
  });

  it("any non-terminal can cancel", () => {
    for (const s of ["draft", "sent", "partial_response", "responses_complete"] as const) {
      expect(transitionRFQStatus(s, "cancel")).toBe("cancelled");
    }
  });

  it("blocks illegal transitions", () => {
    expect(() => transitionRFQStatus("awarded", "record_response")).toThrow(/illegal/);
    expect(() => transitionRFQStatus("cancelled", "send")).toThrow(/illegal/);
    expect(() => transitionRFQStatus("draft", "award")).toThrow(/illegal/);
  });

  it("canTransitionRFQ + legalRFQActionsFor", () => {
    expect(canTransitionRFQ("draft", "send")).toBe(true);
    expect(canTransitionRFQ("awarded", "cancel")).toBe(false);
    expect(legalRFQActionsFor("draft")).toContain("send");
    expect(legalRFQActionsFor("awarded")).toEqual([]);
  });
});

describe("upsertRFQ / removeRFQ", () => {
  it("prepends new RFQ", () => {
    let state: RFQState = { rfqs: [], updatedAt: "" };
    state = upsertRFQ(state, makeRFQ({ id: "1", rfqNo: "RFQ-2026-001" }));
    state = upsertRFQ(state, makeRFQ({ id: "2", rfqNo: "RFQ-2026-002" }));
    expect(state.rfqs[0].rfqNo).toBe("RFQ-2026-002");
    expect(state.rfqs).toHaveLength(2);
  });

  it("updates existing by id", () => {
    let state: RFQState = {
      rfqs: [makeRFQ({ id: "1", awardReason: "old" })],
      updatedAt: ""
    };
    state = upsertRFQ(state, { id: "1", awardReason: "new", invitedSupplierIds: ["s-1"] });
    expect(state.rfqs[0].awardReason).toBe("new");
  });

  it("removeRFQ by id", () => {
    let state: RFQState = {
      rfqs: [makeRFQ({ id: "1" }), makeRFQ({ id: "2" })],
      updatedAt: ""
    };
    state = removeRFQ(state, "1");
    expect(state.rfqs.map((r) => r.id)).toEqual(["2"]);
  });
});

describe("recordResponse + recomputeRFQStatus", () => {
  it("rejects response from non-invited supplier", () => {
    const rfq = makeRFQ({ status: "sent", invitedSupplierIds: ["s-1"] });
    expect(() =>
      recordResponse(rfq, { supplierId: "intruder", itemQuotes: [] })
    ).toThrow(/not invited/);
  });

  it("rejects response on awarded RFQ", () => {
    const rfq = makeRFQ({ status: "awarded", invitedSupplierIds: ["s-1"] });
    expect(() =>
      recordResponse(rfq, { supplierId: "s-1", itemQuotes: [] })
    ).toThrow(/awarded/);
  });

  it("first response moves sent → partial_response", () => {
    const rfq = makeRFQ({
      status: "sent",
      invitedSupplierIds: ["s-1", "s-2"]
    });
    const next = recordResponse(rfq, {
      supplierId: "s-1",
      itemQuotes: [],
      totalAmount: 100
    });
    expect(next.status).toBe("partial_response");
    expect(next.responses).toHaveLength(1);
  });

  it("response from all invited → responses_complete", () => {
    let rfq = makeRFQ({
      status: "sent",
      invitedSupplierIds: ["s-1", "s-2"]
    });
    rfq = recordResponse(rfq, { supplierId: "s-1", itemQuotes: [] });
    rfq = recordResponse(rfq, { supplierId: "s-2", itemQuotes: [] });
    expect(rfq.status).toBe("responses_complete");
    expect(rfq.responses).toHaveLength(2);
  });

  it("re-recording from same supplier updates not duplicates", () => {
    let rfq = makeRFQ({
      status: "sent",
      invitedSupplierIds: ["s-1"]
    });
    rfq = recordResponse(rfq, { supplierId: "s-1", totalAmount: 100, itemQuotes: [] });
    rfq = recordResponse(rfq, { supplierId: "s-1", totalAmount: 200, itemQuotes: [] });
    expect(rfq.responses).toHaveLength(1);
    expect(rfq.responses[0].totalAmount).toBe(200);
  });

  it("removeResponse reverts complete → partial", () => {
    let rfq = makeRFQ({
      status: "sent",
      invitedSupplierIds: ["s-1", "s-2"]
    });
    rfq = recordResponse(rfq, { supplierId: "s-1", itemQuotes: [] });
    rfq = recordResponse(rfq, { supplierId: "s-2", itemQuotes: [] });
    expect(rfq.status).toBe("responses_complete");
    const targetId = rfq.responses[0].id;
    rfq = removeResponse(rfq, targetId);
    expect(rfq.status).toBe("partial_response");
  });

  it("recomputeRFQStatus leaves terminal states alone", () => {
    expect(recomputeRFQStatus(makeRFQ({ status: "awarded" }))).toBe("awarded");
    expect(recomputeRFQStatus(makeRFQ({ status: "cancelled" }))).toBe("cancelled");
    expect(recomputeRFQStatus(makeRFQ({ status: "draft" }))).toBe("draft");
  });
});

describe("buildComparisonMatrix", () => {
  it("highlights cheapest available cell per row", () => {
    const items = [makeItem({ id: "li-1", quantity: 10, unit: "x", description: "ปูน" })];
    const rfq = makeRFQ({
      status: "responses_complete",
      invitedSupplierIds: ["s-1", "s-2", "s-3"],
      responses: [
        {
          id: "r1",
          supplierId: "s-1",
          itemQuotes: [
            { prLineItemId: "li-1", unitPrice: 240, available: true }
          ]
        },
        {
          id: "r2",
          supplierId: "s-2",
          itemQuotes: [
            { prLineItemId: "li-1", unitPrice: 220, available: true }
          ]
        },
        {
          id: "r3",
          supplierId: "s-3",
          itemQuotes: [
            { prLineItemId: "li-1", unitPrice: 230, available: true }
          ]
        }
      ] as Partial<RFQResponse>[]
    });
    const matrix = buildComparisonMatrix(rfq, items);
    expect(matrix.rows[0].cells.find((c) => c.supplierId === "s-2")?.isBest).toBe(true);
    expect(matrix.rows[0].cells.find((c) => c.supplierId === "s-1")?.isBest).toBe(false);
  });

  it("computes amount from unitPrice × quantity when amount missing", () => {
    const items = [makeItem({ id: "li-1", quantity: 50 })];
    const rfq = makeRFQ({
      invitedSupplierIds: ["s-1"],
      responses: [
        {
          id: "r1",
          supplierId: "s-1",
          itemQuotes: [{ prLineItemId: "li-1", unitPrice: 200, available: true }]
        }
      ] as Partial<RFQResponse>[]
    });
    const matrix = buildComparisonMatrix(rfq, items);
    expect(matrix.rows[0].cells[0].amount).toBe(10_000);
  });

  it("marks unavailable cell when supplier didn't quote", () => {
    const items = [makeItem({ id: "li-1" })];
    const rfq = makeRFQ({
      invitedSupplierIds: ["s-1"],
      responses: [
        {
          id: "r1",
          supplierId: "s-1",
          itemQuotes: [{ prLineItemId: "li-1", unitPrice: 100, available: false }]
        }
      ] as Partial<RFQResponse>[]
    });
    const matrix = buildComparisonMatrix(rfq, items);
    expect(matrix.rows[0].cells[0].available).toBe(false);
    expect(matrix.rows[0].cells[0].isBest).toBe(false);
  });

  it("bestTotal = lowest sum among fully-quoted suppliers", () => {
    const items = [
      makeItem({ id: "li-1", quantity: 10 }),
      makeItem({ id: "li-2", quantity: 5 })
    ];
    const rfq = makeRFQ({
      invitedSupplierIds: ["s-1", "s-2"],
      responses: [
        {
          id: "r1",
          supplierId: "s-1",
          itemQuotes: [
            { prLineItemId: "li-1", unitPrice: 100, available: true },
            { prLineItemId: "li-2", unitPrice: 200, available: true }
          ]
        },
        {
          id: "r2",
          supplierId: "s-2",
          itemQuotes: [
            { prLineItemId: "li-1", unitPrice: 90, available: true },
            { prLineItemId: "li-2", unitPrice: 210, available: true }
          ]
        }
      ] as Partial<RFQResponse>[]
    });
    const matrix = buildComparisonMatrix(rfq, items);
    // s-1 total = 100*10 + 200*5 = 2000
    // s-2 total = 90*10 + 210*5 = 1950
    expect(matrix.totals.find((t) => t.supplierId === "s-1")?.total).toBe(2000);
    expect(matrix.totals.find((t) => t.supplierId === "s-2")?.total).toBe(1950);
    expect(matrix.bestTotalSupplierId).toBe("s-2");
    expect(matrix.totals.find((t) => t.supplierId === "s-2")?.isBest).toBe(true);
  });

  it("falls back to partial quoter when no one fully quoted", () => {
    const items = [makeItem({ id: "li-1" }), makeItem({ id: "li-2" })];
    const rfq = makeRFQ({
      invitedSupplierIds: ["s-1"],
      responses: [
        {
          id: "r1",
          supplierId: "s-1",
          itemQuotes: [{ prLineItemId: "li-1", unitPrice: 50, available: true }]
        }
      ] as Partial<RFQResponse>[]
    });
    const matrix = buildComparisonMatrix(rfq, items);
    expect(matrix.bestTotalSupplierId).toBe("s-1");
  });

  it("zero rows when PR has no items", () => {
    const rfq = makeRFQ({ invitedSupplierIds: ["s-1"] });
    expect(buildComparisonMatrix(rfq, []).rows).toEqual([]);
  });
});

describe("awardRFQ", () => {
  function setup() {
    const item = makeItem({
      id: "li-1",
      costCodeId: "01-100",
      quantity: 10,
      unit: "ถุง",
      description: "ปูน SCG"
    });
    // PR must be in rfq_sent state to receive award (approved → send_rfq → rfq_sent → award)
    const pr = makePR({ id: "pr-1", status: "rfq_sent", items: [item] });
    const rfq = makeRFQ({
      id: "rfq-1",
      prId: "pr-1",
      status: "responses_complete",
      invitedSupplierIds: ["s-1", "s-2"],
      responses: [
        {
          id: "r1",
          supplierId: "s-1",
          itemQuotes: [{ prLineItemId: "li-1", unitPrice: 240, available: true }],
          totalAmount: 2400,
          paymentTerms: "30 days",
          receivedAt: "2026-04-15T00:00:00.000Z"
        },
        {
          id: "r2",
          supplierId: "s-2",
          itemQuotes: [{ prLineItemId: "li-1", unitPrice: 220, available: true }],
          totalAmount: 2200,
          paymentTerms: "45 days",
          receivedAt: "2026-04-16T00:00:00.000Z"
        }
      ] as Partial<RFQResponse>[]
    });
    return { pr, rfq, item };
  }

  it("happy path: RFQ awarded + PR awarded + price history entry built", () => {
    const { pr, rfq } = setup();
    const result = awardRFQ(rfq, pr, "s-2", "lowest_price");
    expect(result.rfq.status).toBe("awarded");
    expect(result.rfq.awardedSupplierId).toBe("s-2");
    expect(result.rfq.awardReason).toBe("lowest_price");
    expect(result.pr.status).toBe("awarded");
    expect(result.pr.linkedRfqId).toBe("rfq-1");
    expect(result.priceHistoryAppendages).toHaveLength(1);
    const entry = result.priceHistoryAppendages[0];
    expect(entry.supplierId).toBe("s-2");
    expect(entry.unitPrice).toBe(220);
    expect(entry.quantity).toBe(10);
    expect(entry.totalAmount).toBe(2200);
    expect(entry.costCodeId).toBe("01-100");
    expect(entry.sourceType).toBe("rfq");
    expect(entry.sourceDocumentId).toBe("rfq-1");
  });

  it("throws when awarded supplier not invited", () => {
    const { pr, rfq } = setup();
    expect(() => awardRFQ(rfq, pr, "intruder", "x")).toThrow(/not invited/);
  });

  it("throws when no response from awarded supplier", () => {
    const { pr, rfq } = setup();
    const stripped: RFQ = { ...rfq, responses: rfq.responses.filter((r) => r.supplierId !== "s-2") };
    expect(() => awardRFQ(stripped, pr, "s-2", "x")).toThrow(/no response/);
  });

  it("throws when PR id mismatches RFQ.prId", () => {
    const { rfq } = setup();
    const otherPR = makePR({ id: "pr-other", status: "rfq_sent", items: [makeItem()] });
    expect(() => awardRFQ(rfq, otherPR, "s-2", "x")).toThrow(/PR id/);
  });

  it("throws when reason empty", () => {
    const { pr, rfq } = setup();
    expect(() => awardRFQ(rfq, pr, "s-2", "  ")).toThrow(/reason/);
  });

  it("throws on already-awarded RFQ", () => {
    const { pr, rfq } = setup();
    const awarded: RFQ = { ...rfq, status: "awarded" };
    expect(() => awardRFQ(awarded, pr, "s-2", "lowest_price")).toThrow(/awarded/);
  });

  it("excludes unavailable line items from price history", () => {
    const item = makeItem({ id: "li-1", quantity: 10 });
    const pr = makePR({ id: "pr-1", status: "rfq_sent", items: [item] });
    const rfq = makeRFQ({
      id: "rfq-1",
      prId: "pr-1",
      status: "partial_response",
      invitedSupplierIds: ["s-1"],
      responses: [
        {
          id: "r1",
          supplierId: "s-1",
          itemQuotes: [{ prLineItemId: "li-1", unitPrice: 100, available: false }]
        }
      ] as Partial<RFQResponse>[]
    });
    const result = awardRFQ(rfq, pr, "s-1", "preferred_vendor");
    expect(result.priceHistoryAppendages).toHaveLength(0);
  });
});

describe("filterRFQs + summarizeRFQs", () => {
  const state: RFQState = {
    rfqs: [
      makeRFQ({ id: "1", rfqNo: "RFQ-2026-001", status: "draft", projectId: "pA", prId: "pr-A" }),
      makeRFQ({ id: "2", rfqNo: "RFQ-2026-002", status: "sent", projectId: "pA", prId: "pr-A" }),
      makeRFQ({ id: "3", rfqNo: "RFQ-2026-003", status: "partial_response", projectId: "pB", prId: "pr-B" }),
      makeRFQ({ id: "4", rfqNo: "RFQ-2026-004", status: "awarded", projectId: "pB", prId: "pr-B", awardReason: "lowest_price" })
    ],
    updatedAt: ""
  };

  it("filters by status", () => {
    expect(filterRFQs(state, { status: "sent" })).toHaveLength(1);
    expect(filterRFQs(state, { status: "all" })).toHaveLength(4);
  });

  it("filters by project", () => {
    expect(filterRFQs(state, { projectId: "pA" })).toHaveLength(2);
  });

  it("filters by PR id", () => {
    expect(filterRFQs(state, { prId: "pr-B" })).toHaveLength(2);
  });

  it("filters by search across rfqNo + awardReason", () => {
    expect(filterRFQs(state, { search: "004" })).toHaveLength(1);
    expect(filterRFQs(state, { search: "lowest" })).toHaveLength(1);
  });

  it("summarizeRFQs counts byStatus + pending + awarded", () => {
    const sum = summarizeRFQs(state);
    expect(sum.total).toBe(4);
    expect(sum.byStatus.sent).toBe(1);
    expect(sum.byStatus.partial_response).toBe(1);
    expect(sum.byStatus.awarded).toBe(1);
    expect(sum.pendingResponse).toBe(2); // sent + partial_response
    expect(sum.awarded).toBe(1);
  });
});
