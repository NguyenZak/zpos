"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MoreHorizontal, 
  FileDown,
  Filter,
  Truck,
  Building2,
  Mail,
  Phone,
  User,
  Loader2,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { toast } from "sonner";
import { posService } from '@/services/pos.service';
import { AddSupplierDialog } from './_components/add-supplier-dialog';
import { EditSupplierDialog } from './_components/edit-supplier-dialog';

export type Supplier = {
  id: string;
  name: string;
  contact_name: string;
  phone: string;
  email: string;
  address: string;
  is_active: boolean;
};

export default function SuppliersPage() {
  const [data, setData] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const suppliers = await posService.getSuppliers("");
      setData(suppliers);
    } catch (error) {
      console.error("Lỗi tải nhà cung cấp:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (supplier: Supplier) => {
    try {
      await posService.updateSupplier(supplier.id, { is_active: !supplier.is_active });
      toast.success(supplier.is_active ? "Đã ngừng hoạt động nhà cung cấp" : "Đã kích hoạt lại nhà cung cấp");
      loadSuppliers();
    } catch (error) {
      toast.error("Lỗi khi cập nhật trạng thái");
    }
  };

  const handleDeleteSupplier = async () => {
    if (!deletingId) return;
    try {
      await posService.deleteSupplier(deletingId);
      toast.success("Đã xóa nhà cung cấp", {
        description: "Thông tin nhà cung cấp đã được gỡ bỏ."
      });
      loadSuppliers();
    } catch (error) {
      toast.error("Lỗi khi xóa nhà cung cấp");
    } finally {
      setAlertOpen(false);
      setDeletingId(null);
    }
  };

  const columns: ColumnDef<Supplier>[] = [
    {
      accessorKey: "name",
      header: "Nhà cung cấp",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-ink">{row.getValue("name")}</span>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
              <User className="w-2.5 h-2.5" />
              {row.original.contact_name || "N/A"}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Điện thoại",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm font-medium">
          <Phone className="w-3 h-3 text-ash" />
          {row.getValue("phone")}
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="w-3 h-3" />
          {row.getValue("email") || "---"}
        </div>
      ),
    },
    {
      accessorKey: "address",
      header: "Địa chỉ",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate text-xs text-ash">
          {row.getValue("address") || "---"}
        </div>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Trạng thái",
      cell: ({ row }) => (
        <Badge 
          variant="secondary" 
          className={row.original.is_active 
            ? "text-[10px] px-1.5 h-5 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none font-bold uppercase tracking-wider" 
            : "text-[10px] px-1.5 h-5 bg-muted text-muted-foreground border-none font-bold uppercase tracking-wider"
          }
        >
          {row.original.is_active ? "Hoạt động" : "Ngừng bán"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                <DropdownMenuItem className="gap-2" asChild>
                  <Link href={`/app/purchases/new?supplierId=${row.original.id}`}>
                    <Truck className="w-4 h-4" /> Tạo đơn nhập hàng
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                  <ExternalLink className="w-4 h-4" /> Xem công nợ
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleToggleStatus(row.original)}>
                  {row.original.is_active ? "Ngừng hoạt động" : "Kích hoạt lại"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  setEditingSupplier(row.original);
                  setEditOpen(true);
                }}>
                  Chỉnh sửa
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive font-medium" 
                  onClick={() => {
                    setDeletingId(row.original.id);
                    setAlertOpen(true);
                  }}
                >
                  Xóa vĩnh viễn
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  useEffect(() => {
    loadSuppliers();
  }, []);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none tracking-tight">Nhà cung cấp</h1>
          <p className="text-muted-foreground text-sm">Quản lý các đối tác cung ứng hàng hóa cho cửa hàng.</p>
        </div>
        <AddSupplierDialog onShowSuccess={loadSuppliers} />
      </div>

      <div className="flex items-center gap-2 py-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Tìm theo tên nhà cung cấp..."
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
                    <span className="text-sm">Đ đang kết nối dữ liệu nhà cung cấp...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                    <Building2 className="w-12 h-12" />
                    <span className="text-sm">Chưa có nhà cung cấp nào được đăng ký.</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <EditSupplierDialog 
        supplier={editingSupplier} 
        open={editOpen} 
        onOpenChange={setEditOpen} 
        onShowSuccess={loadSuppliers} 
      />

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa nhà cung cấp?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa vĩnh viễn nhà cung cấp này. Bạn không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingId(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSupplier} className="bg-destructive hover:bg-destructive/90 text-white">
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
