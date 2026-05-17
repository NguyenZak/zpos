"use client";

import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  MoreHorizontal, 
  Loader2,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { posService } from '@/services/pos.service';
import { AddPayrollDialog } from './_components/add-payroll-dialog';
import { format } from 'date-fns';

export default function PayrollPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const payrollList = await posService.getPayroll();
      setData(payrollList);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePay = async (item: any) => {
    try {
      await posService.updatePayrollStatus(item.id, 'paid');
      toast.success(`Đã chi trả lương thành công cho ${item.employee?.name || 'nhân viên'}!`);
      loadData();
    } catch (error) {
      toast.error("Lỗi khi thanh toán lương");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
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
        const isPaid = row.getValue("payment_status") === 'paid';
        return (
          <Badge 
            variant="secondary" 
            className={isPaid 
              ? "gap-1 text-[10px] px-1.5 h-5 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none font-bold" 
              : "gap-1 text-[10px] px-1.5 h-5 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-none font-bold"
            }
          >
            {isPaid ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Đã chi
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 text-amber-500" /> Chờ chi
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
        const isPaid = row.original.payment_status === 'paid';
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
              {!isPaid && (
                <DropdownMenuItem className="gap-2 text-emerald-600 font-bold" onClick={() => handlePay(row.original)}>
                  <CheckCircle2 className="w-4 h-4" /> Thanh toán lương
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive gap-2">
                Xóa phiếu lương
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
          <p className="text-muted-foreground text-sm">Tính toán và quản lý chi phí tiền lương, thưởng phạt cho nhân sự.</p>
        </div>
        <AddPayrollDialog onShowSuccess={loadData} />
      </div>

      <div className="rounded-xl border shadow-sm bg-card overflow-hidden mt-4">
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
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
    </div>
  );
}
