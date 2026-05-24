# Supabase Setup — Buildbybim.space

Updated: 2026-05-23
Status: Phase A connection + Phase B schema scaffold (sync UI follows in next phase)

Project: `mnanqmmgniaqpvkzupmn` (project owner already created)

This guide covers the steps to wire the existing Supabase project to the local-first app without breaking the localStorage default. Per PRD Section 6, Supabase is one backend behind the storage adapter — no module imports `supabase-js` directly except `src/supabaseClient.ts`.

## 1. Get connection credentials

1. Open https://supabase.com/dashboard/project/mnanqmmgniaqpvkzupmn/settings/api
2. Copy two values:
   - **Project URL** — looks like `https://mnanqmmgniaqpvkzupmn.supabase.co`
   - **anon / public key** — long JWT under "Project API keys" → row `anon` `public`
3. **DO NOT** copy the `service_role` key into the browser. It bypasses RLS and must stay server-side only.

## 2. Paste into local `.env`

Copy the template, then fill in:

```bash
cp .env.example .env
```

Edit `.env`:

```dotenv
VITE_SUPABASE_URL=https://mnanqmmgniaqpvkzupmn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...your_anon_key_here
VITE_SUPABASE_SYNC_ENABLED=false   # keep false until adapter ships in Phase C
```

`.env` is gitignored, never commit it.

Restart `npm run dev` after editing so Vite picks up the new env.

## 3. Run the SQL migrations

Open the Supabase SQL editor: https://supabase.com/dashboard/project/mnanqmmgniaqpvkzupmn/sql/new

Run migrations in order from `supabase/migrations/`:

| # | File | Purpose |
|---|---|---|
| 0001 | `0001_initial_platform.sql` | workspaces, members, plans, access rules, audit, cashflow |
| 0002 | `0002_kv_store.sql` | generic KV store used by `SupabaseAdapter` |
| 0003 | `0003_projects.sql` | Project entity (Sprint 0) |
| 0004 | `0004_cost_codes.sql` | Cost Code catalog (Sprint 1) — includes 7 seed root rows |
| 0005 | `0005_suppliers.sql` | Suppliers + price history (Sprint 2) |
| 0006 | `0006_purchase_requests.sql` | PR + line items (Sprint 3) |
| 0007 | `0007_rfqs.sql` | RFQs + responses + item quotes (Sprint 4) |
| 0008 | `0008_cashflow_extension.sql` | Cashflow project/cost-code/supplier fields + recurring (Sprint 5) |
| 0009 | `0009_project_control_settings.sql` | Project Control alert thresholds (Sprint 6) |
| 0010 | `0010_approval_requests.sql` | Approval Center (Sprint 7) |
| 0011 | `0011_evidence_assets.sql` | Evidence assets + links (Sprint 8) |
| 0012 | `0012_project_access_document_authority.sql` | Project RBAC + document authority |
| **0013** | **`0013_evidence_storage_bucket.sql`** | **Evidence file storage bucket (Sprint 10A — mobile PWA)** |

After 0001 all tables enable RLS, scoped by `workspace_members`. Anonymous users can read nothing, write nothing.

After 0013 the `evidence-files` storage bucket exists with workspace-scoped RLS — see step 6B below for verification.

## 4. Create your first workspace + membership

