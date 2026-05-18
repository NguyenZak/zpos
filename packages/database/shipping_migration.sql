-- 1. Shipping Providers
create table if not exists shipping_providers (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references organizations(id) on delete cascade not null,
  provider_code text not null check (provider_code in ('GHN', 'GHTK', 'VIETTEL_POST', 'AHAMOVE', 'LALAMOVE')),
  api_key text,
  api_secret text,
  is_active boolean default false,
  settings jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(tenant_id, provider_code)
);

-- 2. Shipping Orders
create table if not exists shipping_orders (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references organizations(id) on delete cascade not null,
  order_id uuid references orders(id) on delete cascade not null,
  provider_code text not null,
  tracking_code text,
  status text default 'PENDING' check (status in ('PENDING', 'READY_TO_PICK', 'PICKING', 'DELIVERING', 'DELIVERED', 'RETURN_SHIPPING', 'RETURNED', 'CANCELLED')),
  shipping_fee decimal(12,2) default 0,
  cod_amount decimal(12,2) default 0,
  estimated_delivery_time timestamp with time zone,
  provider_payload jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. Shipping Logs (Webhooks)
create table if not exists shipping_logs (
  id uuid primary key default uuid_generate_v4(),
  shipping_order_id uuid references shipping_orders(id) on delete cascade not null,
  status text not null,
  notes text,
  webhook_payload jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- 4. COD Reconciliations
create table if not exists cod_reconciliations (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references organizations(id) on delete cascade not null,
  provider_code text not null,
  reconciliation_code text not null,
  status text default 'PENDING' check (status in ('PENDING', 'MATCHED', 'DISCREPANCY')),
  total_cod decimal(12,2) default 0,
  total_fee decimal(12,2) default 0,
  expected_amount decimal(12,2) default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(tenant_id, reconciliation_code)
);

-- Enable RLS
alter table shipping_providers enable row level security;
alter table shipping_orders enable row level security;
alter table shipping_logs enable row level security;
alter table cod_reconciliations enable row level security;

-- Simple policies (Drop if exists to avoid errors on multiple runs)
drop policy if exists "Members can view shipping providers" on shipping_providers;
create policy "Members can view shipping providers" on shipping_providers for select using (exists (select 1 from organization_members where organization_id = shipping_providers.tenant_id and profile_id = auth.uid()));

drop policy if exists "Members can view shipping orders" on shipping_orders;
create policy "Members can view shipping orders" on shipping_orders for select using (exists (select 1 from organization_members where organization_id = shipping_orders.tenant_id and profile_id = auth.uid()));

drop policy if exists "Members can view cod reconciliations" on cod_reconciliations;
create policy "Members can view cod reconciliations" on cod_reconciliations for select using (exists (select 1 from organization_members where organization_id = cod_reconciliations.tenant_id and profile_id = auth.uid()));
