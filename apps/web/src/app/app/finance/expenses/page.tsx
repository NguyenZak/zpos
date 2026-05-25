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
import {
  Calendar,
  Download,
  Edit2,
  Filter,
  Loader2,
  MoreHorizontal,
  Receipt,
  Search,
  Trash2,
  Printer,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exportToCSV } from "@/lib/export-utils";
import { posService } from "@/services/pos.service";

import { CategoryManagerDialog } from "../_components/category-manager-dialog";
import { AddExpenseDialog } from "./_components/add-expense-dialog";
import { EditExpenseDialog } from "./_components/edit-expense-dialog";

function numberToVietnameseWords(n: number): string {
  if (n === 0) return "Không đồng";
  const units = ["", " nghìn", " triệu", " tỷ", " nghìn tỷ", " triệu tỷ"];
  const digits = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];

  let result = "";
  let unitIndex = 0;
  let remaining = n;
  let isFirstGroup = true;

  while (remaining > 0) {
    const group = remaining % 1000;
    remaining = Math.floor(remaining / 1000);

    if (group > 0) {
      const hundred = Math.floor(group / 100);
      const ten = Math.floor((group % 100) / 10);
      const unit = group % 10;
      let res = "";

      if (hundred > 0 || !isFirstGroup) {
        res += digits[hundred] + " trăm ";
      }
      if (ten > 1) {
        res += digits[ten] + " mươi ";
        if (unit === 1) res += "mốt";
        else if (unit === 4) res += "tư";
        else if (unit === 5) res += "lăm";
        else if (unit > 0) res += digits[unit];
      } else if (ten === 1) {
        res += "mười ";
        if (unit === 5) res += "lăm";
        else if (unit > 0) res += digits[unit];
      } else if (ten === 0) {
        if (unit > 0 && (hundred > 0 || !isFirstGroup)) {
          res += "lẻ ";
        }
        if (unit > 0) {
          res += digits[unit];
        }
      }
      res = res.trim();
      result = res + units[unitIndex] + (result ? " " + result : "");
    }
    unitIndex++;
    isFirstGroup = false;
  }

  result = result.replace(/^không trăm (lẻ )?/, "");
  result = result.trim();
  result = result.charAt(0).toUpperCase() + result.slice(1);
  return result + " đồng";
}

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
  const [editExpense, setEditExpense] = useState<any | null>(null);
  const [printExpense, setPrintExpense] = useState<any | null>(null);

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
            <DropdownMenuItem className="gap-2 text-primary" onClick={() => setEditExpense(row.original)}>
              <Edit2 className="h-4 w-4" /> Sửa chi phí
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2" onClick={() => handlePrintReceipt(row.original)}>
              <Printer className="h-4 w-4" /> In phiếu chi
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

  const handlePrintReceipt = (expense: any) => {
    setPrintExpense(expense);
    setTimeout(() => {
      window.print();
    }, 100);
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
        <div className="flex items-center gap-2">
          <CategoryManagerDialog onCategoriesChange={loadData} />
          <AddExpenseDialog onShowSuccess={loadData} />
        </div>
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
      <EditExpenseDialog
        expense={editExpense}
        open={!!editExpense}
        onOpenChange={(val) => !val && setEditExpense(null)}
        onSuccess={loadData}
      />

      {/* Hidden Print Container */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page {
            size: A5; /* Allows user to choose portrait/landscape in print dialog and it will default to A5 */
            margin: 10mm;
          }
        }
      `,
        }}
      />
      <div
        className="hidden print:block absolute top-0 left-0 w-full bg-white"
        style={{ fontFamily: '"Times New Roman", Times, serif', color: "black" }}
      >
        {printExpense && (
          <div className="w-full">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-base font-bold uppercase tracking-tight">Hệ Thống ZPOS</h1>
                <p className="text-xs">Địa chỉ: ..............................................................</p>
                <p className="text-xs">Điện thoại: ...........................................................</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-sm">Mẫu số 02 - TT</p>
                <p className="text-[10px] italic">
                  (Ban hành theo Thông tư số 200/2014/TT-BTC <br />
                  Ngày 22/12/2014 của Bộ Tài chính)
                </p>
              </div>
            </div>

            <div className="text-center mb-6 relative">
              <h2 className="text-2xl font-black uppercase tracking-widest mb-1">Phiếu Chi</h2>
              <p className="italic text-xs">
                Ngày {format(new Date(printExpense.expense_date), "dd")} tháng{" "}
                {format(new Date(printExpense.expense_date), "MM")} năm{" "}
                {format(new Date(printExpense.expense_date), "yyyy")}
              </p>

              <div className="absolute top-0 right-0 text-right text-xs">
                <p>Quyển số: ...................</p>
                <p>
                  Số: <span className="font-semibold">{printExpense.id.slice(0, 8).toUpperCase()}</span>
                </p>
                <p>Nợ: ...........................</p>
                <p>Có: ...........................</p>
              </div>
            </div>

            <div className="space-y-3 text-sm mb-6">
              <div className="flex items-end">
                <span className="whitespace-nowrap font-medium pr-2">Họ và tên người nhận tiền:</span>
                <span className="flex-1 font-semibold border-b border-dotted border-gray-400 capitalize pb-0.5">
                  ......................................................................................................
                </span>
              </div>
              <div className="flex items-end">
                <span className="whitespace-nowrap font-medium pr-2">Địa chỉ:</span>
                <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5">
                  ......................................................................................................
                </span>
              </div>
              <div className="flex items-end">
                <span className="whitespace-nowrap font-medium pr-2">Lý do chi:</span>
                <span className="flex-1 font-bold text-base border-b border-dotted border-gray-400 pb-0.5">
                  {printExpense.title} {printExpense.category?.name ? `(${printExpense.category?.name})` : ""}
                </span>
              </div>
              <div className="flex flex-wrap md:flex-nowrap items-end gap-y-2">
                <span className="whitespace-nowrap font-medium pr-2">Số tiền:</span>
                <span className="font-black text-lg mr-4 pb-0.5">{formatCurrency(printExpense.amount || 0)}</span>
                <span className="italic pb-0.5 whitespace-nowrap">(Viết bằng chữ):</span>
                <span className="flex-1 font-bold text-base ml-2 border-b border-dotted border-gray-400 pb-0.5 min-w-[200px]">
                  {numberToVietnameseWords(printExpense.amount || 0)}
                </span>
              </div>
              <div className="flex items-end">
                <span className="whitespace-nowrap font-medium pr-2">Kèm theo:</span>
                <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5">
                  ................................................................................... chứng từ gốc.
                </span>
              </div>
            </div>

            <div className="flex justify-end text-xs italic mb-2">
              Ngày {format(new Date(), "dd")} tháng {format(new Date(), "MM")} năm {format(new Date(), "yyyy")}
            </div>

            <div className="grid grid-cols-5 gap-2 text-center text-sm mb-20">
              <div>
                <p className="font-bold">Giám đốc</p>
                <p className="italic text-[10px]">(Ký, họ tên, đóng dấu)</p>
              </div>
              <div>
                <p className="font-bold">Kế toán trưởng</p>
                <p className="italic text-[10px]">(Ký, họ tên)</p>
              </div>
              <div>
                <p className="font-bold">Thủ quỹ</p>
                <p className="italic text-[10px]">(Ký, họ tên)</p>
              </div>
              <div>
                <p className="font-bold text-xs">Người lập phiếu</p>
                <p className="italic text-[10px]">(Ký, họ tên)</p>
              </div>
              <div>
                <p className="font-bold">Người nhận tiền</p>
                <p className="italic text-[10px]">(Ký, họ tên)</p>
              </div>
            </div>

            <div className="pt-8 space-y-3 text-xs">
              <div className="flex items-end">
                <span className="whitespace-nowrap font-medium pr-2">Đã nhận đủ số tiền (viết bằng chữ):</span>
                <span className="flex-1 border-b border-dotted border-gray-400 font-bold text-sm pb-0.5">
                  {numberToVietnameseWords(printExpense.amount || 0)}
                </span>
              </div>
              <div className="flex items-end">
                <span className="whitespace-nowrap pr-2">+ Tỷ giá ngoại tệ (vàng bạc, đá quý):</span>
                <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5">
                  ......................................................................................................
                </span>
              </div>
              <div className="flex items-end">
                <span className="whitespace-nowrap pr-2">+ Số tiền quy đổi:</span>
                <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5">
                  ......................................................................................................
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
