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
  Info
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
import { permissionService, Role, AuditLog } from "@/services/permission.service";

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("roles");
  
  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    fetchRoles();
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

    setSubmitting(true);
    try {
      await permissionService.createRole(newRoleName.trim(), newRoleDesc.trim());
      toast.success("Tạo vai trò thành công");
      setCreateOpen(false);
      setNewRoleName("");
      setNewRoleDesc("");
      fetchRoles();
    } catch (e: any) {
      toast.error(e.message || "Lỗi khi tạo vai trò");
    } finally {
      setSubmitting(false);
    }
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
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-primary hover:bg-primary/95 text-primary-foreground shadow-sm">
                <Plus className="w-4 h-4" />
                Thêm vai trò mới
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleCreateRole}>
                <DialogHeader>
                  <DialogTitle>Thêm vai trò mới</DialogTitle>
                  <DialogDescription>
                    Thiết lập tên và mô tả cho vai trò tùy chỉnh. Sau khi tạo, bạn có thể gán quyền hạn chi tiết.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
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
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Hủy</Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Tạo vai trò
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
                              <Link href={`/settings/roles/${role.id}`}>
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
