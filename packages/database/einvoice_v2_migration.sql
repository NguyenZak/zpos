-- ============================================================================
-- ZPOS eInvoice Module — Database Migration v2
-- Mở rộng module hóa đơn điện tử cho thị trường Việt Nam
-- Tuân thủ Nghị định 123/2020/NĐ-CP & Thông tư 78/2021/TT-BTC
-- Idempotent — safe to run multiple times
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Mở rộng bảng invoices — thêm các cột còn thiếu
-- ─────────────────────────────────────────────────────────────────────────────
alter table invoices
  add column if not exists branch_id uuid references branches(id) on delete set null,
  add column if not exists customer_id uuid references customers(id) on delete set null,
  add column if not exists invoice_type text default 'B2C',
  add column if not exists tax_authority_code text,
  add column if not exists lookup_code text,
  add column if not exists lookup_url text,
  add column if not exists qr_code_url text,
  add column if not exists payment_method text,
  add column if not exists adjusted_at timestamp with time zone,
  add column if not exists replaced_at timestamp with time zone,
  add column if not exists error_code text,
  add column if not exists raw_request jsonb,
  add column if not exists raw_response jsonb,
  add column if not exists replaced_by_id uuid references invoices(id) on delete set null,
  add column if not exists issued_by uuid references profiles(id) on delete set null;

-- Mở rộng enum status (xóa constraint cũ, thêm mới)
alter table invoices drop constraint if exists invoices_status_check;
alter table invoices add constraint invoices_status_check
  check (status in (
    'draft', 'pending', 'issued', 'sent', 'sent_to_tax',
    'cancelled', 'replaced', 'adjusted', 'failed', 'synced', 'unknown'
  ));

-- Thêm invoice_type constraint
alter table invoices drop constraint if exists invoices_invoice_type_check;
alter table invoices add constraint invoices_invoice_type_check
  check (invoice_type in ('B2C', 'B2B', 'POS', 'ADJUST', 'REPLACE'));

-- Indexes mới
create index if not exists idx_invoices_branch on invoices(branch_id);
create index if not exists idx_invoices_customer on invoices(customer_id);
create index if not exists idx_invoices_lookup_code on invoices(lookup_code);
create index if not exists idx_invoices_replaced_by on invoices(replaced_by_id);
create index if not exists idx_invoices_issued_by on invoices(issued_by);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Mở rộng bảng einvoice_configs — thêm cột bảo mật & môi trường
-- ─────────────────────────────────────────────────────────────────────────────
alter table einvoice_configs
  add column if not exists api_password_encrypted text,
  add column if not exists api_token_encrypted text,
  add column if not exists client_id_encrypted text,
  add column if not exists client_secret_encrypted text,
  add column if not exists environment text default 'sandbox',
  add column if not exists webhook_secret text,
  add column if not exists last_connected_at timestamp with time zone,
  add column if not exists cash_register_code text,
  add column if not exists branch_id uuid references branches(id) on delete set null;

-- Mở rộng provider enum
alter table einvoice_configs drop constraint if exists einvoice_configs_provider_check;
alter table einvoice_configs add constraint einvoice_configs_provider_check
  check (provider in (
    'vnpt', 'viettel', 'misa', 'mobifone', 'easyinvoice',
    'sinvoice', 'bkav', 'cyberbill', 'manual', 'demo', 'custom'
  ));

alter table einvoice_configs drop constraint if exists einvoice_configs_environment_check;
alter table einvoice_configs add constraint einvoice_configs_environment_check
  check (environment in ('sandbox', 'production'));

