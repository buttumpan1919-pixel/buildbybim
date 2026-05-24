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
