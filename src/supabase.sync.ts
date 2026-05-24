// Supabase relational sync — Sprint 10B (push + pull + conflict resolution)
//
// Built on top of `relationalMapper.ts` (pure converters) + a thin
// SupabaseLike client interface so tests can mock without supabase-js.
//
// Why we don't import supabase-js directly here:
//   - keeps sync logic unit-testable with stubs
//   - same engine can wrap a future REST adapter (Cloudflare Workers, etc.)
//   - matches the StorageAdapter pattern in PRD Section 6
//
// What this DOES sync:
//   - projects (Sprint 0)
//   - cashflow_entries (Sprint 5)
//   - purchase_requests + pr_line_items (Sprint 3, head + items)
//
// What it does NOT (yet):
//   - cost_codes, suppliers, evidence, RFQ, approvals → still on
//     `SupabaseAdapter` kv_store sync for v0.1
//   - realtime subscriptions → Sprint 10C
//   - retry queue → Sprint 10C

import {
  cashflowEntryToRow,
  prLineItemToRow,
  projectToRow,
  purchaseRequestToRow,
  resolveByUpdatedAt,
  rowToCashflowEntry,
  rowToProject,
  rowToPurchaseRequest,
  type CashflowEntryRow,
  type PRLineItemRow,
  type ProjectRow,
  type PurchaseRequestRow
} from "./relationalMapper";
import {
  loadCashflowState,
  saveCashflowState,
  type CashflowEntry,
  type CashflowState
} from "./cashflow";
import {
  loadProjects,
  saveProjects,
  type Project,
  type ProjectListState
} from "./projects";
import {
  loadPRs,
  savePRs,
  type PRState,
  type PurchaseRequest
} from "./procurement";

// ----------------------------------------------------------------------------
// Minimal client shape — what we need from supabase-js. Tests pass a stub
// implementing this; production passes the real createClient() result via
// `supabaseClient.ts`.
// ----------------------------------------------------------------------------

export type SupabaseResult<T> = {
  data: T | null;
  error: { message: string } | null;
};

export type SupabaseQueryBuilder<TRow> = {
  select(columns?: string): Promise<SupabaseResult<TRow[]>>;
  upsert(
    rows: Array<Record<string, unknown>>,
    options?: { onConflict?: string }
  ): Promise<SupabaseResult<TRow[]>>;
  delete(): {
    in(column: string, values: string[]): Promise<SupabaseResult<TRow[]>>;
  };
};

export type SupabaseLikeClient = {
  from<TRow>(table: string): SupabaseQueryBuilder<TRow>;
};

// ----------------------------------------------------------------------------
// Sync report — return value the UI displays after each push/pull
// ----------------------------------------------------------------------------

export type SyncDirection = "push" | "pull" | "two_way";

export type SyncCounts = {
  pushed: number;
  pulled: number;
  unchanged: number;
  conflictsLocalWon: number;
  conflictsRemoteWon: number;
};

export type SyncReport = {
  direction: SyncDirection;
  workspaceId: string;
  startedAt: string;
  finishedAt: string;
  ok: boolean;
  error: string;
  projects: SyncCounts;
  cashflow: SyncCounts;
  purchaseRequests: SyncCounts;
};

function emptyCounts(): SyncCounts {
  return {
    pushed: 0,
    pulled: 0,
    unchanged: 0,
    conflictsLocalWon: 0,
    conflictsRemoteWon: 0
  };
}

function emptyReport(
  direction: SyncDirection,
  workspaceId: string
): SyncReport {
  const now = new Date().toISOString();
  return {
    direction,
    workspaceId,
    startedAt: now,
    finishedAt: now,
    ok: true,
    error: "",
    projects: emptyCounts(),
    cashflow: emptyCounts(),
    purchaseRequests: emptyCounts()
  };
}

// ----------------------------------------------------------------------------
// Storage hook — defaults to local-storage adapter loaders. Tests pass
// in-memory state via `customLoaders` so we don't touch real storage.
// ----------------------------------------------------------------------------

export type SyncLoaders = {
  loadProjects: () => ProjectListState;
  saveProjects: (state: ProjectListState) => void;
  loadCashflow: () => CashflowState;
  saveCashflow: (state: CashflowState) => void;
  loadPRs: () => PRState;
  savePRs: (state: PRState) => void;
};

export function defaultSyncLoaders(): SyncLoaders {
  return {
    loadProjects,
    saveProjects,
    loadCashflow: loadCashflowState,
    saveCashflow: saveCashflowState,
    loadPRs,
    savePRs
  };
}

// ----------------------------------------------------------------------------
// Push — local → cloud
// ----------------------------------------------------------------------------

/**
 * Push every local row to the cloud. Uses `upsert` with `id` as the
 * conflict target so re-runs are idempotent. Returns counts per entity.
 *
 * Strategy: dumb-push, no conflict check on push. The pull side is
 * responsible for honoring remote-newer rows. Use `twoWaySync` when
 * you want full conflict resolution.
 */
