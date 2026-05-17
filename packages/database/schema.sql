-- ZPOS Database Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Organizations (Tenants)
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  logo_url text,
  branding jsonb default '{}'::jsonb,
  subscription_plan text default 'free',
  subscription_status text default 'active',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. Branches
create table branches (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade not null,
  name text not null,
  address text,
  phone text,
  is_main_branch boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. Profiles (Users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  email text unique,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 4. Organization Members (RBAC)
create table organization_members (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade not null,
  profile_id uuid references profiles(id) on delete cascade not null,
  role text not null check (role in ('owner', 'admin', 'manager', 'staff')),
  created_at timestamp with time zone default now(),
  unique(organization_id, profile_id)
);

-- 5. Categories
create table categories (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade not null,
  name text not null,
  slug text not null,
  parent_id uuid references categories(id),
  created_at timestamp with time zone default now(),
  unique(organization_id, slug)
);

-- 6. Products
create table products (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade not null,
  category_id uuid references categories(id),
  name text not null,
  description text,
  image_url text,
  base_price decimal(12,2) default 0,
  sku text,
  barcode text,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 7. Product Variants
create table product_variants (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade not null,
  name text not null,
  sku text,
  barcode text,
  price decimal(12,2) default 0,
  cost_price decimal(12,2) default 0,
  attributes jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- 8. Inventory
create table inventory (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade not null,
  branch_id uuid references branches(id) on delete cascade not null,
  variant_id uuid references product_variants(id) on delete cascade not null,
  quantity int default 0,
  min_stock int default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(branch_id, variant_id)
);

-- 9. Customers
create table customers (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade not null,
  name text not null,
  email text,
  phone text,
  address text,
  loyalty_points int default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 10. Orders
create table orders (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade not null,
  branch_id uuid references branches(id) not null,
  customer_id uuid references customers(id),
  staff_id uuid references profiles(id),
  order_number text not null,
  status text default 'completed', -- completed, pending, cancelled, refund
  total_amount decimal(12,2) not null,
  discount_amount decimal(12,2) default 0,
  tax_amount decimal(12,2) default 0,
  payment_method text,
  created_at timestamp with time zone default now()
);

-- 11. Order Items
create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade not null,
  variant_id uuid references product_variants(id) not null,
  quantity int not null,
  unit_price decimal(12,2) not null,
  total_price decimal(12,2) not null,
  discount_amount decimal(12,2) default 0
);

-- Enable RLS
alter table organizations enable row level security;
alter table branches enable row level security;
alter table profiles enable row level security;
alter table organization_members enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table inventory enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Basic RLS Policies (Simplified for now)
-- Users can see their own profiles
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);

-- Users can view their own organization membership
create policy "Users can view own organization membership" on organization_members for select using (auth.uid() = profile_id);

-- Members can see their organization
create policy "Members can view organization" on organizations for select
using (exists (select 1 from organization_members where organization_id = organizations.id and profile_id = auth.uid()));

-- Members can see organization data
create policy "Members can view products" on products for select
using (exists (select 1 from organization_members where organization_id = products.organization_id and profile_id = auth.uid()));

-- ... and so on for other tables
