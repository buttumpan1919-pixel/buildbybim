-- ============================================================================
-- Buildbybim.space — One-paste schema bootstrap
-- Generated: 2026-05-24T18:10:08Z
-- Combines migrations 0001 → 0013 in order.
--
-- USE: open Supabase Dashboard → SQL Editor → New query → paste this entire file → Run.
-- Idempotent: every CREATE uses IF NOT EXISTS / CREATE OR REPLACE so re-runs are safe.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 0001_initial_platform.sql
-- ----------------------------------------------------------------------------
-- ============================================================================
-- Buildbybim.space — Migration 0001 — Initial platform tables
-- ----------------------------------------------------------------------------
-- Based on:
--   docs/PLATFORM_ERD.md Section 4 "First Production Schema Cut"
--   docs/MEMBERSHIP_ACCESS_PRD.md Section 7 MVP Scope
--   docs/CASHFLOW_PRD.md Section 4 Data Model
--
-- This migration creates the minimal first cut for cloud sync:
--   - workspaces + workspace_members (tenant boundary, PRD ERD Section 3 note)
--   - plans + app_access_rules + app_access_overrides + audit_logs (membership)
--   - cashflow_entries (first wedge app data with cloud sync)
--
-- All tables enable RLS. Policies are scoped to workspace membership.
-- Anonymous sessions are allowed read access only — no anonymous writes.
-- ============================================================================

set search_path = public;

-- ---------------------------------------------------------------------------
-- 1. workspaces — tenant boundary for everything else
-- ---------------------------------------------------------------------------
create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  owner_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspaces_owner_idx on workspaces(owner_user_id);

-- ---------------------------------------------------------------------------
-- 2. workspace_members — who can see what
-- ---------------------------------------------------------------------------
create table if not exists workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in (
    'owner', 'admin', 'member', 'reviewer', 'vendor', 'support_operator', 'viewer'
  )),
  status text not null default 'active' check (status in ('active', 'invited', 'removed')),
  joined_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create index if not exists workspace_members_user_idx on workspace_members(user_id);
create index if not exists workspace_members_workspace_idx on workspace_members(workspace_id);

