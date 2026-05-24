import { beforeEach, describe, expect, it } from "vitest";
import { loadAuditState } from "./membership";
import {
  DOCUMENT_AUTHORITY_STORAGE_KEY,
  PROJECT_PERMISSIONS,
  PROJECT_ACCESS_STORAGE_KEY,
  PROJECT_ROLES,
  WORKSPACE_ROLES,
  applyApprovalDecisionToDocumentAuthorityState,
  applyDocumentAuthorityAction,
  buildDocumentAuthorityStamp,
  canApplyDocumentAuthorityAction,
  createDocumentAuthority,
  createProjectAccessGrant,
  effectivePermissionsForProjectAccessGrant,
  ensureDocumentAuthority,
  evaluateDocumentAuthorityActionAccess,
  evaluateLocalProjectAccess,
  evaluateProjectAccess,
  evaluateProjectAccessGuard,
  filterProjectScopedRecordsByAccess,
  getProjectAccessDecisionText,
  hasActiveProjectAccessGrants,
  listAccessibleProjectIds,
  listLocalAccessibleProjectIds,
  loadDocumentAuthorityState,
  loadProjectAccessState,
  normalizeProjectAccessGrant,
  normalizeProjectAccessState,
  projectPermissionForDocumentAuthorityAction,
  removeDocumentAuthority,
  removeProjectAccessGrant,
  saveDocumentAuthorityState,
  saveProjectAccessState,
  transitionDocumentAuthorityStatus,
  upsertDocumentAuthority,
  upsertProjectAccessGrant,
  type DocumentAuthorityState,
  type DocumentAuthorityRecord,
  type ProjectAccessState
} from "./projectAccess";

function resetStorage() {
  window.localStorage.clear();
}

function makeGrant(overrides = {}) {
  return createProjectAccessGrant({
    id: "grant-1",
    workspaceId: "ws-1",
    projectId: "p-1",
    memberId: "m-1",
    memberName: "Project User",
    role: "project_manager",
    ...overrides
  });
}

function makeAuthority(overrides: Partial<DocumentAuthorityRecord> = {}) {
  return createDocumentAuthority({
    id: "authority-doc-1",
    workspaceId: "ws-1",
    documentId: "doc-1",
    documentNo: "QT-2026-001",
    documentType: "quote",
    projectId: "p-1",
    preparedBy: { actorId: "u-prep", actorName: "Prepared User" },
    ...overrides
  });
}

describe("project access storage", () => {
  beforeEach(resetStorage);

  it("uses namespaced storage keys and round-trips states", () => {
    expect(PROJECT_ACCESS_STORAGE_KEY).toBe("project-access.grants.v1");
    expect(DOCUMENT_AUTHORITY_STORAGE_KEY).toBe("document.authority.v1");

    saveProjectAccessState({ grants: [makeGrant()], updatedAt: "2026-05-24T00:00:00.000Z" });
    expect(loadProjectAccessState().grants[0]).toMatchObject({
      id: "grant-1",
      role: "project_manager"
    });

    saveDocumentAuthorityState({
      authorities: [makeAuthority()],
      updatedAt: "2026-05-24T00:00:00.000Z"
    });
    expect(loadDocumentAuthorityState().authorities[0]).toMatchObject({
      documentId: "doc-1",
      preparedByName: "Prepared User"
    });
  });

  it("normalizes invalid grants defensively", () => {
    expect(
      normalizeProjectAccessGrant({
        role: "bad-role" as never,
        extraPermissions: ["project.read", "project.read", "bad" as never],
        deniedPermissions: ["document.export", "bad" as never],
        active: undefined
      })
    ).toMatchObject({
      role: "viewer",
      extraPermissions: ["project.read"],
      deniedPermissions: ["document.export"],
      active: true
    });

    expect(normalizeProjectAccessState([{ id: "g-1", role: "accounting" }]).grants).toHaveLength(1);
  });
});

