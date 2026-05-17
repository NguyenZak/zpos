"use client";

import React, { useState, useEffect } from 'react';
import { 
  Activity,
  Calendar,
  MoreHorizontal,
  Loader2,
  Trash2,
  PauseCircle,
  PlayCircle
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
import { AddRecurringExpenseDialog } from './_components/add-recurring-dialog';
import { format } from 'date-fns';

export default function RecurringExpensesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const expenses = await posService.getRecurringExpenses();
      setData(expenses);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggle = async (item: any) => {
    try {
      await posService.toggleRecurringExpenseStatus(item.id, item.status);
      toast.success(item.status === 'active' ? "Đã tạm dừng" : "Đã kích hoạt lại");
      loadData();
    } catch (error) {
      toast.error("Lỗi khi cập nhật");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "title",
      header: "Khoản chi định kỳ",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center border border-amber-100 dark:border-amber-900/50">
            <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm">{row.getValue("title")}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
              {row.original.category?.name} • {row.original.frequency}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Số tiền",
      cell: ({ row }) => (
        <div className="font-black">
          {formatCurrency(row.getValue("amount"))}
        </div>
      ),
    },
    {
      accessorKey: "next_due_date",
      header: "Ngày thu tiếp theo",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm font-medium">
          <Calendar className="w-3 h-3 text-muted-foreground" />
          {format(new Date(row.getValue("next_due_date")), "dd/MM/yyyy")}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const isActive = row.getValue("status") === 'active';
        return (
          <Badge 
            variant="secondary"
            className={isActive 
              ? "text-[10px] px-1.5 h-5 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none font-bold" 
              : "text-[10px] px-1.5 h-5 bg-muted text-muted-foreground border-none font-bold"
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
              {row.original.status === 'active' ? (
                <>
                  <PauseCircle className="w-4 h-4" /> Tạm dừng
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4" /> Kích hoạt lại
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive gap-2">
              <Trash2 className="w-4 h-4" /> Xóa thiết lập
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
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
          <h1 className="text-3xl font-black tracking-tight text-amber-600">Chi phí định kỳ</h1>
          <p className="text-muted-foreground text-sm">Tự động hóa việc ghi nhận các khoản chi cố định hàng tháng.</p>
        </div>
        <AddRecurringExpenseDialog onShowSuccess={loadData} />
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
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                    <span className="text-sm font-medium animate-pulse">Đang tải lịch trình chi phí...</span>
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
                    <Activity className="w-12 h-12" />
                    <span className="text-sm font-bold">Chưa có lịch trình chi phí định kỳ nào.</span>
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