-- Helper: is the calling user a member of the workspace?
create or replace function is_workspace_member(target_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from workspace_members m
    where m.workspace_id = target_workspace
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

-- ---------------------------------------------------------------------------
-- 3. plans — admin-configurable tiers per MEMBERSHIP_ACCESS_PRD.md
-- ---------------------------------------------------------------------------
create table if not exists plans (
  id text primary key,                 -- e.g. 'plan-free', 'plan-support-monthly'
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,
  description text not null default '',
  price_amount numeric(12, 2) not null default 0,
  currency text not null default 'THB',
  billing_interval text not null default 'none' check (billing_interval in (
    'monthly', 'yearly', 'one_time', 'none'
  )),
  support_quota integer not null default 0,
  billing_note text not null default '',
  status text not null default 'draft' check (status in ('active', 'draft', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists plans_workspace_idx on plans(workspace_id);

-- ---------------------------------------------------------------------------
-- 4. app_access_rules — plan-level entitlements
-- ---------------------------------------------------------------------------
create table if not exists app_access_rules (
  id text primary key,
  plan_id text not null references plans(id) on delete cascade,
  app_id text not null,
  feature_key text not null default '',
  access_level text not null default 'none' check (access_level in (
    'none', 'preview', 'quick', 'saved', 'read', 'write', 'export', 'admin', 'support'
  )),
  enabled boolean not null default true,
  limits jsonb not null default '{}'::jsonb,
  priority integer not null default 10,
  starts_at timestamptz,
  ends_at timestamptz
);

create index if not exists app_access_rules_plan_idx on app_access_rules(plan_id);
create index if not exists app_access_rules_app_idx on app_access_rules(app_id);

-- ---------------------------------------------------------------------------
-- 5. app_access_overrides — admin grants per workspace/member/user
-- ---------------------------------------------------------------------------
create table if not exists app_access_overrides (
  id text primary key,
  workspace_id uuid references workspaces(id) on delete cascade,
  workspace_member_id uuid references workspace_members(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  scope text not null check (scope in ('workspace', 'member', 'user')),
  app_id text not null,
  feature_key text not null default '',
  effect text not null check (effect in ('allow', 'deny')),
  access_level text not null default 'none',
  limits jsonb not null default '{}'::jsonb,
  reason text not null default '',
  created_by uuid references auth.users(id),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists app_access_overrides_workspace_idx on app_access_overrides(workspace_id);
create index if not exists app_access_overrides_user_idx on app_access_overrides(user_id);
create index if not exists app_access_overrides_app_idx on app_access_overrides(app_id);

-- ---------------------------------------------------------------------------
-- 6. audit_logs — every permission/subscription change per PRD Section 5
-- ---------------------------------------------------------------------------
create table if not exists audit_logs (
  id text primary key,
  workspace_id uuid references workspaces(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_type text not null check (actor_type in ('user', 'admin', 'agent', 'system')),
  action text not null,
  target_type text not null,
  target_id text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_workspace_idx on audit_logs(workspace_id);
create index if not exists audit_logs_created_idx on audit_logs(created_at desc);

-- ---------------------------------------------------------------------------
-- 7. cashflow_entries — first wedge app with cloud sync
-- ---------------------------------------------------------------------------
create table if not exists cashflow_entries (
  id text primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid,
  document_id text not null default '',
  direction text not null check (direction in ('income', 'expense')),
  category text not null,
  amount numeric(14, 2) not null default 0,
  description text not null default '',
  entry_date date not null,
  status text not null default 'draft' check (status in ('draft', 'confirmed', 'void')),
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cashflow_entries_workspace_idx on cashflow_entries(workspace_id);
create index if not exists cashflow_entries_date_idx on cashflow_entries(entry_date desc);

-- ============================================================================
-- RLS POLICIES — workspace membership = source of truth
-- ============================================================================

alter table workspaces                 enable row level security;
alter table workspace_members          enable row level security;
alter table plans                      enable row level security;
alter table app_access_rules           enable row level security;
alter table app_access_overrides       enable row level security;
alter table audit_logs                 enable row level security;
alter table cashflow_entries           enable row level security;

-- workspaces: owner OR member can read; only owner can write
create policy workspaces_select on workspaces
  for select using (
    owner_user_id = auth.uid() or is_workspace_member(id)
  );
create policy workspaces_insert on workspaces
  for insert with check (owner_user_id = auth.uid());
create policy workspaces_update on workspaces
  for update using (owner_user_id = auth.uid());
create policy workspaces_delete on workspaces
  for delete using (owner_user_id = auth.uid());

-- workspace_members: members can see their own + workspace owner can see all
create policy workspace_members_select on workspace_members
  for select using (
    user_id = auth.uid() or
    exists (
      select 1 from workspaces w
      where w.id = workspace_id and w.owner_user_id = auth.uid()
    )
  );
create policy workspace_members_insert on workspace_members
  for insert with check (
    exists (
      select 1 from workspaces w
      where w.id = workspace_id and w.owner_user_id = auth.uid()
    )
  );
create policy workspace_members_update on workspace_members
  for update using (
    exists (
      select 1 from workspaces w
      where w.id = workspace_id and w.owner_user_id = auth.uid()
    )
  );
create policy workspace_members_delete on workspace_members
  for delete using (
    exists (
      select 1 from workspaces w
      where w.id = workspace_id and w.owner_user_id = auth.uid()
    )
  );

-- plans: workspace-scoped read/write
create policy plans_select on plans
  for select using (
    workspace_id is null or is_workspace_member(workspace_id)
  );
create policy plans_write on plans
  for all using (
    workspace_id is not null and is_workspace_member(workspace_id)
  ) with check (
    workspace_id is not null and is_workspace_member(workspace_id)
  );

-- app_access_rules: read if plan visible; write if plan workspace member
create policy app_access_rules_select on app_access_rules
  for select using (
    exists (
      select 1 from plans p
      where p.id = plan_id
        and (p.workspace_id is null or is_workspace_member(p.workspace_id))
    )
  );
create policy app_access_rules_write on app_access_rules
  for all using (
    exists (
      select 1 from plans p
      where p.id = plan_id and p.workspace_id is not null and is_workspace_member(p.workspace_id)
    )
  ) with check (
    exists (
      select 1 from plans p
      where p.id = plan_id and p.workspace_id is not null and is_workspace_member(p.workspace_id)
    )
  );

-- app_access_overrides: workspace-scoped
create policy app_access_overrides_select on app_access_overrides
  for select using (
    workspace_id is null or is_workspace_member(workspace_id) or user_id = auth.uid()
  );
create policy app_access_overrides_write on app_access_overrides
  for all using (
    workspace_id is not null and is_workspace_member(workspace_id)
  ) with check (
    workspace_id is not null and is_workspace_member(workspace_id)
  );

-- audit_logs: read-only for workspace members, insert by anyone with workspace access
create policy audit_logs_select on audit_logs
  for select using (
    workspace_id is null or is_workspace_member(workspace_id)
  );
create policy audit_logs_insert on audit_logs
  for insert with check (
    workspace_id is null or is_workspace_member(workspace_id)
  );

-- cashflow_entries: workspace-scoped
create policy cashflow_entries_select on cashflow_entries
  for select using (is_workspace_member(workspace_id));
create policy cashflow_entries_write on cashflow_entries
  for all using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- updated_at auto-update trigger
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists workspaces_updated_at on workspaces;
create trigger workspaces_updated_at
  before update on workspaces
  for each row execute function set_updated_at();

drop trigger if exists plans_updated_at on plans;
create trigger plans_updated_at
  before update on plans
  for each row execute function set_updated_at();

drop trigger if exists cashflow_entries_updated_at on cashflow_entries;
create trigger cashflow_entries_updated_at
  before update on cashflow_entries
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- 0002_kv_store.sql
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 0003_projects.sql
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 0004_cost_codes.sql
-- ----------------------------------------------------------------------------
-- ============================================================================
-- Buildbybim.space — Migration 0004 — Cost Codes (CBS)
-- ----------------------------------------------------------------------------
-- Spec: docs/COST_CODES_PRD.md Section 12
-- Pairs with: src/costCodes.ts + src/costCodes.seed.ts (local TS module)
--
-- Cost Code = the spine of Cost Control. Every PR (Sprint 3), RFQ (Sprint 4),
-- and cashflow entry (Sprint 5) references a cost_code_id.
--
-- workspace_id IS NULL → system seed (shared across workspaces, read-only).
-- workspace_id NOT NULL → workspace custom code (full write).
-- ============================================================================

set search_path = public;

create table if not exists cost_codes (
  id text primary key,
  workspace_id uuid references workspaces(id) on delete cascade,
  code text not null,
  parent_code text not null default '',
  name text not null,
  name_en text not null default '',
  description text not null default '',
  category text not null check (category in (
    'site', 'structure', 'architecture', 'mep', 'finishing',
    'external', 'indirect', 'custom'
  )),
  default_unit text not null check (default_unit in (
    'lump_sum', 'sq_m', 'cubic_m', 'linear_m', 'piece', 'set',
    'kg', 'ton', 'day', 'month', 'custom'
  )),
  custom_unit text not null default '',
  default_unit_price numeric(14, 2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, code)
);

create index if not exists cost_codes_workspace_idx on cost_codes(workspace_id);
create index if not exists cost_codes_parent_idx on cost_codes(workspace_id, parent_code);
create index if not exists cost_codes_active_idx on cost_codes(workspace_id, active);
create index if not exists cost_codes_category_idx on cost_codes(workspace_id, category);

alter table cost_codes enable row level security;

-- Read: system seeds (workspace_id IS NULL) visible to everyone; custom codes
-- visible only to workspace members.
create policy cost_codes_select on cost_codes
  for select using (
    workspace_id is null or is_workspace_member(workspace_id)
  );

-- Write only to own workspace — system seeds are read-only via SQL/API.
create policy cost_codes_insert on cost_codes
  for insert with check (
    workspace_id is not null and is_workspace_member(workspace_id)
  );

create policy cost_codes_update on cost_codes
  for update using (
    workspace_id is not null and is_workspace_member(workspace_id)
  );

create policy cost_codes_delete on cost_codes
  for delete using (
    workspace_id is not null and is_workspace_member(workspace_id)
  );

drop trigger if exists cost_codes_updated_at on cost_codes;
create trigger cost_codes_updated_at
  before update on cost_codes
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- System seed insert. workspace_id = NULL means "shared catalog".
-- Source: src/costCodes.seed.ts (~100 Thai construction cost codes).
-- Keep in sync with the TS seed — version-controlled in the SQL file so a
-- fresh Supabase project gets the same starting catalog.
--
-- To regenerate this block from the TS seed: run a small Node script that
-- loads seedThaiCostCodes() and emits one INSERT per row. The TS module is
-- the source of truth for local-first; this SQL is the parity copy for cloud.
-- ----------------------------------------------------------------------------

-- Skeleton root inserts to demonstrate the contract. Codex/devs should
-- regenerate the full 100-row block from `src/costCodes.seed.ts` and append
-- here before applying to a Supabase project.
insert into cost_codes
  (id, workspace_id, code, parent_code, name, category, default_unit, default_unit_price, active)
values
  ('seed-01', null, '01', '', 'งานเตรียมพื้นที่', 'site', 'lump_sum', 0, true),
  ('seed-02', null, '02', '', 'งานโครงสร้าง', 'structure', 'lump_sum', 0, true),
  ('seed-03', null, '03', '', 'งานสถาปัตยกรรม', 'architecture', 'lump_sum', 0, true),
  ('seed-04', null, '04', '', 'งานระบบ MEP', 'mep', 'lump_sum', 0, true),
  ('seed-05', null, '05', '', 'งานตกแต่ง', 'finishing', 'lump_sum', 0, true),
  ('seed-06', null, '06', '', 'งานภายนอก', 'external', 'lump_sum', 0, true),
  ('seed-07', null, '07', '', 'ค่าใช้จ่ายทางอ้อม', 'indirect', 'lump_sum', 0, true)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- 0005_suppliers.sql
-- ----------------------------------------------------------------------------
-- ============================================================================
-- Buildbybim.space — Migration 0005 — Suppliers + Price History
-- ----------------------------------------------------------------------------
-- Spec: docs/SUPPLIERS_PRD.md Section 12
-- Pairs with: src/suppliers.ts (local TS module + adapter pattern)
-- Cross-link: cost_code_id references cost_codes(code) from migration 0004
--
-- Two tables in one migration:
--   1. suppliers — directory of vendors/contractors/services per workspace
--   2. supplier_price_history — every price quote/spend log, joined back
--      to a supplier and (optionally) a cost code
--
-- RLS scoped strictly to workspace membership; no system-shared suppliers.
-- ============================================================================

set search_path = public;

-- ---------------------------------------------------------------------------
-- 1. suppliers
-- ---------------------------------------------------------------------------
create table if not exists suppliers (
  id text primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  short_name text not null default '',
  type text not null default 'other' check (type in (
    'manufacturer', 'distributor', 'subcontractor', 'service', 'other'
  )),
  tax_id text not null default '',
  address text not null default '',
  city text not null default '',
  province text not null default '',
  postal_code text not null default '',
  phone text not null default '',
  email text not null default '',
  line_id text not null default '',
  payment_terms text not null default '',
  rating integer not null default 0 check (rating >= 0 and rating <= 5),
  notes text not null default '',
  tags text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists suppliers_workspace_idx on suppliers(workspace_id);
create index if not exists suppliers_active_idx on suppliers(workspace_id, active);
create index if not exists suppliers_type_idx on suppliers(workspace_id, type);
create index if not exists suppliers_tax_id_idx on suppliers(workspace_id, tax_id)
  where tax_id <> '';

alter table suppliers enable row level security;

create policy suppliers_select on suppliers
  for select using (is_workspace_member(workspace_id));
create policy suppliers_insert on suppliers
  for insert with check (is_workspace_member(workspace_id));
create policy suppliers_update on suppliers
  for update using (is_workspace_member(workspace_id));
create policy suppliers_delete on suppliers
  for delete using (is_workspace_member(workspace_id));

drop trigger if exists suppliers_updated_at on suppliers;
create trigger suppliers_updated_at
  before update on suppliers
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. supplier_price_history
-- ---------------------------------------------------------------------------
create table if not exists supplier_price_history (
  id text primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  supplier_id text not null references suppliers(id) on delete cascade,
  cost_code_id text default '', -- stores cost_codes.code (string FK by convention)
  item_description text not null default '',
  unit_price numeric(14, 2) not null,
  unit text not null default '',
  quantity numeric(14, 4) not null default 0,
  total_amount numeric(14, 2) not null default 0,
  quoted_at date not null,
  source_type text not null default 'manual' check (source_type in (
    'rfq', 'po', 'manual', 'line_intake'
  )),
  source_document_id text not null default '',
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists price_history_workspace_idx
  on supplier_price_history(workspace_id);
create index if not exists price_history_supplier_idx
  on supplier_price_history(supplier_id);
create index if not exists price_history_cost_code_idx
  on supplier_price_history(workspace_id, cost_code_id)
  where cost_code_id <> '';
create index if not exists price_history_quoted_idx
  on supplier_price_history(workspace_id, quoted_at desc);

alter table supplier_price_history enable row level security;

create policy price_history_select on supplier_price_history
  for select using (is_workspace_member(workspace_id));
create policy price_history_insert on supplier_price_history
  for insert with check (is_workspace_member(workspace_id));
create policy price_history_update on supplier_price_history
  for update using (is_workspace_member(workspace_id));
create policy price_history_delete on supplier_price_history
  for delete using (is_workspace_member(workspace_id));

-- ----------------------------------------------------------------------------
-- 0006_purchase_requests.sql
-- ----------------------------------------------------------------------------
-- ============================================================================
-- Buildbybim.space — Migration 0006 — Purchase Requests (Sprint 3)
-- ----------------------------------------------------------------------------
-- Spec: docs/PROCUREMENT_PRD.md Section 12
-- Pairs with: src/procurement.ts (local TS module + adapter pattern)
--
-- Cross-links:
--   - project_id  → projects(id) (migration 0003)
--   - cost_code_id (per line) → cost_codes.code (string FK by convention, like supplier_price_history)
--   - preferred_supplier_id → suppliers(id) (migration 0005)
--   - linked_po_document_id → BuildDocs document id (string, no FK — BuildDocs lives in workspace blob today)
--
-- RLS scoped strictly to workspace membership.
-- RFQ tables come separately in 0007 (Sprint 4).
-- ============================================================================

set search_path = public;

create table if not exists purchase_requests (
  id text primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid not null,
  pr_no text not null,
  requested_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  rejected_reason text not null default '',
  status text not null default 'draft' check (status in (
    'draft', 'submitted', 'approved', 'rejected',
    'rfq_sent', 'awarded', 'ordered', 'received', 'closed', 'cancelled'
  )),
  request_date date not null,
  needed_by_date date,
  notes text not null default '',
  total_amount numeric(14, 2) not null default 0,
  linked_rfq_id text not null default '',
  linked_po_document_id text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, pr_no)
);

create table if not exists pr_line_items (
  id text primary key,
  pr_id text not null references purchase_requests(id) on delete cascade,
  cost_code_id text not null default '',
  description text not null default '',
  quantity numeric(14, 4) not null default 0,
  unit text not null default '',
  estimated_unit_price numeric(14, 2) not null default 0,
  amount numeric(14, 2) not null default 0,
  preferred_supplier_id text not null default '',
  note text not null default ''
);

create index if not exists pr_workspace_idx on purchase_requests(workspace_id);
create index if not exists pr_project_idx on purchase_requests(workspace_id, project_id);
create index if not exists pr_status_idx on purchase_requests(workspace_id, status);
create index if not exists pr_needed_idx on purchase_requests(workspace_id, needed_by_date);
create index if not exists pr_line_items_pr_idx on pr_line_items(pr_id);
create index if not exists pr_line_items_cost_code_idx on pr_line_items(cost_code_id)
  where cost_code_id <> '';
create index if not exists pr_line_items_supplier_idx on pr_line_items(preferred_supplier_id)
  where preferred_supplier_id <> '';

alter table purchase_requests enable row level security;
alter table pr_line_items enable row level security;

create policy pr_select on purchase_requests
  for select using (is_workspace_member(workspace_id));
create policy pr_insert on purchase_requests
  for insert with check (is_workspace_member(workspace_id));
create policy pr_update on purchase_requests
  for update using (is_workspace_member(workspace_id));
create policy pr_delete on purchase_requests
  for delete using (is_workspace_member(workspace_id));

create policy pr_line_items_select on pr_line_items
  for select using (
    exists (
      select 1 from purchase_requests p
      where p.id = pr_id and is_workspace_member(p.workspace_id)
    )
  );
create policy pr_line_items_insert on pr_line_items
  for insert with check (
    exists (
      select 1 from purchase_requests p
      where p.id = pr_id and is_workspace_member(p.workspace_id)
    )
  );
create policy pr_line_items_update on pr_line_items
  for update using (
    exists (
      select 1 from purchase_requests p
      where p.id = pr_id and is_workspace_member(p.workspace_id)
    )
  );
create policy pr_line_items_delete on pr_line_items
  for delete using (
    exists (
      select 1 from purchase_requests p
      where p.id = pr_id and is_workspace_member(p.workspace_id)
    )
  );

drop trigger if exists pr_updated_at on purchase_requests;
create trigger pr_updated_at
  before update on purchase_requests
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- 0007_rfqs.sql
-- ----------------------------------------------------------------------------
-- ============================================================================
-- Buildbybim.space — Migration 0007 — RFQ (Request for Quotation) — Sprint 4
-- ----------------------------------------------------------------------------
-- Spec: docs/PROCUREMENT_PRD.md Section 12
-- Pairs with: src/procurement.ts (local TS module + adapter pattern)
--
-- Three nested tables — rfq → response → item_quote — to support the full
-- comparison-matrix workflow. RLS chains down through rfqs.workspace_id.
--
-- Cross-links (string FK by convention, like 0006_purchase_requests.sql):
--   - rfqs.pr_id            → purchase_requests.id
--   - rfqs.awarded_supplier_id → suppliers.id
--   - rfq_responses.supplier_id → suppliers.id
--   - rfq_item_quotes.pr_line_item_id → pr_line_items.id
--   - rfq_item_quotes.cost_code_id → cost_codes.code
--
-- On award, the application appends an entry to supplier_price_history
-- (handled in TS via awardRFQ + addPriceHistoryEntry — no SQL trigger).
-- ============================================================================

set search_path = public;

-- ---------------------------------------------------------------------------
-- 1. rfqs
-- ---------------------------------------------------------------------------
create table if not exists rfqs (
  id text primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid not null,
  pr_id text not null references purchase_requests(id) on delete cascade,
  rfq_no text not null,
  status text not null default 'draft' check (status in (
    'draft', 'sent', 'partial_response', 'responses_complete', 'awarded', 'cancelled'
  )),
  invited_supplier_ids text[] not null default '{}',
  awarded_supplier_id text not null default '',
  awarded_at timestamptz,
  award_reason text not null default '',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, rfq_no)
);

create index if not exists rfq_workspace_idx on rfqs(workspace_id);
create index if not exists rfq_pr_idx on rfqs(pr_id);
create index if not exists rfq_project_idx on rfqs(workspace_id, project_id);
create index if not exists rfq_status_idx on rfqs(workspace_id, status);
create index if not exists rfq_awarded_supplier_idx on rfqs(awarded_supplier_id)
  where awarded_supplier_id <> '';

alter table rfqs enable row level security;

create policy rfqs_select on rfqs
  for select using (is_workspace_member(workspace_id));
create policy rfqs_insert on rfqs
  for insert with check (is_workspace_member(workspace_id));
create policy rfqs_update on rfqs
  for update using (is_workspace_member(workspace_id));
create policy rfqs_delete on rfqs
  for delete using (is_workspace_member(workspace_id));

drop trigger if exists rfqs_updated_at on rfqs;
create trigger rfqs_updated_at
  before update on rfqs
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. rfq_responses — one row per supplier per RFQ
-- ---------------------------------------------------------------------------
create table if not exists rfq_responses (
  id text primary key,
  rfq_id text not null references rfqs(id) on delete cascade,
  supplier_id text not null,
  total_amount numeric(14, 2) not null default 0,
  payment_terms text not null default '',
  delivery_date date,
  valid_until date,
  notes text not null default '',
  received_at timestamptz not null default now(),
  received_via text not null default 'manual' check (received_via in (
    'email', 'line', 'manual', 'phone'
  )),
  unique (rfq_id, supplier_id)
);

create index if not exists rfq_responses_rfq_idx on rfq_responses(rfq_id);
create index if not exists rfq_responses_supplier_idx on rfq_responses(supplier_id);

alter table rfq_responses enable row level security;

create policy rfq_responses_select on rfq_responses
  for select using (
    exists (
      select 1 from rfqs r
      where r.id = rfq_id and is_workspace_member(r.workspace_id)
    )
  );
create policy rfq_responses_insert on rfq_responses
  for insert with check (
    exists (
      select 1 from rfqs r
      where r.id = rfq_id and is_workspace_member(r.workspace_id)
    )
  );
create policy rfq_responses_update on rfq_responses
  for update using (
    exists (
      select 1 from rfqs r
      where r.id = rfq_id and is_workspace_member(r.workspace_id)
    )
  );
create policy rfq_responses_delete on rfq_responses
  for delete using (
    exists (
      select 1 from rfqs r
      where r.id = rfq_id and is_workspace_member(r.workspace_id)
    )
  );

-- ---------------------------------------------------------------------------
-- 3. rfq_item_quotes — one row per line item per response (item × supplier)
-- ---------------------------------------------------------------------------
create table if not exists rfq_item_quotes (
  id text primary key,
  response_id text not null references rfq_responses(id) on delete cascade,
  pr_line_item_id text not null,
  cost_code_id text not null default '',
  description text not null default '',
  unit_price numeric(14, 2) not null default 0,
  amount numeric(14, 2) not null default 0,
  alternative_spec text not null default '',
  available boolean not null default true,
  note text not null default ''
);

create index if not exists rfq_item_quotes_response_idx on rfq_item_quotes(response_id);
create index if not exists rfq_item_quotes_pr_line_idx on rfq_item_quotes(pr_line_item_id);
create index if not exists rfq_item_quotes_cost_code_idx on rfq_item_quotes(cost_code_id)
  where cost_code_id <> '';

alter table rfq_item_quotes enable row level security;

create policy rfq_item_quotes_select on rfq_item_quotes
  for select using (
    exists (
      select 1 from rfq_responses res
      join rfqs r on r.id = res.rfq_id
      where res.id = response_id and is_workspace_member(r.workspace_id)
    )
  );
create policy rfq_item_quotes_insert on rfq_item_quotes
  for insert with check (
    exists (
      select 1 from rfq_responses res
      join rfqs r on r.id = res.rfq_id
      where res.id = response_id and is_workspace_member(r.workspace_id)
    )
  );
create policy rfq_item_quotes_update on rfq_item_quotes
  for update using (
    exists (
      select 1 from rfq_responses res
      join rfqs r on r.id = res.rfq_id
      where res.id = response_id and is_workspace_member(r.workspace_id)
    )
  );
create policy rfq_item_quotes_delete on rfq_item_quotes
  for delete using (
    exists (
      select 1 from rfq_responses res
      join rfqs r on r.id = res.rfq_id
      where res.id = response_id and is_workspace_member(r.workspace_id)
    )
  );

-- ----------------------------------------------------------------------------
-- 0008_cashflow_extension.sql
-- ----------------------------------------------------------------------------
-- ============================================================================
-- Buildbybim.space - Migration 0008 - Cashflow Project Extension (Sprint 5)
-- ----------------------------------------------------------------------------
-- Spec: docs/CASHFLOW_PROJECT_EXTENSION_PRD.md
-- Pairs with:
--   - src/cashflow.ts
--   - src/cashflow.rollup.ts
--
-- Extends cashflow_entries so confirmed entries can become the actual
-- project cost/revenue ledger used by Project Control.
-- ============================================================================

set search_path = public;

alter table cashflow_entries
  add column if not exists cost_code_id text not null default '',
  add column if not exists supplier_id text not null default '',
  add column if not exists pr_id text not null default '',
  add column if not exists rfq_id text not null default '',
  add column if not exists po_document_id text not null default '',
  add column if not exists quantity_actual numeric(14, 4) not null default 0,
  add column if not exists unit_actual text not null default '',
  add column if not exists recurring_template_id text not null default '',
  add column if not exists source_type text not null default 'manual',
  add column if not exists source_document_id text not null default '';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'cashflow_entries_source_type_check'
  ) then
    alter table cashflow_entries
      add constraint cashflow_entries_source_type_check
      check (source_type in (
        'manual', 'pr', 'rfq', 'po', 'invoice', 'receipt', 'recurring'
      ));
  end if;
end $$;

create index if not exists cashflow_entries_project_idx
  on cashflow_entries(workspace_id, project_id);
create index if not exists cashflow_entries_cost_code_idx
  on cashflow_entries(workspace_id, cost_code_id)
  where cost_code_id <> '';
create index if not exists cashflow_entries_supplier_idx
  on cashflow_entries(workspace_id, supplier_id)
  where supplier_id <> '';
create index if not exists cashflow_entries_status_idx
  on cashflow_entries(workspace_id, status);
create index if not exists cashflow_entries_source_idx
  on cashflow_entries(workspace_id, source_type, source_document_id)
  where source_document_id <> '';

create index if not exists cashflow_entries_recurring_idx
  on cashflow_entries(workspace_id, recurring_template_id)
  where recurring_template_id <> '';

-- ---------------------------------------------------------------------------
-- recurring_templates — manual recurring entry definitions (Sprint 5)
-- Pairs with src/cashflow.recurring.ts. Generation = user-triggered
-- "Generate this month" button; no scheduled cron yet.
-- ---------------------------------------------------------------------------
create table if not exists recurring_templates (
  id text primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  direction text not null check (direction in ('income', 'expense')),
  category text not null,
  amount numeric(14, 2) not null default 0,
  project_id uuid,
  cost_code_id text not null default '',
  supplier_id text not null default '',
  description text not null default '',
  frequency text not null check (frequency in ('monthly', 'weekly', 'quarterly', 'yearly')),
  start_date date not null,
  end_date date,
  last_generated_date date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recurring_templates_workspace_idx
  on recurring_templates(workspace_id);
create index if not exists recurring_templates_active_idx
  on recurring_templates(workspace_id, active);
create index if not exists recurring_templates_project_idx
  on recurring_templates(workspace_id, project_id)
  where project_id is not null;

alter table recurring_templates enable row level security;

create policy recurring_templates_select on recurring_templates
  for select using (is_workspace_member(workspace_id));
create policy recurring_templates_insert on recurring_templates
  for insert with check (is_workspace_member(workspace_id));
create policy recurring_templates_update on recurring_templates
  for update using (is_workspace_member(workspace_id));
create policy recurring_templates_delete on recurring_templates
  for delete using (is_workspace_member(workspace_id));

drop trigger if exists recurring_templates_updated_at on recurring_templates;
create trigger recurring_templates_updated_at
  before update on recurring_templates
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- 0009_project_control_settings.sql
-- ----------------------------------------------------------------------------
-- ============================================================================
-- Buildbybim.space — Migration 0009 — Project Control settings (Sprint 6)
-- ----------------------------------------------------------------------------
-- Spec: docs/PROJECT_CONTROL_PRD.md Section 11
-- Pairs with: src/projectControl.ts (ProjectControlSettings)
--
-- Project Control is a read-only aggregation layer over Sprint 0-5 data —
-- the only persisted entity is per-workspace settings (alert thresholds +
-- default report). One row per workspace.
--
-- RLS scoped via is_workspace_member as usual.
-- ============================================================================

set search_path = public;

create table if not exists project_control_settings (
  workspace_id uuid primary key references workspaces(id) on delete cascade,
  default_report_type text not null default 'project_pl' check (default_report_type in (
    'project_pl', 'cashflow_forecast', 'cost_variance', 'supplier_spend', 'pr_aging'
  )),
  alert_thresholds jsonb not null default jsonb_build_object(
    'nearBudgetPct', 85,
    'lowMarginPct', 10,
    'staleDaysPR', 30,
    'noActivityDays', 14
  ),
  updated_at timestamptz not null default now()
);

alter table project_control_settings enable row level security;

create policy project_control_settings_select on project_control_settings
  for select using (is_workspace_member(workspace_id));
create policy project_control_settings_insert on project_control_settings
  for insert with check (is_workspace_member(workspace_id));
create policy project_control_settings_update on project_control_settings
  for update using (is_workspace_member(workspace_id));
create policy project_control_settings_delete on project_control_settings
  for delete using (is_workspace_member(workspace_id));

drop trigger if exists project_control_settings_updated_at on project_control_settings;
create trigger project_control_settings_updated_at
  before update on project_control_settings
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- 0010_approval_requests.sql
-- ----------------------------------------------------------------------------
-- ============================================================================
-- Buildbybim.space - Migration 0010 - Approval + Audit Core (Sprint 7)
-- ----------------------------------------------------------------------------
-- Spec: docs/APPROVAL_AUDIT_PRD.md
-- Pairs with: src/approvals.ts and ApprovalCenterPanel
--
-- Approval Center is a business-control layer. It stores a generic approval
-- request that points at a source business object (PR, RFQ award, PO, cashflow,
-- invoice, or budget override) and stores immutable transition events.
--
-- Low-level audit still lives in audit_logs; approval_events is the business
-- timeline attached to each approval request.
-- ============================================================================

set search_path = public;

create table if not exists approval_requests (
  id text primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  target_type text not null check (target_type in (
    'pr', 'rfq_award', 'po', 'cashflow_entry', 'invoice', 'budget_override'
  )),
  target_id text not null,
  source_app_id text not null default '',
  project_id text not null default '',
  cost_code_id text not null default '',
  supplier_id text not null default '',
  target_label text not null default '',
  amount numeric(14, 2) not null default 0,
  currency text not null default 'THB',
  status text not null default 'draft' check (status in (
    'draft', 'submitted', 'approved', 'rejected', 'cancelled'
  )),
  priority text not null default 'normal' check (priority in ('normal', 'high', 'urgent')),
  requested_by text not null default '',
  requested_by_name text not null default '',
  approver_id text not null default '',
  approver_name text not null default '',
  reason text not null default '',
  note text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  submitted_at timestamptz,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, target_type, target_id)
);

create table if not exists approval_events (
  id text primary key,
  approval_request_id text not null references approval_requests(id) on delete cascade,
  action text not null check (action in (
    'created', 'submitted', 'approved', 'rejected', 'cancelled', 'synced'
  )),
  actor_id text not null default '',
  actor_name text not null default '',
  from_status text not null check (from_status in (
    'draft', 'submitted', 'approved', 'rejected', 'cancelled'
  )),
  to_status text not null check (to_status in (
    'draft', 'submitted', 'approved', 'rejected', 'cancelled'
  )),
  reason text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists approval_requests_workspace_idx
  on approval_requests(workspace_id);
create index if not exists approval_requests_status_idx
  on approval_requests(workspace_id, status);
create index if not exists approval_requests_target_idx
  on approval_requests(workspace_id, target_type, target_id);
create index if not exists approval_requests_project_idx
  on approval_requests(workspace_id, project_id)
  where project_id <> '';
create index if not exists approval_requests_priority_idx
  on approval_requests(workspace_id, priority)
  where status = 'submitted';
create index if not exists approval_events_request_idx
  on approval_events(approval_request_id, created_at desc);

alter table approval_requests enable row level security;
alter table approval_events enable row level security;

create policy approval_requests_select on approval_requests
  for select using (is_workspace_member(workspace_id));
create policy approval_requests_insert on approval_requests
  for insert with check (is_workspace_member(workspace_id));
create policy approval_requests_update on approval_requests
  for update using (is_workspace_member(workspace_id));
create policy approval_requests_delete on approval_requests
  for delete using (is_workspace_member(workspace_id));

create policy approval_events_select on approval_events
  for select using (
    exists (
      select 1
      from approval_requests r
      where r.id = approval_request_id and is_workspace_member(r.workspace_id)
    )
  );
create policy approval_events_insert on approval_events
  for insert with check (
    exists (
      select 1
      from approval_requests r
      where r.id = approval_request_id and is_workspace_member(r.workspace_id)
    )
  );
create policy approval_events_update on approval_events
  for update using (
    exists (
      select 1
      from approval_requests r
      where r.id = approval_request_id and is_workspace_member(r.workspace_id)
    )
  );
create policy approval_events_delete on approval_events
  for delete using (
    exists (
      select 1
      from approval_requests r
      where r.id = approval_request_id and is_workspace_member(r.workspace_id)
    )
  );

drop trigger if exists approval_requests_updated_at on approval_requests;
create trigger approval_requests_updated_at
  before update on approval_requests
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- 0011_evidence_assets.sql
-- ----------------------------------------------------------------------------
-- ============================================================================
-- Buildbybim.space - Migration 0011 - Evidence Asset Layer (Sprint 8)
-- ----------------------------------------------------------------------------
-- Spec: docs/EVIDENCE_ASSET_PRD.md
-- Pairs with:
--   - src/evidence.ts
--   - src/workspace/apps/evidence/EvidencePanel.tsx
--
-- Evidence assets are the proof layer for ERP transactions: receipts, site
-- photos, RFQ quotes, invoices, delivery notes, contracts, and inspection files.
-- The local-first app stores file previews in `evidence.assets.v1`; production
-- cloud storage should store binary files in object storage and keep only
-- metadata + storage_path here.
-- ============================================================================

set search_path = public;

create table if not exists evidence_assets (
  id text primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  asset_type text not null default 'other' check (asset_type in (
    'receipt', 'invoice', 'rfq_quote', 'delivery_note',
    'site_photo', 'defect_photo', 'contract', 'other'
  )),
  status text not null default 'draft' check (status in (
    'draft', 'verified', 'rejected', 'archived'
  )),
  title text not null default '',
  description text not null default '',
  file_name text not null default '',
  mime_type text not null default '',
  file_size bigint not null default 0,
  storage_path text not null default '',
  preview_url text not null default '',
  amount numeric(14, 2) not null default 0,
  currency text not null default 'THB',
  captured_at timestamptz,
  uploaded_at timestamptz not null default now(),
  uploaded_by text not null default '',
  verified_at timestamptz,
  verified_by text not null default '',
  rejected_reason text not null default '',
  source_app_id text not null default '',
  source_document_id text not null default '',
  tags text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists evidence_links (
  id text primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  evidence_asset_id text not null references evidence_assets(id) on delete cascade,
  target_type text not null check (target_type in (
    'project', 'cost_code', 'supplier', 'pr', 'rfq',
    'cashflow_entry', 'document', 'defect', 'approval', 'other'
  )),
  target_id text not null,
  label text not null default '',
  created_at timestamptz not null default now(),
  unique (evidence_asset_id, target_type, target_id)
);

create index if not exists evidence_assets_workspace_idx
  on evidence_assets(workspace_id);
create index if not exists evidence_assets_status_idx
  on evidence_assets(workspace_id, status);
create index if not exists evidence_assets_type_idx
  on evidence_assets(workspace_id, asset_type);
create index if not exists evidence_assets_source_idx
  on evidence_assets(workspace_id, source_app_id, source_document_id)
  where source_document_id <> '';
create index if not exists evidence_assets_uploaded_idx
  on evidence_assets(workspace_id, uploaded_at desc);
create index if not exists evidence_links_asset_idx
  on evidence_links(evidence_asset_id);
create index if not exists evidence_links_target_idx
  on evidence_links(workspace_id, target_type, target_id);

alter table evidence_assets enable row level security;
alter table evidence_links enable row level security;

create policy evidence_assets_select on evidence_assets
  for select using (is_workspace_member(workspace_id));
create policy evidence_assets_insert on evidence_assets
  for insert with check (is_workspace_member(workspace_id));
create policy evidence_assets_update on evidence_assets
  for update using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));
create policy evidence_assets_delete on evidence_assets
  for delete using (is_workspace_member(workspace_id));

create policy evidence_links_select on evidence_links
  for select using (is_workspace_member(workspace_id));
create policy evidence_links_insert on evidence_links
  for insert with check (
    is_workspace_member(workspace_id) and
    exists (
      select 1
      from evidence_assets a
      where a.id = evidence_asset_id and a.workspace_id = workspace_id
    )
  );
create policy evidence_links_update on evidence_links
  for update using (is_workspace_member(workspace_id))
  with check (
    is_workspace_member(workspace_id) and
    exists (
      select 1
      from evidence_assets a
      where a.id = evidence_asset_id and a.workspace_id = workspace_id
    )
  );
create policy evidence_links_delete on evidence_links
  for delete using (is_workspace_member(workspace_id));

drop trigger if exists evidence_assets_updated_at on evidence_assets;
create trigger evidence_assets_updated_at
  before update on evidence_assets
  for each row execute function set_updated_at();


-- ----------------------------------------------------------------------------
-- 0012_project_access_document_authority.sql
-- ----------------------------------------------------------------------------
-- ============================================================================
-- Buildbybim.space - Migration 0012 - Project access + document authority
-- ----------------------------------------------------------------------------
-- Adds the relational shape for project-scoped RBAC and document issuer/checker/
-- approver stamps. The local-first implementation lives in src/projectAccess.ts.
-- ============================================================================

set search_path = public;

-- Speed up owner/admin RLS checks used by this migration.
create index if not exists workspace_members_workspace_user_status_role_idx
  on workspace_members(workspace_id, user_id, status, role);

-- ---------------------------------------------------------------------------
-- 1. project_access_grants - per-project member role/permission grants
-- ---------------------------------------------------------------------------
create table if not exists project_access_grants (
  id text primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id text not null default '',
  member_id text not null,
  member_name text not null default '',
  role text not null default 'viewer' check (role in (
    'owner',
    'admin',
    'project_manager',
    'procurement',
    'accounting',
    'reviewer',
    'vendor',
    'viewer',
    'member',
    'support_operator'
  )),
  supplier_id text not null default '',
  extra_permissions text[] not null default '{}'::text[],
  denied_permissions text[] not null default '{}'::text[],
  active boolean not null default true,
  created_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_access_grants_workspace_idx
  on project_access_grants(workspace_id);
create index if not exists project_access_grants_project_idx
  on project_access_grants(workspace_id, project_id);
create index if not exists project_access_grants_member_idx
  on project_access_grants(workspace_id, member_id)
  where active = true;
create index if not exists project_access_grants_supplier_idx
  on project_access_grants(workspace_id, supplier_id)
  where supplier_id <> '';

-- ---------------------------------------------------------------------------
-- 2. document_authority - preparer/checker/approver/issuer stamp per document
-- ---------------------------------------------------------------------------
create table if not exists document_authority (
  id text primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  document_id text not null,
  document_no text not null default '',
  document_type text not null default '',
  project_id text not null default '',
  status text not null default 'draft' check (status in (
    'draft', 'submitted', 'checked', 'approved', 'issued', 'void'
  )),
  prepared_by_id text not null default '',
  prepared_by_name text not null default '',
  submitted_by_id text not null default '',
  submitted_by_name text not null default '',
  checked_by_id text not null default '',
  checked_by_name text not null default '',
  approved_by_id text not null default '',
  approved_by_name text not null default '',
  issued_by_id text not null default '',
  issued_by_name text not null default '',
  submitted_at timestamptz,
  checked_at timestamptz,
  approved_at timestamptz,
  issued_at timestamptz,
  approval_request_id text not null default '',
  void_reason text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, document_id)
);

create index if not exists document_authority_workspace_idx
  on document_authority(workspace_id);
create index if not exists document_authority_project_idx
  on document_authority(workspace_id, project_id);
create index if not exists document_authority_status_idx
  on document_authority(workspace_id, status);
create index if not exists document_authority_approval_idx
  on document_authority(workspace_id, approval_request_id)
  where approval_request_id <> '';

-- ---------------------------------------------------------------------------
-- 3. RLS
-- ---------------------------------------------------------------------------
alter table project_access_grants enable row level security;
alter table document_authority enable row level security;

drop policy if exists project_access_grants_select on project_access_grants;
create policy project_access_grants_select on project_access_grants
  for select using (is_workspace_member(workspace_id));

drop policy if exists project_access_grants_insert on project_access_grants;
create policy project_access_grants_insert on project_access_grants
  for insert with check (
    exists (
      select 1
      from workspace_members m
      where m.workspace_id = project_access_grants.workspace_id
        and m.user_id = (select auth.uid())
        and m.status = 'active'
        and m.role in ('owner', 'admin')
    )
  );

drop policy if exists project_access_grants_update on project_access_grants;
create policy project_access_grants_update on project_access_grants
  for update using (
    exists (
      select 1
      from workspace_members m
      where m.workspace_id = project_access_grants.workspace_id
        and m.user_id = (select auth.uid())
        and m.status = 'active'
        and m.role in ('owner', 'admin')
    )
  );

drop policy if exists project_access_grants_delete on project_access_grants;
create policy project_access_grants_delete on project_access_grants
  for delete using (
    exists (
      select 1
      from workspace_members m
      where m.workspace_id = project_access_grants.workspace_id
        and m.user_id = (select auth.uid())
        and m.status = 'active'
        and m.role in ('owner', 'admin')
    )
  );

drop policy if exists document_authority_select on document_authority;
create policy document_authority_select on document_authority
  for select using (is_workspace_member(workspace_id));

drop policy if exists document_authority_insert on document_authority;
create policy document_authority_insert on document_authority
  for insert with check (is_workspace_member(workspace_id));

drop policy if exists document_authority_update on document_authority;
create policy document_authority_update on document_authority
  for update using (is_workspace_member(workspace_id));

drop policy if exists document_authority_delete on document_authority;
create policy document_authority_delete on document_authority
  for delete using (
    exists (
      select 1
      from workspace_members m
      where m.workspace_id = document_authority.workspace_id
        and m.user_id = (select auth.uid())
        and m.status = 'active'
        and m.role in ('owner', 'admin')
    )
  );

-- ---------------------------------------------------------------------------
-- 4. updated_at triggers
-- ---------------------------------------------------------------------------
drop trigger if exists project_access_grants_updated_at on project_access_grants;
create trigger project_access_grants_updated_at
  before update on project_access_grants
  for each row execute function set_updated_at();

drop trigger if exists document_authority_updated_at on document_authority;
create trigger document_authority_updated_at
  before update on document_authority
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- 0013_evidence_storage_bucket.sql
-- ----------------------------------------------------------------------------
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
