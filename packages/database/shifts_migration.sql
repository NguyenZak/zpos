-- ============================================================================
-- ZPOS Cashier Shift Management Migration
-- Quản lý ca thu ngân: mở/đóng ca, đối soát tiền mặt, gắn ca vào mọi đơn hàng
-- Idempotent — an toàn khi chạy nhiều lần trong Supabase SQL Editor.
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- Helper: set_updated_at trigger function (idempotent)
-- ----------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

-- ============================================================================
-- 1. Cash registers (máy thu ngân — 1 chi nhánh có thể có nhiều)
-- ============================================================================
create table if not exists cash_registers (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade not null,
  branch_id uuid references branches(id) on delete cascade not null,
  name text not null,
  code text,
  status text default 'active' check (status in ('active', 'inactive', 'maintenance')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_cash_registers_org on cash_registers(organization_id);
create index if not exists idx_cash_registers_branch on cash_registers(branch_id);
create index if not exists idx_cash_registers_status on cash_registers(status);

-- ============================================================================
-- 2. Shifts (ca làm việc)
-- ============================================================================
create table if not exists shifts (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade not null,
  branch_id uuid references branches(id) on delete cascade not null,
  cash_register_id uuid references cash_registers(id) on delete set null,
  cashier_id uuid references profiles(id) on delete set null not null,
  status text not null default 'open' check (status in ('open', 'closed', 'reviewed', 'cancelled')),

  opened_at timestamp with time zone default now(),
  closed_at timestamp with time zone,

  opening_cash_amount numeric(14,2) default 0,
  expected_cash_amount numeric(14,2) default 0,
  counted_cash_amount numeric(14,2) default 0,
  cash_difference numeric(14,2) default 0,

  -- Aggregated sales breakdown (filled on close)
  total_sales_amount numeric(14,2) default 0,
  cash_sales_amount numeric(14,2) default 0,
  bank_transfer_amount numeric(14,2) default 0,
  vietqr_amount numeric(14,2) default 0,
  card_amount numeric(14,2) default 0,
  momo_amount numeric(14,2) default 0,
  zalopay_amount numeric(14,2) default 0,
  debt_amount numeric(14,2) default 0,
  refund_amount numeric(14,2) default 0,
  expense_amount numeric(14,2) default 0,

  total_orders int default 0,
  cancelled_orders int default 0,

  note text,
  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamp with time zone,

  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_shifts_org on shifts(organization_id);
create index if not exists idx_shifts_branch on shifts(branch_id);
create index if not exists idx_shifts_register on shifts(cash_register_id);
create index if not exists idx_shifts_cashier on shifts(cashier_id);
create index if not exists idx_shifts_status on shifts(status);
create index if not exists idx_shifts_opened_at on shifts(opened_at desc);

-- Only one active (open) shift per (cashier, register)
create unique index if not exists idx_shifts_one_active_per_register
  on shifts(cash_register_id, cashier_id)
  where status = 'open' and cash_register_id is not null;

create unique index if not exists idx_shifts_one_active_per_cashier
  on shifts(cashier_id)
  where status = 'open' and cash_register_id is null;

-- ============================================================================
-- 3. Shift transactions (sổ chi tiết mọi dòng tiền trong ca)
-- ============================================================================
create table if not exists shift_transactions (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade not null,
  shift_id uuid references shifts(id) on delete cascade not null,
  branch_id uuid references branches(id) on delete set null,

  type text not null check (type in (
    'opening_cash',  -- Tiền mặt đầu ca
    'sale',          -- Doanh thu bán hàng
    'refund',        -- Hoàn tiền
    'cash_in',       -- Nhập quỹ thủ công
    'cash_out',      -- Rút quỹ thủ công
    'expense',       -- Chi phí tại quầy
    'closing_cash',  -- Tiền mặt cuối ca (counted)
    'adjustment'     -- Điều chỉnh khác
  )),

  amount numeric(14,2) not null default 0,
  payment_method text check (payment_method in (
    'cash', 'bank_transfer', 'vietqr', 'card', 'momo', 'zalopay', 'debt', 'other'
  )),

  reference_type text,
  reference_id uuid,
  note text,

  created_by uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default now()
);

create index if not exists idx_shift_tx_org on shift_transactions(organization_id);
create index if not exists idx_shift_tx_shift on shift_transactions(shift_id);
create index if not exists idx_shift_tx_type on shift_transactions(type);
create index if not exists idx_shift_tx_method on shift_transactions(payment_method);
create index if not exists idx_shift_tx_created_at on shift_transactions(created_at desc);

-- ============================================================================
-- 4. Cash counts (đếm tiền chi tiết theo mệnh giá khi mở/đóng ca)
-- ============================================================================
create table if not exists cash_counts (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade not null,
  shift_id uuid references shifts(id) on delete cascade not null,
  count_type text default 'closing' check (count_type in ('opening', 'closing')),
  denomination numeric(12,2) not null, -- 500000, 200000, 100000, 50000, ...
  quantity int not null default 0,
  total_amount numeric(14,2) generated always as (denomination * quantity) stored,
  created_at timestamp with time zone default now()
);

create index if not exists idx_cash_counts_shift on cash_counts(shift_id);
create index if not exists idx_cash_counts_type on cash_counts(count_type);

-- ============================================================================
-- 4b. Shift assignments / staff roster (phân ca dự kiến cho nhân viên)
-- ============================================================================
create table if not exists shift_assignments (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade not null,
  employee_id uuid references employees(id) on delete cascade not null,
  profile_id uuid references profiles(id) on delete set null,
  branch_id uuid references branches(id) on delete set null,
  title text not null default 'Ca làm việc',
  work_date date not null,
  start_time time not null,
  end_time time not null,
  break_minutes integer default 0,
  status text not null default 'scheduled' check (status in ('scheduled', 'confirmed', 'cancelled', 'completed')),
  note text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_shift_assignments_org on shift_assignments(organization_id);
create index if not exists idx_shift_assignments_employee on shift_assignments(employee_id);
create index if not exists idx_shift_assignments_branch on shift_assignments(branch_id);
create index if not exists idx_shift_assignments_work_date on shift_assignments(work_date);

-- ============================================================================
-- 5. Extend orders to link to a shift
-- ============================================================================
alter table orders add column if not exists shift_id uuid references shifts(id) on delete set null;
alter table orders add column if not exists cash_register_id uuid references cash_registers(id) on delete set null;
create index if not exists idx_orders_shift on orders(shift_id);
create index if not exists idx_orders_cash_register on orders(cash_register_id);

-- Also tag debt payments & vietqr payment_transactions if those tables exist
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='debt_payments') then
    execute 'alter table debt_payments add column if not exists shift_id uuid references shifts(id) on delete set null';
    execute 'create index if not exists idx_debt_payments_shift on debt_payments(shift_id)';
  end if;
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='payment_transactions') then
    execute 'alter table payment_transactions add column if not exists shift_id uuid references shifts(id) on delete set null';
    execute 'create index if not exists idx_payment_transactions_shift on payment_transactions(shift_id)';
  end if;
end $$;

-- ============================================================================
-- 6. Triggers — auto-update updated_at
-- ============================================================================
drop trigger if exists trg_cash_registers_updated on cash_registers;
create trigger trg_cash_registers_updated before update on cash_registers
  for each row execute function set_updated_at();

drop trigger if exists trg_shifts_updated on shifts;
create trigger trg_shifts_updated before update on shifts
  for each row execute function set_updated_at();

-- ============================================================================
-- 7. Row Level Security
-- ============================================================================
alter table cash_registers enable row level security;
alter table shifts enable row level security;
alter table shift_transactions enable row level security;
alter table cash_counts enable row level security;
alter table shift_assignments enable row level security;

-- cash_registers: members can read, manager+ can manage
drop policy if exists "cash_registers_select" on cash_registers;
create policy "cash_registers_select" on cash_registers for select using (
  exists (select 1 from organization_members
    where organization_id = cash_registers.organization_id and profile_id = auth.uid())
  or auth.email() like '%@zpos.click'
);

drop policy if exists "cash_registers_modify" on cash_registers;
create policy "cash_registers_modify" on cash_registers for all using (
  exists (select 1 from organization_members
    where organization_id = cash_registers.organization_id
      and profile_id = auth.uid()
      and role in ('owner', 'admin', 'manager'))
);

-- shifts: members can see their org's shifts; cashier can open; manager+ can review
drop policy if exists "shifts_select" on shifts;
create policy "shifts_select" on shifts for select using (
  exists (select 1 from organization_members
    where organization_id = shifts.organization_id and profile_id = auth.uid())
  or auth.email() like '%@zpos.click'
);

drop policy if exists "shifts_modify" on shifts;
create policy "shifts_modify" on shifts for all using (
  exists (select 1 from organization_members
    where organization_id = shifts.organization_id
      and profile_id = auth.uid()
      and role in ('owner', 'admin', 'manager', 'staff'))
);

drop policy if exists "shift_transactions_select" on shift_transactions;
create policy "shift_transactions_select" on shift_transactions for select using (
  exists (select 1 from organization_members
    where organization_id = shift_transactions.organization_id and profile_id = auth.uid())
  or auth.email() like '%@zpos.click'
);

drop policy if exists "shift_transactions_insert" on shift_transactions;
create policy "shift_transactions_insert" on shift_transactions for insert with check (
  exists (select 1 from organization_members
    where organization_id = shift_transactions.organization_id
      and profile_id = auth.uid()
      and role in ('owner', 'admin', 'manager', 'staff'))
);

drop policy if exists "cash_counts_all" on cash_counts;
create policy "cash_counts_all" on cash_counts for all using (
  exists (select 1 from organization_members
    where organization_id = cash_counts.organization_id
      and profile_id = auth.uid()
      and role in ('owner', 'admin', 'manager', 'staff'))
);

drop policy if exists "shift_assignments_select" on shift_assignments;
create policy "shift_assignments_select" on shift_assignments for select using (
  exists (select 1 from organization_members
    where organization_id = shift_assignments.organization_id and profile_id = auth.uid())
  or auth.email() like '%@zpos.click'
);

drop policy if exists "shift_assignments_modify" on shift_assignments;
create policy "shift_assignments_modify" on shift_assignments for all using (
  exists (select 1 from organization_members
    where organization_id = shift_assignments.organization_id
      and profile_id = auth.uid()
      and role in ('owner', 'admin', 'manager'))
) with check (
  exists (select 1 from organization_members
    where organization_id = shift_assignments.organization_id
      and profile_id = auth.uid()
      and role in ('owner', 'admin', 'manager'))
);

-- ============================================================================
-- 8. RPC: open_shift — open a new shift (enforces "1 active per cashier/register")
-- ============================================================================
create or replace function open_shift(
  p_branch_id uuid,
  p_cash_register_id uuid,
  p_opening_cash numeric default 0,
  p_note text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_user_id uuid := auth.uid();
  v_existing record;
  v_shift_id uuid;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'unauthenticated');
  end if;

  -- Resolve org via branch
  select organization_id into v_org_id from branches where id = p_branch_id;
  if v_org_id is null then
    return jsonb_build_object('ok', false, 'error', 'branch_not_found');
  end if;

  -- Check membership
  if not exists (select 1 from organization_members
                  where organization_id = v_org_id and profile_id = v_user_id) then
    return jsonb_build_object('ok', false, 'error', 'not_a_member');
  end if;

  -- Check no existing open shift for this cashier (and register if given)
  if p_cash_register_id is not null then
    select * into v_existing from shifts
     where cashier_id = v_user_id and cash_register_id = p_cash_register_id and status = 'open'
     limit 1;
  else
    select * into v_existing from shifts
     where cashier_id = v_user_id and status = 'open' and cash_register_id is null
     limit 1;
  end if;

  if v_existing.id is not null then
    return jsonb_build_object('ok', false, 'error', 'shift_already_open', 'shift_id', v_existing.id);
  end if;

  insert into shifts(
    organization_id, branch_id, cash_register_id, cashier_id, status,
    opening_cash_amount, note, opened_at
  ) values (
    v_org_id, p_branch_id, p_cash_register_id, v_user_id, 'open',
    coalesce(p_opening_cash, 0), p_note, now()
  ) returning id into v_shift_id;

  -- Ledger entry for opening cash
  insert into shift_transactions(
    organization_id, shift_id, branch_id, type, amount,
    payment_method, note, created_by
  ) values (
    v_org_id, v_shift_id, p_branch_id, 'opening_cash', coalesce(p_opening_cash, 0),
    'cash', 'Tiền mặt đầu ca', v_user_id
  );

  return jsonb_build_object('ok', true, 'shift_id', v_shift_id);
end $$;

grant execute on function open_shift(uuid, uuid, numeric, text) to authenticated;

-- ============================================================================
-- 9. RPC: aggregate_shift — recompute sales breakdown for a shift
-- ============================================================================
create or replace function aggregate_shift(p_shift_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shift record;
  v_cash numeric := 0;
  v_transfer numeric := 0;
  v_vietqr numeric := 0;
  v_card numeric := 0;
  v_momo numeric := 0;
  v_zalopay numeric := 0;
  v_debt numeric := 0;
  v_refund numeric := 0;
  v_expense numeric := 0;
  v_total numeric := 0;
  v_orders int := 0;
  v_cancelled int := 0;
  v_expected_cash numeric := 0;
begin
  select * into v_shift from shifts where id = p_shift_id;
  if v_shift.id is null then
    return jsonb_build_object('ok', false, 'error', 'shift_not_found');
  end if;

  -- Orders aggregation
  select
    coalesce(sum(total_amount) filter (where status not in ('cancelled', 'refund')), 0),
    coalesce(count(*) filter (where status not in ('cancelled', 'refund')), 0),
    coalesce(count(*) filter (where status = 'cancelled'), 0),
    coalesce(sum(total_amount) filter (where payment_method = 'cash' and status not in ('cancelled', 'refund')), 0),
    coalesce(sum(total_amount) filter (where payment_method in ('transfer', 'bank_transfer') and status not in ('cancelled', 'refund')), 0),
    coalesce(sum(total_amount) filter (where payment_method = 'vietqr' and status not in ('cancelled', 'refund')), 0),
    coalesce(sum(total_amount) filter (where payment_method = 'card' and status not in ('cancelled', 'refund')), 0),
    coalesce(sum(total_amount) filter (where payment_method = 'momo' and status not in ('cancelled', 'refund')), 0),
    coalesce(sum(total_amount) filter (where payment_method = 'zalopay' and status not in ('cancelled', 'refund')), 0),
    coalesce(sum(total_amount) filter (where payment_method = 'debt' and status not in ('cancelled', 'refund')), 0),
    coalesce(sum(total_amount) filter (where status = 'refund'), 0)
  into v_total, v_orders, v_cancelled,
       v_cash, v_transfer, v_vietqr, v_card, v_momo, v_zalopay, v_debt, v_refund
  from orders
  where shift_id = p_shift_id;

  -- Shift-level transactions: cash_in/cash_out/expense
  select
    coalesce(sum(amount) filter (where type = 'expense'), 0)
  into v_expense
  from shift_transactions
  where shift_id = p_shift_id;

  v_expected_cash := coalesce(v_shift.opening_cash_amount, 0) + v_cash - v_expense - v_refund;

  update shifts set
    total_sales_amount = v_total,
    cash_sales_amount = v_cash,
    bank_transfer_amount = v_transfer,
    vietqr_amount = v_vietqr,
    card_amount = v_card,
    momo_amount = v_momo,
    zalopay_amount = v_zalopay,
    debt_amount = v_debt,
    refund_amount = v_refund,
    expense_amount = v_expense,
    total_orders = v_orders,
    cancelled_orders = v_cancelled,
    expected_cash_amount = v_expected_cash
  where id = p_shift_id;

  return jsonb_build_object(
    'ok', true,
    'expected_cash', v_expected_cash,
    'total_sales', v_total,
    'total_orders', v_orders
  );
end $$;

grant execute on function aggregate_shift(uuid) to authenticated;

-- ============================================================================
-- 10. RPC: close_shift — atomic close + cash reconciliation
-- ============================================================================
create or replace function close_shift(
  p_shift_id uuid,
  p_counted_cash numeric default 0,
  p_note text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shift record;
  v_user_id uuid := auth.uid();
  v_difference numeric;
  v_agg jsonb;
begin
  select * into v_shift from shifts where id = p_shift_id;
  if v_shift.id is null then
    return jsonb_build_object('ok', false, 'error', 'shift_not_found');
  end if;
  if v_shift.status <> 'open' then
    return jsonb_build_object('ok', false, 'error', 'shift_not_open');
  end if;
  if v_shift.cashier_id <> v_user_id
     and not exists (select 1 from organization_members
                      where organization_id = v_shift.organization_id
                        and profile_id = v_user_id
                        and role in ('owner', 'admin', 'manager')) then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  -- Refresh aggregates
  v_agg := aggregate_shift(p_shift_id);

  -- Refresh shift row
  select * into v_shift from shifts where id = p_shift_id;
  v_difference := coalesce(p_counted_cash, 0) - coalesce(v_shift.expected_cash_amount, 0);

  update shifts set
    status = 'closed',
    closed_at = now(),
    counted_cash_amount = coalesce(p_counted_cash, 0),
    cash_difference = v_difference,
    note = coalesce(p_note, note)
  where id = p_shift_id;

  insert into shift_transactions(
    organization_id, shift_id, branch_id, type, amount,
    payment_method, note, created_by
  ) values (
    v_shift.organization_id, p_shift_id, v_shift.branch_id,
    'closing_cash', coalesce(p_counted_cash, 0),
    'cash',
    case when v_difference = 0 then 'Đóng ca khớp tiền'
         when v_difference > 0 then 'Đóng ca dư tiền'
         else 'Đóng ca thiếu tiền' end,
    v_user_id
  );

  return jsonb_build_object(
    'ok', true,
    'shift_id', p_shift_id,
    'expected_cash', v_shift.expected_cash_amount,
    'counted_cash', coalesce(p_counted_cash, 0),
    'difference', v_difference
  );
end $$;

grant execute on function close_shift(uuid, numeric, text) to authenticated;

-- ============================================================================
-- 11. RPC: review_shift — manager approval
-- ============================================================================
create or replace function review_shift(p_shift_id uuid, p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shift record;
  v_user_id uuid := auth.uid();
begin
  select * into v_shift from shifts where id = p_shift_id;
  if v_shift.id is null then
    return jsonb_build_object('ok', false, 'error', 'shift_not_found');
  end if;
  if v_shift.status <> 'closed' then
    return jsonb_build_object('ok', false, 'error', 'shift_not_closed');
  end if;
  if not exists (select 1 from organization_members
                  where organization_id = v_shift.organization_id
                    and profile_id = v_user_id
                    and role in ('owner', 'admin', 'manager')) then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  update shifts set
    status = 'reviewed',
    reviewed_by = v_user_id,
    reviewed_at = now(),
    note = coalesce(p_note, note)
  where id = p_shift_id;

  return jsonb_build_object('ok', true, 'shift_id', p_shift_id);
end $$;

grant execute on function review_shift(uuid, text) to authenticated;

-- ============================================================================
-- 12. RPC: get_active_shift — returns the currently open shift for the caller
-- ============================================================================
create or replace function get_active_shift(
  p_organization_id uuid,
  p_cash_register_id uuid default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_shift record;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'unauthenticated');
  end if;

  if p_cash_register_id is not null then
    select * into v_shift from shifts
     where organization_id = p_organization_id
       and cashier_id = v_user_id
       and cash_register_id = p_cash_register_id
       and status = 'open'
     order by opened_at desc limit 1;
  else
    select * into v_shift from shifts
     where organization_id = p_organization_id
       and cashier_id = v_user_id
       and status = 'open'
     order by opened_at desc limit 1;
  end if;

  if v_shift.id is null then
    return jsonb_build_object('ok', true, 'shift', null);
  end if;
  return jsonb_build_object('ok', true, 'shift', row_to_json(v_shift));
end $$;

grant execute on function get_active_shift(uuid, uuid) to authenticated;

-- ============================================================================
-- 13. Seed Permissions (skip if permissions table not yet present)
-- ============================================================================
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='permissions') then
    insert into permissions (id, name, group_name, description) values
      ('shifts.view',   'Xem ca làm việc', 'Shifts', 'Xem danh sách ca thu ngân và chi tiết từng ca'),
      ('shifts.open',   'Mở ca làm việc', 'Shifts', 'Cho phép thu ngân mở ca và khai báo tiền đầu ca'),
      ('shifts.close',  'Đóng ca làm việc', 'Shifts', 'Cho phép thu ngân đóng ca và đối soát tiền cuối ca'),
      ('shifts.review', 'Duyệt ca làm việc', 'Shifts', 'Cho phép quản lý xem & duyệt ca, cảnh báo chênh lệch tiền'),
      ('shifts.adjust', 'Điều chỉnh ca', 'Shifts', 'Cho phép sửa số liệu chênh lệch và điều chỉnh ngân quỹ'),
      ('shifts.export', 'Xuất báo cáo ca', 'Shifts', 'Cho phép xuất báo cáo ca dưới dạng PDF/Excel hoặc in')
    on conflict (id) do update set
      name = excluded.name,
      group_name = excluded.group_name,
      description = excluded.description;
  else
    raise notice 'Bảng permissions chưa tồn tại — bỏ qua seed shift permissions. Chạy permissions_migration.sql trước rồi chạy lại file này.';
  end if;
end $$;

-- ============================================================================
-- 14. Realtime
-- ============================================================================
do $$
begin
  begin
    alter publication supabase_realtime add table shifts;
  exception when duplicate_object then null;
  when others then null;
  end;
  begin
    alter publication supabase_realtime add table shift_transactions;
  exception when duplicate_object then null;
  when others then null;
  end;
end $$;

-- Force PostgREST schema cache reload
notify pgrst, 'reload schema';
