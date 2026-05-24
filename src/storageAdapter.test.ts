import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  LocalStorageAdapter,
  MemoryAdapter,
  defaultStorageAdapter,
  getStorageAdapter,
  readJson,
  setStorageAdapter,
  writeJson
} from "./storageAdapter";

describe("MemoryAdapter", () => {
  let adapter: MemoryAdapter;

  beforeEach(() => {
    adapter = new MemoryAdapter();
  });

  it("returns null for unknown key", () => {
    expect(adapter.read("missing")).toBeNull();
  });

  it("roundtrips write/read", () => {
    adapter.write("k", "v");
    expect(adapter.read("k")).toBe("v");
  });

  it("removes a key", () => {
    adapter.write("k", "v");
    adapter.remove("k");
    expect(adapter.read("k")).toBeNull();
  });

  it("lists all keys when no prefix", () => {
    adapter.write("a", "1");
    adapter.write("b", "2");
    expect(adapter.list().sort()).toEqual(["a", "b"]);
  });

  it("filters by prefix", () => {
    adapter.write("user.x", "1");
    adapter.write("user.y", "2");
    adapter.write("other", "3");
    expect(adapter.list("user.").sort()).toEqual(["user.x", "user.y"]);
  });

  it("reports its name", () => {
    expect(adapter.name).toBe("memory");
  });
});

describe("LocalStorageAdapter (jsdom-backed)", () => {
  let adapter: LocalStorageAdapter;

  beforeEach(() => {
    window.localStorage.clear();
    adapter = new LocalStorageAdapter();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("returns null for unknown key", () => {
    expect(adapter.read("nope")).toBeNull();
  });

  it("roundtrips write/read", () => {
    adapter.write("plan", "free");
    expect(adapter.read("plan")).toBe("free");
  });

  it("removes a key", () => {
    adapter.write("plan", "free");
    adapter.remove("plan");
    expect(adapter.read("plan")).toBeNull();
  });

  it("lists keys filtered by prefix", () => {
    adapter.write("membership.plans.v1", "{}");
    adapter.write("membership.subscription.v1", "{}");
    adapter.write("cashflow.entries.v1", "{}");
    expect(adapter.list("membership.").sort()).toEqual([
      "membership.plans.v1",
      "membership.subscription.v1"
    ]);
  });

  it("reports its name", () => {
    expect(adapter.name).toBe("localStorage");
  });
});

describe("readJson / writeJson", () => {
  let adapter: MemoryAdapter;

  beforeEach(() => {
    adapter = new MemoryAdapter();
  });

  it("returns fallback when key missing", () => {
    const result = readJson(adapter, "missing", { count: 0 });
    expect(result).toEqual({ count: 0 });
  });

  it("parses JSON without normalize", () => {
    adapter.write("k", JSON.stringify({ count: 5 }));
    expect(readJson(adapter, "k", { count: 0 })).toEqual({ count: 5 });
  });

  it("applies normalize callback", () => {
    adapter.write("k", JSON.stringify({ raw: 10 }));
    const result = readJson<{ count: number }>(
      adapter,
      "k",
      { count: 0 },
      (raw) => ({ count: ((raw as { raw: number }).raw ?? 0) * 2 })
    );
    expect(result).toEqual({ count: 20 });
  });

  it("returns fallback when JSON parse fails", () => {
    adapter.write("k", "{invalid json");
    expect(readJson(adapter, "k", { count: -1 })).toEqual({ count: -1 });
  });

  it("returns fallback when normalize throws", () => {
    adapter.write("k", JSON.stringify({ x: 1 }));
    expect(
      readJson(adapter, "k", { count: -1 }, () => {
        throw new Error("boom");
      })
    ).toEqual({ count: -1 });
  });

  it("writeJson + readJson roundtrip", () => {
    const value = { a: 1, b: ["x", "y"], c: { nested: true } };
    writeJson(adapter, "k", value);
    expect(readJson(adapter, "k", null as unknown)).toEqual(value);
  });

  it("writeJson swallows JSON.stringify errors silently", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(() => writeJson(adapter, "k", circular)).not.toThrow();
    expect(adapter.read("k")).toBeNull();
  });
});

describe("defaultStorageAdapter + swappable singleton", () => {
  it("default singleton is the LocalStorage adapter in jsdom", () => {
    expect(defaultStorageAdapter.name).toBe("localStorage");
  });

  it("getStorageAdapter returns the active adapter", () => {
    expect(getStorageAdapter().name).toBe(defaultStorageAdapter.name);
  });

  it("setStorageAdapter swaps the active adapter", () => {
    const original = getStorageAdapter();
    const memory = new MemoryAdapter();
    setStorageAdapter(memory);
    expect(getStorageAdapter().name).toBe("memory");
    setStorageAdapter(original);
    expect(getStorageAdapter().name).toBe(original.name);
  });
});
