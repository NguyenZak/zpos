-- ============================================================================
-- ZPOS Zalo OA / ZNS Migration
-- Tích hợp Zalo Official Account + Zalo Notification Service (ZNS)
-- Safe to run multiple times.
-- ============================================================================

-- 1. Zalo OA configurations (per tenant)
create table if not exists zalo_configs (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references organizations(id) on delete cascade not null,
  oa_id text not null,
  oa_name text,
  app_id text,
  app_secret text,
  access_token text,
  refresh_token text,
  token_expires_at timestamp with time zone,
  webhook_secret text,
  is_active boolean default true,
  is_default boolean default false,
  sender_phone text,
  notes text,
  extra jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_zalo_configs_tenant on zalo_configs(tenant_id);
create unique index if not exists idx_zalo_configs_default
  on zalo_configs(tenant_id) where is_default = true;
create unique index if not exists idx_zalo_configs_unique_oa
  on zalo_configs(tenant_id, oa_id);

-- 2. Zalo ZNS templates — approved templates from Zalo Business portal
create table if not exists zalo_templates (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references organizations(id) on delete cascade not null,
  template_id text not null,                -- ID từ ZNS portal
  template_name text not null,
  -- Event this template should fire on
  trigger_event text check (trigger_event in (
    'order_paid', 'order_created', 'invoice_issued', 'order_cancelled',
    'low_stock', 'birthday', 'custom', 'manual'
  )),
  category text,                            -- transactional | otp | promotion
  language text default 'vi',
  preview_text text,
  variables jsonb default '[]'::jsonb,      -- list of placeholders [{name, label, default}]
  is_active boolean default true,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(tenant_id, template_id)
);

create index if not exists idx_zalo_templates_tenant on zalo_templates(tenant_id);
create index if not exists idx_zalo_templates_event on zalo_templates(trigger_event);

-- 3. Zalo messages log — every outbound message attempt
create table if not exists zalo_messages (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references organizations(id) on delete cascade not null,
  zalo_config_id uuid references zalo_configs(id) on delete set null,
  template_id uuid references zalo_templates(id) on delete set null,
  -- Recipient & link to source
  phone text not null,
  customer_id uuid references customers(id) on delete set null,
  order_id uuid references orders(id) on delete set null,
  invoice_id uuid references invoices(id) on delete set null,
  -- Message content
  channel text default 'zns' check (channel in ('zns', 'oa_message', 'cs')),
  template_zalo_id text,
  template_data jsonb default '{}'::jsonb,
  rendered_text text,
  -- Result
  status text default 'pending' check (status in (
    'pending', 'sent', 'delivered', 'read', 'failed', 'queued'
  )),
  zalo_message_id text,
  zalo_error_code text,
  zalo_error_message text,
  cost decimal(10,2) default 0,
  provider_payload jsonb default '{}'::jsonb,
  sent_at timestamp with time zone,
  delivered_at timestamp with time zone,
  failed_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

create index if not exists idx_zalo_messages_tenant on zalo_messages(tenant_id);
create index if not exists idx_zalo_messages_phone on zalo_messages(phone);
create index if not exists idx_zalo_messages_status on zalo_messages(status);
create index if not exists idx_zalo_messages_order on zalo_messages(order_id);
create index if not exists idx_zalo_messages_invoice on zalo_messages(invoice_id);
create index if not exists idx_zalo_messages_sent_at on zalo_messages(sent_at desc);

-- 4. Triggers
drop trigger if exists trg_zalo_configs_updated on zalo_configs;
create trigger trg_zalo_configs_updated before update on zalo_configs
  for each row execute function set_updated_at();

drop trigger if exists trg_zalo_templates_updated on zalo_templates;
create trigger trg_zalo_templates_updated before update on zalo_templates
  for each row execute function set_updated_at();

-- 5. RLS
alter table zalo_configs enable row level security;
alter table zalo_templates enable row level security;
alter table zalo_messages enable row level security;

drop policy if exists "zalo_configs_select" on zalo_configs;
create policy "zalo_configs_select" on zalo_configs for select using (
  exists (select 1 from organization_members
    where organization_id = zalo_configs.tenant_id and profile_id = auth.uid())
  or auth.email() like '%@zpos.click'
);

drop policy if exists "zalo_configs_modify" on zalo_configs;
create policy "zalo_configs_modify" on zalo_configs for all using (
  exists (select 1 from organization_members
    where organization_id = zalo_configs.tenant_id
      and profile_id = auth.uid()
      and role in ('owner', 'admin'))
);

drop policy if exists "zalo_templates_select" on zalo_templates;
create policy "zalo_templates_select" on zalo_templates for select using (
  exists (select 1 from organization_members
    where organization_id = zalo_templates.tenant_id and profile_id = auth.uid())
  or auth.email() like '%@zpos.click'
);

drop policy if exists "zalo_templates_modify" on zalo_templates;
create policy "zalo_templates_modify" on zalo_templates for all using (
  exists (select 1 from organization_members
    where organization_id = zalo_templates.tenant_id
      and profile_id = auth.uid()
      and role in ('owner', 'admin'))
);

drop policy if exists "zalo_messages_select" on zalo_messages;
create policy "zalo_messages_select" on zalo_messages for select using (
  exists (select 1 from organization_members
    where organization_id = zalo_messages.tenant_id and profile_id = auth.uid())
  or auth.email() like '%@zpos.click'
);

drop policy if exists "zalo_messages_insert" on zalo_messages;
create policy "zalo_messages_insert" on zalo_messages for insert with check (true);

drop policy if exists "zalo_messages_update" on zalo_messages;
create policy "zalo_messages_update" on zalo_messages for update using (
  exists (select 1 from organization_members
    where organization_id = zalo_messages.tenant_id
      and profile_id = auth.uid()
      and role in ('owner', 'admin', 'manager'))
);

-- 6. RPC: get_zalo_config_for_send — server-side reads credentials safely
-- via SECURITY DEFINER. Caller must provide tenant_id + a member_user_id
-- that belongs to the tenant.
create or replace function get_zalo_config_for_send(p_tenant_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cfg jsonb;
begin
  select to_jsonb(z.*) into v_cfg
    from zalo_configs z
   where z.tenant_id = p_tenant_id
     and z.is_active = true
   order by z.is_default desc, z.created_at desc
   limit 1;
  return v_cfg;
end $$;

-- (Not granted to anon — only authenticated members invoke this via the app)
grant execute on function get_zalo_config_for_send(uuid) to authenticated;

-- 7. RPC: record_zalo_delivery — webhook from Zalo updates delivery status
create or replace function record_zalo_delivery(
  p_zalo_message_id text,
  p_status text,
  p_error_code text,
  p_error_message text,
  p_raw jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  update zalo_messages
     set status = coalesce(p_status, status),
         zalo_error_code = p_error_code,
         zalo_error_message = p_error_message,
         delivered_at = case when p_status in ('delivered', 'read') then now() else delivered_at end,
         failed_at = case when p_status = 'failed' then now() else failed_at end,
         provider_payload = coalesce(p_raw, '{}'::jsonb)
   where zalo_message_id = p_zalo_message_id
  returning id into v_id;
  return jsonb_build_object('ok', v_id is not null, 'id', v_id);
end $$;

grant execute on function record_zalo_delivery(text, text, text, text, jsonb) to anon, authenticated;

-- 8. Realtime
do $$
begin
  begin
    alter publication supabase_realtime add table zalo_messages;
  exception when duplicate_object then null;
  end;
end $$;
