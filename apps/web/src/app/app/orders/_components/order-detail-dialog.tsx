"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, ShoppingBag, User, Calendar, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface OrderDetailDialogProps {
  order: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrint: () => void;
}

export function OrderDetailDialog({ order, open, onOpenChange, onPrint }: OrderDetailDialogProps) {
  if (!order) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const date = new Date(order.created_at);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto rounded-lg shadow-2xl">
        <DialogHeader className="border-b pb-4">
          <div className="flex flex-col gap-1.5 text-left">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                Chi tiết đơn hàng <span className="text-primary font-black">#{order.order_number}</span>
              </DialogTitle>
              <Badge className={
                order.status === 'completed' 
                  ? 'bg-green-500 hover:bg-green-600 text-white font-semibold' 
                  : order.status === 'cancelled' 
                  ? 'bg-red-500 hover:bg-red-600 text-white font-semibold' 
                  : 'bg-yellow-500 hover:bg-yellow-600 font-semibold'
              }>
                {order.status === 'completed' ? 'Hoàn tất' : order.status === 'cancelled' ? 'Đã hủy' : 'Đang xử lý'}
              </Badge>
            </div>
            <DialogDescription className="flex flex-wrap items-center gap-4 text-xs mt-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                {format(date, "dd MMMM yyyy, HH:mm", { locale: vi })}
              </span>
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                Thanh toán: <span className="font-semibold uppercase text-primary">
                  {order.payment_method === 'cash' ? 'Tiền mặt' : order.payment_method === 'card' ? 'Thẻ' : 'Chuyển khoản'}
                </span>
              </span>
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Customer Info */}
        <div className="py-4 border-b">
          <h3 className="text-sm font-bold text-muted-foreground flex items-center gap-2 mb-3">
            <User className="w-4 h-4" /> Thông tin khách hàng
          </h3>
          <div className="p-3.5 rounded-xl bg-muted/40 border flex flex-col gap-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tên khách hàng:</span>
              <span className="font-bold">{order.customer_name || "Khách lẻ"}</span>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="py-4">
          <h3 className="text-sm font-bold text-muted-foreground flex items-center gap-2 mb-3">
            <ShoppingBag className="w-4 h-4" /> Danh sách sản phẩm mua
          </h3>
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="p-3">Sản phẩm</th>
                  <th className="p-3 text-center">SL</th>
                  <th className="p-3 text-right">Đơn giá</th>
                  <th className="p-3 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(order.order_items || []).map((item: any, index: number) => {
                  const prodName = item.variant?.product?.name || "Sản phẩm";
                  const variantName = item.variant?.name && item.variant.name !== 'Default' ? ` (${item.variant.name})` : '';
                  return (
                    <tr key={index} className="hover:bg-muted/10">
                      <td className="p-3 font-semibold text-foreground">
                        {prodName}
                        {variantName && <span className="block text-xs font-normal text-muted-foreground mt-0.5">{variantName}</span>}
                      </td>
                      <td className="p-3 text-center font-bold text-muted-foreground">{item.quantity}</td>
                      <td className="p-3 text-right font-medium">{formatCurrency(item.unit_price)}</td>
                      <td className="p-3 text-right font-bold text-primary">{formatCurrency(item.total_price)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoice Summary */}
        <div className="py-4 border-t space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Tạm tính:</span>
            <span>{formatCurrency(order.total_amount)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Giảm giá:</span>
            <span>{formatCurrency(0)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Thuế (VAT):</span>
            <span>{formatCurrency(0)}</span>
          </div>
          <div className="flex justify-between font-black text-lg border-t pt-3.5 text-foreground">
            <span>TỔNG THANH TOÁN:</span>
            <span className="text-primary font-black text-xl">{formatCurrency(order.total_amount)}</span>
          </div>
        </div>

        <DialogFooter className="border-t pt-4 flex gap-2">
          <Button variant="outline" className="gap-2 font-bold" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          <Button className="gap-2 font-bold bg-primary hover:bg-primary/90 text-white" onClick={onPrint}>
            <Printer className="w-4 h-4" /> In hóa đơn
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
