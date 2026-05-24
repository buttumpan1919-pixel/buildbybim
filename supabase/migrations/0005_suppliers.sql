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
