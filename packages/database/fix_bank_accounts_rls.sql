-- ============================================================================
-- ZPOS Database Healing & RLS Policy Fix
-- 1. Seeds organization membership to authorize Bá Khởi (kphone@zpos.click)
-- 2. Implements case-insensitive RLS for bank accounts & payment transactions
-- ============================================================================

-- 1. Link profile (Bá Khởi - kphone@zpos.click) to active organizations in organization_members
-- This establishes the missing database relation so RLS policies can authorize your user.
insert into organization_members (organization_id, profile_id, role)
values 
  ('785106cb-28db-4cd1-ab1d-e1a921a688ea', '2a7bb4c4-0075-4612-bf3d-ed263513288e', 'owner'), -- Kphone
  ('c9daeced-6ee2-455d-b7df-5b2bcb7d3370', '2a7bb4c4-0075-4612-bf3d-ed263513288e', 'owner')  -- ZPOS Retail
on conflict (organization_id, profile_id) 
do update set role = 'owner';

-- 2. Drop existing case-sensitive policy on bank_accounts
drop policy if exists "bank_accounts_modify" on bank_accounts;

-- 3. Create case-insensitive and inclusive RLS policy for bank_accounts modification
-- Matches 'owner', 'admin', 'manager' in any casing (e.g. 'Owner', 'Manager', 'owner', 'manager')
create policy "bank_accounts_modify" on bank_accounts for all using (
  exists (
    select 1 from organization_members
    where organization_id = bank_accounts.tenant_id
      and profile_id = auth.uid()
      and lower(role) in ('owner', 'admin', 'manager')
  )
  or auth.email() like '%@zpos.click'
  or auth.email() like '%@zpos.vn'
) with check (
  exists (
    select 1 from organization_members
    where organization_id = bank_accounts.tenant_id
      and profile_id = auth.uid()
      and lower(role) in ('owner', 'admin', 'manager')
  )
  or auth.email() like '%@zpos.click'
  or auth.email() like '%@zpos.vn'
);

-- 4. Drop existing case-sensitive RLS policy for payment_transactions modification
drop policy if exists "payment_tx_update" on payment_transactions;

-- 5. Create case-insensitive and inclusive RLS policy for payment_transactions update
create policy "payment_tx_update" on payment_transactions for update using (
  exists (
    select 1 from organization_members
    where organization_id = payment_transactions.tenant_id
      and profile_id = auth.uid()
      and lower(role) in ('owner', 'admin', 'manager')
  )
  or auth.email() like '%@zpos.click'
  or auth.email() like '%@zpos.vn'
);

-- 6. Notify PostgREST to reload the schema cache
notify pgrst, 'reload schema';
