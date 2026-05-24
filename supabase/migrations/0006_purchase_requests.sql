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
