import { appendAuditEntry } from "./membership";
import { defaultStorageAdapter, readJson, writeJson } from "./storageAdapter";

export const PROJECT_ACCESS_STORAGE_KEY = "project-access.grants.v1";
export const DOCUMENT_AUTHORITY_STORAGE_KEY = "document.authority.v1";

export type WorkspaceRole =
  | "owner"
  | "admin"
  | "member"
  | "reviewer"
  | "vendor"
  | "support_operator"
  | "viewer";

export type ProjectRole =
  | "owner"
  | "admin"
  | "project_manager"
  | "procurement"
  | "accounting"
  | "reviewer"
  | "vendor"
  | "viewer"
  | "member"
  | "support_operator";

export type ProjectPermission =
  | "project.read"
  | "project.write"
  | "project.admin"
  | "document.read"
  | "document.write"
  | "document.submit"
  | "document.approve"
  | "document.export"
  | "procurement.read"
  | "procurement.write"
  | "procurement.approve"
  | "cashflow.read"
  | "cashflow.write"
  | "cashflow.approve"
  | "evidence.read"
  | "evidence.write"
  | "report.read"
  | "vendor.respond"
  | "settings.manage";

export type ProjectAccessGrant = {
  id: string;
  workspaceId: string;
  projectId: string;
  memberId: string;
  memberName: string;
  role: ProjectRole;
  supplierId: string;
  extraPermissions: ProjectPermission[];
  deniedPermissions: ProjectPermission[];
  active: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectAccessState = {
  grants: ProjectAccessGrant[];
  updatedAt: string;
};

export type ProjectAccessDecision = {
  allowed: boolean;
  reason:
    | "workspace_admin"
    | "no_configured_grants"
    | "role_allows"
    | "extra_permission"
    | "denied_permission"
    | "supplier_mismatch"
    | "no_active_grant"
    | "no_permission";
  matchedGrantIds: string[];
  permissions: ProjectPermission[];
};

export type DocumentAuthorityStatus =
  | "draft"
  | "submitted"
  | "checked"
  | "approved"
  | "issued"
  | "void";

export type DocumentAuthorityAction = "submit" | "check" | "approve" | "issue" | "void";

export type AuthorityActor = {
  actorId: string;
  actorName: string;
};

export type DocumentAuthorityRecord = {
  id: string;
  workspaceId: string;
  documentId: string;
  documentNo: string;
  documentType: string;
  projectId: string;
  status: DocumentAuthorityStatus;
  preparedById: string;
  preparedByName: string;
  submittedById: string;
  submittedByName: string;
  checkedById: string;
  checkedByName: string;
  approvedById: string;
  approvedByName: string;
  issuedById: string;
  issuedByName: string;
  submittedAt: string;
  checkedAt: string;
  approvedAt: string;
  issuedAt: string;
  approvalRequestId: string;
  voidReason: string;
  createdAt: string;
  updatedAt: string;
};

export type DocumentAuthorityState = {
  authorities: DocumentAuthorityRecord[];
  updatedAt: string;
};

export const PROJECT_ROLES: ProjectRole[] = [
  "owner",
  "admin",
  "project_manager",
  "procurement",
  "accounting",
  "reviewer",
  "vendor",
  "viewer",
  "member",
  "support_operator"
];

export const WORKSPACE_ROLES: WorkspaceRole[] = [
  "owner",
  "admin",
  "member",
  "reviewer",
  "vendor",
  "support_operator",
  "viewer"
];

export const PROJECT_PERMISSIONS: ProjectPermission[] = [
  "project.read",
  "project.write",
  "project.admin",
  "document.read",
  "document.write",
  "document.submit",
  "document.approve",
  "document.export",
  "procurement.read",
  "procurement.write",
  "procurement.approve",
  "cashflow.read",
  "cashflow.write",
  "cashflow.approve",
  "evidence.read",
  "evidence.write",
  "report.read",
  "vendor.respond",
  "settings.manage"
];

export const LOCAL_PROJECT_ACCESS_ACTOR: {
  memberId: string;
  memberName: string;
  workspaceRole: WorkspaceRole;
} = {
  memberId: "site-manager",
  memberName: "Site Manager",
  workspaceRole: "member"
};

const projectRoles = new Set<ProjectRole>(PROJECT_ROLES);

const workspaceRoles = new Set<WorkspaceRole>(WORKSPACE_ROLES);

const projectPermissions = new Set<ProjectPermission>(PROJECT_PERMISSIONS);

const authorityStatuses = new Set<DocumentAuthorityStatus>([
  "draft",
  "submitted",
  "checked",
  "approved",
  "issued",
  "void"
]);

export const PROJECT_ROLE_PERMISSIONS: Record<ProjectRole, ProjectPermission[]> = {
  owner: [...projectPermissions],
  admin: [...projectPermissions],
  project_manager: [
    "project.read",
    "project.write",
    "document.read",
    "document.write",
    "document.submit",
    "document.approve",
    "document.export",
    "procurement.read",
    "procurement.write",
    "procurement.approve",
    "cashflow.read",
    "evidence.read",
    "evidence.write",
    "report.read"
  ],
  procurement: [
    "project.read",
    "document.read",
    "procurement.read",
    "procurement.write",
    "evidence.read",
    "evidence.write",
    "report.read",
    "vendor.respond"
  ],
  accounting: [
    "project.read",
    "document.read",
    "document.export",
    "cashflow.read",
    "cashflow.write",
    "cashflow.approve",
    "evidence.read",
    "report.read"
  ],
  reviewer: [
    "project.read",
    "document.read",
    "document.approve",
    "procurement.read",
    "procurement.approve",
    "cashflow.read",
    "cashflow.approve",
    "evidence.read",
    "report.read"
  ],
  vendor: [
    "project.read",
    "document.read",
    "procurement.read",
    "vendor.respond",
    "evidence.read",
    "evidence.write"
  ],
  viewer: ["project.read", "document.read", "evidence.read", "report.read"],
  member: [
    "project.read",
    "project.write",
    "document.read",
    "document.write",
    "document.submit",
    "procurement.read",
    "procurement.write",
    "cashflow.read",
    "cashflow.write",
    "evidence.read",
    "evidence.write",
    "report.read"
  ],
  support_operator: ["project.read", "document.read", "evidence.read", "report.read"]
};

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

function normalizeProjectRole(value: unknown): ProjectRole {
  return typeof value === "string" && projectRoles.has(value as ProjectRole)
    ? (value as ProjectRole)
    : "viewer";
}

function normalizeWorkspaceRole(value: unknown): WorkspaceRole {
  return typeof value === "string" && workspaceRoles.has(value as WorkspaceRole)
    ? (value as WorkspaceRole)
    : "viewer";
}

function normalizePermission(value: unknown): ProjectPermission | null {
  return typeof value === "string" && projectPermissions.has(value as ProjectPermission)
    ? (value as ProjectPermission)
    : null;
}

function normalizePermissions(value: unknown): ProjectPermission[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map(normalizePermission).filter(Boolean))) as ProjectPermission[];
}