describe("project access evaluator", () => {
  beforeEach(resetStorage);

  it("exposes stable role and permission catalogs for Admin Project Access", () => {
    expect(PROJECT_ROLES).toContain("project_manager");
    expect(PROJECT_ROLES).toContain("vendor");
    expect(WORKSPACE_ROLES).toContain("admin");
    expect(WORKSPACE_ROLES).toContain("viewer");
    expect(PROJECT_PERMISSIONS).toContain("document.approve");
    expect(PROJECT_PERMISSIONS).toContain("vendor.respond");

    const permissions = effectivePermissionsForProjectAccessGrant(
      makeGrant({
        role: "viewer",
        extraPermissions: ["document.approve"],
        deniedPermissions: ["document.read"]
      })
    );

    expect(permissions).toContain("document.approve");
    expect(permissions).toContain("project.read");
    expect(permissions).not.toContain("document.read");
  });

  it("lets workspace owner and admin bypass project grants", () => {
    expect(
      evaluateProjectAccess(
        { grants: [], updatedAt: "" },
        { memberId: "missing", workspaceRole: "owner", permission: "settings.manage" }
      )
    ).toMatchObject({ allowed: true, reason: "workspace_admin" });
  });

  it("keeps guarded actions open until project grants are configured", () => {
    expect(
      evaluateProjectAccessGuard(
        { grants: [], updatedAt: "" },
        {
          memberId: "m-1",
          workspaceRole: "member",
          projectId: "p-1",
          permission: "document.submit"
        }
      )
    ).toMatchObject({ allowed: true, reason: "no_configured_grants" });
  });

  it("allows role permissions and blocks denied permissions", () => {
    const state: ProjectAccessState = {
      grants: [makeGrant({ deniedPermissions: ["document.approve"] })],
      updatedAt: ""
    };

    expect(
      evaluateProjectAccess(state, {
        memberId: "m-1",
        workspaceRole: "member",
        projectId: "p-1",
        permission: "procurement.approve"
      })
    ).toMatchObject({ allowed: true, reason: "role_allows" });

    expect(
      evaluateProjectAccess(state, {
        memberId: "m-1",
        workspaceRole: "member",
        projectId: "p-1",
        permission: "document.approve"
      })
    ).toMatchObject({ allowed: false, reason: "denied_permission" });
  });

  it("supports extra permissions and accessible project lists", () => {
    const state = {
      grants: [
        makeGrant({ id: "g-1", projectId: "p-1", role: "viewer", extraPermissions: ["cashflow.read"] }),
        makeGrant({ id: "g-2", projectId: "p-2", role: "viewer", memberId: "m-1" })
      ],
      updatedAt: ""
    };

    expect(
      evaluateProjectAccess(state, {
        memberId: "m-1",
        workspaceRole: "member",
        projectId: "p-1",
        permission: "cashflow.read"
      })
    ).toMatchObject({ allowed: true, reason: "extra_permission" });

    expect(listAccessibleProjectIds(state, { memberId: "m-1", permission: "project.read" })).toEqual([
      "p-1",
      "p-2"
    ]);
  });

  it("omits projects from readable lists when project.read is denied", () => {
    const state = {
      grants: [
        makeGrant({ id: "g-1", projectId: "p-1", role: "viewer" }),
        makeGrant({ id: "g-2", projectId: "p-2", role: "viewer", deniedPermissions: ["project.read"] })
      ],
      updatedAt: ""
    };

    expect(listAccessibleProjectIds(state, { memberId: "m-1", permission: "project.read" })).toEqual([
      "p-1"
    ]);
  });

  it("requires settings.manage for workspace-level export actions once grants exist", () => {
    const state = {
      grants: [makeGrant({ role: "project_manager" })],
      updatedAt: ""
    };

    expect(
      evaluateProjectAccessGuard(state, {
        memberId: "m-1",
        workspaceRole: "member",
        permission: "settings.manage"
      })
    ).toMatchObject({ allowed: false, reason: "no_permission" });

    expect(
      evaluateProjectAccessGuard(state, {
        memberId: "m-1",
        workspaceRole: "admin",
        permission: "settings.manage"
      })
    ).toMatchObject({ allowed: true, reason: "workspace_admin" });
  });

  it("limits vendor grants by supplier", () => {
    const state = {
      grants: [
        makeGrant({
          role: "vendor",
          supplierId: "supplier-1",
          memberId: "vendor-1",
          projectId: "p-1"
        })
      ],
      updatedAt: ""
    };

    expect(
      evaluateProjectAccess(state, {
        memberId: "vendor-1",
        workspaceRole: "vendor",
        projectId: "p-1",
        supplierId: "supplier-1",
        permission: "vendor.respond"
      })
    ).toMatchObject({ allowed: true });

    expect(
      evaluateProjectAccess(state, {
        memberId: "vendor-1",
        workspaceRole: "vendor",
        projectId: "p-1",
        supplierId: "supplier-2",
        permission: "vendor.respond"
      })
    ).toMatchObject({ allowed: false, reason: "supplier_mismatch" });
  });

  it("upserts and removes grants", () => {
    let state: ProjectAccessState = { grants: [], updatedAt: "" };
    state = upsertProjectAccessGrant(state, makeGrant({ id: "g-1" }));
    state = upsertProjectAccessGrant(state, makeGrant({ id: "g-1", role: "viewer" }));
    expect(state.grants).toHaveLength(1);
    expect(state.grants[0].role).toBe("viewer");

    state = removeProjectAccessGrant(state, "g-1");
    expect(state.grants).toHaveLength(0);
  });

  it("provides local actor helpers for app-level project guards", () => {
    const state = {
      grants: [
        makeGrant({
          id: "local-cashflow",
          memberId: "site-manager",
          projectId: "p-1",
          role: "accounting"
        }),
        makeGrant({
          id: "local-report",
          memberId: "site-manager",
          projectId: "p-2",
          role: "viewer"
        })
      ],
      updatedAt: ""
    };

    expect(hasActiveProjectAccessGrants(state)).toBe(true);
    expect(evaluateLocalProjectAccess(state, "cashflow.write", "p-1")).toMatchObject({
      allowed: true,
      reason: "role_allows"
    });
    expect(evaluateLocalProjectAccess(state, "cashflow.write", "p-2")).toMatchObject({
      allowed: false,
      reason: "no_permission"
    });
    expect(listLocalAccessibleProjectIds(state, "report.read")).toEqual(["p-1", "p-2"]);
    expect(getProjectAccessDecisionText({ reason: "no_permission" })).toBe("no permission");
  });

  it("filters project-scoped records only after active grants exist", () => {
    const records = [
      { id: "a", projectId: "p-1" },
      { id: "b", projectId: "p-2" },
      { id: "c", projectId: "" }
    ];

    expect(
      filterProjectScopedRecordsByAccess(
        records,
        { grants: [], updatedAt: "" },
        "procurement.read",
        (record) => record.projectId
      ).map((record) => record.id)
    ).toEqual(["a", "b", "c"]);

    const state = {
      grants: [
        makeGrant({
          id: "local-procurement",
          memberId: "site-manager",
          projectId: "p-1",
          role: "procurement"
        })
      ],
      updatedAt: ""
    };

    expect(
      filterProjectScopedRecordsByAccess(
        records,
        state,
        "procurement.read",
        (record) => record.projectId
      ).map((record) => record.id)
    ).toEqual(["a", "c"]);

    expect(
      filterProjectScopedRecordsByAccess(
        records,
        state,
        "procurement.read",
        (record) => record.projectId,
        { includeUnscoped: false }
      ).map((record) => record.id)
    ).toEqual(["a"]);
  });

  it("maps document authority actions to project permissions", () => {
    expect(projectPermissionForDocumentAuthorityAction("submit")).toBe("document.submit");
    expect(projectPermissionForDocumentAuthorityAction("check")).toBe("document.approve");
    expect(projectPermissionForDocumentAuthorityAction("approve")).toBe("document.approve");
    expect(projectPermissionForDocumentAuthorityAction("issue")).toBe("document.export");
    expect(projectPermissionForDocumentAuthorityAction("void")).toBe("document.write");

    expect(
      evaluateDocumentAuthorityActionAccess(
        {
          grants: [makeGrant({ deniedPermissions: ["document.approve"] })],
          updatedAt: ""
        },
        {
          action: "approve",
          memberId: "m-1",
          workspaceRole: "member",
          projectId: "p-1"
        }
      )
    ).toMatchObject({ allowed: false, reason: "denied_permission" });

    expect(
      evaluateDocumentAuthorityActionAccess(
        {
          grants: [makeGrant({ role: "reviewer" })],
          updatedAt: ""
        },
        {
          action: "issue",
          memberId: "m-1",
          workspaceRole: "member",
          projectId: "p-1"
        }
      )
    ).toMatchObject({ allowed: false, reason: "no_permission" });
  });
});

