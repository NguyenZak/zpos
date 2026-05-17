-- ZPOS Role-Based Access Control (RBAC) Migration

-- Enable UUID extension if not exists
create extension if not exists "uuid-ossp";

-- 1. Create permissions table (System-wide dictionary of possible permissions)
create table if not exists permissions (
  id text primary key, -- format: 'group.action' e.g. 'products.view'
  name text not null,
  group_name text not null, -- e.g. 'Dashboard', 'POS', 'Products', 'Inventory', 'Orders', 'Returns', 'Customers', 'Suppliers', 'Purchases', 'Finance', 'Staff', 'Reports', 'Settings', 'AI'
  description text,
  created_at timestamp with time zone default now()
);

-- 2. Create roles table
create table if not exists roles (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade not null,
  name text not null,
  description text,
  is_system boolean default false, -- True for default roles (Owner, Manager, etc.)
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
      and organization_members.role in ('owner', 'admin')
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
      and organization_members.role in ('owner', 'admin')
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
insert into permissions (id, name, group_name, description) values
  ('dashboard.view', 'Xem tổng quan báo cáo', 'Dashboard', 'Xem bảng số liệu kinh doanh, doanh số và doanh thu tổng quan'),
  
  ('pos.view', 'Truy cập màn hình POS', 'POS', 'Truy cập và xem màn hình bán hàng tại quầy'),
  ('pos.create', 'Tạo đơn hàng POS', 'POS', 'Thanh toán đơn hàng và in hóa đơn tại quầy'),
  
  ('products.view', 'Xem danh sách sản phẩm', 'Products', 'Xem thông tin sản phẩm và phân loại danh mục'),
  ('products.manage', 'Quản lý sản phẩm', 'Products', 'Tạo mới, chỉnh sửa, xóa sản phẩm và phân loại danh mục'),
  
  ('inventory.view', 'Xem tồn kho', 'Inventory', 'Theo dõi số lượng hàng tồn, lịch sử nhập xuất của các chi nhánh'),
  ('inventory.manage', 'Quản lý tồn kho', 'Inventory', 'Điều chỉnh số lượng kho, thiết lập định mức tồn kho tối thiểu'),
  
  ('orders.view', 'Xem danh sách hóa đơn', 'Orders', 'Xem lịch sử hóa đơn bán lẻ của cửa hàng'),
  ('orders.manage', 'Quản lý hóa đơn', 'Orders', 'Hủy hóa đơn, xử lý hoàn tiền hóa đơn'),
  
  ('returns.view', 'Xem danh sách trả hàng', 'Returns', 'Xem danh sách phiếu trả hàng từ khách hàng'),
  ('returns.manage', 'Quản lý trả hàng', 'Returns', 'Tạo và duyệt phiếu trả hàng, hoàn tiền, thu hồi kho'),
  
  ('customers.view', 'Xem khách hàng', 'Customers', 'Xem thông tin khách hàng thành viên, điểm tích lũy'),
  ('customers.manage', 'Quản lý khách hàng', 'Customers', 'Tạo mới, sửa thông tin, xóa khách hàng và quản lý công nợ'),
  
  ('suppliers.view', 'Xem nhà cung cấp', 'Suppliers', 'Xem thông tin danh bạ nhà cung cấp hàng hóa'),
  ('suppliers.manage', 'Quản lý nhà cung cấp', 'Suppliers', 'Tạo mới, sửa đổi thông tin, xóa nhà cung cấp'),
  
  ('purchases.view', 'Xem đơn nhập hàng', 'Purchases', 'Xem danh sách đơn đặt hàng từ nhà cung cấp và nhập kho'),
  ('purchases.manage', 'Quản lý nhập hàng', 'Purchases', 'Tạo đơn đặt hàng nhập, thực hiện nhận hàng, nhập kho'),
  
  ('finance.view', 'Xem tài chính', 'Finance', 'Xem dòng tiền, lợi nhuận, chi phí của doanh nghiệp'),
  ('finance.manage', 'Quản lý tài chính', 'Finance', 'Ghi nhận chi phí, bảng lương nhân viên, thu chi dòng tiền'),
  
  ('staff.view', 'Xem danh sách nhân viên', 'Staff', 'Xem thông tin và liên hệ của các nhân viên trong tổ chức'),
  ('staff.manage', 'Quản lý tài khoản nhân viên', 'Staff', 'Tạo mới, cập nhật thông tin và khóa tài khoản nhân viên'),
  ('staff.permissions.manage', 'Quản lý phân quyền', 'Staff', 'Tạo vai trò tùy chỉnh và gán quyền hạn truy cập cho các vai trò'),
  
  ('reports.view', 'Xem báo cáo chi tiết', 'Reports', 'Xem báo cáo doanh thu, sản phẩm bán chạy, báo cáo kho chi tiết'),
  
  ('settings.view', 'Xem thiết lập', 'Settings', 'Xem thông tin cấu hình cửa hàng, chi nhánh'),
  ('settings.manage', 'Quản lý thiết lập', 'Settings', 'Thay đổi cấu hình hệ thống, thông tin doanh nghiệp, thuế suất'),
  
  ('ai.view', 'Sử dụng trợ lý AI', 'AI', 'Sử dụng chatbot AI và trợ lý giọng nói để phân tích, hỗ trợ vận hành')
on conflict (id) do update set
  name = excluded.name,
  group_name = excluded.group_name,
  description = excluded.description;