function normalizeAuthorityStatus(value: unknown): DocumentAuthorityStatus {
  return typeof value === "string" && authorityStatuses.has(value as DocumentAuthorityStatus)
    ? (value as DocumentAuthorityStatus)
    : "draft";
}

export function permissionsForProjectRole(role: ProjectRole): ProjectPermission[] {
  return [...PROJECT_ROLE_PERMISSIONS[normalizeProjectRole(role)]];
}

export function normalizeProjectAccessGrant(
  grant: Partial<ProjectAccessGrant>,
  index = 0
): ProjectAccessGrant {
  const now = nowIso();
  return {
    id: normalizeString(grant.id) || createId("project-grant", index),
    workspaceId: normalizeString(grant.workspaceId) || "local-workspace",
    projectId: normalizeString(grant.projectId),
    memberId: normalizeString(grant.memberId),
    memberName: normalizeString(grant.memberName),
    role: normalizeProjectRole(grant.role),
    supplierId: normalizeString(grant.supplierId),
    extraPermissions: normalizePermissions(grant.extraPermissions),
    deniedPermissions: normalizePermissions(grant.deniedPermissions),
    active: grant.active !== false,
    createdBy: normalizeString(grant.createdBy),
    createdAt: normalizeString(grant.createdAt) || now,
    updatedAt: normalizeString(grant.updatedAt) || now
  };
}

