-- ============================================================================
-- ZPOS RLS Fix: orders + order_items
-- Resolves: "new row violates row-level security policy for table 'orders'"
--
-- Three changes:
--   1. Case-insensitive role match (lower(role)) — matches existing pattern
--      from fix_bank_accounts_rls.sql so 'Owner'/'Manager'/'Staff' all pass.
--   2. Explicit WITH CHECK clause on FOR ALL policies — Postgres falls back
--      to USING for INSERT only when WITH CHECK is omitted; spelling it out
--      avoids surprises if the policy is later split.
--   3. Adds @zpos.vn to the super-admin email bypass to mirror other tables.
--
-- Idempotent. Safe to run multiple times.
-- ============================================================================

-- ---------------- orders ----------------
drop policy if exists "orders_select" on orders;
create policy "orders_select" on orders for select using (
  exists (
    select 1 from organization_members
    where organization_id = orders.organization_id
      and profile_id = auth.uid()
  )
  or auth.email() like '%@zpos.click'
  or auth.email() like '%@zpos.vn'
);

drop policy if exists "orders_modify" on orders;
create policy "orders_modify" on orders for all using (
  exists (
    select 1 from organization_members
    where organization_id = orders.organization_id
      and profile_id = auth.uid()
      and lower(role) in ('owner', 'admin', 'manager', 'staff')
  )
  or auth.email() like '%@zpos.click'
  or auth.email() like '%@zpos.vn'
) with check (
  exists (
    select 1 from organization_members
    where organization_id = orders.organization_id
      and profile_id = auth.uid()
      and lower(role) in ('owner', 'admin', 'manager', 'staff')
  )
  or auth.email() like '%@zpos.click'
  or auth.email() like '%@zpos.vn'
);

-- ---------------- order_items ----------------
drop policy if exists "order_items_select" on order_items;
create policy "order_items_select" on order_items for select using (
  exists (
    select 1 from orders o
    join organization_members om on om.organization_id = o.organization_id
    where o.id = order_items.order_id
      and om.profile_id = auth.uid()
  )
  or auth.email() like '%@zpos.click'
  or auth.email() like '%@zpos.vn'
);

drop policy if exists "order_items_modify" on order_items;
create policy "order_items_modify" on order_items for all using (
  exists (
    select 1 from orders o
    join organization_members om on om.organization_id = o.organization_id
    where o.id = order_items.order_id
      and om.profile_id = auth.uid()
      and lower(om.role) in ('owner', 'admin', 'manager', 'staff')
  )
  or auth.email() like '%@zpos.click'
  or auth.email() like '%@zpos.vn'
) with check (
  exists (
    select 1 from orders o
    join organization_members om on om.organization_id = o.organization_id
    where o.id = order_items.order_id
      and om.profile_id = auth.uid()
      and lower(om.role) in ('owner', 'admin', 'manager', 'staff')
  )
  or auth.email() like '%@zpos.click'
  or auth.email() like '%@zpos.vn'
);

-- ---------------- Seed missing membership (OPTIONAL) ----------------
-- If the diagnostic query showed role = NULL for the active org, uncomment
-- and fill in the IDs. Find them with:
--   select auth.uid();                                      -- your profile_id
--   select id, slug from organizations where slug = '<sub>';-- the org_id
--
-- insert into organization_members (organization_id, profile_id, role)
-- values ('<ORG_UUID>', '<PROFILE_UUID>', 'owner')
-- on conflict (organization_id, profile_id) do update set role = 'owner';

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';
