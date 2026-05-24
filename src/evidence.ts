import { getStorageAdapter, readJson, writeJson } from "./storageAdapter";

export const EVIDENCE_STORAGE_KEY = "evidence.assets.v1";
export const EVIDENCE_APPROVAL_POLICY_STORAGE_KEY = "evidence.approval-policy.v1";
export const MAX_EVIDENCE_FILE_SIZE = 4_000_000;

export type EvidenceAssetType =
  | "receipt"
  | "invoice"
  | "rfq_quote"
  | "delivery_note"
  | "site_photo"
  | "site_360"
  | "site_file"
  | "defect_photo"
  | "contract"
  | "other";

export type EvidenceStatus = "draft" | "verified" | "rejected" | "archived";

export type EvidenceLinkTargetType =
  | "project"
  | "cost_code"
  | "supplier"
  | "pr"
  | "rfq"
  | "cashflow_entry"
  | "document"
  | "defect"
  | "approval"
  | "other";

export type EvidenceLink = {
  id: string;
  targetType: EvidenceLinkTargetType;
  targetId: string;
  label: string;
  createdAt: string;
};

export type EvidenceAsset = {
  id: string;
  workspaceId: string;
  type: EvidenceAssetType;
  status: EvidenceStatus;
  title: string;
  description: string;
  fileName: string;
  mimeType: string;
  size: number;
  /** Base64 data URL — used for local-first fallback when Supabase Storage is unavailable. */
  dataUrl: string;
  /** Supabase Storage bucket name (Sprint 10A). Empty when stored as dataUrl locally. */
  storageBucket: string;
  /** Path inside the bucket: `{workspaceId}/{assetId}/{filename}`. Empty for local-only. */
  storagePath: string;
  amount: number;
  currency: string;
  capturedAt: string;
  uploadedAt: string;
  uploadedBy: string;
  verifiedAt: string;
  verifiedBy: string;
  rejectedReason: string;
  sourceAppId: string;
  sourceDocumentId: string;
  tags: string[];
  links: EvidenceLink[];
  createdAt: string;
  updatedAt: string;
};

export type EvidenceState = {
  assets: EvidenceAsset[];
  updatedAt: string;
};

export type EvidenceAssetInput = Partial<Omit<EvidenceAsset, "links">> & {
  links?: Partial<EvidenceLink>[];
};

export type EvidenceFilter = {
  status?: EvidenceStatus | "all";
  type?: EvidenceAssetType | "all";
  targetType?: EvidenceLinkTargetType | "all";
  targetId?: string;
  projectId?: string;
  supplierId?: string;
  costCodeId?: string;
  search?: string;
  needsReview?: boolean;
};

export type EvidenceSummary = {
  total: number;
  draft: number;
  verified: number;
  rejected: number;
  archived: number;
  receipts: number;
  sitePhotos: number;
  linkedProjects: number;
  linkedCashflow: number;
  linkedProcurement: number;
  unlinked: number;
  totalSize: number;
};

export type EvidenceApprovalTargetType =
  | "pr"
  | "rfq_award"
  | "po"
  | "cashflow_entry"
  | "invoice"
  | "budget_override";

export type EvidenceRequirementTarget = {
  targetType: EvidenceLinkTargetType;
  targetId: string;
  label: string;
  direct: boolean;
};

export type EvidenceTargetCoverage = EvidenceRequirementTarget & {
  total: number;
  verified: number;
  draft: number;
  rejected: number;
  archived: number;
};

export type EvidenceRequirementResult = {
  targets: EvidenceRequirementTarget[];
  coverage: EvidenceTargetCoverage[];
  directTotal: number;
  directVerified: number;
  contextVerified: number;
  totalLinked: number;
  hasDirectVerified: boolean;
  hasAnyVerified: boolean;
  hasAnyEvidence: boolean;
  status: "verified" | "needs_review" | "missing";
};

export type EvidenceApprovalPolicyMode = "off" | "warn" | "block";

