import { beforeEach, describe, expect, it } from "vitest";
import {
  pullFromSupabase,
  pushToSupabase,
  twoWaySync,
  type SupabaseLikeClient,
  type SupabaseResult,
  type SyncLoaders
} from "./supabase.sync";
import {
  cashflowEntryToRow,
  projectToRow,
  purchaseRequestToRow,
  prLineItemToRow,
  type CashflowEntryRow,
  type PRLineItemRow,
  type ProjectRow,
  type PurchaseRequestRow
} from "./relationalMapper";
import { createProject, type ProjectListState } from "./projects";
import { upsertCashflowEntry, type CashflowState } from "./cashflow";
import {
  normalizePRLineItem,
  normalizePurchaseRequest,
  type PRState
} from "./procurement";

// ---------------------------------------------------------------------------
// Stub Supabase client — tracks every call so tests can assert
// ---------------------------------------------------------------------------

type StubTable<T> = {
  data: T[];
  upsertCalls: Array<{ rows: unknown[]; onConflict?: string }>;
  selectCalls: number;
};

function makeStubClient(seed: {
  projects?: ProjectRow[];
  cashflow?: CashflowEntryRow[];
  purchaseRequests?: PurchaseRequestRow[];
  prLineItems?: PRLineItemRow[];
  errorOnTable?: string;
}) {
  const tables: Record<string, StubTable<Record<string, unknown>>> = {
    projects: { data: (seed.projects ?? []) as unknown as Record<string, unknown>[], upsertCalls: [], selectCalls: 0 },
    cashflow_entries: { data: (seed.cashflow ?? []) as unknown as Record<string, unknown>[], upsertCalls: [], selectCalls: 0 },
    purchase_requests: { data: (seed.purchaseRequests ?? []) as unknown as Record<string, unknown>[], upsertCalls: [], selectCalls: 0 },
    pr_line_items: { data: (seed.prLineItems ?? []) as unknown as Record<string, unknown>[], upsertCalls: [], selectCalls: 0 }
  };

  const client: SupabaseLikeClient = {
    from<TRow>(table: string) {
      const t = tables[table];
      if (!t) throw new Error(`stub: unknown table ${table}`);
      return {
        async select(): Promise<SupabaseResult<TRow[]>> {
          t.selectCalls += 1;
          if (seed.errorOnTable === table) {
            return { data: null, error: { message: `${table} read failed` } };
          }
          return { data: t.data as unknown as TRow[], error: null };
        },
        async upsert(
          rows: Array<Record<string, unknown>>,
          options?: { onConflict?: string }
        ): Promise<SupabaseResult<TRow[]>> {
          t.upsertCalls.push({ rows, onConflict: options?.onConflict });
          if (seed.errorOnTable === table) {
            return { data: null, error: { message: `${table} write failed` } };
          }
          // simulate upsert: replace existing by id, append new
          for (const row of rows) {
            const id = String((row as { id?: string }).id ?? "");
            const idx = t.data.findIndex((existing) => String(existing.id) === id);
            if (idx >= 0) t.data[idx] = row;
            else t.data.push(row);
          }
          return { data: rows as unknown as TRow[], error: null };
        },
        delete() {
          return {
            async in(): Promise<SupabaseResult<TRow[]>> {
              return { data: [], error: null };
            }
          };
        }
      };
    }
  };

  return { client, tables };
}

// ---------------------------------------------------------------------------
// In-memory loader stand-ins
// ---------------------------------------------------------------------------

function makeLoaders(initial: {
  projects: ProjectListState;
  cashflow: CashflowState;
  prs: PRState;
}): { loaders: SyncLoaders; current: typeof initial } {
  const current = initial;
  const loaders: SyncLoaders = {
    loadProjects: () => current.projects,
    saveProjects: (state) => {
      current.projects = state;
    },
    loadCashflow: () => current.cashflow,
    saveCashflow: (state) => {
      current.cashflow = state;
    },
    loadPRs: () => current.prs,
    savePRs: (state) => {
      current.prs = state;
    }
  };
  return { loaders, current };
}

function resetStorage() {
  if (typeof window !== "undefined") window.localStorage.clear();
}

