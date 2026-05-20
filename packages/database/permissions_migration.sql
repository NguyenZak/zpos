-- ZPOS Role-Based Access Control (RBAC) Migration

-- Enable UUID extension if not exists
create extension if not exists "uuid-ossp";

-- 1. Create permissions table (System-wide dictionary of possible permissions)
create table if not exists permissions (
  id text primary key, -- same value as key for backwards compatibility
  key text unique, -- format: 'module.action' e.g. 'products.view'
  module text,
  action text,
  name text not null,
  group_name text not null, -- e.g. 'Dashboard', 'POS', 'Products', 'Inventory', 'Orders', 'Returns', 'Customers', 'Suppliers', 'Purchases', 'Finance', 'Staff', 'Reports', 'Settings', 'AI'
  description text,
  sort_order integer default 0,
  created_at timestamp with time zone default now()
);

alter table permissions add column if not exists key text;
alter table permissions add column if not exists module text;
alter table permissions add column if not exists action text;
alter table permissions add column if not exists sort_order integer default 0;
update permissions set key = id where key is null;
create unique index if not exists permissions_key_unique on permissions(key);

-- 2. Create roles table
create table if not exists roles (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade not null,
  name text not null,
  description text,
  is_system boolean default false, -- True for default roles (Owner, Manager, etc.)
  is_owner boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(organization_id, name)
);

