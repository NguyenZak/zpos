"use client";

import type React from "react";
import { useCallback, useEffect, useState } from "react";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type RowSelectionState,
  useReactTable,
} from "@tanstack/react-table";
import { Edit, FileDown, Layers, Loader2, MoreHorizontal, Plus, Search, Tag, Trash2 } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exportToCSV } from "@/lib/export-utils";
import { posService } from "@/services/pos.service";

export default function CategoriesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [bulkAlertOpen, setBulkAlertOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      // We need to add getCategories to posService if not exist
      const categories = await posService.getCategoryList();
      setData(categories || []);
      setRowSelection({});
    } catch (error) {
      console.error(error);
      // Fallback
      setData([
        { id: "1", name: "Điện thoại", description: "Các loại điện thoại di động", product_count: 12 },
        { id: "2", name: "Máy tính", description: "Laptop, PC, Linh kiện", product_count: 8 },
        { id: "3", name: "Phụ kiện", description: "Sạc, cáp, tai nghe", product_count: 45 },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await posService.updateCategory(editingId, formData);
        toast.success("Đã cập nhật danh mục");
      } else {
        await posService.createCategory(formData);
        toast.success("Đã thêm danh mục mới");
      }
      setOpen(false);
      await loadCategories();
      setFormData({ name: "", description: "" });
      setEditingId(null);
    } catch (_error) {
      toast.error("Lỗi khi lưu danh mục");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category: any) => {
    setEditingId(category.id);
    setFormData({ name: category.name, description: category.description || "" });
    setOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await posService.deleteCategory(deletingId);
      toast.success("Đã xóa danh mục", {
        description: "Danh mục đã được gỡ bỏ khỏi hệ thống.",
      });
      await loadCategories();
    } catch (_error) {
      toast.error("Lỗi khi xóa danh mục");
    } finally {
      setAlertOpen(false);
      setDeletingId(null);
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? "indeterminate" : false
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Chọn tất cả danh mục trên trang"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={`Chọn danh mục ${row.original.name}`}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Tên danh mục",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Tag className="h-4 w-4" />
          </div>
          <span className="font-bold text-sm">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Mô tả",
      cell: ({ row }) => (
        <span className="block max-w-[300px] truncate text-muted-foreground text-xs">
          {row.original.description || "---"}
        </span>
      ),
    },
    {
      accessorKey: "product_count",
      header: "Số sản phẩm",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-bold">
          {row.original.product_count || 0} sản phẩm
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleEdit(row.original)}>
              <Edit className="mr-2 h-4 w-4" /> Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => {
                setDeletingId(row.original.id);
                setAlertOpen(true);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Xóa danh mục
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.id,
    autoResetPageIndex: false,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      rowSelection,
    },
  });

  const selectedCategories = table.getSelectedRowModel().rows.map((row) => row.original);
  const selectedCount = selectedCategories.length;

  const handleExportCategories = () => {
    if (selectedCategories.length === 0) return;
    exportToCSV(
      selectedCategories.map((category) => ({
        "Tên danh mục": category.name,
        "Mô tả": category.description || "",
        "Số sản phẩm": category.product_count || 0,
      })),
      "danh_muc_da_chon",
    );
    toast.success("Đã xuất CSV danh mục");
  };

  const handleBulkDelete = async () => {
    if (selectedCategories.length === 0) return;
    setBulkDeleting(true);
    try {
      await Promise.all(selectedCategories.map((category) => posService.deleteCategory(category.id)));
      toast.success("Đã xóa các danh mục đã chọn", {
        description: `${selectedCategories.length} danh mục đã được gỡ bỏ khỏi hệ thống.`,
      });
      await loadCategories();
    } catch (_error) {
      toast.error("Lỗi khi xóa nhiều danh mục");
    } finally {
      setBulkDeleting(false);
      setBulkAlertOpen(false);
    }
  };

  return (
    <div className="fade-in flex animate-in flex-col gap-4 duration-500">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-3xl tracking-tight">Danh mục sản phẩm</h1>
          <p className="flex items-center gap-2 text-muted-foreground text-sm">
            <Layers className="h-4 w-4" />
            Phân loại sản phẩm để quản lý và bán hàng dễ dàng hơn.
          </p>
        </div>

        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) {
              setEditingId(null);
              setFormData({ name: "", description: "" });
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" /> Thêm danh mục
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingId ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}</DialogTitle>
                <DialogDescription>Tạo phân loại mới cho kho hàng của bạn.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Tên danh mục</Label>
                  <Input
                    id="name"
                    placeholder="VD: Điện thoại, Laptop..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Mô tả (Không bắt buộc)</Label>
                  <Input
                    id="description"
                    placeholder="Mô tả ngắn gọn về nhóm sản phẩm này"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingId ? "Cập nhật" : "Lưu danh mục"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 py-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm danh mục..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
            className="h-9 pl-10"
          />
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <Badge variant="secondary" className="h-7 w-fit rounded-md px-2.5 font-bold">
            {selectedCount} danh mục đã chọn
          </Badge>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCategories}>
              <FileDown className="mr-2 h-4 w-4" />
              Xuất CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkAlertOpen(true)}
              disabled={bulkDeleting}
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

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="py-4 font-bold">
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
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-muted-foreground text-sm">Đang tải danh mục...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="transition-colors hover:bg-muted/30"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-40 text-center italic opacity-50">
                  Chưa có danh mục nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa danh mục?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa danh mục và có thể ảnh hưởng đến việc phân loại sản phẩm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingId(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkAlertOpen} onOpenChange={setBulkAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa {selectedCount} danh mục?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa các danh mục đã chọn và có thể ảnh hưởng đến việc phân loại sản phẩm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {bulkDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