export async function pushToSupabase(
  client: SupabaseLikeClient,
  workspaceId: string,
  loaders: SyncLoaders = defaultSyncLoaders()
): Promise<SyncReport> {
  const report = emptyReport("push", workspaceId);
  const ws = workspaceId.trim();
  if (!ws) {
    report.ok = false;
    report.error = "workspaceId required";
    report.finishedAt = new Date().toISOString();
    return report;
  }

  try {
    // 1. Projects
    const projectsState = loaders.loadProjects();
    const projectRows = projectsState.projects
      .filter((p) => p.workspaceId === ws || !p.workspaceId)
      .map((p) => projectToRow({ ...p, workspaceId: ws }));
    if (projectRows.length > 0) {
      const res = await client
        .from<ProjectRow>("projects")
        .upsert(projectRows as unknown as Array<Record<string, unknown>>, {
          onConflict: "id"
        });
      if (res.error) throw new Error(`projects push: ${res.error.message}`);
      report.projects.pushed = projectRows.length;
    }

    // 2. Cashflow entries
    const cashflowState = loaders.loadCashflow();
    const cashflowRows = cashflowState.entries.map((e) =>
      cashflowEntryToRow(e, ws)
    );
    if (cashflowRows.length > 0) {
      const res = await client
        .from<CashflowEntryRow>("cashflow_entries")
        .upsert(cashflowRows as unknown as Array<Record<string, unknown>>, {
          onConflict: "id"
        });
      if (res.error) throw new Error(`cashflow push: ${res.error.message}`);
      report.cashflow.pushed = cashflowRows.length;
    }

    // 3. Purchase Requests (head + items)
    const prState = loaders.loadPRs();
    const workspacePRs = prState.prs.filter(
      (pr) => pr.workspaceId === ws || !pr.workspaceId
    );
    const headRows = workspacePRs.map((pr) =>
      purchaseRequestToRow({ ...pr, workspaceId: ws })
    );
    const itemRows: PRLineItemRow[] = [];
    for (const pr of workspacePRs) {
      for (const item of pr.items) {
        itemRows.push(prLineItemToRow(item, pr.id));
      }
    }
    if (headRows.length > 0) {
      const res = await client
        .from<PurchaseRequestRow>("purchase_requests")
        .upsert(headRows as unknown as Array<Record<string, unknown>>, {
          onConflict: "id"
        });
      if (res.error) throw new Error(`PR push: ${res.error.message}`);
      report.purchaseRequests.pushed = headRows.length;
    }
    if (itemRows.length > 0) {
      const res = await client
        .from<PRLineItemRow>("pr_line_items")
        .upsert(itemRows as unknown as Array<Record<string, unknown>>, {
          onConflict: "id"
        });
      if (res.error) throw new Error(`PR items push: ${res.error.message}`);
    }
  } catch (err) {
    report.ok = false;
    report.error = err instanceof Error ? err.message : String(err);
  }
  report.finishedAt = new Date().toISOString();
  return report;
}

// ----------------------------------------------------------------------------
// Pull — cloud → local with last-write-wins conflict resolution
// ----------------------------------------------------------------------------

function indexById<T extends { id: string }>(rows: T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const row of rows) map.set(row.id, row);
  return map;
}

type WithUpdatedAt = { id: string; updatedAt: string };

function mergeWithConflict<T extends WithUpdatedAt>(
  local: T[],
  remote: T[],
  counts: SyncCounts
): T[] {
  const localById = indexById(local);
  const remoteById = indexById(remote);
  const allIds = new Set<string>([...localById.keys(), ...remoteById.keys()]);
  const merged: T[] = [];
  for (const id of allIds) {
    const localItem = localById.get(id) ?? null;
    const remoteItem = remoteById.get(id) ?? null;
    const resolution = resolveByUpdatedAt({
      local: localItem,
      remote: remoteItem,
      localUpdatedAt: localItem?.updatedAt ?? "",
      remoteUpdatedAt: remoteItem?.updatedAt ?? ""
    });
    if (!resolution.winner) continue;
    merged.push(resolution.winner);
    switch (resolution.reason) {
      case "remote_only":
        counts.pulled += 1;
        break;
      case "remote_newer":
      case "tied_remote_wins":
        counts.conflictsRemoteWon += 1;
        counts.pulled += 1;
        break;
      case "local_newer":
        counts.conflictsLocalWon += 1;
        break;
      case "local_only":
        counts.unchanged += 1;
        break;
    }
  }
  return merged;
}

/**
 * Pull cloud rows for this workspace, merge with local using
 * last-write-wins, and write the merged state back to local storage.
 *
 * Pull does NOT push remote-loser rows back to cloud — that's a job for
 * `twoWaySync` (separate function so the UI can stage diffs).
 */
