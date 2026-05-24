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

