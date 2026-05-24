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