export type EvidenceApprovalPolicy = {
  workspaceId: string;
  mode: EvidenceApprovalPolicyMode;
  minimumAmount: number;
  targetTypes: EvidenceApprovalTargetType[];
  updatedAt: string;
};

export type EvidenceApprovalPolicyDecision = {
  applies: boolean;
  mode: EvidenceApprovalPolicyMode;
  blocked: boolean;
  shouldConfirm: boolean;
  reason: "off" | "target_excluded" | "below_threshold" | "verified" | "missing_verified";
};

const assetTypes = new Set<EvidenceAssetType>([
  "receipt",
  "invoice",
  "rfq_quote",
  "delivery_note",
  "site_photo",
  "site_360",
  "site_file",
  "defect_photo",
  "contract",
  "other"
]);

const statuses = new Set<EvidenceStatus>(["draft", "verified", "rejected", "archived"]);

const approvalTargetTypes = new Set<EvidenceApprovalTargetType>([
  "pr",
  "rfq_award",
  "po",
  "cashflow_entry",
  "invoice",
  "budget_override"
]);

const approvalPolicyModes = new Set<EvidenceApprovalPolicyMode>(["off", "warn", "block"]);

export const DEFAULT_EVIDENCE_APPROVAL_POLICY: EvidenceApprovalPolicy = {
  workspaceId: "local-workspace",
  mode: "block",
  minimumAmount: 50000,
  targetTypes: ["pr", "rfq_award", "cashflow_entry"],
  updatedAt: ""
};

const targetTypes = new Set<EvidenceLinkTargetType>([
  "project",
  "cost_code",
  "supplier",
  "pr",
  "rfq",
  "cashflow_entry",
  "document",
  "defect",
  "approval",
  "other"
]);

export const evidenceAssetTypeCopy: Record<EvidenceAssetType, { th: string; en: string }> = {
  receipt: { th: "ใบเสร็จ / สลิป", en: "Receipt" },
  invoice: { th: "Invoice", en: "Invoice" },
  rfq_quote: { th: "ใบเสนอราคา", en: "RFQ quote" },
  delivery_note: { th: "ใบส่งของ", en: "Delivery note" },
  site_photo: { th: "รูปหน้างาน", en: "Site photo" },
  site_360: { th: "360 หน้างาน", en: "Site 360" },
  site_file: { th: "ไฟล์หน้างาน", en: "Site file" },
  defect_photo: { th: "รูป Defect", en: "Defect photo" },
  contract: { th: "สัญญา", en: "Contract" },
  other: { th: "อื่น ๆ", en: "Other" }
};

export const evidenceStatusCopy: Record<EvidenceStatus, { th: string; en: string }> = {
  draft: { th: "รอตรวจ", en: "Draft" },
  verified: { th: "ตรวจแล้ว", en: "Verified" },
  rejected: { th: "ตีกลับ", en: "Rejected" },
  archived: { th: "เก็บถาวร", en: "Archived" }
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

function normalizeAmount(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
}

function normalizeSize(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

function normalizeAssetType(value: unknown): EvidenceAssetType {
  return typeof value === "string" && assetTypes.has(value as EvidenceAssetType)
    ? (value as EvidenceAssetType)
    : "other";
}

function normalizeStatus(value: unknown): EvidenceStatus {
  return typeof value === "string" && statuses.has(value as EvidenceStatus)
    ? (value as EvidenceStatus)
    : "draft";
}

function normalizeApprovalTargetType(value: unknown): EvidenceApprovalTargetType {
  return typeof value === "string" && approvalTargetTypes.has(value as EvidenceApprovalTargetType)
    ? (value as EvidenceApprovalTargetType)
    : "pr";
}

function normalizePolicyMode(value: unknown): EvidenceApprovalPolicyMode {
  return typeof value === "string" && approvalPolicyModes.has(value as EvidenceApprovalPolicyMode)
    ? (value as EvidenceApprovalPolicyMode)
    : DEFAULT_EVIDENCE_APPROVAL_POLICY.mode;
}

function normalizePolicyTargetTypes(value: unknown): EvidenceApprovalTargetType[] {
  if (!Array.isArray(value)) return [...DEFAULT_EVIDENCE_APPROVAL_POLICY.targetTypes];
  const normalized = Array.from(
    new Set(
      value
        .map((targetType) => normalizeApprovalTargetType(targetType))
        .filter((targetType) => approvalTargetTypes.has(targetType))
    )
  );
  return normalized.length > 0 ? normalized : [...DEFAULT_EVIDENCE_APPROVAL_POLICY.targetTypes];
}

function normalizeTargetType(value: unknown): EvidenceLinkTargetType {
  return typeof value === "string" && targetTypes.has(value as EvidenceLinkTargetType)
    ? (value as EvidenceLinkTargetType)
    : "other";
}

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .filter((tag): tag is string => typeof tag === "string")
        .map((tag) => tag.trim())
        .filter(Boolean)
    )
  );
}

