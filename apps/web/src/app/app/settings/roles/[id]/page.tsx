"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Shield, 
  ArrowLeft, 
  Save, 
  Lock, 
  CheckSquare, 
  Square,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { permissionService, Permission, Role } from "@/services/permission.service";

export default function EditRolePage() {
  const params = useParams();
  const router = useRouter();
  const roleId = params.id as string;

  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [assignedPerms, setAssignedPerms] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
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
      } catch (e: any) {
        toast.error("Lỗi khi tải dữ liệu: " + e.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [roleId, router]);

  const handleCheckboxChange = (permId: string, checked: boolean) => {
    if (role?.name === 'Owner') return; // Protect Owner permissions from change

    if (checked) {
      setAssignedPerms(prev => [...prev, permId]);
    } else {
      setAssignedPerms(prev => prev.filter(id => id !== permId));
    }
  };

  const toggleGroup = (groupName: string, groupPerms: Permission[]) => {
    if (role?.name === 'Owner') return;
    
    const groupPermIds = groupPerms.map(p => p.id);
    const allChecked = groupPermIds.every(id => assignedPerms.includes(id));
    
    if (allChecked) {
      // Uncheck all in group
      setAssignedPerms(prev => prev.filter(id => !groupPermIds.includes(id)));
    } else {
      // Check all in group
      setAssignedPerms(prev => {
        const filtered = prev.filter(id => !groupPermIds.includes(id));
        return [...filtered, ...groupPermIds];
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      toast.error("Tên vai trò không được để trống");
      return;
    }

    setSaving(true);
    try {
      await permissionService.updateRole(roleId, roleName.trim(), roleDesc.trim(), assignedPerms);
      toast.success("Cập nhật vai trò & quyền hạn thành công");
      router.push("/settings/roles");
    } catch (e: any) {
      toast.error(e.message || "Lỗi khi lưu vai trò");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-muted-foreground text-sm">Đang tải cấu hình quyền hạn...</span>
      </div>
    );
  }

  // Group permissions by group_name
  const groupedPerms = permissions.reduce<Record<string, Permission[]>>((acc, perm) => {
    if (!acc[perm.group_name]) acc[perm.group_name] = [];
    acc[perm.group_name].push(perm);
    return acc;
  }, {});

  const isOwner = role?.name === 'Owner';

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

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Role Information Card */}
        <Card className="shadow-xs border-muted">
          <CardHeader>
            <CardTitle className="text-md font-semibold">Thông tin vai trò</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <label htmlFor="role-name" className="text-sm font-medium">Tên vai trò <span className="text-destructive">*</span></label>
              <Input
                id="role-name"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                disabled={role?.is_system}
                required
                placeholder="Tên vai trò..."
              />
              {role?.is_system && (
                <span className="text-[10px] text-muted-foreground">Không thể đổi tên vai trò mặc định của hệ thống.</span>
              )}
            </div>
            <div className="grid gap-2">
              <label htmlFor="role-desc" className="text-sm font-medium">Mô tả vai trò</label>
              <Input
                id="role-desc"
                value={roleDesc}
                onChange={(e) => setRoleDesc(e.target.value)}
                placeholder="Mô tả quyền hạn tổng quát..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Permissions Checkbox Matrix */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold tracking-tight">Ma trận phân quyền chi tiết</h2>
              <p className="text-muted-foreground text-xs">Tick chọn để bật các chức năng được phép truy cập.</p>
            </div>
            {!isOwner && (
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  className="h-8 text-xs border-muted"
                  onClick={() => setAssignedPerms(permissions.map(p => p.id))}
                >
                  Chọn tất cả quyền
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  className="h-8 text-xs border-muted text-destructive hover:bg-destructive/10"
                  onClick={() => setAssignedPerms([])}
                >
                  Xóa tất cả
                </Button>
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(groupedPerms).map(([group, groupPermissions]) => {
              const groupPermIds = groupPermissions.map(p => p.id);
              const allChecked = groupPermIds.every(id => assignedPerms.includes(id)) || isOwner;
              const someChecked = groupPermIds.some(id => assignedPerms.includes(id)) && !allChecked;

              return (
                <Card key={group} className="border-muted bg-card shadow-xs overflow-hidden hover:shadow-md transition-shadow">
                  <div className="bg-muted/30 px-4 py-3 border-b flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <span className="w-1.5 h-3 rounded-full bg-primary" />
                      {group}
                    </h3>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-[11px] text-muted-foreground hover:text-primary px-2"
                      onClick={() => toggleGroup(group, groupPermissions)}
                      disabled={isOwner}
                    >
                      {allChecked ? "Bỏ chọn tất cả" : "Chọn nhóm này"}
                    </Button>
                  </div>
                  <div className="divide-y divide-muted/30">
                    {groupPermissions.map((perm) => {
                      const isChecked = assignedPerms.includes(perm.id) || isOwner;
                      return (
                        <div 
                          key={perm.id} 
                          className={`p-3.5 flex items-start gap-3 hover:bg-muted/10 transition-colors cursor-pointer ${isChecked ? 'bg-primary/5 dark:bg-primary/2' : ''}`}
                          onClick={() => handleCheckboxChange(perm.id, !isChecked)}
                        >
                          <Checkbox 
                            id={perm.id} 
                            checked={isChecked}
                            onCheckedChange={(checked) => handleCheckboxChange(perm.id, !!checked)}
                            disabled={isOwner}
                            className="mt-0.5"
                          />
                          <div className="grid gap-0.5 leading-none cursor-pointer">
                            <span className="text-sm font-semibold text-foreground">
                              {perm.name}
                            </span>
                            <span className="text-xs text-muted-foreground leading-normal">
                              {perm.description}
                            </span>
                            <span className="text-[9px] font-mono text-muted-foreground/60 uppercase select-none mt-1">
                              KEY: {perm.id}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t pt-5">
          <Button type="button" variant="outline" asChild>
            <Link href="/settings/roles">Hủy bỏ</Link>
          </Button>
          <Button type="submit" disabled={saving || isOwner} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/95">
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </div>
  );
}
