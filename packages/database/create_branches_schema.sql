-- ============================================================================
-- ZPOS Branches Schema Migration & Seeding
-- Fixes 404 Not Found error by creating the missing "branches" table
-- and setting up row-level security (RLS) policies and seed data.
-- ============================================================================

-- 1. Create the branches table if it does not exist
create table if not exists branches (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade not null,
  name text not null,
  address text,
  phone text,
  is_main_branch boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. Create index for high performance querying
create index if not exists idx_branches_organization on branches(organization_id);

-- 3. Enable Row-Level Security (RLS)
alter table branches enable row level security;

-- 4. Create Select Policy (allow members of the organization to read)
drop policy if exists "branches_select" on branches;
create policy "branches_select" on branches for select using (
  exists (
    select 1 from organization_members
    where organization_id = branches.organization_id
      and profile_id = auth.uid()
  )
  or auth.email() like '%@zpos.click'
  or auth.email() like '%@zpos.vn'
);

-- 5. Create Modify Policy (allow owner/admin/manager to create/update/delete branches)
drop policy if exists "branches_modify" on branches;
create policy "branches_modify" on branches for all using (
  exists (
    select 1 from organization_members
    where organization_id = branches.organization_id
      and profile_id = auth.uid()
      and lower(role) in ('owner', 'admin', 'manager')
  )
  or auth.email() like '%@zpos.click'
  or auth.email() like '%@zpos.vn'
) with check (
  exists (
    select 1 from organization_members
    where organization_id = branches.organization_id
      and profile_id = auth.uid()
      and lower(role) in ('owner', 'admin', 'manager')
  )
  or auth.email() like '%@zpos.click'
  or auth.email() like '%@zpos.vn'
);

-- 6. Seed default branches for active organizations so the app has working data
insert into branches (id, organization_id, name, address, phone, is_main_branch)
values 
  ('b1000000-0000-0000-0000-000000000001', '785106cb-28db-4cd1-ab1d-e1a921a688ea', 'Chi nhánh chính Kphone', 'Hồ Chí Minh, Việt Nam', '0900000000', true),
  ('b1000000-0000-0000-0000-000000000002', 'c9daeced-6ee2-455d-b7df-5b2bcb7d3370', 'Chi nhánh chính ZPOS', 'Hà Nội, Việt Nam', '0911111111', true)
on conflict (id) do nothing;

-- 7. Notify PostgREST to refresh its schema cache
notify pgrst, 'reload schema';
