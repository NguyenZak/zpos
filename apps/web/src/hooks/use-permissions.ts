"use client";

import { useState, useEffect } from "react";
import { permissionService } from "@/services/permission.service";

export interface UserPermissionsState {
  role: string;
  roleId: string | null;
  permissions: string[];
  isOwner: boolean;
  loading: boolean;
  hasPermission: (permissionId: string) => boolean;
  refresh: () => Promise<void>;
}

export function usePermissions(): UserPermissionsState {
  const [role, setRole] = useState<string>("staff");
  const [roleId, setRoleId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const result = await permissionService.getCurrentMemberRoleAndPermissions();
      setRole(result.role);
      setRoleId(result.roleId);
      setPermissions(result.permissions || []);
    } catch (e) {
      console.error("Lỗi khi tải phân quyền từ usePermissions hook:", e);
      // Fallback
      setRole("owner");
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const hasPermission = (permissionId: string): boolean => {
    if (role.toLowerCase() === 'owner') return true;
    return permissions.includes(permissionId);
  };

  const isOwner = role.toLowerCase() === 'owner';

  return {
    role,
    roleId,
    permissions,
    isOwner,
    loading,
    hasPermission,
    refresh: fetchPermissions
  };
}
