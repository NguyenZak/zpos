"use client";

import { useCallback, useEffect, useState } from "react";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  type RowSelectionState,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { Activity, Calendar, Download, Loader2, MoreHorizontal, PauseCircle, PlayCircle, Trash2 } from "lucide-react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exportToCSV } from "@/lib/export-utils";
import { posService } from "@/services/pos.service";
import { CategoryManagerDialog } from "../_components/category-manager-dialog";
import { AddRecurringExpenseDialog } from "./_components/add-recurring-dialog";

export default function RecurringExpensesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [processing, setProcessing] = useState<"pause" | "activate" | "delete" | "process" | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const expenses = await posService.getRecurringExpenses();
      setData(expenses);
      setRowSelection({});
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleToggle = async (item: any) => {
    try {
      await posService.toggleRecurringExpenseStatus(item.id, item.status);
      toast.success(item.status === "active" ? "Đã tạm dừng" : "Đã kích hoạt lại");
      await loadData();
    } catch (_error) {
      toast.error("Lỗi khi cập nhật");
    }
  };

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
          aria-label="Chọn tất cả chi phí định kỳ"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={`Chọn chi phí định kỳ ${row.original.title}`}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: "Khoản chi định kỳ",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-100 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30">
            <Activity className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm">{row.getValue("title")}</span>
            <span className="font-bold text-[10px] text-muted-foreground uppercase tracking-tight">
              {row.original.category?.name} • {row.original.frequency}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Số tiền",
      cell: ({ row }) => <div className="font-black">{formatCurrency(row.getValue("amount"))}</div>,
    },
    {
      accessorKey: "next_due_date",
      header: "Ngày thu tiếp theo",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 font-medium text-sm">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          {format(new Date(row.getValue("next_due_date")), "dd/MM/yyyy")}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const isActive = row.getValue("status") === "active";
        return (
          <Badge
            variant="secondary"
            className={
              isActive
                ? "h-5 border-none bg-emerald-500/10 px-1.5 font-bold text-[10px] text-emerald-600 hover:bg-emerald-500/20"
                : "h-5 border-none bg-muted px-1.5 font-bold text-[10px] text-muted-foreground"
            }
          >
            {isActive ? "Đang chạy" : "Tạm dừng"}
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
            <DropdownMenuItem className="gap-2" onClick={() => handleToggle(row.original)}>
              {row.original.status === "active" ? (
                <>
                  <PauseCircle className="h-4 w-4" /> Tạm dừng
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4" /> Kích hoạt lại
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-destructive" onClick={() => setDeleteId(row.original.id)}>
              <Trash2 className="h-4 w-4" /> Xóa thiết lập
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
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    state: {
      rowSelection,
    },
  });

  const selectedRecurring = table.getSelectedRowModel().rows.map((row) => row.original);
  const selectedCount = selectedRecurring.length;
  const selectedTotal = selectedRecurring.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const exportRecurring = () => {
    if (selectedRecurring.length === 0) return;
    exportToCSV(
      selectedRecurring.map((item) => ({
        "Khoản chi": item.title,
        "Danh mục": item.category?.name || "",
        "Tần suất": item.frequency || "",
        "Ngày tiếp theo": item.next_due_date ? format(new Date(item.next_due_date), "dd/MM/yyyy") : "",
        "Số tiền": item.amount || 0,
        "Trạng thái": item.status || "",
      })),
      "chi_phi_dinh_ky_da_chon",
    );
    toast.success("Đã xuất CSV chi phí định kỳ");
  };

  const handleProcessDue = async () => {
    setProcessing("process");
    try {
      const processed = await posService.processDueRecurringExpenses();
      if (processed > 0) {
        toast.success(`Đã tự động tạo ${processed} khoản chi đến hạn`);
        await loadData();
      } else {
        toast.info("Không có khoản chi nào cần tạo tại thời điểm này");
      }
    } catch (_error) {
      toast.error("Lỗi khi thực thi chi phí định kỳ");
    } finally {
      setProcessing(null);
    }
  };

  const handleBulkStatus = async (nextStatus: "active" | "paused") => {
    if (selectedRecurring.length === 0) return;
    setProcessing(nextStatus === "active" ? "activate" : "pause");
    try {
      await Promise.all(
        selectedRecurring
          .filter((item) => item.status !== nextStatus)
          .map((item) => posService.toggleRecurringExpenseStatus(item.id, item.status)),
      );
      toast.success(
        nextStatus === "active" ? "Đã kích hoạt các thiết lập đã chọn" : "Đã tạm dừng các thiết lập đã chọn",
      );
      await loadData();
    } catch (_error) {
      toast.error("Lỗi khi cập nhật nhiều thiết lập");
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteRecurring = async () => {
    if (!deleteId) return;
    setProcessing("delete");
    try {
      await posService.deleteRecurringExpense(deleteId);
      toast.success("Đã xóa thiết lập chi phí định kỳ");
      setDeleteId(null);
      await loadData();
    } catch (_error) {
      toast.error("Lỗi khi xóa thiết lập");
    } finally {
      setProcessing(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRecurring.length === 0) return;
    setProcessing("delete");
    try {
      await Promise.all(selectedRecurring.map((item) => posService.deleteRecurringExpense(item.id)));
      toast.success("Đã xóa các thiết lập đã chọn", {
        description: `${selectedRecurring.length} thiết lập chi phí định kỳ đã được gỡ bỏ.`,
      });
      setBulkDeleteOpen(false);
      await loadData();
    } catch (_error) {
      toast.error("Lỗi khi xóa nhiều thiết lập");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="fade-in flex animate-in flex-col gap-4 duration-500">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-black text-3xl text-amber-600 tracking-tight">Chi phí định kỳ</h1>
          <p className="text-muted-foreground text-sm">Tự động hóa việc ghi nhận các khoản chi cố định hàng tháng.</p>
        </div>
        <div className="flex items-center gap-2">
          <CategoryManagerDialog onCategoriesChange={loadData} />
          <Button
            variant="outline"
            className="gap-2 border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
            onClick={handleProcessDue}
            disabled={processing === "process"}
          >
            {processing === "process" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PlayCircle className="h-4 w-4" />
            )}
            Thực thi chi phí đến hạn
          </Button>
          <AddRecurringExpenseDialog onShowSuccess={loadData} />
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="h-7 rounded-md px-2.5 font-bold">
              {selectedCount} thiết lập đã chọn
            </Badge>
            <span className="text-muted-foreground text-sm">
              Tổng kỳ: <span className="font-bold text-foreground">{formatCurrency(selectedTotal)}</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportRecurring}>
              <Download className="mr-2 h-4 w-4" />
              Xuất CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatus("active")}
              disabled={processing !== null}
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              Kích hoạt
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatus("paused")}
              disabled={processing !== null}
            >
              <PauseCircle className="mr-2 h-4 w-4" />
              Tạm dừng
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkDeleteOpen(true)}
              disabled={processing !== null}
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

      <div className="mt-4 overflow-hidden rounded-xl border bg-card shadow-sm">
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
                    <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                    <span className="animate-pulse font-medium text-sm">Đang tải lịch trình chi phí...</span>
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
                    <Activity className="h-12 w-12" />
                    <span className="font-bold text-sm">Chưa có lịch trình chi phí định kỳ nào.</span>
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
            <AlertDialogTitle>Xóa thiết lập chi phí định kỳ?</AlertDialogTitle>
            <AlertDialogDescription>
              Thiết lập này sẽ bị xóa và không còn tự động ghi nhận chi phí trong các kỳ tiếp theo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing !== null}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRecurring}
              disabled={processing !== null}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {processing === "delete" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa {selectedCount} thiết lập chi phí định kỳ?</AlertDialogTitle>
            <AlertDialogDescription>
              Các thiết lập đã chọn sẽ bị xóa và không còn tự động ghi nhận chi phí trong các kỳ tiếp theo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing !== null}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={processing !== null}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {processing === "delete" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
