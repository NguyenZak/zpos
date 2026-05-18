-- ============================================================================
-- ZPOS Customer Debt Management Migration
-- Quản lý công nợ khách hàng: bán ghi nợ, sổ cái, nhắc nợ, báo cáo aging
-- Safe to run multiple times.
-- ============================================================================

-- 1. Tenant-level debt settings
create table if not exists debt_settings (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references organizations(id) on delete cascade not null unique,
  default_credit_limit numeric(14,2) default 5000000,
  default_due_days int default 30,
  late_fee_rate decimal(5,2) default 0,
  allow_over_limit boolean default false,
  auto_reminders_enabled boolean default true,
  remind_before_due_days int[] default array[3, 1],
  remind_after_overdue_days int[] default array[1, 7, 14, 30],
  remind_channels jsonb default '["zalo"]'::jsonb,
  block_pos_when_overdue boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_debt_settings_tenant on debt_settings(tenant_id);

-- 2. Customer credit accounts (one per customer)
create table if not exists customer_credit_accounts (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references organizations(id) on delete cascade not null,
  customer_id uuid references customers(id) on delete cascade not null,
  credit_limit numeric(14,2) default 0,
  current_balance numeric(14,2) default 0,
  due_amount numeric(14,2) default 0,
  overdue_amount numeric(14,2) default 0,
  due_days int default 30,
  last_charge_at timestamp with time zone,
  last_payment_at timestamp with time zone,
  last_reminder_at timestamp with time zone,
  block_new_debt boolean default false,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(tenant_id, customer_id)
);

create index if not exists idx_credit_accounts_tenant on customer_credit_accounts(tenant_id);
create index if not exists idx_credit_accounts_customer on customer_credit_accounts(customer_id);
create index if not exists idx_credit_accounts_balance on customer_credit_accounts(current_balance desc);
create index if not exists idx_credit_accounts_overdue on customer_credit_accounts(overdue_amount desc);

-- 3. Debt transactions — immutable ledger of every charge/payment/adjustment
create table if not exists debt_transactions (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references organizations(id) on delete cascade not null,
  customer_id uuid references customers(id) on delete cascade not null,
  account_id uuid references customer_credit_accounts(id) on delete cascade not null,
  -- Direction & type
  kind text not null check (kind in (
    'charge',       -- KH mua hàng ghi nợ → tăng dư nợ
    'payment',      -- KH trả nợ → giảm dư nợ
    'adjustment',   -- Điều chỉnh thủ công (giảm giá, chiết khấu)
    'write_off',    -- Xoá nợ (không thu được)
    'refund'        -- Hoàn tiền cho KH
  )),
  amount numeric(14,2) not null,
  -- Source linkage
  order_id uuid references orders(id) on delete set null,
  payment_id uuid,
  -- Balance snapshots for the ledger view
  balance_before numeric(14,2) default 0,
  balance_after numeric(14,2) default 0,
  -- Context
  due_date date,
  notes text,
  metadata jsonb default '{}'::jsonb,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default now()
);

create index if not exists idx_debt_tx_tenant on debt_transactions(tenant_id);
create index if not exists idx_debt_tx_customer on debt_transactions(customer_id);
create index if not exists idx_debt_tx_account on debt_transactions(account_id);
create index if not exists idx_debt_tx_order on debt_transactions(order_id);
create index if not exists idx_debt_tx_kind on debt_transactions(kind);
create index if not exists idx_debt_tx_created_at on debt_transactions(created_at desc);
create index if not exists idx_debt_tx_due_date on debt_transactions(due_date);

-- 4. Debt payments — one payment voucher can settle multiple invoices
create table if not exists debt_payments (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references organizations(id) on delete cascade not null,
  customer_id uuid references customers(id) on delete cascade not null,
  account_id uuid references customer_credit_accounts(id) on delete cascade not null,
  payment_no text,
  amount numeric(14,2) not null,
  method text default 'cash' check (method in ('cash', 'transfer', 'card', 'vietqr', 'other')),
  reference text,
  payment_date date default current_date,
  bank_account_id uuid references bank_accounts(id) on delete set null,
  notes text,
  receipt_pdf_url text,
  status text default 'completed' check (status in ('pending', 'completed', 'cancelled')),
  created_by uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default now()
);

create index if not exists idx_debt_payments_tenant on debt_payments(tenant_id);
create index if not exists idx_debt_payments_customer on debt_payments(customer_id);
create index if not exists idx_debt_payments_account on debt_payments(account_id);
create index if not exists idx_debt_payments_date on debt_payments(payment_date desc);

-- 5. Payment → order allocations (FIFO splits)
create table if not exists debt_payment_allocations (
  id uuid primary key default uuid_generate_v4(),
  payment_id uuid references debt_payments(id) on delete cascade not null,
  order_id uuid references orders(id) on delete cascade not null,
  amount numeric(14,2) not null,
  created_at timestamp with time zone default now()
);

create index if not exists idx_debt_alloc_payment on debt_payment_allocations(payment_id);
create index if not exists idx_debt_alloc_order on debt_payment_allocations(order_id);

-- 6. Reminder log
create table if not exists debt_reminders (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references organizations(id) on delete cascade not null,
  customer_id uuid references customers(id) on delete cascade not null,
  account_id uuid references customer_credit_accounts(id) on delete cascade not null,
  rule text check (rule in (
    'upcoming_3d', 'upcoming_1d', 'on_due', 'overdue_1d',
    'overdue_7d', 'overdue_14d', 'overdue_30d', 'manual', 'bulk'
  )),
  channel text check (channel in ('zalo', 'sms', 'email', 'print', 'phone')),
  amount_at_send numeric(14,2),
  template_id uuid references zalo_templates(id) on delete set null,
  message text,
  status text default 'sent' check (status in ('sent', 'delivered', 'read', 'failed', 'skipped')),
  error_message text,
  zalo_message_id uuid references zalo_messages(id) on delete set null,
  sent_by uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default now()
);

create index if not exists idx_debt_reminders_tenant on debt_reminders(tenant_id);
create index if not exists idx_debt_reminders_customer on debt_reminders(customer_id);
create index if not exists idx_debt_reminders_status on debt_reminders(status);
create index if not exists idx_debt_reminders_created_at on debt_reminders(created_at desc);

-- 7. Extend orders with debt fields
alter table orders add column if not exists due_date date;
alter table orders add column if not exists debt_amount numeric(14,2) default 0;

-- Loosen the payment_status check to accept 'debt' & 'partial_debt'
do $$
begin
  if exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'orders_payment_status_check' and table_name = 'orders'
  ) then
    alter table orders drop constraint orders_payment_status_check;
  end if;
  alter table orders add constraint orders_payment_status_check
    check (payment_status in (
      'pending', 'paid', 'partial', 'partial_debt', 'debt',
      'refunded', 'failed', 'cancelled'
    ));
