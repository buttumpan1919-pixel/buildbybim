-- ============================================================================
-- Buildbybim.space — Public schema reset (ONE-TIME, DESTRUCTIVE)
--
-- USE: paste in Supabase SQL Editor → Run → then paste _all-in-one.sql → Run.
--
-- WHAT IT DOES:
--   - Drops all tables, functions, policies in `public` schema
--   - Drops Buildbybim-owned RLS policies on `storage.objects`
--   - Recreates `public` schema with default Supabase permissions
--
-- WHAT IT KEEPS:
--   - Supabase auth.* schema (users, sessions — managed by Supabase)
--   - Supabase storage.* schema structure (buckets/objects tables)
--   - All extensions (pgcrypto, uuid-ossp, etc.)
--
-- ⚠️ Only use this on a fresh project or one where you accept losing all
-- Buildbybim data. Auth users stay — they keep their login.
-- ============================================================================

-- 1. Drop the 4 RLS policies migration 0013 added on storage.objects
DROP POLICY IF EXISTS "evidence_files_workspace_select" ON storage.objects;
DROP POLICY IF EXISTS "evidence_files_workspace_insert" ON storage.objects;
DROP POLICY IF EXISTS "evidence_files_workspace_update" ON storage.objects;
DROP POLICY IF EXISTS "evidence_files_workspace_delete" ON storage.objects;

-- 2. Remove the evidence-files bucket (cascades to delete objects + their rows)
DELETE FROM storage.objects WHERE bucket_id = 'evidence-files';
DELETE FROM storage.buckets WHERE id = 'evidence-files';

-- 3. Nuke the public schema and rebuild it
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- 4. Restore default Supabase grants on the new public schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, service_role;

-- ============================================================================
-- DONE. Now paste _all-in-one.sql in the SQL Editor and Run.
-- ============================================================================
