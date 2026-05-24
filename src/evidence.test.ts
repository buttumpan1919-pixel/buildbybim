import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_EVIDENCE_APPROVAL_POLICY,
  EVIDENCE_APPROVAL_POLICY_STORAGE_KEY,
  EVIDENCE_STORAGE_KEY,
  MAX_EVIDENCE_FILE_SIZE,
  addEvidenceLink,
  buildEvidenceTargetsForApproval,
  collectEvidenceForTarget,
  createEvidenceAsset,
  createEvidenceAssetFromFile,
  evaluateEvidenceApprovalPolicy,
  evaluateEvidenceRequirement,
  filterEvidenceAssets,
  loadEvidenceApprovalPolicy,
  loadEvidenceState,
  normalizeEvidenceAsset,
  normalizeEvidenceApprovalPolicy,
  normalizeEvidenceState,
  removeEvidenceAsset,
  removeEvidenceLink,
  saveEvidenceApprovalPolicy,
  saveEvidenceState,
  setEvidenceStatus,
  summarizeEvidenceState,
  upsertEvidenceAsset,
  validateEvidenceAsset,
  type EvidenceAsset,
  type EvidenceState
} from "./evidence";

function resetStorage() {
  window.localStorage.clear();
}

function makeAsset(overrides: Partial<EvidenceAsset> = {}): EvidenceAsset {
  return normalizeEvidenceAsset({
    id: "asset-1",
    workspaceId: "ws-1",
    type: "receipt",
    title: "Receipt A",
    fileName: "receipt-a.jpg",
    mimeType: "image/jpeg",
    size: 1200,
    amount: 1500,
    links: [{ id: "link-project", targetType: "project", targetId: "p1", label: "Project A", createdAt: "2026-05-24T00:00:00.000Z" }],
    ...overrides
  });
}

describe("evidence storage", () => {
  beforeEach(resetStorage);

  it("uses namespaced storage key", () => {
    expect(EVIDENCE_STORAGE_KEY).toBe("evidence.assets.v1");
    expect(EVIDENCE_APPROVAL_POLICY_STORAGE_KEY).toBe("evidence.approval-policy.v1");
  });

  it("loads empty state when storage is missing", () => {
    expect(loadEvidenceState()).toEqual({ assets: [], updatedAt: "" });
  });

  it("round-trips via storage adapter", () => {
    saveEvidenceState({ assets: [makeAsset()], updatedAt: "2026-05-24T00:00:00.000Z" });
    const loaded = loadEvidenceState();
    expect(loaded.assets).toHaveLength(1);
    expect(loaded.assets[0].title).toBe("Receipt A");
  });

  it("round-trips approval policy settings", () => {
    expect(loadEvidenceApprovalPolicy()).toEqual(DEFAULT_EVIDENCE_APPROVAL_POLICY);

    saveEvidenceApprovalPolicy({
      workspaceId: "ws-1",
      mode: "warn",
      minimumAmount: 125000,
      targetTypes: ["pr", "cashflow_entry", "invoice"],
      updatedAt: ""
    });

    expect(loadEvidenceApprovalPolicy()).toMatchObject({
      workspaceId: "ws-1",
      mode: "warn",
      minimumAmount: 125000,
      targetTypes: ["pr", "cashflow_entry", "invoice"]
    });
  });
});

