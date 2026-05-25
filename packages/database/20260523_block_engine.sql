alter table organizations
  add column if not exists storefront_theme text not null default 'minimal',
  add column if not exists storefront_features jsonb not null default '{}'::jsonb,
  add column if not exists storefront_custom_css text,
  add column if not exists storefront_custom_head text,
  add column if not exists storefront_block_whitelist jsonb not null default '[]'::jsonb;

create table if not exists storefront_block_overrides (
  tenant_id uuid not null references organizations(id) on delete cascade,
  block_type text not null,
  props jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (tenant_id, block_type)
);
alter table storefront_block_overrides enable row level security;
create policy "tenant_member_read" on storefront_block_overrides
  for select using (exists (select 1 from organization_members where organization_id = tenant_id and profile_id = auth.uid()));
create policy "tenant_member_write" on storefront_block_overrides
  for all using (exists (select 1 from organization_members where organization_id = tenant_id and profile_id = auth.uid()));

-- Validate features keys (whitelist enum)
alter table organizations add constraint storefront_features_keys check (
  storefront_features ?| array['blog','reviews','multi_currency','loyalty_points','booking','table_reservation','lookbook']
  or storefront_features = '{}'::jsonb
);