create index if not exists idx_einvoice_configs_branch on einvoice_configs(branch_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Bảng invoice_items — chi tiết hàng hóa/dịch vụ trên hóa đơn
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists invoice_items (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid references invoices(id) on delete cascade not null,
  order_item_id uuid references order_items(id) on delete set null,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  sku text,
  unit text default 'Cái',
  quantity numeric(10,3) not null default 1,
  unit_price numeric(14,2) not null default 0,
  discount_amount numeric(14,2) default 0,
  tax_rate numeric(5,2) default 0,
  tax_amount numeric(14,2) default 0,
  line_total numeric(14,2) not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_invoice_items_invoice on invoice_items(invoice_id);
create index if not exists idx_invoice_items_product on invoice_items(product_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Bảng invoice_logs — audit trail đầy đủ mọi thao tác hóa đơn
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists invoice_logs (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references organizations(id) on delete cascade not null,
  invoice_id uuid references invoices(id) on delete cascade not null,
  action text not null,
  -- action values: 'issue', 'cancel', 'adjust', 'replace', 'sync',
  --                'retry', 'webhook_received', 'email_sent', 'status_changed'
  status_before text,
  status_after text,
  message text,
  request_payload jsonb,
  response_payload jsonb,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default now()
);

create index if not exists idx_invoice_logs_invoice on invoice_logs(invoice_id);
create index if not exists idx_invoice_logs_tenant on invoice_logs(tenant_id);
create index if not exists idx_invoice_logs_created_at on invoice_logs(created_at desc);
create index if not exists idx_invoice_logs_action on invoice_logs(action);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Bảng invoice_webhook_events — nhận callback từ nhà cung cấp
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists invoice_webhook_events (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references organizations(id) on delete cascade,
  provider_name text not null,
  event_type text not null,
  invoice_id uuid references invoices(id) on delete set null,
  external_invoice_id text,
  payload jsonb default '{}'::jsonb,
  processed_at timestamp with time zone,
  status text default 'pending',
  error_message text,
  created_at timestamp with time zone default now()
);

alter table invoice_webhook_events drop constraint if exists invoice_webhook_events_status_check;
alter table invoice_webhook_events add constraint invoice_webhook_events_status_check
  check (status in ('pending', 'processed', 'failed', 'ignored'));

create index if not exists idx_webhook_events_tenant on invoice_webhook_events(tenant_id);
create index if not exists idx_webhook_events_invoice on invoice_webhook_events(invoice_id);
create index if not exists idx_webhook_events_status on invoice_webhook_events(status);
create index if not exists idx_webhook_events_provider on invoice_webhook_events(provider_name);
create index if not exists idx_webhook_events_created_at on invoice_webhook_events(created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Triggers updated_at
-- ─────────────────────────────────────────────────────────────────────────────
drop trigger if exists trg_invoice_items_updated on invoice_items;
create trigger trg_invoice_items_updated
  before update on invoice_items
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. RLS — Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────
alter table invoice_items enable row level security;
alter table invoice_logs enable row level security;
alter table invoice_webhook_events enable row level security;

-- invoice_items: member có thể xem, manager+ có thể modify
drop policy if exists "invoice_items_select" on invoice_items;
create policy "invoice_items_select" on invoice_items for select using (
  exists (
    select 1 from invoices i
    join organization_members om on om.organization_id = i.tenant_id
    where i.id = invoice_items.invoice_id
      and om.profile_id = auth.uid()
  )
  or auth.email() like '%@zpos.click'
);

drop policy if exists "invoice_items_modify" on invoice_items;
create policy "invoice_items_modify" on invoice_items for all using (
  exists (
    select 1 from invoices i
    join organization_members om on om.organization_id = i.tenant_id
    where i.id = invoice_items.invoice_id
      and om.profile_id = auth.uid()
      and om.role in ('owner', 'admin', 'manager')
  )
  or auth.email() like '%@zpos.click'
);

-- invoice_logs: tất cả member có thể đọc (read-only), system ghi
drop policy if exists "invoice_logs_select" on invoice_logs;
create policy "invoice_logs_select" on invoice_logs for select using (
  exists (
    select 1 from organization_members
    where organization_id = invoice_logs.tenant_id
      and profile_id = auth.uid()
  )
  or auth.email() like '%@zpos.click'
);

drop policy if exists "invoice_logs_insert" on invoice_logs;
create policy "invoice_logs_insert" on invoice_logs for insert with check (true);

-- invoice_webhook_events: chỉ admin+ mới được xem
drop policy if exists "webhook_events_select" on invoice_webhook_events;
create policy "webhook_events_select" on invoice_webhook_events for select using (
  exists (
    select 1 from organization_members
    where organization_id = invoice_webhook_events.tenant_id
      and profile_id = auth.uid()
      and role in ('owner', 'admin')
  )
  or auth.email() like '%@zpos.click'
);

drop policy if exists "webhook_events_insert" on invoice_webhook_events;
create policy "webhook_events_insert" on invoice_webhook_events for insert with check (true);

drop policy if exists "webhook_events_update" on invoice_webhook_events;
create policy "webhook_events_update" on invoice_webhook_events for update using (
  auth.email() like '%@zpos.click'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. RPC: log_invoice_action — ghi audit log từ server-side
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function log_invoice_action(
  p_tenant_id uuid,
  p_invoice_id uuid,
  p_action text,
  p_status_before text default null,
  p_status_after text default null,
  p_message text default null,
  p_request_payload jsonb default null,
  p_response_payload jsonb default null,
  p_created_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_log_id uuid;
begin
  insert into invoice_logs (
    tenant_id, invoice_id, action,
    status_before, status_after, message,
    request_payload, response_payload, created_by
  ) values (
    p_tenant_id, p_invoice_id, p_action,
    p_status_before, p_status_after, p_message,
    p_request_payload, p_response_payload, p_created_by
  )
  returning id into v_log_id;

  return v_log_id;
end $$;

grant execute on function log_invoice_action(uuid, uuid, text, text, text, text, jsonb, jsonb, uuid)
  to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. Realtime — enable cho invoice_logs để UI cập nhật tức thì
-- ─────────────────────────────────────────────────────────────────────────────
do $$
begin
  begin
    alter publication supabase_realtime add table invoice_logs;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table invoice_items;
  exception when duplicate_object then null;
  end;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. Thêm cột invoice_type vào orders nếu chưa có
-- ─────────────────────────────────────────────────────────────────────────────
alter table orders add column if not exists invoice_status text;
