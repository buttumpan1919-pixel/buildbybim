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
