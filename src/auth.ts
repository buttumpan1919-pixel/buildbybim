// Auth helpers — Phase F of SUPABASE_SETUP.md
//
// Wraps supabase-js auth so the rest of the app never imports the SDK directly.
// All functions are safe to call when Supabase isn't configured — they degrade
// gracefully (anonymous helpers return null, sign-in returns an "unavailable"
// error). This keeps the local-first guarantee intact.

import type { Session, Subscription } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "./supabaseClient";

export type AuthUser = {
  id: string;
  email: string;
  isAnonymous: boolean;
  createdAt: string;
};

export type AuthState = {
  user: AuthUser | null;
  status: "loading" | "ready";
};

export type WorkspaceSummary = {
  id: string;
  name: string;
  role: string;
};

function toAuthUser(session: Session | null): AuthUser | null {
  if (!session?.user) return null;
  const user = session.user;
  return {
    id: user.id,
    email: user.email ?? "",
    isAnonymous: Boolean(user.is_anonymous),
    createdAt: user.created_at ?? ""
  };
}

/**
 * Fetch the current authenticated user (if any). Returns null when Supabase
 * isn't configured or the user has no active session.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.auth.getSession();
  if (error) return null;
  return toAuthUser(data.session);
}

/**
 * Subscribe to auth state changes. Returns an unsubscribe function.
 * Fires immediately with the current state for convenience.
 */
export function onAuthChange(
  callback: (user: AuthUser | null) => void
): () => void {
  const client = getSupabaseClient();
  if (!client) {
    callback(null);
    return () => {};
  }
  // Fire current state immediately
  void client.auth.getSession().then(({ data }) => {
    callback(toAuthUser(data.session));
  });
  const { data } = client.auth.onAuthStateChange((_event, session) => {
    callback(toAuthUser(session));
  });
  const subscription: Subscription | undefined = data.subscription;
  return () => {
    subscription?.unsubscribe?.();
  };
}

/**
 * Send a magic link to the user's email. They'll click the link to complete
 * sign-in. The redirectTo URL must be allowlisted in Supabase Auth → URL
 * Configuration.
 */
export async function signInWithEmail(
  email: string,
  opts: { redirectTo?: string } = {}
): Promise<{ sent: boolean; error: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      sent: false,
      error: "Supabase ยังไม่ได้เชื่อมต่อ — ตั้ง .env ก่อน"
    };
  }
  const trimmed = email.trim();
  if (!trimmed || !trimmed.includes("@")) {
    return { sent: false, error: "อีเมลไม่ถูกต้อง" };
  }
  const redirect =
    opts.redirectTo ??
    (typeof window !== "undefined" ? `${window.location.origin}/account` : undefined);
  const { error } = await client.auth.signInWithOtp({
    email: trimmed,
    options: { emailRedirectTo: redirect }
  });
  if (error) {
    return { sent: false, error: error.message };
  }
  return { sent: true, error: "" };
}

/**
 * Sign in with Google OAuth. Browser redirects to Google → consent → back to
 * the redirectTo URL with a session cookie. Requires the Google provider to be
 * enabled in Supabase Auth → Providers with a valid OAuth client ID/secret.
 */
export async function signInWithGoogle(
  opts: { redirectTo?: string } = {}
): Promise<{ redirecting: boolean; error: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { redirecting: false, error: "Supabase ยังไม่ได้เชื่อมต่อ" };
  }
  const redirect =
    opts.redirectTo ??
    (typeof window !== "undefined" ? `${window.location.origin}/account` : undefined);
  const { error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: redirect }
  });
  if (error) {
    return { redirecting: false, error: error.message };
  }
  return { redirecting: true, error: "" };
}

/**
 * Sign in with LINE via Supabase Custom OIDC provider. Requires LINE Login
 * Channel + the OIDC provider registered in Supabase Auth → Providers → Custom
 * OAuth (provider id "line"). See docs/AUTH_OAUTH_SETUP.md for the setup.
 */
