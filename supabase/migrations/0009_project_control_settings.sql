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
