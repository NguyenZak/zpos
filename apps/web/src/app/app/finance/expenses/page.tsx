"use client";

import { useCallback, useEffect, useState } from "react";

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
import { format } from "date-fns";
import { Calendar, Download, Filter, Loader2, MoreHorizontal, Receipt, Search, Trash2 } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exportToCSV } from "@/lib/export-utils";
import { posService } from "@/services/pos.service";

import { AddExpenseDialog } from "./_components/add-expense-dialog";

export default function ExpensesPage() {
  const [data, setData] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [expenses, cats] = await Promise.all([
        posService.getExpenses({ categoryId: categoryFilter }),
        posService.getExpenseCategories(),
      ]);
      setData(expenses);
      setCategories(cats);
      setRowSelection({});
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
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
          aria-label="Chọn tất cả chi phí trên trang"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={`Chọn chi phí ${row.original.title}`}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: "Tiêu đề chi phí",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30">
            <Receipt className="h-4 w-4 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm">{row.getValue("title")}</span>
            <span className="font-bold text-[10px] text-muted-foreground uppercase tracking-tight">
              {row.original.category?.name || "Chưa phân loại"}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "expense_date",
      header: "Ngày chi",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          {format(new Date(row.getValue("expense_date")), "dd/MM/yyyy")}
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Số tiền",
      cell: ({ row }) => (
        <div className="font-black text-red-600 dark:text-red-400">-{formatCurrency(row.getValue("amount"))}</div>
      ),
    },
    {
      accessorKey: "payment_method",
      header: "Thanh toán",
      cell: ({ row }) => {
        const methods: any = {
          cash: "Tiền mặt",
          bank_transfer: "Chuyển khoản",
          vietqr: "VietQR",
          card: "Thẻ",
        };
        return (
          <Badge variant="outline" className="font-medium text-[10px]">
            {methods[row.getValue("payment_method") as string] || row.getValue("payment_method")}
          </Badge>
        );
      },
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
            <DropdownMenuLabel>Hành động</DropdownMenuLabel>
            <DropdownMenuItem className="gap-2">
              <Download className="h-4 w-4" /> Tải chứng từ
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-destructive" onClick={() => setDeleteId(row.original.id)}>
              <Trash2 className="h-4 w-4" /> Xóa chi phí
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

  const selectedExpenses = table.getSelectedRowModel().rows.map((row) => row.original);
  const selectedCount = selectedExpenses.length;
  const selectedTotal = selectedExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  const exportExpenses = (expenses: any[], filename: string) => {
    if (expenses.length === 0) {
      toast.info("Không có chi phí để xuất");
      return;
    }
    exportToCSV(
      expenses.map((expense) => ({
        "Tiêu đề": expense.title,
        "Danh mục": expense.category?.name || "",
        "Ngày chi": format(new Date(expense.expense_date), "dd/MM/yyyy"),
        "Số tiền": expense.amount || 0,
        "Thanh toán": expense.payment_method || "",
        "Trạng thái": expense.status || "",
      })),
      filename,
    );
    toast.success("Đã xuất CSV chi phí");
  };

  const handleDeleteExpense = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await posService.deleteExpense(deleteId);
      toast.success("Đã xóa chi phí");
      setDeleteId(null);
      await loadData();
    } catch (_error) {
      toast.error("Lỗi khi xóa chi phí");
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDeleteExpenses = async () => {
    if (selectedExpenses.length === 0) return;
    setDeleting(true);
    try {
      await Promise.all(selectedExpenses.map((expense) => posService.deleteExpense(expense.id)));
      toast.success("Đã xóa các chi phí đã chọn", {
        description: `${selectedExpenses.length} khoản chi đã được gỡ bỏ.`,
      });
      setBulkDeleteOpen(false);
      await loadData();
    } catch (_error) {
      toast.error("Lỗi khi xóa nhiều chi phí");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fade-in flex animate-in flex-col gap-4 duration-500">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-black text-3xl tracking-tight">Chi phí vận hành</h1>
          <p className="text-muted-foreground text-sm">Quản lý các khoản chi phí không bao gồm giá vốn hàng bán.</p>
        </div>
        <AddExpenseDialog onShowSuccess={loadData} />
      </div>

      <div className="flex items-center gap-2 py-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tiêu đề chi phí..."
            value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("title")?.setFilterValue(event.target.value)}
            className="h-9 pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue placeholder="Tất cả danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả danh mục</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Bộ lọc
        </Button>
      </div>

      {selectedCount > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="h-7 rounded-md px-2.5 font-bold">
              {selectedCount} chi phí đã chọn
            </Badge>
            <span className="text-muted-foreground text-sm">
              Tổng chi: <span className="font-bold text-foreground">{formatCurrency(selectedTotal)}</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => exportExpenses(selectedExpenses, "chi_phi_da_chon")}>
              <Download className="mr-2 h-4 w-4" />
              Xuất CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkDeleteOpen(true)}
              disabled={deleting}
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
                  <TableHead
                    key={header.id}
                    className="font-bold text-[11px] text-muted-foreground uppercase tracking-wider"
                  >
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
                    <span className="animate-pulse font-medium text-sm">Đang truy xuất dữ liệu chi phí...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="hover:bg-muted/30">
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
                  <div className="flex flex-col items-center justify-center gap-2 opacity-30">
                    <Receipt className="h-12 w-12" />
                    <span className="font-bold text-sm">Chưa ghi nhận chi phí nào.</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa chi phí?</AlertDialogTitle>
            <AlertDialogDescription>
              Khoản chi này và giao dịch dòng tiền liên quan sẽ bị xóa. Bạn không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteExpense}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa {selectedCount} khoản chi?</AlertDialogTitle>
            <AlertDialogDescription>
              Các khoản chi đã chọn và giao dịch dòng tiền liên quan sẽ bị xóa. Bạn không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteExpenses}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