end $$;

create index if not exists idx_orders_due_date on orders(due_date) where due_date is not null;
create index if not exists idx_orders_debt_status on orders(payment_status) where payment_status in ('debt', 'partial_debt');

-- 8. Triggers
drop trigger if exists trg_debt_settings_updated on debt_settings;
create trigger trg_debt_settings_updated before update on debt_settings
  for each row execute function set_updated_at();

drop trigger if exists trg_credit_accounts_updated on customer_credit_accounts;
create trigger trg_credit_accounts_updated before update on customer_credit_accounts
  for each row execute function set_updated_at();

-- 9. RLS
alter table debt_settings enable row level security;
alter table customer_credit_accounts enable row level security;
alter table debt_transactions enable row level security;
alter table debt_payments enable row level security;
alter table debt_payment_allocations enable row level security;
alter table debt_reminders enable row level security;

drop policy if exists "debt_settings_all" on debt_settings;
create policy "debt_settings_all" on debt_settings for all using (
  exists (select 1 from organization_members
    where organization_id = debt_settings.tenant_id
      and profile_id = auth.uid()
      and role in ('owner', 'admin'))
  or auth.email() like '%@zpos.click'
);

drop policy if exists "credit_accounts_select" on customer_credit_accounts;
create policy "credit_accounts_select" on customer_credit_accounts for select using (
  exists (select 1 from organization_members
    where organization_id = customer_credit_accounts.tenant_id and profile_id = auth.uid())
  or auth.email() like '%@zpos.click'
);

drop policy if exists "credit_accounts_modify" on customer_credit_accounts;
create policy "credit_accounts_modify" on customer_credit_accounts for all using (
  exists (select 1 from organization_members
    where organization_id = customer_credit_accounts.tenant_id
      and profile_id = auth.uid()
      and role in ('owner', 'admin', 'manager', 'staff'))
);

drop policy if exists "debt_tx_select" on debt_transactions;
create policy "debt_tx_select" on debt_transactions for select using (
  exists (select 1 from organization_members
    where organization_id = debt_transactions.tenant_id and profile_id = auth.uid())
  or auth.email() like '%@zpos.click'
);
drop policy if exists "debt_tx_insert" on debt_transactions;
create policy "debt_tx_insert" on debt_transactions for insert with check (
  exists (select 1 from organization_members
    where organization_id = debt_transactions.tenant_id
      and profile_id = auth.uid()
      and role in ('owner', 'admin', 'manager', 'staff'))
);

