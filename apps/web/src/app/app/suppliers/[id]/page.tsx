"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Truck, 
  DollarSign, 
  History,
  Loader2,
  Calendar,
  CreditCard
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { posService } from "@/services/pos.service";
import { toast } from "sonner";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function SupplierDetailPage() {
  const { id } = useParams();
  const [supplier, setSupplier] = useState<any>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sData, pData] = await Promise.all([
        posService.getSuppliers(""), // Simplified, should have getSupplierById
        posService.getPurchaseOrders() // Should filter by supplier_id
      ]);
      
      const foundSupplier = sData.find((s: any) => s.id === id);
      setSupplier(foundSupplier);
      
      // Filter purchases for this supplier
      const supplierPurchases = pData.filter((p: any) => p.supplier_id === id);
      setPurchases(supplierPurchases);
    } catch (error) {
      toast.error("Lỗi khi tải thông tin nhà cung cấp");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const totalDebt = purchases.reduce((acc, p) => acc + (p.total_amount - (p.paid_amount || 0)), 0);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[400px] gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-muted-foreground animate-pulse">Đang tải hồ sơ đối tác...</p>
    </div>
  );

  if (!supplier) return (
    <div className="flex flex-col items-center justify-center h-[400px] gap-4">
      <Building2 className="w-12 h-12 text-destructive opacity-50" />
      <p className="text-muted-foreground">Không tìm thấy nhà cung cấp này.</p>
      <Button asChild><Link href="/app/suppliers">Quay lại danh sách</Link></Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/app/suppliers">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight">{supplier.name}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <History className="w-4 h-4" />
              Đối tác từ: {format(new Date(supplier.created_at || Date.now()), "MM/yyyy")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" asChild>
            <Link href={`/app/purchases/new?supplierId=${supplier.id}`}>
              <Truck className="mr-2 h-4 w-4" /> Tạo đơn nhập
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card className="border-none shadow-sm bg-card/50 overflow-hidden">
            <CardHeader className="bg-primary/5 pb-6">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Thông tin liên hệ
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-muted rounded-lg"><Phone className="w-4 h-4 text-primary" /></div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Số điện thoại</span>
                  <span className="text-sm font-medium">{supplier.phone}</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-muted rounded-lg"><Mail className="w-4 h-4 text-primary" /></div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Email</span>
                  <span className="text-sm font-medium">{supplier.email || "Chưa cập nhật"}</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-muted rounded-lg"><MapPin className="w-4 h-4 text-primary" /></div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Địa chỉ</span>
                  <span className="text-sm font-medium">{supplier.address || "Chưa cập nhật"}</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-muted rounded-lg"><CreditCard className="w-4 h-4 text-primary" /></div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Công nợ hiện tại</span>
                  <span className="text-lg font-black text-destructive">{formatCurrency(totalDebt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="border-none shadow-sm bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Lịch sử nhập hàng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Mã đơn</TableHead>
                      <TableHead>Ngày nhập</TableHead>
                      <TableHead className="text-right">Tổng tiền</TableHead>
                      <TableHead className="text-center">Trạng thái</TableHead>
                      <TableHead className="text-right">Còn nợ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.length > 0 ? purchases.map((item) => (
                      <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50" onClick={() => window.location.href=`/app/purchases/${item.id}`}>
                        <TableCell className="font-bold">{item.code}</TableCell>
                        <TableCell>{format(new Date(item.created_at), "dd/MM/yyyy")}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.total_amount)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-[10px]">
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-destructive">
                          {formatCurrency(item.total_amount - (item.paid_amount || 0))}
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                          Chưa có lịch sử giao dịch.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
