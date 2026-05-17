import { createClient } from "@/utils/supabase/client";

export interface Permission {
  id: string;
  name: string;
  group_name: string;
  description: string;
}

export interface Role {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  is_system: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RolePermission {
  id: string;
  organization_id: string;
  role_id: string;
  permission_id: string;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  profile_id?: string;
  action: string;
  details: any;
  created_at: string;
  profile?: {
    full_name: string;
    email: string;
  };
}

export const DEFAULT_PERMISSIONS: Permission[] = [
  { id: 'dashboard.view', name: 'Xem tổng quan báo cáo', group_name: 'Dashboard', description: 'Xem bảng số liệu kinh doanh, doanh số và doanh thu tổng quan' },
  
  { id: 'pos.view', name: 'Truy cập màn hình POS', group_name: 'POS', description: 'Truy cập và xem màn hình bán hàng tại quầy' },
  { id: 'pos.create', name: 'Tạo đơn hàng POS', group_name: 'POS', description: 'Thanh toán đơn hàng và in hóa đơn tại quầy' },
  
  { id: 'products.view', name: 'Xem danh sách sản phẩm', group_name: 'Products', description: 'Xem thông tin sản phẩm và phân loại danh mục' },
  { id: 'products.manage', name: 'Quản lý sản phẩm', group_name: 'Products', description: 'Tạo mới, chỉnh sửa, xóa sản phẩm và phân loại danh mục' },
  
  { id: 'inventory.view', name: 'Xem tồn kho', group_name: 'Inventory', description: 'Theo dõi số lượng hàng tồn, lịch sử nhập xuất của các chi nhánh' },
  { id: 'inventory.manage', name: 'Quản lý tồn kho', group_name: 'Inventory', description: 'Điều chỉnh số lượng kho, thiết lập định mức tồn kho tối thiểu' },
  
  { id: 'orders.view', name: 'Xem danh sách hóa đơn', group_name: 'Orders', description: 'Xem lịch sử hóa đơn bán lẻ của cửa hàng' },
  { id: 'orders.manage', name: 'Quản lý hóa đơn', group_name: 'Orders', description: 'Hủy hóa đơn, xử lý hoàn tiền hóa đơn' },
  
  { id: 'returns.view', name: 'Xem danh sách trả hàng', group_name: 'Returns', description: 'Xem danh sách phiếu trả hàng từ khách hàng' },
  { id: 'returns.manage', name: 'Quản lý trả hàng', group_name: 'Returns', description: 'Tạo và duyệt phiếu trả hàng, hoàn tiền, thu hồi kho' },
  
  { id: 'customers.view', name: 'Xem khách hàng', group_name: 'Customers', description: 'Xem thông tin khách hàng thành viên, điểm tích lũy' },
  { id: 'customers.manage', name: 'Quản lý khách hàng', group_name: 'Customers', description: 'Tạo mới, sửa thông tin, xóa khách hàng và quản lý công nợ' },
  
  { id: 'suppliers.view', name: 'Xem nhà cung cấp', group_name: 'Suppliers', description: 'Xem thông tin danh bạ nhà cung cấp hàng hóa' },
  { id: 'suppliers.manage', name: 'Quản lý nhà cung cấp', group_name: 'Suppliers', description: 'Tạo mới, sửa đổi thông tin, xóa nhà cung cấp' },
  
  { id: 'purchases.view', name: 'Xem đơn nhập hàng', group_name: 'Purchases', description: 'Xem danh sách đơn đặt hàng từ nhà cung cấp và nhập kho' },
  { id: 'purchases.manage', name: 'Quản lý nhập hàng', group_name: 'Purchases', description: 'Tạo đơn đặt hàng nhập, thực hiện nhận hàng, nhập kho' },
  
  { id: 'finance.view', name: 'Xem tài chính', group_name: 'Finance', description: 'Xem dòng tiền, lợi nhuận, chi phí của doanh nghiệp' },
  { id: 'finance.manage', name: 'Quản lý tài chính', group_name: 'Finance', description: 'Ghi nhận chi phí, bảng lương nhân viên, thu chi dòng tiền' },
  
  { id: 'staff.view', name: 'Xem danh sách nhân viên', group_name: 'Staff', description: 'Xem thông tin và liên hệ của các nhân viên trong tổ chức' },
  { id: 'staff.manage', name: 'Quản lý tài khoản nhân viên', group_name: 'Staff', description: 'Tạo mới, cập nhật thông tin và khóa tài khoản nhân viên' },
  { id: 'staff.permissions.manage', name: 'Quản lý phân quyền', group_name: 'Staff', description: 'Tạo vai trò tùy chỉnh và gán quyền hạn truy cập cho các vai trò' },
  
  { id: 'reports.view', name: 'Xem báo cáo chi tiết', group_name: 'Reports', description: 'Xem báo cáo doanh thu, sản phẩm bán chạy, báo cáo kho chi tiết' },
  
  { id: 'settings.view', name: 'Xem thiết lập', group_name: 'Settings', description: 'Xem thông tin cấu hình cửa hàng, chi nhánh' },
  { id: 'settings.manage', name: 'Quản lý thiết lập', group_name: 'Settings', description: 'Thay đổi cấu hình hệ thống, thông tin doanh nghiệp, thuế suất' },
  
  { id: 'ai.view', name: 'Sử dụng trợ lý AI', group_name: 'AI', description: 'Sử dụng chatbot AI và trợ lý giọng nói để phân tích, hỗ trợ vận hành' }
];

export const DEFAULT_ROLES_PERMISSIONS: Record<string, string[]> = {
  'Owner': DEFAULT_PERMISSIONS.map(p => p.id),
  'Manager': [
    'dashboard.view', 'pos.view', 'pos.create', 'products.view', 'products.manage',
    'inventory.view', 'inventory.manage', 'orders.view', 'orders.manage',
    'returns.view', 'returns.manage', 'customers.view', 'customers.manage',
    'suppliers.view', 'suppliers.manage', 'purchases.view', 'purchases.manage',
    'finance.view', 'staff.view', 'reports.view', 'settings.view', 'ai.view'
  ],
  'Cashier': [
    'dashboard.view', 'pos.view', 'pos.create', 'orders.view', 'customers.view', 'customers.manage'
  ],
  'Warehouse Staff': [
    'products.view', 'inventory.view', 'inventory.manage', 'suppliers.view', 'purchases.view', 'purchases.manage'
  ],
  'Accountant': [
    'dashboard.view', 'orders.view', 'purchases.view', 'finance.view', 'finance.manage', 'reports.view'
  ]
};

// Local storage key prefix
const STORAGE_PREFIX = "zpos_rbac_";

export const permissionService = {
  async getActiveOrgId(): Promise<string> {
    const supabase = createClient();
    try {
      const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
      if (orgs && orgs.length > 0) return orgs[0].id;
    } catch {}
    return '00000000-0000-0000-0000-000000000000'; // fallback
  },

  async getActiveUserId(): Promise<string> {
    const supabase = createClient();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) return user.id;
      
      const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
      if (profiles && profiles.length > 0) return profiles[0].id;
    } catch {}
    return '00000000-0000-0000-0000-000000000000'; // fallback
  },

  // Check if table missing error
  isTableMissingError(error: any): boolean {
    return error && (error.code === '42P01' || String(error.message).includes("does not exist") || String(error.message).includes("relation"));
  },

  // 1. Roles management
  async getRoles(): Promise<Role[]> {
    const supabase = createClient();
    const orgId = await this.getActiveOrgId();
    
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('organization_id', orgId);
        
      if (error) {
        if (this.isTableMissingError(error)) return this.getLocalRoles(orgId);
        throw error;
      }
      
      if (!data || data.length === 0) {
        // Automatically seed default roles
        return await this.seedDefaultRoles(orgId);
      }
      
      return data;
    } catch (e) {
      console.warn("Supabase getRoles error, returning local:", e);
      return this.getLocalRoles(orgId);
    }
  },

  async getRole(id: string): Promise<Role | null> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        if (this.isTableMissingError(error)) return this.getLocalRole(id);
        throw error;
      }
      return data;
    } catch (e) {
      return this.getLocalRole(id);
    }
  },

  async createRole(name: string, description: string): Promise<Role> {
    const supabase = createClient();
    const orgId = await this.getActiveOrgId();
    const profileId = await this.getActiveUserId();
    
    const rolePayload = {
      organization_id: orgId,
      name,
      description,
      is_system: false
    };

    try {
      const { data, error } = await supabase
        .from('roles')
        .insert([rolePayload])
        .select()
        .single();
        
      if (error) {
        if (this.isTableMissingError(error)) return this.createLocalRole(rolePayload);
        throw error;
      }

      await this.createAuditLog(orgId, profileId, 'role.create', { name, description, role_id: data.id });
      return data;
    } catch (e) {
      const role = this.createLocalRole(rolePayload);
      await this.createAuditLog(orgId, profileId, 'role.create', { name, description, role_id: role.id });
      return role;
    }
  },

  async updateRole(roleId: string, name: string, description: string, permissionIds: string[]): Promise<Role> {
    const supabase = createClient();
    const orgId = await this.getActiveOrgId();
    const profileId = await this.getActiveUserId();

    const role = await this.getRole(roleId);
    if (role?.is_system && role.name === 'Owner') {
      // Owner permission check: Owner permissions cannot be modified
      throw new Error("Không thể thay đổi quyền hạn của chủ doanh nghiệp (Owner)");
    }

    try {
      const { data, error } = await supabase
        .from('roles')
        .update({ name, description, updated_at: new Date().toISOString() })
        .eq('id', roleId)
        .select()
        .single();
        
      if (error) {
        if (this.isTableMissingError(error)) return this.updateLocalRole(roleId, name, description, permissionIds);
        throw error;
      }

      // Update role permissions
      // First, delete old ones
      await supabase.from('role_permissions').delete().eq('role_id', roleId);
      // Insert new ones
      if (permissionIds.length > 0) {
        const rpPayloads = permissionIds.map(pId => ({
          organization_id: orgId,
          role_id: roleId,
          permission_id: pId
        }));
        await supabase.from('role_permissions').insert(rpPayloads);
      }

      await this.createAuditLog(orgId, profileId, 'role.update', { role_id: roleId, name, permissions_count: permissionIds.length });
      return data;
    } catch (e) {
      const updated = this.updateLocalRole(roleId, name, description, permissionIds);
      await this.createAuditLog(orgId, profileId, 'role.update', { role_id: roleId, name, permissions_count: permissionIds.length });
      return updated;
    }
  },

  async deleteRole(roleId: string): Promise<boolean> {
    const supabase = createClient();
    const orgId = await this.getActiveOrgId();
    const profileId = await this.getActiveUserId();

    const role = await this.getRole(roleId);
    if (role?.is_system) {
      throw new Error("Không thể xóa vai trò hệ thống mặc định");
    }

    try {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId);
        
      if (error) {
        if (this.isTableMissingError(error)) return this.deleteLocalRole(roleId);
        throw error;
      }

      await this.createAuditLog(orgId, profileId, 'role.delete', { role_id: roleId, name: role?.name });
      return true;
    } catch (e) {
      this.deleteLocalRole(roleId);
      await this.createAuditLog(orgId, profileId, 'role.delete', { role_id: roleId, name: role?.name });
      return true;
    }
  },

  // 2. Permissions management
  async getPermissions(): Promise<Permission[]> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('group_name');
        
      if (error) {
        if (this.isTableMissingError(error)) return DEFAULT_PERMISSIONS;
        throw error;
      }
      return data && data.length > 0 ? data : DEFAULT_PERMISSIONS;
    } catch {
      return DEFAULT_PERMISSIONS;
    }
  },

  async getRolePermissions(roleId: string): Promise<string[]> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('permission_id')
        .eq('role_id', roleId);
        
      if (error) {
        if (this.isTableMissingError(error)) return this.getLocalRolePermissions(roleId);
        throw error;
      }
      return data.map(item => item.permission_id);
    } catch {
      return this.getLocalRolePermissions(roleId);
    }
  },

  // 3. User Permission Checking & Mapping
  async getCurrentMemberRoleAndPermissions(): Promise<{ role: string; roleId: string | null; permissions: string[] }> {
    const supabase = createClient();
    const orgId = await this.getActiveOrgId();
    
    try {
      // Find current user session (Check Supabase Auth first, fallback to Local Mock User)
      let currentUser: any = null;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        currentUser = user;
      } else if (typeof window !== 'undefined') {
        const mockData = localStorage.getItem("zpos_mock_user");
        if (mockData) {
          currentUser = JSON.parse(mockData);
        }
      }

      if (!currentUser) {
        // Fallback for anonymous demo session
        return { role: 'owner', roleId: null, permissions: DEFAULT_PERMISSIONS.map(p => p.id) };
      }

      // If mock user has super_admin global role, give them owner rights
      if (currentUser.global_role === 'super_admin') {
        return { role: 'owner', roleId: null, permissions: DEFAULT_PERMISSIONS.map(p => p.id) };
      }

      // If mock user has associated_tenant, resolve their mock role
      if (currentUser.associated_tenant) {
        const mockRole = currentUser.global_role === 'tenant_owner' ? 'owner' : (currentUser.global_role || 'staff');
        const matchedDefaultKey = Object.keys(DEFAULT_ROLES_PERMISSIONS).find(
          k => k.toLowerCase() === mockRole.toLowerCase()
        ) || 'Owner';
        const permissions = DEFAULT_ROLES_PERMISSIONS[matchedDefaultKey];
        return {
          role: mockRole,
          roleId: null,
          permissions
        };
      }

      // Live Supabase Organization Membership Query
      const { data: member, error } = await supabase
        .from('organization_members')
        .select('role, role_id')
        .eq('organization_id', orgId)
        .eq('profile_id', currentUser.id)
        .maybeSingle();

      if (error || !member) {
        // Fallback: If they are the first user/owner of organizations
        return { role: 'owner', roleId: null, permissions: DEFAULT_PERMISSIONS.map(p => p.id) };
      }

      let permissions: string[] = [];
      if (member.role_id) {
        permissions = await this.getRolePermissions(member.role_id);
      } else {
        // Map old text roles to default permissions
        const textRole = member.role;
        const matchedDefaultKey = Object.keys(DEFAULT_ROLES_PERMISSIONS).find(
          k => k.toLowerCase() === textRole.toLowerCase()
        ) || 'Owner';
        permissions = DEFAULT_ROLES_PERMISSIONS[matchedDefaultKey];
      }

      return {
        role: member.role,
        roleId: member.role_id,
        permissions
      };
    } catch {
      // Dev fallbacks
      return { role: 'owner', roleId: null, permissions: DEFAULT_PERMISSIONS.map(p => p.id) };
    }
  },

  async hasPermission(permission: string): Promise<boolean> {
    const { permissions } = await this.getCurrentMemberRoleAndPermissions();
    return permissions.includes(permission);
  },

  // 4. Staff Role Assignment
  async assignStaffRole(memberId: string, roleId: string | null): Promise<boolean> {
    const supabase = createClient();
    const orgId = await this.getActiveOrgId();
    const profileId = await this.getActiveUserId();

    // Check staff.permissions.manage permission
    const canManage = await this.hasPermission('staff.permissions.manage');
    if (!canManage) {
      throw new Error("Bạn không có quyền gán vai trò nhân sự.");
    }

    let roleText = 'staff';
    if (roleId) {
      const roleObj = await this.getRole(roleId);
      if (roleObj) {
        roleText = roleObj.name.toLowerCase();
      }
    }

    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ 
          role_id: roleId,
          role: roleText
        })
        .eq('id', memberId);

      if (error) {
        if (this.isTableMissingError(error)) return this.assignLocalStaffRole(memberId, roleId, roleText);
        throw error;
      }

      await this.createAuditLog(orgId, profileId, 'member.role_assign', { member_id: memberId, role_id: roleId, role_name: roleText });
      return true;
    } catch (e) {
      const res = this.assignLocalStaffRole(memberId, roleId, roleText);
      await this.createAuditLog(orgId, profileId, 'member.role_assign', { member_id: memberId, role_id: roleId, role_name: roleText });
      return res;
    }
  },

  // 5. Audit Log Operations
  async createAuditLog(organizationId: string, profileId: string, action: string, details: any): Promise<void> {
    const supabase = createClient();
    const logPayload = {
      organization_id: organizationId,
      profile_id: profileId === '00000000-0000-0000-0000-000000000000' ? null : profileId,
      action,
      details: typeof details === 'object' ? details : { message: String(details) }
    };

    try {
      await supabase.from('audit_logs').insert([logPayload]);
    } catch {
      this.createLocalAuditLog(logPayload);
    }
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const supabase = createClient();
    const orgId = await this.getActiveOrgId();
    
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profile:profiles(full_name, email)
        `)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        if (this.isTableMissingError(error)) return this.getLocalAuditLogs(orgId);
        throw error;
      }
      return data;
    } catch {
      return this.getLocalAuditLogs(orgId);
    }
  },

  // ----------------------------------------------------
  // DATABASE SEEDER FOR SUPABASE
  // ----------------------------------------------------
  async seedDefaultRoles(orgId: string): Promise<Role[]> {
    const supabase = createClient();
    const seededRoles: Role[] = [];

    for (const [roleName, permissions] of Object.entries(DEFAULT_ROLES_PERMISSIONS)) {
      try {
        const { data: role, error: rErr } = await supabase
          .from('roles')
          .insert([{
            organization_id: orgId,
            name: roleName,
            description: `Vai trò mặc định ${roleName}`,
            is_system: true
          }])
          .select()
          .single();

        if (rErr || !role) continue;
        seededRoles.push(role);

        // Bind permissions
        const rpPayloads = permissions.map(pId => ({
          organization_id: orgId,
          role_id: role.id,
          permission_id: pId
        }));
        await supabase.from('role_permissions').insert(rpPayloads);
      } catch (e) {
        console.error("Seeding error for role: " + roleName, e);
      }
    }
    return seededRoles.length > 0 ? seededRoles : this.getLocalRoles(orgId);
  },

  // ----------------------------------------------------
  // LOCALSTORAGE FALLBACKS (DEV / RESILIENCY LAYER)
  // ----------------------------------------------------
  getLocalRoles(orgId: string): Role[] {
    if (typeof window === 'undefined') return this.getHardcodedRoles(orgId);
    const key = STORAGE_PREFIX + "roles_" + orgId;
    const data = localStorage.getItem(key);
    if (!data) {
      const defaults = this.getHardcodedRoles(orgId);
      localStorage.setItem(key, JSON.stringify(defaults));
      // Seed permissions too
      defaults.forEach(role => {
        const pKey = STORAGE_PREFIX + "role_permissions_" + role.id;
        const matchedKey = Object.keys(DEFAULT_ROLES_PERMISSIONS).find(k => k === role.name) || 'Owner';
        localStorage.setItem(pKey, JSON.stringify(DEFAULT_ROLES_PERMISSIONS[matchedKey]));
      });
      return defaults;
    }
    return JSON.parse(data);
  },

  getHardcodedRoles(orgId: string): Role[] {
    const roleNames = ['Owner', 'Manager', 'Cashier', 'Warehouse Staff', 'Accountant'];
    const ids = ['r-owner', 'r-manager', 'r-cashier', 'r-warehouse', 'r-accountant'];
    return roleNames.map((name, i) => ({
      id: ids[i],
      organization_id: orgId,
      name,
      description: `Vai trò mặc định ${name}`,
      is_system: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
  },

  getLocalRole(id: string): Role | null {
    if (typeof window === 'undefined') return null;
    const orgId = '00000000-0000-0000-0000-000000000000';
    const roles = this.getLocalRoles(orgId);
    return roles.find(r => r.id === id) || null;
  },

  createLocalRole(roleData: any): Role {
    const orgId = roleData.organization_id;
    const roles = this.getLocalRoles(orgId);
    const newRole: Role = {
      ...roleData,
      id: 'custom-' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    roles.push(newRole);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_PREFIX + "roles_" + orgId, JSON.stringify(roles));
    }
    return newRole;
  },

  updateLocalRole(roleId: string, name: string, description: string, permissionIds: string[]): Role {
    const orgId = '00000000-0000-0000-0000-000000000000';
    const roles = this.getLocalRoles(orgId);
    const idx = roles.findIndex(r => r.id === roleId);
    if (idx === -1) throw new Error("Không tìm thấy vai trò.");
    
    roles[idx] = {
      ...roles[idx],
      name,
      description,
      updated_at: new Date().toISOString()
    };
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_PREFIX + "roles_" + orgId, JSON.stringify(roles));
      localStorage.setItem(STORAGE_PREFIX + "role_permissions_" + roleId, JSON.stringify(permissionIds));
    }
    return roles[idx];
  },

  deleteLocalRole(roleId: string): boolean {
    const orgId = '00000000-0000-0000-0000-000000000000';
    const roles = this.getLocalRoles(orgId);
    const filtered = roles.filter(r => r.id !== roleId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_PREFIX + "roles_" + orgId, JSON.stringify(filtered));
      localStorage.removeItem(STORAGE_PREFIX + "role_permissions_" + roleId);
    }
    return true;
  },

  getLocalRolePermissions(roleId: string): string[] {
    if (typeof window === 'undefined') return [];
    const pKey = STORAGE_PREFIX + "role_permissions_" + roleId;
    const data = localStorage.getItem(pKey);
    if (!data) {
      if (roleId === 'r-owner') return DEFAULT_ROLES_PERMISSIONS['Owner'];
      if (roleId === 'r-manager') return DEFAULT_ROLES_PERMISSIONS['Manager'];
      if (roleId === 'r-cashier') return DEFAULT_ROLES_PERMISSIONS['Cashier'];
      if (roleId === 'r-warehouse') return DEFAULT_ROLES_PERMISSIONS['Warehouse Staff'];
      if (roleId === 'r-accountant') return DEFAULT_ROLES_PERMISSIONS['Accountant'];
      return [];
    }
    return JSON.parse(data);
  },

  assignLocalStaffRole(memberId: string, roleId: string | null, roleName: string): boolean {
    if (typeof window === 'undefined') return true;
    localStorage.setItem(STORAGE_PREFIX + "member_role_" + memberId, JSON.stringify({ roleId, roleName }));
    return true;
  },

  getLocalMemberRole(memberId: string): { roleId: string | null; roleName: string } {
    if (typeof window === 'undefined') return { roleId: null, roleName: 'staff' };
    const data = localStorage.getItem(STORAGE_PREFIX + "member_role_" + memberId);
    if (!data) {
      // Default mappings
      if (memberId === '1') return { roleId: 'r-owner', roleName: 'owner' };
      if (memberId === '2') return { roleId: 'r-manager', roleName: 'manager' };
      if (memberId === '3') return { roleId: 'r-warehouse', roleName: 'warehouse' };
      return { roleId: null, roleName: 'staff' };
    }
    return JSON.parse(data);
  },

  createLocalAuditLog(log: any): void {
    if (typeof window === 'undefined') return;
    const logs = this.getLocalAuditLogs(log.organization_id);
    const newLog: AuditLog = {
      ...log,
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      profile: {
        full_name: "Hệ thống",
        email: "system@zpos.vn"
      }
    };
    logs.unshift(newLog);
    localStorage.setItem(STORAGE_PREFIX + "audit_logs_" + log.organization_id, JSON.stringify(logs.slice(0, 100)));
  },

  getLocalAuditLogs(orgId: string): AuditLog[] {
    if (typeof window === 'undefined') return [];
    const key = STORAGE_PREFIX + "audit_logs_" + orgId;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }
};