export function normalizeProjectAccessState(input: unknown): ProjectAccessState {
  if (Array.isArray(input)) {
    return {
      grants: input.map((grant, index) =>
        normalizeProjectAccessGrant((grant ?? {}) as Partial<ProjectAccessGrant>, index)
      ),
      updatedAt: nowIso()
    };
  }

  if (input && typeof input === "object") {
    const raw = input as Partial<ProjectAccessState>;
    return {
      grants: Array.isArray(raw.grants)
        ? raw.grants.map((grant, index) =>
            normalizeProjectAccessGrant((grant ?? {}) as Partial<ProjectAccessGrant>, index)
          )
        : [],
      updatedAt: normalizeString(raw.updatedAt) || nowIso()
    };
  }

  return { grants: [], updatedAt: "" };
}

export function loadProjectAccessState(): ProjectAccessState {
  return readJson<ProjectAccessState>(
    defaultStorageAdapter,
    PROJECT_ACCESS_STORAGE_KEY,
    { grants: [], updatedAt: "" },
    normalizeProjectAccessState
  );
}

export function saveProjectAccessState(state: ProjectAccessState): void {
  writeJson(defaultStorageAdapter, PROJECT_ACCESS_STORAGE_KEY, normalizeProjectAccessState(state));
}

export function createProjectAccessGrant(input: Partial<ProjectAccessGrant>): ProjectAccessGrant {
  return normalizeProjectAccessGrant(input);
}

export function upsertProjectAccessGrant(
  state: ProjectAccessState,
  grant: Partial<ProjectAccessGrant>
): ProjectAccessState {
  const normalizedState = normalizeProjectAccessState(state);
  const normalizedGrant = normalizeProjectAccessGrant({
    ...grant,
    updatedAt: nowIso()
  });
  const existing = normalizedState.grants.some((item) => item.id === normalizedGrant.id);
  return {
    grants: existing
      ? normalizedState.grants.map((item) => (item.id === normalizedGrant.id ? normalizedGrant : item))
      : [normalizedGrant, ...normalizedState.grants],
    updatedAt: nowIso()
  };
}

export function removeProjectAccessGrant(state: ProjectAccessState, grantId: string): ProjectAccessState {
  const normalizedState = normalizeProjectAccessState(state);
  const id = normalizeString(grantId);
  return {
    grants: normalizedState.grants.filter((grant) => grant.id !== id),
    updatedAt: nowIso()
  };
}

export function effectivePermissionsForProjectAccessGrant(grant: ProjectAccessGrant): ProjectPermission[] {
  const permissions = new Set<ProjectPermission>(PROJECT_ROLE_PERMISSIONS[grant.role]);
  for (const permission of grant.extraPermissions) permissions.add(permission);
  for (const permission of grant.deniedPermissions) permissions.delete(permission);
  return [...permissions];
}

function effectivePermissionsForGrant(grant: ProjectAccessGrant): ProjectPermission[] {
  return effectivePermissionsForProjectAccessGrant(grant);
}

function isProjectMatch(grant: ProjectAccessGrant, projectId: string) {
  return !grant.projectId || !projectId || grant.projectId === projectId;
}

function isSupplierMatch(grant: ProjectAccessGrant, permission: ProjectPermission, supplierId: string) {
  if (!grant.supplierId) return true;
  if (supplierId) return grant.supplierId === supplierId;
  return permission === "project.read" || permission === "document.read" || permission === "evidence.read";
}

