"use client";

import { useCallback, useEffect, useState } from "react";

import Link from "next/link";

import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type RowSelectionState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Building2,
  ExternalLink,
  FileDown,
  Filter,
  Loader2,
  Mail,
  MoreHorizontal,
  Phone,
  Search,
  Trash2,
  Truck,
  User,
} from "lucide-react";
import { toast } from "sonner";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exportToCSV } from "@/lib/export-utils";
import { posService } from "@/services/pos.service";

import { AddSupplierDialog } from "./_components/add-supplier-dialog";
import { EditSupplierDialog } from "./_components/edit-supplier-dialog";

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
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [bulkAlertOpen, setBulkAlertOpen] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState<"activate" | "deactivate" | "delete" | null>(null);

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const suppliers = await posService.getSuppliers("");
      setData(suppliers);
      setRowSelection({});
    } catch (error) {
      console.error("Lỗi tải nhà cung cấp:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleToggleStatus = async (supplier: Supplier) => {
    try {
      await posService.updateSupplier(supplier.id, { is_active: !supplier.is_active });
      toast.success(supplier.is_active ? "Đã ngừng hoạt động nhà cung cấp" : "Đã kích hoạt lại nhà cung cấp");
      await loadSuppliers();
    } catch (_error) {
      toast.error("Lỗi khi cập nhật trạng thái");
    }
  };

  const handleDeleteSupplier = async () => {
    if (!deletingId) return;
    try {
      await posService.deleteSupplier(deletingId);
      toast.success("Đã xóa nhà cung cấp", {
        description: "Thông tin nhà cung cấp đã được gỡ bỏ.",
      });
      await loadSuppliers();
    } catch (_error) {
      toast.error("Lỗi khi xóa nhà cung cấp");
    } finally {
      setAlertOpen(false);
      setDeletingId(null);
    }
  };

  const columns: ColumnDef<Supplier>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? "indeterminate" : false
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Chọn tất cả nhà cung cấp trên trang"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={`Chọn nhà cung cấp ${row.original.name}`}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Nhà cung cấp",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/10 bg-primary/5">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-ink">{row.getValue("name")}</span>
            <div className="flex items-center gap-1 font-medium text-[10px] text-muted-foreground uppercase tracking-widest">
              <User className="h-2.5 w-2.5" />
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
        <div className="flex items-center gap-2 font-medium text-sm">
          <Phone className="h-3 w-3 text-ash" />
          {row.getValue("phone")}
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Mail className="h-3 w-3" />
          {row.getValue("email") || "---"}
        </div>
      ),
    },
    {
      accessorKey: "address",
      header: "Địa chỉ",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate text-ash text-xs">{row.getValue("address") || "---"}</div>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Trạng thái",
      cell: ({ row }) => (
        <Badge
          variant="secondary"
          className={
            row.original.is_active
              ? "h-5 border-none bg-emerald-500/10 px-1.5 font-bold text-[10px] text-emerald-600 uppercase tracking-wider hover:bg-emerald-500/20"
              : "h-5 border-none bg-muted px-1.5 font-bold text-[10px] text-muted-foreground uppercase tracking-wider"
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
                  <Truck className="h-4 w-4" /> Tạo đơn nhập hàng
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <ExternalLink className="h-4 w-4" /> Xem công nợ
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleToggleStatus(row.original)}>
                {row.original.is_active ? "Ngừng hoạt động" : "Kích hoạt lại"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setEditingSupplier(row.original);
                  setEditOpen(true);
                }}
              >
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem
                className="font-medium text-destructive"
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
    void loadSuppliers();
  }, [loadSuppliers]);

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.id,
    autoResetPageIndex: false,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  const selectedSuppliers = table.getSelectedRowModel().rows.map((row) => row.original);
  const selectedCount = selectedSuppliers.length;

  const handleExportSuppliers = () => {
    if (selectedSuppliers.length === 0) return;
    exportToCSV(
      selectedSuppliers.map((supplier) => ({
        "Nhà cung cấp": supplier.name,
        "Người liên hệ": supplier.contact_name || "",
        "Điện thoại": supplier.phone || "",
        Email: supplier.email || "",
        "Địa chỉ": supplier.address || "",
        "Trạng thái": supplier.is_active ? "Hoạt động" : "Ngừng hoạt động",
      })),
      "nha_cung_cap_da_chon",
    );
    toast.success("Đã xuất CSV nhà cung cấp");
  };

  const handleBulkStatus = async (isActive: boolean) => {
    if (selectedSuppliers.length === 0) return;
    setBulkProcessing(isActive ? "activate" : "deactivate");
    try {
      await Promise.all(
        selectedSuppliers.map((supplier) => posService.updateSupplier(supplier.id, { is_active: isActive })),
      );
      toast.success(isActive ? "Đã kích hoạt nhà cung cấp đã chọn" : "Đã ngừng hoạt động nhà cung cấp đã chọn");
      await loadSuppliers();
    } catch (_error) {
      toast.error("Lỗi khi cập nhật nhiều nhà cung cấp");
    } finally {
      setBulkProcessing(null);
    }
  };

  const handleBulkDeleteSuppliers = async () => {
    if (selectedSuppliers.length === 0) return;
    setBulkProcessing("delete");
    try {
      await Promise.all(selectedSuppliers.map((supplier) => posService.deleteSupplier(supplier.id)));
      toast.success("Đã xóa các nhà cung cấp đã chọn", {
        description: `${selectedSuppliers.length} nhà cung cấp đã được gỡ bỏ.`,
      });
      await loadSuppliers();
    } catch (_error) {
      toast.error("Lỗi khi xóa nhiều nhà cung cấp");
    } finally {
      setBulkProcessing(null);
      setBulkAlertOpen(false);
    }
  };

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
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên nhà cung cấp..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
            className="h-9 pl-10"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Bộ lọc
        </Button>
      </div>

      {selectedCount > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <Badge variant="secondary" className="h-7 w-fit rounded-md px-2.5 font-bold">
            {selectedCount} nhà cung cấp đã chọn
          </Badge>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportSuppliers}>
              <FileDown className="mr-2 h-4 w-4" />
              Xuất CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatus(true)}
              disabled={bulkProcessing !== null}
            >
              Kích hoạt
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatus(false)}
              disabled={bulkProcessing !== null}
            >
              Ngừng hoạt động
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkAlertOpen(true)}
              disabled={bulkProcessing !== null}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setRowSelection({})}>
              Bỏ chọn
            </Button>
          </div>
        </div>
      )}

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
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-sm">Đ đang kết nối dữ liệu nhà cung cấp...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                    <Building2 className="h-12 w-12" />
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
            <AlertDialogAction
              onClick={handleDeleteSupplier}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkAlertOpen} onOpenChange={setBulkAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa {selectedCount} nhà cung cấp?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa vĩnh viễn các nhà cung cấp đã chọn. Bạn không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkProcessing !== null}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteSuppliers}
              disabled={bulkProcessing !== null}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {bulkProcessing === "delete" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