describe("document authority", () => {
  beforeEach(resetStorage);

  it("ensures one authority record per document", () => {
    let state: DocumentAuthorityState = { authorities: [], updatedAt: "" };
    const first = ensureDocumentAuthority(state, {
      documentId: "doc-1",
      documentNo: "QT-001",
      documentType: "quote",
      projectId: "p-1",
      preparedBy: { actorId: "u-1", actorName: "Issuer" }
    });
    state = first.state;
    const second = ensureDocumentAuthority(state, {
      documentId: "doc-1",
      preparedBy: { actorId: "u-2", actorName: "Other" }
    });

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.authority.preparedByName).toBe("Issuer");
  });

  it("moves through submit, check, approve, and issue with actor stamps", () => {
    let authority = makeAuthority();
    authority = applyDocumentAuthorityAction(authority, "submit", {
      actorId: "u-submit",
      actorName: "Submitter"
    });
    authority = applyDocumentAuthorityAction(authority, "check", {
      actorId: "u-check",
      actorName: "Checker"
    });
    authority = applyDocumentAuthorityAction(authority, "approve", {
      actorId: "u-approve",
      actorName: "Approver"
    });
    authority = applyDocumentAuthorityAction(authority, "issue", {
      actorId: "u-issue",
      actorName: "Issuer"
    });

    expect(authority.status).toBe("issued");
    expect(buildDocumentAuthorityStamp(authority)).toMatchObject({
      preparedBy: "Prepared User",
      checkedBy: "Checker",
      approvedBy: "Approver",
      issuedBy: "Issuer"
    });
  });

  it("enforces document authority state transitions", () => {
    expect(transitionDocumentAuthorityStatus("draft", "submit")).toBe("submitted");
    expect(canApplyDocumentAuthorityAction("draft", "approve")).toBe(false);
    expect(() => transitionDocumentAuthorityStatus("issued", "void")).toThrow(/Illegal/);
  });

  it("voids non-issued documents and supports state CRUD", () => {
    let authority = makeAuthority();
    authority = applyDocumentAuthorityAction(authority, "void", { actorId: "u-1", actorName: "Owner" }, { reason: "duplicate" });
    expect(authority).toMatchObject({ status: "void", voidReason: "duplicate" });

    let state = upsertDocumentAuthority({ authorities: [], updatedAt: "" }, authority);
    expect(state.authorities).toHaveLength(1);
    state = removeDocumentAuthority(state, authority.id);
    expect(state.authorities).toHaveLength(0);
  });

  it("can write authority actions to audit log", () => {
    const authority = applyDocumentAuthorityAction(
      makeAuthority(),
      "submit",
      { actorId: "u-submit", actorName: "Submitter" },
      { writeAudit: true }
    );

    const audit = loadAuditState();
    expect(authority.status).toBe("submitted");
    expect(audit.entries[0]).toMatchObject({
      action: "document_authority.submit",
      targetType: "document",
      targetId: "doc-1"
    });
  });

  it("maps approval decisions to authority submit and approve stamps", () => {
    const result = applyApprovalDecisionToDocumentAuthorityState(
      { authorities: [], updatedAt: "" },
      "approve",
      {
        documentId: "doc-approve",
        documentNo: "PO-001",
        documentType: "purchaseOrder",
        projectId: "p-1",
        approvalRequestId: "approval-po-doc-approve",
        preparedBy: { actorId: "u-request", actorName: "Requester" }
      },
      { actorId: "u-approve", actorName: "Approver" }
    );

    expect(result.authority).toMatchObject({
      documentId: "doc-approve",
      status: "approved",
      submittedByName: "Requester",
      approvedByName: "Approver",
      approvalRequestId: "approval-po-doc-approve"
    });
    expect(result.state.authorities).toHaveLength(1);
  });

  it("maps rejected approval decisions to void authority records", () => {
    const state = upsertDocumentAuthority({ authorities: [], updatedAt: "" }, makeAuthority());
    const result = applyApprovalDecisionToDocumentAuthorityState(
      state,
      "reject",
      {
        documentId: "doc-1",
        documentNo: "QT-2026-001",
        documentType: "quote",
        projectId: "p-1",
        approvalRequestId: "approval-1",
        reason: "revise scope"
      },
      { actorId: "owner", actorName: "Owner" }
    );

    expect(result.authority).toMatchObject({
      status: "void",
      voidReason: "revise scope",
      approvalRequestId: "approval-1"
    });
  });
});
