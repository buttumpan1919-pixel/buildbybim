import { beforeEach, describe, expect, it } from "vitest";
import {
  MEMBERSHIP_PLANS_STORAGE_KEY,
  MEMBERSHIP_SUBSCRIPTION_STORAGE_KEY,
  appendAuditEntry,
  evaluateAppAccess,
  loadAuditState,
  loadPlansState,
  seedPlans,
  summarizeMembership,
  upsertAppAccessOverride,
  upsertAppAccessRule
} from "./membership";

function resetStorage() {
  if (typeof window !== "undefined") {
    window.localStorage.clear();
  }
}

describe("seedPlans", () => {
  beforeEach(resetStorage);

  it("returns 3 seed plans", () => {
    const state = seedPlans();
    expect(state.plans).toHaveLength(3);
    expect(state.plans.map((p) => p.id).sort()).toEqual([
      "plan-custom",
      "plan-free",
      "plan-support-monthly"
    ]);
  });

  it("creates one rule per app for Free and Support plans, none for Custom", () => {
    const state = seedPlans();
    const freeRules = state.rules.filter((r) => r.planId === "plan-free");
    const supportRules = state.rules.filter((r) => r.planId === "plan-support-monthly");
    const customRules = state.rules.filter((r) => r.planId === "plan-custom");
    expect(freeRules.length).toBeGreaterThan(0);
    expect(supportRules.length).toBe(freeRules.length);
    expect(customRules.length).toBe(0);
  });

  it("Free plan grants quick access to free apps, preview to paid apps", () => {
    const state = seedPlans();
    const hubRule = state.rules.find((r) => r.planId === "plan-free" && r.appId === "hub");
    const docsRule = state.rules.find((r) => r.planId === "plan-free" && r.appId === "builddocs");
    expect(hubRule?.accessLevel).toBe("quick");
    expect(docsRule?.accessLevel).toBe("preview");
  });

  it("Support plan grants write to every app", () => {
    const state = seedPlans();
    const supportRules = state.rules.filter((r) => r.planId === "plan-support-monthly");
    for (const rule of supportRules) {
      expect(rule.accessLevel).toBe("write");
    }
  });
});

describe("evaluateAppAccess — PRD Section 5 evaluation order", () => {
  beforeEach(resetStorage);

  it("step 1: platform owner always allowed at admin level", () => {
    const decision = evaluateAppAccess({
      appId: "builddocs",
      isPlatformOwner: true
    });
    expect(decision.allow).toBe(true);
    expect(decision.accessLevel).toBe("admin");
    expect(decision.source).toBe("owner");
    expect(decision.reason).toBe("platform_owner");
  });

  it("step 2: explicit deny override blocks even if plan allows", () => {
    const plansState = seedPlans();
    const withDeny = upsertAppAccessOverride(plansState, {
      scope: "user",
      scopeId: "u1",
      appId: "builddocs",
      effect: "deny",
      reason: "test deny"
    });
    const decision = evaluateAppAccess({
      appId: "builddocs",
      userId: "u1",
      plansState: withDeny,
      subscriptionState: {
        current: {
          id: "sub-1",
          planId: "plan-support-monthly",
          status: "active",
          startedAt: new Date().toISOString(),
          currentPeriodEnd: "",
          provider: "manual",
          providerRef: "",
          note: ""
        },
        updatedAt: ""
      }
    });
    expect(decision.allow).toBe(false);
    expect(decision.reason).toBe("override_deny");
    expect(decision.source).toBe("override");
  });

  it("step 3: explicit allow override grants access even on free plan", () => {
    const plansState = seedPlans();
    const withAllow = upsertAppAccessOverride(plansState, {
      scope: "user",
      scopeId: "u1",
      appId: "builddocs",
      effect: "allow",
      accessLevel: "write",
      reason: "test allow"
    });
    const decision = evaluateAppAccess({
      appId: "builddocs",
      userId: "u1",
      plansState: withAllow,
      subscriptionState: {
        current: {
          id: "sub-1",
          planId: "plan-free",
          status: "active",
          startedAt: new Date().toISOString(),
          currentPeriodEnd: "",
          provider: "manual",
          providerRef: "",
          note: ""
        },
        updatedAt: ""
      }
    });
    expect(decision.allow).toBe(true);
    expect(decision.accessLevel).toBe("write");
    expect(decision.source).toBe("override");
    expect(decision.reason).toBe("override_allow");
  });

  it("step 4: active plan rule applies when no override", () => {
    const plansState = seedPlans();
    const decision = evaluateAppAccess({
      appId: "builddocs",
      plansState,
      subscriptionState: {
        current: {
          id: "sub-1",
          planId: "plan-support-monthly",
          status: "active",
          startedAt: new Date().toISOString(),
          currentPeriodEnd: "",
          provider: "manual",
          providerRef: "",
          note: ""
        },
        updatedAt: ""
      }
    });
    expect(decision.allow).toBe(true);
    expect(decision.accessLevel).toBe("write");
    expect(decision.source).toBe("plan");
    expect(decision.reason).toBe("plan_rule");
  });

  it("step 5: default free fallback for free-monetization app when no plan rule", () => {
    const plansState = { plans: [], rules: [], overrides: [], updatedAt: "" };
    const decision = evaluateAppAccess({
      appId: "socialFeed",
      plansState,
      subscriptionState: {
        current: {
          id: "sub-1",
          planId: "nonexistent",
          status: "active",
          startedAt: "",
          currentPeriodEnd: "",
          provider: "manual",
          providerRef: "",
          note: ""
        },
        updatedAt: ""
      }
    });
    expect(decision.allow).toBe(true);
    expect(decision.source).toBe("default");
    expect(decision.reason).toBe("default_free");
  });

  it("step 6: deny when no rule and not a free app", () => {
    const plansState = { plans: [], rules: [], overrides: [], updatedAt: "" };
    const decision = evaluateAppAccess({
      appId: "builddocs",
      plansState,
      subscriptionState: { current: null, updatedAt: "" }
    });
    expect(decision.allow).toBe(false);
    expect(decision.reason).toBe("no_rule");
  });

  it("deny override beats allow override (deny is checked first)", () => {
    let state = seedPlans();
    state = upsertAppAccessOverride(state, {
      scope: "user",
      scopeId: "u1",
      appId: "builddocs",
      effect: "allow",
      accessLevel: "write",
      reason: "allow first"
    });
    state = upsertAppAccessOverride(state, {
      scope: "user",
      scopeId: "u1",
      appId: "builddocs",
      effect: "deny",
      reason: "then deny"
    });
    const decision = evaluateAppAccess({
      appId: "builddocs",
      userId: "u1",
      plansState: state,
      subscriptionState: {
        current: {
          id: "sub-1",
          planId: "plan-support-monthly",
          status: "active",
          startedAt: "",
          currentPeriodEnd: "",
          provider: "manual",
          providerRef: "",
          note: ""
        },
        updatedAt: ""
      }
    });
    expect(decision.allow).toBe(false);
    expect(decision.reason).toBe("override_deny");
  });
});

