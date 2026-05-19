-- ============================================================================
-- ZPOS RLS Policy Fix
-- Several base tables had RLS enabled in schema.sql but no policies defined,
-- which silently breaks reads (returns 400/empty depending on PostgREST
-- version) and makes the UI fall back to phantom localStorage data → leads
-- to "orders_customer_id_fkey" FK violations when the user picks a customer
-- that exists only in localStorage.
--
-- This migration adds canonical tenant-scoped policies for:
--   organizations, branches, organization_members, profiles
--   categories, products, product_variants, inventory
--   customers, orders, order_items
-- Idempotent — safe to run multiple times.
-- ============================================================================

-- Helper macro: every policy keys off organization_members(profile_id = auth.uid())
-- plus a global escape hatch for super admins on @zpos.click / @zpos.vn emails.

-- ---------------- organizations ----------------
drop policy if exists "orgs_select" on organizations;
create policy "orgs_select" on organizations for select using (
  exists (select 1 from organization_members
    where organization_id = organizations.id and profile_id = auth.uid())
  or auth.email() like '%@zpos.click'
  or auth.email() like '%@zpos.vn'
);
drop policy if exists "orgs_insert" on organizations;
create policy "orgs_insert" on organizations for insert with check (true);
drop policy if exists "orgs_update" on organizations;
create policy "orgs_update" on organizations for update using (
  exists (select 1 from organization_members
    where organization_id = organizations.id
      and profile_id = auth.uid()
      and role in ('owner', 'admin'))
  or auth.email() like '%@zpos.click'
);

-- ---------------- branches ----------------
drop policy if exists "branches_select" on branches;
create policy "branches_select" on branches for select using (
  exists (select 1 from organization_members
    where organization_id = branches.organization_id and profile_id = auth.uid())
  or auth.email() like '%@zpos.click'
);
drop policy if exists "branches_modify" on branches;
create policy "branches_modify" on branches for all using (
  exists (select 1 from organization_members
    where organization_id = branches.organization_id
      and profile_id = auth.uid()
      and role in ('owner', 'admin', 'manager'))
  or auth.email() like '%@zpos.click'
);

-- ---------------- profiles ----------------
drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own" on profiles for select using (
  auth.uid() = id
  or auth.email() like '%@zpos.click'
);
drop policy if exists "profiles_upsert_own" on profiles;
create policy "profiles_upsert_own" on profiles for all using (
  auth.uid() = id
  or auth.email() like '%@zpos.click'
);

-- ---------------- organization_members ----------------
drop policy if exists "members_select" on organization_members;
create policy "members_select" on organization_members for select using (
  profile_id = auth.uid()
  or exists (select 1 from organization_members om2
    where om2.organization_id = organization_members.organization_id
      and om2.profile_id = auth.uid()
      and om2.role in ('owner', 'admin'))
  or auth.email() like '%@zpos.click'
);
drop policy if exists "members_modify" on organization_members;
create policy "members_modify" on organization_members for all using (
  exists (select 1 from organization_members om2
    where om2.organization_id = organization_members.organization_id
      and om2.profile_id = auth.uid()
      and om2.role in ('owner', 'admin'))
  or auth.email() like '%@zpos.click'
);

-- ---------------- categories ----------------
drop policy if exists "categories_select" on categories;
create policy "categories_select" on categories for select using (
  exists (select 1 from organization_members
    where organization_id = categories.organization_id and profile_id = auth.uid())
  or auth.email() like '%@zpos.click'
);
drop policy if exists "categories_modify" on categories;
create policy "categories_modify" on categories for all using (
  exists (select 1 from organization_members
    where organization_id = categories.organization_id
      and profile_id = auth.uid()
      and role in ('owner', 'admin', 'manager'))
  or auth.email() like '%@zpos.click'
);