describe("pushToSupabase", () => {
  beforeEach(resetStorage);

  it("rejects empty workspaceId", async () => {
    const { client } = makeStubClient({});
    const { loaders } = makeLoaders({
      projects: { projects: [], updatedAt: "" },
      cashflow: { entries: [], updatedAt: "" },
      prs: { prs: [], updatedAt: "" }
    });
    const report = await pushToSupabase(client, "", loaders);
    expect(report.ok).toBe(false);
    expect(report.error).toContain("workspaceId");
  });

  it("pushes a single project to the projects table with upsert + onConflict:id", async () => {
    const project = createProject({
      id: "p-1",
      workspaceId: "ws-1",
      code: "j-2601",
      name: "Test",
      plannedCost: 1000
    });
    const { client, tables } = makeStubClient({});
    const { loaders } = makeLoaders({
      projects: { projects: [project], updatedAt: "" },
      cashflow: { entries: [], updatedAt: "" },
      prs: { prs: [], updatedAt: "" }
    });
    const report = await pushToSupabase(client, "ws-1", loaders);
    expect(report.ok).toBe(true);
    expect(report.projects.pushed).toBe(1);
    expect(tables.projects.upsertCalls).toHaveLength(1);
    expect(tables.projects.upsertCalls[0].onConflict).toBe("id");
    expect(tables.projects.upsertCalls[0].rows[0]).toMatchObject({
      id: "p-1",
      workspace_id: "ws-1",
      code: "j-2601"
    });
  });

  it("pushes cashflow entries scoped to the chosen workspace", async () => {
    const { client, tables } = makeStubClient({});
    const state = upsertCashflowEntry(
      { entries: [], updatedAt: "" },
      {
        id: "cf-1",
        direction: "expense",
        category: "material",
        amount: 100,
        status: "confirmed",
        projectId: "p-1",
        entryDate: "2026-05-25"
      }
    );
    const { loaders } = makeLoaders({
      projects: { projects: [], updatedAt: "" },
      cashflow: state,
      prs: { prs: [], updatedAt: "" }
    });
    const report = await pushToSupabase(client, "ws-1", loaders);
    expect(report.cashflow.pushed).toBe(1);
    expect(tables.cashflow_entries.upsertCalls[0].rows[0]).toMatchObject({
      id: "cf-1",
      workspace_id: "ws-1"
    });
  });

  it("pushes PR head + line items together", async () => {
    const pr = normalizePurchaseRequest({
      id: "pr-1",
      workspaceId: "ws-1",
      projectId: "p-1",
      prNo: "PR-2026-001",
      status: "approved",
      requestDate: "2026-05-25",
      items: [
        normalizePRLineItem({
          id: "pli-1",
          costCodeId: "01-100",
          description: "Cement",
          quantity: 10,
          unit: "ถุง",
          estimatedUnitPrice: 250
        })
      ]
    });
    const { client, tables } = makeStubClient({});
    const { loaders } = makeLoaders({
      projects: { projects: [], updatedAt: "" },
      cashflow: { entries: [], updatedAt: "" },
      prs: { prs: [pr], updatedAt: "" }
    });
    const report = await pushToSupabase(client, "ws-1", loaders);
    expect(report.purchaseRequests.pushed).toBe(1);
    expect(tables.purchase_requests.upsertCalls[0].rows).toHaveLength(1);
    expect(tables.pr_line_items.upsertCalls[0].rows).toHaveLength(1);
    expect((tables.pr_line_items.upsertCalls[0].rows[0] as PRLineItemRow).pr_id).toBe("pr-1");
  });

  it("returns error when upsert fails on a single table", async () => {
    const { client } = makeStubClient({ errorOnTable: "cashflow_entries" });
    const state = upsertCashflowEntry(
      { entries: [], updatedAt: "" },
      {
        id: "cf-1",
        direction: "expense",
        category: "material",
        amount: 100,
        status: "confirmed",
        entryDate: "2026-05-25"
      }
    );
    const { loaders } = makeLoaders({
      projects: { projects: [], updatedAt: "" },
      cashflow: state,
      prs: { prs: [], updatedAt: "" }
    });
    const report = await pushToSupabase(client, "ws-1", loaders);
    expect(report.ok).toBe(false);
    expect(report.error).toContain("cashflow push");
  });
});

