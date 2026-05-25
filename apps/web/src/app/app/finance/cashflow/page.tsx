"use client";

import React, { useState, useEffect } from "react";
import { Search, ArrowUpCircle, ArrowDownCircle, Loader2, Calendar, Wallet, ArrowRightLeft } from "lucide-react";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { posService } from "@/services/pos.service";
import { format } from "date-fns";

export default function CashflowPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const transactions = await posService.getCashflowTransactions();
      setData(transactions);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "transaction_date",
      header: "Thời gian",
      cell: ({ row }) => (
        <div className="flex flex-col text-xs">
          <span className="font-bold">{format(new Date(row.getValue("transaction_date")), "dd/MM/yyyy")}</span>
          <span className="text-muted-foreground">{format(new Date(row.getValue("transaction_date")), "HH:mm")}</span>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Loại",
      cell: ({ row }) => {
        const type = row.getValue("type") as string;
        return (
          <div className="flex items-center gap-2">
            {type === "inflow" ? (
              <ArrowUpCircle className="w-4 h-4 text-emerald-500" />
            ) : (
              <ArrowDownCircle className="w-4 h-4 text-red-500" />
            )}
            <Badge
              variant={type === "inflow" ? "secondary" : "destructive"}
              className={
                type === "inflow"
                  ? "text-[10px] px-1.5 h-4 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none font-bold"
                  : "text-[10px] px-1.5 h-4 font-bold"
              }
            >
              {type === "inflow" ? "THU" : "CHI"}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: "Phân loại",
      cell: ({ row }) => {
        const categories: any = {
          sale: "Bán hàng",
          expense: "Chi phí",
          salary: "Lương",
          purchase: "Nhập hàng",
          other_income: "Thu khác",
          other_expense: "Chi khác",
        };
        return (
          <span className="text-sm font-medium">
            {categories[row.getValue("category") as string] || row.getValue("category")}
          </span>
        );
      },
    },
    {
      accessorKey: "note",
      header: "Nội dung",
      cell: ({ row }) => <div className="max-w-[300px] truncate text-sm">{row.getValue("note") || "---"}</div>,
    },
    {
      accessorKey: "amount",
      header: "Số tiền",
      cell: ({ row }) => (
        <div
          className={`font-black ${row.original.type === "inflow" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
        >
          {row.original.type === "inflow" ? "+" : "-"}
          {formatCurrency(row.getValue("amount"))}
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalIn = data.filter((d) => d.type === "inflow").reduce((acc, d) => acc + Number(d.amount), 0);
  const totalOut = data.filter((d) => d.type === "outflow").reduce((acc, d) => acc + Number(d.amount), 0);
  const balance = totalIn - totalOut;

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Wallet className="w-8 h-8 text-primary" />
            Dòng tiền (Cashflow)
          </h1>
          <p className="text-muted-foreground text-sm">Nhật ký biến động dòng tiền thực tế tại cửa hàng.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Tháng này
          </Button>
          <Button size="sm" className="gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            Điều chuyển quỹ
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
        <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
          <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
            Tổng thu
          </p>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">+{formatCurrency(totalIn)}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-xl border border-red-100 dark:border-red-900/50">
          <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">Tổng chi</p>
          <p className="text-2xl font-black text-red-700 dark:text-red-300">-{formatCurrency(totalOut)}</p>
        </div>
        <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Số dư (Net Cash)</p>
          <p className="text-2xl font-black text-primary">{formatCurrency(balance)}</p>
        </div>
      </div>

      <div className="rounded-xl border shadow-sm bg-card overflow-hidden mt-2">
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
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-sm font-medium animate-pulse">Đang truy xuất nhật ký dòng tiền...</span>
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
                    <ArrowRightLeft className="w-12 h-12" />
                    <span className="text-sm font-bold">Chưa có giao dịch dòng tiền nào.</span>
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
