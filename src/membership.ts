import {
  getWorkspaceApp,
  workspaceApps,
  type WorkspaceAppAccessLevel,
  type WorkspaceAppId,
  type WorkspaceAppMonetization
} from "./apps";
import { defaultStorageAdapter, readJson, writeJson } from "./storageAdapter";

// ---------------------------------------------------------------------------
// Storage keys (kept separate from other app keys per PRD)
// ---------------------------------------------------------------------------

export const MEMBERSHIP_PLANS_STORAGE_KEY = "membership.plans.v1";
export const MEMBERSHIP_SUBSCRIPTION_STORAGE_KEY = "membership.subscription.v1";
export const MEMBERSHIP_AUDIT_STORAGE_KEY = "membership.audit.v1";

const AUDIT_LOG_CAP = 200;
const DEFAULT_CURRENCY = "THB";
const DEFAULT_PROVIDER = "manual";

// ---------------------------------------------------------------------------
// Re-exported types from ./apps (so callers can import everything from here)
// ---------------------------------------------------------------------------

export type { WorkspaceAppAccessLevel, WorkspaceAppId, WorkspaceAppMonetization };

// ---------------------------------------------------------------------------
// Domain types — mirror PLATFORM_ERD.md entities
// ---------------------------------------------------------------------------

export type PlanBillingInterval = "monthly" | "yearly" | "one_time" | "none";
export type SubscriptionStatus = "trial" | "active" | "past_due" | "cancelled" | "none";
export type AccessOverrideEffect = "allow" | "deny";

export type Plan = {
  id: string;
  name: string;
  description: string;
  priceAmount: number;
  currency: string;
  billingInterval: PlanBillingInterval;
  supportQuota: number;
  billingNote: string;
  status: "active" | "draft" | "archived";
  createdAt: string;
  updatedAt: string;
};

export type AppAccessRule = {
  id: string;
  planId: string;
  appId: WorkspaceAppId;
  featureKey: string;
  accessLevel: WorkspaceAppAccessLevel;
  enabled: boolean;
  limits: Record<string, number>;
  priority: number;
  startsAt: string;
  endsAt: string;
};

export type AppAccessOverride = {
  id: string;
  scope: "workspace" | "member" | "user";
  scopeId: string;
  appId: WorkspaceAppId;
  featureKey: string;
  effect: AccessOverrideEffect;
  accessLevel: WorkspaceAppAccessLevel;
  limits: Record<string, number>;
  reason: string;
  createdBy: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
};

export type Subscription = {
  id: string;
  planId: string;
  status: SubscriptionStatus;
  startedAt: string;
  currentPeriodEnd: string;
  provider: string;
  providerRef: string;
  note: string;
};

