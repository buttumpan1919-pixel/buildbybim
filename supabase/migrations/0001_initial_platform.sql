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
