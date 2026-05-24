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
