-- ============================================================================
-- Buildbybim.space — Migration 0002 — Generic kv_store for adapter sync
-- ----------------------------------------------------------------------------
-- This table backs `src/supabaseAdapter.ts` Phase C: every localStorage key
-- becomes one row scoped by workspace_id. Lets us sync any JSON state without
-- writing per-key relational mappings (those come in Phase D).
--
-- Per PRD Section 6: this is the lowest layer that the storage adapter writes
-- to. Higher-value tables (cashflow_entries, plans, ...) from migration 0001
-- continue to exist and can be populated by per-key relational mappers later.
-- ============================================================================

set search_path = public;

create table if not exists kv_store (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  key text not null,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (workspace_id, key)
);

create index if not exists kv_store_workspace_idx on kv_store(workspace_id);
create index if not exists kv_store_updated_idx on kv_store(updated_at desc);

alter table kv_store enable row level security;

-- Members of the workspace can read/write keys under that workspace
create policy kv_store_select on kv_store
  for select using (is_workspace_member(workspace_id));

create policy kv_store_insert on kv_store
  for insert with check (is_workspace_member(workspace_id));

create policy kv_store_update on kv_store
  for update using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));

create policy kv_store_delete on kv_store
  for delete using (is_workspace_member(workspace_id));

-- updated_at auto-update
drop trigger if exists kv_store_updated_at on kv_store;
create trigger kv_store_updated_at
  before update on kv_store
  for each row execute function set_updated_at();