export type AuditLogEntry = {
  id: string;
  action: string;
  actorType: "user" | "admin" | "agent" | "system";
  actorId: string;
  targetType: string;
  targetId: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

// ---------------------------------------------------------------------------
// Storage state shapes
// ---------------------------------------------------------------------------

export type PlansState = {
  plans: Plan[];
  rules: AppAccessRule[];
  overrides: AppAccessOverride[];
  updatedAt: string;
};

export type SubscriptionState = {
  current: Subscription | null;
  updatedAt: string;
};

export type AuditState = {
  entries: AuditLogEntry[];
  updatedAt: string;
};

// ---------------------------------------------------------------------------
// ID + value helpers
// ---------------------------------------------------------------------------

function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

const VALID_ACCESS_LEVELS: ReadonlySet<WorkspaceAppAccessLevel> = new Set<WorkspaceAppAccessLevel>([
  "none",
  "preview",
  "quick",
  "saved",
  "read",
  "write",
  "export",
  "admin",
  "support"
]);

const VALID_APP_IDS: ReadonlySet<WorkspaceAppId> = new Set<WorkspaceAppId>(
  workspaceApps.map((app) => app.id)
);

const VALID_BILLING_INTERVALS: ReadonlySet<PlanBillingInterval> = new Set<PlanBillingInterval>([
  "monthly",
  "yearly",
  "one_time",
  "none"
]);

const VALID_SUBSCRIPTION_STATUSES: ReadonlySet<SubscriptionStatus> = new Set<SubscriptionStatus>([
  "trial",
  "active",
  "past_due",
  "cancelled",
  "none"
]);

const VALID_PLAN_STATUSES: ReadonlySet<Plan["status"]> = new Set<Plan["status"]>([
  "active",
  "draft",
  "archived"
]);

const VALID_OVERRIDE_SCOPES: ReadonlySet<AppAccessOverride["scope"]> = new Set<
  AppAccessOverride["scope"]
>(["workspace", "member", "user"]);

const VALID_ACTOR_TYPES: ReadonlySet<AuditLogEntry["actorType"]> = new Set<
  AuditLogEntry["actorType"]
>(["user", "admin", "agent", "system"]);

function normalizeAccessLevel(
  value: unknown,
  fallback: WorkspaceAppAccessLevel = "none"
): WorkspaceAppAccessLevel {
  if (typeof value === "string" && VALID_ACCESS_LEVELS.has(value as WorkspaceAppAccessLevel)) {
    return value as WorkspaceAppAccessLevel;
  }
  return fallback;
}

function normalizeAppId(value: unknown, fallback: WorkspaceAppId = "hub"): WorkspaceAppId {
  if (typeof value === "string" && VALID_APP_IDS.has(value as WorkspaceAppId)) {
    return value as WorkspaceAppId;
  }
  return fallback;
}

function normalizeBillingInterval(value: unknown): PlanBillingInterval {
  if (typeof value === "string" && VALID_BILLING_INTERVALS.has(value as PlanBillingInterval)) {
    return value as PlanBillingInterval;
  }
  return "none";
}

function normalizeSubscriptionStatus(value: unknown): SubscriptionStatus {
  if (typeof value === "string" && VALID_SUBSCRIPTION_STATUSES.has(value as SubscriptionStatus)) {
    return value as SubscriptionStatus;
  }
  return "none";
}

function normalizePlanStatus(value: unknown): Plan["status"] {
  if (typeof value === "string" && VALID_PLAN_STATUSES.has(value as Plan["status"])) {
    return value as Plan["status"];
  }
  return "draft";
}

function normalizeOverrideScope(value: unknown): AppAccessOverride["scope"] {
  if (typeof value === "string" && VALID_OVERRIDE_SCOPES.has(value as AppAccessOverride["scope"])) {
    return value as AppAccessOverride["scope"];
  }
  return "workspace";
}

function normalizeOverrideEffect(value: unknown): AccessOverrideEffect {
  return value === "deny" ? "deny" : "allow";
}

function normalizeActorType(value: unknown): AuditLogEntry["actorType"] {
  if (typeof value === "string" && VALID_ACTOR_TYPES.has(value as AuditLogEntry["actorType"])) {
    return value as AuditLogEntry["actorType"];
  }
  return "system";
}

function normalizeNonNegativeNumber(value: unknown, fallback = 0): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return value < 0 ? 0 : value;
}

function normalizeInteger(value: unknown, fallback = 0): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.trunc(value);
}

function normalizeLimits(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object") {
    return {};
  }
  const result: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!key) continue;
    if (typeof raw === "number" && Number.isFinite(raw)) {
      result[key] = raw;
    } else if (typeof raw === "string" && raw.trim() !== "" && Number.isFinite(Number(raw))) {
      result[key] = Number(raw);
    }
  }
  return result;
}

function normalizePayload(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return { ...(value as Record<string, unknown>) };
}

function normalizeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    return value.trim();
  }
  return fallback;
}

// ---------------------------------------------------------------------------
// Normalizers
// ---------------------------------------------------------------------------

function normalizePlan(plan: Partial<Plan>, index = 0): Plan {
  const now = nowIso();
  const id = normalizeString(plan.id) || createId("plan");

  return {
    id,
    name: normalizeString(plan.name) || `Plan ${index + 1}`,
    description: normalizeString(plan.description),
    priceAmount: normalizeNonNegativeNumber(plan.priceAmount),
    currency: normalizeString(plan.currency) || DEFAULT_CURRENCY,
    billingInterval: normalizeBillingInterval(plan.billingInterval),
    supportQuota: normalizeInteger(plan.supportQuota, 0),
    billingNote: normalizeString(plan.billingNote),
    status: normalizePlanStatus(plan.status),
    createdAt: plan.createdAt ?? now,
    updatedAt: plan.updatedAt ?? now
  };
}