describe("normalize evidence", () => {
  it("accepts a bare assets array", () => {
    const state = normalizeEvidenceState([{ title: "A", type: "site_photo" }]);
    expect(state.assets).toHaveLength(1);
    expect(state.assets[0].type).toBe("site_photo");
  });

  it("defaults invalid enums and clamps negative amounts", () => {
    const asset = normalizeEvidenceAsset({
      type: "bad" as EvidenceAsset["type"],
      status: "bad" as EvidenceAsset["status"],
      amount: -100,
      title: "Bad"
    });
    expect(asset.type).toBe("other");
    expect(asset.status).toBe("draft");
    expect(asset.amount).toBe(0);
  });

  it("deduplicates tags and removes links without target id", () => {
    const asset = normalizeEvidenceAsset({
      title: "Tags",
      tags: [" site ", "site", "", "receipt"],
      links: [
        { targetType: "project", targetId: "p1", label: "P1" },
        { targetType: "project", targetId: "", label: "Missing" }
      ] as EvidenceAsset["links"]
    });
    expect(asset.tags).toEqual(["site", "receipt"]);
    expect(asset.links).toHaveLength(1);
  });

  it("normalizes invalid approval policies defensively", () => {
    expect(
      normalizeEvidenceApprovalPolicy({
        mode: "bad",
        minimumAmount: -100,
        targetTypes: ["invoice", "invoice", "bad"],
        updatedAt: 123
      })
    ).toMatchObject({
      mode: "block",
      minimumAmount: 0,
      targetTypes: ["invoice", "pr"],
      updatedAt: ""
    });
  });
});

describe("evidence mutations", () => {
  it("creates, upserts, removes, and changes status", () => {
    let state: EvidenceState = { assets: [], updatedAt: "" };
    const created = createEvidenceAsset({ title: "Created", type: "invoice" });
    state = upsertEvidenceAsset(state, created);
    expect(state.assets).toHaveLength(1);
    expect(state.assets[0].type).toBe("invoice");

    state = upsertEvidenceAsset(state, { ...created, title: "Renamed" });
    expect(state.assets).toHaveLength(1);
    expect(state.assets[0].title).toBe("Renamed");

    state = setEvidenceStatus(state, created.id, "verified", "Owner");
    expect(state.assets[0].status).toBe("verified");
    expect(state.assets[0].verifiedBy).toBe("Owner");

    state = setEvidenceStatus(state, created.id, "rejected", "Owner", "missing tax id");
    expect(state.assets[0].rejectedReason).toBe("missing tax id");

    state = removeEvidenceAsset(state, created.id);
    expect(state.assets).toHaveLength(0);
  });

  it("adds links idempotently and removes links by id", () => {
    let state: EvidenceState = { assets: [makeAsset({ links: [] })], updatedAt: "" };
    state = addEvidenceLink(state, "asset-1", { targetType: "project", targetId: "p1", label: "P1" });
    state = addEvidenceLink(state, "asset-1", { targetType: "project", targetId: "p1", label: "P1" });
    expect(state.assets[0].links).toHaveLength(1);

    const linkId = state.assets[0].links[0].id;
    state = removeEvidenceLink(state, "asset-1", linkId);
    expect(state.assets[0].links).toHaveLength(0);
  });
});