export function evaluateProjectAccess(
  state: ProjectAccessState,
  request: {
    memberId: string;
    workspaceRole?: WorkspaceRole;
    projectId?: string;
    supplierId?: string;
    permission: ProjectPermission;
  }
): ProjectAccessDecision {
  const workspaceRole = normalizeWorkspaceRole(request.workspaceRole);
  const permission = normalizePermission(request.permission) ?? "project.read";
  if (workspaceRole === "owner" || workspaceRole === "admin") {
    return {
      allowed: true,
      reason: "workspace_admin",
      matchedGrantIds: [],
      permissions: [...projectPermissions]
    };
  }

  const memberId = normalizeString(request.memberId);
  const projectId = normalizeString(request.projectId);
  const supplierId = normalizeString(request.supplierId);
  const grants = normalizeProjectAccessState(state).grants.filter(
    (grant) => grant.active && grant.memberId === memberId && isProjectMatch(grant, projectId)
  );

  if (grants.length === 0) {
    return { allowed: false, reason: "no_active_grant", matchedGrantIds: [], permissions: [] };
  }

  const supplierMatches = grants.filter((grant) => isSupplierMatch(grant, permission, supplierId));
  if (supplierMatches.length === 0) {
    return {
      allowed: false,
      reason: "supplier_mismatch",
      matchedGrantIds: grants.map((grant) => grant.id),
      permissions: []
    };
  }

  const deniedGrant = supplierMatches.find((grant) => grant.deniedPermissions.includes(permission));
  if (deniedGrant) {
    return {
      allowed: false,
      reason: "denied_permission",
      matchedGrantIds: [deniedGrant.id],
      permissions: effectivePermissionsForGrant(deniedGrant)
    };
  }

  for (const grant of supplierMatches) {
    const permissions = effectivePermissionsForGrant(grant);
    if (permissions.includes(permission)) {
      return {
        allowed: true,
        reason: grant.extraPermissions.includes(permission) ? "extra_permission" : "role_allows",
        matchedGrantIds: [grant.id],
        permissions
      };
    }
  }

  return {
    allowed: false,
    reason: "no_permission",
    matchedGrantIds: supplierMatches.map((grant) => grant.id),
    permissions: Array.from(new Set(supplierMatches.flatMap(effectivePermissionsForGrant)))
  };
}

export function evaluateProjectAccessGuard(
  state: ProjectAccessState,
  request: {
    memberId: string;
    workspaceRole?: WorkspaceRole;
    projectId?: string;
    supplierId?: string;
    permission: ProjectPermission;
    allowWhenUnconfigured?: boolean;
  }
): ProjectAccessDecision {
  const normalizedState = normalizeProjectAccessState(state);
  const shouldAllowWhenUnconfigured = request.allowWhenUnconfigured !== false;

  if (shouldAllowWhenUnconfigured && normalizedState.grants.every((grant) => !grant.active)) {
    return {
      allowed: true,
      reason: "no_configured_grants",
      matchedGrantIds: [],
      permissions: [...projectPermissions]
    };
  }

  return evaluateProjectAccess(normalizedState, request);
}

export function projectPermissionForDocumentAuthorityAction(
  action: DocumentAuthorityAction
): ProjectPermission {
  if (action === "submit") return "document.submit";
  if (action === "check" || action === "approve") return "document.approve";
  if (action === "issue") return "document.export";
  return "document.write";
}

export function evaluateDocumentAuthorityActionAccess(
  state: ProjectAccessState,
  request: {
    action: DocumentAuthorityAction;
    memberId: string;
    workspaceRole?: WorkspaceRole;
    projectId?: string;
    supplierId?: string;
    allowWhenUnconfigured?: boolean;
  }
): ProjectAccessDecision {
  return evaluateProjectAccessGuard(state, {
    memberId: request.memberId,
    workspaceRole: request.workspaceRole,
    projectId: request.projectId,
    supplierId: request.supplierId,
    permission: projectPermissionForDocumentAuthorityAction(request.action),
    allowWhenUnconfigured: request.allowWhenUnconfigured
  });
}

export function listAccessibleProjectIds(
  state: ProjectAccessState,
  request: { memberId: string; workspaceRole?: WorkspaceRole; permission?: ProjectPermission }
): string[] {
  const workspaceRole = normalizeWorkspaceRole(request.workspaceRole);
  if (workspaceRole === "owner" || workspaceRole === "admin") return ["*"];
  const permission = normalizePermission(request.permission) ?? "project.read";
  const memberId = normalizeString(request.memberId);
  const ids = normalizeProjectAccessState(state).grants
    .filter((grant) => grant.active && grant.memberId === memberId)
    .filter((grant) => effectivePermissionsForGrant(grant).includes(permission))
    .map((grant) => grant.projectId || "*");
  return Array.from(new Set(ids));
}

export const PROJECT_ACCESS_DECISION_LABELS: Record<ProjectAccessDecision["reason"], string> = {
  workspace_admin: "workspace admin",
  no_configured_grants: "no configured grants",
  role_allows: "role allows",
  extra_permission: "extra permission",
  denied_permission: "denied permission",
  supplier_mismatch: "supplier mismatch",
  no_active_grant: "no active grant",
  no_permission: "no permission"
};

