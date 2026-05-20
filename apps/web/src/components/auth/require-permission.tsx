"use client";

import { ReactNode } from "react";
import { usePermissions } from "@/hooks/use-permissions";

interface RequirePermissionProps {
  requiredPermission: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
  requireAll?: boolean;
}

export function RequirePermission({
  requiredPermission,
  children,
  fallback = null,
  requireAll = false,
}: RequirePermissionProps) {
  const { hasPermission, loading } = usePermissions();

  if (loading) {
    return <>{fallback}</>;
  }

  const checkHasPermission = () => {
    if (Array.isArray(requiredPermission)) {
      if (requireAll) {
        return requiredPermission.every((p) => hasPermission(p));
      }
      return requiredPermission.some((p) => hasPermission(p));
    }
    return hasPermission(requiredPermission);
  };

  if (!checkHasPermission()) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