export function normalizeEvidenceLink(input: Partial<EvidenceLink>, index = 0): EvidenceLink {
  const targetType = normalizeTargetType(input.targetType);
  const targetId = normalizeString(input.targetId);
  const label = normalizeString(input.label) || targetId || targetType;
  return {
    id: normalizeString(input.id) || createId("evidence-link", index),
    targetType,
    targetId,
    label,
    createdAt: normalizeString(input.createdAt) || nowIso()
  };
}

export function normalizeEvidenceAsset(input: EvidenceAssetInput, index = 0): EvidenceAsset {
  const now = nowIso();
  const type = normalizeAssetType(input.type);
  const fileName = normalizeString(input.fileName);
  const title = normalizeString(input.title) || fileName || evidenceAssetTypeCopy[type].en;

  return {
    id: normalizeString(input.id) || createId("evidence", index),
    workspaceId: normalizeString(input.workspaceId) || "local-workspace",
    type,
    status: normalizeStatus(input.status),
    title,
    description: normalizeString(input.description),
    fileName,
    mimeType: normalizeString(input.mimeType),
    size: normalizeSize(input.size),
    dataUrl: normalizeString(input.dataUrl),
    storageBucket: normalizeString(input.storageBucket),
    storagePath: normalizeString(input.storagePath),
    amount: normalizeAmount(input.amount),
    currency: normalizeString(input.currency) || "THB",
    capturedAt: normalizeString(input.capturedAt),
    uploadedAt: normalizeString(input.uploadedAt) || now,
    uploadedBy: normalizeString(input.uploadedBy),
    verifiedAt: normalizeString(input.verifiedAt),
    verifiedBy: normalizeString(input.verifiedBy),
    rejectedReason: normalizeString(input.rejectedReason),
    sourceAppId: normalizeString(input.sourceAppId),
    sourceDocumentId: normalizeString(input.sourceDocumentId),
    tags: normalizeTags(input.tags),
    links: Array.isArray(input.links)
      ? input.links
          .map((link, linkIndex) => normalizeEvidenceLink((link ?? {}) as Partial<EvidenceLink>, linkIndex))
          .filter((link) => link.targetId)
      : [],
    createdAt: normalizeString(input.createdAt) || now,
    updatedAt: normalizeString(input.updatedAt) || now
  };
}

export function normalizeEvidenceState(input: unknown): EvidenceState {
  if (Array.isArray(input)) {
    return {
      assets: input.map((asset, index) =>
        normalizeEvidenceAsset((asset ?? {}) as EvidenceAssetInput, index)
      ),
      updatedAt: nowIso()
    };
  }

  if (input && typeof input === "object") {
    const raw = input as Partial<EvidenceState> & { assets?: unknown };
    return {
      assets: Array.isArray(raw.assets)
        ? raw.assets.map((asset, index) =>
            normalizeEvidenceAsset((asset ?? {}) as EvidenceAssetInput, index)
          )
        : [],
      updatedAt: normalizeString(raw.updatedAt)
    };
  }

  return { assets: [], updatedAt: "" };
}