export async function pullFromSupabase(
  client: SupabaseLikeClient,
  workspaceId: string,
  loaders: SyncLoaders = defaultSyncLoaders()
): Promise<SyncReport> {
  const report = emptyReport("pull", workspaceId);
  const ws = workspaceId.trim();
  if (!ws) {
    report.ok = false;
    report.error = "workspaceId required";
    report.finishedAt = new Date().toISOString();
    return report;
  }

  try {
    // 1. Projects — fetch remote, merge by id
    const remoteProjectsRes = await client
      .from<ProjectRow>("projects")
      .select("*");
    if (remoteProjectsRes.error) {
      throw new Error(`projects pull: ${remoteProjectsRes.error.message}`);
    }
    const remoteProjects: Project[] = (remoteProjectsRes.data ?? [])
      .filter((row) => row.workspace_id === ws)
      .map(rowToProject);
    const localProjects = loaders.loadProjects();
    const mergedProjects = mergeWithConflict(
      localProjects.projects,
      remoteProjects,
      report.projects
    );
    loaders.saveProjects({
      ...localProjects,
      projects: mergedProjects,
      updatedAt: new Date().toISOString()
    });

    // 2. Cashflow
    const remoteCashflowRes = await client
      .from<CashflowEntryRow>("cashflow_entries")
      .select("*");
    if (remoteCashflowRes.error) {
      throw new Error(`cashflow pull: ${remoteCashflowRes.error.message}`);
    }
    const remoteCashflow: CashflowEntry[] = (remoteCashflowRes.data ?? [])
      .filter((row) => row.workspace_id === ws)
      .map(rowToCashflowEntry);
    const localCashflow = loaders.loadCashflow();
    const mergedCashflow = mergeWithConflict(
      localCashflow.entries,
      remoteCashflow,
      report.cashflow
    );
    loaders.saveCashflow({
      ...localCashflow,
      entries: mergedCashflow,
      updatedAt: new Date().toISOString()
    });

    // 3. PR — fetch head + items, then assemble
    const remotePRsRes = await client
      .from<PurchaseRequestRow>("purchase_requests")
      .select("*");
    if (remotePRsRes.error) {
      throw new Error(`PR pull: ${remotePRsRes.error.message}`);
    }
    const remoteItemsRes = await client
      .from<PRLineItemRow>("pr_line_items")
      .select("*");
    if (remoteItemsRes.error) {
      throw new Error(`PR items pull: ${remoteItemsRes.error.message}`);
    }
    const remotePRRows = (remotePRsRes.data ?? []).filter(
      (row) => row.workspace_id === ws
    );
    const remoteItemRows = remoteItemsRes.data ?? [];
    const remotePRs: PurchaseRequest[] = remotePRRows.map((row) =>
      rowToPurchaseRequest(row, remoteItemRows)
    );
    const localPRs = loaders.loadPRs();
    const mergedPRs = mergeWithConflict(
      localPRs.prs,
      remotePRs,
      report.purchaseRequests
    );
    loaders.savePRs({
      ...localPRs,
      prs: mergedPRs,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    report.ok = false;
    report.error = err instanceof Error ? err.message : String(err);
  }
  report.finishedAt = new Date().toISOString();
  return report;
}

// ----------------------------------------------------------------------------
// Two-way sync — pull first, then push the merged state back so cloud
// catches up with local-won conflicts. UI shows ONE button "Sync now".
// ----------------------------------------------------------------------------

export async function twoWaySync(
  client: SupabaseLikeClient,
  workspaceId: string,
  loaders: SyncLoaders = defaultSyncLoaders()
): Promise<SyncReport> {
  // Step 1 — pull
  const pullReport = await pullFromSupabase(client, workspaceId, loaders);
  if (!pullReport.ok) {
    return { ...pullReport, direction: "two_way" };
  }
  // Step 2 — push merged state back to cloud
  const pushReport = await pushToSupabase(client, workspaceId, loaders);
  return {
    direction: "two_way",
    workspaceId,
    startedAt: pullReport.startedAt,
    finishedAt: pushReport.finishedAt,
    ok: pushReport.ok,
    error: pushReport.error,
    projects: {
      pushed: pushReport.projects.pushed,
      pulled: pullReport.projects.pulled,
      unchanged: pullReport.projects.unchanged,
      conflictsLocalWon: pullReport.projects.conflictsLocalWon,
      conflictsRemoteWon: pullReport.projects.conflictsRemoteWon
    },
    cashflow: {
      pushed: pushReport.cashflow.pushed,
      pulled: pullReport.cashflow.pulled,
      unchanged: pullReport.cashflow.unchanged,
      conflictsLocalWon: pullReport.cashflow.conflictsLocalWon,
      conflictsRemoteWon: pullReport.cashflow.conflictsRemoteWon
    },
    purchaseRequests: {
      pushed: pushReport.purchaseRequests.pushed,
      pulled: pullReport.purchaseRequests.pulled,
      unchanged: pullReport.purchaseRequests.unchanged,
      conflictsLocalWon: pullReport.purchaseRequests.conflictsLocalWon,
      conflictsRemoteWon: pullReport.purchaseRequests.conflictsRemoteWon
    }
  };
}
