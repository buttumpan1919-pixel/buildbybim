// Supabase client singleton — lazy + null-safe so the app keeps working
// without VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (pure local-first mode).
//
// Per PRD Section 6: backend access goes through an adapter, never through
// direct module imports of supabase-js scattered across the codebase.
// Callers should:
//   1) check `isSupabaseEnabled()` before invoking sync features, or
//   2) use the StorageAdapter via `defaultStorageAdapter` (which can be
//      swapped to SupabaseAdapter when sync is on).

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";
const SYNC_FLAG = (import.meta.env.VITE_SUPABASE_SYNC_ENABLED ?? "").toLowerCase();

let cachedClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
}

export function isSupabaseSyncEnabled(): boolean {
  return isSupabaseConfigured() && (SYNC_FLAG === "true" || SYNC_FLAG === "1");
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!cachedClient) {
    cachedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: "buildbybim.auth.v1"
      }
    });
  }
  return cachedClient;
}

/**
 * For test / cleanup: reset the singleton (mostly used by Vitest).
 */
export function resetSupabaseClient(): void {
  cachedClient = null;
}

export const supabaseConnectionStatus = {
  url: SUPABASE_URL,
  configured: isSupabaseConfigured(),
  syncEnabled: isSupabaseSyncEnabled()
};