export function loadEvidenceState(): EvidenceState {
  return readJson<EvidenceState>(
    getStorageAdapter(),
    EVIDENCE_STORAGE_KEY,
    { assets: [], updatedAt: "" },
    normalizeEvidenceState
  );
}

export function saveEvidenceState(state: EvidenceState): void {
  writeJson(getStorageAdapter(), EVIDENCE_STORAGE_KEY, normalizeEvidenceState(state));
}

export function normalizeEvidenceApprovalPolicy(input: unknown): EvidenceApprovalPolicy {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ...DEFAULT_EVIDENCE_APPROVAL_POLICY };
  }
  const raw = input as Partial<EvidenceApprovalPolicy>;
  return {
    workspaceId: normalizeString(raw.workspaceId) || DEFAULT_EVIDENCE_APPROVAL_POLICY.workspaceId,
    mode: normalizePolicyMode(raw.mode),
    minimumAmount: normalizeAmount(raw.minimumAmount),
    targetTypes: normalizePolicyTargetTypes(raw.targetTypes),
    updatedAt: normalizeString(raw.updatedAt)
  };
}

export function loadEvidenceApprovalPolicy(): EvidenceApprovalPolicy {
  return readJson<EvidenceApprovalPolicy>(
    getStorageAdapter(),
    EVIDENCE_APPROVAL_POLICY_STORAGE_KEY,
    DEFAULT_EVIDENCE_APPROVAL_POLICY,
    normalizeEvidenceApprovalPolicy
  );
}

export function saveEvidenceApprovalPolicy(policy: EvidenceApprovalPolicy): void {
  writeJson(
    getStorageAdapter(),
    EVIDENCE_APPROVAL_POLICY_STORAGE_KEY,
    normalizeEvidenceApprovalPolicy({ ...policy, updatedAt: nowIso() })
  );
}

export function createEvidenceAsset(input: EvidenceAssetInput): EvidenceAsset {
  return normalizeEvidenceAsset({
    ...input,
    id: input.id || createId("evidence"),
    status: input.status ?? "draft",
    createdAt: input.createdAt || nowIso(),
    updatedAt: nowIso()
  });
}

export function validateEvidenceAsset(input: EvidenceAssetInput): string[] {
  const errors: string[] = [];
  const title = normalizeString(input.title) || normalizeString(input.fileName);
  if (!title) errors.push("title or fileName is required");
  if (input.size !== undefined && normalizeSize(input.size) > MAX_EVIDENCE_FILE_SIZE) {
    errors.push(`file size must be <= ${MAX_EVIDENCE_FILE_SIZE} bytes`);
  }
  if (input.amount !== undefined && normalizeAmount(input.amount) !== input.amount) {
    errors.push("amount must be a non-negative number");
  }
  return errors;
}

export function upsertEvidenceAsset(state: EvidenceState, asset: EvidenceAssetInput): EvidenceState {
  const normalized = normalizeEvidenceAsset({
    ...asset,
    updatedAt: nowIso()
  });
  const exists = state.assets.some((entry) => entry.id === normalized.id);
  return {
    assets: exists
      ? state.assets.map((entry) => (entry.id === normalized.id ? normalized : entry))
      : [normalized, ...state.assets],
    updatedAt: nowIso()
  };
}

export function removeEvidenceAsset(state: EvidenceState, assetId: string): EvidenceState {
  return {
    assets: state.assets.filter((asset) => asset.id !== assetId),
    updatedAt: nowIso()
  };
}

export function setEvidenceStatus(
  state: EvidenceState,
  assetId: string,
  status: EvidenceStatus,
  actor = "",
  reason = ""
): EvidenceState {
  return {
    assets: state.assets.map((asset) => {
      if (asset.id !== assetId) return asset;
      const next = {
        ...asset,
        status,
        updatedAt: nowIso()
      };
      if (status === "verified") {
        next.verifiedAt = nowIso();
        next.verifiedBy = actor;
        next.rejectedReason = "";
      }
      if (status === "rejected") {
        next.rejectedReason = reason;
      }
      return next;
    }),
    updatedAt: nowIso()
  };
}