Still in SQL editor, run once after creating an auth user (see step 5 first if you haven't signed up yet):

```sql
insert into workspaces (id, name, slug, owner_user_id, status)
values (
  gen_random_uuid(),
  'My Workspace',
  'my-workspace',
  auth.uid(),
  'active'
)
returning id;

-- Copy the returned id, then:
insert into workspace_members (workspace_id, user_id, role, status)
values (
  '<paste-workspace-id-here>',
  auth.uid(),
  'owner',
  'active'
);
```

Or use the Supabase Table Editor UI for the same result.

## 5. Enable auth providers

Open https://supabase.com/dashboard/project/mnanqmmgniaqpvkzupmn/auth/providers

Recommended starter set:

- **Email** — magic link only (no passwords). Easy onboarding.
- **Anonymous sign-ins** — turn ON so first-time visitors can use saved features without account creation; upgrade to email later.

Skip Google/Facebook OAuth until you have a production domain on file.

### URL configuration for magic link redirect

Open https://supabase.com/dashboard/project/mnanqmmgniaqpvkzupmn/auth/url-configuration and add to **Redirect URLs**:

- `http://127.0.0.1:5173/account` (dev)
- `http://localhost:5173/account` (dev alt)
- `https://buildbybim.space/account` (production, when deployed)

This lets the magic link `emailRedirectTo` succeed. The `/account` page automatically picks up the session via `supabase.auth.onAuthStateChange` and shows the signed-in card.

### Auth UI flow now live (Phase F)

- Visit `/account`
- Enter email → click "Send magic link" → check inbox → click link → land back at `/account` signed in
- **OR** click "Continue without an account" for an instant anonymous session
- Signed-in card shows: email · user id · workspaces · sign-out · workspace creation button (if no workspace yet)
- Once you have a workspace, `/admin?tab=overview` Cloud Sync card auto-fills your workspace UUID and you just click **Activate cloud sync**

## 6. (Phase C — shipped) wire the Supabase adapter

`src/supabaseAdapter.ts` is live and exposes:

- `SupabaseAdapter` — implements `StorageAdapter` (sync read/write/remove/list backed by `LocalStorageAdapter` cache + background cloud upserts via `kv_store` table)
- `activateSupabaseSync(workspaceId)` — wraps the default adapter so all future writes also push to cloud
- `deactivateSupabaseSync()` — revert to plain LocalStorageAdapter (local data untouched)
- `getActiveSupabaseAdapter()` — read sync status (`pendingWrites`, `lastPushAt`, `lastPullAt`, `lastError`)

The `kv_store` table is in `supabase/migrations/0002_kv_store.sql` — generic JSONB key-value table scoped by workspace_id with RLS via `is_workspace_member()`. **Run this migration too** in the Supabase SQL editor before testing sync.

Usage from the UI:

1. Open `/admin?tab=overview` workspace
2. Scroll to the **Cloud sync (Supabase)** card
3. Paste a workspace UUID (from `workspaces` table — see step 4 above)
4. Click **Activate cloud sync** — all future writes mirror to cloud automatically (debounced 800 ms)
5. **Push local → cloud** = upsert every non-local-only key from this device into the cloud kv_store
6. **Pull cloud → local** = overwrite local cache with cloud values for this workspace
7. **Disconnect** = stop syncing (local data stays intact)

Keys kept local-only (never push to cloud): anything matching `buildbybim.auth.*` or `build-by-bim.workspace-language`.

The pattern: `cashflow.ts`, `membership.ts`, `boqTaskLinkage.ts`, `stylePreviewI18n.ts` continue to use `defaultStorageAdapter` unchanged — they don't know whether they're writing to localStorage or to Supabase. Adding new storage-backed modules in the future just requires using the same adapter pattern; no Supabase-specific code needed.

## 6B. Evidence file storage bucket (Sprint 10A — mobile PWA)

After running `0013_evidence_storage_bucket.sql`:

1. Open https://supabase.com/dashboard/project/mnanqmmgniaqpvkzupmn/storage/buckets
2. Confirm the **`evidence-files`** bucket exists with:
   - Public: **off**
   - File size limit: **25 MB**
   - Allowed MIME types: jpeg/png/webp/heic/heif/pdf/mp4/quicktime
3. Path convention enforced by RLS: **`{workspace_id}/{evidence_asset_id}/{filename}`** — the first folder segment must be a workspace the caller is a member of.
4. UI fetches files via **short-lived signed URL** (default 10 min) — see `src/storage.client.ts` (`getEvidenceSignedUrl`).
5. The `evidence_assets` table gained two new columns: `storage_bucket` + `storage_path`. The relational mapper (Sprint 10B) will populate them when uploading.

For local-first / offline use, `src/storage.client.ts` exposes `isStorageAvailable()` → returns `false` when env vars unset. UI components fall back to `fileToDataUrl` (base64 in localStorage) so offline capture still works; data syncs up when the device comes back online + reaches Supabase.

## 6C. PWA install (Sprint 10A)

The app is now installable on mobile + desktop:

- `public/manifest.webmanifest` declares standalone display + 3 home-screen shortcuts (Hub, Cashflow, Defect Site Report)
- `public/sw.js` service worker caches the app shell network-first with offline fallback (only registered in production builds; dev still hot-reloads as normal)
- `src/pwa.ts` registers SW + exposes `tryInstallPwa()` for an "Install" button when the browser offers it

To verify on mobile:
1. Open `https://buildbybim.space/` (or your Netlify preview)
2. Chrome → menu → **Install app** (or **Add to Home screen** on iOS Safari 16.4+)
3. Open from home screen — should launch standalone (no browser chrome) with splash from `theme_color` `#0A0A09`

## 7. Deploy environment variables

When deploying via Netlify (recommended Stage 1 host):

1. Netlify dashboard → Site → **Site configuration** → **Environment variables**
2. Add the same three keys: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_SYNC_ENABLED`
3. Trigger redeploy

## 8. Verify connection

After step 2, open the browser console at `http://127.0.0.1:5173/` and run:

```js
const { supabaseConnectionStatus } = await import("/src/supabaseClient.ts");
console.log(supabaseConnectionStatus);
// Expect: { url: "https://...", configured: true, syncEnabled: false }
```

If `configured` is `true` you are good. The actual sync feature is opt-in by `VITE_SUPABASE_SYNC_ENABLED=true` later.

## 9. Local-first guarantee

The app continues to work fully without `.env`. `supabaseClient.ts` returns `null` when env is missing, and every data module routes through `defaultStorageAdapter` (currently `LocalStorageAdapter`). Setting up Supabase is additive, not a hard switchover.

## 10. Common pitfalls

- **Vite env not loading**: env vars must be prefixed `VITE_` to be exposed to browser. Restart dev server after editing `.env`.
- **CORS error from Supabase**: add `http://127.0.0.1:5173` and your production domain in Supabase → Settings → API → Allowed origins.
- **RLS denies everything**: confirm you have a `workspace_members` row matching `auth.uid()` for the workspace; without active membership, all reads return zero rows.
- **Anonymous sessions wiped on refresh**: that's expected. To persist, prompt the user to upgrade to email before they lose their workspace.

## 11. Roadmap

| Phase | Status | What ships |
|---|---|---|
| A. Connection scaffold | done | `src/supabaseClient.ts`, `.env.example`, `vite-env.d.ts`, `supabase/migrations/0001_initial_platform.sql` |
| B. Schema in cloud | manual (user runs SQL) | tables + RLS live in Supabase project |
| C. SupabaseAdapter | **done** | `src/supabaseAdapter.ts` + Cloud Sync card in `/admin` overview tab + `supabase/migrations/0002_kv_store.sql` |
| **F. Auth UI** | **done** | `src/auth.ts` (magic link + anonymous + ensureWorkspace) + `/account` sign-in/up flow + AdminPanel auto-picks workspace from auth session |
| D. Relational mappers | future | per-key mappers (e.g. `cashflow.entries.v1` → `cashflow_entries` table rows instead of generic kv_store) |
| E. Realtime subscriptions | future | live multi-device sync via Supabase Realtime |
| G. Payment (Omise/Stripe) | v0.5 | `/support-plans` Activate triggers checkout |