export async function signInWithLine(
  opts: { redirectTo?: string } = {}
): Promise<{ redirecting: boolean; error: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { redirecting: false, error: "Supabase ยังไม่ได้เชื่อมต่อ" };
  }
  const redirect =
    opts.redirectTo ??
    (typeof window !== "undefined" ? `${window.location.origin}/account` : undefined);
  // Supabase exposes custom OIDC providers via the same signInWithOAuth call.
  // The provider string must match the slug configured in Supabase dashboard.
  const { error } = await client.auth.signInWithOAuth({
    provider: "line" as unknown as "google",
    options: { redirectTo: redirect }
  });
  if (error) {
    return { redirecting: false, error: error.message };
  }
  return { redirecting: true, error: "" };
}

/**
 * Start an anonymous session — instant, no email needed. The user can later
 * upgrade to a real account via signInWithEmail.
 */
export async function signInAnonymously(): Promise<{ ok: boolean; error: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, error: "Supabase ยังไม่ได้เชื่อมต่อ" };
  }
  const { error } = await client.auth.signInAnonymously();
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true, error: "" };
}

export async function signOut(): Promise<{ ok: boolean; error: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, error: "Supabase ยังไม่ได้เชื่อมต่อ" };
  }
  const { error } = await client.auth.signOut();
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true, error: "" };
}

/**
 * Fetch workspaces the current user belongs to. Returns empty list if not
 * signed in or no memberships exist yet.
 */
export async function getMyWorkspaces(): Promise<WorkspaceSummary[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const user = await getCurrentUser();
  if (!user) return [];
  const { data, error } = await client
    .from("workspace_members")
    .select("role, workspace:workspaces(id, name)")
    .eq("user_id", user.id)
    .eq("status", "active");
  if (error || !data) return [];
  type Row = {
    role: string;
    workspace: { id: string; name: string } | Array<{ id: string; name: string }> | null;
  };
  const rows = data as unknown as Row[];
  const summaries: WorkspaceSummary[] = [];
  for (const row of rows) {
    const ws = Array.isArray(row.workspace) ? row.workspace[0] : row.workspace;
    if (ws && ws.id) {
      summaries.push({ id: ws.id, name: ws.name, role: row.role });
    }
  }
  return summaries;
}

/**
 * Ensure the signed-in user has at least one workspace + owner membership.
 * If they have none, create one. Returns the primary workspace id.
 */
export async function ensureWorkspace(
  name?: string
): Promise<{ workspaceId: string; error: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { workspaceId: "", error: "Supabase ยังไม่ได้เชื่อมต่อ" };
  }
  const user = await getCurrentUser();
  if (!user) {
    return { workspaceId: "", error: "ต้อง sign in ก่อน" };
  }
  const existing = await getMyWorkspaces();
  if (existing.length > 0) {
    return { workspaceId: existing[0].id, error: "" };
  }
  const defaultName = name?.trim() || (user.email ? `${user.email.split("@")[0]}'s workspace` : "My workspace");
  const { data: workspaceData, error: workspaceError } = await client
    .from("workspaces")
    .insert({
      name: defaultName,
      owner_user_id: user.id,
      status: "active"
    })
    .select("id")
    .single();
  if (workspaceError || !workspaceData) {
    return {
      workspaceId: "",
      error: workspaceError?.message ?? "ไม่สามารถสร้าง workspace ได้"
    };
  }
  const workspaceId = workspaceData.id as string;
  const { error: memberError } = await client.from("workspace_members").insert({
    workspace_id: workspaceId,
    user_id: user.id,
    role: "owner",
    status: "active"
  });
  if (memberError) {
    return { workspaceId, error: memberError.message };
  }
  return { workspaceId, error: "" };
}

export const authConnectionStatus = {
  configured: isSupabaseConfigured()
};