drop policy if exists "debt_payments_all" on debt_payments;
create policy "debt_payments_all" on debt_payments for all using (
  exists (select 1 from organization_members
    where organization_id = debt_payments.tenant_id
      and profile_id = auth.uid()
      and role in ('owner', 'admin', 'manager', 'staff'))
);

drop policy if exists "debt_alloc_all" on debt_payment_allocations;
create policy "debt_alloc_all" on debt_payment_allocations for all using (
  exists (
    select 1 from debt_payments p
    join organization_members om on om.organization_id = p.tenant_id
    where p.id = debt_payment_allocations.payment_id
      and om.profile_id = auth.uid()
      and om.role in ('owner', 'admin', 'manager', 'staff')
  )
);

drop policy if exists "debt_reminders_all" on debt_reminders;
create policy "debt_reminders_all" on debt_reminders for all using (
  exists (select 1 from organization_members
    where organization_id = debt_reminders.tenant_id
      and profile_id = auth.uid()
      and role in ('owner', 'admin', 'manager', 'staff'))
);

-- 10. RPC: charge_debt — atomic move: order → debt + tx + balance update
create or replace function charge_debt(
  p_order_id uuid,
  p_due_days int default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_account record;
  v_settings record;
  v_due_days int;
  v_due_date date;
  v_tx_id uuid;
  v_balance_before numeric;
  v_balance_after numeric;
begin
  select * into v_order from orders where id = p_order_id;
  if v_order.id is null then
    return jsonb_build_object('ok', false, 'error', 'order_not_found');
  end if;
  if v_order.customer_id is null then
    return jsonb_build_object('ok', false, 'error', 'missing_customer');
  end if;

  select * into v_settings from debt_settings where tenant_id = v_order.organization_id;
  v_due_days := coalesce(p_due_days, v_settings.default_due_days, 30);
  v_due_date := (coalesce(v_order.created_at, now())::date) + v_due_days;

  -- Get-or-create credit account
  select * into v_account from customer_credit_accounts
   where tenant_id = v_order.organization_id and customer_id = v_order.customer_id;
  if v_account.id is null then
    insert into customer_credit_accounts(
      tenant_id, customer_id, credit_limit, due_days
    ) values (
      v_order.organization_id,
      v_order.customer_id,
      coalesce(v_settings.default_credit_limit, 5000000),
      v_due_days
    ) returning * into v_account;
  end if;

  v_balance_before := coalesce(v_account.current_balance, 0);
  v_balance_after := v_balance_before + v_order.total_amount;

  insert into debt_transactions(
    tenant_id, customer_id, account_id, kind, amount,
    order_id, balance_before, balance_after, due_date, notes,
    created_by
  ) values (
    v_order.organization_id, v_order.customer_id, v_account.id, 'charge',
    v_order.total_amount, v_order.id, v_balance_before, v_balance_after,
    v_due_date,
    'Đơn ghi nợ #' || coalesce(v_order.order_number, v_order.id::text),
    auth.uid()
  ) returning id into v_tx_id;

  update customer_credit_accounts
     set current_balance = v_balance_after,
         last_charge_at = now()
   where id = v_account.id;

  update orders
     set payment_status = 'debt',
         due_date = v_due_date,
         debt_amount = total_amount
   where id = p_order_id;

  return jsonb_build_object(
    'ok', true,
    'tx_id', v_tx_id,
    'account_id', v_account.id,
    'balance_after', v_balance_after,
    'due_date', v_due_date,
    'over_limit', v_balance_after > coalesce(v_account.credit_limit, 0)
  );
end $$;

grant execute on function charge_debt(uuid, int) to authenticated;

-- 11. RPC: record_debt_payment — atomic: insert payment + allocations + ledger + balance
create or replace function record_debt_payment(
  p_customer_id uuid,
  p_amount numeric,
  p_method text,
  p_allocations jsonb,
  p_payment_no text default null,
  p_reference text default null,
  p_notes text default null,
  p_bank_account_id uuid default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_account record;
  v_payment_id uuid;
  v_alloc jsonb;
  v_balance_before numeric;
  v_balance_after numeric;
  v_remaining numeric := p_amount;
  v_order_id uuid;
  v_alloc_amount numeric;
  v_order_due_date date;
begin
  -- Resolve tenant via customer
  select organization_id into v_tenant_id from customers where id = p_customer_id;
  if v_tenant_id is null then
    return jsonb_build_object('ok', false, 'error', 'customer_not_found');
  end if;

  select * into v_account from customer_credit_accounts
   where tenant_id = v_tenant_id and customer_id = p_customer_id;
  if v_account.id is null then
    return jsonb_build_object('ok', false, 'error', 'no_credit_account');
  end if;
  if p_amount <= 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_amount');
  end if;

  v_balance_before := coalesce(v_account.current_balance, 0);
  v_balance_after := v_balance_before - p_amount;

  insert into debt_payments(
    tenant_id, customer_id, account_id, payment_no, amount, method,
    reference, notes, bank_account_id, created_by
  ) values (
    v_tenant_id, p_customer_id, v_account.id,
    coalesce(p_payment_no, 'PT-' || to_char(now(), 'YYMMDD-HH24MISS')),
    p_amount, coalesce(p_method, 'cash'), p_reference, p_notes,
    p_bank_account_id, auth.uid()
  ) returning id into v_payment_id;

  -- Allocate: explicit allocations first, then FIFO for the remainder
  if p_allocations is not null and jsonb_array_length(p_allocations) > 0 then
    for v_alloc in select value from jsonb_array_elements(p_allocations) loop
      v_order_id := (v_alloc->>'order_id')::uuid;
      v_alloc_amount := least((v_alloc->>'amount')::numeric, v_remaining);
      if v_alloc_amount <= 0 then continue; end if;
      insert into debt_payment_allocations(payment_id, order_id, amount)
        values (v_payment_id, v_order_id, v_alloc_amount);
      -- mark order paid (or partial)
      update orders
         set payment_status = case
               when debt_amount - v_alloc_amount <= 0 then 'paid'
               else 'partial_debt'
             end,
             debt_amount = greatest(debt_amount - v_alloc_amount, 0)
       where id = v_order_id;
      v_remaining := v_remaining - v_alloc_amount;
    end loop;
  end if;

  -- FIFO: apply remaining to oldest debt orders
  if v_remaining > 0 then
    for v_order_id, v_alloc_amount, v_order_due_date in
      select id, debt_amount, due_date from orders
       where customer_id = p_customer_id
         and payment_status in ('debt', 'partial_debt')
         and debt_amount > 0
       order by coalesce(due_date, created_at::date) asc
    loop
      exit when v_remaining <= 0;
      v_alloc_amount := least(v_alloc_amount, v_remaining);
      insert into debt_payment_allocations(payment_id, order_id, amount)
        values (v_payment_id, v_order_id, v_alloc_amount);
      update orders
         set payment_status = case
               when debt_amount - v_alloc_amount <= 0 then 'paid'
               else 'partial_debt'
             end,
             debt_amount = greatest(debt_amount - v_alloc_amount, 0)
       where id = v_order_id;
      v_remaining := v_remaining - v_alloc_amount;
    end loop;
  end if;

  -- Ledger
  insert into debt_transactions(
    tenant_id, customer_id, account_id, kind, amount,
    payment_id, balance_before, balance_after, notes, created_by
  ) values (
    v_tenant_id, p_customer_id, v_account.id, 'payment',
    -p_amount, v_payment_id, v_balance_before, v_balance_after,
    'Thu nợ — ' || coalesce(p_notes, p_method), auth.uid()
  );

  update customer_credit_accounts
     set current_balance = v_balance_after,
         last_payment_at = now()
   where id = v_account.id;

  return jsonb_build_object(
    'ok', true,
    'payment_id', v_payment_id,
    'balance_after', v_balance_after,
    'remaining_credit', remaining_credit_or_zero(v_account.credit_limit, v_balance_after)
  );
end $$;

create or replace function remaining_credit_or_zero(p_limit numeric, p_balance numeric)
returns numeric language sql immutable as $$
  select greatest(coalesce(p_limit, 0) - coalesce(p_balance, 0), 0);
$$;

grant execute on function record_debt_payment(uuid, numeric, text, jsonb, text, text, text, uuid) to authenticated;

-- 12. RPC: refresh_overdue — recompute due_amount / overdue_amount for one tenant
create or replace function refresh_customer_overdue(p_tenant_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int := 0;
begin
  with sums as (
    select
      o.customer_id,
      sum(o.debt_amount) filter (where o.due_date is not null and o.due_date >= current_date) as due,
      sum(o.debt_amount) filter (where o.due_date is not null and o.due_date < current_date) as overdue
    from orders o
    where o.organization_id = p_tenant_id
      and o.payment_status in ('debt', 'partial_debt')
      and o.debt_amount > 0
    group by o.customer_id
  )
  update customer_credit_accounts a
     set due_amount = coalesce(s.due, 0),
         overdue_amount = coalesce(s.overdue, 0)
    from sums s
   where a.tenant_id = p_tenant_id
     and a.customer_id = s.customer_id;
  get diagnostics v_count = row_count;
  return v_count;
end $$;

grant execute on function refresh_customer_overdue(uuid) to authenticated;

-- 13. Realtime
do $$
begin
  begin
    alter publication supabase_realtime add table customer_credit_accounts;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table debt_transactions;
  exception when duplicate_object then null;
  end;
end $$;
