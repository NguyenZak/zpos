-- ============================================================================
-- Update RLS for Shifts, Transactions, and Assignments 
-- so that Staff can only see their own records.
-- ============================================================================

-- 1. SHIFTS
drop policy if exists "shifts_select" on shifts;
create policy "shifts_select" on shifts for select using (
  -- Owner, Admin, Manager can see all shifts in their org
  exists (select 1 from organization_members
    where organization_id = shifts.organization_id
      and profile_id = auth.uid()
      and role in ('owner', 'admin', 'manager'))
  -- Staff can only see their own shifts
  or cashier_id = auth.uid()
  or auth.email() like '%@zpos.click'
);

-- 2. SHIFT TRANSACTIONS
drop policy if exists "shift_transactions_select" on shift_transactions;
create policy "shift_transactions_select" on shift_transactions for select using (
  exists (select 1 from organization_members
    where organization_id = shift_transactions.organization_id
      and profile_id = auth.uid()
      and role in ('owner', 'admin', 'manager'))
  or exists (select 1 from shifts s where s.id = shift_transactions.shift_id and s.cashier_id = auth.uid())
  or auth.email() like '%@zpos.click'
);

-- 3. CASH COUNTS
drop policy if exists "cash_counts_all" on cash_counts;
create policy "cash_counts_all" on cash_counts for all using (
  exists (select 1 from organization_members
    where organization_id = cash_counts.organization_id
      and profile_id = auth.uid()
      and role in ('owner', 'admin', 'manager'))
  or exists (select 1 from shifts s where s.id = cash_counts.shift_id and s.cashier_id = auth.uid())
  or auth.email() like '%@zpos.click'
);

-- 4. SHIFT ASSIGNMENTS (Lịch làm việc)
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='shift_assignments') then
    execute 'drop policy if exists "shift_assignments_select" on shift_assignments';
    execute 'create policy "shift_assignments_select" on shift_assignments for select using (
      exists (select 1 from organization_members
        where organization_id = shift_assignments.organization_id
          and profile_id = auth.uid()
          and role in (''owner'', ''admin'', ''manager''))
      or profile_id = auth.uid()
      or auth.email() like ''%@zpos.click''
    )';
  end if;
end $$;

-- Note: Ensure profile_id in shift_assignments is properly synced with employee_id, 
-- otherwise staff may not see their assigned shifts if profile_id is null.
