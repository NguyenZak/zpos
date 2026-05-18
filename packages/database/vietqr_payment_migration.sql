-- ============================================================================
-- ZPOS VietQR Payment Migration
-- Adds: bank_accounts, payment_transactions, payment tracking on orders
-- Safe to run multiple times (uses IF NOT EXISTS / IF EXISTS guards)
-- ============================================================================

-- 1. Bank Accounts (per tenant — supports multiple accounts)
create table if not exists bank_accounts (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references organizations(id) on delete cascade not null,
  bank_id text not null,
  bank_name text,
  bank_short_name text,
  bank_logo text,
  account_no text not null,
  account_name text not null,
  memo_prefix text default 'ZPOS',
  is_default boolean default false,
  is_active boolean default true,
  webhook_provider text default 'sepay'
    check (webhook_provider in ('sepay', 'casso', 'generic', 'manual')),
  webhook_secret text,
  webhook_token text,
  daily_limit decimal(14,2),
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_bank_accounts_tenant on bank_accounts(tenant_id);
create unique index if not exists idx_bank_accounts_default_per_tenant
  on bank_accounts(tenant_id) where is_default = true;
create unique index if not exists idx_bank_accounts_unique_account
  on bank_accounts(tenant_id, bank_id, account_no);

-- 2. Payment Transactions (webhook payment log + reconciliation)
create table if not exists payment_transactions (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references organizations(id) on delete cascade not null,
  bank_account_id uuid references bank_accounts(id) on delete set null,
  order_id uuid references orders(id) on delete set null,
  provider text not null,
  external_id text,
  reference_code text,
  amount decimal(14,2) not null,
  transfer_type text default 'in' check (transfer_type in ('in', 'out')),
  counterparty_name text,
  counterparty_account text,
  description text,
  status text default 'unmatched'
    check (status in ('unmatched', 'matched', 'manual', 'duplicate', 'ignored', 'failed')),
  matched_at timestamp with time zone,
  matched_by uuid references profiles(id) on delete set null,
  raw_payload jsonb default '{}'::jsonb,
  received_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

create index if not exists idx_payment_tx_tenant on payment_transactions(tenant_id);
create index if not exists idx_payment_tx_order on payment_transactions(order_id);
create index if not exists idx_payment_tx_reference on payment_transactions(reference_code);
create index if not exists idx_payment_tx_status on payment_transactions(status);
create index if not exists idx_payment_tx_received_at on payment_transactions(received_at desc);
create unique index if not exists idx_payment_tx_external_unique
  on payment_transactions(tenant_id, provider, external_id)
  where external_id is not null;

-- 3. Extend orders with payment tracking
alter table orders add column if not exists payment_status text default 'pending';
alter table orders add column if not exists payment_reference text;
alter table orders add column if not exists payment_confirmed_at timestamp with time zone;
alter table orders add column if not exists payment_amount_received decimal(14,2) default 0;
alter table orders add column if not exists bank_account_id uuid;

-- Add FK & check after the columns exist (idempotent)
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'orders_payment_status_check' and table_name = 'orders'
  ) then
    alter table orders add constraint orders_payment_status_check
      check (payment_status in ('pending', 'paid', 'partial', 'refunded', 'failed', 'cancelled'));
  end if;

  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'orders_bank_account_fk' and table_name = 'orders'
  ) then
    alter table orders add constraint orders_bank_account_fk
      foreign key (bank_account_id) references bank_accounts(id) on delete set null;
  end if;
end $$;

create index if not exists idx_orders_payment_reference on orders(payment_reference);
create index if not exists idx_orders_payment_status on orders(payment_status);

-- 4. Auto-update timestamps
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end $$ language plpgsql;

drop trigger if exists trg_bank_accounts_updated on bank_accounts;
create trigger trg_bank_accounts_updated before update on bank_accounts
  for each row execute function set_updated_at();

-- 5. Row Level Security
alter table bank_accounts enable row level security;
alter table payment_transactions enable row level security;

drop policy if exists "bank_accounts_select" on bank_accounts;
create policy "bank_accounts_select" on bank_accounts for select using (
  exists (select 1 from organization_members
    where organization_id = bank_accounts.tenant_id and profile_id = auth.uid())
  or auth.email() like '%@zpos.click'
  or auth.email() like '%@zpos.vn'
);

drop policy if exists "bank_accounts_modify" on bank_accounts;
create policy "bank_accounts_modify" on bank_accounts for all using (
  exists (select 1 from organization_members
    where organization_id = bank_accounts.tenant_id
      and profile_id = auth.uid()
      and role in ('owner', 'admin'))
  or auth.email() like '%@zpos.click'
);

