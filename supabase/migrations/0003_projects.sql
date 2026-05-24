-- ============================================================================
-- Buildbybim.space — Migration 0003 — Projects (Sprint 0 Builk parity)
-- ----------------------------------------------------------------------------
-- Spec: docs/PROJECT_PRD.md Section 12
-- Pairs with: src/projects.ts (local TS module + adapter pattern)
--
-- Extended Project entity with 16 financial + lifecycle fields. Replaces the
-- 7-field ProjectRecord shim that lived inside the BuildDocs workspace blob.
-- Used as the entry point for all Cost Control modules (PR/RFQ/cost recording
-- in upcoming sprints).
--
-- RLS scoped to is_workspace_member() (defined in 0001_initial_platform.sql).
-- ============================================================================

set search_path = public;

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  code text not null,
  name text not null,
  client_id uuid,
  client_name text not null default '',
  customer_type text check (customer_type in ('individual', 'gov', 'corporate')),
  contract_value numeric(14, 2) not null default 0,
  planned_cost numeric(14, 2) not null default 0,
  actual_cost numeric(14, 2) not null default 0,
  planned_revenue numeric(14, 2) not null default 0,
  actual_revenue numeric(14, 2) not null default 0,
  start_date date,
  end_date date,
  status text not null default 'draft' check (status in (
    'draft', 'normal', 'delayed', 'closed', 'cancelled'
  )),
  has_budget boolean not null default false,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, code)
);

create index if not exists projects_workspace_idx on projects(workspace_id);
create index if not exists projects_status_idx on projects(workspace_id, status);
create index if not exists projects_end_date_idx on projects(workspace_id, end_date);
create index if not exists projects_client_idx on projects(workspace_id, client_id);

alter table projects enable row level security;

create policy projects_select on projects
  for select using (is_workspace_member(workspace_id));

create policy projects_insert on projects
  for insert with check (is_workspace_member(workspace_id));

create policy projects_update on projects
  for update using (is_workspace_member(workspace_id));

create policy projects_delete on projects
  for delete using (is_workspace_member(workspace_id));

drop trigger if exists projects_updated_at on projects;
create trigger projects_updated_at
  before update on projects
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Optional FK from cashflow_entries → projects, deferred to Sprint 5 when
-- project rollup is wired. Leaving the column UUID without a hard FK so older
-- entries that referenced a workspace-local project id still load.
-- ----------------------------------------------------------------------------