export function getProjectAccessDecisionText(decision: Pick<ProjectAccessDecision, "reason">) {
  return PROJECT_ACCESS_DECISION_LABELS[decision.reason] ?? decision.reason;
}

export function hasActiveProjectAccessGrants(state: ProjectAccessState) {
  return normalizeProjectAccessState(state).grants.some((grant) => grant.active);
}

export function evaluateLocalProjectAccess(
  state: ProjectAccessState,
  permission: ProjectPermission,
  projectId?: string,
  supplierId?: string
): ProjectAccessDecision {
  return evaluateProjectAccessGuard(state, {
    memberId: LOCAL_PROJECT_ACCESS_ACTOR.memberId,
    workspaceRole: LOCAL_PROJECT_ACCESS_ACTOR.workspaceRole,
    projectId,
    supplierId,
    permission
  });
}

export function listLocalAccessibleProjectIds(
  state: ProjectAccessState,
  permission: ProjectPermission = "project.read"
) {
  return listAccessibleProjectIds(state, {
    memberId: LOCAL_PROJECT_ACCESS_ACTOR.memberId,
    workspaceRole: LOCAL_PROJECT_ACCESS_ACTOR.workspaceRole,
    permission
  });
}

export function filterProjectScopedRecordsByAccess<T>(
  records: T[],
  state: ProjectAccessState,
  permission: ProjectPermission,
  getProjectId: (record: T) => string | undefined,
  options: { includeUnscoped?: boolean } = {}
): T[] {
  if (!hasActiveProjectAccessGrants(state)) return records;
  const accessibleProjectIds = listLocalAccessibleProjectIds(state, permission);
  if (accessibleProjectIds.includes("*")) return records;
  const projectIdSet = new Set(accessibleProjectIds);
  const includeUnscoped = options.includeUnscoped !== false;
  return records.filter((record) => {
    const projectId = normalizeString(getProjectId(record));
    if (!projectId) return includeUnscoped;
    return projectIdSet.has(projectId);
  });
}

export function normalizeDocumentAuthorityRecord(
  record: Partial<DocumentAuthorityRecord>,
  index = 0
): DocumentAuthorityRecord {
  const now = nowIso();
  const documentId = normalizeString(record.documentId);
  return {
    id: normalizeString(record.id) || (documentId ? `authority-${documentId}` : createId("authority", index)),
    workspaceId: normalizeString(record.workspaceId) || "local-workspace",
    documentId,
    documentNo: normalizeString(record.documentNo),
    documentType: normalizeString(record.documentType),
    projectId: normalizeString(record.projectId),
    status: normalizeAuthorityStatus(record.status),
    preparedById: normalizeString(record.preparedById),
    preparedByName: normalizeString(record.preparedByName),
    submittedById: normalizeString(record.submittedById),
    submittedByName: normalizeString(record.submittedByName),
    checkedById: normalizeString(record.checkedById),
    checkedByName: normalizeString(record.checkedByName),
    approvedById: normalizeString(record.approvedById),
    approvedByName: normalizeString(record.approvedByName),
    issuedById: normalizeString(record.issuedById),
    issuedByName: normalizeString(record.issuedByName),
    submittedAt: normalizeString(record.submittedAt),
    checkedAt: normalizeString(record.checkedAt),
    approvedAt: normalizeString(record.approvedAt),
    issuedAt: normalizeString(record.issuedAt),
    approvalRequestId: normalizeString(record.approvalRequestId),
    voidReason: normalizeString(record.voidReason),
    createdAt: normalizeString(record.createdAt) || now,
    updatedAt: normalizeString(record.updatedAt) || now
  };
}

export function normalizeDocumentAuthorityState(input: unknown): DocumentAuthorityState {
  if (Array.isArray(input)) {
    return {
      authorities: input.map((record, index) =>
        normalizeDocumentAuthorityRecord((record ?? {}) as Partial<DocumentAuthorityRecord>, index)
      ),
      updatedAt: nowIso()
    };
  }

  if (input && typeof input === "object") {
    const raw = input as Partial<DocumentAuthorityState>;
    return {
      authorities: Array.isArray(raw.authorities)
        ? raw.authorities.map((record, index) =>
            normalizeDocumentAuthorityRecord((record ?? {}) as Partial<DocumentAuthorityRecord>, index)
          )
        : [],
      updatedAt: normalizeString(raw.updatedAt) || nowIso()
    };
  }

  return { authorities: [], updatedAt: "" };
}