export function addEvidenceLink(
  state: EvidenceState,
  assetId: string,
  link: Partial<EvidenceLink>
): EvidenceState {
  const normalizedLink = normalizeEvidenceLink(link);
  if (!normalizedLink.targetId) return state;

  return {
    assets: state.assets.map((asset) => {
      if (asset.id !== assetId) return asset;
      const duplicate = asset.links.some(
        (existing) =>
          existing.targetType === normalizedLink.targetType &&
          existing.targetId === normalizedLink.targetId
      );
      return {
        ...asset,
        links: duplicate ? asset.links : [...asset.links, normalizedLink],
        updatedAt: nowIso()
      };
    }),
    updatedAt: nowIso()
  };
}

export function removeEvidenceLink(state: EvidenceState, assetId: string, linkId: string): EvidenceState {
  return {
    assets: state.assets.map((asset) =>
      asset.id === assetId
        ? {
            ...asset,
            links: asset.links.filter((link) => link.id !== linkId),
            updatedAt: nowIso()
          }
        : asset
    ),
    updatedAt: nowIso()
  };
}

function assetHasLink(asset: EvidenceAsset, targetType: EvidenceLinkTargetType, targetId?: string) {
  return asset.links.some(
    (link) => link.targetType === targetType && (!targetId || link.targetId === targetId)
  );
}

function matchesSearch(asset: EvidenceAsset, search: string) {
  const needle = search.trim().toLocaleLowerCase();
  if (!needle) return true;
  return [
    asset.title,
    asset.description,
    asset.fileName,
    asset.sourceAppId,
    asset.sourceDocumentId,
    ...asset.tags,
    ...asset.links.map((link) => `${link.label} ${link.targetType} ${link.targetId}`)
  ]
    .join(" ")
    .toLocaleLowerCase()
    .includes(needle);
}

export function filterEvidenceAssets(state: EvidenceState, filter: EvidenceFilter = {}): EvidenceAsset[] {
  return state.assets.filter((asset) => {
    if (filter.status && filter.status !== "all" && asset.status !== filter.status) return false;
    if (filter.type && filter.type !== "all" && asset.type !== filter.type) return false;
    if (filter.needsReview && asset.status !== "draft" && asset.status !== "rejected") return false;
    if (filter.targetType && filter.targetType !== "all" && !assetHasLink(asset, filter.targetType, filter.targetId)) {
      return false;
    }
    if (filter.projectId && !assetHasLink(asset, "project", filter.projectId)) return false;
    if (filter.supplierId && !assetHasLink(asset, "supplier", filter.supplierId)) return false;
    if (filter.costCodeId && !assetHasLink(asset, "cost_code", filter.costCodeId)) return false;
    if (filter.search && !matchesSearch(asset, filter.search)) return false;
    return true;
  });
}

export function collectEvidenceForTarget(
  state: EvidenceState,
  targetType: EvidenceLinkTargetType,
  targetId: string
): EvidenceAsset[] {
  return filterEvidenceAssets(state, { targetType, targetId });
}

export function summarizeEvidenceState(state: EvidenceState): EvidenceSummary {
  const linkedProjects = new Set<string>();
  return state.assets.reduce<EvidenceSummary>(
    (summary, asset) => {
      summary.total += 1;
      summary[asset.status] += 1;
      summary.totalSize += asset.size;
      if (asset.type === "receipt" || asset.type === "invoice") summary.receipts += 1;
      if (asset.type === "site_photo" || asset.type === "defect_photo") summary.sitePhotos += 1;
      if (asset.links.length === 0) summary.unlinked += 1;
      for (const link of asset.links) {
        if (link.targetType === "project") linkedProjects.add(link.targetId);
        if (link.targetType === "cashflow_entry") summary.linkedCashflow += 1;
        if (link.targetType === "pr" || link.targetType === "rfq") summary.linkedProcurement += 1;
      }
      summary.linkedProjects = linkedProjects.size;
      return summary;
    },
    {
      total: 0,
      draft: 0,
      verified: 0,
      rejected: 0,
      archived: 0,
      receipts: 0,
      sitePhotos: 0,
      linkedProjects: 0,
      linkedCashflow: 0,
      linkedProcurement: 0,
      unlinked: 0,
      totalSize: 0
    }
  );
}

