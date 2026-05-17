"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MoreHorizontal, 
  Filter,
  Receipt,
  Loader2,
  Calendar,
  DollarSign,
  Trash2,
  Download
} from 'lucide-react';
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
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { posService } from '@/services/pos.service';
import { AddExpenseDialog } from './_components/add-expense-dialog';
import { format } from 'date-fns';

export default function ExpensesPage() {
  const [data, setData] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [categoryFilter, setCategoryFilter] = useState("all");

  const loadData = async () => {
    setLoading(true);
    try {
      const [expenses, cats] = await Promise.all([
        posService.getExpenses({ categoryId: categoryFilter }),
        posService.getExpenseCategories()
      ]);
      setData(expenses);
      setCategories(cats);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [categoryFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "title",
      header: "Tiêu đề chi phí",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center border border-red-100 dark:border-red-900/50">
            <Receipt className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm">{row.getValue("title")}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
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
          <Calendar className="w-3 h-3 text-muted-foreground" />
          {format(new Date(row.getValue("expense_date")), "dd/MM/yyyy")}
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Số tiền",
      cell: ({ row }) => (
        <div className="font-black text-red-600 dark:text-red-400">
          -{formatCurrency(row.getValue("amount"))}
        </div>
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
          card: "Thẻ"
        };
        return <Badge variant="outline" className="font-medium text-[10px]">{methods[row.getValue("payment_method") as string] || row.getValue("payment_method")}</Badge>;
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
              <Download className="w-4 h-4" /> Tải chứng từ
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive gap-2">
              <Trash2 className="w-4 h-4" /> Xóa chi phí
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

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
    <div className="flex flex-col gap-4 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight">Chi phí vận hành</h1>
          <p className="text-muted-foreground text-sm">Quản lý các khoản chi phí không bao gồm giá vốn hàng bán.</p>
        </div>
        <AddExpenseDialog onShowSuccess={loadData} />
      </div>

      <div className="flex items-center gap-2 py-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Tìm theo tiêu đề chi phí..."
            value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("title")?.setFilterValue(event.target.value)
            }
            className="pl-10 h-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Tất cả danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả danh mục</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Bộ lọc
        </Button>
      </div>

      <div className="rounded-xl border shadow-sm bg-card overflow-hidden">
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
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-sm font-medium animate-pulse">Đang truy xuất dữ liệu chi phí...</span>
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
                    <Receipt className="w-12 h-12" />
                    <span className="text-sm font-bold">Chưa ghi nhận chi phí nào.</span>
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