export function loadDocumentAuthorityState(): DocumentAuthorityState {
  return readJson<DocumentAuthorityState>(
    defaultStorageAdapter,
    DOCUMENT_AUTHORITY_STORAGE_KEY,
    { authorities: [], updatedAt: "" },
    normalizeDocumentAuthorityState
  );
}

export function saveDocumentAuthorityState(state: DocumentAuthorityState): void {
  writeJson(defaultStorageAdapter, DOCUMENT_AUTHORITY_STORAGE_KEY, normalizeDocumentAuthorityState(state));
}

export function createDocumentAuthority(
  input: Partial<DocumentAuthorityRecord> & { preparedBy?: AuthorityActor }
): DocumentAuthorityRecord {
  return normalizeDocumentAuthorityRecord({
    ...input,
    preparedById: input.preparedById ?? input.preparedBy?.actorId,
    preparedByName: input.preparedByName ?? input.preparedBy?.actorName,
    status: input.status ?? "draft"
  });
}

export function upsertDocumentAuthority(
  state: DocumentAuthorityState,
  record: Partial<DocumentAuthorityRecord>
): DocumentAuthorityState {
  const normalizedState = normalizeDocumentAuthorityState(state);
  const normalizedRecord = normalizeDocumentAuthorityRecord({ ...record, updatedAt: nowIso() });
  const existing = normalizedState.authorities.some((item) => item.id === normalizedRecord.id);
  return {
    authorities: existing
      ? normalizedState.authorities.map((item) => (item.id === normalizedRecord.id ? normalizedRecord : item))
      : [normalizedRecord, ...normalizedState.authorities],
    updatedAt: nowIso()
  };
}

export function ensureDocumentAuthority(
  state: DocumentAuthorityState,
  input: {
    workspaceId?: string;
    documentId: string;
    documentNo?: string;
    documentType?: string;
    projectId?: string;
    preparedBy?: AuthorityActor;
  }
): { state: DocumentAuthorityState; authority: DocumentAuthorityRecord; created: boolean } {
  const normalizedState = normalizeDocumentAuthorityState(state);
  const documentId = normalizeString(input.documentId);
  const existing = normalizedState.authorities.find((record) => record.documentId === documentId);
  if (existing) return { state: normalizedState, authority: existing, created: false };

  const authority = createDocumentAuthority({
    workspaceId: input.workspaceId,
    documentId,
    documentNo: input.documentNo,
    documentType: input.documentType,
    projectId: input.projectId,
    preparedBy: input.preparedBy
  });
  return {
    state: upsertDocumentAuthority(normalizedState, authority),
    authority,
    created: true
  };
}

export function removeDocumentAuthority(state: DocumentAuthorityState, authorityId: string): DocumentAuthorityState {
  const normalizedState = normalizeDocumentAuthorityState(state);
  const id = normalizeString(authorityId);
  return {
    authorities: normalizedState.authorities.filter((record) => record.id !== id),
    updatedAt: nowIso()
  };
}

export function transitionDocumentAuthorityStatus(
  status: DocumentAuthorityStatus,
  action: DocumentAuthorityAction
): DocumentAuthorityStatus {
  if (action === "submit" && status === "draft") return "submitted";
  if (action === "check" && status === "submitted") return "checked";
  if (action === "approve" && (status === "submitted" || status === "checked")) return "approved";
  if (action === "issue" && status === "approved") return "issued";
  if (action === "void" && status !== "issued" && status !== "void") return "void";
  throw new Error(`Illegal document authority action: ${status} -> ${action}`);
}

export function canApplyDocumentAuthorityAction(
  status: DocumentAuthorityStatus,
  action: DocumentAuthorityAction
): boolean {
  try {
    transitionDocumentAuthorityStatus(status, action);
    return true;
  } catch {
    return false;
  }
}