function addRequirementTarget(
  targets: EvidenceRequirementTarget[],
  targetType: EvidenceLinkTargetType,
  targetId: string,
  label: string,
  direct: boolean
) {
  const normalizedTargetId = normalizeString(targetId);
  if (!normalizedTargetId) return;
  const exists = targets.some(
    (target) => target.targetType === targetType && target.targetId === normalizedTargetId
  );
  if (exists) return;
  targets.push({ targetType, targetId: normalizedTargetId, label, direct });
}

export function buildEvidenceTargetsForApproval(input: {
  targetType: EvidenceApprovalTargetType;
  targetId: string;
  projectId?: string;
  costCodeId?: string;
  supplierId?: string;
}): EvidenceRequirementTarget[] {
  const targets: EvidenceRequirementTarget[] = [];
  const targetId = normalizeString(input.targetId);
  const projectId = normalizeString(input.projectId);
  const costCodeId = normalizeString(input.costCodeId);
  const supplierId = normalizeString(input.supplierId);

  if (input.targetType === "pr") {
    addRequirementTarget(targets, "pr", targetId, "Purchase Request", true);
  } else if (input.targetType === "rfq_award") {
    addRequirementTarget(targets, "rfq", targetId, "RFQ award", true);
  } else if (input.targetType === "cashflow_entry") {
    addRequirementTarget(targets, "cashflow_entry", targetId, "Cashflow entry", true);
  } else if (input.targetType === "po" || input.targetType === "invoice") {
    addRequirementTarget(targets, "document", targetId, input.targetType.toUpperCase(), true);
  }

  addRequirementTarget(targets, "project", projectId, "Project", false);
  addRequirementTarget(targets, "cost_code", costCodeId, "Cost Code", false);
  addRequirementTarget(targets, "supplier", supplierId, "Supplier", false);

  return targets;
}

export function evaluateEvidenceRequirement(
  state: EvidenceState,
  targets: EvidenceRequirementTarget[]
): EvidenceRequirementResult {
  const normalizedState = normalizeEvidenceState(state);
  const coverage = targets.map<EvidenceTargetCoverage>((target) => {
    const linkedAssets = collectEvidenceForTarget(
      normalizedState,
      target.targetType,
      target.targetId
    );
    return linkedAssets.reduce<EvidenceTargetCoverage>(
      (summary, asset) => {
        summary.total += 1;
        summary[asset.status] += 1;
        return summary;
      },
      {
        ...target,
        total: 0,
        verified: 0,
        draft: 0,
        rejected: 0,
        archived: 0
      }
    );
  });
  const direct = coverage.filter((target) => target.direct);
  const context = coverage.filter((target) => !target.direct);
  const directTotal = direct.reduce((sum, target) => sum + target.total, 0);
  const directVerified = direct.reduce((sum, target) => sum + target.verified, 0);
  const contextVerified = context.reduce((sum, target) => sum + target.verified, 0);
  const totalLinked = coverage.reduce((sum, target) => sum + target.total, 0);
  const hasDirectVerified = directVerified > 0;
  const hasAnyVerified = directVerified + contextVerified > 0;
  const hasAnyEvidence = totalLinked > 0;

  return {
    targets,
    coverage,
    directTotal,
    directVerified,
    contextVerified,
    totalLinked,
    hasDirectVerified,
    hasAnyVerified,
    hasAnyEvidence,
    status: hasDirectVerified ? "verified" : hasAnyEvidence ? "needs_review" : "missing"
  };
}

