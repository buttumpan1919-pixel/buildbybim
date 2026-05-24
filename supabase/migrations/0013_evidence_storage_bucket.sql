-- ============================================================================
-- Buildbybim.space — Migration 0013 — Evidence file storage bucket (Sprint 10A)
-- ----------------------------------------------------------------------------
-- Spec: Evidence Asset PRD Section 2 (Not implemented yet: Supabase Storage)
--       Sprint 10A "mobile-readiness" — unlock camera/file upload from phones.
-- Pairs with: src/evidence.ts (will switch dataUrl → storage_path) +
--             src/storage.client.ts (upload + signed URL helpers)
--
-- Bucket policy:
--   - Path convention: `{workspace_id}/{evidence_asset_id}/{filename}`
--   - Files are private by default; UI fetches via short-lived signed URL
--   - 25MB per-file limit (set in dashboard or here via raw SQL)
--   - Image + PDF + small video allowed (jpg/png/heic/webp/pdf/mp4)
--
-- RLS: scoped via the path prefix matching a workspace the caller belongs to.
-- Uses the existing `is_workspace_member(workspace_id)` helper.
-- ============================================================================

set search_path = public;

-- The supabase storage extension provides storage.buckets and storage.objects.
-- Creating a bucket via SQL is the portable path; the dashboard UI also works.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'evidence-files',
  'evidence-files',
  false,
  26214400, -- 25 MiB
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/pdf',
    'video/mp4',
    'video/quicktime',
    'application/octet-stream'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ----------------------------------------------------------------------------
-- RLS policies on storage.objects scoped to this bucket.
-- Path convention: the first folder segment is the workspace_id (uuid).
-- We split with `storage.foldername(name)` which returns text[]; the first
-- element is the workspace folder.
-- ----------------------------------------------------------------------------

-- SELECT: read your workspace's evidence files
create policy evidence_files_select on storage.objects
  for select using (
    bucket_id = 'evidence-files'
    and is_workspace_member((storage.foldername(name))[1]::uuid)
  );

-- INSERT: upload to a workspace you belong to
create policy evidence_files_insert on storage.objects
  for insert with check (
    bucket_id = 'evidence-files'
    and is_workspace_member((storage.foldername(name))[1]::uuid)
  );

-- UPDATE: replace your own workspace's files (rare; we usually upload + delete)
create policy evidence_files_update on storage.objects
  for update using (
    bucket_id = 'evidence-files'
    and is_workspace_member((storage.foldername(name))[1]::uuid)
  );

-- DELETE: remove from your workspace
create policy evidence_files_delete on storage.objects
  for delete using (
    bucket_id = 'evidence-files'
    and is_workspace_member((storage.foldername(name))[1]::uuid)
  );

-- ----------------------------------------------------------------------------
-- Optional: a column on `evidence_assets` to point at the bucket path so the
-- relational mapper (Sprint 10B) can rebuild signed URLs without storing
-- short-lived URLs in the row.
-- ----------------------------------------------------------------------------

alter table evidence_assets
  add column if not exists storage_bucket text not null default '',
  add column if not exists storage_path text not null default '';

create index if not exists evidence_assets_storage_path_idx
  on evidence_assets(workspace_id, storage_path)
  where storage_path <> '';