function normalizeAppAccessRule(rule: Partial<AppAccessRule>, index = 0): AppAccessRule {
  const appId = normalizeAppId(rule.appId);
  return {
    id: normalizeString(rule.id) || createId(`rule-${index}`),
    planId: normalizeString(rule.planId),
    appId,
    featureKey: normalizeString(rule.featureKey),
    accessLevel: normalizeAccessLevel(rule.accessLevel, "none"),
    enabled: rule.enabled !== false,
    limits: normalizeLimits(rule.limits),
    priority: normalizeInteger(rule.priority, 0),
    startsAt: normalizeString(rule.startsAt),
    endsAt: normalizeString(rule.endsAt)
  };
}

function normalizeAppAccessOverride(
  override: Partial<AppAccessOverride>,
  index = 0
): AppAccessOverride {
  const now = nowIso();
  return {
    id: normalizeString(override.id) || createId(`override-${index}`),
    scope: normalizeOverrideScope(override.scope),
    scopeId: normalizeString(override.scopeId),
    appId: normalizeAppId(override.appId),
    featureKey: normalizeString(override.featureKey),
    effect: normalizeOverrideEffect(override.effect),
    accessLevel: normalizeAccessLevel(override.accessLevel, "none"),
    limits: normalizeLimits(override.limits),
    reason: normalizeString(override.reason),
    createdBy: normalizeString(override.createdBy),
    startsAt: normalizeString(override.startsAt),
    endsAt: normalizeString(override.endsAt),
    createdAt: override.createdAt ?? now
  };
}

function normalizeSubscription(subscription: Partial<Subscription> | null): Subscription | null {
  if (!subscription || typeof subscription !== "object") {
    return null;
  }
  const now = nowIso();
  return {
    id: normalizeString(subscription.id) || createId("sub"),
    planId: normalizeString(subscription.planId),
    status: normalizeSubscriptionStatus(subscription.status),
    startedAt: subscription.startedAt ?? now,
    currentPeriodEnd: normalizeString(subscription.currentPeriodEnd),
    provider: normalizeString(subscription.provider) || DEFAULT_PROVIDER,
    providerRef: normalizeString(subscription.providerRef),
    note: normalizeString(subscription.note)
  };
}

function normalizeAuditEntry(entry: Partial<AuditLogEntry>, index = 0): AuditLogEntry {
  const now = nowIso();
  return {
    id: normalizeString(entry.id) || createId(`audit-${index}`),
    action: normalizeString(entry.action) || "unknown",
    actorType: normalizeActorType(entry.actorType),
    actorId: normalizeString(entry.actorId),
    targetType: normalizeString(entry.targetType),
    targetId: normalizeString(entry.targetId),
    payload: normalizePayload(entry.payload),
    createdAt: entry.createdAt ?? now
  };
}

function normalizePlansState(input: unknown): PlansState {
  const now = nowIso();
  if (!input || typeof input !== "object") {
    return { plans: [], rules: [], overrides: [], updatedAt: "" };
  }
  const raw = input as Partial<PlansState> & {
    plans?: unknown;
    rules?: unknown;
    overrides?: unknown;
  };

  return {
    plans: Array.isArray(raw.plans)
      ? raw.plans.map((plan, index) =>
          normalizePlan((plan ?? {}) as Partial<Plan>, index)
        )
      : [],
    rules: Array.isArray(raw.rules)
      ? raw.rules.map((rule, index) =>
          normalizeAppAccessRule((rule ?? {}) as Partial<AppAccessRule>, index)
        )
      : [],
    overrides: Array.isArray(raw.overrides)
      ? raw.overrides.map((override, index) =>
          normalizeAppAccessOverride((override ?? {}) as Partial<AppAccessOverride>, index)
        )
      : [],
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : now
  };
}

function normalizeSubscriptionState(input: unknown): SubscriptionState {
  if (!input || typeof input !== "object") {
    return { current: null, updatedAt: "" };
  }
  const raw = input as Partial<SubscriptionState>;
  return {
    current: normalizeSubscription((raw.current ?? null) as Partial<Subscription> | null),
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : nowIso()
  };
}