export function evaluateEvidenceApprovalPolicy(
  policyInput: EvidenceApprovalPolicy,
  request: { targetType: EvidenceApprovalTargetType; amount: number },
  evidence: EvidenceRequirementResult
): EvidenceApprovalPolicyDecision {
  const policy = normalizeEvidenceApprovalPolicy(policyInput);
  const targetType = normalizeApprovalTargetType(request.targetType);
  const amount = normalizeAmount(request.amount);

  if (policy.mode === "off") {
    return { applies: false, mode: "off", blocked: false, shouldConfirm: false, reason: "off" };
  }
  if (!policy.targetTypes.includes(targetType)) {
    return {
      applies: false,
      mode: policy.mode,
      blocked: false,
      shouldConfirm: false,
      reason: "target_excluded"
    };
  }
  if (amount < policy.minimumAmount) {
    return {
      applies: false,
      mode: policy.mode,
      blocked: false,
      shouldConfirm: false,
      reason: "below_threshold"
    };
  }
  if (evidence.hasDirectVerified) {
    return {
      applies: true,
      mode: policy.mode,
      blocked: false,
      shouldConfirm: false,
      reason: "verified"
    };
  }

  return {
    applies: true,
    mode: policy.mode,
    blocked: policy.mode === "block",
    shouldConfirm: policy.mode === "warn",
    reason: "missing_verified"
  };
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export async function createEvidenceAssetFromFile(
  file: File,
  input: EvidenceAssetInput = {}
): Promise<EvidenceAsset> {
  if (file.size > MAX_EVIDENCE_FILE_SIZE) {
    throw new Error(`file size must be <= ${MAX_EVIDENCE_FILE_SIZE} bytes`);
  }
  const dataUrl = await readFileAsDataUrl(file);
  return createEvidenceAsset({
    ...input,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    dataUrl,
    title: input.title || file.name,
    capturedAt: input.capturedAt || nowIso()
  });
}

/**
 * Cloud-first variant of `createEvidenceAssetFromFile`. When Supabase
 * Storage is available, uploads the file to the `evidence-files` bucket
 * and stores only the storage path on the asset (no base64 in
 * localStorage — keeps the workspace cache small + lets multiple devices
 * see the same file).
 *
 * Falls back to local dataUrl when:
 *   - Supabase isn't configured (offline-first dev)
 *   - upload fails (network blip — caller can retry next intake)
 *
 * The caller decides which factory to use based on `isStorageAvailable()`
 * and whether the user is signed in. UI components should prefer this
 * one so mobile capture works without filling localStorage with 5MB
 * base64 blobs.
 */
export async function createEvidenceAssetFromFileWithCloud(
  file: File,
  input: EvidenceAssetInput = {},
  uploadFn: (
    workspaceId: string,
    assetId: string,
    file: File
  ) => Promise<{ bucket: string; path: string }>
): Promise<EvidenceAsset> {
  if (file.size > MAX_EVIDENCE_FILE_SIZE) {
    throw new Error(`file size must be <= ${MAX_EVIDENCE_FILE_SIZE} bytes`);
  }
  const workspaceId = normalizeString(input.workspaceId) || "local-workspace";
  // Allocate an id up front so we can build a deterministic storage path
  const assetId = normalizeString(input.id) || createId("evidence", 0);
  try {
    const result = await uploadFn(workspaceId, assetId, file);
    return createEvidenceAsset({
      ...input,
      id: assetId,
      workspaceId,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      // No dataUrl — file is in cloud storage; UI reads via signed URL
      dataUrl: "",
      storageBucket: result.bucket,
      storagePath: result.path,
      title: input.title || file.name,
      capturedAt: input.capturedAt || nowIso()
    });
  } catch (error) {
    // Cloud upload failed → fall back to local dataUrl so the user
    // doesn't lose their capture. Sprint 10B sync will retry on
    // reconnect.
    const dataUrl = await readFileAsDataUrl(file);
    return createEvidenceAsset({
      ...input,
      id: assetId,
      workspaceId,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      dataUrl,
      storageBucket: "",
      storagePath: "",
      title: input.title || file.name,
      capturedAt: input.capturedAt || nowIso(),
      // Tag so the relational mapper knows this row still needs a re-upload
      tags: [...(input.tags ?? []), "pending-cloud-upload"]
    });
  }
}