-- 3. Create role_permissions junction table
create table if not exists role_permissions (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade not null,
  role_id uuid references roles(id) on delete cascade not null,
  permission_id text references permissions(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique(role_id, permission_id)
);

-- 4. Alter organization_members table to support custom roles
-- Add role_id column to map members to roles table
alter table organization_members add column if not exists role_id uuid references roles(id) on delete set null;
alter table organization_members add column if not exists user_id uuid;
alter table organization_members add column if not exists branch_id uuid;
alter table organization_members add column if not exists status text default 'active';

alter table roles add column if not exists is_owner boolean default false;

-- 5. Create audit_logs table
create table if not exists audit_logs (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade not null,
  profile_id uuid references profiles(id) on delete set null,
  action text not null, -- e.g. 'role.create', 'role.update', 'role.delete', 'permissions.update', 'member.role_assign'
  details jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security (RLS)
alter table permissions enable row level security;
alter table roles enable row level security;
alter table role_permissions enable row level security;
alter table audit_logs enable row level security;

-- Basic RLS Policies
-- Permissions table is readable by any authenticated user
create policy "Allow read access to all authenticated users" on permissions
  for select using (auth.role() = 'authenticated');

create or replace function public.member_has_permission(target_organization_id uuid, target_permission text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from organization_members om
    left join roles r on r.id = om.role_id
    left join role_permissions rp on rp.role_id = r.id
    left join permissions p on p.id = rp.permission_id
    where om.organization_id = target_organization_id
      and (om.profile_id = auth.uid() or om.user_id = auth.uid())
      and coalesce(om.status, 'active') = 'active'
      and (
        om.role = 'owner'
        or coalesce(r.is_owner, false) = true
        or p.id = target_permission
        or p.key = target_permission
      )
  );
$$;

-- Roles are scoped by organization_id
create policy "Users can view roles in their organization" on roles
  for select using (
    exists (
      select 1 from organization_members 
      where organization_members.organization_id = roles.organization_id 
      and organization_members.profile_id = auth.uid()
    )
  );

create policy "Owners and managers can manage roles" on roles
  for all using (
    exists (
      select 1 from organization_members 
      where organization_members.organization_id = roles.organization_id 
      and organization_members.profile_id = auth.uid()
      and (
        organization_members.role = 'owner'
        or public.member_has_permission(roles.organization_id, 'roles.manage')
      )
    )
  );

-- Role Permissions are scoped by organization_id
create policy "Users can view role permissions in their organization" on role_permissions
  for select using (
    exists (
      select 1 from organization_members 
      where organization_members.organization_id = role_permissions.organization_id 
      and organization_members.profile_id = auth.uid()
    )
  );

create policy "Owners and managers can manage role permissions" on role_permissions
  for all using (
    exists (
      select 1 from organization_members 
      where organization_members.organization_id = role_permissions.organization_id 
      and organization_members.profile_id = auth.uid()
      and (
        organization_members.role = 'owner'
        or public.member_has_permission(role_permissions.organization_id, 'roles.manage')
      )
    )
  );

-- Audit logs are scoped by organization_id
create policy "Users can view audit logs in their organization" on audit_logs
  for select using (
    exists (
      select 1 from organization_members 
      where organization_members.organization_id = audit_logs.organization_id 
      and organization_members.profile_id = auth.uid()
    )
  );

create policy "System can create audit logs" on audit_logs
  for insert with check (auth.role() = 'authenticated');


-- Seed standard permissions
insert into permissions (id, key, module, action, name, group_name, description, sort_order) values
  ('roles.view', 'roles.view', 'roles', 'view', 'Xem vai trò', 'Vai trò & Phân quyền', 'Xem danh sách vai trò và ma trận quyền', 10),
  ('roles.create', 'roles.create', 'roles', 'create', 'Tạo vai trò', 'Vai trò & Phân quyền', 'Tạo vai trò tùy chỉnh cho tổ chức', 11),
  ('roles.update', 'roles.update', 'roles', 'update', 'Cập nhật vai trò', 'Vai trò & Phân quyền', 'Đổi tên, mô tả và cấu hình vai trò', 12),
  ('roles.delete', 'roles.delete', 'roles', 'delete', 'Xóa vai trò', 'Vai trò & Phân quyền', 'Xóa vai trò tùy chỉnh. Owner không thể bị xóa.', 13),
  ('roles.manage', 'roles.manage', 'roles', 'manage', 'Quản lý ma trận phân quyền', 'Vai trò & Phân quyền', 'Tick/untick và lưu ma trận quyền cho vai trò', 14),

  ('products.view', 'products.view', 'products', 'view', 'View products', 'Sản phẩm', 'View product list and product details', 100),
  ('products.create', 'products.create', 'products', 'create', 'Create products', 'Sản phẩm', 'Create new products', 101),
  ('products.update', 'products.update', 'products', 'update', 'Update products', 'Sản phẩm', 'Update product information', 102),
  ('products.delete', 'products.delete', 'products', 'delete', 'Delete products', 'Sản phẩm', 'Delete products from catalog', 103),
  ('products.import', 'products.import', 'products', 'import', 'Import products', 'Sản phẩm', 'Import products from spreadsheet', 104),
  ('products.export', 'products.export', 'products', 'export', 'Export products', 'Sản phẩm', 'Export product data', 105),
  ('products.barcode.update', 'products.barcode.update', 'products', 'barcode.update', 'Update barcode', 'Sản phẩm', 'Update product barcode', 106),
  ('products.price.update', 'products.price.update', 'products', 'price.update', 'Update price', 'Sản phẩm', 'Update product selling price', 107),

  ('inventory.view', 'inventory.view', 'inventory', 'view', 'View inventory', 'Tồn kho', 'View stock levels by branch', 200),
  ('inventory.stock_in', 'inventory.stock_in', 'inventory', 'stock_in', 'Stock in', 'Tồn kho', 'Receive stock into inventory', 201),
  ('inventory.stock_out', 'inventory.stock_out', 'inventory', 'stock_out', 'Stock out', 'Tồn kho', 'Record stock leaving inventory', 202),
  ('inventory.transfer', 'inventory.transfer', 'inventory', 'transfer', 'Transfer stock', 'Tồn kho', 'Transfer stock between branches', 203),
  ('inventory.adjust', 'inventory.adjust', 'inventory', 'adjust', 'Adjust stock', 'Tồn kho', 'Manually adjust stock with reason', 204),
  ('inventory.count', 'inventory.count', 'inventory', 'count', 'Count stock', 'Tồn kho', 'Run stock counts and reconcile inventory', 205),
  ('inventory.export', 'inventory.export', 'inventory', 'export', 'Export inventory', 'Tồn kho', 'Export inventory reports', 206),

  ('orders.view', 'orders.view', 'orders', 'view', 'View orders', 'Đơn hàng', 'View order list and details', 300),
  ('orders.create', 'orders.create', 'orders', 'create', 'Create orders', 'Đơn hàng', 'Create new orders', 301),
  ('orders.update', 'orders.update', 'orders', 'update', 'Update orders', 'Đơn hàng', 'Update existing orders', 302),
  ('orders.cancel', 'orders.cancel', 'orders', 'cancel', 'Cancel orders', 'Đơn hàng', 'Cancel completed or pending orders', 303),
  ('orders.refund', 'orders.refund', 'orders', 'refund', 'Refund orders', 'Đơn hàng', 'Refund order payments', 304),
  ('orders.print', 'orders.print', 'orders', 'print', 'Print invoices', 'Đơn hàng', 'Print or download invoices', 305),
  ('orders.export', 'orders.export', 'orders', 'export', 'Export orders', 'Đơn hàng', 'Export order data', 306),

  ('finance.expenses.view', 'finance.expenses.view', 'finance', 'expenses.view', 'View expenses', 'Tài chính', 'View business expenses', 400),
  ('finance.expenses.create', 'finance.expenses.create', 'finance', 'expenses.create', 'Create expenses', 'Tài chính', 'Create expense records', 401),
  ('finance.expenses.update', 'finance.expenses.update', 'finance', 'expenses.update', 'Update expenses', 'Tài chính', 'Update expense records', 402),
  ('finance.expenses.delete', 'finance.expenses.delete', 'finance', 'expenses.delete', 'Delete expenses', 'Tài chính', 'Delete expense records', 403),
  ('finance.expenses.approve', 'finance.expenses.approve', 'finance', 'expenses.approve', 'Approve expenses', 'Tài chính', 'Approve submitted expenses', 404),
  ('finance.profit.view', 'finance.profit.view', 'finance', 'profit.view', 'View profit & loss', 'Tài chính', 'View profit and loss reports', 405),
  ('finance.cashflow.view', 'finance.cashflow.view', 'finance', 'cashflow.view', 'View cashflow', 'Tài chính', 'View cashflow reports', 406),
  ('finance.reports.export', 'finance.reports.export', 'finance', 'reports.export', 'Export finance reports', 'Tài chính', 'Export finance reports', 407),

  ('staff.view', 'staff.view', 'staff', 'view', 'View staff', 'Nhân viên', 'View organization staff', 500),
  ('staff.create', 'staff.create', 'staff', 'create', 'Create staff', 'Nhân viên', 'Create staff accounts', 501),
  ('staff.update', 'staff.update', 'staff', 'update', 'Update staff', 'Nhân viên', 'Update staff details', 502),
  ('staff.disable', 'staff.disable', 'staff', 'disable', 'Disable staff', 'Nhân viên', 'Disable staff accounts', 503),
  ('staff.assign_role', 'staff.assign_role', 'staff', 'assign_role', 'Assign role', 'Nhân viên', 'Assign roles to staff', 504),
  ('staff.permissions.manage', 'staff.permissions.manage', 'staff', 'permissions.manage', 'Legacy manage permissions alias', 'Nhân viên', 'Legacy alias for role and permission management', 505),

  ('settings.view', 'settings.view', 'settings', 'view', 'View settings', 'Cài đặt', 'View system settings', 600),
  ('settings.business.update', 'settings.business.update', 'settings', 'business.update', 'Update business settings', 'Cài đặt', 'Update business profile and tax information', 601),
  ('settings.branch.update', 'settings.branch.update', 'settings', 'branch.update', 'Update branch settings', 'Cài đặt', 'Update branch and register settings', 602),
  ('settings.printer.update', 'settings.printer.update', 'settings', 'printer.update', 'Update printer settings', 'Cài đặt', 'Update receipt and kitchen printer settings', 603),
  ('settings.billing.update', 'settings.billing.update', 'settings', 'billing.update', 'Update billing settings', 'Cài đặt', 'Update subscription and billing settings', 604),

  ('dashboard.view', 'dashboard.view', 'dashboard', 'view', 'Xem tổng quan báo cáo', 'Dashboard', 'Xem bảng số liệu kinh doanh, doanh số và doanh thu tổng quan', 1),
  
  ('pos.access', 'pos.access', 'pos', 'access', 'Truy cập màn hình POS', 'POS', 'Truy cập và xem màn hình bán hàng tại quầy', 50),
  ('pos.sell', 'pos.sell', 'pos', 'sell', 'Tạo đơn hàng POS', 'POS', 'Thanh toán đơn hàng và in hóa đơn tại quầy', 51),
  
  ('reports.dashboard.view', 'reports.dashboard.view', 'reports', 'dashboard.view', 'Xem báo cáo chi tiết', 'Báo cáo', 'Xem báo cáo doanh thu, sản phẩm bán chạy, báo cáo kho chi tiết', 700),
  ('ai.chat', 'ai.chat', 'ai', 'chat', 'Sử dụng trợ lý AI', 'AI', 'Sử dụng chatbot AI và trợ lý giọng nói để phân tích, hỗ trợ vận hành', 800)
on conflict (id) do update set
  key = excluded.key,
  module = excluded.module,
  action = excluded.action,
  name = excluded.name,
  group_name = excluded.group_name,
  description = excluded.description,
  sort_order = excluded.sort_order;