-- ---------------- products ----------------
drop policy if exists "products_select" on products;
create policy "products_select" on products for select using (
  exists (select 1 from organization_members
    where organization_id = products.organization_id and profile_id = auth.uid())
  or auth.email() like '%@zpos.click'
);
drop policy if exists "products_modify" on products;
create policy "products_modify" on products for all using (
  exists (select 1 from organization_members
    where organization_id = products.organization_id
      and profile_id = auth.uid()
      and role in ('owner', 'admin', 'manager'))
  or auth.email() like '%@zpos.click'
);

-- ---------------- product_variants ----------------
drop policy if exists "variants_select" on product_variants;
create policy "variants_select" on product_variants for select using (
  exists (
    select 1 from products p
    join organization_members om on om.organization_id = p.organization_id
   where p.id = product_variants.product_id and om.profile_id = auth.uid()
  )
  or auth.email() like '%@zpos.click'
);
drop policy if exists "variants_modify" on product_variants;
create policy "variants_modify" on product_variants for all using (
  exists (
    select 1 from products p
    join organization_members om on om.organization_id = p.organization_id
   where p.id = product_variants.product_id
     and om.profile_id = auth.uid()
     and om.role in ('owner', 'admin', 'manager')
  )
  or auth.email() like '%@zpos.click'
);

-- ---------------- inventory ----------------
drop policy if exists "inventory_select" on inventory;
create policy "inventory_select" on inventory for select using (
  exists (select 1 from organization_members
    where organization_id = inventory.organization_id and profile_id = auth.uid())
  or auth.email() like '%@zpos.click'
);
drop policy if exists "inventory_modify" on inventory;
create policy "inventory_modify" on inventory for all using (
  exists (select 1 from organization_members
    where organization_id = inventory.organization_id
      and profile_id = auth.uid()
      and role in ('owner', 'admin', 'manager', 'staff'))
  or auth.email() like '%@zpos.click'
);

-- ---------------- customers (the table that triggered this fix) ----------------
drop policy if exists "customers_select" on customers;
create policy "customers_select" on customers for select using (
  exists (select 1 from organization_members
    where organization_id = customers.organization_id and profile_id = auth.uid())
  or auth.email() like '%@zpos.click'
);
drop policy if exists "customers_modify" on customers;
create policy "customers_modify" on customers for all using (
  exists (select 1 from organization_members
    where organization_id = customers.organization_id
      and profile_id = auth.uid()
      and role in ('owner', 'admin', 'manager', 'staff'))
  or auth.email() like '%@zpos.click'
);

-- ---------------- orders ----------------
drop policy if exists "orders_select" on orders;
create policy "orders_select" on orders for select using (
  exists (select 1 from organization_members
    where organization_id = orders.organization_id and profile_id = auth.uid())
  or auth.email() like '%@zpos.click'
);
drop policy if exists "orders_modify" on orders;
create policy "orders_modify" on orders for all using (
  exists (select 1 from organization_members
    where organization_id = orders.organization_id
      and profile_id = auth.uid()
      and role in ('owner', 'admin', 'manager', 'staff'))
  or auth.email() like '%@zpos.click'
);

-- ---------------- order_items ----------------
drop policy if exists "order_items_select" on order_items;
create policy "order_items_select" on order_items for select using (
  exists (
    select 1 from orders o
    join organization_members om on om.organization_id = o.organization_id
   where o.id = order_items.order_id and om.profile_id = auth.uid()
  )
  or auth.email() like '%@zpos.click'
);
drop policy if exists "order_items_modify" on order_items;
create policy "order_items_modify" on order_items for all using (
  exists (
    select 1 from orders o
    join organization_members om on om.organization_id = o.organization_id
   where o.id = order_items.order_id
     and om.profile_id = auth.uid()
     and om.role in ('owner', 'admin', 'manager', 'staff')
  )
  or auth.email() like '%@zpos.click'
);

-- ---------------- realtime ----------------
-- Make sure orders + customers + order_items are published for the POS to
-- receive live updates (idempotent — ignore duplicate_object).
do $$
begin
  begin alter publication supabase_realtime add table orders; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table customers; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table products; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table order_items; exception when duplicate_object then null; end;
end $$;
