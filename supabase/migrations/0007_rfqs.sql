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
