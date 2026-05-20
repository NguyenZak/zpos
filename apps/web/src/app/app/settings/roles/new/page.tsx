"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save, Shield, ShieldX } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { permissionService, type Permission } from "@/services/permission.service";
import { PermissionMatrix } from "../_components/permission-matrix";

export default function NewRolePage() {
  const router = useRouter();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accessCheck, setAccessCheck] = useState<"pending" | "allowed" | "denied">("pending");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        await permissionService.assertCanManageRoles();
      } catch {
        if (!cancelled) {
          setAccessCheck("denied");
          setLoading(false);
        }
        return;
      }

      try {
        const allPermissions = await permissionService.getPermissions();
        if (!cancelled) {
          setPermissions(allPermissions || []);
          setAccessCheck("allowed");
        }
      } catch (error: any) {
        if (!cancelled) toast.error(error?.message || "Không tải được danh sách quyền.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    if (!roleName.trim()) {
      toast.error("Tên vai trò không được để trống");
      return;
    }

    if (selectedPerms.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 quyền cho vai trò mới");
      return;
    }

    setSaving(true);
    try {
      const role = await permissionService.createRole(roleName.trim(), roleDesc.trim(), selectedPerms);
      toast.success(`Đã tạo vai trò "${role.name}"`);
      router.push(`/settings/roles/${role.id}/permissions`);
    } catch (error: any) {
      toast.error(error?.message || "Không tạo được vai trò.");
    } finally {
      setSaving(false);
    }
  };

  if (accessCheck === "denied") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-2xl bg-destructive/10 p-4 text-destructive">
          <ShieldX className="size-12" />
        </div>
        <div className="grid max-w-md gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Bạn chưa có quyền tạo vai trò</h1>
          <p className="text-sm text-muted-foreground">Bạn cần quyền roles.manage để tạo vai trò và cấu hình ma trận quyền.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/settings/roles">Quay lại vai trò</Link>
        </Button>
      </div>
    );
  }

  if (loading || accessCheck === "pending") {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-2">
        <Loader2 className="size-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Đang tải ma trận quyền...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-8 gap-1 pl-1 text-muted-foreground" asChild>
          <Link href="/settings/roles">
            <ArrowLeft className="size-4" />
            Quay lại vai trò
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-1 border-b pb-4">
        <div className="flex items-center gap-2">
          <Shield className="size-6 text-primary" />
          <h1 className="text-3xl font-semibold tracking-tight leading-none">Tạo vai trò mới</h1>
        </div>
        <p className="text-sm text-muted-foreground">Đặt tên vai trò, chọn từng quyền và lưu ma trận phân quyền cho nhân sự.</p>
      </div>

      <Card className="border-muted shadow-xs">
        <CardHeader>
          <CardTitle className="text-md font-semibold">Thông tin vai trò</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <label htmlFor="role-name" className="text-sm font-medium">
              Tên vai trò <span className="text-destructive">*</span>
            </label>
            <Input id="role-name" value={roleName} onChange={(event) => setRoleName(event.target.value)} placeholder="Ví dụ: Quản lý chi nhánh" />
          </div>
          <div className="grid gap-2">
            <label htmlFor="role-desc" className="text-sm font-medium">Mô tả vai trò</label>
            <Input id="role-desc" value={roleDesc} onChange={(event) => setRoleDesc(event.target.value)} placeholder="Phạm vi vận hành của vai trò này" />
          </div>
        </CardContent>
      </Card>

      <PermissionMatrix
        permissions={permissions}
        selected={selectedPerms}
        initialSelected={[]}
        search={search}
        saving={saving}
        onSearchChange={setSearch}
        onSelectedChange={setSelectedPerms}
        onSave={handleSave}
        onReset={() => setSelectedPerms([])}
      />

      <div className="flex justify-end gap-3 border-t pt-5">
        <Button type="button" variant="outline" asChild>
          <Link href="/settings/roles">Hủy bỏ</Link>
        </Button>
        <Button type="button" onClick={handleSave} disabled={saving || selectedPerms.length === 0} className="gap-2">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Tạo vai trò
        </Button>
      </div>
    </div>
  );
}
