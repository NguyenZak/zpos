-- ============================================================================
-- ZPOS eInvoice (Hóa đơn điện tử) Migration
-- Compliant with Vietnamese Decree 123/2020 & Circular 78/2021
-- Idempotent — safe to run multiple times
-- ============================================================================

-- 1. Tax Settings (per-tenant business identity used on invoices)
create table if not exists tax_settings (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references organizations(id) on delete cascade not null unique,
  company_name text not null,
  tax_code text not null,
  legal_address text,
  district text,
  province text,
  phone text,
  email text,
  bank_account text,
  bank_name text,
  representative_name text,
  representative_title text,
  default_vat_rate numeric(5,2) default 8,
  default_currency text default 'VND',
  invoice_template text default 'standard',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_tax_settings_tenant on tax_settings(tenant_id);

-- 2. eInvoice Provider Configurations
create table if not exists einvoice_configs (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references organizations(id) on delete cascade not null,
  provider text not null
    check (provider in ('vnpt', 'viettel', 'misa', 'mobifone', 'easyinvoice', 'manual', 'demo')),
  is_active boolean default true,
  is_default boolean default false,
  api_base_url text,
  api_username text,
  api_password text,
  api_token text,
  cert_serial text,
  invoice_series text,
  invoice_template_code text,
  current_invoice_no integer default 0,
  auto_issue_on_payment boolean default false,
  send_to_customer_email boolean default true,
  extra_config jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_einvoice_configs_tenant on einvoice_configs(tenant_id);
create unique index if not exists idx_einvoice_default_per_tenant
  on einvoice_configs(tenant_id) where is_default = true;

-- 3. Issued Invoices (legal records)
create table if not exists invoices (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references organizations(id) on delete cascade not null,
  order_id uuid references orders(id) on delete set null,
  config_id uuid references einvoice_configs(id) on delete set null,
  -- Customer snapshot at issuance time (legal record — immutable)
  buyer_name text,
  buyer_tax_code text,
  buyer_address text,
  buyer_email text,
  buyer_phone text,
  -- Invoice numbering (provider returns these after signing)
  invoice_series text,
  invoice_template_code text,
  invoice_no text,
  invoice_date timestamp with time zone default now(),
  -- Amounts
  subtotal numeric(14,2) not null default 0,
  discount_amount numeric(14,2) default 0,
  vat_rate numeric(5,2) default 0,
  vat_amount numeric(14,2) default 0,
  total_amount numeric(14,2) not null default 0,
  currency text default 'VND',
  -- Items snapshot (immutable line items at the moment of issuance)
  items jsonb default '[]'::jsonb,
  -- Lifecycle & status
  status text not null default 'draft'
    check (status in ('draft', 'pending', 'issued', 'sent', 'cancelled', 'replaced', 'adjusted', 'failed')),
  provider text not null default 'manual',
  provider_invoice_id text,
  provider_lookup_code text,
  provider_pdf_url text,
  provider_xml_url text,
  signed_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  cancelled_reason text,
  replaced_by uuid references invoices(id),
  -- Notes & raw responses for troubleshooting
  notes text,
  error_message text,
  provider_payload jsonb default '{}'::jsonb,
  issued_by uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_invoices_tenant on invoices(tenant_id);
create index if not exists idx_invoices_order on invoices(order_id);
create index if not exists idx_invoices_status on invoices(status);
create index if not exists idx_invoices_invoice_no on invoices(invoice_no);
create index if not exists idx_invoices_date on invoices(invoice_date desc);
create unique index if not exists idx_invoices_unique_provider_no
  on invoices(tenant_id, provider, invoice_series, invoice_no)
  where invoice_no is not null;

-- 4. Optional: link from orders → primary invoice
alter table orders add column if not exists invoice_id uuid;
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'orders_invoice_fk' and table_name = 'orders'
  ) then
    alter table orders add constraint orders_invoice_fk
      foreign key (invoice_id) references invoices(id) on delete set null;
  end if;
end $$;
create index if not exists idx_orders_invoice on orders(invoice_id);

-- 5. Updated_at triggers
drop trigger if exists trg_tax_settings_updated on tax_settings;
create trigger trg_tax_settings_updated before update on tax_settings
  for each row execute function set_updated_at();

drop trigger if exists trg_einvoice_configs_updated on einvoice_configs;
create trigger trg_einvoice_configs_updated before update on einvoice_configs
  for each row execute function set_updated_at();

drop trigger if exists trg_invoices_updated on invoices;
create trigger trg_invoices_updated before update on invoices
  for each row execute function set_updated_at();

-- 6. RLS
alter table tax_settings enable row level security;
alter table einvoice_configs enable row level security;
alter table invoices enable row level security;

drop policy if exists "tax_settings_select" on tax_settings;
create policy "tax_settings_select" on tax_settings for select using (
  exists (select 1 from organization_members
    where organization_id = tax_settings.tenant_id and profile_id = auth.uid())
  or auth.email() like '%@zpos.click'
);

drop policy if exists "tax_settings_modify" on tax_settings;
create policy "tax_settings_modify" on tax_settings for all using (
  exists (select 1 from organization_members
    where organization_id = tax_settings.tenant_id
      and profile_id = auth.uid()
      and role in ('owner', 'admin'))
  or auth.email() like '%@zpos.click'
);

drop policy if exists "einvoice_configs_select" on einvoice_configs;
create policy "einvoice_configs_select" on einvoice_configs for select using (
  exists (select 1 from organization_members
    where organization_id = einvoice_configs.tenant_id and profile_id = auth.uid())
  or auth.email() like '%@zpos.click'
);

drop policy if exists "einvoice_configs_modify" on einvoice_configs;
create policy "einvoice_configs_modify" on einvoice_configs for all using (
  exists (select 1 from organization_members
    where organization_id = einvoice_configs.tenant_id
      and profile_id = auth.uid()
      and role in ('owner', 'admin'))
  or auth.email() like '%@zpos.click'
);

drop policy if exists "invoices_select" on invoices;
create policy "invoices_select" on invoices for select using (
  exists (select 1 from organization_members
    where organization_id = invoices.tenant_id and profile_id = auth.uid())
  or auth.email() like '%@zpos.click'
);

drop policy if exists "invoices_modify" on invoices;
create policy "invoices_modify" on invoices for all using (
  exists (select 1 from organization_members
    where organization_id = invoices.tenant_id
      and profile_id = auth.uid()
      and role in ('owner', 'admin', 'manager'))
  or auth.email() like '%@zpos.click'
);

-- 7. RPC: next_invoice_number — atomically reserve the next invoice number
-- so concurrent checkouts can never collide on the same number.
create or replace function next_invoice_number(p_config_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next integer;
begin
  update einvoice_configs
     set current_invoice_no = coalesce(current_invoice_no, 0) + 1
   where id = p_config_id
  returning current_invoice_no into v_next;
  if v_next is null then
    raise exception 'einvoice_config_not_found';
  end if;
  return v_next;
end $$;

grant execute on function next_invoice_number(uuid) to authenticated;

-- 8. Realtime
do $$
begin
  begin
    alter publication supabase_realtime add table invoices;
  exception when duplicate_object then null;
  end;
end $$;
