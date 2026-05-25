"use client";

import React, { useState, useEffect } from "react";
import {
  UserCheck,
  MoreHorizontal,
  Loader2,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  ClipboardCheck,
  Printer,
  Trash2,
} from "lucide-react";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { posService } from "@/services/pos.service";
import { AddPayrollDialog } from "./_components/add-payroll-dialog";
import { EditPayrollDialog } from "./_components/edit-payroll-dialog";
import { ConfigBonusDialog } from "./_components/config-bonus-dialog";
import { SalaryAdvanceDialog } from "./_components/salary-advance-dialog";
import { format } from "date-fns";

export default function PayrollPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const loadData = async () => {
    setLoading(true);
    try {
      const payrollList = await posService.getPayroll(selectedMonth, selectedYear);
      setData(payrollList);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  const handleApprove = async (item: any) => {
    try {
      await posService.updatePayrollStatus(item.id, "approved");
      toast.success(`Đã duyệt bảng lương cho ${item.employee?.name || "nhân viên"}!`);
      loadData();
    } catch (error) {
      toast.error("Lỗi khi duyệt lương");
    }
  };

  const handlePay = async (item: any) => {
    try {
      await posService.updatePayrollStatus(item.id, "paid");
      toast.success(`Đã chi trả lương thành công cho ${item.employee?.name || "nhân viên"}!`);
      loadData();
    } catch (error) {
      toast.error("Lỗi khi thanh toán lương");
    }
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa phiếu lương của ${item.employee?.name || "nhân viên"} không?`)) return;
    try {
      await posService.deletePayroll(item.id);
      toast.success("Đã xóa phiếu lương thành công!");
      loadData();
    } catch (error) {
      toast.error("Lỗi khi xóa phiếu lương");
    }
  };

  const [printData, setPrintData] = useState<any>(null);

  const handlePrint = (item: any) => {
    setPrintData(item);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "employee",
      header: "Nhân viên",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50">
            <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm">{row.original.employee?.name || "Chưa có thông tin"}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
              {row.original.employee?.role || "Nhân viên"}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "base_salary",
      header: "Lương cơ bản",
      cell: ({ row }) => formatCurrency(row.getValue("base_salary")),
    },
    {
      accessorKey: "bonus",
      header: "Thưởng/Phụ cấp",
      cell: ({ row }) => {
        const bonus = Number(row.original.bonus || 0);
        const allowance = Number(row.original.allowance || 0);
        return formatCurrency(bonus + allowance);
      },
    },
    {
      accessorKey: "deduction",
      header: "Khấu trừ",
      cell: ({ row }) => (
        <span className={Number(row.getValue("deduction")) > 0 ? "text-red-500 font-medium" : ""}>
          {formatCurrency(row.getValue("deduction"))}
        </span>
      ),
    },
    {
      accessorKey: "final_salary",
      header: "Lương thực lĩnh",
      cell: ({ row }) => (
        <div className="font-black text-emerald-600 dark:text-emerald-400">
          {formatCurrency(row.getValue("final_salary"))}
        </div>
      ),
    },
    {
      accessorKey: "payment_status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const status = row.getValue("payment_status");
        const isPaid = status === "paid";
        const isApproved = status === "approved";
        return (
          <Badge
            variant="secondary"
            className={
              isPaid
                ? "gap-1 text-[10px] px-1.5 h-5 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none font-bold"
                : isApproved
                  ? "gap-1 text-[10px] px-1.5 h-5 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-none font-bold"
                  : "gap-1 text-[10px] px-1.5 h-5 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-none font-bold"
            }
          >
            {isPaid ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Đã chi
              </>
            ) : isApproved ? (
              <>
                <ClipboardCheck className="w-3 h-3 text-blue-500" /> Đã duyệt
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 text-amber-500" /> Chờ duyệt
              </>
            )}
          </Badge>
        );
      },
    },
    {
      accessorKey: "payment_date",
      header: "Ngày thanh toán",
      cell: ({ row }) => {
        const date = row.getValue("payment_date") as any;
        return date ? format(new Date(date), "dd/MM/yyyy") : "---";
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const status = row.original.payment_status;
        const isPaid = status === "paid";
        const isApproved = status === "approved";
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
              {status === "pending" && (
                <DropdownMenuItem className="gap-2 text-blue-600 font-bold" onClick={() => handleApprove(row.original)}>
                  <ClipboardCheck className="w-4 h-4" /> Duyệt bảng lương
                </DropdownMenuItem>
              )}
              {isApproved && (
                <DropdownMenuItem className="gap-2 text-emerald-600 font-bold" onClick={() => handlePay(row.original)}>
                  <CheckCircle2 className="w-4 h-4" /> Thanh toán lương
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="gap-2 font-medium" onClick={() => handlePrint(row.original)}>
                <Printer className="w-4 h-4" /> In phiếu lương
              </DropdownMenuItem>
              <EditPayrollDialog payroll={row.original} onShowSuccess={loadData} />
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive gap-2 font-medium"
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete(row.original);
                }}
              >
                <Trash2 className="w-4 h-4" /> Xóa phiếu lương
              </DropdownMenuItem>
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
  });

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-emerald-600">Bảng tính lương</h1>
          <p className="text-muted-foreground text-sm">
            Tính toán và quản lý chi phí tiền lương, thưởng phạt cho nhân sự.
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border">
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(Number(v))}>
              <SelectTrigger className="w-[110px] h-8 bg-transparent border-none shadow-none focus:ring-0 font-medium">
                <SelectValue placeholder="Tháng" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }).map((_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    Tháng {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="w-px h-4 bg-border"></div>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
              <SelectTrigger className="w-[90px] h-8 bg-transparent border-none shadow-none focus:ring-0 font-medium">
                <SelectValue placeholder="Năm" />
              </SelectTrigger>
              <SelectContent>
                {[0, 1, 2].map((offset) => {
                  const y = new Date().getFullYear() - offset;
                  return (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <SalaryAdvanceDialog />
            <ConfigBonusDialog />
            <AddPayrollDialog onShowSuccess={loadData} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border shadow-sm bg-card overflow-hidden mt-4">
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
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
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                    <span className="text-sm font-medium animate-pulse">Đang tải danh sách lương...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/30">
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
                    <UserCheck className="w-12 h-12" />
                    <span className="text-sm font-bold">Chưa có thông tin bảng lương nào được tạo.</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Hidden Print Container */}
      <div className="hidden print:block absolute top-0 left-0 w-full h-full bg-white p-8">
        {printData && (
          <div className="max-w-2xl mx-auto border-2 border-black p-8 rounded-lg">
            <div className="text-center mb-8 border-b-2 border-black pb-4">
              <h2 className="text-2xl font-black uppercase tracking-widest">Phiếu Lương Nhân Viên</h2>
              <p className="text-gray-600 mt-2 font-medium">
                Tháng {selectedMonth} / Năm {selectedYear}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-y-4 text-sm font-medium mb-8">
              <div className="text-gray-500">Họ và tên:</div>
              <div className="font-bold text-right text-base uppercase">{printData.employee?.name}</div>

              <div className="text-gray-500">Chức vụ:</div>
              <div className="font-bold text-right">{printData.employee?.role || "Nhân viên"}</div>

              <div className="text-gray-500">Ngày in phiếu:</div>
              <div className="font-bold text-right">{format(new Date(), "dd/MM/yyyy HH:mm")}</div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-8 border border-gray-200">
              <div className="flex justify-between items-center py-2 border-b border-gray-200 border-dashed">
                <span className="text-gray-600">Lương cơ bản:</span>
                <span className="font-bold">{formatCurrency(printData.base_salary)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200 border-dashed">
                <span className="text-gray-600">Thưởng doanh thu:</span>
                <span className="font-bold text-emerald-600">+{formatCurrency(printData.bonus)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200 border-dashed">
                <span className="text-gray-600">Phụ cấp khác:</span>
                <span className="font-bold">+{formatCurrency(printData.allowance)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Khấu trừ / Tạm ứng:</span>
                <span className="font-bold text-red-600">-{formatCurrency(printData.deduction)}</span>
              </div>
            </div>

            <div className="flex justify-between items-end border-t-2 border-black pt-4 mb-12">
              <div className="text-lg font-bold">Thực lĩnh:</div>
              <div className="text-3xl font-black tracking-tight">{formatCurrency(printData.final_salary)}</div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="font-bold mb-16">Người nhận</p>
                <p className="text-gray-400 italic text-xs">(Ký và ghi rõ họ tên)</p>
              </div>
              <div>
                <p className="font-bold mb-16">Quản lý / Giám đốc</p>
                <p className="text-gray-400 italic text-xs">(Ký và đóng dấu)</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