describe("pullFromSupabase + conflict resolution", () => {
  beforeEach(resetStorage);

  it("pulls a remote-only project into local state", async () => {
    const remoteProject = createProject({
      id: "p-remote",
      workspaceId: "ws-1",
      code: "j-2602",
      name: "From the cloud"
    });
    const { client } = makeStubClient({
      projects: [projectToRow(remoteProject)]
    });
    const { loaders, current } = makeLoaders({
      projects: { projects: [], updatedAt: "" },
      cashflow: { entries: [], updatedAt: "" },
      prs: { prs: [], updatedAt: "" }
    });
    const report = await pullFromSupabase(client, "ws-1", loaders);
    expect(report.ok).toBe(true);
    expect(report.projects.pulled).toBe(1);
    expect(current.projects.projects).toHaveLength(1);
    expect(current.projects.projects[0].id).toBe("p-remote");
  });

  it("keeps local row when local updatedAt is newer", async () => {
    const olderRemote = createProject({
      id: "p-1",
      workspaceId: "ws-1",
      code: "j-2601",
      name: "old name from cloud",
      updatedAt: "2026-01-01T00:00:00.000Z"
    });
    const newerLocal = createProject({
      id: "p-1",
      workspaceId: "ws-1",
      code: "j-2601",
      name: "new local name",
      updatedAt: "2026-05-25T00:00:00.000Z"
    });
    const { client } = makeStubClient({
      projects: [projectToRow(olderRemote)]
    });
    const { loaders, current } = makeLoaders({
      projects: { projects: [newerLocal], updatedAt: "" },
      cashflow: { entries: [], updatedAt: "" },
      prs: { prs: [], updatedAt: "" }
    });
    const report = await pullFromSupabase(client, "ws-1", loaders);
    expect(report.projects.conflictsLocalWon).toBe(1);
    expect(current.projects.projects[0].name).toBe("new local name");
  });

  it("overwrites local row when remote updatedAt is newer", async () => {
    const newerRemote = createProject({
      id: "p-1",
      workspaceId: "ws-1",
      code: "j-2601",
      name: "fresher cloud version",
      updatedAt: "2026-05-25T12:00:00.000Z"
    });
    const olderLocal = createProject({
      id: "p-1",
      workspaceId: "ws-1",
      code: "j-2601",
      name: "stale local",
      updatedAt: "2026-01-01T00:00:00.000Z"
    });
    const { client } = makeStubClient({
      projects: [projectToRow(newerRemote)]
    });
    const { loaders, current } = makeLoaders({
      projects: { projects: [olderLocal], updatedAt: "" },
      cashflow: { entries: [], updatedAt: "" },
      prs: { prs: [], updatedAt: "" }
    });
    const report = await pullFromSupabase(client, "ws-1", loaders);
    expect(report.projects.conflictsRemoteWon).toBe(1);
    expect(current.projects.projects[0].name).toBe("fresher cloud version");
  });

  it("filters by workspace_id — ignores other workspaces' rows from cloud", async () => {
    const myProject = createProject({
      id: "p-mine",
      workspaceId: "ws-1",
      code: "j-mine",
      name: "Mine"
    });
    const someoneElse = createProject({
      id: "p-them",
      workspaceId: "ws-other",
      code: "j-them",
      name: "Other workspace"
    });
    const { client } = makeStubClient({
      projects: [projectToRow(myProject), projectToRow(someoneElse)]
    });
    const { loaders, current } = makeLoaders({
      projects: { projects: [], updatedAt: "" },
      cashflow: { entries: [], updatedAt: "" },
      prs: { prs: [], updatedAt: "" }
    });
    await pullFromSupabase(client, "ws-1", loaders);
    expect(current.projects.projects).toHaveLength(1);
    expect(current.projects.projects[0].id).toBe("p-mine");
  });

  it("merges PR head + line items together, filtering line items by pr_id", async () => {
    const pr = normalizePurchaseRequest({
      id: "pr-remote",
      workspaceId: "ws-1",
      projectId: "p-1",
      prNo: "PR-2026-099",
      status: "approved",
      requestDate: "2026-05-25",
      items: [
        normalizePRLineItem({
          id: "pli-A",
          costCodeId: "01-100",
          description: "Cement",
          quantity: 10,
          unit: "ถุง",
          estimatedUnitPrice: 250
        })
      ]
    });
    const { client } = makeStubClient({
      purchaseRequests: [purchaseRequestToRow(pr)],
      prLineItems: [prLineItemToRow(pr.items[0], pr.id)]
    });
    const { loaders, current } = makeLoaders({
      projects: { projects: [], updatedAt: "" },
      cashflow: { entries: [], updatedAt: "" },
      prs: { prs: [], updatedAt: "" }
    });
    const report = await pullFromSupabase(client, "ws-1", loaders);
    expect(report.purchaseRequests.pulled).toBe(1);
    expect(current.prs.prs).toHaveLength(1);
    expect(current.prs.prs[0].items).toHaveLength(1);
    expect(current.prs.prs[0].items[0].amount).toBe(2500);
  });

  it("returns error when remote select fails", async () => {
    const { client } = makeStubClient({ errorOnTable: "projects" });
    const { loaders } = makeLoaders({
      projects: { projects: [], updatedAt: "" },
      cashflow: { entries: [], updatedAt: "" },
      prs: { prs: [], updatedAt: "" }
    });
    const report = await pullFromSupabase(client, "ws-1", loaders);
    expect(report.ok).toBe(false);
    expect(report.error).toContain("projects pull");
  });

  it("syncs cashflow entries identically — round-trip a confirmed entry", async () => {
    const state = upsertCashflowEntry(
      { entries: [], updatedAt: "" },
      {
        id: "cf-1",
        direction: "expense",
        category: "material",
        amount: 500,
        status: "confirmed",
        projectId: "p-1",
        entryDate: "2026-05-25",
        costCodeId: "01-100"
      }
    );
    const remoteRow = cashflowEntryToRow(state.entries[0], "ws-1");
    const { client } = makeStubClient({ cashflow: [remoteRow] });
    const { loaders, current } = makeLoaders({
      projects: { projects: [], updatedAt: "" },
      cashflow: { entries: [], updatedAt: "" },
      prs: { prs: [], updatedAt: "" }
    });
    await pullFromSupabase(client, "ws-1", loaders);
    expect(current.cashflow.entries).toHaveLength(1);
    expect(current.cashflow.entries[0].amount).toBe(500);
    expect(current.cashflow.entries[0].costCodeId).toBe("01-100");
  });
});

