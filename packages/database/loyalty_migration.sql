-- ============================================================================
-- ZPOS Loyalty Program Module Database Schema & Migration
-- Scoped by organization_id (Multi-Tenant SaaS)
-- Idempotent — safe to run multiple times in Supabase SQL Editor
-- ============================================================================

-- Enable UUID extension if not exists
create extension if not exists "uuid-ossp";

-- 1. Loyalty Programs (Global settings per organization)
create table if not exists loyalty_programs (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade not null unique,
  is_enabled boolean default false,
  point_name text default 'Điểm',
  expiration_months integer default 12, -- Points expire after X months
  birthday_bonus_points integer default 0,
  first_purchase_bonus_points integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_loyalty_programs_org on loyalty_programs(organization_id);

-- 2. Loyalty Tiers (Customer membership levels)
create table if not exists loyalty_tiers (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade not null,
  name text not null, -- Bronze, Silver, Gold, Platinum, VIP
  min_points integer not null default 0, -- Points threshold to reach this tier
  points_multiplier numeric(3,2) default 1.00, -- VIP multiplier (e.g. 1.20, 1.50, 2.00)
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(organization_id, name)
);

create index if not exists idx_loyalty_tiers_org on loyalty_tiers(organization_id);

-- 3. Loyalty Rules (Rules for earning or redeeming points)
create table if not exists loyalty_rules (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade not null,
  name text not null,
  rule_type text not null check (rule_type in ('earning_spend', 'earning_order', 'earning_product', 'redemption_discount')),
  -- Conditions
  product_id uuid references products(id) on delete cascade, -- Specific product
  category_id uuid references categories(id) on delete cascade, -- Specific category
  spend_amount numeric(12,2), -- Spend 10,000 VND
  points_awarded integer, -- gets 1 point
  
  -- Redemption Configuration
  points_required integer, -- 100 points
  discount_amount numeric(12,2), -- gets 10,000 VND discount
  min_points_to_redeem integer default 0,
  max_discount_percentage numeric(5,2) default 100.00, -- e.g. Max 30% discount per order
  allow_on_discounted_orders boolean default false,
  
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_loyalty_rules_org on loyalty_rules(organization_id);
create index if not exists idx_loyalty_rules_product on loyalty_rules(product_id);
create index if not exists idx_loyalty_rules_category on loyalty_rules(category_id);

-- 4. Loyalty Campaigns (Double points, seasonal events)
create table if not exists loyalty_campaigns (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade not null,
  name text not null,
  campaign_type text not null check (campaign_type in ('double_points', 'first_purchase', 'birthday_bonus', 'custom')),
  points_multiplier numeric(3,2) default 1.00,
  bonus_points integer default 0,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_loyalty_campaigns_org on loyalty_campaigns(organization_id);
create index if not exists idx_loyalty_campaigns_dates on loyalty_campaigns(start_date, end_date);

-- 5. Customer Loyalty Balances (Aggregate points and tier for customer)
create table if not exists customer_loyalty_balances (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade not null,
  customer_id uuid references customers(id) on delete cascade not null unique,
  current_points integer not null default 0,
  lifetime_points integer not null default 0,
  tier_id uuid references loyalty_tiers(id) on delete set null,
  updated_at timestamp with time zone default now()
);

create index if not exists idx_customer_loyalty_balances_org on customer_loyalty_balances(organization_id);
create index if not exists idx_customer_loyalty_balances_cust on customer_loyalty_balances(customer_id);

-- 6. Loyalty Transactions (History log of points changes)
create table if not exists loyalty_transactions (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade not null,
  customer_id uuid references customers(id) on delete cascade not null,
  order_id uuid references orders(id) on delete set null,
  transaction_type text not null check (transaction_type in ('earn', 'redeem', 'adjust_add', 'adjust_sub', 'expire')),
  points integer not null, -- Positive for earn/adjust_add, negative for redeem/adjust_sub/expire
  amount_spent numeric(12,2) default 0,
  notes text,
  created_at timestamp with time zone default now()
);

create index if not exists idx_loyalty_transactions_org on loyalty_transactions(organization_id);
create index if not exists idx_loyalty_transactions_cust on loyalty_transactions(customer_id);
create index if not exists idx_loyalty_transactions_order on loyalty_transactions(order_id);

-- 7. Loyalty Redemptions (Stores discount details applied to orders)
create table if not exists loyalty_redemptions (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade not null,
  customer_id uuid references customers(id) on delete cascade not null,
  order_id uuid references orders(id) on delete cascade not null,
  points_redeemed integer not null check (points_redeemed > 0),
  discount_applied numeric(12,2) not null check (discount_applied > 0),
  created_at timestamp with time zone default now()
);

create index if not exists idx_loyalty_redemptions_org on loyalty_redemptions(organization_id);
create index if not exists idx_loyalty_redemptions_order on loyalty_redemptions(order_id);

-- ============================================================================
-- Triggers for Automatic Schema management & Balance synchronization
-- ============================================================================

-- Function to set updated_at automatically
-- (Checks if it exists first, since other migrations might have created it)
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply set_updated_at trigger
drop trigger if exists trg_loyalty_programs_updated on loyalty_programs;
create trigger trg_loyalty_programs_updated before update on loyalty_programs
  for each row execute function set_updated_at();

drop trigger if exists trg_loyalty_rules_updated on loyalty_rules;
create trigger trg_loyalty_rules_updated before update on loyalty_rules
  for each row execute function set_updated_at();

drop trigger if exists trg_loyalty_tiers_updated on loyalty_tiers;
create trigger trg_loyalty_tiers_updated before update on loyalty_tiers
  for each row execute function set_updated_at();

drop trigger if exists trg_loyalty_campaigns_updated on loyalty_campaigns;
create trigger trg_loyalty_campaigns_updated before update on loyalty_campaigns
  for each row execute function set_updated_at();

-- Trigger to automatically recalculate balances & update customer tier on transaction insert
create or replace function update_customer_loyalty_balance()
returns trigger as $$
declare
  v_current_points integer;
  v_lifetime_points integer;
  v_new_tier_id uuid;
begin
  -- 1. Ensure the balance row exists
  insert into customer_loyalty_balances (organization_id, customer_id, current_points, lifetime_points, updated_at)
  values (new.organization_id, new.customer_id, 0, 0, now())
  on conflict (customer_id) do nothing;

  -- 2. Recalculate sums from transaction history for safety and accuracy
  select coalesce(sum(points), 0)
    into v_current_points
    from loyalty_transactions
   where customer_id = new.customer_id;
   
  select coalesce(sum(points), 0)
    into v_lifetime_points
    from loyalty_transactions
   where customer_id = new.customer_id
     and points > 0; -- Only positive additions count towards tier qualification

  -- 3. Determine the customer's new tier based on lifetime points
  select id
    into v_new_tier_id
    from loyalty_tiers
   where organization_id = new.organization_id
     and min_points <= v_lifetime_points
   order by min_points desc
   limit 1;

  -- 4. Update the aggregate balance
  update customer_loyalty_balances
     set current_points = v_current_points,
         lifetime_points = v_lifetime_points,
         tier_id = v_new_tier_id,
         updated_at = now()
   where customer_id = new.customer_id;

  -- 5. Sync points back to legacy customers.loyalty_points column
  update customers
     set loyalty_points = v_current_points,
         updated_at = now()
   where id = new.customer_id;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_loyalty_transaction_inserted on loyalty_transactions;
create trigger trg_loyalty_transaction_inserted after insert on loyalty_transactions
  for each row execute function update_customer_loyalty_balance();

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================
alter table loyalty_programs enable row level security;
alter table loyalty_rules enable row level security;
alter table loyalty_tiers enable row level security;
alter table loyalty_campaigns enable row level security;
alter table customer_loyalty_balances enable row level security;
alter table loyalty_transactions enable row level security;
alter table loyalty_redemptions enable row level security;

-- Basic Select/Modify Policies Scoped by Tenant
drop policy if exists "loyalty_programs_select" on loyalty_programs;
create policy "loyalty_programs_select" on loyalty_programs for select using (
  exists (select 1 from organization_members where organization_id = loyalty_programs.organization_id and profile_id = auth.uid())
);
drop policy if exists "loyalty_programs_modify" on loyalty_programs;
create policy "loyalty_programs_modify" on loyalty_programs for all using (
  exists (select 1 from organization_members where organization_id = loyalty_programs.organization_id and profile_id = auth.uid() and role in ('owner', 'admin'))
);

drop policy if exists "loyalty_rules_select" on loyalty_rules;
create policy "loyalty_rules_select" on loyalty_rules for select using (
  exists (select 1 from organization_members where organization_id = loyalty_rules.organization_id and profile_id = auth.uid())
);
drop policy if exists "loyalty_rules_modify" on loyalty_rules;
create policy "loyalty_rules_modify" on loyalty_rules for all using (
  exists (select 1 from organization_members where organization_id = loyalty_rules.organization_id and profile_id = auth.uid() and role in ('owner', 'admin'))
);

drop policy if exists "loyalty_tiers_select" on loyalty_tiers;
create policy "loyalty_tiers_select" on loyalty_tiers for select using (
  exists (select 1 from organization_members where organization_id = loyalty_tiers.organization_id and profile_id = auth.uid())
);
drop policy if exists "loyalty_tiers_modify" on loyalty_tiers;
create policy "loyalty_tiers_modify" on loyalty_tiers for all using (
  exists (select 1 from organization_members where organization_id = loyalty_tiers.organization_id and profile_id = auth.uid() and role in ('owner', 'admin'))
);

drop policy if exists "loyalty_campaigns_select" on loyalty_campaigns;
create policy "loyalty_campaigns_select" on loyalty_campaigns for select using (
  exists (select 1 from organization_members where organization_id = loyalty_campaigns.organization_id and profile_id = auth.uid())
);
drop policy if exists "loyalty_campaigns_modify" on loyalty_campaigns;
create policy "loyalty_campaigns_modify" on loyalty_campaigns for all using (
  exists (select 1 from organization_members where organization_id = loyalty_campaigns.organization_id and profile_id = auth.uid() and role in ('owner', 'admin'))
);

drop policy if exists "customer_loyalty_balances_select" on customer_loyalty_balances;
create policy "customer_loyalty_balances_select" on customer_loyalty_balances for select using (
  exists (select 1 from organization_members where organization_id = customer_loyalty_balances.organization_id and profile_id = auth.uid())
);
drop policy if exists "customer_loyalty_balances_modify" on customer_loyalty_balances;
create policy "customer_loyalty_balances_modify" on customer_loyalty_balances for all using (
  exists (select 1 from organization_members where organization_id = customer_loyalty_balances.organization_id and profile_id = auth.uid() and role in ('owner', 'admin'))
);

drop policy if exists "loyalty_transactions_select" on loyalty_transactions;
create policy "loyalty_transactions_select" on loyalty_transactions for select using (
  exists (select 1 from organization_members where organization_id = loyalty_transactions.organization_id and profile_id = auth.uid())
);
drop policy if exists "loyalty_transactions_modify" on loyalty_transactions;
create policy "loyalty_transactions_modify" on loyalty_transactions for all using (
  exists (select 1 from organization_members where organization_id = loyalty_transactions.organization_id and profile_id = auth.uid())
);

drop policy if exists "loyalty_redemptions_select" on loyalty_redemptions;
create policy "loyalty_redemptions_select" on loyalty_redemptions for select using (
  exists (select 1 from organization_members where organization_id = loyalty_redemptions.organization_id and profile_id = auth.uid())
);
drop policy if exists "loyalty_redemptions_modify" on loyalty_redemptions;
create policy "loyalty_redemptions_modify" on loyalty_redemptions for all using (
  exists (select 1 from organization_members where organization_id = loyalty_redemptions.organization_id and profile_id = auth.uid())
);

-- ============================================================================
-- Seed Permissions Configuration (chỉ chạy nếu permissions_migration đã chạy)
-- ============================================================================
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'permissions') then
    insert into permissions (id, name, group_name, description) values
      ('loyalty.view', 'Xem cấu hình tích điểm', 'Loyalty', 'Xem quy tắc tích điểm, đổi điểm và lịch sử điểm khách hàng'),
      ('loyalty.update', 'Quản lý cấu hình tích điểm', 'Loyalty', 'Thiết lập quy tắc tích điểm, đổi điểm, hạng thành viên và chiến dịch tích lũy'),
      ('loyalty.redeem', 'Đổi điểm thanh toán', 'Loyalty', 'Cho phép áp dụng điểm tích lũy để thanh toán đơn hàng tại quầy POS'),
      ('loyalty.adjust', 'Điều chỉnh điểm thủ công', 'Loyalty', 'Cho phép cộng hoặc trừ điểm tích lũy của khách hàng thủ công kèm theo lý do')
    on conflict (id) do update set
      name = excluded.name,
      group_name = excluded.group_name,
      description = excluded.description;
  else
    raise notice 'Bảng permissions chưa tồn tại — bỏ qua seed loyalty permissions. Chạy permissions_migration.sql trước rồi chạy lại file này nếu muốn seed.';
  end if;
end $$;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