drop policy if exists "payment_tx_select" on payment_transactions;
create policy "payment_tx_select" on payment_transactions for select using (
  exists (select 1 from organization_members
    where organization_id = payment_transactions.tenant_id and profile_id = auth.uid())
  or auth.email() like '%@zpos.click'
);

drop policy if exists "payment_tx_insert" on payment_transactions;
create policy "payment_tx_insert" on payment_transactions for insert with check (true);

drop policy if exists "payment_tx_update" on payment_transactions;
create policy "payment_tx_update" on payment_transactions for update using (
  exists (select 1 from organization_members
    where organization_id = payment_transactions.tenant_id
      and profile_id = auth.uid()
      and role in ('owner', 'admin', 'manager'))
);

-- 6. RPC: record_payment_webhook
-- SECURITY DEFINER so webhook handler can match + update orders
-- without holding a Supabase service role key on the app server.
-- Validation: callers must pass the bank_account's webhook_secret.
create or replace function record_payment_webhook(
  p_bank_account_id uuid,
  p_webhook_secret text,
  p_provider text,
  p_external_id text,
  p_amount numeric,
  p_reference_code text,
  p_description text,
  p_transfer_type text,
  p_counterparty_name text,
  p_counterparty_account text,
  p_raw_payload jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_expected_secret text;
  v_existing_tx_id uuid;
  v_tx_id uuid;
  v_order record;
  v_now timestamp with time zone := now();
  v_status text := 'unmatched';
begin
  -- 1. Validate bank account & secret
  select tenant_id, webhook_secret
    into v_tenant_id, v_expected_secret
  from bank_accounts
  where id = p_bank_account_id;

  if v_tenant_id is null then
    return jsonb_build_object('ok', false, 'error', 'bank_account_not_found');
  end if;

  if v_expected_secret is not null
     and v_expected_secret <> ''
     and v_expected_secret <> p_webhook_secret then
    return jsonb_build_object('ok', false, 'error', 'invalid_secret');
  end if;

  -- 2. Idempotency: if (tenant, provider, external_id) exists, return it
  if p_external_id is not null and p_external_id <> '' then
    select id into v_existing_tx_id
    from payment_transactions
    where tenant_id = v_tenant_id
      and provider = p_provider
      and external_id = p_external_id
    limit 1;

    if v_existing_tx_id is not null then
      return jsonb_build_object('ok', true, 'duplicate', true, 'tx_id', v_existing_tx_id);
    end if;
  end if;

  -- 3. Try to match a pending order by reference_code first, then by amount
  if p_reference_code is not null and p_reference_code <> '' then
    select * into v_order
    from orders
    where organization_id = v_tenant_id
      and payment_reference = p_reference_code
      and payment_status = 'pending'
    order by created_at desc
    limit 1;
  end if;

  if v_order.id is null and p_description is not null then
    -- Loose match: scan description for any pending reference
    select o.* into v_order
    from orders o
    where o.organization_id = v_tenant_id
      and o.payment_status = 'pending'
      and o.payment_reference is not null
      and position(o.payment_reference in upper(p_description)) > 0
    order by o.created_at desc
    limit 1;
  end if;

  -- 4. Insert the transaction row
  if v_order.id is not null then v_status := 'matched'; end if;

  insert into payment_transactions(
    tenant_id, bank_account_id, order_id, provider, external_id,
    reference_code, amount, transfer_type, counterparty_name,
    counterparty_account, description, status, matched_at, raw_payload
  ) values (
    v_tenant_id, p_bank_account_id, v_order.id, p_provider, p_external_id,
    p_reference_code, p_amount,
    coalesce(p_transfer_type, 'in'),
    p_counterparty_name, p_counterparty_account, p_description,
    v_status,
    case when v_order.id is not null then v_now else null end,
    coalesce(p_raw_payload, '{}'::jsonb)
  )
  returning id into v_tx_id;

  -- 5. If matched, flip the order to paid
  if v_order.id is not null then
    update orders
       set payment_status = 'paid',
           payment_confirmed_at = v_now,
           payment_amount_received = coalesce(payment_amount_received, 0) + p_amount
     where id = v_order.id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'tx_id', v_tx_id,
    'matched', v_order.id is not null,
    'order_id', v_order.id
  );
end $$;

grant execute on function record_payment_webhook(
  uuid, text, text, text, numeric, text, text, text, text, text, jsonb
) to anon, authenticated;

-- 7. Realtime publication (safe — ignore if already added)
do $$
begin
  begin
    alter publication supabase_realtime add table payment_transactions;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table orders;
  exception when duplicate_object then null;
  end;
end $$;