describe("filter and summary", () => {
  const state: EvidenceState = {
    assets: [
      makeAsset({
        id: "receipt",
        status: "verified",
        type: "receipt",
        title: "Steel receipt",
        size: 1000,
        links: [
          { id: "p", targetType: "project", targetId: "p1", label: "Project A", createdAt: "2026-05-24T00:00:00.000Z" },
          { id: "cf", targetType: "cashflow_entry", targetId: "cf1", label: "Cashflow", createdAt: "2026-05-24T00:00:00.000Z" }
        ]
      }),
      makeAsset({
        id: "quote",
        status: "draft",
        type: "rfq_quote",
        title: "Supplier quote",
        size: 2000,
        links: [
          { id: "pr", targetType: "pr", targetId: "pr1", label: "PR", createdAt: "2026-05-24T00:00:00.000Z" },
          { id: "s", targetType: "supplier", targetId: "s1", label: "Supplier", createdAt: "2026-05-24T00:00:00.000Z" }
        ]
      }),
      makeAsset({
        id: "photo",
        status: "rejected",
        type: "site_photo",
        title: "Site photo",
        size: 3000,
        links: []
      })
    ],
    updatedAt: ""
  };

  it("filters by status, type, target, and search", () => {
    expect(filterEvidenceAssets(state, { status: "verified" }).map((asset) => asset.id)).toEqual(["receipt"]);
    expect(filterEvidenceAssets(state, { type: "rfq_quote" }).map((asset) => asset.id)).toEqual(["quote"]);
    expect(filterEvidenceAssets(state, { targetType: "supplier", targetId: "s1" }).map((asset) => asset.id)).toEqual(["quote"]);
    expect(filterEvidenceAssets(state, { search: "steel" }).map((asset) => asset.id)).toEqual(["receipt"]);
    expect(filterEvidenceAssets(state, { needsReview: true }).map((asset) => asset.id)).toEqual(["quote", "photo"]);
  });

  it("collects evidence for a target", () => {
    expect(collectEvidenceForTarget(state, "cashflow_entry", "cf1").map((asset) => asset.id)).toEqual(["receipt"]);
  });

  it("summarizes evidence state", () => {
    expect(summarizeEvidenceState(state)).toMatchObject({
      total: 3,
      draft: 1,
      verified: 1,
      rejected: 1,
      receipts: 1,
      sitePhotos: 1,
      linkedProjects: 1,
      linkedCashflow: 1,
      linkedProcurement: 1,
      unlinked: 1,
      totalSize: 6000
    });
  });
});

