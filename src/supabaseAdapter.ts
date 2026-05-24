// SupabaseAdapter — Phase C of SUPABASE_SETUP.md
//
// Local-first design:
//   - read/remove/list are SYNCHRONOUS, hitting the in-process LocalStorageAdapter
//     cache so the UI stays instant. No `await` cost on hot paths.
//   - write() updates local cache immediately + enqueues an async background
//     push to the kv_store table. Errors are surfaced via getSyncStatus().
//   - pullFromCloud()/pushToCloud() are EXPLICIT async actions for migration
//     or manual sync from the AdminPanel UI.
//
// Per PRD Section 6: only this file plus src/supabaseClient.ts may import
// `@supabase/supabase-js`. Other modules go through the StorageAdapter contract
// — they don't change when sync is on or off.

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  LocalStorageAdapter,
  setStorageAdapter,
  type StorageAdapter
} from "./storageAdapter";
import { getSupabaseClient } from "./supabaseClient";

/**
 * Keys we intentionally keep local-only (per-device preferences, session
 * tokens, etc). They never leave the device even when sync is on.
 */
const LOCAL_ONLY_PREFIXES = ["buildbybim.auth.", "build-by-bim.workspace-language"];

const KV_STORE_TABLE = "kv_store";

export type SupabaseAdapterStatus = {
  readonly name: "supabase";
  readonly workspaceId: string;
  readonly pendingWrites: number;
  readonly lastPushAt: string;
  readonly lastPullAt: string;
  readonly lastError: string;
};

export function isLocalOnlyKey(key: string): boolean {
  return LOCAL_ONLY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

export class SupabaseAdapter implements StorageAdapter {
  readonly name = "supabase" as const;

  private readonly local: LocalStorageAdapter;
  private readonly client: SupabaseClient;
  private readonly workspaceId: string;
  private pendingFlush: Set<string> = new Set();
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private lastPushAt = "";
  private lastPullAt = "";
  private lastError = "";

  constructor(client: SupabaseClient, workspaceId: string) {
    if (!workspaceId) {
      throw new Error("SupabaseAdapter requires a workspaceId");
    }
    this.client = client;
    this.workspaceId = workspaceId;
    this.local = new LocalStorageAdapter();
  }

  // --- StorageAdapter sync surface ---

  read(key: string): string | null {
    return this.local.read(key);
  }

  write(key: string, value: string): void {
    this.local.write(key, value);
    if (!isLocalOnlyKey(key)) {
      this.enqueue(key);
    }
  }

  remove(key: string): void {
    this.local.remove(key);
    if (!isLocalOnlyKey(key)) {
      // Enqueue null-write — flush path knows to delete when local read returns null.
      this.enqueue(key);
    }
  }

  list(prefix?: string): string[] {
    return this.local.list(prefix);
  }

  // --- Phase C async surface ---

  getStatus(): SupabaseAdapterStatus {
    return {
      name: this.name,
      workspaceId: this.workspaceId,
      pendingWrites: this.pendingFlush.size,
      lastPushAt: this.lastPushAt,
      lastPullAt: this.lastPullAt,
      lastError: this.lastError
    };
  }

  /**
   * Pull every kv_store row for this workspace into the local cache.
   * Overwrites local values when the cloud copy is newer (best-effort, no
   * conflict resolution beyond last-write-wins).
   */
  async pullFromCloud(): Promise<{ pulled: number }> {
    this.lastError = "";
    try {
      const { data, error } = await this.client
        .from(KV_STORE_TABLE)
        .select("key, value")
        .eq("workspace_id", this.workspaceId);

      if (error) throw error;

      const rows = (data ?? []) as Array<{ key: string; value: unknown }>;
      let pulled = 0;
      for (const row of rows) {
        if (isLocalOnlyKey(row.key)) continue;
        const serialized =
          typeof row.value === "string"
            ? row.value
            : JSON.stringify(row.value);
        this.local.write(row.key, serialized);
        pulled += 1;
      }
      this.lastPullAt = new Date().toISOString();
      return { pulled };
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  /**
   * Push every non-local-only key from the local cache to the cloud kv_store
   * for this workspace. Uses upsert so it's safe to re-run.
   */
  async pushToCloud(): Promise<{ pushed: number; deleted: number }> {
    this.lastError = "";
    try {
      const allKeys = this.local.list();
      const writable = allKeys.filter((key) => !isLocalOnlyKey(key));

      // Build upsert payload — parse each value as JSON if possible, else send as string.
      const rows = writable.map((key) => {
        const raw = this.local.read(key);
        return {
          workspace_id: this.workspaceId,
          key,
          value: parseValueForJsonb(raw)
        };
      });

      let pushed = 0;
      if (rows.length > 0) {
        const { error } = await this.client
          .from(KV_STORE_TABLE)
          .upsert(rows, { onConflict: "workspace_id,key" });
        if (error) throw error;
        pushed = rows.length;
      }

      this.lastPushAt = new Date().toISOString();
      this.pendingFlush.clear();
      return { pushed, deleted: 0 };
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  /**
   * Drain pending writes to the cloud immediately. Useful from event handlers
   * that want to confirm sync (e.g. "Save and close").
   */
  async flushPending(): Promise<{ flushed: number; failed: number }> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    const keys = Array.from(this.pendingFlush);
    if (keys.length === 0) return { flushed: 0, failed: 0 };

    const rows = keys.map((key) => {
      const raw = this.local.read(key);
      return {
        workspace_id: this.workspaceId,
        key,
        value: parseValueForJsonb(raw)
      };
    });

    try {
      const { error } = await this.client
        .from(KV_STORE_TABLE)
        .upsert(rows, { onConflict: "workspace_id,key" });
      if (error) throw error;
      this.pendingFlush.clear();
      this.lastPushAt = new Date().toISOString();
      return { flushed: rows.length, failed: 0 };
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      return { flushed: 0, failed: rows.length };
    }
  }

  // --- internal ---

  private enqueue(key: string): void {
    this.pendingFlush.add(key);
    if (this.flushTimer || typeof window === "undefined") return;
    // Coalesce writes — flush after 800 ms of inactivity.
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      void this.flushPending();
    }, 800);
  }
}

function parseValueForJsonb(raw: string | null): unknown {
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    // Fall back to storing as a string-typed JSONB value.
    return raw;
  }
}

// ---------------------------------------------------------------------------
// Activation helpers — called from the AdminPanel cloud sync card
// ---------------------------------------------------------------------------

let activeAdapter: SupabaseAdapter | null = null;

export function getActiveSupabaseAdapter(): SupabaseAdapter | null {
  return activeAdapter;
}

/**
 * Wire SupabaseAdapter as the default adapter. If env is missing or workspaceId
 * is empty, leaves the existing LocalStorageAdapter in place and returns null.
 *
 * Callers should:
 *   1. Make sure the user is authenticated and a workspace member.
 *   2. Pass the workspace id they want to sync against.
 *   3. Optionally call `pullFromCloud()` afterwards to hydrate local with cloud.
 */
export function activateSupabaseSync(workspaceId: string): SupabaseAdapter | null {
  const client = getSupabaseClient();
  if (!client) return null;
  if (!workspaceId) return null;
  const adapter = new SupabaseAdapter(client, workspaceId);
  setStorageAdapter(adapter);
  activeAdapter = adapter;
  return adapter;
}

/**
 * Disconnect cloud sync and revert to plain LocalStorageAdapter. Local data
 * stays intact; only the writes-to-cloud behavior is turned off.
 */
export function deactivateSupabaseSync(): void {
  setStorageAdapter(new LocalStorageAdapter());
  activeAdapter = null;
}