describe("twoWaySync", () => {
  beforeEach(resetStorage);

  it("pulls then pushes (no error path)", async () => {
    const { client, tables } = makeStubClient({});
    const localProject = createProject({
      id: "p-local",
      workspaceId: "ws-1",
      code: "j-local",
      name: "Local-only project"
    });
    const { loaders } = makeLoaders({
      projects: { projects: [localProject], updatedAt: "" },
      cashflow: { entries: [], updatedAt: "" },
      prs: { prs: [], updatedAt: "" }
    });
    const report = await twoWaySync(client, "ws-1", loaders);
    expect(report.direction).toBe("two_way");
    expect(report.ok).toBe(true);
    // Pull happened (selects called) then push (upsert called)
    expect(tables.projects.selectCalls).toBe(1);
    expect(tables.projects.upsertCalls).toHaveLength(1);
  });

  it("short-circuits on pull error before pushing", async () => {
    const { client, tables } = makeStubClient({ errorOnTable: "projects" });
    const { loaders } = makeLoaders({
      projects: { projects: [], updatedAt: "" },
      cashflow: { entries: [], updatedAt: "" },
      prs: { prs: [], updatedAt: "" }
    });
    const report = await twoWaySync(client, "ws-1", loaders);
    expect(report.ok).toBe(false);
    expect(report.direction).toBe("two_way");
    // No upsert should have been attempted after the pull failure
    expect(tables.projects.upsertCalls).toHaveLength(0);
  });
});
