"use client";

import React, { useState, useEffect } from 'react';
import { 
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnDef
} from "@tanstack/react-table";
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Loader2,
  Users,
  Edit,
  Trash2,
  UserCheck,
  ShieldAlert,
  Lock
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { AddStaffDialog } from "./_components/add-staff-dialog";
import { posService } from "@/services/pos.service";
import { permissionService, Role } from "@/services/permission.service";

export default function StaffPage() {
  const [data, setData] = useState<any[]>([]);
  const [rolesList, setRolesList] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Lock/Delete dialog states
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);

  // Role Assignment states
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignRoleId, setAssignRoleId] = useState<string | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const staff = await posService.getEmployees();
      const allRoles = await permissionService.getRoles();
      setRolesList(allRoles);

      // Map roles to staff
      const mapped = (staff || []).map((emp: any) => {
        const localRole = permissionService.getLocalMemberRole(emp.id);
        const activeRoleObj = allRoles.find(r => r.id === localRole.roleId || r.name.toLowerCase() === emp.role.toLowerCase());
        
        return {
          ...emp,
          roleId: activeRoleObj?.id || null,
          roleName: activeRoleObj?.name || emp.role
        };
      });
      setData(mapped);
    } catch (error) {
      console.error(error);
      const allRoles = await permissionService.getRoles();
      setRolesList(allRoles);
      
      const defaultStaff = [
        { id: '1', name: 'Nguyễn Quản Trị', email: 'admin@zpos.vn', phone: '0901234567', role: 'owner', status: 'active', created_at: new Date().toISOString() },
        { id: '2', name: 'Lê Bán Hàng', email: 'sales1@zpos.vn', phone: '0902222333', role: 'manager', status: 'active', created_at: new Date().toISOString() },
        { id: '3', name: 'Trần Thủ Kho', email: 'wh1@zpos.vn', phone: '0905555666', role: 'warehouse staff', status: 'inactive', created_at: new Date().toISOString() },
      ];
      
      const mapped = defaultStaff.map((emp: any) => {
        const localRole = permissionService.getLocalMemberRole(emp.id);
        const activeRoleObj = allRoles.find(r => r.id === localRole.roleId || r.name.toLowerCase() === emp.role.toLowerCase());
        return {
          ...emp,
          roleId: activeRoleObj?.id || null,
          roleName: activeRoleObj?.name || emp.role
        };
      });
      setData(mapped);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!deletingId) return;
    try {
      await posService.deleteEmployee(deletingId);
      toast.success("Đã khóa tài khoản nhân viên", {
        description: "Nhân viên đã được tạm ngừng quyền truy cập."
      });
      loadStaff();
    } catch (error) {
      toast.error("Lỗi khi thực hiện thao tác");
    } finally {
      setAlertOpen(false);
      setDeletingId(null);
    }
  };

  const handleOpenAssignDialog = (staff: any) => {
    setSelectedStaff(staff);
    setAssignRoleId(staff.roleId);
    setAssignOpen(true);
  };

  const handleSaveRoleAssignment = async () => {
    if (!selectedStaff) return;
    setAssignLoading(true);
    try {
      await permissionService.assignStaffRole(selectedStaff.id, assignRoleId);
      toast.success(`Đã phân vai trò mới cho ${selectedStaff.name}`);
      setAssignOpen(false);
      loadStaff();
    } catch (e: any) {
      toast.error(e.message || "Lỗi khi gán vai trò nhân sự");
    } finally {
      setAssignLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "Nhân viên",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-8.5 h-8.5 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase border border-primary/20 shadow-xs">
            {row.original.name.charAt(0)}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm">{row.original.name}</span>
              {row.original.roleName.toLowerCase() === 'owner' && <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
            </div>
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">ID: {row.original.id.slice(0, 8)}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Liên hệ",
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mail className="w-3.5 h-3.5" />
            {row.original.email}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Phone className="w-3.5 h-3.5" />
            {row.original.phone || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "roleName",
      header: "Vai trò & Phân quyền",
      cell: ({ row }) => {
        const roleName = row.original.roleName;
        let badgeColor = "bg-muted/10 text-muted-foreground border-muted hover:bg-muted/20";
        
        const lowerName = roleName.toLowerCase();
        if (lowerName.includes('owner') || lowerName.includes('chủ')) {
          badgeColor = "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20";
        } else if (lowerName.includes('manager') || lowerName.includes('quản lý')) {
          badgeColor = "bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 border-indigo-500/20";
        } else if (lowerName.includes('cashier') || lowerName.includes('ngân')) {
          badgeColor = "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20";
        } else if (lowerName.includes('warehouse') || lowerName.includes('kho')) {
          badgeColor = "bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 border-sky-500/20";
        } else if (lowerName.includes('accountant') || lowerName.includes('toán')) {
          badgeColor = "bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-rose-500/20";
        }
        
        return (
          <Badge 
            variant="outline" 
            className={`capitalize text-[10px] font-extrabold px-2 py-0.5 shadow-2xs border ${badgeColor}`}
          >
            {roleName}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => (
        <Badge 
          className={row.original.status === 'active' ? "bg-green-500/10 text-green-600 hover:bg-green-500/20 border-none font-bold text-[10px]" : "bg-gray-500/10 text-gray-600 hover:bg-gray-500/20 border-none font-bold text-[10px]"}
        >
          {row.original.status === 'active' ? 'Đang làm việc' : 'Đã nghỉ / Khóa'}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const isOwner = row.original.roleName.toLowerCase() === 'owner';
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(row.original.id)}>
                Sao chép ID
              </DropdownMenuItem>
              {!isOwner && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2" onClick={() => handleOpenAssignDialog(row.original)}>
                    <ShieldCheck className="w-4 h-4" /> Gán quyền / Vai trò
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="gap-2 text-destructive" 
                    onClick={() => {
                      setDeletingId(row.original.id);
                      setAlertOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" /> Khóa tài khoản
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none tracking-tight font-semibold">Nhân viên</h1>
          <p className="text-muted-foreground text-sm">Quản lý đội ngũ nhân sự và cấu hình gán quyền vai trò hệ thống.</p>
        </div>
        <AddStaffDialog onShowSuccess={loadStaff} />
      </div>

      <div className="flex items-center gap-2 py-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Tìm theo tên, email..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="pl-10 h-9"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Bộ lọc
        </Button>
      </div>

      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-semibold text-xs py-3">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Đang tải danh sách nhân sự...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                    <Users className="w-12 h-12" />
                    <span className="text-sm">Chưa có nhân viên nào trong danh sách.</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Trước
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Sau
        </Button>
      </div>

      {/* Dialog Gán Vai Trò */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Gán vai trò nhân sự
            </DialogTitle>
            <DialogDescription>
              Chọn vai trò truy cập hệ thống cho nhân sự <strong>{selectedStaff?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 grid gap-3">
            <label className="text-sm font-semibold">Vai trò / Phân quyền truy cập</label>
            <Select 
              value={assignRoleId || "none"}
              onValueChange={(val) => setAssignRoleId(val === "none" ? null : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn vai trò cho nhân sự" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Mặc định (Staff)</SelectItem>
                {rolesList.map(r => (
                  <SelectItem key={r.id} value={r.id} disabled={r.name === 'Owner' && selectedStaff?.roleName !== 'Owner'}>
                    {r.name} {r.is_system ? '(Hệ thống)' : '(Tùy chỉnh)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="bg-primary/5 dark:bg-primary/2 rounded-lg p-3 text-[11px] text-muted-foreground flex gap-2 border border-primary/10">
              <ShieldAlert className="w-4 h-4 text-primary shrink-0" />
              <span>
                Quyền hạn truy cập của nhân viên này sẽ lập tức thay đổi dựa trên Ma trận phân quyền của vai trò đã chọn.
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAssignOpen(false)}>Hủy bỏ</Button>
            <Button size="sm" onClick={handleSaveRoleAssignment} disabled={assignLoading}>
              {assignLoading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
              Xác nhận gán
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lock Confirmation Dialog */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận khóa tài khoản?</AlertDialogTitle>
            <AlertDialogDescription>
              Nhân viên này sẽ không thể đăng nhập vào hệ thống sau khi bị khóa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingId(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStaff} className="bg-destructive hover:bg-destructive/90 text-white">
              Xác nhận khóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
