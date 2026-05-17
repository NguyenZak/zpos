"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { getRequiredPermissionForPath } from "@/utils/permission-check";

interface PermissionGuardProps {
  children: React.ReactNode;
}

export function PermissionGuard({ children }: PermissionGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { hasPermission, loading } = usePermissions();

  useEffect(() => {
    if (loading) return;

    const requiredPermission = getRequiredPermissionForPath(pathname);
    if (requiredPermission && !hasPermission(requiredPermission)) {
      console.warn(`Truy cập bị chặn đối với đường dẫn: ${pathname}. Yêu cầu quyền: ${requiredPermission}`);
      // Use replace to prevent back-button loops
      router.replace("/unauthorized");
    }
  }, [pathname, loading, hasPermission, router]);

  if (loading) {
    return (
      <div className="flex h-full min-h-[50dvh] w-full flex-col items-center justify-center gap-3 animate-in fade-in duration-300">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-xs font-semibold text-muted-foreground">Đang kiểm tra quyền truy cập hệ thống...</span>
      </div>
    );
  }

  // Pre-render check to prevent content flash before redirect completes
  const requiredPermission = getRequiredPermissionForPath(pathname);
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="flex h-full min-h-[50dvh] w-full flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary/40" />
        <span className="text-xs text-muted-foreground/60">Đang chuyển hướng...</span>
      </div>
    );
  }

  return <>{children}</>;
}
