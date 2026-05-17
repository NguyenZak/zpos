"use client";

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  FileDown, 
  MoreHorizontal, 
  Eye, 
  Truck,
  Loader2,
  Calendar,
  ClipboardList
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { posService } from "@/services/pos.service";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';

export default function PurchasesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPurchases = async () => {
    setLoading(true);
    try {
      const purchases = await posService.getPurchaseOrders();
      setData(purchases);
    } catch (error) {
      console.error("Lỗi tải danh sách nhập hàng:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchases();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-slate-100 text-slate-700">Nháp</Badge>;
      case 'ordered':
        return <Badge variant="outline" className="bg-blue-100 text-blue-700">Đã đặt hàng</Badge>;
      case 'receiving':
        return <Badge variant="outline" className="bg-amber-100 text-amber-700">Đang nhập kho</Badge>;
      case 'received':
        return <Badge variant="outline" className="bg-green-100 text-green-700">Đã nhập kho</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-700">Đã hủy</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none tracking-tight font-black">Nhập hàng</h1>
          <p className="text-muted-foreground text-sm">Quản lý nhập kho và nhập hàng từ nhà cung cấp.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <FileDown className="mr-2 h-4 w-4" />
            Xuất Excel
          </Button>
          <Button size="sm" asChild>
            <Link href="/purchases/new">
              <Plus className="mr-2 h-4 w-4" />
              Tạo đơn nhập
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 py-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Tìm theo mã đơn, nhà cung cấp..."
            className="pl-10 h-9"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Lọc đơn
        </Button>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[150px]">Mã đơn</TableHead>
              <TableHead className="w-[180px]">Ngày nhập</TableHead>
              <TableHead>Nhà cung cấp</TableHead>
              <TableHead className="text-right">Tổng tiền</TableHead>
              <TableHead className="text-center">Trạng thái</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Đang tải danh sách...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length > 0 ? (
              data.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-bold">{item.code}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{format(new Date(item.created_at), "dd/MM/yyyy")}</span>
                      <span className="text-[10px] text-muted-foreground">{format(new Date(item.created_at), "HH:mm")}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Truck className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium">{item.supplier?.name || "N/A"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-black text-primary">
                    {formatCurrency(item.total_amount)}
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(item.status)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/purchases/${item.id}`} className="flex items-center gap-2">
                            <Eye className="w-4 h-4" /> Chi tiết
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>In đơn nhập</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Hủy đơn</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                    <ClipboardList className="w-12 h-12" />
                    <span className="text-sm">Chưa có đơn nhập hàng nào.</span>
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