describe("evidence requirements", () => {
  it("builds direct and context targets for approval requests", () => {
    expect(
      buildEvidenceTargetsForApproval({
        targetType: "cashflow_entry",
        targetId: "cf1",
        projectId: "p1",
        costCodeId: "c1",
        supplierId: "s1"
      })
    ).toEqual([
      { targetType: "cashflow_entry", targetId: "cf1", label: "Cashflow entry", direct: true },
      { targetType: "project", targetId: "p1", label: "Project", direct: false },
      { targetType: "cost_code", targetId: "c1", label: "Cost Code", direct: false },
      { targetType: "supplier", targetId: "s1", label: "Supplier", direct: false }
    ]);
  });

  it("builds a direct RFQ target for RFQ award checks", () => {
    expect(
      buildEvidenceTargetsForApproval({
        targetType: "rfq_award",
        targetId: "rfq1",
        projectId: "p1",
        supplierId: "s1"
      })
    ).toEqual([
      { targetType: "rfq", targetId: "rfq1", label: "RFQ award", direct: true },
      { targetType: "project", targetId: "p1", label: "Project", direct: false },
      { targetType: "supplier", targetId: "s1", label: "Supplier", direct: false }
    ]);
  });

  it("marks approval evidence verified only when direct target has verified proof", () => {
    const state: EvidenceState = {
      assets: [
        makeAsset({
          id: "project-proof",
          status: "verified",
          links: [
            {
              id: "project-proof-link",
              targetType: "project",
              targetId: "p1",
              label: "Project A",
              createdAt: "2026-05-24T00:00:00.000Z"
            }
          ]
        }),
        makeAsset({
          id: "cashflow-draft",
          status: "draft",
          links: [
            {
              id: "cashflow-draft-link",
              targetType: "cashflow_entry",
              targetId: "cf1",
              label: "Cashflow",
              createdAt: "2026-05-24T00:00:00.000Z"
            }
          ]
        })
      ],
      updatedAt: ""
    };
    const targets = buildEvidenceTargetsForApproval({
      targetType: "cashflow_entry",
      targetId: "cf1",
      projectId: "p1"
    });

    expect(evaluateEvidenceRequirement(state, targets)).toMatchObject({
      directTotal: 1,
      directVerified: 0,
      contextVerified: 1,
      hasDirectVerified: false,
      hasAnyVerified: true,
      hasAnyEvidence: true,
      status: "needs_review"
    });

    const verifiedState = upsertEvidenceAsset(state, {
      id: "cashflow-draft",
      title: "Verified receipt",
      status: "verified",
      links: [
        {
          id: "cashflow-verified-link",
          targetType: "cashflow_entry",
          targetId: "cf1",
          label: "Cashflow",
          createdAt: "2026-05-24T00:00:00.000Z"
        }
      ]
    });
    expect(evaluateEvidenceRequirement(verifiedState, targets)).toMatchObject({
      directVerified: 1,
      hasDirectVerified: true,
      status: "verified"
    });
  });

  it("evaluates approval evidence policy by mode, threshold, and direct proof", () => {
    const missing = evaluateEvidenceRequirement({ assets: [], updatedAt: "" }, [
      { targetType: "pr", targetId: "pr1", label: "PR", direct: true }
    ]);
    const verified = evaluateEvidenceRequirement(
      {
        assets: [
          makeAsset({
            status: "verified",
            links: [
              {
                id: "pr-link",
                targetType: "pr",
                targetId: "pr1",
                label: "PR",
                createdAt: "2026-05-24T00:00:00.000Z"
              }
            ]
          })
        ],
        updatedAt: ""
      },
      [{ targetType: "pr", targetId: "pr1", label: "PR", direct: true }]
    );

    expect(
      evaluateEvidenceApprovalPolicy(
        { ...DEFAULT_EVIDENCE_APPROVAL_POLICY, mode: "block", minimumAmount: 50000 },
        { targetType: "pr", amount: 100000 },
        missing
      )
    ).toMatchObject({ applies: true, blocked: true, shouldConfirm: false, reason: "missing_verified" });

    expect(
      evaluateEvidenceApprovalPolicy(
        { ...DEFAULT_EVIDENCE_APPROVAL_POLICY, mode: "warn", minimumAmount: 50000 },
        { targetType: "pr", amount: 100000 },
        missing
      )
    ).toMatchObject({ applies: true, blocked: false, shouldConfirm: true });

    expect(
      evaluateEvidenceApprovalPolicy(
        { ...DEFAULT_EVIDENCE_APPROVAL_POLICY, minimumAmount: 200000 },
        { targetType: "pr", amount: 100000 },
        missing
      )
    ).toMatchObject({ applies: false, reason: "below_threshold" });

    expect(
      evaluateEvidenceApprovalPolicy(DEFAULT_EVIDENCE_APPROVAL_POLICY, { targetType: "pr", amount: 100000 }, verified)
    ).toMatchObject({ applies: true, blocked: false, shouldConfirm: false, reason: "verified" });

    expect(
      evaluateEvidenceApprovalPolicy(
        DEFAULT_EVIDENCE_APPROVAL_POLICY,
        { targetType: "rfq_award", amount: 100000 },
        missing
      )
    ).toMatchObject({ applies: true, blocked: true, reason: "missing_verified" });
  });
});

describe("file intake", () => {
  it("creates evidence asset from a file", async () => {
    const file = new File(["hello"], "receipt.txt", { type: "text/plain" });
    const asset = await createEvidenceAssetFromFile(file, { type: "receipt", amount: 200 });
    expect(asset.fileName).toBe("receipt.txt");
    expect(asset.mimeType).toBe("text/plain");
    expect(asset.size).toBe(5);
    expect(asset.dataUrl).toContain("data:text/plain");
    expect(asset.amount).toBe(200);
  });

  it("rejects files over the local-first size limit", async () => {
    const file = new File(["x"], "big.pdf", { type: "application/pdf" });
    Object.defineProperty(file, "size", { value: MAX_EVIDENCE_FILE_SIZE + 1 });
    await expect(createEvidenceAssetFromFile(file)).rejects.toThrow("file size");
  });

  it("validates required fields and file size", () => {
    expect(validateEvidenceAsset({})).toContain("title or fileName is required");
    expect(validateEvidenceAsset({ title: "A", size: MAX_EVIDENCE_FILE_SIZE + 1 })).toContain(
      `file size must be <= ${MAX_EVIDENCE_FILE_SIZE} bytes`
    );
  });
});