function normalizeAuditState(input: unknown): AuditState {
  if (!input || typeof input !== "object") {
    return { entries: [], updatedAt: "" };
  }
  const raw = input as Partial<AuditState>;
  return {
    entries: Array.isArray(raw.entries)
      ? raw.entries
          .map((entry, index) =>
            normalizeAuditEntry((entry ?? {}) as Partial<AuditLogEntry>, index)
          )
          .slice(0, AUDIT_LOG_CAP)
      : [],
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : ""
  };
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

/**
 * Produce the initial Plans state used when nothing is in storage.
 *
 * Seeds three plans:
 *   - "free"            — every app at access "quick" (free tier)
 *   - "support_monthly" — every app at access "write" (paid 290 THB/month)
 *   - "custom"          — admin-defined; no rules created by default
 *
 * One AppAccessRule per app is generated for the first two plans
 * (one rule per app, featureKey="" meaning whole-app scope). No overrides.
 */
export function seedPlans(): PlansState {
  const now = nowIso();

  const freePlan: Plan = normalizePlan({
    id: "plan-free",
    name: "Free",
    description: "Free tier — quick mode across public apps, no saved data.",
    priceAmount: 0,
    currency: DEFAULT_CURRENCY,
    billingInterval: "none",
    supportQuota: 0,
    billingNote: "",
    status: "active",
    createdAt: now,
    updatedAt: now
  });

  const supportPlan: Plan = normalizePlan({
    id: "plan-support-monthly",
    name: "Support Monthly",
    description: "Monthly support plan — write access across most apps + support quota.",
    priceAmount: 290,
    currency: DEFAULT_CURRENCY,
    billingInterval: "monthly",
    supportQuota: 10,
    billingNote: "PromptPay / manual transfer",
    status: "active",
    createdAt: now,
    updatedAt: now
  });

  const customPlan: Plan = normalizePlan({
    id: "plan-custom",
    name: "Custom",
    description: "Admin-defined plan — rules configured per workspace/client.",
    priceAmount: 0,
    currency: DEFAULT_CURRENCY,
    billingInterval: "one_time",
    supportQuota: 0,
    billingNote: "Custom — manual",
    status: "draft",
    createdAt: now,
    updatedAt: now
  });

  const rules: AppAccessRule[] = [];

  // Free plan: every app available at "quick" by default (preview/read for non-free apps)
  for (const app of workspaceApps) {
    const isFreeApp = app.monetization === "free";
    rules.push(
      normalizeAppAccessRule({
        id: `rule-free-${app.id}`,
        planId: freePlan.id,
        appId: app.id,
        featureKey: "",
        accessLevel: isFreeApp ? "quick" : "preview",
        enabled: true,
        limits: {},
        priority: 10,
        startsAt: "",
        endsAt: ""
      })
    );
  }

  // Support plan: write across most apps
  for (const app of workspaceApps) {
    rules.push(
      normalizeAppAccessRule({
        id: `rule-support-${app.id}`,
        planId: supportPlan.id,
        appId: app.id,
        featureKey: "",
        accessLevel: "write",
        enabled: true,
        limits: { exports_per_month: 50, ai_runs_per_month: 200 },
        priority: 20,
        startsAt: "",
        endsAt: ""
      })
    );
  }

  // Custom plan: no rules by default — admin builds it.

  return {
    plans: [freePlan, supportPlan, customPlan],
    rules,
    overrides: [],
    updatedAt: now
  };
}

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

export function loadPlansState(): PlansState {
  return readJson<PlansState>(
    defaultStorageAdapter,
    MEMBERSHIP_PLANS_STORAGE_KEY,
    seedPlans(),
    (raw) => {
      const normalized = normalizePlansState(raw);
      // If storage was wiped to an empty shell, fall back to seed.
      if (
        normalized.plans.length === 0 &&
        normalized.rules.length === 0 &&
        normalized.overrides.length === 0
      ) {
        return seedPlans();
      }
      return normalized;
    }
  );
}

export function savePlansState(state: PlansState): void {
  writeJson(defaultStorageAdapter, MEMBERSHIP_PLANS_STORAGE_KEY, normalizePlansState(state));
}

function defaultSubscriptionState(): SubscriptionState {
  // v0.1 dev/dogfood: seed Support Monthly so all workspace apps are usable out of the box.
  // Users can switch to Free at /support-plans to verify the access gate behavior.
  const now = nowIso();
  return {
    current: normalizeSubscription({
      id: "default",
      planId: "plan-support-monthly",
      status: "active",
      startedAt: now,
      currentPeriodEnd: "",
      provider: DEFAULT_PROVIDER,
      providerRef: "",
      note: "default v0.1 dev seed (Support Monthly)"
    }),
    updatedAt: now
  };
}

export function loadSubscriptionState(): SubscriptionState {
  return readJson<SubscriptionState>(
    defaultStorageAdapter,
    MEMBERSHIP_SUBSCRIPTION_STORAGE_KEY,
    defaultSubscriptionState(),
    (raw) => {
      const normalized = normalizeSubscriptionState(raw);
      if (!normalized.current) {
        return defaultSubscriptionState();
      }
      return normalized;
    }
  );
}

export function saveSubscriptionState(state: SubscriptionState): void {
  writeJson(
    defaultStorageAdapter,
    MEMBERSHIP_SUBSCRIPTION_STORAGE_KEY,
    normalizeSubscriptionState(state)
  );
}

export function loadAuditState(): AuditState {
  return readJson<AuditState>(
    defaultStorageAdapter,
    MEMBERSHIP_AUDIT_STORAGE_KEY,
    { entries: [], updatedAt: "" },
    (raw) => normalizeAuditState(raw)
  );
}

function saveAuditState(state: AuditState): void {
  writeJson(defaultStorageAdapter, MEMBERSHIP_AUDIT_STORAGE_KEY, normalizeAuditState(state));
}

export function appendAuditEntry(entry: Partial<AuditLogEntry>): void {
  const current = loadAuditState();
  const normalized = normalizeAuditEntry({
    ...entry,
    id: entry.id ?? createId("audit"),
    createdAt: entry.createdAt ?? nowIso()
  });

  const nextEntries = [normalized, ...current.entries].slice(0, AUDIT_LOG_CAP);

  saveAuditState({
    entries: nextEntries,
    updatedAt: nowIso()
  });
}

// ---------------------------------------------------------------------------
// CRUD helpers
// ---------------------------------------------------------------------------

export function upsertPlan(state: PlansState, plan: Partial<Plan>): PlansState {
  const baseState = normalizePlansState(state);
  const now = nowIso();
  const normalized = normalizePlan({
    ...plan,
    id: plan.id ?? createId("plan"),
    updatedAt: now
  });
  const hasExisting = baseState.plans.some((item) => item.id === normalized.id);

  return normalizePlansState({
    plans: hasExisting
      ? baseState.plans.map((item) => (item.id === normalized.id ? normalized : item))
      : [normalized, ...baseState.plans],
    rules: baseState.rules,
    overrides: baseState.overrides,
    updatedAt: now
  });
}

export function upsertAppAccessRule(
  state: PlansState,
  rule: Partial<AppAccessRule>
): PlansState {
  const baseState = normalizePlansState(state);
  const now = nowIso();
  const normalized = normalizeAppAccessRule({
    ...rule,
    id: rule.id ?? createId("rule")
  });
  const hasExisting = baseState.rules.some((item) => item.id === normalized.id);

  return normalizePlansState({
    plans: baseState.plans,
    rules: hasExisting
      ? baseState.rules.map((item) => (item.id === normalized.id ? normalized : item))
      : [normalized, ...baseState.rules],
    overrides: baseState.overrides,
    updatedAt: now
  });
}

export function upsertAppAccessOverride(
  state: PlansState,
  override: Partial<AppAccessOverride>
): PlansState {
  const baseState = normalizePlansState(state);
  const now = nowIso();
  const normalized = normalizeAppAccessOverride({
    ...override,
    id: override.id ?? createId("override"),
    createdAt: override.createdAt ?? now
  });
  const hasExisting = baseState.overrides.some((item) => item.id === normalized.id);

  return normalizePlansState({
    plans: baseState.plans,
    rules: baseState.rules,
    overrides: hasExisting
      ? baseState.overrides.map((item) => (item.id === normalized.id ? normalized : item))
      : [normalized, ...baseState.overrides],
    updatedAt: now
  });
}

export function activateSubscription(
  planId: string,
  opts: { provider?: string; note?: string } = {}
): SubscriptionState {
  const now = nowIso();
  const current = loadSubscriptionState().current;
  const nextSubscription = normalizeSubscription({
    id: current?.id || createId("sub"),
    planId,
    status: "active",
    startedAt: now,
    currentPeriodEnd: "",
    provider: opts.provider ?? current?.provider ?? DEFAULT_PROVIDER,
    providerRef: current?.providerRef ?? "",
    note: opts.note ?? ""
  });

  const nextState: SubscriptionState = {
    current: nextSubscription,
    updatedAt: now
  };

  saveSubscriptionState(nextState);

  appendAuditEntry({
    action: "subscription.changed",
    actorType: "admin",
    actorId: "",
    targetType: "subscription",
    targetId: nextSubscription?.id ?? "",
    payload: {
      planId,
      previousPlanId: current?.planId ?? "",
      provider: nextSubscription?.provider ?? DEFAULT_PROVIDER,
      note: opts.note ?? ""
    }
  });

  return nextState;
}

// ---------------------------------------------------------------------------
// Access evaluation — implements MEMBERSHIP_ACCESS_PRD.md Section 5
// ---------------------------------------------------------------------------

export type AccessDecision = {
  allow: boolean;
  accessLevel: WorkspaceAppAccessLevel;
  limits: Record<string, number>;
  reason:
    | "override_deny"
    | "override_allow"
    | "plan_rule"
    | "default_free"
    | "no_rule"
    | "platform_owner";
  source: "override" | "plan" | "default" | "owner";
};

function isWithinWindow(startsAt: string, endsAt: string, nowMs: number): boolean {
  if (startsAt) {
    const start = Date.parse(startsAt);
    if (Number.isFinite(start) && nowMs < start) {
      return false;
    }
  }
  if (endsAt) {
    const end = Date.parse(endsAt);
    if (Number.isFinite(end) && nowMs > end) {
      return false;
    }
  }
  return true;
}

function overrideMatches(
  override: AppAccessOverride,
  appId: WorkspaceAppId,
  featureKey: string,
  scopeIds: { workspaceId: string; memberId: string; userId: string }
): boolean {
  if (override.appId !== appId) {
    return false;
  }
  // Whole-app overrides (featureKey="") match any feature lookup;
  // feature-specific overrides require an exact featureKey match.
  if (override.featureKey && override.featureKey !== featureKey) {
    return false;
  }
  if (override.scope === "user") {
    return Boolean(scopeIds.userId) && override.scopeId === scopeIds.userId;
  }
  if (override.scope === "member") {
    return Boolean(scopeIds.memberId) && override.scopeId === scopeIds.memberId;
  }
  if (override.scope === "workspace") {
    return Boolean(scopeIds.workspaceId) && override.scopeId === scopeIds.workspaceId;
  }
  return false;
}

function pickActivePlanRule(
  rules: AppAccessRule[],
  planId: string,
  appId: WorkspaceAppId,
  featureKey: string,
  nowMs: number
): AppAccessRule | null {
  if (!planId) return null;

  // Prefer rules matching the requested featureKey, then fall back to whole-app
  // rules (featureKey=""). Within each tier prefer enabled + higher priority.
  const candidatesForFeature: AppAccessRule[] = [];
  const candidatesForWholeApp: AppAccessRule[] = [];

  for (const rule of rules) {
    if (rule.planId !== planId) continue;
    if (rule.appId !== appId) continue;
    if (!rule.enabled) continue;
    if (!isWithinWindow(rule.startsAt, rule.endsAt, nowMs)) continue;

    if (featureKey && rule.featureKey === featureKey) {
      candidatesForFeature.push(rule);
    } else if (!rule.featureKey) {
      candidatesForWholeApp.push(rule);
    }
  }

  const sortByPriority = (a: AppAccessRule, b: AppAccessRule) => b.priority - a.priority;

  if (candidatesForFeature.length > 0) {
    return candidatesForFeature.sort(sortByPriority)[0];
  }
  if (candidatesForWholeApp.length > 0) {
    return candidatesForWholeApp.sort(sortByPriority)[0];
  }
  return null;
}

const FREE_DEFAULT_MONETIZATIONS: ReadonlySet<WorkspaceAppMonetization> = new Set<
  WorkspaceAppMonetization
>(["free"]);

export function evaluateAppAccess(args: {
  appId: WorkspaceAppId;
  featureKey?: string;
  userId?: string;
  workspaceId?: string;
  memberId?: string;
  isPlatformOwner?: boolean;
  plansState?: PlansState;
  subscriptionState?: SubscriptionState;
}): AccessDecision {
  const appId = normalizeAppId(args.appId);
  const featureKey = normalizeString(args.featureKey);
  const scopeIds = {
    userId: normalizeString(args.userId),
    memberId: normalizeString(args.memberId),
    workspaceId: normalizeString(args.workspaceId)
  };

  // Step 1: platform owner shortcut.
  if (args.isPlatformOwner) {
    return {
      allow: true,
      accessLevel: "admin",
      limits: {},
      reason: "platform_owner",
      source: "owner"
    };
  }

  const plansState = args.plansState ? normalizePlansState(args.plansState) : loadPlansState();
  const subscriptionState = args.subscriptionState
    ? normalizeSubscriptionState(args.subscriptionState)
    : loadSubscriptionState();

  const nowMs = Date.now();

  // Step 2: explicit DENY overrides take precedence over everything else.
  const denyOverride = plansState.overrides
    .filter((override) => override.effect === "deny")
    .filter((override) => isWithinWindow(override.startsAt, override.endsAt, nowMs))
    .find((override) => overrideMatches(override, appId, featureKey, scopeIds));

  if (denyOverride) {
    return {
      allow: false,
      accessLevel: "none",
      limits: denyOverride.limits,
      reason: "override_deny",
      source: "override"
    };
  }

  // Step 3: explicit ALLOW overrides.
  const allowOverride = plansState.overrides
    .filter((override) => override.effect === "allow")
    .filter((override) => isWithinWindow(override.startsAt, override.endsAt, nowMs))
    .find((override) => overrideMatches(override, appId, featureKey, scopeIds));

  if (allowOverride) {
    return {
      allow: true,
      accessLevel: allowOverride.accessLevel,
      limits: allowOverride.limits,
      reason: "override_allow",
      source: "override"
    };
  }

  // Step 4: active subscription plan rule.
  const subscription = subscriptionState.current;
  const subscriptionActive =
    subscription && (subscription.status === "active" || subscription.status === "trial");

  if (subscriptionActive && subscription) {
    const planRule = pickActivePlanRule(
      plansState.rules,
      subscription.planId,
      appId,
      featureKey,
      nowMs
    );
    if (planRule) {
      const allowed = planRule.accessLevel !== "none";
      return {
        allow: allowed,
        accessLevel: planRule.accessLevel,
        limits: planRule.limits,
        reason: allowed ? "plan_rule" : "no_rule",
        source: allowed ? "plan" : "default"
      };
    }
  }

  // Step 5: default free fallback based on app monetization.
  const app = getWorkspaceApp(appId);
  if (app && FREE_DEFAULT_MONETIZATIONS.has(app.monetization)) {
    return {
      allow: true,
      accessLevel: "quick",
      limits: {},
      reason: "default_free",
      source: "default"
    };
  }

  // Step 6: deny by default.
  return {
    allow: false,
    accessLevel: "none",
    limits: {},
    reason: "no_rule",
    source: "default"
  };
}

// ---------------------------------------------------------------------------
// Summary helper for UI dashboards
// ---------------------------------------------------------------------------

export type MembershipSummary = {
  currentPlan: Plan | null;
  subscriptionStatus: SubscriptionStatus;
  totalPlans: number;
  totalRules: number;
  totalOverrides: number;
  allowedAppCount: number;
  deniedAppCount: number;
};

export function summarizeMembership(
  plansState?: PlansState,
  subscriptionState?: SubscriptionState
): MembershipSummary {
  const plans = plansState ? normalizePlansState(plansState) : loadPlansState();
  const subscription = subscriptionState
    ? normalizeSubscriptionState(subscriptionState)
    : loadSubscriptionState();

  const currentPlan = subscription.current
    ? plans.plans.find((plan) => plan.id === subscription.current?.planId) ?? null
    : null;

  let allowedAppCount = 0;
  let deniedAppCount = 0;

  for (const app of workspaceApps) {
    const decision = evaluateAppAccess({
      appId: app.id,
      plansState: plans,
      subscriptionState: subscription
    });
    if (decision.allow) {
      allowedAppCount += 1;
    } else {
      deniedAppCount += 1;
    }
  }

  return {
    currentPlan,
    subscriptionStatus: subscription.current?.status ?? "none",
    totalPlans: plans.plans.length,
    totalRules: plans.rules.length,
    totalOverrides: plans.overrides.length,
    allowedAppCount,
    deniedAppCount
  };
}
