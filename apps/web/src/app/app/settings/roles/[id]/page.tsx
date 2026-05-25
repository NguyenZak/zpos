"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, ArrowLeft, Save, Lock, Loader2, ShieldX, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { permissionService, Permission, Role } from "@/services/permission.service";
import { PermissionMatrix } from "../_components/permission-matrix";

export default function EditRolePage() {
  const params = useParams();
  const router = useRouter();
  const roleId = params.id as string;

  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [assignedPerms, setAssignedPerms] = useState<string[]>([]);
  const [initialPerms, setInitialPerms] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accessCheck, setAccessCheck] = useState<"pending" | "allowed" | "denied">("pending");

  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        try {
          await permissionService.assertCanManageRoles();
        } catch {
          setAccessCheck("denied");
          setLoading(false);
          return;
        }
        setAccessCheck("allowed");

        const roleData = await permissionService.getRole(roleId);
        if (!roleData) {
          toast.error("Không tìm thấy vai trò");
          router.push("/settings/roles");
          return;
        }

        setRole(roleData);
        setRoleName(roleData.name);
        setRoleDesc(roleData.description || "");

        const allPermissions = await permissionService.getPermissions();
        setPermissions(allPermissions || []);

        const activeAssigned = await permissionService.getRolePermissions(roleId);
        setAssignedPerms(activeAssigned || []);
        setInitialPerms(activeAssigned || []);
      } catch (e: any) {
        toast.error("Lỗi khi tải dữ liệu: " + e.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [roleId, router]);

  const handleSave = async () => {
    if (!roleName.trim()) {
      toast.error("Tên vai trò không được để trống");
      return;
    }

    setSaving(true);
    try {
      await permissionService.updateRole(roleId, roleName.trim(), roleDesc.trim(), assignedPerms);
      toast.success("Cập nhật vai trò & quyền hạn thành công");
      setInitialPerms(assignedPerms);
    } catch (e: any) {
      toast.error(e.message || "Lỗi khi lưu vai trò");
    } finally {
      setSaving(false);
    }
  };

  if (accessCheck === "denied") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-in fade-in duration-300">
        <div className="p-4 rounded-2xl bg-destructive/10 text-destructive">
          <ShieldX className="w-12 h-12" />
        </div>
        <div className="flex flex-col items-center gap-1 text-center max-w-md">
          <h1 className="text-2xl font-semibold tracking-tight">Bạn chưa có quyền quản lý vai trò</h1>
          <p className="text-muted-foreground text-sm">
            Bạn cần quyền roles.manage để chỉnh sửa ma trận phân quyền cho vai trò này.
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/settings">Quay lại Cài đặt</Link>
        </Button>
      </div>
    );
  }

  if (loading || accessCheck === "pending") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-muted-foreground text-sm">Đang tải cấu hình quyền hạn...</span>
      </div>
    );
  }

  const isOwner = Boolean(role?.is_owner || role?.name === "Owner");

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-8 gap-1 pl-1 text-muted-foreground" asChild>
          <Link href="/settings/roles">
            <ArrowLeft className="w-4 h-4" />
            Quay lại vai trò
          </Link>
        </Button>
      </div>

      {/* Header Info */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b pb-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-semibold tracking-tight leading-none">
              Chỉnh sửa vai trò: <span className="text-primary">{role?.name}</span>
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Tùy biến tên, mô tả và thiết lập ma trận quyền hạn cho vai trò này.
          </p>
        </div>

        {isOwner && (
          <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-none gap-1 font-bold text-xs">
            <Lock className="w-3.5 h-3.5" />
            Bảo vệ hệ thống
          </Badge>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {/* Role Information Card */}
        <Card className="shadow-xs border-muted">
          <CardHeader>
            <CardTitle className="text-md font-semibold">Thông tin vai trò</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <label htmlFor="role-name" className="text-sm font-medium">
                Tên vai trò <span className="text-destructive">*</span>
              </label>
              <Input
                id="role-name"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                disabled={role?.is_system}
                required
                placeholder="Tên vai trò..."
              />
              {role?.is_system && (
                <span className="text-[10px] text-muted-foreground">
                  Không thể đổi tên vai trò mặc định của hệ thống.
                </span>
              )}
            </div>
            <div className="grid gap-2">
              <label htmlFor="role-desc" className="text-sm font-medium">
                Mô tả vai trò
              </label>
              <Input
                id="role-desc"
                value={roleDesc}
                onChange={(e) => setRoleDesc(e.target.value)}
                placeholder="Mô tả quyền hạn tổng quát..."
              />
            </div>
          </CardContent>
        </Card>

        <PermissionMatrix
          permissions={permissions}
          selected={assignedPerms}
          initialSelected={initialPerms}
          search={search}
          locked={isOwner}
          saving={saving}
          onSearchChange={setSearch}
          onSelectedChange={setAssignedPerms}
          onSave={handleSave}
          onReset={() => setAssignedPerms(initialPerms)}
        />

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t pt-5">
          <Button type="button" variant="outline" asChild>
            <Link href="/settings/roles">Hủy bỏ</Link>
          </Button>
          <Button type="button" asChild variant="outline" className="gap-2">
            <Link href={`/settings/roles/${roleId}/permissions`}>
              Mở trang quyền riêng
              <ExternalLink className="w-4 h-4" />
            </Link>
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || isOwner}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/95"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu thay đổi
          </Button>
        </div>
      </div>
    </div>
  );
}