describe("summarizeMembership", () => {
  beforeEach(resetStorage);

  it("counts plans, rules, overrides, allowed/denied apps", () => {
    const summary = summarizeMembership();
    expect(summary.totalPlans).toBe(3);
    expect(summary.totalRules).toBeGreaterThan(0);
    expect(summary.totalOverrides).toBe(0);
    expect(summary.allowedAppCount + summary.deniedAppCount).toBeGreaterThan(0);
  });
});

describe("upsertAppAccessRule", () => {
  beforeEach(resetStorage);

  it("adds a new rule when id is new", () => {
    const state = seedPlans();
    const before = state.rules.length;
    const next = upsertAppAccessRule(state, {
      planId: "plan-free",
      appId: "library",
      featureKey: "preview",
      accessLevel: "read",
      enabled: true,
      priority: 30
    });
    expect(next.rules.length).toBe(before + 1);
  });

  it("updates existing rule when id matches", () => {
    const state = seedPlans();
    const target = state.rules.find((r) => r.appId === "builddocs" && r.planId === "plan-free");
    expect(target).toBeDefined();
    const next = upsertAppAccessRule(state, {
      ...target!,
      accessLevel: "saved"
    });
    expect(next.rules.length).toBe(state.rules.length);
    const updated = next.rules.find((r) => r.id === target!.id);
    expect(updated?.accessLevel).toBe("saved");
  });
});

describe("audit log", () => {
  beforeEach(resetStorage);

  it("appendAuditEntry adds entries", () => {
    appendAuditEntry({
      action: "test.action",
      actorType: "system",
      actorId: "test",
      targetType: "plan",
      targetId: "plan-free"
    });
    const state = loadAuditState();
    expect(state.entries.length).toBe(1);
    expect(state.entries[0].action).toBe("test.action");
  });

  it("caps audit log at 200 entries", () => {
    for (let i = 0; i < 220; i += 1) {
      appendAuditEntry({
        action: `test.${i}`,
        actorType: "system",
        actorId: "test",
        targetType: "plan",
        targetId: "x"
      });
    }
    const state = loadAuditState();
    expect(state.entries.length).toBeLessThanOrEqual(200);
  });
});

describe("storage adapter usage", () => {
  beforeEach(resetStorage);

  it("loadPlansState returns seed when storage empty", () => {
    const state = loadPlansState();
    expect(state.plans.length).toBe(3);
  });

  it("storage keys are distinct and namespaced", () => {
    expect(MEMBERSHIP_PLANS_STORAGE_KEY).toBe("membership.plans.v1");
    expect(MEMBERSHIP_SUBSCRIPTION_STORAGE_KEY).toBe("membership.subscription.v1");
  });
});