export function applyDocumentAuthorityAction(
  record: DocumentAuthorityRecord,
  action: DocumentAuthorityAction,
  actor: AuthorityActor,
  options: { approvalRequestId?: string; reason?: string; writeAudit?: boolean } = {}
): DocumentAuthorityRecord {
  const normalized = normalizeDocumentAuthorityRecord(record);
  const actorId = normalizeString(actor.actorId);
  const actorName = normalizeString(actor.actorName) || actorId;
  const nextStatus = transitionDocumentAuthorityStatus(normalized.status, action);
  const now = nowIso();
  const next: DocumentAuthorityRecord = {
    ...normalized,
    status: nextStatus,
    updatedAt: now,
    approvalRequestId: normalizeString(options.approvalRequestId) || normalized.approvalRequestId
  };

  if (action === "submit") {
    next.submittedById = actorId;
    next.submittedByName = actorName;
    next.submittedAt = now;
  } else if (action === "check") {
    next.checkedById = actorId;
    next.checkedByName = actorName;
    next.checkedAt = now;
  } else if (action === "approve") {
    next.approvedById = actorId;
    next.approvedByName = actorName;
    next.approvedAt = now;
  } else if (action === "issue") {
    next.issuedById = actorId;
    next.issuedByName = actorName;
    next.issuedAt = now;
  } else if (action === "void") {
    next.voidReason = normalizeString(options.reason);
  }

  if (options.writeAudit) {
    appendAuditEntry({
      action: `document_authority.${action}`,
      actorType: "user",
      actorId,
      targetType: "document",
      targetId: next.documentId,
      payload: {
        documentNo: next.documentNo,
        fromStatus: normalized.status,
        toStatus: next.status,
        approvalRequestId: next.approvalRequestId
      }
    });
  }

  return next;
}

export function applyApprovalDecisionToDocumentAuthorityState(
  state: DocumentAuthorityState,
  decision: "approve" | "reject",
  input: {
    documentId: string;
    documentNo: string;
    documentType: string;
    projectId?: string;
    approvalRequestId?: string;
    preparedBy?: AuthorityActor;
    reason?: string;
  },
  actor: AuthorityActor,
  options: { writeAudit?: boolean } = {}
): { state: DocumentAuthorityState; authority: DocumentAuthorityRecord } {
  const preparedBy = input.preparedBy ?? actor;
  const ensured = ensureDocumentAuthority(state, {
    documentId: input.documentId,
    documentNo: input.documentNo,
    documentType: input.documentType,
    projectId: input.projectId,
    preparedBy
  });
  let authority: DocumentAuthorityRecord = {
    ...ensured.authority,
    documentNo: normalizeString(input.documentNo) || ensured.authority.documentNo,
    documentType: normalizeString(input.documentType) || ensured.authority.documentType,
    projectId: normalizeString(input.projectId) || ensured.authority.projectId,
    approvalRequestId: normalizeString(input.approvalRequestId) || ensured.authority.approvalRequestId,
    preparedById: ensured.authority.preparedById || normalizeString(preparedBy.actorId),
    preparedByName:
      ensured.authority.preparedByName ||
      normalizeString(preparedBy.actorName) ||
      normalizeString(preparedBy.actorId)
  };

  if (decision === "approve") {
    if (authority.status === "draft") {
      authority = applyDocumentAuthorityAction(authority, "submit", preparedBy, {
        approvalRequestId: input.approvalRequestId,
        writeAudit: options.writeAudit
      });
    }
    if (authority.status === "submitted" || authority.status === "checked") {
      authority = applyDocumentAuthorityAction(authority, "approve", actor, {
        approvalRequestId: input.approvalRequestId,
        writeAudit: options.writeAudit
      });
    }
  } else if (authority.status !== "void" && authority.status !== "issued") {
    authority = applyDocumentAuthorityAction(authority, "void", actor, {
      approvalRequestId: input.approvalRequestId,
      reason: input.reason,
      writeAudit: options.writeAudit
    });
  }

  const nextState = upsertDocumentAuthority(ensured.state, authority);
  return { state: nextState, authority: normalizeDocumentAuthorityRecord(authority) };
}

export function buildDocumentAuthorityStamp(record: DocumentAuthorityRecord) {
  const normalized = normalizeDocumentAuthorityRecord(record);
  return {
    status: normalized.status,
    preparedBy: normalized.preparedByName || "-",
    submittedBy: normalized.submittedByName || "-",
    checkedBy: normalized.checkedByName || "-",
    approvedBy: normalized.approvedByName || "-",
    issuedBy: normalized.issuedByName || "-",
    approvedAt: normalized.approvedAt,
    issuedAt: normalized.issuedAt
  };
}
