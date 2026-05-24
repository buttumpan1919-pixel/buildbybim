import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseAdapter, isLocalOnlyKey } from "./supabaseAdapter";

// Minimal Supabase client stub — exercises the local-cache path of SupabaseAdapter
// without actually hitting the network. pull/push tests would need a real
// project; they belong in an integration suite that reads .env.
function makeStubClient(): SupabaseClient {
  const stub = {
    from() {
      return {
        select() {
          return { eq: async () => ({ data: [], error: null }) };
        },
        upsert: async () => ({ data: null, error: null })
      };
    }
  };
  return stub as unknown as SupabaseClient;
}

describe("SupabaseAdapter (local cache path)", () => {
  let adapter: SupabaseAdapter;

  beforeEach(() => {
    if (typeof window !== "undefined") window.localStorage.clear();
    adapter = new SupabaseAdapter(makeStubClient(), "test-workspace-uuid");
  });

  afterEach(() => {
    if (typeof window !== "undefined") window.localStorage.clear();
  });

  it("reports its name", () => {
    expect(adapter.name).toBe("supabase");
  });

  it("requires workspaceId", () => {
    expect(() => new SupabaseAdapter(makeStubClient(), "")).toThrow();
  });

  it("reads from local cache (sync)", () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("k", "v");
    }
    expect(adapter.read("k")).toBe("v");
  });

  it("writes to local cache immediately", () => {
    adapter.write("k", "v");
    expect(adapter.read("k")).toBe("v");
  });

  it("removes from local cache", () => {
    adapter.write("k", "v");
    adapter.remove("k");
    expect(adapter.read("k")).toBeNull();
  });

  it("lists keys by prefix from local cache", () => {
    adapter.write("a.x", "1");
    adapter.write("a.y", "2");
    adapter.write("b.z", "3");
    expect(adapter.list("a.").sort()).toEqual(["a.x", "a.y"]);
  });

  it("tracks pending writes in status", () => {
    adapter.write("cashflow.entries.v1", JSON.stringify({ entries: [] }));
    const status = adapter.getStatus();
    expect(status.pendingWrites).toBeGreaterThan(0);
    expect(status.workspaceId).toBe("test-workspace-uuid");
  });

  it("does not enqueue local-only keys for cloud sync", () => {
    adapter.write("buildbybim.auth.session", "abc");
    const status = adapter.getStatus();
    expect(status.pendingWrites).toBe(0);
  });
});

describe("isLocalOnlyKey", () => {
  it("returns true for auth keys", () => {
    expect(isLocalOnlyKey("buildbybim.auth.token")).toBe(true);
  });

  it("returns true for workspace language preference", () => {
    expect(isLocalOnlyKey("build-by-bim.workspace-language")).toBe(true);
  });

  it("returns false for syncable app data", () => {
    expect(isLocalOnlyKey("cashflow.entries.v1")).toBe(false);
    expect(isLocalOnlyKey("membership.plans.v1")).toBe(false);
    expect(isLocalOnlyKey("boq-data.task-linkage.v1")).toBe(false);
  });
});
