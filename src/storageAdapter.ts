/**
 * Storage adapter pattern — mandated by PRD Section 6.
 *
 * Architectural flow:
 *   UI component -> domain service -> storage adapter -> localStorage / IndexedDB / future API
 *
 * Rules enforced here:
 *   - Domain services MUST go through a StorageAdapter, never call window.localStorage directly.
 *   - Adding a future backend (Supabase, REST, IndexedDB) is implemented by writing a new
 *     class that satisfies the StorageAdapter contract; no domain code needs to change.
 *   - All raw I/O is guarded for SSR (typeof window === "undefined") and wrapped in try/catch
 *     so quota errors or private-mode failures degrade silently instead of crashing the app.
 */

export interface StorageAdapter {
  readonly name: string;
  read(key: string): string | null;
  write(key: string, value: string): void;
  remove(key: string): void;
  list(prefix?: string): string[];
}

/**
 * Read a JSON-serialized value from the adapter.
 *
 * - If the key is missing, returns `fallback`.
 * - If JSON.parse throws, returns `fallback` (never throws).
 * - If `normalize` is provided, the parsed value is passed through it; if `normalize`
 *   itself throws, returns `fallback`.
 */
export function readJson<T>(
  adapter: StorageAdapter,
  key: string,
  fallback: T,
  normalize?: (raw: unknown) => T
): T {
  let raw: string | null;
  try {
    raw = adapter.read(key);
  } catch {
    return fallback;
  }

  if (raw === null || raw === undefined) {
    return fallback;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return fallback;
  }

  if (!normalize) {
    return parsed as T;
  }

  try {
    return normalize(parsed);
  } catch {
    return fallback;
  }
}

/**
 * Write a value to the adapter as JSON. Swallows serialization and write errors silently
 * so that storage failures (quota, private mode) never break the calling domain service.
 */
export function writeJson<T>(adapter: StorageAdapter, key: string, value: T): void {
  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch {
    return;
  }

  try {
    adapter.write(key, serialized);
  } catch {
    // Silently swallow quota / private-mode / serialization failures.
  }
}

/**
 * LocalStorage-backed adapter. Used by default in the browser. All operations are guarded
 * so SSR and storage-disabled contexts behave like a no-op rather than crashing.
 */
export class LocalStorageAdapter implements StorageAdapter {
  readonly name = "localStorage";

  read(key: string): string | null {
    if (typeof window === "undefined") {
      return null;
    }
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  write(key: string, value: string): void {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Quota exceeded or storage disabled — degrade silently.
    }
  }

  remove(key: string): void {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore.
    }
  }

  list(prefix?: string): string[] {
    if (typeof window === "undefined") {
      return [];
    }
    try {
      const storage = window.localStorage;
      const keys: string[] = [];
      for (let i = 0; i < storage.length; i += 1) {
        const key = storage.key(i);
        if (key === null) {
          continue;
        }
        if (!prefix || key.startsWith(prefix)) {
          keys.push(key);
        }
      }
      return keys;
    } catch {
      return [];
    }
  }
}

/**
 * In-memory adapter for SSR, unit tests, and as a safe fallback when `window` is absent.
 * State lives only for the lifetime of the process.
 */
export class MemoryAdapter implements StorageAdapter {
  readonly name = "memory";
  private readonly store = new Map<string, string>();

  read(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }

  write(key: string, value: string): void {
    this.store.set(key, value);
  }

  remove(key: string): void {
    this.store.delete(key);
  }

  list(prefix?: string): string[] {
    const keys: string[] = [];
    for (const key of this.store.keys()) {
      if (!prefix || key.startsWith(prefix)) {
        keys.push(key);
      }
    }
    return keys;
  }
}

/**
 * Default singleton — picks LocalStorageAdapter in the browser, MemoryAdapter otherwise.
 * Exposed so domain services can import it directly without needing to know which
 * concrete backend is in use.
 */
export const defaultStorageAdapter: StorageAdapter =
  typeof window === "undefined" ? new MemoryAdapter() : new LocalStorageAdapter();

let activeAdapter: StorageAdapter = defaultStorageAdapter;

/**
 * Returns the currently active StorageAdapter singleton. Domain services that want to
 * remain swappable in tests should call this instead of importing `defaultStorageAdapter`
 * directly.
 */
export function getStorageAdapter(): StorageAdapter {
  return activeAdapter;
}

/**
 * Swap the active adapter. Intended primarily for unit tests that want to inject a
 * MemoryAdapter (or a mock) without touching real browser storage.
 */
export function setStorageAdapter(adapter: StorageAdapter): void {
  activeAdapter = adapter;
}
