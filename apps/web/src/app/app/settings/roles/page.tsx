"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  Plus,
  Trash2,
  Edit,
  ShieldCheck,
  Users,
  Activity,
  Search,
  Loader2,
  Lock,
  Clock,
  User,
  Info,
  ShieldX
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { permissionService, Role, AuditLog, Permission } from "@/services/permission.service";

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("roles");
  const [ownerCheck, setOwnerCheck] = useState<"pending" | "allowed" | "denied">("pending");
  
  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Permission picker state (create dialog)
  const [permList, setPermList] = useState<Permission[]>([]);
  const [permLoading, setPermLoading] = useState(false);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [permSearch, setPermSearch] = useState("");

  // Delete confirmation state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const data = await permissionService.getRoles();
      setRoles(data || []);
    } catch (e: any) {
      toast.error("Không thể tải danh sách vai trò: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLogsLoading(true);
    try {
      const logs = await permissionService.getAuditLogs();
      setAuditLogs(logs || []);
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi tải nhật ký hoạt động");
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await permissionService.assertCanManageRoles();
      } catch {
        if (cancelled) return;
        setOwnerCheck("denied");
        setLoading(false);
        return;
      }
      if (cancelled) return;
      setOwnerCheck("allowed");
      fetchRoles();
    })();
    return () => { cancelled = true; };
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "audit") {
      fetchAuditLogs();
    } else {
      fetchRoles();
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) {
      toast.error("Tên vai trò không được bỏ trống");
      return;
    }
    if (selectedPerms.length === 0) {
      toast.error("Vui lòng tick chọn ít nhất 1 quyền cho vai trò này");
      return;
    }

    setSubmitting(true);
    try {
      await permissionService.createRole(newRoleName.trim(), newRoleDesc.trim(), selectedPerms);
      toast.success(`Đã tạo vai trò "${newRoleName.trim()}" với ${selectedPerms.length} quyền`);
      setCreateOpen(false);
      setNewRoleName("");
      setNewRoleDesc("");
      setSelectedPerms([]);
      setPermSearch("");
      fetchRoles();
    } catch (e: any) {
      toast.error(e.message || "Lỗi khi tạo vai trò");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!createOpen) return;
    let cancelled = false;
    setPermLoading(true);
    permissionService.getPermissions()
      .then((data) => {
        if (cancelled) return;
        setPermList(data || []);
      })
      .catch((err) => {
        if (!cancelled) toast.error("Không tải được danh sách quyền: " + (err?.message || ""));
      })
      .finally(() => {
        if (!cancelled) setPermLoading(false);
      });
    return () => { cancelled = true; };
  }, [createOpen]);

  const togglePermission = (permId: string) => {
    setSelectedPerms((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const toggleGroupPerms = (groupPerms: Permission[]) => {
    const groupIds = groupPerms.map((p) => p.id);
    const allChecked = groupIds.every((id) => selectedPerms.includes(id));
    setSelectedPerms((prev) =>
      allChecked
        ? prev.filter((id) => !groupIds.includes(id))
        : Array.from(new Set([...prev, ...groupIds]))
    );
  };

  const groupedPerms = permList.reduce<Record<string, Permission[]>>((acc, perm) => {
    if (!acc[perm.group_name]) acc[perm.group_name] = [];
    acc[perm.group_name].push(perm);
    return acc;
  }, {});

  const matchesSearch = (perm: Permission) => {
    if (!permSearch.trim()) return true;
    const q = permSearch.toLowerCase();
    return (
      perm.name.toLowerCase().includes(q) ||
      perm.id.toLowerCase().includes(q) ||
      perm.description.toLowerCase().includes(q) ||
      perm.group_name.toLowerCase().includes(q)
    );
  };

  const handleDeleteRole = async () => {
    if (!deleteId) return;

    try {
      await permissionService.deleteRole(deleteId);
      toast.success("Đã xóa vai trò thành công");
      fetchRoles();
    } catch (e: any) {
      toast.error(e.message || "Không thể xóa vai trò này");
    } finally {
      setDeleteOpen(false);
      setDeleteId(null);
    }
  };

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(search.toLowerCase()) ||
    (role.description || "").toLowerCase().includes(search.toLowerCase())
  );

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'role.create':
        return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-none font-bold text-[10px]">Tạo vai trò</Badge>;
      case 'role.update':
        return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-none font-bold text-[10px]">Cập nhật</Badge>;
      case 'role.delete':
        return <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-none font-bold text-[10px]">Xóa vai trò</Badge>;
      case 'member.role_assign':
        return <Badge className="bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border-none font-bold text-[10px]">Gán vai trò</Badge>;
      default:
        return <Badge className="bg-gray-500/10 text-gray-600 hover:bg-gray-500/20 border-none font-bold text-[10px]">{action}</Badge>;
    }
  };

  const getLogDetailMessage = (log: AuditLog) => {
    const details = log.details || {};
    switch (log.action) {
      case 'role.create':
        return `Đã tạo vai trò tùy chỉnh mới "${details.name}"`;
      case 'role.update':
        return `Đã cập nhật vai trò "${details.name}" (Thiết lập ${details.permissions_count || 0} quyền truy cập)`;
      case 'role.delete':
        return `Đã xóa vai trò tùy chỉnh "${details.name}" khỏi hệ thống`;
      case 'member.role_assign':
        return `Đã thay đổi vai trò truy cập thành "${details.role_name}" cho nhân viên`;
      default:
        return details.message || JSON.stringify(details);
    }
  };

  if (ownerCheck === "pending") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-muted-foreground text-sm">Đang kiểm tra quyền truy cập...</span>
      </div>
    );
  }

  if (ownerCheck === "denied") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-in fade-in duration-300">
        <div className="p-4 rounded-2xl bg-destructive/10 text-destructive">
          <ShieldX className="w-12 h-12" />
        </div>
        <div className="flex flex-col items-center gap-1 text-center max-w-md">
          <h1 className="text-2xl font-semibold tracking-tight">Bạn chưa có quyền quản lý phân quyền</h1>
          <p className="text-muted-foreground text-sm">
            Trang Quản lý vai trò & Phân quyền yêu cầu quyền roles.manage. Vui lòng liên hệ chủ doanh nghiệp nếu bạn cần điều chỉnh quyền hạn.
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/settings">Quay lại Cài đặt</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-semibold tracking-tight leading-none">Quản lý vai trò & Phân quyền</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Tạo vai trò tùy chỉnh, quản lý danh sách quyền hạn và gán quyền truy cập cho nhân viên.
          </p>
        </div>

        {activeTab === "roles" && (
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="gap-2">
              <Link href="/settings/roles/new">
                <Plus className="w-4 h-4" />
                Trang tạo vai trò
              </Link>
            </Button>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
              <Button className="gap-2 bg-primary hover:bg-primary/95 text-primary-foreground shadow-sm">
                <Plus className="w-4 h-4" />
                Thêm vai trò mới
              </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col p-0 gap-0">
              <form onSubmit={handleCreateRole} className="flex flex-col flex-1 min-h-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                  <DialogTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Thêm vai trò mới
                  </DialogTitle>
                  <DialogDescription>
                    Đặt tên vai trò và tick chọn từng quyền hạn mà vai trò này được phép sử dụng.
                  </DialogDescription>
                </DialogHeader>

                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 flex flex-col gap-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <label htmlFor="name" className="text-sm font-medium">Tên vai trò <span className="text-destructive">*</span></label>
                      <Input
                        id="name"
                        placeholder="Ví dụ: Quản lý chi nhánh, Thu ngân chính..."
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="description" className="text-sm font-medium">Mô tả vai trò</label>
                      <Input
                        id="description"
                        placeholder="Ví dụ: Có toàn quyền quản lý kho và xem hóa đơn..."
                        value={newRoleDesc}
                        onChange={(e) => setNewRoleDesc(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t pt-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-col">
                        <h3 className="text-sm font-semibold">Ma trận phân quyền</h3>
                        <p className="text-[11px] text-muted-foreground">
                          Đã chọn <span className="font-bold text-primary">{selectedPerms.length}</span> / {permList.length} quyền.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px]"
                          onClick={() => setSelectedPerms(permList.map((p) => p.id))}
                          disabled={permLoading || permList.length === 0}
                        >
                          Chọn tất cả
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] text-destructive hover:bg-destructive/10"
                          onClick={() => setSelectedPerms([])}
                          disabled={permLoading || selectedPerms.length === 0}
                        >
                          Bỏ chọn tất cả
                        </Button>
                      </div>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Tìm quyền theo tên, mô tả, key hoặc nhóm..."
                        value={permSearch}
                        onChange={(e) => setPermSearch(e.target.value)}
                        className="pl-10 h-9"
                      />
                    </div>

                    {permLoading ? (
                      <div className="flex flex-col items-center justify-center gap-2 py-10">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span className="text-xs text-muted-foreground">Đang tải danh sách quyền...</span>
                      </div>
                    ) : (
                      <div className="grid gap-3 md:grid-cols-2">
                        {Object.entries(groupedPerms).map(([group, groupPermissions]) => {
                          const visiblePerms = groupPermissions.filter(matchesSearch);
                          if (visiblePerms.length === 0) return null;

                          const groupIds = groupPermissions.map((p) => p.id);
                          const checkedInGroup = groupIds.filter((id) => selectedPerms.includes(id)).length;
                          const allChecked = checkedInGroup === groupIds.length;

                          return (
                            <Card key={group} className="border-muted bg-card shadow-xs overflow-hidden">
                              <div className="bg-muted/30 px-3.5 py-2.5 border-b flex items-center justify-between">
                                <h4 className="font-semibold text-xs text-foreground flex items-center gap-2">
                                  <span className="w-1 h-3 rounded-full bg-primary" />
                                  {group}
                                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-muted font-mono">
                                    {checkedInGroup}/{groupIds.length}
                                  </Badge>
                                </h4>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-[10px] text-muted-foreground hover:text-primary px-2"
                                  onClick={() => toggleGroupPerms(groupPermissions)}
                                >
                                  {allChecked ? "Bỏ nhóm" : "Chọn cả nhóm"}
                                </Button>
                              </div>
                              <div className="divide-y divide-muted/30">
                                {visiblePerms.map((perm) => {
                                  const isChecked = selectedPerms.includes(perm.id);
                                  const isSensitive = /(nhạy cảm)/i.test(perm.description);
                                  return (
                                    <label
                                      key={perm.id}
                                      className={`p-3 flex items-start gap-2.5 hover:bg-muted/10 transition-colors cursor-pointer ${isChecked ? 'bg-primary/5' : ''}`}
                                    >
                                      <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={() => togglePermission(perm.id)}
                                        className="mt-0.5"
                                      />
                                      <div className="grid gap-0.5 leading-tight">
                                        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                          {perm.name}
                                          {isSensitive && (
                                            <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-none text-[8px] px-1 py-0">
                                              Nhạy cảm
                                            </Badge>
                                          )}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground leading-normal">
                                          {perm.description}
                                        </span>
                                        <span className="text-[9px] font-mono text-muted-foreground/50 uppercase select-none mt-0.5">
                                          KEY: {perm.id}
                                        </span>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            </Card>
                          );
                        })}
                        {Object.entries(groupedPerms).every(([, perms]) => perms.filter(matchesSearch).length === 0) && (
                          <div className="col-span-full text-center py-8 text-sm text-muted-foreground">
                            Không tìm thấy quyền nào khớp với "{permSearch}".
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter className="px-6 py-4 border-t bg-muted/20">
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Hủy</Button>
                  <Button type="submit" disabled={submitting || permLoading} className="gap-2">
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Tạo vai trò ({selectedPerms.length} quyền)
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Grid Summaries */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card text-card-foreground p-5 shadow-xs flex items-center gap-4 border-muted">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold">{roles.length}</div>
            <p className="text-[12px] text-muted-foreground font-medium">Tổng số vai trò</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground p-5 shadow-xs flex items-center gap-4 border-muted">
          <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold">{roles.filter(r => r.is_system).length}</div>
            <p className="text-[12px] text-muted-foreground font-medium">Vai trò hệ thống mặc định</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground p-5 shadow-xs flex items-center gap-4 border-muted">
          <div className="p-3 bg-green-500/10 rounded-lg text-green-500">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold">{roles.filter(r => !r.is_system).length}</div>
            <p className="text-[12px] text-muted-foreground font-medium">Vai trò tùy chỉnh</p>
          </div>
        </div>
      </div>

      {/* Tabbed interface */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="bg-muted/60 p-1 rounded-xl mb-4 border border-muted">
          <TabsTrigger value="roles" className="rounded-lg px-4 py-1.5 font-semibold text-xs transition-all">
            Vai trò & Quyền hạn
          </TabsTrigger>
          <TabsTrigger value="audit" className="rounded-lg px-4 py-1.5 font-semibold text-xs transition-all flex gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Nhật ký hoạt động phân quyền
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="outline-hidden">
          <div className="flex flex-col gap-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Tìm vai trò theo tên..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-9"
              />
            </div>

            <div className="rounded-xl border bg-card shadow-xs overflow-hidden border-muted">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-semibold text-xs py-3 w-[250px]">Vai trò</TableHead>
                    <TableHead className="font-semibold text-xs py-3">Mô tả chi tiết</TableHead>
                    <TableHead className="font-semibold text-xs py-3 w-[150px] text-center">Phân loại</TableHead>
                    <TableHead className="font-semibold text-xs py-3 w-[200px] text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-40 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">Đang tải danh sách vai trò...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredRoles.length > 0 ? (
                    filteredRoles.map((role) => (
                      <TableRow key={role.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium align-middle">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{role.name}</span>
                            {role.name === 'Owner' && <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm align-middle">
                          {role.description || "Chưa có mô tả chi tiết."}
                        </TableCell>
                        <TableCell className="text-center align-middle">
                          <Badge 
                            variant={role.is_system ? "secondary" : "outline"}
                            className={role.is_system ? "bg-primary/5 text-primary hover:bg-primary/10 border-none font-bold text-[10px]" : "font-bold text-[10px] border-muted"}
                          >
                            {role.is_system ? "Hệ thống" : "Tự định nghĩa"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right align-middle">
                          <div className="flex justify-end gap-1.5">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 gap-1 text-xs border-muted hover:border-primary hover:text-primary transition-all duration-200"
                              asChild
                            >
                              <Link href={`/settings/roles/${role.id}/permissions`}>
                                <Edit className="w-3.5 h-3.5" />
                                Phân quyền
                              </Link>
                            </Button>
                            {!role.is_system && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 gap-1 text-destructive hover:bg-destructive/10 text-xs transition-all duration-200"
                                onClick={() => {
                                  setDeleteId(role.id);
                                  setDeleteOpen(true);
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Xóa
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-40 text-center text-muted-foreground">
                        Không tìm thấy vai trò nào phù hợp.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="audit" className="outline-hidden">
          <div className="rounded-xl border bg-card shadow-xs overflow-hidden border-muted">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-semibold text-xs py-3 w-[180px]">Thời gian</TableHead>
                  <TableHead className="font-semibold text-xs py-3 w-[150px]">Người thực hiện</TableHead>
                  <TableHead className="font-semibold text-xs py-3 w-[120px]">Hành động</TableHead>
                  <TableHead className="font-semibold text-xs py-3">Chi tiết thay đổi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-40 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Đang tải nhật ký...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/30 transition-colors text-sm">
                      <TableCell className="align-middle text-muted-foreground text-xs font-mono">
                        {new Date(log.created_at).toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell className="align-middle font-medium">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{log.profile?.full_name || "Hệ thống"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="align-middle">
                        {getActionBadge(log.action)}
                      </TableCell>
                      <TableCell className="align-middle text-foreground/90 font-medium">
                        {getLogDetailMessage(log)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-40 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2 opacity-55">
                        <Info className="w-8 h-8" />
                        <span>Chưa ghi nhận hoạt động phân quyền nào trong hệ thống.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa vai trò?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Mọi nhân sự được gán vai trò này sẽ tạm thời bị mất quyền hạn gán và chuyển về quyền nhân sự mặc định.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRole} className="bg-destructive hover:bg-destructive/90 text-white border-none shadow-xs">
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
